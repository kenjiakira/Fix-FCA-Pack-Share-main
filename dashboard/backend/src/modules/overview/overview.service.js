const database = require('../../config/database');
const vipService = require('../../../../../game/vip/vipService');
const { loadQuy } = require('../../../../../utils/currencies');
const { getUserName } = require('../../../../../utils/userUtils');
const avatarsService = require('../avatars/avatars.service');
const fs = require('fs');
const path = require('path');

class OverviewService {
    async getOverview() {
        const users = database.getUsers();
        const threads = database.getThreads();
        const vipData = vipService.loadVipData();
        const currencies = database.getCurrencies();
        const quy = loadQuy();

        const totalUsers = Object.keys(users).length;
        const totalThreads = Object.keys(threads).length;
        const totalVIP = Object.keys(vipData.users || {}).length;

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

        // Add avatar URLs to top users
        const topUsersWithAvatars = userBalances.slice(0, 5).map(user => ({
            ...user,
            avatarUrl: avatarsService.getAvatarUrl(user.uid)
        }));

        // Get system info
        const commandsPath = path.join(__dirname, '../../../../commands');
        const eventsPath = path.join(__dirname, '../../../../events');
        const commands = fs.existsSync(commandsPath) 
            ? fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length 
            : 0;
        const events = fs.existsSync(eventsPath)
            ? fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length
            : 0;

        const memUsage = process.memoryUsage();
        const uptime = process.uptime();

        // Get VIP package distribution
        const vipDistribution = {};
        if (vipData.users) {
            Object.values(vipData.users).forEach(vip => {
                const packageId = vip.packageId || 0;
                vipDistribution[packageId] = (vipDistribution[packageId] || 0) + 1;
            });
        }

        return {
            totalUsers,
            totalThreads,
            totalVIP,
            totalBalance,
            quy: quy || 0,
            topUsers: topUsersWithAvatars,
            system: {
                commands,
                events,
                uptime,
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024)
                },
                nodeVersion: process.version,
                platform: process.platform
            },
            vipDistribution
        };
    }
}

module.exports = new OverviewService();

