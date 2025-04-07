const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Extracts c_user value from Facebook cookie string
 * @param {string} cookieStr - The Facebook cookie string
 * @returns {string|null} The c_user value or null if not found
 */
function extractCUser(cookieStr) {
    try {
        const match = cookieStr.match(/c_user=(\d+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting c_user:', error);
        return null;
    }
}

/**
 * Fetches user name from Facebook using cookie
 * @param {string} cookieStr - Facebook cookie string
 * @returns {Promise<{success: boolean, name: string|null, uid: string|null}>}
 */
async function getNameFromCookie(cookieStr) {
    try {
        const uid = extractCUser(cookieStr);
        if (!uid) {
            return { success: false, name: null, uid: null, error: 'Invalid cookie (no c_user found)' };
        }

        // Make a request to Facebook with the cookies
        const response = await axios.get('https://www.facebook.com/me', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cookie': cookieStr
            }
        });

        // Extract the name from the HTML response
        const html = response.data;
        
        // FB title usually contains the name like "Name - Facebook"
        const titleMatch = html.match(/<title>(.*?)(?:\s+[-|]\s+Facebook)/i);
        if (titleMatch && titleMatch[1]) {
            const name = titleMatch[1].trim();
            
            // Save to cache
            saveNameToCache(uid, name);
            
            return {
                success: true,
                name: name,
                uid: uid
            };
        }
        
        return { 
            success: false, 
            name: null, 
            uid, 
            error: 'Could not extract name from Facebook response' 
        };
    } catch (error) {
        console.error('Error fetching name from cookie:', error.message);
        return { 
            success: false, 
            name: null, 
            uid: extractCUser(cookieStr), 
            error: error.message 
        };
    }
}

/**
 * Save name to cache for future use
 * @param {string} uid - User ID
 * @param {string} name - User name
 */
function saveNameToCache(uid, name) {
    try {
        const cachePath = path.join(__dirname, '../events/cache/rankData.json');
        let rankData = {};
        
        if (fs.existsSync(cachePath)) {
            rankData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
        
        if (!rankData[uid]) {
            rankData[uid] = {};
        }
        
        rankData[uid].name = name;
        rankData[uid].lastNameUpdate = Date.now();
        
        fs.writeFileSync(cachePath, JSON.stringify(rankData, null, 2));
        
        // Also update nameCache
        const nameCachePath = path.join(__dirname, '../database/json/usernames.json');
        let nameCache = {};
        
        try {
            if (fs.existsSync(nameCachePath)) {
                nameCache = JSON.parse(fs.readFileSync(nameCachePath, 'utf8'));
            }
        } catch (err) {
            console.error('Error reading name cache:', err);
        }
        
        nameCache[uid] = {
            name: name,
            timestamp: Date.now()
        };
        
        // Ensure directory exists
        const dir = path.dirname(nameCachePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(nameCachePath, JSON.stringify(nameCache, null, 2));
    } catch (error) {
        console.error('Error saving name to cache:', error);
    }
}

/**
 * Store Facebook cookie in configuration
 * @param {string} cookieStr - Facebook cookie string 
 * @returns {Promise<{success: boolean, message: string, uid: string|null}>}
 */
async function storeFacebookCookie(cookieStr) {
    try {
        const result = await getNameFromCookie(cookieStr);
        
        if (!result.success) {
            return { 
                success: false, 
                message: `Failed to validate cookie: ${result.error || 'Unknown error'}`,
                uid: null
            };
        }
        
        // Store cookie in a secure place
        const configPath = path.join(__dirname, '../database/cookies.txt');
        fs.writeFileSync(configPath, cookieStr);
        
        return {
            success: true,
            message: `Successfully stored cookie for ${result.name} (${result.uid})`,
            uid: result.uid,
            name: result.name
        };
    } catch (error) {
        console.error('Error storing Facebook cookie:', error);
        return {
            success: false,
            message: `Error storing cookie: ${error.message}`,
            uid: null
        };
    }
}

/**
 * Get stored Facebook cookie
 * @returns {string|null} The stored cookie or null if not found
 */
function getStoredCookie() {
    try {
        const configPath = path.join(__dirname, '../database/cookies.txt');
        if (fs.existsSync(configPath)) {
            return fs.readFileSync(configPath, 'utf8');
        }
        return null;
    } catch (error) {
        console.error('Error getting stored cookie:', error);
        return null;
    }
}

module.exports = {
    getNameFromCookie,
    storeFacebookCookie,
    getStoredCookie,
    extractCUser
};