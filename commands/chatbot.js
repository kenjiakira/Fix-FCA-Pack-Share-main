const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const apiKeysPath = path.join(__dirname, 'json' , 'chatbot' , 'key.json');
const userDataPath = path.join(__dirname, '..', 'events', 'cache', 'userData.json');
let API_KEYS = [];

const genderDataPath = path.join(__dirname, 'json', 'chatbot' , 'genderData.json');
let genderData = {users: {}};

const loadGenderData = async () => {
    try {
        genderData = await fs.readJson(genderDataPath);
        console.log("Loaded gender data");
    } catch (error) {
        console.log("Creating new gender database");
        await fs.writeJson(genderDataPath, genderData);
    }
};

const saveGenderData = async (senderID, gender) => {
    try {
        genderData.users[senderID] = gender;
        await fs.writeJson(genderDataPath, genderData, { spaces: 2 });
        console.log(`Saved gender data for user ${senderID}: ${gender}`);
    } catch (error) {
        console.error("Error saving gender data:", error);
    }
};

const getTimeContext = () => {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const hours = vietnamTime.getHours();
    
    let timeOfDay;
    if (hours >= 5 && hours < 11) timeOfDay = "buổi sáng";
    else if (hours >= 11 && hours < 13) timeOfDay = "buổi trưa";
    else if (hours >= 13 && hours < 18) timeOfDay = "buổi chiều";
    else if (hours >= 18 && hours < 22) timeOfDay = "buổi tối";
    else timeOfDay = "đêm khuya";
    
    return {
        hour: hours,
        minute: vietnamTime.getMinutes(),
        timeOfDay,
        isLate: hours >= 23 || hours < 5
    };
};

let userDatabase = {};
let learnedResponses = {};
const LEARNING_FILE = path.join(__dirname, 'json', 'chatbot' , 'learned.json');

const HISTORY_FILE = path.join(__dirname, 'json', 'chatbot' , 'conversationHistory.json');
const MAX_CONTEXT_LENGTH = 100; 

let conversationHistory = {
    global: [],
    threads: {},
    lastResponses: {}
};

const MEMORY_FILE = path.join(__dirname, 'json', 'chatbot' , 'memoryBank.json');
const MEMORY_CATEGORIES = {
    PERSONAL: 'personal',
    FACTS: 'facts', 
    PREFERENCES: 'preferences',
    INTERACTIONS: 'interactions',
    EMOTIONS: 'emotions'
};

let memoryBank = {
    users: {},
    global: {
        facts: [],
        interactions: [],
        preferences: []
    }
};

const loadMemoryBank = async () => {
    try {
        memoryBank = await fs.readJson(MEMORY_FILE);
        console.log("Loaded memory bank");
    } catch (error) {
        console.log("Creating new memory bank");
        await fs.writeJson(MEMORY_FILE, memoryBank);
    }
};

const saveMemoryBank = async () => {
    await fs.writeJson(MEMORY_FILE, memoryBank, { spaces: 2 });
};

const addMemory = async (senderID, category, content, priority = 1) => {
    if (!memoryBank.users[senderID]) {
        memoryBank.users[senderID] = {
            personal: [],
            facts: [],
            preferences: [],
            interactions: [],
            emotions: []
        };
    }

    const memory = {
        content,
        timestamp: Date.now(),
        priority,
        accessCount: 0,
        lastAccess: Date.now()
    };

    memoryBank.users[senderID][category].push(memory);
    
    memoryBank.users[senderID][category].sort((a, b) => {
        return (b.priority * b.accessCount) - (a.priority * a.accessCount);
    });

    if (memoryBank.users[senderID][category].length > 50) {
        memoryBank.users[senderID][category] = memoryBank.users[senderID][category].slice(0, 50);
    }

    await saveMemoryBank();
};

const getRelevantMemories = (senderID, prompt) => {
    if (!memoryBank.users[senderID]) return [];

    const memories = [];
    const now = Date.now();
    const keywords = prompt.toLowerCase().split(' ');

    for (const category in memoryBank.users[senderID]) {
        memoryBank.users[senderID][category].forEach(memory => {
            const relevance = keywords.some(keyword => 
                memory.content.toLowerCase().includes(keyword)
            );

            if (relevance) {
                memory.accessCount++;
                memory.lastAccess = now;
                memories.push({
                    content: memory.content,
                    category,
                    relevance: memory.priority * memory.accessCount
                });
            }
        });
    }

    return memories
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5)
        .map(m => m.content);
};

