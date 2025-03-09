const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const gameLogic = require('../utils/gameLogic');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "bctc",
    dev: "HNT",
    category: "Games",
    info: "Chơi Bầu Cua Tôm Cá",
    onPrefix: true,
    usages: "bctc [bầu/cua/tôm/cá/gà/nai] [số tiền/allin]",
    cooldowns: 0,
    lastPlayed: {},

    CHOICES: ['bầu', 'cua', 'tôm', 'cá', 'gà', 'nai'],
    EMOJIS: {
        'bầu': '🍐',
        'cua': '🦀',
        'tôm': '🦐',
        'cá': '🐟',
        'gà': '🐔',
        'nai': '🦌'
    },

    formatGameBoard(bets = {}, results = [], winAmount = 0, totalBet = 0) {
        let display = "🎮 BẦU CUA TÔM CÁ 🎮\n";
        display += "━━━━━━━━━━━━━━━━━━\n\n";

        display += "💰 BẢNG CƯỢC\n";
        
        const betEntries = Object.entries(bets);
        if (betEntries.length > 0) {
            betEntries.forEach(([choice, amount]) => {
                const emoji = this.EMOJIS[choice];
                display += `${emoji} ${choice}: ${formatNumber(amount)} $\n`;
            });
        } else {
            display += "Chưa đặt cược\n";
        }

        if (totalBet > 0) {
            display += "\n📊 KẾT QUẢ\n";
            display += `💵 Tổng cược: ${formatNumber(totalBet)} $\n`;
            
            if (results.length > 0) {
                if (winAmount > 0) {
                    const profit = winAmount - totalBet;
                    display += `🏆 Thắng: ${formatNumber(winAmount)} $\n`;
                    display += `📈 Lợi nhuận: ${formatNumber(profit)} $\n`;
                } else {
                    display += `📉 Thua: ${formatNumber(totalBet)} $\n`;
                }
            }
        }

        return display;
    },

    generateResults(senderID, bets, isAllIn = false) {
        const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
        let winChance = gameLogic.calculateWinChance(senderID, {
            betAmount: totalBet,
            gameType: 'baucua',
            isAllIn: isAllIn 
        });

        if (isAllIn) winChance *= 0.5;
        if (totalBet > 100000) winChance *= 0.2;
        if (totalBet > 50000) winChance *= 0.4;

        let results = [];
        const allChoices = [...this.CHOICES];
        const playerChoices = Object.keys(bets);
        const shouldWin = Math.random() < winChance;

        if (shouldWin) {
            const winCount = Math.random() < 0.7 ? 1 : 2;
            const selectedWinChoices = [];
            
            for (let i = 0; i < winCount; i++) {
                if (playerChoices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * playerChoices.length);
                    selectedWinChoices.push(playerChoices[randomIndex]);
                    playerChoices.splice(randomIndex, 1);
                }
            }
            
            results.push(...selectedWinChoices);
            
            while (results.length < 3) {
                const remainingChoices = allChoices.filter(c => !results.includes(c));
                const randomChoice = remainingChoices[Math.floor(Math.random() * remainingChoices.length)];
                results.push(randomChoice);
            }
        } else {
            const losingChoices = allChoices.filter(c => !playerChoices.includes(c));
            
            for (let i = 0; i < 3; i++) {
                if (losingChoices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * losingChoices.length);
                    results.push(losingChoices.splice(randomIndex, 1)[0]);
                } else {
                    const randomIndex = Math.floor(Math.random() * allChoices.length);
                    results.push(allChoices[randomIndex]);
                }
            }
        }

        return results;
    },

    calculateWinnings(bets, results) {
        let totalWin = 0;
        let multiplier = 1.95;

        const resultCounts = results.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        Object.entries(bets).forEach(([choice, amount]) => {
            if (resultCounts[choice]) {
                if (amount > 50000) multiplier = 1.8;
                if (amount > 100000) multiplier = 1.7;
                totalWin += amount * resultCounts[choice] * multiplier;
            }
        });

        return Math.floor(totalWin);
    },async createResultImage(results) {
        try {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const sourceImageUrl = "https://i.imgur.com/ecUhWOE.png";
            
            const localImagePath = path.join(__dirname, 'bctc', 'baucua.png');
            
            const outputIconSize = 300; 
            const resultWidth = outputIconSize * 3;
            const resultHeight = outputIconSize;
            
            const canvas = createCanvas(resultWidth, resultHeight);
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, resultWidth, resultHeight);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, resultWidth, resultHeight);
        
            let sourceImage;
            try {
                if (fs.existsSync(localImagePath)) {
                    console.log("Thử tải ảnh từ local path:", localImagePath);
                    sourceImage = await loadImage(localImagePath);
                    console.log("Đã tải thành công ảnh local");
                } else {
                    console.log("Local image not found, trying Imgur");
                    sourceImage = await Promise.race([
                        loadImage(sourceImageUrl),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Image loading timeout')), 5000)
                        )
                    ]);
                    console.log("Đã tải thành công ảnh Imgur");
                }
            } catch (imgError) {
                console.error("Error loading image:", imgError);
                sourceImage = null;
            }
            
            if (sourceImage) {
                const imgWidth = sourceImage.width;
                const imgHeight = sourceImage.height;
                console.log(`Kích thước ảnh thực tế: ${imgWidth}x${imgHeight}`);
                
                const iconWidth = Math.floor(imgWidth / 3);
                const iconHeight = Math.floor(imgHeight / 2);
                
                const imageMap = {
                    'nai': { x: 0, y: 0, width: iconWidth, height: iconHeight },
                    'bầu': { x: iconWidth, y: 0, width: iconWidth, height: iconHeight },
                    'gà': { x: iconWidth * 2, y: 0, width: iconWidth, height: iconHeight },
                    'cá': { x: 0, y: iconHeight, width: iconWidth, height: iconHeight },
                    'cua': { x: iconWidth, y: iconHeight, width: iconWidth, height: iconHeight },
                    'tôm': { x: iconWidth * 2, y: iconHeight, width: iconWidth, height: iconHeight }
                };
                
                for (let i = 0; i < results.length; i++) {
                    const animal = results[i];
                    const pos = imageMap[animal];
                    
                    if (pos) {
                        console.log(`Cắt ${animal} từ: x=${pos.x}, y=${pos.y}, w=${pos.width}, h=${pos.height}`);
                        
                        ctx.drawImage(
                            sourceImage,
                            pos.x, pos.y, pos.width, pos.height,  
                            i * outputIconSize, 0, outputIconSize, outputIconSize 
                        );
                    
                        ctx.strokeRect(i * outputIconSize, 0, outputIconSize, outputIconSize);
                    }
                }
            } else {
                ctx.font = '150px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                for (let i = 0; i < results.length; i++) {
                    const animal = results[i];
                    const emoji = this.EMOJIS[animal] || '❓';
                    const x = i * outputIconSize + outputIconSize / 2;
                    const y = resultHeight / 2;
                    
                    ctx.fillText(emoji, x, y);
                    ctx.strokeRect(i * outputIconSize, 0, outputIconSize, outputIconSize);
                }
            }
            
            const outputPath = path.join(tempDir, `baucua_${Date.now()}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            
            const stream = fs.createReadStream(outputPath);
            stream.on('end', () => fs.unlink(outputPath, err => err && console.error('Cleanup error:', err)));
            
            return stream;
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    },

    async onLaunch({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const balance = getBalance(senderID);

        if (target.length < 2) {
            return api.sendMessage(
                "🎮 𝐁𝐀̂̀𝐔 𝐂𝐔𝐀 𝐓𝐎̂𝐌 𝐂𝐀́ 🎮\n" +
                "┏━━━━━━━━━━━━━━━┓\n" +
                "┃     HƯỚNG DẪN CHƠI     ┃\n" +
                "┗━━━━━━━━━━━━━━━┛\n\n" +
                "📝 Cách đặt cược:\n" +
                ".bctc [lựa chọn] [số tiền/allin]\n\n" +
                "📋 Ví dụ:\n" +
                "• .bctc bầu 50000\n" +
                "• .bctc bầu 50000 cua 50000\n" +
                "• .bctc nai allin\n\n" +
                "🎲 Các lựa chọn:\n" +
                Object.entries(this.EMOJIS).map(([k, v]) => `${v} ${k}`).join(" | ") + "\n\n" +
                "💰 Số dư: " + formatNumber(balance) + " $",
                threadID, messageID
            );
        }

        
        const bets = {};
        let totalBet = 0;
        let isAllIn = false;
        
        for (let i = 0; i < target.length; i += 2) {
            const choice = target[i].toLowerCase();
            let amount;

            if (target[i + 1]?.toLowerCase() === 'allin') {
                isAllIn = true;
                amount = balance;
            } else {
                amount = parseInt(target[i + 1]);
            }

            if (!this.CHOICES.includes(choice)) {
                return api.sendMessage(`❌ Lựa chọn '${choice}' không hợp lệ.`, threadID, messageID);
            }

            if (isNaN(amount) || amount < 100) {
                return api.sendMessage("❌ Số tiền cược tối thiểu là 100 $.", threadID, messageID);
            }

            if (isAllIn && i > 0) {
                return api.sendMessage("❌ Không thể kết hợp allin với cược khác.", threadID, messageID);
            }

            bets[choice] = (bets[choice] || 0) + amount;
            totalBet += amount;
        }

        if (totalBet > balance) {
            return api.sendMessage("❌ Số dư không đủ.", threadID, messageID);
        }

        const currentTime = Date.now();
        if (this.lastPlayed[senderID] && currentTime - this.lastPlayed[senderID] < 20000) {
            return api.sendMessage(
                `⏳ Vui lòng đợi ${Math.ceil((20000 - (currentTime - this.lastPlayed[senderID])) / 1000)} giây nữa.`,
                threadID, messageID
            );
        }
        this.lastPlayed[senderID] = currentTime;

        updateBalance(senderID, -totalBet);

        
        api.sendMessage(
            "🎲 BẦU CUA TÔM CÁ 🎲\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "⏳ ĐANG LẮC XÚC XẮC...\n\n" + 
            this.formatGameBoard(bets), 
            threadID, 
            messageID
        );

        setTimeout(async () => {
            try {
                const results = this.generateResults(senderID, bets, isAllIn);
                const winAmount = this.calculateWinnings(bets, results);
                
                const feeRate = gameLogic.calculateFeeRate(winAmount);
                const fee = Math.ceil(winAmount * feeRate);
                const finalReward = winAmount - fee;

                if (finalReward > 0) {
                    updateBalance(senderID, finalReward);
                }

                gameLogic.updatePlayerStats(senderID, {
                    won: finalReward > totalBet,
                    betAmount: totalBet,
                    winAmount: finalReward,
                    gameType: 'baucua'
                });

                const message = this.formatGameBoard(bets, results, finalReward, totalBet) +
                              "\n━━━━━━━━━━━━━━━━━━\n" +
                              (finalReward > 0 ? `📌 Phí: ${formatNumber(fee)} $\n` : '') +
                              `💰 Số dư: ${formatNumber(getBalance(senderID))} $`;

                updateQuestProgress(senderID, "play_games");
                if (finalReward > totalBet) {
                    updateQuestProgress(senderID, "win_games");
                    updateQuestProgress(senderID, "win_bctc");
                }

                try {
                    const imageBuffer = await this.createResultImage(results);
                    await api.sendMessage({
                        body: message,
                        attachment: imageBuffer
                    }, threadID, messageID);
                } catch (imageError) {
                    console.error("Error generating image:", imageError);
                    await api.sendMessage(message, threadID, messageID);
                }

            } catch (error) {
                console.error('Game processing error:', error);
                updateBalance(senderID, totalBet);
                await api.sendMessage(
                    "❌ LỖI HỆ THỐNG ❌\n" +
                    "┏━━━━━━━━━━━━━━━┓\n" +
                    "┃   Đã hoàn trả tiền cược  ┃\n" +
                    "┗━━━━━━━━━━━━━━━┛", 
                    threadID, 
                    messageID
                );
            }
        }, 5000);
    }
};
