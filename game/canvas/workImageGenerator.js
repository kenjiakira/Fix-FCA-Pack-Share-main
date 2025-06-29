const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");

async function createWorkResultImage(result, vipBenefits, senderID) {
  try {
    // Setup canvas dimensions
    const width = 800;
    const height = 1050;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Load and register fonts (assuming you have these fonts in an assets directory)
    const assetsPath = path.join(__dirname, "../../fonts");
    registerFont(path.join(assetsPath, "Montserrat-Bold.ttf"), {
      family: "Montserrat",
      weight: "bold",
    });
    registerFont(path.join(assetsPath, "Montserrat-SemiBold.ttf"), {
      family: "Montserrat",
      weight: "600",
    });
    registerFont(path.join(assetsPath, "Montserrat-Medium.ttf"), {
      family: "Montserrat",
      weight: "500",
    });
    registerFont(path.join(assetsPath, "Montserrat-Regular.ttf"), {
      family: "Montserrat",
      weight: "normal",
    });

    // Background with rich gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#1a2a6c");
    bgGradient.addColorStop(0.5, "#2d4373");
    bgGradient.addColorStop(1, "#172047");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 30; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 30, j * 30, 30, 30);
        }
      }
    }

    // Add star-like particles
    drawStarryBackground(ctx, width, height);

    // Header section with rich gradient
    const headerHeight = 160;
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, "rgba(41, 128, 185, 0.9)");
    headerGradient.addColorStop(1, "rgba(52, 152, 219, 0.7)");

    // Create rounded header
    ctx.fillStyle = headerGradient;
    roundedRect(ctx, 20, 20, width - 40, headerHeight, 20);

    // Add decorative lines to header
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = 30 + i * 10;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width - 30, y);
      ctx.stroke();
    }

    // Golden corners design
    drawGoldenCorners(ctx, 30, 30, width - 60, headerHeight - 20);

    // Header text
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.font = "bold 50px Montserrat";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("CÔNG VIỆC", width / 2, 90);
    ctx.shadowBlur = 0;

    // Job category badge
    const category = findJobCategory(result.id) || { name: "Công việc khác" };
    drawCategoryBadge(ctx, width, category.name);

    // Main card for job information
    const cardStartY = 200;
    const cardHeight = 600;

    // Main content card with glass effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundedRect(ctx, 30, cardStartY, width - 60, cardHeight, 20);

    // Add glass effect to the card
    const glassGradient = ctx.createLinearGradient(
      0,
      cardStartY,
      0,
      cardStartY + 100
    );
    glassGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    glassGradient.addColorStop(1, "rgba(255, 255, 255, 0.05)");
    ctx.fillStyle = glassGradient;
    roundedRect(ctx, 30, cardStartY, width - 60, 100, {
      tl: 20,
      tr: 20,
      br: 0,
      bl: 0,
    });

    // Add border to card
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    roundedRectStroke(ctx, 30, cardStartY, width - 60, cardHeight, 20);

    // Job title
    ctx.font = "bold 32px Montserrat";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(result.name, width / 2, cardStartY + 60);

    // Decorative line under job title
    const lineGradient = ctx.createLinearGradient(
      80,
      cardStartY + 80,
      width - 80,
      cardStartY + 80
    );
    lineGradient.addColorStop(0, "rgba(255, 215, 0, 0.1)");
    lineGradient.addColorStop(0.5, "rgba(255, 215, 0, 0.8)");
    lineGradient.addColorStop(1, "rgba(255, 215, 0, 0.1)");

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, cardStartY + 80);
    ctx.lineTo(width - 80, cardStartY + 80);
    ctx.stroke();

    // Level section
    const levelY = cardStartY + 140;
    drawLevelSection(ctx, width, levelY, result);

    // Income information section
    const earningsY = levelY + (isNextRankAvailable(result) ? 200 : 180);
    drawEarningsSection(ctx, width, earningsY, result);

    // VIP bonus section (if applicable)
    let vipY = earningsY + 240;
    if (vipBenefits?.workBonus) {
      vipY = drawVIPBonusSection(ctx, width, vipY, result, vipBenefits);
    }

    // Cooldown section
    const cooldownY = vipY + 40;
    drawCooldownSection(ctx, width, cooldownY, result.cooldown || 0);

    // Level up overlay (if applicable)
    if (result.leveledUp) {
      drawLevelUpOverlay(ctx, width, height, result.leveledUp);
    }

    // Create output image
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../cache");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `work_${senderID}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating work image:", error);
    throw error;
  }
}

