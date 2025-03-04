const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { allBalances } = require("../utils/currencies");
const axios = require("axios");

module.exports = {
  name: "top",
  dev: "HNT",
  usedby: 2,
  category: "Tài Chính",
  info: "Xem top 10 người giàu nhất server.",
  onPrefix: true,
  usages:
    ".top: Xem top 10 người chơi giàu nhất.\n.top on: Ẩn danh tên của bạn\n.top unon: Hiện lại tên của bạn",
  cooldowns: 0,

  anonymousUsers: new Set(),

  async createTopImage(sortedBalances, userData, senderID, userAvatars = {}) {
    try {
      const width = 1000;
      const height = 1250;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
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

        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, height);
        ctx.stroke();
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
      drawCorner(50, height - 150, false, true);
      drawCorner(width - 50, height - 150, true, true);

      ctx.shadowColor = "rgba(255, 206, 84, 0.7)";
      ctx.shadowBlur = 15;
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("TOP 10 NGƯỜI GIÀU NHẤT", width / 2, 90);
      ctx.shadowBlur = 0;

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

      const medals = ["🥇", "🥈", "🥉"];
      const rankColors = [
        "#FFD700",
        "#C0C0C0",
        "#CD7F32",
        "rgba(255, 255, 255, 0.2)",
      ];

      let startY = 190;
      const rowHeight = 85;

      for (let i = 0; i < sortedBalances.length && i < 10; i++) {
        const [userID, balance] = sortedBalances[i];
        const userName = this.anonymousUsers.has(userID)
          ? "Người dùng ẩn danh #" + userID.substring(0, 4)
          : userData[userID]
          ? userData[userID].name
          : "Người dùng ẩn danh";
        const formattedBalance = balance
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const cardGradient = ctx.createLinearGradient(
          50,
          startY - 40,
          width - 50,
          startY + 40
        );

        if (i < 3) {
          cardGradient.addColorStop(
            0,
            `rgba(${
              i === 0
                ? "255, 215, 0"
                : i === 1
                ? "192, 192, 192"
                : "205, 127, 50"
            }, 0.2)`
          );
          cardGradient.addColorStop(
            1,
            `rgba(${
              i === 0
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

        ctx.fillStyle = cardGradient;
        ctx.fillRect(50, startY - 40, width - 100, rowHeight);

        if (userID === senderID) {
          ctx.save();
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2;
          ctx.strokeRect(50, startY - 40, width - 100, rowHeight);
          ctx.restore();
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1;
          ctx.strokeRect(50, startY - 40, width - 100, rowHeight);
        }

        const rankColor = i < 3 ? rankColors[i] : rankColors[3];

        ctx.beginPath();
        ctx.arc(100, startY, 36, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(100, startY, 35, 0, Math.PI * 2);

        const circleGradient = ctx.createRadialGradient(
          90,
          startY - 10,
          5,
          100,
          startY,
          35
        );

        if (i < 3) {
          const baseColor =
            i === 0
              ? [255, 215, 0]
              : i === 1
              ? [192, 192, 192]
              : [205, 127, 50];
          circleGradient.addColorStop(
            0,
            `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`
          );
          circleGradient.addColorStop(
            0.7,
            `rgba(${baseColor[0] * 0.8}, ${baseColor[1] * 0.8}, ${
              baseColor[2] * 0.8
            }, 1)`
          );
          circleGradient.addColorStop(
            1,
            `rgba(${baseColor[0] * 0.6}, ${baseColor[1] * 0.6}, ${
              baseColor[2] * 0.6
            }, 1)`
          );
        } else {
          circleGradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
          circleGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
        }

        ctx.fillStyle = circleGradient;
        ctx.fill();

        ctx.fillStyle = i < 3 ? "#000000" : "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";

        if (i < 3) {
          ctx.fillText(medals[i], 100, startY + 15);
        } else {
          ctx.font = "bold 30px Arial";
          ctx.fillText((i + 1).toString(), 100, startY + 10);
        }

        try {
          if (userAvatars[userID]) {
            const avatar = await loadImage(userAvatars[userID]);

            ctx.save();

            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.beginPath();
            ctx.arc(180, startY, 32, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(avatar, 148, startY - 32, 64, 64);
            ctx.restore();

            ctx.strokeStyle = i < 3 ? rankColors[i] : "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(180, startY, 32, 0, Math.PI * 2);
            ctx.stroke();
          }
        } catch (error) {
          console.error(`Error loading avatar for ${userID}:`, error);
        }

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 5;
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(userName, 230, startY + 5);
        ctx.restore();

        const moneyGradient = ctx.createLinearGradient(
          230,
          startY + 35,
          450,
          startY + 35
        );
        moneyGradient.addColorStop(0, "#ffce54");
        moneyGradient.addColorStop(1, "#f9a825");

        ctx.save();
        ctx.shadowColor = "rgba(255, 206, 84, 0.5)";
        ctx.shadowBlur = 10;
        ctx.font = "28px Arial";
        ctx.fillStyle = moneyGradient;
        ctx.fillText(`💰 ${formattedBalance} Xu`, 330, startY + 40);
        ctx.restore();

        startY += rowHeight + 10;
      }

      const footerHeight = 100;
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

      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("AKI GLOBAL", width / 2, height - 60);

      const subtitleGradient = ctx.createLinearGradient(
        width / 2 - 150,
        height - 30,
        width / 2 + 150,
        height - 30
      );
      subtitleGradient.addColorStop(0, "#ffce54");
      subtitleGradient.addColorStop(1, "#f9a825");
      ctx.font = "italic 20px Arial";
      ctx.fillStyle = subtitleGradient;
      ctx.fillText(
        `Cập nhật: ${new Date().toLocaleString("vi-VN")}`,
        width / 2,
        height - 30
      );

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.moveTo(100, height - footerHeight + 20);
      ctx.lineTo(width - 100, height - footerHeight + 20);
      ctx.stroke();

      const buffer = canvas.toBuffer("image/png");
      const tempDir = path.join(__dirname, "../temp");
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

    api.sendMessage(
      "⏳ Đang tạo bảng xếp hạng top 10 người giàu nhất...",
      threadID,
      messageID
    );

    let allBalancesData;
    try {
      allBalancesData = allBalances();
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu số dư:", error);
      return api.sendMessage(
        "❌ Đã xảy ra lỗi khi lấy dữ liệu người dùng.",
        threadID,
        messageID
      );
    }

    let userData;
    try {
      const rawData = fs.readFileSync("./events/cache/userData.json");
      userData = JSON.parse(rawData);
    } catch (error) {
      console.error("Lỗi khi đọc userData.json:", error);
      userData = {};
    }

    const sortedBalances = Object.entries(allBalancesData).sort(
      (a, b) => b[1] - a[1]
    );
    const userAvatars = {};
    try {
      const tempDir = path.join(__dirname, "../temp/avatars");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await Promise.all(
        sortedBalances.map(async ([userID], index) => {
          try {
            const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            const response = await axios.get(avatarUrl, {
              responseType: "arraybuffer",
            });
            const avatarPath = path.join(tempDir, `avatar_${userID}.jpg`);

            fs.writeFileSync(avatarPath, response.data);

            userAvatars[userID] = avatarPath;

            console.log(`✅ Loaded avatar for user ${index + 1}/10: ${userID}`);
          } catch (error) {
            console.error(
              `Failed to load avatar for ${userID}:`,
              error.message
            );
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
      const formattedBalance = balance
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      textFallback += `${rankEmoji[index]} ${
        index + 1
      }. ${userName}\n💰 ${formattedBalance} Xu\n\n`;

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
      const formattedUserBalance = userBalance
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      textFallback += `\n💫 Bạn không có trong top 10.\n💰 Số xu hiện tại: ${formattedUserBalance} Xu`;
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

          cleanupAvatars(userAvatars);
        }
      );
    } catch (error) {
      console.error("Error with canvas generation:", error);
      return api.sendMessage(textFallback, threadID, messageID);
    }
    function cleanupAvatars(userAvatars) {
      Object.values(userAvatars).forEach((avatarPath) => {
        if (fs.existsSync(avatarPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch (err) {
            console.error(`Error deleting avatar: ${avatarPath}`, err);
          }
        }
      });
    }
  },
};
