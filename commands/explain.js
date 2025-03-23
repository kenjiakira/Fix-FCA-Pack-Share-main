const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file lưu trữ explanations đã sử dụng
const EXPLANATIONS_FILE = path.join(__dirname, './json/used_explanations.json');

// Khởi tạo file nếu chưa tồn tại
function initializeExplanationsFile() {
    if (!fs.existsSync(path.dirname(EXPLANATIONS_FILE))) {
        fs.mkdirSync(path.dirname(EXPLANATIONS_FILE), { recursive: true });
    }
    if (!fs.existsSync(EXPLANATIONS_FILE)) {
        fs.writeFileSync(EXPLANATIONS_FILE, JSON.stringify([], null, 2));
    }
}

// Đọc explanations đã sử dụng
function getUsedExplanations() {
    try {
        initializeExplanationsFile();
        return JSON.parse(fs.readFileSync(EXPLANATIONS_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc explanations:', err);
        return [];
    }
}

// Lưu explanation mới
function saveNewExplanation(concept, explanation) {
    try {
        const usedExplanations = getUsedExplanations();
        usedExplanations.push({
            concept: concept,
            explanation: explanation,
            timestamp: Date.now()
        });
        
        // Chỉ giữ lại 100 explanations gần nhất
        if (usedExplanations.length > 100) {
            usedExplanations.splice(0, usedExplanations.length - 100);
        }
        
        fs.writeFileSync(EXPLANATIONS_FILE, JSON.stringify(usedExplanations, null, 2));
    } catch (err) {
        console.error('Lỗi lưu explanation:', err);
    }
}

module.exports = {
    name: "explain",
    usedby: 0,
    category: "AI",
    info: "Giải thích khái niệm phức tạp một cách đơn giản",
    dev: "HNT",
    onPrefix: true,
    usages: "explain [khái niệm]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎓 Hướng dẫn sử dụng EXPLAIN:\n\n" +
                "→ explain [khái niệm]\n\n" +
                "Ví dụ:\n" +
                "→ explain lạm phát\n" +
                "→ explain trí tuệ nhân tạo\n" +
                "→ explain hiệu ứng nhà kính",
                threadID, messageID
            );
        }

        const concept = target.join(" ");
        const loadingMessage = await api.sendMessage("🎓 Đang tìm cách giải thích đơn giản...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });

            const usedExplanations = getUsedExplanations();
            const existingExplanation = usedExplanations.find(e => e.concept.toLowerCase() === concept.toLowerCase());

            const prompt = `Hãy giải thích khái niệm "${concept}" bằng tiếng Việt theo yêu cầu sau:
            - Đối tượng: Người không chuyên
            - Yêu cầu:
              + Giải thích đơn giản, dễ hiểu
              + Dùng ví dụ thực tế, gần gũi
              + Tránh thuật ngữ chuyên môn
              + Ngắn gọn (2-3 đoạn)
              + Có thể dùng ẩn dụ hoặc so sánh
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung giải thích
              + PHẢI HOÀN TOÀN MỚI${existingExplanation ? ', không được giống với giải thích đã có:\n' + existingExplanation.explanation : ''}`;

            const result = await model.generateContent(prompt);
            const explanation = result.response.text();

            // Lưu explanation mới
            saveNewExplanation(concept, explanation);

            const message = `🎓 GIẢI THÍCH: ${concept.toUpperCase()}\n` +
                          `\n${explanation}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem cách giải thích khác`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({ 
                        messageID: info.messageID, 
                        name: this.name,
                        concept: concept
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Explain Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi giải thích: " + error.message, threadID, messageID);
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

            const usedExplanations = getUsedExplanations();
            const existingExplanation = usedExplanations.find(e => e.concept.toLowerCase() === reaction.concept.toLowerCase());

            const prompt = `Hãy giải thích khái niệm "${reaction.concept}" bằng tiếng Việt theo yêu cầu sau:
            - Đối tượng: Người không chuyên
            - Yêu cầu:
              + Giải thích đơn giản, dễ hiểu
              + Dùng ví dụ thực tế, gần gũi
              + Tránh thuật ngữ chuyên môn
              + Ngắn gọn (2-3 đoạn)
              + Có thể dùng ẩn dụ hoặc so sánh
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung giải thích
              + PHẢI HOÀN TOÀN MỚI${existingExplanation ? ', không được giống với giải thích đã có:\n' + existingExplanation.explanation : ''}`;

            const result = await model.generateContent(prompt);
            const explanation = result.response.text();

            // Lưu explanation mới
            saveNewExplanation(reaction.concept, explanation);

            const message = `🎓 GIẢI THÍCH: ${reaction.concept.toUpperCase()}\n` +
                          `\n${explanation}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem cách giải thích khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID, 
                name: this.name,
                concept: reaction.concept
            });

        } catch (error) {
            console.error("Explain Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi giải thích mới: " + error.message, threadID);
        }
    }
}; 