const { useGPTWithHistory } = require('../utils/gptHook');
const config = require('../utils/api');
const fs = require('fs');
const path = require('path');

// Storage setup
const STORAGE_FILE = path.join(__dirname, '../database/json/AI/funtext_history.json');

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
            let prompt, result, message;
            const usedContent = getUsedContent(type + 's');

            switch (type) {
                case 'story': {
                    const storyType = target[1];
                    if (!storyTypes[storyType]) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng chọn số từ 1-6 cho thể loại truyện!", threadID, messageID);
                    }

                    prompt = `Kể một câu chuyện ngắn thể loại ${storyTypes[storyType].description}.

Yêu cầu:
- Độ dài 3-5 đoạn ngắn
- Cốt truyện hấp dẫn, logic
- Tình tiết bất ngờ
- Kết thúc ấn tượng
- CHỈ trả về nội dung câu chuyện
- Phải hoàn toàn mới và độc đáo`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một nhà văn tài năng, giỏi kể chuyện và tạo ra những câu chuyện hấp dẫn, cảm động.",
                        type: "creative",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: `Thể loại: ${storyTypes[storyType].name}`
                    });

                    saveNewContent('stories', result);
                    message = `📚 ${storyTypes[storyType].name.toUpperCase()}\n\n${result}`;
                    break;
                }

                case 'poem': {
                    const poemType = target[1];
                    const topic = target.slice(2).join(" ");
                    if (!poemTypes[poemType] || !topic) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng chọn số từ 1-6 và nhập chủ đề cho bài thơ!", threadID, messageID);
                    }

                    prompt = `Sáng tác một bài thơ ${poemTypes[poemType].description} về chủ đề "${topic}".

Yêu cầu:
- Độ dài 4-8 câu
- Ý thơ sâu sắc, hình ảnh đẹp
- Tuân thủ thể thơ đã chọn
- CHỈ trả về bài thơ
- Phải hoàn toàn mới và sáng tạo`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một nhà thơ tài ba, am hiểu các thể thơ Việt Nam và có khả năng sáng tác những bài thơ hay, ý nghĩa.",
                        type: "creative",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: `Thể thơ: ${poemTypes[poemType].name}, Chủ đề: ${topic}`
                    });

                    saveNewContent('poems', result, { topic });
                    message = `📝 ${poemTypes[poemType].name.toUpperCase()}\n💭 Chủ đề: ${topic}\n\n${result}`;
                    break;
                }

                case 'quote': {
                    const topic = target.slice(1).join(" ");
                    if (!topic) {
                        api.unsendMessage(loadingMessage.messageID);
                        return api.sendMessage("❌ Vui lòng nhập chủ đề cho câu nói hay!", threadID, messageID);
                    }

                    prompt = `Tạo một câu nói hay về chủ đề "${topic}".

Yêu cầu:
- Ngắn gọn, súc tích
- Ý nghĩa sâu sắc, truyền cảm hứng
- Dễ hiểu và dễ nhớ
- CHỈ trả về câu nói
- Phải hoàn toàn mới và độc đáo`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một triết gia, có khả năng tạo ra những câu nói hay, sâu sắc và truyền cảm hứng.",
                        type: "educational",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: `Chủ đề: ${topic}`
                    });

                    saveNewContent('quotes', result, { topic });
                    message = `💫 CHỦ ĐỀ: ${topic.toUpperCase()}\n\n${result}`;
                    break;
                }

                case 'fact': {
                    prompt = `Chia sẻ một sự thật thú vị mà ít người biết.

Yêu cầu:
- Chính xác và có thể kiểm chứng
- Thú vị và bất ngờ
- Súc tích, dễ hiểu
- CHỈ trả về sự thật
- Phải hoàn toàn mới`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một người am hiểu rộng về khoa học, lịch sử và các lĩnh vực khác, có khả năng chia sẻ những kiến thức thú vị.",
                        type: "educational",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: "Sự thật thú vị"
                    });

                    saveNewContent('facts', result);
                    message = `📚 SỰ THẬT THÚ VỊ 📚\n\n${result}`;
                    break;
                }

                case 'joke': {
                    prompt = `Kể một câu chuyện cười ngắn.

Yêu cầu:
- Hài hước, dễ hiểu
- Phù hợp mọi lứa tuổi
- Tạo tiếng cười tự nhiên
- CHỈ trả về truyện cười
- Phải hoàn toàn mới`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một nghệ sĩ hài tài năng, có khả năng tạo ra những câu chuyện cười hay và phù hợp.",
                        type: "fun",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: "Truyện cười"
                    });

                    saveNewContent('jokes', result);
                    message = `😄 TRUYỆN CƯỜI 😄\n\n${result}`;
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

        try {
            const type = reaction.type;
            const extraData = reaction.extraData || [];
            const usedContent = getUsedContent(type + 's');

            let prompt, result, message;

            switch (type) {
                case 'story': {
                    const storyType = extraData[0];
                    if (!storyTypes[storyType]) return;

                    prompt = `Kể một câu chuyện ngắn khác thể loại ${storyTypes[storyType].description}.

Yêu cầu:
- Cốt truyện hoàn toàn mới
- Góc nhìn và tình tiết khác biệt
- CHỈ trả về câu chuyện
- Phải độc đáo và sáng tạo`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là một nhà văn sáng tạo, luôn tìm cách kể chuyện từ những góc độ mới lạ và thú vị.",
                        type: "creative",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: `Câu chuyện mới - ${storyTypes[storyType].name}`
                    });

                    saveNewContent('stories', result);
                    message = `📚 ${storyTypes[storyType].name.toUpperCase()}\n\n${result}`;
                    break;
                }

                case 'poem': {
                    const poemType = extraData[0];
                    const topic = extraData.slice(1).join(" ");
                    if (!poemTypes[poemType] || !topic) return;

                    prompt = `Sáng tác một bài thơ mới ${poemTypes[poemType].description} về "${topic}" với cách tiếp cận khác.

Yêu cầu:
- Góc nhìn mới về chủ đề
- Hình ảnh và ẩn dụ khác biệt
- CHỈ trả về bài thơ
- Phải sáng tạo và độc đáo`;

                    result = await useGPTWithHistory({
                        prompt: prompt,
                        systemPrompt: "Bạn là nhà thơ có tài năng đặc biệt trong việc nhìn vấn đề từ nhiều góc độ khác nhau.",
                        type: "creative",
                        usedContent: usedContent.map(item => item.content),
                        historyFile: STORAGE_FILE,
                        context: `Thơ mới - ${poemTypes[poemType].name}: ${topic}`
                    });

                    saveNewContent('poems', result, { topic });
                    message = `📝 ${poemTypes[poemType].name.toUpperCase()}\n💭 Chủ đề: ${topic}\n\n${result}`;
                    break;
                }

                default:
                    return;
            }

            message += "\n\n━━━━━━━━━━━━━━━━━━━\n👍 Thả cảm xúc để xem tiếp";

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({
                messageID: sent.messageID,
                name: this.name,
                type: type,
                extraData: extraData
            });

        } catch (error) {
            console.error("Funtext Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi tạo nội dung mới: " + error.message, threadID);
        }
    }
};
