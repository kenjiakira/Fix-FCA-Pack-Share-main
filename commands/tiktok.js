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
  // Match common TikTok URL formats including shortened ones and URLs with query parameters:
  // - https://www.tiktok.com/@username/video/1234567890
  // - https://www.tiktok.com/@username/video/1234567890?is_from_webapp=1&sender_device=pc
  // - https://www.tiktok.com/@username/photo/1234567890
  // - https://vm.tiktok.com/XXXXXXXX/
  // - https://vt.tiktok.com/XXXXXXXX/
  // - https://m.tiktok.com/v/1234567890.html
  
  // Strip any query parameters first for logging
  const urlWithoutQuery = url.split('?')[0];
  console.log("Validating TikTok URL:", url);
  console.log("URL without query params:", urlWithoutQuery);
  
  // More permissive regex that should handle all TikTok URL formats
  const isValid = /^(https?:\/\/)?(www\.|vm\.|vt\.|m\.)?tiktok\.com(\/[@\w.]+\/(?:video|photo)\/\d+|\/@[\w.]+\/video\/\d+|\/v\/\d+|\/.+)?/.test(url);
  
  console.log("TikTok URL validation result:", isValid);
  return isValid;
}

/**
 * Giải quyết link TikTok rút gọn thành link đầy đủ
 * @param {string} url - Link TikTok rút gọn
 * @returns {Promise<string>} - Link đầy đủ
 */
async function resolveTikTokShortUrl(url) {
  try {
    // Kiểm tra nếu là link rút gọn (vt.tiktok.com hoặc vm.tiktok.com)
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      // Sử dụng Axios để theo dõi chuyển hướng
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: null,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      // Nếu chúng ta có URL cuối cùng sau khi theo dõi tất cả chuyển hướng
      if (response.request.res.responseUrl) {
        return response.request.res.responseUrl;
      }
      
      // Hoặc lấy từ header Location nếu có
      if (response.headers.location) {
        return response.headers.location;
      }
    }
    
    // Nếu không phải link rút gọn hoặc không thể giải quyết, trả về link ban đầu
    return url;
  } catch (error) {
    console.error("Lỗi khi giải quyết link TikTok:", error);
    return url; // Trả về link ban đầu nếu có lỗi
  }
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
    
    let url = args[0];
    
    if (!isValidTikTokUrl(url)) {
      return api.sendMessage("⚠️ URL không hợp lệ! Vui lòng nhập đúng URL video TikTok.", threadID, messageID);
    }
    
    api.sendMessage("⏳ Đang xử lý video, vui lòng đợi...", threadID, messageID);
    
    try {
      // Giải quyết link rút gọn trước khi xử lý
      const resolvedUrl = await resolveTikTokShortUrl(url);
      console.log(`Link ban đầu: ${url}`);
      console.log(`Link đã giải quyết: ${resolvedUrl}`);
      
      // Make a request to TikTok API with the resolved URL
      const response = await axios.post(TIKTOK_API.BASE_URL, 
        { url: resolvedUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.code === 0 && response.data.data) {
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
        const errorMsg = response.data && response.data.msg ? response.data.msg : "Không thể xử lý video TikTok";
        api.sendMessage(`❌ ${errorMsg}, vui lòng thử URL khác!`, threadID, messageID);
      }
      
    } catch (error) {
      console.error("TikTok downloader error:", error);
      api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message || "Không xác định"}`, threadID, messageID);
    }
  },
};
