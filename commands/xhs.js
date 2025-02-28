const Downloader = require('../utils/downloader');
const fs = require('fs');

module.exports = {
    name: "xhs",
    nickName: ["xhs"],
    dev: "HNT",
    category: "Media",
    info: "Tải media từ Xiaohongshu",
    usages: "xhs [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Xiaohongshu Downloader\n\nCách dùng: xhs [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('xiaohongshu.com') && !url.includes('xhslink.com')) {
                return api.sendMessage("❌ Vui lòng nhập link Xiaohongshu hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Xiaohongshu...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
                for (const media of data.medias) {
                    if (mediaDownloads.length >= 10) break;
                    const download = await Downloader.downloadMedia(media, 'xhs');
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
