const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { DISCORD } = require('../config/api');
const { logBotEvent } = require('./utils/logs');
const { handleListenEvents } = require('./utils/listen');
const { loadData } = require('./utils/currencies');
const { initializeBot } = require('./main');
const { shutdownBot, isDebugMode } = require('./utils/botManager');
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

client.commands = new Collection();
client.intervals = new Map();
client.timeouts = new Map();

const loadCommands = () => {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            
            if ('name' in command && 'execute' in command) {
                client.commands.set(command.name, command);
                if (command.aliases) {
                    command.aliases.forEach(alias => {
                        client.commands.set(alias, command);
                    });
                }
                logBotEvent('COMMAND_LOAD', `Loaded command: ${command.name}`);
            }
        } catch (error) {
            logBotEvent('COMMAND_LOAD_ERROR', `Error loading command ${file}: ${error.message}`);
        }
    }
};

async function initializeChannels(client) {
    try {
        const taixiuCommand = client.commands.get('taixiu');
        if (taixiuCommand) {
            const taixiuChannel = client.channels.cache.get(taixiuCommand.ALLOWED_CHANNEL);
            if (taixiuChannel) {
                setTimeout(async () => {
                    await taixiuCommand.startNewSession(taixiuChannel);
                    console.log('✓ Taixiu channel initialized');
                }, 5000);
            }
        }

        const nitroCommand = client.commands.get('nitro');
        if (nitroCommand) {
            const nitroChannel = client.channels.cache.get(nitroCommand.NITRO_CHANNEL_ID);
            if (nitroChannel) {
                await nitroCommand.initNitroChannel(nitroChannel);
                console.log('✓ Nitro channel initialized');
            }
        }
        
        let lastCheck = Date.now();
        let isRestarting = false;

        const monitorInterval = setInterval(async () => {
            try {
                if (isRestarting) return;
                
                const now = Date.now();
                if (now - lastCheck < 25000) return;
                lastCheck = now;

                const taixiuChannel = client.channels.cache.get(taixiuCommand?.ALLOWED_CHANNEL);
                const currentSession = taixiuCommand?.getCurrentSession?.();
                
                if (taixiuCommand && taixiuChannel) {
                    if (currentSession && !currentSession.active && 
                        Date.now() - currentSession.endTime > 60000) {
                        isRestarting = true;
                        console.log('[TAIXIU] Restarting inactive session...');
                        try {
                            await taixiuCommand.startNewSession(taixiuChannel);
                            console.log('[TAIXIU] Session restarted successfully');
                        } catch (error) {
                            console.error('[TAIXIU] Failed to restart session:', error);
                        }
                        isRestarting = false;
                    }
                }

                const ticketCommand = client.commands.get('ticket');
                const ticketChannel = client.channels.cache.get('1341787957539110973');
                
                if (ticketCommand && ticketChannel) {
                    const messages = await ticketChannel.messages.fetch({ limit: 1 });
                    if (!messages.size) {
                        console.log('[TICKET] Recreating ticket panel...');
                        try {
                            await ticketCommand.createTicketPanel(ticketChannel);
                            console.log('[TICKET] Panel recreated successfully');
                        } catch (error) {
                            console.error('[TICKET] Failed to recreate panel:', error);
                        }
                    }
                }

            } catch (error) {
                console.error('Error in system monitor:', error);
                isRestarting = false;
            }
        }, 30000);

        client.intervals.set('monitor', monitorInterval);

    } catch (error) {
        console.error('Error initializing channels:', error);
        const retryTimeout = setTimeout(() => initializeChannels(client), 60000);
        client.timeouts.set('channelRetry', retryTimeout);
    }
}

client.once('ready', async () => {
    logBotEvent('BOT_READY', `Logged in as ${client.user.tag}`);
    
    await loadData();
    loadCommands();
    await initializeBot(client);
    await initializeChannels(client);

    client.user.setPresence({
        activities: [{ 
            name: `${DISCORD.PREFIX}help | Bot by ${require('../config/config.json').ownerName}`,
            type: 0
        }],
        status: 'online'
    });

    handleListenEvents(client);
});

client.on('error', error => {
    logBotEvent('CLIENT_ERROR', `Discord client error: ${error.message}`);
});

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('ticket_') || 
            ['close_ticket', 'confirm_close', 'cancel_close'].includes(interaction.customId)) {
            const ticketCommand = client.commands.get('ticket');
            if (ticketCommand) {
                try {
                    await ticketCommand.handleInteraction(interaction);
                } catch (error) {
                    console.error('[TICKET] Interaction error:', error);
                    logBotEvent('TICKET_ERROR', `Error handling ticket interaction: ${error.message}`);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Có lỗi xảy ra khi xử lý ticket! Vui lòng thử lại sau.',
                            flags: ['Ephemeral']
                        }).catch(console.error);
                    }
                }
            }
            return;
        }

        if (interaction.customId.startsWith('bet_')) {
            const taixiuCommand = client.commands.get('taixiu');
            if (taixiuCommand) {
                try {
                    await taixiuCommand.handleInteraction(interaction);
                } catch (error) {
                    console.error('[TAIXIU] Interaction error:', error);
                    logBotEvent('TAIXIU_ERROR', `Error handling bet interaction: ${error.message}`);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Có lỗi xảy ra khi đặt cược! Vui lòng thử lại sau.',
                            flags: ['Ephemeral']
                        }).catch(console.error);
                    }
                }
            }
            return;
        }

    } catch (error) {
        console.error('Error in interaction handler:', error);
        logBotEvent('INTERACTION_ERROR', `General interaction error: ${error.message}`);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Đã xảy ra lỗi, vui lòng thử lại sau!',
                flags: ['Ephemeral']
            }).catch(console.error);
        }
    }
});

// Handle process signals
process.on('SIGINT', async () => {
    console.log('Received SIGINT signal');
    await shutdownBot(client);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal');
    await shutdownBot(client);
});

// Handle debug mode termination
if (isDebugMode()) {
    process.on('SIGUSR2', async () => {
        console.log('Received SIGUSR2 signal (nodemon restart)');
        await shutdownBot(client);
    });
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    logBotEvent('UNCAUGHT_ERROR', `${error.message}\n${error.stack}`);
    await shutdownBot(client);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logBotEvent('UNHANDLED_REJECTION', `${reason}`);
    await shutdownBot(client);
});

const startDiscordBot = () => {
    client.login(DISCORD.TOKEN).catch(err => {
        logBotEvent('LOGIN_ERROR', `Failed to login: ${err.message}`);
        process.exit(1);
    });
};

if (require.main === module) {
    startDiscordBot();
} else {
    module.exports = { startDiscordBot };
}
