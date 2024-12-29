const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "img",
  usedby: 0,
  info: "Tạo hình ảnh AI dựa trên mô tả văn bản",
  dev: "Jonell Magallanes",
  onPrefix: false,
  cooldowns: 9,

  onLaunch: async function ({ api, event, target, actions }) {
    const prompt = target.join(" ");
    if (!prompt) return api.sendMessage("Vui lòng cung cấp mô tả để tạo hình ảnh.", event.threadID, event.messageID);
 actions.react("📝");

    const imagePath = path.join(__dirname, 'cache', 'imagine.png');
    if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });

    try {
      const response = await axios.get(`https://ccprojectapis.ddns.net/api/flux?prompt=${encodeURIComponent(prompt)}`, {
        responseType: 'arraybuffer'
      });
  
      fs.writeFileSync(imagePath, response.data);
        
     actions.react("✅");
      api.sendMessage({
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, event.messageID);
       
    } catch (error) {
      console.error("Error generating image:", error);
      api.sendMessage(error.messageID, event.threadID, event.messageID);
    }
  }
};
