const fs = require('fs');
const path = require('path');

const WARNS_DIR = path.join(__dirname, '.', 'json');
const WARNS_FILE = path.join(WARNS_DIR, 'warns.json');
const BANNED_FILE = path.join(WARNS_DIR, 'banned.json');

if (!fs.existsSync(WARNS_DIR)) {
    fs.mkdirSync(WARNS_DIR, { recursive: true });
}

for (const file of [WARNS_FILE, BANNED_FILE]) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}, null, 2));
    }
}

module.exports = {
    name: "warn",
    dev: "HNT", 
    usedby: 4,
    category: "Admin Commands",
    info: "Cảnh báo và cấm người dùng",
    onPrefix: true,
    cooldowns: 3,
    
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, messageReply, mentions } = event;
        const cmd = target[0]?.toLowerCase();

        try {
            let warns = JSON.parse(fs.readFileSync(WARNS_FILE));
            let banned = JSON.parse(fs.readFileSync(BANNED_FILE));
            
            let userID;
            let reason = target.slice(1).join(" ");

            if (messageReply) {
                userID = messageReply.senderID;
            } else if (Object.keys(mentions).length > 0) {
                userID = Object.keys(mentions)[0];
                reason = reason.replace(mentions[userID], "").trim();
            } else if (target[1] && !isNaN(target[1])) {
                userID = target[1];
                reason = target.slice(2).join(" ");
            }

            if (!cmd || !userID) {
                return api.sendMessage(
                    "Cách dùng:\n" +
                    "1. Cảnh báo: warn add [@tag/reply/ID] [lý do]\n" +
                    "2. Gỡ cảnh báo: warn remove [@tag/reply/ID]\n" +
                    "3. Cấm sử dụng bot: warn ban [@tag/reply/ID] [lý do]\n" +
                    "4. Gỡ cấm: warn unban [@tag/reply/ID]\n" +
                    "5. Xem cảnh báo: warn check [@tag/reply/ID]",
                    threadID, messageID
                );
            }

            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            if (adminConfig.adminUIDs.includes(userID) || 
                (adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.includes(userID))) {
                return api.sendMessage("⚠️ Không thể cảnh báo Admin hoặc Moderator!", threadID, messageID);
            }

            switch(cmd) {
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
                        msg += `- Cảnh báo gần nhất: ${userWarns[userWarns.length-1].reason}\n`;
                    }
                    msg += `- Trạng thái: ${userBan ? "🚫 Đã bị cấm" : "✅ Không bị cấm"}\n`;
                    if (userBan) {
                        msg += `- Lý do cấm: ${userBan.reason}`;
                    }
                    return api.sendMessage(msg, threadID, messageID);
                }
            }

        } catch (error) {
            console.error("Warn command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};
