const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants for styling
const BACKGROUND_IMAGES = [
    'https://imgur.com/7tjrXHV.jpg', // Mystic shop background
    'https://imgur.com/cDKk2eN.jpg', // Ancient temple
    'https://imgur.com/trb0R0j.jpg'  // Magical forest
];

// Amulet vendor images
const VENDOR_IMAGE = 'https://imgur.com/fxuWTtD.png'; // Old lady mystic vendor

// Fonts
const TITLE_FONT = '"BeVietnamPro"';
const TEXT_FONT = '"Chakra Petch"';
const PRICE_FONT = '"Teko"';

// Amulet vendor dialogues (randomized for flavor)
const VENDOR_DIALOGUES = [
    "Chào con! Bùa của ta sẽ giúp con vượt qua mọi thử thách.",
    "Hahaha! Bà già này còn những bùa chú cổ xưa không ai biết!",
    "Bùa của ta đã giúp cả các vị thần chiến thắng, con có muốn thử không?",
    "Ây da! Đừng nhìn ta như vậy, ta có thể già nhưng bùa của ta rất mạnh!",
    "Con muốn sức mạnh? Bùa của ta sẽ biến con thành chiến binh vô địch!",
    "Mua đi, mua đi! Không hối hận đâu, trừ khi... thôi con đừng lo!"
];

/**
 * Main function to create amulet shop image
 * @param {Object} data Data containing amulet info and player details
 * @returns {String} Path to the generated image
 */
module.exports = async function createAmuletShopImage(data) {
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
        
        // Create canvas
        const canvas = Canvas.createCanvas(1200, 800);
        const ctx = canvas.getContext('2d');
        
        // Draw backgrounds and UI elements
        await drawMysticBackground(ctx, canvas.width, canvas.height);
        await drawVendorImage(ctx, canvas.width, canvas.height);
        drawShopFrame(ctx, canvas.width, canvas.height);
        
        // Draw vendor dialogue
        drawVendorDialogue(ctx, canvas.width, canvas.height);
        
        // Draw amulet items
        drawAmulets(ctx, canvas.width, canvas.height, data);
        
        // Draw player info
        if (data.player) {
            drawPlayerInfo(ctx, canvas.width, canvas.height, data.player);
        }
        
        // Add mystical particle effects
        drawMysticEffects(ctx, canvas.width, canvas.height);
        
        // Save the image
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const buffer = canvas.toBuffer('image/png');
        const outputPath = path.join(__dirname, 'cache', 'amulet_shop.png');
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (err) {
        console.error('Error creating amulet shop image:', err);
        return null;
    }
};

/**
 * Draw the mystical shop background
 */
