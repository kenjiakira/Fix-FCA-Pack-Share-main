const handleLogUnsubscribe = async (api, event) => {
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    try {
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

        await api.sendMessage(
            `🚪 ${userName} ${actionType}.\n👥 Thành viên còn lại: ${participantIDs.length}`,
            event.threadID
        );

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
