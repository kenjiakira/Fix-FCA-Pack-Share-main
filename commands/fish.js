const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const fishingItems = {
    "Cần trúc": { price: 10000, multiplier: 1, durability: 10 },
    "Cần máy": { price: 30000, multiplier: 1.5, durability: 20 },
    "Cần đài": { price: 200000, multiplier: 2, durability: 30 },
    "Cần Lục": { price: 5000000, multiplier: 3, durability: 50 }
};

const fishTypes = {
    trash: [
        { name: "Rác", value: 100 },
        { name: "Rong biển", value: 200 },
        { name: "Chai nhựa", value: 300 }
    ],
    common: [
        { name: "Cá Rô", value: 1000 },
        { name: "Cá Diếc", value: 2000 },
        { name: "Cá Chép", value: 3000 },
        { name: "Cá Tra", value: 1500 },
        { name: "Cá Mè", value: 2500 }
    ],
    uncommon: [
        { name: "Cá Trê", value: 5000 },
        { name: "Cá Lóc", value: 7000 },
        { name: "Cá Quả", value: 6000 },
        { name: "Cá Thu", value: 8000 }
    ],
    rare: [
        { name: "Cá Hồi", value: 10000 },
        { name: "Cá Tầm", value: 15000 },
        { name: "Cá Ngừ", value: 12000 },
        { name: "Cá Kiếm", value: 18000 }
    ],
    legendary: [
        { name: "Cá Mập", value: 50000 },
        { name: "Cá Voi", value: 100000 },
        { name: "Cá Voi Sát Thủ", value: 75000 },
        { name: "Cá Voi Lưng Gù", value: 150000 }
    ],
    mythical: [
        { name: "Megalodon", value: 500000 },
        { name: "Kraken", value: 1000000 }
    ]
};

const treasures = [
    { name: "Hòm gỗ", value: 5000 },
    { name: "Rương bạc", value: 20000 },
    { name: "Rương vàng", value: 50000 },
    { name: "Kho báu cổ đại", value: 100000 }
];

const specialEvents = {
    doubleRewards: { name: "Mưa vàng", description: "Nhận đôi xu trong 5 phút!" },
    rareFish: { name: "Cá quý hiếm xuất hiện", description: "Tỉ lệ bắt cá hiếm tăng gấp đôi trong 5 phút!" },
    treasureHunt: { name: "Săn kho báu", description: "Cơ hội tìm thấy kho báu khi câu cá!" }
};

const locations = {
    pond: {
        name: "Ao làng",
        cost: 0,
        fish: {
            common: 70,
            uncommon: 25,
            rare: 4,
            legendary: 1,
            trash: 10,
            mythical: 0
        }
    },
    river: {
        name: "Sông",
        cost: 5000,
        fish: {
            common: 50,
            uncommon: 35,
            rare: 12,
            legendary: 3,
            trash: 5,
            mythical: 0.1
        }
    },
    ocean: {
        name: "Biển",
        cost: 10000,
        fish: {
            common: 30,
            uncommon: 45,
            rare: 20,
            legendary: 5,
            trash: 3,
            mythical: 0.5
        }
    },
    deepSea: {
        name: "Biển sâu",
        cost: 50000,
        fish: {
            trash: 1,
            common: 20,
            uncommon: 40,
            rare: 25,
            legendary: 10,
            mythical: 4
        }
    }
};

