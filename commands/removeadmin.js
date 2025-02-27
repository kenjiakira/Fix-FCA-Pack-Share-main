const fs = require('fs');

module.exports = {
    name: "removeadmin",
    aliases: ["rad"],
    dev: "HNT", 
    info: "Xóa quản trị viên bot",
    usedby: 2,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/removeadmin [uid/reply tin nhắn] - Xóa admin"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageReply, senderID } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const targetID = target[0] || messageReply?.senderID;

            if (!targetID) {
                return api.sendMessage("❌ Vui lòng tag hoặc reply người dùng cần xóa khỏi admin!", threadID);
            }

            if (targetID === senderID) {
                return api.sendMessage("❌ Bạn không thể tự xóa quyền admin của chính mình!", threadID);
            }

            if (!adminConfig.adminUIDs.includes(targetID)) {
                return api.sendMessage("❌ Người dùng này không phải là Admin!", threadID);
            }

            const userInfo = await api.getUserInfo(targetID);
            const userName = userInfo[targetID]?.name || targetID;

            adminConfig.adminUIDs = adminConfig.adminUIDs.filter(id => id !== targetID);
            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã xóa admin thành công!\n` +
                `👤 Tên: ${userName}\n` +
                `🆔 ID: ${targetID}`,
                threadID
            );

        } catch (error) {
            console.error("Error in removeadmin command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi xóa admin!", threadID);
        }
    }
};
