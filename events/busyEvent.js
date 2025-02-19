const fs = require('fs');
const path = require('path');

module.exports = {
    name: "busyEvent",
    version: "1.0",
    author: "HNT",
    
    onStart: function() {
        const busyPath = path.join(__dirname, '../commands/json/busy.json');
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

    onEvents: async function({ api, event }) {
        const { mentions, threadID, messageID, senderID, body } = event;
        if (!mentions || Object.keys(mentions).length === 0) return;
        
        try {
            const busyPath = path.join(__dirname, '../commands/json/busy.json');
            let busyData = JSON.parse(fs.readFileSync(busyPath, 'utf8'));
            
        
            let threadName = "Không xác định";
            try {
                const threadInfo = await api.getThreadInfo(threadID);
                if (threadInfo && threadInfo.threadName) {
                    threadName = threadInfo.threadName;
                }
            } catch (threadError) {
                console.error('Error getting thread info:', threadError);
            }
            
            for (let userID in mentions) {
                if (busyData.users?.[userID]) {
                    const userData = busyData.users[userID];
                    
                    api.sendMessage(
                        `⚠️ Người dùng đang bận từ ${this.getTimePassed(userData.since)}\n📝 Lý do: ${userData.reason}`,
                        threadID,
                        messageID
                    );
                    
                    userData.pending.push({
                        sender: senderID,
                        time: Date.now(),
                        message: body,
                        threadName: threadName,
                        threadID: threadID
                    });
                    
                    fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                }
            }
        } catch (error) {
            console.error('busyEvent error:', error);
        }
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
