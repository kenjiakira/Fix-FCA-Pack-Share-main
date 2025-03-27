const fs = require("fs");
const path = require("path");
const help = require("./help.js");

module.exports = {
    name: "game",
    dev: "HNT",
    usedby: 0,
    onPrefix : true,
    category: "Games",
    info: "Hiển thị danh sách và hướng dẫn chơi game",
    usages: "[tên game]",
    cooldowns: 5,

    onLoad: function() {
        if (!global.client) global.client = {};
        if (!global.client.onReply) global.client.onReply = [];
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        
        try {
            const cmdsPath = __dirname;
            const commandFiles = fs.readdirSync(cmdsPath)
                .filter(file => file.endsWith('.js'))
                .map(file => {
                    try {
                        return require(path.join(cmdsPath, file));
                    } catch (err) {
                        console.error(`Error loading command ${file}:`, err);
                        return null;
                    }
                })
                .filter(cmd => cmd && cmd.category === "Games");

            if (!target[0]) {
                let msg = "╭─────────────────╮\n";
                msg += "    🎮 GAME CENTER 🎮    \n";
                msg += "╰─────────────────╯\n\n";
                msg += "📱 DANH SÁCH GAME:\n\n";

                commandFiles.forEach((cmd, index) => {
                    const icon = help.getCommandIcon(cmd);
                    msg += `${index + 1}. ${icon} ${cmd.name}\n`;
                    msg += `➣ ${cmd.info || "Không có mô tả"}\n\n`;
                });

                msg += "📌 HƯỚNG DẪN:\n";
                msg += "• Reply số thứ tự để xem chi tiết game\n";
                msg += `• Hoặc dùng: game <tên game>\n\n`;
                msg += `📊 Tổng số game: ${commandFiles.length}`;

                const sent = await api.sendMessage(msg, threadID);

                if (sent) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: sent.messageID,
                        author: event.senderID,
                        data: commandFiles,
                        type: "games"
                    });
                }
                return;
            }

            const gameName = target[0].toLowerCase();
            const gameCmd = commandFiles.find(cmd => cmd.name.toLowerCase() === gameName);

            if (gameCmd) {
                const msg = help.getCommandInfo(gameCmd, global.config?.prefix || "!");
                return api.sendMessage(msg, threadID, messageID);
            }

            return api.sendMessage("⚠️ Game không tồn tại! Vui lòng dùng lệnh game để xem danh sách.", threadID);

        } catch (error) {
            console.error("Game command error:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    onReply: async function({ api, event, global }) {
        const { threadID, messageID, body, messageReply, senderID } = event;

        if (!messageReply) return;

        const input = parseInt(body);
        if (!input) return;

        const replyData = global.client.onReply.find(r => 
            r.messageID === messageReply.messageID && 
            r.name === this.name &&
            r.author === senderID
        );

        if (!replyData) return;

        if (replyData.type === "games") {
            const games = replyData.data;
            if (input > 0 && input <= games.length) {
                const game = games[input - 1];
                const msg = help.getCommandInfo(game, global.config?.prefix || "!");
                return api.sendMessage(msg, threadID, messageID);
            }
        }
    }
};
