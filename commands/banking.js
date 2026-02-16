const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { getVIPBenefits } = require('../game/vip/vipCheck');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const FILES = {
    banking: path.join(__dirname, '../database/json/currencies/banking.json')
};


const CREDIT_SCORE = {
    minScore: 0,
    maxScore: 100,
    defaultScore: 50,
    factors: {
        transactionVolume: {
            weight: 0.25,
            threshold: 1000000,
        },
        accountAge: {
            weight: 0.30,
            threshold: 30,
            minAge: 3,
        },
        balanceStability: {
            weight: 0.20,
            minBalance: 100000,
            duration: 7,
        },
        loanHistory: {
            weight: 0.25,
            successfulPayments: 5,
        }
    },
};

const SECURITY_CONFIG = {
    blacklistDuration: 30 * 24 * 60 * 60 * 1000,
    minTransactionAmount: 10000,
    minTransactionInterval: 5 * 60 * 1000,
    creditScore: {
        minTransactionAmount: 50000,
        dailyTransactionLimit: 10,
        minTransactionInterval: 30 * 60 * 1000
    }
};

const STATS_CONFIG = {
    timeRanges: {
        month: 30 * 24 * 60 * 60 * 1000
    }
};

const BANK_CONFIG = {
    vipInterestRates: {
        3: 0.002
    },
    achievements: {
        millionaire: { name: "🏆 Triệu Phú", requirement: 10000000 },
        billionaire: { name: "👑 Tỷ Phú", requirement: 1000000000 },
        trader: { name: "📈 Cao Thủ Giao Dịch", requirement: 50 },
        trustworthy: { name: "⭐ Uy Tín Tuyệt Đối", requirement: 95 }
    },
    rewards: {
        dailyStreak: {
            3: 50000,
            7: 200000,
            30: 1000000
        }
    }
};

