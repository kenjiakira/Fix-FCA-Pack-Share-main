const { useGPTWithHistory } = require('../utils/gptHook');
const path = require('path');

const RIZZ_FILE = path.join(__dirname, './json/AI/used_rizz.json');

const rizzStyles = {
    "ngọt ngào": {
        name: "Ngọt ngào",
        description: "phong cách lãng mạn, dịu dàng, ấm áp, chân thành, thể hiện tình cảm sâu sắc"
    },
    "hài hước": {
        name: "Hài hước", 
        description: "phong cách vui vẻ, dí dỏm, duyên dáng, tạo không khí thoải mái"
    },
    "thơ mộng": {
        name: "Thơ mộng",
        description: "phong cách nghệ sĩ, bay bổng, lãng mạn, sử dụng hình ảnh đẹp"
    },
    "triết lý": {
        name: "Triết lý",
        description: "phong cách sâu sắc, ý nghĩa, thể hiện sự thông minh và hiểu biết"
    },
    "trực tiếp": {
        name: "Trực tiếp",
        description: "phong cách thẳng thắn, chân thành, không vòng vo"
    },
    "bí ẩn": {
        name: "Bí ẩn",
        description: "phong cách cuốn hút, lôi cuốn, tạo sự tò mò và hứng thú"
    }
};

module.exports = {
    name: "rizz",
    usedby: 0,
    category: "Giải Trí",
    info: "Tạo câu tán tỉnh bằng AI",
    dev: "HNT",
    onPrefix: true,
    usages: "rizz",
    cooldowns: 5,

    onLaunch: async function ({ api, event }) {
        const { threadID, messageID } = event;
        const loadingMessage = await api.sendMessage("💘 Đang nghĩ câu tán tỉnh hay...", threadID, messageID);

        try {
            const styles = Object.keys(rizzStyles);
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];

            const prompt = `Hãy tạo một câu tán tỉnh bằng tiếng Việt theo yêu cầu sau:
            - Phong cách: ${rizzStyles[randomStyle].description}
            - Yêu cầu:
              + Phải phù hợp với phong cách yêu cầu
              + Ngôn từ tinh tế, không thô tục
              + Thể hiện sự chân thành
              + Độ dài vừa phải (1-3 câu)
              + Phải thật sự hay và ấn tượng
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu tán tỉnh
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu đã có`;

            const rizz = await useGPTWithHistory({
                prompt,
                type: "creative",
                provider: "auto",
                historyFile: RIZZ_FILE,
                maxHistory: 100
            });

            const message = `💘 ${rizzStyles[randomStyle].name.toUpperCase()}\n` +
                          `\n${rizz}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem câu khác`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({ 
                        messageID: info.messageID, 
                        name: this.name 
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Rizz Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo câu tán tỉnh: " + error.message, threadID, messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        try {
            const styles = Object.keys(rizzStyles);
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];

            const prompt = `Hãy tạo một câu tán tỉnh bằng tiếng Việt theo yêu cầu sau:
            - Phong cách: ${rizzStyles[randomStyle].description}
            - Yêu cầu:
              + Phải phù hợp với phong cách yêu cầu
              + Ngôn từ tinh tế, không thô tục
              + Thể hiện sự chân thành
              + Độ dài vừa phải (1-3 câu)
              + Phải thật sự hay và ấn tượng
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu tán tỉnh
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu đã có`;

            const rizz = await useGPTWithHistory({
                prompt,
                type: "creative",
                provider: "auto",
                historyFile: RIZZ_FILE,
                maxHistory: 100
            });

            const message = `💘 ${rizzStyles[randomStyle].name.toUpperCase()}\n` +
                          `\n${rizz}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để xem câu khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });

        } catch (error) {
            console.error("Rizz Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo câu tán tỉnh mới: " + error.message, threadID);
        }
    }
};