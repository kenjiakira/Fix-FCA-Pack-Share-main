const axios = require('axios');

module.exports = {
  name: "holiday",
  dev: "HNT",
  info: "Xem ngày lễ của các quốc gia",
  onPrefix: true,
  dmUser: false,
  usedby: 0,
  usages: "holiday [mã quốc gia] [năm]",
  cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    try {
      if (target.length !== 2) {
        return api.sendMessage(
          "📅 Hướng dẫn sử dụng:\n" +
          "holiday [mã quốc gia] [năm]\n\n" +
          "Ví dụ: holiday VN 2024\n\n" +
          "Một số mã quốc gia phổ biến:\n" +
          "🇻🇳 VN - Việt Nam\n" +
          "🇺🇸 US - Hoa Kỳ\n" +
          "🇯🇵 JP - Nhật Bản\n" +
          "🇰🇷 KR - Hàn Quốc\n" +
          "🇨🇳 CN - Trung Quốc\n" +
          "🇬🇧 GB - Anh\n" +
          "🇫🇷 FR - Pháp",
          event.threadID,
          event.messageID
        );
      }

      const countryCode = target[0].toUpperCase();
      const year = target[1];

      const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      
      if (response.data.length === 0) {
        return api.sendMessage(
          "❌ Không tìm thấy dữ liệu ngày lễ cho quốc gia này.",
          event.threadID,
          event.messageID
        );
      }

      let message = `📅 Ngày lễ ${countryCode} năm ${year}:\n\n`;
      response.data.forEach(holiday => {
        message += `📌 ${holiday.date}: ${holiday.name}\n`;
      });

      return api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        "❌ Đã có lỗi xảy ra. Vui lòng kiểm tra lại mã quốc gia và năm.",
        event.threadID,
        event.messageID
      );
    }
  }
};
