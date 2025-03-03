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
    close: 17
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
        this.marginPositions = {};
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
    }

    setupTransactionHandlers() {
        // Handle transaction completion
        this.transactionManager.on('transactionCompleted', (event) => {
            console.log(`Transaction ${event.transactionId} completed successfully`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_COMPLETED',
                message: 'Giao dịch thành công',
                data: event.data
            });
        });

        // Handle transaction timeout
        this.transactionManager.on('transactionTimeout', (event) => {
            console.log(`Transaction ${event.transactionId} timed out`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_TIMEOUT',
                message: 'Giao dịch hết thời gian chờ',
                data: event.data
            });
        });

        // Handle transaction rollback
        this.transactionManager.on('transactionRolledBack', (event) => {
            console.log(`Transaction ${event.transactionId} rolled back`);
            this.notifyUser(event.userId, {
                type: 'TRANSACTION_ROLLBACK',
                message: 'Giao dịch thất bại và đã được hoàn tác',
                data: event.data
            });
        });

        // Handle step completion
        this.transactionManager.on('stepCompleted', (event) => {
            console.log(`Step ${event.step}/${event.totalSteps} completed for transaction ${event.transactionId}`);
        });
    }

    // Helper method to notify users
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
        // Handle trade events
        this.orderBook.on('trade', async (trade) => {
            try {
                const { symbol, price, quantity, buyerId, sellerId } = trade;
                
                // Get portfolios
                const buyerPortfolio = this.getUserPortfolio(buyerId);
                const sellerPortfolio = this.getUserPortfolio(sellerId);

                // Save original state for rollback
                const originalBuyerState = JSON.parse(JSON.stringify(buyerPortfolio));
                const originalSellerState = JSON.parse(JSON.stringify(sellerPortfolio));

                try {
                    // Update buyer's portfolio
                    if (!buyerPortfolio.stocks[symbol]) {
                        buyerPortfolio.stocks[symbol] = { quantity: 0, averagePrice: 0 };
                    }
                    const oldValue = buyerPortfolio.stocks[symbol].quantity * buyerPortfolio.stocks[symbol].averagePrice;
                    const newValue = price * quantity;
                    const totalQuantity = buyerPortfolio.stocks[symbol].quantity + quantity;
                    buyerPortfolio.stocks[symbol].averagePrice = Math.floor((oldValue + newValue) / totalQuantity);
                    buyerPortfolio.stocks[symbol].quantity = totalQuantity;

                    // Update seller's portfolio
                    if (!sellerPortfolio.stocks[symbol]) {
                        sellerPortfolio.stocks[symbol] = { quantity: 0, averagePrice: 0 };
                    }
                    sellerPortfolio.stocks[symbol].quantity -= quantity;
                    if (sellerPortfolio.stocks[symbol].quantity <= 0) {
                        delete sellerPortfolio.stocks[symbol];
                    }

                    // Record transaction in both portfolios
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

                    // Save portfolios
                    await this.savePortfolios();

                    // Log successful trade
                    console.log(`Trade executed: ${symbol} - ${quantity} @ ${price}`);
                    console.log(`Buyer: ${buyerId}, Seller: ${sellerId}`);

                } catch (error) {
                    // Rollback on error
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

        // Handle order status updates
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
    
        const portfolio = this.getUserPortfolio(userId);
        if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
            throw new Error("Không đủ cổ phiếu để bán");
        }
    
        const stockData = this.getStockPrice(symbol);
        const marketPrice = Math.floor(stockData.price);

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
    
        const totalValue = marketPrice * quantity;
        const transactionFee = Math.floor(Math.min(
            Math.max(totalValue * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalValue * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        const finalValue = totalValue - transactionFee - tax;
    
        try {
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
                price: marketPrice,
                total: totalValue,
                transactionFee,
                tax,
                finalValue
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
    
        const stockData = this.getStockPrice(symbol);
        const marketPrice = Math.floor(stockData.price);
        const totalCost = marketPrice * quantity;
        
        // Calculate fees
        const transactionFee = Math.floor(Math.min(
            Math.max(totalCost * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalCost * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        const totalWithFees = totalCost + transactionFee + tax;
    
        // Check if user has enough balance
        const balance = await getBalance(userId);
        if (balance < totalWithFees) {
            throw new Error(`Không đủ tiền! Cần ${this.formatNumber(totalWithFees)} Xu`);
        }
    
        try {
            // Update user portfolio
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
    
            // Record transaction
            if (!portfolio.transactions) portfolio.transactions = [];
            portfolio.transactions.push({
                type: 'buy',
                symbol,
                quantity,
                price: marketPrice,
                total: totalCost,
                fees: {
                    transaction: transactionFee,
                    tax: tax
                },
                timestamp: Date.now()
            });
    
            // Update user balance
            await updateBalance(userId, -totalWithFees);
            this.savePortfolios();
    
            return {
                symbol,
                quantity,
                price: marketPrice,
                total: totalCost,
                transactionFee,
                tax,
                totalWithFees,
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