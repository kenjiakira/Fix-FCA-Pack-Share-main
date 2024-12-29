const fs = require('fs');
const path = require('path');

const userDataFile = path.join(__dirname,'../events/cache/userData.json');
const transactionsPath = path.join(__dirname, '../commands/json/transactions.json');
let userData = {};
let transactions = {};

try {
    if (fs.existsSync(userDataFile)) {
        userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    }
    if (fs.existsSync(transactionsPath)) {
        transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
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
        const { threadID, messageID, senderID } = event;
        const userID = String(senderID);

        const userInfo = userData[userID] || {};
        const userName = userInfo.name || "Người dùng không xác định";

        const balance = global.balance[userID] || 0;
        const bankBalance = global.bankBalance?.[userID] || 0;
        const lastInterest = global.lastInterest?.[userID] || Date.now();
        
        const daysPassed = Math.floor((Date.now() - lastInterest) / (24 * 60 * 60 * 1000));
        const interest = Math.floor(bankBalance * 0.001 * daysPassed);
        
        if (interest > 0) {
            global.bankBalance[userID] = bankBalance + interest;
            global.lastInterest[userID] = Date.now();
        }

        const totalWealth = balance + bankBalance;
        let status = "🌱 Tập sự";
        if (totalWealth > 1000000) status = "💎 Triệu phú";
        if (totalWealth > 10000000) status = "👑 Tỷ phú";
        if (totalWealth > 100000000) status = "🌟 Đại gia";

        try {
            if (fs.existsSync(transactionsPath)) {
                transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
            }
        } catch (error) {
            console.error("Error loading transactions:", error);
        }

        const recentTrans = transactions[userID]?.slice(-3) || [];
        const transHistory = recentTrans.length > 0 ? 
            recentTrans.map(t => {
                const date = new Date(t.timestamp);
                const time = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                const icon = t.type === 'in' ? '📥' : '📤';
                return `${icon} ${time}: ${t.description}`;
            }).reverse().join('\n') 
            : 'Chưa có giao dịch nào';

        const response = `⭐️ 【 BÁO CÁO TÀI CHÍNH 】 ⭐️\n\n`+
            `👤 Người dùng: ${userName}\n`+ 
            `🏆 Cấp độ: ${status}\n\n`+
            `💰 Số dư ví: ${balance.toLocaleString('vi-VN')} Xu\n`+
            `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu\n`+
            `💵 Tổng tài sản: ${totalWealth.toLocaleString('vi-VN')} Xu\n\n`+
            `📊 Giao dịch gần đây:\n${transHistory}\n\n`+
            `💫 Lãi suất ngân hàng: 0.1%/ngày\n`+
            `${interest > 0 ? `✨ Bạn nhận được ${interest} Xu tiền lãi!` : ''}`;

        return api.sendMessage(response, threadID, messageID);
    }
};
