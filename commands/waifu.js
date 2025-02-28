const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "waifu",
    version: "1.0.0",
    dev: "HNT",
    category: "Anime",
    info: "ảnh Waifu ngẫu nhiên",
    usages: [
        "waifu - Random waifu",
        "waifu list - Xem danh sách thể loại",
        "waifu <thể loại> - Waifu theo thể loại"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        
        const categories = {
            "waifu": "Waifu",
            "maid": "Nữ hầu gái",
            "oppai": "Oppai",
            "selfies": "Tự sướng",
            "uniform": "Đồng phục",
            "marin-kitagawa": "Marin Kitagawa",
            "mori-calliope": "Mori Calliope",
            "raiden-shogun": "Raiden Shogun",
            "elaina": "Elaina"
        };

        if (target[0] === "list") {
            let msg = "📑 DANH SÁCH THỂ LOẠI WAIFU:\n\n";
            Object.entries(categories).forEach(([key, value], index) => {
                msg += `${index + 1}. ${value} (${key})\n`;
            });
            return api.sendMessage(msg, threadID, messageID);
        }

        const category = target[0]?.toLowerCase() || "waifu";
        if (!categories[category]) {
            return api.sendMessage(
                "❌ Thể loại không hợp lệ!\n👉 Dùng 'waifu list' để xem danh sách",
                threadID, messageID
            );
        }

        try {
            const response = await axios.get(
                `https://api.waifu.im/search?included_tags=${category}&is_nsfw=false`
            );

            if (!response.data?.images?.[0]?.url) {
                throw new Error("Không tìm thấy ảnh!");
            }

            const imgUrl = response.data.images[0].url;
            const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            
            const imgPath = path.join(__dirname, 'cache', `waifu_${Date.now()}.${imgUrl.split('.').pop()}`);
            fs.writeFileSync(imgPath, imgRes.data);

            await api.sendMessage(
                {
                    body: `🌸 Random ${categories[category]}`,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            console.error("Waifu Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
                threadID, messageID
            );
        }
    }
};
