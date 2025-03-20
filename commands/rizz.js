const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file lưu trữ rizz đã sử dụng
const RIZZ_FILE = path.join(__dirname, './json/used_rizz.json');

// Khởi tạo file nếu chưa tồn tại
function initializeRizzFile() {
    if (!fs.existsSync(path.dirname(RIZZ_FILE))) {
        fs.mkdirSync(path.dirname(RIZZ_FILE), { recursive: true });
    }
    if (!fs.existsSync(RIZZ_FILE)) {
        fs.writeFileSync(RIZZ_FILE, JSON.stringify([], null, 2));
    }
}

// Đọc rizz đã sử dụng
function getUsedRizz() {
    try {
        initializeRizzFile();
        return JSON.parse(fs.readFileSync(RIZZ_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc rizz:', err);
        return [];
    }
}

// Lưu rizz mới
function saveNewRizz(rizz) {
    try {
        const usedRizz = getUsedRizz();
        usedRizz.push({
            rizz: rizz,
            timestamp: Date.now()
        });
        
        // Chỉ giữ lại 100 rizz gần nhất
        if (usedRizz.length > 100) {
            usedRizz.splice(0, usedRizz.length - 100);
        }
        
        fs.writeFileSync(RIZZ_FILE, JSON.stringify(usedRizz, null, 2));
    } catch (err) {
        console.error('Lỗi lưu rizz:', err);
    }
}

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
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            // Random một phong cách
            const styles = Object.keys(rizzStyles);
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];

            const usedRizz = getUsedRizz();
            const usedRizzText = usedRizz.map(r => r.rizz).join('\n');

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
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu đã có:
              ${usedRizzText}`;

            const result = await model.generateContent(prompt);
            const rizz = result.response.text();

            // Lưu rizz mới
            saveNewRizz(rizz);

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
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            // Random một phong cách
            const styles = Object.keys(rizzStyles);
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];

            const usedRizz = getUsedRizz();
            const usedRizzText = usedRizz.map(r => r.rizz).join('\n');

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
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu đã có:
              ${usedRizzText}`;

            const result = await model.generateContent(prompt);
            const rizz = result.response.text();

            // Lưu rizz mới
            saveNewRizz(rizz);

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