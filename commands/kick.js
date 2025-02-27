module.exports = {
    name: "kick",
    dev: "HNT",
    usedby: 5, 
    category: "Groups",
    info: "Kick thành viên khỏi nhóm",
    onPrefix: true,
    usages: "[reply/tag/uid]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, messageReply, mentions } = event;

        try {
            const botID = api.getCurrentUserID();
            let threadAdmins = [];

            try {
                const threadInfo = await api.getThreadInfo(threadID);
                if (threadInfo?.adminIDs) {
                    threadAdmins = threadInfo.adminIDs.map(admin => admin.id);
                    if (!threadAdmins.includes(botID)) {
                        return api.sendMessage("❌ Bot cần quyền quản trị viên để thực hiện lệnh này!", threadID);
                    }
                }
            } catch (error) {
                console.error("Thread info fetch error:", error);
            }

            const fs = require("fs");
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const botAdmins = adminConfig.adminUIDs || [];

            let userIDs = [];
            if (messageReply) {
                userIDs.push(messageReply.senderID);
            } else if (Object.keys(mentions || {}).length > 0) { 
                userIDs = Object.keys(mentions);
            } else if (target[0]) {
                if (isNaN(target[0])) {
                    return api.sendMessage("⚠️ ID người dùng không hợp lệ!", threadID, messageID);
                }
                userIDs.push(target[0]);
            } else {
                return api.sendMessage(
                    "Cách sử dụng lệnh kick:\n" +
                    "1. Reply: kick (phản hồi tin nhắn)\n" +
                    "2. Tag: kick @tag\n" +
                    "3. ID: kick [uid]", 
                    threadID, 
                    messageID
                );
            }

            for (const uid of userIDs) {
              
                if (botAdmins.includes(uid)) {
                    api.sendMessage("⚠️ Không thể kick Admin Bot!", threadID);
                    continue;
                }
                
                if (uid == botID || threadAdmins.includes(uid)) continue;
                
                try {
                    await api.removeUserFromGroup(uid, threadID);
                } catch (error) {
                    console.error(`Kick error for ${uid}:`, error);
                }
            }

        } catch (error) {
            console.error("Kick command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};

async function getUserName(api, uid) {
    try {
        const userInfo = await api.getUserInfo(uid);
        return userInfo[uid]?.name || `Người dùng Facebook (${uid})`;
    } catch {
        return `Người dùng Facebook (${uid})`;
    }
}
