const fs = require('fs');
const path = require('path');

module.exports = {
    name: "leave",
    info: "Xử lý khi thành viên rời nhóm",

    onEvents: async function({ api, event, Threads }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        if (logMessageType !== "log:unsubscribe") return;

        const antioutPath = path.join(__dirname, '../commands/json/antiout.json');
        if (!fs.existsSync(antioutPath)) return;
        
        const antioutData = JSON.parse(fs.readFileSync(antioutPath));
        if (!antioutData[threadID]) return;

        const leftParticipantFbId = event.logMessageData.leftParticipantFbId || 
                                   event.logMessageData.participantFbId;
        
        try {
            if (leftParticipantFbId == api.getCurrentUserID()) return;
            
            const isKicked = event.author !== leftParticipantFbId;
            if (isKicked) return;

            const userName = event.logMessageData.leftParticipantFbId_name || 
                            event.logMessageData.name ||
                            "Thành viên";
            
            await new Promise(resolve => setTimeout(resolve, 2000));

            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    await api.addUserToGroup(leftParticipantFbId, threadID);
                    
                    await api.sendMessage(
                        `🔒 Đã thêm ${userName} trở lại nhóm!\n⚠️ Nhóm đang bật chế độ chống rời nhóm.`,
                        threadID
                    );
                    return;
                } catch (addError) {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                        continue;
                    }
                    throw addError;
                }
            }
        } catch (error) {
            console.error("Anti-out error:", error);
            let errorMsg = "⚠️ Không thể thêm lại thành viên vào nhóm. ";
            
            if (error.error === 6) {
                errorMsg += "Người dùng đã chặn bot.";
            } else if (error.error === 3252001) {
                errorMsg += "Bot đang bị Facebook hạn chế tính năng.";
            } else {
                errorMsg += "Có thể bot không phải là quản trị viên.";
            }

            api.sendMessage(errorMsg, threadID);
        }
    }
};
