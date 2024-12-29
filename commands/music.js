const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');
const Youtube = require('youtube-search-api');
const path = require('path');
const axios = require('axios');

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

const downloadMusicFromYoutube = async (link, filePath) => {
    try {
        const cacheDir = path.dirname(filePath);
        await fs.ensureDir(cacheDir);

        const data = await ytdl.getInfo(link, {
            headers: {
                'Cookie': '',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
        });

        const formats = ytdl.filterFormats(data.formats, 'audioonly');
        let format = formats.find(f => f.itag === 140); 
        
        if (!format) {
            format = formats.find(f => f.audioQuality === 'AUDIO_QUALITY_MEDIUM');
        }
        
        if (!format) throw new Error('RESTRICTED');

        const result = {
            title: data.videoDetails.title,
            dur: Number(data.videoDetails.lengthSeconds),
            timestart: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const stream = ytdl(link, { 
                format: format,
                requestOptions: {
                    headers: {
                        'Cookie': '',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
                    }
                },
                highWaterMark: 1<<25
            });

            stream.on('error', (err) => {
                reject(new Error('RESTRICTED'));
            });

            stream.pipe(fs.createWriteStream(filePath))
                .on('finish', () => {
                    resolve({
                        data: filePath,
                        info: result,
                    });
                })
                .on('error', reject);
        });
    } catch (error) {
        console.error('Lỗi tải nhạc:', error);
        throw new Error('RESTRICTED');
    }
};

module.exports = {
    name: "music",
    usedby: 0,
    dmUser: false,
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
        const filePath = path.resolve(__dirname, 'cache', `music-${senderID}.mp3`);

        try {
            const loadingMsg = await api.sendMessage("⏳ Đang tải bài hát...", threadID, messageID);
            
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error("Lỗi xóa file cũ:", err);
                    filePath = path.resolve(__dirname, 'cache', `music-${senderID}-${Date.now()}.mp3`);
                }
            }

            try {
                const { data, info } = await downloadMusicFromYoutube(selectedSong.url, filePath);
                
                if (!fs.existsSync(data)) throw new Error('RESTRICTED');
                
                const stats = fs.statSync(data);
                if (stats.size < 1024) throw new Error('RESTRICTED');

                const body = `🎵 Tiêu đề: ${info.title}\n⏱️ Thời lượng: ${convertHMS(info.dur)}\n⏱️ Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây`;

                await api.sendMessage(
                    { 
                        body,
                        attachment: fs.createReadStream(data)
                    },
                    threadID,
                    async (err) => {
                        if (err) console.error(err);
                        fs.unlinkSync(data);
                        await api.unsendMessage(loadingMsg.messageID);
                    },
                    messageID
                );
                
                delete global.music[threadID];

            } catch (error) {
                if (error.message === 'RESTRICTED') {
                    await api.unsendMessage(loadingMsg.messageID);
                    const retryMsg = "⚠️ Bài hát này bị hạn chế truy cập.\nVui lòng reply số khác để chọn bài hát khác.";
                    const newMsg = await api.sendMessage(retryMsg, threadID, messageID);
                    
                    // Update the message ID for the reply handler
                    global.client.onReply = global.client.onReply.filter(r => r.messageID !== messageID);
                    global.client.onReply.push({
                        name: this.name,
                        messageID: newMsg.messageID,
                        author: senderID
                    });
                } else {
                    throw error;
                }
            }

        } catch (error) {
            console.error("Lỗi:", error);
            api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
            delete global.music[threadID];
        }
    },

    onLaunch: async function({ event, api }) {
        const { threadID, messageID } = event;
        const input = event.body.trim().split(" ").slice(1).join(" ");

        if (!input) {
            return api.sendMessage("Vui lòng nhập tên bài hát cần tìm!", threadID, messageID);
        }

        try {
            const searchMsg = await api.sendMessage(`🔍 Đang tìm "${input}"...`, threadID, messageID);

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

            let message = "🎵 Kết quả tìm kiếm:\n\n";
            songs.forEach((song, index) => {
                message += `${index + 1}. ${song.title}\n└── 🎤 ${song.channel}\n└── ⏱️ ${song.duration}\n\n`;
            });
            message += "💡 Reply số từ 1-6 để chọn bài hát";

            const resultMsg = await api.sendMessage(message, threadID, searchMsg.messageID);
            
            await api.unsendMessage(searchMsg.messageID);

            global.music = global.music || {};
            global.music[threadID] = songs;

            global.client.onReply.push({
                name: this.name,
                messageID: resultMsg.messageID,
                author: event.senderID
            });
        } catch (error) {
            api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