// Helper function to find job category
function findJobCategory(jobId) {
  return Object.entries(
    require("../config/family/jobConfig").JOB_CATEGORIES
  ).find(([_, cat]) => cat.jobs.includes(jobId))?.[1];
}

// Helper function to check if next rank is available
function isNextRankAvailable(result) {
  const jobType = result.type || "shipper";
  const ranks = require("../config/family/jobConfig").JOB_RANKS[jobType] || [];
  const currentRankIndex = ranks.findIndex(
    (rank) => rank.name === result.levelName
  );
  return currentRankIndex < ranks.length - 1;
}

// Draw starry background
function drawStarryBackground(ctx, width, height) {
  // Small stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Medium stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few larger "shining" stars
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 1.5 + Math.random() * 1;

    // Star core
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Star glow
    const glow = ctx.createRadialGradient(x, y, radius, x, y, radius * 3);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw golden corners for decorative elements
function drawGoldenCorners(ctx, x, y, width, height) {
  const cornerLength = 30;
  const cornerWidth = 3;

  // Create a golden gradient for corners
  const goldGradient = ctx.createLinearGradient(
    x,
    y,
    x + cornerLength,
    y + cornerLength
  );
  goldGradient.addColorStop(0, "#ffd700");
  goldGradient.addColorStop(0.5, "#f8e483");
  goldGradient.addColorStop(1, "#d4af37");

  ctx.strokeStyle = goldGradient;
  ctx.lineWidth = cornerWidth;

  // Top left corner
  ctx.beginPath();
  ctx.moveTo(x, y + cornerLength);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLength, y);
  ctx.stroke();

  // Top right corner
  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + cornerLength);
  ctx.stroke();

  // Bottom left corner
  ctx.beginPath();
  ctx.moveTo(x, y + height - cornerLength);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + cornerLength, y + height);
  ctx.stroke();

  // Bottom right corner
  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width, y + height - cornerLength);
  ctx.stroke();
}

// Draw category badge
function drawCategoryBadge(ctx, width, categoryName) {
  const badgeY = 120;
  ctx.font = "600 18px Montserrat";
  const textWidth = ctx.measureText(categoryName).width;
  const badgeWidth = textWidth + 60;
  const badgeHeight = 34;
  const badgeX = (width - badgeWidth) / 2;

  // Badge background with gradient
  const badgeGradient = ctx.createLinearGradient(
    badgeX,
    badgeY,
    badgeX + badgeWidth,
    badgeY
  );
  badgeGradient.addColorStop(0, "rgba(26, 188, 156, 0.9)");
  badgeGradient.addColorStop(1, "rgba(46, 204, 113, 0.9)");

  ctx.fillStyle = badgeGradient;
  roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 17);

  // Badge border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  roundedRectStroke(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 17);

  // Badge text
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(categoryName, width / 2, badgeY + 22);
}

