const fs = require('fs');

module.exports = {
    name: "removemod",
    aliases: ["rmd"],
    dev: "HNT",
    info: "Xóa điều hành viên bot",
    usedby: 2,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/removemod [uid/reply tin nhắn] - Xóa mod"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageReply } = event;
        
        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const targetID = target[0] || messageReply?.senderID;

            if (!targetID) {
                return api.sendMessage("❌ Vui lòng tag hoặc reply người dùng cần xóa khỏi mod!", threadID);
            }

            if (!adminConfig.moderatorUIDs?.includes(targetID)) {
                return api.sendMessage("❌ Người dùng này không phải là Mod!", threadID);
            }

            const userInfo = await api.getUserInfo(targetID);
            const userName = userInfo[targetID]?.name || targetID;

            adminConfig.moderatorUIDs = adminConfig.moderatorUIDs.filter(id => id !== targetID);
            fs.writeFileSync("./admin.json", JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã xóa điều hành viên thành công!\n` +
                `👤 Tên: ${userName}\n` +
                `🆔 ID: ${targetID}`,
                threadID
            );

        } catch (error) {
            console.error("Error in removemod command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi xóa mod!", threadID);
        }
    }
};
