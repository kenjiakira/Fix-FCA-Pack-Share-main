const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "cltx",
    dev: "HNT",
    info: "Chơi Chẵn Lẻ Tài Xỉu với nhiều cách đặt cược.",
    onPrefix: true,
    usages: "cltx",
    cooldowns: 0,

    lastPlayed: {},
    winStreak: {},
    streakBonus: {},
    statistics: {},
    comboStreak: {},
    specialResults: {},

    calculateMultiplier(senderID, baseMultiplier) {
        const streak = this.streakBonus[senderID] || 0;
        let bonus = 1;
        if (streak >= 5) bonus = 1.5;
        if (streak >= 10) bonus = 2;
        return baseMultiplier * bonus;
    },

    calculateReward(senderID, betAmount, gameType, result) {
        let multiplier = 1;
        const combo = this.comboStreak[senderID] || 0;
        
        // Tăng hệ số thưởng theo combo
        if (combo > 3) multiplier *= 1.5;
        if (combo > 5) multiplier *= 2;
        
        // Thưởng đặc biệt cho kết hợp hiếm
        if (gameType === 'special') multiplier *= 3;
        
        return Math.floor(betAmount * multiplier);
    },

    updateStats(senderID, gameType, isWin, amount) {
        if (!this.statistics[senderID]) {
            this.statistics[senderID] = {
                wins: 0,
                losses: 0,
                totalWinnings: 0,
                totalLosses: 0,
                highestWin: 0
            };
        }
        const stats = this.statistics[senderID];
        if (isWin) {
            stats.wins++;
            stats.totalWinnings += amount;
            if (amount > stats.highestWin) stats.highestWin = amount;
        } else {
            stats.losses++;
            stats.totalLosses += amount;
        }
    },

    getChanLeResult() {
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

        // Random selection of result type
        const resultType = Math.random() < 0.5 ? "chẵn" : "lẻ";
        const possibleResults = combinations[resultType];
        const result = possibleResults[randomInt(0, possibleResults.length)];

        return {
            type: resultType,
            icons: result
        };
    },

    handleKepBet: async function(api, event, target, balance) {
        const { threadID, messageID, senderID } = event;
        const [_, choice1, choice2, betAmount] = target;

        if (!["chẵn", "lẻ"].includes(choice1) || !["tài", "xỉu"].includes(choice2)) {
            return api.sendMessage("Cược kép không hợp lệ! Cần chọn chẵn/lẻ và tài/xỉu.", threadID, messageID);
        }

        const amount = betAmount === "allin" ? balance : parseInt(betAmount);
        if (amount < 20000) return api.sendMessage("Cược kép tối thiểu 20,000 Xu!", threadID);
        
        updateBalance(senderID, -amount);
        
        // Xử lý kết quả cược kép
        const dice = Array(3).fill().map(() => randomInt(1, 7));
        const total = dice.reduce((a, b) => a + b);
        const txResult = total >= 11 ? "tài" : "xỉu";
        
        const clResultObj = this.getChanLeResult();
        const clResult = clResultObj.type;
        
        const isWinCL = clResult === choice1;
        const isWinTX = txResult === choice2;
        
        let winnings = 0;
        let message = `🎲 Kết quả:\n`;
        message += `• Xúc xắc: ${dice.join(" + ")} = ${total} (${txResult.toUpperCase()})\n`;
        message += `• Chẵn/Lẻ: ${clResultObj.icons.join(" ")} (${clResult.toUpperCase()})\n\n`;

        if (isWinCL && isWinTX) {
            winnings = amount * 5; // Thắng cả 2 được x5
            this.comboStreak[senderID] = (this.comboStreak[senderID] || 0) + 1;
            message += `🎉 THẮNG LỚN! Cả 2 lựa chọn đều đúng!\n`;
        } else if (isWinCL || isWinTX) {
            winnings = amount * 1.5; // Thắng 1 trong 2 được x1.5
            this.comboStreak[senderID] = (this.comboStreak[senderID] || 0) + 1;
            message += `🎉 Thắng một phần! Đoán đúng ${isWinCL ? 'Chẵn/Lẻ' : 'Tài/Xỉu'}!\n`;
        } else {
            this.comboStreak[senderID] = 0;
            message += `💔 Thua! Không đoán đúng lựa chọn nào.\n`;
        }

        if (winnings > 0) {
            const multiplier = this.calculateReward(senderID, winnings, 'kep', true);
            winnings = Math.floor(multiplier);
            updateBalance(senderID, winnings);
            this.updateStats(senderID, 'kep', true, winnings);
            message += `💰 Tiền thưởng: ${formatNumber(winnings)} Xu (x${multiplier/amount})\n`;
        }

        return {message, winnings};
    },

    handleSpecialBet: async function(api, event, target, balance) {
        const { threadID, messageID, senderID } = event;
        const betAmount = target[1] === "allin" ? balance : parseInt(target[1]);
        
        if (betAmount < 50000) return api.sendMessage("Cược đặc biệt tối thiểu 50,000 Xu!", threadID);
        
        updateBalance(senderID, -betAmount);
        
        const dice = Array(3).fill().map(() => randomInt(1, 7));
        const total = dice.reduce((a, b) => a + b);
        
        let message = `🎲 Kết quả đặc biệt:\n`;
        message += `${dice.join(" + ")} = ${total}\n\n`;
        
        let winnings = 0;
        
        if (total === 3 || total === 18) {
            winnings = betAmount * 10;
            const multiplier = this.calculateReward(senderID, winnings, 'special', true);
            winnings = Math.floor(multiplier);
            this.specialResults[senderID] = (this.specialResults[senderID] || 0) + 1;
            
            message += `🌟 THẮNG ĐẶC BIỆT! Tổng ${total} điểm!\n`;
            message += `💰 Tiền thưởng: ${formatNumber(winnings)} Xu (x${multiplier/betAmount})\n`;
            
            if (this.specialResults[senderID] >= 3) {
                const bonusJackpot = loadQuy();
                message += `🎉 MEGA JACKPOT! Đạt ${this.specialResults[senderID]} lần đặc biệt!\n`;
                message += `💎 Thưởng thêm: ${formatNumber(bonusJackpot)} Xu\n`;
                winnings += bonusJackpot;
                saveQuy(0);
            }
            
            updateBalance(senderID, winnings);
            this.updateStats(senderID, 'special', true, winnings);
        } else {
            this.specialResults[senderID] = 0;
            message += `💔 Tiếc quá! Cần tổng 3 hoặc 18 điểm để thắng.\n`;
            this.updateStats(senderID, 'special', false, betAmount);
        }
        
        return {message, winnings};
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;

            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                const waitTime = Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000);
                return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
            }

            const balance = getBalance(senderID);

            if (target.length < 2) {
                return api.sendMessage(
                    "🎲 CHẴN LẺ TÀI XỈU 2.0 🎲\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "Cách chơi mới:\n" +
                    "1. Cược đơn:\n" +
                    "• .cltx <chẵn/lẻ/tài/xỉu> <số tiền>\n\n" +
                    "2. Cược kép (thưởng x3):\n" +
                    "• .cltx kep <chẵn/lẻ> <tài/xỉu> <số tiền>\n\n" +
                    "3. Cược đặc biệt:\n" +
                    "• .cltx special <số tiền>\n" +
                    "(Thắng khi ra kết quả 3 hoặc 18)\n\n" +
                    "💎 Thưởng combo:\n" +
                    "• Thắng 3 ván: x1.5\n" +
                    "• Thắng 5 ván: x2\n" +
                    "• Kết quả đặc biệt: x3\n",
                    threadID, messageID
                );
            }

            const gameMode = target[0].toLowerCase();
            
            if (gameMode === "kep") {
                const result = await this.handleKepBet(api, event, target, balance);
                return api.sendMessage(result.message, threadID, messageID);
            } 
            else if (gameMode === "special") {
                const result = await this.handleSpecialBet(api, event, target, balance);
                return api.sendMessage(result.message, threadID, messageID);
            } else {
                const choice = target[0].toLowerCase();
                if (!["chẵn", "lẻ", "tài", "xỉu"].includes(choice)) {
                    return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng chọn 'chẵn', 'lẻ', 'tài' hoặc 'xỉu'.", threadID, messageID);
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

                const isTaiXiu = choice === "tài" || choice === "xỉu";
                let message = isTaiXiu ? 
                    `🎲 Lắc xúc xắc... Đợi ${5} giây...` : 
                    `Đang lắc... Đợi ${5} giây...`;

                await api.sendMessage(message, threadID, messageID);

                setTimeout(async () => {
                    try {
                        if (isTaiXiu) {
                            // Tài Xỉu logic
                            const dice1 = randomInt(1, 7);
                            const dice2 = randomInt(1, 7);
                            const dice3 = randomInt(1, 7);
                            const total = dice1 + dice2 + dice3;
                            const result = total >= 11 ? "tài" : "xỉu";
                            
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

                                if (choice === result) {
                                    this.streakBonus[senderID] = (this.streakBonus[senderID] || 0) + 1;
                                    const baseWinnings = betAmount * 2;
                                    const multiplier = this.calculateMultiplier(senderID, 1);
                                    const winnings = Math.floor(baseWinnings * multiplier);
                                    const fee = winnings * 0.05;
                                    const finalWinnings = Math.floor(winnings - fee);
                                    
                                    updateBalance(senderID, finalWinnings);
                                    this.updateStats(senderID, 'taixiu', true, finalWinnings);
                                    
                                    message = `🎲 ${result.toUpperCase()}: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                                             `🎉 Thắng: ${formatNumber(finalWinnings)} Xu (x${multiplier})\n` +
                                             `📈 Chuỗi thắng: ${this.streakBonus[senderID]} trận\n`;
                                } else {
                                    this.streakBonus[senderID] = 0;
                                    this.updateStats(senderID, 'taixiu', false, betAmount);
                                    message = `🎲 ${result.toUpperCase()}: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                                             `💔 Thua: ${formatNumber(betAmount)} Xu\n`;
                                }

                                if (total === 18 || total === 3) {
                                    const quy = loadQuy();
                                    if (quy > 0) {
                                        message += `\n🎉 JACKPOT! Tổng ${total} điểm!\nQuỹ thưởng: ${formatNumber(quy)} Xu\n`;
                                        updateBalance(senderID, quy);
                                        saveQuy(0);
                                    }
                                }

                                message += `\n💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu\n`;
                                message += `💰 Quỹ hiện tại: ${formatNumber(loadQuy())} Xu`;

                                const stats = this.statistics[senderID] || {wins: 0, losses: 0, totalWinnings: 0};
                                message += `\n📊 Thống kê:\n` +
                                          `Thắng: ${stats.wins} | Thua: ${stats.losses}\n` +
                                          `Lãi/Lỗ: ${formatNumber(stats.totalWinnings - stats.totalLosses)} Xu\n` +
                                          `💰 Số dư: ${formatNumber(getBalance(senderID))} Xu`;

                                await api.sendMessage({ body: message, attachment: combinedImage }, threadID, messageID);
                                fs.unlink(outputImagePath, (err) => {
                                    if (err) console.error('Error cleaning up temp file:', err);
                                });

                            } catch (imageError) {
                                console.error('Image processing error:', imageError);
                                await api.sendMessage(message, threadID, messageID);
                            }

                        } else {
                            // Chẵn Lẻ logic
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

                            const weightedCombinations = this.winStreak[senderID] >= 3 ? [
                                ...Array(5).fill(combinations["chẵn"][0]),
                                ...Array(5).fill(combinations["lẻ"][0]),
                                ...Array(5).fill(combinations["lẻ"][1]),
                                combinations["chẵn"][1],
                                combinations["lẻ"][2]
                            ] : [
                                combinations["chẵn"][0],
                                combinations["lẻ"][0],
                                combinations["lẻ"][1],
                                ...Array(1).fill(combinations["chẵn"][1]),
                                ...Array(1).fill(combinations["lẻ"][2])
                            ];

                            const result = weightedCombinations[randomInt(0, weightedCombinations.length)];
                            const resultType = combinations["chẵn"].some(comb => 
                                JSON.stringify(comb) === JSON.stringify(result)) ? "chẵn" : "lẻ";

                            message = `Kết quả: ${result.join(" ")} (${resultType.toUpperCase()})\n`;

                            if (resultType === choice) {
                                this.winStreak[senderID]++;
                                const multiplier = (JSON.stringify(result) === JSON.stringify(combinations["chẵn"][1]) && resultType === "chẵn") ||
                                                (JSON.stringify(result) === JSON.stringify(combinations["lẻ"][2]) && resultType === "lẻ") ? 4 : 2;
                                
                                const winnings = betAmount * multiplier;
                                updateBalance(senderID, winnings);
                                message += `🎉 Chúc mừng! Bạn thắng và nhận được ${formatNumber(winnings)} Xu.\n`;
                                updateQuestProgress(senderID, "win_games");
                            } else {
                                this.winStreak[senderID] = 0;
                                message += `😢 Bạn đã thua và mất ${formatNumber(betAmount)} Xu.\n`;
                            }

                            message += `\n💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu\n`;
                            message += `💰 Quỹ hiện tại: ${formatNumber(loadQuy())} Xu`;

                            await api.sendMessage(message, threadID, messageID);
                        }
                    } catch (error) {
                        console.error('Error during game execution:', error);
                        await api.sendMessage("Đã xảy ra lỗi trong quá trình chơi. Vui lòng thử lại sau.", threadID, messageID);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Error during game initialization:', error);
            await api.sendMessage("Đã xảy ra lỗi trong quá trình khởi tạo trò chơi. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};
