const fs = require('fs');
const path = require('path');
const { getStoredCookie, getNameFromCookie } = require('../utils/facebook');

module.exports = {
    name: 'getname',
    category: "Quản trị",
    info: 'Cập nhật tên người dùng trong hệ thống',
    dev: 'HNT',
    usedby: 2, // Admin only
    onPrefix: true,
    dmUser: true,
    usages: 'getname [all|userID]',
    cooldowns: 5,
    
    onLaunch: async function ({ api, event, target }) {
        try {
            const { threadID, senderID, messageID } = event;
            
            // Check if cookie is stored
            const cookie = getStoredCookie();
            if (!cookie) {
                return api.sendMessage("❌ Chưa có cookie Facebook được cài đặt. Vui lòng sử dụng lệnh `setcookie` trước.", threadID, messageID);
            }
            
            // Check if target is empty or 'all'
            const isAll = !target[0] || target[0].toLowerCase() === 'all';
            const targetID = !isAll ? target[0] : null;
            
            // Load rankData
            const rankDataPath = path.join(__dirname, '../events/cache/rankData.json');
            let rankData = {};
            
            if (fs.existsSync(rankDataPath)) {
                rankData = JSON.parse(fs.readFileSync(rankDataPath, 'utf8'));
            } else {
                return api.sendMessage("❌ Không tìm thấy dữ liệu rankData.json", threadID, messageID);
            }
            
            // Load user database
            const userDataPath = path.join(__dirname, '../database/users.json');
            let userData = {};
            
            if (fs.existsSync(userDataPath)) {
                userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            }
            
            // Create usernames.json if it doesn't exist
            const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
            let nameCache = {};
            
            if (fs.existsSync(nameCachePath)) {
                nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
            }
            
            // Directory check for nameCache
            const nameCacheDir = path.dirname(nameCachePath);
            if (!fs.existsSync(nameCacheDir)) {
                fs.mkdirSync(nameCacheDir, { recursive: true });
            }
            
            // Process single user if targetID is provided
            if (targetID) {
                api.sendMessage(`⏳ Đang cập nhật thông tin tên cho ID: ${targetID}...`, threadID, messageID);
                
                try {
                    const userName = await getUserName(api, targetID, cookie);
                    
                    if (userName) {
                        // Update rankData
                        if (!rankData[targetID]) {
                            rankData[targetID] = {};
                        }
                        rankData[targetID].name = userName;
                        rankData[targetID].lastNameUpdate = Date.now();
                        
                        // Update userData
                        if (userData[targetID]) {
                            userData[targetID].name = userName;
                        }
                        
                        // Update nameCache
                        nameCache[targetID] = {
                            name: userName,
                            timestamp: Date.now()
                        };
                        
                        // Save all changes
                        fs.writeFileSync(rankDataPath, JSON.stringify(rankData, null, 2));
                        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
                        fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
                        
                        return api.sendMessage(`✅ Đã cập nhật tên cho ID ${targetID}: ${userName}`, threadID, messageID);
                    } else {
                        return api.sendMessage(`❌ Không thể lấy tên cho ID ${targetID}`, threadID, messageID);
                    }
                } catch (error) {
                    console.error(`Error updating name for ${targetID}:`, error);
                    return api.sendMessage(`❌ Lỗi khi cập nhật tên cho ID ${targetID}: ${error.message}`, threadID, messageID);
                }
            }
            
            // Process all users with missing or placeholder names
            api.sendMessage("⏳ Đang tiến hành cập nhật tên người dùng, quá trình này có thể mất vài phút...", threadID, messageID);
            
            let usersToUpdate = [];
            
            // Find users with missing or placeholder names
            for (const uid in rankData) {
                // Check if user has no name or name is "User" or "Facebook User"
                if (!rankData[uid].name || 
                    rankData[uid].name === "User" || 
                    rankData[uid].name === "Facebook User" || 
                    rankData[uid].name === "Người dùng") {
                    usersToUpdate.push(uid);
                }
            }
            
            if (usersToUpdate.length === 0) {
                return api.sendMessage("✅ Không có tên người dùng nào cần cập nhật!", threadID, messageID);
            }
            
            // Update progress message
            const progressMsg = `⏳ Đang cập nhật tên cho ${usersToUpdate.length} người dùng...`;
            api.sendMessage(progressMsg, threadID, messageID);
            
            // Process in batches to avoid rate limiting
            const batchSize = 5;
            let updatedCount = 0;
            let failedCount = 0;
            
            for (let i = 0; i < usersToUpdate.length; i += batchSize) {
                const batch = usersToUpdate.slice(i, i + batchSize);
                
                // Process batch in parallel
                const promises = batch.map(async (uid) => {
                    try {
                        const name = await getUserName(api, uid, cookie);
                        
                        if (name && name !== "User" && name !== "Facebook User" && name !== "Người dùng") {
                            if (!rankData[uid]) rankData[uid] = {};
                            rankData[uid].name = name;
                            rankData[uid].lastNameUpdate = Date.now();
                            
                            if (userData[uid]) userData[uid].name = name;
                            
                            nameCache[uid] = {
                                name: name,
                                timestamp: Date.now()
                            };
                            
                            updatedCount++;
                            return { success: true, uid, name };
                        } else {
                            failedCount++;
                            return { success: false, uid };
                        }
                    } catch (error) {
                        console.error(`Error updating name for ${uid}:`, error);
                        failedCount++;
                        return { success: false, uid, error: error.message };
                    }
                });
                
                await Promise.all(promises);
                
                // Save data every batch to prevent data loss
                fs.writeFileSync(rankDataPath, JSON.stringify(rankData, null, 2));
                fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
                fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
                
                // Sleep between batches to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Update progress message every 3 batches
                if (i % (batchSize * 3) === 0 && i > 0) {
                    const progress = Math.floor((i / usersToUpdate.length) * 100);
                    api.sendMessage(`⏳ Tiến độ: ${progress}% (${i}/${usersToUpdate.length})`, threadID);
                }
            }
            
            // Save all changes one final time
            fs.writeFileSync(rankDataPath, JSON.stringify(rankData, null, 2));
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
            fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
            
            return api.sendMessage(`✅ Hoàn tất cập nhật tên người dùng!\n- Đã cập nhật: ${updatedCount} người dùng\n- Thất bại: ${failedCount} người dùng`, threadID, messageID);
            
        } catch (error) {
            console.error('Error in getname command:', error);
            return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, event.threadID, event.messageID);
        }
    }
};

