const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');


try {
  const fontsDir = path.join(__dirname, '../../fonts');
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Bold.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Bold.ttf'), { family: 'Montserrat', weight: 'bold' });
  }
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Regular.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Regular.ttf'), { family: 'Montserrat', weight: 'normal' });
  }
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Medium.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Medium.ttf'), { family: 'Montserrat', weight: 'medium' });
  }
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Light.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Light.ttf'), { family: 'Montserrat', weight: 'light' });
  }
  if (fs.existsSync(path.join(fontsDir, 'SF-Pro-Display-Bold.otf'))) {
    registerFont(path.join(fontsDir, 'SF-Pro-Display-Bold.otf'), { family: 'SF Pro Display', weight: 'bold' });
  }
  if (fs.existsSync(path.join(fontsDir, 'SF-Pro-Display-Regular.otf'))) {
    registerFont(path.join(fontsDir, 'SF-Pro-Display-Regular.otf'), { family: 'SF Pro Display', weight: 'normal' });
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
  return 'SF Pro Display, Montserrat, BeVietnamPro, sans-serif';
}

/**
 * Generate a random transaction ID
 */
function generateTransactionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  
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
 * Creates a beautiful transaction bill image styled as a mobile banking receipt
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
      outputDir = path.resolve(__dirname, '../../commands/cache'),
      theme = 'blue' 
    } = options;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    
    const themes = {
      blue: {
        primary: '#1A73E8',
        secondary: '#4285F4',
        accent: '#8AB4F8',
        success: '#0F9D58',
        warning: '#F4B400',
        error: '#DB4437',
        textPrimary: '#202124',
        textSecondary: '#5F6368',
        background: '#FFFFFF',
        cardBackground: '#F8F9FA',
        gradientStart: '#1A73E8',
        gradientEnd: '#4285F4',
        divider: '#DADCE0'
      },
      purple: {
        primary: '#673AB7',
        secondary: '#9C27B0',
        accent: '#BA68C8',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        textPrimary: '#212121',
        textSecondary: '#757575',
        background: '#FFFFFF',
        cardBackground: '#F5F5F5',
        gradientStart: '#673AB7',
        gradientEnd: '#9C27B0',
        divider: '#E0E0E0'
      },
      green: {
        primary: '#0F9D58',
        secondary: '#00C853',
        accent: '#69F0AE',
        success: '#00C853',
        warning: '#FFD600',
        error: '#DD2C00',
        textPrimary: '#212121',
        textSecondary: '#616161',
        background: '#FFFFFF',
        cardBackground: '#F5F5F5',
        gradientStart: '#0F9D58',
        gradientEnd: '#00C853',
        divider: '#E0E0E0'
      },
      dark: {
        primary: '#BB86FC',
        secondary: '#03DAC6',
        accent: '#CF6679',
        success: '#03DAC6',
        warning: '#FFB74D',
        error: '#CF6679',
        textPrimary: '#F5F5F5',
        textSecondary: '#B0BEC5',
        background: '#121212',
        cardBackground: '#1E1E1E',
        gradientStart: '#121212',
        gradientEnd: '#2D2D2D',
        divider: '#2D2D2D'
      },
      teal: {
        primary: '#009688',
        secondary: '#00BFA5',
        accent: '#64FFDA',
        success: '#00E676',
        warning: '#FFEA00',
        error: '#FF3D00',
        textPrimary: '#212121',
        textSecondary: '#757575',
        background: '#FFFFFF',
        cardBackground: '#F5F5F5',
        gradientStart: '#009688',
        gradientEnd: '#00BFA5',
        divider: '#E0E0E0'
      },
      orange: {
        primary: '#FF5722',
        secondary: '#FF9800',
        accent: '#FFAB40',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        textPrimary: '#212121',
        textSecondary: '#757575',
        background: '#FFFFFF',
        cardBackground: '#FAFAFA',
        gradientStart: '#FF5722',
        gradientEnd: '#FF9800',
        divider: '#EEEEEE'
      }
    };

    const colors = themes[theme] || themes.blue;
    
    
    const width = 600;
    const height = 1100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    
    if (theme === 'dark') {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);
      
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < width; i += 20) {
        for (let j = 0; j < height; j += 20) {
          ctx.beginPath();
          ctx.arc(i, j, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, colors.background);
      bgGradient.addColorStop(1, '#F5F5F5');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
    }

    
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
    roundRect(ctx, 15, 15, width - 30, height - 30, 40);
    
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, 15, 15, width - 30, height - 30, 40, false, true);
    ctx.shadowColor = 'transparent';
    
    
    const statusBarHeight = 50;
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
    roundRect(ctx, 15, 15, width - 30, statusBarHeight, { tl: 40, tr: 40, br: 0, bl: 0 });
    
    
    ctx.fillStyle = theme === 'dark' ? '#FFFFFF' : '#000000';
    
    
    ctx.fillRect(width - 60, 30, 25, 15);
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
    ctx.fillRect(width - 58, 32, 21, 11);
    ctx.fillStyle = theme === 'dark' ? '#FFFFFF' : '#000000';
    ctx.fillRect(width - 56, 34, 17, 7);
    
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width - 85, 37, 8, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 85, 37, 5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 85, 37, 2, Math.PI, 0);
    ctx.stroke();
    
    
    ctx.beginPath();
    ctx.arc(width - 110, 37, 8, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 110, 37, 4, Math.PI, 0);
    ctx.stroke();
    
    
    ctx.font = `bold 16px ${getFontFamily()}`;
    ctx.textAlign = 'center';
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    ctx.fillText(time, width / 2, 37);

    
    const headerHeight = 100;
    const headerGradient = ctx.createLinearGradient(0, 65, 0, 65 + headerHeight);
    headerGradient.addColorStop(0, colors.gradientStart);
    headerGradient.addColorStop(1, colors.gradientEnd);
    
    ctx.fillStyle = headerGradient;
    ctx.fillRect(15, 65, width - 30, headerHeight);
    
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(55, 115, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.primary;
    ctx.font = `bold 32px ${getFontFamily()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MB', 55, 115);
    
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 24px ${getFontFamily()}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Mobile Banking', 100, 105);
    
    
    ctx.font = `normal 14px ${getFontFamily()}`;
    ctx.fillText('Giao dịch an toàn, nhanh chóng', 100, 130);
    
    
    ctx.beginPath();
    ctx.moveTo(width - 45, 105);
    ctx.lineTo(width - 55, 115);
    ctx.lineTo(width - 45, 125);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    
    const cardY = 180;
    const cardHeight = height - cardY - 70;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = colors.cardBackground;
    roundRect(ctx, 30, cardY, width - 60, cardHeight, 20);
    ctx.shadowColor = 'transparent';
    
    
    const successY = cardY + 60;
    
    
    const successGradient = ctx.createRadialGradient(width/2, successY, 10, width/2, successY, 45);
    successGradient.addColorStop(0, colors.success);
    successGradient.addColorStop(1, colors.success + '80'); 
    
    ctx.fillStyle = successGradient;
    ctx.beginPath();
    ctx.arc(width / 2, successY, 40, 0, Math.PI * 2);
    ctx.fill();
    
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 15, successY);
    ctx.lineTo(width / 2 - 5, successY + 10);
    ctx.lineTo(width / 2 + 15, successY - 10);
    ctx.stroke();
    
    
    ctx.fillStyle = colors.textPrimary;
    ctx.font = `bold 24px ${getFontFamily()}`;
    ctx.textAlign = 'center';
    ctx.fillText('Giao dịch thành công', width / 2, successY + 70);
    
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = colors.success;
    ctx.font = `bold 40px ${getFontFamily()}`;
    ctx.fillText(`${formatNumber(amount)} $`, width / 2, successY + 120);
    ctx.shadowColor = 'transparent';
    
    
    const now = new Date();
    const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    const transactionId = generateTransactionId();
    
    
    ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    roundRect(ctx, width/2 - 100, successY + 155, 200, 30, 15);
    
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `normal 14px ${getFontFamily()}`;
    ctx.fillText(dateTimeFormat.format(now), width / 2, successY + 150);
    ctx.fillStyle = theme === 'dark' ? '#FFFFFF' : colors.textPrimary;
    ctx.font = `medium 14px ${getFontFamily()}`;
    ctx.fillText(`Mã GD: ${transactionId}`, width / 2, successY + 175);
    
    
    const dividerY = successY + 210;
    ctx.fillStyle = colors.divider;
    ctx.fillRect(60, dividerY, width - 120, 1);
    
    
    ctx.fillStyle = colors.textPrimary;
    ctx.font = `medium 18px ${getFontFamily()}`;
    ctx.textAlign = 'left';
    ctx.fillText('Chi tiết giao dịch', 60, dividerY + 25);
    
    
    const detailsStartY = dividerY + 60;
    const detailSpacing = 60;
    
    function drawDetailRow(label, value, y, iconType = null) {
      
      if (iconType) {
        ctx.fillStyle = colors.primary + '30';
        roundRect(ctx, 60, y - 15, 30, 30, 8);
        
        ctx.fillStyle = colors.primary;
        ctx.font = `bold 14px ${getFontFamily()}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '→';
        if (iconType === 'sender') icon = '↑';
        else if (iconType === 'receiver') icon = '↓';
        else if (iconType === 'money') icon = '$';
        else if (iconType === 'fee') icon = '₫';
        else if (iconType === 'total') icon = '∑';
        
        ctx.fillText(icon, 75, y);
        ctx.textBaseline = 'alphabetic';
      }
      
      ctx.fillStyle = colors.textSecondary;
      ctx.font = `normal 16px ${getFontFamily()}`;
      ctx.textAlign = 'left';
      ctx.fillText(label, iconType ? 100 : 60, y);
      
      ctx.fillStyle = colors.textPrimary;
      ctx.font = `medium 16px ${getFontFamily()}`;
      ctx.textAlign = 'right';
      ctx.fillText(value, width - 60, y);
    }
    
    drawDetailRow('Người gửi', senderName, detailsStartY, 'sender');
    drawDetailRow('Người nhận', recipientName, detailsStartY + detailSpacing, 'receiver');
    drawDetailRow('Số tiền', `${formatNumber(amount)} $`, detailsStartY + detailSpacing * 2, 'money');
    drawDetailRow('Phí giao dịch', `${formatNumber(fee)} $`, detailsStartY + detailSpacing * 3, 'fee');
    drawDetailRow('Tổng cộng', `${formatNumber(total)} $`, detailsStartY + detailSpacing * 4, 'total');
    
    
    const finalDividerY = detailsStartY + detailSpacing * 5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = colors.divider;
    ctx.fillRect(60, finalDividerY, width - 120, 2);
    ctx.shadowColor = 'transparent';
    
    
    const balanceY = finalDividerY + 40;
    
    
    ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
    roundRect(ctx, 60, balanceY - 15, width - 120, 60, 10);
    
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `normal 16px ${getFontFamily()}`;
    ctx.textAlign = 'center';
    ctx.fillText('Số dư khả dụng', width / 2, balanceY);
    
    ctx.fillStyle = colors.primary;
    ctx.font = `bold 26px ${getFontFamily()}`;
    ctx.fillText(`${formatNumber(remainingBalance)} $`, width / 2, balanceY + 30);
    
    
    const navBarY = height - 65;
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = -3;
    roundRect(ctx, 15, navBarY, width - 30, 50, { tl: 0, tr: 0, br: 40, bl: 40 });
    ctx.shadowColor = 'transparent';
    
    
    const iconSpacing = (width - 60) / 5;
    const navIcons = ['≡', '♡', '⌂', '↺', '☰'];
    
    for (let i = 0; i < 5; i++) {
      const iconX = 30 + (iconSpacing * i) + (iconSpacing / 2);
      const iconY = navBarY + 25;
      
      if (i === 2) {
        ctx.fillStyle = colors.primary + '30';
        ctx.beginPath();
        ctx.arc(iconX, iconY - 15, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.primary;
        ctx.font = `bold 24px ${getFontFamily()}`;
      } else {
        ctx.fillStyle = theme === 'dark' ? '#555555' : '#888888';
        ctx.font = `normal 20px ${getFontFamily()}`;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(navIcons[i], iconX, iconY);
      ctx.textBaseline = 'alphabetic';
    }
    
    
    ctx.fillStyle = theme === 'dark' ? '#555555' : '#DDDDDD';
    roundRect(ctx, (width / 2) - 70, navBarY + 40, 140, 5, 2.5);
    
    
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