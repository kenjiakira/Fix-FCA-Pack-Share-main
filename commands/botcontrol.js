const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { createReadStream, unlinkSync } = require('fs');

module.exports = {
    name: "botcontrol",
    dev: "HNT",
    category: "Admin Commands",
    usedby: 2,
    info: "Quản lý bot",
    usages: `Cách dùng:
1. Khởi động lại:
   botcontrol restart

2. Tắt bot:
   botcontrol shutdown

3. Uptime Monitor:
   botcontrol uptime [add/list/del] [url] [-name tên] [-interval giây]

4. Rời nhóm:
   botcontrol out [threadID]

Ví dụ:
- botcontrol restart - Khởi động lại bot
- botcontrol out - Rời nhóm hiện tại
- botcontrol out 123456789 - Rời nhóm với ID cụ thể`,
    onPrefix: true,
    nickName: ["reboot", "off", "uptime"],
    cooldowns: 20,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, type, messageReply } = event;
        
        if (!target[0]) {
            return api.sendMessage(this.usages, threadID, messageID);
        }

        const cmd = target[0].toLowerCase();
        const args = target.slice(1);

        try {
            const saveThreadID = () => {
                const data = { threadID: threadID };
                fs.writeFileSync('./database/threadID.json', JSON.stringify(data));
                console.log("ThreadID đã được lưu vào threadID.json");
            };

            switch(cmd) {
                case "restart":
                case "reboot":
                    console.log(`Khởi động lại bot từ thread ${threadID}`);
                    saveThreadID();
                    await api.sendMessage("🔃 Đang khởi động lại\n━━━━━━━━━━━━━━━━━━\nBot đang khởi động lại...", threadID);
                    process.exit(1);
                    break;

                case "shutdown":
                case "off":
                    console.log(`Yêu cầu tắt bot từ thread ${threadID}`);
                    saveThreadID();
                    const confirmMsg = await api.sendMessage(
                        `❓ Xác nhận tắt bot\n${global.line}\nPhản hồi tin nhắn này (👍) để xác nhận tắt bot hoặc (👎) để hủy bỏ.`,
                        threadID
                    );
                    global.client.callReact.push({ messageID: confirmMsg.messageID, name: this.name });
                    break;

                case "uptime":
                    const API_KEY = "u1829561-e6d78700b0a4b3c3470d2b8b";
                    const BASE_URL = "https://api.uptimerobot.com/v2";
                    const subcmd = args[0]?.toLowerCase();

                    if (!subcmd || subcmd === "help") {
                        return api.sendMessage(
                            "📝 Uptime Monitor:\n\n" +
                            "1. Thêm monitor mới:\n" +
                            "botcontrol uptime add [url] -name [tên] -interval [giây]\n\n" +
                            "2. Xem danh sách monitors:\n" +
                            "botcontrol uptime list\n\n" +
                            "3. Xóa monitor:\n" +
                            "botcontrol uptime del [id]",
                            threadID, messageID
                        );
                    }

                    switch(subcmd) {
                        case "list": {
                            const response = await axios.post(`${BASE_URL}/getMonitors`, {
                                api_key: API_KEY,
                                format: "json"
                            });

                            if (response.data.stat === "ok") {
                                const monitors = response.data.monitors;
                                let msg = "📊 Danh sách Monitors:\n\n";
                                monitors.forEach(m => {
                                    const status = m.status === 2 ? "✅" : m.status === 9 ? "❌" : "⏸️";
                                    msg += `${status} ID: ${m.id}\n📝 Tên: ${m.friendly_name}\n🔗 URL: ${m.url}\n⏱️ Uptime: ${m.all_time_uptime_ratio}%\n\n`;
                                });
                                return api.sendMessage(msg, threadID, messageID);
                            }
                            break;
                        }

                        case "add": {
                            const url = args[1];
                            if (!url) return api.sendMessage("❌ Vui lòng nhập URL cần monitor!", threadID, messageID);

                            const nameIndex = args.indexOf("-name");
                            const intervalIndex = args.indexOf("-interval");
                            
                            const friendly_name = nameIndex > -1 ? args[nameIndex + 1] : url;
                            const interval = intervalIndex > -1 ? parseInt(args[intervalIndex + 1]) : 300;

                            const response = await axios.post(`${BASE_URL}/newMonitor`, {
                                api_key: API_KEY,
                                format: "json",
                                type: 1,
                                url: url,
                                friendly_name: friendly_name,
                                interval: interval
                            });

                            if (response.data.stat === "ok") {
                                return api.sendMessage(
                                    `✅ Đã thêm monitor mới:\n📝 Tên: ${friendly_name}\n🔗 URL: ${url}`,
                                    threadID, messageID
                                );
                            }
                            break;
                        }

                        case "del": {
                            const id = args[1];
                            if (!id) return api.sendMessage("❌ Vui lòng nhập ID monitor cần xóa!", threadID, messageID);

                            const response = await axios.post(`${BASE_URL}/deleteMonitor`, {
                                api_key: API_KEY,
                                format: "json",
                                id: id
                            });

                            if (response.data.stat === "ok") {
                                return api.sendMessage(`✅ Đã xóa monitor có ID: ${id}`, threadID, messageID);
                            }
                            break;
                        }
                    }
                    break;

                case "out": {
                    const targetThreadID = args[0] || threadID;
                    if (isNaN(targetThreadID)) {
                        return api.sendMessage("❌ Vui lòng nhập ID nhóm hợp lệ!", threadID, messageID);
                    }
                    await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadID);
                    return api.sendMessage(`✅ Đã rời nhóm với ID: ${targetThreadID}`, threadID, messageID);
                }

                case "setavt": {
                    const tempPath = path.join(__dirname, "cache", `avatar_${Date.now()}.png`);
                    const loadingMessage = await api.sendMessage("⏳ Đang xử lý hình ảnh...", threadID);

                    try {
                        let imageUrl, caption = "";

                        if (args.length > 0) {
                            if (args[0].match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) {
                                imageUrl = args[0];
                                caption = args.slice(1).join(" ");
                            } else {
                                caption = args.join(" ");
                            }
                        }

                        if (messageReply && messageReply.attachments[0]) {
                            const attachment = messageReply.attachments[0];
                            if (!['photo', 'animated_image'].includes(attachment.type)) {
                                api.unsendMessage(loadingMessage.messageID);
                                return api.sendMessage("❌ Vui lòng chỉ dùng hình ảnh hoặc GIF!", threadID, messageID);
                            }
                            imageUrl = attachment.url;
                        } else if (!imageUrl) {
                            api.unsendMessage(loadingMessage.messageID);
                            return api.sendMessage(
                                "📝 Hướng dẫn sử dụng setavatar:\n\n" +
                                "1. Reply ảnh + botcontrol setavt [caption]\n" +
                                "2. botcontrol setavt [link ảnh] [caption]\n\n" +
                                "💡 Caption là tùy chọn, có thể để trống",
                                threadID, messageID
                            );
                        }

                        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                        const imageBuffer = Buffer.from(response.data);

                        if (imageBuffer.length > 10 * 1024 * 1024) {
                            api.unsendMessage(loadingMessage.messageID);
                            return api.sendMessage("❌ Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB", threadID, messageID);
                        }

                        fs.writeFileSync(tempPath, imageBuffer);

                        api.sendMessage("⌛ Đang cập nhật avatar...", threadID, loadingMessage.messageID);

                        await api.changeAvatar(createReadStream(tempPath), caption);

                        api.unsendMessage(loadingMessage.messageID);
                        api.sendMessage({
                            body: `✅ Đã thay đổi avatar bot thành công!\n${caption ? `📝 Caption: ${caption}` : ""}`,
                            attachment: createReadStream(tempPath)
                        }, threadID, messageID);

                    } catch (error) {
                        console.error('Set Avatar Error:', error);
                        api.unsendMessage(loadingMessage.messageID);
                        api.sendMessage(
                            "❌ Lỗi khi thay đổi avatar bot:\n" +
                            `${error.message || "Vui lòng thử lại sau"}`,
                            threadID, messageID
                        );
                    } finally {
                        if (fs.existsSync(tempPath)) {
                            unlinkSync(tempPath);
                        }
                    }
                    break;
                }

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error("BotControl Error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!", threadID, messageID);
        }
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
