const permissionsService = require('./permissions.service');
const ResponseDto = require('../../common/dto/response.dto');

class PermissionsController {
    async getPermissions(req, res, next) {
        try {
            const permissions = await permissionsService.getPermissions();
            res.json(ResponseDto.success(permissions));
        } catch (error) {
            next(error);
        }
    }

    async getFullConfig(req, res, next) {
        try {
            const config = await permissionsService.getFullConfig();
            res.json(ResponseDto.success(config));
        } catch (error) {
            next(error);
        }
    }

    async addPermission(req, res, next) {
        try {
            const { role, uid } = req.body;

            if (!role || !uid) {
                return res.status(400).json(ResponseDto.error('Thiếu role hoặc uid'));
            }

            const result = await permissionsService.addPermission(role, uid);
            res.json(ResponseDto.success(result, result.message));
        } catch (error) {
            res.status(400).json(ResponseDto.error(error.message));
        }
    }

    async removePermission(req, res, next) {
        try {
            const { role, uid } = req.body;

            if (!role || !uid) {
                return res.status(400).json(ResponseDto.error('Thiếu role hoặc uid'));
            }

            const result = await permissionsService.removePermission(role, uid);
            res.json(ResponseDto.success(result, result.message));
        } catch (error) {
            res.status(400).json(ResponseDto.error(error.message));
        }
    }
}

module.exports = new PermissionsController();

