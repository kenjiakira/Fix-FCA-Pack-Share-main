const fs = require('fs');
const path = require('path');
const { createRankCard, calculateRequiredXp } = require('../game/canvas/rankCard');

const userDataPath = path.join(__dirname, 'cache', 'rankData.json');
const messageQueue = [];

function updateUserRank(userData) {
    const sortedUsers = Object.entries(userData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.exp - a.exp); 

    const rewards = {
        0: 50000, 
        1: 30000, 
        2: 20000  
    };

    sortedUsers.forEach((user, index) => {
        userData[user.id].rank = index + 1;
        
        if (rewards[index] !== undefined) {
            const currentBalance = global.balance[user.id] || 0;
            global.balance[user.id] = currentBalance + rewards[index];
            require('../utils/currencies').saveData();
        }
    });
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

    const imagePath = path.join(__dirname, 'cache', 'rankcard.jpeg');
    await createRankCard(senderID, name, exp, level, rank, imagePath);
    const announcement = `⏫ | ${name} đã đạt đến Level ${level} với Xếp hạng ${rank}!`;

    if (fs.existsSync(imagePath)) {
        api.sendMessage(
            { body: announcement, attachment: fs.createReadStream(imagePath) },
            event.threadID,
            () => {
                try {
                    fs.unlinkSync(imagePath);
                } catch (err) {
                    console.error("Error cleaning up rankcard image:", err);
                }
            }
        );
    } else {
        api.sendMessage(announcement, event.threadID);
    }

    setTimeout(() => processQueue(api, event), 500);
}

async function updateQuestProgress(userId, quest) {
    try {
        const userQuests = require('../utils/currencies').getUserQuests(userId);
        if (!userQuests.completed[quest]) {
            userQuests.progress[quest] = (userQuests.progress[quest] || 0) + 1;
        }
    } catch (error) {
        console.error("Error updating quest progress:", error);
    }
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

                // Cập nhật tiến độ nhiệm vụ chat_active
                await updateQuestProgress(userId, 'chat_active');

                fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
            }
        }
    };