const consolidateMemories = async (senderID) => {
    if (!memoryBank.users[senderID]) return;

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    for (const category in memoryBank.users[senderID]) {
        memoryBank.users[senderID][category] = memoryBank.users[senderID][category]
            .filter(memory => {
                const age = now - memory.timestamp;
                const frequency = memory.accessCount / (age / oneWeek);
                return frequency > 0.1 || memory.priority > 2;
            });
    }

    await saveMemoryBank();
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

const getRelevantContext = (threadID, prompt, senderID) => {
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
    
    // Get relevant memories
    const memories = getRelevantMemories(senderID, prompt);
    const memoryContext = memories.length > 0 ? 
        `Những điều tôi nhớ về người này:\n${memories.join('\n')}\n` : '';

    return {
        history: relevantHistory,
        lastResponse,
        participants: Array.from(participants.values()),
        memories: memoryContext
    };
};

const hasPermission = (senderID) => {
    const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
    return adminConfig.adminUIDs.includes(senderID);
};

const getHonorificContext = (userName, userGender) => {
    const xung = 'mình';
    let goi = 'bạn';
    
    if (userGender) {
        goi = userGender === 'male' ? 'anh' : 'chị';
    }

    return { xung, goi };
};

const updateUserGender = async (senderID, gender) => {
    if (!userDatabase[senderID]) {
        userDatabase[senderID] = {};
    }
    userDatabase[senderID].gender = gender;
    await fs.writeJson(userDataPath, userDatabase, { spaces: 2 });
};

const detectGenderQuestion = (response) => {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('bạn là nam hay nữ') || 
        lowerResponse.includes('giới tính của bạn') ||
        lowerResponse.includes('cho mình hỏi bạn là nam hay nữ')) {
        return true;
    }
    return false;
};

const detectGenderAnswer = (message) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('nam') || lowerMsg.includes('trai')) return 'male';
    if (lowerMsg.includes('nữ') || lowerMsg.includes('gái')) return 'female';
    return null;
};

const generateResponse = async (prompt, senderID, api, threadID) => { 
    try {
        const cleanPrompt = prompt.toLowerCase().trim();
        const context = getRelevantContext(threadID, cleanPrompt, senderID);
        const timeContext = getTimeContext();
        
        const storedGender = genderData.users[senderID];
        const userName = userDatabase[senderID]?.name || "Người dùng";
        
        if (!storedGender) {
            const detectedGender = detectGenderAnswer(prompt);
            if (detectedGender) {
                await saveGenderData(senderID, detectedGender);
                return `À, vậy ${detectedGender === 'male' ? 'anh' : 'chị'} ${userName} nhé. Rất vui được nói chuyện với ${detectedGender === 'male' ? 'anh' : 'chị'} =))`;
            }
        }

        const honorifics = getHonorificContext(userName, storedGender);

        let systemPrompt = `Bạn là Ngân, một cô gái 19 tuổi vui vẻ, hòa đồng và thân thiện.

${context.memories}

Thông tin thời gian:
- Bây giờ là ${timeContext.hour}:${timeContext.minute} ${timeContext.timeOfDay}
${timeContext.isLate ? '- Đã khuya rồi nên trả lời ngắn gọn' : ''}

Thông tin cuộc trò chuyện:
- Đang nói chuyện với: ${userName} ${storedGender ? `(${storedGender === 'male' ? 'Nam' : 'Nữ'})` : ''}
${context.participants.length > 1 ? `- Những người khác trong đoạn chat: ${context.participants.filter(n => n !== userName).join(', ')}` : ''}

Quy tắc xưng hô và trả lời:
- ${honorifics.xung} / ${honorifics.goi} khi nói chuyện với ${userName}
- Luôn giữ nguyên cách xưng hô trong cả cuộc nói chuyện
- TUYỆT ĐỐI KHÔNG hỏi giới tính của người dùng vì đã biết
- Không hỏi thông tin cá nhân người dùng

- Chat tự nhiên, thân thiện
- Trả lời ngắn gọn, súc tích
- Tránh hỏi nhiều, tập trung vào câu trả lời
- Không nhại lại tin nhắn người dùng
- Không đoán mò thông tin của người dùng
- chỉ trả lời thời gian nếu có ai hỏi bình thường trò chuyện sẽ không nói

Lịch sử gần đây:
${context.history}`;

        const fullPrompt = `${systemPrompt}\n${userName}: ${prompt}\nNgan:`;

        const apiKey = API_KEYS[0]; 
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 1.2, 
                maxOutputTokens: 1000,
            }
        });

        const result = await model.generateContent(fullPrompt);
        let response = result.response.text();
        response = response.replace(/^(User:|Ngan:|Assistant:)/gim, '').trim();

        updateContext(threadID, prompt, response, senderID);
        await saveLearnedResponse(prompt, response);

        const personalInfo = prompt.match(/tên là|tuổi|sống ở|thích|ghét|không thích/i);
        if (personalInfo) {
            await addMemory(senderID, MEMORY_CATEGORIES.PERSONAL, prompt, 2);
        }

        if (prompt.includes('thích') || prompt.includes('ghét')) {
            await addMemory(senderID, MEMORY_CATEGORIES.PREFERENCES, prompt, 2);
        }

        await addMemory(senderID, MEMORY_CATEGORIES.INTERACTIONS, 
            `${userName} nói: ${prompt}\nTôi trả lời: ${response}`, 1);

        if (Math.random() < 0.1) {
            await consolidateMemories(senderID);
        }

        const detectedGender = detectGenderAnswer(prompt);
        if (detectedGender && !genderData.users[senderID]) {
            await saveGenderData(senderID, detectedGender);
        }

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
            loadConversationHistory(),
            loadMemoryBank(),
            loadGenderData()
        ]);
    }
};