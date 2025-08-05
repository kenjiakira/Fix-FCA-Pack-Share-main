const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress, readData } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const { getUserName } = require('../utils/userUtils'); 


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
        console.error('Error loading TX Fast history:', error);
        return {};
    }
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({ results: gameHistory.results }));
    } catch (error) {
        console.error('Error saving TX Fast history:', error);
    }
}

function generateSessionId() {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `#F${random}`;
}

function updateHistory(threadID, result) {
    if (!gameHistory.results[threadID]) {
        gameHistory.results[threadID] = [];
    }
    const emoji = result === "tài" ? "⚫" : "⚪";
    gameHistory.results[threadID].push(emoji);
    
    if (gameHistory.results[threadID].length > 12) {
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

gameHistory.results = loadHistory();

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

function generateDiceResults(senderID, playerChoice, betType, balance, betAmount) {
    const winChance = gameLogic.calculateWinChance(senderID, {
        isAllIn: betType === 'allin',
        balance: balance,
        betAmount: betAmount,
        gameType: 'taixiu'
    });

    let shouldWin = Math.random() < winChance;
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
}

function handleJackpot(total, choice, senderID) {
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
            }
        }

        if (jackpotResult.distributedAmount > 0) {
            saveQuy(quy - jackpotResult.distributedAmount);
        }
    }

    return jackpotResult;
}

module.exports = {
    name: "tx",
    dev: "HNT",
    category: "Games",
    info: "Chơi Tài Xỉu.",
    onPrefix: true,
    usages: "tx [tài/xỉu] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},
    
    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 TÀI XỈU NHANH 』\n\n" +
                    "⚡ Cách chơi:\n" +
                    "• .tx tài [số tiền/allin]\n" +
                    "• .tx xỉu [số tiền/allin]\n\n" +
                    "📌 Mức cược tối thiểu: 10$\n" +
                    "⚡ Kết quả ngay lập tức - không có ảnh\n" +
                    "━━━━━━━━━━━━━━━━━━",
                    threadID, messageID
                );
            }

            const gameType = target[0].toLowerCase();
            const betType = target[1].toLowerCase();
            
            if (gameType !== "tài" && gameType !== "xỉu") {
                return api.sendMessage("❌ Vui lòng chọn 'tài' hoặc 'xỉu'!", threadID, messageID);
            }
            
            let betAmount = betType === "allin" ? balance : parseInt(betType);
            if (!betAmount || betAmount < 10 || betAmount > balance) {
                return api.sendMessage(`❌ Số tiền cược không hợp lệ (tối thiểu 10$${betAmount > balance ? ", số dư không đủ" : ""}).`, threadID, messageID);
            }
            
            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 3000) {
                return api.sendMessage(
                    `⏱️ Vui lòng đợi ${Math.ceil((3000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`, 
                    threadID, messageID
                );
            }
            this.lastPlayed[senderID] = currentTime;
            
            updateBalance(senderID, -betAmount);
            
            const sessionId = generateSessionId();
            const { dice1, dice2, dice3, total, result } = generateDiceResults(
                senderID, 
                gameType, 
                betType, 
                balance,
                betAmount
            );
            
            updateHistory(threadID, result);
            
            let jackpotMessage = "";
            if ((total === 18 || total === 3) && result === gameType) {
                const jackpotResult = handleJackpot(total, gameType, senderID);
                if (jackpotResult) {
                    jackpotMessage = jackpotResult.message;
                }
            }
            
            let finalBalance = getBalance(senderID);
            let winAmount = 0;
            let statusEmoji = "";
            let statusText = "";
            
            if (gameType === result) {
                const rewardInfo = gameLogic.calculateReward(betAmount, 2);
                updateBalance(senderID, rewardInfo.finalReward);
                saveQuy(loadQuy() + rewardInfo.fee);
                
                winAmount = rewardInfo.finalReward;
                finalBalance = getBalance(senderID);
                statusEmoji = "🎉";
                statusText = `THẮNG: +${formatNumber(winAmount)} $`;
                
                gameLogic.updatePlayerStats(senderID, {
                    won: true, 
                    betAmount, 
                    winAmount, 
                    gameType: 'taixiu'
                });
                updateQuestProgress(senderID, "win_games");
            } else {
                statusEmoji = "💔";
                statusText = `THUA: -${formatNumber(betAmount)} $`;
                
                gameLogic.updatePlayerStats(senderID, {
                    won: false, 
                    betAmount, 
                    gameType: 'taixiu'
                });
            }
            
            updateQuestProgress(senderID, "play_games");
            
            const message = 
                `『 TÀI XỈU NHANH - ${sessionId} 』\n\n` +
                `👤 ${getUserName(senderID)}\n` +
                `💰 Cược: ${formatNumber(betAmount)} $ • Chọn: ${gameType.toUpperCase()}\n\n` +
                `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                `➤ ${result.toUpperCase()} ${statusEmoji}\n\n` +
                `${statusText}\n` +
                `💰 Số dư: ${formatNumber(finalBalance)} $\n\n` +
                `📊 Lịch sử: ${formatHistory(threadID)}${jackpotMessage}\n` +
                `━━━━━━━━━━━━━━━━━━`;
            
            return api.sendMessage(message, threadID, messageID);
            
        } catch (error) {
            console.error('TX Fast error:', error);
            
            // Refund on error
            try {
                updateBalance(event.senderID, betAmount);
            } catch (refundError) {
                console.error('Refund error:', refundError);
            }
            
            return api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", event.threadID, event.messageID);
        }
    }
};
