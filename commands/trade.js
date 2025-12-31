const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const {
    getBalance,
    updateBalance,
} = require('../utils/currencies');
const { getUserName } = require('../utils/userUtils');
const { createMarketOverviewCanvas } = require('../game/canvas/tradeMarketCanvas');
const { createNewsCanvas } = require('../game/canvas/tradeNewsCanvas');
const { createPortfolioCheckCanvas } = require('../game/canvas/tradeCheckCanvas');

const DATA_DIR = path.join(__dirname, '../database/json/trade');
const TRADE_DATA_FILE = path.join(DATA_DIR, 'trade_data.json');
const MARKET_DATA_FILE = path.join(DATA_DIR, 'market_data.json');
const NEWS_DATA_FILE = path.join(DATA_DIR, 'news_data.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const HISTORY_FILE = path.join(DATA_DIR, 'trading_history.json');
const MARKET_HISTORY_FILE = path.join(DATA_DIR, 'market_history.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STOCK_CONFIG = {
    baseFee: 0.01,
    vipDiscounts: {
        1: 0.008,
        2: 0.005,
        3: 0.002
    },
    updateInterval: 15 * 60 * 1000,
    volatility: {
        low: { min: -0.02, max: 0.02 },
        medium: { min: -0.05, max: 0.05 },
        high: { min: -0.1, max: 0.1 }
    },
    newsImpact: {
        veryBad: { min: -0.15, max: -0.05 },
        bad: { min: -0.08, max: -0.02 },
        neutral: { min: -0.02, max: 0.02 },
        good: { min: 0.02, max: 0.08 },
        veryGood: { min: 0.05, max: 0.15 }
    },
    initialStocks: {
        "APPL": {
            name: "Apple Inc.",
            price: 180.5,
            volatility: "medium",
            sector: "Technology",
            trend: "up",
            history: []
        },
        "GOOG": {
            name: "Alphabet Inc.",
            price: 142.8,
            volatility: "medium",
            sector: "Technology",
            trend: "stable",
            history: []
        },
        "MSFT": {
            name: "Microsoft Corp.",
            price: 378.9,
            volatility: "low",
            sector: "Technology",
            trend: "up",
            history: []
        },
        "TSLA": {
            name: "Tesla Inc.",
            price: 217.6,
            volatility: "high",
            sector: "Automotive",
            trend: "down",
            history: []
        },
        "AMZN": {
            name: "Amazon.com Inc.",
            price: 176.2,
            volatility: "medium",
            sector: "Retail",
            trend: "up",
            history: []
        },
        "META": {
            name: "Meta Platforms Inc.",
            price: 471.7,
            volatility: "medium",
            sector: "Technology",
            trend: "up",
            history: []
        },
        "NFLX": {
            name: "Netflix Inc.",
            price: 601.5,
            volatility: "medium",
            sector: "Entertainment",
            trend: "stable",
            history: []
        },
        "COIN": {
            name: "Coinbase Global Inc.",
            price: 212.4,
            volatility: "high",
            sector: "Finance",
            trend: "down",
            history: []
        },
        "PEP": {
            name: "PepsiCo Inc.",
            price: 172.3,
            volatility: "low",
            sector: "Consumer Goods",
            trend: "stable",
            history: []
        },
        "DIS": {
            name: "Walt Disney Co.",
            price: 113.8,
            volatility: "medium",
            sector: "Entertainment",
            trend: "down",
            history: []
        },
        "AKI": {
            name: "AKI Corporation",
            price: 24.7,
            volatility: "high",
            sector: "Technology",
            trend: "up",
            history: []
        },
        "HNT": {
            name: "HNT Industries",
            price: 42.3,
            volatility: "high",
            sector: "Innovation",
            trend: "up",
            history: []
        }
    },
    newsTemplates: {
        veryGood: [
            "{company} công bố sản phẩm đột phá, cổ phiếu tăng vọt!",
            "{company} vượt kỳ vọng lợi nhuận hơn 20%!",
            "{company} ký hợp tác lớn với tập đoàn Fortune 500!",
            "{company} được chính phủ phê duyệt sản phẩm mới cách mạng!",
            "{company} thông báo mua lại cổ phiếu trị giá hàng tỷ USD!"
        ],
        good: [
            "{company} báo cáo lợi nhuận quý tốt hơn dự kiến.",
            "{company} mở rộng sang thị trường quốc tế mới.",
            "{company} ra mắt dòng sản phẩm mới nhận đánh giá tích cực.",
            "{company} tăng cổ tức thêm 10%.",
            "{company} công bố mua lại chiến lược để thúc đẩy tăng trưởng."
        ],
        neutral: [
            "{company} duy trì triển vọng thị trường hiện tại.",
            "{company} đáp ứng kỳ vọng của nhà phân tích trong báo cáo quý.",
            "{company} thông báo thay đổi quản lý thường kỳ.",
            "{company} tổ chức đại hội cổ đông hàng năm không có thông báo lớn.",
            "{company} nâng cấp hệ thống nội bộ để cải thiện hiệu suất."
        ],
        bad: [
            "{company} lợi nhuận không đạt kỳ vọng.",
            "{company} đối mặt với kiểm tra nhỏ từ cơ quan quản lý.",
            "{company} hoãn ra mắt sản phẩm vài tháng.",
            "{company} báo cáo chi phí tăng do vấn đề chuỗi cung ứng.",
            "{company} tăng trưởng chậm lại ở thị trường trọng điểm."
        ],
        veryBad: [
            "{company} bị điều tra vì nghi vấn gian lận!",
            "{company} thu hồi sản phẩm hàng loạt ảnh hưởng triệu đơn vị!",
            "{company} CEO từ chức giữa bê bối!",
            "{company} thua kiện bằng sáng chế quan trọng với đối thủ!",
            "{company} báo lỗ quý lớn, cắt giảm cổ tức!"
        ]

    }
};

function formatCurrency(number) {
    return number.toLocaleString('vi-VN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function loadTradeData() {
    try {
        if (!fs.existsSync(TRADE_DATA_FILE)) {
            return { users: {} };
        }
        return JSON.parse(fs.readFileSync(TRADE_DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading trade data:', error);
        return { users: {} };
    }
}
function loadMarketHistory() {
    try {
        if (!fs.existsSync(MARKET_HISTORY_FILE)) {
            return { snapshots: [] };
        }
        return JSON.parse(fs.readFileSync(MARKET_HISTORY_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading market history:', error);
        return { snapshots: [] };
    }
}

function saveMarketHistory(data) {
    try {
        fs.writeFileSync(MARKET_HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving market history:', error);
    }
}

function saveTradeData(data) {
    try {
        fs.writeFileSync(TRADE_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving trade data:', error);
    }
}

function loadMarketData() {
    try {
        if (!fs.existsSync(MARKET_DATA_FILE)) {

            const marketData = {
                stocks: STOCK_CONFIG.initialStocks,
                lastUpdate: Date.now()
            };
            saveMarketData(marketData);
            return marketData;
        }
        return JSON.parse(fs.readFileSync(MARKET_DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading market data:', error);
        return { stocks: STOCK_CONFIG.initialStocks, lastUpdate: Date.now() };
    }
}

function saveMarketData(data) {
    try {
        fs.writeFileSync(MARKET_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving market data:', error);
    }
}

function loadNewsData() {
    try {
        if (!fs.existsSync(NEWS_DATA_FILE)) {
            return { news: [] };
        }
        return JSON.parse(fs.readFileSync(NEWS_DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading news data:', error);
        return { news: [] };
    }
}

function saveNewsData(data) {
    try {
        fs.writeFileSync(NEWS_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving news data:', error);
    }
}

function loadLeaderboard() {
    try {
        if (!fs.existsSync(LEADERBOARD_FILE)) {
            return { traders: [] };
        }
        return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        return { traders: [] };
    }
}

function saveLeaderboard(data) {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving leaderboard:', error);
    }
}

function loadHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            return { transactions: {} };
        }
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (error) {
        console.error('Error loading history:', error);
        return { transactions: {} };
    }
}

function saveHistory(data) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}


function initializeUser(userId) {
    const tradeData = loadTradeData();

    if (!tradeData.users[userId]) {
        tradeData.users[userId] = {
            portfolio: {},
            cash: 0,
            invested: 0,
            totalProfit: 0,
            tradeCount: 0,
            successTrades: 0,
            lastUpdated: Date.now(),
            createdAt: Date.now()
        };
        saveTradeData(tradeData);
    }

    return tradeData.users[userId];
}

function getUserPortfolioValue(userId) {
    const tradeData = loadTradeData();
    const userData = tradeData.users[userId] || initializeUser(userId);
    const marketData = loadMarketData();

    let portfolioValue = 0;
    for (const [symbol, holding] of Object.entries(userData.portfolio)) {
        const stock = marketData.stocks[symbol];
        if (stock) {
            portfolioValue += stock.price * holding.shares;
        }
    }

    return portfolioValue;
}

function updateUserStats(userId) {
    const tradeData = loadTradeData();
    if (!tradeData.users[userId]) return;

    const userData = tradeData.users[userId];
    const portfolioValue = getUserPortfolioValue(userId);

    userData.invested = portfolioValue;
    userData.lastUpdated = Date.now();


    updateLeaderboard(userId, userData.cash + portfolioValue, userData.totalProfit);

    saveTradeData(tradeData);
}

function updateLeaderboard(userId, totalValue, totalProfit) {
    const leaderboard = loadLeaderboard();
    const userIndex = leaderboard.traders.findIndex(trader => trader.userId === userId);

    const name = getUserName(userId) || `User ${userId}`; // Thay getName thành getUserName

    if (userIndex >= 0) {
        leaderboard.traders[userIndex] = {
            userId,
            name,
            totalValue,
            totalProfit,
            updatedAt: Date.now()
        };
    } else {
        leaderboard.traders.push({
            userId,
            name,
            totalValue,
            totalProfit,
            updatedAt: Date.now()
        });
    }

    leaderboard.traders.sort((a, b) => b.totalValue - a.totalValue);


    if (leaderboard.traders.length > 100) {
        leaderboard.traders = leaderboard.traders.slice(0, 100);
    }

    saveLeaderboard(leaderboard);
}

function recordTransaction(userId, type, symbol, shares, price, total) {
    const history = loadHistory();

    if (!history.transactions[userId]) {
        history.transactions[userId] = [];
    }

    history.transactions[userId].unshift({
        type,
        symbol,
        shares,
        price,
        total,
        timestamp: Date.now()
    });


    if (history.transactions[userId].length > 50) {
        history.transactions[userId] = history.transactions[userId].slice(0, 50);
    }

    saveHistory(history);
}


function generateMarketNews() {
    const marketData = loadMarketData();
    const newsData = loadNewsData();


    const symbols = Object.keys(marketData.stocks);
    const symbol = getRandomElement(symbols);
    const stock = marketData.stocks[symbol];

    const impactTypes = ["veryGood", "good", "neutral", "bad", "veryBad"];
    const weights = [1, 3, 5, 3, 1];


    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedImpact = impactTypes[impactTypes.length - 1];

    for (let i = 0; i < weights.length; i++) {
        currentWeight += weights[i];
        if (random <= currentWeight) {
            selectedImpact = impactTypes[i];
            break;
        }
    }


    const templates = STOCK_CONFIG.newsTemplates[selectedImpact];
    const template = getRandomElement(templates);


    const news = {
        symbol,
        headline: template.replace("{company}", stock.name),
        impact: selectedImpact,
        timestamp: Date.now()
    };


    newsData.news = [news, ...newsData.news].slice(0, 20);
    saveNewsData(newsData);


    applyNewsImpact(symbol, selectedImpact);

    return news;
}

function applyNewsImpact(symbol, impactType) {
    const marketData = loadMarketData();
    const stock = marketData.stocks[symbol];
    if (!stock) return;

    const impact = STOCK_CONFIG.newsImpact[impactType];
    const impactPercent = getRandomNumber(impact.min, impact.max);


    const oldPrice = stock.price;
    stock.price = Math.max(0.01, oldPrice * (1 + impactPercent));


    if (impactPercent > 0.03) stock.trend = "up";
    else if (impactPercent < -0.03) stock.trend = "down";
    else stock.trend = "stable";


    stock.history.push({
        price: stock.price,
        timestamp: Date.now()
    });


    if (stock.history.length > 50) {
        stock.history = stock.history.slice(stock.history.length - 50);
    }

    marketData.lastUpdate = Date.now();
    saveMarketData(marketData);
}

function updateMarket() {
    const marketData = loadMarketData();
    const now = Date.now();


    if (now - marketData.lastUpdate < STOCK_CONFIG.updateInterval) return;


    for (const [symbol, stock] of Object.entries(marketData.stocks)) {
        const volatility = STOCK_CONFIG.volatility[stock.volatility || "medium"];
        const change = getRandomNumber(volatility.min, volatility.max);

        let trendBias = 0;
        if (stock.trend === "up") trendBias = 0.01;
        else if (stock.trend === "down") trendBias = -0.01;

        const oldPrice = stock.price;
        stock.price = Math.max(0.01, oldPrice * (1 + change + trendBias));

        if (stock.history.length >= 5) {
            const recentPrices = stock.history.slice(-5);
            const increases = recentPrices.filter((p, i) =>
                i > 0 && p.price > recentPrices[i - 1].price
            ).length;

            if (increases >= 3) stock.trend = "up";
            else if (increases <= 1) stock.trend = "down";
            else stock.trend = "stable";
        }

        stock.history.push({
            price: stock.price,
            timestamp: now
        });

        if (stock.history.length > 50) {
            stock.history = stock.history.slice(stock.history.length - 50);
        }
    }

    marketData.lastUpdate = now;
    saveMarketData(marketData);


    const marketHistory = loadMarketHistory();


    const snapshot = {
        timestamp: now,
        stocks: {}
    };


    for (const [symbol, stock] of Object.entries(marketData.stocks)) {
        snapshot.stocks[symbol] = {
            price: stock.price,
            trend: stock.trend
        };
    }

    marketHistory.snapshots.push(snapshot);


    const sixHoursAgo = now - (6 * 60 * 60 * 1000);
    marketHistory.snapshots = marketHistory.snapshots.filter(snap =>
        snap.timestamp >= sixHoursAgo
    );

    saveMarketHistory(marketHistory);


    if (Math.random() < 0.3) {
        generateMarketNews();
    }
}
function get6HourPerformance() {
    const history = loadMarketHistory();

    if (history.snapshots.length < 2) {
        return { isEmpty: true, performanceData: {} };
    }


    const oldestSnapshot = history.snapshots[0];
    const newestSnapshot = history.snapshots[history.snapshots.length - 1];
    const timeDiffHours = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (60 * 60 * 1000);

    const performanceData = {
        timespan: timeDiffHours.toFixed(1),
        stocks: {}
    };


    for (const [symbol, latestData] of Object.entries(newestSnapshot.stocks)) {

        if (oldestSnapshot.stocks[symbol]) {
            const startPrice = oldestSnapshot.stocks[symbol].price;
            const endPrice = latestData.price;
            const changePercent = ((endPrice - startPrice) / startPrice) * 100;

            performanceData.stocks[symbol] = {
                startPrice,
                endPrice,
                changePercent,
            };
        }
    }


    const sortedSymbols = Object.entries(performanceData.stocks)
        .sort((a, b) => b[1].changePercent - a[1].changePercent)
        .map(entry => entry[0]);

    performanceData.topGainers = sortedSymbols.slice(0, 3);
    performanceData.topLosers = sortedSymbols.reverse().slice(0, 3);

    return { isEmpty: false, performanceData };
}
function buyStock(userId, symbol, shares, vipLevel = 0) {

    shares = parseInt(shares);
    if (isNaN(shares) || shares <= 0) {
        return { success: false, message: "❌ Số lượng cổ phiếu không hợp lệ!" };
    }

    const marketData = loadMarketData();
    const stock = marketData.stocks[symbol];

    if (!stock) {
        return { success: false, message: `❌ Mã cổ phiếu ${symbol} không tồn tại!` };
    }

    const price = stock.price;
    const fee = vipLevel > 0 ? STOCK_CONFIG.vipDiscounts[vipLevel] : STOCK_CONFIG.baseFee;
    const subtotal = price * shares;
    const feeAmount = subtotal * fee;
    const total = subtotal + feeAmount;


    const balance = getBalance(userId);
    if (balance < total) {
        return {
            success: false,
            message: `❌ Số dư không đủ!\n💰 Cần: ${formatCurrency(total)}$\n💵 Hiện có: ${formatCurrency(balance)}$`
        };
    }


    const tradeData = loadTradeData();
    const userData = tradeData.users[userId] || initializeUser(userId);

    if (!userData.portfolio[symbol]) {
        userData.portfolio[symbol] = {
            shares: 0,
            avgBuyPrice: 0,
            totalInvested: 0
        };
    }


    const oldShares = userData.portfolio[symbol].shares;
    const oldAvgPrice = userData.portfolio[symbol].avgBuyPrice;
    const oldTotalInvested = userData.portfolio[symbol].totalInvested;

    const newTotalShares = oldShares + shares;
    const newTotalInvested = oldTotalInvested + subtotal;
    const newAvgPrice = newTotalInvested / newTotalShares;

    userData.portfolio[symbol].shares = newTotalShares;
    userData.portfolio[symbol].avgBuyPrice = newAvgPrice;
    userData.portfolio[symbol].totalInvested = newTotalInvested;

    userData.cash = balance - total;
    userData.tradeCount++;

    saveTradeData(tradeData);
    updateBalance(userId, -total);


    recordTransaction(userId, "buy", symbol, shares, price, total);


    updateUserStats(userId);

    return {
        success: true,
        message: `✅ Mua thành công ${shares} cổ phiếu ${symbol}!\n💰 Tổng: -${formatCurrency(total)}$\n💸 Phí giao dịch: ${formatCurrency(feeAmount)}$ (${fee * 100}%)`
    };
}

function sellStock(userId, symbol, shares, vipLevel = 0) {

    shares = parseInt(shares);
    if (isNaN(shares) || shares <= 0) {
        return { success: false, message: "❌ Số lượng cổ phiếu không hợp lệ!" };
    }

    const tradeData = loadTradeData();
    const userData = tradeData.users[userId] || initializeUser(userId);


    if (!userData.portfolio[symbol] || userData.portfolio[symbol].shares < shares) {
        return {
            success: false,
            message: "❌ Bạn không có đủ cổ phiếu để bán!"
        };
    }

    const marketData = loadMarketData();
    const stock = marketData.stocks[symbol];

    if (!stock) {
        return { success: false, message: `❌ Mã cổ phiếu ${symbol} không tồn tại!` };
    }

    const price = stock.price;
    const fee = vipLevel > 0 ? STOCK_CONFIG.vipDiscounts[vipLevel] : STOCK_CONFIG.baseFee;
    const subtotal = price * shares;
    const feeAmount = subtotal * fee;
    const total = subtotal - feeAmount;


    const avgBuyPrice = userData.portfolio[symbol].avgBuyPrice;
    const profitPerShare = price - avgBuyPrice;
    const profit = profitPerShare * shares;


    userData.portfolio[symbol].shares -= shares;
    if (userData.portfolio[symbol].shares === 0) {

        delete userData.portfolio[symbol];
    } else {

        userData.portfolio[symbol].totalInvested = userData.portfolio[symbol].avgBuyPrice * userData.portfolio[symbol].shares;
    }


    userData.cash = (userData.cash || 0) + total;
    userData.totalProfit = (userData.totalProfit || 0) + profit;
    userData.tradeCount++;
    if (profit > 0) userData.successTrades = (userData.successTrades || 0) + 1;

    saveTradeData(tradeData);
    updateBalance(userId, total);


    recordTransaction(userId, "sell", symbol, shares, price, total);


    updateUserStats(userId);

    const profitMsg = profit >= 0
        ? `📈 Lợi nhuận: +${formatCurrency(profit)}$`
        : `📉 Lỗ: ${formatCurrency(profit)}$`;

    return {
        success: true,
        message: `✅ Bán thành công ${shares} cổ phiếu ${symbol}!\n💰 Nhận được: +${formatCurrency(total)}$\n💸 Phí giao dịch: ${formatCurrency(feeAmount)}$ (${fee * 100}%)\n${profitMsg}`
    };
}

async function createStockChartCanvas(symbol, daysToShow = 7) {
    try {
        const marketData = loadMarketData();
        const stock = marketData.stocks[symbol];

        if (!stock) {
            throw new Error(`Stock ${symbol} not found`);
        }


        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const history = stock.history.filter(p => p.timestamp > now - (daysToShow * msPerDay));


        if (history.length <= 1) {
            const fakeHistory = [];
            const currentPrice = stock.price;
            const volatility = STOCK_CONFIG.volatility[stock.volatility || "medium"];

            for (let i = daysToShow; i > 0; i--) {
                const variance = getRandomNumber(volatility.min, volatility.max);
                fakeHistory.push({
                    price: currentPrice * (1 - variance * i / daysToShow),
                    timestamp: now - (i * msPerDay)
                });
            }


            fakeHistory.push({
                price: currentPrice,
                timestamp: now
            });

            history.splice(0, history.length, ...fakeHistory);
        }


        history.sort((a, b) => a.timestamp - b.timestamp);


        const width = 800;
        const height = 500;
        const padding = 50;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');


        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);


        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;


        for (let i = 1; i < 5; i++) {
            const y = padding + (height - 2 * padding) * (i / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }


        const numPoints = history.length;
        for (let i = 0; i < numPoints; i += Math.max(1, Math.floor(numPoints / 7))) {
            const x = padding + (width - 2 * padding) * (i / (numPoints - 1));
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }


        const prices = history.map(p => p.price);
        const minPrice = Math.min(...prices) * 0.95;
        const maxPrice = Math.max(...prices) * 1.05;


        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= 5; i++) {
            const y = height - padding - (height - 2 * padding) * (i / 5);
            const price = minPrice + (maxPrice - minPrice) * (i / 5);
            ctx.fillText(price.toFixed(2), padding - 10, y);
        }


        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 0; i < numPoints; i += Math.max(1, Math.floor(numPoints / 7))) {
            const x = padding + (width - 2 * padding) * (i / (numPoints - 1));
            const date = new Date(history[i].timestamp);
            ctx.fillText(date.toLocaleDateString(), x, height - padding + 10);
        }


        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${stock.name} (${symbol}) - ${formatCurrency(stock.price)}$`, width / 2, 20);


        ctx.font = '14px Arial';
        const trendText = stock.trend === "up" ? "📈 Uptrend" : stock.trend === "down" ? "📉 Downtrend" : "Stable";
        const volatilityText = `Volatility: ${stock.volatility.charAt(0).toUpperCase() + stock.volatility.slice(1)}`;
        ctx.fillText(`${trendText} | ${volatilityText} | Sector: ${stock.sector}`, width / 2, 45);


        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 3;
        ctx.beginPath();

        history.forEach((point, i) => {
            const x = padding + (width - 2 * padding) * (i / (numPoints - 1));
            const y = height - padding - ((point.price - minPrice) / (maxPrice - minPrice)) * (height - 2 * padding);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();


        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();

        const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
        areaGradient.addColorStop(0, 'rgba(76, 201, 240, 0.3)');
        areaGradient.addColorStop(1, 'rgba(76, 201, 240, 0)');
        ctx.fillStyle = areaGradient;
        ctx.fill();


        ctx.fillStyle = '#f72585';
        history.forEach((point, i) => {
            const x = padding + (width - 2 * padding) * (i / (numPoints - 1));
            const y = height - padding - ((point.price - minPrice) / (maxPrice - minPrice)) * (height - 2 * padding);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });


        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `chart_${symbol.toLowerCase()}_${Date.now()}.png`);
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();

        return new Promise((resolve, reject) => {
            stream.pipe(out);
            out.on('finish', () => resolve(filePath));
            out.on('error', reject);
        });
    } catch (error) {
        console.error('Error creating stock chart:', error);
        throw error;
    }
}


function formatPortfolio(userId) {
    const tradeData = loadTradeData();
    const userData = tradeData.users[userId] || initializeUser(userId);
    const marketData = loadMarketData();

    let totalValue = 0;
    let totalProfit = 0;
    let portfolioLines = [];

    for (const [symbol, holding] of Object.entries(userData.portfolio)) {
        const stock = marketData.stocks[symbol];
        if (!stock) continue;

        const currentValue = stock.price * holding.shares;
        const profit = currentValue - holding.totalInvested;
        const profitPercent = (profit / holding.totalInvested) * 100;

        totalValue += currentValue;
        totalProfit += profit;

        const trendEmoji = stock.trend === "up" ? "📈" : stock.trend === "down" ? "📉" : "📊";
        const profitEmoji = profit >= 0 ? "🟢" : "🔴";

        portfolioLines.push(
            `${trendEmoji} ${symbol} - ${stock.name}\n` +
            `   💵 Giá: ${formatCurrency(stock.price)}$ | 🔢 SL: ${holding.shares}\n` +
            `   💰 Giá mua TB: ${formatCurrency(holding.avgBuyPrice)}$\n` +
            `   💸 Giá trị: ${formatCurrency(currentValue)}$ | ${profitEmoji} ${profit >= 0 ? "+" : ""}${formatCurrency(profit)}$ (${profitPercent.toFixed(2)}%)`
        );
    }

    return {
        portfolioLines,
        totalValue,
        totalProfit,
        cash: userData.cash || 0,
        isEmpty: portfolioLines.length === 0
    };
}


function formatHistory(userId, limit = 5) {
    const history = loadHistory();
    const transactions = history.transactions[userId] || [];

    if (transactions.length === 0) {
        return { isEmpty: true, transactionLines: [] };
    }

    const transactionLines = transactions.slice(0, limit).map(tx => {
        const date = new Date(tx.timestamp).toLocaleString();
        const typeEmoji = tx.type === "buy" ? "🛒" : "💸";
        const actionText = tx.type === "buy" ? "Mua" : "Bán";

        return `${typeEmoji} ${actionText} ${tx.shares} ${tx.symbol} @ ${formatCurrency(tx.price)}$ | Tổng: ${formatCurrency(tx.total)}$ | ${date}`;
    });

    return {
        isEmpty: false,
        transactionLines
    };
}


function formatMarketOverview() {
    const marketData = loadMarketData();
    const stocks = Object.entries(marketData.stocks);


    stocks.sort((a, b) => {
        const trendOrder = { up: 0, stable: 1, down: 2 };
        return trendOrder[a[1].trend] - trendOrder[b[1].trend];
    });

    const stockLines = stocks.map(([symbol, stock]) => {
        const trendEmoji = stock.trend === "up" ? "📈" : stock.trend === "down" ? "📉" : "📊";
        return `${trendEmoji} ${symbol} - ${stock.name} - ${formatCurrency(stock.price)}$`;
    });

    return {
        stockLines,
        lastUpdate: new Date(marketData.lastUpdate).toLocaleString()
    };
}


function getRecentNews(limit = 5) {
    const newsData = loadNewsData();

    if (!newsData.news || newsData.news.length === 0) {
        return { isEmpty: true, newsLines: [] };
    }

    const newsLines = newsData.news.slice(0, limit).map(news => {
        const date = new Date(news.timestamp).toLocaleString();
        let emoji;

        switch (news.impact) {
            case "veryGood": emoji = "🔥"; break;
            case "good": emoji = "🟢"; break;
            case "neutral": emoji = "⚪"; break;
            case "bad": emoji = "🟠"; break;
            case "veryBad": emoji = "🔴"; break;
            default: emoji = "📰";
        }

        return `${emoji} ${news.headline} | ${date}`;
    });

    return {
        isEmpty: false,
        newsLines
    };
}


function getTopTraders(limit = 10) {
    const leaderboard = loadLeaderboard();

    if (!leaderboard.traders || leaderboard.traders.length === 0) {
        return { isEmpty: true, traderLines: [] };
    }

    const traderLines = leaderboard.traders.slice(0, limit).map((trader, index) => {
        let medal;
        switch (index) {
            case 0: medal = "🥇"; break;
            case 1: medal = "🥈"; break;
            case 2: medal = "🥉"; break;
            default: medal = `${index + 1}.`;
        }

        const profitText = trader.totalProfit >= 0
            ? `+${formatCurrency(trader.totalProfit)}$`
            : `${formatCurrency(trader.totalProfit)}$`;

        return `${medal} ${trader.name} - ${formatCurrency(trader.totalValue)}$ | ${profitText}`;
    });

    return {
        isEmpty: false,
        traderLines
    };
}


function startGameLoop() {

    setInterval(() => {
        try {
            updateMarket();
        } catch (error) {
            console.error('Error updating market:', error);
        }
    }, STOCK_CONFIG.updateInterval);


    setInterval(() => {
        try {
            generateMarketNews();
        } catch (error) {
            console.error('Error generating news:', error);
        }
    }, 60 * 60 * 1000);

    console.log('[TRADE] Game loop started');
}

module.exports = {
    name: "trade",
    dev: "HNT",
    category: "Games",
    info: "Chơi game mua bán cổ phiếu, đầu tư chứng khoán.",
    onPrefix: true,
    usages: "trade [check/buy/sell/market/news/top/chart] [mã cổ phiếu] [số lượng]",
    cooldowns: 5,

    onLoad: function () {

        try {
            updateMarket();
            startGameLoop();
        } catch (error) {
            console.error('[TRADE] Error on load:', error);
        }
    },

    onLaunch: async function ({ api, event, target }) {
        try {
            const { threadID, messageID, senderID } = event;
            const action = target[0]?.toLowerCase();


            updateMarket();

            if (!action || action === "help") {
                return api.sendMessage(
                    "🏦 CHỨNG KHOÁN AKI 🏦\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "🔸 .trade check - Xem danh mục đầu tư\n" +
                    "🔸 .trade buy [mã] [số lượng] - Mua cổ phiếu\n" +
                    "🔸 .trade sell [mã] [số lượng] - Bán cổ phiếu\n" +
                    "🔸 .trade market - Xem thông tin thị trường\n" +
                    "🔸 .trade news - Xem tin tức thị trường\n" +
                    "🔸 .trade top - Xem bảng xếp hạng nhà đầu tư\n" +
                    "🔸 .trade history - Xem lịch sử giao dịch",
                    threadID, messageID
                );
            }


            const userData = initializeUser(senderID);

            switch (action) {
                case "check": {
                    try {
                        const marketData = loadMarketData();
                        const tradeData = loadTradeData();
                        const userData = tradeData.users[senderID] || initializeUser(senderID);

                        const userName = getUserName(senderID); // Thay await getName thành getUserName (bỏ await)

                        const canvasPath = await createPortfolioCheckCanvas(userData, marketData, userName);

                        const { portfolioLines, totalValue, totalProfit, cash, isEmpty } = formatPortfolio(senderID);
                        const { transactionLines, isEmpty: historyEmpty } = formatHistory(senderID, 3);

                        let message = "📊 DANH MỤC ĐẦU TƯ CỦA BẠN 📊\n━━━━━━━━━━━━━━━━━━\n\n";

                        if (isEmpty) {
                            message += "❌ Bạn chưa có cổ phiếu nào trong danh mục!\n\n";
                        } else {
                            message += portfolioLines.join("\n\n") + "\n\n";
                        }

                        message += `💵 Tiền mặt: ${formatCurrency(cash)}$\n`;
                        message += `💰 Tổng giá trị: ${formatCurrency(cash + totalValue)}$\n`;
                        message += `${totalProfit >= 0 ? "📈" : "📉"} Lợi nhuận: ${totalProfit >= 0 ? "+" : ""}${formatCurrency(totalProfit)}$\n\n`;

                        if (!historyEmpty) {
                            message += "📝 GIAO DỊCH GẦN ĐÂY\n";
                            message += transactionLines.join("\n");
                        }

                        return api.sendMessage(
                            {
                                body: message,
                                attachment: fs.createReadStream(canvasPath)
                            },
                            threadID,
                            (err) => {
                                if (err) console.error(err);
                                fs.unlinkSync(canvasPath);
                            }
                        );
                    } catch (error) {
                        console.error('Error creating portfolio canvas:', error);

                        const { portfolioLines, totalValue, totalProfit, cash, isEmpty } = formatPortfolio(senderID);
                        const { transactionLines, isEmpty: historyEmpty } = formatHistory(senderID, 3);

                        let message = "📊 DANH MỤC ĐẦU TƯ CỦA BẠN 📊\n━━━━━━━━━━━━━━━━━━\n\n";

                        if (isEmpty) {
                            message += "❌ Bạn chưa có cổ phiếu nào trong danh mục!\n\n";
                        } else {
                            message += portfolioLines.join("\n\n") + "\n\n";
                        }

                        message += `💵 Tiền mặt: ${formatCurrency(cash)}$\n`;
                        message += `💰 Tổng giá trị: ${formatCurrency(cash + totalValue)}$\n`;
                        message += `${totalProfit >= 0 ? "📈" : "📉"} Lợi nhuận: ${totalProfit >= 0 ? "+" : ""}${formatCurrency(totalProfit)}$\n\n`;

                        if (!historyEmpty) {
                            message += "📝 GIAO DỊCH GẦN ĐÂY\n";
                            message += transactionLines.join("\n");
                        }

                        return api.sendMessage(message, threadID, messageID);
                    }
                }

                case "buy": {
                    const symbol = target[1]?.toUpperCase();
                    const shares = parseInt(target[2]);

                    if (!symbol || !shares) {
                        return api.sendMessage(
                            "❌ Thiếu thông tin! Vui lòng sử dụng:\n.trade buy [mã cổ phiếu] [số lượng]",
                            threadID, messageID
                        );
                    }

                    const result = buyStock(senderID, symbol, shares);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "sell": {
                    const symbol = target[1]?.toUpperCase();
                    const shares = target[2]?.toLowerCase() === "all"
                        ? userData.portfolio[symbol]?.shares || 0
                        : parseInt(target[2]);

                    if (!symbol || !shares) {
                        return api.sendMessage(
                            "❌ Thiếu thông tin! Vui lòng sử dụng:\n.trade sell [mã cổ phiếu] [số lượng/all]",
                            threadID, messageID
                        );
                    }

                    const result = sellStock(senderID, symbol, shares);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "market": {

                    try {
                        const marketData = loadMarketData();
                        const canvasPath = await createMarketOverviewCanvas(marketData);

                        const stockCount = Object.keys(marketData.stocks).length;
                        const upTrending = Object.values(marketData.stocks).filter(s => s.trend === "up").length;
                        const downTrending = Object.values(marketData.stocks).filter(s => s.trend === "down").length;

                        const { isEmpty: noPerformance, performanceData } = get6HourPerformance();

                        let message = `📊 THÔNG TIN THỊ TRƯỜNG 📊\n` +
                            `━━━━━━━━━━━━━━━━━━\n\n` +
                            `📈 Cổ phiếu tăng: ${upTrending}\n` +
                            `📉 Cổ phiếu giảm: ${downTrending}\n` +
                            `📊 Cổ phiếu ổn định: ${stockCount - upTrending - downTrending}\n` +
                            `⏱️ Cập nhật: ${new Date(marketData.lastUpdate).toLocaleString()}`;

                        if (!noPerformance) {
                            message += `\n\n📊 XU HƯỚNG ${performanceData.timespan} GIỜ QUA:\n`;

                            message += "\n📈 TOP TĂNG GIÁ:\n";
                            for (const symbol of performanceData.topGainers) {
                                const data = performanceData.stocks[symbol];
                                message += `${symbol}: ${formatCurrency(data.endPrice)}$ (${data.changePercent.toFixed(2)}%)\n`;
                            }

                            message += "\n📉 TOP GIẢM GIÁ:\n";
                            for (const symbol of performanceData.topLosers) {
                                const data = performanceData.stocks[symbol];
                                message += `${symbol}: ${formatCurrency(data.endPrice)}$ (${data.changePercent.toFixed(2)}%)\n`;
                            }
                        }

                        return api.sendMessage(
                            {
                                body: message,
                                attachment: fs.createReadStream(canvasPath)
                            },
                            threadID,
                            (err) => {
                                if (err) console.error(err);
                                fs.unlinkSync(canvasPath);
                            }
                        );
                    } catch (error) {
                        console.error('Error creating market overview:', error);
                        return api.sendMessage(
                            "❌ Có lỗi xảy ra khi tạo biểu đồ thị trường!",
                            threadID, messageID
                        );
                    }
                }

                case "news": {

                    try {
                        const newsData = loadNewsData();
                        const marketData = loadMarketData();

                        if (!newsData.news || newsData.news.length === 0) {
                            return api.sendMessage("❌ Chưa có tin tức nào!", threadID, messageID);
                        }

                        const canvasPath = await createNewsCanvas(newsData.news, marketData);

                        const { newsLines } = getRecentNews();
                        let message = "📰 TIN TỨC THỊ TRƯỜNG 📰\n━━━━━━━━━━━━━━━━━━\n\n";
                        message += newsLines.join("\n\n");
                        message += "\n\nSử dụng .trade market để xem thông tin thị trường";

                        return api.sendMessage(
                            {
                                body: message,
                                attachment: fs.createReadStream(canvasPath)
                            },
                            threadID,
                            (err) => {
                                if (err) console.error(err);
                                fs.unlinkSync(canvasPath);
                            }
                        );
                    } catch (error) {
                        console.error('Error creating news canvas:', error);

                        const { newsLines, isEmpty } = getRecentNews();
                        let message = "📰 TIN TỨC THỊ TRƯỜNG 📰\n━━━━━━━━━━━━━━━━━━\n\n";

                        if (isEmpty) {
                            message += "❌ Chưa có tin tức nào!";
                        } else {
                            message += newsLines.join("\n\n");
                        }

                        return api.sendMessage(message, threadID, messageID);
                    }
                }
                case "top": {
                    const { traderLines, isEmpty } = getTopTraders();

                    let message = "🏆 BẢNG XẾP HẠNG NHÀ ĐẦU TƯ 🏆\n━━━━━━━━━━━━━━━━━━\n\n";

                    if (isEmpty) {
                        message += "❌ Chưa có nhà đầu tư nào!";
                    } else {
                        message += traderLines.join("\n");
                    }

                    return api.sendMessage(message, threadID, messageID);
                }

                case "history": {
                    const { transactionLines, isEmpty } = formatHistory(senderID, 10);

                    let message = "📝 LỊCH SỬ GIAO DỊCH 📝\n━━━━━━━━━━━━━━━━━━\n\n";

                    if (isEmpty) {
                        message += "❌ Bạn chưa có giao dịch nào!";
                    } else {
                        message += transactionLines.join("\n\n");
                    }

                    return api.sendMessage(message, threadID, messageID);
                }
                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ! Sử dụng .trade help để xem hướng dẫn.",
                        threadID, messageID
                    );
            }
        } catch (error) {
            console.error('[TRADE] Error:', error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi trong quá trình xử lý lệnh!",
                event.threadID, event.messageID
            );
        }
    }
};