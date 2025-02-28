const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  name: "ghep",
  category: "Giải Trí",
  info: "Ghép đôi ngẫu nhiên với nhiều tính năng thú vị",
  onPrefix: true,
  usages: "ghep",
  cooldowns: 30,
  
  onLaunch: async ({ api, event }) => {
    try {
      const { threadID, senderID } = event;
      
      // Send initial waiting message
      const waitingMsg = await api.sendMessage("⏳ Đang ghép đôi...", threadID);
      
      let partnerId;
      
      if (event.type === 'message_reply') {
        partnerId = event.messageReply.senderID;
      } 
      else if (Object.keys(event.mentions).length > 0) {
        partnerId = Object.keys(event.mentions)[0];
      }
      else {
        return api.sendMessage(
          "Cú pháp: ghép [@Tag/Reply]\n" +
          "- Reply: Reply tin nhắn người muốn ghép\n" +
          "- Tag: @mention người muốn ghép",
          threadID
        );
      }

      if (partnerId === senderID) {
        return api.sendMessage("❌ Không thể tự ghép đôi với chính mình!", threadID);
      }

      const compatibility = Math.floor(Math.random() * 100) + 1;
      const zodiacSigns = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
      const userZodiac = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
      const partnerZodiac = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
      
      const loveQuotes = [
        "Yêu là khi hai trái tim cùng đập một nhịp",
        "Tình yêu không cần lý do, chỉ cần có nhau",
        "Đời là bể khổ, em là bờ vai",
        "Anh cứ đi đi để thấy đi xa em là không thể",
        "Em là món quà vô giá của cuộc đời anh",
        "Yêu em như gió yêu mây, như hoa yêu nắng, như đắm say yêu đời",
        "Thanh xuân của anh chỉ cần có em là đủ",
        "Em là điều tuyệt vời nhất anh từng có",
        "Có em, anh thấy cả thế giới này đều tươi đẹp",
        "Một ngày không gặp em như ba thu vắng bóng",
        "Gặp em là định mệnh, yêu em là sự lựa chọn",
        "Anh không cần cả thế giới, anh chỉ cần một em thôi",
        "Em là cả bầu trời của riêng anh"
      ];
      
      const futures = [
        "Tương lai: Sẽ có một đám cưới đẹp như mơ 💒",
        "Tương lai: Có 2 con, một trai một gái 👶👶",
        "Tương lai: Sống hạnh phúc bên nhau tới già 👫",
        "Tương lai: Cùng nhau đi khắp thế gian ✈️",
        "Tương lai: Mở một quán café nhỏ xinh cùng nhau ☕",
        "Tương lai: Có một căn nhà nhỏ ven biển 🏖️",
        "Tương lai: Cùng nhau nuôi 3 chú mèo cute 🐱",
        "Tương lai: Trở thành cặp đôi nổi tiếng MXH 📱",
        "Tương lai: Cùng nhau khởi nghiệp thành công 💼",
        "Tương lai: Trở thành cặp vợ chồng YouTuber 🎥",
        "Tương lai: Có một khu vườn nhỏ trồng rau quả 🌱",
        "Tương lai: Mỗi năm đi du lịch một nước mới 🌎",
        "Tương lai: Cùng nhau già đi trong hạnh phúc 👴👵",
        "Tương lai: Trở thành cặp đôi hoàn hảo trong mắt mọi người 💑"
      ];

      // Replace the getAvatarUrl and tryGetAvatar functions with single URL like avt command
      const getAvatar = async (uid) => {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        try {
          const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
          return response.data;
        } catch (err) {
          throw new Error('Failed to get avatar');
        }
      };

      const [userImg, partnerImg] = await Promise.all([
        getAvatar(senderID),
        getAvatar(partnerId)
      ]);

      // Ensure cache directory exists
      const avatarCacheDir = path.join(__dirname, './cache/avatar');
      if (!fs.existsSync(avatarCacheDir)) {
        fs.mkdirSync(avatarCacheDir, { recursive: true });
      }

      const pathUser = path.join(avatarCacheDir, 'user.jpg');
      const pathPartner = path.join(avatarCacheDir, 'partner.jpg');
      
      fs.writeFileSync(pathUser, userImg);
      fs.writeFileSync(pathPartner, partnerImg);

      const userDataPath = path.join(__dirname, '../events/cache/userData.json');
      let userName, partnerName;
      
      try {
        const userData = await api.getUserInfo([senderID, partnerId]);
        userName = userData[senderID]?.name || "Người dùng";
        partnerName = userData[partnerId]?.name || "Người ấy";
      } catch (err) {
        console.error("Error getting user info from API, trying userData.json");
        try {
          const userDataJson = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
          userName = userDataJson[senderID]?.name || "Người dùng";
          partnerName = userDataJson[partnerId]?.name || "Người ấy";
        } catch (jsonErr) {
          console.error("Error reading from userData.json:", jsonErr);
          userName = "Người dùng";
          partnerName = "Người ấy";
        }
      }

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

      if (!fs.existsSync(mergedPath)) {
        throw new Error("Failed to create merged image");
      }

      await api.sendMessage({
        body: `🎐 Ghép đôi thành công!\n` +
              `💝 ${userName} (${userZodiac}) 💓 ${partnerName} (${partnerZodiac})\n` +
              `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
              `${getCompatibilityMessage(compatibility)}\n\n` +
              `💫 Phân tích chi tiết:\n` +
              `- Hợp nhau về tính cách: ${Math.floor(Math.random() * 100)}%\n` +
              `- Hợp nhau về sở thích: ${Math.floor(Math.random() * 100)}%\n` +
              `- Có cơ hội tiến xa: ${Math.floor(Math.random() * 100)}%\n\n` +
              `💌 Lời thì thầm: ${loveQuotes[Math.floor(Math.random() * loveQuotes.length)]}\n` +
              `🔮 ${futures[Math.floor(Math.random() * futures.length)]}`,
        attachment: fs.createReadStream(mergedPath)
      }, event.threadID, event.messageID);

      try {
        fs.unlinkSync(mergedPath);
        fs.unlinkSync(pathUser);
        fs.unlinkSync(pathPartner);
      } catch (err) {
        console.error("Error cleaning up files:", err);
      }

    } catch (error) {
      console.error("Main error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi. Vui lòng thử lại sau!", event.threadID);
    }
  }
};

function getCompatibilityMessage(rate) {
  if (rate >= 90) return "💕 Định mệnh đã se duyên, quá hợp với nhau luôn!";
  if (rate >= 70) return "💖 Một cặp trời sinh, đáng yêu không chịu được!";
  if (rate >= 50) return "💫 Hợp đấy, có triển vọng phát triển lắm!";
  if (rate >= 30) return "🌟 Cũng có duyên đấy, thử tìm hiểu xem sao!";
  return "💢 Duyên phận mong manh, nhưng đừng nản lòng!";
}
