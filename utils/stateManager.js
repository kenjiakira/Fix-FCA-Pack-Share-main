const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class StateManager {
    constructor() {
        this.STATE_PATH = './appstate.json';
        this.TEMP_PATH = './.temp_state';
        this.rotationKey = crypto.randomBytes(32);
        this.initializeRotationKey();
    }

    initializeRotationKey() {
        setInterval(() => {
            this.rotationKey = crypto.randomBytes(32);
            if (this.lastState) {
                this.saveState(this.lastState);
            }
        }, 3600000); 
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.rotationKey, iv);
        const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        const signature = crypto.createHmac('sha256', this.rotationKey)
            .update(encrypted)
            .digest();
        
        return {
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            data: encrypted.toString('base64'),
            signature: signature.toString('hex'),
            timestamp: Date.now()
        };
    }

    decrypt(encryptedData) {
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const tag = Buffer.from(encryptedData.tag, 'hex');
            const encrypted = Buffer.from(encryptedData.data, 'base64');
            const signature = Buffer.from(encryptedData.signature, 'hex');

            const calculatedSignature = crypto.createHmac('sha256', this.rotationKey)
                .update(encrypted)
                .digest();
            
            if (!calculatedSignature.equals(signature)) {
                throw new Error('Invalid state signature');
            }

            const decipher = crypto.createDecipheriv('aes-256-gcm', this.rotationKey, iv);
            decipher.setAuthTag(tag);
            const decrypted = decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('State decryption failed:', error.message);
            return null;
        }
    }

    saveState(appstate) {
        this.lastState = appstate;
        const encrypted = this.encrypt(appstate);
 
        fs.writeFileSync(this.TEMP_PATH, JSON.stringify(encrypted));
   
        fs.renameSync(this.TEMP_PATH, this.STATE_PATH);
    }

    loadState() {
        try {
            const encrypted = JSON.parse(fs.readFileSync(this.STATE_PATH));
            const state = this.decrypt(encrypted);
            
            if (!state || !this.validateState(state)) {
                throw new Error('Invalid or expired state');
            }
            
            return state;
        } catch (error) {
            console.error('Failed to load state:', error.message);
            return null;
        }
    }

    validateState(state) {

        return Array.isArray(state) && 
               state.some(cookie => cookie.key === 'c_user') &&
               state.some(cookie => cookie.key === 'xs');
    }
}

module.exports = new StateManager();
