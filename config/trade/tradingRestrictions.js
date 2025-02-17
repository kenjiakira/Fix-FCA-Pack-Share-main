const TRADING_RESTRICTIONS = {
    holdingPeriod: 1 * 60 * 60 * 1000,

    coolingPeriod: 30 * 60 * 1000, 
    priceLimit: {
        dailyChange: 0.07, 
        circuitBreaker: 0.15,
        minPrice: 1000 
    },
    penalties: {
        earlyTrade: 0.5, 
        manipulation: 0.8, 
        increasedTax: 0.02 
    }
};

class TradingMonitor {
    static isValidTrade(trade, userHistory) {
        const violations = [];
        
        const lastSell = userHistory.find(t => 
            t.type === 'sell' && t.symbol === trade.symbol);
        if (lastSell && (Date.now() - lastSell.timestamp) < TRADING_RESTRICTIONS.holdingPeriod) {
            violations.push({
                type: 'EARLY_TRADE',
                message: 'Phải giữ cổ phiếu ít nhất 1 giờ trước khi bán',

                penalty: TRADING_RESTRICTIONS.penalties.earlyTrade
            });
        }

        const lastTrade = userHistory[userHistory.length - 1];
        if (lastTrade && (Date.now() - lastTrade.timestamp) < TRADING_RESTRICTIONS.coolingPeriod) {
            violations.push({
                type: 'COOLING_PERIOD',
                message: 'Phải đợi 30 phút giữa các giao dịch',
                penalty: 0
            });
        }

        if (Math.abs(trade.priceChange) > TRADING_RESTRICTIONS.priceLimit.dailyChange) {
            violations.push({
                type: 'PRICE_LIMIT',
                message: 'Vượt quá biên độ dao động cho phép (7%)',
                penalty: 0
            });
        }

        if (this.detectManipulation(userHistory)) {
            violations.push({
                type: 'MANIPULATION',
                message: 'Phát hiện dấu hiệu thao túng thị trường',
                penalty: TRADING_RESTRICTIONS.penalties.manipulation
            });
        }

        return {
            isValid: violations.length === 0,
            violations
        };
    }

    static detectManipulation(history) {
        if (history.length < 5) return false;

        const recentTrades = history.slice(-5);
        const symbols = new Set(recentTrades.map(t => t.symbol));
        
        for (const symbol of symbols) {
            const symbolTrades = recentTrades.filter(t => t.symbol === symbol);
            if (symbolTrades.length >= 4) { 
                return true;
            }
        }

        const priceChanges = history.slice(-3).map(t => t.priceChange);
        const totalChange = priceChanges.reduce((a, b) => a + Math.abs(b), 0);
        if (totalChange > TRADING_RESTRICTIONS.priceLimit.circuitBreaker) {
            return true;
        }

        return false;
    }

    static calculatePenalties(violations, profitAmount) {
        let totalPenalty = 0;
        let additionalTax = 0;

        violations.forEach(violation => {
            switch (violation.type) {
                case 'EARLY_TRADE':
                    totalPenalty += profitAmount * violation.penalty;
                    break;
                case 'MANIPULATION':
                    totalPenalty += profitAmount * violation.penalty;
                    additionalTax = TRADING_RESTRICTIONS.penalties.increasedTax;
                    break;
            }
        });

        return {
            penaltyAmount: Math.floor(totalPenalty),
            additionalTax: additionalTax
        };
    }

    static logViolation(userId, violation) {
        return {
            userId,
            timestamp: Date.now(),
            type: violation.type,
            message: violation.message,
            penalty: violation.penalty
        };
    }
}

module.exports = {
    TRADING_RESTRICTIONS,
    TradingMonitor
};
