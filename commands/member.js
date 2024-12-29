const fs = require('fs');
const path = require('path');

const bannedUsersDir = path.join(__dirname, 'cache');
const warn = {};

if (!fs.existsSync(bannedUsersDir)) {
    fs.mkdirSync(bannedUsersDir, { recursive: true });
}

module.exports = {
    name: "member",
    usedby: 1,
    info: "Quản lý thành viên nhóm",
    onPrefix: true,
    usages: "",
    cooldowns: 2,
    dev: "Jonell Magallanes",

    noPrefix: async function ({ api, event, actions }) {
        const botId = api.getCurrentUserID();
        const threadId = event.threadID.toString();

        if (event.body && event.isGroup) {
            const userId = event.senderID.toString();
            const bannedUsersFilePath = path.join(bannedUsersDir, `${threadId}.json`);

            let bannedUsers = [];
            if (fs.existsSync(bannedUsersFilePath)) {
                bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFilePath));
            }

            if (bannedUsers.includes(userId)) {
                try {
                    api.removeUserFromGroup(userId, threadId);
                    const userInfo = await api.getUserInfo(userId);
                    const userName = userInfo[userId].name;
                    api.sendMessage(`👤 Đã loại bỏ khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm và đã bị loại bỏ.`, threadId);
                } catch (error) {
                    console.error(`Lỗi khi xử lý loại bỏ người dùng bị cấm: ${error}`);
                }
            }
        }

        if (event.logMessageType === 'log:subscribe' && event.logMessageData.addedParticipants.some(participant => participant.userFbId)) {
            const addedUserId = event.logMessageData.addedParticipants[0].userFbId.toString();
            const adderUserId = event.author.toString();
            const bannedUsersFilePath = path.join(bannedUsersDir, `${threadId}.json`);

            let bannedUsers = [];
            if (fs.existsSync(bannedUsersFilePath)) {
                bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFilePath));
            }

            if (bannedUsers.includes(addedUserId)) {
                try {
                    api.removeUserFromGroup(addedUserId, threadId);
                    const addedUserInfo = await api.getUserInfo(addedUserId);
                    const addedUserName = addedUserInfo[addedUserId].name;
                    api.sendMessage(`👤 Đã loại bỏ khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${addedUserName} đã bị cấm và đã bị loại bỏ.`, threadId);

                    if (!warn[adderUserId]) {
                        warn[adderUserId] = 1;
                        const adderUserInfo = await api.getUserInfo(adderUserId);
                        const adderUserName = adderUserInfo[adderUserId].name;
                        api.sendMessage(`⚠️ Cảnh báo\n━━━━━━━━━━━━━━━━━━\n${adderUserName}, bạn đã cố gắng thêm một người dùng bị cấm. Đây là cảnh báo đầu tiên của bạn.`, threadId);
                    } else {
                        warn[adderUserId]++;
                        if (warn[adderUserId] >= 2) {
                            api.removeUserFromGroup(adderUserId, threadId);
                            const adderUserInfo = await api.getUserInfo(adderUserId);
                            const adderUserName = adderUserInfo[adderUserId].name;
                            api.sendMessage(`👤 Đã loại bỏ khỏi nhóm\n━━━━━━━━━━━━━━━━━━\n${adderUserName}, bạn đã bị loại bỏ vì cố gắng thêm người dùng bị cấm nhiều lần.`, threadId);
                        } else {
                            const adderUserInfo = await api.getUserInfo(adderUserId);
                            const adderUserName = adderUserInfo[adderUserId].name;
                            api.sendMessage(`⚠️ Cảnh báo\n━━━━━━━━━━━━━━━━━━\n${adderUserName}, bạn đã cố gắng thêm một người dùng bị cấm một lần nữa. Đây là cảnh báo cuối cùng của bạn.`, threadId);
                        }
                    }
                } catch (error) {
                    console.error(`Lỗi khi xử lý thêm người dùng: ${error}`);
                }
            }
        }
    },

    onLaunch: async ({ api, event, target }) => {
        const botId = api.getCurrentUserID();
        const threadId = event.threadID.toString();

        try {
            const threadInfo = await api.getThreadInfo(threadId);
            const adminIds = threadInfo.adminIDs.map(admin => admin.id);
            if (!adminIds.includes(botId)) {
                api.sendMessage("Cần quyền admin để thực hiện các hành động quản trị.", threadId);
                return;
            }
        } catch (error) {
            console.error(`Lỗi khi kiểm tra quyền admin: ${error}`);
            api.sendMessage("Lỗi khi kiểm tra quyền admin.", threadId);
            return;
        }

        const command = target[0];
        const bannedUsersFilePath = path.join(bannedUsersDir, `${threadId}.json`);

        let bannedUsers = [];
        if (fs.existsSync(bannedUsersFilePath)) {
            bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFilePath));
        }

        const userId = event.senderID;

        const threadInfo = await api.getThreadInfo(threadId);
        const isAdmin = threadInfo.adminIDs.some(admin => admin.id === userId);

        if (!isAdmin) {
            api.sendMessage(`🚫 Bạn không phải là admin trong nhóm này. Bạn không thể thực hiện lệnh này.`, threadId);
            return;
        }

        if (command === 'ban') {
            const targetUserId = Object.keys(event.mentions)[0] || target[1];
            if (targetUserId) {
                if (!bannedUsers.includes(targetUserId)) {
                    bannedUsers.push(targetUserId);
                    updateBannedUsersFile(bannedUsers, bannedUsersFilePath);
                    try {
                        api.removeUserFromGroup(targetUserId, threadId);
                        const userInfo = await api.getUserInfo(targetUserId);
                        const userName = userInfo[targetUserId].name;
                        api.sendMessage(`👤 Đã cấm khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm và loại bỏ khỏi nhóm này.`, threadId);
                    } catch (error) {
                        console.error(`Lỗi khi cấm người dùng: ${error}`);
                    }
                } else {
                    try {
                        const userInfo = await api.getUserInfo(targetUserId);
                        const userName = userInfo[targetUserId].name;
                        api.sendMessage(`⚠️ Đã bị cấm rồi\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm khỏi nhóm này.`, threadId);
                    } catch (error) {
                        console.error(`Lỗi khi lấy thông tin người dùng: ${error}`);
                    }
                }
            } else {
                api.sendMessage(`❗ Lỗi\n━━━━━━━━━━━━━━━━━━\nVui lòng nhắc đến một người dùng hoặc cung cấp ID người dùng để cấm.`, threadId);
            }
        } else if (command === 'unban') {
            const targetUserId = Object.keys(event.mentions)[0] || target[1];
            if (targetUserId) {
                const index = bannedUsers.findIndex(ban => ban === targetUserId);
                if (index !== -1) {
                    bannedUsers.splice(index, 1);
                    updateBannedUsersFile(bannedUsers, bannedUsersFilePath);
                    try {
                        const userInfo = await api.getUserInfo(targetUserId);
                        const userName = userInfo[targetUserId].name;
                        api.sendMessage(`✅ Đã gỡ cấm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã được gỡ cấm khỏi nhóm này.`, threadId);
                    } catch (error) {
                        console.error(`Lỗi khi gỡ cấm người dùng: ${error}`);
                    }
                } else {
                    try {
                        const userInfo = await api.getUserInfo(targetUserId);
                        const userName = userInfo[targetUserId].name;
                        api.sendMessage(`⚠️ Chưa bị cấm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} chưa bị cấm khỏi nhóm này.`, threadId);
                    } catch (error) {
                        console.error(`Lỗi khi lấy thông tin người dùng: ${error}`);
                    }
                }
            } else {
                api.sendMessage(`❗ Lỗi\n━━━━━━━━━━━━━━━━━━\nVui lòng nhắc đến một người dùng hoặc cung cấp ID người dùng để gỡ cấm.`, threadId);
            }
        } else if (command === 'list') {
            if (bannedUsers.length > 0) {
                try {
                    const userInfo = await api.getUserInfo(bannedUsers);
                    const bannedList = bannedUsers.map(ban => userInfo[ban].name).join(', ');
                    api.sendMessage(`📝 Danh sách người dùng bị cấm\n━━━━━━━━━━━━━━━━━━\n${bannedList}`, threadId);
                } catch (error) {
                    console.error(`Lỗi khi lấy thông tin người dùng bị cấm: ${error}`);
                }
            } else {
                api.sendMessage(`ℹ️ Không có người dùng bị cấm\n━━━━━━━━━━━━━━━━━━\nHiện tại không có người dùng nào bị cấm trong nhóm này.`, threadId);
            }
        }
    }
};

function updateBannedUsersFile(bannedUsers, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(bannedUsers, null, 2));
}
