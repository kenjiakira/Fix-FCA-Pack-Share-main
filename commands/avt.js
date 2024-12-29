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
        const mentionedUID = Object.keys(event.mentions)[0];
        uid = mentionedUID;
      }
      else if (target.length === 0) {
        return api.sendMessage(
          "Cách sử dụng lệnh `avt`:\n\n" +
          "1. `avt [ID]`: Bạn có thể lấy ảnh avatar của người dùng Facebook qua ID của họ. Ví dụ: `avt 1234567890`\n" +
          "   - Thay `1234567890` bằng ID của người bạn muốn lấy ảnh.\n\n" +
          "2. `avt Reply`: Nếu bạn muốn lấy ảnh avatar của người mà bạn đang trả lời tin nhắn.\n" +
          "   - Trả lời tin nhắn của người đó và gõ `avt Reply` để lấy ảnh của họ.\n\n" +
          "3. `avt @Tag`: Nếu bạn muốn lấy ảnh avatar của người được tag trong tin nhắn.\n" +
          "   - Gõ `@Tên người` để tag và nhận ảnh avatar của người đó.",
          event.threadID, event.messageID
        );
      } else {
        uid = target[0];
        if (isNaN(uid)) {
          return api.sendMessage("Vui lòng nhập một ID hợp lệ (chỉ là số). Ví dụ: `avt 1234567890`.", event.threadID, event.messageID);
        }
      }

      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

      const avatarPath = path.join(__dirname, '../commands/cache/avatar.jpg');
      fs.writeFileSync(avatarPath, response.data);

      api.sendMessage({
        body: `Đây là ảnh avatar của UID: ${uid}`,
        attachment: fs.createReadStream(avatarPath)
      }, event.threadID, event.messageID);

      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error('Lỗi khi xóa tệp hình ảnh:', err);
        }
      });

    } catch (error) {
      return api.sendMessage("Không thể lấy ảnh avatar. Vui lòng kiểm tra lại ID hoặc thử lại sau.", event.threadID, event.messageID);
    }
  }
};
