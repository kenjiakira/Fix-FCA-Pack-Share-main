const fs = require('fs');
const path = require('path');
const axios = require('axios');
const request = require('request');
const cheerio = require('cheerio');
const { PasteClient } = require('pastebin-api');

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

const safeApiSend = async (api, message, threadID, messageID) => {
    try {
        const chunks = chunkMessage(message);
        for (const chunk of chunks) {
            await api.sendMessage(chunk, threadID, messageID);
            if (chunks.length > 1) await new Promise(r => setTimeout(r, 1000));
        }
    } catch (err) {
        console.error('API Error:', err);
        throw new Error('Không thể gửi tin nhắn: ' + (err.errorDescription || err.message));
    }
};

module.exports = {
    name: "command",
    dev: "HNT",
    category: "Admin Commands",
    info: "Quản lý và chỉnh sửa lệnh",
    usages: `Command Management:
1. List/Info:
   command list - Xem danh sách lệnh
   command info <tên> - Xem chi tiết lệnh

2. File Operations:
   command new <tên> <code> - Tạo lệnh mới
   command del <tên> - Xóa lệnh
   command edit <tên> <code> - Sửa lệnh
   command read <tên> - Đọc nội dung
   command rename <tên cũ> <tên mới> - Đổi tên

3. Settings:
   command set <tên> <thuộc tính> <giá trị>
   - Thuộc tính: usedby/prefix/cooldown
   - Ví dụ: command set help usedby 1

4. Share/Import:
   command upload <tên> - Upload lên pastebin
   command import <tên> [reply link] - Import từ link`,
    cooldowns: 5,
    onPrefix: true,
    usedby: 2,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID, messageReply, type } = event;

        try {
            const adminConfig = JSON.parse(fs.readFileSync('./admin.json', 'utf8'));
            if (!adminConfig.adminUIDs.includes(senderID)) {
                return safeApiSend(api, "⚠️ Chỉ admin mới có thể quản lý lệnh!", threadID, messageID);
            }

            if (!target[0]) {
                return safeApiSend(api, this.usages, threadID, messageID);
            }

            const cmd = target[0].toLowerCase();
            const name = target[1];
            const commandsDir = __dirname;

            // Helper functions
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
                    lineCount: content.split('\n').length,
                    charCount: content.length
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
                       `📊 Số ký tự: ${fileInfo.charCount}\n` + 
                       `🕐 Tạo lúc: ${fileInfo.created}\n` +
                       `✏️ Sửa lúc: ${fileInfo.modified}\n` +
                       `──────────────────`;
            };

            const validateInput = (fileName) => {
                if (!fileName) throw new Error('Thiếu tên file!');
                if (fileName.includes('..')) throw new Error('Đường dẫn không hợp lệ!');
                const invalidChars = /[<>:"|?*]/g;
                if (invalidChars.test(fileName)) throw new Error('Tên file chứa ký tự không hợp lệ!');
                return true;
            };

            switch (cmd) {
                case 'list':
                    try {
                        const files = fs.readdirSync(commandsDir)
                            .filter(file => file.endsWith('.js'))
                            .map(file => {
                                try {
                                    const stats = fs.statSync(path.join(commandsDir, file));
                                    const moduleInfo = require(path.join(commandsDir, file));
                                    return `📄 ${file} (${(stats.size / 1024).toFixed(1)}KB) - ${moduleInfo.info || 'Không có mô tả'}`;
                                } catch (err) {
                                    return `📄 ${file} (Lỗi đọc thông tin)`;
                                }
                            })
                            .join('\n');
                        
                        return safeApiSend(api, `📚 DANH SÁCH LỆNH:\n\n${files}`, threadID, messageID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'info':
                    try {
                        validateInput(name);
                        const infoPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        if (!fs.existsSync(infoPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                        const fileInfo = getFileDetails(infoPath);
                        return safeApiSend(api, formatFileInfo(fileInfo), threadID, messageID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'new':
                    try {
                        validateInput(name);
                        const content = target.slice(2).join(" ");
                        if (!content) throw new Error('Thiếu nội dung file!');
                        const newPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        if (fs.existsSync(newPath)) return safeApiSend(api, "⚠️ Lệnh này đã tồn tại!", threadID);
                        fs.writeFileSync(newPath, content, 'utf8');
                        return safeApiSend(api, `✅ Đã tạo lệnh ${name}`, threadID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'edit':
                    try {
                        validateInput(name);
                        const editContent = target.slice(2).join(" ");
                        if (!editContent) throw new Error('Thiếu nội dung cần sửa!');
                        const editPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        if (!fs.existsSync(editPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                        fs.writeFileSync(editPath, editContent, 'utf8');
                        return safeApiSend(api, `✅ Đã cập nhật lệnh ${name}`, threadID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'del':
                    try {
                        validateInput(name);
                        const delPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        if (!fs.existsSync(delPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                        fs.unlinkSync(delPath);
                        return safeApiSend(api, `✅ Đã xóa lệnh ${name}`, threadID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'read':
                    try {
                        validateInput(name);
                        const readPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        if (!fs.existsSync(readPath)) return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                        const fileContent = fs.readFileSync(readPath, 'utf8');
                        return safeApiSend(api, `📄 Nội dung ${name}:\n\n${fileContent}`, threadID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'rename':
                    try {
                        validateInput(name);
                        const newName = target[2];
                        validateInput(newName);
                        
                        const oldPath = path.join(commandsDir, name.endsWith('.js') ? name : `${name}.js`);
                        const newPath = path.join(commandsDir, newName.endsWith('.js') ? newName : `${newName}.js`);
                        
                        if (!fs.existsSync(oldPath)) {
                            return safeApiSend(api, "⚠️ Lệnh không tồn tại!", threadID);
                        }
                        
                        fs.renameSync(oldPath, newPath);
                        return safeApiSend(api, `✅ Đã đổi tên ${name} thành ${newName}`, threadID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'set':
                    try {
                        if (!name || target.length < 4) {
                            return safeApiSend(api, 
                                "Sử dụng: command set <tên lệnh> <thuộc tính> <giá trị>\n" +
                                "- Thuộc tính: usedby/prefix/cooldown\n" +
                                "- Ví dụ: command set help usedby 1", 
                                threadID, messageID);
                        }

                        const property = target[2].toLowerCase();
                        const value = target[3].toLowerCase();
                        const cmdPath = path.join(commandsDir, `${name}.js`);
                        
                        if (!fs.existsSync(cmdPath)) {
                            return safeApiSend(api, `❌ Lệnh "${name}" không tồn tại!`, threadID, messageID);
                        }

                        let fileContent = fs.readFileSync(cmdPath, 'utf8');

                        switch (property) {
                            case 'usedby':
                                const usedbyValue = parseInt(value);
                                if (![0, 1, 2].includes(usedbyValue)) {
                                    return safeApiSend(api, "❌ Giá trị usedby không hợp lệ! (0/1/2)", threadID, messageID);
                                }
                                fileContent = fileContent.replace(/usedby:\s*\d+/, `usedby: ${usedbyValue}`);
                                break;

                            case 'prefix':
                                if (!['true', 'false'].includes(value)) {
                                    return safeApiSend(api, "❌ Giá trị prefix không hợp lệ! (true/false)", threadID, messageID);
                                }
                                fileContent = fileContent.replace(/onPrefix:\s*\w+/, `onPrefix: ${value}`);
                                break;

                            case 'cooldown':
                                const cooldownValue = parseInt(value);
                                if (isNaN(cooldownValue) || cooldownValue < 0 || cooldownValue > 300) {
                                    return safeApiSend(api, "❌ Giá trị cooldown không hợp lệ! (0-300)", threadID, messageID);
                                }
                                fileContent = fileContent.replace(/cooldowns:\s*\d+/, `cooldowns: ${cooldownValue}`);
                                break;

                            default:
                                return safeApiSend(api, "❌ Thuộc tính không hợp lệ! (usedby/prefix/cooldown)", threadID, messageID);
                        }

                        fs.writeFileSync(cmdPath, fileContent);
                        delete require.cache[require.resolve(cmdPath)];
                        
                        return safeApiSend(api, 
                            `✅ Đã cập nhật lệnh "${name}":\n` +
                            `- ${property}: ${value}`,
                            threadID, messageID
                        );
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }

                case 'upload':
                    try {
                        if (!name) return safeApiSend(api, "Vui lòng nhập tên lệnh cần upload!", threadID, messageID);
                        
                        fs.readFile(
                            `${commandsDir}/${name}.js`,
                            "utf-8",
                            async (err, data) => {
                                if (err) return safeApiSend(api, `Lệnh ${name} không tồn tại!`, threadID, messageID);
                                
                                const client = new PasteClient("P5FuV7J-UfXWFmF4lUTkJbGnbLBbLZJo");
                                try {
                                    const url = await client.createPaste({
                                        code: data,
                                        expireDate: 'N',
                                        format: "javascript",
                                        name: name,
                                        publicity: 1
                                    });
                                    
                                    const rawUrl = 'https://pastebin.com/raw/' + url.split('/')[3];
                                    return safeApiSend(api, rawUrl, threadID, messageID);
                                } catch (err) {
                                    return safeApiSend(api, `❌ Lỗi upload: ${err.message}`, threadID, messageID);
                                }
                            }
                        );
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi: ${err.message}`, threadID, messageID);
                    }
                    break;

                case 'import':
                    try {
                        if (!name || !messageReply) {
                            return safeApiSend(api, "Vui lòng reply link chứa code và nhập tên lệnh!", threadID, messageID);
                        }

                        const url = messageReply.body;
                        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
                        const urlMatch = url.match(urlRegex);

                        if (!urlMatch) {
                            return safeApiSend(api, "❌ Link không hợp lệ!", threadID, messageID);
                        }

                        if (url.includes('pastebin.com')) {
                            const response = await axios.get(url);
                            const filePath = path.join(commandsDir, `${name}.js`);
                            fs.writeFileSync(filePath, response.data, 'utf8');
                            return safeApiSend(api, `✅ Đã import lệnh ${name}.js`, threadID, messageID);
                        }

                        if (url.includes('drive.google.com')) {
                            const id = url.match(/[-\w]{25,}/);
                            if (!id) return safeApiSend(api, "❌ Link Google Drive không hợp lệ!", threadID, messageID);
                            
                            const filePath = path.join(commandsDir, `${name}.js`);
                            const driveUrl = `https://drive.google.com/u/0/uc?id=${id[0]}&export=download`;
                            
                            const response = await axios.get(driveUrl);
                            fs.writeFileSync(filePath, response.data, 'utf8');
                            return safeApiSend(api, `✅ Đã import lệnh ${name}.js`, threadID, messageID);
                        }

                        return safeApiSend(api, "❌ Chỉ hỗ trợ link từ Pastebin và Google Drive!", threadID, messageID);
                    } catch (err) {
                        return safeApiSend(api, `❌ Lỗi import: ${err.message}`, threadID, messageID);
                    }

                default:
                    return safeApiSend(api, this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error('Command Error:', error);
            return safeApiSend(api, `❌ Lỗi: ${error.message}`, threadID, messageID);
        }
    }
};
