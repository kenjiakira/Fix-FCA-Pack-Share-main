const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { setBalance, getBalance, addBalance, getAllData } = require('../utils/currencies');

module.exports = {
    name: "data",
    description: "Quản lý dữ liệu người dùng",
    dev: "HNT",
    usages: [
        "data view [@tag]: Xem số dư của người dùng",
        "data set [@tag] [số tiền] [lý do]: Đặt số dư mới",
        "data add [@tag] [số tiền] [lý do]: Thêm số tiền",
        "data del [@tag] [số tiền] [lý do]: Trừ số tiền",
        "data del all: Xóa toàn bộ tiền trong hệ thống"
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

        if (action.toLowerCase() === 'del' && args[1]?.toLowerCase() === 'all') {
            const confirmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ Xác nhận xóa toàn bộ')
                .setDescription([
                    '**Cảnh báo: Hành động này không thể hoàn tác!**',
                    '',
                    'Bạn có chắc chắn muốn xóa toàn bộ Nitro trong hệ thống?',
                    'Hành động này sẽ đặt số dư của tất cả người dùng về 0.'
                ].join('\n'))
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_reset')
                        .setLabel('Xác nhận xóa')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚠️'),
                    new ButtonBuilder()
                        .setCustomId('cancel_reset')
                        .setLabel('Hủy')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❌')
                );

            const confirmMsg = await message.reply({
                embeds: [confirmEmbed],
                components: [row]
            });

            try {
                const collector = confirmMsg.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id,
                    time: 30000,
                    max: 1
                });

                collector.on('collect', async (interaction) => {
                    if (interaction.customId === 'confirm_reset') {
                        const allData = getAllData();
                        let totalReset = 0;
                        
                        for (const [userId, balance] of Object.entries(allData)) {
                            if (balance > 0) {
                                setBalance(userId, 0);
                                totalReset++;
                            }
                        }

                        const resultEmbed = new EmbedBuilder()
                            .setColor(0x57F287)
                            .setTitle('✅ Xóa thành công')
                            .setDescription([
                                `Đã xóa toàn bộ Nitro của ${totalReset} người dùng`,
                                'Tất cả số dư đã được đặt về 0.'
                            ].join('\n'))
                            .setTimestamp();

                        await interaction.update({
                            embeds: [resultEmbed],
                            components: []
                        });
                    } else if (interaction.customId === 'cancel_reset') {
                        const cancelEmbed = new EmbedBuilder()
                            .setColor(0x2B2D31)
                            .setTitle('❌ Đã hủy thao tác')
                            .setDescription('Hành động xóa toàn bộ đã được hủy.')
                            .setTimestamp();

                        await interaction.update({
                            embeds: [cancelEmbed],
                            components: []
                        });
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time' && collected.size === 0) {
                        const timeoutEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('⏰ Hết thời gian')
                            .setDescription('Đã hủy xóa do không nhận được phản hồi.')
                            .setTimestamp();

                        await confirmMsg.edit({
                            embeds: [timeoutEmbed],
                            components: []
                        });
                    }
                });

            } catch (error) {
                console.error('[DATA] Error:', error);
                await confirmMsg.edit({
                    content: '❌ Đã xảy ra lỗi khi xử lý yêu cầu!',
                    embeds: [],
                    components: []
                });
            }
            return;
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply("❌ Vui lòng tag người dùng!");
        }

        const currentBalance = Math.max(0, getBalance(user.id));

        switch (action.toLowerCase()) {
            case 'view': {
                return message.reply(`💰 Số dư của ${user.username}: ${currentBalance.toLocaleString('vi-VN')} Nitro`);
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
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Nitro\n` +
                    `Số dư mới: ${amount.toLocaleString('vi-VN')} Nitro\n` +
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
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Nitro\n` +
                    `Cộng thêm: +${amount.toLocaleString('vi-VN')} Nitro\n` +
                    `Số dư mới: ${newBalance.toLocaleString('vi-VN')} Nitro\n` +
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
                
                const deductAmount = Math.min(currentBalance, amount);
                addBalance(user.id, -deductAmount);
                const newBalance = getBalance(user.id);
                
                return message.reply(
                    `✅ Đã trừ tiền của ${user.username}\n` +
                    `Số dư cũ: ${currentBalance.toLocaleString('vi-VN')} Nitro\n` +
                    `Trừ đi: -${deductAmount.toLocaleString('vi-VN')} Nitro\n` +
                    `Số dư mới: ${newBalance.toLocaleString('vi-VN')} Nitro\n` +
                    `Lý do: ${reason}`
                );
            }

            default:
                return message.reply("❌ Hành động không hợp lệ!\n" + this.usages);
        }
    }
};
