const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Constants for styling
const BACKGROUND_IMAGES = [
    'https://imgur.com/Wh1tYtZ.jpg', // Tech lab background
    'https://imgur.com/TYfa3vp.jpg', // Capsule Corp interior
    'https://imgur.com/cjDCXTy.jpg'  // Space technology room
];

// Radar vendor image
const VENDOR_IMAGE = 'https://imgur.com/r8rqEdB.png'; // Bulma or tech scientist

// Fonts
const TITLE_FONT = '"BeVietnamPro"';
const TEXT_FONT = '"Chakra Petch"';
const PRICE_FONT = '"Teko"';

// Vendor dialogues
const VENDOR_DIALOGUES = [
    "Radar mới nhất đã đến! Công nghệ tiên tiến nhất để tìm Ngọc Rồng!",
    "Đây là phiên bản mới nhất từ Capsule Corp, hiệu quả hơn 200%!",
    "Với radar này, cậu có thể tìm thấy Ngọc Rồng từ khoảng cách xa!",
    "Tăng cấp radar của cậu ngay! Đừng để người khác tìm thấy Ngọc Rồng trước!",
    "Thiết kế đặc biệt, nhỏ gọn và bền hơn những phiên bản trước rất nhiều!",
    "Đây là model mới nhất, với pin dùng được đến 5 năm không cần sạc!"
];

/**
 * Main function to create radar shop image
 * @param {Object} data Data containing radar info and player details
 * @returns {String} Path to the generated image
 */
