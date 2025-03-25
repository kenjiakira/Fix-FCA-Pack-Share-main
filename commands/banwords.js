const fs = require('fs');
const path = require('path');

const BANWORDS_DIR = path.join(__dirname, '.', 'json');
const BANWORDS_FILE = path.join(BANWORDS_DIR, 'banwords.json');
const WARNINGS_FILE = path.join(BANWORDS_DIR, 'warnings.json');

// Ensure directories exist
if (!fs.existsSync(BANWORDS_DIR)) {
    fs.mkdirSync(BANWORDS_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(BANWORDS_FILE)) {
    fs.writeFileSync(BANWORDS_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(WARNINGS_FILE)) {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}, null, 2));
}

module.exports = {
    name: "banwords",
    dev: "HNT",
    usedby: 5,
    category: "Groups",
    info: "Quản lý từ ngữ cấm trong nhóm",
    onPrefix: true,
    cooldowns: 3,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const cmd = target[0]?.toLowerCase();
        const words = target.slice(1).join(" ");

        try {
            let banwords = JSON.parse(fs.readFileSync(BANWORDS_FILE));
            
            if (!banwords[threadID]) {
                banwords[threadID] = [];
            }

            switch(cmd) {
                case "add": {
                    if (!words) {
                        return api.sendMessage("⚠️ Vui lòng nhập từ cần cấm!", threadID, messageID);
                    }

                    const newWords = words.split(",").map(w => w.trim().toLowerCase());
                    const addedWords = newWords.filter(w => !banwords[threadID].includes(w));
                    
                    if (addedWords.length > 0) {
                        banwords[threadID].push(...addedWords);
                        fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                        return api.sendMessage(
                            `✅ Đã thêm ${addedWords.length} từ cấm:\n${addedWords.join(", ")}`,
                            threadID, messageID
                        );
                    } else {
                        return api.sendMessage("⚠️ Những từ này đã có trong danh sách cấm!", threadID, messageID);
                    }
                }

                case "remove": {
                    if (!words) {
                        return api.sendMessage("⚠️ Vui lòng nhập từ cần gỡ!", threadID, messageID);
                    }

                    const removeWords = words.split(",").map(w => w.trim().toLowerCase());
                    const removed = removeWords.filter(w => banwords[threadID].includes(w));
                    
                    if (removed.length > 0) {
                        banwords[threadID] = banwords[threadID].filter(w => !removed.includes(w));
                        fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                        return api.sendMessage(
                            `✅ Đã gỡ ${removed.length} từ cấm:\n${removed.join(", ")}`,
                            threadID, messageID
                        );
                    } else {
                        return api.sendMessage("⚠️ Không tìm thấy từ cần gỡ!", threadID, messageID);
                    }
                }

                case "list": {
                    const threadBanwords = banwords[threadID];
                    if (!threadBanwords || threadBanwords.length === 0) {
                        return api.sendMessage("📝 Chưa có từ cấm nào trong nhóm!", threadID, messageID);
                    }
                    return api.sendMessage(
                        `📝 Danh sách từ cấm (${threadBanwords.length}):\n${threadBanwords.join(", ")}`,
                        threadID, messageID
                    );
                }

                case "reset": {
                    banwords[threadID] = [];
                    let warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE));
                    delete warnings[threadID];
                    
                    fs.writeFileSync(BANWORDS_FILE, JSON.stringify(banwords, null, 2));
                    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
                    
                    return api.sendMessage("✅ Đã xóa tất cả từ cấm và cảnh báo trong nhóm!", threadID, messageID);
                }

                default: {
                    return api.sendMessage(
                        "🚫 QUẢN LÝ TỪ CẤM 🚫\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1. Thêm từ cấm:\n" +
                        "   .banwords add [từ1, từ2,...]\n\n" +
                        "2. Xóa từ cấm:\n" +
                        "   .banwords remove [từ1, từ2,...]\n\n" +
                        "3. Xem danh sách:\n" +
                        "   .banwords list\n\n" +
                        "4. Xóa tất cả:\n" +
                        "   .banwords reset\n\n" +
                        "⚠️ Người dùng sẽ bị:\n" +
                        "- Cảnh báo lần 1: Nhắc nhở\n" +
                        "- Cảnh báo lần 2: Cảnh báo cuối\n" +
                        "- Cảnh báo lần 3: Tự động kick",
                        threadID, messageID
                    );
                }
            }
        } catch (error) {
            console.error("Banwords error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    noPrefix: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        if (!body) return;

        try {
            const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
            const isAdmin = adminConfig.adminUIDs.includes(senderID) || 
                          (adminConfig.moderatorUIDs && adminConfig.moderatorUIDs.includes(senderID));
            
            if (isAdmin) return;

            const banwords = JSON.parse(fs.readFileSync(BANWORDS_FILE));
            const threadBanwords = banwords[threadID] || [];
            
            if (threadBanwords.length === 0) return;

            const containsBannedWord = threadBanwords.some(word => 
                body.toLowerCase().includes(word.toLowerCase())
            );

            if (containsBannedWord) {
                let warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE));
                
                if (!warnings[threadID]) {
                    warnings[threadID] = {};
                }
                if (!warnings[threadID][senderID]) {
                    warnings[threadID][senderID] = 0;
                }

                warnings[threadID][senderID]++;
                const warningCount = warnings[threadID][senderID];

                fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));

                if (warningCount >= 3) {
           
                    warnings[threadID][senderID] = 0;
                    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));

                    await api.removeUserFromGroup(senderID, threadID);
                    return api.sendMessage(
                        `🚫 Người dùng đã bị kick vì vi phạm 3 lần sử dụng từ cấm!`,
                        threadID
                    );
                }

                return api.sendMessage(
                    `⚠️ Cảnh báo ${warningCount}/3:\n` +
                    `Tin nhắn của bạn chứa từ cấm!\n` +
                    `${warningCount === 2 ? "❗ Đây là cảnh báo cuối cùng!" : ""}`,
                    threadID
                );
            }
        } catch (error) {
            console.error("Banwords check error:", error);
        }
    }
};
