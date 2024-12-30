const fs = require('fs');
const path = require('path');

module.exports = {
    name: "sub",
    dev: "HNT",
    info: "Quản lý cài đặt thông báo nhóm",
    onPrefix: true,
    dmUser: false,
    usedby: 1,
    usages: "sub [on/off] hoặc sub config [welcome/leave] [text]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target, prefix }) => {
        const threadID = event.threadID;
        const senderID = event.senderID;
        const configPath = path.join(__dirname, '../database/threadSettings.json');
        const adminConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../admin.json'), 'utf8'));
        const isAdmin = adminConfig.adminUIDs.includes(senderID);
        
        let targetThreadID = threadID;
        
        if (isAdmin && target[0] === "thread" && target[1]) {
            targetThreadID = target[1];
            target = target.slice(2); 
        }

        let settings = {};
        try {
            if (fs.existsSync(configPath)) {
                settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (err) {
            console.error("Error loading settings:", err);
        }

        if (!settings[targetThreadID]) {
            settings[targetThreadID] = {
                notifications: true,
                welcomeMessage: "🎉 Xin chào {userName}!\nChào mừng bạn đến với nhóm \"{threadName}\"!\nBạn là thành viên thứ {memberNumber} của nhóm này.",
                leaveMessage: "👋 {userName} {actionType}.\n👥 Thành viên còn lại: {memberCount}"
            };
        }

        const saveSettings = () => {
            fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
        };

        if (!target[0]) {
            let helpMessage = `📝 Hướng dẫn sử dụng:\n` +
                `\n1. Bật/tắt thông báo:` +
                `\n${prefix}sub on - Bật thông báo` +
                `\n${prefix}sub off - Tắt thông báo` +
                `\n\n2. Tùy chỉnh tin nhắn:` +
                `\n${prefix}sub config welcome [nội dung] - Đổi tin chào` +
                `\n${prefix}sub config leave [nội dung] - Đổi tin tạm biệt`;

            if (isAdmin) {
                helpMessage += `\n\n👑 Lệnh dành cho Admin:` +
                    `\n${prefix}sub thread [threadID] [lệnh] - Quản lý nhóm khác` +
                    `\nVí dụ: ${prefix}sub thread 123456789 on`;
            }

            helpMessage += `\n\nBiến có sẵn: {userName}, {threadName}, {memberNumber}, {memberCount}, {actionType}`;
            
            return api.sendMessage(helpMessage, threadID);
        }

        const command = target[0].toLowerCase();
        
        switch (command) {
            case "on":
                settings[targetThreadID].notifications = true;
                saveSettings();
                return api.sendMessage(`✅ Đã bật thông báo cho nhóm ${targetThreadID === threadID ? "này" : targetThreadID}!`, threadID);
            
            case "off":
                settings[targetThreadID].notifications = false;
                saveSettings();
                return api.sendMessage(`❌ Đã tắt thông báo cho nhóm ${targetThreadID === threadID ? "này" : targetThreadID}!`, threadID);
            
            case "config":
                if (!target[1] || !target[2]) {
                    return api.sendMessage("⚠️ Vui lòng nhập đầy đủ tham số!", threadID);
                }
                
                const type = target[1].toLowerCase();
                const message = target.slice(2).join(" ");
                
                if (type === "welcome") {
                    settings[targetThreadID].welcomeMessage = message;
                    saveSettings();
                    return api.sendMessage(`✅ Đã cập nhật tin nhắn chào mừng cho nhóm ${targetThreadID === threadID ? "này" : targetThreadID}!`, threadID);
                } else if (type === "leave") {
                    settings[targetThreadID].leaveMessage = message;
                    saveSettings();
                    return api.sendMessage(`✅ Đã cập nhật tin nhắn tạm biệt cho nhóm ${targetThreadID === threadID ? "này" : targetThreadID}!`, threadID);
                }
                break;
            
            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!", threadID);
        }
    }
};
