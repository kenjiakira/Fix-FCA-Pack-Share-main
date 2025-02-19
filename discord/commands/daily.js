const { addBalance, getBalance } = require('../utils/currencies');
const { saveCooldown, getCooldown } = require('../utils/cooldowns');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Nhận phần thưởng hàng ngày',
    usage: 'daily',
    execute: async function(message, args) {
        try {
            const userID = message.author.id;
            const now = Date.now();
            const cooldownTime =  1 * 1000;
            const lastClaim = getCooldown('daily', userID);

            if (lastClaim) {
                const timeLeft = lastClaim + cooldownTime - now;
                
                if (timeLeft > 0) {
                    const hoursLeft = Math.floor(timeLeft / 3600000);
                    const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);
                    
                    const embedCooldown = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏳ Daily Cooldown')
                        .setDescription(`Vui lòng đợi ${hoursLeft} giờ ${minutesLeft} phút nữa để nhận thưởng!`)
                        .setFooter({ text: `Requested by ${message.author.tag}` })
                        .setTimestamp();

                    return message.reply({ embeds: [embedCooldown] });
                }
            }

            const baseReward = Math.floor(Math.random() * (50000000 - 30000000 + 1) + 30000000);
            const dayBonus = new Date().getDay() === 0 ? 1.5 : 1.0;
            const finalReward = Math.floor(baseReward * dayBonus);

            addBalance(userID, finalReward);
            saveCooldown('daily', userID, now);

            const newBalance = getBalance(userID);
            
            const embedReward = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💰 Daily Reward')
                .setDescription('Bạn đã nhận phần thưởng hàng ngày!')
                .addFields([
                    { 
                        name: '💵 Phần thưởng', 
                        value: `${finalReward.toLocaleString('vi-VN')} xu`,
                        inline: true
                    },
                    { 
                        name: '💰 Số dư hiện tại', 
                        value: `${newBalance.toLocaleString('vi-VN')} xu`,
                        inline: true
                    }
                ])
                .setFooter({ text: dayBonus > 1 ? '🎉 Chủ nhật: Thưởng thêm 50%!' : `Requested by ${message.author.tag}` })
                .setTimestamp();

            return message.reply({ embeds: [embedReward] });

        } catch (error) {
            console.error('[DISCORD] Daily command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi nhận thưởng hàng ngày.');
        }
    }
};
