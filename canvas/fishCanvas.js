const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");

// Format number with commas
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Fish rarity colors and gradients
const rarityColors = {
  trash: {
    primary: "#7f8c8d",
    secondary: "#95a5a6",
    gradient: ["#7f8c8d", "#95a5a6"],
  },
  common: {
    primary: "#2ecc71",
    secondary: "#27ae60",
    gradient: ["#2ecc71", "#27ae60"],
  },
  uncommon: {
    primary: "#3498db",
    secondary: "#2980b9",
    gradient: ["#3498db", "#2980b9"],
  },
  rare: {
    primary: "#9b59b6",
    secondary: "#8e44ad",
    gradient: ["#9b59b6", "#8e44ad"],
  },
  legendary: {
    primary: "#f1c40f",
    secondary: "#f39c12",
    gradient: ["#f1c40f", "#f39c12"],
  },
  mythical: {
    primary: "#e74c3c",
    secondary: "#c0392b",
    gradient: ["#e74c3c", "#c0392b"],
  },
  cosmic: {
    primary: "#1abc9c",
    secondary: "#16a085",
    gradient: ["#1abc9c", "#16a085"],
  },
};

// Fish icons map (you can expand this later with actual images)
const fishIcons = {
  default: "🐟",
  trash: "🗑️",
  common: "🐟",
  uncommon: "🐠",
  rare: "🐡",
  legendary: "🦈",
  mythical: "🐉",
  cosmic: "✨",
};

function hexToRgb(hex) {
  try {
    // Nếu đầu vào không hợp lệ, trả về màu trắng
    if (!hex || typeof hex !== 'string') {
      return "255, 255, 255"; // Return white as fallback
    }
    
    // Xử lý nếu đầu vào là RGB string
    if (hex.startsWith('rgb')) {
      // Trích xuất các giá trị RGB từ chuỗi rgb(r,g,b)
      const rgbMatch = hex.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return `${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}`;
      }
      return "255, 255, 255"; // Fallback nếu không thể xử lý
    }
    
    // Loại bỏ dấu # nếu có
    hex = hex.replace(/^#/, '');
    
    // Xử lý cả mã hex ngắn (3 ký tự) và dài (6 ký tự)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Kiểm tra định dạng hex hợp lệ và xử lý nếu không hợp lệ
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn(`Invalid hex color format: ${hex}, using fallback`);
      return "255, 255, 255"; // Return white as fallback
    }
    
    // Chuyển đổi sang RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  } catch (error) {
    console.error(`Error converting hex to RGB: ${error.message}, using fallback`);
    return "255, 255, 255"; // Return white as fallback
  }
}

function parseColor(color, fallback = "#ffffff") {
  try {
    // Nếu không có màu, sử dụng fallback
    if (!color) return fallback;
    
    // Nếu đã là màu RGB hoặc hex hợp lệ, trả về trực tiếp
    if (typeof color === 'string') {
      if (color.startsWith('rgb')) {
        return color;
      }
      if (color.startsWith('#')) {
        // Kiểm tra nếu là hex hợp lệ
        const hex = color.replace(/^#/, '');
        if (/^[0-9A-Fa-f]{3}$/.test(hex) || /^[0-9A-Fa-f]{6}$/.test(hex)) {
          return color;
        }
        // Nếu không hợp lệ, dùng fallback
        console.warn(`Invalid hex color: ${color}, using fallback`);
        return fallback;
      }
    }
    
    // Xử lý các tên màu định sẵn
    const predefinedColors = {
      red: "#ff0000",
      green: "#00ff00",
      blue: "#0000ff",
      yellow: "#ffff00",
      white: "#ffffff",
      black: "#000000",
      orange: "#ffa500",
      purple: "#800080",
      gray: "#808080",
      grey: "#808080",
      lightgray: "#d3d3d3",
      lightgrey: "#d3d3d3",
      darkgray: "#a9a9a9",
      darkgrey: "#a9a9a9"
    };
    
    if (typeof color === 'string' && predefinedColors[color.toLowerCase()]) {
      return predefinedColors[color.toLowerCase()];
    }
    
    // Nếu màu không hợp lệ, sử dụng fallback
    console.warn(`Unknown color format: ${color}, using fallback`);
    return fallback;
  } catch (error) {
    console.error(`Error in parseColor: ${error.message}, using fallback`, error);
    return fallback;
  }
}

const defaultFishImagePaths = {
  trash: path.join(__dirname, "../fishing/trash.jpg"),
  common: path.join(__dirname, "../fishing/common.jpg"),
  uncommon: path.join(__dirname, "../fishing/uncommon.jpg"),
  rare: path.join(__dirname, "../fishing/rare.jpg"),
  legendary: path.join(__dirname, "../fishing/legendary.jpg"),
  mythical: path.join(__dirname, "../fishing/mythical.jpg"),
  cosmic: path.join(__dirname, "../fishing/cosmic.jpg"),
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

const assetsDir = path.join(__dirname, "../fishing");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

/**
 * Create placeholder fish images if they don't exist
 */
async function createPlaceholderFishImages() {
  // Ensure the fishing assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create placeholder images for each rarity if they don't exist
  for (const [rarity, imagePath] of Object.entries(defaultFishImagePaths)) {
    if (!fs.existsSync(imagePath)) {
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext("2d");

      // Fill with gradient based on rarity
      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      const colors = rarityColors[rarity]?.gradient || ["#cccccc", "#aaaaaa"];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);

      // Draw fish icon
      ctx.font = "120px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fishIcons[rarity] || fishIcons.default, 100, 100);

      // Save the image
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imagePath, buffer);
    }
  }
}

/**
 * Get avatar path for a user
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Path to avatar image
 */
