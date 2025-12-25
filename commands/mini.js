const { getBalance, updateBalance } = require('../utils/currencies');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Đăng ký font chữ
registerFont('./fonts/BeVietnamPro-Bold.ttf', { family: 'BeVietnam Pro' });

// Hàm vẽ particle
function drawParticle(ctx, x, y, size, color) {
    const opacity = Math.random() * 0.5 + 0.3;
    ctx.fillStyle = `rgba(${color}, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// Hàm vẽ ngôi sao
function drawStar(ctx, x, y, size, color) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(
            x + size * Math.cos((i * 4 * Math.PI) / 5),
            y + size * Math.sin((i * 4 * Math.PI) / 5)
        );
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Hàm vẽ hiệu ứng ánh sáng
function drawGlow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${color}, 0.3)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Hàm tạo hiệu ứng Near Miss
function createNearMissEffect(currentNumber, targetNumber, range) {
    // Tạo số gần với số may mắn khi thua
    if (Math.random() < 0.7) { // 70% cơ hội tạo near miss
        const diff = Math.random() < 0.5 ? 1 : -1;
        return Math.max(1, Math.min(range, targetNumber + diff));
    }
    return currentNumber;
}

// Hàm tạo Near Miss cho Slot
function createSlotNearMiss(slots) {
    // 60% cơ hội tạo near miss cho slot
    if (Math.random() < 0.6) {
        // Tạo 2 symbol giống nhau
        const nearMissSymbol = slots[Math.floor(Math.random() * slots.length)];
        const position = Math.floor(Math.random() * 3);
        return Array(3).fill(nearMissSymbol).map((sym, i) => 
            i === position ? slots[Math.floor(Math.random() * slots.length)] : sym
        );
    }
    return null;
}

// Hàm tạo Near Miss cho Spin
function createSpinNearMiss(prizes, currentPrize) {
    // 65% cơ hội tạo near miss cho spin
    if (Math.random() < 0.65) {
        // Tìm phần thưởng có giá trị cao hơn một chút
        const betterPrizes = prizes.filter(p => 
            p.multiplier > currentPrize.multiplier && 
            p.multiplier <= currentPrize.multiplier + 0.5
        );
        if (betterPrizes.length > 0) {
            return betterPrizes[Math.floor(Math.random() * betterPrizes.length)];
        }
    }
    return currentPrize;
}

// Hàm tạo canvas cho Lucky Number
async function createLuckyNumberCanvas(guess, luckyNumber, isWin, reward = 0) {
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    // Vẽ background gradient phức tạp
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1a237e');
    gradient.addColorStop(0.5, '#0d47a1');
    gradient.addColorStop(1, '#01579b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Vẽ các ngôi sao nhấp nháy
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 400;
        const size = Math.random() * 2 + 1;
        drawStar(ctx, x, y, size, 'rgba(255, 255, 255, 0.8)');
    }

    // Vẽ hiệu ứng particle
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 400;
        const size = Math.random() * 3;
        drawParticle(ctx, x, y, size, '255, 255, 255');
    }

    // Vẽ khung trang trí
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 560, 360);

    // Vẽ các đường trang trí góc
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(corner => {
        ctx.beginPath();
        if (corner === 'top-left') {
            ctx.moveTo(40, 40);
            ctx.lineTo(20, 40);
            ctx.lineTo(20, 20);
            ctx.lineTo(40, 20);
        } else if (corner === 'top-right') {
            ctx.moveTo(560, 40);
            ctx.lineTo(580, 40);
            ctx.lineTo(580, 20);
            ctx.lineTo(560, 20);
        } else if (corner === 'bottom-left') {
            ctx.moveTo(40, 360);
            ctx.lineTo(20, 360);
            ctx.lineTo(20, 380);
            ctx.lineTo(40, 380);
        } else {
            ctx.moveTo(560, 360);
            ctx.lineTo(580, 360);
            ctx.lineTo(580, 380);
            ctx.lineTo(560, 380);
        }
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    // Vẽ tiêu đề với hiệu ứng
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px "BeVietnam Pro"';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🎲 LUCKY NUMBER 🎲', 300, 80);
    ctx.shadowBlur = 0;

    // Vẽ số may mắn với hiệu ứng glow
    ctx.font = 'bold 60px "BeVietnam Pro"';
    
    // Vẽ viền trắng cho số
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText(luckyNumber.toString(), 300, 180);
    
    // Vẽ số với màu chính
    ctx.fillStyle = isWin ? '#4caf50' : '#f44336';
    ctx.fillText(luckyNumber.toString(), 300, 180);
    
    // Thêm viền sáng mỏng
    ctx.strokeStyle = isWin ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(luckyNumber.toString(), 300, 180);

    // Vẽ số dự đoán với hiệu ứng
    ctx.font = 'bold 35px "BeVietnam Pro"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Số của bạn: ${guess}`, 300, 250);

    // Vẽ kết quả với hiệu ứng
    ctx.font = 'bold 40px "BeVietnam Pro"';
    if (isWin) {
        drawGlow(ctx, 300, 320, 80, '76, 175, 80');
        ctx.fillStyle = '#4caf50';
        ctx.fillText('🎉 CHIẾN THẮNG! 🎉', 300, 320);
        
        ctx.font = 'bold 35px "BeVietnam Pro"';
        const gradient = ctx.createLinearGradient(200, 350, 400, 380);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(1, '#ff9100');
        ctx.fillStyle = gradient;
        ctx.fillText(`+${reward.toLocaleString()}$`, 300, 360);
    } else {
        drawGlow(ctx, 300, 320, 80, '244, 67, 54');
        ctx.fillStyle = '#f44336';
        ctx.fillText('💔 THUA CUỘC!', 300, 320);
    }

    return canvas;
}

