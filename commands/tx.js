const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress, readData } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');

const HISTORY_FILE = path.join(__dirname, './json/tx_history.json');

const gameHistory = {
    results: {},  
    sessions: new Map()
};

function loadHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            const dir = path.dirname(HISTORY_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(HISTORY_FILE, JSON.stringify({ results: {} }));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
        return data.results || {};
    } catch (error) {
        console.error('Error loading TX history:', error);
        return {};
    }
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({ results: gameHistory.results }));
    } catch (error) {
        console.error('Error saving TX history:', error);
    }
}

function generateSessionId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `#HNT${random}`;
}

function updateHistory(threadID, result) {
    if (!gameHistory.results[threadID]) {
        gameHistory.results[threadID] = [];
    }
    const emoji = result === "tài" ? "⚫" : "⚪";
    gameHistory.results[threadID].push(emoji);
    
    if (gameHistory.results[threadID].length > 9) {
        gameHistory.results[threadID].shift(); 
    }
    saveHistory();
}

function formatHistory(threadID) {
    if (!gameHistory.results[threadID] || gameHistory.results[threadID].length === 0) {
        return "Chưa có lịch sử";
    }
    
    return gameHistory.results[threadID].join(" ");
}

function getHistoryString(threadID) {
    return formatHistory(threadID);
}

