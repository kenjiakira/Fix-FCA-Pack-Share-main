const chatbot = require("../commands/bot");

const TRIGGER_KEYWORDS = [
    "ngân", 
    "con ngân"
];

const containsTriggerWord = (text) => {
    text = text.toLowerCase();
    return TRIGGER_KEYWORDS.some(keyword => text.includes(keyword));
};

module.exports = {
    name: "botevnt",
    version: "1.0", 
    author: "HNT",
    onEvents: async function({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        
        if (!body || event.type !== "message") return;

        // Skip nếu tin nhắn bắt đầu bằng "bot" (để commands xử lý)
        if (body.toLowerCase().trim().startsWith("bot")) return;

        if (containsTriggerWord(body)) {
            try {
                const response = await chatbot.generateResponse(body, senderID, threadID);
                
                chatbot.updateHistory(threadID, body, response, senderID);
                
                const sent = await api.sendMessage(response, threadID, messageID);
                
                if (sent) {
                    global.client.onReply.push({
                        name: "bot",
                        messageID: sent.messageID,
                        author: senderID
                    });
                }
            } catch (error) {
                console.error("Chatbot auto-response error:", error);
                api.sendMessage("❌ Có lỗi xảy ra khi xử lý tin nhắn", threadID, messageID);
            }
        }
    }
};
