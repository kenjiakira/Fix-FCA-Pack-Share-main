const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const Stream = require('stream');

// Register fonts
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnam' });

// Helper function to format numbers
function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

/**
 * Convert Canvas buffer to a readable stream
 * @param {Buffer} buffer - Image buffer
 * @returns {Stream.Readable} - Readable stream
 */
function bufferToStream(buffer) {
  const readable = new Stream.Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Create mining animation canvas
 * @param {Object} data - Mining data
 * @returns {Buffer} - Canvas buffer
 */
async function createMiningCanvas(data) {
  // Canvas setup
  const canvas = createCanvas(1000, 700);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 700);
  bgGradient.addColorStop(0, '#1a237e');
  bgGradient.addColorStop(1, '#0d1337');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1000, 700);

  // Add cosmic background elements (stars)
  drawCosmicBackground(ctx, 1000, 700);
  
  // Header
  drawHeader(ctx, "MINING REPORT", 500, 60);
  
  // Mining animation
  await drawMiningAnimation(ctx, 500, 180, 240);
  
  // Mining results
  drawMiningResults(ctx, data, 500, 340);
  
  // User stats section
  drawUserStats(ctx, data, 250, 500);
  
  // Market info section
  drawMarketInfo(ctx, data, 750, 500);
  
  // Footer
  drawFooter(ctx, 500, 670);
  
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

/**
 * Draw cosmic background with stars and nebula effect
 */
function drawCosmicBackground(ctx, width, height) {
  // Add subtle nebula effect
  const nebulaGradient = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 800);
  nebulaGradient.addColorStop(0, 'rgba(103, 58, 183, 0.1)');
  nebulaGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.05)');
  nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = nebulaGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add stars
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5;
    const opacity = Math.random() * 0.8 + 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }
  
  // Add larger glowing stars
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 2 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    
    // Star glow effect
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 3);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fill();
  }
}

/**
 * Draw header with title
 */
function drawHeader(ctx, title, x, y) {
  // Header background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(x - 300, y - 40, 600, 80, 20);
  ctx.fill();
  
  // Glowing border
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#4fc3f7';
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Header text
  ctx.font = '36px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(title, x, y);
  
  // Decorative elements
  ctx.beginPath();
  ctx.moveTo(x - 180, y);
  ctx.lineTo(x - 280, y);
  ctx.moveTo(x + 180, y);
  ctx.lineTo(x + 280, y);
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 3;
  ctx.stroke();
}

/**
 * Draw animated mining visualization
 */
async function drawMiningAnimation(ctx, x, y, size) {
  // Background circular area
  ctx.beginPath();
  ctx.arc(x, y, size/2, 0, Math.PI * 2);
  const animBg = ctx.createRadialGradient(x, y, 0, x, y, size/2);
  animBg.addColorStop(0, '#0d47a1');
  animBg.addColorStop(0.7, '#1a237e');
  animBg.addColorStop(1, '#0d1337');
  ctx.fillStyle = animBg;
  ctx.fill();
  
  // Mining animation
  try {
    // Load mining equipment image
    const miningEquipImage = await loadImage(path.join(__dirname, '../../assets/mining_equipment.png'));
    ctx.drawImage(miningEquipImage, x - size/3, y - size/3, size/1.5, size/1.5);
  } catch (err) {
    // Fallback if image doesn't exist
    // Draw mining icon
    drawMiningIcon(ctx, x, y, size/3);
  }
  
  // Particles around the mining area for effect
  drawMiningParticles(ctx, x, y, size/2);
  
  // Pulsating glow effect
  const glowRadius = size/1.8;
  const glowGradient = ctx.createRadialGradient(x, y, size/4, x, y, glowRadius);
  glowGradient.addColorStop(0, 'rgba(77, 208, 225, 0)');
  glowGradient.addColorStop(0.5, 'rgba(77, 208, 225, 0.05)');
  glowGradient.addColorStop(1, 'rgba(77, 208, 225, 0.1)');
  
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();
}

/**
 * Draw mining particles
 */
