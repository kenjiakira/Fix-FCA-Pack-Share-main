const fs = require('fs');
const path = require('path');

module.exports = {
        name: "antiout",
        dev: "HNT",
        cooldowns: 5,
        usedBy: 1,
        info: "Bật/tắt chống rời nhóm",
        usages: "on/off",
        onPrefix: true,

    onLoad: function () {
        const antioutPath = path.join(__dirname,'json', 'antiout.json');
        if (!fs.existsSync(antioutPath)) {
            fs.writeFileSync(antioutPath, JSON.stringify({}));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antioutPath = path.join(__dirname,'json', 'antiout.json');
        let antioutData = JSON.parse(fs.readFileSync(antioutPath));
        const { threadID, senderID } = event;

        try {
  
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            
            const threadInfo = await api.getThreadInfo(threadID);
            const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);
            
            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            if (!target[0] || !["on", "off"].includes(target[0].toLowerCase())) {
                return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID);
            }

            const isEnable = target[0].toLowerCase() === "on";
            antioutData[threadID] = isEnable;

            fs.writeFileSync(antioutPath, JSON.stringify(antioutData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng chống rời nhóm!\n${isEnable ? "⚠️ Lưu ý: Tính năng có thể bị hạn chế bởi Facebook." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antiout error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống rời nhóm.", threadID);
        }
    }
};
