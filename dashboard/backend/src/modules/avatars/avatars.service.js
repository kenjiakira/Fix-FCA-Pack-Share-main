const fs = require('fs');
const path = require('path');

class AvatarsService {
    getAvatarPath(userId) {
        if (!userId) return null;
        const projectRoot = path.resolve(__dirname, '../../../../../');
        const avatarsDir = path.join(projectRoot, 'database/cache/avatars');
        const avatarPath = path.join(avatarsDir, `${userId}.jpg`);
        
        if (fs.existsSync(avatarPath)) {
            return avatarPath;
        }
        
        return null;
    }

    getAvatarUrl(userId, baseUrl = '') {
        if (!userId) return null;
        return `${baseUrl}/api/avatars/${userId}`;
    }
}

module.exports = new AvatarsService();

