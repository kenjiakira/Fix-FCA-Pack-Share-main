const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'load',
    description: 'Tải lại lệnh hoặc utils Discord',
    usage: 'load <command/utils>',
    botAdminOnly: true,
    execute: async function(message, args) {
        try {
            // Xóa tin nhắn gốc sau 5 giây
            setTimeout(() => {
                message.delete().catch(() => {});
            }, 5000);

            if (!args[0]) {
                const reply = await message.reply('❌ Vui lòng chỉ định command hoặc utils để load lại!');
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🔄 Load System')
                .setTimestamp();

            if (args[0].toLowerCase() === 'utils') {
                // Clear cache for all utils
                Object.keys(require.cache).forEach(key => {
                    if (key.includes('discord/utils')) {
                        delete require.cache[key];
                    }
                });
                
                embed.setDescription('✅ Đã tải lại tất cả utils thành công!')
                     .setFooter({ text: 'Discord Utils Reloaded' });

            } else if (args[0].toLowerCase() === 'command' || args[0].toLowerCase() === 'commands') {
                // Reload all commands
                message.client.commands.clear();
                require('../utils/loadCommands').loadCommands(message.client);
                
                embed.setDescription('✅ Đã tải lại tất cả commands thành công!')
                     .setFooter({ text: 'Discord Commands Reloaded' });

            } else {
                embed.setDescription('❌ Tham số không hợp lệ!\nSử dụng: `command` hoặc `utils`')
                     .setColor(0xFF0000);
            }

            const reply = await message.reply({ embeds: [embed] });
            
            // Xóa tin nhắn reply sau 5 giây
            setTimeout(() => {
                reply.delete().catch(() => {});
            }, 5000);

        } catch (error) {
            console.error('[DISCORD] Load command error:', error);
            const errorReply = await message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh load!');
            setTimeout(() => errorReply.delete().catch(() => {}), 5000);
        }
    }
};
