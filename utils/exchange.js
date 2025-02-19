const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureId() {
    return crypto.randomBytes(32).toString('hex');
}

async function validateMessengerId(id) {
    
    if (!/^\d{8,16}$/.test(id)) {
        return {
            valid: false,
            message: "ID Messenger không hợp lệ (phải có 8-16 chữ số)"
        };
    }

    const currenciesPath = path.join(__dirname, '../database/currencies.json');
    try {
        const data = JSON.parse(fs.readFileSync(currenciesPath, 'utf8'));
        const userExists = data.balance.hasOwnProperty(id);
        return {
            valid: userExists,
            message: userExists ? "OK" : "ID Messenger không tồn tại trong hệ thống"
        };
    } catch (err) {
        console.error('Error validating Messenger ID:', err);
        return {
            valid: false,
            message: "Lỗi kiểm tra ID"
        };
    }
}

async function verifyTransaction(userId, transactionId) {
    const exchangeLogFile = path.join(__dirname, '../database/exchange_logs.json');
    const discordCurrenciesFile = path.join(__dirname, '../database/discord/discord_currencies.json'); 
    const messengerCurrenciesFile = path.join(__dirname, '../database/currencies.json');

    try {
        // Đọc các file dữ liệu
        const logs = JSON.parse(fs.readFileSync(exchangeLogFile, 'utf8'));
        const discordData = JSON.parse(fs.readFileSync(discordCurrenciesFile, 'utf8'));
        const messengerData = JSON.parse(fs.readFileSync(messengerCurrenciesFile, 'utf8'));

        const transaction = logs.exchanges.find(ex => 
            ex.transactionId === transactionId && 
            ex.messengerId === userId &&
            ex.status === 'pending'
        );

        if (!transaction) {
            return {
                success: false,
                message: "Không tìm thấy giao dịch hoặc giao dịch đã được xử lý!"
            };
        }

        messengerData.balance[userId] = (messengerData.balance[userId] || 0) + transaction.xuAmount;
        
        transaction.status = 'completed';
        transaction.claimedAt = new Date().toISOString();

        fs.writeFileSync(exchangeLogFile, JSON.stringify(logs, null, 2));
        fs.writeFileSync(messengerCurrenciesFile, JSON.stringify(messengerData, null, 2));

        return {
            success: true,
            message: `✅ Đã nhận ${transaction.xuAmount.toLocaleString('vi-VN')} xu từ giao dịch!\n💰 Số dư hiện tại: ${messengerData.balance[userId].toLocaleString('vi-VN')} xu`
        };

    } catch (error) {
        console.error('Verify transaction error:', error);
        return {
            success: false,
            message: "Lỗi xử lý giao dịch, vui lòng thử lại sau!"
        };
    }
}

module.exports = {
    generateSecureId,
    verifyTransaction,
    validateMessengerId
}
