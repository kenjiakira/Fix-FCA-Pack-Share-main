const fs = require('fs');
const path = require('path');

module.exports = {
    name: "anticolor",
    dev: "HNT",
    cooldowns: 5,
    usedBy: 1,
    info: "Bật/tắt chống đổi màu chat",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const anticolorPath = path.join(__dirname, 'json', 'anticolor.json');
        if (!fs.existsSync(anticolorPath)) {
            fs.writeFileSync(anticolorPath, JSON.stringify({}));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const anticolorPath = path.join(__dirname, 'json', 'anticolor.json');
        let anticolorData = JSON.parse(fs.readFileSync(anticolorPath));
        const { threadID, senderID } = event;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (!threadInfo.adminIDs.some(e => e.id == senderID)) {
                return api.sendMessage("⚠️ Chỉ quản trị viên mới có thể sử dụng lệnh này!", threadID);
            }

            if (!target[0] || !["on", "off"].includes(target[0].toLowerCase())) {
                return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID);
            }

            const isEnable = target[0].toLowerCase() === "on";
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            anticolorData[threadID] = {
                enable: isEnable,
                colors: [
                    threadInfo.color || null,
                    "196241301102133", 
                    "2136751179887052",
                    "369664540570586"  
                ],
                currentColorIndex: 0,
                lastUpdate: Date.now()
            };

            fs.writeFileSync(anticolorPath, JSON.stringify(anticolorData, null, 4));
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng chống đổi màu chat!`,
                threadID
            );
        } catch (error) {
            console.error('Anti-color Error:', error);
            return api.sendMessage("❌ Có lỗi xảy ra khi thực hiện lệnh!", threadID);
        }
    }
};
