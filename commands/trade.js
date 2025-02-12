const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const axios = require('axios');
const StockChart = require('../config/trade/stockChart');
const MarketAlgorithms = require('../config/trade/marketAlgorithms');

function formatNumber(number) {
    if (number === undefined || number === null) return "0";
    return Math.floor(number).toLocaleString('vi-VN');
}

function formatStockPrice(number) {
    return "$" + Math.floor(number).toLocaleString('vi-VN');
}


const USER_PORTFOLIO_PATH = path.join(__dirname, './json/portfolios.json');
const EXCHANGE_RATE_PATH = path.join(__dirname, './json/exchange_rate.json');
const STOCKS_DATA_PATH = path.join(__dirname, './json/stocks_data.json');
const MARKET_HOURS = {
    open: 9,  
    close: 19
};

const DEFAULT_STOCKS = {
    'AAPL': { name: 'Apple Inc.', basePrice: 150, minPrice: 100 },
    'MSFT': { name: 'Microsoft', basePrice: 280, minPrice: 200 },
    'GOOGL': { name: 'Google', basePrice: 120, minPrice: 80 },
    'AMZN': { name: 'Amazon', basePrice: 130, minPrice: 90 },
    'META': { name: 'Meta/Facebook', basePrice: 300, minPrice: 200 },
    'TSLA': { name: 'Tesla', basePrice: 250, minPrice: 150 },
    'NVDA': { name: 'NVIDIA', basePrice: 450, minPrice: 300 },
    'JPM': { name: 'JPMorgan', basePrice: 140, minPrice: 100 },
    'V': { name: 'Visa', basePrice: 200, minPrice: 150 }
};

const FEES = {
    transaction: 0.001, 
    tax: 0.001,      
    minFee: 1000,    
    maxFee: 1000000  
};

class StockMarket {
    constructor() {
        this.portfolios = {};
        this.stocks = {};
        this.xuRate = this.generateInitialRate();
        this.ensureJsonPaths();
        this.loadStocks();
        this.loadPortfolios();
        this.startUpdates();
        this.startExchangeRateUpdates();
    }

