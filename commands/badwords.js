const fs = require('fs');
const path = require('path');
let badWordsActive = {}, bannedWords = {}, warnings = {};
const saveFile = path.join(__dirname,  'badwordsActive.json');

if (fs.existsSync(saveFile)) {
  const words = JSON.parse(fs.readFileSync(saveFile, "utf8"));
  badWordsActive = words;
}

const saveWarnings = path.join(__dirname,   'warnings.json');

if (fs.existsSync(saveWarnings)) {
  const warningsData = JSON.parse(fs.readFileSync(saveWarnings, "utf8"));
  warnings = warningsData;
}

const saveWarningsCount = path.join(__dirname, 'warningsCount.json');
let warningsCount = {};
if (fs.existsSync(saveWarningsCount)) {
  const warningsCountData = JSON.parse(fs.readFileSync(saveWarningsCount, "utf8"));
  warningsCount = warningsCountData;
}

const loadBannedWords = threadID => {
  const wordFile = path.join(__dirname, `./database/${threadID}.json`);
  if (fs.existsSync(wordFile)) {
    const words = JSON.parse(fs.readFileSync(wordFile, "utf8"));
    bannedWords[threadID] = words;
  } else {
    bannedWords[threadID] = [];
  }
}

const CONFIG = {
    MAX_WARNINGS: 3,
    WARNING_EXPIRE_HOURS: 24,
    PARTIAL_MATCH: true
};

function checkWarningExpiration() {
    const now = Date.now();
    if (!warnings.timestamps) warnings.timestamps = {};
    
    for (const userID in warnings.timestamps) {
        if (now - warnings.timestamps[userID] > CONFIG.WARNING_EXPIRE_HOURS * 3600000) {
            delete warningsCount[userID];
            delete warnings.timestamps[userID];
        }
    }
    fs.writeFileSync(saveWarnings, JSON.stringify(warnings), "utf8");
    fs.writeFileSync(saveWarningsCount, JSON.stringify(warningsCount), "utf8");
}

function containsBadWord(message, threadID) {
    if (!bannedWords[threadID]) return false;
    message = message.toLowerCase();
    return bannedWords[threadID].some(word => {
        if (word.startsWith('/') && word.endsWith('/')) {
      
            try {
                const regex = new RegExp(word.slice(1, -1), 'i');
                return regex.test(message);
            } catch (e) {
                return false;
            }
        }
        return CONFIG.PARTIAL_MATCH ? 
            message.includes(word.toLowerCase()) : 
            message.split(/\s+/).includes(word.toLowerCase());
    });
}

