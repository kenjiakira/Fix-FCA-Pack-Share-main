const fs = require('fs');
const path = require('path');

class TradingSync {
    constructor() {
        this.tradingDataPath = path.join(__dirname, '../../database/json/trading.json');
        this.exchangeLogsPath = path.join(__dirname, '../../database/exchange_logs.json');
        this.loadData();
    }

    loadData() {
        try {
            this.tradingData = fs.existsSync(this.tradingDataPath) 
                ? JSON.parse(fs.readFileSync(this.tradingDataPath, 'utf8')) 
                : { users: {}, transactions: [] };

            this.exchangeLogs = fs.existsSync(this.exchangeLogsPath)
                ? JSON.parse(fs.readFileSync(this.exchangeLogsPath, 'utf8'))
                : [];
        } catch (error) {
            console.error('Error loading trading data:', error);
            this.tradingData = { users: {}, transactions: [] };
            this.exchangeLogs = [];
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.tradingDataPath, JSON.stringify(this.tradingData, null, 2));
            fs.writeFileSync(this.exchangeLogsPath, JSON.stringify(this.exchangeLogs, null, 2));
        } catch (error) {
            console.error('Error saving trading data:', error);
        }
    }

    linkAccounts(discordId, messengerId) {
        if (!this.tradingData.users[discordId]) {
            this.tradingData.users[discordId] = {
                messengerId,
                portfolio: {},
                orders: [],
                marginPositions: []
            };
        } else {
            this.tradingData.users[discordId].messengerId = messengerId;
        }
        this.saveData();
    }

    getLinkedAccount(id, platform = 'discord') {
        if (platform === 'discord') {
            return Object.entries(this.tradingData.users)
                .find(([discordId, data]) => discordId === id)?.[1]?.messengerId;
        } else {
            return Object.entries(this.tradingData.users)
                .find(([_, data]) => data.messengerId === id)?.[0];
        }
    }

    syncPortfolio(userId, portfolio, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return false;

        this.tradingData.users[targetId].portfolio = portfolio;
        this.saveData();
        return true;
    }

    logTransaction(transaction) {
        const { discordId, messengerId, type, symbol, quantity, price, timestamp } = transaction;
        
        this.tradingData.transactions.push({
            discordId,
            messengerId,
            type,
            symbol,
            quantity,
            price,
            timestamp: timestamp || Date.now()
        });

        // Log to exchange logs for cross-platform tracking
        this.exchangeLogs.push({
            type: 'TRADE',
            discordId,
            messengerId,
            details: {
                action: type,
                symbol,
                quantity,
                price
            },
            timestamp: timestamp || Date.now()
        });

        this.saveData();
    }

    getTransactionHistory(userId, platform = 'discord') {
        const transactions = this.tradingData.transactions;
        
        if (platform === 'discord') {
            return transactions.filter(t => t.discordId === userId);
        } else {
            return transactions.filter(t => t.messengerId === userId);
        }
    }

    syncMarginPositions(userId, positions, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return false;

        this.tradingData.users[targetId].marginPositions = positions;
        this.saveData();
        return true;
    }

    getMarginPositions(userId, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return [];

        return this.tradingData.users[targetId].marginPositions;
    }

    syncOrders(userId, orders, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return false;

        this.tradingData.users[targetId].orders = orders;
        this.saveData();
        return true;
    }

    getOrders(userId, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return [];

        return this.tradingData.users[targetId].orders;
    }

    validateTransaction(transaction) {
        const requiredFields = ['type', 'symbol', 'quantity', 'price'];
        return requiredFields.every(field => transaction.hasOwnProperty(field));
    }

    getPortfolio(userId, platform = 'discord') {
        const targetId = platform === 'discord' ? userId : this.getLinkedAccount(userId, 'messenger');
        if (!targetId || !this.tradingData.users[targetId]) return null;

        return this.tradingData.users[targetId].portfolio;
    }
}

module.exports = new TradingSync();
