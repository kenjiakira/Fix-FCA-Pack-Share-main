const appStateService = require('./appstate.service');
const ResponseDto = require('../../common/dto/response.dto');

class AppStateController {
    async update(req, res, next) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json(ResponseDto.error('Thiếu dữ liệu appstate'));
            }

            if (!Array.isArray(content)) {
                return res.status(400).json(ResponseDto.error('Appstate phải là một mảng'));
            }

            const result = await appStateService.updateAppState(content);
            
            if (result.success) {
                res.json(ResponseDto.success(null, result.message));
            } else {
                res.status(400).json(ResponseDto.error(result.message));
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AppStateController();