async function getAvatarPath(userId) {
  try {
    // Ensure avatars directory exists
    const avatarsDir = path.join(__dirname, "../commands/cache/avatars");
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // Check for default avatar and create if needed
    const defaultAvatarPath = path.join(avatarsDir, "avatar.jpg");
    if (!fs.existsSync(defaultAvatarPath)) {
      try {
        console.log("⚠️ Default avatar not found, creating one...");
        const defaultCanvas = createCanvas(200, 200);
        const ctx = defaultCanvas.getContext("2d");

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, "#1e3c72");
        gradient.addColorStop(1, "#2a5298");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        // Draw question mark
        ctx.font = "bold 120px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("?", 100, 100);

        // Save to file
        const buffer = defaultCanvas.toBuffer("image/jpeg");
        fs.writeFileSync(defaultAvatarPath, buffer);
        console.log("✅ Default avatar created successfully");
      } catch (err) {
        console.error("Error creating default avatar:", err);
      }
    }

    // Check cache
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
        return avatarPath;
      }
    }

    try {
      const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios.get(avatarUrl, {
        responseType: "arraybuffer",
        validateStatus: (status) => status >= 200 && status < 300,
      });

      fs.writeFileSync(avatarPath, response.data);
      fs.writeFileSync(metadataPath, JSON.stringify({ timestamp: Date.now() }));

      return avatarPath;
    } catch (apiError) {
      console.error(
        `Error getting avatar for ${userId} from API:`,
        apiError.message
      );
      return defaultAvatarPath;
    }
  } catch (error) {
    console.error(`Error in getAvatarPath for ${userId}:`, error.message);
    const defaultAvatarPath = path.join(__dirname, "../commands/cache/avatars/avatar.jpg");
    if (fs.existsSync(defaultAvatarPath)) {
      return defaultAvatarPath;
    }
    return null;
  }
}

/**
 * Draw particle effects on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} rarity - Fish rarity
 */
function drawParticleEffects(ctx, width, height, rarity) {
  // Get color safely with a fallback
  const colors = rarityColors[rarity] || rarityColors.common;
  const particleColor = parseColor(colors?.primary, "#ffffff");
  const particleCount =
    rarity === "legendary" || rarity === "mythical" || rarity === "cosmic"
      ? 80
      : 40;

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

  // Reset alpha
  ctx.globalAlpha = 1;
}

/**
 * Draw a rounded rectangle with optional border
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} radius - Corner radius
 * @param {boolean} fill - Whether to fill the rectangle
 * @param {boolean} stroke - Whether to stroke the rectangle
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
 * Draw water/bubble effects on the canvas background
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} rarity - Fish rarity
 */
