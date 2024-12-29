const { randomInt } = require("crypto");
const fs = require('fs').promises;
const path = require('path');

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
        const baseAmount = randomInt(10, 51) * 1000;
        const multiplier = Math.min(1 + (streak * 0.1), 2.0); 
        return Math.floor(baseAmount * multiplier);
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
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        try {
            await dailyManager.init();
            
            const now = Date.now();
            const userClaim = dailyManager.claims[senderID] || { lastClaim: 0, streak: 0 };
            const timeSinceLastClaim = now - userClaim.lastClaim;

            if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
                const nextClaimTime = new Date(userClaim.lastClaim + 24 * 60 * 60 * 1000);
                return api.sendMessage(
                    `Bạn đã nhận Xu hôm nay rồi!\nQuay lại vào: ${nextClaimTime.toLocaleString('vi-VN')}`,
                    threadID,
                    messageID
                );
            }

            const streak = dailyManager.calculateStreak(senderID, now);
            const amount = dailyManager.calculateReward(streak);

            global.balance[senderID] = (global.balance[senderID] || 0) + amount;
            await dailyManager.updateClaim(senderID, now);
            await require('../utils/currencies').saveData();

            const currentBalance = global.balance[senderID] || 0;
            const streakBonus = streak > 1 ? `\nStreak hiện tại: ${streak} ngày! (x${(1 + streak * 0.1).toFixed(1)})` : '';

            return api.sendMessage(
                `🎉 Bạn đã nhận ${amount.toLocaleString('vi-VN')} Xu!${streakBonus}\n💰 Số dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} Xu`,
                threadID,
                messageID
            );
        } catch (error) {
            console.error('Daily command error:', error);
            return api.sendMessage("❌ Đã có lỗi xảy ra, vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
