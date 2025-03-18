const fs = require('fs');
const path = require('path');
const streakPath = path.join(__dirname, '../database/streaks.json');

function loadStreakData() {
    if (!fs.existsSync(streakPath)) {
        fs.writeFileSync(streakPath, JSON.stringify({}, null, 2));
        return {};
    }
    return JSON.parse(fs.readFileSync(streakPath, 'utf8'));
}

function saveStreakData(data) {
    fs.writeFileSync(streakPath, JSON.stringify(data, null, 2));
}

function getStreak(userId) {
    const streakData = loadStreakData();
    const userData = streakData[userId] || {
        current: 0,
        lastUpdate: 0,
        claimsToday: 0,
        lastDayChecked: 0,
        highestStreak: 0,
        totalRewards: 0
    };
    
    const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    if (today > userData.lastDayChecked) {
        userData.claimsToday = 0;
        userData.lastDayChecked = today;
    }
    
    return userData;
}

async function updateStreak(userId) {
    const streakData = loadStreakData();
    let userData = streakData[userId] || {
        current: 0,
        lastUpdate: 0,
        claimsToday: 0,
        lastDayChecked: 0,
        highestStreak: 0,
        totalRewards: 0
    };

    const now = Date.now();
    const today = Math.floor(now / (24 * 60 * 60 * 1000));
    
    // Reset claims nếu là ngày mới
    if (today > userData.lastDayChecked) {
        userData.claimsToday = 0;
        userData.lastDayChecked = today;
    }
    
    userData.claimsToday++;
    userData.lastUpdate = now;

    // Cập nhật streak
    if (now - userData.lastUpdate < 48 * 60 * 60 * 1000) {
        if (userData.claimsToday >= 6) { // Đủ 6 lần claim trong ngày
            userData.current++;
            if (userData.current > userData.highestStreak) {
                userData.highestStreak = userData.current;
            }
        }
    } else {
        userData.current = 1;
    }

    let reward = 0;
    const streakMilestones = {
        3: 500000,
        7: 2000000,
        14: 5000000,
        30: 15000000
    };

    if (streakMilestones[userData.current]) {
        reward = streakMilestones[userData.current];
        userData.totalRewards += reward;
    }

    streakData[userId] = userData;
    saveStreakData(streakData);

    return reward;
}

module.exports = {
    getStreak,
    updateStreak
};
