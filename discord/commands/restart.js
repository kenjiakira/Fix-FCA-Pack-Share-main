const { restartBot } = require('../utils/botManager');

module.exports = {
    name: 'rs',
    description: 'Restarts the Discord bot',
    aliases: ['reboot'],
    adminOnly: true,

    async execute(message, args, client) {
        try {
            await restartBot(client, message);
        } catch (error) {
            console.error('Error executing restart command:', error);
            await message.channel.send('❌ Có lỗi xảy ra khi khởi động lại bot!');
        }
    }
};
