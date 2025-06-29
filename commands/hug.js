const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getUserName } = require('../utils/userUtils');

module.exports = {
  name: "hug",
  dev: "HNT",
  category: "Giải Trí",
  info: "Ôm người bạn muốn",
  onPrefix: true,
  dmUser: false,
  usages: "hug [tag]",
  cooldowns: 5,

  onLaunch: async ({ api, event }) => {
    try {
      const hugGifs = [
        "https://imgur.com/Fxlhzwj.gif",
        "https://imgur.com/yRZ3rcS.gif",
        "https://imgur.com/X8Lv9tD.gif",
        "https://imgur.com/X5c71sG.gif"
      ];

      const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
      let targetID;

      if (event.type === 'message_reply') {
        targetID = event.messageReply.senderID;
      }
      else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      else {
        return api.sendMessage(
          "Cú pháp: hug [@Tag/Reply]\n" +
          "- Reply: Reply tin nhắn + gõ hug\n" +
          "- Tag: @mention + hug",
          event.threadID, event.messageID
        );
      }
      const senderName = getUserName(event.senderID) || "Người dùng";
      const targetName = getUserName(targetID) || "Người ấy";
      
      const msg = `${senderName} đã ôm ${targetName} 🤗`;

      const imgPath = path.join(__dirname, 'cache/hug.gif');
      const response = await axios.get(randomGif, { responseType: 'arraybuffer' });
      fs.writeFileSync(imgPath, response.data);

      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, event.messageID);

      fs.unlink(imgPath, (err) => {
        if (err) console.error('Lỗi khi xóa file:', err);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Có lỗi xảy ra khi thực hiện lệnh!", event.threadID, event.messageID);
    }
  }
};
