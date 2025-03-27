const fs = require('fs');
const path = require('path');
const express = require('express');
const { updateBalance } = require('./currencies');

const router = express.Router();
const cacheFile = path.join(__dirname, '../game/cache/momo_transactions.json');

router.post('/momo/webhook', async (req, body) => {
    try {
        const { transactionId, amount, content } = req.body;

        if (!content.startsWith('NAP')) return;

        const transactions = JSON.parse(fs.readFileSync(cacheFile));
        const txId = content.slice(3); 

        const transaction = transactions[txId];
        if (!transaction) return;

        if (transaction.amount !== parseInt(amount)) return;

        transaction.status = 'completed';
        fs.writeFileSync(cacheFile, JSON.stringify(transactions, null, 2));

        await updateBalance(transaction.userId, amount);

        console.log(`Successfully processed MoMo transaction: ${txId}`);

    } catch (error) {
        console.error('MoMo Webhook Error:', error);
    }
});

module.exports = router;
