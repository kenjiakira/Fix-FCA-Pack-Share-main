const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const MarketAlgorithms = require('../config/trade/marketAlgorithms');
const { TradingMonitor } = require('../config/trade/tradingRestrictions');

const USER_PORTFOLIO_PATH = path.join(__dirname, '../commands/json/trade/portfolios.json');
const EXCHANGE_RATE_PATH = path.join(__dirname, '../commands/json/trade/exchange_rate.json');
const STOCKS_DATA_PATH = path.join(__dirname, '../commands/json/trade/stocks_data.json');

const MARKET_HOURS = {
    open: 9,  
    close: 19
};

const RISK_CONFIG = {
    volatility: {
        normal: 0.30,      
        extreme: 0.50,       
        openClose: 0.30,    
        extremeProbability: 0.25
    },
    blackSwan: {
        probability: 0.005,   
        impact: 0.15,    
        marketWide: true     
    },
    marketCrash: {
        threshold: 0.10,     
        maxDrop: 0.20,  
        recoveryDays: 1     
    },
    margin: {
        callThreshold: 0.5,  
        callDuration: 6 * 3600000,
        volatilityFeeMultiplier: 1.2 
    }
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
    maxFee: 1000000,
    margin: 0.01     
};

const ORDER_TYPES = {
    MARKET: 'market',
    LIMIT: 'limit', 
    STOP: 'stop'
};

const MARGIN_CONFIG = {
    maxLeverage: 5,  
    maintenanceMargin: 0.1,
    initialMargin: 0.2      
};

