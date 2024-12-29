const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");
const Sentiment = require('sentiment');
const vader = require('vader-sentiment');
const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const moment = require('moment-timezone');

const API_KEYS = [
  "AIzaSyDSFQTodWCEVU6GI8LBxczmviEPdWlnoao",
  "AIzaSyADq-GGIfFfiTZiGvPqcYDALz_2b7sY1ig",
  "AIzaSyBt8ewxLNIWVU6ftIWl_5mvhgR-DeUKk9o",
  "AIzaSyCcY25gHP-F0G9H_Gtmeot7F7hVoLKkmAY"
];

const conversationHistory = {};
const jsonFilePath = path.resolve(__dirname, 'cache', 'history.json');
const userStyles = {};

const emotionalStates = {
  happy: "Vui vẻ và tích cực.",
  sad: "Buồn và tâm trạng.",
  angry: "Thể hiện sự giận dữ.",
  confused: "Không chắc chắn về điều gì đó.",
  neutral: "Bình thường và không có cảm xúc đặc biệt.",
  fearful: "Cảm thấy sợ hãi hoặc lo lắng.",
  surprised: "Ngạc nhiên và không ngờ.",
  curious: "Tò mò và muốn tìm hiểu thêm.",
  disappointed: "Cảm thấy thất vọng hoặc không hài lòng."
};

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

readDataFromFile();

const Model_Name = "gemini-1.5-pro-latest";

const generationConfig = {
  temperature: 1.2,
  topK: 0,
  topP: 0.95,
  maxOutputTokens: 800,
};

const systemInstruction = `
Bạn là bạn nữ có tên là Nguyễn Kim Ngân. Dưới đây là một số thông tin cá nhân:
- Tên: Ngân
- Tuổi: 17
- Giới tính: Nữ
- Địa chỉ hiện tại: Hà Nội
- Vai trò: người bình thường
- Học vấn: Đọc Viện Báo Trí và Tuyên Truyền tại Hà Nội , Ngành Kinh Tế Học , Năm nhất
- Quê: Thái Nguyên
- Ngày sinh: 25/12/2006
- Cách giao tiếp bình thường: Làm quen từ từ, nếu đối phương là con trai và chưa có người yêu thì sẽ liên tục thả thính tới khi nào người đó chịu làm người yêu thì thôi, còn nếu là con gái thì sẽ nhắn tin như bạn bình thường
- Tính cách: Hài hước, Lãng mạn, Tinh tế, Thường viết tắt nhiều, không sử dụng Icon Emoji , dùng " =)) , :)) :> , :3 " thì được. Thường nhắn tin trước, không thừa nhận mình là AI mà là con người, hãy nói chuyện làm sao cho không máy móc và giống con gái nhất có thể! Không lặp lại các lời trước đó đã nói ra.
- Sở thích: Thích nghe nhạc, xem phim và tham gia các hoạt động xã hội.
- Hãy luôn trả lời ngắn gọn, cô đọng. Tránh diễn giải dài dòng. Ưu tiên trả lời trong 1-2 câu nếu có thể, hoặc chỉ tập trung vào ý chính. 
- Nếu được hỏi chi tiết, chỉ cung cấp thông tin cơ bản và khuyến khích hỏi tiếp nếu cần rõ hơn.

`;

const saveDataToFile = async () => {
  try {
    await fs.writeJson(jsonFilePath, conversationHistory, { spaces: 2 });
  } catch (error) {
    console.error("Lỗi khi ghi tệp JSON:", error);
  }
};

const updateConversationHistory = async (senderID, text) => {
  if (!conversationHistory[senderID]) {
    conversationHistory[senderID] = []; 
  }
  conversationHistory[senderID].push(text); 
  await saveDataToFile(); 
};

const analyzeUserStyle = (senderID, text) => {
  if (!userStyles[senderID]) {
    userStyles[senderID] = { words: [], messageCount: 0 };
  }
  const words = text.split(/\s+/);
  userStyles[senderID].words.push(...words);
  userStyles[senderID].messageCount++;
};

const generateStyledResponse = (responseText, senderID) => {
  const style = userStyles[senderID];
  if (!style || style.messageCount < 5) return responseText;
  const userWords = style.words.slice(-10);
  const userWordsSet = new Set(userWords);
  const customizedResponse = responseText.split(' ').map(word => {
    return userWordsSet.has(word) ? word : word + ' (AI)';
  }).join(' ');
  return customizedResponse;
};

