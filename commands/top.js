const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { allBalances } = require("../utils/currencies");
const axios = require("axios");
const npcManager = require('../utils/npcManager');
const vipService = require('../game/vip/vipService');

function formatNumber(number) {
  if (number === undefined || number === null) return "0";
  return Math.floor(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
module.exports = {
  name: "top",
  dev: "HNT",
  usedby: 0,
  category: "Tài Chính",
  info: "Xem top 10 người giàu nhất server.",
  onPrefix: true,
  usages:
    ".top: Xem top 10 người chơi giàu nhất.\n.top on: Ẩn danh tên của bạn\n.top unon: Hiện lại tên của bạn",
  cooldowns: 0,

  anonymousUsers: new Set(),

  async createTopImage(sortedBalances, userData, senderID, userAvatars = {}) {
    try {
      const width = 800;
      const height = 1250;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      try {
        registerFont(path.join(__dirname, '../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro' });
      } catch (fontError) {
        console.error("Error loading custom font:", fontError);
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const offset = i * 150;
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(width, offset);
        ctx.stroke();

        if (offset < width) {
          ctx.beginPath();
          ctx.moveTo(offset, 0);
          ctx.lineTo(offset, height);
          ctx.stroke();
        }
      }

      const headerGradient = ctx.createLinearGradient(0, 0, width, 150);
      headerGradient.addColorStop(0, "rgba(70, 40, 120, 0.8)");
      headerGradient.addColorStop(1, "rgba(45, 45, 85, 0.8)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, width, 150);

      const cornerSize = 40;
      const drawCorner = (x, y, flipX, flipY) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.strokeStyle = "#ffce54";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(cornerSize, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, cornerSize);
        ctx.stroke();
        ctx.restore();
      };

      drawCorner(50, 50, false, false);
      drawCorner(width - 50, 50, true, false);
      drawCorner(50, height - 50, false, true);
      drawCorner(width - 50, height - 50, true, true);

      // Title with glow effect
      ctx.shadowColor = "rgba(255, 206, 84, 0.7)";
      ctx.shadowBlur = 15;
      ctx.font = "bold 45px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("TOP 10 NGƯỜI GIÀU NHẤT", width / 2, 90);
      ctx.shadowBlur = 0;

      // Draw decorative divider
      const lineGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
      lineGradient.addColorStop(0, "rgba(255, 206, 84, 0.2)");
      lineGradient.addColorStop(0.5, "rgba(255, 206, 84, 1)");
      lineGradient.addColorStop(1, "rgba(255, 206, 84, 0.2)");

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 120);
      ctx.lineTo(width - 100, 120);
      ctx.stroke();

      // Medallion icons
      const medals = ["🥇", "🥈", "🥉"];
      const rankColors = [
        "#FFD700",  // Gold with # prefix
        "#C0C0C0",  // Silver with # prefix
        "#CD7F32",  // Bronze with # prefix
        "rgba(255, 255, 255, 0.2)"  // Correctly formatted rgba
      ];

      let startY = 180;
      const rowHeight = 90;

      const userVipStatus = {};
      for (const [userID] of sortedBalances.slice(0, 10)) {
        const vipCheck = vipService.checkVIP(userID);
        userVipStatus[userID] = vipCheck.success ? vipCheck : null;
      }

      const roundedRect = (x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      for (let i = 0; i < sortedBalances.length && i < 10; i++) {
        const [userID, balance] = sortedBalances[i];
        const userName = this.anonymousUsers.has(userID)
          ? "Người dùng ẩn danh #" + userID.substring(0, 4)
          : userData[userID]
            ? userData[userID].name
            : "Người dùng ẩn danh";
        const formattedBalance = formatNumber(balance)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const cardGradient = ctx.createLinearGradient(
          50,
          startY - 20,
          width - 50,
          startY + 50
        ); // Thay đổi từ startY-40 thành startY-30

        if (i < 3) {
          cardGradient.addColorStop(
            0,
            `rgba(${i === 0
              ? "255, 215, 0"
              : i === 1
                ? "192, 192, 192"
                : "205, 127, 50"
            }, 0.2)`
          );
          cardGradient.addColorStop(
            1,
            `rgba(${i === 0
              ? "255, 215, 0"
              : i === 1
                ? "192, 192, 192"
                : "205, 127, 50"
            }, 0.05)`
          );
        } else {
          cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
          cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");
        }

        // Check if user is VIP first
        const isVIP = userVipStatus[userID] !== null;

        // Apply special dynamic background for VIP users
        if (isVIP) {
          // Enhanced VIP background with animated-like gradient
          const vipCardGradient = ctx.createLinearGradient(50, startY - 20, width - 50, startY + rowHeight - 20);
          vipCardGradient.addColorStop(0, 'rgba(128, 91, 13, 0.25)');
          vipCardGradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.2)');
          vipCardGradient.addColorStop(1, 'rgba(128, 91, 13, 0.25)');

          ctx.fillStyle = vipCardGradient;
          ctx.fillRect(50, startY - 20, width - 100, rowHeight);

          // Add subtle star pattern for VIP users
          ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
          for (let s = 0; s < 8; s++) {
            const starX = 50 + Math.random() * (width - 150);
            const starY = startY - 20 + Math.random() * rowHeight;
            const starSize = 1 + Math.random() * 3;

            ctx.beginPath();
            ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = cardGradient;
          ctx.fillRect(50, startY - 20, width - 100, rowHeight);
        }

        // Special VIP frame/border
        if (isVIP) {
          // Create a special VIP border
          ctx.save();

          // Golden gradient border
          const vipBorderGradient = ctx.createLinearGradient(50, startY - 20, width - 50, startY - 20);
          vipBorderGradient.addColorStop(0, '#FFD700');
          vipBorderGradient.addColorStop(0.5, '#FFF8DC');
          vipBorderGradient.addColorStop(1, '#DAA520');

          ctx.strokeStyle = vipBorderGradient;
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          ctx.shadowBlur = 10;
          ctx.strokeRect(50, startY - 20, width - 100, rowHeight);

          // Corner accents for VIP users
          ctx.lineWidth = 2;

          // Top left corner
          ctx.beginPath();
          ctx.moveTo(50, startY - 10);
          ctx.lineTo(50, startY - 20);
          ctx.lineTo(70, startY - 20);
          ctx.stroke();

          // Top right corner
          ctx.beginPath();
          ctx.moveTo(width - 50, startY - 10);
          ctx.lineTo(width - 50, startY - 20);
          ctx.lineTo(width - 70, startY - 20);
          ctx.stroke();

          // Bottom left corner
          ctx.beginPath();
          ctx.moveTo(50, startY + rowHeight - 30);
          ctx.lineTo(50, startY + rowHeight - 20);
          ctx.lineTo(70, startY + rowHeight - 20);
          ctx.stroke();

          // Bottom right corner
          ctx.beginPath();
          ctx.moveTo(width - 50, startY + rowHeight - 30);
          ctx.lineTo(width - 50, startY + rowHeight - 20);
          ctx.lineTo(width - 70, startY + rowHeight - 20);
          ctx.stroke();

          ctx.restore();
        } else {
          // Highlight current user with normal highlight
          if (userID === senderID) {
            ctx.save();
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 10;
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 2;
            ctx.strokeRect(50, startY - 20, width - 100, rowHeight);
            ctx.restore();
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, startY - 20, width - 100, rowHeight);
          }
        }

        const rankOffsetY = 20;

        // Draw rank circle with 3D effect
        ctx.beginPath();
        ctx.arc(100, startY + rankOffsetY, 30, 0, Math.PI * 2); // Dịch $ống
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(100, startY + rankOffsetY, 30, 0, Math.PI * 2); // Dịch $ống

        const circleGradient = ctx.createRadialGradient(
          90,
          startY + rankOffsetY - 10,
          5,
          100,
          startY + rankOffsetY,
          30
        );
        
        if (i < 3) {
          const baseColor = i === 0 
            ? [255, 215, 0]  // Gold
            : i === 1 
              ? [192, 192, 192]  // Silver
              : [205, 127, 50];  // Bronze
          
          circleGradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`);
          circleGradient.addColorStop(1, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.7)`);
        } else {
          circleGradient.addColorStop(0, "rgba(60, 60, 60, 1)");
          circleGradient.addColorStop(1, "rgba(30, 30, 30, 0.7)");
        }
        
        ctx.fillStyle = circleGradient;
        ctx.fill();

        // Add rank number or medal icon - Dịch $ống
        ctx.fillStyle = i < 3 ? "#000000" : "#FFFFFF";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";

        if (i < 3) {
          ctx.fillText(medals[i], 100, startY + rankOffsetY + 10); // Dịch $ống
        } else {
          ctx.font = "bold 24px Arial";
          ctx.fillText((i + 1).toString(), 100, startY + rankOffsetY + 8); // Dịch $ống
        }
        try {
          if (userAvatars[userID]) {
            const avatar = await loadImage(userAvatars[userID]);

            const avatarOffsetY = 25;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.beginPath();
            ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(avatar, 140, startY - 30 + avatarOffsetY, 60, 60);
            ctx.restore();

            ctx.strokeStyle = i < 3 ? rankColors[i] : "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Nếu không có avatar, vẽ một placeholder với initials
            const avatarOffsetY = 25;
            const initial = (userName.charAt(0) || '?').toUpperCase();

            ctx.save();
            // Vẽ background tròn
            ctx.beginPath();
            ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);

            // Gradient background cho avatar placeholder
            const placeholderGradient = ctx.createLinearGradient(
              140, startY + avatarOffsetY - 30,
              200, startY + avatarOffsetY + 30
            );
            placeholderGradient.addColorStop(0, "#4a148c");
            placeholderGradient.addColorStop(1, "#311b92");

            ctx.fillStyle = placeholderGradient;
            ctx.fill();

            // Vẽ chữ cái đầu tiên của tên
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(initial, 170, startY + avatarOffsetY);

            // Vẽ viền
            ctx.strokeStyle = i < 3 ? rankColors[i] : "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
        } catch (error) {
          console.error(`Error loading avatar for ${userID}:`, error);
          // Vẽ placeholder nếu có lỗi 
          const avatarOffsetY = 25;
          const initial = (userName.charAt(0) || '?').toUpperCase();

          ctx.save();
          ctx.beginPath();
          ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);
          ctx.fillStyle = "#616161";
          ctx.fill();

          ctx.font = 'bold 30px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(initial, 170, startY + avatarOffsetY);

          ctx.strokeStyle = i < 3 ? rankColors[i] : "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        // User name with shadow
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 5;
        ctx.font = isVIP ? "bold 30px BeVietnamPro" : "bold 30px Arial";
        ctx.fillStyle = isVIP ? "#FFD700" : "#ffffff";
        ctx.textAlign = "left";

        let displayName = userName;

        // Make room for VIP badge if needed
        const maxWidth = isVIP ? width - 370 : width - 300;

        if (ctx.measureText(displayName).width > maxWidth) {
          while (
            ctx.measureText(displayName + "...").width > maxWidth &&
            displayName.length > 0
          ) {
            displayName = displayName.slice(0, -1);
          }
          displayName += "...";
        }

        ctx.fillText(displayName, 220, startY + 15);
        ctx.restore();

        if (isVIP) {
          const packageInfo = userVipStatus[userID].packageInfo;
        
          // Position VIP badge at the far right of the user row with better vertical centering
          const vipBadgeX = width - 130; // Same horizontal position (far right)
          const vipBadgeY = startY + -8; // Better vertical centering
          const vipBadgeWidth = 60; // Larger badge
          const vipBadgeHeight = 60; // Keep square dimensions
        
          // Background for VIP label
          ctx.save();
        
          // VIP badge background
          const vipBadgeGradient = ctx.createLinearGradient(
            vipBadgeX,
            vipBadgeY,
            vipBadgeX + vipBadgeWidth,
            vipBadgeY + vipBadgeHeight
          );
          vipBadgeGradient.addColorStop(0, '#FFD700');
          vipBadgeGradient.addColorStop(1, '#DAA520');
        
          ctx.fillStyle = vipBadgeGradient;
          ctx.beginPath();
          roundedRect(
            ctx,
            vipBadgeX,
            vipBadgeY,
            vipBadgeWidth,
            vipBadgeHeight,
            15 // Larger corner radius for the bigger badge
          );
          ctx.fill();
        
          // Add a stronger glow effect to the badge
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          ctx.shadowBlur = 20;
          ctx.strokeStyle = '#FFF8DC';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        
          // VIP text or image
          try {
            // Check if we have an image URL or load default text
            const vipImage = packageInfo.badgeUrl || 'https://imgur.com/hvce4my.png'; // Default VIP badge if none provided
            const badge = await loadImage(vipImage);
        
            // Draw the VIP badge image - precise positioning
            ctx.drawImage(
              badge,
              vipBadgeX + 5,
              vipBadgeY + 5,
              vipBadgeWidth - 10, 
              vipBadgeHeight - 10
            );
          } catch (error) {
            console.error("Error loading VIP badge:", error);
            // Fallback to text if image fails
            ctx.shadowBlur = 0;
            ctx.font = 'bold 22px BeVietnamPro'; // Larger font for bigger badge
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VIP', vipBadgeX + vipBadgeWidth / 2, vipBadgeY + vipBadgeHeight / 2);
          }
        
          ctx.restore();
        }

        // Special VIP Avatar Frame
        if (isVIP) {
          const avatarOffsetY = 25;

          // Draw glowing avatar frame for VIP users
          ctx.save();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(170, startY + avatarOffsetY, 32, 0, Math.PI * 2);
          ctx.stroke();

          // Decorative accents around avatar for VIP
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rayLength = 10;
            const startRadius = 35;

            const startX = 170 + Math.cos(angle) * startRadius;
            const startY2 = startY + avatarOffsetY + Math.sin(angle) * startRadius;

            const endX = 170 + Math.cos(angle) * (startRadius + rayLength);
            const endY = startY + avatarOffsetY + Math.sin(angle) * (startRadius + rayLength);

            ctx.beginPath();
            ctx.moveTo(startX, startY2);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Balance with gold gradient and enhanced font for VIP users
        const moneyGradient = ctx.createLinearGradient(
          220,
          startY + 35,
          450,
          startY + 35
        );

        if (isVIP) {
          moneyGradient.addColorStop(0, "#FFD700");
          moneyGradient.addColorStop(0.5, "#FFDF00");
          moneyGradient.addColorStop(1, "#F4C430");
        } else {
          moneyGradient.addColorStop(0, "#ffce54");
          moneyGradient.addColorStop(1, "#f9a825");
        }

        ctx.save();
        ctx.shadowColor = isVIP ? "rgba(255, 215, 0, 0.8)" : "rgba(255, 206, 84, 0.5)";
        ctx.shadowBlur = isVIP ? 15 : 10;
        ctx.font = isVIP ? "bold 24px BeVietnamPro" : "22px Arial";
        ctx.fillStyle = moneyGradient;
        
        // Position money further to the right to avoid avatar overlap
        // Money now starts at x=300 instead of x=220 to avoid overlapping avatar
        ctx.fillText(`${formattedBalance} $`, 300, startY + 50);
        ctx.restore();

        startY += rowHeight + 10;
      }

      const footerHeight = 80;
      const footerGradient = ctx.createLinearGradient(
        0,
        height - footerHeight,
        width,
        height
      );
      footerGradient.addColorStop(0, "rgba(45, 45, 85, 0.9)");
      footerGradient.addColorStop(1, "rgba(70, 40, 120, 0.9)");
      ctx.fillStyle = footerGradient;
      ctx.fillRect(0, height - footerHeight, width, footerHeight);

      // AKI Global branding
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("AKI GLOBAL", width / 2, height - 45);

      // Timestamp with golden gradient
      const subtitleGradient = ctx.createLinearGradient(
        width / 2 - 150,
        height - 20,
        width / 2 + 150,
        height - 20
      );
      subtitleGradient.addColorStop(0, "#ffce54");
      subtitleGradient.addColorStop(1, "#f9a825");
      ctx.font = "italic 20px Arial";
      ctx.fillStyle = subtitleGradient;
      ctx.fillText(
        `Cập nhật: ${new Date().toLocaleString("vi-VN")}`,
        width / 2,
        height - 15
      );

      // Footer decoration line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.moveTo(100, height - footerHeight + 20);
      ctx.lineTo(width - 100, height - footerHeight + 20);
      ctx.stroke();

      // Save and return image
      const buffer = canvas.toBuffer("image/png");
      const tempDir = path.join(__dirname, "./cache");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `top_${Date.now()}.png`);
      fs.writeFileSync(outputPath, buffer);

      return outputPath;
    } catch (error) {
      console.error("Error creating top image:", error);
      throw error;
    }
  },
  async getAvatarPath(userId) {
    try {
      if (userId.startsWith('npc_')) {
        const npc = npcManager.getNPCs().find(n => n.id === userId);
        if (npc && npc.avatar) {
          try {
            const response = await axios.get(npc.avatar, {
              responseType: "arraybuffer",
              timeout: 5000
            });

            const avatarDir = path.join(__dirname, "./cache/npc");
            if (!fs.existsSync(avatarDir)) {
              fs.mkdirSync(avatarDir, { recursive: true });
            }

            const npcAvatarPath = path.join(avatarDir, `${userId}.jpg`);
            fs.writeFileSync(npcAvatarPath, response.data);
            return npcAvatarPath;
          } catch (error) {
            console.error(`Failed to fetch NPC avatar for ${userId}:`, error.message);
          }
        }
      }

      const defaultAvatarPath = path.join(__dirname, "./cache/avatar.jpg");

      const avatarsDir = path.join(__dirname, "./cache");
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      // Tạo avatar mặc định nếu chưa có
      if (!fs.existsSync(defaultAvatarPath)) {
        try {
          console.log("⚠️ Default avatar not found, creating one...");
          const defaultCanvas = createCanvas(200, 200);
          const ctx = defaultCanvas.getContext('2d');

          // Vẽ nền gradient
          const gradient = ctx.createLinearGradient(0, 0, 200, 200);
          gradient.addColorStop(0, '#4a148c');
          gradient.addColorStop(1, '#311b92');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 200, 200);

          // Vẽ chữ cái đại diện
          ctx.font = 'bold 120px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('?', 100, 100);

          const buffer = defaultCanvas.toBuffer('image/jpeg');
          fs.writeFileSync(defaultAvatarPath, buffer);
          console.log("✅ Default avatar created successfully");
        } catch (createErr) {
          console.error("Error creating default avatar:", createErr);
        }
      }

      const cacheDir = path.join(__dirname, "./cache/avatars");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const avatarPath = path.join(cacheDir, `${userId}.jpg`);
      const metadataPath = path.join(cacheDir, `${userId}.meta`);

      if (fs.existsSync(avatarPath) && fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        const cacheAge = Date.now() - metadata.timestamp;

        if (cacheAge < 24 * 60 * 60 * 1000) {
          console.log(
            `Using cached avatar for user ${userId} (${Math.floor(
              cacheAge / (60 * 60 * 1000)
            )} hours old)`
          );
          return avatarPath;
        }
      }

      try {
        const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const response = await axios.get(avatarUrl, {
          responseType: "arraybuffer",
          timeout: 5000, // Timeout sau 5 giây
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Chỉ chấp nhận status code 2xx
          }
        });

        fs.writeFileSync(avatarPath, response.data);
        fs.writeFileSync(metadataPath, JSON.stringify({ timestamp: Date.now() }));

        console.log(`Fetched new avatar for user ${userId}`);
        return avatarPath;
      } catch (fetchError) {
        console.error(`Failed to fetch avatar for ${userId}:`, fetchError.message);
        // Trả về avatar mặc định nếu có lỗi khi tải từ Facebook
        console.log(`Using default avatar for user ${userId}`);
        return defaultAvatarPath;
      }
    } catch (error) {
      console.error(`Error in getAvatarPath for ${userId}:`, error.message);
      // Trả về avatar mặc định trong trường hợp lỗi
      const defaultAvatarPath = path.join(__dirname, "./cache/avatar.jpg");
      if (fs.existsSync(defaultAvatarPath)) {
        return defaultAvatarPath;
      }
      return null;
    }
  },

  onLaunch: async function ({ api, event = [] }) {
    const { threadID, messageID, senderID } = event;
    const target = event.body.split(" ").slice(1);

    if (target[0] === "on") {
      this.anonymousUsers.add(senderID);
      return api.sendMessage(
        "✅ Đã ẩn danh tên của bạn trong bảng xếp hạng!",
        threadID,
        messageID
      );
    }
    if (target[0] === "unon") {
      this.anonymousUsers.delete(senderID);
      return api.sendMessage(
        "✅ Đã hiện lại tên của bạn trong bảng xếp hạng!",
        threadID,
        messageID
      );
    }

    let allBalancesData;
    let userData;

    try {
      // Load userData first
      try {
        const rawData = fs.readFileSync("./events/cache/rankData.json");
        userData = JSON.parse(rawData);
      } catch (error) {
        console.error("Lỗi khi đọc userData.json:", error);
        userData = {};
      }

      // Then load balances and add NPCs
      allBalancesData = allBalances();
      const npcs = npcManager.getNPCs();
      npcs.forEach(npc => {
        allBalancesData[npc.id] = npc.balance;
        userData[npc.id] = {
          name: npc.name,
          avatar: npc.avatar
        };
      });

    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu số dư:", error);
      return api.sendMessage(
        "❌ Đã xảy ra lỗi khi lấy dữ liệu người dùng.",
        threadID,
        messageID
      );
    }

    const sortedBalances = Object.entries(allBalancesData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const userAvatars = {};
    try {
      await Promise.all(
        sortedBalances.slice(0, 10).map(async ([userID]) => {
          try {
            if (userID.startsWith('npc_')) {
              const npc = npcManager.getNPCs().find(n => n.id === userID);
              if (npc) {
                const npcAvatarPath = await this.getAvatarPath(userID);
                if (npcAvatarPath) {
                  userAvatars[userID] = npcAvatarPath;
                }
              }
            } else {
              const avatarPath = await this.getAvatarPath(userID);
              if (avatarPath) {
                userAvatars[userID] = avatarPath;
              }
            }
          } catch (e) {
            console.error(`Failed to get avatar for ${userID}:`, e.message);
          }
        })
      );
    } catch (error) {
      console.error("Error fetching avatars:", error);
    }

    let textFallback =
      "💎 𝐓𝐨𝐩 𝟏𝟎 𝐍𝐠ư𝐨̛̀𝐢 𝐆𝐢𝐚̀𝐮 𝐍𝐡𝐚̂́𝐭 𝐒𝐞𝐫𝐯𝐞𝐫\n━━━━━━━━━━━━━━━━━━\n\n";

    const rankEmoji = [
      "👑",
      "🥈",
      "🥉",
      "4️⃣",
      "5️⃣",
      "6️⃣",
      "7️⃣",
      "8️⃣",
      "9️⃣",
      "🔟",
    ];
    let userPosition = null;

    sortedBalances.forEach((entry, index) => {
      const userID = entry[0];
      const balance = entry[1];

      const userName = this.anonymousUsers.has(userID)
        ? "Người dùng ẩn danh #" + userID.substring(0, 4)
        : userData[userID]
          ? userData[userID].name
          : "Người dùng ẩn danh";
      const formattedBalance = formatNumber(balance);

      textFallback += `${rankEmoji[index]} ${index + 1
        }. ${userName}\n💰 ${formattedBalance} $\n\n`;

      if (userID === senderID) {
        userPosition = index + 1;
      }
    });

    if (sortedBalances.length === 0) {
      textFallback = "❌ Chưa có người chơi nào trong hệ thống.";
    }

    if (userPosition !== null) {
      textFallback += `\n🎯 Vị trí của bạn: #${userPosition} trong top 10 người giàu nhất!`;
    } else {
      const userBalance = allBalancesData[senderID] || 0;
      const formattedUserBalance = formatNumber(userBalance)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      textFallback += `\n💫 Bạn không có trong top 10.\n💰 Số $ hiện tại: ${formattedUserBalance} $`;
    }

    try {
      const imagePath = await this.createTopImage(
        sortedBalances,
        userData,
        senderID,
        userAvatars
      );

      return api.sendMessage(
        {
          attachment: fs.createReadStream(imagePath),
        },
        threadID,
        (err) => {
          if (err) api.sendMessage(textFallback, threadID, messageID);

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      );
    } catch (error) {
      console.error("Error with canvas generation:", error);
      return api.sendMessage(textFallback, threadID, messageID);
    }
  },
};
