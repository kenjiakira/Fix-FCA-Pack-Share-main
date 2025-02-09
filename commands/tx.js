const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress, readData } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "tx",
    dev: "HNT",
    info: "Chơi mini-game Tài Xỉu bằng số dư hiện có.",
    onPrefix: true,
    usages: "tx",
    cooldowns: 0,
    lastPlayed: {},

    generateDiceResults: function(senderID, playerChoice, betType, balance) {
        const winChance = gameLogic.calculateWinChance(senderID, {
            isAllIn: betType === 'allin',
            balance: balance,
            gameType: 'taixiu'
        });
        
        const shouldWin = Math.random() < winChance;
        let dice1, dice2, dice3, total, result;
        
        do {
            dice1 = randomInt(1, 7);
            dice2 = randomInt(1, 7);
            dice3 = randomInt(1, 7);
            total = dice1 + dice2 + dice3;
            result = total >= 11 ? "tài" : "xỉu";
        } while ((shouldWin && result !== playerChoice) || (!shouldWin && result === playerChoice));

        return { dice1, dice2, dice3, total, result };
    },

    handleJackpot: function(total, choice, senderID) {
        const quy = loadQuy();
        if (quy <= 0) return null;

        const isValidJackpot = (total === 18 && choice === "tài") || (total === 3 && choice === "xỉu");
        const eligibleUsers = Object.keys(readData().balance).filter(userId => getBalance(userId) > 0);
        
        let jackpotResult = {
            message: `\n🎉 JACKPOT! Tổng ${total} điểm!`,
            distributedAmount: 0
        };

        if (isValidJackpot) {
            const winnerShare = Math.floor(quy * 0.5);
            updateBalance(senderID, winnerShare);
            jackpotResult.message += `\n🏆 Bạn nhận được ${formatNumber(winnerShare)} Xu (50% quỹ)!`;
            jackpotResult.distributedAmount += winnerShare;

            if (eligibleUsers.length > 1) {
                const shareAmount = Math.floor((quy - winnerShare) / (eligibleUsers.length - 1));
                eligibleUsers.forEach(userId => {
                    if (userId !== senderID && shareAmount > 0) {
                        updateBalance(userId, shareAmount);
                    }
                });
                jackpotResult.message += `\n💸 ${formatNumber(quy - winnerShare)} Xu chia đều cho ${eligibleUsers.length - 1} người.`;
                jackpotResult.message += `\n💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.`;
            }
        } else {
            const shareAmount = Math.floor(quy / eligibleUsers.length);
            eligibleUsers.forEach(userId => updateBalance(userId, shareAmount));
            jackpotResult.message += `\n💸 ${formatNumber(quy)} Xu chia đều cho ${eligibleUsers.length} người.`;
            jackpotResult.message += `\n💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.`;
        }
        
        saveQuy(0);
        return jackpotResult;
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            const balance = getBalance(senderID);
            let refundProcessed = false;  // Add refund tracking flag

            if (target.length < 2) {
                return api.sendMessage("TÀI XỈU \n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn: .tx tài/xỉu <số tiền> hoặc\n.tx tài/xỉu allin", threadID, messageID);
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
            await api.sendMessage("🎲 Lắc xúc xắc... Đợi 5 giây...", threadID, messageID);

            setTimeout(async () => {
                try {
                    const { dice1, dice2, dice3, total, result } = this.generateDiceResults(senderID, choice, target[1].toLowerCase(), balance);
                    let message = `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total}\nKết quả: ${result.toUpperCase()}\n`;

                    if (total === 18 || total === 3) {
                        const jackpotResult = this.handleJackpot(total, choice, senderID);
                        if (jackpotResult) message += jackpotResult.message;
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
                    updateQuestProgress(senderID, "play_games");
                    if (choice === result) updateQuestProgress(senderID, "win_games");

                    const imageBuffer = await this.createDiceImage(dice1, dice2, dice3);
                    await api.sendMessage({body: message, attachment: imageBuffer}, threadID, messageID);

                } catch (error) {
                    console.error('Game processing error:', error);
                    if (!refundProcessed) {
                        refundProcessed = true;
                        updateBalance(senderID, betAmount);
                        await api.sendMessage("Có lỗi xảy ra, đã hoàn tiền cược.", threadID, messageID);
                    }
                }
            }, 5000);

        } catch (error) {
            console.error('Main error:', error);
            if (!refundProcessed) {
                refundProcessed = true;
                updateBalance(senderID, betAmount);
            }
            await api.sendMessage("Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    },

    async createDiceImage(dice1, dice2, dice3) {
        const getDiceImagePath = (num) => path.join(__dirname, 'cache', 'images', 'dice', `dice${num}.png`);
        const images = await Promise.all([dice1, dice2, dice3].map(n => loadImage(getDiceImagePath(n))));
        
        const canvas = createCanvas(images[0].width * 3, images[0].height);
        const ctx = canvas.getContext('2d');
        images.forEach((img, i) => ctx.drawImage(img, i * img.width, 0));
        
        const outputPath = path.join(__dirname, 'cache', 'images', 'dice', 'combined.png');
        fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
        
        const stream = fs.createReadStream(outputPath);
        stream.on('end', () => fs.unlink(outputPath, err => err && console.error('Cleanup error:', err)));
        
        return stream;
    }
};
