const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot',
    usage: 'ping',
    noPrefix: true,
    execute: async function(message, args) {
        try {
            const sent = await message.channel.send('📡 Đang kiểm tra độ trễ...');

            const roundtripLatency = sent.createdTimestamp - message.createdTimestamp;

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🏓 Pong!')
                .addFields([
                    { 
                        name: '📶 Độ trễ Bot', 
                        value: `\`${roundtripLatency}ms\``,
                        inline: true 
                    },
                    { 
                        name: '💓 Độ trễ WebSocket', 
                        value: `\`${message.client.ws.ping}ms\``,
                        inline: true 
                    }
                ])
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            await sent.edit({ 
                content: null,
                embeds: [embed] 
            });

            setTimeout(() => {
                sent.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 10000);

        } catch (error) {
            console.error('[DISCORD] Ping command error:', error);
            const errorMsg = await message.channel.send('❌ Đã xảy ra lỗi khi thực hiện lệnh ping');
            setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
        }
    }
};
