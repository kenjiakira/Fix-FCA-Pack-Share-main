const database = require('../../config/database');
const { getBalance } = require('../../../../../utils/currencies');
const { getUserName } = require('../../../../../utils/userUtils');
const vipService = require('../../../../../game/vip/vipService');

class UsersService {
    async findAll(pagination) {
        const users = database.getUsers();
        const currencies = database.getCurrencies();
        const vipData = vipService.loadVipData();

        const userList = Object.keys(users).map(uid => {
            const user = users[uid];
            const balance = currencies?.balance?.[uid] || 0;
            const vip = vipData.users?.[uid];

            return {
                uid,
                name: user.name || getUserName(uid) || 'N/A',
                gender: user.gender || 'N/A',
                balance,
                vip: vip ? {
                    name: vip.name,
                    packageId: vip.packageId,
                    expireTime: vip.expireTime
                } : null
            };
        });

        const total = userList.length;
        const paginatedData = userList.slice(pagination.skip, pagination.skip + pagination.limit);

        return pagination.toResponse(total, paginatedData);
    }

    async findOne(uid) {
        const users = database.getUsers();
        const currencies = database.getCurrencies();
        const vipData = vipService.loadVipData();

        const user = users[uid];
        if (!user) {
            throw new Error('User not found');
        }

        return {
            uid,
            name: user.name || getUserName(uid) || 'N/A',
            gender: user.gender || 'N/A',
            balance: currencies?.balance?.[uid] || 0,
            vip: vipData.users?.[uid] || null
        };
    }

    async updateBalance(uid, amount) {
        const { updateBalance } = require('../../../../../utils/currencies');
        updateBalance(uid, amount);
        return this.findOne(uid);
    }
}

module.exports = new UsersService();

