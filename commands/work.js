const { updateBalance, updateQuestProgress } = require('../utils/currencies');
const { createUserData } = require('../utils/userData');

const workCooldowns = new Map();

module.exports = {
    name: "work",
    dev: "HNT",
    category: "Games",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,
    
    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        try {
            await createUserData(senderID);
        } catch (error) {
            return api.sendMessage("❌ Có lỗi xảy ra khi tạo dữ liệu người dùng!", threadID, messageID);
        }

        const now = Date.now();
        const cooldownEnd = workCooldowns.get(senderID);
        
        if (cooldownEnd && now < cooldownEnd) {
            const remaining = cooldownEnd - now;
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.ceil((remaining % 60000) / 1000);
            
            let timeMessage = '';
            if (hours > 0) timeMessage += `${hours} giờ `;
            if (minutes > 0) timeMessage += `${minutes} phút `;
            if (seconds > 0) timeMessage += `${seconds} giây`;
            
            return api.sendMessage(
                `⏳ Bạn cần nghỉ ngơi ${timeMessage} nữa mới có thể làm việc tiếp!`,
                threadID,
                messageID
            );
        }

        try {
            const earnings = Math.floor(Math.random() * 9001) + 100000;
            
            await updateBalance(senderID, earnings);
            await updateQuestProgress(senderID, "work");
            
            workCooldowns.set(senderID, now + 900000);
            
            const message = `💰 Bạn đã làm việc và kiếm được ${earnings.toLocaleString('vi-VN')} $!`;
            
            return api.sendMessage(message, threadID, messageID);

        } catch (error) {
            console.error("Work command error:", error);
            return api.sendMessage("❌ Có lỗi xảy ra khi làm việc!", threadID, messageID);
        }
    }
};