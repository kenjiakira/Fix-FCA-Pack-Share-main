const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fontDir = path.join(__dirname, "../fonts");
function setupGenshinFont() {
  try {
    if (!fs.existsSync(fontDir)) {
      fs.mkdirSync(fontDir, { recursive: true });
    }

    const genshinFontPath = path.join(fontDir, "GenshinDrip.ttf");
    if (!fs.existsSync(genshinFontPath)) {
      console.log("⚠️ Không tìm thấy font Genshin Impact DRIP FONT!");
      console.log("ℹ️ Vui lòng đặt file font vào thư mục: " + fontDir);
      return false;
    }

    registerFont(genshinFontPath, {
      family: "GenshinFont",
      weight: "normal",
      style: "normal",
    });

    registerFont(genshinFontPath, {
      family: "GenshinFont",
      weight: "bold",
      style: "normal",
    });

    console.log("✅ Đã đăng ký font Genshin Impact DRIP FONT thành công!");
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký font:", error);
    return false;
  }
}

const fontLoaded = setupGenshinFont();

const fontFamily = fontLoaded ? "GenshinFont" : "Arial";
function hexToRgb(hex) {
  try {
    if (!hex || typeof hex !== "string") {
      return "255, 255, 255";
    }

    if (hex.startsWith("rgb")) {
      const rgbMatch = hex.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return `${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}`;
      }
      return "255, 255, 255";
    }

    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return "255, 255, 255";
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  } catch (error) {
    console.error("Error in hexToRgb:", error);
    return "255, 255, 255";
  }
}

