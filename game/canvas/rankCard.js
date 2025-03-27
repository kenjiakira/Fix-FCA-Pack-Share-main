const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const imgurImages = [
    'https://imgur.com/WbcQRAd.png', 
    'https://imgur.com/JgnjQOx.png',
    'https://imgur.com/wTA22J2.png',
    'https://imgur.com/0FtwVUa.png',
    'https://imgur.com/bd2zNqC.png',
    'https://imgur.com/g1LK5fZ.png'
];

function getRandomImgUrl() {
    const randomIndex = Math.floor(Math.random() * imgurImages.length);
    return imgurImages[randomIndex];
}

async function circleImage(imageBuffer, size) {
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);

    return canvas.toBuffer();
}

async function createCanvasBackground(ctx, width, height, level) {
    const bgImageUrl = getRandomImgUrl();  

    try {
        const imgResponse = await axios.get(bgImageUrl, { responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(imgResponse.data);
        const img = await loadImage(imgBuffer);

        ctx.drawImage(img, 0, 0, width, height);
        
        // Thêm overlay gradient để làm nổi bật thông tin
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        overlay.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
        
        // Thêm hiệu ứng ánh sáng góc
        const glow = ctx.createRadialGradient(width*0.8, height*0.2, 0, width*0.8, height*0.2, width*0.5);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

    } catch (error) {
        console.log('Lỗi khi tải ảnh nền:', error.message);
     
        const bgColor = level >= 10 ? '#1abc9c' : level >= 5 ? '#3498db' : '#9b59b6';
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, bgColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Hiệu ứng điểm sáng và đường mờ trang trí
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.random() * 0.3 + ')';
            ctx.fill();
        }
    }
}

function drawUserInfo(ctx, name, level, currentExp, requiredXp, rank) {
    // Hiệu ứng nền glow cho tên
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Vẽ tên người dùng với gradient
    ctx.font = 'bold 45px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'; 
    const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;
    
    const nameGradient = ctx.createLinearGradient(310, 90, 310, 130);
    nameGradient.addColorStop(0, '#ffffff');
    nameGradient.addColorStop(1, '#e6e6e6');
    ctx.fillStyle = nameGradient;
    ctx.fillText(displayName.toUpperCase(), 310, 120);
    
    ctx.restore();

    // Level với hiệu ứng 3D
    ctx.save();
    ctx.font = 'bold 30px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const levelGradient = ctx.createLinearGradient(310, 175, 310, 195);
    levelGradient.addColorStop(0, '#f9ca24');
    levelGradient.addColorStop(1, '#f0932b');
    ctx.fillStyle = levelGradient;
    ctx.fillText(`LVL`, 310, 195);
    
    ctx.font = 'bold 80px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const levelNumGradient = ctx.createLinearGradient(370, 150, 370, 210);
    levelNumGradient.addColorStop(0, '#ffffff');
    levelNumGradient.addColorStop(1, '#f1c40f');
    ctx.fillStyle = levelNumGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`${level}`, 370, 210);
    ctx.restore();
    
    // Thứ hạng với hiệu ứng đặc biệt
    ctx.save();
    ctx.font = 'bold 30px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText(`Xếp Hạng`, 310, 257);
    
    ctx.font = 'bold 56px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const rankGradient = ctx.createLinearGradient(460, 250, 460, 270);
    rankGradient.addColorStop(0, '#74b9ff');
    rankGradient.addColorStop(1, '#0984e3');
    ctx.fillStyle = rankGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText(`#${rank}`, 460, 270);
    ctx.restore();
}

