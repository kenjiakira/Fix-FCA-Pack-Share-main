
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "bilibili",
  dev: "HNT",
  info: "Lấy thông tin video từ Bilibili",
  onPrefix: true,
  dmUser: false,
  usedby: 0,
  usages: "bilibili [ID video]",
  cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    try {
      const videoId = target[0];
      if (!videoId) {
        return api.sendMessage("Vui lòng cung cấp ID video Bilibili.", event.threadID, event.messageID);
      }

      const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`);
      const videoData = response.data.data;

      if (!videoData) {
        return api.sendMessage("Không tìm thấy thông tin video.", event.threadID, event.messageID);
      }

      const message = {
        body: `🌟 Thông Tin Video Bilibili 🌟\n\n` +
              `Tiêu đề: ${videoData.title}\n` +
              `Mô tả: ${videoData.desc}\n` +
              `Lượt xem: ${videoData.stat.view}\n` +
              `Lượt thích: ${videoData.stat.like}\n` +
              `Lượt bình luận: ${videoData.stat.reply}\n` +
              `Link: https://www.bilibili.com/video/${videoId}`
      };

      await api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi lấy thông tin video. Vui lòng thử lại sau!", event.threadID, event.messageID);
    }
  }
};