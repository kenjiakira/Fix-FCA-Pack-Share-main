const fs = require('fs');
const path = require('path');
const vipService = require('../game/vip/vipService');
const qrHelper = require('../game/vip/qrHelper');
const { VIP_PACKAGES } = require('../game/vip/vipConfig');

function getUserNameFromRankData(uid) {
    try {
        const rankDataPath = path.join(__dirname, '..', 'events', 'cache', 'rankData.json');
        if (fs.existsSync(rankDataPath)) {
            const rankData = JSON.parse(fs.readFileSync(rankDataPath, 'utf8'));
            if (rankData[uid] && rankData[uid].name) {
                return rankData[uid].name;
            }
        }
        return `Người dùng ${uid}`;
    } catch (error) {
        console.error("Error reading rankData.json:", error);
        return `Người dùng ${uid}`;
    }
}
// Cấu hình tài khoản ngân hàng
const BANK_CONFIG = {
    bankName: 'Vietinbank', // Tên viết tắt của ngân hàng theo chuẩn VietQR
    bankNumber: '109876048569', // Số tài khoản ngân hàng
    accountName: 'HOANG NGOC TU' // Tên chủ tài khoản
};

module.exports = {
    name: "qr",
    dev: "HNT",
    category: "VIP & Billing",
    info: "Tạo mã QR thanh toán VIP",
    usages: [
        ".qr vip gold - Tạo QR thanh toán VIP 1 tháng",
    ].join('\n'),
    cooldowns: 15,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0] || target[0].toLowerCase() !== "vip") {
            return api.sendMessage(this.usages, threadID, messageID);
        }

        const packageType = target[1]?.toLowerCase();

        try {   
            if (packageType === "group") {
                const groupPackageType = target[2]?.toLowerCase();
                if (!groupPackageType || !["bronze", "silver", "gold"].includes(groupPackageType)) {
                    return api.sendMessage("❌ Loại gói không hợp lệ. Vui lòng chọn bronze, silver hoặc gold", threadID);
                }

                const memberCount = parseInt(target[3]);
                if (isNaN(memberCount) || memberCount < 3) {
                    return api.sendMessage("❌ Cần ít nhất 3 thành viên cho gói nhóm. Vui lòng nhập số người hợp lệ.", threadID);
                }

                const months = target[4] ? parseInt(target[4]) : 1;
                if (![1, 3, 6, 12].includes(months)) {
                    return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
                }

                // Calculate group price
                const priceInfo = vipService.calculateGroupVipPrice(groupPackageType, memberCount, months);
                if (!priceInfo.success) {
                    return api.sendMessage(`❌ ${priceInfo.message}`, threadID);
                }

                const pkg = VIP_PACKAGES[groupPackageType.toUpperCase()];
                const amountToPay = priceInfo.totalGroupPrice;
                const paymentCode = `GROUP_${groupPackageType.toUpperCase()}${months > 1 ? months : ''}_${senderID}_${memberCount}`;

                // Tạo mã QR với thiết kế đẹp - sử dụng API VietQR trực tiếp
                const qrPath = await qrHelper.generateQR({
                    bankName: BANK_CONFIG.bankName,
                    bankNumber: BANK_CONFIG.bankNumber,
                    accountName: BANK_CONFIG.accountName,
                    amount: amountToPay,
                    content: paymentCode,
                    packageName: pkg.name,
                    packageIcon: pkg.icon,
                    isGroup: true
                });

                if (!qrPath) {
                    return api.sendMessage("❌ Có lỗi khi tạo mã QR. Vui lòng thử lại sau.", threadID);
                }

                // Gửi thông tin gói nhóm
                const messageText = `${pkg.icon} THANH TOÁN GÓI NHÓM ${pkg.name} ${pkg.stars}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `👥 Số thành viên: ${memberCount} người\n` +
                    `⏳ Thời hạn: ${months > 1 ? pkg.longTermOptions[months].duration : pkg.duration}\n` +
                    `💰 Giảm giá: ${priceInfo.discount}%/người\n` +
                    `💵 Tổng chi phí: ${amountToPay.toLocaleString('vi-VN')}đ\n\n` +
                    `📝 NỘI DUNG THANH TOÁN:\n` +
                    `${paymentCode}\n\n` +
                    `⚠️ LƯU Ý:\n` +
                    `- Gửi danh sách UID sau khi thanh toán\n` +
                    `- Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền`;

                api.sendMessage({
                    body: messageText,
                    attachment: fs.createReadStream(qrPath)
                }, threadID, () => {
                    setTimeout(() => {
                        api.sendMessage(
                            "👨‍👩‍👧‍👦 Sau khi thanh toán, vui lòng gửi tin nhắn theo mẫu:\n\n" +
                            `Danh sách UID cho GROUP_${pkg.name}\n` +
                            "1. [UID_1]\n2. [UID_2]\n3. [UID_3]\n...và các ID khác",
                            threadID
                        );
                        
                        fs.unlink(qrPath, (err) => {
                            if (err) console.error("Không thể xóa file QR:", err);
                        });
                    }, 1000);
                });
                
                return;
            }
            // Handle family package
            if (packageType === "family") {
                const months = target[2] ? parseInt(target[2]) : 1;
                const bronzeUserID = target[3];

                if (![1, 3, 6, 12].includes(months)) {
                    return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
                }

                if (!bronzeUserID || isNaN(bronzeUserID)) {
                    return api.sendMessage("❌ Vui lòng nhập UID hợp lệ của người sẽ nhận gói BRONZE miễn phí.", threadID);
                }

                // Kiểm tra UID người nhận Bronze có tồn tại không
                try {
                    let bronzeUserName, senderName;
                    
                    try {
                        const userInfo = await api.getUserInfo(bronzeUserID);
                        if (userInfo && userInfo[bronzeUserID]) {
                            bronzeUserName = userInfo[bronzeUserID].name || "Người dùng";
                        } else {
                            bronzeUserName = getUserNameFromRankData(bronzeUserID);
                        }
                    } catch (error) {
                        console.error("Error getting bronze user info:", error);
                        bronzeUserName = getUserNameFromRankData(bronzeUserID);
                    }
                    
                    try {
                        const senderInfo = await api.getUserInfo(senderID);
                        if (senderInfo && senderInfo[senderID]) {
                            senderName = senderInfo[senderID].name || "Người dùng";
                        } else {
                            senderName = getUserNameFromRankData(senderID);
                        }
                    } catch (error) {
                        console.error("Error getting sender info:", error);
                        senderName = getUserNameFromRankData(senderID);
                    }
                    
                    // Calculate gold price
                    const goldPriceInfo = vipService.calculateVipPrice('gold', months);
                    if (!goldPriceInfo.success) {
                        return api.sendMessage(`❌ ${goldPriceInfo.message}`, threadID);
                    }

                    const goldPkg = VIP_PACKAGES.GOLD;
                    const bronzePkg = VIP_PACKAGES.BRONZE;
                    const amountToPay = goldPriceInfo.finalPrice;
                    const paymentCode = `FAMILY_${months > 1 ? months : ''}_${senderID}_${bronzeUserID}`;

                    // Tạo mã QR với thiết kế đẹp - sử dụng API VietQR trực tiếp
                    const qrPath = await qrHelper.generateQR({
                        bankName: BANK_CONFIG.bankName,
                        bankNumber: BANK_CONFIG.bankNumber,
                        accountName: BANK_CONFIG.accountName,
                        amount: amountToPay,
                        content: paymentCode,
                        packageName: "GÓI GIA ĐÌNH",
                        isFamily: true
                    });

                    if (!qrPath) {
                        return api.sendMessage("❌ Có lỗi khi tạo mã QR. Vui lòng thử lại sau.", threadID);
                    }

                    // Gửi thông tin gói gia đình
                    const messageText = `👨‍👩‍👧‍👦 THANH TOÁN GÓI GIA ĐÌNH\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `🎁 Mua 1 gói GOLD VIP, tặng 1 gói BRONZE VIP miễn phí\n\n` +
                        `📦 CHI TIẾT GÓI:\n` +
                        `👑 1x ${goldPkg.name} (${months > 1 ? goldPkg.longTermOptions[months].duration : goldPkg.duration})\n` +
                        `   → Người nhận: ${senderName}\n` +
                        `🥉 1x ${bronzePkg.name} MIỄN PHÍ (${bronzePkg.duration})\n` +
                        `   → Người nhận: ${bronzeUserName}\n\n` +
                        `💵 Số tiền thanh toán: ${amountToPay.toLocaleString('vi-VN')}đ\n\n` +
                        `📝 NỘI DUNG THANH TOÁN:\n` +
                        `${paymentCode}\n\n` +
                        `⚠️ LƯU Ý:\n` +
                        `- Hệ thống sẽ tự động kích hoạt cho cả hai tài khoản\n` +
                        `- Không thay đổi nội dung chuyển khoản`;

                    api.sendMessage({
                        body: messageText,
                        attachment: fs.createReadStream(qrPath)
                    }, threadID, () => {
                        // Xóa file QR sau khi đã gửi
                        fs.unlink(qrPath, (err) => {
                            if (err) console.error("Không thể xóa file QR:", err);
                        });
                    });
                    
                    return;
                } catch (error) {
                    console.error("Lỗi kiểm tra UID:", error);
                    return api.sendMessage("❌ Có lỗi xảy ra khi kiểm tra UID. Vui lòng thử lại sau.", threadID);
                }
            }

            // Handle individual VIP purchase
            if (!packageType || !["bronze", "silver", "gold"].includes(packageType)) {
                return api.sendMessage("❌ Loại gói không hợp lệ. Vui lòng chọn bronze, silver hoặc gold", threadID);
            }

            const months = target[2] ? parseInt(target[2]) : 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
            }

            // Kiểm tra nếu người dùng có voucher
            const { bestVoucher } = this.checkVouchers(senderID);
            
            // Tính giá với voucher nếu có
            const priceInfo = vipService.calculateVipPrice(packageType, months, bestVoucher);
            if (!priceInfo.success) {
                return api.sendMessage(`❌ ${priceInfo.message}`, threadID);
            }

            const pkg = VIP_PACKAGES[packageType.toUpperCase()];
            const amountToPay = priceInfo.finalPrice;
            let paymentCode = `VIP_${packageType.toUpperCase()}${months > 1 ? months : ''}_${senderID}`;
            
            // Thêm mã voucher vào nội dung nếu có
            if (bestVoucher) {
                paymentCode = `VIP_${packageType.toUpperCase()}${months > 1 ? months : ''}_${senderID}_VOUCHER_${bestVoucher.code}`;
                this.markVoucherAsUsed(senderID, bestVoucher.code);
            }

            // Tạo mã QR với thiết kế đẹp - sử dụng API VietQR trực tiếp
            const qrPath = await qrHelper.generateQR({
                bankName: BANK_CONFIG.bankName,
                bankNumber: BANK_CONFIG.bankNumber,
                accountName: BANK_CONFIG.accountName,
                amount: amountToPay,
                content: paymentCode,
                packageName: pkg.name,
                packageIcon: pkg.icon
            });

            if (!qrPath) {
                return api.sendMessage("❌ Có lỗi khi tạo mã QR. Vui lòng thử lại sau.", threadID);
            }

            // Tạo thông tin giảm giá phù hợp
            let discountInfo = "";
            if (months > 1 && priceInfo.totalDiscount > 0) {
                const originalPrice = priceInfo.originalPrice * months;
                const termDiscountAmount = Math.floor(originalPrice * priceInfo.totalDiscount / 100);
                discountInfo += `💵 Giá gốc: ${originalPrice.toLocaleString('vi-VN')}đ\n`;
                discountInfo += `🔄 Giảm dài hạn: -${priceInfo.totalDiscount}% (-${termDiscountAmount.toLocaleString('vi-VN')}đ)\n`;
            }
            
            if (bestVoucher) {
                const originalPrice = months > 1 ? 
                    priceInfo.originalPrice * months * (100 - priceInfo.totalDiscount) / 100 : 
                    priceInfo.originalPrice;
                const voucherDiscountAmount = originalPrice - priceInfo.finalPrice;
                discountInfo += `🎟️ Voucher: ${bestVoucher.code} (-${bestVoucher.discount}%)\n`;
                discountInfo += `💸 Tiết kiệm: ${voucherDiscountAmount.toLocaleString('vi-VN')}đ\n`;
            }

            // Gửi thông tin gói VIP
            const messageText = `${pkg.icon} THANH TOÁN ${pkg.name} ${pkg.stars}\n`;
            api.sendMessage({
                body: messageText,
                attachment: fs.createReadStream(qrPath)
            }, threadID, () => {
                // Xóa file QR sau khi đã gửi
                fs.unlink(qrPath, (err) => {
                    if (err) console.error("Không thể xóa file QR:", err);
                });
            });
        } catch (error) {
            console.error("Lỗi xử lý QR:", error);
            api.sendMessage("❌ Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.", threadID);
        }
    },
    
    // Check for vouchers and return the best one (highest discount)
    checkVouchers(senderID) {
        try {
            const voucherPath = path.join(__dirname, 'json', 'voucher.json');
            if (!fs.existsSync(voucherPath)) {
                return { bestVoucher: null, count: 0 };
            }
            
            const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
            if (!voucherData.users || !voucherData.users[senderID]) {
                return { bestVoucher: null, count: 0 };
            }
            
            const userVouchers = voucherData.users[senderID];
            const validVouchers = userVouchers.filter(v => !v.used && v.expires > Date.now());
            
            if (validVouchers.length === 0) {
                return { bestVoucher: null, count: 0 };
            }
            
            // Return the voucher with the highest discount
            return { 
                bestVoucher: validVouchers.sort((a, b) => b.discount - a.discount)[0],
                count: validVouchers.length
            };
        } catch (err) {
            console.error("Voucher check error:", err);
            return { bestVoucher: null, count: 0 };
        }
    },
    
    // Mark a voucher as used
    markVoucherAsUsed(senderID, voucherCode) {
        try {
            const voucherPath = path.join(__dirname, 'json', 'voucher.json');
            if (!fs.existsSync(voucherPath)) return false;
            
            const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
            if (!voucherData.users || !voucherData.users[senderID]) return false;
            
            const userVouchers = voucherData.users[senderID];
            const voucherIndex = userVouchers.findIndex(v => v.code === voucherCode);
            
            if (voucherIndex !== -1) {
                userVouchers[voucherIndex].used = true;
                fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));
                return true;
            }
            
            return false;
        } catch (err) {
            console.error("Error marking voucher as used:", err);
            return false;
        }
    }
};