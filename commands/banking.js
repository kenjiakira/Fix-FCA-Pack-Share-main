const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { getVIPBenefits } = require('../vip/vipCheck');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const FILES = {
    banking: path.join(__dirname, './json/banking.json'),
    transactions: path.join(__dirname, './json/transactions.json')
};

const LOAN_CONFIG = {
    minAmount: 100,
    maxLoanRatio: 0.5, 
    baseInterestRate: 0.015,
    maxLoanDuration: 7, 
    minimumBalanceAge: 7, 
    creditScoreFactors: {
        transactionHistory: 0.3, 
        repaymentHistory: 0.4,
        balanceStability: 0.3  
    },
    penaltyRate: 0.03,
    collateralRatio: 0.3,
    vipBenefits: {
        1: { 
            maxLoanRatio: 0.8, 
            interestDiscount: 0.1, 
            collateralRequired: true, 
            creditScoreRequired: true 
        },
        2: { 
            maxLoanRatio: 1, 
            interestDiscount: 0.2, 
            collateralRequired: true,
            creditScoreRequired: false
        },
        3: { 
            maxLoanRatio: 1.5, 
            interestDiscount: 0.3, 
            collateralRequired: false,
            creditScoreRequired: false
        }
    }
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
    penalties: {
        latePayment: -10,
        default: -20,
        insufficientFunds: -5
    }
};

const SECURITY_CONFIG = {
    maxLoansPerDay: 1,
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
    transactionTypes: {
        deposit: 'Gửi tiền',
        withdraw: 'Rút tiền',
        loan: 'Vay tiền',
        repay: 'Trả nợ',
        interest: 'Tiền lãi'
    },
    timeRanges: {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
    }
};

