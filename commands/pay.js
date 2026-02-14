const { updateBalance, getBalance, saveData } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');
const { updateTransaction } = require('./banking'); 
const vipService = require('../game/vip/vipService');
const { addToTaxFund, getWorkTaxRate } = require('../utils/tax'); 

const transactionsPath = path.join(__dirname, '../database/json/transactions.json');
const userDataPath = path.join(__dirname, '../database/rankData.json');

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
    FREE_MAX_DAILY_AMOUNT: 50000000, 
    VIP_MAX_DAILY_AMOUNT: 5000000000,
};

let dailyTransfers = {};

setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        dailyTransfers = {};
    }
}, 60000);

function calculateFee(amount) {
    const rate = getWorkTaxRate() / 100;
    return Math.ceil(amount * rate);
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
            return api.sendMessage(
                `❌ Số dư không đủ để thực hiện giao dịch này!\n` +
                `• Số dư hiện tại: ${senderBalance.toLocaleString()} $\n` +
                `• Cần có: ${totalAmount.toLocaleString()} $ (bao gồm phí)`,
                threadID,
                messageID
            );
        }

        updateBalance(senderID, -totalAmount);
        updateBalance(recipientID, transferAmount);
        dailyTransfers[senderID] += transferAmount;
        if (fee > 0) addToTaxFund(fee);

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

        try {
            await updateTransaction(senderID, 'out', `Chuyển ${transferAmount.toLocaleString()} $ cho ${recipientName}`, transferAmount);
            await updateTransaction(recipientID, 'in', `Nhận ${transferAmount.toLocaleString()} $ từ ${senderName}`, transferAmount);
        } catch (err) {
            console.error("Lỗi cập nhật lịch sử giao dịch:", err);
        }

        const remainingDailyLimit = userDailyLimit - dailyTransfers[senderID];
        const isVip = userDailyLimit === TRANSFER_LIMITS.VIP_MAX_DAILY_AMOUNT;
        const vipStatusText = isVip ? "👑 VIP" : "⭐ Free";

        const message = 
            `🎉 [GIAO DỊCH CHUYỂN TIỀN THÀNH CÔNG]\n\n` +
            `🔹 Người gửi:\n    • Tên: ${senderName}\n` +
            `🔸 Người nhận:\n    • Tên: ${recipientName}\n\n` +
            `💰 Số tiền chuyển: ${transferAmount.toLocaleString()} $\n` +
            `💸 Phí giao dịch (thuế): ${fee.toLocaleString()} $\n` +
            `💵 Tổng tiền trừ: ${totalAmount.toLocaleString()} $\n` +
            `💳 Số dư sau giao dịch: ${senderNewBalance.toLocaleString()} $\n\n` +
            `📊 Giới hạn/hạn mức chuyển còn lại hôm nay: ${remainingDailyLimit.toLocaleString()} $\n` +
            `🏆 Quyền lợi hiện tại: ${vipStatusText}\n\n` +
            `🌟 Xin cảm ơn bạn đã sử dụng dịch vụ chuyển tiền!`;

        api.sendMessage(message, threadID, messageID);

        saveData();
    }
};