const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

const processImage = async (attachment) => {
  try {
    const fileUrl = attachment.url;
    const cacheDir = path.join(__dirname, 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const tempFilePath = path.join(cacheDir, `temp_homework_${Date.now()}.jpg`);
    
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

const analyzeHomework = async (apiKey, prompt, imagePart) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    const result = await model.generateContent([
      { text: "Hãy giải thích và giải chi tiết bài tập này bằng tiếng Việt. Nếu là bài toán, hãy giải từng bước. Nếu là câu hỏi, hãy trả lời đầy đủ và giải thích rõ ràng.\n\nBài tập:" + prompt },
      imagePart
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`API Error with key ${apiKey.substring(0, 5)}...`, error.message);
    if (error.message.includes('quota') || 
        error.message.includes('rate') || 
        error.message.includes('limit') ||
        error.message.includes('Quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
};

module.exports = {
  name: "homework",
  info: "Giải bài tập qua hình ảnh",
  dev: "HNT",
  usedby: 0,
  onPrefix: true,
  dmUser: false,
  cooldowns: 30,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, type, messageReply } = event;
    const prompt = target.join(" ").trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Vui lòng reply một hình ảnh bài tập cần giải!", threadID, messageID);
    }

    const attachment = messageReply.attachments.find(att => 
      att.type === "photo" || att.type === "image"
    );

    if (!attachment) {
      return api.sendMessage("⚠️ Vui lòng chỉ gửi hình ảnh!", threadID, messageID);
    }

    const loadingMsg = await api.sendMessage("⏳ Đang phân tích bài tập...", threadID, messageID);

    try {
      const imagePart = await processImage(attachment);
      let solution = null;
      let lastError = null;
      let quotaExceededCount = 0;

      for (const apiKey of API_KEYS) {
        try {
          solution = await analyzeHomework(apiKey, prompt, imagePart);
          if (solution) break;
        } catch (error) {
          lastError = error;
          if (error.message === 'QUOTA_EXCEEDED') {
            quotaExceededCount++;
            if (quotaExceededCount === API_KEYS.length) {
              throw new Error("Tất cả API keys đều đã hết quota. Vui lòng thử lại sau.");
            }
            continue;
          }
          console.error(`API Key ${apiKey.substring(0, 5)}... error:`, error.message);
        }
      }

      if (!solution) {
        throw lastError || new Error("Không thể phân tích bài tập");
      }

      await api.sendMessage({
        body: "🎓 Lời giải chi tiết:\n\n" + solution
      }, threadID, messageID);
      
    } catch (error) {
      console.error("Homework analysis error:", error);
      const errorMessage = error.message.includes('quota') || error.message.includes('Tất cả API keys') 
        ? "⚠️ Hệ thống đang quá tải. Vui lòng thử lại sau ít phút!"
        : "❌ Đã xảy ra lỗi khi phân tích bài tập. Vui lòng thử lại sau!";
      
      await api.sendMessage(errorMessage, threadID, messageID);
    } finally {
      api.unsendMessage(loadingMsg.messageID);
    }
  }
};
