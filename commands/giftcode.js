const {
  createGiftcode, loadGiftcodes, sendGiftcodeAnnouncement,
  GIFTCODE_TYPES, REWARD_TYPES
} = require('../utils/autoGiftcode');

function formatNumber(number) {
  return number.toLocaleString('vi-VN');
}

module.exports = {
  name: "giftcode",
  dev: "HNT",
  onPrefix: true,
  hide: false,
  usedby: 0,
  category: "Tài Chính",
  info: "Tạo và quản lý giftcode (Admin)",
  usages: "[create] [loại] [số xu] [mô tả]",
  cooldowns: 5,
  isAdmin: true,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const cmd = target[0]?.toLowerCase();
    const isAdmin = global.cc?.adminBot?.includes(senderID);

    if (!isAdmin) {
      return api.sendMessage(
        "❌ Chỉ admin mới có thể sử dụng lệnh này!\n" +
        "💡 Người dùng thường: gõ .rewards redeem để đổi giftcode",
        threadID, messageID
      );
    }

    if (!cmd || cmd !== 'create') {
      return api.sendMessage(
        "🎁 GIFTCODE (Admin)\n━━━━━━━━━━━━━━━━━━\n\n" +
        "• .giftcode create <loại> <số xu> <mô tả>\n\n" +
        "Loại giftcode:\n" +
        "- normal: Giftcode thường\n" +
        "- rare: Giftcode hiếm\n" +
        "- epic: Giftcode epic\n" +
        "- legendary: Giftcode huyền thoại\n" +
        "- event: Giftcode sự kiện\n" +
        "- special: Giftcode đặc biệt\n\n" +
        "Ví dụ: .giftcode create epic 5000000 Quà tặng đặc biệt",
        threadID, messageID
      );
    }

    if (cmd === 'create') {
      await this.handleCreate({ api, event, target });
    }
  },

  handleCreate: async function({ api, event, target }) {
    const { threadID, messageID } = event;

    if (target.length < 3) {
      return api.sendMessage(
        "❌ Vui lòng nhập đúng cú pháp:\n" +
        ".giftcode create <loại> <số xu> <mô tả>\n\n" +
        "Loại giftcode:\n" +
        "- normal: Giftcode thường\n" +
        "- rare: Giftcode hiếm\n" +
        "- epic: Giftcode epic\n" +
        "- legendary: Giftcode huyền thoại\n" +
        "- event: Giftcode sự kiện\n" +
        "- special: Giftcode đặc biệt\n\n" +
        "Ví dụ: .giftcode create epic 5000000 Quà tặng đặc biệt",
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

    const typeConfig = GIFTCODE_TYPES[type];
    let rewards = {
      coins: rewardInput,
      vip_points: typeConfig.vipPoints || 1
    };

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
  }
};