// Hàm tạo canvas cho Slot Machine
async function createSlotCanvas(symbols, reward = 0, multiplier = 0) {
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    // Vẽ background với gradient phức tạp
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#311b92');
    gradient.addColorStop(0.5, '#4a148c');
    gradient.addColorStop(1, '#6a1b9a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Vẽ các particle
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 400;
        const size = Math.random() * 2 + 1;
        drawParticle(ctx, x, y, size, '255, 255, 255');
    }

    // Vẽ khung máy slot
    const machineGradient = ctx.createLinearGradient(100, 120, 500, 240);
    machineGradient.addColorStop(0, '#424242');
    machineGradient.addColorStop(1, '#212121');
    ctx.fillStyle = machineGradient;
    
    // Vẽ khung máy với bo góc
    const radius = 20;
    ctx.beginPath();
    ctx.moveTo(100 + radius, 120);
    ctx.lineTo(500 - radius, 120);
    ctx.quadraticCurveTo(500, 120, 500, 120 + radius);
    ctx.lineTo(500, 240 - radius);
    ctx.quadraticCurveTo(500, 240, 500 - radius, 240);
    ctx.lineTo(100 + radius, 240);
    ctx.quadraticCurveTo(100, 240, 100, 240 - radius);
    ctx.lineTo(100, 120 + radius);
    ctx.quadraticCurveTo(100, 120, 100 + radius, 120);
    ctx.fill();

    // Vẽ các ô slot với hiệu ứng 3D
    const slotWidth = 90;
    const spacing = (300 - (slotWidth * 3)) / 2;
    const startX = 150 + spacing;
    const startY = 140;
    
    symbols.forEach((symbol, index) => {
        // Vẽ khung slot với gradient
        const slotGradient = ctx.createLinearGradient(
            startX + (index * (slotWidth + spacing/2)),
            startY,
            startX + (index * (slotWidth + spacing/2)),
            startY + 80
        );
        slotGradient.addColorStop(0, '#616161');
        slotGradient.addColorStop(1, '#424242');
        ctx.fillStyle = slotGradient;

        // Vẽ khung với bo góc
        ctx.beginPath();
        ctx.roundRect(
            startX + (index * (slotWidth + spacing/2)), 
            startY, 
            slotWidth, 
            80, 
            10
        );
        ctx.fill();

        // Vẽ biểu tượng với đổ bóng
        ctx.font = '50px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fillText(
            symbol, 
            startX + (index * (slotWidth + spacing/2)) + slotWidth/2, 
            startY + 55
        );
        ctx.shadowBlur = 0;
    });

    // Vẽ tiêu đề với hiệu ứng
    ctx.font = 'bold 45px "BeVietnam Pro"';
    const titleGradient = ctx.createLinearGradient(200, 40, 400, 80);
    titleGradient.addColorStop(0, '#ffd700');
    titleGradient.addColorStop(1, '#ff9100');
    ctx.fillStyle = titleGradient;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🎰 SLOT MACHINE 🎰', 300, 80);
    ctx.shadowBlur = 0;

    // Vẽ kết quả với hiệu ứng
    if (reward > 0) {
        drawGlow(ctx, 300, 300, 80, '76, 175, 80');
        ctx.font = 'bold 40px "BeVietnam Pro"';
        ctx.fillStyle = '#4caf50';
        ctx.fillText('🎉 CHIẾN THẮNG! 🎉', 300, 300);

        const rewardGradient = ctx.createLinearGradient(200, 330, 400, 360);
        rewardGradient.addColorStop(0, '#ffd700');
        rewardGradient.addColorStop(1, '#ff9100');
        ctx.fillStyle = rewardGradient;
        ctx.font = 'bold 35px "BeVietnam Pro"';
        ctx.fillText(`+${reward.toLocaleString()}$ (x${multiplier})`, 300, 340);
    } else {
        drawGlow(ctx, 300, 300, 80, '244, 67, 54');
        ctx.font = 'bold 40px "BeVietnam Pro"';
        ctx.fillStyle = '#f44336';
        ctx.fillText('💔 THUA CUỘC!', 300, 300);
    }

    return canvas;
}

