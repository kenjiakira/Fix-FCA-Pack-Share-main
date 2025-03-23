const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');

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

      const waitingMsg = await api.sendMessage("⏳ Đang ghép đôi...", threadID);

      let partnerId;

      if (event.type === 'message_reply') {
        partnerId = event.messageReply.senderID;
      }
      else if (Object.keys(event.mentions).length > 0) {
        partnerId = Object.keys(event.mentions)[0];
      }
      else {
        const participants = await getThreadParticipantIDs(api, threadID);

        const availablePartners = participants.filter(id => id !== senderID);

        if (availablePartners.length === 0) {
          return api.sendMessage("❌ Không tìm thấy đối tượng phù hợp trong nhóm!", threadID);
        }

        partnerId = availablePartners[Math.floor(Math.random() * availablePartners.length)];
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

      fs.writeFileSync(pathUser, userImg);
      fs.writeFileSync(pathPartner, partnerImg);

      // Tải ảnh lên để sử dụng trong canvas
      const img1 = await loadImage(pathUser);
      const img2 = await loadImage(pathPartner);

      const canvas = createCanvas(1024, 512);
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#ffd93d');
      gradient.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);

      // Draw avatars and names
      ctx.save();
      for (let i = 0; i < 2; i++) {
        const x = i === 0 ? 256 : 768;
        const name = i === 0 ? userName : partnerName;

        // Draw avatar circle
        ctx.beginPath();
        ctx.arc(x, 256, 200, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.clip();
        const img = i === 0 ? img1 : img2;
        ctx.drawImage(img, x - 200, 56, 400, 400);
        ctx.restore();
        ctx.save();

        // Draw name below avatar
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(name, x, 470);
        ctx.shadowColor = 'transparent';
      }

      // Draw heart shape
      ctx.beginPath();
      ctx.moveTo(512, 180);
      ctx.bezierCurveTo(512, 160, 472, 120, 412, 120);
      ctx.bezierCurveTo(332, 120, 332, 200, 332, 200);
      ctx.bezierCurveTo(332, 260, 392, 320, 512, 368);
      ctx.bezierCurveTo(632, 320, 692, 260, 692, 200);
      ctx.bezierCurveTo(692, 200, 692, 120, 612, 120);
      ctx.bezierCurveTo(552, 120, 512, 160, 512, 180);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Tạo clipping path dựa trên phần trăm tương thích
      ctx.save();
      ctx.beginPath();
      ctx.rect(332, 120, (692 - 332) * (compatibility / 100), 368 - 120);
      ctx.clip();

      // Fill phần trái tim theo tỉ lệ - vẽ lại đường dẫn trái tim thay vì dùng Path2D
      ctx.beginPath();
      ctx.moveTo(512, 180);
      ctx.bezierCurveTo(512, 160, 472, 120, 412, 120);
      ctx.bezierCurveTo(332, 120, 332, 200, 332, 200);
      ctx.bezierCurveTo(332, 260, 392, 320, 512, 368);
      ctx.bezierCurveTo(632, 320, 692, 260, 692, 200);
      ctx.bezierCurveTo(692, 200, 692, 120, 612, 120);
      ctx.bezierCurveTo(552, 120, 512, 160, 512, 180);

      // Tạo gradient và fill
      const heartGradient = ctx.createLinearGradient(332, 120, 692, 368);
      heartGradient.addColorStop(0, '#ff0844');
      heartGradient.addColorStop(1, '#ff4563');
      ctx.fillStyle = heartGradient;
      ctx.fill();
      ctx.restore();

      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${compatibility}%`, 512, 240);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(`${compatibility}%`, 512, 240);
      ctx.shadowColor = 'transparent';

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