function drawProgressBar(ctx, currentExp, requiredXp) {
    const progressBarWidth = 500;
    const progressBarHeight = 30;
    const borderRadius = 15;
    const progress = Math.min(currentExp / requiredXp, 1);

    // Vẽ khung ngoài với hiệu ứng glow
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Vẽ khung ngoài với hiệu ứng gradient
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(50 + borderRadius, 350);
    ctx.lineTo(50 + progressBarWidth - borderRadius, 350);
    ctx.quadraticCurveTo(50 + progressBarWidth, 350, 50 + progressBarWidth, 350 + borderRadius);
    ctx.lineTo(50 + progressBarWidth, 350 + progressBarHeight - borderRadius);
    ctx.quadraticCurveTo(50 + progressBarWidth, 350 + progressBarHeight, 50 + progressBarWidth - borderRadius, 350 + progressBarHeight);
    ctx.lineTo(50 + borderRadius, 350 + progressBarHeight);
    ctx.quadraticCurveTo(50, 350 + progressBarHeight, 50, 350 + progressBarHeight - borderRadius);
    ctx.lineTo(50, 350 + borderRadius);
    ctx.quadraticCurveTo(50, 350, 50 + borderRadius, 350);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';  
    ctx.lineWidth = 2.5; 
    ctx.stroke();
    ctx.restore();

    // Hiệu ứng đổ bóng trong thanh tiến trình
    ctx.save();
    const innerShadow = ctx.createLinearGradient(50, 350, 50, 350 + progressBarHeight);
    innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    innerShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = innerShadow;
    ctx.fillRect(50, 350, progressBarWidth, progressBarHeight);
    ctx.restore();

    // Thanh tiến trình với hiệu ứng gradient tuyệt đẹp
    const progressGradient = ctx.createLinearGradient(0, 0, progressBarWidth, 0);
    progressGradient.addColorStop(0, '#f85032');
    progressGradient.addColorStop(0.5, '#e73827');
    progressGradient.addColorStop(1, '#f9d423');

    ctx.fillStyle = progressGradient;

    ctx.beginPath();
    ctx.moveTo(50 + borderRadius, 350);
    ctx.lineTo(50 + progress * progressBarWidth - borderRadius, 350);
    if (progress > 0.98) {
        ctx.lineTo(50 + progress * progressBarWidth, 350 + borderRadius);
    }
    ctx.quadraticCurveTo(50 + progress * progressBarWidth, 350, 50 + progress * progressBarWidth, 350 + borderRadius);
    ctx.lineTo(50 + progress * progressBarWidth, 350 + progressBarHeight - borderRadius);
    ctx.quadraticCurveTo(50 + progress * progressBarWidth, 350 + progressBarHeight, 50 + progress * progressBarWidth - borderRadius, 350 + progressBarHeight);
    ctx.lineTo(50 + borderRadius, 350 + progressBarHeight);
    ctx.quadraticCurveTo(50, 350 + progressBarHeight, 50, 350 + progressBarHeight - borderRadius);
    ctx.lineTo(50, 350 + borderRadius);
    ctx.quadraticCurveTo(50, 350, 50 + borderRadius, 350);
    ctx.closePath();
    ctx.fill();

    // Hiệu ứng ánh sáng cho thanh tiến trình
    const progressLight = ctx.createLinearGradient(50, 350, 50, 350 + progressBarHeight/2);
    progressLight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    progressLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = progressLight;
    ctx.fillRect(50, 350, progress * progressBarWidth, progressBarHeight/2);

    // Thông tin XP với hiệu ứng đổ bóng
    ctx.font = 'bold 20px "Segoe UI"';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const text = `${currentExp}/${requiredXp} XP`;
    const textWidth = ctx.measureText(text).width;
    const textX = 50 + progressBarWidth / 2 - textWidth / 2;
    const textY = 373;

    ctx.fillText(text, textX, textY);
}

