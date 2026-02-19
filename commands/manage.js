const fs = require('fs');
const path = require('path');

const WARNS_FILE = path.join(__dirname, '../database/json/warns.json');
const BANNED_FILE = path.join(__dirname, '../database/json/banned.json');
const AUTOSEEN_FILE = path.join(__dirname, '../database/json/autoseen.json');

for (const file of [WARNS_FILE, BANNED_FILE, AUTOSEEN_FILE]) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}, null, 2));
    }
}

module.exports = {
    name: "manage",
    category: "Admin Commands",
    info: "Quản lý cảnh báo, thông báo và auto-seen",
    onPrefix: true,
    dev: "HNT",
    usedby: 4,
    usages: `Cách dùng:
1. Cảnh báo:
   manage warn [add/remove/ban/unban/check] [@tag/reply/ID] [lý do]

2. Gửi thông báo:
   manage noti [nội dung] - Gửi thông báo ngay lập tức (Admin)

3. Auto-seen:
   manage autoseen [on/off] - Bật/tắt tự động seen tin nhắn`,

    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID, messageReply, mentions } = event;
        const subcmd = target[0]?.toLowerCase();
        const args = target.slice(1);

        try {
            switch (subcmd) {
                case "warn": {
                    const cmd = args[0]?.toLowerCase();
                    let warns = JSON.parse(fs.readFileSync(WARNS_FILE));
                    let banned = JSON.parse(fs.readFileSync(BANNED_FILE));
                    let userID;
                    let reason = args.slice(2).join(" ");

                    if (messageReply) {
                        userID = messageReply.senderID;
                    } else if (Object.keys(mentions).length > 0) {
                        userID = Object.keys(mentions)[0];
                        reason = reason.replace(mentions[userID], "").trim();
                    } else if (args[1] && !isNaN(args[1])) {
                        userID = args[1];
                        reason = args.slice(2).join(" ");
                    }

                    if (!cmd || !userID) {
                        return api.sendMessage(
                            "Cách dùng:\n" +
                            "1. Cảnh báo: manage warn add [@tag/reply/ID] [lý do]\n" +
                            "2. Gỡ cảnh báo: manage warn remove [@tag/reply/ID]\n" +
                            "3. Cấm sử dụng bot: manage warn ban [@tag/reply/ID] [lý do]\n" +
                            "4. Gỡ cấm: manage warn unban [@tag/reply/ID]\n" +
                            "5. Xem cảnh báo: manage warn check [@tag/reply/ID]",
                            threadID, messageID
                        );
                    }

                    switch (cmd) {
                        case "add": {
                            if (!warns[userID]) warns[userID] = [];
                            warns[userID].push({
                                reason: reason || "Không có lý do",
                                time: Date.now(),
                                threadID: threadID
                            });

                            fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));

                            if (warns[userID].length >= 3) {
                                banned[userID] = {
                                    reason: "Đủ 3 lần cảnh báo",
                                    time: Date.now()
                                };
                                fs.writeFileSync(BANNED_FILE, JSON.stringify(banned, null, 2));
                                return api.sendMessage(
                                    `⚠️ Người dùng đã bị cảnh báo 3 lần và bị cấm sử dụng bot\n` +
                                    `- Lần cuối: ${reason || "Không có lý do"}`,
                                    threadID, messageID
                                );
                            }

                            return api.sendMessage(
                                `⚠️ Đã cảnh báo người dùng (${warns[userID].length}/3)\n` +
                                `- Lý do: ${reason || "Không có lý do"}`,
                                threadID, messageID
                            );
                        }

                        case "remove": {
                            if (!warns[userID] || warns[userID].length === 0) {
                                return api.sendMessage("⚠️ Người dùng không có cảnh báo nào!", threadID, messageID);
                            }
                            warns[userID] = [];
                            fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));
                            return api.sendMessage("✅ Đã xóa tất cả cảnh báo của người dùng!", threadID, messageID);
                        }

                        case "ban": {
                            banned[userID] = {
                                reason: reason || "Không có lý do",
                                time: Date.now()
                            };
                            fs.writeFileSync(BANNED_FILE, JSON.stringify(banned, null, 2));
                            return api.sendMessage(
                                `🚫 Đã cấm người dùng sử dụng bot\n` +
                                `- Lý do: ${reason || "Không có lý do"}`,
                                threadID, messageID
                            );
                        }

                        case "unban": {
                            if (!banned[userID]) {
                                return api.sendMessage("⚠️ Người dùng không bị cấm!", threadID, messageID);
                            }
                            delete banned[userID];
                            fs.writeFileSync(BANNED_FILE, JSON.stringify(banned, null, 2));
                            return api.sendMessage("✅ Đã gỡ cấm người dùng!", threadID, messageID);
                        }

                        case "check": {
                            const userWarns = warns[userID] || [];
                            const userBan = banned[userID];
                            let msg = `📋 Thông tin cảnh báo:\n`;
                            msg += `- Số cảnh báo: ${userWarns.length}/3\n`;
                            if (userWarns.length > 0) {
                                msg += `- Cảnh báo gần nhất: ${userWarns[userWarns.length - 1].reason}\n`;
                            }
                            msg += `- Trạng thái: ${userBan ? "🚫 Đã bị cấm" : "✅ Không bị cấm"}\n`;
                            if (userBan) {
                                msg += `- Lý do cấm: ${userBan.reason}`;
                            }
                            return api.sendMessage(msg, threadID, messageID);
                        }
                    }
                    break;
                }

                case "noti": {

                    const content = args.join(" ");
                    if (!content) {
                        return api.sendMessage("⚠️ Vui lòng nhập nội dung thông báo!", threadID, messageID);
                    }

                    const threads = await api.getThreadList(100, null, ["INBOX"]);
                    const groupThreads = threads.filter(thread => thread.isGroup).map(thread => thread.threadID);

                    for (const groupID of groupThreads) {
                        await api.sendMessage(content, groupID);
                    }

                    return api.sendMessage("✅ Đã gửi thông báo đến tất cả các nhóm!", threadID, messageID);
                }

                case "autoseen": {
                    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
                        return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID, messageID);
                    }

                    const isEnable = args[0].toLowerCase() === "on";
                    const autoseenData = { enable: isEnable, lastUpdate: Date.now() };

                    fs.writeFileSync(AUTOSEEN_FILE, JSON.stringify(autoseenData, null, 2));

                    if (isEnable) {
                        await api.markAsReadAll();
                    }

                    return api.sendMessage(
                        `✅ Đã ${isEnable ? "bật" : "tắt"} chức năng tự động seen tin nhắn!`,
                        threadID, messageID
                    );
                }

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error("Manage Error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
