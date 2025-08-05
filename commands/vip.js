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
        
            const adminConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "admin.json"), "utf8"));
            const adminUIDs = adminConfig.adminUIDs || [];
            
            if (!adminUIDs.includes(senderID)) {
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
        if (cmd === "info") {
            const message = `👑 THÔNG TIN GÓI VIP GOLD\n` +
                `━━━━━━━━━━━━━━\n\n` +
                `💰 Giá: 49,000đ / 37 ngày\n` +
                `⏰ Thời hạn: 30 ngày + 7 ngày bonus\n\n` +
                `🎮 QUYỀN LỢI:\n` +
                `• 🎣 Câu cá: +40% cá hiếm, x4 EXP\n` +
                `• 💰 Tiền tệ: +60% quà hàng ngày\n` +
                `• 🎴 Gacha: +15% tỉ lệ Limited\n` +
                `• 🔐 Bảo vệ: Miễn nhiễm cướp\n` +
                `• 📱 Tải video toàn bộ nền tảng\n` +
                `• 🎁 Giftcode VIP độc quyền\n\n` +
                `💳 Thanh toán: .qr vip gold`;
            
            return api.sendMessage(message, threadID);
        }

        // Default help message
        const helpMessage = `👑 HỆ THỐNG VIP ĐƠN GIẢN\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `📋 LỆNH:\n` +
            `• .vip check - Kiểm tra VIP\n` +
            `• .vip info - Thông tin gói VIP\n` +
            `• .vip add [uid] [days] - Thêm VIP (Admin)\n` +
            `• .vip remove [uid] - Xóa VIP (Admin)\n` +
            `• .vip list - Danh sách VIP (Admin)\n\n` +
            `💡 Thanh toán: .qr vip gold`;
        
        return api.sendMessage(helpMessage, threadID);
    }
};