async function drawAvatar(ctx, senderID, level) {
    const customization = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/json/rankCustomization.json'), 'utf8'));
    const customAvatar = customization.avatars[senderID];
    
    // Kiểm tra VIP status
    let isVIP = false;
    let vipLevel = 0;
    const vipJsonPath = path.join(__dirname, '../commands/json/vip.json');
    try {
        const vipData = JSON.parse(fs.readFileSync(vipJsonPath, 'utf8'));
        const userVIP = vipData.users[senderID];
        
        if (userVIP && userVIP.expireTime > Date.now()) {
            isVIP = true;
            vipLevel = userVIP.level || 1;
        }
    } catch (error) {
        console.error('Error reading VIP data:', error);
    }
    
    const avatarUrl = customAvatar || 
        `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const avatarX = 50; 
    const avatarY = 80; 
    const avatarSize = 200; 

    try {
        const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarBuffer = Buffer.from(avatarResponse.data);
        const avatar = await circleImage(avatarBuffer, avatarSize);
        const avatarImage = await loadImage(avatar);
    
        // Vẽ bóng đổ cho avatar
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Vòng tròn ngoài với hiệu ứng ánh sáng
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.restore();
        
        // Xử lý cho người dùng VIP
        if (isVIP) {
            const currentTime = Date.now() / 1000;
            const centerX = avatarX + avatarSize / 2;
            const centerY = avatarY + avatarSize / 2;
            const radius = avatarSize / 2;
            
            // Định nghĩa màu sắc dựa theo cấp độ VIP
            let frameColors, effectColors, particleColors;
            
            switch(vipLevel) {
                case 3: // BRONZE
                    frameColors = {
                        inner: '#CD7F32',
                        middle: '#B87333',
                        outer: '#A67B5B',
                        glow: 'rgba(205, 127, 50, 0.8)'
                    };
                    effectColors = ['#E6BE8A', '#8C7853', '#D2691E'];
                    particleColors = ['#FFD700', '#FFA500'];
                    break;
                case 2: // SILVER
                    frameColors = {
                        inner: '#E8E8E8',
                        middle: '#C0C0C0',
                        outer: '#A9A9A9',
                        glow: 'rgba(192, 192, 192, 0.8)'
                    };
                    effectColors = ['#FFFFFF', '#D3D3D3', '#A9A9A9'];
                    particleColors = ['#FFFFFF', '#E0E0E0'];
                    break;
                default: // GOLD
                    frameColors = {
                        inner: '#FFD700',
                        middle: '#FFC125',
                        outer: '#DAA520',
                        glow: 'rgba(255, 215, 0, 0.8)'
                    };
                    effectColors = ['#FFDF00', '#F0E68C', '#BDB76B'];
                    particleColors = ['#FFFFFF', '#FFF8DC'];
            }
            
            // THAY ĐỔI PHƯƠNG PHÁP: Vẽ khung trang trí trước, sau đó vẽ avatar
            
            // 1. Vẽ các hiệu ứng tia sáng và hạt
            ctx.save();
            const rayCount = 16;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2;
                const rayLength = 10 + Math.sin(currentTime * 3 + i) * 8;
                
                const innerRadius = radius + 22;
                const outerRadius = innerRadius + rayLength;
                
                const rayGradient = ctx.createLinearGradient(
                    centerX + Math.cos(angle) * innerRadius,
                    centerY + Math.sin(angle) * innerRadius,
                    centerX + Math.cos(angle) * outerRadius,
                    centerY + Math.sin(angle) * outerRadius
                );
                rayGradient.addColorStop(0, frameColors.glow);
                rayGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.strokeStyle = rayGradient;
                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(angle) * innerRadius,
                    centerY + Math.sin(angle) * innerRadius
                );
                ctx.lineTo(
                    centerX + Math.cos(angle) * outerRadius,
                    centerY + Math.sin(angle) * outerRadius
                );
                ctx.stroke();
            }
            
            // 2. Vẽ vành đai ngoài
            ctx.shadowColor = frameColors.glow;
            ctx.shadowBlur = 20 + Math.sin(currentTime) * 5;
            ctx.lineWidth = 8;
            
            const outerGradient = ctx.createRadialGradient(
                centerX, centerY, radius - 5,
                centerX, centerY, radius + 20
            );
            outerGradient.addColorStop(0, frameColors.inner);
            outerGradient.addColorStop(0.5, frameColors.middle);
            outerGradient.addColorStop(1, frameColors.outer);
            
            ctx.strokeStyle = outerGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
            ctx.stroke();
            
            // 3. Vẽ đường viền kim loại nổi 3D
            ctx.shadowBlur = 0;
            ctx.lineWidth = 12;
            const metalGradient = ctx.createLinearGradient(
                centerX - radius - 20, 
                centerY - radius - 20,
                centerX + radius + 20,
                centerY + radius + 20
            );
            metalGradient.addColorStop(0, frameColors.inner);
            metalGradient.addColorStop(0.5, frameColors.middle);
            metalGradient.addColorStop(1, frameColors.outer);
            
            ctx.strokeStyle = metalGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            
            // 4. VẼ AVATAR - Đặt avatar lên trên tất cả các đường viền
            ctx.save();
            // Tạo clip path riêng cho avatar để đảm bảo nó luôn hiển thị đầy đủ
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            
            // 5. Tiếp tục vẽ các hiệu ứng trang trí khác, nhưng không vẽ đè lên avatar
            ctx.save();
            
            // Vẽ các biểu tượng trang trí xung quanh khung
            if (vipLevel === 1) { 
                const crownCount = 8;
                const crownSize = 12;
                
                for (let i = 0; i < crownCount; i++) {
                    const angle = (i / crownCount) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * (radius + 15);
                    const y = centerY + Math.sin(angle) * (radius + 15);
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle + Math.PI/2);
                    
                    ctx.fillStyle = frameColors.inner;
                    ctx.beginPath();
                    ctx.moveTo(0, -crownSize/2);
                    ctx.lineTo(-crownSize/2, 0);
                    ctx.lineTo(0, -crownSize/4);
                    ctx.lineTo(crownSize/2, 0);
                    ctx.lineTo(0, -crownSize/2);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.fillRect(-crownSize/2, 0, crownSize, crownSize/4);
                    ctx.restore();
                }
            } else if (vipLevel === 2) { 
                const starCount = 10;
                const starSize = 10;
                
                for (let i = 0; i < starCount; i++) {
                    const angle = (i / starCount) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * (radius + 15);
                    const y = centerY + Math.sin(angle) * (radius + 15);
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle + Math.sin(currentTime + i) * 0.2);
                    
                    const spikes = 5;
                    const outerRadius = starSize/2;
                    const innerRadius = starSize/4;
                    
                    ctx.fillStyle = frameColors.inner;
                    ctx.beginPath();
                    for (let j = 0; j < spikes * 2; j++) {
                        const r = j % 2 === 0 ? outerRadius : innerRadius;
                        const theta = (j / (spikes * 2)) * Math.PI * 2 - Math.PI/2;
                        const px = r * Math.cos(theta);
                        const py = r * Math.sin(theta);
                        
                        if (j === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            } else { 
                const diamondCount = 12;
                const diamondSize = 8;
                
                for (let i = 0; i < diamondCount; i++) {
                    const angle = (i / diamondCount) * Math.PI * 2;
                    const x = centerX + Math.cos(angle) * (radius + 15);
                    const y = centerY + Math.sin(angle) * (radius + 15);
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    
                    ctx.fillStyle = frameColors.inner;
                    ctx.beginPath();
                    ctx.moveTo(0, -diamondSize/2);
                    ctx.lineTo(diamondSize/2, 0);
                    ctx.lineTo(0, diamondSize/2);
                    ctx.lineTo(-diamondSize/2, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            // Vẽ hiệu ứng hạt
            const particleCount = 12;
            for (let i = 0; i < particleCount; i++) {
                const speed = 0.5 + i * 0.1;
                const angle = currentTime * speed + (i / particleCount) * Math.PI * 2;
                
                const x = centerX + Math.cos(angle) * (radius + 10 + Math.sin(currentTime + i) * 5);
                const y = centerY + Math.sin(angle) * (radius + 10 + Math.sin(currentTime + i) * 5);
                
                const size = 2 + Math.sin(currentTime * 5 + i) * 1;
                const color = particleColors[i % particleColors.length];
                
                ctx.globalAlpha = 0.6 + Math.sin(currentTime * 3 + i) * 0.4;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1.0;
            
            // Vẽ nhãn VIP
            if (vipLevel === 1) { 
                drawVIPLabel(ctx, centerX, avatarY + avatarSize + 10, "VIP GOLD", frameColors);
            } else if (vipLevel === 2) { 
                drawVIPLabel(ctx, centerX, avatarY + avatarSize + 10, "VIP SILVER", frameColors);
            } else { 
                drawVIPLabel(ctx, centerX, avatarY + avatarSize + 10, "VIP BRONZE", frameColors);
            }
            
            ctx.restore();
            
        } else {
            // Xử lý cho người dùng thường
            ctx.save();
            
            // Vẽ viền ngoài trước
            let borderColor1, borderColor2;
            if (level >= 100) {
                borderColor1 = '#e74c3c';
                borderColor2 = '#c0392b';
            } else if (level >= 50) {
                borderColor1 = '#f39c12';
                borderColor2 = '#f1c40f';
            } else if (level >= 20) {
                borderColor1 = '#1abc9c';
                borderColor2 = '#16a085';
            } else if (level >= 10) {
                borderColor1 = '#3498db';
                borderColor2 = '#2980b9';
            } else if (level >= 3) {
                borderColor1 = '#9b59b6';
                borderColor2 = '#8e44ad';
            } else {
                borderColor1 = '#ecf0f1';
                borderColor2 = '#bdc3c7';
            }

            const borderGradient = ctx.createLinearGradient(
                avatarX, avatarY, 
                avatarX + avatarSize, avatarY + avatarSize
            );
            borderGradient.addColorStop(0, borderColor1);
            borderGradient.addColorStop(1, borderColor2);
            
            // Double border effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 12, 0, Math.PI * 2, true);
            ctx.stroke();
            
            ctx.strokeStyle = borderGradient;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2, true);
            ctx.stroke();
            ctx.restore();
            
            // Vẽ avatar bằng clip path để đảm bảo hiển thị đúng
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            
            // Hiệu ứng ánh sáng ở viền trên avatar (vẽ sau cùng)
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, -Math.PI/4, Math.PI/4, true);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
        }

    } catch (error) {
        console.error('Lỗi khi tải avatar:', error);
        if (customAvatar) {
            console.log('Falling back to default avatar...');
            await drawAvatar(ctx, senderID, level);
        }
    }
}

function drawVIPLabel(ctx, x, y, text, colors) {
    const textWidth = ctx.measureText(text).width;
    const padding = 15;
    
    // Tạo nền cho label
    ctx.fillStyle = colors.middle;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - padding, y - 15, textWidth + padding * 2, 30, 15);
    ctx.fill();
    
    // Viền ngoài
    ctx.strokeStyle = colors.outer;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Viền trong
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - padding + 2, y - 15 + 2, textWidth + padding * 2 - 4, 30 - 4, 13);
    ctx.stroke();
    
    // Hiệu ứng ánh sáng trên nền
    const highlight = ctx.createLinearGradient(
        x - textWidth/2 - padding, y - 15, 
        x - textWidth/2 - padding, y
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.roundRect(x - textWidth/2 - padding + 2, y - 15 + 2, textWidth + padding * 2 - 4, 12, [13, 13, 0, 0]);
    ctx.fill();
    
    // Vẽ chữ
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 6);
}


function createConicalGradient(x, y, startAngle) {
    const gradient = {
        _stops: [],
        addColorStop: function(offset, color) {
            this._stops.push({
                offset: offset,
                color: color
            });
        }
    };
    
    return {
        addColorStop: function(offset, color) {
            gradient.addColorStop(offset, color);
        },
        
        _applyToContext: function(ctx, x, y, width, height) {
            const stops = gradient._stops.sort((a, b) => a.offset - b.offset);
            const segmentCount = 360;
            
            // Kiểm tra nếu không có color stops nào
            if (stops.length === 0) {
                console.warn("Không có color stops nào cho conical gradient");
                return;
            }
            
            for (let i = 0; i < segmentCount; i++) {
                const angle = (i / segmentCount) * Math.PI * 2;
                const angleOffset = (i / segmentCount);
                
                // Tìm màu tương ứng
                let color = stops[0].color;
                for (let j = 0; j < stops.length - 1; j++) {
                    if (angleOffset >= stops[j].offset && angleOffset <= stops[j+1].offset) {
                        const ratio = (angleOffset - stops[j].offset) / (stops[j+1].offset - stops[j].offset);
                        color = stops[j].color;
                        break;
                    }
                }
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.arc(x, y, width, angle, angle + (Math.PI * 2 / segmentCount), false);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
            }
        }
    };
}

async function createRankCard(senderID, name, currentExp, level, rank, outputPath) {
 
    const cacheDir = path.dirname(outputPath);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const requiredXp = calculateRequiredXp(level);
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const customization = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/json/rankCustomization.json'), 'utf8'));
    const customBg = customization.backgrounds[senderID];
    
    if (customBg) {
        try {
            const response = await axios.get(customBg, { responseType: 'arraybuffer' });
            const bgImage = await loadImage(Buffer.from(response.data));
            ctx.drawImage(bgImage, 0, 0, width, height);
            
            // Thêm lớp overlay để làm nổi bật thông tin người dùng
            const overlay = ctx.createLinearGradient(0, 0, width, 0);
            overlay.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            overlay.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, width, height);
        } catch (error) {
            console.error('Custom background loading error:', error);
            await createCanvasBackground(ctx, width, height, level);
        }
    } else {
        await createCanvasBackground(ctx, width, height, level);
    }

    drawUserInfo(ctx, name, level, currentExp, requiredXp, rank);
    drawProgressBar(ctx, currentExp, requiredXp);
    await drawAvatar(ctx, senderID, level);

    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}

function calculateRequiredXp(level) {
    const baseXp = 50;
    let growthFactor;

    if (level < 5) {
        growthFactor = 1.2;
    } else if (level < 10) {
        growthFactor = 1.3;
    } else if (level < 20) {
        growthFactor = 1.4;
    } else if (level < 50) {
        growthFactor = 1.5;
    } else {
        growthFactor = 1.6;
    }

    if (level === 1) return baseXp;
    return Math.floor(baseXp * Math.pow(growthFactor, level - 1));
}

module.exports = {
    createRankCard,
    calculateRequiredXp
};
