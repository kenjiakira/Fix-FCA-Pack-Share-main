const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "gen",
  usedby: 0,
  info: "Tạo hình ảnh AI",
  dev: "HNT",
  onPrefix: true,
  cooldowns: 15,

  onLaunch: async function ({ api, event, target, actions }) {
    const prompt = target.join(" ");
    if (!prompt) {
      return api.sendMessage("💭 Hãy mô tả điều bạn muốn tôi vẽ!", event.threadID, event.messageID);
    }

    const loadingMsg = await api.sendMessage(
      "🎨 Đang vẽ tác phẩm của bạn...\n⏳ Vui lòng đợi trong giây lát",
      event.threadID, event.messageID
    );

    const cacheDir = path.join(__dirname, 'cache');
    const imagePath = path.join(cacheDir, `gen_${Date.now()}.png`);
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      const response = await axios.get(
        `https://zaikyoo.onrender.com/api/dalle3?prompt=${encodeURIComponent(prompt)}`,
        { responseType: 'arraybuffer' }
      );
  
      fs.writeFileSync(imagePath, response.data);
      
      await api.sendMessage({
        body: `🎨 Đây là tác phẩm của bạn:\n━━━━━━━━━━━━\n🔍 Prompt: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => {
        api.unsendMessage(loadingMsg.messageID);
        fs.unlinkSync(imagePath);
      });
       
    } catch (error) {
      console.error("Error generating image:", error);
      api.unsendMessage(loadingMsg.messageID);
      api.sendMessage(
        "❌ Đã có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau!",
        event.threadID, event.messageID
      );
    }
  }
};
