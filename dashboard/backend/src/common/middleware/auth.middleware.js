const authService = require('../../modules/auth/auth.service');

class AuthMiddleware {
    static authenticate(req, res, next) {
        // Skip auth for API login/verify endpoints
        if (req.path.startsWith('/api/auth/login') ||
            req.path.startsWith('/api/auth/verify') ||
            req.path.startsWith('/api/avatars/') ||
            req.path === '/api/health') {
            return next();
        }

        // Check token from header, cookie, or query
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     (req.cookies && req.cookies.cms_token) ||
                     req.query.token;

        if (!token) {
            // Backend chỉ xử lý API, không serve HTML nữa
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        try {
            const decoded = authService.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            // Backend chỉ xử lý API, không serve HTML nữa
            return res.status(401).json({
                success: false,
                message: error.message || 'Invalid token'
            });
        }
    }
}

module.exports = AuthMiddleware;

