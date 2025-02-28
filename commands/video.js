const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

module.exports = {
    name: "video",
    usedby: 0,
    category: "Media",
    info: "Tải video từ Youtube",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 10,

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!global.videoCache || !global.videoCache[threadID]) return;
        
        const input = body.toLowerCase().trim();
        const { videos, searchMessageID } = global.videoCache[threadID];
        const choice = parseInt(input);

        if (isNaN(choice) || choice < 1 || choice > 6) {
            return api.sendMessage("Vui lòng chọn số từ 1 đến 6", threadID, messageID);
        }

        const video = videos[choice - 1];
        const findingMessage = await api.sendMessage(`⏳ | Đang tải xuống: "${video.title}"...`, threadID, messageID);
        const outputPath = path.resolve(__dirname, 'cache', `video_${Date.now()}.mp4`);

        try {
            const videoInfo = await ytdl.getInfo(video.url);
            const likes = videoInfo.videoDetails.likes || 'Ẩn';
            const views = videoInfo.videoDetails.viewCount || '0';

            await new Promise((resolve, reject) => {
                ytdl(video.url, {
                    quality: '18',
                    filter: format => format.container === 'mp4'
                })
                .pipe(fs.createWriteStream(outputPath))
                .on('finish', resolve)
                .on('error', reject);
            });

            const stats = fs.statSync(outputPath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            if (fileSizeInMB > 25) {
                fs.unlinkSync(outputPath);
                await api.editMessage(`❌ | Video quá lớn (${fileSizeInMB.toFixed(2)}MB). Giới hạn là 25MB.`, findingMessage.messageID, threadID);
            } else {
                await api.sendMessage({
                    body: `🎥 Video: ${video.title}\n⏱️ Thời lượng: ${video.duration}\n👍 Lượt thích: ${likes.toLocaleString()}\n👁️ Lượt xem: ${parseInt(views).toLocaleString()}`,
                    attachment: fs.createReadStream(outputPath)
                }, threadID, () => {
                    api.unsendMessage(findingMessage.messageID);
                    api.unsendMessage(searchMessageID); 
                    fs.unlinkSync(outputPath);
                });
            }
            delete global.videoCache[threadID];
        } catch (error) {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            await api.editMessage(`❌ | Lỗi khi tải video: ${error.message}`, findingMessage.messageID, threadID);
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        if (!target[0]) {
            return api.sendMessage(`❌ Vui lòng nhập tên video!`, threadID);
        }

        try {
            const videoQuery = target.join(" ");
            const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${videoQuery}". Vui lòng chờ...`, threadID);

            const searchResults = await yts(videoQuery);
            const videos = searchResults.videos.slice(0, 6);

            if (!videos.length) {
                return api.editMessage(`❌ | Không tìm thấy video: "${videoQuery}"`, findingMessage.messageID, threadID);
            }

            const body = "🎥 Kết quả tìm kiếm:\n\n" + 
                videos.map((video, index) => 
                    `${index + 1}. ${video.title}\n└── 👤 ${video.author.name}\n└── ⏱️ ${video.duration.timestamp}\n\n`
                ).join("") + 
                "💡 Reply số từ 1-6 để chọn video";

            const msg = await api.sendMessage(body, threadID, messageID);

            global.videoCache = global.videoCache || {};
            global.videoCache[threadID] = {
                videos,
                searchMessageID: msg.messageID 
            };

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: event.senderID
            });

        } catch (error) {
            await api.sendMessage(`❌ | Lỗi: ${error.message}`, threadID);
        }
    }
};
