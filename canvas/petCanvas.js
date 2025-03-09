const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { getAvatarPath } = require('./fishCanvas');
const USER_DATA_FILE = path.join(__dirname, '../events/cache/userData.json');
let userData = {};

try {
    const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
    userData = JSON.parse(data);
} catch (err) {
    console.error("Không thể đọc file userData.json:", err);
}
function registerFonts() {
  try {
    const fontsDir = path.join(__dirname, '../fonts');
    const fontOptions = [
      { path: 'Roboto-Bold.ttf', family: 'Roboto', weight: 'bold' },
      { path: 'Roboto-Regular.ttf', family: 'Roboto', weight: 'normal' },
      { path: 'Roboto-Light.ttf', family: 'Roboto', weight: 'light' },
      { path: 'Roboto-Medium.ttf', family: 'Roboto', weight: 'medium' }
    ];
    
    fontOptions.forEach(font => {
      const fontPath = path.join(fontsDir, font.path);
      if (fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: font.family, weight: font.weight });
      }
    });
    return true;
  } catch (e) {
    console.error('Không thể đăng ký font:', e);
    return false;
  }
}

// Pet image mapping with support for more pets
const PET_IMAGES = {
  DOG: path.join(__dirname, '../pet/dog.jpg'),
  CAT: path.join(__dirname, '../pet/cat.jpg'),
  HAMSTER: path.join(__dirname, '../pet/hamster.jpg'),
  DEFAULT: path.join(__dirname, '../pet/default.png')
};

// Color themes for different pet types
const PET_THEMES = {
  DOG: {
    background: ['#2193b0', '#3498db', '#6dd5ed'],
    energy: ['#2ecc71', '#27ae60', '#219a52'],
    hunger: ['#e74c3c', '#c0392b', '#962918'],
    happy: ['#f1c40f', '#f39c12', '#d35400'],
    badge: ['#f39c12', '#f1c40f', '#e67e22']
  },
  CAT: {
    background: ['#614385', '#516395', '#4568DC'],
    energy: ['#3498db', '#2980b9', '#1f6aa6'],
    hunger: ['#e74c3c', '#c0392b', '#962918'],
    happy: ['#f1c40f', '#f39c12', '#d35400'],
    badge: ['#9b59b6', '#8e44ad', '#703688']
  },
  HAMSTER: {
    background: ['#FFB75E', '#ED8F03', '#FF9900'],
    energy: ['#2ecc71', '#27ae60', '#219a52'],
    hunger: ['#e74c3c', '#c0392b', '#962918'],
    happy: ['#f1c40f', '#f39c12', '#d35400'],
    badge: ['#f39c12', '#e67e22', '#d35400']
  },
  DEFAULT: {
    background: ['#2193b0', '#3498db', '#6dd5ed'],
    energy: ['#2ecc71', '#27ae60', '#219a52'],
    hunger: ['#e74c3c', '#c0392b', '#962918'],
    happy: ['#f1c40f', '#f39c12', '#d35400'],
    badge: ['#f39c12', '#f1c40f', '#e67e22']
  }
};

// Helper functions
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function createAnimatedShine(ctx, x, y, width, height, angle = 30) {
  const gradient = ctx.createLinearGradient(
    x, y,
    x + width * Math.cos(angle * Math.PI / 180), 
    y + height * Math.sin(angle * Math.PI / 180)
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  return gradient;
}

function createGlowEffect(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  return gradient;
}

function createGlassMorphism(ctx, x, y, width, height, radius, opacity = 0.1) {
  ctx.save();
  // Semi-transparent fill
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  roundRect(ctx, x, y, width, height, radius, true);
  
  // Shine effect
  ctx.fillStyle = createAnimatedShine(ctx, x, y, width, height);
  roundRect(ctx, x, y, width, height, radius, true);
  
  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, radius, false, true);
  ctx.restore();
}

function drawProgressBar(ctx, label, value, maxValue, x, y, width, height, colors, animated = false) {
  // Settings
  const barHeight = height || 25;
  const cornerRadius = 12;
  const labelX = x;
  const barX = x + 110;
  const barWidth = width - 110;
  const textOffset = 18;
  const animationOffset = animated ? Math.sin(Date.now() / 500) * 5 : 0;
  
  // Draw label with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Roboto';
  ctx.fillText(label, labelX, y);
  ctx.restore();

  // Draw bar background with inner shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRect(ctx, barX, y - textOffset, barWidth, barHeight, cornerRadius, true);

  // Draw progress with gradient
  const progress = (value / maxValue) * barWidth;
  const gradient = ctx.createLinearGradient(barX, y, barX + barWidth, y);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  
  ctx.fillStyle = gradient;
  roundRect(ctx, barX, y - textOffset, progress, barHeight, cornerRadius, true);

  // Add shine effect with animation
  const shine = ctx.createLinearGradient(
    barX, y - textOffset, 
    barX + animationOffset, y - textOffset + barHeight
  );
  shine.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shine;
  roundRect(ctx, barX, y - textOffset, progress, barHeight, cornerRadius, true);

  // Draw value text with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(`${value}/${maxValue}`, x + width - 20, y);
  ctx.restore();
  ctx.textAlign = 'left';
}

