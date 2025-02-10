const fs = require('fs');
const path = require('path');
const { market } = require('./trade.js'); 

const userDataFile = path.join(__dirname,'../events/cache/userData.json');
const transactionsPath = path.join(__dirname, '../commands/json/transactions.json');
const bankingDataPath = path.join(__dirname, './json/banking.json');
let userData = {};
let transactions = {};
let bankingData = {};

try {
    if (fs.existsSync(userDataFile)) {
        userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    }
    if (fs.existsSync(transactionsPath)) {
        transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
    }
    if (fs.existsSync(bankingDataPath)) {
        bankingData = JSON.parse(fs.readFileSync(bankingDataPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading files:", error);
}

module.exports = {
    name: "balance",
    dev: "HNT",
    usedby: 0,
    info: "Kiểm tra số dư tài khoản của bạn",
    onPrefix: true,
    usages: ".balance: Kiểm tra số dư tài khoản của bạn.",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        try {
            const { threadID, messageID, senderID } = event;
            const userID = String(senderID);

            const userInfo = userData[userID] || {};
            const userName = userInfo.name || "Người dùng";

            const balance = global.balance[userID] || 0;
            const bankUserData = bankingData.users?.[userID] || {};
            const bankBalance = bankUserData.bankBalance || 0;
            const totalWealth = balance + bankBalance;

            let transHistory = 'Chưa có';
            try {
                if (fs.existsSync(transactionsPath)) {
                    transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
                    const recentTrans = transactions[userID]?.slice(-2) || [];
                    if (recentTrans.length > 0) {
                        transHistory = recentTrans.map(t => {
                            const date = new Date(t.timestamp);
                            const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                            const icon = t.type === 'in' ? '📥' : '📤';
                            return `${icon} ${time}: ${t.description}`;
                        }).reverse().join('\n');
                    }
                }
            } catch (error) {
                transHistory = 'Không thể tải';
            }

            let marketAlert = '';
            try {
                const analysis = await market.getMarketAnalysis();
                if (analysis?.topGainers?.length > 0) {
                    const [symbol, data] = analysis.topGainers[0];
                    marketAlert = `\n📈 ${symbol}: +${data.change.toFixed(1)}%`;
                }
            } catch (error) {
                console.error("Market analysis error:", error);
                marketAlert = '';
            }

            const response = 
                `💰 SỐ DƯ TÀI KHOẢN 💰\n` +
                `━━━━━━━━━━━━━━\n` +
                `👤 ${userName}\n` +
                `💵 Ví: ${balance.toLocaleString('vi-VN')} xu\n` +
                `🏦 Bank: ${bankBalance.toLocaleString('vi-VN')} xu\n` +
                `💎 Tổng: ${totalWealth.toLocaleString('vi-VN')} xu\n\n` +
                `📝 Giao dịch:\n${transHistory}` +
                marketAlert;

            await api.sendMessage(response, threadID, messageID);
        } catch (error) {
            console.error("Balance command error:", error);
            return api.sendMessage("❌ Lỗi hệ thống!", event.threadID, event.messageID);
        }
    }
};
