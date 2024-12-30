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
            const emptyMessage = [
                `[!] Lệnh trống`,
                `➜ Prefix: ${prefix}`,
                `➜ Nhập lệnh cần dùng`,
                `Ví dụ: ${prefix}help để xem danh sách lệnh`
            ].join('\n');
            
            return api.sendMessage(emptyMessage, event.threadID, (err, info) => {
                if (!err) setTimeout(() => api.unsendMessage(info.messageID), 20000);
            });
        }

        const similarCommands = this.findSimilarCommands(commandName, allCommands);
        
        let notFoundMessage = `[!] Sai lệnh: ${prefix}${commandName}\n`;
        
        if (similarCommands.length > 0) {
            notFoundMessage += `Có phải bạn muốn dùng:\n`;
            similarCommands.forEach((cmd, index) => {
                notFoundMessage += `${index + 1}. ${prefix}${cmd}\n`;
            });
        }
        
        notFoundMessage += `\nGõ ${prefix}help để xem chi tiết`;

        return api.sendMessage(notFoundMessage, event.threadID, (err, info) => {
            if (!err) setTimeout(() => api.unsendMessage(info.messageID), 20000);
        });
    }
};
