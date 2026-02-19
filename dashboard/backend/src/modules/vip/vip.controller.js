const vipService = require('./vip.service');
const ResponseDto = require('../../common/dto/response.dto');

class VipController {
    async findAll(req, res, next) {
        try {
            const vipUsers = await vipService.findAll();
            res.json(ResponseDto.success(vipUsers));
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const { userId, packageId, days } = req.body;
            const result = await vipService.create(userId, packageId, days);
            res.json(ResponseDto.success(result, 'VIP created successfully'));
        } catch (error) {
            next(error);
        }
    }

    async remove(req, res, next) {
        try {
            const { userId } = req.params;
            const result = await vipService.remove(userId);
            res.json(ResponseDto.success(result, 'VIP removed successfully'));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VipController();

