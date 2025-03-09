const { on } = require('events');
const fs = require('fs');
const path = require('path');
const vipService = require('../vip/vipService');
const { VIP_PACKAGES } = require('../vip/vipConfig');

function formatPrice(price) {
    const numericValue = typeof price === 'string' ? 
        parseInt(price.replace(/,/g, '')) : 
        Number(price);
    
    return numericValue.toLocaleString('vi-VN');
}

function calculateDiscount(price, discount) {

    const basePrice = typeof price === 'string' ? 
        parseInt(price.replace(/,/g, '')) : 
        Number(price);
    
    const discountedPrice = Math.floor(basePrice * (100 - discount) / 100);
    
    return discountedPrice.toLocaleString('vi-VN');
}

function calculateLongTermPrice(basePrice, months, discount) {

    const basePriceValue = typeof basePrice === 'string' ? 
        parseInt(basePrice.replace(/,/g, '')) : 
        Number(basePrice);
    const totalPrice = basePriceValue * months;
    
    const discountedPrice = Math.floor(totalPrice * (100 - discount) / 100);
    
    return {
        numeric: discountedPrice,
        formatted: discountedPrice.toLocaleString('vi-VN')
    };
}

function checkVouchers(senderID) {
    try {
        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        
        if (!fs.existsSync(voucherPath)) {
            return { bestVoucher: null, count: 0 };
        }
        
        const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        const userVouchers = voucherData.users?.[senderID] || [];
        
        const validVouchers = userVouchers
            .filter(v => !v.used && v.expires > Date.now())
            .sort((a, b) => b.discount - a.discount);
        
        return {
            bestVoucher: validVouchers[0] || null,
            count: validVouchers.length
        };
    } catch (err) {
        console.error("Voucher check error:", err);
        return { bestVoucher: null, count: 0 };
    }
}

