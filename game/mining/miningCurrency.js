const fs = require('fs');
const path = require('path');

const MINING_CURRENCY_FILE = path.join(__dirname, '../../commands/json/mining_currency.json');

// Initialize currency file
if (!fs.existsSync(MINING_CURRENCY_FILE)) {
    fs.writeFileSync(MINING_CURRENCY_FILE, JSON.stringify({}, null, 2));
}

function getMiningBalance(userId) {
    try {
        const data = JSON.parse(fs.readFileSync(MINING_CURRENCY_FILE, 'utf8'));
        return data[userId] || 0;
    } catch {
        return 0;
    }
}

function updateMiningBalance(userId, amount) {
    try {
        const data = JSON.parse(fs.readFileSync(MINING_CURRENCY_FILE, 'utf8'));
        if (!data[userId]) data[userId] = 0;
        data[userId] += amount;
        if (data[userId] < 0) data[userId] = 0;
        fs.writeFileSync(MINING_CURRENCY_FILE, JSON.stringify(data, null, 2));
        return data[userId];
    } catch (error) {
        console.error('Error updating mining balance:', error);
        return 0;
    }
}

module.exports = {
    getMiningBalance,
    updateMiningBalance
};
