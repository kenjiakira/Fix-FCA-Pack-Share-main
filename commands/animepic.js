const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "animepic",
    dev: "HNT",
    category: "Anime",
    info: "Xem ảnh Anime ngẫu nhiên",
    usages: [
        "animepic - Xem ảnh ngẫu nhiên",
        "animepic list - Xem danh sách thể loại",
        "animepic <thể loại> - Xem ảnh theo thể loại"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const args = target;

        const categories = {
            "waifu": "Waifu",
            "neko": "Mèo nữ",
            "shinobu": "Shinobu",
            "megumin": "Megumin",
            "bully": "Bắt nạt",
            "cuddle": "Ôm",
            "cry": "Khóc",
            "hug": "Ôm",
            "awoo": "Awoo",
            "kiss": "Hôn",
            "lick": "Liếm",
            "pat": "Vỗ về",
            "smug": "Tự mãn",
            "bonk": "Đánh",
            "yeet": "Ném",
            "blush": "Đỏ mặt",
            "smile": "Cười",
            "wave": "Vẫy tay",
            "highfive": "Đập tay",
            "handhold": "Nắm tay",
            "nom": "Ăn",
            "bite": "Cắn",
            "glomp": "Ôm chặt",
            "slap": "Tát",
            "kill": "Giết",
            "kick": "Đá",
            "happy": "Vui vẻ",
            "wink": "Nháy mắt",
            "poke": "Chọc",
            "dance": "Nhảy"
        };

        if (!args[0] || args[0] === "random") {
            const randomCategory = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)];
            args[0] = randomCategory;
        }

        if (args[0] === "list") {
            let msg = "📑 DANH SÁCH THỂ LOẠI:\n\n";
            Object.entries(categories).forEach(([key, value], index) => {
                msg += `${index + 1}. ${value} (${key})\n`;
            });
            msg += "\n👉 Dùng 'animepic <thể loại>' để xem ảnh";
            return api.sendMessage(msg, threadID, messageID);
        }

        const category = args[0].toLowerCase();
        if (!categories[category]) {
            return api.sendMessage(
                "❌ Thể loại không hợp lệ!\n👉 Dùng 'animepic list' để xem danh sách", 
                threadID, messageID
            );
        }

        try {
            const response = await axios.get(`https://api.waifu.pics/sfw/${category}`);
            if (!response.data?.url) throw new Error("Không tìm thấy ảnh");

            const imgResponse = await axios.get(response.data.url, { responseType: 'arraybuffer' });
            const imgPath = path.join(__dirname, 'cache', `anime_${Date.now()}.${response.data.url.split('.').pop()}`);

            fs.writeFileSync(imgPath, imgResponse.data);

            await api.sendMessage(
                {
                    body: `🌸 Anime ${categories[category]}`,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            console.error("Animepic Error:", error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", 
                threadID, messageID
            );
        }
    }
};
