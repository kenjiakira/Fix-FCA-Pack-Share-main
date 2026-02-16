const { randomInt } = require('crypto');
const { 
    getBalance, 
    updateBalance, 
    loadQuy, 
    saveQuy, 
    updateQuestProgress
} = require('../utils/currencies');
const { getUserName } = require('../utils/userUtils');
const { getOutcomeChanLe, recordOutcome: recordBookmakerOutcome } = require('../utils/bookmaker');

/** Giờ Việt Nam (UTC+7) */
function getVietnamHour() {
    return (new Date().getUTCHours() + 7) % 24;
}

function isChanLeOpen() {
    const h = getVietnamHour();
    return (h >= 10 && h < 12) || (h >= 19 && h < 24);
} 

const CHANLE_ICONS = { WHITE: "⚪", RED: "🔴" };
const CHANLE_PATTERNS = {
    "chẵn": [
        [CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE, CHANLE_ICONS.RED, CHANLE_ICONS.RED],
        [CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE]
    ],
    "lẻ": [
        [CHANLE_ICONS.WHITE, CHANLE_ICONS.RED, CHANLE_ICONS.RED, CHANLE_ICONS.RED],
        [CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE, CHANLE_ICONS.WHITE, CHANLE_ICONS.RED],
        [CHANLE_ICONS.RED, CHANLE_ICONS.RED, CHANLE_ICONS.RED, CHANLE_ICONS.RED]
    ]
};

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

function calculateReward(betAmount, multiplier = 1) {
    const rawReward = betAmount * multiplier;
    let feeRate = 0.02;
    if (betAmount >= 1000000) feeRate = 0.04;
    if (betAmount >= 10000000) feeRate = 0.06;
    const fee = Math.ceil(rawReward * feeRate);
    return { rawReward, fee, finalReward: rawReward - fee };
}

function generateChanLeResult() {
    const result = Math.random() < 0.5 ? "chẵn" : "lẻ";
    const patternPool = CHANLE_PATTERNS[result];
    const pattern = patternPool[randomInt(0, patternPool.length)];
    const isSpecial = pattern.every(c => c === CHANLE_ICONS.WHITE) || pattern.every(c => c === CHANLE_ICONS.RED);
    return { pattern, result, isSpecial };
}

module.exports = {
    name: "chanle",
    dev: "HNT",
    category: "Games",
    info: "Chơi Chẵn Lẻ",
    onPrefix: true,
    usages: "chanle [chẵn/lẻ] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;

            if (!isChanLeOpen()) {
                return api.sendMessage(
                    "『 CHẴN LẺ 』\n\n❌ Chẵn Lẻ chỉ mở trong khung giờ:\n➤ 10h – 12h\n➤ 19h – 24h (theo giờ Việt Nam)",
                    threadID, messageID
                );
            }
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 CHẴN LẺ 』\n\n" +
                    "⚜️ Hướng dẫn:\n" +
                    "➤ .chanle chẵn [số tiền/allin]\n" +
                    "➤ .chanle lẻ [số tiền/allin]\n\n" +
                    "📌 Mức cược tối thiểu: 10$\n" +
                    "🕐 Mở cửa: 10h–12h & 19h–24h",
                    threadID, messageID
                );
            }

            const gameType = target[0].toLowerCase();
            const betType = target[1].toLowerCase();
            
            if (gameType !== "chẵn" && gameType !== "lẻ") {
                return api.sendMessage("❌ Vui lòng chọn 'chẵn' hoặc 'lẻ'", threadID, messageID);
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
            
            await api.sendMessage(
                `『 CHẴN LẺ 』\n\n` +
                `👤 Người chơi: ${getUserName(senderID)}\n` +
                `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                `🎯 Lựa chọn: ${gameType.toUpperCase()}\n` +
                `⏳ Đang tính toán kết quả...`,
                threadID, messageID
            );
            
            setTimeout(async () => {
                try {
                    const quyBefore = loadQuy();
                    const rigged = getOutcomeChanLe(betAmount, gameType, quyBefore, threadID);
                    const { pattern, result, isSpecial } = rigged || generateChanLeResult();
                    
                    let finalBalance = getBalance(senderID);
                    let winAmount = 0;
                    let quyAdded = 0;
                    let quyCurrent = 0;
                    
                    if (gameType === result) {
                        const multiplier = isSpecial ? 4 : 2;
                        const rewardInfo = calculateReward(betAmount, multiplier);
                        
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
                    
                    let message = `『 CHẴN LẺ 』\n\n`;
                    message += `🎲 Kết quả: ${pattern.join(" ")} (${result.toUpperCase()})\n`;
                    
                    if (gameType === result) {
                        const multiplier = isSpecial ? 4 : 2;
                        message += `🎉 Thắng: ${formatNumber(winAmount)} $\n`;
                        message += `💹 Hệ số: x${multiplier} ${isSpecial ? "(Đặc biệt)" : ""}\n`;
                        message += `📥 Hũ +${formatNumber(quyAdded)} $ | 🏦 Hũ hiện tại: ${formatNumber(quyCurrent)} $\n`;
                    } else {
                        message += `💔 Thua: ${formatNumber(betAmount)} $\n`;
                        message += `🏦 Hũ hiện tại: ${formatNumber(quyCurrent)} $\n`;
                    }
                    
                    message += `💰 Số dư: ${formatNumber(finalBalance)} $`;
                    
                    await api.sendMessage(message, threadID, messageID);
                    
                } catch (error) {
                    console.error('Chẵn lẻ processing error:', error);
                    if (!refundProcessed) {
                        refundProcessed = true;
                        updateBalance(senderID, betAmount);
                        await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                    }
                }
            }, 20000);
            
        } catch (error) {
            console.error('Chẵn lẻ main error:', error);
            await api.sendMessage("❌ Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};

