const systemService = require('./system.service');
const ResponseDto = require('../../common/dto/response.dto');

class SystemController {
    async getStatus(req, res, next) {
        try {
            const status = await systemService.getStatus();
            res.json(ResponseDto.success(status));
        } catch (error) {
            next(error);
        }
    }

    async getSystemInfo(req, res, next) {
        try {
            const info = await systemService.getSystemInfo();
            res.json(ResponseDto.success(info));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SystemController();

