const fs = require('fs');
const { nickName } = require('./chatbot');
const { startAutoRestart, stopAutoRestart, getAutoRestartInfo } = require('../utils/autoRestart');

module.exports = {
    name: "restart",
    usedby: 2,
    category: "Admin Commands",
    info: "Khởi động lại bot và quản lý auto restart",
    onPrefix: false,
    hide: true,
    nickName: ["reboot", "rs"],
    cooldowns: 20,

    onLaunch: async function ({ api, event, target = [] }) {
        const threadID = event.threadID;
        const messageID = event.messageID;
        const command = target[0]?.toLowerCase() || "restart";

        switch (command) {
            case "auto":
            case "autors":
                const subCommand = target[1]?.toLowerCase() || "status";
                
                switch (subCommand) {
                    case "status":
                    case "info":
                        const info = getAutoRestartInfo();
                        if (info.enabled) {
                            const { hours, minutes, seconds } = info.timeRemaining;
                            const nextRestartTime = info.nextRestart.toLocaleString('vi-VN');
                            return api.sendMessage(
                                `🔄 THÔNG TIN AUTO RESTART\n` +
                                `━━━━━━━━━━━━━━━━━━\n` +
                                `✅ Trạng thái: ĐANG BẬT\n` +
                                `⏰ Chu kỳ: Mỗi 3 giờ 30 phút\n` +
                                `⏳ Thời gian còn lại: ${hours}h ${minutes}m ${seconds}s\n` +
                                `📅 Lần restart tiếp theo: ${nextRestartTime}\n` +
                                `\n💡 Sử dụng:\n` +
                                `.restart auto enable → Bật auto restart\n` +
                                `.restart auto disable → Tắt auto restart`,
                                threadID,
                                messageID
                            );
                        } else {
                            return api.sendMessage(
                                `🔄 THÔNG TIN AUTO RESTART\n` +
                                `━━━━━━━━━━━━━━━━━━\n` +
                                `❌ Trạng thái: ĐANG TẮT\n` +
                                `⏰ Chu kỳ: Mỗi 3 giờ 30 phút\n` +
                                `\n💡 Sử dụng:\n` +
                                `.restart auto enable → Bật auto restart\n` +
                                `.restart auto disable → Tắt auto restart`,
                                threadID,
                                messageID
                            );
                        }
                        break;

                    case "enable":
                    case "on":
                        startAutoRestart(api);
                        return api.sendMessage(
                            `✅ Đã BẬT Auto Restart\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `⏰ Bot sẽ tự động restart mỗi 3 giờ 30 phút\n` +
                            `📅 Lần restart tiếp theo sẽ được tính từ bây giờ`,
                            threadID,
                            messageID
                        );
                        break;

                    case "disable":
                    case "off":
                        const stopped = stopAutoRestart();
                        if (stopped) {
                            return api.sendMessage(
                                `⏸️ Đã TẮT Auto Restart\n` +
                                `━━━━━━━━━━━━━━━━━━\n` +
                                `Bot sẽ không tự động restart nữa`,
                                threadID,
                                messageID
                            );
                        } else {
                            return api.sendMessage(
                                `ℹ️ Auto Restart đã được tắt từ trước`,
                                threadID,
                                messageID
                            );
                        }
                        break;

                    default:
                        return api.sendMessage(
                            `🔄 AUTO RESTART COMMANDS\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `.restart auto status → Xem trạng thái\n` +
                            `.restart auto enable → Bật auto restart\n` +
                            `.restart auto disable → Tắt auto restart`,
                            threadID,
                            messageID
                        );
                }
                break;

            case "restart":
            default:
                // Restart ngay lập tức
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
                break;
        }
    }
};