// Draw level section
function drawLevelSection(ctx, width, levelY, result) {
  // Level icon (a shield or badge shape)
  const iconSize = 60;
  const iconX = width / 2 - iconSize / 2;
  const iconY = levelY;

  // Draw a shield shape for the level
  const shieldGradient = ctx.createLinearGradient(
    iconX,
    iconY,
    iconX + iconSize,
    iconY + iconSize
  );
  shieldGradient.addColorStop(0, "#FFD700");
  shieldGradient.addColorStop(1, "#DAA520");

  ctx.fillStyle = shieldGradient;
  drawShield(ctx, iconX, iconY, iconSize);

  // Draw level text
  ctx.textAlign = "center";
  ctx.font = "bold 28px Montserrat";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(result.levelName, width / 2, levelY + 90);

  // Work count
  ctx.font = "500 20px Montserrat";
  ctx.fillStyle = "#E0E0E0";
  ctx.fillText(`Số lần làm việc: ${result.workCount}`, width / 2, levelY + 130);

  // Progress bar for next level (if applicable)
  const jobType = result.type || "shipper";
  const ranks = require("../config/family/jobConfig").JOB_RANKS[jobType] || [];
  const currentRankIndex = ranks.findIndex(
    (rank) => rank.name === result.levelName
  );
  const nextRank = ranks[currentRankIndex + 1];

  if (nextRank) {
    const progressY = levelY + 150;
    const barWidth = 550;
    const barHeight = 22;
    const barX = (width - barWidth) / 2;

    // Progress bar background
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    roundedRect(ctx, barX, progressY, barWidth, barHeight, 11);

    // Calculate progress
    const worksNeeded = nextRank.minWork - ranks[currentRankIndex].minWork;
    const currentProgress = result.workCount - ranks[currentRankIndex].minWork;
    const progressPercent = Math.min(
      1,
      Math.max(0, currentProgress / worksNeeded)
    );

    // Progress bar fill with gradient
    const progressGradient = ctx.createLinearGradient(
      barX,
      progressY,
      barX + barWidth,
      progressY
    );
    progressGradient.addColorStop(0, "#4CAF50");
    progressGradient.addColorStop(1, "#8BC34A");
    ctx.fillStyle = progressGradient;

    // Round only the left corners if not full
    if (progressPercent < 1) {
      roundedRect(ctx, barX, progressY, barWidth * progressPercent, barHeight, {
        tl: 11,
        tr: 0,
        br: 0,
        bl: 11,
      });
    } else {
      roundedRect(
        ctx,
        barX,
        progressY,
        barWidth * progressPercent,
        barHeight,
        11
      );
    }

    // Progress text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Montserrat";
    ctx.textAlign = "center";
    ctx.fillText(
      `${currentProgress}/${worksNeeded}`,
      width / 2,
      progressY + 16
    );

    // Next rank information
    ctx.font = "500 18px Montserrat";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(
      `Cấp tiếp theo: ${nextRank.name} (+${((nextRank.bonus - 1) * 100).toFixed(
        0
      )}% lương)`,
      width / 2,
      progressY + 50
    );
  } else {
    // Max level message
    ctx.font = "bold 24px Montserrat";
    const maxLevelGradient = ctx.createLinearGradient(
      width / 2 - 120,
      levelY + 160,
      width / 2 + 120,
      levelY + 160
    );
    maxLevelGradient.addColorStop(0, "#FFA500");
    maxLevelGradient.addColorStop(1, "#FF6347");
    ctx.fillStyle = maxLevelGradient;
    ctx.fillText("ĐÃ ĐẠT CẤP TỐI ĐA!", width / 2, levelY + 160);

    // Current bonus
    ctx.font = "500 18px Montserrat";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(
      `Thưởng hiện tại: +${((ranks[ranks.length - 1].bonus - 1) * 100).toFixed(
        0
      )}% lương`,
      width / 2,
      levelY + 190
    );
  }
}