function drawMiningParticles(ctx, centerX, centerY, radius) {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.9;
    
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    const particleSize = Math.random() * 4 + 1;
    const hue = Math.random() * 40 + 200; // Blue to cyan
    
    ctx.beginPath();
    ctx.arc(x, y, particleSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${Math.random() * 0.7 + 0.3})`;
    ctx.fill();
  }
}

/**
 * Draw fallback mining icon
 */
function drawMiningIcon(ctx, x, y, size) {
  // Pickaxe icon
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  
  // Handle
  ctx.beginPath();
  ctx.roundRect(-size/5, -size, size/2.5, size*2, 10);
  ctx.fillStyle = '#8d6e63';
  ctx.fill();
  
  // Axe head
  ctx.beginPath();
  ctx.moveTo(-size/2, -size/1.8);
  ctx.lineTo(size/2, -size/1.2);
  ctx.lineTo(size/1.5, -size/2);
  ctx.lineTo(size/2, -size/4);
  ctx.closePath();
  ctx.fillStyle = '#b0bec5';
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw mining results section
 */
function drawMiningResults(ctx, data, x, y) {
  // Section background
  ctx.fillStyle = 'rgba(13, 71, 161, 0.5)';
  ctx.beginPath();
  ctx.roundRect(x - 350, y - 50, 700, 140, 20);
  ctx.fill();
  
  // Section border
  ctx.strokeStyle = 'rgba(77, 208, 225, 0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Mining amount
  ctx.font = '32px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`+${formatNumber(data.minedAmount)} MC`, x, y - 10);
  
  // Mining power display
  ctx.font = '20px "BeVietnam Medium"';
  ctx.fillText(`Mining Power: ${formatNumber(data.miningPower, 1)}x`, x, y + 30);
  
  // New total balance
  ctx.font = '24px "BeVietnam Bold"';
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(`Total Balance: ${formatNumber(data.balance)} MC`, x, y + 70);
}

/**
 * Draw user stats section
 */
function drawUserStats(ctx, data, x, y) {
  // Section background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(x - 200, y - 80, 400, 240, 20);
  ctx.fill();
  
  // Section header
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('USER STATS', x, y - 45);
  
  // Divider
  ctx.beginPath();
  ctx.moveTo(x - 150, y - 30);
  ctx.lineTo(x + 150, y - 30);
  ctx.strokeStyle = 'rgba(77, 208, 225, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Level and XP display
  ctx.font = '18px "BeVietnam Medium"';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(`Level: ${data.level}`, x - 170, y + 0);
  
  // XP Bar
  drawProgressBar(ctx, x - 170, y + 15, 340, 15, data.experience / data.nextLevelXP, '#64b5f6', '#1565c0');
  ctx.font = '14px "BeVietnam"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${formatNumber(data.experience)} / ${formatNumber(data.nextLevelXP)} XP`, x, y + 13);
  
  // Stats display
  ctx.textAlign = 'left';
  ctx.font = '16px "BeVietnam Medium"';
  
  // Mining sessions count
  ctx.fillStyle = '#64b5f6';
  ctx.fillText('Mining Sessions:', x - 170, y + 50);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(formatNumber(data.stats.miningCount), x + 170, y + 50);
  
  // Total mined
  ctx.fillStyle = '#64b5f6';
  ctx.textAlign = 'left';
  ctx.fillText('Total Mined:', x - 170, y + 80);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(formatNumber(data.stats.totalMined) + ' MC', x + 170, y + 80);
  
  // Days active
  ctx.fillStyle = '#64b5f6';
  ctx.textAlign = 'left';
  ctx.fillText('Days Active:', x - 170, y + 110);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(formatNumber(data.stats.daysActive), x + 170, y + 110);
}

/**
 * Draw market info section
 */
function drawMarketInfo(ctx, data, x, y) {
  // Section background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(x - 200, y - 80, 400, 240, 20);
  ctx.fill();
  
  // Section header
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('MARKET INFO', x, y - 45);
  
  // Divider
  ctx.beginPath();
  ctx.moveTo(x - 150, y - 30);
  ctx.lineTo(x + 150, y - 30);
  ctx.strokeStyle = 'rgba(77, 208, 225, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // If not listed yet
  if (!data.isListed) {
    ctx.font = '18px "BeVietnam Medium"';
    ctx.fillStyle = '#ff9800';
    ctx.textAlign = 'center';
    ctx.fillText('Coin not listed yet', x, y + 0);
    
    // Listing progress
    ctx.font = '16px "BeVietnam"';
    ctx.fillStyle = '#64b5f6';
    ctx.textAlign = 'left';
    ctx.fillText('Progress to listing:', x - 170, y + 40);
    
    const progress = Math.min(1, data.totalSupply / data.listingThreshold);
    drawProgressBar(ctx, x - 170, y + 55, 340, 15, progress, '#ff9800', '#e65100');
    
    ctx.font = '14px "BeVietnam"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${formatNumber(data.totalSupply)} / ${formatNumber(data.listingThreshold)} MC`, x, y + 53);
    
    // Required supply info
    ctx.font = '16px "BeVietnam Medium"';
    ctx.fillStyle = '#64b5f6';
    ctx.textAlign = 'left';
    ctx.fillText('Required Supply:', x - 170, y + 100);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(data.listingThreshold) + ' MC', x + 170, y + 100);
    
  } else {
    // Current price
    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#4caf50';
    ctx.textAlign = 'center';
    ctx.fillText(`1 MC = ${formatNumber(data.price, 2)}$`, x, y + 0);
    
    // Price change indicator
    const changeColor = data.priceChange >= 0 ? '#4caf50' : '#f44336';
    const changeArrow = data.priceChange >= 0 ? '▲' : '▼';
    ctx.font = '16px "BeVietnam Medium"';
    ctx.fillStyle = changeColor;
    ctx.textAlign = 'center';
    ctx.fillText(`${changeArrow} ${Math.abs(data.priceChange).toFixed(2)}%`, x, y + 30);
    
    // Market stats
    ctx.font = '16px "BeVietnam Medium"';
    
    // Total supply
    ctx.fillStyle = '#64b5f6';
    ctx.textAlign = 'left';
    ctx.fillText('Total Supply:', x - 170, y + 70);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(data.totalSupply) + ' MC', x + 170, y + 70);
    
    // Market sentiment
    ctx.fillStyle = '#64b5f6';
    ctx.textAlign = 'left';
    ctx.fillText('Market Sentiment:', x - 170, y + 100);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(data.sentiment, x + 170, y + 100);
  }
  
  // Your holdings percentage
  ctx.fillStyle = '#64b5f6';
  ctx.textAlign = 'left';
  ctx.fillText('Your Holdings:', x - 170, y + 130);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(formatNumber(data.holdingPercent, 2) + '%', x + 170, y + 130);
}

