const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const axios = require('axios');
const cheerio = require('cheerio');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const apiKeysPath = path.join(__dirname, 'json', 'key.json');
const userDataPath = path.join(__dirname, '..', 'events', 'cache', 'userData.json');
let API_KEYS = [];

let globalConversation = [];

let userDatabase = {};
let learnedResponses = {};
const LEARNING_FILE = path.join(__dirname, 'json', 'learned.json');

const HISTORY_FILE = path.join(__dirname, 'json', 'conversationHistory.json');
const MAX_CONTEXT_LENGTH = 100; 

let conversationHistory = {
    global: [],
    threads: {},
    lastResponses: {}
};

let botEmotionalState = {
    mood: 0.5,
    energy: 0.8, 
    anger: 0.0, 
    lastUpdate: Date.now()
};

const updateEmotionalState = () => {
    const timePassed = (Date.now() - botEmotionalState.lastUpdate) / (1000 * 60); 
  
    botEmotionalState.mood = 0.5 + (botEmotionalState.mood - 0.5) * Math.exp(-timePassed/30);
    
    botEmotionalState.energy = 0.7 + (botEmotionalState.energy - 0.7) * Math.exp(-timePassed/120);
    
    if (botEmotionalState.energy < 0.7) {
        botEmotionalState.energy += 0.1;
    }
    
    botEmotionalState.anger = Math.max(0, botEmotionalState.anger - 0.1);
    
    botEmotionalState.lastUpdate = Date.now();
};

const formatJSON = (data) => {
    return JSON.stringify(data, null, 2);
};

const loadAPIKeys = async () => {
    try {
        const data = await fs.readJson(apiKeysPath);
        API_KEYS = data.api_keys;
        API_KEYS = API_KEYS.filter(key => key && key.length > 0);
        console.log("Successfully loaded API keys");
    } catch (error) {
        console.error("Error loading API keys:", error.message);
        API_KEYS = [];
    }
};

loadAPIKeys();

const loadUserDatabase = async () => {
    try {
        userDatabase = await fs.readJson(userDataPath);
        await fs.writeJson(userDataPath, userDatabase, { spaces: 2 });
        console.log("Loaded user database with", Object.keys(userDatabase).length, "users");
    } catch (error) {
        console.error("Error loading user database:", error.message);
        userDatabase = {};
    }
};

loadUserDatabase();

const loadLearnedResponses = async () => {
    try {
        learnedResponses = await fs.readJson(LEARNING_FILE);
        console.log("Loaded", Object.keys(learnedResponses).length, "learned responses");
    } catch (error) {
        console.log("Creating new learning database");
        learnedResponses = {};
        await fs.writeJson(LEARNING_FILE, learnedResponses);
    }
};

const saveLearnedResponse = async (prompt, response) => {
    try {
        const cleanPrompt = prompt.toLowerCase().trim();
        if (!learnedResponses[cleanPrompt]) {
            learnedResponses[cleanPrompt] = {
                responses: [],
                frequency: 0
            };
        }
        learnedResponses[cleanPrompt].responses.push(response);
        learnedResponses[cleanPrompt].frequency++;
        
        if (learnedResponses[cleanPrompt].responses.length > 5) {
            learnedResponses[cleanPrompt].responses.shift();
        }
        
        await fs.writeJson(LEARNING_FILE, learnedResponses, { spaces: 2 });
    } catch (error) {
        console.error("Error saving learned response:", error.message);
    }
};

const loadConversationHistory = async () => {
    try {
        conversationHistory = await fs.readJson(HISTORY_FILE);
        console.log("Loaded conversation history");
    } catch (error) {
        console.log("Creating new conversation history");
        await fs.writeJson(HISTORY_FILE, conversationHistory);
    }
};

const saveConversationHistory = async () => {
    try {
        await fs.writeJson(HISTORY_FILE, conversationHistory, { spaces: 2 });
    } catch (error) {
        console.error("Error saving conversation history:", error.message);
    }
};