// Draw earnings section
function drawEarningsSection(ctx, width, earningsY, result) {
  // Section title with decorative elements
  ctx.textAlign = "center";
  ctx.font = "bold 20px Montserrat";

  // Draw decorative lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, earningsY);
  ctx.lineTo(width / 2 - 140, earningsY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(width / 2 + 140, earningsY);
  ctx.lineTo(width - 80, earningsY);
  ctx.stroke();

  // Section title with shine effect
  const titleGradient = ctx.createLinearGradient(
    width / 2 - 100,
    earningsY,
    width / 2 + 100,
    earningsY
  );
  titleGradient.addColorStop(0, "#ffffff");
  titleGradient.addColorStop(0.5, "#f8e483");
  titleGradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = titleGradient;
  ctx.fillText("KẾT QUẢ LÀM VIỆC", width / 2, earningsY + 30);

  // Calculate tax and net earnings
  const tax = Math.floor(result.salary * ((result.tax || 0) / 100));
  const netEarnings = result.salary - tax;

  // Draw earnings panel
  const panelX = 80;
  const panelY = earningsY + 30;
  const panelWidth = width - 160;
  const panelHeight = 180;

  // Panel background
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);

  // Panel border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  roundedRectStroke(ctx, panelX, panelY, panelWidth, panelHeight, 15);

  // Income information
  const infoItems = [
    {
      icon: "💰",
      label: "Được trả",
      value: `${result.salary.toLocaleString("vi-VN")} $`,
      color: "#ffffff",
    },
    {
      icon: "📝",
      label: "Thuế thu nhập",
      value: `${tax.toLocaleString("vi-VN")} $ (${(result.tax || 0).toFixed(
        1
      )}%)`,
      color: "#ff7675",
    },
    {
      icon: "✨",
      label: "Thực lãnh",
      value: `${netEarnings.toLocaleString("vi-VN")} $`,
      color: "#2ecc71",
    },
  ];

  let infoY = panelY + 40;
  infoItems.forEach((item, index) => {
    // Draw icon
    ctx.font = "24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(item.icon, panelX + 30, infoY);

    // Draw label
    ctx.textAlign = "right";
    ctx.font = "500 20px Montserrat";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(item.label + ":", width / 2 - 20, infoY);

    // Draw value
    ctx.textAlign = "left";
    ctx.font = "bold 20px Montserrat";
    ctx.fillStyle = item.color;
    ctx.fillText(item.value, width / 2 + 20, infoY);

    // Add a highlight for the final amount
    if (index === 2) {
      // Highlight for final amount
      const highlightY = infoY + 10;
      const highlightWidth = ctx.measureText(item.value).width + 40;
      const highlightX = width / 2 + 20 - 20;

      ctx.strokeStyle = "rgba(46, 204, 113, 0.5)";
      ctx.lineWidth = 2;
      roundedRectStroke(ctx, highlightX, infoY - 25, highlightWidth, 35, 8);
    }

    infoY += 50;
  });

  return earningsY + 210;
}

// Draw VIP bonus section
function drawVIPBonusSection(ctx, width, vipY, result, vipBenefits) {
  const vipBonus = Math.floor((result.salary * vipBenefits.workBonus) / 100);

  // VIP badge
  const badgeWidth = 200;
  const badgeHeight = 50;
  const badgeX = (width - badgeWidth) / 2;

  // Gold ribbon effect for VIP badge
  const vipGradient = ctx.createLinearGradient(
    badgeX,
    vipY,
    badgeX + badgeWidth,
    vipY
  );
  vipGradient.addColorStop(0, "#FFD700");
  vipGradient.addColorStop(0.5, "#FFC107");
  vipGradient.addColorStop(1, "#FFD700");

  // Badge shape
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  roundedRect(ctx, badgeX, vipY, badgeWidth, badgeHeight, 10);

  // Badge border
  ctx.lineWidth = 3;
  ctx.strokeStyle = vipGradient;
  roundedRectStroke(ctx, badgeX, vipY, badgeWidth, badgeHeight, 10);

  // Badge text
  ctx.font = "bold 26px Montserrat";
  ctx.fillStyle = vipGradient;
  ctx.textAlign = "center";
  ctx.fillText("👑 VIP BONUS 👑", width / 2, vipY + 33);

  // VIP bonus details
  const bonusY = vipY + 70;

  // Draw a semi-transparent panel for the bonus
  const panelX = 120;
  const panelWidth = width - 240;
  const panelHeight = 60;

  ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
  roundedRect(ctx, panelX, bonusY, panelWidth, panelHeight, 10);

  // Panel border with gold gradient
  ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
  ctx.lineWidth = 1;
  roundedRectStroke(ctx, panelX, bonusY, panelWidth, panelHeight, 10);

  // Bonus text
  ctx.textAlign = "center";
  ctx.font = "500 20px Montserrat";
  ctx.fillStyle = "#E0E0E0";
  ctx.fillText(
    `Thưởng VIP: +${vipBenefits.workBonus}%`,
    width / 2,
    bonusY + 25
  );

  ctx.font = "bold 22px Montserrat";
  ctx.fillStyle = "#FFD700";
  ctx.fillText(
    `+${vipBonus.toLocaleString("vi-VN")} $`,
    width / 2,
    bonusY + 50
  );

  return vipY + 150;
}

