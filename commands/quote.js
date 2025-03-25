const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

const QUOTES_FILE = path.join(__dirname, './json/used_quotes.json');

function initializeQuotesFile() {
    if (!fs.existsSync(path.dirname(QUOTES_FILE))) {
        fs.mkdirSync(path.dirname(QUOTES_FILE), { recursive: true });
    }
    if (!fs.existsSync(QUOTES_FILE)) {
        fs.writeFileSync(QUOTES_FILE, JSON.stringify([], null, 2));
    }
}

function getUsedQuotes() {
    try {
        initializeQuotesFile();
        return JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc quotes:', err);
        return [];
    }
}

function saveNewQuote(topic, quote) {
    try {
        const usedQuotes = getUsedQuotes();
        usedQuotes.push({
            topic: topic,
            quote: quote,
            timestamp: Date.now()
        });
        
        if (usedQuotes.length > 100) {
            usedQuotes.splice(0, usedQuotes.length - 100);
        }
        
        fs.writeFileSync(QUOTES_FILE, JSON.stringify(usedQuotes, null, 2));
    } catch (err) {
        console.error('Lỗi lưu quote:', err);
    }
}

module.exports = {
    name: "quote",
    usedby: 0,
    category: "Giải Trí",
    info: "Tạo câu nói hay theo chủ đề",
    dev: "HNT",
    onPrefix: true,
    usages: "quote [chủ đề]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "💫 Hướng dẫn sử dụng QUOTE:\n\n" +
                "→ quote [chủ đề]\n\n" +
                "Ví dụ:\n" +
                "→ quote tình yêu\n" +
                "→ quote thành công\n" +
                "→ quote cuộc sống",
                threadID, messageID
            );
        }

        const topic = target.join(" ");
        const loadingMessage = await api.sendMessage("💫 Đang nghĩ câu nói hay...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            const usedQuotes = getUsedQuotes();
            const existingQuote = usedQuotes.find(q => q.topic.toLowerCase() === topic.toLowerCase());

            const prompt = `Hãy tạo một câu nói hay bằng tiếng Việt về chủ đề "${topic}":
            - Yêu cầu:
              + Ngắn gọn, súc tích
              + Ý nghĩa sâu sắc
              + Dễ nhớ, dễ thuộc
              + Có tính truyền cảm hứng
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu nói
              + PHẢI HOÀN TOÀN MỚI${existingQuote ? ', không được giống với câu nói đã có:\n' + existingQuote.quote : ''}`;

            const result = await model.generateContent(prompt);
            const quote = result.response.text();

            saveNewQuote(topic, quote);

            const message = `💫 CHỦ ĐỀ: ${topic.toUpperCase()}\n` +
                          `\n${quote}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem câu nói khác`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({ 
                        messageID: info.messageID, 
                        name: this.name,
                        topic: topic
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Quote Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo câu nói: " + error.message, threadID, messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            const usedQuotes = getUsedQuotes();
            const existingQuote = usedQuotes.find(q => q.topic.toLowerCase() === reaction.topic.toLowerCase());

            const prompt = `Hãy tạo một câu nói hay bằng tiếng Việt về chủ đề "${reaction.topic}":
            - Yêu cầu:
              + Ngắn gọn, súc tích
              + Ý nghĩa sâu sắc
              + Dễ nhớ, dễ thuộc
              + Có tính truyền cảm hứng
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu nói
              + PHẢI HOÀN TOÀN MỚI${existingQuote ? ', không được giống với câu nói đã có:\n' + existingQuote.quote : ''}`;

            const result = await model.generateContent(prompt);
            const quote = result.response.text();

            // Lưu quote mới
            saveNewQuote(reaction.topic, quote);

            const message = `💫 CHỦ ĐỀ: ${reaction.topic.toUpperCase()}\n` +
                          `\n${quote}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem câu nói khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID, 
                name: this.name,
                topic: reaction.topic
            });

        } catch (error) {
            console.error("Quote Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo câu nói mới: " + error.message, threadID);
        }
    }
}; 