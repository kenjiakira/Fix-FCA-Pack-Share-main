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
    name: "baucua",
    dev: "HNT",
    category: "Games",
    info: "Chơi Bầu Cua",
    onPrefix: true,
    usages: "baucua [bầu/cua/tôm/cá/gà/nai] [số tiền]",
    cooldowns: 0,
    lastPlayed: {},

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;
            
            if (target.length < 2) {
                return api.sendMessage(
                    "『 BẦU CUA 』\n\n" +
                    "⚜️ Hướng dẫn:\n" +
                    "➤ .baucua bầu [số tiền]\n" +
                    "➤ .baucua cua [số tiền]\n" +
                    "➤ .baucua tôm [số tiền]\n" +
                    "➤ .baucua cá [số tiền]\n" +
                    "➤ .baucua gà [số tiền]\n" +
                    "➤ .baucua nai [số tiền]\n\n" +
                    "📌 Mức cược tối thiểu: 10$",
                    threadID, messageID
                );
            }

            const gameType = target[0].toLowerCase();
            const betType = target[1].toLowerCase();
            
            const validChoices = ["bầu", "cua", "tôm", "cá", "gà", "nai"];
            if (!validChoices.includes(gameType)) {
                return api.sendMessage(
                    "❌ Lựa chọn không hợp lệ!\n" +
                    "Vui lòng chọn: bầu, cua, tôm, cá, gà, nai",
                    threadID, messageID
                );
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
            
            const choiceEmojis = {
                "bầu": "🍐", "cua": "🦀", "tôm": "🦐",
                "cá": "🐟", "gà": "🐓", "nai": "🦌"  
            };
            
            await api.sendMessage(
                `『 BẦU CUA 』\n\n` +
                `👤 Người chơi: ${getUserName(senderID)}\n` +
                `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                `🎯 Lựa chọn: ${choiceEmojis[gameType]} ${gameType.toUpperCase()}\n` +
                `🎲 Đang lắc bầu cua...`,
                threadID, messageID
            );
            
            setTimeout(async () => {
                try {
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
                    
                    let message = 
                        `『 BẦU CUA 』\n\n` +
                        `👤 Người chơi: ${getUserName(senderID)}\n` +
                        `💰 Đặt cược: ${formatNumber(betAmount)} $\n` +
                        `🎯 Lựa chọn: ${choiceEmojis[gameType]} ${gameType.toUpperCase()}\n\n` +
                        `🎲 Kết quả: ${results.map(r => choiceEmojis[r]).join(' ')}\n`;
                    
                    if (matches > 0) {
                        message += `🎉 Thắng: ${formatNumber(winAmount)} $ (x${matches})\n`;
                    } else {
                        message += `💔 Thua: ${formatNumber(betAmount)} $\n`;
                    }
                    
                    message += `💰 Số dư: ${formatNumber(finalBalance)} $`;
                    
                    await api.sendMessage(message, threadID, messageID);
                    
                } catch (error) {
                    console.error('Baucua processing error:', error);
                    if (!refundProcessed) {
                        refundProcessed = true;
                        updateBalance(senderID, betAmount);
                        await api.sendMessage("❌ Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                    }
                }
            }, 4000);
            
        } catch (error) {
            console.error('Baucua main error:', error);
            await api.sendMessage("❌ Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};

