const { randomInt } = require("crypto");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { getUserName } = require('../utils/userUtils');
const { updateBalance, getBalance } = require('../utils/currencies');
const { applyWorkTax, addToTaxFund } = require('../utils/tax');
const { addVIPPoints, getVIPProgress } = require('../utils/autoGiftcode');
const vipService = require('../game/vip/vipService');

const DAILY_VIP_POINTS = 1;

class DailyRewardManager {
  constructor() {
    this.filepath = path.join(__dirname, "../database/json/currencies/userClaims.json");
    this.claims = {};
    this.loaded = false;
  }
  
  async getUserName(userId) {
    try {
      return getUserName(userId);
    } catch (error) {
      console.error("Error getting user name:", error);
      return "Người dùng";
    }
  }

  async init() {
    if (this.loaded) return;
    try {
      this.claims = await this.readClaims();
      this.loaded = true;
    } catch (error) {
      console.error("Failed to initialize DailyRewardManager:", error);
      this.claims = {};
    }
  }

  async readClaims() {
    try {
      const data = await fs.readFile(this.filepath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async updateClaim(userId, timestamp) {
    try {
      this.claims[userId] = {
        lastClaim: timestamp,
        streak: this.calculateStreak(userId, timestamp),
      };
      await fs.writeFile(this.filepath, JSON.stringify(this.claims, null, 2));
    } catch (error) {
      console.error("Failed to update claim:", error);
    }
  }

  calculateStreak(userId, currentTime) {
    const userClaim = this.claims[userId];
    if (!userClaim) return 1;

    const lastClaim = userClaim.lastClaim;
    const daysSinceLastClaim = Math.floor(
      (currentTime - lastClaim) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastClaim === 1) {
      return (userClaim.streak || 0) + 1;
    }
    return 1;
  }

  calculateReward(streak) {
    const baseAmount = randomInt(150, 610) * 100;
    const lastClaim = userClaim.lastClaim;
    const daysSinceLastClaim = Math.floor(
      (currentTime - lastClaim) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceLastClaim === 1) {
      return (userClaim.streak || 0) + 1;
    }
    return 1;
  }

  calculateReward(streak) {
    const baseAmount = randomInt(150, 610) * 100;
    let multiplier = Math.min(1 + streak * 0.1, 2.5);

    const today = new Date().getDay();

    switch (today) {
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

  calculateExpReward(streak) {
    const baseExp = randomInt(10, 25);
    let multiplier = Math.min(1 + streak * 0.05, 2.0);

    const today = new Date().getDay();
    if (today === 0) multiplier += 0.3; 
    if (today === 6) multiplier += 0.2; 

    return Math.floor(baseExp * multiplier);
  }

  getDayBonus() {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const bonuses = ["50%", "10%", "10%", "10%", "10%", "20%", "30%"];
    const today = new Date().getDay();
    return {
      day: days[today],
      bonus: bonuses[today],
    };
  }

  async getVipBonus(userId) {
    try {
      const vipDataPath = path.join(__dirname, "../database/json/vip.json");
      const vipData = JSON.parse(await fs.readFile(vipDataPath, "utf8"));
      const userData = vipData.users?.[userId];

      if (!userData || userData.expireTime < Date.now())
        return {
          hasVip: false,
          bonus: 0,
        };

      switch (userData.packageId) {
        case 3:
          return { hasVip: true, bonus: 800000, packageId: 3 };
        case 2:
          return { hasVip: true, bonus: 500000, packageId: 2 };
        default:
          return { hasVip: true, bonus: 300000, packageId: 1 };
      }
    } catch (error) {
      console.error("Error getting VIP bonus:", error);
      return { hasVip: false, bonus: 0 };
    }
  }

  async updateUserExp(userId, expAmount) {
    try {
      const userDataPath = path.join(
        __dirname,
        "../database/rankData.json"
      );
      let userData = {};

      try {
        userData = JSON.parse(await fs.readFile(userDataPath, "utf8"));
      } catch (error) {
        console.error("Error reading user data:", error);
      }

      if (!userData[userId]) {
        userData[userId] = {
          exp: 0,
          level: 1,
        };
      }

      userData[userId].exp = (userData[userId].exp || 0) + expAmount;
      await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));
      return true;
    } catch (error) {
      console.error("Error updating user EXP:", error);
      return false;
    }
  }

}

const dailyManager = new DailyRewardManager();

async function updateDailyCheckin(userId) {
  try {
    const userQuests = require('../utils/currencies').getUserQuests(userId);
    if (!userQuests.completed['daily_checkin']) {
      userQuests.progress['daily_checkin'] = (userQuests.progress['daily_checkin'] || 0) + 1;
    }
  } catch (error) {
    console.error("Error updating daily checkin quest:", error);
  }
}

module.exports = {
  name: "daily",
  dev: "HNT",
  usedby: 0,
  category: "Tài Chính",
  info: "Nhận $ và EXP mỗi ngày",
  onPrefix: true,
  usages: ".daily: Nhận thưởng hàng ngày. Nhận thưởng thêm khi duy trì streak!",
  cooldowns: 5,

  onLaunch: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
      await dailyManager.init();

      const now = Date.now();
      const userClaim = dailyManager.claims[senderID] || {
        lastClaim: 0,
        streak: 0,
      };
      const timeSinceLastClaim = now - userClaim.lastClaim;
      const CLAIM_INTERVAL = 24 * 60 * 60 * 1000;

      if (timeSinceLastClaim < CLAIM_INTERVAL) {
        const hoursLeft = Math.floor((CLAIM_INTERVAL - timeSinceLastClaim) / (60 * 60 * 1000));
        const minutesLeft = Math.floor((CLAIM_INTERVAL - timeSinceLastClaim) % (60 * 60 * 1000) / (60 * 1000));
        return api.sendMessage(
          `⏳ Vui lòng đợi ${hoursLeft} giờ ${minutesLeft} phút nữa!\n` +
          `Streak hiện tại: ${userClaim.streak || 0} ngày`,
          threadID,
          messageID
        );
      }

      // Reset streak chỉ khi quá 48h không claim
      const streakReset = timeSinceLastClaim >= 48 * 60 * 60 * 1000;
      const streak = streakReset ? 1 : dailyManager.calculateStreak(senderID, now);

      const amount = dailyManager.calculateReward(streak);
      const expAmount = dailyManager.calculateExpReward(streak);
      const dayBonus = dailyManager.getDayBonus();
      const vipInfo = await dailyManager.getVipBonus(senderID);

      const totalAmount = amount + (vipInfo.bonus || 0);
      const { netPay, taxAmount } = applyWorkTax(totalAmount, senderID);

      if (netPay > 0) {
        updateBalance(senderID, netPay);
      }
      if (taxAmount > 0) {
        addToTaxFund(taxAmount);
      }
      await dailyManager.updateClaim(senderID, now);
      await dailyManager.updateUserExp(senderID, expAmount);

      const vipResult = addVIPPoints(senderID, DAILY_VIP_POINTS);
      if (vipResult.vipGoldAwarded) {
        try {
          const setResult = vipService.setVIP(senderID, 3, 1);
          if (setResult.success) setTimeout(() => api.sendMessage("🌟 CHÚC MỪNG ĐẠT VIP GOLD! 🌟\nBạn đã được tặng 37 ngày VIP Gold (tích điểm từ daily + giftcode + work)!", threadID), 1500);
        } catch (_) {}
      }
      const vipProgress = getVIPProgress(senderID);

      await updateDailyCheckin(senderID);

      const currentBalance = getBalance(senderID) || 0;
      let userName = await dailyManager.getUserName(senderID);
      if (userName === "Người dùng" && event.senderName) userName = event.senderName;

      let msg = `『 PHẦN THƯỞNG HÀNG NGÀY 』\n\n`;
      msg += `👤 ${userName}\n`;
      msg += `🔥 Chuỗi điểm danh: ${streak} ngày\n\n`;
      msg += `💰 Tiền: +${netPay.toLocaleString('vi-VN')} $${vipInfo.hasVip ? ' (đã gồm bonus VIP)' : ''}\n`;
      msg += `⭐ EXP: +${expAmount}\n`;
      msg += `📅 Thưởng ${dayBonus.day}: ${dayBonus.bonus}\n\n`;
      msg += `👑 Điểm VIP: +${DAILY_VIP_POINTS} → Tổng ${vipProgress.points}/90\n`;
      msg += `💡 Tích đủ 90 điểm để nhận VIP Gold. Xem: .rewards vip\n\n`;
      msg += `💰 Số dư: ${currentBalance.toLocaleString('vi-VN')} $\n`;
      msg += `⏰ Nhận thưởng tiếp theo sau 24 giờ`;

      return api.sendMessage(msg, threadID, messageID);
    } catch (error) {
      console.error("Daily command error:", error);
      return api.sendMessage(
        "❌ Đã có lỗi xảy ra, vui lòng thử lại sau!",
        threadID,
        messageID
      );
    }
  },
};
