const genshin = require("genshin");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getBalance, updateBalance } = require("../utils/currencies");
const {
  createPullResultImage,
} = require("../canvas/gachaCanvas");

const GACHA_DATA_FILE = path.join(__dirname, "./json/gacha.json");
const PULL_COST = 1000;
const TRADE_COOLDOWN = 300000;
const AUCTION_DURATION = 3600000;

const CUSTOM_CHARACTER_IMAGES = {
  "Raiden Shogun": "https://imgur.com/2l5q6Ib.png", 
  "Noelle": "https://imgur.com/cDSdrap.png",
  "Xinyan": "https://imgur.com/KBX3syb.png",
  "Barbara": "https://imgur.com/4C9Dsl0.png",
  "Rosaria": "https://imgur.com/OEt1mvT.png",
  "Thoma": "https://imgur.com/wGUtE3a.png",
  "Faruzan": "https://imgur.com/5rbs7lf.png",
  "Gorou": "https://imgur.com/8WFB75F.png",
  "Mika": "https://imgur.com/rkihX4u.png",
  "Lisa": "https://imgur.com/WyX41nu.png",
  "Kuki Shinobu": "https://imgur.com/QB2OkkW.png",
  "Freminet": "https://imgur.com/fh2TcW7.png",
  "Tighnari": "https://imgur.com/xVR5BRG.png",
  "Hutao": "https://imgur.com/9tuCA1v.png",
  "Yelan": "https://imgur.com/oiNOdqD.png",
  "Furina": "https://imgur.com/Ovo2GXz.png",
  "Yae Miko": "https://imgur.com/b9BebtU.png",
  "Nahida": "https://imgur.com/HhLqCNQ.png",
};

const CUSTOM_CHARACTER_DATA = {
  "Raiden Shogun": {
    weapon: "Polearm",
    element: "Electro",
    skills: [
      "Transcendence: Baleful Omen",
      "Secret Art: Musou Shinsetsu"
    ],
    quote: "Inazuma Shines Eternal"
  },
  "Freminet": {
    weapon: "Claymore", // ❌ Sai (Đã sửa từ Bow -> Claymore)
    element: "Cryo",
    skills: [
      "Pressurized Floe", // ❌ Sai (Đã sửa từ Frostbite)
      "Shadowhunter’s Ambush" // ❌ Sai (Đã sửa từ Snowstorm)
    ],
    quote: "I will protect you."
  },
  "Noelle": {
    weapon: "Claymore",
    element: "Geo",
    skills: [
      "Breastplate",
      "Sweeping Time"
    ],
    quote: "Leave it to me!"
  },
  "Xinyan": {
    weapon: "Claymore", 
    element: "Pyro",
    skills: [
      "Sweeping Fervor",
      "Riff Revolution"  
    ],
    quote: "Rock and roll!"
  },
  "Barbara": {
    weapon: "Catalyst",
    element: "Hydro", 
    skills: [
      "Let the Show Begin",
      "Shining Miracle"
    ],
    quote: "Ready for your big entrance!"
  },
  "Rosaria": {
    weapon: "Polearm",
    element: "Cryo",
    skills: [
      "Ravaging Confession",
      "Rites of Termination"
    ],
    quote: "Judgment has come."
  },
  "Thoma": {
    weapon: "Polearm",
    element: "Pyro",
    skills: [
      "Blazing Blessing", // ❌ Sai (Đã sửa từ Crimson Ooyoroi)
      "Crimson Ooyoroi" // ❌ Sai (Đã sửa từ Flaming Assault)
    ],
    quote: "I'll do my best."
  },
  "Faruzan": {
    weapon: "Bow", // ❌ Sai (Đã sửa từ Claymore -> Bow)
    element: "Anemo", // ❌ Sai (Đã sửa từ Geo -> Anemo)
    skills: [
      "Wind Realm of Nasamjnin", // ❌ Sai (Đã sửa từ Rockfall)
      "The Wind’s Secret Ways" // ❌ Sai (Đã sửa từ Stonebreaker)
    ],
    quote: "I will protect you."
  },
  "Gorou": {
    weapon: "Bow",
    element: "Geo",
    skills: [
      "Inuzaka All-Round Defense", // ❌ Sai (Đã sửa từ Undying Affection)
      "Juuga: Forward Unto Victory" // ❌ Sai (Đã sửa từ Lunar Hues)
    ],
    quote: "I am here to serve."
  },
  "Mika": {
    weapon: "Polearm", // ❌ Sai (Đã sửa từ Sword -> Polearm)
    element: "Cryo", // ❌ Sai (Đã sửa từ Electro -> Cryo)
    skills: [
      "Starfrost Swirl", // ❌ Sai (Đã sửa từ Thunderous Blade)
      "Skyfeather Song" // ❌ Sai (Đã sửa từ Lightning Flash)
    ],
    quote: "I will fight for you."
  },
  "Kuki Shinobu": {
    weapon: "Sword", // ❌ Sai (Đã sửa từ Claymore -> Sword)
    element: "Electro", // ❌ Sai (Đã sửa từ Cryo -> Electro)
    skills: [
      "Sanctifying Ring", // ❌ Sai (Đã sửa từ Frostwhirl)
      "Goei Narukami Kariyama Rite" // ❌ Sai (Đã sửa từ Snowstorm)
    ],
    quote: "I will protect my friends."
  },
  "Tighnari": {
    weapon: "Bow",
    element: "Dendro", // ❌ Sai (Đã sửa từ Hydro -> Dendro)
    skills: [
      "Vijnana-Phala Mine", // ❌ Sai (Đã sửa từ Tidal Wave)
      "Fashioner’s Tanglevine Shaft" // ❌ Sai (Đã sửa từ Ocean's Fury)
    ],
    quote: "I will protect you."
  },
  "Hutao": {
    weapon: "Polearm",
    element: "Pyro",
    skills: [
      "Guide to Afterlife",
      "Spirit Soother"
    ],
    quote: "Life is but a fleeting dream."
  },
  "Yelan": {
  weapon: "Bow",
  element: "Hydro",
  skills: [
    "Lingering Lifeline",
    "Depth-Clarion Dice"
  ],
  quote: "Truth is just a matter of perspective."
},"Furina": {
  weapon: "Sword",
  element: "Hydro",
  skills: [
    "Salon Solitaire",
    "Let the People Rejoice"
  ],
  quote: "All the world's a stage, and all the men and women merely players."
},
  "Yae Miko": {
    weapon: "Polearm",
    element: "Electro",
    skills: [
      "Transcendence: Baleful Omen",
    ],
    quote: "Inazuma Shines Eternal"
  },
  "Nahida": {
    weapon: "Bow",
    element: "Hydro",
    skills: [
      "Let the Show Begin",
    ],
    quote: "Ready for your big entrance!"
  },
};

