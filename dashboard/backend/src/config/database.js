const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.basePath = path.join(__dirname, '../../../..');
    }

    loadJSONFile(filePath, defaultValue = {}) {
        try {
            const fullPath = path.join(this.basePath, filePath);
            if (fs.existsSync(fullPath)) {
                return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            }
            return defaultValue;
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            return defaultValue;
        }
    }

    saveJSONFile(filePath, data) {
        try {
            const fullPath = path.join(this.basePath, filePath);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving ${filePath}:`, error);
            throw error;
        }
    }

    getUsers() {
        return this.loadJSONFile('database/users.json', {});
    }

    getThreads() {
        return this.loadJSONFile('database/threads.json', {});
    }

    getCurrencies() {
        return this.loadJSONFile('database/currencies.json', { balance: {} });
    }

    saveCurrencies(data) {
        try {
            this.saveJSONFile('database/currencies.json', data);
            this.saveJSONFile('database/currencies.json.backup', data);
            console.log('[Database] Saved currencies.json and currencies.json.backup');
            return true;
        } catch (error) {
            console.error('[Database] Error saving currencies:', error);
            throw error;
        }
    }

    updateBalance(uid, amount, operation = 'set') {
        try {
            const currencies = this.getCurrencies();
            if (!currencies.balance) {
                currencies.balance = {};
            }

            const currentBalance = currencies.balance[uid] || 0;
            let newBalance;

            switch (operation) {
                case 'set':
                    newBalance = amount;
                    break;
                case 'add':
                    newBalance = currentBalance + amount;
                    break;
                case 'subtract':
                    newBalance = Math.max(0, currentBalance - amount);
                    break;
                default:
                    newBalance = amount;
            }

            currencies.balance[uid] = newBalance;
            this.saveCurrencies(currencies);
            
            return { success: true, oldBalance: currentBalance, newBalance };
        } catch (error) {
            console.error('[Database] Error updating balance:', error);
            throw error;
        }
    }

    transferBalance(fromUid, toUid, amount) {
        try {
            const currencies = this.getCurrencies();
            if (!currencies.balance) {
                currencies.balance = {};
            }

            const fromBalance = currencies.balance[fromUid] || 0;
            const toBalance = currencies.balance[toUid] || 0;

            if (fromBalance < amount) {
                return { success: false, message: 'Số dư không đủ' };
            }

            currencies.balance[fromUid] = fromBalance - amount;
            currencies.balance[toUid] = toBalance + amount;
            this.saveCurrencies(currencies);

            return { 
                success: true, 
                fromBalance: currencies.balance[fromUid],
                toBalance: currencies.balance[toUid]
            };
        } catch (error) {
            console.error('[Database] Error transferring balance:', error);
            throw error;
        }
    }

    getQuy() {
        return this.loadJSONFile('database/json/quy.json', { quy: 0 });
    }

    saveQuy(quy) {
        try {
            const data = { quy: Number(quy) || 0 };
            this.saveJSONFile('database/json/quy.json', data);
            this.saveJSONFile('database/json/quy.json.backup', data);
            console.log('[Database] Saved quy.json and quy.json.backup');
            return true;
        } catch (error) {
            console.error('[Database] Error saving quy:', error);
            throw error;
        }
    }

    updateQuy(amount, operation = 'set') {
        try {
            const quyData = this.getQuy();
            const currentQuy = quyData.quy || 0;
            let newQuy;

            switch (operation) {
                case 'set':
                    newQuy = amount;
                    break;
                case 'add':
                    newQuy = currentQuy + amount;
                    break;
                case 'subtract':
                    newQuy = Math.max(0, currentQuy - amount);
                    break;
                default:
                    newQuy = amount;
            }

            this.saveQuy(newQuy);
            return { success: true, oldQuy: currentQuy, newQuy };
        } catch (error) {
            console.error('[Database] Error updating quy:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();

