const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { getAvatarPath } = require("./fishCanvas");

// Add color parsing utilities
function hexToRgb(hex) {
  try {
    if (!hex || typeof hex !== 'string') {
      return "255, 255, 255";
    }
    
    if (hex.startsWith('rgb')) {
      const rgbMatch = hex.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return `${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}`;
      }
      return "255, 255, 255";
    }
    
    hex = hex.replace(/^#/, '');
    
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return "255, 255, 255";
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  } catch (error) {
    return "255, 255, 255";
  }
}

function parseColor(color, fallback = "#ffffff") {
  try {
    if (!color) return fallback;
    
    if (typeof color === 'string') {
      if (color.startsWith('rgb')) {
        return color;
      }
      if (color.startsWith('#')) {
        const hex = color.replace(/^#/, '');
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
      white: "#ffffff",
      black: "#000000"
    };
    
    if (typeof color === 'string' && predefinedColors[color.toLowerCase()]) {
      return predefinedColors[color.toLowerCase()];
    }
    
    return fallback;
  } catch (error) {
    return fallback;
  }
}

// Format number with commas
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const petColors = {
  DOG: {
    primary: "#8B4513",
    secondary: "#D2691E",
    gradient: ["#8B4513", "#D2691E"],
  },
  CAT: {
    primary: "#808080",
    secondary: "#A9A9A9",
    gradient: ["#808080", "#A9A9A9"],
  },
  HAMSTER: {
    primary: "#DEB887",
    secondary: "#D2B48C",
    gradient: ["#DEB887", "#D2B48C"],
  },
};

// Pet icons map
const petIcons = {
  DOG: "🐕",
  CAT: "🐈",
  HAMSTER: "🐹",
  default: "🐾"
};

// Default pet images
const defaultPetImagePaths = {
  DOG: path.join(__dirname, "../game/pets/dog.jpg"),
  CAT: path.join(__dirname, "../game/pets/cat.jpg"),
  HAMSTER: path.join(__dirname, "../game/pets/hamster.jpg"),
};

try {
  const fontsDir = path.join(__dirname, "../fonts");
  if (fs.existsSync(path.join(fontsDir, "Roboto-Bold.ttf"))) {
    registerFont(path.join(fontsDir, "Roboto-Bold.ttf"), {
      family: "Roboto",
      weight: "bold",
    });
  }
  if (fs.existsSync(path.join(fontsDir, "Roboto-Regular.ttf"))) {
    registerFont(path.join(fontsDir, "Roboto-Regular.ttf"), {
      family: "Roboto",
      weight: "normal",
    });
  }
} catch (e) {
  console.log("Could not load custom fonts, using system defaults");
}

/**
 * Draw particle effects on canvas
 */
function drawParticleEffects(ctx, width, height, type) {
  const colors = petColors[type] || petColors.DOG;
  const particleColor = parseColor(colors?.primary, "#ffffff");
  const particleCount = 60;

  ctx.fillStyle = particleColor;
  ctx.globalAlpha = 0.4;

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw decorative background patterns
 */
function drawBackgroundPatterns(ctx, width, height, type) {
  const colors = petColors[type] || petColors.DOG;
  const patternColor = parseColor(colors?.secondary, "#3498db");

  ctx.save();
  ctx.globalAlpha = 0.1;
  
  // Draw paw print patterns
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 10 + Math.random() * 20;

    ctx.fillStyle = patternColor;
    // Draw main pad
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw toe pads
    for (let j = 0; j < 4; j++) {
      const angle = (j * Math.PI / 2) + Math.PI / 4;
      const padX = x + Math.cos(angle) * size;
      const padY = y + Math.sin(angle) * size;
      const toeSize = size * 0.6;
      
      ctx.beginPath();
      ctx.arc(padX, padY, toeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Create a rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "undefined") radius = 5;
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Create pet stats image
 */
async function createPetImage(options) {
  try {
    const {
      userId,
      userName = "Người chơi",
      pet = {
        name: "Pet",
        type: "DOG",
        level: 1,
        exp: 0,
        power: 10,
        hunger: 100,
        happy: 100,
        energy: 100,
        maxHunger: 100,
        maxHappy: 100,
        maxEnergy: 100,
      }
    } = options;
    
    const displayPower = pet.power || 10;
    // Load user data
    const userData = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/cache/userData.json')));
    const userInfo = userData[userId] || { name: userName };
    const displayName = userInfo.name || userName;

    // Create canvas
    const width = 900;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Create dynamic background gradient based on pet type
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    const colors = petColors[pet.type] || petColors.DOG;

    bgGradient.addColorStop(0, "#1e272e");
    bgGradient.addColorStop(0.5, colors.primary);
    bgGradient.addColorStop(1, "#2c5364");

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add background patterns
    drawBackgroundPatterns(ctx, width, height, pet.type);
    drawParticleEffects(ctx, width, height, pet.type);

    // Header section
    const headerHeight = 160;
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.8)`);
    headerGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.8)`);
    
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    // Title with glow effect
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 20;
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("THÔNG TIN THÚ CƯNG", width / 2, 90);
    ctx.shadowBlur = 0;

    // Pet type badge
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = colors.primary;
    ctx.fillText(`• ${pet.type} •`, width / 2, 130);

    // Decorative line
    const lineGradient = ctx.createLinearGradient(100, 150, width - 100, 150);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    lineGradient.addColorStop(0.5, colors.primary);
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(width - 100, 150);
    ctx.stroke();

    // User avatar and info section
    const avatarOffsetY = 200;
    try {
      const avatarPath = await getAvatarPath(userId);
      if (avatarPath) {
        const avatar = await loadImage(avatarPath);
        
        // Avatar background glow
        ctx.save();
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 55, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = colors.primary;
        ctx.fill();
        ctx.restore();

        // Avatar image
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, avatarOffsetY, 100, 100);
        ctx.restore();

        // Avatar border
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 50, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch (error) {
      console.error("Error drawing avatar:", error);
    }

    // User name
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 5;
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(displayName, 170, 50 + avatarOffsetY - 15);
    ctx.restore();

    // Pet stats below name
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";

    const levelText = `🎮 Cấp độ: ${pet.level} | 💪 Sức mạnh: ${displayPower}`;
    ctx.strokeText(levelText, 170, 50 + avatarOffsetY + 15);

    const statGradient = ctx.createLinearGradient(
      170,
      50 + avatarOffsetY + 15,
      500,
      50 + avatarOffsetY + 15
    );
    statGradient.addColorStop(0, "#90caf9");
    statGradient.addColorStop(0.5, "#42a5f5");
    statGradient.addColorStop(1, "#1565c0");

    ctx.fillStyle = statGradient;
    ctx.fillText(levelText, 170, 50 + avatarOffsetY + 15);
    ctx.restore();

    // Pet display section
    const petSectionY = 400; // Increased from 350
    const petSectionHeight = 400; // Increased from 360

    // Pet section background
    ctx.save();
    const petSectionGradient = ctx.createLinearGradient(
      50,
      petSectionY,
      width - 50,
      petSectionY + petSectionHeight
    );
    petSectionGradient.addColorStop(0, `rgba(${hexToRgb(colors.primary)}, 0.3)`);
    petSectionGradient.addColorStop(0.5, "rgba(20, 40, 60, 0.6)");
    petSectionGradient.addColorStop(1, `rgba(${hexToRgb(colors.secondary)}, 0.3)`);

    ctx.fillStyle = petSectionGradient;
    roundRect(ctx, 50, petSectionY, width - 100, petSectionHeight, 30, true, false);

    // Pet section border
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    roundRect(ctx, 50, petSectionY, width - 100, petSectionHeight, 30, false, true);
    ctx.restore();

    // Pet name
    ctx.save();
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 15;
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(pet.name, width / 2, petSectionY + 50);
    ctx.restore();

    // Pet level badge
    const badgeWidth = 200;
    const badgeHeight = 50;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = petSectionY + 70;

    const badgeGradient = ctx.createLinearGradient(
      badgeX,
      badgeY,
      badgeX + badgeWidth,
      badgeY + badgeHeight
    );
    badgeGradient.addColorStop(0, colors.primary);
    badgeGradient.addColorStop(1, colors.secondary);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = badgeGradient;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 25, true, false);
    ctx.restore();

    // Badge border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 25, false, true);

    // Level text
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Level ${pet.level}`,
      width / 2,
      badgeY + badgeHeight / 2
    );

    // Try to load and draw pet image
    try {
      let petImage = null;
      const defaultImagePath = defaultPetImagePaths[pet.type];

      if (defaultImagePath && fs.existsSync(defaultImagePath)) {
        petImage = await loadImage(defaultImagePath);
      }

      if (petImage) {
        // Draw glowing background circle
        ctx.save();
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(width / 2, petSectionY + 240, 90, 0, Math.PI * 2); // Adjusted Y position
        ctx.fillStyle = `rgba(${hexToRgb(colors.primary)}, 0.3)`;
        ctx.fill();
        ctx.restore();

        // Draw pet image
        const imageSize = 180;
        ctx.drawImage(
          petImage,
          (width - imageSize) / 2,
          petSectionY + 160, // Adjusted Y position
          imageSize,
          imageSize
        );
      } else {
        // Fallback to pet icon with adjusted position
        ctx.save();
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 15;
        ctx.font = "140px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(
          petIcons[pet.type] || petIcons.default,
          width / 2,
          petSectionY + 240 // Adjusted Y position
        );
        ctx.restore();
      }
    } catch (error) {
      console.error("Error drawing pet image:", error);
      // Fallback to pet icon
      ctx.save();
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 15;
      ctx.font = "140px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        petIcons[pet.type] || petIcons.default,
        width / 2,
        petSectionY + 200
      );
      ctx.restore();
    }

    // Adjust stats bars position
    const statsY = petSectionY + 450; // Moved lower

    // Function to draw stat bar
    const drawStatBar = (y, value, maxValue, label, color) => {
      const barWidth = width - 200;
      const barHeight = 30;
      const x = 100;
      const spacing = 45;

      // Bar background
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Giảm độ đậm của background
      roundRect(ctx, x, y, barWidth, barHeight, 15, true, false);
  
      // Progress bar
      const progress = (value / maxValue) * barWidth;
      const progressGradient = ctx.createLinearGradient(x, y, x + progress, y + barHeight);
      progressGradient.addColorStop(0, color);
      progressGradient.addColorStop(1, color.replace("1)", "0.7)"));
  
      ctx.fillStyle = progressGradient;
    roundRect(ctx, x, y, progress, barHeight, 15, true, false);

   // Bar border
   ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
   ctx.lineWidth = 1;
   roundRect(ctx, x, y, barWidth, barHeight, 15, false, true);

      // Label
      ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${label}: ${value}/${maxValue}`, x + 10, y + (barHeight/2));
};

    // Draw stat bars with new positions
    drawStatBar(statsY, pet.energy, pet.maxEnergy, "⚡ Năng lượng", "rgba(255, 193, 7, 1)");
    drawStatBar(statsY + 45, pet.hunger, pet.maxHunger, "🍖 Độ đói", "rgba(76, 175, 80, 1)");
    drawStatBar(statsY + 90, pet.happy, pet.maxHappy, "😊 Hạnh phúc", "rgba(233, 30, 99, 1)");
    
    const expBarWidth = width - 200; // Match width with stat bars
const expBarHeight = 30;
const expProgress = (pet.exp / (100 * pet.level)) * expBarWidth;

    // Adjust exp bar position
    const expY = statsY + 135; // Moved lower

    // Exp bar background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    roundRect(ctx, 100, expY, expBarWidth, expBarHeight, 20, true, false);

    // Exp progress
    const expGradient = ctx.createLinearGradient(100, expY, 100 + expProgress, expY + expBarHeight);
    expGradient.addColorStop(0, "#4CAF50");
    expGradient.addColorStop(1, "#8BC34A");

    ctx.fillStyle = expGradient;
    roundRect(ctx, 100, expY, expProgress, expBarHeight, 20, true, false);

    // Exp bar border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    roundRect(ctx, 100, expY, expBarWidth, expBarHeight, 20, false, true);

    // Exp text
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; 
    ctx.fillText(`EXP: ${pet.exp}/100`, width / 2, expY + (expBarHeight/2));

    // Save and return the image
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `pet_${userId}_${Date.now()}.png`);
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating pet image:", error);
    throw error;
  }
}

module.exports = {
  createPetImage,
  petColors,
  petIcons,
};
