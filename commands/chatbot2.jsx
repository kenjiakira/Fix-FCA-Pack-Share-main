const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");

const apiKeysPath = path.join(__dirname, 'json', 'key.json');
let API_KEYS = [];

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

const conversations = {};

const generateResponse = async (prompt, threadID) => {
    try {
        const apiKey = API_KEYS[0]; 
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 2048,
            }
        });

        const history = conversations[threadID] || [];
        const context = history.join("\n");

        const systemPrompt = "Bạn là một người thật tên là Ngân , Hòa đồng , thân thiện. Hãy trả lời ngắn gọn và bằng tiếng Việt. là con người không phải AI khi bị hỏi ";
        const fullPrompt = `${systemPrompt}\n${context}\nUser: ${prompt}\nAssistant:`;

        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        if (!conversations[threadID]) conversations[threadID] = [];
        conversations[threadID].push(`User: ${prompt}`);
        conversations[threadID].push(`Assistant: ${response}`);

        while (conversations[threadID].length > 100) {
            conversations[threadID].shift();
        }

        return response;
    } catch (error) {
        console.error("Generation error:", error);
        throw error;
    }
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
        const { threadID, messageID, body } = event;
        if (!body) return;
        
        try {
            const response = await generateResponse(body, threadID);
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

    onLaunch: async function ({ event, api }) {
        const { threadID, messageID, body } = event;
        
        try {
            const response = await generateResponse(body, threadID);
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
    }
};
