const { randomInt } = require('crypto');
const { loadQuy } = require('./currencies');

class GameLogic {
    constructor() {
        this.playerStats = {};
        this.recentGames = {};
        this.streaks = {};
        this.houseStats = {
            totalGames: 0,
            totalWin: 0,
            totalLoss: 0
        };
        this.ICONS = {WHITE: "⚪", RED: "🔴"};
        this.PATTERNS = {
            "chẵn": [
                // Pattern thường (70%)
                ...[...Array(7)].map(() => [this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.RED, this.ICONS.RED]),
                // Pattern đặc biệt (30%)  
                ...[...Array(3)].map(() => [this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE])
            ],
            "lẻ": [
                // Pattern thường (80%)
                ...[...Array(8)].map(() => [this.ICONS.WHITE, this.ICONS.RED, this.ICONS.RED, this.ICONS.RED]),
                // Pattern thường 2 (15%)
                ...[...Array(2)].map(() => [this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.RED]),
                // Pattern đặc biệt (5%)
                [this.ICONS.RED, this.ICONS.RED, this.ICONS.RED, this.ICONS.RED]
            ]
        };
    }

    calculateWinChance(userId, options = {}) {
        const {
            isAllIn = false,
            balance = 0,
            betAmount = 0,
            gameType = 'default'
        } = options;

        if (!this.playerStats[userId]) {
            this.playerStats[userId] = {
                totalGames: 0,
                wins: 0,
                totalBet: 0,
                totalWin: 0,
                consecutiveLosses: 0,
                firstPlayTime: Date.now()
            };
        }

        const stats = this.playerStats[userId];
        let baseWinChance = 0.45; // Giảm tỷ lệ thắng cơ bản xuống

        // Kiểm tra số dư quỹ
        const quy = loadQuy();
        if (quy < 1000000) { // Nếu quỹ thấp, giảm tỷ lệ thắng
            baseWinChance *= 0.8;
        }

        // Điều chỉnh tỷ lệ dựa trên lịch sử thắng thua
        if (stats.totalGames > 20) {
            const profitRate = stats.totalWin / stats.totalBet;
            if (profitRate > 1.2) baseWinChance *= 0.7; // Giảm mạnh nếu người chơi lời nhiều
            if (profitRate > 1.5) baseWinChance *= 0.6;
        }

        // Giảm tỷ lệ thắng nếu bet lớn
        if (betAmount > 100000) baseWinChance *= 0.9;
        if (betAmount > 500000) baseWinChance *= 0.8;

        // Điều chỉnh theo loại game
        switch(gameType) {
            case 'taixiu':
                baseWinChance *= 1.0;
                break;
            case 'chanle':
                // Thêm logic đặc biệt cho chẵn lẻ
                if (this.shouldRigGame(userId, betAmount)) {
                    baseWinChance *= 0.5;
                }
                // Giảm tỷ lệ ra pattern đặc biệt
                if (stats.totalWin > stats.totalBet) {
                    baseWinChance *= 0.85;
                }
                if (stats.consecutiveLosses >= 4) {
                    baseWinChance *= 1.15;
                }
                break;
            case 'baucua':
                baseWinChance *= 0.90;
                break;
            case 'coinflip':
                baseWinChance *= 0.98;
                break;
        }

        // Đảm bảo tỷ lệ không quá thấp để tránh người chơi nản
        return Math.min(Math.max(baseWinChance, 0.30), 0.60);
    }

    shouldRigGame(userId, betAmount) {
        const stats = this.playerStats[userId];
        if (!stats) return false;

        // Kiểm tra các điều kiện để can thiệp
        const isHighRoller = betAmount > 200000;
        const hasHighProfit = stats.totalWin > stats.totalBet * 1.3;
        const hasWinStreak = this.streaks[userId] > 3;
        
        // Tăng xác suất can thiệp nếu người chơi:
        // 1. Đang thắng nhiều
        // 2. Đang có chuỗi thắng
        // 3. Đặt cược lớn
        return (isHighRoller && Math.random() < 0.7) ||
               (hasHighProfit && Math.random() < 0.8) ||
               (hasWinStreak && Math.random() < 0.75);
    }

    calculateReward(betAmount, multiplier = 1, special = false) {
        const rawReward = betAmount * multiplier;
        let feeRate = 0.01; // Phí cơ bản 1%
        
        if (betAmount >= 1000000) feeRate = 0.02; // 2% cho cược từ 1M
        if (betAmount >= 10000000) feeRate = 0.03; // 3% cho cược từ 10M
    
        const fee = Math.ceil(rawReward * feeRate);
        const finalReward = rawReward - fee;
    
        return {
            rawReward,
            fee,
            finalReward
        };
    }

