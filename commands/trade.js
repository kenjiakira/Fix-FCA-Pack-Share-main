const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const axios = require('axios');

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
        this.lastUpdate = null;
        this.updateInterval = 30000;
        this.marketState = {
            prevDayClose: {},
            lastResetDate: null,
            status: 'CLOSED',  
            gapMovements: {}
        };
        this.marketStats = {
            totalTradingVolume: 0,
            totalTransactions: 0,
            totalMoneyFlow: 0,
            dailyStats: {
                volume: 0,
                transactions: 0,
                moneyIn: 0,
                moneyOut: 0,
                date: new Date().toDateString()
            },
            historicalStats: []
        };
        this.loadMarketData();
        this.checkMarketStatus();
        this.startUpdates();
    }

    startUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= this.marketHours.open && hour < this.marketHours.close) {
            this.updatePrices();
            this.updateTimer = setInterval(() => {
                this.updatePrices();
            }, this.updateInterval);
        }
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
            fs.writeFileSync(MARKET_DATA_PATH, JSON.stringify(this.stocks));
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify(this.portfolios));
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
                volume: 100000,
                marketCap: 167000000000000,
                history: [],
                supply: 1000000,
                demand: 800000,
                dailyVolume: 0,
                maxDailyVolume: 300000 
            },
            "FPT": {
                name: "FPT Corp",
                price: 90000,
                change: 0,
                volume: 800000,
                marketCap: 108000000000000,
                history: [],
                supply: 800000,
                demand: 600000,
                dailyVolume: 0,
                maxDailyVolume: 240000
            },
            "VIC": {
                name: "Vingroup",
                price: 100000,
                change: 0,
                volume: 1200000,
                marketCap: 320000000000000,
                history: [],
                supply: 1200000,
                demand: 1000000,
                dailyVolume: 0,
                maxDailyVolume: 360000
            },
            "BID": {
                name: "BIDV Bank",
                price: 45000,
                change: 0,
                volume: 900000,
                marketCap: 180000000000000,
                history: [],
                supply: 900000,
                demand: 700000,
                dailyVolume: 0,
                maxDailyVolume: 270000 
            },
            "VCB": {
                name: "Vietcombank", 
                price: 85000,
                change: 0,
                volume: 950000,
                marketCap: 315000000000000,
                history: [],
                supply: 950000,
                demand: 750000,
                dailyVolume: 0,
                maxDailyVolume: 285000
            },
            "HPG": {
                name: "Hòa Phát",
                price: 35000,
                change: 0,
                volume: 1500000,
                marketCap: 156000000000000,
                history: [],
                supply: 1500000,
                demand: 1200000,
                dailyVolume: 0,
                maxDailyVolume: 450000 
            },
            "MSN": {
                name: "Masan Group",
                price: 95000,
                change: 0,
                volume: 700000,
                marketCap: 112000000000000,
                history: [],
                supply: 700000,
                demand: 500000,
                dailyVolume: 0,
                maxDailyVolume: 210000 
            }
        };

        const now = Date.now();
        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
     
            if (!Array.isArray(stock.history)) {
                stock.history = [];
            }
            for (let i = 0; i < 10; i++) {
                stock.history.push({
                    price: stock.price,
                    timestamp: now - (i * 60000)
                });
            }
        });

        const dir = path.dirname(MARKET_DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.saveMarketData();
    }

    checkMarketStatus() {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();

        // Reset daily stats if it's a new day
        const today = new Date().toDateString();
        if (this.marketState.lastResetDate !== today && hour >= this.marketHours.open) {
            this.resetDailyStats();
        }

        if (hour < this.marketHours.open - 1) {
            this.marketState.status = 'CLOSED';
        } else if (hour === this.marketHours.open - 1) {
            this.marketState.status = 'PRE_MARKET';
        } else if (hour >= this.marketHours.open && hour < this.marketHours.close) {
            this.marketState.status = 'OPEN';
        } else if (hour === this.marketHours.close && minutes < 30) {
            this.marketState.status = 'POST_MARKET';
        } else {
            this.marketState.status = 'CLOSED';
        }
    }

    resetDailyStats() {
        const today = new Date().toDateString();
        
        // Save yesterday's stats to history
        if (this.marketStats.dailyStats.date !== today && 
            this.marketStats.dailyStats.transactions > 0) {
            this.marketStats.historicalStats.push({...this.marketStats.dailyStats});
            // Keep only last 30 days
            if (this.marketStats.historicalStats.length > 30) {
                this.marketStats.historicalStats.shift();
            }
        }

        // Reset daily stats
        this.marketStats.dailyStats = {
            volume: 0,
            transactions: 0,
            moneyIn: 0,
            moneyOut: 0,
            date: today
        };

        Object.keys(this.stocks).forEach(symbol => {
            this.marketState.prevDayClose[symbol] = this.stocks[symbol].price;
            this.stocks[symbol].dailyVolume = 0;
            
            const gapPercent = (Math.random() - 0.5) * 6; 
            const marketSentiment = Math.random() < 0.7 ? Math.sign(gapPercent) : -Math.sign(gapPercent);
            const gapMultiplier = 1 + (gapPercent / 100);
            
            this.marketState.gapMovements[symbol] = {
                percent: gapPercent,
                targetPrice: Math.round(this.stocks[symbol].price * gapMultiplier),
                sentiment: marketSentiment
            };
        });

        this.saveMarketData();
    }

    updatePrices() {
        this.checkMarketStatus();
        if (this.marketState.status === 'CLOSED') return;

        let marketChanged = false;
        
        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
            let priceChange = 0;

            if (this.marketState.status === 'PRE_MARKET') {
                // Reduce pre-market gap movements
                const gap = this.marketState.gapMovements[symbol];
                if (gap) {
                    const distanceToTarget = gap.targetPrice - stock.price;
                    priceChange = (distanceToTarget * 0.1) + (Math.random() - 0.5) * 500;
                }
            } else {
                // Reduced volatility for normal trading hours
                const supplyChange = Math.floor((Math.random() - 0.5) * stock.supply * 0.05);
                const demandChange = Math.floor((Math.random() - 0.5) * stock.demand * 0.05);
                
                stock.supply = Math.max(100000, stock.supply + supplyChange);
                stock.demand = Math.max(100000, stock.demand + demandChange);

                const supplyDemandRatio = stock.demand / stock.supply;
                const priceImpact = (supplyDemandRatio - 1) * 0.02; // Reduced impact
                
                const baseVolatility = 0.015; // Reduced base volatility
                const randomFactor = Math.random();
                const volatility = randomFactor < 0.1 ? baseVolatility * 2 
                               : randomFactor < 0.3 ? baseVolatility * 1.5 
                               : baseVolatility;

                const marketSentiment = (Math.random() - 0.5) * volatility;
                priceChange = (priceImpact + marketSentiment) * stock.price;

                // Add price change limits
                const maxChangePercent = 0.03; // Maximum 3% change per update
                const maxChange = stock.price * maxChangePercent;
                priceChange = Math.max(Math.min(priceChange, maxChange), -maxChange);
            }

            // Only update if price change is significant but not too large
            if (Math.abs(priceChange) > 20 && Math.abs(priceChange) < stock.price * 0.05) {
                marketChanged = true;
                const oldPrice = stock.price;
                
                // Ensure new price stays within reasonable bounds
                const minPrice = this.getInitialPrice(symbol) * 0.3; // Minimum 30% of initial price
                const maxPrice = this.getInitialPrice(symbol) * 3; // Maximum 300% of initial price
                const newPrice = Math.max(minPrice, Math.min(maxPrice, Math.round(oldPrice + priceChange)));
                
                stock.price = newPrice;
                stock.change = ((newPrice - (this.marketState.prevDayClose[symbol] || oldPrice)) / 
                              (this.marketState.prevDayClose[symbol] || oldPrice)) * 100;

                // More conservative volume calculations
                const baseVolume = stock.supply * 0.05;
                const volatilityMultiplier = 1 + (Math.abs(stock.change) / 200);
                const randomFactor = 0.7 + (Math.random() * 0.6);
                const newVolume = Math.floor(baseVolume * volatilityMultiplier * randomFactor);
                
                const maxVolume = stock.supply * 0.2;
                stock.volume = Math.min(newVolume, maxVolume);

                const now = new Date();
                if (now.getHours() === this.marketHours.open && now.getMinutes() < 5) {
                    stock.dailyVolume = 0;
                }
                
                const remainingCap = maxVolume - stock.dailyVolume;
                const volumeToAdd = Math.min(stock.volume, remainingCap);
                stock.dailyVolume += volumeToAdd;

                stock.history.push({
                    price: newPrice,
                    timestamp: Date.now(),
                    volume: stock.volume
                });

                if (stock.history.length > 100) {
                    stock.history = stock.history.slice(-100);
                }
            }
        });

        if (marketChanged) {
            this.saveMarketData();
        }

        this.lastUpdate = Date.now();
    }

    getInitialPrice(symbol) {
        const initialPrices = {
            "VNM": 80000,
            "FPT": 90000,
            "VIC": 100000,
            "BID": 45000,
            "VCB": 85000,
            "HPG": 35000,
            "MSN": 95000
        };
        return initialPrices[symbol] || 50000;
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
      
        const now = new Date();
        const hour = now.getHours();
        if (hour < this.marketHours.open || hour >= this.marketHours.close) {
            throw new Error(`Thị trường đóng cửa! Giao dịch từ ${this.marketHours.open}:00 đến ${this.marketHours.close}:00`);
        }

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
        
        stock.supply = Math.max(0, stock.supply - quantity);
        stock.demand += Math.floor(quantity * 0.8);
        stock.dailyVolume += quantity;

        // Update market statistics
        this.marketStats.totalTradingVolume += quantity;
        this.marketStats.totalTransactions++;
        this.marketStats.totalMoneyFlow += totalCost;
        this.marketStats.dailyStats.volume += quantity;
        this.marketStats.dailyStats.transactions++;
        this.marketStats.dailyStats.moneyIn += totalCost;

        this.saveMarketData();

        return {
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            total: totalCost
        };
    }

    async sellStock(userId, symbol, quantity) {

        const now = new Date();
        const hour = now.getHours();
        if (hour < this.marketHours.open || hour >= this.marketHours.close) {
            throw new Error(`Thị trường đóng cửa! Giao dịch từ ${this.marketHours.open}:00 đến ${this.marketHours.close}:00`);
        }

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
        
        // Update supply and demand when selling
        stock.supply += quantity;
        stock.demand = Math.max(0, stock.demand - Math.floor(quantity * 0.8));
        stock.dailyVolume += quantity;

        // Update market statistics
        this.marketStats.totalTradingVolume += quantity;
        this.marketStats.totalTransactions++;
        this.marketStats.totalMoneyFlow += totalValue;
        this.marketStats.dailyStats.volume += quantity;
        this.marketStats.dailyStats.transactions++;
        this.marketStats.dailyStats.moneyOut += totalValue;

        this.saveMarketData();

        return {
            symbol: symbol,
            quantity: quantity,
            price: stock.price,
            total: totalValue
        };
    }

    getMarketOverview() {
        this.checkMarketStatus();
        const overview = {
            stocks: {},
            timestamp: Date.now(),
            marketState: this.marketState.status,
            tradingHours: {
                open: this.marketHours.open,
                close: this.marketHours.close
            }
        };

        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
            const prevClose = this.marketState.prevDayClose[symbol];
            overview.stocks[symbol] = {
                name: stock.name,
                price: stock.price,
                change: stock.change,
                prevClose: prevClose || stock.price,
                volume: stock.volume,
                dailyVolume: stock.dailyVolume
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
            marketTrend: 0,
            statistics: {
                total: {
                    volume: this.marketStats.totalTradingVolume,
                    transactions: this.marketStats.totalTransactions,
                    moneyFlow: this.marketStats.totalMoneyFlow
                },
                daily: {
                    ...this.marketStats.dailyStats,
                    netFlow: this.marketStats.dailyStats.moneyIn - this.marketStats.dailyStats.moneyOut
                },
                averages: {
                    dailyVolume: 0,
                    dailyTransactions: 0,
                    dailyMoneyFlow: 0
                }
            }
        };

        const stocks = Object.entries(this.stocks);
        
        stocks.sort((a, b) => b[1].change - a[1].change);
        analysis.topGainers = stocks.slice(0, 3);
        analysis.topLosers = stocks.slice(-3).reverse();

        stocks.sort((a, b) => b[1].volume - a[1].volume);
        analysis.mostActive = stocks.slice(0, 3);

        const totalChange = stocks.reduce((sum, [_, stock]) => sum + stock.change, 0);
        analysis.marketTrend = totalChange / stocks.length;

        // Calculate averages from historical data
        if (this.marketStats.historicalStats.length > 0) {
            const historicalTotals = this.marketStats.historicalStats.reduce((acc, day) => {
                return {
                    volume: acc.volume + day.volume,
                    transactions: acc.transactions + day.transactions,
                    moneyFlow: acc.moneyFlow + (day.moneyIn - day.moneyOut)
                };
            }, { volume: 0, transactions: 0, moneyFlow: 0 });

            const daysCount = this.marketStats.historicalStats.length;
            analysis.statistics.averages = {
                dailyVolume: Math.round(historicalTotals.volume / daysCount),
                dailyTransactions: Math.round(historicalTotals.transactions / daysCount),
                dailyMoneyFlow: Math.round(historicalTotals.moneyFlow / daysCount)
            };
        }

        return analysis;
    }

    isMarketOpen() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= this.marketHours.open && hour < this.marketHours.close;
    }
}

