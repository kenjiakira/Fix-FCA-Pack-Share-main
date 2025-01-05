const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const { randomInt } = require("crypto");

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "coinflip",
    dev: "HNT",
    info: "Tung đồng xu.",
    onPrefix: true,
    usages: "coinflip",
    usedby: 0,
    cooldowns: 0,

    lastPlayed: {},
    winStreak: {},  

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;

            const currentTime = Date.now();
       
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 90000) {
                const waitTime = Math.ceil((90000 - (currentTime - this.lastPlayed[senderID])) / 1000);
                return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
            }

            const balance = getBalance(senderID);

            if (target.length < 2) {
                return api.sendMessage(
                    "COINFLIP - TUNG ĐỒNG XU\n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn cách chơi:\n" +
                    "Gõ .coinflip <up/ngửa> <số tiền> hoặc\n.coinflip <up/ngửa> allin\n\nallin là cược toàn bộ số dư.",
                    threadID, messageID
                );
            }

            const choice = target[0].toLowerCase();
            if (!["up", "ngửa"].includes(choice)) {
                return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng chọn 'up' hoặc 'ngửa'.", threadID, messageID);
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

            if (!this.winStreak[senderID]) this.winStreak[senderID] = 0;

            let message = `Đang tung đồng xu... Đợi ${4} giây...`;
            await api.sendMessage(message, threadID, messageID);

            setTimeout(async () => {
                const COIN_FACES = {
                    "up": "👆",
                    "ngửa": "⭕"
                };

                let winChance = 0.5; 
                if (this.winStreak[senderID] >= 2) {
                    winChance = 0.3; 
                }
                if (this.winStreak[senderID] >= 4) {
                    winChance = 0.2;
                }

                const result = Math.random() < winChance ? choice : (choice === "up" ? "ngửa" : "up");
                const resultMessage = `Kết quả: ${COIN_FACES[result]} (${result.toUpperCase()})\n`;

                if (result === choice) {
                    this.winStreak[senderID]++;
                    
                    let multiplier = 1.8;
                    
                    const specialRoll = randomInt(0, 100);
                    if (specialRoll < 5) { 
                        multiplier = 3.0;
                    } else if (specialRoll < 15) { 
                        multiplier = 2.2;
                    }

                    const winnings = Math.floor(betAmount * multiplier);
                    updateBalance(senderID, winnings);
                    updateQuestProgress(senderID, "play_games");
                    updateQuestProgress(senderID, "win_games");
                    updateQuestProgress(senderID, "play_coinflip");
                    updateQuestProgress(senderID, "win_coinflip");

                    const finalMessage = resultMessage +
                        `🎉 Chúc mừng! Bạn thắng với hệ số x${multiplier} và nhận được ${formatNumber(winnings)} Xu.\n` +
                        `🔥 Chuỗi thắng hiện tại: ${this.winStreak[senderID]}\n` +
                        `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu.`;

                    return api.sendMessage(finalMessage, threadID, messageID);
                } else {
                    this.winStreak[senderID] = 0;
                    updateQuestProgress(senderID, "play_games");
                    updateQuestProgress(senderID, "play_coinflip");

                    const finalMessage = resultMessage +
                        `😢 Bạn đã thua và mất ${formatNumber(betAmount)} Xu.\n` +
                        `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu.`;

                    return api.sendMessage(finalMessage, threadID, messageID);
                }
            }, 4000);

        } catch (error) {
            console.error('Main error:', error);
            return api.sendMessage("Có lỗi xảy ra. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};
