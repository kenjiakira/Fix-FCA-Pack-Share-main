const fs = require('fs');

module.exports = {
    name: "addadmin",
    aliases: ["aad"],
    dev: "HNT",
    info: "Thêm quản trị viên bot mới",
    usedby: 2,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/addadmin [uid/reply tin nhắn] - Thêm admin mới"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageReply } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const targetID = target[0] || messageReply?.senderID;

            if (!targetID) {
                return api.sendMessage("❌ Vui lòng tag hoặc reply người dùng cần thêm làm admin!", threadID);
            }

            if (adminConfig.adminUIDs.includes(targetID)) {
                return api.sendMessage("❌ Người dùng này đã là Admin!", threadID);
            }

            const userInfo = await api.getUserInfo(targetID);
            const userName = userInfo[targetID]?.name || targetID;

            adminConfig.adminUIDs.push(targetID);
            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã thêm admin mới thành công!\n` +
                `👤 Tên: ${userName}\n` +
                `🆔 ID: ${targetID}`,
                threadID
            );

        } catch (error) {
            console.error("Error in addadmin command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thêm admin!", threadID);
        }
    }
};
