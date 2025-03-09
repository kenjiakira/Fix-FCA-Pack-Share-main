const { randomInt } = require("crypto");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

class DailyRewardManager {
  constructor() {
    this.filepath = path.join(__dirname, "json", "userClaims.json");
    this.claims = {};
    this.loaded = false;
  }
  /**
   * Gets the user's name from userData.json
   * @param {string} userId - User ID
   * @returns {Promise<string>} - User's name
   */
  async getUserName(userId) {
    try {
      const userDataPath = path.join(
        __dirname,
        "../events/cache/userData.json"
      );

      try {
        const userData = JSON.parse(await fs.readFile(userDataPath, "utf8"));

        // Kiểm tra nếu userData có thông tin về người dùng và có trường name
        if (userData[userId] && userData[userId].name) {
          return userData[userId].name;
        }
      } catch (error) {
        console.error("Error reading user data:", error);
      }

      // Trả về tên mặc định nếu không tìm thấy
      return "Người dùng";
    } catch (error) {
      console.error("Error getting user name:", error);
      return "Người dùng";
    }
  }

  async init() {
    if (this.loaded) return;
    try {
      this.claims = await this.readClaims();
      this.loaded = true;
    } catch (error) {
      console.error("Failed to initialize DailyRewardManager:", error);
      this.claims = {};
    }
  }

