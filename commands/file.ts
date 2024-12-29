const fs = require('fs');
const path = require('path');

module.exports = {
    name: "file",
    usedBy: 4,
    dev: "Hoàng Ngọc Từ",
    info: "Lệnh quản trị file và thư mục",
    onPrefix: true,
    usages: "[addfile | delfile | adddir | deldir | editfile | viewfile] [đường dẫn] [nội dung (với addfile/editfile)]",
    cooldowns: 5,

  onLaunch: async ({ api, event, target }) => {
    const { threadID, messageID, senderID } = event;

    if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("Bạn không có quyền sử dụng lệnh này.", threadID, messageID);
    }

    const basePath = path.join(__dirname, '../commands');

    const ensureDirExists = (dirPath) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    };

    const listFilesAndDirs = (dirPath) => {
        return fs.readdirSync(dirPath).map(item => {
            const fullPath = path.join(dirPath, item);
            return fs.statSync(fullPath).isDirectory() ? `📁 ${item}` : `📄 ${item}`;
        }).join('\n');
    };

    if (target.length === 0) {
        ensureDirExists(basePath);
        const itemsList = listFilesAndDirs(basePath);
        const message = itemsList.length ? `Danh sách trong 'commands':\n${itemsList}` : "Thư mục 'commands' hiện tại trống.";
        return api.sendMessage(message, threadID, messageID);
    }

    if (target.length < 2) {
        return api.sendMessage("Sai cú pháp. Sử dụng: [addfile | delfile | adddir | deldir | editfile | viewfile] [đường dẫn] [nội dung (với addfile/editfile)]", threadID, messageID);
    }

    const [command, filePath, ...content] = target;
    const targetPath = path.join(basePath, filePath);
    const dirName = path.dirname(targetPath);

    ensureDirExists(dirName);

    try {
        switch (command.toLowerCase()) {
            case 'addfile':
                if (fs.existsSync(targetPath)) {
                    return api.sendMessage("File đã tồn tại.", threadID, messageID);
                }
                fs.writeFileSync(targetPath, content.join(' '), 'utf8');
                return api.sendMessage(`File '${filePath}' đã được tạo với nội dung:\n${content.join(' ')}`, threadID, messageID);

            case 'delfile':
                if (!fs.existsSync(targetPath)) {
                    return api.sendMessage("File không tồn tại.", threadID, messageID);
                }
                fs.unlinkSync(targetPath);
                return api.sendMessage(`File '${filePath}' đã được xóa.`, threadID, messageID);

            case 'adddir':
                if (fs.existsSync(targetPath)) {
                    return api.sendMessage("Thư mục đã tồn tại.", threadID, messageID);
                }
                fs.mkdirSync(targetPath, { recursive: true });
                return api.sendMessage(`Thư mục '${filePath}' đã được tạo.`, threadID, messageID);

            case 'deldir':
                if (!fs.existsSync(targetPath)) {
                    return api.sendMessage("Thư mục không tồn tại.", threadID, messageID);
                }
                fs.rmdirSync(targetPath, { recursive: true });
                return api.sendMessage(`Thư mục '${filePath}' đã được xóa.`, threadID, messageID);

            case 'editfile':
                if (!fs.existsSync(targetPath)) {
                    return api.sendMessage("File không tồn tại.", threadID, messageID);
                }
                fs.writeFileSync(targetPath, content.join(' '), 'utf8');
                return api.sendMessage(`File '${filePath}' đã được chỉnh sửa với nội dung:\n${content.join(' ')}`, threadID, messageID);

            case 'viewfile':
                if (!fs.existsSync(targetPath)) {
                    return api.sendMessage("File không tồn tại.", threadID, messageID);
                }
                const fileContent = fs.readFileSync(targetPath, 'utf8');
                return api.sendMessage(`Nội dung của file '${filePath}':\n${fileContent}`, threadID, messageID);

            default:
                return api.sendMessage("Lệnh không hợp lệ. Sử dụng: [addfile | delfile | adddir | deldir | editfile | viewfile] [đường dẫn] [nội dung (với addfile/editfile)]", threadID, messageID);
        }
    } catch (error) {
        console.error("Lỗi khi xử lý lệnh:", error);
        return api.sendMessage("Đã xảy ra lỗi khi thực hiện lệnh.", threadID, messageID);
    }
}
};