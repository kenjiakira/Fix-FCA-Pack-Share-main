const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const MARKET_DATA_PATH = path.join(__dirname, './json/market.json');
const USER_PORTFOLIO_PATH = path.join(__dirname, './json/portfolios.json');

class StockMarket {
    constructor() {
        this.stocks = {};
        this.portfolios = {};
        this.marketHours = {
            open: 9, 
            close: 15 
        };
        this.loadMarketData();
    }

    loadMarketData() {
        try {
            const dir = path.dirname(MARKET_DATA_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            if (fs.existsSync(MARKET_DATA_PATH)) {
                const data = JSON.parse(fs.readFileSync(MARKET_DATA_PATH));
             
                if (data && Object.keys(data).length > 0) {
                    this.stocks = data;
                } else {
                    this.initializeStocks();
                }
            } else {
                this.initializeStocks();
            }

            if (!fs.existsSync(path.dirname(USER_PORTFOLIO_PATH))) {
                fs.mkdirSync(path.dirname(USER_PORTFOLIO_PATH), { recursive: true });
            }

            if (fs.existsSync(USER_PORTFOLIO_PATH)) {
                this.portfolios = JSON.parse(fs.readFileSync(USER_PORTFOLIO_PATH));
            } else {
                this.portfolios = {};
                this.saveMarketData();
            }
        } catch (error) {
            console.error("Error loading market data:", error);
            this.initializeStocks();
        }
    }

    saveMarketData() {
        try {
            fs.writeFileSync(MARKET_DATA_PATH, JSON.stringify(this.stocks, null, 2));
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify(this.portfolios, null, 2));
        } catch (error) {
            console.error("Error saving market data:", error);
        }
    }

