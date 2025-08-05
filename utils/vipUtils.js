const fs = require('fs');
const path = require('path');

const VIP_FILE = path.join(__dirname, '..', 'commands', 'json', 'vip.json');

function loadVIPData() {
    try {
        if (!fs.existsSync(VIP_FILE)) {
            fs.writeFileSync(VIP_FILE, JSON.stringify({ users: {} }, null, 2));
        }
        return JSON.parse(fs.readFileSync(VIP_FILE, 'utf8'));
    } catch (error) {
        return { users: {} };
    }
}

function saveVIPData(data) {
    fs.writeFileSync(VIP_FILE, JSON.stringify(data, null, 2));
}

function addVIP(userID, days = 30, type = 'GOLD') {
    const data = loadVIPData();
    const expireTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    
    data.users[userID] = {
        type: type,
        expireTime: expireTime,
        addedDate: Date.now(),
        days: days
    };
    
    saveVIPData(data);
    return true;
}

function removeVIP(userID) {
    const data = loadVIPData();
    if (data.users[userID]) {
        delete data.users[userID];
        saveVIPData(data);
        return true;
    }
    return false;
}

function checkVIP(userID) {
    const data = loadVIPData();
    const user = data.users[userID];
    
    if (!user) {
        return { hasVIP: false, message: "Không có VIP" };
    }
    
    if (user.expireTime < Date.now()) {
        removeVIP(userID);
        return { hasVIP: false, message: "VIP đã hết hạn" };
    }
    
    const daysLeft = Math.ceil((user.expireTime - Date.now()) / (24 * 60 * 60 * 1000));
    return {
        hasVIP: true,
        type: user.type,
        daysLeft: daysLeft,
        expireTime: user.expireTime,
        message: `VIP ${user.type} - Còn ${daysLeft} ngày`
    };
}

function listAllVIP() {
    const data = loadVIPData();
    const currentTime = Date.now();
    const activeUsers = [];
    
    for (const [userID, user] of Object.entries(data.users)) {
        if (user.expireTime > currentTime) {
            const daysLeft = Math.ceil((user.expireTime - currentTime) / (24 * 60 * 60 * 1000));
            activeUsers.push({
                userID: userID,
                type: user.type,
                daysLeft: daysLeft,
                expireDate: new Date(user.expireTime).toLocaleDateString('vi-VN')
            });
        }
    }
    
    return activeUsers;
}

function getVIPBenefits(userID) {
    const vipStatus = checkVIP(userID);
    
    if (!vipStatus.hasVIP) {
        return {
            hasVIP: false,
            fishingCooldown: 360000,
            fishExpMultiplier: 1,
            rareBonus: 0,
            stolenProtection: 0,
            dailyTransferLimit: 50000000,
            gachaBonus: 0,
            dailyBonus: false
        };
    }
    
    return {
        hasVIP: true,
        type: vipStatus.type,
        daysLeft: vipStatus.daysLeft,

        fishingCooldown: 120000,
        fishExpMultiplier: 4, 
        rareBonus: 0.4, 
        stolenProtection: 1.0, 
        dailyTransferLimit: 5000000000, 
        gachaBonus: 0.15, 
        dailyBonus: true,
        videoDownload: true,
        smsSpam: true,
        giftcodeVIP: true
    };
}

module.exports = {
    loadVIPData,
    saveVIPData,
    addVIP,
    removeVIP,
    checkVIP,
    listAllVIP,
    getVIPBenefits
}; 