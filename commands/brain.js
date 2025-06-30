const chess = require('./chess');
const altp = require('./altp');
const puzzle = require('./puzzle');
const quiz = require('./quiz');

module.exports = {
    name: "brain",
    dev: "HNT",
    category: "Games",
    info: "Tổng hợp các game trí tuệ",
    usages: "brain [chess/altp/puzzle/quiz]",
    onPrefix: true,
    cooldowns: 10,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const gameType = target[0]?.toLowerCase() || '';

        if (gameType) {
            switch (gameType) {
                case "chess":
                    return chess.onLaunch({ api, event, target: target.slice(1) });
                case "altp":
                    return altp.onLaunch({ api, event, target: target.slice(1) });
                case "quiz":
                    return quiz.onLaunch({ api, event });
                case "puzzle":
                    return puzzle.onLaunch({ api, event });
                default:
                    return this.showMenu(api, event);
            }
        }

        return this.showMenu(api, event);
    },

    showMenu: async function(api, event) {
        const { threadID } = event;
        
        const menu = 
            "🧠 BRAIN GAMES 🧠\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "1. ♟️ Chess (.brain chess @tag)\n" + 
            "   Chơi cờ vua với bạn bè\n\n" +
            "2. 💸 ALTP (.brain altp)\n" + 
            "   Ai là triệu phú, trả lời câu hỏi để nhận thưởng\n\n" +
            "3. 🧩 Puzzle (.brain puzzle)\n" + 
            "   Giải câu đố logic/toán học\n\n" +
            "4. 📝 Quiz (.brain quiz)\n" + 
            "   Trả lời câu hỏi trắc nghiệm\n\n" + 
            "Nhập lệnh tương ứng để chơi game!";
        
        api.sendMessage(menu, threadID);
    },

    onReply: async function({ api, event }) {
        const { name } = global.client.handleReply;
        
        if (name === "altp") {
            return altp.onReply({ api, event });
        } else if (name === "chess") {
            return chess.onReply({ api, event });
        } else if (name === "puzzle") {
            return puzzle.onReply({ api, event });
        } else if (name === "quiz") {
            return quiz.onReply({ api, event });
        }
    }
};
