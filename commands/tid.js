module.exports = {
  name: "tid",
  usedby: 0,
  category: "Khác",
  info: "Lấy ID nhóm chat hiện tại",
  dev: "HNT",
  onPrefix: false,
  cooldowns: 2,

  onLaunch: async function ({ api, event, actions }) {
    try {
      const tid = event.threadID;
      let msg = `📋 Thông tin nhóm\n`;
      msg += `━━━━━━━━━━━━━━━\n`;
      msg += `🆔 ThreadID: ${tid}\n`;

      try {
        const threadInfo = await api.getThreadInfo(tid);
        if (threadInfo) {
          msg += `📝 Tên nhóm: ${threadInfo.threadName || "Không có tên"}\n`;
          msg += `👥 Thành viên: ${threadInfo.participantIDs?.length || 0}\n`;
          msg += `👑 Admin: ${threadInfo.adminIDs?.length || 0} người`;
        }
      } catch (err) {
        msg += `📝 Tên nhóm: [Không thể lấy thông tin]\n`;
        msg += `💡 Lưu ý: Bot có thể bị FB giới hạn tạm thời`;
      }

      return actions.reply(msg);
    } catch (error) {
      return actions.reply(
        "📋 ThreadID của nhóm là: " + event.threadID +
        "\n💡 Bot không thể lấy thêm thông tin chi tiết"
      );
    }
  }
};