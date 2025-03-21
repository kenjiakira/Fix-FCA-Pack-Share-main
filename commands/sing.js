const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');
const Youtube = require('youtube-search-api');
const path = require('path');
const axios = require('axios');

const cookiesPath = path.resolve(__dirname, '../cookies.json');
console.log(`Đường dẫn cookies: ${cookiesPath}`);

let agent;
try {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    // Tạo agent chỉ một lần từ cookies, đúng theo hướng dẫn
    agent = ytdl.createAgent(cookies);
    console.log("Tạo agent thành công với cookies");
} catch (error) {
    console.error("Lỗi đọc cookies:", error);
    // Backup plan: Tạo proxy agent nếu không có cookies
    console.log("Sử dụng proxy agent thay thế");
    try {
        agent = ytdl.createProxyAgent({ uri: "http://localhost:8118" });
    } catch (proxyError) {
        console.error("Không thể tạo proxy agent:", proxyError);
        // Fallback to no agent
        agent = null;
    }
}


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

        // Cấu hình theo đúng documentation
        const options = {
            // Sử dụng agent đã được tạo từ cookies ở trên
            agent,
            // KHÔNG nên cài đặt cookies ở đây khi đã dùng agent
            requestOptions: {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
                    'User-Agent': userAgents[retryCount % userAgents.length]
                },
                timeout: 30000 
            },
            // Thêm nhiều client để tăng khả năng thành công
            playerClients: [
                "ANDROID_MUSIC", "ANDROID_CREATOR", "ANDROID", 
                "IOS_MUSIC", "IOS_CREATOR", "IOS",  
                "WEB_CREATOR", "WEB_MUSIC", "WEB", "MWEB",
                "TV_EMBEDDED", "TV"
            ],
            quality: 'highestaudio',
            // Tránh bị chặn theo khu vực
            geoBypass: true
        };

        // Bước 1: Lấy thông tin video
        console.log(`Đang lấy thông tin video: ${link}`);
        const data = await ytdl.getInfo(link, options);

        // Kiểm tra video bị hạn chế độ tuổi
        if (data.videoDetails.age_restricted) {
            console.log("Video bị hạn chế độ tuổi, thử cách khác...");
            throw new Error('AGE_RESTRICTED');
        }

        // Bước 2: Lọc và chọn định dạng audio
        const formats = ytdl.filterFormats(data.formats, 'audioonly');
        if (formats.length === 0) {
            console.log("Không tìm thấy định dạng audio, thử tìm với bất kỳ định dạng nào có audio");
            // Thử tìm bất kỳ định dạng nào có audio
            formats.push(...data.formats.filter(f => f.hasAudio));
        }

        if (formats.length === 0) {
            throw new Error('NO_AUDIO_FORMATS');
        }

        console.log(`Tìm thấy ${formats.length} định dạng audio`);
        
        // Theo thứ tự ưu tiên
        const formatPriorities = [140, 251, 250, 249, 171, 18, 22];
        let format = null;
        
        // Thử theo itag
        for (const itag of formatPriorities) {
            format = formats.find(f => f.itag === itag);
            if (format) {
                console.log(`Sử dụng format với itag: ${itag}`);
                break;
            }
        }
        
        // Thử theo chất lượng nếu không có itag phù hợp
        if (!format) {
            format = formats.find(f => f.audioQuality === 'AUDIO_QUALITY_MEDIUM') || 
                    formats.find(f => f.hasAudio) ||
                    formats[0];
            
            console.log(`Sử dụng format dự phòng: ${format?.itag || 'unknown'}`);
        }

        if (!format) {
            if (retryCount < 3) {
                console.log("Không tìm thấy format phù hợp, thử lại...");
                return downloadMusicFromYoutube(link, filePath, retryCount + 1);
            }
            throw new Error('RESTRICTED');
        }

        const result = {
            title: data.videoDetails.title,
            dur: Number(data.videoDetails.lengthSeconds),
            timestart: Date.now(),
        };

        // Bước 3: Tạo stream với định dạng đã chọn
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            
            console.log(`Bắt đầu tải: ${data.videoDetails.title}`);
            const stream = ytdl(link, { 
                ...options,
                format: format,
                highWaterMark: 1<<25,
                timeout: 60000
            });

            // Xử lý lỗi stream
            stream.on('error', async (err) => {
                console.error("Stream error:", err);
                
                // Xử lý lỗi rate limit (429)
                if (err.message && (err.message.includes('429') || err.message.includes('Too Many Requests'))) {
                    console.log("YouTube đang rate limit, đợi và thử lại sau...");
                    
                    // Tăng thời gian chờ theo số lần thử
                    const waitTime = (retryCount + 1) * 5000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                try {
                    writeStream.end();
                    if (fs.existsSync(filePath)) {
                        await fs.unlink(filePath);
                    }
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
                
                if (retryCount < 3) {
                    console.log(`Thử lại lần ${retryCount + 1}...`);
                    try {
                        const result = await downloadMusicFromYoutube(link, filePath, retryCount + 1);
                        resolve(result);
                    } catch (retryError) {
                        reject(retryError);
                    }
                } else {
                    reject(new Error('Không thể tải bài hát này sau nhiều lần thử!'));
                }
            });

            // Ghi dữ liệu
            stream.pipe(writeStream)
                .on('error', (err) => {
                    console.error("Lỗi ghi file:", err);
                    reject(new Error('FILE_WRITE_ERROR'));
                })
                .on('finish', async () => {
                    try {
                        if (!fs.existsSync(filePath)) {
                            reject(new Error('FILE_NOT_FOUND_AFTER_WRITE'));
                            return;
                        }
                        
                        const stats = fs.statSync(filePath);
                        console.log(`Tải thành công, kích thước: ${stats.size} bytes`);
                        
                        if (stats.size < 1024) {
                            reject(new Error('FILE_TOO_SMALL'));
                            return;
                        }
                        
                        resolve({
                            data: filePath,
                            info: result,
                        });
                    } catch (err) {
                        console.error("Lỗi kiểm tra file sau khi ghi:", err);
                        reject(new Error('FILE_VALIDATION_ERROR'));
                    }
                });
        });
    } catch (error) {
        console.error('Lỗi tải nhạc:', error);
        
        // Xử lý lỗi cụ thể
        if (error.message?.includes('429')) {
            console.log("YouTube rate limit detected, đợi và thử lại");
            if (retryCount < 5) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 10000));
                return downloadMusicFromYoutube(link, filePath, retryCount + 1);
            }
        }
        
        // Dọn dẹp
        if (fs.existsSync(filePath)) {
            try {
                await fs.unlink(filePath);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        }
        
        // Thử lại cho các lỗi khác
        if (retryCount < 3 && error.message !== 'VIDEO_RESTRICTED' && error.message !== 'AGE_RESTRICTED') {
            return downloadMusicFromYoutube(link, filePath, retryCount + 1);
        }
        
        // Trả về thông báo lỗi phù hợp
        throw error.message === 'VIDEO_RESTRICTED' || error.message === 'AGE_RESTRICTED'
            ? new Error('Không thể tải bài hát này do nội dung bị hạn chế độ tuổi hoặc riêng tư!')
            : new Error('Không thể tải bài hát này, vui lòng thử bài khác!');
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
                try {
                    const videoInfo = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${item.id}`);
                    return {
                        title: item.title,
                        url: `https://www.youtube.com/watch?v=${item.id}`,
                        channel: item.channelTitle,
                        duration: convertHMS(videoInfo.videoDetails.lengthSeconds)
                    };
                } catch (error) {
                    return {
                        title: item.title,
                        url: `https://www.youtube.com/watch?v=${item.id}`,
                        channel: item.channelTitle,
                        duration: "N/A"
                    };
                }
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