const RATES = {
  FIVE_STAR: 0.02,
  FOUR_STAR: 0.5,
  THREE_STAR: 99.48,
};

const CHARACTER_RATINGS = {
  FIVE_STAR: [
    "Cyno",
    "Diluc",
    "Jean",
    "Keqing",
    "Klee",
    "Mona",
    "Qiqi",
    "Xiao",
    "Tighnari",
    "Hutao",
    "Yelan",
    "Furina"
  ],
  FOUR_STAR: [
    "Beidou",
    "Bennett",
    "Chongyun",
    "Fischl",
    "Ningguang",
    "Razor",
    "Sucrose",
    "Xiangling",
    "Xingqiu",
    "Rosaria",
    "Kuki Shinobu",
    "Freminet",
  ],
  THREE_STAR: ["Amber", "Kaeya", "Lisa", "Xinyan","Barbara","Noelle", "Thoma", "Faruzan","Gorou","Mika" ],
};

const PREMIUM_FIVE_STARS = ["Zhongli", "Ganyu", "Ayaka", "Venti", "Raiden Shogun", "Yae Miko", "Nahida"];

const CHARACTER_IDS = {};
let nextCharId = 1;

const activeAuctions = new Map();
const activeTrades = new Map();

const CHARACTER_LEVELS = {
  4: {
    baseStats: { atk: 1.2, def: 1.2, hp: 1.2 },
    maxLevel: 10,
  },
  5: {
    baseStats: { atk: 1.5, def: 1.5, hp: 1.5 },
    maxLevel: 12,
  },
};
function findCharacterInfo(gachaData, charId) {
  return null;
}
function generateCharacterId(characterName) {

  let charId;
  
  do {
    const randomId = Math.floor(100000000 + Math.random() * 900000000);
    
    charId = `CHAR_${randomId}`;
    
  } while (CHARACTER_IDS[charId]);
  
  return charId;
}

function guessCharacterName(charId) {
  const allChars = [
    ...CHARACTER_RATINGS.FIVE_STAR,
    ...CHARACTER_RATINGS.FOUR_STAR,
    ...CHARACTER_RATINGS.THREE_STAR,
  ];

  const id = parseInt(charId.replace("CHAR", "")) % allChars.length;
  return allChars[id];
}
function initializeCharacterIds(gachaData) {
  try {
    nextCharId = 1;

    for (const userId in gachaData) {
      const userData = gachaData[userId];
      if (!userData?.inventory || !Array.isArray(userData.inventory)) continue;

      for (let i = 0; i < userData.inventory.length; i++) {
        const charId = userData.inventory[i];

        if (!charId) continue;

        if (typeof charId !== "string") {
          userData.inventory[i] = `CHAR${charId}`;
          continue;
        }
        if (!charId.startsWith("CHAR")) {
          userData.inventory[i] = `CHAR${charId}`;
        }

        const normalizedCharId = userData.inventory[i];
        if (!CHARACTER_IDS[normalizedCharId]) {
          const charInfo = findCharacterInfo(gachaData, normalizedCharId);

          if (charInfo) {
            CHARACTER_IDS[normalizedCharId] = charInfo;
          } else {
            const possibleName = guessCharacterName(normalizedCharId);
            CHARACTER_IDS[normalizedCharId] = {
              name:
                possibleName ||
                `Unknown Character ${normalizedCharId.replace("CHAR", "")}`,
              obtainedAt: Date.now(),
              value: 500,
            };
          }
        }

        // Cập nhật nextCharId
        const numericId = parseInt(normalizedCharId.replace("CHAR", ""));
        if (!isNaN(numericId) && numericId >= nextCharId) {
          nextCharId = numericId + 1;
        }
      }
    }

    console.log(
      `Successfully initialized ${Object.keys(CHARACTER_IDS).length} characters`
    );
  } catch (error) {
    console.error("Error initializing character IDs:", error);
  }
}

