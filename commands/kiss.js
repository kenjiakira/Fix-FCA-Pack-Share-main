const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "kiss",
  dev: "HNT",
  category: "Giải Trí",
  info: "hôn người bạn muốn",
  onPrefix: true,
  dmUser: false,
  usages: "kiss [tag]",
  cooldowns: 5,

  onLaunch: async ({ api, event }) => {
    try {
      const kissGifs = [
        "https://www.gifcen.com/wp-content/uploads/2022/03/anime-kiss-gif-7.gif",
        "https://media.tenor.com/jpvU7raCSIAAAAAM/shun-hashimoto-mio-chibana.gif",
        "https://i.gifer.com/8Sbz.gif",
        "https://www.gifcen.com/wp-content/uploads/2022/03/anime-kiss-gif-9.gif",
        "https://i.pinimg.com/originals/78/09/5c/78095c007974aceb72b91aeb7ee54a71.gif"
      ];

      const randomGif = kissGifs[Math.floor(Math.random() * kissGifs.length)];
      let targetID;

      if (event.type === 'message_reply') {
        targetID = event.messageReply.senderID;
      } 
      else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      else {
        return api.sendMessage(
          "Cú pháp: kiss [@Tag/Reply]\n" +
          "- Reply: Reply tin nhắn + gõ kiss\n" +
          "- Tag: @mention + kiss",
          event.threadID, event.messageID
        );
      }

      const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
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

      const msg = `${senderName} đã hôn ${targetName} 🤗`;

      const imgPath = path.join(__dirname, 'cache/kiss.gif');
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