const updateContext = (threadID, userPrompt, botResponse, senderID) => {
    if (!conversationHistory.threads[threadID]) {
        conversationHistory.threads[threadID] = [];
    }

    const userName = userDatabase[senderID]?.name || `Người dùng ${senderID}`;
    const newExchange = {
        timestamp: Date.now(),
        prompt: userPrompt,
        response: botResponse,
        senderID: senderID,
        senderName: userName
    };

    conversationHistory.threads[threadID].push(newExchange);
    conversationHistory.global.push(newExchange);
    conversationHistory.lastResponses[userPrompt.toLowerCase()] = botResponse;

    if (conversationHistory.threads[threadID].length > MAX_CONTEXT_LENGTH) {
        conversationHistory.threads[threadID] = conversationHistory.threads[threadID].slice(-MAX_CONTEXT_LENGTH);
    }
    if (conversationHistory.global.length > 1000) {
        conversationHistory.global = conversationHistory.global.slice(-1000);
    }

    saveConversationHistory();
};

const getConversationParticipants = (threadID) => {
    const history = conversationHistory.threads[threadID] || [];
    const participants = new Map();
    
    history.forEach(exchange => {
        if (exchange.senderID && exchange.senderName) {
            participants.set(exchange.senderID, exchange.senderName);
        }
    });
    
    return participants;
};

const getRelevantContext = (threadID, prompt) => {
    const threadHistory = conversationHistory.threads[threadID] || [];
    const relevantHistory = threadHistory
        .slice(-5)
        .map(ex => {
            const userName = ex.senderName || userDatabase[ex.senderID]?.name || "Người dùng";
            return `${userName}: ${ex.prompt}\nNgan: ${ex.response}\n`;
        })
        .join('\n');

    const lastResponse = conversationHistory.lastResponses[prompt.toLowerCase()];
    const participants = getConversationParticipants(threadID);
    
    return {
        history: relevantHistory,
        lastResponse,
        participants: Array.from(participants.values())
    };
};

const getUserName = async (api, senderID, threadID) => {
    try {
        const userData = await fs.readJson(userDataPath);
        if (userData[senderID]?.name) {
            return userData[senderID].name;
        }

        const userInfo = await api.getUserInfo(senderID);
        if (userInfo[senderID]?.name) {
            return userInfo[senderID].name;
        }

        return "Người dùng " + senderID;
    } catch (error) {
        console.error("Error getting user name:", error);
        return "Người dùng " + senderID;
    }
};

const hasPermission = (senderID) => {
    const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
    return adminConfig.adminUIDs.includes(senderID);
};

const getHonorificContext = (userName, userAge, isAdmin) => {
  
    let xung = 'em'; 
    let goi = 'anh/chị'; 

    if (userAge) {
        const ageDiff = 19 - userAge; 
        if (ageDiff >= 20) {
            xung = 'cháu';
            goi = userAge > 50 ? 'bác' : 'cô/chú';
        } else if (ageDiff >= 10) {
            xung = 'em';
            goi = 'anh/chị';
        } else if (ageDiff >= -5) {
            xung = 'mình';
            goi = 'cậu/bạn';
        } else if (ageDiff >= -20) {
            xung = 'chị';
            goi = 'em';
        }
    }

    return { xung, goi };
};

const getAllCommands = () => {
    const cmdsPath = path.join(__dirname, '');
    const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
    const commands = {};

    commandFiles.forEach(file => {
        try {
            const command = require(path.join(cmdsPath, file));
            if (!command.hide) {
                const name = command.name.toLowerCase();
                commands[name] = {
                    name: command.name,
                    info: command.info || "Không có mô tả",
                    usage: command.usages || command.name,
                    permission: command.usedby === 0 ? "Thành viên" : 
                              command.usedby === 1 ? "Quản trị viên nhóm" :
                              command.usedby === 2 ? "Quản trị viên bot" : "Admin",
                    cooldown: command.cooldowns || 0,
                    prefix: command.onPrefix ? "Cần" : "Không cần"
                };
            }
        } catch (err) {
            console.error(`Error loading command ${file}:`, err);
        }
    });
    return commands;
};

