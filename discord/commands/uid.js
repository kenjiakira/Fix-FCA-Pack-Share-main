const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const linksFile = path.join(__dirname, '../../database/discord_links.json');

function getLinkedMessengerId(discordId) {
    try {
        const links = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
        const link = links.links.find(l => l.discordId === discordId);
        return link ? link.messengerId : null;
    } catch {
        return null;
    }
}

module.exports = {
    name: 'uid',
    description: 'Kiểm tra ID và trạng thái liên kết tài khoản',
    usage: 'uid [@mention]',
    noPrefix: true,
    execute: async function(message) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🔍 Kiểm Tra ID & Liên Kết')
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            const targetUser = message.mentions.users.first() || message.author;
            const linkedId = getLinkedMessengerId(targetUser.id);

            const fields = [
                { name: '👤 Discord ID', value: `\`${targetUser.id}\``, inline: true },
                { name: '🔗 Trạng thái', value: linkedId ? '✅ Đã liên kết' : '❌ Chưa liên kết', inline: true }
            ];

            if (linkedId) {
                fields.push({ name: '📱 Messenger ID', value: `\`${linkedId}\``, inline: true });
            } else {
                fields.push({ 
                    name: '📝 Hướng dẫn liên kết', 
                    value: '1. Vào Messenger\n2. Chat với bot: `.link ' + targetUser.id + '`', 
                    inline: false 
                });
            }

            embed.setDescription(`Thông tin của ${targetUser}`)
                 .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                 .addFields(fields);

            const reply = await message.reply({ embeds: [embed] });
            
            setTimeout(() => {
                reply.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 30000);

        } catch (error) {
            console.error('[DISCORD] UID command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh uid');
        }
    }
};
