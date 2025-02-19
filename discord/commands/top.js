const { EmbedBuilder } = require('discord.js');
const { allBalances } = require('../utils/currencies');

module.exports = {
    name: 'top',
    description: 'Xem bảng xếp hạng Nitro',
    usage: 'top [số trang]',
    cooldown: 5,

    execute: async function(message, args) {
        try {
            const itemsPerPage = 10;
            const page = parseInt(args[0]) || 1;
            
            if (page < 1) {
                return message.reply('❌ Số trang không hợp lệ!');
            }

            const balanceObj = allBalances();
            const balanceArray = Object.entries(balanceObj)
                .map(([userID, amount]) => ({ userID, amount }))
                .sort((a, b) => b.amount - a.amount);

            const maxPages = Math.ceil(balanceArray.length / itemsPerPage);

            if (page > maxPages) {
                return message.reply(`❌ Chỉ có ${maxPages} trang!`);
            }

            const startIdx = (page - 1) * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            const pageBalances = balanceArray.slice(startIdx, endIdx);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('💰 Bảng xếp hạng Nitro')
                .setDescription('Đang tải...')
                .setFooter({ text: `Trang ${page}/${maxPages} • ${balanceArray.length} người dùng` })
                .setTimestamp();

            const description = await Promise.all(pageBalances.map(async (item, index) => {
                const position = startIdx + index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';
                const amount = item.amount.toLocaleString('vi-VN');
                
                try {
                    const user = await message.client.users.fetch(item.userID);
                    return `${medal} #${position}. ${user.username}\n💰 ${amount} Nitro`;
                } catch (err) {
                    return `${medal} #${position}. Unknown User\n💰 ${amount} Nitro`;
                }
            }));

            embed.setDescription(description.join('\n\n'));
            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[DISCORD] Top command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    }
};