gameHistory.results = loadHistory();

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "tx",
    dev: "HNT",
    category: "Games",
    info: "Chơi mini-game Tài Xỉu.",
    onPrefix: true,
    usages: "tx",
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
            jackpotResult.message += `\n🏆 Bạn nhận được ${formatNumber(winnerShare)} Xu (50% quỹ)!`;

            if (eligibleUsers.length > 1) {
                const shareAmount = Math.floor((quy - winnerShare) / (eligibleUsers.length - 1));
                if (shareAmount > 0) {
                    eligibleUsers.forEach(userId => {
                        if (userId !== senderID) {
                            updateBalance(userId, shareAmount);
                            jackpotResult.distributedAmount += shareAmount;
                        }
                    });
                    jackpotResult.message += `\n💸 ${formatNumber(quy - winnerShare)} Xu chia đều cho ${eligibleUsers.length - 1} người.`;
                    jackpotResult.message += `\n💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.`;
                }
            }

            if (jackpotResult.distributedAmount > 0) {
                saveQuy(quy - jackpotResult.distributedAmount);
            }
        }

        return jackpotResult;
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;
            const sessionId = generateSessionId();
            
            const shouldPromoteDiscord = Math.random() < 0.15;
            const discordPromo = shouldPromoteDiscord ? 
                "\n\n🎮 Chơi Tài Xỉu trên Discord:\n" +
                "• Trải nghiệm mượt mà hơn\n" + 
                "• Giao diện đẹp với nút bấm\n" +
                "• Thưởng thêm Xu Nitro mỗi ngày\n" +
                "• Link Discord: https://discord.gg/UBtdSYzn\n" +
                "━━━━━━━━━━━━━━\n" : "";

            gameHistory.sessions.set(sessionId, {
                userId: senderID,
                timestamp: Date.now()
            });

            if (target.length < 2) {
                return api.sendMessage(
                    "┏━━『 TÀI XỈU 』━━┓\n\n" +
                    "⚜️ Hướng dẫn:\n" +
                    "➤ .tx tài/xỉu <số tiền>\n" +
                    "➤ .tx tài/xỉu allin\n\n" +
                    "📌 Lịch sử:\n" + getHistoryString(threadID) + "\n" +
                    "━━━━━━━━━━━━━━\n" +
                    "⚫ = Tài | ⚪ = Xỉu" +
                    discordPromo +
                    "┗━━━━━━━━━━━━━━┛", 
                    threadID, messageID
                );
            }

            const choice = target[0].toLowerCase();
            if (choice !== "tài" && choice !== "xỉu") {
                return api.sendMessage("Vui lòng chọn 'tài' hoặc 'xỉu'.", threadID, messageID);
            }

            
            let betAmount = target[1].toLowerCase() === "allin" ? balance : parseInt(target[1]);
            if (!betAmount || betAmount < 10000 || betAmount > balance) {
                return api.sendMessage(`Số tiền cược không hợp lệ (tối thiểu 10,000 Xu${betAmount > balance ? ", số dư không đủ" : ""}).`, threadID, messageID);
            }

            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                return api.sendMessage(`Vui lòng đợi ${Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`, threadID, messageID);
            }
            this.lastPlayed[senderID] = currentTime;

            updateBalance(senderID, -betAmount);
            await api.sendMessage(
                `『 PHIÊN ${sessionId} 』\n\n` +
                `👤 Người chơi: ${event.senderID}\n` +
                `💰 Đặt cược: ${formatNumber(betAmount)} Xu\n` +
                `🎯 Lựa chọn: ${choice.toUpperCase()}\n` +
                `📌 Lịch sử:\n${getHistoryString(threadID)}\n` +
                "⏳ Đang lắc xúc xắc...\n" +
                "┗━━━━━━━━━━━┛", 
                threadID, messageID
            );

            setTimeout(async () => {
                try {
                    const { dice1, dice2, dice3, total, result } = this.generateDiceResults(senderID, choice, target[1].toLowerCase(), balance);
                    updateHistory(threadID, result);
                    let message = 
                        `『 PHIÊN ${sessionId} 』\n\n` +
                        `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                        `➤ ${result.toUpperCase()}\n` +
                        `📌 Lịch sử:\n${getHistoryString(threadID)}\n`;

                    if ((total === 18 || total === 3) && result === choice) {
                        const jackpotResult = this.handleJackpot(total, choice, senderID);
                        if (jackpotResult) {
                            message += jackpotResult.message;
                        }
                    }

              
                    if (choice === result) {
                        const rewardInfo = gameLogic.calculateReward(betAmount, 2);
                        updateBalance(senderID, rewardInfo.finalReward);
                        saveQuy(loadQuy() + rewardInfo.fee);
                        
                        message += `\n🎉 Thắng: ${formatNumber(rewardInfo.finalReward)} Xu\n(Phí: ${(rewardInfo.fee/rewardInfo.rawReward*100).toFixed(1)}%)`;
                        gameLogic.updatePlayerStats(senderID, {won: true, betAmount, winAmount: rewardInfo.finalReward, gameType: 'taixiu'});
                    } else {
                        message += `\n💔 Thua: ${formatNumber(betAmount)} Xu`;
                        gameLogic.updatePlayerStats(senderID, {won: false, betAmount, gameType: 'taixiu'});
                    }

                    message += `\n💰 Số dư: ${formatNumber(getBalance(senderID))} Xu`;
                    message += `\n💰 Quỹ: ${formatNumber(loadQuy())} Xu`;

                    if (choice === result && Math.random() < 0.2) {
                        message += "\n\n🎮 Bạn có biết?\n" +
                                 "Bot Discord của chúng tôi có:\n" +
                                 "• Giao diện đẹp mắt hơn\n" +
                                 "• Tốc độ xử lý nhanh hơn\n" +
                                 "• Nhiều phần thưởng hấp dẫn\n" +
                                 "→ Tham gia ngay: https://discord.gg/UBtdSYzn";
                    }

                    updateQuestProgress(senderID, "play_games");
                    if (choice === result) updateQuestProgress(senderID, "win_games");

                    const imageBuffer = await this.createDiceImage(dice1, dice2, dice3);
                    await api.sendMessage({body: message, attachment: imageBuffer}, threadID, messageID);

                } catch (error) {
                    console.error('Game processing error:', error);
                    if (!refundProcessed) {
                        refundProcessed = true;
                        updateBalance(senderID, betAmount);
                        await api.sendMessage(
                            `❌ Có lỗi xảy ra trong phiên ${sessionId}, đã hoàn tiền cược.`, 
                            threadID, messageID
                        );
                    }
                }
            }, 5000);

        } catch (error) {
            console.error('Main error:', error);
            if (!refundProcessed) {
                refundProcessed = true;
                updateBalance(senderID, betAmount);
            }
            await api.sendMessage(
                "❌ Có lỗi xảy ra.", 
                event.threadID, event.messageID
            );
        }
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
    }
};
