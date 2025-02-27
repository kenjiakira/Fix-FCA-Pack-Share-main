const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');

module.exports = {
    name: "fact",
    usedby: 0,
    info: "sự thật ngẫu nhiên",
    dev: "HNT",
    category: "Giải Trí",
    onPrefix: true,
    usages: "fact",
    cooldowns: 5,

    onLaunch: async function ({ api, event }) {
        const loadingMessage = "⏳ Đang tìm kiếm sự thật thú vị...";
        const messageID = await api.sendMessage(loadingMessage, event.threadID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Chia sẻ một sự thật thú vị và bất ngờ bằng tiếng Việt về khoa học, lịch sử, hoặc thế giới tự nhiên. Sự thật phải chính xác, súc tích và dễ hiểu. Không quá 4 dòng.`;

            const result = await model.generateContent(prompt);
            const fact = result.response.text();

            const factMessage = `📚 SỰ THẬT THÚ VỊ 📚\n\n${fact}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem sự thật khác`;

            api.unsendMessage(messageID.messageID);
            const sent = await api.sendMessage(factMessage, event.threadID, event.messageID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });
        } catch (error) {
            api.unsendMessage(messageID.messageID);
            console.error('Fact Command Error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, event.threadID, event.messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Chia sẻ một sự thật thú vị và bất ngờ bằng tiếng Việt về khoa học, lịch sử, hoặc thế giới tự nhiên. Sự thật phải chính xác, súc tích và dễ hiểu. Không quá 4 dòng.`;
            
            const result = await model.generateContent(prompt);
            const fact = result.response.text();

            const factMessage = `📚 SỰ THẬT THÚ VỊ 📚\n\n${fact}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem sự thật khác`;

            const sent = await api.sendMessage(factMessage, threadID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });
        } catch (error) {
            api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, threadID);
        }
    }
};
