const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const MINING_DATA_FILE = path.join(__dirname, './json/mining_data.json');
const MARKET_DATA_FILE = path.join(__dirname, './json/market_data.json');

const CONFIG = {
    baseMiner: {
        power: 1,
        consumption: 0.5,
        durability: 100,
        maxDurability: 100,
        repairCost: 100000  // Base repair cost
    },
    
    upgradeCosts: {
        power: [100000, 200000, 400000, 800000, 1600000],
        efficiency: [150000, 300000, 600000, 1200000, 2400000],
        cooling: [200000, 400000, 800000, 1600000, 3200000]
    },

    miningSuccess: {
        base: 0.7,
        perPowerLevel: 0.05,
        perCoolingLevel: 0.03,
        criticalChance: 0.1,  // 10% critical chance
        criticalMultiplier: 2  // 2x reward on critical
    },

    miningCooldown: 5 * 60 * 1000,
    
    market: {
        basePrice: 100,
        volatility: 0.2,
        updateInterval: 15 * 60 * 1000
    },

    dailyQuests: {
        types: ['mine', 'upgrade', 'market'],
        rewards: {
            mine: 500,
            upgrade: 1000,
            market: 750
        }
    }
};

function initializeData() {
    let miningData = {};
    let marketData = {
        price: CONFIG.market.basePrice,
        lastUpdate: Date.now(),
        history: []
    };

    if (fs.existsSync(MINING_DATA_FILE)) {
        miningData = JSON.parse(fs.readFileSync(MINING_DATA_FILE));
    }
    if (fs.existsSync(MARKET_DATA_FILE)) {
        marketData = JSON.parse(fs.readFileSync(MARKET_DATA_FILE));
    }

    return { miningData, marketData };
}

function saveData(miningData, marketData) {
    fs.writeFileSync(MINING_DATA_FILE, JSON.stringify(miningData, null, 2));
    fs.writeFileSync(MARKET_DATA_FILE, JSON.stringify(marketData, null, 2));
}

function initializePlayer(userId) {
    return {
        miner: { ...CONFIG.baseMiner },
        coins: 0,
        upgrades: {
            power: 0,
            efficiency: 0,
            cooling: 0
        },
        lastMining: 0,
        stats: {
            totalMined: 0,
            successfulMines: 0,
            failedMines: 0
        },
        quests: {
            daily: {
                type: null,
                progress: 0,
                target: 0,
                lastReset: 0
            }
        },
        settings: {
            autoSell: false  // Default auto-sell setting
        }
    };
}

function updateMarketPrice(marketData) {
    const timePassed = Date.now() - marketData.lastUpdate;
    if (timePassed >= CONFIG.market.updateInterval) {
        const change = (Math.random() - 0.5) * 2 * CONFIG.market.volatility;
        const newPrice = Math.max(50, marketData.price * (1 + change));
        marketData.history.push({
            price: marketData.price,
            timestamp: Date.now()
        });
        if (marketData.history.length > 24) {
            marketData.history.shift();
        }
        marketData.price = Math.round(newPrice);
        marketData.lastUpdate = Date.now();
    }
    return marketData;
}

function calculateMiningSuccess(player) {
    const base = CONFIG.miningSuccess.base;
    const powerBonus = player.upgrades.power * CONFIG.miningSuccess.perPowerLevel;
    const coolingBonus = player.upgrades.cooling * CONFIG.miningSuccess.perCoolingLevel;
    return Math.min(0.95, base + powerBonus + coolingBonus);
}

function calculateMiningReward(player) {
    const basePower = CONFIG.baseMiner.power;
    const powerMultiplier = 1 + (player.upgrades.power * 0.2);
    const efficiencyMultiplier = 1 + (player.upgrades.efficiency * 0.15);
    
    // Calculate base reward with higher multiplier
    const baseReward = Math.round(basePower * powerMultiplier * efficiencyMultiplier * 100);
    
    // Add randomness for more excitement (50% - 150% of base)
    const randomFactor = 0.5 + Math.random();
    
    // Return the final reward between 100-3000 based on upgrades and randomness
    return Math.max(100, Math.min(3000, Math.round(baseReward * randomFactor)));
}

