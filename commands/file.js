const fs = require('fs');
const path = require('path');

module.exports = {
    name: "file",
    dev: "HNT",
    info: "Quản lý file lệnh",
    usages: "[list | new | del | edit | read | rename] <tên file> <nội dung>",
    cooldowns: 3,
    onPrefix: true,

    onLaunch: async ({ api, event, target }) => {
        const { threadID, messageID, senderID } = event;

        try {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            if (!adminConfig.adminUIDs.includes(senderID)) {
                return api.sendMessage("⚠️ Chỉ admin mới có thể quản lý file lệnh!", threadID, messageID);
            }
        } catch (error) {
            return api.sendMessage("❌ Lỗi khi kiểm tra quyền admin!", threadID, messageID);
        }

        const commandsDir = __dirname;

        if (!target[0]) {
            return api.sendMessage(
                "📝 Quản lý File Lệnh:\n\n" +
                "1. list - Xem danh sách và thông tin lệnh\n" +
                "2. info <tên> - Xem chi tiết một lệnh\n" +
                "3. new <tên> <code> - Tạo lệnh mới\n" +
                "4. del <tên> - Xóa lệnh\n" +
                "5. edit <tên> <code> - Sửa lệnh\n" +
                "6. read <tên> - Đọc nội dung lệnh\n" +
                "7. rename <tên cũ> <tên mới> - Đổi tên lệnh\n\n" +
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

        try {
            switch (cmd) {
                case 'list':
                    const files = fs.readdirSync(commandsDir)
                        .filter(file => file.endsWith('.js'))
                        .map(file => {
                            try {
                                const filePath = path.join(commandsDir, file);
                                return formatFileInfo(getFileDetails(filePath));
                            } catch (err) {
                                return `📄 ${file} (Lỗi đọc thông tin)`;
                            }
                        })
                        .join('\n\n');
                    return api.sendMessage(`📚 DANH SÁCH LỆNH\n\n${files}`, threadID, messageID);

                case 'info':
                    if (!fileName) return api.sendMessage("⚠️ Thiếu tên file!", threadID);
                    const infoPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    if (!fs.existsSync(infoPath)) return api.sendMessage("⚠️ Lệnh không tồn tại!", threadID);
                    const fileInfo = getFileDetails(infoPath);
                    return api.sendMessage(formatFileInfo(fileInfo), threadID, messageID);

                case 'new':
                    if (!fileName || !content) return api.sendMessage("⚠️ Thiếu tên file hoặc nội dung!", threadID);
                    const newPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    if (fs.existsSync(newPath)) return api.sendMessage("⚠️ Lệnh này đã tồn tại!", threadID);
                    fs.writeFileSync(newPath, content, 'utf8');
                    return api.sendMessage(`✅ Đã tạo lệnh ${fileName}`, threadID);

                case 'del':
                    if (!fileName) return api.sendMessage("⚠️ Thiếu tên file!", threadID);
                    const delPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    if (!fs.existsSync(delPath)) return api.sendMessage("⚠️ Lệnh không tồn tại!", threadID);
                    fs.unlinkSync(delPath);
                    return api.sendMessage(`✅ Đã xóa lệnh ${fileName}`, threadID);

                case 'edit':
                    if (!fileName || !content) return api.sendMessage("⚠️ Thiếu tên file hoặc nội dung!", threadID);
                    const editPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    if (!fs.existsSync(editPath)) return api.sendMessage("⚠️ Lệnh không tồn tại!", threadID);
                    fs.writeFileSync(editPath, content, 'utf8');
                    return api.sendMessage(`✅ Đã cập nhật lệnh ${fileName}`, threadID);

                case 'read':
                    if (!fileName) return api.sendMessage("⚠️ Thiếu tên file!", threadID);
                    const readPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    if (!fs.existsSync(readPath)) return api.sendMessage("⚠️ Lệnh không tồn tại!", threadID);
                    const fileContent = fs.readFileSync(readPath, 'utf8');
                    return api.sendMessage(`📄 Nội dung ${fileName}:\n\n${fileContent}`, threadID);

                case 'rename':
                    if (!fileName || !target[2]) return api.sendMessage("⚠️ Thiếu tên file cũ hoặc mới!", threadID);
                    const oldPath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : `${fileName}.js`);
                    const newName = target[2].endsWith('.js') ? target[2] : `${target[2]}.js`;
                    const renamePath = path.join(commandsDir, newName);
                    if (!fs.existsSync(oldPath)) return api.sendMessage("⚠️ Lệnh không tồn tại!", threadID);
                    fs.renameSync(oldPath, renamePath);
                    return api.sendMessage(`✅ Đã đổi tên ${fileName} thành ${newName}`, threadID);

                default:
                    return api.sendMessage(
                        "📝 Quản lý File Lệnh:\n\n" +
                        "1. list - Xem danh sách và thông tin lệnh\n" +
                        "2. info <tên> - Xem chi tiết một lệnh\n" +
                        "3. new <tên> <code> - Tạo lệnh mới\n" +
                        "4. del <tên> - Xóa lệnh\n" +
                        "5. edit <tên> <code> - Sửa lệnh\n" +
                        "6. read <tên> - Đọc nội dung lệnh\n" +
                        "7. rename <tên cũ> <tên mới> - Đổi tên lệnh\n\n" +
                        "Ví dụ: file info help.js",
                        threadID, messageID
                    );
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage(`❌ Lỗi: ${error.message}`, threadID);
        }
    }
};