const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { createReadStream, unlinkSync } = require('fs');

module.exports = {
  name: "admin",
  category: "Admin Commands",
  info: "Quản lý bot",
  dev: "Merged by HNT",
  usedby: 2,
  cooldowns: 10,
  usages: "[subcommand]",
  onPrefix: true,

  onLaunch: async function ({ api, event, target }) {
    const subcommand = target[0]?.toLowerCase();
    const threadID = event.threadID;
    const messageID = event.messageID;

    switch (subcommand) {
      case "out":
        if (!target[1]) {
          return api.removeUserFromGroup(api.getCurrentUserID(), threadID);
        }
        if (!isNaN(target[1])) {
          return api.removeUserFromGroup(api.getCurrentUserID(), target.slice(1).join(" "));
        }
        break;

      case "shutdown":
        const confirmationMessage = `❓ Xác nhận tắt bot\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận tắt bot hoặc phản hồi (👎) để hủy bỏ.`;
        const sentMessage = await api.sendMessage(confirmationMessage, threadID);
        global.client.callReact.push({ messageID: sentMessage.messageID, name: this.name, action: "shutdown" });
        break;

      case "restart":
        api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID, (err) => {
          if (err) {
            console.error("Gửi tin nhắn khởi động lại thất bại:", err);
          } else {
            process.exit(1);
          }
        });
        break;

      case "setavt":
        const tempPath = path.join(__dirname, "cache", `avatar_${Date.now()}.png`);
        const loadingMessage = await api.sendMessage("⏳ Đang xử lý hình ảnh...", threadID);

        try {
          let imageUrl, caption = "";
          if (target.length > 1) {
            if (target[1].match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) {
              imageUrl = target[1];
              caption = target.slice(2).join(" ");
            } else {
              caption = target.slice(1).join(" ");
            }
          }

          if (event.messageReply && event.messageReply.attachments[0]) {
            const attachment = event.messageReply.attachments[0];
            if (!['photo', 'animated_image'].includes(attachment.type)) {
              api.unsendMessage(loadingMessage.messageID);
              return api.sendMessage("❌ Vui lòng chỉ dùng hình ảnh hoặc GIF!", threadID, messageID);
            }
            imageUrl = attachment.url;
          } else if (!imageUrl) {
            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(
              "📝 Hướng dẫn sử dụng setavatar:\n\n" +
              "1. Reply ảnh + admin setavt [caption]\n" +
              "2. admin setavt [link ảnh] [caption]\n\n" +
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
        break;

      case "file":
        const fileCommand = require('./file');
        return fileCommand.onLaunch({ api, event, target: target.slice(1) });

      default:
        api.sendMessage(
          "📝 HƯỚNG DẪN SỬ DỤNG LỆNH ADMIN 📝\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "🔸 admin out: Rời khỏi nhóm chat hiện tại\n" +
          "🔸 admin out [threadID]: Rời khỏi nhóm chat cụ thể\n\n" +
          "🔸 admin shutdown: Tắt bot với xác nhận\n\n" +
          "🔸 admin restart: Khởi động lại bot\n\n" +
          "🔸 admin setavt: Thay đổi avatar bot\n" +
          "   ➤ Reply ảnh + admin setavt [caption]\n" +
          "   ➤ admin setavt [link ảnh] [caption]\n\n" +
          "🔸 admin file: Quản lý tệp tin hệ thống\n",
          threadID, messageID
        );
    }
  },

  callReact: async function ({ reaction, event, api }) {
    const { threadID } = event;

    if (reaction === '👍' && global.client.callReact.find(r => r.action === "shutdown")) {
      await api.sendMessage("📴 Đang tắt bot\n━━━━━━━━━━━━━━━━━━\nBot sẽ tắt trong giây lát...", threadID);
      console.log("Bot đang được tắt theo yêu cầu...");
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } else if (reaction === '👎') {
      api.sendMessage("❌ Tắt bot đã bị hủy", threadID);
    }
  }
};
