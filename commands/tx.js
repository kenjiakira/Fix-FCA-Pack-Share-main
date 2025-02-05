const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress, readData } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "tx",
    dev: "HNT", 
    usedby: 0,
    info: "Chơi mini-game Tài Xỉu bằng số dư hiện có.",
    onPrefix: true, 
    usages: "tx",
    cooldowns: 0,

    lastPlayed: {},
    playerStats: {}, 

    calculateDynamicFee: function(winAmount) {
        if (winAmount > 500000) {
            return 0.10; 
        } else if (winAmount > 200000) {
            return 0.07; 
        }
        return 0.05; 
    },

    calculateWinChance: function(senderID, isAllIn = false, balance = 0) {
        if (!this.playerStats[senderID]) {
            this.playerStats[senderID] = {
                totalGames: 0,
                wins: 0,
                totalBet: 0,
                totalWin: 0,
                consecutiveLosses: 0,
                firstPlayTime: Date.now()
            };
        }

        const stats = this.playerStats[senderID];
        let baseWinChance = 0.48;

        if (stats.totalGames < 10) {
            baseWinChance = 0.55; 
        }

        if (balance < 10000 && isAllIn) {
            baseWinChance = 0.65;
        }

        if (stats.consecutiveLosses >= 3) {
            baseWinChance = Math.min(0.50 + (stats.consecutiveLosses * 0.01), 0.60);
        }

        if (stats.totalGames > 100) {
            const winRate = stats.wins / stats.totalGames;
            const profitRate = stats.totalWin / stats.totalBet;

            if (winRate > 0.5 && profitRate > 1.2) {
                
                baseWinChance *= 0.9;
            }

            if (winRate > 0.6 || profitRate > 1.5) {
                baseWinChance *= 0.85;
            }
        }

        const recentGames = this.getRecentGames(senderID, 5);
        if (recentGames.wins >= 3) {
            baseWinChance *= 0.9;
        }

        return Math.min(Math.max(baseWinChance, 0.35), 0.70);
    },

    getRecentGames: function(senderID, count) {
      
        if (!this.recentGames) this.recentGames = {};
        if (!this.recentGames[senderID]) this.recentGames[senderID] = [];
        
        return {
            wins: this.recentGames[senderID].filter(game => game.won).length,
            total: this.recentGames[senderID].length
        };
    },

    updatePlayerStats: function(senderID, won, betAmount, winAmount) {
        const stats = this.playerStats[senderID];
        
        if (!this.recentGames) this.recentGames = {};
        if (!this.recentGames[senderID]) this.recentGames[senderID] = [];
        
        this.recentGames[senderID].unshift({ won, betAmount, winAmount });
        if (this.recentGames[senderID].length > 10) {
            this.recentGames[senderID].pop();
        }

        if (won) {
            stats.consecutiveLosses = 0;
            stats.wins++;
        } else {
            stats.consecutiveLosses++;
        }

        stats.totalGames++;
        stats.totalBet += betAmount;
        if (won) stats.totalWin += winAmount;
    },

    generateDiceResults: function(senderID, playerChoice, betType, balance) {
        const winChance = this.calculateWinChance(
            senderID, 
            betType === 'allin',
            balance
        );
        
        const shouldWin = Math.random() < winChance;
        let dice1, dice2, dice3, total, result;
        
        do {
            dice1 = randomInt(1, 7);
            dice2 = randomInt(1, 7);
            dice3 = randomInt(1, 7);
            total = dice1 + dice2 + dice3;
            result = total >= 11 ? "tài" : "xỉu";
            
            if ((shouldWin && result === playerChoice) || 
                (!shouldWin && result !== playerChoice)) {
                break;
            }
        } while (true);

        return { dice1, dice2, dice3, total, result };
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;

            
            const balance = getBalance(senderID);

            if (target.length < 2) {
                return api.sendMessage("TÀI XỈU \n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn cách chơi:\ngõ .tx tài/xỉu <số tiền> hoặc\n.tx tài/xỉu allin \n\nallin là cược toàn bộ.", threadID, messageID);
            }

            const choice = target[0].toLowerCase();
        
            if (choice !== "tài" && choice !== "xỉu") {
                return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng chọn 'tài' hoặc 'xỉu'.", threadID, messageID);
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

            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                const waitTime = Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000);
                return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
            }

            this.lastPlayed[senderID] = currentTime;

            updateBalance(senderID, -betAmount);

            let message = `🎲 Lắc xúc xắc... Đợi ${5} giây...`;

            await api.sendMessage(message, threadID, messageID);

            setTimeout(async () => {
                try {
                    const { dice1, dice2, dice3, total, result } = this.generateDiceResults(
                        senderID, 
                        choice,
                        target[1]?.toLowerCase(),
                        balance
                    );

                    if (!this.playerStats[senderID]) {
                        this.playerStats[senderID] = {
                            totalGames: 0,
                            wins: 0,
                            totalBet: 0,
                            totalWin: 0
                        };
                    }

                    this.playerStats[senderID].totalGames++;
                    this.playerStats[senderID].totalBet += betAmount;

                    if (choice === result) {
                        this.playerStats[senderID].wins++;
                        this.playerStats[senderID].totalWin += betAmount * 2;
                    }

                    message = `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total} \nQK ra : ${result.toUpperCase()}\n`;

                    const getDiceImagePath = (diceNumber) => path.join(__dirname, 'cache', 'images', 'dice', `dice${diceNumber}.png`);

                    try {
                        const diceImages = await Promise.all([
                            loadImage(getDiceImagePath(dice1)),
                            loadImage(getDiceImagePath(dice2)), 
                            loadImage(getDiceImagePath(dice3))
                        ]);

                        const canvas = createCanvas(diceImages[0].width * 3, diceImages[0].height);
                        const ctx = canvas.getContext('2d');

                        diceImages.forEach((image, index) => {
                            ctx.drawImage(image, index * image.width, 0);
                        });

                        const outputImagePath = path.join(__dirname, 'cache', 'images', 'dice', 'combined.png');
                        const buffer = canvas.toBuffer('image/png');
                        fs.writeFileSync(outputImagePath, buffer);

                        const combinedImage = fs.createReadStream(outputImagePath);

                        let fee = 0;
                        let finalWinnings = 0;

                        if (total === 18 || total === 3) {
                            const quy = loadQuy();
                            console.log(`Debug: Jackpot triggered! Total: ${total}, Quỹ: ${quy}`);
                            
                            const isValidJackpot = (total === 18 && choice === "tài") || 
                                                  (total === 3 && choice === "xỉu");
                            
                            if (quy > 0) {
                                const allUsers = Object.keys(readData().balance);
                                const eligibleUsers = allUsers.filter(userId => getBalance(userId) > 0);
                                
                                if (isValidJackpot) {
                                  
                                    const winnerShare = Math.floor(quy * 0.5);
                                    updateBalance(senderID, winnerShare);
                                    
                                    message += `\n🎉 MEGA JACKPOT! Tổng ${total} điểm!\n`;
                                    message += `🏆 Bạn đã dự đoán đúng và nhận được ${formatNumber(winnerShare)} Xu (50% quỹ)!\n`;
                                    
                                    const remainingQuy = quy - winnerShare;
                                    if (eligibleUsers.length > 1) { 
                                        const shareAmount = Math.floor(remainingQuy / (eligibleUsers.length - 1));
                                        
                                        eligibleUsers.forEach(userId => {
                                            if (userId !== senderID && shareAmount > 0) {
                                                updateBalance(userId, shareAmount);
                                            }
                                        });
                                        
                                        message += `💸 ${formatNumber(remainingQuy)} Xu còn lại được chia đều cho ${eligibleUsers.length - 1} người chơi khác.\n`;
                                        message += `💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.\n`;
                                    }
                                } else {
                                    message += `\n🎲 Ra ${total} điểm nhưng bạn đặt ${choice}!\n`;
                                
                                    if (eligibleUsers.length > 0) {
                                        const shareAmount = Math.floor(quy / eligibleUsers.length);
                                        eligibleUsers.forEach(userId => {
                                            updateBalance(userId, shareAmount);
                                        });
                                        message += `💸 Quỹ ${formatNumber(quy)} Xu được chia đều cho ${eligibleUsers.length} người chơi.\n`;
                                        message += `💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.\n`;
                                    }
                                }
                                
                                saveQuy(0);
                                console.log('Debug: Quỹ has been reset to 0 after distribution');
                            } else {
                                console.log('Debug: Quỹ is empty or invalid:', quy);
                                message += `\n🎉 JACKPOT! Tổng ${total} điểm! Nhưng quỹ hiện đang trống.\n`;
                            }
                        }

                        if (choice === result) {
                            const winnings = betAmount * 2;
                            const feeRate = this.calculateDynamicFee(winnings);
                            fee = winnings * feeRate;
                            finalWinnings = Math.floor(winnings - fee);
                            updateBalance(senderID, finalWinnings);
                            message += `🎉 Chúc mừng! Bạn thắng và nhận được ${formatNumber(finalWinnings)} Xu.\nPhí: ${feeRate * 100}%\n`;

                            this.updatePlayerStats(senderID, true, betAmount, finalWinnings);

                            let quy = loadQuy();
                            quy += Math.floor(fee);
                            saveQuy(quy);

                            updateQuestProgress(senderID, "play_games");
                            updateQuestProgress(senderID, "win_games");
                        } else {
                            this.updatePlayerStats(senderID, false, betAmount, 0);
                            message += `😢 Bạn đã thua và mất ${formatNumber(betAmount)} Xu.\n`;
                            updateQuestProgress(senderID, "play_games");
                        }

                        const newBalance = getBalance(senderID);
                        message += `\n💰 Số dư hiện tại của bạn: ${formatNumber(newBalance)} Xu.\n`;
                        message += `💰 Quỹ hiện tại: ${formatNumber(loadQuy())} Xu.`;

                        await api.sendMessage({
                            body: message,
                            attachment: combinedImage
                        }, threadID, messageID);

                        fs.unlink(outputImagePath, (err) => {
                            if (err) console.error('Error cleaning up temp file:', err);
                        });

                    } catch (imageError) {
                        console.error('Image processing error:', imageError);
                  
                        await api.sendMessage(message, threadID, messageID);
                    }
                } catch (timeoutError) {
                    console.error('Error in timeout callback:', timeoutError);
                    await api.sendMessage("Có lỗi xảy ra khi xử lý trò chơi. Vui lòng thử lại sau.", threadID, messageID);
               
                    updateBalance(senderID, betAmount);
                }
            }, 5000);

        } catch (error) {
            console.error('Main game error:', error);
            await api.sendMessage("Có lỗi xảy ra. Vui lòng thử lại sau.", event.threadID, event.messageID);
            return;
        }
    }
};
