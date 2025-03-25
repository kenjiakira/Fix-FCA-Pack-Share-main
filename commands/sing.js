const fs = require('fs-extra');
const { getDownloadDetails } = require('youtube-downloader-cc-api');
const Youtube = require('youtube-search-api');
const path = require('path');
const axios = require('axios');


const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

const convertHMS = (value) => {
    if (!value) return "N/A";
    const duration = Number(value);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getAvailableFilePath = async (basePath) => {
    try {
        const cacheDir = path.dirname(basePath);
        await fs.ensureDir(cacheDir);
        
        const fileName = `music-${Date.now()}-${Math.floor(Math.random() * 10000)}.mp3`;
        const filePath = path.join(cacheDir, fileName);
        
        if (fs.existsSync(filePath)) {
            await fs.unlink(filePath);
        }
        
        return filePath;
    } catch (err) {
        console.error("Lỗi khi tạo đường dẫn file:", err);
        throw new Error('FILE_PATH_ERROR');
    }
};
const downloadMusicFromYoutube = async (link, filePath, retryCount = 0) => {
    try {
        const cacheDir = path.dirname(filePath);
        await fs.ensureDir(cacheDir);
        filePath = await getAvailableFilePath(filePath);

        console.log(`Đang tải bài hát từ: ${link}`);
        
        // Sử dụng Downloader CC API để lấy thông tin và link download
        const response = await getDownloadDetails(link, "mp3", "stream");
        
        if (!response || !response.download) {
            throw new Error('DOWNLOAD_LINK_NOT_FOUND');
        }

        // Tải file từ link download
        const download = await axios({
            method: 'GET',
            url: response.download,
            responseType: 'stream',
            timeout: 30000,
            headers: {
                'User-Agent': userAgents[retryCount % userAgents.length]
            }
        });

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            
            download.data.pipe(writeStream);

            writeStream.on('finish', () => {
                const result = {
                    data: filePath,
                    info: {
                        title: response.title,
                        dur: 0, // API không cung cấp duration
                        timestart: Date.now()
                    }
                };
                resolve(result);
            });

            writeStream.on('error', (err) => {
                console.error("Lỗi ghi file:", err);
                reject(new Error('FILE_WRITE_ERROR'));
            });

            download.data.on('error', (err) => {
                console.error("Lỗi download:", err);
                writeStream.end();
                reject(new Error('DOWNLOAD_ERROR'));
            });
        });

    } catch (error) {
        console.error('Lỗi tải nhạc:', error);
        
        if (fs.existsSync(filePath)) {
            try {
                await fs.unlink(filePath);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        }
        
        if (retryCount < 3) {
            console.log(`Thử lại lần ${retryCount + 1}...`);
            return downloadMusicFromYoutube(link, filePath, retryCount + 1);
        }
        
        throw new Error('Không thể tải bài hát này, vui lòng thử bài khác!');
    }
};

