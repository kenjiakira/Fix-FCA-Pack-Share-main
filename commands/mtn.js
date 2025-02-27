const fs = require('fs');
const path = require('path');

module.exports = {
    name: "mtn",
    aliases: ["maintain", "mt"],
    dev: "HNT",
    category: "Admin Commands",
    info: "Bật/tắt chế độ bảo trì bot - chỉ admin và moderator mới sử dụng được bot",
    usedby: 4,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/mtn on - Bật chế độ bảo trì",
        "/mtn off - Tắt chế độ bảo trì", 
        "/mtn status - Xem trạng thái"
    ],

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;
        const adminConfigPath = './admin.json';
        
        try {
            let adminConfig = JSON.parse(fs.readFileSync(adminConfigPath));
            const action = target[0]?.toLowerCase();

            if (!action || !["on", "off", "status"].includes(action)) {
                return api.sendMessage(
                    `🛠️ Chế độ bảo trì Bot\n` +
                    `╭─────────────╮\n` +
                    `Trạng thái: ${adminConfig.mtnMode ? "ON ✅" : "OFF ❌"}\n` +
                    `╰─────────────╯\n\n` +
                    `Hướng dẫn sử dụng:\n` +
                    `👉 mtn on: Bật chế độ bảo trì\n` +
                    `👉 mtn off: Tắt chế độ bảo trì\n` +
                    `👉 mtn status: Xem trạng thái`,
                    threadID
                );
            }

            if (action === "status") {
                return api.sendMessage(
                    `🛠️ Trạng thái bảo trì: ${adminConfig.mtnMode ? "ON ✅" : "OFF ❌"}\n` +
                    `👥 Hiện tại ${adminConfig.mtnMode ? "chỉ Admin và Moderator" : "tất cả người dùng"} có thể sử dụng bot`,
                    threadID
                );
            }

            const isEnable = action === "on";
            adminConfig.mtnMode = isEnable;
            
            fs.writeFileSync(adminConfigPath, JSON.stringify(adminConfig, null, 2));

            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ bảo trì\n` +
                `⚡ Hiện tại ${isEnable ? "chỉ Admin và Moderator" : "tất cả người dùng"} có thể sử dụng bot`,
                threadID
            );

        } catch (error) {
            console.error("Error in mtn command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
