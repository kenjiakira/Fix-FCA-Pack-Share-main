const fs = require('fs');
const path = require('path');

module.exports = {
    name: "boxinfo",
    info: "Hiển thị thông tin chi tiết về nhóm chat",
    onPrefix: true,
    dev: "HNT",
    usedby: 1,
    cooldowns: 5,

    onLaunch: async function ({ api, event, actions }) {
        try {
            const loading = await actions.send("⏳ Đang tải thông tin nhóm chat...");
            const threadInfo = await api.getThreadInfo(event.threadID);

            if (!threadInfo) {
                return api.editMessage("❌ Không thể lấy thông tin nhóm chat.", loading.messageID);
            }

            const { participantIDs, threadName, messageCount, emoji, color, adminIDs, approvalMode, userInfo } = threadInfo;

            const botID = api.getCurrentUserID();
            const isAdmin = adminIDs.includes(botID);

            const threadCreatedAt = new Date(threadInfo.timestamp);
            const dateFormat = threadCreatedAt.toLocaleString('vi-VN', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });

            let males = 0, females = 0, others = 0;
            userInfo.forEach(user => {
                if (user.gender === 'MALE') males++;
                else if (user.gender === 'FEMALE') females++;
                else others++;
            });

            let msg = `📊 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗛𝗢́𝗠\n`;
            msg += `━━━━━━━━━━━━━━━━━━\n`;
            msg += `Tên nhóm: ${threadName}\n`;
            msg += `ID nhóm: ${event.threadID}\n`;
            msg += `Thành viên: ${participantIDs.length}\n`;
            msg += `👨 Nam: ${males}\n`;
            msg += `👩 Nữ: ${females}\n`;
            msg += `🤖 Gay: ${others}\n`;
            msg += `Quản trị viên: ${adminIDs.length} người\n`;
            msg += `Tổng tin nhắn: ${messageCount}\n`;
            msg += `Emoji: ${emoji || '❌'}\n`;
            msg += `Mã màu: ${color || 'Mặc định'}\n`;
            msg += `Phê duyệt: ${approvalMode ? '✅' : '❌'}\n`;
            msg += `Bot là QTV: ${isAdmin ? '✅' : '❌'}\n`;
            msg += `Ngày tạo nhóm: ${dateFormat}\n`;
            msg += `━━━━━━━━━━━━━━━━━━`;

            await api.editMessage(msg, loading.messageID);

        } catch (error) {
            console.error("Lỗi khi lấy thông tin nhóm:", error);
            await api.sendMessage("❌ Đã xảy ra lỗi khi lấy thông tin nhóm.", event.threadID);
        }
    }
};
