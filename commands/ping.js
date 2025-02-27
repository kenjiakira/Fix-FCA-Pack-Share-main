const { exec } = require('child_process');
const util = require('util');
module.exports = {
    name: "ping",
    usedby: 0,
    info: "Kiểm tra độ trễ phản hồi của bot",
    dev: "HNT",
    onPrefix: false,
    dmUser: false,
    nickName: ["ping", "p"],
    usages: "ping",
    cooldowns: 10,

    onLaunch: async function ({ event, actions }) {
        const startTime = Date.now();
        
        try {
            const latencyStart = Date.now();
            const msg = await actions.reply("Pong! 🏓");
            const messageLatency = Date.now() - latencyStart;
            const processingTime = Date.now() - startTime;
            const uptime = process.uptime();
            
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const response = `Pong! 🏓\n\n` +
                           `⌛ Độ trễ xử lý: ${processingTime}ms\n` +
                           `📝 Độ trễ tin nhắn: ${messageLatency}ms\n` +
                           `⏰ Thời gian hoạt động: ${hours}h ${minutes}m ${seconds}s`;
            
            await actions.edit(response, msg.messageID);
        } catch (error) {
            actions.reply("❌ Đã xảy ra lỗi khi kiểm tra độ trễ");
        }
    }
};
