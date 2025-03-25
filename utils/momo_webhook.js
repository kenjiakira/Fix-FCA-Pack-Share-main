const fs = require('fs');
const path = require('path');
const express = require('express');
const { updateBalance } = require('./currencies');

const router = express.Router();
const cacheFile = path.join(__dirname, '../cache/momo_transactions.json');

// Xử lý webhook từ MoMo
router.post('/momo/webhook', async (req, body) => {
    try {
        const { transactionId, amount, content } = req.body;

        // Kiểm tra nội dung giao dịch có bắt đầu bằng NAP
        if (!content.startsWith('NAP')) return;

        const transactions = JSON.parse(fs.readFileSync(cacheFile));
        const txId = content.slice(3); // Bỏ prefix NAP

        const transaction = transactions[txId];
        if (!transaction) return;

        // Kiểm tra số tiền khớp
        if (transaction.amount !== parseInt(amount)) return;

        // Cập nhật trạng thái giao dịch
        transaction.status = 'completed';
        fs.writeFileSync(cacheFile, JSON.stringify(transactions, null, 2));

        // Cộng tiền vào tài khoản user
        await updateBalance(transaction.userId, amount);

        console.log(`Successfully processed MoMo transaction: ${txId}`);

    } catch (error) {
        console.error('MoMo Webhook Error:', error);
    }
});

module.exports = router;
