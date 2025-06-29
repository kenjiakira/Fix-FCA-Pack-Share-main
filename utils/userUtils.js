const fs = require('fs');
const path = require('path');

/**
 * Get user name from rankData.json
 * @param {string} userID - User ID to get name for
 * @returns {string} User name or "Người dùng" if not found
 */
function getUserName(userID) {
    const userDataPath = path.join(__dirname, '../database/rankData.json');
    try {
        if (!fs.existsSync(userDataPath)) {
            return "Người dùng";
        }
        const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        return userData[userID]?.name || "Người dùng";
    } catch (error) {
        console.error("Error reading userData:", error);
        return "Người dùng";
    }
}

module.exports = {
    getUserName
};