/**
 * Draw a progress bar
 */
function drawProgressBar(ctx, x, y, width, height, progress, fillColor, bgColor) {
  // Background
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height/2);
  ctx.fillStyle = bgColor || 'rgba(255,255,255,0.2)';
  ctx.fill();
  
  // Fill
  const fillWidth = Math.max(0, Math.min(1, progress)) * width;
  if (fillWidth > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, fillWidth, height, height/2);
    ctx.fillStyle = fillColor || '#4fc3f7';
    ctx.fill();
  }
}
/**
 * Draw footer section
 */
function drawFooter(ctx, x, y) {
    // Footer background with gradient
    const footerGradient = ctx.createLinearGradient(0, y - 40, 0, y + 10);
    footerGradient.addColorStop(0, 'rgba(26, 35, 126, 0.7)');
    footerGradient.addColorStop(1, 'rgba(13, 19, 55, 0.9)');
    
    ctx.fillStyle = footerGradient;
    ctx.beginPath();
    ctx.roundRect(x - 450, y - 20, 900, 40, 10);
    ctx.fill();
    
    // Footer text
    ctx.font = '16px "BeVietnam"';
    ctx.fillStyle = '#b0c4de';
    ctx.textAlign = 'center';
    ctx.fillText('AKI COIN • SECURE MINING • TRANSPARENT MARKET • COMMUNITY DRIVEN', x, y + 5);
    
    // Small decorative elements
    ctx.beginPath();
    ctx.arc(x - 400, y, 3, 0, Math.PI * 2);
    ctx.arc(x + 400, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
  }
  
  /**
   * Create mining result canvas with animation
   * @param {Object} userData - User mining data
   * @returns {Buffer} - Canvas buffer
   */
  async function createMiningResultCanvas(userData) {
    // Canvas setup
    const canvas = createCanvas(1000, 700);
    const ctx = canvas.getContext('2d');
    
    // Use the same background as mining canvas
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 700);
    bgGradient.addColorStop(0, '#1a237e');
    bgGradient.addColorStop(1, '#0d1337');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1000, 700);
  
    // Add cosmic background
    drawCosmicBackground(ctx, 1000, 700);
    
    // Header with mining result
    drawHeader(ctx, `MINING COMPLETED!`, 500, 60);
    
    // Draw gem/coin in the center
    await drawMinedCoin(ctx, 500, 200, 100, userData.minedAmount);
    
    // Results section
    drawResultsCard(ctx, userData, 500, 380);
    
    // User level progress
    drawLevelProgress(ctx, userData, 500, 550);
    
    // Footer
    drawFooter(ctx, 500, 670);
    
    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
  }
  
  /**
   * Draw a large mined coin with glow effect
   */
  async function drawMinedCoin(ctx, x, y, size, amount) {
    // Large glowing circle
    const glowRadius = size * 1.5;
    const coinGradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, glowRadius);
    coinGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
    coinGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    coinGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = coinGradient;
    ctx.fill();
    
    // Gold circle for coin
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    const goldGradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    goldGradient.addColorStop(0, '#fff8b5');
    goldGradient.addColorStop(0.5, '#ffd700');
    goldGradient.addColorStop(1, '#d4af37');
    ctx.fillStyle = goldGradient;
    ctx.fill();
    
    // Coin edge effect
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
    
    // MC logo
    ctx.font = 'bold 40px "BeVietnam Bold"';
    ctx.fillStyle = '#b8860b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MC', x, y);
    
    // Amount display
    ctx.font = 'bold 48px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${formatNumber(amount)}`, x, y - size * 1.8);
    
    // "COINS MINED" text
    ctx.font = '24px "BeVietnam Medium"';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('COINS MINED', x, y - size * 1.3);
    
    // Add sparkles around the coin
    drawSparkles(ctx, x, y, size * 2);
  }
  
  /**
   * Draw sparkles around the coin
   */
  function drawSparkles(ctx, x, y, radius) {
    const sparkleCount = 12;
    
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const distance = radius * 0.6;
      const sparkleX = x + Math.cos(angle) * distance;
      const sparkleY = y + Math.sin(angle) * distance;
      const sparkleSize = Math.random() * 5 + 5;
      
      // Draw a 4-point star
      ctx.save();
      ctx.translate(sparkleX, sparkleY);
      ctx.rotate(Math.random() * Math.PI * 2);
      
      ctx.beginPath();
      for (let j = 0; j < 8; j++) {
        const starRadius = j % 2 === 0 ? sparkleSize : sparkleSize * 0.4;
        const starAngle = (j / 8) * Math.PI * 2;
        if (j === 0) {
          ctx.moveTo(Math.cos(starAngle) * starRadius, Math.sin(starAngle) * starRadius);
        } else {
          ctx.lineTo(Math.cos(starAngle) * starRadius, Math.sin(starAngle) * starRadius);
        }
      }
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(255, 255, 160, 0.8)';
      ctx.fill();
      
      ctx.restore();
    }
  }
  
  /**
   * Draw mining results card
   */
  function drawResultsCard(ctx, data, x, y) {
    // Card background with gradient
    const cardGradient = ctx.createLinearGradient(x - 300, y - 80, x + 300, y + 80);
    cardGradient.addColorStop(0, 'rgba(21, 101, 192, 0.7)');
    cardGradient.addColorStop(1, 'rgba(13, 71, 161, 0.7)');
    
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(x - 300, y - 80, 600, 160, 20);
    ctx.fill();
    
    // Card border
    ctx.strokeStyle = 'rgba(77, 208, 225, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mining result stats
    ctx.textAlign = 'center';
    
    // Mining Power
    ctx.font = '22px "BeVietnam Medium"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Mining Power: ${formatNumber(data.miningPower, 1)}x`, x, y - 40);
    
    // Total balance
    ctx.font = '28px "BeVietnam Bold"';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText(`Total Balance: ${formatNumber(data.balance)} MC`, x, y + 0);
    
    // Value in USD if listed
    if (data.isListed && data.price > 0) {
      const valueUSD = data.balance * data.price;
      ctx.font = '20px "BeVietnam Medium"';
      ctx.fillStyle = '#81c784';
      ctx.fillText(`Value: ${formatNumber(valueUSD, 2)} $`, x, y + 35);
    }
    
    // Mining stats - left side
    ctx.textAlign = 'left';
    ctx.font = '16px "BeVietnam Medium"';
    ctx.fillStyle = '#b0c4de';
    ctx.fillText('Total Mined:', x - 260, y + 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(data.stats.totalMined)} MC`, x - 100, y + 70);
    
    // Mining stats - right side
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b0c4de';
    ctx.fillText('Sessions:', x + 100, y + 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(data.stats.miningCount), x + 260, y + 70);
  }
  
  /**
   * Draw level progress section
   */
  function drawLevelProgress(ctx, data, x, y) {
    // Section background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x - 350, y - 40, 700, 100, 20);
    ctx.fill();
    
    // Level display
    ctx.font = '22px "BeVietnam Bold"';
    ctx.fillStyle = '#ffd54f';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${data.level}`, x, y - 10);
    
    // XP progress bar
    drawProgressBar(ctx, x - 300, y + 10, 600, 20, data.experience / data.nextLevelXP, '#64b5f6', '#1565c0');
    
    // XP text
    ctx.font = '16px "BeVietnam"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${formatNumber(data.experience)} / ${formatNumber(data.nextLevelXP)} XP`, x, y + 10);
    
    // Next level info
    ctx.font = '14px "BeVietnam"';
    ctx.fillStyle = '#b0c4de';
    ctx.fillText(`Next Level: +0.1 Mining Power`, x, y + 40);
  }
  
  // Export the functions
  module.exports = {
    createMiningCanvas,
    createMiningResultCanvas,
    bufferToStream
  };