// Draw cooldown section
function drawCooldownSection(ctx, width, cooldownY, cooldown) {
  const cooldownHours = Math.floor(cooldown / 3600000);
  const cooldownMinutes = Math.floor((cooldown % 3600000) / 60000);

  // Cooldown panel
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(50, cooldownY, width - 100, 80);

  // Clock icon
  ctx.font = "28px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("⏳", width / 2 - 120, cooldownY + 45);

  // Cooldown title
  ctx.font = "bold 24px Montserrat";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("THỜI GIAN CHỜ:", width / 2, cooldownY + 34);

  // Cooldown time
  ctx.font = "bold 22px Montserrat";
  ctx.fillStyle = "#3498db";
  ctx.textAlign = "center";
  ctx.fillText(
    `${
      cooldownHours > 0 ? `${cooldownHours} giờ ` : ""
    }${cooldownMinutes} phút`,
    width / 2,
    cooldownY + 65
  );
}

function drawLevelUpOverlay(ctx, width, height, levelUpInfo) {
  // Semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, width, height);

  // Create a celebration banner
  const bannerHeight = 300;
  const bannerY = (height - bannerHeight) / 2;

  // Animated-like rays behind the banner
  drawCelebrationRays(ctx, width / 2, height / 2, width * 0.8);

  // Banner background with gradient
  const bannerGradient = ctx.createLinearGradient(
    0,
    bannerY,
    0,
    bannerY + bannerHeight
  );
  bannerGradient.addColorStop(0, "rgba(39, 174, 96, 0.9)");
  bannerGradient.addColorStop(1, "rgba(41, 128, 185, 0.9)");

  ctx.fillStyle = bannerGradient;
  roundedRect(ctx, 70, bannerY, width - 140, bannerHeight, 25);
  // Banner border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#FFD700";
  roundedRectStroke(ctx, 80, bannerY + 10, width - 160, bannerHeight - 20, 25);

  // Banner title
  ctx.font = "bold 60px Montserrat";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 15;
  ctx.fillText("THĂNG CẤP!", width / 2, bannerY + 100);

  // Draw sparkles around the title
  drawSparkles(ctx, width, bannerY + 100, 20);

  // Level name with gold gradient
  ctx.font = "bold 36px Montserrat";
  const levelUpGradient = ctx.createLinearGradient(
    width / 2 - 150,
    bannerY + 150,
    width / 2 + 150,
    bannerY + 150
  );
  levelUpGradient.addColorStop(0, "#FFD700");
  levelUpGradient.addColorStop(0.5, "#FFF8DC");
  levelUpGradient.addColorStop(1, "#FFD700");
  ctx.fillStyle = levelUpGradient;
  ctx.shadowBlur = 10;
  ctx.fillText(`${levelUpInfo.name}`, width / 2, bannerY + 170);
  ctx.shadowBlur = 0;

  // Bonus information
  ctx.font = "500 26px Montserrat";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(
    `Thưởng: +${((levelUpInfo.bonus - 1) * 100).toFixed(0)}% lương`,
    width / 2,
    bannerY + 220
  );

  // Celebration ribbon at the bottom
  drawCelebrationRibbon(ctx, width, bannerY + bannerHeight - 30, 200, 15);
}

