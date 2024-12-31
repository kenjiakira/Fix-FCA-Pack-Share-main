const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antiname",
    dev: "HNT",
    cooldowns: 5,
    usedBy: 1,
    info: "Bật/tắt chống đổi tên nhóm",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antinamePath = path.join(__dirname, 'json', 'antiname.json');
        if (!fs.existsSync(antinamePath)) {
            fs.writeFileSync(antinamePath, JSON.stringify({}));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antinamePath = path.join(__dirname, 'json', 'antiname.json');
        let antinameData = JSON.parse(fs.readFileSync(antinamePath));
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
            
            antinameData[threadID] = {
                enable: isEnable,
                name: threadInfo.threadName,
                lastUpdate: Date.now() 
            };

            fs.writeFileSync(antinamePath, JSON.stringify(antinameData, null, 4));
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng chống đổi tên nhóm!`,
                threadID
            );
        } catch (error) {
            console.error('Anti-name Error:', error);
            return api.sendMessage("❌ Có lỗi xảy ra khi thực hiện lệnh!", threadID);
        }
    }
};
