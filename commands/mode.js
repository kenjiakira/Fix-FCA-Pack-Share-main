const fs = require('fs');
const path = require('path');

module.exports = {
    name: "mode",
    dev: "HNT",
    category: "System",
    info: "Quản lý các chế độ hoạt động của bot",
    usedby: 5,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/mode admin on/off - Bật/tắt chế độ chỉ admin nhóm",
        "/mode maintain on/off - Bật/tắt chế độ bảo trì",
        "/mode status - Xem trạng thái các chế độ"
    ],

    onLoad: function() {
        const jsonPath = path.join(__dirname, 'json', 'adminonly.json');
        const defaultData = {
            threads: {},
            enable: true
        };

        try {
            if (!fs.existsSync(path.dirname(jsonPath))) {
                fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
            }
            if (!fs.existsSync(jsonPath)) {
                fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
            }
        } catch (error) {
            console.error("Error in mode onLoad:", error);
            fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const adminConfigPath = path.join(__dirname, '..', 'admin.json');
        const adminOnlyPath = path.join(__dirname, 'json', 'adminonly.json');

        try {
            let adminConfig = JSON.parse(fs.readFileSync(adminConfigPath));
            let adminOnlyData = JSON.parse(fs.readFileSync(adminOnlyPath));

            const mode = target[0]?.toLowerCase();
            const action = target[1]?.toLowerCase();

            const isAdmin = adminConfig.adminUIDs.includes(senderID);

            if (!mode || mode === "status") {
                return api.sendMessage(
                    `⚙️ TRẠNG THÁI CHẾ ĐỘ BOT\n` +
                    `╭─────────────────╮\n` +
                    `Admin only: ${adminOnlyData.threads[threadID] ? "ON ✅" : "OFF ❌"}\n` +
                    `Maintain: ${adminConfig.mtnMode ? "ON ✅" : "OFF ❌"}\n` +
                    `╰─────────────────╯\n\n` +
                    `Hướng dẫn sử dụng:\n` +
                    `👉 mode admin on/off\n` +
                    `👉 mode maintain on/off`, 
                    threadID
                );
            }

            if (!["admin", "maintain"].includes(mode) || !["on", "off"].includes(action)) {
                return api.sendMessage("❌ Cú pháp không hợp lệ!\n/mode [admin|maintain] [on|off]", threadID);
            }

            const isEnable = action === "on";

            if (mode === "maintain" && !isAdmin) {
                return api.sendMessage("❌ Chỉ ADMIN mới có thể bật/tắt chế độ bảo trì!", threadID);
            }

            if (mode === "admin") {
                if (!adminOnlyData.threads) adminOnlyData.threads = {};
                adminOnlyData.threads[threadID] = isEnable;
                fs.writeFileSync(adminOnlyPath, JSON.stringify(adminOnlyData, null, 4));
                return api.sendMessage(
                    `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chỉ Admin nhóm\n` +
                    `⚡ Hiện tại ${isEnable ? "chỉ Quản trị viên" : "tất cả thành viên"} mới có thể sử dụng bot`,
                    threadID
                );
            } else {
                adminConfig.mtnMode = isEnable;
                fs.writeFileSync(adminConfigPath, JSON.stringify(adminConfig, null, 2));
                return api.sendMessage(
                    `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ bảo trì\n` +
                    `⚡ Hiện tại ${isEnable ? "chỉ Admin và Moderator" : "tất cả người dùng"} có thể sử dụng bot`,
                    threadID
                );
            }

        } catch (error) {
            console.error("Error in mode command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
