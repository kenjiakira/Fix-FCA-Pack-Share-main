const fs = require('fs');

module.exports = {
    name: "restart",
    usedby: 2,
    info: "Khởi động lại bot",
    onPrefix: true,
    cooldowns: 20,

    onLaunch: async function ({ api, event }) {
        const threadID = event.threadID;
        const confirmationMessage = `❓ Xác nhận khởi động lại\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận khởi động lại bot hoặc phản hồi (👎) để hủy bỏ.`;

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

        const sentMessage = await api.sendMessage(confirmationMessage, threadID);
        global.client.callReact.push({ messageID: sentMessage.messageID, name: this.name });
    },

    callReact: async function ({ reaction, event, api }) {
        const { threadID } = event;

        if (reaction === '👍') {
            api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID, (err) => {
                if (err) {
                    console.error("Gửi tin nhắn khởi động lại thất bại:", err);
                } else {
                    process.exit(1);
                }
            });
        } else if (reaction === '👎') {
            api.sendMessage("❌ Khởi động lại đã bị hủy", threadID);
        }
    }
};
