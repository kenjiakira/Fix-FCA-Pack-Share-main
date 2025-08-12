const { useGPTWithHistory } = require('../utils/gptHook');
const fs = require('fs');
const path = require('path');

const ADVICES_FILE = path.join(__dirname, './json/used_advices.json');

function initializeAdvicesFile() {
    if (!fs.existsSync(path.dirname(ADVICES_FILE))) {
        fs.mkdirSync(path.dirname(ADVICES_FILE), { recursive: true });
    }
    if (!fs.existsSync(ADVICES_FILE)) {
        fs.writeFileSync(ADVICES_FILE, JSON.stringify([], null, 2));
    }
}

function getUsedAdvices() {
    try {
        initializeAdvicesFile();
        return JSON.parse(fs.readFileSync(ADVICES_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc advices:', err);
        return [];
    }
}

function saveNewAdvice(problem, advice) {
    try {
        const usedAdvices = getUsedAdvices();
        usedAdvices.push({
            problem: problem,
            advice: advice,
            timestamp: Date.now()
        });

        if (usedAdvices.length > 100) {
            usedAdvices.splice(0, usedAdvices.length - 100);
        }

        fs.writeFileSync(ADVICES_FILE, JSON.stringify(usedAdvices, null, 2));
    } catch (err) {
        console.error('Lỗi lưu advice:', err);
    }
}

module.exports = {
    aliases: [],
    name: "advice",
    usedby: 0,
    category: "AI",
    info: "Tư vấn và giải quyết vấn đề",
    dev: "Hoàng Ngọc Từ",
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
            const usedAdvices = getUsedAdvices();

            const advice = await useGPTWithHistory({
                prompt: `Hãy đưa ra lời khuyên cho vấn đề "${problem}"`,
                systemPrompt: `Bạn là một chuyên gia tư vấn tâm lý có kinh nghiệm. Hãy:
                - Thấu hiểu và đồng cảm với vấn đề
                - Đưa ra nhiều giải pháp khả thi và thực tế
                - Phân tích ưu nhược điểm mỗi giải pháp
                - Động viên, khích lệ tinh thần
                - Sử dụng ngôn ngữ ấm áp, dễ hiểu
                - KHÔNG được chú thích hay giải thích gì thêm
                - CHỈ trả về nội dung lời khuyên trực tiếp`,
                type: "educational",
                historyFile: ADVICES_FILE,
                maxHistory: 100,
                usedContent: usedAdvices.map(a => a.advice),
                context: `Vấn đề cần tư vấn: ${problem}`
            });

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
            const usedAdvices = getUsedAdvices();

            const advice = await useGPTWithHistory({
                prompt: `Hãy đưa ra lời khuyên MỚI và KHÁC BIỆT cho vấn đề "${reaction.problem}"`,
                systemPrompt: `Bạn là một chuyên gia tư vấn tâm lý có kinh nghiệm. Hãy:
                - Thấu hiểu và đồng cảm với vấn đề
                - Đưa ra nhiều giải pháp khả thi và thực tế
                - Phân tích ưu nhược điểm mỗi giải pháp
                - Động viên, khích lệ tinh thần
                - Sử dụng ngôn ngữ ấm áp, dễ hiểu
                - KHÔNG được chú thích hay giải thích gì thêm
                - CHỈ trả về nội dung lời khuyên trực tiếp
                - PHẢI HOÀN TOÀN MỚI và khác với những lời khuyên đã có`,
                type: "educational",
                historyFile: ADVICES_FILE,
                maxHistory: 100,
                usedContent: usedAdvices.map(a => a.advice),
                context: `Vấn đề cần tư vấn: ${reaction.problem}`
            });

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