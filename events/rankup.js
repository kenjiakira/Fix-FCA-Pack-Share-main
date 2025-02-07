const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const userDataPath = path.join(__dirname, 'cache', 'userData.json');

const imgurImages = [
    'https://imgur.com/WbcQRAd.png', 
    'https://imgur.com/JgnjQOx.png',
    'https://imgur.com/wTA22J2.png',
    'https://imgur.com/0FtwVUa.png',
    'https://imgur.com/bd2zNqC.png',
    'https://imgur.com/g1LK5fZ.png'
];
const messageQueue = [];

function getRandomImgUrl() {
    const randomIndex = Math.floor(Math.random() * imgurImages.length);
    return imgurImages[randomIndex];
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

const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
let nameCache = {};

function initNameCache() {
    try {
        if (fs.existsSync(nameCachePath)) {
            nameCache = JSON.parse(fs.readFileSync(nameCachePath));
        } else {
            if (!fs.existsSync(path.dirname(nameCachePath))) {
                fs.mkdirSync(path.dirname(nameCachePath), { recursive: true });
            }
            fs.writeFileSync(nameCachePath, JSON.stringify({}));
        }
    } catch (err) {
        console.error('Name cache init error:', err);
    }
}

function saveName(userID, name) {
    try {
        nameCache[userID] = {
            name: name,
            timestamp: Date.now()
        };
        fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
    } catch (err) {
        console.error('Name cache save error:', err);
    }
}

async function getUserName(api, senderID, threadID) {
    try {
        const userInfo = await api.getUserInfo(senderID);
        return userInfo[senderID]?.name || "Name";
    } catch (error) {
        console.log('getUserName error:', error);
        return "Name";
    }
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

    const imagePath = path.join(__dirname, 'cache', `rankcard.jpeg`);
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(imagePath, buffer);

    return imagePath;
}

const rankConfigPath = path.join(__dirname, '../database/json/rankConfig.json');

function loadRankConfig() {
  if (!fs.existsSync(rankConfigPath)) {
    fs.writeFileSync(rankConfigPath, JSON.stringify({ disabledThreads: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(rankConfigPath));
}

async function processQueue(api, event) {
    if (messageQueue.length === 0) return;

    const { senderID, name, exp, level, rank } = messageQueue.shift();
    
    const config = loadRankConfig();
    if (config.disabledThreads.includes(event.threadID)) {
        return;
    }

    const imagePath = await updateRankApi(senderID, name, exp, level, rank);
    const announcement = `⏫ | ${name} đã đạt đến Level ${level} với Xếp hạng ${rank}!`;

    if (imagePath) {
        api.sendMessage(
            { body: announcement, attachment: fs.createReadStream(imagePath) },
            event.threadID
        );
    } else {
        api.sendMessage(announcement, event.threadID);
    }

    setTimeout(() => processQueue(api, event), 500);
}

module.exports = {
    name: 'rankup',
    ver: '2.1',
    prog: 'HNT',

    onEvents: async function ({ api, event }) {
            if (event.type === 'message') {
                const message = event.body.trim();
                let userData;
                const expGain = 1;
                
                try {
                    userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
                } catch (err) {
                    userData = {};
                }

                const userId = event.senderID;

                try {
                    const userInfo = await api.getUserInfo(userId);
                    const newName = userInfo[userId]?.name;
                    if (newName && (!userData[userId]?.name || userData[userId].name !== newName)) {
                        userData[userId] = {
                            ...userData[userId],
                            name: newName
                        };
                    }
                } catch (nameError) {
                    console.log('Could not update name, using existing:', nameError.message);
                }

                if (!userData[userId]) {
                    userData[userId] = {
                        exp: 0,
                        level: 1,
                        name: event.senderName || "User",
                        lastMessageTime: 0
                    };
                }

                const config = loadRankConfig();
                if (config.disabledThreads.includes(event.threadID)) {
                    return;
                }

                const now = Date.now();
                if (!userData[userId].lastMessageTime || now - userData[userId].lastMessageTime >= 10000) {
                    userData[userId].exp += expGain;
                    userData[userId].lastMessageTime = now;
                }

                const expNeeded = calculateRequiredXp(userData[userId].level);

                if (userData[userId].exp >= expNeeded) {
                    userData[userId].level += 1;
                    userData[userId].exp = userData[userId].exp; 
                    updateUserRank(userData);

                    const rankLevel = userData[userId].level;
                    const rank = userData[userId].rank;

                    messageQueue.push({
                        senderID: userId,
                        name: userData[userId].name,
                        exp: userData[userId].exp,
                        level: rankLevel,
                        rank: rank,
                    });

                    processQueue(api, event);
                }

                fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
            }
        }
    };