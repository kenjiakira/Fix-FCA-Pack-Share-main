const fs = require('fs');
const path = require('path');

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
            const userName = userInfo.name || "Người dùng không xác định";

            const balance = global.balance[userID] || 0;
            const bankUserData = bankingData.users?.[userID] || {};
            const bankBalance = bankUserData.bankBalance || 0;
            const lastInterest = bankUserData.lastInterest || Date.now();
            
            const daysPassed = Math.floor((Date.now() - lastInterest) / (24 * 60 * 60 * 1000));
            const interest = Math.floor(bankBalance * 0.001 * daysPassed);
            
            if (interest > 0 && bankUserData) {
                bankUserData.bankBalance = bankBalance + interest;
                bankUserData.lastInterest = Date.now();
                fs.writeFileSync(bankingDataPath, JSON.stringify(bankingData, null, 2));
            }

            const totalWealth = balance + bankBalance;

            let transHistory;
            try {
                if (fs.existsSync(transactionsPath)) {
                    transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
                }
                const recentTrans = transactions[userID]?.slice(-3) || [];
                transHistory = recentTrans.length > 0 ? 
                    recentTrans.map(t => {
                        const date = new Date(t.timestamp);
                        const time = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                        const icon = t.type === 'in' ? '📥' : '📤';
                        return `${icon} ${time}: ${t.description}`;
                    }).reverse().join('\n') 
                    : 'Chưa có giao dịch nào';
            } catch (transError) {
                console.error("Error processing transactions:", transError);
                transHistory = 'Không thể tải lịch sử giao dịch';
            }

            const response = `⭐️ 【 BÁO CÁO TÀI CHÍNH 】 ⭐️\n\n`+
                `👤 Người dùng: ${userName}\n`+ 
                `💰 Số dư ví: ${balance.toLocaleString('vi-VN')} Xu\n`+
                `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu\n`+
                `💵 Tổng tài sản: ${totalWealth.toLocaleString('vi-VN')} Xu\n\n`+
                `📊 Giao dịch gần đây:\n${transHistory}\n\n`+
                `💫 Lãi suất ngân hàng: 0.1%/ngày\n`+
                `${interest > 0 ? `✨ Bạn nhận được ${interest} Xu tiền lãi!` : ''}`;

            await api.sendMessage(response, threadID, messageID);
        } catch (error) {
            console.error("Balance command error:", error);
            return api.sendMessage("Có lỗi xảy ra khi kiểm tra số dư. Vui lòng thử lại sau.", event.threadID, event.messageID);
        }
    }
};
