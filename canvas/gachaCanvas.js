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
    const mastonFontPath = path.join(fontDir, "MRKMaston-Bold.ttf");

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

    if (fs.existsSync(mastonFontPath)) {
      registerFont(mastonFontPath, {
        family: "MastonPro",
        weight: "normal",
        style: "normal",
      });

      registerFont(mastonFontPath, {
        family: "MastonPro",
        weight: "bold",
        style: "normal",
      });
      console.log("✅ Đã đăng ký font MRK Maston Pro thành công!");
    } else {
      console.log("⚠️ Không tìm thấy font MRK Maston Pro!");
      console.log("ℹ️ Vui lòng đặt file font vào thư mục: " + fontDir);
    }

    console.log("✅ Đã đăng ký font Genshin Impact DRIP FONT thành công!");
    return true;
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký font:", error);
    return false;
  }
}


const starImages = {

  normal: {
    "3": "https://imgur.com/RdhkfIM.png",  // Blue star 3★
    "4": "https://imgur.com/0p8GU3y.png",  // Purple star 4★
    "5": "https://imgur.com/bXDqDjF.png",
    "premium": "https://imgur.com/7Niv8VX.png",  // Gold star 5★
  },
  
  evolved: {
    gold: "https://imgur.com/HwbiynM.png",        
    red: "https://imgur.com/jxD7wqP.png",         // Evolved red star for 5★
    premium: "https://imgur.com/Q7CcrVt.png"      // Premium evolved special star
  }
};
const mastonFontLoaded = fs.existsSync(path.join(fontDir, "MRKMaston-Bold.ttf"));
const mastonFontFamily = mastonFontLoaded ? "MastonPro" : "Arial";

