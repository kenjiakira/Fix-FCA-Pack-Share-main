/**
 * NSFW Command Handling Utility
 * 
 * This utility handles NSFW (Not Safe For Work) commands in the bot.
 * It provides functions to check if a command is NSFW and to handle NSFW command access.
 */

const fs = require('fs');
const path = require('path');

// Path to store NSFW settings
const nsfwSettingsPath = path.join(__dirname, '../commands/json/nsfw_settings.json');

// Make sure the directory exists
const ensureDirectoryExists = (filePath) => {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
        console.log(`Created directory: ${dirname}`);
    }
    return true;
};

// Initialize or load NSFW settings
const loadNSFWSettings = () => {
    try {
        // If the file exists, load it
        if (fs.existsSync(nsfwSettingsPath)) {
            console.log(`Loading NSFW settings from ${nsfwSettingsPath}`);
            return JSON.parse(fs.readFileSync(nsfwSettingsPath, 'utf8'));
        }
        
        // Default settings if file doesn't exist
        const defaultSettings = {
            enabledThreads: {},  // Threads where NSFW is enabled
            blockedUsers: {},    // Users blocked from using NSFW commands
            adminBypass: true,   // Admins can bypass NSFW restrictions
            modBypass: true      // Moderators can bypass NSFW restrictions
        };
        
        // Ensure the directory exists before writing
        ensureDirectoryExists(nsfwSettingsPath);
        
        console.log(`Creating default NSFW settings at ${nsfwSettingsPath}`);
        fs.writeFileSync(nsfwSettingsPath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    } catch (error) {
        console.error("Error loading NSFW settings:", error);
        return {
            enabledThreads: {},
            blockedUsers: {},
            adminBypass: true,
            modBypass: true
        };
    }
};

// Save NSFW settings
const saveNSFWSettings = (settings) => {
    try {
        ensureDirectoryExists(nsfwSettingsPath);
        fs.writeFileSync(nsfwSettingsPath, JSON.stringify(settings, null, 2));
        console.log(`Saved NSFW settings to ${nsfwSettingsPath}`);
        return true;
    } catch (error) {
        console.error("Error saving NSFW settings:", error);
        return false;
    }
};

/**
 * Enable or disable NSFW commands in a thread
 * @param {string} threadID - The thread ID
 * @param {boolean} enabled - Whether to enable or disable NSFW commands
 * @returns {boolean} - Success status
 */
const setThreadNSFWStatus = (threadID, enabled) => {
    const settings = loadNSFWSettings();
    if (enabled) {
        settings.enabledThreads[threadID] = true;
    } else {
        delete settings.enabledThreads[threadID];
    }
    return saveNSFWSettings(settings);
};

/**
 * Block or unblock a user from using NSFW commands
 * @param {string} userID - The user ID
 * @param {boolean} blocked - Whether to block or unblock
 * @returns {boolean} - Success status
 */
const setUserNSFWBlock = (userID, blocked) => {
    const settings = loadNSFWSettings();
    if (blocked) {
        settings.blockedUsers[userID] = true;
    } else {
        delete settings.blockedUsers[userID];
    }
    return saveNSFWSettings(settings);
};

/**
 * Check if NSFW commands are allowed for a specific user in a specific thread
 * @param {string} threadID - The thread ID
 * @param {string} userID - The user ID
 * @param {Object} adminConfig - Admin configuration
 * @returns {Object} - Status and reason
 */
const isNSFWAllowed = (threadID, userID, adminConfig) => {
    const settings = loadNSFWSettings();
    
    // Check if user is blocked
    if (settings.blockedUsers && settings.blockedUsers[userID]) {
        console.log(`User ${userID} is blocked from using NSFW commands`);
        return { allowed: false, reason: "USER_BLOCKED" };
    }
    
    // Check if user is admin and can bypass
    const isAdmin = adminConfig.adminUIDs?.includes(userID);
    if (isAdmin && settings.adminBypass) {
        console.log(`Admin ${userID} is bypassing NSFW restrictions`);
        return { allowed: true, reason: "ADMIN_BYPASS" };
    }
    
    // Check if user is moderator and can bypass
    const isMod = adminConfig.moderatorUIDs?.includes(userID);
    if (isMod && settings.modBypass) {
        console.log(`Moderator ${userID} is bypassing NSFW restrictions`);
        return { allowed: true, reason: "MOD_BYPASS" };
    }
    
    // Check if thread has NSFW enabled
    if (!settings.enabledThreads || !settings.enabledThreads[threadID]) {
        console.log(`Thread ${threadID} has not enabled NSFW commands`);
        return { allowed: false, reason: "THREAD_DISABLED" };
    }
    
    console.log(`NSFW command allowed in thread ${threadID} for user ${userID}`);
    return { allowed: true, reason: "THREAD_ENABLED" };
};

/**
 * Check if a command is NSFW
 * @param {Object} command - Command object
 * @returns {boolean} - Whether the command is NSFW
 */
const isNSFWCommand = (command) => {
    const result = command && command.nsfw === true;
    if (result) {
        console.log(`Command ${command.name} is marked as NSFW`);
    }
    return result;
};

/**
 * Get friendly response message based on NSFW check result
 * @param {Object} result - Result from isNSFWAllowed
 * @returns {string} - Friendly message
 */
const getNSFWResponseMessage = (result) => {
    switch (result.reason) {
        case "USER_BLOCKED":
            return "⛔ Bạn đã bị chặn sử dụng các lệnh NSFW.";
        case "THREAD_DISABLED":
            return "⚠️ Lệnh NSFW không được phép trong nhóm này.\n💡 Quản trị viên nhóm có thể bật bằng cách gõ: nsfw on";
        default:
            return "⚠️ Không thể sử dụng lệnh NSFW vào lúc này.";
    }
};

module.exports = {
    loadNSFWSettings,
    setThreadNSFWStatus,
    setUserNSFWBlock,
    isNSFWAllowed,
    isNSFWCommand,
    getNSFWResponseMessage
};