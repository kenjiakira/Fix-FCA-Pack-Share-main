const fs = require('fs');
const path = require('path');

// Update path to be relative to project root
const discordDataFile = path.join(__dirname, '../../database/discord/discord_currencies.json');
let discordBalance = {};

function ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
}

function loadData() {
    try {
        ensureDirectoryExists(discordDataFile);
        if (fs.existsSync(discordDataFile)) {
            const data = JSON.parse(fs.readFileSync(discordDataFile, 'utf8'));
            discordBalance = data.balance || {};
        }
    } catch (error) {
        console.error('[DISCORD] Error loading currency data:', error);
        discordBalance = {};
    }
}

function saveData() {
    try {
        ensureDirectoryExists(discordDataFile);
        const data = { balance: discordBalance };
        fs.writeFileSync(discordDataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('[DISCORD] Error saving currency data:', error);
    }
}

function getBalance(userID) {
    return discordBalance[userID] || 0;
}

function setBalance(userID, amount) {
    discordBalance[userID] = amount;
    saveData();
}

function addBalance(userID, amount) {
    discordBalance[userID] = (discordBalance[userID] || 0) + amount;
    saveData();
}

loadData();

module.exports = {
    loadData,
    saveData,
    getBalance,
    setBalance,
    addBalance
};
