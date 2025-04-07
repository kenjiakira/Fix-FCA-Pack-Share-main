const fs = require('fs');
const path = require('path');
const { VIP_PACKAGES, defaultBenefits, getBenefitsForPackage, GROUP_PACKAGES } = require('./vipConfig');

class VipService {
    constructor() {
        this.vipDataPath = path.join(__dirname, '../../commands/json/vip.json');
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
     * @param {string} packageType - gold only
     * @param {number} months - 1, 3, 6, or 12 months
     * @param {object} voucher - Optional voucher object with discount percentage
     * @returns {object} - Price details
     */
    calculateVipPrice(packageType, months = 1, voucher = null) {
        const packageKey = "GOLD";
        const pkg = VIP_PACKAGES[packageKey];
        
        if (!pkg) {
            return { success: false, message: "Invalid package type" };
        }
        
        // Get base price from sale price (ensuring we get a proper number)
        const basePrice = parseInt(pkg.price.sale.replace(/,/g, ''));
        let finalPrice = basePrice;
        let discount = 0;
        let duration = months;  // Duration in months
        
        // Apply long-term discount if applicable
        if (months > 1 && pkg.longTermOptions && pkg.longTermOptions[months]) {
            const option = pkg.longTermOptions[months];
            discount = option.discount;
            // Calculate discounted price for multi-month subscription
            const totalBasePrice = basePrice * months;
            finalPrice = Math.floor(totalBasePrice * (100 - discount) / 100);
        } else if (months > 1) {
            // If no specific discount for this duration, just multiply by months
            finalPrice = basePrice * months;
        }
        
        // Apply voucher discount if available
        if (voucher && voucher.discount) {
            const voucherDiscount = voucher.discount;
            const voucherDiscountAmount = Math.floor(finalPrice * voucherDiscount / 100);
            finalPrice -= voucherDiscountAmount;
        }
        
        return {
            success: true,
            originalPrice: basePrice,
            finalPrice: Math.floor(finalPrice), // Ensure it's a whole number
            totalDiscount: discount,
            months: months,
            daysToAdd: months * 30 + months * 7, // Gold gets bonus days
            packageInfo: pkg
        };
    }

    /**
     * Calculate the price for a group VIP package
     * @param {string} packageType - bronze, silver, or gold
     * @param {number} members - Number of members in the group
     * @param {number} months - 1, 3, 6, or 12 months
     * @returns {object} - Price details
     */
    calculateGroupVipPrice(packageType, members, months = 1) {
        if (members < 3) {
            return { success: false, message: "Cần ít nhất 3 thành viên để mua gói nhóm" };
        }

        const packageKey = packageType.toUpperCase();
        const pkg = VIP_PACKAGES[packageKey];
        const groupPkg = GROUP_PACKAGES[packageKey];
        
        if (!pkg || !groupPkg) {
            return { success: false, message: "Gói VIP không hợp lệ" };
        }
        
        // Base individual price calculation
        const individualPrice = this.calculateVipPrice(packageType, months);
        if (!individualPrice.success) {
            return individualPrice;
        }
        
        // Apply group discount
        const discountRate = groupPkg.discount / 100;
        const discountedIndividualPrice = Math.floor(individualPrice.finalPrice * (1 - discountRate));
        const totalGroupPrice = discountedIndividualPrice * members;
        
        return {
            success: true,
            packageType: packageType,
            members: members,
            months: months,
            individualRegularPrice: individualPrice.finalPrice,
            individualDiscountedPrice: discountedIndividualPrice,
            totalGroupPrice: totalGroupPrice,
            discount: groupPkg.discount,
            savedPerPerson: individualPrice.finalPrice - discountedIndividualPrice,
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
            
            // Calculate days based on months and add bonus days for Gold package
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
     * @param {string} packageType - Package type (gold only)
     * @param {number} months - Number of months (1, 3, 6, 12)
     * @param {string} voucherCode - Optional voucher code
     * @param {number} paidAmount - Amount paid by user
     * @returns {object} - Result of the operation
     */
    processVipPurchase(userId, packageType, months = 1, voucherCode = null, paidAmount) {
        try {
            let voucher = null;
            
            // Validate voucher if provided
            if (voucherCode) {
                voucher = this.validateVoucher(userId, voucherCode);
                if (!voucher.success) {
                    return { success: false, message: voucher.message };
                }
                voucher = voucher.data;
            }
            
            // Only Gold package is available
            const packageId = 3; // Gold
            
            // Calculate expected price
            const priceInfo = this.calculateVipPrice("gold", months, voucher);
            
            // Verify payment amount with some tolerance (e.g., 1000 VND)
            const tolerance = 1000;
            if (Math.abs(priceInfo.finalPrice - paidAmount) > tolerance) {
                return { 
                    success: false, 
                    message: "Payment amount doesn't match expected price",
                    expected: priceInfo.finalPrice,
                    received: paidAmount
                };
            }
            
            // Set VIP status
            const result = this.setVIP(userId, packageId, months, voucher);
            
            // If successful and voucher was used, mark it as used
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

    /**
     * Process a Family Pack purchase (now only Gold)
     * @param {string} userId - User ID who gets Gold
     * @param {number} months - Number of months
     * @param {string} voucherCode - Optional voucher code
     * @param {number} paidAmount - Amount paid
     * @returns {object} - Result of the operation
     */
    processFamilyPackPurchase(userId, months = 1, voucherCode = null, paidAmount) {
        try {
            let voucher = null;
            
            // Validate voucher if provided
            if (voucherCode) {
                voucher = this.validateVoucher(userId, voucherCode);
                if (!voucher.success) {
                    return { success: false, message: voucher.message };
                }
                voucher = voucher.data;
            }
            
            // Calculate Gold package price
            const goldPriceInfo = this.calculateVipPrice('gold', months, voucher);
            
            // Verify payment amount
            const tolerance = 1000;
            if (Math.abs(goldPriceInfo.finalPrice - paidAmount) > tolerance) {
                return { 
                    success: false, 
                    message: "Số tiền thanh toán không khớp với giá dự kiến",
                    expected: goldPriceInfo.finalPrice,
                    received: paidAmount
                };
            }
            
            // Set VIP Gold for main user
            const result = this.setVIP(userId, 3, months, voucher);
            
            // If voucher was used, mark it
            if (voucher && result.success) {
                this.markVoucherAsUsed(userId, voucherCode);
            }
            
            return {
                success: result.success,
                message: result.success ? "Gói VIP Gold đã được kích hoạt thành công" : result.message,
                result
            };
        } catch (error) {
            console.error('Error processing VIP Gold purchase:', error);
            return { success: false, message: "Lỗi hệ thống" };
        }
    }

    /**
     * Process a group package purchase
     * @param {Array} userIds - Array of user IDs to receive VIP
     * @param {string} packageType - Package type (bronze, silver, gold)
     * @param {number} months - Number of months
     * @param {string} voucherCode - Optional voucher code
     * @param {number} paidAmount - Amount paid
     * @returns {object} - Result of the operation
     */
    processGroupVipPurchase(userIds, packageType, months = 1, voucherCode = null, paidAmount) {
        try {
            if (!Array.isArray(userIds) || userIds.length < 3) {
                return { success: false, message: "Cần ít nhất 3 thành viên để mua gói nhóm" };
            }
            
            // Map package type to package ID
            const packageMap = { 'bronze': 1, 'silver': 2, 'gold': 3 };
            const packageId = packageMap[packageType.toLowerCase()];
            
            if (!packageId) {
                return { success: false, message: "Loại gói không hợp lệ" };
            }
            
            // Calculate price for the group
            const priceInfo = this.calculateGroupVipPrice(packageType, userIds.length, months);
            
            // Verify payment amount
            const tolerance = 1000;
            if (Math.abs(priceInfo.totalGroupPrice - paidAmount) > tolerance) {
                return { 
                    success: false, 
                    message: "Số tiền thanh toán không khớp với giá dự kiến",
                    expected: priceInfo.totalGroupPrice,
                    received: paidAmount
                };
            }
            
            // Set VIP for all users in the group
            const results = userIds.map(userId => {
                return this.setVIP(userId, packageId, months);
            });
            
            const allSuccess = results.every(result => result.success);
            
            return {
                success: allSuccess,
                message: allSuccess ? "Gói VIP nhóm đã được kích hoạt thành công" : "Có lỗi khi kích hoạt VIP cho một số thành viên",
                results
            };
        } catch (error) {
            console.error('Error processing Group VIP purchase:', error);
            return { success: false, message: "Lỗi hệ thống" };
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
}

const vipService = new VipService();
module.exports = vipService;
