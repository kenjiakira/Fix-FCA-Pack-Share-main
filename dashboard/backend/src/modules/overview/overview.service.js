const database = require('../../config/database');
const vipService = require('../../../../../game/vip/vipService');

class OverviewService {
    async getOverview() {
        const users = database.getUsers();
        const threads = database.getThreads();
        const vipData = vipService.loadVipData();
        const currencies = database.getCurrencies();

        const totalUsers = Object.keys(users).length;
        const totalThreads = Object.keys(threads).length;
        const totalVIP = Object.keys(vipData.users || {}).length;

        let totalBalance = 0;
        if (currencies && currencies.balance) {
            totalBalance = Object.values(currencies.balance).reduce((sum, bal) => sum + (bal || 0), 0);
        }

        return {
            totalUsers,
            totalThreads,
            totalVIP,
            totalBalance
        };
    }
}

module.exports = new OverviewService();

