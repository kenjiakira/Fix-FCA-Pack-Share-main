const { on } = require('events');
const fs = require('fs');
const path = require('path');
const vipService = require('../vip/vipService');
const { VIP_PACKAGES } = require('../vip/vipConfig');

function formatPrice(price) {
    return parseInt(price.replace(/,/g, '')).toLocaleString('vi-VN');
}

function calculateDiscount(price, discount) {
    const basePrice = parseInt(price.replace(/,/g, ''));
    return Math.floor(basePrice * (100 - discount) / 100).toLocaleString('vi-VN');
}

function checkVouchers(senderID) {
    try {
        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        const userVouchers = voucherData.users[senderID] || [];
        return userVouchers.filter(v => !v.used && v.expires > Date.now())
            .sort((a, b) => b.discount - a.discount)[0];
    } catch (err) {
        console.error("Voucher check error:", err);
        return null;
    }
}

module.exports = {
    name: "vip",
    dev: "HNT",
    category: "VIP",
    info: "Xem thông tin & mua VIP",
    usages: [".vip", ".vip check", ".vip check [@tag]", ".vip check [UID]", ".vip bronze", ".vip silver", ".vip gold"],
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
                `⏰ Còn: ${vipStatus.daysLeft} ngày | ⌛ Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}\n\n` ,
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
            
            const bestVoucher = checkVouchers(senderID);
            const originalPrice = formatPrice(pkg.price.original);
            const salePrice = formatPrice(pkg.price.sale);
            let finalPrice = salePrice;
            let discountInfo = "";
            
            if (bestVoucher) {
                finalPrice = calculateDiscount(pkg.price.sale, bestVoucher.discount);
                discountInfo = ` → ${finalPrice}đ (-${bestVoucher.discount}% với voucher ${bestVoucher.code})`;
            }
            
            const message = `${pkg.icon} ${pkg.name} ${pkg.stars}\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏳ Thời hạn: ${pkg.duration}\n` +
                `💵 Giá: ${originalPrice}đ → ${salePrice}đ${discountInfo}\n\n` +
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
                `1️⃣ Gõ lệnh: qr vip ${packageName}\n` +
                `2️⃣ Quét mã QR và thanh toán\n` +
                `3️⃣ Chờ hệ thống xác nhận tự động\n\n` +
                `📝 Nội dung: VIP_${packageKey}_${senderID}`;
                
            return api.sendMessage(message, threadID);
        }

        if (!target[0]) {
            const promptMessage = "💎 HỆ THỐNG VIP 💎\n\n" +
                "Vui lòng chọn một trong những lựa chọn sau:\n\n" +
                "👉 .vip bronze - Xem chi tiết gói VIP BRONZE 🥉\n" +
                "👉 .vip silver - Xem chi tiết gói VIP SILVER 🥈\n" +
                "👉 .vip gold - Xem chi tiết gói VIP GOLD 👑\n" +
                "👉 .vip check - Kiểm tra tình trạng VIP của bạn\n" +
                "👉 .vip check [UID] - Kiểm tra tình trạng VIP theo UID\n\n" +
                "💡 Gõ '.qr vip [bronze/silver/gold]' để thanh toán trực tiếp";
                
            return api.sendMessage(promptMessage, threadID, messageID);
        }

        const bestVoucher = checkVouchers(senderID);
        let menu = "🎊 KHUYẾN MÃI VIP ⚡\n";
        
        if (bestVoucher) {
            menu += `🎟️ VOUCHER: ${bestVoucher.code} (-${bestVoucher.discount}%)\n`;
        }
        
        menu += "━━━━━━━━━━━━━━\n\n";

        for (const pkg of Object.values(VIP_PACKAGES)) {
            menu += `${pkg.icon} ${pkg.name} ${pkg.stars} | ⏳ ${pkg.duration}\n`;
            const originalPrice = formatPrice(pkg.price.original);
            const salePrice = formatPrice(pkg.price.sale);
            
            menu += `💵 Giá: ${originalPrice}đ → ${salePrice}đ`;
            
            if (bestVoucher) {
                const finalPrice = calculateDiscount(pkg.price.sale, bestVoucher.discount);
                menu += ` → ${finalPrice}đ (-${bestVoucher.discount}%)`;
            }
            
            menu += "\n\n";
            menu += "📋 QUYỀN LỢI:\n";
            menu += `🎣 CÂU CÁ: ${Object.values(pkg.perks.fishing).slice(0, 3).join(" • ")}\n`;
            menu += `💰 THU NHẬP: ${Object.values(pkg.perks.money).slice(0, 3).join(" • ")}\n`;
            menu += `🏦 NGÂN HÀNG: ${Object.values(pkg.perks.bank).slice(0, 2).join(" • ")}\n`;
            menu += `🛡️ BẢO MẬT: ${pkg.perks.security.protect}\n`;
            menu += "━━━━━━━━━━━━━━\n\n";
        }

        menu += "📌 HƯỚNG DẪN MUA VIP:\n";
        menu += "1️⃣ Gõ lệnh: qr vip [bronze/silver/gold]\n";
        menu += "2️⃣ Quét mã QR và thanh toán\n";
        menu += "3️⃣ Chờ hệ thống xác nhận tự động\n\n";
        menu += `📝 Nội dung: VIP_[BRONZE/SILVER/GOLD]_${senderID}\n`;
        menu += "⚠️ Lưu ý: Chuyển khoản đúng nội dung để kích hoạt tự động\n";

        api.sendMessage(menu, threadID);
    }
};
