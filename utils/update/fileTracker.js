const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Liệt kê tất cả file trong thư mục (recursive)
 * @param {string} dir - Đường dẫn thư mục
 * @param {string[]} excludePatterns - Danh sách pattern để loại trừ
 * @param {string} baseDir - Thư mục gốc để tính relative path
 * @returns {string[]} Danh sách đường dẫn file (relative)
 */
function getAllFiles(dir, excludePatterns = [], baseDir = null) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    if (!baseDir) baseDir = dir;
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);
            
            if (excludePatterns.some(pattern => entry.name.includes(pattern) || fullPath.includes(pattern))) {
                continue;
            }
            
            if (entry.isDirectory()) {
                files.push(...getAllFiles(fullPath, excludePatterns, baseDir));
            } else {
                files.push(relativePath.replace(/\\/g, '/'));
            }
        }
    } catch (error) {
        // Ignore permission errors
    }
    
    return files;
}

/**
 * Tính hash MD5 của file
 * @param {string} filePath - Đường dẫn file
 * @returns {string|null} Hash MD5 của file hoặc null nếu lỗi
 */
function getFileHash(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (error) {
        return null;
    }
}

/**
 * Lấy thông tin file (hash và path)
 * @param {string} dir - Thư mục gốc
 * @param {string[]} excludePatterns - Danh sách pattern để loại trừ
 * @returns {Map<string, string>} Map với key là relativePath, value là hash
 */
function getFileMap(dir, excludePatterns = []) {
    const fileMap = new Map();
    const files = getAllFiles(dir, excludePatterns);
    
    files.forEach(relativePath => {
        const fullPath = path.join(dir, relativePath);
        const hash = getFileHash(fullPath);
        if (hash) {
            fileMap.set(relativePath, hash);
        }
    });
    
    return fileMap;
}

/**
 * So sánh 2 danh sách file và xác định file thêm/xóa/thay đổi
 * @param {Map<string, string>} beforeMap - Map file trước update (path -> hash)
 * @param {Map<string, string>} afterMap - Map file sau update (path -> hash)
 * @returns {Object} {added: [], deleted: [], modified: [], unchanged: []}
 */
function compareFiles(beforeMap, afterMap) {
    const added = [];
    const deleted = [];
    const modified = [];
    const unchanged = [];
    
    // Tìm file mới và file đã thay đổi
    afterMap.forEach((hash, filePath) => {
        if (!beforeMap.has(filePath)) {
            added.push(filePath);
        } else if (beforeMap.get(filePath) !== hash) {
            modified.push(filePath);
        } else {
            unchanged.push(filePath);
        }
    });
    
    // Tìm file đã xóa
    beforeMap.forEach((hash, filePath) => {
        if (!afterMap.has(filePath)) {
            deleted.push(filePath);
        }
    });
    
    return { added, deleted, modified, unchanged };
}

/**
 * So sánh file đơn giản (chỉ dựa trên tên file, không dựa trên hash)
 * @param {string[]} beforeFiles - Danh sách file trước update
 * @param {string[]} afterFiles - Danh sách file sau update
 * @returns {Object} {added: [], deleted: []}
 */
function compareFileLists(beforeFiles, afterFiles) {
    const beforeSet = new Set(beforeFiles);
    const afterSet = new Set(afterFiles);
    
    const added = afterFiles.filter(file => !beforeSet.has(file));
    const deleted = beforeFiles.filter(file => !afterSet.has(file));
    
    return { added, deleted };
}

module.exports = {
    getAllFiles,
    getFileHash,
    getFileMap,
    compareFiles,
    compareFileLists
};
