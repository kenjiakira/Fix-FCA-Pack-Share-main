const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const MarketAlgorithms = require('../config/trade/marketAlgorithms');
const { TradingMonitor } = require('../config/trade/tradingRestrictions');
const OrderManager = require('./OrderManager');
const OrderBook = require('./OrderBook');
const OrderMatcher = require('./OrderMatcher');
const TransactionManager = require('./TransactionManager');
const OrderProcessor = require('./OrderProcessor');

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
    transaction: 0.01,  
    tax: 0.005,        
    minFee: 1000,      
    maxFee: 1000000,  
    largeTrade: 0.005  
};

const ORDER_TYPES = {
    MARKET: 'market',
    LIMIT: 'limit', 
    STOP: 'stop'
};


const TRADING_LIMITS = {
    dailyTradeLimit: 20,           
    tradeCooldown: 60 * 1000,      
    maxVolumePercent: 0.25,        
    largeTradeThreshold: 50000000  
};


const NEWS_EVENTS = [
    { type: 'positive', impact: 0.05, probability: 0.03, description: "Báo cáo tài chính vượt kỳ vọng", affectedStocks: 1 },
    { type: 'negative', impact: -0.06, probability: 0.03, description: "Doanh thu thấp hơn dự kiến", affectedStocks: 1 },
    { type: 'positive', impact: 0.08, probability: 0.02, description: "Công bố sản phẩm mới đột phá", affectedStocks: 1 },
    { type: 'negative', impact: -0.07, probability: 0.02, description: "Điều tra pháp lý", affectedStocks: 1 },
    { type: 'positive', impact: 0.03, probability: 0.05, description: "Nhà phân tích nâng đánh giá", affectedStocks: 2 },
    { type: 'negative', impact: -0.04, probability: 0.04, description: "Tăng trưởng chậm lại", affectedStocks: 2 },
    { type: 'sector', impact: 0.06, probability: 0.015, description: "Chính sách mới có lợi cho ngành", affectedStocks: 3 },
    { type: 'sector', impact: -0.06, probability: 0.015, description: "Quy định mới gây bất lợi cho ngành", affectedStocks: 3 },
    { type: 'market', impact: 0.04, probability: 0.01, description: "Chỉ số kinh tế vĩ mô tích cực", affectedStocks: 'all' },
    { type: 'market', impact: -0.05, probability: 0.01, description: "Lo ngại về suy thoái kinh tế", affectedStocks: 'all' },
    { type: 'crash', impact: -0.15, probability: 0.002, description: "Khủng hoảng thị trường bất ngờ", affectedStocks: 'all' },
    { type: 'rally', impact: 0.12, probability: 0.002, description: "Thị trường tăng đột biến", affectedStocks: 'all' }
];


const MARKET_SENTIMENT = {
    states: ['Bearish', 'Slightly Bearish', 'Neutral', 'Slightly Bullish', 'Bullish'],
    currentState: 2, 
    changeChance: 0.10, 
    impactMultiplier: {
        'Bearish': -1.5,
        'Slightly Bearish': -0.8,
        'Neutral': 0,
        'Slightly Bullish': 0.8,
        'Bullish': 1.5
    }
};


const ECONOMY_BALANCE = {
    wealthTax: {
        threshold: 1000000000, 
        rate: 0.001, 
        applyInterval: 24 * 60 * 60 * 1000 
    },
    maintenanceCost: {
        threshold: 10, 
        rate: 0.0005, 
        applyInterval: 24 * 60 * 60 * 1000 
    },
    marketReset: {
        enabled: false,
        interval: 30 * 24 * 60 * 60 * 1000, 
        preserveUserPercentage: 0.8 
    }
};

class TradeSystem {
    constructor() {
        this.portfolios = {};
        this.stocks = {};
        this.orderBook = new OrderBook();
        this.orderManager = new OrderManager(this.orderBook);
        this.orderMatcher = new OrderMatcher(this.orderBook);
        this.transactionManager = new TransactionManager();
        this.orderProcessor = new OrderProcessor(this.orderBook, this.orderManager, this.orderMatcher);
        this.xuRate = this.generateInitialRate();
        
        this.setupTransactionHandlers();
        
        this.ensureJsonPaths();
        this.loadStocks();
        this.loadPortfolios();
        this.startUpdates();
        this.startExchangeRateUpdates();
        this.setupOrderBookHandlers();
        
        
        this.tradingHistory = {};
        this.activeNews = [];
        this.lastMarketSentimentChange = Date.now();
        
        
        this.startEconomicBalancing();
        this.generateMarketNews();
    }

