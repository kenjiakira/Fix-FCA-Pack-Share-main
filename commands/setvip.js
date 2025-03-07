const vipService = require('../vip/vipService');
const { getPackageById } = require('../vip/vipConfig');

module.exports = {
    name: "setvip",
    dev: "HNT",
    category: "Admin Commands",
    info: "Quản lý người dùng VIP",
    onPrefix: true,
    usages: [
        "setvip set [@tag/reply/ID] [1/2/3] - Set VIP cho người dùng",
        "setvip check [@tag/reply/ID] - Kiểm tra VIP của người dùng",
        "setvip remove [@tag/reply/ID] - Xóa VIP của người dùng"
    ].join('\n'),
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
                const packageId = parseInt(target[target.length - 1]);
                if (![1, 2, 3].includes(packageId)) {
                    return api.sendMessage("❌ Gói VIP không hợp lệ! (1: Bronze, 2: Silver, 3: Gold)", threadID, messageID);
                }

                const duration = packageId === 3 ? 37 : 30; 
                const result = vipService.setVIP(userID, packageId, duration);
                
                if (!result.success) {
                    return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
                }

                const durationText = packageId === 3 ? "37 ngày (30+7 bonus)" : "30 ngày";
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
