const fs = require('fs').promises;
const path = require('path');

class LottoManager {
    static RATES = {
        DE: 70,
        LO: 99000, // Changed to fixed amount
        '3-CANG': 960
    };

    static BET_AMOUNTS = {
        lo: 27000, // Fixed bet amount for lo
        de: 10000, // Minimum for de
        '3-cang': 10000 // Minimum for 3-cang
    };

    static dataPath = path.join(__dirname, '..', 'json', 'lotteryData.json');
    static data = null;
    static dataLock = false;

    static async loadData() {
        try {
            if (!this.data) {
                const rawData = await fs.readFile(this.dataPath, 'utf8');
                this.data = JSON.parse(rawData);
            }
            return this.data;
        } catch (error) {
            this.data = { bets: {}, statistics: {}, dailyLimits: {} };
            await this.saveData();
            return this.data;
        }
    }

    static async saveData() {
        while(this.dataLock) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.dataLock = true;
        try {
            await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
        } finally {
            this.dataLock = false;
        }
    }

    static async recordBet(userId, type, numbers, amount) {
        await this.loadData();
        const today = new Date().toLocaleDateString('vi-VN');
        
        // Initialize user data if not exists
        if (!this.data.bets[userId]) {
            this.data.bets[userId] = [];
        }
        if (!this.data.statistics[userId]) {
            this.data.statistics[userId] = {
                totalBet: 0,
                totalWin: 0,
                totalLoss: 0
            };
        }
        if (!this.data.dailyLimits[today]) {
            this.data.dailyLimits[today] = {};
        }
        if (!this.data.dailyLimits[today][userId]) {
            this.data.dailyLimits[today][userId] = 0;
        }

        // Record bet
        this.data.bets[userId].push({
            type,
            numbers,
            amount,
            timestamp: Date.now(),
            date: today
        });

        // Update daily limit
        this.data.dailyLimits[today][userId] += amount;

        await this.saveData();
    }

    static async recordResult(userId, betAmount, winAmount) {
        await this.loadData();
        
        if (!this.data.statistics[userId]) {
            this.data.statistics[userId] = {
                totalBet: 0,
                totalWin: 0,
                totalLoss: 0
            };
        }

        this.data.statistics[userId].totalBet += betAmount;
        if (winAmount > 0) {
            this.data.statistics[userId].totalWin += winAmount;
        } else {
            this.data.statistics[userId].totalLoss += betAmount;
        }

        await this.saveData();
    }

    static async getDailyLimit(userId) {
        await this.loadData();
        const today = new Date().toLocaleDateString('vi-VN');
        return this.data.dailyLimits[today]?.[userId] || 0;
    }

    // Add daily limit check
    static async checkDailyLimit(userId, amount) {
        const dailyLimit = await this.getDailyLimit(userId);
        const maxDailyBet = 1000000; // 1 triệu xu một ngày
        return (dailyLimit + amount) <= maxDailyBet;
    }

    static validateBet(type, numbers) {
        if (!['de', 'lo', '3-cang'].includes(type)) return false;
        if (type === '3-cang' && !/^\d{3}$/.test(numbers)) return false;
        if (['de', 'lo'].includes(type) && !/^\d{2}$/.test(numbers)) return false;
        return true;
    }

    static isAfterResultTime() {
        const now = new Date();
        const resultTime = new Date();
        resultTime.setHours(18, 30, 0, 0);
        return now >= resultTime;
    }

    static isValidBetTime() {
        const now = new Date();
        const resultTime = new Date();
        resultTime.setHours(18, 33, 0, 0);
        
        // If current time is past 18:33, compare with tomorrow's result
        if (now > resultTime) {
            resultTime.setDate(resultTime.getDate() + 1);
        }
        
        // Allow betting up until 18:33
        return now <= resultTime;
    }

    static calculateWinnings(type, numbers, amount, results) {
        let winAmount = 0;
        
        switch(type) {
            case 'de':
                const deNumber = results['ĐB'][0].slice(-2);
                if (deNumber === numbers) {
                    winAmount = amount * this.RATES.DE;
                }
                break;
            
            case 'lo':
                let matches = 0;
                for (const giaiKey in results) {
                    if (giaiKey === 'ĐB') continue;
                    results[giaiKey].forEach(num => {
                        if (num.slice(-2) === numbers) matches++;
                    });
                }
                // Use fixed amount for lo regardless of input amount
                winAmount = this.RATES.LO * matches;
                break;
            
            case '3-cang':
                const dbNumber = results['ĐB'][0].slice(-3);
                if (dbNumber === numbers) {
                    winAmount = amount * this.RATES['3-CANG'];
                }
                break;
        }
        
        return winAmount;
    }

    static getBetAmount(type) {
        return this.BET_AMOUNTS[type] || 10000;
    }
}

module.exports = LottoManager;
