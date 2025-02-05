const fs = require('fs');
const path = require('path');

module.exports = {
    name: "adminonly",
    dev: "HNT",
    info: "Bật/tắt chế độ chỉ admin nhóm mới được sử dụng bot",
    usedby: 1,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "/adminonly on - Bật chế độ chỉ admin",
        "/adminonly off - Tắt chế độ chỉ admin",
        "/adminonly status - Kiểm tra trạng thái hiện tại"
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

            let data;
            if (!fs.existsSync(jsonPath)) {
                fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
                data = defaultData;
            } else {
                data = JSON.parse(fs.readFileSync(jsonPath));
                if (!data.threads) {
                    data.threads = {};
                    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));
                }
            }
        } catch (error) {
            console.error("Error in adminonly onLoad:", error);
            fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const jsonPath = path.join(__dirname, 'json', 'adminonly.json');
        
        try {
            let data;
            try {
                data = JSON.parse(fs.readFileSync(jsonPath));
                if (!data.threads) {
                    data.threads = {};
                }
            } catch (error) {
                data = {
                    threads: {},
                    enable: true
                };
            }

            const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8"));
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            const isGroupAdmin = threadsDB[threadID]?.adminIDs?.some(admin => 
                admin.id === senderID || admin === senderID
            );

            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            const action = target[0]?.toLowerCase();

            if (!action || !["on", "off"].includes(action)) {
                const currentStatus = data.threads[threadID] || false;
                return api.sendMessage(
                    `👥 Chế độ chỉ Admin nhóm\n` +
                    `╭─────────────╮\n` +
                    `Trạng thái: ${currentStatus ? "ON ✅" : "OFF ❌"}\n` +
                    `╰─────────────╯\n\n` +
                    `Hướng dẫn sử dụng:\n` +
                    `👉 adminonly on: Bật\n` +
                    `👉 adminonly off: Tắt`, 
                    threadID
                );
            }

            const isEnable = action === "on";
            if (!data.threads) data.threads = {};
            data.threads[threadID] = isEnable;
            
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4));

            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chỉ Admin nhóm\n` +
                `⚡ Hiện tại ${isEnable ? "chỉ Quản trị viên" : "tất cả thành viên"} mới có thể sử dụng bot`,
                threadID
            );

        } catch (error) {
            console.error("Error in adminonly command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
