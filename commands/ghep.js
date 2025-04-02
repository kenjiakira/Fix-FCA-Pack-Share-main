const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');
let userImg, partnerImg;

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

      const compatibility = Math.floor(Math.random() * 100) + 1; const compatMessage = getCompatibilityMessage(compatibility); const zodiacSigns = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
      const userZodiac = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
      const partnerZodiac = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
      const personalityMatch = Math.floor(Math.random() * 100) + 1;
      const interestMatch = Math.floor(Math.random() * 100) + 1;
      const futureChance = Math.floor(Math.random() * 100) + 1;

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
        if (uid === 'default') {
          return createDefaultAvatar();
        }

        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        try {
          const response = await axios.get(avatarUrl, {
            responseType: 'arraybuffer',
            timeout: 15000, // Tăng timeout lên 15 giây
            validateStatus: function (status) {
              return status >= 200 && status < 300;
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
            }
          });

          if (!response.data || response.data.length === 0) {
            console.log(`Empty avatar data for ${uid}, using default`);
            return createDefaultAvatar();
          }

          return response.data;
        } catch (err) {
          console.error(`Failed to get avatar for ${uid}: ${err.message}`);
          return createDefaultAvatar();
          // Create a default avatar
          const canvas = createCanvas(512, 512);
          const ctx = canvas.getContext('2d');

          // Fill background
          const gradient = ctx.createLinearGradient(0, 0, 512, 512);
          gradient.addColorStop(0, '#4a148c');
          gradient.addColorStop(1, '#311b92');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 512, 512);

          // Add text
          ctx.font = 'bold 200px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', 256, 256);

          return canvas.toBuffer('image/jpeg');
        }
      };

      try {
        [userImg, partnerImg] = await Promise.all([
          getAvatar(senderID).catch(err => {
            console.error(`Failed to get user avatar: ${err.message}`);
            return createDefaultAvatar();
          }),
          getAvatar(partnerId).catch(err => {
            console.error(`Failed to get partner avatar: ${err.message}`);
            return createDefaultAvatar();
          })
        ]);
      } catch (error) {
        console.error("Error getting avatars:", error);

        userImg = createDefaultAvatar();
        partnerImg = createDefaultAvatar();
      }

      function createDefaultAvatar() {
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#4a148c');
        gradient.addColorStop(1, '#311b92');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        ctx.font = 'bold 200px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 256, 256);

        return canvas.toBuffer('image/jpeg');
      }

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

      const img1 = await loadImage(pathUser);
      const img2 = await loadImage(pathPartner);

      // Kích thước lớn hơn cho chi tiết rõ nét
      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');

      // ===== BACKGROUND SANG TRỌNG =====
      // Gradient nền chính
      const bgGradient = ctx.createLinearGradient(0, 0, 1200, 800);
      bgGradient.addColorStop(0, '#141e30');
      bgGradient.addColorStop(1, '#243b55');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1200, 800);

      // Hiệu ứng sao lấp lánh
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 1200;
        const y = Math.random() * 800;
        const radius = Math.random() * 2;
        const opacity = Math.random() * 0.8 + 0.2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      // Hiệu ứng ánh sáng hào quang
      const radialGradient = ctx.createRadialGradient(600, 400, 100, 600, 400, 800);
      radialGradient.addColorStop(0, 'rgba(255, 192, 203, 0.4)');
      radialGradient.addColorStop(0.5, 'rgba(255, 182, 193, 0.1)');
      radialGradient.addColorStop(1, 'rgba(255, 182, 193, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, 1200, 800);

      // ===== TIÊU ĐỀ TRANG TRÍ =====
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Hiệu ứng viền sáng cho text
      ctx.strokeStyle = '#FF9AA2';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#FF9AA2';
      ctx.shadowBlur = 15;
      ctx.strokeText('💖 GHÉP ĐÔI 💖', 600, 80);

      // Text chính
      const titleGradient = ctx.createLinearGradient(400, 60, 800, 100);
      titleGradient.addColorStop(0, '#FF9AA2');
      titleGradient.addColorStop(0.5, '#FFDFD3');
      titleGradient.addColorStop(1, '#FF9AA2');
      ctx.fillStyle = titleGradient;
      ctx.fillText('💖 GHÉP ĐÔI 💖', 600, 80);
      ctx.shadowBlur = 0;

      // ===== KHUNG AVATAR SANG TRỌNG =====
      function drawLuxuryFrame(x, y, image, name, zodiac) {
        // Vòng trang trí bên ngoài
        ctx.beginPath();
        ctx.arc(x, y, 230, 0, Math.PI * 2);
        const outerGradient = ctx.createLinearGradient(x - 230, y - 230, x + 230, y + 230);
        outerGradient.addColorStop(0, '#FFD700');
        outerGradient.addColorStop(0.5, '#FFC107');
        outerGradient.addColorStop(1, '#FFD700');
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = 10;
        ctx.stroke();

        // Hiệu ứng ánh sáng
        ctx.beginPath();
        ctx.arc(x, y, 220, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(x, y, 180, x, y, 220);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Vòng tròn bên trong
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 180, 0, Math.PI * 2);

        // Border gradient
        const borderGradient = ctx.createLinearGradient(x - 180, y - 180, x + 180, y + 180);
        borderGradient.addColorStop(0, '#FFD700');
        borderGradient.addColorStop(0.5, 'white');
        borderGradient.addColorStop(1, '#FFD700');
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Clip và vẽ avatar
        ctx.clip();
        ctx.drawImage(image, x - 180, y - 180, 360, 360);
        ctx.restore();

        // Trang trí điểm sáng
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const dotX = x + Math.cos(angle) * 210;
          const dotY = y + Math.sin(angle) * 210;

          ctx.beginPath();
          ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#FFD700';
          ctx.fill();
        }

        // Tên người dùng với hiệu ứng bóng đổ
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(name, x, y + 240);

        // Cung hoàng đạo
        ctx.font = 'italic 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${zodiac}`, x, y + 280);
        ctx.shadowBlur = 0;
      }

      // Vẽ hai avatar
      drawLuxuryFrame(300, 350, img1, userName, userZodiac);
      drawLuxuryFrame(900, 350, img2, partnerName, partnerZodiac);
      // ===== HIỆU ỨNG TRÁI TIM GIỮA =====
      // Vẽ trái tim chuẩn hơn với tỷ lệ hợp lý
      const heartX = 600;
      const heartY = 350;
      const heartSize = 150; // Kích thước phù hợp

      // Vẽ trái tim với công thức chuẩn
      ctx.beginPath();

      // Sử dụng công thức trái tim toán học chính xác
      const drawHeart = (x, y, size) => {
        ctx.beginPath();

        // Bắt đầu từ đỉnh trái tim
        ctx.moveTo(x, y - size * 0.5);

        // Vẽ bên trái của trái tim
        ctx.bezierCurveTo(
          x - size * 0.5, y - size * 0.8, // Điểm điều khiển 1
          x - size, y - size * 0.25,      // Điểm điều khiển 2
          x - size * 0.5, y + size * 0.35 // Điểm cuối cánh trái
        );

        // Vẽ phần dưới bên trái
        ctx.bezierCurveTo(
          x - size * 0.25, y + size * 0.7, // Điểm điều khiển 1
          x, y + size * 0.8,               // Điểm điều khiển 2
          x, y + size * 0.8                // Điểm cuối đáy tim
        );

        // Vẽ phần dưới bên phải
        ctx.bezierCurveTo(
          x, y + size * 0.8,               // Điểm điều khiển 1
          x + size * 0.25, y + size * 0.7, // Điểm điều khiển 2
          x + size * 0.5, y + size * 0.35  // Điểm cuối cánh phải
        );

        // Vẽ bên phải của trái tim
        ctx.bezierCurveTo(
          x + size, y - size * 0.25,      // Điểm điều khiển 1
          x + size * 0.5, y - size * 0.8, // Điểm điều khiển 2
          x, y - size * 0.5               // Trở về điểm đầu
        );

        ctx.closePath();
      };

      // Áp dụng hàm vẽ trái tim
      drawHeart(heartX, heartY, heartSize);

      // Hiệu ứng bóng đổ và viền
      ctx.shadowColor = 'rgba(255, 0, 120, 0.6)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Viền trái tim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Đổ màu gradient đẹp
      ctx.shadowBlur = 0; // Tắt bóng đổ khi tô màu bên trong
      ctx.save();
      ctx.clip();

      // Sử dụng cả linear và radial gradient để tạo hiệu ứng 3D
      const heartGradient = ctx.createRadialGradient(
        heartX - heartSize * 0.2, heartY - heartSize * 0.3, 0,
        heartX, heartY, heartSize * 1.1
      );

      // Màu sắc thay đổi dựa trên độ hợp nhau
      if (compatibility >= 80) {
        heartGradient.addColorStop(0, '#ff5e82');
        heartGradient.addColorStop(0.3, '#ff3366');
        heartGradient.addColorStop(0.6, '#ff0a47');
        heartGradient.addColorStop(1, '#d10039');
      } else if (compatibility >= 50) {
        heartGradient.addColorStop(0, '#ff91c8');
        heartGradient.addColorStop(0.3, '#ff578b');
        heartGradient.addColorStop(0.7, '#ff3366');
        heartGradient.addColorStop(1, '#d12657');
      } else {
        heartGradient.addColorStop(0, '#ffb0c8');
        heartGradient.addColorStop(0.4, '#ff8fa6');
        heartGradient.addColorStop(0.7, '#ff7a8a');
        heartGradient.addColorStop(1, '#d16b6b');
      }

      ctx.fillStyle = heartGradient;
      ctx.fill();

      // Thêm hiệu ứng ánh sáng bên trong trái tim
      ctx.globalCompositeOperation = 'lighter';
      const heartShine = ctx.createRadialGradient(
        heartX - heartSize * 0.3, heartY - heartSize * 0.3, 0,
        heartX - heartSize * 0.3, heartY - heartSize * 0.3, heartSize
      );
      heartShine.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      heartShine.addColorStop(0.1, 'rgba(255, 255, 255, 0.3)');
      heartShine.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = heartShine;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Thêm hiệu ứng lấp lánh dạng sao
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * heartSize * 0.5;
        const x = heartX + Math.cos(angle) * distance;
        const y = heartY + Math.sin(angle) * distance * 0.8;
        const size = Math.random() * 3 + 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI);

        // Vẽ ngôi sao 5 cánh
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
          const radius = j % 2 === 0 ? size : size * 0.4;
          const starAngle = (j / 10) * Math.PI * 2;
          if (j === 0) {
            ctx.moveTo(Math.cos(starAngle) * radius, Math.sin(starAngle) * radius);
          } else {
            ctx.lineTo(Math.cos(starAngle) * radius, Math.sin(starAngle) * radius);
          }
        }
        ctx.closePath();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();

      // ===== TỶ LỆ HỢP NHAU =====
      // Hiển thị tỷ lệ phần trăm trong trái tim
      ctx.font = 'bold 46px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(`${compatibility}%`, heartX, heartY);
      ctx.shadowBlur = 0;
      // ===== THÔNG TIN CHI TIẾT =====
      // Khung thông tin
      const infoBoxY = 620;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(200, infoBoxY, 800, 180, 15);
      ctx.fill();

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thêm trang trí cho khung
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(200, infoBoxY + 30);
      ctx.lineTo(1000, infoBoxY + 30);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Căn giữa của bảng thông tin
      const infoBoxCenterX = 600; // (200 + 1000) / 2

      // Văn bản đánh giá mối quan hệ
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(compatMessage, infoBoxCenterX, infoBoxY + 30);

      // Hiệu ứng thanh tiến trình cho các chỉ số - căn giữa
      function drawProgressBar(x, y, value, label) {
        const barWidth = 400; // Tăng chiều rộng thanh
        const barHeight = 12;

        // Căn giữa thanh với bảng thông tin
        const startX = infoBoxCenterX - barWidth / 2;

        // Nhãn - căn trái
        ctx.fillStyle = '#DDDDDD';
        ctx.textAlign = 'left';
        ctx.fillText(label, startX, y + 6);

        // Nền thanh
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(startX + 100, y, barWidth - 100, barHeight, 6); // Dành chỗ cho nhãn
        ctx.fill();

        // Thanh tiến trình
        let barColor;
        if (value >= 70) barColor = '#4CAF50';
        else if (value >= 40) barColor = '#FFC107';
        else barColor = '#F44336';

        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(startX + 100, y, (barWidth - 100) * (value / 100), barHeight, 6);
        ctx.fill();

        // Hiển thị giá trị - căn phải
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.fillText(`${value}%`, startX + barWidth, y + 6);
      }

      // Vẽ các thanh tiến trình căn giữa
      drawProgressBar(0, infoBoxY + 60, personalityMatch, "Tính cách:");
      drawProgressBar(0, infoBoxY + 90, interestMatch, "Sở thích:");
      drawProgressBar(0, infoBoxY + 120, futureChance, "Tiến xa:");

      // ===== FOOTER =====
      // Thêm footer với quote tình yêu
      const loveQuote = loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
      ctx.font = 'italic 20px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText(`"${loveQuote}"`, infoBoxCenterX, infoBoxY + 160);

      // Trang trí họa tiết góc
      function drawCornerDecoration(x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        const gradient = ctx.createLinearGradient(0, -30, 0, 30);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFC107');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -10);
        ctx.moveTo(0, 10);
        ctx.lineTo(0, 30);
        ctx.moveTo(-30, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Vẽ các họa tiết trang trí góc
      drawCornerDecoration(50, 50, 0);
      drawCornerDecoration(1150, 50, Math.PI / 2);
      drawCornerDecoration(50, 750, -Math.PI / 2);
      drawCornerDecoration(1150, 750, Math.PI);

      const mergedPath = path.join(__dirname, '../commands/cache/avatar/merged.jpg');
      const out = fs.createWriteStream(mergedPath);
      const stream = canvas.createJPEGStream({ quality: 0.95 });
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
