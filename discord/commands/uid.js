const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'uid',
    description: 'Lấy ID của người dùng',
    usage: 'uid [@mention]',
    noPrefix: true,
    execute: async function(message) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🔍 User ID Checker')
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            if (message.mentions.users.size > 0) {
                const mentionedUser = message.mentions.users.first();
                embed.setDescription(`ID của ${mentionedUser.username}: \`${mentionedUser.id}\``)
                     .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true }));
            } else {
                embed.setDescription(`ID của bạn: \`${message.author.id}\``)
                     .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
            }

            const reply = await message.reply({ embeds: [embed] });
            
            // Auto delete after 10 seconds
            setTimeout(() => {
                reply.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 10000);

        } catch (error) {
            console.error('[DISCORD] UID command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh uid');
        }
    }
};
