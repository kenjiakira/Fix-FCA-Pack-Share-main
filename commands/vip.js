const { on } = require('events');
const fs = require('fs');
const path = require('path');

const VIP_PACKAGES = {
    BRONZE: {
        id: 1,
        icon: "🥉",
        stars: "⭐",
        name: "VIP BRONZE",
        price: { original: "35,000", sale: "20,000" },
        duration: "30 ngày",
        perks: {
            fishing: {
                cooldown: "5 phút",
                exp: "x2 EXP",
                rare: "+15% cá hiếm",
                protect: "Miễn 50% mất cá",
                buff: "Tăng 20% chỉ số cần câu"
            },
            money: {
                work: "+20% từ làm việc",
                daily: "+20% từ daily", 
                quest: "+20% từ nhiệm vụ",
                event: "+30% từ sự kiện",
                protection: "Bảo vệ 30% xu khi bị cướp"
            },
            bank: {
                loan: "Vay tối đa 80% tài sản",
                interest: "Giảm 10% lãi suất vay",
                bonus: "+5% lãi tiết kiệm",
                fee: "Giảm 20% phí giao dịch"
            },
            security: {
                protect: "Bảo vệ 30% xu khi bị cướp"
            }
        }
    },
    SILVER: {
        id: 2,
        icon: "🥈",
        stars: "⭐⭐", 
        name: "VIP SILVER",
        price: { original: "45,000", sale: "30,000" },
        duration: "30 ngày",
        perks: {
            fishing: {
                cooldown: "4 phút",
                exp: "x3 EXP",
                rare: "+25% cá hiếm",
                protect: "Miễn 75% mất cá",
                buff: "Tăng 40% chỉ số cần câu"
            },
            money: {
                work: "+40% từ làm việc",
                daily: "+40% từ daily",
                quest: "+50% từ nhiệm vụ", 
                event: "+60% từ sự kiện",
                protection: "Bảo vệ 60% xu khi bị cướp"
            },
            bank: {
                loan: "Vay tối đa 120% tài sản",
                interest: "Giảm 20% lãi suất vay",
                bonus: "+10% lãi tiết kiệm",
                fee: "Giảm 40% phí giao dịch"
            },
            security: {
                protect: "Bảo vệ 60% xu khi bị cướp"
            }
        }
    },
    GOLD: {
        id: 3,
        icon: "👑",
        stars: "⭐⭐⭐",
        name: "VIP GOLD",
        price: { original: "75,000", sale: "50,000" },
        duration: "30 ngày +7",
        perks: {
            fishing: {
                cooldown: "2 phút",
                exp: "x4 EXP",
                rare: "+40% cá hiếm",
                protect: "Miễn nhiễm mất cá",
                buff: "Tăng 60% chỉ số cần câu",
                special: "Mở khóa khu vực đặc biệt"
            },
            money: {
                work: "+60% từ làm việc",
                daily: "+60% từ daily",
                quest: "+100% từ nhiệm vụ",
                event: "+100% từ sự kiện",
                protection: "Bảo vệ 100% xu"
            },
            bank: {
                loan: "Vay tối đa 150% tài sản",
                interest: "Giảm 30% lãi suất vay",
                bonus: "+15% lãi tiết kiệm",
                fee: "Giảm 60% phí giao dịch"
            },
            security: {
                protect: "Miễn nhiễm hoàn toàn khi bị cướp"
            }
        }
    }
};

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
    info: "Xem thông tin & mua VIP",
    usages: [".vip", ".vip check", ".vip check [@tag]"],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;

        // VIP Check Command
        if (target[0]?.toLowerCase() === "check") {
            const userID = Object.keys(mentions)[0] || senderID;
            const vipPath = path.join(__dirname, 'json', 'vip.json');
            let vipData;
            
            try {
                vipData = JSON.parse(fs.readFileSync(vipPath, 'utf8')).users[userID];
            } catch {
                return api.sendMessage(`👤 ${userID}\n🚫 Không có gói VIP!`, threadID);
            }

            if (!vipData) {
                return api.sendMessage(`👤 ${userID}\n🚫 Không có gói VIP!`, threadID);
            }

            const pkg = Object.values(VIP_PACKAGES).find(p => p.id === vipData.packageId);
            const daysLeft = Math.ceil((vipData.expireTime - Date.now()) / (24 * 60 * 60 * 1000));

            return api.sendMessage(
                `${pkg.icon} ${pkg.name} ${pkg.stars}\n\n` +
                `⏰ Còn lại: ${daysLeft} ngày\n` +
                `📅 Hết hạn: ${new Date(vipData.expireTime).toLocaleString('vi-VN')}\n\n` +
                `🎣 CÂU CÁ VIP:\n` +
                Object.entries(pkg.perks.fishing).map(([k, v]) => `• ${v}`).join('\n') + '\n\n' +
                `💰 THU NHẬP CAO CẤP:\n` +
                Object.entries(pkg.perks.money).map(([k, v]) => `• ${v}`).join('\n') + '\n\n' +
                `🏦 NGÂN HÀNG ƯU ĐÃI:\n` +
                Object.entries(pkg.perks.bank).map(([k, v]) => `• ${v}`).join('\n') + '\n\n' +
                `🛡️ BẢO MẬT & TRỘM XU:\n` +
                Object.entries(pkg.perks.security).map(([k, v]) => `• ${v}`).join('\n'),
                threadID
            );
        }

        const bestVoucher = checkVouchers(senderID);
        let menu = "🎊 SIÊU KHUYẾN MÃI VIP 🎊\n";
        menu += "⚡ GIẢM GIÁ SỐC!\n";
        menu += "━━━━━━━━━━━━━━━━━━\n\n";

        if (bestVoucher) {
            menu = `🎟️ VOUCHER ĐANG DÙNG 🎟️\n` +
                   `• Mã: ${bestVoucher.code}\n` +
                   `• Giảm: ${bestVoucher.discount}%\n` +
                   `• Hạn: ${new Date(bestVoucher.expires).toLocaleDateString('vi-VN')}\n` +
                   `━━━━━━━━━━━━━━━━━━\n\n` + menu;
        }

        for (const pkg of Object.values(VIP_PACKAGES)) {
            menu += `${pkg.icon} ${pkg.name} ${pkg.stars}\n`;
            const originalPrice = formatPrice(pkg.price.original);
            const salePrice = formatPrice(pkg.price.sale);
            
            menu += `💵 Giá gốc: ${originalPrice}đ\n`;
            menu += `🏷️ Giá KM: ${salePrice}đ (-${Math.round((1 - parseInt(pkg.price.sale.replace(/,/g, '')) / parseInt(pkg.price.original.replace(/,/g, ''))) * 100)}%)\n`;
            
            if (bestVoucher) {
                const finalPrice = calculateDiscount(pkg.price.sale, bestVoucher.discount);
                menu += `💝 Giá sau voucher: ${finalPrice}đ (-${bestVoucher.discount}%)\n`;
            }
            
            menu += `⏳ Thời hạn: ${pkg.duration}\n\n`;
            menu += "📋 QUYỀN LỢI ĐẶC BIỆT:\n\n";

            menu += "🎣 CÂU CÁ VIP:\n";
            Object.entries(pkg.perks.fishing).forEach(([k, v]) => menu += `• ${v}\n`);
            
            menu += "\n💰 THU NHẬP CAO CẤP:\n";
            Object.entries(pkg.perks.money).forEach(([k, v]) => menu += `• ${v}\n`);
            
            menu += "\n🏦 NGÂN HÀNG ƯU ĐÃI:\n";
            Object.entries(pkg.perks.bank).forEach(([k, v]) => menu += `• ${v}\n`);
            
            menu += "\n🛡️ BẢO MẬT & TRỘM XU:\n";
            Object.entries(pkg.perks.security).forEach(([k, v]) => menu += `• ${v}\n`);
            
            menu += "\n━━━━━━━━━━━━━━━━━━\n\n";
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
