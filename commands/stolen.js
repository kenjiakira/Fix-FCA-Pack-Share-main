const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');

const MIN_STEAL_PERCENT = 0.08;
const MAX_STEAL_PERCENT = 0.20;
const MAX_STEAL = 35000;
const MIN_VICTIM_BALANCE = 15000;
const STEAL_COOLDOWN = 900000;
const MAX_PENALTY = 25000; 

const stealCooldowns = new Map();

module.exports = {
    name: "stolen",
    dev: "HNT", 
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen Reply hoặc stolen @Tag\n- Có thể trộm 8-20% số dư của nạn nhân\n- Tối đa 35,000đ\n- Cooldown: 15 phút",
    cooldowns: 5, 

    onLaunch: async ({ api, event }) => {
        const { threadID, senderID } = event;

        const now = Date.now();
        const lastStealTime = stealCooldowns.get(senderID) || 0;
        const timeLeft = STEAL_COOLDOWN - (now - lastStealTime);

        if (timeLeft > 0) {
            const minutes = Math.ceil(timeLeft / 60000);
            return api.sendMessage(
                `⏳ Vui lòng đợi ${minutes} phút nữa để có thể trộm tiếp!`,
                threadID
            );
        }

        try {
            let victimID;
            if (event.type === 'message_reply') {
                victimID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                victimID = Object.keys(event.mentions)[0];
            } else {
                return api.sendMessage("Reply tin nhắn hoặc tag người cần trộm!", event.threadID);
            }

            if (victimID === event.senderID) {
                return api.sendMessage("❌ Không thể trộm chính mình!", event.threadID);
            }

            const userBalance = getBalance(event.senderID);
            const victimBalance = getBalance(victimID);
            
            if (victimBalance < MIN_VICTIM_BALANCE) {
                return api.sendMessage(
                    "❌ Đối phương cần ít nhất 15,000đ để có thể trộm!",
                    threadID
                );
            }

            stealCooldowns.set(senderID, now);

            let successChance = 0.5; 
          
            const wealthRatio = userBalance / victimBalance;
            if (wealthRatio < 0.5) successChance += 0.2;
            else if (wealthRatio > 2) successChance -= 0.1; 
            
            successChance += (Math.random() * 0.2) - 0.1;

            const success = Math.random() < successChance;

            if (success) {
                const stealPercent = MIN_STEAL_PERCENT + (Math.random() * (MAX_STEAL_PERCENT - MIN_STEAL_PERCENT));
                const stealAmount = Math.min(
                    Math.floor(victimBalance * stealPercent),
                    MAX_STEAL
                );

                updateBalance(victimID, -stealAmount);
                updateBalance(event.senderID, stealAmount);
                
                updateQuestProgress(senderID, 'successful_steals', 1);

                const messages = [
                    `🦹‍♂️ Trộm thành công!\n└─ Chiếm được: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`,
                    `💰 Ăn trộm thành công!\n└─ Lấy được: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`,
                    `🎭 Phi vụ thành công!\n└─ Thu về: ${stealAmount.toLocaleString()}đ (${Math.floor(stealPercent * 100)}% số dư)`
                ];

                return api.sendMessage(messages[Math.floor(Math.random() * messages.length)], threadID);
            } else {
                const penaltyPercent = 0.1 + (Math.random() * 0.1); 
                const calculatedPenalty = Math.floor(victimBalance * penaltyPercent);
                const penalty = Math.min(
                    calculatedPenalty,
                    MAX_PENALTY,
                    userBalance 
                );
                
                if (penalty > 0) {
                    updateBalance(event.senderID, -penalty);
                }

                const messages = [
                    `👮 Bị bắt quả tang!\n└─ Phạt: ${penalty.toLocaleString()}đ`,
                    `🚔 Thất bại và bị phạt!\n└─ Mất: ${penalty.toLocaleString()}đ`,
                    `⚠️ Trộm hụt!\n└─ Bị phạt: ${penalty.toLocaleString()}đ`
                ];

                return api.sendMessage(messages[Math.floor(Math.random() * messages.length)], threadID);
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
