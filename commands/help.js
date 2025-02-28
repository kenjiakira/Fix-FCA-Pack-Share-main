const fs = require("fs");
const path = require("path");
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

module.exports = {
    name: "help",
    usedby: 0,
    info: "Hiển thị danh sách lệnh bot",
    dev: "HNT",
    onPrefix: true,
    usages: "[tên lệnh/số trang]",
    cooldowns: 5,

    onLoad: function() {
        if (!global.client) global.client = {};
        if (!global.client.onReply) global.client.onReply = [];
    },

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const prefix = adminConfig.prefix;

        try {
            const cmdsPath = __dirname;
            const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
            const totalCommands = commandFiles.length;

            const categories = {};
            for (const file of commandFiles) {
                try {
                    const command = require(path.join(cmdsPath, file));
                    if (!command.hide) {
                        const category = command.category || "Khác";
                        if (!categories[category]) {
                            categories[category] = {
                                name: category,
                                commands: [],
                                priority: this.getCategoryPriority(category)
                            };
                        }
                        categories[category].commands.push(command);
                    }
                } catch (err) {
                    console.error(`Error loading command ${file}:`, err);
                }
            }

            if (!target[0]) {
                let msg = "╔════ DANH SÁCH LỆNH ════╗\n\n";
                
                const sortedCategories = Object.values(categories)
                    .sort((a, b) => a.priority - b.priority);

                sortedCategories.forEach((category, index) => {
                    const icon = this.getCategoryIcon(category.name);
                    msg += `${index + 1}. ${icon} ${category.name}\n`;
                    msg += `➣ Số lệnh: ${category.commands.length}\n\n`;
                });

                msg += "╚═══════════════════════╝\n\n";
                msg += "📌 Hướng dẫn sử dụng:\n";
                msg += "• Reply số để xem chi tiết\n";
                msg += `• ${prefix}help <tên lệnh>\n`;
                msg += `• ${prefix}help <số trang>\n\n`;
                msg += `📊 Tổng số lệnh: ${totalCommands}`;

                const sent = await api.sendMessage(msg, threadID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: senderID,
                        data: sortedCategories,
                        type: "categories"
                    });
                }
                return;
            }

            const commandName = target[0].toLowerCase();
            const command = commandFiles.find(file => {
                try {
                    const cmd = require(path.join(cmdsPath, file));
                    return cmd.name?.toLowerCase() === commandName;
                } catch (err) {
                    console.error(`Error loading command ${file}:`, err);
                    return false;
                }
            });

            if (command) {
                const cmd = require(path.join(cmdsPath, command));
                return api.sendMessage(
                    this.getCommandInfo(cmd, prefix),
                    threadID, messageID
                );
            }

            const page = parseInt(target[0]);
            if (!isNaN(page)) {
                const cmdsPerPage = 10;
                const totalPages = Math.ceil(totalCommands / cmdsPerPage);

                if (page < 1 || page > totalPages) {
                    return api.sendMessage(
                        `⚠️ Số trang phải từ 1 đến ${totalPages}`, 
                        threadID, messageID
                    );
                }

                let msg = `╔═══ TRANG ${page}/${totalPages} ═══╗\n\n`;
                const start = (page - 1) * cmdsPerPage;
                const end = start + cmdsPerPage;
                
                const cmds = commandFiles.slice(start, end).map(file => {
                    try {
                        return require(path.join(cmdsPath, file));
                    } catch (err) {
                        console.error(`Error loading command ${file}:`, err);
                        return null;
                    }
                }).filter(cmd => cmd !== null);

                cmds.forEach((cmd, index) => {
                    if (!cmd.hide) {
                        const icon = this.getCommandIcon(cmd);
                        msg += `${start + index + 1}. ${icon} ${cmd.name}\n`;
                        msg += `➣ ${cmd.info || "Không có mô tả"}\n\n`;
                    }
                });

                msg += "╚═══════════════════════╝\n\n";
                msg += "📌 Hướng dẫn:\n";
                msg += `• ${prefix}help <tên lệnh> để xem chi tiết\n`;
                msg += `• Trang ${page - 1 > 0 ? `${page - 1}, ` : ""}${page + 1 <= totalPages ? `${page + 1}` : ""}`;

                return api.sendMessage(msg, threadID, messageID);
            }

            return api.sendMessage(
                "⚠️ Lệnh không hợp lệ!\n\n" +
                "📌 Sử dụng:\n" +
                `• ${prefix}help để xem danh mục\n` +
                `• ${prefix}help <tên lệnh> để xem chi tiết\n` +
                `• ${prefix}help <số trang> để xem theo trang`,
                threadID, messageID
            );

        } catch (error) {
            console.error("Help command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body, messageReply } = event;
        
        try {
            if (!messageReply) return;

            const input = parseInt(body);
            if (!input) return;

            const replyData = global.client.onReply.find(r => r.messageID === messageReply.messageID);
            if (!replyData || senderID != replyData.author) return;

            if (replyData.type === "categories") {
                const categories = replyData.data;
                if (input > categories.length) return;

                const category = categories[input - 1];
                const commands = category.commands;
                
                let msg = `╔═══ ${category.name.toUpperCase()} ═══╗\n\n`;
                
                commands.forEach((cmd, index) => {
                    const icon = this.getCommandIcon(cmd);
                    msg += `${index + 1}. ${icon} ${cmd.name}\n`;
                    msg += `➣ ${cmd.info || "Không có mô tả"}\n`;
                });

                msg += "╚═══════════════════════╝\n\n";
                msg += "📌 Reply số thứ tự để xem chi tiết lệnh";

                const sent = await api.sendMessage(msg, threadID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: senderID,
                        data: commands,
                        type: "commands"
                    });
                }
            }
            else if (replyData.type === "commands") {
                const commands = replyData.data;
                if (input > commands.length) return;
                
                const cmd = commands[input - 1];
                const msg = this.getCommandInfo(cmd, adminConfig.prefix);
                
                const sent = await api.sendMessage(msg, threadID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: senderID
                    });
                }
            }

        } catch (error) {
            console.error("Help reply error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    getCommandInfo(cmd, prefix) {
        const icon = this.getCommandIcon(cmd);
        return `╔═══ ${cmd.name.toUpperCase()} ═══╗\n\n` +
               `${icon} Tên: ${cmd.name}\n` +
               `📝 Mô tả: ${cmd.info || "Không có"}\n` +
               `💡 Cách dùng: ${cmd.usages || prefix + cmd.name}\n` +
               `👥 Quyền hạn: ${this.getPermissionText(cmd.usedby)}\n` +
               `⏱️ Cooldown: ${cmd.cooldowns || 0}s\n` +
               `👨‍💻 Author: ${cmd.dev || "Không có"}\n\n` +
               `╚═══════════════════════╝`;
    },

    getCategoryPriority(category) {
        const priorities = {
            "System": 1,
            "Admin Commands": 2, 
            "Groups": 3,
            "Games": 4,
            "Media": 5,
            "Tài Chính": 6,
            "Tools": 7,
            "Giải Trí": 8,
            "Tiện Ích": 9,
            "AI": 10,
            "VIP": 11,
            "Khác": 12
        };
        return priorities[category] || 10;
    },

    getCategoryIcon(category) {
        const icons = {
            "System": "⚙️",
            "Admin Commands": "👑",
            "Groups": "📦",
            "Games": "🎮",
            "Media": "🎵",
            "Tài Chính": "💰",
            "Tools": "🛠️",
            "Giải Trí": "🎯",
            "Tiện Ích": "🔧",
            "AI": "🤖",
            "VIP": "👑",
            "Khác": "📌"
        };
        return icons[category] || "📍";
    },

    getCommandIcon(cmd) {
        if (cmd.usedby === 2) return "👑";
        if (cmd.usedby === 1) return "👥";
        return "👤";
    },

    getPermissionText(permission) {
        switch (permission) {
            case 0: return "Thành viên";
            case 1: return "Quản trị viên nhóm";
            case 2: return "Quản trị viên bot";
            case 3: return "Điều hành viên";
            case 4: return "Quản trị viên & Điều hành viên"; 
            default: return "Không xác định";
        }
    }
};
