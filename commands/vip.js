const fs = require('fs');
const path = require('path');
const vipService = require('../game/vip/vipService');

function checkVouchers(senderID) {
    try {
        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        if (!fs.existsSync(voucherPath)) return { bestVoucher: null, count: 0 };

        const data = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        const userVouchers = data.users?.[senderID] || [];

        const valid = userVouchers.filter(v => !v.used && v.expires > Date.now())
            .sort((a, b) => b.discount - a.discount);

        return {
            bestVoucher: valid[0] || null,
            count: valid.length
        };
    } catch (err) {
        console.error("Voucher check error:", err);
        return { bestVoucher: null, count: 0 };
    }
}

function getDurationAndDiscount(months) {
    const mapping = {
        1: { duration: "30 ngày +7", discount: 0 },
        3: { duration: "90 ngày +21", discount: 10 },
        6: { duration: "180 ngày +42", discount: 20 },
        12: { duration: "360 ngày +84", discount: 30 }
    };
    return mapping[months] || mapping[1];
}

function applyVoucher(price, voucher) {
    if (!voucher) return { finalPrice: price, note: "" };
    const discountAmount = Math.floor(price * voucher.discount / 100);
    const final = price - discountAmount;
    const note = `\n💳 Giá cuối: ${final.toLocaleString('vi-VN')}đ (-${voucher.discount}% với voucher ${voucher.code})`;
    return { finalPrice: final, note };
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
        ".vip gold",
        ".vip gold [3/6/12]",
        ".vip group gold",
    ],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;
        const cmd = target[0]?.toLowerCase();

        if (cmd === "check") {
            const mentionedID = Object.keys(mentions)[0];
            const uidArgument = target[1] && !isNaN(target[1]) ? target[1] : null;
            const userID = mentionedID || uidArgument || senderID;

            const vipStatus = vipService.checkVIP(userID);
            if (!vipStatus.success) {
                return api.sendMessage(`👤 ${userID === senderID ? "Bạn" : "UID: " + userID}\n🚫 ${vipStatus.message}`, threadID);
            }

            return api.sendMessage(
                `${vipStatus.packageInfo.icon} ${vipStatus.packageInfo.name} ${vipStatus.packageInfo.stars}\n` +
                `👤 ${userID === senderID ? "Bạn" : "UID: " + userID}\n` +
                `⏰ Còn: ${vipStatus.daysLeft} ngày | ⌛ Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}`,
                threadID
            );
        }

        if (cmd === "group") {
            const packageName = target[1]?.toLowerCase();

            const months = parseInt(target[packageName === "gold" ? 2 : 1]) || 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
            }

            const basePrice = 49000;
            const discount = 15;
            const discounted = Math.floor(basePrice * (100 - discount) / 100);
            const { duration } = getDurationAndDiscount(months);

            const message = `👑 GÓI NHÓM VIP GOLD ⭐⭐⭐\n━━━━━━━━━━━━━━\n\n` +
                `🔰 Mua VIP theo nhóm (từ 3+ người)\n💰 Giảm giá: -15% cho mỗi thành viên\n\n` +
                `⏳ Thời hạn: ${duration}\n\n` +
                `📊 BẢNG GIÁ GÓI NHÓM (1 người):\n` +
                `👤 Giá gốc: ${basePrice.toLocaleString('vi-VN')}đ/người\n` +
                `👥 Giá nhóm: ${discounted.toLocaleString('vi-VN')}đ/người\n` +
                `💵 Tiết kiệm: ${(basePrice - discounted).toLocaleString('vi-VN')}đ/người\n\n` +
                `📊 TỔNG CHI PHÍ:\n3 người: ${(discounted * 3 * months).toLocaleString('vi-VN')}đ\n` +
                `5 người: ${(discounted * 5 * months).toLocaleString('vi-VN')}đ\n` +
                `10 người: ${(discounted * 10 * months).toLocaleString('vi-VN')}đ\n\n` +
                `📝 Gõ: .qr vip group ${months > 1 ? months : ''}\n` +
                `💡 Nội dung: GROUP_GOLD${months > 1 ? months : ''}_${senderID}_[số_người]`;

            return api.sendMessage(message, threadID);
        }

        if (cmd === "gold") {
            const months = [1, 3, 6, 12].includes(parseInt(target[1])) ? parseInt(target[1]) : 1;
            const { bestVoucher } = checkVouchers(senderID);
            const originalPrice = 95000;
            const salePrice = 30000;
            const totalBase = salePrice * months;

            const { duration, discount: baseDiscountPercent } = getDurationAndDiscount(months);
            const baseDiscount = Math.floor(totalBase * baseDiscountPercent / 100);
            let finalPrice = totalBase - baseDiscount;
            let discountInfo = baseDiscountPercent ? ` (-${baseDiscountPercent}% khi mua ${months} tháng)` : "";

            const { finalPrice: withVoucher, note: voucherNote } = applyVoucher(finalPrice, bestVoucher);
            finalPrice = withVoucher;
            discountInfo += voucherNote;

            const priceText = months > 1
                ? `${totalBase.toLocaleString('vi-VN')}đ${discountInfo}`
                : `${originalPrice.toLocaleString('vi-VN')}đ → ${salePrice.toLocaleString('vi-VN')}đ${discountInfo}`;

            const message = `👑 VIP GOLD ⭐⭐⭐\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏳ THỜI HẠN: ${duration}\n` +
                `💵 GIÁ: ${months > 1 ?
                    `${(salePrice * months).toLocaleString('vi-VN')}đ ${discountInfo}` :
                    `${originalPrice.toLocaleString('vi-VN')}đ → ${salePrice.toLocaleString('vi-VN')}đ${discountInfo}`}\n\n` +

                `📋 QUYỀN LỢI:\n` +
                `━━━━━━━━━━━━━━\n\n` +

                `🎮 CÁC LOẠI GAME:\n` +
                `┌─────────────────\n` +
                `│ 🌾 Game Nông Trại: Tăng lợi nhuận/giảm thời gian\n` +
                `│ 🎣 Game Câu Cá: Tăng 40% cá hiếm, x4 EXP, giảm chờ còn 2 phút, bảo vệ cá 100%\n` +
                `│ ✨ Đặc biệt: Mở Khu vực VIP cho Fish\n` +
                `│ 🎴 Game Gacha: +15% tỉ lệ Limited\n` +
                `│ 🐷 Mở khóa nhiều tính năng cho Game Pet\n` +
                `└─────────────────\n\n` +

                `💼 TIỆN ÍCH:\n` +
                `┌─────────────────\n` +
                `│ 🔐 Miễn nhiễm cướp cho Stolen\n` +
                `│ 📱 Tải Video toàn bộ nền tảng\n` +
                `│ 🔔 SỬ DỤNG TOOL SPAM SMS MIỄN PHÍ\n` +
                `│ 💘 Ghép đôi nâng cao: Xem thông tin đầy đủ\n` +
                `│ 💕 Ghép đôi toàn cục: Mở khóa 'ghep box'\n` +
                `│ 🎁 Gift VIP: Nhận giftcode VIP độc quyền\n` +
                `└─────────────────\n\n` +

                `💰 TIỀN TỆ:\n` +
                `┌─────────────────\n` +
                `│ 🎁 Quà hàng ngày: +60%\n` +
                `│ 📝 Phần thưởng nhiệm vụ: +100%\n` +
                `│ 💸 Khả năng vay: Vay tối đa 150% tài sản\n` +
                `│ 📉 Lãi suất vay: -30% lãi vay\n` +
                `│ 📈 Lãi tiết kiệm: +15% lãi tiết kiệm\n` +
                `│ 💱 Phí giao dịch: -60% phí giao dịch\n` +
                `│ 🔄 Hạn mức chuyển: 5 tỉ xu/ngày\n` +
                `└─────────────────\n\n` +

                `📌 HƯỚNG DẪN MUA VIP:\n` +
                `┌─────────────────\n` +
                `│ 🔹 Bước 1: Gõ lệnh \n│   .qr vip gold${months > 1 ? ' ' + months : ''}\n` +
                `│ 🔹 Bước 2: Quét mã QR và thanh toán\n` +
                `│ 🔹 Bước 3: Chờ hệ thống xác nhận tự động\n` +
                `└─────────────────\n\n`;
            return api.sendMessage(message, threadID);
        }

        if (!cmd) {
            const promptMessage =
                `╭───「 💎 VIP 💎 」───╮\n\n` +

                `🏆 BẢNG GIÁ VIP GOLD:\n` +
                `┌────────────\n` +
                `│ 👑 VIP GOLD: 49,000đ / 37 ngày (30+7)\n` +
                `└─────────────\n\n` +

                `👪 GÓI COMBO NHÓM:\n` +
                `┌─────────────\n` +
                `│ 👥 Nhóm 3+ người: Giảm 15%/người\n` +
                `└─────────────\n\n` +

                `💰 ƯU ĐÃI DÀI HẠN:\n` +
                `┌─────────────\n` +
                `│ 3 tháng: Giảm 10%\n` +
                `│ 6 tháng: Giảm 20%\n` +
                `│ 12 tháng: Giảm 30%\n` +
                `└─────────────\n\n` +

                `📋 LỆNH XEM CHI TIẾT:\n` +
                `┌─────────────\n` +
                `│ .vip gold - Chi tiết gói Gold\n` +
                `│ .vip group - Xem gói nhóm\n` +
                `│ .vip gold [3/6/12] - Xem gói nhiều tháng\n` +
                `│ .vip check - Kiểm tra VIP hiện tại\n` +
                `└─────────────\n\n` +

                `💡 Thanh toán: .qr vip gold [tháng]\n` +
                `╰────────────────╯`;

            return api.sendMessage(promptMessage, threadID, messageID);
        }

        return api.sendMessage("❌ Lệnh không hợp lệ. Vui lòng nhập '.vip' để xem hướng dẫn.", threadID);
    }
};
