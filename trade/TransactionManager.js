const EventEmitter = require('events');

class TransactionManager extends EventEmitter {
    constructor() {
        super();
        this.pendingTransactions = new Map();
        this.TIMEOUT = 30000; 
    }

    async startTransaction(userId, transactionData) {
        const transactionId = `${userId}-${Date.now()}`;
        
        const transaction = {
            id: transactionId,
            userId,
            status: 'pending',
            data: transactionData,
            startTime: Date.now(),
            steps: [],
            rollbackSteps: []
        };

        this.pendingTransactions.set(transactionId, transaction);
        
        setTimeout(() => {
            this.handleTimeout(transactionId);
        }, this.TIMEOUT);

        return transactionId;
    }

    async addStep(transactionId, stepFunction, rollbackFunction) {
        const transaction = this.pendingTransactions.get(transactionId);
        if (!transaction) throw new Error('Transaction not found');

        transaction.steps.push(stepFunction);
        transaction.rollbackSteps.push(rollbackFunction);
    }

    async executeTransaction(transactionId) {
        const transaction = this.pendingTransactions.get(transactionId);
        if (!transaction) throw new Error('Transaction not found');

        try {
            await this.verifyTransaction(transaction);

            for (let i = 0; i < transaction.steps.length; i++) {
                const step = transaction.steps[i];
                await step(transaction.data);
                
                this.emit('stepCompleted', {
                    transactionId,
                    step: i + 1,
                    totalSteps: transaction.steps.length,
                    status: 'completed'
                });
            }

            transaction.status = 'completed';
            this.emit('transactionCompleted', {
                transactionId,
                userId: transaction.userId,
                data: transaction.data
            });

            return true;

        } catch (error) {
            console.error(`Transaction ${transactionId} failed:`, error);
            
            await this.rollbackTransaction(transaction);
            
            throw error;
        } finally {
       
            this.pendingTransactions.delete(transactionId);
        }
    }

    async verifyTransaction(transaction) {
        const { type, symbol, quantity, totalWithFees } = transaction.data;

        if (!this.isMarketOpen()) {
            throw new Error('Thị trường đã đóng');
        }

        if (type === 'buy') {
            const balance = await this.getUserBalance(transaction.userId);
            if (balance < totalWithFees) {
                throw new Error('Số dư không đủ');
            }
        }

        if (type === 'sell') {
            const portfolio = await this.getUserPortfolio(transaction.userId);
            if (!portfolio.stocks[symbol] || portfolio.stocks[symbol].quantity < quantity) {
                throw new Error('Không đủ số lượng CP để bán');
            }
        }
    }

    async handleTimeout(transactionId) {
        const transaction = this.pendingTransactions.get(transactionId);
        if (!transaction || transaction.status === 'completed') return;

        console.log(`Transaction ${transactionId} timed out`);

        await this.rollbackTransaction(transaction);

        this.emit('transactionTimeout', {
            transactionId,
            userId: transaction.userId,
            data: transaction.data
        });

        this.pendingTransactions.delete(transactionId);
    }

    async rollbackTransaction(transaction) {
        console.log(`Rolling back transaction ${transaction.id}`);

        for (let i = transaction.rollbackSteps.length - 1; i >= 0; i--) {
            try {
                const rollbackStep = transaction.rollbackSteps[i];
                await rollbackStep(transaction.data);
                
                this.emit('rollbackStep', {
                    transactionId: transaction.id,
                    step: transaction.rollbackSteps.length - i,
                    totalSteps: transaction.rollbackSteps.length,
                    status: 'completed'
                });
            } catch (error) {
                console.error(`Error in rollback step ${i}:`, error);
           
            }
        }

        transaction.status = 'rolled_back';
        this.emit('transactionRolledBack', {
            transactionId: transaction.id,
            userId: transaction.userId,
            data: transaction.data
        });
    }

    isMarketOpen() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 9 && hour < 18;
    }

    async getUserBalance(userId) {
        const { getBalance } = require('../utils/currencies');
        return getBalance(userId);
    }

    async getUserPortfolio(userId) {
        const TradeSystem = require('./TradeSystem');
        const tradeSystem = new TradeSystem();
        return tradeSystem.getUserPortfolio(userId);
    }

    getTransactionStatus(transactionId) {
        const transaction = this.pendingTransactions.get(transactionId);
        if (!transaction) return null;
        
        return {
            id: transaction.id,
            status: transaction.status,
            startTime: transaction.startTime,
            elapsedTime: Date.now() - transaction.startTime
        };
    }
}

module.exports = TransactionManager;