function parseColor(color, fallback = "#ffffff") {
  try {
    if (!color) return fallback;

    if (typeof color === "string") {
      if (color.startsWith("rgb")) {
        return color;
      }
      if (color.startsWith("#")) {
        const hex = color.replace(/^#/, "");
        if (/^[0-9A-Fa-f]{3}$/.test(hex) || /^[0-9A-Fa-f]{6}$/.test(hex)) {
          return color;
        }
        return fallback;
      }
    }

    const predefinedColors = {
      red: "#ff0000",
      green: "#00ff00",
      blue: "#0000ff",
      yellow: "#ffff00",
      white: "#ffffff",
      black: "#000000",
      purple: "#800080",
      gold: "#FFD700",
    };

    if (typeof color === "string" && predefinedColors[color.toLowerCase()]) {
      return predefinedColors[color.toLowerCase()];
    }

    return fallback;
  } catch (error) {
    console.error(`Error in parseColor: ${error.message}, using fallback`);
    return fallback;
  }
}

const rarityColors = {
  5: {
    primary: "#FFD700",
    secondary: "#FFA500",
    gradient: ["#FFD700", "#FFA500"],
    premium: {
      primary: "#FFE700",
      secondary: "#FF5500",
      gradient: ["#FFE700", "#FF5500", "#FFD700"],
    },
  },
  4: {
    primary: "#9b59b6",
    secondary: "#8e44ad",
    gradient: ["#9b59b6", "#8e44ad"],
  },
  3: {
    primary: "#3498db",
    secondary: "#2980b9",
    gradient: ["#3498db", "#2980b9"],
  },
};

try {
  const fontsDir = path.join(__dirname, "../fonts");
  if (fs.existsSync(path.join(fontsDir, "Genshin-Regular.ttf"))) {
    registerFont(path.join(fontsDir, "Genshin-Regular.ttf"), {
      family: "Genshin",
      weight: "normal",
    });
  }
  if (fs.existsSync(path.join(fontsDir, "Genshin-Bold.ttf"))) {
    registerFont(path.join(fontsDir, "Genshin-Bold.ttf"), {
      family: "Genshin",
      weight: "bold",
    });
  }
} catch (e) {
  console.log("Could not load Genshin fonts, using system defaults");
}

function drawParticleEffects(ctx, width, height, rarity) {
  const colors = rarityColors[rarity] || rarityColors["3"];
  const particleColor = parseColor(colors?.primary, "#ffffff");

  const particleCount = rarity === "5" ? 120 : rarity === "4" ? 80 : 40;
  const maxSize = rarity === "5" ? 4 : rarity === "4" ? 3 : 2;

  ctx.save();
  ctx.fillStyle = particleColor;
  ctx.globalAlpha = 0.4;

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * maxSize + 1;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  if (rarity === "5") {
    ctx.shadowBlur = 15;
    ctx.shadowColor = particleColor;

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 6 + 2;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
function drawEnhancedPremiumCorner(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#FFE700");
  gradient.addColorStop(0.3, "#FFFFFF");
  gradient.addColorStop(0.6, "#FFD700");
  gradient.addColorStop(1, "#FF5500");

  ctx.fillStyle = gradient;
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size / 3);
  ctx.bezierCurveTo(
    size * 0.9,
    size * 0.4,
    size * 0.6,
    size * 0.5,
    size * 0.8,
    size * 0.8
  );
  ctx.lineTo(size * 0.7, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, 5);
  ctx.lineTo(size - 10, 5);
  ctx.lineTo(size - 10, size / 3);
  ctx.stroke();

  const diamondSize = size / 6;
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#FFD700";

  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const len = diamondSize;
    const px = Math.cos(angle) * len;
    const py = Math.sin(angle) * len;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
function drawPremiumPatterns(ctx, x, y, width, height) {
  ctx.save();

  const patternY = y + 80;
  const patternHeight = height - 160;

  ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(x + 20, patternY);
  ctx.lineTo(x + 20, patternY + patternHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + width - 20, patternY);
  ctx.lineTo(x + width - 20, patternY + patternHeight);
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const decorY = patternY + (patternHeight * i) / 5;

    ctx.beginPath();
    ctx.moveTo(x + 10, decorY);
    ctx.lineTo(x + 30, decorY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width - 10, decorY);
    ctx.lineTo(x + width - 30, decorY);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(x + 20, decorY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width - 20, decorY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
function drawStar(ctx, x, y, size, color) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](radius * Math.cos(angle), radius * Math.sin(angle));
  }

  ctx.closePath();

  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  const gradient = ctx.createRadialGradient(
    0,
    0,
    innerRadius,
    0,
    0,
    outerRadius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;

  ctx.fill();
  ctx.restore();
}

function drawCornerDecoration(ctx, x, y, rotation, color, rarity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  const lineLength = rarity === "5" ? 60 : rarity === "4" ? 50 : 40;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(lineLength, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, lineLength);

  const gradient = ctx.createLinearGradient(0, 0, lineLength, lineLength);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}55`);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = rarity === "5" ? 4 : rarity === "4" ? 3 : 2;
  ctx.stroke();

  if (rarity === "5") {
    ctx.beginPath();
    ctx.moveTo(lineLength, 0);
    ctx.lineTo(lineLength + 10, 10);
    ctx.lineTo(lineLength, 20);
    ctx.lineTo(lineLength - 10, 10);
    ctx.closePath();

    const diamondGrad = ctx.createRadialGradient(
      lineLength,
      10,
      0,
      lineLength,
      10,
      15
    );
    diamondGrad.addColorStop(0, "#FFFFFF");
    diamondGrad.addColorStop(0.5, color);
    diamondGrad.addColorStop(1, "#FFA500");

    ctx.fillStyle = diamondGrad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(lineLength / 3, lineLength / 3);
    ctx.lineTo(lineLength / 2, lineLength / 3);
    ctx.lineTo(lineLength / 2, lineLength / 2);
    ctx.stroke();
  } else if (rarity === "4") {
    ctx.beginPath();
    ctx.arc(lineLength - 10, 10, 8, 0, Math.PI * 2);

    const circleGrad = ctx.createRadialGradient(
      lineLength - 10,
      10,
      0,
      lineLength - 10,
      10,
      8
    );
    circleGrad.addColorStop(0, "#FFFFFF");
    circleGrad.addColorStop(1, color);

    ctx.fillStyle = circleGrad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(lineLength, 0);
    ctx.lineTo(lineLength - 5, 5);
    ctx.lineTo(lineLength, 10);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();
}

function drawFrameDecorations(ctx, x, y, width, height, rarity, colors) {
  ctx.save();

  if (rarity === "5") {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 5;

    const patternWidth = width / 2;
    ctx.beginPath();
    ctx.moveTo(x + width / 2 - patternWidth / 2, y + 20);

    ctx.bezierCurveTo(
      x + width / 2 - patternWidth / 4,
      y + 5,
      x + width / 2 + patternWidth / 4,
      y + 5,
      x + width / 2 + patternWidth / 2,
      y + 20
    );
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const posX = x + width / 2 - patternWidth / 2 + (patternWidth * i) / 4;
      const posY = y + 20 - Math.sin((i / 4) * Math.PI) * 15;

      ctx.beginPath();
      ctx.arc(posX, posY, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(x + width / 2 - patternWidth / 2, y + height - 20);
    ctx.bezierCurveTo(
      x + width / 2 - patternWidth / 4,
      y + height - 5,
      x + width / 2 + patternWidth / 4,
      y + height - 5,
      x + width / 2 + patternWidth / 2,
      y + height - 20
    );
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const posX = x + width / 2 - patternWidth / 2 + (patternWidth * i) / 4;
      const posY = y + height - 20 + Math.sin((i / 4) * Math.PI) * 15;

      ctx.beginPath();
      ctx.arc(posX, posY, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
    }

    for (let side = 0; side < 2; side++) {
      const posX = side === 0 ? x + 20 : x + width - 20;

      ctx.beginPath();
      ctx.moveTo(posX, y + height / 3);
      ctx.lineTo(posX, y + (height * 2) / 3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(posX, y + height / 3);
      ctx.lineTo(posX + (side === 0 ? 10 : -10), y + height / 3 - 5);
      ctx.lineTo(posX + (side === 0 ? 10 : -10), y + height / 3 + 5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(posX, y + (height * 2) / 3);
      ctx.lineTo(posX + (side === 0 ? 10 : -10), y + (height * 2) / 3 - 5);
      ctx.lineTo(posX + (side === 0 ? 10 : -10), y + (height * 2) / 3 + 5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (rarity === "4") {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 4;

    const accentWidth = width * 0.6;

    ctx.beginPath();
    ctx.moveTo(x + width / 2 - accentWidth / 2, y + 15);
    ctx.lineTo(x + width / 2, y + 25);
    ctx.lineTo(x + width / 2 + accentWidth / 2, y + 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width / 2 - accentWidth / 2, y + height - 15);
    ctx.lineTo(x + width / 2, y + height - 25);
    ctx.lineTo(x + width / 2 + accentWidth / 2, y + height - 15);
    ctx.stroke();

    for (let side = 0; side < 2; side++) {
      const posX = side === 0 ? x + 15 : x + width - 15;
      const dotCount = 5;

      for (let i = 1; i <= dotCount; i++) {
        const posY = y + (height * i) / (dotCount + 1);
        ctx.beginPath();
        ctx.arc(posX, posY, 3, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
      }
    }
  } else {
    const accentSize = 25;

    ctx.beginPath();
    ctx.moveTo(x + width / 2 - accentSize, y + 15);
    ctx.lineTo(x + width / 2 + accentSize, y + 15);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width / 2 - accentSize, y + height - 15);
    ctx.lineTo(x + width / 2 + accentSize, y + height - 15);
    ctx.stroke();
  }

  ctx.restore();
}
function drawCardFrame(ctx, rarity, x, y, width, height, isPremium = false) {
  ctx.save();

  const colors = rarityColors[rarity] || rarityColors["3"];

  if (rarity === "5" && isPremium) {
    // Hiệu ứng hào quang phần ngoài
    const outerGlowGradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      width / 4,
      x + width / 2,
      y + height / 2,
      width
    );
    outerGlowGradient.addColorStop(0, `rgba(255, 215, 0, 0.6)`); // Làm sáng hơn (0.6 thay vì 0.3)
    outerGlowGradient.addColorStop(0.5, `rgba(255, 140, 0, 0.4)`); // Làm sáng hơn (0.4 thay vì 0.2)
    outerGlowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = outerGlowGradient;
    ctx.fillRect(x - 80, y - 80, width + 160, height + 160); // Mở rộng vùng glow

    // Thêm viền kép sang trọng
    // Viền ngoài
    const outerBorderGradient = ctx.createLinearGradient(x, y, x, y + height);
    outerBorderGradient.addColorStop(0, "#FFD700");
    outerBorderGradient.addColorStop(0.3, "#FFFFFF");
    outerBorderGradient.addColorStop(0.7, "#FFD700");
    outerBorderGradient.addColorStop(1, "#FF8C00");

    ctx.strokeStyle = outerBorderGradient;
    ctx.lineWidth = 14; // Tăng độ dày viền
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 25; // Tăng độ mờ bóng
    roundRect(ctx, x - 6, y - 6, width + 12, height + 12, 24, false, true);

    // Viền trong
    const innerBorderGradient = ctx.createLinearGradient(x, y, x, y + height);
    innerBorderGradient.addColorStop(0, "#FFA500");
    innerBorderGradient.addColorStop(0.5, "#FFFFFF");
    innerBorderGradient.addColorStop(1, "#FFA500");

    ctx.strokeStyle = innerBorderGradient;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    roundRect(ctx, x + 8, y + 8, width - 16, height - 16, 18, false, true);

    // Thêm họa tiết phức tạp ở 4 góc (tăng kích thước)
    const cornerSize = 60; // Tăng từ 40 lên 60
    [
      [x, y], // Góc trên bên trái - Giữ nguyên
      [x + width - cornerSize, y], // Góc trên bên phải - OK
      [x, y + height - cornerSize], // Góc dưới bên trái - OK
      [x + width - cornerSize, y + height - cornerSize] // Góc dưới bên phải - OK
    ].forEach((pos, i) => {
      drawEnhancedPremiumCorner(ctx, pos[0], pos[1], cornerSize, i * Math.PI/2);
    });
    for (let i = 0; i < 12; i++) {
      // Tăng từ 8 lên 12
      const timestamp = Date.now() / 1000;
      const angle = (i / 12) * Math.PI * 2 + timestamp;
      const distance = width / 2.5 + Math.sin(timestamp + i) * 20; // Hiệu ứng chuyển động
      const sparkleX = x + width / 2 + Math.cos(angle) * distance;
      const sparkleY = y + height / 2 + Math.sin(angle) * distance * 0.8;
      const sparkleSize = 20 + Math.sin(timestamp * 3 + i) * 8; // Tăng kích thước
      drawPremiumSparkle(ctx, sparkleX, sparkleY, sparkleSize);
    }

    drawPremiumPatterns(ctx, x, y, width, height);
  } else {
    const glowRadius = width * 0.6;
    const glowGradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      width / 3,
      x + width / 2,
      y + height / 2,
      glowRadius
    );

    const glowOpacity = rarity === "5" ? 0.4 : rarity === "4" ? 0.3 : 0.2;
    glowGradient.addColorStop(
      0,
      `rgba(${hexToRgb(colors.primary)}, ${glowOpacity})`
    );
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = glowGradient;
    ctx.fillRect(x - 30, y - 30, width + 60, height + 60);

    if (rarity === "5") {
      const outerBorderGradient = ctx.createLinearGradient(x, y, x, y + height);
      outerBorderGradient.addColorStop(0, colors.primary);
      outerBorderGradient.addColorStop(0.5, "#FFFFFF");
      outerBorderGradient.addColorStop(1, colors.primary);

      ctx.strokeStyle = outerBorderGradient;
      ctx.lineWidth = 10;
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 15;
      roundRect(ctx, x - 2, y - 2, width + 4, height + 4, 20, false, true);

      const innerBorderGradient = ctx.createLinearGradient(x, y, x, y + height);
      innerBorderGradient.addColorStop(0, colors.secondary);
      innerBorderGradient.addColorStop(0.5, colors.primary);
      innerBorderGradient.addColorStop(1, colors.secondary);

      ctx.strokeStyle = innerBorderGradient;
      ctx.lineWidth = 6;
      ctx.shadowBlur = 5;
      roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 15, false, true);
    } else if (rarity === "4") {
      const borderGradient = ctx.createLinearGradient(x, y, x, y + height);
      borderGradient.addColorStop(0, colors.primary);
      borderGradient.addColorStop(0.3, colors.secondary);
      borderGradient.addColorStop(0.7, colors.primary);
      borderGradient.addColorStop(1, colors.secondary);

      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 8;
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 10;
      roundRect(ctx, x, y, width, height, 18, false, true);

      ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 3;
      roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 12, false, true);
    } else {
      const borderGradient = ctx.createLinearGradient(x, y, x, y + height);
      borderGradient.addColorStop(0, colors.primary);
      borderGradient.addColorStop(0.5, colors.secondary);
      borderGradient.addColorStop(1, colors.primary);

      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 6;
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 8;
      roundRect(ctx, x, y, width, height, 15, false, true);
    }

    drawCornerDecoration(ctx, x + 5, y + 5, 0, colors.primary, rarity);
    drawCornerDecoration(ctx, x + width - 5, y + 5, 90, colors.primary, rarity);
    drawCornerDecoration(
      ctx,
      x + 5,
      y + height - 5,
      270,
      colors.primary,
      rarity
    );
    drawCornerDecoration(
      ctx,
      x + width - 5,
      y + height - 5,
      180,
      colors.primary,
      rarity
    );

    drawFrameDecorations(ctx, x, y, width, height, rarity, colors);

    const starSize = rarity === "5" ? 24 : rarity === "4" ? 20 : 16;
    const starSpacing = rarity === "5" ? 35 : 30;
    const totalStarWidth = starSpacing * parseInt(rarity);
    const startX = x + (width - totalStarWidth) / 2 + starSpacing / 2;
    const starY = y - 35;

    for (let i = 0; i < parseInt(rarity); i++) {
      drawStar(ctx, startX + i * starSpacing, starY, starSize, colors.primary);
    }
  }

  ctx.restore();
}

function drawPremiumCorner(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#FFE700");
  gradient.addColorStop(0.5, "#FFFFFF");
  gradient.addColorStop(1, "#FF5500");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size / 3);
  ctx.quadraticCurveTo(size / 2, size / 2, size, size);
  ctx.lineTo(size - size / 3, size);
  ctx.lineTo(0, size);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  ctx.restore();
}

function drawPremiumSparkle(ctx, x, y, size) {
  ctx.save();

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, "#FFFFFF");
  gradient.addColorStop(0.5, "#FFD700");
  gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.8;

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const len = i % 2 === 0 ? size : size / 2;
    const px = x + Math.cos(angle) * len;
    const py = y + Math.sin(angle) * len;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function generateCharacterStats(rarity) {
  const baseStats = {
    5: {
      hp: [3500, 4500],
      atk: [250, 350],
      def: [200, 300],
    },
    4: {
      hp: [2500, 3500],
      atk: [180, 250],
      def: [150, 200],
    },
    3: {
      hp: [1500, 2500],
      atk: [120, 180],
      def: [100, 150],
    },
  };

  const stats = baseStats[rarity] || baseStats["3"];

  return {
    hp: Math.floor(Math.random() * (stats.hp[1] - stats.hp[0]) + stats.hp[0]),
    atk: Math.floor(
      Math.random() * (stats.atk[1] - stats.atk[0]) + stats.atk[0]
    ),
    def: Math.floor(
      Math.random() * (stats.def[1] - stats.def[0]) + stats.def[0]
    ),
  };
}

function drawCardDecorations(ctx, x, y, width, height, colors) {
  ctx.save();

  const shineGradient = ctx.createLinearGradient(x, y, x + width, y + height);

  shineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  shineGradient.addColorStop(0.2, "rgba(255, 255, 255, 0)");
  shineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  shineGradient.addColorStop(0.8, "rgba(255, 255, 255, 0)");
  shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = shineGradient;
  roundRect(ctx, x, y, width, height, 15, true, false);

  ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.6)`;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + 30);
  ctx.lineTo(x + width * 0.8, y + 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + height - 30);
  ctx.lineTo(x + width * 0.8, y + height - 30);
  ctx.stroke();

  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "undefined") {
    radius = 5;
  }

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();

  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

function drawEnhancedCharacterFrame(ctx, x, y, width, height, rarity, colors) {
  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  roundRect(ctx, x, y, width, height, 15, true, false);

  ctx.lineWidth = rarity === "5" ? 5 : rarity === "4" ? 4 : 3;

  const borderGradient = ctx.createLinearGradient(x, y, x, y + height);

  if (rarity === "5") {
    borderGradient.addColorStop(0, "#FFD700");
    borderGradient.addColorStop(0.5, "#FFF9C4");
    borderGradient.addColorStop(1, "#FFA500");

    ctx.strokeStyle = borderGradient;
    roundRect(ctx, x, y, width, height, 15, false, true);

    const cornerSize = 25;

    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(x + (i % 2 === 0 ? 0 : width), y + (i < 2 ? 0 : height));

      ctx.rotate(Math.PI * 0.5 * i);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.arc(
        cornerSize,
        cornerSize / 2,
        cornerSize / 2,
        -Math.PI / 2,
        Math.PI / 2
      );
      ctx.lineTo(0, cornerSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cornerSize - 5, cornerSize / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();

      ctx.restore();
    }

    const auraGradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      height * 0.3,
      x + width / 2,
      y + height / 2,
      height * 0.6
    );

    auraGradient.addColorStop(0, "rgba(255, 215, 0, 0.15)");
    auraGradient.addColorStop(1, "rgba(255, 215, 0, 0)");

    ctx.fillStyle = auraGradient;
    ctx.fillRect(x - 20, y - 20, width + 40, height + 40);
  } else if (rarity === "4") {
    borderGradient.addColorStop(0, "#9b59b6");
    borderGradient.addColorStop(0.5, "#D6A8E8");
    borderGradient.addColorStop(1, "#8e44ad");

    ctx.strokeStyle = borderGradient;
    roundRect(ctx, x, y, width, height, 15, false, true);

    const cornerSize = 20;

    for (let i = 0; i < 4; i++) {
      const cornerX = x + (i % 2 === 0 ? 0 : width - cornerSize);
      const cornerY = y + (i < 2 ? 0 : height - cornerSize);

      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(cornerX, cornerY + cornerSize);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX + cornerSize, cornerY);
      } else if (i === 1) {
        ctx.moveTo(cornerX, cornerY);
        ctx.lineTo(cornerX + cornerSize, cornerY);
        ctx.lineTo(cornerX + cornerSize, cornerY + cornerSize);
      } else if (i === 2) {
        ctx.moveTo(cornerX, cornerY - cornerSize + height);
        ctx.lineTo(cornerX, cornerY + height);
        ctx.lineTo(cornerX + cornerSize, cornerY + height);
      } else {
        ctx.moveTo(cornerX + cornerSize, cornerY);
        ctx.lineTo(cornerX + cornerSize, cornerY + cornerSize);
        ctx.lineTo(cornerX, cornerY + cornerSize);
      }

      ctx.strokeStyle = "#9b59b6";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else {
    borderGradient.addColorStop(0, "#3498db");
    borderGradient.addColorStop(1, "#2980b9");

    ctx.strokeStyle = borderGradient;
    ctx.strokeStyle = borderGradient;
    roundRect(ctx, x, y, width, height, 15, false, true);

    const cornerSize = 15;

    for (let i = 0; i < 4; i++) {
      const cornerX = x + (i % 2 === 0 ? 0 : width - cornerSize);
      const cornerY = y + (i < 2 ? 0 : height - cornerSize);

      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(cornerX + cornerSize, cornerY);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX, cornerY + cornerSize);
      } else if (i === 1) {
        ctx.moveTo(cornerX - cornerSize + width, cornerY);
        ctx.lineTo(cornerX + width, cornerY);
        ctx.lineTo(cornerX + width, cornerY + cornerSize);
      } else if (i === 2) {
        ctx.moveTo(cornerX, cornerY - cornerSize + height);
        ctx.lineTo(cornerX, cornerY + height);
        ctx.lineTo(cornerX + cornerSize, cornerY + height);
      } else {
        ctx.moveTo(cornerX - cornerSize + width, cornerY + height);
        ctx.lineTo(cornerX + width, cornerY + height);
        ctx.lineTo(cornerX + width, cornerY - cornerSize + height);
      }

      ctx.strokeStyle = "#3498db";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const innerGlow = ctx.createLinearGradient(x, y, x, y + height);
  innerGlow.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.15)`);
  innerGlow.addColorStop(0.5, `rgba(255, 255, 255, 0.2)`);
  innerGlow.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.15)`);

  ctx.strokeStyle = innerGlow;
  ctx.lineWidth = rarity === "5" ? 3 : rarity === "4" ? 2 : 1;
  roundRect(ctx, x + 5, y + 5, width - 10, height - 10, 12, false, true);

  if (rarity === "5" || rarity === "4") {
    const shineWidth = rarity === "5" ? width / 3 : width / 4;

    const shineGradient = ctx.createLinearGradient(
      x - shineWidth / 2,
      y,
      x + shineWidth / 2,
      y + height
    );

    shineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    shineGradient.addColorStop(
      0.5,
      `rgba(255, 255, 255, ${rarity === "5" ? 0.4 : 0.2})`
    );
    shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = shineGradient;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();

  return { x, y, width, height };
}

