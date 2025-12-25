const { 
    getBalance, 
    updateBalance, 
    loadQuy, 
    saveQuy, 
    updateQuestProgress
} = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const { getUserName } = require('../utils/userUtils'); 

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
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
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 CHẴN LẺ 』\n\n" +
                    "⚜️ Hướng dẫn:\n" +
                    "➤ .chanle chẵn [số tiền/allin]\n" +
                    "➤ .chanle lẻ [số tiền/allin]\n\n" +
                    "📌 Mức cược tối thiểu: 10$",
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
                    const { pattern, result, isSpecial } = gameLogic.generateChanLeResult(senderID, gameType, {
                        isAllIn: betType === 'allin',
                        balance: balance,
                        betAmount: betAmount
                    });
                    
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
                    
                    let message = `『 CHẴN LẺ 』\n\n`;
                    message += `🎲 Kết quả: ${pattern.join(" ")} (${result.toUpperCase()})\n`;
                    
                    if (gameType === result) {
                        const multiplier = isSpecial ? 4 : 2;
                        message += `🎉 Thắng: ${formatNumber(winAmount)} $\n`;
                        message += `💹 Hệ số: x${multiplier} ${isSpecial ? "(Đặc biệt)" : ""}\n`;
                    } else {
                        message += `💔 Thua: ${formatNumber(betAmount)} $\n`;
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

