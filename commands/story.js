const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/api');
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file lưu trữ stories đã sử dụng
const STORIES_FILE = path.join(__dirname, './json/used_stories.json');

// Khởi tạo file nếu chưa tồn tại
function initializeStoriesFile() {
    if (!fs.existsSync(path.dirname(STORIES_FILE))) {
        fs.mkdirSync(path.dirname(STORIES_FILE), { recursive: true });
    }
    if (!fs.existsSync(STORIES_FILE)) {
        fs.writeFileSync(STORIES_FILE, JSON.stringify([], null, 2));
    }
}

// Đọc stories đã sử dụng
function getUsedStories() {
    try {
        initializeStoriesFile();
        return JSON.parse(fs.readFileSync(STORIES_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc stories:', err);
        return [];
    }
}

// Lưu story mới
function saveNewStory(story) {
    try {
        const usedStories = getUsedStories();
        usedStories.push({
            story: story,
            timestamp: Date.now()
        });
        
        // Chỉ giữ lại 100 stories gần nhất
        if (usedStories.length > 100) {
            usedStories.splice(0, usedStories.length - 100);
        }
        
        fs.writeFileSync(STORIES_FILE, JSON.stringify(usedStories, null, 2));
    } catch (err) {
        console.error('Lỗi lưu story:', err);
    }
}

const storyTypes = {
    "1": {
        name: "Tình cảm",
        description: "câu chuyện về tình yêu, tình bạn, gia đình, sâu lắng và cảm động"
    },
    "2": {
        name: "Kinh dị",
        description: "câu chuyện ma quái, kinh dị, bí ẩn nhưng không quá đáng sợ"
    },
    "3": {
        name: "Phiêu lưu",
        description: "câu chuyện về những cuộc phiêu lưu, khám phá, thử thách"
    },
    "4": {
        name: "Cổ tích",
        description: "câu chuyện cổ tích, thần tiên, có bài học ý nghĩa"
    },
    "5": {
        name: "Viễn tưởng",
        description: "câu chuyện về tương lai, công nghệ, khoa học viễn tưởng"
    },
    "6": {
        name: "Hài hước",
        description: "câu chuyện vui vẻ, hài hước, mang lại tiếng cười"
    },
    "tình cảm": {
        name: "Tình cảm",
        description: "câu chuyện về tình yêu, tình bạn, gia đình, sâu lắng và cảm động"
    },
    "kinh dị": {
        name: "Kinh dị",
        description: "câu chuyện ma quái, kinh dị, bí ẩn nhưng không quá đáng sợ"
    },
    "phiêu lưu": {
        name: "Phiêu lưu",
        description: "câu chuyện về những cuộc phiêu lưu, khám phá, thử thách"
    },
    "cổ tích": {
        name: "Cổ tích",
        description: "câu chuyện cổ tích, thần tiên, có bài học ý nghĩa"
    },
    "viễn tưởng": {
        name: "Viễn tưởng",
        description: "câu chuyện về tương lai, công nghệ, khoa học viễn tưởng"
    },
    "hài hước": {
        name: "Hài hước",
        description: "câu chuyện vui vẻ, hài hước, mang lại tiếng cười"
    }
};

module.exports = {
    name: "story",
    usedby: 0,
    category: "Giải Trí",
    info: "Kể chuyện ngắn bằng AI",
    dev: "HNT",
    onPrefix: true,
    usages: "story [số/thể loại]",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "📚 Hướng dẫn sử dụng STORY:\n\n" +
                "→ story [số/thể loại]\n\n" +
                "Các thể loại truyện:\n" +
                "1. tình cảm\n" +
                "2. kinh dị\n" +
                "3. phiêu lưu\n" +
                "4. cổ tích\n" +
                "5. viễn tưởng\n" +
                "6. hài hước\n\n" +
                "Ví dụ:\n" +
                "→ story 1\n" +
                "→ story kinh dị\n" +
                "→ story cổ tích",
                threadID, messageID
            );
        }

        const storyType = target[0].toLowerCase();
        if (!storyTypes[storyType]) {
            return api.sendMessage("❌ Thể loại truyện không hợp lệ! Vui lòng chọn số từ 1-6 hoặc tên thể loại", threadID, messageID);
        }

        const loadingMessage = await api.sendMessage("📚 Đang nghĩ ra câu chuyện hay...", threadID, messageID);

        try {
            const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000,
                }
            });

            const usedStories = getUsedStories();
            const usedStoriesText = usedStories.map(s => s.story).join('\n');

            const prompt = `Hãy kể một câu chuyện ngắn bằng tiếng Việt theo yêu cầu sau:
            - Thể loại: ${storyTypes[storyType].description}
            - Yêu cầu:
              + Độ dài 3-5 đoạn ngắn
              + Cốt truyện hấp dẫn, logic
              + Tình tiết bất ngờ
              + Kết thúc ấn tượng
              + Ngôn ngữ trong sáng, dễ hiểu
              + Phù hợp mọi lứa tuổi
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu chuyện
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu chuyện đã có:
              ${usedStoriesText}`;

            const result = await model.generateContent(prompt);
            const story = result.response.text();

            // Lưu story mới
            saveNewStory(story);

            const message = `📚 ${storyTypes[storyType].name.toUpperCase()}\n` +
                          `\n${story}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để nghe chuyện khác`;

            await api.sendMessage(message, threadID, (error, info) => {
                if (!error) {
                    global.client.callReact.push({ 
                        messageID: info.messageID, 
                        name: this.name,
                        storyType: storyType
                    });
                }
                api.unsendMessage(loadingMessage.messageID);
            });

        } catch (error) {
            console.error("Story Command Error:", error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã xảy ra lỗi khi kể chuyện: " + error.message, threadID, messageID);
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

            const usedStories = getUsedStories();
            const usedStoriesText = usedStories.map(s => s.story).join('\n');

            const prompt = `Hãy kể một câu chuyện ngắn bằng tiếng Việt theo yêu cầu sau:
            - Thể loại: ${storyTypes[reaction.storyType].description}
            - Yêu cầu:
              + Độ dài 3-5 đoạn ngắn
              + Cốt truyện hấp dẫn, logic
              + Tình tiết bất ngờ
              + Kết thúc ấn tượng
              + Ngôn ngữ trong sáng, dễ hiểu
              + Phù hợp mọi lứa tuổi
              + KHÔNG được chú thích hay giải thích gì thêm
              + CHỈ trả về nội dung câu chuyện
              + PHẢI HOÀN TOÀN MỚI, không được trùng với các câu chuyện đã có:
              ${usedStoriesText}`;

            const result = await model.generateContent(prompt);
            const story = result.response.text();

            // Lưu story mới
            saveNewStory(story);

            const message = `📚 ${storyTypes[reaction.storyType].name.toUpperCase()}\n` +
                          `\n${story}\n` +
                          `\n━━━━━━━━━━━━━━━━━━━\n` +
                          `👍 Thả cảm xúc để nghe chuyện khác`;

            const sent = await api.sendMessage(message, threadID);
            global.client.callReact.push({ 
                messageID: sent.messageID, 
                name: this.name,
                storyType: reaction.storyType
            });

        } catch (error) {
            console.error("Story Reaction Error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi kể chuyện mới: " + error.message, threadID);
        }
    }
}; 