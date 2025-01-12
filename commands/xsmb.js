const axios = require('axios');

module.exports = {
    name: "xsmb",
    info: "Xem kết quả xổ số miền Bắc",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    cooldowns: 5,
    usages: `.xsmb: Xem kết quả xổ số miền Bắc`,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
        const loadingMsg = await api.sendMessage("⏳ Đang lấy kết quả xổ số...", threadID);
        
        try {
            const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1');
            const data = response.data;

            if (!data || !data.results) {
                throw new Error('Không thể lấy dữ liệu xổ số');
            }

            const results = data.results;
            const time = data.time;

            let message = `🎲 KẾT QUẢ XSMB NGÀY ${time}\n`;
            message += "━━━━━━━━━━━━━━━━━━\n\n";

            message += `🏆 Giải ĐB: ${results['ĐB'].join(', ')}\n\n`;
            message += `🥇 Giải Nhất: ${results.G1.join(', ')}\n\n`;
            message += `🥈 Giải Nhì: ${results.G2.join(', ')}\n\n`;
            message += `🥉 Giải Ba: ${results.G3.join(', ')}\n\n`;
            message += `💫 Giải Tư: ${results.G4.join(', ')}\n\n`;
            message += `💫 Giải Năm: ${results.G5.join(', ')}\n\n`;
            message += `💫 Giải Sáu: ${results.G6.join(', ')}\n\n`;
            message += `💫 Giải Bảy: ${results.G7.join(', ')}\n\n`;

            message += "━━━━━━━━━━━━━━━━━━\n";
            message += "💡 Chúc bạn may mắn!";

            await api.sendMessage(message, threadID, messageID);
            api.unsendMessage(loadingMsg.messageID);

        } catch (error) {
            console.error('XSMB Error:', error);
            await api.sendMessage(
                "❌ Đã có lỗi xảy ra khi lấy kết quả xổ số. Vui lòng thử lại sau!", 
                threadID, 
                messageID
            );
        }
    },

    setupScheduler: function(api) {
        const scheduleNext = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(18, 33, 0, 0);
            
            if (now >= target) {
                target.setDate(target.getDate() + 1);
            }
            
            const delay = target - now;
            return setTimeout(async () => {
                try {
                    const response = await axios.get('https://api-xsmb-today.onrender.com/api/v1');
                    const data = response.data;
                    if (!data || !data.results) throw new Error('Không thể lấy dữ liệu xổ số');

                    const results = data.results;
                    const time = data.time;
                    
                    let message = `🎲 KẾT QUẢ XSMB NGÀY ${time}\n`;
                    message += "━━━━━━━━━━━━━━━━━━\n\n";
                    message += `🏆 Giải ĐB: ${results['ĐB'].join(', ')}\n\n`;
                    message += `🥇 Giải Nhất: ${results.G1.join(', ')}\n\n`;
                    message += `🥈 Giải Nhì: ${results.G2.join(', ')}\n\n`;
                    message += `🥉 Giải Ba: ${results.G3.join(', ')}\n\n`;
                    message += `💫 Giải Tư: ${results.G4.join(', ')}\n\n`;
                    message += `💫 Giải Năm: ${results.G5.join(', ')}\n\n`;
                    message += `💫 Giải Sáu: ${results.G6.join(', ')}\n\n`;
                    message += `💫 Giải Bảy: ${results.G7.join(', ')}\n\n`;
                    message += "━━━━━━━━━━━━━━━━━━\n";
                    message += "💡 Chúc bạn may mắn!";

                    const threads = await api.getThreadList(100, null, ['INBOX']);
                    const threadIDs = threads
                        .filter(thread => thread.isGroup)
                        .map(thread => thread.threadID);

                    for (const threadID of threadIDs) {
                        try {
                            await api.sendMessage(message, threadID);
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        } catch (err) {
                            console.error(`Failed to send to thread ${threadID}:`, err);
                        }
                    }
                } catch (error) {
                    console.error('Auto XSMB Error:', error);
                }
                
                scheduleNext(); 
            }, delay);
        };

        scheduleNext(); 
    },

    onLoad: function({ api }) {
        this.setupScheduler(api);
    }
};
