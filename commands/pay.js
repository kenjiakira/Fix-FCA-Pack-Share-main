const { updateBalance, getBalance, saveData } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');
const { updateTransaction } = require('./banking'); 
const { createTransactionBill } = require('../game/canvas/transactionBill');
const vipService = require('../game/vip/vipService'); 

const transactionsPath = path.join(__dirname, '../database/json/transactions.json');
const userDataPath = path.join(__dirname, '../events/cache/rankData.json');

let transactions = {};
let userData = {};

try {
    if (fs.existsSync(transactionsPath)) {
        transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading transactions:", error);
}

try {
    if (fs.existsSync(userDataPath)) {
        userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading userData:", error);
}

const TRANSFER_LIMITS = {
    MIN_AMOUNT: 10000,
    MAX_AMOUNT_PER_TRANSFER: 500000000, 
    FREE_MAX_DAILY_AMOUNT: 50000000, // 50 million for free users
    VIP_MAX_DAILY_AMOUNT: 5000000000, // 5 billion for VIP users
};

const TRANSFER_FEES = [
    { threshold: 100, fee: 0.03 },
    { threshold: 1000, fee: 0.025 }, 
    { threshold: 10000, fee: 0.03 }, 
    { threshold: Infinity, fee: 0.01 }
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

function getUserDailyLimit(userId) {
    const vipStatus = vipService.checkVIP(userId);
    if (vipStatus.success) {
        return TRANSFER_LIMITS.VIP_MAX_DAILY_AMOUNT;
    } else {
        return TRANSFER_LIMITS.FREE_MAX_DAILY_AMOUNT;
    }
}

module.exports = {
    name: "pay",
    dev: "HNT",
    usedby: 0,
    category: "Tài Chính",
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
            return api.sendMessage(`Số tiền chuyển tối thiểu là ${TRANSFER_LIMITS.MIN_AMOUNT.toLocaleString()} $.`, threadID, messageID);
        }

        if (transferAmount > TRANSFER_LIMITS.MAX_AMOUNT_PER_TRANSFER) {
            return api.sendMessage(`Số tiền chuyển tối đa mỗi lần là ${TRANSFER_LIMITS.MAX_AMOUNT_PER_TRANSFER.toLocaleString()} $.`, threadID, messageID);
        }

        // Get user's daily transfer limit based on VIP status
        const userDailyLimit = getUserDailyLimit(senderID);
        
        dailyTransfers[senderID] = dailyTransfers[senderID] || 0;
        if (dailyTransfers[senderID] + transferAmount > userDailyLimit) {
            const isVip = userDailyLimit === TRANSFER_LIMITS.VIP_MAX_DAILY_AMOUNT;
            let message = `Bạn đã vượt quá giới hạn chuyển tiền hàng ngày (${userDailyLimit.toLocaleString()} $).`;
            
            if (!isVip) {
                message += `\n💡 Nâng cấp lên VIP để được chuyển tối đa ${TRANSFER_LIMITS.VIP_MAX_DAILY_AMOUNT.toLocaleString()} $ mỗi ngày.`;
            }
            
            return api.sendMessage(message, threadID, messageID);
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
            if (userData[senderID] && userData[senderID].name) {
                senderName = userData[senderID].name;
            }
            if (userData[recipientID] && userData[recipientID].name) {
                recipientName = userData[recipientID].name;
            }
        } catch (err) {
            console.error("Không thể lấy thông tin người dùng:", err);
        }

        if (!transactions[senderID]) transactions[senderID] = [];
        if (!transactions[recipientID]) transactions[recipientID] = [];

        transactions[senderID].push({
            type: 'out',
            amount: totalAmount,
            timestamp: Date.now(),
            description: `Chuyển ${transferAmount} $ cho ${recipientName}`
        });

        transactions[recipientID].push({
            type: 'in',
            amount: transferAmount,
            timestamp: Date.now(),
            description: `Nhận ${transferAmount} $ từ ${senderName}`
        });

        if (transactions[senderID].length > 5) {
            transactions[senderID] = transactions[senderID].slice(-5);
        }
        if (transactions[recipientID].length > 5) {
            transactions[recipientID] = transactions[recipientID].slice(-5);
        }

        fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

        const senderNewBalance = getBalance(senderID);

        const billPath = await createTransactionBill({
            senderName,
            recipientName,
            amount: transferAmount,
            fee,
            total: totalAmount,
            remainingBalance: senderNewBalance,
            theme: 'blue'
        });

        try {
            await updateTransaction(senderID, 'out', `Chuyển ${transferAmount.toLocaleString()} $ cho ${recipientName}`, transferAmount);
            await updateTransaction(recipientID, 'in', `Nhận ${transferAmount.toLocaleString()} $ từ ${senderName}`, transferAmount);
        } catch (err) {
            console.error("Lỗi cập nhật lịch sử giao dịch:", err);
        }

        // Display remaining daily limit 
        const remainingDailyLimit = userDailyLimit - dailyTransfers[senderID];
        const isVip = userDailyLimit === TRANSFER_LIMITS.VIP_MAX_DAILY_AMOUNT;
        const vipStatusText = isVip ? "👑 VIP" : "⭐ Free";
        
        api.sendMessage(
            { 
                body: `✅ Chuyển tiền thành công!\n💰 Hạn mức còn lại hôm nay: ${remainingDailyLimit.toLocaleString()} $\n🏆 Trạng thái: ${vipStatusText}`,
                attachment: fs.createReadStream(billPath) 
            },
            threadID,
            () => fs.unlinkSync(billPath),
            messageID
        );

        saveData();
    }
};