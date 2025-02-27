module.exports = {
    name: "listbox",
    usedby: 4,
    dmUser: true,
    dev: "HNT",
    category: "Admin Commands",
    nickName: ["listbox", "boxes", "nhom"],
    info: "Xem danh sách các nhóm trong hệ thống",
    onPrefix: true,
    cooldowns: 10,

    onLaunch: async function ({ api, event }) {
        const { threadID, messageID } = event;
        
        try {
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

            msg += `\n✨ Tổng cộng: ${groups.length} nhóm\n`;
            msg += `⚠️ Tin nhắn sẽ tự động gỡ sau 60 giây!`;

            const sentMsg = await api.sendMessage(msg, threadID);

            setTimeout(() => {
                api.unsendMessage(sentMsg.messageID);
            }, 60000);

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ Đã có lỗi xảy ra khi lấy danh sách nhóm!", threadID, messageID);
        }
    }
};