// Hàm tạo canvas cho Lucky Spin
async function createSpinCanvas(result, reward = 0) {
    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    // Vẽ background với gradient phức tạp
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#006064');
    gradient.addColorStop(0.5, '#00838f');
    gradient.addColorStop(1, '#0097a7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Vẽ các particle
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 400;
        const size = Math.random() * 2 + 1;
        drawParticle(ctx, x, y, size, '255, 255, 255');
    }

    // Vẽ vòng quay với hiệu ứng 3D
    ctx.save();
    ctx.translate(300, 200);
    
    // Vẽ vòng ngoài
    const segments = 8;
    const angleStep = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 100, i * angleStep, (i + 1) * angleStep);
        
        // Gradient cho từng phần
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
        gradient.addColorStop(0, `hsl(${i * 45}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${i * 45}, 70%, 40%)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Viền phân chia
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Vẽ vòng trong
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
    centerGradient.addColorStop(0, '#ffd700');
    centerGradient.addColorStop(1, '#ff9100');
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vẽ kết quả ở giữa vòng tròn
    ctx.font = '35px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result.emoji, 0, 0);

    ctx.restore();

    // Vẽ tiêu đề với hiệu ứng
    ctx.font = 'bold 45px "BeVietnam Pro"';
    const titleGradient = ctx.createLinearGradient(200, 40, 400, 80);
    titleGradient.addColorStop(0, '#ffd700');
    titleGradient.addColorStop(1, '#ff9100');
    ctx.fillStyle = titleGradient;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🎡 LUCKY SPIN 🎡', 300, 50);
    ctx.shadowBlur = 0;

    // Vẽ tên phần thưởng
    ctx.font = 'bold 28px "BeVietnam Pro"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(result.name, 300, 280);

    // Vẽ kết quả thắng thua
    if (reward > 0) {
        // Tạo hiệu ứng glow mạnh hơn cho chiến thắng
        ctx.shadowColor = 'rgba(76, 175, 80, 0.8)';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 42px "BeVietnam Pro"';
        
        // Vẽ viền text
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 4;
        ctx.strokeText('🎉 CHIẾN THẮNG! 🎉', 300, 350);
        
        // Vẽ text với gradient
        const winGradient = ctx.createLinearGradient(200, 330, 400, 370);
        winGradient.addColorStop(0, '#4caf50');
        winGradient.addColorStop(1, '#81c784');
        ctx.fillStyle = winGradient;
        ctx.fillText('🎉 CHIẾN THẮNG! 🎉', 300, 350);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Vẽ phần thưởng với hiệu ứng nổi bật
        const rewardGradient = ctx.createLinearGradient(200, 380, 400, 390);
        rewardGradient.addColorStop(0, '#ffd700');
        rewardGradient.addColorStop(1, '#ff9100');
        ctx.fillStyle = rewardGradient;
        ctx.font = 'bold 38px "BeVietnam Pro"';
        ctx.strokeStyle = '#b7791f';
        ctx.lineWidth = 3;
        ctx.strokeText(`+${reward.toLocaleString()}$ (x${result.multiplier})`, 300, 385);
        ctx.fillText(`+${reward.toLocaleString()}$ (x${result.multiplier})`, 300, 385);
    } else {
        // Tạo hiệu ứng glow mạnh hơn cho thua cuộc
        ctx.shadowColor = 'rgba(244, 67, 54, 0.8)';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 42px "BeVietnam Pro"';
        
        // Vẽ viền text
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 4;
        ctx.strokeText('💔 THUA CUỘC!', 300, 350);
        
        // Vẽ text với gradient
        const loseGradient = ctx.createLinearGradient(200, 330, 400, 370);
        loseGradient.addColorStop(0, '#f44336');
        loseGradient.addColorStop(1, '#e57373');
        ctx.fillStyle = loseGradient;
        ctx.fillText('💔 THUA CUỘC!', 300, 350);
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }

    return canvas;
}

module.exports = {
    name: "mini",
    dev: "HNT",
    category: "Games",
    info: "Các trò chơi may mắn",
    usage: ".mini [lucky/slot/spin] [số tiền]",
    onPrefix: true,
    cooldowns: 15,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎮 MINIGAME CASINO 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1.mini lucky [số tiền] [số dự đoán] - Đoán số may mắn từ 1-15\n" +
                "2.mini slot [số tiền] - Chơi Slot Machine\n" +
                "3.mini spin [số tiền] - Vòng quay may mắn\n\n" +
                "💰 Tỷ lệ thắng:\n" +
                "• Lucky Number: x3 nếu đoán đúng\n" +
                "• Slot Machine: x1.5-x3 tùy combo\n" +
                "• Lucky Spin: x1.2-x2 tùy ô\n\n" +
                "⚠️ Lưu ý: Mỗi lượt chơi cần 15 giây cooldown",
                threadID, messageID
            );
        }

        const game = target[0].toLowerCase();
        const bet = parseInt(target[1]);
        const userBalance = await getBalance(senderID);

        if (!bet || bet < 1000 || bet > 50000000) {
            return api.sendMessage(
                "❌ Số tiền cược không hợp lệ!\n" +
                "💰 Tối thiểu: 1,000$\n" +
                "💰 Tối đa: 50,000,000$",
                threadID, messageID
            );
        }

        if (bet > userBalance) {
            return api.sendMessage(
                "❌ Bạn không đủ tiền để chơi!\n" +
                `💰 Số dư: ${userBalance}$\n` +
                `💸 Còn thiếu: ${bet - userBalance}$`,
                threadID, messageID
            );
        }

        switch (game) {
            case "lucky":
                const guess = parseInt(target[2]);
                if (!guess || guess < 1 || guess > 15) {
                    return api.sendMessage(
                        "❌ Vui lòng chọn số từ 1 đến 15!",
                        threadID, messageID
                    );
                }

                const luckyNumber = Math.floor(Math.random() * 15) + 1;
                await updateBalance(senderID, -bet);

                const isWin = guess === luckyNumber;
                const reward = isWin ? bet * 3 : 0;
                
                // Áp dụng Near Miss Effect khi thua
                const displayNumber = !isWin ? createNearMissEffect(luckyNumber, guess, 15) : luckyNumber;
                
                if (reward > 0) await updateBalance(senderID, reward);

                const luckyCanvas = await createLuckyNumberCanvas(guess, displayNumber, isWin, reward);
                const luckyBuffer = luckyCanvas.toBuffer('image/png');
                fs.writeFileSync('../database/cache/lucky.png', luckyBuffer);

                api.sendMessage(
                    {
                        body: isWin 
                            ? `🎉 CHÚC MỪNG! BẠN ĐÃ THẮNG!\n💵 Số dư mới: ${await getBalance(senderID)}$`
                            : `💔 TIẾC QUÁ, BẠN ĐÃ THUA!\n💵 Số dư mới: ${await getBalance(senderID)}$`,
                        attachment: fs.createReadStream('../database/cache/lucky.png')
                    },
                    threadID, messageID
                );
                break;

            case "slot":
                await updateBalance(senderID, -bet);
                const slots = ["🍎", "🍊", "🍇", "🍓", "7️⃣", "🍒", "🎰", "💫", "🎲", "🎮"];
                let spins = [
                    slots[Math.floor(Math.random() * slots.length)],
                    slots[Math.floor(Math.random() * slots.length)],
                    slots[Math.floor(Math.random() * slots.length)]
                ];

                let multiplier = 0;
                let slotReward = 0;

                if (spins[0] === spins[1] && spins[1] === spins[2]) {
                    if (spins[0] === "7️⃣") {
                        multiplier = 3;
                    } else {
                        multiplier = 2;
                    }
                } else if (spins[0] === spins[1] || spins[1] === spins[2] || spins[0] === spins[2]) {
                    multiplier = 1.5;
                }

                if (multiplier === 0) {
                    const nearMissSpins = createSlotNearMiss(slots);
                    if (nearMissSpins) spins = nearMissSpins;
                }

                slotReward = Math.floor(bet * multiplier);
                if (slotReward > 0) await updateBalance(senderID, slotReward);

                const slotCanvas = await createSlotCanvas(spins, slotReward, multiplier);
                const slotBuffer = slotCanvas.toBuffer('image/png');
                fs.writeFileSync('../database/cache/slot.png', slotBuffer);

                api.sendMessage(
                    {
                        body: `💵 Số dư mới: ${await getBalance(senderID)}$`,
                        attachment: fs.createReadStream('../database/cache/slot.png')
                    },
                    threadID, messageID
                );
                break;

            case "spin":
                await updateBalance(senderID, -bet);
                const prizes = [
                    { emoji: "💎", multiplier: 2, name: "Kim cương", weight: 5 },
                    { emoji: "🎁", multiplier: 1.8, name: "Quà VIP", weight: 10 },
                    { emoji: "💰", multiplier: 1.5, name: "Túi tiền", weight: 15 },
                    { emoji: "🎲", multiplier: 1.3, name: "May mắn", weight: 20 },
                    { emoji: "🎮", multiplier: 1.2, name: "Game", weight: 25 },
                    { emoji: "📦", multiplier: 1.1, name: "Hộp quà", weight: 30 },
                    { emoji: "❌", multiplier: 0, name: "Trượt", weight: 45 }
                ];

                const weightedPrizes = prizes.flatMap(prize => 
                    Array(prize.weight).fill(prize)
                );
                
                const spin = weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];
                const spinReward = Math.floor(bet * spin.multiplier);

                if (spinReward > 0) await updateBalance(senderID, spinReward);

                const spinCanvas = await createSpinCanvas(spin, spinReward);
                const spinBuffer = spinCanvas.toBuffer('image/png');
                fs.writeFileSync('../database/cache/spin.png', spinBuffer);

                api.sendMessage(
                    {
                        body: `💵 Số dư mới: ${await getBalance(senderID)}$`,
                        attachment: fs.createReadStream('../database/cache/spin.png')
                    },
                    threadID, messageID
                );
                break;

            default:
                api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID, messageID);
                break;
        }
        
        setTimeout(() => {
            try {
                fs.unlinkSync('../database/cache/lucky.png');
                fs.unlinkSync('../database/cache/slot.png');
                fs.unlinkSync('../database/cache/spin.png');
            } catch (err) {}
        }, 5000);
    }
}; 