const { getBalance, updateBalance } = require('./currencies');
const { getVIPBenefits } = require('../game/vip/vipCheck');

const LOAN_CONFIG = {
    minAmount: 500,
    maxLoanRatio: 0.3,
    baseInterestRate: 0.02,
    maxLoanDuration: 5,
    minimumBalanceAge: 14,
    penaltyRate: 0.05,
    collateralRatio: 0.5,
    creditScoreThresholds: {
        minimum: 50,
        good: 70,
        excellent: 85
    },
    repaymentPenalties: {
        firstWarning: 3,
        secondWarning: 1,
        gracePeriod: 1,
        creditScoreDeduction: {
            late1Day: -5,
            late3Days: -15,
            late5Days: -30,
            default: -50
        }
    },
    cooldownPeriod: 3 * 24 * 60 * 60 * 1000,
    eligibilityCriteria: {
        minimumTransactions: 5,
        minimumBalance: 5000,
    },  
    vipBenefits: {
        3: {
            maxLoanRatio: 1.2,
            interestDiscount: 0.3,
            collateralRequired: false,
            creditScoreRequired: false
        }
    }
};

const LOAN_APPROVAL = {
    levels: {
        automatic: {
            maxAmount: 50000,
            minCreditScore: 70
        },
        review: {
            maxAmount: 200000,
            minCreditScore: 60,
            waitTime: 4 * 60 * 60 * 1000
        },
        committee: {
            maxAmount: Infinity,
            minCreditScore: 50,
            waitTime: 12 * 60 * 60 * 1000
        }
    }
};

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

function lockCollateral(userId, amount, bankingData) {
    const userData = bankingData.users[userId];
    if (!userData.lockedCollateral) userData.lockedCollateral = {};

    userData.lockedCollateral[Date.now()] = {
        amount: amount,
        unlockTime: Date.now() + (LOAN_CONFIG.maxLoanDuration * 24 * 60 * 60 * 1000)
    };
}

function isBlacklisted(userId, bankingData, blacklistDuration) {
    const blacklistEntry = bankingData.blacklist[userId];
    if (!blacklistEntry) return false;

    if (Date.now() - blacklistEntry.timestamp > blacklistDuration) {
        delete bankingData.blacklist[userId];
        return false;
    }
    return true;
}

