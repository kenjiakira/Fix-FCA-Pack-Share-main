const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const QRCode = require('qrcode');

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
  if (fs.existsSync(path.join(fontsDir, 'Montserrat-Light.ttf'))) {
    registerFont(path.join(fontsDir, 'Montserrat-Light.ttf'), { family: 'Montserrat', weight: 'light' });
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
 */async function createTransactionBill(options) {
  try {
    const {
      senderName = "Người gửi",
      recipientName = "Người nhận",
      amount = 0,
      fee = 0,
      total = 0,
      remainingBalance = 0,
      outputDir = path.resolve(__dirname, '../commands/cache'),
      theme = 'blue' // 'blue', 'purple', 'green', 'dark', 'gold'
    } = options;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Enhanced themes with more sophisticated color schemes
    const themes = {
      blue: {
        primary: '#1976d2',
        secondary: '#0d47a1',
        accent: '#42a5f5',
        highlight: '#bbdefb',
        background: '#f5f9ff',
        gradientStart: '#1a237e',
        gradientEnd: '#283593',
        buttonGradientStart: '#1976d2',
        buttonGradientEnd: '#0d47a1'
      },
      purple: {
        primary: '#7b1fa2',
        secondary: '#4a148c',
        accent: '#ba68c8',
        highlight: '#e1bee7',
        background: '#f8f5ff',
        gradientStart: '#4a148c',
        gradientEnd: '#6a1b9a',
        buttonGradientStart: '#7b1fa2',
        buttonGradientEnd: '#4a148c'
      },
      green: {
        primary: '#388e3c',
        secondary: '#1b5e20',
        accent: '#66bb6a',
        highlight: '#c8e6c9',
        background: '#f5fff7',
        gradientStart: '#1b5e20',
        gradientEnd: '#2e7d32',
        buttonGradientStart: '#388e3c',
        buttonGradientEnd: '#1b5e20'
      },
      dark: {
        primary: '#455a64',
        secondary: '#263238',
        accent: '#78909c',
        highlight: '#cfd8dc',
        background: '#f5f5f5',
        gradientStart: '#212121',
        gradientEnd: '#424242',
        buttonGradientStart: '#455a64',
        buttonGradientEnd: '#263238'
      },
      gold: {
        primary: '#ffa000',
        secondary: '#ff6f00',
        accent: '#ffca28',
        highlight: '#ffecb3',
        background: '#fffdf5',
        gradientStart: '#bf360c',
        gradientEnd: '#e65100',
        buttonGradientStart: '#ffa000',
        buttonGradientEnd: '#ff6f00'
      }
    };

    const colors = themes[theme] || themes.blue;

    // Canvas dimensions (increased height for more content)
    const width = 1000;
    const height = 850;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background with enhanced gradient and texture
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, colors.gradientStart);
    bgGradient.addColorStop(1, colors.gradientEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle background pattern (dots grid)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < width; x += 20) {
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Add diagonal lines for texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = -height; i < width + height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Add particle effects for modern look
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 120; i++) {
      const particleSize = Math.random() * 4 + 1;
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

    // Main content card with enhanced shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = colors.background;
    roundRect(ctx, 50, 50, width - 100, height - 100, 25);
    ctx.restore();

    // Decorative corner accents
    function drawCornerAccent(x, y, size, rotate) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotate * Math.PI / 2);
      
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, 0);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, size);
      ctx.stroke();
      
      ctx.restore();
    }

    // Draw corner accents
    drawCornerAccent(65, 65, 25, 0);
    drawCornerAccent(width - 65, 65, 25, 1);
    drawCornerAccent(width - 65, height - 65, 25, 2);
    drawCornerAccent(65, height - 65, 25, 3);

    // Modern asymmetric header
    const headerHeight = 150;
    const headerGradient = ctx.createLinearGradient(0, 50, width, 50 + headerHeight);
    headerGradient.addColorStop(0, colors.gradientStart);
    headerGradient.addColorStop(1, colors.gradientEnd);

    // Angled header for modern design
    ctx.fillStyle = headerGradient;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(width - 50, 50);
    ctx.lineTo(width - 50, 50 + headerHeight);
    ctx.lineTo(80, 50 + headerHeight);
    ctx.closePath();
    ctx.fill();

    // Add decorative wave pattern in header
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let y = 65; y < headerHeight + 35; y += 15) {
      ctx.beginPath();
      for (let x = 80; x < width - 60; x += 10) {
        ctx.lineTo(x, y + Math.sin(x/40) * 5);
      }
      ctx.stroke();
    }

    // Enhanced logo with glowing effect
    const circleX = 140;
    const circleY = 110;
    const circleRadius = 45;

    // Create glow effect
    const glowRadius = circleRadius * 2;
    const glow = ctx.createRadialGradient(
      circleX, circleY, circleRadius * 0.8,
      circleX, circleY, glowRadius
    );
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(circleX, circleY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    const circleGradient = ctx.createRadialGradient(
      circleX - circleRadius/3, circleY - circleRadius/3, 0,
      circleX, circleY, circleRadius
    );
    circleGradient.addColorStop(0, '#ffffff');
    circleGradient.addColorStop(1, '#f0f0f0');
    
    ctx.fillStyle = circleGradient;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add shadow to logo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.font = `bold ${circleRadius * 1.3}px ${getFontFamily()}`;
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', circleX, circleY);
    ctx.shadowColor = 'transparent';

    // Stylish title with reflection effect
    ctx.font = `bold 50px ${getFontFamily()}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BIÊN LAI CHUYỂN KHOẢN', width / 2, 110);
    
    // Reflection effect for title
    const gradient = ctx.createLinearGradient(0, 110 + 25, 0, 110 + 45);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.font = `bold 50px ${getFontFamily()}`;
    ctx.fillStyle = gradient;
    ctx.scale(1, -0.3); // Flatten for reflection
    ctx.fillText('BIÊN LAI CHUYỂN KHOẢN', width / 2, -110 / 0.3);
    ctx.resetTransform();

    // Main content area with subtle texture
    const contentY = 50 + headerHeight;
    const contentHeight = height - 50 - headerHeight - 70;
    
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 80, contentY + 20, width - 160, contentHeight, 15);
    
    // Add subtle grain texture to content area
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 5000; i++) {
        const x = 80 + Math.random() * (width - 160);
        const y = contentY + 20 + Math.random() * contentHeight;
        const opacity = Math.random() * 0.03;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Enhanced date and time display with better styling
    const now = new Date();
    const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });
    
    const dateY = contentY + 60;
    
    // Date background pill
    ctx.fillStyle = colors.highlight;
    roundRect(ctx, width/2 - 200, dateY - 15, 400, 30, 15);
    
    ctx.font = `bold 18px ${getFontFamily()}`;
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateTimeFormat.format(now), width / 2, dateY);

    // Transaction ID with enhanced styling
    const transactionId = generateTransactionId();
    const idBox = {
      x: (width - 400) / 2,
      y: contentY + 80,
      width: 400,
      height: 40
    };

    // Stylish ID box with gradient border
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    roundRect(ctx, idBox.x, idBox.y, idBox.width, idBox.height, 20, false, true);
    
    // Glass effect background
    const idGradient = ctx.createLinearGradient(
      idBox.x, idBox.y, 
      idBox.x, idBox.y + idBox.height
    );
    idGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    idGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = idGradient;
    roundRect(ctx, idBox.x, idBox.y, idBox.width, idBox.height, 20);

    ctx.font = `medium 17px ${getFontFamily()}`;
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Mã giao dịch: ${transactionId}`, width / 2, idBox.y + idBox.height / 2);

    // Main content layout with improved spacing
    const startY = contentY + 150;
    const lineHeight = 70;
    /**
     * Helper function to draw person field with icon - MOVED INSIDE TRY BLOCK
     */
    function drawPersonField(label, value, y, colors) {
      // Icon with circle background
      ctx.fillStyle = colors.highlight;
      ctx.beginPath();
      ctx.arc(120, y - 5, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.font = `bold 22px ${getFontFamily()}`;
      ctx.fillStyle = '#424242';
      ctx.textAlign = 'left';
      ctx.fillText(label, 150, y);
      
      // Value with enhanced background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      const textWidth = ctx.measureText(value).width;
      const bgPadding = 20;
      roundRect(ctx, 350 - bgPadding, y - 22, textWidth + bgPadding * 2, 44, 12);
      
      // Add subtle gradient to value background
      const valueGradient = ctx.createLinearGradient(
        350 - bgPadding, y - 22,
        350 - bgPadding, y + 22
      );
      valueGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      valueGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = valueGradient;
      roundRect(ctx, 350 - bgPadding, y - 22, textWidth + bgPadding * 2, 44, 12);
      
      // Value text with slight shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.font = `medium 24px ${getFontFamily()}`;
      ctx.fillStyle = colors.primary;
      ctx.fillText(value, 350, y);
      ctx.shadowColor = 'transparent';
    }

    function drawAmountField(label, value, y, color) {
      // Icon with circle background
      ctx.fillStyle = colors.highlight;
      ctx.beginPath();
      ctx.arc(120, y - 5, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Label with enhanced styling
      ctx.font = `bold 22px ${getFontFamily()}`;
      ctx.fillStyle = '#424242';
      ctx.textAlign = 'left';
      ctx.fillText(label, 150, y);
      
      // Stylish right-aligned value with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.font = `bold 28px ${getFontFamily()}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(value, width - 150, y);
      ctx.shadowColor = 'transparent';
    }

    // Draw sender and recipient info
    drawPersonField('👤 Người gửi:', senderName, startY, colors);
    drawPersonField('👥 Người nhận:', recipientName, startY + lineHeight, colors);

    // Separator line with enhanced styling
    const lineY = startY + lineHeight * 1.8;
    const lineGradient = ctx.createLinearGradient(100, lineY, width - 100, lineY);
    lineGradient.addColorStop(0, 'rgba(200, 200, 200, 0.1)');
    lineGradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
    lineGradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
    
    // Draw dotted line for visual interest
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(100, lineY);
    ctx.lineTo(width - 100, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw decorative corner elements at separator line
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(100, lineY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - 100, lineY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw amount information with enhanced styling
    drawAmountField('💸 Số tiền gửi:', formatNumber(amount) + ' $', startY + lineHeight * 2.3, '#2e7d32');
    drawAmountField('🧾 Phí giao dịch:', formatNumber(fee) + ' $', startY + lineHeight * 3.1, '#ff9800');
    
    // Enhanced total amount box
    const totalY = startY + lineHeight * 4;
    
    // Total box with glass effect and gradient border
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    roundRect(ctx, 100, totalY - 35, width - 200, 80, 15);
    ctx.restore();
    
    // Add gradient border
    const borderGradient = ctx.createLinearGradient(100, totalY, width - 100, totalY);
    borderGradient.addColorStop(0, colors.accent);
    borderGradient.addColorStop(1, colors.primary);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    roundRect(ctx, 100, totalY - 35, width - 200, 80, 15, false, true);

    // Total amount label
    ctx.font = `bold 28px ${getFontFamily()}`;
    ctx.fillStyle = '#424242';
    ctx.textAlign = 'left';
    ctx.fillText('💰 Tổng tiền:', 150, totalY + 5);
    
    // Total amount value with enhanced gradient effect
    const totalGradient = ctx.createLinearGradient(350, totalY - 15, 750, totalY + 25);
    totalGradient.addColorStop(0, '#d32f2f');
    totalGradient.addColorStop(1, '#f44336');
    
    ctx.fillStyle = totalGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.font = `bold 38px ${getFontFamily()}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(total)} $`, width - 150, totalY + 5);
    ctx.shadowColor = 'transparent';

    // Enhanced remaining balance section
    const balanceY = startY + lineHeight * 5.1;
    
    // Balance box with subtle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    roundRect(ctx, 100, balanceY - 25, width - 200, 70, 15);
    
    // Add subtle pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    for (let x = 110; x < width - 110; x += 10) {
      for (let y = balanceY - 15; y < balanceY + 35; y += 10) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Balance label
    ctx.font = `bold 24px ${getFontFamily()}`;
    ctx.fillStyle = '#424242';
    ctx.textAlign = 'left';
    ctx.fillText('💳 Số dư còn lại:', 150, balanceY + 10);
    
    // Balance value
    ctx.font = `bold 28px ${getFontFamily()}`;
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(remainingBalance)} $`, width - 150, balanceY + 10);

    // Generate a verification QR code (simulate)
    try {
      const qrCodeSize = 100;
      const qrCodeData = `VERIFY:${transactionId}:${total}:${Date.now()}`;
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: qrCodeSize
      });
      
      const qrImage = await loadImage(qrCodeUrl);
      ctx.drawImage(qrImage, width - 150, height - 170, qrCodeSize, qrCodeSize);
      
      // Add QR code label
      ctx.font = `bold 12px ${getFontFamily()}`;
      ctx.fillStyle = '#757575';
      ctx.textAlign = 'center';
      ctx.fillText('QR XÁC THỰC', width - 100, height - 60);
    } catch (qrError) {
      console.log("QR code generation failed:", qrError);
    }

    // Add security watermark
    ctx.font = `light 100px ${getFontFamily()}`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(width/2, height/2);
    ctx.rotate(-Math.PI/10);
    ctx.fillText('VERIFIED', 0, 0);
    ctx.resetTransform();

    // Add footer with security text
    ctx.font = `light 14px ${getFontFamily()}`;
    ctx.fillStyle = '#757575';
    ctx.textAlign = 'center';
    ctx.fillText('Giao dịch được bảo mật và xác thực bởi hệ thống', width / 2, height - 80);
    ctx.fillText(`© ${new Date().getFullYear()} • Mọi giao dịch được lưu trữ và bảo vệ`, width / 2, height - 60);

    // Add decorative stamp (official seal)
    const stampX = 140;
    const stampY = height - 120;
    const stampRadius = 40;
    
    // Stamp background
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(stampX, stampY, stampRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Stamp border
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(stampX, stampY, stampRadius - 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Stamp text
    ctx.font = `bold 12px ${getFontFamily()}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Create circular text
    for (let i = 0; i < 360; i += 30) {
      ctx.save();
      ctx.translate(stampX, stampY);
      ctx.rotate(i * Math.PI / 180);
      ctx.fillText('•', 0, -stampRadius + 12);
      ctx.restore();
    }
    
    ctx.font = `bold 14px ${getFontFamily()}`;
    ctx.fillText('OFFICIAL', stampX, stampY - 10);
    ctx.fillText('TRANSACTION', stampX, stampY + 10);
    
    ctx.globalAlpha = 1.0;

    // Generate output file
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