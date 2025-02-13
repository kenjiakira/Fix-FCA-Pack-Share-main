const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "bctc",
    dev: "HNT",
    info: "Chơi Bầu Cua Tôm Cá",
    onPrefix: true,
    usages: "bctc [bầu/cua/tôm/cá/mèo/nai] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},

    CHOICES: ['bầu', 'cua', 'tôm', 'cá', 'mèo', 'nai'],
    EMOJIS: {
        'bầu': '🍐',
        'cua': '🦀',
        'tôm': '🦐',
        'cá': '🐟',
        'mèo': '🐱',
        'nai': '🦌'
    },
    
    generateResults(senderID, bets, isAllIn = false) {
        const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
        let winChance = gameLogic.calculateWinChance(senderID, {
            betAmount: totalBet,
            gameType: 'baucua',
            isAllIn: isAllIn 
        });

        if (isAllIn) {
            winChance *= 0.5; 
        }
        
        if (totalBet > 100000000) winChance *= 0.2; 
        if (totalBet > 50000000) winChance *= 0.4; 

        let results = [];
        const allChoices = [...this.CHOICES];
        const playerChoices = Object.keys(bets);
        const shouldWin = Math.random() < winChance;

        if (shouldWin) {
            const winCount = Math.random() < 0.7 ? 1 : 2;
            const selectedWinChoices = [];
            
            for (let i = 0; i < winCount; i++) {
                if (playerChoices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * playerChoices.length);
                    selectedWinChoices.push(playerChoices[randomIndex]);
                    playerChoices.splice(randomIndex, 1);
                }
            }
            
            results.push(...selectedWinChoices);
            
            while (results.length < 3) {
                const remainingChoices = allChoices.filter(c => !results.includes(c));
                const randomChoice = remainingChoices[Math.floor(Math.random() * remainingChoices.length)];
                results.push(randomChoice);
            }
        } else {
            const losingChoices = allChoices.filter(c => !playerChoices.includes(c));
            
            for (let i = 0; i < 3; i++) {
                if (losingChoices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * losingChoices.length);
                    results.push(losingChoices.splice(randomIndex, 1)[0]);
                } else {
                    const randomIndex = Math.floor(Math.random() * allChoices.length);
                    results.push(allChoices[randomIndex]);
                }
            }
        }

        return results;
    },

    calculateWinnings(bets, results) {
        let totalWin = 0;
        let multiplier = 1.95;

        const resultCounts = results.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        Object.entries(bets).forEach(([choice, amount]) => {
            if (resultCounts[choice]) {
                if (amount > 50000000) multiplier = 1.8;
                if (amount > 100000000) multiplier = 1.7;
                
                totalWin += amount * resultCounts[choice] * multiplier;
            }
        });

        return Math.floor(totalWin);
    },

    async onLaunch({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const balance = getBalance(senderID);

        if (target.length < 2) {
            return api.sendMessage(
                "BẦU CUA TÔM CÁ\n━━━━━━━━━━━━━━━━━━\n" +
                `Cách chơi: .bctc [${Object.entries(this.EMOJIS).map(([k,v]) => `${k}${v}`).join('/')}] [số tiền/allin]\n` +
                "Có thể cược nhiều con, ví dụ:\n" +
                ".bctc bầu 50000 cua 50000 tôm 50000\n" +
                ".bctc bầu allin",
                threadID, messageID
            );
        }

        const bets = {};
        let totalBet = 0;
        let isAllIn = false;
        
        for (let i = 0; i < target.length; i += 2) {
            const choice = target[i].toLowerCase();
            let amount;

            if (target[i + 1].toLowerCase() === 'allin') {
                isAllIn = true;
                amount = balance;
            } else {
                amount = parseInt(target[i + 1]);
            }

            if (!this.CHOICES.includes(choice)) {
                return api.sendMessage(`Lựa chọn '${choice}' không hợp lệ.`, threadID, messageID);
            }

            if (isNaN(amount) || amount < 10000) {
                return api.sendMessage("Số tiền cược tối thiểu là 10,000 Xu.", threadID, messageID);
            }

            if (isAllIn && i > 0) {
                return api.sendMessage("Không thể kết hợp allin với cược khác.", threadID, messageID);
            }

            bets[choice] = (bets[choice] || 0) + amount;
            totalBet += amount;
        }

        if (totalBet > balance) {
            return api.sendMessage("Số dư không đủ.", threadID, messageID);
        }

        const currentTime = Date.now();
        if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 20000) {
            return api.sendMessage(
                `Vui lòng đợi ${Math.ceil((20000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`,
                threadID, messageID
            );
        }
        this.lastPlayed[senderID] = currentTime;

        updateBalance(senderID, -totalBet);

        await api.sendMessage("🎲 Đang lắc bầu cua...", threadID, messageID);

        setTimeout(async () => {
            try {
                const results = this.generateResults(senderID, bets, isAllIn);
                const winAmount = this.calculateWinnings(bets, results);
                
                const feeRate = gameLogic.calculateFeeRate(winAmount);
                const fee = Math.ceil(winAmount * feeRate);
                const finalReward = winAmount - fee;
                


                gameLogic.updatePlayerStats(senderID, {
                    won: finalReward > totalBet,
                    betAmount: totalBet,
                    winAmount: finalReward,
                    gameType: 'baucua'
                });

                let message = `🎲 Kết quả: ${results.map(r => this.EMOJIS[r]).join(' ')}\n\n`;
                message += `💰 Đặt cược: ${formatNumber(totalBet)} Xu\n`;
                
                if (finalReward > 0) {
                    message += `🎉 Thắng: ${formatNumber(finalReward)} Xu\n`;
                    message += `📌 Phí: ${formatNumber(fee)} Xu (${(fee/winAmount*100).toFixed(1)}%)\n`;
                } else {
                    message += `💔 Thua: ${formatNumber(totalBet)} Xu\n`;
                }
                
                message += `\n💰 Số dư: ${formatNumber(getBalance(senderID))} Xu`;

                updateQuestProgress(senderID, "play_games");
                if (finalReward > totalBet) {
                    updateQuestProgress(senderID, "win_games");
                    updateQuestProgress(senderID, "win_bctc");
                }

                await api.sendMessage(message, threadID, messageID);

            } catch (error) {
                console.error('Game processing error:', error);
                updateBalance(senderID, totalBet);
                await api.sendMessage("Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
            }
        }, 5000);
    }
};