async function drawStarFromImage(ctx, starX, starY, starSize, starType, rotationAngle = 0) {
  try {
    const image = await loadImage(starType);
    
    // Vẽ hiệu ứng ánh sáng xung quanh sao
    if (starType === starImages.evolved.premium || starType === starImages.evolved.red) {
      // Hiệu ứng glow cho sao tiến hóa
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glowSize = starSize * 0.8;
      const glowGradient = ctx.createRadialGradient(
        starX, starY, 0,
        starX, starY, glowSize
      );
      
      if (starType === starImages.evolved.premium) {
        glowGradient.addColorStop(0, "rgba(255, 165, 0, 0.3)");
        glowGradient.addColorStop(1, "rgba(255, 165, 0, 0)");
      } else {
        glowGradient.addColorStop(0, "rgba(255, 80, 80, 0.2)");
        glowGradient.addColorStop(1, "rgba(255, 80, 80, 0)");
      }
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(starX, starY, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Vẽ ngôi sao với hiệu ứng xoay theo góc truyền vào
    ctx.save();
    ctx.translate(starX, starY);
    ctx.rotate(rotationAngle); // Áp dụng góc xoay truyền vào
    
    ctx.drawImage(
      image, 
      -starSize, 
      -starSize, 
      starSize * 2, 
      starSize * 2
    );
    
    ctx.restore();
    
    // Phần code còn lại giữ nguyên
  } catch (error) {
    console.error("Error loading star image:", error);
    drawBeautifulStar(ctx, starX, starY, starSize, "#FFD700", "5");
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
async function createInventoryImage(options) {
  try {
    const {
      userId,
      userName = "Traveler",
      totalValue = 0,
      characters = [],
      stones = [],
      fragments = [],
      expItems = [],
      characterCounts = { 5: 0, 4: 0, 3: 0 },
      totalItems = 0
    } = options;

    // Canvas dimensions
    const cardWidth = 900;
    const headerHeight = 180;
    let totalHeight = headerHeight;

    // Calculate required height
    const sectionSpacing = 30;
    const itemHeight = 100;
    
    // Preprocess fragments and stones
    const processedStones = processEvoMaterials(stones, fragments);
    
    // Calculate section heights
    const stoneHeight = processedStones.length > 0 ? itemHeight * Math.ceil(processedStones.length / 5) + 50 : 0;
    const expItemHeight = expItems.length > 0 ? itemHeight * Math.ceil(expItems.length / 5) + 50 : 0;
    const char5Height = characterCounts[5] > 0 ? itemHeight * Math.ceil(characterCounts[5] / 5) + 50 : 0;
    const char4Height = characterCounts[4] > 0 ? itemHeight * Math.ceil(characterCounts[4] / 5) + 50 : 0;
    const char3Height = characterCounts[3] > 0 ? itemHeight * Math.ceil(characterCounts[3] / 5) + 50 : 0;

    // Add heights of all sections that have items
    if (processedStones.length > 0) totalHeight += stoneHeight + sectionSpacing;
    if (expItems.length > 0) totalHeight += expItemHeight + sectionSpacing;
    if (characterCounts[5] > 0) totalHeight += char5Height + sectionSpacing;
    if (characterCounts[4] > 0) totalHeight += char4Height + sectionSpacing;
    if (characterCounts[3] > 0) totalHeight += char3Height + sectionSpacing;
    
    // Ensure minimum height
    totalHeight = Math.max(totalHeight, 400);

    // Create canvas
    const canvas = createCanvas(cardWidth, totalHeight);
    const ctx = canvas.getContext("2d");

    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, totalHeight);
    bgGradient.addColorStop(0, "#1E1E28");
    bgGradient.addColorStop(1, "#12121E");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cardWidth, totalHeight);

    // Add subtle pattern to background
    drawBackgroundPattern(ctx, cardWidth, totalHeight, "4", { primary: "#333355", secondary: "#222233" });

    // Header section
    drawInventoryHeader(ctx, 0, 0, cardWidth, headerHeight, userName, totalValue, totalItems);

    // Keep track of Y position as we draw sections
    let currentY = headerHeight + 20;

    // Draw evolution materials section (stones + fragments)
    if (processedStones.length > 0) {
      currentY = drawInventorySection(ctx, 
        "💎 EVOLUTION MATERIALS", 
        processedStones, 
        0, currentY, cardWidth, stoneHeight, 
        "#FFD700", "#FFA500");
      currentY += sectionSpacing;
    }

    // Draw EXP items section
    if (expItems.length > 0) {
      currentY = drawInventorySection(ctx, 
        "📚 EXPERIENCE ITEMS", 
        expItems, 
        0, currentY, cardWidth, expItemHeight, 
        "#50C878", "#2E8B57");
      currentY += sectionSpacing;
    }

    // Draw character sections
    if (characterCounts[5] > 0) {
      const fiveStarChars = characters.filter(char => char.rarity === 5);
      currentY = drawInventorySection(ctx, 
        "⭐⭐⭐⭐⭐ CHARACTERS", 
        fiveStarChars, 
        0, currentY, cardWidth, char5Height, 
        "#FFD700", "#FF8C00");
      currentY += sectionSpacing;
    }

    if (characterCounts[4] > 0) {
      const fourStarChars = characters.filter(char => char.rarity === 4);
      currentY = drawInventorySection(ctx, 
        "⭐⭐⭐⭐ CHARACTERS", 
        fourStarChars, 
        0, currentY, cardWidth, char4Height, 
        "#9b59b6", "#8e44ad");
      currentY += sectionSpacing;
    }

    if (characterCounts[3] > 0) {
      const threeStarChars = characters.filter(char => char.rarity === 3);
      currentY = drawInventorySection(ctx, 
        "⭐⭐⭐ CHARACTERS", 
        threeStarChars, 
        0, currentY, cardWidth, char3Height, 
        "#3498db", "#2980b9");
    }

    // Add decoration elements to the canvas
    addDecorativeElements(ctx, cardWidth, totalHeight);

    // Save the image
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `inventory_${userId}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating inventory image:", error);
    throw error;
  }
}

function drawInventoryHeader(ctx, x, y, width, height, userName, totalValue, totalItems) {
  ctx.save();

  // Background with gradient
  const headerGradient = ctx.createLinearGradient(x, y, x, y + height);
  headerGradient.addColorStop(0, "rgba(50, 50, 70, 0.9)");
  headerGradient.addColorStop(1, "rgba(30, 30, 50, 0.9)");
  
  ctx.fillStyle = headerGradient;
  roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 15, true, false);
  
  // Add border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
  ctx.shadowBlur = 10;
  roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 15, false, true);
  
  // Decorative corner elements
  drawCornerDecoration(ctx, x + 15, y + 15, 0, "#FFD700", "5");
  drawCornerDecoration(ctx, x + width - 15, y + 15, 90, "#FFD700", "5");
  drawCornerDecoration(ctx, x + 15, y + height - 15, 270, "#FFD700", "5");
  drawCornerDecoration(ctx, x + width - 15, y + height - 15, 180, "#FFD700", "5");
  
  // Title and info
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  
  // Main title
  ctx.font = `bold 48px ${fontFamily}`;
  ctx.fillText("GENSHIN INVENTORY", width / 2, y + 60);
  
  // Player name
  ctx.font = `bold 28px Arial`;
  ctx.fillText(userName, width / 2, y + 100);
  
  // Value and item count
  const formattedValue = totalValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  
  ctx.font = `22px ${mastonFontFamily}`; // Changed from Arial to MastonPro
  ctx.fillText(`Total Value: ${formattedValue} • Total Items: ${totalItems}`, width / 2, y + 140);
  
  for (let i = 0; i < 15; i++) {
    const sparkX = x + Math.random() * width;
    const sparkY = y + Math.random() * height;
    const size = Math.random() * 3 + 1;
    
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawInventorySection(ctx, title, items, x, y, width, height, color1, color2) {
  ctx.save();
  
  const sectionGradient = ctx.createLinearGradient(x, y, x, y + height);
  sectionGradient.addColorStop(0, "rgba(20, 20, 35, 0.85)");
  sectionGradient.addColorStop(1, "rgba(10, 10, 25, 0.85)");
  
  ctx.fillStyle = sectionGradient;
  roundRect(ctx, x + 15, y, width - 30, height, 12, true, false);
  
  const titleGradient = ctx.createLinearGradient(x, y, x + width, y);
  titleGradient.addColorStop(0, color1);
  titleGradient.addColorStop(0.5, color2);
  titleGradient.addColorStop(1, color1);
  
  ctx.fillStyle = titleGradient;
  roundRect(ctx, x + 25, y - 15, width - 50, 40, 20, true, false);
  
  // Section title text
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 5;
  ctx.font = `bold 22px ${fontFamily}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(title, x + width / 2, y + 15);
  
  // Draw items in a grid
  const itemsPerRow = 5;
  const itemWidth = (width - 60) / itemsPerRow;
  const itemHeight = 85;
  const itemPadding = 10;
  
  items.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    
    const itemX = x + 30 + col * itemWidth;
    const itemY = y + 40 + row * (itemHeight + itemPadding);
    
    drawInventoryItem(ctx, item, itemX, itemY, itemWidth - 10, itemHeight);
  });
  
  ctx.restore();
  
  // Return the Y position after this section
  return y + height;
}

function drawEnhancedPremiumCorner(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  let startX = 0, startY = 0;
  
  if (rotation === Math.PI/2) { // Góc trên phải
    startX = -size;
  } else if (rotation === Math.PI) { // Góc dưới phải
    startX = -size;
    startY = -size;
  } else if (rotation === Math.PI*1.5) { // Góc dưới trái
    startY = -size;
  }
  const gradient = ctx.createLinearGradient(startX, startY, startX + size, startY + size);
  gradient.addColorStop(0, '#FFE700');
  gradient.addColorStop(0.3, '#FFFFFF');
  gradient.addColorStop(0.6, '#FFD700');
  gradient.addColorStop(1, '#FF5500');

  ctx.fillStyle = gradient;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + size, startY);
  ctx.lineTo(startX + size, startY + size/3);
  ctx.bezierCurveTo(
    startX + size*0.9, startY + size*0.4,
    startX + size*0.6, startY + size*0.5,
    startX + size*0.8, startY + size*0.8
  );
  ctx.lineTo(startX + size*0.7, startY + size);
  ctx.lineTo(startX, startY + size);
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

function addDecorativeElements(ctx, width, height) {
  ctx.save();
  
  // Add corner glow effect
  const cornerGlow = ctx.createRadialGradient(
    width/2, height/2, width/4,
    width/2, height/2, width
  );
  cornerGlow.addColorStop(0, "rgba(255, 255, 255, 0)");
  cornerGlow.addColorStop(0.7, "rgba(255, 255, 255, 0.03)");
  cornerGlow.addColorStop(1, "rgba(255, 255, 255, 0.06)");
  
  ctx.fillStyle = cornerGlow;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillRect(0, 0, width, height);
  
  // Add sparkle effects
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    const opacity = Math.random() * 0.3 + 0.1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }
  
  // Add decorative footer line
  const footerY = height - 40;
  ctx.beginPath();
  ctx.moveTo(width/4, footerY);
  ctx.lineTo(width/4 * 3, footerY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Add watermark text
  ctx.font = `italic 14px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillText("Genshin Inventory System", width/2, height - 15);
  
  // Add soft star background effects
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const starSize = Math.random() * 6 + 2;
    
    drawSimpleStar(ctx, x, y, starSize, "rgba(255, 215, 0, 0.2)");
  }
  
  ctx.restore();
}
async function drawPremiumEvolvedStar(ctx, x, y, size, starImage, rotationAngle) {
  try {
    const image = await loadImage(starImage);
    
    // Thêm hiệu ứng ánh sáng xung quanh sao
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glowSize = size * 0.9; // Tăng kích thước glow
    const glowGradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, glowSize
    );
    
    // Tạo hiệu ứng glow màu cam đậm hơn
    glowGradient.addColorStop(0, "rgba(255, 165, 0, 0.4)"); // Tăng độ đậm
    glowGradient.addColorStop(1, "rgba(255, 165, 0, 0)");
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Xoay ngôi sao theo góc đã tính
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotationAngle); // Áp dụng góc xoay đã truyền vào
    
    // Vẽ ngôi sao với hiệu ứng xoay
    ctx.drawImage(
      image, 
      -size, 
      -size, 
      size * 2, 
      size * 2
    );
    
    // Thêm hiệu ứng ánh sáng ở giữa sao để tăng độ nổi bật
    ctx.globalCompositeOperation = "lighter";
    const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
    centerGlow.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Thêm hiệu ứng tia sáng phóng ra từ sao
    const rayCount = 4;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLength = size * 0.9;
      
      // Vẽ tia sáng
      const rayGradient = ctx.createLinearGradient(
        0, 0,
        Math.cos(angle) * rayLength,
        Math.sin(angle) * rayLength
      );
      rayGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      rayGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
      
      ctx.strokeStyle = rayGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
      ctx.stroke();
    }
    
    ctx.restore();
    
  } catch (error) {
    console.error("Error drawing premium evolved star:", error);
    // Fallback nếu có lỗi
    await drawStarFromImage(ctx, x, y, size, starImage, 0);
  }
}
// Thêm hàm phụ trợ để vẽ ngôi sao đơn giản
function drawSimpleStar(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    
    if (i === 0) {
      ctx.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
    } else {
      ctx.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    }
  }
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.restore();
}
async function createExpItemResultImage(options) {
  try {
    const {
      userId,
      userName = "Traveler",
      expItem,
      expValue = 0,
      description = "",
      itemRarity = "3",
      itemValue = 0
    } = options;
    
    // Canvas dimensions
    const cardWidth = 500;
    const cardHeight = 700;
    const canvas = createCanvas(cardWidth, cardHeight);
    const ctx = canvas.getContext("2d");
    
    // Define colors based on rarity
    const rarityColors = {
      "4": { primary: "#9b59b6", secondary: "#8e44ad", gradient: ["#9b59b6", "#8e44ad"] },
      "3": { primary: "#3498db", secondary: "#2980b9", gradient: ["#3498db", "#2980b9"] },
      "2": { primary: "#2ecc71", secondary: "#27ae60", gradient: ["#2ecc71", "#27ae60"] }
    };
    
    const colors = rarityColors[itemRarity] || rarityColors["2"];
    
    // Draw background
    const cardGradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    cardGradient.addColorStop(0, `rgba(30, 30, 40, 0.95)`);
    cardGradient.addColorStop(0.5, `rgba(15, 15, 25, 0.98)`);
    cardGradient.addColorStop(1, `rgba(20, 20, 30, 0.95)`);
    
    ctx.fillStyle = cardGradient;
    roundRect(ctx, 0, 0, cardWidth, cardHeight, 20, true, false);
    
    // Add glow effect
    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      cardWidth / 2, cardHeight / 2, cardWidth / 4,
      cardWidth / 2, cardHeight / 2, cardWidth
    );
    glowGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.3)`);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    ctx.restore();
    
    // Background pattern
    drawBackgroundPattern(ctx, cardWidth, cardHeight, itemRarity, colors);
    
    // Draw card frame
    drawCardFrame(ctx, itemRarity, 10, 10, cardWidth - 20, cardHeight - 20, false);
    
    // Image area for EXP item
    const imageAreaX = 50;
    const imageAreaY = 80;
    const imageAreaWidth = cardWidth - 100;
    const imageAreaHeight = cardWidth - 100;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15, true, false);
    
    // Draw EXP item image
    if (expItem.image) {
      try {
        const itemImage = await loadImage(expItem.image);
        
        // Add a shine effect before drawing the image
        ctx.save();
        const shineGradient = ctx.createRadialGradient(
          cardWidth / 2, imageAreaY + imageAreaHeight / 2, 10,
          cardWidth / 2, imageAreaY + imageAreaHeight / 2, imageAreaWidth / 1.8
        );
        shineGradient.addColorStop(0, `rgba(255, 255, 255, 0.4)`);
        shineGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.1)`);
        shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = shineGradient;
        ctx.globalCompositeOperation = "screen";
        ctx.fillRect(imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight);
        ctx.restore();
        
        // Draw the item image with padding
        const imgPadding = 40;
        ctx.drawImage(
          itemImage,
          imageAreaX + imgPadding,
          imageAreaY + imgPadding,
          imageAreaWidth - (imgPadding * 2),
          imageAreaHeight - (imgPadding * 2)
        );
        
        // Draw sparkles around the image
        drawExpItemSparkles(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, itemRarity);
        
      } catch (error) {
        console.error("Error loading EXP item image:", error);
        // Fallback if image fails to load
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("EXP", cardWidth / 2, imageAreaY + imageAreaHeight / 2);
      }
    }
    
    // Draw item name banner
    const nameBannerY = imageAreaY + imageAreaHeight + 30;
    const nameBannerHeight = 50;
    
    const nameBannerGradient = ctx.createLinearGradient(0, nameBannerY, 0, nameBannerY + nameBannerHeight);
    nameBannerGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.8)`);
    nameBannerGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.8)`);
    
    ctx.fillStyle = nameBannerGradient;
    roundRect(ctx, 30, nameBannerY, cardWidth - 60, nameBannerHeight, 15, true, false);
    
    // Add outline to the banner
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 8;
    roundRect(ctx, 30, nameBannerY, cardWidth - 60, nameBannerHeight, 15, false, true);
    
    // Draw item name with smaller font size (changed from 32px to 28px)
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 5;
    ctx.fillText(expItem.name, cardWidth / 2, nameBannerY + nameBannerHeight / 2 + 10);
    
    // Draw description area - moved up by 10px
    const descriptionY = nameBannerY + nameBannerHeight + 20; // Changed from +30 to +20
    const descriptionHeight = 100;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    roundRect(ctx, 30, descriptionY, cardWidth - 60, descriptionHeight, 15, true, false);
    
    // Draw description text with word wrap - increased starting position by 5px
    ctx.font = `18px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    
    const maxWidth = cardWidth - 100;
    const words = description.split(' ');
    let line = '';
    let y = descriptionY + 35; // Changed from +40 to +35
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, cardWidth / 2, y);
        line = word + ' ';
        y += 28; // Changed from 30 to 28 for tighter spacing
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cardWidth / 2, y);
    
    // Draw EXP value area
    const expValueY = descriptionY + descriptionHeight + 30;
    const expValueHeight = 60;
    
    const expGradient = ctx.createLinearGradient(0, expValueY, 0, expValueY + expValueHeight);
    expGradient.addColorStop(0, "rgba(255, 223, 0, 0.8)");
    expGradient.addColorStop(1, "rgba(255, 165, 0, 0.8)");
    
    ctx.fillStyle = expGradient;
    roundRect(ctx, cardWidth/2 - 120, expValueY, 240, expValueHeight, 15, true, false);
    
    // Add shine effect to EXP area
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    const expShineGradient = ctx.createLinearGradient(
      cardWidth/2 - 120, expValueY, 
      cardWidth/2 + 120, expValueY
    );
    expShineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    expShineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    expShineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = expShineGradient;
    roundRect(ctx, cardWidth/2 - 120, expValueY, 240, expValueHeight, 15, true, false);
    ctx.restore();
    
    // Draw EXP value text
    ctx.font = `bold 28px ${mastonFontFamily}`; // Changed from Arial to MastonPro
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 8;
    ctx.fillText(`+${expValue.toLocaleString()} EXP`, cardWidth/2, expValueY + expValueHeight/2 + 10);
    
    // Draw item value
    ctx.font = "22px Arial";
    ctx.fillText(`Value: $${itemValue.toLocaleString()}`, cardWidth/2, expValueY + expValueHeight + 40);
    
    // Draw rarity stars
    const starSize = 18;
    const starSpacing = 25;
    const starsTotalWidth = starSpacing * parseInt(itemRarity);
    const starsStartX = cardWidth/2 - (starsTotalWidth/2) + starSpacing/2;
    const starsY = expValueY + expValueHeight + 80;
    
    for (let i = 0; i < parseInt(itemRarity); i++) {
      const starX = starsStartX + i * starSpacing;
      drawStar(ctx, starX, starsY, starSize, colors.primary);
    }
    
    // Add shimmer effect to the card
    drawShimmer(ctx, 10, 10, cardWidth - 20, cardHeight - 20, itemRarity);
    
    // Save image
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `exp_item_${userId}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error("Error creating EXP item image:", error);
    throw error;
  }
}

// Helper function to draw sparkles around EXP item
function drawExpItemSparkles(ctx, x, y, width, height, rarity) {
  ctx.save();
  
  const sparkleCount = parseInt(rarity) * 4;
  const centerX = x + width/2;
  const centerY = y + height/2;
  
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (i / sparkleCount) * Math.PI * 2;
    const distance = Math.min(width, height) * 0.4;
    
    const sparkleX = centerX + Math.cos(angle) * distance;
    const sparkleY = centerY + Math.sin(angle) * distance;
    const sparkleSize = 3 + Math.random() * 5;
    
    // Sparkle color based on rarity
    let sparkleColor;
    if (rarity === "4") sparkleColor = "#9b59b6";
    else if (rarity === "3") sparkleColor = "#3498db";
    else sparkleColor = "#2ecc71";
    
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
    ctx.fillStyle = sparkleColor;
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = sparkleColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize/2, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  }
  
  ctx.restore();
}
const ELEMENT_ICONS = {
  Pyro: "🔥",
  Hydro: "💧",
  Anemo: "💨",
  Electro: "⚡",
  Dendro: "🌿",
  Cryo: "❄️",
  Geo: "🪨",
  Unknown: "✨"
};
function drawInventoryItem(ctx, item, x, y, width, height) {
  ctx.save();
  
  let itemColor, itemBorderColor, displayName, itemValue;
  let itemGradient;
  
  // Item type styling (unchanged)
  if (item.type === "stone") {
    itemColor = "rgba(72, 61, 139, 0.6)";
    itemBorderColor = "#FFD700";
    displayName = item.name || "Evolution Stone";
    itemValue = item.value || 25000;
  } 
  else if (item.type === "fragment" || item.isFragmentGroup) {
    itemColor = "rgba(70, 130, 180, 0.6)";
    itemBorderColor = "#87CEFA";
    displayName = (item.name || "Stone Fragment").replace(" Fragment", "");
    itemValue = item.value || 2500;
  }
  else if (item.type === "exp") {
    itemColor = "rgba(60, 179, 113, 0.7)";
    itemBorderColor = "#50C878";
    displayName = item.name || "EXP Item";
    itemValue = item.value || 2000;
  }
  else {
    // Character styling based on rarity (unchanged)
    let rarityColor;
    switch(item.rarity) {
      case 5:
        if (item.isPremium) {
          itemColor = "rgba(80, 0, 80, 0.7)";
          rarityColor = "#FF5500";
          
          const borderGradient = ctx.createLinearGradient(x, y, x + width, y + height);
          borderGradient.addColorStop(0, "#FFE700");
          borderGradient.addColorStop(0.5, "#FF5500");
          borderGradient.addColorStop(1, "#FFD700");
          itemBorderColor = borderGradient;
        } else {
          rarityColor = "#FFD700";
          itemColor = "rgba(128, 0, 0, 0.6)";
          itemBorderColor = rarityColor;
        }
        break;
      case 4:
        rarityColor = "#9b59b6";
        itemColor = "rgba(75, 0, 130, 0.6)";
        itemBorderColor = rarityColor;
        break;
      default:
        rarityColor = "#3498db";
        itemColor = "rgba(0, 0, 128, 0.6)";
        itemBorderColor = rarityColor;
    }
    
    displayName = item.name || "Character";
    itemValue = item.value || 1000;
  }

  // Draw item background
  if (item.type === "exp") {
    itemGradient = ctx.createLinearGradient(x, y, x, y + height);
    itemGradient.addColorStop(0, "rgba(60, 179, 113, 0.7)");
    itemGradient.addColorStop(1, "rgba(20, 80, 40, 0.7)");
  } else {
    itemGradient = ctx.createLinearGradient(x, y, x, y + height);
    itemGradient.addColorStop(0, itemColor);
    itemGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  }
  
  ctx.fillStyle = itemGradient;
  roundRect(ctx, x, y, width, height, 8, true, false);

  // Fragment progress bar (enhanced and kept)
  if (item.isFragmentGroup && item.count) {
    const progressBarHeight = 12; // Increased height for more prominence
    const progressBarY = y + height - progressBarHeight - 4;
    const progressBarWidth = width - 20;
    
    // Background bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRect(ctx, x + 10, progressBarY, progressBarWidth, progressBarHeight, 3, true, false);
    
    // Progress fill
    const fillWidth = Math.min(1, item.count / 10) * progressBarWidth;
    const progressGradient = ctx.createLinearGradient(x + 10, 0, x + 10 + progressBarWidth, 0);
    progressGradient.addColorStop(0, "#87CEFA");
    progressGradient.addColorStop(1, "#1E90FF");
    
    ctx.fillStyle = progressGradient;
    if (fillWidth > 0) {
      roundRect(ctx, x + 10, progressBarY, fillWidth, progressBarHeight, 3, true, false);
    }
    
    ctx.font = `bold 14px ${mastonFontFamily}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 3;
    ctx.fillText(`${item.count}/10`, x + width/2, progressBarY - 2);
  }

  ctx.strokeStyle = itemBorderColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = itemBorderColor;
  ctx.shadowBlur = 5;
  roundRect(ctx, x, y, width, height, 8, false, true);

  ctx.shadowColor = "black";
  ctx.shadowBlur = 3;
  ctx.font = "20px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  
  if (item.type === "character") {
    const rawElement = item.element || "Unknown";
    const element = rawElement.charAt(0).toUpperCase() + rawElement.slice(1).toLowerCase();
    
    const elementIcon = ELEMENT_ICONS[element] || ELEMENT_ICONS.Unknown;
    
    ctx.save();
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = getElementColor(element);
    ctx.shadowBlur = 5; 
    ctx.fillText(elementIcon, x + 15, y + 20);
    ctx.restore();

    item._elementIconPos = { x: x + 8, y: y + 5, size: 20 };
  }else if (item.type === "exp") {
    ctx.fillText("📚", x + 8, y + 25);
  } 

  // else if (item.type === "fragment" || item.isFragmentGroup) {
  //   ctx.fillText("🧩", x + 8, y + 25);
  // } 
  else if (item.type === "stone") {

  }

  if (item.type === "character" || item.type === "stone" || item.type === "fragment" || item.isFragmentGroup) {
    ctx.font = `14px ${fontFamily}`;
    ctx.shadowColor = itemBorderColor;
  } else {
    ctx.font = "14px Arial";
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  
  let showName = displayName;
  if (ctx.measureText(showName).width > width - 20) {
    while (ctx.measureText(showName + "...").width > width - 20 && showName.length > 3) {
      showName = showName.substring(0, showName.length - 1);
    }
    showName += "...";
  }
  ctx.fillText(showName, x + width/2, y + 32);

  const formattedValue = itemValue.toLocaleString();
  ctx.font = `13px ${mastonFontFamily}`;
  ctx.fillStyle = "#FFFFAA";
  ctx.fillText(`$${formattedValue}`, x + width/2, y + 48);

  if (item.type === "character" && item.stats) {
    const stats = item.stats;
    const statIcons = ["❤️", "⚔️", "🛡️"];
    const statValues = [stats.hp, stats.atk, stats.def];
    
    ctx.save();
    ctx.font = "11px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    
    const statsSpacing = width / 3;
    statValues.forEach((value, index) => {
      const statX = x + (statsSpacing * index) + (statsSpacing/2);
      ctx.fillText(statIcons[index], statX, y + 65);
      ctx.font = `10px ${mastonFontFamily}`;
      ctx.fillStyle = "#FFFFAA";
      ctx.fillText(value.toString(), statX, y + 77);
    });
    ctx.restore();
  }

  if (item.type === "exp") {
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFF99";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 3;
    ctx.fillText("EXP ITEM", x + width/2, y + 14);
    ctx.font = `bold 11px ${mastonFontFamily}`;
    ctx.fillText(`+${item.expValue || 0} EXP`, x + width/2, y + height - 6);
  } else if (item.type === "character" && item.isPremium && item.rarity === 5) {
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FF5500";
    ctx.shadowBlur = 3;
    ctx.fillText("LIMITED", x + width/2, y + 14);
  } else if (item.isCombined) {
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#AAFFAA";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 3;
    ctx.fillText("AUTO-COMBINED", x + width/2, y + 14);
  }

  if (item.id && !(item.type === "fragment" || item.isFragmentGroup)) {
    ctx.save();
    
    let idX = x + width - 45;
    let idY = y + 5; 
    
    if (item.type === "stone") {
      idY = y + height - 25; 
    }
    
    // ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    // roundRect(ctx, idX, idY, 40, 20, 5, true, false);
    
    // if (item.type === "character" && item.rarity === 5) {
    //   ctx.strokeStyle = item.isPremium ? "#FF5500" : "#FFD700";
    //   ctx.lineWidth = 2;
    // } else {
    //   ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    //   ctx.lineWidth = 1;
    // }
    // roundRect(ctx, idX, idY, 40, 20, 5, false, true);
    
    ctx.font = `bold 13px ${mastonFontFamily}`;
    
    if (item.type === "character" && item.rarity === 5) {
      ctx.fillStyle = item.isPremium ? "#FF5500" : "#FFD700";
    } else if (item.type === "character" && item.rarity === 4) {
      ctx.fillStyle = "#9b59b6"; // Tím cho 4 sao
    } else {
      ctx.fillStyle = "#FFFFFF"; 
    }
    
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    const displayId = typeof item.id === 'string' ? item.id.slice(-4) : item.id;
    ctx.fillText(`#${displayId}`, idX + 20, idY + 14);
    ctx.restore();
    
    if (item.type === "stone") {
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      const elementIcon = item.emoji || "💎";
      const elementBgX = idX - 30;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.arc(elementBgX + 10, idY + 10, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 2;
      ctx.fillText(elementIcon, elementBgX + 10, idY + 15);
    }
  }
  if ((item.count && item.count > 1) && !item.isFragmentGroup && !(item.type === "fragment")) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.arc(x + width - 10, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
  
    ctx.font = `bold 12px ${mastonFontFamily}`; 
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`x${item.count}`, x + width - 10, y + 14);
    ctx.restore();
  }

  ctx.restore();
}
function extractStoneTypeFromId(id) {
  if (typeof id !== 'string') return "UNKNOWN";
  const match = id.match(/FRAGMENT_([A-Z]+)_/);
  return match ? match[1] : "UNKNOWN";
}
function processEvoMaterials(stones, fragments) {
  // Create a map to group fragments by their stoneType
  const fragmentMap = {};
  fragments.forEach(fragment => {
    const stoneType = fragment.stoneType || extractStoneTypeFromId(fragment.id);
    if (!fragmentMap[stoneType]) {
      fragmentMap[stoneType] = {
        ...fragment,
        count: 1,
        isFragmentGroup: true
      };
    } else {
      fragmentMap[stoneType].count++;
    }
  });

  // Check if any fragment group has 10+ fragments and should be auto-combined
  Object.keys(fragmentMap).forEach(stoneType => {
    const fragmentGroup = fragmentMap[stoneType];
    if (fragmentGroup.count >= 10) {
      // Create a new stone equivalent for every 10 fragments
      const fullStoneCount = Math.floor(fragmentGroup.count / 10);
      const remainingFragments = fragmentGroup.count % 10;
      
      // Add full stones
      for (let i = 0; i < fullStoneCount; i++) {
        stones.push({
          ...fragmentGroup,
          isFragment: false,
          isCombined: true,
          type: "stone",
          count: 1
        });
      }
      
      // Update fragment count
      if (remainingFragments > 0) {
        fragmentGroup.count = remainingFragments;
      } else {
        delete fragmentMap[stoneType];
      }
    }
  });

  // Convert fragment map back to array
  const fragmentGroups = Object.values(fragmentMap);

  // Combine stones and remaining fragments
  const combinedItems = [...stones];
  fragmentGroups.forEach(fragmentGroup => {
    combinedItems.push(fragmentGroup);
  });

  // Sort by element type
  return combinedItems.sort((a, b) => {
    // Universal stones first
    if (a.stoneType === "UNIVERSAL") return -1;
    if (b.stoneType === "UNIVERSAL") return 1;
    // Then by element alphabetically
    return (a.stoneType || "").localeCompare(b.stoneType || "");
  });
}

