const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    name: 'help',
    description: 'Xem danh sách lệnh',
    usage: 'help [tên lệnh]',
    execute: async function(message, args) {
        try {
            if (!message.guild.members.me.permissions.has('SendMessages')) {
                return message.author.send('❌ Bot không có quyền gửi tin nhắn trong kênh này!').catch(() => {});
            }

            const isBotAdmin = config.adminUIDs.includes(message.author.id);

            if (args[0]) {
                const commandName = args[0].toLowerCase();
                const command = message.client.commands.get(commandName);
                
                if (!command) {
                    return message.reply('❌ Không tìm thấy lệnh này!');
                }

                if (command.botAdminOnly && !isBotAdmin) {
                    return message.reply('❌ Bạn không có quyền xem thông tin lệnh này!');
                }

                const embed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle(`📖 Chi tiết lệnh: ${command.name}`)
                    .addFields([
                        { name: '📝 Mô tả', value: command.description || 'Không có mô tả' },
                        { name: '🔍 Cách dùng', value: `\`${config.prefix}${command.usage || command.name}\`` }
                    ])
                    .setTimestamp()
                    .setFooter({ 
                        text: command.botAdminOnly ? '⚡ Lệnh dành cho Bot Admin' : '🌟 Lệnh cho tất cả thành viên' 
                    });

                return message.reply({ embeds: [embed] });
            }

            const uniqueCommands = new Map();
            const normalCommands = [];
            const adminCommands = [];

            message.client.commands.forEach(cmd => {
                if (!uniqueCommands.has(cmd.name)) {
                    uniqueCommands.set(cmd.name, cmd);
                    if (cmd.botAdminOnly) {
                        if (isBotAdmin) adminCommands.push(cmd);
                    } else {
                        normalCommands.push(cmd);
                    }
                }
            });

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('📚 Danh sách lệnh')
                .setDescription(`Sử dụng \`${config.prefix}help [tên lệnh]\` để xem chi tiết từng lệnh`)
                .addFields([
                    {
                        name: '🌟 Lệnh thường',
                        value: normalCommands
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(cmd => `\`${cmd.name}\` • ${cmd.description || 'Không có mô tả'}`)
                            .join('\n') || 'Không có lệnh nào',
                        inline: false
                    }
                ]);

            if (isBotAdmin && adminCommands.length > 0) {
                embed.addFields({
                    name: '⚡ Lệnh Admin',
                    value: adminCommands
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(cmd => `\`${cmd.name}\` • ${cmd.description || 'Không có mô tả'}`)
                        .join('\n'),
                    inline: false
                });
            }

            embed.setTimestamp()
                .setFooter({ 
                    text: `${uniqueCommands.size} lệnh • Bot by ${config.ownerName}`
                });

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[DISCORD] Help command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh help').catch(() => {});
        }
    }
};
