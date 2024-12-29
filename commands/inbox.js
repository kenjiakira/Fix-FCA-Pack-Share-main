const fs = require('fs');
const path = require('path');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const THREADS_FILE = path.resolve(__dirname, 'cache', 'inbox_threads.json');

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
    name: "inbox",
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

                    await api.sendMessage("☁️ 𝗕𝗼𝘁 𝗟𝗲𝗳𝘁 𝗚𝗿𝗼𝘂𝗽 𝗖𝗵𝗮𝘁\n━━━━━━━━━━━━━━━━━━\nBot đã rời khỏi nhóm chat này theo quyết định của admin.", threadToLeave.id);
                    await api.removeUserFromGroup(api.getCurrentUserID(), threadToLeave.id);

                    inboxThreads.splice(index, 1);
                    saveInboxThreads(inboxThreads);
                } else {
                    await api.sendMessage("Số thứ tự không hợp lệ. Vui lòng nhập một số hợp lệ từ danh sách.", event.threadID);
                }
            } else {
                var inbox = await api.getThreadList(100, null, ['INBOX']);
                let inboxGroups = [...inbox].filter(group => group.isSubscribed && group.isGroup);

                var inboxThreadData = [];
                for (var groupInfo of inboxGroups) {
                    let threadInfo = await api.getThreadInfo(groupInfo.threadID);
                    inboxThreadData.push({
                        id: groupInfo.threadID,
                        name: groupInfo.name,
                        memberCount: threadInfo.userInfo.length
                    });
                }

                var sortedInboxThreads = inboxThreadData.sort((a, b) => b.memberCount - a.memberCount);

                let msg = '', i = 1;
                var groupIds = [];
                for (var group of sortedInboxThreads) {
                    msg += `\n━━━━━━━━━━━━━━━━━━\n${i++}. ${group.name}\nTID: ${group.id}\nThành viên: ${group.memberCount}\n━━━━━━━━━━━━━━━━━━\n\n`;
                    groupIds.push(group.id);
                }

                await api.editMessage(`📒 𝗤𝘂𝗮̉𝗻 𝗹𝘆 𝗴𝗿𝗼𝘂𝗽 𝗰𝗵𝗮𝘁\n━━━━━━━━━━━━━━━━━━\n${msg}\nVui lòng nhập lệnh ${adminConfig.prefix}inbox out <số thứ tự nhóm chat>`, hs.messageID, event.threadID);
                saveInboxThreads(sortedInboxThreads);
            }

        } catch (error) {
            console.error("Lỗi khi quản lý nhóm chat trong hộp thư:", error);
            await api.sendMessage("Đã xảy ra lỗi khi quản lý nhóm chat trong hộp thư.", event.threadID);
        }
    }
};
