const fs = require('fs');

module.exports = {
    name: "setprefix",
    usedby: 5,
    category: "Admin Commands",
    info: "Thay đổi dấu lệnh riêng cho nhóm",
    dev: "HNT, Jonell Magallanes, Nerver Give Up",
    usages: "setprefix <prefix mới>",
    onPrefix: true,
    cooldowns: 20,

    onLaunch: async function ({ api, event, target }) {
        const threadID = event.threadID;
        const newPrefix = target.join(" ").trim();

        if (!newPrefix) {
            return api.sendMessage("⚠️ Vui lòng nhập prefix mới.\n\n»Cách dùng: setprefix <prefix mới>\n»Ví dụ: setprefix !\n\n⚡️Lưu ý: Prefix này chỉ áp dụng cho nhóm này.", threadID);
        }

        const prefixPath = './database/threadPrefix.json';
        let threadPrefixes = {};

        try {
            if (fs.existsSync(prefixPath)) {
                threadPrefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
            }
            
            threadPrefixes[threadID] = newPrefix;
            fs.writeFileSync(prefixPath, JSON.stringify(threadPrefixes, null, 2));

            api.sendMessage(`✅ Đã đổi prefix của nhóm thành: '${newPrefix}'\n━━━━━━━━━━━━━━━━━━\n⚡️Bạn có thể dùng prefix mới ngay bây giờ!`, threadID);
            
        } catch (err) {
            console.error("Error handling prefix:", err);
            api.sendMessage("❌ Đã xảy ra lỗi khi lưu prefix mới, vui lòng thử lại.", threadID);
        }
    }
};
