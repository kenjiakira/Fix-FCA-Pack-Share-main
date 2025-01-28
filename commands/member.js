const fs = require('fs');
const path = require('path');

const bannedUsersDir = path.join(__dirname, 'cache');
const warn = {};

if (!fs.existsSync(bannedUsersDir)) {
    fs.mkdirSync(bannedUsersDir, { recursive: true });
}

module.exports = {
    name: "member",
    info: "Quản lý thành viên nhóm",
    onPrefix: true,
    usedby: 1, 
    usages: [
        "member ban [@tag/uid] - Cấm người dùng khỏi nhóm",
        "member unban [@tag/uid] - Gỡ cấm người dùng",
        "member list - Xem danh sách người dùng bị cấm"
    ].join("\n"),
    description: `Công cụ quản lý thành viên nhóm chat:
    • Cấm thành viên: Ngăn thành viên vào lại nhóm
    • Tự động kick khi thành viên bị cấm được thêm vào
    • Tự động cảnh báo người thêm thành viên bị cấm
    • Quản lý danh sách đen của nhóm
    
Ví dụ:
• /member ban @tên - Cấm theo tag
• /member ban 100023...- Cấm theo ID 
• /member unban @tên - Gỡ cấm theo tag
• /member list - Xem danh sách đen`,
    cooldowns: 2,
    dev: "HNT",

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
                    const userInfo = await api.getUserInfo(userId);
                    const userName = userInfo[userId]?.name || userId;
                    api.sendMessage(`👤 Đã loại bỏ khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm và đã bị loại bỏ.`, threadId);
                } catch (error) {
                    api.sendMessage(`👤 Đã loại bỏ khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userId} đã bị cấm và đã bị loại bỏ.`, threadId);
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

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;
        
        try {
            if (!target[0] || target[0] === "help") {
                return api.sendMessage({
                    body: `🛡️ Hướng dẫn sử dụng Member Command:\n\n${module.exports.usages}\n\n${module.exports.description}`,
                    attachment: null
                }, threadID);
            }

            const command = target[0];
            const bannedUsersFilePath = path.join(bannedUsersDir, `${threadID}.json`);
            let bannedUsers = [];

            if (fs.existsSync(bannedUsersFilePath)) {
                bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFilePath));
            }

            switch (command) {
                case 'ban':
                    const targetUserId = Object.keys(event.mentions)[0] || target[1];
                    if (targetUserId) {
                        if (!bannedUsers.includes(targetUserId)) {
                            bannedUsers.push(targetUserId);
                            updateBannedUsersFile(bannedUsers, bannedUsersFilePath);
                            try {
                                api.removeUserFromGroup(targetUserId, threadID);
                                const userInfo = await api.getUserInfo(targetUserId);
                                const userName = userInfo[targetUserId].name;
                                api.sendMessage(`👤 Đã cấm khỏi nhóm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm và loại bỏ khỏi nhóm này.`, threadID);
                            } catch (error) {
                                console.error(`Lỗi khi cấm người dùng: ${error}`);
                            }
                        } else {
                            try {
                                const userInfo = await api.getUserInfo(targetUserId);
                                const userName = userInfo[targetUserId].name;
                                api.sendMessage(`⚠️ Đã bị cấm rồi\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã bị cấm khỏi nhóm này.`, threadID);
                            } catch (error) {
                                console.error(`Lỗi khi lấy thông tin người dùng: ${error}`);
                            }
                        }
                    } else {
                        api.sendMessage(`❗ Lỗi\n━━━━━━━━━━━━━━━━━━\nVui lòng nhắc đến một người dùng hoặc cung cấp ID người dùng để cấm.`, threadID);
                    }
                    break;
                    
                case 'unban': 
                    const unbannedUserId = Object.keys(event.mentions)[0] || target[1];
                    if (unbannedUserId) {
                        const index = bannedUsers.findIndex(ban => ban === unbannedUserId);
                        if (index !== -1) {
                            bannedUsers.splice(index, 1);
                            updateBannedUsersFile(bannedUsers, bannedUsersFilePath);
                            try {
                                const userInfo = await api.getUserInfo(unbannedUserId);
                                const userName = userInfo[unbannedUserId].name;
                                api.sendMessage(`✅ Đã gỡ cấm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} đã được gỡ cấm khỏi nhóm này.`, threadID);
                            } catch (error) {
                                console.error(`Lỗi khi gỡ cấm người dùng: ${error}`);
                            }
                        } else {
                            try {
                                const userInfo = await api.getUserInfo(unbannedUserId);
                                const userName = userInfo[unbannedUserId].name;
                                api.sendMessage(`⚠️ Chưa bị cấm\n━━━━━━━━━━━━━━━━━━\nNgười dùng ${userName} chưa bị cấm khỏi nhóm này.`, threadID);
                            } catch (error) {
                                console.error(`Lỗi khi lấy thông tin người dùng: ${error}`);
                            }
                        }
                    } else {
                        api.sendMessage(`❗ Lỗi\n━━━━━━━━━━━━━━━━━━\nVui lòng nhắc đến một người dùng hoặc cung cấp ID người dùng để gỡ cấm.`, threadID);
                    }
                    break;
                    
                case 'list':
                    if (bannedUsers.length > 0) {
                        try {
                            let bannedList = [];
                            for (const uid of bannedUsers) {
                                try {
                                    const info = await api.getUserInfo(uid);
                                    bannedList.push(`- ${info[uid].name} (${uid})`);
                                } catch {
                                    bannedList.push(`- ID: ${uid}`);
                                }
                            }
                            api.sendMessage(`📝 Danh sách người dùng bị cấm:\n━━━━━━━━━━━━━━━━━━\n${bannedList.join('\n')}`, threadID);
                        } catch (error) {
                            api.sendMessage(`📝 Danh sách ID người dùng bị cấm:\n━━━━━━━━━━━━━━━━━━\n${bannedUsers.join('\n')}`, threadID);
                        }
                    } else {
                        api.sendMessage(`ℹ️ Không có người dùng bị cấm\n━━━━━━━━━━━━━━━━━━\nHiện tại không có người dùng nào bị cấm trong nhóm này.`, threadID);
                    }
                    break;
            }

        } catch (error) {
            console.error(`Member command error:`, error);
            return api.sendMessage("❌ Không thể thực hiện lệnh! Vui lòng thử lại sau.", threadID);
        }
    }
};

function updateBannedUsersFile(bannedUsers, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(bannedUsers, null, 2));
}
