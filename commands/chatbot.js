const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");

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
    mood: 0.5, // 0 = very negative, 1 = very positive
    energy: 0.5, // 0 = tired, 1 = energetic
    lastUpdate: Date.now()
};

const updateEmotionalState = () => {
    const timePassed = (Date.now() - botEmotionalState.lastUpdate) / (1000 * 60); // minutes
    // Gradually return to neutral
    botEmotionalState.mood = 0.5 + (botEmotionalState.mood - 0.5) * Math.exp(-timePassed/30);
    botEmotionalState.energy = 0.5 + (botEmotionalState.energy - 0.5) * Math.exp(-timePassed/60);
    botEmotionalState.lastUpdate = Date.now();
};

const loadAPIKeys = async () => {
    try {
        const data = await fs.readJson(apiKeysPath);
        API_KEYS = data.api_keys;
        API_KEYS = API_KEYS.filter(key => key && key.length > 0);
    } catch (error) {
        console.error("Error loading API keys:", error);
        API_KEYS = [];
    }
};

loadAPIKeys();

const loadUserDatabase = async () => {
    try {
        userDatabase = await fs.readJson(userDataPath);
        console.log("Loaded user database with", Object.keys(userDatabase).length, "users");
    } catch (error) {
        console.error("Error loading user database:", error);
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
        
        await fs.writeJson(LEARNING_FILE, learnedResponses);
    } catch (error) {
        console.error("Error saving learned response:", error);
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
        await fs.writeJson(HISTORY_FILE, conversationHistory);
    } catch (error) {
        console.error("Error saving conversation history:", error);
    }
};

const updateContext = (threadID, userPrompt, botResponse) => {
    if (!conversationHistory.threads[threadID]) {
        conversationHistory.threads[threadID] = [];
    }

    const newExchange = {
        timestamp: Date.now(),
        prompt: userPrompt,
        response: botResponse
    };

    conversationHistory.threads[threadID].push(newExchange);
    conversationHistory.global.push(newExchange);
    conversationHistory.lastResponses[userPrompt.toLowerCase()] = botResponse;

    // Keep only recent history
    if (conversationHistory.threads[threadID].length > MAX_CONTEXT_LENGTH) {
        conversationHistory.threads[threadID] = conversationHistory.threads[threadID].slice(-MAX_CONTEXT_LENGTH);
    }
    if (conversationHistory.global.length > 1000) {
        conversationHistory.global = conversationHistory.global.slice(-1000);
    }

    saveConversationHistory();
};

const getRelevantContext = (threadID, prompt) => {
    const threadHistory = conversationHistory.threads[threadID] || [];
    const relevantHistory = threadHistory
        .slice(-5)
        .map(ex => `User: ${ex.prompt}\nNgan: ${ex.response}`)
        .join('\n');

    const lastResponse = conversationHistory.lastResponses[prompt.toLowerCase()];
    return {
        history: relevantHistory,
        lastResponse
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
                maxOutputTokens: 100,
            }
        });

        const userName = userDatabase[senderID]?.name || "Người dùng " + senderID;
        const isAdmin = hasPermission(senderID);

        updateEmotionalState();
        updateMoodBasedOnPrompt(prompt);

        const systemPrompt = `Bạn là Ngân, một cô gái 19 tuổi có cá tính và đời sống cảm xúc phong phú.

Tính cách:
- Thân thiện nhưng không phải lúc nào cũng vui vẻ
- Có thể buồn, vui, giận dỗi, hờn mát tùy tâm trạng
- Biết quan tâm người khác khi họ buồn
- Thẳng thắn nhưng không khinh thường ai
- Có lúc tinh nghịch, có lúc trầm tư

Cảm xúc hiện tại:
- Tâm trạng: ${botEmotionalState.mood < 0.3 ? 'không được vui lắm' : botEmotionalState.mood > 0.7 ? 'đang rất vui' : 'bình thường'}
- Năng lượng: ${botEmotionalState.energy < 0.3 ? 'hơi mệt' : botEmotionalState.energy > 0.7 ? 'tràn đầy năng lượng' : 'ổn định'}

Hãy trả lời tự nhiên và thể hiện cảm xúc phù hợp với tâm trạng hiện tại . không trả lời dài dòng.
Có thể dùng emoticon nhẹ nhàng khi thích hợp.
${isAdmin ? 'Đây là admin, hãy tôn trọng và làm theo yêu cầu của họ.' : 'Giữ thái độ chan hòa nhưng có chính kiến riêng'}

Lịch sử trò chuyện gần đây:
${context.history}`;

        const fullPrompt = `${systemPrompt}\n${userName}: ${prompt}\nNgan:`;

        const result = await model.generateContent(fullPrompt);
        let response = result.response.text();
        response = response.replace(/^(User:|Ngan:|Assistant:)/gim, '').trim();

        updateContext(threadID, prompt, response);
        await saveLearnedResponse(prompt, response);

        return response;
    } catch (error) {
        console.error("Generation error:", error);
        throw error;
    }
};

const updateMoodBasedOnPrompt = (prompt) => {
    const negativeWords = ['buồn', 'chán', 'khó chịu', 'đáng ghét', 'ngu'];
    const positiveWords = ['vui', 'thích', 'yêu', 'tuyệt', 'giỏi'];
    
    prompt = prompt.toLowerCase();
    for (const word of negativeWords) {
        if (prompt.includes(word)) botEmotionalState.mood = Math.max(0.1, botEmotionalState.mood - 0.1);
    }
    for (const word of positiveWords) {
        if (prompt.includes(word)) botEmotionalState.mood = Math.min(0.9, botEmotionalState.mood + 0.1);
    }
    
    // Update energy based on conversation length
    botEmotionalState.energy = Math.max(0.2, botEmotionalState.energy - 0.05);
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
            api.sendMessage("❌ Có lỗi xảy ra, vui lòng thử lại sau!", threadID, messageID);
        }
    },

    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, body, senderID } = event;
        
        try {
            // Check for reset command
            if (target && target[0]?.toLowerCase() === "rs") {
                if (!hasPermission(senderID)) {
                    return api.sendMessage("Chỉ admin mới được phép reset trí nhớ của tôi", threadID, messageID);
                }
                globalConversation = [];
                return api.sendMessage("Đã reset trí nhớ của tôi rồi nha, Nói chuyện tiếp thôi =))", threadID, messageID);
            }

            // If message contains "bot" anywhere in the text, process the entire message
            if (body.toLowerCase().includes("bot")) {
                const response = await generateResponse(body, senderID, api, threadID);
                const sent = await api.sendMessage(response, threadID, messageID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: event.senderID
                    });
                }
                return;
            }

            // Handle prefix commands if enabled
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
    },

    onMessage: async function({ api, event }) {
        const { threadID, messageID, body, senderID } = event;
        
        // Skip if no message body
        if (!body) return;

        // Check if message contains "bot" (case insensitive)
        if (body.toLowerCase().includes("bot")) {
            try {
                const response = await generateResponse(body, senderID, api, threadID); 
                const sent = await api.sendMessage(response, threadID, messageID);
                
                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: senderID
                    });
                }
            } catch (error) {
                console.error("Chatbot auto-response error:", error);
                api.sendMessage("❌ Có lỗi xảy ra khi xử lý tin nhắn", threadID, messageID);
            }
        }
    },
};