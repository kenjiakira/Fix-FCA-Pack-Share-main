const axios = require('axios'); 
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const FormData = require('form-data');

const cacheDir = path.join(__dirname, 'cache', 'images', 'tiktok');
const ffmpegPath = 'D:\\ffmpeg\\bin\\ffmpeg.exe';

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
              await api.sendMessage({
                  body: `==[ TIKTOK ATDOWN ]==\n\n🎬 -Tiêu đề: ${tiktok.title}\n❤️ -Lượt thích: ${tiktok.digg_count}\n👤 -Tác giả: ${tiktok.author.nickname}\n🆔 -ID TikTok: ${tiktok.author.unique_id}`,
                  attachment: attachments
              }, threadID, messageID);

              cleanupFiles(filePaths);
              return;
          }

          if (tiktok.play && typeof tiktok.play === 'string') {
              const videoPath = await stream_url(tiktok.play, 'mp4');
              if (videoPath) {
                  const mp3Path = await convertVideoToMp3(videoPath);
                  const downloadLink = await uploadToFileIo(mp3Path);

                  attachments.push(fs.createReadStream(videoPath));
                  filePaths.push(videoPath);

                  const messageBody = `==[ TIKTOK ATDOWN ]==\n\n🎬 -Tiêu đề: ${tiktok.title}\n❤️ -Lượt thích: ${tiktok.digg_count}\n👤 -Tác giả: ${tiktok.author.nickname}\n🆔 -ID TikTok: ${tiktok.author.unique_id}\n\n🔗 -Link tải MP3: ${downloadLink}`;
                  
                  await api.sendMessage({ body: messageBody, attachment: attachments }, threadID, messageID);

                  cleanupFiles([...filePaths, mp3Path]);
                  return;
              }
          }

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

const convertVideoToMp3 = (videoPath) => {
  return new Promise((resolve, reject) => {
      const mp3Path = videoPath.replace(/\.(mp4|avi|mov)$/, '.mp3');
      
      exec(`"${ffmpegPath}" -i "${videoPath}" -vn -ar 44100 -ac 2 -b:a 192k "${mp3Path}"`, (error) => {
          if (error) {
              console.error('Lỗi khi chuyển đổi video thành MP3:', error.message);
              reject(error);
          } else {
              console.log('Chuyển đổi video thành MP3 hoàn tất');
              resolve(mp3Path);
          }
      });
  });
};

const uploadToFileIo = async (filePath) => {
  try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      
      const response = await axios.post('https://file.io', form, {
          headers: {
              ...form.getHeaders()
          },
      });

      if (response.data && response.data.link) {
          return response.data.link;
      } else {
          throw new Error('Không nhận được liên kết từ file.io');
      }
  } catch (error) {
      console.error('Lỗi khi tải tệp lên file.io:', error);
      throw new Error('Không thể tải tệp lên file.io');
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
