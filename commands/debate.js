const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../utils/api');
const fs = require('fs');
const path = require('path');

const DEBATES_FILE = path.join(__dirname, './json/AI/used_debates.json');

function initializeDebatesFile() {
    if (!fs.existsSync(path.dirname(DEBATES_FILE))) {
        fs.mkdirSync(path.dirname(DEBATES_FILE), { recursive: true });
    }
    if (!fs.existsSync(DEBATES_FILE)) {
        fs.writeFileSync(DEBATES_FILE, JSON.stringify([], null, 2));
    }
}

function getUsedDebates() {
    try {
        initializeDebatesFile();
        return JSON.parse(fs.readFileSync(DEBATES_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc debates:', err);
        return [];
    }
}

function saveNewDebate(topic, analysis) {
    try {
        const usedDebates = getUsedDebates();
        usedDebates.push({
            topic: topic,
            analysis: analysis,
            timestamp: Date.now()
        });
        
        if (usedDebates.length > 100) {
            usedDebates.splice(0, usedDebates.length - 100);
        }
        
        fs.writeFileSync(DEBATES_FILE, JSON.stringify(usedDebates, null, 2));
    } catch (err) {
        console.error('Lỗi lưu debate:', err);
    }
}

module.exports = {
    name: "debate",
    usedby: 0,
    category: "AI",
    info: "Phân tích đa chiều một vấn đề",
    dev: "HNT",
    onPrefix: true,
    usages: "debate [vấn đề]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "⚖️ Hướng dẫn sử dụng DEBATE:\n\n" +
                "→ debate [vấn đề]\n\n" +
                "Ví dụ:\n" +
                "→ debate học online\n" +
                "→ debate mạng xã hội\n" +
                "→ debate năng lượng hạt nhân",
                threadID, messageID
            );
        }

        const topic = target.join(" ");
        const loadingMessage = await api.sendMessage("⚖️ Đang phân tích vấn đề...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });

            const usedDebates = getUsedDebates();
            const existingDebate = usedDebates.find(d => d.topic.toLowerCase() === topic.toLowerCase());

            const prompt = `Hãy phân tích vấn đề "${topic}" bằng tiếng Việt một cách khách quan:
            - Yêu cầu:
              + Nêu ưu điểm và nhược điểm
              + Dẫn chứng cụ thể, thực tế
              + Đưa ra các góc nhìn khác nhau
              + Không thiên vị
              + Kết luận mở
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung phân tích
              + PHẢI HOÀN TOÀN MỚI${existingDebate ? ', không được giống với phân tích đã có:\n' + existingDebate.analysis : ''}`;

            const result = await model.generateContent(prompt);
            const analysis = result.response.text();

            // Lưu debate mới
            saveNewDebate(topic, analysis);

            const message = `⚖️ PHÂN TÍCH: ${topic.toUpperCase()}\n` +
                          `\n${analysis}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem phân tích khác`;

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
            console.error("Debate Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi phân tích: " + error.message, threadID, messageID);
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
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });

            const usedDebates = getUsedDebates();
            const existingDebate = usedDebates.find(d => d.topic.toLowerCase() === reaction.topic.toLowerCase());

            const prompt = `Hãy phân tích vấn đề "${reaction.topic}" bằng tiếng Việt một cách khách quan:
            - Yêu cầu:
              + Nêu ưu điểm và nhược điểm
              + Dẫn chứng cụ thể, thực tế
              + Đưa ra các góc nhìn khác nhau
              + Không thiên vị
              + Kết luận mở
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung phân tích
              + PHẢI HOÀN TOÀN MỚI${existingDebate ? ', không được giống với phân tích đã có:\n' + existingDebate.analysis : ''}`;

            const result = await model.generateContent(prompt);
            const analysis = result.response.text();

            // Lưu debate mới
            saveNewDebate(reaction.topic, analysis);

            const message = `⚖️ PHÂN TÍCH: ${reaction.topic.toUpperCase()}\n` +
                          `\n${analysis}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem phân tích khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID, 
                name: this.name,
                topic: reaction.topic
            });

        } catch (error) {
            console.error("Debate Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi phân tích mới: " + error.message, threadID);
        }
    }
}; 