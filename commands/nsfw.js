const fs = require('fs');
const path = require('path');
const {
    loadNSFWSettings,
    setThreadNSFWStatus,
    setUserNSFWBlock
} = require('../utils/NSFW');

module.exports = {
    name: "nsfw",
    Dev: "HNT",
    info: "Quản lý lệnh NSFW (18+)",
    category: "Admin Commnands",
    usages: "nsfw on: Bật lệnh NSFW trong nhóm\nnsfw off: Tắt lệnh NSFW trong nhóm\nnsfw block [uid]: (Admin) Chặn người dùng sử dụng lệnh NSFW\nnsfw unblock [uid]: (Admin) Bỏ chặn người dùng sử dụng lệnh NSFW\nnsfw status: Xem trạng thái NSFW của nhóm hiện tại",
    usedby: 1,
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, senderID, messageID } = event;
        const option = target[0]?.toLowerCase();

        const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
        const isAdmin = adminConfig.adminUIDs?.includes(senderID);
        const isMod = adminConfig.moderatorUIDs?.includes(senderID);

        let isGroupAdmin = false;
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            isGroupAdmin = threadInfo.adminIDs?.some(admin =>
                admin.id === senderID || admin === senderID
            );
        } catch (error) {
            console.error("Error checking group admin status:", error);
        }

        const hasPermission = isAdmin || isMod || isGroupAdmin;
        if (!hasPermission) {
            return api.sendMessage("⚠️ Lệnh này chỉ dành cho Quản trị viên nhóm hoặc Admin bot.", threadID, messageID);
        }

        const settings = loadNSFWSettings();

        switch (option) {
            case "on":
                if (setThreadNSFWStatus(threadID, true)) {
                    return api.sendMessage("✅ Đã bật lệnh NSFW trong nhóm này.\n⚠️ Lưu ý: Nhóm nên có quy định rõ ràng về nội dung 18+.", threadID, messageID);
                } else {
                    return api.sendMessage("❌ Có lỗi khi bật lệnh NSFW.", threadID, messageID);
                }

            case "off":
                if (setThreadNSFWStatus(threadID, false)) {
                    return api.sendMessage("✅ Đã tắt lệnh NSFW trong nhóm này.", threadID, messageID);
                } else {
                    return api.sendMessage("❌ Có lỗi khi tắt lệnh NSFW.", threadID, messageID);
                }

            case "block":
                if (!isAdmin && !isMod) {
                    return api.sendMessage("⚠️ Chỉ Admin và Điều hành viên bot mới có thể chặn người dùng sử dụng lệnh NSFW.", threadID, messageID);
                }

                const blockUserID = target[1] || "";
                if (!blockUserID) {
                    return api.sendMessage("⚠️ Vui lòng cung cấp ID người dùng cần chặn.", threadID, messageID);
                }

                if (setUserNSFWBlock(blockUserID, true)) {
                    return api.sendMessage(`✅ Đã chặn người dùng ${blockUserID} sử dụng lệnh NSFW.`, threadID, messageID);
                } else {
                    return api.sendMessage("❌ Có lỗi khi chặn người dùng.", threadID, messageID);
                }

            case "unblock":
                if (!isAdmin && !isMod) {
                    return api.sendMessage("⚠️ Chỉ Admin và Điều hành viên bot mới có thể bỏ chặn người dùng sử dụng lệnh NSFW.", threadID, messageID);
                }

                const unblockUserID = target[1] || "";
                if (!unblockUserID) {
                    return api.sendMessage("⚠️ Vui lòng cung cấp ID người dùng cần bỏ chặn.", threadID, messageID);
                }

                if (setUserNSFWBlock(unblockUserID, false)) {
                    return api.sendMessage(`✅ Đã bỏ chặn người dùng ${unblockUserID} sử dụng lệnh NSFW.`, threadID, messageID);
                } else {
                    return api.sendMessage("❌ Có lỗi khi bỏ chặn người dùng.", threadID, messageID);
                }

            case "status":
                const threadEnabled = settings.enabledThreads[threadID] === true;
                let statusMsg = `📊 Trạng thái NSFW trong nhóm: ${threadEnabled ? "✅ ĐÃ BẬT" : "❌ ĐÃ TẮT"}\n`;

                if (isAdmin || isMod) {
                    statusMsg += "\n🔧 Cài đặt hệ thống:";
                    statusMsg += `\n- Admin bypass: ${settings.adminBypass ? "✅ Bật" : "❌ Tắt"}`;
                    statusMsg += `\n- Mod bypass: ${settings.modBypass ? "✅ Bật" : "❌ Tắt"}`;

                    const blockedCount = Object.keys(settings.blockedUsers || {}).length;
                    const enabledCount = Object.keys(settings.enabledThreads || {}).length;

                    statusMsg += `\n- Số người dùng bị chặn: ${blockedCount}`;
                    statusMsg += `\n- Số nhóm đã bật NSFW: ${enabledCount}`;
                }

                return api.sendMessage(statusMsg, threadID, messageID);

            default:
                return api.sendMessage(
                    "📝 Hướng dẫn sử dụng lệnh NSFW:\n\n" + this.usages,
                    threadID,
                    messageID
                );
        }
    }
};