    initializeStocks() {
        this.stocks = {
            "VNM": {
                name: "Vinamilk",
                price: 80000,
                change: 0,
                volume: 1000000,
                marketCap: 167000000000000,
                history: []
            },
            "FPT": {
                name: "FPT Corp",
                price: 90000,
                change: 0,
                volume: 800000,
                marketCap: 108000000000000,
                history: []
            },
            "VIC": {
                name: "Vingroup",
                price: 100000,
                change: 0,
                volume: 1200000,
                marketCap: 320000000000000,
                history: []
            },
            "BID": {
                name: "BIDV Bank",
                price: 45000,
                change: 0,
                volume: 900000,
                marketCap: 180000000000000,
                history: []
            },
            "VCB": {
                name: "Vietcombank", 
                price: 85000,
                change: 0,
                volume: 950000,
                marketCap: 315000000000000,
                history: []
            },
            "HPG": {
                name: "Hòa Phát",
                price: 35000,
                change: 0,
                volume: 1500000,
                marketCap: 156000000000000,
                history: []
            },
            "MSN": {
                name: "Masan Group",
                price: 95000,
                change: 0,
                volume: 700000,
                marketCap: 112000000000000,
                history: []
            }
        };

        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
            for (let i = 0; i < 10; i++) {
                stock.history.push({
                    price: stock.price,
                    timestamp: Date.now() - (i * 60000)
                });
            }
        });

        const dir = path.dirname(MARKET_DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.saveMarketData();
    }

    updatePrices() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= this.marketHours.open && hour < this.marketHours.close) {
            Object.keys(this.stocks).forEach(symbol => {
                const stock = this.stocks[symbol];
                const volatility = 0.05; 
                let change = (Math.random() - 0.5) * 2 * volatility * stock.price;

                const randomChance = Math.random();
                if (randomChance < 0.3) {
                    change = (Math.random() - 0.5) * 2 * 0.15 * stock.price;
                } else if (randomChance < 0.4) {
                    change = (Math.random() - 0.5) * 2 * 0.25 * stock.price;
                }

                const marketTrend = Math.random() < 0.6 ? 1 : -1; 
                change *= marketTrend;

                const oldPrice = stock.price;
                stock.price = Math.max(100, Math.round(stock.price + change));
                stock.change = ((stock.price - oldPrice) / oldPrice) * 100;

                stock.volume = Math.round(stock.volume * (1 + Math.abs(stock.change) / 100));

                stock.history.push({
                    price: stock.price,
                    timestamp: Date.now()
                });
                
                if (stock.history.length > 100) {
                    stock.history.shift();
                }
            });
            this.saveMarketData();
        }
    }

    getUserPortfolio(userId) {
        if (!this.portfolios[userId]) {
            this.portfolios[userId] = {
                stocks: {},
                transactions: [],
                lastUpdate: Date.now()
            };
            this.saveMarketData();
        }
        return this.portfolios[userId];
    }

    async buyStock(userId, symbol, quantity) {
        const stock = this.stocks[symbol];
        if (!stock) throw new Error("Mã cổ phiếu không tồn tại");

        const totalCost = stock.price * quantity;
        const balance = await getBalance(userId);
        
        if (balance < totalCost) {
            throw new Error("Số dư không đủ để thực hiện giao dịch");
        }

        const portfolio = this.getUserPortfolio(userId);
        
        if (!portfolio.stocks[symbol]) {
            portfolio.stocks[symbol] = {
                quantity: 0,
                averagePrice: 0
            };
        }

        const oldValue = portfolio.stocks[symbol].quantity * portfolio.stocks[symbol].averagePrice;
        const newValue = totalCost;
        const totalQuantity = portfolio.stocks[symbol].quantity + quantity;
        
        portfolio.stocks[symbol].averagePrice = (oldValue + newValue) / totalQuantity;
        portfolio.stocks[symbol].quantity = totalQuantity;

        portfolio.transactions.push({
            type: 'buy',
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, -totalCost);
        this.saveMarketData();

        return {
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            total: totalCost
        };
    }

    async sellStock(userId, symbol, quantity) {
        const stock = this.stocks[symbol];
        if (!stock) throw new Error("Mã cổ phiếu không tồn tại");

        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
            throw new Error("Không đủ cổ phiếu để bán");
        }

        const totalValue = stock.price * quantity;
        portfolio.stocks[symbol].quantity -= quantity;

        if (portfolio.stocks[symbol].quantity === 0) {
            delete portfolio.stocks[symbol];
        }

        portfolio.transactions.push({
            type: 'sell',
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, totalValue);
        this.saveMarketData();

        return {
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            total: totalValue
        };
    }

    getMarketOverview() {
        const overview = {
            stocks: {},
            timestamp: Date.now()
        };

        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
            overview.stocks[symbol] = {
                name: stock.name,
                price: stock.price,
                change: stock.change,
                volume: stock.volume
            };
        });

        return overview;
    }

    calculateTrend(symbol, period = 5) {
        const stock = this.stocks[symbol];
        if (!stock || stock.history.length < period) return 0;

        const recentPrices = stock.history.slice(-period);
        const firstPrice = recentPrices[0].price;
        const lastPrice = recentPrices[recentPrices.length - 1].price;
        
        return ((lastPrice - firstPrice) / firstPrice) * 100;
    }

    getUserStats(userId) {
        const portfolio = this.getUserPortfolio(userId);
        let stats = {
            totalValue: 0,
            totalProfit: 0,
            bestPerforming: null,
            worstPerforming: null
        };

        Object.entries(portfolio.stocks).forEach(([symbol, data]) => {
            const stock = this.stocks[symbol];
            const currentValue = stock.price * data.quantity;
            const profitLoss = currentValue - (data.averagePrice * data.quantity);
            
            stats.totalValue += currentValue;
            stats.totalProfit += profitLoss;

            const performance = (profitLoss / (data.averagePrice * data.quantity)) * 100;

            if (!stats.bestPerforming || performance > stats.bestPerforming.performance) {
                stats.bestPerforming = {symbol, performance};
            }
            if (!stats.worstPerforming || performance < stats.worstPerforming.performance) {
                stats.worstPerforming = {symbol, performance};
            }
        });

        return stats;
    }

    getMarketAnalysis() {
        let analysis = {
            topGainers: [],
            topLosers: [],
            mostActive: [],
            marketTrend: 0
        };

        const stocks = Object.entries(this.stocks);
        
        stocks.sort((a, b) => b[1].change - a[1].change);
        analysis.topGainers = stocks.slice(0, 3);
        analysis.topLosers = stocks.slice(-3).reverse();

        stocks.sort((a, b) => b[1].volume - a[1].volume);
        analysis.mostActive = stocks.slice(0, 3);

        const totalChange = stocks.reduce((sum, [_, stock]) => sum + stock.change, 0);
        analysis.marketTrend = totalChange / stocks.length;

        return analysis;
    }
}

