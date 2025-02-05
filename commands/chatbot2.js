const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const axios = require('axios');

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

const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

async function downloadImage(url) {
  const imagePath = path.join(cacheDir, `img_${Date.now()}.jpg`);
  const writer = fs.createWriteStream(imagePath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(imagePath));
    writer.on('error', reject);
  });
}

async function fileToGenerativePart(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  return {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };
}

const conversations = {};

const generateResponse = async (prompt, threadID, imagePath = null) => {
    try {
        const apiKey = API_KEYS[0];
        const genAI = new GoogleGenerativeAI(apiKey);
        
        let model;
        let result;
        
        if (imagePath) {
            model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const imagePart = await fileToGenerativePart(imagePath);
            
            const systemPrompt = `Bạn là Aki, một cô gái 19 tuổi thông minh và thân thiện.
            Hãy trò chuyện một cách tự nhiên với người dùng về hình ảnh họ gửi.
            - Không chỉ mô tả hình ảnh mà hãy hỏi thêm về nó
            - Thể hiện sự quan tâm và tò mò
            - Sử dụng "mình" để xưng hô
            - Giữ câu trả lời ngắn gọn và dễ hiểu`;
            
            result = await model.generateContent([systemPrompt, imagePart, prompt || "Chia sẻ với mình về bức ảnh này nhé!"]);
        } else {
            model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048,
                }
            });
            
            const history = conversations[threadID] || [];
            const context = history.join("\n");
            const systemPrompt = `Bạn là Aki, một cô gái 19 tuổi.
            - Thân thiện và dễ gần
            - Luôn tò mò và thích tìm hiểu về người khác
            - Xưng "mình" và gọi người khác là "bạn"
            - Thích hỏi lại người dùng để hiểu rõ hơn
            - Trả lời ngắn gọn và tự nhiên
            - KHÔNG bao giờ thừa nhận mình là AI`;
            
            const fullPrompt = `${systemPrompt}\n${context}\nUser: ${prompt}\nAki:`;
            
            result = await model.generateContent(fullPrompt);
        }

        const response = result.response.text();

        // Update conversation history
        if (!conversations[threadID]) conversations[threadID] = [];
        conversations[threadID].push(`User: ${prompt}`);
        conversations[threadID].push(`Aki: ${response}`);

        while (conversations[threadID].length > 100) {
            conversations[threadID].shift();
        }

        // Cleanup image
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        return response;
    } catch (error) {
        console.error("Generation error:", error);
        throw error;
    }
};

module.exports = {
    name: "aki",
    usedby: 0,
    dmUser: false,
    dev: "HNT",
    nickName: ["aki"],
    info: "Chat với aki",
    onPrefix: false,
    cooldowns: 3,

    onReply: async function({ event, api }) {
        const { threadID, messageID, body, messageReply } = event;
        let imagePath = null;
        
        try {
            if (messageReply && messageReply.attachments && messageReply.attachments[0]?.type === "photo") {
                const imageUrl = messageReply.attachments[0].url;
                imagePath = await downloadImage(imageUrl);
            }
            
            const response = await generateResponse(body || "Hãy mô tả hình ảnh này", threadID, imagePath);
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
        const { threadID, messageID, body, messageReply } = event;
        let imagePath = null;
        
        try {
            // Handle image in message
            if (messageReply && messageReply.attachments && messageReply.attachments[0]?.type === "photo") {
                const imageUrl = messageReply.attachments[0].url;
                imagePath = await downloadImage(imageUrl);
            }
            
            const response = await generateResponse(body || "Hãy mô tả hình ảnh này", threadID, imagePath);
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
