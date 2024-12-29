const fs = require('fs');

let bannedThreads = {};
let bannedUsers = {};

try {
    bannedThreads = JSON.parse(fs.readFileSync('./database/ban/threads.json'));
} catch (err) {
    console.error("Lỗi khi đọc tệp dữ liệu danh sách nhóm bị cấm:", err);
}

try {
    bannedUsers = JSON.parse(fs.readFileSync('./database/ban/users.json'));
} catch (err) {
    console.error("Lỗi khi đọc tệp dữ liệu danh sách người dùng bị cấm:", err);
}

module.exports = {
    name: "banlist",
    usedby: 4,
    info: "Lấy danh sách tất cả các nhóm và người dùng bị cấm",
    onPrefix: true,
    cooldowns: 20,

    onLaunch: async function ({ event, api }) {
        const getThreadName = async (threadID) => {
            return new Promise((resolve) => {
                api.getThreadInfo(threadID, (err, info) => {
                    if (err) return resolve(`ID Nhóm: ${threadID}`);
                    resolve(info.threadName || `ID Nhóm: ${threadID}`);
                });
            });
        };

        const getUserName = async (userID) => {
            return new Promise((resolve) => {
                api.getUserInfo(userID, (err, info) => {
                    if (err || !info[userID]) return resolve(`ID Người Dùng: ${userID}`);
                    resolve(info[userID].name || `ID Người Dùng: ${userID}`);
                });
            });
        };

        const bannedThreadList = await Promise.all(
            Object.keys(bannedThreads).map(async (threadID) => {
                const threadName = await getThreadName(threadID);
                return `━━━━━━━━━━━━━━━━━━\n👥 Nhóm Chat: ${threadName}\n📝 Lý Do: ${bannedThreads[threadID].reason}\n━━━━━━━━━━━━━━━━━━\n`;
            })
        );

        const bannedUserList = await Promise.all(
            Object.keys(bannedUsers).map(async (userID) => {
                const userName = await getUserName(userID);
                return `━━━━━━━━━━━━━━━━━━\n👤 Tên: ${userName}\n📝 Lý Do: ${bannedUsers[userID].reason}\n━━━━━━━━━━━━━━━━━━\n`;
            })
        );

        let message = "𝗗𝗮𝗻𝗵 𝗦á𝗰𝗵 𝗕𝗶̣ 𝗖𝗮̂́𝗺\n━━━━━━━━━━━━━━━━━━\n";

        if (bannedThreadList.length > 0) {
            message += `Nhóm Bị Cấm:\n${bannedThreadList.join('\n')}\n\n`;
        } else {
            message += "Không có nhóm nào bị cấm.\n\n";
        }

        if (bannedUserList.length > 0) {
            message += `Người Dùng Bị Cấm:\n${bannedUserList.join('\n')}`;
        } else {
            message += "Không có người dùng nào bị cấm.";
        }

        return api.sendMessage(message, event.threadID);
    }
};