async function createStoneResultImage(options) {
  try {
    const {
      userId,
      userName,
      stone,
      stoneRarity = 4,
      isFragment = false 
      
    } = options;
    
    if (!stone) {
      throw new Error("Stone object is undefined");
    }
    
    const rarity = stoneRarity;
    
    const stoneType = stone.stoneType;
    const stoneName = stone.name;
    const element = stone.element;
    const description = stone.description || "Đá tiến hóa quý hiếm";
    const emoji = stone.emoji || "💎";
    const stoneImage = stone.image;
    const stoneValue = stone.value || 25000;
    
    const cardWidth = 500;
    const cardHeight = 700;
    const canvas = createCanvas(cardWidth, cardHeight);
    const ctx = canvas.getContext("2d");
    
    const elementColors = {
      Pyro: { primary: "#FF5733", secondary: "#FF9966" },
      Hydro: { primary: "#0099FF", secondary: "#33CCFF" },
      Electro: { primary: "#9933FF", secondary: "#CC66FF" },
      Cryo: { primary: "#99FFFF", secondary: "#CCFFFF" },
      Dendro: { primary: "#99FF66", secondary: "#CCFF99" },
      Geo: { primary: "#FFCC33", secondary: "#FFD966" },
      Anemo: { primary: "#66FFCC", secondary: "#99FFDD" },
      Universal: { primary: "#FFFFFF", secondary: "#DDDDDD" }
    };
    const colors = elementColors[element] || elementColors.Universal;

    drawStoneCardFrame(ctx, rarity, 10, 10, cardWidth - 20, cardHeight - 20, element, colors);
    
    const cardGradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    cardGradient.addColorStop(0, `rgba(30, 30, 40, 0.95)`);
    cardGradient.addColorStop(0.5, `rgba(15, 15, 25, 0.98)`);
    cardGradient.addColorStop(1, `rgba(20, 20, 30, 0.95)`);
    
    ctx.fillStyle = cardGradient;
    roundRect(ctx, 0, 0, cardWidth, cardHeight, 20, true, false);
    
    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      cardWidth / 2, cardHeight / 2, cardWidth / 4,
      cardWidth / 2, cardHeight / 2, cardWidth
    );
    glowGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.4)`);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    ctx.restore();
    
    drawElementalParticles(ctx, cardWidth, cardHeight, element, colors);
    
    drawStoneCardFrame(ctx, rarity, 10, 10, cardWidth - 20, cardHeight - 20, element, colors);
    
    const imageAreaX = 50;
    const imageAreaY = 80;
    const imageAreaWidth = cardWidth - 100;
    const imageAreaHeight = cardWidth - 100; 
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    roundRect(ctx, imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight, 15, true, false);
    
    ctx.save();
    const imageGlow = ctx.createRadialGradient(
      cardWidth / 2, imageAreaY + imageAreaHeight / 2, 10,
      cardWidth / 2, imageAreaY + imageAreaHeight / 2, imageAreaWidth / 2
    );
    imageGlow.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.5)`);
    imageGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = imageGlow;
    ctx.fillRect(imageAreaX, imageAreaY, imageAreaWidth, imageAreaHeight);
    ctx.restore();
    
    // Vẽ hình ảnh đ
    if (stoneImage) {
      try {
        const image = await loadImage(stoneImage);
        
        // Tính toán tỷ lệ để fit vào vùng hiển thị
        const scale = Math.min(imageAreaWidth / image.width, imageAreaHeight / image.height) * 0.9;
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        
        // Vị trí để đá nằm giữa vùng hiển thị
        const imageX = imageAreaX + (imageAreaWidth - scaledWidth) / 2;
        const imageY = imageAreaY + (imageAreaHeight - scaledHeight) / 2;
        
        // Vẽ glow trước khi vẽ hình ảnh
        ctx.save();
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 30;
        ctx.drawImage(image, imageX, imageY, scaledWidth, scaledHeight);
        ctx.restore();
        
        // Vẽ hình ảnh đá với độ sáng tăng cao hơn
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = "brightness(1.2) contrast(1.15)";
        ctx.drawImage(image, imageX, imageY, scaledWidth, scaledHeight);
        ctx.restore();
        
        // Thêm hiệu ứng ánh sáng lóe
        drawLightRays(ctx, cardWidth / 2, imageAreaY + imageAreaHeight / 2, colors);
      } catch (error) {
        console.error("Error loading stone image:", error);
        
        // Fallback khi không load được ảnh
        ctx.font = `bold 24px ${fontFamily}`;
        ctx.fillStyle = colors.primary;
        ctx.textAlign = "center";
        ctx.fillText("Stone Image", cardWidth / 2, imageAreaY + imageAreaHeight / 2);
      }
    }
    
    // Vẽ banner tên đá
    const nameBannerY = imageAreaY + imageAreaHeight + 30;
    const nameBannerHeight = 50;
    
    ctx.save();
    const nameBannerGradient = ctx.createLinearGradient(0, nameBannerY, 0, nameBannerY + nameBannerHeight);
    nameBannerGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.8)`);
    nameBannerGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.8)`);
    
    ctx.fillStyle = nameBannerGradient;
    roundRect(ctx, cardWidth / 2 - (cardWidth - 60) / 2, nameBannerY, cardWidth - 60, nameBannerHeight, 15, true, false);
    
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    
    if (isFragment) {
      ctx.font = `bold 18px ${fontFamily}`;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      ctx.fillText("FRAGMENT", cardWidth / 2, nameBannerY + 20);
      ctx.restore();
      ctx.font = `bold 24px ${fontFamily}`;
      
      let displayName = stoneName;
      if (stoneName.includes("Fragment")) {
        displayName = stoneName.replace(" Fragment", "");
      }
      
      ctx.fillText(displayName, cardWidth / 2, nameBannerY + nameBannerHeight / 2 + 20);
    } else {
      ctx.font = `bold 32px ${fontFamily}`;
      ctx.fillText(stoneName, cardWidth / 2, nameBannerY + nameBannerHeight / 2 + 10);
    }
    
    const descriptionY = nameBannerY + nameBannerHeight + 30;
    const descriptionHeight = 100;
    
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    roundRect(ctx, 30, descriptionY, cardWidth - 60, descriptionHeight, 15, true, false);
    
    // Mô tả đá
    ctx.font = `20px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    
    // Cắt mô tả để vừa với vùng hiển thị
    const maxLength = 80;
    let displayDescription = description;
    if (description.length > maxLength) {
      displayDescription = description.substring(0, maxLength) + "...";
    }
    
    // Tách dòng mô tả nếu cần
    const words = displayDescription.split(' ');
    let line = '';
    let y = descriptionY + 30;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > cardWidth - 80 && line !== '') {
        ctx.fillText(line, cardWidth / 2, y);
        line = word + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cardWidth / 2, y);
    ctx.restore();
    
    // Vẽ khu vực thông tin giá trị
    const valueY = descriptionY + descriptionHeight + 30;
    const valueHeight = 60;
    
    ctx.save();
    const valueBgGradient = ctx.createLinearGradient(cardWidth/2 - 120, valueY, cardWidth/2 + 120, valueY);
    valueBgGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.6)`);
    valueBgGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.6)`);
    
    ctx.fillStyle = valueBgGradient;
    roundRect(ctx, cardWidth/2 - 120, valueY, 240, valueHeight, 15, true, false);
    
    // Thêm viền
    ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 8;
    roundRect(ctx, cardWidth/2 - 120, valueY, 240, valueHeight, 15, false, true);
    
    // Hiển thị giá trị đá
    ctx.font = `bold 28px ${mastonFontFamily}`; // Changed from Arial to MastonPro
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 5;
    
    const formattedValue = stoneValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(formattedValue, cardWidth/2, valueY + valueHeight/2 + 10);
    
    // Hiện element text
    ctx.font = `bold 22px ${fontFamily}`;
    ctx.fillStyle = colors.primary;
    ctx.fillText(emoji + " " + element, cardWidth/2, valueY + valueHeight + 40);
    ctx.restore();
    
    // Thêm hiệu ứng shimmer
    drawStoneShimmer(ctx, 10, 10, cardWidth - 20, cardHeight - 20, rarity);
    
    // Lưu ảnh
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `stone_${stoneType}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error("Error creating stone image:", error);
    throw error;
  }
}

