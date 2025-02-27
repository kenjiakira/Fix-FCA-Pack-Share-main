const fs = require('fs');
const path = require('path');

module.exports = {
    name: "busy",
    dev: "HNT",
    usedby: 0,
    category: "Tiện Ích",
    info: "Bật chế độ bận - bot sẽ thông báo khi có người tag",
    usages: "[lý do]",
    onPrefix: true,
    cooldowns: 5,

    onLoad: function() {
        const busyPath = path.join(__dirname, 'json', 'busy.json');
        if (!fs.existsSync(path.dirname(busyPath))) {
            fs.mkdirSync(path.dirname(busyPath), { recursive: true });
        }
        if (!fs.existsSync(busyPath)) {
            fs.writeFileSync(busyPath, JSON.stringify({
                users: {},
                pending: {}
            }, null, 4));
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID, messageID } = event;
        try {
            const reason = target.join(" ") || "Không có lý do";
            const busyPath = path.join(__dirname, 'json', 'busy.json');
            
            let busyData = JSON.parse(fs.readFileSync(busyPath, 'utf8'));
            if (!busyData.users) busyData.users = {};

            if (!busyData.users[senderID]) {
                busyData.users[senderID] = {
                    busy: true,
                    reason: reason,
                    since: Date.now(),
                    pending: []
                };
                
                fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                
                return api.sendMessage(
                    `✅ Đã bật chế độ bận\n⏰ Thời gian: ${this.getTime()}\n📝 Lý do: ${reason}`,
                    threadID,
                    messageID
                );
            } else {
                const userData = busyData.users[senderID];
                const pendingMsgs = userData.pending || [];
                delete busyData.users[senderID];
                
                fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                
                let msg = `✅ Đã tắt chế độ bận\n`;
                msg += `⏰ Thời gian bận: ${this.getTimePassed(userData.since)}\n`;
                
                if (pendingMsgs.length > 0) {
                    msg += `\n📨 Có ${pendingMsgs.length} tin nhắn trong lúc bạn vắng mặt:\n\n`;
                    for (let i = 0; i < pendingMsgs.length; i++) {
                        const { sender, time, message, threadName } = pendingMsgs[i];
                        msg += `${i + 1}. Từ: ${sender}\n`;
                        msg += `📝 Nhóm: ${threadName}\n`;
                        msg += `⏰ Lúc: ${this.getTime(time)}\n`;
                        msg += `💬 Nội dung: ${message}\n\n`;
                    }
                }
                
                return api.sendMessage(msg, threadID, messageID);
            }
        } catch (error) {
            console.error('busy command error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", threadID, messageID);
        }
    },

    getTime: function(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    getTimePassed: function(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
        if (minutes > 0) return `${minutes} phút`;
        return `${seconds} giây`;
    }
};
