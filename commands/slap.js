const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "slap",
  dev: "HNT",
  category: "Giải Trí",
  info: "tát người bạn muốn",
  onPrefix: true,
  dmUser: false,
  usages: "slap [tag]",
  cooldowns: 5,

  onLaunch: async ({ api, event }) => {
    try {
      const slapGifs = [
        "https://media.tenor.com/XiYuU9h44-AAAAAM/anime-slap-mad.gif",
        "https://i.pinimg.com/originals/b6/d8/a8/b6d8a83eb652a30b95e87cf96a21e007.gif",
        "https://i.pinimg.com/originals/71/a5/1c/71a51cd5b7a3e372522b5011bdf40102.gif",
        "https://media1.tenor.com/m/Ws6Dm1ZW_vMAAAAC/girl-slap.gif",
        "https://i.pinimg.com/originals/d1/49/69/d14969a21a96ec46f61770c50fccf24f.gif",
        "https://i.imgur.com/vai8rS1.gif",
        "https://i.imgur.com/vai8rS1.gif"
      ];

      const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
      let targetID;

      if (event.type === 'message_reply') {
        targetID = event.messageReply.senderID;
      } 
      else if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }
      else {
        return api.sendMessage(
          "Cú pháp: slap [@Tag/Reply]\n" +
          "- Reply: Reply tin nhắn + gõ slap\n" +
          "- Tag: @mention + slap",
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

      const msg = `${senderName} đã tát ${targetName} `;

      const imgPath = path.join(__dirname, 'cache/slap.gif');
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
