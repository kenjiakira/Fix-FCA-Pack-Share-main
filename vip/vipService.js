const fs = require('fs');
const path = require('path');
const { VIP_PACKAGES, defaultBenefits, getBenefitsForPackage } = require('./vipConfig');

class VipService {
    constructor() {
        this.vipDataPath = path.join(__dirname, '../commands/json/vip.json');
        this.cache = null;
        this.lastCacheTime = 0;
        this.cacheLifespan = 5 * 60 * 1000;
        this.initialized = false;
        this.init();
    }

    init() {
        try {
            if (!fs.existsSync(this.vipDataPath)) {
                const defaultData = { users: {} };
                fs.writeFileSync(this.vipDataPath, JSON.stringify(defaultData, null, 2));
            }
            this.initialized = true;
      
            setInterval(() => this.checkAndRemoveExpiredVIP(), 60 * 60 * 1000);
        } catch (error) {
            console.error('Error initializing VIP service:', error);
        }
    }

    loadVipData(forceRefresh = false) {
        const now = Date.now();
        if (this.cache && !forceRefresh && (now - this.lastCacheTime < this.cacheLifespan)) {
            return this.cache;
        }

        try {
            const data = JSON.parse(fs.readFileSync(this.vipDataPath, 'utf8'));
            this.cache = data;
            this.lastCacheTime = now;
            return data;
        } catch (error) {
            console.error('Error loading VIP data:', error);
            return { users: {} };
        }
    }

    saveVipData(data) {
        try {
            fs.writeFileSync(this.vipDataPath, JSON.stringify(data, null, 2));
            this.cache = data;
            this.lastCacheTime = Date.now();
            return true;
        } catch (error) {
            console.error('Error saving VIP data:', error);
            return false;
        }
    }

    getVIPBenefits(userId) {
        try {
            const vipData = this.loadVipData();
            if (vipData.users && vipData.users[userId]) {
                const userData = vipData.users[userId];
                if (userData.expireTime > Date.now()) {
                    const packageBenefits = this.getFullPackageBenefits(userData.packageId);
                
                    return {
                        ...defaultBenefits,
                        ...packageBenefits,  
                        ...userData.benefits, 
                        packageId: userData.packageId,
                        name: userData.name
                    };
                }
                this.removeVIP(userId);
            }
            return defaultBenefits;
        } catch (error) {
            console.error('Error getting VIP benefits:', error);
            return defaultBenefits;
        }
    }

    getFullPackageBenefits(packageId) {
        const { VIP_PACKAGES } = require('./vipConfig');
        const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId);
        
        if (!packageInfo) return defaultBenefits;
        
        if (packageId === 3 && packageInfo.benefits) {
            return {
                ...packageInfo.benefits,
                stolenProtection: 1.0,
            };
        }
        
        return packageInfo.benefits || defaultBenefits;
    }

    setVIP(userId, packageId, days) {
        try {
            const vipData = this.loadVipData();
            if (!vipData.users) vipData.users = {};

            const benefits = getBenefitsForPackage(packageId);
            const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId);
            
            if (!packageInfo) {
                return { success: false, message: "Invalid VIP package ID" };
            }

            vipData.users[userId] = {
                packageId,
                name: packageInfo.name,
                expireTime: Date.now() + (days * 24 * 60 * 60 * 1000),
                benefits
            };

            if (this.saveVipData(vipData)) {
                return { 
                    success: true, 
                    message: "VIP set successfully",
                    expireTime: vipData.users[userId].expireTime,
                    packageName: packageInfo.name
                };
            } else {
                return { success: false, message: "Error saving VIP data" };
            }
        } catch (error) {
            console.error('Error setting VIP:', error);
            return { success: false, message: "Internal error" };
        }
    }

    checkVIP(userId) {
        try {
            const vipData = this.loadVipData();
            if (!vipData.users || !vipData.users[userId]) {
                return { success: false, message: "User does not have VIP" };
            }

            const userData = vipData.users[userId];
            if (userData.expireTime < Date.now()) {
                this.removeVIP(userId);
                return { success: false, message: "VIP has expired and been removed" };
            }

            const daysLeft = Math.ceil((userData.expireTime - Date.now()) / (24 * 60 * 60 * 1000));
            const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === userData.packageId);

            return {
                success: true,
                packageId: userData.packageId,
                packageName: userData.name,
                expireTime: userData.expireTime,
                daysLeft,
                packageInfo
            };
        } catch (error) {
            console.error('Error checking VIP:', error);
            return { success: false, message: "Error checking VIP status" };
        }
    }

    removeVIP(userId) {
        try {
            const vipData = this.loadVipData();
            if (!vipData.users || !vipData.users[userId]) {
                return { success: false, message: "User does not have VIP" };
            }

            delete vipData.users[userId];
            
            if (this.saveVipData(vipData)) {
                return { success: true, message: "VIP removed successfully" };
            } else {
                return { success: false, message: "Error saving VIP data" };
            }
        } catch (error) {
            console.error('Error removing VIP:', error);
            return { success: false, message: "Internal error" };
        }
    }

    checkAndRemoveExpiredVIP() {
        try {
            const vipData = this.loadVipData(true); 
            const currentTime = Date.now();
            let changed = false;

            for (const [userId, userData] of Object.entries(vipData.users)) {
                if (userData.expireTime < currentTime) {
                    delete vipData.users[userId];
                    changed = true;
                    console.log(`VIP expired for user ${userId}`);
                }
            }

            if (changed) {
                this.saveVipData(vipData);
            }
            
            return { success: true, removedCount: changed ? 1 : 0 };
        } catch (error) {
            console.error('Error checking VIP expiration:', error);
            return { success: false, message: "Error during VIP expiration check" };
        }
    }
}

const vipService = new VipService();
module.exports = vipService;
