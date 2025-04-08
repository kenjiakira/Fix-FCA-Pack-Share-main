const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance, loadQuests, getUserQuests, canClaimRewards, setRewardClaimed } = require('../utils/currencies');
const { 
  createGiftcode, 
  loadGiftcodes, 
  sendGiftcodeAnnouncement, 
  createAutoGiftcode, 
  checkDailyLimit, 
  updateDailyLimit,
  GIFTCODE_TYPES,
  REWARD_TYPES,
  addVIPPoints,
  getVIPProgress,
  createVIPGiftcode,
  getAvailableVIPGifts,
  markVIPGiftSent,
  sendVIPGiftAnnouncement 
} = require('../utils/autoGiftcode');
const { updateStreak, getStreak } = require('../utils/streakSystem');
const { getVIPBenefits } = require('../game/vip/vipCheck');

function formatNumber(number) {
  return number.toLocaleString('vi-VN');
}

module.exports = {
  name: "rewards",
  dev: "HNT", 
  onPrefix: true,
  usedby: 0,
  category: "Tài Chính",
  info: "Hệ thống phần thưởng (Nhiệm vụ & Giftcode)",
  usages: "[quest/redeem/create/list/stats/vip] [code/options]",
  cooldowns: 5,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const cmd = target[0]?.toLowerCase();
    const isAdmin = global.cc.adminBot.includes(senderID);
    
    if (!cmd || !['quest', 'redeem', 'create', 'list', 'stats', 'vip'].includes(cmd)) {
      return api.sendMessage(
        "🎁 HƯỚNG DẪN SỬ DỤNG REWARDS\n━━━━━━━━━━━━━━━━━━\n\n" +
        "1️⃣ Nhiệm vụ hằng ngày:\n→ .rewards quest\n" +
        "💡 Hoàn thành để nhận xu và phần thưởng\n\n" +
        "2️⃣ Đổi giftcode:\n→ .rewards redeem <code>\n" +
        "💡 Nhập mã code để nhận quà\n\n" +
        "3️⃣ Thống kê giftcode:\n→ .rewards stats\n" +
        "💡 Xem thống kê gift code của bạn\n\n" +
        "4️⃣ Tiến trình VIP Gold:\n→ .rewards vip\n" +
        "💡 Xem tiến trình tích điểm VIP Gold\n" +
        "5️⃣ Quà tặng VIP:\n→ .rewards vip gift\n" +
        "💡 Nhận quà đặc quyền cho VIP Gold\n" +
        (isAdmin ? 
        "\n👑 Lệnh Admin:\n→ .rewards create <loại> <số xu> <mô tả>\n→ .rewards list\n→ .rewards vip create\n" : "") +
        "\n📌 Thông tin quan trọng:\n" +
        "• ⏰ Nhiệm vụ reset lúc 0h\n" +
        "• 🎁 Giftcode phát hàng ngày lúc 12h\n" +
        "• 🔥 Duy trì chuỗi để nhận thêm thưởng\n" +
        "• 💎 Mỗi loại giftcode có giới hạn sử dụng khác nhau\n" +
        "• 👑 Tích đủ 90 điểm trong 30 ngày liên tiếp sẽ nhận VIP Gold",
        threadID, messageID
      );
    }

    switch(cmd) {
      case 'quest':
        await this.handleQuests({ api, event });
        break;
      case 'redeem':
        await this.handleRedeem({ api, event, code: target[1] });
        break;
      case 'create':
        if (!isAdmin) return api.sendMessage("❌ Chỉ admin mới có thể sử dụng lệnh này!", threadID, messageID);
        await this.handleCreate({ api, event, target });
        break;
      case 'list':
        if (!isAdmin) return api.sendMessage("❌ Chỉ admin mới có thể sử dụng lệnh này!", threadID, messageID);
        await this.handleList({ api, event });
        break;
      case 'stats':
        await this.handleStats({ api, event });
        break;
      case 'vip':
        const subCmd = target[1]?.toLowerCase();
        if (subCmd === 'gift') {
          await this.handleVIPGift({ api, event });
        } else if (subCmd === 'create' && isAdmin) {
          await this.handleCreateVIPGift({ api, event });
        } else {
          await this.handleVIP({ api, event });
        }
        break;
    }
  },

  handleQuests: async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const quests = await loadQuests();
    const userQuests = getUserQuests(senderID);
    const vipBenefits = getVIPBenefits(senderID);
    const streak = getStreak(senderID);

    const completedQuests = Object.entries(quests.dailyQuests)
      .filter(([questId, quest]) => {
        const progress = userQuests.progress[questId] || 0;
        return progress >= quest.target && !userQuests.completed[questId];
      });

    if (completedQuests.length > 0) {
      let totalReward = completedQuests.reduce((sum, [_, quest]) => sum + quest.reward, 0);
      let bonusAmount = 0;
      
      if (vipBenefits && vipBenefits.packageId > 0) {
        const vipBonus = {
          1: 0.2, 
          2: 0.5,
          3: 1.0
        }[vipBenefits.packageId] || 0;

        bonusAmount = Math.floor(totalReward * vipBonus);
        totalReward += bonusAmount;
      }

      completedQuests.forEach(([questId]) => userQuests.completed[questId] = true);
      updateBalance(senderID, totalReward);
      setRewardClaimed(senderID);

      return api.sendMessage(
        `🎉 Chúc mừng! Bạn đã nhận được ${formatNumber(totalReward)} $!\n` +
        `${bonusAmount > 0 ? `👑 Thưởng VIP +${Math.round(bonusAmount/(totalReward-bonusAmount)*100)}%: ${formatNumber(bonusAmount)} $\n` : ''}` +
        `📝 Đã hoàn thành ${completedQuests.length} nhiệm vụ.\n` +
        `⭐ Tiếp tục cố gắng nhé!`,
        threadID, messageID
      );
    }

    let message = "📋 NHIỆM VỤ HÀNG NGÀY\n━━━━━━━━━━━━━━━━━━\n\n";
    
    if (vipBenefits && vipBenefits.packageId > 0) {
      message += `👑 Đặc quyền VIP ${vipBenefits.packageId}:\n`;
      message += `• ⬆️ Thưởng nhiệm vụ +${vipBenefits.packageId === 3 ? '100' : 
                  vipBenefits.packageId === 2 ? '50' : '20'}%\n`;
      message += `• 🚀 Tích lũy nhanh hơn ${vipBenefits.packageId * 20}%\n\n`;
    }

    message += `🔥 Chuỗi hoàn thành: ${streak.current} ngày\n`;
    if (streak.current > 0) {
      const nextMilestone = [3,7,14,30].find(x => x > streak.current) || 30;
      message += `⭐ Mốc thưởng tiếp theo: ${nextMilestone} ngày\n`;
      message += `💰 Phần thưởng: ${formatNumber(quests.streakRewards[nextMilestone])} $\n\n`;
    }

    let totalCompleted = 0;
    let totalQuests = Object.keys(quests.dailyQuests).length;

    for (const [questId, quest] of Object.entries(quests.dailyQuests)) {
      const progress = userQuests.progress[questId] || 0;
      const vipProgress = (vipBenefits && vipBenefits.packageId > 0) ? 
                          Math.floor(progress * (1 + vipBenefits.packageId * 0.2)) : 
                          progress;
      
      if (userQuests.completed[questId]) totalCompleted++;
      
      const status = userQuests.completed[questId] ? "✅" : vipProgress >= quest.target ? "⭐" : "▪️";
      message += `${status} ${quest.name}\n`;
      message += `👉 ${quest.description}\n`;
      message += `🎯 Tiến độ: ${vipProgress}/${quest.target}\n`;
      message += `💰 Phần thưởng: ${formatNumber(quest.reward)} $`;
      
      if (vipBenefits && vipBenefits.packageId > 0) {
        const vipBonus = vipBenefits.packageId === 3 ? 1 : 
                         vipBenefits.packageId === 2 ? 0.5 : 0.2;
        message += ` (+${formatNumber(Math.floor(quest.reward * vipBonus))} $ VIP)`;
      }
      
      message += `\n\n`;
    }

    if (totalCompleted === totalQuests) {
      const streakReward = await updateStreak(senderID);
      if (streakReward > 0) {
        message += `\n🎊 PHẦN THƯỞNG CHUỖI ĐẶC BIỆT 🎊\n`;
        message += `💰 +${formatNumber(streakReward)} $ cho ${streak.current} ngày liên tiếp!\n`;
        updateBalance(senderID, streakReward);
      }
    }

    if (totalCompleted === totalQuests && canClaimRewards(senderID) === false) {
      return api.sendMessage(
        "⏰ Hôm nay bạn đã nhận thưởng tất cả nhiệm vụ rồi!\n" +
        (vipBenefits ? "👑 Ngày mai nhận thêm thưởng VIP nhé!\n" : "") +
        "Vui lòng quay lại vào ngày mai!",
        threadID, messageID
      );
    }

    api.sendMessage(message, threadID, messageID);
  },

  handleRedeem: async function({ api, event, code }) {
    const { threadID, messageID, senderID } = event;

    if (!code) {
      return api.sendMessage("❌ Vui lòng nhập mã code!", threadID, messageID);
    }

    const giftcodeData = loadGiftcodes();
    const giftcode = giftcodeData.codes[code.toUpperCase()];

    if (!giftcode) {
      return api.sendMessage("❌ Code không tồn tại hoặc đã hết hạn!", threadID, messageID);
    }

    if (giftcode.usedBy.includes(senderID)) {
      return api.sendMessage("❌ Bạn đã sử dụng code này rồi!", threadID, messageID);
    }

    if (giftcode.maxUses && giftcode.usedBy.length >= giftcode.maxUses) {
      return api.sendMessage("❌ Code đã đạt giới hạn số lần sử dụng!", threadID, messageID);
    }

    const expiryDate = new Date(giftcode.expiry);
    if (expiryDate < new Date()) {
      return api.sendMessage("❌ Code đã hết hạn sử dụng!", threadID, messageID);
    }
    
    // Kiểm tra giới hạn sử dụng giftcode theo loại
    if (giftcode.type) {
      const dailyLimit = checkDailyLimit(senderID, giftcode.type);
      if (!dailyLimit.canUse) {
        return api.sendMessage(
          `❌ Bạn đã sử dụng tối đa ${dailyLimit.limit} mã loại ${giftcode.rarity} trong ngày hôm nay!\n` +
          `⏰ Vui lòng quay lại vào ngày mai.`,
          threadID, messageID
        );
      }
      
      // Cập nhật giới hạn sử dụng
      updateDailyLimit(senderID, giftcode.type);
    }

    giftcode.usedBy.push(senderID);
    fs.writeFileSync(path.join(__dirname, '../database/json/giftcodes.json'), JSON.stringify(giftcodeData, null, 2));

    // Xử lý phần thưởng
    let rewardMessage = "";
    let vipPoints = 0;
    
    if (giftcode.rewards) {
      // Xử lý phần thưởng mới (đa dạng)
      if (giftcode.rewards.coins) {
        updateBalance(senderID, giftcode.rewards.coins);
        rewardMessage += `💰 ${formatNumber(giftcode.rewards.coins)} Xu\n`;
      }
      
      if (giftcode.rewards.vip_points) {
        vipPoints = giftcode.rewards.vip_points;
        rewardMessage += `👑 ${giftcode.rewards.vip_points} Điểm tích VIP Gold\n`;
      }
      
      if (giftcode.rewards.exp) {
        // Thêm EXP nếu có hàm xử lý
        try {
          const { addExperience } = require('../utils/userExperience');
          addExperience(senderID, giftcode.rewards.exp);
          rewardMessage += `⭐ ${giftcode.rewards.exp} EXP\n`;
        } catch (error) {
          console.error('Error adding EXP:', error);
        }
      }
    } else if (typeof giftcode.reward === 'number') {
      // Xử lý phần thưởng cũ (chỉ có xu)
      updateBalance(senderID, giftcode.reward);
      rewardMessage = `💰 ${formatNumber(giftcode.reward)} Xu\n`;
      
      // Thêm 1 điểm VIP cho giftcode loại cũ
      vipPoints = 1;
      rewardMessage += `👑 1 Điểm tích VIP Gold\n`;
    }
    
    // Cập nhật điểm VIP Gold
    if (vipPoints > 0) {
      const vipResult = addVIPPoints(senderID, vipPoints);
      
      // Kiểm tra xem user đã đạt VIP Gold chưa
      if (vipResult.vipGoldAwarded) {
        try {
          // Cấp VIP Gold nếu có hàm xử lý
          const { addVIPGold } = require('../game/vip/vipSystem');
          addVIPGold(senderID);
          
          // Thông báo đạt VIP Gold
          setTimeout(() => {
            api.sendMessage(
              "🌟 CHÚC MỪNG - ĐẠT VIP GOLD 🌟\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              `👤 User ID: ${senderID}\n` +
              "👑 Bạn đã đạt đủ điều kiện để nhận VIP Gold!\n" +
              "✅ Đã tích lũy đủ 90 điểm\n" +
              "✅ Đã duy trì chuỗi 30 ngày liên tiếp\n\n" +
              "🎁 VIP Gold đã được kích hoạt cho tài khoản của bạn\n" +
              "💎 Tận hưởng những đặc quyền VIP Gold nhé!",
              threadID
            );
          }, 2000);
        } catch (error) {
          console.error('Error adding VIP Gold:', error);
        }
      }
    }

    // Thêm hiệu ứng đặc biệt cho các loại giftcode hiếm
    let specialEffect = "";
    if (giftcode.type === 'LEGENDARY' || giftcode.type === 'SPECIAL') {
      specialEffect = "\n✨✨✨✨✨✨✨✨✨✨\n";
    } else if (giftcode.type === 'EPIC' || giftcode.type === 'EVENT') {
      specialEffect = "\n✨✨✨✨✨\n";
    }

    return api.sendMessage(
      `${specialEffect}🎉 ĐỔI CODE THÀNH CÔNG! 🎉${specialEffect}\n\n` +
      `📝 Mã code: ${code.toUpperCase()}\n` +
      `💝 Quà tặng:\n${rewardMessage}` +
      `🏆 Độ hiếm: ${giftcode.rarity}\n` +
      `📜 Mô tả: ${giftcode.description}\n` +
      `👥 Số người đã dùng: ${giftcode.usedBy.length}${giftcode.maxUses ? `/${giftcode.maxUses}` : ''}\n\n` +
      `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu`,
      threadID, messageID
    );
  },

  handleCreate: async function({ api, event, target }) {
    const { threadID, messageID } = event;
    
    if (target.length < 3) {
      return api.sendMessage(
        "❌ Vui lòng nhập đúng cú pháp:\n" +
        ".rewards create <loại> <số xu> <mô tả>\n\n" +
        "Loại giftcode:\n" +
        "- normal: Giftcode thường\n" +
        "- rare: Giftcode hiếm\n" +
        "- epic: Giftcode epic\n" +
        "- legendary: Giftcode huyền thoại\n" +
        "- event: Giftcode sự kiện\n" +
        "- special: Giftcode đặc biệt\n\n" +
        "Ví dụ: .rewards create epic 5000000 Quà tặng đặc biệt",
        threadID, messageID
      );
    }
    
    const typeInput = target[1].toUpperCase();
    const validTypes = Object.keys(GIFTCODE_TYPES);
    const type = validTypes.includes(typeInput) ? typeInput : 'NORMAL';
    
    const rewardInput = parseInt(target[2]);
    if (isNaN(rewardInput) || rewardInput <= 0) {
      return api.sendMessage("❌ Số xu phải là một số dương!", threadID, messageID);
    }
    
    const description = target.slice(3).join(" ") || `Giftcode ${GIFTCODE_TYPES[type].rarity}`;

    // Tạo phần thưởng ngẫu nhiên dựa trên loại
    const typeConfig = GIFTCODE_TYPES[type];
    let rewards = { 
      coins: rewardInput,
      vip_points: typeConfig.vipPoints || 1
    };
    
    // Thêm phần thưởng bonus nếu có
    if (typeConfig.bonusRewards) {
      for (const [rewardType, rewardConfig] of Object.entries(typeConfig.bonusRewards)) {
        if (rewardType === 'vip_points' || rewardType === 'exp') {
          rewards[rewardType] = Math.floor(Math.random() * (rewardConfig.max - rewardConfig.min + 1)) + rewardConfig.min;
        }
      }
    }

    const code = createGiftcode(rewards, description, typeConfig.expHours, type, REWARD_TYPES.MIXED);
    await sendGiftcodeAnnouncement(api, code, rewards, type);
    
    let rewardText = `💰 ${formatNumber(rewards.coins)} Xu`;
    if (rewards.vip_points) rewardText += `\n👑 ${rewards.vip_points} Điểm tích VIP Gold`;
    if (rewards.exp) rewardText += `\n⭐ ${rewards.exp} EXP`;
    
    return api.sendMessage(
      "✅ Tạo giftcode thành công!\n\n" +
      `📝 Code: ${code}\n` +
      `💝 Phần thưởng:\n${rewardText}\n` +
      `📜 Mô tả: ${description}\n` +
      `⏰ Thời hạn: ${typeConfig.expHours} giờ\n` +
      `👥 Giới hạn: ${typeConfig.maxUses || 'Không giới hạn'} người dùng\n` +
      "📢 Đã thông báo tới tất cả các nhóm",
      threadID, messageID
    );
  },

  handleList: async function({ api, event }) {
    const { threadID, messageID } = event;
    const giftcodeData = loadGiftcodes();
    const codes = Object.entries(giftcodeData.codes);

    if (codes.length === 0) {
      return api.sendMessage("❌ Hiện không có giftcode nào!", threadID, messageID);
    }

    let message = "📋 DANH SÁCH GIFTCODE\n━━━━━━━━━━━━━━━━━━\n\n";
    
    // Phân loại gift code theo độ hiếm
    const categorizedCodes = {};
    codes.forEach(([code, data]) => {
      const type = data.type || 'NORMAL';
      if (!categorizedCodes[type]) {
        categorizedCodes[type] = [];
      }
      categorizedCodes[type].push([code, data]);
    });
    
    // Sắp xếp hiển thị theo thứ tự ưu tiên
    const displayOrder = ['LEGENDARY', 'SPECIAL', 'EPIC', 'EVENT', 'RARE', 'NORMAL'];
    
    for (const type of displayOrder) {
      if (categorizedCodes[type] && categorizedCodes[type].length > 0) {
        const typeConfig = GIFTCODE_TYPES[type];
        message += `🏆 LOẠI: ${typeConfig.rarity.toUpperCase()}\n`;
        
        categorizedCodes[type].forEach(([code, data]) => {
          let rewardText = '';
          if (data.rewards) {
            if (data.rewards.coins) rewardText += `\n  • ${formatNumber(data.rewards.coins)} $`;
            if (data.rewards.vip_points) rewardText += `\n  • ${data.rewards.vip_points} Điểm VIP Gold`;
            if (data.rewards.exp) rewardText += `\n  • ${data.rewards.exp} EXP`;
          } else if (data.reward) {
            rewardText = ` ${formatNumber(data.reward)} $`;
          }
          
          message += `\n📝 Code: ${code}\n`;
          message += `💝 Quà:${rewardText}\n`;
          message += `📜 Mô tả: ${data.description}\n`;
          message += `⏰ Hết hạn: ${new Date(data.expiry).toLocaleString('vi-VN')}\n`;
          message += `👥 Đã dùng: ${data.usedBy.length}${data.maxUses ? `/${data.maxUses}` : ''}\n`;
          message += `━━━━━━━━━━━━━━━━━━\n`;
        });
      }
    }

    return api.sendMessage(message, threadID, messageID);
  },
  
  handleStats: async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const giftcodeData = loadGiftcodes();
    const codes = Object.values(giftcodeData.codes);
    
    // Tìm các gift code đã sử dụng
    const usedCodes = codes.filter(code => code.usedBy && code.usedBy.includes(senderID));
    
    // Thống kê theo loại
    const statsByType = {};
    const validTypes = Object.keys(GIFTCODE_TYPES);
    
    for (const type of validTypes) {
      statsByType[type] = {
        count: 0,
        coins: 0,
        vip_points: 0,
        exp: 0
      };
    }
    
    // Tính tổng phần thưởng
    let totalCoins = 0;
    let totalVipPoints = 0;
    let totalExp = 0;
    
    usedCodes.forEach(code => {
      const type = code.type || 'NORMAL';
      
      if (validTypes.includes(type)) {
        statsByType[type].count++;
        
        if (code.rewards) {
          if (code.rewards.coins) {
            statsByType[type].coins += code.rewards.coins;
            totalCoins += code.rewards.coins;
          }
          
          if (code.rewards.vip_points) {
            statsByType[type].vip_points += code.rewards.vip_points;
            totalVipPoints += code.rewards.vip_points;
          }
          
          if (code.rewards.exp) {
            statsByType[type].exp += code.rewards.exp;
            totalExp += code.rewards.exp;
          }
        } else if (code.reward) {
          statsByType[type].coins += code.reward;
          totalCoins += code.reward;
          
          // Đếm +1 điểm VIP cho mỗi gift code cũ
          statsByType[type].vip_points += 1;
          totalVipPoints += 1;
        }
      }
    });
    
    // Kiểm tra giới hạn sử dụng hôm nay
    const dailyLimits = {};
    for (const type of validTypes) {
      const limit = checkDailyLimit(senderID, type);
      dailyLimits[type] = limit;
    }
    
    // Lấy thông tin tiến trình VIP
    const vipProgress = getVIPProgress(senderID);
    
    // Tạo thông báo
    let message = "📊 THỐNG KÊ GIFTCODE CỦA BẠN\n━━━━━━━━━━━━━━━━━━\n\n";
    
    message += `👤 ID: ${senderID}\n`;
    message += `🎁 Tổng gift code đã dùng: ${usedCodes.length}\n`;
    message += `💰 Tổng xu nhận được: ${formatNumber(totalCoins)}\n`;
    
    if (totalVipPoints > 0) {
      message += `👑 Tổng điểm VIP Gold: ${totalVipPoints}\n`;
      message += `🔄 Tiến độ VIP Gold: ${vipProgress.progress}%\n`;
    }
    
    if (totalExp > 0) {
      message += `⭐ Tổng EXP: ${totalExp}\n`;
    }
    
    message += "\n📅 GIỚI HẠN HÔM NAY\n";
    for (const type of validTypes) {
      const typeConfig = GIFTCODE_TYPES[type];
      const limit = dailyLimits[type];
      
      if (limit && typeConfig) {
        message += `• ${typeConfig.rarity}: ${limit.used}/${limit.limit}\n`;
      }
    }
    
    message += "\n🏆 CHI TIẾT THEO LOẠI\n";
    for (const type of validTypes) {
      const stats = statsByType[type];
      const typeConfig = GIFTCODE_TYPES[type];
      
      if (stats.count > 0) {
        message += `\n▪️ ${typeConfig.rarity}: ${stats.count} code\n`;
        
        if (stats.coins > 0) {
          message += `  • Xu: ${formatNumber(stats.coins)}\n`;
        }
        
        if (stats.vip_points > 0) {
          message += `  • Điểm VIP Gold: ${stats.vip_points}\n`;
        }
        
        if (stats.exp > 0) {
          message += `  • EXP: ${stats.exp}\n`;
        }
      }
    }
    
    message += "\n💡 Gõ .rewards vip để xem chi tiết tiến trình VIP Gold";
    
    return api.sendMessage(message, threadID, messageID);
  },
  
  handleVIP: async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    
    // Lấy thông tin tiến trình VIP
    const vipProgress = getVIPProgress(senderID);
    
    // Tạo thông báo
    let message = "👑 TIẾN TRÌNH VIP GOLD\n━━━━━━━━━━━━━━━━━━\n\n";
    
    // Thông tin điểm và chuỗi ngày
    message += `👤 User ID: ${senderID}\n`;
    message += `💰 Điểm tích lũy: ${vipProgress.points}/90 (${vipProgress.progress}%)\n`;
    message += `📆 Chuỗi ngày: ${vipProgress.streak}/30 (${vipProgress.streakProgress}%)\n`;
    
    // Hiển thị tiến độ dưới dạng thanh
    const pointsBar = createProgressBar(vipProgress.progress);
    const streakBar = createProgressBar(vipProgress.streakProgress);
    
    message += `\n📊 Tiến độ điểm:\n${pointsBar}\n`;
    message += `📊 Tiến độ chuỗi ngày:\n${streakBar}\n`;
    
    // Thông tin trạng thái VIP Gold
    if (vipProgress.vipGoldAwarded) {
      message += "\n✅ Bạn đã đạt VIP Gold!\n";
      message += "🎖️ Tận hưởng các đặc quyền VIP Gold nhé!";
    } else {
      message += "\n⏳ Chưa đạt VIP Gold\n";
      
      // Tính số điểm cần thêm
      const neededPoints = Math.max(0, 90 - vipProgress.points);
      const neededDays = Math.max(0, 30 - vipProgress.streak);
      
      message += `👉 Cần thêm ${neededPoints} điểm\n`;
      message += `👉 Cần duy trì thêm ${neededDays} ngày liên tiếp\n\n`;
      
      message += "💡 Cách tăng điểm:\n";
      message += "• Đổi giftcode hàng ngày\n";
      message += "• Giftcode càng hiếm, điểm càng cao\n";
      message += "• Duy trì chuỗi bằng cách đổi ít nhất 1 gift code mỗi ngày";
    }
    
    if (vipProgress.lastUpdated) {
      message += `\n\n⏰ Cập nhật gần nhất: ${new Date(vipProgress.lastUpdated).toLocaleString('vi-VN')}`;
    }
    
    return api.sendMessage(message, threadID, messageID);
  },

  handleVIPGift: async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    
    // Kiểm tra xem người dùng có phải VIP Gold không
    const vipBenefits = getVIPBenefits(senderID);
    
    if (!vipBenefits || vipBenefits.packageId < 3) {
      return api.sendMessage(
        "❌ Bạn không phải là thành viên VIP Gold!\n" +
        "👑 Đặc quyền này chỉ dành cho người dùng VIP Gold.\n" +
        "💎 Gõ '.vip gold' để xem cách mua VIP Gold.",
        threadID, messageID
      );
    }
    
    // Lấy danh sách quà VIP Gold có sẵn
    const availableGifts = getAvailableVIPGifts(senderID, 'GOLD');
    
    if (availableGifts.length === 0) {
      return api.sendMessage(
        "😔 Hiện không có quà VIP Gold nào dành cho bạn!\n" +
        "👑 Quà VIP Gold sẽ được phát hàng tuần vào thứ 2.\n" +
        "⏰ Vui lòng quay lại sau nhé!",
        threadID, messageID
      );
    }
    
    // Lấy quà mới nhất
    const latestGift = availableGifts[availableGifts.length - 1];
    
    // Đánh dấu đã gửi
    markVIPGiftSent(latestGift.code, senderID);
    
    // Gửi thông báo
    api.sendMessage(
      "👑 QUÀ TẶNG ĐẶC QUYỀN VIP GOLD 👑\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎁 Chúc mừng! Bạn đã nhận được quà VIP Gold.\n` +
      `📝 Gift code: ${latestGift.code}\n\n` +
      `💡 Hãy sử dụng lệnh sau đây để mở quà:\n` +
      `.rewards redeem ${latestGift.code}\n\n` +
      `✨ Đặc quyền này chỉ dành cho người dùng VIP Gold.\n` +
      `📆 Quà VIP Gold sẽ được phát hàng tuần!`,
      threadID, messageID
    );
  },
  
  handleCreateVIPGift: async function({ api, event }) {
    const { threadID, messageID } = event;
    
    try {
        const giftInfo = createVIPGiftcode('GOLD', 'Quà tặng VIP Gold đặc biệt');
        
        // Send an announcement if the sendVIPGiftAnnouncement function exists
        try {
            await sendVIPGiftAnnouncement(api, giftInfo.code, giftInfo.rewards, 'GOLD');
            
            api.sendMessage(
                "✅ Tạo quà VIP Gold thành công!\n\n" +
                `📝 Code: ${giftInfo.code}\n` +
                `💰 Xu: ${giftInfo.rewards.coins.toLocaleString('vi-VN')}\n` +
                `👑 Điểm VIP: ${giftInfo.rewards.vip_points}\n` +
                `⭐ EXP: ${giftInfo.rewards.exp}\n` +
                `⏰ Hiệu lực: 72 giờ\n\n` +
                `📢 Đã gửi thông báo tới người dùng VIP Gold\n` +
                `💡 Người dùng VIP Gold có thể nhận quà này bằng lệnh:\n` +
                `.rewards vip gift`,
                threadID, messageID
            );
        } catch (announceError) {
            console.error('Error sending VIP gift announcement:', announceError);
            
            api.sendMessage(
                "✅ Tạo quà VIP Gold thành công!\n\n" +
                `📝 Code: ${giftInfo.code}\n` +
                `💰 Xu: ${giftInfo.rewards.coins.toLocaleString('vi-VN')}\n` +
                `👑 Điểm VIP: ${giftInfo.rewards.vip_points}\n` +
                `⭐ EXP: ${giftInfo.rewards.exp}\n` +
                `⏰ Hiệu lực: 72 giờ\n\n` +
                `⚠️ Không thể gửi thông báo tự động\n` +
                `💡 Người dùng VIP Gold có thể nhận quà này bằng lệnh:\n` +
                `.rewards vip gift`,
                threadID, messageID
            );
        }
    } catch (error) {
        console.error('Error creating VIP gift:', error);
        api.sendMessage(
            "❌ Đã xảy ra lỗi khi tạo quà VIP Gold!\n" +
            "Vui lòng thử lại sau.",
            threadID, messageID
        );
    }
  }
};

// Hàm tạo thanh tiến trình
function createProgressBar(percentage, size = 10) {
  const filled = Math.floor((percentage / 100) * size);
  const empty = size - filled;
  
  return `[${'▰'.repeat(filled)}${'▱'.repeat(empty)}] ${percentage}%`;
}
