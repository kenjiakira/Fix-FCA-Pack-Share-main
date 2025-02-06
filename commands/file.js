const fs = require('fs');
const path = require('path');

const MAX_MESSAGE_LENGTH = 4000; 

const chunkMessage = (message) => {
    if (message.length <= MAX_MESSAGE_LENGTH) return [message];
    
    const chunks = [];
    let currentChunk = '';
    const lines = message.split('\n');
    
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
            chunks.push(currentChunk);
            currentChunk = line;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks.map((chunk, i) => `Phần ${i + 1}/${chunks.length}\n\n${chunk}`);
};

const validateRequest = ({ api, event, target }) => {
    if (!api || !api.sendMessage) throw new Error('API không hợp lệ');
    if (!event || !event.threadID) throw new Error('Event không hợp lệ');
    if (!Array.isArray(target)) throw new Error('Target không hợp lệ');
    return true;
};

const safeApiSend = async (api, message, threadID, messageID) => {
    try {
        const chunks = chunkMessage(message);
        for (const chunk of chunks) {
            await api.sendMessage(chunk, threadID, messageID);
            if (chunks.length > 1) await new Promise(r => setTimeout(r, 1000)); // Delay between chunks
        }
    } catch (err) {
        console.error('API Error:', err);
        throw new Error('Không thể gửi tin nhắn: ' + (err.errorDescription || err.message));
    }
};

