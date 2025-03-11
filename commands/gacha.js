const genshin = require("genshin");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getBalance, updateBalance } = require("../utils/currencies");
const { createPullResultImage, createStoneResultImage } = require("../canvas/gachaCanvas");

const GACHA_DATA_FILE = path.join(__dirname, "./json/gacha/gacha.json");
const PULL_COST = 1000;
const AUCTION_DURATION = 3600000;
const PULL_COOLDOWN = 15;

let gachaData = {};

const activePvpChallenges = new Map();
const PVP_CHALLENGE_DURATION = 300000;
const PVP_COOLDOWN = 60000; 
const PVP_REWARD_WIN = 2000;
const PVP_REWARD_LOSE = 500; 

const CHARACTERS_DB_FILE = path.join(__dirname, "./json/gacha/characters_db.json");

const ELEMENT_ADVANTAGES = {
  Pyro: ["Cryo", "Dendro"],
  Hydro: ["Pyro", "Geo"],
  Electro: ["Hydro", "Anemo"],
  Cryo: ["Hydro", "Electro"],
  Dendro: ["Hydro", "Geo"],
  Geo: ["Electro", "Anemo"],
  Anemo: ["Cryo", "Dendro"],
};
const CUSTOM_CHARACTER_IMAGES = {
  "Raiden Shogun": "https://imgur.com/2l5q6Ib.png",
  Noelle: "https://imgur.com/HvhzDne.png",
  Xinyan: "https://imgur.com/KBX3syb.png",
  Barbara: "https://imgur.com/4C9Dsl0.png",
  Rosaria: "https://imgur.com/OEt1mvT.png",
  Thoma: "https://imgur.com/wGUtE3a.png",
  Faruzan: "https://imgur.com/5rbs7lf.png",
  Gorou: "https://imgur.com/8WFB75F.png",
  Mika: "https://imgur.com/rkihX4u.png",
  Lisa: "https://imgur.com/WyX41nu.png",
  "Kuki Shinobu": "https://imgur.com/QB2OkkW.png",
  Freminet: "https://imgur.com/fh2TcW7.png",
  Tighnari: "https://imgur.com/xVR5BRG.png",
  Hutao: "https://imgur.com/9tuCA1v.png",
  Yelan: "https://imgur.com/oiNOdqD.png",
  Furina: "https://imgur.com/Ovo2GXz.png",
  "Yae Miko": "https://imgur.com/dWz5xym.png",
  Nahida: "https://imgur.com/uvEyzJy.png",
  Bennett: "https://imgur.com/D8uVCcI.png",
  Yanfei: "https://imgur.com/3UE1s1o.png",
  Sayu: "https://imgur.com/sThH2Zu.png",
  Dori: "https://imgur.com/JEmUtJP.png",
  Candace: "https://imgur.com/xEzeWbs.png",
  "Kujou Sara": "https://imgur.com/NglMvgC.png",
  Layla: "https://imgur.com/bG3ksud.png",
  Collei: "https://imgur.com/m7TsSPK.png",
  Diona: "https://imgur.com/iPKtes1.png",
  Dehya: "https://imgur.com/7tTNdEd.png",
  Ganyu: "https://imgur.com/UNUpMCd",
  Kaveh: "https://imgur.com/9rragrx.png",
  Eula: "https://imgur.com/MUErJTP.png",
  Shenhe: "https://imgur.com/Hxr7cpc.png",
  "Cyno": "https://imgur.com/mLPFGAL.png",
};

const CUSTOM_CHARACTER_DATA = {
  "Raiden Shogun": {
    weapon: "Polearm",
    element: "Electro",
    skills: ["Transcendence: Baleful Omen", "Secret Art: Musou Shinsetsu"],
    quote: "Inazuma Shines Eternal",
  },
  Freminet: {
    weapon: "Claymore",
    element: "Cryo",
    skills: ["Pressurized Floe", "Shadowhunter’s Ambush"],
    quote: "I will protect you.",
  },
  Noelle: {
    weapon: "Claymore",
    element: "Geo",
    skills: ["Breastplate", "Sweeping Time"],
    quote: "Leave it to me!",
  },
  Xinyan: {
    weapon: "Claymore",
    element: "Pyro",
    skills: ["Sweeping Fervor", "Riff Revolution"],
    quote: "Rock and roll!",
  },
  Barbara: {
    weapon: "Catalyst",
    element: "Hydro",
    skills: ["Let the Show Begin", "Shining Miracle"],
    quote: "Ready for your big entrance!",
  },
  Rosaria: {
    weapon: "Polearm",
    element: "Cryo",
    skills: ["Ravaging Confession", "Rites of Termination"],
    quote: "Judgment has come.",
  },
  Thoma: {
    weapon: "Polearm",
    element: "Pyro",
    skills: ["Blazing Blessing", "Crimson Ooyoroi"],
    quote: "I'll do my best.",
  },
  Faruzan: {
    weapon: "Bow",
    element: "Anemo",
    skills: ["Wind Realm of Nasamjnin", "The Wind’s Secret Ways"],
    quote: "I will protect you.",
  },
  Gorou: {
    weapon: "Bow",
    element: "Geo",
    skills: ["Inuzaka All-Round Defense", "Juuga: Forward Unto Victory"],
    quote: "I am here to serve.",
  },
  Mika: {
    weapon: "Polearm",
    element: "Cryo",
    skills: ["Starfrost Swirl", "Skyfeather Song"],
    quote: "I will fight for you.",
  },
  "Kuki Shinobu": {
    weapon: "Sword",
    element: "Electro",
    skills: ["Sanctifying Ring", "Goei Narukami Kariyama Rite"],
    quote: "I will protect my friends.",
  },
  Tighnari: {
    weapon: "Bow",
    element: "Dendro",
    skills: ["Vijnana-Phala Mine", "Fashioner’s Tanglevine Shaft"],
    quote: "I will protect you.",
  },
  Hutao: {
    weapon: "Polearm",
    element: "Pyro",
    skills: ["Guide to Afterlife", "Spirit Soother"],
    quote: "Life is but a fleeting dream.",
  },
  Yelan: {
    weapon: "Bow",
    element: "Hydro",
    skills: ["Lingering Lifeline", "Depth-Clarion Dice"],
    quote: "Truth is just a matter of perspective.",
  },
  Furina: {
    weapon: "Sword",
    element: "Hydro",
    skills: ["Salon Solitaire", "Let the People Rejoice"],
    quote: "All the world's a stage, and all the men and women merely players.",
  },
  "Yae Miko": {
    weapon: "Catalyst",
    element: "Electro",
    skills: [
      "Yakan Evocation: Sesshou Sakura",
      "Great Secret Art: Tenko Kenshin",
    ],
    quote: "The Kitsune Saiguu watches over us.",
  },
  Nahida: {
    weapon: "Catalyst",
    element: "Dendro",
    skills: ["All Schemes to Know", "Illusory Heart"],
    quote: "Let me show you the wisdom of Sumeru.",
  },
  Bennett: {
    weapon: "Sword",
    element: "Pyro",
    skills: ["Passion Overload", "Fantastic Voyage"],
    quote: "Leave it to me!",
  },
  Yanfei: {
    weapon: "Catalyst",
    element: "Pyro",
    skills: ["Signed Edict", "Done Deal"],
    quote: "I will protect you.",
  },
  Sayu: {
    weapon: "Claymore",
    element: "Anemo",
    skills: ["Yoohoo Art: Fuuin Dash", "Yoohoo Art: Mujina Flurry"],
    quote: "Nap time...",
  },
  Dori: {
    weapon: "Claymore",
    element: "Electro",
    skills: [
      "Spirit-Warding Lamp: Troubleshooter Cannon",
      "Alcazarzaray’s Exactitude",
    ],
    quote: "How may I be of service?",
  },
  Candace: {
    weapon: "Polearm",
    element: "Hydro",
    skills: ["Sacred Rite: Heron’s Sanctum", "Sacred Rite: Wagtail’s Tide"],
    quote: "We tread upon a land cloaked in shadow.",
  },
  "Kujou Sara": {
    weapon: "Bow",
    element: "Electro",
    skills: ["Tengu Stormcall", "Subjugation: Koukou Sendou"],
    quote: "The will of the Shogun guides us onward.",
  },
  Layla: {
    weapon: "Sword",
    element: "Cryo",
    skills: ["Nights of Formal Focus", "Dream of the Star-Stream Shaker"],
    quote: "Dreams are but waypoints in the night sky.",
  },
  Collei: {
    weapon: "Bow",
    element: "Dendro",
    skills: ["Floral Brush", "Trump-Card Kitty"],
    quote: "The forest will always be my home.",
  },
  Diona: {
    weapon: "Bow",
    element: "Cryo",
    skills: ["Icy Paws", "Signature Mix"],
    quote: "You better not spill that drink!",
  },
  Dehya: {
    weapon: "Claymore",
    element: "Pyro",
    skills: ["Molten Inferno", "The Lioness' Bite"],
    quote: "Survival of the fittest!",
  },
  Kaveh: {
    weapon: "Claymore",
    element: "Dendro",
    skills: ["Artistic Ingenuity", "Painted Dome"],
    quote: "True beauty lies in the details.",
  },
  Shenhe: {
    weapon: "Polearm",
    element: "Cryo",
    skills: ["Cleansing Brilliance", "Purity’s Radiance"],
    quote: "I will protect you.",
  },
  Ganyu: {
    weapon: "Bow",
    element: "Cryo",
    skills: ["Trail of the Qilin", "Celestial Shower"],
    quote: "I will protect you.",
  },
  Cyno: {
    weapon: "Polearm",
    element: "Hydro",
    skills: ["Secret Rite: Chasmic Soulfarer", "Sacred Rite: Wolf’s Swiftness"],
    quote: "I will protect you.",
  },
};

