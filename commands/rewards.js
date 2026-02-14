const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const {
  createGiftcode, loadGiftcodes, sendGiftcodeAnnouncement,
  checkDailyLimit, updateDailyLimit, GIFTCODE_TYPES, REWARD_TYPES,
  addVIPPoints, getVIPProgress, createVIPGiftcode,
  getAvailableVIPGifts, markVIPGiftSent, sendVIPGiftAnnouncement
} = require('../utils/autoGiftcode');
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
  info: "Hệ thống phần thưởng (Giftcode)",
  usages: "[redeem/create/list/stats/vip] [code/options]",
  cooldowns: 5,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const cmd = target[0]?.toLowerCase();
    const isAdmin = global.cc.adminBot.includes(senderID);
    
    if (!cmd || !['redeem', 'create', 'list', 'stats', 'vip'].includes(cmd)) {
      return api.sendMessage(
        "🎁 REWARDS\n━━━━━━━━━━━━━━━━━━\n\n" +
        "• .rewards redeem - Đổi tất cả giftcode chưa dùng\n" +
        "• .rewards stats - Thống kê của bạn\n" +
        "• .rewards vip - Tiến trình VIP Gold\n" +
        "• .rewards vip gift - Quà VIP Gold\n" +
        (isAdmin ? "\n👑 Admin: .rewards create/list/vip create\n" : ""),
        threadID, messageID
      );
    }

    switch(cmd) {
      case 'redeem':
        await this.handleRedeem({ api, event });
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

  handleRedeem: async function({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const giftcodeData = loadGiftcodes();
    const now = new Date();
    const typeOrder = ['LEGENDARY', 'SPECIAL', 'EPIC', 'EVENT', 'RARE', 'NORMAL', 'VIP_GOLD'];

    const available = Object.entries(giftcodeData.codes || {})
      .filter(([code, g]) => {
        if (!g || g.usedBy?.includes(senderID)) return false;
        if (g.maxUses && g.usedBy?.length >= g.maxUses) return false;
        if (new Date(g.expiry) < now) return false;
        return true;
      })
      .sort((a, b) => typeOrder.indexOf(b[1].type || 'NORMAL') - typeOrder.indexOf(a[1].type || 'NORMAL'));

    if (available.length === 0) {
      return api.sendMessage("❌ Không có giftcode nào để đổi!", threadID, messageID);
    }

    let totalCoins = 0, totalVip = 0, totalExp = 0;

    for (const [code, g] of available) {
      const type = GIFTCODE_TYPES[g.type] ? g.type : 'NORMAL';
      const limit = checkDailyLimit(senderID, type);
      if (!limit.canUse) continue;

      g.usedBy = g.usedBy || [];
      g.usedBy.push(senderID);
      updateDailyLimit(senderID, type);

      if (g.rewards) {
        if (g.rewards.coins) { totalCoins += g.rewards.coins; updateBalance(senderID, g.rewards.coins); }
        if (g.rewards.vip_points) totalVip += g.rewards.vip_points;
        if (g.rewards.exp) { totalExp += g.rewards.exp; try { require('../utils/userExperience').addExperience(senderID, g.rewards.exp); } catch (_) {} }
      } else if (typeof g.reward === 'number') {
        totalCoins += g.reward; totalVip += 1;
        updateBalance(senderID, g.reward);
      }
    }

    if (totalCoins === 0 && totalVip === 0 && totalExp === 0) {
      return api.sendMessage("❌ Đã đạt giới hạn đổi giftcode hôm nay. Quay lại ngày mai!", threadID, messageID);
    }

    fs.writeFileSync(path.join(__dirname, '../database/json/giftcodes.json'), JSON.stringify(giftcodeData, null, 2));

    if (totalVip > 0) {
      const vipResult = addVIPPoints(senderID, totalVip);
      if (vipResult.vipGoldAwarded) {
        try { require('../game/vip/vipSystem').addVIPGold(senderID); } catch (_) {}
        setTimeout(() => api.sendMessage("🌟 CHÚC MỪNG ĐẠT VIP GOLD! 🌟", threadID), 1500);
      }
    }

    let msg = "🎉 ĐÃ ĐỔI GIFTCODE\n\n";
    if (totalCoins) msg += `💰 +${formatNumber(totalCoins)} Xu\n`;
    if (totalVip) msg += `👑 +${totalVip} điểm VIP\n`;
    if (totalExp) msg += `⭐ +${totalExp} EXP\n`;
    msg += `\n💰 Số dư: ${formatNumber(getBalance(senderID))} Xu`;

    return api.sendMessage(msg, threadID, messageID);
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
      `💡 Gõ .rewards redeem để nhận quà\n\n` +
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
