const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');
const vipService = require('../game/vip/vipService'); // Add VIP service import
let userImg, partnerImg;

module.exports = {
  name: "ghep",
  category: "Giải Trí",
  info: "Ghép đôi ngẫu nhiên với nhiều tính năng thú vị",
  onPrefix: true,
  usages: "ghep [all/global] - Ghép ngẫu nhiên (VIP: all/global để ghép với người ngoài nhóm)",
  cooldowns: 10,

  onLaunch: async ({ api, event, target = [] }) => {
    try {
      const { threadID, messageID, senderID } = event;
      let partnerId;
      let isLocalMatch = false;
      let showFullInfo = false; 

      const isVIP = vipService.checkVIP(senderID).success;

      if (!isVIP) {
        const fullInfoLimitPath = path.join(__dirname, './cache/ghepFullInfo.json');
        let fullInfoData = {};
        
        if (!fs.existsSync(path.join(__dirname, './cache'))) {
          fs.mkdirSync(path.join(__dirname, './cache'), { recursive: true });
        }
        
        if (fs.existsSync(fullInfoLimitPath)) {
          try {
            fullInfoData = JSON.parse(fs.readFileSync(fullInfoLimitPath, 'utf8'));
          } catch (err) {
            console.error("Error reading ghep full info data:", err);
            fullInfoData = {};
          }
        }
        
        const today = new Date().toDateString();
        
        if (!fullInfoData[senderID] || fullInfoData[senderID].date !== today) {
          fullInfoData[senderID] = {
            date: today,
            count: 0
          };
        }
        
        if (fullInfoData[senderID].count < 5) {
          showFullInfo = true;
          fullInfoData[senderID].count++;
        } else {
          showFullInfo = false;
        }
        
        fs.writeFileSync(fullInfoLimitPath, JSON.stringify(fullInfoData, null, 2));
      } else {
        showFullInfo = true;
      }

      if (target[0] && target[0].toLowerCase() === 'box') {
        if (isVIP) {
          isLocalMatch = true;
        } else {
          return api.sendMessage("❌ Tính năng ghép trong nhóm (ghep box) chỉ dành cho thành viên VIP!", threadID, messageID);
        }
      }        if (event.type === 'message_reply') {
        partnerId = event.messageReply.senderID;
      }
      else if (Object.keys(event.mentions).length > 0) {
     
        return api.sendMessage("❌ Tính năng ghép đôi bằng cách tag người khác đã bị vô hiệu hóa!", threadID, messageID);
      }
      else {
        if (!isLocalMatch) {
          try {
            const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
            let userData = {};

            if (fs.existsSync(userDataPath)) {
              userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            }

            const allUserIds = Object.keys(userData).filter(id =>
              id !== senderID &&
              id !== api.getCurrentUserID() &&
              !id.startsWith('0000') &&
              !id.startsWith('100000000000000') &&
           
              (userData[id]?.name !== "User" && 
               !userData[id]?.name?.startsWith("User ") && 
               !userData[id]?.name?.includes(" User"))
            );

            if (allUserIds.length === 0) {
              const participants = await getThreadParticipantIDs(api, threadID);
            
              const availablePartners = participants.filter(async id => {
                if (id === senderID) return false;
                
                try {
                  let name = "";
                  try {
                    const userInfo = await api.getUserInfo(id);
                    name = userInfo[id]?.name || "";
                  } catch (e) {
                    if (userData[id]) {
                      name = userData[id].name || "";
                    }
                  }
                  
                  return name !== "User" && 
                         !name.startsWith("User ") && 
                         !name.includes(" User");
                } catch (err) {
                  return true;
                }
              });

              if (availablePartners.length === 0) {
                return api.sendMessage("❌ Không tìm thấy đối tượng phù hợp để ghép đôi!", threadID, messageID);
              }

              partnerId = availablePartners[Math.floor(Math.random() * availablePartners.length)];
            } else {
              partnerId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
            }
          } catch (err) {
            console.error("Error during global matching:", err);
            return api.sendMessage("❌ Đã xảy ra lỗi khi ghép đôi toàn cục!", threadID, messageID);
          }
        } else {
          const participants = await getThreadParticipantIDs(api, threadID);
          
          const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
          let userData = {};
          try {
            if (fs.existsSync(userDataPath)) {
              userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            }
          } catch (e) {
            console.error("Error reading userData for name filter:", e);
          }
          
          let availablePartners = participants.filter(id => id !== senderID);
          
          if (Object.keys(userData).length > 0) {
            availablePartners = availablePartners.filter(id => {
              if (userData[id]) {
                const name = userData[id].name || "";
                return name !== "User" && 
                      !name.startsWith("User ") && 
                      !name.includes(" User");
              }
              return true; // Giữ lại nếu không có thông tin
            });
          }

          if (availablePartners.length === 0) {
            return api.sendMessage("❌ Không tìm thấy đối tượng phù hợp trong nhóm!", threadID, messageID);
          }

          partnerId = availablePartners[Math.floor(Math.random() * availablePartners.length)];
        }
      }

      if (partnerId === senderID) {
        return api.sendMessage("❌ Không thể tự ghép đôi với chính mình!", threadID, messageID);
      }
      
      // Kiểm tra xem người được chọn có tên là "User" hay không
      try {
        const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
        let userData = {};
        if (fs.existsSync(userDataPath)) {
          userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        }
        
        let partnerName = "";
        try {
          const userInfo = await api.getUserInfo([partnerId]);
          partnerName = userInfo[partnerId]?.name || "";
        } catch (e) {
          if (userData[partnerId]) {
            partnerName = userData[partnerId].name || "";
          }
        }
        
        // Nếu người được chọn có tên là "User", chọn lại người khác
        if (partnerName === "User" || 
            partnerName.startsWith("User ") || 
            partnerName.includes(" User")) {
          return api.sendMessage("❌ Hệ thống phát hiện đối tượng không phù hợp. Vui lòng thử lại!", threadID, messageID);
        }
      } catch (err) {
        console.error("Error checking partner name:", err);
      }

      const compatibility = Math.floor(Math.random() * 100) + 1;
      const compatMessage = getCompatibilityMessage(compatibility);
      const zodiacSigns = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
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
      let userLink, partnerLink;

 
      try {
        userLink = `https://www.facebook.com/profile.php?id=${senderID}`;
        partnerLink = `https://www.facebook.com/profile.php?id=${partnerId}`;

        // Chỉ ẩn đi nếu không phải VIP và đã hết lượt xem
        if (!showFullInfo) {
          const linkLength = partnerLink.length;
          partnerLink = partnerLink.substring(0, 28) + '•'.repeat(Math.min(15, linkLength - 35)) + partnerLink.substring(linkLength - 7);
        }
      } catch (err) {
        console.error("Error generating profile links:", err);
        userLink = "Không có thông tin";
        partnerLink = showFullInfo ? "Không có thông tin" : "••••••••••••";
      }
      const getAvatar = async (uid) => {
        if (uid === 'default') {
          return createDefaultAvatar();
        }

        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        try {
          const response = await axios.get(avatarUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
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
        }
      };

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

      const avatarCacheDir = path.join(__dirname, './cache/avatar');
      if (!fs.existsSync(avatarCacheDir)) {
        fs.mkdirSync(avatarCacheDir, { recursive: true });
      }

      const pathUser = path.join(avatarCacheDir, 'user.jpg');
      const pathPartner = path.join(avatarCacheDir, 'partner.jpg');

      fs.writeFileSync(pathUser, userImg);
      fs.writeFileSync(pathPartner, partnerImg);

      const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
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

      if (!showFullInfo) {
        const nameParts = partnerName.split(' ');
        partnerName = nameParts.map(part => {
          if (part.length <= 2) return part[0] + '•';
          return part[0] + '•'.repeat(part.length - 2) + part[part.length - 1];
        }).join(' ');

        // Tạo ảnh mờ cho đối phương thay vì ẩn hoàn toàn
        const mysteryCanvas = createCanvas(512, 512);
        const ctx = mysteryCanvas.getContext('2d');
        
        // Vẽ nền gradient
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, 'rgba(255, 154, 158, 0.4)');
        gradient.addColorStop(1, 'rgba(250, 208, 196, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Lấy ảnh gốc và làm mờ
        try {
          // Vẽ ảnh đối tác với độ mờ cao
          ctx.globalAlpha = 0.35; // Độ mờ cao
          ctx.drawImage(await loadImage(pathPartner), 0, 0, 512, 512);
          ctx.globalAlpha = 1.0;
          
          // Thêm hiệu ứng mờ
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(0, 0, 512, 512);
        } catch (err) {
          console.error("Error blurring partner image:", err);
        }
        
        // Thêm overlay cho text nổi bật
        const overlayGradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 300);
        overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        overlayGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = overlayGradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Viền nổi bật
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 8;
        ctx.strokeRect(15, 15, 512-30, 512-30);
        
        // Hiệu ứng ánh sáng cho chữ VIP
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Vẽ chữ VIP nổi bật
        ctx.font = 'bold 90px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VIP', 256, 200);
        
        // Bỏ hiệu ứng shadow để vẽ text khác
        ctx.shadowBlur = 0;
        
        // Vẽ dấu chấm hỏi mờ
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillText('?', 256, 120);
        
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Nâng cấp VIP để', 256, 290);
        
        ctx.font = '24px Arial';
        ctx.fillText('xem thông tin đầy đủ', 256, 330);
        ctx.fillText('ghép đôi không giới hạn', 256, 365);
        ctx.fillText('mở khóa nhiều tính năng khác', 256, 400);
        
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Gõ .vip để biết thêm', 256, 450);

        partnerImg = mysteryCanvas.toBuffer('image/jpeg');
        fs.writeFileSync(pathPartner, partnerImg);
      }
      fs.writeFileSync(pathUser, userImg);
      fs.writeFileSync(pathPartner, partnerImg);

      const img1 = await loadImage(pathUser);
      const img2 = await loadImage(pathPartner);

      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');


      // ===== BACKGROUND SANG TRỌNG =====
 
      const bgGradient = ctx.createLinearGradient(0, 0, 1200, 800);
      bgGradient.addColorStop(0, '#141e30');
      bgGradient.addColorStop(1, '#243b55');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1200, 800);

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

      ctx.strokeStyle = '#FF9AA2';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#FF9AA2';
      ctx.shadowBlur = 15;
      ctx.strokeText('💖 GHÉP ĐÔI 💖', 600, 80);

      const titleGradient = ctx.createLinearGradient(400, 60, 800, 100);
      titleGradient.addColorStop(0, '#FF9AA2');
      titleGradient.addColorStop(0.5, '#FFDFD3');
      titleGradient.addColorStop(1, '#FF9AA2');
      ctx.fillStyle = titleGradient;
      ctx.fillText('💖 GHÉP ĐÔI 💖', 600, 80);
      ctx.shadowBlur = 0;

      // ===== KHUNG AVATAR SANG TRỌNG =====
      function drawLuxuryFrame(x, y, image, name, zodiac, isVipDisplay = true) {
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
      drawLuxuryFrame(900, 350, img2, partnerName, partnerZodiac, isVIP);

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

      const mergedPath = path.join(__dirname, '../database/cache/avatar/merged.jpg');
      const out = fs.createWriteStream(mergedPath);
      const stream = canvas.createJPEGStream({ quality: 0.95 });
      stream.pipe(out);

      await new Promise((resolve) => out.on('finish', resolve));

      if (!fs.existsSync(mergedPath)) {
        throw new Error("Failed to create merged image");
      }

      let messageBody = '';
      
      if (isVIP) {
        // Người dùng VIP - hiển thị đầy đủ
        messageBody = `👑 VIP MATCH 👑\n` +
          `🎐 Ghép đôi thành công!\n` +
          `💝 ${userName} (${userZodiac}) 💓 ${partnerName} (${partnerZodiac})\n` +
          `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
          `${getCompatibilityMessage(compatibility)}\n\n` +
          `💫 Phân tích chi tiết:\n` +
          `- Hợp nhau về tính cách: ${personalityMatch}%\n` +
          `- Hợp nhau về sở thích: ${interestMatch}%\n` +
          `- Có cơ hội tiến xa: ${futureChance}%\n\n` +
          `👤 Profile: ${userLink}\n` +
          `👤 Profile đối phương: ${partnerLink}\n\n` +
          `💌 Lời thì thầm: ${loveQuotes[Math.floor(Math.random() * loveQuotes.length)]}\n` +
          `🔮 ${futures[Math.floor(Math.random() * futures.length)]}`;
      } else if (showFullInfo) {
        // Người dùng free còn lượt xem - hiển thị như VIP
        const fullInfoLimitPath = path.join(__dirname, './cache/ghepFullInfo.json');
        let fullInfoData = JSON.parse(fs.readFileSync(fullInfoLimitPath, 'utf8'));
        const remainingViews = 5 - fullInfoData[senderID].count;
        
        messageBody = `⭐ FULL INFO (${remainingViews}/5) ⭐\n` +
          `🎐 Ghép đôi thành công!\n` +
          `💝 ${userName} (${userZodiac}) 💓 ${partnerName} (${partnerZodiac})\n` +
          `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
          `${getCompatibilityMessage(compatibility)}\n\n` +
          `💫 Phân tích chi tiết:\n` +
          `- Hợp nhau về tính cách: ${personalityMatch}%\n` +
          `- Hợp nhau về sở thích: ${interestMatch}%\n` +
          `- Có cơ hội tiến xa: ${futureChance}%\n\n` +
          `👤 Profile: ${userLink}\n` +
          `👤 Profile đối phương: ${partnerLink}\n\n` +
          `💌 Lời thì thầm: ${loveQuotes[Math.floor(Math.random() * loveQuotes.length)]}\n` +
          `🔮 ${futures[Math.floor(Math.random() * futures.length)]}\n\n` +
          `⏳ Bạn còn ${remainingViews} lần xem thông tin đầy đủ hôm nay\n` +
          `💡 Nâng cấp VIP để không bị giới hạn!`;
      } else {
        // Người dùng free hết lượt xem - ẩn thông tin
        messageBody = `⭐ FREE MATCH ⭐\n` +
          `🎐 Ghép đôi thành công!\n` +
          `💝 ${userName} (${userZodiac}) 💓 ${partnerName} (${partnerZodiac})\n` +
          `🔒 Tỉ lệ hợp đôi: ${compatibility}%\n` +
          `${getCompatibilityMessage(compatibility)}\n\n` +
          `👤 Profile: ${userLink}\n` +
          `👤 Profile đối phương: ${partnerLink}\n\n` +
          `⏳ Bạn đã sử dụng hết 5 lần xem thông tin đầy đủ hôm nay\n` +
          `💡 Nâng cấp lên VIP để xem:\n` +
          `• Thông tin đầy đủ không giới hạn\n` +
          `• Ghép đôi trong nhóm (ghep box)\n` +
          `• Phân tích tính cách và sở thích\n` +
          `• Dự đoán tương lai của cặp đôi\n` +
          `👉 Gõ .vip để biết thêm chi tiết`;
      }

      if (!isLocalMatch) {
        messageBody = messageBody.replace('Ghép đôi thành công!', 'Ghép đôi toàn cục thành công!');
      } else {
        messageBody = messageBody.replace('Ghép đôi thành công!', 'Ghép đôi trong nhóm thành công!');
      }

      await api.sendMessage({
        body: messageBody,
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