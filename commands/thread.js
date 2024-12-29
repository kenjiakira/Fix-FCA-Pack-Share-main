const fs = require('fs');
const path = require('path');
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));
const THREADS_FILE = path.resolve(__dirname, 'cache', 'threads.json');

function savePendingThreads(pending) {
    fs.writeFileSync(THREADS_FILE, JSON.stringify(pending, null, 2));
}

function loadPendingThreads() {
    if (fs.existsSync(THREADS_FILE)) {
        const data = fs.readFileSync(THREADS_FILE);
        return JSON.parse(data);
    }
    return [];
}

module.exports = {
    name: "thread",
    usedby: 2,
    info: "Quản lý phê duyệt nhóm",
    onPrefix: true,
    dev: "Jonell Magallanes",
    cooldowns: 1,

    onReply: async function ({ reply, api, event }) {
        const { threadID, body } = event;
        const pending = loadPendingThreads();
        const index = parseInt(reply.split(" ")[0]) - 1;

        if (isNaN(index) || index < 0 || index >= pending.length) {
            return api.sendMessage("Số thứ tự không hợp lệ. Vui lòng trả lời bằng một số hợp lệ từ danh sách.", threadID);
        }

        const threadToApprove = pending[index];

        if (body.toLowerCase() === "approve") {
            await api.sendMessage("Nhóm của bạn đã được phê duyệt thành công.", threadToApprove.threadID);
            await api.changeNickname(`${adminConfig.botName} • [ ${adminConfig.prefix} ]`, threadToApprove.threadID, api.getCurrentUserID());
            await api.sendMessage(`⚙️ Nhóm "${threadToApprove.name}" đã được phê duyệt.`, threadID);
        } else if (body.toLowerCase() === "decline") {
            await api.sendMessage("❌ Yêu cầu của bạn đã bị từ chối.", threadToApprove.threadID);
            await api.sendMessage(`⚙️ Nhóm "${threadToApprove.name}" đã bị từ chối.`, threadID);
        } else {
            return api.sendMessage("Phản hồi không hợp lệ. Vui lòng trả lời bằng 'approve' hoặc 'decline'.", threadID);
        }

        pending.splice(index, 1);
        savePendingThreads(pending);
    },

    onLaunch: async function ({ api, event, target }) {
        try {
            const lod = await api.sendMessage("Đang tải...", event.threadID);
            let pending = loadPendingThreads();

            if (target.length > 0) {
                let index = parseInt(target[0], 10) - 1;
                if (!isNaN(index) && index >= 0 && index < pending.length) {
                    const threadToApprove = pending[index];

                    await api.sendMessage("Vui lòng trả lời với 'approve' hoặc 'decline' cho nhóm:\n" + threadToApprove.name, event.threadID);
                    global.client.onReply.push({
                        name: this.name,
                        messageID: lod.messageID,
                        author: event.senderID,
                        index: index
                    });

                } else {
                    await api.sendMessage("Số thứ tự không hợp lệ. Vui lòng trả lời bằng một số hợp lệ từ danh sách.", event.threadID);
                }
            } else {
                pending = await api.getThreadList(100, null, ["PENDING"]) || [];
                savePendingThreads(pending);

                if (pending.length === 0) {
                    await api.editMessage("⚙️ 𝗠𝗮𝗻𝗮𝗴𝗲𝗿 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 \n━━━━━━━━━━━━━━━━━━\nKhông có nhóm đang chờ được phê duyệt và spam được ghi lại trong cơ sở dữ liệu.", lod.messageID, event.threadID);
                } else {
                    let pendingMessage = `⚙️ 𝗠𝗮𝗻𝗮𝗴𝗲𝗿 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 \n━━━━━━━━━━━━━━━━━━\n${pending.map((thread, i) => `${i + 1}. ${thread.name}`).join('\n')}`;
                    await api.editMessage(pendingMessage, lod.messageID, event.threadID);
                }
            }

        } catch (error) {
            console.error("Lỗi quản lý nhóm:", error);
            await api.sendMessage("Đã xảy ra lỗi trong quá trình quản lý nhóm.", event.threadID);
        }
    }
};