const RATES = {
  FIVE_STAR: 0.001,
  FOUR_STAR: 15,
  THREE_STAR: 84.999,
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
    "Shenhe",
    "Xiao",
    "Tighnari",
    "Hutao",
    "Yelan",
    "Furina",
    "Zhongli",
    "Eula",
    "Ganyu",
    "Ayaka",
    "Venti",
    "Raiden Shogun",
    "Yae Miko",
    "Nahida",
  ],
  FOUR_STAR: [
    "Beidou",
    "Bennett",
    "Candace",
    "Chongyun",
    "Layla",
    "Fischl",
    "Ningguang",
    "Razor",
    "Sucrose",
    "Yanfei",
    "Kujou Sara",
    "Rosaria",
    "Sayu",
    "Dori",
    "Thoma",
    "Xiangling",
    "Xingqiu",
    "Kuki Shinobu",
    "Freminet",
  ],
  THREE_STAR: [
    "Kaveh",
    "Dehya",
    "Diona",
    "Collei",
    "Amber",
    "Kaeya",
    "Lisa",
    "Xinyan",
    "Barbara",
    "Noelle",
    "Faruzan",
    "Gorou",
    "Mika",
  ],
};

const PREMIUM_FIVE_STARS = [
  "Zhongli",
  "Ganyu",
  "Ayaka",
  "Raiden Shogun",
  "Yae Miko",
];
const ELEMENTAL_STONES = {
  PYRO: {
    name: "Agnidus Agate",
    element: "Pyro",
    description: "Ascension stone for Pyro characters",
    emoji: "🔥",
    image: "https://imgur.com/J0J2lfG.png",
    value: 25000,
  },
  HYDRO: {
    name: "Varunada Lazurite",
    element: "Hydro",
    description: "Ascension stone for Hydro characters",
    emoji: "💧",
    image: "https://imgur.com/Wr8Udzy.png",
    value: 25000,
  },
  ELECTRO: {
    name: "Vajrada Amethyst",
    element: "Electro",
    description: "Ascension stone for Electro characters",
    emoji: "⚡",
    image: "https://imgur.com/iJr7tkQ.png",
    value: 25000,
  },
  CRYO: {
    name: "Shivada Jade",
    element: "Cryo",
    description: "Ascension stone for Cryo characters",
    emoji: "❄️",
    image: "https://imgur.com/k7PooZ5.png",
    value: 25000,
  },
  DENDRO: {
    name: "Nagadus Emerald",
    element: "Dendro",
    description: "Ascension stone for Dendro characters",
    emoji: "🌿",
    image: "https://imgur.com/YqWMMHO.png",
    value: 25000,
  },
  GEO: {
    name: "Prithiva Topaz",
    element: "Geo",
    description: "Ascension stone for Geo characters",
    emoji: "🪨",
    image: "https://imgur.com/LCLoXOH.png",
    value: 25000,
  },
  ANEMO: {
    name: "Vayuda Turquoise",
    element: "Anemo",
    description: "Ascension stone for Anemo characters",
    emoji: "🌪️",
    image: "https://imgur.com/puantrR.png",
    value: 25000,
  },
  UNIVERSAL: {
    name: "Brilliant Diamond",
    element: "Universal",
    description: "Universal ascension stone for any character",
    emoji: "💎",
    image: "https://imgur.com/oy8zBkt.png",
    value: 500000,
  },
};

const ELEMENTAL_FRAGMENTS = {
  PYRO: {
    name: "Agnidus Agate Fragment",
    element: "Pyro",
    description: "Pyro evolution fragment",
    emoji: "🔥",
    image: "https://imgur.com/Ec9w0A3.png",
    value: 2500,
    isFragment: true
  },
  HYDRO: {
    name: "Varunada Lazurite Fragment",
    element: "Hydro",
    description: "Hydro evolution fragment",
    emoji: "💧",
    image: "https://imgur.com/xUQZRMt.png",
    value: 2500,
    isFragment: true
  },
  ELECTRO: {
    name: "Vajrada Amethyst Fragment",
    element: "Electro",
    description: "Electro evolution fragment",
    emoji: "⚡",
    image: "https://imgur.com/JxRxK1i.png",
    value: 2500,
    isFragment: true
  },
  CRYO: {
    name: "Shivada Jade Fragment",
    element: "Cryo",
    description: "Cryo evolution fragment",
    emoji: "❄️",
    image: "https://imgur.com/tU6KMBs.png",
    value: 2500,
    isFragment: true
  },
  DENDRO: {
    name: "Nagadus Emerald Fragment",
    element: "Dendro",
    description: "Dendro evolution fragment",
    emoji: "🌿",
    image: "https://imgur.com/uVp1eNU.png",
    value: 2500,
    isFragment: true
  },
  GEO: {
    name: "Prithiva Topaz Fragment",
    element: "Geo",
    description: "Geo evolution fragment",
    emoji: "🪨",
    image: "https://imgur.com/vAfAFli.png",
    value: 2500,
    isFragment: true
  },
  ANEMO: {
    name: "Vayuda Turquoise Fragment",
    element: "Anemo",
    description: "Anemo evolution fragment",
    emoji: "🌪️",
    image: "https://imgur.com/tl1G3g6.png",
    value: 2500,
    isFragment: true
  },
  UNIVERSAL: {
    name: "Brilliant Diamond Fragment",
    element: "Universal",
    description: "Universal evolution fragment",
    emoji: "💎",
    image: "https://imgur.com/8BQY2FS.png",
    value: 50000,
    isFragment: true
  },
};


let CHARACTER_IDS = {};
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
function generateStoneId(stoneType) {
  let stoneId;
  do {
    const randomId = Math.floor(100000000 + Math.random() * 900000000);
    stoneId = `STONE_${stoneType}_${randomId}`;
  } while (CHARACTER_IDS[stoneId]);
  return stoneId;
}

