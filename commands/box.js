const fs = require('fs');
const path = require('path');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const THREADS_FILE = path.resolve(__dirname, 'json', 'box.json');

function saveInboxThreads(threads) {
    fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2));
}

function loadInboxThreads() {
    if (fs.existsSync(THREADS_FILE)) {
        const data = fs.readFileSync(THREADS_FILE);
        return JSON.parse(data);
    }
    return [];
}

module.exports = {
    name: "box",
    usedby: 2,
    info: "Quản lý nhóm chat trong hộp thư",
    onPrefix: true,
    dev: "Jonell Magallanes",
    cooldowns: 1,

    onLaunch: async function ({ api, event, target, actions }) {
        try {
            const hs = await actions.send("Đang tải nhóm chat trong hộp thư....");
            let inboxThreads = loadInboxThreads();

            if (target.length > 0 && target[0] === "out") {
                let index = parseInt(target[1], 10) - 1;
                if (!isNaN(index) && index >= 0 && index < inboxThreads.length) {
                    let threadToLeave = inboxThreads[index];

                    try {
                        await api.sendMessage(
                            "☁️ 𝗕𝗼𝘁 𝗟𝗲𝗳𝘁 𝗚𝗿𝗼𝘂𝗽 𝗖𝗵𝗮𝘁\n━━━━━━━━━━━━━━━━━━\n" +
                            "Bot đã rời khỏi nhóm chat này theo quyết định của admin.",
                            threadToLeave.id
                        );
                        await api.removeUserFromGroup(api.getCurrentUserID(), threadToLeave.id);
                        inboxThreads.splice(index, 1);
                        saveInboxThreads(inboxThreads);
                    } catch (error) {
                        console.error("Leave group error:", error);
                        api.sendMessage("❌ Không thể rời khỏi nhóm. Bot cần quyền quản trị viên!", event.threadID);
                    }
                } else {
                    api.sendMessage("Số thứ tự không hợp lệ!", event.threadID);
                }
                return;
            }

            let inboxGroups = [];
            try {
                const inbox = await api.getThreadList(100, null, ['INBOX']);
                inboxGroups = [...inbox].filter(group => group.isSubscribed && group.isGroup);
            } catch (error) {
                console.error("Get thread list error:", error);
                return api.editMessage("❌ Không thể lấy danh sách nhóm chat.", hs.messageID, event.threadID);
            }

            var inboxThreadData = [];
            for (var groupInfo of inboxGroups) {
                try {
                    const threadInfo = await api.getThreadInfo(groupInfo.threadID);
                    if (threadInfo) {
                        inboxThreadData.push({
                            id: groupInfo.threadID,
                            name: threadInfo.threadName || groupInfo.name || `Nhóm ${groupInfo.threadID}`,
                            memberCount: threadInfo.participantIDs?.length || 0
                        });
                    } else {
                  
                        inboxThreadData.push({
                            id: groupInfo.threadID,
                            name: groupInfo.name || `Nhóm ${groupInfo.threadID}`,
                            memberCount: 0
                        });
                    }
                } catch (error) {
                    console.error(`Thread info error for ${groupInfo.threadID}:`, error);
            
                    inboxThreadData.push({
                        id: groupInfo.threadID,
                        name: groupInfo.name || `Nhóm ${groupInfo.threadID}`,
                        memberCount: 0
                    });
                }
            }

            var sortedInboxThreads = inboxThreadData.sort((a, b) => b.memberCount - a.memberCount);

            let msg = '', i = 1;
            for (var group of sortedInboxThreads) {
                msg += `\n━━━━━━━━━━━━━━━━━━\n` +
                       `${i++}. ${group.name}\n` +
                       `TID: ${group.id}\n` +
                       `Thành viên: ${group.memberCount || 'N/A'}\n` +
                       `━━━━━━━━━━━━━━━━━━\n\n`;
            }

            if (msg) {
                await api.editMessage(
                    `📒 𝗤𝘂𝗮̉𝗻 𝗹𝘆 𝗴𝗿𝗼𝘂𝗽 𝗰𝗵𝗮𝘁\n` +
                    `━━━━━━━━━━━━━━━━━━\n${msg}\n` +
                    `Sử dụng: ${adminConfig.prefix}box out <số thứ tự> để rời nhóm`,
                    hs.messageID,
                    event.threadID
                );
                saveInboxThreads(sortedInboxThreads);
            } else {
                await api.editMessage("❌ Không tìm thấy nhóm chat nào.", hs.messageID, event.threadID);
            }

        } catch (error) {
            console.error("Box command error:", error);
            await api.sendMessage("❌ Đã xảy ra lỗi khi quản lý nhóm chat.", event.threadID);
        }
    }
};