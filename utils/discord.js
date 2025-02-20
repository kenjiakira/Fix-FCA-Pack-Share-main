const { Client, GatewayIntentBits } = require('discord.js');

let client = null;

function initDiscordClient(token) {
    if (!client) {
        client = new Client({ 
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages
            ] 
        });
        client.login(token);
    }
    return client;
}

function getDiscordClient() {
    return client;
}

module.exports = {
    initDiscordClient,
    getDiscordClient
};
