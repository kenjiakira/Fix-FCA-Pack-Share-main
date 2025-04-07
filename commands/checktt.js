const fs = require('fs');
const path = require('path');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');
const { createCheckTTCanvas, getAvatarPath } = require('../game/canvas/checkttCanvas');

module.exports = {
    name: "checktt",
    dev: "Kenji Akira",
    category: "Groups",
    info: "Kiểm tra mức độ tương tác của thành viên",
    usages: "checktt [all/tag]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID, mentions } = event;
        const args = event.body.split(" ").slice(1);

        try {
            const threadsDBPath = path.join(__dirname, "../database/threads.json");
            const usersDBPath = path.join(__dirname, "../database/users.json");
            const userDataPath = path.join(__dirname, "../events/cache/rankData.json");
            
            let threadsDB = {};
            let usersDB = {};
            let userData = {};
            
            try {
                threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, "utf8") || "{}");
                usersDB = JSON.parse(fs.readFileSync(usersDBPath, "utf8") || "{}");
                
                if (fs.existsSync(userDataPath)) {
                    userData = JSON.parse(fs.readFileSync(userDataPath, "utf8") || "{}");
                }
            } catch (readError) {
                console.error("Error reading database files:", readError);
            }

            let participantIDs = await getThreadParticipantIDs(api, threadID);
            
            if (participantIDs.length === 0) {
                participantIDs = [senderID];
                
                if (Object.keys(mentions).length > 0) {
                    participantIDs = participantIDs.concat(Object.keys(mentions));
                }
            }
            
            participantIDs = [...new Set(participantIDs)];
            
            let threadName = "Nhóm chat";
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                threadName = threadInfo.threadName || "Nhóm chat";
            } catch (err) {
                console.error("Error getting thread name:", err);
            }

            const memberStats = [];
            
            for (const userID of participantIDs) {
                let messageCount = 0;
                
                if (userData[userID] && userData[userID].messageCount && userData[userID].messageCount[threadID]) {
                    messageCount = userData[userID].messageCount[threadID];
                }
                else if (threadsDB[threadID] && threadsDB[threadID].messageCount && threadsDB[threadID].messageCount[userID]) {
                    messageCount = threadsDB[threadID].messageCount[userID];
                }
                else if (usersDB[userID] && usersDB[userID].messageCount && usersDB[userID].messageCount[threadID]) {
                    messageCount = usersDB[userID].messageCount[threadID];
                }
                
                if (isNaN(messageCount) || messageCount < 0) {
                    messageCount = 0;
                }
                
                let userName = "Facebook User";
                try {
                    if (userData[userID] && userData[userID].name) {
                        userName = userData[userID].name;
                    } else {
                        const userInfo = await api.getUserInfo(userID);
                        if (userInfo && userInfo[userID]) {
                            userName = userInfo[userID].name || "Facebook User";
                            
                            if (!userData[userID]) userData[userID] = {};
                            userData[userID].name = userName;
                        }
                    }
                } catch (userError) {
                    if (userData[userID] && userData[userID].name) {
                        userName = userData[userID].name;
                    } else if (usersDB[userID] && usersDB[userID].name) {
                        userName = usersDB[userID].name;
                    } else if (threadsDB[threadID] && threadsDB[threadID].userInfo && 
                              threadsDB[threadID].userInfo[userID] && 
                              threadsDB[threadID].userInfo[userID].name) {
                        userName = threadsDB[threadID].userInfo[userID].name;
                    } else if (mentions[userID]) {
                        userName = mentions[userID];
                    }
                }
                
                if (userName.startsWith("Người dùng ") || userName === "Facebook User" || userName === "User") {
                    if (userData[userID] && userData[userID].name && !userData[userID].name.startsWith("Người dùng ") 
                        && userData[userID].name !== "User" && userData[userID].name !== "Facebook User") {
                        userName = userData[userID].name;
                    }
                }
                
                memberStats.push({
                    userID,
                    name: userName,
                    count: messageCount,
                    level: userData[userID]?.level || 1
                });
            }
            
            try {
                fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), "utf8");
            } catch (saveError) {
                console.error("Error saving updated userData:", saveError);
            }
            
            memberStats.sort((a, b) => b.count - a.count);
            
            const specificUsers = Object.keys(mentions).length > 0;
            const filteredStats = specificUsers 
                ? memberStats.filter(m => Object.keys(mentions).includes(m.userID))
                : memberStats;
            
            let textFallback = specificUsers 
                ? "📊 THỐNG KÊ TƯƠNG TÁC 📊\n\n"
                : "📊 THỐNG KÊ TƯƠNG TÁC NHÓM 📊\n\n";
                
            if (specificUsers) {
                for (const member of filteredStats) {
                    const rank = memberStats.findIndex(m => m.userID === member.userID) + 1;
                    textFallback += `${member.name}: ${member.count} tin nhắn (Hạng ${rank}/${memberStats.length})`;
                    
                    if (member.level > 1) {
                        textFallback += ` - Lv.${member.level}`;
                    }
                    
                    textFallback += "\n";
                }
            } else {
                filteredStats.forEach((member, index) => {
                    textFallback += `${index + 1}. ${member.name}: ${member.count} tin nhắn`;
                    
                    if (member.level > 1) {
                        textFallback += ` (Lv.${member.level})`;
                    }
                    
                    textFallback += "\n";
                });
            }
            
            try {
                const userAvatars = {};
                
                await Promise.all(filteredStats.slice(0, 15).map(async (member) => {
                    try {
                        userAvatars[member.userID] = await getAvatarPath(member.userID);
                    } catch (err) {
                        console.error(`Error getting avatar for ${member.userID}:`, err);
                    }
                }));

                const imagePath = await createCheckTTCanvas(
                    filteredStats,
                    threadID,
                    threadName,
                    senderID,
                    userAvatars
                );
                
                return api.sendMessage({
                    body: `📊 Thống kê tương tác ${specificUsers ? 'các thành viên được tag' : 'nhóm'}`,
                    attachment: fs.createReadStream(imagePath)
                }, threadID, (err) => {
                    if (err) {
                        console.error("Error sending canvas image:", err);
                        api.sendMessage(textFallback, threadID, messageID);
                    }
                    
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });
            } catch (canvasError) {
                console.error("Error creating canvas image:", canvasError);
                return api.sendMessage(textFallback, threadID, messageID);
            }
        } catch (error) {
            console.error("Error in checktt command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};