const { logBotEvent } = require('./logs');

async function handleInteraction(interaction, client) {
    if (!interaction.isButton()) return;

    try {
        let command = null;
        let errorMessage = '❌ Đã xảy ra lỗi, vui lòng thử lại!';

        if (interaction.customId.startsWith('ticket_') || 
            ['close_ticket', 'confirm_close', 'cancel_close'].includes(interaction.customId)) {
            command = client.commands.get('ticket');
            errorMessage = '❌ Có lỗi xảy ra khi xử lý ticket! Vui lòng thử lại sau hoặc liên hệ admin.';
        }

        else if (interaction.customId.startsWith('bet_')) {
            command = client.commands.get('taixiu');
            errorMessage = '❌ Có lỗi xảy ra khi đặt cược!';
        }

        if (!command) return;

        try {
            await command.handleInteraction(interaction);
        } catch (error) {
            // Log detailed error information
            console.error(`[${command.name.toUpperCase()}] Interaction error:`, {
                error: error.message,
                stack: error.stack,
                command: command.name,
                user: interaction.user.tag,
                channel: interaction.channel?.name || 'Unknown',
                customId: interaction.customId
            });

            // Log to bot events with more context
            logBotEvent('INTERACTION_ERROR', 
                `Error in ${command.name} (${interaction.customId}): ${error.message}\nStack: ${error.stack}`
            );
            
            // Send user-friendly error message
            let userMessage = errorMessage;
            if (error.message.includes('permissions')) {
                userMessage = '❌ Bot không có đủ quyền để thực hiện hành động này. Vui lòng kiểm tra quyền của bot.';
            } else if (error.message.includes('rate limit')) {
                userMessage = '❌ Bạn đang thực hiện quá nhiều hành động. Vui lòng thử lại sau ít phút.';
            }

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: userMessage,
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.editReply({
                    content: userMessage,
                    ephemeral: true
                }).catch(() => {});
            }
        }
    } catch (error) {
        // Log general handler errors
        console.error('Error in interaction handler:', {
            error: error.message,
            stack: error.stack,
            interaction: interaction.customId,
            user: interaction.user.tag
        });

        logBotEvent('INTERACTION_HANDLER_ERROR', 
            `General error: ${error.message}\nStack: ${error.stack}`
        );

        // Attempt to notify user
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Đã xảy ra lỗi không mong muốn. Hệ thống vẫn đang hoạt động, vui lòng thử lại sau.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ Đã xảy ra lỗi không mong muốn. Hệ thống vẫn đang hoạt động, vui lòng thử lại sau.',
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
}

module.exports = { handleInteraction };
