const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance, loadQuests, getUserQuests, canClaimRewards, setRewardClaimed } = require('../utils/currencies');
const { createGiftcode, loadGiftcodes, sendGiftcodeAnnouncement } = require('../utils/autoGiftcode');
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
  usages: "[quest/redeem/create/list] [code/options]",
  cooldowns: 5,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const cmd = target[0]?.toLowerCase();
    const isAdmin = global.cc.adminBot.includes(senderID);
    
    if (!cmd || !['quest', 'redeem', 'create', 'list'].includes(cmd)) {
      return api.sendMessage(
        "🎁 HƯỚNG DẪN SỬ DỤNG REWARDS\n━━━━━━━━━━━━━━━━━━\n\n" +
        "1️⃣ Nhiệm vụ hằng ngày:\n→ .rewards quest\n" +
        "💡 Hoàn thành để nhận xu và phần thưởng\n\n" +
        "2️⃣ Đổi giftcode:\n→ .rewards redeem <code>\n" +
        "💡 Nhập mã code để nhận quà\n" +
        (isAdmin ? 
        "\n👑 Lệnh Admin:\n→ .rewards create <số xu> <mô tả>\n→ .rewards list\n" : "") +
        "\n📌 Thông tin quan trọng:\n" +
        "• ⏰ Nhiệm vụ reset lúc 0h\n" +
        "• 🎁 Giftcode tự động phát 12h & 20h\n" +
        "• 🔥 Duy trì chuỗi để nhận thêm thưởng",
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
        `${bonusAmount > 0 ? `👑 Thưởng VIP +${(bonusAmount/totalReward*100).toFixed(0)}%: ${formatNumber(bonusAmount)} $\n` : ''}` +
        `📝 Đã hoàn thành ${completedQuests.length} nhiệm vụ.\n` +
        `⭐ Tiếp tục cố gắng nhé!`,
        threadID, messageID
      );
    }

    let message = "📋 NHIỆM VỤ HÀNG NGÀY\n━━━━━━━━━━━━━━━━━━\n\n";
    
    if (vipBenefits) {
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
      const vipProgress = vipBenefits ? Math.floor(progress * (1 + vipBenefits.packageId * 0.2)) : progress;
      
      if (userQuests.completed[questId]) totalCompleted++;
      
      const status = userQuests.completed[questId] ? "✅" : vipProgress >= quest.target ? "⭐" : "▪️";
      message += `${status} ${quest.name}\n`;
      message += `👉 ${quest.description}\n`;
      message += `🎯 Tiến độ: ${vipProgress}/${quest.target}\n`;
      message += `💰 Phần thưởng: ${formatNumber(quest.reward)} $ ${vipBenefits ? 
          `(+${formatNumber(Math.floor(quest.reward * (vipBenefits.packageId === 3 ? 1 : 
                                                      vipBenefits.packageId === 2 ? 0.5 : 0.2)))} $ VIP)` : ''}\n\n`;
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

    giftcode.usedBy.push(senderID);
    const giftcodesPath = path.join(__dirname, '../database/json/giftcodes.json');
    fs.writeFileSync(giftcodesPath, JSON.stringify(giftcodeData, null, 2));

    updateBalance(senderID, giftcode.reward);

    return api.sendMessage(
      "🎉 ĐỔI CODE THÀNH CÔNG!\n\n" +
      `📝 Mã code: ${code.toUpperCase()}\n` +
      `💝 Quà tặng: ${formatNumber(giftcode.reward)} Xu\n` +
      `🏆 Độ hiếm: ${giftcode.rarity}\n` +
      `📜 Mô tả: ${giftcode.description}\n` +
      `👥 Số người đã dùng: ${giftcode.usedBy.length}${giftcode.maxUses ? `/${giftcode.maxUses}` : ''}\n\n` +
      `💰 Số dư hiện tại: ${formatNumber(getBalance(senderID))} Xu`,
      threadID, messageID
    );
  },

  handleCreate: async function({ api, event, target }) {
    const { threadID, messageID } = event;
    const reward = parseInt(target[1]);
    const description = target.slice(2).join(" ");

    if (!reward || !description) {
      return api.sendMessage("❌ Vui lòng nhập đúng cú pháp:\n.rewards create <số xu> <mô tả>", threadID, messageID);
    }

    const code = createGiftcode(reward, description);
    await sendGiftcodeAnnouncement(api, code, reward);
    
    return api.sendMessage(
      "✅ Tạo giftcode thành công!\n\n" +
      `📝 Code: ${code}\n` +
      `💝 Xu: ${formatNumber(reward)}\n` +
      `📜 Mô tả: ${description}\n` +
      "⏰ Thời hạn: 24 giờ\n" +
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
    codes.forEach(([code, data]) => {
      message += `📝 Code: ${code}\n`;
      message += `💝 Xu: ${formatNumber(data.reward)}\n`;
      message += `📜 Mô tả: ${data.description}\n`;
      message += `⏰ Hết hạn: ${new Date(data.expiry).toLocaleString('vi-VN')}\n`;
      message += `👥 Đã dùng: ${data.usedBy.length}${data.maxUses ? `/${data.maxUses}` : ''}\n\n`;
    });

    return api.sendMessage(message, threadID, messageID);
  }
};
