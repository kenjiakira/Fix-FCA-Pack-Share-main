const fs = require('fs');
const path = require('path');

module.exports = {
  name: "threadname",
  info: "Cập nhật khi tên nhóm thay đổi",
  pro: "HNT",

  onEvents: async function({ api, event }) {
    const { threadID, author, logMessageType, logMessageData } = event;

    if (logMessageType === "log:thread-name") {
      const newName = logMessageData.name || "Tên nhóm mới";
      let authorName;

      try {
        const userInfo = await api.getUserInfo(author);
        authorName = userInfo[author]?.name || "Người dùng Facebook";
      } catch (error) {
        console.error(`Thất bại khi lấy tên của userID: ${author}`, error);
        authorName = `Người dùng Facebook (${author})`;
      }

      api.sendMessage(
        `🔔 [Thông báo] Tên nhóm đã được thay đổi!\n` +
        `👤 Người thay đổi: ${authorName}\n` +
        `🏷️ Tên mới: ${newName}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`,
        threadID
      );
    }
  }
};