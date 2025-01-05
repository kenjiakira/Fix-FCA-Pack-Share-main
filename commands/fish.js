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
            mythical: 0.1,
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

const expMultipliers = {
    trash: 1,
    common: 2,
    uncommon: 4,
    rare: 8,
    legendary: 16,
    mythical: 32
};

const levelRewards = {
    5: { reward: 10000, message: "🎉 Đạt cấp 5! Nhận 10,000 xu" },
    10: { reward: 50000, message: "🎉 Đạt cấp 10! Nhận 50,000 xu" },
    20: { reward: 200000, message: "🎉 Đạt cấp 20! Nhận 200,000 xu" },
    50: { reward: 1000000, message: "🎉 Đạt cấp 50! Nhận 1,000,000 xu" },
};

const defaultCollection = {
    byRarity: {
        trash: {},
        common: {},
        uncommon: {},
        rare: {},
        legendary: {},
        mythical: {}
    },
    stats: {
        totalCaught: 0,
        totalValue: 0,
        bestCatch: { name: "", value: 0 }
    }
};

const messages = {
    cooldown: (waitTime, lastTime) => 
        `⏳ Bạn cần đợi ${waitTime} giây nữa mới có thể câu tiếp!\n` +
        `⌚ Thời gian câu lần cuối: ${lastTime}`,
    levelUp: level => `🎉 Chúc mừng đạt cấp ${level}!`,
    rodBroken: rod => `⚠️ Cần câu cũ đã hỏng! Tự động chuyển sang ${rod}!`,
    insufficientFunds: (cost, location) => 
        `❌ Bạn cần ${formatNumber(cost)} xu để câu ở ${location}!`
};

