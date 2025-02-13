const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "avt",
  dev: "HNT",
  info: "Lấy ảnh avatar của người dùng",
  onPrefix: true,
  dmUser: false,
  usedby: 0,
  usages: "avt ID, avt Reply, avt @Tag",
  cooldowns: 0,

  onLaunch: async ({ api, event, target }) => {
    try {
      let uid;

      if (event.type === 'message_reply') {
        uid = event.messageReply.senderID;
      } 
      else if (Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      else if (target.length === 0) {
        return api.sendMessage(
          "Cú pháp: avt [ID/Reply/@Tag]\n" +
          "- ID: avt 100000123456789\n" +
          "- Reply: Reply tin nhắn + gõ avt\n" +
          "- Tag: @mention + avt",
          event.threadID, event.messageID
        );
      } else {
        uid = target[0];
        if (isNaN(uid)) {
          return api.sendMessage("❌ ID không hợp lệ!", event.threadID, event.messageID);
        }
      }

      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

      const avatarPath = path.join(__dirname, '../commands/cache/avatar.jpg');
      fs.writeFileSync(avatarPath, response.data);

      api.sendMessage({
        body: `📸 Avatar của ID: ${uid}`,
        attachment: fs.createReadStream(avatarPath)
      }, event.threadID, event.messageID);

      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error('Lỗi khi xóa tệp hình ảnh:', err);
        }
      });

    } catch (error) {
      return api.sendMessage("❌ Không thể lấy avatar, vui lòng thử lại sau!", event.threadID, event.messageID);
    }
  }
};
