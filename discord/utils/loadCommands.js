const fs = require('fs');
const path = require('path');
const { logBotEvent } = require('./logs');

function loadCommands(client) {
    try {
        client.commands.clear();

        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                
                delete require.cache[require.resolve(filePath)];
                
                const command = require(filePath);
                
                if ('name' in command && 'execute' in command) {
                    client.commands.set(command.name, command);
                    
                    if (command.aliases) {
                        command.aliases.forEach(alias => {
                            client.commands.set(alias, command);
                        });
                    }

                    if (typeof command.onLoad === 'function') {
                        command.onLoad(client);
                    }

                    logBotEvent('COMMAND_LOAD', `Loaded command: ${command.name}`);
                }
            } catch (error) {
                logBotEvent('COMMAND_LOAD_ERROR', `Error loading ${file}: ${error.message}`);
            }
        }

        return true;
    } catch (error) {
        logBotEvent('COMMANDS_LOAD_ERROR', `Failed to load commands: ${error.message}`);
        return false;
    }
}

module.exports = { loadCommands };
