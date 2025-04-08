const fs = require('fs');
const path = require('path');

module.exports = {
    name: "busy",
    dev: "HNT",
    usedby: 0,
    category: "Tiện Ích",
    info: "Bật chế độ bận - bot sẽ thông báo khi có người tag",
    usages: "[lý do] | [-t <số phút>] | [-m <tin nhắn tự động>]",
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
            const busyPath = path.join(__dirname, 'json', 'busy.json');
            let busyData = JSON.parse(fs.readFileSync(busyPath, 'utf8'));
            if (!busyData.users) busyData.users = {};

            if (busyData.users[senderID]) {
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
                        msg += `⏰ Lúc: ${this.getFullTime(time)}\n`;
                        msg += `💬 Nội dung: ${message}\n\n`;
                    }
                }
                
                return api.sendMessage(msg, threadID, messageID);
            }

            const args = [...target]; 
            let reason = "Không có lý do";
            let autoOffTime = null;
            let autoMessage = "Mình đang bận, sẽ trả lời sau. Cảm ơn bạn!";
            
            const timeIndex = args.findIndex(arg => arg === "-t");
            if (timeIndex !== -1 && timeIndex + 1 < args.length) {
                const minutes = parseInt(args[timeIndex + 1]);
                if (!isNaN(minutes) && minutes > 0) {
                    autoOffTime = Date.now() + (minutes * 60 * 1000);
         
                    args.splice(timeIndex, 2);
                }
            }
            
            const messageIndex = args.findIndex(arg => arg === "-m");
            if (messageIndex !== -1 && messageIndex + 1 < args.length) {
              
                autoMessage = args.slice(messageIndex + 1).join(" ");
              
                args.splice(messageIndex);
            }
            
            if (args.length > 0) {
                reason = args.join(" ");
            }
            
            busyData.users[senderID] = {
                busy: true,
                reason: reason,
                since: Date.now(),
                autoOffTime: autoOffTime,
                autoMessage: autoMessage,
                pending: []
            };
            
            fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
            
            let responseMsg = `✅ Đã bật chế độ bận\n⏰ Thời gian bắt đầu: ${this.getFullTime()}\n📝 Lý do: ${reason}\n💬 Tin nhắn tự động: ${autoMessage}`;
            
            if (autoOffTime) {
                const endTime = new Date(autoOffTime);
                responseMsg += `\n⏳ Tự động tắt sau: ${this.getTimePassed(Date.now(), autoOffTime)}`;
            }
            
            return api.sendMessage(responseMsg, threadID, messageID);
        } catch (error) {
            console.error('busy command error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", threadID, messageID);
        }
    },

    getFullTime: function(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const day = days[date.getDay()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        return `${hours}:${minutes} - ${day}, ${dateStr}`;
    },

    getTime: function(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    getTimePassed: function(startTime, endTime = Date.now()) {
        const seconds = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} ngày ${hours % 24} giờ`;
        if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
        if (minutes > 0) return `${minutes} phút`;
        return `${seconds} giây`;
    }
};
