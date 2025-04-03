const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// High quality Dragon Ball images
const DRAGON_BALLS = [
    'https://imgur.com/XVa3mSj.png', // 1-star HD Dragon Ball
    'https://imgur.com/5j9lLGX.png', // 2-star HD Dragon Ball
    'https://imgur.com/UiQRnTD.png', // 3-star HD Dragon Ball
    'https://imgur.com/miFhucN.png'  // 4-star HD Dragon Ball
];

const SHENRON_IMAGE = 'https://imgur.com/A2VZVG4.png'; // Shenron dragon image
const DRAGON_BALL_Z_LOGO = 'https://imgur.com/IUm34m5.png'; // DBZ Logo

// Font constants
const NUMBER_FONT = '"Teko"';
const TEXT_FONT = '"BeVietnamPro"';

/**
 * Create a main menu canvas for the Dragon Ball Z game
 * @param {Object} menuData - Data for the menu display
 * @returns {Promise<string>} - Path to the created image
 */
module.exports = async function createMenuImage(menuData) {
    try {
        // Register fonts
        const fontPath = path.join(__dirname, '../../fonts/Saiyan-Sans.ttf');
        Canvas.registerFont(fontPath, { family: 'Saiyan Sans' });
        
        // Register number font
        const tekoFontPath = path.join(__dirname, '../../fonts/Teko-Bold.ttf');
        if (fs.existsSync(tekoFontPath)) {
            Canvas.registerFont(tekoFontPath, { family: 'Teko', weight: 'bold' });
        }
        
        // Register BeVietnamPro font cho tiếng Việt
        const beVietnamProPath = path.join(__dirname, '../../fonts/BeVietnamPro-SemiBold.ttf');
        if (fs.existsSync(beVietnamProPath)) {
            Canvas.registerFont(beVietnamProPath, { family: 'BeVietnamPro', weight: 'semibold' });
        }
        
        // Fallback font
        const chakraPath = path.join(__dirname, '../../fonts/ChakraPetch-Bold.ttf');
        if (fs.existsSync(chakraPath)) {
            Canvas.registerFont(chakraPath, { family: 'Chakra Petch', weight: 'bold' });
        } else {
            Canvas.registerFont(path.join(__dirname, '../../fonts/Arial.ttf'), { family: 'Arial' });
        }

        // Create canvas
        const canvas = Canvas.createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');

        // Rest of the code stays the same until drawMenuContent function
        await drawCosmicBackground(ctx, canvas.width, canvas.height);
        drawEnergyAura(ctx, canvas.width, canvas.height);
        drawUIFrame(ctx, canvas.width, canvas.height);
        await drawShenron(ctx, canvas.width, canvas.height);
        await drawDragonBalls(ctx, canvas.width, canvas.height);
        await drawDBZLogo(ctx, canvas.width, canvas.height);
        drawMenuContent(ctx, canvas.width, canvas.height, menuData);
        drawDecorativeElements(ctx, canvas.width, canvas.height);

        // Save the image
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const buffer = canvas.toBuffer('image/png');
        const outputPath = path.join(__dirname, 'cache', 'menu.png');
        fs.writeFileSync(outputPath, buffer);
        return outputPath;

    } catch (err) {
        console.error('Error creating menu image:', err);
        return null;
    }
}

/**
 * Draw a cosmic space background with stars and nebulae
 */
async function drawCosmicBackground(ctx, width, height) {
    // Base cosmic gradient
    const bgGradient = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, height
    );
    
    bgGradient.addColorStop(0, '#1a0033');  // Dark purple at center
    bgGradient.addColorStop(0.3, '#000033'); // Dark blue
    bgGradient.addColorStop(0.6, '#000022'); // Deeper blue
    bgGradient.addColorStop(1, '#000000');   // Black at edges
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add stars
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        const brightness = Math.random() * 0.7 + 0.3;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add larger glowing stars
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 2;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#80c0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, size - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // Add nebula effects - colored clouds in space
    addNebula(ctx, width * 0.2, height * 0.2, 300, '#4b0082', 0.1); // Purple nebula
    addNebula(ctx, width * 0.7, height * 0.4, 350, '#0000aa', 0.1); // Blue nebula
    addNebula(ctx, width * 0.4, height * 0.7, 250, '#aa0000', 0.08); // Red nebula
}

/**
 * Add a nebula effect to the background
 */
