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

    /**
     * Calculate the price for a VIP package based on package type, duration, and voucher
     * @param {string} packageType - bronze, silver, or gold
     * @param {number} months - 1, 3, 6, or 12 months
     * @param {object} voucher - Optional voucher object with discount percentage
     * @returns {object} - Price details
     */
    calculateVipPrice(packageType, months = 1, voucher = null) {
        const packageKey = packageType.toUpperCase();
        const pkg = VIP_PACKAGES[packageKey];
        
        if (!pkg) {
            return { success: false, message: "Invalid package type" };
        }
        
        const basePrice = parseInt(pkg.price.sale.replace(/,/g, ''));
        let finalPrice = basePrice;
        let discount = 0;
        let duration = months; 
        if (months > 1 && pkg.longTermOptions && pkg.longTermOptions[months]) {
            const option = pkg.longTermOptions[months];
            discount = option.discount;
            const totalBasePrice = basePrice * months;
            finalPrice = Math.floor(totalBasePrice * (100 - discount) / 100);
        } else if (months > 1) {
            finalPrice = basePrice * months;
        }
        
        if (voucher && voucher.discount) {
            const voucherDiscount = voucher.discount;
            const voucherDiscountAmount = Math.floor(finalPrice * voucherDiscount / 100);
            finalPrice -= voucherDiscountAmount;
        }
        
        return {
            success: true,
            originalPrice: basePrice,
            finalPrice: Math.floor(finalPrice), 
            totalDiscount: discount,
            months: months,
            daysToAdd: months * 30 + (packageKey === 'GOLD' ? months * 7 : 0),
            packageInfo: pkg
        };
    }

    /**
     * Set VIP status for a user with support for multi-month subscriptions
     * @param {string} userId - User ID
     * @param {number} packageId - Package ID
     * @param {number} months - Number of months (1, 3, 6, 12)
     * @param {object} voucher - Optional voucher object
     * @returns {object} - Result of the operation
     */
    setVIP(userId, packageId, months = 1, voucher = null) {
        try {
            const vipData = this.loadVipData();
            if (!vipData.users) vipData.users = {};

            const benefits = getBenefitsForPackage(packageId);
            const packageInfo = Object.values(VIP_PACKAGES).find(pkg => pkg.id === packageId);
            
            if (!packageInfo) {
                return { success: false, message: "Invalid VIP package ID" };
            }
            
            const daysToAdd = months * 30 + (packageId === 3 ? months * 7 : 0);
            
            vipData.users[userId] = {
                packageId,
                name: packageInfo.name,
                expireTime: Date.now() + (daysToAdd * 24 * 60 * 60 * 1000),
                benefits,
                purchaseInfo: {
                    purchaseDate: Date.now(),
                    months: months,
                    voucherApplied: voucher ? voucher.code : null
                }
            };

            if (this.saveVipData(vipData)) {
                return { 
                    success: true, 
                    message: "VIP set successfully",
                    expireTime: vipData.users[userId].expireTime,
                    packageName: packageInfo.name,
                    daysAdded: daysToAdd
                };
            } else {
                return { success: false, message: "Error saving VIP data" };
            }
        } catch (error) {
            console.error('Error setting VIP:', error);
            return { success: false, message: "Internal error" };
        }
    }

    /**
     * Process a VIP purchase from QR payment
     * @param {string} userId - User ID
     * @param {string} packageType - Package type (bronze, silver, gold)
     * @param {number} months - Number of months (1, 3, 6, 12)
     * @param {string} voucherCode - Optional voucher code
     * @param {number} paidAmount - Amount paid by user
     * @returns {object} - Result of the operation
     */
    processVipPurchase(userId, packageType, months = 1, voucherCode = null, paidAmount) {
        try {
            let voucher = null;
            
            if (voucherCode) {
                voucher = this.validateVoucher(userId, voucherCode);
                if (!voucher.success) {
                    return { success: false, message: voucher.message };
                }
                voucher = voucher.data;
            }
            
            const packageMap = { 'bronze': 1, 'silver': 2, 'gold': 3 };
            const packageId = packageMap[packageType.toLowerCase()];
            
            if (!packageId) {
                return { success: false, message: "Invalid package type" };
            }
            
            const priceInfo = this.calculateVipPrice(packageType, months, voucher);
            
            const tolerance = 1000;
            if (Math.abs(priceInfo.finalPrice - paidAmount) > tolerance) {
                return { 
                    success: false, 
                    message: "Payment amount doesn't match expected price",
                    expected: priceInfo.finalPrice,
                    received: paidAmount
                };
            }
            
            const result = this.setVIP(userId, packageId, months, voucher);
            
            if (result.success && voucher) {
                this.markVoucherAsUsed(userId, voucherCode);
            }
            
            return result;
        } catch (error) {
            console.error('Error processing VIP purchase:', error);
            return { success: false, message: "Internal error" };
        }
    }
    
    validateVoucher(userId, voucherCode) {
        try {
            const voucherPath = path.join(__dirname, '../commands/json/voucher.json');
            
            if (!fs.existsSync(voucherPath)) {
                return { success: false, message: "Voucher system not available" };
            }
            
            const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
            if (!voucherData.users || !voucherData.users[userId]) {
                return { success: false, message: "No vouchers available for this user" };
            }
            
            const userVouchers = voucherData.users[userId];
            const voucher = userVouchers.find(v => v.code === voucherCode);
            
            if (!voucher) {
                return { success: false, message: "Voucher not found" };
            }
            
            if (voucher.used) {
                return { success: false, message: "Voucher already used" };
            }
            
            if (voucher.expires < Date.now()) {
                return { success: false, message: "Voucher expired" };
            }
            
            return { success: true, data: voucher };
        } catch (error) {
            console.error('Error validating voucher:', error);
            return { success: false, message: "Error validating voucher" };
        }
    }
    
    markVoucherAsUsed(userId, voucherCode) {
        try {
            const voucherPath = path.join(__dirname, '../commands/json/voucher.json');
            const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
            
            if (!voucherData.users || !voucherData.users[userId]) return false;
            
            const userVouchers = voucherData.users[userId];
            const voucherIndex = userVouchers.findIndex(v => v.code === voucherCode);
            
            if (voucherIndex === -1) return false;
            
            userVouchers[voucherIndex].used = true;
            fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));
            return true;
        } catch (error) {
            console.error('Error marking voucher as used:', error);
            return false;
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
            let removedCount = 0;

            for (const [userId, userData] of Object.entries(vipData.users)) {
                if (userData.expireTime < currentTime) {
                    delete vipData.users[userId];
                    changed = true;
                    removedCount++;
                    console.log(`VIP expired for user ${userId}`);
                }
            }

            if (changed) {
                this.saveVipData(vipData);
            }
            
            return { success: true, removedCount };
        } catch (error) {
            console.error('Error checking VIP expiration:', error);
            return { success: false, message: "Error during VIP expiration check" };
        }
    }

    async checkDownloadAccess(senderID, threadID, api) {
        try {
            const senderVIP = this.getVIPBenefits(senderID);
            
            const threadInfo = await api.getThreadInfo(threadID);
            
            if (threadInfo.isGroup) {
                const adminID = threadInfo.adminIDs[0]; 
                const adminVIP = this.getVIPBenefits(adminID);
                
                return {
                    hasAccess: senderVIP.packageId === 3 && adminVIP.packageId === 3,
                    message: !senderVIP.packageId === 3 ? 
                        "⚠️ Bạn cần có VIP GOLD để tải nội dung này" :
                        "⚠️ Chỉ được phép tải trong nhóm có quản trị viên VIP GOLD"
                };
            } else {
                return {
                    hasAccess: senderVIP.packageId === 3,
                    message: "⚠️ Bạn cần có VIP GOLD để tải nội dung này"
                };
            }
        } catch (error) {
            console.error('Error checking download access:', error);
            return {
                hasAccess: false,
                message: "❌ Lỗi kiểm tra quyền truy cập"
            };
        }
    }
}

const vipService = new VipService();
module.exports = vipService;
