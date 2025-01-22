const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antitag",
    dev: "HNT",
    cooldowns: 5,
    usedby: 1,
    info: "Bật/tắt chống tag spam (3 lần/24h)",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antitagPath = path.join(__dirname, 'json', 'antitag.json');
        if (!fs.existsSync(antitagPath)) {
            fs.writeFileSync(antitagPath, JSON.stringify({
                threads: {},
                tagData: {}
            }));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antitagPath = path.join(__dirname, 'json', 'antitag.json');
        let antitagData = JSON.parse(fs.readFileSync(antitagPath));
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
            
            if (!antitagData.threads) antitagData.threads = {};
            if (!antitagData.tagData) antitagData.tagData = {};
            
            antitagData.threads[threadID] = isEnable;
            
            fs.writeFileSync(antitagPath, JSON.stringify(antitagData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chống tag spam!\n` +
                `${isEnable ? "⚠️ Tag quá 3 lần trong 24h sẽ bị kick." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antitag error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống tag spam.", threadID);
        }
    }
};
