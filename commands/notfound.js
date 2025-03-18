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

    onLaunch: function({ event, actions, api, prefix, commandName }) {
        const allCommands = Object.keys(global.cc.module.commands)
            .filter(cmd => !global.cc.module.commands[cmd].hide);
            
        return this.handleNotFound({ 
            api, 
            event, 
            commandName, 
            prefix, 
            allCommands 
        });
    },

    handleNotFound: async function({ api, event, commandName, prefix, allCommands }) {
        if (!commandName) {
            const emptyMessage = [
                "❓ BẠN MUỐN DÙNG LỆNH GÌ?",
                "━━━━━━━━━━━━━━━━━━",
                "",
                "📌 HƯỚNG DẪN NHANH:",
                `• Gõ ${prefix} + tên lệnh để sử dụng`,
                `• Ví dụ: ${prefix}help, ${prefix}coin`,
                "",
                "💡 MẸO:",
                `• Gõ ${prefix}help để xem danh sách lệnh`,
                "• Đọc kỹ hướng dẫn trước khi dùng",
                "• Hỏi admin nếu cần giúp đỡ"
            ].join('\n');
            
            return api.sendMessage(emptyMessage, event.threadID, (err, info) => {
                if (!err) setTimeout(() => api.unsendMessage(info.messageID), 30000);
            });
        }

        const similarCommands = this.findSimilarCommands(commandName, allCommands);
        
        let notFoundMessage = [
            "❌ LỆNH KHÔNG TỒN TẠI",
            "━━━━━━━━━━━━━━━━━━",
            "",
            `🔍 Bạn đang tìm: ${prefix}${commandName}`,
        ].join('\n');
        
        if (similarCommands.length > 0) {
            notFoundMessage += "\n\n💡 CÓ THỂ BẠN MUỐN DÙNG:";
            similarCommands.forEach((cmd, index) => {
                notFoundMessage += `\n${index + 1}. ${prefix}${cmd}`;
          
                const cmdDescription = this.getCommandDescription(cmd);
                if (cmdDescription) {
                    notFoundMessage += `\n   ➣ ${cmdDescription}`;
                }
            });
        }
        
        notFoundMessage += "\n\n📌 HƯỚNG DẪN:";
        notFoundMessage += `\n• Gõ ${prefix}help để xem danh sách lệnh`;
        notFoundMessage += `\n• Gõ ${prefix}help <tên lệnh> để xem chi tiết`;
        notFoundMessage += "\n• Kiểm tra chính tả và thử lại";

        return api.sendMessage(notFoundMessage, event.threadID, (err, info) => {
            if (!err) setTimeout(() => api.unsendMessage(info.messageID), 30000);
        });
    },

    getCommandDescription(cmdName) {
        const descriptions = {
            "help": "Xem danh sách và hướng dẫn sử dụng lệnh",
            "coin": "Chơi game đào coin và kiếm tiền",
            "market": "Xem và giao dịch trên thị trường",
            "info": "Xem thông tin người dùng và nhóm",
            "daily": "Nhận quà hàng ngày",
            "work": "Làm việc kiếm tiền",
            "play": "Nghe nhạc từ YouTube",
            "tiktok": "Tải video từ TikTok",
            "weather": "Xem thông tin thời tiết",
            "translate": "Dịch văn bản qua ngôn ngữ khác",
    
        };
        return descriptions[cmdName];
    }
};