// Helper function to draw a shield icon for level
function drawShield(ctx, x, y, size) {
  const width = size;
  const height = size * 1.2;

  ctx.beginPath();
  ctx.moveTo(x + width / 2, y); // Top center
  ctx.lineTo(x + width, y + height * 0.3); // Top right
  ctx.lineTo(x + width, y + height * 0.6); // Mid right
  ctx.quadraticCurveTo(x + width / 2, y + height * 1.3, x, y + height * 0.6); // Bottom curve
  ctx.lineTo(x, y + height * 0.3); // Mid left
  ctx.closePath();
  ctx.fill();

  // Shield border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner shield design
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  const innerWidth = width * 0.7;
  const innerHeight = height * 0.7;
  const innerX = x + (width - innerWidth) / 2;
  const innerY = y + height * 0.15;

  ctx.beginPath();
  ctx.moveTo(innerX + innerWidth / 2, innerY); // Top center
  ctx.lineTo(innerX + innerWidth, innerY + innerHeight * 0.3); // Top right
  ctx.lineTo(innerX + innerWidth, innerY + innerHeight * 0.6); // Mid right
  ctx.quadraticCurveTo(
    innerX + innerWidth / 2,
    innerY + innerHeight * 1.3,
    innerX,
    innerY + innerHeight * 0.6
  ); // Bottom curve
  ctx.lineTo(innerX, innerY + innerHeight * 0.3); // Mid left
  ctx.closePath();
  ctx.fill();
}

// Helper function to draw celebration rays
function drawCelebrationRays(ctx, centerX, centerY, maxRadius) {
  ctx.save();
  ctx.globalAlpha = 0.4;

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const length = maxRadius * 0.5 + Math.random() * maxRadius * 0.2;

    const gradient = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );

    gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    ctx.lineWidth = 15 + Math.random() * 15;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  ctx.restore();
}

// Helper function to draw celebration ribbon
function drawCelebrationRibbon(ctx, width, y, ribbonWidth, ribbonHeight) {
  const ribbonX = (width - ribbonWidth) / 2;

  // Draw the main ribbon
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.moveTo(ribbonX, y);
  ctx.lineTo(ribbonX + ribbonWidth, y);
  ctx.lineTo(ribbonX + ribbonWidth + ribbonHeight, y + ribbonHeight);
  ctx.lineTo(ribbonX - ribbonHeight, y + ribbonHeight);
  ctx.closePath();
  ctx.fill();

  // Add some texture to the ribbon
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < ribbonWidth; i += 10) {
    ctx.beginPath();
    ctx.moveTo(ribbonX + i, y);
    ctx.lineTo(ribbonX + i + ribbonHeight, y + ribbonHeight);
    ctx.stroke();
  }
}

// Helper function to draw sparkles
function drawSparkles(ctx, width, centerY, count) {
  ctx.save();

  for (let i = 0; i < count; i++) {
    const x = width / 2 - 200 + Math.random() * 400;
    const y = centerY - 40 + Math.random() * 80;
    const size = 3 + Math.random() * 5;
    const rotation = Math.random() * Math.PI;

    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw a 4-point star
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(0, -size * 2);
    ctx.lineTo(size * 0.5, -size * 0.5);
    ctx.lineTo(size * 2, 0);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.lineTo(0, size * 2);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.lineTo(-size * 2, 0);
    ctx.lineTo(-size * 0.5, -size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  ctx.restore();
}

// Helper function to draw rounded rectangle
function roundedRect(ctx, x, y, width, height, radius) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
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
  ctx.fill();
}

// Helper function to stroke rounded rectangle
function roundedRectStroke(ctx, x, y, width, height, radius) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
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
  ctx.stroke();
}

module.exports = createWorkResultImage;