async function drawMysticBackground(ctx, width, height) {
    try {
        // Choose a random background image
        const bgUrl = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
        const bgImage = await Canvas.loadImage(bgUrl);
        
        // Draw background with darkened overlay for readability
        ctx.drawImage(bgImage, 0, 0, width, height);
        
        // Add dark overlay for better text readability
        ctx.fillStyle = 'rgba(0, 0, 30, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Add mystical fog/mist effect
        const gradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, height);
        gradient.addColorStop(0, 'rgba(128, 0, 255, 0.1)');
        gradient.addColorStop(0.3, 'rgba(80, 0, 128, 0.05)');
        gradient.addColorStop(0.6, 'rgba(40, 0, 80, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 40, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
    } catch (error) {
        // Fallback to basic background if image fails to load
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(1, '#000033');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

/**
 * Draw the amulet vendor character
 */
async function drawVendorImage(ctx, width, height) {
    try {
        const vendorImage = await Canvas.loadImage(VENDOR_IMAGE);
        
        // Position vendor on the left side of screen
        const vendorWidth = 300;
        const vendorHeight = 500;
        const vendorX = 50;
        const vendorY = height - vendorHeight - 20;
        
        ctx.drawImage(vendorImage, vendorX, vendorY, vendorWidth, vendorHeight);
        
        // Add mystical glow around vendor
        ctx.save();
        ctx.beginPath();
        ctx.arc(vendorX + vendorWidth/2, vendorY + vendorHeight/2, vendorWidth/1.8, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
            vendorX + vendorWidth/2, vendorY + vendorHeight/2, 10,
            vendorX + vendorWidth/2, vendorY + vendorHeight/2, vendorWidth/1.5
        );
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        glowGradient.addColorStop(0.5, 'rgba(255, 128, 0, 0.08)');
        glowGradient.addColorStop(1, 'rgba(255, 0, 128, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.restore();
        
    } catch (error) {
        // Draw generic vendor silhouette if image fails
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.fillRect(50, height - 500, 300, 480);
    }
}

/**
 * Draw the shop frame and title
 */
function drawShopFrame(ctx, width, height) {
    // Draw main shop container
    ctx.save();
    
    // Outer shadow glow
    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 20;
    
    // Main shop box
    ctx.fillStyle = 'rgba(40, 20, 60, 0.85)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 4;
    
    // Create rounded rectangle
    const shopX = 400;
    const shopY = 100;
    const shopWidth = 720;
    const shopHeight = 650;
    ctx.beginPath();
    ctx.roundRect(shopX, shopY, shopWidth, shopHeight, 15);
    ctx.fill();
    ctx.stroke();
    
    // Remove shadow for inner elements
    ctx.shadowBlur = 0;
    
    // Add decorative top pattern
    ctx.beginPath();
    const patternGradient = ctx.createLinearGradient(shopX, shopY, shopX + shopWidth, shopY);
    patternGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    patternGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    patternGradient.addColorStop(1, 'rgba(255, 215, 0, 0.6)');
    ctx.fillStyle = patternGradient;
    ctx.roundRect(shopX, shopY, shopWidth, 40, {tl: 15, tr: 15, bl: 0, br: 0});
    ctx.fill();
    
    // Shop title
    ctx.font = `bold 36px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ' rgba(255, 215, 0, 0.6)'; // Indigo color for title
    ctx.fillText('TIỆM BÙA BÀ HẠT MÍT', shopX + shopWidth/2, shopY + 35);
    
    // Draw footer with mystical symbols
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(shopX, shopY + shopHeight - 55, shopWidth, 50, {tl: 0, tr: 0, bl: 15, br: 15});
    ctx.fill();
    
    // Draw mystical symbols in footer
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    const symbols = '☮️✝️☪️🕉️☸️🔯✡️🪯🕎☯️☦️🛐⛎♈⚛️♑♒♓';
    ctx.fillText(symbols, shopX + shopWidth/2, shopY + shopHeight - 20);
    
    ctx.restore();
    
    // Draw scroll-like decorative element as separator
    ctx.beginPath();
    ctx.moveTo(shopX + 40, shopY + 60);
    ctx.lineTo(shopX + shopWidth - 40, shopY + 60);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Decorative scroll ends
    ctx.beginPath();
    ctx.arc(shopX + 40, shopY + 60, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(shopX + shopWidth - 40, shopY + 60, 5, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw the vendor's dialogue in a speech bubble
 */
function drawVendorDialogue(ctx, width, height) {
    const dialogue = VENDOR_DIALOGUES[Math.floor(Math.random() * VENDOR_DIALOGUES.length)];
    
    // Create speech bubble - đã di chuyển lên cao hơn
    ctx.save();
    
    // Speech bubble coordinates - Di chuyển lên trên để không bị che bởi các item
    const bubbleX = 180;
    const bubbleY = 100; // Điều chỉnh từ 180 xuống 100 để nằm cao hơn
    const bubbleWidth = 320;
    const bubbleHeight = 120;
    const cornerRadius = 20;
    
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Draw main bubble
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 50, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw speech pointer - Điều chỉnh để trỏ xuống dưới
    ctx.beginPath();
    ctx.moveTo(bubbleX + 70, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 40, bubbleY + bubbleHeight + 30);
    ctx.lineTo(bubbleX + 100, bubbleY + bubbleHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 50, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw vendor name
    ctx.font = `bold 22px ${TEXT_FONT}`;
    ctx.fillStyle = '#800080'; // Purple for vendor name
    ctx.textAlign = 'left';
    ctx.fillText("BÀ HẠT MÍT:", bubbleX + 20, bubbleY + 30);
    
    // Draw dialogue text
    ctx.font = `18px ${TEXT_FONT}`;
    ctx.fillStyle = '#000000';
    
    // Word wrap dialogue
    const words = dialogue.split(' ');
    let line = '';
    let y = bubbleY + 60;
    const maxWidth = bubbleWidth - 40;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, bubbleX + 20, y);
            line = words[i] + ' ';
            y += 25;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, bubbleX + 20, y);
    
    ctx.restore();
}
/**
 * Draw all available amulets
 */
function drawAmulets(ctx, width, height, data) {
    const amulets = data.amulets || [];
    
    if (amulets.length === 0) {
        drawNoAmulets(ctx, width, height);
        return;
    }
    
    const shopX = 400;
    const shopY = 100;
    const shopWidth = 720;
    
    // Draw section title
    ctx.font = `bold 28px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('BÙA CHÚA BẢO HỘ', shopX + shopWidth/2, shopY + 80);
    
    // Calculate grid layout - Tăng khoảng cách giữa các item
    const itemWidth = 210;
    const itemHeight = 230;
    const columns = 3;
    const padding = 20;
    const startX = shopX + (shopWidth - (columns * itemWidth + (columns-1) * padding)) / 2;
    const startY = shopY + 110; // Giảm từ 130 xuống 110 để tạo thêm khoảng cách với footer
    
    // Draw each amulet - Tăng khoảng cách giữa các hàng
    amulets.forEach((amulet, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        
        const x = startX + col * (itemWidth + padding);
        const y = startY + row * (itemHeight + padding); // Tăng padding từ padding/2 lên padding
        
        drawAmuletItem(ctx, x, y, itemWidth, itemHeight, amulet, index + 1);
    });
}
/**
 * Draw individual amulet item
 */
function drawAmuletItem(ctx, x, y, width, height, amulet, index) {
    ctx.save();
    
    // Draw amulet background with glow
    ctx.shadowColor = getAmuletColor(amulet.effect);
    ctx.shadowBlur = 15;
    
    // Item background
    ctx.fillStyle = 'rgba(30, 10, 40, 0.8)';
    ctx.strokeStyle = getAmuletColor(amulet.effect, 0.8);
    ctx.lineWidth = 3;
    
    // Rounded rectangle for item
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();
    
    // Remove shadow for text
    ctx.shadowBlur = 0;
    
    // Draw amulet index
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 24px ${TEXT_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`#${index}`, x + width/2, y + 30);
    
    // Draw amulet emoji
    ctx.font = '40px Arial';
    ctx.fillText(amulet.emoji, x + width/2, y + 75);
    
    // Draw amulet name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 20px ${TEXT_FONT}`;
    ctx.fillText(amulet.name, x + width/2, y + 110);
    
    // Draw horizontal separator
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 125);
    ctx.lineTo(x + width - 30, y + 125);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw amulet effect with colored text
    ctx.fillStyle = getAmuletColor(amulet.effect);
    ctx.font = `16px ${TEXT_FONT}`;
    
    // Word wrap effect description
    const description = amulet.description;
    const words = description.split(' ');
    let line = '';
    let effectY = y + 150;
    const maxWidth = width - 40;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x + width/2, effectY);
            line = words[i] + ' ';
            effectY += 20;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x + width/2, effectY);
    
    // Draw price
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 24px ${PRICE_FONT}`;
    ctx.fillText(`${amulet.price.toLocaleString()} Zeni`, x + width/2, y + height - 20);
    
    // Extra visual effect based on amulet type
    drawAmuletEffect(ctx, x, y, width, height, amulet.effect);
    
    ctx.restore();
}

/**
 * Draw special visual effect based on amulet type
 */
function drawAmuletEffect(ctx, x, y, width, height, effectType) {
    const centerX = x + width/2;
    const centerY = y + 75;
    const radius = 25;
    
    switch(effectType) {
        case 'immortal':
            // Draw pulsing golden circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            const immortalGradient = ctx.createRadialGradient(
                centerX, centerY, 1, centerX, centerY, radius
            );
            immortalGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            immortalGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.4)');
            immortalGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
            ctx.fillStyle = immortalGradient;
            ctx.fill();
            break;
            
        case 'damage_boost':
            // Draw fire-like effect
            ctx.beginPath();
            const fireGradient = ctx.createRadialGradient(
                centerX, centerY, 1, centerX, centerY, radius
            );
            fireGradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            fireGradient.addColorStop(0.7, 'rgba(255, 128, 0, 0.4)');
            fireGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
            ctx.fillStyle = fireGradient;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'health_boost':
            // Draw shield-like effect
            ctx.beginPath();
            const shieldGradient = ctx.createRadialGradient(
                centerX, centerY, 1, centerX, centerY, radius
            );
            shieldGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
            shieldGradient.addColorStop(0.7, 'rgba(0, 200, 0, 0.4)');
            shieldGradient.addColorStop(1, 'rgba(0, 128, 0, 0)');
            ctx.fillStyle = shieldGradient;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'ki_boost':
            // Draw ki energy effect
            ctx.beginPath();
            const kiGradient = ctx.createRadialGradient(
                centerX, centerY, 1, centerX, centerY, radius
            );
            kiGradient.addColorStop(0, 'rgba(0, 128, 255, 0.8)');
            kiGradient.addColorStop(0.7, 'rgba(0, 64, 255, 0.4)');
            kiGradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
            ctx.fillStyle = kiGradient;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'exp_boost':
            // Draw wisdom effect
            ctx.beginPath();
            const expGradient = ctx.createRadialGradient(
                centerX, centerY, 1, centerX, centerY, radius
            );
            expGradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
            expGradient.addColorStop(0.7, 'rgba(180, 0, 255, 0.4)');
            expGradient.addColorStop(1, 'rgba(128, 0, 255, 0)');
            ctx.fillStyle = expGradient;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

/**
 * Get color based on amulet effect type
 */
function getAmuletColor(effectType, alpha = 1) {
    switch(effectType) {
        case 'immortal': return `rgba(255, 215, 0, ${alpha})`;  // Gold
        case 'damage_boost': return `rgba(255, 80, 0, ${alpha})`; // Red-orange
        case 'health_boost': return `rgba(0, 200, 0, ${alpha})`; // Green
        case 'ki_boost': return `rgba(0, 128, 255, ${alpha})`; // Blue
        case 'exp_boost': return `rgba(230, 0, 230, ${alpha})`; // Purple
        default: return `rgba(255, 255, 255, ${alpha})`; // White
    }
}

/**
 * Draw player info section
 */
function drawPlayerInfo(ctx, width, height, player) {
    // Di chuyển bảng thông tin xuống dưới để không bị che items
    const infoX = 400;
    const infoY = 685; // Điều chỉnh từ 650 xuống 685 để nằm thấp hơn
    const infoWidth = 720;
    const infoHeight = 70;
    
    // Draw player info box
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 60, 0.8)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoWidth, infoHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Draw player info
    ctx.font = `18px ${TEXT_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Tên: ${player.name}`, infoX + 20, infoY + 25);
    ctx.fillText(`Tộc: ${player.race || "Không rõ"}`, infoX + 20, infoY + 50);
    
    // Draw zeni
    ctx.font = `bold 22px ${PRICE_FONT}`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 Zeni: ${player.zeni?.toLocaleString() || 0}`, infoX + infoWidth - 20, infoY + 40);
    
    ctx.restore();
}