module.exports = {
    name: "fish",
    dev: "HNT",
    info: "Câu cá kiếm xu",
    usages: "fish",
    usedby: 0,
    cooldowns: 0, 
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
        const dataPath = path.join(__dirname, '../database/json/fishing.json');
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
                rod: "Cần trúc", 
                rodDurability: fishingItems["Cần trúc"].durability, 
                inventory: ["Cần trúc"],
                collection: defaultCollection,
                exp: 0,
                level: 1,
                fishingStreak: 0,
                stats: {
                    totalExp: 0,
                    highestStreak: 0,
                    totalFishes: 0
                },
                activeBuffs: {},
                lastFished: 0,
                userID: userID 
            };
        }

        if (!data[userID].inventory) data[userID].inventory = ["Cần trúc"];
        if (!data[userID].collection?.byRarity) data[userID].collection = defaultCollection;
        if (!data[userID].stats) data[userID].stats = { totalExp: 0, highestStreak: 0, totalFishes: 0 };

        data[userID] = this.validatePlayerStats(data[userID]);
        return data[userID];
    },

    savePlayerData: function(data) {
        const dataPath = path.join(__dirname, '../database/json/fishing.json');
        try {
         
            let existingData = {};
            if (fs.existsSync(dataPath)) {
                existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }
            
            if (data.rod && data.inventory) { 
                existingData[data.userID] = data;
            } else {
                Object.entries(data).forEach(([userID, userData]) => {
                    existingData[userID] = userData;
                });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
        } catch (err) {
            console.error("Error saving fishing data:", err);
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const reply = global.client.onReply.find(r => r.messageID === event.messageReply.messageID && r.author === senderID);
        if (!reply) return;

        if (reply.type !== "menu") {
            global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);
        }
        
        const allData = this.loadAllPlayers();
        const playerData = this.loadPlayerData(senderID);

        if (reply.type === "location") {
            if (allData[senderID]?.lastFished && Date.now() - allData[senderID].lastFished < 360000) {
                const waitTime = Math.ceil((360000 - (Date.now() - allData[senderID].lastFished)) / 1000);
                return api.sendMessage(
                    messages.cooldown(waitTime, new Date(allData[senderID].lastFished).toLocaleTimeString()),
                    threadID
                );
            }
        }

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
                            Object.entries(fishTypes).map(([rarity, fishes]) => {
                                const rarityFishes = playerData.collection?.byRarity[rarity] || {};
                                const caughtFishes = Object.entries(rarityFishes)
                                    .filter(([_, count]) => count > 0)
                                    .map(([fish, count]) => `• ${fish}: ${count} lần`);
                                return caughtFishes.length ? `【${rarity.toUpperCase()}】\n${caughtFishes.join('\n')}` : '';
                            }).filter(Boolean).join('\n');
                        
                        api.sendMessage(inventory, threadID);
                        break;

                    case 4: 
                        const collection = "📚 BỘ SƯU TẬP CÁ:\n━━━━━━━━━━━━━━━━━━\n\n" +
                            Object.entries(fishTypes).map(([rarity, fishes]) => {
                                const fishList = fishes.map(f => {
                                    const caught = playerData.collection?.byRarity[rarity]?.[f.name] || 0;
                                    return `${caught > 0 ? '✅' : '❌'} ${f.name} (${formatNumber(f.value)} Xu) - Đã bắt: ${caught}`;
                                }).join('\n');
                                return `【${rarity.toUpperCase()}】\n${fishList}\n`;
                            }).join('\n') +
                            `\n📊 Thống kê:\n` +
                            `Tổng số cá đã bắt: ${playerData.collection?.stats.totalCaught || 0}\n` +
                            `Tổng giá trị: ${formatNumber(playerData.collection?.stats.totalValue || 0)} Xu\n` +
                            `Bắt quý giá nhất: ${playerData.collection?.stats.bestCatch?.name || 'Chưa có'} (${formatNumber(playerData.collection?.stats.bestCatch?.value || 0)} Xu)`;
                        
                        api.sendMessage(collection, threadID);
                        break;

                    case 5: 
                        const allPlayers = this.loadAllPlayers();
                        const rankings = this.getRankingStats(allPlayers);
                        const top10 = rankings.slice(0, 10);
                        
                        const userRank = rankings.findIndex(player => player.id === senderID) + 1;
                        const userStats = rankings.find(player => player.id === senderID);

                        const rankMsg = "🏆 BẢNG XẾP HẠNG CÂU CÁ 🏆\n━━━━━━━━━━━━━━━━━━\n\n" +
                            top10.map((player, index) => 
                                `${index + 1}. Hạng ${index + 1}\n` +
                                `👤 ID: ${player.id}\n` +
                                `📊 Level: ${player.level}\n` +
                                `🎣 Tổng cá: ${formatNumber(player.totalCaught)}\n` +
                                `💰 Tổng giá trị: ${formatNumber(player.totalValue)} Xu\n` +
                                `🏆 Cá quý nhất: ${player.bestCatch.name} (${formatNumber(player.bestCatch.value)} Xu)\n` +
                                `🔥 Chuỗi hiện tại: ${player.streak}\n` +
                                `⭐ Chuỗi cao nhất: ${player.highestStreak}\n`
                            ).join("━━━━━━━━━━━━━━━━━━\n") +
                            "\n👉 Thứ hạng của bạn:\n" +
                            (userStats ? 
                                `Hạng ${userRank}\n` +
                                `📊 Level: ${userStats.level}\n` +
                                `🎣 Tổng cá: ${formatNumber(userStats.totalCaught)}\n` +
                                `💰 Tổng giá trị: ${formatNumber(userStats.totalValue)} Xu\n` +
                                `🔥 Chuỗi hiện tại: ${userStats.streak}`
                                : "Chưa có dữ liệu");
                        
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
                    await this.handleShopPurchase(api, event, rodName, rodInfo, playerData);
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

        if (reply.type === "menu") {
            global.client.onReply.push({
                name: this.name,
                messageID: messageID,
                author: senderID,
                type: "menu",
                playerData
            });
        }
    },

    handleFishing: async function(api, event, location, playerData) {
        const allData = this.loadAllPlayers();
        const now = Date.now();

        if (!allData[event.senderID]) {
            allData[event.senderID] = playerData;
        }

        if (allData[event.senderID].lastFished && now - allData[event.senderID].lastFished < 360000) {
            const waitTime = Math.ceil((360000 - (now - allData[event.senderID].lastFished)) / 1000);
            return api.sendMessage(
                messages.cooldown(waitTime, new Date(allData[event.senderID].lastFished).toLocaleTimeString()),
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
            const locationMenu = "🗺️ CHỌN ĐỊA ĐIỂM CÂU CÁ:\n━━━━━━━━━━━━━━━━━━\n" +
                Object.entries(locations).map(([key, loc], index) => 
                    `${index + 1}. ${loc.name}\n💰 Phí: ${formatNumber(loc.cost)} Xu\n`
                ).join("\n");
            
            const errorMsg = await api.sendMessage(
                `❌ Bạn cần đạt cấp ${levelRequirements[locationKey]} để câu ở ${location.name}!\n` +
                `📊 Cấp độ hiện tại: ${playerData.level}\n\n` +
                locationMenu,
                event.threadID
            );

            global.client.onReply.push({
                name: this.name,
                messageID: errorMsg.messageID,
                author: event.senderID,
                type: "location",
                playerData
            });
            
            return;
        }

        const availableRods = Object.keys(fishingItems).filter(rod => {
            return playerData.inventory.includes(rod) && fishingItems[rod].durability > 0;
        });

        if (availableRods.length === 0) {
            return api.sendMessage("⚠️ Bạn không có cần câu nào khả dụng! Hãy mua cần mới.", event.threadID);
        }

        const bestRod = availableRods.reduce((best, rod) => {
            if (fishingItems[rod].multiplier > fishingItems[best].multiplier) {
                return rod;
            }
            return best;
        });

        if (bestRod !== playerData.rod) {
            playerData.rod = bestRod;
            playerData.rodDurability = fishingItems[bestRod].durability;
            await api.sendMessage(`🎣 Tự động chọn ${bestRod} để có hiệu quả tốt nhất!`, event.threadID);
        }

        if (playerData.rodDurability <= 1) {
            const nextBestRod = availableRods.find(rod => rod !== bestRod && fishingItems[rod].durability > 0);
            if (nextBestRod) {
                playerData.rod = nextBestRod;
                playerData.rodDurability = fishingItems[nextBestRod].durability;
                await api.sendMessage(messages.rodBroken(nextBestRod), event.threadID);
            }
        }

        const balance = getBalance(event.senderID);
        if (balance < location.cost) {
            return api.sendMessage(messages.insufficientFunds(location.cost, location.name), event.threadID);
        }

        updateBalance(event.senderID, -location.cost);
        const fishingMsg = await api.sendMessage("🎣 Đang câu...", event.threadID);

        setTimeout(async () => {
            try {
                const result = this.calculateCatch(location, fishingItems[playerData.rod].multiplier, playerData);
                
                playerData.lastFished = now;
                playerData.rodDurability--;

                const rarity = this.getFishRarity(result.name);

                if (!playerData.collection) {
                    playerData.collection = JSON.parse(JSON.stringify(defaultCollection));
                }

                if (!playerData.collection.byRarity[rarity][result.name]) {
                    playerData.collection.byRarity[rarity][result.name] = 0;
                }

                playerData.collection.byRarity[rarity][result.name]++;
                playerData.collection.stats.totalCaught++;
                playerData.collection.stats.totalValue += result.value;

                if (result.value > (playerData.collection.stats.bestCatch?.value || 0)) {
                    playerData.collection.stats.bestCatch = {
                        name: result.name,
                        value: result.value
                    };
                }

                let baseExp = result.exp * (expMultipliers[rarity] || 1);
                const streakBonus = Math.min((playerData.fishingStreak || 0) * 0.2, 1.0);
                baseExp = Math.floor(baseExp * (1 + streakBonus));

                if (treasures.some(t => t.name === result.name)) {
                    baseExp *= 2;
                }

                playerData.exp = (playerData.exp || 0) + baseExp;
                const oldLevel = playerData.level;

                while (playerData.exp >= playerData.level * 1000) {
                    playerData.exp -= playerData.level * 1000;
                    playerData.level++;
                    
                    await api.sendMessage(messages.levelUp(playerData.level), event.threadID);
                    if (levelRewards[playerData.level]) {
                        const reward = levelRewards[playerData.level];
                        updateBalance(event.senderID, reward.reward);
                        await api.sendMessage(reward.message, event.threadID);
                    }
                }

                if (now - (playerData.lastFished || 0) < 520000) {
                    playerData.fishingStreak = (playerData.fishingStreak || 0) + 1;
                } else {
                    playerData.fishingStreak = 1;
                }

                playerData.stats.totalExp = (playerData.stats.totalExp || 0) + baseExp;
                playerData.stats.highestStreak = Math.max(playerData.stats.highestStreak || 0, playerData.fishingStreak);
                playerData.stats.totalFishes = (playerData.stats.totalFishes || 0) + 1;

                this.savePlayerData({
                    ...playerData,
                    userID: event.senderID
                });

                updateBalance(event.senderID, result.value);

                api.unsendMessage(fishingMsg.messageID);
                await api.sendMessage(
                    `🎣 Bạn đã câu được ${result.name}!\n` +
                    `💰 Giá trị: ${formatNumber(result.value)} Xu\n` +
                    `📊 EXP: +${formatNumber(baseExp)} (${this.getExpBreakdown(baseExp, streakBonus, rarity)})\n` +
                    `📈 Chuỗi câu: ${playerData.fishingStreak} lần (${Math.floor(streakBonus * 100)}% bonus)\n` +
                    `🎚️ Level: ${oldLevel}${playerData.level > oldLevel ? ` ➜ ${playerData.level}` : ''}\n` +
                    `✨ EXP: ${formatNumber(playerData.exp)}/${formatNumber(playerData.level * 1000)}\n` +
                    `🎒 Độ bền cần: ${playerData.rodDurability}/${fishingItems[playerData.rod].durability}\n` +
                    `💵 Số dư: ${formatNumber(getBalance(event.senderID))} Xu\n` +
                    `⏳ Chờ 12 phút để câu tiếp!`,
                    event.threadID
                );

            } catch (err) {
                console.error("Error in fishing:", err);
                api.sendMessage("❌ Đã xảy ra lỗi khi câu cá!", event.threadID);
            }
        }, 5000);
    },

    calculateCatch: function(location, multiplier, playerData) {
        try {
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
        } catch (error) {
            console.error("Error in calculateCatch:", error);
            return {
                name: "Rác",
                value: 100,
                exp: 1
            };
        }
    },

    getFishRarity: function(fishName) {
        for (const [rarity, fishes] of Object.entries(fishTypes)) {
            if (fishes.some(fish => fish.name === fishName)) return rarity;
        }
        return 'common';
    },

    getExpBreakdown: function(totalExp, streakBonus, rarity) {
        try {
            const base = Math.floor(totalExp / (1 + streakBonus) / expMultipliers[rarity]);
            return `Cơ bản: ${formatNumber(base)} × ${expMultipliers[rarity]} (${rarity}) × ${(1 + streakBonus).toFixed(1)} (chuỗi)`;
        } catch (error) {
            return `Cơ bản: ${formatNumber(totalExp)}`;
        }
    },

    loadAllPlayers: function() {
        const dataPath = path.join(__dirname, '../database/json/fishing.json');
        try {
            if (fs.existsSync(dataPath)) {
                return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading all players:", err);
        }
        return {};
    },

    addToInventory: function(playerData, itemName) {
        if (!playerData.inventory) playerData.inventory = [];
        if (!playerData.inventory.includes(itemName)) {
            playerData.inventory.push(itemName);
        }
    },

    handleShopPurchase: async function(api, event, rodName, rodInfo, playerData) {
        const { senderID, threadID } = event;
        const balance = getBalance(senderID);
        
        if (balance < rodInfo.price) {
            return api.sendMessage(`❌ Bạn không đủ tiền mua ${rodName}!`, threadID);
        }

        try {
            updateBalance(senderID, -rodInfo.price);
            
            const userData = {
                ...playerData,
                userID: senderID,
                rod: rodName,
                rodDurability: rodInfo.durability
            };
            
            if (!userData.inventory.includes(rodName)) {
                userData.inventory.push(rodName);
            }

            this.savePlayerData(userData);

            return api.sendMessage(
                `✅ Đã mua thành công ${rodName}!\n` +
                `💰 Số dư còn lại: ${formatNumber(getBalance(senderID))} Xu`,
                threadID
            );
        } catch (err) {
            console.error("Error in shop purchase:", err);
            return api.sendMessage("❌ Đã xảy ra lỗi khi mua cần câu!", threadID);
        }
    },

    validatePlayerStats: function(playerData) {
        if (!playerData.exp) playerData.exp = 0;
        if (!playerData.level) playerData.level = 1;
        if (playerData.exp < 0) playerData.exp = 0;
        if (playerData.level < 1) playerData.level = 1;
        return playerData;
    },

    getRankingStats: function(allPlayers) {
        return Object.entries(allPlayers)
            .map(([id, data]) => ({
                id,
                level: data.level || 1,
                exp: data.exp || 0,
                totalCaught: Object.values(data.collection?.byRarity || {})
                    .reduce((acc, curr) => acc + Object.values(curr).reduce((a, b) => a + b, 0), 0),
                totalValue: data.collection?.stats?.totalValue || 0,
                bestCatch: data.collection?.stats?.bestCatch || { name: "Chưa có", value: 0 },
                streak: data.fishingStreak || 0,
                highestStreak: data.stats?.highestStreak || 0
            }))
            .sort((a, b) => b.level - a.level || b.exp - a.exp);
    },
};