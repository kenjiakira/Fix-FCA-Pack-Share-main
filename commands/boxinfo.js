const fs = require('fs');
const path = require('path');

const getThreadInfo = async (api, threadID) => {
    try {
        const info = await api.getThreadInfo(threadID);
        return info || null;
    } catch (error) {
        return null;
    }
};

const getCachedThreadInfo = (threadID) => {
    try {
        const cachePath = path.join(__dirname, '../database/threadInfo.json');
        if (fs.existsSync(cachePath)) {
            const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            return cache[threadID] || null;
        }
    } catch (error) {
        return null;
    }
    return null;
};

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
            const threadID = event.threadID;
            
            // Try to get current info
            const threadInfo = await getThreadInfo(api, threadID);
            // Get cached info as backup
            const cachedInfo = getCachedThreadInfo(threadID);

            let msg = `📊 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗛𝗢́𝗠\n`;
            msg += `━━━━━━━━━━━━━━━━━━\n`;
            msg += `ID nhóm: ${threadID}\n`;

            if (threadInfo) {
                const { participantIDs, threadName, messageCount, emoji, color, adminIDs, approvalMode, userInfo } = threadInfo;

                const botID = api.getCurrentUserID();
                const isAdmin = adminIDs?.some(e => e.id === botID);

                let males = 0, females = 0, others = 0;
                if (userInfo) {
                    userInfo.forEach(user => {
                        if (user.gender === 'MALE') males++;
                        else if (user.gender === 'FEMALE') females++;
                        else others++;
                    });
                }

                msg += `Tên nhóm: ${threadName || "Không có tên"}\n`;
                msg += `Thành viên: ${participantIDs?.length || 0}\n`;
                if (userInfo) {
                    msg += `👨 Nam: ${males}\n`;
                    msg += `👩 Nữ: ${females}\n`;
                    msg += `🤖 Khác: ${others}\n`;
                }
                msg += `Quản trị viên: ${adminIDs?.length || 0} người\n`;
                msg += `Tổng tin nhắn: ${messageCount || 0}\n`;
                msg += `Emoji: ${emoji || '❌'}\n`;
                msg += `Mã màu: ${color || 'Mặc định'}\n`;
                msg += `Phê duyệt: ${approvalMode ? '✅' : '❌'}\n`;
                msg += `Bot là QTV: ${isAdmin ? '✅' : '❌'}\n`;

            } else if (cachedInfo) {
                // Use cached info
                msg += `Tên nhóm: ${cachedInfo.threadName || "Không có tên"}\n`;
                msg += `Thành viên: ${cachedInfo.memberCount || "N/A"}\n`;
                msg += `Quản trị viên: ${cachedInfo.adminCount || "N/A"} người\n`;
                msg += `💡 Thông tin có thể đã cũ\n`;
                msg += `⚠️ Không thể lấy thông tin mới do bị FB giới hạn\n`;
            } else {
                msg += `⚠️ Không thể lấy thông tin nhóm\n`;
                msg += `💡 Bot có thể đang bị FB giới hạn tạm thời\n`;
            }

            msg += `━━━━━━━━━━━━━━━━━━`;
            await api.editMessage(msg, loading.messageID);

        } catch (error) {
            console.error("Boxinfo error:", error);
            await api.sendMessage(
                "❌ Đã xảy ra lỗi khi lấy thông tin nhóm.\n" +
                "💡 Bot có thể đang bị FB giới hạn tạm thời.", 
                event.threadID
            );
        }
    }
};