  async readClaims() {
    try {
      const data = await fs.readFile(this.filepath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async updateClaim(userId, timestamp) {
    try {
      this.claims[userId] = {
        lastClaim: timestamp,
        streak: this.calculateStreak(userId, timestamp),
      };
      await fs.writeFile(this.filepath, JSON.stringify(this.claims, null, 2));
    } catch (error) {
      console.error("Failed to update claim:", error);
    }
  }

  calculateStreak(userId, currentTime) {
    const userClaim = this.claims[userId];
    if (!userClaim) return 1;

    const lastClaim = userClaim.lastClaim;
    const daysSinceLastClaim = Math.floor(
      (currentTime - lastClaim) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastClaim === 1) {
      return (userClaim.streak || 0) + 1;
    }
    return 1;
  }

  calculateReward(streak) {
    const baseAmount = randomInt(15, 61) * 1000;
    let multiplier = Math.min(1 + streak * 0.1, 2.5);

    const today = new Date().getDay();

    switch (today) {
      case 0:
        multiplier += 0.5;
        break;
      case 6:
        multiplier += 0.3;
        break;
      case 5:
        multiplier += 0.2;
        break;
      default:
        multiplier += 0.1;
    }

    if (streak >= 30) multiplier += 0.5;
    else if (streak >= 14) multiplier += 0.3;
    else if (streak >= 7) multiplier += 0.2;

    return Math.floor(baseAmount * multiplier);
  }

  calculateExpReward(streak) {
    const baseExp = randomInt(10, 25);
    let multiplier = Math.min(1 + streak * 0.05, 2.0);

    const today = new Date().getDay();
    if (today === 0) multiplier += 0.3; // Sunday bonus
    if (today === 6) multiplier += 0.2; // Saturday bonus

    return Math.floor(baseExp * multiplier);
  }

  getDayBonus() {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const bonuses = ["50%", "10%", "10%", "10%", "10%", "20%", "30%"];
    const today = new Date().getDay();
    return {
      day: days[today],
      bonus: bonuses[today],
    };
  }

  async getVipBonus(userId) {
    try {
      const vipDataPath = path.join(__dirname, "json", "vip.json");
      const vipData = JSON.parse(await fs.readFile(vipDataPath, "utf8"));
      const userData = vipData.users?.[userId];

      if (!userData || userData.expireTime < Date.now())
        return {
          hasVip: false,
          bonus: 0,
        };

      switch (userData.packageId) {
        case 3:
          return { hasVip: true, bonus: 8000, packageId: 3 };
        case 2:
          return { hasVip: true, bonus: 5000, packageId: 2 };
        default:
          return { hasVip: true, bonus: 3000, packageId: 1 };
      }
    } catch (error) {
      console.error("Error getting VIP bonus:", error);
      return { hasVip: false, bonus: 0 };
    }
  }

  async updateUserExp(userId, expAmount) {
    try {
      const userDataPath = path.join(
        __dirname,
        "../events/cache/userData.json"
      );
      let userData = {};

      try {
        userData = JSON.parse(await fs.readFile(userDataPath, "utf8"));
      } catch (error) {
        console.error("Error reading user data:", error);
      }

      if (!userData[userId]) {
        userData[userId] = {
          exp: 0,
          level: 1,
        };
      }

      userData[userId].exp = (userData[userId].exp || 0) + expAmount;
      await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));
      return true;
    } catch (error) {
      console.error("Error updating user EXP:", error);
      return false;
    }
  }

  /**
   * Creates a beautiful daily reward canvas image
   * @param {Object} options - Options for creating the image
   * @returns {Promise<string>} - Path to the generated image
   */
  async createDailyRewardImage(options) {
    try {
      const {
        userId,
        userName = "Người dùng",
        streak = 1,
        reward = 0,
        expReward = 0,
        dayBonus,
        vipInfo,
        currentBalance = 0,
      } = options;

      // Create canvas
      const width = 800;
      const height = 1150;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Get day of week to determine theme colors
      const today = new Date().getDay();
      let primaryColor, secondaryColor, accentColor;

      // Set colors based on day of week for visual variety
      switch (today) {
        case 0: // Sunday - Gold
          primaryColor = "#FFD700";
          secondaryColor = "#FFA500";
          accentColor = "#FF8C00";
          break;
        case 1: // Monday - Blue
          primaryColor = "#1E88E5";
          secondaryColor = "#1565C0";
          accentColor = "#0D47A1";
          break;
        case 2: // Tuesday - Purple
          primaryColor = "#8E24AA";
          secondaryColor = "#6A1B9A";
          accentColor = "#4A148C";
          break;
        case 3: // Wednesday - Green
          primaryColor = "#43A047";
          secondaryColor = "#2E7D32";
          accentColor = "#1B5E20";
          break;
        case 4: // Thursday - Orange
          primaryColor = "#FF7043";
          secondaryColor = "#F4511E";
          accentColor = "#E64A19";
          break;
        case 5: // Friday - Teal
          primaryColor = "#26A69A";
          secondaryColor = "#00897B";
          accentColor = "#00695C";
          break;
        case 6: // Saturday - Red
          primaryColor = "#EF5350";
          secondaryColor = "#E53935";
          accentColor = "#C62828";
          break;
        default:
          primaryColor = "#3949AB";
          secondaryColor = "#303F9F";
          accentColor = "#283593";
      }

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1a237e"); // Deep blue
      gradient.addColorStop(0.7, "#303f9f"); // Mid blue
      gradient.addColorStop(1, "#3949ab"); // Light blue
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add star particles effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add decorative grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 80) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Add decorative corners
      const cornerSize = 40;
      const drawCorner = (x, y, flipX, flipY) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.strokeStyle = primaryColor;
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

      // Header section
      const headerHeight = 150;
      const headerGradient = ctx.createLinearGradient(
        0,
        0,
        width,
        headerHeight
      );
      headerGradient.addColorStop(0, "rgba(25, 32, 72, 0.8)");
      headerGradient.addColorStop(1, "rgba(44, 62, 80, 0.8)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, width, headerHeight);

      // Day and Date
      const today_date = new Date();
      const dateStr = today_date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#aaaaaa";
      ctx.textAlign = "center";
      ctx.fillText(dateStr, width / 2, 50);

      // Title with glow effect
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 15;
      ctx.font = "bold 45px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("PHẦN THƯỞNG HÀNG NGÀY", width / 2, 100);
      ctx.shadowBlur = 0;

      // Add decorative line
      const lineGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
      lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      lineGradient.addColorStop(0.5, primaryColor);
      lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 120);
      ctx.lineTo(width - 100, 120);
      ctx.stroke();

      // User Avatar and Info Section
      let avatarPath = null;
      try {
        avatarPath = await this.getAvatarPath(userId);
      } catch (avatarErr) {
        console.error("Error getting avatar:", avatarErr);
      }

      // Draw avatar background
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(50, 170, width - 100, 130);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 170, width - 100, 130);

      try {
        if (avatarPath) {
          const avatar = await loadImage(avatarPath);
          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.beginPath();
          ctx.arc(125, 235, 50, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(avatar, 75, 185, 100, 100);
          ctx.restore();

          // Add avatar border with day-themed color
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(125, 235, 50, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Fallback avatar
          ctx.beginPath();
          ctx.arc(125, 235, 50, 0, Math.PI * 2);
          const placeholderGradient = ctx.createLinearGradient(
            75,
            185,
            175,
            285
          );
          placeholderGradient.addColorStop(0, secondaryColor);
          placeholderGradient.addColorStop(1, accentColor);
          ctx.fillStyle = placeholderGradient;
          ctx.fill();

          // Add initial letter
          const initial = (userName?.charAt(0) || "?").toUpperCase();
          ctx.font = "bold 50px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(initial, 125, 250);

          // Add border
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(125, 235, 50, 0, Math.PI * 2);
          ctx.stroke();
        }
      } catch (avatarDrawErr) {
        console.error("Error drawing avatar:", avatarDrawErr);
      }

      // Username
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(`${userName}`, 200, 215);

      // Streak display with flame icon
      ctx.font = "bold 22px Arial";

      // Create gradient for streak text
      const streakGradient = ctx.createLinearGradient(200, 245, 500, 245);
      if (streak >= 30) {
        // Legendary streak - Gold gradient
        streakGradient.addColorStop(0, "#FFD700");
        streakGradient.addColorStop(0.5, "#FFA500");
        streakGradient.addColorStop(1, "#FF8C00");
      } else if (streak >= 14) {
        // Epic streak - Purple gradient
        streakGradient.addColorStop(0, "#9C27B0");
        streakGradient.addColorStop(1, "#673AB7");
      } else if (streak >= 7) {
        // Rare streak - Blue gradient
        streakGradient.addColorStop(0, "#2196F3");
        streakGradient.addColorStop(1, "#03A9F4");
      } else {
        // Normal streak - Gray gradient
        streakGradient.addColorStop(0, "#9E9E9E");
        streakGradient.addColorStop(1, "#757575");
      }

      ctx.fillStyle = streakGradient;

      // Streak text with fire emoji and star for longer streaks
      let streakText = `🔥 Chuỗi điểm danh: ${streak} ngày`;
      if (streak >= 30) streakText = `🌟 CHUỖI HUYỀN THOẠI: ${streak} NGÀY 🌟`;
      else if (streak >= 14)
        streakText = `⭐ Chuỗi Tuyệt Vời: ${streak} ngày ⭐`;
      else if (streak >= 7) streakText = `✨ Chuỗi Ấn Tượng: ${streak} ngày`;

      ctx.fillText(streakText, 200, 250);

      // Main content

      // Rewards section
      const rewardSectionY = 330;
      const rewardSectionHeight = 350;

      // Draw container
      const rewardGradient = ctx.createLinearGradient(
        50,
        rewardSectionY,
        width - 50,
        rewardSectionY + rewardSectionHeight
      );
      rewardGradient.addColorStop(0, "rgba(25, 32, 72, 0.6)");
      rewardGradient.addColorStop(1, "rgba(44, 62, 80, 0.6)");

      ctx.fillStyle = rewardGradient;
      this.roundRect(
        ctx,
        50,
        rewardSectionY,
        width - 100,
        rewardSectionHeight,
        15,
        true,
        false
      );

      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      this.roundRect(
        ctx,
        50,
        rewardSectionY,
        width - 100,
        rewardSectionHeight,
        15,
        false,
        true
      );

      // Rewards title
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("PHẦN THƯỞNG CỦA BẠN", width / 2, rewardSectionY + 40);

      // Draw each reward type with fancy styling

      // Coin reward
      const coinY = rewardSectionY + 100;

      // Draw icon box
      ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
      ctx.fillRect(70, coinY - 30, 60, 60);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.strokeRect(70, coinY - 30, 60, 60);

      // Coin icon
      ctx.font = "30px Arial";
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.fillText("💰", 100, coinY + 10);

      // Coin reward text
      const coinGradient = ctx.createLinearGradient(150, coinY, 500, coinY);
      coinGradient.addColorStop(0, "#FFD700");
      coinGradient.addColorStop(1, "#FFA500");

      ctx.font = "24px Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("$:", 150, coinY + 10);

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = coinGradient;
      ctx.textAlign = "right";
      ctx.fillText(`+${reward.toLocaleString("vi-VN")}`, width - 70, coinY + 10);

      // EXP reward
      const expY = coinY + 80;

      // Draw icon box
      ctx.fillStyle = "rgba(173, 216, 230, 0.2)";
      ctx.fillRect(70, expY - 30, 60, 60);
      ctx.strokeStyle = "#87CEEB";
      ctx.lineWidth = 1;
      ctx.strokeRect(70, expY - 30, 60, 60);

      // EXP icon
      ctx.font = "30px Arial";
      ctx.fillStyle = "#87CEEB";
      ctx.textAlign = "center";
      ctx.fillText("⭐", 100, expY + 10);

      // EXP reward text
      const expGradient = ctx.createLinearGradient(150, expY, 500, expY);
      expGradient.addColorStop(0, "#87CEEB");
      expGradient.addColorStop(1, "#4682B4");

      ctx.font = "24px Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("EXP:", 150, expY + 10);

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = expGradient;
      ctx.textAlign = "right";
      ctx.fillText(`+${expReward}`, width - 70, expY + 10);

      // Day Bonus
      const bonusY = expY + 80;

      // Draw icon box
      ctx.fillStyle = "rgba(144, 238, 144, 0.2)";
      ctx.fillRect(70, bonusY - 30, 60, 60);
      ctx.strokeStyle = "#90EE90";
      ctx.lineWidth = 1;
      ctx.strokeRect(70, bonusY - 30, 60, 60);

      // Bonus icon
      ctx.font = "30px Arial";
      ctx.fillStyle = "#90EE90";
      ctx.textAlign = "center";
      ctx.fillText("📅", 100, bonusY + 10);

      // Bonus text
      const bonusGradient = ctx.createLinearGradient(150, bonusY, 500, bonusY);
      bonusGradient.addColorStop(0, "#90EE90");
      bonusGradient.addColorStop(1, "#32CD32");

      ctx.font = "24px Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Thưởng ${dayBonus.day}:`, 150, bonusY + 10);

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = bonusGradient;
      ctx.textAlign = "right";
      ctx.fillText(`+${dayBonus.bonus}`, width - 70, bonusY + 10);

      // VIP section (if applicable)
      if (vipInfo.hasVip) {
        // VIP Section
        const vipSectionY = rewardSectionY + rewardSectionHeight + 30;
        const vipSectionHeight = 120;

        // Draw VIP container with golden gradient
        const vipGradient = ctx.createLinearGradient(
          50,
          vipSectionY,
          width - 50,
          vipSectionY + vipSectionHeight
        );
        vipGradient.addColorStop(0, "rgba(184, 134, 11, 0.3)");
        vipGradient.addColorStop(1, "rgba(218, 165, 32, 0.3)");

        ctx.fillStyle = vipGradient;
        this.roundRect(
          ctx,
          50,
          vipSectionY,
          width - 100,
          vipSectionHeight,
          15,
          true,
          false
        );

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        this.roundRect(
          ctx,
          50,
          vipSectionY,
          width - 100,
          vipSectionHeight,
          15,
          false,
          true
        );

        // VIP title with crown
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 10;
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";

        // Show different title based on VIP level
        let vipTitle = `👑 VIP ${vipInfo.packageId} BONUS`;
        if (vipInfo.packageId === 3) vipTitle = "👑👑👑 VIP PREMIUM 👑👑👑";
        else if (vipInfo.packageId === 2) vipTitle = "👑👑 VIP GOLD 👑👑";

        ctx.fillText(vipTitle, width / 2, vipSectionY + 50);
        ctx.shadowBlur = 0;

        // VIP bonus amount
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          `+ ${vipInfo.bonus.toLocaleString("vi-VN")} $`,
          width / 2,
          vipSectionY + 90
        );
      }

      // Current balance section
      const balanceY = vipInfo.hasVip
        ? rewardSectionY + rewardSectionHeight + 200
        : rewardSectionY + rewardSectionHeight + 70;

      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(50, balanceY, width - 100, 80);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, balanceY, width - 100, 80);

      // Balance label
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText("💰 Số Dư Hiện Tại:", 70, balanceY + 50);

      // Balance amount
      const balanceGradient = ctx.createLinearGradient(
        300,
        balanceY + 45,
        700,
        balanceY + 45
      );
      balanceGradient.addColorStop(0, "#4CAF50");
      balanceGradient.addColorStop(1, "#8BC34A");

      ctx.font = "bold 30px Arial";
      ctx.fillStyle = balanceGradient;
      ctx.textAlign = "right";
      ctx.fillText(
        `${currentBalance.toLocaleString("vi-VN")} $`,
        width - 70,
        balanceY + 50
      );

      // Next claim countdown
      const countdownY = balanceY + 150;

      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#aaaaaa";
      ctx.textAlign = "center";
      ctx.fillText(
        "⏰ Nhận thưởng tiếp theo sau 24 giờ ⏰",
        width / 2,
        countdownY
      );

      // Streak guide
      const streakGuideY = countdownY + 90;

      ctx.font = "20px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      // Different messages based on streak length
      let streakMsg = "Hãy đăng nhập mỗi ngày để duy trì chuỗi điểm danh!";
      if (streak >= 1 && streak < 7) {
        streakMsg = `🔥 Tiếp tục ${7 - streak} ngày nữa để đạt chuỗi 7 ngày!`;
      } else if (streak >= 7 && streak < 14) {
        streakMsg = `✨ Tiếp tục ${14 - streak} ngày nữa để đạt chuỗi 14 ngày!`;
      } else if (streak >= 14 && streak < 30) {
        streakMsg = `⭐ Tiếp tục ${
          30 - streak
        } ngày nữa để đạt chuỗi huyền thoại!`;
      } else if (streak >= 30) {
        streakMsg =
          "🌟 Chuỗi huyền thoại! Tiếp tục duy trì để nhận thưởng tối đa!";
      }

      ctx.fillText(streakMsg, width / 2, streakGuideY);

      const buffer = canvas.toBuffer("image/png");
      const tempDir = path.join(__dirname, "cache");
      if (!fsSync.existsSync(tempDir)) {
        fsSync.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(
        tempDir,
        `daily_${userId}_${Date.now()}.png`
      );
      await fs.writeFile(outputPath, buffer);
      return outputPath;
    } catch (error) {
      console.error("Error creating daily reward image:", error);
      throw error;
    }
  }

