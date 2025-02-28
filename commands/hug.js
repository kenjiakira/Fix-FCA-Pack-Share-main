const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

      const userDataPath = path.join(__dirname, '../events/cache/userData.json');
      let senderName, targetName;

      try {
        const userInfo = await api.getUserInfo([event.senderID, targetID]);
        senderName = userInfo[event.senderID]?.name || "Người dùng";
        targetName = userInfo[targetID]?.name || "Người ấy";
      } catch (err) {
        console.error("Error getting user info from API, trying userData.json");
        try {
          const userDataJson = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
          senderName = userDataJson[event.senderID]?.name || "Người dùng";
          targetName = userDataJson[targetID]?.name || "Người ấy";
        } catch (jsonErr) {
          console.error("Error reading from userData.json:", jsonErr);
          senderName = "Người dùng";
          targetName = "Người ấy";
        }
      }

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
