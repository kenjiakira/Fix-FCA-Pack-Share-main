const axios = require('axios'); 
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cacheDir = path.join(__dirname, 'cache', 'images', 'tiktok');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}
    

module.exports = {
  name: 'tiktok',
  info: 'Tải video, hình ảnh hoặc chuyển video thành nhạc MP3 từ TikTok',
  dev: 'HNT',
  usedby: 0,
  onPrefix: true, 
  dmUser: false, 
  nickName: ['tiktok', 'tảivideo'],
  usages: 'tiktok [URL TikTok]',
  cooldowns: 5, 

  onLaunch: async function({ api, event, actions }) {
      const { threadID, messageID, body } = event;
      const url = body.trim().split(' ')[1];

      if (!url) {
          return actions.reply("❌ Vui lòng cung cấp URL hợp lệ. 🌐");
      }

      await processTikTokUrl(url, api, threadID, messageID);
  },
};

const processTikTokUrl = async (url, api, threadID, messageID) => {
  if (!is_url(url)) {
      return api.sendMessage("❌ Vui lòng cung cấp URL hợp lệ. 🌐", threadID, messageID);
  }

  if (/tiktok\.com/.test(url)) {
      try {
          const res = await axios.post('https://www.tikwm.com/api/', { url });

          if (res.data.code !== 0) {
              return api.sendMessage("⚠️ Không thể tải nội dung từ URL này. 😢", threadID, messageID);
          }

          const tiktok = res.data.data;
          let attachments = [];
          let filePaths = [];

          if (Array.isArray(tiktok.images) && tiktok.images.length > 0) {
              for (let imageUrl of tiktok.images) {
                  const imagePath = await stream_url(imageUrl, 'jpg');
                  attachments.push(fs.createReadStream(imagePath));
                  filePaths.push(imagePath);
              }
          } else if (tiktok.play) {
              const videoPath = await stream_url(tiktok.play, 'mp4');
              attachments.push(fs.createReadStream(videoPath));
              filePaths.push(videoPath);
          }

          await api.sendMessage({
              body: `==[ TIKTOK ATDOWN ]==\n\n🎬 -Tiêu đề: ${tiktok.title}\n❤️ -Lượt thích: ${tiktok.digg_count}\n👤 -Tác giả: ${tiktok.author.nickname}\n🆔 -ID TikTok: ${tiktok.author.unique_id}`,
              attachment: attachments
          }, threadID, messageID);

          cleanupFiles(filePaths);
          
      } catch (error) {
          console.error("Lỗi trong quá trình xử lý:", error);
          return api.sendMessage("❌ Đã xảy ra lỗi khi xử lý yêu cầu của bạn. 😥", threadID, messageID);
      }
  } else {
      return api.sendMessage("⚠️ Vui lòng cung cấp URL TikTok hợp lệ. 📲", threadID, messageID);
  }
};

const is_url = (url) => /^http(s)?:\/\//.test(url);

const stream_url = async (url, type) => {
  try {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const filePath = path.join(cacheDir, `${Date.now()}.${type}`);
      fs.writeFileSync(filePath, res.data);
      return filePath; 
  } catch (error) {
      console.error("Lỗi khi tải tệp từ URL:", error);
      throw new Error("Không thể tải tệp từ URL");
  }
};

const cleanupFiles = (filePaths) => {
  setTimeout(() => {
      filePaths.forEach(filePath => {
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Đã xóa tệp: ${filePath}`);
          }
      });
  }, 1000 * 60); 
};
