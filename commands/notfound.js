const fs = require("fs");
const path = require("path");

module.exports = {
    name: "notfound",
    hide: true,
    info: "Xử lý khi không tìm thấy lệnh",
    
    findSimilarCommands: function(cmdName, allCommands) {
        const calculateLevenshteinDistance = (a, b) => {
            const tmp = [];
            for (let i = 0; i <= a.length; i++) {
                tmp[i] = [i];
            }
            for (let j = 0; j <= b.length; j++) {
                tmp[0][j] = j;
            }
            for (let i = 1; i <= a.length; i++) {
                for (let j = 1; j <= b.length; j++) {
                    tmp[i][j] = Math.min(
                        tmp[i - 1][j] + 1,
                        tmp[i][j - 1] + 1,
                        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                    );
                }
            }
            return tmp[a.length][b.length];
        };

        return allCommands
            .map(cmd => ({ cmd, distance: calculateLevenshteinDistance(cmdName, cmd) }))
            .filter(({ distance }) => distance <= 3)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(({ cmd }) => cmd);
    },

    handleNotFound: async function({ api, event, commandName, prefix, allCommands }) {
        if (!commandName) {
            let emptyMessage = "╭── [ 𝗟𝗘̣̂𝗡𝗛 𝗧𝗥𝗢̂́𝗡𝗚 ] ────⌈ ❌ ⌋\n";
            emptyMessage += "│ ➜ Prefix của bot: " + prefix + "\n";
            emptyMessage += "│ ➜ Vui lòng nhập lệnh cần dùng\n";
            emptyMessage += "╰─────────────────⌈ 💡 ⌋\n\n";
            emptyMessage += "『✨』➜ Ví dụ: " + prefix + "help\n";
            emptyMessage += "『💌』➜ Để xem danh sách lệnh";
            
            return api.sendMessage(emptyMessage, event.threadID, (err, info) => {
                if (!err) setTimeout(() => api.unsendMessage(info.messageID), 20000);
            });
        }

        const similarCommands = this.findSimilarCommands(commandName, allCommands);
        
        let notFoundMessage = "╭── [ 𝗦𝗔𝗜 𝗟𝗘̣̂𝗡𝗛 ] ────⌈ ❌ ⌋\n";
        notFoundMessage += `│ ➜ Lệnh: ${prefix}${commandName}\n`;
        
        if (similarCommands.length > 0) {
            notFoundMessage += `│ ➜ Có thể bạn muốn dùng:\n`;
            similarCommands.forEach((cmd, index) => {
                notFoundMessage += `│ ${index + 1}. ${prefix}${cmd}\n`;
            });
        }
        
        notFoundMessage += "╰─────────────────⌈ 💡 ⌋\n\n";
        notFoundMessage += `『✨』➜ Gõ ${prefix}help để xem chi tiết`;

        return api.sendMessage(notFoundMessage, event.threadID, (err, info) => {
            if (!err) setTimeout(() => api.unsendMessage(info.messageID), 20000);
        });
    }
};
