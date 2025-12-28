const fs = require('fs');
const path = require('path');

class PermissionsService {
    getAdminConfigPath() {
        return path.join(__dirname, '../../../../../admin.json');
    }

    async getPermissions() {
        try {
            const configPath = this.getAdminConfigPath();
            if (!fs.existsSync(configPath)) {
                return {
                    adminUIDs: [],
                    moderatorUIDs: [],
                    supportUIDs: []
                };
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                adminUIDs: config.adminUIDs || [],
                moderatorUIDs: config.moderatorUIDs || [],
                supportUIDs: config.supportUIDs || []
            };
        } catch (error) {
            throw new Error(`Lỗi khi đọc file admin.json: ${error.message}`);
        }
    }

    async getFullConfig() {
        try {
            const configPath = this.getAdminConfigPath();
            if (!fs.existsSync(configPath)) {
                throw new Error('File admin.json không tồn tại');
            }

            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            throw new Error(`Lỗi khi đọc file admin.json: ${error.message}`);
        }
    }

    async addPermission(role, uid) {
        try {
            if (!uid || !uid.trim()) {
                throw new Error('UID không được để trống');
            }

            const uidTrimmed = uid.trim();
            const validRoles = ['admin', 'moderator', 'support'];
            
            if (!validRoles.includes(role)) {
                throw new Error(`Role không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`);
            }

            const configPath = this.getAdminConfigPath();
            let config = {};

            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }

            const roleKey = role === 'admin' ? 'adminUIDs' : 
                          role === 'moderator' ? 'moderatorUIDs' : 'supportUIDs';

            if (!config[roleKey]) {
                config[roleKey] = [];
            }

            config[roleKey] = config[roleKey].filter(id => id && id.trim() !== '');

            if (config[roleKey].includes(uidTrimmed)) {
                throw new Error(`UID ${uidTrimmed} đã tồn tại trong ${role}`);
            }

            config[roleKey].push(uidTrimmed);

            const otherRoles = validRoles.filter(r => r !== role);
            otherRoles.forEach(otherRole => {
                const otherRoleKey = otherRole === 'admin' ? 'adminUIDs' : 
                                   otherRole === 'moderator' ? 'moderatorUIDs' : 'supportUIDs';
                if (config[otherRoleKey]) {
                    config[otherRoleKey] = config[otherRoleKey].filter(id => id !== uidTrimmed);
                }
            });

            if (!config.prefix) config.prefix = '.';
            if (!config.botName) config.botName = 'Bot';
            if (!config.ownerName) config.ownerName = 'Owner';
            if (!config.facebookLink) config.facebookLink = '';
            if (config.resend === undefined) config.resend = false;
            if (config.notilogs === undefined) config.notilogs = true;
            if (!config.appstate) config.appstate = './appstate.json';
            if (config.restart === undefined) config.restart = true;
            if (!config.restartTime) config.restartTime = 50;
            if (!config.FCA) config.FCA = 'hut-chat-api';
            if (config.mtnMode === undefined) config.mtnMode = false;
            if (!config.customCommands) config.customCommands = {};
            if (!config.feedbackGroupID) config.feedbackGroupID = [];

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

            return {
                role,
                uid: uidTrimmed,
                message: `Đã thêm ${uidTrimmed} vào ${role} thành công`
            };
        } catch (error) {
            throw new Error(error.message || `Lỗi khi thêm quyền: ${error.message}`);
        }
    }

    async removePermission(role, uid) {
        try {
            if (!uid || !uid.trim()) {
                throw new Error('UID không được để trống');
            }

            const uidTrimmed = uid.trim();
            const validRoles = ['admin', 'moderator', 'support'];
            
            if (!validRoles.includes(role)) {
                throw new Error(`Role không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`);
            }

            const configPath = this.getAdminConfigPath();
            if (!fs.existsSync(configPath)) {
                throw new Error('File admin.json không tồn tại');
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const roleKey = role === 'admin' ? 'adminUIDs' : 
                          role === 'moderator' ? 'moderatorUIDs' : 'supportUIDs';

            if (!config[roleKey] || !Array.isArray(config[roleKey])) {
                throw new Error(`Không tìm thấy danh sách ${role}`);
            }

            const index = config[roleKey].indexOf(uidTrimmed);
            if (index === -1) {
                throw new Error(`UID ${uidTrimmed} không tồn tại trong ${role}`);
            }

            // Xóa UID
            config[roleKey].splice(index, 1);
            
            // Loại bỏ các UID trống
            config[roleKey] = config[roleKey].filter(id => id && id.trim() !== '');

            // Ghi file
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

            return {
                role,
                uid: uidTrimmed,
                message: `Đã xóa ${uidTrimmed} khỏi ${role} thành công`
            };
        } catch (error) {
            throw new Error(error.message || `Lỗi khi xóa quyền: ${error.message}`);
        }
    }
}

module.exports = new PermissionsService();