// Hàm vẽ hiệu ứng tia sáng cho đá
function drawLightRays(ctx, x, y, colors) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  
  const rayCount = 12;
  const maxLength = 150;
  
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const length = Math.random() * maxLength + 50;
    
    const gradient = ctx.createLinearGradient(
      x, y,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    
    gradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.8)`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.lineWidth = Math.random() * 4 + 2;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }
  
  ctx.restore();
}

// Hàm vẽ hiệu ứng particle theo element
function drawElementalParticles(ctx, width, height, element, colors) {
  ctx.save();
  
  const particleCount = 80;
  
  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    
    ctx.beginPath();
    ctx.fillStyle = i % 3 === 0 ? colors.primary : colors.secondary;
    ctx.globalAlpha = Math.random() * 0.5 + 0.2;
    
    if (element === "Universal") {
      // Particle hình sao cho đá vạn năng
      drawStar(ctx, x, y, size * 2, colors.primary);
    } else {
      // Particle hình tròn cho các đá thường
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Hiệu ứng đặc biệt theo element
  switch(element) {
    case "Pyro":
      drawFireParticles(ctx, width, height, colors);
      break;
    case "Hydro":
      drawWaterParticles(ctx, width, height, colors);
      break;
    case "Electro":
      drawElectroParticles(ctx, width, height, colors);
      break;
    case "Universal":
      drawUniversalParticles(ctx, width, height, colors);
      break;
  }
  
  ctx.restore();
}

// Hàm vẽ hiệu ứng lửa cho đá Pyro
function drawFireParticles(ctx, width, height, colors) {
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 20 + 10;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    gradient.addColorStop(0.2, "rgba(255, 200, 0, 0.5)");
    gradient.addColorStop(0.5, `rgba(${hexToRgb(colors.primary)}, 0.3)`);
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}
function getElementColor(element) {
  const elementColors = {
    Pyro: "#FF5733",    // Đỏ cam
    Hydro: "#0099FF",   // Xanh nước
    Anemo: "#66FFCC",   // Ngọc lam nhạt
    Electro: "#9933FF", // Tím
    Dendro: "#99FF66",  // Xanh lá cây
    Cryo: "#99FFFF",    // Xanh băng
    Geo: "#FFCC33",     // Vàng cam
    Unknown: "#FFFFFF"  // Trắng
  };
  
  return elementColors[element] || elementColors.Unknown;
}
function drawWaterParticles(ctx, width, height, colors) {
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 30 + 20;
    
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Vẽ gợn sóng
    for (let j = 0; j < 3; j++) {
      const circleSize = size - j * 10;
      ctx.beginPath();
      ctx.arc(x, y, circleSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Hàm vẽ hiệu ứng điện cho đá Electro
function drawElectroParticles(ctx, width, height, colors) {
  for (let i = 0; i < 8; i++) {
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    const length = Math.random() * 80 + 40;
    const angle = Math.random() * Math.PI * 2;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = colors.secondary;
    ctx.shadowBlur = 10;
    
    // Vẽ đường zigzag như tia điện
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    const segments = 5;
    for (let j = 1; j <= segments; j++) {
      const ratio = j / segments;
      const midX = startX + (endX - startX) * ratio;
      const midY = startY + (endY - startY) * ratio;
      const offset = (Math.random() - 0.5) * 20;
      
      ctx.lineTo(midX + offset, midY + offset);
    }
    
    ctx.stroke();
  }
}

// Hàm vẽ hiệu ứng đặc biệt cho đá Universal
function drawUniversalParticles(ctx, width, height, colors) {
  // Vẽ hiệu ứng hào quang
  const gradient = ctx.createRadialGradient(
    width/2, height/2, 50,
    width/2, height/2, 250
  );
  
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
  gradient.addColorStop(0.5, "rgba(255, 215, 0, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(width/2, height/2, 250, 0, Math.PI * 2);
  ctx.fill();
  
  // Vẽ thêm các ngôi sao nhỏ
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 5 + 1;
    
    drawStar(ctx, x, y, size, "#FFFFFF");
  }
}

// Hàm vẽ viền card cho đá
function drawStoneCardFrame(ctx, rarity, x, y, width, height, element, colors) {
  ctx.save();
  
  // Hiệu ứng glow cho viền
  const glowRadius = width * 0.6;
  const glowGradient = ctx.createRadialGradient(
    x + width / 2, y + height / 2, width / 3,
    x + width / 2, y + height / 2, glowRadius
  );
  
  const glowOpacity = rarity === 5 ? 0.45 : 0.35;
  glowGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, ${glowOpacity})`);
  glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  
  ctx.fillStyle = glowGradient;
  ctx.fillRect(x - 30, y - 30, width + 60, height + 60);
  
  // Vẽ viền
  const borderGradient = ctx.createLinearGradient(x, y, x, y + height);
  
  if (rarity === 5) {
    // Đá Universal dùng viền 5★
    borderGradient.addColorStop(0, colors.primary);
    borderGradient.addColorStop(0.5, "#FFFFFF");
    borderGradient.addColorStop(1, colors.primary);
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 8;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 15;
    roundRect(ctx, x - 2, y - 2, width + 4, height + 4, 20, false, true);
    
    // Vẽ viền trong
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 5;
    roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 15, false, true);
  } else {
    // Các đá nguyên tố thường dùng viền 4★
    borderGradient.addColorStop(0, colors.primary);
    borderGradient.addColorStop(0.3, colors.secondary);
    borderGradient.addColorStop(0.7, colors.primary);
    borderGradient.addColorStop(1, colors.secondary);
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 6;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
    roundRect(ctx, x, y, width, height, 18, false, true);
    
    ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.6)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 3;
    roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 12, false, true);
  }
  
  // Vẽ họa tiết góc
  drawCornerDecorationForStone(ctx, x + 5, y + 5, 0, colors.primary, element);
  drawCornerDecorationForStone(ctx, x + width - 5, y + 5, 90, colors.primary, element);
  drawCornerDecorationForStone(ctx, x + 5, y + height - 5, 270, colors.primary, element);
  drawCornerDecorationForStone(ctx, x + width - 5, y + height - 5, 180, colors.primary, element);
  
  ctx.restore();
}