const market = new StockMarket();

setInterval(() => market.updatePrices(), 30000); 

module.exports = {
    name: "trade",
    dev: "HNT",
    info: "Giao dịch chứng khoán",
    onPrefix: true,
    usages: ".trade [check/buy/sell/portfolio/info] [mã CP] [số lượng]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            if (Object.keys(market.stocks).length === 0) {
                market.loadMarketData();
            }

            if (!target[0]) {
                return api.sendMessage(
                    "💎 CHỨNG KHOÁN AKI 💎\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "Lệnh:\n" +
                    "1. .trade check - Xem thị trường\n" +
                    "2. .trade buy [mã] [số lượng] - Mua\n" +
                    "3. .trade sell [mã] [số lượng] - Bán\n" +
                    "4. .trade portfolio - Xem danh mục\n" +
                    "5. .trade info [mã] - Thông tin CP",
                    threadID, messageID
                );
            }

            const command = target[0].toLowerCase();

            switch (command) {
                case "check": {
                    const overview = market.getMarketOverview();
                    const analysis = market.getMarketAnalysis();
                    
                    let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";
                    message += "🏆 TOP TĂNG GIÁ:\n";
                    
                    analysis.topGainers.forEach(([symbol, data]) => {
                        message += `${symbol}: ${data.price.toLocaleString('vi-VN')} Xu (🔺${data.change.toFixed(2)}%)\n`;
                    });
                    
                    message += "\n📉 TOP GIẢM GIÁ:\n";
                    analysis.topLosers.forEach(([symbol, data]) => {
                        message += `${symbol}: ${data.price.toLocaleString('vi-VN')} Xu (🔻${Math.abs(data.change).toFixed(2)}%)\n`;
                    });
                    
                    message += "\n📈 GIAO DỊCH MẠNH NHẤT:\n";
                    analysis.mostActive.forEach(([symbol, data]) => {
                        message += `${symbol}: ${data.volume.toLocaleString('vi-VN')} CP\n`;
                    });
                    
                    message += "\n💎 CỔ PHIẾU KHÁC:\n";
                    Object.entries(overview.stocks)
                        .filter(([symbol]) => 
                            !analysis.topGainers.concat(analysis.topLosers)
                                .map(([sym]) => sym)
                                .includes(symbol)
                        )
                        .forEach(([symbol, data]) => {
                            const changeIcon = data.change > 0 ? "🔺" : data.change < 0 ? "🔻" : "➖";
                            message += `${symbol}: ${data.price.toLocaleString('vi-VN')} Xu (${changeIcon}${Math.abs(data.change).toFixed(2)}%)\n`;
                        });

                    return api.sendMessage(message, threadID, messageID);
                }

                case "buy": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);

                    if (!symbol || !quantity || quantity <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!", threadID, messageID);
                    }

                    try {
                        const result = await market.buyStock(senderID, symbol, quantity);
                        const remainingBalance = await getBalance(senderID);
                        const affordableQuantity = Math.floor(remainingBalance / market.stocks[symbol].price);

                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 Mã CP: ${result.symbol}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${result.price.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tổng: ${result.total.toLocaleString('vi-VN')} Xu\n` +
                            `📊 Số dư: ${remainingBalance.toLocaleString('vi-VN')} Xu\n` +
                            `✨ Có thể mua thêm: ${affordableQuantity} CP`,
                            threadID, messageID
                        );
                    } catch (error) {
                        if (error.message === "Số dư không đủ để thực hiện giao dịch") {
                            const balance = await getBalance(senderID);
                            const affordableQuantity = Math.floor(balance / market.stocks[symbol].price);
                            return api.sendMessage(
                                `❌ ${error.message}\n` +
                                `💰 Số dư hiện tại: ${balance.toLocaleString('vi-VN')} Xu\n` +
                                `✨ Bạn có thể mua tối đa: ${affordableQuantity} CP`,
                                threadID, messageID
                            );
                        }
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "sell": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);

                    if (!symbol || !quantity || quantity <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!", threadID, messageID);
                    }

                    const result = await market.sellStock(senderID, symbol, quantity);
                    return api.sendMessage(
                        "✅ GIAO DỊCH THÀNH CÔNG\n" +
                        `🏢 Mã CP: ${result.symbol}\n` +
                        `🔢 Số lượng: ${result.quantity}\n` +
                        `💰 Giá: ${result.price.toLocaleString('vi-VN')} Xu\n` +
                        `💵 Tổng: ${result.total.toLocaleString('vi-VN')} Xu\n` +
                        `📊 Số dư: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu`,
                        threadID, messageID
                    );
                }

                case "portfolio": {
                    const portfolio = market.getUserPortfolio(senderID);
                    let totalValue = 0;
                    let message = "📈 DANH MỤC ĐẦU TƯ 📈\n━━━━━━━━━━━━━━━━━━\n\n";

                    if (Object.keys(portfolio.stocks).length === 0) {
                        return api.sendMessage("Bạn chưa có cổ phiếu nào!", threadID, messageID);
                    }

                    Object.entries(portfolio.stocks).forEach(([symbol, data]) => {
                        const stock = market.stocks[symbol];
                        const currentValue = stock.price * data.quantity;
                        const profitLoss = currentValue - (data.averagePrice * data.quantity);
                        totalValue += currentValue;

                        message += `🏢 ${symbol} - ${stock.name}\n`;
                        message += `🔢 Số lượng: ${data.quantity}\n`;
                        message += `💰 Giá TB: ${data.averagePrice.toLocaleString('vi-VN')} Xu\n`;
                        message += `📊 Giá HT: ${stock.price.toLocaleString('vi-VN')} Xu\n`;
                        message += `💵 Giá trị: ${currentValue.toLocaleString('vi-VN')} Xu\n`;
                        message += `${profitLoss >= 0 ? '📈' : '📉'} Lãi/Lỗ: ${profitLoss.toLocaleString('vi-VN')} Xu\n\n`;
                    });

                    message += `💎 Tổng giá trị: ${totalValue.toLocaleString('vi-VN')} Xu`;
                    return api.sendMessage(message, threadID, messageID);
                }

                case "info": {
                    const symbol = target[1]?.toUpperCase();
                    if (!symbol || !market.stocks[symbol]) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu hợp lệ!", threadID, messageID);
                    }

                    const stock = market.stocks[symbol];
                    const message = 
                        `🏢 ${symbol} - ${stock.name}\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `💰 Giá: ${stock.price.toLocaleString('vi-VN')} Xu\n` +
                        `📊 Thay đổi: ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%\n` +
                        `📈 Volume: ${stock.volume.toLocaleString('vi-VN')}\n` +
                        `💎 Vốn hóa: ${stock.marketCap.toLocaleString('vi-VN')} Xu\n\n` +
                        `📌 Lịch sử giá (5 gần nhất):\n` +
                        stock.history.slice(-5).map(h => {
                            const date = new Date(h.timestamp);
                            return `${date.getHours()}:${date.getMinutes()}: ${h.price.toLocaleString('vi-VN')} Xu`;
                        }).join('\n');

                    return api.sendMessage(message, threadID, messageID);
                }
            }
        } catch (error) { 
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};