const fs = require('fs');
const path = require('path');

function getName(userId) {
    try {
        const usersPath = path.join(__dirname, '../database/users.json');
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        if (users[userId]) {
            return users[userId].name || "Facebook User";
        }
        
        return "Facebook User";
    } catch (error) {
        console.error('Error getting user name:', error);
        return "Facebook User";
    }
}

module.exports = getName;