function addNebula(ctx, x, y, radius, color, opacity) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${opacity * 2})`);
    gradient.addColorStop(0.5, `rgba(${hexToRgb(color)}, ${opacity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

/**
 * Draw energy aura effect for the main menu
 */
function drawEnergyAura(ctx, width, height) {
    // Center energy glow
    const centerGradient = ctx.createRadialGradient(
        width/2, height * 0.4, 0,
        width/2, height * 0.4, height * 0.6
    );
    
    centerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)'); // Golden center
    centerGradient.addColorStop(0.3, 'rgba(255, 140, 0, 0.15)'); // Orange
    centerGradient.addColorStop(0.7, 'rgba(120, 0, 120, 0.1)'); // Purple
    centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent
    
    ctx.fillStyle = centerGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add energy particles
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * height * 0.5;
        
        const x = width/2 + Math.cos(angle) * distance;
        const y = height * 0.4 + Math.sin(angle) * distance;
        
        const size = Math.random() * 4 + 1;
        const alpha = 0.7 - (distance / (height * 0.5));
        
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add energy rays
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rayLength = height * 0.6;
        
        const startX = width/2;
        const startY = height * 0.4;
        const endX = startX + Math.cos(angle) * rayLength;
        const endY = startY + Math.sin(angle) * rayLength;
        
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20 + Math.random() * 30;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    ctx.restore();
}

/**
 * Draw decorative UI frame
 */
function drawUIFrame(ctx, width, height) {
    // Add frame border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    
    // Outer frame with rounded corners
    ctx.beginPath();
    ctx.roundRect(30, 30, width - 60, height - 60, 15);
    ctx.stroke();
    
    // Inner frame
    ctx.beginPath();
    ctx.roundRect(45, 45, width - 90, height - 90, 10);
    ctx.stroke();
    
    // Corner accents - top left
    ctx.beginPath();
    ctx.moveTo(30, 80);
    ctx.lineTo(30, 30);
    ctx.lineTo(80, 30);
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Corner accents - top right
    ctx.beginPath();
    ctx.moveTo(width - 30, 80);
    ctx.lineTo(width - 30, 30);
    ctx.lineTo(width - 80, 30);
    ctx.stroke();
    
    // Corner accents - bottom left
    ctx.beginPath();
    ctx.moveTo(30, height - 80);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(80, height - 30);
    ctx.stroke();
    
    // Corner accents - bottom right
    ctx.beginPath();
    ctx.moveTo(width - 30, height - 80);
    ctx.lineTo(width - 30, height - 30);
    ctx.lineTo(width - 80, height - 30);
    ctx.stroke();
    
    // Reset line width
    ctx.lineWidth = 4;
}

/**
 * Draw Shenron dragon
 */
async function drawShenron(ctx, width, height) {
    try {
        const response = await axios.get(SHENRON_IMAGE, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        // Calculate dimensions to maintain aspect ratio while filling appropriate space
        const scale = 0.7;
        const imgWidth = width * scale;
        const imgHeight = (img.height / img.width) * imgWidth;
        
        // Position Shenron to cover top of the canvas
        const x = width/2 - imgWidth/2;
        const y = height * 0.1;
        
        // Add glow effect
        ctx.save();
        ctx.shadowColor = 'rgba(0, 255, 0, 0.4)';
        ctx.shadowBlur = 20;
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
        ctx.restore();
        
    } catch (error) {
        console.error('Error loading Shenron image:', error);
        
        // Fallback: draw a simple dragon shape
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 8;
        ctx.beginPath();
        
        // Draw a stylized dragon using curves
        ctx.moveTo(width * 0.1, height * 0.3);
        
        // Body curves
        ctx.bezierCurveTo(
            width * 0.3, height * 0.1,
            width * 0.5, height * 0.5,
            width * 0.7, height * 0.2
        );
        
        ctx.bezierCurveTo(
            width * 0.8, height * 0.1,
            width * 0.9, height * 0.2,
            width * 0.85, height * 0.3
        );
        
        ctx.stroke();
        
        // Dragon head
        ctx.beginPath();
        ctx.arc(width * 0.85, height * 0.3, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
        ctx.stroke();
    }
}

/**
 * Draw the 7 dragon balls in a circular pattern
 */
async function drawDragonBalls(ctx, width, height) {
    try {
        // Position the Dragon Balls in a circle around the bottom of the canvas
        const centerX = width / 2;
        const centerY = height * 0.8;
        const radius = width * 0.3;
        const ballSize = width * 0.08; // Size of each Dragon Ball
        
        // First, create a semi-circle arrangement for the 7 Dragon Balls
        for (let i = 0; i < 7; i++) {
            // Calculate position in a semi-circle
            const angle = Math.PI + (Math.PI / 6) * i;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle) * 0.5;
            
            // Load appropriate Dragon Ball image (cycling through available ones)
            const ballIndex = i % DRAGON_BALLS.length;
            const response = await axios.get(DRAGON_BALLS[ballIndex], { responseType: 'arraybuffer' });
            const img = await Canvas.loadImage(Buffer.from(response.data));
            
            // Add glow effect
            ctx.save();
            ctx.shadowColor = '#FFA500';
            ctx.shadowBlur = 15;
            ctx.drawImage(img, x - ballSize/2, y - ballSize/2, ballSize, ballSize);
            ctx.restore();
            
        }
    } catch (error) {
        console.error('Error loading Dragon Ball images:', error);
        
        // Fallback: draw simple circle representations of Dragon Balls
        const centerX = width / 2;
        const centerY = height * 0.8;
        const radius = width * 0.3;
        const ballSize = 40;
        
        for (let i = 0; i < 7; i++) {
            const angle = Math.PI + (Math.PI / 6) * i;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle) * 0.5;
            
            // Draw Dragon Ball
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, ballSize/2);
            gradient.addColorStop(0, '#FFF4CC');
            gradient.addColorStop(0.7, '#FFA500');
            gradient.addColorStop(1, '#FF4500');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, ballSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF6B00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
        }
    }
}

