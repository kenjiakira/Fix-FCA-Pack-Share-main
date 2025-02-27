const Downloader = require('../utils/downloader');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "capcut",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tải template từ Capcut",
    usages: "capcut [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Capcut Template Downloader\n\nCách dùng: capcut [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('capcut.com')) {
                return api.sendMessage("❌ Vui lòng nhập link Capcut hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải template Capcut...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
                const media = data.medias[0]; 
                const download = await Downloader.downloadMedia(media, 'capcut');
                mediaDownloads.push(download);
            }

            if (mediaDownloads.length === 0) {
                throw new Error('Không tìm thấy template để tải');
            }

            await api.sendMessage({
                body: `📥 Tải template thành công!\n` +
                      `✨ Tên template: ${data.title || 'Không có tên'}\n` +
                      `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                      `🔗 Link gốc: ${data.url}`,
                attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
            }, event.threadID, () => {
                mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            console.error('Capcut Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
