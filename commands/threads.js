const Downloader = require('../utils/downloader');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "threads",
    dev: "HNT",
    usedby: 2,
    category: "Tiện Ích",
    info: "Tải media từ Threads",
    usages: "threads [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 Threads Downloader\n\nCách dùng: threads [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.includes('threads.net')) {
                return api.sendMessage("❌ Vui lòng nhập link Threads hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Threads...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];
            let hasVideo = false;

            if (data.medias && data.medias.length > 0) {
                const videos = data.medias.filter(m => m.type === 'video');
                const images = data.medias.filter(m => m.type === 'image');

                if (videos.length > 0) {
                    hasVideo = true;
                    const sortedVideos = Downloader.sortMediaByQuality(videos);
                    const bestVideo = sortedVideos[0];
                    const download = await Downloader.downloadMedia(bestVideo, 'threads_video');
                    mediaDownloads.push(download);
                } else {
                    for (const image of images) {
                        if (mediaDownloads.length >= 10) break;
                        const download = await Downloader.downloadMedia(image, 'threads_image');
                        mediaDownloads.push(download);
                    }
                }
            }

            if (mediaDownloads.length === 0) {
                throw new Error('Không tìm thấy media để tải');
            }

            const messageBody = `📥 Tải thành công!\n` +
                              `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                              `💬 Nội dung: ${data.title || 'Không có nội dung'}\n` +
                              `🔗 Link gốc: ${data.url}`;

            if (hasVideo) {
                await api.sendMessage({
                    body: messageBody + '\n🎥 Đang gửi video...',
                    attachment: fs.createReadStream(mediaDownloads[0].path)
                }, event.threadID, () => {
                    fs.unlinkSync(mediaDownloads[0].path);
                });
            } else {
              
                await api.sendMessage({
                    body: messageBody + `\n🖼️ Số lượng ảnh: ${mediaDownloads.length}`,
                    attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
                }, event.threadID, () => {
                    mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                });
            }

            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);

        } catch (error) {
            console.error('Threads Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
