const axios = require('axios'); 
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { TIKTOK_API } = require('../utils/api');
const cacheDir = path.join(__dirname, 'cache', 'images', 'tiktok');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

function isValidTikTokUrl(url) {
  // Match common TikTok URL formats:
  // - https://www.tiktok.com/@username/video/1234567890
  // - https://www.tiktok.com/@username/photo/1234567890
  // - https://vm.tiktok.com/XXXXXXXX/
  // - https://m.tiktok.com/v/1234567890.html
  return /^(https?:\/\/)?(www\.|vm\.|m\.)?tiktok\.com\/([@\w]+\/(video|photo)\/\d+|v\/\d+|[A-Za-z0-9]+\/?$)/.test(url);
}

module.exports = {
  name: 'tiktok',
  info: 'Tải video TikTok',
  dev: 'HNT',
  usedby: 0,
  category: 'Media',
  onPrefix: true, 
  dmUser: false, 
  nickName: ['tiktok', 'tảivideo'],
  usages: 'tiktok [URL TikTok]',
  cooldowns: 5, 

  onLaunch: async function({ api, event, args, actions }) {
    const { threadID, messageID } = event;
    
    if (!args[0]) {
      return api.sendMessage("⚠️ Vui lòng nhập URL video TikTok!", threadID, messageID);
    }
    
    const url = args[0];
    
    if (!isValidTikTokUrl(url)) {
      return api.sendMessage("⚠️ URL không hợp lệ! Vui lòng nhập đúng URL video TikTok.", threadID, messageID);
    }
    
    api.sendMessage("⏳ Đang xử lý video, vui lòng đợi...", threadID, messageID);
    
    try {
      // Make a request to TikTok API
      const response = await axios.post(TIKTOK_API.BASE_URL, 
        new URLSearchParams({
          url: url
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        const videoUrl = data.play || data.wmplay;
        
        if (!videoUrl) {
          return api.sendMessage("❌ Không thể tải video, vui lòng thử lại sau!", threadID, messageID);
        }
        
        // Get video information
        const title = data.title || "TikTok Video";
        const author = data.author && data.author.nickname ? data.author.nickname : "Unknown";
        
        // Download the video
        const videoResponse = await axios({
          method: 'GET',
          url: videoUrl,
          responseType: 'stream'
        });
        
        // Create a unique filename
        const timestamp = Date.now();
        const videoPath = path.join(cacheDir, `tiktok_${timestamp}.mp4`);
        
        // Save the video to cache directory
        const writer = fs.createWriteStream(videoPath);
        videoResponse.data.pipe(writer);
        
        // When video is downloaded completely
        writer.on('finish', () => {
          // Send the video with caption
          api.sendMessage({
            body: `✅ Đã tải video thành công!\n\n👤 Tác giả: ${author}\n📝 Tiêu đề: ${title}`,
            attachment: fs.createReadStream(videoPath)
          }, threadID, (err) => {
            if (err) {
              api.sendMessage("❌ Có lỗi khi gửi video, vui lòng thử lại sau!", threadID);
              console.error(err);
            }
            
            // Delete the video file after sending
            fs.unlink(videoPath, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
          }, messageID);
        });
        
        // Handle errors in writing file
        writer.on('error', (err) => {
          console.error("Error writing file:", err);
          api.sendMessage("❌ Có lỗi khi lưu video, vui lòng thử lại sau!", threadID, messageID);
        });
        
      } else {
        api.sendMessage("❌ Không thể xử lý video TikTok, vui lòng thử URL khác!", threadID, messageID);
      }
      
    } catch (error) {
      console.error("TikTok downloader error:", error);
      api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message || "Không xác định"}`, threadID, messageID);
    }
  },
};
