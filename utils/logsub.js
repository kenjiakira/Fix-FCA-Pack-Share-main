const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleNewMember } = require('../commands/groups');

async function sendWelcomeMessage(api, threadID, userName, threadName, memberNumber) {
    try {
        const configPath = path.join(__dirname, '../database/threadSettings.json');
        let settings = {};
        
        try {
            if (fs.existsSync(configPath)) {
                settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading settings:", err);
        }

        if (settings[threadID] && !settings[threadID].notifications) {
            return;
        }

        let welcomeMessage = "👋 {userName}\n📝 Chào mừng đến nhóm: {threadName}\n👥 Thành viên thứ: {memberNumber}";
        
        if (settings[threadID] && settings[threadID].welcomeMessage) {
            welcomeMessage = settings[threadID].welcomeMessage;
        }

        welcomeMessage = welcomeMessage
            .replace(/{userName}/g, userName)
            .replace(/{threadName}/g, threadName)
            .replace(/{memberNumber}/g, memberNumber);

        await api.sendMessage(welcomeMessage, threadID);
    } catch (error) {
        console.error("Error sending welcome message:", error);
        await api.sendMessage(
            `👋 ${userName}\n📝 Chào mừng đến nhóm!`,
            threadID
        );
    }
}

async function verifyThreadAdmins(api, threadID) {
    const threadsDBPath = path.join(__dirname, '../database/threads.json');
    const threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, 'utf8') || '{}');
    
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (threadInfo && threadInfo.adminIDs && threadInfo.adminIDs.length > 0) {
      
            if (!threadsDB[threadID]) {
                threadsDB[threadID] = {
                    members: threadInfo.participantIDs || [],
                    messageCount: {},
                    lastActivity: Date.now()
                };
            }
            
            threadsDB[threadID].adminIDs = threadInfo.adminIDs;
            threadsDB[threadID].adminLastUpdate = Date.now();
            threadsDB[threadID].adminVerified = true;
            
            fs.writeFileSync(threadsDBPath, JSON.stringify(threadsDB, null, 2));
            console.log(`✅ Successfully verified admins for thread ${threadID}`);
            
            return {
                success: true,
                message: `Đã xác thực thành công ${threadInfo.adminIDs.length} quản trị viên cho nhóm này.`,
                adminCount: threadInfo.adminIDs.length
            };
        } else {
            if (!threadsDB[threadID]) {
                threadsDB[threadID] = {
                    members: [],
                    messageCount: {},
                    lastActivity: Date.now(),
                    adminIDs: [],
                    adminLastUpdate: Date.now(),
                    adminVerified: false
                };
            } else {
                threadsDB[threadID].adminVerified = false;
            }
            
            fs.writeFileSync(threadsDBPath, JSON.stringify(threadsDB, null, 2));
            console.log(`⚠️ Failed to verify admins for thread ${threadID}`);
            
        }
    } catch (error) {
        console.error(`Error verifying admins for thread ${threadID}:`, error);
        
        if (!threadsDB[threadID]) {
            threadsDB[threadID] = {
                members: [],
                messageCount: {},
                lastActivity: Date.now(),
                adminIDs: [],
                adminLastUpdate: Date.now(),
                adminVerified: false
            };
        } else {
            threadsDB[threadID].adminVerified = false;
        }
        
        fs.writeFileSync(threadsDBPath, JSON.stringify(threadsDB, null, 2));
        
        return {
            success: false,
            message: "Không thể xác thực quản trị viên do Facebook đã chặn tính năng lấy admin. Vui lòng sử dụng lệnh .admin setadmin để thiết lập quản trị viên thủ công.",
            adminCount: 0,
            error: error.message
        };
    }
}

async function notifyAdminGroup(api, threadID, adminConfig) {
    try {
        const ADMIN_GROUP_ID = "6589198804475799";
        
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo?.threadName || `Nhóm ${threadID}`;
        const memberCount = threadInfo?.participantIDs?.length || 0;
        
        const notificationMessage = 
            `🤖 BOT ĐÃ THAM GIA NHÓM MỚI\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `👥 Tên nhóm: ${threadName}\n` +
            `🆔 Thread ID: ${threadID}\n` +
            `👨‍👩‍👧‍👦 Thành viên: ${memberCount}\n` +
            `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n` +
            `💡 Admin có thể vào nhóm này để kiểm tra hoặc sử dụng lệnh:\n` +
            `${adminConfig.prefix}admin checkadmin ${threadID}\n` +
            `để kiểm tra trạng thái admin của nhóm.`;
        
        await api.sendMessage(notificationMessage, ADMIN_GROUP_ID);
        console.log(`✅ Đã gửi thông báo tới nhóm Admin về việc bot tham gia nhóm ${threadID}`);
        return true;
    } catch (error) {
        console.error(`❌ Không thể gửi thông báo tới nhóm Admin:`, error);
        return false;
    }
}

const handleLogSubscribe = async (api, event, adminConfig) => {
    try {
        if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
            try {
                await api.changeNickname(
                    `${adminConfig.botName} • [ ${adminConfig.prefix} ]`,
                    event.threadID,
                    api.getCurrentUserID()
                );
                
                const guideMsg = "⚡️ Kết nối thành công!\n" +
                               `📝 Prefix: ${adminConfig.prefix}\n` +
                               "💡 Sử dụng help để xem danh sách lệnh";

                await api.sendMessage(guideMsg, event.threadID);
                
                notifyAdminGroup(api, event.threadID, adminConfig).then(sent => {
                    if (sent) {
                        console.log(`✅ Đã thông báo đến nhóm admin về việc tham gia nhóm ${event.threadID}`);
                    }
                });

            } catch (error) {
                console.error("Error setting bot nickname:", error);
            }
            return;
        }

        const threadID = event.threadID;
        let threadInfo;
        
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
            try {
                threadInfo = await api.getThreadInfo(threadID);
                break;
            } catch (err) {
                retries++;
                if (retries === maxRetries) {
                    console.error("Failed to get thread info after", maxRetries, "attempts");
                    threadInfo = { participantIDs: [] };
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }
        }

        const threadName = threadInfo?.threadName || `Nhóm ${threadID}`;
        const participantIDs = threadInfo?.participantIDs || [];
        const addedParticipants = event.logMessageData.addedParticipants;

        for (let newParticipant of addedParticipants) {
            const userID = newParticipant.userFbId;
            if (userID === api.getCurrentUserID()) continue;

            const userName = newParticipant.fullName || `Thành viên mới`;
            const memberNumber = participantIDs.length;

            await sendWelcomeMessage(api, threadID, userName, threadName, memberNumber);

            try {
                await handleNewMember(api, {
                    threadID: threadID,
                    participantIDs: [userID]
                });
            } catch (error) {
                console.error("Error handling new member:", error);
            }
        }
    } catch (error) {
        console.error("Error in handleLogSubscribe:", error);
    }
};

module.exports = { handleLogSubscribe, verifyThreadAdmins };
