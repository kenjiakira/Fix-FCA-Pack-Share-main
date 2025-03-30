const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
Canvas.registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnam' });

const cardCache = new Map();

async function createBaicaoCanvas(gameState, results = null) {
    let canvasHeight = 800;
    if (results && results.length > 5) {
        canvasHeight += (results.length - 5) * 70;
    }

    const canvas = Canvas.createCanvas(1200, canvasHeight);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawDecorations(ctx, canvas.width, canvas.height);

    if (results) {
        await drawGameResults(ctx, canvas, results, gameState.betAmount);
    } else {
        await drawGameState(ctx, canvas, gameState);
    }

    return canvas.toBuffer();
}

function drawDecorations(ctx, width, height) {

    ctx.globalAlpha = 0.05;
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    ctx.font = '180px Arial';
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 10; i++) {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillText(suit, x, y);
    }

    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, 0, width, 80);

    ctx.font = '40px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('BÀI CÀO', width / 2, 55);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 80);
    ctx.lineTo(10, height - 10);
    ctx.lineTo(width - 10, height - 10);
    ctx.lineTo(width - 10, 80);
    ctx.lineTo(10, 80);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(width, 80);
    ctx.stroke();
}

async function drawGameState(ctx, canvas, gameState) {
    const { players, betAmount, roundCount, state } = gameState;
    const width = canvas.width;
    const height = canvas.height;

    drawGameInfo(ctx, width, betAmount, roundCount, players.size);

    const maxPlayers = 8;
    const playerSlots = Array.from({ length: maxPlayers }, (_, i) => {
        if (i < 4) {

            return {
                x: width * (0.2 + (i * 0.2)),
                y: height * 0.3,
                width: width * 0.15,
                height: height * 0.28
            };
        } else {
            return {
                x: width * (0.2 + ((i - 4) * 0.2)),
                y: height * 0.65,
                width: width * 0.15,
                height: height * 0.28
            };
        }
    });

    let slotIndex = 0;
    for (const [playerId, player] of players.entries()) {
        if (slotIndex < maxPlayers) {
            const slot = playerSlots[slotIndex++];
            await drawPlayerSlot(ctx, slot, player, playerId, state === "playing" && !player.isAI);
        }
    }

    ctx.font = '32px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    let statusText = '';

    if (state === 'waiting') {
        statusText = '⏳ ĐANG CHỜ NGƯỜI CHƠI';
    } else if (state === 'playing') {
        statusText = '🎮 ĐANG CHƠI';
    } else if (state === 'waiting_next') {
        statusText = '⏳ ĐANG CHỜ VÒNG MỚI';
    } else if (state === 'ended') {
        statusText = '🏁 VÒNG KẾT THÚC';
    }

    ctx.fillText(statusText, width / 2, height - 30);
}

function drawGameInfo(ctx, width, betAmount, roundCount, playerCount) {

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 100, width - 40, 60);

    ctx.font = '24px "BeVietnam Medium"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    const formattedBet = betAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    ctx.fillText(`💰 Cược: ${formattedBet}$`, 40, 140);
    ctx.fillText(`📌 Vòng: ${roundCount}`, width / 2 - 100, 140);
    ctx.fillText(`👥 Người chơi: ${playerCount}/8`, width - 250, 140);
}

