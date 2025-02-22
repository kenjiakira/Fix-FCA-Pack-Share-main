const { restartBot } = require('../utils/botManager');
const { logBotEvent } = require('../utils/logs');

module.exports = {
    name: 'rs',
    description: 'Restarts the Discord bot',
    aliases: ['reboot'],
    adminOnly: true,

    async execute(message, args, client) {
        try {
            logBotEvent('RESTART_ATTEMPT', `Restart initiated by ${message.author.tag}`);

            const statusMsg = await message.channel.send('🔄 Đang khởi động lại bot...');
            
            try {
                const timeoutId = setTimeout(async () => {
                    try {
                        await statusMsg.edit('⚠️ Quá trình khởi động lại đang mất nhiều thời gian hơn dự kiến...');
                    } catch (e) {
                        console.error('[RESTART] Error updating timeout message:', e);
                    }
                }, 10000);

                await restartBot(client, statusMsg);
                
                clearTimeout(timeoutId);
            } catch (error) {
                await statusMsg.edit('❌ Có lỗi xảy ra khi khởi động lại bot!');
                console.error('[RESTART] Detailed error:', error);
                throw error;
            }
        } catch (error) {
            console.error('[RESTART] Error executing restart command:', error);
            logBotEvent('RESTART_ERROR', error.message);
            
            try {
                await message.channel.send('❌ Không thể khởi động lại bot. Vui lòng kiểm tra logs để biết thêm chi tiết.');
            } catch (e) {
                console.error('[RESTART] Error sending error message:', e);
            }
        }
    }
};
