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
        this.MAX_PROFIT_CAP = 300000000; // 300tr xu limit
        this.DAILY_PROFIT_CAP = 50000000;
        this.activeUsers = new Set();
        this.timeBasedStats = {};
        this.riskFactors = new Map();
        this.lastResults = new Map();
        this.BAUCUA_WIN_LIMIT = 200000000; // 200tr limit cho bầu cua
        this.BAUCUA_DAILY_LIMIT = 30000000; // 30tr limit mỗi ngày
        this.luckyNumbers = [3, 7, 9];
        this.specialDates = ['Saturday', 'Sunday'];
        this.bonusHours = [12, 20, 22];
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

        // Kiểm tra giới hạn thắng
        if (stats.totalWin >= this.MAX_PROFIT_CAP) {
            baseWinChance *= 0.1; // Giảm mạnh tỷ lệ thắng
            this.activeUsers.add(userId);
        } else if (stats.totalWin >= this.MAX_PROFIT_CAP * 0.8) {
            baseWinChance *= 0.3; // Giảm vừa phải khi gần đạt giới hạn
        }

        // Thêm logic kiểm soát người chơi đáng ngờ
        if (this.activeUsers.has(userId)) {
            if (stats.totalGames > 50 && stats.totalWin/stats.totalBet > 1.5) {
                baseWinChance *= 0.2;
            }
            if (betAmount > 50000) baseWinChance *= 0.5;
        }

        // Kiểm soát theo thời gian
        const hourOfDay = new Date().getHours();
        if (hourOfDay >= 1 && hourOfDay <= 5) {
            baseWinChance *= 0.7; // Giảm tỷ lệ thắng vào đêm khuya
        }

        // Điều chỉnh theo loại game
        switch(gameType) {
            case 'taixiu':
                baseWinChance *= 1.0;
                break;
            case 'chanle':
                // Thêm logic đặc biệt cho chẵn lẻ
                if (this.calculateGameOdds(userId, betAmount)) {
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
                // Thêm điều kiện đặc biệt cho bầu cua
                if (isAllIn) baseWinChance *= 0.4;
                
                // Kiểm tra giới hạn thắng bầu cua
                if (stats.totalWin >= this.BAUCUA_WIN_LIMIT) {
                    baseWinChance *= 0.1;
                }

                // Kiểm soát theo thời gian chơi
                const dailyStats = this.getDailyStats(userId);
                if (dailyStats.winAmount > this.BAUCUA_DAILY_LIMIT) {
                    baseWinChance *= 0.2;
                }

                // Giảm tỷ lệ thắng theo bet amount
                if (betAmount > 100000) baseWinChance *= 0.8;
                if (betAmount > 500000) baseWinChance *= 0.6;
                if (betAmount > 1000000) baseWinChance *= 0.4;

                return Math.min(Math.max(baseWinChance, 0.1), 0.4);
            case 'coinflip':
                baseWinChance *= 0.98;
                break;
        }

        // Thêm kiểm soát theo thời gian trong ngày
        const dailyStats = this.getDailyStats(userId);
        if (dailyStats.winAmount > this.DAILY_PROFIT_CAP) {
            baseWinChance *= 0.2;
        }

        // Phân tích pattern người chơi
        const pattern = this.analyzePlayerPattern(userId);
        if (pattern.isExploiting) {
            baseWinChance *= 0.3;
        }

        // Kiểm soát theo chu kỳ
        const cycleControl = this.getCycleControl(userId);
        baseWinChance *= cycleControl;

        // Dynamic risk adjustment
        const riskFactor = this.calculateRiskFactor(userId, betAmount);
        baseWinChance *= riskFactor;

        // Thêm yếu tố ngẫu nhiên để che đậy việc điều khiển tỷ lệ
        const randomLuck = Math.random() * 0.1;
        const hourBonus = this.bonusHours.includes(new Date().getHours()) ? 0.05 : 0;
        const specialDateBonus = this.specialDates.includes(new Date().toLocaleDateString('en-US', {weekday: 'long'})) ? 0.03 : 0;

        // Trộn các yếu tố vào để che đậy logic thật
        baseWinChance += randomLuck + hourBonus + specialDateBonus;

        return Math.min(Math.max(baseWinChance, 0.15), 0.45);
    }

    calculateGameOdds(userId, betAmount) {
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
        const isNearLimit = stats.totalWin >= this.MAX_PROFIT_CAP * 0.7;
        const hasHighWinRate = stats.totalGames > 30 && (stats.wins/stats.totalGames) > 0.45;
        const isSuspicious = this.activeUsers.has(userId);
        
        return isNearLimit || 
               (hasHighWinRate && Math.random() < 0.85) ||
               (isSuspicious && Math.random() < 0.9) ||
               (betAmount > 100000 && Math.random() < 0.75);
    }

    calculateBaucuaOdds(userId, betAmount) {
        const stats = this.playerStats[userId] || {};
        const pattern = this.analyzePlayerPattern(userId);
        
        let baseOdds = 0.4; // 40% base chance
        
        // Giảm tỷ lệ nếu người chơi đang thắng nhiều
        if (stats.totalWin > stats.totalBet * 1.5) baseOdds *= 0.7;
        
        // Giảm mạnh với cược lớn
        if (betAmount > 100000) baseOdds *= 0.8;
        if (betAmount > 500000) baseOdds *= 0.6;
        
        // Kiểm tra pattern đáng ngờ
        if (pattern.isExploiting) baseOdds *= 0.5;
        
        // Random factor to make it less predictable
        const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
        
        return Math.max(0.1, Math.min(0.5, baseOdds + variance));
    }

    calculateReward(betAmount, multiplier = 1, special = false) {
        const rawReward = betAmount * multiplier;
        let feeRate = 0.02; // Phí cơ bản 1%
        
        if (betAmount >= 1000000) feeRate = 0.04; // 2% cho cược từ 1M
        if (betAmount >= 10000000) feeRate = 0.06; // 3% cho cược từ 10M
    
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

        // Cập nhật thống kê theo ngày
        const dailyStats = this.getDailyStats(userId);
        dailyStats.gamesPlayed++;
        if (gameResult.won) {
            dailyStats.winAmount += gameResult.winAmount;
        } else {
            dailyStats.lossAmount += gameResult.betAmount;
        }

        // Lưu kết quả gần đây để phân tích pattern
        const results = this.lastResults.get(userId) || [];
        results.unshift(gameResult);
        if (results.length > 20) results.pop();
        this.lastResults.set(userId, results);

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
        if (this.calculateGameOdds(userId, stats.betAmount)) return false; // Không cho x4 nếu đang kiểm soát
        return Math.random() < 0.05; // Cơ hội cơ bản 5%
    }

    getDailyStats(userId) {
        const today = new Date().toDateString();
        if (!this.timeBasedStats[today]) {
            this.timeBasedStats[today] = {};
        }
        if (!this.timeBasedStats[today][userId]) {
            this.timeBasedStats[today][userId] = {
                winAmount: 0,
                lossAmount: 0,
                gamesPlayed: 0
            };
        }
        return this.timeBasedStats[today][userId];
    }

    analyzePlayerPattern(userId) {
        const recentGames = this.recentGames[userId] || [];
        const last10Games = recentGames.slice(0, 10);
        
        const patternData = {
            isExploiting: false,
            suspiciousPatterns: 0,
            consistentBets: 0
        };

        // Kiểm tra mẫu đặt cược
        let consistentWins = 0;
        let lastBetAmount = 0;

        for (let i = 0; i < last10Games.length; i++) {
            const game = last10Games[i];
            if (game.won) consistentWins++;
            
            if (game.betAmount === lastBetAmount) {
                patternData.consistentBets++;
            }
            lastBetAmount = game.betAmount;
        }

        if (consistentWins >= 7) patternData.suspiciousPatterns++;
        if (patternData.consistentBets >= 8) patternData.suspiciousPatterns++;
        
        patternData.isExploiting = patternData.suspiciousPatterns >= 2;
        return patternData;
    }

    calculateRiskFactor(userId, betAmount) {
        let risk = 1.0;
        const stats = this.playerStats[userId];

        // Tính toán độ rủi ro dựa trên lịch sử
        if (stats) {
            const profitRatio = stats.totalWin / (stats.totalBet || 1);
            if (profitRatio > 1.2) risk *= 0.8;
            if (profitRatio > 1.5) risk *= 0.6;
        }

        // Lưu trữ và cập nhật risk factor
        const currentRisk = this.riskFactors.get(userId) || 1.0;
        const newRisk = (currentRisk * 0.7 + risk * 0.3);
        this.riskFactors.set(userId, newRisk);

        return newRisk;
    }

    getCycleControl(userId) {
        const hourOfDay = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        
        let cycleFactor = 1.0;

        // Kiểm soát theo giờ
        if (hourOfDay >= 1 && hourOfDay <= 5) cycleFactor *= 0.7;
        if (hourOfDay >= 22 || hourOfDay <= 2) cycleFactor *= 0.85;

        // Kiểm soát theo ngày
        if (dayOfWeek === 0 || dayOfWeek === 6) cycleFactor *= 0.9;

        // Thêm yếu tố ngẫu nhiên có kiểm soát
        const randomFactor = 0.85 + (Math.random() * 0.3);
        cycleFactor *= randomFactor;

        return cycleFactor;
    }
}

module.exports = new GameLogic();
