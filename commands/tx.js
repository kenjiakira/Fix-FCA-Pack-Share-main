const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { 
    getBalance, 
    updateBalance, 
    loadQuy, 
    saveQuy, 
    updateQuestProgress
} = require('../utils/currencies');
const { getUserName } = require('../utils/userUtils');
const { getOutcome: getBookmakerOutcome, recordOutcome: recordBookmakerOutcome } = require('../utils/bookmaker');

function calculateReward(betAmount, multiplier = 1) {
    const rawReward = betAmount * multiplier;
    let feeRate = 0.02;
    if (betAmount >= 1000000) feeRate = 0.04;
    if (betAmount >= 10000000) feeRate = 0.06;
    const fee = Math.ceil(rawReward * feeRate);
    return { rawReward, fee, finalReward: rawReward - fee };
} 

const TX_HISTORY_FILE = path.join(__dirname, '../database/json/tx_history.json');

const gameHistory = {
    results: {}
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
        fs.writeFileSync(TX_HISTORY_FILE, JSON.stringify({ results: gameHistory.results }));
    } catch (error) {
        console.error('Error saving TX history:', error);
    }
}

function generateSessionId() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `#HNT${random}`;
}

function updateTxHistory(threadID, result) {
    if (!gameHistory.results[threadID]) {
        gameHistory.results[threadID] = [];
    }
    const emoji = result === "tài" ? "⚫" : "⚪";
    gameHistory.results[threadID].push(emoji);
    
    if (gameHistory.results[threadID].length > 9) {
        gameHistory.results[threadID].shift(); 
    }
    saveTxHistory();
}

function getTxHistoryString(threadID) {
    if (!gameHistory.results[threadID] || gameHistory.results[threadID].length === 0) {
        return "Chưa có lịch sử";
    }
    return gameHistory.results[threadID].join(" ");
}

gameHistory.results = loadTxHistory();

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

function generateDiceResults() {
    const dice1 = randomInt(1, 7);
    const dice2 = randomInt(1, 7);
    const dice3 = randomInt(1, 7);
    const total = dice1 + dice2 + dice3;
    const result = total >= 11 ? "tài" : "xỉu";
    return { dice1, dice2, dice3, total, result };
}

function handleJackpot(total, choice, senderID) {
    const quy = loadQuy();
    if (quy <= 0) return null;

    const isValidJackpot = 
        (total === 18 && choice === "tài") || 
        (total === 3 && choice === "xỉu");

    if (!isValidJackpot) return null;

    updateBalance(senderID, quy);
    saveQuy(0);

    return {
        message: `\n🎉 JACKPOT! Tổng ${total} điểm!\n🏆 Bạn nhận được toàn bộ quỹ: ${formatNumber(quy)} $!`
    };
}

module.exports = {
    name: "tx",
    dev: "HNT",
    category: "Games",
    info: "Chơi Tài Xỉu",
    onPrefix: true,
    usages: "tx [tài/xỉu] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 TÀI XỈU 』\n\n" +
                    "⚜️ Hướng dẫn:\n" +
                    "➤ .tx tài [số tiền/allin]\n" +
                    "➤ .tx xỉu [số tiền/allin]\n\n" +
                    "📌 Mức cược tối thiểu: 10$",
                    threadID, messageID
                );
            }

            const gameType = target[0].toLowerCase();
            const betType = target[1].toLowerCase();
            
            if (gameType !== "tài" && gameType !== "xỉu") {
                return api.sendMessage("❌ Vui lòng chọn 'tài' hoặc 'xỉu'", threadID, messageID);
            }
            
            let betAmount = betType === "allin" ? balance : parseInt(betType);
            if (!betAmount || betAmount < 10 || betAmount > balance) {
                return api.sendMessage(
                    `❌ Số tiền cược không hợp lệ (tối thiểu 10$${betAmount > balance ? ", số dư không đủ" : ""}).`, 
                    threadID, messageID
                );
            }
            
            const currentTime = Date.now();
            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                return api.sendMessage(
                    `⏳ Vui lòng đợi ${Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`, 
                    threadID, messageID
                );
            }
            this.lastPlayed[senderID] = currentTime;
            
            updateBalance(senderID, -betAmount);
            
            const sessionId = generateSessionId();
            
            const waitingMsg = await api.sendMessage(
                `『 TÀI XỈU - ${sessionId} 』\n\n` +
                `👤 Người chơi: ${getUserName(senderID)}\n` +
                `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                `🎯 Lựa chọn: ${gameType.toUpperCase()}\n` +
                `📌 Lịch sử: ${getTxHistoryString(threadID)}\n` +
                `⏳ Đang lắc xúc xắc...`,
                threadID, messageID
            );
            
            setTimeout(async () => {
                try {
                    const quyBefore = loadQuy();
                    const rigged = getBookmakerOutcome(betAmount, gameType, quyBefore, threadID);
                    const { dice1, dice2, dice3, total, result } = rigged || generateDiceResults();
                    
                    updateTxHistory(threadID, result);
                    
                    let jackpotMessage = "";
                    
                    if ((total === 18 || total === 3) && result === gameType) {
                        const jackpotResult = handleJackpot(total, gameType, senderID);
                        if (jackpotResult) {
                            jackpotMessage = jackpotResult.message;
                        }
                    }
                    
                    let finalBalance = getBalance(senderID);
                    let winAmount = 0;
                    
                    let quyAdded = 0;
                    let quyCurrent = 0;

                    if (gameType === result) {
                        const rewardInfo = calculateReward(betAmount, 2);
                        updateBalance(senderID, rewardInfo.finalReward);
                        quyAdded = rewardInfo.fee;
                        quyCurrent = loadQuy() + quyAdded;
                        saveQuy(quyCurrent);
                        
                        winAmount = rewardInfo.finalReward;
                        finalBalance = getBalance(senderID);
                        
                        updateQuestProgress(senderID, "win_games");
                    } else {
                        quyCurrent = loadQuy();
                    }
                    
                    recordBookmakerOutcome(threadID, gameType === result);
                    updateQuestProgress(senderID, "play_games");
                    
                    let message = 
                        `『 TÀI XỈU - ${sessionId} 』\n\n` +
                        `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total}\n` +
                        `➤ ${result.toUpperCase()}\n` +
                        `📌 Lịch sử: ${getTxHistoryString(threadID)}\n`;
                    
                    message += jackpotMessage;
                    
                    if (gameType === result) {
                        message += `\n🎉 Thắng: ${formatNumber(winAmount)} $\n`;
                        message += `📥 Hũ +${formatNumber(quyAdded)} $ | 🏦 Hũ hiện tại: ${formatNumber(quyCurrent)} $\n`;
                    } else {
                        message += `\n💔 Thua: ${formatNumber(betAmount)} $\n`;
                        message += `🏦 Hũ hiện tại: ${formatNumber(quyCurrent)} $\n`;
                    }
                    
                    message += `💰 Số dư: ${formatNumber(finalBalance)} $`;
                    
                    await api.sendMessage(message, threadID, messageID);
                    
                } catch (error) {
                    console.error('Tài xỉu processing error:', error);
                    if (!refundProcessed) {
                        refundProcessed = true;
                        updateBalance(senderID, betAmount);
                        await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                    }
                }
            }, 20000);
            
        } catch (error) {
            console.error('Tài xỉu main error:', error);
            await api.sendMessage("❌ Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};

