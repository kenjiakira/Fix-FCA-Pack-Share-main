const avatarsService = require('./avatars.service');
const fs = require('fs');
const path = require('path');

class AvatarsController {
    async getAvatar(req, res, next) {
        try {
            const { userId } = req.params;
            
            const avatarPath = avatarsService.getAvatarPath(userId);
            
            if (!avatarPath || !fs.existsSync(avatarPath)) {
                const projectRoot = path.resolve(__dirname, '../../../../../');
                const defaultPath = path.join(projectRoot, 'database/cache/avatars/avatar.jpg');
                if (fs.existsSync(defaultPath)) {
                    return res.sendFile(defaultPath);
                }
                return res.status(404).json({ success: false, message: 'Avatar not found' });
            }

            const absolutePath = path.resolve(avatarPath);
            res.sendFile(absolutePath);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AvatarsController();

