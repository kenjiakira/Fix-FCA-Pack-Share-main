const Downloader = require('../utils/downloader');
const fs = require('fs');

module.exports = {
    name: "ig",
    dev: "HNT",
    category: "Media",
    usedby: 2,
    info: "Tải media từ Instagram",
    usages: "instagram [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Instagram Downloader\n\nCách dùng: instagram [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('instagram.com')) {
                return api.sendMessage("❌ Vui lòng nhập link Instagram hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Instagram...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
                const sortedMedias = Downloader.sortMediaByQuality(data.medias);
                for (const media of sortedMedias) {
                    if (mediaDownloads.length >= 10) break;
                    const download = await Downloader.downloadMedia(media, 'instagram');
                    mediaDownloads.push(download);
                }
            }

            if (mediaDownloads.length === 0) {
                throw new Error('Không tìm thấy media để tải');
            }

            await api.sendMessage({
                body: `📥 Tải thành công!\n` +
                      `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                      `💬 Caption: ${data.title || 'Không có caption'}\n` +
                      `📊 Số lượng: ${mediaDownloads.length} file\n` +
                      `🔍 Nguồn: Instagram\n` +
                      `🔗 Link gốc: ${data.url}`,
                attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
            }, event.threadID, () => {
                mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            console.error('Instagram Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
