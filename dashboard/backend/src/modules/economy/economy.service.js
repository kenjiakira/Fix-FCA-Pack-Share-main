const database = require('../../config/database');
const { loadQuy } = require('../../../../../utils/currencies');
const { getUserName } = require('../../../../../utils/userUtils');

class EconomyService {
    async getOverview() {
        const currencies = database.getCurrencies();
        const quy = loadQuy();
        const users = database.getUsers();

        let totalBalance = 0;
        const userBalances = [];

        if (currencies && currencies.balance) {
            Object.keys(currencies.balance).forEach(uid => {
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
        }

        userBalances.sort((a, b) => b.balance - a.balance);

        return {
            totalBalance,
            quy: quy || 0,
            topUsers: userBalances.slice(0, 10)
        };
    }
}

module.exports = new EconomyService();

