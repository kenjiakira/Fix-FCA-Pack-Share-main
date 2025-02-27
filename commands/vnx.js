const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  name: "vnx",
  dev: "Hoàng Ngọc Từ",
  usedby: 0,
  category: "Tin Tức",
  info: "Xem tin tức",
  onPrefix: false,
  usages: "vnx",
  cooldowns: 5,

  onLaunch: async function({ api, event, actions }) {
    const source = 'https://vnexpress.net/tin-tuc-24h';

    try {
      const loadingMsg = await actions.reply("⏳ Đang tải tin tức từ VnExpress...");
      
      const response = await axios.get(source);
      const $ = cheerio.load(response.data);

      let news = [];
      
      $('.item-news').each((i, el) => {
        if (i < 3) { 
          const title = $(el).find('.title-news a').text().trim();
          const description = $(el).find('.description a').text().trim();
          const link = $(el).find('.title-news a').attr('href');
          const time = $(el).find('.time-count span').attr('datetime');
          
          if (title && description) {
            news.push({ title, description, link, time });
          }
        }
      });

      let message = `=== 【 𝗧𝗜𝗡 𝗧𝗨̛́𝗖 𝗩𝗡𝗘𝗫𝗣𝗥𝗘𝗦𝗦 】===\n`;
      message += `━━━━━━━━━━━━━━━━━━━\n\n`;
      
      news.forEach((item, index) => {
        message += `${index + 1}. 📰 ${item.title}\n`;
        message += `⏰ Thời gian: ${item.time || 'Không có'}\n`;
        message += `📝 ${item.description}\n`;
        message += `🔗 Link: ${item.link}\n\n`;
      });

      actions.reply(message).then(() => {
        api.unsendMessage(loadingMsg.messageID);
      });
    } catch (error) {
      console.error(error);
      actions.reply("❌ Đã xảy ra lỗi khi tải tin tức từ VnExpress. Vui lòng thử lại sau.");
    }
  }
};
