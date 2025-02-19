const { getBalance, addBalance } = require('../utils/currencies');

module.exports = {
    name: 'tx',
    description: 'Chơi tài xỉu với Bot',
    usage: 'tx <tài/xỉu> <số xu cược>',
    execute: async function(message, args) {
        try {
            if (args.length !== 2) {
                return message.reply('❌ Vui lòng sử dụng: !taixiu <tài/xỉu> <số xu cược>');
            }

            const choice = args[0].toLowerCase();
            if (choice !== 'tài' && choice !== 'xỉu') {
                return message.reply('❌ Vui lòng chọn tài hoặc xỉu!');
            }

            const bet = parseInt(args[1]);
            if (isNaN(bet) || bet < 1000) {
                return message.reply('❌ Số xu cược phải là số và tối thiểu 1,000 xu!');
            }

            const userID = message.author.id;
            const balance = getBalance(userID);

            if (balance < bet) {
                return message.reply('❌ Bạn không đủ xu để đặt cược!');
            }
       
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const dice3 = Math.floor(Math.random() * 6) + 1;
            const total = dice1 + dice2 + dice3;

            const result = total >= 11 ? 'tài' : 'xỉu';
            const won = choice === result;

            const winnings = won ? bet : -bet;
            addBalance(userID, winnings);

            const newBalance = getBalance(userID);
            const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            
            const reply = await message.reply(
                `🎲 Kết quả: ${diceEmoji[dice1-1]} ${diceEmoji[dice2-1]} ${diceEmoji[dice3-1]}\n` +
                `Tổng điểm: ${total} (${result.toUpperCase()})\n` +
                `${won ? '🎉 Bạn đã thắng' : '💔 Bạn đã thua'} ${Math.abs(winnings).toLocaleString('vi-VN')} xu\n` +
                `Số dư hiện tại: ${newBalance.toLocaleString('vi-VN')} xu\n`,
            );

            setTimeout(() => {
                message.delete().catch(err => console.error('Không thể xóa lệnh:', err));
                reply.delete().catch(err => console.error('Không thể xóa kết quả:', err));
            }, 10000);

        } catch (error) {
            console.error('[DISCORD] Taixiu command error:', error);
            return message.reply('❌ Đã xảy ra lỗi trong quá trình chơi game.');
        }
    }
};
