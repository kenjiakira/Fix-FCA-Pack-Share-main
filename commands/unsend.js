const fs = require('fs');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
    name: "unsend",
    usedby: 0,
    dev: "HNT",
    onPrefix: false,
    cooldowns: 1,
    nickName: ["un", "gỡ", "xóa"],
    info: "Hủy tin nhắn",

    onLaunch: async function ({ api, event }) {
        try {
            let userIsGroupAdmin = false;
            try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                if (threadInfo?.adminIDs) {
                    userIsGroupAdmin = threadInfo.adminIDs.some(idInfo => idInfo.id === event.senderID);
                }
            } catch (err) {
                console.error("Error getting thread info:", err);
            }

            const userIsConfigAdmin = adminConfig.adminUIDs.includes(event.senderID);

            if (!userIsGroupAdmin && !userIsConfigAdmin) {
                return api.sendMessage("⚠️ Chỉ QTV nhóm và admin bot được dùng lệnh này!", event.threadID);
            }

            if (event.type !== "message_reply") {
                return api.sendMessage("❌ Vui lòng reply tin nhắn cần gỡ!", event.threadID);
            }

            if (event.messageReply.senderID !== api.getCurrentUserID()) {
                return api.sendMessage("⚠️ Chỉ có thể gỡ tin nhắn của bot!", event.threadID);
            }

            const messageAge = Date.now() - event.messageReply.timestamp;
            if (messageAge > 3600000) {
                return api.sendMessage("⚠️ Không thể gỡ tin nhắn cũ hơn 1 giờ!", event.threadID);
            }

            await api.unsendMessage(event.messageReply.messageID);

        } catch (error) {
            console.error("Unsend error:", error);
            return api.sendMessage("❌ Lỗi!", event.threadID);
        }
    }
};
