const Downloader = require('../utils/downloader');
const fs = require('fs');

module.exports = {
    name: "weibo",
    nickName: ["wb"],
    dev: "HNT",
    info: "Tải media từ Weibo",
    usages: "weibo [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Weibo Downloader\n\nCách dùng: weibo [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('weibo.com') && !url.includes('weibo.cn')) {
                return api.sendMessage("❌ Vui lòng nhập link Weibo hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Weibo...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
                const sortedMedias = Downloader.sortMediaByQuality(data.medias);
                for (const media of sortedMedias) {
                    if (mediaDownloads.length >= 30) break;
                    const download = await Downloader.downloadMedia(media, 'weibo');
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
                      `🔗 Link gốc: ${data.url}`,
                attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
            }, event.threadID, () => {
                mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