async function createPullResultImage(options) {
  try {
    const {
      userId,
      userName = "Traveler",
      character,
      rarity = "3",
      stats = {
        element: "Unknown",
        weapon: "Unknown",
      },
      cardValue = 0,
    } = options;

    const cardWidth = 650;
    const cardHeight = 900;
    const width = cardWidth;
    const height = cardHeight;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const colors = rarityColors[rarity] || rarityColors["3"];

    const cardGradient = ctx.createLinearGradient(0, 0, width, height);
    cardGradient.addColorStop(0, `rgba(30, 30, 40, 0.95)`);
    cardGradient.addColorStop(0.5, `rgba(15, 15, 25, 0.98)`);
    cardGradient.addColorStop(1, `rgba(20, 20, 30, 0.95)`);

    ctx.fillStyle = cardGradient;
    roundRect(ctx, 0, 0, width, height, 20, true, false);

    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width / 4,
      width / 2,
      height / 2,
      width
    );
    glowGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.3)`);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    drawBackgroundPattern(ctx, width, height, rarity, colors);

    add3DEffect(ctx, 10, 10, width - 20, height - 20, 10);

    drawParticleEffects(ctx, width, height, rarity);

    const isPremium = character.isPremium && rarity === "5";

    drawCardFrame(ctx, rarity, 10, 10, width - 20, height - 20, isPremium);

    addHolographicEffect(ctx, 10, 10, width - 20, height - 20, rarity);

    const imageAreaX = 30;
    const imageAreaY = 60;
    const imageAreaWidth = width - 60;
    const imageAreaHeight = height * 0.55;

    drawEnhancedCharacterFrame(
      ctx,
      imageAreaX,
      imageAreaY,
      imageAreaWidth,
      imageAreaHeight,
      rarity,
      colors
    );

    if (character.image) {
      try {
        const charImage = await loadImage(character.image);
        ctx.save();

        // 1. Vẽ glow TRƯỚC khi clip và vẽ nhân vật
        const characterGlow = ctx.createRadialGradient(
          width / 2,
          imageAreaY + imageAreaHeight - 30,
          0,
          width / 2,
          imageAreaY + imageAreaHeight - 30,
          imageAreaWidth / 2
        );
        characterGlow.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.4)`);
        characterGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = characterGlow;
        ctx.beginPath();
        ctx.ellipse(
          width / 2,
          imageAreaY + imageAreaHeight - 30,
          imageAreaWidth / 2,
          50,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 2. Vẽ background của vùng nhân vật
        const imageBgGradient = ctx.createRadialGradient(
          imageAreaX + imageAreaWidth / 2,
          imageAreaY + imageAreaHeight / 2,
          0,
          imageAreaX + imageAreaWidth / 2,
          imageAreaY + imageAreaHeight / 2,
          imageAreaWidth / 2
        );
        imageBgGradient.addColorStop(0, `rgba(255, 255, 255, 0.15)`); // Giảm độ đậm
        imageBgGradient.addColorStop(
          0.7,
          `rgba(${hexToRgb(colors.primary)}, 0.08)`
        );
        imageBgGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

        ctx.beginPath();
        roundRect(
          ctx,
          imageAreaX,
          imageAreaY,
          imageAreaWidth,
          imageAreaHeight,
          15,
          true,
          false
        );
        ctx.fillStyle = imageBgGradient;
        ctx.fill();

        // 3. Clip vùng nhân vật
        ctx.beginPath();
        roundRect(
          ctx,
          imageAreaX,
          imageAreaY,
          imageAreaWidth,
          imageAreaHeight,
          15,
          true,
          false
        );
        ctx.clip();

        // 4. Đặt lại composite operation về "source-over" (mặc định)
        ctx.globalCompositeOperation = "source-over";

        // 5. Kích thước và vị trí nhân vật
        const scale =
          Math.max(
            imageAreaWidth / charImage.width,
            imageAreaHeight / charImage.height
          ) * 1.1;

        const scaledWidth = charImage.width * scale;
        const scaledHeight = charImage.height * scale;

        const imageX = imageAreaX + (imageAreaWidth - scaledWidth) / 2;
        const imageY = imageAreaY + (imageAreaHeight - scaledHeight) * 0.8;

        // 6. Tăng độ tương phản và độ sáng
        ctx.filter = "contrast(1.15) brightness(1.1)";

        // 7. Vẽ nhân vật
        ctx.drawImage(charImage, imageX, imageY, scaledWidth, scaledHeight);

        ctx.restore();
      } catch (error) {
        ctx.font = `bold 20px ${fontFamily}`;
        ctx.fillStyle = "#888888";
        ctx.textAlign = "center";
        ctx.fillText(
          "Character Image",
          imageAreaX + imageAreaWidth / 2,
          imageAreaY + imageAreaHeight / 2
        );
      }
    }

    const nameBannerY = imageAreaY + imageAreaHeight + 20;
    const nameBannerHeight = 70;

    ctx.save();

    if (rarity === "5") {
      const bannerWidth = width - 80;
      const bannerX = width / 2 - bannerWidth / 2;

      if (isPremium) {
        const luxuryGradient = ctx.createLinearGradient(
          0,
          nameBannerY,
          0,
          nameBannerY + nameBannerHeight
        );
        luxuryGradient.addColorStop(0, `rgba(50, 0, 60, 0.9)`);
        luxuryGradient.addColorStop(0.5, `rgba(80, 0, 90, 0.92)`);
        luxuryGradient.addColorStop(1, `rgba(50, 0, 60, 0.9)`);

        ctx.fillStyle = luxuryGradient;
        roundRect(
          ctx,
          bannerX,
          nameBannerY,
          bannerWidth,
          nameBannerHeight,
          15,
          true,
          false
        );

        const borderGradient = ctx.createLinearGradient(
          0,
          nameBannerY,
          0,
          nameBannerY + nameBannerHeight
        );
        borderGradient.addColorStop(0, "#FFD700");
        borderGradient.addColorStop(0.5, "#FFFFFF");
        borderGradient.addColorStop(1, "#FFD700");

        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8;
        roundRect(
          ctx,
          bannerX,
          nameBannerY,
          bannerWidth,
          nameBannerHeight,
          15,
          false,
          true
        );

        ctx.font = `bold 38px ${fontFamily}`;
        ctx.textAlign = "center";

        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        const textGradient = ctx.createLinearGradient(
          width / 2 - bannerWidth / 3,
          nameBannerY + 45,
          width / 2 + bannerWidth / 3,
          nameBannerY + 45
        );
        textGradient.addColorStop(0, "#FFFFFF");
        textGradient.addColorStop(0.5, "#FFD700");
        textGradient.addColorStop(1, "#FFFFFF");

        ctx.fillStyle = textGradient;
        ctx.fillText(
          character.name || "Unknown Character",
          width / 2,
          nameBannerY + 45
        );
        ctx.font = `italic 20px ${fontFamily}`;
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        const limitedTextGradient = ctx.createLinearGradient(
          width / 2 - bannerWidth / 4,
          nameBannerY + 70,
          width / 2 + bannerWidth / 4,
          nameBannerY + 70
        );
        limitedTextGradient.addColorStop(0, "#FF5500");
        limitedTextGradient.addColorStop(0.5, "#FFFFFF");
        limitedTextGradient.addColorStop(1, "#FF5500");

        ctx.fillStyle = limitedTextGradient;
        ctx.fillText(" LIMITED EDITION ", width / 2, nameBannerY + 60);
      } else {
        const luxuryGradient = ctx.createLinearGradient(
          0,
          nameBannerY,
          0,
          nameBannerY + nameBannerHeight
        );
        luxuryGradient.addColorStop(0, `rgba(100, 50, 0, 0.9)`);
        luxuryGradient.addColorStop(0.5, `rgba(120, 70, 0, 0.9)`);
        luxuryGradient.addColorStop(1, `rgba(100, 50, 0, 0.9)`);

        ctx.fillStyle = luxuryGradient;
        roundRect(
          ctx,
          bannerX,
          nameBannerY,
          bannerWidth,
          nameBannerHeight,
          15,
          true,
          false
        );

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;

        ctx.font = `bold 36px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = "#FFFFFF";
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(bannerX + 30, nameBannerY + 10);
      ctx.lineTo(bannerX + 30, nameBannerY + nameBannerHeight - 10);
      ctx.moveTo(bannerX + 40, nameBannerY + 15);
      ctx.lineTo(bannerX + 40, nameBannerY + nameBannerHeight - 15);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bannerX + bannerWidth - 30, nameBannerY + 10);
      ctx.lineTo(
        bannerX + bannerWidth - 30,
        nameBannerY + nameBannerHeight - 10
      );
      ctx.moveTo(bannerX + bannerWidth - 40, nameBannerY + 15);
      ctx.lineTo(
        bannerX + bannerWidth - 40,
        nameBannerY + nameBannerHeight - 15
      );
      ctx.stroke();

      const cornerSize = 15;
      [
        [bannerX + 10, nameBannerY + 10],
        [bannerX + bannerWidth - 10, nameBannerY + 10],
        [bannerX + 10, nameBannerY + nameBannerHeight - 10],
        [bannerX + bannerWidth - 10, nameBannerY + nameBannerHeight - 10],
      ].forEach((pos, i) => {
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(pos[0], pos[1] + cornerSize);
          ctx.lineTo(pos[0], pos[1]);
          ctx.lineTo(pos[0] + cornerSize, pos[1]);
        } else if (i === 1) {
          ctx.moveTo(pos[0], pos[1]);
          ctx.lineTo(pos[0] - cornerSize, pos[1]);
          ctx.lineTo(pos[0], pos[1] + cornerSize);
        } else if (i === 2) {
          ctx.moveTo(pos[0], pos[1]);
          ctx.lineTo(pos[0], pos[1] - cornerSize);
          ctx.lineTo(pos[0] + cornerSize, pos[1]);
        } else {
          ctx.moveTo(pos[0], pos[1]);
          ctx.lineTo(pos[0] - cornerSize, pos[1]);
          ctx.lineTo(pos[0], pos[1] - cornerSize);
        }
        ctx.stroke();
      });
    } else if (rarity === "4") {
      const bannerGradient = ctx.createLinearGradient(
        0,
        nameBannerY,
        width,
        nameBannerY + nameBannerHeight
      );
      bannerGradient.addColorStop(0, `rgba(138, 43, 226, 0.9)`);
      bannerGradient.addColorStop(0.5, `rgba(155, 89, 182, 0.9)`);
      bannerGradient.addColorStop(1, `rgba(142, 68, 173, 0.9)`);

      ctx.fillStyle = bannerGradient;
      roundRect(
        ctx,
        width / 2 - (width - 80) / 2,
        nameBannerY,
        width - 80,
        nameBannerHeight,
        15,
        true,
        false
      );

      const bannerX = width / 2 - (width - 80) / 2;
      const bannerWidth = width - 80;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;

      for (let i = 0; i < 3; i++) {
        const y = nameBannerY + 15 + i * 20;

        ctx.beginPath();
        ctx.moveTo(bannerX + 20, y);
        ctx.lineTo(bannerX + 30, y - 10);
        ctx.lineTo(bannerX + 40, y);
        ctx.lineTo(bannerX + 30, y + 10);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bannerX + bannerWidth - 20, y);
        ctx.lineTo(bannerX + bannerWidth - 30, y - 10);
        ctx.lineTo(bannerX + bannerWidth - 40, y);
        ctx.lineTo(bannerX + bannerWidth - 30, y + 10);
        ctx.closePath();
        ctx.stroke();
      }
    } else {
      const bannerGradient = ctx.createLinearGradient(
        0,
        nameBannerY,
        0,
        nameBannerY + nameBannerHeight
      );
      bannerGradient.addColorStop(0, `rgba(52, 152, 219, 0.9)`);
      bannerGradient.addColorStop(1, `rgba(41, 128, 185, 0.9)`);

      ctx.fillStyle = bannerGradient;
      roundRect(
        ctx,
        width / 2 - (width - 80) / 2,
        nameBannerY,
        width - 80,
        nameBannerHeight,
        15,
        true,
        false
      );

      const bannerX = width / 2 - (width - 80) / 2;
      const bannerWidth = width - 80;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(bannerX + 15, nameBannerY + 10);
      ctx.lineTo(bannerX + bannerWidth - 15, nameBannerY + 10);
      ctx.moveTo(bannerX + 15, nameBannerY + nameBannerHeight - 10);
      ctx.lineTo(
        bannerX + bannerWidth - 15,
        nameBannerY + nameBannerHeight - 10
      );
      ctx.stroke();
    }
    if (!isPremium) {
      ctx.font = `bold 34px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        character.name || "Unknown Character",
        width / 2,
        nameBannerY + 45
      );
    }
    const stars = "⭐".repeat(parseInt(rarity));
    ctx.font = "28px Arial";
    ctx.fillText(stars, width / 2, nameBannerY - 10);
    ctx.restore();

    ctx.save();
    const valueY = nameBannerY + nameBannerHeight + 25;
    const valueHeight = 50;

    const valueBgGradient = ctx.createLinearGradient(
      width / 2 - 150,
      valueY,
      width / 2 + 150,
      valueY
    );
    valueBgGradient.addColorStop(0, `rgba(${hexToRgb(colors.secondary)}, 0.3)`);
    valueBgGradient.addColorStop(0.5, `rgba(${hexToRgb(colors.primary)}, 0.5)`);
    valueBgGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.3)`);

    ctx.fillStyle = valueBgGradient;
    roundRect(ctx, width / 2 - 140, valueY, 280, valueHeight, 10, true, false);

    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, valueY + valueHeight / 2);
    ctx.lineTo(width / 2 - 100, valueY + valueHeight / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2 + 120, valueY + valueHeight / 2);
    ctx.lineTo(width / 2 + 100, valueY + valueHeight / 2);
    ctx.stroke();

    ctx.font = `bold 32px Arial`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    const formattedValue = options.cardValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    const valueGradient = ctx.createLinearGradient(
      width / 2 - 70,
      valueY + valueHeight / 2,
      width / 2 + 70,
      valueY + valueHeight / 2
    );
    valueGradient.addColorStop(0, "#FFD700");
    valueGradient.addColorStop(0.5, "#FFFFFF");
    valueGradient.addColorStop(1, "#FFD700");

    ctx.fillStyle = valueGradient;
    ctx.fillText(formattedValue, width / 2, valueY + valueHeight / 2 + 10);
    ctx.restore();

    const elementY = valueY + valueHeight + 35;

    const charStats = generateCharacterStats(rarity);

    const statY = valueY + valueHeight + 35;
    const statSpacing = 30;

    const elementIcons = {
      Pyro: "🔥",
      Hydro: "💧",
      Anemo: "💨",
      Electro: "⚡",
      Dendro: "🌿",
      Cryo: "❄️",
      Geo: "🪨",
      Unknown: "✨",
    };

    const weaponIcons = {
      Sword: "🗡️",
      Claymore: "⚔️",
      Polearm: "🔱",
      Bow: "🏹",
      Catalyst: "📖",
      Unknown: "🔮",
    };

    const elementIcon = elementIcons[stats.element] || elementIcons["Unknown"];
    const weaponIcon = weaponIcons[stats.weapon] || weaponIcons["Unknown"];

    ctx.font = `bold 24px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${elementIcon} ${stats.element}`, width / 2 - 100, elementY);
    ctx.fillText(`${weaponIcon} ${stats.weapon}`, width / 2 + 100, elementY);
    const statIcons = ["❤️", "⚔️", "🛡️"];
    const statLabels = ["HP", "ATK", "DEF"];
    const statValues = [charStats.hp, charStats.atk, charStats.def];
    const statColors = ["#ff5555", "#ffaa33", "#55aaff"];

    statValues.forEach((value, index) => {
      const y = statY + 15 + index * statSpacing;

      const barWidth = width - 100;
      const barHeight = 24;
      const barX = width / 2 - barWidth / 2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      roundRect(ctx, barX, y, barWidth, barHeight, barHeight / 2, true, false);

      const maxVal = index === 0 ? 5000 : index === 1 ? 600 : 500;
      const progress = Math.min((value / maxVal) * barWidth, barWidth);

      const barGradient = ctx.createLinearGradient(barX, y, barX + progress, y);
      barGradient.addColorStop(0, statColors[index]);
      barGradient.addColorStop(1, shadeColor(statColors[index], 0.7));

      ctx.fillStyle = barGradient;
      roundRect(ctx, barX, y, progress, barHeight, barHeight / 2, true, false);

      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `${statIcons[index]} ${statLabels[index]}`,
        barX + 10,
        y + barHeight / 2 + 6
      );

      ctx.textAlign = "right";
      let displayValue = value;
      ctx.fillText(displayValue, barX + barWidth - 10, y + barHeight / 2 + 6);
    });

    drawCardDecorations(ctx, 10, 10, width - 20, height - 20, colors);

    drawShimmer(ctx, 10, 10, width - 20, height - 20, rarity);

    if (rarity === "5") {
      const accentSize = 30;
      ctx.save();
      ctx.fillStyle = colors.primary;

      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(20 + accentSize, 20);
      ctx.lineTo(20, 20 + accentSize);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(width - 20, 20);
      ctx.lineTo(width - 20 - accentSize, 20);
      ctx.lineTo(width - 20, 20 + accentSize);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(20, height - 20);
      ctx.lineTo(20 + accentSize, height - 20);
      ctx.lineTo(20, height - 20 - accentSize);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(width - 20, height - 20);
      ctx.lineTo(width - 20 - accentSize, height - 20);
      ctx.lineTo(width - 20, height - 20 - accentSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (isPremium) {
      ctx.save();
      ctx.font = `bold 28px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FF5500";
      ctx.shadowBlur = 10;
      ctx.fillText("⭐ PREMIUM ⭐", width / 2, 40);
      ctx.restore();
    }

    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `gacha_${userId}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating gacha image:", error);
    throw error;
  }
}

function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * percent);
  G = parseInt(G * percent);
  B = parseInt(B * percent);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

function addHolographicEffect(ctx, x, y, width, height, rarity) {
  if (rarity < 4) return;

  ctx.save();

  const stripeCount = rarity === "5" ? 15 : 10;
  const stripeWidth = width / stripeCount;

  for (let i = 0; i < stripeCount * 2; i++) {
    const offset = (i / stripeCount) * width - width / 2;
    const gradient = ctx.createLinearGradient(
      x + offset,
      y,
      x + offset + stripeWidth,
      y + height
    );

    gradient.addColorStop(
      0,
      `rgba(255, 0, 128, ${rarity === "5" ? 0.15 : 0.1})`
    );
    gradient.addColorStop(
      0.2,
      `rgba(255, 140, 0, ${rarity === "5" ? 0.15 : 0.1})`
    );
    gradient.addColorStop(
      0.4,
      `rgba(255, 255, 0, ${rarity === "5" ? 0.15 : 0.1})`
    );
    gradient.addColorStop(
      0.6,
      `rgba(0, 255, 70, ${rarity === "5" ? 0.15 : 0.1})`
    );
    gradient.addColorStop(
      0.8,
      `rgba(0, 128, 255, ${rarity === "5" ? 0.15 : 0.1})`
    );
    gradient.addColorStop(
      1.0,
      `rgba(128, 0, 255, ${rarity === "5" ? 0.15 : 0.1})`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(x + offset, y, stripeWidth * 1.2, height);
  }

  ctx.restore();
}

function drawBackgroundPattern(ctx, width, height, rarity, colors) {
  ctx.save();

  const patternOpacity = rarity === "5" ? 0.12 : rarity === "4" ? 0.08 : 0.05;

  if (rarity === "5") {
    ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, ${patternOpacity})`;
    ctx.lineWidth = 2;

    const diamondSize = 40;
    for (let x = -diamondSize; x < width + diamondSize; x += diamondSize) {
      for (let y = -diamondSize; y < height + diamondSize; y += diamondSize) {
        ctx.beginPath();
        ctx.moveTo(x, y + diamondSize / 2);
        ctx.lineTo(x + diamondSize / 2, y);
        ctx.lineTo(x + diamondSize, y + diamondSize / 2);
        ctx.lineTo(x + diamondSize / 2, y + diamondSize);
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.fillStyle = `rgba(${hexToRgb(colors.secondary)}, 0.07)`;
    for (let i = 0; i < 15; i++) {
      const starX = Math.random() * width;
      const starY = Math.random() * height;
      const starSize = Math.random() * 20 + 10;

      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = starX + starSize * Math.cos(angle);
        const y = starY + starSize * Math.sin(angle);
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else if (rarity === "4") {
    const circleSpacing = 60;
    ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, ${patternOpacity})`;
    ctx.lineWidth = 1.5;

    for (let x = 0; x < width; x += circleSpacing) {
      for (let y = 0; y < height; y += circleSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else {
    ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, ${patternOpacity})`;
    ctx.lineWidth = 1;

    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function add3DEffect(ctx, x, y, width, height, depth = 8) {
  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.moveTo(x + width, y + depth);
  ctx.lineTo(x + width + depth, y + depth * 2);
  ctx.lineTo(x + width + depth, y + height + depth);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + depth, y + height);
  ctx.lineTo(x + depth, y + height + depth);
  ctx.lineTo(x + width + depth, y + height + depth);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawShimmer(ctx, x, y, width, height, rarity) {
  ctx.save();

  const shimmerWidth =
    rarity === "5" ? width * 0.4 : rarity === "4" ? width * 0.3 : width * 0.2;
  const shimmerOpacity = rarity === "5" ? 0.7 : rarity === "4" ? 0.5 : 0.3;

  const gradient = ctx.createLinearGradient(
    x - shimmerWidth,
    y - shimmerWidth,
    x + width + shimmerWidth,
    y + height + shimmerWidth
  );

  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.45, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${shimmerOpacity})`);
  gradient.addColorStop(0.55, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

  ctx.fillStyle = gradient;
  ctx.globalCompositeOperation = "overlay";
  roundRect(ctx, x, y, width, height, 15, true, false);

  ctx.restore();
}

module.exports = {
  createPullResultImage,
};
