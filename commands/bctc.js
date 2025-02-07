const { randomInt } = require("crypto");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "bctc",
    dev: "HNT",
    usedby: 0,
    info: "Chơi Bầu Cua.",
    onPrefix: true,
    usages: ".bctc",
    cooldowns: 0,

    lastPlayed: {},

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        const cacheDir = path.join(__dirname, './cache/bctc');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const currentTime = Date.now();

        if (target.length < 2) {
            return api.sendMessage(
                "BẦU CUA TÔM CÁ \n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn cách chơi:\ngõ .bctc <bầu/cua/tôm/cá/mèo/nai> <số tiền> hoặc\n.bctc <bầu/cua/tôm/cá/mèo/nai> allin \n\nallin là cược toàn bộ.",
                threadID, messageID
            );
        }

        const choice = target[0].toLowerCase();
        const validChoices = ["bầu", "cua", "tôm", "cá", "mèo", "nai"];

        if (!validChoices.includes(choice)) {
            return api.sendMessage(
                "Lựa chọn không hợp lệ! Vui lòng chọn một trong các lựa chọn: 'bầu', 'cua', 'tôm', 'cá', 'mèo', 'nai'.",
                threadID, messageID
            );
        }

        const balance = getBalance(senderID);

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

        if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 50000) {
            const waitTime = Math.ceil((50000 - (currentTime - this.lastPlayed[senderID])) / 1000);
            return api.sendMessage(`Vui lòng đợi ${waitTime} giây nữa để chơi lại!`, threadID, messageID);
        }
        this.lastPlayed[senderID] = currentTime;

        updateBalance(senderID, -betAmount);
  
        updateQuestProgress(senderID, "play_games", 1);

        let message = `Đang lắc... Đợi ${5} giây...`;

        const sentMessage = await api.sendMessage(message, threadID, messageID);

        setTimeout(async () => {
            try {
                const animals = ["bầu", "cua", "tôm", "cá", "mèo", "nai"];
                const slotResults = [
                    animals[randomInt(0, animals.length)],
                    animals[randomInt(0, animals.length)],
                    animals[randomInt(0, animals.length)]
                ];

                const choiceCount = slotResults.filter(result => result === choice).length;

                let resultMessage = `Kết quả: ${slotResults.join(' - ').toUpperCase()}\n`;

                let multiplier = 0;
                let result = "thua";

                if (choiceCount === 1) {
                    multiplier = 1.95;
                } else if (choiceCount === 2) {
                    multiplier = 3.95;
                } else if (choiceCount === 3) {
                    multiplier = 6;
                }

                if (multiplier > 0) {
                    result = "thắng";
                    const winnings = betAmount * multiplier;
                    updateBalance(senderID, winnings);
            
                    updateQuestProgress(senderID, "win_bctc", 1);
                    updateQuestProgress(senderID, "win_games", 1);
                    resultMessage += `🎉 Chúc mừng! Bạn thắng và nhận được ${formatNumber(winnings)} Xu.\n`;
                } else {
                    resultMessage += `😢 Bạn đã thua và mất ${formatNumber(betAmount)} Xu.\n`;
                }

                const newBalance = getBalance(senderID);
                resultMessage += `💰 Số dư hiện tại của bạn: ${formatNumber(newBalance)} Xu.`;

                try {
                    const imgUrls = {
                        "bầu": "https://imgur.com/VU99RtL.png",
                        "cua": "https://imgur.com/zBfgdVh.png",
                        "tôm": "https://imgur.com/U7gRpO2.png",
                        "cá": "https://imgur.com/QonsfX4.png",
                        "mèo": "https://ibb.co/0ySyNm37.png",
                        "nai": "https://imgur.com/fgy6eFJ.png"
                    };

                    const slotImages = await Promise.all(
                        slotResults.map(animal => 
                            loadImage(imgUrls[animal]).catch(err => {
                                console.error(`Failed to load image for ${animal}:`, err);
                                return null;
                            })
                        )
                    );

                    if (slotImages.every(img => img !== null)) {
                        const canvas = createCanvas(slotImages[0].width * 3, slotImages[0].height);
                        const ctx = canvas.getContext('2d');

                        slotImages.forEach((image, index) => {
                            ctx.drawImage(image, index * image.width, 0);
                        });

                        const outputImagePath = path.join(cacheDir, 'combined.png');
                        const buffer = canvas.toBuffer('image/png');
                        fs.writeFileSync(outputImagePath, buffer);

                        const combinedImage = fs.createReadStream(outputImagePath);

                        api.unsendMessage(sentMessage.messageID);
                        return api.sendMessage({
                            body: resultMessage,
                            attachment: combinedImage
                        }, threadID, messageID);
                    } else {
                        throw new Error('Some images failed to load');
                    }
                } catch (imageError) {
                    console.error('Image processing failed:', imageError);
            
                    api.unsendMessage(sentMessage.messageID);
                    return api.sendMessage(resultMessage, threadID, messageID);
                }

            } catch (error) {
                console.error('Game error:', error);
                api.unsendMessage(sentMessage.messageID);
                return api.sendMessage("❌ Đã xảy ra lỗi trong quá trình xử lý trò chơi!", threadID, messageID);
            }
        }, 5000);
    }
};