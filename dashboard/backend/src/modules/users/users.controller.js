const usersService = require('./users.service');
const PaginationDto = require('../../common/dto/pagination.dto');
const ResponseDto = require('../../common/dto/response.dto');

class UsersController {
    async findAll(req, res, next) {
        try {
            const pagination = PaginationDto.fromQuery(req.query);
            const result = await usersService.findAll(pagination);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req, res, next) {
        try {
            const { uid } = req.params;
            const user = await usersService.findOne(uid);
            res.json(ResponseDto.success(user));
        } catch (error) {
            next(error);
        }
    }

    async updateBalance(req, res, next) {
        try {
            const { uid } = req.params;
            const { amount } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
            }

            const user = await usersService.updateBalance(uid, amount);
            res.json(ResponseDto.success(user, 'Balance updated successfully'));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UsersController();