    calculateFeeRate(winAmount) {
        // Tăng phí theo mức thắng
        if (winAmount > 1000000) return 0.18;
        if (winAmount > 500000) return 0.15;
        if (winAmount > 200000) return 0.12;
        if (winAmount > 100000) return 0.08;
        return 0.05;
    }

    updatePlayerStats(userId, gameResult) {
        const {
            won = false,
            betAmount = 0,
            winAmount = 0,
            gameType = 'default'
        } = gameResult;

        if (!this.playerStats[userId]) {
            this.playerStats[userId] = {
                totalGames: 0,
                wins: 0,
                totalBet: 0,
                totalWin: 0,
                consecutiveLosses: 0
            };
        }

        if (!this.recentGames[userId]) {
            this.recentGames[userId] = [];
        }

        const stats = this.playerStats[userId];
        stats.totalGames++;
        stats.totalBet += betAmount;

        if (won) {
            stats.wins++;
            stats.totalWin += winAmount;
            stats.consecutiveLosses = 0;
            this.streaks[userId] = (this.streaks[userId] || 0) + 1;
        } else {
            stats.consecutiveLosses++;
            this.streaks[userId] = 0;
        }

        this.recentGames[userId].unshift({
            won,
            betAmount,
            winAmount,
            gameType,
            timestamp: Date.now()
        });

        if (this.recentGames[userId].length > 20) {
            this.recentGames[userId].pop();
        }

        return {
            currentStreak: this.streaks[userId],
            stats: stats,
            recentGames: this.recentGames[userId]
        };
    }

    shouldTriggerJackpot(userId) {
        const quy = loadQuy();
        if (quy < 100000) return false;

        const randomChance = Math.random();
        const baseJackpotChance = 0.001; 

        let jackpotChance = baseJackpotChance;
        if (quy > 1000000) jackpotChance *= 1.5;
        if (quy > 5000000) jackpotChance *= 2;

        if (this.playerStats[userId]?.recentBigWins > 0) {
            jackpotChance *= 0.5;
        }

        return randomChance < jackpotChance;
    }

    generateChanLeResult(userId, playerChoice, options = {}) {
        const winChance = this.calculateWinChance(userId, {
            ...options,
            gameType: 'chanle'
        });

        const shouldWin = Math.random() < winChance;
        const result = shouldWin ? playerChoice : (playerChoice === "chẵn" ? "lẻ" : "chẵn");

        const patternPool = this.PATTERNS[result];
        let pattern = patternPool[randomInt(0, patternPool.length)];

        const isSpecial = JSON.stringify(pattern) === JSON.stringify([this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE]) || 
                         JSON.stringify(pattern) === JSON.stringify([this.ICONS.RED, this.ICONS.RED, this.ICONS.RED, this.ICONS.RED]);

        if (isSpecial && shouldWin) {
            const stats = this.playerStats[userId] || {};
            const allowX4 = this.shouldAllowX4(userId, stats);

            if (!allowX4) {
           
                const normalPatterns = patternPool.filter(p => 
                    JSON.stringify(p) !== JSON.stringify([this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE, this.ICONS.WHITE]) &&
                    JSON.stringify(p) !== JSON.stringify([this.ICONS.RED, this.ICONS.RED, this.ICONS.RED, this.ICONS.RED])
                );
                pattern = normalPatterns[randomInt(0, normalPatterns.length)];
                return { pattern, result, isSpecial: false };
            }
        }

        return { pattern, result, isSpecial };
    }

    shouldAllowX4(userId, stats = {}) {
        const recentLosses = stats.consecutiveLosses || 0;
        const totalGames = stats.totalGames || 0;
        const quy = loadQuy();

        // Điều kiện cho phép x4:
        if (recentLosses >= 3) return true; // Thua nhiều
        if (totalGames >= 20 && (stats.wins/totalGames) < 0.4) return true; // Tỷ lệ thắng thấp
        if (quy > 1000000) return Math.random() < 0.08; // Quỹ lớn tăng tỷ lệ
        if (this.shouldRigGame(userId, stats.betAmount)) return false; // Không cho x4 nếu đang kiểm soát
        return Math.random() < 0.05; // Cơ hội cơ bản 5%
    }
}

module.exports = new GameLogic();
