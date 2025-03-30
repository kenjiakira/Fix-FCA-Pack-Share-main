const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnam' });
Canvas.registerFont(path.join(__dirname, '../../fonts/PlayfairDisplay-Bold.ttf'), { family: 'Playfair Display' });

const imageCache = new Map();

async function loadCachedImage(imagePath) {
    if (imageCache.has(imagePath)) {
        return imageCache.get(imagePath);
    }
    
    try {
        const image = await Canvas.loadImage(imagePath);
        imageCache.set(imagePath, image);
        return image;
    } catch (error) {
        console.error(`Error loading image ${imagePath}:`, error);
        throw error;
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function drawBackground(ctx, width, height) {
   
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalAlpha = 0.05;
    
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 30 + 20;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = ['#e94560', '#4ecca3', '#ffd700', '#ffffff'][Math.floor(Math.random() * 4)];
        ctx.fill();
    }
    
    ctx.font = '80px Arial';
    const symbols = ['♠', '♥', '♦', '♣', '7', '$'];
    for (let i = 0; i < 10; i++) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        ctx.fillStyle = ['#ffffff', '#ffd700', '#e94560', '#4ecca3'][Math.floor(Math.random() * 4)];
        ctx.fillText(symbol, Math.random() * width, Math.random() * height);
    }
    
    ctx.globalAlpha = 1.0;
    
    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, '#8e0e00');
    headerGradient.addColorStop(1, '#1f1c18');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, 80);
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 90, width - 20, height - 100);
    
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#000000';
    for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
    }
    ctx.globalAlpha = 1.0;
}

function drawHeader(ctx, width, gameType) {
    ctx.font = '42px "Playfair Display"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillText(`CASINO ROYALE • ${gameType}`, width / 2, 40);
    ctx.shadowBlur = 0;
    
    const lineWidth = 200;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineWidth, 65);
    ctx.lineTo(width / 2 + lineWidth, 65);
    ctx.stroke();
    
    drawDiamond(ctx, width / 2 - lineWidth, 65, 8);
    drawDiamond(ctx, width / 2 + lineWidth, 65, 8);
}

function drawDiamond(ctx, x, y, size) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
}

