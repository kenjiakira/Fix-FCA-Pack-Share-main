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

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;

            const currentTime = Date.now();

            if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 40000) {
                const waitTime = Math.ceil((40000 - (currentTime - this.lastPlayed[senderID])) / 1000);
                return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
            }

            this.lastPlayed[senderID] = currentTime;

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

            updateBalance(senderID, -betAmount);

            let message = `🎲 Lắc xúc xắc... Đợi ${5} giây...`;

            await api.sendMessage(message, threadID, messageID);

            setTimeout(async () => {
                try {
                    const dice1 = randomInt(1, 7);
                    const dice2 = randomInt(1, 7);
                    const dice3 = randomInt(1, 7);
                    const total = dice1 + dice2 + dice3;
                    const result = total >= 11 ? "tài" : "xỉu";

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
                        if (choice === result) {
                            const winnings = betAmount * 2;
                            fee = winnings * 0.05;
                            const finalWinnings = Math.floor(winnings - fee);
                            updateBalance(senderID, finalWinnings);
                            message += `🎉 Chúc mừng! Bạn thắng và nhận được ${formatNumber(finalWinnings)} Xu.\nPhí: 5%\n`;

                            let quy = loadQuy();
                            quy += Math.floor(fee);
                            saveQuy(quy);

                            updateQuestProgress(senderID, "play_games");
                            updateQuestProgress(senderID, "win_games");
                        } else {
                            message += `😢 Bạn đã thua và mất ${formatNumber(betAmount)} Xu.\n`;
                            updateQuestProgress(senderID, "play_games");
                        }

                        if (total === 18 || total === 3) {
                            const quy = loadQuy();
                            console.log(`Debug: Jackpot triggered! Total: ${total}, Quỹ: ${quy}`);
                            
                            if (quy > 0) { 
                                const allUsers = Object.keys(readData().balance);
                                const eligibleUsers = allUsers.filter(userId => getBalance(userId) > 0);
                                console.log(`Debug: Found ${eligibleUsers.length} eligible users`);

                                if (eligibleUsers.length > 0) {
                                    const shareAmount = Math.floor(quy / eligibleUsers.length);
                                    console.log(`Debug: Share amount per user: ${shareAmount}`);

                                    if (shareAmount > 0) {
                                        eligibleUsers.forEach(userId => {
                                            updateBalance(userId, shareAmount);
                                        });

                                        message += `\n🎉 JACKPOT! Tổng ${total} điểm!\n`;
                                        message += `💸 Quỹ ${formatNumber(quy)} Xu được chia đều cho ${eligibleUsers.length} người chơi.\n`;
                                        message += `💰 Mỗi người nhận: ${formatNumber(shareAmount)} Xu.\n`;
                                        
                                        saveQuy(0);
                                        console.log('Debug: Quỹ has been reset to 0 after distribution');
                                    }
                                }
                            } else {
                                console.log('Debug: Quỹ is empty or invalid:', quy);
                                message += `\n🎉 JACKPOT! Tổng ${total} điểm! Nhưng quỹ hiện đang trống.\n`;
                            }
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
