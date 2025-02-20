const { logBotEvent } = require('./logs');
const fs = require('fs');
const path = require('path');

// Check if we're in debug/development mode
function isDebugMode() {
    return process.env.NODE_ENV === 'development' || !!process.env.DEBUG;
}

// Handle debug mode exit
function handleDebugExit() {
    if (isDebugMode()) {
        process.kill(process.pid, 'SIGTERM');
        return true;
    }
    return false;
}

// Save restart state
function saveRestartState() {
    const restartFlagPath = path.join(__dirname, '../../database/discord_restart.json');
    fs.writeFileSync(restartFlagPath, JSON.stringify({ 
        timestamp: Date.now(),
        isDebug: isDebugMode()
    }));
}

// Clean up resources
async function cleanupResources(client) {
    // Clear intervals
    for (const [_, interval] of client.intervals || []) {
        clearInterval(interval);
    }
    
    // Clear timeouts
    for (const [_, timeout] of client.timeouts || []) {
        clearTimeout(timeout);
    }

    // Destroy client connection if active
    if (client.isReady()) {
        await client.destroy();
    }
}

// Main shutdown function
async function shutdownBot(client, isRestart = false) {
    try {
        const action = isRestart ? 'restart' : 'shutdown';
        logBotEvent(`BOT_${action.toUpperCase()}`, `Discord bot ${action} initiated`);

        // Save state before cleanup
        saveRestartState();

        // Clean up resources
        await cleanupResources(client);
        
        logBotEvent(`BOT_${action.toUpperCase()}`, 'Discord client destroyed successfully');

        // Handle debug mode exit
        if (handleDebugExit()) {
            return;
        }

        // Force exit after 5 seconds if graceful shutdown fails
        setTimeout(() => {
            console.log(`Force exiting Discord bot (${action})...`);
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error(`Error during Discord bot ${isRestart ? 'restart' : 'shutdown'}:`, error);
        logBotEvent('BOT_ERROR', error.message);
        
        if (isDebugMode()) {
            process.kill(process.pid, 'SIGTERM');
        } else {
            process.exit(1);
        }
    }
}

// Restart function
async function restartBot(client, message = null) {
    try {
        if (message) {
            await message.channel.send('🔄 Đang khởi động lại bot...');
        }
        
        await shutdownBot(client, true);
        
        // Process will be restarted by external process manager or debug tools
        if (isDebugMode()) {
            process.kill(process.pid, 'SIGTERM');
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error restarting bot:', error);
        logBotEvent('RESTART_ERROR', error.message);
        if (message) {
            await message.channel.send('❌ Có lỗi xảy ra khi khởi động lại bot!');
        }
        throw error;
    }
}

module.exports = {
    shutdownBot,
    restartBot,
    isDebugMode,
    handleDebugExit
};
