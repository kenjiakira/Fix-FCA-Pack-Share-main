const fs = require('fs');
const path = require('path');

const discordDataFile = path.join(__dirname, '../../database/discord/discord_currencies.json');
let discordBalance = {};

async function loadData() {
    try {
        if (fs.existsSync(discordDataFile)) {
            const data = JSON.parse(await fs.promises.readFile(discordDataFile, 'utf8'));
            discordBalance = data.balance || {};
        }
    } catch (error) {
        console.error("Error loading Discord balance data:", error);
        discordBalance = {};
    }
}

async function saveData() {
    try {
        await fs.promises.writeFile(discordDataFile, JSON.stringify({
            balance: discordBalance
        }, null, 2));
    } catch (error) {
        console.error("Error saving Discord balance data:", error);
    }
}

function getBalance(discordId) {
    return discordBalance[discordId] || 0;
}

function setBalance(discordId, amount) {
    discordBalance[discordId] = amount;
    saveData();
    return true;
}

function updateBalance(discordId, amount) {
    discordBalance[discordId] = (discordBalance[discordId] || 0) + amount;
    saveData();
    return true;
}

function allBalances() {
    return discordBalance;
}

loadData();

module.exports = {
    getBalance,
    setBalance,
    updateBalance,
    allBalances,
    loadData,
    saveData
};
