const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const axios = require('axios');

// Thay đổi font sang BeVietnamPro để hiển thị tiếng Việt tốt hơn
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro-Bold' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnamPro-Medium' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnamPro' });
Canvas.registerFont(path.join(__dirname, '../../fonts/Teko-Bold.ttf'), { family: 'Teko' });

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1600;
const TITLE_HEIGHT = 180;
const PLAYER_CARD_HEIGHT = 120;
const MAX_PLAYERS_DISPLAY = 10;
const BACKGROUND_IMAGES = {
    DEFAULT: 'https://imgur.com/XvxdtzZ.jpg',
    EARTH: 'https://imgur.com/OYnFkgL.jpg',
    NAMEK: 'https://imgur.com/hbCKqau.jpg',
    SAIYAN: 'https://imgur.com/RD7OCZu.jpg'
};

const PLANET_COLORS = {
    EARTH: {
        primary: '#4080FF',
        secondary: '#80C0FF',
        accent: '#0040C0'
    },
    NAMEK: {
        primary: '#40C040',
        secondary: '#80FF80',
        accent: '#008000'
    },
    SAIYAN: {
        primary: '#FF8000',
        secondary: '#FFC080',
        accent: '#C04000'
    },
    DEFAULT: {
        primary: '#FF5252',
        secondary: '#FF8A80',
        accent: '#D50000'
    }
};

async function loadImage(url) {
    try {
        if (url.startsWith('http')) {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            return await Canvas.loadImage(Buffer.from(response.data, 'binary'));
        } else {
            return await Canvas.loadImage(url);
        }
    } catch (error) {
        console.error('Error loading image:', error);
        return null;
    }
}

