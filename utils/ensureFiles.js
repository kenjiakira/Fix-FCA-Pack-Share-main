const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const gradient = require('gradient-string');

const createdFiles = new Set();
const createdDirs = new Set();

function ensureDirectory(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (!createdDirs.has(dir)) {
            createdDirs.add(dir);
            logCreatedDir(dir);
        }
        return true;
    }
    return false;
}

function ensureFile(filePath, defaultValue = {}) {
    if (!fs.existsSync(filePath)) {
        ensureDirectory(filePath);
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
        if (!createdFiles.has(filePath)) {
            createdFiles.add(filePath);
            logCreatedFile(filePath);
        }
        return true;
    }
    return false;
}

function safeReadFileSync(filePath, encoding = 'utf8', defaultValue = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            ensureFile(filePath, defaultValue);
        }
        return fs.readFileSync(filePath, encoding);
    } catch (error) {
        if (error.code === 'ENOENT') {
            ensureFile(filePath, defaultValue);
            return fs.readFileSync(filePath, encoding);
        }
        throw error;
    }
}

function safeReadJSONSync(filePath, defaultValue = {}) {
    try {
        const content = safeReadFileSync(filePath, 'utf8', defaultValue);
        return JSON.parse(content || JSON.stringify(defaultValue));
    } catch (error) {
        if (error.code === 'ENOENT') {
            ensureFile(filePath, defaultValue);
            return defaultValue;
        }
        if (error instanceof SyntaxError) {
            console.warn(chalk.yellow(`⚠️  File ${filePath} có JSON không hợp lệ, sử dụng giá trị mặc định`));
            return defaultValue;
        }
        throw error;
    }
}

function safeWriteFileSync(filePath, data, encoding = 'utf8') {
    ensureDirectory(filePath);
    return fs.writeFileSync(filePath, data, encoding);
}

function safeWriteJSONSync(filePath, data, options = {}) {
    const { space = 2, defaultValue = {} } = options;
    ensureDirectory(filePath);
    return fs.writeFileSync(filePath, JSON.stringify(data, null, space), 'utf8');
}

function logCreatedFile(filePath) {
    const boldText = (text) => chalk.bold(text);
    console.log(boldText(gradient.pastel(`📄 Đã tạo file: ${filePath}`)));
}

function logCreatedDir(dirPath) {
    const boldText = (text) => chalk.bold(text);
    console.log(boldText(gradient.teen(`📂 Đã tạo thư mục: ${dirPath}`)));
}

function logSummary() {
    if (createdFiles.size === 0 && createdDirs.size === 0) {
        return;
    }
    
    const boldText = (text) => chalk.bold(text);
    console.log(boldText(gradient.cristal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")));
    console.log(boldText(gradient.morning("📁 TỔNG KẾT TẠO FILE TỰ ĐỘNG")));
    console.log(boldText(gradient.cristal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")));
    
    if (createdDirs.size > 0) {
        console.log(boldText(gradient.teen(`✅ Đã tạo ${createdDirs.size} thư mục`)));
    }
    
    if (createdFiles.size > 0) {
        console.log(boldText(gradient.teen(`✅ Đã tạo ${createdFiles.size} file JSON`)));
    }
    
    console.log(boldText(gradient.cristal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")));
}

function clearCache() {
    createdFiles.clear();
    createdDirs.clear();
}

module.exports = {
    safeReadFileSync,
    safeReadJSONSync,
    safeWriteFileSync,
    safeWriteJSONSync,
    ensureFile,
    ensureDirectory,
    logSummary,
    clearCache,

    ensureFileExists: ensureFile,
    ensureDirectoryExists: ensureDirectory
};

