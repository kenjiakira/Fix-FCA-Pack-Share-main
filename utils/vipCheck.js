const fs = require('fs');
const path = require('path');

const vipDataPath = path.join(__dirname, '../commands/json/vip.json');


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
    stolenCooldown: 900000 
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
            
                const benefits = {
                    ...defaultBenefits,
                    ...userData.benefits,
                    packageId: userData.packageId
                };

                if (userData.packageId === 3) {
                    benefits.stolenProtection = 1.0;
                }

                return benefits;
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
