const fs = require('fs');

module.exports = {
    name: "shutdown",
    dev: "HNT",
    category: "Admin Commands",
    usedby: 2,
    info: "Tắt bot",
    onPrefix: true,
    nickName: ["off"],
    cooldowns: 20,

    onLaunch: async function({ api, event }) {
        const { threadID } = event;
        
        console.log(`Yêu cầu tắt bot từ thread ${threadID}`);
        
        const saveThreadID = () => {
            const data = { threadID: threadID };
            fs.writeFileSync('./database/threadID.json', JSON.stringify(data));
            console.log("ThreadID đã được lưu vào threadID.json");
        };

        saveThreadID();
        
        const confirmMsg = await api.sendMessage(
            `❓ Xác nhận tắt bot\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận tắt bot hoặc (👎) để hủy bỏ.`,
            threadID
        );
        
        global.client.callReact.push({ messageID: confirmMsg.messageID, name: this.name });
    },

    callReact: async function({ reaction, event, api }) {
        const { threadID } = event;
        
        if (reaction === '👍') {
            await api.sendMessage("📴 Đang tắt bot\n━━━━━━━━━━━━━━━━━━\nBot sẽ tắt trong giây lát...", threadID);
            console.log("Bot đang được tắt theo yêu cầu...");
            setTimeout(() => process.exit(0), 1000);
        } else if (reaction === '👎') {
            api.sendMessage("❌ Tắt bot đã bị hủy", threadID);
        }
    }
};