module.exports = {
    name: "sing",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    category: "Media",
    nickName: ["sing", "play"],
    info: "Phát nhạc từ YouTube (Nhập tên bài hát)",
    onPrefix: true,
    cooldowns: 5,


// Sửa phần onReply để xử lý tin nhắn tốt hơn

onReply: async function({ event, api }) {
    const { threadID, messageID, senderID } = event;
    const input = event.body.toLowerCase().trim();

    if (!global.music) global.music = {};
    if (!global.music[threadID]) return;

    const songList = global.music[threadID];
    const choice = parseInt(input);

    if (isNaN(choice) || choice < 1 || choice > 6) {
        return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
    }

    // Đánh dấu đã xử lý ngay lập tức để tránh xử lý trùng lặp
    const processingList = global.processingMusic = global.processingMusic || {};
    if (processingList[threadID]) {
        return api.sendMessage("⏳ Đang xử lý bài hát khác, vui lòng đợi...", threadID, messageID);
    }
    processingList[threadID] = true;

    // Mảng các ID tin nhắn cần xóa sau khi xử lý
    let messagesToDelete = [];
    let cleanupNeeded = true;
    let filePath = null;
    
    try {
        // Gửi thông báo đang tải
        const loadingMsg = await api.sendMessage("⏳ Đang tải bài hát...", threadID, messageID);
        messagesToDelete.push(loadingMsg.messageID);

        const selectedSong = songList[choice - 1];
        const cacheDir = path.resolve(__dirname, 'cache');
        
        // Đảm bảo thư mục cache tồn tại
        await fs.ensureDir(cacheDir);
        
        // Đặt tên file duy nhất theo timestamp
        filePath = path.join(cacheDir, `music-${senderID}-${Date.now()}.mp3`);
        console.log(`Đường dẫn file: ${filePath}`);

        // Tải nhạc từ YouTube
        const { data, info } = await downloadMusicFromYoutube(selectedSong.url, filePath);
        
        // Kiểm tra file tải về
        if (!fs.existsSync(data)) {
            throw new Error('FILE_NOT_FOUND');
        }
        
        const stats = await fs.stat(data);
        console.log(`File kích thước: ${stats.size} bytes`);
        
        if (stats.size < 1024) {
            throw new Error('FILE_TOO_SMALL');
        }

        // Thông báo thành công
        const updateMsg = await api.sendMessage(
            `✅ Đã tải xong, đang gửi bài hát "${info.title}"...`,
            threadID, 
            loadingMsg.messageID
        );
        messagesToDelete.push(updateMsg.messageID);

        // Chuẩn bị nội dung tin nhắn
        const body = `🎵 Tiêu đề: ${info.title}\n⏱️ Thời lượng: ${convertHMS(info.dur)}\n⏱️ Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây`;
        
        // Đánh dấu không cần dọn dẹp file
        cleanupNeeded = false;

        // Gửi file âm thanh
        const sendResult = await new Promise((resolve, reject) => {
            // Tạo stream cho file
            const fileStream = fs.createReadStream(data);
            
            // Gửi file
            api.sendMessage(
                { 
                    body: body,
                    attachment: fileStream
                },
                threadID,
                (err, info) => {
                    if (err) {
                        console.error("Lỗi gửi file:", err);
                        return reject(err);
                    }
                    
                    // Đợi 10 giây rồi mới xóa file
                    setTimeout(async () => {
                        try {
                            if (fs.existsSync(data)) {
                                await fs.unlink(data);
                                console.log(`Đã xóa file: ${data}`);
                            }
                        } catch (e) {
                            console.error('Lỗi xóa file:', e);
                        }
                    }, 10000);
                    
                    resolve(info);
                },
                messageID
            );
        });
        
        // Thành công - Không xóa tin nhắn chứa file nhạc
        console.log("Đã gửi file nhạc thành công");
        
        // Xóa danh sách nhạc đã chọn để không xử lý lại
        delete global.music[threadID];
        
        // Xóa các tin nhắn tạm thời NGOẠI TRỪ tin nhắn chính
        setTimeout(() => {
            messagesToDelete.forEach(id => {
                try {
                    api.unsendMessage(id);
                } catch (e) {
                    console.error('Lỗi khi xóa tin nhắn:', e);
                }
            });
        }, 5000);

    } catch (error) {
        console.error("Lỗi trong onReply:", error);
        let errorMessage = '❌ Đã xảy ra lỗi không xác định';
        
        if (error.message === 'VIDEO_RESTRICTED' || error.message === 'AGE_RESTRICTED') {
            errorMessage = '❌ Không thể tải bài hát này do nội dung bị hạn chế!';
        } else if (error.message === 'FILE_NOT_FOUND' || error.code === 'ENOENT') {
            errorMessage = '❌ Không thể tạo file nhạc, vui lòng thử lại!';
        } else if (error.message === 'FILE_TOO_SMALL') {
            errorMessage = '❌ File tải về không hợp lệ!';
        } else {
            errorMessage = `❌ Lỗi: ${error.message || error}`;
        }

        const errorMsg = await api.sendMessage(errorMessage, threadID, messageID);
        messagesToDelete.push(errorMsg.messageID);
        
        // Xóa các tin nhắn tạm thời sau thời gian dài hơn
        setTimeout(() => {
            messagesToDelete.forEach(id => {
                try {
                    api.unsendMessage(id);
                } catch (e) {
                    console.error('Lỗi khi xóa tin nhắn:', e);
                }
            });
        }, 10000);
        
        // Xóa danh sách nhạc khi gặp lỗi
        delete global.music[threadID];
        
    } finally {
        // Đánh dấu đã xử lý xong
        if (processingList[threadID]) {
            delete processingList[threadID];
        }
        
        // Đảm bảo dọn dẹp file nếu cần
        if (cleanupNeeded && filePath && fs.existsSync(filePath)) {
            try {
                await fs.unlink(filePath);
                console.log(`File đã xóa trong finally: ${filePath}`);
            } catch (e) {
                console.error('Lỗi xóa file trong finally:', e);
            }
        }
    }
},

    onLaunch: async function({ event, api }) {
        const { threadID, messageID } = event;
        const input = event.body.trim().split(" ").slice(1).join(" ");
        let messagesToDelete = [];

        if (!input) {
            const errorMsg = await api.sendMessage("Vui lòng nhập tên bài hát cần tìm!", threadID, messageID);
            messagesToDelete.push(errorMsg.messageID);
            setTimeout(() => {
                messagesToDelete.forEach(id => api.unsendMessage(id));
            }, 30000);
            return;
        }

        try {
            const searchMsg = await api.sendMessage(`🔍 Đang tìm "${input}"...`, threadID, messageID);
            messagesToDelete.push(searchMsg.messageID);

            const results = await Youtube.GetListByKeyword(input, false, 6);
            if (!results?.items?.length) {
                throw new Error('Không tìm thấy bài hát');
            }

            const songs = await Promise.all(results.items.map(async item => {
                return {
                    title: item.title,
                    url: `https://www.youtube.com/watch?v=${item.id}`,
                    channel: item.channelTitle,
                    duration: "N/A" // API mới không cung cấp duration
                };
            }));

            const body = "🎵 Kết quả tìm kiếm:\n\n" + 
                songs.map((song, index) => 
                    `${index + 1}. ${song.title}\n└── 🎤 ${song.channel}\n└── ⏱️ ${song.duration}\n\n`
                ).join("") + 
                "💡 Reply số từ 1-6 để chọn bài hát";

            const resultMsg = await api.sendMessage(body, threadID, searchMsg.messageID);
            messagesToDelete.push(resultMsg.messageID);

            global.music = global.music || {};
            global.music[threadID] = songs;

            global.client.onReply.push({
                name: this.name,
                messageID: resultMsg.messageID,
                author: event.senderID
            });
        } catch (error) {
            const errorMsg = await api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
            messagesToDelete.push(errorMsg.messageID);
        } finally {
            
            setTimeout(() => {
                messagesToDelete.forEach(id => api.unsendMessage(id));
            }, 30000);
        }
    }
};