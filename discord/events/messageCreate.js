module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        try {
            if (message.author.bot) return;

            if (message.channel.id === '1341367963004960851') {
                // Schedule message deletion
                setTimeout(() => {
                    message.delete().catch(() => {});
                }, 5000);
                
                if (!message.content.toLowerCase().startsWith('.tx')) {
                    return;
                }
            }
            
            const prefix = '.';
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Block other commands in taixiu channel
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
