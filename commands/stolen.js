const { getBalance, updateBalance } = require('../utils/currencies');

// Add configuration object for messages
const messages = {
    minBalance: (amount) => `Bạn cần ít nhất ${amount.toLocaleString('vi-VN')} Xu để thực hiện hành động trộm cắp (phí bảo hiểm).`,
    noMoney: "Người này không có xu trong tài khoản.",
    invalidID: "Vui lòng nhập một ID hợp lệ (chỉ là số). Ví dụ: stolen 1234567890",
    usage: "Cách sử dụng lệnh `stolen`:\n\n" +
           "1. `stolen [ID]`: Trộm tiền từ người dùng Facebook qua ID của họ. Ví dụ: `stolen 1234567890`\n" +
           "   - Thay `1234567890` bằng ID của người bạn muốn trộm tiền.\n\n" +
           "2. `stolen Reply`: Trộm tiền từ người mà bạn đang trả lời tin nhắn.\n" +
           "   - Trả lời tin nhắn của người đó và gõ `stolen Reply` để trộm tiền của họ.\n\n" +
           "3. `stolen @Tag`: Trộm tiền từ người được tag trong tin nhắn.\n" +
           "   - Gõ `@Tên người` để tag và trộm tiền của người đó."
};

module.exports = {
    name: "stolen",
    dev: "HNT",
    info: "Trộm tiền từ người khác",
    onPrefix: true,
    dmUser: false,
    usedby: 0,
    usages: "stolen ID, stolen Reply, stolen @Tag",
    cooldown: 5,

    onLaunch: async ({ api, event, target }) => {
        try {
            let victimID;

            if (event.type === 'message_reply') {
                victimID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                const mentionedUID = Object.keys(event.mentions)[0];
                victimID = mentionedUID;
            } else if (target.length === 0) {
                return api.sendMessage(messages.usage, event.threadID, event.messageID);
            } else {
                victimID = target[0];
                if (isNaN(victimID)) {
                    return api.sendMessage(messages.invalidID, event.threadID, event.messageID);
                }
            }

            let victimName;
            try {
                const victimInfo = await api.getUserInfo(victimID);
                victimName = victimInfo[victimID].name;
            } catch {
                victimName = "Người dùng";
            }

            const userBalance = getBalance(event.senderID);
            if (userBalance < 1000) {
                return api.sendMessage(messages.minBalance(1000), event.threadID, event.messageID);
            }

            const victimBalance = getBalance(victimID);
            if (victimBalance <= 0) {
                return api.sendMessage(messages.noMoney, event.threadID, event.messageID);
            }

            const successRate = Math.random();
            if (successRate < 0.6) {
                const maxSteal = Math.min(victimBalance, 50000); 
                const stolenAmount = Math.min(maxSteal, Math.floor(Math.random() * 10000) + 1000);
                updateBalance(victimID, -stolenAmount);
                updateBalance(event.senderID, stolenAmount);

                const successMessages = [
                    `🦹‍♂️ Bạn đã lẻn vào két sắt của ${victimName} và lấy được`,
                    `💻 HACK THÀNH CÔNG!\nBạn đã xâm nhập tài khoản của ${victimName} và chuyển`,
                    `🎭 Trộm thành công!\nBạn đã đột nhập vào nhà của ${victimName} và lấy được`
                ];
                const randomMsg = successMessages[Math.floor(Math.random() * successMessages.length)];

                return api.sendMessage(
                    `━━━『 STOLEN RESULT 』━━━\n\n` +
                    `${randomMsg} ${stolenAmount.toLocaleString('vi-VN')} Xu 💰\n\n` +
                    `👤 Nạn nhân: ${victimName}\n` +
                    `🆔 ID: ${victimID}\n` +
                    `💳 Số dư của bạn: ${getBalance(event.senderID).toLocaleString('vi-VN')} Xu\n\n` +
                    `━━━━━━━━━━━━━━━━`,
                    event.threadID, event.messageID
                );
            } else {
           
                const penalty = Math.floor(userBalance * 0.2); 
                updateBalance(event.senderID, -penalty);

                const failMessages = [
                    `🚔 Bạn đã bị bảo vệ nhà ${victimName} phát hiện và báo cảnh sát!`,
                    `⚠️ ${victimName} đã bắt quả tang bạn đang trộm tiền!`,
                    `❌ Thất bại! ${victimName} đã cài đặt camera an ninh!`
                ];
                const randomFailMsg = failMessages[Math.floor(Math.random() * failMessages.length)];

                return api.sendMessage(
                    `━━━『 STOLEN FAILED 』━━━\n\n` +
                    `${randomFailMsg}\n\n` +
                    `📌 Bạn bị phạt: ${penalty.toLocaleString('vi-VN')} Xu\n` +
                    `💳 Số dư còn lại: ${getBalance(event.senderID).toLocaleString('vi-VN')} Xu\n\n` +
                    `━━━━━━━━━━━━━━━━`,
                    event.threadID, event.messageID
                );
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage(
                "━━━『 ERROR 』━━━\n\n" +
                "❌ Có lỗi xảy ra. Vui lòng thử lại sau.\n\n" +
                "━━━━━━━━━━━━━━━━",
                event.threadID, event.messageID
            );
        }
    }
};
