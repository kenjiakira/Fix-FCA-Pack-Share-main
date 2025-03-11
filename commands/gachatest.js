const { createPullResultImage } = require("../canvas/gachaCanvas");
const fs = require("fs");

module.exports = {
  name: "gachatest",
  Dev: "HNT",
  onPrefix: true,
  usedby: 2,
  usages: ".gachatest [rarity: 3-5] [premium]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const rarity = target[0] || "5";
    const isPremium = target[1]?.toLowerCase() === "premium";

    if (!["3", "4", "5"].includes(rarity)) {
      return api.sendMessage("⚠️ Rarity phải là 3, 4 hoặc 5!", threadID, messageID);
    }

    try {
      const testChar = {
        name: isPremium ? "Raiden Shogun" : "Test Character",
        image: "https://imgur.com/2l5q6Ib.jpg",
        id: "TEST_001",
        isPremium: isPremium
      };

      const testStats = {
        element: "Electro",
        weapon: "Polearm", 
        quote: isPremium ? "Inazuma Shines Eternal" : "This is a test character",
        skills: ["Test Skill 1", "Test Skill 2"]
      };

      const imagePath = await createPullResultImage({
        userId: senderID,
        userName: "Tester",
        character: testChar,
        rarity: rarity,
        stats: testStats,
        currentRates: {
          FIVE_STAR: 0.6,
          FOUR_STAR: 5.1,
          THREE_STAR: 94.3
        },
        cardValue: isPremium ? 653894953 : rarity === "5" ? 5000000 : rarity === "4" ? 50000 : 500,
      });

      return api.sendMessage(
        {
          attachment: fs.createReadStream(imagePath),
          body: `🎨 Test Canvas Gacha\n📊 Rarity: ${rarity}⭐${isPremium ? "\n👑 Premium Card" : ""}`,
        },
        threadID,
        () => fs.unlinkSync(imagePath),
        messageID
      );

    } catch (error) {
      console.error("Gacha test error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi tạo ảnh test!", threadID, messageID);
    }
  }
};
