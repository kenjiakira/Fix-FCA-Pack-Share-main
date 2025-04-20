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
  info: 'Tải video TikTok',
  dev: 'HNT',
  usedby: 0,
  category: 'Media',
  onPrefix: true, 
  dmUser: false, 
  nickName: ['tiktok', 'tảivideo'],
  usages: 'tiktok [URL TikTok]',
  cooldowns: 5, 

  onLaunch: async function({ api, event, actions }) {
      const { threadID } = event;
      api.sendMessage("⚠️ Vui lòng sử dụng công cụ tải TikTok tại: https://100tools.io.vn/tools/tiktok-downloader", threadID);
  },
};
