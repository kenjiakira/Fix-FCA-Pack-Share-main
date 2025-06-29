const vipService = require('../game/vip/vipService');

module.exports = {
    name: "vip",
    dev: "HNT",
    category: "VIP",
    info: "Xem thông tin & mua VIP",
    usages: [
        ".vip",
        ".vip check",
        ".vip gold"
    ],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;
        const cmd = target[0]?.toLowerCase();

        if (cmd === "check") {
            const vipStatus = vipService.checkVIP(senderID);
            if (!vipStatus.success) {
                return api.sendMessage(`👤 Bạn\n🚫 ${vipStatus.message}`, threadID);
            }

            return api.sendMessage(
                `${vipStatus.packageInfo.icon} ${vipStatus.packageInfo.name} ${vipStatus.packageInfo.stars}\n` +
                `👤 Bạn\n` +
                `⏰ Còn: ${vipStatus.daysLeft} ngày | ⌛ Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}`,
                threadID
            );
        }

        if (cmd === "gold") {
            const message = `👑 VIP GOLD ⭐⭐⭐\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏳ THỜI HẠN: 30 ngày +7\n` +
                `💵 GIÁ: 95,000đ → 49,000đ\n\n` +

                `📋 QUYỀN LỢI:\n` +
                `━━━━━━━━━━━━━━\n\n` +

                `🎮 CÁC LOẠI GAME:\n` +
                `┌─────────────────\n` +
                `│ 🌾 Game Nông Trại: Tăng lợi nhuận/giảm thời gian\n` +
                `│ 🎣 Game Câu Cá: Tăng 40% cá hiếm, x4 EXP, giảm chờ còn 2 phút, bảo vệ cá 100%\n` +
                `│ ✨ Đặc biệt: Mở Khu vực VIP cho Fish\n` +
                `│ 🎴 Game Gacha: +15% tỉ lệ Limited\n` +
                `│ � Mở khóa nhiều tính năng cho Game Pet\n` +
                `└─────────────────\n\n` +

                `🔹 TIỆN ÍCH:\n` +
                `┌─────────────────\n` +
                `│ 🔐 Miễn nhiễm cướp cho Stolen\n` +
                `│ 📱 Tải Video toàn bộ nền tảng\n` +
                `│ 🔹 SỬ DỤNG TOOL SPAM SMS MIỄN PHÍ\n` +
                `│ 🔹 Ghép đôi nâng cao: Xem thông tin đầy đủ\n` +
                `│ 🔹 Ghép đôi toàn cục: Mở khóa 'ghep box'\n` +
                `│ 🎁 Gift VIP: Nhận giftcode VIP độc quyền\n` +
                `└─────────────────\n\n` +

                `🔹 TIỀN TỆ:\n` +
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
                `│ 🔹 Bước 1: Gõ lệnh .qr vip gold\n` +
                `│ 🔹 Bước 2: Quét mã QR và thanh toán\n` +
                `│ 🔹 Bước 3: Chờ hệ thống xác nhận tự động\n` +
                `└─────────────────\n\n`;
            return api.sendMessage(message, threadID);
        }

        if (cmd === "gold") {
            const months = [1, 3, 6, 12].includes(parseInt(target[1])) ? parseInt(target[1]) : 1;
            const { bestVoucher } = checkVouchers(senderID);
            const originalPrice = 95000;
            const salePrice = 49000;
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
                `│ 🔹 Bước 1: Gõ lệnh .qr vip gold\n` +
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
                `� LỆNH:\n` +
                `┌─────────────\n` +
                `│ .vip - Xem thông tin VIP\n` +
                `│ .vip check - Kiểm tra VIP hiện tại\n` +
                `│ .vip gold - Chi tiết gói Gold\n` +
                `└─────────────\n\n` +
                `💡 Thanh toán: .qr vip gold\n` +
                `╰────────────────╯`;

            return api.sendMessage(promptMessage, threadID, messageID);
        }

        return api.sendMessage("❌ Lệnh không hợp lệ. Vui lòng nhập '.vip' để xem hướng dẫn.", threadID);
    }
};