// Hàm vẽ họa tiết góc cho đá
function drawCornerDecorationForStone(ctx, x, y, rotation, color, element) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Độ dài đường kẻ
  const lineLength = 40;
  
  // Vẽ hai đường thẳng từ góc
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(lineLength, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, lineLength);
  
  // Gradient cho đường kẻ
  const gradient = ctx.createLinearGradient(0, 0, lineLength, lineLength);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}55`);
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Thêm biểu tượng đặc trưng cho từng element ở góc
  let symbol;
  switch (element) {
    case "Pyro":
      drawSmallFlame(ctx, lineLength - 10, 10);
      break;
    case "Hydro":
      drawSmallDrop(ctx, lineLength - 10, 10);
      break;
    case "Electro":
      drawSmallLightning(ctx, lineLength - 10, 10);
      break;
    case "Cryo":
      drawSmallSnowflake(ctx, lineLength - 10, 10);
      break;
    case "Dendro":
      drawSmallLeaf(ctx, lineLength - 10, 10);
      break;
    case "Geo":
      drawSmallDiamond(ctx, lineLength - 10, 10);
      break;
    case "Anemo":
      drawSmallWind(ctx, lineLength - 10, 10);
      break;
    case "Universal":
      drawSmallStar(ctx, lineLength - 10, 10);
      break;
  }
  
  ctx.restore();
}

// Các hàm vẽ biểu tượng nhỏ cho từng element
function drawSmallFlame(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.quadraticCurveTo(x - 5, y - 3, x - 3, y);
  ctx.quadraticCurveTo(x - 5, y + 3, x, y + 8);
  ctx.quadraticCurveTo(x + 5, y + 3, x + 3, y);
  ctx.quadraticCurveTo(x + 5, y - 3, x, y - 8);
  ctx.fillStyle = "#FF5733";
  ctx.fill();
}

function drawSmallDrop(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.bezierCurveTo(x - 5, y - 3, x - 6, y + 4, x, y + 8);
  ctx.bezierCurveTo(x + 6, y + 4, x + 5, y - 3, x, y - 8);
  ctx.fillStyle = "#0099FF";
  ctx.fill();
}

function drawSmallLightning(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 8);
  ctx.lineTo(x + 3, y - 3);
  ctx.lineTo(x - 1, y);
  ctx.lineTo(x + 3, y + 8);
  ctx.lineTo(x, y + 3);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x - 3, y - 8);
  ctx.fillStyle = "#9933FF";
  ctx.fill();
}

function drawSmallSnowflake(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.rotate(i * Math.PI / 3);
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.strokeStyle = "#99FFFF";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.rotate(-i * Math.PI / 3);
  }
  
  // Add center circle
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
}

function drawSmallLeaf(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.bezierCurveTo(
    x - 6, y - 4,
    x - 6, y + 4,
    x, y + 8
  );
  ctx.bezierCurveTo(
    x + 6, y + 4,
    x + 6, y - 4,
    x, y - 8
  );
  ctx.fillStyle = "#99FF66";
  ctx.fill();
  
  // Add leaf vein
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.strokeStyle = "#66CC33";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawSmallDiamond(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x - 6, y);
  ctx.closePath();
  ctx.fillStyle = "#FFCC33";
  ctx.fill();
  
  // Add inner diamond
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x, y + 4);
  ctx.lineTo(x - 3, y);
  ctx.closePath();
  ctx.fillStyle = "#FFE680";
  ctx.fill();
}

function drawSmallWind(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.bezierCurveTo(
    x - 4, y - 6,
    x + 4, y - 6,
    x + 8, y - 2
  );
  ctx.bezierCurveTo(
    x + 4, y,
    x + 2, y + 4,
    x + 6, y + 6
  );
  ctx.strokeStyle = "#66FFCC";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Add small swirl
  ctx.beginPath();
  ctx.arc(x - 3, y + 3, 3, 0, Math.PI * 1.5, false);
  ctx.strokeStyle = "#99FFE6";
  ctx.stroke();
}

function drawSmallStar(ctx, x, y) {
  const spikes = 5;
  const outerRadius = 6;
  const innerRadius = 3;
  
  ctx.beginPath();
  ctx.translate(x, y);
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    const pointX = Math.cos(angle) * radius;
    const pointY = Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  
  // Reset transformation
  ctx.translate(-x, -y);
}

// Function to create shimmer effect on stone cards
function drawStoneShimmer(ctx, x, y, width, height, rarity) {
  ctx.save();
  
  const shimmerWidth = width * 0.3;
  const shimmerOpacity = rarity === 5 ? 0.6 : 0.4;
  
  // Create diagonal shimmer effect
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
  
  // Add some sparkles for higher rarity stones
  if (rarity === 5) {
    ctx.globalCompositeOperation = "lighter";
    
    for (let i = 0; i < 8; i++) {
      const sparkleX = x + Math.random() * width;
      const sparkleY = y + Math.random() * height;
      const size = Math.random() * 4 + 2;
      
      const sparkleGradient = ctx.createRadialGradient(
        sparkleX, sparkleY, 0,
        sparkleX, sparkleY, size
      );
      
      sparkleGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      sparkleGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.fillStyle = sparkleGradient;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, size, 0, Math.PI * 2);
      ctx.fill();
    }
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
      // Góc trên bên trái - Không cần điều chỉnh
      [x, y, 0], 
      
      // Góc trên bên phải - Cần dịch chuyển đúng vị trí trước khi xoay
      [x + width, y, Math.PI/2], 
      
      // Góc dưới bên trái - Cần dịch chuyển đúng vị trí trước khi xoay
      [x, y + height, Math.PI*1.5], 
      
      // Góc dưới bên phải - Cần dịch chuyển đúng vị trí trước khi xoay
      [x + width, y + height, Math.PI] 
    ].forEach((pos) => {
      drawEnhancedPremiumCorner(ctx, pos[0], pos[1], cornerSize, pos[2]);
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

  // Vẽ nền đen nửa trong suốt cho khung ảnh
  const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
  bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  bgGradient.addColorStop(0.5, "rgba(10, 10, 15, 0.6)");
  bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  
  ctx.fillStyle = bgGradient;
  roundRect(ctx, x, y, width, height, 15, true, false);

  // Kiểm tra có phải Premium 5★ không
  const isPremium = rarity === "5" && colors.premium;

  // Vẽ phần khung dựa vào độ hiếm
  if (isPremium) {
    // ===== KHUNG PREMIUM 5★ =====
    // Hiệu ứng hào quang xung quanh
    const glowGradient = ctx.createRadialGradient(
      x + width/2, y + height/2, width/4,
      x + width/2, y + height/2, width/1.5
    );
    glowGradient.addColorStop(0, "rgba(255, 215, 0, 0.4)");
    glowGradient.addColorStop(0.6, "rgba(255, 140, 0, 0.2)");
    glowGradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x - 20, y - 20, width + 40, height + 40);

    // Viền ngoài đẹp mắt
    const outerBorderGradient = ctx.createLinearGradient(x, y, x, y + height);
    outerBorderGradient.addColorStop(0, "#FFD700");
    outerBorderGradient.addColorStop(0.3, "#FFFFFF");
    outerBorderGradient.addColorStop(0.7, "#FFD700");
    outerBorderGradient.addColorStop(1, "#FF8C00");
    
    ctx.strokeStyle = outerBorderGradient;
    ctx.lineWidth = 6;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 15;
    roundRect(ctx, x - 2, y - 2, width + 4, height + 4, 18, false, true);
    
    // Viền trong cao cấp
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 14, false, true);

    // Hiệu ứng góc premium
    const cornerSize = 40;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      // Tọa độ của 4 góc
      const cornerX = x + (i % 2 === 0 ? 0 : width);
      const cornerY = y + (i < 2 ? 0 : height);
      ctx.translate(cornerX, cornerY);
      
      // Xoay góc tương ứng
      ctx.rotate(Math.PI * 0.5 * i);
      
      // Vẽ họa tiết góc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(cornerSize - 5, cornerSize/2);
      ctx.lineTo(cornerSize, cornerSize);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      
      // Gradient màu sang trọng
      const cornerGradient = ctx.createLinearGradient(0, 0, cornerSize, cornerSize);
      cornerGradient.addColorStop(0, "#FF5500");
      cornerGradient.addColorStop(0.5, "#FFD700");
      cornerGradient.addColorStop(1, "#FFFFFF");
      
      ctx.fillStyle = cornerGradient;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      
      // Vẽ biểu tượng kim cương ở góc
      ctx.beginPath();
      ctx.translate(cornerSize/2, cornerSize/2);
      ctx.rotate(Math.PI/4);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 10;
      ctx.fillRect(-6, -6, 12, 12);
      
      ctx.restore();
    }
    
    // Vẽ họa tiết dọc hai bên
    for (let side = 0; side < 2; side++) {
      const patternX = side === 0 ? x + 20 : x + width - 20;
      
      // Đường viền dọc với pattern đứt đoạn
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(patternX, y + 50);
      ctx.lineTo(patternX, y + height - 50);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Vẽ các họa tiết trang trí dọc theo viền
      for (let i = 0; i < 5; i++) {
        const patternY = y + 50 + i * (height - 100)/4;
        
        // Điểm nhấn kim cương
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(patternX, patternY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } 
  else if (rarity === "5") {
    // ===== KHUNG 5★ THƯỜNG =====
    // Hiệu ứng hào quang vàng
    const auraGradient = ctx.createRadialGradient(
      x + width/2, y + height/2, width/4,
      x + width/2, y + height/2, Math.max(width, height)/1.8
    );
    auraGradient.addColorStop(0, "rgba(255, 215, 0, 0.2)");
    auraGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
    
    ctx.fillStyle = auraGradient;
    ctx.fillRect(x - 15, y - 15, width + 30, height + 30);
    
    // Viền ngoài
    const borderGradient = ctx.createLinearGradient(x, y, x, y + height);
    borderGradient.addColorStop(0, "#FFD700");
    borderGradient.addColorStop(0.5, "#FFA500");
    borderGradient.addColorStop(1, "#FF8C00");
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 5;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
    roundRect(ctx, x, y, width, height, 15, false, true);

    // Hiệu ứng góc
    const cornerSize = 25;
    for (let i = 0; i < 4; i++) {
      const cornerX = x + (i % 2 === 0 ? 0 : width);
      const cornerY = y + (i < 2 ? 0 : height);
      
      ctx.save();
      ctx.translate(cornerX, cornerY);
      ctx.rotate(Math.PI * 0.5 * i);
      
      // Họa tiết góc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.arc(cornerSize, cornerSize/2, cornerSize/2, -Math.PI/2, Math.PI/2);
      ctx.lineTo(0, cornerSize);
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Điểm nhấn góc
      ctx.beginPath();
      ctx.arc(cornerSize - 5, cornerSize/2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      
      ctx.restore();
    }
    
    // Họa tiết trang trí hai bên
    for (let side = 0; side < 2; side++) {
      const decorX = side === 0 ? x + 15 : x + width - 15;
      
      // Họa tiết hình thoi 
      for (let i = 0; i < 3; i++) {
        const decorY = y + height/4 + i * height/3;
        
        ctx.beginPath();
        ctx.moveTo(decorX, decorY - 10);
        ctx.lineTo(decorX + (side === 0 ? 5 : -5), decorY);
        ctx.lineTo(decorX, decorY + 10); 
        ctx.lineTo(decorX + (side === 0 ? -5 : 5), decorY);
        ctx.closePath();
        ctx.fillStyle = "#FFD700";
        ctx.fill();
      }
    }
  } 
  else if (rarity === "4") {
    // ===== KHUNG 4★ =====
    // Viền ngoài
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 8;
    roundRect(ctx, x, y, width, height, 15, false, true);
    
    // Viền trong
    ctx.strokeStyle = `rgba(${hexToRgb(colors.secondary)}, 0.7)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    roundRect(ctx, x + 6, y + 6, width - 12, height - 12, 10, false, true);
    
    // Họa tiết góc
    const cornerSize = 20;
    for (let i = 0; i < 4; i++) {
      const cornerX = x + (i % 2 === 0 ? 0 : width);
      const cornerY = y + (i < 2 ? 0 : height);
      
      ctx.save();
      ctx.translate(cornerX, cornerY);
      ctx.rotate(Math.PI * 0.5 * i);
      
      // Vẽ hình tam giác góc
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      
      // Vẽ điểm nhấn
      ctx.beginPath();
      ctx.arc(cornerSize/2, cornerSize/2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.globalAlpha = 0.9;
      ctx.fill();
      
      ctx.restore();
    }
    
    // Họa tiết trang trí trên/dưới
    for (let i = 0; i < 2; i++) {
      const patternY = i === 0 ? y + 15 : y + height - 15;
      
      ctx.beginPath();
      ctx.moveTo(x + 30, patternY);
      ctx.lineTo(x + width - 30, patternY);
      ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.7)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Vẽ 3 điểm nhấn
      for (let j = 0; j < 3; j++) {
        const pointX = x + width/4 + j * width/2;
        
        ctx.beginPath();
        ctx.moveTo(pointX - 6, patternY);
        ctx.lineTo(pointX, patternY - 6);
        ctx.lineTo(pointX + 6, patternY);
        ctx.lineTo(pointX, patternY + 6);
        ctx.closePath();
        ctx.fillStyle = colors.primary;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(pointX, patternY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
      }
    }
  } 
  else {

    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 5;
    roundRect(ctx, x, y, width, height, 12, false, true);
    
    for (let i = 0; i < 4; i++) {
      const cornerX = x + (i % 2 === 0 ? 0 : width);
      const cornerY = y + (i < 2 ? 0 : height);
      
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(cornerX + 20, cornerY);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX, cornerY + 20);
      } else if (i === 1) {
        ctx.moveTo(cornerX - 20, cornerY);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX, cornerY + 20);
      } else if (i === 2) {
        ctx.moveTo(cornerX, cornerY - 20);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX + 20, cornerY);
      } else {
        ctx.moveTo(cornerX - 20, cornerY);
        ctx.lineTo(cornerX, cornerY);
        ctx.lineTo(cornerX, cornerY - 20);
      }
      
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 15);
    ctx.lineTo(x + 15, y + height - 15);
    ctx.moveTo(x + width - 15, y + 15);
    ctx.lineTo(x + width - 15, y + height - 15);
    ctx.strokeStyle = `rgba(${hexToRgb(colors.primary)}, 0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (rarity === "5" || rarity === "4") {
    const shineWidth = rarity === "5" ? width/3 : width/4;
    
    const shineGradient = ctx.createLinearGradient(
      x - shineWidth/2, y,
      x + shineWidth/2, y + height
    );
    
    shineGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    shineGradient.addColorStop(0.5, `rgba(255, 255, 255, ${rarity === "5" ? 0.3 : 0.2})`);
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
        ctx.fillText(" LIMITED EDITION ", width / 2, nameBannerY + 65);
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
    const baseRarity = parseInt(rarity);
const currentRarity = options.starLevel || baseRarity;
const maxDisplayStars = baseRarity; 
const starsToShow = baseRarity; 

// Tăng kích thước sao
const starSize = baseRarity === 5 ? 26 : baseRarity === 4 ? 24 : 22; // Tăng từ 22/20/18 lên 26/24/22

// Tăng khoảng cách giữa các sao
const starSpacing = starSize * 1.6; // Tăng từ 1.4 lên 1.6 để tạo khoảng cách lớn hơn

// Tính toán lại vị trí để đảm bảo sao vẫn nằm giữa màn hình
const totalStarWidth = starSpacing * starsToShow;
const startX = width / 2 - totalStarWidth / 2 + starSpacing / 2;
const starY = nameBannerY - 25; // Thay đổi từ -20 thành -25 để nâng cao sao lên một chút

for (let i = 0; i < starsToShow; i++) {
  const starX = startX + i * starSpacing;
  
  if (baseRarity === 5) {
    if (isPremium) {
      // Tính toán góc xoay dựa trên vị trí của sao so với trung tâm
      const centerIndex = Math.floor(starsToShow / 2);
      const distanceFromCenter = i - centerIndex;
      
      if (currentRarity > 5 && i >= (starsToShow - (currentRarity - 5))) {
        // Hiệu ứng ngả cho sao tiến hóa: ngả mạnh ra hai bên từ trung tâm
        const rotationAngle = distanceFromCenter * 0.3; // Góc ngả tỷ lệ với khoảng cách từ trung tâm
        
        // Giảm kích thước sao Premium tiến hóa xuống từ 1.4 thành 1.35
        await drawPremiumEvolvedStar(ctx, starX, starY, starSize * 1.35, starImages.evolved.premium, rotationAngle);
      } else {
        // Premium chưa tiến hóa: ngả nhẹ ra hai bên từ trung tâm
        const rotationAngle = distanceFromCenter * 0.15; // Góc ngả nhẹ hơn, cũng tỷ lệ với khoảng cách
        
        // Tăng kích thước sao Premium chưa tiến hóa từ 1.3 lên 1.4
        await drawStarFromImage(ctx, starX, starY, starSize * 1.4, starImages.normal.premium, rotationAngle);
      }
      continue;
    }
    else if (currentRarity > 5) {
      // Xử lý các sao tiến hóa thường - KHÔNG XOẠ NGHIÊNG
      const evolvedStars = currentRarity - 5;
      if (i >= (starsToShow - evolvedStars)) {
        // Sao tiến hóa 5★ thường KHÔNG XOẠ NGHIÊNG NỮA
        await drawStarFromImage(ctx, starX, starY, starSize * 1.3, starImages.evolved.red, 0);
        continue;
      } else {
        starImageUrl = starImages.normal["5"];
      }
    } else {
      starImageUrl = starImages.normal["5"];
    }
  }
  // Nhân vật 4★
  else if (baseRarity === 4) {
    if (currentRarity > 4) {
      const evolvedStars = currentRarity - 4;
      if (i >= (starsToShow - evolvedStars)) {
        // Sao tiến hóa 4★ KHÔNG XOẠ NGHIÊNG
        await drawStarFromImage(ctx, starX, starY, starSize * 1.2, starImages.evolved.gold, 0); // Góc xoay = 0
        continue;
      } else {
        starImageUrl = starImages.normal["4"];
      }
    } else {
      starImageUrl = starImages.normal["4"];
    }
  }
  else {
    starImageUrl = starImages.normal["3"];
  }
  
  await drawStarFromImage(ctx, starX, starY, starSize, starImageUrl, 0); 
}
    
    if (currentRarity > baseRarity) {
      const evolveTextX = startX + starsToShow * starSpacing + 15;
      const evolveTextY = starY + 6;

    }
    
    if (rarity === "5") {
      ctx.font = `bold 13px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      
      if (isPremium) {
        const legendaryGradient = ctx.createLinearGradient(width/2 - 50, starY + starSize + 12, width/2 + 50, starY + starSize + 12);
        legendaryGradient.addColorStop(0, "#FF5500");
        legendaryGradient.addColorStop(0.5, "#FFFFFF");
        legendaryGradient.addColorStop(1, "#FF5500");
        ctx.fillStyle = legendaryGradient;
        ctx.fillText("LEGENDARY", width/2, starY + starSize + 12);
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("RARE", width/2, starY + starSize + 12);
      }
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
const valueY = nameBannerY + nameBannerHeight + 25;
const valueHeight = 50;