class TradeSystem {
    constructor() {
        this.orders = {};
        this.marginPositions = {};
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
        [USER_PORTFOLIO_PATH, EXCHANGE_RATE_PATH, STOCKS_DATA_PATH].forEach(jsonPath => {
            const dir = path.dirname(jsonPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        if (!fs.existsSync(STOCKS_DATA_PATH)) {
            fs.writeFileSync(STOCKS_DATA_PATH, JSON.stringify({}));
        }

        if (!fs.existsSync(EXCHANGE_RATE_PATH)) {
            fs.writeFileSync(EXCHANGE_RATE_PATH, JSON.stringify({ rate: this.xuRate }));
        }

        if (!fs.existsSync(USER_PORTFOLIO_PATH)) {
            fs.writeFileSync(USER_PORTFOLIO_PATH, JSON.stringify({}));
        }
    }

    generateInitialRate() {
        return Math.floor(Math.random() * (34 - 27)) + 27;
    }

    updateExchangeRate() {
        const maxChange = 0.02; // Increased to 2% max change
        const change = (Math.random() * maxChange * 2) - maxChange;
        
        // Add market sentiment influence
        const marketSentiment = this.getMarketAnalysis().marketSentiment;
        const sentimentMultiplier = marketSentiment === 'Bullish' ? 1.2 : 
                                  marketSentiment === 'Bearish' ? 0.8 : 1;
        
        const newRate = Math.min(24, Math.max(17, 
            this.xuRate * (1 + change * sentimentMultiplier)
        ));
        
        // Less smoothing for more dynamic changes
        this.xuRate = Math.floor(this.xuRate * 0.5 + newRate * 0.5); // Less smoothing for more dynamic changes
        
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
        }, 2000); // Update every 2 seconds for more frequent changes
    }

    loadExchangeRate() {
        return this.xuRate;
    }

    loadStocks() {
        try {
            if (fs.existsSync(STOCKS_DATA_PATH)) {
                this.stocks = JSON.parse(fs.readFileSync(STOCKS_DATA_PATH));
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
        const marketAnalysis = this.getMarketAnalysis();
        
        const isBlackSwan = Math.random() < RISK_CONFIG.blackSwan.probability;
        
        const hour = new Date().getHours();
        const isOpenClose = (hour === MARKET_HOURS.open || hour === MARKET_HOURS.close - 1);
        const marketWideVolatility = isOpenClose ? RISK_CONFIG.volatility.openClose : 0;
        
        const avgMarketDrop = Object.values(this.stocks).reduce((sum, stock) => 
            sum + (stock.changePercent || 0), 0) / Object.keys(this.stocks).length;
        const isMarketCrash = avgMarketDrop < -RISK_CONFIG.marketCrash.threshold;
        
        Object.entries(this.stocks).forEach(([symbol, stock]) => {
            if (!stock || typeof stock.priceUSD !== 'number') return;
            
            let maxChange = RISK_CONFIG.volatility.normal * 2;
            
            if (isOpenClose) {
                maxChange += RISK_CONFIG.volatility.openClose;
            }
            
            if (Math.random() < RISK_CONFIG.volatility.extremeProbability) {
                maxChange = Math.min(maxChange + RISK_CONFIG.volatility.extreme, 0.05);
            }
            
            let randomChange = (Math.random() * maxChange * 2) - maxChange;
            
            if (isBlackSwan) {
                randomChange = Math.max(-RISK_CONFIG.blackSwan.impact * 1.5, randomChange);
            }
            
            if (isMarketCrash) {
                const crashImpact = -Math.min(
                    (Math.random() * RISK_CONFIG.marketCrash.maxDrop * 1.2),
                    0.08
                );
                randomChange = Math.max(crashImpact, randomChange);
            }
            
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
        }, 2000); // Update every 2 seconds for more frequent changes
    }

    saveStocks() {
        try {
            fs.writeFileSync(STOCKS_DATA_PATH, JSON.stringify(this.stocks, null, 2));
        } catch (error) {
            console.error("Error saving stocks:", error);
        }
    }

    loadPortfolios() {
        try {
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
        const totalCost = Math.floor(stockData.price * quantity);
        
        const transactionFee = Math.floor(Math.min(
            Math.max(totalCost * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalCost * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        const totalWithFees = Math.floor(totalCost + transactionFee + tax);
        
        const balance = await getBalance(userId);
        
        if (balance < totalWithFees) {
            throw new Error(`Không đủ tiền! Cần ${this.formatNumber(totalWithFees)} Xu (Phí: ${this.formatNumber(transactionFee)} Xu, Thuế: ${this.formatNumber(tax)} Xu)`);
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
        // Market hours check
        const now = new Date();
        const hour = now.getHours();
        if (hour < MARKET_HOURS.open || hour >= MARKET_HOURS.close) {
            throw new Error(`Market is closed! Trading hours: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }

        // Get user data and check stock availability
        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
            throw new Error("Insufficient stocks to sell");
        }

        // Get stock info and validate trade
        const stockData = this.getStockPrice(symbol);
        const validation = TradingMonitor.isValidTrade({
            symbol,
            type: 'sell',
            quantity,
            price: stockData.price,
            priceChange: stockData.changePercent,
            timestamp: Date.now()
        }, portfolio.transactions || []);

        if (!validation.isValid) {
            const violations = validation.violations.map(v => v.message).join('\n');
            throw new Error(`Giao dịch không hợp lệ:\n${violations}`);
        }

        // Calculate values and fees
        const totalValue = Math.floor(stockData.price * quantity);
        const entryValue = Math.floor(portfolio.stocks[symbol].averagePrice * quantity);
        const profitAmount = Math.max(0, totalValue - entryValue);

        // Calculate penalties if any
        const penalties = TradingMonitor.calculatePenalties(validation.violations, profitAmount);
        
        const transactionFee = Math.floor(Math.min(
            Math.max(totalValue * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalValue * (FEES.tax + penalties.additionalTax), FEES.minFee),
            FEES.maxFee
        ));
        const finalValue = Math.floor(totalValue - transactionFee - tax - penalties.penaltyAmount);

        // Log violations if any
        if (validation.violations.length > 0) {
            validation.violations.forEach(violation => {
                const log = TradingMonitor.logViolation(userId, violation);
                if (!portfolio.violations) portfolio.violations = [];
                portfolio.violations.push(log);
            });
        }

        portfolio.stocks[symbol].quantity -= quantity;
        if (portfolio.stocks[symbol].quantity === 0) {
            delete portfolio.stocks[symbol];
        }

        portfolio.transactions.push({
            type: 'sell',
            symbol: symbol,
            quantity: quantity,
            price: Math.floor(stockData.price),
            timestamp: Date.now()
        });

        await updateBalance(userId, finalValue);
        this.savePortfolios();

        return {
            symbol,
            quantity,
            price: Math.floor(stockData.price),
            total: totalValue,
            transactionFee,
            tax,
            finalValue
        };
    }

    getMarketOverview() {
        return {
            stocks: Object.fromEntries(
                Object.entries(this.stocks).map(([symbol, data]) => [
                    symbol,
                    {
                        ...data,
                        price: Math.floor(data.price),
                        priceUSD: Math.floor(data.priceUSD * 100) / 100,
                        change: Math.floor(data.change * 100) / 100,
                        changePercent: Math.floor(data.changePercent * 100) / 100
                    }
                ])
            ),
            xuRate: this.xuRate
        };
    }

    getMarketAnalysis() {
        const analysis = MarketAlgorithms.analyzeMarket(this.stocks);
        return {
            topGainers: analysis.topGainers || [],
            topLosers: analysis.topLosers || [],
            totalVolume: analysis.totalVolume || 0,
            totalValue: analysis.totalValue || 0,
            marketSentiment: analysis.marketSentiment || 'Neutral'
        };
    }

    isMarketOpen() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= MARKET_HOURS.open && hour < MARKET_HOURS.close;
    }

    formatNumber(number) {
        if (number === undefined || number === null) return "0";
        return Math.floor(number).toLocaleString('vi-VN');
    }

    formatStockPrice(number) {
        return "$" + Math.floor(number).toLocaleString('vi-VN');
    }

    // Order Management Methods
    async placeOrder(userId, symbol, quantity, type, params = {}) {
        if (!this.isMarketOpen()) {
            throw new Error(`Market is closed! Trading hours: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }

        const stockData = this.getStockPrice(symbol);
        const orderId = `${userId}-${symbol}-${Date.now()}`;

        switch (type) {
            case ORDER_TYPES.MARKET:
                return this.executeMarketOrder(userId, symbol, quantity, params.isBuy);

            case ORDER_TYPES.LIMIT:
                if (!params.limitPrice) throw new Error("Limit price is required for limit orders");
                this.orders[orderId] = {
                    userId,
                    symbol,
                    quantity,
                    type: ORDER_TYPES.LIMIT,
                    limitPrice: params.limitPrice,
                    isBuy: params.isBuy,
                    timestamp: Date.now()
                };
                break;

            case ORDER_TYPES.STOP:
                if (!params.stopPrice) throw new Error("Stop price is required for stop orders");
                this.orders[orderId] = {
                    userId,
                    symbol,
                    quantity,
                    type: ORDER_TYPES.STOP,
                    stopPrice: params.stopPrice,
                    isBuy: params.isBuy,
                    timestamp: Date.now()
                };
                break;

            default:
                throw new Error("Invalid order type");
        }

        return orderId;
    }

    async executeMarketOrder(userId, symbol, quantity, isBuy) {
        return isBuy ? 
            this.buyStock(userId, symbol, quantity) :
            this.sellStock(userId, symbol, quantity);
    }

    // Margin Trading Methods
    async openMarginPosition(userId, symbol, quantity, leverage) {
        if (leverage > MARGIN_CONFIG.maxLeverage) {
            throw new Error(`Maximum leverage is ${MARGIN_CONFIG.maxLeverage}x`);
        }

        // Check market volatility
        const marketVolatility = this.calculateMarketVolatility();
        const isHighVolatility = marketVolatility > RISK_CONFIG.volatility.normal;

        const stockData = this.getStockPrice(symbol);
        const positionValue = stockData.price * quantity;
        
        // Increase margin requirements during high volatility
        const volatilityMultiplier = isHighVolatility ? RISK_CONFIG.margin.volatilityFeeMultiplier : 1;
        const requiredMargin = positionValue * MARGIN_CONFIG.initialMargin * volatilityMultiplier / leverage;
        
        const balance = await getBalance(userId);
        if (balance < requiredMargin) {
            throw new Error(`Insufficient margin. Required: ${this.formatNumber(requiredMargin)} Xu`);
        }

        const positionId = `${userId}-${symbol}-${Date.now()}`;
        this.marginPositions[positionId] = {
            userId,
            symbol,
            quantity,
            leverage,
            entryPrice: stockData.price,
            margin: requiredMargin,
            timestamp: Date.now(),
            lastMarginCheck: Date.now(),
            marginCallIssued: false,
            marginCallDeadline: null
        };

        // Set up margin monitoring
        this.monitorMarginPosition(positionId);

        await updateBalance(userId, -requiredMargin);
        return positionId;
    }

    async closeMarginPosition(userId, positionId) {
        const position = this.marginPositions[positionId];
        if (!position || position.userId !== userId) {
            throw new Error("Invalid position");
        }

        const stockData = this.getStockPrice(position.symbol);
        const currentValue = stockData.price * position.quantity;
        const entryValue = position.entryPrice * position.quantity;
        
        const pnl = (currentValue - entryValue) * position.leverage;
        const marginFee = position.margin * FEES.margin;
        
        delete this.marginPositions[positionId];
        
        const finalPnl = pnl - marginFee;
        await updateBalance(userId, position.margin + finalPnl);
        
        return {
            pnl,
            marginFee,
            finalPnl
        };
    }

    calculateRSI(symbol, period = 14) {
        const stock = this.stocks[symbol];
        if (!stock || !stock.history) return null;

        const prices = stock.history.map(h => h.price);
        if (prices.length < period) return null;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i < prices.length; i++) {
            const difference = prices[i] - prices[i - 1];
            if (difference >= 0) {
                gains += difference;
            } else {
                losses -= difference;
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(symbol) {
        const stock = this.stocks[symbol];
        if (!stock || !stock.history) return null;

        const prices = stock.history.map(h => h.price);
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        
        return {
            macd: ema12 - ema26,
            signal: this.calculateEMA([ema12 - ema26], 9)
        };
    }

    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }

    calculateMarketVolatility() {
        return Object.values(this.stocks).reduce((sum, stock) => 
            sum + Math.abs(stock.changePercent || 0), 0) / Object.keys(this.stocks).length;
    }

    monitorMarginPosition(positionId) {
        const position = this.marginPositions[positionId];
        if (!position) return;

        const stockData = this.getStockPrice(position.symbol);
        const currentValue = stockData.price * position.quantity;
        const equity = position.margin + (currentValue - (position.entryPrice * position.quantity));
        const equityRatio = equity / (currentValue * position.leverage);

        // Check for margin call
        if (equityRatio < RISK_CONFIG.margin.callThreshold && !position.marginCallIssued) {
            position.marginCallIssued = true;
            position.marginCallDeadline = Date.now() + RISK_CONFIG.margin.callDuration;
            
            // Notify user of margin call
            this.notifyMarginCall(position.userId, positionId, equityRatio);
        }

        // Liquidate position if margin call not met
        if (position.marginCallIssued && Date.now() > position.marginCallDeadline) {
            this.liquidatePosition(positionId);
        }
    }

    async notifyMarginCall(userId, positionId, equityRatio) {
        const position = this.marginPositions[positionId];
        if (!position) return;

        const message = {
            type: 'MARGIN_CALL',
            userId,
            positionId,
            symbol: position.symbol,
            currentEquity: equityRatio,
            requiredEquity: RISK_CONFIG.margin.callThreshold,
            deadline: new Date(position.marginCallDeadline).toLocaleString(),
            action: 'Add funds or reduce position to avoid liquidation'
        };

        // Store notification in user's portfolio
        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.notifications) portfolio.notifications = [];
        portfolio.notifications.push(message);
        this.savePortfolios();
    }

    async liquidatePosition(positionId) {
        const position = this.marginPositions[positionId];
        if (!position) return;

        try {
            // Force close position at market price
            await this.closeMarginPosition(position.userId, positionId, true);
            
            // Notify user of liquidation
            const message = {
                type: 'LIQUIDATION',
                userId: position.userId,
                positionId,
                symbol: position.symbol,
                timestamp: Date.now(),
                reason: 'Margin call not met within deadline'
            };

            const portfolio = this.getUserPortfolio(position.userId);
            if (!portfolio.notifications) portfolio.notifications = [];
            portfolio.notifications.push(message);
            this.savePortfolios();
        } catch (error) {
            console.error(`Error liquidating position ${positionId}:`, error);
        }
    }
}

module.exports = TradeSystem;
