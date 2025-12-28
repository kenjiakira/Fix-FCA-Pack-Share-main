const economyService = require('./economy.service');
const ResponseDto = require('../../common/dto/response.dto');

class EconomyController {
    async getOverview(req, res, next) {
        try {
            const data = await economyService.getOverview();
            res.json(ResponseDto.success(data));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EconomyController();

