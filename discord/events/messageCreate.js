const { GAME_CHANNELS } = require('../config/channels');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        try {
            if (message.author.bot) return;

            if (message.channel.id === GAME_CHANNELS.TAIXIU || 
                message.channel.id === GAME_CHANNELS.CHANLE) {
                
                const isGameCommand = message.content.startsWith('.tx') || 
                                    message.content.startsWith('.chanle');

                if (!isGameCommand) {
                    try {
                        await message.delete();
                    } catch (error) {
                        console.error('Error deleting message:', error);
                    }
                }
            }

            const prefix = '.';
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (message.channel.id === '1341367963004960851' && commandName !== 'tx') {
                message.reply('❌ Chỉ được sử dụng lệnh tài xỉu trong kênh này!')
                    .then(reply => {
                        setTimeout(() => {
                            reply.delete().catch(() => {});
                        }, 5000);
                    });
                return;
            }

            const command = message.client.commands.get(commandName);
            if (!command) return;

            if (command.permissions) {
                const botPerms = message.channel.permissionsFor(message.client.user);
                if (!botPerms || !command.permissions.every(perm => botPerms.has(perm))) {
                    return message.reply('❌ Bot thiếu quyền để thực hiện lệnh này!')
                        .catch(() => message.author.send('Bot không có quyền gửi tin nhắn trong kênh đó.'));
                }
            }

            try {
                await command.execute(message, args);
            } catch (error) {
                console.error(error);
                message.reply('❌ Có lỗi xảy ra khi thực thi lệnh!')
                    .catch(console.error);
            }
            
        } catch (error) {
            console.error('Message handler error:', error);
        }
    },
};
