const { createPullResultImage } = require("../canvas/gachaCanvas");
const fs = require("fs");

module.exports = {
  name: "gachatest",
  Dev: "HNT",
  onPrefix: true,
  usedby: 2,
  usages: ".gachatest [rarity: 3-5] [premium/normal] [stars/evolved-stars]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const rarity = target[0] || "5";
    
    // Xử lý các tham số
    let isPremium = false;
    let starLevel = null;
    
    // Kiểm tra các tham số
    if (target.length > 1) {
      // Kiểm tra premium hay normal
      if (target[1]?.toLowerCase() === "premium") {
        isPremium = true;
      }
      
      // Kiểm tra xem có tiến hóa không
      if (target.length > 2) {
        if (target[2]?.toLowerCase().startsWith("evolved-")) {
          // Format mới: evolved-X với X là số sao
          const evolvedParts = target[2].split("-");
          if (evolvedParts.length > 1 && !isNaN(parseInt(evolvedParts[1]))) {
            starLevel = parseInt(evolvedParts[1]);
          }
        } else if (!isNaN(parseInt(target[2]))) {
          // Format cũ: chỉ số sao
          starLevel = parseInt(target[2]);
        }
      }
    }
    
    // Kiểm tra giới hạn sao
    const baseRarity = parseInt(rarity);
    if (starLevel && starLevel <= baseRarity) {
      starLevel = null;
    }
    
    // Giới hạn tối đa 10 sao
    if (starLevel && starLevel > 10) {
      starLevel = 10;
    }

    if (!["3", "4", "5"].includes(rarity)) {
      return api.sendMessage("⚠️ Rarity phải là 3, 4 hoặc 5!", threadID, messageID);
    }

    try {
      // Nhiều nhân vật để test cho nhiều trường hợp
      const charNames = {
        "5": {
          normal: "Nahida",
          premium: "Raiden Shogun"
        },
        "4": {
          normal: "Bennett",
          premium: "Fischl"
        },
        "3": {
          normal: "NPC",
          premium: "Hilichurl"
        }
      };
      
      // Thêm nhiều ảnh để test
      const charImages = {
        "5": {
          normal: "https://imgur.com/2l5q6Ib.png",
          premium: "https://imgur.com/2l5q6Ib.png"
        },
        "4": {
          normal: "https://imgur.com/2l5q6Ib.png",
          premium: "https://imgur.com/2l5q6Ib.png"
        },
        "3": {
          normal: "https://imgur.com/2l5q6Ib.png",
          premium: "https://imgur.com/2l5q6Ib.png"
        }
      };
      
      const charElements = {
        "5": {
          normal: "Dendro",
          premium: "Electro"
        },
        "4": {
          normal: "Pyro",
          premium: "Electro"
        },
        "3": {
          normal: "Anemo",
          premium: "Geo"
        }
      };
      
      const charWeapons = {
        "5": {
          normal: "Catalyst",
          premium: "Polearm"
        },
        "4": {
          normal: "Sword",
          premium: "Bow"
        },
        "3": {
          normal: "Bow",
          premium: "Claymore"
        }
      };
      
      // Chọn nhân vật dựa vào rarity và premium
      const charKey = isPremium ? "premium" : "normal";
      const charName = charNames[rarity][charKey];
      const charImage = charImages[rarity][charKey];
      const charElement = charElements[rarity][charKey];
      const charWeapon = charWeapons[rarity][charKey];
      
      // Tính toán giá trị dựa trên độ hiếm và tiến hóa
      let cardValue = rarity === "5" ? 5000000 : rarity === "4" ? 50000 : 5000;
      if (isPremium) {
        cardValue *= 100;
      }
      
      // Tăng giá trị theo số sao tiến hóa
      if (starLevel) {
        const extraStars = starLevel - baseRarity;
        const multiplier = Math.pow(2, extraStars); // x2 cho mỗi sao tiến hóa
        cardValue *= multiplier;
      }

      const testChar = {
        name: charName,
        image: charImage,
        id: "TEST_001",
        isPremium: isPremium,
        starLevel: starLevel
      };

      const testStats = {
        element: charElement,
        weapon: charWeapon, 
        quote: isPremium ? "Inazuma Shines Eternal" : "This is a test character",
        skills: ["Test Skill 1", "Test Skill 2"]
      };
      
      // Tăng stat dựa vào số sao nếu có tiến hóa
      let statMultiplier = 1;
      if (starLevel) {
        statMultiplier = 1 + ((starLevel - baseRarity) * 0.5); // +50% mỗi sao
      }
      
      const baseHp = rarity === "5" ? 4000 : rarity === "4" ? 3000 : 2000;
      const baseAtk = rarity === "5" ? 300 : rarity === "4" ? 200 : 150;
      const baseDef = rarity === "5" ? 200 : rarity === "4" ? 150 : 100;

      // Tính toán stats dựa vào tiến hóa
      const hp = Math.floor(baseHp * statMultiplier);
      const atk = Math.floor(baseAtk * statMultiplier);
      const def = Math.floor(baseDef * statMultiplier);
      
      // Thêm stats vào testStats
      testStats.hp = hp;
      testStats.attack = atk;
      testStats.defense = def;

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
        cardValue: cardValue,
        starLevel: starLevel,
        level: starLevel ? Math.min(90, baseRarity * 20) : 1
      });
      
      // Tạo thông báo
      let message = `🎨 Test Canvas Gacha\n📊 Rarity: ${rarity}⭐`;
      
      if (isPremium) {
        message += "\n👑 Premium Card";
      }
      
      if (starLevel) {
        message += `\n🌟 Tiến hóa: ${starLevel}⭐`;
        message += `\n💰 Giá trị: $${cardValue.toLocaleString()}`;
        message += `\n📊 Stats: HP ${hp.toLocaleString()} | ATK ${atk.toLocaleString()} | DEF ${def.toLocaleString()}`;
        message += `\n📈 Level: ${starLevel ? Math.min(90, baseRarity * 20) : 1}`;
      }

      // Thêm hướng dẫn sử dụng
      const helpText = "\n\n📌 Hướng dẫn:\n" +
                       ".gachatest 5 premium 7 → 5★ Premium tiến hóa lên 7★\n" +
                       ".gachatest 4 normal 8 → 4★ Normal tiến hóa lên 8★";

      return api.sendMessage(
        {
          attachment: fs.createReadStream(imagePath),
          body: message + helpText
        },
        threadID,
        () => fs.unlinkSync(imagePath),
        messageID
      );

    } catch (error) {
      console.error("Gacha test error:", error);
      return api.sendMessage("❌ Đã xảy ra lỗi khi tạo ảnh test: " + error.message, threadID, messageID);
    }
  }
};