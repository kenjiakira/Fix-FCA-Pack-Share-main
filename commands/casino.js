const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { 
    createTaiXiuCanvas,
    createChanLeCanvas,
    createCoinflipCanvas, 
    createBaucuaCanvas,
    bufferToReadStream 
} = require('../game/canvas/casinoCanvas');

const { 
    getBalance, 
    updateBalance, 
    loadQuy, 
    saveQuy, 
    updateQuestProgress, 
    readData 
} = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const { getUserName } = require('../utils/userUtils'); 

const TX_HISTORY_FILE = path.join(__dirname, '../database/json/tx_history.json');

const gameHistory = {
    tx: {
        results: {},
        sessions: new Map()
    }
};

function loadTxHistory() {
    try {
        if (!fs.existsSync(TX_HISTORY_FILE)) {
            const dir = path.dirname(TX_HISTORY_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(TX_HISTORY_FILE, JSON.stringify({ results: {} }));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(TX_HISTORY_FILE));
        return data.results || {};
    } catch (error) {
        console.error('Error loading TX history:', error);
        return {};
    }
}

function saveTxHistory() {
    try {
        fs.writeFileSync(TX_HISTORY_FILE, JSON.stringify({ results: gameHistory.tx.results }));
    } catch (error) {
        console.error('Error saving TX history:', error);
    }
}

function generateSessionId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `#HNT${random}`;
}

function updateTxHistory(threadID, result) {
    if (!gameHistory.tx.results[threadID]) {
        gameHistory.tx.results[threadID] = [];
    }
    const emoji = result === "tài" ? "⚫" : "⚪";
    gameHistory.tx.results[threadID].push(emoji);
    
    if (gameHistory.tx.results[threadID].length > 9) {
        gameHistory.tx.results[threadID].shift(); 
    }
    saveTxHistory();
}

function formatTxHistory(threadID) {
    if (!gameHistory.tx.results[threadID] || gameHistory.tx.results[threadID].length === 0) {
        return "Chưa có lịch sử";
    }
    
    return gameHistory.tx.results[threadID].join(" ");
}

function getTxHistoryString(threadID) {
    return formatTxHistory(threadID);
}

