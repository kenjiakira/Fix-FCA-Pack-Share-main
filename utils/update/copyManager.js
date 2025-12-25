const fs = require('fs');
const path = require('path');
const { getFileHash, getFileMap } = require('./fileTracker');

/**
 * Copy thư mục với logic chỉ copy file đã thay đổi hoặc mới
 * @param {string} src - Thư mục nguồn
 * @param {string} dest - Thư mục đích
 * @param {string[]} excludePatterns - Danh sách pattern để loại trừ
 * @param {boolean} smartCopy - Nếu true, chỉ copy file đã thay đổi. Nếu false, copy tất cả
 * @param {string} baseDir - Thư mục gốc để tính relative path (mặc định là dest)
 * @returns {Object} {copied: [], skipped: [], errors: []} - Danh sách file đã copy và bỏ qua
 */
function copyDirectory(src, dest, excludePatterns = [], smartCopy = true, baseDir = null) {
    const result = {
        copied: [],
        skipped: [],
        errors: []
    };
    
    if (!baseDir) baseDir = dest;
    
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        // Nếu smartCopy = true, lấy map file hiện tại để so sánh (chỉ lấy 1 lần ở đầu)
        let existingFileMap = null;
        if (smartCopy && baseDir === dest && fs.existsSync(dest)) {
            existingFileMap = getFileMap(dest, excludePatterns);
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            const relativePath = path.relative(baseDir, destPath).replace(/\\/g, '/');
            
            if (excludePatterns.some(pattern => entry.name.includes(pattern) || srcPath.includes(pattern))) {
                continue;
            }

            if (entry.isDirectory()) {
                const subResult = copyDirectory(srcPath, destPath, excludePatterns, smartCopy, baseDir);
                result.copied.push(...subResult.copied);
                result.skipped.push(...subResult.skipped);
                result.errors.push(...subResult.errors);
            } else {
                try {
                    let shouldCopy = true;
                    
                    if (smartCopy && existingFileMap && fs.existsSync(destPath)) {
                        // So sánh hash của file
                        const srcHash = getFileHash(srcPath);
                        const destHash = existingFileMap.get(relativePath);
                        
                        // Chỉ copy nếu file không tồn tại hoặc hash khác nhau
                        if (destHash && srcHash && srcHash === destHash) {
                            shouldCopy = false;
                            result.skipped.push(relativePath);
                        }
                    }
                    
                    if (shouldCopy) {
                        // Đảm bảo thư mục cha tồn tại
                        const parentDir = path.dirname(destPath);
                        if (!fs.existsSync(parentDir)) {
                            fs.mkdirSync(parentDir, { recursive: true });
                        }
                        
                        fs.copyFileSync(srcPath, destPath);
                        result.copied.push(relativePath);
                    }
                } catch (error) {
                    result.errors.push({ file: relativePath, error: error.message });
                }
            }
        }
        
        return result;
    } catch (error) {
        throw new Error(`Lỗi khi copy thư mục: ${error.message}`);
    }
}

/**
 * Copy thư mục đơn giản (copy tất cả file, không kiểm tra hash)
 * @param {string} src - Thư mục nguồn
 * @param {string} dest - Thư mục đích
 * @param {string[]} excludePatterns - Danh sách pattern để loại trừ
 * @returns {boolean}
 */
function copyDirectorySimple(src, dest, excludePatterns = []) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (excludePatterns.some(pattern => entry.name.includes(pattern) || srcPath.includes(pattern))) {
                continue;
            }

            if (entry.isDirectory()) {
                copyDirectorySimple(srcPath, destPath, excludePatterns);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        return true;
    } catch (error) {
        throw new Error(`Lỗi khi copy thư mục: ${error.message}`);
    }
}

/**
 * Đồng bộ thư mục: copy file mới/thay đổi và xóa file đã bị xóa ở repo
 * @param {string} src - Thư mục nguồn (repo mới)
 * @param {string} dest - Thư mục đích (project hiện tại)
 * @param {string[]} excludePatterns - Danh sách pattern để loại trừ
 * @returns {Object} {copied: [], skipped: [], deleted: [], errors: []}
 */
function syncDirectory(src, dest, excludePatterns = []) {
    const result = {
        copied: [],
        skipped: [],
        deleted: [],
        errors: []
    };
    
    try {
        // Lấy file map từ repo mới và project hiện tại
        const srcFileMap = getFileMap(src, excludePatterns);
        const destFileMap = getFileMap(dest, excludePatterns);
        
        // So sánh để tìm file mới, thay đổi, và cần xóa
        srcFileMap.forEach((srcHash, relativePath) => {
            const srcPath = path.join(src, relativePath);
            const destPath = path.join(dest, relativePath);
            const destHash = destFileMap.get(relativePath);
            
            try {
                // Kiểm tra file có trong exclude patterns không
                if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
                    return;
                }
                
                if (!destHash) {
                    // File mới - cần copy
                    const parentDir = path.dirname(destPath);
                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir, { recursive: true });
                    }
                    fs.copyFileSync(srcPath, destPath);
                    result.copied.push(relativePath);
                } else if (destHash !== srcHash) {
                    // File đã thay đổi - cần copy
                    const parentDir = path.dirname(destPath);
                    if (!fs.existsSync(parentDir)) {
                        fs.mkdirSync(parentDir, { recursive: true });
                    }
                    fs.copyFileSync(srcPath, destPath);
                    result.copied.push(relativePath);
                } else {
                    // File không đổi - bỏ qua
                    result.skipped.push(relativePath);
                }
            } catch (error) {
                result.errors.push({ file: relativePath, error: error.message });
            }
        });
        
        // Xóa các file đã bị xóa ở repo chính
        destFileMap.forEach((destHash, relativePath) => {
            if (!srcFileMap.has(relativePath)) {
                // File này không có trong repo mới - cần xóa
                try {
                    if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
                        return;
                    }
                    
                    const destPath = path.join(dest, relativePath);
                    if (fs.existsSync(destPath)) {
                        fs.unlinkSync(destPath);
                        result.deleted.push(relativePath);
                        
                        // Xóa thư mục rỗng nếu có
                        const dir = path.dirname(destPath);
                        try {
                            const files = fs.readdirSync(dir);
                            if (files.length === 0) {
                                fs.rmdirSync(dir);
                            }
                        } catch (e) {
                            // Ignore error khi xóa thư mục
                        }
                    }
                } catch (error) {
                    result.errors.push({ file: relativePath, error: `Xóa file: ${error.message}` });
                }
            }
        });
        
        return result;
    } catch (error) {
        throw new Error(`Lỗi khi đồng bộ thư mục: ${error.message}`);
    }
}

module.exports = {
    copyDirectory,
    copyDirectorySimple,
    syncDirectory
};
