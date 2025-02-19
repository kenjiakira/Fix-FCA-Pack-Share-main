const fs = require('fs');
const path = require('path');

module.exports = {
    name: "busyWelcomeBack",
    version: "1.0",
    author: "HNT",
    
    onEvents: async function({ api, event }) {
        const { senderID, threadID } = event;
        if (!event.body || event.type !== "message") return;
        
        try {
            const busyPath = path.join(__dirname, '../commands/json/busy.json');
            let busyData = JSON.parse(fs.readFileSync(busyPath, 'utf8'));
            
            if (busyData.users?.[senderID]) {
                const userData = busyData.users[senderID];
                const timePassed = Date.now() - userData.since;
                
                if (timePassed >= 60000) { 
                    const pendingMsgs = userData.pending || [];
                    
                    let msg = `👋 Chào mừng trở lại!\n`;
                    msg += `⏰ Thời gian vắng mặt: ${this.getTimePassed(userData.since)}\n`;

                    if (pendingMsgs.length > 0) {
                        msg += `📨 Có ${pendingMsgs.length} tin nhắn trong lúc bạn vắng mặt:\n\n`;
                        for (let i = 0; i < pendingMsgs.length; i++) {
                            const { sender, time, message, threadName } = pendingMsgs[i];
                            msg += `${i + 1}. Từ: ${sender}\n`;
                            msg += `⏰ Lúc: ${this.getTime(time)}\n`;
                            msg += `💬 Nội dung: ${message}\n\n`;
                        }
                    } else {
                        msg += `💭 Không ai tag bạn khi bạn đi vắng cả.`;
                    }
                    delete busyData.users[senderID];
                    fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                    
                    api.sendMessage(msg, threadID);
                }
            }
        } catch (error) {
            console.error('busyWelcomeBack error:', error);
        }
    },

    getTime: function(timestamp) {
        const date = new Date(timestamp);
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
