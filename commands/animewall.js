const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "animewall",
    version: "1.0.0",
    dev: "HNT",
    category: "Anime",
    info: "Tải hình nền anime HD",
    usages: [
        "animewall - Ảnh ngẫu nhiên",
        "animewall <từ khóa> - Tìm theo từ khóa"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const keyword = target.join(" ");
        const numberOfWallpapers = 9; // Default number of wallpapers
        
        const cachePath = path.join(__dirname, 'cache');
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true });
        }

        try {
            const params = {
                q: keyword ? `${keyword} anime` : 'anime',
                categories: '010', 
                purity: '100', 
                sorting: 'random',
                atleast: '1920x1080',
                page: 1
            };

            const response = await axios.get('https://wallhaven.cc/api/v1/search', { params });
            if (!response.data?.data?.length) {
                return api.sendMessage("❌ Không tìm thấy hình nền phù hợp!", threadID, messageID);
            }

            // Get random wallpapers
            const wallpapers = response.data.data
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfWallpapers);

            const attachments = [];
            for (const wallpaper of wallpapers) {
                try {
                    const imgResponse = await axios.get(wallpaper.path, { responseType: 'arraybuffer' });
                    const imgPath = path.join(cachePath, `wall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${wallpaper.file_type.split('/')[1]}`);
                    
                    fs.writeFileSync(imgPath, imgResponse.data);
                    attachments.push(fs.createReadStream(imgPath));
                } catch (error) {
                    console.error(`Error downloading wallpaper: ${error.message}`);
                }
            }

            if (attachments.length === 0) {
                return api.sendMessage("❌ Không thể tải hình ảnh!", threadID, messageID);
            }

            const msg = `🎭 ANIME WALLPAPERS (${attachments.length})\n` + 
                       `🔍 ${keyword ? `Từ khóa: ${keyword}\n` : 'Ngẫu nhiên\n'}` +
                       `📌 Độ phân giải: HD 1920x1080+`;

            await api.sendMessage(
                {
                    body: msg,
                    attachment: attachments
                },
                threadID,
                (err) => {
                    attachments.forEach(attachment => {
                        const filePath = attachment.path;
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    });
                },
                messageID
            );

        } catch (error) {
            console.error("Animewall Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", 
                threadID, messageID
            );
        }
    }
};
