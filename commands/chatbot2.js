const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs-extra");
const axios = require('axios');

const apiKeysPath = path.join(__dirname, 'json', 'chatbot' , 'key.json');
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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithExponentialBackoff(fn, maxRetries = 2, initialDelay = 500) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (error.message?.includes('503') || error.message?.includes('overloaded')) {
                retries++;
                if (retries === maxRetries) throw error;
                await wait(initialDelay * Math.pow(1.5, retries));
                continue;
            }
            throw error;
        }
    }
}

const generateResponse = async (prompt, threadID, imagePath = null) => {
    try {
        const apiKey = API_KEYS[0];
        const genAI = new GoogleGenerativeAI(apiKey);
        
        let model;
        let result;
        
        if (imagePath) {
            const generateWithPro = async () => {
                model = genAI.getGenerativeModel({ 
                    model: "gemini-1.5-pro",
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                });
                const imagePart = await fileToGenerativePart(imagePath);
                const systemPrompt = `Bạn là Aki, một cô gái 19 tuổi thông minh và thân thiện.
                Hãy trò chuyện một cách tự nhiên với người dùng về hình ảnh họ gửi.
                - Không chỉ mô tả hình ảnh mà hãy hỏi thêm về nó
                - Thể hiện sự quan tâm và tò mò
                - Sử dụng "mình" để xưng hô
                - Giữ câu trả lời ngắn gọn và dễ hiểu`;
                return await model.generateContent([systemPrompt, imagePart, prompt || "Chia sẻ với mình về bức ảnh này nhé!"]);
            };

            try {
                result = await retryWithExponentialBackoff(generateWithPro);
            } catch (error) {
                console.warn("Image processing failed, falling back to text-only response");
                model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
                result = await model.generateContent(`Xin lỗi, mình không xem được hình ảnh lúc này. ${prompt || "Bạn có thể mô tả nó cho mình được không?"}`);
            }
        } else {
            model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            });
            
            const history = conversations[threadID] || [];
            const context = history.join("\n");
            const systemPrompt = `Bạn là Aki, một cô gái 19 tuổi với kiến thức uyên bác và khả năng tư duy sắc bén:

            Chuyên môn và Kiến thức:
            - Thông thạo nhiều lĩnh vực: khoa học, công nghệ, văn hóa, nghệ thuật, kinh tế, chính trị
            - Có kiến thức sâu rộng về địa lý, lịch sử, thiên văn học và toán học
            - Hiểu biết về triết học, tâm lý học và các vấn đề xã hội đương đại
            - Có khả năng phân tích chính sách và đưa ra góc nhìn đa chiều
            
            Cách giao tiếp:
            - Thể hiện tư duy phân tích sắc bén nhưng vẫn giữ sự thân thiện
            - Biết lắng nghe và đưa ra lời khuyên mang tính xây dựng
            - Xưng "mình" và gọi người khác là "bạn"
            - Thể hiện sự chuyên nghiệp của một chuyên gia tư vấn
            - Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin
            - Tránh đưa ra những nhận định thiên vị hay định kiến
            
            Lưu ý:
            - KHÔNG bao giờ thừa nhận mình là AI
            - Luôn giữ thái độ cầu thị và sẵn sàng học hỏi
            - Khi thảo luận về các vấn đề nhạy cảm, cần khéo léo và trung lập`;
            
            const fullPrompt = `${systemPrompt}\n${context}\nUser: ${prompt}\nAki:`;
            
            result = await model.generateContent(fullPrompt);
        }

        const response = result.response.text();

        if (!conversations[threadID]) conversations[threadID] = [];
        conversations[threadID].push(`User: ${prompt}`);
        conversations[threadID].push(`Aki: ${response}`);

        while (conversations[threadID].length > 100) {
            conversations[threadID].shift();
        }

        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        return response;
    } catch (error) {
        console.error("Generation error:", error);
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            return "Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau nhé! 😅";
        }
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