async function processLoanRequest(userId, amount, bankingData, userData, bankBalance, walletBalance, creditScore, saveBankingData) {
    if (amount < LOAN_CONFIG.minAmount) {
        return {
            success: false,
            message: `❌ Số tiền vay tối thiểu là ${formatNumber(LOAN_CONFIG.minAmount)} $!`
        };
    }

    const loanHistory = bankingData.loans[userId]?.history || [];
    const lastLoan = loanHistory[loanHistory.length - 1];

    if (lastLoan && (Date.now() - lastLoan.endDate < LOAN_CONFIG.cooldownPeriod)) {
        const remainingHours = Math.ceil((LOAN_CONFIG.cooldownPeriod - (Date.now() - lastLoan.endDate)) / (60 * 60 * 1000));
        return {
            success: false,
            message: `❌ Bạn cần đợi thêm ${remainingHours} giờ trước khi có thể vay tiếp!\n📝 Chính sách mới yêu cầu thời gian chờ giữa các khoản vay.`
        };
    }

    const transactions = bankingData.transactions[userId] || [];
    if (transactions.length < LOAN_CONFIG.eligibilityCriteria.minimumTransactions) {
        return {
            success: false,
            message: `❌ Bạn cần có ít nhất ${LOAN_CONFIG.eligibilityCriteria.minimumTransactions} giao dịch để đủ điều kiện vay!\n📊 Số giao dịch hiện tại: ${transactions.length}`
        };
    }

    const totalAssets = walletBalance + bankBalance;
    if (totalAssets < LOAN_CONFIG.eligibilityCriteria.minimumBalance) {
        return {
            success: false,
            message: `❌ Tổng tài sản của bạn phải đạt tối thiểu ${formatNumber(LOAN_CONFIG.eligibilityCriteria.minimumBalance)} $ để vay!\n💰 Tổng tài sản hiện tại: ${formatNumber(totalAssets)} $`
        };
    }

    const vipBenefits = await getVIPBenefits(userId);
    const vipLevel = vipBenefits?.packageId || 0;
    const vipLoanConfig = vipLevel === 3 ? LOAN_CONFIG.vipBenefits[3] : null;
    let maxLoanAmount = totalAssets * LOAN_CONFIG.maxLoanRatio;

    if (vipLoanConfig) {
        maxLoanAmount = totalAssets * vipLoanConfig.maxLoanRatio;
    }

    if (amount > maxLoanAmount) {
        return {
            success: false,
            message: `❌ Với ${vipLevel === 3 ? `VIP Gold` : "tài khoản thường"}, số tiền vay tối đa của bạn là ${formatNumber(maxLoanAmount)} $!`
        };
    }

    const existingLoan = bankingData.loans[userId];
    if (existingLoan && existingLoan.status === 'active') {
        return {
            success: false,
            message: `❌ Bạn đang có khoản vay chưa thanh toán!\n💰 Số tiền nợ: ${formatNumber(existingLoan.remainingAmount)} $\n📅 Hạn trả: ${new Date(existingLoan.dueDate).toLocaleDateString('vi-VN')}`
        };
    }

    const accountAge = (Date.now() - (userData.createdAt || Date.now())) / (24 * 60 * 60 * 1000);
    if (accountAge < LOAN_CONFIG.minimumBalanceAge) {
        return {
            success: false,
            message: `❌ Tài khoản của bạn cần tối thiểu ${LOAN_CONFIG.minimumBalanceAge} ngày tuổi để vay!\n⏳ Thời gian còn lại: ${Math.ceil(LOAN_CONFIG.minimumBalanceAge - accountAge)} ngày`
        };
    }

    if (creditScore < LOAN_CONFIG.creditScoreThresholds.minimum && vipLevel !== 3) {
        return {
            success: false,
            message: `❌ Điểm tín dụng tối thiểu để vay là ${LOAN_CONFIG.creditScoreThresholds.minimum} điểm!\n📊 Điểm tín dụng hiện tại: ${creditScore}\n📝 Hãy thực hiện nhiều giao dịch và duy trì số dư để tăng điểm tín dụng.`
        };
    }

    let approvalLevel;
    if (amount <= LOAN_APPROVAL.levels.automatic.maxAmount && creditScore >= LOAN_APPROVAL.levels.automatic.minCreditScore) {
        approvalLevel = "automatic";
    } else if (amount <= LOAN_APPROVAL.levels.review.maxAmount && creditScore >= LOAN_APPROVAL.levels.review.minCreditScore) {
        approvalLevel = "review";
    } else {
        approvalLevel = "committee";
    }

    if (approvalLevel !== "automatic" && vipLevel !== 3) {
        const waitTime = LOAN_APPROVAL.levels[approvalLevel].waitTime;
        const waitHours = Math.ceil(waitTime / (60 * 60 * 1000));

        if (!bankingData.loanRequests) bankingData.loanRequests = {};
        bankingData.loanRequests[userId] = {
            amount: amount,
            requestTime: Date.now(),
            approvalLevel: approvalLevel,
            processingTime: Date.now() + waitTime,
            status: 'pending'
        };
        saveBankingData(bankingData);

        return {
            success: false,
            message: `🕒 YÊU CẦU VAY ĐANG CHỜ PHÊ DUYỆT\n━━━━━━━━━━━━━━━━━━\n💰 Số tiền yêu cầu: ${formatNumber(amount)} $\n⏳ Thời gian chờ: Khoảng ${waitHours} giờ\n📋 Cấp độ phê duyệt: ${approvalLevel === "review" ? "Xét duyệt" : "Ủy ban"}\n\n📌 Lưu ý:\n• Yêu cầu của bạn đang được xem xét\n• Bạn sẽ nhận được thông báo khi có kết quả\n• Nâng cấp lên VIP Gold để được vay tức thì`
        };
    }

    userData.creditScore = creditScore;

    const requiredCollateral = amount * (vipLevel === 3 && vipLoanConfig ? vipLoanConfig.collateralRatio || LOAN_CONFIG.collateralRatio : LOAN_CONFIG.collateralRatio);
    if (bankBalance < requiredCollateral && (vipLevel !== 3 || !vipLoanConfig || vipLoanConfig.collateralRequired)) {
        return {
            success: false,
            message: `❌ Bạn cần có ít nhất ${formatNumber(requiredCollateral)} $ trong ngân hàng để đảm bảo khoản vay!\n📝 Số tiền này sẽ bị phong tỏa cho đến khi trả hết nợ.`
        };
    }

    let interestRate = calculateInterestRate(creditScore, amount, totalAssets);
    if (vipLevel === 3 && vipLoanConfig) {
        interestRate *= (1 - vipLoanConfig.interestDiscount);
    }

    const interest = Math.ceil(amount * interestRate * LOAN_CONFIG.maxLoanDuration);
    const totalRepayment = amount + interest;
    const dueDate = Date.now() + (LOAN_CONFIG.maxLoanDuration * 24 * 60 * 60 * 1000);

    let actualCollateral = 0;
    if (vipLevel !== 3 || !vipLoanConfig || vipLoanConfig.collateralRequired) {
        userData.bankBalance -= requiredCollateral;
        lockCollateral(userId, requiredCollateral, bankingData);
        actualCollateral = requiredCollateral;
    }

    const today = new Date().toDateString();
    if (!bankingData.dailyLoans[userId]) {
        bankingData.dailyLoans[userId] = { date: today, count: 0 };
    }
    bankingData.dailyLoans[userId].count++;

    bankingData.loans[userId] = {
        amount: amount,
        interest: interest,
        remainingAmount: totalRepayment,
        startDate: Date.now(),
        dueDate: dueDate,
        status: 'active',
        collateral: actualCollateral,
        interestRate: interestRate,
        creditScore: creditScore,
        warningsSent: 0,
        lastReminderDate: null,
        paymentHistory: [],
        vipStatus: vipLevel
    };

    if (!bankingData.repaymentReminders) bankingData.repaymentReminders = {};
    bankingData.repaymentReminders[userId] = {
        loanId: Date.now(),
        amount: totalRepayment,
        dueDate: dueDate,
        firstWarningDate: dueDate - (LOAN_CONFIG.repaymentPenalties.firstWarning * 24 * 60 * 60 * 1000),
        secondWarningDate: dueDate - (LOAN_CONFIG.repaymentPenalties.secondWarning * 24 * 60 * 60 * 1000)
    };

    await updateBalance(userId, amount);
    saveBankingData(bankingData);

    const loanTerms = [
        "📜 ĐIỀU KHOẢN VAY MỚI:",
        `1. Khoản vay phải được trả trong ${LOAN_CONFIG.maxLoanDuration} ngày`,
        `2. Tài sản đảm bảo: ${actualCollateral > 0 ? formatNumber(actualCollateral) + ' $' : 'Không yêu cầu (VIP Gold)'}`,
        `3. Phạt quá hạn: ${(LOAN_CONFIG.penaltyRate * 100).toFixed(1)}%/ngày`,
        "4. Trễ hạn sẽ bị trừ điểm tín dụng nghiêm trọng",
        "5. Vỡ nợ sẽ bị cấm vay trong 30 ngày"
    ];

    return {
        success: true,
        message: `🏦 KHOẢN VAY ĐÃ ĐƯỢC PHÊ DUYỆT 🏦\n━━━━━━━━━━━━━━━━━━\n📊 Điểm tín dụng: ${creditScore}/100\n💰 Số tiền vay: ${formatNumber(amount)} $\n💹 Lãi suất: ${(interestRate * 100).toFixed(2)}%/ngày\n💵 Tiền lãi: ${formatNumber(interest)} $\n💳 Tổng số tiền phải trả: ${formatNumber(totalRepayment)} $\n📅 Hạn trả: ${new Date(dueDate).toLocaleDateString('vi-VN')}\n\n${loanTerms.join("\n")}`
    };
}

