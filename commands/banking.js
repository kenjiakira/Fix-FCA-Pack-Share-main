const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const FILES = {
    banking: path.join(__dirname, './json/banking.json'),
    transactions: path.join(__dirname, './json/transactions.json')
};

const LOAN_CONFIG = {
    minAmount: 1000,
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
            maxLoanRatio: 1.5, // Có thể vay 150% tổng tài sản
            interestDiscount: 0.3, // Giảm 30% lãi suất 
            collateralRequired: false, // Không cần tài sản đảm bảo
            creditScoreRequired: false // Không cần điểm tín dụng
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
        description: `Khối lượng giao dịch: ${totalTransactionVolume.toLocaleString('vi-VN')} Xu`
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
        description: `Khối lượng giao dịch: ${totalTransactionVolume.toLocaleString('vi-VN')} Xu`,
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
    return `🏦 ĐIỀU KHOẢN NGÂN HÀNG AKI 🏦
━━━━━━━━━━━━━━━━━━━━━

💰 Số dư tài khoản (Bank Balance)
- Mô tả: Số tiền hiện có trong tài khoản
- Ví dụ: 1,000,000 Xu

💹 Lãi suất (Interest Rate)
- Thời điểm tính lãi: Mỗi lần check số dư
- Mô tả: Tỷ lệ lãi suất áp dụng cho số dư
- Mức lãi: 0.1% mỗi ngày (3% mỗi tháng)
- Thời điểm tính lãi: Mỗi lần check số dư

⏰ Thời gian tính lãi
- Mô tả: Thời điểm cuối được tính lãi
- Chu kỳ: 24 giờ một lần
- Yêu cầu: Duy trì số dư tối thiểu

📊 Lịch sử số dư
- Ghi chép tất cả giao dịch:
  • Nạp/rút tiền
  • Tiền lãi nhận được
  • Các khoản vay và trả nợ
  • Phí phạt (nếu có)

❌ Phạt (Penalties)
- Mô tả: Các khoản phạt vi phạm
- Phạt trễ hạn khoản vay: 3%/ngày
- Phạt thanh toán trễ: 5% số tiền
- Ảnh hưởng: Giảm điểm tín dụng

📈 Điểm tín dụng
- Thang điểm: 0-100
- Ảnh hưởng bởi:
  • Lịch sử giao dịch (30%)
  • Trả nợ đúng hạn (40%) 
  • Duy trì số dư (30%)

🔒 Tài sản thế chấp
- Mô tả: Tài sản đảm bảo khoản vay
- Tỷ lệ: 30% giá trị khoản vay
- Khóa đến khi trả hết nợ
- Xử lý khi vỡ nợ

⚠️ Lưu ý quan trọng:
1. Bảo mật thông tin tài khoản
2. Duy trì số dư để hưởng lãi
3. Trả nợ đúng hạn tránh phạt
4. Giữ điểm tín dụng tốt

💡 Sử dụng lệnh:
1. .banking check - Xem số dư
2. .banking gửi [số xu] - Gửi tiền
3. .banking rút [số xu] - Rút tiền
4. .banking vay [số xu] - Vay tiền
5. .banking trả [số xu] - Trả nợ
6. .banking khoản_vay - Xem nợ`;
};

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
                        await api.sendMessage(`💰 Bạn nhận được ${interest.toLocaleString('vi-VN')} Xu tiền lãi!`, threadID);
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
                        `💰 Số dư ví: ${walletBalance.toLocaleString('vi-VN')} Xu\n` +
                        `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu`
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
                            `✅ Đã gửi ${amount.toLocaleString('vi-VN')} Xu vào ngân hàng!\n` +
                            `💰 Số dư ví: ${newBalance.toLocaleString('vi-VN')} Xu\n` +
                            `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} Xu`,
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
                            `✅ Đã rút ${amount.toLocaleString('vi-VN')} Xu từ ngân hàng!\n` +
                            `💰 Số dư ví: ${(await getBalance(senderID)).toLocaleString('vi-VN')} Xu\n` +
                            `🏦 Số dư ngân hàng: ${userData.bankBalance.toLocaleString('vi-VN')} Xu`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi rút tiền:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi rút tiền!", threadID, messageID);
                    }

                case "check":
                    try {
                        const creditInfo = calculateDetailedCreditScore(senderID, bankingData);
                        const transactions = bankingData.transactions[senderID] || [];
                        const activeLoan = bankingData.loans[senderID];
                        const recentTrans = transactions.slice(-3);
                        const transHistory = recentTrans.length > 0 ? 
                            recentTrans.map(t => {
                                const date = new Date(t.timestamp);
                                return `${t.type === 'in' ? '📥' : '📤'} ${t.description}`;
                            }).reverse().join('\n') 
                            : 'Chưa có giao dịch nào';

                        let loanInfo = "";
                        if (activeLoan && activeLoan.status === 'active') {
                            const daysLeft = Math.ceil((activeLoan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
                            loanInfo = "\n\n📝 KHOẢN VAY HIỆN TẠI:\n" +
                                     `💰 Số tiền còn nợ: ${activeLoan.remainingAmount.toLocaleString('vi-VN')} Xu\n` +
                                     `⏳ Thời gian còn lại: ${daysLeft} ngày\n` +
                                     `📅 Hạn trả: ${new Date(activeLoan.dueDate).toLocaleDateString('vi-VN')}`;
                        }

                        return api.sendMessage(
                            "🏦 THÔNG TIN TÀI KHOẢN 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n" +
                            `💰 Số dư ví: ${walletBalance.toLocaleString('vi-VN')} Xu\n` +
                            `🏦 Số dư ngân hàng: ${bankBalance.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tổng tài sản: ${(walletBalance + bankBalance).toLocaleString('vi-VN')} Xu\n\n` +
                            `📊 Điểm tín dụng: ${creditInfo.score}/100\n` +
                            `├─ Giao dịch: ${Math.min(100, Math.round(creditInfo.details.transactionScore.score))}%\n` +
                            `├─ Độ tuổi tài khoản: ${creditInfo.details.ageScore.days} ngày\n` +
                            `├─ Độ ổn định: ${Math.min(100, Math.round(creditInfo.details.stabilityScore.score))}%\n` +
                            `└─ Lịch sử vay: ${Math.round(creditInfo.details.loanScore.score * 100)}%\n\n` +
                            `📝 Giao dịch gần đây:\n${transHistory}${loanInfo}`,
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
                                    `❌ Với VIP ${vipLevel}, số tiền vay tối đa của bạn là ${formatNumber(maxLoanAmount)} Xu!`,
                                    threadID, messageID
                                );
                            }

                            const existingLoan = bankingData.loans[senderID];
                            if (existingLoan && existingLoan.status === 'active') {
                                return api.sendMessage(
                                    "❌ Bạn đang có khoản vay chưa thanh toán!\n" +
                                    `💰 Số tiền nợ: ${formatNumber(existingLoan.remainingAmount)} Xu\n` +
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
                                        `❌ Bạn cần có ít nhất ${formatNumber(requiredCollateral)} Xu trong ngân hàng để đảm bảo khoản vay!\n` +
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
                                `💰 Số tiền vay: ${formatNumber(amount)} Xu\n` +
                                `💹 Lãi suất: ${(interestRate * 100).toFixed(2)}%/ngày\n` +
                                `${requiredCollateral ? `🔒 Tài sản đảm bảo: ${formatNumber(requiredCollateral)} Xu\n` : ''}` +
                                `💵 Tiền lãi: ${formatNumber(interest)} Xu\n` +
                                `💳 Tổng số tiền phải trả: ${formatNumber(totalRepayment)} Xu\n` +
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
                                `❌ Số tiền vay tối đa là ${maxLoanAmount.toLocaleString('vi-VN')} Xu (50% tổng tài sản)!`,
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
                                `❌ Điểm tín dụng tối thiểu để vay ${amount.toLocaleString('vi-VN')} Xu là ${minRequiredScore} điểm!\n` +
                                `📊 Điểm tín dụng hiện tại: ${creditScore}\n` +
                                "📝 Hãy thực hiện nhiều giao dịch và duy trì số dư để tăng điểm tín dụng.",
                                threadID, messageID
                            );
                        }

                        userData.creditScore = creditScore;

                        const requiredCollateral = amount * LOAN_CONFIG.collateralRatio;
                        if (bankBalance < requiredCollateral) {
                            return api.sendMessage(
                                `❌ Bạn cần có ít nhất ${requiredCollateral.toLocaleString('vi-VN')} Xu trong ngân hàng để đảm bảo khoản vay!\n` +
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
                                `💰 Số tiền nợ: ${existingLoan.remainingAmount.toLocaleString('vi-VN')} Xu\n` +
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
                            `💰 Số tiền vay: ${amount.toLocaleString('vi-VN')} Xu\n` +
                            `💹 Lãi suất: ${(interestRate * 100).toFixed(2)}%/ngày\n` +
                            `🔒 Tài sản đảm bảo: ${requiredCollateral.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tiền lãi: ${interest.toLocaleString('vi-VN')} Xu\n` +
                            `💳 Tổng số tiền phải trả: ${totalRepayment.toLocaleString('vi-VN')} Xu\n` +
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
                            `✅ Đã trả ${paymentAmount.toLocaleString('vi-VN')} Xu cho khoản vay!`
                        ];

                        if (loan.status === 'paid') {
                            message.push('🎉 Chúc mừng! Khoản vay đã được thanh toán đầy đủ!');
                            if (returnedCollateral > 0) {
                                message.push(`💰 Đã hoàn trả ${returnedCollateral.toLocaleString('vi-VN')} Xu tài sản đảm bảo!`);
                            }
                        } else {
                            message.push(`📌 Số tiền còn nợ: ${loan.remainingAmount.toLocaleString('vi-VN')} Xu`);
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
                            `💰 Số tiền vay gốc: ${userLoan.amount.toLocaleString('vi-VN')} Xu\n` +
                            `💵 Tiền lãi: ${userLoan.interest.toLocaleString('vi-VN')} Xu\n` +
                            `💳 Số tiền còn nợ: ${userLoan.remainingAmount.toLocaleString('vi-VN')} Xu\n` +
                            `⏳ Thời gian còn lại: ${daysLeft} ngày\n` +
                            `📅 Hạn trả: ${new Date(userLoan.dueDate).toLocaleDateString('vi-VN')}`,
                            threadID, messageID
                        );
                    } catch (err) {
                        console.error('Lỗi kiểm tra khoản vay:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi kiểm tra khoản vay!", threadID, messageID);
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