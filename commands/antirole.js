const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antirole",
    dev: "HNT",
    cooldowns: 5,
    usedby: 1,
    info: "Bật/tắt chống thay đổi quyền quản trị",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antirolePath = path.join(__dirname, 'json', 'antirole.json');
        if (!fs.existsSync(antirolePath)) {
            fs.writeFileSync(antirolePath, JSON.stringify({
                threads: {}
            }));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antirolePath = path.join(__dirname, 'json', 'antirole.json');
        let antiroleData = JSON.parse(fs.readFileSync(antirolePath));
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
            
            if (!antiroleData.threads) antiroleData.threads = {};
            antiroleData.threads[threadID] = isEnable;
            
            fs.writeFileSync(antirolePath, JSON.stringify(antiroleData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chống thay đổi quyền quản trị!\n` +
                `${isEnable ? "⚠️ Chỉ admin bot mới có thể thay đổi quyền quản trị." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antirole error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống thay đổi quyền.", threadID);
        }
    }
};
