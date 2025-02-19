const { setBalance, getBalance, addBalance } = require('../utils/currencies');

module.exports = {
    name: "data",
    description: "Quản lý dữ liệu người dùng",
    dev: "HNT",
    usages: [
        "data view [@tag]: Xem số dư của người dùng",
        "data set [@tag] [số tiền] [lý do]: Đặt số dư mới",
        "data add [@tag] [số tiền] [lý do]: Thêm số tiền",
        "data del [@tag] [số tiền] [lý do]: Trừ số tiền"
    ].join('\n'),
    cooldown: 3,
    permissions: ['Administrator'],

    execute: async function(message, args) {  
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Bạn không có quyền sử dụng lệnh này!');
        }

        const action = args[0];
        if (!action) {
            return message.reply("❌ Vui lòng sử dụng: " + this.usages);
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("❌ Vui lòng tag người dùng!");
        }

        const currentBalance = Math.max(0, getBalance(user.id));

        switch (action.toLowerCase()) {
            case 'view': {
                return message.reply(`💰 Số dư của ${user.username}: ${currentBalance.toLocaleString('vi-VN')} Xu`);
            }

            case 'set': {
                if (!args[2]) {
                    return message.reply("❌ Vui lòng nhập số tiền!");
                }

                const amount = parseInt(args[2]);
                if (isNaN(amount) || amount < 0) {
                    return message.reply("❌ Số tiền không hợp lệ!");
                }

                const reason = args.slice(3).join(' ') || 'Không có lý do';
                
                setBalance(user.id, amount);
                
                return message.reply(
                    `✅ Đã cập nhật số dư cho ${user.username}\n` +
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Xu\n` +
                    `Số dư mới: ${amount.toLocaleString('vi-VN')} Xu\n` +
                    `Lý do: ${reason}`
                );
            }

            case 'add': {
                if (!args[2]) {
                    return message.reply("❌ Vui lòng nhập số tiền!");
                }

                const amount = parseInt(args[2]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply("❌ Số tiền không hợp lệ!");
                }

                const reason = args.slice(3).join(' ') || 'Không có lý do';
                
                addBalance(user.id, amount);
                const newBalance = getBalance(user.id);
                
                return message.reply(
                    `✅ Đã cộng tiền cho ${user.username}\n` +
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Xu\n` +
                    `Cộng thêm: +${amount.toLocaleString('vi-VN')} Xu\n` +
                    `Số dư mới: ${newBalance.toLocaleString('vi-VN')} Xu\n` +
                    `Lý do: ${reason}`
                );
            }

            case 'del': {
                if (!args[2]) {
                    return message.reply("❌ Vui lòng nhập số tiền!");
                }

                const amount = parseInt(args[2]);
                if (isNaN(amount) || amount <= 0) {
                    return message.reply("❌ Số tiền không hợp lệ!");
                }

                const reason = args.slice(3).join(' ') || 'Không có lý do';
                
                // Ensure balance doesn't go negative
                const deductAmount = Math.min(currentBalance, amount);
                addBalance(user.id, -deductAmount);
                const newBalance = getBalance(user.id);
                
                return message.reply(
                    `✅ Đã trừ tiền của ${user.username}\n` +
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Xu\n` +
                    `Trừ đi: -${deductAmount.toLocaleString('vi-VN')} Xu\n` +
                    `Số dư mới: ${newBalance.toLocaleString('vi-VN')} Xu\n` +
                    `Lý do: ${reason}`
                );
            }

            default:
                return message.reply("❌ Hành động không hợp lệ!\n" + this.usages);
        }
    }
};
