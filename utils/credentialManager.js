const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

class CredentialManager {
    constructor() {
        this.credentialsPath = path.join(__dirname, '../fbCredentials.json');
        this.tempCredentialsPath = path.join(__dirname, '../.temp_creds');
    }

    saveCredentials(email, password) {
        const credentials = {
            email,
            password
        };
        
        const encrypted = encryptString(JSON.stringify(credentials), ENCRYPTION_KEY);
        fs.writeFileSync(this.credentialsPath, JSON.stringify({ credentials: encrypted }));
    }

    decrypt(encryptedData) {
        const buffer = Buffer.from(encryptedData, 'base64');
        const iv = buffer.slice(0, 16);
        const tag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);
        return decipher.update(encrypted, 'binary', 'utf8') + decipher.final('utf8');
    }

    getCredentials() {
        const data = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
        return {
            email: this.decrypt(data.credentials.email),
            password: this.decrypt(data.credentials.password)
        };
    }
}

module.exports = new CredentialManager();