module.exports = async function createRadarShopImage(data) {
    try {
        // Register fonts
        const fontPath = path.join(__dirname, '../../fonts/Saiyan-Sans.ttf');
        Canvas.registerFont(fontPath, { family: 'Saiyan Sans' });
        
        const tekoFontPath = path.join(__dirname, '../../fonts/Teko-Bold.ttf');
        if (fs.existsSync(tekoFontPath)) {
            Canvas.registerFont(tekoFontPath, { family: 'Teko', weight: 'bold' });
        }
        
        const chakraPath = path.join(__dirname, '../../fonts/ChakraPetch-Bold.ttf');
        if (fs.existsSync(chakraPath)) {
            Canvas.registerFont(chakraPath, { family: 'Chakra Petch', weight: 'bold' });
        }
        
        // Create canvas with better ratio for showing 9 items
        const canvas = Canvas.createCanvas(900, 1300); // Reduced height
        const ctx = canvas.getContext('2d');
        
        // Draw backgrounds and UI elements
        await drawTechBackground(ctx, canvas.width, canvas.height);
        drawShopFrame(ctx, canvas.width, canvas.height);
        
        // Draw vendor dialogue (keeping this but adjust position)
        drawVendorDialogue(ctx, canvas.width, canvas.height);
        
        // Draw radar items
        drawRadarItems(ctx, canvas.width, canvas.height, data);
        
        // Draw player info
        if (data.player) {
            drawPlayerInfo(ctx, canvas.width, canvas.height, data.player);
        }
        
        // Add tech particle effects
        drawTechEffects(ctx, canvas.width, canvas.height);
        
        // Save the image
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const buffer = canvas.toBuffer('image/png');
        const outputPath = path.join(__dirname, 'cache', 'radar_shop.png');
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (err) {
        console.error('Error creating radar shop image:', err);
        return null;
    }
};

/**
 * Draw the tech lab background
 */
async function drawTechBackground(ctx, width, height) {
    try {
        // Choose a random background image
        const bgUrl = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
        const bgImage = await Canvas.loadImage(bgUrl);
        
        // Draw background with blue overlay for tech feeling
        ctx.drawImage(bgImage, 0, 0, width, height);
        
        // Add tech overlay
        ctx.fillStyle = 'rgba(0, 20, 50, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Add tech grid lines
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Add blue tech gradient glow
        const gradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, height);
        gradient.addColorStop(0, 'rgba(0, 128, 255, 0.1)');
        gradient.addColorStop(0.3, 'rgba(0, 64, 128, 0.05)');
        gradient.addColorStop(0.6, 'rgba(0, 32, 80, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 40, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
    } catch (error) {
        // Fallback to basic background if image fails to load
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#001033');
        gradient.addColorStop(1, '#000033');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

/**
 * Draw the vendor character
 */
async function drawVendorImage(ctx, width, height) {
    try {
        const vendorImage = await Canvas.loadImage(VENDOR_IMAGE);
        
        // Position vendor on the bottom part of the screen
        const vendorWidth = 300;
        const vendorHeight = 400;
        const vendorX = width/2 - vendorWidth/2;
        const vendorY = height - vendorHeight - 120;
        
        ctx.drawImage(vendorImage, vendorX, vendorY, vendorWidth, vendorHeight);
        
        // Add tech glow around vendor
        ctx.save();
        ctx.beginPath();
        ctx.arc(vendorX + vendorWidth/2, vendorY + vendorHeight/2, vendorWidth/1.8, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
            vendorX + vendorWidth/2, vendorY + vendorHeight/2, 10,
            vendorX + vendorWidth/2, vendorY + vendorHeight/2, vendorWidth/1.5
        );
        glowGradient.addColorStop(0, 'rgba(0, 195, 255, 0.15)');
        glowGradient.addColorStop(0.5, 'rgba(0, 128, 255, 0.08)');
        glowGradient.addColorStop(1, 'rgba(0, 64, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.restore();
        
    } catch (error) {
        // Draw generic vendor silhouette if image fails
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.fillRect(width/2 - 150, height - 520, 300, 400);
    }
}

/**
 * Draw the shop frame and title
 */
function drawShopFrame(ctx, width, height) {
    // Draw main shop container
    ctx.save();
    
    // Outer glow
    ctx.shadowColor = 'rgba(0, 195, 255, 0.6)';
    ctx.shadowBlur = 20;
    
    // Main shop box
    ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.8)';
    ctx.lineWidth = 4;
    
    // Create shop panel - optimized for radar display
    const shopX = 50;
    const shopY = 140; // Moved up
    const shopWidth = width - 100;
    const shopHeight = height - 250; // Increased height for more space
    ctx.beginPath();
    ctx.roundRect(shopX, shopY, shopWidth, shopHeight, 15);
    ctx.fill();
    ctx.stroke();
    
    // Remove shadow for inner elements
    ctx.shadowBlur = 0;
    
    // Add decorative top panel
    ctx.beginPath();
    const patternGradient = ctx.createLinearGradient(shopX, shopY, shopX + shopWidth, shopY);
    patternGradient.addColorStop(0, 'rgba(0, 128, 255, 0.6)');
    patternGradient.addColorStop(0.5, 'rgba(0, 195, 255, 0.8)');
    patternGradient.addColorStop(1, 'rgba(0, 128, 255, 0.6)');
    ctx.fillStyle = patternGradient;
    ctx.roundRect(shopX, shopY, shopWidth, 50, {tl: 15, tr: 15, bl: 0, br: 0});
    ctx.fill();
    
    // Shop title
    ctx.font = `bold 36px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('CỬA HÀNG RADAR NGỌC RỒNG', shopX + shopWidth/2, shopY + 35);
    
    // Draw footer with tech elements
    ctx.fillStyle = 'rgba(0, 128, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(shopX, shopY + shopHeight - 60, shopWidth, 55, {tl: 0, tr: 0, bl: 15, br: 15});
    ctx.fill();
    
    // Draw tech symbols in footer
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(0, 195, 255, 0.6)';
    const symbols = '⚙️ 🔋 📡 🛰️ 🔬 💾 📱 🔭';
    ctx.fillText(symbols, shopX + shopWidth/2, shopY + shopHeight - 25);
    
    ctx.restore();
    
    // Draw separator
    ctx.beginPath();
    ctx.moveTo(shopX + 40, shopY + 70);
    ctx.lineTo(shopX + shopWidth - 40, shopY + 70);
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Decorative ends
    ctx.beginPath();
    ctx.arc(shopX + 40, shopY + 70, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 195, 255, 0.8)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(shopX + shopWidth - 40, shopY + 70, 5, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw the vendor's dialogue in a speech bubble
 */
function drawVendorDialogue(ctx, width, height) {
    const dialogue = VENDOR_DIALOGUES[Math.floor(Math.random() * VENDOR_DIALOGUES.length)];
    
    // Create speech bubble
    ctx.save();
    
    // Speech bubble coordinates - positioned at top
    const bubbleX = width/2 - 350/2;
    const bubbleY = 20; // Moved up
    const bubbleWidth = 350;
    const bubbleHeight = 100;
    const cornerRadius = 15;
    
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw main bubble
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);
    ctx.fillStyle = 'rgba(0, 32, 64, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw speech pointer - no pointer needed
    
    // Draw vendor name
    ctx.font = `bold 18px ${TEXT_FONT}`;
    ctx.fillStyle = '#00C3FF'; // Blue for tech vendor name
    ctx.textAlign = 'left';
    ctx.fillText("BULMA:", bubbleX + 15, bubbleY + 25);
    
    // Draw dialogue text
    ctx.font = `14px ${TEXT_FONT}`;
    ctx.fillStyle = '#FFFFFF';
    
    // Word wrap dialogue
    const words = dialogue.split(' ');
    let line = '';
    let y = bubbleY + 45;
    const maxWidth = bubbleWidth - 30;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, bubbleX + 15, y);
            line = words[i] + ' ';
            y += 20;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, bubbleX + 15, y);
    
    ctx.restore();
}

/**
 * Draw all available radar items
 */
function drawRadarItems(ctx, width, height, data) {
    const radarItems = data.radarItems || [];
    
    if (radarItems.length === 0) {
        drawNoRadarItems(ctx, width, height);
        return;
    }
    
    const shopX = 50;
    const shopY = 140; // Adjusted to match new shop position
    const shopWidth = width - 100;
    const shopHeight = height - 250; // Adjusted to match new shop height
    
    // Draw section title
    ctx.font = `bold 22px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00C3FF';
    ctx.fillText('NÂNG CẤP RADA NGỌC RỒNG', shopX + shopWidth/2, shopY + 100);
    
    // Calculate grid layout for 3x3 grid
    const columns = 3;
    const rows = 3;
    
    // Calculate item dimensions to fit the grid properly
    const itemWidth = (shopWidth - 80) / columns;
    const itemHeight = (shopHeight - 190) / rows;
    const horizontalPadding = 20;
    const verticalPadding = 10;
    
    const startX = shopX + horizontalPadding;
    const startY = shopY + 120;
    
    // Draw items in a 3x3 grid layout with even spacing
    radarItems.forEach((radar, index) => {
        if (index >= 9) return; // Limit to 9 items (3x3 grid)
        
        const col = index % columns;
        const row = Math.floor(index / columns);
        
        const x = startX + col * (itemWidth + horizontalPadding/2);
        const y = startY + row * (itemHeight + verticalPadding);
        
        drawRadarItem(ctx, x, y, itemWidth - horizontalPadding/2, itemHeight - verticalPadding, radar, index + 1);
    });
}

/**
 * Draw individual radar item
 */function drawRadarItem(ctx, x, y, width, height, radar, index) {
    ctx.save();
    
    // Draw radar background with tech glow
    ctx.shadowColor = getRadarColorByLevel(radar.id);
    ctx.shadowBlur = 15;
    
    // Item background
    ctx.fillStyle = 'rgba(5, 15, 30, 0.9)';
    ctx.strokeStyle = getRadarColorByLevel(radar.id, 0.8);
    ctx.lineWidth = 2;
    
    // Rounded rectangle for item
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    
    // Remove shadow for text
    ctx.shadowBlur = 0;
    
    // Draw radar index/level
    ctx.fillStyle = getRadarColorByLevel(radar.id);
    ctx.font = `bold 20px ${TEXT_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`Cấp ${index}`, x + width/2, y + 25);
    
    // Draw radar emoji/icon - make slightly smaller for 3x3 grid
    ctx.font = '50px Arial';
    ctx.fillText('📡', x + width/2, y + 75);
    
    // Draw radar name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 16px ${TEXT_FONT}`;
    ctx.fillText(radar.name, x + width/2, y + 110);
    
    // Draw horizontal separator
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 125);
    ctx.lineTo(x + width - 20, y + 125);
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw radar description with colored text - more condensed
    ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
    ctx.font = `13px ${TEXT_FONT}`;
    
    // Word wrap description - more compact
    const description = radar.description;
    const words = description.split(' ');
    let line = '';
    let descY = y + 145;
    const maxWidth = width - 20;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x + width/2, descY);
            line = words[i] + ' ';
            descY += 18; // Reduced line height
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x + width/2, descY);
    
    // Draw boost value
    ctx.font = `bold 16px ${TEXT_FONT}`;
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(`Tăng: +${Math.round((radar.boost-1)*100)}%`, x + width/2, y + 190);
    
    // Draw price
    ctx.fillStyle = '#00FF00';
    ctx.font = `bold 18px ${PRICE_FONT}`;
    ctx.fillText(`${radar.price.toLocaleString()} Zeni`, x + width/2, y + height - 15);
    
    // Add tech circuit pattern around the edges
    drawCircuitPattern(ctx, x, y, width, height);
    
    ctx.restore();
}
/**
 * Draw a circuit board pattern around the radar item
 */
