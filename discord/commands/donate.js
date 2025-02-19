const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'donate',
    description: 'Xem thông tin ủng hộ bot',
    usage: 'donate',
    cooldown: 5,

    execute: async function(message) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0xFFC0CB) 
                .setTitle('💝 Ủng Hộ Bot 💝')
                .setDescription([
                    '```Mỗi đóng góp của bạn giúp bot phát triển tốt hơn!```',
                    '',
                    '**👤 Thông Tin Chủ Bot**',
                    '`🔰 Chủ tài khoản:` HOANG NGOC TU',
                ].join('\n'))
                .addFields([
                    {
                        name: '🏦 Ngân Hàng',
                        value: [
                            '```',
                            '🔸 VIETINBANK',
                            '  └── STK: 0354683398',
                            '  └── CTK: HOANG NGOC TU',
                            '```'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📱 Ví Điện Tử',
                        value: [
                            '```',
                            '🔸 MOMO',
                            '  └── SĐT: 0354683398',
                            '  └── CTK: HOANG NGOC TU',
                            '```'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💌 Lời Nhắn',
                        value: [
                            '```fix',
                            '✨ Cảm ơn bạn đã quan tâm và ủng hộ!',
                            '💕 Mọi sự đóng góp đều được ghi nhận',
                            '🎁 Donate để nhận quà từ admin nha!',
                            '```'
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setImage('https://imgur.com/FMLKCju.gif') 
                .setFooter({
                    text: 'Developed with ❤️ by HNT',
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setTimestamp();

            const msg = await message.reply({ embeds: [embed] });

            const reactions = ['💝', '🎁', '💖'];
            for (const reaction of reactions) {
                await msg.react(reaction);
            }

        } catch (error) {
            console.error('[DISCORD] Donate command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    }
};