function checkAndUpdateQuests(player) {
    const now = Date.now();
    const daysPassed = Math.floor((now - player.quests.daily.lastReset) / (24 * 60 * 60 * 1000));
    
    if (daysPassed >= 1 || !player.quests.daily.type) {
        const questTypes = CONFIG.dailyQuests.types;
        const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
        player.quests.daily = {
            type: randomType,
            progress: 0,
            target: randomType === 'mine' ? 10 : 3,
            lastReset: now
        };
    }
    
    return player;
}

module.exports = {
    name: "coin",
    dev: "HNT",
    category: "Games",
    info: "Trò chơi đào coin",
    usage: ".coin [mine/info/upgrade/market/sell/buy/quest]",
    onPrefix: true,
    cooldowns: 0,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        let { miningData, marketData } = initializeData();
        
        if (!miningData[senderID]) {
            miningData[senderID] = initializePlayer(senderID);
        }

        marketData = updateMarketPrice(marketData);

        const player = miningData[senderID];
        player.miner = player.miner || { ...CONFIG.baseMiner };
        
        miningData[senderID] = checkAndUpdateQuests(player);

        if (!target[0]) {
            return api.sendMessage(
                "🎮 COIN MINING GAME 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "📌 Lệnh có sẵn:\n" +
                "1. mine - Đào coin\n" +
                "2. info - Thông tin máy đào\n" +
                "3. upgrade - Nâng cấp máy đào\n" +
                "4. market - Xem thị trường\n" +
                "5. sell [amount] - Bán coin\n" +
                "6. buy [amount] - Mua coin\n" +
                "7. quest - Nhiệm vụ hàng ngày\n" +
                "8. autosell [on/off] - Tự động bán coin\n\n" +
                `💰 Số coin đã đào: ${player.coins}\n` +
                `💎 Giá coin hiện tại: ${marketData.price} $`,
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        const amount = parseInt(target[1]);

        switch (command) {
            case "mine":
                const cooldownTime = CONFIG.miningCooldown - (Date.now() - player.lastMining);
                if (cooldownTime > 0) {
                    return api.sendMessage(
                        `⏳ Vui lòng đợi ${Math.ceil(cooldownTime / 1000)} giây nữa!`,
                        threadID, messageID
                    );
                }

                if (player.miner.durability <= 0) {
                    const repairCost = Math.ceil(CONFIG.baseMiner.repairCost * (1 + player.upgrades.power * 0.2));
                    return api.sendMessage(
                        "🔧 Máy đào của bạn đã hỏng!\n" +
                        `💰 Chi phí sửa chữa: ${repairCost} $\n` +
                        "Sử dụng: .coin repair để sửa máy",
                        threadID, messageID
                    );
                }

                const miningSuccess = Math.random() < calculateMiningSuccess(player);
                if (miningSuccess) {
                    const baseReward = calculateMiningReward(player);
                    const isCritical = Math.random() < CONFIG.miningSuccess.criticalChance;
                    const reward = isCritical ? baseReward * CONFIG.miningSuccess.criticalMultiplier : baseReward;
                    
                    player.coins += reward;
                    player.stats.totalMined += reward;
                    player.stats.successfulMines++;
                    
                    if (player.quests.daily.type === 'mine') {
                        player.quests.daily.progress++;
                    }

                    let message = [
                        "⛏️ Đào coin thành công!",
                        isCritical ? "✨ CRITICAL HIT! x2 REWARDS ✨" : "",
                        `💎 Đào được: ${reward} coin (Giá: ${marketData.price} $ mỗi coin)`,
                        `💰 Tổng coin: ${player.coins}`,
                        `🔋 Độ bền máy: ${Math.round(player.miner.durability)}%`,
                        `⚡ Hiệu suất: ${Math.round(calculateMiningSuccess(player) * 100)}%`
                    ].filter(Boolean).join('\n');

                    if (player.settings && player.settings.autoSell && reward > 0) {
                        const sellValue = Math.floor(reward * marketData.price);
                        player.coins -= reward;  
                        await updateBalance(senderID, sellValue);
                        
                        if (player.quests.daily.type === 'market') {
                            player.quests.daily.progress++;
                        }

                        message += "\n\n" + [
                            "🔄 TỰ ĐỘNG BÁN COIN 🔄",
                            `📤 Đã bán: ${reward} coin`,
                            `💵 Nhận được: ${sellValue} $`,
                            `💎 Coin còn lại: ${player.coins}`
                        ].join('\n');
                    }

                    api.sendMessage(message, threadID, messageID);
                } else {
                    player.stats.failedMines++;
                    api.sendMessage(
                        "❌ Đào coin thất bại!\n" +
                        "📝 Nguyên nhân có thể do:\n" +
                        "- Máy đào quá nóng\n" +
                        "- Hiệu suất thấp\n" +
                        "- Thiếu may mắn",
                        threadID, messageID
                    );
                }

                player.miner.durability = Math.max(0, player.miner.durability - CONFIG.baseMiner.consumption);
                player.lastMining = Date.now();
                break;

            case "repair":
                if (player.miner.durability >= CONFIG.baseMiner.maxDurability) {
                    return api.sendMessage("✅ Máy đào của bạn vẫn còn tốt!", threadID, messageID);
                }

                const repairCost = Math.ceil(CONFIG.baseMiner.repairCost * (1 + player.upgrades.power * 0.2));
                const balance = await getBalance(senderID);
                
                if (balance < repairCost) {
                    return api.sendMessage(
                        `❌ Bạn cần ${repairCost} $ để sửa máy!`,
                        threadID, messageID
                    );
                }

                await updateBalance(senderID, -repairCost);
                player.miner.durability = CONFIG.baseMiner.maxDurability;

                api.sendMessage(
                    "🔧 Sửa chữa máy thành công!\n" +
                    `💰 Chi phí: ${repairCost} $\n` +
                    "✅ Đã phục hồi độ bền về 100%",
                    threadID, messageID
                );
                break;

            case "info":
                const efficiency = Math.round((1 + player.upgrades.efficiency * 0.15) * 100);
                const power = Math.round((1 + player.upgrades.power * 0.2) * 100);
                const cooling = Math.round((1 + player.upgrades.cooling * 0.1) * 100);
                
                api.sendMessage(
                    "🔧 THÔNG TIN MÁY ĐÀO 🔧\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `⚡ Công suất: ${power}%\n` +
                    `📊 Hiệu suất: ${efficiency}%\n` +
                    `❄️ Làm mát: ${cooling}%\n` +
                    `🔋 Độ bền: ${Math.round(player.miner.durability)}%\n\n` +
                    "📈 THỐNG KÊ ĐÀO COIN\n" +
                    `💎 Tổng đã đào: ${player.stats.totalMined}\n` +
                    `✅ Thành công: ${player.stats.successfulMines}\n` +
                    `❌ Thất bại: ${player.stats.failedMines}\n` +
                    `⚜️ Tỷ lệ: ${Math.round((player.stats.successfulMines / (player.stats.successfulMines + player.stats.failedMines || 1)) * 100)}%\n\n` +
                    "⚙️ CÀI ĐẶT\n" +
                    `🔄 Tự động bán: ${player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"}\n` +
                    `💎 Giá coin hiện tại: ${marketData.price} $`,
                    threadID, messageID
                );
                break;

            case "upgrade":
                if (!target[1]) {
                    return api.sendMessage(
                        "⚙️ NÂNG CẤP MÁY ĐÀO ⚙️\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "📌 Các loại nâng cấp:\n" +
                        `1. power - Tăng sức mạnh (${CONFIG.upgradeCosts.power[player.upgrades.power] || 'Đã tối đa'} $)\n` +
                        `2. efficiency - Tăng hiệu suất (${CONFIG.upgradeCosts.efficiency[player.upgrades.efficiency] || 'Đã tối đa'} $)\n` +
                        `3. cooling - Tăng làm mát (${CONFIG.upgradeCosts.cooling[player.upgrades.cooling] || 'Đã tối đa'} $)\n\n` +
                        "Cấp độ hiện tại:\n" +
                        `⚡ Power: ${player.upgrades.power}/5\n` +
                        `📊 Efficiency: ${player.upgrades.efficiency}/5\n` +
                        `❄️ Cooling: ${player.upgrades.cooling}/5\n\n` +
                        "Sử dụng: .coin upgrade [loại]",
                        threadID, messageID
                    );
                }

                const upgradeType = target[1].toLowerCase();
                const validTypes = ['power', 'efficiency', 'cooling'];
                
                if (!validTypes.includes(upgradeType)) {
                    return api.sendMessage("❌ Loại nâng cấp không hợp lệ!", threadID, messageID);
                }

                const currentLevel = player.upgrades[upgradeType];
                const upgradeCost = CONFIG.upgradeCosts[upgradeType][currentLevel];
                
                if (!upgradeCost) {
                    return api.sendMessage(
                        "❌ Đã đạt cấp độ tối đa!\n" +
                        `📊 ${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)}: ${currentLevel}/5`,
                        threadID, messageID
                    );
                }

                const playerBalance = await getBalance(senderID);
                if (playerBalance < upgradeCost) {
                    return api.sendMessage(
                        `❌ Không đủ tiền để nâng cấp!\n` +
                        `💰 Số dư: ${playerBalance} $\n` +
                        `💵 Cần thêm: ${upgradeCost - playerBalance} $`,
                        threadID, messageID
                    );
                }

                await updateBalance(senderID, -upgradeCost);
                player.upgrades[upgradeType]++;
                
                if (player.quests.daily.type === 'upgrade') {
                    player.quests.daily.progress++;
                }

                const upgradeEffects = {
                    power: "⚡ Tăng sức mạnh đào +20%",
                    efficiency: "📊 Tăng hiệu suất +15%",
                    cooling: "❄️ Tăng khả năng làm mát +10%"
                };

                api.sendMessage(
                    "🔨 Nâng cấp thành công!\n" +
                    `📈 ${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)}: ${currentLevel} → ${currentLevel + 1}\n` +
                    `${upgradeEffects[upgradeType]}\n` +
                    `💰 Số dư còn lại: ${(await getBalance(senderID)).toLocaleString()} $`,
                    threadID, messageID
                );
                break;

            case "market":
                const priceChange = marketData.history.length > 0 
                    ? ((marketData.price - marketData.history[0].price) / marketData.history[0].price * 100).toFixed(2)
                    : "0.00";
                
                const trend = priceChange > 0 ? "↗️" : priceChange < 0 ? "↘️" : "➡️";
                const sentiment = priceChange > 5 ? "Rất tích cực 🚀" : 
                                 priceChange > 2 ? "Tích cực 📈" : 
                                 priceChange < -5 ? "Rất tiêu cực 📉" : 
                                 priceChange < -2 ? "Tiêu cực 🔻" : 
                                 "Ổn định 📊";
                
                let highPrice = marketData.price;
                let lowPrice = marketData.price;
                if (marketData.history.length > 0) {
                    const last24h = marketData.history.slice(-24);
                    highPrice = Math.max(...last24h.map(h => h.price), marketData.price);
                    lowPrice = Math.min(...last24h.map(h => h.price), marketData.price);
                }
                
                // Create a simple text-based price chart
                let priceChart = "📊 Diễn biến giá: ";
                if (marketData.history.length >= 5) {
                    const recentHistory = [...marketData.history.slice(-5), {price: marketData.price}];
                    const max = Math.max(...recentHistory.map(h => h.price));
                    const min = Math.min(...recentHistory.map(h => h.price));
                    const range = max - min || 1;
                    
                    recentHistory.forEach((h, i) => {
                        const normalized = Math.floor((h.price - min) / range * 5);
                        const chartSymbols = ["▁", "▂", "▃", "▄", "▅", "▆"];
                        priceChart += chartSymbols[normalized] || "▁";
                    });
                } else {
                    priceChart += "Chưa đủ dữ liệu";
                }
                
                // Trading recommendation based on trends
                const tradingTip = priceChange > 3 ? "Nên xem xét bán để lấy lợi nhuận 💰" : 
                                 priceChange < -3 ? "Có thể là thời điểm tốt để mua vào 🔍" : 
                                 "Thị trường ổn định, theo dõi thêm 👀";
                
                api.sendMessage(
                    "📊 THỊ TRƯỜNG COIN 📊\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `💎 Giá hiện tại: ${marketData.price} $ ${trend}\n` +
                    `📈 Thay đổi: ${priceChange}% (${sentiment})\n` +
                    `🔺 Cao nhất: ${highPrice} $\n` +
                    `🔻 Thấp nhất: ${lowPrice} $\n` +
                    `${priceChart}\n\n` +
                    `💡 Nhận định: ${tradingTip}\n` +
                    `⏰ Cập nhật sau: ${Math.ceil((CONFIG.market.updateInterval - (Date.now() - marketData.lastUpdate)) / 1000)}s\n\n` +
                    "💼 Giao dịch:\n" +
                    "• .coin sell [số lượng] - Bán coin\n" +
                    "• .coin buy [số lượng] - Mua coin\n" +
                    "• .coin market history - Xem lịch sử giá chi tiết",
                    threadID, messageID
                );
                break;

            case "market history":
                if (marketData.history.length === 0) {
                    return api.sendMessage("❌ Chưa có dữ liệu lịch sử giá!", threadID, messageID);
                }
                
                let historyMsg = "📜 LỊCH SỬ GIÁ COIN 📜\n━━━━━━━━━━━━━━━━━━\n\n";
                const historyEntries = [...marketData.history.slice(-10), {price: marketData.price, timestamp: Date.now()}];
                
                historyEntries.forEach((entry, index) => {
                    const time = new Date(entry.timestamp).toLocaleTimeString();
                    const prevPrice = index > 0 ? historyEntries[index - 1].price : entry.price;
                    const changeIcon = entry.price > prevPrice ? "📈" : entry.price < prevPrice ? "📉" : "📊";
                    
                    historyMsg += `${changeIcon} ${time}: ${entry.price} $\n`;
                });
                
                historyMsg += "\n💡 Sử dụng thông tin trên để đưa ra quyết định giao dịch khôn ngoan!";
                api.sendMessage(historyMsg, threadID, messageID);
                break;

            case "sell":
                if (!amount || amount <= 0) {
                    return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!", threadID, messageID);
                }

                if (amount > player.coins) {
                    return api.sendMessage("❌ Bạn không có đủ coin!", threadID, messageID);
                }

                const sellValue = Math.floor(amount * marketData.price);
                player.coins -= amount;
                await updateBalance(senderID, sellValue);
                
                if (player.quests.daily.type === 'market') {
                    player.quests.daily.progress++;
                }

                api.sendMessage(
                    "💰 Bán coin thành công!\n" +
                    `📤 Số lượng: ${amount} coin\n` +
                    `💵 Nhận được: ${sellValue} $\n` +
                    `💎 Coin còn lại: ${player.coins}`,
                    threadID, messageID
                );
                break;

            case "buy":
                if (!amount || amount <= 0) {
                    return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!", threadID, messageID);
                }

                const cost = Math.ceil(amount * marketData.price);
                const userBalance = await getBalance(senderID);
                
                if (cost > userBalance) {
                    return api.sendMessage(
                        `❌ Bạn cần ${cost} $ để mua ${amount} coin!`,
                        threadID, messageID
                    );
                }

                await updateBalance(senderID, -cost);
                player.coins += amount;
                
                if (player.quests.daily.type === 'market') {
                    player.quests.daily.progress++;
                }

                api.sendMessage(
                    "💰 Mua coin thành công!\n" +
                    `📥 Số lượng: ${amount} coin\n` +
                    `💵 Chi phí: ${cost} $\n` +
                    `💎 Coin hiện có: ${player.coins}`,
                    threadID, messageID
                );
                break;

            case "quest":
                const quest = player.quests.daily;
                const questName = {
                    mine: "Đào coin",
                    upgrade: "Nâng cấp máy",
                    market: "Giao dịch thị trường"
                }[quest.type];

                const questCompleted = quest.progress >= quest.target;
                if (questCompleted && !quest.claimed) {
                    const reward = CONFIG.dailyQuests.rewards[quest.type];
                    await updateBalance(senderID, reward);
                    quest.claimed = true;

                    api.sendMessage(
                        "🎉 HOÀN THÀNH NHIỆM VỤ 🎉\n" +
                        `💰 Phần thưởng: ${reward} $\n` +
                        "📝 Nhiệm vụ mới sẽ reset vào ngày mai!",
                        threadID, messageID
                    );
                } else {
                    api.sendMessage(
                        "📋 NHIỆM VỤ HÀNG NGÀY 📋\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `📌 Nhiệm vụ: ${questName}\n` +
                        `📊 Tiến độ: ${quest.progress}/${quest.target}\n` +
                        `💰 Phần thưởng: ${CONFIG.dailyQuests.rewards[quest.type]} $\n` +
                        (questCompleted ? "✅ Đã hoàn thành!" : "⏳ Đang thực hiện..."),
                        threadID, messageID
                    );
                }
                break;

            case "autosell":
                if (!target[1]) {
                    return api.sendMessage(
                        "⚙️ CÀI ĐẶT TỰ ĐỘNG BÁN COIN ⚙️\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `Trạng thái hiện tại: ${player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"}\n\n` +
                        "Sử dụng:\n" +
                        "• .coin autosell on - Bật tự động bán\n" +
                        "• .coin autosell off - Tắt tự động bán\n\n" +
                        "💡 Khi bật chế độ này, coin sẽ tự động được bán ngay sau khi đào thành công với giá thị trường hiện tại.",
                        threadID, messageID
                    );
                }

                const settingValue = target[1].toLowerCase();
                if (settingValue !== "on" && settingValue !== "off") {
                    return api.sendMessage("❌ Vui lòng chọn 'on' hoặc 'off'!", threadID, messageID);
                }

                // Initialize settings object if it doesn't exist
                player.settings = player.settings || {};
                player.settings.autoSell = (settingValue === "on");

                api.sendMessage(
                    `✅ Đã ${player.settings.autoSell ? "BẬT" : "TẮT"} chế độ tự động bán coin!\n\n` +
                    (player.settings.autoSell ? 
                        "Giờ đây coin sẽ tự động được bán sau mỗi lần đào thành công." : 
                        "Coin sẽ được lưu trữ sau mỗi lần đào.") +
                    `\n\n💎 Giá coin hiện tại: ${marketData.price} $`,
                    threadID, messageID
                );
                break;

            default:
                api.sendMessage("❌ Lệnh không hợp lệ!", threadID, messageID);
                break;
        }

        saveData(miningData, marketData);
    }
};
