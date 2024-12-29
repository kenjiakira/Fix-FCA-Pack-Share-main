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

module.exports = {
    name: "badwords", 
    usedby: 0,
    info: "Quản lý danh sách từ bị cấm",
    onPrefix: true,
    dev: "Jonell Magallanes",
    cooldowns: 6,
    onLaunch: async function ({ event, api, target }) {
        const { threadID, messageID, mentions } = event;
        if (!target[0]) return api.sendMessage("📪 | Vui lòng chỉ định một hành động (thêm, xóa, danh sách, bật, tắt hoặc bỏ cảnh cáo)", threadID, messageID);

        const isAdmin = (await api.getThreadInfo(threadID)).adminIDs.some(idInfo => idInfo.id === api.getCurrentUserID());
        if (!isAdmin) return api.sendMessage("🛡️ | Bot yêu cầu quyền quản trị. Vui lòng nâng cấp bot lên quản trị viên của nhóm chat!", threadID, messageID);

        const action = target[0];
        const word = target.slice(1).join(' ');
        loadBannedWords(threadID);
        const threadInfo = await api.getThreadInfo(event.threadID);
        const userIsAdmin = threadInfo.adminIDs.some(idInfo => idInfo.id === event.senderID);

        if (!userIsAdmin) {
            return api.sendMessage("Bạn không phải là quản trị viên của nhóm này, bạn không thể sử dụng lệnh này.", event.threadID);
        }
        if (action === 'add') {
            bannedWords[threadID].push(word.toLowerCase());
            fs.writeFileSync(path.join(__dirname, `./database/${threadID}.json`), JSON.stringify(bannedWords[threadID]), "utf8");
            return api.sendMessage(`✅ | Từ ${word} đã được thêm vào danh sách từ bị cấm.`, threadID);
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
    }
};
