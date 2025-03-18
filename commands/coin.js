const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const axios = require('axios');
const { createCanvas } = require('canvas');
const { Chart } = require('chart.js/auto');
const { registerables } = require('chart.js');

Chart.register(...registerables);

const MINING_DATA_FILE = path.join(__dirname, './json/mining_data.json');
const MARKET_DATA_FILE = path.join(__dirname, './json/market_data.json');

const CONFIG = {
    baseMiner: {
        power: 1,
        consumption: 0.8,
        durability: 100,
        maxDurability: 100,
        repairCost: 150000,
        miningEvents: {
            normal: ["⛏️ Đào được mạch quặng thường!", "💎 Tìm thấy mỏ nhỏ!", "🔨 Khai thác thành công!"],
            critical: ["🌟 WOW! Đào trúng mỏ lớn!", "⚡ SIÊU HIẾM! Mạch quặng nguyên chất!", "🎯 JACKPOT! Kho báu cổ đại!"],
            fail: ["💢 Máy đào quá nóng!", "💨 Bụi đá che khuất tầm nhìn!", "⚠️ Địa hình không ổn định!"]
        }
    },
    
    upgradeCosts: {
        power: [150000, 300000, 600000, 1200000, 2400000, 4800000, 9600000, 19200000, 38400000, 76800000],
        efficiency: [200000, 400000, 800000, 1600000, 3200000, 6400000, 12800000, 25600000, 51200000, 102400000],
        cooling: [250000, 500000, 1000000, 2000000, 4000000, 8000000, 16000000, 32000000, 64000000, 128000000]
    },

    miningSuccess: {
        base: 0.6,
        perPowerLevel: 0.02,
        perCoolingLevel: 0.015,
        criticalChance: 0.05,
        criticalMultiplier: 1.8
    },

    miningCooldown: 8 * 60 * 1000,
    
    market: {
        basePrice: 80,
        volatility: 0.25,
        updateInterval: 10 * 60 * 1000,
        maxPrice: 500,
        minPrice: 20,
        crashChance: 0.1
    },

    dailyQuests: {
        types: ['mine', 'upgrade', 'market'],
        rewards: {
            mine: 300,
            upgrade: 600,
            market: 450
        },
        maxDaily: 3
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
            autoSell: false
        }
    };
}

