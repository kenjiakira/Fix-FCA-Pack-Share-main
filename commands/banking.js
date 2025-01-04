const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');

const FILES = {
    banking: path.join(__dirname, './json/banking.json'),
    transactions: path.join(__dirname, './json/transactions.json')
};

function initializeBankingData() {
    try {
        if (!fs.existsSync(path.dirname(FILES.banking))) {
            fs.mkdirSync(path.dirname(FILES.banking), { recursive: true });
        }
        if (!fs.existsSync(FILES.banking)) {
            fs.writeFileSync(FILES.banking, JSON.stringify({
                users: {},
                transactions: {}
            }, null, 2));
        }
    } catch (err) {
        console.error('Lỗi khởi tạo dữ liệu banking:', err);
    }
}

function loadBankingData() {
    try {
        initializeBankingData();
        const data = JSON.parse(fs.readFileSync(FILES.banking, 'utf8'));
        return {
            users: data.users || {},
            transactions: data.transactions || {}
        };
    } catch (err) {
        console.error('Lỗi đọc dữ liệu banking:', err);
        return { users: {}, transactions: {} };
    }
}

function saveBankingData(data) {
    try {
        fs.writeFileSync(FILES.banking, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Lỗi lưu dữ liệu banking:', err);
    }
}

module.exports = {
    name: "banking",
    dev: "HNT",
    onPrefix: true,
    usages: ".banking [gửi/rút/chuyển/check] [số tiền] [ID người nhận]",
    info: "Hệ thống ngân hàng trực tuyến",
    cooldowns: 3,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        const bankingData = loadBankingData();
        const walletBalance = await getBalance(senderID);
        
        if (!bankingData.users[senderID]) {
            bankingData.users[senderID] = {
                bankBalance: 0,
                lastInterest: Date.now()
            };
            saveBankingData(bankingData);
        }

        const userData = bankingData.users[senderID];
        const bankBalance = userData.bankBalance || 0;

        const daysPassed = Math.floor((Date.now() - userData.lastInterest) / (24 * 60 * 60 * 1000));
        if (daysPassed > 0) {
            const interest = Math.floor(bankBalance * 0.001 * daysPassed);
            if (interest > 0) {
                userData.bankBalance += interest;
                userData.lastInterest = Date.now();
                saveBankingData(bankingData);
                await api.sendMessage(`💰 Bạn nhận được ${interest.toLocaleString('vi-VN')} Xu tiền lãi!`, threadID);
            }
        }

        if (!target[0]) {
            return api.sendMessage({
                body: "🏦 NGÂN HÀNG AKI 🏦\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "📌 Hướng dẫn sử dụng:\n" +
                    "1. .banking gửi [số tiền]\n" +
                    "2. .banking rút [số tiền]\n" +
                    "3. .banking chuyển [số tiền] [ID]\n" +
                    "4. .banking check\n\n" +
                    `💰 Số dư ví: ${walletBalance.toLocaleString('vi-VN')} Xu\n` +
                    `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu`
            }, threadID, messageID);
        }

        const action = target[0].toLowerCase();
        const amount = parseInt(target[1]);
        const recipient = target[2];

        switch (action) {
            case "gửi":
            case "gui":
                if (!amount || isNaN(amount) || amount <= 0) {
                    return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                }
                if (walletBalance < amount) {
                    return api.sendMessage("❌ Số dư trong ví không đủ!", threadID, messageID);
                }
                await updateBalance(senderID, -amount);
                userData.bankBalance += amount;
                saveBankingData(bankingData);
                return api.sendMessage(
                    `✅ Đã gửi ${amount.toLocaleString('vi-VN')} Xu vào ngân hàng!\n` +
                    `💰 Số dư ví: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu\n` +
                    `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} Xu`,
                    threadID, messageID
                );

            case "rút":
            case "rut":
                if (!amount || isNaN(amount) || amount <= 0) {
                    return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                }
                if (userData.bankBalance < amount) {
                    return api.sendMessage("❌ Số dư trong ngân hàng không đủ!", threadID, messageID);
                }
                userData.bankBalance -= amount;
                await updateBalance(senderID, amount);
                saveBankingData(bankingData);
                return api.sendMessage(
                    `✅ Đã rút ${amount.toLocaleString('vi-VN')} Xu từ ngân hàng!\n` +
                    `💰 Số dư ví: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu\n` +
                    `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} Xu`,
                    threadID, messageID
                );

            case "chuyển":
            case "chuyen":
                if (!amount || isNaN(amount) || amount <= 0) {
                    return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                }
                if (!recipient) {
                    return api.sendMessage("❌ Vui lòng cung cấp ID người nhận!", threadID, messageID);
                }
                if (userData.bankBalance < amount) {
                    return api.sendMessage("❌ Số dư trong ngân hàng không đủ!", threadID, messageID);
                }
                if (!bankingData.users[recipient]) {
                    bankingData.users[recipient] = {
                        balance: 0,
                        bankBalance: 0,
                        lastInterest: Date.now()
                    };
                }

                userData.bankBalance -= amount;
                bankingData.users[recipient].bankBalance += amount;
                saveBankingData(bankingData);

                this.updateTransaction(senderID, 'out', `Chuyển cho ${recipient}: ${amount.toLocaleString('vi-VN')} Xu`, amount);
                this.updateTransaction(recipient, 'in', `Nhận từ ${senderID}: ${amount.toLocaleString('vi-VN')} Xu`, amount);
                return api.sendMessage(
                    `✅ Đã chuyển ${amount.toLocaleString('vi-VN')} Xu đến ${recipient}!\n` +
                    `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} Xu`,
                    threadID, messageID
                );

            case "check":
                const transactions = bankingData.transactions[senderID] || [];
                const recentTrans = transactions.slice(-5);
                const transHistory = recentTrans.length > 0 ? 
                    recentTrans.map(t => {
                        const date = new Date(t.timestamp);
                        return `${t.type === 'in' ? '📥' : '📤'} ${date.toLocaleTimeString()}: ${t.description}`;
                    }).reverse().join('\n') 
                    : 'Chưa có giao dịch nào';

                return api.sendMessage(
                    "🏦 THÔNG TIN TÀI KHOẢN 🏦\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    `💰 Số dư ví: ${walletBalance.toLocaleString('vi-VN')} Xu\n` +
                    `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu\n` +
                    `💵 Tổng tài sản: ${(walletBalance + bankBalance).toLocaleString('vi-VN')} Xu\n\n` +
                    `📝 Lịch sử giao dịch:\n${transHistory}`,
                    threadID, messageID
                );

            default:
                return api.sendMessage(
                    "❌ Lệnh không hợp lệ!\n\n" +
                    "📌 Sử dụng:\n" +
                    "1. .banking gửi [số tiền]\n" +
                    "2. .banking rút [số tiền]\n" +
                    "3. .banking chuyển [số tiền] [ID]\n" +
                    "4. .banking check",
                    threadID, messageID
                );
        }
    },

    updateTransaction: function(userId, type, description, amount) {
        try {
            const bankingData = loadBankingData();
            if (!bankingData.transactions) bankingData.transactions = {};
            if (!bankingData.transactions[userId]) {
                bankingData.transactions[userId] = [];
            }
            
            bankingData.transactions[userId].push({
                type,
                description,
                amount,
                timestamp: Date.now()
            });

            if (bankingData.transactions[userId].length > 10) {
                bankingData.transactions[userId] = bankingData.transactions[userId].slice(-10);
            }

            saveBankingData(bankingData);
        } catch (err) {
            console.error('Lỗi cập nhật giao dịch:', err);
        }
    }
};