function drawCircuitPattern(ctx, x, y, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Top left corner
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 10);
    ctx.lineTo(x + 30, y + 10);
    ctx.lineTo(x + 30, y + 30);
    ctx.stroke();
    
    // Top right corner
    ctx.beginPath();
    ctx.moveTo(x + width - 10, y + 10);
    ctx.lineTo(x + width - 30, y + 10);
    ctx.lineTo(x + width - 30, y + 30);
    ctx.stroke();
    
    // Bottom left corner
    ctx.beginPath();
    ctx.moveTo(x + 10, y + height - 10);
    ctx.lineTo(x + 30, y + height - 10);
    ctx.lineTo(x + 30, y + height - 30);
    ctx.stroke();
    
    // Bottom right corner
    ctx.beginPath();
    ctx.moveTo(x + width - 10, y + height - 10);
    ctx.lineTo(x + width - 30, y + height - 10);
    ctx.lineTo(x + width - 30, y + height - 30);
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Get color based on radar level
 */
function getRadarColorByLevel(radarId, alpha = 1) {
    const level = parseInt(radarId.replace('radar_', ''));
    switch(level) {
        case 1: return `rgba(0, 128, 255, ${alpha})`;  // Light blue
        case 2: return `rgba(0, 200, 200, ${alpha})`;  // Cyan
        case 3: return `rgba(0, 255, 128, ${alpha})`;  // Light green
        case 4: return `rgba(128, 255, 0, ${alpha})`;  // Yellow-green
        case 5: return `rgba(255, 255, 0, ${alpha})`;  // Yellow
        case 6: return `rgba(255, 128, 0, ${alpha})`;  // Orange
        case 7: return `rgba(255, 0, 128, ${alpha})`;  // Pink
        case 8: return `rgba(255, 0, 255, ${alpha})`;  // Magenta
        case 9: return `rgba(128, 0, 255, ${alpha})`;  // Purple
        default: return `rgba(255, 255, 255, ${alpha})`; // White
    }
}

