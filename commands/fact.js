const axios = require("axios");
const translate = require('translate-google');

module.exports = {
    name: "fact",
    usedby: 0,
    info: "sự thật ngẫu nhiên",
    dev: "HNT",
    onPrefix: true,
    usages: "fact",
    cooldowns: 5,

    onLaunch: async function ({ api, event }) {
        const loadingMessage = "⏳ Đang tìm kiếm sự thật thú vị...";
        const messageID = await api.sendMessage(loadingMessage, event.threadID);

        try {
            const response = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
            const randomFact = response.data.text;

            const translatedFact = await translate(randomFact, { to: 'vi' });

            const factMessage = `📚 SỰ THẬT THÚ VỊ 📚\n\n` +
                              `🇻🇳 ${translatedFact}\n\n` +
                              `🇬🇧 ${randomFact}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `💡 Gõ "fact" để xem thêm sự thật khác`;

            api.unsendMessage(messageID.messageID);
            return api.sendMessage(factMessage, event.threadID, event.messageID);

        } catch (error) {
            api.unsendMessage(messageID.messageID);
            console.error('Fact Command Error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, event.threadID, event.messageID);
        }
    }
};
