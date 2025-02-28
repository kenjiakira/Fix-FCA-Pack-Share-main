const axios = require('axios');

const fruits = {
    "Bomb": { price: 800000, type: "Common" },
    "Spike": { price: 900000, type: "Common" },
    "Chop": { price: 950000, type: "Common" },
    "Spring": { price: 1000000, type: "Common" },
    "Kilo": { price: 1000000, type: "Common" },
    "Smoke": { price: 1100000, type: "Common" },
    "Spin": { price: 1200000, type: "Common" },
    "Flame": { price: 2300000, type: "Common" },
    "Falcon": { price: 2500000, type: "Uncommon" },
    "Ice": { price: 2800000, type: "Common" },
    "Sand": { price: 3000000, type: "Uncommon" },
    "Dark": { price: 3500000, type: "Uncommon" },
    "Diamond": { price: 4000000, type: "Uncommon" },
    "Light": { price: 4500000, type: "Uncommon" },
    "Rubber": { price: 5000000, type: "Uncommon" },
    "Barrier": { price: 5500000, type: "Uncommon" },
    "Magma": { price: 6000000, type: "Rare" },
    "Quake": { price: 6500000, type: "Rare" },
    "Buddha": { price: 7000000, type: "Rare" },
    "Love": { price: 7500000, type: "Rare" },
    "Spider": { price: 8000000, type: "Rare" },
    "Phoenix": { price: 8500000, type: "Rare" },
    "Portal": { price: 9000000, type: "Rare" },
    "Rumble": { price: 9500000, type: "Rare" },
    "Pain": { price: 10000000, type: "Rare" },
    "Blizzard": { price: 10500000, type: "Rare" },
    "Gravity": { price: 11000000, type: "Legendary" },
    "Dough": { price: 12000000, type: "Legendary" },
    "Shadow": { price: 12500000, type: "Legendary" },
    "Venom": { price: 13000000, type: "Legendary" },
    "Control": { price: 13500000, type: "Legendary" },
    "Spirit": { price: 14000000, type: "Legendary" },
    "Dragon": { price: 14500000, type: "Legendary" }
};

function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    }
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    name: "bloxfruits",
    aliases: ["bf", "fruit"],
    version: "1.0.0",
    dev: "HNT",
    category: "Game",
    info: "Xem thông tin về Blox Fruits",
    usages: [
        "bloxfruits list - Xem danh sách trái ác quỷ",
        "bloxfruits search <tên> - Tìm kiếm trái ác quỷ",
        "bloxfruits type <loại> - Lọc theo loại (Common/Uncommon/Rare/Legendary)"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const command = target[0]?.toLowerCase();
        const query = target.slice(1).join(" ");

        switch(command) {
            case "list": {
                let msg = "🍎 DANH SÁCH TRÁI ÁC QUỶ:\n\n";
                Object.entries(fruits)
                    .sort((a, b) => a[1].price - b[1].price)
                    .forEach(([name, data]) => {
                        msg += `${name} (${data.type})\n💰 ${formatPrice(data.price)}\n\n`;
                    });
                return api.sendMessage(msg, threadID, messageID);
            }

            case "search": {
                if (!query) return api.sendMessage("❌ Vui lòng nhập tên trái ác quỷ cần tìm!", threadID, messageID);
                
                const results = Object.entries(fruits)
                    .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));
                
                if (results.length === 0) {
                    return api.sendMessage("❌ Không tìm thấy trái ác quỷ nào!", threadID, messageID);
                }

                let msg = "🔍 KẾT QUẢ TÌM KIẾM:\n\n";
                results.forEach(([name, data]) => {
                    msg += `${name}\n💎 Loại: ${data.type}\n💰 Giá: ${formatPrice(data.price)}\n\n`;
                });
                return api.sendMessage(msg, threadID, messageID);
            }

            case "type": {
                if (!query) return api.sendMessage("❌ Vui lòng nhập loại trái ác quỷ (Common/Uncommon/Rare/Legendary)!", threadID, messageID);
                
                const type = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase();
                const results = Object.entries(fruits)
                    .filter(([_, data]) => data.type === type)
                    .sort((a, b) => a[1].price - b[1].price);

                if (results.length === 0) {
                    return api.sendMessage("❌ Không tìm thấy loại trái ác quỷ này!", threadID, messageID);
                }

                let msg = `🍎 TRÁI ÁC QUỶ LOẠI ${type.toUpperCase()}:\n\n`;
                results.forEach(([name, data]) => {
                    msg += `${name}\n💰 ${formatPrice(data.price)}\n\n`;
                });
                return api.sendMessage(msg, threadID, messageID);
            }

            default: {
                return api.sendMessage(
                    "📌 HƯỚNG DẪN SỬ DỤNG:\n\n" +
                    "1. .bloxfruits list - Xem danh sách trái\n" +
                    "2. .bloxfruits search <tên> - Tìm kiếm trái\n" +
                    "3. .bloxfruits type <loại> - Lọc theo loại\n\n" +
                    "Các loại: Common, Uncommon, Rare, Legendary",
                    threadID, messageID
                );
            }
        }
    }
};
