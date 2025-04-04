const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants for visual elements
const CHARACTER_POSITIONS = {
    LEFT: { x: 220, y: 580, scale: 0.7 },   // Di chuyển sát bên trái (từ 320 → 220)
    RIGHT: { x: 1060, y: 580, scale: 0.7 }  // Di chuyển sát bên phải (từ 960 → 1060)
};

const CHARACTER_IMAGES = {
    "EARTH": "https://imgur.com/2YwDw1E.png", // Krillin/Tien/Yamcha
    "NAMEK": "https://imgur.com/qLbyTkI.png", // Piccolo
    "SAIYAN": "https://imgur.com/wtVhJV4.png", // Goku/Vegeta
    "default": "https://imgur.com/CtVH2jk.png"
};


const AURA_COLORS = {
    "Super Saiyan": "#FFD700",
    "Super Saiyan 2": "#FFA500",
    "Super Saiyan 3": "#FF8000", 
    "Super Saiyan God": "#FF0000",
    "Super Saiyan Blue": "#0080FF",
    "Ultra Instinct": "#C0C0FF",
    "Namek Warrior": "#80FF80",
    "Super Namek": "#00FF00",
    "Namek Fusion": "#00C000",
    "Porunga Vessel": "#00FF80",
    "Võ Sĩ Trần Trụi": "#FFFFFF",
    "Võ Thần Nhân Loại": "#FFFFFF",
    "Thánh Nhân Khí": "#80C0FF",
    "default": "#FFFFFF"
};

const PLANET_BACKGROUNDS = {
    "EARTH": "https://imgur.com/nEWDS9J.jpg",
    "NAMEK": "https://imgur.com/DcrRrim.jpg", 
    "SAIYAN": "https://imgur.com/TPlZd9e.jpg",
    "default": "https://imgur.com/MixsZCr.jpg"
};

