const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../utils/api');
const fs = require('fs');
const path = require('path');

// Storage setup
const STORAGE_FILE = path.join(__dirname, './json/AI/funtext_history.json');

function initializeStorage() {
    if (!fs.existsSync(path.dirname(STORAGE_FILE))) {
        fs.mkdirSync(path.dirname(STORAGE_FILE), { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify({
            stories: [],
            poems: [],
            quotes: [],
            facts: [],
            jokes: []
        }, null, 2));
    }
}

function getUsedContent(type) {
    try {
        initializeStorage();
        const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        return storage[type] || [];
    } catch (err) {
        console.error(`Lỗi đọc ${type}:`, err);
        return [];
    }
}

function saveNewContent(type, content, extras = {}) {
    try {
        const storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        if (!storage[type]) storage[type] = [];
        
        storage[type].push({
            content,
            ...extras,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries
        if (storage[type].length > 100) {
            storage[type].splice(0, storage[type].length - 100);
        }
        
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
    } catch (err) {
        console.error(`Lỗi lưu ${type}:`, err);
    }
}

const storyTypes = {
    "1": { name: "Tình cảm", description: "câu chuyện về tình yêu, tình bạn, gia đình, sâu lắng và cảm động" },
    "2": { name: "Kinh dị", description: "câu chuyện ma quái, kinh dị, bí ẩn nhưng không quá đáng sợ" },
    "3": { name: "Phiêu lưu", description: "câu chuyện về những cuộc phiêu lưu, khám phá, thử thách" },
    "4": { name: "Cổ tích", description: "câu chuyện cổ tích, thần tiên, có bài học ý nghĩa" },
    "5": { name: "Viễn tưởng", description: "câu chuyện về tương lai, công nghệ, khoa học viễn tưởng" },
    "6": { name: "Hài hước", description: "câu chuyện vui vẻ, hài hước, mang lại tiếng cười" }
};

const poemTypes = {
    "1": { name: "Thơ lục bát", description: "thơ lục bát truyền thống Việt Nam, câu 6 chữ và 8 chữ luân phiên" },
    "2": { name: "Thơ thất ngôn", description: "thơ 7 chữ mỗi câu, cấu trúc chặt chẽ" },
    "3": { name: "Thơ ngũ ngôn", description: "thơ 5 chữ mỗi câu, ngắn gọn súc tích" },
    "4": { name: "Thơ tự do", description: "thơ không theo khuôn mẫu cố định" },
    "5": { name: "Thơ đường luật", description: "thơ theo thể thơ Đường, 8 câu, niêm luật chặt chẽ" },
    "6": { name: "Thơ song thất", description: "thơ lục bát biến thể, hai câu 7 chữ liên tiếp" }
};

module.exports = {
    name: "funtext",
    usedby: 0,
    category: "Giải Trí",
    info: "Xem nội dung giải trí",
    dev: "HNT",
    onPrefix: true,
    usages: "funtext [loại] [thêm thông tin nếu cần]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "📖 Hướng dẫn sử dụng FUNTEXT:\n\n" +
                "→ funtext story [số 1-6] : Đọc truyện ngắn\n" +
                "→ funtext poem [số 1-6] [chủ đề] : Đọc thơ\n" +
                "→ funtext quote [chủ đề] : Xem câu nói hay\n" +
                "→ funtext fact : Xem sự thật thú vị\n" +
                "→ funtext joke : Xem truyện cười\n\n" +
                "Ví dụ:\n" +
                "→ funtext story 1\n" +
                "→ funtext poem 1 tình yêu\n" +
                "→ funtext quote cuộc sống",
                threadID, messageID
            );
        }

        const type = target[0].toLowerCase();
        const loadingMessage = await api.sendMessage("⌛ Đang tạo nội dung...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            let prompt, result, message;
            const usedContent = getUsedContent(type + 's');

            switch (type) {
                case 'story': {
                    const storyType = target[1];
                    if (!storyTypes[storyType]) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng chọn số từ 1-6 cho thể loại truyện!", threadID, messageID);
                    }

                    prompt = `Hãy kể một câu chuyện ngắn bằng tiếng Việt:
                    - Thể loại: ${storyTypes[storyType].description}
                    - Độ dài 3-5 đoạn ngắn
                    - Cốt truyện hấp dẫn, logic
                    - Tình tiết bất ngờ
                    - Kết thúc ấn tượng
                    - PHẢI HOÀN TOÀN MỚI`;

                    result = await model.generateContent(prompt);
                    const story = result.response.text();
                    saveNewContent('stories', story);

                    message = `📚 ${storyTypes[storyType].name.toUpperCase()}\n\n${story}`;
                    break;
                }

                case 'poem': {
                    const poemType = target[1];
                    const topic = target.slice(2).join(" ");
                    if (!poemTypes[poemType] || !topic) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng chọn số từ 1-6 và nhập chủ đề cho bài thơ!", threadID, messageID);
                    }

                    prompt = `Hãy sáng tác một bài thơ bằng tiếng Việt:
                    - Thể loại: ${poemTypes[poemType].description}
                    - Chủ đề: ${topic}
                    - Độ dài 4-8 câu
                    - Ý thơ sâu sắc, hình ảnh đẹp
                    - PHẢI HOÀN TOÀN MỚI`;

                    result = await model.generateContent(prompt);
                    const poem = result.response.text();
                    saveNewContent('poems', poem, { topic });

                    message = `📝 ${poemTypes[poemType].name.toUpperCase()}\n💭 Chủ đề: ${topic}\n\n${poem}`;
                    break;
                }

                case 'quote': {
                    const topic = target.slice(1).join(" ");
                    if (!topic) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng nhập chủ đề cho câu nói hay!", threadID, messageID);
                    }

                    prompt = `Hãy tạo một câu nói hay bằng tiếng Việt:
                    - Chủ đề: ${topic}
                    - Ngắn gọn, súc tích
                    - Ý nghĩa sâu sắc
                    - PHẢI HOÀN TOÀN MỚI`;

                    result = await model.generateContent(prompt);
                    const quote = result.response.text();
                    saveNewContent('quotes', quote, { topic });

                    message = `💫 CHỦ ĐỀ: ${topic.toUpperCase()}\n\n${quote}`;
                    break;
                }

                case 'fact': {
                    prompt = `Hãy chia sẻ một sự thật thú vị bằng tiếng Việt:
                    - Chính xác, súc tích
                    - Thú vị và bất ngờ
                    - PHẢI HOÀN TOÀN MỚI`;

                    result = await model.generateContent(prompt);
                    const fact = result.response.text();
                    saveNewContent('facts', fact);

                    message = `📚 SỰ THẬT THÚ VỊ 📚\n\n${fact}`;
                    break;
                }

                case 'joke': {
                    prompt = `Hãy kể một câu chuyện cười ngắn bằng tiếng Việt:
                    - Hài hước, dễ hiểu
                    - PHẢI HOÀN TOÀN MỚI`;

                    result = await model.generateContent(prompt);
                    const joke = result.response.text();
                    saveNewContent('jokes', joke);

                    message = `😄 TRUYỆN CƯỜI 😄\n\n${joke}`;
                    break;
                }

                default:
                    api.unsendMessage(loadingMessage.messageID);
                    return api.sendMessage("❌ Loại nội dung không hợp lệ!", threadID, messageID);
            }

            message += "\n\n━━━━━━━━━━━━━━━━━━━\n👍 Thả cảm xúc để xem tiếp";

            api.unsendMessage(loadingMessage.messageID);
            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID,
                name: this.name,
                type: type,
                extraData: target.slice(1)
            });

        } catch (error) {
            console.error("Funtext Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi: " + error.message, threadID, messageID);
        }
    },

    callReact: async function ({ reaction, api, event }) {
        if (reaction !== '👍') return;
        const { threadID } = event;
        
        // Similar structure to onLaunch but using reaction.type and reaction.extraData
        // to determine what kind of content to generate next
    }
};
