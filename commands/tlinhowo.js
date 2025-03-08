module.exports = {
  name: "tlinhowo",
  dev: "HNT",
  category: "Fun",
  info: "THùy Linh Owo",
  onPrefix: false,
  dmUser: false,
  usedby: 0,
  usages: ".tlinhowo",
  cooldowns: 0,

  onLaunch: async ({ api, event }) => {
    try {
      const { threadID, messageID } = event;
      
      return api.sendMessage("Thùy Linh owo", threadID, messageID);
    } catch (error) {
      console.error('Error in tlinhowo command:', error);
      return api.sendMessage("❌ Có lỗi xảy ra!", event.threadID, event.messageID);
    }
  }
};
