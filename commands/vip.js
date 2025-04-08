const { on } = require('events');
const fs = require('fs');
const path = require('path');
const vipService = require('../game/vip/vipService');
const { VIP_PACKAGES, GROUP_PACKAGES } = require('../game/vip/vipConfig');

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
        ".vip gold",
        ".vip gold [3/6/12]",
        ".vip group gold",
    ],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
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

        // Handle group VIP packages
        if (target[0]?.toLowerCase() === "group") {
            const packageName = target[1]?.toLowerCase();

            if (!packageName || packageName !== "gold") {
                return api.sendMessage(
                    "❌ Chỉ có gói VIP Gold nhóm.\n" +
                    "Ví dụ: .vip group gold",
                    threadID
                );
            }

            const packageKey = packageName.toUpperCase();
            const pkg = VIP_PACKAGES[packageKey];
            const groupPkg = GROUP_PACKAGES[packageKey];

            if (!pkg || !groupPkg) {
                return api.sendMessage("❌ Gói VIP không hợp lệ.", threadID);
            }

            const months = target[2] ? parseInt(target[2]) : 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
            }

            // Calculate price for different member counts
            const member3Price = vipService.calculateGroupVipPrice(packageName, 3, months);
            const member5Price = vipService.calculateGroupVipPrice(packageName, 5, months);
            const member10Price = vipService.calculateGroupVipPrice(packageName, 10, months);

            if (!member3Price.success) {
                return api.sendMessage(`❌ ${member3Price.message}`, threadID);
            }

            const regularPrice = formatPrice(pkg.price.sale);
            const groupDiscountText = `-${groupPkg.discount}%`;

            const message = `${pkg.icon} GÓI NHÓM ${pkg.name} ${pkg.stars}\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `🔰 Mua VIP theo nhóm (từ ${groupPkg.minMembers}+ người)\n` +
                `💰 Giảm giá: ${groupDiscountText} cho mỗi thành viên\n\n` +
                `⏳ Thời hạn: ${months > 1 ? pkg.longTermOptions[months].duration : pkg.duration}\n\n` +
                `📊 BẢNG GIÁ GÓI NHÓM (1 người):\n` +
                `👤 Giá gốc: ${regularPrice}đ/người\n` +
                `👥 Giá nhóm: ${formatPrice(member3Price.individualDiscountedPrice)}đ/người\n` +
                `💵 Tiết kiệm: ${formatPrice(member3Price.savedPerPerson)}đ/người\n\n` +
                `📊 TỔNG CHI PHÍ THEO SỐ LƯỢNG:\n` +
                `3 người: ${formatPrice(member3Price.totalGroupPrice)}đ\n` +
                `5 người: ${formatPrice(member5Price.totalGroupPrice)}đ\n` +
                `10 người: ${formatPrice(member10Price.totalGroupPrice)}đ\n\n` +
                `📝 HƯỚNG DẪN MUA GÓI NHÓM:\n` +
                `1️⃣ Tập hợp group chat (tối thiểu ${groupPkg.minMembers} người)\n` +
                `2️⃣ Chỉ định 1 người đại diện thanh toán\n` +
                `3️⃣ Gõ lệnh: .qr vip group gold [số_người] ${months > 1 ? months : ''}\n` +
                `4️⃣ Quét mã QR và thanh toán tổng số tiền\n` +
                `5️⃣ Gửi danh sách UID của các thành viên\n\n` +
                `💡 Nội dung: GROUP_${packageKey}${months > 1 ? months : ''}_${senderID}_[số_người]`;

            return api.sendMessage(message, threadID);
        }

        const packageName = target[0]?.toLowerCase();
        if (packageName === "gold") {
            const packageKey = "GOLD";
            const pkg = VIP_PACKAGES[packageKey];

            if (!pkg) {
                return api.sendMessage("❌ Không tìm thấy thông tin gói VIP.", threadID);
            }

            const months = target[1] ? parseInt(target[1]) : 1;
            if (![1, 3, 6, 12].includes(months)) {
                return api.sendMessage("❌ Thời hạn không hợp lệ. Chọn 1, 3, 6 hoặc 12 tháng.", threadID);
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

                        discountInfo += `\n💳 Giá cuối: ${voucherDiscounted}đ (-${bestVoucher.discount}% với voucher ${bestVoucher.code})`;
                    }
                }
            } else {
                if (bestVoucher) {
                    const result = calculateDiscount(pkg.price.sale, bestVoucher.discount);
                    finalPrice = result;
                    finalPriceNumeric = parseInt(result.replace(/,/g, ''));
                    discountInfo = `\n💳 Giá cuối: ${finalPrice}đ (-${bestVoucher.discount}% với voucher ${bestVoucher.code})`;
                }
            }

            const message = `${pkg.icon} ${pkg.name} ${pkg.stars}\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏳ THỜI HẠN: ${duration}\n` +
                `💵 GIÁ: ${months > 1 ?
                    `${(parseInt(pkg.price.sale.replace(/,/g, '')) * months).toLocaleString('vi-VN')}đ ${discountInfo}` :
                    `${originalPrice}đ → ${salePrice}đ${discountInfo}`}\n\n` +

                `📋 QUYỀN LỢI:\n` +
                `━━━━━━━━━━━━━━\n\n` +

                `🎮 CÁC LOẠI GAME:\n` +
                `┌─────────────────\n` +
                `│ 🌾 Game Nông Trại:\n${pkg.perks.money.farm}\n` +
                `│ 🎣 Game Câu Cá: Tăng 40% cá hiếm, x4 EXP, giảm chờ còn 2 phút, bảo vệ cá 100%\n` +
                (pkg.perks.fishing.special ? `│ ✨ Đặc biệt: ${pkg.perks.fishing.special}\n` : '') +
                (pkg.perks.gacha?.limitedBonus ? `│ 🎴 Game Gacha: ${pkg.perks.gacha.limitedBonus}\n` : '') +
                `│ 🐷 Mở khóa nhiều tính năng cho Game Pet\n` +
                `└─────────────────\n\n` +

                `💼 TIỆN ÍCH:\n` +
                `┌─────────────────\n` +
                `│ 🔐 ${pkg.perks.security.protect}\n` +
                (pkg.perks.money.platform ? `│ 📱 ${pkg.perks.money.platform}\n` : '') +
                `│ 🔔 SỬ DỤNG TOOL SPAM SMS MIỄN PHÍ\n` +
                `│ 💘 Ghép đôi nâng cao: Xem thông tin đầy đủ\n` +
                `│ 💕 Ghép đôi toàn cục: Mở khóa 'ghep box'\n` +
                `│ 🎁 Gift VIP: Nhận giftcode VIP độc quyền\n` +
                `└─────────────────\n\n` +

                `💰 TIỀN TỆ:\n` +
                `┌─────────────────\n` +
                `│ 🎁 Quà hàng ngày: ${pkg.perks.money.daily}\n` +
                `│ 📝 Phần thưởng nhiệm vụ: ${pkg.perks.money.quest}\n` +
                `│ 💸 Khả năng vay: ${pkg.perks.bank.loan}\n` +
                `│ 📉 Lãi suất vay: ${pkg.perks.bank.interest}\n` +
                `│ 📈 Lãi tiết kiệm: ${pkg.perks.bank.bonus}\n` +
                `│ 💱 Phí giao dịch: ${pkg.perks.bank.fee}\n` +
                `│ 🔄 Hạn mức chuyển: ${pkg.perks.money.transferLimit}\n` +
                `└─────────────────\n\n` +

                `📌 HƯỚNG DẪN MUA VIP:\n` +
                `┌─────────────────\n` +
                `│ 🔹 Bước 1: Gõ lệnh \n│   .qr vip gold${months > 1 ? ' ' + months : ''}\n` +
                `│ 🔹 Bước 2: Quét mã QR và thanh toán\n` +
                `│ 🔹 Bước 3: Chờ hệ thống xác nhận tự động\n` +
                `└─────────────────\n\n`;
            return api.sendMessage(message, threadID);
        }

        if (!target[0]) {
            const promptMessage =
                `╭───「 💎 VIP 💎 」───╮\n\n` +

                `🏆 BẢNG GIÁ VIP GOLD:\n` +
                `┌────────────\n` +
                `│ 👑 VIP GOLD: 50,000đ / 37 ngày (30+7)\n` +
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
                `│ .vip group gold - Xem gói nhóm\n` +
                `│ .vip gold [3/6/12] - Xem gói nhiều tháng\n` +
                `│ .vip check - Kiểm tra VIP hiện tại\n` +
                `└─────────────\n\n` +

                `💡 Thanh toán: .qr vip gold [tháng]\n` +
                `╰────────────────╯`;

            return api.sendMessage(promptMessage, threadID, messageID);
        }

        if (!["gold", "check", "group"].includes(packageName)) {
            return api.sendMessage(
                "❌ Lệnh không hợp lệ. Vui lòng nhập '.vip' để xem hướng dẫn sử dụng.",
                threadID
            );
        }
    }
};
