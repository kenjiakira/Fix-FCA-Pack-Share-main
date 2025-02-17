const { writeFileSync, existsSync, readFileSync } = require('fs');
const path = require('path');

async function createUserData(userID) {
    const userDataPath = path.join(__dirname, '..', 'database', 'users.json');
    
    try {
        let userData = {};
        if (existsSync(userDataPath)) {
            userData = JSON.parse(readFileSync(userDataPath, 'utf8'));
        }

        if (!userData[userID]) {
            userData[userID] = {
                money: 0,
                lastWorked: 0,
                quests: {},
                created: Date.now()
            };
            writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
        }
        
        return userData[userID];
    } catch (error) {
        throw new Error('Failed to create/verify user data');
    }
}

module.exports = {
    createUserData
};
