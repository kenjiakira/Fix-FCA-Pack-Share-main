const fs = require('fs');

function isThreadAdmin(senderID, threadID) {
    try {
        const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8")) || {};
       
        console.log(`Checking admin for ${senderID} in thread ${threadID}`);
        console.log('Thread data:', threadsDB[threadID]?.adminIDs);
        
        return !!(threadsDB[threadID]?.adminIDs && 
                 threadsDB[threadID].adminIDs.some(admin => admin.id.toString() === senderID.toString()));
    } catch (error) {
        console.error("Error checking thread admin:", error);
        return false;
    }
}

function isBotAdmin(senderID) {
    try {
        const adminConfig = JSON.parse(fs.readFileSync("./admin.json", "utf8"));
       
        return Array.isArray(adminConfig.adminUIDs) && 
               adminConfig.adminUIDs.map(id => id.toString()).includes(senderID.toString());
    } catch (error) {
        console.error("Error checking bot admin:", error);
        return false;
    }
}

function hasPermission(senderID, threadID) {
    // Log để debug
    const isAdmin = isThreadAdmin(senderID, threadID);
    const isBAdmin = isBotAdmin(senderID);
    console.log(`Permission check for ${senderID} in ${threadID}:`, {
        isThreadAdmin: isAdmin,
        isBotAdmin: isBAdmin,
        hasPermission: isAdmin || isBAdmin
    });
    return isAdmin || isBAdmin;
}

module.exports = {
    isThreadAdmin,
    isBotAdmin,
    hasPermission
};