    ensureJsonPaths() {
        // Ensure all JSON directories exist
        [USER_PORTFOLIO_PATH, EXCHANGE_RATE_PATH, STOCKS_DATA_PATH].forEach(jsonPath => {
            const dir = path.dirname(jsonPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Initialize stocks data file if it doesn't exist
        if (!fs.existsSync(STOCKS_DATA_PATH)) {
            fs.writeFileSync(STOCKS_DATA_PATH, JSON.stringify({}));
        }

        // Initialize exchange rate file if it doesn't exist
        if (!fs.existsSync(EXCHANGE_RATE_PATH)) {
            fs.writeFileSync(EXCHANGE_RATE_PATH, JSON.stringify({ rate: this.xuRate }));
        }

        // Initialize portfolios file if it doesn't exist
        if (!fs.existsSync(USER_PORTFOLIO_PATH)) {
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify({}));
        }
    }

    generateInitialRate() {
        return Math.floor(Math.random() * (24 - 17)) + 17;
    }

    updateExchangeRate() {
        const maxChange = 0.005;
        const change = (Math.random() * maxChange * 2) - maxChange;
        
        const newRate = Math.min(24, Math.max(17, 
            this.xuRate * (1 + change)
        ));
        
        this.xuRate = Math.floor(newRate);
        
        Object.keys(this.stocks).forEach(symbol => {
            const stock = this.stocks[symbol];
            if (stock && typeof stock.priceUSD === 'number') {
                stock.price = stock.priceUSD * this.xuRate;
            }
        });
        
        this.saveStocks();
    }

    startExchangeRateUpdates() {
        setInterval(() => {
            const hour = new Date().getHours();
            if (hour >= MARKET_HOURS.open && hour < MARKET_HOURS.close) {
                this.updateExchangeRate();
            }
        }, 300000); 
    }

    loadExchangeRate() {
        return this.xuRate; 
    }

    loadStocks() {
        try {
            if (fs.existsSync(STOCKS_DATA_PATH)) {
                this.stocks = JSON.parse(fs.readFileSync(STOCKS_DATA_PATH));
                // If no stocks exist in the JSON, initialize them
                if (Object.keys(this.stocks).length === 0) {
                    this.initializeStocks();
                }
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
            if (!stock || typeof stock.priceUSD !== 'number') return;
            const maxChange = 2;
            const randomChange = (Math.random() * maxChange * 2) - maxChange;
            
            const minPrice = DEFAULT_STOCKS[symbol].minPrice;
            const newPriceUSD = Math.max(
                minPrice,
                stock.priceUSD * (1 + randomChange / 100)
            );

            const newPrice = newPriceUSD * this.xuRate;

            const history = [...(stock.history || []), {
                price: newPrice,
                timestamp: Date.now()
            }].slice(-100);

            this.stocks[symbol] = {
                ...stock,
                priceUSD: newPriceUSD,
                price: newPrice,
                change: randomChange,
                changePercent: randomChange,
                volume: Math.floor(Math.random() * 50000) + 10000, 
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
            // Ensure directory exists before saving
            const dir = path.dirname(STOCKS_DATA_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(STOCKS_DATA_PATH, JSON.stringify(this.stocks, null, 2));
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
        
        const transactionFee = Math.min(
            Math.max(totalCost * FEES.transaction, FEES.minFee),
            FEES.maxFee
        );
        const tax = Math.min(
            Math.max(totalCost * FEES.tax, FEES.minFee),
            FEES.maxFee
        );
        const totalWithFees = totalCost + transactionFee + tax;
        
        const balance = await getBalance(userId);
        
        if (balance < totalWithFees) {
            throw new Error(`Không đủ tiền! Cần ${formatNumber(totalWithFees)} Xu (Phí: ${formatNumber(transactionFee)} Xu, Thuế: ${formatNumber(tax)} Xu)`);
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
            transactionFee,
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
        
        const transactionFee = Math.min(
            Math.max(totalValue * FEES.transaction, FEES.minFee),
            FEES.maxFee
        );
        const tax = Math.min(
            Math.max(totalValue * FEES.tax, FEES.minFee),
            FEES.maxFee
        );
        const finalValue = totalValue - transactionFee - tax;

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

        await updateBalance(userId, finalValue);
        
        this.savePortfolios();

        return {
            symbol,
            quantity,
            price: stockData.price,
            total: totalValue,
            transactionFee,
            tax,
            finalValue
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
                        message += `${symbol}: ${formatStockPrice(data.priceUSD)} (${formatNumber(data.price)} Xu) ${changeIcon}${Math.abs(data.changePercent).toFixed(2)}%\n`;
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
                        const affordableQuantity = Math.floor(remainingBalance / (market.stocks[symbol].price * (1 + FEES.transaction + FEES.tax)));

                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 Mã CP: ${result.symbol}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${formatNumber(result.price)} Xu\n` +
                            `💵 Tổng: ${formatNumber(result.total)} Xu\n` +
                            `📋 Phí GD: ${formatNumber(result.transactionFee)} Xu (${(FEES.transaction * 100).toFixed(2)}%)\n` +
                            `🏷️ Thuế: ${formatNumber(result.tax)} Xu (${(FEES.tax * 100).toFixed(2)}%)\n` +
                            `💶 Tổng cộng: ${formatNumber(result.totalWithFees)} Xu\n` +
                            `📊 Số dư: ${formatNumber(remainingBalance)} Xu\n` +
                            `✨ Có thể mua thêm: ${formatNumber(affordableQuantity)} CP`,
                            threadID, messageID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
                }

                case "sell": {
                    const symbol = target[1]?.toUpperCase();
                    const quantity = parseInt(target[2]);

                    if (!symbol || !quantity || quantity <= 0) {
                        return api.sendMessage("❌ Vui lòng nhập mã cổ phiếu và số lượng hợp lệ!", threadID, messageID);
                    }

                    try {
                        const result = await market.sellStock(senderID, symbol, quantity);
                        return api.sendMessage(
                            "✅ GIAO DỊCH THÀNH CÔNG\n" +
                            `🏢 Mã CP: ${result.symbol}\n` +
                            `🔢 Số lượng: ${result.quantity}\n` +
                            `💰 Giá: ${formatNumber(result.price)} Xu\n` +
                            `💵 Tổng: ${formatNumber(result.total)} Xu\n` +
                            `📋 Phí GD: ${formatNumber(result.transactionFee)} Xu (${(FEES.transaction * 100).toFixed(2)}%)\n` +
                            `🏷️ Thuế: ${formatNumber(result.tax)} Xu (${(FEES.tax * 100).toFixed(2)}%)\n` +
                            `💶 Thực nhận: ${formatNumber(result.finalValue)} Xu\n` +
                            `📊 Số dư: ${formatNumber(await getBalance(senderID))} Xu`,
                            threadID, messageID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID, messageID);
                    }
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
        const currentValue = Math.floor(stock.price * data.quantity);
        const profitLoss = Math.floor(currentValue - (data.averagePrice * data.quantity));
        totalValue += currentValue;

        message += `🏢 ${symbol} - ${stock.name}\n`;
        message += `🔢 Số lượng: ${data.quantity}\n`;
        message += `💰 Giá TB: ${Math.floor(data.averagePrice).toLocaleString('vi-VN')} Xu\n`;
        message += `📊 Giá HT: ${Math.floor(stock.price).toLocaleString('vi-VN')} Xu\n`;
        message += `💵 Giá trị: ${currentValue.toLocaleString('vi-VN')} Xu\n`;
        message += `${profitLoss >= 0 ? '📈' : '📉'} Lãi/Lỗ: ${profitLoss.toLocaleString('vi-VN')} Xu\n\n`;
    });

    message += `💎 Tổng giá trị: ${Math.floor(totalValue).toLocaleString('vi-VN')} Xu`;
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
                            `💰 Giá: ${formatStockPrice(stock.priceUSD)} (${stock.price.toLocaleString('vi-VN')} Xu)\n` +
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