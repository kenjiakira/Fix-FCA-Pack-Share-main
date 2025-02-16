const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const MarketAlgorithms = require('../config/trade/marketAlgorithms');

const USER_PORTFOLIO_PATH = path.join(__dirname, '../commands/json/trade/portfolios.json');
const EXCHANGE_RATE_PATH = path.join(__dirname, '../commands/json/trade/exchange_rate.json');
const STOCKS_DATA_PATH = path.join(__dirname, '../commands/json/trade/stocks_data.json');

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

class TradeSystem {
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
        }, 180000);
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
        const totalValue = Math.floor(stockData.price * quantity);
        
        const transactionFee = Math.floor(Math.min(
            Math.max(totalValue * FEES.transaction, FEES.minFee),
            FEES.maxFee
        ));
        const tax = Math.floor(Math.min(
            Math.max(totalValue * FEES.tax, FEES.minFee),
            FEES.maxFee
        ));
        const finalValue = Math.floor(totalValue - transactionFee - tax);

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
        return MarketAlgorithms.analyzeMarket(this.stocks);
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
}

module.exports = TradeSystem;