if (rarity === "5") {
  if (isPremium) {
    const valueBgGradient = ctx.createLinearGradient(
      width/2 - 150, valueY,
      width/2 + 150, valueY
    );
    valueBgGradient.addColorStop(0, `rgba(50, 0, 60, 0.9)`);
    valueBgGradient.addColorStop(0.5, `rgba(80, 0, 90, 0.95)`);
    valueBgGradient.addColorStop(1, `rgba(50, 0, 60, 0.9)`);
    
    ctx.fillStyle = valueBgGradient;
    roundRect(ctx, width/2 - 140, valueY, 280, valueHeight, 15, true, false);
    
    const borderGradient = ctx.createLinearGradient(
      width/2 - 140, valueY,
      width/2 + 140, valueY
    );
    borderGradient.addColorStop(0, "#FFD700");
    borderGradient.addColorStop(0.5, "#FFFFFF");
    borderGradient.addColorStop(1, "#FFD700");
    
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 8;
    roundRect(ctx, width/2 - 140, valueY, 280, valueHeight, 15, false, true);
    
    const cornerSize = 12;
    [[width/2 - 140, valueY], 
     [width/2 + 140, valueY],
     [width/2 - 140, valueY + valueHeight],
     [width/2 + 140, valueY + valueHeight]
    ].forEach((pos, i) => {
      ctx.beginPath();
      const [x, y] = pos;
      if (i < 2) {
        ctx.moveTo(x - (i === 0 ? -cornerSize : cornerSize), y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + cornerSize);
      } else {  
        ctx.moveTo(x - (i === 2 ? -cornerSize : cornerSize), y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y - cornerSize);
      }
      ctx.strokeStyle = "#FFD700";
      ctx.stroke();
    });
  } else {
    const valueBgGradient = ctx.createLinearGradient(
      width/2 - 150, valueY,
      width/2 + 150, valueY
    );
    valueBgGradient.addColorStop(0, `rgba(100, 50, 0, 0.9)`);
    valueBgGradient.addColorStop(0.5, `rgba(120, 70, 0, 0.95)`);
    valueBgGradient.addColorStop(1, `rgba(100, 50, 0, 0.9)`);
    
    ctx.fillStyle = valueBgGradient;
    roundRect(ctx, width/2 - 140, valueY, 280, valueHeight, 10, true, false);
  }
} else if (rarity === "4") {
  const valueBgGradient = ctx.createLinearGradient(
    width/2 - 150, valueY,
    width/2 + 150, valueY
  );
  valueBgGradient.addColorStop(0, `rgba(138, 43, 226, 0.8)`);
  valueBgGradient.addColorStop(0.5, `rgba(155, 89, 182, 0.9)`);
  valueBgGradient.addColorStop(1, `rgba(142, 68, 173, 0.8)`);
  
  ctx.fillStyle = valueBgGradient;
  roundRect(ctx, width/2 - 140, valueY, 280, valueHeight, 10, true, false);
  
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const x = width/2 - 120 + i * 120;
    ctx.beginPath();
    ctx.moveTo(x, valueY + 10);
    ctx.lineTo(x, valueY + valueHeight - 10);
    ctx.stroke();
  }
} else {
  const valueBgGradient = ctx.createLinearGradient(
    width/2 - 150, valueY,
    width/2 + 150, valueY
  );
  valueBgGradient.addColorStop(0, `rgba(52, 152, 219, 0.8)`);
  valueBgGradient.addColorStop(1, `rgba(41, 128, 185, 0.8)`);
  
  ctx.fillStyle = valueBgGradient;
  roundRect(ctx, width/2 - 140, valueY, 280, valueHeight, 10, true, false);
}

