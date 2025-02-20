const { EmbedBuilder } = require('discord.js');
const { logBotEvent } = require('./utils/logs');

async function initializeBot(client) {

    try {
        const taixiuCommand = require('./commands/taixiu');
        const gameChannel = await client.channels.fetch(taixiuCommand.ALLOWED_CHANNEL);
        if (gameChannel) {
            await taixiuCommand.startNewSession(gameChannel);
            logBotEvent('GAME_INIT', '🎲 Tài Xỉu system started successfully');
            console.log(`[TAIXIU] Started auto sessions in channel: ${gameChannel.name}`);
        }
    } catch (error) {
        console.error('[TAIXIU] Failed to start auto sessions:', error);
    }

    try {
        const ticketCommand = require('./commands/ticket');
        const ticketChannel = await client.channels.fetch('1341787957539110973');
        if (ticketChannel) {
            await ticketCommand.createTicketPanel(ticketChannel);
            logBotEvent('TICKET_INIT', '🎫 Ticket system initialized successfully');
            console.log('[TICKET] Panel created in channel:', ticketChannel.name);
        }
    } catch (error) {
        console.error('[TICKET] Failed to initialize ticket system:', error);
    }
}

module.exports = { initializeBot };
