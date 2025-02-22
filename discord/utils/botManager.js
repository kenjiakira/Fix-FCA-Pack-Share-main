const { logBotEvent } = require('./logs');
const { loadCommands } = require('./loadCommands');
const fs = require('fs');
const path = require('path');

function isDebugMode() {
    return process.env.NODE_ENV === 'development' || !!process.env.DEBUG;
}

function saveRestartState() {
    const restartFlagPath = path.join(__dirname, '../../database/discord_restart.json');
    fs.writeFileSync(restartFlagPath, JSON.stringify({ 
        timestamp: Date.now(),
        isDebug: isDebugMode()
    }));
}

async function cleanupResources(client) {
    try {
        if (client.commands) {
            try {
                const tradeCommand = client.commands.get('trade');
                if (tradeCommand?.onLoad) {
                    await tradeCommand.onLoad(client);
                }
            } catch (error) {
                console.error('[CLEANUP] Error cleaning trade messages:', error);
            }
        }

        if (client.intervals?.size > 0) {
            for (const [name, interval] of client.intervals.entries()) {
                clearInterval(interval);
                console.log(`[CLEANUP] Cleared interval: ${name}`);
            }
            client.intervals.clear();
        }
        
        if (client.timeouts?.size > 0) {
            for (const [name, timeout] of client.timeouts.entries()) {
                clearTimeout(timeout);
                console.log(`[CLEANUP] Cleared timeout: ${name}`);
            }
            client.timeouts.clear();
        }

        try {
            if (client.isReady()) {
                await client.destroy();
                console.log('[CLEANUP] Discord client destroyed');
            }
        } catch (error) {
            console.error('[CLEANUP] Error destroying client:', error);
        }

        return true;
    } catch (error) {
        console.error('[CLEANUP] Error during cleanup:', error);
        return false;
    }
}

async function shutdownBot(client, isRestart = false) {
    try {
        const action = isRestart ? 'restart' : 'shutdown';
        console.log(`[BOT] Initiating ${action}...`);
        logBotEvent(`BOT_${action.toUpperCase()}`, `Discord bot ${action} initiated`);

        saveRestartState();

        const cleanupSuccess = await cleanupResources(client);
        
        if (cleanupSuccess) {
            logBotEvent(`BOT_${action.toUpperCase()}`, 'Discord client cleanup successful');
            
            if (isDebugMode()) {
                process.kill(process.pid, 'SIGTERM');
                return;
            }

            process.exit(0);
        } else {
            console.log(`[BOT] Forcing ${action} in 5 seconds...`);
            setTimeout(() => {
                process.exit(1);
            }, 5000);
        }

    } catch (error) {
        console.error(`[BOT] Error during ${isRestart ? 'restart' : 'shutdown'}:`, error);
        logBotEvent('BOT_ERROR', error.message);
        
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}

async function restartBot(client, statusMsg = null) {
    try {
        if (!client) {
            throw new Error('Client is required for restart');
        }

        if (statusMsg) {
            await statusMsg.edit('🔄 Đang dọn dẹp tài nguyên...');
        }

        saveRestartState();

        const cleanupSuccess = await cleanupResources(client);
        if (!cleanupSuccess) {
            throw new Error('Failed to clean up resources');
        }

        if (statusMsg) {
            await statusMsg.edit('🔄 Đang khởi động lại...');
        }

        const { spawnNewProcess } = require('./processManager');
        const newProcess = spawnNewProcess();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        process.exit(0);
    } catch (error) {
        console.error('[BOT] Error restarting bot:', error);
        logBotEvent('RESTART_ERROR', error.message);
        if (statusMsg) {
            await statusMsg.edit('❌ Có lỗi xảy ra khi khởi động lại bot!');
        }
        throw error;
    }
}

module.exports = {
    shutdownBot,
    restartBot,
    isDebugMode
};
