const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateReceipt({ senderName, recipientName, amount, tax, totalAmount, remainingBalance, timestamp }) {
    const canvas = Canvas.createCanvas(600, 800);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 800);

    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(0, 0, 600, 100);
e
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PAYMENT RECEIPT', 300, 60);

    ctx.fillStyle = '#000000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';

    const startY = 150;
    const lineHeight = 40;

    ctx.fillText(`From: ${senderName}`, 50, startY);
    ctx.fillText(`To: ${recipientName}`, 50, startY + lineHeight);
    ctx.fillText(`Amount: ${amount.toLocaleString()} Xu`, 50, startY + lineHeight * 2);
    ctx.fillText(`Tax (1%): ${tax.toLocaleString()} Xu`, 50, startY + lineHeight * 3);
    ctx.fillText(`Total: ${totalAmount.toLocaleString()} Xu`, 50, startY + lineHeight * 4);
    ctx.fillText(`Remaining Balance: ${remainingBalance.toLocaleString()} Xu`, 50, startY + lineHeight * 5);

    ctx.font = '18px Arial';
    ctx.fillText(`Date: ${timestamp}`, 50, startY + lineHeight * 6);

    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(0, 700, 600, 100);

    const tempPath = path.join(__dirname, '../commands/cache/receipt.png');
    const out = fs.createWriteStream(tempPath);
    const stream = canvas.createPNGStream();
    await new Promise((resolve, reject) => {
        stream.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
    });

    return tempPath;
}

module.exports = generateReceipt;
