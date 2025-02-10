const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const axios = require('axios');
const StockChart = require('../config/trade/stockChart');
const MarketAlgorithms = require('../config/trade/marketAlgorithms');

const USER_PORTFOLIO_PATH = path.join(__dirname, './json/portfolios.json');
const EXCHANGE_RATE_PATH = path.join(__dirname, './json/exchange_rate.json');
const STOCKS_DATA_PATH = path.join(__dirname, './json/stocks_data.json');
const MARKET_HOURS = {
    open: 9,  
    close: 16 
};

const DEFAULT_STOCKS = {
    'AAPL': { name: 'Apple Inc.', basePrice: 150 },
    'MSFT': { name: 'Microsoft', basePrice: 280 },
    'GOOGL': { name: 'Google', basePrice: 120 },
    'AMZN': { name: 'Amazon', basePrice: 130 },
    'META': { name: 'Meta/Facebook', basePrice: 300 },
    'TSLA': { name: 'Tesla', basePrice: 250 },
    'NVDA': { name: 'NVIDIA', basePrice: 450 },
    'JPM': { name: 'JPMorgan', basePrice: 140 },
    'V': { name: 'Visa', basePrice: 200 }
};

const FEES = {
    transaction: 0.001, 
    tax: 0.001      
};

class StockMarket {
    constructor() {
        this.portfolios = {};
        this.stocks = {};
        this.xuRate = this.loadExchangeRate();
        this.loadStocks();
        this.loadPortfolios();
        this.startUpdates();
    }

    loadExchangeRate() {
        try {
            if (fs.existsSync(EXCHANGE_RATE_PATH)) {
                const data = JSON.parse(fs.readFileSync(EXCHANGE_RATE_PATH));
                return data.rate;
            }
        } catch (error) {
            console.error("Error loading exchange rate:", error);
        }
        const newRate = Math.floor(Math.random() * 901) + 100;
        this.saveExchangeRate(newRate);
        return newRate;
    }

    loadStocks() {
        try {
            if (fs.existsSync(STOCKS_DATA_PATH)) {
                this.stocks = JSON.parse(fs.readFileSync(STOCKS_DATA_PATH));
            } else {
                this.initializeStocks();
            }
        } catch (error) {
            console.error("Error loading stocks:", error);
            this.initializeStocks();
        }
    }

    initializeStocks() {
        this.stocks = {};
        Object.entries(DEFAULT_STOCKS).forEach(([symbol, data]) => {
            const usdPrice = MarketAlgorithms.generateInitialPrice(data.basePrice);
            
            this.stocks[symbol] = {
                name: data.name,
                priceUSD: usdPrice,
                price: usdPrice * this.xuRate,
                change: 0,
                changePercent: 0,
                volume: Math.floor(Math.random() * 100000) + 10000,
                depth: {
                    bids: MarketAlgorithms.generateMarketDepth(usdPrice, true),
                    asks: MarketAlgorithms.generateMarketDepth(usdPrice, false)
                },
                lastUpdate: Date.now(),
                history: [{
                    price: usdPrice * this.xuRate,
                    timestamp: Date.now()
                }]
            };
        });
        this.saveStocks();
    }

    updatePrices() {
        Object.entries(this.stocks).forEach(([symbol, stock]) => {
            const finalChange = MarketAlgorithms.calculatePriceChange(stock.priceUSD, stock.change);
            const newPriceUSD = Math.max(1, Math.floor(stock.priceUSD * (1 + finalChange / 100)));
            const newPrice = newPriceUSD * this.xuRate;

            const history = [...(stock.history || []), {
                price: newPrice,
                timestamp: Date.now()
            }].slice(-100);

            this.stocks[symbol] = {
                ...stock,
                priceUSD: newPriceUSD,
                price: newPrice,
                change: finalChange,
                changePercent: finalChange,
                volume: MarketAlgorithms.calculateVolume(stock.volume),
                depth: {
                    bids: MarketAlgorithms.generateMarketDepth(newPriceUSD, true),
                    asks: MarketAlgorithms.generateMarketDepth(newPriceUSD, false)
                },
                lastUpdate: Date.now(),
                history
            };
        });
        this.saveStocks();
    }

    startUpdates() {
        setInterval(() => {
            const hour = new Date().getHours();
            if (hour >= MARKET_HOURS.open && hour < MARKET_HOURS.close) {
                this.updatePrices();
            }
        }, 30000); 
    }

    saveStocks() {
        try {
            fs.writeFileSync(STOCKS_DATA_PATH, JSON.stringify(this.stocks));
        } catch (error) {
            console.error("Error saving stocks:", error);
        }
    }

    loadPortfolios() {
        try {
            if (!fs.existsSync(path.dirname(USER_PORTFOLIO_PATH))) {
                fs.mkdirSync(path.dirname(USER_PORTFOLIO_PATH), { recursive: true });
            }

            if (fs.existsSync(USER_PORTFOLIO_PATH)) {
                this.portfolios = JSON.parse(fs.readFileSync(USER_PORTFOLIO_PATH));
            } else {
                this.portfolios = {};
                this.savePortfolios();
            }
        } catch (error) {
            console.error("Error loading portfolios:", error);
            this.portfolios = {};
        }
    }

