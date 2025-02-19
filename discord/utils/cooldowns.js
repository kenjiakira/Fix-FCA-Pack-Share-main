const fs = require('fs');
const path = require('path');

const cooldownFile = path.join(__dirname, '../../database/discord/cooldowns.json');

function ensureDirectoryExists() {
    const dir = path.dirname(cooldownFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadCooldowns() {
    try {
        ensureDirectoryExists();
        if (fs.existsSync(cooldownFile)) {
            return JSON.parse(fs.readFileSync(cooldownFile, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('[DISCORD] Error loading cooldowns:', error);
        return {};
    }
}

function saveCooldown(commandName, userID, timestamp) {
    try {
        ensureDirectoryExists();
        const cooldowns = loadCooldowns();
        
        if (!cooldowns[commandName]) {
            cooldowns[commandName] = {};
        }
        
        cooldowns[commandName][userID] = timestamp;
        fs.writeFileSync(cooldownFile, JSON.stringify(cooldowns, null, 2));
    } catch (error) {
        console.error('[DISCORD] Error saving cooldown:', error);
    }
}

function getCooldown(commandName, userID) {
    const cooldowns = loadCooldowns();
    return cooldowns[commandName]?.[userID] || 0;
}

module.exports = {
    loadCooldowns,
    saveCooldown,
    getCooldown
};
