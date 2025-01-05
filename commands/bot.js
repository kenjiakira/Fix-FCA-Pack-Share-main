const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const NodeCache = require("node-cache");
const fetch = require('node-fetch');
const axios = require('axios');
global.fetch = fetch;

const responseCache = new NodeCache({ stdTTL: 1800 });
const conversationHistory = {};

const apiKeysPath = path.join(__dirname, 'json', 'key.json');
let API_KEYS = [];

const loadAPIKeys = async () => {
    try {
        const data = await fs.readJson(apiKeysPath);
        API_KEYS = data.api_keys;
        API_KEYS = API_KEYS.filter(key => key && key.length > 0);
        if (API_KEYS.length === 0) throw new Error("No valid API keys found");
    } catch (error) {
        console.error("Error loading API keys:", error);
        API_KEYS = [];
    }
};

loadAPIKeys();

const Model_Name = "gemini-1.5-flash";
const generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 4096,
};

const systemInstruction = `
    Bạn là AI trợ lý ảo có tên là AKI AI. Hãy trò chuyện một cách thân thiện và tự nhiên.
    Trả lời ngắn gọn, súc tích và luôn bằng tiếng Việt.`;

const processImage = async (attachment) => {
  try {
    const fileUrl = attachment.url;
    const cacheDir = path.join(__dirname, 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const tempFilePath = path.join(cacheDir, `temp_image_${Date.now()}.jpg`);
    
    const response = await axios({
      url: fileUrl,
      responseType: 'arraybuffer'
    });
    
    await fs.writeFile(tempFilePath, Buffer.from(response.data));
    const fileData = await fs.readFile(tempFilePath);
    const base64Image = fileData.toString('base64');
    
    await fs.unlink(tempFilePath);
    
    return {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

const generateResponse = async (prompt, threadId, imagePart = null) => {
    try {
        const cacheKey = `${prompt}-${threadId}-${imagePart ? 'image' : 'text'}`;
        const cached = responseCache.get(cacheKey);
        if (cached) return cached;

        for (const apiKey of API_KEYS) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: Model_Name,
                    generationConfig
                });

                const context = conversationHistory[threadId] ? 
                    conversationHistory[threadId].join("\n") : "";
                
                const promptParts = [];
                const fullPrompt = `${systemInstruction}\n${context}\nUser: ${prompt}\nBot:`;
                promptParts.push(fullPrompt);
                
                if (imagePart) {
                    promptParts.push(imagePart);
                }
                
                const result = await model.generateContent(promptParts);
                const response = await result.response;
                const text = response.text();
                
                responseCache.set(cacheKey, text);
                return text;
            } catch (error) {
                if (error.message.includes('quota')) continue;
                throw error;
            }
        }
        throw new Error("All API keys exhausted");
    } catch (error) {
        console.error("Generate response error:", error);
        throw error;
    }
};

const updateConversationHistory = (threadId, message) => {
    if (!conversationHistory[threadId]) {
        conversationHistory[threadId] = [];
    }
    conversationHistory[threadId].push(message);
    if (conversationHistory[threadId].length > 10) {
        conversationHistory[threadId].shift();
    }
};

module.exports = {
    name: "bot",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    usedby: 0,
    nickName: ["assistant", "botchat"],
    info: "Chat với Bot",
    onPrefix: false,
    cooldowns: 3,

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, messageReply } = event;
        try {
            let imagePart = null;
            if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
                const attachment = messageReply.attachments.find(att => 
                    att.type === "photo" || att.type === "image"
                );
                if (attachment) {
                    imagePart = await processImage(attachment);
                }
            }

            updateConversationHistory(threadID, `User: ${body}`);
            const response = await generateResponse(body, threadID, imagePart);
            updateConversationHistory(threadID, `Bot: ${response}`);
            
            const msg = await api.sendMessage(response, threadID, messageID);
            
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: threadID
            });
        } catch (error) {
            api.sendMessage("❌ Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau.", threadID, messageID);
        }
    },

    onLaunch: async function ({ event, api }) {
        const { threadID, messageID, body, messageReply } = event;
        try {
            let imagePart = null;
            if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
                const attachment = messageReply.attachments.find(att => 
                    att.type === "photo" || att.type === "image"
                );
                if (attachment) {
                    imagePart = await processImage(attachment);
                }
            }

            updateConversationHistory(threadID, `User: ${body}`);
            const response = await generateResponse(body, threadID, imagePart);
            updateConversationHistory(threadID, `Bot: ${response}`);

            const msg = await api.sendMessage(response, threadID, messageID);

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: threadID
            });
        } catch (error) {
            api.sendMessage("❌ Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};