/**
 * Draw all available amulets - Điều chỉnh khoảng cách giữa các item
 */
/**
 * Draw message when no amulets are available
 */
function drawNoAmulets(ctx, width, height) {
    const shopX = 400;
    const shopY = 100;
    const shopWidth = 720;
    const shopHeight = 650;
    
    ctx.save();
    ctx.font = `bold 32px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('KHÔNG CÓ BÙA NÀO KHẢ DỤNG', shopX + shopWidth/2, shopY + shopHeight/2 - 40);
    
    ctx.font = `20px ${TEXT_FONT}`;
    ctx.fillText('Bà Hạt Mít đã hết hàng. Hãy quay lại sau!', shopX + shopWidth/2, shopY + shopHeight/2 + 10);
    ctx.restore();
}

/**
 * Add mystical particle effects
 */
function drawMysticEffects(ctx, width, height) {
    // Draw floating mystical particles - Giảm số lượng hạt
    for (let i = 0; i < 30; i++) { // Giảm từ 50 xuống 30 hạt
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1; // Giảm kích thước từ 3 xuống 2
        
        // Vary particle colors - giảm opacity để không quá nổi bật
        const colors = [
            'rgba(255, 215, 0, 0.5)',  // Gold
            'rgba(255, 90, 255, 0.5)', // Pink
            'rgba(90, 200, 255, 0.5)', // Blue
            'rgba(255, 255, 255, 0.5)' // White
        ];
        
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add some larger glowing orbs - giảm số lượng và kích thước
    for (let i = 0; i < 5; i++) { // Giảm từ 8 xuống 5
        const x = 400 + Math.random() * 720;
        const y = 100 + Math.random() * 650;
        const radius = Math.random() * 8 + 3; // Giảm từ 10+5 xuống 8+3
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        orbGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); // Giảm opacity
        orbGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)'); // Giảm opacity
        orbGradient.addColorStop(1, 'rgba(255, 128, 0, 0)');
        ctx.fillStyle = orbGradient;
        ctx.fill();
    }
}