module.exports = {
    name: "vip",
    dev: "HNT",
    category: "VIP",
    info: "Xem thông tin & mua VIP",
    usages: [
        ".vip", 
        ".vip check", 
        ".vip check [@tag]", 
        ".vip check [UID]", 
        ".vip bronze", 
        ".vip silver", 
        ".vip gold",
        ".vip bronze [3/6/12]",
        ".vip silver [3/6/12]",
        ".vip gold [3/6/12]"
    ],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;

        if (target[0]?.toLowerCase() === "check") {
            const mentionedID = Object.keys(mentions)[0];
            const uidArgument = target[1] && !isNaN(target[1]) ? target[1] : null;
            const userID = mentionedID || uidArgument || senderID;
            
            const vipStatus = vipService.checkVIP(userID);
            
            if (!vipStatus.success) {
                return api.sendMessage(`👤 ${userID === senderID ? "Bạn" : "UID: " + userID}\n🚫 ${vipStatus.message}`, threadID);
            }

            const pkg = vipStatus.packageInfo;
            return api.sendMessage(
                `${pkg.icon} ${pkg.name} ${pkg.stars}\n` +
                `👤 ${userID === senderID ? "Bạn" : "UID: " + userID}\n` +
                `⏰ Còn: ${vipStatus.daysLeft} ngày | ⌛ Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}\n\n`,
                threadID
            );
        }

        const packageName = target[0]?.toLowerCase();
        if (["bronze", "silver", "gold"].includes(packageName)) {
            const packageKey = packageName.toUpperCase();
            const pkg = VIP_PACKAGES[packageKey];
            
            if (!pkg) {
                return api.sendMessage("❌ Gói VIP không hợp lệ. Chọn BRONZE, SILVER hoặc GOLD.", threadID);
            }
            
            const months = target[1] ? parseInt(target[1]) : 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 3, 6 hoặc 12 tháng hoặc để trống cho gói 1 tháng.", threadID);
            }
            
            const { bestVoucher, count } = checkVouchers(senderID);
            const originalPrice = formatPrice(pkg.price.original);
            const salePrice = formatPrice(pkg.price.sale);
            let finalPrice = salePrice;
            let finalPriceNumeric = parseInt(pkg.price.sale.replace(/,/g, ''));
            let discountInfo = "";
            let duration = pkg.duration;
      
            if (months > 1) {
                const option = pkg.longTermOptions?.[months.toString()];
                if (option) {
                    const basePriceValue = parseInt(pkg.price.sale.replace(/,/g, ''));
                    const totalPrice = basePriceValue * months;
                    const discountPercentage = option.discount;
                    const discountAmount = Math.floor(totalPrice * discountPercentage / 100);
                    const finalPriceValue = totalPrice - discountAmount;
                    
                    finalPriceNumeric = finalPriceValue;
                    finalPrice = finalPriceValue.toLocaleString('vi-VN');
                    
                    discountInfo = ` (-${option.discount}% khi mua ${months} tháng)`;
                    duration = option.duration;
                    
                    if (bestVoucher) {
                        const voucherDiscountAmount = Math.floor(finalPriceValue * bestVoucher.discount / 100);
                        const voucherFinalPrice = finalPriceValue - voucherDiscountAmount;
                        const voucherDiscounted = voucherFinalPrice.toLocaleString('vi-VN');
                        
                        finalPriceNumeric = voucherFinalPrice;
                        finalPrice = voucherDiscounted;
                        
                        discountInfo += ` → ${voucherDiscounted}đ (-${bestVoucher.discount}% với voucher ${bestVoucher.code})`;
                        
                        console.log(`Debug - Voucher applied: ${finalPriceValue} - ${bestVoucher.discount}% (${voucherDiscountAmount}) = ${voucherFinalPrice}`);
                    }
                }
            } else {
                if (bestVoucher) {
                    const result = calculateDiscount(pkg.price.sale, bestVoucher.discount);
                    finalPrice = result;
                    finalPriceNumeric = parseInt(result.replace(/,/g, ''));
                    discountInfo = ` → ${finalPrice}đ (-${bestVoucher.discount}% với voucher ${bestVoucher.code})`;
                }
            }
            

            const message = `${pkg.icon} ${pkg.name} ${pkg.stars}\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏳ Thời hạn: ${duration}\n` +
                `💵 Giá: ${months > 1 ? (parseInt(pkg.price.sale.replace(/,/g, '')) * months).toLocaleString('vi-VN') + 'đ' : originalPrice + 'đ → ' + salePrice + 'đ'}${discountInfo}\n\n` +
                `📋 QUYỀN LỢI:\n\n` +
                `🎣 CÂU CÁ:\n` +
                ` • Giảm Thời gian chờ: ${pkg.perks.fishing.cooldown}\n` +
                ` • Tăng kinh nghiệm: ${pkg.perks.fishing.exp}\n` +
                ` • Tỉ lệ cá hiếm: ${pkg.perks.fishing.rare}\n` +
                ` • Bảo vệ: ${pkg.perks.fishing.protect}\n` +
                ` • Tăng chỉ số: ${pkg.perks.fishing.buff}\n` +
                (pkg.perks.fishing.special ? ` • Đặc biệt: ${pkg.perks.fishing.special}\n` : '') +
                `\n💰 THU NHẬP:\n` +
                ` • Nông trại: ${pkg.perks.money.farm}\n` +
                ` • Làm việc: ${pkg.perks.money.work}\n` +
                ` • Quà hàng ngày: ${pkg.perks.money.daily}\n` +
                ` • Phần thưởng nhiệm vụ: ${pkg.perks.money.quest}\n` +
                ` • Phần thưởng sự kiện: ${pkg.perks.money.event}\n` +
                ` • Bảo vệ tài sản: ${pkg.perks.money.protection}\n` +
                `\n🏦 NGÂN HÀNG:\n` +
                ` • Khả năng vay: ${pkg.perks.bank.loan}\n` +
                ` • Lãi suất vay: ${pkg.perks.bank.interest}\n` +
                ` • Lãi tiết kiệm: ${pkg.perks.bank.bonus}\n` +
                ` • Phí giao dịch: ${pkg.perks.bank.fee}\n` +
                `\n🛡️ BẢO MẬT:\n` +
                ` • ${pkg.perks.security.protect}\n\n` +
                `📌 HƯỚNG DẪN MUA VIP:\n` +
                `1️⃣ Gõ lệnh: qr vip ${packageName}${months > 1 ? ' ' + months : ''}\n` +
                `2️⃣ Quét mã QR và thanh toán\n` +
                `3️⃣ Chờ hệ thống xác nhận tự động\n\n` +
                `📝 Nội dung: VIP_${packageKey}${months > 1 ? months : ''}_${senderID}`;
                
            return api.sendMessage(message, threadID);
        }

        if (!target[0]) {
            // Show only a simple menu without listing all packages details
            const promptMessage = "💎 HỆ THỐNG VIP 💎\n\n" +
                "Vui lòng chọn một trong những lựa chọn sau:\n\n" +
                "👉 .vip bronze - Xem chi tiết gói VIP BRONZE 🥉\n" +
                "👉 .vip silver - Xem chi tiết gói VIP SILVER 🥈\n" +
                "👉 .vip gold - Xem chi tiết gói VIP GOLD 👑\n" +
                "👉 .vip bronze [3/6/12] - Xem gói BRONZE nhiều tháng\n" +
                "👉 .vip silver [3/6/12] - Xem gói SILVER nhiều tháng\n" +
                "👉 .vip gold [3/6/12] - Xem gói GOLD nhiều tháng\n" +
                "👉 .vip check - Kiểm tra tình trạng VIP của bạn\n" +
                "👉 .vip check [UID] - Kiểm tra tình trạng VIP theo UID\n\n" +
                "💡 Gõ '.qr vip [bronze/silver/gold] [3/6/12]' để thanh toán trực tiếp";
                
            return api.sendMessage(promptMessage, threadID, messageID);
        }

        // Since the packageName is not recognized, send a message saying the command is invalid
        if (!["bronze", "silver", "gold", "check"].includes(packageName)) {
            return api.sendMessage(
                "❌ Lệnh không hợp lệ. Vui lòng nhập '.vip' để xem hướng dẫn sử dụng.",
                threadID
            );
        }
    }
};