  /**
   * Draws a rounded rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @param {number} radius - Radius of the corners
   * @param {boolean} fill - Whether to fill the rectangle
   * @param {boolean} stroke - Whether to stroke the rectangle
   */
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === "undefined") {
      radius = 5;
    }
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }
  /**
   * Gets the avatar path for a user
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Path to the avatar image
   */
  async getAvatarPath(userId) {
    const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=200&height=200`;
    const avatarPath = path.join(__dirname, "cache", "daily", `${userId}_avatar.png`);
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
    });
    await fs.writeFile(avatarPath, response.data);
    return avatarPath;
  }
}

function generateRandomVoucher(userId) {
  const voucherTypes = ["BRONZE", "SILVER", "GOLD"];
  const randomType = voucherTypes[Math.floor(Math.random() * voucherTypes.length)];
  
  const discount = randomType === "BRONZE" ? 10 : 
                   randomType === "SILVER" ? 15 : 20;
  
  // Generate random code
  const generateCode = () => {
      const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
  };
  
  const code = `${randomType}_${generateCode()}${Math.floor(Math.random() * 10000)}`;
  
  // Set expiry to 7 days
  const expires = Date.now() + (7 * 24 * 60 * 60 * 1000);
  
  return {
      type: randomType,
      code: code,
      discount: discount,
      expires: expires,
      used: false
  };
}

function giveRandomVoucher(userId) {
  try {
      const voucherPath = path.join(__dirname, 'json', 'voucher.json');
      let voucherData = { users: {} };
      
      if (fs.existsSync(voucherPath)) {
          voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
      }
      
      if (!voucherData.users[userId]) voucherData.users[userId] = [];
      
      // 20% chance to get a voucher
      if (Math.random() < 0.2) {
          const newVoucher = generateRandomVoucher(userId);
          voucherData.users[userId].push(newVoucher);
          fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));
          return {
              success: true,
              voucher: newVoucher
          };
      }
      
      return {
          success: false
      };
  } catch (err) {
      console.error("Error giving random voucher:", err);
      return { success: false };
  }
}

const dailyManager = new DailyRewardManager();

module.exports = {
  name: "daily",
  dev: "HNT",
  usedby: 0,
  category: "Tài Chính",
  info: "Nhận $ và EXP mỗi ngày",
  onPrefix: true,
  usages: ".daily: Nhận thưởng hàng ngày. Nhận thưởng thêm khi duy trì streak!",
  cooldowns: 5,

  onLaunch: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
      await dailyManager.init();

      const now = Date.now();
      const userClaim = dailyManager.claims[senderID] || {
        lastClaim: 0,
        streak: 0,
      };
      const timeSinceLastClaim = now - userClaim.lastClaim;

      if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil(
          (24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 60 * 1000)
        );
        const minutesLeft =
          Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 1000)) %
          60;
        return api.sendMessage(
          `⏳ Vui lòng đợi ${hoursLeft} giờ ${minutesLeft} phút nữa!\n` +
            `Streak hiện tại: ${userClaim.streak || 0} ngày`,
          threadID,
          messageID
        );
      }

      const streak = dailyManager.calculateStreak(senderID, now);
      const amount = dailyManager.calculateReward(streak);
      const expAmount = dailyManager.calculateExpReward(streak);
      const dayBonus = dailyManager.getDayBonus();
      const vipInfo = await dailyManager.getVipBonus(senderID);

      const totalAmount = amount + (vipInfo.bonus || 0);

      global.balance[senderID] = (global.balance[senderID] || 0) + totalAmount;
      await dailyManager.updateClaim(senderID, now);
      await dailyManager.updateUserExp(senderID, expAmount);
      await require("../utils/currencies").saveData();

      const currentBalance = global.balance[senderID] || 0;
      let userName = await dailyManager.getUserName(senderID);
      
      if (userName === "Người dùng" && event.senderName) {
        userName = event.senderName;
      }
      
      const imagePath = await dailyManager.createDailyRewardImage({
        userId: senderID,
        userName,
        streak,
        reward: amount,
        expReward: expAmount,
        dayBonus,
        vipInfo,
        currentBalance,
      });

      const voucherResult = giveRandomVoucher(senderID);
      let message = "";
      if (voucherResult.success) {
        const v = voucherResult.voucher;
        const voucherEmoji = v.type === "BRONZE" ? "🥉" : 
                            v.type === "SILVER" ? "🥈" : "🎖️";
        
        const voucherMessage = `\n\n🎊 CHÚC MỪNG! Bạn nhận được voucher!\n${voucherEmoji} VOUCHER ${v.type} (-${v.discount}%)\n📝 Mã: ${v.code}\n⏳ Hạn sử dụng: 7 ngày\n\nDùng '.voucher' để xem chi tiết.`;
        
        message += voucherMessage;
      }

      return api.sendMessage(
        {
          body: message,
          attachment: fsSync.createReadStream(imagePath),
        },
        threadID,
        (error, info) => {
          if (!error) {
          
            setTimeout(() => {
              try {
                fsSync.unlinkSync(imagePath);
                console.log(`Đã xóa ảnh daily: ${imagePath}`);
              } catch (deleteError) {
                console.error(`Không thể xóa ảnh daily: ${deleteError}`);
              }
            }, 5000); 
          } else {
            console.error(`Lỗi khi gửi ảnh daily: ${error}`);
          }
        }
      );
    } catch (error) {
      console.error("Daily command error:", error);
      return api.sendMessage(
        "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
        threadID,
        messageID
      );
    }
  },
};
