const fs = require('fs');

module.exports = {
    name: "addmod",
    aliases: ["amd"],
    dev: "HNT",
    info: "Thêm điều hành viên bot mới",
    usedby: 2,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/addmod [uid/reply tin nhắn] - Thêm mod mới"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageReply } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const targetID = target[0] || messageReply?.senderID;

            if (!targetID) {
                return api.sendMessage("❌ Vui lòng tag hoặc reply người dùng cần thêm làm mod!", threadID);
            }

            if (adminConfig.adminUIDs.includes(targetID)) {
                return api.sendMessage("❌ Người dùng này đã là Admin, không thể thêm làm Mod!", threadID);
            }

            if (!adminConfig.moderatorUIDs) {
                adminConfig.moderatorUIDs = [];
            }

            if (adminConfig.moderatorUIDs.includes(targetID)) {
                return api.sendMessage("❌ Người dùng này đã là Mod!", threadID);
            }

            const userInfo = await api.getUserInfo(targetID);
            const userName = userInfo[targetID]?.name || targetID;

            adminConfig.moderatorUIDs.push(targetID);
            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã thêm điều hành viên mới thành công!\n` +
                `👤 Tên: ${userName}\n` +
                `🆔 ID: ${targetID}`,
                threadID
            );

        } catch (error) {
            console.error("Error in addmod command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thêm mod!", threadID);
        }
    }
};
