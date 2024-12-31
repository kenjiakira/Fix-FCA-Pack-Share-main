const { randomInt } = require("crypto");
const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "cl",
    dev: "HNT",
    info: "Chơi Chẵn Lẻ.",
    onPrefix: true,
    usages: "cl",
    usedby: 0,
    cooldowns: 0,

    lastPlayed: {},
    winStreak: {}, 

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        const currentTime = Date.now();

        if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
            const waitTime = Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000);
            return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
        }

        const balance = getBalance(senderID);

        if (target.length < 2) {
            return api.sendMessage(
                "CHẴN LẺ \n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn cách chơi:\n" +
                "Gõ .cl <chẵn/lẻ> <số tiền> hoặc\n.cl <chẵn/lẻ> allin\n\nallin là cược toàn bộ số dư.",
                threadID, messageID
            );
        }

        const choice = target[0].toLowerCase();
        if (!["chẵn", "lẻ"].includes(choice)) {
            return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng chọn 'chẵn' hoặc 'lẻ'.", threadID, messageID);
        }

        let betAmount;
        if (target[1].toLowerCase() === "allin") {
            if (balance === 0) {
                return api.sendMessage("Bạn không có đủ số dư để allin.", threadID, messageID);
            }
            betAmount = balance;
        } else {
            betAmount = parseInt(target[1], 10);
            if (isNaN(betAmount) || betAmount <= 0) {
                return api.sendMessage("Số tiền cược phải là một số dương.", threadID, messageID);
            }
            if (betAmount < 10000) {
                return api.sendMessage("Số tiền cược tối thiểu là 10,000 Xu!", threadID, messageID);
            }
        }

        if (betAmount > balance) {
            return api.sendMessage("Bạn không đủ số dư để đặt cược số tiền này!", threadID, messageID);
        }

        this.lastPlayed[senderID] = currentTime;

        updateBalance(senderID, -betAmount);

        let message = `Đang lắc... Đợi ${5} giây...`;

        const sentMessage = await api.sendMessage(message, threadID, messageID);

        setTimeout(async () => {
            const ICONS = {
                WHITE: "⚪",
                RED: "🔴"
            };

            const combinations = {
                "chẵn": [
                    [ICONS.WHITE, ICONS.WHITE, ICONS.RED, ICONS.RED],
                    [ICONS.WHITE, ICONS.WHITE, ICONS.WHITE, ICONS.WHITE]
                ],
                "lẻ": [
                    [ICONS.WHITE, ICONS.RED, ICONS.RED, ICONS.RED],
                    [ICONS.WHITE, ICONS.WHITE, ICONS.WHITE, ICONS.RED],
                    [ICONS.RED, ICONS.RED, ICONS.RED, ICONS.RED]
                ]
            };

            if (!this.winStreak[senderID]) this.winStreak[senderID] = 0;

            let weightedCombinations = [];
            if (this.winStreak[senderID] >= 3) {
                weightedCombinations = [
                    ...Array(5).fill(combinations["chẵn"][0]),
                    ...Array(5).fill(combinations["lẻ"][0]),
                    ...Array(5).fill(combinations["lẻ"][1]),
                    combinations["chẵn"][1], 
                    combinations["lẻ"][2]    
                ];
            } else {
                weightedCombinations = [
                    combinations["chẵn"][0],
                    combinations["lẻ"][0],
                    combinations["lẻ"][1],
                    ...Array(1).fill(combinations["chẵn"][1]),
                    ...Array(1).fill(combinations["lẻ"][2])
                ];
            }

            const result = weightedCombinations[randomInt(0, weightedCombinations.length)];

            const resultType = combinations["chẵn"].some(comb => JSON.stringify(comb) === JSON.stringify(result)) ? "chẵn" : "lẻ";
            const resultMessage = `Kết quả: ${result.join(" ")} (${resultType.toUpperCase()})\n`;

            let multiplier = 0;
            let resultStatus = "thua";

            if (resultType === choice) {
              
                this.winStreak[senderID]++;
                
                if (JSON.stringify(result) === JSON.stringify(combinations["chẵn"][1]) && resultType === "chẵn") {
                    multiplier = 4; 
                } else if (JSON.stringify(result) === JSON.stringify(combinations["lẻ"][2]) && resultType === "lẻ") {
                    multiplier = 4; 
                } else {
                    multiplier = 2; 
                }
                resultStatus = "thắng";
                const winnings = betAmount * multiplier;
                updateBalance(senderID, winnings);
                updateQuestProgress(senderID, "play_games");
                updateQuestProgress(senderID, "win_games");

                api.unsendMessage(sentMessage.messageID); 
                return api.sendMessage(
                    resultMessage +
                    `🎉 Chúc mừng! Bạn ${resultStatus} và nhận được ${formatNumber(winnings)} Xu.\n` +
                    `💰 Số dư hiện tại của bạn: ${formatNumber(getBalance(senderID))} Xu.`,
                    threadID, messageID
                );
            } else {
                this.winStreak[senderID] = 0;
                updateQuestProgress(senderID, "play_games");
            }

            api.unsendMessage(sentMessage.messageID); 
            return api.sendMessage(
                resultMessage +
                `😢 Bạn đã ${resultStatus} và mất ${formatNumber(betAmount)} Xu.\n` +
                `💰 Số dư hiện tại của bạn: ${formatNumber(getBalance(senderID))} Xu.`,
                threadID, messageID
            );

        }, 5000);
    }
};