// Initialize history
gameHistory.tx.results = loadTxHistory();

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "casino",
    dev: "HNT",
    category: "Games",
    info: "Chơi các mini-game Casino.",
    onPrefix: true,
    usages: "casino [tài/xỉu/chẵn/lẻ/up/ngửa/bầu/cua/tôm/cá/gà/nai] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},

    generateDiceResults: function(senderID, playerChoice, betType, balance) {
        const stats = gameLogic.playerStats[senderID] || {};
        const dailyStats = gameLogic.getDailyStats(senderID);
        const pattern = gameLogic.analyzePlayerPattern(senderID);
        
        const isDailyLimitReached = dailyStats.winAmount >= gameLogic.DAILY_WIN_LIMIT;
        
        const winChance = gameLogic.calculateWinChance(senderID, {
            isAllIn: betType === 'allin',
            balance: balance,
            gameType: 'taixiu',
            betType: isDailyLimitReached ? 'restricted' : betType,
            pattern: pattern
        });

        let shouldWin = Math.random() < winChance;
         
        if (isDailyLimitReached) shouldWin = Math.random() < 0.15;
        if (pattern.isExploiting) shouldWin = Math.random() < 0.25;

        let dice1, dice2, dice3, total, result;
        
        do {
            dice1 = randomInt(1, 7);
            dice2 = randomInt(1, 7);
            dice3 = randomInt(1, 7);
            total = dice1 + dice2 + dice3;
            
            result = total >= 11 ? "tài" : "xỉu";

            if (total === 3 || total === 18) {
                if ((total === 18 && playerChoice === "tài") || 
                    (total === 3 && playerChoice === "xỉu")) {
                    break;
                }
                continue;
            }
        } while ((shouldWin && result !== playerChoice) || (!shouldWin && result === playerChoice));

        return { dice1, dice2, dice3, total, result };
    },

    handleJackpot: function(total, choice, senderID) {
        const quy = loadQuy();
        if (quy <= 0) return null;

        const isValidJackpot = 
            (total === 18 && choice === "tài") || 
            (total === 3 && choice === "xỉu");

        if (!isValidJackpot) return null;

        const eligibleUsers = Object.keys(readData().balance)
            .filter(userId => getBalance(userId) > 0);
        
        let jackpotResult = {
            message: `\n🎉 JACKPOT! Tổng ${total} điểm!`,
            distributedAmount: 0
        };

        const winnerShare = Math.floor(quy * 0.5);
        if (winnerShare > 0) {
            updateBalance(senderID, winnerShare);
            jackpotResult.distributedAmount += winnerShare;
            jackpotResult.message += `\n🏆 Bạn nhận được ${formatNumber(winnerShare)} $ (50% quỹ)!`;

            if (eligibleUsers.length > 1) {
                const shareAmount = Math.floor((quy - winnerShare) / (eligibleUsers.length - 1));
                if (shareAmount > 0) {
                    eligibleUsers.forEach(userId => {
                        if (userId !== senderID) {
                            updateBalance(userId, shareAmount);
                            jackpotResult.distributedAmount += shareAmount;
                        }
                    });
                    jackpotResult.message += `\n💸 ${formatNumber(quy - winnerShare)} $ chia đều cho ${eligibleUsers.length - 1} người.`;
                    jackpotResult.message += `\n💰 Mỗi người nhận: ${formatNumber(shareAmount)} $.`;
                }
            }

            if (jackpotResult.distributedAmount > 0) {
                saveQuy(quy - jackpotResult.distributedAmount);
            }
        }

        return jackpotResult;
    },

    // Chẵn Lẻ Logic
    generateChanLeResult: function(senderID, playerChoice, betType, balance, betAmount) {
        return gameLogic.generateChanLeResult(senderID, playerChoice, {
            isAllIn: betType === 'allin',
            balance: balance,
            betAmount: betAmount
        });
    },

    async createDiceImage(dice1, dice2, dice3) {
        try {
            const diceImagesDir = path.join(__dirname, 'dice');
            const tempDir = path.join(__dirname, 'temp');
            
            [diceImagesDir, tempDir].forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });

            const getDiceImagePath = (num) => {
                const imagePath = path.join(diceImagesDir, `dice${num}.png`);
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Dice image not found: dice${num}.png`);
                }
                return imagePath;
            };

            const diceImages = await Promise.all(
                [dice1, dice2, dice3].map(async n => {
                    try {
                        return await loadImage(getDiceImagePath(n));
                    } catch (err) {
                        throw new Error(`Failed to load dice${n}.png: ${err.message}`);
                    }
                })
            );

            const canvas = createCanvas(diceImages[0].width * 3, diceImages[0].height);
            const ctx = canvas.getContext('2d');
            diceImages.forEach((img, i) => ctx.drawImage(img, i * img.width, 0));

            const outputPath = path.join(tempDir, 'combined.png');
            fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));

            const stream = fs.createReadStream(outputPath);
            stream.on('end', () => fs.unlink(outputPath, err => err && console.error('Cleanup error:', err)));

            return stream;
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    },

    async createBaucuaImage(results) {
        try {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const sourceImageUrl = "https://i.imgur.com/ecUhWOE.png";
            const localImagePath = path.join(__dirname, 'bc', 'baucua.png');
            
            const outputIconSize = 300;
            const resultWidth = outputIconSize * 3;
            const resultHeight = outputIconSize;
            
            const canvas = createCanvas(resultWidth, resultHeight);
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, resultWidth, resultHeight);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, resultWidth, resultHeight);
        
            let sourceImage;
            try {
                if (fs.existsSync(localImagePath)) {
                    sourceImage = await loadImage(localImagePath);
                } else {
                    sourceImage = await Promise.race([
                        loadImage(sourceImageUrl),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Image loading timeout')), 20000)
                        )
                    ]);
                }
            } catch (imgError) {
                console.error("Error loading image:", imgError);
                sourceImage = null;
            }
            
            if (sourceImage) {
                const imgWidth = sourceImage.width;
                const imgHeight = sourceImage.height;
                
                const iconWidth = Math.floor(imgWidth / 3);
                const iconHeight = Math.floor(imgHeight / 2);
                
                const imageMap = {
                    'nai': { x: 0, y: 0, width: iconWidth, height: iconHeight },
                    'bầu': { x: iconWidth, y: 0, width: iconWidth, height: iconHeight },
                    'gà': { x: iconWidth * 2, y: 0, width: iconWidth, height: iconHeight },
                    'cá': { x: 0, y: iconHeight, width: iconWidth, height: iconHeight },
                    'cua': { x: iconWidth, y: iconHeight, width: iconWidth, height: iconHeight },
                    'tôm': { x: iconWidth * 2, y: iconHeight, width: iconWidth, height: iconHeight }
                };
                
                for (let i = 0; i < results.length; i++) {
                    const animal = results[i];
                    const pos = imageMap[animal];
                    
                    if (pos) {
                        ctx.drawImage(
                            sourceImage,
                            pos.x, pos.y, pos.width, pos.height,  
                            i * outputIconSize, 0, outputIconSize, outputIconSize 
                        );
                    
                        ctx.strokeRect(i * outputIconSize, 0, outputIconSize, outputIconSize);
                    }
                }
            } else {
                ctx.font = '150px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const EMOJIS = {
                    'bầu': '🎃', 'cua': '🦀', 'tôm': '🦐',
                    'cá': '🐟', 'gà': '🐓', 'nai': '🦌'
                };
                
                for (let i = 0; i < results.length; i++) {
                    const emoji = EMOJIS[results[i]] || '❓';
                    const x = i * outputIconSize + outputIconSize / 2;
                    const y = resultHeight / 2;
                    ctx.fillText(emoji, x, y);
                    ctx.strokeRect(i * outputIconSize, 0, outputIconSize, outputIconSize);
                }
            }
            
            const outputPath = path.join(tempDir, `baucua_${Date.now()}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            
            const stream = fs.createReadStream(outputPath);
            stream.on('end', () => fs.unlink(outputPath, err => err && console.error('Cleanup error:', err)));
            
            return stream;
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const autoUnsend = (messageID, delay = 10000) => {
                setTimeout(async () => {
                    try {
                        await api.unsendMessage(messageID);
                    } catch (unsendError) {
                        if (unsendError.error === 3252001) {
                            console.log("Bot tạm thời bị chặn từ việc gỡ tin nhắn");
                        } else {
                            console.error("Lỗi khi gỡ tin nhắn:", unsendError);
                        }
                    }
                }, delay);
            };
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 CASINO 』\n\n" +
                    "⚜️ Hướng dẫn sử dụng:\n" +
                    "➤ Tài Xỉu: .casino tài/xỉu [số tiền/allin]\n" +
                    "➤ Chẵn Lẻ: .casino chẵn/lẻ [số tiền/allin]\n" +
                    "➤ Bầu cua: .casino bầu/cua/tôm/cá/gà/nai [số tiền]\n\n" +
                    "📌 Tất cả các game đều có thể chơi allin\n" +
                    "📌 Mức cược tối thiểu: 10$\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "❓ Gõ [.casino help] để xem hướng dẫn chi tiết",
                    threadID, messageID
                );
            }

            const gameType = target[0].toLowerCase();
            const betType = target[1].toLowerCase();
            
            // Xử lý số tiền cược
            let betAmount = betType === "allin" ? balance : parseInt(betType);
            if (!betAmount || betAmount < 10 || betAmount > balance) {
                return api.sendMessage(`Số tiền cược không hợp lệ (tối thiểu 10$${betAmount > balance ? ", số dư không đủ" : ""}).`, threadID, messageID);
            }
            
            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                return api.sendMessage(
                    `Vui lòng đợi ${Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`, 
                    threadID, messageID
                );
            }
            this.lastPlayed[senderID] = currentTime;
            
            updateBalance(senderID, -betAmount);
            
            if (gameType === "tài" || gameType === "xỉu") {
                const sessionId = generateSessionId();
                
                // Create waiting canvas
                const canvasData = {
                    playerName: getUserName(senderID),
                    betAmount: betAmount,
                    choice: gameType,
                    sessionId: sessionId,
                    history: gameHistory.tx.results[threadID] || []
                };
                
                try {
                    const waitingCanvas = await createTaiXiuCanvas(canvasData, false);
                    const waitingStream = await bufferToReadStream(waitingCanvas, 'taixiu_wait');
                    const waitingMsg = await api.sendMessage({
                        body: `『 TÀI XỈU - ${sessionId} 』\n⏳ Đang lắc xúc xắc...`,
                        attachment: waitingStream
                    }, threadID, messageID);
                    
                    // Tự động xóa sau 5 giây (khi kết quả hiện lên)
                    setTimeout(() => autoUnsend(waitingMsg.messageID), 20000);
                } catch (error) {
                    const waitingMsg = await api.sendMessage(
                        `『 TÀI XỈU - ${sessionId} 』\n\n` +
                        `👤 Người chơi: ${getUserName(senderID)}\n` +
                        `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                        `🎯 Lựa chọn: ${gameType.toUpperCase()}\n` +
                        `📌 Lịch sử:\n${getTxHistoryString(threadID)}\n` +
                        "⏳ Đang lắc xúc xắc...\n" +
                        "┗━━━━━━━━━━━━━━━━┛", 
                        threadID, messageID
                    );
                    
                    // Tự động xóa sau 5 giây
                    setTimeout(() => autoUnsend(waitingMsg.messageID), 20000);
                }
                
                setTimeout(async () => {
                    try {
                        const { dice1, dice2, dice3, total, result } = this.generateDiceResults(
                            senderID, 
                            gameType, 
                            betType, 
                            balance
                        );
                        
                        updateTxHistory(threadID, result);
                        
                        let jackpotMessage = "";
                        
                        if ((total === 18 || total === 3) && result === gameType) {
                            const jackpotResult = this.handleJackpot(total, gameType, senderID);
                            if (jackpotResult) {
                                jackpotMessage = jackpotResult.message;
                            }
                        }
                        
                        let finalBalance = getBalance(senderID);
                        let winAmount = 0;
                        
                        if (gameType === result) {
                            const rewardInfo = gameLogic.calculateReward(betAmount, 2);
                            updateBalance(senderID, rewardInfo.finalReward);
                            saveQuy(loadQuy() + rewardInfo.fee);
                            
                            winAmount = rewardInfo.finalReward;
                            finalBalance = getBalance(senderID);
                            
                            gameLogic.updatePlayerStats(senderID, {won: true, betAmount, winAmount, gameType: 'taixiu'});
                            updateQuestProgress(senderID, "win_games");
                        } else {
                            gameLogic.updatePlayerStats(senderID, {won: false, betAmount, gameType: 'taixiu'});
                        }
                        
                        updateQuestProgress(senderID, "play_games");
                        
                        // Create result canvas
                        const resultData = {
                            playerName: getUserName(senderID),
                            betAmount: betAmount,
                            choice: gameType,
                            dice1, dice2, dice3,
                            total, result,
                            sessionId: sessionId,
                            history: gameHistory.tx.results[threadID] || [],
                            balance: finalBalance
                        };
                        
                        try {
                            const resultCanvas = await createTaiXiuCanvas(resultData, true);
                            const resultStream = await bufferToReadStream(resultCanvas, 'taixiu_result');
                            const sentMessage = await api.sendMessage({
                                body: `『 TÀI XỈU - ${sessionId} 』\n${jackpotMessage}`,
                                attachment: resultStream
                            }, threadID, messageID);
                            
                            // Tự động xóa sau 10 giây
                            autoUnsend(sentMessage.messageID);
                        } catch (error) {
                            console.error('Tài xỉu canvas error:', error);
                            
                            let message = 
                                `『 TÀI XỈU - ${sessionId} 』\n\n` +
                                `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                                `➤ ${result.toUpperCase()}\n` +
                                `📌 Lịch sử:\n${getTxHistoryString(threadID)}\n`;
                            
                            message += jackpotMessage;
                            
                            if (gameType === result) {
                                message += `\n🎉 Thắng: ${formatNumber(winAmount)} $`;
                            } else {
                                message += `\n💔 Thua: ${formatNumber(betAmount)} $`;
                            }
                            
                            message += `\n💰 Số dư: ${formatNumber(finalBalance)} $`;
                            
                            const imageBuffer = await this.createDiceImage(dice1, dice2, dice3);
                            await api.sendMessage({body: message, attachment: imageBuffer}, threadID, messageID);
                        }
                        
                    } catch (error) {
                        console.error('Tài xỉu processing error:', error);
                        if (!refundProcessed) {
                            refundProcessed = true;
                            updateBalance(senderID, betAmount);
                            await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                        }
                    }
                }, 20000);
                
                return;
            }
            
            else if (gameType === "chẵn" || gameType === "lẻ") {
                const canvasData = {
                    playerName: getUserName(senderID),
                    betAmount: betAmount,
                    choice: gameType
                };
                
                try {
                    const waitingCanvas = await createChanLeCanvas(canvasData, false);
                    const waitingStream = await bufferToReadStream(waitingCanvas, 'chanle_wait');
                    await api.sendMessage({
                        body: "『 CHẴN LẺ 』\n⏳ Đang tính toán kết quả...",
                        attachment: waitingStream
                    }, threadID, messageID);
                } catch (error) {
                    await api.sendMessage("『 CHẴN LẺ 』\n⏳ Đang tính toán kết quả...", threadID, messageID);
                }
                
                setTimeout(async () => {
                    try {
                        const { pattern, result, isSpecial } = this.generateChanLeResult(
                            senderID,
                            gameType,
                            betType,
                            balance,
                            betAmount
                        );
                        
                        let finalBalance = getBalance(senderID);
                        let winAmount = 0;
                        
                        if (gameType === result) {
                            const multiplier = isSpecial ? 4 : 2;
                            const rewardInfo = gameLogic.calculateReward(betAmount, multiplier);
                            
                            updateBalance(senderID, rewardInfo.finalReward);
                            winAmount = rewardInfo.finalReward;
                            finalBalance = getBalance(senderID);
                            
                            gameLogic.updatePlayerStats(senderID, {
                                won: true,
                                betAmount,
                                winAmount: rewardInfo.finalReward,
                                gameType: 'chanle'
                            });
                            
                            updateQuestProgress(senderID, "win_games");
                        } else {
                            gameLogic.updatePlayerStats(senderID, {
                                won: false,
                                betAmount,
                                gameType: 'chanle'
                            });
                        }
                        
                        updateQuestProgress(senderID, "play_games");
                        
                        // Create result canvas
                        const resultData = {
                            playerName: getUserName(senderID),
                            betAmount: betAmount,
                            choice: gameType,
                            pattern: pattern,
                            result: result,
                            isSpecial: isSpecial,
                            balance: finalBalance
                        };
                        
                        try {
                            const resultCanvas = await createChanLeCanvas(resultData, true);
                            const resultStream = await bufferToReadStream(resultCanvas, 'chanle_result');
                            const sentMessage = await api.sendMessage({
                                body: "『 CHẴN LẺ 』\nKết quả đã sẵn sàng!",
                                attachment: resultStream
                            }, threadID, messageID);
                            
                            // Tự động xóa sau 10 giây
                            autoUnsend(sentMessage.messageID);
                        } catch (error) {
                            console.error('Chẵn lẻ canvas error:', error);
                            
                            let message = `『 CHẴN LẺ 』\n\nKết quả: ${pattern.join(" ")} (${result.toUpperCase()})\n`;
                            
                            if (gameType === result) {
                                const multiplier = isSpecial ? 4 : 2;
                                message += `🎉 Thắng: ${formatNumber(winAmount)} $\n`;
                                message += `💹 Hệ số: x${multiplier} ${isSpecial ? "(Đặc biệt)" : ""}\n`;
                            } else {
                                message += `💔 Thua: ${formatNumber(betAmount)} $\n`;
                            }
                            
                            message += `\n💰 Số dư: ${formatNumber(finalBalance)} $`;
                            
                            await api.sendMessage(message, threadID, messageID);
                        }
                        
                    } catch (error) {
                        console.error('Chẵn lẻ processing error:', error);
                        if (!refundProcessed) {
                            refundProcessed = true;
                            updateBalance(senderID, betAmount);
                            await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                        }
                    }
                }, 20000);
                
                return;
            }
            
            else if (["bầu", "cua", "tôm", "cá", "gà", "nai"].includes(gameType)) {
                const choiceEmojis = {
                    "bầu": "🍐", "cua": "🦀", "tôm": "🦐",
                    "cá": "🐟", "gà": "🐓", "nai": "🦌"  
                };
                
                const canvasData = {
                    playerName: getUserName(senderID),
                    betAmount: betAmount,
                    choice: gameType,
                };
                
                try {
                    const waitingCanvas = await createBaucuaCanvas(canvasData, false);
                    const waitingStream = await bufferToReadStream(waitingCanvas, 'baucua_wait');
                    await api.sendMessage({
                        body: "『 BẦU CUA 』\n🎲 Đang lắc bầu cua...",
                        attachment: waitingStream
                    }, threadID, messageID);
                } catch (error) {
                    await api.sendMessage("🎲 Đang lắc bầu cua... Đợi 4 giây...", threadID, messageID);
                }
                
                setTimeout(async () => {
                    try {
                        const validChoices = ["bầu", "cua", "tôm", "cá", "gà", "nai"];
                        const results = Array(3).fill().map(() => validChoices[Math.floor(Math.random() * 6)]);
                        const matches = results.filter(r => r === gameType).length;
                        let winAmount = 0;
                        let finalBalance = getBalance(senderID);
                        
                        if (matches > 0) {
                            winAmount = betAmount * matches;
                            const rewardInfo = gameLogic.calculateReward(winAmount, 1);
                            updateBalance(senderID, rewardInfo.finalReward);
                            saveQuy(loadQuy() + rewardInfo.fee);
                            winAmount = rewardInfo.finalReward;
                            finalBalance = getBalance(senderID);
                            
                            gameLogic.updatePlayerStats(senderID, {
                                won: true, 
                                betAmount, 
                                winAmount: rewardInfo.finalReward,
                                gameType: 'baucua'
                            });
                            updateQuestProgress(senderID, "win_games");
                        } else {
                            gameLogic.updatePlayerStats(senderID, {
                                won: false,
                                betAmount,
                                gameType: 'baucua'
                            });
                        }
                        
                        updateQuestProgress(senderID, "play_games");
                        
                        // Create result canvas
                        const resultData = {
                            playerName: getUserName(senderID),
                            betAmount: betAmount,
                            choice: gameType,
                            results: results,
                            winAmount: winAmount,
                            balance: finalBalance
                        };
                        
                        try {
                            const resultCanvas = await createBaucuaCanvas(resultData, true);
                            const resultStream = await bufferToReadStream(resultCanvas, 'baucua_result');
                            const sentMessage = await api.sendMessage({
                                body: "『 BẦU CUA 』\nKết quả đã sẵn sàng!",
                                attachment: resultStream
                            }, threadID, messageID);
                            
                            // Tự động xóa sau 10 giây
                            autoUnsend(sentMessage.messageID);
                        } catch (error) {
                            console.error('Baucua canvas error:', error);
                            
                            const message = 
                                `『 BẦU CUA 』\n\n` +
                                `👤 Người chơi: ${getUserName(senderID)}\n` +
                                `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                                `🎯 Lựa chọn: ${choiceEmojis[gameType]} ${gameType.toUpperCase()}\n\n` +
                                `🎲 Kết quả: ${results.map(r => choiceEmojis[r]).join(' ')}\n`;
                            
                            let resultMessage = "";
                            if (matches > 0) {
                                resultMessage = `🎉 Thắng: ${formatNumber(winAmount)} $ (x${matches})`;
                            } else {
                                resultMessage = `💔 Thua: ${formatNumber(betAmount)} $`;
                            }
                            
                            const fullMessage = `${message}${resultMessage}\n💰 Số dư: ${formatNumber(finalBalance)} $`;
                            
                            try {
                                const imageBuffer = await this.createBaucuaImage(results);
                                await api.sendMessage({
                                    body: fullMessage,
                                    attachment: imageBuffer
                                }, threadID, messageID);
                            } catch (imageError) {
                                await api.sendMessage(fullMessage, threadID, messageID);
                            }
                        }
                        
                    } catch (error) {
                        console.error('Baucua processing error:', error);
                        if (!refundProcessed) {
                            refundProcessed = true;
                            updateBalance(senderID, betAmount);
                            await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                        }
                    }
                }, 4000);
                
                return;
            }
            
            else {
                updateBalance(senderID, betAmount); 
                return api.sendMessage(
                    "❌ Lựa chọn không hợp lệ!\n\n" +
                    "Vui lòng chọn một trong các game:\n" +
                    "• Tài Xỉu: .casino tài/xỉu [số tiền]\n" +
                    "• Chẵn Lẻ: .casino chẵn/lẻ [số tiền]\n" +
                    "• Bầu cua: .casino bầu/cua/tôm/cá/gà/nai [số tiền]",
                    threadID, messageID
                );
            }

        } catch (error) {
            console.error('Casino main error:', error);
            if (!refundProcessed) {
                refundProcessed = true;
                updateBalance(senderID, betAmount);
            }
            await api.sendMessage(
                "❌ Có lỗi xảy ra.", 
                event.threadID, event.messageID
            );
        }
    }
};
