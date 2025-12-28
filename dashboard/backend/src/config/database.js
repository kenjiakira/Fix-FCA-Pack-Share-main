const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.basePath = path.join(__dirname, '../../../..');
    }

    loadJSONFile(filePath, defaultValue = {}) {
        try {
            const fullPath = path.join(this.basePath, filePath);
            if (fs.existsSync(fullPath)) {
                return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            }
            return defaultValue;
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error);
            return defaultValue;
        }
    }

    saveJSONFile(filePath, data) {
        try {
            const fullPath = path.join(this.basePath, filePath);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving ${filePath}:`, error);
            throw error;
        }
    }

    getUsers() {
        return this.loadJSONFile('database/users.json', {});
    }

    getThreads() {
        return this.loadJSONFile('database/threads.json', {});
    }

    getCurrencies() {
        const { readData } = require('../../../../utils/currencies');
        return readData();
    }
}

module.exports = new DatabaseService();

