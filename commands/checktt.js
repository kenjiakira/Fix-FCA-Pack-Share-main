const fs = require('fs');
const path = require('path');

function trackInteraction(userID, threadID, count = 1) {
    try {
        const userDataPath = path.join(__dirname, "../events/cache/userData.json");
        const messageDataPath = path.join(__dirname, "../database/messageStats.json");
        
        let userData = {};
        if (fs.existsSync(userDataPath)) {
            userData = JSON.parse(fs.readFileSync(userDataPath, "utf8") || "{}");
        }
        
        let messageStats = {};
        if (fs.existsSync(messageDataPath)) {
            messageStats = JSON.parse(fs.readFileSync(messageDataPath, "utf8") || "{}");
        }
        
        if (!messageStats[threadID]) messageStats[threadID] = {};
        if (!messageStats[threadID][userID]) messageStats[threadID][userID] = 0;
        
        messageStats[threadID][userID] += count;
        
        if (!userData[userID]) userData[userID] = {};
        if (!userData[userID].messageCount) userData[userID].messageCount = {};
        userData[userID].messageCount[threadID] = messageStats[threadID][userID];
        userData[userID].lastMessageTime = Date.now();
        
        fs.writeFileSync(messageDataPath, JSON.stringify(messageStats, null, 2), "utf8");
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), "utf8");
        
        return true;
    } catch (error) {
        console.error("Error tracking interaction:", error);
        return false;
    }
}

module.exports = {
    name: "checktt",
    version: "1.0.1",
    dev: "Kenji Akira",
    category: "Box Chat",
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
            const userDataPath = path.join(__dirname, "../events/cache/userData.json");
            
            let threadsDB = {};
            let usersDB = {};
            let userData = {};
            
            try {
                threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, "utf8") || "{}");
                usersDB = JSON.parse(fs.readFileSync(usersDBPath, "utf8") || "{}");
                
                if (fs.existsSync(userDataPath)) {
                    userData = JSON.parse(fs.readFileSync(userDataPath, "utf8") || "{}");
                    console.log(`Loaded ${Object.keys(userData).length} user records from userData.json`);
                }
            } catch (readError) {
                console.error("Error reading database files:", readError);
            }
            
            let threadInfo = null;
            let participantIDs = [];
            
            try {
                threadInfo = await api.getThreadInfo(threadID);
                if (threadInfo && threadInfo.participantIDs) {
                    participantIDs = threadInfo.participantIDs;
                }
            } catch (apiError) {
                console.error("Error fetching thread info from API:", apiError);
        
            }
            
            if (participantIDs.length === 0) {
                console.log("Falling back to local database for participants");
                
                if (threadsDB[threadID] && threadsDB[threadID].members) {
                    participantIDs = threadsDB[threadID].members;
                } else if (threadsDB[threadID] && threadsDB[threadID].userInfo) {
                 
                    participantIDs = Object.keys(threadsDB[threadID].userInfo);
                }
                
                if (participantIDs.length === 0 && threadsDB[threadID] && threadsDB[threadID].messageCount) {
                    participantIDs = Object.keys(threadsDB[threadID].messageCount);
                }
            }
            
            if (participantIDs.length === 0) {
                for (const userID in usersDB) {
                    if (usersDB[userID].threadIDs && usersDB[userID].threadIDs.includes(threadID)) {
                        participantIDs.push(userID);
                    }
                }
            }
            
            if (Object.keys(userData).length > 0) {
                const activeUserIDs = Object.keys(userData).filter(id => 
                    userData[id].lastMessageTime && 
                    !participantIDs.includes(id) &&
                    (
                        (userData[id].threads && userData[id].threads[threadID]) ||
                        (userData[id].messageCount && userData[id].messageCount[threadID]) ||
                        (userData[id].threadInfo && userData[id].threadInfo.includes(threadID))
                    )
                );
                participantIDs = [...participantIDs, ...activeUserIDs];
            }
            if (participantIDs.length === 0) {
                participantIDs = [senderID];
                
                if (Object.keys(mentions).length > 0) {
                    participantIDs = participantIDs.concat(Object.keys(mentions));
                }
            }
            
            participantIDs = [...new Set(participantIDs)];

            const memberStats = [];
            
            for (const userID of participantIDs) {
                let messageCount = 0;
                
                if (threadInfo && threadInfo.messageCount && threadInfo.messageCount[userID]) {
                    messageCount = threadInfo.messageCount[userID];
                }
                
                else if (threadsDB[threadID] && threadsDB[threadID].messageCount && threadsDB[threadID].messageCount[userID]) {
                    messageCount = threadsDB[threadID].messageCount[userID];
                }
                
                else if (usersDB[userID] && usersDB[userID].messageCount && usersDB[userID].messageCount[threadID]) {
                    messageCount = usersDB[userID].messageCount[threadID];
                }
                
                else if (userData[userID] && userData[userID].messageCount && userData[userID].messageCount[threadID]) {
                    messageCount = userData[userID].messageCount[threadID];
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
            
            if (Object.keys(mentions).length > 0) {
                let msg = "📊 THỐNG KÊ TƯƠNG TÁC 📊\n\n";
                for (const userID in mentions) {
                    const member = memberStats.find(m => m.userID === userID);
                    if (member) {
                        const rank = memberStats.findIndex(m => m.userID === userID) + 1;
                        msg += `${member.name}: ${member.count} tin nhắn (Hạng ${rank}/${memberStats.length})`;
                        
                        if (member.level > 1) {
                            msg += ` - Lv.${member.level}`;
                        }
                        
                        msg += "\n";
                    }
                }
                return api.sendMessage(msg, threadID, messageID);
            } else {
                let msg = "📊 THỐNG KÊ TƯƠNG TÁC NHÓM 📊\n\n";
                memberStats.forEach((member, index) => {
                    msg += `${index + 1}. ${member.name}: ${member.count} tin nhắn`;
                    
                    if (member.level > 1) {
                        msg += ` (Lv.${member.level})`;
                    }
                    
                    msg += "\n";
                });
                return api.sendMessage(msg, threadID, messageID);
            }
            
            return api.sendMessage("❌ Không tìm thấy thông tin tương tác!", threadID, messageID);
            
        } catch (error) {
            console.error("Error in checktt command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
    trackInteraction(trackInteraction);
