const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');
const Youtube = require('youtube-search-api');
const path = require('path');
const axios = require('axios');

const cookies = JSON.parse(fs.readFileSync('./cookies.json'));
const agent = ytdl.createAgent(cookies);

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
    let filePath = basePath;
    let counter = 0;
    while (true) {
        try {
        
            if (fs.existsSync(filePath)) {
                await fs.access(filePath, fs.constants.W_OK);
                await fs.unlink(filePath);
            }
            
            await fs.writeFile(filePath, '');
            await fs.unlink(filePath);
            return filePath;
        } catch (err) {
            counter++;
            filePath = `${basePath.replace('.mp3', '')}_${counter}.mp3`;
            if (counter > 5) throw new Error('Không thể tạo file tạm thời');
        }
    }
};

const downloadMusicFromYoutube = async (link, filePath, retryCount = 0) => {
    try {
        const cacheDir = path.dirname(filePath);
        await fs.ensureDir(cacheDir);
        filePath = await getAvailableFilePath(filePath);

        const data = await ytdl.getInfo(link, {
            agent,
            playerClients: ["WEB_CREATOR", "IOS", "ANDROID"],
            requestOptions: {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'User-Agent': userAgents[retryCount % userAgents.length]
                }
            }
        });

        const formats = ytdl.filterFormats(data.formats, 'audioonly');
        let format = formats.find(f => f.itag === 140) || 
                    formats.find(f => f.itag === 251) || 
                    formats.find(f => f.itag === 250) ||
                    formats.find(f => f.itag === 249) ||
                    formats.find(f => f.audioQuality === 'AUDIO_QUALITY_MEDIUM') ||
                    formats[0];

        if (!format && retryCount < 3) {
            return downloadMusicFromYoutube(link, filePath, retryCount + 1);
        }
        if (!format) throw new Error('Không thể tải bài hát này do bị giới hạn!');

        const result = {
            title: data.videoDetails.title,
            dur: Number(data.videoDetails.lengthSeconds),
            timestart: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            const stream = ytdl(link, { 
                format: format,
                agent,
                playerClients: ["WEB_CREATOR", "IOS", "ANDROID"],
                requestOptions: {
                    headers: {
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'User-Agent': userAgents[retryCount % userAgents.length]
                    }
                },
                highWaterMark: 1<<25
            });

            writeStream.on('error', async (err) => {
                try {
                    stream.destroy();
                    if (fs.existsSync(filePath)) {
                        await fs.unlink(filePath);
                    }
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
                reject(err);
            });

            stream.on('error', async (err) => {
                try {
                    writeStream.end();
                    if (fs.existsSync(filePath)) {
                        await fs.unlink(filePath);
                    }
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
                
                if (retryCount < 3) {
                    downloadMusicFromYoutube(link, filePath, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('Không thể tải bài hát này do bị giới hạn!'));
                }
            });

            stream.pipe(writeStream)
                .on('finish', () => {
                    resolve({
                        data: filePath,
                        info: result,
                    });
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
            return downloadMusicFromYoutube(link, filePath, retryCount + 1);
        }
        throw new Error('Không thể tải bài hát này do bị giới hạn!');
    }
};

module.exports = {
    name: "music",
    usedby: 0,
    dmUser: false,
    category: "Giải Trí",
    dev: "HNT",
    nickName: ["music", "play"],
    info: "Phát nhạc từ YouTube (Nhập tên bài hát)",
    onPrefix: true,
    cooldowns: 5,

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

        const selectedSong = songList[choice - 1];
        const basePath = path.resolve(__dirname, 'cache', `music-${senderID}.mp3`);
        let messagesToDelete = [];

        try {
            const loadingMsg = await api.sendMessage("⏳ Đang tải bài hát...", threadID, messageID);
            messagesToDelete.push(loadingMsg.messageID);

            const filePath = await getAvailableFilePath(basePath);

            const { data, info } = await downloadMusicFromYoutube(selectedSong.url, filePath);
            
            if (!fs.existsSync(data)) throw new Error('RESTRICTED');

            const stats = fs.statSync(data);
            if (stats.size < 1024) throw new Error('RESTRICTED');

            const body = `🎵 Tiêu đề: ${info.title}\n⏱️ Thời lượng: ${convertHMS(info.dur)}\n⏱️ Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây`;

            const resultMsg = await api.sendMessage(
                { 
                    body,
                    attachment: fs.createReadStream(data)
                },
                threadID,
                async (err) => {
                    try {
                        if (fs.existsSync(data)) {
                            await fs.unlink(data);
                        }
                    } catch (e) {
                        console.error('Cleanup error:', e);
                    }
                },
                messageID
            );

            messagesToDelete.push(resultMsg.messageID);
            
            delete global.music[threadID];

            setTimeout(() => {
                messagesToDelete.forEach(id => api.unsendMessage(id));
            }, 5000);

        } catch (error) {
            console.error("Lỗi:", error);
            const errorMsg = await api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
            messagesToDelete.push(errorMsg.messageID);

            setTimeout(() => {
                messagesToDelete.forEach(id => api.unsendMessage(id));
            }, 30000);

            delete global.music[threadID];
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