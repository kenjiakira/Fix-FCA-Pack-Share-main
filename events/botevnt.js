const chatbot = require("../commands/chatbot");

module.exports = {
    name: "botevnt",
    version: "1.0",
    author: "HNT",
    onEvents: async function({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        
        if (!body || event.type !== "message") return;

        if (body.toLowerCase().includes("bot")) {
            try {
                const response = await chatbot.generateResponse(body, senderID, api, threadID); 
                const sent = await api.sendMessage(response, threadID, messageID);
                
                if (sent) {
                    global.client.onReply.push({
                        name: "chatbot",
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
