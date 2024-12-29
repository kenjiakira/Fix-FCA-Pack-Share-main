const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

module.exports = {
    name: "video",
    usedby: 0,
    info: "Tải video từ Youtube",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        if (!target[0]) {
            return api.sendMessage(`❌ Vui lòng nhập tên video!`, event.threadID);
        }

        try {
            const videoQuery = target.join(" ");
            const findingMessage = await api.sendMessage(`🔍 | Đang tìm "${videoQuery}". Vui lòng chờ...`, event.threadID);

            const searchResults = await yts(videoQuery);
            const video = searchResults.videos[0];

            if (!video) {
                return api.editMessage(`❌ | Không tìm thấy video: "${videoQuery}"`, findingMessage.messageID, event.threadID);
            }

            const videoInfo = await ytdl.getInfo(video.url);
            const likes = videoInfo.videoDetails.likes || 'Ẩn';
            const views = videoInfo.videoDetails.viewCount || '0';
            
            await api.editMessage(`⏳ | Đang tải xuống: "${video.title}"...`, findingMessage.messageID, event.threadID);

            const outputPath = path.resolve(__dirname, 'cache', `video_${Date.now()}.mp4`);

            try {
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
                    await api.editMessage(`❌ | Video quá lớn (${fileSizeInMB.toFixed(2)}MB). Giới hạn là 25MB.`, findingMessage.messageID, event.threadID);
                } else {
                    await api.sendMessage({
                        body: `🎥 Video: ${video.title}\n⏱️ Thời lượng: ${video.duration.timestamp}\n👍 Lượt thích: ${likes.toLocaleString()}\n👁️ Lượt xem: ${parseInt(views).toLocaleString()}`,
                        attachment: fs.createReadStream(outputPath)
                    }, event.threadID, () => {
                        api.unsendMessage(findingMessage.messageID);
                        fs.unlinkSync(outputPath);
                    });
                }
            } catch (error) {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                await api.editMessage(`❌ | Lỗi khi tải video: ${error.message}`, findingMessage.messageID, event.threadID);
            }
        } catch (error) {
            await api.sendMessage(`❌ | Lỗi: ${error.message}`, event.threadID);
        }
    }
};