module.exports = {
    name: "badwords", 
    usedby: 1,
    info: "Quản lý danh sách từ bị cấm",
    onPrefix: true,
    dev: "HNT",
    usages: [
        "/badwords add [từ] - Thêm từ vào danh sách cấm",
        "/badwords remove [từ] - Xóa từ khỏi danh sách cấm",
        "/badwords list - Hiển thị danh sách từ cấm",
        "/badwords on - Bật tính năng cấm từ",
        "/badwords off - Tắt tính năng cấm từ",
        "/badwords clearwarnings - Bỏ cảnh cáo cho tất cả thành viên"
    ],
    cooldowns: 6,
    
    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, mentions, senderID } = event;
        checkWarningExpiration();
        if (!target[0]) return api.sendMessage("📪 | Vui lòng chỉ định một hành động (thêm, xóa, danh sách, bật, tắt hoặc bỏ cảnh cáo)", threadID, messageID);

        const isAdmin = (await api.getThreadInfo(threadID)).adminIDs.some(
            idInfo => idInfo.id === api.getCurrentUserID()
        );
        if (!isAdmin) {
            return api.sendMessage("⚠️ Bot cần quyền quản trị viên để thực hiện lệnh này!", threadID);
        }

        const action = target[0];
        const word = target.slice(1).join(' ');
        loadBannedWords(threadID);
        const threadInfo = await api.getThreadInfo(event.threadID);
        const userIsAdmin = threadInfo.adminIDs.some(idInfo => idInfo.id === event.senderID);

        if (!userIsAdmin) {
            return api.sendMessage("Bạn không phải là quản trị viên của nhóm này, bạn không thể sử dụng lệnh này.", event.threadID);
        }
        if (action === 'add') {
            if (!word) return api.sendMessage("❌ | Vui lòng nhập từ cần cấm.", threadID);
            const words = word.split(',').map(w => w.trim().toLowerCase());
            bannedWords[threadID] = [...new Set([...bannedWords[threadID], ...words])];
            fs.writeFileSync(path.join(__dirname, `./database/${threadID}.json`), JSON.stringify(bannedWords[threadID]), "utf8");
            return api.sendMessage(`✅ | Đã thêm ${words.length} từ vào danh sách cấm.`, threadID);
        } else if (action === 'remove') {
            const index = bannedWords[threadID].indexOf(word.toLowerCase());
            if (index !== -1) {
                bannedWords[threadID].splice(index, 1);
                fs.writeFileSync(path.join(__dirname, `./database/${threadID}.json`), JSON.stringify(bannedWords[threadID]), "utf8");
                return api.sendMessage(`✅ | Từ ${word} đã được xóa khỏi danh sách từ bị cấm.`, threadID);
            } else {
                return api.sendMessage(`❌ | Từ ${word} không tìm thấy.`, threadID);
            }
        } else if (action === 'list') {
            return api.sendMessage(`📝 | Danh sách từ bị cấm: \n${bannedWords[threadID].join(', ')}.`, threadID);
        } else if (action === 'on') {
            badWordsActive[threadID] = true;
            fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
            return api.sendMessage(`✅ | Lọc từ bị cấm đã được kích hoạt.`, threadID);
        } else if (action === 'off') {
            badWordsActive[threadID] = false;
            fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
            return api.sendMessage(`✅ | Lọc từ bị cấm đã được tắt.`, threadID);
        } else if (action === 'unwarn') {
            let userIdsToUnwarn = [];
            if (target[1]) userIdsToUnwarn.push(target[1]);
            else if (mentions && Object.keys(mentions).length > 0) userIdsToUnwarn = userIdsToUnwarn.concat(Object.keys(mentions));
            var id = Object.keys(event.mentions)[1] || event.senderID;
            for (const userID of userIdsToUnwarn) {
                warningsCount[userID] = 0;
                fs.writeFileSync(saveWarningsCount, JSON.stringify(warningsCount), "utf8");
                api.sendMessage(`✅ | Cảnh cáo cho ${id} đã được đặt lại!`, threadID);
            }
            return;
        } else {
            return api.sendMessage("📪 | Lệnh không hợp lệ. Vui lòng sử dụng 'add', 'remove', 'list', 'on', 'off' hoặc 'unwarn'.", threadID);
        }
    },

    onChat: async function({ event, api }) {
        const { threadID, messageID, senderID, body } = event;
        if (!badWordsActive[threadID] || !body) return;

        loadBannedWords(threadID);
        if (containsBadWord(body, threadID)) {
            if (!warningsCount[senderID]) warningsCount[senderID] = 0;
            warningsCount[senderID]++;
            warnings.timestamps = warnings.timestamps || {};
            warnings.timestamps[senderID] = Date.now();

            fs.writeFileSync(saveWarningsCount, JSON.stringify(warningsCount), "utf8");
            fs.writeFileSync(saveWarnings, JSON.stringify(warnings), "utf8");

            api.unsendMessage(messageID);

            try {
                const userInfo = await api.getUserInfo(senderID);
                const userName = userInfo[senderID]?.name || senderID;
                const warningMsg = `⚠️ Cảnh báo: Tin nhắn chứa từ cấm!\n` +
                                 `👤 Người dùng: ${userName}\n` +
                                 `🔢 Cảnh báo: ${warningsCount[senderID]}/${CONFIG.MAX_WARNINGS}`;
                api.sendMessage(warningMsg, threadID);
            } catch (error) {
                const warningMsg = `⚠️ Cảnh báo: Tin nhắn chứa từ cấm!\n` +
                                 `👤 Người dùng: ${senderID}\n` +
                                 `🔢 Cảnh báo: ${warningsCount[senderID]}/${CONFIG.MAX_WARNINGS}`;
                api.sendMessage(warningMsg, threadID);
            }

            if (warningsCount[senderID] >= CONFIG.MAX_WARNINGS) {
                api.removeUserFromGroup(senderID, threadID);
                api.sendMessage(`🚫 | Người dùng đã bị kick do vượt quá số lần cảnh báo.`, threadID);
                warningsCount[senderID] = 0;
            }
        }
    }
};
