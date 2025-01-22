const fs = require('fs');
const path = require('path');

module.exports = {
    name: "antijoin",
    dev: "HNT",
    cooldowns: 5,
    info: "Bật/tắt chống thêm thành viên mới",
    usages: "on/off",
    onPrefix: true,

    onLoad: function () {
        const antimemPath = path.join(__dirname, 'json', 'antijoin.json');
        if (!fs.existsSync(antimemPath)) {
            fs.writeFileSync(antimemPath, JSON.stringify({}));
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const antimemPath = path.join(__dirname, 'json', 'antijoin.json');
        let antimemData = JSON.parse(fs.readFileSync(antimemPath));
        const { threadID, senderID } = event;

        try {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            const isAdminBot = adminConfig.adminUIDs.includes(senderID);
            
            const threadInfo = await api.getThreadInfo(threadID);
            const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);
            
            if (!isAdminBot && !isGroupAdmin) {
                return api.sendMessage("⚠️ Chỉ Admin bot hoặc Quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            if (!target[0] || !["on", "off"].includes(target[0].toLowerCase())) {
                return api.sendMessage("⚠️ Vui lòng sử dụng on hoặc off!", threadID);
            }

            const isEnable = target[0].toLowerCase() === "on";
            antimemData[threadID] = isEnable;

            fs.writeFileSync(antimemPath, JSON.stringify(antimemData, null, 4));
            
            return api.sendMessage(
                `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chống thêm thành viên mới!\n${isEnable ? "⚠️ Bot sẽ tự động kick thành viên mới được thêm vào." : ""}`,
                threadID
            );
        } catch (error) {
            console.error("Antimem error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thiết lập chống thêm thành viên.", threadID);
        }
    }
};
