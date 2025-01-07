const { updateBalance, getBalance, saveData } = require('../utils/currencies');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const transactionsPath = path.join(__dirname, '../commands/json/transactions.json');
let transactions = {};

try {
    if (fs.existsSync(transactionsPath)) {
        transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading transactions:", error);
}

const TRANSFER_LIMITS = {
    MIN_AMOUNT: 10000,
    MAX_AMOUNT_PER_TRANSFER: 50000000, 
    MAX_DAILY_AMOUNT: 100000000,
};

const TRANSFER_FEES = [
    { threshold: 10000, fee: 0.01 },
    { threshold: 100000, fee: 0.008 }, 
    { threshold: 1000000, fee: 0.005 }, 
    { threshold: Infinity, fee: 0.003 }
];

let dailyTransfers = {};

setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        dailyTransfers = {};
    }
}, 60000);

function calculateFee(amount) {
    for (const tier of TRANSFER_FEES) {
        if (amount <= tier.threshold) {
            return Math.ceil(amount * tier.fee);
        }
    }
    return Math.ceil(amount * TRANSFER_FEES[TRANSFER_FEES.length - 1].fee);
}

async function createBillImage(senderName, recipientName, amount, tax, total, remainingBalance) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#141e30');
    gradient.addColorStop(1, '#243b55');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    ctx.strokeStyle = '#gold';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 760, 560);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(30, 30, 740, 540);

    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('BIÊN LAI GIAO DỊCH', 400, 80);

    ctx.beginPath();
    ctx.moveTo(200, 100);
    ctx.lineTo(600, 100);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();

    const now = new Date();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`, 700, 140);

    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial';
    const startY = 200;
    const lineHeight = 50;

    const drawField = (label, value, y) => {
        ctx.fillStyle = '#87CEEB';
        ctx.fillText(label, 60, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`: ${value}`, 250, y);
    };

    drawField('Người gửi', senderName, startY);
    drawField('Người nhận', recipientName, startY + lineHeight);
    drawField('Số tiền gửi', `${amount.toLocaleString()} Xu`, startY + lineHeight * 2);
    drawField('Thuế (1%)', `${tax.toLocaleString()} Xu`, startY + lineHeight * 3);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Arial';
    drawField('Tổng tiền', `${total.toLocaleString()} Xu`, startY + lineHeight * 4);
    
    ctx.fillStyle = '#98FB98';
    ctx.font = 'bold 24px Arial';
    drawField('Số dư còn lại', `${remainingBalance.toLocaleString()} Xu`, startY + lineHeight * 5);

    ctx.font = 'italic 20px Arial';
    ctx.fillStyle = '#87CEEB';
    ctx.textAlign = 'center';
    ctx.fillText('Cảm ơn bạn đã sử dụng dịch vụ!', 400, 550);

    const transactionId = Math.random().toString(36).substring(2, 15);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Mã giao dịch: ${transactionId}`, 400, 580);

    const outputDir = path.resolve(__dirname, '../commands/cache');
    const outputPath = path.join(outputDir, 'temp_bill.png');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}

module.exports = {
    name: "pay",
    dev: "HNT",
    usedby: 0,
    info: "Chuyển tiền cho người khác.",
    onPrefix: true,
    usages: ".pay <số tiền>: Chuyển tiền cho người dùng được reply.",
    cooldowns: 0,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0] || isNaN(target[0])) {
            return api.sendMessage("❌ Vui lòng nhập số tiền cần chuyển!\n Cú pháp: .pay <số tiền> (và reply người nhận)", threadID, messageID);
        }

        let recipientID;
        if (event.type === 'message_reply') {
            recipientID = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
            return api.sendMessage("❌ Vui lòng reply tin nhắn của người nhận thay vì tag!", threadID, messageID);
        } else {
            return api.sendMessage("❌ Bạn cần reply tin nhắn của người nhận.", threadID, messageID);
        }

        const transferAmount = parseInt(target[0], 10);

        if (transferAmount < TRANSFER_LIMITS.MIN_AMOUNT) {
            return api.sendMessage(`Số tiền chuyển tối thiểu là ${TRANSFER_LIMITS.MIN_AMOUNT.toLocaleString()} Xu.`, threadID, messageID);
        }

        if (transferAmount > TRANSFER_LIMITS.MAX_AMOUNT_PER_TRANSFER) {
            return api.sendMessage(`Số tiền chuyển tối đa mỗi lần là ${TRANSFER_LIMITS.MAX_AMOUNT_PER_TRANSFER.toLocaleString()} Xu.`, threadID, messageID);
        }

        dailyTransfers[senderID] = dailyTransfers[senderID] || 0;
        if (dailyTransfers[senderID] + transferAmount > TRANSFER_LIMITS.MAX_DAILY_AMOUNT) {
            return api.sendMessage(`Bạn đã vượt quá giới hạn chuyển tiền hàng ngày (${TRANSFER_LIMITS.MAX_DAILY_AMOUNT.toLocaleString()} Xu).`, threadID, messageID);
        }

        const fee = calculateFee(transferAmount);
        const totalAmount = transferAmount + fee;

        const senderBalance = getBalance(senderID);
        if (totalAmount > senderBalance) {
            return api.sendMessage("Số dư không đủ để thực hiện giao dịch này!", threadID, messageID);
        }

        updateBalance(senderID, -totalAmount);
        updateBalance(recipientID, transferAmount);
        dailyTransfers[senderID] += transferAmount;

        let senderName = "Người gửi";
        let recipientName = "Người nhận";
        
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            if (threadInfo && threadInfo.userInfo) {
                const senderInfo = threadInfo.userInfo.find(user => user.id === senderID);
                const recipientInfo = threadInfo.userInfo.find(user => user.id === recipientID);
                
                if (senderInfo) senderName = senderInfo.name;
                if (recipientInfo) recipientName = recipientInfo.name;
            }
        } catch (err) {
            console.error("Không thể lấy thông tin thread:", err);
     
        }

        if (!transactions[senderID]) transactions[senderID] = [];
        if (!transactions[recipientID]) transactions[recipientID] = [];

        transactions[senderID].push({
            type: 'out',
            amount: totalAmount,
            timestamp: Date.now(),
            description: `Chuyển ${transferAmount} Xu cho ${recipientName}`
        });

        transactions[recipientID].push({
            type: 'in',
            amount: transferAmount,
            timestamp: Date.now(),
            description: `Nhận ${transferAmount} Xu từ ${senderName}`
        });

        if (transactions[senderID].length > 5) {
            transactions[senderID] = transactions[senderID].slice(-5);
        }
        if (transactions[recipientID].length > 5) {
            transactions[recipientID] = transactions[recipientID].slice(-5);
        }

        fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

        const senderNewBalance = getBalance(senderID);

        const billPath = await createBillImage(
            senderName,
            recipientName,
            transferAmount,
            fee,
            totalAmount,
            senderNewBalance
        );

        api.sendMessage(
            { attachment: fs.createReadStream(billPath) },
            threadID,            () => fs.unlinkSync(billPath), 
            messageID
        );

        saveData();
    }
};
