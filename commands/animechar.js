const axios = require('axios');
const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

module.exports = {
    name: "animechar",
    version: "1.0.0",
    dev: "HNT",
    category: "Anime",
    info: "Tìm thông tin nhân vật anime",
    usages: "animechar <tên nhân vật>",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const query = target.join(" ");

        if (!query) {
            return api.sendMessage("📌 Vui lòng nhập tên nhân vật cần tìm!", threadID, messageID);
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
            if (!response.data?.data?.[0]) {
                return api.sendMessage("❌ Không tìm thấy thông tin nhân vật!", threadID, messageID);
            }

            const char = response.data.data[0];
            const about = await translate(char.about || "Không có thông tin", { from: 'en', to: 'vi' });
            
            const imgResponse = await axios.get(char.images.jpg.image_url, { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'cache', `char_${Date.now()}.jpg`);
            fs.writeFileSync(imgPath, imgResponse.data);

            const msg = `👤 THÔNG TIN NHÂN VẬT\n\n` +
                       `📝 Tên: ${char.name}\n` +
                       `✒️ Tên khác: ${char.name_kanji || 'Không có'}\n` +
                       `👍 Độ yêu thích: ${char.favorites}\n\n` +
                       `📖 Giới thiệu:\n${about}\n\n` +
                       `🔗 Chi tiết: ${char.url}`;

            await api.sendMessage(
                {
                    body: msg,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            console.error("Animechar Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", 
                threadID, messageID
            );
        }
    }
};
