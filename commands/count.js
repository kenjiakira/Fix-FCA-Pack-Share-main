module.exports = {
    name: "count",
    dev: "HNT",
    usedby: 0,
    category: "Tiện Ích",
    info: "Đếm số ký tự trong 1 tin nhắn bất kì",
    onPrefix: true,
    usages: ".count <text>: Đếm số ký tự trong tin nhắn hoặc trả lời tin nhắn để đếm.",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, messageReply, target } = event;
        
        let textToCount = "";
        
        if (messageReply) {
            textToCount = messageReply.body;
        } else if (target.length > 0) {
            textToCount = target.join(" ");
        } else {
            return api.sendMessage("📝 Vui lòng nhập nội dung cần đếm hoặc trả lời một tin nhắn.", threadID, messageID);
        }

        const messageWithoutSpaces = textToCount.replace(/\s+/g, '');
        const charCount = messageWithoutSpaces.length;

        return api.sendMessage(`🔢 Tin nhắn có ${charCount} ký tự.`, threadID, messageID);
    }
};
