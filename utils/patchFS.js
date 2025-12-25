const fs = require('fs');
const { ensureFile } = require('./ensureFiles');

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function(filePath, encoding = 'utf8') {
    try {
        return originalReadFileSync.call(this, filePath, encoding);
    } catch (error) {
        if (error.code === 'ENOENT' && filePath && filePath.endsWith('.json')) {
            ensureFile(filePath, {});
            return originalReadFileSync.call(this, filePath, encoding);
        }
        throw error;
    }
};

module.exports = {};

