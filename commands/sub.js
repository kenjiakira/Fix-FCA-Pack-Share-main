const fs = require('fs');
const path = require('path');

module.exports = {
    name: "sub",
    dev: "HNT",
    info: "Quản lý cài đặt thông báo nhóm",
    onPrefix: true,
    dmUser: false,
    usedBy: 1,
    usages: "sub [on/off] hoặc sub config [welcome/leave] [text]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target, prefix }) => {
        const threadID = event.threadID;
        const senderID = event.senderID;

        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const isAdmin = threadInfo.adminIDs.some(e => e.id == senderID);

            if (!isAdmin) {
                return api.sendMessage("⚠️ Chỉ quản trị viên nhóm mới có thể sử dụng lệnh này!", threadID);
            }

            const configPath = path.join(__dirname, '../database/threadSettings.json');
            
            let settings = {};
            try {
                if (fs.existsSync(configPath)) {
                    settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
            } catch (err) {
                console.error("Error loading settings:", err);
            }

            if (!settings[threadID]) {
                settings[threadID] = {
                    notifications: true,
                    welcomeMessage: "🎉 Xin chào {userName}!\nChào mừng bạn đến với nhóm \"{threadName}\"!\nBạn là thành viên thứ {memberNumber} của nhóm này.",
                    leaveMessage: "👋 {userName} {actionType}.\n👥 Thành viên còn lại: {memberCount}"
                };
            }

            const saveSettings = () => {
                fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
            };

            if (!target[0]) {
                return api.sendMessage(
                    `📝 Hướng dẫn sử dụng:\n` +
                    `\n1. Bật/tắt thông báo:` +
                    `\n${prefix}sub on - Bật thông báo` +
                    `\n${prefix}sub off - Tắt thông báo` +
                    `\n\n2. Tùy chỉnh tin nhắn:` +
                    `\n${prefix}sub config welcome [nội dung] - Đổi tin chào` +
                    `\n${prefix}sub config leave [nội dung] - Đổi tin tạm biệt` +
                    `\n\nBiến có sẵn: {userName}, {threadName}, {memberNumber}, {memberCount}, {actionType}`,
                    threadID
                );
            }

            const command = target[0].toLowerCase();
            
            switch (command) {
                case "on":
                    settings[threadID].notifications = true;
                    saveSettings();
                    return api.sendMessage("✅ Đã bật thông báo cho nhóm này!", threadID);
                
                case "off":
                    settings[threadID].notifications = false;
                    saveSettings();
                    return api.sendMessage("❌ Đã tắt thông báo cho nhóm này!", threadID);
                
                case "config":
                    if (!target[1] || !target[2]) {
                        return api.sendMessage("⚠️ Vui lòng nhập đầy đủ tham số!", threadID);
                    }
                    
                    const type = target[1].toLowerCase();
                    const message = target.slice(2).join(" ");
                    
                    if (type === "welcome") {
                        settings[threadID].welcomeMessage = message;
                        saveSettings();
                        return api.sendMessage("✅ Đã cập nhật tin nhắn chào mừng!", threadID);
                    } else if (type === "leave") {
                        settings[threadID].leaveMessage = message;
                        saveSettings();
                        return api.sendMessage("✅ Đã cập nhật tin nhắn tạm biệt!", threadID);
                    }
                    break;
                
                default:
                    return api.sendMessage("❌ Lệnh không hợp lệ!", threadID);
            }
        } catch (error) {
            console.error("Sub command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh.", threadID);
        }
    }
};