async function drawPlayerSlot(ctx, slot, player, playerId, showCards) {
    const { x, y, width, height } = slot;

    ctx.fillStyle = 'rgba(30, 30, 60, 0.7)';
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = player.isAI ? '#ff9900' : '#4ecca3';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.font = '18px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const displayName = player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name;
    ctx.fillText(displayName, x + width / 2, y + 25);

    let statusText = '';
    let statusColor = '';

    if (player.ready) {
        statusText = '✓ Đã sẵn sàng';
        statusColor = '#4ecca3';
    } else if (player.hasChanged) {
        statusText = '🔄 Đã đổi bài';
        statusColor = '#ff9900';
    } else {
        statusText = '⏳ Đang chơi';
        statusColor = '#e94560';
    }

    ctx.font = '16px "BeVietnam"';
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, x + width / 2, y + height - 15);

    if (player.cards && player.cards.length > 0) {
        const cardWidth = width * 0.28;
        const cardHeight = height * 0.6;
        const startX = x + (width - (cardWidth * 3 + 10)) / 2;

        for (let i = 0; i < player.cards.length; i++) {
            const cardX = startX + (i * (cardWidth + 5));
            const cardY = y + 35;

            if (showCards) {
                await drawCard(ctx, cardX, cardY, cardWidth, cardHeight, player.cards[i]);
            } else {
                drawCardBack(ctx, cardX, cardY, cardWidth, cardHeight);
            }
        }

        if (showCards && typeof player.point !== 'undefined') {
            ctx.font = '24px "BeVietnam Bold"';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`Điểm: ${player.point}`, x + width / 2, y + height - 40);
        }
    } else {
        ctx.font = '20px "BeVietnam"';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('Chưa có bài', x + width / 2, y + height / 2);
    }
}

