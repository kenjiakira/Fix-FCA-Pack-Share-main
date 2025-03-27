const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../utils/api');
const fs = require('fs');
const path = require('path');

const POEMS_FILE = path.join(__dirname, './json/used_poems.json');

function initializePoemsFile() {
    if (!fs.existsSync(path.dirname(POEMS_FILE))) {
        fs.mkdirSync(path.dirname(POEMS_FILE), { recursive: true });
    }
    if (!fs.existsSync(POEMS_FILE)) {
        fs.writeFileSync(POEMS_FILE, JSON.stringify([], null, 2));
    }
}

function getUsedPoems() {
    try {
        initializePoemsFile();
        return JSON.parse(fs.readFileSync(POEMS_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc poems:', err);
        return [];
    }
}

function saveNewPoem(poem) {
    try {
        const usedPoems = getUsedPoems();
        usedPoems.push({
            poem: poem,
            timestamp: Date.now()
        });
        
        if (usedPoems.length > 100) {
            usedPoems.splice(0, usedPoems.length - 100);
        }
        
        fs.writeFileSync(POEMS_FILE, JSON.stringify(usedPoems, null, 2));
    } catch (err) {
        console.error('Lỗi lưu poem:', err);
    }
}

const poemTypes = {
    "1": {
        name: "Thơ lục bát",
        description: "thơ lục bát truyền thống Việt Nam, câu 6 chữ và 8 chữ luân phiên, vần điệu êm ái, du dương"
    },
    "2": {
        name: "Thơ thất ngôn",
        description: "thơ 7 chữ mỗi câu, cấu trúc chặt chẽ, âm điệu trang trọng"
    },
    "3": {
        name: "Thơ ngũ ngôn", 
        description: "thơ 5 chữ mỗi câu, ngắn gọn súc tích, nhịp nhàng"
    },
    "4": {
        name: "Thơ tự do",
        description: "thơ không theo khuôn mẫu cố định, tự do về hình thức, chú trọng cảm xúc"
    },
    "5": {
        name: "Thơ đường luật",
        description: "thơ theo thể thơ Đường của Trung Quốc, 8 câu, niêm luật chặt chẽ"
    },
    "6": {
        name: "Thơ song thất",
        description: "thơ lục bát biến thể, hai câu 7 chữ liên tiếp, vần điệu đặc biệt"
    },
    "lục bát": {
        name: "Thơ lục bát",
        description: "thơ lục bát truyền thống Việt Nam, câu 6 chữ và 8 chữ luân phiên, vần điệu êm ái, du dương"
    },
    "thất ngôn": {
        name: "Thơ thất ngôn",
        description: "thơ 7 chữ mỗi câu, cấu trúc chặt chẽ, âm điệu trang trọng"
    },
    "ngũ ngôn": {
        name: "Thơ ngũ ngôn", 
        description: "thơ 5 chữ mỗi câu, ngắn gọn súc tích, nhịp nhàng"
    },
    "tự do": {
        name: "Thơ tự do",
        description: "thơ không theo khuôn mẫu cố định, tự do về hình thức, chú trọng cảm xúc"
    },
    "đường luật": {
        name: "Thơ đường luật",
        description: "thơ theo thể thơ Đường của Trung Quốc, 8 câu, niêm luật chặt chẽ"
    },
    "song thất": {
        name: "Thơ song thất",
        description: "thơ lục bát biến thể, hai câu 7 chữ liên tiếp, vần điệu đặc biệt"
    }
};

module.exports = {
    name: "poem",
    usedby: 0,
    category: "Giải Trí", 
    info: "Tạo thơ bằng AI",
    dev: "HNT",
    onPrefix: true,
    usages: "poem [số/thể loại] [chủ đề]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "📝 Hướng dẫn sử dụng POEM:\n\n" +
                "→ poem [số/thể loại] [chủ đề]\n\n" +
                "Các thể loại thơ:\n" +
                "1. lục bát\n" +
                "2. thất ngôn\n" + 
                "3. ngũ ngôn\n" +
                "4. tự do\n" +
                "5. đường luật\n" +
                "6. song thất\n\n" +
                "Ví dụ:\n" +
                "→ poem 1 tình yêu\n" +
                "→ poem 2 mùa thu\n" +
                "→ poem lục bát nỗi nhớ",
                threadID, messageID
            );
        }

        const poemType = target[0].toLowerCase();
        if (!poemTypes[poemType]) {
            return api.sendMessage("❌ Thể loại thơ không hợp lệ! Vui lòng chọn số từ 1-6 hoặc tên thể loại", threadID, messageID);
        }

        const topic = target.slice(1).join(" ");
        if (!topic) {
            return api.sendMessage("❌ Vui lòng nhập chủ đề cho bài thơ!", threadID, messageID);
        }

        const loadingMessage = await api.sendMessage("📝 Đang sáng tác thơ...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            const usedPoems = getUsedPoems();
            const usedPoemsText = usedPoems.map(p => p.poem).join('\n');

            const prompt = `Hãy sáng tác một bài thơ bằng tiếng Việt theo yêu cầu sau:
            - Thể loại: ${poemTypes[poemType].description}
            - Chủ đề: ${topic}
            - Yêu cầu:
              + Phải đúng thể thơ yêu cầu
              + Ý thơ sâu sắc, hình ảnh đẹp
              + Giàu cảm xúc và ý nghĩa
              + Sử dụng từ ngữ đẹp, tránh sáo rỗng
              + Độ dài vừa phải (4-8 câu)
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung bài thơ
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các bài thơ đã có:
              ${usedPoemsText}`;

            const result = await model.generateContent(prompt);
            const poem = result.response.text();

            // Lưu poem mới
            saveNewPoem(poem);

            const message = `📝 ${poemTypes[poemType].name.toUpperCase()}\n` +
                          `💭 Chủ đề: ${topic}\n` +
                          `\n${poem}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để làm thơ tiếp`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({ 
                        messageID: info.messageID, 
                        name: this.name,
                        poemType: poemType,
                        topic: topic
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Poem Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi sáng tác thơ: " + error.message, threadID, messageID);
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

            const usedPoems = getUsedPoems();
            const usedPoemsText = usedPoems.map(p => p.poem).join('\n');

            const prompt = `Hãy sáng tác một bài thơ bằng tiếng Việt theo yêu cầu sau:
            - Thể loại: ${poemTypes[reaction.poemType].description}
            - Chủ đề: ${reaction.topic}
            - Yêu cầu:
              + Phải đúng thể thơ yêu cầu
              + Ý thơ sâu sắc, hình ảnh đẹp
              + Giàu cảm xúc và ý nghĩa
              + Sử dụng từ ngữ đẹp, tránh sáo rỗng
              + Độ dài vừa phải (4-8 câu)
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung bài thơ
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các bài thơ đã có:
              ${usedPoemsText}`;

            const result = await model.generateContent(prompt);
            const poem = result.response.text();

            // Lưu poem mới
            saveNewPoem(poem);

            const message = `📝 ${poemTypes[reaction.poemType].name.toUpperCase()}\n` +
                          `💭 Chủ đề: ${reaction.topic}\n` +
                          `\n${poem}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để làm thơ tiếp`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID, 
                name: this.name,
                poemType: reaction.poemType,
                topic: reaction.topic
            });

        } catch (error) {
            console.error("Poem Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi sáng tác thơ mới: " + error.message, threadID);
        }
    }
}; 