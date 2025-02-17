const fs = require("fs");
const path = require("path");
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
    name: "help",
    usedby: 0,
    info: "Hiển thị các lệnh có sẵn và thông tin chi tiết. Sử dụng: help [số trang | all | tên lệnh]",
    dev: "HNT",
    onPrefix: true,
    usages: "help [số trang | all | tên lệnh]",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target = [] }) {
        try {
            const cmdsPath = path.join(__dirname, '');
            const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));

            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            const visibleCommandFiles = commandFiles.filter(file => {
                try {
                    const command = require(path.join(cmdsPath, file));
                    return !command.hide;
                } catch (err) {
                    console.error(`Error loading command ${file}:`, err);
                    return false;
                }
            });

            const totalCommands = visibleCommandFiles.length;

            if (target[0] === "all") {
                let allCommandsMessage = `⚡️ 𝗞𝗘𝗡𝗝𝗜 𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 ⚡️\n`;
                allCommandsMessage += `▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;
                visibleCommandFiles.forEach((file, index) => {
                    const commandInfo = require(path.join(cmdsPath, file));
                    allCommandsMessage += `│ ${index + 1}. ⟩ ${commandInfo.name || "Không xác định"}\n└❈ ${commandInfo.info || "Không có mô tả"}\n`;
                });
                allCommandsMessage += `\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n`;
                allCommandsMessage += `⌬ Trang: Toàn bộ\n`;
                allCommandsMessage += `⌬ Tổng lệnh: ${totalCommands}\n`;
                allCommandsMessage += `⌬ Hướng dẫn: ${adminConfig.prefix}help <số trang>\n`;
                allCommandsMessage += `⌬ Xem toàn bộ:  ${adminConfig.prefix}help all\n`;
                allCommandsMessage += `⌬ Developer: ${adminConfig.ownerName}`;
                return api.sendMessage(allCommandsMessage, event.threadID, event.messageID);
            }

            const commandsPerPage = 10;
            const totalPages = Math.ceil(visibleCommandFiles.length / commandsPerPage);
            
            let page = target[0] ? parseInt(target[0]) : 1;

            if (!isNaN(page)) {
                if (page <= 0 || page > totalPages) {
                    return api.sendMessage(`Trang không tồn tại. Vui lòng chọn từ 1 đến ${totalPages}.`, event.threadID, event.messageID);
                }

                const startIndex = (page - 1) * commandsPerPage;
                const endIndex = Math.min(startIndex + commandsPerPage, visibleCommandFiles.length);

                let helpMessage = `⚡️ 𝗞𝗘𝗡𝗝𝗜 𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 ⚡️\n`;
                helpMessage += `▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n`;

                const displayedCommands = visibleCommandFiles.slice(startIndex, endIndex);

                displayedCommands.forEach((file, index) => {
                    const commandInfo = require(path.join(cmdsPath, file));
                    helpMessage += `│ ${startIndex + index + 1}. ⟩ ${commandInfo.name || "Không xác định"}\n└❈ ${commandInfo.info || "Không có mô tả"}\n`;
                });

                helpMessage += `\n▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n`;
                helpMessage += `⌬ Trang: ${page}/${totalPages}\n`;
                helpMessage += `⌬ Tổng lệnh: 9999999999999999\n`;
                helpMessage += `⌬ Hướng dẫn: ${adminConfig.prefix}help <số trang>\n`;
                helpMessage += `⌬ Xem toàn bộ: ${adminConfig.prefix}help all\n`;
                helpMessage += `⌬ Developer: ${adminConfig.ownerName}`;
                return api.sendMessage(helpMessage, event.threadID, event.messageID);
            }

            if (target[0]) {
                const commandName = target[0];
                const commandFile = commandFiles.find(file => file === `${commandName}.js`);
                if (commandFile) {
                    try {
                        const commandInfo = require(path.join(cmdsPath, commandFile));
                        await delay(1000); 

                        const permissionText = commandInfo.usedby === undefined ? "Không xác định" :
                            commandInfo.usedby === 0 ? "Thành viên" :
                            commandInfo.usedby === 1 ? "Quản trị viên nhóm" :
                            commandInfo.usedby === 2 ? "Quản trị viên bot" :
                            commandInfo.usedby === 3 ? "Người điều hành" :
                            commandInfo.usedby === 4 ? "Quản trị viên và Người điều hành" : "Không xác định";

                        const helpMessage = `⚡️ 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗟𝗘̣̂𝗡𝗛 ⚡️\n` +
                            `▱▱▱▱▱▱▱▱▱▱▱▱▱▱\n\n` +
                            `│ Tên lệnh ⟩ ${commandInfo.name || "Không xác định"}\n` +
                            `│ Quyền hạn ⟩ ${permissionText}\n` +
                            `│ Developer ⟩ ${commandInfo.dev || "Không xác định"}\n` +
                            `│ Thời gian chờ ⟩ ${commandInfo.cooldowns || "0"}s\n` +
                            `│ Prefix ⟩ ${commandInfo.onPrefix ? "Cần" : "Không cần"}\n` +
                            `└❈ Cách dùng: ${commandInfo.usages || "Không có"}\n\n` +
                            `✎ Mô tả: ${commandInfo.info || "Không có mô tả"}\n` +
                            `▱▱▱▱▱▱▱▱▱▱▱▱▱▱`;
                        return api.sendMessage(helpMessage, event.threadID, event.messageID);
                    } catch (err) {
                        console.error(`Error processing command ${commandName}:`, err);
                        return api.sendMessage(`Có lỗi xảy ra khi xử lý lệnh "${commandName}".`, event.threadID, event.messageID);
                    }
                }
            }
        } catch (err) {
            console.error("Help command error:", err);
            return api.sendMessage("Có lỗi xảy ra khi thực hiện lệnh help.", event.threadID, event.messageID);
        }
    }
};