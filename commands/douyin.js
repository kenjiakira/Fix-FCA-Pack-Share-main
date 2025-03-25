const fs = require('fs');
const Downloader = require('../utils/downloader');

module.exports = {
    name: "douyin",
    dev: "HNT",
    category: "Media",
    usedby: 2,
    info: "Tải video từ Douyin",
    usages: "douyin [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Douyin Downloader\n\n" +
                    "Cách dùng: douyin [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('douyin.com')) {
                return api.sendMessage("❌ Vui lòng nhập link Douyin hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Douyin...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
             
                const videos = data.medias.filter(m => m.type === 'video');
                const images = data.medias.filter(m => m.type === 'image');

                if (videos.length > 0) {
                    const sortedVideos = Downloader.sortMediaByQuality(videos);
                    const bestVideo = sortedVideos[0];
                    const download = await Downloader.downloadMedia(bestVideo, 'douyin_video');
                    mediaDownloads.push(download);
                }

                for (const image of images) {
                    if (mediaDownloads.length >= 20) break;
                    const download = await Downloader.downloadMedia(image, 'douyin_image');
                    mediaDownloads.push(download);
                }
            }

            if (mediaDownloads.length === 0) {
                throw new Error('Không tìm thấy media để tải');
            }

            await api.sendMessage({
                body: `📥 Tải thành công!\n` +
                      `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                      `💬 Nội dung: ${data.title || 'Không có nội dung'}\n` +
                      `📊 Số lượng: ${mediaDownloads.length} file\n` +
                      (mediaDownloads.find(m => m.type === 'video') ? '🎥 Bao gồm video\n' : '') +
                      (data.description ? `📝 Mô tả: ${data.description}\n` : '') +
                      `🔗 Link gốc: ${data.url}`,
                attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
            }, event.threadID, () => {
                mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            console.error('Douyin Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
