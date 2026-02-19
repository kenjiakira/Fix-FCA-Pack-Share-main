const { allBalances } = require('../utils/currencies');
const { getUserName } = require('../utils/userUtils');

function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return Math.floor(num).toLocaleString('vi-VN');
}

module.exports = {
  name: 'toppoor',
  dev: 'HNT',
  usedby: 0,
  category: 'Tài Chính',
  info: 'Xem top 10 người dùng nghèo nhất',
  onPrefix: true,
  usages: '.toppoor - Xem top 10 người nghèo nhất server',
  cooldowns: 10,

  onLaunch: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
      const balances = allBalances();
      const entries = Object.entries(balances)
        .filter(([uid]) => !uid.startsWith('npc_'))
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10);

      const rankEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      let msg = '🏚️ TOP 10 NGƯỜI NGHÈO NHẤT\n━━━━━━━━━━━━\n\n';

      let userPosition = null;
      entries.forEach(([userId, balance], index) => {
        const name = getUserName(userId);
        msg += `${rankEmoji[index]} ${index + 1}. ${name}\n`;
        msg += `   💸 ${formatNumber(balance)} $\n\n`;
        if (userId === senderID) userPosition = index + 1;
      });

      if (entries.length === 0) {
        msg = '❌ Chưa có dữ liệu người chơi.';
      } else {
        const myBalance = balances[senderID] ?? 0;
        if (userPosition !== null) {
          msg += `\n🎯 Bạn đang ở vị trí #${userPosition} trong top nghèo.`;
        } else {
          msg += `\n💫 Bạn không trong top 10 nghèo nhất.\n`;
          msg += `💰 Số dư của bạn: ${formatNumber(myBalance)} $`;
        }
      }

      return api.sendMessage(msg, threadID, messageID);
    } catch (error) {
      console.error('toppoor error:', error);
      return api.sendMessage('❌ Đã xảy ra lỗi khi lấy bảng xếp hạng.', threadID, messageID);
    }
  },
};