const generateResponse = async (prompt, senderID, api, threadID) => { 
    if (prompt.toLowerCase() === "rs") {
        if (!hasPermission(senderID)) {
            return "Chỉ admin mới được phép reset trí nhớ của tôi -))";
        }
        globalConversation = [];
        return "Đã reset trí nhớ của tôi rồi nha -))";
    }

    try {
        const cleanPrompt = prompt.toLowerCase().trim();
        const context = getRelevantContext(threadID, cleanPrompt);

        if (context.lastResponse && Math.random() < 0.7) { 
            return context.lastResponse;
        }

        const apiKey = API_KEYS[0]; 
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000, 
            }
        });

        const userName = userDatabase[senderID]?.name || "Người dùng";
        const isAdmin = hasPermission(senderID);

        updateEmotionalState();
        updateMoodBasedOnPrompt(prompt);

        const userInfo = userDatabase[senderID] || {};
        const honorifics = getHonorificContext(userName, userInfo.age, isAdmin);

        const commands = getAllCommands();
        const commandsList = Object.values(commands).map(cmd => 
            `- ${cmd.name}: ${cmd.info} | Quyền hạn: ${cmd.permission} | Cách dùng: ${cmd.usage}`
        ).join('\n');

        let systemPrompt = `Bạn là Ngân, một cô gái 19 tuổi.
        
Thông tin cuộc trò chuyện:
- Đang nói chuyện với: ${userName}
${context.participants.length > 1 ? `- Những người khác trong đoạn chat: ${context.participants.filter(n => n !== userName).join(', ')}` : ''}
- Bot luôn nhớ ai đang nói chuyện với mình để tránh nhầm lẫn

Quy tắc xưng hô (RẤT QUAN TRỌNG):
- Luôn dùng đúng xưng hô trong suốt cuộc hội thoại
- ${honorifics.xung} / ${honorifics.goi} khi nói chuyện với ${userName}
- Với người lớn tuổi: cháu/cô,chú,bác
- Với người ngang tuổi: tớ,mình/cậu,bạn
- Với người nhỏ hơn: chị/em
- Không dùng xưng hô kiểu "t-m" với người lạ
- Giữ nguyên cách xưng hô trong cả cuộc nói chuyện

Phong cách nói chuyện:
- Chat tự nhiên nhưng lịch sự
- Dùng =))) :)) khi vui vẻ
- Thỉnh thoảng "hmm", "à" khi suy nghĩ
- KHÔNG bao giờ nói về trạng thái của bản thân
- Trả lời ngắn gọn, súc tích
- Không nhại lại tin nhắn người dùng
- Không xác nhận mình là AI 

Tính cách:
- Lễ phép với người lớn
- Thân thiện với bạn bè
- Dịu dàng với em nhỏ
- Biết giữ khoảng cách phù hợp

Quan Hệ:
- anh tên là Ngọc Từ
- chị tên Vy
- bố tên là Hải
- mẹ tên là Hương

Kiến thức về lệnh bot (RẤT QUAN TRỌNG):
- Prefix: ${adminConfig.prefix}
- DANH SÁCH LỆNH HIỆN CÓ:
${commandsList}

Khi được hỏi về lệnh:
- Kiểm tra xem lệnh có tồn tại trong danh sách không
- Trả lời chi tiết: tên lệnh, mô tả, cách dùng, quyền hạn
- Nếu không có lệnh đó thì trả lời "Không có lệnh này"
- Luôn thêm prefix vào ví dụ cách dùng lệnh
- Nếu người dùng hỏi về nhiều lệnh, liệt kê từng lệnh

Ví dụ câu trả lời mẫu:
"Dạ có lệnh {tên} nha:
- Mô tả: {info}
- Cách dùng: ${adminConfig.prefix}{usage}
- Quyền hạn: {permission}"

Lịch sử gần đây:
${context.history}`;

        if (prompt.toLowerCase().includes('tin tức') || 
            prompt.toLowerCase().includes('tin mới') ||
            prompt.toLowerCase().includes('có gì mới')) {
            await updateNews();
            const recentNews = newsCache.vnexpress
                .slice(0, 3)
                .map(n => `${n.title}\n${n.description}`)
                .join('\n\n');
            systemPrompt += `\nTin tức mới nhất:\n${recentNews}`;
        }

        const fullPrompt = `${systemPrompt}\n${userName}: ${prompt}\nNgan:`;

        const result = await model.generateContent(fullPrompt);
        let response = result.response.text();
        response = response.replace(/^(User:|Ngan:|Assistant:)/gim, '').trim();

        updateContext(threadID, prompt, response, senderID);
        await saveLearnedResponse(prompt, response);

        return response;
    } catch (error) {
        console.error("Generation error:", error);
        throw error;
    }
};

