const fs = require('fs');
const path = require('path');
const { getBalance } = require('../utils/currencies');
const {
    LOAN_CONFIG,
    processLoanRequest,
    processLoanRepayment,
    getLoanInfo,
    isBlacklisted,
    formatNumber
} = require('../utils/loan');

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
    creditScore: {
        minTransactionAmount: 50000,
        dailyTransactionLimit: 10,
        minTransactionInterval: 30 * 60 * 1000
    }
};

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

const getLoanHelp = () => {
    return `💰 HỆ THỐNG VAY TIỀN 💰

📋 Các lệnh:
1️⃣ .loan vay [số $] - Vay tiền từ ngân hàng
2️⃣ .loan trả [số $] - Trả nợ (không nhập số = trả hết)
3️⃣ .loan info - Xem thông tin khoản vay hiện tại

💡 Thông tin:
• Lãi suất: Tùy theo điểm tín dụng
• Thời hạn: ${LOAN_CONFIG.maxLoanDuration} ngày
• Tối thiểu: ${formatNumber(LOAN_CONFIG.minAmount)} $
• Cần tài sản đảm bảo: ${(LOAN_CONFIG.collateralRatio * 100).toFixed(0)}%`;
};

module.exports = {
    name: "loan",
    dev: "HNT",
    category: "Tài Chính",
    onPrefix: true,
    usages: ".loan [vay/trả/info]\n",
    info: "Hệ thống vay tiền ngân hàng",
    cooldowns: 3,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0]) {
            return api.sendMessage(getLoanHelp(), threadID, messageID);
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

            const action = target[0].toLowerCase();
            const amount = parseInt(target[1]);

            switch (action) {
                case "vay":
                    try {
                        if (!amount || isNaN(amount) || amount <= 0) {
                            return api.sendMessage("❌ Vui lòng nhập số tiền muốn vay hợp lệ!", threadID, messageID);
                        }

                        const creditScore = calculateCreditScore(senderID, bankingData);
                        
                        if (isBlacklisted(senderID, bankingData, SECURITY_CONFIG.blacklistDuration)) {
                            return api.sendMessage(
                                "❌ Tài khoản của bạn đã bị cấm vay do vi phạm điều khoản!",
                                threadID, messageID
                            );
                        }

                        const result = await processLoanRequest(
                            senderID,
                            amount,
                            bankingData,
                            userData,
                            bankBalance,
                            walletBalance,
                            creditScore,
                            saveBankingData
                        );

                        return api.sendMessage(result.message, threadID, messageID);
                    } catch (err) {
                        console.error('Lỗi xử lý khoản vay:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi xử lý khoản vay!", threadID, messageID);
                    }

                case "trả":
                case "tra":
                    try {
                        const result = await processLoanRepayment(
                            senderID,
                            amount,
                            bankingData,
                            userData,
                            walletBalance,
                            saveBankingData
                        );

                        return api.sendMessage(result.message, threadID, messageID);
                    } catch (err) {
                        console.error('Lỗi trả nợ:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi trả nợ!", threadID, messageID);
                    }

                case "info":
                case "khoản_vay":
                    try {
                        const result = getLoanInfo(senderID, bankingData);
                        return api.sendMessage(result.message, threadID, messageID);
                    } catch (err) {
                        console.error('Lỗi kiểm tra khoản vay:', err);
                        return api.sendMessage("❌ Có lỗi xảy ra khi kiểm tra khoản vay!", threadID, messageID);
                    }

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n\n" +
                        "📌 Sử dụng:\n" +
                        "1. .loan vay [số tiền]\n" +
                        "2. .loan trả [số tiền]\n" +
                        "3. .loan info",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Lỗi tổng thể:', err);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};