function generateUIElements(ctx, width, height) {
  // Add geometric patterns
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  
  // Horizontal lines
  for (let i = 0; i < height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }
  
  // Vertical lines
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  
  // Add sparkle effects
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    const opacity = Math.random() * 0.5 + 0.1;

    const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    sparkleGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    sparkleGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity/2})`);
    sparkleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = sparkleGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function createPetImage(options) {
  // Initialize and validate options
  const {
    userId,
    pet,
    type = "DEFAULT"
  } = options;
  if (!pet) throw new Error('Pet data is required');
  
  // Lấy tên người dùng từ userData (kiểm tra userId tồn tại)
  let userName = "Người chơi";
  if (userData && userData[userId] && userData[userId].name) {
    userName = userData[userId].name;
  }

  if (!pet) throw new Error('Pet data is required');
  
  // Register fonts
  registerFonts();

  // Set up canvas dimensions with higher resolution
  const width = 1080;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Get theme based on pet type
  const theme = PET_THEMES[type] || PET_THEMES.DEFAULT;
  
  // Draw enhanced background with dynamic gradients
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, theme.background[0]);
  bgGradient.addColorStop(0.5, theme.background[1]);
  bgGradient.addColorStop(1, theme.background[2]);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Generate UI elements
  generateUIElements(ctx, width, height);
  
  // Create enhanced header with glass effect
  ctx.save();
  createGlassMorphism(ctx, 0, 0, width, 140, 0, 0.15);
  
  // Add header glow
  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
  ctx.shadowBlur = 15;
  ctx.fillRect(0, 139, width, 1);
  ctx.restore();

  // Draw pet name and owner in header
  ctx.save();
  // Pet title with gradient text
  const titleGradient = ctx.createLinearGradient(width/2 - 150, 50, width/2 + 150, 50);
  titleGradient.addColorStop(0, '#ffffff');
  titleGradient.addColorStop(0.5, '#f5f5f5');
  titleGradient.addColorStop(1, '#ffffff');
  
  ctx.font = 'bold 32px Roboto';
  ctx.textAlign = 'center';
  ctx.fillStyle = titleGradient;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 5;
  ctx.fillText(`${pet.name} của ${userName}`, width/2, 70);
  
  // Pet type label with glass effect
  ctx.textAlign = 'center';
  ctx.font = '16px Roboto';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  
  // Create mini label background
  const labelWidth = ctx.measureText(type).width + 40;
  createGlassMorphism(ctx, width/2 - labelWidth/2, 80, labelWidth, 30, 15, 0.2);
  
  // Draw type text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(type, width/2, 100);
  ctx.restore();

  // Draw enhanced avatar with glow effect
  try {
    const avatar = await loadImage(await getAvatarPath(userId));
    const avatarX = 100;
    const avatarY = 70;
    const avatarSize = 55;
    
    ctx.save();
    
    // Create glow around avatar
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw avatar
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize - 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarSize, avatarY - avatarSize, avatarSize * 2, avatarSize * 2);
    
    // Draw avatar border
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } catch (e) {
    console.log('Could not load avatar:', e);
  }

  // Enhanced level badge with 3D effect
  ctx.save();
  // Create badge glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 15;
  
  const badgeX = width - 100;
  const badgeY = 70;
  const badgeSize = 40;
  const badgeGlow = ctx.createRadialGradient(badgeX, badgeY, 0, badgeX, badgeY, badgeSize + 10);
  badgeGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  badgeGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
  
  ctx.fillStyle = badgeGlow;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize + 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw badge background with metallic gradient
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
  
  const badgeGradient = ctx.createLinearGradient(badgeX - badgeSize, badgeY - badgeSize, badgeX + badgeSize, badgeY + badgeSize);
  badgeGradient.addColorStop(0, theme.badge[0]);
  badgeGradient.addColorStop(0.5, theme.badge[1]);
  badgeGradient.addColorStop(1, theme.badge[2]);
  ctx.fillStyle = badgeGradient;
  ctx.fill();

  // Add 3D effect with inner shadow
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeSize - 3, 0, Math.PI * 2);
  const innerShadow = ctx.createRadialGradient(badgeX, badgeY, 0, badgeX, badgeY, badgeSize);
  innerShadow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  innerShadow.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = innerShadow;
  ctx.fill();

  // Draw shine effect
  ctx.beginPath();
  ctx.arc(badgeX - 5, badgeY - 5, badgeSize - 15, 0, Math.PI * 2);
  const shineGradient = ctx.createRadialGradient(badgeX - 5, badgeY - 5, 0, badgeX - 5, badgeY - 5, badgeSize - 15);
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGradient;
  ctx.fill();

  // Draw level text with 3D effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Roboto';
  ctx.textAlign = 'center';
  ctx.fillText(pet.level, badgeX, badgeY + 10);
  
  // Draw level label
  ctx.shadowBlur = 1;
  ctx.font = 'bold 14px Roboto';
  ctx.fillText('CẤP', badgeX, badgeY + 30);
  ctx.restore();

  // Enhanced pet display with circular frame
  try {
    let petImagePath = PET_IMAGES[type];
    if (!fs.existsSync(petImagePath)) {
      petImagePath = PET_IMAGES.DEFAULT;
    }
    
    const petImage = await loadImage(petImagePath);
    
    // Create pet frame variables
    const petSize = 270;
    const centerX = width / 2;
    const centerY = 300;
    
    // Create animated glow around pet
    ctx.save();
    const currentTime = Date.now() / 1000;
    const glowSize = petSize/2 + Math.sin(currentTime * 2) * 10;
    
    const petGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
    petGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    petGlow.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
    petGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = petGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Create decorative rings with gradient
    for (let i = 0; i < 3; i++) {
      const ringRadius = petSize/2 + 15 + (i * 20);
      const ringWidth = 2;
      
      // Create gradient for ring
      const ringGradient = ctx.createLinearGradient(
        centerX - ringRadius, 
        centerY - ringRadius, 
        centerX + ringRadius, 
        centerY + ringRadius
      );
      ringGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      ringGradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.2)');
      ringGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      ringGradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.2)');
      ringGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      
      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Create glass frame for pet image
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, petSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pet image
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, petSize/2 - 5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(petImage, centerX - petSize/2, centerY - petSize/2, petSize, petSize);
    ctx.restore();
    
    // Add interactive particles around pet
    const particleCount = 20;
    const time = Date.now() / 1000;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = petSize/2 + 40 + Math.sin(time + i) * 10;
      const x = centerX + Math.cos(angle + time * 0.3) * distance;
      const y = centerY + Math.sin(angle + time * 0.3) * distance;
      const size = 3 + Math.sin(time * 2 + i) * 2;
      
      const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      particleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      particleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = particleGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } catch (e) {
    console.log('Could not load pet image:', e);
    // Fallback emoji
    ctx.font = '160px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('🐾', width / 2, 300);
  }

  // Create enhanced stats container with modern glass morphism
  const statsY = 450;
  const statsHeight = 220;
  
  // Add stat container
  createGlassMorphism(ctx, 50, statsY, width - 100, statsHeight, 25, 0.15);
  
  // Add stat container header
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Roboto';
  ctx.textAlign = 'center';
  ctx.fillText('THÔNG SỐ THÚ CƯNG', width/2, statsY + 30);
  
  // Add small decorative line
  const lineWidth = 100;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width/2 - lineWidth/2, statsY + 40);
  ctx.lineTo(width/2 + lineWidth/2, statsY + 40);
  ctx.stroke();
  ctx.restore();

  // Draw enhanced pet stats using the new function
  drawProgressBar(
    ctx, 
    'Năng lượng', 
    pet.energy, 
    pet.maxEnergy, 
    70, 
    statsY + 80, 
    width - 140, 
    30, 
    theme.energy,
    true
  );
  
  drawProgressBar(
    ctx, 
    'Độ đói', 
    pet.hunger, 
    pet.maxHunger, 
    70, 
    statsY + 130, 
    width - 140, 
    30, 
    theme.hunger,
    true
  );
  
  drawProgressBar(
    ctx, 
    'Hạnh phúc', 
    pet.happy, 
    pet.maxHappy, 
    70, 
    statsY + 180, 
    width - 140, 
    30, 
    theme.happy,
    true
  );

  // Add watermark and last updated timestamp
  ctx.save();
  ctx.font = '14px Roboto';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'right';
  const date = new Date();
  ctx.fillText(
    `Cập nhật: ${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`, 
    width - 60, 
    height - 20
  );
  ctx.restore();

  // Save image with enhanced quality
  const buffer = canvas.toBuffer('image/png');
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const outputPath = path.join(tempDir, `pet_${userId}_${Date.now()}.png`);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

module.exports = { createPetImage };