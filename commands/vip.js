const { addVIP, removeVIP, checkVIP, listAllVIP } = require('../utils/vipUtils');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "vip",
    dev: "HNT",
    category: "VIP",
    info: "Hệ thống VIP đơn giản",
    usages: [
        ".vip check - Kiểm tra VIP",
        ".vip add [uid] [days] - Thêm VIP (Admin)",
        ".vip remove [uid] - Xóa VIP (Admin)", 
        ".vip list - Danh sách VIP (Admin)",
        ".vip info - Thông tin gói VIP"
    ],
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const cmd = target[0]?.toLowerCase();

        const adminConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "admin.json"), "utf8"));
        const adminUIDs = adminConfig.adminUIDs || [];
        const isAdmin = adminUIDs.includes(senderID);

        if (cmd === "check") {
            const vipStatus = checkVIP(senderID);
            if (vipStatus.hasVIP) {
                const message = `👑 THÔNG TIN VIP\n` +
                    `━━━━━━━━━━━━━━\n` +
                    `🎯 Loại: ${vipStatus.type}\n` +
                    `⏰ Còn lại: ${vipStatus.daysLeft} ngày\n` +
                    `📅 Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}\n` +
                    `━━━━━━━━━━━━━━`;
                return api.sendMessage(message, threadID);
            } else {
                return api.sendMessage(`❌ ${vipStatus.message}`, threadID);
            }
        }

        if (cmd === "add" || cmd === "remove" || cmd === "list") {
            if (!isAdmin) {
                return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này!", threadID);
            }

            if (cmd === "add") {
                const userID = target[1];
                const days = parseInt(target[2]) || 30;
                
                if (!userID) {
                    return api.sendMessage("❌ Vui lòng nhập UID người dùng!", threadID);
                }
                
                if (days <= 0 || days > 365) {
                    return api.sendMessage("❌ Số ngày phải từ 1-365!", threadID);
                }
                
                addVIP(userID, days, 'GOLD');
                return api.sendMessage(`✅ Đã thêm VIP GOLD cho ${userID} trong ${days} ngày!`, threadID);
            }

            if (cmd === "remove") {
                const userID = target[1];
                
                if (!userID) {
                    return api.sendMessage("❌ Vui lòng nhập UID người dùng!", threadID);
                }
                
                if (removeVIP(userID)) {
                    return api.sendMessage(`✅ Đã xóa VIP của ${userID}!`, threadID);
                } else {
                    return api.sendMessage(`❌ ${userID} không có VIP!`, threadID);
                }
            }

            if (cmd === "list") {
                const vipUsers = listAllVIP();
                
                if (vipUsers.length === 0) {
                    return api.sendMessage("📋 Không có người dùng VIP nào!", threadID);
                }
                
                let message = `📋 DANH SÁCH VIP (${vipUsers.length} người)\n━━━━━━━━━━━━━━\n\n`;
                
                vipUsers.forEach((user, index) => {
                    message += `${index + 1}. ${user.userID}\n`;
                    message += `   👑 ${user.type} | ⏰ ${user.daysLeft} ngày\n`;
                    message += `   📅 ${user.expireDate}\n\n`;
                });
                
                return api.sendMessage(message, threadID);
            }
        }

        // VIP package info
        if (cmd === "gold") {
            const message = `👑 THÔNG TIN GÓI VIP GOLD\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `⏰ Thời hạn: 30 ngày + 7 ngày bonus (37 ngày)\n\n` +
                `🎮 QUYỀN LỢI:\n` +
                `• 🎣 Câu cá: +40% cá hiếm, x4 EXP\n` +
                `• 💰 Tiền tệ: +60% quà hàng ngày\n` +
                `• 🎴 Gacha: +15% tỉ lệ Limited\n` +
                `• 🔐 Bảo vệ: Miễn nhiễm cướp\n` +
                `• 📱 Tải video toàn bộ nền tảng\n` +
                `• 🎁 Giftcode VIP độc quyền\n\n` +
                `🌱 CÁCH NHẬN VIP (KHÔNG MUA):\n` +
                `• 🎁 Tích điểm: Đổi giftcode (.rewards redeem), tích đủ 90 điểm → .rewards vip\n` +
                `• 🎡 Vòng quay: .spin mỗi ngày, có cơ hội trúng VIP GOLD 30 ngày\n` +
                `• 🎊 Sự kiện: Theo dõi giftcode sự kiện (Lễ, Tết...) thường có điểm VIP\n` +
                `• 👑 Admin có thể tặng: .vip add [uid] [số ngày]`;
            
            return api.sendMessage(message, threadID);
        }


        let helpMessage = `👑 HỆ THỐNG VIP\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `📋 LỆNH:\n` +
            `• .vip check - Kiểm tra VIP\n` +
            `• .vip gold - Thông tin gói VIP & cách nhận VIP\n`;
        
        if (isAdmin) {
            helpMessage += `• .vip add [uid] [days] - Thêm VIP (Admin)\n` +
                `• .vip remove [uid] - Xóa VIP (Admin)\n` +
                `• .vip list - Danh sách VIP (Admin)\n`;
        }
        
        helpMessage += `\n💡 Gõ .vip gold để xem cách farm VIP (tích điểm, vòng quay, sự kiện).`;
        
        return api.sendMessage(helpMessage, threadID);
    }
};
