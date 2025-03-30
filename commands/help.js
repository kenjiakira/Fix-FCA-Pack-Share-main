const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const adminConfig = JSON.parse(fs.readFileSync("admin.json", "utf8"));

// Load API key cho Gemini
const API_KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, "./json/chatbot/key.json"))).api_keys;
const genAI = new GoogleGenerativeAI(API_KEYS[0]);

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

            if (target[0]?.toLowerCase() === "all") {
                let msg = "DANH SÁCH TẤT CẢ LỆNH\n\n";
                
                const sortedCategories = Object.values(categories)
                    .sort((a, b) => a.priority - b.priority);

                sortedCategories.forEach((category) => {
                    const icon = this.getCategoryIcon(category.name);
                    msg += `${icon} ${category.name.toUpperCase()}\n`;
                    
                    category.commands.forEach((cmd) => {
                        const cmdIcon = this.getCommandIcon(cmd);
                        msg += `  ${cmdIcon} ${cmd.name} - ${cmd.info || "Không có mô tả"}\n`;
                    });
                    
                    msg += "\n";
                });

                msg += "╚═══════════════╝\n";
                msg += `📊 Tổng số lệnh: ${totalCommands}`;

                return api.sendMessage(msg, threadID, messageID);
            }

            if (!target[0]) {
                let msg = "🎮 HƯỚNG DẪN SỬ DỤNG BOT 🎮\n";
                msg += "━━━━━━━━━━━━━━━━━━\n\n";
                msg += "📱 DANH MỤC LỆNH:\n\n";
                
                const sortedCategories = Object.values(categories)
                    .sort((a, b) => a.priority - b.priority);

                sortedCategories.forEach((category, index) => {
                    const icon = this.getCategoryIcon(category.name);
                    msg += `${index + 1}. ${icon} ${category.name}\n`;
                    msg += `➣ Số lệnh: ${category.commands.length}\n`;
                    msg += `➣ ${this.getCategoryDescription(category.name)}\n\n`;
                });

                // Thêm phần gợi ý AI
                const commands = commandFiles.map(file => {
                    try {
                        return require(path.join(cmdsPath, file));
                    } catch (err) {
                        return null;
                    }
                }).filter(cmd => cmd !== null);

                const aiSuggestions = await this.getAISuggestions(commands);
                msg += "🤖 GỢI Ý CHO BẠN:\n";
                msg += aiSuggestions + "\n\n";

                msg += "📌 CÁCH SỬ DỤNG:\n\n";
                msg += "1️⃣ Xem chi tiết danh mục:\n";
                msg += "• Reply số thứ tự để xem\n";
                msg += "• VD: Reply 1 để xem danh mục System\n\n";
                
                msg += "2️⃣ Tìm kiếm lệnh:\n";
                msg += `• ${prefix}help <tên lệnh>\n`;
                msg += "• VD: help coin để xem lệnh coin\n\n";
                
                msg += "3️⃣ Xem tất cả lệnh:\n";
                msg += `• ${prefix}help all\n\n`;
                
                
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

            if (target[0].startsWith("ai")) {
                // Xử lý AI help
                const query = target.slice(1).join(" ");
                if (!query) {
                    return api.sendMessage(
                        "⚠️ Vui lòng nhập nội dung cần trợ giúp!\n" +
                        `Ví dụ: ${prefix}help ai "Tôi muốn tải nhạc"`,
                        threadID, messageID
                    );
                }

                api.sendMessage("🤖 Đang tìm gợi ý phù hợp...", threadID, messageID);

                const commands = commandFiles.map(file => {
                    try {
                        return require(path.join(cmdsPath, file));
                    } catch (err) {
                        return null;
                    }
                }).filter(cmd => cmd !== null);

                const aiSuggestion = await getAIHelp(query, commands);
                return api.sendMessage(aiSuggestion, threadID, messageID);
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

                let msg = `TRANG ${page}/${totalPages}\n\n`;
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

                msg += "╚════════════════╝\n\n";
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
                
                let msg = `${category.name.toUpperCase()}\n\n`;
                
                commands.forEach((cmd, index) => {
                    const icon = this.getCommandIcon(cmd);
                    msg += `${index + 1}. ${icon} ${cmd.name}\n`;
                    msg += `➣ ${cmd.info || "Không có mô tả"}\n`;
                });

                msg += "╚══Basketball══╝\n\n";
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
        let msg = `🔎 CHI TIẾT LỆNH: ${cmd.name.toUpperCase()} 🔎\n`;
        msg += "━━━━━━━━━━━━━━━━━━\n\n";
        
        msg += `${icon} Tên lệnh: ${cmd.name}\n`;
        msg += `📝 Mô tả: ${cmd.info || "Không có"}\n`;
        msg += `💡 Cách dùng: ${cmd.usages || prefix + cmd.name}\n`;
        msg += `👥 Quyền hạn: ${this.getPermissionText(cmd.usedby)}\n`;
        msg += `⏱️ Thời gian chờ: ${cmd.cooldowns || 0}s\n`;
        msg += `👨‍💻 Tác giả: ${cmd.dev || "Không có"}\n\n`;
        
        msg += "📌 VÍ DỤ SỬ DỤNG:\n";
        msg += this.getCommandExamples(cmd.name, prefix);
        
        msg += "\n💡 MẸO:\n";
        msg += this.getCommandTips(cmd.name);
        
        return msg;
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
            "Anime": 12,
            "Khác": 13
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
            "Anime": "🎌",
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
    },

    getCategoryDescription(category) {
        const descriptions = {
            "System": "Các lệnh hệ thống và quản lý bot",
            "Admin Commands": "Lệnh dành cho quản trị viên",
            "Groups": "Quản lý và tương tác nhóm chat",
            "Games": "Các trò chơi giải trí hấp dẫn",
            "Media": "Tải nhạc, video và xem phim",
            "Tài Chính": "Quản lý tiền bạc và giao dịch",
            "Tools": "Công cụ tiện ích hữu ích",
            "Giải Trí": "Lệnh vui vẻ giải trí",
            "Tiện Ích": "Các tiện ích phụ trợ",
            "AI": "Tương tác với trí tuệ nhân tạo",
            "VIP": "Tính năng đặc biệt cho VIP",
            "Anime": "Thông tin và hình ảnh anime",
            "Khác": "Các lệnh khác"
        };
        return descriptions[category] || "Không có mô tả";
    },

    getCommandExamples(cmdName, prefix) {
        const examples = {
            "help": `• ${prefix}help\n• ${prefix}help coin\n• ${prefix}help 1`,
            "coin": `• ${prefix}coin mine\n• ${prefix}coin info\n• ${prefix}coin upgrade`,
            "market": `• ${prefix}market\n• ${prefix}market buy\n• ${prefix}market sell`,
        };
        return examples[cmdName] || `• ${prefix}${cmdName}`;
    },

    getCommandTips(cmdName) {
        const tips = {
            "help": "• Dùng help ai để được trợ giúp thông minh\n• Đọc kỹ hướng dẫn trước khi dùng lệnh\n• Dùng help all để xem tất cả lệnh",
            "coin": "• Nâng cấp đều các chỉ số để hiệu quả nhất\n• Bật autosell để tự động bán coin",
            "market": "• Theo dõi biến động giá để mua bán\n• Dùng chart để xem biểu đồ giá",
        };
        return tips[cmdName] || "• Đọc kỹ hướng dẫn trước khi sử dụng";
    },

    // Thêm hàm mới để lấy gợi ý AI
    async getAISuggestions(commands) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `Là trợ lý bot, hãy đề xuất 3 lệnh phổ biến và hữu ích nhất từ danh sách lệnh sau:

Danh sách lệnh:
${commands.map(cmd => `- ${cmd.name}: ${cmd.info}`).join('\n')}

Trả về ngắn gọn theo định dạng:
1. [tên lệnh] - [công dụng ngắn gọn]
2. [tên lệnh] - [công dụng ngắn gọn] 
3. [tên lệnh] - [công dụng ngắn gọn]`;

        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error("AI Suggestions error:", error);
            return "• Không thể tạo gợi ý do lỗi AI";
        }
    }
};

// Thêm hàm AI helper mới
async function getAIHelp(query, commands) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Là trợ lý bot Discord, hãy gợi ý các lệnh phù hợp cho yêu cầu: "${query}"

Danh sách lệnh có sẵn:
${commands.map(cmd => `- ${cmd.name}: ${cmd.info}`).join('\n')}

Trả về định dạng:
1. Lệnh phù hợp nhất: [tên lệnh]
2. Lý do: [giải thích ngắn gọn]
3. Cách dùng: [hướng dẫn cụ thể]
4. Lệnh liên quan: [2-3 lệnh]`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("AI Help error:", error);
        return "❌ Không thể tạo gợi ý do lỗi AI";
    }
}
