const fs = require('fs');

module.exports = {
    name: "shutdown",
    usedby: 2,
    dev:"HNT",
    info: "Tắt bot",
    onPrefix: false,
    nickName: ["off", "turnoff"],
    cooldowns: 20,

    onLaunch: async function ({ api, event }) {
        const threadID = event.threadID;
        const confirmationMessage = `❓ Xác nhận tắt bot\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận tắt bot hoặc phản hồi (👎) để hủy bỏ.`;

        console.log(`Yêu cầu tắt bot từ thread ${threadID}`);

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
            await api.sendMessage("📴 Đang tắt bot\n━━━━━━━━━━━━━━━━━━\nBot sẽ tắt trong giây lát...", threadID);
            console.log("Bot đang được tắt theo yêu cầu...");
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        } else if (reaction === '👎') {
            api.sendMessage("❌ Tắt bot đã bị hủy", threadID);
        }
    }
};
