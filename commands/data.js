const { setBalance, getBalance, saveData } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "data",
    dev: "HNT",
    info: "Quản lý số tiền của người dùng.",
    onPrefix: true,
    usages: [
        ".data view <ID>: Xem số dư của người dùng",
        ".data set <ID> <số tiền>: Đặt số dư mới",
        ".data add <ID> <số tiền>: Cộng thêm số tiền",
        ".data sub <ID> <số tiền>: Trừ đi số tiền"
    ].join('\n'),
    cooldowns: 0,
    usedby: 2,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID } = event;

        if (target.length < 2) {
            return api.sendMessage("Vui lòng sử dụng một trong các lệnh sau:\n" + this.usages, threadID, messageID);
        }

        const action = target[0].toLowerCase();
        const userID = target[1];
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
                if (target.length < 3) {
                    return api.sendMessage("Vui lòng nhập số tiền!", threadID, messageID);
                }

                const amount = parseInt(target[2].replace(/\./g, ''), 10);
                if (isNaN(amount)) {
                    return api.sendMessage("❌ Số tiền không hợp lệ!", threadID, messageID);
                }

                let newBalance = amount;
                if (action === 'add') newBalance = currentBalance + amount;
                if (action === 'sub') newBalance = currentBalance - amount;

                if (newBalance < 0) {
                    return api.sendMessage("❌ Số dư không thể âm!", threadID, messageID);
                }

                setBalance(userID, newBalance);
                saveData();

                return api.sendMessage(
                    `✅ Thao tác thành công cho ID: ${userID}\n` +
                    `Số dư cũ: ${formatNumber(currentBalance)} Xu\n` +
                    `Số dư mới: ${formatNumber(newBalance)} Xu`,
                    threadID, messageID
                );
            }

            default:
                return api.sendMessage("❌ Hành động không hợp lệ!\n" + this.usages, threadID, messageID);
        }
    }
};
