const database = require('../../config/database');
const { loadQuy } = require('../../../../../utils/currencies');
const { getUserName } = require('../../../../../utils/userUtils');

class EconomyService {
    async getOverview() {
        try {
            const currencies = database.getCurrencies();
            const quy = loadQuy();
            const users = database.getUsers();

            let totalBalance = 0;
            const userBalances = [];

            if (currencies && currencies.balance) {
                const balanceKeys = Object.keys(currencies.balance);
                console.log(`[Economy] Found ${balanceKeys.length} users with balance data`);
                
                balanceKeys.forEach(uid => {
                    const balance = currencies.balance[uid] || 0;
                    totalBalance += balance;
                    if (balance > 0) {
                        userBalances.push({
                            uid,
                            name: users[uid]?.name || getUserName(uid) || 'N/A',
                            balance
                        });
                    }
                });
            } else {
                console.warn('[Economy] No currencies.balance found or currencies is empty');
            }

            userBalances.sort((a, b) => b.balance - a.balance);

            return {
                totalBalance,
                quy: quy || 0,
                topUsers: userBalances.slice(0, 10)
            };
        } catch (error) {
            console.error('[Economy] Error in getOverview:', error);
            throw error;
        }
    }

    async updateBalance(uid, amount, operation = 'set') {
        try {
            if (!uid || uid.trim() === '') {
                throw new Error('UID không được để trống');
            }

            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum < 0) {
                throw new Error('Số tiền không hợp lệ');
            }

            const result = database.updateBalance(uid, amountNum, operation);
            return result;
        } catch (error) {
            console.error('[Economy] Error updating balance:', error);
            throw error;
        }
    }

    async transferBalance(fromUid, toUid, amount) {
        try {
            if (!fromUid || !toUid) {
                throw new Error('UID người gửi và người nhận không được để trống');
            }

            if (fromUid === toUid) {
                throw new Error('Không thể chuyển tiền cho chính mình');
            }

            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                throw new Error('Số tiền phải lớn hơn 0');
            }

            const result = database.transferBalance(fromUid, toUid, amountNum);
            return result;
        } catch (error) {
            console.error('[Economy] Error transferring balance:', error);
            throw error;
        }
    }

    async getUserBalance(uid) {
        try {
            const currencies = database.getCurrencies();
            const balance = currencies.balance?.[uid] || 0;
            return { uid, balance };
        } catch (error) {
            console.error('[Economy] Error getting user balance:', error);
            throw error;
        }
    }

    async updateQuy(amount, operation = 'set') {
        try {
            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum < 0) {
                throw new Error('Số tiền không hợp lệ');
            }

            const result = database.updateQuy(amountNum, operation);
            return result;
        } catch (error) {
            console.error('[Economy] Error updating quy:', error);
            throw error;
        }
    }

    async getQuy() {
        try {
            const quyData = database.getQuy();
            return { quy: quyData.quy || 0 };
        } catch (error) {
            console.error('[Economy] Error getting quy:', error);
            throw error;
        }
    }
}

module.exports = new EconomyService();

