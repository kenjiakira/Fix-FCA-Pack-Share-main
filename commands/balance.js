const fs = require('fs');
const path = require('path');
const TradeSystem = require('../trade/TradeSystem');
const tradeSystem = new TradeSystem();

const userDataFile = path.join(__dirname,'../events/cache/userData.json');
const bankingDataPath = path.join(__dirname, './json/banking.json');
let userData = {};

function loadBankingData() {
    try {
        if (fs.existsSync(bankingDataPath)) {
            return JSON.parse(fs.readFileSync(bankingDataPath, 'utf8'));
        }
        return { users: {}, transactions: {}, loans: {}, blacklist: {}, dailyLoans: {} };
    } catch (error) {
        console.error("Error loading banking data:", error);
        return { users: {}, transactions: {}, loans: {}, blacklist: {}, dailyLoans: {} };
    }
}

try {
    if (fs.existsSync(userDataFile)) {
        userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    }
} catch (error) {
    console.error("Error loading user data:", error);
}

module.exports = {
    name: "balance",
    dev: "HNT",
    usedby: 0,
    category: "Tài Chính",
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
            const bankingData = loadBankingData();
            const bankUserData = bankingData.users?.[userID] || {};
            const bankBalance = bankUserData.bankBalance || 0;
            const totalWealth = balance + bankBalance;

            let transHistory = 'Chưa có';
            const transactions = bankingData.transactions[userID] || [];
            const recentTrans = transactions.slice(-2);
            if (recentTrans.length > 0) {
                transHistory = recentTrans.map(t => {
                    const date = new Date(t.timestamp);
                    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                    const icon = t.type === 'in' ? '📥' : '📤';
                    return `${icon} ${time}: ${t.description}`;
                }).reverse().join('\n');
            }

            let marketAlert = '';
            try {
                const analysis = tradeSystem.getMarketAnalysis();
                if (analysis.topGainers.length > 0) {
                    const gainer = analysis.topGainers[0];
                    marketAlert = `\n📈 ${gainer.symbol}: +${gainer.change.toFixed(1)}%`;
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
