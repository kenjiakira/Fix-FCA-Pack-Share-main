const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, loadQuy, saveQuy, updateQuestProgress } = require('../utils/currencies');

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
        const { threadID, messageID, senderID } = event;

        const currentTime = Date.now();

        if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 20000) {
            const waitTime = Math.ceil((20000 - (currentTime - this.lastPlayed[senderID])) / 1000);
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
            const dice1 = randomInt(1, 7);
            const dice2 = randomInt(1, 7);
            const dice3 = randomInt(1, 7);
            const total = dice1 + dice2 + dice3;
            const result = total >= 11 ? "tài" : "xỉu";

            message = `🎲 Kết quả: ${dice1} + ${dice2} + ${dice3} = ${total} \nQK ra : ${result.toUpperCase()}\n`;

            const getDiceImagePath = (diceNumber) => path.join(__dirname, 'cache','images', 'dice', `dice${diceNumber}.png`);

            const diceImages = await Promise.all([getDiceImagePath(dice1), getDiceImagePath(dice2), getDiceImagePath(dice3)].map(imagePath => loadImage(imagePath)));

            const canvas = createCanvas(diceImages[0].width * 3, diceImages[0].height);
            const ctx = canvas.getContext('2d');

            diceImages.forEach((image, index) => {
                ctx.drawImage(image, index * image.width, 0);
            });

            const outputImagePath = path.join(__dirname, 'cache','images', 'dice', 'combined.png');
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
                const allUsers = Object.keys(readData().balance);
                const eligibleUsers = allUsers.filter(userId => getBalance(userId) > 0);

                if (eligibleUsers.length > 0) {
                    let quy = loadQuy();
                    const shareAmount = Math.floor(quy / eligibleUsers.length);

                    eligibleUsers.forEach(userId => {
                        updateBalance(userId, shareAmount);
                    });

                    message += `💸 Quỹ chung được chia đều cho tất cả người chơi có số dư, mỗi người nhận được ${formatNumber(shareAmount)} Xu.\n`;
                    saveQuy(0);
                }
            }

            const newBalance = getBalance(senderID);
            message += `💰 Số dư hiện tại của bạn: ${formatNumber(newBalance)} Xu.\n`;

            message += `💰 Quỹ hiện tại: ${loadQuy() ? formatNumber(Math.floor(loadQuy())) : 0} Xu.`;

            return api.sendMessage({
                body: message,
                attachment: combinedImage
            }, threadID, messageID);

        }, 5000);
    }
};
