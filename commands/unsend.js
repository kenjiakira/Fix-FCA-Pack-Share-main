const fs = require('fs');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
  name: "unsend",
  usedby: 0,
  dev: "HNT",
  onPrefix: false,
  cooldowns: 1,
  info: "Hủy tin nhắn",

  onLaunch: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const userIsGroupAdmin = threadInfo.adminIDs.some(idInfo => idInfo.id === event.senderID);
      const userIsConfigAdmin = adminConfig.adminUIDs.includes(event.senderID);

      if (!userIsGroupAdmin && !userIsConfigAdmin) {
        return api.sendMessage({
          body: "⚠️ Quyền hạn không đủ!\n- Bạn cần là quản trị viên nhóm hoặc admin bot để sử dụng lệnh này.",
          attachment: null
        }, event.threadID);
      }

      if (event.type !== "message_reply") {
        return api.sendMessage("❌ Vui lòng trả lời tin nhắn cần xóa!", event.threadID);
      }

      if (event.messageReply.senderID !== api.getCurrentUserID()) {
        return api.sendMessage("⚠️ Chỉ có thể xóa tin nhắn của bot!", event.threadID);
      }

      const messageAge = Date.now() - event.messageReply.timestamp;
      if (messageAge > 3600000) { 
        return api.sendMessage("⚠️ Không thể xóa tin nhắn cũ hơn 1 giờ!", event.threadID);
      }

      await api.unsendMessage(event.messageReply.messageID);
 
      const successMsg = await api.sendMessage("✅ Đã xóa tin nhắn thành công!", event.threadID);
      setTimeout(() => api.unsendMessage(successMsg.messageID), 5000);

    } catch (error) {
      console.error("Unsend error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", event.threadID);
    }
  }
};