async function drawCard(ctx, x, y, width, height, card) {
    const { rank, suit } = card;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.stroke();

    ctx.fillStyle = suit === '♥️' || suit === '♦️' ? '#e94560' : '#000000';

    const rankFontSize = Math.max(12, Math.min(width * 0.35, height * 0.2));
    const suitFontSize = Math.max(14, Math.min(width * 0.5, height * 0.3));

    ctx.font = `${rankFontSize}px "BeVietnam Bold"`;
    ctx.textAlign = 'center';
    ctx.fillText(rank, x + width * 0.22, y + height * 0.25);

    ctx.font = `${suitFontSize}px Arial`;
    ctx.fillText(suit.replace('️', ''), x + width / 2, y + height * 0.58);

    ctx.save();
    ctx.translate(x + width * 0.78, y + height * 0.70);
    ctx.rotate(Math.PI);
    ctx.font = `${rankFontSize}px "BeVietnam Bold"`;
    ctx.fillText(rank, 0, 0);
    ctx.restore();
}
function drawCardBack(ctx, x, y, width, height) {

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.fill();

    ctx.strokeStyle = '#4ecca3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 5);
    ctx.stroke();

    ctx.fillStyle = '#4ecca3';

    const patternSize = Math.min(width, height) / 8;

    for (let i = 0; i < width / patternSize; i++) {
        for (let j = 0; j < height / patternSize; j++) {
            if ((i + j) % 2 === 0) {
                ctx.beginPath();
                ctx.arc(
                    x + patternSize / 2 + i * patternSize,
                    y + patternSize / 2 + j * patternSize,
                    patternSize / 4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.arc(
        x + width / 2,
        y + height / 2,
        Math.min(width, height) / 6,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
        x + width / 2,
        y + height / 2,
        Math.min(width, height) / 10,
        0,
        Math.PI * 2
    );
    ctx.stroke();
}

async function drawGameResults(ctx, canvas, results, betAmount) {
    const width = canvas.width;
    const height = canvas.height;

    ctx.font = '48px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('KẾT QUẢ GAME', width / 2, 120);

    const winner = results[0];

    ctx.fillStyle = 'rgba(30, 30, 60, 0.8)';
    const winnerBoxY = 160;
    ctx.fillRect(width * 0.3, winnerBoxY, width * 0.4, 100);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(width * 0.3, winnerBoxY, width * 0.4, 100);

    ctx.font = '30px "BeVietnam Bold"';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 NGƯỜI CHIẾN THẮNG 🏆', width / 2, winnerBoxY + 35);

    ctx.font = '26px "BeVietnam Medium"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
        `${winner.name}${winner.isAI ? ' 🤖' : ''} - ${winner.point} điểm`,
        width / 2, winnerBoxY + 75
    );
    const totalPool = betAmount * results.length;
    const winAmount = Math.floor(totalPool * 0.95);

    ctx.fillStyle = 'rgba(30, 30, 60, 0.7)';
    ctx.fillRect(width * 0.25, winnerBoxY + 120, width * 0.5, 60);

    ctx.font = '22px "BeVietnam"';
    ctx.fillStyle = '#4ecca3';
    ctx.fillText(
        `💰 Tiền thắng: ${formatNumber(winAmount)}$ | Tổng cược: ${formatNumber(totalPool)}$`,
        width / 2, winnerBoxY + 160
    );

    const resultStartY = winnerBoxY + 200;

    const playerCount = results.length;

    let resultHeight;
    if (playerCount <= 4) {
        resultHeight = 90;
    } else if (playerCount <= 6) {
        resultHeight = 80;
    } else {
        resultHeight = 70;
    }

    const cardScaleFactor = Math.max(0.5, 1 - (playerCount - 4) * 0.05);

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const isWinner = i === 0;
        const resultY = resultStartY + i * resultHeight;

        ctx.fillStyle = isWinner ? 'rgba(78, 204, 163, 0.2)' : 'rgba(30, 30, 60, 0.5)';
        ctx.fillRect(width * 0.15, resultY, width * 0.7, resultHeight - 10);

        ctx.strokeStyle = isWinner ? '#ffd700' : '#4ecca3';
        ctx.lineWidth = isWinner ? 2 : 1;
        ctx.strokeRect(width * 0.15, resultY, width * 0.7, resultHeight - 10);

        ctx.fillStyle = isWinner ? '#ffd700' : '#ffffff';
        ctx.font = '22px "BeVietnam Bold"';
        ctx.textAlign = 'center';
        ctx.fillText(`#${i + 1}`, width * 0.2, resultY + resultHeight / 2 + 5);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px "BeVietnam Medium"';
        ctx.textAlign = 'left';
        ctx.fillText(`${result.name}${result.isAI ? ' 🤖' : ''}`, width * 0.25, resultY + 25);

        const cardWidth = Math.min(width * 0.07 * cardScaleFactor, resultHeight * 0.5);
        const cardHeight = cardWidth * 1.5;

        const cardsStartX = width * 0.45;
        const cardsY = resultY + (resultHeight - cardHeight) / 2 - 5;

        const cards = result.cards.split(' ');
        for (let j = 0; j < cards.length; j++) {
            const cardText = cards[j];
            const rank = cardText.slice(0, -2);
            const suit = cardText.slice(-2);

            await drawCard(
                ctx,
                cardsStartX + j * (cardWidth + 8),
                cardsY,
                cardWidth,
                cardHeight,
                { rank, suit }
            );
        }

        ctx.fillStyle = isWinner ? '#ffd700' : '#ffffff';
        ctx.font = '20px "BeVietnam Bold"';
        ctx.textAlign = 'right';
        ctx.fillText(`Điểm: ${result.point}`, width * 0.8, resultY + resultHeight / 2 + 5);
    }

    ctx.font = '20px "BeVietnam"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('• .baicao next - Chơi tiếp  |  .baicao leave - Rời bàn', width / 2, height - 30);
}
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function createPlayerCardCanvas(player) {
    const canvas = Canvas.createCanvas(600, 300);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.05;
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    ctx.font = '80px Arial';
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 5; i++) {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillText(suit, x, y);
    }

    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = '#4ecca3';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, 0, canvas.width, 50);

    ctx.font = '24px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('BÀI CÀO - BÀI CỦA BẠN', canvas.width / 2, 35);

    ctx.font = '22px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.name, canvas.width / 2, 80);

    const cardWidth = 120;
    const cardHeight = 180;
    const startX = (canvas.width - (cardWidth * 3 + 20)) / 2;
    const cardY = 100;

    for (let i = 0; i < player.cards.length; i++) {
        const cardX = startX + (i * (cardWidth + 10));
        await drawCard(ctx, cardX, cardY, cardWidth, cardHeight, player.cards[i]);
    }

    ctx.shadowColor = '#4ecca3';
    ctx.shadowBlur = 15;
    ctx.font = '28px "BeVietnam Bold"';
    ctx.fillStyle = '#4ecca3';
    ctx.fillText(`Điểm: ${player.point}`, canvas.width / 2, cardY + cardHeight + 35);
    ctx.shadowBlur = 0;

    return canvas.toBuffer();
}

