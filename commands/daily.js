const { randomInt } = require("crypto");
const fs = require('fs').promises;
const path = require('path');

const BALL_REWARDS = {
    masterball: {
        chance: 0.01, 
        min: 1,
        max: 1
    },
    ultraball: {
        chance: 0.05,
        min: 1,
        max: 3
    },
    safariball: {
        chance: 0.10, 
        min: 1,
        max: 5
    },
    greatball: {
        chance: 0.30, 
        min: 2,
        max: 5
    },
    pokeball: {
        chance: 0.80, 
        min: 3,
        max: 8
    }
};

class DailyRewardManager {
    constructor() {
        this.filepath = path.join(__dirname, 'json', 'userClaims.json');
        this.claims = {};
        this.loaded = false;
    }

    async init() {
        if (this.loaded) return;
        try {
            this.claims = await this.readClaims();
            this.loaded = true;
        } catch (error) {
            console.error('Failed to initialize DailyRewardManager:', error);
            this.claims = {};
        }
    }

    async readClaims() {
        try {
            const data = await fs.readFile(this.filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    async updateClaim(userId, timestamp) {
        try {
            this.claims[userId] = {
                lastClaim: timestamp,
                streak: this.calculateStreak(userId, timestamp)
            };
            await fs.writeFile(this.filepath, JSON.stringify(this.claims, null, 2));
        } catch (error) {
            console.error('Failed to update claim:', error);
        }
    }

    calculateStreak(userId, currentTime) {
        const userClaim = this.claims[userId];
        if (!userClaim) return 1;

        const lastClaim = userClaim.lastClaim;
        const daysSinceLastClaim = Math.floor((currentTime - lastClaim) / (24 * 60 * 60 * 1000));

        if (daysSinceLastClaim === 1) {
            return (userClaim.streak || 0) + 1;
        }
        return 1;
    }

    calculateReward(streak) {
        const baseAmount = randomInt(15, 61) * 1000;
        let multiplier = Math.min(1 + (streak * 0.1), 2.5);
        
        const today = new Date().getDay();
        
        switch(today) {
            case 0: 
                multiplier += 0.5;
                break;
            case 6:
                multiplier += 0.3; 
                break;
            case 5:
                multiplier += 0.2;
                break;
            default:
                multiplier += 0.1; 
        }
        
        if (streak >= 30) multiplier += 0.5;
        else if (streak >= 14) multiplier += 0.3;
        else if (streak >= 7) multiplier += 0.2;
        
        return Math.floor(baseAmount * multiplier);
    }

    getDayBonus() {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const bonuses = ['50%', '10%', '10%', '10%', '10%', '20%', '30%'];
        const today = new Date().getDay();
        return {
            day: days[today],
            bonus: bonuses[today]
        };
    }

    async getVipBonus(userId) {
        try {
            const vipDataPath = path.join(__dirname, 'json', 'vip.json');
            const vipData = JSON.parse(await fs.readFile(vipDataPath, 'utf8'));
            const userData = vipData.users?.[userId];

            if (!userData || userData.expireTime < Date.now()) return {
                hasVip: false,
                bonus: 0
            };

            switch (userData.packageId) {
                case 3: 
                    return { hasVip: true, bonus: 80000 };
                case 2:
                    return { hasVip: true, bonus: 50000 };
                default: 
                    return { hasVip: true, bonus: 0 };
            }
        } catch (error) {
            console.error('Error getting VIP bonus:', error);
            return { hasVip: false, bonus: 0 };
        }
    }

    generateBallRewards(streak) {
        const rewards = [];
        const streakBonus = Math.min(streak * 0.05, 0.5); 

        for (const [ballType, config] of Object.entries(BALL_REWARDS)) {
            const chance = config.chance + (config.chance * streakBonus);
            if (Math.random() < chance) {
                const amount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
                rewards.push({
                    type: ballType,
                    amount
                });
            }
        }

        return rewards;
    }

    async updatePokemonInventory(userId, ballRewards) {
        try {
            const pokePath = path.join(__dirname, '..', 'commands', 'json', 'pokemon', 'pokemon.json');
            let pokeData = {};
            
            try {
                pokeData = JSON.parse(await fs.readFile(pokePath, 'utf8'));
            } catch (error) {
                console.error("Error reading Pokemon data:", error);
            }

            if (!pokeData[userId]) {
                pokeData[userId] = {
                    pokemons: [],
                    activePokemon: 0,
                    battles: 0,
                    wins: 0,
                    inventory: {
                        pokeball: 0,
                        greatball: 0,
                        ultraball: 0,
                        masterball: 0,
                        safariball: 0
                    }
                };
            }

            for (const reward of ballRewards) {
                pokeData[userId].inventory[reward.type] = 
                    (pokeData[userId].inventory[reward.type] || 0) + reward.amount;
            }

            await fs.writeFile(pokePath, JSON.stringify(pokeData, null, 2));
            return true;
        } catch (error) {
            console.error("Error updating Pokemon inventory:", error);
            return false;
        }
    }

    formatBallRewards(rewards) {
        const BALL_EMOJIS = {
            masterball: "🟣",
            ultraball: "🟡",
            safariball: "🔵",
            greatball: "🔴",
            pokeball: "⚪"
        };

        return rewards.map(reward => 
            `${BALL_EMOJIS[reward.type]} ${reward.type}: +${reward.amount}`
        ).join('\n');
    }
}

const dailyManager = new DailyRewardManager();

module.exports = {
    name: "daily",
    dev: "HNT",
    usedby: 0,
    info: "Nhận Xu mỗi ngày",
    onPrefix: true,
    usages: ".daily: Nhận Xu hàng ngày. Nhận thưởng thêm khi duy trì streak!",
    cooldowns: 5, 

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        try {
            await dailyManager.init();
            
            const now = Date.now();
            const userClaim = dailyManager.claims[senderID] || { lastClaim: 0, streak: 0 };
            const timeSinceLastClaim = now - userClaim.lastClaim;

            if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
                const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 60 * 1000));
                const minutesLeft = Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 1000)) % 60;
                return api.sendMessage(
                    `⏳ Vui lòng đợi ${hoursLeft} giờ ${minutesLeft} phút nữa!\n` +
                    `Streak hiện tại: ${userClaim.streak || 0} ngày`,
                    threadID,
                    messageID
                );
            }

            const streak = dailyManager.calculateStreak(senderID, now);
            const amount = dailyManager.calculateReward(streak);
            const dayBonus = dailyManager.getDayBonus();
            const vipInfo = await dailyManager.getVipBonus(senderID);
            const ballRewards = dailyManager.generateBallRewards(streak);

            const totalAmount = amount + (vipInfo.bonus || 0);

            global.balance[senderID] = (global.balance[senderID] || 0) + totalAmount;
            await dailyManager.updateClaim(senderID, now);
            await dailyManager.updatePokemonInventory(senderID, ballRewards);
            await require('../utils/currencies').saveData();

            const currentBalance = global.balance[senderID] || 0;
            let message = `🎉 ${dayBonus.day} - Nhận ${amount.toLocaleString('vi-VN')} Xu!\n`;
            message += `📅 Bonus hôm nay: +${dayBonus.bonus}\n`;
            
            if (vipInfo.hasVip && vipInfo.bonus > 0) {
                message += `👑 VIP Bonus: +${vipInfo.bonus.toLocaleString('vi-VN')} Xu\n`;
            }
            
            if (streak > 1) {
                message += `🔥 Streak hiện tại: ${streak} ngày (x${(1 + streak * 0.1).toFixed(1)})\n`;
                if (streak === 7) message += '🎮 Chúc mừng! Bạn đã đạt streak 7 ngày!\n';
                if (streak === 14) message += '🌟 Tuyệt vời! Streak 14 ngày!\n';
                if (streak === 30) message += '👑 Wow! Streak 30 ngày - Huyền thoại!\n';
            }

            if (ballRewards.length > 0) {
                message += "\n🎁 POKÉBALL REWARDS:\n";
                message += dailyManager.formatBallRewards(ballRewards) + "\n";
            }
            
            message += `\n💰 Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} Xu`;

            return api.sendMessage(message, threadID, messageID);
        } catch (error) {
            console.error('Daily command error:', error);
            return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
