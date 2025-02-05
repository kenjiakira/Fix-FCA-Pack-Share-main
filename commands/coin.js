const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const MINING_CONFIG = {
    baseMiningRate: 0.001,
    baseElectricityRate: 0.0005,
    miningInterval: 5000, 
    maxDailyMining: 1000,
    marketUpdateInterval: 3600000, 
};

const EQUIPMENT_TIERS = {
    gpu: [
        { name: "GTX 1050", power: 1, cost: 500000, electricity: 1 },
        { name: "RTX 2060", power: 2, cost: 1500000, electricity: 1.5 },
        { name: "RTX 3070", power: 3, cost: 3000000, electricity: 2 },
        { name: "RTX 4080", power: 5, cost: 5000000, electricity: 3 },
        { name: "RTX 4090", power: 8, cost: 10000000, electricity: 4 },
        { name: "RTX 5090 Ti", power: 12, cost: 20000000, electricity: 5 },
        { name: "QUANTUM GPU", power: 20, cost: 50000000, electricity: 8 }
    ],
    cooler: [
        { name: "Basic Fan", power: 1, cost: 200000, efficiency: 1 },
        { name: "Water Cooling", power: 1.5, cost: 1000000, efficiency: 1.2 },
        { name: "Advanced Cooling", power: 2, cost: 2000000, efficiency: 1.5 },
        { name: "Nitrogen Cooling", power: 3, cost: 5000000, efficiency: 2 },
        { name: "Quantum Cooling", power: 5, cost: 10000000, efficiency: 3 }
    ],
    powerSupply: [
        { name: "500W PSU", power: 1, cost: 300000, stability: 1 },
        { name: "800W PSU", power: 1.2, cost: 800000, stability: 1.3 },
        { name: "1200W PSU", power: 1.5, cost: 1500000, stability: 1.5 },
        { name: "2000W PSU", power: 2, cost: 3000000, stability: 2 },
        { name: "Quantum PSU", power: 3, cost: 8000000, stability: 3 }
    ],
    motherboard: [
        { name: "Basic Board", power: 1, cost: 400000, bonus: 1 },
        { name: "Gaming Board", power: 1.3, cost: 1200000, bonus: 1.2 },
        { name: "Pro Board", power: 1.8, cost: 2500000, bonus: 1.5 },
        { name: "Server Board", power: 2.5, cost: 5000000, bonus: 2 },
        { name: "Quantum Board", power: 4, cost: 12000000, bonus: 3 }
    ],
    ram: [
        { name: "8GB RAM", power: 1, cost: 300000, speed: 1 },
        { name: "16GB RAM", power: 1.2, cost: 900000, speed: 1.3 },
        { name: "32GB RAM", power: 1.5, cost: 2000000, speed: 1.8 },
        { name: "64GB RAM", power: 2, cost: 4000000, speed: 2.5 },
        { name: "Quantum RAM", power: 3, cost: 9000000, speed: 4 }
    ]
};

const CRYPTO_TYPES = {
    BTC: { name: "Bitcoin", baseValue: 100000, volatility: 0.15 },
    ETH: { name: "Ethereum", baseValue: 50000, volatility: 0.12 },
    AKC: { name: "AkiCoin", baseValue: 10000, volatility: 0.08 }
};

function loadMiningData() {
    const filePath = path.join(__dirname, 'json', 'mining_data.json');
    try {

        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        let data;
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            data = {
                users: {},
                market: updateMarketPrices(),
                lastMarketUpdate: Date.now()
            };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }

        if (!data.users) data.users = {};
        if (!data.market) {
            data.market = updateMarketPrices();
            data.lastMarketUpdate = Date.now();
        }

        return data;
    } catch (err) {
        console.error('Error loading mining data:', err);

        return {
            users: {},
            market: updateMarketPrices(),
            lastMarketUpdate: Date.now()
        };
    }
}

function saveMiningData(data) {
    const filePath = path.join(__dirname, 'json', 'mining_data.json');
    try {
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving mining data:', err);
    }
}

function updateMarketPrices() {
    const market = {};
    for (const [symbol, crypto] of Object.entries(CRYPTO_TYPES)) {
        const randomChange = (Math.random() - 0.5) * 2 * crypto.volatility;
        market[symbol] = {
            price: crypto.baseValue * (1 + randomChange),
            change: randomChange * 100
        };
    }
    return market;
}

function calculateMiningPower(equipment) {
    if (!equipment) return 1;
    
    const gpuPower = EQUIPMENT_TIERS.gpu[equipment.gpu || 0].power;
    const coolerEfficiency = EQUIPMENT_TIERS.cooler[equipment.cooler || 0].efficiency;
    const psuStability = EQUIPMENT_TIERS.powerSupply[equipment.psu || 0].stability;
    
    return gpuPower * coolerEfficiency * psuStability;
}