function loadGachaData() {
  try {
    if (!fs.existsSync(GACHA_DATA_FILE)) {
      const dir = path.dirname(GACHA_DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(GACHA_DATA_FILE, JSON.stringify({}));
      return {};
    }
    const data = JSON.parse(fs.readFileSync(GACHA_DATA_FILE));

    initializeCharacterIds(data);

    return data;
  } catch (error) {
    console.error("Error loading gacha data:", error);
    return {};
  }
}

function saveGachaData(data) {
  try {
    fs.writeFileSync(GACHA_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving gacha data:", error);
  }
}

function createTradeOffer(fromId, toId, offerChar, requestChar) {
  const tradeId = `${fromId}_${toId}_${Date.now()}`;
  activeTrades.set(tradeId, {
    from: fromId,
    to: toId,
    offer: offerChar,
    request: requestChar,
    timestamp: Date.now(),
  });
  return tradeId;
}

function createAuction(sellerId, character, startingBid) {
  const auctionId = `${sellerId}_${Date.now()}`;
  activeAuctions.set(auctionId, {
    seller: sellerId,
    character,
    startingBid,
    currentBid: startingBid,
    highestBidder: null,
    endTime: Date.now() + AUCTION_DURATION,
    bids: [],
  });
  return auctionId;
}

function placeBid(auctionId, bidderId, amount) {
  const auction = activeAuctions.get(auctionId);
  if (!auction) return false;
  if (amount <= auction.currentBid) return false;

  auction.currentBid = amount;
  auction.highestBidder = bidderId;
  auction.bids.push({ bidderId, amount, time: Date.now() });
  return true;
}

function getRandomCharacter(rarity) {
  const pool = CHARACTER_RATINGS[rarity];
  return pool[Math.floor(Math.random() * pool.length)];
}
async function showRanking(api, threadID, messageID, type = "value") {
  try {
    const gachaData = loadGachaData();
    const userDataPath = path.join(__dirname, "../events/cache/userData.json");
    let userData = {};

    try {
      userData = JSON.parse(fs.readFileSync(userDataPath));
    } catch (error) {
      console.error("Error reading userData:", error);
    }

    const playerStats = [];

    for (const [userId, data] of Object.entries(gachaData)) {
      if (!data.inventory || data.inventory.length === 0) continue;

      // Tính toán các chỉ số
      let totalValue = 0;
      let fiveStarCount = 0;
      let fourStarCount = 0;
      let threeStarCount = 0;
      let highestLevel = 0;

      data.inventory.forEach((charId) => {
        const char = CHARACTER_IDS[charId];
        if (!char) return;

        totalValue += char.value || 0;

        if (CHARACTER_RATINGS.FIVE_STAR.includes(char.name)) {
          fiveStarCount++;
        } else if (CHARACTER_RATINGS.FOUR_STAR.includes(char.name)) {
          fourStarCount++;
        } else {
          threeStarCount++;
        }

        const charLevel = char.level || 1;
        if (charLevel > highestLevel) highestLevel = charLevel;
      });

      const userName = userData[userId]?.name || "Unknown";

      playerStats.push({
        userId,
        name: userName,
        totalValue,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        highestLevel,
        totalPulls: data.totalPulls || 0,
        cardCount: data.inventory.length,
      });
    }

    let sortKey;
    let rankTitle;

    // Xác định cách sắp xếp dựa trên loại BXH
    switch (type) {
      case "5star":
      case "five":
        sortKey = "fiveStarCount";
        rankTitle = "TOP NGƯỜI CHƠI SỞ HỮU 5★";
        break;
      case "pull":
      case "pulls":
        sortKey = "totalPulls";
        rankTitle = "TOP NGƯỜI CHƠI MỞ THẺ NHIỀU NHẤT";
        break;
      case "level":
        sortKey = "highestLevel";
        rankTitle = "TOP NGƯỜI CHƠI CÓ NHÂN VẬT CẤP CAO";
        break;
      case "card":
      case "cards":
        sortKey = "cardCount";
        rankTitle = "TOP NGƯỜI CHƠI CÓ NHIỀU THẺ";
        break;
      case "value":
      default:
        sortKey = "totalValue";
        rankTitle = "TOP NGƯỜI CHƠI GIÀU NHẤT";
        break;
    }

    // Sắp xếp theo key đã chọn
    playerStats.sort((a, b) => b[sortKey] - a[sortKey]);

    // Giới hạn ở top 10
    const topPlayers = playerStats.slice(0, 10);

    // Tạo nội dung message
    let message = `🏆 ${rankTitle} 🏆\n───────────────\n\n`;

    topPlayers.forEach((player, index) => {
      const medal =
        index === 0
          ? "🥇"
          : index === 1
          ? "🥈"
          : index === 2
          ? "🥉"
          : `${index + 1}.`;

      let details = "";
      if (sortKey === "totalValue") {
        details = `💰 Tổng giá trị: $${player.totalValue.toLocaleString()}`;
      } else if (sortKey === "fiveStarCount") {
        details = `⭐⭐⭐⭐⭐: ${player.fiveStarCount} nhân vật`;
      } else if (sortKey === "totalPulls") {
        details = `🎮 Đã mở: ${player.totalPulls} lần`;
      } else if (sortKey === "highestLevel") {
        details = `👑 Cấp cao nhất: ${player.highestLevel}`;
      } else if (sortKey === "cardCount") {
        details = `🃏 Số thẻ: ${player.cardCount}`;
      }

      message += `${medal} ${player.name}\n${details}\n\n`;
    });

    message += `💡 Xem BXH khác với lệnh:\n.gacha bxh [value/5star/pull/level/card]`;

    return api.sendMessage(message, threadID, messageID);
  } catch (error) {
    console.error("Error showing ranking:", error);
    return api.sendMessage(
      "❌ Đã xảy ra lỗi khi hiển thị BXH!",
      threadID,
      messageID
    );
  }
}
async function getCharacterImage(character) {
  try {
    if (CUSTOM_CHARACTER_IMAGES[character]) {
      const cacheDir = path.join(__dirname, "./cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imagePath = path.join(cacheDir, `${character.toLowerCase()}.png`);
      
      try {
        const response = await axios.get(CUSTOM_CHARACTER_IMAGES[character], {
          responseType: "arraybuffer",
          timeout: 5000,
          validateStatus: (status) => status === 200,
        });

        fs.writeFileSync(imagePath, response.data);
        return imagePath;
      } catch (error) {
        console.warn(`Failed to fetch custom image for ${character}, falling back to default`);
      }
    }

    const defaultImagePath = path.join(
      __dirname,
      "../assets/default_character.png"
    );

    const charInfo = CUSTOM_CHARACTER_DATA[character] || 
                    await genshin.characters(character.toLowerCase())
                    .catch(() => null);

    if (!charInfo) {
      return defaultImagePath;
    }

    const cacheDir = path.join(__dirname, "./cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const imagePath = path.join(cacheDir, `${character.toLowerCase()}.png`);

    try {
      const response = await axios.get(charInfo.image, {
        responseType: "arraybuffer",
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      fs.writeFileSync(imagePath, response.data);
      return imagePath;
    } catch (error) {
      console.warn(`Failed to fetch image for ${character}, using default`);
      return defaultImagePath;
    }
  } catch (error) {
    console.error(`Error getting image for ${character}:`, error);
    return null;
  }
}

function calculateDynamicRates(userData) {
  const pullsWithoutFiveStar = userData.pullsSinceLastFiveStar || 0;
  const pullsWithoutFourStar = userData.pullsSinceLastFourStar || 0;

  const fiveStarBoost = Math.min(5, Math.pow(pullsWithoutFiveStar * 0.1, 1.5));

  const fourStarBoost = Math.min(15, Math.pow(pullsWithoutFourStar * 0.2, 1.3));

  const totalPullsBoost = Math.min(1, (userData.totalPulls || 0) * 0.005);

  return {
    FIVE_STAR: RATES.FIVE_STAR + fiveStarBoost + totalPullsBoost,
    FOUR_STAR: RATES.FOUR_STAR + fourStarBoost,
    THREE_STAR:
      100 -
      (RATES.FIVE_STAR + fiveStarBoost + totalPullsBoost) -
      (RATES.FOUR_STAR + fourStarBoost),
  };
}

function generateCardValue(rarity, characterName) {
  if (rarity === "FIVE_STAR") {
    if (characterName === "Raiden Shogun") {
      // Special value range for Raiden Shogun
      return Math.floor(Math.random() * 8000000) + 2000000; // 2M - 10M range
    }
    if (PREMIUM_FIVE_STARS.includes(characterName)) {
      return Math.floor(Math.random() * 4000000) + 1000000;
    }
    return Math.floor(Math.random() * 200000) + 100000;
  }
  if (rarity === "FOUR_STAR") {
    return Math.floor(Math.random() * 40000) + 10000;
  }
  return Math.floor(Math.random() * 700) + 100;
}

function fusionCharacters(charId1, charId2, userData) {
  const char1 = CHARACTER_IDS[charId1];
  const char2 = CHARACTER_IDS[charId2];

  if (!char1 || !char2) return null;
  if (char1.name !== char2.name) return null;

  const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char1.name)
    ? "5"
    : CHARACTER_RATINGS.FOUR_STAR.includes(char1.name)
    ? "4"
    : "3";

  if (rarity === "3") return null;

  const level1 = char1.level || 1;
  const level2 = char2.level || 1;
  const maxLevel = CHARACTER_LEVELS[rarity].maxLevel;

  if (level1 >= maxLevel) return null;

  userData.inventory = userData.inventory.filter(
    (id) => id !== charId1 && id !== charId2
  );

  const newCharId = generateCharacterId();
  const newLevel = Math.min(maxLevel, level1 + 1);

  const statMultiplier = CHARACTER_LEVELS[rarity].baseStats;
  CHARACTER_IDS[newCharId] = {
    name: char1.name,
    obtainedAt: Date.now(),
    level: newLevel,
    value: char1.value * (1 + newLevel * 0.5),
    stats: {
      atk: Math.floor(char1.stats?.atk * statMultiplier.atk * newLevel || 0),
      def: Math.floor(char1.stats?.def * statMultiplier.def * newLevel || 0),
      hp: Math.floor(char1.stats?.hp * statMultiplier.hp * newLevel || 0),
    },
  };

  return newCharId;
}

function doPull(userData) {
  const currentRates = calculateDynamicRates(userData);
  const roll = Math.random() * 100;

  let character;
  let rarity;
  if (roll < currentRates.FIVE_STAR) {
    userData.pullsSinceLastFiveStar = 0;
    userData.pullsSinceLastFourStar = 0;
    
    // Tỉ lệ đặc biệt cho PREMIUM_FIVE_STARS (20% tỉ lệ thường)
    const premiumRoll = Math.random() * 100;
    if (premiumRoll < 20) {
      // 20% cơ hội nhận Premium trong số 5★
      character = PREMIUM_FIVE_STARS[Math.floor(Math.random() * PREMIUM_FIVE_STARS.length)];
    } else {
      // 80% cơ hội nhận 5★ thường
      // Tạo pool không có Premium
      const regularPool = CHARACTER_RATINGS.FIVE_STAR.filter(
        char => !PREMIUM_FIVE_STARS.includes(char)
      );
      character = regularPool[Math.floor(Math.random() * regularPool.length)];
    }
    rarity = "FIVE_STAR";
  } else if (roll < currentRates.FIVE_STAR + currentRates.FOUR_STAR) {
    // Code cho 4★ giữ nguyên
    userData.pullsSinceLastFourStar = 0;
    userData.pullsSinceLastFiveStar++;
    character = getRandomCharacter("FOUR_STAR");
    rarity = "FOUR_STAR";
  } else {
    // Code cho 3★ giữ nguyên
    userData.pullsSinceLastFourStar++;
    userData.pullsSinceLastFiveStar++;
    character = getRandomCharacter("THREE_STAR");
    rarity = "THREE_STAR";
  }

  // Phần còn lại giữ nguyên
  const charId = generateCharacterId(character);
  CHARACTER_IDS[charId] = {
    name: character,
    obtainedAt: Date.now(),
    value: generateCardValue(rarity, character),
  };
  return charId;
}

function getDetailedHelp() {
  return {
    basic: `🎮 HƯỚNG DẪN GENSHIN GACHA 🎮
───────────────
👉 Lệnh cơ bản:
.gacha pull (hoặc mở) - Mở thẻ nhân vật
.gacha info - Xem tỉ lệ ra nhân vật
.gacha inv - Xem nhân vật đang có
.gacha bxh - Xem BXH người chơi

💰 Giá mở: ${PULL_COST}$ /lần
⭐ Tỉ lệ: 5★ (${RATES.FIVE_STAR}%) | 4★ (${RATES.FOUR_STAR}%) | 3★ (${RATES.THREE_STAR}%)
🔥 THÔNG TIN HẤP DẪN 🔥
• Nhân vật 5★ hiếm có giá trị lên đến 5 TRIỆU $
• Nhân vật 4★ có giá trị từ 10.000 - 40.000 $`,
    trading: `🤝 HƯỚNG DẪN TRAO ĐỔI
───────────────
1️⃣ Xem ID nhân vật:
- Dùng lệnh .gacha inv để xem ID (#1, #2,...)
- ID hiển thị bên cạnh tên nhân vật

2️⃣ Trao đổi:
- Tag người muốn trao đổi
- Ghi rõ ID nhân vật muốn đổi
Cú pháp: .gacha trade @tên #ID
VD: .gacha trade @MinhAnh #1

⏰ Có 5 phút để chấp nhận trao đổi
❗ Chỉ trao đổi nhân vật bạn đang có`,

    auction: `🔨 HƯỚNG DẪN ĐẤU GIÁ
───────────────
1️⃣ Đăng bán:
.gacha auction #ID <giá_khởi_điểm>
VD: .gacha auction #1 10000

2️⃣ Đặt giá:
.gacha bid <ID_phiên> <số_tiền>
VD: .gacha bid abc_123 15000

⏰ Đấu giá kéo dài 1 giờ
💰 Giá khởi điểm tối thiểu: 1000$
❗ Giá mới phải cao hơn giá hiện tại`,

    fusion: `🔄 HƯỚNG DẪN KẾT HỢP
───────────────
1️⃣ Điều kiện:
- Nhân vật phải cùng loại
- Chỉ áp dụng cho 4⭐ trở lên
- Chưa đạt cấp tối đa

2️⃣ Cách kết hợp:
.gacha fusion <ID1> <ID2>
VD: .gacha fusion #1 #2

🎯 Cấp tối đa:
- 4⭐: 10 cấp
- 5⭐: 12 cấp

❗ Lưu ý: Nhân vật dùng để kết hợp sẽ mất`,
  };
}

module.exports = {
  name: "gacha",
  dev: "HNT",
  usedby: 0,
  onPrefix: true,
  category: "Games",
  usages: ".gacha [pull/trade/auction/info/help]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const gachaData = loadGachaData();

    const userDataPath = path.join(__dirname, "../events/cache/userData.json");
    let userName = "Unknown";
    try {
      const userData = JSON.parse(fs.readFileSync(userDataPath));
      userName = userData[senderID]?.name || "Unknown";
    } catch (error) {
      console.error("Error reading userData:", error);
    }

    if (!gachaData[senderID] || !gachaData[senderID].inventory) {
      gachaData[senderID] = {
        inventory: [],
        pullsSinceLastFiveStar: 0,
        pullsSinceLastFourStar: 0,
        totalPulls: 0,
        lastPull: 0,
      };
      saveGachaData(gachaData);
    }

    const userData = gachaData[senderID];

    if (!target[0] || target[0].toLowerCase() === "help") {
      const help = getDetailedHelp();
      return api.sendMessage(
        `${help.basic}\n\n` +
          "💡 Gõ các lệnh sau để xem hướng dẫn chi tiết:\n" +
          ".gacha help trade - Hướng dẫn trao đổi\n" +
          ".gacha help auction - Hướng dẫn đấu \n" +
          ".gacha help fusion - Hướng dẫn kết hợp",
        threadID,
        messageID
      );
    }

    const cmd = target[0].toLowerCase();
    if (cmd === "help") {
      const type = target[1]?.toLowerCase();
      const help = getDetailedHelp();
      return api.sendMessage(help[type] || help.basic, threadID, messageID);
    }

    const action =
      {
        mở: "pull",
        mo: "pull",
        pull: "pull",
        trade: "trade",
        auction: "auction",
        dau: "auction",
        bid: "bid",
        info: "info",
        inv: "inventory",
        kho: "inventory",
        bxh: "rank",
        top: "rank",
        rank: "rank",
        ranking: "rank",
      }[cmd] || cmd;

    switch (action) {
      case "pull": {
        const balance = await getBalance(senderID);
    
        if (balance < PULL_COST) {
            return api.sendMessage(
                "❌ Không đủ Tiền!\n" +
                `💰 Giá: ${PULL_COST}\n` +
                `💵 Hiện có: ${balance}`,
                threadID,
                messageID
            );
        }
    
        const charId = doPull(userData);
        const currentRates = calculateDynamicRates(userData);
        await updateBalance(senderID, -PULL_COST);
    
        const characterName = CHARACTER_IDS[charId].name;
        const is3Star = CHARACTER_RATINGS.THREE_STAR.includes(characterName);
        
        if (!is3Star) {
            userData.inventory.push(charId);
        } else {
            await updateBalance(senderID, 200);
        }
        
        userData.totalPulls++;
        saveGachaData(gachaData);
    
        let rarity = "⭐⭐⭐";
        if (CHARACTER_RATINGS.FIVE_STAR.includes(characterName))
            rarity = "⭐⭐⭐⭐⭐";
        else if (CHARACTER_RATINGS.FOUR_STAR.includes(characterName))
            rarity = "⭐⭐⭐⭐";

        const charInfo = CUSTOM_CHARACTER_DATA[CHARACTER_IDS[charId].name] || 
                        await genshin.characters(CHARACTER_IDS[charId].name.toLowerCase());
        const imagePath = await getCharacterImage(CHARACTER_IDS[charId].name);

        const charRarity = CHARACTER_RATINGS.FIVE_STAR.includes(
          CHARACTER_IDS[charId].name
        )
          ? "5"
          : CHARACTER_RATINGS.FOUR_STAR.includes(CHARACTER_IDS[charId].name)
          ? "4"
          : "3";

          const resultImage = await createPullResultImage({
            userId: senderID,
            userName,
            character: {
              name: CHARACTER_IDS[charId].name,
              image: imagePath,
              id: charId,
              isPremium: PREMIUM_FIVE_STARS.includes(CHARACTER_IDS[charId].name)
            },
            rarity: charRarity,
            stats: {
              element: charInfo?.element || "Unknown",
              weapon: charInfo?.weapon || "Unknown",
              quote: charInfo?.quote || "...",
              skills: charInfo?.skills || []
            },
            currentRates,
            cardValue: CHARACTER_IDS[charId].value,
          });

        return api.sendMessage(
          {
            attachment: fs.createReadStream(resultImage),
          },
          threadID,
          () => {
            fs.unlinkSync(resultImage);
            if (imagePath) fs.unlinkSync(imagePath);
          },
          messageID
        );
      }

      case "info": {
        const currentRates = calculateDynamicRates(userData);
        return api.sendMessage(
          "📊 THÔNG TIN TỈ LỆ GACHA 📊\n" +
            "───────────────\n\n" +
            `💰 Giá: ${PULL_COST} $/lần mở\n\n` +
            "🎯 Tỉ lệ hiện tại:\n" +
            `5⭐: ${currentRates.FIVE_STAR.toFixed(2)}%\n` +
            `4⭐: ${currentRates.FOUR_STAR.toFixed(2)}%\n` +
            `3⭐: ${currentRates.THREE_STAR.toFixed(2)}%\n\n` +
            "💫 Hệ thống tăng tỉ lệ:\n" +
            "• Tỉ lệ tăng theo số lần không ra item hiếm\n" +
            "• Tỉ lệ tăng theo tổng số lần mở\n" +
            `• Đã mở: ${userData.totalPulls} lần\n` +
            `• Số lần chưa ra 5⭐: ${userData.pullsSinceLastFiveStar} lần\n` +
            `• Số lần chưa ra 4⭐: ${userData.pullsSinceLastFourStar} lần`,
          threadID,
          messageID
        );
      }
      case "rank": {
        const rankType = target[1]?.toLowerCase() || "value";
        return showRanking(api, threadID, messageID, rankType);
      }
      case "inventory": {
        console.log(`User ${senderID} inventory:`, userData.inventory);
        console.log("CHARACTER_IDS:", Object.keys(CHARACTER_IDS).length);

        const inventory = userData.inventory.reduce((acc, charId) => {
          const char = CHARACTER_IDS[charId];

          if (!char) {
            console.log(`Character not found: ${charId}`);
            return acc;
          }

          console.log(`Found character: ${char.name}`);

          const charKey = char.name;

          if (!acc[charKey]) {
            acc[charKey] = {
              name: char.name,
              ids: [charId],
              count: 1,
              rarity: CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
                ? 5
                : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
                ? 4
                : 3,
            };
          } else {
            acc[charKey].ids.push(charId);
            acc[charKey].count++;
          }
          return acc;
        }, {});

        const sortedInv = Object.values(inventory).sort(
          (a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)
        );

        const invDisplay = sortedInv
  .map((group) => {
    let rarity = "⭐⭐⭐";
    if (group.rarity === 5) rarity = "⭐⭐⭐⭐⭐";
    else if (group.rarity === 4) rarity = "⭐⭐⭐⭐";

    const idList = group.ids
      .map((id) => {
        const shortId = id.replace("CHAR_", "").slice(-4);
        const level = CHARACTER_IDS[id]?.level || 1;
        return `#${shortId}(Lv${level})`;
      })
      .join(", ");

    return `${group.name} ${rarity} x${group.count}\n    IDs: ${idList}`;
  })
  .join("\n\n");

        return api.sendMessage(
          "🎒 TÚI ĐỒ GACHA 🎒\n" +
            "───────────────\n\n" +
            (invDisplay ||
              "Bạn chưa có nhân vật nào.\nDùng lệnh .gacha pull để mở thẻ!") +
            "\n\n" +
            `📊 Tổng: ${userData.inventory.length} nhân vật`,
          threadID,
          messageID
        );
      }
      case "trade": {
        const mention = Object.keys(event.mentions)[0];
        if (!mention || !target[2]) {
          return api.sendMessage(
            "❌ Thiếu thông tin trao đổi!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha trade @tên #ID\n" +
              "(.gacha help trade để xem hướng dẫn)",
            threadID,
            messageID
          );
        }

        const offerCharId = target[2];
        if (!userData.inventory.includes(offerCharId)) {
          return api.sendMessage(
            "❌ Không tìm thấy nhân vật!\n" +
              "💡 Dùng .g inv để xem ID nhân vật",
            threadID,
            messageID
          );
        }

        const tradeId = createTradeOffer(
          senderID,
          mention,
          offerCharId,
          target[3]
        );
        return api.sendMessage(
          `🤝 Đề nghị trao đổi:\n` +
            `👤 Từ: ${userName}\n` +
            `💫 Đổi: ${offerCharId}\n` +
            `💫 Lấy: ${target[3]}\n` +
            `🔖 ID: ${tradeId}\n\n` +
            `Người được tag có 5 phút để dùng lệnh:\n` +
            `.gacha accept ${tradeId}`,
          threadID,
          messageID
        );
      }

      case "auction": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "❌ Thiếu thông tin đấu giá!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha auction #ID <giá>\n" +
              "(.gacha help auction để xem hướng dẫn)",
            threadID,
            messageID
          );
        }

        const character = target[1];
        const startingBid = parseInt(target[2]);

        if (!userData.inventory.includes(character)) {
          return api.sendMessage(
            "❌ Bạn không sở hữu nhân vật này!",
            threadID,
            messageID
          );
        }

        if (isNaN(startingBid) || startingBid < 1000) {
          return api.sendMessage(
            "❌ Giá khởi điểm không hợp lệ (tối thiểu 1000$)!",
            threadID,
            messageID
          );
        }

        const auctionId = createAuction(senderID, character, startingBid);
        return api.sendMessage(
          `🔨 Đấu giá bắt đầu!\n` +
            `👤 Người bán: ${userName}\n` +
            `💫 Nhân vật: ${character}\n` +
            `💰 Giá khởi điểm: ${startingBid}$\n` +
            `🔖 ID: ${auctionId}\n\n` +
            `Đấu giá kéo dài 1 giờ\n` +
            `Để đặt giá dùng lệnh:\n` +
            `.gacha bid ${auctionId} <số_tiền>`,
          threadID,
          messageID
        );
      }

      case "bid": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "⚠️ Vui lòng ghi rõ ID đấu giá và số tiền!",
            threadID,
            messageID
          );
        }

        const auctionId = target[1];
        const bidAmount = parseInt(target[2]);
        const auction = activeAuctions.get(auctionId);

        if (!auction) {
          return api.sendMessage(
            "❌ Không tìm thấy phiên đấu giá!",
            threadID,
            messageID
          );
        }

        if (auction.seller === senderID) {
          return api.sendMessage(
            "❌ Bạn không thể đấu giá vật phẩm của chính mình!",
            threadID,
            messageID
          );
        }

        const balance = await getBalance(senderID);
        if (balance < bidAmount) {
          return api.sendMessage(
            "❌ Bạn không đủ tiền để đặt giá!",
            threadID,
            messageID
          );
        }

        if (placeBid(auctionId, senderID, bidAmount)) {
          return api.sendMessage(
            `✅ Đặt giá thành công!\n` +
              `💫 Nhân vật: ${auction.character}\n` +
              `💰 Giá hiện tại: ${bidAmount}$\n` +
              `⏰ Kết thúc sau: ${Math.ceil(
                (auction.endTime - Date.now()) / 60000
              )} phút`,
            threadID,
            messageID
          );
        } else {
          return api.sendMessage(
            "❌ Giá của bạn phải cao hơn giá hiện tại!",
            threadID,
            messageID
          );
        }
      }

      case "fusion": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "❌ Thiếu ID nhân vật!\n\n" +
              "Cách dùng: .gacha fusion <ID1> <ID2>\n" +
              "VD: .gacha fusion #1 #2\n\n" +
              "⚠️ Lưu ý:\n" +
              "- Chỉ kết hợp được nhân vật cùng loại\n" +
              "- Chỉ áp dụng cho 4⭐ trở lên\n" +
              "- Nhân vật sau khi kết hợp sẽ tăng cấp\n" +
              "- Cấp tối đa: 4⭐(10), 5⭐(12)",
            threadID,
            messageID
          );
        }

        const charId1 = target[1].replace("#", "CHAR");
        const charId2 = target[2].replace("#", "CHAR");

        if (
          !userData.inventory.includes(charId1) ||
          !userData.inventory.includes(charId2)
        ) {
          return api.sendMessage(
            "❌ Bạn không sở hữu (một trong) các nhân vật này!",
            threadID,
            messageID
          );
        }

        const result = fusionCharacters(charId1, charId2, userData);
        if (!result) {
          return api.sendMessage(
            "❌ Không thể kết hợp!\n" +
              "- Nhân vật phải cùng loại\n" +
              "- Phải là 4⭐ trở lên\n" +
              "- Chưa đạt cấp tối đa",
            threadID,
            messageID
          );
        }

        userData.inventory.push(result);
        saveGachaData(gachaData);

        const char = CHARACTER_IDS[result];
        return api.sendMessage(
          "✨ Kết hợp thành công!\n" +
            `${char.name} đã đạt cấp ${char.level}\n` +
            `💪 ATK: ${char.stats.atk}\n` +
            `🛡️ DEF: ${char.stats.def}\n` +
            `❤️ HP: ${char.stats.hp}\n` +
            `💰 Giá trị: $${char.value.toLocaleString()}`,
          threadID,
          messageID
        );
      }
    }
  },
};
