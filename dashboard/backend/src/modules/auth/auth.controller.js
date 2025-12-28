const authService = require('./auth.service');
const ResponseDto = require('../../common/dto/response.dto');

class AuthController {
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const result = await authService.login(username, password);
            res.json(ResponseDto.success(result, 'Login successful'));
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid credentials'
            });
        }
    }

    async verify(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') || 
                         req.cookies?.cms_token;
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = authService.verifyToken(token);
            res.json(ResponseDto.success({ valid: true, username: decoded.username }));
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid token'
            });
        }
    }
}

module.exports = new AuthController();

