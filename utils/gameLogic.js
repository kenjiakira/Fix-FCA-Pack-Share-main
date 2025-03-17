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
        this.DAILY_PROFIT_CAP = 50000;
        this.activeUsers = new Set();
        this.timeBasedStats = {};
        this.riskFactors = new Map();
        this.lastResults = new Map();
        this.BAUCUA_WIN_LIMIT = 200000000; // 200tr limit cho bầu cua
        this.BAUCUA_DAILY_LIMIT = 30000000; // 30tr limit mỗi ngày
        this.luckyNumbers = [3, 7, 9];
        this.specialDates = ['Saturday', 'Sunday'];
        this.bonusHours = [12, 20, 22];

        // Thêm các ngưỡng kiểm soát mới
        this.RISK_THRESHOLDS = {
            HIGH_ROLLER: 100000000, // 100tr
            SUPER_HIGH_ROLLER: 200000000, // 200tr
            DAILY_MONITOR: 50000000, // 50tr/ngày
            SESSION_MONITOR: 20000000 // 20tr/phiên
        };
        
        this.SPECIAL_CONDITIONS = {
            MAX_WIN_STREAK: 3,
            MIN_LOSS_REQUIRED: 5,
            COOLDOWN_MINUTES: 30
        };
        
        // Theo dõi phiên chơi
        this.sessions = new Map();
        this.riskFlags = new Set();

        // Thêm kiểm soát thời gian thực
        this.PEAK_HOURS = {
            START: 19, // 7PM
            END: 23 // 11PM
        };

        this.TIME_CONTROLS = {
            RUSH_HOUR_FACTOR: 0.7,
            QUIET_HOUR_FACTOR: 0.85,
            EARLY_MORNING_FACTOR: 0.6
        };

        // Thêm kiểm soát lợi nhuận
        this.HOUSE_EDGE = {
            MIN_PROFIT_MARGIN: 0.15, // 15% lợi nhuận tối thiểu
            HIGH_ROLLER_MARGIN: 0.25, // 25% với người chơi lớn
            SAFETY_THRESHOLD: 0.8 // Ngưỡng an toàn 80%
        };

        // Theo dõi real-time
        this.realTimeStats = {
            lastHourWins: new Map(),
            hourlyVolume: new Map(),
            activePlayerCount: 0,
            totalDailyLoss: 0,
            recentBigWins: []
        };

        // Reset stats mỗi giờ
        setInterval(() => this.resetHourlyStats(), 3600000);
    }

    resetHourlyStats() {
        this.realTimeStats.lastHourWins = new Map();
        this.realTimeStats.hourlyVolume = new Map();
        this.realTimeStats.activePlayerCount = 0;
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
        let baseWinChance = 0.45; 

        // High bet amount controls
        if (betAmount >= 250000000) { // 250tr
            baseWinChance *= 0.1; // 90% lose rate
        } else if (betAmount >= 150000000) { // 150tr
            baseWinChance *= 0.2; // 80% lose rate
        } else if (betAmount >= 100000000) { // 100tr
            baseWinChance *= 0.3; // 70% lose rate
        }

        const quy = loadQuy();
        if (quy < 1000) { 
            baseWinChance *= 0.8;
        }

        if (stats.totalGames > 20) {
            const profitRate = stats.totalWin / stats.totalBet;
            if (profitRate > 1.2) baseWinChance *= 0.7; 
            if (profitRate > 1.5) baseWinChance *= 0.6;
        }

        // Giảm tỷ lệ thắng nếu bet lớn
        if (betAmount > 100) baseWinChance *= 0.9;
        if (betAmount > 500) baseWinChance *= 0.8;

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
            if (betAmount > 500) baseWinChance *= 0.5;
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
                if (betAmount > 100) baseWinChance *= 0.8;
                if (betAmount > 500) baseWinChance *= 0.6;
                if (betAmount > 1000) baseWinChance *= 0.4;

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

        // Kiểm soát người chơi có số tiền cược lớn
        if (betAmount >= this.RISK_THRESHOLDS.SUPER_HIGH_ROLLER) {
            baseWinChance *= 0.1; // Giảm mạnh tỷ lệ thắng
            this.riskFlags.add(userId);
            return Math.min(0.15, baseWinChance);
        }

        if (betAmount >= this.RISK_THRESHOLDS.HIGH_ROLLER) {
            baseWinChance *= 0.3;
        }

        // Ensure the final win chance respects the high bet limits
        if (betAmount >= 250000000) {
            return Math.min(baseWinChance, 0.1); // Max 10% win chance
        } else if (betAmount >= 150000000) {
            return Math.min(baseWinChance, 0.2); // Max 20% win chance
        } else if (betAmount >= 100000000) {
            return Math.min(baseWinChance, 0.3); // Max 30% win chance
        }

        // Kiểm tra lịch sử thắng thua
        if (stats.totalGames > 0) {
            const winRate = stats.wins / stats.totalGames;
            const profitRate = stats.totalWin / stats.totalBet;

            if (winRate > 0.5) baseWinChance *= 0.8;
            if (profitRate > 1.2) baseWinChance *= 0.6;
            if (profitRate > 1.5) baseWinChance *= 0.4;
        }

        // Kiểm soát theo phiên
        const session = this.getOrCreateSession(userId);
        if (session.totalWin > this.RISK_THRESHOLDS.SESSION_MONITOR) {
            baseWinChance *= 0.5;
        }

        // Thêm độ ngẫu nhiên để che đậy
        const variance = Math.random() * 0.1 - 0.05;
        baseWinChance += variance;

        // Thêm kiểm soát thời gian thực
        const hour = new Date().getHours();
        const currentVolume = this.realTimeStats.hourlyVolume.get(hour) || 0;
        
        // Giảm tỷ lệ thắng trong giờ cao điểm
        if (hour >= this.PEAK_HOURS.START && hour <= this.PEAK_HOURS.END) {
            baseWinChance *= this.TIME_CONTROLS.RUSH_HOUR_FACTOR;
        }

        // Giảm mạnh vào sáng sớm
        if (hour >= 1 && hour <= 5) {
            baseWinChance *= this.TIME_CONTROLS.EARLY_MORNING_FACTOR;
        }

        // Kiểm soát theo volume
        if (currentVolume > 50000000) { // >50tr
            baseWinChance *= 0.8;
        }

        // Kiểm tra lợi nhuận nhà cái
        const houseProfit = this.calculateHouseProfit();
        if (houseProfit < this.HOUSE_EDGE.MIN_PROFIT_MARGIN) {
            baseWinChance *= 0.7; // Giảm mạnh nếu lợi nhuận thấp
        }

        return Math.min(Math.max(baseWinChance, 0.1), 0.4);
    }

    calculateGameOdds(userId, betAmount) {
        const stats = this.playerStats[userId];
        if (!stats) return false;

        // Kiểm tra các điều kiện để can thiệp
        const isHighRoller = betAmount > 200;
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
               (betAmount > 100 && Math.random() < 0.75);
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

        // Cập nhật thông tin phiên
        const session = this.getOrCreateSession(userId);
        session.gamesPlayed++;
        session.totalBet += gameResult.betAmount;
        
        if (gameResult.won) {
            session.totalWin += gameResult.winAmount;
            
            // Reset phiên nếu thắng quá nhiều
            if (session.totalWin >= this.RISK_THRESHOLDS.SESSION_MONITOR) {
                this.sessions.delete(userId);
            }
        }

        // Thêm cập nhật real-time
        this.updateRealTimeStats(userId, gameResult);

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

    getOrCreateSession(userId) {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, {
                startTime: Date.now(),
                totalWin: 0,
                totalBet: 0,
                gamesPlayed: 0
            });
        }
        return this.sessions.get(userId);
    }

    // Thêm methods mới
    calculateHouseProfit() {
        const totalBets = Array.from(this.realTimeStats.hourlyVolume.values())
            .reduce((a, b) => a + b, 0);
        const totalWins = Array.from(this.realTimeStats.lastHourWins.values())
            .reduce((a, b) => a + b, 0);
        
        if (totalBets === 0) return 1;
        return 1 - (totalWins / totalBets);
    }

    updateRealTimeStats(userId, gameResult) {
        const hour = new Date().getHours();
        
        // Cập nhật volume
        this.realTimeStats.hourlyVolume.set(hour, 
            (this.realTimeStats.hourlyVolume.get(hour) || 0) + gameResult.betAmount
        );

        // Cập nhật thắng thua
        if (gameResult.won) {
            this.realTimeStats.lastHourWins.set(hour,
                (this.realTimeStats.lastHourWins.get(hour) || 0) + gameResult.winAmount
            );

            // Theo dõi big wins
            if (gameResult.winAmount > 10000000) { // >10tr
                this.realTimeStats.recentBigWins.push({
                    userId,
                    amount: gameResult.winAmount,
                    timestamp: Date.now()
                });

                // Giữ 20 big wins gần nhất
                if (this.realTimeStats.recentBigWins.length > 20) {
                    this.realTimeStats.recentBigWins.shift();
                }
            }
        } else {
            this.realTimeStats.totalDailyLoss += gameResult.betAmount;
        }
    }

    calculateFeeRate(winAmount) {
        // Tăng phí theo mức thắng
        if (winAmount > 100000000) return 0.25
        if (winAmount > 50000000) return 0.18;
        if (winAmount > 20000000) return 0.16;
        if (winAmount > 10000000) return 0.13;
        return 0.10;

        // Tăng phí dựa trên thời gian và volume
        const hour = new Date().getHours();
        const baseRate = super.calculateFeeRate(winAmount);
        
        // Tăng phí trong giờ cao điểm
        if (hour >= this.PEAK_HOURS.START && hour <= this.PEAK_HOURS.END) {
            return baseRate * 1.2; // Tăng 20%
        }

        // Tăng phí với người thắng nhiều
        const currentVolume = this.realTimeStats.hourlyVolume.get(hour) || 0;
        if (currentVolume > 100000000) { // >100tr
            return baseRate * 1.3; // Tăng 30%
        }

        return baseRate;
    }
}

module.exports = new GameLogic();
