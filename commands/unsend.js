module.exports = {
    name: "unsend",
    usedby: 1,
    dev: "HNT",
    onPrefix: false,
    cooldowns: 1,
    nickName: ["un", "gỡ", "xóa"],
    info: "Hủy tin nhắn",

    onLaunch: async function ({ api, event }) {
        const { threadID } = event;

        try {
            if (event.type !== "message_reply") {
                return api.sendMessage("❌ Vui lòng reply tin nhắn cần gỡ!", threadID);
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
            if (error.error === 3252001) {
                console.log("Bot temporarily blocked from unsending");
                return;
            }
            return api.sendMessage("❌ Không thể gỡ tin nhắn!", event.threadID);
        }
    }
};
