const { useGPTWithHistory } = require('../utils/gptHook');
const path = require('path');

const EXPLANATIONS_FILE = path.join(__dirname, './json/AI/used_explanations.json');

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
              + PHẢI HOÀN TOÀN MỚI`;

            const explanation = await useGPTWithHistory({
                prompt,
                type: "educational",
                provider: "auto",
                historyFile: EXPLANATIONS_FILE,
                maxHistory: 100,
                context: `Đang giải thích khái niệm: ${concept}`
            });

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
              + PHẢI HOÀN TOÀN MỚI`;

            const explanation = await useGPTWithHistory({
                prompt,
                type: "educational", 
                provider: "auto",
                historyFile: EXPLANATIONS_FILE,
                maxHistory: 100,
                context: `Đang giải thích khái niệm: ${reaction.concept}`
            });

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