const fs = require('fs-extra');
const ytdl = require('@distube/ytdl-core');
const Youtube = require('youtube-search-api');
const axios = require('axios');
const path = require('path');

const convertHMS = (value) => new Date(value * 1000).toISOString().slice(11, 19);
const ITAG = 140;

const downloadMusicFromYoutube = async (link, filePath, itag = 140) => {
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
        
        if (!format) throw new Error('Không tìm thấy định dạng âm thanh phù hợp');

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
                if (err.statusCode === 403) {
                    reject(new Error('Không thể tải video này do hạn chế của YouTube. Vui lòng thử video khác.'));
                } else {
                    reject(err);
                }
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
        if (error.statusCode === 403) {
            throw new Error('Không thể tải video này do hạn chế của YouTube. Vui lòng thử video khác.');
        }
        console.error('Lỗi tải nhạc:', error);
        throw error;
    }
};

module.exports = {
    name: "sing",
    info: "Tìm kiếm và tải nhạc từ YouTube",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ["music", "download"],
    usages: "<từ khóa> hoặc <link YouTube>",
    cooldowns: 10,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        let filePath = path.resolve(__dirname, 'cache', `sing-${senderID}.mp3`);

        if (target.length < 1) {
            return api.sendMessage("❯ Vui lòng nhập từ khóa tìm kiếm hoặc liên kết YouTube!", threadID, messageID);
        }

        const keywordSearch = target.join(" ");

        try {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error("Error cleaning up file:", err);
               
                    const timestamp = Date.now();
                    filePath = path.resolve(__dirname, 'cache', `sing-${senderID}-${timestamp}.mp3`);
                }
            }

            if (target[0]?.startsWith("https://")) {
                const findingMessage = await api.sendMessage(`🔍 | Đang xử lý yêu cầu...`, threadID, messageID);
                
                try {
                    const { data, info } = await downloadMusicFromYoutube(target[0], filePath);
                    if (!fs.existsSync(data)) throw new Error('Tải nhạc thất bại');

                    const stats = fs.statSync(data);
                    if (stats.size < 1024) throw new Error('File nhạc không hợp lệ');

                    const body = `🎵 Tiêu đề: ${info.title}\n⏱️ Thời lượng: ${convertHMS(info.dur)}\n⏱️ Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây`;

                    await api.editMessage(`⌛ | Đang gửi bài hát...`, findingMessage.messageID, threadID);

                    return api.sendMessage(
                        { 
                            body,
                            attachment: fs.createReadStream(data)
                        },
                        threadID,
                        (err) => {
                            if (err) console.error(err);
                            fs.unlinkSync(data);
                        },
                        messageID
                    );
                } catch (e) {
                    console.error("Lỗi xử lý:", e);
                    return api.sendMessage(`⚠️ Lỗi: ${e.message}`, threadID, messageID);
                }
            } else {
                const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${keywordSearch}"...`, threadID, messageID);

                const results = await Youtube.GetListByKeyword(keywordSearch, false, 3);
                if (!results?.items?.length) throw new Error('Không tìm thấy bài hát');

                const video = results.items[0];
                const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

                await api.editMessage(`⏳ | Đang tải: "${video.title}"...`, findingMessage.messageID, threadID);

                const { data, info } = await downloadMusicFromYoutube(videoUrl, filePath);
                if (!fs.existsSync(data)) throw new Error('Tải nhạc thất bại');

                const body = `🎵 Tiêu đề: ${info.title}\n⏱️ Thời lượng: ${convertHMS(info.dur)}`;

                return api.sendMessage(
                    { 
                        body,
                        attachment: fs.createReadStream(data)
                    },
                    threadID,
                    (err) => {
                        if (err) console.error(err);
                        fs.unlinkSync(data);
                    },
                    messageID
                );
            }
        } catch (error) {
            console.error("Lỗi:", error);
            let errorMessage = error.message;
            if (error.code === 'EPERM') {
                errorMessage = 'Không thể truy cập file. Vui lòng thử lại sau hoặc kiểm tra quyền truy cập thư mục.';
            }
            return api.sendMessage(`❌ Lỗi: ${errorMessage}`, threadID, messageID);
        }
    }
};
