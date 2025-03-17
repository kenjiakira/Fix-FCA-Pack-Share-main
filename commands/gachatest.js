const { createPullResultImage, createPvPBattleImage } = require("../canvas/gachaCanvas");
const fs = require("fs");

module.exports = {
  name: "gachatest",
  Dev: "HNT",
  onPrefix: true,
  hide: true,
  usedby: 2,
  usages: ".gachatest [rarity: 3-5] [premium/normal] [stars] | .gachatest pvp [mode] [mix]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    
    // Kiểm tra nếu người dùng muốn test ảnh PVP
    if (target[0]?.toLowerCase() === "pvp") {
      return await testPvPBattleImage(api, event, target.slice(1));
    }
    
    const rarity = target[0] || "5";
    
    // Xử lý các tham số đơn giản hơn
    let isPremium = target.includes("premium") || target.includes("prem") || target.includes("p");
    
    // Tìm số sao trong các tham số - tìm tham số là số hoặc có dạng "e7", "s8", v.v.
    let starLevel = null;
    for (const param of target) {
      // Nếu tham số là số thuần túy
      if (!isNaN(parseInt(param))) {
        const num = parseInt(param);
        if (num > parseInt(rarity)) {
          starLevel = num;
          break;
        }
      }
      // Nếu tham số có dạng "e7", "s8", "lvl9", v.v.
      else if (/^[esl]\d+$/i.test(param)) {
        const num = parseInt(param.slice(1));
        if (num > parseInt(rarity)) {
          starLevel = num;
          break;
        }
      }
    }
    
    // Giới hạn tối đa 10 sao
    if (starLevel && starLevel > 10) {
      starLevel = 10;
    }

    if (!["3", "4", "5"].includes(rarity)) {
      return api.sendMessage("⚠️ Rarity phải là 3, 4 hoặc 5!", threadID, messageID);
    }

    try {
      // Tạo thẻ nhân vật test
      const testChar = createTestCharacter(rarity, isPremium, starLevel);
      
      // Tạo ảnh pull
      const imagePath = await createPullResultImage(testChar);
      
      // Tạo thông báo mô tả
      let message = buildCharacterMessage(testChar);

      // Thêm hướng dẫn sử dụng tối giản
      const helpText = "\n\n📌 Cú pháp đơn giản:\n" +
                       ".gachatest 5 p e7 → 5★ Premium tiến hóa 7★\n" +
                       ".gachatest 4 e8 → 4★ Normal tiến hóa 8★\n" +
                       ".gachatest pvp evol → Test PVP với nhân vật tiến hóa\n" +
                       ".gachatest pvp mix → Test PVP với nhiều loại khác nhau";

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

// Tạo thẻ nhân vật test
function createTestCharacter(rarity, isPremium, starLevel) {
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
  
  // Các ảnh để test
  const charImages = {
    "5": {
      normal: "https://imgur.com/uvEyzJy.png", // Nahida
      premium: "https://imgur.com/2l5q6Ib.png"  // Raiden
    },
    "4": {
      normal: "https://imgur.com/D8uVCcI.png",  // Bennett
      premium: "https://imgur.com/3UE1s1o.png"  // Yanfei
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
      premium: "Pyro"
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
      premium: "Catalyst"
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
  const baseRarity = parseInt(rarity);
  if (starLevel) {
    const extraStars = starLevel - baseRarity;
    const multiplier = Math.pow(2, extraStars); // x2 cho mỗi sao tiến hóa
    cardValue *= multiplier;
  }

  const testChar = {
    userId: "TEST_USER",
    userName: "Tester",
    character: {
      name: charName,
      image: charImage,
      id: "TEST_001",
      isPremium: isPremium,
      starLevel: starLevel
    },
    rarity: rarity,
    stats: {
      element: charElement,
      weapon: charWeapon,
      quote: isPremium ? "Inazuma Shines Eternal" : "This is a test character",
      skills: ["Test Skill 1", "Test Skill 2"]
    },
    currentRates: {
      FIVE_STAR: 0.6,
      FOUR_STAR: 5.1,
      THREE_STAR: 94.3
    },
    cardValue: cardValue,
    starLevel: starLevel,
    level: starLevel ? Math.min(90, baseRarity * 20) : 1
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
  testChar.stats.hp = Math.floor(baseHp * statMultiplier);
  testChar.stats.attack = Math.floor(baseAtk * statMultiplier);
  testChar.stats.defense = Math.floor(baseDef * statMultiplier);
  
  return testChar;
}

function buildCharacterMessage(testChar) {
  let message = `🎨 Test Canvas Gacha\n📊 Rarity: ${testChar.rarity}⭐`;
  
  if (testChar.character.isPremium) {
    message += "\n👑 Premium Card";
  }
  
  if (testChar.starLevel) {
    message += `\n🌟 Tiến hóa: ${testChar.starLevel}⭐`;
    message += `\n💰 Giá trị: $${testChar.cardValue.toLocaleString()}`;
    message += `\n📊 Stats: HP ${testChar.stats.hp.toLocaleString()} | ATK ${testChar.stats.attack.toLocaleString()} | DEF ${testChar.stats.defense.toLocaleString()}`;
    message += `\n📈 Level: ${testChar.level}`;
  }
  
  return message;
}

// Hàm test ảnh PVP Battle với nhiều tùy chọn
async function testPvPBattleImage(api, event, options = []) {
  const { threadID, messageID, senderID } = event;
  
  try {
    // Xử lý các tùy chọn
    const hasEvolved = options.includes("evol") || options.includes("e");
    const hasPremium = options.includes("premium") || options.includes("prem") || options.includes("p");
    const has4Star = options.includes("4s") || options.includes("4star");
    const hasMix = options.includes("mix") || options.includes("m");
    
    // Tạo dữ liệu đội hình dựa trên tùy chọn
    let challengerTeam, targetTeam;
    
    if (hasMix) {
      challengerTeam = [
        {
          name: "Nahida", 
          element: "Dendro", 
          level: 90, 
          rarity: 5,
          starLevel: 7, // Tiến hóa
          image: "https://imgur.com/uvEyzJy.png"
        },
        {
          name: "Bennett", 
          element: "Pyro", 
          level: 80, 
          rarity: 4,
          starLevel: 6, // Tiến hóa
          image: "https://imgur.com/D8uVCcI.png"
        },
        {
          name: "Yanfei", 
          element: "Pyro", 
          level: 70, 
          rarity: 4,
          image: "https://imgur.com/3UE1s1o.png"
        }
      ];
      
      targetTeam = [
        {
          name: "Raiden Shogun", 
          element: "Electro", 
          level: 90, 
          rarity: 5,
          isPremium: true,
          starLevel: 8, // Premium tiến hóa
          image: "https://imgur.com/2l5q6Ib.png"
        },
        {
          name: "Hutao", 
          element: "Pyro", 
          level: 85, 
          rarity: 5,
          image: "https://imgur.com/9tuCA1v.png"
        },
        {
          name: "Yelan", 
          element: "Hydro", 
          level: 75, 
          rarity: 5, 
          image: "https://imgur.com/oiNOdqD.png"
        }
      ];
    } 
    else if (has4Star) {
      // Tạo đội hình 4 sao
      challengerTeam = [
        {
          name: "Bennett", 
          element: "Pyro", 
          level: 80, 
          rarity: 4,
          starLevel: hasEvolved ? 6 : undefined,
          image: "https://imgur.com/D8uVCcI.png"
        },
        {
          name: "Yanfei", 
          element: "Pyro", 
          level: 70, 
          rarity: 4,
          starLevel: hasEvolved ? 7 : undefined,
          image: "https://imgur.com/3UE1s1o.png"
        },
        {
          name: "Barbara", 
          element: "Hydro", 
          level: 70, 
          rarity: 4,
          starLevel: hasEvolved ? 6 : undefined,
          image: "https://imgur.com/4C9Dsl0.png"
        }
      ];
      
      targetTeam = [
        {
          name: "Fischl", 
          element: "Electro", 
          level: 80, 
          rarity: 4,
          isPremium: hasPremium,
          starLevel: hasEvolved ? 8 : undefined,
          image: "https://imgur.com/3UE1s1o.png" // Placeholder
        },
        {
          name: "Thoma", 
          element: "Pyro", 
          level: 75, 
          rarity: 4,
          starLevel: hasEvolved ? 7 : undefined,
          image: "https://imgur.com/wGUtE3a.png"
        },
        {
          name: "Xingqiu", 
          element: "Hydro", 
          level: 80, 
          rarity: 4,
          starLevel: hasEvolved ? 6 : undefined, 
          image: "https://imgur.com/KBX3syb.png" // Placeholder
        }
      ];
    }
    else {
      // Đội hình tiêu chuẩn 5 sao
      challengerTeam = [
        {
          name: "Nahida", 
          element: "Dendro", 
          level: 90, 
          rarity: 5,
          starLevel: hasEvolved ? 7 : undefined,
          image: "https://imgur.com/uvEyzJy.png"
        },
        {
          name: "Raiden Shogun", 
          element: "Electro", 
          level: 80, 
          rarity: 5,
          isPremium: hasPremium,
          starLevel: hasEvolved ? 7 : undefined,
          image: "https://imgur.com/2l5q6Ib.png"
        },
        {
          name: "Bennett", 
          element: "Pyro", 
          level: 70, 
          rarity: 4,
          starLevel: hasEvolved ? 6 : undefined,
          image: "https://imgur.com/D8uVCcI.png"
        }
      ];
      
      targetTeam = [
        {
          name: "Hutao", 
          element: "Pyro", 
          level: 85, 
          rarity: 5,
          starLevel: hasEvolved ? 6 : undefined,
          image: "https://imgur.com/9tuCA1v.png"
        },
        {
          name: "Yelan", 
          element: "Hydro", 
          level: 75, 
          rarity: 5,
          starLevel: hasEvolved ? 6 : undefined,
          image: "https://imgur.com/oiNOdqD.png"
        },
        {
          name: "Furina", 
          element: "Hydro", 
          level: 60, 
          rarity: 5,
          isPremium: hasPremium,
          starLevel: hasEvolved ? 7 : undefined,
          image: "https://imgur.com/Ovo2GXz.png"
        }
      ];
    }
    
    // Tính sức mạnh đội hình (mô phỏng)
    const challengerPower = 15000 + (hasEvolved ? 5000 : 0) + (hasPremium ? 3000 : 0);
    const targetPower = 16200 + (hasEvolved ? 4500 : 0) + (hasPremium ? 2800 : 0);
    
    // Tính lợi thế nguyên tố (mô phỏng)
    const challengerAdvantage = 1.2;
    const targetAdvantage = 1.3;
    
    // Thiết lập tỷ lệ thắng và kết quả
    const winChance = 45.5;
    const roll = Math.random() * 100;
    const challengerWins = roll < winChance;
    
    // Tạo ảnh PVP Battle
    const imagePath = await createPvPBattleImage({
      challenger: senderID,  // Sửa từ challenger thành senderID
      target: "100000000000000",
      challengerName: "Người chơi 1",
      targetName: "Người chơi 2",
      challengerTeam,
      targetTeam,
      challengerPower,
      targetPower,
      challengerAdvantage,
      targetAdvantage,
      winChance,
      winner: challengerWins ? senderID : "100000000000000",  // Sửa từ challenger thành senderID
      result: {
        roll: roll,
        winChance: winChance,
        winnerReward: 2000
      }
    }); 
    // Tạo thông báo
    let message = "⚔️ TEST PVP BATTLE ⚔️\n\n";
    
    // Thêm chú thích về các tùy chọn đã bật
    if (hasEvolved) message += "✅ Tiến hóa: Bật\n";
    if (hasPremium) message += "✅ Premium: Bật\n";
    if (has4Star) message += "✅ Nhân vật 4 sao: Bật\n";
    if (hasMix) message += "✅ Hỗn hợp: Bật\n";
    
    message += `\n🔵 Đội 1: ${challengerPower.toLocaleString()} sức mạnh (x${challengerAdvantage.toFixed(1)} lợi thế)\n`;
    message += `🔴 Đội 2: ${targetPower.toLocaleString()} sức mạnh (x${targetAdvantage.toFixed(1)} lợi thế)\n\n`;
    message += `🎲 Tỷ lệ thắng: ${winChance.toFixed(1)}%\n`;
    message += `🎯 Roll: ${roll.toFixed(1)}\n`;
    message += `🏆 NGƯỜI THẮNG: ${challengerWins ? "Người chơi 1" : "Người chơi 2"}\n`;
    message += `💰 Phần thưởng: $2,000\n\n`;
    message += "📝 Cú pháp test:\n";
    message += ".gachatest pvp - Test mặc định\n";
    message += ".gachatest pvp e - Thêm tiến hóa\n";
    message += ".gachatest pvp p - Thêm premium\n";
    message += ".gachatest pvp 4s - Test nhân vật 4 sao\n";
    message += ".gachatest pvp mix - Test nhiều loại hỗn hợp";
    
    return api.sendMessage(
      {
        attachment: fs.createReadStream(imagePath),
        body: message
      },
      threadID,
      () => fs.unlinkSync(imagePath),
      messageID
    );
    
  } catch (error) {
    console.error("PVP test error:", error);
    return api.sendMessage("❌ Đã xảy ra lỗi khi tạo ảnh PVP test: " + error.message, threadID, messageID);
  }
}