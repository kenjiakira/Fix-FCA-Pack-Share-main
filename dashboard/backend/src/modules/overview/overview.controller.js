const overviewService = require('./overview.service');
const ResponseDto = require('../../common/dto/response.dto');

class OverviewController {
    async getOverview(req, res, next) {
        try {
            const data = await overviewService.getOverview();
            res.json(ResponseDto.success(data));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OverviewController();

