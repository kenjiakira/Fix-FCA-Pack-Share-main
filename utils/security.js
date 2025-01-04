const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const securityUtils = {
    encryptString(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    },

    decryptString(encryptedText, key) {
        const buf = Buffer.from(encryptedText, 'base64');
        const iv = buf.slice(0, 16);
        const tag = buf.slice(16, 32);
        const encrypted = buf.slice(32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
        decipher.setAuthTag(tag);
        return decipher.update(encrypted) + decipher.final('utf8');
    },

    loginLimiter: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5, 
        message: 'Too many login attempts, please try again later'
    }),

    maskCredentials(str) {
        if (!str) return '';
        return str.substring(0, 3) + '*'.repeat(str.length - 3);
    }
};

module.exports = securityUtils;
