const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createReadStream, unlinkSync } = require('fs');

module.exports = {
  name: "setavt",
  dev: "HNT",
  usedby: 2,
  info: "Thay đổi avatar của bot",
  onPrefix: true,
  usages: "[caption] + reply hình ảnh hoặc nhập link",
  cooldowns: 300,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, messageReply } = event;
    const tempPath = path.join(__dirname, "cache", `avatar_${Date.now()}.png`);
    
    const loadingMessage = await api.sendMessage("⏳ Đang xử lý hình ảnh...", threadID);
    
    try {
      let imageUrl, caption = "";
      
      if (target.length > 0) {
        if (target[0].match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) {
          imageUrl = target[0];
          caption = target.slice(1).join(" ");
        } else {
          caption = target.join(" ");
        }
      }
      
      if (messageReply && messageReply.attachments[0]) {
        const attachment = messageReply.attachments[0];
        if (!['photo', 'animated_image'].includes(attachment.type)) {
          api.unsendMessage(loadingMessage.messageID);
          return api.sendMessage("❌ Vui lòng chỉ dùng hình ảnh hoặc GIF!", threadID, messageID);
        }
        imageUrl = attachment.url;
      } else if (!imageUrl) {
        api.unsendMessage(loadingMessage.messageID);
        return api.sendMessage(
          "📝 Hướng dẫn sử dụng setavatar:\n\n" +
          "1. Reply ảnh + setavatar [caption]\n" +
          "2. setavatar [link ảnh] [caption]\n\n" +
          "💡 Caption là tùy chọn, có thể để trống",
          threadID, messageID
        );
      }

      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      if (imageBuffer.length > 10 * 1024 * 1024) {
        api.unsendMessage(loadingMessage.messageID);
        return api.sendMessage("❌ Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB", threadID, messageID);
      }

      fs.writeFileSync(tempPath, imageBuffer);

      api.sendMessage("⌛ Đang cập nhật avatar...", threadID, loadingMessage.messageID);

      await api.changeAvatar(createReadStream(tempPath), caption);
      
      api.unsendMessage(loadingMessage.messageID);
      api.sendMessage({
        body: `✅ Đã thay đổi avatar bot thành công!\n${caption ? `📝 Caption: ${caption}` : ""}`,
        attachment: createReadStream(tempPath)
      }, threadID, messageID);

    } catch (error) {
      console.error('Set Avatar Error:', error);
      api.unsendMessage(loadingMessage.messageID);
      api.sendMessage(
        "❌ Lỗi khi thay đổi avatar bot:\n" +
        `${error.message || "Vui lòng thử lại sau"}`,
        threadID, messageID
      );
    } finally {
      if (fs.existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    }
  }
};
