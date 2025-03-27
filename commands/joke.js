const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../utils/api');

module.exports = {
    name: "joke",
    usedby: 0,
    category: "Giải Trí",
    info: "xem truyện cười ngẫu nhiên",
    dev: "HNT",
    onPrefix: true,
    usages: "joke",
    cooldowns: 5,

    onLaunch: async function ({ api, event, actions }) {
        const replyMessage = await actions.reply("Đang nghĩ ra câu chuyện cười.......");

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Kể một câu chuyện cười ngắn bằng tiếng Việt, phải thật hài hước, dễ hiểu và phù hợp mọi lứa tuổi. Không quá 4 dòng.`;

            const result = await model.generateContent(prompt);
            const joke = result.response.text();

            const jokeMessage = `😄 TRUYỆN CƯỜI 😄\n\n${joke}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem truyện cười khác`;

            await actions.edit(jokeMessage, replyMessage.messageID);
            global.client.callReact.push({ 
                messageID: replyMessage.messageID, 
                name: this.name 
            });
        } catch (error) {
            console.error('Joke Command Error:', error);
            await actions.edit("❌ Đã xảy ra lỗi: " + error.message, replyMessage.messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Kể một câu chuyện cười ngắn bằng tiếng Việt, phải thật hài hước, dễ hiểu và phù hợp mọi lứa tuổi. Không quá 4 dòng.`;
            
            const result = await model.generateContent(prompt);
            const joke = result.response.text();

            const jokeMessage = `😄 TRUYỆN CƯỜI 😄\n\n${joke}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem truyện cười khác`;

            const sent = await api.sendMessage(jokeMessage, threadID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });
        } catch (error) {
            api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, threadID);
        }
    }
};
