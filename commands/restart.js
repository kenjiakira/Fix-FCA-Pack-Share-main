const fs = require('fs');
const { nickName } = require('./chatbot');

module.exports = {
    name: "restart",
    usedby: 2,
    category: "Admin Commands",
    info: "Khởi động lại bot",
    onPrefix: false,
    nickName: ["reboot", "rs"],
    cooldowns: 20,

    onLaunch: async function ({ api, event }) {
        const threadID = event.threadID;
        console.log(`Khởi động lại lệnh từ thread ${threadID}`);

        const data = {
            threadID: threadID
        };

        fs.writeFile('./database/threadID.json', JSON.stringify(data), (err) => {
            if (err) {
                console.error("Lưu threadID thất bại:", err);
                return;
            }
            console.log("ThreadID đã được lưu vào threadID.json");
        });

        api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID, (err) => {
            if (err) {
                console.error("Gửi tin nhắn khởi động lại thất bại:", err);
            } else {
                process.exit(1);
            }
        });
    }
};
