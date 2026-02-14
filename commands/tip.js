const { updateBalance, getBalance, saveData } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');
const { updateTransaction } = require('./banking');
const { getUserName } = require('../utils/userUtils');

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

const TIP_LIMITS = {
    MIN_AMOUNT: 100,
    MAX_AMOUNT: 5000000,
};

function getReplyRecipientId(event) {
    if (
        event.type === 'message_reply' &&
        event.messageReply &&
        event.messageReply.senderID
    ) {
        return String(event.messageReply.senderID);
    }
    return null;
}

module.exports = {
    name: "tip",
    dev: "HNT",
    usedby: 0,
    category: "Tài Chính",
    info: "Bo tiền (tip) cho người khác - không phí giao dịch",
    onPrefix: true,
    usages: ".tip [số tiền] (reply tin nhắn người nhận)",
    cooldowns: 0,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        // Không lấy số tiền từ tag, chỉ nhận từ target[0]
        const tipAmount = parseInt(target[0], 10);
        if (!tipAmount || tipAmount < 1) {
            return api.sendMessage(
                "『 BO TIỀN (TIP) 』\n\n" +
                "⚜️ Hướng dẫn:\n" +
                "➤ .tip [số tiền] (reply tin nhắn người nhận)\n\n" +
                `📌 Số tiền: ${TIP_LIMITS.MIN_AMOUNT.toLocaleString()} - ${TIP_LIMITS.MAX_AMOUNT.toLocaleString()} $\n` +
                "💡 Không tính phí giao dịch!",
                threadID,
                messageID
            );
        }

        // Lấy người nhận chỉ qua reply
        const recipientID = getReplyRecipientId(event);

        if (!recipientID) {
            return api.sendMessage(
                "❌ Bạn cần reply tin nhắn của người nhận để bo tiền!",
                threadID,
                messageID
            );
        }

        if (String(recipientID) === String(senderID)) {
            return api.sendMessage(
                "❓ Bạn không thể bo tiền cho chính mình!",
                threadID,
                messageID
            );
        }

        if (tipAmount < TIP_LIMITS.MIN_AMOUNT) {
            return api.sendMessage(
                `❌ Số tiền tip tối thiểu là ${TIP_LIMITS.MIN_AMOUNT.toLocaleString()} $.`,
                threadID,
                messageID
            );
        }

        if (tipAmount > TIP_LIMITS.MAX_AMOUNT) {
            return api.sendMessage(
                `❌ Số tiền tip tối đa mỗi lần là ${TIP_LIMITS.MAX_AMOUNT.toLocaleString()} $.`,
                threadID,
                messageID
            );
        }

        const senderBalance = getBalance(senderID);
        if (tipAmount > senderBalance) {
            return api.sendMessage(
                `❌ Số dư không đủ! Bạn có ${senderBalance.toLocaleString()} $, cần ${tipAmount.toLocaleString()} $.`,
                threadID,
                messageID
            );
        }

        updateBalance(senderID, -tipAmount);
        updateBalance(recipientID, tipAmount);

        let senderName = userData[senderID]?.name || getUserName(senderID) || "Bạn";
        let recipientName = userData[recipientID]?.name || getUserName(recipientID) || "Người nhận";

        if (!transactions[senderID]) transactions[senderID] = [];
        if (!transactions[recipientID]) transactions[recipientID] = [];

        transactions[senderID].push({
            type: 'out',
            amount: tipAmount,
            timestamp: Date.now(),
            description: `Tip ${tipAmount} $ cho ${recipientName}`
        });

        transactions[recipientID].push({
            type: 'in',
            amount: tipAmount,
            timestamp: Date.now(),
            description: `Nhận tip ${tipAmount} $ từ ${senderName}`
        });

        if (transactions[senderID].length > 5) transactions[senderID] = transactions[senderID].slice(-5);
        if (transactions[recipientID].length > 5) transactions[recipientID] = transactions[recipientID].slice(-5);

        fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

        try {
            await updateTransaction(senderID, 'out', `Tip ${tipAmount.toLocaleString()} $ cho ${recipientName}`, tipAmount);
            await updateTransaction(recipientID, 'in', `Nhận tip ${tipAmount.toLocaleString()} $ từ ${senderName}`, tipAmount);
        } catch (err) {
            console.error("Lỗi cập nhật lịch sử giao dịch:", err);
        }

        saveData();

        const tipMessages = [
            `💝 ${senderName} đã bo ${tipAmount.toLocaleString()} $ cho ${recipientName}! Cảm ơn sự hào phóng!`,
            `🎁 ${senderName} tip ${tipAmount.toLocaleString()} $ cho ${recipientName}!`,
            `🙏 ${recipientName} nhận được ${tipAmount.toLocaleString()} $ từ ${senderName}!`,
        ];

        const randomMessage = tipMessages[Math.floor(Math.random() * tipMessages.length)];
        const balanceInfo = `\n💰 Số dư còn lại: ${getBalance(senderID).toLocaleString()} $`;

        return api.sendMessage(randomMessage + balanceInfo, threadID, messageID);
    }
};
