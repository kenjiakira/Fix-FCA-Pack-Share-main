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

        // Check if notifications are enabled
        if (settings[event.threadID] && !settings[event.threadID].notifications) {
            return;
        }

        let threadInfo;
        try {
            threadInfo = await api.getThreadInfo(event.threadID);
        } catch (error) {
            console.error("Error getting thread info:", error);
            threadInfo = { participantIDs: [], threadName: "Unnamed group" };
        }

        const { threadName, participantIDs } = threadInfo;
        const isSelfLeave = event.author == event.logMessageData.leftParticipantFbId;
        const leftUserId = event.logMessageData.leftParticipantFbId;
       
        const userName = event.logMessageData.leftParticipantFbId_name || "Thành viên";
        const adminName = event.logMessageData.author_name || "Quản trị viên";

        const actionType = isSelfLeave 
            ? "đã tự rời khỏi nhóm"
            : `đã bị đá bởi ${adminName}`;

        // Get custom leave message or use default
        let leaveMessage = "{userName} {actionType}.\n👥 Thành viên còn lại: {memberCount}";
        if (settings[event.threadID] && settings[event.threadID].leaveMessage) {
            leaveMessage = settings[event.threadID].leaveMessage;
        }

        // Replace variables
        leaveMessage = leaveMessage
            .replace(/{userName}/g, userName)
            .replace(/{actionType}/g, actionType)
            .replace(/{memberCount}/g, participantIDs.length)
            .replace(/{threadName}/g, threadName);

        await api.sendMessage(leaveMessage, event.threadID);

        if (participantIDs.length < 5) {
            try {
                await api.sendMessage(
                    `⚠️ Cảnh báo: Nhóm hiện chỉ còn ${participantIDs.length} thành viên!`,
                    event.threadID
                );
            } catch (error) {
                console.error("Error sending warning message:", error);
            }
        }

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