module.exports = {
    name: "file",
    dev: "HNT",
    info: "Quản lý file lệnh",
    usages: "[list | new | del | edit | read | rename | view] <tên file> <nội dung>",
    cooldowns: 3,
    onPrefix: true,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, messageID, senderID } = event;

        try {
            validateRequest({ api, event, target });
            
            try {
                const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
                if (!adminConfig.adminUIDs.includes(senderID)) {
                    return safeApiSend(api, "⚠️ Chỉ admin mới có thể quản lý file lệnh!", threadID, messageID);
                }
            } catch (error) {
                throw new Error('Lỗi kiểm tra quyền admin: ' + error.message);
            }

            const commandsDir = __dirname;

            if (!target[0]) {
                return safeApiSend(
                    api,
                    "📝 Quản lý File Lệnh:\n\n" +
                    "1. list - Xem danh sách và thông tin lệnh\n" +
                    "2. info <tên> - Xem chi tiết một lệnh\n" +
                    "3. new <tên> <code> - Tạo lệnh mới\n" +
                    "4. del <tên> - Xóa lệnh\n" +
                    "5. edit <tên> <code> - Sửa lệnh\n" +
                    "6. read <tên> - Đọc nội dung lệnh\n" +
                    "7. rename <tên cũ> <tên mới> - Đổi tên lệnh\n" +
                    "8. view <đường dẫn> - Xem nội dung thư mục\n\n" +
                    "Ví dụ: file info help.js",
                    threadID, messageID
                );
            }

            const cmd = target[0].toLowerCase();
            const fileName = target[1];
            const content = target.slice(2).join(" ");

            const getFileDetails = (filePath) => {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const moduleInfo = require(filePath);
                
                return {
                    name: path.basename(filePath),
                    size: (stats.size / 1024).toFixed(2) + ' KB',
                    created: stats.birthtime.toLocaleString(),
                    modified: stats.mtime.toLocaleString(),
                    developer: moduleInfo.dev || 'Không có',
                    description: moduleInfo.info || 'Không có mô tả',
                    usage: moduleInfo.usages || 'Không có hướng dẫn',
                    prefix: moduleInfo.onPrefix ? 'Có' : 'Không',
                    cooldown: moduleInfo.cooldowns || 0,
                    lineCount: content.split('\n').length
                };
            };

            const formatFileInfo = (fileInfo) => {
                return `📄 ${fileInfo.name}\n` +
                       `👤 Dev: ${fileInfo.developer}\n` +
                       `📝 Mô tả: ${fileInfo.description}\n` +
                       `💡 Cách dùng: ${fileInfo.usage}\n` +
                       `⚡ Prefix: ${fileInfo.prefix}\n` +
                       `⏱️ Cooldown: ${fileInfo.cooldown}s\n` +
                       `📊 Dung lượng: ${fileInfo.size}\n` +
                       `📈 Số dòng: ${fileInfo.lineCount}\n` +
                       `🕐 Tạo lúc: ${fileInfo.created}\n` +
                       `✏️ Sửa lúc: ${fileInfo.modified}\n` +
                       `──────────────────`;
            };

            const formatSimpleFileInfo = (filePath) => {
                try {
                    const stats = fs.statSync(filePath);
                    const moduleInfo = require(filePath);
                    return `📄 ${path.basename(filePath)} (${(stats.size / 1024).toFixed(1)}KB) - ${moduleInfo.info || 'Không có mô tả'}`;
                } catch (err) {
                    return `📄 ${path.basename(filePath)} (Lỗi đọc thông tin)`;
                }
            };

            const listFilesInDir = (dirPath) => {
                try {
                    const items = fs.readdirSync(dirPath);
                    const result = items.map(item => {
                        const fullPath = path.join(dirPath, item);
                        const stats = fs.statSync(fullPath);
                        return `${stats.isDirectory() ? '📁' : '📄'} ${item} (${(stats.size / 1024).toFixed(2)} KB)`;
                    });
                    return result.join('\n');
                } catch (error) {
                    throw new Error(`Không thể đọc thư mục: ${error.message}`);
                }
            };

            const handleError = (error, api, threadID) => {
                const errorMessage = error.code === 'ENOENT' ? '⚠️ File hoặc thư mục không tồn tại!' :
                                    error.code === 'EACCES' ? '⚠️ Không có quyền truy cập!' :
                                    error.code === 'EISDIR' ? '⚠️ Đây là một thư mục!' :
                                    `❌ Lỗi: ${error.message}`;
                return safeApiSend(api, errorMessage, threadID);
            };

            const validateInput = (fileName) => {
                if (!fileName) throw new Error('Thiếu tên file!');
                if (fileName.includes('..')) throw new Error('Đường dẫn không hợp lệ!');
                const invalidChars = /[<>:"|?*]/g;
                if (invalidChars.test(fileName)) throw new Error('Tên file chứa ký tự không hợp lệ!');
                return true;
            };

            try {
                switch (cmd) {
                    case 'list':
                        try {
                            const files = fs.readdirSync(commandsDir)
                                .filter(file => file.endsWith('.js'))
                                .map(file => formatSimpleFileInfo(path.join(commandsDir, file)))
                                .join('\n');
                            
                            return safeApiSend(api, `📚 DANH SÁCH LỆNH:\n\n${files}`, threadID, messageID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'info':
                        try {
                            validateInput(fileName);
                            const infoPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                            if (!fs.existsSync(infoPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                            const fileInfo = getFileDetails(infoPath);
                            return safeApiSend(api, formatFileInfo(fileInfo), threadID, messageID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'new':
                        try {
                            validateInput(fileName);
                            if (!content) throw new Error('Thiếu nội dung file!');
                            const newPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                            if (fs.existsSync(newPath)) return safeApiSend(api, "⚠️ Lệnh này đã tồn tại!", threadID);
                            fs.writeFileSync(newPath, content, 'utf8');
                            return safeApiSend(api, `✅ Đã tạo lệnh ${fileName}`, threadID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'del':
                        try {
                            validateInput(fileName);
                            const delPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                            if (!fs.existsSync(delPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                            fs.unlinkSync(delPath);
                            return safeApiSend(api, `✅ Đã xóa lệnh ${fileName}`, threadID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'edit':
                        try {
                            validateInput(fileName);
                            if (!content) throw new Error('Thiếu nội dung cần sửa!');
                            const editPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                            if (!fs.existsSync(editPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                            fs.writeFileSync(editPath, content, 'utf8');
                            return safeApiSend(api, `✅ Đã cập nhật lệnh ${fileName}`, threadID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'read':
                        try {
                            validateInput(fileName);
                            const readPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                            if (!fs.existsSync(readPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                            const fileContent = fs.readFileSync(readPath, 'utf8');
                            return safeApiSend(api, `📄 Nội dung ${fileName}:\n\n${fileContent}`, threadID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'rename':
                        try {
                            validateInput(fileName);
                            validateInput(target[2]);
                            
                            const oldPath = path.join(commandsDir, fileName);
                            const newPath = path.join(commandsDir, target[2]);
                            
                            if (!fs.existsSync(oldPath) && !fs.existsSync(oldPath + '.js')) {
                                return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                            }
                            
                            const actualOldPath = fs.existsSync(oldPath) ? oldPath : oldPath + '.js';
                            
                            const originalExt = path.extname(actualOldPath);
                            const newExt = path.extname(target[2]);
                            const finalNewPath = newExt ? newPath : newPath + originalExt;
                            
                            fs.renameSync(actualOldPath, finalNewPath);
                            return safeApiSend(api, `✅ Đã đổi tên ${path.basename(actualOldPath)} thành ${path.basename(finalNewPath)}`, threadID);
                        } catch (err) {
                            return handleError(err, api, threadID);
                        }
                        break;

                    case 'view':
                        try {
                            validateInput(fileName);
                            const viewPath = path.resolve(fileName);
                            const files = listFilesInDir(viewPath);
                            return safeApiSend(api, `📂 Nội dung thư mục ${fileName}:\n\n${files}`, threadID);
                        } catch (error) {
                            return handleError(error, api, threadID);
                        }
                        break;

                    default:
                        return safeApiSend(
                            api,
                            "📝 Quản lý File Lệnh:\n\n" +
                            "1. list - Xem danh sách và thông tin lệnh\n" +
                            "2. info <tên> - Xem chi tiết một lệnh\n" +
                            "3. new <tên> <code> - Tạo lệnh mới\n" +
                            "4. del <tên> - Xóa lệnh\n" +
                            "5. edit <tên> <code> - Sửa lệnh\n" +
                            "6. read <tên> - Đọc nội dung lệnh\n" +
                            "7. rename <tên cũ> <tên mới> - Đổi tên lệnh\n" +
                            "8. view <đường dẫn> - Xem nội dung thư mục\n\n" +
                            "Ví dụ: file info help.js",
                            threadID, messageID
                        );x
                }
            } catch (error) {
                console.error('Command Error:', error);
                return safeApiSend(api, `❌ Lỗi thực thi lệnh: ${error.message}`, threadID, messageID);
            }

        } catch (error) {
            console.error('Critical Error:', error);
            return safeApiSend(api, `❌ Lỗi hệ thống: ${error.message}`, threadID);
        }
    }
};