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

    async updateBalance(req, res, next) {
        try {
            const { uid, amount, operation } = req.body;
            const result = await economyService.updateBalance(uid, amount, operation);
            res.json(ResponseDto.success(result));
        } catch (error) {
            res.json(ResponseDto.error(error.message || 'Lỗi khi cập nhật số dư'));
        }
    }

    async transferBalance(req, res, next) {
        try {
            const { fromUid, toUid, amount } = req.body;
            const result = await economyService.transferBalance(fromUid, toUid, amount);
            if (result.success) {
                res.json(ResponseDto.success(result));
            } else {
                res.json(ResponseDto.error(result.message || 'Lỗi khi chuyển tiền'));
            }
        } catch (error) {
            res.json(ResponseDto.error(error.message || 'Lỗi khi chuyển tiền'));
        }
    }

    async getUserBalance(req, res, next) {
        try {
            const { uid } = req.params;
            const result = await economyService.getUserBalance(uid);
            res.json(ResponseDto.success(result));
        } catch (error) {
            res.json(ResponseDto.error(error.message || 'Lỗi khi lấy số dư'));
        }
    }

    async updateQuy(req, res, next) {
        try {
            const { amount, operation } = req.body;
            const result = await economyService.updateQuy(amount, operation);
            res.json(ResponseDto.success(result));
        } catch (error) {
            res.json(ResponseDto.error(error.message || 'Lỗi khi cập nhật quỹ hệ thống'));
        }
    }

    async getQuy(req, res, next) {
        try {
            const result = await economyService.getQuy();
            res.json(ResponseDto.success(result));
        } catch (error) {
            res.json(ResponseDto.error(error.message || 'Lỗi khi lấy quỹ hệ thống'));
        }
    }
}

module.exports = new EconomyController();

