const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jsQR = require("jsqr");
const { createCanvas, loadImage } = require("canvas");
const NodeCache = require("node-cache");
const Sentiment = require('sentiment');
const gTTS = require('gtts');
const languageDetect = require('langdetect');
const sharp = require('sharp');
const fetch = require('node-fetch');
global.fetch = fetch;

const responseCache = new NodeCache({ stdTTL: 1800 });

const rateLimits = new Map();
const RATE_LIMIT = 10; 
const RATE_WINDOW = 60 * 1000; 

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
  maxOutputTokens: 8192,
};
const manageConversationHistory = (userId, message) => {
 
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }

  conversationHistory[userId].push(message);

  if (conversationHistory[userId].length > 50) {
    conversationHistory[userId].shift(); 
  }
};
const updateLastMessage = (userId, messageID, prompt) => {
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }
  
  conversationHistory[userId].lastMessage = {
    messageID,
    prompt,
  };
};

const systemInstruction = `
bạn là AI trợ lý ảo có tên là AKI AI do Hoàng Ngọc Từ tạo ra vào ngày 6/7/2022 và là AI mạnh mẽ, trả lời logic và hiểu`;

const conversationHistory = {};
const jsonFilePath = path.resolve(__dirname, 'json', 'gemini.json');

const readDataFromFile = async () => {
  try {
    if (await fs.pathExists(jsonFilePath)) {
      const data = await fs.readJson(jsonFilePath);
      Object.assign(conversationHistory, data);
    }
  } catch (error) {
    console.error("Lỗi khi đọc tệp JSON:", error);
  }
};

const saveDataToFile = async () => {
  try {
    await fs.writeJson(jsonFilePath, conversationHistory, { spaces: 2 });
  } catch (error) {
    console.error("Lỗi khi ghi tệp JSON:", error);
  }
};

readDataFromFile();

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRateData = rateLimits.get(userId) || { count: 0, timestamp: now };

  if (now - userRateData.timestamp > RATE_WINDOW) {
    userRateData.count = 1;
    userRateData.timestamp = now;
  } else if (userRateData.count >= RATE_LIMIT) {
    return false;
  } else {
    userRateData.count++;
  }
  
  rateLimits.set(userId, userRateData);
  return true;
};

const sentiment = new Sentiment();

const analyzeSentiment = (text) => {
  const result = sentiment.analyze(text);
  return {
    score: result.score,
    mood: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'
  };
};

const textToSpeech = async (text, outputPath) => {
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, 'vi');
    gtts.save(outputPath, (err) => {
      if (err) reject(err);
      else resolve(outputPath);
    });
  });
};

const detectLanguage = (text) => {
  try {
    const detection = languageDetect.detect(text);
    return detection[0].lang;
  } catch {
    return 'unknown';
  }
};

const optimizeImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toFile(outputPath);
  return outputPath;
};

const summarizeText = async (text) => {
  if (text.length < 100) return null;
    
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length <= 3) return null;

  const firstSentence = sentences[0].trim();
  const middleSentence = sentences[Math.floor(sentences.length / 2)].trim();
  const lastSentence = sentences[sentences.length - 1].trim();

  return `${firstSentence} ${middleSentence} ${lastSentence}`;
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, retries = 3, backoff = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await wait(backoff);
    return retryWithBackoff(fn, retries - 1, backoff * 2);
  }
};

const generateContentWithAPI = async (apiKey, fullPrompt, imageParts) => {
  try {
    const cacheKey = `${fullPrompt}-${JSON.stringify(imageParts)}`;
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) return cachedResponse;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: Model_Name,
      generationConfig: {
        ...generationConfig,
        candidateCount: 1,
        maxOutputTokens: 4096,
      },
    });

    const promptWithContext = `${systemInstruction}\n${fullPrompt}`;

    const result = await retryWithBackoff(async () => {
      try {
        const response = await model.generateContent([{ text: promptWithContext }, ...imageParts]);
        if (!response || !response.response) {
          throw new Error('Invalid API response');
        }
        return response;
      } catch (error) {
        if (error.message.includes('quota') || error.message.includes('rate')) {
          throw new Error('QUOTA_EXCEEDED');
        }
        console.error('API call error:', error);
        throw error;
      }
    });

    const response = await result.response;
    let text = await response.text();

    const sentiment = analyzeSentiment(text);
    const language = detectLanguage(text);
    const summary = await summarizeText(text);

    const enhancedResponse = {
      text,
      sentiment,
      language,
      summary,
    };

    responseCache.set(cacheKey, enhancedResponse);
    return enhancedResponse;

  } catch (error) {
    console.error('Generate content error:', error);
    if (error.message === 'QUOTA_EXCEEDED') {
      throw error;
    }
    throw new Error(`API Error: ${error.message}`);
  }
};


