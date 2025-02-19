const TRADING_RESTRICTIONS = {
    holdingPeriod: 1 * 60 * 60 * 1000,

    coolingPeriod: 30 * 60 * 1000, 
    priceLimit: {
        dailyChange: 0.15,  // Increased from 7% to 15% to allow trading at 5% change
        circuitBreaker: 0.20, // Increased circuit breaker accordingly
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
                message: 'Vượt quá biên độ dao động cho phép (15%)',
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
        if (history.length < 10) return false;  // Increased minimum history requirement

        // Check frequency of trades
        const recentTrades = history.slice(-10);  // Look at last 10 trades instead of 5
        const symbols = new Set(recentTrades.map(t => t.symbol));
        
        for (const symbol of symbols) {
            const symbolTrades = recentTrades.filter(t => t.symbol === symbol);
            // Only flag if there are many trades in short time
            if (symbolTrades.length >= 6) {  // Increased from 4 to 6 trades
                const timeSpan = symbolTrades[symbolTrades.length - 1].timestamp - symbolTrades[0].timestamp;
                if (timeSpan < 5 * 60 * 1000) { // If trades happened within 5 minutes
                    return true;
                }
            }
        }

        // Check for unusual price changes
        const priceChanges = history.slice(-5).map(t => t.priceChange);  // Look at last 5 price changes
        const totalChange = priceChanges.reduce((a, b) => a + Math.abs(b), 0);
        // Only flag if total change is significantly above circuit breaker
        if (totalChange > TRADING_RESTRICTIONS.priceLimit.circuitBreaker * 1.5) {
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
