const fs = require('fs');
const path = require('path');

module.exports = {
    name: "busyEvent",
    version: "2.0",
    author: "HNT",
    
    onStart: function() {
        const busyPath = path.join(__dirname, '../database/json/busy.json');
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
        const { mentions, threadID, messageID, senderID, body, type } = event;
        
        try {
            const busyPath = path.join(__dirname, '../database/json/busy.json');
            let busyData = JSON.parse(fs.readFileSync(busyPath, 'utf8'));
            
            if (type === "message" && body) {
                if (busyData.users?.[senderID]) {
                    const userData = busyData.users[senderID];
                    const timePassed = Date.now() - userData.since;
                    
                    if (userData.autoOffTime && Date.now() >= userData.autoOffTime) {
                        const pendingMsgs = userData.pending || [];
                        
                        let msg = `👋 Chế độ bận đã kết thúc theo hẹn giờ!\n`;
                        msg += `⏰ Tổng thời gian: ${this.getTimePassed(userData.since)}\n`;

                        if (pendingMsgs.length > 0) {
                            msg += `📨 Có ${pendingMsgs.length} tin nhắn trong lúc bạn vắng mặt:\n\n`;
                            for (let i = 0; i < Math.min(pendingMsgs.length, 10); i++) {
                                const { sender, time, message, threadName } = pendingMsgs[i];
                                msg += `${i + 1}. Từ: ${sender}\n`;
                                msg += `📱 Nhóm: ${threadName}\n`;
                                msg += `⏰ Lúc: ${this.getFullTime(time)}\n`;
                                msg += `💬 Nội dung: ${message}\n\n`;
                            }
                            
                            if (pendingMsgs.length > 10) {
                                msg += `... và ${pendingMsgs.length - 10} tin nhắn khác\n\n`;
                            }
                        } else {
                            msg += `💭 Không ai tag bạn khi bạn đi vắng cả.`;
                        }
                        
                        delete busyData.users[senderID];
                        fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                        
                        api.sendMessage(msg, threadID);
                    }
                    // Kiểm tra tin nhắn đầu tiên sau khi bận (hơn 1 phút)
                    else if (timePassed >= 60000) {
                        const pendingMsgs = userData.pending || [];
                        
                        let msg = `👋 Chào mừng trở lại!\n`;
                        msg += `⏰ Thời gian vắng mặt: ${this.getTimePassed(userData.since)}\n`;

                        if (pendingMsgs.length > 0) {
                            msg += `📨 Có ${pendingMsgs.length} tin nhắn trong lúc bạn vắng mặt:\n\n`;
                            for (let i = 0; i < Math.min(pendingMsgs.length, 10); i++) {
                                const { sender, time, message, threadName } = pendingMsgs[i];
                                msg += `${i + 1}. Từ: ${sender}\n`;
                                msg += `📱 Nhóm: ${threadName}\n`;
                                msg += `⏰ Lúc: ${this.getFullTime(time)}\n`;
                                msg += `💬 Nội dung: ${message}\n\n`;
                            }
                            
                            if (pendingMsgs.length > 10) {
                                msg += `... và ${pendingMsgs.length - 10} tin nhắn khác\n\n`;
                            }
                        } else {
                            msg += `💭 Không ai tag bạn khi bạn đi vắng cả.`;
                        }
                        
                        delete busyData.users[senderID];
                        fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                        
                        api.sendMessage(msg, threadID);
                    }
                }
            }
            
            // Xử lý trường hợp có người tag
            if (mentions && Object.keys(mentions).length > 0) {
                let threadName = "Không xác định";
                try {
                    const threadInfo = await api.getThreadInfo(threadID);
                    if (threadInfo && threadInfo.threadName) {
                        threadName = threadInfo.threadName;
                    }
                } catch (threadError) {
                    if (!threadError.errorSummary || !threadError.errorSummary.includes('Bạn tạm thời bị chặn')) {
                        console.error('Error getting thread info:', threadError);
                    }
                }
                
                let senderName = "Người dùng Facebook";
                try {
                    const userInfo = await api.getUserInfo(senderID);
                    if (userInfo && userInfo[senderID]) {
                        senderName = userInfo[senderID].name || senderName;
                    }
                } catch (userError) {
                    if (!userError.errorSummary || !userError.errorSummary.includes('Bạn tạm thời bị chặn')) {
                        console.error('Error getting user info:', userError);
                    }
                }

                for (let userID in mentions) {
                    if (busyData.users?.[userID]) {
                        const userData = busyData.users[userID];
                        
                        // Gửi thông báo cho người tag
                        let busyMsg = `⚠️ Người dùng đang bận từ ${this.getTimePassed(userData.since)}\n📝 Lý do: ${userData.reason}`;
                        
                        // Thêm tin nhắn tùy chỉnh nếu có
                        if (userData.autoMessage) {
                            busyMsg += `\n\n💬 Tin nhắn từ người dùng:\n"${userData.autoMessage}"`;
                        }
                        
                        // Thêm thông tin thời gian tự động kết thúc nếu có
                        if (userData.autoOffTime) {
                            const remainingTime = userData.autoOffTime - Date.now();
                            if (remainingTime > 0) {
                                busyMsg += `\n\n⏳ Sẽ kết thúc trạng thái bận sau: ${this.getTimePassed(Date.now(), userData.autoOffTime)}`;
                            }
                        }
                        
                        api.sendMessage(
                            busyMsg,
                            threadID,
                            messageID
                        );
                        
                        // Lưu tin nhắn vào danh sách chờ
                        if (!userData.pending) userData.pending = [];
                        userData.pending.push({
                            sender: senderName,
                            senderID: senderID,
                            time: Date.now(),
                            message: body,
                            threadName: threadName,
                            threadID: threadID
                        });
                        
                        fs.writeFileSync(busyPath, JSON.stringify(busyData, null, 4));
                    }
                }
            }
        } catch (error) {
            console.error('busyEvent error:', error);
        }
    },

    getFullTime: function(timestamp) {
        const date = new Date(timestamp);
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const day = days[date.getDay()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        
        return `${hours}:${minutes} - ${day}, ${dateStr}`;
    },

    getTime: function(timestamp) {
        const date = new Date(timestamp);
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