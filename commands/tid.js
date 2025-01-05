module.exports = {
  name: "tid",
  usedby: 0,
  info: "lấy ID Nhóm",
  dev: "HNT",
  onPrefix: false,
  cooldowns: 2,

  onLaunch: async function ({ api, event, actions }) {
    try {
      const tid = event.threadID;
      const threadInfo = await api.getThreadInfo(tid);
      const message = `📋 Thread Information\n` +
                     `━━━━━━━━━━━━━━━\n` +
                     `🆔 ThreadID: ${tid}\n` +
                     `📝 Name: ${threadInfo.threadName}\n` +
                     `👥 Members: ${threadInfo.participantIDs.length}`;
      
      actions.reply(message);a
    } catch (error) {
      actions.reply("❌ Could not fetch thread information.");
    }
  }
}