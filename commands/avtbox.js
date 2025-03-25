const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "avtbox",
  dev: "HNT",
  category: "Groups",
  info: "Lấy ảnh đại diện và thông tin nhóm chat",
  onPrefix: true,
  dmUser: false,
  usedby: 0,
  usages: "avtbox [ID nhóm] - Nếu không có ID sẽ lấy avt và thông tin nhóm hiện tại",
  cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    try {
      const { threadID, messageID } = event;
      
      // Determine which thread ID to use
      let targetThreadID = threadID;
      
      // If a thread ID was provided in the command
      if (target.length > 0 && !isNaN(target[0])) {
        targetThreadID = target[0];
      }
      
      // Create cache directory if it doesn't exist
      const cachePath = path.join(__dirname, 'cache');
      if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath, { recursive: true });
      }
      
      // Get thread info
      const threadInfo = await api.getThreadInfo(targetThreadID);
      
      if (!threadInfo) {
        return api.sendMessage(
          "❌ Không thể tìm thấy thông tin nhóm này!",
          threadID,
          messageID
        );
      }
      
      // Format the creation time
      const creationDate = new Date(threadInfo.threadID < 0 ? 0 : parseInt(threadInfo.threadID.substring(0, 15)));
      const creationTimeStr = creationDate.toLocaleString('vi-VN');
      
      // Calculate male/female ratio
      let maleCount = 0;
      let femaleCount = 0;
      let otherCount = 0;
      
      if (threadInfo.userInfo) {
        threadInfo.userInfo.forEach(user => {
          if (user.gender === 1) femaleCount++;
          else if (user.gender === 2) maleCount++;
          else otherCount++;
        });
      }
      
      // Calculate active/inactive users
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      let activeCount = 0;
      
      if (threadInfo.userInfo) {
        threadInfo.userInfo.forEach(user => {
          if (user.lastActive && user.lastActive > threeDaysAgo) {
            activeCount++;
          }
        });
      }
      
      // Prepare information message
      let infoMessage = `📊 THÔNG TIN NHÓM 📊\n`;
      infoMessage += `━━━━━━━━━━━━━━━━━━\n\n`;
      infoMessage += `👥 Tên nhóm: ${threadInfo.threadName || "Không có tên"}\n`;
      infoMessage += `🆔 ID nhóm: ${targetThreadID}\n`;
      infoMessage += `👨‍👩‍👧‍👦 Thành viên: ${threadInfo.participantIDs.length}\n`;
      infoMessage += `👑 Quản trị viên: ${threadInfo.adminIDs ? threadInfo.adminIDs.length : "Không xác định"}\n`;
      
      if (maleCount > 0 || femaleCount > 0) {
        infoMessage += `👨 Nam: ${maleCount} (${Math.round(maleCount / threadInfo.userInfo.length * 100)}%)\n`;
        infoMessage += `👩 Nữ: ${femaleCount} (${Math.round(femaleCount / threadInfo.userInfo.length * 100)}%)\n`;
        if (otherCount > 0) {
          infoMessage += `👤 Khác: ${otherCount}\n`;
        }
      }
      
      infoMessage += `🔔 Tổng tin nhắn: ${threadInfo.messageCount || "Không xác định"}\n`;
      infoMessage += `📅 Ngày tạo: ${creationTimeStr}\n`;
      
      if (threadInfo.emoji) {
        infoMessage += `😊 Emoji: ${threadInfo.emoji}\n`;
      }
      
      if (activeCount > 0) {
        infoMessage += `⚡ Hoạt động: ${activeCount} thành viên (${Math.round(activeCount / threadInfo.participantIDs.length * 100)}%)\n`;
      }
      
      // Check if the thread has approval mode on
      if (threadInfo.approvalMode === true) {
        infoMessage += `🔒 Phê duyệt thành viên: Bật\n`;
      }
      
      // Check if thread has a nickname
      if (threadInfo.nicknames && Object.keys(threadInfo.nicknames).length > 0) {
        infoMessage += `👤 Số thành viên đặt biệt danh: ${Object.keys(threadInfo.nicknames).length}\n`;
      }
      
      // Check if the thread has an image
      if (!threadInfo.imageSrc) {
        return api.sendMessage(
          infoMessage + "\n❌ Nhóm này không có ảnh đại diện!",
          threadID,
          messageID
        );
      }
      
      // Get image using Facebook Graph API
      const avatarUrl = `https://graph.facebook.com/${targetThreadID}/picture?width=1000&height=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      
      // Save the image temporarily
      const avatarPath = path.join(cachePath, `group_avatar_${targetThreadID}.jpg`);
      fs.writeFileSync(avatarPath, response.data);
      
      // Send the image with info
      await api.sendMessage(
        {
          body: infoMessage,
          attachment: fs.createReadStream(avatarPath)
        },
        threadID,
        messageID
      );
      
      // Clean up the temporary file
      setTimeout(() => {
        fs.unlink(avatarPath, (err) => {
          if (err) console.error('Lỗi khi xóa file ảnh tạm:', err);
        });
      }, 10000);
      
    } catch (error) {
      console.error('Avatar Box Error:', error);
      
      if (error.response?.status === 404 || error.message.includes('not found')) {
        return api.sendMessage(
          "❌ Không tìm thấy nhóm này hoặc nhóm không có ảnh đại diện!",
          event.threadID,
          event.messageID
        );
      }
      
      if (error.response?.status === 403 || error.message.includes('permission')) {
        return api.sendMessage(
          "❌ Bot không có quyền truy cập ảnh đại diện của nhóm này!",
          event.threadID,
          event.messageID
        );
      }
      
      return api.sendMessage(
        "❌ Đã có lỗi xảy ra khi lấy ảnh đại diện và thông tin nhóm!",
        event.threadID,
        event.messageID
      );
    }
  }
};
