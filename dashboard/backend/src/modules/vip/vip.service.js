const database = require('../../config/database');
const vipService = require('../../../../../game/vip/vipService');
const { getUserName } = require('../../../../../utils/userUtils');

class VipService {
    async findAll() {
        const vipData = vipService.loadVipData();
        const users = database.getUsers();

        const vipUsers = Object.keys(vipData.users || {}).map(userId => {
            const vip = vipData.users[userId];
            const user = users[userId];

            let packageName = vip.name;
            if (!packageName) {
                const { VIP_PACKAGES } = require('../../../../../game/vip/vipConfig');
                const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === (vip.packageId || 3));
                packageName = packageInfo?.name || 'VIP Gold';
            }

            return {
                userId,
                name: user?.name || getUserName(userId) || 'N/A',
                packageName: packageName,
                packageId: vip.packageId || 3,
                expireTime: vip.expireTime
            };
        });

        return vipUsers;
    }

    async create(userId, packageId, days) {
        if (!userId || !packageId || !days) {
            throw new Error('Missing required fields: userId, packageId, days');
        }

        const vipData = vipService.loadVipData();
        if (!vipData.users) vipData.users = {};

        const { VIP_PACKAGES } = require('../../../../../game/vip/vipConfig');
        const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId);
        
        if (!packageInfo) {
            throw new Error('Invalid package ID');
        }

        const { getBenefitsForPackage } = require('../../../../../game/vip/vipConfig');
        const benefits = getBenefitsForPackage(packageId);
        
        const expireTime = Date.now() + (days * 24 * 60 * 60 * 1000);
        
        vipData.users[userId] = {
            packageId: packageId,
            name: packageInfo.name,
            expireTime: expireTime,
            benefits: benefits,
            purchaseInfo: {
                purchaseDate: Date.now(),
                days: days,
                addedViaCMS: true
            }
        };

        if (vipService.saveVipData(vipData)) {
            return { 
                success: true, 
                message: "VIP set successfully",
                expireTime: expireTime,
                packageName: packageInfo.name,
                daysAdded: days
            };
        } else {
            throw new Error('Error saving VIP data');
        }
    }

    async remove(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const vipData = vipService.loadVipData();
        if (!vipData.users || !vipData.users[userId]) {
            throw new Error('VIP not found');
        }

        delete vipData.users[userId];
        vipService.saveVipData(vipData);

        return { success: true, message: 'VIP removed successfully' };
    }
}

module.exports = new VipService();

