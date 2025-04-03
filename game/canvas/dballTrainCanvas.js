const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DRAGON_BALLS = [
    'https://imgur.com/XVa3mSj.png', 
    'https://imgur.com/5j9lLGX.png', 
    'https://imgur.com/UiQRnTD.png', 
    'https://imgur.com/miFhucN.png' 
];
const NUMBER_FONT = '"Teko"'; 
const TEXT_FONT = '"Chakra Petch"'; 

module.exports = async function createTrainImage(data) {
    try {
        const fontPath = path.join(__dirname, '../../fonts/Saiyan-Sans.ttf');
        Canvas.registerFont(fontPath, { family: 'Saiyan Sans' });
        
        const tekoFontPath = path.join(__dirname, '../../fonts/Teko-Bold.ttf');
        if (fs.existsSync(tekoFontPath)) {
            Canvas.registerFont(tekoFontPath, { family: 'Teko', weight: 'bold' });
        }
        
        const chakraPath = path.join(__dirname, '../../fonts/ChakraPetch-Bold.ttf');
        if (fs.existsSync(chakraPath)) {
            Canvas.registerFont(chakraPath, { family: 'Chakra Petch', weight: 'bold' });
        } else {
            Canvas.registerFont(path.join(__dirname, '../../fonts/Arial.ttf'), { family: 'Arial' });
        }
        
        const playerName = data.name ? data.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : "Player";
        data.name = playerName;
        
        const canvas = Canvas.createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');
        
        await drawDynamicBackground(ctx, canvas.width, canvas.height, data);
        drawAtmosphericEffects(ctx, canvas.width, canvas.height, data.powerLevel);
        drawUIFrame(ctx, canvas.width, canvas.height);
        drawEnhancedTitle(ctx, 'TRAINING RESULTS', canvas.width/2, 80);
        drawPlayerName(ctx, data.name, canvas.width/2, 130);
        drawPowerLevelMeter(ctx, canvas.width/2 - 300, 160, 600, 30, data.powerLevel);
        
        drawStatsContainer(ctx, canvas.width/2 - 350, 210, 700, 420);
        
        drawEnhancedStats(ctx, data, canvas.width/2);
        
        drawDecorativeElements(ctx, canvas.width, canvas.height, data.powerLevel);
        await drawHDDragonBalls(ctx, canvas.width, canvas.height);
        drawEnergyParticles(ctx, canvas.width, canvas.height, data.powerLevel);
        drawPowerLevelClassification(ctx, canvas.width/2, canvas.height - 30, data.powerLevel);
        
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const buffer = canvas.toBuffer('image/png');
        const outputPath = path.join(__dirname, 'cache', 'train.png');
        fs.writeFileSync(outputPath, buffer);
        return outputPath;

    } catch (err) {
        console.error('Error creating train image:', err);
        return null;
    }
}

