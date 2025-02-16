const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const fishingItems = require('../config/fishing/items');
const fishTypes = require('../config/fishing/fish');
const locations = require('../config/fishing/locations');
const { 
    treasures, 
    specialEvents, 
    expMultipliers, 
    levelRewards, 
    defaultCollection,
    expRequirements,
    streakBonuses 
} = require('../config/fishing/constants');
const { getVIPBenefits } = require('../utils/vipCheck');

const levelRequirements = {
    pond: 1,       
    river: 3,      
    ocean: 5,     
    deepSea: 10,
    abyss: 20,      
    atlantis: 50, 
    spaceOcean: 100, 
    dragonRealm: 200 
};

function formatNumber(number) {
    if (number === undefined || number === null) return "0";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


const messages = {
    cooldown: (waitTime, lastTime) => 
        `⏳ Bạn cần đợi ${waitTime} giây nữa mới có thể câu tiếp!\n` +
        `⌚ Thời gian câu lần cuối: ${lastTime}`,
    levelUp: level => `🎉 Chúc mừng đạt cấp ${level}!`,
    rodBroken: rod => `⚠️ Cần câu cũ đã hỏng! Tự động chuyển sang ${rod}!`,
    insufficientFunds: (cost, location) => 
        `❌ Bạn cần ${formatNumber(cost)} xu để câu ở ${location}!`
};

function calculateRequiredExp(level) {
    const { baseExp, multiplierPerLevel } = require('../config/fishing/constants').expRequirements;
    return Math.floor(baseExp * Math.pow(multiplierPerLevel, level - 1));
}

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
        const allData = this.loadAllPlayers();
        
        const now = Date.now();
        const vipBenefits = getVIPBenefits(senderID);
        const COOLDOWN = vipBenefits?.fishingCooldown || 360000;
        
        let cooldownMsg = "";
        if (allData[senderID]?.lastFished && now - allData[senderID].lastFished < COOLDOWN) {
            const waitTime = Math.ceil((COOLDOWN - (now - allData[senderID].lastFished)) / 1000);
            cooldownMsg = `⏳ Chờ ${waitTime} giây nữa mới có thể câu tiếp!\n`;
        }
        
        const menu = "🎣 MENU CÂU CÁ 🎣\n━━━━━━━━━━━━━━━━━━\n" +
            `${cooldownMsg}` +
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

        if (!fishingItems || typeof fishingItems !== 'object') {
            console.error("Invalid fishingItems configuration");
            return null;
        }

        if (!fishingItems["Cần trúc"]) {
            fishingItems["Cần trúc"] = {
                durability: 10,
                price: 0,
                multiplier: 1
            };
        }

        const defaultRod = {
            name: "Cần trúc",
            durability: fishingItems["Cần trúc"].durability,
            inventory: ["Cần trúc"]
        };

    
        if (!data[userID] || !data[userID].rod) {
            data[userID] = {
                rod: defaultRod.name,
                rodDurability: defaultRod.durability,
                inventory: defaultRod.inventory,
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

        if (!fishingItems[data[userID].rod]) {
            data[userID].rod = defaultRod.name;
            data[userID].rodDurability = defaultRod.durability;
        }

        const currentRod = fishingItems[data[userID].rod];
        if (!currentRod || typeof data[userID].rodDurability !== 'number' || 
            data[userID].rodDurability < 0 || 
            data[userID].rodDurability > currentRod.durability) {
            data[userID].rod = defaultRod.name;
            data[userID].rodDurability = defaultRod.durability;
        }

        if (!Array.isArray(data[userID].inventory)) {
            data[userID].inventory = ["Cần trúc"];
        }

        data[userID].inventory = data[userID].inventory.filter(item => 
            fishingItems[item] !== undefined
        );

        if (!data[userID].inventory.includes("Cần trúc")) {
            data[userID].inventory.push("Cần trúc");
        }

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
            if (allData[senderID]?.lastFished && Date.now() - allData[senderID].lastFished < 180000) {
                const waitTime = Math.ceil((180000 - (Date.now() - allData[senderID].lastFished)) / 1000);
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
                        const now = Date.now();
                        const vipBenefits = getVIPBenefits(event.senderID);
                        const COOLDOWN = vipBenefits?.fishingCooldown || 360000;
                        
                        if (allData[event.senderID]?.lastFished && now - allData[event.senderID].lastFished < COOLDOWN) {
                            const waitTime = Math.ceil((COOLDOWN - (now - allData[event.senderID].lastFished)) / 1000);
                            return api.sendMessage(
                                messages.cooldown(waitTime, new Date(allData[event.senderID].lastFished).toLocaleTimeString()),
                                threadID
                            );
                        }

                const locationMenu = "🗺️ CHỌN ĐỊA ĐIỂM CÂU CÁ:\n━━━━━━━━━━━━━━━━━━\n" +
                            Object.entries(locations).map(([key, loc], index) => 
                                `${index + 1}. ${loc.name} [Cấp ${levelRequirements[key]}+]\n` +
                                `💰 Phí: ${formatNumber(loc.cost)} Xu\n` +
                                `${playerData.level >= levelRequirements[key] ? '✅' : '❌'} Yêu cầu: Cấp ${levelRequirements[key]}\n`
                            ).join("\n");
                        
                        const locMsg = await api.sendMessage(
                            `📊 Cấp độ của bạn: ${playerData.level}\n` +
                            `💵 Số dư: ${formatNumber(getBalance(event.senderID))} Xu\n\n` +
                            locationMenu,
                            threadID
                        );

                        setTimeout(() => {
                            api.unsendMessage(locMsg.messageID);
                        }, 20000); // Tự động gỡ sau 20 giây

                        global.client.onReply.push({
                            name: this.name,
                            messageID: locMsg.messageID,
                            author: event.senderID,
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
    
        if (!fishingItems || !playerData) {
            await api.sendMessage("❌ Lỗi cấu hình hoặc dữ liệu người chơi!", event.threadID);
            return;
        }

        if (!fishingItems[playerData.rod]) {
            playerData.rod = "Cần trúc";
            playerData.rodDurability = fishingItems["Cần trúc"].durability;
            this.savePlayerData(playerData);
            await api.sendMessage("⚠️ Đã phát hiện lỗi cần câu, đã reset về cần mặc định!", event.threadID);
        }

        const allData = this.loadAllPlayers();
        const now = Date.now();

        if (!allData[event.senderID]) {
            allData[event.senderID] = playerData;
        }

        const vipBenefits = getVIPBenefits(event.senderID);
        const COOLDOWN = vipBenefits?.fishingCooldown || 360000; 
        const vipIcon = vipBenefits ? 
            (vipBenefits.packageId === 3 ? '⭐⭐⭐' : 
             vipBenefits.packageId === 2 ? '⭐⭐' : '⭐') : '';

        const cooldownMinutes = Math.ceil(COOLDOWN / 60000);

        if (allData[event.senderID].lastFished && now - allData[event.senderID].lastFished < COOLDOWN) {
            const waitTime = Math.ceil((COOLDOWN - (now - allData[event.senderID].lastFished)) / 1000);
            return api.sendMessage(
                messages.cooldown(waitTime, new Date(allData[event.senderID].lastFished).toLocaleTimeString()),
                event.threadID
            );
        }

        const levelRequirements = {
            pond: 1,
            river: 3,
            ocean: 5,
            deepSea: 10,
            abyss: 20,
            atlantis: 50,
            spaceOcean: 100,
            dragonRealm: 200
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

            setTimeout(() => {
                api.unsendMessage(errorMsg.messageID);
            }, 20000); // Tự động gỡ sau 20 giây

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
            return playerData.inventory.includes(rod) && 
                   fishingItems[rod] && 
                   fishingItems[rod].durability > 0;
        });

        if (availableRods.length === 0) {
  
            playerData.rod = "Cần trúc";
            playerData.rodDurability = fishingItems["Cần trúc"].durability;
            playerData.inventory = ["Cần trúc"];
            this.savePlayerData(playerData);
            return api.sendMessage("⚠️ Đã reset về cần câu mặc định do không có cần câu khả dụng!", event.threadID);
        }

        if (!fishingItems[playerData.rod] || playerData.rodDurability <= 0) {
            const bestRod = availableRods[0];
            playerData.rod = bestRod;
            playerData.rodDurability = fishingItems[bestRod].durability;
            await api.sendMessage(`🎣 Tự động chuyển sang ${bestRod} do cần hiện tại không khả dụng!`, event.threadID);
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
                let streakBonus = 0;
                
                const streak = playerData.fishingStreak || 0;
                for (const [streakThreshold, bonus] of Object.entries(streakBonuses)) {
                    if (streak >= parseInt(streakThreshold)) {
                        streakBonus = bonus;
                    }
                }

                baseExp = Math.floor(baseExp * (1 + streakBonus));

                if (treasures.some(t => t.name === result.name)) {
                    baseExp *= 2;
                }

                playerData.exp = (playerData.exp || 0) + baseExp;
                const oldLevel = playerData.level;
                
                while (playerData.exp >= calculateRequiredExp(playerData.level)) {
                    playerData.exp -= calculateRequiredExp(playerData.level);
                    if (playerData.level < expRequirements.maxLevel) {
                        playerData.level++;
                        await api.sendMessage(messages.levelUp(playerData.level), event.threadID);
                        
                        if (levelRewards[playerData.level]) {
                            const reward = levelRewards[playerData.level];
                            updateBalance(event.senderID, reward.reward);
                            await api.sendMessage(reward.message, event.threadID);
                        }
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

                const vipBonus = vipBenefits ? 
                    `✨ Thưởng EXP VIP x${vipBenefits.fishExpMultiplier || 1}\n` +
                    `👑 Thưởng xu VIP +${(vipBenefits.packageId * 5) || 0}%\n` : '';

                api.unsendMessage(fishingMsg.messageID);
                await api.sendMessage(
                    `🎣 Bạn đã câu được ${result.name}!\n` +
                    `💰 Giá gốc: ${formatNumber(result.originalValue)} Xu\n` +
                    `📋 Thuế: ${formatNumber(result.taxAmount)} Xu (${(result.taxRate * 100).toFixed(1)}%)\n` +
                    `💵 Thực nhận: ${formatNumber(result.value)} Xu\n` +
                    `${vipBonus}` + 
                    `📊 EXP: +${formatNumber(baseExp)} (${this.getExpBreakdown(baseExp, streakBonus, rarity)})\n` +
                    `📈 Chuỗi câu: ${playerData.fishingStreak} lần (${Math.floor(streakBonus * 100)}% bonus)\n` +
                    `🎚️ Level: ${oldLevel}${playerData.level > oldLevel ? ` ➜ ${playerData.level}` : ''}\n` +
                    `✨ EXP: ${formatNumber(playerData.exp)}/${formatNumber(calculateRequiredExp(playerData.level))}\n` +
                    `🎒 Độ bền cần: ${playerData.rodDurability}/${fishingItems[playerData.rod].durability}\n` +
                    `💵 Số dư: ${formatNumber(getBalance(event.senderID))} Xu\n` +
                    `⏳ Chờ ${cooldownMinutes} phút để câu tiếp!`,
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
            const vipBenefits = getVIPBenefits(playerData.userID);
      
            const expMultiplier = vipBenefits.fishExpMultiplier > 1 ? 
                vipBenefits.fishExpMultiplier : 1;

            const random = Math.random() * 100;
            const vipMultiplier = vipBenefits?.fishExpMultiplier || 1;
            
            const vipBonus = vipBenefits ? (vipBenefits.packageId * 0.02) : 0;

            let chances = {
                trash: location.fish.trash || 0,
                common: location.fish.common || 0,
                uncommon: location.fish.uncommon || 0,
                rare: location.fish.rare || 0,
                legendary: location.fish.legendary || 0,
                mythical: location.fish.mythical || 0
            };
                
            if (vipBenefits) {
              
                chances.trash = Math.max(0, chances.trash * (1 - vipBenefits.trashReduction));
                
                const rareBonus = 0.1 + (vipBenefits.packageId * 0.15); 
                chances.rare *= (1 + rareBonus);
                chances.legendary *= (1 + rareBonus);
                chances.mythical *= (1 + rareBonus);

                chances.common *= (1 - rareBonus * 0.3);
                chances.uncommon *= (1 - rareBonus * 0.2);
            }

            const total = Object.values(chances).reduce((a, b) => a + b, 0);
            for (let type in chances) {
                chances[type] = (chances[type] / total) * 100;
            }

            let currentProb = 0;
            let type = 'common'; 
            for (const [fishType, chance] of Object.entries(chances)) {
                currentProb += chance;
                if (random <= currentProb) {
                    type = fishType;
                    break;
                }
            }

            const treasureChance = 0.05 + (vipBenefits ? 0.02 * vipBenefits.packageId : 0);
            if (Math.random() < treasureChance) {
                const treasure = treasures[Math.floor(Math.random() * treasures.length)];
                const originalValue = Math.floor(treasure.value * multiplier);
                const taxRate = this.calculateTaxRate('legendary', originalValue);
                const taxAmount = Math.floor(originalValue * taxRate);
                const finalValue = Math.floor(originalValue * (1 + (vipBonus || 0)) - taxAmount);
                const exp = Math.floor(50 * (vipBenefits?.fishExpMultiplier || 1));
                return {
                    name: treasure.name,
                    value: finalValue,
                    exp: exp,
                    taxRate: taxRate,
                    taxAmount: taxAmount,
                    originalValue: originalValue
                };
            }

            const fishArray = Array.isArray(fishTypes[type]) ? fishTypes[type] : [];
            if (!fishArray.length) {
                return {
                    name: "Cá Thường",
                    value: 1000,
                    exp: 5
                };
            }

            const fish = fishArray[Math.floor(Math.random() * fishArray.length)];
            const baseExp = type === 'trash' ? 1 :
                type === 'common' ? 5 :
                type === 'uncommon' ? 10 :
                type === 'rare' ? 20 :
                type === 'legendary' ? 50 : 100;

            const baseValue = fish.value * multiplier * (1 + vipBonus);
            const taxRate = this.calculateTaxRate(type, baseValue);
            const taxAmount = Math.floor(baseValue * taxRate);
            const finalValue = Math.floor(baseValue - taxAmount);

            return {
                name: fish.name,
                value: finalValue || 1000,
                exp: Math.floor(baseExp * (vipBenefits?.fishExpMultiplier || 1)) || 5,
                taxRate: taxRate,
                taxAmount: taxAmount,
                originalValue: baseValue
            };

        } catch (error) {
            console.error("Error in calculateCatch:", error);
            return {
                name: "Cá Thường",
                value: 1000,
                exp: 5,
                taxRate: 0,
                taxAmount: 0,
                originalValue: 1000
            };
        }
    },

    calculateTaxRate: function(type, value) {
    
        const baseTaxRates = {
            trash: 0,
            common: 0.02,  
            uncommon: 0.04, 
            rare: 0.6,    
            legendary: 0.8,
            mythical: 0.12   
        };

        let progressiveTax = 0;
        if (value > 1000000) progressiveTax = 0.02;   
        if (value > 5000000) progressiveTax = 0.5;     
        if (value > 10000000) progressiveTax = 0.8;   

        return Math.min(0.05, (baseTaxRates[type] || 0.01) + progressiveTax);
    },

    getFishRarity: function(fishName) {
        for (const [rarity, fishes] of Object.entries(fishTypes)) {
            if (fishes.some(fish => fish.name === fishName)) return rarity;
        }
        return 'common';
    },

    getExpBreakdown: function(totalExp, streakBonus, rarity) {
        try {
            if (!totalExp || !expMultipliers[rarity]) {
                return `Cơ bản: ${formatNumber(totalExp || 0)}`;
            }

            const multiplier = expMultipliers[rarity] || 1;
            const streak = streakBonus || 0;
            const base = Math.floor(totalExp / ((1 + streak) * multiplier));

            return `Cơ bản: ${formatNumber(base)} × ${multiplier} (${rarity}) × ${(1 + streak).toFixed(1)} (chuỗi)`;
        } catch (error) {
            console.error("Error in getExpBreakdown:", error);
            return `Cơ bản: ${formatNumber(totalExp || 0)}`;
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
            
            if (!userData.inventory.includes(rodName)) {                userData.inventory.push(rodName);
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

        if (!fishingItems || !fishingItems["Cần trúc"]) {
            throw new Error("fishingItems configuration is missing or invalid");
        }

        playerData.exp = playerData.exp || 0;
        playerData.level = playerData.level || 1;
        playerData.rod = fishingItems[playerData.rod] ? playerData.rod : "Cần trúc";
        playerData.inventory = Array.isArray(playerData.inventory) ? playerData.inventory : ["Cần trúc"];

        playerData.inventory = playerData.inventory.filter(item => fishingItems[item]);
        if (!playerData.inventory.includes("Cần trúc")) {
            playerData.inventory.push("Cần trúc");
        }

        const maxDurability = fishingItems[playerData.rod]?.durability || fishingItems["Cần trúc"].durability;
        if (typeof playerData.rodDurability !== 'number' || 
            playerData.rodDurability < 0 || 
            playerData.rodDurability > maxDurability) {
            playerData.rodDurability = maxDurability;
        }

        playerData.exp = Math.max(0, playerData.exp);
        playerData.level = Math.max(1, playerData.level);
        playerData.rodDurability = Math.max(0, playerData.rodDurability);

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