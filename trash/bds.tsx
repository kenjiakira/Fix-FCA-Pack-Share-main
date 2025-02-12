const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const BDS_DATA_PATH = path.join(__dirname, './json/bds.json');
const USER_PORTFOLIO_PATH = path.join(__dirname, './json/bds_portfolios.json');

class RealEstate {
    constructor() {
        this.properties = {
            "VHOMES": {
                name: "Vinhomes Central Park",
                type: "Chung cư cao cấp",
                location: "TP.HCM",
                price: 5000000,
                rent: 50000,
                area: "100m2",
                appreciation: 0.1
            },
            "PVILLE": {
                name: "Park Villa", 
                type: "Biệt thự",
                location: "Hà Nội",
                price: 10000000,
                rent: 100000,
                area: "300m2",
                appreciation: 0.15
            },
            "LAKEV": {
                name: "Lake View",
                type: "Đất nền", 
                location: "Đà Nẵng",
                price: 2000000,
                rent: 0,
                area: "200m2",
                appreciation: 0.2
            },
            "SHOUSE": {
                name: "Sunshine House",
                type: "Nhà phố",
                location: "TP.HCM", 
                price: 8000000,
                rent: 80000,
                area: "150m2",
                appreciation: 0.12
            },
            "GLAND": {
                name: "Green Land",
                type: "Đất nền",
                location: "Hà Nội",
                price: 3000000, 
                rent: 0,
                area: "250m2",
                appreciation: 0.18
            }
        };
        this.marketEvents = [];
        this.loans = {};
        this.taxRates = {
            propertyTax: 0.01,
            transferTax: 0.02, 
            rentalTax: 0.1    
        };
        this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(BDS_DATA_PATH)) {
                const data = JSON.parse(fs.readFileSync(BDS_DATA_PATH));
                this.properties = {...this.properties, ...data};
            }
            if (fs.existsSync(USER_PORTFOLIO_PATH)) {
                this.portfolios = JSON.parse(fs.readFileSync(USER_PORTFOLIO_PATH));
            } else {
                this.portfolios = {};
            }
            this.saveData();
        } catch (error) {
            console.error("Error loading real estate data:", error);
        }
    }

    saveData() {
        try {
            if (!fs.existsSync(path.dirname(BDS_DATA_PATH))) {
                fs.mkdirSync(path.dirname(BDS_DATA_PATH), { recursive: true });
            }
            fs.writeFileSync(BDS_DATA_PATH, JSON.stringify(this.properties, null, 2));
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify(this.portfolios, null, 2));
        } catch (error) {
            console.error("Error saving real estate data:", error);
        }
    }

    async buyProperty(userId, propertyId, quantity = 1, useLoan = false) {
        const property = this.properties[propertyId];
        if (!property) throw new Error("Mã BDS không tồn tại");

        const totalCost = property.price * quantity;
        const transferTax = totalCost * this.taxRates.transferTax;
        const totalRequired = totalCost + transferTax;
        
        let loanAmount = 0;
        if (useLoan) {
            const maxLoan = totalCost * 0.7; // Cho vay tối đa 70% giá trị
            loanAmount = maxLoan;
            this.loans[userId] = {
                amount: loanAmount,
                interest: 0.08, // 8% năm
                term: 52,      // 52 tuần
                weeklyPayment: (loanAmount * 1.08) / 52,
                propertyId
            };
        }

        const balance = await getBalance(userId);
        if (balance < (totalRequired - loanAmount)) {
            throw new Error(`Không đủ tiền! Cần thêm: ${formatNumber(totalRequired - loanAmount - balance)} Xu`);
        }

        if (!this.portfolios[userId]) {
            this.portfolios[userId] = {
                properties: {},
                transactions: [],
                lastRentCollection: {}
            };
        }

        if (!this.portfolios[userId].properties[propertyId]) {
            this.portfolios[userId].properties[propertyId] = {
                quantity: 0,
                averagePrice: 0
            };
        }

        const portfolio = this.portfolios[userId];
        const oldValue = portfolio.properties[propertyId].quantity * portfolio.properties[propertyId].averagePrice;
        const newValue = totalCost;
        const totalQuantity = portfolio.properties[propertyId].quantity + quantity;

        portfolio.properties[propertyId].averagePrice = (oldValue + newValue) / totalQuantity;
        portfolio.properties[propertyId].quantity = totalQuantity;

        portfolio.transactions.push({
            type: 'buy',
            propertyId,
            quantity,
            price: property.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, -totalCost);
        this.saveData();

        return {
            property: property.name,
            quantity,
            price: property.price,
            total: totalCost,
            rent: property.rent * quantity,
            transferTax,
            loanAmount,
            weeklyPayment: loanAmount ? this.loans[userId].weeklyPayment : 0
        };
    }

    async sellProperty(userId, propertyId, quantity = 1) {
        const property = this.properties[propertyId];
        if (!property) throw new Error("Mã BDS không tồn tại");

        const portfolio = this.portfolios[userId];
        if (!portfolio?.properties[propertyId] || portfolio.properties[propertyId].quantity < quantity) {
            throw new Error("Bạn không sở hữu đủ BDS này để bán");
        }

        const totalValue = property.price * quantity;
        portfolio.properties[propertyId].quantity -= quantity;

        if (portfolio.properties[propertyId].quantity === 0) {
            delete portfolio.properties[propertyId];
            delete portfolio.lastRentCollection[propertyId];
        }

        portfolio.transactions.push({
            type: 'sell',
            propertyId,
            quantity,
            price: property.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, totalValue);
        this.saveData();

        return {
            property: property.name,
            quantity,
            price: property.price,
            total: totalValue
        };
    }

    async collectRent(userId) {
        if (!this.portfolios[userId]) return { total: 0, details: [] };

        const now = Date.now();
        const portfolio = this.portfolios[userId];
        let totalRent = 0;
        const details = [];

        for (const [propertyId, data] of Object.entries(portfolio.properties)) {
            const property = this.properties[propertyId];
            if (!property.rent) continue;

            const lastCollection = portfolio.lastRentCollection[propertyId] || 0;
            const hoursSinceLastCollection = (now - lastCollection) / (1000 * 60 * 60);

            if (hoursSinceLastCollection >= 24) {
                const rent = property.rent * data.quantity;
                totalRent += rent;
                details.push({
                    property: property.name,
                    quantity: data.quantity,
                    rent: rent
                });
                portfolio.lastRentCollection[propertyId] = now;
            }
        }

        if (totalRent > 0) {
            await updateBalance(userId, totalRent);
            this.saveData();
        }

        return { total: totalRent, details };
    }

    updatePrices() {
        Object.keys(this.properties).forEach(id => {
            const property = this.properties[id];
            const appreciation = property.appreciation;
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            property.price = Math.round(property.price * (1 + appreciation * randomFactor));
        });
        this.saveData();
    }

    getPortfolioValue(userId) {
        if (!this.portfolios[userId]) return 0;
        
        return Object.entries(this.portfolios[userId].properties).reduce((total, [propertyId, data]) => {
            const property = this.properties[propertyId];
            return total + (property.price * data.quantity);
        }, 0);
    }

    generateMarketEvent() {
        const events = [
            {
                type: 'boom',
                name: 'Sốt đất',
                effect: {
                    priceMultiplier: 1.3,
                    duration: 7,
                    locations: ['TP.HCM', 'Hà Nội']
                }
            },
            {
                type: 'crisis',
                name: 'Khủng hoảng thị trường',
                effect: {
                    priceMultiplier: 0.7,
                    duration: 14,
                    propertyTypes: ['Chung cư']
                }
            },
            {
                type: 'development',
                name: 'Quy hoạch mới',
                effect: {
                    appreciation: 0.2,
                    locations: ['Đà Nẵng']
                }
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        this.marketEvents.push({
            ...event,
            startTime: Date.now(),
            endTime: Date.now() + event.effect.duration * 24 * 60 * 60 * 1000
        });

        this.applyMarketEvents();
    }

    applyMarketEvents() {
        
        Object.keys(this.properties).forEach(id => {
            const property = this.properties[id];
            property.originalPrice = property.originalPrice || property.price;
            property.price = property.originalPrice;
        });

        this.marketEvents = this.marketEvents.filter(event => event.endTime > Date.now());
        this.marketEvents.forEach(event => {
            Object.keys(this.properties).forEach(id => {
                const property = this.properties[id];
                if (event.effect.locations?.includes(property.location) ||
                    event.effect.propertyTypes?.includes(property.type)) {
                    property.price *= event.effect.priceMultiplier || 1;
                    property.appreciation += event.effect.appreciation || 0;
                }
            });
        });
    }
}

const market = new RealEstate();
setInterval(() => market.updatePrices(), 3600000); 

setInterval(() => {
    if (Math.random() < 0.3) { 
        market.generateMarketEvent();
    }
}, 6 * 60 * 60 * 1000);

module.exports = {
    name: "bds",
    dev: "HNT",
    info: "Đầu tư bất động sản",
    usages: ".bds [check/buy/sell/portfolio/collect]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🏠 QUẢN LÝ BẤT ĐỘNG SẢN 🏠\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1. .bds check - Xem thị trường\n" +
                "2. .bds buy [mã] [số lượng] - Mua BDS\n" +
                "3. .bds sell [mã] [số lượng] - Bán BDS\n" +
                "4. .bds portfolio - Xem danh mục\n" +
                "5. .bds collect - Thu tiền thuê",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();

        try {
            switch (command) {
                case "check": {
                    let message = "📊 THỊ TRƯỜNG BẤT ĐỘNG SẢN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";

                    Object.entries(market.properties).forEach(([id, property]) => {
                        message += `🏢 ${id} - ${property.name}\n`;
                        message += `📍 ${property.location}\n`;
                        message += `🏗️ Loại: ${property.type}\n`;
                        message += `📐 Diện tích: ${property.area}\n`;
                        message += `💰 Giá: ${property.price.toLocaleString('vi-VN')} Xu\n`;
                        if (property.rent > 0) {
                            message += `💵 Thu nhập/ngày: ${property.rent.toLocaleString('vi-VN')} Xu\n`;
                        }
                        message += `📈 Tăng giá: ${(property.appreciation * 100).toFixed(1)}%/năm\n\n`;
                    });

                    return api.sendMessage(message, threadID, messageID);
                }

                case "buy": {
                    const propertyId = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]) || 1;

                    if (!propertyId || !market.properties[propertyId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã BDS hợp lệ!", threadID, messageID);
                    }

                    try {
                        const result = await market.buyProperty(senderID, propertyId, quantity);
                        const remainingBalance = await getBalance(senderID);
                        const property = market.properties[propertyId];
                        const affordableQuantity = Math.floor(remainingBalance / property.price);

                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 BDS: ${result.property}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${result.price.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tổng: ${result.total.toLocaleString('vi-VN')} Xu\n` +
                            `📊 Số dư: ${remainingBalance.toLocaleString('vi-VN')} Xu\n` +
                            (result.rent > 0 ? `💸 Thu nhập/ngày: ${result.rent.toLocaleString('vi-VN')} Xu\n` : '') +
                            `✨ Có thể mua thêm: ${affordableQuantity}`,
                            threadID, messageID
                        );
                    } catch (error) {
                        if (error.message === "Số dư không đủ để thực hiện giao dịch") {
                            const balance = await getBalance(senderID);
                            const property = market.properties[propertyId];
                            const affordableQuantity = Math.floor(balance / property.price);
                            return api.sendMessage(
                                `❌ ${error.message}\n` +
                                `💰 Số dư hiện tại: ${balance.toLocaleString('vi-VN')} Xu\n` +
                                `✨ Bạn có thể mua tối đa: ${affordableQuantity} BDS`,
                                threadID, messageID
                            );
                        }
                        throw error;
                    }
                }

                case "sell": {
                    const propertyId = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]) || 1;

                    if (!propertyId || !market.properties[propertyId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã BDS hợp lệ!", threadID, messageID);
                    }

                    const result = await market.sellProperty(senderID, propertyId, quantity);
                    return api.sendMessage(
                        "✅ GIAO DỊCH THÀNH CÔNG\n" +
                        `🏢 BDS: ${result.property}\n` +
                        `🔢 Số lượng: ${result.quantity}\n` +
                        `💰 Giá: ${result.price.toLocaleString('vi-VN')} Xu\n` +
                        `💵 Tổng: ${result.total.toLocaleString('vi-VN')} Xu\n` +
                        `📊 Số dư: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu`,
                        threadID, messageID
                    );
                }

                case "portfolio": {
                    const portfolio = market.portfolios[senderID];
                    if (!portfolio || Object.keys(portfolio.properties).length === 0) {
                        return api.sendMessage("Bạn chưa sở hữu BDS nào!", threadID, messageID);
                    }

                    let totalValue = 0;
                    let totalRent = 0;
                    let message = "📈 DANH MỤC BẤT ĐỘNG SẢN 📈\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";

                    Object.entries(portfolio.properties).forEach(([propertyId, data]) => {
                        const property = market.properties[propertyId];
                        const currentValue = property.price * data.quantity;
                        const dailyRent = (property.rent || 0) * data.quantity;
                        const profitLoss = currentValue - (data.averagePrice * data.quantity);

                        totalValue += currentValue;
                        totalRent += dailyRent;

                        message += `🏢 ${propertyId} - ${property.name}\n`;
                        message += `📍 ${property.location}\n`;
                        message += `🔢 Số lượng: ${data.quantity}\n`;
                        message += `💰 Giá mua TB: ${data.averagePrice.toLocaleString('vi-VN')} Xu\n`;
                        message += `📊 Giá hiện tại: ${property.price.toLocaleString('vi-VN')} Xu\n`;
                        message += `💵 Tổng giá trị: ${currentValue.toLocaleString('vi-VN')} Xu\n`;
                        if (dailyRent > 0) {
                            message += `💸 Thu nhập/ngày: ${dailyRent.toLocaleString('vi-VN')} Xu\n`;
                        }
                        message += `${profitLoss >= 0 ? '📈' : '📉'} Lãi/Lỗ: ${profitLoss.toLocaleString('vi-VN')} Xu\n\n`;
                    });

                    message += `💎 Tổng giá trị: ${totalValue.toLocaleString('vi-VN')} Xu\n`;
                    message += `💰 Tổng thu nhập/ngày: ${totalRent.toLocaleString('vi-VN')} Xu`;

                    return api.sendMessage(message, threadID, messageID);
                }

                case "collect": {
                    const result = await market.collectRent(senderID);
                    
                    if (result.total === 0) {
                        return api.sendMessage(
                            "❌ Chưa đến thời gian thu tiền thuê!\n" +
                            "⏳ Vui lòng đợi đủ 24 giờ từ lần thu trước.",
                            threadID, messageID
                        );
                    }

                    let message = "💰 THU TIỀN THUÊ THÀNH CÔNG 💰\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";
                    
                    result.details.forEach(detail => {
                        message += `🏢 ${detail.property}\n`;
                        message += `🔢 Số lượng: ${detail.quantity}\n`;
                        message += `💵 Thu nhập: ${detail.rent.toLocaleString('vi-VN')} Xu\n\n`;
                    });

                    message += `💎 Tổng thu: ${result.total.toLocaleString('vi-VN')} Xu\n`;
                    message += `📊 Số dư: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu`;

                    return api.sendMessage(message, threadID, messageID);
                }
            }
        } catch (error) {
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