const decodeQRCode = async (imagePath) => {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    const attempts = [
    
      () => jsQR(imageData.data, canvas.width, canvas.height),
     
      () => {
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = 255 - imageData.data[i];
          imageData.data[i + 1] = 255 - imageData.data[i + 1];
          imageData.data[i + 2] = 255 - imageData.data[i + 2];
        }
        return jsQR(imageData.data, canvas.width, canvas.height);
      },
    
      () => {
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          const val = avg > 127 ? 255 : 0;
          imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = val;
        }
        return jsQR(imageData.data, canvas.width, canvas.height);
      }
    ];

    for (const attempt of attempts) {
      const qrCode = attempt();
      if (qrCode && qrCode.data) {
        return qrCode.data;
      }
    }

    return null;
  } catch (error) {
    console.error("QR decode error:", error);
    return null;
  }
};

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
    
    // Clean up temp file
    await fs.unlink(tempFilePath);
    
    return {
      type: 'image',
      data: {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      }
    };
  } catch (error) {
    console.error("Error processing image:", error);
    return { type: 'error', error };
  }
};

module.exports = {
  name: "ai",
  info: "Tạo văn bản và phân tích hình ảnh, quét mã QR",
  dev: "HNT",
  onPrefix: true,
  dmUser: false,
  nickName: ["ai"],
  usages: "ai [prompt]",
  cooldowns: 10,

  onLaunch: async function ({ event, target, actions }) {
    const { senderID, messageID, type, messageReply } = event;
    let prompt = target.join(" ").trim();

    if (type === 'message_reply' && !prompt) {
      const lastMsg = getLastMessage(senderID);
      if (lastMsg && messageReply.messageID === lastMsg.messageID) {
        prompt = messageReply.body;
      }
    }

    if (!prompt) {
      return await actions.reply("❎ Vui lòng nhập một prompt hoặc trả lời tin nhắn AI trước đó.");
    }

    if (!checkRateLimit(senderID)) {
      return await actions.reply("⚠️ Bạn đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.");
    }

    try {
      manageConversationHistory(senderID, `User: ${prompt}`);
      const context = conversationHistory[senderID].join("\n");
      let imageParts = [];
      if (messageReply?.attachments?.length > 0) {
        const attachments = messageReply.attachments.filter(att => 
          att.type === 'photo' || att.type === 'image' || (att.url || '').match(/\.(jpg|jpeg|png|gif)$/i)
        );

        for (const attachment of attachments) {
          const result = await processImage(attachment);
          
          if (result.type === 'qr') {
            return await actions.reply(`📦 Nội dung mã QR: ${result.data}`);
          } else if (result.type === 'image') {
            imageParts.push(result.data);
          }
        }
      }

      let fullPrompt = conversationHistory[senderID].join("\n");
      if (imageParts.length > 0) {
        fullPrompt += `\nAnalyze these images and respond in Vietnamese:`;
      } else {
        fullPrompt += `\nTrả lời bằng tiếng Việt:`;
      }

      let responseText = '';
      let lastError = null;

      for (const apiKey of API_KEYS) {
        try {
          responseText = await generateContentWithAPI(apiKey, fullPrompt, imageParts);
          if (responseText) break;
        } catch (error) {
          lastError = error;
          if (error.message === 'QUOTA_EXCEEDED') {
            console.log(`API Key ${apiKey} quota exceeded. Trying next key...`);
            continue;
          }
          console.error(`API Key ${apiKey} error:`, error);
        }
      }

      if (!responseText) {
        throw lastError || new Error("All APIs failed");
      }

      manageConversationHistory(senderID, `Bot: ${responseText}`);
      await saveDataToFile();

      let replyMessage = responseText.text;
      
      if (responseText.sentiment.score !== 0) {
        replyMessage += `\n\n💭 Tone: ${responseText.sentiment.mood}`;
      }

      if (responseText.summary) {
        replyMessage += `\n\n📝 Tóm tắt:\n${responseText.summary}`;
      }

      if (responseText.text.length < 500) {
        const audioPath = path.join(__dirname, 'cache', `audio_${Date.now()}.mp3`);
        await textToSpeech(responseText.text, audioPath);
        
        const response = await actions.reply({
          body: replyMessage,
          attachment: fs.createReadStream(audioPath)
        });
        
        setTimeout(() => fs.unlinkSync(audioPath), 1000);
        
        if (response && response.messageID) {
          updateLastMessage(senderID, response.messageID, prompt);
        }
      } else {
        const response = await actions.reply(replyMessage);
        
        if (response && response.messageID) {
          updateLastMessage(senderID, response.messageID, prompt);
        }
      }

    } catch (error) {
      console.error("Error generating content:", error);
      const errorMessage = error.message.includes('fetch failed') 
        ? "⚠️ Lỗi kết nối mạng, vui lòng thử lại sau."
        : "⚠️ Hệ thống đang quá tải, vui lòng thử lại sau.";
      return await actions.reply(errorMessage);
    }
  }
};
