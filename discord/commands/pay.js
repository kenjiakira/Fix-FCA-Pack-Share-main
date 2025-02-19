const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getBalance, addBalance } = require('../utils/currencies');

module.exports = {
    name: 'pay',
    description: 'Chuyển Nitro cho người khác',
    usage: 'pay <@người nhận> <số Nitro>',
    cooldown: 10,

    execute: async function(message, args) {
        try {
            const recipient = message.mentions.users.first();
            if (!recipient) {
                return message.reply('❌ Vui lòng tag người nhận!');
            }

            if (recipient.id === message.author.id) {
                return message.reply('❌ Bạn không thể chuyển Nitro cho chính mình!');
            }

            if (recipient.bot) {
                return message.reply('❌ Không thể chuyển Nitro cho bot!');
            }

            const amount = parseInt(args[1]);
            if (!amount || isNaN(amount) || amount <= 0) {
                return message.reply('❌ Số Nitro không hợp lệ!');
            }

            const senderBalance = getBalance(message.author.id);
            if (senderBalance < amount) {
                return message.reply(`❌ Bạn không đủ Nitro! Bạn chỉ có ${senderBalance.toLocaleString('vi-VN')} Nitro`);
            }

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('💸 Xác nhận chuyển Nitro')
                .setDescription([
                    `**Người gửi:** ${message.author}`,
                    `**Người nhận:** ${recipient}`,
                    `**Số Nitro:** ${amount.toLocaleString('vi-VN')} Nitro`,
                    '',
                    '⚠️ Bấm nút xác nhận để chuyển Nitro!'
                ].join('\n'))
                .setTimestamp();

            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_transfer')
                .setLabel('Xác nhận')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_transfer')
                .setLabel('Hủy')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            const confirmMsg = await message.reply({
                embeds: [embed],
                components: [row]
            });

            const filter = i => i.user.id === message.author.id;
            const collector = confirmMsg.createMessageComponentCollector({ 
                filter, 
                time: 30000 
            });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_transfer') {
                   
                    const currentBalance = getBalance(message.author.id);
                    if (currentBalance < amount) {
                        await i.update({
                            content: '❌ Số dư không đủ để thực hiện giao dịch!',
                            embeds: [],
                            components: []
                        });
                        return;
                    }

                    addBalance(message.author.id, -amount);
                    addBalance(recipient.id, amount);

                    const successEmbed = new EmbedBuilder()
                        .setColor(0x57F287)
                        .setTitle('✅ Chuyển Nitro thành công!')
                        .setDescription([
                            `**Người gửi:** ${message.author}`,
                            `**Người nhận:** ${recipient}`,
                            `**Số Nitro:** ${amount.toLocaleString('vi-VN')} Nitro`,
                            '',
                            `💰 Số dư còn lại: ${(currentBalance - amount).toLocaleString('vi-VN')} Nitro`
                        ].join('\n'))
                        .setTimestamp();

                    await i.update({
                        embeds: [successEmbed],
                        components: []
                    });

                } else if (i.customId === 'cancel_transfer') {
                    await i.update({
                        content: '❌ Đã hủy giao dịch!',
                        embeds: [],
                        components: []
                    });
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await confirmMsg.edit({
                        content: '⏰ Hết thời gian xác nhận!',
                        embeds: [],
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('[DISCORD] Pay command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    }
};