function drawPlayerInfo(ctx, player, betAmount, choice, x, y, width) {
 
    const boxHeight = 130;
    const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
    gradient.addColorStop(0, 'rgba(20, 20, 40, 0.8)');
    gradient.addColorStop(1, 'rgba(40, 40, 80, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, boxHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '24px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 ${player}`, x + 20, y + 35);
    
    ctx.font = '22px "BeVietnam Medium"';
    ctx.fillStyle = '#4ecca3';
    ctx.fillText(`💰 Cược: ${formatNumber(betAmount)}$`, x + 20, y + 70);
    
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`🎯 Lựa chọn: ${choice}`, x + 20, y + 105);
}
async function bufferToReadStream(buffer, gameType) {

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `casino_${gameType}_${Date.now()}.png`);
    
    fs.writeFileSync(tempFilePath, buffer);
    
    const stream = fs.createReadStream(tempFilePath);
    
    stream.on('end', () => {
        try {
            fs.unlinkSync(tempFilePath);
        } catch (err) {
            console.error('Error cleaning up temp file:', err);
        }
    });
    
    return stream;
}
async function createTaiXiuCanvas(data, showResult = false) {
    const { playerName, betAmount, choice, dice1, dice2, dice3, total, result, sessionId, history, balance } = data;
    
    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Draw luxurious background with more effects
    drawBackground(ctx, canvas.width, canvas.height);
    drawHeader(ctx, canvas.width, 'TÀI XỈU');
    
    // Add casino decorations
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        drawDiamond(ctx, x, y, Math.random() * 5 + 3);
    }
    
    ctx.font = '18px "BeVietnam"';
    ctx.fillStyle = '#d4af37';
    ctx.textAlign = 'right';
    const sessionText = `Session ID: ${sessionId}`;
    const sessionMetrics = ctx.measureText(sessionText);
    
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - sessionMetrics.width - 45, 85, sessionMetrics.width + 30, 25, 5);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#d4af37';
    ctx.fillText(sessionText, canvas.width - 30, 102);

    // Enhanced player info display
    drawPlayerInfo(ctx, playerName, betAmount, choice.toUpperCase(), 50, 120, canvas.width - 100);
    
    // History section with animation effect
    const historyHeight = 60;
    const historyGradient = ctx.createLinearGradient(50, 270, 50, 270 + historyHeight);
    historyGradient.addColorStop(0, 'rgba(20, 20, 40, 0.9)');
    historyGradient.addColorStop(1, 'rgba(30, 30, 60, 0.9)');
    
    ctx.fillStyle = historyGradient;
    ctx.beginPath();
    ctx.roundRect(50, 270, canvas.width - 100, historyHeight, 10);
    ctx.fill();
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // History title with icon
    ctx.font = 'bold 18px "BeVietnam"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('📌 Lịch sử:', 70, 270 + historyHeight/2 + 5);
    
    // Draw history with animation
    if (history && history.length > 0) {
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        let historyX = 180;
        history.forEach((item, index) => {
            const delay = index * 100;
            const alpha = Math.min(1, (Date.now() % 1000) / 1000);
            
            ctx.fillStyle = item === '⚫' ? `rgba(255, 255, 255, ${alpha})` : `rgba(255, 215, 0, ${alpha})`;
            ctx.fillText(item, historyX, 270 + historyHeight/2 + 7);
            historyX += 30;
        });
    } else {
        ctx.font = '18px "BeVietnam"';
        ctx.fillStyle = '#999999';
        ctx.fillText('Chưa có lịch sử', 180, 270 + historyHeight/2 + 5);
    }

    if (showResult) {
        // Result box with glass effect
        ctx.fillStyle = 'rgba(30, 30, 60, 0.85)';
        ctx.beginPath();
        ctx.roundRect(130, 350, canvas.width - 260, 180, 20);
        ctx.fill();
        
        // Glowing border based on result
        ctx.strokeStyle = result === choice.toLowerCase() ? '#4ecca3' : '#e94560';
        ctx.lineWidth = 3;
        ctx.shadowColor = result === choice.toLowerCase() ? '#4ecca3' : '#e94560';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        try {
            // Enhanced dice display
            const diceSize = 80;
            const diceMargin = 20;
            const totalDiceWidth = (diceSize * 3) + (diceMargin * 2);
            const startX = (canvas.width - totalDiceWidth) / 2;
            const diceY = 360;
            
            // Draw dice with shadows and glow
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;
            
            for (let i = 0; i < 3; i++) {
                const diceValue = [dice1, dice2, dice3][i];
                const diceImage = await loadCachedImage(path.join(__dirname, `../../commands/dice/dice${diceValue}.png`));
                ctx.drawImage(diceImage, startX + (diceSize + diceMargin) * i, diceY, diceSize, diceSize);
            }
            
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Draw total with style
            ctx.font = 'bold 28px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`${dice1} + ${dice2} + ${dice3} = ${total}`, canvas.width / 2, diceY + diceSize + 25);
            
            // Result text with glow effect
            ctx.font = 'bold 36px "BeVietnam Bold"';
            ctx.fillStyle = result === choice.toLowerCase() ? '#4ecca3' : '#e94560';
            ctx.shadowColor = result === choice.toLowerCase() ? '#4ecca3' : '#e94560';
            ctx.shadowBlur = 10;
            ctx.fillText(result.toUpperCase(), canvas.width / 2, diceY + diceSize + 65);
            ctx.shadowBlur = 0;

            // Win/Lose amount with animation
            ctx.font = '22px "BeVietnam"';
            ctx.textAlign = 'center';
            
            if (result === choice.toLowerCase()) {
                ctx.fillStyle = '#4ecca3';
                const winText = `🎉 Thắng: ${formatNumber(betAmount * 2)}$`;
                const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2;
                ctx.shadowColor = '#4ecca3';
                ctx.shadowBlur = 10 * glowIntensity;
                ctx.fillText(winText, canvas.width / 2, 550);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = '#e94560';
                ctx.fillText(`💔 Thua: ${formatNumber(betAmount)}$`, canvas.width / 2, 550);
            }
            
            // Balance display with gold effect
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 5;
            ctx.fillText(`💰 Số dư: ${formatNumber(balance)}$`, canvas.width / 2, 575);
            ctx.shadowBlur = 0;
            
        } catch (error) {
            console.error("Error drawing dice images:", error);
            // Fallback display
            ctx.font = '32px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`${dice1} + ${dice2} + ${dice3} = ${total}`, canvas.width / 2, 400);
        }
    } else {
        // Loading animation
        ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
        ctx.beginPath();
        ctx.roundRect(130, 350, canvas.width - 260, 180, 20);
        ctx.fill();
        
        // Animated border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        const borderProgress = (Date.now() % 2000) / 2000;
        animateLoadingBorder(ctx, 130, 350, canvas.width - 260, 180, 20, borderProgress);
        
        ctx.font = '32px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('🎲 ĐANG LẮC XÚC XẮC...', canvas.width / 2, 420);
        
        // Loading dots animation
        const dotCount = Math.floor(Date.now() / 500) % 4;
        ctx.font = '24px "BeVietnam"';
        ctx.fillText(`Vui lòng đợi${'.'.repeat(dotCount)}`, canvas.width / 2, 470);
    }
    
    return canvas.toBuffer();
}

// Thêm các hàm helper mới
function animateLoadingBorder(ctx, x, y, width, height, radius, progress) {
    ctx.beginPath();
    const totalLength = (width + height) * 2;
    const currentPos = totalLength * progress;
    
    // Vẽ đường viền động
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.lineDashOffset = -currentPos;
    ctx.setLineDash([30, 15]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
}

function drawAnimatedDice(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(-20, -20, 40, 40, 5);
    ctx.fill();
    ctx.stroke();
    
    // Vẽ các chấm ngẫu nhiên
    const dots = Math.floor(Math.random() * 6) + 1;
    ctx.fillStyle = '#000000';
    for (let i = 0; i < dots; i++) {
        const angle = (i / dots) * Math.PI * 2;
        const dotX = Math.cos(angle) * 8;
        const dotY = Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}
async function createChanLeCanvas(data, showResult = false) {
    const { playerName, betAmount, choice, pattern, result, isSpecial, balance } = data;
    
    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Background with luxury effect
    drawBackground(ctx, canvas.width, canvas.height);
    drawHeader(ctx, canvas.width, 'CHẴN LẺ');
    
    // Add sparkling effects
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 2;
        const alpha = Math.min(1, (Date.now() % 1000) / 1000);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enhanced player info with glowing border
    drawPlayerInfo(ctx, playerName, betAmount, choice.toUpperCase(), 50, 120, canvas.width - 100);
    
    if (showResult) {
        // Luxury result box with glass effect
        ctx.fillStyle = 'rgba(30, 30, 60, 0.92)';
        ctx.beginPath();
        ctx.roundRect(100, 300, canvas.width - 200, 220, 20);
        ctx.fill();
        
        // Dynamic glowing border
        const borderGlow = Math.sin(Date.now() / 500) * 5 + 10;
        ctx.strokeStyle = result === choice ? '#4ecca3' : '#e94560';
        ctx.lineWidth = 3;
        ctx.shadowColor = result === choice ? '#4ecca3' : '#e94560';
        ctx.shadowBlur = borderGlow;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Pattern display with animated numbers - Căn chỉnh lại vị trí
        ctx.font = '42px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        // Tính toán vị trí bắt đầu để các số nằm chính giữa
        const numberSpacing = 60; // Khoảng cách giữa các số
        const totalWidth = (pattern.length - 1) * numberSpacing;
        const startX = canvas.width/2 - totalWidth/2;
        
        pattern.forEach((num, index) => {
            const x = startX + index * numberSpacing;
            const y = 350;
            const scale = 1 + Math.sin((Date.now() + index * 200) / 500) * 0.1;
            
            // Vẽ viền cho số
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            // Background circle cho số
            ctx.fillStyle = num % 2 === 0 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Vẽ số
            ctx.fillStyle = '#ffffff';
            ctx.fillText(num, 0, 0);
            ctx.restore();
        });
        
        // Result text with enhanced styling
        ctx.font = '48px "BeVietnam Bold"';
        if (isSpecial) {
            // Special result with rainbow effect
            const gradient = ctx.createLinearGradient(
                canvas.width/2 - 100, 410,
                canvas.width/2 + 100, 410
            );
            gradient.addColorStop(0, '#ffd700');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(1, '#ffd700');
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            
            // Thêm glow effect cho special
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeText(result.toUpperCase(), canvas.width / 2, 410);
        } else {
            ctx.fillStyle = result === choice ? '#4ecca3' : '#e94560';
            ctx.shadowColor = result === choice ? '#4ecca3' : '#e94560';
            ctx.shadowBlur = 10;
        }
        ctx.fillText(result.toUpperCase(), canvas.width / 2, 410);
        ctx.shadowBlur = 0;
        
        // Special result indicator with particles
        if (isSpecial) {
            ctx.font = '26px "BeVietnam"';
            ctx.fillStyle = '#ffd700';
            
            // Draw particles around special text
            const particleCount = 12;
            const radius = 100;
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const x = canvas.width/2 + Math.cos(angle + Date.now()/1000) * radius;
                const y = 450 + Math.sin(angle + Date.now()/1000) * radius/3;
                
                const particleSize = Math.random() * 6 + 3;
                ctx.beginPath();
                ctx.arc(x, y, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            
            ctx.fillText('✨ KẾT QUẢ ĐẶC BIỆT ✨', canvas.width / 2, 450);
        }
        
        // Enhanced win/lose display
        ctx.font = '26px "BeVietnam Bold"';
        ctx.textAlign = 'center';
        
        if (result === choice) {
            const multiplier = isSpecial ? 4 : 2;
            ctx.fillStyle = '#4ecca3';
            const winAmount = formatNumber(betAmount * multiplier);
            
            // Add win amount animation
            const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.shadowColor = '#4ecca3';
            ctx.shadowBlur = 10 * glowIntensity;
            ctx.fillText(`🎉 Thắng: ${winAmount}$ (x${multiplier})`, canvas.width / 2, 490);
            ctx.shadowBlur = 0;
            
            // Add celebration particles
            if (isSpecial) {
                drawCelebrationParticles(ctx, canvas.width/2, 490);
            }
        } else {
            ctx.fillStyle = '#e94560';
            ctx.fillText(`💔 Thua: ${formatNumber(betAmount)}$`, canvas.width / 2, 490);
        }
        
        // Balance with golden glow
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 5;
        ctx.fillText(`💰 Số dư: ${formatNumber(balance)}$`, canvas.width / 2, 550);
        ctx.shadowBlur = 0;
        
    } else {
        // Loading state with animated elements
        ctx.fillStyle = 'rgba(30, 30, 60, 0.92)';
        ctx.beginPath();
        ctx.roundRect(100, 300, canvas.width - 200, 220, 20);
        ctx.fill();
        
        // Animated border
        const time = Date.now();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 10]);
        ctx.lineDashOffset = -time / 50;
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Animated numbers
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        ctx.font = '52px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        const positions = [
            canvas.width/2 - 120,
            canvas.width/2,
            canvas.width/2 + 120
        ];
        
        positions.forEach((x, i) => {
            const y = 370;
            const num = numbers[Math.floor((time/100 + i*3) % numbers.length)];
            const scale = 1 + Math.sin((time + i*200)/300) * 0.1;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            ctx.fillText(num, 0, 0);
            ctx.restore();
        });
        
        // Loading text with wave effect
        ctx.font = '32px "BeVietnam Bold"';
        const text = '⏳ ĐANG TÍNH TOÁN...';
        const chars = text.split('');
        
        chars.forEach((char, i) => {
            const x = canvas.width/2 - (chars.length * 12) + i * 24;
            const y = 450 + Math.sin((time + i*100)/300) * 5;
            ctx.fillText(char, x, y);
        });
        
        // Animated loading dots
        const dotCount = Math.floor(time / 500) % 4;
        ctx.font = '24px "BeVietnam"';
        ctx.fillText(`Vui lòng đợi${'.'.repeat(dotCount)}`, canvas.width / 2, 500);
    }
    
    return canvas.toBuffer();
}
function drawCelebrationParticles(ctx, x, y) {
    const particleCount = 20;
    const maxRadius = 50;
    
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = Math.random() * maxRadius;
        const particleX = x + Math.cos(angle) * radius;
        const particleY = y + Math.sin(angle) * radius;
        
        const size = Math.random() * 4 + 2;
        ctx.fillStyle = ['#ffd700', '#ffffff', '#4ecca3'][Math.floor(Math.random() * 3)];
        ctx.beginPath();
        ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}
async function createCoinflipCanvas(data, showResult = false) {
    const { playerName, betAmount, choice, result, multiplier, balance } = data;
    
    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    drawBackground(ctx, canvas.width, canvas.height);
    
    drawHeader(ctx, canvas.width, 'COINFLIP');
    
    drawPlayerInfo(ctx, playerName, betAmount, choice === 'up' ? 'SẤP' : 'NGỬA', 50, 120, canvas.width - 100);
    
    if (showResult) {
        ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
        ctx.beginPath();
        ctx.roundRect(150, 300, canvas.width - 300, 220, 20);
        ctx.fill();
        
        ctx.strokeStyle = result === choice ? '#4ecca3' : '#e94560';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        try {
            const coinSize = 120;
            const coinY = 320;
            const coinImage = await loadCachedImage(path.join(__dirname, `../../commands/coin/${result}.png`));
            
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
            
            ctx.drawImage(coinImage, (canvas.width - coinSize) / 2, coinY, coinSize, coinSize);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.font = '32px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`${result === 'up' ? 'SẤP' : 'NGỬA'}`, canvas.width / 2, coinY + coinSize + 40);
            
            if (result === choice) {
                ctx.globalAlpha = 0.5;
                const particleCount = 12;
                const radius = 80;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    const x = (canvas.width / 2) + Math.cos(angle) * radius;
                    const y = (coinY + coinSize/2) + Math.sin(angle) * radius;
                    
                    const size = Math.random() * 10 + 5;
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
            
            ctx.font = '26px "BeVietnam Bold"';
            ctx.textAlign = 'center';
            
            if (result === choice) {
                ctx.fillStyle = '#4ecca3';
                ctx.fillText(`🎉 THẮNG: ${formatNumber(betAmount * multiplier)}$ (x${multiplier})`, canvas.width / 2, 490);
            } else {
                ctx.fillStyle = '#e94560';
                ctx.fillText(`💔 THUA: ${formatNumber(betAmount)}$`, canvas.width / 2, 490);
            }
            
            ctx.fillStyle = '#ffd700';
            ctx.font = '22px "BeVietnam"';
            ctx.fillText(`💰 Số dư: ${formatNumber(balance)}$`, canvas.width / 2, 530);
            
        } catch (error) {
            console.error("Error drawing coin image:", error);
            
            ctx.font = '42px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(result === 'up' ? 'SẤP' : 'NGỬA', canvas.width / 2, 380);
            
            if (result === choice) {
                ctx.fillStyle = '#4ecca3';
                ctx.fillText(`THẮNG (x${multiplier})`, canvas.width / 2, 450);
            } else {
                ctx.fillStyle = '#e94560';
                ctx.fillText("THUA", canvas.width / 2, 450);
            }
        }
    } else {
        ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
        ctx.beginPath();
        ctx.roundRect(150, 300, canvas.width - 300, 220, 20);
        ctx.fill();
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const centerX = canvas.width / 2;
        const centerY = 370;
        const coinWidth = 100;
        const coinHeight = 100;
        
        const now = Date.now();
        const rotationSpeed = now / 300;
        const ellipseWidth = coinWidth * (0.3 + 0.7 * Math.abs(Math.sin(rotationSpeed)));
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, ellipseWidth / 2, coinHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const gradient = ctx.createLinearGradient(
            centerX - ellipseWidth/2,
            centerY - coinHeight/2,
            centerX + ellipseWidth/2,
            centerY + coinHeight/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, ellipseWidth / 2, coinHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, ellipseWidth / 2, coinHeight / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.font = '28px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('🪙 ĐANG TUNG ĐỒNG XU...', canvas.width / 2, 450);
        
        const dotCount = Math.floor(Date.now() / 500) % 4;
        let dots = '';
        for (let i = 0; i < dotCount; i++) {
            dots += '.';
        }
        ctx.font = '22px "BeVietnam"';
        ctx.fillText(`Vui lòng đợi${dots}`, canvas.width / 2, 490);
    }
    
    return canvas.toBuffer();
}

async function createBaucuaCanvas(data, showResult = false) {
    const { playerName, betAmount, choice, results, winAmount, balance } = data;
    
    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    drawBackground(ctx, canvas.width, canvas.height);
    
    drawHeader(ctx, canvas.width, 'BẦU CUA');
    
    const choiceDisplay = {
        'bầu': 'BẦU 🍐',
        'cua': 'CUA 🦀',
        'tôm': 'TÔM 🦐',
        'cá': 'CÁ 🐟',
        'gà': 'GÀ 🐓',
        'nai': 'NAI 🦌'
    };
    
    drawPlayerInfo(ctx, playerName, betAmount, choiceDisplay[choice] || choice.toUpperCase(), 50, 120, canvas.width - 100);
    
    ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
    ctx.beginPath();
    ctx.roundRect(100, 270, canvas.width - 200, 250, 20);
    ctx.fill();
    
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = '24px "BeVietnam Bold"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('🎲 KẾT QUẢ BẦU CUA 🎲', canvas.width / 2, 300);
    
    if (showResult) {
        try {
            const icons = {
                'bầu': '🍐',
                'cua': '🦀',
                'tôm': '🦐',
                'cá': '🐟',
                'gà': '🐓',
                'nai': '🦌'
            };
            
            const iconSize = 70;
            const startX = (canvas.width - (iconSize * 3 + 40)) / 2;
            const iconY = 330;
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const iconX = startX + (i * (iconSize + 20));
                
                ctx.fillStyle = result === choice ? 'rgba(78, 204, 163, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.roundRect(iconX, iconY, iconSize, iconSize, 10);
                ctx.fill();
                
                ctx.strokeStyle = result === choice ? '#4ecca3' : '#d4af37';
                ctx.lineWidth = 2;
                ctx.stroke();
            
                ctx.font = '40px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(icons[result] || result, iconX + iconSize/2, iconY + iconSize*0.7);
            }
            
            const matches = results.filter(r => r === choice).length;
            
            ctx.font = '26px "BeVietnam Bold"';
            ctx.textAlign = 'center';
            
            if (matches > 0) {
                ctx.fillStyle = '#4ecca3';
                ctx.fillText(`🎯 Khớp ${matches} lần với ${choiceDisplay[choice]}`, canvas.width / 2, 430);
                ctx.fillText(`🎉 THẮNG: ${formatNumber(winAmount)}$ (x${matches})`, canvas.width / 2, 470);
            } else {
                ctx.fillStyle = '#e94560';
                ctx.fillText(`❌ Không khớp với ${choiceDisplay[choice]}`, canvas.width / 2, 430);
                ctx.fillText(`💔 THUA: ${formatNumber(betAmount)}$`, canvas.width / 2, 470);
            }
            
            ctx.fillStyle = '#ffd700';
            ctx.font = '22px "BeVietnam"';
            ctx.fillText(`💰 Số dư: ${formatNumber(balance)}$`, canvas.width / 2, 510);
            
        } catch (error) {
            console.error("Error drawing baucua results:", error);
            
            ctx.font = '28px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`Kết quả: ${results.map(r => choiceDisplay[r] || r).join(' - ')}`, canvas.width / 2, 370);
        }
    } else {
        ctx.font = '28px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('🎲 ĐANG LẮC BẦU CUA...', canvas.width / 2, 360);
        
        const icons = ['🍐', '🦀', '🦐', '🐟', '🐓', '🦌'];
        const positions = [
            { x: canvas.width/2 - 100, y: 410 },
            { x: canvas.width/2, y: 410 },
            { x: canvas.width/2 + 100, y: 410 }
        ];
        
        ctx.font = '40px Arial';
        for (let i = 0; i < positions.length; i++) {
            const iconIndex = Math.floor((Date.now()/200 + i*5) % icons.length);
            ctx.fillText(icons[iconIndex], positions[i].x, positions[i].y);
        }
        
        const dotCount = Math.floor(Date.now() / 500) % 4;
        let dots = '';
        for (let i = 0; i < dotCount; i++) {
            dots += '.';
        }
        ctx.font = '22px "BeVietnam"';
        ctx.fillText(`Vui lòng đợi${dots}`, canvas.width / 2, 480);
    }
    
    return canvas.toBuffer();
}

module.exports = {
    createTaiXiuCanvas,
    createChanLeCanvas,
    createCoinflipCanvas,
    createBaucuaCanvas,
    bufferToReadStream,
};