    savePortfolios() {
        try {
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify(this.portfolios));
        } catch (error) {
            console.error("Error saving portfolios:", error);
        }
    }

    getStockPrice(symbol) {
        const stock = this.stocks[symbol];
        if (!stock) throw new Error('Invalid stock symbol');
        return stock;
    }

    getUserPortfolio(userId) {
        if (!this.portfolios[userId]) {
            this.portfolios[userId] = {
                stocks: {},
                transactions: []
            };
            this.savePortfolios();
        }
        return this.portfolios[userId];
    }

    async buyStock(userId, symbol, quantity) {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour < MARKET_HOURS.open || hour >= MARKET_HOURS.close) {
            throw new Error(`Market is closed! Trading hours: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }

        const stockData = this.getStockPrice(symbol);
        const totalCost = stockData.price * quantity;
        const fees = totalCost * FEES.transaction;
        const tax = totalCost * FEES.tax;
        const totalWithFees = totalCost + fees + tax;
        
        const balance = await getBalance(userId);
        
        if (balance < totalWithFees) {
            throw new Error("Insufficient balance (including fees and tax)");
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
            price: stockData.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, -totalWithFees);
        this.savePortfolios();

        return {
            symbol,
            quantity,
            price: stockData.price,
            total: totalCost,
            fees,
            tax,
            totalWithFees
        };
    }

    async sellStock(userId, symbol, quantity) {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour < MARKET_HOURS.open || hour >= MARKET_HOURS.close) {
            throw new Error(`Market is closed! Trading hours: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }

        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
            throw new Error("Insufficient stocks to sell");
        }

        const stockData = this.getStockPrice(symbol);
        const totalValue = stockData.price * quantity;

        portfolio.stocks[symbol].quantity -= quantity;
        if (portfolio.stocks[symbol].quantity === 0) {
            delete portfolio.stocks[symbol];
        }

        portfolio.transactions.push({
            type: 'sell',
            symbol: symbol,
            quantity: quantity,
            price: stockData.price,
            timestamp: Date.now()
        });

        await updateBalance(userId, totalValue);
        this.savePortfolios();

        return {
            symbol,
            quantity,
            price: stockData.price,
            total: totalValue
        };
    }

    getMarketOverview() {
        return {
            stocks: this.stocks,
            xuRate: this.xuRate
        };
    }

    getMarketAnalysis() {
        return MarketAlgorithms.analyzeMarket(this.stocks);
    }

    isMarketOpen() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= MARKET_HOURS.open && hour < MARKET_HOURS.close;
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

        try {
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
            const isMarketOpen = hour >= MARKET_HOURS.open && hour < MARKET_HOURS.close;

            switch (command) {
                case "check": {
                    const overview = await market.getMarketOverview();
                    
                    let message = "📊 BẢNG GIÁ CHỨNG KHOÁN 📊\n";
                    message += "━━━━━━━━━━━━━━━━━━\n";
                    message += `🕒 Trạng thái: ${isMarketOpen ? '🟢 Đang giao dịch' : '🔴 Đã đóng cửa'}\n`;
                    message += `⏰ Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00\n`;
                    message += `💱 Tỉ giá: 1$ = ${market.xuRate.toLocaleString('vi-VN')} Xu\n\n`;
                    message += "💎 CỔ PHIẾU:\n";

                    Object.entries(overview.stocks).forEach(([symbol, data]) => {
                        const changeIcon = data.change > 0 ? "🔺" : data.change < 0 ? "🔻" : "➖";
                        message += `${symbol}: $${data.priceUSD} (${data.price.toLocaleString('vi-VN')} Xu) ${changeIcon}${Math.abs(data.changePercent).toFixed(2)}%\n`;
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
                            `📋 Phí GD: ${result.fees.toLocaleString('vi-VN')} Xu\n` +
                            `🏷️ Thuế: ${result.tax.toLocaleString('vi-VN')} Xu\n` +
                            `💶 Tổng cộng: ${result.totalWithFees.toLocaleString('vi-VN')} Xu\n` +
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
                    const stock = market.stocks[symbol];
                    
                    if (!symbol || !stock) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu hợp lệ!", threadID, messageID);
                    }

                    const history = stock.history || [];
                    if (history.length === 0) {
                        stock.history = MarketAlgorithms.generateRandomHistory(stock.price);
                    }

                    const reversedHistory = [...history].reverse();
                    const timestamps = reversedHistory.map(h => {
                        const date = new Date(h.timestamp);
                        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                    });
                    const prices = reversedHistory.map(h => h.price);

                    try {
                        const chartPath = await StockChart.generate({
                            symbol,
                            name: stock.name,
                            timestamps,
                            prices,
                            outputDir: path.join(__dirname, 'cache')
                        });

                        const message = 
                            `🏢 ${symbol} - ${stock.name}\n` +
                            `━━━━━━━━━━━━━━━━━━\n\n` +
                            `💰 Giá: $${stock.priceUSD} (${stock.price.toLocaleString('vi-VN')} Xu)\n` +
                            `📊 Thay đổi: ${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%\n` +
                            `📈 Volume: ${stock.volume.toLocaleString('vi-VN')}\n\n` +
                            `📊 ĐỘ SÂU THỊ TRƯỜNG:\n` +
                            `🔴 Bán:\n${stock.depth.asks.map(level => 
                                `   ${level.price}$ (${(level.price * market.xuRate).toLocaleString('vi-VN')} Xu) - ${level.volume.toLocaleString('vi-VN')} CP`
                            ).join('\n')}\n` +
                            `🟢 Mua:\n${stock.depth.bids.map(level => 
                                `   ${level.price}$ (${(level.price * market.xuRate).toLocaleString('vi-VN')} Xu) - ${level.volume.toLocaleString('vi-VN')} CP`
                            ).join('\n')}\n\n` +
                            `⏰ Cập nhật: ${new Date().toLocaleString()}`;

                        await api.sendMessage({
                            body: message,
                            attachment: fs.createReadStream(chartPath)
                        }, threadID, () => {
                            fs.unlinkSync(chartPath);
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