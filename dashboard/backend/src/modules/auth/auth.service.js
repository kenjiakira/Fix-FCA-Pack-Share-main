const jwt = require('jsonwebtoken');

class AuthService {
    constructor() {
        require('dotenv').config();
        this.secret = process.env.JWT_SECRET || '';
        this.username = process.env.CMS_USERNAME || '';
        this.password = process.env.CMS_PASSWORD || '';
    }

    async login(username, password) {
        if (username === this.username && password === this.password) {
            const token = jwt.sign(
                { username, timestamp: Date.now() },
                this.secret,
                { expiresIn: '24h' }
            );
            return {
                success: true,
                token,
                username
            };
        }
        throw new Error('Invalid credentials');
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = new AuthService();

