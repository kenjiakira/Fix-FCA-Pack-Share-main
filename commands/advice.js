const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file lưu trữ advices đã sử dụng
const ADVICES_FILE = path.join(__dirname, './json/used_advices.json');

// Khởi tạo file nếu chưa tồn tại
function initializeAdvicesFile() {
    if (!fs.existsSync(path.dirname(ADVICES_FILE))) {
        fs.mkdirSync(path.dirname(ADVICES_FILE), { recursive: true });
    }
    if (!fs.existsSync(ADVICES_FILE)) {
        fs.writeFileSync(ADVICES_FILE, JSON.stringify([], null, 2));
    }
}

// Đọc advices đã sử dụng
function getUsedAdvices() {
    try {
        initializeAdvicesFile();
        return JSON.parse(fs.readFileSync(ADVICES_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc advices:', err);
        return [];
    }
}

// Lưu advice mới
function saveNewAdvice(problem, advice) {
    try {
        const usedAdvices = getUsedAdvices();
        usedAdvices.push({
            problem: problem,
            advice: advice,
            timestamp: Date.now()
        });

        // Chỉ giữ lại 100 advices gần nhất
        if (usedAdvices.length > 100) {
            usedAdvices.splice(0, usedAdvices.length - 100);
        }

        fs.writeFileSync(ADVICES_FILE, JSON.stringify(usedAdvices, null, 2));
    } catch (err) {
        console.error('Lỗi lưu advice:', err);
    }
}

module.exports = {
    name: "advice",
    usedby: 0,
    category: "AI",
    info: "Tư vấn và giải quyết vấn đề",
    dev: "HNT",
    onPrefix: true,
    usages: "advice [vấn đề]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "💭 Hướng dẫn sử dụng ADVICE:\n\n" +
                "→ advice [vấn đề]\n\n" +
                "Ví dụ:\n" +
                "→ advice stress khi học\n" +
                "→ advice mất động lực\n" +
                "→ advice khó ngủ",
                threadID, messageID
            );
        }

        const problem = target.join(" ");
        const loadingMessage = await api.sendMessage("💭 Đang tìm lời khuyên phù hợp...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });

            const usedAdvices = getUsedAdvices();
            const existingAdvice = usedAdvices.find(a => a.problem.toLowerCase() === problem.toLowerCase());

            const prompt = `Hãy đưa ra lời khuyên cho vấn đề "${problem}" bằng tiếng Việt:
            - Yêu cầu:
              + Thấu hiểu và đồng cảm
              + Đưa ra nhiều giải pháp khả thi
              + Phân tích ưu nhược điểm mỗi giải pháp
              + Lời khuyên thực tế, dễ thực hiện
              + Động viên, khích lệ tinh thần
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung lời khuyên
              + PHẢI HOÀN TOÀN MỚI${existingAdvice ? ', không được giống với lời khuyên đã có:\n' + existingAdvice.advice : ''}`;

            const result = await model.generateContent(prompt);
            const advice = result.response.text();

            // Lưu advice mới
            saveNewAdvice(problem, advice);

            const message = `💭 LỜI KHUYÊN: ${problem.toUpperCase()}\n` +
                `\n${advice}\n` +
                `\n━━━━━━━━━━━━━━━━━━━\n` +
                `👍 Thả cảm xúc để xem lời khuyên khác`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({
                        messageID: info.messageID,
                        name: this.name,
                        problem: problem
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Advice Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi tư vấn: " + error.message, threadID, messageID);
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

            const usedAdvices = getUsedAdvices();
            const existingAdvice = usedAdvices.find(a => a.problem.toLowerCase() === reaction.problem.toLowerCase());

            const prompt = `Hãy đưa ra lời khuyên cho vấn đề "${reaction.problem}" bằng tiếng Việt:
            - Yêu cầu:
              + Thấu hiểu và đồng cảm
              + Đưa ra nhiều giải pháp khả thi
              + Phân tích ưu nhược điểm mỗi giải pháp
              + Lời khuyên thực tế, dễ thực hiện
              + Động viên, khích lệ tinh thần
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung lời khuyên
              + PHẢI HOÀN TOÀN MỚI${existingAdvice ? ', không được giống với lời khuyên đã có:\n' + existingAdvice.advice : ''}`;

            const result = await model.generateContent(prompt);
            const advice = result.response.text();

            // Lưu advice mới
            saveNewAdvice(reaction.problem, advice);

            const message = `💭 LỜI KHUYÊN: ${reaction.problem.toUpperCase()}\n` +
                `\n${advice}\n` +
                `\n━━━━━━━━━━━━━━━━━━━\n` +
                `👍 Thả cảm xúc để xem lời khuyên khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({
                messageID: sent.messageID,
                name: this.name,
                problem: reaction.problem
            });

        } catch (error) {
            console.error("Advice Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tư vấn mới: " + error.message, threadID);
        }
    }
}; 