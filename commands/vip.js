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
    usages: [".vip", ".vip check", ".vip check [@tag]"],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;

        if (target[0]?.toLowerCase() === "check") {
            const userID = Object.keys(mentions)[0] || senderID;
            const vipStatus = vipService.checkVIP(userID);
            
            if (!vipStatus.success) {
                return api.sendMessage(`👤 ${userID}\n🚫 ${vipStatus.message}`, threadID);
            }

            const pkg = vipStatus.packageInfo;
            return api.sendMessage(
                `${pkg.icon} ${pkg.name} ${pkg.stars}\n` +
                `⏰ Còn: ${vipStatus.daysLeft} ngày | ⌛ Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}\n\n` +
                `🎣 CÂU CÁ: ${Object.values(pkg.perks.fishing).join(' • ')}\n` +
                `💰 THU NHẬP: ${Object.values(pkg.perks.money).slice(0, 3).join(' • ')}\n` +
                `🏦 NGÂN HÀNG: ${Object.values(pkg.perks.bank).slice(0, 2).join(' • ')}\n` +
                `🛡️ BẢO MẬT: ${pkg.perks.security.protect}`,
                threadID
            );
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
            menu += `🎣 ${Object.values(pkg.perks.fishing).slice(0, 3).join(" • ")}\n`;
            menu += `💰 ${Object.values(pkg.perks.money).slice(0, 3).join(" • ")}\n`;
            menu += `🏦 ${Object.values(pkg.perks.bank).slice(0, 2).join(" • ")}\n`;
            menu += `🛡️ ${pkg.perks.security.protect}\n`;
            menu += "━━━━━━━━━━━━━━\n\n";
        }

        menu += "📌 HƯỚNG DẪN MUA VIP:\n";
        menu += "1️⃣ Gõ lệnh: qr vip [bronze/silver/gold]\n";
menu += "2️⃣ Quét mã QR và thanh toán\n";
        menu += "3️⃣ Chờ hệ thống xác nhận tự động\n\n";
        menu += "💳 Banking: 0354683398\n";
        menu += "💜 Momo: 0354683398\n";
        menu += `📝 Nội dung: VIP_[BRONZE/SILVER/GOLD]_${senderID}\n`;
menu += "⚠️ Lưu ý: Chuyển khoản đúng nội dung để kích hoạt tự động\n";

        api.sendMessage(menu, threadID);
    }
};
