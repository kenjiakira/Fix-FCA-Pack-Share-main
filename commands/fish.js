const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

const fishTypes = {
    common: [
        { name: "Cá Rô", value: 1000 },
        { name: "Cá Diếc", value: 2000 },
        { name: "Cá Chép", value: 3000 }
    ],
    uncommon: [
        { name: "Cá Trê", value: 5000 },
        { name: "Cá Lóc", value: 7000 }
    ],
    rare: [
        { name: "Cá Hồi", value: 10000 },
        { name: "Cá Tầm", value: 15000 }
    ],
    legendary: [
        { name: "Cá Mập", value: 50000 },
        { name: "Cá Voi", value: 100000 }
    ]
};

const locations = {
    pond: {
        name: "Ao làng",
        cost: 0,
        fish: {
            common: 70,
            uncommon: 25,
            rare: 4,
            legendary: 1
        }
    },
    river: {
        name: "Sông",
        cost: 5000,
        fish: {
            common: 50,
            uncommon: 35,
            rare: 12,
            legendary: 3
        }
    },
    ocean: {
        name: "Biển",
        cost: 10000,
        fish: {
            common: 30,
            uncommon: 45,
            rare: 20,
            legendary: 5
        }
    }
};

module.exports = {
    name: "fish",
    dev: "HNT",
    info: "Câu cá kiếm xu",
    usages: "fish",
    usedby: 0,
    cooldowns: 60,
    onPrefix: true,

    lastFished: {},

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        const menu = "🎣 MENU CÂU CÁ 🎣\n━━━━━━━━━━━━━━━━━━\n" +
            "1. Câu ở Ao làng (Miễn phí)\n" +
            "2. Câu ở Sông (5,000 Xu)\n" +
            "3. Câu ở Biển (10,000 Xu)\n" +
            "4. Xem túi đồ\n" +
            "5. Hướng dẫn\n\n" +
            "Reply tin nhắn với số để chọn!";

        const msg = await api.sendMessage(menu, threadID, messageID);

        global.client.onReply.push({
            name: this.name,
            messageID: msg.messageID,
            author: event.senderID,
            type: "menu"
        });
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        
        const reply = global.client.onReply.find(r => r.author === senderID);
        if (!reply || reply.name !== this.name) return;
        
        global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);

        const choice = parseInt(body);
        if (isNaN(choice) || choice < 1 || choice > 5) {
            return api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID, messageID);
        }

        switch(choice) {
            case 1:
            case 2:
            case 3:
                const locationKeys = ["pond", "river", "ocean"];
                const location = locations[locationKeys[choice - 1]];
                
                const currentTime = Date.now();
                if (this.lastFished[senderID] && currentTime - this.lastFished[senderID] < 60000) {
                    const waitTime = Math.ceil((60000 - (currentTime - this.lastFished[senderID])) / 1000);
                    return api.sendMessage(`⏳ Vui lòng đợi ${waitTime} giây để câu cá tiếp!`, threadID, messageID);
                }

                if (getBalance(senderID) < location.cost) {
                    return api.sendMessage(`❌ Bạn cần ${formatNumber(location.cost)} Xu để câu cá ở ${location.name}!`, threadID, messageID);
                }

                updateBalance(senderID, -location.cost);
                const msg = await api.sendMessage(`🎣 Đang thả câu ở ${location.name}...`, threadID, messageID);

                setTimeout(async () => {
                    const random = Math.random() * 100;
                    let fish;
                    const chances = location.fish;

                    if (random < chances.common) {
                        fish = fishTypes.common[Math.floor(Math.random() * fishTypes.common.length)];
                    } else if (random < chances.common + chances.uncommon) {
                        fish = fishTypes.uncommon[Math.floor(Math.random() * fishTypes.uncommon.length)];
                    } else if (random < chances.common + chances.uncommon + chances.rare) {
                        fish = fishTypes.rare[Math.floor(Math.random() * fishTypes.rare.length)];
                    } else {
                        fish = fishTypes.legendary[Math.floor(Math.random() * fishTypes.legendary.length)];
                    }

                    this.lastFished[senderID] = currentTime;
                    updateBalance(senderID, fish.value);
                    updateQuestProgress(senderID, "play_games");

                    api.unsendMessage(msg.messageID);
                    return api.sendMessage(
                        `🎣 Bạn đã câu được ${fish.name} tại ${location.name}!\n` +
                        `💰 Giá trị: ${formatNumber(fish.value)} Xu\n` +
                        `📍 Chi phí địa điểm: ${formatNumber(location.cost)} Xu\n` +
                        `💵 Lợi nhuận: ${formatNumber(fish.value - location.cost)} Xu\n` +
                        `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu`,
                        threadID, messageID
                    );
                }, 5000);
                break;

            case 4:
                return api.sendMessage(
                    "💰 Số dư của bạn: " + formatNumber(getBalance(senderID)) + " Xu\n" +
                    "🎣 Các địa điểm câu cá:\n" +
                    "1. Ao làng: Miễn phí (Cơ hội thấp)\n" +
                    "2. Sông: 5,000 Xu (Cơ hội trung bình)\n" +
                    "3. Biển: 10,000 Xu (Cơ hội cao)\n\n" +
                    "🐟 Các loại cá:\n" +
                    "- Phổ thông: " + fishTypes.common.map(f => f.name).join(", ") + "\n" +
                    "- Hiếm: " + fishTypes.uncommon.map(f => f.name).join(", ") + "\n" +
                    "- Quý hiếm: " + fishTypes.rare.map(f => f.name).join(", ") + "\n" +
                    "- Huyền thoại: " + fishTypes.legendary.map(f => f.name).join(", "),
                    threadID, messageID
                );

            case 5:
                return api.sendMessage(
                    "🎣 HƯỚNG DẪN CÂU CÁ 🎣\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "1. Gõ .fish để mở menu câu cá\n" +
                    "2. Chọn địa điểm muốn câu cá:\n" +
                    "   - Ao làng: Miễn phí, tỉ lệ cá hiếm thấp\n" +
                    "   - Sông: 5,000 Xu, tỉ lệ cá hiếm trung bình\n" +
                    "   - Biển: 10,000 Xu, tỉ lệ cá hiếm cao\n\n" +
                    "3. Thời gian chờ giữa mỗi lần câu: 60 giây\n" +
                    "4. Càng câu ở địa điểm cao cấp, càng có cơ hội nhận được cá giá trị\n" +
                    "5. Mỗi lần câu sẽ tốn phí địa điểm tương ứng\n\n" +
                    "Chúc bạn câu cá vui vẻ! 🎣",
                    threadID, messageID
                );
        }
    }
};