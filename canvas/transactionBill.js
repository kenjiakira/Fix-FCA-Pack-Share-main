const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Try to register custom fonts if available
try {
  const fontsDir = path.join(__dirname, '../fonts');
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Bold.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Bold.ttf'), { family: 'Montserrat', weight: 'bold' });
  }
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Regular.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Regular.ttf'), { family: 'Montserrat', weight: 'normal' });
  }
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Medium.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Medium.ttf'), { family: 'Montserrat', weight: 'medium' });
  }
} catch (e) {
  console.log("Could not load custom fonts, using system defaults");
}

/**
 * Draw a rounded rectangle
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number|Object} radius - Corner radius or object with corner radii
 * @param {boolean} fill - Whether to fill the rectangle
 * @param {boolean} stroke - Whether to stroke the rectangle
 */
function roundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
  }
  
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
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
 * Format number with commas
 * @param {number} number - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(number) {
  return number.toLocaleString('vi-VN');
}

/**
 * Get the font family to use
 * @returns {string} - Font family
 */
function getFontFamily() {
  return 'Montserrat, Arial, sans-serif';
}

/**
 * Generate a random transaction ID
 */
function generateTransactionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  // Format: XXX-YYYYY-ZZ (where X, Y, Z are alphanumeric)
  for (let i = 0; i < 3; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  id += '-';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  id += '-';
  for (let i = 0; i < 2; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Creates a beautiful transaction bill image
 * @param {Object} options - Transaction options
 * @returns {Promise<string>} - Path to the generated bill image
 */
async function createTransactionBill(options) {
  try {
    const {
      senderName = "Người gửi",
      recipientName = "Người nhận",
      amount = 0,
      fee = 0,
      total = 0,
      remainingBalance = 0,
      outputDir = path.resolve(__dirname, '../commands/cache'),
      theme = 'blue' // 'blue', 'purple', 'green', 'dark'
    } = options;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Set theme colors
    const themes = {
      blue: {
        primary: '#1565c0',
        secondary: '#0d47a1',
        accent: '#42a5f5',
        background: '#f5f9ff',
        gradientStart: '#0a1128',
        gradientEnd: '#1a237e',
      },
      purple: {
        primary: '#6a1b9a',
        secondary: '#4a148c',
        accent: '#9c27b0',
        background: '#f8f5ff',
        gradientStart: '#240b36',
        gradientEnd: '#4a0072',
      },
      green: {
        primary: '#2e7d32',
        secondary: '#1b5e20',
        accent: '#4caf50',
        background: '#f5fff7',
        gradientStart: '#134e5e',
        gradientEnd: '#005b4f',
      },
      dark: {
        primary: '#263238',
        secondary: '#1a1a1a',
        accent: '#455a64',
        background: '#f5f5f5',
        gradientStart: '#232526',
        gradientEnd: '#414345',
      }
    };

    const colors = themes[theme] || themes.blue;

    // Canvas setup - increased size for better quality
    const width = 1000;
    const height = 780;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, colors.gradientStart);
    bgGradient.addColorStop(1, colors.gradientEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add diagonal lines to background for texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width * 2; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - height, height);
      ctx.stroke();
    }

    // Add particles for visual interest
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 100; i++) {
      const particleSize = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width, 
        Math.random() * height, 
        particleSize, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }

    // Main card with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = colors.background;
    roundRect(ctx, 50, 50, width - 100, height - 100, 20);
    ctx.restore();

    // Header with gradient
    const headerHeight = 120;
    const headerGradient = ctx.createLinearGradient(50, 50, width - 50, 50 + headerHeight);
    headerGradient.addColorStop(0, colors.primary);
    headerGradient.addColorStop(1, colors.secondary);
    ctx.fillStyle = headerGradient;
    roundRect(ctx, 50, 50, width - 100, headerHeight, { tl: 20, tr: 20, br: 0, bl: 0 });

    // Circle logo in header
    ctx.save();
    const circleX = 140;
    const circleY = 110;
    const circleRadius = 40;

    // Circle glow effect
    const glowGradient = ctx.createRadialGradient(circleX, circleY, circleRadius * 0.8, circleX, circleY, circleRadius * 1.5);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${circleRadius * 1.3}px ${getFontFamily()}`;
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', circleX, circleY);
    ctx.restore();

    ctx.font = `bold 50px ${getFontFamily()}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('BIÊN LAI CHUYỂN KHOẢN', width + 20 / 2, 110);

    const contentY = 50 + headerHeight;
    const contentHeight = height - 50 - headerHeight - (height * 0.15);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 80, contentY + 20, width - 160, contentHeight, 15);

    const now = new Date();
    const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    ctx.font = `bold 18px ${getFontFamily()}`;
    ctx.fillStyle = '#757575';
    ctx.textAlign = 'center';
    ctx.fillText(dateTimeFormat.format(now), width / 2, contentY + 60); 

    const transactionId = generateTransactionId();
    const idBox = {
      x: (width - 400) / 2,
      y: contentY + 80,
      width: 400,
      height: 40
    };

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    roundRect(ctx, idBox.x, idBox.y, idBox.width, idBox.height, 20);

    ctx.font = `medium 16px ${getFontFamily()}`;
    ctx.fillStyle = '#616161';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Mã giao dịch: ${transactionId}`, width / 2, idBox.y + idBox.height / 2);

    // Main content layout
    const startY = contentY + 150;
    const lineHeight = 70;

    /**
     * Helper function to draw person field with icon - MOVED INSIDE TRY BLOCK
     */
    function drawPersonField(label, value, y, colors) {
      // Label
      ctx.font = `bold 22px ${getFontFamily()}`;
      ctx.fillStyle = '#424242';
      ctx.textAlign = 'left';
      ctx.fillText(label, 150, y);
      
      // Value with background highlight
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      const textWidth = ctx.measureText(value).width;
      const bgPadding = 20;
      roundRect(ctx, 350 - bgPadding, y - 20, textWidth + bgPadding * 2, 40, 10);
      
      ctx.font = `medium 24px ${getFontFamily()}`;
      ctx.fillStyle = colors.primary;
      ctx.fillText(value, 350, y);
    }

    /**
     * Helper function to draw amount field - MOVED INSIDE TRY BLOCK
     */
    function drawAmountField(label, value, y, color) {
      ctx.font = `bold 22px ${getFontFamily()}`;
      ctx.fillStyle = '#424242';
      ctx.textAlign = 'left';
      ctx.fillText(label, 150, y);
      
      ctx.font = `bold 28px ${getFontFamily()}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(value, width - 150, y);
    }

    // Draw sender and recipient details with icons
    drawPersonField('👤 Người gửi:', senderName, startY, colors);
    drawPersonField('👥 Người nhận:', recipientName, startY + lineHeight, colors);

    // Separator line with gradient
    const lineY = startY + lineHeight * 1.8;
    const lineGradient = ctx.createLinearGradient(100, lineY, width - 100, lineY);
    lineGradient.addColorStop(0, 'rgba(200, 200, 200, 0.1)');
    lineGradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
    lineGradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, lineY);
    ctx.lineTo(width - 100, lineY);
    ctx.stroke();

    // Draw transaction amounts
    drawAmountField('💸 Số tiền gửi:', formatNumber(amount) + ' Xu', startY + lineHeight * 2.3, '#2e7d32');
    drawAmountField('🧾 Phí giao dịch:', formatNumber(fee) + ' Xu', startY + lineHeight * 3.1, '#ff9800');
    
    // Total amount with special highlight
    const totalY = startY + lineHeight * 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    roundRect(ctx, 100, totalY - 30, width - 200, 70, 15);

    ctx.font = `bold 28px ${getFontFamily()}`;
    ctx.fillStyle = '#424242';
    ctx.textAlign = 'left';
    ctx.fillText('💰 Tổng tiền:', 150, totalY + 5);
    
    // Total amount with gradient
    const totalGradient = ctx.createLinearGradient(350, totalY - 10, 750, totalY + 20);
    totalGradient.addColorStop(0, '#d32f2f');
    totalGradient.addColorStop(1, '#f44336');
    
    ctx.fillStyle = totalGradient;
    ctx.font = `bold 38px ${getFontFamily()}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(total)} Xu`, width - 150, totalY + 5);

    // Remaining balance with highlight box
    const balanceY = startY + lineHeight * 5.1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    roundRect(ctx, 100, balanceY - 20, width - 200, 60, 15);
    
    ctx.font = `bold 24px ${getFontFamily()}`;
    ctx.fillStyle = '#424242';
    ctx.textAlign = 'left';
    ctx.fillText('💳 Số dư còn lại:', 150, balanceY + 10);
    
    ctx.font = `bold 28px ${getFontFamily()}`;
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(remainingBalance)} Xu`, width - 150, balanceY + 10);

    // Save the image
    const outputPath = path.join(outputDir, `transaction_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error("Error creating transaction bill:", error);
    throw error;
  }
}

module.exports = { createTransactionBill };
