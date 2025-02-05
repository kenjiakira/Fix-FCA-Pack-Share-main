const { setBalance, getBalance, saveData } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

function formatCurrency(str) {
    if (!str) return 0;
    str = str.replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

module.exports = {
    name: "data",
    dev: "HNT",
    info: "Quản lý số tiền của người dùng",
    onPrefix: true,
    usages: [
        ".data view [@tag/reply/ID]: Xem số dư của người dùng",
        ".data set [@tag/reply/ID] <số tiền> [lý do]: Đặt số dư mới",
        ".data add [@tag/reply/ID] <số tiền> [lý do]: Cộng thêm số tiền",
        ".data sub [@tag/reply/ID] <số tiền> [lý do]: Trừ đi số tiền"
    ].join('\n'),
    cooldowns: 0,
    usedby: 2,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, mentions, type, messageReply } = event;

        if (target.length < 1) {
            return api.sendMessage("Vui lòng sử dụng một trong các lệnh sau:\n" + this.usages, threadID, messageID);
        }

        const action = target[0].toLowerCase();
        let userID, reason;

        if (Object.keys(mentions).length > 0) {
            userID = Object.keys(mentions)[0];
        } else if (type === 'message_reply') {
            userID = messageReply.senderID;
        } else {
            userID = target[1];
        }

        if (!userID) {
            return api.sendMessage("❌ Vui lòng tag người dùng, reply tin nhắn hoặc nhập ID!", threadID, messageID);
        }

        const currentBalance = getBalance(userID);

        switch (action) {
            case 'view':
                return api.sendMessage(
                    `💰 Số dư của ID ${userID}: ${formatNumber(currentBalance)} Xu`,
                    threadID, messageID
                );

            case 'set':
            case 'add':
            case 'sub': {
                const amount = formatCurrency(target[2]);
                if (!amount) {
                    return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                }

                reason = target.slice(3).join(' ');

                let newBalance = amount;
                if (action === 'add') newBalance = currentBalance + amount;
                if (action === 'sub') newBalance = currentBalance - amount;

                if (newBalance < 0) {
                    return api.sendMessage("❌ Số dư không thể âm!", threadID, messageID);
                }

                setBalance(userID, newBalance);
                saveData();

                let msg = `✅ Thao tác thành công cho ID: ${userID}\n` +
                         `Số dư cũ: ${formatNumber(currentBalance)} Xu\n` +
                         `Số dư mới: ${formatNumber(newBalance)} Xu`;
                
                if (reason) msg += `\nLý do: ${reason}`;

                return api.sendMessage(msg, threadID, messageID);
            }

            default:
                return api.sendMessage("❌ Hành động không hợp lệ!\n" + this.usages, threadID, messageID);
        }
    }
};
