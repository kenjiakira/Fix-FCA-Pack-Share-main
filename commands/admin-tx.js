const fs = require('fs');
const path = require('path');
const getName = require('../utils/getName');

const REAL_MONEY_FILE = path.join(__dirname, 'json', 'real_money.json');
const TRANSACTION_LOG_FILE = path.join(__dirname, 'json', 'transaction_log.json');

// Admin user IDs - Update these with actual admin IDs
const ADMIN_IDS = [
    "61573427362389", // Replace with actual admin Facebook IDs
    "61573427362389"
];

function isAdmin(userID) {
    return ADMIN_IDS.includes(userID);
}

function getRealBalance(userID) {
    try {
        const data = JSON.parse(fs.readFileSync(REAL_MONEY_FILE, 'utf8'));
        return data[userID] || 0;
    } catch (error) {
        return 0;
    }
}

function updateRealBalance(userID, amount) {
    try {
        const data = JSON.parse(fs.readFileSync(REAL_MONEY_FILE, 'utf8'));
        data[userID] = (data[userID] || 0) + amount;
        fs.writeFileSync(REAL_MONEY_FILE, JSON.stringify(data, null, 2));
        return data[userID];
    } catch (error) {
        return 0;
    }
}

function logTransaction(userID, type, amount, details = {}) {
    try {
        const data = JSON.parse(fs.readFileSync(TRANSACTION_LOG_FILE, 'utf8'));
        const transaction = {
            userID,
            type,
            amount,
            timestamp: Date.now(),
            details
        };
        data.transactions.push(transaction);
        fs.writeFileSync(TRANSACTION_LOG_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error logging transaction:', error);
    }
}

module.exports = {
    name: "admin-tx",
    dev: "HNT",
    category: "Admin",
    info: "Quản lý hệ thống tiền thật",
    onPrefix: true,
    hide: true,
    usages: [
        ".admin-tx add [userID] [amount] - Cộng tiền",
        ".admin-tx remove [userID] [amount] - Trừ tiền", 
        ".admin-tx balance [userID] - Xem số dư",
        ".admin-tx stats - Thống kê hệ thống",
        ".admin-tx transactions - Giao dịch gần đây"
    ].join('\n'),

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        
        if (!isAdmin(senderID)) {
            return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này!", threadID, messageID);
        }
        
        if (target.length === 0) {
            return api.sendMessage(
                "『 ADMIN TX - QUẢN LÝ TIỀN THẬT 』\n\n" +
                "💰 QUẢN LÝ SỐ DƯ:\n" +
                "➤ .admin-tx add [userID] [số tiền]\n" +
                "➤ .admin-tx remove [userID] [số tiền]\n" +
                "➤ .admin-tx balance [userID]\n\n" +
                "📊 THỐNG KÊ:\n" +
                "➤ .admin-tx stats\n" +
                "➤ .admin-tx transactions\n" +
                "➤ .admin-tx users",
                threadID, messageID
            );
        }
        
        const action = target[0].toLowerCase();
        
        // Add money to user
        if (action === "add" || action === "cong") {
            const userID = target[1];
            const amount = parseInt(target[2]);
            
            if (!userID || !amount || amount <= 0) {
                return api.sendMessage(
                    "❌ Cú pháp không đúng!\n" +
                    "📝 Sử dụng: .admin-tx add [userID] [số tiền]",
                    threadID, messageID
                );
            }
            
            const oldBalance = getRealBalance(userID);
            const newBalance = updateRealBalance(userID, amount);
            logTransaction(userID, 'admin_add', amount, { adminID: senderID });
            
            return api.sendMessage(
                `✅ CỘNG TIỀN THÀNH CÔNG\n\n` +
                `👤 User: ${getName(userID)}\n` +
                `💰 Số tiền cộng: ${amount.toLocaleString('vi-VN')}đ\n` +
                `📊 Số dư cũ: ${oldBalance.toLocaleString('vi-VN')}đ\n` +
                `📈 Số dư mới: ${newBalance.toLocaleString('vi-VN')}đ`,
                threadID, messageID
            );
        }
        
        // Remove money from user
        if (action === "remove" || action === "tru") {
            const userID = target[1];
            const amount = parseInt(target[2]);
            
            if (!userID || !amount || amount <= 0) {
                return api.sendMessage(
                    "❌ Cú pháp không đúng!\n" +
                    "📝 Sử dụng: .admin-tx remove [userID] [số tiền]",
                    threadID, messageID
                );
            }
            
            const oldBalance = getRealBalance(userID);
            const newBalance = updateRealBalance(userID, -amount);
            logTransaction(userID, 'admin_remove', -amount, { adminID: senderID });
            
            return api.sendMessage(
                `✅ TRỪ TIỀN THÀNH CÔNG\n\n` +
                `👤 User: ${getName(userID)}\n` +
                `💸 Số tiền trừ: ${amount.toLocaleString('vi-VN')}đ\n` +
                `📊 Số dư cũ: ${oldBalance.toLocaleString('vi-VN')}đ\n` +
                `📉 Số dư mới: ${newBalance.toLocaleString('vi-VN')}đ`,
                threadID, messageID
            );
        }
        
        // Check user balance
        if (action === "balance" || action === "sodu") {
            const userID = target[1];
            
            if (!userID) {
                return api.sendMessage(
                    "❌ Vui lòng nhập userID!\n" +
                    "📝 Sử dụng: .admin-tx balance [userID]",
                    threadID, messageID
                );
            }
            
            const balance = getRealBalance(userID);
            
            return api.sendMessage(
                `💰 THÔNG TIN SỐ DƯ\n\n` +
                `👤 User: ${getName(userID)}\n` +
                `🆔 ID: ${userID}\n` +
                `💵 Số dư: ${balance.toLocaleString('vi-VN')}đ`,
                threadID, messageID
            );
        }
        
        // System statistics
        if (action === "stats" || action === "thongke") {
            try {
                const realMoneyData = JSON.parse(fs.readFileSync(REAL_MONEY_FILE, 'utf8'));
                const transactionData = JSON.parse(fs.readFileSync(TRANSACTION_LOG_FILE, 'utf8'));
                
                const totalUsers = Object.keys(realMoneyData).length;
                const totalBalance = Object.values(realMoneyData).reduce((sum, balance) => sum + balance, 0);
                const totalTransactions = transactionData.transactions.length;
                
                // Recent transactions (last 24h)
                const last24h = Date.now() - (24 * 60 * 60 * 1000);
                const recentTransactions = transactionData.transactions.filter(t => t.timestamp > last24h);
                
                const deposits = recentTransactions.filter(t => t.type === 'deposit');
                const withdrawals = recentTransactions.filter(t => t.type === 'withdrawal');
                const bets = recentTransactions.filter(t => t.type === 'bet');
                const wins = recentTransactions.filter(t => t.type === 'win');
                
                return api.sendMessage(
                    `📊 THỐNG KÊ HỆ THỐNG TIỀN THẬT\n\n` +
                    `👥 Tổng người dùng: ${totalUsers}\n` +
                    `💰 Tổng số dư: ${totalBalance.toLocaleString('vi-VN')}đ\n` +
                    `📋 Tổng giao dịch: ${totalTransactions}\n\n` +
                    `📅 THỐNG KÊ 24H QUA:\n` +
                    `💳 Nạp tiền: ${deposits.length} lượt\n` +
                    `💸 Rút tiền: ${withdrawals.length} lượt\n` +
                    `🎲 Cược: ${bets.length} lượt\n` +
                    `🎉 Thắng: ${wins.length} lượt`,
                    threadID, messageID
                );
            } catch (error) {
                return api.sendMessage("❌ Lỗi khi đọc dữ liệu thống kê", threadID, messageID);
            }
        }
        
        // Recent transactions
        if (action === "transactions" || action === "giaodich") {
            try {
                const data = JSON.parse(fs.readFileSync(TRANSACTION_LOG_FILE, 'utf8'));
                const recentTransactions = data.transactions.slice(-20).reverse();
                
                if (recentTransactions.length === 0) {
                    return api.sendMessage("📋 Chưa có giao dịch nào", threadID, messageID);
                }
                
                let message = "📋 GIAO DỊCH GỦI NHẤT (20 giao dịch)\n\n";
                
                recentTransactions.forEach((tx, index) => {
                    const date = new Date(tx.timestamp).toLocaleDateString('vi-VN');
                    const time = new Date(tx.timestamp).toLocaleTimeString('vi-VN');
                    const typeEmoji = {
                        'deposit': '💰',
                        'withdrawal': '💸',
                        'bet': '🎲',
                        'win': '🎉',
                        'admin_add': '➕',
                        'admin_remove': '➖'
                    };
                    
                    message += `${typeEmoji[tx.type] || '📝'} ${tx.type.toUpperCase()}\n`;
                    message += `👤 ${getName(tx.userID)}\n`;
                    message += `💵 ${tx.amount.toLocaleString('vi-VN')}đ\n`;
                    message += `🕐 ${date} ${time}\n`;
                    message += `━━━━━━━━━━━━━━━━━━\n`;
                });
                
                return api.sendMessage(message, threadID, messageID);
            } catch (error) {
                return api.sendMessage("❌ Lỗi khi đọc lịch sử giao dịch", threadID, messageID);
            }
        }
        
        // List users with balance
        if (action === "users" || action === "nguoidung") {
            try {
                const data = JSON.parse(fs.readFileSync(REAL_MONEY_FILE, 'utf8'));
                const users = Object.entries(data)
                    .filter(([userID, balance]) => balance > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 20);
                
                if (users.length === 0) {
                    return api.sendMessage("👥 Chưa có người dùng nào có số dư", threadID, messageID);
                }
                
                let message = "👥 TOP NGƯỜI DÙNG CÓ SỐ DƯ\n\n";
                
                users.forEach(([userID, balance], index) => {
                    const rank = index + 1;
                    const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
                    message += `${rankEmoji} ${getName(userID)}\n`;
                    message += `💰 ${balance.toLocaleString('vi-VN')}đ\n`;
                    message += `🆔 ${userID}\n`;
                    message += `━━━━━━━━━━━━━━━━━━\n`;
                });
                
                return api.sendMessage(message, threadID, messageID);
            } catch (error) {
                return api.sendMessage("❌ Lỗi khi đọc danh sách người dùng", threadID, messageID);
            }
        }
        
        return api.sendMessage(
            "❌ Lệnh không hợp lệ!\n\n" +
            "📝 Các lệnh có sẵn:\n" +
            "• add, remove, balance, stats, transactions, users",
            threadID, messageID
        );
    }
};
