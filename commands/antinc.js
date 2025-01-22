const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antinc",
    dev: "HNT",
    cooldowns: 5,
    info: "Bật/tắt chống đổi biệt danh",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antinickPath = path.join(__dirname, 'json', 'antinc.json');
        if (!fs.existsSync(antinickPath)) {
            fs.writeFileSync(antinickPath, JSON.stringify({
                threads: {}
            }));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antinickPath = path.join(__dirname, 'json', 'antinc.json');
        let antinickData = JSON.parse(fs.readFileSync(antinickPath));
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
            
            if (!antinickData.threads) antinickData.threads = {};
            antinickData.threads[threadID] = {
                enable: isEnable,
                timestamp: Date.now()
            };
            
            fs.writeFileSync(antinickPath, JSON.stringify(antinickData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chống đổi biệt danh!\n` +
                `${isEnable ? "⚠️ Chỉ admin bot và quản trị viên mới có thể đổi biệt danh." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antinick error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống đổi biệt danh.", threadID);
        }
    }
};
