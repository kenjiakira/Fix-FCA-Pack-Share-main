const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  name: "ghep",
  version: "1.0.0",
  info: "Ghép đôi ngẫu nhiên với tỉ lệ hợp đôi",
  onPrefix: true,
  usages: "ghep",
  cooldowns: 200,
  
  onLaunch: async ({ api, event }) => {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs.filter(id => id !== event.senderID && id !== api.getCurrentUserID());
      
      if (members.length === 0) {
        return api.sendMessage("Không đủ thành viên để ghép đôi!", event.threadID);
      }

      const partner = members[Math.floor(Math.random() * members.length)];
      const compatibility = Math.floor(Math.random() * 100) + 1;

      const getAvatarUrl = (uid) => [
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        `https://graph.facebook.com/v12.0/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        `https://graph.facebook.com/v10.0/${uid}/picture?height=1080&width=1080&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      ];

      async function tryGetAvatar(uid) {
        const urls = getAvatarUrl(uid);
        for (const url of urls) {
          try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return response.data;
          } catch (err) {
            continue;
          }
        }
        throw new Error('Failed to get avatar');
      }

      const [userImg, partnerImg] = await Promise.all([
        tryGetAvatar(event.senderID),
        tryGetAvatar(partner)
      ]);

      const pathUser = path.join(__dirname, '../commands/cache/avatar/user.jpg');
      const pathPartner = path.join(__dirname, '../commands/cache/avatar/partner.jpg');
      
      fs.writeFileSync(pathUser, userImg);
      fs.writeFileSync(pathPartner, partnerImg);

      const threadData = await api.getThreadInfo(event.threadID);
      const userData = threadData.userInfo.find(user => user.id === event.senderID);
      const partnerData = threadData.userInfo.find(user => user.id === partner);

      const userName = userData ? userData.name : "Người dùng";
      const partnerName = partnerData ? partnerData.name : "Người ấy";

      const canvas = createCanvas(1024, 512);
      const ctx = canvas.getContext('2d');

      const [img1, img2] = await Promise.all([
        loadImage(pathUser),
        loadImage(pathPartner)
      ]);

      ctx.drawImage(img1, 0, 0, 512, 512);
      ctx.drawImage(img2, 512, 0, 512, 512);

      ctx.fillStyle = '#FF0000';
      ctx.font = '100px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', 512, 256);

      const mergedPath = path.join(__dirname, '../commands/cache/avatar/merged.jpg');
      const out = fs.createWriteStream(mergedPath);
      const stream = canvas.createJPEGStream();
      stream.pipe(out);

      await new Promise((resolve) => out.on('finish', resolve));

      await api.sendMessage({
        body: `🎐 Ghép đôi thành công!\n` +
              `💝 ${userName} 💓 ${partnerName}\n` +
              `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
              `${getCompatibilityMessage(compatibility)}`,
        attachment: fs.createReadStream(mergedPath)
      }, event.threadID, event.messageID);

      fs.unlinkSync(mergedPath);
      fs.unlinkSync(pathUser);
      fs.unlinkSync(pathPartner);

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `🎐 Ghép đôi thành công!\n` +
        `💝 ${userName} 💓 ${partnerName}\n` +
        `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
        `${getCompatibilityMessage(compatibility)}`,
        event.threadID, event.messageID
      );
    }
  }
};

function getCompatibilityMessage(rate) {
  if (rate >= 90) return "💕 Quá hợp với nhau luôn!";
  if (rate >= 70) return "💖 Một cặp đáng yêu!";
  if (rate >= 50) return "💫 Cũng khá hợp đấy!";
  if (rate >= 30) return "🌟 Có thể thử tìm hiểu!";
  return "💢 Chắc là... friendzone thôi!";
}
