const { getBalance, updateBalance } = require('../utils/currencies');

const INSURANCE_FEE = 5000;
const MIN_STEAL_PERCENT = 0.05; 
const MAX_STEAL_PERCENT = 0.15;
const MAX_STEAL = 25000; 
const MIN_VICTIM_BALANCE = 20000;
const STEAL_COOLDOWN = 600000; 

const stealCooldowns = new Map(); 

module.exports = {
    name: "stolen",
    dev: "HNT", 
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen Reply hoặc stolen @Tag\n- Phí bảo hiểm: 2,000đ\n- Cooldown trộm: 30 phút",
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
            if (userBalance < INSURANCE_FEE) {
                return api.sendMessage(
                    `❌ Bạn cần tối thiểu ${INSURANCE_FEE.toLocaleString()}đ để trả phí bảo hiểm!`,
                    threadID
                );
            }

            const victimBalance = getBalance(victimID);
            if (victimBalance < MIN_VICTIM_BALANCE) {
                return api.sendMessage(
                    "❌ Đối phương cần ít nhất 20,000đ để có thể trộm!",
                    threadID
                );
            }

            stealCooldowns.set(senderID, now);

            let successChance = 0.4;
            if (userBalance > victimBalance * 2) successChance += 0.1;
            if (victimBalance > userBalance * 5) successChance -= 0.2;

            if (userBalance < victimBalance / 2) successChance += 0.2; 

            const success = Math.random() < successChance;

            updateBalance(event.senderID, -INSURANCE_FEE);

            if (success) {
                const stealPercent = MIN_STEAL_PERCENT + (Math.random() * (MAX_STEAL_PERCENT - MIN_STEAL_PERCENT));
                const stealAmount = Math.min(
                    Math.floor(victimBalance * stealPercent),
                    MAX_STEAL,
                    Math.floor(userBalance * 2) 
                );

                updateBalance(victimID, -stealAmount);
                updateBalance(event.senderID, stealAmount);

                const messages = [
                    `🦹‍♂️ Trộm thành công!\n└─ Chiếm được: ${stealAmount.toLocaleString()}đ`,
                    `💰 Ăn trộm thành công!\n└─ Lấy được: ${stealAmount.toLocaleString()}đ`,
                    `🎭 Phi vụ thành công!\n└─ Thu về: ${stealAmount.toLocaleString()}đ`
                ];

                return api.sendMessage(
                    `${messages[Math.floor(Math.random() * messages.length)]}\n└─ Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString()}đ`,
                    threadID
                );
            } else {
                const penaltyPercent = 0.15 + (Math.random() * 0.15);
                const penalty = Math.floor(userBalance * penaltyPercent);
                updateBalance(event.senderID, -penalty);

                const messages = [
                    `👮 Bị bắt quả tang!\n└─ Mất: ${penalty.toLocaleString()}đ`,
                    `🚔 Bị phát hiện!\n└─ Phạt: ${penalty.toLocaleString()}đ`,
                    `⚠️ Thất bại!\n└─ Mất: ${penalty.toLocaleString()}đ`
                ];

                return api.sendMessage(
                    `${messages[Math.floor(Math.random() * messages.length)]}\n└─ Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString()}đ`,
                    threadID
                );
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
