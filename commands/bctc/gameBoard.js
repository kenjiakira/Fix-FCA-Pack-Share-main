const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

async function createGameBoard(choices, results = [], bets = {}, winAmount = 0, totalBet = 0) {
    const canvas = createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, 600, 800);

    // Draw header
    ctx.fillStyle = '#34495E';
    ctx.fillRect(0, 0, 600, 100);
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ECF0F1';
    ctx.textAlign = 'center';
    ctx.fillText('BẦU CUA TÔM CÁ', 300, 60);

    // Load images
    const images = {};
    for (const choice of choices) {
        images[choice] = await loadImage(path.join(__dirname, `${choice}.png`));
    }

    // Draw results if any
    if (results.length > 0) {
        ctx.fillStyle = '#2980B9';
        ctx.fillRect(50, 120, 500, 200);
        const resultWidth = 150;
        const resultPadding = 25;
        const resultStartX = (600 - (resultWidth * 3 + resultPadding * 2)) / 2;
        
        for (let i = 0; i < results.length; i++) {
            const x = resultStartX + (resultWidth + resultPadding) * i;
            const y = 140;
            ctx.drawImage(images[results[i]], x, y, resultWidth, resultWidth);
        }
    }

    // Draw betting board
    const cellSize = 180;
    const padding = 20;
    const startX = (600 - (cellSize * 3 + padding * 2)) / 2;
    const startY = results.length > 0 ? 350 : 150;

    for (let i = 0; i < choices.length; i++) {
        const x = startX + (i % 3) * (cellSize + padding);
        const y = startY + Math.floor(i / 3) * (cellSize + padding);
        
        // Draw cell background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
        if (bets[choices[i]]) {
            gradient.addColorStop(0, '#27AE60');
            gradient.addColorStop(1, '#2ECC71');
        } else {
            gradient.addColorStop(0, '#34495E');
            gradient.addColorStop(1, '#2C3E50');
        }
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + cellSize - radius, y);
        ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + radius);
        ctx.lineTo(x + cellSize, y + cellSize - radius);
        ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - radius, y + cellSize);
        ctx.lineTo(x + radius, y + cellSize);
        ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Draw image
        ctx.drawImage(images[choices[i]], x + 20, y + 20, cellSize - 40, cellSize - 40);
        
        // Draw bet amount if exists
        if (bets[choices[i]]) {
            // Draw bet amount background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y + cellSize - 40, cellSize, 40);
            
            ctx.fillStyle = '#ECF0F1';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formatNumber(bets[choices[i]]) + ' Xu', x + cellSize/2, y + cellSize - 10);
        }
    }

    // Draw game info
    const infoY = startY + (cellSize + padding) * 2 + 40;
    
    // Draw info box
    if (totalBet > 0) {
        ctx.fillStyle = '#34495E';
        ctx.fillRect(30, infoY - 50, 540, 120);
        
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Đặt cược: ${formatNumber(totalBet)} Xu`, 50, infoY);
        
        if (winAmount > 0) {
            ctx.fillStyle = '#2ECC71';
            ctx.fillText(`Thắng: ${formatNumber(winAmount)} Xu`, 50, infoY + 40);
        } else if (winAmount === 0 && results.length > 0) {
            ctx.fillStyle = '#E74C3C';
            ctx.fillText(`Thua: ${formatNumber(totalBet)} Xu`, 50, infoY + 40);
        }
    }

    // Save the canvas to a temporary file
    const outputPath = path.join(__dirname, '../../cache/baucua_result.png');
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    
    return new Promise((resolve, reject) => {
        out.on('finish', () => resolve(outputPath));
        out.on('error', reject);
    });
}

module.exports = { createGameBoard };