function calculateCreditScore(userId, bankingData) {
    const userData = bankingData.users[userId];
    if (!userData) return CREDIT_SCORE.defaultScore;

    const transactions = bankingData.transactions[userId] || [];
    const activeLoan = bankingData.loans[userId];
    const loanHistory = bankingData.loans[userId]?.history || [];
    let score = 0;

    const validTransactions = transactions.filter(t => {
        const isValidAmount = t.amount >= SECURITY_CONFIG.creditScore.minTransactionAmount;
        const hasMinInterval = transactions.every(other =>
            t === other ||
            Math.abs(t.timestamp - other.timestamp) >= SECURITY_CONFIG.creditScore.minTransactionInterval
        );
        return isValidAmount && hasMinInterval;
    });

    const dailyTransactions = {};
    validTransactions.forEach(t => {
        const date = new Date(t.timestamp).toDateString();
        dailyTransactions[date] = (dailyTransactions[date] || 0) + 1;
    });

    const validTransactionVolume = validTransactions
        .filter(t => dailyTransactions[new Date(t.timestamp).toDateString()] <= SECURITY_CONFIG.creditScore.dailyTransactionLimit)
        .reduce((sum, t) => sum + t.amount, 0);

    const transactionScore = Math.min(100, (validTransactionVolume / CREDIT_SCORE.factors.transactionVolume.threshold) * 120);
    score += transactionScore * CREDIT_SCORE.factors.transactionVolume.weight;

    const successfulTransactions = transactions.length;
    const transactionCountScore = Math.min(100, (successfulTransactions / 10) * 100);
    score += transactionCountScore * 0.2;

    const accountAge = (Date.now() - (userData.createdAt || Date.now())) / (24 * 60 * 60 * 1000);
    if (accountAge < CREDIT_SCORE.factors.accountAge.minAge) {
        score += 0;
    } else {
        const ageScore = Math.min(100, (accountAge / CREDIT_SCORE.factors.accountAge.threshold) * 100);
        score += ageScore * CREDIT_SCORE.factors.accountAge.weight;
    }

    let balanceScore = 0;
    if (userData.bankBalance >= CREDIT_SCORE.factors.balanceStability.minBalance) {
        const hasStableBalance = userData.balanceHistory?.some(h =>
            h.balance >= CREDIT_SCORE.factors.balanceStability.minBalance &&
            Date.now() - h.timestamp <= CREDIT_SCORE.factors.balanceStability.duration * 24 * 60 * 60 * 1000
        );
        if (hasStableBalance) balanceScore = 100;
    }
    score += balanceScore * CREDIT_SCORE.factors.balanceStability.weight;

    let loanScore = 0;
    if (loanHistory.length > 0) {
        const successfulPayments = loanHistory.filter(loan =>
            loan.status === 'paid' && loan.paidOnTime
        ).length;
        loanScore = Math.min(100, (successfulPayments / CREDIT_SCORE.factors.loanHistory.successfulPayments) * 100);
    } else if (!activeLoan) {
        loanScore = 50;
    }
    score += loanScore * CREDIT_SCORE.factors.loanHistory.weight;

    if (userData.penalties) {
        userData.penalties.forEach(penalty => {
            score += penalty.points;
        });
    }

    const recentTransactions = transactions.filter(t =>
        Date.now() - t.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    if (recentTransactions.length >= 5) {
        score += 10;
    }

    return Math.max(CREDIT_SCORE.minScore, Math.min(CREDIT_SCORE.maxScore, Math.round(score)));
}

function calculateDetailedCreditScore(userId, bankingData) {
    const userData = bankingData.users[userId] || {};
    const transactions = bankingData.transactions[userId] || [];
    const activeLoan = bankingData.loans[userId];
    const loanHistory = bankingData.loans[userId]?.history || [];
    let creditScore = CREDIT_SCORE.defaultScore;
    let details = {};

    const totalTransactionVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionScore = Math.min(100, (totalTransactionVolume / CREDIT_SCORE.factors.transactionVolume.threshold) * 100);
    const transferTransactions = transactions.filter(t => t.type === 'out').length;
    const receiveTransactions = transactions.filter(t => t.type === 'in').length;
    details.transactionScore = {
        score: Math.round(transactionScore * CREDIT_SCORE.factors.transactionVolume.weight),
        total: totalTransactionVolume,
        description: `Khối lượng giao dịch: ${totalTransactionVolume.toLocaleString('vi-VN')} $`,
        transfers: `Chuyển: ${transferTransactions}, Nhận: ${receiveTransactions}`
    };

    const accountAge = (Date.now() - (userData.createdAt || Date.now())) / (24 * 60 * 60 * 1000);
    const ageScore = Math.min(100, (accountAge / CREDIT_SCORE.factors.accountAge.threshold) * 100);
    details.ageScore = {
        score: Math.round(ageScore * CREDIT_SCORE.factors.accountAge.weight),
        days: Math.round(accountAge),
        description: `Tuổi tài khoản: ${Math.round(accountAge)} ngày`
    };

    let stabilityScore = 0;
    if (userData.balanceHistory) {
        const recentBalances = userData.balanceHistory.filter(b =>
            b.timestamp > Date.now() - (CREDIT_SCORE.factors.balanceStability.duration * 24 * 60 * 60 * 1000)
        );
        const hasStableBalance = recentBalances.every(b => b.balance >= CREDIT_SCORE.factors.balanceStability.minBalance);
        stabilityScore = hasStableBalance ? 100 : Math.min(100,
            (userData.bankBalance / CREDIT_SCORE.factors.balanceStability.minBalance) * 50
        );
    }

    details.stabilityScore = {
        score: Math.round(stabilityScore * CREDIT_SCORE.factors.balanceStability.weight),
        description: `Độ ổn định số dư: ${Math.min(100, Math.round(stabilityScore))}%`
    };

    let loanScore = 0;
    if (loanHistory.length > 0 || activeLoan) {
        const successfulPayments = loanHistory.filter(loan =>
            loan.status === 'paid' && loan.paidOnTime
        ).length;

        if (activeLoan && activeLoan.status === 'active') {
            const isOverdue = Date.now() > activeLoan.dueDate;
            if (isOverdue) {
                loanScore = Math.max(0, Math.min(50, successfulPayments * 10));
            } else {
                loanScore = Math.min(100, ((successfulPayments + 1) * 20));
            }
        } else {
            loanScore = Math.min(100, (successfulPayments * 20));
        }
    }

    details.loanScore = {
        score: Math.round(loanScore * CREDIT_SCORE.factors.loanHistory.weight),
        description: `Lịch sử vay: ${loanScore}%`,
        activeLoan: activeLoan ? {
            amount: activeLoan.amount,
            remainingAmount: activeLoan.remainingAmount,
            dueDate: activeLoan.dueDate
        } : null
    };

    creditScore = Object.values(details).reduce((sum, detail) => sum + detail.score, 0);

    if (userData.penalties) {
        creditScore += userData.penalties.reduce((total, penalty) => total + penalty.points, 0);
    }

    creditScore = Math.max(CREDIT_SCORE.minScore, Math.min(CREDIT_SCORE.maxScore, creditScore));

    return {
        score: Math.round(creditScore),
        details: details,
        lastUpdated: Date.now()
    };
}


function initializeBankingData() {
    try {
        if (!fs.existsSync(path.dirname(FILES.banking))) {
            fs.mkdirSync(path.dirname(FILES.banking), { recursive: true });
        }
        if (!fs.existsSync(FILES.banking)) {
            fs.writeFileSync(FILES.banking, JSON.stringify({
                users: {},
                transactions: {},
                loans: {},
                blacklist: {},
                dailyLoans: {}
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
            transactions: data.transactions || {},
            loans: data.loans || {},
            blacklist: data.blacklist || {},
            dailyLoans: data.dailyLoans || {}
        };
    } catch (err) {
        console.error('Lỗi đọc dữ liệu banking:', err);
        return { users: {}, transactions: {}, loans: {}, blacklist: {}, dailyLoans: {} };
    }
}

function saveBankingData(data) {
    try {
        fs.writeFileSync(FILES.banking, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Lỗi lưu dữ liệu banking:', err);
    }
}

function initializeUserData(userId, bankingData) {
    if (!bankingData.users[userId]) {
        bankingData.users[userId] = {
            bankBalance: 0,
            lastInterest: Date.now(),
            createdAt: Date.now(),
            balanceHistory: [],
            penalties: [],
            creditScore: CREDIT_SCORE.defaultScore
        };
    }

    bankingData.users[userId].creditScore = calculateCreditScore(userId, bankingData);
    return bankingData.users[userId];
}


function validateTransaction(userId, bankingData, amount) {
    const transactions = bankingData.transactions[userId] || [];
    const lastTransaction = transactions[transactions.length - 1];

    if (amount < SECURITY_CONFIG.minTransactionAmount) {
        return { valid: false, reason: "Số tiền giao dịch quá nhỏ!" };
    }

    if (lastTransaction &&
        Date.now() - lastTransaction.timestamp < SECURITY_CONFIG.minTransactionInterval) {
        return { valid: false, reason: "Vui lòng đợi ít phút giữa các giao dịch!" };
    }

    return { valid: true };
}

const getBankingHelp = () => {
    return `🏦 NGÂN HÀNG AKI 🏦

💰 Số dư & Lãi suất
• Lãi: 0.1%/ngày
• Tính lãi: Mỗi lần check
• Yêu cầu: Duy trì số dư tối thiểu

📊 Điểm tín dụng (0-100)
• Giao dịch (30%)
• Trả nợ (40%)
• Số dư (30%)

💡 Lệnh:
1️⃣ .banking check - Xem số dư
2️⃣ .banking gửi [số $] - Gửi tiền
3️⃣ .banking rút [số $] - Rút tiền
4️⃣ .banking stats - Thống kê

💰 Vay tiền: Sử dụng .loan vay [số $]`;
};

async function calculateUserStats(userId, bankingData, walletBalance = 0) {
    const userData = bankingData.users[userId];
    const transactions = bankingData.transactions[userId] || [];
    const now = Date.now();
    const monthAgo = now - STATS_CONFIG.timeRanges.month;

    const stats = {
        totalDeposits: 0,
        totalWithdraws: 0,
        totalLoans: 0,
        totalInterest: 0,
        growth: 0,
        rank: 1,
        achievements: [],
        streak: userData.dailyStreak || 0,
        vipStatus: await getVIPBenefits(userId) || { packageId: 0 },
        riskScore: 0,
        lastActivity: userData.lastActivity || 0,
        transactionCount: transactions.length
    };

    transactions.forEach(t => {
        if (t.timestamp > monthAgo) {
            switch (t.type) {
                case 'deposit': stats.totalDeposits += t.amount; break;
                case 'withdraw': stats.totalWithdraws += t.amount; break;
                case 'loan': stats.totalLoans += t.amount; break;
                case 'interest': stats.totalInterest += t.amount; break;
            }
        }
    });

    const oldBalance = userData.balanceHistory.find(h => h.timestamp <= monthAgo)?.balance || 0;
    const currentBalance = userData.bankBalance;
    stats.growth = oldBalance > 0 ? ((currentBalance - oldBalance) / oldBalance * 100).toFixed(2) : 0;

    const allUsers = Object.entries(bankingData.users)
        .sort((a, b) => b[1].bankBalance - a[1].bankBalance);
    stats.rank = allUsers.findIndex(u => u[0] === userId) + 1;

    if (stats.totalDeposits > 1000000) stats.achievements.push("💎 Nhà đầu tư");
    if (stats.growth > 50) stats.achievements.push("📈 Tăng trưởng vượt trội");
    if (userData.creditScore >= 90) stats.achievements.push("⭐ Uy tín cao");

    if (userData.bankBalance >= BANK_CONFIG.achievements.millionaire.requirement) {
        stats.achievements.push(BANK_CONFIG.achievements.millionaire.name);
    }
    if (userData.bankBalance >= BANK_CONFIG.achievements.billionaire.requirement) {
        stats.achievements.push(BANK_CONFIG.achievements.billionaire.name);
    }
    if (transactions.length >= BANK_CONFIG.achievements.trader.requirement) {
        stats.achievements.push(BANK_CONFIG.achievements.trader.name);
    }
    if (userData.creditScore >= BANK_CONFIG.achievements.trustworthy.requirement) {
        stats.achievements.push(BANK_CONFIG.achievements.trustworthy.name);
    }

    const creditScore = userData.creditScore || CREDIT_SCORE.defaultScore;
    const totalBalance = userData.bankBalance + walletBalance;
    const balanceRatio = totalBalance > 0 ? userData.bankBalance / totalBalance : 0;
    stats.riskScore = Math.min(100,
        (creditScore * 0.4) +
        (balanceRatio * 50 * 0.3) +
        (stats.streak * 2 * 0.3)
    );

    return stats;
}

module.exports = {
    name: "banking",
    dev: "HNT",
    category: "Tài Chính",
    onPrefix: true,
    usages: ".banking [gửi/rút/check/stats]\n",
    info: "Hệ thống ngân hàng trực tuyến",
    cooldowns: 3,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(getBankingHelp(), threadID, messageID);
        }

        try {
            const bankingData = loadBankingData();
            let walletBalance;
            try {
                walletBalance = await getBalance(senderID);
            } catch (err) {
                console.error('Lỗi lấy số dư ví:', err);
                walletBalance = 0;
            }

            if (!bankingData.users[senderID]) {
                try {
                    bankingData.users[senderID] = initializeUserData(senderID, bankingData);
                    saveBankingData(bankingData);
                } catch (err) {
                    console.error('Lỗi khởi tạo dữ liệu user:', err);
                    return api.sendMessage("❌ Có lỗi xảy ra khi khởi tạo tài khoản!", threadID, messageID);
                }
            }

            const userData = bankingData.users[senderID];
            const bankBalance = userData.bankBalance || 0;

            try {
                const daysPassed = Math.floor((Date.now() - userData.lastInterest) / (24 * 60 * 60 * 1000));
                if (daysPassed > 0) {
                    const interest = Math.floor(bankBalance * 0.001 * daysPassed);
                    if (interest > 0) {
                        userData.bankBalance += interest;
                        userData.lastInterest = Date.now();
                        saveBankingData(bankingData);
                        await api.sendMessage(`💰 Bạn nhận được ${interest.toLocaleString('vi-VN')} $ tiền lãi!`, threadID);
                    }
                }
            } catch (err) {
                console.error('Lỗi tính tiền lãi:', err);
            }

            const action = target[0].toLowerCase();
            const amount = parseInt(target[1]);

            switch (action) {
                case "gửi":
                case "gui":
                    try {
                        if (!amount || isNaN(amount) || amount <= 0) {
                            return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                        }
                        const currentBalance = await getBalance(senderID);
                        if (currentBalance < amount) {
                            return api.sendMessage("❌ Số dư trong ví không đủ!", threadID, messageID);
                        }
                        await updateBalance(senderID, -amount);
                        userData.bankBalance += amount;
                        saveBankingData(bankingData);

                        const newBalance = await getBalance(senderID);
                        return api.sendMessage(
                            `✅ Đã gửi ${amount.toLocaleString('vi-VN')} $ vào ngân hàng!\n` +
                            `💰 Số dư ví: ${newBalance.toLocaleString('vi-VN')} $\n` +
                            `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} $`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi gửi tiền:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi gửi tiền!", threadID, messageID);
                    }

                case "rút":
                case "rut":
                    try {
                        if (!amount || isNaN(amount) || amount <= 0) {
                            return api.sendMessage("❌ Vui lòng nhập số tiền hợp lệ!", threadID, messageID);
                        }
                        const validationResult = validateTransaction(senderID, bankingData, amount);
                        if (!validationResult.valid) {
                            return api.sendMessage(validationResult.reason, threadID, messageID);
                        }
                        if (userData.bankBalance < amount) {
                            return api.sendMessage("❌ Số dư trong ngân hàng không đủ!", threadID, messageID);
                        }
                        const lockedAmount = Object.values(userData.lockedCollateral || {})
                            .reduce((sum, lock) => {
                                if (lock.unlockTime > Date.now()) return sum + lock.amount;
                                return sum;
                            }, 0);

                        if (userData.bankBalance - amount < lockedAmount) {
                            return api.sendMessage(
                                "❌ Không thể rút tiền đã được phong tỏa làm tài sản đảm bảo!",
                                threadID, messageID
                            );
                        }
                        userData.bankBalance -= amount;
                        await updateBalance(senderID, amount);
                        saveBankingData(bankingData);
                        return api.sendMessage(
                            `✅ Đã rút ${amount.toLocaleString('vi-VN')} $ từ ngân hàng!\n` +
                            `💰 Số dư ví: ${(await getBalance(senderID)).toLocaleString('vi-VN')} $\n` +
                            `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} $`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi rút tiền:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi rút tiền!", threadID, messageID);
                    }

                case "check":
                    try {
                        const creditInfo = calculateDetailedCreditScore(senderID, bankingData);
                        const stats = await calculateUserStats(senderID, bankingData, walletBalance);
                        const loan = bankingData.loans[senderID];

                        const nextStreak = Object.entries(BANK_CONFIG.rewards.dailyStreak)
                            .find(([days]) => stats.streak < parseInt(days));

                        const riskLevel = stats.riskScore >= 80
                            ? { color: "💚", description: "An toàn" }
                            : stats.riskScore >= 50
                                ? { color: "💛", description: "Bình thường" }
                                : { color: "❤️", description: "Rủi ro" };

                        const vipInfo = stats.vipStatus.packageId === 3 ?
                            `\n👑 VIP Gold\n` +
                            `💹 Lãi suất: ${(BANK_CONFIG.vipInterestRates[3] * 100).toFixed(2)}%/ngày` : '';

                        const streakReward = Object.entries(BANK_CONFIG.rewards.dailyStreak)
                            .filter(([days]) => stats.streak >= parseInt(days))
                            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))[0];

                        const loanStatus = loan && loan.status === 'active'
                            ? `\n\n💰 KHOẢN VAY\n` +
                            `├─ Số tiền vay: ${formatNumber(loan.amount)} $\n` +
                            `├─ Còn nợ: ${formatNumber(loan.remainingAmount)} $\n` +
                            `└─ Hạn trả: ${new Date(loan.dueDate).toLocaleDateString('vi-VN')}`
                            : '';

                        return api.sendMessage(
                            "🏦 THÔNG TIN TÀI KHOẢN 🏦\n" +
                            "━━━━━━━━━━\n" +
                            `💰 Số dư ví: ${formatNumber(walletBalance)} $\n` +
                            `🏦 Số dư ngân hàng: ${formatNumber(bankBalance)} $\n` +
                            `💵 Tổng tài sản: ${formatNumber(walletBalance + bankBalance)} $\n` +
                            `${vipInfo}\n\n` +
                            `📊 CHỈ SỐ TÀI CHÍNH\n` +
                            `├─ Điểm tín dụng: ${creditInfo.score}/100\n` +
                            `├─ Độ tin cậy: ${riskLevel.color} ${riskLevel.description}\n` +
                            `├─ Xếp hạng: #${stats.rank}\n` +
                            `└─ Giao dịch: ${stats.transactionCount} lần\n\n` +
                            `🔥 CHUỖI HOẠT ĐỘNG\n` +
                            `├─ Hiện tại: ${stats.streak} ngày\n` +
                            `${streakReward ? `├─ Đạt mốc: ${streakReward[0]} ngày (${formatNumber(streakReward[1])} $)\n` : ''}` +
                            `${nextStreak ? `└─ Mốc tiếp: ${nextStreak[0]} ngày (${formatNumber(nextStreak[1])} $)` : ''}` +
                            `\n\n🏆 THÀNH TỰU\n${stats.achievements.length > 0 ? stats.achievements.join('\n') : '❌ Chưa có thành tựu nào'}` +
                            loanStatus,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi kiểm tra tài khoản:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi kiểm tra tài khoản!", threadID, messageID);
                    }

                case "stats":
                    try {
                        const stats = await calculateUserStats(senderID, bankingData, walletBalance);
                        return api.sendMessage(
                            "📊 THỐNG KÊ TÀI CHÍNH 📊\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `💰 Tổng gửi: ${formatNumber(stats.totalDeposits)} $\n` +
                            `📤 Tổng rút: ${formatNumber(stats.totalWithdraws)} $\n` +
                            `💸 Tổng vay: ${formatNumber(stats.totalLoans)} $\n` +
                            `💵 Lãi nhận được: ${formatNumber(stats.totalInterest)} $\n\n` +
                            `📈 Tăng trưởng (30 ngày): ${stats.growth > 0 ? '+' : ''}${stats.growth}%\n` +
                            `⭐ Xếp hạng: #${stats.rank}\n` +
                            `🏆 Thành tựu đạt được: ${stats.achievements.length}`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi xem thống kê:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi xem thống kê!", threadID, messageID);
                    }

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n\n" +
                        "📌 Sử dụng:\n" +
                        "1. .banking gửi [số tiền]\n" +
                        "2. .banking rút [số tiền]\n" +
                        "3. .banking check\n" +
                        "4. .banking stats\n\n" +
                        "💰 Vay tiền: .loan vay [số tiền]",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Lỗi tổng thể:', err);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    updateTransaction: function (userId, type, description, amount) {
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
            throw err;
        }
    }
};