/**
 * Draw Dragon Ball Z logo
 */
async function drawDBZLogo(ctx, width, height) {
    try {
        const response = await axios.get(DRAGON_BALL_Z_LOGO, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        const logoWidth = width * 0.4;
        const logoHeight = (img.height / img.width) * logoWidth;
        
        const x = width/2 - logoWidth/2;
        const y = height * 0.05;
        
        ctx.save();
        ctx.shadowColor = 'rgba(255, 160, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.drawImage(img, x, y, logoWidth, logoHeight);
        ctx.restore();
    } catch (error) {
        console.error('Error loading DBZ logo:', error);
        
        // Fallback: draw text logo
        ctx.font = 'bold 60px "Saiyan Sans"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow/glow
        ctx.shadowColor = '#FF6B00';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFC107';
        ctx.fillText('DRAGON BALL Z', width/2, height * 0.1);
        ctx.shadowBlur = 0;
    }
}

/**
 * Draw menu content with available options
 */
function drawMenuContent(ctx, width, height, menuData) {
    // Main menu container - Tăng chiều cao container menu
    const containerWidth = width * 0.35;
    const containerHeight = height * 0.75; // Tăng từ 0.65 lên 0.75 để đủ không gian cho 10+ lệnh
    const containerX = width * 0.06;
    const containerY = height * 0.12; // Giảm từ 0.15 xuống 0.12 để dịch lên và có thêm không gian
    
    // Draw transparent container with border
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 30, 0.7)';
    ctx.strokeStyle = '#4080ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 128, 255, 0.5)';
    ctx.shadowBlur = 15;
    
    // Rounded rectangle for menu
    ctx.beginPath();
    ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Menu title
    ctx.font = `bold 36px "BeVietnamPro"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#4080ff';
    ctx.shadowBlur = 15;
    ctx.fillText('LỆNH GAME', containerX + containerWidth/2, containerY + 40);
    ctx.shadowBlur = 0;
    
    // Menu separator
    ctx.beginPath();
    ctx.moveTo(containerX + 30, containerY + 60);
    ctx.lineTo(containerX + containerWidth - 30, containerY + 60);
    ctx.strokeStyle = '#4080ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Menu items - Đã thay đổi sang tiếng Việt
    const menuItems = [
        { icon: '👤', command: 'info', description: 'Xem thông tin nhân vật' },
        { icon: '🏋️', command: 'train', description: 'Luyện tập để tăng EXP' },
        { icon: '🛒', command: 'shop', description: 'Mua vật phẩm & trang bị' },
        { icon: '⚔️', command: 'fight', description: 'Chiến đấu với người chơi khác' },
        { icon: '📋', command: 'quest', description: 'Xem nhiệm vụ hiện có' },
        { icon: '🏆', command: 'tour', description: 'Tham gia giải đấu' },
        { icon: '🌟', command: 'rank', description: 'Xem bảng xếp hạng' },
        { icon: '🔮', command: 'wish', description: 'Ước nguyện (7 viên ngọc)' },
        { icon: '📊', command: 'upgrade', description: 'Nâng cấp chỉ số' },
        { icon: '🧠', command: 'learn', description: 'Học kỹ năng mới' }
    ];
    
    ctx.font = `bold 22px ${TEXT_FONT}`; // Sử dụng BeVietnamPro cho tiếng Việt
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    
    let yPos = containerY + 100;
    menuItems.forEach(item => {
        // Draw command with icon
        ctx.fillStyle = '#FFC107';
        ctx.fillText(`${item.icon} .dball ${item.command}`, containerX + 30, yPos);
        
        // Draw description with BeVietnamPro
        ctx.fillStyle = '#B0C4FF';
        ctx.font = `18px ${TEXT_FONT}`; // Font nhỏ hơn cho mô tả
        ctx.fillText(item.description, containerX + 50, yPos + 25);
        ctx.font = `bold 22px ${TEXT_FONT}`;
        
        yPos += 45; // Giữ khoảng cách giữa các dòng là 45px
    });
    
    // Player race selection (right side)
    drawRaceSelection(ctx, width, height);
}


/**
 * Draw race selection panel
 */
function drawRaceSelection(ctx, width, height) {
    // Race selection container - Tăng chiều cao
    const containerWidth = width * 0.35;
    const containerHeight = height * 0.65; // Tăng từ 0.45 lên 0.65 để đủ không gian
    const containerX = width * 0.6;
    const containerY = height * 0.12; // Giảm từ 0.15 xuống 0.12 để dịch lên
    
    // Draw transparent container with border
    ctx.save();
    ctx.fillStyle = 'rgba(0, 30, 0, 0.7)';
    ctx.strokeStyle = '#40ff80';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 255, 128, 0.5)';
    ctx.shadowBlur = 15;
    
    // Rounded rectangle for race selection     
    ctx.beginPath();
    ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Race selection title
    ctx.font = `bold 32px "BeVietnamPro"`; // Sử dụng BeVietnamPro cho tiếng Việt
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#40ff80';
    ctx.shadowBlur = 15;
    ctx.fillText('CHỌN CHỦNG TỘC', containerX + containerWidth/2, containerY + 40);
    ctx.shadowBlur = 0;
    
    // Menu separator
    ctx.beginPath();
    ctx.moveTo(containerX + 30, containerY + 60);
    ctx.lineTo(containerX + containerWidth - 30, containerY + 60);
    ctx.strokeStyle = '#40ff80';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Race options - Thêm lại đầy đủ đặc điểm cho chủng tộc
    const races = [
        { 
            name: 'EARTH', 
            command: 'earth', 
            description: 'Cân bằng sức mạnh & kỹ năng',
            features: [
                'Sức mạnh cơ bản vượt trội',
             
            ]
        },
        { 
            name: 'NAMEK', 
            command: 'namek', 
            description: 'Tái tạo & kỹ thuật đặc biệt',
            features: [
                'Khả năng hồi phục nhanh chóng',
          
            ]
        },
        { 
            name: 'SAIYAN', 
            command: 'saiyan', 
            description: 'Sức mạnh chiến đấu & biến đổi',
            features: [
                'Sức mạnh tăng sau mỗi trận chiến',
            
            ] 
        }
    ];
    
    ctx.font = `bold 22px ${TEXT_FONT}`;
    ctx.textAlign = 'left';
    
    let yPos = containerY + 100;
    races.forEach(race => {
     
        ctx.fillStyle = '#FFEB3B';
        ctx.fillText(`• ${race.name}`, containerX + 30, yPos);
        
        ctx.fillStyle = '#8AFF8A';
        ctx.font = `18px ${TEXT_FONT}`; 
        ctx.fillText(`.dball ${race.command}`, containerX + 50, yPos + 25);
        
        ctx.fillStyle = '#B0FFB0';
        ctx.fillText(race.description, containerX + 50, yPos + 50);
        
        ctx.fillStyle = 'rgba(176, 255, 176, 0.8)';
        race.features.forEach((feature, idx) => {
            ctx.fillText(`- ${feature}`, containerX + 60, yPos + 75 + idx * 22);
        });
        
        ctx.font = `bold 22px ${TEXT_FONT}`;
        
        yPos += 140; 
    });
}
function drawDecorativeElements(ctx, width, height) {

    const symbols = ['気', '力', '体', '魂', '闘', '神'];
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    
    for (let i = 0; i < symbols.length; i++) {
        const angle = (i / symbols.length) * Math.PI * 2;
        const x = width/2 + Math.cos(angle) * (width * 0.45);
        const y = height/2 + Math.sin(angle) * (height * 0.42);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI/2);
        ctx.fillText(symbols[i], 0, 0);
        ctx.restore();
    }
    
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.4 + 0.1;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.font = `18px ${TEXT_FONT}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('© Dragon Ball Z RPG Game', width/2, height - 5);
}