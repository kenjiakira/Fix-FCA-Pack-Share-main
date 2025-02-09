const fs = require('fs');
const path = require('path');

const vipDataPath = path.join(__dirname, '../commands/json/vip.json');

const vipBenefits = {
    1: {
        name: "VIP BRONZE",
        fishingCooldown: 300000, // 5 phút
        fishExpMultiplier: 2,      
        rareBonus: 0.1,           
        trashReduction: 0.2,
        stolenProtection: 0.3, // Bảo vệ 30% xu khi bị trộm
        stolenCooldown: 720000 // 12 phút
    },
    2: {
        name: "VIP SILVER",
        fishingCooldown: 240000, // 4 phút
        fishExpMultiplier: 3,   
        rareBonus: 0.2,         
        trashReduction: 0.4,
        stolenProtection: 0.6, // Bảo vệ 60% xu khi bị trộm
        stolenCooldown: 600000 // 10 phút
    },
    3: {
        name: "VIP GOLD",
        fishingCooldown: 120000, // 2 phút
        fishExpMultiplier: 4,    
        rareBonus: 0.3,            
        trashReduction: 0.6,
        stolenProtection: 1.0, // Bảo vệ 100% xu khi bị trộm
        stolenCooldown: 480000 // 8 phút
    }
};

const defaultBenefits = {
    workBonus: 0,
    cooldownReduction: 0,
    dailyBonus: false,
    fishingCooldown: 360000,
    fishExpMultiplier: 1,
    packageId: 0,
    name: "No VIP",
    rareBonus: 0,
    trashReduction: 0,
    stolenProtection: 0,
    stolenCooldown: 900000 // 15 phút mặc định
};

function checkAndRemoveExpiredVIP() {
    try {
        const vipData = JSON.parse(fs.readFileSync(vipDataPath, 'utf8'));
        const currentTime = Date.now();
        let changed = false;

        for (const [userId, userData] of Object.entries(vipData.users)) {
            if (userData.expireTime < currentTime) {
                delete vipData.users[userId];
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(vipDataPath, JSON.stringify(vipData, null, 2));
        }
    } catch (error) {
        console.error('Error checking VIP expiration:', error);
    }
}

function getVIPBenefits(userId) {
    try {
        const vipData = JSON.parse(fs.readFileSync(vipDataPath, 'utf8'));
        if (vipData.users && vipData.users[userId]) {
            const userData = vipData.users[userId];
            if (userData.expireTime > Date.now()) {
                // Đảm bảo luôn có đủ benefits và không bị ghi đè về 1
                return {
                    ...defaultBenefits,
                    ...userData.benefits,
                    fishExpMultiplier: userData.benefits.fishExpMultiplier || defaultBenefits.fishExpMultiplier,
                    packageId: userData.packageId
                };
            }
        }
        return defaultBenefits;
    } catch (error) {
        console.error('Error getting VIP benefits:', error);
        return defaultBenefits;
    }
}

setInterval(checkAndRemoveExpiredVIP, 60 * 60 * 1000);

module.exports = { checkAndRemoveExpiredVIP, getVIPBenefits };
