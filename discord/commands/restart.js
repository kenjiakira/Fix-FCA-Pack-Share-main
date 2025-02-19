const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'restart',
    description: 'Khởi động lại bot',
    usage: 'restart',
    aliases: ['reboot', 'rs'],
    noPrefix: true,
    botAdminOnly: true,
    execute: async function(message, args) {
        try {
            const data = {
                channelId: message.channel.id,
                guildId: message.guild.id
            };

            fs.writeFileSync(
                path.join(__dirname, '../../database/discord_restart.json'), 
                JSON.stringify(data, null, 2)
            );

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🔄 Xác nhận khởi động lại')
                .setDescription('Bạn có chắc chắn muốn khởi động lại bot không?')
                .addFields([
                    {
                        name: '⚠️ Lưu ý',
                        value: 'Bot sẽ mất khoảng 5-10 giây để khởi động lại hoàn toàn.',
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_restart')
                        .setLabel('Xác nhận')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('cancel_restart')
                        .setLabel('Hủy bỏ')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

            const confirmMsg = await message.reply({
                embeds: [embed],
                components: [row]
            });

            const filter = i => {
                return ['confirm_restart', 'cancel_restart'].includes(i.customId) && 
                       i.user.id === message.author.id;
            };

            const collector = confirmMsg.createMessageComponentCollector({ 
                filter, 
                time: 30000,
                max: 1
            });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'confirm_restart') {
                    const restartEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🔄 Đang khởi động lại')
                        .setDescription('Bot sẽ khởi động lại trong vài giây...')
                        .setTimestamp();

                    await interaction.update({ 
                        embeds: [restartEmbed], 
                        components: [] 
                    });

                    setTimeout(() => process.exit(1), 1000);
                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Đã hủy khởi động lại')
                        .setTimestamp();

                    await interaction.update({ 
                        embeds: [cancelEmbed], 
                        components: [] 
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏰ Hết thời gian')
                        .setDescription('Đã hết thời gian xác nhận, lệnh khởi động lại đã bị hủy.')
                        .setTimestamp();

                    confirmMsg.edit({ 
                        embeds: [timeoutEmbed], 
                        components: [] 
                    });
                }
            });

        } catch (error) {
            console.error('Restart command error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Lỗi')
                .setDescription('Đã xảy ra lỗi khi thực hiện lệnh restart')
                .setTimestamp();

            message.reply({ embeds: [errorEmbed] });
        }
    }
};
