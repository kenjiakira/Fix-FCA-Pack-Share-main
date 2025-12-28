const threadsService = require('./threads.service');
const PaginationDto = require('../../common/dto/pagination.dto');
const ResponseDto = require('../../common/dto/response.dto');

class ThreadsController {
    async findAll(req, res, next) {
        try {
            const pagination = PaginationDto.fromQuery(req.query);
            const result = await threadsService.findAll(pagination);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req, res, next) {
        try {
            const { threadID } = req.params;
            const thread = await threadsService.findOne(threadID);
            res.json(ResponseDto.success(thread));
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ThreadsController();

