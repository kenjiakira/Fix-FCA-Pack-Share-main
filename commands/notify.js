const fs = require('fs');
const path = require('path');
const threadSettingsPath = path.join(__dirname, '../database/threadSettings.json');
const rankConfigPath = path.join(__dirname, '../database/json/rankConfig.json');

function loadConfig(filePath, defaultValue = {}) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
    name: "notify",
    dev: "HNT",
    usedby: 5, 
    info: "Quản lý cài đặt thông báo nhóm",
    onPrefix: true,
    usages: "notify [loại] [tùy chọn]",
    cooldowns: 5,

    onLaunch: async ({ api, event, target, prefix }) => {
        const { threadID, senderID } = event;
        
        const features = {
            sub: { 
                name: 'sub', 
                icon: '👋', 
                desc: 'thông báo chào/tạm biệt', 
                detail: 'tự động gửi tin nhắn khi có thành viên vào/rời',
                usage: 'notify sub on/off' 
            },
            admin: {
                name: 'admin',
                icon: '👑',
                desc: 'thông báo thay đổi quản trị viên',
                detail: 'thông báo khi có thay đổi về quản trị viên nhóm',
                usage: 'notify admin on/off'
            },
            avatar: {
                name: 'avatar',
                icon: '🖼️',
                desc: 'thông báo đổi ảnh nhóm',
                detail: 'thông báo khi có người thay đổi ảnh nhóm',
                usage: 'notify avatar on/off'
            },
            name: {
                name: 'name',
                icon: '✏️',
                desc: 'thông báo đổi tên nhóm',
                detail: 'thông báo khi có người thay đổi tên nhóm',
                usage: 'notify name on/off'
            },
            nick: {
                name: 'nick',
                icon: '📝',
                desc: 'thông báo đổi biệt danh',
                detail: 'thông báo khi có người thay đổi biệt danh',
                usage: 'notify nick on/off'
            }
        };

        if (!target[0]) {
            let msg = "╭─────────────────╮\n";
            msg += "    📢 NOTIFY SYSTEM 📢    \n";
            msg += "╰─────────────────╯\n\n";

            const settings = loadConfig(threadSettingsPath);
            const rankConfig = loadConfig(rankConfigPath, { disabledThreads: [] });

            const subStatus = settings[threadID]?.notifications ?? true;
            const rankStatus = !rankConfig.disabledThreads.includes(threadID);
            const welcomeMsg = settings[threadID]?.welcomeMessage ? "✅" : "❌";
            const leaveMsg = settings[threadID]?.leaveMessage ? "✅" : "❌";

            for (const [key, value] of Object.entries(features)) {
                let status = "──";
                if (key === 'sub') status = subStatus ? "ON ✅" : "OFF ❌";
                else if (key === 'config') status = `Welcome: ${welcomeMsg} | Leave: ${leaveMsg}`;
                else if (key === 'rank') status = rankStatus ? "ON ✅" : "OFF ❌";
                else if (key === 'admin' || key === 'avatar' || key === 'name' || key === 'nick') status = settings[threadID][`notify_${key}`] !== false ? "ON ✅" : "OFF ❌";

                msg += `${value.icon} ${key.toUpperCase()}: ${value.desc}\n`;
                msg += `↬ Chi tiết: ${value.detail}\n`;
                msg += `↬ Cách dùng: ${value.usage}\n`;
                msg += `↬ Trạng thái: ${status}\n`;
                msg += "──────────────────\n";
            }

            msg += "\n💡 Biến có sẵn cho tin nhắn:\n";
            msg += "⌲ {userName} - Tên thành viên\n";
            msg += "⌲ {threadName} - Tên nhóm\n";
            msg += "⌲ {memberNumber} - Số thứ tự thành viên\n";
            msg += "⌲ {memberCount} - Tổng số thành viên\n";
            msg += "⌲ {actionType} - Hành động (rời/bị kick)\n";
            
            return api.sendMessage(msg, threadID);
        }

        try {
            const type = target[0].toLowerCase();
            const action = target[1]?.toLowerCase();

            if (type === 'all' || type.includes(' ')) {
                const featureList = type === 'all' ? 
                    ['sub', 'admin', 'avatar', 'name', 'nick'] : 
                    type.split(' ').filter(f => features[f]);

                if (!action || !['on', 'off'].includes(action)) {
                    return api.sendMessage("⚠️ Vui lòng sử dụng: notify all on/off hoặc notify feature1 feature2 on/off", threadID);
                }

                let settings = loadConfig(threadSettingsPath);
                if (!settings[threadID]) settings[threadID] = {};

                let updatedFeatures = [];
                for (const feature of featureList) {
                    if (feature === 'sub') {
                        settings[threadID].notifications = (action === 'on');
                    } else if (['admin', 'avatar', 'name', 'nick'].includes(feature)) {
                        settings[threadID][`notify_${feature}`] = (action === 'on');
                    }
                    updatedFeatures.push(features[feature].desc);
                }

                fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 2));
                return api.sendMessage(
                    `✅ Đã ${action === 'on' ? 'bật' : 'tắt'} các thông báo:\n${updatedFeatures.map(desc => `• ${desc}`).join('\n')}`,
                    threadID
                );
            }

            if (type === 'config') {
                if (!action || !target[2]) {
                    return api.sendMessage("⚠️ Vui lòng sử dụng: notify config [welcome/leave] [nội dung]", threadID);
                }

                if (!['welcome', 'leave'].includes(action)) {
                    return api.sendMessage("⚠️ Chỉ hỗ trợ cấu hình welcome hoặc leave!", threadID);
                }

                let settings = loadConfig(threadSettingsPath);
                if (!settings[threadID]) settings[threadID] = {};
                
                const message = target.slice(2).join(" ");
                settings[threadID][`${action}Message`] = message;
                fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 2));
                
                return api.sendMessage(
                    `✅ Đã cập nhật tin nhắn ${action === 'welcome' ? 'chào mừng' : 'tạm biệt'}!\n` +
                    `📝 Nội dung: ${message}`,
                    threadID
                );
            }

            if (type === 'sub') {
                let settings = loadConfig(threadSettingsPath);
                if (!settings[threadID]) {
                    settings[threadID] = {
                        notifications: true,
                        welcomeMessage: "🎉 Xin chào {userName}!\nChào mừng bạn đến với nhóm \"{threadName}\"!\nBạn là thành viên thứ {memberNumber}",
                        leaveMessage: "👋 {userName} {actionType}.\n👥 Thành viên còn lại: {memberCount}"
                    };
                }

                if (action === 'on' || action === 'off') {
                    settings[threadID].notifications = (action === 'on');
                    fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 2));
                    return api.sendMessage(`✅ Đã ${action === 'on' ? 'bật' : 'tắt'} thông báo chào/tạm biệt!`, threadID);
                }
            }
            else if (type === 'welcome' || type === 'leave') {
                let settings = loadConfig(threadSettingsPath);
                if (!settings[threadID]) settings[threadID] = {};
                
                const message = target.slice(1).join(" ");
                if (!message) return api.sendMessage("⚠️ Vui lòng nhập nội dung tin nhắn!", threadID);
                
                settings[threadID][`${type}Message`] = message;
                fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 2));
                return api.sendMessage(`✅ Đã cập nhật tin nhắn ${type === 'welcome' ? 'chào mừng' : 'tạm biệt'}!`, threadID);
            }
            else if (type === 'rank') {
                let rankConfig = loadConfig(rankConfigPath, { disabledThreads: [] });
                
                if (!action || !['on', 'off'].includes(action)) {
                    const status = rankConfig.disabledThreads.includes(threadID) ? 'TẮT' : 'BẬT';
                    return api.sendMessage(`Thông báo rankup đang ${status} trong nhóm này`, threadID);
                }

                if (action === 'off') {
                    if (!rankConfig.disabledThreads.includes(threadID)) {
                        rankConfig.disabledThreads.push(threadID);
                    }
                } else {
                    rankConfig.disabledThreads = rankConfig.disabledThreads.filter(id => id !== threadID);
                }
                
                fs.writeFileSync(rankConfigPath, JSON.stringify(rankConfig, null, 2));
                return api.sendMessage(`✅ Đã ${action === 'on' ? 'bật' : 'tắt'} thông báo rankup!`, threadID);
            } else if (type === 'admin' || type === 'avatar' || type === 'name' || type === 'nick') {
                let settings = loadConfig(threadSettingsPath);
                if (!settings[threadID]) settings[threadID] = {};
                
                if (!['on', 'off'].includes(action)) {
                    const status = settings[threadID][`notify_${type}`] !== false ? 'BẬT' : 'TẮT';
                    return api.sendMessage(
                        `Thông báo ${features[type].desc} đang ${status} trong nhóm này\n` +
                        `Sử dụng: ${features[type].usage}`, 
                        threadID
                    );
                }

                settings[threadID][`notify_${type}`] = (action === 'on');
                fs.writeFileSync(threadSettingsPath, JSON.stringify(settings, null, 2));
                
                return api.sendMessage(
                    `✅ Đã ${action === 'on' ? 'bật' : 'tắt'} thông báo ${features[type].desc}!`,
                    threadID
                );
            } else {
                return api.sendMessage("❌ Lệnh không hợp lệ! Sử dụng: notify để xem hướng dẫn", threadID);
            }
        } catch (error) {
            console.error("Notify command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh.", threadID);
        }
    }
};
