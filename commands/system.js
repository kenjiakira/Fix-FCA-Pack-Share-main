const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: "system",
    dev: "HNT",
    category: "System",
    info: "Quản lý cài đặt hệ thống của bot",
    usedby: 5,
    cooldowns: 5,
    onPrefix: true,
    usages: [
        "system mode admin on/off - Bật/tắt chế độ chỉ admin nhóm",
        "system mode maintain on/off - Bật/tắt chế độ bảo trì",
        "system mode status - Xem trạng thái các chế độ",
        "system prefix [true/false] [tên lệnh] - Bật/tắt prefix của lệnh",
        "system npm [list | install | uninstall] <tên_gói>",
        "system shell <lệnh>"
    ],

    onLoad: function() {
        const jsonPath = path.join(__dirname, 'json', 'adminonly.json');
        const defaultData = {
            threads: {},
            enable: true
        };

        try {
            if (!fs.existsSync(path.dirname(jsonPath))) {
                fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
            }
            if (!fs.existsSync(jsonPath)) {
                fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
            }
        } catch (error) {
            console.error("Error in system onLoad:", error);
            fs.writeFileSync(jsonPath, JSON.stringify(defaultData, null, 4));
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        // Load admin configuration
        const adminConfigPath = path.join(__dirname, '..', 'admin.json');
        const adminConfig = JSON.parse(fs.readFileSync(adminConfigPath));
        const isAdmin = adminConfig.adminUIDs.includes(senderID);

        if (command === "mode") {
            return await this.handleMode({ api, event, target: target.slice(1) });
        } else if (command === "prefix") {
            return await this.handlePrefix({ api, event, target: target.slice(1) });
        } else if (command === "npm" || command === "shell") {
            if (!isAdmin) {
                return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này.", threadID);
            }
            return await this.handleAdminCommands({ api, event, target });
        } else {
            return api.sendMessage(
                "📝 Hướng dẫn sử dụng:\n" +
                "╭─────────────────╮\n" +
                "system mode admin on/off\n" +
                "system mode maintain on/off\n" +
                "system mode status\n" +
                "system prefix true/false [lệnh]\n" +
                "system npm [list | install | uninstall] <tên_gói>\n" +
                "system shell <lệnh>\n" +
                "╰─────────────────╯",
                threadID
            );
        }
    },

    handleMode: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const adminConfigPath = path.join(__dirname, '..', 'admin.json');
        const adminOnlyPath = path.join(__dirname, 'json', 'adminonly.json');

        try {
            let adminConfig = JSON.parse(fs.readFileSync(adminConfigPath));
            let adminOnlyData = JSON.parse(fs.readFileSync(adminOnlyPath));

            const mode = target[0]?.toLowerCase();
            const action = target[1]?.toLowerCase();

            const isAdmin = adminConfig.adminUIDs.includes(senderID);

            if (!mode || mode === "status") {
                return api.sendMessage(
                    `⚙️ TRẠNG THÁI CHẾ ĐỘ BOT\n` +
                    `╭─────────────────╮\n` +
                    `Admin only: ${adminOnlyData.threads[threadID] ? "ON ✅" : "OFF ❌"}\n` +
                    `Maintain: ${adminConfig.mtnMode ? "ON ✅" : "OFF ❌"}\n` +
                    `╰─────────────────╯\n\n` +
                    `Hướng dẫn sử dụng:\n` +
                    `👉 system mode admin on/off\n` +
                    `👉 system mode maintain on/off`, 
                    threadID
                );
            }

            if (!["admin", "maintain"].includes(mode) || !["on", "off"].includes(action)) {
                return api.sendMessage("❌ Cú pháp không hợp lệ!\n/system mode [admin|maintain] [on|off]", threadID);
            }

            const isEnable = action === "on";

            if (mode === "maintain" && !isAdmin) {
                return api.sendMessage("❌ Chỉ ADMIN mới có thể bật/tắt chế độ bảo trì!", threadID);
            }

            if (mode === "admin") {
                if (!adminOnlyData.threads) adminOnlyData.threads = {};
                adminOnlyData.threads[threadID] = isEnable;
                fs.writeFileSync(adminOnlyPath, JSON.stringify(adminOnlyData, null, 4));
                return api.sendMessage(
                    `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ chỉ Admin nhóm\n` +
                    `⚡ Hiện tại ${isEnable ? "chỉ Quản trị viên" : "tất cả thành viên"} mới có thể sử dụng bot`,
                    threadID
                );
            } else {
                adminConfig.mtnMode = isEnable;
                fs.writeFileSync(adminConfigPath, JSON.stringify(adminConfig, null, 2));
                return api.sendMessage(
                    `✅ Đã ${isEnable ? "bật" : "tắt"} chế độ bảo trì\n` +
                    `⚡ Hiện tại ${isEnable ? "chỉ Admin và Moderator" : "tất cả người dùng"} có thể sử dụng bot`,
                    threadID
                );
            }

        } catch (error) {
            console.error("Error in mode command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    handlePrefix: async function({ api, event, target }) {
        const { threadID } = event;
        const newState = target[0] === "true" ? true : false;
        const commandName = target[1];

        if (commandName) {
            const filePath = path.join(__dirname, `${commandName}.js`);

            if (fs.existsSync(filePath)) {
                const confirmationMessage = `⚠️ 𝗖𝗼𝗻𝗳𝗶𝗿𝗺 𝗖𝗵𝗮𝗻𝗴𝗶𝗻𝗴 𝗼𝗻𝗣𝗿𝗲𝗳𝗶𝘅\nBạn có muốn thay đổi trạng thái "onPrefix" của "${commandName}" thành ${newState}? Phản ứng (👍) để xác nhận hoặc (👎) để hủy bỏ.`;
                const sentMessage = await api.sendMessage(confirmationMessage, threadID);

                global.client.callReact.push({
                    name: this.name,
                    messageID: sentMessage.messageID,
                    commandName: commandName,
                    newState: newState,
                    action: 'toggleOnPrefix'
                });
            } else {
                await api.sendMessage(`❌ Lệnh "${commandName}" không tồn tại.`, threadID);
            }
        } else {
            await api.sendMessage("Cách sử dụng: system prefix [true|false] [tên lệnh]", threadID);
        }
    },

    handleAdminCommands: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const subCommand = target[0]?.toLowerCase();

        if (subCommand === "npm") {
            const action = target[1]?.toLowerCase();
            const packageName = target[2];

            if (!action) {
                return exec(`npm list --depth=0`, (error, stdout, stderr) => {
                    if (error) {
                        return api.sendMessage(
                            "Không thể lấy danh sách gói đã cài đặt. Vui lòng thử lại sau.",
                            threadID,
                            messageID
                        );
                    }

                    const packageList = stdout
                        .split("\n")
                        .slice(1)
                        .filter(line => line.trim() && line.includes("@"))
                        .map((line, index) => `${index + 1}. ${line.trim()}`)
                        .join("\n");

                    const response = packageList
                        ? `Các gói đã cài đặt:\n${packageList}`
                        : "Không có gói nào được cài đặt.";

                    api.sendMessage(response, threadID, messageID);
                });
            }

            if (action === "install") {
                if (!packageName) {
                    return api.sendMessage(
                        "Vui lòng cung cấp tên gói để cài đặt. Ví dụ: system npm install axios",
                        threadID,
                        messageID
                    );
                }

                return exec(`npm install ${packageName}`, (error, stdout, stderr) => {
                    if (error) {
                        return api.sendMessage(
                            `Lỗi khi cài đặt gói "${packageName}".\nChi tiết: ${stderr}`,
                            threadID,
                            messageID
                        );
                    }

                    api.sendMessage(
                        `Gói "${packageName}" đã được cài đặt thành công! 🎉`,
                        threadID,
                        messageID
                    );
                });
            }

            if (action === "uninstall") {
                if (!packageName) {
                    return api.sendMessage(
                        "Vui lòng cung cấp tên gói để gỡ bỏ. Ví dụ: system npm uninstall axios",
                        threadID,
                        messageID
                    );
                }

                return exec(`npm uninstall ${packageName}`, (error, stdout, stderr) => {
                    if (error) {
                        return api.sendMessage(
                            `Lỗi khi gỡ bỏ gói "${packageName}".\nChi tiết: ${stderr}`,
                            threadID,
                            messageID
                        );
                    }

                    api.sendMessage(
                        `Gói "${packageName}" đã được gỡ bỏ thành công! 🗑️`,
                        threadID,
                        messageID
                    );
                });
            }

            return api.sendMessage(
                "Lệnh không hợp lệ. Vui lòng sử dụng: system npm [list | install | uninstall] <tên_gói>",
                threadID,
                messageID
            );
        }

        if (subCommand === "shell") {
            const command = target.slice(1).join(" ");

            if (!command) {
                return api.sendMessage("Vui lòng cung cấp lệnh shell để thực thi.", threadID, messageID);
            }
            const blockedCommands = ['rm -rf', 'mkfs', 'dd', ':(){:|:&};:', 'wget', 'curl'];
            if (blockedCommands.some(cmd => command.toLowerCase().includes(cmd))) {
                return api.sendMessage("Lệnh này không được phép thực thi vì lý do bảo mật.", threadID, messageID);
            }

            const processingMessage = await api.sendMessage("Đang xử lý...", threadID, messageID);

            try {
                exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                    if (error) {
                        return api.editMessage(`⚠️ Lỗi thực thi: ${error.message}`, processingMessage.messageID, threadID, messageID);
                    }
                    if (stderr) {
                        return api.editMessage(`⚠️ Stderr: ${stderr}`, processingMessage.messageID, threadID, messageID);
                    }
                    const output = stdout || "Lệnh đã được thực thi thành công (không có output)";
                    api.editMessage(`✅ Kết quả:\n${output}`, processingMessage.messageID, threadID, messageID);
                });
            } catch (err) {
                api.editMessage(`❌ Lỗi hệ thống: ${err.message}`, processingMessage.messageID, threadID, messageID);
            }
        }
    },

    callReact: async function({ reaction, event, api }) {
        const { threadID, messageID } = event;
        const reactData = global.client.callReact.find(item => item.messageID === messageID);

        if (!reactData) return;

        const { commandName, newState, action, messageID: sentMessageID } = reactData;
        await api.unsendMessage(sentMessageID);

        if (reaction === '👍') {
            if (action === 'toggleOnPrefix') {
                const filePath = path.join(__dirname, `${commandName}.js`);

                if (fs.existsSync(filePath)) {
                    let commandFileContent = fs.readFileSync(filePath, 'utf-8');
                    commandFileContent = commandFileContent.replace(/onPrefix:\s*(true|false)/, `onPrefix: ${newState}`);

                    fs.writeFileSync(filePath, commandFileContent);
                    global.cc.reload[commandName];

                    await api.sendMessage(
                        `✅ Đã thay đổi trạng thái "onPrefix" của "${commandName}" thành ${newState} thành công.`,
                        threadID
                    );
                } else {
                    await api.sendMessage(`❌ Lệnh "${commandName}" không tồn tại.`, threadID);
                }
            }
        } else if (reaction === '👎') {
            await api.sendMessage(`❌ Hành động thay đổi trạng thái "onPrefix" cho "${commandName}" đã bị hủy.`, threadID);
        }
    }
};
