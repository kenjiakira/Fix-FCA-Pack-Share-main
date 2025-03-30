const fs = require('fs');
const path = require('path');
const axios = require('axios');
const getThreadParticipantIDs = require('../utils/getParticipantIDs');

module.exports = {
    name: "groupinfo",
    category: "Groups",
    info: "Quản lý thông tin nhóm",
    onPrefix: true,
    dev: "HNT",
    usedby: 4,
    usages: `Cách dùng:
1. Xem thông tin nhóm:
   groupinfo info [ID nhóm]

2. Lấy ảnh đại diện nhóm:
   groupinfo avatar [ID nhóm]

3. Xem danh sách nhóm:
   groupinfo list

4. Kiểm tra tương tác:
   groupinfo checktt [all/tag]

Ví dụ:
- groupinfo info - Xem thông tin nhóm hiện tại
- groupinfo avatar 123456789 - Lấy ảnh đại diện nhóm với ID cụ thể
- groupinfo list - Xem danh sách nhóm
- groupinfo checktt all - Kiểm tra tương tác toàn bộ thành viên nhóm`,
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        const subcmd = target[0]?.toLowerCase();
        const args = target.slice(1);

        try {
            switch (subcmd) {
                case "info": {
                    const targetThreadID = args[0] || threadID;
                    const threadInfo = await api.getThreadInfo(targetThreadID);

                    if (!threadInfo) {
                        return api.sendMessage("❌ Không thể tìm thấy thông tin nhóm này!", threadID, messageID);
                    }

                    let msg = `📊 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗛𝗢́𝗠\n━━━━━━━━━━━━━━━━━━\n`;
                    msg += `👥 Tên nhóm: ${threadInfo.threadName || "Không có tên"}\n`;
                    msg += `🆔 ID nhóm: ${targetThreadID}\n`;
                    msg += `👨‍👩‍👧‍👦 Thành viên: ${threadInfo.participantIDs.length}\n`;
                    msg += `👑 Quản trị viên: ${threadInfo.adminIDs?.length || 0}\n`;
                    msg += `🔔 Tổng tin nhắn: ${threadInfo.messageCount || "Không xác định"}\n`;
                    if (threadInfo.emoji) msg += `😊 Emoji: ${threadInfo.emoji}\n`;
                    if (threadInfo.approvalMode) msg += `🔒 Phê duyệt thành viên: Bật\n`;

                    return api.sendMessage(msg, threadID, messageID);
                }

                case "avatar": {
                    const targetThreadID = args[0] || threadID;
                    const threadInfo = await api.getThreadInfo(targetThreadID);

                    if (!threadInfo || !threadInfo.imageSrc) {
                        return api.sendMessage("❌ Nhóm này không có ảnh đại diện!", threadID, messageID);
                    }

                    const avatarUrl = `https://graph.facebook.com/${targetThreadID}/picture?width=1000&height=1000&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                    const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });

                    const cachePath = path.join(__dirname, 'cache');
                    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

                    const avatarPath = path.join(cachePath, `group_avatar_${targetThreadID}.jpg`);
                    fs.writeFileSync(avatarPath, response.data);

                    await api.sendMessage({
                        body: `📸 Ảnh đại diện của nhóm:\n${threadInfo.threadName || "Không có tên"}`,
                        attachment: fs.createReadStream(avatarPath)
                    }, threadID, messageID);

                    setTimeout(() => fs.unlinkSync(avatarPath), 10000);
                    break;
                }

                case "list": {
                    const threads = await api.getThreadList(100, null, ["INBOX"]);
                    const groups = threads.filter(thread => thread.isGroup);

                    if (groups.length === 0) {
                        return api.sendMessage("❌ Không tìm thấy nhóm nào!", threadID, messageID);
                    }

                    let msg = "📑 𝗗𝗔𝗡𝗛 𝗦𝗔́𝗖𝗛 𝗡𝗛𝗢́𝗠\n━━━━━━━━━━━━━━━━━━\n\n";
                    groups.forEach((group, i) => {
                        msg += `${i + 1}. ${group.threadName || "Không tên"}\n`;
                        msg += `👥 ID: ${group.threadID}\n`;
                        msg += `👨‍👨‍👧‍👧 Thành viên: ${group.participantIDs.length}\n`;
                        msg += "━━━━━━━━━━━━━━━━━━\n";
                    });

                    msg += `\n✨ Tổng cộng: ${groups.length} nhóm\n⚠️ Tin nhắn sẽ tự động gỡ sau 60 giây!`;

                    const sentMsg = await api.sendMessage(msg, threadID);
                    setTimeout(() => api.unsendMessage(sentMsg.messageID), 60000);
                    break;
                }

                case "checktt": {
                    const mentions = event.mentions || {};
                    const args = target.slice(1);

                    const threadsDBPath = path.join(__dirname, "../database/threads.json");
                    const usersDBPath = path.join(__dirname, "../database/users.json");
                    const userDataPath = path.join(__dirname, "../events/cache/userData.json");

                    let threadsDB = {};
                    let usersDB = {};
                    let userData = {};

                    try {
                        threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, "utf8") || "{}");
                        usersDB = JSON.parse(fs.readFileSync(usersDBPath, "utf8") || "{}");

                        if (fs.existsSync(userDataPath)) {
                            userData = JSON.parse(fs.readFileSync(userDataPath, "utf8") || "{}");
                        }
                    } catch (readError) {
                        console.error("Error reading database files:", readError);
                    }

                    const participantIDs = args[0] === "all"
                        ? await getThreadParticipantIDs(api, threadID)
                        : Object.keys(mentions);

                    const memberStats = [];
                    for (const userID of participantIDs) {
                        let messageCount = 0;

                        if (userData[userID]?.messageCount?.[threadID]) {
                            messageCount = userData[userID].messageCount[threadID];
                        } else if (threadsDB[threadID]?.messageCount?.[userID]) {
                            messageCount = threadsDB[threadID].messageCount[userID];
                        } else if (usersDB[userID]?.messageCount?.[threadID]) {
                            messageCount = usersDB[userID].messageCount[threadID];
                        }

                        const userName = userData[userID]?.name || "Facebook User";
                        memberStats.push({ userID, name: userName, count: messageCount });
                    }

                    memberStats.sort((a, b) => b.count - a.count);

                    let msg = "📊 THỐNG KÊ TƯƠNG TÁC 📊\n\n";
                    memberStats.forEach((member, index) => {
                        msg += `${index + 1}. ${member.name}: ${member.count} tin nhắn\n`;
                    });

                    return api.sendMessage(msg, threadID, messageID);
                }

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error("GroupInfo Error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
