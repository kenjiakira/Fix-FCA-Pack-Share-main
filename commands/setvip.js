const { addVIP, removeVIP, checkVIP, listAllVIP } = require('../utils/vipUtils');

module.exports = {
    name: "setvip",
    dev: "HNT",
    category: "Admin",
    info: "Quản lý VIP",
    usages: [
        ".setvip add [uid] [days] - Thêm VIP",
        ".setvip add [reply] [days] - Thêm VIP cho người được reply",
        ".setvip remove [uid] - Xóa VIP", 
        ".setvip check [uid] - Kiểm tra VIP",
        ".setvip list - Danh sách VIP"
    ],
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID, messageReply } = event;
        const cmd = target[0]?.toLowerCase();
        
        const fs = require('fs');
        const path = require('path');
        const adminConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "admin.json"), "utf8"));
        const adminUIDs = adminConfig.adminUIDs || [];
        
        if (!adminUIDs.includes(senderID)) {
            return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này!", threadID);
        }

        if (cmd === "add") {
            let userID = target[1];
            const days = parseInt(target[2]) || 30;
            
            if (!userID && messageReply) {
                userID = messageReply.senderID;
            }
            
            if (!userID) {
                return api.sendMessage("❌ Vui lòng nhập UID người dùng hoặc reply tin nhắn của họ!", threadID);
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

        if (cmd === "check") {
            const userID = target[1] || senderID;
            const vipStatus = checkVIP(userID);
            
            if (vipStatus.hasVIP) {
                const message = `👑 THÔNG TIN VIP\n` +
                    `━━━━━━━━━━━━━━\n` +
                    `👤 UID: ${userID}\n` +
                    `⏰ Còn lại: ${vipStatus.daysLeft} ngày\n` +
                    `📅 Hết hạn: ${new Date(vipStatus.expireTime).toLocaleDateString('vi-VN')}\n` +
                    `━━━━━━━━━━━━━━`;
                return api.sendMessage(message, threadID);
            } else {
                return api.sendMessage(`❌ ${userID}: ${vipStatus.message}`, threadID);
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
                message += `   ⏰ ${user.daysLeft} ngày\n`;
                message += `   📅 ${user.expireDate}\n\n`;
            });
            
            return api.sendMessage(message, threadID);
        }

        
        const helpMessage = `👑 QUẢN LÝ VIP (ADMIN)\n` +
            `━━━━━━━━━━━━━━\n\n` +
            `📋 LỆNH:\n` +
            `• .setvip add [uid] [days] - Thêm VIP\n` +
            `• .setvip add [reply] [days] - Thêm VIP cho người được reply\n` +
            `• .setvip remove [uid] - Xóa VIP\n` +
            `• .setvip check [uid] - Kiểm tra VIP\n` +
            `• .setvip list - Danh sách VIP\n\n` +
            `💡 Ví dụ:\n` +
            `• .setvip add 1000123456789 30\n` +
            `• Reply tin nhắn + .setvip add 30`;
        
        return api.sendMessage(helpMessage, threadID);
    }
};
