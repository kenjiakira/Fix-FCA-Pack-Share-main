const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, 'cache', 'images', 'douyin');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

const API_CONFIG = {
    baseUrl: 'https://api.zm.io.vn/v1/social/autolink',
    headers: {
        'Content-Type': 'application/json',
        'apikey': 'OIaCP3fFqjtM6Ndnx5hb' 
    }
};

module.exports = {
    name: 'douyin',
    info: 'Tải video hoặc hình ảnh từ Douyin',
    dev: 'HNT',
    usedby: 0,
    onPrefix: true,
    dmUser: false,
    nickName: ['douyin', 'dy'],
    usages: 'douyin [URL Douyin]',
    cooldowns: 5,

    onLaunch: async function({ api, event, actions }) {
        const { threadID, messageID, body } = event;
        const url = body.trim().split(' ')[1];

        if (!url) {
            return actions.reply("❌ Vui lòng cung cấp URL Douyin hợp lệ. 🌐");
        }

        await processDouyinUrl(url, api, threadID, messageID);
    },
};

const processDouyinUrl = async (url, api, threadID, messageID) => {
    if (!is_url(url)) {
        return api.sendMessage("❌ Vui lòng cung cấp URL hợp lệ. 🌐", threadID, messageID);
    }

    if (/douyin\.com/.test(url)) {
        try {
            const response = await axios.get(`${API_CONFIG.baseUrl}?url=${encodeURIComponent(url)}`, {
                headers: API_CONFIG.headers
            });
            
            if (!response.data || !response.data.medias) {
                return api.sendMessage("⚠️ Không thể tải nội dung từ URL này. 😢", threadID, messageID);
            }

            const { author, title, medias } = response.data;
            let attachments = [];
            let filePaths = [];

            const mediaItem = medias.find(m => m.quality === 'hd_no_watermark') || 
                            medias.find(m => m.quality === 'no_watermark') ||
                            medias[0];

            if (mediaItem?.url) {
                const filePath = await downloadFile(mediaItem.url, mediaItem.type === 'video' ? 'mp4' : 'jpg');
                attachments.push(fs.createReadStream(filePath));
                filePaths.push(filePath);

                await api.sendMessage({
                    body: `==[ DOUYIN DOWNLOAD ]==\n\n🎬 Tiêu đề: ${title || "Không có tiêu đề"}\n👤 Tác giả: ${author || "Không xác định"}\n🎯 Chất lượng: ${mediaItem.quality || "Mặc định"}`,
                    attachment: attachments
                }, threadID, messageID);

                cleanupFiles(filePaths);
            }

        } catch (error) {
            console.error("Lỗi trong quá trình xử lý:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi xử lý yêu cầu của bạn. 😥", threadID, messageID);
        }
    } else {
        return api.sendMessage("⚠️ Vui lòng cung cấp URL Douyin hợp lệ. 📲", threadID, messageID);
    }
};

const is_url = (url) => /^http(s)?:\/\//.test(url);

const downloadFile = async (url, type) => {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
        fs.writeFileSync(filePath, res.data);
        return filePath;
    } catch (error) {
        console.error("Lỗi khi tải tệp từ URL:", error);
        throw new Error("Không thể tải tệp từ URL");
    }
};

const cleanupFiles = (filePaths) => {
    setTimeout(() => {
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Đã xóa tệp: ${filePath}`);
            }
        });
    }, 1000 * 60);
};