/**
 * Draw message when no radar items are available
 */
function drawNoRadarItems(ctx, width, height) {
    const shopX = 50;
    const shopY = 180;
    const shopWidth = width - 100;
    const shopHeight = height - 500;
    
    ctx.save();
    ctx.font = `bold 28px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('KHÔNG CÓ RADAR KHẢ DỤNG', shopX + shopWidth/2, shopY + shopHeight/2 - 40);
    
    ctx.font = `18px ${TEXT_FONT}`;
    ctx.fillText('Hiện tại cửa hàng đang hết radar. Vui lòng quay lại sau!', shopX + shopWidth/2, shopY + shopHeight/2 + 10);
    ctx.restore();
}

/**
 * Draw player info section - adapted for 9:16 ratio
 */
function drawPlayerInfo(ctx, width, height, player) {
    // Position at bottom of screen
    const infoX = 50;
    const infoY = height - 90;
    const infoWidth = width - 100;
    const infoHeight = 70;
    
    // Draw player info box
    ctx.save();
    ctx.fillStyle = 'rgba(0, 10, 30, 0.8)';
    ctx.strokeStyle = 'rgba(0, 195, 255, 0.6)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoWidth, infoHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Draw player info
    ctx.font = `18px ${TEXT_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Tên: ${player.name}`, infoX + 20, infoY + 30);
    ctx.fillText(`Hành tinh: ${player.planet || "EARTH"}`, infoX + 20, infoY + 55);
    
    // Draw zeni
    ctx.font = `bold 22px ${PRICE_FONT}`;
    ctx.fillStyle = '#00FF00';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 Zeni: ${player.stats?.zeni?.toLocaleString() || 0}`, infoX + infoWidth - 20, infoY + 40);
    
    ctx.restore();
}
/**
 * Add tech particle effects
 */
function drawTechEffects(ctx, width, height) {
    // Draw data particles
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        
        // Binary-like dots
        const colors = [
            'rgba(0, 255, 255, 0.7)',  // Cyan
            'rgba(0, 128, 255, 0.7)',  // Blue
            'rgba(255, 255, 255, 0.7)' // White
        ];
        
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw scanning lines
    const scanLineCount = 5;
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < scanLineCount; i++) {
        const y = (height / scanLineCount) * i + Math.random() * 100;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}