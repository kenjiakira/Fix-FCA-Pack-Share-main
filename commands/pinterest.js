const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ZM_API } = require('../utils/api');

module.exports = {
    name: "pinterest",
    dev: "HNT",
    category: "Media",
    info: "Tải media từ Pinterest",
    usages: "pinterest [link]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        let loadingMsg = null;
        try {
            if (!target[0]) {
                return api.sendMessage(
                    "📍 Pinterest Downloader\n\nCách dùng: pinterest [link]",
                    event.threadID
                );
            }

            const url = target[0];
            if (!url.match(/https?:\/\/(www\.)?pinterest\.(com|ca|fr|jp|co\.uk)\/pin\/[0-9]+/)) {
                return api.sendMessage("❌ Vui lòng nhập link Pinterest hợp lệ!", event.threadID);
            }

            loadingMsg = await api.sendMessage("⏳ Đang tải media từ Pinterest...", event.threadID);

            const { data } = await axios.post(
                `${ZM_API.BASE_URL}/social/pinterest`,
                { url },
                { 
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': ZM_API.KEY
                    }
                }
            );

            if (!data || data.error) {
                throw new Error('Không thể tải nội dung');
            }

            const mediaUrl = data.url;
            if (!mediaUrl) {
                throw new Error('Không tìm thấy media');
            }

            const tempDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            
            const ext = data.type || 'jpg';
            const tempPath = path.join(tempDir, `pinterest_${Date.now()}.${ext}`);
            
            const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, response.data);

            await api.sendMessage({
                body: `📍 Pinterest Download\n\n`+
                      `📌 Title: ${data.title || 'N/A'}\n`+
                      `👤 Author: ${data.author || 'N/A'}\n`+
                      `🔗 Link: ${url}`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => {
                fs.unlinkSync(tempPath);
                if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            });

        } catch (error) {
            console.error('Pinterest Download Error:', error);
            if (loadingMsg) api.unsendMessage(loadingMsg.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\nVui lòng thử lại sau.`,
                event.threadID
            );
        }
    }
};
