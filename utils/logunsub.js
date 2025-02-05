const fs = require('fs');
const path = require('path');

const handleLogUnsubscribe = async (api, event) => {
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

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

        if (settings[event.threadID] && !settings[event.threadID].notifications) {
            return;
        }

        let threadName = "Unnamed group";
        let participantIDs = [];

        try {
            const threadInfo = await api.getThreadInfo(event.threadID);
            if (threadInfo) {
                threadName = threadInfo.threadName || "Unnamed group";
                participantIDs = threadInfo.participantIDs || [];
            }
        } catch (error) {
            console.error("Error getting thread info:", error);
        }

        const isSelfLeave = event.author == event.logMessageData.leftParticipantFbId;
        const userName = event.logMessageData.leftParticipantFbId_name || "Thành viên";
        const adminName = event.logMessageData.author_name || "Quản trị viên";

        const actionType = isSelfLeave 
            ? "đã tự rời khỏi nhóm"
            : `đã bị đá bởi ${adminName}`;

        let leaveMessage = "{userName} {actionType}.\n👥 Thành viên còn lại: {memberCount}";
        if (settings[event.threadID] && settings[event.threadID].leaveMessage) {
            leaveMessage = settings[event.threadID].leaveMessage;
        }

        leaveMessage = leaveMessage
            .replace(/{userName}/g, userName)
            .replace(/{actionType}/g, actionType)
            .replace(/{memberCount}/g, participantIDs.length)
            .replace(/{threadName}/g, threadName);

        await api.sendMessage(leaveMessage, event.threadID);

    } catch (err) {
        console.error("ERROR trong handleLogUnsubscribe:", err);
        try {
            await api.sendMessage(
                "❌ Đã xảy ra lỗi khi xử lý sự kiện rời nhóm.",
                event.threadID
            );
        } catch (error) {
            console.error("Failed to send error message:", error);
        }
    }
};

module.exports = { handleLogUnsubscribe };