async function getUserName(api, userID, cookie) {
    try {
        // Try to get name from Facebook cookie
        if (cookie) {
            // If we're not using the user ID in the cookie, try to get name from Facebook API
            try {
                const userInfo = await api.getUserInfo(userID);
                if (userInfo && userInfo[userID] && userInfo[userID].name) {
                    return userInfo[userID].name;
                }
            } catch (apiError) {
                console.error('Error getting name from API:', apiError);
            }
        }
        
        // Fallback to existing data sources
        // Check userData
        const userDataPath = path.join(__dirname, '../database/users.json');
        if (fs.existsSync(userDataPath)) {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            if (userData[userID]?.name && userData[userID].name !== "User" && userData[userID].name !== "Facebook User") {
                return userData[userID].name;
            }
        }
        
        // Check nameCache
        const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
        if (fs.existsSync(nameCachePath)) {
            const nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
            if (nameCache[userID]?.name && nameCache[userID].name !== "User" && nameCache[userID].name !== "Facebook User") {
                return nameCache[userID].name;
            }
        }
        
        // Last resort: try to get name from API again
        const userInfo = await api.getUserInfo(userID);
        return userInfo[userID]?.name || "User";
    } catch (error) {
        console.error('Error in getUserName function:', error);
        return null;
    }
}