const updateMoodBasedOnPrompt = (prompt) => {
    const angerTriggers = ['ngu', 'đồ', 'bot ngu', 'gà', 'kém', 'dốt', 'nực cười', 'mày'];
    const sassyTriggers = ['bot ngáo', 'bot điên', 'bot khùng', 'ngang', 'tao'];
    const friendlyWords = ['hihi', 'haha', 'thương', 'cute', 'dễ thương', 'ngon'];
    const negativeWords = ['buồn', 'chán', 'khó chịu', 'đáng ghét'];
    const positiveWords = ['vui', 'thích', 'yêu', 'tuyệt', 'giỏi'];
    const energeticWords = ['chơi', 'hay', 'được', 'tốt', 'khỏe'];
    
    prompt = prompt.toLowerCase();
    
    for (const word of friendlyWords) {
        if (prompt.includes(word)) {
            botEmotionalState.mood = Math.min(1.0, botEmotionalState.mood + 0.2);
            botEmotionalState.anger = Math.max(0, botEmotionalState.anger - 0.1);
        }
    }
    
    for (const trigger of angerTriggers) {
        if (prompt.includes(trigger)) {
            botEmotionalState.anger = Math.min(1.0, botEmotionalState.anger + 0.3);
            botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.2);
        }
    }

    for (const trigger of sassyTriggers) {
        if (prompt.includes(trigger)) {
            botEmotionalState.anger = Math.min(0.7, botEmotionalState.anger + 0.2);
        }
    }
    
    for (const word of negativeWords) {
        if (prompt.includes(word)) botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.1);
    }
    for (const word of positiveWords) {
        if (prompt.includes(word)) botEmotionalState.mood = Math.min(0.9, botEmotionalState.mood + 0.1);
    }
    
   
    for (const word of energeticWords) {
        if (prompt.includes(word)) {
            botEmotionalState.energy = Math.min(1.0, botEmotionalState.energy + 0.15);
        }
    }
    
    botEmotionalState.energy = Math.max(0.6, botEmotionalState.energy - 0.02);
};

const updateUserInfo = async (senderID, info) => {
    try {
        if (!userDatabase[senderID]) {
            userDatabase[senderID] = {};
        }
        Object.assign(userDatabase[senderID], info);
        await fs.writeJson(userDataPath, userDatabase);
    } catch (error) {
        console.error("Error updating user info:", error);
    }
};

let newsCache = {
    vnexpress: [],
    lastUpdate: 0
};

async function updateNews() {
    try {
        const now = Date.now();
      
        if (now - newsCache.lastUpdate < 30 * 60 * 1000) return;

        const response = await axios.get('https://vnexpress.net/tin-tuc-24h');
        const $ = cheerio.load(response.data);
        const news = [];

        $('.item-news').each((i, el) => {
            if (i < 10) {
                const title = $(el).find('.title-news a').text().trim();
                const description = $(el).find('.description a').text().trim();
                if (title && description) {
                    news.push({ title, description });
                }
            }
        });

        newsCache.vnexpress = news;
        newsCache.lastUpdate = now;
    } catch (error) {
        console.error("Error updating news:", error);
    }
}

module.exports = {
    name: "chatbot",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    nickName: ["bot", "ai"],
    info: "Chat với AI",
    onPrefix: false,
    cooldowns: 3,
    generateResponse, 

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, senderID } = event;
        if (!body) return;
        
        try {
            const response = await generateResponse(body, senderID, api, threadID);
            const sent = await api.sendMessage(response, threadID, messageID);
            
            if (sent) {
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    author: event.senderID
                });
            }
        } catch (error) {
        }
    },
        

    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, body, senderID } = event;

        try {
            if (target && target[0]?.toLowerCase() === "rs") {
                if (!hasPermission(senderID)) {
                    return api.sendMessage("Chỉ admin mới được phép reset trí nhớ của tôi", threadID, messageID);
                }
                globalConversation = [];
                return api.sendMessage("Đã reset trí nhớ của tôi rồi nha, Nói chuyện tiếp thôi =))", threadID, messageID);
            }
            if (this.onPrefix) {
                const response = await generateResponse(body, senderID, api, threadID);
                const sent = await api.sendMessage(response, threadID, messageID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: event.senderID
                    });
                }
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            api.sendMessage("Oops có lỗi rồi :> Thử lại nha", threadID, messageID);
        }
    },

    onLoad: async function() {
        await Promise.all([
            loadLearnedResponses(),
            loadConversationHistory()
        ]);
    }
};