const BANK_CONFIG = {
    dailyInterestRate: 0.001,
    vipInterestRates: {
        1: 0.0012,
        2: 0.0015,
        3: 0.002
    },
    achievements: {
        investor: { name: "💎 Nhà Đầu Tư", requirement: 1000000 },
        millionaire: { name: "🏆 Triệu Phú", requirement: 10000000 },
        billionaire: { name: "👑 Tỷ Phú", requirement: 1000000000 },
        trader: { name: "📈 Cao Thủ Giao Dịch", requirement: 50 },
        trustworthy: { name: "⭐ Uy Tín Tuyệt Đối", requirement: 95 }
    },
    defaultPenalty: {
        creditScore: -10,
        interestRate: 0.03,
        maxPenaltyDays: 7,
        blacklistThreshold: 3
    },
    rewards: {
        dailyStreak: {
            3: 50000,
            7: 200000,
            30: 1000000
        }
    },
    riskLevels: {
        low: { threshold: 80, color: "💚", description: "An toàn" },
        medium: { threshold: 50, color: "💛", description: "Bình thường" },
        high: { threshold: 30, color: "❤️", description: "Rủi ro" }
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
    details.transactionScore = {
        score: Math.round(transactionScore * CREDIT_SCORE.factors.transactionVolume.weight),
        total: totalTransactionVolume,
        description: `Khối lượng giao dịch: ${totalTransactionVolume.toLocaleString('vi-VN')} $`
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

    const transferTransactions = transactions.filter(t => t.type === 'out').length;
    const receiveTransactions = transactions.filter(t => t.type === 'in').length;
    
    details.transactionScore = {
        score: Math.round(transactionScore * CREDIT_SCORE.factors.transactionVolume.weight),
        total: totalTransactionVolume,
        description: `Khối lượng giao dịch: ${totalTransactionVolume.toLocaleString('vi-VN')} $`,
        transfers: `Chuyển: ${transferTransactions}, Nhận: ${receiveTransactions}`
    };

    return {
        score: Math.round(creditScore),
        details: details,
        lastUpdated: Date.now()
    };
}

function calculateInterestRate(creditScore, loanAmount, totalAssets) {
    let rate = LOAN_CONFIG.baseInterestRate;
    
    if (creditScore >= 80) rate *= 0.8;
    else if (creditScore >= 60) rate *= 0.9;
    else if (creditScore <= 30) rate *= 1.5;

    const loanRatio = loanAmount / totalAssets;
    if (loanRatio > 0.4) rate *= 1.2;
    else if (loanRatio <= 0.2) rate *= 0.9;

    return rate;
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

function updateBalanceHistory(userId, bankingData, newBalance) {
    const userData = bankingData.users[userId];
    if (!userData.balanceHistory) userData.balanceHistory = [];
    
    userData.balanceHistory.push({
        balance: newBalance,
        timestamp: Date.now()
    });
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    userData.balanceHistory = userData.balanceHistory.filter(h => h.timestamp > thirtyDaysAgo);
}

function isBlacklisted(userId, bankingData) {
    const blacklistEntry = bankingData.blacklist[userId];
    if (!blacklistEntry) return false;
    
    if (Date.now() - blacklistEntry.timestamp > SECURITY_CONFIG.blacklistDuration) {
        delete bankingData.blacklist[userId];
        return false;
    }
    return true;
}

function checkLoanLimit(userId, bankingData) {
    const today = new Date().toDateString();
    const dailyLoans = bankingData.dailyLoans[userId] || {};
    
    if (dailyLoans.date === today) {
        if (dailyLoans.count >= SECURITY_CONFIG.maxLoansPerDay) {
            return false;
        }
    } else {
        bankingData.dailyLoans[userId] = {
            date: today,
            count: 0
        };
    }
    return true;
}

function lockCollateral(userId, amount, bankingData) {
    const userData = bankingData.users[userId];
    if (!userData.lockedCollateral) userData.lockedCollateral = {};
    
    userData.lockedCollateral[Date.now()] = {
        amount: amount,
        unlockTime: Date.now() + (LOAN_CONFIG.maxLoanDuration * 24 * 60 * 60 * 1000)
    };
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
4️⃣ .banking vay [số $] - Vay tiền
5️⃣ .banking trả [số $] - Trả nợ
6️⃣ .banking khoản_vay - Xem nợ
7️⃣ .banking stats - Thống kê
8️⃣ .banking top - Xếp hạng`;
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

    // Tính toán các thống kê
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

    // Tính tăng trưởng
    const oldBalance = userData.balanceHistory.find(h => h.timestamp <= monthAgo)?.balance || 0;
    const currentBalance = userData.bankBalance;
    stats.growth = oldBalance > 0 ? ((currentBalance - oldBalance) / oldBalance * 100).toFixed(2) : 0;

    // Tính xếp hạng
    const allUsers = Object.entries(bankingData.users)
        .sort((a, b) => b[1].bankBalance - a[1].bankBalance);
    stats.rank = allUsers.findIndex(u => u[0] === userId) + 1;

    // Thêm thành tựu
    if (stats.totalDeposits > 1000000) stats.achievements.push("💎 Nhà đầu tư");
    if (stats.growth > 50) stats.achievements.push("📈 Tăng trưởng vượt trội");
    if (userData.creditScore >= 90) stats.achievements.push("⭐ Uy tín cao");

    // Thêm thành tựu mới
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

    // Tính điểm rủi ro với walletBalance được truyền vào
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

async function getTopUsers(bankingData) {
    const users = Object.entries(bankingData.users)
        .map(([id, data]) => ({
            id,
            name: data.name || `User ${id}`,
            totalAssets: data.bankBalance + (data.walletBalance || 0),
            creditScore: data.creditScore || 0
        }))
        .sort((a, b) => b.totalAssets - a.totalAssets)
        .slice(0, 10);

    return users;
}

// Thêm hàm mới để xử lý nợ quá hạn
async function handleOverdueLoan(userId, bankingData) {
    const userData = bankingData.users[userId];
    const loan = bankingData.loans[userId];
    
    if (!loan || loan.status !== 'active') return null;
    
    const daysOverdue = Math.floor((Date.now() - loan.dueDate) / (24 * 60 * 60 * 1000));
    if (daysOverdue <= 0) return null;
    
    const penaltyInfo = {
        daysOverdue,
        originalAmount: loan.remainingAmount,
        penaltyAmount: 0,
        totalDue: loan.remainingAmount,
        status: 'active'
    };

    // Tính tiền phạt
    if (daysOverdue > 0) {
        const penaltyRate = BANK_CONFIG.defaultPenalty.interestRate;
        const maxPenaltyDays = Math.min(daysOverdue, BANK_CONFIG.defaultPenalty.maxPenaltyDays);
        penaltyInfo.penaltyAmount = loan.remainingAmount * penaltyRate * maxPenaltyDays;
        penaltyInfo.totalDue = loan.remainingAmount + penaltyInfo.penaltyAmount;
        
        // Giảm điểm tín dụng
        userData.creditScore = Math.max(0, userData.creditScore + BANK_CONFIG.defaultPenalty.creditScore);
        
        // Kiểm tra điều kiện blacklist
        if (!userData.latePayments) userData.latePayments = 0;
        userData.latePayments++;
        
        if (userData.latePayments >= BANK_CONFIG.defaultPenalty.blacklistThreshold) {
            bankingData.blacklist[userId] = {
                timestamp: Date.now(),
                reason: 'Nhiều lần quá hạn thanh toán',
                strikes: userData.latePayments
            };
            penaltyInfo.status = 'blacklisted';
        }
        
        // Xử lý tài sản thế chấp nếu quá 7 ngày
        if (daysOverdue >= BANK_CONFIG.defaultPenalty.maxPenaltyDays) {
            if (userData.lockedCollateral) {
                const collateralAmount = userData.lockedCollateral;
                userData.bankBalance -= collateralAmount;
                userData.lockedCollateral = 0;
                penaltyInfo.collateralLiquidated = collateralAmount;
                loan.remainingAmount = Math.max(0, penaltyInfo.totalDue - collateralAmount);
                penaltyInfo.status = 'liquidated';
            }
        }
    }
    
    return penaltyInfo;
}

module.exports = {
    name: "banking",
    dev: "HNT",
    category: "Tài Chính",
    onPrefix: true,
    usages: ".banking [gửi/rút/check/vay/trả/khoản_vay]\n",
    info: "Hệ thống ngân hàng trực tuyến với dịch vụ cho vay",
    cooldowns: 3,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        if (!target[0]) {
            return api.sendMessage(getBankingHelp(), threadID, messageID);
        }

        try {
            const { threadID, messageID, senderID } = event;
            
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
                    await saveBankingData(bankingData);
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
                        await saveBankingData(bankingData);
                        await api.sendMessage(`💰 Bạn nhận được ${interest.toLocaleString('vi-VN')} $ tiền lãi!`, threadID);
                    }
                }
            } catch (err) {
                console.error('Lỗi tính tiền lãi:', err);
            }

            if (!target[0]) {
                return api.sendMessage({
                    body: "🏦 NGÂN HÀNG AKI 🏦\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "📌 Hướng dẫn sử dụng:\n" +
                        "1. .banking gửi [số tiền]\n" +
                        "2. .banking rút [số tiền]\n" +
                        "3. .banking check\n" +
                        "4. .banking vay [số tiền]\n" +
                        "5. .banking trả [số tiền]\n" +
                        "6. .banking khoản_vay\n\n" +
                        `💰 Số dư ví: ${walletBalance.toLocaleString('vi-VN')} $\n` +
                        `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} $`
                }, threadID, messageID);
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
                        await saveBankingData(bankingData);
                        
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
                        await saveBankingData(bankingData);
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
                        
                        // Xác định mức độ rủi ro
                        let riskLevel;
                        if (stats.riskScore >= BANK_CONFIG.riskLevels.low.threshold) {
                            riskLevel = BANK_CONFIG.riskLevels.low;
                        } else if (stats.riskScore >= BANK_CONFIG.riskLevels.medium.threshold) {
                            riskLevel = BANK_CONFIG.riskLevels.medium;
                        } else {
                            riskLevel = BANK_CONFIG.riskLevels.high;
                        }
                        
                        let loanStatus = "";
                        if (loan && loan.status === 'active') {
                            const penaltyInfo = await handleOverdueLoan(senderID, bankingData);
                            if (penaltyInfo) {
                                loanStatus = `\n\n⚠️ CẢNH BÁO VAY NỢ ⚠️\n` +
                                    `📅 Quá hạn: ${penaltyInfo.daysOverdue} ngày\n` +
                                    `💰 Tiền phạt: ${formatNumber(penaltyInfo.penaltyAmount)} $\n` +
                                    `💳 Tổng nợ: ${formatNumber(penaltyInfo.totalDue)} $\n` +
                                    `⚠️ Trạng thái: ${penaltyInfo.status === 'blacklisted' ? '🚫 Đã bị cấm' : 
                                                    penaltyInfo.status === 'liquidated' ? '📥 Đã tịch thu tài sản' : 
                                                    '⏳ Đang phạt quá hạn'}`;
                            } else {
                                const daysLeft = Math.ceil((loan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
                                loanStatus = `\n\nKHOẢN VAY HIỆN TẠI\n` +
                                    `💵 Số tiền gốc: ${formatNumber(loan.amount)} $\n` +
                                    `💸 Còn nợ: ${formatNumber(loan.remainingAmount)} $\n` +
                                    `⏳ Còn: ${daysLeft} ngày`;
                            }
                        }

                        const vipInfo = stats.vipStatus.packageId > 0 ? 
                            `\n👑 VIP ${stats.vipStatus.packageId}\n` +
                            `💹 Lãi suất: ${(BANK_CONFIG.vipInterestRates[stats.vipStatus.packageId] * 100).toFixed(2)}%/ngày` : '';

                        const streakReward = Object.entries(BANK_CONFIG.rewards.dailyStreak)
                            .find(([days]) => stats.streak >= parseInt(days));
                        const nextStreak = Object.entries(BANK_CONFIG.rewards.dailyStreak)
                            .find(([days]) => stats.streak < parseInt(days));

                        return api.sendMessage(
                            "🏦 THÔNG TIN TÀI KHOẢN 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
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

                case "vay":
                    try {
                        if (!amount || isNaN(amount) || amount <= 0) {
                            return api.sendMessage("❌ Vui lòng nhập số tiền muốn vay hợp lệ!", threadID, messageID);
                        }

                        const totalAssets = walletBalance + bankBalance;
                        const vipBenefits = getVIPBenefits(senderID);
                        const vipLevel = vipBenefits?.packageId || 0;
                        const vipLoanConfig = LOAN_CONFIG.vipBenefits[vipLevel];
                        let maxLoanAmount = totalAssets * LOAN_CONFIG.maxLoanRatio;

                        if (vipLoanConfig) {
                            maxLoanAmount = totalAssets * vipLoanConfig.maxLoanRatio;
                            
                            if (amount > maxLoanAmount) {
                                return api.sendMessage(
                                    `❌ Với VIP ${vipLevel}, số tiền vay tối đa của bạn là ${formatNumber(maxLoanAmount)} $!`,
                                    threadID, messageID
                                );
                            }

                            const existingLoan = bankingData.loans[senderID];
                            if (existingLoan && existingLoan.status === 'active') {
                                return api.sendMessage(
                                    "❌ Bạn đang có khoản vay chưa thanh toán!\n" +
                                    `💰 Số tiền nợ: ${formatNumber(existingLoan.remainingAmount)} $\n` +
                                    `📅 Hạn trả: ${new Date(existingLoan.dueDate).toLocaleDateString('vi-VN')}`,
                                    threadID, messageID
                                );
                            }

                            let interestRate = calculateInterestRate(100, amount, totalAssets); 
                            interestRate *= (1 - vipLoanConfig.interestDiscount);

                            const interest = Math.ceil(amount * interestRate * LOAN_CONFIG.maxLoanDuration);
                            const totalRepayment = amount + interest;
                            const dueDate = Date.now() + (LOAN_CONFIG.maxLoanDuration * 24 * 60 * 60 * 1000);

                            let requiredCollateral = 0;
                            if (vipLoanConfig.collateralRequired) {
                                requiredCollateral = amount * LOAN_CONFIG.collateralRatio;
                                if (bankBalance < requiredCollateral) {
                                    return api.sendMessage(
                                        `❌ Bạn cần có ít nhất ${formatNumber(requiredCollateral)} $ trong ngân hàng để đảm bảo khoản vay!\n` +
                                        "📝 Số tiền này sẽ bị phong tỏa cho đến khi trả hết nợ.",
                                        threadID, messageID
                                    );
                                }
                                userData.bankBalance -= requiredCollateral;
                                userData.lockedCollateral = requiredCollateral;
                            }

                            // Tạo khoản vay mới
                            bankingData.loans[senderID] = {
                                amount: amount,
                                interest: interest,
                                remainingAmount: totalRepayment,
                                startDate: Date.now(),
                                dueDate: dueDate,
                                status: 'active',
                                collateral: requiredCollateral,
                                interestRate: interestRate,
                                creditScore: 100,
                                isVipLoan: true,
                                vipLevel: vipLevel
                            };

                            await updateBalance(senderID, amount);
                            await saveBankingData(bankingData);

                            return api.sendMessage(
                                "🏦 THÔNG TIN KHOẢN VAY VIP 🏦\n" +
                                "━━━━━━━━━━━━━━━━━━\n" +
                                `👑 Cấp VIP: ${vipLevel}\n` +
                                `💰 Số tiền vay: ${formatNumber(amount)} $\n` +
                                `💹 Lãi suất: ${(interestRate * 100).toFixed(2)}%/ngày\n` +
                                `${requiredCollateral ? `🔒 Tài sản đảm bảo: ${formatNumber(requiredCollateral)} $\n` : ''}` +
                                `💵 Tiền lãi: ${formatNumber(interest)} $\n` +
                                `💳 Tổng số tiền phải trả: ${formatNumber(totalRepayment)} $\n` +
                                `📅 Hạn trả: ${new Date(dueDate).toLocaleDateString('vi-VN')}\n\n` +
                                "✨ Đặc quyền VIP:\n" +
                                `• Giảm ${vipLoanConfig.interestDiscount * 100}% lãi suất\n` +
                                `• ${vipLoanConfig.collateralRequired ? 'Giảm' : 'Miễn'} tài sản đảm bảo\n` +
                                `• Không yêu cầu điểm tín dụng`,
                                threadID, messageID
                            );
                        }

                        if (amount > maxLoanAmount) {
                            return api.sendMessage(
                                `❌ Số tiền vay tối đa là ${maxLoanAmount.toLocaleString('vi-VN')} $ (50% tổng tài sản)!`,
                                threadID, messageID
                            );
                        }

                        const creditScore = calculateCreditScore(senderID, bankingData);
                        const accountAge = (Date.now() - (userData.createdAt || Date.now())) / (24 * 60 * 60 * 1000);
                        
                        if (accountAge < CREDIT_SCORE.factors.accountAge.minAge) {
                            return api.sendMessage(
                                `❌ Tài khoản của bạn cần tối thiểu ${CREDIT_SCORE.factors.accountAge.minAge} ngày tuổi để vay!\n` +
                                `⏳ Thời gian còn lại: ${Math.ceil(CREDIT_SCORE.factors.accountAge.minAge - accountAge)} ngày`,
                                threadID, messageID
                            );
                        }

                        const minRequiredScore = amount > (maxLoanAmount * 0.7) ? 40 : 30;
                        if (creditScore < minRequiredScore) {
                            return api.sendMessage(
                                `❌ Điểm tín dụng tối thiểu để vay ${amount.toLocaleString('vi-VN')} $ là ${minRequiredScore} điểm!\n` +
                                `📊 Điểm tín dụng hiện tại: ${creditScore}\n` +
                                "📝 Hãy thực hiện nhiều giao dịch và duy trì số dư để tăng điểm tín dụng.",
                                threadID, messageID
                            );
                        }

                        userData.creditScore = creditScore;

                        const requiredCollateral = amount * LOAN_CONFIG.collateralRatio;
                        if (bankBalance < requiredCollateral) {
                            return api.sendMessage(
                                `❌ Bạn cần có ít nhất ${requiredCollateral.toLocaleString('vi-VN')} $ trong ngân hàng để đảm bảo khoản vay!\n` +
                                "📝 Số tiền này sẽ bị phong tỏa cho đến khi trả hết nợ.",
                                threadID, messageID
                            );
                        }

                        if (isBlacklisted(senderID, bankingData)) {
                            return api.sendMessage(
                                "❌ Tài khoản của bạn đã bị cấm vay do vi phạm điều khoản!",
                                threadID, messageID
                            );
                        }

                        if (!checkLoanLimit(senderID, bankingData)) {
                            return api.sendMessage(
                                `❌ Bạn đã đạt giới hạn ${SECURITY_CONFIG.maxLoansPerDay} khoản vay trong ngày!`,
                                threadID, messageID
                            );
                        }

                        const existingLoan = bankingData.loans[senderID];
                        if (existingLoan && existingLoan.status === 'active') {
                            return api.sendMessage(
                                "❌ Bạn đang có khoản vay chưa thanh toán!\n" +
                                `💰 Số tiền nợ: ${existingLoan.remainingAmount.toLocaleString('vi-VN')} $\n` +
                                `📅 Hạn trả: ${new Date(existingLoan.dueDate).toLocaleDateString('vi-VN')}`,
                                threadID, messageID
                            );
                        }

                        const interestRate = calculateInterestRate(creditScore, amount, totalAssets);
                        const interest = Math.ceil(amount * interestRate * LOAN_CONFIG.maxLoanDuration);
                        const totalRepayment = amount + interest;
                        const dueDate = Date.now() + (LOAN_CONFIG.maxLoanDuration * 24 * 60 * 60 * 1000);

                        userData.bankBalance -= requiredCollateral;
                        lockCollateral(senderID, requiredCollateral, bankingData);

                        const today = new Date().toDateString();
                        if (!bankingData.dailyLoans[senderID]) {
                            bankingData.dailyLoans[senderID] = { date: today, count: 0 };
                        }
                        bankingData.dailyLoans[senderID].count++;

                        bankingData.loans[senderID] = {
                            amount: amount,
                            interest: interest,
                            remainingAmount: totalRepayment,
                            startDate: Date.now(),
                            dueDate: dueDate,
                            status: 'active',
                            collateral: requiredCollateral,
                            interestRate: interestRate,
                            creditScore: creditScore
                        };

                        await updateBalance(senderID, amount);
                        await saveBankingData(bankingData);
                        
                        return api.sendMessage(
                            "🏦 THÔNG TIN KHOẢN VAY 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `📊 Điểm tín dụng: ${creditScore}/100\n` +
                            `💰 Số tiền vay: ${amount.toLocaleString('vi-VN')} $\n` +
                            `💹 Lãi suất: ${(interestRate * 100).toFixed(2)}%/ngày\n` +
                            `🔒 Tài sản đảm bảo: ${requiredCollateral.toLocaleString('vi-VN')} $\n` +
                            `💵 Tiền lãi: ${interest.toLocaleString('vi-VN')} $\n` +
                            `💳 Tổng số tiền phải trả: ${totalRepayment.toLocaleString('vi-VN')} $\n` +
                            `📅 Hạn trả: ${new Date(dueDate).toLocaleDateString('vi-VN')}\n\n` +
                            "📌 Điều khoản vay:\n" +
                            "1. Khoản vay phải được trả trong 7 ngày\n" +
                            "2. Tài sản đảm bảo sẽ bị phong tỏa\n" +
                            "3. Quá hạn trả sẽ bị phạt 3%/ngày\n" +
                            "4. Xử lý tài sản đảm bảo nếu không trả nợ",
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi xử lý khoản vay:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi xử lý khoản vay!", threadID, messageID);
                    }

                case "trả":
                    try {
                        const loan = bankingData.loans[senderID];
                        if (!loan || loan.status !== 'active') {
                            return api.sendMessage("❌ Bạn không có khoản vay nào đang hoạt động!", threadID, messageID);
                        }

                        let paymentAmount = amount;
                        if (!paymentAmount) {
                            paymentAmount = loan.remainingAmount;
                        }

                        if (paymentAmount > loan.remainingAmount) {
                            return api.sendMessage("❌ Số tiền trả vượt quá số nợ!", threadID, messageID);
                        }

                        if (walletBalance < paymentAmount) {
                            return api.sendMessage("❌ Số dư trong ví không đủ để trả nợ!", threadID, messageID);
                        }

                        await updateBalance(senderID, -paymentAmount);
                        loan.remainingAmount -= paymentAmount;

                        let returnedCollateral = 0;
                        if (loan.remainingAmount <= 0) {
                            loan.status = 'paid';
                            if (userData.lockedCollateral) {
                                returnedCollateral = userData.lockedCollateral;
                                userData.bankBalance += userData.lockedCollateral;
                                userData.lockedCollateral = 0;
                            }
                            
                            if (!bankingData.loans[senderID].history) {
                                bankingData.loans[senderID].history = [];
                            }
                            bankingData.loans[senderID].history.push({
                                amount: loan.amount,
                                startDate: loan.startDate,
                                endDate: Date.now(),
                                status: 'paid',
                                paidOnTime: Date.now() <= loan.dueDate
                            });
                        }

                        await saveBankingData(bankingData);
                        
                        const message = [
                            `✅ Đã trả ${paymentAmount.toLocaleString('vi-VN')} $ cho khoản vay!`
                        ];

                        if (loan.status === 'paid') {
                            message.push('🎉 Chúc mừng! Khoản vay đã được thanh toán đầy đủ!');
                            if (returnedCollateral > 0) {
                                message.push(`💰 Đã hoàn trả ${returnedCollateral.toLocaleString('vi-VN')} $ tài sản đảm bảo!`);
                            }
                        } else {
                            message.push(`📌 Số tiền còn nợ: ${loan.remainingAmount.toLocaleString('vi-VN')} $`);
                        }

                        return api.sendMessage(message.join('\n'), threadID, messageID);
                    } catch (err) {
                        console.error('Lỗi trả nợ:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi trả nợ!", threadID, messageID);
                    }

                case "khoản_vay":
                    try {
                        const userLoan = bankingData.loans[senderID];
                        if (!userLoan || userLoan.status !== 'active') {
                            return api.sendMessage("📌 Bạn không có khoản vay nào đang hoạt động!", threadID, messageID);
                        }

                        const daysLeft = Math.ceil((userLoan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
                        return api.sendMessage(
                            "🏦 THÔNG TIN KHOẢN VAY 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `💰 Số tiền vay gốc: ${userLoan.amount.toLocaleString('vi-VN')} $\n` +
                            `💵 Tiền lãi: ${userLoan.interest.toLocaleString('vi-VN')} $\n` +
                            `💳 Số tiền còn nợ: ${userLoan.remainingAmount.toLocaleString('vi-VN')} $\n` +
                            `⏳ Thời gian còn lại: ${daysLeft} ngày\n` +
                            `📅 Hạn trả: ${new Date(userLoan.dueDate).toLocaleDateString('vi-VN')}`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi kiểm tra khoản vay:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi kiểm tra khoản vay!", threadID, messageID);
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

                case "top":
                    try {
                        const topUsers = await getTopUsers(bankingData);
                        let message = "🏆 BẢNG XẾP HẠNG 🏆\n━━━━━━━━━━━━━━━━━━\n\n";
                        topUsers.forEach((user, index) => {
                            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
                            message += `${medal} Top ${index + 1}: ${user.name}\n`;
                            message += `💰 Tổng tài sản: ${formatNumber(user.totalAssets)} $\n`;
                            message += `📊 Điểm tín dụng: ${user.creditScore}\n\n`;
                        });
                        return api.sendMessage(message, threadID, messageID);
                    } catch (err) {
                        console.error('Lỗi xem bảng xếp hạng:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi xem bảng xếp hạng!", threadID, messageID);
                    }

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n\n" +
                        "📌 Sử dụng:\n" +
                        "1. .banking gửi [số tiền]\n" +
                        "2. .banking rút [số tiền]\n" +
                        "3. .banking check\n" +
                        "4. .banking vay [số tiền]\n" +
                        "5. .banking trả [số tiền]\n" +
                        "6. .banking khoản_vay",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Lỗi tổng thể:', err);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    updateTransaction: async function(userId, type, description, amount) {
        try {
            const bankingData = await loadBankingData();
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

            await saveBankingData(bankingData);
        } catch (err) {
            console.error('Lỗi cập nhật giao dịch:', err);
            throw err; 
        }
    }};