function calculateElectricityCost(equipment) {
    if (!equipment) return MINING_CONFIG.baseElectricityRate;
    
    const gpuPower = EQUIPMENT_TIERS.gpu[equipment.gpu || 0].electricity;
    return MINING_CONFIG.baseElectricityRate * gpuPower;
}

module.exports = {
    name: "coin",
    dev: "HNT",
    onPrefix: true,
    usages: "[mine/shop/upgrade/trade/market/wallet]",
    info: "Hệ thống đào coin crypto",
    cooldowns: 5,

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            let miningData = loadMiningData();

            if (!miningData.users[senderID]) {
                miningData.users[senderID] = {
                    equipment: {
                        gpu: 0,
                        cooler: 0,
                        psu: 0,
                        motherboard: 0,
                        ram: 0
                    },
                    wallet: {
                        BTC: 0,
                        ETH: 0,
                        AKC: 0
                    },
                    stats: {
                        totalMined: 0,
                        dailyMining: 0,
                        lastMiningTime: 0,
                        lastDailyReset: Date.now()
                    }
                };
                saveMiningData(miningData);
            }

            const user = miningData.users[senderID];
            if (!user.equipment) user.equipment = { gpu: 0, cooler: 0, psu: 0, motherboard: 0, ram: 0 };
            if (!user.wallet) user.wallet = { BTC: 0, ETH: 0, AKC: 0 };
            if (!user.stats) user.stats = { totalMined: 0, dailyMining: 0, lastMiningTime: 0, lastDailyReset: Date.now() };

            if (!miningData.market || Date.now() - miningData.lastMarketUpdate > MINING_CONFIG.marketUpdateInterval) {
                miningData.market = updateMarketPrices();
                miningData.lastMarketUpdate = Date.now();
                saveMiningData(miningData);
            }

            const today = new Date().setHours(0, 0, 0, 0);
            if (user.stats.lastDailyReset < today) {
                user.stats.dailyMining = 0;
                user.stats.lastDailyReset = today;
                saveMiningData(miningData);
            }

            const command = target[0]?.toLowerCase();
            const param = target[1]?.toLowerCase();

            switch (command) {
                case "mine":
                    if (user.stats.dailyMining >= MINING_CONFIG.maxDailyMining) {
                        return api.sendMessage("⚠️ Bạn đã đạt giới hạn đào coin hôm nay! Hãy quay lại vào ngày mai.", threadID, messageID);
                    }

                    const timeSinceLastMine = Date.now() - user.stats.lastMiningTime;
                    if (timeSinceLastMine < MINING_CONFIG.miningInterval) {
                        const waitTime = Math.ceil((MINING_CONFIG.miningInterval - timeSinceLastMine) / 1000);
                        return api.sendMessage(`⏳ Vui lòng đợi ${waitTime} giây nữa để tiếp tục đào!`, threadID, messageID);
                    }

                    const miningPower = calculateMiningPower(user.equipment);
                    const electricityCost = calculateElectricityCost(user.equipment);
                    
                    const minedBTC = MINING_CONFIG.baseMiningRate * miningPower * (Math.random() * 0.5 + 0.75);
                    const minedETH = MINING_CONFIG.baseMiningRate * miningPower * 2 * (Math.random() * 0.5 + 0.75);
                    const minedAKC = MINING_CONFIG.baseMiningRate * miningPower * 5 * (Math.random() * 0.5 + 0.75);

                    user.wallet.BTC += minedBTC;
                    user.wallet.ETH += minedETH;
                    user.wallet.AKC += minedAKC;

                    const totalValue = (minedBTC * miningData.market.BTC.price +
                                    minedETH * miningData.market.ETH.price +
                                    minedAKC * miningData.market.AKC.price);

                    const electricityCostXu = Math.floor(totalValue * electricityCost);
                    await updateBalance(senderID, -electricityCostXu);

                    user.stats.totalMined++;
                    user.stats.dailyMining++;
                    user.stats.lastMiningTime = Date.now();
                    saveMiningData(miningData);

                    return api.sendMessage(
                        "⛏️ KẾT QUẢ ĐÀO COIN ⛏️\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🎯 Mining Power: x${miningPower.toFixed(2)}\n` +
                        `⚡ Chi phí điện: ${electricityCostXu.toLocaleString('vi-VN')} Xu\n\n` +
                        "📊 Coin đào được:\n" +
                        `🔸 BTC: +${minedBTC.toFixed(8)}\n` +
                        `🔸 ETH: +${minedETH.toFixed(8)}\n` +
                        `🔸 AKC: +${minedAKC.toFixed(8)}\n\n` +
                        `💰 Tổng giá trị: ${Math.floor(totalValue).toLocaleString('vi-VN')} Xu\n` +
                        `📈 Lần đào thứ ${user.stats.dailyMining}/${MINING_CONFIG.maxDailyMining} hôm nay`,
                        threadID, messageID
                    );

                case "shop":
                    let shopMessage = "🏪 CRYPTO MINING SHOP 🏪\n" +
                                    "━━━━━━━━━━━━━━━━━━\n\n" +
                                    "1️⃣ GPU (Card đồ họa):\n";
                    
                    EQUIPMENT_TIERS.gpu.forEach((gpu, index) => {
                        shopMessage += `${index}. ${gpu.name}\n` +
                                    `   💰 Giá: ${gpu.cost.toLocaleString('vi-VN')} Xu\n` +
                                    `   ⚡️ Power: x${gpu.power}\n` +
                                    `   🔌 Điện: x${gpu.electricity}\n`;
                    });
                    
                    shopMessage += "\n2️⃣ COOLING (Tản nhiệt):\n";
                    EQUIPMENT_TIERS.cooler.forEach((cooler, index) => {
                        shopMessage += `${index}. ${cooler.name}\n` +
                                    `   💰 Giá: ${cooler.cost.toLocaleString('vi-VN')} Xu\n` +
                                    `   ❄️ Hiệu suất: x${cooler.efficiency}\n`;
                    });
                    
                    shopMessage += "\n3️⃣ POWER SUPPLY (Nguồn):\n";
                    EQUIPMENT_TIERS.powerSupply.forEach((psu, index) => {
                        shopMessage += `${index}. ${psu.name}\n` +
                                    `   💰 Giá: ${psu.cost.toLocaleString('vi-VN')} Xu\n` +
                                    `   🔋 Độ ổn định: x${psu.stability}\n`;
                    });

                    shopMessage += "\n4️⃣ MOTHERBOARD (Bo mạch chủ):\n";
                    EQUIPMENT_TIERS.motherboard.forEach((mb, index) => {
                        shopMessage += `${index}. ${mb.name}\n` +
                                    `   💰 Giá: ${mb.cost.toLocaleString('vi-VN')} Xu\n` +
                                    `   💪 Power: x${mb.power}\n` +
                                    `   🎯 Bonus: x${mb.bonus}\n`;
                    });

                    shopMessage += "\n5️⃣ RAM (Bộ nhớ):\n";
                    EQUIPMENT_TIERS.ram.forEach((ram, index) => {
                        shopMessage += `${index}. ${ram.name}\n` +
                                    `   💰 Giá: ${ram.cost.toLocaleString('vi-VN')} Xu\n` +
                                    `   💪 Power: x${ram.power}\n` +
                                    `   ⚡ Speed: x${ram.speed}\n`;
                    });
                    
                    shopMessage += "\n💡 HƯỚNG DẪN NÂNG CẤP:\n";
                    shopMessage += "• Cú pháp: .coin upgrade [loại] [số thứ tự]\n";
                    shopMessage += "• Loại thiết bị: gpu/cooler/psu/motherboard/ram\n";
                    shopMessage += "• Ví dụ: .coin upgrade gpu 2\n\n";
                    shopMessage += "⚠️ LƯU Ý:\n";
                    shopMessage += "• Ưu tiên nâng cấp GPU trước\n";
                    shopMessage += "• Cần đủ tản nhiệt cho GPU cao cấp\n";
                    shopMessage += "• PSU phải đủ công suất cho hệ thống\n";
                    shopMessage += "• Mainboard và RAM hỗ trợ tăng tốc độ đào";
                    
                    return api.sendMessage(shopMessage, threadID, messageID);

                case "upgrade":
                    if (!param || !target[2]) {
                        return api.sendMessage(
                            "❌ Vui lòng chọn loại thiết bị và cấp độ nâng cấp!\n\n" +
                            "📌 Cú pháp: .coin upgrade [loại] [cấp]\n" +
                            "📌 Loại thiết bị: gpu/cooler/psu/motherboard/ram\n" +
                            "📌 Ví dụ: .coin upgrade gpu 2", 
                            threadID, messageID
                        );
                    }

                    const type = param;
                    const tier = parseInt(target[2]);
                    
                    if (!['gpu', 'cooler', 'psu', 'motherboard', 'ram'].includes(type)) {
                        return api.sendMessage(
                            "❌ Loại thiết bị không hợp lệ!\n" +
                            "📌 Chọn một trong các loại:\n" +
                            "• gpu: Card đồ họa\n" +
                            "• cooler: Tản nhiệt\n" +
                            "• psu: Nguồn điện\n" +
                            "• motherboard: Bo mạch chủ\n" +
                            "• ram: Bộ nhớ", 
                            threadID, messageID
                        );
                    }

                    const equipment = EQUIPMENT_TIERS[type];

                    if (isNaN(tier) || tier < 0 || tier >= equipment.length) {
                        return api.sendMessage("❌ Cấp độ nâng cấp không hợp lệ!", threadID, messageID);
                    }

                    const upgradeCost = equipment[tier].cost;
                    const balance = await getBalance(senderID);

                    if (balance < upgradeCost) {
                        return api.sendMessage(
                            "❌ Bạn không đủ tiền để nâng cấp!\n" +
                            `💰 Giá: ${upgradeCost.toLocaleString('vi-VN')} Xu\n` +
                            `💳 Số dư: ${balance.toLocaleString('vi-VN')} Xu`,
                            threadID, messageID
                        );
                    }

                    const oldTier = user.equipment[type === 'psu' ? 'psu' : type];
                    if (tier <= oldTier) {
                        return api.sendMessage("❌ Không thể nâng cấp xuống cấp độ thấp hơn!", threadID, messageID);
                    }

                    await updateBalance(senderID, -upgradeCost);
                    user.equipment[type === 'psu' ? 'psu' : type] = tier;
                    saveMiningData(miningData);

                    return api.sendMessage(
                        "🔧 NÂNG CẤP THÀNH CÔNG 🔧\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        `🔄 Đã nâng cấp ${type.toUpperCase()} lên ${equipment[tier].name}\n` +
                        `💰 Chi phí: ${upgradeCost.toLocaleString('vi-VN')} Xu\n\n` +
                        "📊 Chỉ số hiện tại:\n" +
                        `⚡ Mining Power: x${calculateMiningPower(user.equipment).toFixed(2)}\n` +
                        `🔌 Chi phí điện: x${calculateElectricityCost(user.equipment).toFixed(2)}`,
                        threadID, messageID
                    );

                case "market":
                    let marketMessage = "📊 CRYPTO MARKET 📊\n" + 
                                    "━━━━━━━━━━━━━━━━━━\n\n";
                    
                    for (const [symbol, data] of Object.entries(miningData.market)) {
                        const crypto = CRYPTO_TYPES[symbol];
                        marketMessage += `${crypto.name} (${symbol})\n` +
                                    `💰 Giá: ${Math.floor(data.price).toLocaleString('vi-VN')} Xu\n` +
                                    `📈 Thay đổi: ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%\n\n`;
                    }
                    
                    return api.sendMessage(marketMessage, threadID, messageID);

                case "wallet":
                    const walletBalance = await getBalance(senderID);
                    let walletMessage = "💼 CRYPTO WALLET 💼\n" +
                                    "━━━━━━━━━━━━━━━━━━\n\n" +
                                    `💰 Xu trong ví: ${walletBalance.toLocaleString('vi-VN')}\n\n` +
                                    "🪙 tài sản Crypto:\n";
                    
                    for (const [symbol, amount] of Object.entries(user.wallet)) {
                        const value = Math.floor(amount * miningData.market[symbol].price);
                        walletMessage += `${symbol}: ${amount.toFixed(8)} (${value.toLocaleString('vi-VN')} Xu)\n`;
                    }
                    
                    return api.sendMessage(walletMessage, threadID, messageID);

                case "trade":
                    if (!param || !target[2] || !target[3]) {
                        return api.sendMessage(
                            "📌 Cách giao dịch:\n" +
                            ".coin trade buy/sell [coin] [amount]\n" +
                            "Ví dụ: .coin trade buy btc 0.001",
                            threadID, messageID
                        );
                    }

                    const action = param;
                    const coin = target[2].toUpperCase();
                    const amount = parseFloat(target[3]);

                    if (!CRYPTO_TYPES[coin]) {
                        return api.sendMessage("❌ Loại coin không hợp lệ!", threadID, messageID);
                    }

                    if (isNaN(amount) || amount <= 0) {
                        return api.sendMessage("❌ Số lượng không hợp lệ!", threadID, messageID);
                    }

                    const price = miningData.market[coin].price;
                    const total = Math.floor(price * amount);
                    const fee = Math.floor(total * 0.01); 

                    if (action === "buy") {
                        const cost = total + fee;
                        const balance = await getBalance(senderID);
                        
                        if (balance < cost) {
                            return api.sendMessage(
                                "❌ Số dư không đủ!\n" +
                                `💰 Cần: ${cost.toLocaleString('vi-VN')} Xu\n` +
                                `💳 Hiện có: ${balance.toLocaleString('vi-VN')} Xu`,
                                threadID, messageID
                            );
                        }

                        await updateBalance(senderID, -cost);
                        user.wallet[coin] += amount;
                        saveMiningData(miningData);

                        return api.sendMessage(
                            "🛒 MUA COIN THÀNH CÔNG 🛒\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `🪙 Coin: ${coin}\n` +
                            `📈 Số lượng: ${amount.toFixed(8)}\n` +
                            `💰 Giá: ${total.toLocaleString('vi-VN')} Xu\n` +
                            `💸 Phí: ${fee.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tổng: ${cost.toLocaleString('vi-VN')} Xu`,
                            threadID, messageID
                        );

                    } else if (action === "sell") {
                        if (user.wallet[coin] < amount) {
                            return api.sendMessage(
                                "❌ Số dư coin không đủ!\n" +
                                `🪙 Cần: ${amount.toFixed(8)} ${coin}\n` +
                                `💳 Hiện có: ${user.wallet[coin].toFixed(8)} ${coin}`,
                                threadID, messageID
                            );
                        }

                        user.wallet[coin] -= amount;
                        const receive = total - fee;
                        await updateBalance(senderID, receive);
                        saveMiningData(miningData);

                        return api.sendMessage(
                            "💱 BÁN COIN THÀNH CÔNG 💱\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `🪙 Coin: ${coin}\n` +
                            `📉 Số lượng: ${amount.toFixed(8)}\n` +
                            `💰 Giá: ${total.toLocaleString('vi-VN')} Xu\n` +
                            `💸 Phí: ${fee.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Nhận: ${receive.toLocaleString('vi-VN')} Xu`,
                            threadID, messageID
                        );
                    }
                    break;

                default:
                    return api.sendMessage(
                        "🎮 HƯỚNG DẪN CHI TIẾT HỆ THỐNG ĐÀO COIN 🎮\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1️⃣ CÁCH ĐÀO COIN:\n" +
                        "• Lệnh: .coin mine\n" +
                        "• Thời gian chờ: 5 giây/lần\n" +
                        "• Giới hạn: 1000 lần/ngày\n" +
                        "• Thu nhập phụ thuộc vào thiết bị\n\n" +
                        "2️⃣ NÂNG CẤP THIẾT BỊ:\n" +
                        "• Xem shop: .coin shop\n" +
                        "• Nâng cấp: .coin upgrade [loại] [cấp]\n" +
                        "• Loại thiết bị:\n" +
                        "  - gpu: Card đồ họa (quan trọng nhất)\n" +
                        "  - cooler: Tản nhiệt (tăng hiệu suất)\n" +
                        "  - psu: Nguồn điện (ổn định hệ thống)\n" +
                        "  - motherboard: Bo mạch chủ (tăng tổng thể)\n" +
                        "  - ram: Bộ nhớ (tăng tốc độ đào)\n\n" +
                        "3️⃣ GIAO DỊCH COIN:\n" +
                        "• Xem giá: .coin market\n" +
                        "• Mua coin: .coin trade buy [coin] [số lượng]\n" +
                        "• Bán coin: .coin trade sell [coin] [số lượng]\n" +
                        "• Loại coin: BTC, ETH, AKC\n" +
                        "• Phí giao dịch: 1%\n\n" +
                        "4️⃣ KIỂM TRA TÀI SẢN:\n" +
                        "• Xem ví: .coin wallet\n" +
                        "• Hiển thị:\n" +
                        "  - Số dư Xu\n" +
                        "  - Số coin đang có\n" +
                        "  - Giá trị quy đổi\n\n" +
                        "💡 MẸO CHƠI GAME:\n" +
                        "• Ưu tiên nâng cấp GPU trước\n" +
                        "• Cân bằng giữa các thiết bị\n" +
                        "• Theo dõi giá coin để giao dịch\n" +
                        "• Tích lũy để mua thiết bị tốt\n" +
                        "• Chơi đều đặn mỗi ngày\n\n" +
                        "⚠️ LƯU Ý QUAN TRỌNG:\n" +
                        "• Chi phí điện được trừ tự động\n" +
                        "• Mức điện tăng theo cấp GPU\n" +
                        "• Giá coin biến động thường xuyên\n" +
                        "• Nâng cấp thiết bị đúng thứ tự\n",
                        threadID, messageID
                    );
            }
        } catch (error) {
            console.error("Mining Error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi trong hệ thống mining!", threadID, messageID);
        }
    }
};
