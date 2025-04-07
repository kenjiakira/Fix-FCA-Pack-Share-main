const fs = require('fs');
const path = require('path');
const { createRankCard } = require('../game/canvas/rankCard');
const { getStoredCookie, getNameFromCookie } = require('../utils/facebook');

const userDataPath = path.join(__dirname, '../events/cache/rankData.json');

async function getUserNameByCookie(senderID) {
    try {
        // Check if we already have the name in rankData cache
        const rankDataPath = path.join(__dirname, '../events/cache/rankData.json');
        if (fs.existsSync(rankDataPath)) {
            const rankData = JSON.parse(fs.readFileSync(rankDataPath, 'utf8'));
            if (rankData[senderID]?.name) {
                // If we have a cached name less than 1 day old, use it
                const lastUpdate = rankData[senderID].lastNameUpdate || 0;
                const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
                if (Date.now() - lastUpdate < oneDay) {
                    return rankData[senderID].name;
                }
            }
        }
        
        // Get the stored cookie
        const cookie = getStoredCookie();
        if (!cookie) {
            console.log('No Facebook cookie available for name lookup');
            return null;
        }
        
        // Try to get the name from Facebook API
        const result = await getNameFromCookie(cookie);
        if (result.success) {
            return result.name;
        } else {
            console.error('Failed to get name from Facebook:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error in getUserNameByCookie:', error);
        return null;
    }
}

async function getUserName(api, senderID) {
    try {
        // Try to get name from Facebook cookie first
        const cookieName = await getUserNameByCookie(senderID);
        if (cookieName) {
            return cookieName;
        }
        
        // Fall back to existing userData
        const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
        if (fs.existsSync(userDataPath)) {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            if (userData[senderID]?.name) {
                return userData[senderID].name;
            }
        }
        
        // Check cached names
        const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
        try {
            if (fs.existsSync(nameCachePath)) {
                const nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
                if (nameCache[senderID]?.name) {
                    return nameCache[senderID].name;
                }
            }
        } catch (cacheError) {
            console.error("Không thể đọc nameCache:", cacheError);
        }
        
        // Last resort: Try to get name from API
        try {
            const userInfo = await api.getUserInfo(senderID);
            return userInfo[senderID]?.name || "Người dùng";
        } catch (apiError) {
            console.error('Error getting name from API:', apiError);
            return "Người dùng";
        }
    } catch (error) {
        console.error('Error reading user data:', error);
        return "Người dùng";
    }
}

module.exports = {
    name: 'rank',
    category: "Khác",
    info: 'Xem xếp hạng hiện tại của bạn',
    dev: 'HNT',
    usedby: 0,
    onPrefix: true, 
    dmUser: true,
    usages: 'rank',
    cooldowns: 5, 

    onLaunch: async function ({ api, event }) {
        try {
            const { threadID, senderID } = event;
            
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const imagePath = path.join(cacheDir, 'rankImage.jpg');

            let userData;
            try {
                userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            } catch (err) {
                console.error("Error reading user data:", err);
                return api.sendMessage("❌ Chưa có dữ liệu xếp hạng!", threadID);
            }

            if (!userData[senderID]) {
                return api.sendMessage("📝 Bạn chưa có dữ liệu xếp hạng. Hãy tham gia trò chuyện để tích lũy điểm!", threadID);
            }

            try {
                const user = userData[senderID];
                const name = await getUserName(api, senderID);

                await createRankCard(
                    senderID,
                    name,
                    user.exp || 0,
                    user.level || 1,
                    user.rank || 1,
                    imagePath
                );

                if (fs.existsSync(imagePath)) {
                    await api.sendMessage({ 
                        attachment: fs.createReadStream(imagePath)
                    }, threadID, () => {
                        try {
                            fs.unlinkSync(imagePath);
                        } catch (unlinkErr) {
                            console.error("Error cleaning up image:", unlinkErr);
                        }
                    });
                }
            } catch (processError) {
                console.error("Error processing rank:", processError);
                return api.sendMessage("❌ Có lỗi xảy ra khi xử lý thông tin xếp hạng.", threadID);
            }
        } catch (error) {
            console.error("Rank command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi. Vui lòng thử lại sau.", event.threadID);
        }
    }
};
