const { logBotEvent } = require('./logs');
const fs = require('fs');
const path = require('path');

async function shutdownBot(client) {
    try {
        // Log shutdown event
        logBotEvent('BOT_SHUTDOWN', 'Discord bot shutting down...');

        // Clear any active intervals/timeouts
        for (const [_, interval] of client.intervals || []) {
            clearInterval(interval);
        }
        for (const [_, timeout] of client.timeouts || []) {
            clearTimeout(timeout);
        }

        const restartFlagPath = path.join(__dirname, '../../database/discord_restart.json');
        fs.writeFileSync(restartFlagPath, JSON.stringify({ timestamp: Date.now() }));

        if (client.isReady()) {
            await client.destroy();
            logBotEvent('BOT_SHUTDOWN', 'Discord client destroyed successfully');
        }

        setTimeout(() => {
            console.log('Force exiting Discord bot...');
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error('Error during Discord bot shutdown:', error);
        process.exit(1);
    }
}

module.exports = { shutdownBot };
