const { getBalance, updateBalance } = require('../utils/currencies');

const TOOLS = {
    BASIC: { name: "Dụng cụ cơ bản", successRate: 0.3, multiplier: 0.5 },
    ADVANCED: { name: "Công cụ chuyên nghiệp", successRate: 0.5, multiplier: 0.8 },
    HACKER: { name: "Thiết bị hack", successRate: 0.7, multiplier: 1.2 }
};

const SPECIAL_EVENTS = [
    { name: "Đột nhập két sắt", chance: 0.1, multiplier: 1.5 },
    { name: "Hack ngân hàng", chance: 0.05, multiplier: 2 },
    { name: "Tìm thấy két bí mật", chance: 0.15, multiplier: 1.3 }
];

const INSURANCE_FEE = 5000;

const messages = {
    minBalance: (amount) => `Bạn cần ít nhất ${amount.toLocaleString('vi-VN')} Xu để thực hiện hành động trộm cắp (phí bảo hiểm).`,
    noMoney: "Người này không có xu trong tài khoản.",
    usage: "Cách sử dụng lệnh `stolen`:\n- Trả lời tin nhắn người cần trộm và gõ `stolen`\n- Tag người cần trộm và gõ `stolen @tag`",
    cooldownActive: "⏰ Bạn cần đợi thêm {time} giây nữa để có thể trộm tiếp!",
    protected: "🛡️ Người này đang được bảo vệ! Hãy thử lại sau.",
    selfSteal: "❌ Bạn không thể trộm tiền của chính mình!"
};

module.exports = {
    name: "stolen",
    dev: "HNT",
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen Reply hoặc stolen @Tag",
    cooldown: 0,

    onLaunch: async ({ api, event }) => {
        try {
            let victimID;

            if (event.type === 'message_reply') {
                victimID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                victimID = Object.keys(event.mentions)[0];
            } else {
                return api.sendMessage(messages.usage, event.threadID, event.messageID);
            }

            if (victimID === event.senderID) {
                return api.sendMessage(messages.selfSteal, event.threadID, event.messageID);
            }

            const userBalance = getBalance(event.senderID);
            
            if (userBalance < INSURANCE_FEE) {
                return api.sendMessage(messages.minBalance(INSURANCE_FEE), event.threadID, event.messageID);
            }

            updateBalance(event.senderID, -INSURANCE_FEE);
            
            const victimBalance = getBalance(victimID);
            const userExp = global.stolen?.exp?.[event.senderID] || 0;

            const maxStealAmount = 100000; 

            if (!global.stolen) {
                global.stolen = { exp: {} };
            }

            let selectedTool;
            if (userExp >= 1000) selectedTool = TOOLS.HACKER;
            else if (userExp >= 500) selectedTool = TOOLS.ADVANCED;
            else selectedTool = TOOLS.BASIC;

            const baseSuccessRate = selectedTool.successRate;
            const expBonus = Math.min(0.2, userExp / 5000);
            const finalSuccessRate = Math.min(0.9, baseSuccessRate + expBonus);

            const specialEvent = SPECIAL_EVENTS.find(event => Math.random() < event.chance);

            if (Math.random() < finalSuccessRate) {
               
                const baseStealAmount = Math.min(Math.floor(victimBalance * 0.15), maxStealAmount);
                let finalAmount = Math.floor(baseStealAmount * selectedTool.multiplier);

                if (specialEvent) {
                    finalAmount *= specialEvent.multiplier;
                }

                finalAmount = Math.min(finalAmount, maxStealAmount);

                updateBalance(victimID, -finalAmount);
                updateBalance(event.senderID, finalAmount);

                global.stolen.exp[event.senderID] = userExp + Math.floor(finalAmount * 0.005);

                const successEmbed = {
                    title: specialEvent ? `✨ ${specialEvent.name.toUpperCase()} ✨` : "💰 TRỘM THÀNH CÔNG",
                    message: [
                        `🛠️ Công cụ: ${selectedTool.name}`,
                        `💰 Thu được: ${finalAmount.toLocaleString('vi-VN')} Xu`,
                        `💳 Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString('vi-VN')} Xu`,
                        `📊 Kinh nghiệm: +${Math.floor(finalAmount * 0.005)}`,
                        `🎯 Tổng kinh nghiệm: ${global.stolen.exp[event.senderID]}`,
                        specialEvent ? `🌟 BONUS x${specialEvent.multiplier}` : ''
                    ].filter(Boolean).join('\n')
                };

                this.cooldown = 600 - Math.floor(userExp / 20);
                this.cooldown = Math.max(300, this.cooldown); 
                return api.sendMessage(
                    `━━━『 ${successEmbed.title} 』━━━\n\n${successEmbed.message}\n\n` +
                    `⏰ Thời gian chờ: ${this.cooldown}s\n` +
                    `━━━━━━━━━━━━━━━━`,
                    event.threadID, event.messageID
                );
            } else {
                const penalty = Math.floor(userBalance * 0.2);
                updateBalance(event.senderID, -penalty);

                global.stolen.exp[event.senderID] = Math.max(0, userExp - 100);

                const failEmbed = {
                    message: [
                        `❌ Thất bại với ${selectedTool.name}!`,
                        `💸 Mất: ${penalty.toLocaleString('vi-VN')} Xu`,
                        `💳 Phí bảo hiểm: -${INSURANCE_FEE.toLocaleString('vi-VN')} Xu`,
                        `📊 Kinh nghiệm: -100`,
                        `🎯 Kinh nghiệm còn lại: ${global.stolen.exp[event.senderID]}`
                    ].join('\n')
                };

                this.cooldown = 900 - Math.floor(userExp / 30); 
                this.cooldown = Math.max(600, this.cooldown);

                return api.sendMessage(
                    `━━━『 THẤT BẠI 』━━━\n\n${failEmbed.message}\n\n` +
                    `⏰ Thời gian chờ: ${this.cooldown}s\n` +
                    `━━━━━━━━━━━━━━━━`,
                    event.threadID, event.messageID
                );
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Có lỗi xảy ra. Vui lòng thử lại sau.", event.threadID, event.messageID);
        }
    }
};