const market = new StockMarket();

module.exports = {
    name: "trade",
    dev: "HNT",
    info: "Giao dịch chứng khoán",
    onPrefix: true,
    usages: ".trade [check/buy/sell/portfolio/info] [mã CP] [số lượng]",
    cooldowns: 5,
    market, 
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!market.lastUpdate || Date.now() - market.lastUpdate > 60000) {
            market.startUpdates();
        }

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

            const now = new Date();
            const hour = now.getHours();
            const isMarketOpen = hour >= market.marketHours.open && hour < market.marketHours.close;

            switch (command) {
                case "check": {
                    const overview = market.getMarketOverview();
                    const analysis = market.getMarketAnalysis();
                    
                    let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n";
                    message += `🕒 Trạng thái: ${
                        overview.marketState === 'CLOSED' ? '🔴 Đã đóng cửa' :
                        overview.marketState === 'PRE_MARKET' ? '🟡 Chuẩn bị mở cửa' :
                        overview.marketState === 'OPEN' ? '🟢 Đang giao dịch' :
                        overview.marketState === 'POST_MARKET' ? '🟠 Đóng cửa định kỳ' : '🔴 Đã đóng cửa'
                    }\n`;
                    message += `⏰ Giờ giao dịch: ${market.marketHours.open}:00 - ${market.marketHours.close}:00\n\n`;
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
                    
                    message += "\n📊 THỐNG KÊ GIAO DỊCH:\n";
                    message += `💰 Tổng giá trị GD: ${analysis.statistics.total.moneyFlow.toLocaleString('vi-VN')} Xu\n`;
                    message += `📈 Số lệnh hôm nay: ${analysis.statistics.daily.transactions}\n`;
                    message += `💎 Khối lượng: ${analysis.statistics.daily.volume.toLocaleString('vi-VN')} CP\n`;
                    message += `➡️ Tiền vào: ${analysis.statistics.daily.moneyIn.toLocaleString('vi-VN')} Xu\n`;
                    message += `⬅️ Tiền ra: ${analysis.statistics.daily.moneyOut.toLocaleString('vi-VN')} Xu\n`;
                    message += `📊 Dòng tiền thuần: ${analysis.statistics.daily.netFlow.toLocaleString('vi-VN')} Xu\n\n`;

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
                    
                    const timestamps = stock.history.map(h => {
                        const date = new Date(h.timestamp);
                        return `${date.getHours()}:${date.getMinutes()}`;
                    });
                    const prices = stock.history.map(h => h.price);
                    
                    const maxPrice = Math.max(...prices);
                    const minPrice = Math.min(...prices);
                    const padding = (maxPrice - minPrice) * 0.1;

                    const chartUrl = `https://quickchart.io/chart?c={
                        type:'line',
                        data:{
                            labels:${JSON.stringify(timestamps)},
                            datasets:[{
                                label:'${symbol} Price',
                                data:${JSON.stringify(prices)},
                                fill:true,
                                borderColor:'rgb(59, 130, 246)',
                                borderWidth:2,
                                pointRadius:0,
                                tension:0.4,
                                backgroundColor:'rgba(59, 130, 246, 0.1)'
                            }]
                        },
                        options:{
                            responsive:true,
                            plugins:{
                                title:{
                                    display:true,
                                    text:'${symbol} - Price History',
                                    font:{size:16}
                                },
                                legend:{display:false}
                            },
                            scales:{
                                y:{
                                    min:${minPrice - padding},
                                    max:${maxPrice + padding},
                                    ticks:{
                                        callback:'function(value){return value.toLocaleString("vi-VN")+" Xu"}',
                                        font:{size:11}
                                    },
                                    grid:{
                                        display:true,
                                        color:'rgba(0,0,0,0.1)'
                                    }
                                },
                                x:{
                                    ticks:{
                                        maxRotation:45,
                                        autoSkip:true,
                                        maxTicksLimit:8,
                                        font:{size:11}
                                    },
                                    grid:{display:false}
                                }
                            },
                            elements:{
                                point:{
                                    radius:0,
                                    hitRadius:10,
                                    hoverRadius:4
                                }
                            },
                            animation:false,
                            interaction:{
                                intersect:false,
                                mode:'index'
                            }
                        }
                    }`.replace(/\s+/g, '');

                    try {
                        const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
                        const chartPath = __dirname + `/cache/trade_chart_${symbol}_${Date.now()}.png`;
                        require('fs').writeFileSync(chartPath, chartResponse.data);

                        const message = 
                            `🏢 ${symbol} - ${stock.name}\n` +
                            `━━━━━━━━━━━━━━━━━━\n\n` +
                            `💰 Giá: ${stock.price.toLocaleString('vi-VN')} Xu\n` +
                            `📊 Thay đổi: ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%\n` +
                            `📈 Volume: ${stock.volume.toLocaleString('vi-VN')}\n` +
                            `💎 Vốn hóa: ${stock.marketCap.toLocaleString('vi-VN')} Xu\n` +
                            `📉 Supply: ${stock.supply.toLocaleString('vi-VN')}\n` +
                            `📈 Demand: ${stock.demand.toLocaleString('vi-VN')}\n\n` +
                            `⏰ Cập nhật: ${new Date().toLocaleString()}`;

                        await api.sendMessage({
                            body: message,
                            attachment: require('fs').createReadStream(chartPath)
                        }, threadID, () => {
                            require('fs').unlinkSync(chartPath);
                        });
                    } catch (error) {
                        console.error(error);
                        api.sendMessage("❌ Có lỗi khi tạo biểu đồ!", threadID, messageID);
                    }

                    return;
                }
            }
        } catch (error) { 
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};