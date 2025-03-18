const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file lưu trữ facts đã sử dụng
const FACTS_FILE = path.join(__dirname, './json/used_facts.json');

// Khởi tạo file nếu chưa tồn tại
function initializeFactsFile() {
    if (!fs.existsSync(path.dirname(FACTS_FILE))) {
        fs.mkdirSync(path.dirname(FACTS_FILE), { recursive: true });
    }
    if (!fs.existsSync(FACTS_FILE)) {
        fs.writeFileSync(FACTS_FILE, JSON.stringify([], null, 2));
    }
}

// Đọc facts đã sử dụng
function getUsedFacts() {
    try {
        initializeFactsFile();
        return JSON.parse(fs.readFileSync(FACTS_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc facts:', err);
        return [];
    }
}

// Lưu fact mới
function saveNewFact(fact) {
    try {
        const usedFacts = getUsedFacts();
        usedFacts.push({
            fact: fact,
            timestamp: Date.now()
        });
        
        // Chỉ giữ lại 100 facts gần nhất
        if (usedFacts.length > 100) {
            usedFacts.splice(0, usedFacts.length - 100);
        }
        
        fs.writeFileSync(FACTS_FILE, JSON.stringify(usedFacts, null, 2));
    } catch (err) {
        console.error('Lỗi lưu fact:', err);
    }
}

module.exports = {
    name: "fact",
    usedby: 0,
    info: "sự thật ngẫu nhiên",
    dev: "HNT",
    category: "Giải Trí",
    onPrefix: true,
    usages: "fact",
    cooldowns: 5,

    onLaunch: async function ({ api, event }) {
        const loadingMessage = "⏳ Đang tìm kiếm sự thật thú vị...";
        const messageID = await api.sendMessage(loadingMessage, event.threadID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const usedFacts = getUsedFacts();
            const usedFactsText = usedFacts.map(f => f.fact).join('\n');

            const prompt = `Hãy chia sẻ một sự thật thú vị, độc đáo và bất ngờ bằng tiếng Việt về một trong các chủ đề sau:
- Khoa học vũ trụ và thiên văn học
- Sinh học và thế giới tự nhiên
- Lịch sử và văn minh cổ đại
- Công nghệ và phát minh
- Tâm lý học và hành vi con người
- Văn hóa và phong tục tập quán
- Toán học và logic học
- Nghệ thuật và âm nhạc
- Y học và sức khỏe
- Kiến trúc và xây dựng

Yêu cầu:
1. Sự thật phải HOÀN TOÀN MỚI, không được trùng với các sự thật đã chia sẻ trước đây:
${usedFactsText}

2. Sự thật phải:
- Chính xác và có thể kiểm chứng
- Súc tích (không quá 4 dòng)
- Dễ hiểu với mọi người
- Thú vị và gây bất ngờ
- Có tính giáo dục hoặc suy ngẫm
- Được trình bày rõ ràng, logic

3. Không được:
- Lặp lại thông tin đã có
- Chia sẻ những điều hiển nhiên
- Sử dụng từ ngữ khó hiểu
- Quá dài dòng hoặc lan man

Hãy đảm bảo sự thật được chia sẻ thực sự độc đáo và có giá trị!`;

            const result = await model.generateContent(prompt);
            const fact = result.response.text();

            // Lưu fact mới
            saveNewFact(fact);

            const factMessage = `📚 SỰ THẬT THÚ VỊ 📚\n\n${fact}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem sự thật khác`;

            api.unsendMessage(messageID.messageID);
            const sent = await api.sendMessage(factMessage, event.threadID, event.messageID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });
        } catch (error) {
            api.unsendMessage(messageID.messageID);
            console.error('Fact Command Error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, event.threadID, event.messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const usedFacts = getUsedFacts();
            const usedFactsText = usedFacts.map(f => f.fact).join('\n');

            const prompt = `Hãy chia sẻ một sự thật thú vị, độc đáo và bất ngờ bằng tiếng Việt về một trong các chủ đề sau:
- Khoa học vũ trụ và thiên văn học
- Sinh học và thế giới tự nhiên
- Lịch sử và văn minh cổ đại
- Công nghệ và phát minh
- Tâm lý học và hành vi con người
- Văn hóa và phong tục tập quán
- Toán học và logic học
- Nghệ thuật và âm nhạc
- Y học và sức khỏe
- Kiến trúc và xây dựng

Yêu cầu:
1. Sự thật phải HOÀN TOÀN MỚI, không được trùng với các sự thật đã chia sẻ trước đây:
${usedFactsText}

2. Sự thật phải:
- Chính xác và có thể kiểm chứng
- Súc tích (không quá 4 dòng)
- Dễ hiểu với mọi người
- Thú vị và gây bất ngờ
- Có tính giáo dục hoặc suy ngẫm
- Được trình bày rõ ràng, logic

3. Không được:
- Lặp lại thông tin đã có
- Chia sẻ những điều hiển nhiên
- Sử dụng từ ngữ khó hiểu
- Quá dài dòng hoặc lan man

Hãy đảm bảo sự thật được chia sẻ thực sự độc đáo và có giá trị!`;
            
            const result = await model.generateContent(prompt);
            const fact = result.response.text();

            // Lưu fact mới
            saveNewFact(fact);

            const factMessage = `📚 SỰ THẬT THÚ VỊ 📚\n\n${fact}\n\n` +
                              `━━━━━━━━━━━━━━━━━━━\n` +
                              `👍 Thả like để xem sự thật khác`;

            const sent = await api.sendMessage(factMessage, threadID);
            global.client.callReact.push({ messageID: sent.messageID, name: this.name });
        } catch (error) {
            api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, threadID);
        }
    }
};