    setupTransactionHandlers() {
        
        this.transactionManager.on('transactionCompleted', (event) => {
            console.log(`Transaction ${event.transactionId} completed successfully`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_COMPLETED',
                message: 'Giao dịch thành công',
                data: event.data
            });
        });

        
        this.transactionManager.on('transactionTimeout', (event) => {
            console.log(`Transaction ${event.transactionId} timed out`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_TIMEOUT',
                message: 'Giao dịch hết thời gian chờ',
                data: event.data
            });
        });

        
        this.transactionManager.on('transactionRolledBack', (event) => {
            console.log(`Transaction ${event.transactionId} rolled back`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_ROLLBACK',
                message: 'Giao dịch thất bại và đã được hoàn tác',
                data: event.data
            });
        });

        
        this.transactionManager.on('stepCompleted', (event) => {
            console.log(`Step ${event.step}/${event.totalSteps} completed for transaction ${event.transactionId}`);
        });
    }

    
    notifyUser(userId, notification) {
        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.notifications) {
            portfolio.notifications = [];
        }
        portfolio.notifications.push({
            ...notification,
            timestamp: Date.now()
        });
        this.savePortfolios();
    }

    setupOrderBookHandlers() {
        
        this.orderBook.on('trade', async (trade) => {
            try {
                const { symbol, price, quantity, buyerId, sellerId } = trade;
                
                
                const buyerPortfolio = this.getUserPortfolio(buyerId);
                const sellerPortfolio = this.getUserPortfolio(sellerId);

                
                const originalBuyerState = JSON.parse(JSON.stringify(buyerPortfolio));
                const originalSellerState = JSON.parse(JSON.stringify(sellerPortfolio));

                try {
                    
                    if (!buyerPortfolio.stocks[symbol]) {
                        buyerPortfolio.stocks[symbol] = { quantity: 0, averagePrice: 0 };
                    }
                    const oldValue = buyerPortfolio.stocks[symbol].quantity * buyerPortfolio.stocks[symbol].averagePrice;
                    const newValue = price * quantity;
                    const totalQuantity = buyerPortfolio.stocks[symbol].quantity + quantity;
                    buyerPortfolio.stocks[symbol].averagePrice = Math.floor((oldValue + newValue) / totalQuantity);
                    buyerPortfolio.stocks[symbol].quantity = totalQuantity;

                    
                    if (!sellerPortfolio.stocks[symbol]) {
                        sellerPortfolio.stocks[symbol] = { quantity: 0, averagePrice: 0 };
                    }
                    sellerPortfolio.stocks[symbol].quantity -= quantity;
                    if (sellerPortfolio.stocks[symbol].quantity <= 0) {
                        delete sellerPortfolio.stocks[symbol];
                    }

                    
                    if (!buyerPortfolio.transactions) buyerPortfolio.transactions = [];
                    if (!sellerPortfolio.transactions) sellerPortfolio.transactions = [];

                    const timestamp = Date.now();
                    
                    buyerPortfolio.transactions.push({
                        type: 'buy',
                        symbol,
                        quantity,
                        price: Math.floor(price),
                        timestamp,
                        counterpartyId: sellerId
                    });

                    sellerPortfolio.transactions.push({
                        type: 'sell', 
                        symbol,
                        quantity,
                        price: Math.floor(price),
                        timestamp,
                        counterpartyId: buyerId
                    });

                    
                    await this.savePortfolios();

                    
                    console.log(`Trade executed: ${symbol} - ${quantity} @ ${price}`);
                    console.log(`Buyer: ${buyerId}, Seller: ${sellerId}`);

                } catch (error) {
t                    
                    this.portfolios[buyerId] = originalBuyerState;
                    this.portfolios[sellerId] = originalSellerState;
                    await this.savePortfolios();
                    throw error;
                }

            } catch (error) {
                console.error('Error processing trade:', error);
                throw error;
            }
        });

        
        this.orderBook.on('orderAdded', async (order) => {
            try {
                const portfolio = this.getUserPortfolio(order.userId);
                if (!portfolio.orders) portfolio.orders = [];
                
                portfolio.orders.push({
                    orderId: order.orderId,
                    symbol: order.symbol,
                    side: order.side,
                    price: order.price,
                    quantity: order.quantity,
                    remainingQuantity: order.remainingQuantity,
                    status: 'open',
                    timestamp: order.timestamp
                });

                await this.savePortfolios();
                console.log(`Order added: ${order.orderId}`);
            } catch (error) {
                console.error('Error adding order:', error);
                throw error;
            }
        });

        this.orderBook.on('orderCancelled', async (order) => {
            try {
                const portfolio = this.getUserPortfolio(order.userId);
                if (portfolio.orders) {
                    const orderIndex = portfolio.orders.findIndex(o => o.orderId === order.orderId);
                    if (orderIndex !== -1) {
                        portfolio.orders[orderIndex].status = 'cancelled';
                        await this.savePortfolios();
                        console.log(`Order cancelled: ${order.orderId}`);
                    }
                }
            } catch (error) {
                console.error('Error cancelling order:', error);
                throw error;
            }
        });
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
        const maxChange = 0.02;
        const change = (Math.random() * maxChange * 2) - maxChange;
        
        const marketSentiment = this.getMarketAnalysis().marketSentiment;
        const sentimentMultiplier = marketSentiment === 'Bullish' ? 1.2 : 
                                  marketSentiment === 'Bearish' ? 0.8 : 1;
        
        const newRate = Math.min(24, Math.max(17, 
            this.xuRate * (1 + change * sentimentMultiplier)
        ));
        
        this.xuRate = Math.floor(this.xuRate * 0.5 + newRate * 0.5); 
        
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
        }, 2000); 
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
        
        this.updateMarketSentiment();
        
        const marketAnalysis = this.getMarketAnalysis();
        
        const isBlackSwan = Math.random() < RISK_CONFIG.blackSwan.probability;
        
        const hour = new Date().getHours();
        const isOpenClose = (hour === MARKET_HOURS.open || hour === MARKET_HOURS.close - 1);
        const marketWideVolatility = isOpenClose ? RISK_CONFIG.volatility.openClose : 0;
        
        const avgMarketDrop = Object.values(this.stocks).reduce((sum, stock) => 
            sum + (stock.changePercent || 0), 0) / Object.keys(this.stocks).length;
        const isMarketCrash = avgMarketDrop < -RISK_CONFIG.marketCrash.threshold;
        
        
        const sentimentMultiplier = this.getSentimentMultiplier();
        
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
            
            
            randomChange += sentimentMultiplier * 0.01;
            
            
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
            
            
            this.activeNews.forEach(newsEvent => {
                if (newsEvent.symbols.includes(symbol)) {
                    
                    const newsImpact = newsEvent.impact * (0.8 + Math.random() * 0.4);
                    randomChange += newsImpact;
                }
            });
            
            const minPrice = DEFAULT_STOCKS[symbol].minPrice;
            const newPriceUSD = Math.max(
                minPrice,
                stock.priceUSD * (1 + randomChange / 100)
            );

            
            const spread = 0.002 + (Math.random() * 0.003); 
            const bidPriceUSD = newPriceUSD * (1 - spread);
            const askPriceUSD = newPriceUSD * (1 + spread);

            const newPrice = newPriceUSD * this.xuRate;

            const history = [...(stock.history || []), {
                price: newPrice,
                timestamp: Date.now()
            }].slice(-100);

            this.stocks[symbol] = {
                ...stock,
                priceUSD: newPriceUSD,
                bidPriceUSD: bidPriceUSD,
                askPriceUSD: askPriceUSD,
                price: newPrice,
                bidPrice: bidPriceUSD * this.xuRate,
                askPrice: askPriceUSD * this.xuRate,
                change: randomChange,
                changePercent: randomChange,
                volume: Math.floor(Math.random() * 50000) + 10000,
                depth: {
                    bids: MarketAlgorithms.generateMarketDepth(bidPriceUSD, true),
                    asks: MarketAlgorithms.generateMarketDepth(askPriceUSD, false)
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
        }, 2000); 
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

    getAllPortfolios() {
        return this.portfolios;
    }

    async giftStock(userId, symbol, quantity) {
        
        const stock = this.getStockPrice(symbol);
        if (!stock) throw new Error('Invalid stock symbol');

        const portfolio = this.getUserPortfolio(userId);
        
        if (!portfolio.stocks[symbol]) {
            portfolio.stocks[symbol] = {
                quantity: 0,
                averagePrice: stock.price
            };
        }

        portfolio.stocks[symbol].quantity += quantity;

        portfolio.transactions.push({
            type: 'gift',
            symbol,
            quantity,
            price: stock.price,
            timestamp: Date.now()
        });

        await this.savePortfolios();

        return {
            userId,
            symbol,
            quantity,
            price: stock.price
        };
    }

    async sellStock(userId, symbol, quantity) {
        if (!this.isMarketOpen()) {
            throw new Error(`Thị trường đã đóng! Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }
        
        
        if (!this.checkTradingLimit(userId)) {
            throw new Error(`Bạn đã đạt giới hạn ${TRADING_LIMITS.dailyTradeLimit} giao dịch mỗi ngày!`);
        }
        
        
        if (!this.checkTradeCooldown(userId)) {
            const remainingSeconds = this.getRemainingCooldown(userId) / 1000;
            throw new Error(`Vui lòng đợi ${Math.ceil(remainingSeconds)} giây giữa các giao dịch!`);
        }
    
        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
            throw new Error("Không đủ cổ phiếu để bán");
        }
    
        const stockData = this.getStockPrice(symbol);
        
        
        const basePrice = Math.floor(stockData.bidPrice || stockData.price || 0);
        
        
        const slippage = this.calculateSlippage(symbol, quantity, 'sell');
        const marketPrice = Math.max(1, Math.floor(basePrice * (1 + slippage)));

        const validation = TradingMonitor.isValidTrade({
            symbol,
            type: 'sell',
            quantity,
            price: marketPrice,
            priceChange: stockData.changePercent,
            timestamp: Date.now()
        }, portfolio.transactions || []);
    
        if (!validation.isValid) {
            const violations = validation.violations.map(v => v.message).join('\n');
            throw new Error(`Giao dịch không hợp lệ:\n${violations}`);
        }
        
        
        if (Math.random() < 0.05) { 
            throw new Error("Lệnh không thực hiện được do điều kiện thị trường. Vui lòng thử lại!");
        }
    
        const totalValue = marketPrice * quantity;
        
        
        let transactionFee = Math.floor(Math.min(
            Math.max(totalValue * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        
        let tax = Math.floor(Math.min(
            Math.max(totalValue * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        
        
        if (totalValue > TRADING_LIMITS.largeTradeThreshold) {
            const extraFee = Math.floor(totalValue * FEES.largeTrade);
            transactionFee += extraFee;
        }
        
        const finalValue = totalValue - transactionFee - tax;
    
        try {
            
            this.recordTrade(userId);
            
            portfolio.stocks[symbol].quantity -= quantity;
            if (portfolio.stocks[symbol].quantity <= 0) {
                delete portfolio.stocks[symbol];
            }
    
            if (!portfolio.transactions) portfolio.transactions = [];
            portfolio.transactions.push({
                type: 'sell',
                symbol,
                quantity,
                price: marketPrice,
                basePrice: basePrice,
                slippage: isNaN(slippage * 100) ? 0 : slippage * 100,
                total: totalValue,
                fees: {
                    transaction: transactionFee,
                    tax: tax
                },
                timestamp: Date.now()
            });
    
            await updateBalance(userId, finalValue);
            this.savePortfolios();
    
            return {
                status: "filled",
                symbol,
                quantity,
                price: marketPrice || 0,
                basePrice: basePrice || 0,
                slippage: isNaN(slippage * 100) ? 0 : slippage * 100,
                total: totalValue || 0,
                transactionFee: transactionFee || 0,
                tax: tax || 0,
                finalValue: finalValue || 0
            };
        } catch (error) {
            if (!portfolio.stocks[symbol]) {
                portfolio.stocks[symbol] = { quantity: 0, averagePrice: 0 };
            }
            portfolio.stocks[symbol].quantity += quantity;
            this.savePortfolios();
            
            throw error;
        }
    }

    async processFill(execution) {
        const { buyOrderId, sellOrderId, price, quantity, timestamp } = execution;
        const buyOrder = this.orderBook.orders.get(buyOrderId);
        const sellOrder = this.orderBook.orders.get(sellOrderId);

        if (!buyOrder || !sellOrder) {
            throw new Error('Invalid order in fill execution');
        }

        try {
            const totalValue = Math.floor(price * quantity);
            
            const buyerFees = {
                transaction: Math.floor(Math.min(
                    Math.max(totalValue * FEES.transaction, FEES.minFee),
                    FEES.maxFee
                )),
                tax: Math.floor(Math.min(
                    Math.max(totalValue * FEES.tax, FEES.minFee),
                    FEES.maxFee
                ))
            };

            const sellerFees = {
                transaction: Math.floor(Math.min(
                    Math.max(totalValue * FEES.transaction, FEES.minFee),
                    FEES.maxFee
                )),
                tax: Math.floor(Math.min(
                    Math.max(totalValue * FEES.tax, FEES.minFee),
                    FEES.maxFee
                ))
            };

            await this.updatePortfolios(buyOrder, sellOrder, {
                price,
                quantity,
                buyerFees,
                sellerFees,
                timestamp
            });

            this.orderManager.notifyOrderUpdate({
                type: 'fill',
                buyOrderId,
                sellOrderId,
                price,
                quantity,
                timestamp
            });

            console.log(`Processed fill: ${buyOrder.symbol} - ${quantity} @ ${price}`);
        } catch (error) {
            console.error('Error processing fill:', error);
            throw error; 
        }
    }

    async updatePortfolios(buyOrder, sellOrder, tradeDetails) {
        const { price, quantity, buyerFees, sellerFees, timestamp } = tradeDetails;
        const totalValue = Math.floor(price * quantity);

        const buyerPortfolio = this.getUserPortfolio(buyOrder.userId);
        if (!buyerPortfolio.stocks[buyOrder.symbol]) {
            buyerPortfolio.stocks[buyOrder.symbol] = { quantity: 0, averagePrice: 0 };
        }

        const oldBuyerValue = buyerPortfolio.stocks[buyOrder.symbol].quantity * 
                             buyerPortfolio.stocks[buyOrder.symbol].averagePrice;
        const newBuyerValue = totalValue;
        const totalBuyerQuantity = buyerPortfolio.stocks[buyOrder.symbol].quantity + quantity;

        buyerPortfolio.stocks[buyOrder.symbol].averagePrice = 
            Math.floor((oldBuyerValue + newBuyerValue) / totalBuyerQuantity);
        buyerPortfolio.stocks[buyOrder.symbol].quantity = totalBuyerQuantity;

        const sellerPortfolio = this.getUserPortfolio(sellOrder.userId);
        if (!sellerPortfolio.stocks[sellOrder.symbol]) {
            sellerPortfolio.stocks[sellOrder.symbol] = { quantity: 0, averagePrice: 0 };
        }

        sellerPortfolio.stocks[sellOrder.symbol].quantity -= quantity;
        if (sellerPortfolio.stocks[sellOrder.symbol].quantity <= 0) {
            delete sellerPortfolio.stocks[sellOrder.symbol];
        }

        buyerPortfolio.transactions.push({
            type: 'buy',
            symbol: buyOrder.symbol,
            quantity,
            price: Math.floor(price),
            fees: buyerFees,
            timestamp,
            counterpartyId: sellOrder.userId
        });

        sellerPortfolio.transactions.push({
            type: 'sell',
            symbol: sellOrder.symbol,
            quantity,
            price: Math.floor(price),
            fees: sellerFees,
            timestamp,
            counterpartyId: buyOrder.userId
        });

        const buyerTotal = totalValue + buyerFees.transaction + buyerFees.tax;
        const sellerTotal = totalValue - sellerFees.transaction - sellerFees.tax;

        await updateBalance(buyOrder.userId, -buyerTotal);
        await updateBalance(sellOrder.userId, sellerTotal);

        this.savePortfolios();
    }

    async buyStock(userId, symbol, quantity) {
        if (!this.isMarketOpen()) {
            throw new Error(`Thị trường đã đóng! Giờ giao dịch: ${MARKET_HOURS.open}:00 - ${MARKET_HOURS.close}:00`);
        }
        
        
        if (!this.checkTradingLimit(userId)) {
            throw new Error(`Bạn đã đạt giới hạn ${TRADING_LIMITS.dailyTradeLimit} giao dịch mỗi ngày!`);
        }
        
        
        if (!this.checkTradeCooldown(userId)) {
            const remainingSeconds = this.getRemainingCooldown(userId) / 1000;
            throw new Error(`Vui lòng đợi ${Math.ceil(remainingSeconds)} giây giữa các giao dịch!`);
        }
    
        const stockData = this.getStockPrice(symbol);
        
        
        const basePrice = Math.floor(stockData.askPrice || stockData.price || 0);
        
        
        const slippage = this.calculateSlippage(symbol, quantity, 'buy');
        const marketPrice = Math.max(1, Math.floor(basePrice * (1 + slippage)));
        
        const totalCost = marketPrice * quantity;
        
        
        if (!this.checkMaxVolumeLimit(userId, totalCost)) {
            throw new Error(`Giao dịch vượt quá ${TRADING_LIMITS.maxVolumePercent * 100}% giá trị danh mục của bạn!`);
        }
        
        
        let transactionFee = Math.floor(Math.min(
            Math.max(totalCost * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        
        let tax = Math.floor(Math.min(
            Math.max(totalCost * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        
        
        if (totalCost > TRADING_LIMITS.largeTradeThreshold) {
            const extraFee = Math.floor(totalCost * FEES.largeTrade);
            transactionFee += extraFee;
        }
        
        const totalWithFees = totalCost + transactionFee + tax;
    
        
        const balance = await getBalance(userId);
        if (balance < totalWithFees) {
            const maxPossibleShares = this.calculateMaxSharesPurchasable(userId, symbol, balance);
            
            throw new Error(
                `Không đủ tiền! Cần ${this.formatNumber(totalWithFees)} Xu\n` +
                `💰 Số dư hiện tại: ${this.formatNumber(balance)} Xu\n` +
                `📊 Với số dư hiện tại, bạn có thể mua tối đa ${maxPossibleShares} cổ phiếu ${symbol}`
            );
        }
        
        if (Math.random() < 0.05) { 
            throw new Error("Lệnh không thực hiện được do điều kiện thị trường. Vui lòng thử lại!");
        }
        
        try {
            
            this.recordTrade(userId);
            
            
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
            
            portfolio.stocks[symbol].quantity = totalQuantity;
            portfolio.stocks[symbol].averagePrice = Math.floor((oldValue + newValue) / totalQuantity);
    
            
            if (!portfolio.transactions) portfolio.transactions = [];
            portfolio.transactions.push({
                type: 'buy',
                symbol,
                quantity,
                price: marketPrice,
                basePrice: basePrice,
                slippage: isNaN(slippage * 100) ? 0 : slippage * 100,
                total: totalCost,
                fees: {
                    transaction: transactionFee,
                    tax: tax
                },
                timestamp: Date.now()
            });
    
            
            await updateBalance(userId, -totalWithFees);
            this.savePortfolios();
    
            return {
                symbol,
                quantity,
                price: marketPrice || 0,
                basePrice: basePrice || 0,
                slippage: isNaN(slippage * 100) ? 0 : slippage * 100,
                total: totalCost || 0,
                transactionFee: transactionFee || 0,
                tax: tax || 0,
                totalWithFees: totalWithFees || 0,
                status: "completed"
            };
        } catch (error) {
            throw error;
        }
    }

    async lockUserFunds(userId, amount) {
       
        console.log(`Locked ${amount} funds for user ${userId}`);
    }

    async unlockUserFunds(userId, amount) {
        
        console.log(`Unlocked ${amount} funds for user ${userId}`);
    }

    getOrderBookDepth(symbol) {
        return this.orderBook.getOrderBook(symbol);
    }

    getUserOrders(userId, symbol = null) {
        return this.orderBook.getUserOrders(userId, symbol);
    }

    cancelOrder(orderId, userId) {
        return this.orderBook.cancelOrder(orderId, userId);
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

    startEconomicBalancing() {
        
        setInterval(() => {
            this.applyWealthTax();
            this.applyMaintenanceCosts();
        }, ECONOMY_BALANCE.wealthTax.applyInterval);
        
        
        if (ECONOMY_BALANCE.marketReset.enabled) {
            setInterval(() => {
                this.performMarketReset();
            }, ECONOMY_BALANCE.marketReset.interval);
        }
    }
    
    applyWealthTax() {
        Object.entries(this.portfolios).forEach(([userId, portfolio]) => {
            const totalValue = this.calculatePortfolioValue(portfolio);
            
            if (totalValue > ECONOMY_BALANCE.wealthTax.threshold) {
                const taxableAmount = totalValue - ECONOMY_BALANCE.wealthTax.threshold;
                const taxAmount = Math.floor(taxableAmount * ECONOMY_BALANCE.wealthTax.rate);
                
                if (taxAmount > 0) {
                    this.notifyUser(userId, {
                        type: 'WEALTH_TAX',
                        message: `Thuế tài sản đã được áp dụng: ${this.formatNumber(taxAmount)} Xu`,
                        data: {
                            portfolioValue: totalValue,
                            taxableAmount,
                            taxAmount
                        }
                    });
                    
                    
                    
                }
            }
        });
    }
    
    applyMaintenanceCosts() {
        Object.entries(this.portfolios).forEach(([userId, portfolio]) => {
            const stockCount = Object.keys(portfolio.stocks || {}).length;
            
            if (stockCount > ECONOMY_BALANCE.maintenanceCost.threshold) {
                const totalValue = this.calculatePortfolioValue(portfolio);
                const feeAmount = Math.floor(totalValue * ECONOMY_BALANCE.maintenanceCost.rate);
                
                if (feeAmount > 0) {
                    this.notifyUser(userId, {
                        type: 'MAINTENANCE_FEE',
                        message: `Phí quản lý danh mục: ${this.formatNumber(feeAmount)} Xu`,
                        data: {
                            stockCount,
                            portfolioValue: totalValue,
                            feeAmount
                        }
                    });
                    
                    
                }
            }
        });
    }
    
    performMarketReset() {
        console.log("⚠️ MARKET RESET INITIATED");
        
        
        Object.keys(this.portfolios).forEach(userId => {
            this.notifyUser(userId, {
                type: 'MARKET_RESET',
                message: "THỊ TRƯỜNG SẼ ĐƯỢC RESET. Bạn sẽ giữ lại 80% tài sản và mất tất cả cổ phiếu.",
                data: {
                    timestamp: Date.now()
                }
            });
        });
        
        
        Object.entries(this.portfolios).forEach(([userId, portfolio]) => {
            const totalValue = this.calculatePortfolioValue(portfolio);
            const preservedValue = Math.floor(totalValue * ECONOMY_BALANCE.marketReset.preserveUserPercentage);
            
            
            portfolio.stocks = {};
            
            
            if (!portfolio.transactions) portfolio.transactions = [];
            portfolio.transactions.push({
                type: 'market_reset',
                timestamp: Date.now(),
                originalValue: totalValue,
                preservedValue: preservedValue
            });
            
            
            
        });
        
        
        this.initializeStocks();
        this.savePortfolios();
    }
    
    calculatePortfolioValue(portfolio) {
        let totalValue = 0;
        
        
        Object.entries(portfolio.stocks || {}).forEach(([symbol, data]) => {
            if (this.stocks[symbol]) {
                totalValue += this.stocks[symbol].price * data.quantity;
            }
        });
        
        return totalValue;
    }
    
    generateMarketNews() {
        
        this.activeNews = [];
        
        
        NEWS_EVENTS.forEach(eventTemplate => {
            if (Math.random() < eventTemplate.probability) {
                const newEvent = {...eventTemplate, timestamp: Date.now()};
                
                if (eventTemplate.affectedStocks === 'all') {
                    newEvent.symbols = Object.keys(this.stocks);
                } else {
                    
                    const allStocks = Object.keys(this.stocks);
                    const shuffled = allStocks.sort(() => 0.5 - Math.random());
                    newEvent.symbols = shuffled.slice(0, Math.min(eventTemplate.affectedStocks, allStocks.length));
                }
                
                this.activeNews.push(newEvent);
                console.log(`News Event: ${newEvent.description} affecting ${newEvent.symbols.join(', ')}`);
            }
        });
        
        
        const nextUpdateTime = 15 * 60 * 1000 + Math.random() * 15 * 60 * 1000;
        setTimeout(() => this.generateMarketNews(), nextUpdateTime);
    }

    updateMarketSentiment() {
        if (Math.random() < MARKET_SENTIMENT.changeChance) {
            const currentIndex = MARKET_SENTIMENT.currentState;
            let shift = Math.floor(Math.random() * 3) - 1; 
            
            
            if (Math.random() < 0.2) {
                shift = shift * 2;
            }
            
            
            const newIndex = Math.max(0, Math.min(MARKET_SENTIMENT.states.length - 1, currentIndex + shift));
            
            MARKET_SENTIMENT.currentState = newIndex;
            this.lastMarketSentimentChange = Date.now();
            
            console.log(`Market sentiment changed to: ${MARKET_SENTIMENT.states[newIndex]}`);
        }
    }

getMarketSentiment() {
    return MARKET_SENTIMENT.states[MARKET_SENTIMENT.currentState];
}

getSentimentMultiplier() {
    const sentiment = this.getMarketSentiment();
    return MARKET_SENTIMENT.impactMultiplier[sentiment] || 0;
}

getRemainingCooldown(userId) {
    if (!this.tradingHistory[userId]) return 0;
    const timeSinceLastTrade = Date.now() - this.tradingHistory[userId].lastTradeTime;
    const remainingTime = Math.max(0, TRADING_LIMITS.tradeCooldown - timeSinceLastTrade);
    return remainingTime;
}


recordTrade(userId) {
    const today = new Date().toDateString();
    
    if (!this.tradingHistory[userId]) {
        this.tradingHistory[userId] = {
            trades: {},
            lastTradeTime: 0
        };
    }
    
    if (!this.tradingHistory[userId].trades[today]) {
        this.tradingHistory[userId].trades[today] = 0;
    }
    
    this.tradingHistory[userId].trades[today]++;
    this.tradingHistory[userId].lastTradeTime = Date.now();
}


checkTradingLimit(userId) {
    const today = new Date().toDateString();
    
    if (!this.tradingHistory[userId] || !this.tradingHistory[userId].trades[today]) {
        return true; 
    }
    
    return this.tradingHistory[userId].trades[today] < TRADING_LIMITS.dailyTradeLimit;
}


checkTradeCooldown(userId) {
    if (!this.tradingHistory[userId]) return true;
    
    const timeSinceLastTrade = Date.now() - this.tradingHistory[userId].lastTradeTime;
    return timeSinceLastTrade >= TRADING_LIMITS.tradeCooldown;
}


checkMaxVolumeLimit(userId, tradeValue) {
    const portfolio = this.getUserPortfolio(userId);
    const portfolioValue = this.calculatePortfolioValue(portfolio);
    
    if (portfolioValue === 0) return true; 
    
    return tradeValue <= portfolioValue * TRADING_LIMITS.maxVolumePercent;
}

calculateMaxSharesPurchasable(userId, symbol, balance) {
    const stockData = this.stocks[symbol];
    if (!stockData) return 0;
    
    const basePrice = Math.floor(stockData.askPrice || stockData.price || 0);
    
    // Phương pháp tính toán gần đúng với phí tối thiểu
    const minShares = 1;
    const maxShares = Math.floor(balance / basePrice);
    let estimatedQuantity = maxShares;
    
    // Kiểm tra lại với phí giao dịch
    for (let i = maxShares; i >= minShares; i--) {
        const totalCost = basePrice * i;
        const transactionFee = Math.floor(Math.min(
            Math.max(totalCost * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalCost * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        const totalWithFees = totalCost + transactionFee + tax;
        
        if (totalWithFees <= balance) {
            estimatedQuantity = i;
            break;
        }
    }
    
    return estimatedQuantity;
}

calculateSlippage(symbol, quantity, orderType) {
    try {
        const stock = this.stocks[symbol];
        if (!stock || !stock.depth) return 0;
        
        // Safely get the appropriate side of order book with fallbacks
        const depthLevels = orderType === 'buy' ? 
            (stock.depth.asks || []) : 
            (stock.depth.bids || []);
            
        if (!depthLevels || depthLevels.length === 0) return 0;
        
        let totalVolume = 0;
        let totalValue = 0;
        
        for (const level of depthLevels) {
            // Handle different possible property names
            const levelQuantity = level.quantity || level.volume || 0;
            const levelPrice = level.price || 0;
            
            if (levelQuantity <= 0 || levelPrice <= 0) continue;
            
            const levelVolume = Math.min(levelQuantity, quantity - totalVolume);
            if (levelVolume <= 0) continue;
            
            totalVolume += levelVolume;
            totalValue += levelVolume * levelPrice;
            
            if (totalVolume >= quantity) break;
        }
        
        // Avoid division by zero
        if (totalVolume <= 0) return 0;
        
        const averagePrice = totalValue / totalVolume;
        
        // Defensive access to price properties with fallbacks
        let basePrice = 0;
        if (orderType === 'buy') {
            basePrice = stock.askPriceUSD || stock.priceUSD || (stock.price / this.xuRate) || 0;
        } else {
            basePrice = stock.bidPriceUSD || stock.priceUSD || (stock.price / this.xuRate) || 0;
        }
        
        if (basePrice <= 0) return 0;
        
        const slippage = (averagePrice - basePrice) / basePrice;
        // Final safety check
        return isNaN(slippage) ? 0 : slippage;
    } catch (error) {
        console.error("Error calculating slippage:", error);
        return 0; // Return 0 slippage in case of any error
    }
}
}
module.exports = TradeSystem;