async function createRankImage(data) {
    const canvas = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');

    const rankType = data.rankType || 'POWER';
    const planet = data.planet || 'DEFAULT'; 
    const players = data.players || [];
    const currentUserId = data.currentUserId;
    
    await drawBackground(ctx, canvas.width, canvas.height, planet);
    
    drawTitle(ctx, canvas.width, TITLE_HEIGHT, `BẢNG XẾP HẠNG`);
    
    if (data.planetFilter) {
        drawPlanetInfo(ctx, canvas.width, 70, data.planetFilter);
    }
    
    const startY = TITLE_HEIGHT + 60;
    const cardSpacing = 12; 
    
    for (let i = 0; i < Math.min(players.length, MAX_PLAYERS_DISPLAY); i++) {
        const playerY = startY + (i * (PLAYER_CARD_HEIGHT + cardSpacing));
        const isCurrentUser = players[i].id === currentUserId;
        const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#FFFFFF';
        
        players[i].rankType = rankType;
        
        await drawPlayerCard(ctx, 
            50, playerY, canvas.width - 100, PLAYER_CARD_HEIGHT, 
            players[i], i + 1, rankColor, isCurrentUser);
    }
    
    const outputPath = path.join(__dirname, `./cache/rank_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
}

async function drawBackground(ctx, width, height, planet) {
    try {
        const imgUrl = BACKGROUND_IMAGES[planet] || BACKGROUND_IMAGES.DEFAULT;
        const bg = await loadImage(imgUrl);
        
        if (bg) {
            ctx.drawImage(bg, 0, 0, width, height);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
            ctx.fillRect(0, 0, width, height);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            const planetColors = PLANET_COLORS[planet] || PLANET_COLORS.DEFAULT;
            
            gradient.addColorStop(0, planetColors.accent);
            gradient.addColorStop(0.4, planetColors.primary);
            gradient.addColorStop(1, '#000000');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        drawPlanetEffects(ctx, width, height, planet);
        drawDecorations(ctx, width, height);
        
    } catch (error) {
        console.error("Error drawing background:", error);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
    }
}

function drawPlanetEffects(ctx, width, height, planet) {
    switch(planet) {
        case 'EARTH':
            ctx.globalAlpha = 0.15;
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = 20 + Math.random() * 80;
                
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(1, '#4080FF00');
                ctx.fillStyle = gradient;
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            break;
            
        case 'NAMEK':
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const length = 50 + Math.random() * 100;
                const angle = Math.random() * Math.PI * 2;
                
                ctx.strokeStyle = '#80FF80';
                ctx.lineWidth = 1 + Math.random() * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * length,
                    y + Math.sin(angle) * length
                );
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            break;
            
        case 'SAIYAN':
            ctx.globalAlpha = 0.25;
            for (let i = 0; i < 25; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = 30 + Math.random() * 70;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                gradient.addColorStop(0, '#FFFF80');
                gradient.addColorStop(0.5, '#FF800080');
                gradient.addColorStop(1, '#FF400000');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            break;
            
        default:
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 3 + 1;
                
                ctx.globalAlpha = Math.random() * 0.7 + 0.3;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
    }
}

function drawDecorations(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(20, 20, width - 40, height - 40, 20);
    ctx.stroke();
    
    const cornerSize = 80;
    ctx.lineWidth = 5;
    
    // Trang trí các góc
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(40 + cornerSize, 40);
    ctx.moveTo(40, 40);
    ctx.lineTo(40, 40 + cornerSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 40, 40);
    ctx.lineTo(width - 40 - cornerSize, 40);
    ctx.moveTo(width - 40, 40);
    ctx.lineTo(width - 40, 40 + cornerSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(40 + cornerSize, height - 40);
    ctx.moveTo(40, height - 40);
    ctx.lineTo(40, height - 40 - cornerSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 40, height - 40);
    ctx.lineTo(width - 40 - cornerSize, height - 40);
    ctx.moveTo(width - 40, height - 40);
    ctx.lineTo(width - 40, height - 40 - cornerSize);
    ctx.stroke();
}

function drawTitle(ctx, width, height, title) {
    const titleY = 20;
    
    const gradient = ctx.createLinearGradient(0, titleY, 0, titleY + height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(50, titleY, width - 100, height, 20);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.fillRect(60, titleY + 10, width - 120, 5);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sử dụng BeVietnamPro cho tiêu đề
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '80px BeVietnamPro-Bold';
    ctx.fillText(title, width/2 + 3, titleY + height/2 + 3);
    
    const titleGradient = ctx.createLinearGradient(0, titleY + 40, 0, titleY + height - 40);
    titleGradient.addColorStop(0, '#FFFFFF');
    titleGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = titleGradient;
    ctx.fillText(title, width/2, titleY + height/2);
}

function drawPlanetInfo(ctx, width, height, planet) {
    const planetY = TITLE_HEIGHT + 20;
    const planetColors = PLANET_COLORS[planet] || PLANET_COLORS.DEFAULT;
    
    ctx.fillStyle = `rgba(0,0,0,0.6)`;
    ctx.beginPath();
    ctx.roundRect(width/2 - 200, planetY, 400, height, 15);
    ctx.fill();
    
    ctx.strokeStyle = planetColors.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.textAlign = 'center';
    // Sử dụng BeVietnamPro cho thông tin hành tinh
    ctx.font = '35px BeVietnamPro-Medium';
    ctx.fillStyle = planetColors.secondary;
    ctx.fillText(`HÀNH TINH: ${getPlanetName(planet)}`, width/2, planetY + height/2);
}

async function drawPlayerCard(ctx, x, y, width, height, player, rank, rankColor, isCurrentUser) {
    const planetColors = PLANET_COLORS[player.planet] || PLANET_COLORS.DEFAULT;
    
    // Thêm các gradient nền khác nhau tùy theo thứ hạng
    let cardGradient;
    let borderWidth = isCurrentUser ? 3 : 2;
    let rankGlow = 0;
    
    switch(rank) {
        case 1: // Top 1 - Hiệu ứng đặc biệt gold gradient
            cardGradient = ctx.createLinearGradient(x, y, x + width, y + height);
            cardGradient.addColorStop(0, 'rgba(40, 30, 10, 0.98)');
            cardGradient.addColorStop(0.5, 'rgba(60, 45, 15, 0.95)');
            cardGradient.addColorStop(1, 'rgba(35, 25, 10, 0.98)');
            borderWidth = 3;
            rankGlow = 15;
            break;
            
        case 2: // Top 2 - Silver
            cardGradient = ctx.createLinearGradient(x, y, x + width, y + height);
            cardGradient.addColorStop(0, 'rgba(35, 35, 40, 0.95)');
            cardGradient.addColorStop(0.5, 'rgba(50, 50, 55, 0.9)');
            cardGradient.addColorStop(1, 'rgba(30, 30, 35, 0.95)');
            borderWidth = 3;
            break;
            
        case 3: // Top 3 - Bronze
            cardGradient = ctx.createLinearGradient(x, y, x + width, y + height);
            cardGradient.addColorStop(0, 'rgba(40, 25, 15, 0.95)');
            cardGradient.addColorStop(0.5, 'rgba(60, 35, 20, 0.9)');
            cardGradient.addColorStop(1, 'rgba(35, 20, 10, 0.95)');
            borderWidth = 3;
            break;
            
        default: // Các hạng còn lại
            cardGradient = ctx.createLinearGradient(x, y, x + width, y);
            cardGradient.addColorStop(0, 'rgba(10, 10, 20, 0.95)');
            cardGradient.addColorStop(0.5, 'rgba(25, 25, 40, 0.9)');
            cardGradient.addColorStop(1, 'rgba(10, 10, 20, 0.95)');
    }
    
    // Hiệu ứng đặc biệt cho người dùng hiện tại
    if (isCurrentUser) {
        ctx.shadowColor = planetColors.accent;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.beginPath();
        ctx.roundRect(x - 5, y - 5, width + 10, height + 10, 15);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // Vẽ nền card với gradient đã chọn
    ctx.fillStyle = cardGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.fill();
    
    // Vẽ viền card
    if (rank <= 3) {
        // Viền gradient đặc biệt cho top 3
        const borderGradient = ctx.createLinearGradient(x, y, x + width, y);
        if (rank === 1) {
            borderGradient.addColorStop(0, '#FFD700');
            borderGradient.addColorStop(0.5, '#FFFFFF');
            borderGradient.addColorStop(1, '#FFD700');
        } else if (rank === 2) {
            borderGradient.addColorStop(0, '#C0C0C0');
            borderGradient.addColorStop(0.5, '#FFFFFF');
            borderGradient.addColorStop(1, '#C0C0C0');
        } else {
            borderGradient.addColorStop(0, '#CD7F32');
            borderGradient.addColorStop(0.5, '#FFC080');
            borderGradient.addColorStop(1, '#CD7F32');
        }
        
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = borderWidth;
    } else if (isCurrentUser) {
        // Viền gradient cho người dùng hiện tại
        const gradientStroke = ctx.createLinearGradient(x, y, x + width, y);
        gradientStroke.addColorStop(0, planetColors.accent);
        gradientStroke.addColorStop(0.5, planetColors.secondary);
        gradientStroke.addColorStop(1, planetColors.accent);
        ctx.strokeStyle = gradientStroke;
        ctx.lineWidth = borderWidth;
    } else {
        // Viền thường cho các hạng còn lại
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = borderWidth;
    }
    ctx.stroke();
    
    // Highlight phía trên card cho top 3
    if (rank <= 3) {
        ctx.fillStyle = rankColor;
        ctx.fillRect(x + 100, y, width - 200, 3);
    }
    
    // Vẽ xếp hạng với các hiệu ứng đặc biệt
    const rankX = x + 60;
    const rankY = y + height/2;
    const rankRadius = 30;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (rank <= 3) {
        // Hiệu ứng phát sáng cho top 3
        if (rankGlow > 0) {
            ctx.shadowColor = rankColor;
            ctx.shadowBlur = rankGlow;
        }
        
        // Gradient đặc biệt cho rank icon
        const gradient = ctx.createRadialGradient(rankX, rankY, 0, rankX, rankY, rankRadius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.4, rankColor);
        gradient.addColorStop(1, rank === 1 ? '#FF8C00' : 
                              rank === 2 ? '#A0A0A0' : '#8B4513');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(rankX, rankY, rankRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Hiệu ứng hào quang
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(rankX, rankY, rankRadius + 10, 0, Math.PI * 2);
        ctx.fillStyle = rank === 1 ? '#FFFF80' : 
                        rank === 2 ? '#FFFFFF' : '#FFC080';
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Số xếp hạng với hiệu ứng đổ bóng
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px BeVietnamPro-Bold';
        ctx.fillText(rank, rankX, rankY + 2);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px BeVietnamPro-Bold';
        ctx.fillText(rank, rankX, rankY);
    } else {
        // Rank thường
        const normalRankGradient = ctx.createRadialGradient(rankX, rankY, 0, rankX, rankY, rankRadius);
        normalRankGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        normalRankGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        
        ctx.fillStyle = normalRankGradient;
        ctx.beginPath();
        ctx.arc(rankX, rankY, rankRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px BeVietnamPro-Bold';
        ctx.fillText(rank, rankX, rankY);
    }
    
    // Vẽ thông tin người chơi
    const textX = x + 120;
    
    // Icon hành tinh
    const planetY = y + 75;
    const planetIconSize = 16;
    
    ctx.beginPath();
    ctx.arc(textX - 22, planetY, planetIconSize / 2, 0, Math.PI * 2);
    
    const planetGradient = ctx.createRadialGradient(
        textX - 22, planetY, 0,
        textX - 22, planetY, planetIconSize / 2
    );
    planetGradient.addColorStop(0, planetColors.secondary);
    planetGradient.addColorStop(1, planetColors.primary);
    
    ctx.fillStyle = planetGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Tên người chơi
    ctx.textAlign = 'left';
    
    if (isCurrentUser) {
        ctx.shadowColor = planetColors.primary;
        ctx.shadowBlur = 10;
    }
    
    // Màu tên người chơi dựa theo thứ hạng và người dùng hiện tại
    let nameColor;
    if (isCurrentUser) {
        nameColor = planetColors.secondary;
    } else if (rank === 1) {
        nameColor = '#FFD700';
    } else if (rank === 2) {
        nameColor = '#E0E0E0';
    } else if (rank === 3) {
        nameColor = '#FFAA80';
    } else {
        nameColor = '#FFFFFF';
    }
    
    const nameGradient = ctx.createLinearGradient(textX, y + 30, textX + 300, y + 30);
    nameGradient.addColorStop(0, nameColor);
    nameGradient.addColorStop(1, rank <= 3 ? '#FFFFFF' : '#DDDDDD');
    
    ctx.font = '32px BeVietnamPro-Bold';
    ctx.fillStyle = nameGradient;
    ctx.fillText(truncateText(player.name, 15), textX, y + 40);
    ctx.shadowBlur = 0;
    
    // Tên hành tinh
    ctx.font = '26px BeVietnamPro';
    ctx.fillStyle = planetColors.primary;
    ctx.fillText(`${getPlanetName(player.planet)}`, textX, y + 75);
    
    // Form tiến hóa
    if (player.evolution) {
        ctx.fillStyle = planetColors.secondary;
        ctx.font = '24px BeVietnamPro';
        
        // Icon cho form
        ctx.fillRect(textX - 10, y + 98, 5, 5);
        ctx.fillText(`Form: ${player.evolution}`, textX, y + 100);
    }
    
    // ---------- FIX PHẦN HIỂN THỊ SỐ ----------
    
    // Chỉnh vị trí thông số để tránh bị lệch
    const statsX = x + width - 130; // Điều chỉnh vị trí để tránh lệch
    const value = formatNumberCompact(player.value || player.stats?.power || 0);
    
    // Thêm khung nền mờ để số dễ đọc hơn
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(statsX - 100, y + 40, 120, 30);
    
    ctx.textAlign = 'center'; // Căn giữa thay vì căn phải để tránh lệch
    
    // Hiệu ứng glow cho giá trị
    ctx.shadowColor = isCurrentUser ? planetColors.accent : rankColor;
    ctx.shadowBlur = 8;
    ctx.font = '36px BeVietnamPro-Bold';
    
    // Tạo gradient màu dựa theo thứ hạng
    let valueColor;
    if (rank === 1) {
        valueColor = '#FFD700';
    } else if (rank === 2) {
        valueColor = '#E0E0E0';
    } else if (rank === 3) {
        valueColor = '#FFAA80';
    } else if (isCurrentUser) {
        valueColor = planetColors.secondary;
    } else {
        valueColor = '#FFFFFF';
    }
    
    ctx.fillStyle = valueColor;
    // Vẽ giá trị ở vị trí cố định
    ctx.fillText(value, statsX - 40, y + 60);
    ctx.shadowBlur = 0;
    
    // Thêm nhãn loại giá trị (POWER/EXP/ZENI)
    ctx.font = '16px BeVietnamPro';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText(getRankTypeLabel(player.rankType), statsX - 40, y + 85);
}

function getRankTypeLabel(rankType) {
    switch (rankType) {
        case 'EXP': return 'KINH NGHIỆM';
        case 'ZENI': return 'ZENI';
        default: return 'SỨC MẠNH';
    }
}

function formatNumberCompact(number) {
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(2) + 'B';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(2) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(2) + 'K';
    } else {
        return number.toString();
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

function getPlanetName(planet) {
    switch (planet) {
        case 'EARTH': return 'TRÁI ĐẤT';
        case 'NAMEK': return 'NAMEK';
        case 'SAIYAN': return 'SAIYAN';
        default: return planet;
    }
}

module.exports = createRankImage;