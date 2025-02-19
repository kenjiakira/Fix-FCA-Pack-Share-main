const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tid',
    description: 'Lấy ID của kênh/thread',
    usage: 'tid [#channel]',
    noPrefix: true,
    execute: async function(message) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🔍 Channel/Thread ID Checker')
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            if (message.mentions.channels.size > 0) {
                const mentionedChannel = message.mentions.channels.first();
                embed.setDescription(`ID của #${mentionedChannel.name}: \`${mentionedChannel.id}\``);
            } else {
                const currentChannel = message.channel;
                let channelType = currentChannel.isThread() ? 'Thread' : 'Channel';
                embed.setDescription(`ID của ${channelType} hiện tại: \`${currentChannel.id}\``);
            }

            const reply = await message.reply({ embeds: [embed] });
            
            // Auto delete after 10 seconds
            setTimeout(() => {
                reply.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 10000);

        } catch (error) {
            console.error('[DISCORD] TID command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh tid');
        }
    }
};
