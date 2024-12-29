const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const userDataPath = path.join(__dirname, '../events/cache/userData.json');

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

function calculateRequiredXp(level) {
    if (level === 1) return 0;
    return Math.floor(10 * Math.pow(1.5, level - 2)); 
}

function updateUserRank(userData) {
    const sortedUsers = Object.entries(userData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.exp - a.exp); 

    sortedUsers.forEach((user, index) => {
        userData[user.id].rank = index + 1; 
    });
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

async function getUserName(api, senderID) {
    let userName;
    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

    if (userData[senderID] && userData[senderID].name) {
        userName = userData[senderID].name;
    } else {
        try {
            const userInfo = await api.getUserInfo(senderID);
            userName = userInfo[senderID]?.name || "Name";

            if (!userData[senderID]) {
                userData[senderID] = {};
            }
            userData[senderID].name = userName;
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.log(error);
            userName = "Name";
        }
    }

    return userName;
}

async function createCanvasBackground(ctx, width, height, level) {
    const bgImageUrl = getRandomImgUrl();  

    try {
   
        const imgResponse = await axios.get(bgImageUrl, { responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(imgResponse.data);
        const img = await loadImage(imgBuffer);

        ctx.drawImage(img, 0, 0, width, height); 

    } catch (error) {
        console.log('Lỗi khi tải ảnh nền:', error.message);
     
        const bgColor = level >= 10 ? '#1abc9c' : level >= 5 ? '#3498db' : '#9b59b6';
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, bgColor);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);  
    }
}


function drawUserInfo(ctx, name, level, currentExp, requiredXp, rank) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    
    ctx.font = 'bold 45px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'; 
    ctx.fillStyle = '#ecf0f1'; 
    ctx.fillText(`${name.toUpperCase()}`, 310, 120); 

    ctx.font = 'bold 70px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillStyle = '#ecf0f1'; 
    ctx.font = 'bold 30px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText(`LVL`, 310, 195);
    ctx.font = 'bold 80px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText(`${level}`, 370, 210);
    ctx.font = 'bold 30px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText(`Xếp Hạng`, 310, 257);
    ctx.font = 'bold 56px "segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.fillText(`#${rank}`,460, 270 );
}

function drawProgressBar(ctx, currentExp, requiredXp) {
    const progressBarWidth = 500;
    const progressBarHeight = 30;
    const borderRadius = 15;
    const progress = Math.min(currentExp / requiredXp, 1);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

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

    ctx.strokeStyle = '#ffffff';  
    ctx.lineWidth = 3; 
    ctx.stroke();

    const progressGradient = ctx.createLinearGradient(0, 0, progressBarWidth, 0);
    progressGradient.addColorStop(0, '#e74c3c');
    progressGradient.addColorStop(1, '#f1c40f');

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

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ecf0f1';

    const text = `${currentExp}/${requiredXp} XP`;
    const textWidth = ctx.measureText(text).width;
    const textX = 50 + progressBarWidth / 2 - textWidth / 2;
    const textY = 373;

    ctx.fillText(text, textX, textY);
}


async function drawAvatar(ctx, senderID, level) {
    const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const avatarX = 50; 
    const avatarY = 80; 
    const avatarSize = 200; 

    try {
        const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarBuffer = Buffer.from(avatarResponse.data);
        const avatar = await circleImage(avatarBuffer, avatarSize);

        const avatarImage = await loadImage(avatar);

        ctx.lineWidth = 12;
        let borderColor;
        if (level >= 100) {
            borderColor = '#e74c3c'; 
        } else if (level >= 50) {
            borderColor = '#f39c12'; 
        } else if (level >= 20) {
            borderColor = '#1abc9c'; 
        } else if (level >= 10) {
            borderColor = '#3498db'; 
        } else if (level >= 3) {
            borderColor = '#9b59b6'; 
        } else {
            borderColor = '#bdc3c7'; 
        }
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2, true); // Vẽ vòng tròn viền
        ctx.closePath();
        ctx.stroke();

        ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);

    } catch (error) {
        console.log('Lỗi khi tải ảnh đại diện:', error.message);
    }
}


async function updateRankApi(senderID, name, currentExp, level, rank) {
    const requiredXp = calculateRequiredXp(level);
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    await createCanvasBackground(ctx, width, height, level);

    drawUserInfo(ctx, name, level, currentExp, requiredXp, rank);
    drawProgressBar(ctx, currentExp, requiredXp);
    await drawAvatar(ctx, senderID, level);

const imagePath = path.join(__dirname, '../commands/cache/rankImage.jpg');

    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(imagePath, buffer);

    return imagePath;
}


module.exports = {
    name: 'rank',
    info: 'Xem xếp hạng hiện tại của bạn',
    dev: 'HNT',
    usedby: 0,
    onPrefix: true, 
    dmUser: true,
    usages: 'rank',
    cooldowns: 5, 

    onLaunch: async function ({ api, event }) {
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        const userId = event.senderID;

        if (!userData[userId]) {
            return api.sendMessage("Bạn chưa có dữ liệu xếp hạng. Hãy nhắn tin để kiếm XP!", event.threadID);
        }

        const user = userData[userId];
        const rank = user.rank || "N/A"; 
        const currentExp = user.exp || 0;
        const level = user.level || 1;

        const imagePath = await updateRankApi(userId, user.name || "Người dùng", currentExp, level, rank);

        if (imagePath) {
            api.sendMessage({
                body: `⏫ | Đây là xếp hạng của bạn:`,
                attachment: fs.createReadStream(imagePath)
            }, event.threadID);

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Lỗi khi xóa tệp hình ảnh:', err);
                } else {
                    console.log('Tệp hình ảnh đã được xóa thành công:', imagePath);
                }
            });
        } else {
            api.sendMessage("Lỗi khi tạo hình ảnh xếp hạng.", event.threadID);
        }
    }
};