async function createGameStateCanvas(gameState) {
    const canvas = Canvas.createCanvas(1000, 600);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 100 + 50,
            0, Math.PI * 2
        );
        ctx.fillStyle = ['#e94560', '#4ecca3', '#ffd700'][i % 3];
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, 0, canvas.width, 60);

    ctx.font = '32px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('BÀN CHƠI BÀI CÀO', canvas.width / 2, 40);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 80, canvas.width - 40, 50);

    ctx.font = '22px "BeVietnam Medium"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`💰 Cược: ${formatNumber(gameState.betAmount)}$`, 40, 115);
    ctx.fillText(`📌 Vòng: ${gameState.roundCount}`, canvas.width / 2 - 100, 115);
    ctx.fillText(`👥 Người chơi: ${gameState.players.size}/8`, canvas.width - 250, 115);

    const players = Array.from(gameState.players.entries());
    const playerCount = players.length;

    let layout;
    if (playerCount <= 3) {
        layout = {
            rows: 1,
            cols: playerCount,
            width: 280,
            height: 220
        };
    } else if (playerCount <= 4) {
        layout = {
            rows: 2,
            cols: 2,
            width: 280,
            height: 220
        };
    } else if (playerCount <= 6) {
        layout = {
            rows: 2,
            cols: 3,
            width: 260,
            height: 200
        };
    } else {
        layout = {
            rows: 2,
            cols: 4,
            width: 230,
            height: 180
        };
    }

    const totalWidth = layout.width * layout.cols;
    const horizontalSpacing = (canvas.width - totalWidth) / (layout.cols + 1);
    const totalHeight = layout.height * layout.rows;
    const verticalSpacing = (canvas.height - 150 - totalHeight) / (layout.rows + 1);
    const startY = 150;

    for (let i = 0; i < players.length; i++) {
        const [playerId, player] = players[i];
        const row = Math.floor(i / layout.cols);
        const col = i % layout.cols;

        const x = horizontalSpacing + col * (layout.width + horizontalSpacing);
        const y = startY + row * (layout.height + verticalSpacing);

        ctx.fillStyle = 'rgba(30, 30, 60, 0.7)';
        ctx.fillRect(x, y, layout.width, layout.height);

        ctx.strokeStyle = player.isAI ? '#ff9900' : '#4ecca3';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, layout.width, layout.height);

        ctx.font = '18px "BeVietnam Bold"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const displayName = player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name;
        ctx.fillText(displayName, x + layout.width / 2, y + 25);

        let statusText = '';
        let statusColor = '';
        if (player.ready) {
            statusText = '✓ Đã sẵn sàng';
            statusColor = '#4ecca3';
        } else if (player.hasChanged) {
            statusText = '🔄 Đã đổi bài';
            statusColor = '#ff9900';
        } else {
            statusText = '⏳ Đang chơi';
            statusColor = '#e94560';
        }

        ctx.font = '16px "BeVietnam"';
        ctx.fillStyle = statusColor;
        ctx.fillText(statusText, x + layout.width / 2, y + layout.height - 15);

        const cardWidth = layout.width * 0.28;
        const cardHeight = cardWidth * 1.5;
        const startCardX = x + (layout.width - (cardWidth * 3 + 10)) / 2;

        for (let j = 0; j < 3; j++) {
            const cardX = startCardX + (j * (cardWidth + 5));
            const cardY = y + 40;
            drawCardBack(ctx, cardX, cardY, cardWidth, cardHeight);
        }
    }

    ctx.font = '26px "BeVietnam Bold"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    let statusText = '';
    if (gameState.state === 'waiting') statusText = '⏳ ĐANG CHỜ NGƯỜI CHƠI THAM GIA';
    else if (gameState.state === 'playing') statusText = '🎮 ĐANG TRONG VÁN BÀI';
    else if (gameState.state === 'waiting_next') statusText = '⏳ ĐANG CHỜ VÒNG MỚI';

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const statusWidth = ctx.measureText(statusText).width + 40;
    ctx.fillRect((canvas.width - statusWidth) / 2, canvas.height - 50, statusWidth, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statusText, canvas.width / 2, canvas.height - 22);

    return canvas.toBuffer();
}

module.exports = {
    createBaicaoCanvas,
    createPlayerCardCanvas,
    createGameStateCanvas
};