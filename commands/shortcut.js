const fs = require('fs');
const path = require('path');
const axios = require('axios');

const shortcutDataPath = path.join(__dirname, './json/shortcuts.json');
let shortcuts = {};

const loadShortcuts = () => {
    try {
        if (fs.existsSync(shortcutDataPath)) {
            shortcuts = JSON.parse(fs.readFileSync(shortcutDataPath, 'utf8'));
        } else {
            saveShortcuts();
        }
    } catch (error) {
        console.error('Error loading shortcuts:', error);
        shortcuts = {};
    }
};

const saveShortcuts = () => {
    try {
        const dir = path.dirname(shortcutDataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(shortcutDataPath, JSON.stringify(shortcuts, null, 2));
    } catch (error) {
        console.error('Error saving shortcuts:', error);
    }
};

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

module.exports = {
    name: "shortcut",
    dev: "HNT",
    usedby: 5,
    info: "Tạo và quản lý shortcut cho bot",
    usages: ".shortcut add <từ khóa> <phản hồi>\n.shortcut del <từ khóa>\n.shortcut list",
    onPrefix: true,
    cooldowns: 5,

    onLoad: function () {
        loadShortcuts();
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const command = target[0]?.toLowerCase();
        
        if (!command) {
            return api.sendMessage(
                "┏━━━『 SHORTCUT GUIDE 』━━━┓\n\n" +
                "1. Thêm shortcut văn bản:\n" +
                ".shortcut add <từ khóa> <phản hồi>\n" +
                "VD: .shortcut add hello | Xin chào cậu!\n" +
                "VD: .shortcut add morning | Chào buổi sáng -))\n" +
                "VD: .shortcut add haha | Haha vui quá =))\n\n" +
                "2. Thêm shortcut hình ảnh:\n" + 
                "Cách 1: .shortcut add <từ khóa> | <link ảnh>\n" +
                "VD: .shortcut add meme | https://i.imgur.com/abc.jpg\n" +
                "Cách 2: Reply ảnh + gõ từ khóa\n" +
                "VD: Reply ảnh + gõ 'cute'\n\n" +
                "3. Xóa shortcut:\n" +
                ".shortcut del <từ khóa/số thứ tự/all>\n" +
                "VD: .shortcut del hello\n" +
                "VD: .shortcut del 1\n" +
                "VD: .shortcut del 1 2 3\n" +
                "VD: .shortcut del all\n\n" +
                "4. Xem danh sách:\n" +
                ".shortcut list [số trang]\n" +
                "VD: .shortcut list\n" +
                "VD: .shortcut list 2\n\n" +
                "5. Cách sử dụng:\n" +
                "- Chỉ cần gõ từ khóa đã tạo\n" +
                "VD: hello\n" +
                "Bot: Xin chào cậu!\n" +
                "VD: haha\n" +
                "Bot: Haha vui quá =))\n" +
                "VD: meme\n" +
                "Bot: [Gửi hình ảnh]\n\n" +
                "┗━━━━━━━━━━━━━━━━━━━━┛",
                threadID, messageID
            );
        }

        switch (command) {
            case "add": {
                const input = target.slice(1).join(" ").split("|").map(s => s.trim());
                const keyword = input[0]?.toLowerCase();
                const response = input[1];

                if (!keyword) {
                    return api.sendMessage("⚠️ Vui lòng nhập từ khóa!", threadID, messageID);
                }

                if (!response) {
                    return api.sendMessage("⚠️ Vui lòng nhập nội dung phản hồi!", threadID, messageID);
                }

                if (!shortcuts[threadID]) {
                    shortcuts[threadID] = {};
                }

                shortcuts[threadID][keyword] = {
                    response,
                    type: isValidUrl(response) ? 'image' : 'text',
                    creator: senderID,
                    createdAt: Date.now()
                };

                saveShortcuts();
                return api.sendMessage(
                    `✅ Đã thêm shortcut:\n` +
                    `- Từ khóa: ${keyword}\n` +
                    `- Phản hồi: ${response.length > 50 ? response.slice(0, 50) + '...' : response}`,
                    threadID, messageID
                );
            }

            case "del": {
                const threadShortcuts = shortcuts[threadID] || {};
                if (Object.keys(threadShortcuts).length === 0) {
                    return api.sendMessage("⚠️ Chưa có shortcut nào để xóa!", threadID, messageID);
                }

                const args = target.slice(1);
                if (!args.length) {
                    return api.sendMessage("⚠️ Vui lòng chọn shortcut cần xóa!", threadID, messageID);
                }

                if (args[0].toLowerCase() === 'all') {
                    delete shortcuts[threadID];
                    saveShortcuts();
                    return api.sendMessage("✅ Đã xóa tất cả shortcut!", threadID, messageID);
                }

                const shortcuts_array = Object.entries(threadShortcuts);
                let deleted = [];
                let notFound = [];

                args.forEach(arg => {
                    const argLower = arg.toLowerCase();
                    if (/^\d+$/.test(arg)) {
                        // Xóa theo số thứ tự
                        const index = parseInt(arg) - 1;
                        if (index >= 0 && index < shortcuts_array.length) {
                            const [keyword] = shortcuts_array[index];
                            delete threadShortcuts[keyword];
                            deleted.push(keyword);
                        } else {
                            notFound.push(arg);
                        }
                    } else {
                        // Xóa theo keyword
                        if (threadShortcuts[argLower]) {
                            delete threadShortcuts[argLower];
                            deleted.push(argLower);
                        } else {
                            notFound.push(arg);
                        }
                    }
                });

                if (deleted.length > 0) {
                    if (Object.keys(threadShortcuts).length === 0) {
                        delete shortcuts[threadID];
                    } else {
                        shortcuts[threadID] = threadShortcuts;
                    }
                    saveShortcuts();
                    let msg = `✅ Đã xóa ${deleted.length} shortcut:\n${deleted.join(", ")}`;
                    if (notFound.length > 0) {
                        msg += `\n\n❌ Không tìm thấy ${notFound.length} mục:\n${notFound.join(", ")}`;
                    }
                    return api.sendMessage(msg, threadID, messageID);
                } else {
                    return api.sendMessage(`❌ Không tìm thấy shortcut: ${notFound.join(", ")}`, threadID, messageID);
                }
            }

            case "list": {
                const threadShortcuts = shortcuts[threadID] || {};
                if (Object.keys(threadShortcuts).length === 0) {
                    return api.sendMessage("⚠️ Chưa có shortcut nào được tạo!", threadID, messageID);
                }

                const page = parseInt(target[1]) || 1;
                const itemsPerPage = 10;
                const shortcuts_array = Object.entries(threadShortcuts);
                const totalPages = Math.ceil(shortcuts_array.length / itemsPerPage);

                if (page < 1 || page > totalPages) {
                    return api.sendMessage(`⚠️ Trang không hợp lệ! Chọn từ 1-${totalPages}`, threadID, messageID);
                }

                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const shortcutsPage = shortcuts_array.slice(start, end);

                let message = `📝 Danh sách shortcut (Trang ${page}/${totalPages}):\n\n`;
                shortcutsPage.forEach(([keyword, data], index) => {
                    const response = data.type === 'image' ? '[Hình ảnh]' : data.response;
                    const displayResponse = typeof response === 'string' ? 
                        (response.length > 30 ? response.slice(0, 30) + '...' : response) : 
                        '[Hình ảnh]';
                    message += `${start + index + 1}. ${keyword}: ${displayResponse}\n`;
                });

                if (totalPages > 1) {
                    message += `\nTrang ${page}/${totalPages}. Xem trang khác: .shortcut list <số trang>`;
                }

                return api.sendMessage(message, threadID, messageID);
            }
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("⚠️ Vui lòng reply một ảnh để tạo shortcut!", threadID, messageID);
        }

        const attachments = messageReply.attachments.filter(att => att.type === 'photo');
        if (attachments.length === 0) {
            return api.sendMessage("⚠️ Vui lòng reply một ảnh!", threadID, messageID);
        }

        if (!shortcuts[threadID]) {
            shortcuts[threadID] = {};
        }

        const imageUrl = attachments[0].url;
        const shortcutData = {
            response: imageUrl,
            type: 'image',
            creator: event.senderID,
            createdAt: Date.now()
        };

        let keyword = event.body?.toLowerCase().trim() || `img${Math.floor(Math.random() * 1000)}`;

        shortcuts[threadID][keyword] = shortcutData;
        saveShortcuts();

        return api.sendMessage(
            `✅ Đã tạo shortcut mới:\n` +
            `- Từ khóa: ${keyword}\n` +
            `- Loại: Hình ảnh\n` +
            `- Sử dụng: Gõ "${keyword}" để bot gửi lại ảnh này`,
            threadID,
            messageID
        );
    }
};