function drawWaterEffects(ctx, width, height, rarity) {
  // Get color based on rarity with proper fallback
  const colors = rarityColors[rarity] || rarityColors.common;
  const bubbleColor = parseColor(colors?.secondary, "#3498db");

  // Draw larger wave patterns
  ctx.save();
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 5; i++) {
    const y = Math.random() * height;
    const amplitude = 15 + Math.random() * 20;
    const frequency = 0.01 + Math.random() * 0.02;
    const lineWidth = 10 + Math.random() * 30;

    ctx.strokeStyle = bubbleColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let x = 0; x < width; x += 5) {
      const waveY = y + amplitude * Math.sin(frequency * x);
      if (x === 0) {
        ctx.moveTo(x, waveY);
      } else {
        ctx.lineTo(x, waveY);
      }
    }

    ctx.stroke();
  }
  ctx.restore();

  const bubbleCount =
    rarity === "legendary" || rarity === "mythical" || rarity === "cosmic"
      ? 40
      : 20;

  ctx.save();
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < bubbleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 3 + Math.random() * 8;

    const gradient = ctx.createRadialGradient(
      x - size / 3,
      y - size / 3,
      0,
      x,
      y,
      size
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    try {
      // Use enhanced error handling for color parsing
      let rgbColor = "255, 255, 255"; // Default white
      if (bubbleColor) {
        rgbColor = hexToRgb(parseColor(bubbleColor, "#3498db"));
      }
      gradient.addColorStop(0.5, `rgba(${rgbColor}, 0.4)`);
    } catch (error) {
      console.warn(`Failed to parse bubble color: ${error.message}. Using fallback.`);
      gradient.addColorStop(0.5, "rgba(52, 152, 219, 0.4)"); // Default blue
    }
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Load image from URL with proper error handling and caching
 * @param {string} imageUrl - URL or path to the image
 * @returns {Promise<Image>} - Loaded image
 */
async function loadImageWithCache(imageUrl) {
  try {
    // Skip if no image URL provided
    if (!imageUrl) return null;

    // Create cache directory if it doesn't exist
    const imageCacheDir = path.join(__dirname, "../commands/cache/fish_images");
    if (!fs.existsSync(imageCacheDir)) {
      fs.mkdirSync(imageCacheDir, { recursive: true });
    }

    // Generate cache filename based on URL hash
    const imageHash = require('crypto')
      .createHash('md5')
      .update(imageUrl)
      .digest('hex');
    const cachedImagePath = path.join(imageCacheDir, `${imageHash}.png`);

    // Check if image already exists in cache
    if (fs.existsSync(cachedImagePath)) {
      return await loadImage(cachedImagePath);
    }

    // If URL is local path and exists, load directly
    if (fs.existsSync(imageUrl)) {
      return await loadImage(imageUrl);
    }

    // Handle remote URLs (like Imgur)
    if (imageUrl.startsWith('http')) {
      console.log(`Downloading fish image from: ${imageUrl}`);
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Save to cache
      fs.writeFileSync(cachedImagePath, Buffer.from(response.data));
      return await loadImage(cachedImagePath);
    }

    return null;
  } catch (error) {
    console.error(`Failed to load image from ${imageUrl}: ${error.message}`);
    return null;
  }
}

/**
 * Create fishing result image
 * @param {Object} options - Options for creating the result image
 * @returns {Promise<string>} - Path to the generated image
 */
async function createFishResultImage(options) {
  try {
    const {
      userId,
      userName = "Người chơi",
      fish = {
        name: "Cá Thường",
        rarity: "common",
        value: 1000,
        originalValue: 1000,
        taxRate: 0,
        taxAmount: 0,
        exp: 10,
        image: null, 
      },
      fishingData = {
        rod: "Cần trúc",
        rodDurability: 10,
        maxRodDurability: 10,
        level: 1,
        exp: 0,
        requiredExp: 1000,
        streak: 1,
      },
      streakBonus = 0,
      vipBenefits = null,
    } = options;

    // Create canvas with increased size for better details
    const width = 900;
    const height = 1300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Ensure placeholder images exist
    await createPlaceholderFishImages();

    // Get fish rarity and properties with fallback
    const rarity = fish.rarity || "common";
    const rarityColor = rarityColors[rarity] || rarityColors.common;

    // Create more dynamic background gradient based on fish rarity
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);

    try {
      switch (rarity) {
        case "trash": {
          const textWidth = ctx.measureText("RÁC").width;
          const bgWidth = Math.max(200, textWidth + 80); 
          bgGradient.addColorStop(0, "#1e272e");
          bgGradient.addColorStop(0.5, "#2d3436");
          bgGradient.addColorStop(1, "#1e272e");
          break;
        }
        case "common": {
          const textWidth = ctx.measureText("PHỔ THÔNG").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#0f2027");
          bgGradient.addColorStop(0.5, "#203a43");
          bgGradient.addColorStop(1, "#2c5364");
          break;
        }
        case "uncommon": {
          const textWidth = ctx.measureText("KHÔNG PHỔ BIẾN").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#373B44");
          bgGradient.addColorStop(5, "#4286f4");
          bgGradient.addColorStop(1, "#373B44");
          break;
        }
        case "rare": {
          const textWidth = ctx.measureText("HIẾM").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#4b134f");
          bgGradient.addColorStop(0.5, "#8e44ad");
          bgGradient.addColorStop(1, "#4b134f");
          break;
        }
        case "legendary": {
          const textWidth = ctx.measureText("CỰC HIẾM").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#c31432");
          bgGradient.addColorStop(0.5, "#240b36");
          bgGradient.addColorStop(1, "#c31432");
          break;
        }
        case "mythical": {
          const textWidth = ctx.measureText("HUYỀN THOẠI").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#ff0844");
          bgGradient.addColorStop(0.5, "#8b0000");
          bgGradient.addColorStop(1, "#ff0844");
          break;
        }
        case "cosmic": {
          const textWidth = ctx.measureText("THẦN THOẠI").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#03001e");
          bgGradient.addColorStop(0.33, "#7303c0");
          bgGradient.addColorStop(0.66, "#1e9600");
          bgGradient.addColorStop(1, "#03001e");
          break;
        }
        default: {
          const textWidth = ctx.measureText("PHỔ THÔNG").width;
          const bgWidth = Math.max(200, textWidth + 80);
          bgGradient.addColorStop(0, "#0f2027");
          bgGradient.addColorStop(0.5, "#203a43");
          bgGradient.addColorStop(1, "#2c5364");
        }
      }
    } catch (error) {
      console.warn(`Error creating background gradient: ${error.message}. Using default.`);
      bgGradient.addColorStop(0, "#0f2027");
      bgGradient.addColorStop(0.5, "#203a43");
      bgGradient.addColorStop(1, "#2c5364");
    }

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    drawParticleEffects(ctx, width, height, rarity);

    drawWaterEffects(ctx, width, height, rarity);

    // Safely create gradient colors
    try {
      ctx.strokeStyle = `rgba(${hexToRgb(parseColor(rarityColor.primary, "#ffffff"))}, 0.1)`;
    } catch (error) {
      console.warn(`Error setting stroke style: ${error.message}. Using default.`);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    }
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const cornerSize = 40;
    const drawCorner = (x, y, flipX, flipY) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.strokeStyle = rarityColor.primary;
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

    const headerHeight = 160;
    try {
      const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
      
      // Xử lý màu primary với kiểm tra kỹ hơn
      let primaryRgb = "255, 255, 255"; // Giá trị mặc định
      if (rarityColor && rarityColor.primary) {
        const primaryHex = parseColor(rarityColor.primary, "#ffffff");
        primaryRgb = hexToRgb(primaryHex);
      }
      
      // Xử lý màu secondary với kiểm tra kỹ hơn
      let secondaryRgb = "255, 255, 255"; // Giá trị mặc định
      if (rarityColor && rarityColor.secondary) {
        const secondaryHex = parseColor(rarityColor.secondary, "#ffffff");
        secondaryRgb = hexToRgb(secondaryHex);
      }
      
      // Đảm bảo định dạng RGBA hợp lệ
      headerGradient.addColorStop(0, `rgba(${primaryRgb}, 0.8)`);
      headerGradient.addColorStop(1, `rgba(${secondaryRgb}, 0.8)`);
      ctx.fillStyle = headerGradient;
    } catch (error) {
      console.warn(`Error creating header gradient: ${error.message}. Using default.`);
      ctx.fillStyle = "rgba(20, 40, 60, 0.8)";
    }
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.shadowColor = rarityColor.primary;
    ctx.shadowBlur = 20;
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("KẾT QUẢ CÂU CÁ", width / 2, 90);
    ctx.shadowBlur = 0;

    ctx.font = "bold 26px Arial";
    ctx.fillStyle = rarityColor.primary;
    const rarityNames = {
      trash: "RÁC",
      common: "PHỔ THÔNG",
      uncommon: "KHÔNG PHỔ BIẾN",
      rare: "HIẾM",
      legendary: "CỰC HIẾM",
      mythical: "HUYỀN THOẠI",
      cosmic: "THẦN THOẠI",
    };
    ctx.fillText(
      `• ${rarityNames[rarity] || rarity.toUpperCase()} •`,
      width / 2,
      130
    );

    const lineGradient = ctx.createLinearGradient(100, 150, width - 100, 150);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    lineGradient.addColorStop(0.5, rarityColor.primary);
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(width - 100, 150);
    ctx.stroke();

    const avatarOffsetY = 200;
    try {
      const avatarPath = await getAvatarPath(userId);

      if (avatarPath) {
        const avatar = await loadImage(avatarPath);

        ctx.save();
        ctx.shadowColor = rarityColor.primary;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 55, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = rarityColor.primary;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, avatarOffsetY, 100, 100);
        ctx.restore();

        ctx.strokeStyle = rarityColor.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(100, 50 + avatarOffsetY, 50, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch (error) {
      console.error("Error drawing avatar:", error);
    }

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 5;
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`${userName}`, 170, 50 + avatarOffsetY - 15);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";

    ctx.strokeText(
      `🎮 Cấp độ: ${fishingData.level} | 🔥 Chuỗi câu: ${fishingData.streak}`,
      170,
      50 + avatarOffsetY + 15
    );

    const levelGradient = ctx.createLinearGradient(
      170,
      50 + avatarOffsetY + 15,
      500,
      50 + avatarOffsetY + 15
    );
    levelGradient.addColorStop(0, "#90caf9");
    levelGradient.addColorStop(0.5, "#42a5f5");
    levelGradient.addColorStop(1, "#1565c0");

    ctx.fillStyle = levelGradient;
    ctx.fillText(
      `🎮 Cấp độ: ${fishingData.level} | 🔥 Chuỗi câu: ${fishingData.streak}`,
      170,
      50 + avatarOffsetY + 15
    );

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.strokeText(
      `🎮 Cấp độ: ${fishingData.level} | 🔥 Chuỗi câu: ${fishingData.streak}`,
      170,
      50 + avatarOffsetY + 15
    );
    ctx.restore();

    const fishSectionY = 350;
    const fishSectionHeight = 360;

    ctx.save();
    const fishSectionGradient = ctx.createLinearGradient(
      50,
      fishSectionY,
      width - 50,
      fishSectionY + fishSectionHeight
    );

    try {
      // Sử dụng hàm an toàn để tạo màu rgba từ hex
      const safeRarityPrimary = parseColor(rarityColor?.primary, "#2ecc71");
      const safeRaritySecondary = parseColor(rarityColor?.secondary, "#27ae60");
      
      // Sử dụng màu với độ trong suốt
      fishSectionGradient.addColorStop(0, safeHexToRgba(safeRarityPrimary, 0.3));
      fishSectionGradient.addColorStop(0.5, "rgba(20, 40, 60, 0.6)");
      fishSectionGradient.addColorStop(1, safeHexToRgba(safeRaritySecondary, 0.3));
    } catch (error) {
      console.error("Error creating fish section gradient:", error);
      // Fallback to safe colors if there's any error
      fishSectionGradient.addColorStop(0, "rgba(20, 40, 60, 0.8)");
      fishSectionGradient.addColorStop(0.5, "rgba(30, 50, 70, 0.6)");
      fishSectionGradient.addColorStop(1, "rgba(40, 60, 80, 0.8)");
    }

    ctx.fillStyle = fishSectionGradient;
    roundRect(
      ctx,
      50,
      fishSectionY,
      width - 100,
      fishSectionHeight,
      30,
      true,
      false
    );

    ctx.shadowColor = rarityColor.primary;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = rarityColor.primary;
    ctx.lineWidth = 3;
    roundRect(
      ctx,
      50,
      fishSectionY,
      width - 100,
      fishSectionHeight,
      30,
      false,
      true
    );
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.shadowColor = rarityColor.primary;
    ctx.shadowBlur = 15;
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${fish.name}`, width / 2, fishSectionY + 50);
    ctx.restore();

    const rarityName = rarityNames[rarity] || rarity.toUpperCase();
    const rarityTextWidth = ctx.measureText(rarityName).width;
    const badgeWidth = Math.max(200, rarityTextWidth + 60);
    const badgeHeight = 50;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = fishSectionY + 70;

    const badgeGradient = ctx.createLinearGradient(
      badgeX,
      badgeY,
      badgeX + badgeWidth,
      badgeY + badgeHeight
    );
    badgeGradient.addColorStop(0, rarityColor.primary);
    badgeGradient.addColorStop(1, rarityColor.secondary);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = badgeGradient;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 25, true, false);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 25, false, true);

    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${rarityNames[rarity] || rarity.toUpperCase()}`,
      width / 2,
      badgeY + badgeHeight / 2
    );

    try {
      let fishImage = null;
      
      // Try to load image from fish object directly
      if (fish.image) {
        fishImage = await loadImageWithCache(fish.image);
      }
      
      // If no image from fish object, try loading from config
      if (!fishImage) {
        try {
          // Try multiple possible paths to find the fish config
          const possiblePaths = [
            path.join(__dirname, '../config/fishing/fish.js'),
            path.join(__dirname, '../fishing/fish.js'),
            path.join(__dirname, '../commands/config/fish.js')
          ];
          
          let fishConfig = null;
          
          for (const configPath of possiblePaths) {
            try {
              if (fs.existsSync(configPath)) {
                fishConfig = require(configPath);
                break;
              }
            } catch (e) {
              console.log(`Could not load config from ${configPath}: ${e.message}`);
            }
          }
          
          if (fishConfig && fishConfig[rarity]) {
            const fishData = fishConfig[rarity].find(f => f.name === fish.name);
            if (fishData && fishData.image) {
              fishImage = await loadImageWithCache(fishData.image);
            }
          }
        } catch (configError) {
          console.log(`Could not load fish config: ${configError.message}`);
        }
      }
      
      // If still no image, use default
      if (!fishImage) {
        const fishImagePath = defaultFishImagePaths[rarity];
        if (fs.existsSync(fishImagePath)) {
          fishImage = await loadImage(fishImagePath);
        }
      }
      
      // Draw the image if we have one
      if (fishImage) {
        ctx.save();
        ctx.shadowColor = rarityColor.primary;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(width / 2, fishSectionY + 200, 90, 0, Math.PI * 2);
        try {
          const safeRarityPrimary = parseColor(rarityColor?.primary, "#ffffff");
          ctx.fillStyle = safeHexToRgba(safeRarityPrimary, 0.3);
        } catch (error) {
          console.warn(`Error setting fill style: ${error.message}. Using default.`);
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        }
        ctx.fill();
        ctx.restore();

        const imageSize = 180;
        ctx.drawImage(
          fishImage,
          (width - imageSize) / 2,
          fishSectionY + 120,
          imageSize,
          imageSize
        );
      } else {
        // Fallback to icon if no image
        ctx.save();
        ctx.shadowColor = rarityColor.primary;
        ctx.shadowBlur = 15;
        ctx.font = "140px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(
          fishIcons[rarity] || fishIcons.default,
          width / 2,
          fishSectionY + 200
        );
        ctx.restore();
      }
    } catch (error) {
      console.error("Error drawing fish image:", error);
      // Fallback to drawing a fish icon
      ctx.save();
      ctx.shadowColor = rarityColor.primary;
      ctx.shadowBlur = 15;
      ctx.font = "140px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(
        fishIcons[rarity] || fishIcons.default,
        width / 2,
        fishSectionY + 200
      );
      ctx.restore();
    }

    // Fish value section with enhanced styling
    const valueY = fishSectionY + 320;

    // Draw decorative diamond shapes on the sides
    const drawDiamond = (x, y, size, color) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y);
      ctx.lineTo(x, y + size / 2);
      ctx.lineTo(x - size / 2, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    drawDiamond(100, valueY - 10, 20, rarityColor.primary);
    drawDiamond(width - 100, valueY - 10, 20, rarityColor.secondary);

    // Draw separation line
    const separationGradient = ctx.createLinearGradient(
      120,
      valueY - 10,
      width - 120,
      valueY - 10
    );
    separationGradient.addColorStop(0, rarityColor.primary);
    separationGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
    separationGradient.addColorStop(1, rarityColor.secondary);

    ctx.strokeStyle = separationGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(120, valueY - 10);
    ctx.lineTo(width - 120, valueY - 10);
    ctx.stroke();

    // Fish value with colored gradients
    const valueGradient = ctx.createLinearGradient(
      width / 2 - 200,
      valueY + 35,
      width / 2 + 200,
      valueY + 35
    );
    valueGradient.addColorStop(0, "#f7b733");
    valueGradient.addColorStop(1, "#fc4a1a");

    ctx.save();
    ctx.shadowColor = "rgba(247, 183, 51, 0.5)";
    ctx.shadowBlur = 10;
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = valueGradient;
    ctx.textAlign = "center";
    ctx.fillText(
      `💰 Giá gốc: ${formatNumber(fish.originalValue)} $`,
      width / 2,
      valueY + 15
    );
    ctx.restore();

    if (fish.taxAmount > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(231, 76, 60, 0.5)";
      ctx.shadowBlur = 5;
      ctx.font = "22px Arial";
      ctx.fillStyle = "#e74c3c";
      ctx.textAlign = "center";
      ctx.fillText(
        `📋 Thuế: ${formatNumber(fish.taxAmount)} $ (${(
          fish.taxRate * 100
        ).toFixed(1)}%)`,
        width / 2,
        valueY + 65
      );
      ctx.restore();
    }

    // Net value with enhanced styling and highlight
    ctx.save();
    // Đo chiều rộng của text để điều chỉnh kích thước background
    const netValueText = `💵 Thực nhận: ${formatNumber(fish.value)} $`;
    ctx.font = "bold 30px Arial";
    const textWidth = ctx.measureText(netValueText).width;

    // Tính toán chiều rộng background dựa trên text + padding
    const netValueBgWidth = Math.max(textWidth + 80, 300); // Tối thiểu 300px, padding 80px
    const netValueBgHeight = 60; // Tăng chiều cao từ 50 lên 60
    const netValueBgX = (width - netValueBgWidth) / 2;
    const netValueBgY = valueY + 85;

    // Tạo hai lớp background: lớp trong và lớp ngoài để tăng độ nổi bật
    // Lớp ngoài - shadow glow
    ctx.shadowColor = "rgba(46, 204, 113, 0.8)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Nền tối hơn tạo tương phản
    roundRect(
      ctx,
      netValueBgX - 2,
      netValueBgY - 2,
      netValueBgWidth + 4,
      netValueBgHeight + 4,
      18,
      true,
      false
    );
    ctx.shadowBlur = 0;

    // Lớp trong - gradient mạnh hơn
    const netBgGradient = ctx.createLinearGradient(
      netValueBgX,
      netValueBgY,
      netValueBgX + netValueBgWidth,
      netValueBgY + netValueBgHeight
    );
    netBgGradient.addColorStop(0, "rgba(46, 204, 113, 0.4)"); // Tăng độ đậm (0.2 -> 0.4)
    netBgGradient.addColorStop(0.5, "rgba(42, 187, 103, 0.5)"); // Thêm điểm dừng giữa
    netBgGradient.addColorStop(1, "rgba(39, 174, 96, 0.4)"); // Tăng độ đậm (0.2 -> 0.4)

    ctx.fillStyle = netBgGradient;
    roundRect(
      ctx,
      netValueBgX,
      netValueBgY,
      netValueBgWidth,
      netValueBgHeight,
      15,
      true,
      false
    );

    // Viền đậm và sáng hơn
    ctx.strokeStyle = "rgba(46, 204, 113, 0.8)"; // Tăng độ đậm (0.5 -> 0.8)
    ctx.lineWidth = 3; // Tăng độ dày viền (2 -> 3)
    roundRect(
      ctx,
      netValueBgX,
      netValueBgY,
      netValueBgWidth,
      netValueBgHeight,
      15,
      false,
      true
    );

    // Text with glow effect - sử dụng thêm stroke để tạo viền đen
    const netGradient = ctx.createLinearGradient(
      width / 2 - 200,
      valueY + 115,
      width / 2 + 200,
      valueY + 115
    );
    netGradient.addColorStop(0, "#2ecc71");
    netGradient.addColorStop(0.5, "#66ff99"); // Thêm màu sáng ở giữa
    netGradient.addColorStop(1, "#27ae60");

    // Viền đen cho text tạo độ tương phản
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(netValueText, width / 2, netValueBgY + netValueBgHeight / 2);

    // Text chính với hiệu ứng glow
    ctx.shadowColor = "rgba(46, 204, 113, 0.9)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = netGradient;
    ctx.fillText(netValueText, width / 2, netValueBgY + netValueBgHeight / 2);
    ctx.restore();

    // Add VIP benefits section if applicable with enhanced styling
    let nextY = valueY + 170;
    if (vipBenefits) {
      // Create a special VIP badge
      const vipBadgeWidth = 450;
      const vipBadgeHeight = 90;
      const vipBadgeX = (width - vipBadgeWidth) / 2;
      const vipBadgeY = nextY;

      // Badge background with glowing effect
      ctx.save();
      ctx.shadowColor = "rgba(241, 196, 15, 0.5)";
      ctx.shadowBlur = 10;
      const vipBgGradient = ctx.createLinearGradient(
        vipBadgeX,
        vipBadgeY,
        vipBadgeX + vipBadgeWidth,
        vipBadgeY + vipBadgeHeight
      );
      vipBgGradient.addColorStop(0, "rgba(241, 196, 15, 0.3)");
      vipBgGradient.addColorStop(1, "rgba(243, 156, 18, 0.3)");

      ctx.fillStyle = vipBgGradient;
      roundRect(
        ctx,
        vipBadgeX,
        vipBadgeY,
        vipBadgeWidth,
        vipBadgeHeight,
        15,
        true,
        false
      );
      ctx.restore();

      // Badge border
      ctx.strokeStyle = "rgba(241, 196, 15, 0.7)";
      ctx.lineWidth = 2;
      roundRect(
        ctx,
        vipBadgeX,
        vipBadgeY,
        vipBadgeWidth,
        vipBadgeHeight,
        15,
        false,
        true
      );

      // VIP level stars
      const vipIcon =
        vipBenefits.packageId === 3
          ? "⭐⭐⭐"
          : vipBenefits.packageId === 2
          ? "⭐⭐"
          : "⭐";

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.shadowColor = "rgba(241, 196, 15, 0.9)";
      ctx.shadowBlur = 12;
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.strokeText(
        `VIP ${vipBenefits.packageId} ${vipIcon}`,
        width / 2,
        vipBadgeY + 30
      );
      ctx.fillStyle = "#ffde59";
      ctx.fillText(
        `VIP ${vipBenefits.packageId} ${vipIcon}`,
        width / 2,
        vipBadgeY + 30
      );

      // Draw VIP benefit icons
      ctx.font = "22px Arial";

      // EXP bonus
      const expIconX = vipBadgeX + 60;
      ctx.textAlign = "left";
      ctx.fillText(
        `✨ EXP x${vipBenefits.fishExpMultiplier || 1}`,
        expIconX,
        vipBadgeY + 65
      );

      // $ bonus
      const xuIconX = vipBadgeX + 270;
      ctx.fillText(
        `💰 $ +${vipBenefits.packageId * 5 || 0}%`,
        xuIconX,
        vipBadgeY + 65
      );
      ctx.restore();

      nextY += vipBadgeHeight + 20;
    } else {
      nextY += 20;
    }

    // EXP gain information with enhanced styling
    const expBadgeWidth = 300;
    const expBadgeHeight = 60;
    const expBadgeX = (width - expBadgeWidth) / 2;
    const expBadgeY = nextY;
    // Thay đổi phần hiển thị EXP badge với màu nền tương phản hơn
    // Badge background with improved contrast
    ctx.save();
    ctx.shadowColor = "rgba(162, 155, 254, 0.5)";
    ctx.shadowBlur = 8;
    const expBgGradient = ctx.createLinearGradient(
      expBadgeX,
      expBadgeY,
      expBadgeX + expBadgeWidth,
      expBadgeY + expBadgeHeight
    );

    // Thay đổi màu nền sang tối hơn để tạo tương phản với text
    expBgGradient.addColorStop(0, "rgba(43, 30, 91, 0.7)"); // Tối hơn, đậm hơn
    expBgGradient.addColorStop(1, "rgba(29, 17, 71, 0.7)"); // Tối hơn, đậm hơn

    ctx.fillStyle = expBgGradient;
    roundRect(
      ctx,
      expBadgeX,
      expBadgeY,
      expBadgeWidth,
      expBadgeHeight,
      20,
      true,
      false
    );
    ctx.restore();

    // Badge border with glowing effect
    ctx.save();
    ctx.shadowColor = "rgba(162, 155, 254, 0.9)";
    ctx.shadowBlur = 10; // Tăng độ blur
    ctx.strokeStyle = "rgba(190, 180, 255, 0.9)"; // Sáng hơn để nổi bật
    ctx.lineWidth = 2;
    roundRect(
      ctx,
      expBadgeX,
      expBadgeY,
      expBadgeWidth,
      expBadgeHeight,
      20,
      false,
      true
    );
    ctx.restore();

    // EXP text with improved visibility
    ctx.save();
    // Thêm viền đen cho chữ
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(
      `📊 EXP: +${formatNumber(fish.exp)}`,
      width / 2,
      expBadgeY + expBadgeHeight / 2
    );

    // Tăng độ sáng và cường độ cho text
    ctx.shadowColor = "rgba(162, 155, 254, 1.0)"; // Alpha cao hơn
    ctx.shadowBlur = 8; // Tăng độ blur
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const expGradient = ctx.createLinearGradient(
      width / 2 - 150,
      expBadgeY + expBadgeHeight / 2,
      width / 2 + 150,
      expBadgeY + expBadgeHeight / 2
    );
    expGradient.addColorStop(0, "#d8d6ff"); // Sáng hơn, gần trắng hơn
    expGradient.addColorStop(1, "#a29bfe"); // Giữ màu tím nhưng sáng hơn

    ctx.fillStyle = expGradient;
    ctx.fillText(
      `📊 EXP: +${formatNumber(fish.exp)}`,
      width / 2,
      expBadgeY + expBadgeHeight / 2
    );
    ctx.restore();

    nextY += expBadgeHeight + 10;

    // Progress bar section with enhanced styling
    const progressY = nextY;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 5;
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("Tiến độ cấp độ", 70, progressY - 40);
    ctx.restore();

    const levelInfoBoxWidth = 600;
    const levelInfoBoxHeight = 50;
    const levelInfoBoxX = (width - levelInfoBoxWidth) / 2;
    const levelInfoY = progressY + 30;

    ctx.save();
    ctx.fillStyle = "rgba(52, 152, 219, 0.1)";
    roundRect(
      ctx,
      levelInfoBoxX,
      levelInfoY - 30,
      levelInfoBoxWidth,
      levelInfoBoxHeight,
      10,
      true,
      false
    );
    ctx.strokeStyle = "rgba(52, 152, 219, 0.3)";
    ctx.lineWidth = 1;
    roundRect(
      ctx,
      levelInfoBoxX,
      levelInfoY - 30,
      levelInfoBoxWidth,
      levelInfoBoxHeight,
      10,
      false,
      true
    );
    ctx.restore();

    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(
      `Cấp ${fishingData.level}`,
      levelInfoBoxX + 20,
      levelInfoY - 5
    );

    // Arrow icon
    ctx.fillText(`→`, levelInfoBoxX + 110, levelInfoY - 5);

    // Next level with highlight
    ctx.save();
    ctx.shadowColor = "rgba(52, 152, 219, 0.7)";
    ctx.shadowBlur = 10; // Tăng từ 5 lên 10
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#3498db";
    ctx.fillText(
      `Cấp ${fishingData.level + 1}`,
      levelInfoBoxX + 150,
      levelInfoY - 5
    );
    ctx.restore();

    // Experience numbers
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${formatNumber(fishingData.exp)}/${formatNumber(
        fishingData.requiredExp
      )}`,
      levelInfoBoxX + levelInfoBoxWidth - 20,
      levelInfoY - 5
    );

    // Enhanced progress bar with animation effect
    const barY = progressY + 60;
    const barWidth = width - 140;
    const barHeight = 40;
    const progress = Math.min(
      100,
      (fishingData.exp / fishingData.requiredExp) * 100
    );
    const addSeparator = (y) => {
      const separatorGradient = ctx.createLinearGradient(
        100,
        y,
        width - 100,
        y
      );
      separatorGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      separatorGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
      separatorGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

      ctx.strokeStyle = separatorGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, y);
      ctx.lineTo(width - 100, y);
      ctx.stroke();
    };

    addSeparator(avatarOffsetY + 100);
    addSeparator(valueY - 20);
    addSeparator(nextY - 10);
    // Add shadow to the bar container
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    // Bar background with inner shadow effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    roundRect(ctx, 70, barY, barWidth, barHeight, 15, true, false);

    // Fill progress bar with gradient
    const progressBarWidth = (barWidth * progress) / 100;
    const progressGradient = ctx.createLinearGradient(
      70,
      barY,
      70 + progressBarWidth,
      barY
    );
    progressGradient.addColorStop(0, "#4CAF50");
    progressGradient.addColorStop(0.5, "#8BC34A");
    progressGradient.addColorStop(1, "#CDDC39");

    ctx.fillStyle = progressGradient;
    roundRect(ctx, 70, barY, progressBarWidth, barHeight, 15, true, false);
    ctx.restore();

    // Draw progress text
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(progress)}%`, width / 2, barY + barHeight / 2);

    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(
      tempDir,
      `fish_result_${userId}_${Date.now()}.png`
    );
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating fish result image:", error);
    throw error;
  }
}