ctx.font = `bold 32px ${mastonFontFamily}`;
ctx.textAlign = "center";
ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
ctx.shadowBlur = 8;
ctx.shadowOffsetY = 2;

const formattedValue = options.cardValue.toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const valueGradient = ctx.createLinearGradient(
  width/2 - 70, valueY + valueHeight/2,
  width/2 + 70, valueY + valueHeight/2
);
valueGradient.addColorStop(0, "#FFD700");
valueGradient.addColorStop(0.5, "#FFFFFF");
valueGradient.addColorStop(1, "#FFD700");

ctx.fillStyle = valueGradient;
ctx.fillText(formattedValue, width/2, valueY + valueHeight/2 + 10);
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
    
    const rarityStatColors = {
      "5": isPremium ? 
        [["#FF5500", "#FFD700"], ["#FF3300", "#FFAA00"], ["#FF0066", "#FF9900"]] : // Premium 5-star
        [["#FFD700", "#FFA500"], ["#FFB700", "#FF8C00"], ["#FFCC00", "#FF7700"]], // 5-star
      "4": [["#9b59b6", "#8e44ad"], ["#A569BD", "#7D3C98"], ["#BB8FCE", "#6C3483"]], // 4-star  
      "3": [["#3498db", "#2980b9"], ["#5DADE2", "#2471A3"], ["#85C1E9", "#1F618D"]]  // 3-star
    };
    const statColors = rarityStatColors[rarity] || rarityStatColors["3"];

    statValues.forEach((value, index) => {
      const y = statY + 15 + index * statSpacing;
      const barWidth = width - 100;
      const barHeight = 25;
      const barX = width / 2 - barWidth / 2;
      
      ctx.save();
      if (rarity === "5" && isPremium) {
        ctx.fillStyle = "rgba(30, 15, 35, 0.8)";
   
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1;
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      }
      
      roundRect(ctx, barX, y, barWidth, barHeight, barHeight / 2, true, false);
      
      const maxVal = index === 0 ? 5000 : index === 1 ? 600 : 500;
      const progress = Math.min((value / maxVal) * barWidth, barWidth);
      
      const barGradient = ctx.createLinearGradient(barX, y, barX + progress, y);
      barGradient.addColorStop(0, statColors[index][0]);  
      barGradient.addColorStop(1, statColors[index][1]);
      
      ctx.fillStyle = barGradient;
      
      if (rarity === "5" && isPremium) {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        roundRect(ctx, barX, y, progress, barHeight, barHeight / 2, true, false);
        
        ctx.shadowColor = "transparent"; 
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1;
        roundRect(ctx, barX, y, barWidth, barHeight, barHeight / 2, false, true);
        
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const glowGradient = ctx.createLinearGradient(barX, y, barX + progress, y);
        glowGradient.addColorStop(0, `rgba(${hexToRgb(statColors[index][0])}, 0.3)`);
        glowGradient.addColorStop(1, `rgba(${hexToRgb(statColors[index][1])}, 0.1)`);
        ctx.fillStyle = glowGradient;
        roundRect(ctx, barX + 2, y + 2, progress - 4, barHeight - 4, (barHeight - 4) / 2, true, false);
        ctx.restore();
      } else {
        roundRect(ctx, barX, y, progress, barHeight, barHeight / 2, true, false);
      }
      
      if (rarity === "5") {
        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 5; i++) {
          const sparkleX = barX + progress * (i+1)/6;
          ctx.beginPath();
          ctx.arc(sparkleX, y + barHeight/2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      ctx.save();
      ctx.shadowColor = "black";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.font = "bold 18px Arial"; 
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `${statIcons[index]} ${statLabels[index]}`,
        barX + 10,
        y + barHeight / 2 + 6
      );
      
      ctx.textAlign = "right";
      ctx.font = `bold 18px ${mastonFontFamily}`; // Changed to MastonPro for the numeric values
      ctx.fillText(value, barX + barWidth - 10, y + barHeight / 2 + 6);
      ctx.restore();
      
      if (rarity === "5" && isPremium) {
        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        const highlightGradient = ctx.createLinearGradient(barX, y, barX + progress, y);
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = highlightGradient;

        roundRect(ctx, barX, y, progress, barHeight/2, barHeight / 4, true, false);
        ctx.restore();
      }
      
      ctx.restore();
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
  createStoneResultImage,
  createInventoryImage,
  createExpItemResultImage,
};
