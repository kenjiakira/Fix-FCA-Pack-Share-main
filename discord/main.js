const { EmbedBuilder } = require('discord.js');
const { logBotEvent } = require('./utils/logs');
const tradeUtils = require('./utils/tradeUtils');
const { TRADE_CHANNEL } = require('./config/channels');

async function initializeBot(client) {
  
    if (!client.intervals) {
        client.intervals = new Map();
    }

    try {
        const tradeChannel = await client.channels.fetch(TRADE_CHANNEL);
        if (tradeChannel) {
     
            const marketOverview = tradeUtils.createMarketOverviewEmbed();
            let lastMessage = await tradeChannel.send({ embeds: [marketOverview] });

            const tradeInterval = setInterval(async () => {
                try {
                    
                    if (!lastMessage || !lastMessage.editable) {
                        const marketOverview = tradeUtils.createMarketOverviewEmbed();
                        lastMessage = await tradeChannel.send({ embeds: [marketOverview] });
                        return;
                    }

                    const marketOverview = tradeUtils.createMarketOverviewEmbed();
                    await lastMessage.edit({ embeds: [marketOverview] });
                    logBotEvent('TRADE_UPDATE', '📈 Market overview updated');
                } catch (error) {
                    console.error('[TRADE] Update cycle error:', error);
                    logBotEvent('TRADE_ERROR', error.message);
                    
                    try {
                        const marketOverview = tradeUtils.createMarketOverviewEmbed();
                        lastMessage = await tradeChannel.send({ embeds: [marketOverview] });
                    } catch (sendError) {
                        console.error('[TRADE] Failed to send new message:', sendError);
                    }
                }
            }, 5 * 1000); 
            client.intervals.set('tradeUpdates', tradeInterval);

            logBotEvent('TRADE_INIT', '💹 Trade system started successfully');
            console.log('[TRADE] Started auto updates in channel:', tradeChannel.name);
        }
    } catch (error) {
        console.error('[TRADE] Failed to start auto updates:', error);
    }

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

    process.on('SIGTERM', async () => {
        console.log('[TRADE] Received SIGTERM signal, cleaning up...');
        if (client.intervals) {
            for (const [name, interval] of client.intervals) {
                clearInterval(interval);
                console.log(`[TRADE] Cleared interval: ${name}`);
            }
        }
        process.exit(0);
    });
}

module.exports = { initializeBot };