/**
 * Create fishing collection image showing user's fish collection
 * @param {Object} options - Collection options
 * @returns {Promise<string>} - Path to the generated image
 */
async function createCollectionImage(options) {
  try {
    const {
      userId,
      userName = "Người chơi",
      collection = {
        byRarity: {},
        stats: {
          totalCaught: 0,
          totalValue: 0,
          bestCatch: { name: "Chưa có", value: 0 },
        },
      },
      level = 1,
    } = options;

    // Create canvas
    const width = 900;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Create gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0f2027");
    bgGradient.addColorStop(0.5, "#203a43");
    bgGradient.addColorStop(1, "#2c5364");

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative elements
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
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
    for (let i = 0; i < width; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 100) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Header section
    const headerHeight = 150;
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, "rgba(20, 40, 60, 0.8)");
    headerGradient.addColorStop(1, "rgba(30, 50, 70, 0.8)");
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    // Title with glow effect
    ctx.shadowColor = "rgba(64, 224, 208, 0.8)";
    ctx.shadowBlur = 15;
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("BỘ SƯU TẬP CÁ", width / 2, 90);
    ctx.shadowBlur = 0;

    // Add decorative line
    const lineGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
    lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    lineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
    lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 120);
    ctx.lineTo(width - 100, 120);
    ctx.stroke();

    // User info section
    try {
      const avatarPath = await getAvatarPath(userId);

      if (avatarPath) {
        const avatar = await loadImage(avatarPath);
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(100, 200, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 150, 100, 100);
        ctx.restore();

        // Add avatar border
        ctx.strokeStyle = "#1abc9c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(100, 200, 50, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch (error) {
      console.error("Error drawing avatar:", error);
    }

    // User name and ID
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`${userName}`, 170, 190);

    // User stats
    ctx.font = "20px Arial";
    ctx.fillStyle = "#9fe8ff";
    ctx.fillText(
      `📊 Cấp độ: ${level} | 🎣 Tổng số cá: ${formatNumber(
        collection.stats.totalCaught || 0
      )}`,
      170,
      220
    );

    // Collection stats section
    const statsY = 270;

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(50, statsY, width - 100, 100);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(50, statsY, width - 100, 100);

    // Stats info
    const statsGradient = ctx.createLinearGradient(
      70,
      statsY + 30,
      300,
      statsY + 30
    );
    statsGradient.addColorStop(0, "#f7b733");
    statsGradient.addColorStop(1, "#fc4a1a");
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = statsGradient;
    ctx.textAlign = "left";
    ctx.fillText(
      `💰 Tổng giá trị: ${formatNumber(collection.stats.totalValue || 0)} $`,
      70,
      statsY + 35
    );

    const bestCatchName = collection.stats.bestCatch?.name || "Chưa có";
    const bestCatchValue = collection.stats.bestCatch?.value || 0;

    ctx.fillStyle = "#64ffda";
    ctx.fillText(
      `🏆 Cá hiếm nhất: ${bestCatchName} (${formatNumber(bestCatchValue)} $)`,
      70,
      statsY + 70
    );

    // Collection rarity sections
    let startY = 400;

    const rarities = [
      { id: "cosmic", name: "Thần Thoại", color: "#1abc9c" },
      { id: "mythical", name: "Huyền Thoại", color: "#e74c3c" },
      { id: "legendary", name: "Cực Hiếm", color: "#f1c40f" },
      { id: "rare", name: "Hiếm", color: "#9b59b6" },
      { id: "uncommon", name: "Không Phổ Biến", color: "#3498db" },
      { id: "common", name: "Phổ Biến", color: "#2ecc71" },
      { id: "trash", name: "Rác", color: "#7f8c8d" },
    ];

    for (const rarity of rarities) {
      const fishesInRarity = collection.byRarity[rarity.id] || {};
      const fishCount = Object.values(fishesInRarity).reduce(
        (sum, count) => sum + count,
        0
      );

      if (fishCount > 0) {
        // Rarity header
        const headerGradient = ctx.createLinearGradient(
          50,
          startY,
          width - 50,
          startY + 40
        );
        const color = rarity.color;
        headerGradient.addColorStop(0, `${color}33`);
        headerGradient.addColorStop(0.5, `${color}66`);
        headerGradient.addColorStop(1, `${color}33`);

        ctx.fillStyle = headerGradient;
        ctx.fillRect(50, startY, width - 100, 40);
        ctx.strokeStyle = rarity.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(50, startY, width - 100, 40);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(
          `${rarity.name.toUpperCase()} (${fishCount})`,
          70,
          startY + 27
        );

        // Fish list for this rarity
        const fishEntries = Object.entries(fishesInRarity).filter(
          ([_, count]) => count > 0
        );

        if (fishEntries.length > 0) {
          startY += 50;

          // Create a grid layout for fishes
          const itemsPerRow = 3;
          const itemWidth = (width - 120) / itemsPerRow;
          const itemHeight = 60;

          for (let i = 0; i < fishEntries.length; i++) {
            const [fishName, count] = fishEntries[i];
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;

            const x = 60 + col * itemWidth;
            const y = startY + row * itemHeight;

            // Fish item box
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            roundRect(
              ctx,
              x,
              y,
              itemWidth - 10,
              itemHeight - 10,
              10,
              true,
              false
            );

            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            roundRect(
              ctx,
              x,
              y,
              itemWidth - 10,
              itemHeight - 10,
              10,
              false,
              true
            );

            try {
              const fishModule = require('../config/fishing/fish.js');
              const fishList = fishModule[rarity.id] || [];
              const fishData = fishList.find(f => f.name === fishName);
              
              if (fishData && fishData.image) {
                const fishIconSize = 40;
                const fishIcon = await loadImageWithCache(fishData.image);
                if (fishIcon) {
                  ctx.drawImage(fishIcon, x + itemWidth - fishIconSize - 15, y + 10, fishIconSize, fishIconSize);
                }
              }
            } catch (error) {
              console.warn(`Could not load icon for fish: ${fishName}`, error.message);
            }

            ctx.font = "18px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";

            let displayName = fishName;
            if (ctx.measureText(displayName).width > itemWidth - 60) {
              while (
                ctx.measureText(displayName + "...").width >
                itemWidth - 60
              ) {
                displayName = displayName.slice(0, -1);
              }
              displayName += "...";
            }

            ctx.fillText(displayName, x + 15, y + 25);

            ctx.font = "bold 17px Arial";
            ctx.fillStyle = "#64ffda";
            ctx.fillText(`× ${count}`, x + 15, y + 50);
          }

          // Calculate rows needed
          const rows = Math.ceil(fishEntries.length / itemsPerRow);
          startY += rows * itemHeight + 10;
        }
      }
    }

    // Footer with gradient
    const footerHeight = 80;
    const footerY = height - footerHeight;
    const footerGradient = ctx.createLinearGradient(0, footerY, width, height);
    footerGradient.addColorStop(0, "rgba(15, 32, 39, 0.9)");
    footerGradient.addColorStop(1, "rgba(32, 58, 67, 0.9)");
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, footerY, width, footerHeight);

    // AKI Global branding
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("AKI GLOBAL", width / 2, height - 45);

    // Timestamp
    ctx.font = "italic 18px Arial";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(
      `Cập nhật: ${new Date().toLocaleString("vi-VN")}`,
      width / 2,
      height - 20
    );

    // Save and return the image
    const buffer = canvas.toBuffer("image/png");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(
      tempDir,
      `fish_collection_${userId}_${Date.now()}.png`
    );
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating collection image:", error);
    throw error;
  }
}

// Thêm hàm an toàn này để xử lý việc chuyển đổi màu hex sang rgba cho gradients
function safeHexToRgba(hexColor, alpha) {
  try {
    // Đảm bảo có một giá trị color hợp lệ
    if (!hexColor || typeof hexColor !== 'string') {
      return `rgba(0, 0, 0, ${alpha})`; // Fallback to black with alpha
    }
    
    // Đảm bảo bắt đầu bằng #
    if (!hexColor.startsWith('#')) {
      hexColor = '#' + hexColor;
    }
    
    // Xử lý cả hex ngắn (3 ký tự)
    let hex = hexColor.substring(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Kiểm tra định dạng hex hợp lệ
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return `rgba(0, 0, 0, ${alpha})`; // Fallback to black with alpha
    }
    
    // Chuyển đổi sang rgb
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.warn(`Error converting hex to rgba: ${error.message}, using fallback`);
    return `rgba(0, 0, 0, ${alpha})`;
  }
}

// Export the functions
module.exports = {
  createFishResultImage,
  createCollectionImage,
  getAvatarPath,
  rarityColors,
  fishIcons,
  loadImageWithCache,
  safeHexToRgba
};
