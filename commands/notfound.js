module.exports = {
    name: "notfound",
    hide: true,
    info: "Xử lý khi không tìm thấy lệnh",
    
    findSimilarCommands(cmdName, allCommands) {
        const levenshtein = (a, b) => {
            const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
            for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
            for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= a.length; i++) {
                for (let j = 1; j <= b.length; j++) {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                    );
                }
            }
            return matrix[a.length][b.length];
        };

        return allCommands
            .map(cmd => ({ cmd, distance: levenshtein(cmdName, cmd) }))
            .filter(({ distance }) => distance <= 3)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(({ cmd }) => cmd);
    },

    onLaunch({ event, api, prefix, commandName }) {
        const allCommands = Object.keys(global.cc.module.commands)
            .filter(cmd => !global.cc.module.commands[cmd].hide);
            
        return this.handleNotFound({ api, event, commandName, prefix, allCommands });
    },

    handleNotFound({ api, event, commandName, prefix, allCommands }) {
        const autoDelete = (err, info) => {
            if (!err) setTimeout(() => api.unsendMessage(info.messageID), 30000);
        };

        if (!commandName) {
            const message = [
                "❓ BẠN MUỐN DÙNG LỆNH GÌ?",
                "━━━━━━━━",
                "",
                `📌 Gõ ${prefix}help để xem danh sách lệnh`,
                `💡 Ví dụ: ${prefix}help, ${prefix}coin`
            ].join('\n');
            
            return api.sendMessage(message, event.threadID, autoDelete);
        }

        const similarCommands = this.findSimilarCommands(commandName, allCommands);
        const messages = [
            "❌ LỆNH KHÔNG TỒN TẠI",
            "━━━━━━━━",
            "",
            `🔍 Bạn đang tìm: ${prefix}${commandName}`
        ];

        if (similarCommands.length > 0) {
            messages.push("\n💡 CÓ THỂ BẠN MUỐN DÙNG:");
            similarCommands.forEach((cmd, index) => {
                const cmdInfo = global.cc.module.commands[cmd]?.info;
                messages.push(`${index + 1}. ${prefix}${cmd}${cmdInfo ? ` - ${cmdInfo}` : ''}`);
            });
        }
        
        messages.push("\n📌 HƯỚNG DẪN:");
        messages.push(`• ${prefix}help - Xem danh sách lệnh`);
        messages.push(`• ${prefix}help <tên lệnh> - Xem chi tiết`);

        return api.sendMessage(messages.join('\n'), event.threadID, autoDelete);
    }
};