async function drawDynamicBackground(ctx, width, height, data) {

    let skyGradient;
    const powerLevel = data.powerLevel;
    
    if (powerLevel > 100000000) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#120136');
        skyGradient.addColorStop(0.4, '#035aa6');
        skyGradient.addColorStop(0.8, '#40bad5');
        skyGradient.addColorStop(1, '#120136');
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;
            ctx.fillStyle = `rgba(164, 80, 255, ${Math.random() * 0.6})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (powerLevel > 1000000) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#1a0d00');
        skyGradient.addColorStop(0.3, '#4c2600');
        skyGradient.addColorStop(0.6, '#ff9d00');
        skyGradient.addColorStop(1, '#331a00');
    } else if (powerLevel > 10000) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#051937');
        skyGradient.addColorStop(0.5, '#004d7a');
        skyGradient.addColorStop(0.8, '#008793');
        skyGradient.addColorStop(1, '#00bf72');
    } else {
        skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#0f0c29');
        skyGradient.addColorStop(0.5, '#302b63');
        skyGradient.addColorStop(1, '#24243e');
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    if (powerLevel > 1000000) {
        drawFloatingIslands(ctx, width, height);
    } else {
        drawMountainLandscape(ctx, width, height);
    }
}

function drawMountainLandscape(ctx, width, height) {
   
    ctx.fillStyle = '#1a1a3a';
    
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    
    for (let x = 0; x < width; x += 50) {
        const mountainHeight = Math.sin(x/150) * 70 + Math.random() * 40;
        ctx.lineTo(x, height * 0.65 - mountainHeight);
    }
    
    ctx.lineTo(width, height * 0.65);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#252550';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    
    for (let x = 0; x < width; x += 30) {
        const mountainHeight = Math.sin(x/70) * 90 + Math.random() * 40;
        ctx.lineTo(x, height * 0.7 - mountainHeight);
    }
    
    ctx.lineTo(width, height * 0.7);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#353570';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    
    for (let x = 0; x < width; x += 20) {
        const hillHeight = Math.sin(x/50) * 40 + Math.random() * 30;
        ctx.lineTo(x, height * 0.75 - hillHeight);
    }
    
    ctx.lineTo(width, height * 0.75);
    ctx.closePath();
    ctx.fill();

    const groundGradient = ctx.createLinearGradient(0, height * 0.75, 0, height);
    groundGradient.addColorStop(0, '#424280');
    groundGradient.addColorStop(1, '#2a2a4a');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height * 0.75, width, height * 0.25);

    ctx.fillStyle = '#353565';
    ctx.beginPath();
    ctx.ellipse(width/2, height * 0.95, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    for (let i = 0; i < 50; i++) {
        const rockX = Math.random() * width;
        const rockY = height * 0.75 + Math.random() * (height * 0.25);
        const rockSize = 5 + Math.random() * 15;
        
        ctx.fillStyle = `rgba(80, 80, 120, ${0.5 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(rockX, rockY, rockSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFloatingIslands(ctx, width, height) {

    for (let i = 0; i < 5; i++) {
        const islandWidth = 100 + Math.random() * 200;
        const islandHeight = 40 + Math.random() * 60;
        const islandX = Math.random() * width;
        const islandY = height * 0.3 + Math.random() * (height * 0.3);
        
        const islandGradient = ctx.createLinearGradient(islandX, islandY, islandX, islandY + islandHeight);
        islandGradient.addColorStop(0, '#424280');
        islandGradient.addColorStop(1, '#252550');
        
        ctx.fillStyle = islandGradient;
        ctx.beginPath();
        ctx.ellipse(islandX, islandY, islandWidth, islandHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#353565';
        ctx.beginPath();
        ctx.arc(islandX - islandWidth * 0.3, islandY - islandHeight * 0.2, islandHeight * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = '#8080ff';
        ctx.shadowBlur = 30;
        ctx.strokeStyle = 'rgba(120, 120, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(islandX, islandY + islandHeight * 0.1, islandWidth * 0.8, islandHeight * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    const groundGradient = ctx.createLinearGradient(0, height * 0.8, 0, height);
    groundGradient.addColorStop(0, '#424280');
    groundGradient.addColorStop(1, '#2a2a4a');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
    
    ctx.fillStyle = '#353565';
    ctx.beginPath();
    ctx.ellipse(width/2, height * 0.9, width * 0.4, height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff9d00';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const startX = width/2 + (Math.random() - 0.5) * width * 0.1;
        const startY = height * 0.85;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        let x = startX;
        let y = startY;
        
        for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 100;
            y += Math.random() * 30;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }
}

function drawAtmosphericEffects(ctx, width, height, powerLevel) {
    // Add fog/mist effects
    const fogGradient = ctx.createLinearGradient(0, height * 0.6, 0, height * 0.9);
    
    if (powerLevel > 1000000) {
        fogGradient.addColorStop(0, 'rgba(255, 180, 50, 0)');
        fogGradient.addColorStop(0.5, 'rgba(255, 140, 50, 0.1)');
        fogGradient.addColorStop(1, 'rgba(255, 100, 50, 0.05)');
    } else {
        fogGradient.addColorStop(0, 'rgba(100, 100, 180, 0)');
        fogGradient.addColorStop(0.5, 'rgba(100, 100, 180, 0.1)');
        fogGradient.addColorStop(1, 'rgba(70, 70, 120, 0.05)');
    }
    
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.3);
    
    // Light rays
    if (powerLevel > 100000) {
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 10; i++) {
            const rayWidth = 50 + Math.random() * 150;
            const rayX = Math.random() * width;
            const rayColor = powerLevel > 1000000 ? 
                            'rgba(255, 215, 0, 0.2)' : 
                            'rgba(200, 200, 255, 0.2)';
            
            ctx.fillStyle = rayColor;
            ctx.beginPath();
            ctx.moveTo(rayX, 0);
            ctx.lineTo(rayX + rayWidth, height);
            ctx.lineTo(rayX - rayWidth, height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // Add stars/energy particles in sky
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.7;
        const size = Math.random() * 2 + 1;
        
        const brightness = Math.random() * 0.7 + 0.3;
        
        if (powerLevel > 1000000) {
            ctx.fillStyle = `rgba(255, ${Math.floor(180 + Math.random() * 75)}, ${Math.floor(Math.random() * 100)}, ${brightness})`;
        } else {
            ctx.fillStyle = `rgba(${Math.floor(180 + Math.random() * 75)}, ${Math.floor(180 + Math.random() * 75)}, 255, ${brightness})`;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawUIFrame(ctx, width, height) {
    // Draw corner frames
    const cornerSize = 60;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    
    // Top left
    ctx.beginPath();
    ctx.moveTo(20, cornerSize + 20);
    ctx.lineTo(20, 20);
    ctx.lineTo(cornerSize + 20, 20);
    ctx.stroke();
    
    // Top right
    ctx.beginPath();
    ctx.moveTo(width - 20, cornerSize + 20);
    ctx.lineTo(width - 20, 20);
    ctx.lineTo(width - cornerSize - 20, 20);
    ctx.stroke();
    
    // Bottom left
    ctx.beginPath();
    ctx.moveTo(20, height - cornerSize - 20);
    ctx.lineTo(20, height - 20);
    ctx.lineTo(cornerSize + 20, height - 20);
    ctx.stroke();
    
    // Bottom right
    ctx.beginPath();
    ctx.moveTo(width - 20, height - cornerSize - 20);
    ctx.lineTo(width - 20, height - 20);
    ctx.lineTo(width - cornerSize - 20, height - 20);
    ctx.stroke();
    
    // Frame accent lines
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    
    // Top frame accent
    ctx.beginPath();
    ctx.moveTo(cornerSize + 40, 30);
    ctx.lineTo(width - cornerSize - 40, 30);
    ctx.stroke();
    
    // Bottom frame accent
    ctx.beginPath();
    ctx.moveTo(cornerSize + 40, height - 30);
    ctx.lineTo(width - cornerSize - 40, height - 30);
    ctx.stroke();
}

function drawPowerAura(ctx, x, y, powerLevel) {
    ctx.save();
    
    const radius = 150;
    let primaryColor, secondaryColor;
    
    if (powerLevel > 100000000) {
        // God Ki aura (blue/purple)
        primaryColor = 'rgba(120, 140, 255, 0.8)';
        secondaryColor = 'rgba(180, 100, 255, 0.6)';
    } else if (powerLevel > 1000000) {
        // Super Saiyan aura (golden)
        primaryColor = 'rgba(255, 215, 0, 0.8)';
        secondaryColor = 'rgba(255, 140, 0, 0.6)';
    } else if (powerLevel > 100000) {
        // High power aura (white/blue)
        primaryColor = 'rgba(220, 240, 255, 0.7)';
        secondaryColor = 'rgba(150, 200, 255, 0.5)';
    } else {
        // Basic aura (white)
        primaryColor = 'rgba(255, 255, 255, 0.6)';
        secondaryColor = 'rgba(200, 200, 255, 0.4)';
    }
    
    // Main aura glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(0.6, secondaryColor);
    gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add energy particles in the aura
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius * 0.9;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        const particleSize = 1 + Math.random() * 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Energy streaks
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const streakLength = radius * (0.7 + Math.random() * 0.3);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle) * streakLength,
            y + Math.sin(angle) * streakLength
        );
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawEnhancedTitle(ctx, text, x, y) {
    ctx.save();
    
    // Text shadow for depth
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Main text
    ctx.font = '70px "Saiyan Sans"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    
    // Text border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeText(text, x, y);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add animation-like effect with decorative lines
    ctx.beginPath();
    ctx.moveTo(x - 350, y + 10);
    ctx.lineTo(x - 180, y + 10);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 180, y + 10);
    ctx.lineTo(x + 350, y + 10);
    ctx.stroke();
    
    ctx.restore();
}

function drawPlayerName(ctx, name, x, y) {
    ctx.save();
    
    // Đảm bảo tên không có dấu và tối đa 20 ký tự
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (name.length > 20) name = name.substring(0, 20);
    
    // Tăng độ nổi bật với đổ bóng mạnh hơn
    ctx.shadowColor = '#4080FF';
    ctx.shadowBlur = 20; // Tăng độ blur
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Font lớn hơn, đậm hơn
    ctx.font = 'bold 55px "Saiyan Sans"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Border ngoài đậm hơn
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6; // Tăng độ dày viền
    ctx.strokeText(name, x, y);
    
    // Border trong 
    ctx.strokeStyle = '#4080FF';
    ctx.lineWidth = 2;
    ctx.strokeText(name, x, y);
    
    // Fill text sau khi đã vẽ viền
    ctx.fillText(name, x, y);
    
    ctx.restore();
}

function drawPowerLevelMeter(ctx, x, y, width, height, powerLevel) {
    ctx.save();
    
    // Background với viền đậm hơn
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3; // Viền dày hơn
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    
    // Calculate fill percentage (logarithmic scale for better visualization)
    const maxPower = 10000000;
    let fillPercent = Math.log10(powerLevel) / Math.log10(maxPower);
    if (fillPercent > 1) fillPercent = 1;
    if (fillPercent < 0) fillPercent = 0;
    
    // Determine color based on power level
    let meterColor;
    if (powerLevel > 1000000) {
        meterColor = '#FFD700'; // Gold for high power
    } else if (powerLevel > 100000) {
        meterColor = '#FF6B00'; // Orange for medium-high
    } else if (powerLevel > 10000) {
        meterColor = '#2196F3'; // Blue for medium
    } else {
        meterColor = '#4CAF50'; // Green for low
    }
    
    // Fill meter with hiệu ứng đẹp hơn
    const fillWidth = width * fillPercent;
    const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
    gradient.addColorStop(0, meterColor);
    gradient.addColorStop(0.7, '#FFFFFF');
    gradient.addColorStop(1, meterColor);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, fillWidth - 4, height - 4, 8);
    ctx.fill();
    
    // Thêm ánh sáng cho thanh power
    ctx.globalAlpha = 0.2;
    const glowGradient = ctx.createLinearGradient(x, y, x, y + height);
    glowGradient.addColorStop(0, '#FFFFFF');
    glowGradient.addColorStop(0.5, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, fillWidth - 4, height/2, 8);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Add power level label với font mới
    ctx.font = `bold 18px ${NUMBER_FONT}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText(`POWER LEVEL: ${powerLevel.toLocaleString()}`, x + width/2, y + height/2 + 6);
    ctx.fillText(`POWER LEVEL: ${powerLevel.toLocaleString()}`, x + width/2, y + height/2 + 6);
    
    ctx.restore();
}

function drawStatsContainer(ctx, x, y, width, height) {
    ctx.save();
    
    // Outer glow
    ctx.shadowColor = 'rgba(0, 150, 255, 0.5)';
    ctx.shadowBlur = 20; // Tăng độ blur
    
    // Main container with glass effect - tăng độ mờ để nội dung dễ đọc hơn
    ctx.fillStyle = 'rgba(20, 30, 60, 0.8)'; // Tăng độ mờ
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
    ctx.lineWidth = 3; // Tăng độ dày viền
    
    // Vẽ container với bo góc lớn hơn
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 20); // Tăng bo góc
    ctx.fill();
    ctx.stroke();
    
    // Highlight top section
    const highlightGradient = ctx.createLinearGradient(x, y, x, y + 40); // Tăng chiều cao highlight
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 40, {tl: 20, tr: 20, bl: 0, br: 0}); // Tăng bo góc
    ctx.fill();
    
    // Add tech-style accent lines
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)'; // Tăng độ rõ
    ctx.lineWidth = 1.5; // Đường kẻ dày hơn
    
    // Horizontal accent line
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 80); // Điều chỉnh vị trí
    ctx.lineTo(x + width - 30, y + 80);
    ctx.stroke();
    
    ctx.restore();
}
function drawEnhancedStats(ctx, data, centerX) {
    // EXP Gain title vẫn ở trung tâm phía trên
    ctx.save();
    const expX = centerX;
    const expY = 260;
    
    // Hiển thị tiêu đề EXP giữ nguyên
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 25;
    
    ctx.font = 'bold 42px "Saiyan Sans"';
    ctx.strokeStyle = '#164020';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText('EXP GAINED', expX, expY);
    
    ctx.fillStyle = '#4CFF50';
    ctx.fillText('EXP GAINED', expX, expY);
    
    // Format và hiển thị số EXP
    ctx.shadowColor = '#4CFF50';
    ctx.shadowBlur = 25;
    
    ctx.font = `bold 60px ${NUMBER_FONT}`;
    ctx.strokeStyle = '#1A4020';
    ctx.lineWidth = 3;
    
    let expText = `+${data.expGain.toLocaleString()}`;
    if (expText.length > 15) {
        expText = `+${Math.floor(data.expGain/1000)}K`;
    }
    
    ctx.strokeText(expText, expX, expY + 65);
    
    const expGradient = ctx.createLinearGradient(expX - 100, expY + 20, expX + 100, expY + 65);
    expGradient.addColorStop(0, '#4CFF50');
    expGradient.addColorStop(0.5, '#FFFFFF');
    expGradient.addColorStop(1, '#4CFF50');
    
    ctx.fillStyle = expGradient;
    ctx.fillText(expText, expX, expY + 65);
    ctx.restore();
    
    // Divider - đường kẻ ngang phân cách
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.moveTo(centerX - 300, expY + 80);
    ctx.lineTo(centerX + 300, expY + 80);
    ctx.stroke();
    
    // === LAYOUT 2 CỘT ===
    const leftColX = centerX - 280; // Cột trái
    const rightColX = centerX + 50; // Cột phải
    const startY = 360; // Vị trí bắt đầu của các stats
    const statSpacing = 65; // Khoảng cách giữa các stats
    
    // --- CỘT TRÁI ---
    let statsY = startY;
    
    // POWER GAIN
    drawStatWithIcon(ctx, '💪', 'POWER GAIN', '#FFD700', '#8B4513',
        formatNumberCompare(data.oldPower, data.newPower, "N/A", 'power', data.stats),
        leftColX, statsY);
    statsY += statSpacing;
    
    // DAMAGE
    drawStatWithIcon(ctx, '⚔️', 'DAMAGE', '#FF9800', '#E65100',
        formatNumberCompare(data.oldDamage, data.newDamage, "N/A", 'damage', data.stats),
        leftColX, statsY);
    statsY += statSpacing;
    
    // ZENI EARNED
    drawStatWithIcon(ctx, '💰', 'ZENI EARNED', '#FFC107', '#8B5A00',
        `+${formatNumber(data.zeniGain)}`,
        leftColX, statsY, true);
    
    // --- CỘT PHẢI ---
    statsY = startY;
    
    // HP
    drawStatWithIcon(ctx, '❤️', 'HP', '#FF5252', '#8B0000',
        formatNumberCompare(data.oldHP, data.newHP, "N/A", 'hp', data.stats),
        rightColX, statsY);
    statsY += statSpacing;
    
    // KI
    drawStatWithIcon(ctx, '✨', 'KI', '#2196F3', '#0D47A1',
        formatNumberCompare(data.oldKi, data.newKi, "N/A", 'ki', data.stats),
        rightColX, statsY);
    statsY += statSpacing;
    
    // --- TIPS (Vẫn ở góc phải dưới) ---
    const tipsX = rightColX;
    const tipsY = statsY + 20;
    
    ctx.save();
    ctx.font = `bold 26px "Saiyan Sans"`;
    ctx.fillStyle = '#4FC3F7';
    ctx.textAlign = 'center';
    
    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur = 20;
    ctx.fillText('NEXT STEPS', tipsX, tipsY);
    ctx.shadowBlur = 0;
    
    ctx.font = `bold 20px ${TEXT_FONT}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    
    // Tips based on power level
    let tips = [];
    if (data.powerLevel < 10000) {
        tips = [
            "Keep training to grow stronger",
            "Finish early quests for rewards",
            "Visit the shop for equipment"
        ];
    } else if (data.powerLevel < 100000) {
        tips = [
            "Challenge stronger opponents",
            "Upgrade your attack power",
            "Learn new special techniques"
        ];
    } else {
        tips = [
            "Seek higher transformations",
            "Collect Dragon Balls",
            "Join tournaments to test power"
        ];
    }
    
    // Hiển thị tips
    tips.forEach((tip, index) => {
        ctx.fillText(`• ${tip}`, tipsX - 120, tipsY + 40 + (index * 35));
    });
    
    ctx.restore();
}

// Hàm mới: Vẽ một thông số với icon, tiêu đề và giá trị
function drawStatWithIcon(ctx, icon, title, titleColor, borderColor, value, x, y, useGradient = false) {
    ctx.save();
    
    // Vẽ icon
    drawStatIcon(ctx, icon, x - 35, y - 5, 38);
    
    // Vẽ tiêu đề
    ctx.font = `bold 28px "Saiyan Sans"`;
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'left';
    ctx.fillText(title, x, y);
    
    // Thiết lập shadow cho giá trị
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 10;
    ctx.font = `bold 26px ${NUMBER_FONT}`;
    
    // Vẽ viền cho giá trị
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeText(value, x, y + 35);
    
    // Vẽ giá trị
    if (useGradient) {
        // Sử dụng gradient màu cho Zeni
        const gradient = ctx.createLinearGradient(x, y + 20, x + 200, y + 35);
        gradient.addColorStop(0, titleColor);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, titleColor);
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillText(value, x, y + 35);
    
    ctx.restore();
}

// Hàm mới: Format số để hiển thị đẹp hơn và không quá dài
function formatNumber(number) {
    if (number === undefined || number === null) return "N/A";
    
    // Rút gọn số quá lớn
    if (number >= 1000000) {
        return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}K`;
    }
    
    return number.toLocaleString();
}

// Hàm mới: Format hiển thị so sánh hai số
function formatNumberCompare(oldVal, newVal, defaultVal = "N/A", type = 'power', stats = null) {
    // Xử lý khi không có giá trị
    if (oldVal === undefined || oldVal === null) oldVal = defaultVal;
    else oldVal = formatNumber(oldVal);
    
    if (newVal === undefined || newVal === null) newVal = defaultVal;
    else newVal = formatNumber(newVal);

    // Hiển thị khác nhau cho từng loại chỉ số
    switch(type) {
        case 'hp':
            return `${oldVal}/${formatNumber(stats?.health || oldVal)}`; // Sử dụng stats nếu có
        case 'ki':
            return `${oldVal}/${formatNumber(stats?.ki || oldVal)}`; // Sử dụng stats nếu có
        case 'damage':
            return oldVal; // Chỉ hiển thị giá trị damage
        default:
            return `${oldVal} ▶️ ${newVal}`; // Đổi ▶️ thành →
    }
}

function drawStatIcon(ctx, icon, x, y, size = 30) {
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);
}

function drawDecorativeElements(ctx, width, height, powerLevel) {
    ctx.save();
    
    // Đã loại bỏ các vòng tròn năng lượng và các ký tự Ki xung quanh
    
    // Chỉ giữ lại các hiệu ứng trang trí khác nếu cần thiết
    // Ví dụ: Có thể thêm các chi tiết trang trí nhỏ ở góc màn hình
    
    // Góc trên bên trái - nếu muốn thêm chi tiết
    ctx.fillStyle = powerLevel > 1000000 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(64, 128, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(50, 10);
    ctx.lineTo(10, 50);
    ctx.closePath();
    ctx.fill();
    
    // Góc dưới bên phải
    ctx.beginPath();
    ctx.moveTo(width - 10, height - 10);
    ctx.lineTo(width - 50, height - 10);
    ctx.lineTo(width - 10, height - 50);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}
async function drawHDDragonBalls(ctx, width, height) {
    try {
        // Strategic positions for dragon balls
        const positions = [
            { x: 100, y: 100, scale: 0.3 },
            { x: width - 100, y: 100, scale: 0.25 },
            { x: 120, y: height - 120, scale: 0.28 },
            { x: width - 120, y: height - 120, scale: 0.32 }
        ];

        for (let i = 0; i < positions.length; i++) {
            const imgUrl = DRAGON_BALLS[i % DRAGON_BALLS.length];
            const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            const img = await Canvas.loadImage(Buffer.from(response.data));
            
            const pos = positions[i];
            const imgWidth = img.width * pos.scale;
            const imgHeight = img.height * pos.scale;
            
            ctx.save();
            ctx.shadowColor = '#FFA500';
            ctx.shadowBlur = 15;
            
            ctx.drawImage(img, pos.x - imgWidth/2, pos.y - imgHeight/2, imgWidth, imgHeight);
            ctx.restore();
        }
    } catch (error) {
        console.error('Error loading Dragon Ball images:', error);
        
        // Fallback to drawing basic dragon balls
        drawBasicDragonBalls(ctx, width, height);
    }
}

function drawBasicDragonBalls(ctx, width, height) {
    // Draw stylized dragon balls in corners
    const dragonBallPositions = [
        { x: 100, y: 100, size: 40 },
        { x: width - 100, y: 100, size: 35 },
        { x: 100, y: height - 100, size: 38 },
        { x: width - 100, y: height - 100, size: 42 }
    ];
    
    dragonBallPositions.forEach((ball, index) => {
        // Ball base
        const ballGradient = ctx.createRadialGradient(
            ball.x, ball.y, 0,
            ball.x, ball.y, ball.size
        );
        ballGradient.addColorStop(0, '#ffd700');
        ballGradient.addColorStop(0.8, '#ff9500');
        ballGradient.addColorStop(1, '#ff7700');
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.size * 0.3, ball.y - ball.size * 0.3, ball.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Stars (1-4 stars)
        const starCount = (index % 4) + 1;
        ctx.fillStyle = '#ff0000';
        
        // Arrange stars in a pattern
        const starRadius = ball.size * 0.15;
        const starDist = ball.size * 0.4;
        
        for (let i = 0; i < starCount; i++) {
            const angle = (i / starCount) * Math.PI * 2;
            const starX = ball.x + Math.cos(angle) * starDist;
            const starY = ball.y + Math.sin(angle) * starDist;
            
            ctx.beginPath();
            ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawEnergyParticles(ctx, width, height, powerLevel) {
    // Determine particle color based on power level
    let particleColor;
    let particleCount;
    
    if (powerLevel > 1000000) {
        particleColor = 'rgba(255, 215, 0, 0.8)'; // Golden
        particleCount = 100;
    } else if (powerLevel > 100000) {
        particleColor = 'rgba(0, 191, 255, 0.7)'; // Blue
        particleCount = 80;
    } else {
        particleColor = 'rgba(255, 255, 255, 0.6)'; // White
        particleCount = 50;
    }
    
    // Draw particles
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 1;
        
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw energy streaks
    ctx.strokeStyle = particleColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 15; i++) {
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const length = Math.random() * 50 + 30;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }
}

function drawPowerLevelClassification(ctx, x, y, powerLevel) {
    ctx.save();
    
    // Determine classification
    let classification;
    let color;
    
    if (powerLevel > 1000000000) {
        classification = "GOD-CLASS WARRIOR";
        color = '#FF00FF'; // Purple
    } else if (powerLevel > 100000000) {
        classification = "LEGENDARY WARRIOR";
        color = '#FFD700'; // Gold
    } else if (powerLevel > 10000000) {
        classification = "ELITE WARRIOR";
        color = '#FF6B00'; // Orange
    } else if (powerLevel > 1000000) {
        classification = "SUPER WARRIOR";
        color = '#00BCD4'; // Cyan
    } else if (powerLevel > 100000) {
        classification = "SKILLED FIGHTER";
        color = '#4CAF50'; // Green
    } else if (powerLevel > 10000) {
        classification = "FIGHTER";
        color = '#8BC34A'; // Light Green
    } else {
        classification = "ROOKIE";
        color = '#FFFFFF'; // White
    }
    
    // Draw classification với viền đậm hơn
    ctx.font = `bold 24px "Saiyan Sans"`; // Tăng kích thước font
    ctx.textAlign = 'center';
    
    // Vẽ viền đậm
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(classification, x, y);
    
    // Vẽ text chính
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15; // Tăng độ blur lên
    ctx.fillText(classification, x, y);
    
    ctx.restore();
}