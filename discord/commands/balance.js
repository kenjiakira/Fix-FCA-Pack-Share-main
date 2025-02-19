const { getBalance, loadData } = require('../utils/currencies');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'balance',
    description: 'Kiểm tra số dư tài khoản của bạn',
    usage: 'balance',
    execute: async function(message, args) {
        try {
            await loadData();
            
            const userID = message.author.id;
            const balance = getBalance(userID);
            
            const embed = new EmbedBuilder()
                .setColor(balance > 0 ? 0x00FF00 : 0xFF0000)
                .setTitle('💰 Số Dư Tài Khoản')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .addFields([
                    {
                        name: '👤 Người Dùng',
                        value: `${message.author.tag}`,
                        inline: true
                    },
                    {
                        name: '🏦 Số Dư',
                        value: `${balance.toLocaleString('vi-VN')} xu`,
                        inline: true
                    },
                    {
                        name: '💡 Mẹo',
                        value: 'Sử dụng lệnh `.daily` để nhận thưởng hàng ngày!',
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({ 
                    text: `ID: ${userID}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            const reply = await message.reply({ embeds: [embed] });
            
            // Tự động xóa sau 30 giây
            setTimeout(() => {
                reply.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 30000);

        } catch (error) {
            console.error('[DISCORD] Balance command error:', error);
            const errorReply = await message.reply('❌ Đã xảy ra lỗi khi kiểm tra số dư. Vui lòng thử lại sau.');
            
            setTimeout(() => {
                errorReply.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 5000);
        }
    }
};
