const fs = require('fs');
const { nickName } = require('./chatbot');

module.exports = {
    name: "restart",
    usedby: 2,
    category: "Admin Commands",
    info: "Khởi động lại bot",
    onPrefix: false,
    hide: true,
    nickName: ["reboot", "rs"],
    cooldowns: 20,

    onLaunch: async function ({ api, event }) {
        const threadID = event.threadID;
        console.log(`Khởi động lại lệnh từ thread ${threadID}`);

        try {
            const data = {
                threadID: threadID
            };
            fs.writeFileSync('./database/threadID.json', JSON.stringify(data, null, 2));
            console.log("ThreadID đã được lưu vào threadID.json");
        } catch (err) {
            console.error("Lỗi lưu threadID:", err);
        }

        const sendPromise = api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID).catch(err => {
            console.error("Lỗi gửi tin nhắn:", err);
        });

        await Promise.race([
            sendPromise,
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("Khởi động lại bot...");
        setImmediate(() => {
            setTimeout(() => {
                process.exit(1);
            }, 100);
        });
    }
};
