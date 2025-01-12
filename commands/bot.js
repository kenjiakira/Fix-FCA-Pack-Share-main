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
    Bạn là AI trợ lý ảo có tên là AKI AI. 
    Trả lời ngắn gọn và luôn bằng tiếng Việt một cách thân thiện.`;

const IGNORED_KEYWORDS = [
    'upscale',
    'imgur',
    'cl',
    'tx',
    'bctc',
    'hd',
    'clear',
    'qr',
    'qrcode',
    'scan'
];

const hasIgnoredKeyword = (text) => {
    if (!text) return false;
    const lowercaseText = text.toLowerCase();
    return IGNORED_KEYWORDS.some(keyword => lowercaseText.includes(keyword));
};

const processImages = async (attachments) => {
    try {
        const imageAttachments = attachments.filter(att => 
            att.type === "photo" || att.type === "image"
        );
        
        if (imageAttachments.length === 0) return null;
        
        const processedImages = await Promise.all(imageAttachments.map(async (attachment) => {
            const fileUrl = attachment.url;
            const cacheDir = path.join(__dirname, 'cache');
            
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            const tempFilePath = path.join(cacheDir, `temp_image_${Date.now()}_${Math.random()}.jpg`);
            
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
        }));
        
        return processedImages.length > 0 ? processedImages : null;
    } catch (error) {
        console.error("Error processing images:", error);
        return null;
    }
};

const generateResponse = async (prompt, threadId, imageParts = null) => {
    try {
        const cacheKey = `${prompt}-${threadId}-${imageParts ? 'image' : 'text'}`;
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
                
                if (imageParts && Array.isArray(imageParts)) {
                    promptParts.push(...imageParts);
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

const processEmotions = (text) => {
    const emotionRegex = /([.:><=3()\/\\]{2,}|:[vpPD]|:3|=\)\)|<3|\(\()\s*$/;
    const match = text.match(emotionRegex);
    return match ? [text.slice(0, -match[0].length).trim(), match[0]] : [text, ''];
};

const sendMessageWithDelay = async (api, response, threadID, messageID) => {
    const [content, emotion] = processEmotions(response);
    const messageText = emotion ? `${content} ${emotion}` : content;
    return await api.sendMessage(messageText, threadID, messageID);
};

const messageContexts = new Map();

const storeContext = (threadID, messageID, { response, imageData = null }) => {
    messageContexts.set(messageID, {
        threadID,
        response,
        imageData,
        timestamp: Date.now(),
        originalImage: imageData ? true : false 
    });
};

const getContext = (messageID) => {
    const context = messageContexts.get(messageID);
    if (!context) return null;
    
    if (Date.now() - context.timestamp > 30 * 60 * 1000) {
        messageContexts.delete(messageID);
        return null;
    }
    return context;
};

const BOT_ID = '100092325757607';

const isValidMessage = (event) => {
    if (event.type !== "message_reply") return false;

    const replyContext = global.client.onReply.find(r => 
        r.messageID === event.messageReply.messageID
    );

    if (replyContext && replyContext.name === "bot") {
        return true;
    }

    if (event.messageReply?.attachments?.length > 0) {
        const hasImage = event.messageReply.attachments.some(att => 
            att.type === "photo" || att.type === "image"
        );
        return hasImage;
    }

    return false;
};

module.exports = {
    name: "bot",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    nickName: ["assistant", "botchat"],
    info: "Chat với Bot",
    onPrefix: false,
    cooldowns: 3,

    noPrefix: async function({ event, api }) {
        if (hasIgnoredKeyword(event.body)) return;
        if (!isValidMessage(event)) return;
        
        try {
            let imageData = null;
            const prevContext = getContext(event.messageReply.messageID);

            if (event.messageReply?.attachments?.length > 0) {
                imageData = await processImages(event.messageReply.attachments);
            } else if (prevContext?.originalImage) {
                imageData = prevContext.imageData;
            }

            const prompt = event.body || "Mô tả chi tiết về những bức ảnh này";
            const response = await generateResponse(prompt, event.threadID, imageData);
            
            updateConversationHistory(event.threadID, `User: ${prompt}`);
            updateConversationHistory(event.threadID, `Bot: ${response}`);

            const sent = await sendMessageWithDelay(api, response, event.threadID, event.messageID);
            
            if (sent && sent.messageID) {

                storeContext(event.threadID, sent.messageID, {
                    response,
                    imageData: imageData,
                    originalImage: prevContext ? prevContext.originalImage : !!imageData
                });

                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    threadID: event.threadID,
                    hasImage: !!imageData,
                    isOriginalImage: prevContext ? prevContext.originalImage : !!imageData
                });
            }
        } catch (error) {
            console.error("Error in noPrefix:", error);
            api.sendMessage("❌ Lỗi xử lý, vui lòng thử lại.", event.threadID, event.messageID);
        }
    },

    onReply: async function({ event, api }) {
        const { messageID, body, messageReply } = event;
        if (!messageReply?.messageID || hasIgnoredKeyword(body)) return;

        const prevContext = getContext(messageReply.messageID);
        if (!prevContext) return;

        try {
            updateConversationHistory(event.threadID, `Bot: ${prevContext.response}`);
            updateConversationHistory(event.threadID, `User: ${body}`);
            
            const response = await generateResponse(
                body, 
                event.threadID, 
                prevContext.originalImage ? prevContext.imageData : null
            );
            
            updateConversationHistory(event.threadID, `Bot: ${response}`);
            
            const sent = await sendMessageWithDelay(api, response, event.threadID, messageID);
            
            if (sent && sent.messageID) {

                storeContext(event.threadID, sent.messageID, {
                    response,
                    imageData: prevContext.originalImage ? prevContext.imageData : null,
                    originalImage: prevContext.originalImage
                });
                
                global.client.onReply.push({
                    name: this.name,
                    messageID: sent.messageID,
                    threadID: event.threadID,
                    hasImage: prevContext.originalImage
                });
            }
        } catch (error) {
            console.error("Error in onReply:", error);
            api.sendMessage("❌ Lỗi xử lý, vui lòng thử lại.", event.threadID, messageID);
        }
    },

    onLaunch: async function ({ event, api }) {
        const { threadID, messageID, body, messageReply } = event;
        try {
            let imagePart = null;
            if (messageReply?.attachments?.length > 0) {
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

            const lastMsg = await sendMessageWithDelay(api, response, threadID, messageID);
            
            if (lastMsg) {
                global.client.onReply.push({
                    name: this.name,
                    messageID: lastMsg.messageID,
                    threadID: event.threadID
                });
            }
        } catch (error) {
            api.sendMessage("❌ Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};
