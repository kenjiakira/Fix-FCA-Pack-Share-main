const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antispam",
    dev: "HNT",
    cooldowns: 5,
    info: "Bật/tắt chống spam tin nhắn (5 tin nhắn/5 giây)",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antispamPath = path.join(__dirname, 'json', 'antispam.json');
        if (!fs.existsSync(antispamPath)) {
            fs.writeFileSync(antispamPath, JSON.stringify({
                threads: {},
                spamData: {}
            }));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antispamPath = path.join(__dirname, 'json', 'antispam.json');
        let antispamData = JSON.parse(fs.readFileSync(antispamPath));
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
            
            if (!antispamData.threads) antispamData.threads = {};
            if (!antispamData.spamData) antispamData.spamData = {};
            
            antispamData.threads[threadID] = isEnable;
            
            fs.writeFileSync(antispamPath, JSON.stringify(antispamData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chống spam!\n` +
                `${isEnable ? "⚠️ Spam 5 tin nhắn trong 5 giây sẽ bị kick ngay lập tức." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antispam error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống spam.", threadID);
        }
    }
};
