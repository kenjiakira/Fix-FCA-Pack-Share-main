const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Downloader = require('../utils/downloader');
const vipService = require('../game/vip/vipService');

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

const patterns = {
    capcut: /https:\/\/www\.capcut\.com\/t\/\S*/,
    facebook: /https:\/\/www\.facebook\.com\/\S*/,
    tiktok: /https:\/\/(vm|vt|www|v)?\.?tiktok\.com\/.+/, 
    douyin: /https:\/\/(v\.|www\.)?(douyin\.com|iesdouyin\.com)\/.+/,
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
    instagram: /https?:\/\/(www\.)?instagram\.com\/(p|reel|stories)\/\S+/,
    twitter: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\S+/,
    weibo: /https?:\/\/(www\.)?(weibo\.com|weibo\.cn)\/\S+/,
    xiaohongshu: /https?:\/\/(www\.)?(xiaohongshu\.com|xhslink\.com)\/\S+/,
    threads: /https?:\/\/(www\.)?threads\.net\/@?[a-zA-Z0-9._-]+\/post\/[a-zA-Z0-9]+/,
    pinterest: /https?:\/\/(www\.)?pinterest\.(com|ca|fr|jp|co\.uk)\/pin\/[0-9]+/,
};

module.exports = {
    name: "download",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tải media từ nhiều nền tảng xã hội hoặc lấy link tải xuống",
    usages: `download [lệnh] [link]
- down [link]: Tải media từ nhiều nền tảng
- getlink: Lấy URL tải xuống từ video, âm thanh được gửi từ nhóm
- capcut [link]: Tải template từ Capcut`,
    cooldowns: 5,
    onPrefix: true,

    async onLaunch({ api, event, target }) {
        const [subcommand, ...params] = target;

        if (!subcommand) {
            return api.sendMessage(this.usages, event.threadID);
        }

        switch (subcommand.toLowerCase()) {
            case 'down':
                await this.downloadMedia(api, event, params[0]);
                break;
            case 'getlink':
                await this.getLink(api, event);
                break;
            case 'capcut':
                await this.downloadCapcut(api, event, params[0]);
                break;
            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!\n\n" + this.usages, event.threadID);
        }
    },

    async downloadMedia(api, event, url) {
        let loadingMsg = null;
        try {
            if (!url) {
                return api.sendMessage(
                    "📥 ZM Media Downloader\n\n" +
                    "🆓 Nền tảng miễn phí:\n" +
                    "tiktok, facebook\n\n" +
                    "💎 Nền tảng yêu cầu VIP GOLD:\n" +
                    "1. Không watermark:\n" +
                    `${PLATFORM_INFO.NO_WATERMARK.filter(p => !['tiktok', 'facebook'].includes(p)).join(', ')}\n\n` +
                    "2. Nền tảng ổn định:\n" +
                    `${PLATFORM_INFO.STABLE.filter(p => !['tiktok', 'facebook'].includes(p)).join(', ')}\n\n` +
                    "3. Nền tảng Trung Quốc:\n" +
                    `${PLATFORM_INFO.CHINA.join(', ')}\n\n` +
                    "4. Nền tảng không ổn định:\n" +
                    `${PLATFORM_INFO.UNSTABLE.join(', ')}\n\n` +
                    "Cách dùng: download down [link]",
                    event.threadID
                );
            }

            const platform = Object.entries(patterns).find(([_, pattern]) => pattern.test(url))?.[0];
            if (platform && !['facebook', 'tiktok'].includes(platform)) {
                const benefits = vipService.getVIPBenefits(event.senderID);
                if (benefits.packageId !== 3) {
                    return api.sendMessage(
                        "⚠️ Bạn cần có VIP GOLD để tải nội dung từ nền tảng này.\n" +
                        "💎 Gõ '.vip gold' để xem thông tin nâng cấp VIP GOLD.",
                        event.threadID
                    );
                }
            }

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
    },

    async getLink(api, event) {
        const errorMessage = "❌ Bạn cần trả lời một tin nhắn có chứa âm thanh, video hoặc hình ảnh";

        if (event.type !== "message_reply") {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        if (event.messageReply.attachments.length > 1) {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        return api.sendMessage(
            event.messageReply.attachments[0].url,
            event.threadID,
            event.messageID
        );
    },

    async downloadCapcut(api, event, url) {
        let loadingMsg = null;
        try {
            if (!url) {
                return api.sendMessage(
                    "📥 Capcut Template Downloader\n\nCách dùng: download capcut [link]",
                    event.threadID
                );
            }

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
