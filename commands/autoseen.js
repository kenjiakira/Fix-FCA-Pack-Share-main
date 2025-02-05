const fs = require('fs');
const path = require('path');

module.exports = {
    name: "autoseen",
    dev: "HNT",
    cooldowns: 5,
    usebBy: 2,
    info: "Bật/tắt tự động seen tin nhắn",
    usages: [
        "/autoseen on - Bật tự động seen tin nhắn",
        "/autoseen off - Tắt tự động seen tin nhắn"
    ],
    onPrefix: true,

    onLoad: function () {
        const autoseenPath = path.join(__dirname, 'json', 'autoseen.json');
        if (!fs.existsSync(autoseenPath)) {
            fs.writeFileSync(autoseenPath, JSON.stringify({
                enable: false,
                lastUpdate: 0
            }));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID } = event;
        const autoseenPath = path.join(__dirname, 'json', 'autoseen.json');

        try {
            if (!target[0] || !["on", "off"].includes(target[0].toLowerCase())) {
                return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID);
            }

            const isEnable = target[0].toLowerCase() === "on";
            const autoseenData = {
                enable: isEnable,
                lastUpdate: Date.now()
            };

            fs.writeFileSync(autoseenPath, JSON.stringify(autoseenData, null, 4));

            if (isEnable) {
           
                await api.markAsReadAll();
            }

            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng tự động seen tin nhắn!`,
                threadID
            );

        } catch (error) {
            console.error('Autoseen Error:', error);
            return api.sendMessage("❌ Có lỗi xảy ra khi thực hiện lệnh!", threadID);
        }
    }
};
