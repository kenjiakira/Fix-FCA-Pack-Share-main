module.exports = {
    name: "count",
    dev: "HNT",
    usedby: 0,
    info: "Đếm số ký tự trong 1 tin nhắn bất kì",
    onPrefix: true,
    usages: ".count: Đếm số ký tự trong tin nhắn trả lời, không tính dấu cách.",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply) {
            return api.sendMessage("❎ Vui lòng trả lời một tin nhắn để sử dụng lệnh này.", threadID, messageID);
        }

        const repliedMessage = messageReply.body;

        const messageWithoutSpaces = repliedMessage.replace(/\s+/g, '');

        const charCount = messageWithoutSpaces.length;

        return api.sendMessage(`🔢 Tin nhắn bạn trả lời có ${charCount} ký tự.`, threadID, messageID);
    }
};