function createStone(stoneType) {
  const stoneId = generateStoneId(stoneType);
  CHARACTER_IDS[stoneId] = {
    type: "stone",
    stoneType: stoneType,
    name: ELEMENTAL_STONES[stoneType].name,
    element: ELEMENTAL_STONES[stoneType].element,
    emoji: ELEMENTAL_STONES[stoneType].emoji,
    description: ELEMENTAL_STONES[stoneType].description,
    image: ELEMENTAL_STONES[stoneType].image,
    obtainedAt: Date.now(),
    value: ELEMENTAL_STONES[stoneType].value,
  };
  saveCharacterDatabase();
  return stoneId;
}
function cleanupInventory(userData) {

  const originalCount = userData.inventory.length;
  const originalInventory = [...userData.inventory];
  
  console.log("🔍 DEBUG: Checking inventory items...");

  originalInventory.forEach((charId) => {
    const char = CHARACTER_IDS[charId];
    if (!char) {
      console.log(`Warning: Character ${charId} info not found`);
      return;
    }

    if (CHARACTER_RATINGS.THREE_STAR.includes(char.name)) {
      console.log(`3★ character: ${char.name} (${charId})`);
    } else if (CHARACTER_RATINGS.FOUR_STAR.includes(char.name)) {
      console.log(`4★ character: ${char.name} (${charId})`);
    } else if (CHARACTER_RATINGS.FIVE_STAR.includes(char.name)) {
      console.log(`5★ character: ${char.name} (${charId})`);
    } else if (charId.startsWith("STONE_")) {
      console.log(`Stone: ${char.name} (${charId})`);
    }
  });

  return 0; 
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
// Hàm tính sức mạnh của nhân vật
function calculateCharacterPower(charId) {
  const char = CHARACTER_IDS[charId];
  if (!char) return 0;
  
  // Lấy các chỉ số cơ bản
  const stats = char.stats || { atk: 100, def: 100, hp: 500 };
  const level = char.level || 1;
  const stars = char.starLevel || (CHARACTER_RATINGS.FIVE_STAR.includes(char.name) ? 5 : 
                                   CHARACTER_RATINGS.FOUR_STAR.includes(char.name) ? 4 : 3);
  
  // Tính sức mạnh cơ bản
  let power = (stats.atk * 2 + stats.def + stats.hp / 10) * (level / 5);
  
  // Thêm hệ số sao
  power *= (1 + (stars - 3) * 0.5);
  
  // Nhân vật premium mạnh hơn một chút
  if (PREMIUM_FIVE_STARS.includes(char.name)) {
    power *= 1.2;
  }
  
  return Math.floor(power);
}

// Hàm tính sức mạnh của đội
function calculateTeamPower(teamIds) {
  let totalPower = 0;
  for (const charId of teamIds) {
    totalPower += calculateCharacterPower(charId);
  }
  return totalPower;
}

// Hàm áp dụng tương khắc nguyên tố
function applyElementalAdvantage(attackerTeam, defenderTeam) {
  let advantageMultiplier = 1.0;
  
  // Tìm các tương khắc nguyên tố
  for (const attackerId of attackerTeam) {
    const attacker = CHARACTER_IDS[attackerId];
    if (!attacker) continue;
    
    const attackerElement = CUSTOM_CHARACTER_DATA[attacker.name]?.element;
    if (!attackerElement) continue;
    
    for (const defenderId of defenderTeam) {
      const defender = CHARACTER_IDS[defenderId];
      if (!defender) continue;
      
      const defenderElement = CUSTOM_CHARACTER_DATA[defender.name]?.element;
      if (!defenderElement) continue;
      
      if (ELEMENT_ADVANTAGES[attackerElement]?.includes(defenderElement)) {
        // Tăng hệ số lợi thế cho mỗi tương khắc tìm thấy
        advantageMultiplier += 0.1;
      }
    }
  }
  
  return advantageMultiplier;
}

// Hàm tạo thách đấu PVP
function createPvpChallenge(challengerId, targetId, challengerTeam) {
  const challengeId = `PVP_${challengerId}_${targetId}_${Date.now()}`;
  
  activePvpChallenges.set(challengeId, {
    challenger: challengerId,
    target: targetId,
    challengerTeam: challengerTeam,
    timestamp: Date.now(),
    expiry: Date.now() + PVP_CHALLENGE_DURATION
  });
  
  return challengeId;
}

async function executePvpBattle(api, threadID, messageID, challengeData, targetTeam) {
  const challenger = challengeData.challenger;
  const target = challengeData.target;
  const challengerTeam = challengeData.challengerTeam;
  
  const challengerPower = calculateTeamPower(challengerTeam);
  const targetPower = calculateTeamPower(targetTeam);
  
  const challengerAdvantage = applyElementalAdvantage(challengerTeam, targetTeam);
  const targetAdvantage = applyElementalAdvantage(targetTeam, challengerTeam);
  
  const finalChallengerPower = challengerPower * challengerAdvantage;
  const finalTargetPower = targetPower * targetAdvantage;
  
  const totalPower = finalChallengerPower + finalTargetPower;
  const challengerWinRate = (finalChallengerPower / totalPower) * 100;
  
  const randomFactor = Math.random() * 30 - 15; 
  const adjustedWinRate = Math.max(5, Math.min(95, challengerWinRate + randomFactor)); // Giới hạn từ 5% đến 95%
  
  const roll = Math.random() * 100;
  const challengerWins = roll < adjustedWinRate;
  
  const gachaData = loadGachaData();
  
  if (!gachaData[challenger].pvpStats) {
    gachaData[challenger].pvpStats = { wins: 0, losses: 0, lastBattle: 0 };
  }
  
  if (!gachaData[target].pvpStats) {
    gachaData[target].pvpStats = { wins: 0, losses: 0, lastBattle: 0 };
  }
  
  if (challengerWins) {
    gachaData[challenger].pvpStats.wins++;
    gachaData[target].pvpStats.losses++;
    await updateBalance(challenger, PVP_REWARD_WIN);
    await updateBalance(target, PVP_REWARD_LOSE);
  } else {
    gachaData[challenger].pvpStats.losses++;
    gachaData[target].pvpStats.wins++;
    await updateBalance(challenger, PVP_REWARD_LOSE);
    await updateBalance(target, PVP_REWARD_WIN);
  }
  
  gachaData[challenger].pvpStats.lastBattle = Date.now();
  gachaData[target].pvpStats.lastBattle = Date.now();
  
  saveGachaData(gachaData);
  
  const userDataPath = path.join(__dirname, "../events/cache/userData.json");
  let userData = {};
  
  try {
    userData = JSON.parse(fs.readFileSync(userDataPath));
  } catch (error) {
    console.error("Error reading userData:", error);
  }
  
  const challengerName = userData[challenger]?.name || "Người chơi 1";
  const targetName = userData[target]?.name || "Người chơi 2";
  
  // Tạo thông tin đội hình
  const challengerTeamInfo = await formatTeamInfo(challengerTeam);
  const targetTeamInfo = await formatTeamInfo(targetTeam);
  
  // Tạo thông báo kết quả
  let resultMessage = `⚔️ KẾT QUẢ TRẬN ĐẤU PVP ⚔️\n`;
  resultMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  resultMessage += `👤 ${challengerName}:\n`;
  resultMessage += `${challengerTeamInfo}\n`;
  resultMessage += `💪 Sức mạnh: ${challengerPower} (x${challengerAdvantage.toFixed(1)} nguyên tố)\n`;
  resultMessage += `⚔️ Sức mạnh thực: ${Math.floor(finalChallengerPower)}\n\n`;
  
  resultMessage += `👤 ${targetName}:\n`;
  resultMessage += `${targetTeamInfo}\n`;
  resultMessage += `💪 Sức mạnh: ${targetPower} (x${targetAdvantage.toFixed(1)} nguyên tố)\n`;
  resultMessage += `⚔️ Sức mạnh thực: ${Math.floor(finalTargetPower)}\n\n`;
  
  resultMessage += `🎲 Tỷ lệ thắng: ${adjustedWinRate.toFixed(1)}% vs ${(100 - adjustedWinRate).toFixed(1)}%\n`;
  resultMessage += `🎯 Kết quả roll: ${roll.toFixed(1)} (Cần < ${adjustedWinRate.toFixed(1)}% để thắng)\n`;
  resultMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (challengerWins) {
    resultMessage += `🏆 NGƯỜI THẮNG: ${challengerName}\n`;
    resultMessage += `💰 Phần thưởng: $${PVP_REWARD_WIN.toLocaleString()}\n`;
    resultMessage += `💰 ${targetName} nhận: $${PVP_REWARD_LOSE.toLocaleString()} (an ủi)`;
  } else {
    resultMessage += `🏆 NGƯỜI THẮNG: ${targetName}\n`;
    resultMessage += `💰 Phần thưởng: $${PVP_REWARD_WIN.toLocaleString()}\n`;
    resultMessage += `💰 ${challengerName} nhận: $${PVP_REWARD_LOSE.toLocaleString()} (an ủi)`;
  }
  
  return api.sendMessage(resultMessage, threadID, messageID);
}

async function formatTeamInfo(teamIds) {
  let result = "";
  
  for (let i = 0; i < teamIds.length; i++) {
    const charId = teamIds[i];
    const char = CHARACTER_IDS[charId];
    if (!char) continue;
    
    const stars = char.starLevel || (CHARACTER_RATINGS.FIVE_STAR.includes(char.name) ? 5 : 
                                     CHARACTER_RATINGS.FOUR_STAR.includes(char.name) ? 4 : 3);
    
    const starsText = "⭐".repeat(Math.min(5, stars)) + (stars > 5 ? ` [${stars}★]` : "");
    const level = char.level || 1;
    const charInfo = CUSTOM_CHARACTER_DATA[char.name] || {};
    const element = charInfo.element || "Unknown";
    
    result += `${i+1}. ${char.name} ${starsText} Lv${level} (${element})\n`;
  }
  
  if (result === "") {
    result = "Không có nhân vật nào";
  }
  
  return result;
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
function createStoneFragment(stoneType) {
  const fragmentId = generateFragmentId(stoneType);
  CHARACTER_IDS[fragmentId] = {
    type: "fragment",
    stoneType: stoneType,
    name: ELEMENTAL_FRAGMENTS[stoneType].name,
    element: ELEMENTAL_FRAGMENTS[stoneType].element,
    emoji: ELEMENTAL_FRAGMENTS[stoneType].emoji,
    description: ELEMENTAL_FRAGMENTS[stoneType].description,
    image: ELEMENTAL_FRAGMENTS[stoneType].image,
    obtainedAt: Date.now(),
    value: ELEMENTAL_FRAGMENTS[stoneType].value,
    isFragment: true
  };
  saveCharacterDatabase();
  return fragmentId;
}

// Hàm tạo ID cho mảnh đá
function generateFragmentId(stoneType) {
  let fragmentId;
  do {
    const randomId = Math.floor(100000000 + Math.random() * 900000000);
    fragmentId = `FRAGMENT_${stoneType}_${randomId}`;
  } while (CHARACTER_IDS[fragmentId]);
  return fragmentId;
}
function validateInventories(gachaData) {

  if (Object.keys(CHARACTER_IDS).length === 0) {
    console.log("WARNING: CHARACTER_IDS is empty, skipping validation");
    return 0; 
  }

  let totalFixed = 0;

  for (const userId in gachaData) {
    const userData = gachaData[userId];
    if (!userData?.inventory || !Array.isArray(userData.inventory)) continue;

    const beforeCount = userData.inventory.length;

    const invalidIds = userData.inventory.filter((id) => !CHARACTER_IDS[id]);
    if (invalidIds.length > 0) {

      userData.inventory = userData.inventory.filter((id) => CHARACTER_IDS[id]);
      totalFixed += invalidIds.length;
    }
  }

  if (totalFixed > 0) {
    console.log(`Fixed ${totalFixed} invalid character references`);
    saveGachaData(gachaData);
  }
  
  return totalFixed;
}
function loadGachaData() {
  try {
    loadCharacterDatabase();

    if (!fs.existsSync(GACHA_DATA_FILE)) {
      const dir = path.dirname(GACHA_DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(GACHA_DATA_FILE, JSON.stringify({}));
      return {};
    }
    const data = JSON.parse(fs.readFileSync(GACHA_DATA_FILE));
    
    gachaData = data;
    
    return data;
  } catch (error) {
    console.error("Error loading gacha data:", error);
    return {};
  }
}
function verifyInventory(userId) {
  try {
    const fileData = JSON.parse(fs.readFileSync(GACHA_DATA_FILE));
    const fileInventory = fileData[userId]?.inventory || [];
    
    const memoryData = gachaData[userId]?.inventory || [];
    
    if (JSON.stringify(fileInventory) !== JSON.stringify(memoryData)) {
      console.log(`⚠️ Phát hiện dữ liệu không khớp cho người dùng ${userId}:`);
      console.log(`- File: ${fileInventory.length} items`);
      console.log(`- Memory: ${memoryData.length} items`);
      
      if (memoryData.length > fileInventory.length) {
        fileData[userId].inventory = memoryData;
        fs.writeFileSync(GACHA_DATA_FILE, JSON.stringify(fileData, null, 2));
        console.log(`✅ Đã cập nhật file với dữ liệu trong bộ nhớ`);
      }
      else if (fileInventory.length > memoryData.length) {
        gachaData[userId].inventory = fileInventory;
        console.log(`✅ Đã cập nhật bộ nhớ với dữ liệu từ file`);
      }
    }
  } catch (error) {
    console.error("Error verifying inventory:", error);
  }
}
function saveGachaData(data) {
  try {
    const tempFile = `${GACHA_DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, GACHA_DATA_FILE);
    console.log(`Đã lưu dữ liệu gacha thành công`);
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
        console.warn(
          `Failed to fetch custom image for ${character}, falling back to default`
        );
      }
    }

    const defaultImagePath = path.join(
      __dirname,
      "../assets/default_character.png"
    );

    const charInfo =
      CUSTOM_CHARACTER_DATA[character] ||
      (await genshin.characters(character.toLowerCase()).catch(() => null));

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
function restoreFromBackup(date = null) {
  try {
    const backupDir = path.join(__dirname, "./json/backups");
    if (!fs.existsSync(backupDir)) {
      console.log("No backup directory found");
      return false;
    }

    const backups = fs.readdirSync(backupDir);
    if (backups.length === 0) {
      console.log("No backups found");
      return false;
    }

    let backupFile, charactersBackupFile;
    if (date) {
      backupFile = `.json/gacha/gacha_backup_${date}.json`;
      charactersBackupFile = `.json/gacha/characters_backup_${date}.json`;
    } else {
      const gachaBackups = backups.filter(f => f.startsWith('gacha_backup_'));
      const characterBackups = backups.filter(f => f.startsWith('characters_backup_'));
      
      if (gachaBackups.length === 0 || characterBackups.length === 0) {
        console.log("Missing required backup files");
        return false;
      }
      
      backupFile = gachaBackups.sort().reverse()[0];
      charactersBackupFile = characterBackups.sort().reverse()[0];
    }

    const backupPath = path.join(backupDir, backupFile);
    const charactersBackupPath = path.join(backupDir, charactersBackupFile);
    
    if (!fs.existsSync(backupPath) || !fs.existsSync(charactersBackupPath)) {
      console.log(`Backup files not found: ${backupFile}, ${charactersBackupFile}`);
      return false;
    }

    fs.copyFileSync(backupPath, GACHA_DATA_FILE);
    fs.copyFileSync(charactersBackupPath, CHARACTERS_DB_FILE);

    console.log(`Restored from backup: ${backupFile}, ${charactersBackupFile}`);
    
    loadCharacterDatabase();
    return true;
  } catch (error) {
    console.error("Error restoring from backup:", error);
    return false;
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
function saveCharacterDatabase() {
  try {
    fs.writeFileSync(
      CHARACTERS_DB_FILE,
      JSON.stringify(CHARACTER_IDS, null, 2)
    );
    console.log(
      `Saved ${Object.keys(CHARACTER_IDS).length} characters to database`
    );
  } catch (error) {
    console.error("Error saving character database:", error);
  }
}

function loadCharacterDatabase() {
  try {
    if (!fs.existsSync(CHARACTERS_DB_FILE)) {
      console.log("Character database file not found, creating new one");
      saveCharacterDatabase();
      return;
    }

    const data = JSON.parse(fs.readFileSync(CHARACTERS_DB_FILE));
    CHARACTER_IDS = data;
    
    console.log(`Loaded ${Object.keys(CHARACTER_IDS).length} characters from database`);
    
    const keys = Object.keys(CHARACTER_IDS);
    if (keys.length > 0) {
      const sample = keys.slice(0, Math.min(3, keys.length));
      sample.forEach(id => {
        console.log(`Sample character: ${id} - ${CHARACTER_IDS[id]?.name || 'Unknown'}`);
      });
    }
  } catch (error) {
    console.error("Error loading character database:", error);
    CHARACTER_IDS = {};
  }
}
function generateCardValue(rarity, characterName) {
  if (rarity === "FIVE_STAR") {
    if (PREMIUM_FIVE_STARS.includes(characterName)) {
      return Math.floor(Math.random() * 500000000) + 100000000;
    }
    return Math.floor(Math.random() * 2000000) + 1000000;
  }
  if (rarity === "FOUR_STAR") {
    return Math.floor(Math.random() * 40000) + 10000;
  }
  return Math.floor(Math.random() * 700) + 100;
}

function doPull(userData) {
  const currentRates = calculateDynamicRates(userData);
  const roll = Math.random() * 100;

  const stoneRoll = Math.random() * 100;
  if (stoneRoll < 10) {

    let stoneType;
    if (stoneRoll < 0.2) {
      stoneType = "UNIVERSAL";
    } else {
      const elements = ["PYRO", "HYDRO", "ELECTRO", "CRYO", "DENDRO", "GEO", "ANEMO"];
      stoneType = elements[Math.floor(Math.random() * elements.length)];
    }

    const fragmentRoll = Math.random() * 100;
    if (fragmentRoll < 90) {

      const fragmentId = createStoneFragment(stoneType);
      return {
        charId: fragmentId,
        isStone: true,
        isFragment: true
      };
    } else {
      const stoneId = createStone(stoneType);
      return {
        charId: stoneId,
        isStone: true,
        isFragment: false
      };
    }
  }
  // Phần còn lại giữ nguyên (pull ra nhân vật)
  let character;
  let rarity;
  if (roll < currentRates.FIVE_STAR) {
    userData.pullsSinceLastFiveStar = 0;
    userData.pullsSinceLastFourStar = 0;

    const premiumRoll = Math.random() * 100;
    if (premiumRoll < 1) {
      character =
        PREMIUM_FIVE_STARS[
          Math.floor(Math.random() * PREMIUM_FIVE_STARS.length)
        ];
    } else {
      const regularPool = CHARACTER_RATINGS.FIVE_STAR.filter(
        (char) => !PREMIUM_FIVE_STARS.includes(char)
      );
      character = regularPool[Math.floor(Math.random() * regularPool.length)];
    }
    rarity = "FIVE_STAR";
  } else if (roll < currentRates.FIVE_STAR + currentRates.FOUR_STAR) {
    userData.pullsSinceLastFourStar = 0;
    userData.pullsSinceLastFiveStar++;
    character = getRandomCharacter("FOUR_STAR");
    rarity = "FOUR_STAR";
  } else {
    userData.pullsSinceLastFourStar++;
    userData.pullsSinceLastFiveStar++;
    character = getRandomCharacter("THREE_STAR");
    rarity = "THREE_STAR";
  }

  const charId = generateCharacterId(character);
  CHARACTER_IDS[charId] = {
    type: "character",
    name: character,
    obtainedAt: Date.now(),
    value: generateCardValue(rarity, character),
  };
  saveCharacterDatabase();
  return { charId, isStone: false };
}
function createBackup() {
  try {
    const backupDir = path.join(__dirname, "./json/backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const date = new Date().toISOString().split("T")[0];
    const backupFilename = `gacha_backup_${date}.json`;
    const charactersBackupFilename = `characters_backup_${date}.json`;

    fs.copyFileSync(GACHA_DATA_FILE, path.join(backupDir, backupFilename));
    fs.copyFileSync(
      CHARACTERS_DB_FILE,
      path.join(backupDir, charactersBackupFilename)
    );

    console.log(`Created backup of gacha data: ${backupFilename}`);
  } catch (error) {
    console.error("Error creating backup:", error);
  }
}

function upgradeCharacter(charId1, charId2, userData, forceType = null) {
  const char1 = CHARACTER_IDS[charId1];
  const char2 = CHARACTER_IDS[charId2];

  if (!char1 || !char2)
    return { success: false, reason: "character_not_found" };
  if (char1.name !== char2.name)
    return { success: false, reason: "different_characters" };

  const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char1.name)
    ? "5"
    : CHARACTER_RATINGS.FOUR_STAR.includes(char1.name)
    ? "4"
    : "3";

  if (rarity === "3") return { success: false, reason: "cannot_upgrade_3star" };

  const currentStar = char1.starLevel || parseInt(rarity);
  const maxStar = currentStar === 5 ? 12 : currentStar === 4 ? 8 : 3;

  // Xác định level hiện tại
  const level1 = char1.level || 1;
  const maxLevel = CHARACTER_LEVELS[rarity].maxLevel;

  // Quyết định nâng cấp theo kiểu nào dựa vào điều kiện
  let upgradeType = forceType;

  if (!upgradeType) {
    // Nếu đã đạt level tối đa, nâng cấp sao
    if (level1 >= maxLevel) {
      upgradeType = "star";
    }
    // Nếu đã đạt sao tối đa, nâng cấp level
    else if (currentStar >= maxStar) {
      upgradeType = "level";
    }
    // Mặc định: nâng cấp level trước
    else {
      upgradeType = "level";
    }
  }

  // Xử lý loại bỏ nhân vật khỏi inventory
  userData.inventory = userData.inventory.filter(
    (id) => id !== charId1 && id !== charId2
  );

  // Thực hiện nâng cấp theo loại đã chọn
  if (upgradeType === "star" && currentStar < maxStar) {
    // Tiến hóa (nâng sao)
    const newCharId = generateCharacterId();
    const newStar = currentStar + 1;

    const baseStats = char1.stats || { atk: 100, def: 100, hp: 500 };
    const bonusMultiplier = 1 + (newStar - 4) * 0.5;

    CHARACTER_IDS[newCharId] = {
      name: char1.name,
      obtainedAt: Date.now(),
      starLevel: newStar,
      level: Math.max(char1.level || 1, char2.level || 1),
      value:
        (char1.value || (currentStar === 5 ? 1000000 : 10000)) *
        2 *
        bonusMultiplier,
      stats: {
        atk: Math.floor(
          ((char1.stats?.atk || 100) + (char2.stats?.atk || 100)) *
            bonusMultiplier
        ),
        def: Math.floor(
          ((char1.stats?.def || 100) + (char2.stats?.def || 100)) *
            bonusMultiplier
        ),
        hp: Math.floor(
          ((char1.stats?.hp || 500) + (char2.stats?.hp || 500)) *
            bonusMultiplier
        ),
      },
    };
    saveCharacterDatabase();
    return {
      success: true,
      type: "evolved",
      charId: newCharId,
      oldStar: currentStar,
      newStar: newStar,
    };
  } else if (upgradeType === "level" && level1 < maxLevel) {

    const newCharId = generateCharacterId();
    const level2 = char2.level || 1;

    const bonusLevel = Math.floor(level2 * 0.3);
    const newLevel = Math.min(maxLevel, level1 + 1 + bonusLevel);

    const statMultiplier = CHARACTER_LEVELS[rarity].baseStats;
    const baseStats = char1.stats || { atk: 100, def: 100, hp: 500 };
    const bonusStats =
      level2 > 1 ? { atk: 50, def: 30, hp: 100 } : { atk: 0, def: 0, hp: 0 };

    const valueFactor =
      rarity === "5" ? 1 + newLevel * 0.8 : 1 + newLevel * 0.5;

    CHARACTER_IDS[newCharId] = {
      name: char1.name,
      obtainedAt: Date.now(),
      starLevel: currentStar,
      level: newLevel,
      value: char1.value * valueFactor,
      stats: {
        atk: Math.floor(
          baseStats.atk * statMultiplier.atk * newLevel + bonusStats.atk
        ),
        def: Math.floor(
          baseStats.def * statMultiplier.def * newLevel + bonusStats.def
        ),
        hp: Math.floor(
          baseStats.hp * statMultiplier.hp * newLevel + bonusStats.hp
        ),
      },
      special: level1 > 5 && level2 > 5 ? true : false,
    };

    return {
      success: true,
      type: "fused",
      charId: newCharId,
      oldLevel: level1,
      newLevel: newLevel,
    };
  } else {
    userData.inventory.push(charId1);
    userData.inventory.push(charId2);

    if (currentStar >= maxStar && level1 >= maxLevel) {
      return { success: false, reason: "max_upgrade_reached" };
    } else if (currentStar >= maxStar) {
      return { success: false, reason: "max_star_reached" };
    } else {
      return { success: false, reason: "max_level_reached" };
    }
  }
}
function getDetailedHelp() {
  return {
    basic: `🎮 HƯỚNG DẪN GENSHIN GACHA 🎮
───────────────
👉 Lệnh cơ bản:
.gacha pull - Mở thẻ nhân vật
.gacha info - Xem tỉ lệ ra nhân vật
.gacha card - Xem chi tiết nhân vật
.gacha inv - Xem nhân vật đang có
.gacha PVP - Thách đấu PVP
.gacha bxh - Xem BXH người chơi
.gacha upgrade <ID1> <ID2> - Nâng cấp nhân vật
.gacha combine <ID1> <ID2> - Kết hợp mảnh đá tiến hóa
💰 Giá mở: ${PULL_COST}$ /lần
⭐ Tỉ lệ: 5★ (${RATES.FIVE_STAR}%) | 4★ (${RATES.FOUR_STAR}%) | 3★ (${RATES.THREE_STAR}%)
🔥 THÔNG TIN HẤP DẪN 🔥
• Nhân vật 5★ hiếm có giá trị lên đến 500 TRIỆU $
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

    upgrade: `🔄 HƯỚNG DẪN TIẾN HÓA NHÂN VẬT
───────────────
1️⃣ Điều kiện:
- Hai nhân vật phải cùng loại và cùng số sao
- Phải có đá tiến hóa phù hợp nguyên tố

2️⃣ Cách tiến hóa:
.gacha evolve <ID1> <ID2> <ID_ĐÁ>
VD: .gacha evolve #1 #2 #3

3️⃣ Đá tiến hóa:
- Mỗi nguyên tố cần đá tương ứng
- Đá vạn năng dùng được cho mọi nhân vật

🎯 Giới hạn sao:
- 4⭐: Tiến hóa lên đến 8★
- 5⭐: Tiến hóa lên đến 12★

❗ Lưu ý: Hai nhân vật và đá sẽ mất sau khi tiến hóa`,
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
  onLoad: function () {
    createBackup();
    
    loadCharacterDatabase();
    
    console.log(`Initially loaded ${Object.keys(CHARACTER_IDS).length} characters`);
    
    gachaData = loadGachaData();
    console.log(`Loaded data for ${Object.keys(gachaData).length} users`);
  
    setInterval(createBackup, 24 * 60 * 60 * 1000);
  },

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

    if (!target[0]) {
      const help = getDetailedHelp();
      return api.sendMessage(
        `${help.basic}\n\n` +
          "💡 Gõ các lệnh sau để xem hướng dẫn chi tiết:\n" +
          ".gacha help trade - Hướng dẫn trao đổi\n" +
          ".gacha help auction - Hướng dẫn đấu giá\n" +
          ".gacha help upgrade - Hướng dẫn nâng cấp",
        threadID,
        messageID
      );
    }

    const cmd = target[0].toLowerCase();
    if (cmd === "help") {
      const type = target[1]?.toLowerCase();
      const help = getDetailedHelp();

      if (type === "trade") {
        return api.sendMessage(help.trading, threadID, messageID);
      } else if (type === "auction") {
        return api.sendMessage(help.auction, threadID, messageID);
      } else if (type === "fusion") {
        return api.sendMessage(help.fusion, threadID, messageID);
      } else if (type === "evolve") {
        return api.sendMessage(help.evolve, threadID, messageID);
      } else {
        return api.sendMessage(help.basic, threadID, messageID);
      }
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
        const lastPull = userData.lastPull || 0;
        const now = Date.now();
        const cooldownLeft = PULL_COOLDOWN * 1000 - (now - lastPull);
        if (cooldownLeft > 0) {
          return api.sendMessage(
            `⏳ Vui lòng đợi ${Math.ceil(cooldownLeft / 1000)} giây nữa!`,
            threadID,
            messageID
          );
        }
    
        if (balance < PULL_COST) {
          return api.sendMessage(
            "❌ Không đủ Tiền!\n" +
              `💰 Giá: ${PULL_COST}\n` +
              `💵 Hiện có: ${balance}`,
            threadID,
            messageID
          );
        }
        const pullResult = doPull(userData);
        const currentRates = calculateDynamicRates(userData);
        await updateBalance(senderID, -PULL_COST);
      
        userData.totalPulls++;
        userData.lastPull = now;
        saveGachaData(gachaData);
      
        if (pullResult.isStone) {
          userData.inventory.push(pullResult.charId);
          saveGachaData(gachaData);
          
          const stone = CHARACTER_IDS[pullResult.charId];
          
          try {
            // Xác định xem đây là đá hay mảnh đá
            const isFragment = pullResult.isFragment || stone.isFragment;
            const stoneImage = await createStoneResultImage({
              userId: senderID,
              userName,
              stone: stone,
              stoneRarity: stone.stoneType === "UNIVERSAL" ? 5 : 4,
              isFragment: isFragment
            });
        
            return api.sendMessage(
              {
                body: `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                      `${stone.emoji} ${stone.name}\n` +
                      `📝 ${stone.description}\n` +
                      `💎 ${isFragment ? 'Mảnh đá' : 'Đá'} tiến hóa nguyên tố ${stone.element}\n` +
                      `${isFragment ? '🧩 Cần 10 mảnh để ghép thành đá hoàn chỉnh\n' : ''}` +
                      `💰 Giá trị: $${stone.value.toLocaleString()}\n\n` +
                      `🔮 ID: #${pullResult.charId.replace(isFragment ? "FRAGMENT_" : "STONE_", "").slice(-4)}\n` +
                      `❓ Dùng .gacha inv để xem các ${isFragment ? 'mảnh đá' : 'đá'} tiến hóa`,
                attachment: fs.createReadStream(stoneImage),
              },
              threadID,
              () => {
                fs.unlinkSync(stoneImage);
              },
              messageID
            );
          } catch (error) {
            console.error("Error displaying stone:", error);
            return api.sendMessage(
              `🎮 KẾT QUẢ GACHA 🎮\n\n` +
              `${stone.emoji} ${stone.name}\n` +
              `📝 ${stone.description}\n` +
              `💎 Đá tiến hóa nguyên tố ${stone.element}\n` +
              `💰 Giá trị: $${stone.value.toLocaleString()}`,
              threadID,
              messageID
            );
          }
        }
        
        // Nếu không phải đá (là nhân vật)
        const charId = pullResult.charId;
        const characterName = CHARACTER_IDS[charId].name;
        const is3Star = CHARACTER_RATINGS.THREE_STAR.includes(characterName);
        
        if (is3Star) {
          await updateBalance(senderID, 200);
        } else {
          console.log(`Đang thêm nhân vật ${characterName} (${charId}) vào inventory của ${senderID}`);
          console.log(`Inventory trước khi thêm: ${userData.inventory.length} items`);
          
          userData.inventory.push(charId);
          
          saveGachaData(gachaData);
          
          console.log(`Đã thêm ${characterName} (${charId}) vào inventory của ${senderID}`);
          console.log(`Inventory sau khi thêm: ${userData.inventory.length} items`);
        }
      
        let rarity = "⭐⭐⭐";
        if (CHARACTER_RATINGS.FIVE_STAR.includes(characterName))
          rarity = "⭐⭐⭐⭐⭐";
        else if (CHARACTER_RATINGS.FOUR_STAR.includes(characterName))
          rarity = "⭐⭐⭐⭐";

        const charInfo =
          CUSTOM_CHARACTER_DATA[CHARACTER_IDS[charId].name] ||
          (await genshin.characters(CHARACTER_IDS[charId].name.toLowerCase()));
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
            isPremium: PREMIUM_FIVE_STARS.includes(CHARACTER_IDS[charId].name),
          },
          rarity: charRarity,
          stats: {
            element: charInfo?.element || "Unknown",
            weapon: charInfo?.weapon || "Unknown",
            quote: charInfo?.quote || "...",
            skills: charInfo?.skills || [],
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
      case "pvp": {
        const pvpAction = target[1]?.toLowerCase();
        
        if (!pvpAction) {
          return api.sendMessage(
            "⚔️ HƯỚNG DẪN PVP ⚔️\n" +
            "───────────────\n\n" +
            "1️⃣ Thiết lập đội hình:\n" +
            ".gacha pvp team #ID1 #ID2 #ID3\n\n" +
            "2️⃣ Thách đấu người chơi:\n" +
            ".gacha pvp challenge @tên\n\n" +
            "3️⃣ Chấp nhận/từ chối:\n" +
            ".gacha pvp accept #ID_THÁCH_ĐẤU\n" +
            ".gacha pvp decline #ID_THÁCH_ĐẤU\n\n" +
            "4️⃣ Xem thống kê PVP:\n" +
            ".gacha pvp stats",
            threadID,
            messageID
          );
        }
        
        switch (pvpAction) {
          case "team": {
            // Xử lý thiết lập đội hình
            if (!target[2]) {
              return api.sendMessage(
                "❌ Bạn phải chọn ít nhất 1 nhân vật cho đội hình PVP!\n" +
                "Cách dùng: .gacha pvp team #ID1 #ID2 #ID3",
                threadID,
                messageID
              );
            }
            
            // Thu thập ID nhân vật
            const teamIds = [];
            for (let i = 2; i < Math.min(5, target.length); i++) {
              const inputId = target[i].replace(/[^\d]/g, "");
              
              let foundCharId = null;
              for (const charId of userData.inventory) {
                if (charId.startsWith("CHAR_") && (charId.endsWith(inputId) || charId.includes(inputId))) {
                  foundCharId = charId;
                  break;
                }
              }
              
              if (!foundCharId) {
                return api.sendMessage(
                  `❌ Không tìm thấy nhân vật với ID #${inputId}!`,
                  threadID,
                  messageID
                );
              }
              
              teamIds.push(foundCharId);
            }
            
            // Lưu đội hình PVP
            if (!userData.pvpTeam) {
              userData.pvpTeam = [];
            }
            
            userData.pvpTeam = teamIds;
            saveGachaData(gachaData);
            
            // Hiển thị thông tin đội hình
            const teamPower = calculateTeamPower(teamIds);
            const teamInfo = await formatTeamInfo(teamIds);
            
            return api.sendMessage(
              "✅ THIẾT LẬP ĐỘI HÌNH PVP THÀNH CÔNG!\n\n" +
              "👥 Đội hình của bạn:\n" +
              teamInfo + "\n" +
              `💪 Tổng sức mạnh: ${teamPower.toLocaleString()}\n\n` +
              "Sử dụng '.gacha pvp challenge @tên' để thách đấu!",
              threadID,
              messageID
            );
          }
          
          case "challenge": {
            // Kiểm tra đội hình
            if (!userData.pvpTeam || userData.pvpTeam.length === 0) {
              return api.sendMessage(
                "❌ Bạn chưa thiết lập đội hình PVP!\n" +
                "Hãy dùng lệnh '.gacha pvp team' trước.",
                threadID,
                messageID
              );
            }
            
            // Kiểm tra cooldown
            if (userData.pvpStats?.lastBattle) {
              const cooldownLeft = PVP_COOLDOWN - (Date.now() - userData.pvpStats.lastBattle);
              if (cooldownLeft > 0) {
                return api.sendMessage(
                  `⏳ Vui lòng đợi ${Math.ceil(cooldownLeft / 1000)} giây nữa để thách đấu tiếp!`,
                  threadID,
                  messageID
                );
              }
            }
            
            // Kiểm tra người được tag
            const mention = Object.keys(event.mentions)[0];
            if (!mention) {
              return api.sendMessage(
                "❌ Bạn phải tag người muốn thách đấu!\n" +
                "Cách dùng: .gacha pvp challenge @tên",
                threadID,
                messageID
              );
            }
            
            // Kiểm tra không thể tự thách đấu chính mình
            if (mention === senderID) {
              return api.sendMessage(
                "❌ Bạn không thể thách đấu chính mình!",
                threadID,
                messageID
              );
            }
            
            // Tạo thách đấu
            const challengeId = createPvpChallenge(senderID, mention, userData.pvpTeam);
            
            const mentionName = event.mentions[mention].replace('@', '');
            
            return api.sendMessage(
              `⚔️ THÁCH ĐẤU PVP ⚔️\n\n` +
              `👤 ${userName} đã thách đấu ${mentionName}!\n` +
              `💪 Sức mạnh đội hình: ${calculateTeamPower(userData.pvpTeam)}\n\n` +
              `⏰ Thời hạn chấp nhận: 5 phút\n` +
              `🔖 ID thách đấu: ${challengeId.slice(-8)}\n\n` +
              `Để chấp nhận, hãy thiết lập đội hình và gõ:\n` +
              `.gacha pvp accept ${challengeId.slice(-8)}`,
              threadID,
              messageID
            );
          }
          
          case "accept": {
            // Kiểm tra ID thách đấu
            if (!target[2]) {
              return api.sendMessage(
                "❌ Bạn phải cung cấp ID thách đấu!\n" +
                "Cách dùng: .gacha pvp accept ID_THÁCH_ĐẤU",
                threadID,
                messageID
              );
            }
            
            // Tìm thách đấu
            const challengeId = [...activePvpChallenges.keys()].find(id => id.endsWith(target[2]));
            if (!challengeId) {
              return api.sendMessage(
                "❌ Không tìm thấy thách đấu với ID này hoặc thách đấu đã hết hạn!",
                threadID,
                messageID
              );
            }
            
            const challengeData = activePvpChallenges.get(challengeId);
            
            // Kiểm tra xem người chấp nhận có phải là người được thách đấu
            if (challengeData.target !== senderID) {
              return api.sendMessage(
                "❌ Bạn không phải là người được thách đấu!",
                threadID,
                messageID
              );
            }
            
            // Kiểm tra thời hạn
            if (challengeData.expiry < Date.now()) {
              activePvpChallenges.delete(challengeId);
              return api.sendMessage(
                "❌ Thách đấu đã hết hạn!",
                threadID,
                messageID
              );
            }
            
            // Kiểm tra đội hình người chấp nhận
            if (!userData.pvpTeam || userData.pvpTeam.length === 0) {
              return api.sendMessage(
                "❌ Bạn chưa thiết lập đội hình PVP!\n" +
                "Hãy dùng lệnh '.gacha pvp team' trước khi chấp nhận thách đấu.",
                threadID,
                messageID
              );
            }
            
            // Bắt đầu trận đấu
            api.sendMessage(
              "⚔️ TRẬN ĐẤU PVP BẮT ĐẦU! ⚔️\n" +
              "Đang tính toán kết quả...",
              threadID,
              messageID
            );
            
            // Xóa thách đấu
            activePvpChallenges.delete(challengeId);
            
            // Tiến hành trận đấu và hiển thị kết quả
            return executePvpBattle(api, threadID, messageID, challengeData, userData.pvpTeam);
          }
          
          case "decline": {
            // Kiểm tra ID thách đấu
            if (!target[2]) {
              return api.sendMessage(
                "❌ Bạn phải cung cấp ID thách đấu!\n" +
                "Cách dùng: .gacha pvp decline ID_THÁCH_ĐẤU",
                threadID,
                messageID
              );
            }
            
            // Tìm thách đấu
            const challengeId = [...activePvpChallenges.keys()].find(id => id.endsWith(target[2]));
            if (!challengeId) {
              return api.sendMessage(
                "❌ Không tìm thấy thách đấu với ID này hoặc thách đấu đã hết hạn!",
                threadID,
                messageID
              );
            }
            
            const challengeData = activePvpChallenges.get(challengeId);
            
            // Kiểm tra xem người từ chối có phải là người được thách đấu
            if (challengeData.target !== senderID) {
              return api.sendMessage(
                "❌ Bạn không phải là người được thách đấu!",
                threadID,
                messageID
              );
            }
            
            // Xóa thách đấu
            activePvpChallenges.delete(challengeId);
            
            return api.sendMessage(
              "🚫 Bạn đã từ chối thách đấu PVP!",
              threadID,
              messageID
            );
          }
          
          case "stats": {
            // Hiển thị thống kê PVP
            if (!userData.pvpStats) {
              return api.sendMessage(
                "📊 THỐNG KÊ PVP 📊\n\n" +
                "Bạn chưa tham gia trận đấu PVP nào!",
                threadID,
                messageID
              );
            }
            
            const wins = userData.pvpStats.wins || 0;
            const losses = userData.pvpStats.losses || 0;
            const total = wins + losses;
            const winRate = total > 0 ? (wins / total * 100).toFixed(1) : 0;
            
            // Tính hạng PVP
            let pvpRank = "Tân binh";
            if (wins >= 100) pvpRank = "Huyền thoại";
            else if (wins >= 50) pvpRank = "Bậc thầy";
            else if (wins >= 20) pvpRank = "Chuyên gia";
            else if (wins >= 10) pvpRank = "Chiến binh";
            else if (wins >= 5) pvpRank = "Kinh nghiệm";
            
            // Tính sức mạnh đội hình
            const teamPower = userData.pvpTeam ? calculateTeamPower(userData.pvpTeam) : 0;
            
            return api.sendMessage(
              "📊 THỐNG KÊ PVP 📊\n" +
              "───────────────\n\n" +
              `👤 ${userName}\n` +
              `🏆 Hạng: ${pvpRank}\n` +
              `💪 Sức mạnh đội hình: ${teamPower.toLocaleString()}\n\n` +
              `✅ Thắng: ${wins} trận\n` +
              `❌ Thua: ${losses} trận\n` +
              `📈 Tỉ lệ thắng: ${winRate}%\n\n` +
              `💡 Sử dụng '.gacha pvp team' để thiết lập đội hình mạnh hơn!`,
              threadID,
              messageID
            );
          }
          
          default: {
            return api.sendMessage(
              "❌ Lệnh PVP không hợp lệ!\n" +
              "Sử dụng '.gacha pvp' để xem hướng dẫn.",
              threadID,
              messageID
            );
          }
        }
      }
      case "bag":
      case "inventory": {
        verifyInventory(senderID);
        if (
          target[1]?.toLowerCase() === "del" ||
          target[1]?.toLowerCase() === "delete"
        ) {
          if (!target[2]) {
            return api.sendMessage(
              "❌ Thiếu ID vật phẩm!\n\n" +
                "Cách dùng: .gacha inv del #ID\n" +
                "VD: .gacha inv del #1234\n\n" +
                "⚠️ Lưu ý: Bạn sẽ nhận lại 30% giá trị vật phẩm",
              threadID,
              messageID
            );
          }

          const inputId = target[2].replace(/[^\d]/g, "");

          let foundItemId = null;
          for (const itemId of userData.inventory) {
            if (itemId.endsWith(inputId) || itemId.includes(inputId)) {
              foundItemId = itemId;
              break;
            }
          }

          if (!foundItemId) {
            return api.sendMessage(
              `❌ Không tìm thấy vật phẩm với ID #${inputId}!`,
              threadID,
              messageID
            );
          }

          const item = CHARACTER_IDS[foundItemId];
          if (!item) {
            return api.sendMessage(
              "❌ Không tìm thấy thông tin vật phẩm!",
              threadID,
              messageID
            );
          }

          const isStone = foundItemId.startsWith("STONE_");

          let itemName, itemType, itemRarity;

          if (isStone) {
            itemName = item.name;
            itemType = "Đá tiến hóa";
            itemRarity = "4★";
            if (item.stoneType === "UNIVERSAL") itemRarity = "5★";
          } else {
            itemName = item.name;
            itemType = "Nhân vật";
            itemRarity = CHARACTER_RATINGS.FIVE_STAR.includes(item.name)
              ? "5★"
              : CHARACTER_RATINGS.FOUR_STAR.includes(item.name)
              ? "4★"
              : "3★";
          }

          const refundAmount = Math.floor((item.value || 0) * 0.3);

          userData.inventory = userData.inventory.filter(
            (id) => id !== foundItemId
          );

          await updateBalance(senderID, refundAmount);

          saveGachaData(gachaData);

          return api.sendMessage(
            "🗑️ ĐÃ XÓA VẬT PHẨM THÀNH CÔNG!\n" +
              `${itemType}: ${itemName} (${itemRarity})\n` +
              `ID: #${inputId}\n` +
              `💰 Nhận lại: $${refundAmount.toLocaleString()} (30% giá trị)\n\n` +
              `Số vật phẩm còn lại: ${userData.inventory.length}`,
            threadID,
            messageID
          );
        }

        const characters = [];
        const stones = [];
        const fragments = [];
        let totalValue = 0;
        
        // Sort inventory items into respective arrays with detailed info
        userData.inventory.forEach((id) => {
          const item = CHARACTER_IDS[id];
          if (!item) return;
          
          totalValue += item.value || 0;
          
          if (id.startsWith("CHAR_")) {
            // For character items
            const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(item.name)
              ? 5
              : CHARACTER_RATINGS.FOUR_STAR.includes(item.name)
                ? 4
                : 3;
            
            const charInfo = CUSTOM_CHARACTER_DATA[item.name] || {};
            
            characters.push({
              type: "character",
              name: item.name,
              id: id.slice(-4),
              rarity,
              value: item.value || 0,
              level: item.level || 1,
              starLevel: item.starLevel || rarity,
              element: charInfo.element || "Unknown",
              emoji: "👤",
              isPremium: PREMIUM_FIVE_STARS.includes(item.name)
            });
          } else if (id.startsWith("STONE_")) {
            // For stone items
            stones.push({
              type: "stone",
              name: item.name,
              id: id.slice(-4),
              element: item.element,
              emoji: item.emoji,
              value: item.value || 0,
              stoneType: item.stoneType
            });
          } else if (id.startsWith("FRAGMENT_")) {
            // For fragment items
            fragments.push({
              type: "fragment",
              name: item.name,
              id: id.slice(-4),
              element: item.element,
              emoji: item.emoji,
              value: item.value || 0,
              isFragment: true,
              stoneType: item.stoneType
            });
          }
        });
        
        // Count characters by rarity
        const characterCounts = {
          5: characters.filter(c => c.rarity === 5).length,
          4: characters.filter(c => c.rarity === 4).length,
          3: characters.filter(c => c.rarity === 3).length
        };
        
        const { createInventoryImage } = require("../canvas/gachaCanvas");
        
        const imagePath = await createInventoryImage({
          userId: senderID,
          userName,
          totalValue,
          characters,
          stones,
          fragments,
          characterCounts,
          totalItems: userData.inventory.length
        });
        
        return api.sendMessage(
          {
            body: `📦 KHO ĐỒ GENSHIN IMPACT 📦\n👤 ${userName}\n💰 Tổng giá trị: $${totalValue.toLocaleString()}\n🧩 Tổng vật phẩm: ${userData.inventory.length}`,
            attachment: fs.createReadStream(imagePath)
          },
          threadID,
          () => fs.unlinkSync(imagePath),
          messageID
        );
      } 
      
function calculateInventoryValue(inventory) {
  return inventory.reduce((total, itemId) => {
    const item = CHARACTER_IDS[itemId];
    if (!item) return total;
    return total + (item.value || 0);
  }, 0);
}

case "combine": {
  if (!target[1]) {
    return api.sendMessage(
      "❌ Thiếu thông tin mảnh đá!\n\n" +
      "Cách dùng: .gacha combine #ID1 #ID2 ... #ID10\n" +
      "VD: .gacha combine #1234 #5678 ... (tổng 10 ID)\n\n" +
      "⚠️ Lưu ý:\n" +
      "- Cần 10 mảnh đá cùng loại để ghép\n" +
      "- Các mảnh đá sẽ bị mất sau khi ghép",
      threadID,
      messageID
    );
  }

  // Thu thập ID mảnh đá
  const fragmentIds = [];
  for (let i = 1; i < target.length; i++) {
    const inputId = target[i].replace(/[^\d]/g, "");
    
    let foundFragmentId = null;
    for (const fragId of userData.inventory) {
      if (fragId.startsWith("FRAGMENT_") && (fragId.endsWith(inputId) || fragId.includes(inputId))) {
        foundFragmentId = fragId;
        break;
      }
    }
    
    if (foundFragmentId) {
      fragmentIds.push(foundFragmentId);
    }
  }

  if (fragmentIds.length < 10) {
    return api.sendMessage(
      `❌ Không đủ mảnh đá để ghép (cần 10, đang có ${fragmentIds.length})!`,
      threadID,
      messageID
    );
  }

  // Kiểm tra xem tất cả các mảnh đá đều cùng loại
  const firstFragment = CHARACTER_IDS[fragmentIds[0]];
  if (!firstFragment || !firstFragment.isFragment) {
    return api.sendMessage(
      "❌ ID không hợp lệ hoặc không phải mảnh đá!",
      threadID,
      messageID
    );
  }

  const stoneType = firstFragment.stoneType;
  const sameType = fragmentIds.every(id => {
    const fragment = CHARACTER_IDS[id];
    return fragment && fragment.isFragment && fragment.stoneType === stoneType;
  });

  if (!sameType) {
    return api.sendMessage(
      "❌ Tất cả mảnh đá phải cùng loại để ghép!",
      threadID,
      messageID
    );
  }

  // Xóa 10 mảnh đá từ inventory
  userData.inventory = userData.inventory.filter(id => !fragmentIds.includes(id));

  // Tạo đá hoàn chỉnh
  const stoneId = createStone(stoneType);
  userData.inventory.push(stoneId);

  // Lưu thay đổi
  saveGachaData(gachaData);

  const stone = CHARACTER_IDS[stoneId];
  return api.sendMessage(
    "✅ GHÉP MẢNH ĐÁ THÀNH CÔNG!\n\n" +
    `${stone.emoji} ${stone.name}\n` +
    `📝 ${stone.description}\n` +
    `💎 Đá tiến hóa nguyên tố ${stone.element}\n` +
    `💰 Giá trị: $${stone.value.toLocaleString()}\n\n` +
    `🧩 Đã sử dụng: 10 mảnh đá ${ELEMENTAL_FRAGMENTS[stoneType].name}`,
    threadID,
    messageID
  );
}
      case "card":
      case "view": {
        if (!target[1]) {
          return api.sendMessage(
            "❌ Thiếu ID nhân vật!\n\n" +
              "Cách dùng: .gacha card #ID\n" +
              "VD: .gacha card #1234",
            threadID,
            messageID
          );
        }

        const inputId = target[1].replace(/[^\d]/g, "");

        let foundCharId = null;
        for (const charId of userData.inventory) {
          if (charId.endsWith(inputId) || charId.includes(inputId)) {
            foundCharId = charId;
            break;
          }
        }

        if (!foundCharId) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${inputId}!`,
            threadID,
            messageID
          );
        }

        const char = CHARACTER_IDS[foundCharId];
        if (!char) {
          return api.sendMessage(
            "❌ Không tìm thấy thông tin nhân vật!",
            threadID,
            messageID
          );
        }

        const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
          ? "5"
          : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
          ? "4"
          : "3";

        const charInfo =
          CUSTOM_CHARACTER_DATA[char.name] ||
          (await genshin.characters(char.name.toLowerCase()).catch(() => null));

        const imagePath = await getCharacterImage(char.name);

        const cardImage = await createPullResultImage({
          userId: senderID,
          userName: userName,
          character: {
            name: char.name,
            image: imagePath,
            id: foundCharId,
            isPremium: PREMIUM_FIVE_STARS.includes(char.name),
          },
          rarity: rarity,
          stats: {
            element: charInfo?.element || "Unknown",
            weapon: charInfo?.weapon || "Unknown",
            quote: charInfo?.quote || "...",
            skills: charInfo?.skills || [],
          },
          cardValue: char.value,
          level: char.level || 1,
          starLevel: char.starLevel || parseInt(rarity),
          attributes: char.stats || {
            atk:
              char.stats?.atk ||
              (rarity === "5" ? 500 : rarity === "4" ? 300 : 100),
            def:
              char.stats?.def ||
              (rarity === "5" ? 500 : rarity === "4" ? 300 : 100),
            hp:
              char.stats?.hp ||
              (rarity === "5" ? 2000 : rarity === "4" ? 1000 : 500),
          },
        });

        return api.sendMessage(
          {
            body:
              `📊 THÔNG TIN NHÂN VẬT 📊\n\n` +
              `👤 ${char.name} (ID: ${target[1]})\n` +
              `⭐ Độ hiếm: ${char.starLevel || rarity}★\n` +
              `📈 Cấp độ: ${char.level || 1}\n` +
              (char.special ? "✨ Đặc biệt: Có\n" : "") +
              `💰 Giá trị: $${char.value?.toLocaleString()}`,
            attachment: fs.createReadStream(cardImage),
          },
          threadID,
          () => {
            fs.unlinkSync(cardImage);
            if (imagePath) fs.unlinkSync(imagePath);
          },
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
      case "upgrade":
      case "up": {
        if (!target[1] || !target[2] || !target[3]) {
          return api.sendMessage(
            "❌ Thiếu thông tin nhân vật hoặc đá tiến hóa!\n\n" +
              "Cách dùng: .gacha evolve #ID1 #ID2 #ID_DA\n" +
              "VD: .gacha evolve #1234 #5678 #9012\n\n" +
              "⚠️ Lưu ý:\n" +
              "- Hai nhân vật phải cùng loại và cùng số sao\n" +
              "- Đá tiến hóa phải phù hợp với nguyên tố nhân vật\n" +
              "- Nhân vật 4★: Max 8 sao\n" +
              "- Nhân vật 5★: Max 12 sao\n" +
              "- Hai nhân vật và đá sẽ bị mất sau khi tiến hóa",
            threadID,
            messageID
          );
        }

        const inputId1 = target[1].replace(/[^\d]/g, "");
        let foundCharId1 = null;
        for (const charId of userData.inventory) {
          if (
            charId.startsWith("CHAR_") &&
            (charId.endsWith(inputId1) || charId.includes(inputId1))
          ) {
            foundCharId1 = charId;
            break;
          }
        }

        const inputId2 = target[2].replace(/[^\d]/g, "");
        let foundCharId2 = null;
        for (const charId of userData.inventory) {
          if (
            charId.startsWith("CHAR_") &&
            (charId.endsWith(inputId2) || charId.includes(inputId2))
          ) {
            foundCharId2 = charId;
            break;
          }
        }

        const stoneInputId = target[3].replace(/[^\d]/g, "");
        let foundStoneId = null;
        for (const id of userData.inventory) {
          if (
            id.startsWith("STONE_") &&
            (id.endsWith(stoneInputId) || id.includes(stoneInputId))
          ) {
            foundStoneId = id;
            break;
          }
        }

        if (!foundCharId1) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${inputId1}!`,
            threadID,
            messageID
          );
        }
        if (!foundCharId2) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${inputId2}!`,
            threadID,
            messageID
          );
        }
        if (!foundStoneId) {
          return api.sendMessage(
            `❌ Không tìm thấy đá tiến hóa với ID #${stoneInputId}!`,
            threadID,
            messageID
          );
        }

        const char1 = CHARACTER_IDS[foundCharId1];
        const char2 = CHARACTER_IDS[foundCharId2];
        const stone = CHARACTER_IDS[foundStoneId];

        if (!char1 || !char2 || !stone) {
          return api.sendMessage(
            "❌ Không tìm thấy thông tin nhân vật hoặc đá!",
            threadID,
            messageID
          );
        }

        if (char1.name !== char2.name) {
          return api.sendMessage(
            "❌ Hai nhân vật phải cùng loại!",
            threadID,
            messageID
          );
        }

        const star1 =
          char1.starLevel ||
          (CHARACTER_RATINGS.FIVE_STAR.includes(char1.name) ? 5 : 4);
        const star2 =
          char2.starLevel ||
          (CHARACTER_RATINGS.FIVE_STAR.includes(char2.name) ? 5 : 4);

        if (star1 !== star2) {
          return api.sendMessage(
            "❌ Hai nhân vật phải cùng số sao để tiến hóa!",
            threadID,
            messageID
          );
        }

        const charInfo = CUSTOM_CHARACTER_DATA[char1.name];
        const charElement = charInfo?.element?.toUpperCase() || "UNKNOWN";

        const stoneElement = stone.stoneType;
        if (stoneElement !== "UNIVERSAL" && stoneElement !== charElement) {
          return api.sendMessage(
            `❌ Đá tiến hóa ${stone.name} không phù hợp với nhân vật ${charElement}!\n` +
              `Nhân vật ${char1.name} cần đá ${
                ELEMENTAL_STONES[charElement]?.name || "phù hợp"
              } hoặc Brilliant Diamond`,
            threadID,
            messageID
          );
        }

        const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char1.name) ? 5 : 4;
        const maxStar = rarity === 5 ? 12 : 8;

        if (star1 >= maxStar) {
          return api.sendMessage(
            "❌ Nhân vật đã đạt cấp sao tối đa!",
            threadID,
            messageID
          );
        }

        // Tạo nhân vật mới đã tiến hóa
        const newCharId = generateCharacterId();
        const newStar = star1 + 1;

        const baseStats = char1.stats || { atk: 100, def: 100, hp: 500 };
        const bonusMultiplier = 1 + (newStar - rarity) * 0.5;

        CHARACTER_IDS[newCharId] = {
          type: "character",
          name: char1.name,
          obtainedAt: Date.now(),
          starLevel: newStar,
          level: Math.max(char1.level || 1, char2.level || 1),
          value:
            (char1.value || (rarity === 5 ? 1000000 : 10000)) *
            2 *
            bonusMultiplier,
          stats: {
            atk: Math.floor(
              ((char1.stats?.atk || 100) + (char2.stats?.atk || 100)) *
                bonusMultiplier
            ),
            def: Math.floor(
              ((char1.stats?.def || 100) + (char2.stats?.def || 100)) *
                bonusMultiplier
            ),
            hp: Math.floor(
              ((char1.stats?.hp || 500) + (char2.stats?.hp || 500)) *
                bonusMultiplier
            ),
          },
        };

        // Xóa nhân vật cũ và đá khỏi inventory
        userData.inventory = userData.inventory.filter(
          (id) =>
            id !== foundCharId1 && id !== foundCharId2 && id !== foundStoneId
        );

        // Thêm nhân vật mới
        userData.inventory.push(newCharId);

        // Lưu thay đổi
        saveCharacterDatabase();
        saveGachaData(gachaData);

        return api.sendMessage(
          "🌟 TIẾN HÓA THÀNH CÔNG! 🌟\n" +
            `Nhân vật: ${char1.name}\n` +
            `⭐ Sao: ${star1}★ → ${newStar}★\n` +
            `💪 ATK: ${CHARACTER_IDS[newCharId].stats.atk}\n` +
            `🛡️ DEF: ${CHARACTER_IDS[newCharId].stats.def}\n` +
            `❤️ HP: ${CHARACTER_IDS[newCharId].stats.hp}\n` +
            `💰 Giá trị: $${CHARACTER_IDS[
              newCharId
            ].value.toLocaleString()}\n\n` +
            `${stone.emoji} Đã sử dụng: 1 ${stone.name}`,
          threadID,
          messageID
        );
      }
      case "restore": {
        if (senderID !== "61573427362389") { 
          return api.sendMessage("❌ Chỉ admin mới có thể sử dụng lệnh này!", threadID, messageID);
        }
        
        const date = target[1]; 
        const success = restoreFromBackup(date);
        
        if (success) {
          return api.sendMessage(
            "✅ Đã phục hồi dữ liệu từ bản backup thành công!" +
            (date ? `\nNgày: ${date}` : "\nPhiên bản: Mới nhất"), 
            threadID, messageID
          );
        } else {
          return api.sendMessage(
            "❌ Không thể phục hồi dữ liệu từ backup!" +
            "\nKiểm tra lại tên file hoặc thử phục hồi phiên bản khác.",
            threadID, messageID
          );
        }
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
    }
  },
};
