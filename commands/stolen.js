const { getBalance, updateBalance } = require('../utils/currencies');

const INSURANCE_FEE = 1000; 
const STEAL_PERCENT = 0.15;
const MAX_STEAL = 50000; 

module.exports = {
    name: "stolen",
    dev: "HNT",
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen Reply hoặc stolen @Tag",
    cooldown: 300, // 5 phút

    onLaunch: async ({ api, event }) => {
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
                return api.sendMessage(`❌ Bạn cần tối thiểu ${INSURANCE_FEE}đ để trả phí bảo hiểm!`, event.threadID);
            }

            const victimBalance = getBalance(victimID);
            if (victimBalance <= 0) {
                return api.sendMessage("❌ Người này không có tiền để trộm!", event.threadID);
            }

            updateBalance(event.senderID, -INSURANCE_FEE); 

            const success = Math.random() < 0.5; 
            if (success) {
            
                const stealAmount = Math.min(
                    Math.floor(victimBalance * STEAL_PERCENT),
                    MAX_STEAL
                );

                updateBalance(victimID, -stealAmount);
                updateBalance(event.senderID, stealAmount);

                return api.sendMessage(
                    `💰 Trộm thành công!\n` +
                    `└─ Số tiền: ${stealAmount.toLocaleString()}đ\n` +
                    `└─ Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString()}đ`,
                    event.threadID
                );
            } else {
         
                const penalty = Math.floor(userBalance * 0.1); 
                updateBalance(event.senderID, -penalty);

                return api.sendMessage(
                    `💀 Trộm thất bại!\n` +
                    `└─ Mất: ${penalty.toLocaleString()}đ\n` +
                    `└─ Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString()}đ`,
                    event.threadID
                );
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", event.threadID);
        }
    }
};
