const fs = require('fs');
const path = require('path');
const { getMiningBalance, updateMiningBalance } = require('./miningCurrency');
const { getBalance, updateBalance } = require('../../utils/currencies');

const WITHDRAWAL_LOG_FILE = path.join(__dirname, '../../commands/json/mining_withdrawals.json');

// Initialize withdrawal log
if (!fs.existsSync(WITHDRAWAL_LOG_FILE)) {
    fs.writeFileSync(WITHDRAWAL_LOG_FILE, JSON.stringify({
        withdrawals: [],
        totalWithdrawn: 0
    }, null, 2));
}

function logWithdrawal(userId, amount, fee, finalAmount) {
    const data = JSON.parse(fs.readFileSync(WITHDRAWAL_LOG_FILE, 'utf8'));
    
    data.withdrawals.push({
        userId,
        amount,
        fee,
        finalAmount,
        timestamp: Date.now()
    });
    
    data.totalWithdrawn += finalAmount;
    
    fs.writeFileSync(WITHDRAWAL_LOG_FILE, JSON.stringify(data, null, 2));
}

function handleWithdrawal(userId, amount, fee) {
    try {
        const finalAmount = amount - fee;
        
        // Chuyển coins từ mining sang game chính
        updateBalance(userId, finalAmount);
        
        // Log withdrawal
        logWithdrawal(userId, amount, fee, finalAmount);
        
        return {
            success: true,
            withdrawnAmount: finalAmount,
            fee: fee,
            message: "Rút tiền thành công!"
        };
    } catch (error) {
        console.error('Withdrawal error:', error);
        return {
            success: false,
            message: "Lỗi khi xử lý rút tiền!"
        };
    }
}

module.exports = {
    handleWithdrawal
};
