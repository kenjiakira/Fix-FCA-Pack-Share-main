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
                protect: "Bảo vệ 30% xu khi bị cướp",
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
                rare: "+25% cá hiếm"
            },
            money: {
                work: "+40% từ làm việc",
                daily: "+40% từ daily",
                quest: "+50% từ nhiệm vụ", 
                protection: "Bảo vệ 60% xu khi bị cướp"
            },
            bank: {
                loan: "Vay tối đa 120% tài sản",
                interest: "Giảm 20% lãi suất vay"
            },
            security: {
                protect: "Bảo vệ 60% xu khi bị cướp",
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
                special: "Mở khóa khu vực đặc biệt"
            },
            money: {
                work: "+60% từ làm việc",
                daily: "+60% từ daily",
                quest: "+100% từ nhiệm vụ",
                protection: "Bảo vệ 100% xu"
            },
            bank: {
                loan: "Vay tối đa 150% tài sản",
                interest: "Giảm 30% lãi suất vay"
            },
            security: {
                protect: "Miễn nhiễm hoàn toàn khi bị cướp",
            }
        }
    }
};

module.exports = {
    name: "vip", 
    dev: "HNT",
    onPrefix: true,
    info: "Xem thông tin & mua VIP",
    usages: [".vip", ".vip check", ".vip check [@tag]"],
    cooldowns: 10,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID, mentions } = event;

        if (target[0]?.toLowerCase() === "check") {
            const userID = Object.keys(mentions)[0] || senderID;
            const vipData = require('./json/vip.json').users[userID];

            if (!vipData) {
                return api.sendMessage(`👤 ${userID}\n🚫 Không có gói VIP!`, threadID);
            }

            const pkg = Object.values(VIP_PACKAGES).find(p => p.id === vipData.packageId);
            const daysLeft = Math.ceil((vipData.expireTime - Date.now()) / (24 * 60 * 60 * 1000));

            return api.sendMessage(
                `${pkg.icon} VIP ${pkg.name} ${pkg.stars}\n\n` +
                `⏰ Còn: ${daysLeft} ngày\n` +
                `📅 Hết hạn: ${new Date(vipData.expireTime).toLocaleString('vi-VN')}\n\n` +
                `🎣 Câu cá:\n` +
                `• Chờ: ${pkg.perks.fishing.cooldown}\n` +
                `• EXP: ${pkg.perks.fishing.exp}\n` +
                `• Cá hiếm: ${pkg.perks.fishing.rare}\n\n` +
                `💰 Thu nhập:\n` +
                `• Làm việc: ${pkg.perks.money.work}\n` +
                `• Daily: ${pkg.perks.money.daily}\n` +
                `• Nhiệm vụ: ${pkg.perks.money.quest}\n\n` +
                `🏦 Ngân hàng:\n` +
                `• Vay tối đa: ${pkg.perks.bank.loan}\n` +
                `• Giảm lãi: ${pkg.perks.bank.interest}`,
                threadID
            );
        }

        let menu = "🎊 SIÊU KHUYẾN MÃI VIP 🎊\n";
        menu += "⚡ GIẢM GIÁ SỐC - CHỈ CÒN 3 NGÀY!\n";
        menu += "━━━━━━━━━━━━━━━━━━\n\n";

        for (const pkg of Object.values(VIP_PACKAGES)) {
            menu += `${pkg.icon} ${pkg.name} ${pkg.stars}\n`;
            menu += `💵 Giá gốc: ${pkg.price.original}đ\n`;
            menu += `🏷️ Giá KM: ${pkg.price.sale}đ (-${Math.round((1 - parseInt(pkg.price.sale.replace(/,/g, '')) / parseInt(pkg.price.original.replace(/,/g, ''))) * 100)}%)\n`;
            menu += `⏳ Thời hạn: ${pkg.duration}\n\n`;
            menu += "📋 QUYỀN LỢI ĐẶC BIỆT:\n";

            menu += "🎣 CÂU CÁ VIP:\n";
            Object.entries(pkg.perks.fishing).forEach(([key, value]) => {
                menu += `• ${value}\n`;
            });
            menu += "\n💰 THU NHẬP CAO CẤP:\n";
            Object.entries(pkg.perks.money).forEach(([key, value]) => {
                menu += `• ${value}\n`;
            });
            menu += "\n🏦 NGÂN HÀNG ƯU ĐÃI:\n";
            Object.entries(pkg.perks.bank).forEach(([key, value]) => {
                menu += `• ${value}\n`;
            });
            menu += "\n🛡️ BẢO MẬT & TRỘM XU:\n";
            Object.entries(pkg.perks.security).forEach(([key, value]) => {
                menu += `• ${value}\n`;
            });
            menu += "\n━━━━━━━━━━━━━━━━━━\n\n";
        }

        menu += "📌 HƯỚNG DẪN MUA VIP:\n";
        menu += "💳 Banking: 0354683398\n";
        menu += "💜 Momo: 0354683398\n";
        menu += `📝 Nội dung: VIP_[BRONZE/SILVER/GOLD]_${senderID}\n`;
        menu += "⚠️ Chỉ chấp nhận thanh toán qua STK trên\n";

        menu += "📌 HƯỚNG DẪN MUA VIP:\n";
        menu += "1️⃣ Gõ lệnh: qr vip [bronze/silver/gold]\n";
        menu += "2️⃣ Quét mã QR và thanh toán\n";
        menu += "3️⃣ Chờ hệ thống xác nhận tự động\n";
        menu += "⚠️ Lưu ý: Chuyển khoản đúng nội dung để kích hoạt tự động\n";

        api.sendMessage(menu, threadID);
    }
};