async function processLoanRepayment(userId, amount, bankingData, userData, walletBalance, saveBankingData) {
    const loan = bankingData.loans[userId];
    if (!loan || loan.status !== 'active') {
        return {
            success: false,
            message: "❌ Bạn không có khoản vay nào đang hoạt động!"
        };
    }

    let paymentAmount = amount;
    if (!paymentAmount) {
        paymentAmount = loan.remainingAmount;
    }

    if (paymentAmount > loan.remainingAmount) {
        return {
            success: false,
            message: "❌ Số tiền trả vượt quá số nợ!"
        };
    }

    if (walletBalance < paymentAmount) {
        return {
            success: false,
            message: "❌ Số dư trong ví không đủ để trả nợ!"
        };
    }

    await updateBalance(userId, -paymentAmount);
    loan.remainingAmount -= paymentAmount;

    let returnedCollateral = 0;
    if (loan.remainingAmount <= 0) {
        loan.status = 'paid';
        if (userData.lockedCollateral) {
            const totalLocked = Object.values(userData.lockedCollateral)
                .reduce((sum, lock) => sum + lock.amount, 0);
            returnedCollateral = totalLocked;
            userData.bankBalance += totalLocked;
            userData.lockedCollateral = {};
        }

        if (!bankingData.loans[userId].history) {
            bankingData.loans[userId].history = [];
        }
        bankingData.loans[userId].history.push({
            amount: loan.amount,
            startDate: loan.startDate,
            endDate: Date.now(),
            status: 'paid',
            paidOnTime: Date.now() <= loan.dueDate
        });
    }

    saveBankingData(bankingData);

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

    return {
        success: true,
        message: message.join('\n')
    };
}

function getLoanInfo(userId, bankingData) {
    const userLoan = bankingData.loans[userId];
    if (!userLoan || userLoan.status !== 'active') {
        return {
            success: false,
            message: "📌 Bạn không có khoản vay nào đang hoạt động!"
        };
    }

    const daysLeft = Math.ceil((userLoan.dueDate - Date.now()) / (24 * 60 * 60 * 1000));
    return {
        success: true,
        message: `🏦 THÔNG TIN KHOẢN VAY 🏦\n━━━━━━━━━━━━━━━━━━\n💰 Số tiền vay gốc: ${userLoan.amount.toLocaleString('vi-VN')} $\n💵 Tiền lãi: ${userLoan.interest.toLocaleString('vi-VN')} $\n💳 Số tiền còn nợ: ${userLoan.remainingAmount.toLocaleString('vi-VN')} $\n⏳ Thời gian còn lại: ${daysLeft} ngày\n📅 Hạn trả: ${new Date(userLoan.dueDate).toLocaleDateString('vi-VN')}`
    };
}

module.exports = {
    LOAN_CONFIG,
    LOAN_APPROVAL,
    formatNumber,
    calculateInterestRate,
    lockCollateral,
    isBlacklisted,
    processLoanRequest,
    processLoanRepayment,
    getLoanInfo
};
