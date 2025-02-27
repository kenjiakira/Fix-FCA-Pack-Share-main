const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Downloader = require('../utils/downloader');

const PLATFORM_INFO = {
    NO_WATERMARK: ['tiktok', 'douyin', 'capcut', 'hipi', 'xiaohongshu'],
    STABLE: [
        'tiktok', 'douyin', 'capcut', 'threads', 'instagram', 'facebook',
        'pinterest', 'youtube', 'twitter', 'vimeo', 'bilibili', 'dailymotion',
        'linkedin', 'telegram', 'soundcloud', 'spotify', 'zingmp3'
    ],
    CHINA: ['douyin', 'xiaohongshu', 'ixigua', 'weibo'],
    UNSTABLE: ['instagram-stories', 'instagram-private', 'facebook-private']
};

module.exports = {
    name: "down",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tải media từ nhiều nền tảng xã hội",
    usages: "down [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📥 ZM Media Downloader\n\n" +
                    "1. Nền tảng không watermark:\n" +
                    `${PLATFORM_INFO.NO_WATERMARK.join(', ')}\n\n` +
                    "2. Nền tảng ổn định:\n" +
                    `${PLATFORM_INFO.STABLE.join(', ')}\n\n` +
                    "3. Nền tảng Trung Quốc:\n" +
                    `${PLATFORM_INFO.CHINA.join(', ')}\n\n` +
                    "4. Nền tảng không ổn định:\n" +
                    `${PLATFORM_INFO.UNSTABLE.join(', ')}\n\n` +
                    "Cách dùng: down [link]",
                    event.threadID
                );
            }

            const url = target[0];
            loadingMsg = await api.sendMessage("⏳ Đang xử lý...", event.threadID);

            const data = await Downloader.getMediaInfo(url);
            const mediaDownloads = [];

            if (data.medias && data.medias.length > 0) {
                const sortedMedias = Downloader.sortMediaByQuality(data.medias);

                for (const media of sortedMedias) {
                    if (mediaDownloads.length >= 10) break;
                    const download = await Downloader.downloadMedia(media);
                    mediaDownloads.push(download);
                }
            }

            if (mediaDownloads.length === 0) {
                throw new Error('Không tìm thấy media để tải');
            }

            await api.sendMessage({
                body: `📥 Tải thành công!\n` +
                      `👤 Tác giả: ${data.author || 'Không xác định'}\n` +
                      `💬 Tiêu đề: ${data.title || 'Không có tiêu đề'}\n` +
                      `📊 Số lượng: ${mediaDownloads.length} file\n` +
                      `🔍 Nguồn: ${data.source}\n` +
                      (data.description ? `📝 Mô tả: ${data.description}\n` : '') +
                      `🔗 Link gốc: ${data.url}`,
                attachment: mediaDownloads.map(m => fs.createReadStream(m.path))
            }, event.threadID, () => {
            
                mediaDownloads.forEach(m => fs.unlinkSync(m.path));
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            console.error('Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