module.exports = {
    name: "fish",
    dev: "HNT",
    info: "Câu cá kiếm xu",
    usages: "fish",
    usedby: 0,
    cooldowns: 0, // Change to 0 since we'll handle cooldown manually
    onPrefix: true,

    lastFished: {},

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const playerData = this.loadPlayerData(senderID);
        
        const menu = "🎣 MENU CÂU CÁ 🎣\n━━━━━━━━━━━━━━━━━━\n" +
            "1. Câu cá\n" +
            "2. Cửa hàng\n" +
            "3. Túi đồ\n" +
            "4. Bộ sưu tập\n" +
            "5. Xếp hạng\n" +
            "6. Hướng dẫn\n\n" +
            "Reply tin nhắn với số để chọn!";

        const msg = await api.sendMessage(menu, threadID, messageID);
        
        global.client.onReply.push({
            name: this.name,
            messageID: msg.messageID,
            author: senderID,
            type: "menu",
            playerData
        });
    },

    loadPlayerData: function(userID) {
        const dataPath = path.join(__dirname, '../database/fishing.json');
        let data = {};
        
        try {
            if (fs.existsSync(dataPath)) {
                data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading fishing data:", err);
        }

        if (!data[userID]) {
            data[userID] = {
                rod: "Cần trúc", // Change default rod name to match fishingItems
                rodDurability: fishingItems["Cần trúc"].durability, // Add durability tracking
                inventory: [],
                collection: {},
                exp: 0,
                level: 1,
                activeBuffs: {},
                lastFished: 0
            };
            this.savePlayerData(data);
        }

        // Ensure rod and durability exist
        if (!data[userID].rodDurability || !fishingItems[data[userID].rod]) {
            data[userID].rod = "Cần trúc";
            data[userID].rodDurability = fishingItems["Cần trúc"].durability;
            this.savePlayerData(data);
        }

        return data[userID];
    },

    savePlayerData: function(data) {
        const dataPath = path.join(__dirname, '../database/fishing.json');
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const reply = global.client.onReply.find(r => r.messageID === event.messageReply.messageID && r.author === senderID);
        if (!reply) return;

        global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);
        
        // Load both player data and global data
        const allData = this.loadAllPlayers();
        const playerData = this.loadPlayerData(senderID);

        // Check if user is currently fishing
        if (reply.type === "location") {
            if (allData[senderID]?.lastFished && Date.now() - allData[senderID].lastFished < 360000) {
                const waitTime = Math.ceil((360000 - (Date.now() - allData[senderID].lastFished)) / 1000);
                return api.sendMessage(
                    `⏳ Bạn cần đợi ${waitTime} giây nữa mới có thể câu tiếp!\n` +
                    `⌚ Thời gian câu lần cuối: ${new Date(allData[senderID].lastFished).toLocaleTimeString()}`,
                    threadID
                );
            }
        }

        // No cooldown for menu navigation
        switch (reply.type) {
            case "menu":
                const choice = parseInt(body);
                if (isNaN(choice) || choice < 1 || choice > 6) {
                    return api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID);
                }

                switch(choice) {
                    case 1: 
                        const locationMenu = "🗺️ CHỌN ĐỊA ĐIỂM CÂU CÁ:\n━━━━━━━━━━━━━━━━━━\n" +
                            Object.entries(locations).map(([key, loc], index) => 
                                `${index + 1}. ${loc.name}\n💰 Phí: ${formatNumber(loc.cost)} Xu\n`
                            ).join("\n");
                        
                        const locMsg = await api.sendMessage(locationMenu, threadID);
                        global.client.onReply.push({
                            name: this.name,
                            messageID: locMsg.messageID,
                            author: senderID,
                            type: "location",
                            playerData
                        });
                        break;

                    case 2: 
                        const shopMenu = "🏪 CỬA HÀNG CẦN CÂU 🎣\n━━━━━━━━━━━━━━━━━━\n" +
                            Object.entries(fishingItems).map(([name, item], index) =>
                                `${index + 1}. ${name}\n💰 Giá: ${formatNumber(item.price)} Xu\n⚡ Độ bền: ${item.durability}\n↑ Tỉ lệ: x${item.multiplier}\n`
                            ).join("\n") +
                            "\n💵 Số dư: " + formatNumber(getBalance(senderID)) + " Xu" +
                            "\n\nReply số để mua cần câu!";
                        
                        const shopMsg = await api.sendMessage(shopMenu, threadID);
                        global.client.onReply.push({
                            name: this.name,
                            messageID: shopMsg.messageID,
                            author: senderID,
                            type: "shop",
                            playerData
                        });
                        break;

                    case 3: 
                        const inventory = `🎒 TÚI ĐỒ CỦA BẠN:\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `🎣 Cần câu: ${playerData.rod}\n` +
                            `⚡ Độ bền: ${playerData.rodDurability}/${fishingItems[playerData.rod].durability}\n` +
                            `📊 Cấp độ: ${playerData.level}\n` +
                            `✨ EXP: ${playerData.exp}/${playerData.level * 1000}\n` +
                            `🏆 Thành tích:\n` +
                            Object.entries(playerData.collection)
                                .map(([fish, count]) => `• ${fish}: ${count} lần`)
                                .join('\n');
                        
                        api.sendMessage(inventory, threadID);
                        break;

                    case 4: 
                        const collection = "📚 BỘ SƯU TẬP CÁ:\n━━━━━━━━━━━━━━━━━━\n\n" +
                            Object.entries(fishTypes).map(([rarity, fishes]) => {
                                const fishList = fishes.map(f => {
                                    const caught = playerData.collection[f.name] || 0;
                                    return `${caught > 0 ? '✅' : '❌'} ${f.name} (${formatNumber(f.value)} Xu)`;
                                }).join('\n');
                                return `【${rarity.toUpperCase()}】\n${fishList}\n`;
                            }).join('\n');
                        
                        api.sendMessage(collection, threadID);
                        break;

                    case 5: 
                        const allPlayers = this.loadAllPlayers();
                        const rankings = Object.entries(allPlayers)
                            .map(([id, data]) => ({
                                id,
                                level: data.level,
                                exp: data.exp,
                                totalCaught: Object.values(data.collection || {}).reduce((a, b) => a + b, 0)
                            }))
                            .sort((a, b) => b.level - a.level || b.exp - a.exp);

                        const top10 = rankings.slice(0, 10);
                        const rankMsg = "🏆 BẢNG XẾP HẠNG CÂU CÁ 🏆\n━━━━━━━━━━━━━━━━━━\n\n" +
                            top10.map((player, index) => 
                                `${index + 1}. Level ${player.level} - ${player.totalCaught} cá`
                            ).join('\n');
                        
                        api.sendMessage(rankMsg, threadID);
                        break;

                    case 6:
                        api.sendMessage(
                            "📖 HƯỚNG DẪN CÂU CÁ 🎣\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "1. Chọn địa điểm câu cá phù hợp với túi tiền\n" +
                            "2. Mua cần câu tốt để tăng tỉ lệ bắt cá hiếm\n" +
                            "3. Cần câu sẽ mất độ bền sau mỗi lần sử dụng\n" +
                            "4. Các loại cá theo thứ tự độ hiếm:\n" +
                            "   Rác < Phổ thông < Hiếm < Quý hiếm < Huyền thoại < Thần thoại\n" +
                            "5. Có cơ hội nhận được kho báu khi câu cá\n" +
                            "6. Tích lũy EXP để lên cấp và mở khóa thêm tính năng",
                            threadID
                        );
                        break;
                }
                break;

            case "shop":
                const shopChoice = parseInt(body) - 1;
                const items = Object.entries(fishingItems);
                if (shopChoice >= 0 && shopChoice < items.length) {
                    const [rodName, rodInfo] = items[shopChoice];
                    const balance = getBalance(senderID);
                    
                    if (balance < rodInfo.price) {
                        return api.sendMessage(`❌ Bạn không đủ tiền mua ${rodName}!`, threadID);
                    }

                    updateBalance(senderID, -rodInfo.price);
                    playerData.rod = rodName;
                    playerData.rodDurability = rodInfo.durability; 
                    this.savePlayerData(playerData);

                    return api.sendMessage(
                        `✅ Đã mua thành công ${rodName}!\n` +
                        `💰 Số dư còn lại: ${formatNumber(getBalance(senderID))} Xu`,
                        threadID
                    );
                }
                break;

            case "location":
                const locationIndex = parseInt(body) - 1;
                const locationKeys = Object.keys(locations);
                if (locationIndex >= 0 && locationIndex < locationKeys.length) {
                    
                    await this.handleFishing(api, event, locations[locationKeys[locationIndex]], playerData);
                }
                break;
        }
    },

    handleFishing: async function(api, event, location, playerData) {
        const allData = this.loadAllPlayers();
        const now = Date.now();

        if (!allData[event.senderID]) {
            allData[event.senderID] = playerData;
        }

        if (allData[event.senderID].lastFished && now - allData[event.senderID].lastFished < 60000) {
            const waitTime = Math.ceil((60000 - (now - allData[event.senderID].lastFished)) / 1000);
            return api.sendMessage(
                `⏳ Bạn cần đợi ${waitTime} giây nữa mới có thể câu tiếp!\n` +
                `⌚ Thời gian câu lần cuối: ${new Date(allData[event.senderID].lastFished).toLocaleTimeString()}`,
                event.threadID
            );
        }

        const levelRequirements = {
            pond: 1,
            river: 3,
            ocean: 5,
            deepSea: 10
        };

        const locationKey = Object.keys(locations).find(key => locations[key] === location);
        if (levelRequirements[locationKey] > playerData.level) {
            return api.sendMessage(
                `❌ Bạn cần đạt cấp ${levelRequirements[locationKey]} để câu ở ${location.name}!\n` +
                `📊 Cấp độ hiện tại: ${playerData.level}`,
                event.threadID
            );
        }

        if (!fishingItems[playerData.rod]) {
            playerData.rod = "Cần trúc";
            playerData.rodDurability = fishingItems["Cần trúc"].durability;
            this.savePlayerData(playerData);
        }

        if (playerData.rodDurability <= 0) {
            return api.sendMessage("⚠️ Cần câu đã hỏng! Hãy mua cần mới.", event.threadID);
        }

        const balance = getBalance(event.senderID);
        if (balance < location.cost) {
            return api.sendMessage(`❌ Bạn cần ${formatNumber(location.cost)} xu để câu ở ${location.name}!`, event.threadID);
        }

        updateBalance(event.senderID, -location.cost);
        const fishingMsg = await api.sendMessage("🎣 Đang câu...", event.threadID);

        setTimeout(async () => {
            try {
                const result = this.calculateCatch(location, fishingItems[playerData.rod].multiplier, playerData);
                
                allData[event.senderID].lastFished = now;
                playerData.lastFished = now;
                playerData.rodDurability--; 

                playerData.exp += result.exp;
                if (playerData.exp >= playerData.level * 1000) {
                    playerData.level++;
                    await api.sendMessage(`🎉 Chúc mừng đạt cấp ${playerData.level}!`, event.threadID);
                }

                if (!playerData.collection[result.name]) {
                    playerData.collection[result.name] = 0;
                }
                playerData.collection[result.name]++;
                
                this.savePlayerData(playerData);
                updateBalance(event.senderID, result.value);

                this.savePlayerData(allData);

                api.unsendMessage(fishingMsg.messageID);
                await api.sendMessage(
                    `🎣 Bạn đã câu được ${result.name}!\n` +
                    `💰 Giá trị: ${formatNumber(result.value)} Xu\n` +
                    `📊 EXP: +${result.exp}\n` +
                    `🎒 Độ bền cần: ${playerData.rodDurability}/${fishingItems[playerData.rod].durability}\n` +
                    `💵 Số dư: ${formatNumber(getBalance(event.senderID))} Xu\n` +
                    `⏳ Chờ 6 phút để câu tiếp!`,
                    event.threadID
                );
            } catch (err) {
                console.error("Error in fishing:", err);
                api.sendMessage("❌ Đã xảy ra lỗi khi câu cá!", event.threadID);
            }
        }, 5000);
    },

    calculateCatch: function(location, multiplier, playerData) {
        const random = Math.random() * 100;
        let fishPool, type;
        const chances = location.fish;

        if (random < chances.trash) {
            type = 'trash';
        } else if (random < chances.trash + chances.common) {
            type = 'common';
        } else if (random < chances.trash + chances.common + chances.uncommon) {
            type = 'uncommon';
        } else if (random < chances.trash + chances.common + chances.uncommon + chances.rare) {
            type = 'rare';
        } else if (random < chances.trash + chances.common + chances.uncommon + chances.rare + chances.legendary) {
            type = 'legendary';
        } else {
            type = 'mythical';
        }

        if (Math.random() < 0.05) {
            const treasure = treasures[Math.floor(Math.random() * treasures.length)];
            return {
                name: treasure.name,
                value: Math.floor(treasure.value * multiplier),
                exp: 50
            };
        }

        const fish = fishTypes[type][Math.floor(Math.random() * fishTypes[type].length)];
        return {
            name: fish.name,
            value: Math.floor(fish.value * multiplier),
            exp: type === 'trash' ? 1 :
                 type === 'common' ? 5 :
                 type === 'uncommon' ? 10 :
                 type === 'rare' ? 20 :
                 type === 'legendary' ? 50 : 100
        };
    },

    loadAllPlayers: function() {
        const dataPath = path.join(__dirname, '../database/fishing.json');
        try {
            if (fs.existsSync(dataPath)) {
                return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading all players:", err);
        }
        return {};
    }
};