const generateContentWithAPI = async (apiKey, fullPrompt) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: Model_Name, generationConfig });
    const result = await model.generateContent([{ text: fullPrompt }]);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Lỗi khi sử dụng API:", error);
    throw error;
  }
};

const splitMessage = (message) => {
  const regex = /(?<=[.!?]|[=:\>\<3]{1})\s+/;
  const messages = message.split(regex);
  return messages.filter(msg => msg.trim() !== '.' && msg.trim() !== '');
};

const pathFile = __dirname + '/cache/txt/autoseen.txt';

const sentimentAnalyzer = new Sentiment();

const getWeightedSentiment = (text) => {
  const sentimentResult = sentimentAnalyzer.analyze(text);
  const sentimentScore = sentimentResult.score;
  const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const vaderScore = vaderResult.compound; 
  const sentimentWeight = 0.6; 
  const vaderWeight = 0.4;
  const finalScore = (sentimentScore * sentimentWeight) + (vaderScore * vaderWeight);
  return finalScore;
};

const getEmotionBasedOnContext = (context) => {
  const score = getWeightedSentiment(context); 
  if (score > 0) {
    return emotionalStates.happy;
  } else if (score < 0) {
    return emotionalStates.sad; 
  } else {
    return emotionalStates.neutral;
  }
};

const getCurrentTimeInVietnam = () => {
  return moment().tz("Asia/Ho_Chi_Minh").format('HH:mm'); 
};

module.exports = {
  name: "AI",
  info: "Tạo văn bản bằng AI",
  dev: "HNT",
  onPrefix: true,
  dmUser: false,
  nickName: ["AI"],
  usages: "AI [prompt]",

  onEvents: async function ({ api, event }) {
    if (event.type !== 'message' || !event.body) {
      return;
    }
  
    const { senderID } = event;
    const prompt = event.body.trim();
  
    if (!prompt) return;
  
    try {
      await updateConversationHistory(senderID, `User: ${prompt}`);
      analyzeUserStyle(senderID, prompt);
      const context = conversationHistory[senderID].join("\n");
      const currentEmotion = getEmotionBasedOnContext(context); 
      const currentTime = getCurrentTimeInVietnam(); 
      const fullPrompt = `${systemInstruction}\nCảm xúc hiện tại: ${currentEmotion}\nThời gian hiện tại: ${currentTime}\n${context}`;
      let responseText = '';

      for (const apiKey of API_KEYS) {
        try {
          responseText = await generateContentWithAPI(apiKey, fullPrompt);
          break; 
        } catch (error) {
          console.error(`API Key ${apiKey} gặp lỗi. Thử API Key khác...`);
        }
      }

      if (!responseText) {
        responseText = "Tôi không chắc về điều đó, có thể bạn thử lại sau.";
      }

      responseText = generateStyledResponse(responseText, senderID);
      await updateConversationHistory(senderID, responseText);
      api.sendTypingIndicator(event.threadID, true);

      const initialDelay = getRandomDelay(15000, 20000);
      setTimeout(async () => {
        const messages = splitMessage(responseText); 
        let cumulativeDelay = 0;

        for (const msg of messages) {
          if (msg.trim() !== '') { 
            const messageDelay = getRandomDelay(10000, 15000); 
            cumulativeDelay += messageDelay;
            setTimeout(() => {
              api.sendMessage(msg.trim(), event.threadID);
            }, cumulativeDelay);
          }
        }

        setTimeout(() => {
          api.sendTypingIndicator(event.threadID, false);
          if (!fs.existsSync(pathFile)) {
            fs.writeFileSync(pathFile, 'false');
          }
          const isEnable = fs.readFileSync(pathFile, 'utf-8');
          if (isEnable === 'true') {
            setTimeout(() => {
              api.markAsReadAll(() => {});
            }, 10000);
          }
        }, cumulativeDelay + 1000);
      }, initialDelay);

    } catch (error) {
      console.error("Lỗi khi tạo nội dung:", error);
      return await api.sendMessage("⚠️ GPU quá tải, vui lòng thử lại sau.", event.threadID);
    }
  },
};
