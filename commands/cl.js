const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "cl",
    dev: "HNT",
    category: "Games",
    info: "Chơi Chẵn Lẻ.",
    onPrefix: true,
    usages: "cl",
    cooldowns: 0,
    lastPlayed: {},

    generateResult: function(senderID, playerChoice, betType, balance, betAmount) {
        return gameLogic.generateChanLeResult(senderID, playerChoice, {
            isAllIn: betType === 'allin',
            balance: balance,
            betAmount: betAmount
        });
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);

            if (target.length < 2) {
                return api.sendMessage("CHẴN LẺ \n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn: .cl chẵn/lẻ <số tiền> hoặc\n.cl chẵn/lẻ allin", threadID, messageID);
            }

            const choice = target[0].toLowerCase();
            if (!["chẵn", "lẻ"].includes(choice)) {
                return api.sendMessage("Vui lòng chọn 'chẵn' hoặc 'lẻ'.", threadID, messageID);
            }

            let betAmount = target[1].toLowerCase() === "allin" ? balance : parseInt(target[1]);
            if (!betAmount || betAmount < 10000 || betAmount > balance) {
                return api.sendMessage(`Số tiền cược không hợp lệ (tối thiểu 10,000 Xu${betAmount > balance ? ", số dư không đủ" : ""}).`, threadID, messageID);
            }

            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 60000) {
                const waitTime = Math.ceil((60000 - (currentTime - this.lastPlayed[senderID])) / 1000);
                return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa.`, threadID, messageID);
            }
            this.lastPlayed[senderID] = currentTime;

            updateBalance(senderID, -betAmount);
            await api.sendMessage("Đang lắc... Đợi 5 giây...", threadID, messageID);

            setTimeout(async () => {
                try {
                    const { pattern, result, isSpecial } = this.generateResult(
                        senderID, 
                        choice,
                        target[1].toLowerCase(),
                        balance,
                        betAmount
                    );

                    let message = `Kết quả: ${pattern.join(" ")} (${result.toUpperCase()})\n`;

                    if (choice === result) {
                        const multiplier = isSpecial ? 4 : 2;
                        const rewardInfo = gameLogic.calculateReward(betAmount, multiplier);
                        
                        updateBalance(senderID, rewardInfo.finalReward);
                        
                        message += `🎉 Thắng: ${formatNumber(rewardInfo.finalReward)} Xu\n`;
                        message += `💹 Hệ số: x${multiplier} ${isSpecial ? "(Đặc biệt)" : ""}\n`;
                        message += `💸 Phí: ${(rewardInfo.fee/rewardInfo.rawReward*100).toFixed(1)}%\n`;

                        gameLogic.updatePlayerStats(senderID, {
                            won: true,
                            betAmount,
                            winAmount: rewardInfo.finalReward,
                            gameType: 'chanle'
                        });
                        
                        updateQuestProgress(senderID, "win_games");
                    } else {
                        message += `💔 Thua: ${formatNumber(betAmount)} Xu\n`;
                        gameLogic.updatePlayerStats(senderID, {
                            won: false,
                            betAmount,
                            gameType: 'chanle'
                        });
                    }

                    message += `\n💰 Số dư: ${formatNumber(getBalance(senderID))} Xu`;
                    updateQuestProgress(senderID, "play_games");

                    await api.sendMessage(message, threadID, messageID);

                } catch (error) {
                    console.error('Game processing error:', error);
                    updateBalance(senderID, betAmount);
                    await api.sendMessage("Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                }
            }, 5000);

        } catch (error) {
            console.error('Main error:', error);
            await api.sendMessage("Có lỗi xảy ra.", threadID, messageID);
        }
    }
};
