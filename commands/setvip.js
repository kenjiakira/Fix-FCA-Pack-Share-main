const vipService = require('../game/vip/vipService');

module.exports = {
    name: "setvip",
    dev: "HNT",
    category: "Admin Commands",
    info: "Quản lý người dùng VIP",
    onPrefix: true,
    usages: [],
    cooldowns: 0,
    usedby: 2,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, mentions, messageReply } = event;
        
        if (!target[0]) {
            return api.sendMessage(this.usages, threadID, messageID);
        }

        let userID;
        const action = target[0].toLowerCase();

        if (Object.keys(mentions).length > 0) {
            userID = Object.keys(mentions)[0];
        } else if (messageReply) {
            userID = messageReply.senderID;
        } else if (target[1]) {
            userID = target[1];
        }

        if (!userID) {
            return api.sendMessage("❌ Vui lòng tag người dùng, reply tin nhắn hoặc nhập ID!", threadID, messageID);
        }

        switch (action) {
            case "set": {
                // Only Gold VIP (packageId 3) is available
                const packageId = 3;

                const result = vipService.setVIP(userID, packageId, 1);
                
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }

                const durationText = "37 ngày (30+7 bonus)";
                return api.sendMessage(
                    `✅ Đã set ${result.packageName} cho ID: ${userID}\n` +
                    `⏳ Thời hạn: ${durationText}\n` +
                    `📅 Hết hạn: ${new Date(result.expireTime).toLocaleString('vi-VN')}`,
                    threadID, messageID
                );
            }

            case "check": {
                const result = vipService.checkVIP(userID);
                
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }

                return api.sendMessage(
                    `👑 Thông tin VIP của ID: ${userID}\n` +
                    `📋 Gói: ${result.packageName}\n` +
                    `⏳ Còn lại: ${result.daysLeft} ngày\n` +
                    `📅 Hết hạn: ${new Date(result.expireTime).toLocaleString('vi-VN')}`,
                    threadID, messageID
                );
            }

            case "remove": {
                const result = vipService.removeVIP(userID);
                
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }

                return api.sendMessage(`✅ Đã xóa VIP của ID: ${userID}`, threadID, messageID);
            }

            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!\n" + this.usages, threadID, messageID);
        }
    }
};
