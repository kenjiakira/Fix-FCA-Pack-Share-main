const { useGPTWithHistory } = require('../utils/gptHook');
const config = require('../utils/api');
const fs = require('fs');
const path = require('path');

const DEBATES_FILE = path.join(__dirname, '../database/json/AI/used_debates.json');

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
            const usedDebates = getUsedDebates();
            const usedContent = usedDebates
                .filter(d => d.topic.toLowerCase() === topic.toLowerCase())
                .map(d => d.analysis);

            const prompt = `Hãy phân tích vấn đề "${topic}" một cách khách quan và đa chiều.

Yêu cầu cụ thể:
- Nêu rõ ưu điểm và nhược điểm
- Dẫn chứng cụ thể, thực tế từ Việt Nam và thế giới
- Đưa ra các góc nhìn khác nhau (kinh tế, xã hội, môi trường, công nghệ...)
- Giữ thái độ trung lập, không thiên vị
- Kết luận mở, khuyến khích suy nghĩ
- CHỈ trả về nội dung phân tích, không có lời giới thiệu hay kết thúc
- Nội dung phải hoàn toàn mới và khác biệt`;

            const analysis = await useGPTWithHistory({
                prompt: prompt,
                systemPrompt: "Bạn là một chuyên gia phân tích vấn đề xã hội, có khả năng nhìn nhận vấn đề từ nhiều góc độ khác nhau một cách khách quan và cân bằng.",
                type: "analytical",
                usedContent: usedContent,
                historyFile: DEBATES_FILE,
                context: `Chủ đề phân tích: ${topic}`
            });

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
            const usedDebates = getUsedDebates();
            const usedContent = usedDebates
                .filter(d => d.topic.toLowerCase() === reaction.topic.toLowerCase())
                .map(d => d.analysis);

            const prompt = `Hãy phân tích vấn đề "${reaction.topic}" từ một góc nhìn mới và khác biệt.

Yêu cầu cụ thể:
- Tập trung vào các khía cạnh chưa được đề cập
- Đưa ra các ví dụ và dẫn chứng mới
- Phân tích từ góc độ khác (văn hóa, tâm lý, lịch sử, tương lai...)
- Giữ thái độ khách quan và cân bằng
- CHỈ trả về nội dung phân tích mới
- Nội dung phải hoàn toàn khác với các phân tích trước`;

            const analysis = await useGPTWithHistory({
                prompt: prompt,
                systemPrompt: "Bạn là một chuyên gia phân tích đa ngành, có khả năng nhìn vấn đề từ những góc độ sáng tạo và độc đáo mà ít người nghĩ tới.",
                type: "analytical",
                usedContent: usedContent,
                historyFile: DEBATES_FILE,
                context: `Phân tích mới cho chủ đề: ${reaction.topic}`
            });

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