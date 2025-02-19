const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (!command.name || !command.execute) {
                console.log(`[WARNING] Command ${file} missing required properties`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`✓ Loaded command: ${command.name}`);
        } catch (error) {
            console.error(`[ERROR] Failed to load ${file}:`, error);
        }
    }
}

module.exports = { loadCommands };
