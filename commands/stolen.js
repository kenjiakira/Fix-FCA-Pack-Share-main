const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');

module.exports = {
    name: "stolen",
    dev: "HNT",
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usages: "stolen Reply hoặc stolen @Tag\n- Có thể trộm 8-20% số dư của người khác",
    cooldowns: 15,

    onLaunch: async ({ api, event }) => {
        const { threadID, senderID } = event;

        try {
            let victimID = event.type === 'message_reply' 
                ? event.messageReply.senderID 
                : Object.keys(event.mentions)[0];

            if (!victimID) {
                return api.sendMessage("Reply tin nhắn hoặc tag người cần trộm!", threadID);
            }

            const vipBenefits = getVIPBenefits(victimID);
            if (vipBenefits?.stolenProtection >= 1.0) {
                return api.sendMessage(`❌ Người này được bảo vệ bởi ${vipBenefits.name}!`, threadID);
            }

            const victimBalance = getBalance(victimID);
            if (victimBalance < 15000) {
                return api.sendMessage("❌ Người này không có đủ tiền để trộm! (cần ít nhất 15,000đ)", threadID);
            }

            let successChance = 0.5;
            const isNightTime = new Date().getHours() >= 23 || new Date().getHours() < 5;
            if (isNightTime) successChance += 0.1;

            if (Math.random() < successChance) {
                const stealPercent = 0.08 + (Math.random() * 0.12);
                const maxSteal = 35000;
                const protection = vipBenefits?.stolenProtection || 0;
                const stealAmount = Math.min(
                    Math.floor(victimBalance * stealPercent * (1 - protection)),
                    maxSteal
                );

                updateBalance(victimID, -stealAmount);
                updateBalance(senderID, stealAmount);
                updateQuestProgress(senderID, 'successful_steals', 1);

                const messages = [
                    `🦹‍♂️ Trộm thành công!\n└─ Lấy được: ${stealAmount.toLocaleString()}đ`,
                    `🎭 Thành công!\n└─ Cuỗm được: ${stealAmount.toLocaleString()}đ`,
                    `🕵️ Thành công!\n└─ Lấy được: ${stealAmount.toLocaleString()}đ`
                ];

                return api.sendMessage(
                    messages[Math.floor(Math.random() * messages.length)],
                    threadID
                );
            } else {
                const penalty = Math.min(
                    Math.floor(victimBalance * 0.1),
                    25000,
                    getBalance(senderID)
                );

                if (penalty > 0) {
                    updateBalance(senderID, -penalty);
                }

                const failMessages = [
                    `🚨 Bị phát hiện!\n└─ Phạt: ${penalty.toLocaleString()}đ`,
                    `🏃 Bị báo công an!\n└─ Nộp phạt: ${penalty.toLocaleString()}đ`,
                    `👮 Bị bắt quả tang!\n└─ Phạt: ${penalty.toLocaleString()}đ`
                ];

                return api.sendMessage(
                    failMessages[Math.floor(Math.random() * failMessages.length)],
                    threadID
                );
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    }
};
