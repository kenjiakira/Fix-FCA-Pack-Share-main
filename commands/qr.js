const fs = require('fs');
const path = require('path');
const vipService = require('../game/vip/vipService');
const qrHelper = require('../game/vip/qrHelper');
const { VIP_PACKAGES } = require('../game/vip/vipConfig');

function getUserNameFromRankData(uid) {
    try {
        const rankDataPath = path.join(__dirname, '../database/rankData.json');
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
            if (!packageType || packageType !== "gold") {
                return api.sendMessage("❌ Loại gói không hợp lệ. Chỉ có gói VIP Gold. Sử dụng: .qr vip gold", threadID);
            }

            const months = target[2] ? parseInt(target[2]) : 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
            }

            const { bestVoucher } = this.checkVouchers(senderID);
            
            const priceInfo = vipService.calculateVipPrice(packageType, months, bestVoucher);
            if (!priceInfo.success) {
                return api.sendMessage(`❌ ${priceInfo.message}`, threadID);
            }

            const pkg = VIP_PACKAGES[packageType.toUpperCase()];
            const amountToPay = priceInfo.finalPrice;
            let paymentCode = `VIP_${packageType.toUpperCase()}${months > 1 ? months : ''}_${senderID}`;
            
            if (bestVoucher) {
                paymentCode = `VIP_${packageType.toUpperCase()}${months > 1 ? months : ''}_${senderID}_VOUCHER_${bestVoucher.code}`;
                this.markVoucherAsUsed(senderID, bestVoucher.code);
            }

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

            const messageText = `👑 THANH TOÁN ${pkg.name}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💰 Giá: ${amountToPay.toLocaleString('vi-VN')}đ\n` +
                `⏰ Thời hạn: ${months} tháng\n` +
                (discountInfo ? `\n${discountInfo}\n` : '') +
                `📝 NỘI DUNG THANH TOÁN:\n` +
                `${paymentCode}\n\n` +
                `⚠️ LƯU Ý:\n` +
                `- Không thay đổi nội dung chuyển khoản\n` +
                `- Hệ thống sẽ tự động kích hoạt sau khi nhận được tiền`;
            
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