const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { DISCORD } = require('../config/api');
const { logBotEvent } = require('./utils/logs');
const { handleListenEvents } = require('./utils/listen');
const { loadData } = require('./utils/currencies');

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
                logBotEvent('COMMAND_LOAD', `Loaded command: ${command.name}${command.noPrefix ? ' (NoPrefix)' : ''}`);
            } else {
                logBotEvent('COMMAND_LOAD_ERROR', `Command at ${filePath} missing required properties`);
            }
        } catch (error) {
            logBotEvent('COMMAND_LOAD_ERROR', `Error loading command ${file}: ${error.message}`);
        }
    }
};

client.once('ready', async () => {
    logBotEvent('BOT_READY', `Logged in as ${client.user.tag}`);
    
    // Load currencies data
    await loadData();
    logBotEvent('DATA_LOAD', 'Currencies data loaded');
    logBotEvent('BOT_INVITE', `Invite link: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`);
    
    client.user.setPresence({
        activities: [{ 
            name: `${DISCORD.PREFIX}help | Bot by ${require('../config/config.json').ownerName}`,
            type: 0
        }],
        status: 'online'
    });

    loadCommands();
        // Initialize Tài Xỉu system
    try {
        const taixiuCommand = require('./commands/taixiu');
        const gameChannel = await client.channels.fetch(taixiuCommand.ALLOWED_CHANNEL);
        if (gameChannel) {
            await taixiuCommand.startNewSession(gameChannel);
            logBotEvent('GAME_INIT', '🎲 Tài Xỉu system started successfully');
            console.log(`[TAIXIU] Started auto sessions in channel: ${gameChannel.name}`);
        } else {
            console.error('[TAIXIU] Could not find game channel!');
        }
    } catch (error) {
        console.error('[TAIXIU] Failed to start auto sessions:', error);
    }

    // Initialize Chẵn Lẻ system
    try {
        const chanleCommand = require('./commands/chanle');
        const gameChannel = await client.channels.fetch(chanleCommand.ALLOWED_CHANNEL);
        if (gameChannel) {
            await chanleCommand.startNewSession(gameChannel);
            logBotEvent('GAME_INIT', '🎲 Chẵn Lẻ system started successfully');
            console.log(`[CHANLE] Started auto sessions in channel: ${gameChannel.name}`);
        }
    } catch (error) {
        console.error('[CHANLE] Failed to start auto sessions:', error);
    }

    const restartFilePath = path.join(__dirname, '../database/discord_restart.json');
    if (fs.existsSync(restartFilePath)) {
        try {
            const restartData = JSON.parse(fs.readFileSync(restartFilePath));
            const guild = await client.guilds.fetch(restartData.guildId);
            const channel = await guild.channels.fetch(restartData.channelId);
            
            if (channel) {
                await channel.send([
                    '✅ Khởi động lại thành công',
                    '━━━━━━━━━━━━━━━━━━',
                    'Bot đã hoạt động trở lại.'
                ].join('\n'));
            }

            fs.unlinkSync(restartFilePath);
        } catch (error) {
            console.error('Error sending restart notification:', error);
        }
    }

    handleListenEvents(client);
});

client.on('error', error => {
    logBotEvent('CLIENT_ERROR', `Discord client error: ${error.message}`);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    try {
        if (newMessage.author.bot) return;
        if (!newMessage.content.startsWith(prefix)) return;

        const args = newMessage.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;

        console.log(`[DISCORD] ${newMessage.author.tag} edited command: ${command}`);
        await client.commands.get(command).execute(newMessage, args);
    } catch (error) {
        console.error('[DISCORD] Error handling edited message:', error);
        await newMessage.reply('❌ Có lỗi xảy ra khi xử lý lệnh đã chỉnh sửa.');
    }
});

const startDiscordBot = () => {
    client.login(DISCORD.TOKEN).catch(err => {
        logBotEvent('LOGIN_ERROR', `Failed to login: ${err.message}`);
    });
};

module.exports = { startDiscordBot };