function updateMarketPrice(marketData) {
    const timePassed = Date.now() - marketData.lastUpdate;
    if (timePassed >= CONFIG.market.updateInterval) {
        let change = (Math.random() - 0.5) * 2 * CONFIG.market.volatility;
        
        if (Math.random() < CONFIG.market.crashChance) {
            change = -Math.random() * 0.5;
        }
        
        const newPrice = Math.max(
            CONFIG.market.minPrice,
            Math.min(
                CONFIG.market.maxPrice,
                marketData.price * (1 + change)
            )
        );
        
        marketData.history.push({
            price: marketData.price,
            timestamp: Date.now()
        });
        
        if (marketData.history.length > 48) {
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

function calculateMiningReward(player, isCritical = false) {
    const basePower = CONFIG.baseMiner.power;
    const powerMultiplier = 1 + (player.upgrades.power * 0.15);
    const efficiencyMultiplier = 1 + (player.upgrades.efficiency * 0.1);
    
    let baseReward = Math.round(basePower * powerMultiplier * efficiencyMultiplier * 80);
    
    const luckFactor = 0.3 + Math.random() * 1.4;
    
    if (isCritical) {
        baseReward *= CONFIG.miningSuccess.criticalMultiplier;
    }
    
    const randomBonus = 1 + (Math.random() * 0.03);
    
    const finalReward = Math.round(baseReward * luckFactor * randomBonus);
    
    return Math.max(50, Math.min(2000, finalReward));
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

async function generatePriceChart(marketData, period = "24h") {
    try {
        let historyData = [...marketData.history];
        let dataPoints = 0;
        let timeLabel = "";
        
        switch(period) {
            case "1h": dataPoints = 4; timeLabel = "1 giờ"; break;
            case "6h": dataPoints = 24; timeLabel = "6 giờ"; break;
            case "12h": dataPoints = 48; timeLabel = "12 giờ"; break;
            case "24h": default: dataPoints = historyData.length; timeLabel = "24 giờ"; break;
        }
        
        const relevantHistory = historyData.slice(-dataPoints);
        if (relevantHistory.length < 2) {
            return { success: false, message: "Chưa đủ dữ liệu lịch sử để tạo biểu đồ" };
        }
        
        relevantHistory.push({
            price: marketData.price,
            timestamp: Date.now()
        });

        const width = 1200;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#0a1929');
        bgGradient.addColorStop(0.5, '#0d2137');
        bgGradient.addColorStop(1, '#0a1929');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        const timestamps = relevantHistory.map(item => {
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        });

        const prices = relevantHistory.map(item => item.price);
        const priceChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

        const ma20 = calculateMA(prices, 20);
        const ma50 = calculateMA(prices, 50);
        const volatility = calculateVolatility(prices);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: 'Giá LCoin',
                        data: prices,
                        borderColor: priceChange >= 0 ? 'rgba(0, 255, 127, 1)' : 'rgba(255, 99, 132, 1)',
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return null;
                            
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            if (priceChange >= 0) {
                                gradient.addColorStop(0, 'rgba(0, 255, 127, 0.3)');
                                gradient.addColorStop(1, 'rgba(0, 255, 127, 0)');
                            } else {
                                gradient.addColorStop(0, 'rgba(255, 99, 132, 0.3)');
                                gradient.addColorStop(1, 'rgba(255, 99, 132, 0)');
                            }
                            return gradient;
                        },
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                    },
                    {
                        label: 'MA20',
                        data: ma20,
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1.5,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'MA50',
                        data: ma50,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1.5,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: [
                            'BIỂU ĐỒ GIÁ LCOIN',
                            `${timeLabel} - Biến động: ${volatility.toFixed(2)}% - Thay đổi: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`
                        ],
                        color: '#ffffff',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: 'Arial'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff',
                            font: {
                                family: 'Arial'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: 'Arial'
                        },
                        bodyFont: {
                            family: 'Arial'
                        },
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} $`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxRotation: 45,
                            font: {
                                family: 'Arial'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value.toLocaleString() + ' $';
                            },
                            font: {
                                family: 'Arial'
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            }
        });

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Created by HNT', width - 10, height - 10);

        const buffer = canvas.toBuffer('image/png');
        const chartPath = './commands/cache/market_chart.png';
        fs.writeFileSync(chartPath, buffer);

        return {
            success: true,
            chartPath,
            priceChange,
            highPrice: Math.max(...prices),
            lowPrice: Math.min(...prices),
            volatility
        };
    } catch (error) {
        console.error('Error generating chart:', error);
        return { success: false, message: "Lỗi khi tạo biểu đồ" };
    }
}

function calculateMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
            continue;
        }
        
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result;
}

function calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
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
                        `⏳ Vui lòng đợi ${Math.ceil(cooldownTime / 1000)} giây nữa!\n\n` +
                        "💡 Mẹo: Nâng cấp cooling để giảm thời gian chờ!",
                        threadID, messageID
                    );
                }

                if (player.miner.durability <= 0) {
                    const repairCost = Math.ceil(CONFIG.baseMiner.repairCost * (1 + player.upgrades.power * 0.2));
                    return api.sendMessage(
                        "🔧 Máy đào của bạn đã hỏng!\n" +
                        `💰 Chi phí sửa chữa: ${repairCost}$\n` +
                        "Sử dụng: .coin repair để sửa máy",
                        threadID, messageID
                    );
                }

                const miningSuccess = Math.random() < calculateMiningSuccess(player);
                if (miningSuccess) {
                    const isCritical = Math.random() < CONFIG.miningSuccess.criticalChance;
                    const reward = calculateMiningReward(player, isCritical);
                    
                    player.coins += reward;
                    player.stats.totalMined += reward;
                    player.stats.successfulMines++;
                    
                    if (player.quests.daily.type === 'mine') {
                        player.quests.daily.progress++;
                    }

                    const eventMessages = isCritical ? CONFIG.baseMiner.miningEvents.critical : CONFIG.baseMiner.miningEvents.normal;
                    const eventMessage = eventMessages[Math.floor(Math.random() * eventMessages.length)];

                    let message = [
                        `${eventMessage}\n`,
                        isCritical ? "✨ CRITICAL HIT! x2 REWARDS ✨" : "",
                        `💎 Đào được: ${reward} LCoin`,
                        `💰 Giá trị: ${Math.floor(reward * marketData.price)}$`,
                        `💎 Tổng coin: ${player.coins}`,
                        `🔋 Độ bền máy: ${Math.round(player.miner.durability)}%`,
                        `⚡ Hiệu suất: ${Math.round(calculateMiningSuccess(player) * 100)}%`
                    ].filter(Boolean).join('\n');

                    player.miningStreak = (player.miningStreak || 0) + 1;
                    if (player.miningStreak >= 5) {
                        const streakBonus = Math.floor(reward * 0.1);
                        player.coins += streakBonus;
                        message += `\n\n🔥 MINING STREAK x${player.miningStreak}!\n` +
                                  `✨ Bonus: +${streakBonus} LCoin`;
                    }

                    if (player.settings && player.settings.autoSell && reward > 0) {
                        const sellValue = Math.floor(reward * marketData.price);
                        player.coins -= reward;  
                        await updateBalance(senderID, sellValue);
                        
                        if (player.quests.daily.type === 'market') {
                            player.quests.daily.progress++;
                        }

                        message += "\n\n" + [
                            "🔄 TỰ ĐỘNG BÁN COIN 🔄",
                            `📤 Đã bán: ${reward} LCoin`,
                            `💵 Nhận được: ${sellValue}$`,
                            `💎 LCoin còn lại: ${player.coins}`
                        ].join('\n');
                    }

                    api.sendMessage(message, threadID, messageID);
                } else {
                    player.stats.failedMines++;
                    player.miningStreak = 0;
                    
                    const failMessage = CONFIG.baseMiner.miningEvents.fail[Math.floor(Math.random() * CONFIG.baseMiner.miningEvents.fail.length)];
                    
                    api.sendMessage(
                        `❌ ${failMessage}\n\n` +
                        "📝 Nguyên nhân có thể do:\n" +
                        "- Máy đào quá nóng\n" +
                        "- Hiệu suất thấp\n" +
                        "- Thiếu may mắn\n\n" +
                        "💡 Mẹo: Nâng cấp cooling để tăng tỷ lệ thành công!",
                        threadID, messageID
                    );
                }

                const durabilityLoss = CONFIG.baseMiner.consumption * (1 - player.upgrades.cooling * 0.05);
                player.miner.durability = Math.max(0, player.miner.durability - durabilityLoss);
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
                const successRate = Math.round(calculateMiningSuccess(player) * 100);
                
                const nextPowerCost = CONFIG.upgradeCosts.power[player.upgrades.power] || "Đã tối đa";
                const nextEfficiencyCost = CONFIG.upgradeCosts.efficiency[player.upgrades.efficiency] || "Đã tối đa";
                const nextCoolingCost = CONFIG.upgradeCosts.cooling[player.upgrades.cooling] || "Đã tối đa";
                
                const totalInvestment = Object.entries(player.upgrades).reduce((total, [type, level]) => {
                    return total + Array(level).fill().reduce((sum, _, i) => sum + CONFIG.upgradeCosts[type][i], 0);
                }, 0);
                
                const estimatedValue = Math.round(player.coins * marketData.price);
                
                api.sendMessage(
                    "🌟 THÔNG TIN MÁY ĐÀO LCOIN 🌟\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "⚙️ THÔNG SỐ MÁY ĐÀO:\n" +
                    `⚡ Công suất: ${power}% (Cấp ${player.upgrades.power}/10)\n` +
                    `📊 Hiệu suất: ${efficiency}% (Cấp ${player.upgrades.efficiency}/10)\n` +
                    `❄️ Làm mát: ${cooling}% (Cấp ${player.upgrades.cooling}/10)\n` +
                    `🎯 Tỷ lệ thành công: ${successRate}%\n` +
                    `🔋 Độ bền: ${Math.round(player.miner.durability)}%\n\n` +
                    
                    "💰 THÔNG TIN TÀI CHÍNH:\n" +
                    `💎 Số LCoin: ${player.coins} (≈ ${estimatedValue}$)\n` +
                    `💵 Tổng đầu tư: ${totalInvestment}$\n\n` +
                    
                    "📈 THỐNG KÊ ĐÀO COIN:\n" +
                    `💎 Tổng đã đào: ${player.stats.totalMined}\n` +
                    `✅ Thành công: ${player.stats.successfulMines}\n` +
                    `❌ Thất bại: ${player.stats.failedMines}\n` +
                    `⚜️ Tỷ lệ: ${Math.round((player.stats.successfulMines / (player.stats.successfulMines + player.stats.failedMines || 1)) * 100)}%\n\n` +
                    
                    "🔄 NÂNG CẤP TIẾP THEO:\n" +
                    `⚡ Power: ${nextPowerCost}$\n` +
                    `📊 Efficiency: ${nextEfficiencyCost}$\n` +
                    `❄️ Cooling: ${nextCoolingCost}$\n\n` +
                    
                    "⚙️ CÀI ĐẶT:\n" +
                    `🔄 Tự động bán: ${player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"}\n` +
                    `💎 Giá LCoin hiện tại: ${marketData.price}$\n\n` +
                    
                    "💡 Mẹo: Nâng cấp đồng bộ các chỉ số sẽ mang lại hiệu quả tốt nhất!",
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
                        `⚡ Power: ${player.upgrades.power}/10\n` +
                        `📊 Efficiency: ${player.upgrades.efficiency}/10\n` +
                        `❄️ Cooling: ${player.upgrades.cooling}/10\n\n` +
                        "💎 Thông tin nâng cấp:\n" +
                        "• Power: +20% sức mạnh đào/cấp\n" +
                        "• Efficiency: +15% hiệu suất/cấp\n" +
                        "• Cooling: +10% làm mát/cấp\n\n" +
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
                        `📊 ${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)}: ${currentLevel}/10`,
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
                
                const tradingTip = priceChange > 3 ? "Nên xem xét bán để lấy lợi nhuận 💰" : 
                                 priceChange < -3 ? "Có thể là thời điểm tốt để mua vào 🔍" : 
                                 "Thị trường ổn định, theo dõi thêm 👀";
                
                const marketMessage = 
                    "📊 THỊ TRƯỜNG COIN 📊\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `💎 Giá hiện tại: ${marketData.price} $ ${trend}\n` +
                    `📈 Thay đổi: ${priceChange}% (${sentiment})\n` +
                    `🔺 Cao nhất: ${highPrice} $\n` +
                    `🔻 Thấp nhất: ${lowPrice} $\n\n` +
                    `💡 Nhận định: ${tradingTip}\n` +
                    `⏰ Cập nhật sau: ${Math.ceil((CONFIG.market.updateInterval - (Date.now() - marketData.lastUpdate)) / 1000)}s\n\n` +
                    "💼 Giao dịch:\n" +
                    "• .coin sell [số lượng] - Bán coin\n" +
                    "• .coin buy [số lượng] - Mua coin\n" +
                    "• .coin chart [1h/6h/12h] - Xem biểu đồ khác";
                
                if (marketData.history.length < 2) {
                    return api.sendMessage(
                        marketMessage + "\n\n⚠️ Chưa đủ dữ liệu lịch sử để tạo biểu đồ!",
                        threadID, messageID
                    );
                }
                
                const marketChartResult = await generatePriceChart(marketData, "24h");
                
                if (!marketChartResult.success) {
                    return api.sendMessage(marketMessage, threadID, messageID);
                }
                
                api.sendMessage(
                    {
                        body: marketMessage,
                        attachment: fs.createReadStream(marketChartResult.chartPath)
                    },
                    threadID, messageID
                );
                
                setTimeout(() => {
                    try {
                        if (fs.existsSync(marketChartResult.chartPath)) {
                            fs.unlinkSync(marketChartResult.chartPath);
                        }
                    } catch (err) {
                        console.error("Error deleting chart file:", err);
                    }
                }, 10000);
                break;

            case "chart":
                const period = target[1] || "24h";
                if (!["1h", "6h", "12h", "24h"].includes(period)) {
                    return api.sendMessage(
                        "❌ Khoảng thời gian không hợp lệ!\n" +
                        "Sử dụng: .coin chart [1h/6h/12h/24h]",
                        threadID, messageID
                    );
                }
                
                if (marketData.history.length < 2) {
                    return api.sendMessage(
                        "⚠️ Chưa đủ dữ liệu lịch sử để tạo biểu đồ!\n" +
                        "Vui lòng chờ một thời gian để hệ thống thu thập dữ liệu.",
                        threadID, messageID
                    );
                }
                
                const chartResult = await generatePriceChart(marketData, period);
                if (!chartResult.success) {
                    return api.sendMessage(`❌ ${chartResult.message}`, threadID, messageID);
                }
                
                const changeEmoji = chartResult.priceChange >= 0 ? '📈' : '📉';
                const chartMessage = 
                    "📊 BIỂU ĐỒ GIÁ COIN 📊\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `${changeEmoji} Giá hiện tại: ${marketData.price} $\n` +
                    `↕️ Biến động: ${chartResult.priceChange >= 0 ? '+' : ''}${chartResult.priceChange} $ (${chartResult.changePercent}%)\n` +
                    `🔺 Cao nhất: ${chartResult.highPrice} $\n` +
                    `🔻 Thấp nhất: ${chartResult.lowPrice} $\n\n` +
                    `⏰ Cập nhật: ${new Date().toLocaleString('vi-VN')}`;
                
                api.sendMessage(
                    {
                        body: chartMessage,
                        attachment: fs.createReadStream(chartResult.chartPath)
                    },
                    threadID, messageID
                );
                
                setTimeout(() => {
                    try {
                        if (fs.existsSync(chartResult.chartPath)) {
                            fs.unlinkSync(chartResult.chartPath);
                        }
                    } catch (err) {
                        console.error("Error deleting chart file:", err);
                    }
                }, 10000);
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
                if (!target[1]) {
                    return api.sendMessage(
                        "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
                        "💡 Cách sử dụng:\n" +
                        "• .coin sell [số lượng] - Bán số lượng cụ thể\n" +
                        "• .coin sell all - Bán tất cả\n" +
                        "• .coin sell half - Bán một nửa",
                        threadID, messageID
                    );
                }

                let sellAmount;
                if (target[1].toLowerCase() === 'all') {
                    sellAmount = player.coins;
                } else if (target[1].toLowerCase() === 'half') {
                    sellAmount = Math.floor(player.coins / 2);
                } else {
                    sellAmount = parseInt(target[1]);
                    if (!sellAmount || sellAmount <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!", threadID, messageID);
                    }
                }

                if (sellAmount > player.coins) {
                    return api.sendMessage(
                        "❌ Bạn không có đủ LCoin!\n\n" +
                        `💎 Số LCoin hiện có: ${player.coins}\n` +
                        `💰 Giá trị: ${Math.floor(player.coins * marketData.price)}$`,
                        threadID, messageID
                    );
                }

                const sellValue = Math.floor(sellAmount * marketData.price);
                const profitLoss = sellValue - (sellAmount * marketData.history[0]?.price || marketData.price);
                player.coins -= sellAmount;
                await updateBalance(senderID, sellValue);
                
                if (player.quests.daily.type === 'market') {
                    player.quests.daily.progress++;
                }

                api.sendMessage(
                    "💰 BÁN LCOIN THÀNH CÔNG 💰\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `📤 Số lượng: ${sellAmount} LCoin\n` +
                    `💵 Nhận được: ${sellValue}$\n` +
                    `${profitLoss >= 0 ? '📈' : '📉'} Lợi nhuận: ${profitLoss}$\n` +
                    `💎 LCoin còn lại: ${player.coins}\n\n` +
                    `💡 Giá hiện tại: ${marketData.price}$`,
                    threadID, messageID
                );
                break;

            case "buy":
                if (!target[1]) {
                    return api.sendMessage(
                        "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
                        "💡 Cách sử dụng:\n" +
                        "• .coin buy [số lượng] - Mua số lượng cụ thể\n" +
                        "• .coin buy max - Mua tối đa có thể\n" +
                        "• .coin buy half - Dùng một nửa số tiền để mua",
                        threadID, messageID
                    );
                }

                const userBalance = await getBalance(senderID);
                let buyAmount;
                let cost;

                if (target[1].toLowerCase() === 'max') {
                    buyAmount = Math.floor(userBalance / marketData.price);
                    cost = Math.ceil(buyAmount * marketData.price);
                } else if (target[1].toLowerCase() === 'half') {
                    buyAmount = Math.floor((userBalance / 2) / marketData.price);
                    cost = Math.ceil(buyAmount * marketData.price);
                } else {
                    buyAmount = parseInt(target[1]);
                    if (!buyAmount || buyAmount <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập số lượng hợp lệ!", threadID, messageID);
                    }
                    cost = Math.ceil(buyAmount * marketData.price);
                }

                if (cost > userBalance) {
                    return api.sendMessage(
                        "❌ Không đủ tiền để mua!\n\n" +
                        `💵 Số dư: ${userBalance}$\n` +
                        `💰 Cần thêm: ${cost - userBalance}$\n` +
                        `💎 Giá hiện tại: ${marketData.price}$/LCoin\n\n` +
                        "💡 Gợi ý: Dùng '.coin buy max' để mua tối đa có thể!",
                        threadID, messageID
                    );
                }

                await updateBalance(senderID, -cost);
                player.coins += buyAmount;
                
                if (player.quests.daily.type === 'market') {
                    player.quests.daily.progress++;
                }

                const potentialValue = Math.round(buyAmount * (marketData.price * 1.1));
                api.sendMessage(
                    "💰 MUA LCOIN THÀNH CÔNG 💰\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `📥 Số lượng: ${buyAmount} LCoin\n` +
                    `💵 Chi phí: ${cost}$\n` +
                    `💎 LCoin hiện có: ${player.coins}\n` +
                    `💰 Giá trung bình: ${(cost / buyAmount).toFixed(2)}$/LCoin\n\n` +
                    `💡 Nếu giá tăng 10%, bạn sẽ lãi: ${potentialValue - cost}$`,
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
