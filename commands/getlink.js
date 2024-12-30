module.exports = {
    name: "getlink",
    usedby: 0,
    dev: "Mirai Team and CC PROJECT TEAM",
    info: "Lấy URL Tải xuống từ Video, Âm thanh được gửi từ nhóm",
    onPrefix: false,
    dmUser: false,
    usages: "getLink",
    cooldowns: 5,

    onLaunch: async ({ api, event }) => {
        const errorMessage = "❌ Bạn cần trả lời một tin nhắn có chứa âm thanh, video hoặc hình ảnh";

        if (event.type !== "message_reply") {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        if (event.messageReply.attachments.length > 1) {
            return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }

        return api.sendMessage(
            event.messageReply.attachments[0].url,
            event.threadID,
            event.messageID
        );
    }
};