module.exports = async function createPVPResultImage(battleResult, player1, player2) {
    try {
        // Register fonts
        registerFonts();
        
        const canvas = Canvas.createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');
        
        // Set up background based on battle location (default to Earth)
        const planet = player1.planet || "EARTH";
        await drawBattleBackground(ctx, canvas.width, canvas.height, planet);
        
        // Draw the battle effects
        drawBattleEffects(ctx, canvas.width, canvas.height, battleResult);
        
        // Draw UI Frame and title
        drawBattleBorder(ctx, canvas.width, canvas.height);
        drawBattleTitle(ctx, canvas.width/2, 80);
        
        // Draw winner banner if not a draw
        if (!battleResult.isDraw) {
            drawWinnerBanner(ctx, removeDiacritics(battleResult.winner.name), canvas.width/2, 130);
        } else {
            drawDrawBanner(ctx, canvas.width/2, 130);
        }
        
        // Draw VS emblem in the middle
        drawVSEmblem(ctx, canvas.width/2, 350);
        
        // Draw battle statistics
        drawBattleStats(ctx, battleResult, canvas.width/2, canvas.height - 200);
        
        // THAY ĐỔI QUAN TRỌNG: Vẽ nhân vật TRƯỚC, sau đó vẽ thông tin người chơi ĐÈ LÊN
        // Đảo ngược thứ tự để thông tin không bị che
        
        // 1. Vẽ nhân vật TRƯỚC
        await drawCharacterImage(ctx, player1, CHARACTER_POSITIONS.LEFT, true);
        await drawCharacterImage(ctx, player2, CHARACTER_POSITIONS.RIGHT, false);
        
        // 2. Vẽ thông tin người chơi SAU để đè lên
        await drawPlayerInfo(ctx, player1, CHARACTER_POSITIONS.LEFT, battleResult.player1HP, true);
        await drawPlayerInfo(ctx, player2, CHARACTER_POSITIONS.RIGHT, battleResult.player2HP, false);
        
        // Save the image
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const buffer = canvas.toBuffer('image/png');
        const outputPath = path.join(__dirname, 'cache', 'pvp_result.png');
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (err) {
        console.error('Error creating PVP result image:', err);
        return null;
    }
};

function removeDiacritics(str) {
    if (!str) return '';
    
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D');
}

function registerFonts() {
    try {
        const fontPath = path.join(__dirname, '../../fonts/Saiyan-Sans.ttf');
        Canvas.registerFont(fontPath, { family: 'Saiyan Sans' });
        
        const tekoPath = path.join(__dirname, '../../fonts/Teko-Bold.ttf');
        if (fs.existsSync(tekoPath)) {
            Canvas.registerFont(tekoPath, { family: 'Teko', weight: 'bold' });
        }
        
        const chakraPath = path.join(__dirname, '../../fonts/ChakraPetch-Bold.ttf');
        if (fs.existsSync(chakraPath)) {
            Canvas.registerFont(chakraPath, { family: 'Chakra Petch', weight: 'bold' });
        }
    } catch (err) {
        console.error('Error registering fonts:', err);
    }
}

async function drawBattleBackground(ctx, width, height, planet) {
    try {
        // Get background image based on planet
        const bgUrl = PLANET_BACKGROUNDS[planet] || PLANET_BACKGROUNDS.default;
        const response = await axios.get(bgUrl, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        // Draw the background image with a slight blur effect
        ctx.filter = 'blur(3px)';
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';
        
        // Add a semi-transparent overlay to enhance readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        
        // Add atmospheric effects based on planet
        switch (planet) {
            case "EARTH":
                drawEarthEffects(ctx, width, height);
                break;
            case "NAMEK":
                drawNamekEffects(ctx, width, height);
                break;
            case "SAIYAN":
                drawSaiyanEffects(ctx, width, height);
                break;
            default:
                drawEarthEffects(ctx, width, height);
        }
    } catch (err) {
        console.error('Error loading background image:', err);
        
        // Fallback to gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

function drawEarthEffects(ctx, width, height) {
    // Add blue-ish light rays
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
        const rayWidth = 150 + Math.random() * 300;
        const rayX = Math.random() * width;
        
        ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX + rayWidth, height);
        ctx.lineTo(rayX - rayWidth, height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Add some clouds/mist
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 4; i++) {
        const cloudX = Math.random() * width;
        const cloudY = 100 + Math.random() * (height - 200);
        const cloudSize = 100 + Math.random() * 100;
        drawCloud(ctx, cloudX, cloudY, cloudSize);
    }
}

function drawNamekEffects(ctx, width, height) {
    // Add green-ish light rays
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
        const rayWidth = 150 + Math.random() * 300;
        const rayX = Math.random() * width;
        
        ctx.fillStyle = 'rgba(100, 255, 150, 0.15)';
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX + rayWidth, height);
        ctx.lineTo(rayX - rayWidth, height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Add namekian atmosphere particles
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1;
        
        ctx.fillStyle = `rgba(60, 255, 130, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSaiyanEffects(ctx, width, height) {
    // Add reddish-orange light effects for Saiyan planet
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
        const rayWidth = 150 + Math.random() * 300;
        const rayX = Math.random() * width;
        
        ctx.fillStyle = 'rgba(255, 100, 50, 0.15)';
        ctx.beginPath();
        ctx.moveTo(rayX, 0);
        ctx.lineTo(rayX + rayWidth, height);
        ctx.lineTo(rayX - rayWidth, height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Add fire/lava particles
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 1;
        
        ctx.fillStyle = `rgba(255, ${Math.floor(50 + Math.random() * 150)}, 0, ${Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.2, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawBattleEffects(ctx, width, height, battleResult) {
    // Add battle-specific effects
    
    // Draw impact craters
    const craterCount = Math.min(5, Math.floor(battleResult.turns / 5));
    for (let i = 0; i < craterCount; i++) {
        const craterX = width * 0.2 + Math.random() * width * 0.6;
        const craterY = height * 0.6 + Math.random() * height * 0.3;
        const craterSize = 30 + Math.random() * 50;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(craterX, craterY, craterSize + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw energy blasts
    const blastCount = Math.min(8, Math.floor(battleResult.turns / 3));
    for (let i = 0; i < blastCount; i++) {
        const blastX = Math.random() * width;
        const blastY = Math.random() * (height * 0.7);
        const blastSize = 10 + Math.random() * 30;
        
        // Radial gradient for blast
        const gradient = ctx.createRadialGradient(blastX, blastY, 0, blastX, blastY, blastSize);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 50, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blastX, blastY, blastSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw ki aura effects
    drawKiStreaks(ctx, width, height);
}

function drawKiStreaks(ctx, width, height) {
    // Draw energy streaks across the battlefield
    for (let i = 0; i < 15; i++) {
        // Randomize stroke color between blue, gold, and white
        const colors = ['rgba(100, 150, 255, 0.7)', 'rgba(255, 215, 0, 0.7)', 'rgba(255, 255, 255, 0.7)'];
        ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
        
        const startX = Math.random() * width;
        const startY = Math.random() * height;
        const length = 50 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        const thickness = 1 + Math.random() * 3;
        
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }
}

function drawBattleBorder(ctx, width, height) {
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

function drawBattleTitle(ctx, x, y) {
    ctx.save();
    
    // Text shadow for depth
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 25;
    
    // Main title
    ctx.font = '70px "Saiyan Sans"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('PVP BATTLE RESULT', x, y);
    
    // Text border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeText('PVP BATTLE RESULT', x, y);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add decorative lines
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

function drawWinnerBanner(ctx, winnerName, x, y) {
    ctx.save();
    
    // Create gradient for victory text
    const gradient = ctx.createLinearGradient(x - 250, y, x + 250, y);
    gradient.addColorStop(0, '#FF4500');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FF4500');
    
    // Victory text shadow
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 30;
    
    // Victory text
    ctx.font = 'bold 60px "Saiyan Sans"';
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY', x, y);
    
    // Winner name
    ctx.font = 'bold 40px "Chakra Petch"';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#4080FF';
    ctx.shadowBlur = 20;
    ctx.fillText(winnerName, x, y + 50);
    
    ctx.restore();
}

function drawDrawBanner(ctx, x, y) {
    ctx.save();
    
    // Create gradient for draw text
    const gradient = ctx.createLinearGradient(x - 250, y, x + 250, y);
    gradient.addColorStop(0, '#808080');
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, '#808080');
    
    // Draw text shadow
    ctx.shadowColor = '#4080FF';
    ctx.shadowBlur = 30;
    
    // Draw text
    ctx.font = 'bold 60px "Saiyan Sans"';
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center';
    ctx.fillText('DRAW', x, y);
    
    // Subtitle
    ctx.font = 'bold 30px "Chakra Petch"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('BOTH WARRIORS FOUGHT VALIANTLY', x, y + 50);
    
    ctx.restore();
}
async function drawPlayerInfo(ctx, player, position, hpRemaining, isLeft) {
    ctx.save();
    
    // Determine maximum HP
    const maxHP = player.stats?.health || 1000;
    const hpPercent = Math.max(0, Math.min(100, (hpRemaining / maxHP) * 100));
    
    // Đẩy vị trí thông tin LÊN NHIỀU HƠN NỮA - ĐỦ CAO để không bị che
    const nameY = position.y - 480;       // Từ -400 lên -480
    const statStartY = position.y - 430;  // Từ -350 lên -430
    
    // Tạo hiệu ứng đổ bóng đậm hơn cho text để dễ đọc
    ctx.shadowColor = 'rgba(0, 0, 0, 1.0)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Draw player name - loại bỏ dấu tiếng Việt
    ctx.font = 'bold 40px "Saiyan Sans"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(removeDiacritics(player.name), position.x, nameY);
    
    // Draw evolution name - loại bỏ dấu tiếng Việt
    ctx.font = 'bold 25px "Chakra Petch"';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(removeDiacritics(player.evolution?.name || 'Chien binh thuong'), position.x, nameY + 35);
    
    // Draw HP bar - thêm background mờ để thanh HP nổi bật
    const hpBarWidth = 220;
    const hpBarHeight = 20;
    const hpBarX = position.x - hpBarWidth/2;
    const hpBarY = statStartY;
    // HP bar fill
    let hpColor;
    if (hpPercent > 60) hpColor = '#00FF00';
    else if (hpPercent > 30) hpColor = '#FFFF00';
    else hpColor = '#FF0000';
    
    const hpFillWidth = (hpBarWidth - 4) * (hpPercent / 100);
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(hpBarX + 2, hpBarY + 2, hpFillWidth, hpBarHeight - 4, 4);
    ctx.fill();
    // HP text
    ctx.font = 'bold 18px "Chakra Petch"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.round(hpRemaining).toLocaleString()}/${maxHP.toLocaleString()} (${Math.round(hpPercent)}%)`, 
                position.x, hpBarY + 35);
    
    // Draw player power level
    ctx.font = 'bold 20px "Chakra Petch"';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(`Power Level: ${player.stats?.power?.toLocaleString() || 'Unknown'}`, position.x, hpBarY + 65);
    
    // Draw player planet
    const planetName = player.planet ? `Planet: ${player.planet}` : 'Unknown Planet';
    ctx.fillStyle = '#80C0FF';
    ctx.fillText(planetName, position.x, hpBarY + 95);
    
    ctx.restore();
}
function drawEnergyEffects(ctx, x, y, color, isLeft) {
    ctx.save();
    
    // Điều chỉnh vị trí hiệu ứng năng lượng
    const handX = isLeft ? x + 50 : x - 50; // Giảm offset để năng lượng gần nhân vật hơn
    const handY = y;
    
    // Particle effects
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20; // Giảm phạm vi phân tán
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
            handX + Math.cos(angle) * distance,
            handY + Math.sin(angle) * distance,
            2 + Math.random() * 3, // Giảm kích thước particle
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    ctx.restore();
}
async function drawCharacterImage(ctx, player, position, isLeft) {
    try {
        const planet = player.planet || "EARTH";
        const characterUrl = CHARACTER_IMAGES[planet] || CHARACTER_IMAGES.default;
        
        // Lấy hình ảnh từ URL
        const response = await axios.get(characterUrl, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        // Giảm kích thước nhân vật xuống để không che chỉ số
        const scale = position.scale * 0.9; // Giảm thêm kích thước 
        const width = img.width * scale;
        const height = img.height * scale;
        
        // Vẽ aura trước
        const auraColor = AURA_COLORS[removeDiacritics(player.evolution?.name)] || AURA_COLORS.default;
        
        ctx.save();
        
        // Hiệu ứng aura
        const auraRadius = 50; // Nhỏ hơn
        const auraGradient = ctx.createRadialGradient(
            position.x, 
            position.y - 60,
            0, 
            position.x, 
            position.y - 60, 
            auraRadius * 1.5
        );
        auraGradient.addColorStop(0, `${auraColor}80`);
        auraGradient.addColorStop(1, `${auraColor}00`);
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.ellipse(position.x, position.y - 60, auraRadius * 1.5, auraRadius * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Flip image if on right side
        if (!isLeft) {
            ctx.translate(position.x * 2, 0);
            ctx.scale(-1, 1);
        }
        
        // Đẩy nhân vật xuống thấp hơn một chút
        ctx.drawImage(
            img, 
            position.x - width/2,  
            position.y - height + 60, // Đẩy xuống thấp hơn (+50 → +60)
            width, 
            height
        );
        
        ctx.restore();
        
        // Hiệu ứng năng lượng
        drawEnergyEffects(ctx, position.x, position.y - 100, auraColor, isLeft);
        
    } catch (err) {
        console.error('Error drawing character image:', err);
    }
}
function drawVSEmblem(ctx, x, y) {
    ctx.save();
    
    // Draw circular background
    const emblemRadius = 60;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, emblemRadius);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
    gradient.addColorStop(0.7, 'rgba(128, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(64, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, emblemRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw VS text
    ctx.font = 'bold 80px "Saiyan Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('VS', x, y);
    
    // Text fill with gradient
    const textGradient = ctx.createLinearGradient(x - 40, y - 30, x + 40, y + 30);
    textGradient.addColorStop(0, '#FFFFFF');
    textGradient.addColorStop(0.5, '#FFD700');
    textGradient.addColorStop(1, '#FFFFFF');
    
    ctx.fillStyle = textGradient;
    ctx.fillText('VS', x, y);
    
    // Add light rays
    ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle - 0.2) * emblemRadius * 2,
            y + Math.sin(angle - 0.2) * emblemRadius * 2
        );
        ctx.lineTo(
            x + Math.cos(angle + 0.2) * emblemRadius * 2,
            y + Math.sin(angle + 0.2) * emblemRadius * 2
        );
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

function drawBattleStats(ctx, battleResult, x, y) {
    ctx.save();
    
    // Draw stats container
    const containerWidth = 700;
    const containerHeight = 160;
    const containerX = x - containerWidth/2;
    const containerY = y - 30;
    
    // Container background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Title
    ctx.font = 'bold 28px "Saiyan Sans"';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('BATTLE STATISTICS', x, containerY + 30);
    
    // Stats content - two columns
    ctx.font = 'bold 20px "Chakra Petch"';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    
    const leftColX = containerX + 40;
    const rightColX = containerX + containerWidth/2 + 20;
    const statsY = containerY + 70;
    const lineHeight = 30;
    
    // Left column stats
    ctx.fillText(`⏱️ Battle Duration: ${Math.round((battleResult.battleStats?.duration || 0) / 1000)} seconds`, leftColX, statsY);
    ctx.fillText(`🔄 Total Turns: ${battleResult.turns}`, leftColX, statsY + lineHeight);
    ctx.fillText(`🔥 Max Combo: x${battleResult.battleStats?.maxCombo || 0}`, leftColX, statsY + lineHeight * 2);
    
    // Right column stats
    ctx.fillText(`💥 Total Damage:`, rightColX, statsY);
    
    // Parse player names
    const p1Name = battleResult.winner?.name || 'Player 1';
    const p2Name = battleResult.loser?.name || 'Player 2';
    
    // Damage stats with player names
    ctx.fillText(`- ${p1Name}: ${battleResult.totalDamage.attacker.toLocaleString()}`, rightColX, statsY + lineHeight);
    ctx.fillText(`- ${p2Name}: ${battleResult.totalDamage.defender.toLocaleString()}`, rightColX, statsY + lineHeight * 2);
    
    ctx.restore();
}
    