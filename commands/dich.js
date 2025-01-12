const axios = require('axios');
const translate = require('translate-google');

module.exports = {
    name: "dich",
    dev:"HNT",
    usedby: 0,
    info: "Dịch văn bản qua nhiều ngôn ngữ",
    usages: "dich <text> | <lang> hoặc reply tin nhắn với 'dich <lang>'",
    cooldowns: 5,

    langCodes: {
        'việt': 'vi',
        'anh': 'en', 
        'nhật': 'ja',
        'hàn': 'ko',
        'trung': 'zh',
        'pháp': 'fr',
        'đức': 'de',
        'ý': 'it',
        'tây ban nha': 'es',
        'nga': 'ru'
    },

    async translate(text, targetLang = 'vi') {
        try {
            const result = await translate(text, {to: targetLang});
            
            if (!result) {
                throw new Error("Không thể dịch văn bản này!");
            }
            
            return result;
        } catch (err) {
            if (err.code === 'BAD_NETWORK') {
                throw new Error("Lỗi kết nối mạng!");
            }
            throw new Error("Lỗi dịch thuật: " + err.message);
        }
    },

    getLanguageCode(input) {
        input = input.toLowerCase();
        return this.langCodes[input] || input;
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID } = event;
        
        if (!event.messageReply?.body) {
            return api.sendMessage("❌ Không tìm thấy nội dung để dịch!", threadID);
        }

        const langCode = this.getLanguageCode(event.body.toLowerCase().replace("dich", "").trim()) || 'vi';
        
        try {
            const translatedText = await this.translate(event.messageReply.body, langCode);
            return api.sendMessage(
                `🌐 Bản dịch (${langCode}):\n\n${translatedText}`, 
                threadID,
                messageID
            );
        } catch (err) {
            return api.sendMessage(
                "❌ Lỗi: " + err.message, 
                threadID,
                messageID
            );
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (event.type === "message_reply") {
            return this.onReply({ api, event });
        }

        const text = target.join(" ");
        if (!text) {
            return api.sendMessage(
                "📝 Hướng dẫn sử dụng:\n" +
                "1. Dịch trực tiếp: dich <văn bản> | <mã ngôn ngữ>\n" +
                "2. Dịch qua reply: Reply một tin nhắn với 'dich <mã ngôn ngữ>'\n\n" +
                "Các ngôn ngữ hỗ trợ:\n" +
                Object.entries(this.langCodes)
                    .map(([name, code]) => `- ${name}: ${code}`)
                    .join("\n"),
                threadID
            );
        }

        const [content, langCode = 'vi'] = text.split("|").map(s => s.trim());
        
        try {
            const translatedText = await this.translate(content, this.getLanguageCode(langCode));
            return api.sendMessage(
                `🌐 Bản dịch (${langCode}):\n\n${translatedText}`, 
                threadID,
                messageID
            );
        } catch (err) {
            return api.sendMessage(
                "❌ Lỗi: " + err.message, 
                threadID,
                messageID
            );
        }
    }
};
