const genshin = require("genshin");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getBalance, updateBalance } = require("../utils/currencies");
const {
  createPullResultImage,
  createStoneResultImage,
  createInventoryImage,
  createExpItemResultImage,
  createPvPBattleImage,
  createStellaResultImage,
} = require("../canvas/gachaCanvas");
const MAX_BACKUPS = 14;

const GACHA_DATA_FILE = path.join(__dirname, "./json/gacha/gacha.json");
const PULL_COST = 1000;
const AUCTION_DURATION = 3600000;
const PULL_COOLDOWN = 45;

const ADMIN_IDS = ['61573427362389' ];

let gachaData = {};

const activePvpChallenges = new Map();
const PVP_CHALLENGE_DURATION = 300000;
const PVP_COOLDOWN = 60000;
const PVP_REWARD_WIN = 2000;
const PVP_REWARD_LOSE = 500;

const CHARACTERS_DB_FILE = path.join(
  __dirname,
  "./json/gacha/characters_db.json"
);
const STELLA_PITY_THRESHOLD = 3; 
const STELLA_PITY_BOOST_PER_FAIL = 20;

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
  yanfei: "https://imgur.com/3UE1s1o.png",
  sayu: "https://imgur.com/sThH2Zu.png",
  dori: "https://imgur.com/JEmUtJP.png",
  candace: "https://imgur.com/xEzeWbs.png",
  layla: "https://imgur.com/bG3ksud.png",
  collei: "https://imgur.com/m7TsSPK.png",
  Diona: "https://imgur.com/iPKtes1.png",
  dehya: "https://imgur.com/7tTNdEd.png",
  Ganyu: "https://imgur.com/UNUpMCd.png",
  kaveh: "https://imgur.com/9rragrx.png",
  Eula: "https://imgur.com/MUErJTP.png",
  Shenhe: "https://imgur.com/Hxr7cpc.png",
  Mona: "https://imgur.com/MDdsSaV.png",
  Cyno: "https://imgur.com/mLPFGAL.png",
  albedo: "https://imgur.com/wuLApI0.png",
  "Kamisato Ayato": "https://imgur.com/1XwiqGK.png",
  Baizhu: "https://imgur.com/X7HueP1.png",
  Wanderer: "https://imgur.com/jHyK6Zb.png",
  Arlecchino: "https://imgur.com/vSlnUml.png",
  charlotte: "https://imgur.com/Y3VcZCq.png",
  Lynette: "https://imgur.com/3aiZ7ch.png",
  Yaoyao: "https://imgur.com/EF0dP8U.png",
  Xianyun: "https://imgur.com/OCvTmvN.png",
  Heizou: "https://imgur.com/CZ47DQG.png",
  Chiori: "https://imgur.com/8xQBZkl.png",
  kaveh: "https://imgur.com/SLGq7RV.png",
  Sigewinne: "https://imgur.com/6pgv5wb.png",
  Xiao: "https://imgur.com/RLWJINH.png",
  Keqing: "https://imgur.com/KKzZQjn.png",
  Klee: "https://imgur.com/wfF8iua.png",
  Venti: "https://imgur.com/JFL5BdG.png",
  Qiqi: "https://imgur.com/OSYwmfQ.png",
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
    quote: "A hundred years have passed... yet there’s still work to be done.",
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
    quote: "You should really bring the right medicine for the rainforest.",
  },
  Hutao: {
    weapon: "Polearm",
    element: "Pyro",
    skills: ["Guide to Afterlife", "Spirit Soother"],
    quote: "Hey, don't sleep on me!",
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
  Mona: {
    weapon: "Catalyst",
    element: "Hydro",
    skills: ["Mirror Reflection of Doom", "Stellaris Phantasm"],
    quote: "Fate is upon you!",
  },
  "Kamisato Ayato": {
    weapon: "Sword",
    element: "Hydro",
    skills: ["Kamisato Art: Kyouka", "Kamisato Art: Suiyuu"],
    quote:
      "A blade is like a tea leaf... only those who sample it may appreciate its true flavor.",
  },
  Baizhu: {
    weapon: "Catalyst",
    element: "Dendro",
    skills: ["Universal Diagnosis", "Holistic Revivification"],
    quote: "Let me ease your pain.",
  },
  Wanderer: {
    weapon: "Catalyst",
    element: "Anemo",
    skills: ["Hanega: Song of the Wind", "Kyougen: Five Ceremonial Plays"],
    quote: "The world holds its breath... waiting for my command.",
  },
  Arlecchino: {
    weapon: "Polearm", // Giả định (chưa công bố chính thức)
    element: "Pyro",
    skills: ["Harlequinade", "Fire Dance"],
    quote: "Loyalty is but a means to an end.",
  },
  Lynette: {
    weapon: "Sword",
    element: "Anemo",
    skills: ["Enigmatic Feint", "Magic Trick: Astonishing Shift"],
    quote: "No need to make a fuss.",
  },
  Yaoyao: {
    weapon: "Polearm",
    element: "Dendro",
    skills: ["Raphanus Sky Cluster", "Moonjade Descent"],
    quote: "Come on, let's go play!",
  },
  Xianyun: {
    weapon: "Catalyst",
    element: "Anemo",
    skills: ["Dawn Trail", "Stars Gather at Dusk"], // Đúng
    quote: "The path of cultivation is long. Let us go forth together.", // Câu thoại đúng
  },
  Heizou: {
    weapon: "Catalyst",
    element: "Anemo",
    skills: ["Heartstopper Strike", "Windmuster Kick"], // Đúng
    quote: "A detective's intuition is rarely wrong.",
  },
  Chiori: {
    weapon: "Sword", // Sai → Chỉnh lại thành "Sword" (Chiori dùng Kiếm)
    element: "Geo", // Sai → Chỉnh lại thành "Geo"
    skills: ["Draped in Dusk", "Inticolored Wave"], // Sai → Đã sửa thành kỹ năng đúng
    quote: "Precision is the soul of elegance.", // Câu thoại chính xác
  },
  Kaveh: {
    weapon: "Claymore", // Sai → Chỉnh lại thành "Claymore" (Kaveh dùng Trọng Kiếm)
    element: "Dendro", // Sai → Chỉnh lại thành "Dendro"
    skills: ["Artistic Ingenuity", "Painted Dome"], // Sai → Đã sửa thành kỹ năng đúng
    quote: "True beauty lies in the details.", // Câu thoại chính xác
  },
  Sigewinne: {
    weapon: "Catalyst", // Sai → Chỉnh lại thành "Catalyst" (Sigewinne dùng Pháp Khí)
    element: "Hydro",
    skills: ["Still Waters", "Vitality Flux"], // Sai → Đã sửa thành kỹ năng đúng
    quote: "Let's get you patched up!", // Câu thoại chính xác
  },
  Qiqi: {
    weapon: "Sword",
    element: "Cryo",
    skills: [
      "Adeptus Art: Herald of Frost",
      "Adeptus Art: Preserver of Fortune",
    ],
    quote: "I am Qiqi. I am a zombie. And I forgot what comes next.",
  },
  Klee: {
    weapon: "Catalyst",
    element: "Pyro",
    skills: ["Jumpy Dumpty", "Sparks 'n' Splash"],
    quote: "Yay! Let's go fish blasting!",
  },
  Venti: {
    weapon: "Bow",
    element: "Anemo",
    skills: ["Skyward Sonnet", "Wind's Grand Ode"],
    quote: "The wind... it's so nice.",
  },
  Cyno: {
    weapon: "Polearm",
    element: "Electro",
    skills: ["Secret Rite: Chasmic Soulfarer", "Sacred Rite: Wolf’s Swiftness"], // Sửa lại đúng kỹ năng
    quote: "You shall face judgment.", // Sửa lại đúng câu thoại
  },
  kaveh: {
    weapon: "Claymore",
    element: "Dendro",
    skills: ["Artistic Ingenuity", "Painted Dome"],
    quote: "True beauty lies in the details.",
  },
  collei: {
    weapon: "Bow",
    element: "Dendro",
    skills: ["Ocean's Embrace", "Tidal Surge"],
    quote: "The ocean is vast and unpredictable.",
  },
  sayu: {
    weapon: "Claymore",
    element: "Anemo",
    skills: ["Yoohoo Art: Mujina Flurry", "Yoohoo Art: Silencer"],
    quote: "I'm Sayu, the Shuumatsuban ninja.",
  },
  dehya: {
    weapon: "Claymore",
    element: "Pyro",
    skills: ["Frostflake Arrow", "Snowstorm's Embrace"],
    quote: "The cold is my ally.",
  },
  candace: {
    weapon: "Bow",
    element: "Hydro",
    skills: ["Tidal Wave", "Riptide"],
    quote: "The ocean is my home.",
  },
  layla: {
    weapon: "Sword",
    element: "Sword",
    skills: ["Flamestrike", "Inferno"],
    quote: "The flames will guide us.",
  },
  dori: {
    weapon: "Catalyst",
    element: "Electro",
    skills: ["Thunderstrike", "Lightning Storm"],
    quote: "The storm is coming.",
  },
  albedo: {
    weapon: "Sword",
    element: "Geo",
    skills: [
      "Abiogenesis: Solar Isotoma",
      "Rite of Progeniture: Tectonic Tide",
    ],
    quote: "The future is ours to shape.",
  },
  charlotte: {
    weapon: "Sword",
    element: "Hydro",
    skills: ["Tidal Wave", "Riptide"],
    quote: "The ocean is my home.",
  },
  Eula: {
    weapon: "Claymore",
    element: "Cryo",
    skills: ["Icetide Vortex", "Glacial Illumination"],
    quote: "The cold will not forgive.",
  },
  yanfei: {
    weapon: "Catalyst",
    element: "Pyro",
    skills: ["Signed Edict", "Done Deal"],
    quote: "The law is absolute.",
  },
  Ganyu: {
    weapon: "Bow",
    element: "Cryo",
    skills: ["Trail of the Qilin", "Celestial Shower"],
    quote: "The frost will not forgive.",
  },
  Xiao: {
    weapon: "Polearm",
    element: "Anemo",
    skills: ["Lemniscatic Wind Cycling", "Bane of All Evil"],
    quote: "The wind is my ally.",
  },
  Keqing: {
    weapon: "Sword",
    element: "Electro",
    skills: ["Stellar Restoration", "Starward Sword"],
    quote: "The stars guide us.",
  },
  Shenhe: {
    weapon: "Polearm",
    element: "Cryo",
    skills: ["Spring Spirit Summoning", "Divine Maiden's Deliverance"],
    quote: "The cold is my ally.",
  },
  Diluc: {
    weapon: "Claymore",
    element: "Pyro",
    skills: ["Searing Onslaught", "Dawn"],
    quote: "The dawn is mine to command.",
  },
};
const RATES = {
  FIVE_STAR: 0.001,
  EVOLVED_FOUR_STAR: 0.001,
  FOUR_STAR: 14.998,
  THREE_STAR: 85.0,
};

const CHARACTER_RATINGS = {
  FIVE_STAR: [
    "Cyno",
    "Diluc",
    "Jean",
    "Keqing",
    "Klee",
    "Baizhu",
    "Yaoyao",
    "Mona",
    "Qiqi",
    "albedo",
    "Shenhe",
    "Xiao",
    "Tighnari",
    "Arlecchino",
    "Hutao",
    "Wanderer",
    "Yelan",
    "Furina",
    "Zhongli",
    "Kamisato Ayato",
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
    "candace",
    "Chongyun",
    "layla",
    "charlotte",
    "Fischl",
    "Ningguang",
    "Razor",
    "Sucrose",
    "Lynette",
    "yanfei",
    "Xianyun",
    "Rosaria",
    "sayu",
    "dori",
    "Thoma",
    "Xiangling",
    "Heizou",
    "Xingqiu",
    "Kuki Shinobu",
    "Freminet",
  ],
  THREE_STAR: [
    "dehya",
    "Diona",
    "kaveh",
    "collei",
    "Amber",
    "Kaeya",
    "Lisa",
    "Xinyan",
    "Barbara",
    "Chiori",
    "Noelle",
    "Faruzan",
    "Gorou",
    "Sigewinne",
    "Mika",
  ],
};
const EVOLVED_FOUR_STARS = [
  "Bennett",
  "Xingqiu",
  "Xiangling",
  "Fischl",
  "Beidou",
  "Sucrose",
  "Ningguang",
  "Rosaria",
  "Thoma",
  "Heizou",
  "Faruzan",
  "Kuki Shinobu",
  "Lynette",
  "Xianyun",
];

const PREMIUM_FIVE_STARS = [
  "Zhongli",
  "Ganyu",
  "Ayaka",
  "Raiden Shogun",
  "Yae Miko",
];
const CONSTELLATION_ITEMS = {
  "Stella Fortuna": {
    type: "CONSTELLATION",
    itemType: "constellation_item",
    description:
      "Chìa khóa mở khóa tiềm năng ẩn của nhân vật nâng cấp chòm sao",
    image: "https://imgur.com/P8OdZQd.png", // Ảnh Stella Fortuna từ Genshin Impact
    rarity: "5",
    value: 100000,
    isUniversal: false, // Dành cho nhân vật cụ thể
  },
  "Universal Stella": {
    type: "CONSTELLATION",
    itemType: "constellation_item",
    description:
      "Chìa khóa vũ trụ hiếm có có thể mở khóa chòm sao cho bất kỳ nhân vật nào",
    image: "https://imgur.com/n3GBdOq.png", // Ảnh cách điệu của Stella
    rarity: "5",
    value: 500000,
    isUniversal: true, // Dùng được cho mọi nhân vật
  },
};

// Thêm cấu trúc dữ liệu cho constellation
const CHARACTER_CONSTELLATIONS = {
  // Định nghĩa chòm sao cho các nhân vật Limited/Premium trước
  "Raiden Shogun": [
    {
      level: 1,
      name: "Ominous Inscription",
      description: "Giảm 50% thời gian hồi kỹ năng E",
      effect: "reduceCooldown",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Steelbreaker",
      description: "Musou Shinsetsu phá vỡ 60% DEF của kẻ địch",
      effect: "defenseReduction",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Shinkage Bygones",
      description: "Tăng cấp kỹ năng Q thêm 3 cấp",
      effect: "skillLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Pledge of Propriety",
      description: "Nhận 30% năng lượng sau khi hết Burst",
      effect: "energyRestore",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Shogun's Descent",
      description: "Tăng stack Resolve thêm 50%",
      effect: "resolveBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Wishbearer",
      description:
        "Tấn công trong Burst giảm 60% CD Elemental Skill của đồng đội",
      effect: "teamCooldownReduction",
      powerBoost: 0.5,
    },
  ],

  Hutao: [
    {
      level: 1,
      name: "Crimson Bouquet",
      description: "Xóa bỏ chi phí stamina của Blood Blossom",
      effect: "noStaminaCost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Ominous Rain",
      description: "Blood Blossom gây thêm 20% sát thương",
      effect: "increaseDamage",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Blood Embrace",
      description: "Tăng cấp kỹ năng E thêm 3 cấp",
      effect: "skillLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Garden of Eternal Rest",
      description: "Tăng CRIT Rate 12% cho đồng đội gần Hu Tao",
      effect: "critRateBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Floral Incense",
      description: "Tăng hiệu quả Blood Blossom lên 40%",
      effect: "bloodBlossomBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Butterfly's Embrace",
      description: "HP dưới 25%, nhận 100% Resist Interruption và 200% DEF",
      effect: "survivalBoost",
      powerBoost: 0.5,
    },
  ],
  Diluc: [
    {
      level: 1,
      name: "Steel and Fire",
      description:
        "Tăng 15% Sát Thương cho 2 đòn đánh thường tiếp theo sau khi thi triển Kỹ Năng Nguyên Tố.",
      effect: "increaseDamage",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Searing Ember",
      description: "Khi HP dưới 50%, tăng 30% Tấn Công và 30% Tốc Độ Đánh.",
      effect: "attackSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 3,
      name: "Fire and Steel",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Flowing Flame",
      description:
        "Sử dụng Kỹ Năng Nguyên Tố trong 2 giây sau khi sử dụng lần đầu sẽ không bị tính thời gian hồi chiêu.",
      effect: "cooldownReset",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Phoenix, Harbinger of Dawn",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Flaming Sword, Nemesis of Dark",
      description:
        "Mỗi đòn đánh thường giảm 50% thời gian hồi chiêu của Kỹ Năng Nguyên Tố và tăng 15% Sát Thương.",
      effect: "cooldownReduction",
      powerBoost: 0.5,
    },
  ],
  Klee: [
    {
      level: 1,
      name: "Chained Reactions",
      description:
        "Đòn đánh thường và trọng kích có 50% cơ hội tạo ra một vụ nổ nhỏ gây 120% Sát Thương.",
      effect: "additionalExplosion",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Explosive Frags",
      description:
        "Đánh trúng kẻ địch bằng Kỹ Năng Nguyên Tố giảm 3 giây thời gian hồi chiêu của nó và tạo ra năng lượng nguyên tố.",
      effect: "cooldownReduction",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Exquisite Compound",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Sparkly Explosion",
      description:
        "Khi rời trận, Klee kích hoạt một vụ nổ gây 555% Sát Thương Nguyên Tố Hỏa cho kẻ địch xung quanh.",
      effect: "exitExplosion",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Nova Burst",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Blazing Delight",
      description:
        "Trong thời gian Kỹ Năng Nộ, các đòn đánh thường có 100% cơ hội kích hoạt vụ nổ nhỏ và tăng 10% Sát Thương.",
      effect: "enhancedBurst",
      powerBoost: 0.5,
    },
  ],
  // Nhân vật hệ Thủy
  Mona: [
    {
      level: 1,
      name: "Prophecy of Submersion",
      description:
        "Tăng 15% Sát Thương khi kẻ địch bị ảnh hưởng bởi trạng thái ướt.",
      effect: "increaseDamage",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Lunar Chain",
      description:
        "Đánh thường có 20% cơ hội tạo ra một đòn tấn công thứ hai gây 50% Sát Thương.",
      effect: "additionalAttack",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Restless Revolution",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Prophecy of Oblivion",
      description:
        "Tăng 15% Tỷ Lệ Bạo Kích khi kẻ địch bị ảnh hưởng bởi trạng thái ướt.",
      effect: "critRateBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Mockery of Fortuna",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Rhetorics of Calamitas",
      description:
        "Sau khi sử dụng Kỹ Năng Nộ, tăng 60% Sát Thương cho đòn đánh thường trong 8 giây.",
      effect: "enhancedAttack",
      powerBoost: 0.5,
    },
  ],
  Jean: [
    {
      level: 1,
      name: "Spiraling Tempest",
      description: "Đánh thường có 50% cơ hội hồi 20% Năng Lượng Nguyên Tố.",
      effect: "energyRestore",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "People's Aegis",
      description:
        "Khi nhận được Nguyên Tố Hồi Phục, tăng 15% Tấn Công cho toàn đội trong 12 giây.",
      effect: "teamAttackBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "When the West Wind Arises",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Lands of Dandelion",
      description:
        "Giảm 35% sát thương nhận vào trong vòng ảnh hưởng của Kỹ Năng Nộ.",
      effect: "damageReduction",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Outbursting Gust",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Lion's Fang, Fair Protector of Mondstadt",
      description:
        "Tấn công trong vòng ảnh hưởng của Kỹ Năng Nộ giúp hồi 50% lượng HP sát thương gây ra.",
      effect: "lifesteal",
      powerBoost: 0.5,
    },
  ],
  Venti: [
    {
      level: 1,
      name: "Splitting Gales",
      description: "Tăng 2 mũi tên phụ khi dùng trọng kích.",
      effect: "additionalArrow",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Breeze of Reminiscence",
      description:
        "Kẻ địch trúng Kỹ Năng Nguyên Tố bị giảm 12% Kháng Nguyên Tố Phong.",
      effect: "resistanceReduction",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Ode to Thousand Winds",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Hurricane of Freedom",
      description:
        "Khi trúng Kỹ Năng Nộ, đồng đội nhận 15% sát thương nguyên tố tương ứng trong vòng 12 giây.",
      effect: "teamElementalBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Concerto dal Cielo",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Storm of Defiance",
      description:
        "Kẻ địch trúng Kỹ Năng Nộ mất 20% Kháng Nguyên Tố Phong và nhận 15% sát thương gia tăng.",
      effect: "debuff",
      powerBoost: 0.5,
    },
  ],
  Xiao: [
    {
      level: 1,
      name: "Dissolution Eon: Destroyer of Worlds",
      description:
        "Sử dụng Kỹ Năng Nguyên Tố tăng 15% Sát Thương lần sau trong 7 giây.",
      effect: "damageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Annihilation Eon: Blossom of Kaleidos",
      description:
        "Khi Xiao trong trạng thái Bane of All Evil, trúng đòn sẽ hồi 3 năng lượng.",
      effect: "energyRegen",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Conqueror of Evil: Wrath Deity",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Transcension: Extinction of Suffering",
      description: "Khi HP dưới 50%, nhận 100% hiệu ứng chống gián đoạn.",
      effect: "survivabilityBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Evolution Eon: Origin of Ignorance",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Conqueror of Evil: Guardian Yaksha",
      description:
        "Khi Kỹ Năng Nộ được kích hoạt, đánh thường tấn công trúng nhiều kẻ địch sẽ hồi 3 năng lượng.",
      effect: "energyRegen",
      powerBoost: 0.5,
    },
  ],
  "Yae Miko": [
    {
      level: 1,
      name: "Yakan Offering",
      description: "Khi Kỹ Năng Nguyên Tố tạo ra sát thương, hồi 8 năng lượng.",
      effect: "energyRegen",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Fox's Mooncall",
      description:
        "Khi thi triển Kỹ Năng Nộ, mỗi trụ Sakura Seisho hồi 10% sát thương tối đa.",
      effect: "burstBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "The Seven Glamours",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Sakura Channeling",
      description:
        "Mỗi trụ Sakura Seisho trúng địch tăng 20% sát thương Kỹ Năng Nộ.",
      effect: "burstDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Mischievous Teasing",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Forbidden Secrets",
      description:
        "Sát thương Kỹ Năng Nguyên Tố tăng thêm 60% từ chỉ số Tinh Thông Nguyên Tố.",
      effect: "elementalMasteryBoost",
      powerBoost: 0.5,
    },
  ],
  Zhongli: [
    {
      level: 1,
      name: "Rock, the Backbone of Earth",
      description:
        "Khi có Khiên Jade Shield, sát thương nhận vào giảm thêm 15%.",
      effect: "damageReduction",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Stone, the Cradle of Jade",
      description: "Tạo thêm 1 trụ Địa Thích.",
      effect: "additionalPillar",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Jade, Shimmering Through Darkness",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Topaz, Unbreakable and Fearless",
      description:
        "Khi có Khiên Jade Shield, đồng đội trong vùng lân cận nhận 20% Sát Thương Địa tăng thêm.",
      effect: "geoDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Lazuli, Herald of the Order",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Chrysos, Bounty of Dominator",
      description:
        "Khi Kỹ Năng Nộ chạm kẻ địch, tạo ra 2 đợt sóng xung kích bổ sung, mỗi đợt gây 50% sát thương ban đầu.",
      effect: "additionalShockwaves",
      powerBoost: 0.5,
    },
  ],
  Cyno: [
    {
      level: 1,
      name: "Ordinance: Unceasing Vigil",
      description:
        "Khi trong trạng thái Pactsworn Pathclearer, Cyno nhận 20% Elemental Mastery.",
      effect: "elementalMasteryBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Ceremony: Homecoming of Spirits",
      description:
        "Khi Kỹ Năng Nguyên Tố kích hoạt trạng thái Judgment, nó hồi 3 năng lượng cho Cyno.",
      effect: "energyRegen",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Precept: Lawful Enforcer",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Austerity: Forbidding Guard",
      description:
        "Khi đang trong trạng thái Kỹ Năng Nộ, Cyno nhận 35% sát thương Lôi tăng thêm.",
      effect: "electroDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Funerary Rite: The Passing of Starlight",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Raiment: Just Scales",
      description:
        "Khi trúng địch trong trạng thái Kỹ Năng Nộ, tỉ lệ Crit Rate tăng 10% và Crit DMG tăng 20%.",
      effect: "critBoost",
      powerBoost: 0.5,
    },
  ],
  Keqing: [
    {
      level: 1,
      name: "Thundering Might",
      description:
        "Sau khi sử dụng Kỹ Năng Nguyên Tố, sát thương đánh thường tăng 20% trong 5 giây.",
      effect: "attackBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Keen Extraction",
      description:
        "Khi kẻ địch trúng Kỹ Năng Nộ, giảm 15% kháng Lôi của chúng trong 8 giây.",
      effect: "electroResReduction",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Foreseen Reformation",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Attunement",
      description:
        "Sau khi dùng Kỹ Năng Nộ, Keqing nhận 25% sát thương Lôi tăng thêm trong 10 giây.",
      effect: "electroDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Beckoning Stars",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Tenacious Star",
      description:
        "Trong 8 giây sau khi Keqing sử dụng Kỹ Năng Nộ, đòn đánh thường cuối cùng sẽ gây thêm 100% sát thương.",
      effect: "bonusDamage",
      powerBoost: 0.5,
    },
  ],
  Baizhu: [
    {
      level: 1,
      name: "Herbal Nourishment",
      description:
        "Hồi 2% HP mỗi giây cho đồng đội trong vòng ảnh hưởng của Kỹ Năng Nguyên Tố.",
      effect: "healingOverTime",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Lush Vitality",
      description:
        "Sau khi nhận hồi máu từ Baizhu, đồng đội nhận 15% kháng Thảo.",
      effect: "dendroResBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Verdant Prescription",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Rejuvenation",
      description:
        "Khiên của Baizhu tồn tại lâu hơn 5 giây và hấp thụ thêm 20% sát thương.",
      effect: "shieldBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Botanical Expertise",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Pharmacist's Wisdom",
      description:
        "Khi có khiên từ Baizhu, đồng đội nhận thêm 20% sát thương nguyên tố Thảo.",
      effect: "dendroDamageBoost",
      powerBoost: 0.5,
    },
  ],
  Yaoyao: [
    {
      level: 1,
      name: "Adeptus' Tutelage",
      description:
        "Sau khi kích hoạt Kỹ Năng Nguyên Tố, tăng 20% Healing Bonus trong 8 giây.",
      effect: "healingBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Innocent Whispers",
      description: "Nhận 15% Energy Recharge khi Yaoyao hồi máu cho đồng đội.",
      effect: "energyRechargeBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Nature's Caress",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Boundless Vitality",
      description:
        "Khi có khiên từ Kỹ Năng Nguyên Tố, sát thương Thảo tăng thêm 25%.",
      effect: "dendroDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Springtime Radiance",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Everlasting Bloom",
      description:
        "Đồng đội hồi 20% HP khi trong vùng ảnh hưởng của Kỹ Năng Nộ.",
      effect: "teamHealing",
      powerBoost: 0.5,
    },
  ],
  Mona: [
    {
      level: 1,
      name: "Prophecy of Submersion",
      description:
        "Tăng 15% sát thương Thủy cho đồng đội khi kẻ địch bị ảnh hưởng bởi trạng thái Omen.",
      effect: "hydroDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Lunar Chain",
      description:
        "Đòn đánh thường có 20% cơ hội kích hoạt một đòn đánh bổ sung.",
      effect: "extraAttack",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Restless Revolution",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Prophecy of Oblivion",
      description: "Giảm 15% kháng Thủy của kẻ địch bị ảnh hưởng bởi Omen.",
      effect: "hydroResReduction",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Mockery of Fortuna",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Rhetoric of Calamitas",
      description:
        "Sau khi dùng Kỹ Năng Nộ, Mona nhận 60% tăng sát thương Hydro trong 8 giây.",
      effect: "massiveHydroBoost",
      powerBoost: 0.5,
    },
  ],
  Qiqi: [
    {
      level: 1,
      name: "Ascetics of Frost",
      description:
        "Mỗi đòn đánh thường hồi 2% HP cho đồng đội khi đang chịu ảnh hưởng của Herald of Frost.",
      effect: "teamHealing",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Frozen to the Bone",
      description:
        "Tăng 15% sát thương Băng khi Qiqi tấn công kẻ địch bị đóng băng.",
      effect: "cryoDamageBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Ascension: Guardian’s Oath",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Divine Suppression",
      description:
        "Kẻ địch bị đánh trúng bởi Kỹ Năng Nộ bị giảm 15% tấn công trong 10 giây.",
      effect: "attackReduction",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Crimson Lotus Bloom",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Rite of Resurrection",
      description:
        "Hồi sinh một đồng đội ngẫu nhiên khi Qiqi sử dụng Kỹ Năng Nộ.",
      effect: "teamRevival",
      powerBoost: 0.5,
    },
  ],
  Albedo: [
    {
      level: 1,
      name: "Flower of Eden",
      description:
        "Tăng 15% sát thương Kỹ Năng Nguyên Tố cho đồng đội trong vùng ảnh hưởng của Solar Isotoma.",
      effect: "elementalSkillBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Grace of Helios",
      description:
        "Sau khi tạo ra một bông hoa từ Solar Isotoma, Albedo nhận 20% DEF trong 10 giây.",
      effect: "defenseBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Solar Radiance",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Descent of Divinity",
      description:
        "Đồng đội trong vùng của Solar Isotoma nhận 25% sát thương Nham tăng thêm.",
      effect: "geoDamageBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Tectonic Tide",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Infinite Alchemy",
      description:
        "Đồng đội trong vùng ảnh hưởng của Kỹ Năng Nộ nhận 20% sát thương toàn bộ nguyên tố.",
      effect: "elementalDamageBoost",
      powerBoost: 0.5,
    },
  ],
  Shenhe: [
    {
      level: 1,
      name: "Spring Spirit Summoning",
      description:
        "Tăng 15% sát thương Kỹ Năng Nguyên Tố khi kích hoạt Icy Quill.",
      effect: "cryoSkillBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Spiritborne Snowfall",
      description:
        "Tăng 10% Crit Rate cho đòn đánh thường khi chịu ảnh hưởng của Icy Quill.",
      effect: "critRateBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Divine Subjugation",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Ethereal Presence",
      description: "Tăng 25% sức mạnh Buff của Icy Quill.",
      effect: "buffBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Mystic Spirit",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Dharma’s Perfection",
      description:
        "Đồng đội nhận 15% sát thương Băng tăng thêm khi có Buff từ Icy Quill.",
      effect: "cryoDamageBoost",
      powerBoost: 0.5,
    },
  ],
  Tighnari: [
    {
      level: 1,
      name: "Beginners Mind",
      description:
        "Tăng 15% sát thương của Wreath Arrow khi có buff Vijnana Suffusion.",
      effect: "dendroSkillBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Scholarly Blade",
      description: "Tăng 20% sát thương của Charged Attack.",
      effect: "chargedAttackBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Hidden Wisdom",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Nature’s Knowledge",
      description:
        "Tăng 25% Crit Rate của Charged Attack sau khi sử dụng Kỹ Năng Nguyên Tố.",
      effect: "critRateBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Forest Secrets",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "True Knowledge",
      description:
        "Charged Attack tăng 20% Crit DMG khi trúng kẻ địch bị ảnh hưởng bởi Dendro.",
      effect: "critDamageBoost",
      powerBoost: 0.5,
    },
  ],

  Arlecchino: [
    {
      level: 1,
      name: "Crimson Pact",
      description:
        "Khi Arlecchino mất HP do kỹ năng của bản thân, sát thương Pyro tăng 15% trong 8 giây.",
      effect: "pyroDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Scarlet Vow",
      description:
        "Tăng 20% Crit Rate khi tấn công kẻ địch có HP thấp hơn 50%.",
      effect: "critRateBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Flames of Betrayal",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Bloodstained Dominion",
      description:
        "Sau khi hạ gục kẻ địch, nhận 25% Attack Speed trong 10 giây.",
      effect: "attackSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Infernal Wrath",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Endless Carnage",
      description:
        "Khi Arlecchino còn dưới 50% HP, sát thương toàn bộ đòn đánh tăng 30%.",
      effect: "damageBoostLowHP",
      powerBoost: 0.5,
    },
  ],
  Wanderer: [
    {
      level: 1,
      name: "Skybound Zephyr",
      description:
        "Khi ở trạng thái bay của Kỹ Năng Nguyên Tố, nhận 15% sát thương Phong.",
      effect: "anemoDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Wind's Whisper",
      description: "Tốc độ bay trong trạng thái Kỹ Năng Nguyên Tố tăng 20%.",
      effect: "flightSpeedBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Eternal Sky",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Dancing Gale",
      description:
        "Mỗi lần Wanderer đánh trúng kẻ địch trên không, phục hồi 3 điểm stamina.",
      effect: "staminaRestore",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Azure Tempest",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Skyfall's Revelation",
      description:
        "Tăng 25% Crit Rate khi đang ở trạng thái bay của Kỹ Năng Nguyên Tố.",
      effect: "aerialCritBoost",
      powerBoost: 0.5,
    },
  ],
  Yelan: [
    {
      level: 1,
      name: "Silent Pursuit",
      description:
        "Tăng 15% sát thương của đòn đánh cường hóa bằng Exquisite Throw.",
      effect: "hydroDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Torrential Shot",
      description:
        "Mỗi khi Exquisite Throw tấn công kẻ địch, hồi 3 năng lượng.",
      effect: "energyRestore",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Flowing Echo",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Phantom Mirage",
      description: "Tốc độ chạy trong trận chiến tăng 20%.",
      effect: "movementSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Tidebringer",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Abyssal Manipulation",
      description:
        "Sát thương của Exquisite Throw tăng thêm 30% khi HP dưới 50%.",
      effect: "lowHPBoost",
      powerBoost: 0.5,
    },
  ],
  Furina: [
    {
      level: 1,
      name: "Verdant Blessing",
      description:
        "Tăng 15% sát thương Hydro cho đồng đội khi Furina ở trạng thái Ousia.",
      effect: "hydroDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Melodic Resonance",
      description: "Tăng 20% tốc độ hồi HP của kỹ năng.",
      effect: "healingBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Echoes of Fontaine",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Sovereign's Grace",
      description:
        "Sau khi dùng Kỹ Năng Nộ, Furina tăng 25% Attack Speed trong 10 giây.",
      effect: "attackSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Tide of Blessings",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Celestial Harmony",
      description:
        "Mỗi khi Furina hồi HP cho đồng đội, sát thương Hydro toàn đội tăng 30% trong 10 giây.",
      effect: "teamHydroBoost",
      powerBoost: 0.5,
    },
  ],
  "Kamisato Ayato": [
    {
      level: 1,
      name: "Rippling Flow",
      description:
        "Sau khi dùng Kỹ Năng Nguyên Tố, nhận 15% sát thương Hydro trong 10 giây.",
      effect: "hydroDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Waveform Surge",
      description:
        "Tăng 20% Crit Rate khi tấn công kẻ địch bị ảnh hưởng bởi Hydro.",
      effect: "critRateBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Blue Tempest",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Rising Waters",
      description:
        "Sau khi dùng Kỹ Năng Nộ, Attack Speed tăng 25% trong 10 giây.",
      effect: "attackSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Frosted Ripples",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Celestial Cascade",
      description:
        "Khi tấn công kẻ địch bị ảnh hưởng bởi Hydro, nhận thêm 40% sát thương.",
      effect: "hydroDamageBonus",
      powerBoost: 0.5,
    },
  ],
  Eula: [
    {
      level: 1,
      name: "Northern Frost",
      description: "Tăng 15% sát thương vật lý khi có 2 stack Grimheart.",
      effect: "physicalDamageBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Glacial Shatter",
      description: "Tăng 20% Crit Rate khi dùng Kỹ Năng Nộ.",
      effect: "critRateBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Frozen Blade",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Arctic Dominion",
      description:
        "Sau khi phá vỡ Khiên Băng từ Kỹ Năng Nguyên Tố, Attack Speed tăng 25% trong 10 giây.",
      effect: "attackSpeedBoost",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Icebreaker",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Frostbound Requiem",
      description: "Khi Kỹ Năng Nộ phát nổ, hồi lại 50% năng lượng cho Eula.",
      effect: "energyRestore",
      powerBoost: 0.5,
    },
  ],
  Ganyu: [
    {
      level: 1,
      name: "Frostbite",
      description:
        "Tăng 15% sát thương của Charged Attack khi kẻ địch bị ảnh hưởng bởi Băng.",
      effect: "chargedAttackBoost",
      powerBoost: 0.15,
    },
    {
      level: 2,
      name: "Snowstorm",
      description:
        "Tăng 20% Crit Rate khi tấn công kẻ địch trong vùng Kỹ Năng Nộ.",
      effect: "critRateBoost",
      powerBoost: 0.2,
    },
    {
      level: 3,
      name: "Frozen Elegance",
      description: "Tăng 3 cấp cho Kỹ Năng Nộ.",
      effect: "burstLevelBoost",
      powerBoost: 0.25,
    },
    {
      level: 4,
      name: "Icy Serenade",
      description: "Giảm 20% Cryo RES của kẻ địch trong vùng Kỹ Năng Nộ.",
      effect: "cryoResReduction",
      powerBoost: 0.3,
    },
    {
      level: 5,
      name: "Frosted Blossom",
      description: "Tăng 3 cấp cho Kỹ Năng Nguyên Tố.",
      effect: "skillLevelBoost",
      powerBoost: 0.4,
    },
    {
      level: 6,
      name: "Arctic Requiem",
      description:
        "Mỗi khi Charged Attack trúng kẻ địch, giảm 1 giây hồi chiêu của Kỹ Năng Nguyên Tố.",
      effect: "cooldownReduction",
      powerBoost: 0.5,
    },
  ],
};

function createStellaFortuna(characterName = null, isUniversal = false) {
  const stellaId = "STELLA_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  
  // Giá trị của Stella dựa vào character và độ hiếm
  let stellaValue = 100000; // giá trị mặc định
  
  if (isUniversal) {
    stellaValue = 500000;
  } else if (characterName) {
    if (PREMIUM_FIVE_STARS.includes(characterName)) {
      stellaValue = 300000;
    } else if (CHARACTER_RATINGS.FIVE_STAR.includes(characterName)) {
      stellaValue = 200000;
    } else if (CHARACTER_RATINGS.FOUR_STAR.includes(characterName)) {
      stellaValue = 50000;
    }
  }
  
  CHARACTER_IDS[stellaId] = {
    type: "stella", // Đảm bảo type là "stella" không phải "character"
    isStella: true, // Thêm flag để dễ nhận biết
    name: isUniversal ? "Universal Stella Fortuna" : `Stella Fortuna (${characterName})`,
    targetCharacter: characterName,
    isUniversal: isUniversal,
    description: isUniversal 
      ? "Có thể dùng cho bất kỳ nhân vật nào"
      : `Dùng để mở khóa chòm sao cho ${characterName}`,
    obtainedAt: Date.now(),
    value: stellaValue,
    image: "https://imgur.com/n3GBdOq.png" // đổi thành URL hình ảnh Stella
  };
  
  saveCharacterDatabase();
  return stellaId;
}

// Hàm để mở khóa constellation cho nhân vật
function unlockConstellation(charId, stellaId) {
  const char = CHARACTER_IDS[charId];
  const stella = CHARACTER_IDS[stellaId];

  if (!char || !stella) {
    return { success: false, reason: "invalid_items" };
  }

  if (stella.type !== "constellation_item") {
    return { success: false, reason: "not_constellation_item" };
  }

  // Kiểm tra khả năng tương thích
  if (!stella.isUniversal && stella.characterName !== char.name) {
    return { success: false, reason: "incompatible_stella" };
  }

  // Kiểm tra constellation hiện tại
  const currentCLevel = char.constellation || 0;
  if (currentCLevel >= 6) {
    return { success: false, reason: "max_constellation" };
  }

  const nextCLevel = currentCLevel + 1;
  char.constellation = nextCLevel;

  // Áp dụng hiệu ứng constellation
  const constellationData = CHARACTER_CONSTELLATIONS[char.name];
  if (constellationData && constellationData[currentCLevel]) {
    const constellationEffect = constellationData[currentCLevel];

    // Tăng sức mạnh theo constellation
    char.stats = char.stats || { atk: 100, def: 100, hp: 500 };
    const boost = 1 + constellationEffect.powerBoost;

    char.stats.atk = Math.floor(char.stats.atk * boost);
    char.stats.def = Math.floor(char.stats.def * boost);
    char.stats.hp = Math.floor(char.stats.hp * boost);

    // Thêm hiệu ứng đặc biệt
    char.specialEffects = char.specialEffects || [];
    char.specialEffects.push(constellationEffect.effect);

    // Tăng giá trị nhân vật
    char.value = Math.floor(char.value * (1 + constellationEffect.powerBoost));
  }

  saveCharacterDatabase();

  return {
    success: true,
    character: char.name,
    newConstellation: nextCLevel,
    effect:
      constellationData?.[currentCLevel]?.description ||
      "Tăng sức mạnh tổng thể",
  };
}

const ELEMENTAL_STONES = {
  PYRO: {
    name: "AgnidusAgate",
    element: "Pyro",
    description: "Ascension stone for Pyro characters",
    emoji: "🔥",
    image: "https://imgur.com/J0J2lfG.png",
    value: 25000,
  },
  HYDRO: {
    name: "VarunadaLazurite",
    element: "Hydro",
    description: "Ascension stone for Hydro characters",
    emoji: "💧",
    image: "https://imgur.com/Wr8Udzy.png",
    value: 25000,
  },
  ELECTRO: {
    name: "VajradaAmethyst",
    element: "Electro",
    description: "Ascension stone for Electro characters",
    emoji: "⚡",
    image: "https://imgur.com/iJr7tkQ.png",
    value: 25000,
  },
  CRYO: {
    name: "ShivadaJade",
    element: "Cryo",
    description: "Ascension stone for Cryo characters",
    emoji: "❄️",
    image: "https://imgur.com/k7PooZ5.png",
    value: 25000,
  },
  DENDRO: {
    name: "NagadusEmerald",
    element: "Dendro",
    description: "Ascension stone for Dendro characters",
    emoji: "🌿",
    image: "https://imgur.com/YqWMMHO.png",
    value: 25000,
  },
  GEO: {
    name: "PrithivaTopaz",
    element: "Geo",
    description: "Ascension stone for Geo characters",
    emoji: "🪨",
    image: "https://imgur.com/LCLoXOH.png",
    value: 25000,
  },
  ANEMO: {
    name: "VayudaTurquoise",
    element: "Anemo",
    description: "Ascension stone for Anemo characters",
    emoji: "🌪️",
    image: "https://imgur.com/puantrR.png",
    value: 25000,
  },
  UNIVERSAL: {
    name: "BrilliantDiamond",
    element: "Universal",
    description: "Universal ascension stone for any character",
    emoji: "💎",
    image: "https://imgur.com/oy8zBkt.png",
    value: 500000,
  },
};
const EXP_ITEMS = {
  "Heros Wit": {
    type: "EXP",
    expValue: 10000,
    description:
      "A detailed account of battles past Grants a large amount of EXP",
    image: "https://imgur.com/w9WpGB7.png",
    rarity: "4",
    value: 5000,
  },
  "Adventurers Experience": {
    type: "EXP",
    expValue: 2000,
    description:
      "A record of adventures and discoveries Grants a moderate amount of EXP",
    image: "https://imgur.com/LFkAr11.png",
    rarity: "3",
    value: 1500,
  },
  "Wanderers Advice": {
    type: "EXP",
    expValue: 500,
    description: "Simple advice from a traveler Grants a small amount of EXP",
    image: "https://imgur.com/GSSFx9L.png",
    rarity: "2",
    value: 500,
  },
  "Legendary Grimoire": {
    type: "EXP",
    expValue: 50000,
    description:
      "Ancient knowledge from legendary heroes Grants massive amounts of EXP",
    image: "https://imgur.com/NNSmgia.png",
    rarity: "5",
    value: 25000,
  },
  "Mythical Scroll": {
    type: "EXP",
    expValue: 100000,
    description:
      "Mythical teachings from the gods Grants enormous amounts of EXP",
    image: "https://imgur.com/JWVLXxj.png",
    rarity: "5",
    value: 50000,
  },
};
function calculateExpForLevel(level) {
  const baseExpTable = {
    1: 0,
    2: 1500,
    3: 4000,
    4: 8000,
    5: 15000,
    6: 25000,
    7: 40000,
    8: 60000,
    9: 85000,
    10: 120000,
    11: 170000,
    12: 250000,
  };
  if (baseExpTable[level] !== undefined) {
    return baseExpTable[level];
  }

  // Điều chỉnh hệ số tăng cho các level cao
  // Giảm base từ 250000 -> 175000 và giảm hệ số mũ
  if (level <= 50) {
    return Math.floor(175000 * Math.pow(1.12, level - 12)); // Từ 1.15 -> 1.12
  } else if (level <= 100) {
    return Math.floor(175000 * Math.pow(1.12, 38) * Math.pow(1.15, level - 50)); // Từ 1.18 -> 1.15
  } else {
    return Math.floor(
      175000 *
        Math.pow(1.12, 38) *
        Math.pow(1.15, 50) *
        Math.pow(1.17, level - 100)
    ); // Từ 1.2 -> 1.17
  }
}

// Tạo bảng EXP mới
const EXP_PER_LEVEL = {};
for (let i = 1; i <= 200; i++) {
  EXP_PER_LEVEL[i] = calculateExpForLevel(i);
}

const ELEMENTAL_FRAGMENTS = {
  PYRO: {
    name: "AgateFragment",
    element: "Pyro",
    description: "Pyro evolution fragment",
    emoji: "🔥",
    image: "https://imgur.com/Ec9w0A3.png",
    value: 2500,
    isFragment: true,
  },
  HYDRO: {
    name: "LazuriteFragment",
    element: "Hydro",
    description: "Hydro evolution fragment",
    emoji: "💧",
    image: "https://imgur.com/xUQZRMt.png",
    value: 2500,
    isFragment: true,
  },
  ELECTRO: {
    name: "AmethystFragment",
    element: "Electro",
    description: "Electro evolution fragment",
    emoji: "⚡",
    image: "https://imgur.com/JxRxK1i.png",
    value: 2500,
    isFragment: true,
  },
  CRYO: {
    name: "JadeFragment",
    element: "Cryo",
    description: "Cryo evolution fragment",
    emoji: "❄️",
    image: "https://imgur.com/tU6KMBs.png",
    value: 2500,
    isFragment: true,
  },
  DENDRO: {
    name: "EmeraldFragment",
    element: "Dendro",
    description: "Dendro evolution fragment",
    emoji: "🌿",
    image: "https://imgur.com/uVp1eNU.png",
    value: 2500,
    isFragment: true,
  },
  GEO: {
    name: "TopazFragment",
    element: "Geo",
    description: "Geo evolution fragment",
    emoji: "🪨",
    image: "https://imgur.com/vAfAFli.png",
    value: 2500,
    isFragment: true,
  },
  ANEMO: {
    name: "TurquoiseFragment",
    element: "Anemo",
    description: "Anemo evolution fragment",
    emoji: "🌪️",
    image: "https://imgur.com/tl1G3g6.png",
    value: 2500,
    isFragment: true,
  },
  UNIVERSAL: {
    name: "DiamondFragment",
    element: "Universal",
    description: "Universal evolution fragment",
    emoji: "💎",
    image: "https://imgur.com/8BQY2FS.png",
    value: 50000,
    isFragment: true,
  },
};

let CHARACTER_IDS = {};
let nextCharId = 1;

const activeAuctions = new Map();
const activeTrades = new Map();

const CHARACTER_LEVELS = {
  3: {
    baseStats: { atk: 1.0, def: 1.0, hp: 1.0 },
    maxLevel: 150, // Tăng giới hạn cho 3★
  },
  4: {
    baseStats: { atk: 1.2, def: 1.2, hp: 1.2 },
    maxLevel: 180, // Tăng giới hạn cho 4★
  },
  5: {
    baseStats: { atk: 1.5, def: 1.5, hp: 1.5 },
    maxLevel: 200, // Tăng giới hạn cho 5★
  },
};
function createExpItem(itemName) {
  const expItemId = `EXP_${itemName
    .replace(/\s+/g, "_")
    .toUpperCase()}_${Math.floor(100000000 + Math.random() * 900000000)}`;

  CHARACTER_IDS[expItemId] = {
    type: "exp_item",
    name: itemName,
    ...EXP_ITEMS[itemName],
    obtainedAt: Date.now(),
  };

  saveCharacterDatabase();
  return expItemId;
}
function applyExpItem(charId, expItemId) {
  const char = CHARACTER_IDS[charId];
  const expItem = CHARACTER_IDS[expItemId];

  if (!char || !expItem || !expItem.type === "exp_item") {
    return { success: false, reason: "invalid_items" };
  }

  const currentLevel = char.level || 1;
  const currentExp = char.exp || 0;

  // Cập nhật cách tính maxLevel
  let baseRarity = CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
    ? 5
    : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
    ? 4
    : 3;

  // Tính maxLevel dựa trên độ hiếm và tiến hóa
  const maxLevel = char.starLevel
    ? Math.min(CHARACTER_LEVELS[baseRarity].maxLevel, char.starLevel * 20)
    : CHARACTER_LEVELS[baseRarity].maxLevel * 0.6; // 60% của level tối đa cho chưa tiến hóa

  if (currentLevel >= maxLevel) {
    return { success: false, reason: "max_level_reached" };
  }

  const newExp = currentExp + expItem.expValue;

  // Phần còn lại của hàm giữ nguyên
  let newLevel = currentLevel;
  let remainingExp = newExp;

  // Thuật toán tăng level vẫn giữ nguyên, nhưng bảng EXP đã thay đổi
  while (
    newLevel < maxLevel &&
    EXP_PER_LEVEL[newLevel + 1] !== undefined &&
    remainingExp >= EXP_PER_LEVEL[newLevel + 1]
  ) {
    remainingExp -= EXP_PER_LEVEL[newLevel + 1];
    newLevel++;
  }

  if (newLevel >= maxLevel) {
    newLevel = maxLevel;
    remainingExp = 0;
  }

  // Cập nhật thuật toán tính stats khi tăng level
  const levelDifference = newLevel - currentLevel;
  if (levelDifference > 0) {
    const baseStats = char.stats || generateCharacterStats(baseRarity);

    // Điều chỉnh hệ số tăng stats theo level để cân bằng hơn
    const statMultiplier =
      1 + levelDifference * (0.05 + (newLevel / 200) * 0.05);

    char.stats = {
      atk: Math.floor(baseStats.atk * statMultiplier),
      def: Math.floor(baseStats.def * statMultiplier * 1.1), // +10%
      hp: Math.floor(baseStats.hp * statMultiplier * 1.3), // +30%
    };

    // Điều chỉnh giá trị nhân vật theo level
    char.value = Math.floor(
      (char.value || 1000) *
        (1 + levelDifference * (0.05 + (newLevel / 200) * 0.05))
    );
  }

  char.level = newLevel;
  char.exp = remainingExp;

  saveCharacterDatabase();

  return {
    success: true,
    oldLevel: currentLevel,
    newLevel: newLevel,
    expGained: expItem.expValue,
    remainingExpForNextLevel:
      newLevel < maxLevel ? EXP_PER_LEVEL[newLevel + 1] - remainingExp : 0,
  };
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

async function getUserName(userId) {
  try {
    const userDataPath = path.join(__dirname, "../events/cache/userData.json");
    let userData = {};

    try {
      userData = JSON.parse(fs.readFileSync(userDataPath));
    } catch (error) {
      console.error("Error reading userData:", error);
    }
    if (userData[userId]?.name) {
      return userData[userId].name;
    }

    return `User_${userId.slice(-4)}`;
  } catch (error) {
    console.error("Error getting username:", error);
    return `Unknown_${userId.slice(-4)}`;
  }
}
function generateCharacterId(characterName) {
  let charId;
  do {
    const randomId = Math.floor(100000000 + Math.random() * 900000000);
    charId = `CHAR_${randomId}`;
  } while (CHARACTER_IDS[charId]);
  return charId;
}

function calculateCharacterPower(charId) {
  const char = CHARACTER_IDS[charId];
  if (!char) return 0;

  // Lấy các chỉ số cơ bản
  const stats = char.stats || { atk: 100, def: 100, hp: 500 };
  const level = char.level || 1;
  const stars =
    char.starLevel ||
    (CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
      ? 5
      : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
      ? 4
      : 3);

  // Tính sức mạnh cơ bản
  let power = (stats.atk * 2 + stats.def + stats.hp / 10) * (level / 5);

  // Thêm hệ số sao
  power *= 1 + (stars - 3) * 0.5;

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

function applyElementalAdvantage(attackerTeam, defenderTeam) {
  let advantageMultiplier = 1.0;

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
        advantageMultiplier += 0.1;
      }
    }
  }

  return advantageMultiplier;
}
function createPvpChallenge(challengerId, targetId, challengerTeam) {
  const challengeId = `PVP_${challengerId}_${targetId}_${Date.now()}`;

  activePvpChallenges.set(challengeId, {
    challenger: challengerId,
    target: targetId,
    challengerTeam: challengerTeam,
    timestamp: Date.now(),
    expiry: Date.now() + PVP_CHALLENGE_DURATION,
  });

  return challengeId;
}
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}
async function executePvpBattle(
  api,
  threadID,
  messageID,
  challengeData,
  targetTeam
) {
  const challenger = challengeData.challenger;
  const target = challengeData.target;
  const challengerTeam = challengeData.challengerTeam;

  const challengerPower = calculateTeamPower(challengerTeam);
  const targetPower = calculateTeamPower(targetTeam);

  const challengerAdvantage = applyElementalAdvantage(
    challengerTeam,
    targetTeam
  );
  const targetAdvantage = applyElementalAdvantage(targetTeam, challengerTeam);

  const finalChallengerPower = challengerPower * challengerAdvantage;
  const finalTargetPower = targetPower * targetAdvantage;

  const totalPower = finalChallengerPower + finalTargetPower;
  const challengerWinRate = (finalChallengerPower / totalPower) * 100;

  const randomFactor = Math.random() * 30 - 15;
  const adjustedWinRate = Math.max(
    5,
    Math.min(95, challengerWinRate + randomFactor)
  );

  const roll = Math.random() * 100;
  const challengerWins = roll < adjustedWinRate;

  const gachaData = loadGachaData();

  // Xử lý thắng/thua và phần thưởng
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

  // Lấy thông tin người chơi
  const userDataPath = path.join(__dirname, "../events/cache/userData.json");
  let userData = {};
  try {
    userData = JSON.parse(fs.readFileSync(userDataPath));
  } catch (error) {
    console.error("Error reading userData:", error);
  }
  const challengerName = userData[challenger]?.name || "Người chơi 1";
  const targetName = userData[target]?.name || "Người chơi 2";

  // Tạo dữ liệu nhân vật chi tiết cho cả hai đội
  const challengerTeamDetails = await Promise.all(
    challengerTeam.map(async (charId) => {
      const char = CHARACTER_IDS[charId];
      if (!char) return null;

      // Xác định rarity gốc của nhân vật từ danh sách
      const baseRarity = CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
        ? 5
        : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
        ? 4
        : 3;

      const charInfo = CUSTOM_CHARACTER_DATA[char.name] || {};
      const image = CUSTOM_CHARACTER_IMAGES[char.name];

      // Tạo cấu trúc đúng như trong gachatest.js
      return {
        name: char.name,
        element: charInfo.element || "Unknown",
        level: char.level || 1,
        rarity: baseRarity, // Đây là độ hiếm gốc (không phải starLevel)
        image: image,
        isPremium: PREMIUM_FIVE_STARS.includes(char.name),
        starLevel: char.starLevel, // Đây là số sao sau tiến hóa
        currentLevel: char.level,
      };
    })
  );

  const targetTeamDetails = await Promise.all(
    targetTeam.map(async (charId) => {
      const char = CHARACTER_IDS[charId];
      if (!char) return null;

      const baseRarity = CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
        ? 5
        : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
        ? 4
        : 3;

      const charInfo = CUSTOM_CHARACTER_DATA[char.name] || {};
      const image = CUSTOM_CHARACTER_IMAGES[char.name];

      return {
        name: char.name,
        element: charInfo.element || "Unknown",
        level: char.level || 1,
        rarity: baseRarity, // Độ hiếm gốc
        image: image,
        isPremium: PREMIUM_FIVE_STARS.includes(char.name),
        starLevel: char.starLevel, // Số sao sau tiến hóa
        currentLevel: char.level,
      };
    })
  );
  try {
    // Tạo ảnh trận đấu PVP
    const battleImage = await createPvPBattleImage({
      challenger,
      target,
      challengerName,
      targetName,
      challengerTeam: challengerTeamDetails.filter(Boolean),
      targetTeam: targetTeamDetails.filter(Boolean),
      challengerPower,
      targetPower,
      challengerAdvantage,
      targetAdvantage,
      winChance: adjustedWinRate,
      winner: challengerWins ? challenger : target,
      result: {
        roll: roll,
        winChance: adjustedWinRate,
        winnerReward: PVP_REWARD_WIN,
        reward: PVP_REWARD_WIN,
      },
    });

    // Thông báo ngắn gọn kèm ảnh
    let resultMessage = `⚔️ KẾT QUẢ TRẬN ĐẤU PVP ⚔️\n\n`;
    resultMessage += `🏆 ${
      challengerWins ? challengerName : targetName
    } đã chiến thắng!\n`;
    resultMessage += `💰 Phần thưởng: $${PVP_REWARD_WIN.toLocaleString()}\n`;

    return api.sendMessage(
      {
        body: resultMessage,
        attachment: fs.createReadStream(battleImage),
      },
      threadID,
      () => {
        // Xóa file tạm sau khi gửi
        fs.unlinkSync(battleImage);
      },
      messageID
    );
  } catch (error) {
    console.error("Error creating PvP battle image:", error);

    // Trở về phiên bản văn bản nếu tạo ảnh thất bại
    let fallbackMessage = `⚔️ KẾT QUẢ TRẬN ĐẤU PVP ⚔️\n`;
    fallbackMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    fallbackMessage += `👤 ${challengerName} (${Math.floor(
      finalChallengerPower
    )} sức mạnh)\n`;
    fallbackMessage += `👤 ${targetName} (${Math.floor(
      finalTargetPower
    )} sức mạnh)\n\n`;
    fallbackMessage += `🎲 Tỷ lệ thắng: ${adjustedWinRate.toFixed(1)}%\n`;
    fallbackMessage += `🎯 Roll: ${roll.toFixed(1)}\n\n`;
    fallbackMessage += `🏆 NGƯỜI THẮNG: ${
      challengerWins ? challengerName : targetName
    }\n`;
    fallbackMessage += `💰 Phần thưởng: $${PVP_REWARD_WIN.toLocaleString()}`;

    return api.sendMessage(fallbackMessage, threadID, messageID);
  }
}

async function formatTeamInfo(teamIds) {
  let result = "";

  for (let i = 0; i < teamIds.length; i++) {
    const charId = teamIds[i];
    const char = CHARACTER_IDS[charId];
    if (!char) continue;

    const stars =
      char.starLevel ||
      (CHARACTER_RATINGS.FIVE_STAR.includes(char.name)
        ? 5
        : CHARACTER_RATINGS.FOUR_STAR.includes(char.name)
        ? 4
        : 3);

    const starsText =
      "⭐".repeat(Math.min(5, stars)) + (stars > 5 ? ` [${stars}★]` : "");
    const level = char.level || 1;
    const charInfo = CUSTOM_CHARACTER_DATA[char.name] || {};
    const element = charInfo.element || "Unknown";

    result += `${i + 1}. ${char.name} ${starsText} Lv${level} (${element})\n`;
  }

  if (result === "") {
    result = "Không có nhân vật nào";
  }

  return result;
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
    isFragment: true,
  };
  saveCharacterDatabase();
  return fragmentId;
}

function generateFragmentId(stoneType) {
  let fragmentId;
  do {
    const randomId = Math.floor(100000000 + Math.random() * 900000000);
    fragmentId = `FRAGMENT_${stoneType}_${randomId}`;
  } while (CHARACTER_IDS[fragmentId]);
  return fragmentId;
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
function generateCharacterStats(rarity) {
  let baseStats = {
    5: { atk: 500, def: 500, hp: 2000 },
    4: { atk: 300, def: 300, hp: 1000 },
    3: { atk: 100, def: 100, hp: 500 },
  }[rarity] || { atk: 100, def: 100, hp: 500 };

  const variation = () => 0.9 + Math.random() * 0.2;

  return {
    atk: Math.floor(baseStats.atk * variation()),
    def: Math.floor(baseStats.def * variation()),
    hp: Math.floor(baseStats.hp * variation()),
  };
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
      } else if (fileInventory.length > memoryData.length) {
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

function generateCharacterStats(rarity, characterName) {
  let baseStats = {
    5: { atk: 500, def: 500, hp: 2000 },
    4: { atk: 300, def: 300, hp: 1000 },
    3: { atk: 100, def: 100, hp: 500 },
  }[rarity] || { atk: 100, def: 100, hp: 500 };

  const isLimited = PREMIUM_FIVE_STARS.includes(characterName);
  const limitedMultiplier = isLimited ? 2.5 : 1;

  const variation = () => (0.9 + Math.random() * 0.2) * limitedMultiplier;

  const specialCharBonus =
    {
      "Raiden Shogun": 1.3,
      Hutao: 1.25,
      Nahida: 1.2,
      Zhongli: 1.3,
      "Yae Miko": 1.25,
    }[characterName] || 1;

  return {
    atk: Math.floor(baseStats.atk * variation() * specialCharBonus),
    def: Math.floor(baseStats.def * variation() * specialCharBonus),
    hp: Math.floor(baseStats.hp * variation() * specialCharBonus),
  };
}

function placeBid(auctionId, bidderId, amount) {
  const auction = activeAuctions.get(auctionId);
  if (!auction || auction.status !== "active")
    return { success: false, reason: "auction_not_found" };
  if (auction.seller === bidderId)
    return { success: false, reason: "self_bid" };
  if (Date.now() > auction.endTime)
    return { success: false, reason: "auction_ended" };

  const minValidBid = auction.currentBid + auction.minIncrement;
  if (amount < minValidBid) {
    return {
      success: false,
      reason: "bid_too_low",
      minRequired: minValidBid,
    };
  }

  const previousBidder = auction.highestBidder;
  const previousBid = auction.currentBid;

  auction.currentBid = amount;
  auction.highestBidder = bidderId;
  auction.bids.push({
    bidderId,
    amount,
    time: Date.now(),
    increment: amount - auction.currentBid,
  });

  const timeLeft = auction.endTime - Date.now();
  if (auction.autoExtend && timeLeft < 60000) {
    auction.endTime = Date.now() + 60000;
  }

  if (!auction.notifications.includes(bidderId)) {
    auction.notifications.push(bidderId);
  }

  return {
    success: true,
    previousBidder,
    previousBid,
    newEndTime: auction.endTime,
  };
}
async function showAuctionList(api, threadID, messageID, filterType = null) {
  const activeList = [...activeAuctions.values()].filter(
    (auction) =>
      auction.status === "active" &&
      auction.endTime > Date.now() &&
      (filterType === null || auction.itemType === filterType)
  );

  if (activeList.length === 0) {
    return api.sendMessage(
      "📋 DANH SÁCH ĐẤU GIÁ 📋\n\n" +
        "Hiện không có phiên đấu giá nào đang diễn ra!\n\n" +
        "💡 Bạn có thể tạo phiên đấu giá mới với:\n" +
        ".gacha auction #ID <giá_khởi_điểm>",
      threadID,
      messageID
    );
  }

  activeList.sort((a, b) => a.endTime - b.endTime);

  const premiumAuctions = activeList.filter((a) => a.highlighted);
  const regularAuctions = activeList.filter((a) => !a.highlighted);

  let message = "📋 DANH SÁCH ĐẤU GIÁ 📋\n";
  message += "───────────────\n\n";

  if (premiumAuctions.length > 0) {
    message += "🔥 PHIÊN ĐẤU GIÁ ĐẶC BIỆT 🔥\n\n";

    premiumAuctions.forEach((auction, index) => {
      const timeLeft = Math.max(0, auction.endTime - Date.now());
      const minutesLeft = Math.floor(timeLeft / 60000);
      const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

      const itemIcon =
        auction.itemType === "character"
          ? "👤"
          : auction.itemType === "stone"
          ? "💎"
          : "🧩";

      const rarityStars = "⭐".repeat(Math.min(5, auction.itemRarity));

      message += `${index + 1}. ${itemIcon} ${
        auction.itemName
      } ${rarityStars}\n`;
      message += `💰 Giá hiện tại: $${auction.currentBid.toLocaleString()}\n`;
      message += `⏰ Còn lại: ${minutesLeft}m ${secondsLeft}s\n`;
      message += `🔖 ID: ${auction.id}\n\n`;
    });
  }

  if (regularAuctions.length > 0) {
    if (premiumAuctions.length > 0) message += "📦 PHIÊN ĐẤU GIÁ KHÁC 📦\n\n";

    regularAuctions.slice(0, 5).forEach((auction, index) => {
      const timeLeft = Math.max(0, auction.endTime - Date.now());
      const minutesLeft = Math.floor(timeLeft / 60000);

      const itemIcon =
        auction.itemType === "character"
          ? "👤"
          : auction.itemType === "stone"
          ? "💎"
          : "🧩";

      message += `${premiumAuctions.length + index + 1}. ${itemIcon} ${
        auction.itemName
      }\n`;
      message += `💰 Giá: $${auction.currentBid.toLocaleString()} • ⏰ Còn: ${minutesLeft}m\n`;
      message += `🔖 ID: ${auction.id}\n\n`;
    });

    if (regularAuctions.length > 5) {
      message += `... và ${regularAuctions.length - 5} phiên khác\n\n`;
    }
  }

  message += "💡 Lệnh hỗ trợ:\n";
  message += ".gacha ainfo <ID> - Xem chi tiết phiên\n";
  message += ".gacha bid <ID> <giá> - Đặt giá\n";

  return api.sendMessage(message, threadID, messageID);
}
async function showAuctionInfo(api, threadID, messageID, auctionId) {
  const auction = activeAuctions.get(auctionId);

  if (!auction) {
    return api.sendMessage(
      "❌ Không tìm thấy phiên đấu giá với ID này!",
      threadID,
      messageID
    );
  }

  const item = CHARACTER_IDS[auction.itemId];
  if (!item) {
    return api.sendMessage(
      "❌ Không tìm thấy thông tin vật phẩm đấu giá!",
      threadID,
      messageID
    );
  }

  const sellerName = await getUserName(auction.seller);
  const bidderName = auction.highestBidder
    ? await getUserName(auction.highestBidder)
    : "Chưa có";

  const timeLeft = Math.max(0, auction.endTime - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);
  const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

  let status = "🟢 Đang diễn ra";
  if (auction.status === "ended") {
    status = "🔴 Đã kết thúc";
  } else if (timeLeft <= 0) {
    status = "🟠 Đang xử lý kết quả";
  }

  let itemType, rarityText, rarityStars;
  if (auction.itemType === "character") {
    itemType = "Nhân vật";
    rarityText =
      auction.itemRarity === 5
        ? "5★ (Legendary)"
        : auction.itemRarity === 4
        ? "4★ (Epic)"
        : "3★ (Rare)";
    rarityStars = "⭐".repeat(Math.min(5, auction.itemRarity));
  } else if (auction.itemType === "stone") {
    itemType = "Đá tiến hóa";
    rarityText =
      item.stoneType === "UNIVERSAL" ? "5★ (Legendary)" : "4★ (Rare)";
    rarityStars = item.stoneType === "UNIVERSAL" ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐";
  } else {
    itemType = "Mảnh đá";
    rarityText = "3★ (Uncommon)";
    rarityStars = "⭐⭐⭐";
  }

  let message = `📜 CHI TIẾT PHIÊN ĐẤU GIÁ 📜\n`;
  message += `────────────────────\n\n`;

  message += `🔖 ID: ${auction.id}\n`;
  message += `${status}\n\n`;

  message += `📦 VẬT PHẨM ĐẤU GIÁ:\n`;
  message += `• Loại: ${itemType}\n`;
  message += `• Tên: ${item.name}\n`;
  message += `• Độ hiếm: ${rarityText} ${rarityStars}\n`;
  message += `• Giá trị thị trường: $${item.value?.toLocaleString()}\n\n`;

  message += `🏷️ THÔNG TIN PHIÊN:\n`;
  message += `• Người bán: ${sellerName}\n`;
  message += `• Giá khởi điểm: $${auction.startingBid.toLocaleString()}\n`;
  message += `• Giá hiện tại: $${auction.currentBid.toLocaleString()}\n`;
  message += `• Người đặt giá cao nhất: ${bidderName}\n`;
  message += `• Số lần đặt giá: ${auction.bids.length}\n`;

  if (auction.status === "active" && timeLeft > 0) {
    message += `• Thời gian còn lại: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s\n`;
    message += `• Tăng giá tối thiểu: $${auction.minIncrement.toLocaleString()}\n`;
    message += `• Giá tối thiểu mới: $${(
      auction.currentBid + auction.minIncrement
    ).toLocaleString()}\n\n`;

    message += `💡 Để đặt giá, hãy gõ:\n`;
    message += `.gacha bid ${auction.id} <số_tiền>\n`;
  } else {
    message += `• Kết thúc lúc: ${new Date(
      auction.endTime
    ).toLocaleString()}\n\n`;
  }

  if (auction.bids.length > 0) {
    message += `📊 LỊCH SỬ ĐẶT GIÁ:\n`;

    const recentBids = [...auction.bids].reverse().slice(0, 5);

    for (const bid of recentBids) {
      const bidderName = await getUserName(bid.bidderId);
      const bidTime = new Date(bid.time).toLocaleTimeString();
      message += `• ${bidderName}: $${bid.amount.toLocaleString()} (${bidTime})\n`;
    }

    if (auction.bids.length > 5) {
      message += `... và ${auction.bids.length - 5} lượt khác\n`;
    }
  }

  return api.sendMessage(message, threadID, messageID);
}
function announceConstellationUnlock(api, threadID, userName, charName, constellationLevel, constellationName, effect) {
  const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(charName) ? "5★" :
                CHARACTER_RATINGS.FOUR_STAR.includes(charName) ? "4★" : "3★";
  
  const conEffectIcons = {
    1: "🔮",
    2: "⚡",
    3: "🌀",
    4: "💫",
    5: "🌟",
    6: "✨"
  };
  
  const message = `${conEffectIcons[constellationLevel]} CONSTELLATION UNLOCK! ${conEffectIcons[constellationLevel]}
━━━━━━━━━━━━━━━━━━
👤 ${userName} đã mở khóa chòm sao cho ${charName}!

📝 THÔNG TIN:
• Nhân vật: ${charName} (${rarity}) 
• Chòm sao: C${constellationLevel} - ${constellationName}
• Hiệu ứng: ${effect}

💪 Sức mạnh tăng ${constellationLevel >= 5 ? "cực mạnh" : constellationLevel >= 3 ? "đáng kể" : "đáng kể"}!
${constellationLevel === 6 ? "👑 ĐÃ ĐẠT CONSTELLATION TỐI ĐA!" : ""}
━━━━━━━━━━━━━━━━━━

💡 Bạn cũng muốn mở khóa? Dùng lệnh:
.gacha const #ID_NHÂN_VẬT #ID_STELLA`;
  
  api.sendMessage(message, threadID);
}
// Hàm xử lý kết thúc đấu giá
async function finalizeAuction(api, auction) {
  if (auction.status !== "active") return;

  auction.status = "ended";
  const item = CHARACTER_IDS[auction.itemId];

  if (!item) {
    console.error(
      `Không tìm thấy item ${auction.itemId} khi kết thúc đấu giá ${auction.id}`
    );
    return;
  }

  // Lấy thông tin người bán và người thắng
  const sellerData = gachaData[auction.seller];
  const sellerName = await getUserName(auction.seller);

  // Trường hợp không có ai đặt giá
  if (!auction.highestBidder) {
    // Trả lại vật phẩm cho người bán
    if (sellerData && sellerData.inventory) {
      sellerData.inventory.push(auction.itemId);
      saveGachaData(gachaData);
    }

    // Thông báo cho người bán
    api.sendMessage(
      `📢 PHIÊN ĐẤU GIÁ ĐÃ KẾT THÚC!\n\n` +
        `❌ Không có ai đặt giá cho vật phẩm của bạn!\n` +
        `📦 Vật phẩm: ${item.name}\n` +
        `🔖 ID phiên: ${auction.id}\n\n` +
        `💡 Vật phẩm đã được trả lại vào kho đồ của bạn.`,
      auction.seller
    );

    return;
  }

  // Phiên đấu giá thành công
  const winnerData = gachaData[auction.highestBidder];
  const winnerName = await getUserName(auction.highestBidder);

  if (!winnerData) {
    if (sellerData && sellerData.inventory) {
      sellerData.inventory.push(auction.itemId);
      saveGachaData(gachaData);
    }

    api.sendMessage(
      `❌ Lỗi khi xử lý kết quả đấu giá. Vật phẩm đã được trả lại cho người bán.`,
      auction.seller
    );

    return;
  }

  await updateBalance(auction.seller, auction.currentBid);

  if (!winnerData.inventory) winnerData.inventory = [];
  winnerData.inventory.push(auction.itemId);

  saveGachaData(gachaData);

  api.sendMessage(
    `🎉 PHIÊN ĐẤU GIÁ CỦA BẠN ĐÃ KẾT THÚC THÀNH CÔNG!\n\n` +
      `📦 Vật phẩm: ${item.name}\n` +
      `💰 Giá bán: $${auction.currentBid.toLocaleString()}\n` +
      `👤 Người mua: ${winnerName}\n` +
      `🔖 ID phiên: ${auction.id}\n\n` +
      `💵 Số tiền đã được chuyển vào tài khoản của bạn.`,
    auction.seller
  );

  // Thông báo cho người thắng
  api.sendMessage(
    `🎊 CHÚC MỪNG! BẠN ĐÃ THẮNG PHIÊN ĐẤU GIÁ!\n\n` +
      `📦 Vật phẩm: ${item.name}\n` +
      `💰 Giá mua: $${auction.currentBid.toLocaleString()}\n` +
      `👤 Người bán: ${sellerName}\n` +
      `🔖 ID phiên: ${auction.id}\n\n` +
      `✅ Vật phẩm đã được chuyển vào kho đồ của bạn.`,
    auction.highestBidder
  );

  const participants = [...new Set(auction.bids.map((b) => b.bidderId))];
  for (const participantId of participants) {
    if (participantId !== auction.highestBidder) {
      api.sendMessage(
        `📢 PHIÊN ĐẤU GIÁ ĐÃ KẾT THÚC!\n\n` +
          `📦 Vật phẩm: ${item.name}\n` +
          `💰 Giá cuối: $${auction.currentBid.toLocaleString()}\n` +
          `👤 Người thắng: ${winnerName}\n` +
          `🔖 ID phiên: ${auction.id}\n\n` +
          `💡 Hãy tiếp tục tham gia các phiên đấu giá khác!`,
        participantId
      );
    }
  }
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

function calculateDynamicRates(userData) {
  const pullsWithoutFiveStar = userData.pullsSinceLastFiveStar || 0;
  const pullsWithoutFourStar = userData.pullsSinceLastFourStar || 0;

  const fiveStarBoost = Math.min(5, Math.pow(pullsWithoutFiveStar * 0.1, 1.5));
  const evolvedFourStarBoost = Math.min(
    5,
    Math.pow(pullsWithoutFiveStar * 0.08, 1.4)
  ); // Hơi thấp hơn 5 sao
  const fourStarBoost = Math.min(15, Math.pow(pullsWithoutFourStar * 0.2, 1.3));

  const totalPullsBoost = Math.min(1, (userData.totalPulls || 0) * 0.005);

  return {
    FIVE_STAR: RATES.FIVE_STAR + fiveStarBoost + totalPullsBoost,
    EVOLVED_FOUR_STAR:
      RATES.EVOLVED_FOUR_STAR + evolvedFourStarBoost + totalPullsBoost * 0.8,
    FOUR_STAR: RATES.FOUR_STAR + fourStarBoost,
    THREE_STAR:
      100 -
      (RATES.FIVE_STAR + fiveStarBoost + totalPullsBoost) -
      (RATES.EVOLVED_FOUR_STAR + evolvedFourStarBoost + totalPullsBoost * 0.8) -
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

    console.log(
      `Loaded ${Object.keys(CHARACTER_IDS).length} characters from database`
    );

    const keys = Object.keys(CHARACTER_IDS);
    if (keys.length > 0) {
      const sample = keys.slice(0, Math.min(3, keys.length));
      sample.forEach((id) => {
        console.log(
          `Sample character: ${id} - ${CHARACTER_IDS[id]?.name || "Unknown"}`
        );
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

  const itemTypeRoll = Math.random() * 100;

  if (itemTypeRoll < 10) {
    const isFragment = Math.random() < 0.7; 
    const elements = Object.keys(
      isFragment ? ELEMENTAL_FRAGMENTS : ELEMENTAL_STONES
    );
    const universalProb = isFragment ? 0.01 : 0.001;

    let stoneType;
    if (Math.random() < universalProb) {
      stoneType = "UNIVERSAL";
    } else {
      const regularElements = elements.filter((e) => e !== "UNIVERSAL");
      stoneType =
        regularElements[Math.floor(Math.random() * regularElements.length)];
    }

    let charId;
    if (isFragment) {
      charId = createStoneFragment(stoneType);
    } else {
      charId = createStone(stoneType);
    }

    return {
      charId,
      isStone: true,
      isFragment,
      isExpItem: false,
    };
  }

  else if (itemTypeRoll < 20) {
    const expRoll = Math.random() * 100;
    let expItemName;

    if (expRoll < 5) {
      // Tăng tỉ lệ Mythical Scroll lên 5% (trước đây 1%)
      expItemName = "Mythical Scroll";
    } else if (expRoll < 15) {
      // Tăng tỉ lệ Legendary Grimoire lên 10% (trước đây 2%)
      expItemName = "Legendary Grimoire";
    } else if (expRoll < 40) {
      // Tăng tỉ lệ Hero's Wit lên 25% (trước đây 17%)
      expItemName = "Heros Wit";
    } else if (expRoll < 70) {
      // Giảm nhẹ tỉ lệ Adventurer's Experience thành 30% (trước đây 40%)
      expItemName = "Adventurers Experience";
    } else {
      // Giảm nhẹ tỉ lệ Wanderer's Advice thành 30% (trước đây 40%)
      expItemName = "Wanderers Advice";
    }

    const charId = createExpItem(expItemName);

    return {
      charId,
      isStone: false,
      isFragment: false,
      isExpItem: true,
    };
  }

  // XỬ LÝ NHÂN VẬT (80% còn lại)
  else {
    // Xác định loại nhân vật dựa vào tỉ lệ
    let character;
    let rarity;
    let evolvedStars = 0;

    if (roll < currentRates.FIVE_STAR) {
      // 5* thường/premium
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

      if (!userData.stellaPity) {
        userData.stellaPity = {};
      }
      // [MỚI] Kiểm tra xem người chơi đã có nhân vật 5★ này chưa
      let isDuplicate = false;
      for (const existingCharId of userData.inventory || []) {
        const existingChar = CHARACTER_IDS[existingCharId];
        if (
          existingChar &&
          existingChar.type === "character" &&
          existingChar.name === character
        ) {
          isDuplicate = true;
          break;
        }
      }
      if (!userData.stellaPity[character]) {
        userData.stellaPity[character] = 0;
      }
      const stellaPityThreshold = PREMIUM_FIVE_STARS.includes(character) ? 
    STELLA_PITY_THRESHOLD + 1 : STELLA_PITY_THRESHOLD;

    const stellaChance = isDuplicate ? 100 : Math.min(95, userData.stellaPity[character] * STELLA_PITY_BOOST_PER_FAIL);
    const stellaRoll = Math.random() * 100;
    const getStellaFortuna = stellaRoll < stellaChance || userData.stellaPity[character] >= stellaPityThreshold;

      userData.stellaPity[character] >= stellaPityThreshold;

      // [MỚI] Nếu đã có nhân vật này, tạo Stella Fortuna
      if (isDuplicate || getStellaFortuna) {
        // Reset pity counter khi ra Stella
        userData.stellaPity[character] = 0;
        
        // Tạo Stella Fortuna 
        const stellaId = createStellaFortuna(character, false);
        userData.inventory.push(stellaId);
        
        return { 
          charId: stellaId, 
          isStella: true,  // Flag quan trọng để xử lý đúng
          originalChar: character,
          isPremium: PREMIUM_FIVE_STARS.includes(character),
          isPity: !isDuplicate,
          isStone: false,
          isFragment: false,
          isExpItem: false
        };
      } else {
        // Tăng pity counter nếu không ra Stella
        userData.stellaPity[character]++;
      }
    } else if (roll < currentRates.FIVE_STAR + currentRates.EVOLVED_FOUR_STAR) {
      // [CODE XỬ LÝ 4★ TIẾN HÓA - GIỮ NGUYÊN]
      userData.pullsSinceLastFiveStar++;
      userData.pullsSinceLastFourStar = 0;

      character =
        EVOLVED_FOUR_STARS[
          Math.floor(Math.random() * EVOLVED_FOUR_STARS.length)
        ];
      evolvedStars = Math.floor(Math.random() * 3) + 5; // 5-7★
      rarity = "FOUR_STAR";
    } else if (
      roll <
      currentRates.FIVE_STAR +
        currentRates.EVOLVED_FOUR_STAR +
        currentRates.FOUR_STAR
    ) {
      // [CODE XỬ LÝ 4★ THƯỜNG - GIỮ NGUYÊN]
      userData.pullsSinceLastFourStar = 0;
      userData.pullsSinceLastFiveStar++;
      character = getRandomCharacter("FOUR_STAR");
      rarity = "FOUR_STAR";
    } else {
      // [CODE XỬ LÝ 3★ THƯỜNG - GIỮ NGUYÊN]
      userData.pullsSinceLastFourStar++;
      userData.pullsSinceLastFiveStar++;
      character = getRandomCharacter("THREE_STAR");
      rarity = "THREE_STAR";
    }

    const charId = generateCharacterId(character);

    // Xử lý đặc biệt cho 4* đã tiến hóa
    if (evolvedStars > 0) {
      // [CODE XỬ LÝ TIẾN HÓA - GIỮ NGUYÊN]
      const evolutionMultiplier = 1 + (evolvedStars - 4) * 0.5; // 5★->1.5x, 6★->2x, 7★->2.5x

      // Tính chỉ số cho nhân vật tiến hóa
      const baseStats = generateCharacterStats(4, character);

      for (const stat in baseStats) {
        baseStats[stat] = Math.floor(baseStats[stat] * evolutionMultiplier);
      }

      const valueMultiplier = evolutionMultiplier * 3;

      CHARACTER_IDS[charId] = {
        type: "character",
        name: character,
        obtainedAt: Date.now(),
        starLevel: evolvedStars,
        level: 1,
        exp: 0,
        isMaxEvolved: evolvedStars >= 7,
        isEvolved: true,
        value: Math.floor(
          (rarity === "FOUR_STAR" ? 50000 : 500000) * valueMultiplier
        ),
        stats: baseStats,
      };
    } else {
      // Xử lý nhân vật thường
      CHARACTER_IDS[charId] = {
        type: "character",
        name: character,
        obtainedAt: Date.now(),
        value: generateCardValue(rarity, character),
        level: 1,
        exp: 0,
        stats: generateCharacterStats(
          rarity === "FIVE_STAR" ? 5 : rarity === "FOUR_STAR" ? 4 : 3,
          character
        ),
      };
    }

    saveCharacterDatabase();
    return {
      charId,
      isStone: false,
      isFragment: false,
      isExpItem: false,
      isEvolved: evolvedStars > 0,
      evolvedStars,
    };
  }
}

function createBackup(type = "daily") {
  try {
    const backupDir = path.join(__dirname, "./json/backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const timestamp = Math.floor(now.getTime() / 1000);

    // Tạo tên file backup với prefix khác nhau dựa trên loại sao lưu
    let prefix = "";
    switch (type) {
      case "manual":
        prefix = "manual_";
        break;
      case "auto":
        prefix = "auto_";
        break;
      case "pre_update":
        prefix = "update_";
        break;
      default:
        prefix = "daily_";
    }

    const backupFilename = `gacha_${prefix}${date}_${timestamp}.json`;
    const charactersBackupFilename = `characters_${prefix}${date}_${timestamp}.json`;

    // Sao lưu dữ liệu
    fs.copyFileSync(GACHA_DATA_FILE, path.join(backupDir, backupFilename));
    fs.copyFileSync(
      CHARACTERS_DB_FILE,
      path.join(backupDir, charactersBackupFilename)
    );

    console.log(`✅ Đã tạo bản sao lưu ${type}: ${backupFilename}`);

    // Xoay vòng các bản sao lưu cũ
    rotateBackups(backupDir);

    return { success: true, filename: backupFilename };
  } catch (error) {
    console.error("❌ Lỗi khi tạo bản sao lưu:", error);
    return { success: false, error };
  }
}
function rotateBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir);

    // Nhóm các file theo ngày
    const backupsByDate = {};
    files.forEach((file) => {
      if (
        file.startsWith("gacha_daily_") ||
        file.startsWith("characters_daily_")
      ) {
        const dateMatch = file.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          const date = dateMatch[0];
          if (!backupsByDate[date]) backupsByDate[date] = [];
          backupsByDate[date].push(file);
        }
      }
    });

    // Sắp xếp các ngày và giữ lại MAX_BACKUPS ngày gần nhất
    const dates = Object.keys(backupsByDate).sort().reverse();
    if (dates.length > MAX_BACKUPS) {
      const datesToDelete = dates.slice(MAX_BACKUPS);
      datesToDelete.forEach((date) => {
        backupsByDate[date].forEach((file) => {
          fs.unlinkSync(path.join(backupDir, file));
          console.log(`🗑️ Đã xóa backup cũ: ${file}`);
        });
      });
    }
  } catch (error) {
    console.error("Lỗi khi xoay vòng backups:", error);
  }
}

function restoreFromBackup(backupId = null) {
  try {
    const backupDir = path.join(__dirname, "./json/backups");
    if (!fs.existsSync(backupDir)) {
      console.log("Không tìm thấy thư mục backup");
      return { success: false, reason: "no_backup_dir" };
    }

    const files = fs.readdirSync(backupDir);
    if (files.length === 0) {
      console.log("Không tìm thấy file backup nào");
      return { success: false, reason: "no_backups" };
    }

    let gachaBackupFile, charactersBackupFile;

    if (backupId) {
      gachaBackupFile = files.find(
        (f) => f.startsWith("gacha_") && f.includes(backupId)
      );
      if (gachaBackupFile) {
        const timestamp = gachaBackupFile.match(/\d+(?=\.json)/)[0];
        charactersBackupFile = files.find(
          (f) => f.startsWith("characters_") && f.includes(timestamp)
        );
      }
    } else {
      const gachaFiles = files.filter((f) => f.startsWith("gacha_"));
      const characterFiles = files.filter((f) => f.startsWith("characters_"));

      if (gachaFiles.length === 0 || characterFiles.length === 0) {
        console.log("Thiếu file backup cần thiết");
        return { success: false, reason: "incomplete_backups" };
      }

      gachaFiles.sort().reverse();
      characterFiles.sort().reverse();

      gachaBackupFile = gachaFiles[0];
      charactersBackupFile = characterFiles[0];
    }

    if (!gachaBackupFile || !charactersBackupFile) {
      console.log(`Không tìm thấy file backup phù hợp với ID: ${backupId}`);
      return { success: false, reason: "backup_not_found" };
    }

    createBackup("pre_restore");

    const gachaBackupPath = path.join(backupDir, gachaBackupFile);
    const charactersBackupPath = path.join(backupDir, charactersBackupFile);

    fs.copyFileSync(gachaBackupPath, GACHA_DATA_FILE);
    fs.copyFileSync(charactersBackupPath, CHARACTERS_DB_FILE);

    console.log(
      `✅ Đã phục hồi từ backup: ${gachaBackupFile}, ${charactersBackupFile}`
    );

    loadCharacterDatabase();
    gachaData = loadGachaData();

    return {
      success: true,
      gachaFile: gachaBackupFile,
      charactersFile: charactersBackupFile,
    };
  } catch (error) {
    console.error("❌ Lỗi khi phục hồi backup:", error);
    return { success: false, error };
  }
}

function autoConvertFragments(userData) {
  if (!userData.inventory || !Array.isArray(userData.inventory)) return false;

  const fragmentsMap = {};
  const fragmentIds = [];

  userData.inventory.forEach((itemId) => {
    if (typeof itemId !== "string" || !itemId.startsWith("FRAGMENT_")) return;

    const stoneType = itemId.split("_")[1];
    if (!stoneType || !ELEMENTAL_FRAGMENTS[stoneType]) return;

    if (!fragmentsMap[stoneType]) fragmentsMap[stoneType] = [];
    fragmentsMap[stoneType].push(itemId);
    fragmentIds.push(itemId);
  });

  let changed = false;

  Object.entries(fragmentsMap).forEach(([stoneType, ids]) => {
    const fullStoneCount = Math.floor(ids.length / 10);
    if (fullStoneCount > 0) {
      const fragmentsToRemove = ids.slice(0, fullStoneCount * 10);
      userData.inventory = userData.inventory.filter(
        (id) => !fragmentsToRemove.includes(id)
      );

      for (let i = 0; i < fullStoneCount; i++) {
        const stoneId = createStone(stoneType);
        userData.inventory.push(stoneId);

        console.log(
          `Auto-combined 10 ${stoneType} fragments into a complete stone: ${stoneId}`
        );
        changed = true;
      }
    }
  });

  return changed;
}
function listBackups() {
  try {
    const backupDir = path.join(__dirname, "./json/backups");
    if (!fs.existsSync(backupDir)) {
      return { success: false, reason: "no_backup_dir" };
    }

    const files = fs.readdirSync(backupDir);

    // Lọc và nhóm các file backup theo cặp
    const backups = [];
    const gachaFiles = files.filter((f) => f.startsWith("gacha_"));

    gachaFiles.forEach((gachaFile) => {
      const timestamp = gachaFile.match(/\d+(?=\.json)/);
      if (!timestamp) return;

      const charactersFile = files.find(
        (f) => f.startsWith("characters_") && f.includes(timestamp[0])
      );

      if (charactersFile) {
        const dateMatch = gachaFile.match(/\d{4}-\d{2}-\d{2}/);
        const type = gachaFile.startsWith("gacha_manual_")
          ? "Thủ công"
          : gachaFile.startsWith("gacha_auto_")
          ? "Tự động"
          : gachaFile.startsWith("gacha_update_")
          ? "Cập nhật"
          : "Hàng ngày";

        backups.push({
          id: timestamp[0],
          date: dateMatch ? dateMatch[0] : "Unknown",
          time: new Date(parseInt(timestamp[0]) * 1000).toLocaleTimeString(),
          type: type,
          files: [gachaFile, charactersFile],
        });
      }
    });

    // Sắp xếp theo thời gian, mới nhất lên đầu
    backups.sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return { success: true, backups };
  } catch (error) {
    console.error("Lỗi khi liệt kê backups:", error);
    return { success: false, error };
  }
}

function upgradeCharacter(charId1, charId2, userData, forceType = null) {
  const char1 = CHARACTER_IDS[charId1];
  const char2 = CHARACTER_IDS[charId2];

  if (!char1 || !char2) {
    return { success: false, reason: "character_not_found" };
  }

  if (char1.name !== char2.name) {
    return { success: false, reason: "different_characters" };
  }

  const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char1.name)
    ? 5
    : CHARACTER_RATINGS.FOUR_STAR.includes(char1.name)
    ? 4
    : 3;

  if (rarity === 3) {
    return { success: false, reason: "cannot_upgrade_3star" };
  }

  const currentStar = char1.starLevel || parseInt(rarity);
  const maxStar = rarity === 5 ? 12 : 8;

  const level1 = char1.level || 1;
  const maxLevel = CHARACTER_LEVELS[rarity]?.maxLevel || 10;

  // Determine upgrade type
  let upgradeType = forceType;
  if (!upgradeType) {
    upgradeType = level1 >= maxLevel ? "star" : "level";
  }

  // Remove characters from inventory
  userData.inventory = userData.inventory.filter(
    (id) => id !== charId1 && id !== charId2
  );

  // Handle star evolution
  if (upgradeType === "star" && currentStar < maxStar) {
    const newCharId = generateCharacterId();
    const newStar = currentStar + 1;
    const baseStats = char1.stats || { atk: 100, def: 100, hp: 500 };
    const isLimited = PREMIUM_FIVE_STARS.includes(char1.name);

    const bonusMultiplier = isLimited
      ? 1 + (newStar - 4) * 0.8 // Limited gets 80% per star
      : 1 + (newStar - 4) * 0.5; // Normal gets 50% per star

    CHARACTER_IDS[newCharId] = {
      name: char1.name,
      obtainedAt: Date.now(),
      starLevel: newStar,
      level: Math.max(char1.level || 1, char2.level || 1),
      value:
        (char1.value || (rarity === 5 ? 1000000 : 10000)) *
        (isLimited ? 3 : 2) *
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

    userData.inventory.push(newCharId);
    saveCharacterDatabase();

    return {
      success: true,
      type: "evolved",
      charId: newCharId,
      oldStar: currentStar,
      newStar: newStar,
    };
  }

  // Handle level fusion
  if (upgradeType === "level" && level1 < maxLevel) {
    const newCharId = generateCharacterId();
    const level2 = char2.level || 1;
    const bonusLevel = Math.floor(level2 * 0.3);
    const newLevel = Math.min(maxLevel, level1 + 1 + bonusLevel);

    const statMultiplier = CHARACTER_LEVELS[rarity].baseStats;
    const baseStats = char1.stats || { atk: 100, def: 100, hp: 500 };
    const bonusStats =
      level2 > 1 ? { atk: 50, def: 30, hp: 100 } : { atk: 0, def: 0, hp: 0 };

    CHARACTER_IDS[newCharId] = {
      name: char1.name,
      obtainedAt: Date.now(),
      starLevel: currentStar,
      level: newLevel,
      value: char1.value * (1 + (newLevel - level1) * 0.2),
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
    };

    userData.inventory.push(newCharId);
    saveCharacterDatabase();

    return {
      success: true,
      type: "fused",
      charId: newCharId,
      oldLevel: level1,
      newLevel: newLevel,
    };
  }

  // Return characters if upgrade not possible
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
.gacha trade - Giao dịch nhân vật
.gacha upgrade <ID1> <ID2> - Nâng cấp nhân vật
.gacha levelup - Tăng cấp nhân vật
.gacha const - mở khóa chòm sao
.gacha spity - Xem thông tin pity
💰 Giá mở: ${PULL_COST}$ /lần
⭐ Tỉ lệ: 5★ (${RATES.FIVE_STAR}%) | 4★ (${RATES.FOUR_STAR}%) | 3★ (${RATES.THREE_STAR}%)
🔥 THÔNG TIN HẤP DẪN 🔥
• Nhân vật 5★ hiếm có giá trị lên đến 500 TRIỆU $
• Nhân vật 4★ có giá trị từ 10.000 - 40.000 $`,

    auction: `🔨 HƯỚNG DẪN ĐẤU GIÁ NHÂN VẬT 🔨
───────────────
1️⃣ ĐĂNG BÁN ĐẤU GIÁ:
- Lệnh: .gacha auction #ID <giá_khởi_điểm> [thời_gian]
- Ví dụ: .gacha auction #1234 50000 60
- Thời gian tùy chọn (phút), mặc định 60 phút

2️⃣ ĐẶT GIÁ:
- Lệnh: .gacha bid <ID_phiên> <số_tiền>
- Ví dụ: .gacha bid abc123 55000

3️⃣ XEM CHI TIẾT PHIÊN:
- Lệnh: .gacha ainfo <ID_phiên>
- Xem thông tin chi tiết phiên đấu giá

4️⃣ XEM DANH SÁCH PHIÊN ĐANG DIỄN RA:
- Lệnh: .gacha alist
- Hiển thị các phiên đấu giá đang hoạt động

💰 Giá khởi điểm tối thiểu: 1,000$
⚠️ Người thắng phải trả tiền trong thời hạn 5 phút
💎 Mỗi lần đặt giá phải cao hơn giá hiện tại ít nhất 5%
🔥 Có hệ thống gia hạn tự động khi đấu giá sôi nổi`,

    upgrade: `🌟 HƯỚNG DẪN TIẾN HÓA NHÂN VẬT 🌟
───────────────
📋 Các bước tiến hóa:
1⃣ Chọn hai nhân vật CÙNG LOẠI
2⃣ Chọn đá tiến hóa CÙNG NGUYÊN TỐ với nhân vật
3⃣ Sử dụng lệnh: .gacha upgrade #ID1 #ID2 #ID_ĐÁ

🔄 Ví dụ: .gacha upgrade #1234 #5678 #9012

💎 VỀ ĐÁ TIẾN HÓA:
• Mỗi nhân vật cần đá cùng nguyên tố (🔥 Pyro, 💧 Hydro...)
• Brilliant Diamond 💎 dùng được cho MỌI nhân vật
• Đá có thể kết hợp từ 10 mảnh đá

⬆️ GIỚI HẠN TIẾN HÓA:
• Nhân vật 4★: Tối đa 8 sao ⭐⭐⭐⭐⭐⭐⭐⭐
• Nhân vật 5★: Tối đa 10 sao ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
• Mỗi lần tiến hóa tăng thêm 1 sao

🧮 LỢI ÍCH TIẾN HÓA:
• Chỉ số tăng x1.5 mỗi sao
• Giá trị tăng x2 mỗi sao
• Sức mạnh PVP tăng đáng kể

⚠️ LƯU Ý QUAN TRỌNG: Cả hai nhân vật và đá tiến hóa đều sẽ bị mất sau khi tiến hóa thành công!`,
    levelup: `📊 HƯỚNG DẪN NÂNG CẤP NHÂN VẬT 📊
───────────────
👾 VẬT PHẨM KINH NGHIỆM:
• Hero's Wit - Cung cấp 20,000 EXP (Hiếm)
• Adventurer's Experience - Cung cấp 5,000 EXP (Phổ biến)
• Wanderer's Advice - Cung cấp 1,000 EXP (Thường gặp)

🔄 CÁCH NÂNG CẤP:
1. Thu thập vật phẩm kinh nghiệm từ gacha (10% tỉ lệ)
2. Dùng lệnh: .gacha levelup #ID_NHÂN_VẬT #ID_KINH_NGHIỆM

📈 SO SÁNH VỚI TIẾN HÓA SAO:
• Nâng cấp: Tăng chỉ số nhẹ (+10% mỗi cấp)
• Tiến hóa: Tăng chỉ số mạnh (+50% mỗi sao)

⚠️ GIỚI HẠN CẤP ĐỘ:
• Nhân vật 3★: Tối đa cấp 8
• Nhân vật 4★: Tối đa cấp 8
• Nhân vật 5★: Tối đa cấp 10
• Nhân vật tiến hóa: Cấp tối đa = Số sao + 5

💡 MẸO:
• Nâng cấp trước khi tiến hóa để tối ưu chỉ số
• Tỉ lệ nhận EXP tương tự mảnh đá tiến hóa`,
    trading: `🤝 HƯỚNG DẪN TRAO ĐỔI VẬT PHẨM 🤝
───────────────
1️⃣ TẠNG QUÀ / ĐỀ NGHỊ TRAO ĐỔI:
- Lệnh: .gacha trade #ID_của_bạn [#ID_muốn_đổi] @tên
- Ví dụ tặng quà: .gacha trade #1234 @NguoiNhan
- Ví dụ trao đổi: .gacha trade #1234 #5678 @NguoiNhan

2️⃣ CHẤP NHẬN / TỪ CHỐI:
- Chấp nhận: .gacha accept <mã_giao_dịch>
- Từ chối: .gacha decline <mã_giao_dịch>

📝 CÁC LOẠI VẬT PHẨM CÓ THỂ TRAO ĐỔI:
• Nhân vật (mọi độ hiếm)
• Đá tiến hóa và mảnh đá
• Vật phẩm kinh nghiệm

⚠️ HẠN CHẾ:
• Thẻ Limited/Premium chỉ có thể bán qua đấu giá

⏱️ THỜI HẠN CHẤP NHẬN:
• Mỗi đề nghị trao đổi có hiệu lực trong 5 phút
• Sau thời gian này, đề nghị sẽ tự động hết hạn

⚠️ LƯU Ý:
• Trao đổi với chênh lệch giá trị lớn sẽ có cảnh báo
• Vật phẩm sẽ được chuyển ngay khi giao dịch hoàn tất
• Không thể hủy sau khi đã chấp nhận
• Nên xem kỹ các vật phẩm trước khi trao đổi`,
constellation: `🌟 HƯỚNG DẪN CONSTELLATION (CHÒM SAO) 🌟
───────────────
📝 GIỚI THIỆU:
• Constellation là hệ thống nâng cấp đặc biệt cho nhân vật
• Mở khóa constellation tăng sức mạnh và mở kỹ năng đặc biệt
• Mỗi nhân vật có tối đa 6 constellation (C1-C6)

💎 STELLA FORTUNA:
• Stella Fortuna là vật phẩm dùng để mở khóa constellation
• Nhận được khi pull nhân vật trùng hoặc từ hệ thống pity
• Có 2 loại: Stella Fortuna thường và Universal Stella hiếm

📊 LỢI ÍCH:
• C1-C2: Tăng hiệu suất chiến đấu cơ bản (+15-20%)
• C3-C4: Tăng cấp kỹ năng và mở khóa hiệu ứng mạnh (+25-30%)
• C5-C6: Tăng sức mạnh đáng kể và mở khóa tiềm năng tối đa (+40-50%)

⚔️ SỨC MẠNH:
• ATK, DEF, HP tăng theo phần trăm tương ứng
• Hiệu ứng đặc biệt dựa trên nhân vật
• Giá trị nhân vật tăng đáng kể

❓ CÁCH SỬ DỤNG:
1. Kiểm tra kho đồ: .gacha inv
2. Xác định ID nhân vật (#1234) và ID Stella (#5678)
3. Mở khóa constellation: .gacha const #1234 #5678

⚠️ LƯU Ý:
• Mỗi constellation chỉ có thể mở khóa theo thứ tự (C1→C2→C3...)
• Stella được dùng sẽ biến mất sau khi mở khóa
• Mỗi nhân vật chỉ sử dụng được Stella của chính nó hoặc Universal Stella
• Xem thông tin pity Stella với lệnh: .gacha spity`,
  };
}
module.exports = {
  name: "gacha",
  dev: "HNT",
  usedby: 0,
  onPrefix: true,
  category: "Games",
  usages: ".gacha [pull/auction/info/help]",
  cooldowns: 5,
  onLoad: function () {
    createBackup("startup");

    if (Object.keys(CHARACTER_IDS).length === 0) {
      console.log("⚠️ CẢNH BÁO: CHARACTER_IDS trống, thử phục hồi từ backup");
      const result = restoreFromBackup();
      if (result.success) {
        console.log("✅ Đã tự động phục hồi dữ liệu từ backup");
      } else {
        console.error("❌ Không thể tự động phục hồi dữ liệu");
      }
    }

    setInterval(() => createBackup("daily"), 24 * 60 * 60 * 1000);
    setInterval(() => createBackup("auto"), 4 * 60 * 60 * 1000);
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
          ".gacha help auction - Hướng dẫn đấu giá\n" +
          ".gacha help upgrade - Hướng dẫn nâng cấp" +
          ".gacha help levelup - Hướng dẫn nâng cấp bằng EXP" +
          ".gacha help trade - Hướng dẫn trao đổi vật phẩm" +
          ".gacha help const - Hướng dẫn hệ thống constellation",
        threadID,
        messageID
      );
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
        levelup: "levelup",
        level: "levelup",
      }[target[0]?.toLowerCase()] || target[0];

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
              isFragment: isFragment,
            });

            return api.sendMessage(
              {
                body:
                  `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                  `${stone.emoji} ${stone.name}\n` +
                  `📝 ${stone.description}\n` +
                  `💎 ${isFragment ? "Mảnh đá" : "Đá"} tiến hóa nguyên tố ${
                    stone.element
                  }\n` +
                  `${
                    isFragment
                      ? "🧩 Cần 10 mảnh để ghép thành đá hoàn chỉnh\n"
                      : ""
                  }` +
                  `💰 Giá trị: $${stone.value.toLocaleString()}\n\n` +
                  `🔮 ID: #${pullResult.charId
                    .replace(isFragment ? "FRAGMENT_" : "STONE_", "")
                    .slice(-4)}\n` +
                  `❓ Dùng .gacha inv để xem các ${
                    isFragment ? "mảnh đá" : "đá"
                  } tiến hóa`,
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
        if (pullResult.isExpItem) {
          const expItem = CHARACTER_IDS[pullResult.charId];
          if (!expItem)
            return api.sendMessage(
              "❌ Lỗi: Không tìm thấy vật phẩm!",
              threadID,
              messageID
            );

          userData.inventory.push(pullResult.charId);
          saveGachaData(gachaData);

          try {
            const expItemImage = await createExpItemResultImage({
              userId: senderID,
              userName,
              expItem: expItem,
              expValue: expItem.expValue,
              description: expItem.description,
              itemRarity: expItem.rarity,
              itemValue: expItem.value,
            });

            return api.sendMessage(
              {
                body:
                  `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                  `📚 ${expItem.name}\n` +
                  `📝 ${expItem.description}\n` +
                  `⭐ Độ hiếm: ${expItem.rarity}★\n` +
                  `📊 EXP: +${expItem.expValue.toLocaleString()}\n` +
                  `💰 Giá trị: $${expItem.value.toLocaleString()}\n\n` +
                  `🔮 ID: #${pullResult.charId
                    .replace("EXP_", "")
                    .slice(-4)}\n` +
                  `❓ Dùng .gacha levelup #ID_NHÂN_VẬT #${pullResult.charId.slice(
                    -4
                  )} để nâng cấp nhân vật`,
                attachment: fs.createReadStream(expItemImage),
              },
              threadID,
              () => fs.unlinkSync(expItemImage),
              messageID
            );
          } catch (error) {
            console.error("Error displaying EXP item:", error);
            return api.sendMessage(
              `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                `📚 ${expItem.name}\n` +
                `📝 ${expItem.description}\n` +
                `⭐ Độ hiếm: ${expItem.rarity}★\n` +
                `📊 EXP: +${expItem.expValue.toLocaleString()}\n` +
                `💰 Giá trị: $${expItem.value.toLocaleString()}\n\n` +
                `🔮 ID: #${pullResult.charId.replace("EXP_", "").slice(-4)}\n` +
                `❓ Dùng .gacha levelup #ID_NHÂN_VẬT #${pullResult.charId.slice(
                  -4
                )} để nâng cấp nhân vật`,
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
          if (!userData.threeStarCount) {
            userData.threeStarCount = 0;
          }
          userData.threeStarCount++;
          await updateBalance(senderID, 200);
          if (userData.threeStarCount >= 20) {
            userData.threeStarCount = 0;
            const elements = Object.keys(ELEMENTAL_FRAGMENTS).filter(
              (e) => e !== "UNIVERSAL"
            );
            const randomElement =
              elements[Math.floor(Math.random() * elements.length)];
            const fragmentId = createStoneFragment(randomElement);
            userData.inventory.push(fragmentId);
            setTimeout(() => {
              const fragment = CHARACTER_IDS[fragmentId];
              api.sendMessage(
                `🎁 PHẦN THƯỞNG ĐẶC BIỆT! 🎁\n\n` +
                  `Bạn đã nhận đủ 20 nhân vật 3★!\n` +
                  `Nhận được: 1 ${fragment.emoji} ${fragment.name}\n` +
                  `Mô tả: ${fragment.description}\n` +
                  `ID: #${fragmentId.slice(-4)}\n\n` +
                  `💡 Hệ thống sẽ tự động tích lũy tiếp tục`,
                threadID
              );
            }, 2000);
            if (pullResult.isStella) {
              const stellaItem = CHARACTER_IDS[pullResult.charId];
              if (!stellaItem) {
                return api.sendMessage(
                  "❌ Lỗi: Không tìm thấy vật phẩm Stella Fortuna!",
                  threadID,
                  messageID
                );
              }
            
              try {
                // Tạo ảnh Stella Fortuna
                const stellaImage = await createStellaResultImage({
                  userId: senderID,
                  userName,
                  stella: stellaItem,
                  originalChar: pullResult.originalChar,
                  isUniversal: stellaItem.isUniversal
                });
            
                // Hiển thị thông báo kèm ảnh
                return api.sendMessage(
                  {
                    body: `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                          `✨ BẠN ĐÃ NHẬN ĐƯỢC STELLA FORTUNA! ${pullResult.isPity ? '(PITY)' : ''}\n` +
                          `📝 Chìa khóa cho chòm sao: ${pullResult.originalChar}\n` +
                          `${pullResult.isPity ? '🎯 Kích hoạt từ hệ thống pity!\n' : ''}` +
                          `💡 Dùng lệnh ".gacha const #ID-NHÂN-VẬT #ID-STELLA" để mở khóa chòm sao\n\n` +
                          `⭐ Độ hiếm: 5★\n` +
                          `💰 Giá trị: $${stellaItem.value.toLocaleString()}\n` +
                          `🔮 ID: #${pullResult.charId.slice(-4)}`,
                    attachment: fs.createReadStream(stellaImage),
                  },
                  threadID,
                  () => fs.unlinkSync(stellaImage),
                  messageID
                );
              } catch (error) {
                // Fallback nếu có lỗi
                console.error("Error displaying Stella Fortuna:", error);
                return api.sendMessage(
                  `🎮 KẾT QUẢ GACHA 🎮\n\n` +
                  `✨ Bạn đã nhận được Stella Fortuna cho ${pullResult.originalChar}!\n` +
                  `${pullResult.isPity ? '🎯 Kích hoạt từ hệ thống pity!\n' : ''}` +
                  `📝 Dùng Stella để mở khóa chòm sao cho nhân vật\n` +
                  `💰 Giá trị: $${stellaItem.value.toLocaleString()}`,
                  threadID,
                  messageID
                );
              }
            }
          }
        } else {
          console.log(
            `Đang thêm nhân vật ${characterName} (${charId}) vào inventory của ${senderID}`
          );
          console.log(
            `Inventory trước khi thêm: ${userData.inventory.length} items`
          );

          userData.inventory.push(charId);

          saveGachaData(gachaData);

          console.log(
            `Đã thêm ${characterName} (${charId}) vào inventory của ${senderID}`
          );
          console.log(
            `Inventory sau khi thêm: ${userData.inventory.length} items`
          );
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
            isEvolved: CHARACTER_IDS[charId].isEvolved || false,
            isMaxEvolved: CHARACTER_IDS[charId].isMaxEvolved || false,
          },
          rarity: charRarity,
          starLevel: CHARACTER_IDS[charId].starLevel,
          evolvedStars: pullResult.evolvedStars,
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
      case "help": {
        const type = target[1]?.toLowerCase();
        const help = getDetailedHelp();

        if (type === "trade" || type === "trading") {
          return api.sendMessage(help.trading, threadID, messageID);
        } else if (type === "auction") {
          return api.sendMessage(help.auction, threadID, messageID);
        } else if (type === "upgrade" || type === "evolve") {
          return api.sendMessage(help.upgrade, threadID, messageID);
        } else if (type === "levelup" || type === "level" || type === "exp") {
          return api.sendMessage(help.levelup, threadID, messageID);
        } else if (type === "constellation" || type === "const") {
          return api.sendMessage(help.constellation, threadID, messageID);
        } else {
          return api.sendMessage(help.basic, threadID, messageID);
        }
      }
      case "info": {
        const currentRates = calculateDynamicRates(userData);
        return api.sendMessage(
          "📊 THÔNG TIN TỈ LỆ GACHA 📊\n" +
            "───────────────\n\n" +
            `💰 Giá: ${PULL_COST} $/lần mở\n\n` +
            "🎯 Tỉ lệ hiện tại:\n" +
            `5⭐: ${currentRates.FIVE_STAR.toFixed(2)}%\n` +
            `4⭐ Tiến hóa: ${currentRates.EVOLVED_FOUR_STAR.toFixed(2)}%\n` +
            `4⭐: ${currentRates.FOUR_STAR.toFixed(2)}%\n` +
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
      case "trade": {
        const mention = Object.keys(event.mentions)[0];
        if (!mention) {
          return api.sendMessage(
            "❌ Bạn phải tag người để trao đổi!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha trade #ID_của_bạn #ID_muốn_đổi @tên\n" +
              "Ví dụ: .gacha trade #1234 #5678 @MinhAnh\n\n" +
              "💡 Để tặng quà (không yêu cầu vật phẩm), bỏ qua #ID_muốn_đổi",
            threadID,
            messageID
          );
        }

        if (mention === senderID) {
          return api.sendMessage(
            "❌ Bạn không thể trao đổi với chính mình!",
            threadID,
            messageID
          );
        }

        if (!target[1]) {
          return api.sendMessage(
            "❌ Bạn phải chỉ định ID vật phẩm muốn đưa ra!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha trade #ID_của_bạn [#ID_muốn_đổi] @tên\n\n" +
              "💡 Dùng .gacha inv để xem ID vật phẩm của bạn",
            threadID,
            messageID
          );
        }

        if (!gachaData[mention]) {
          return api.sendMessage(
            "❌ Người được tag chưa tham gia hệ thống gacha!",
            threadID,
            messageID
          );
        }

        const targetUserData = gachaData[mention];

        const offerInputId = target[1].replace(/[^\d]/g, "");
        let foundOfferId = null;
        for (const itemId of userData.inventory) {
          if (itemId.endsWith(offerInputId) || itemId.includes(offerInputId)) {
            foundOfferId = itemId;
            break;
          }
        }

        if (!foundOfferId) {
          return api.sendMessage(
            `❌ Không tìm thấy vật phẩm với ID #${offerInputId} trong kho đồ của bạn!\n\n` +
              "💡 Dùng .gacha inv để xem lại danh sách vật phẩm",
            threadID,
            messageID
          );
        }

        let requestedItemId = null;
        if (target[2] && target[2].startsWith("#")) {
          const requestInputId = target[2].replace(/[^\d]/g, "");
          for (const itemId of targetUserData.inventory) {
            if (
              itemId.endsWith(requestInputId) ||
              itemId.includes(requestInputId)
            ) {
              requestedItemId = itemId;
              break;
            }
          }

          if (!requestedItemId) {
            return api.sendMessage(
              `❌ Không tìm thấy vật phẩm với ID #${requestInputId} trong kho đồ của đối phương!\n\n` +
                "💡 Họ có thể chưa sở hữu vật phẩm này",
              threadID,
              messageID
            );
          }
        }

        const offerItem = CHARACTER_IDS[foundOfferId];
        const requestItem = requestedItemId
          ? CHARACTER_IDS[requestedItemId]
          : null;

        if (
          foundOfferId.startsWith("CHAR_") &&
          PREMIUM_FIVE_STARS.includes(offerItem.name)
        ) {
          return api.sendMessage(
            "❌ KHÔNG THỂ TRAO ĐỔI THẺ LIMITED!\n\n" +
              `Nhân vật ${offerItem.name} là thẻ Limited/Premium đặc biệt.\n` +
              `Thẻ Limited chỉ có thể được bán thông qua hệ thống đấu giá.\n\n` +
              "💡 Sử dụng: .gacha auction #ID <giá_khởi_điểm> để đấu giá thẻ này.",
            threadID,
            messageID
          );
        }

        if (requestedItemId) {
          const requestItem = CHARACTER_IDS[requestedItemId];
          if (
            requestedItemId.startsWith("CHAR_") &&
            PREMIUM_FIVE_STARS.includes(requestItem.name)
          ) {
            return api.sendMessage(
              "❌ KHÔNG THỂ YÊU CẦU THẺ LIMITED!\n\n" +
                `Nhân vật ${requestItem.name} là thẻ Limited/Premium đặc biệt.\n` +
                `Thẻ Limited chỉ có thể được mua thông qua hệ thống đấu giá.\n\n` +
                "💡 Hãy tham gia các phiên đấu giá để có cơ hội sở hữu thẻ này.",
              threadID,
              messageID
            );
          }
        }
        if (!offerItem) {
          return api.sendMessage(
            "❌ Lỗi: Không tìm thấy thông tin vật phẩm!",
            threadID,
            messageID
          );
        }

        const targetUserName = await getUserName(mention);

        let offerDescription = "";
        if (foundOfferId.startsWith("CHAR_")) {
          const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(offerItem.name)
            ? "5★"
            : CHARACTER_RATINGS.FOUR_STAR.includes(offerItem.name)
            ? "4★"
            : "3★";
          offerDescription = `• Nhân vật: ${offerItem.name} (${rarity})\n`;
        } else if (foundOfferId.startsWith("STONE_")) {
          offerDescription = `• Đá tiến hóa: ${offerItem.name}\n`;
        } else if (foundOfferId.startsWith("FRAGMENT_")) {
          offerDescription = `• Mảnh đá: ${offerItem.name}\n`;
        } else if (foundOfferId.startsWith("EXP_")) {
          offerDescription = `• Vật phẩm EXP: ${offerItem.name}\n`;
        }
        offerDescription += `• ID: #${foundOfferId.slice(-4)}\n`;
        offerDescription += `• Giá trị: $${offerItem.value.toLocaleString()}\n`;

        let requestDescription = "";
        if (requestItem) {
          if (requestedItemId.startsWith("CHAR_")) {
            const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(
              requestItem.name
            )
              ? "5★"
              : CHARACTER_RATINGS.FOUR_STAR.includes(requestItem.name)
              ? "4★"
              : "3★";
            requestDescription = `• Nhân vật: ${requestItem.name} (${rarity})\n`;
          } else if (requestedItemId.startsWith("STONE_")) {
            requestDescription = `• Đá tiến hóa: ${requestItem.name}\n`;
          } else if (requestedItemId.startsWith("FRAGMENT_")) {
            requestDescription = `• Mảnh đá: ${requestItem.name}\n`;
          } else if (requestedItemId.startsWith("EXP_")) {
            requestDescription = `• Vật phẩm EXP: ${requestItem.name}\n`;
          }
          requestDescription += `• ID: #${requestedItemId.slice(-4)}\n`;
          requestDescription += `• Giá trị: $${requestItem.value.toLocaleString()}\n\n`;
        }

        let warningMessage = "";
        if (
          requestItem &&
          Math.abs(offerItem.value - requestItem.value) > 100000
        ) {
          warningMessage =
            "⚠️ CẢNH BÁO: Giao dịch có chênh lệch giá trị đáng kể!\n\n";
        }

        const tradeId = `TRADE_${Date.now()}_${Math.floor(
          Math.random() * 1000
        )}`;
        const shortId = String(Math.floor(Math.random() * 1000)).padStart(
          3,
          "0"
        );

        activeTrades.set(tradeId, {
          id: tradeId,
          shortId: shortId,
          from: senderID,
          to: mention,
          offer: foundOfferId,
          request: requestedItemId,
          timestamp: Date.now(),
          expiry: Date.now() + 5 * 60 * 1000,
          status: "pending",
        });

        api.sendMessage(
          `${warningMessage}🤝 ĐỀ NGHỊ TRAO ĐỔI 🤝\n` +
            `━━━━━━━━━━━━━━━━━\n\n` +
            `👤 Người đề nghị: ${userName}\n` +
            `👤 Người nhận: ${targetUserName}\n\n` +
            `📦 BẠN SẼ TẶNG:\n` +
            (requestDescription || "• Không có\n\n") +
            `📦 BẠN SẼ NHẬN:\n` +
            offerDescription +
            "\n" +
            `⏰ Thời hạn: 5 phút\n` +
            `🔖 Mã giao dịch: ${shortId}\n\n` +
            `💡 Để chấp nhận, hãy gõ:\n` +
            `.gacha accept ${shortId}\n\n` +
            `❌ Để từ chối, hãy gõ:\n` +
            `.gacha decline ${shortId}`,
          mention
        );

        return api.sendMessage(
          `✅ ĐÃ GỬI ĐỀ NGHỊ TRAO ĐỔI!\n\n` +
            `📦 Vật phẩm đề nghị: ${offerItem.name}\n` +
            `📦 Vật phẩm yêu cầu: ${
              requestItem ? requestItem.name : "Không có (quà tặng)"
            }\n` +
            `👤 Đến người chơi: ${targetUserName}\n\n` +
            `⏰ Thời hạn: 5 phút\n` +
            `🔖 Mã giao dịch: ${shortId}\n\n` +
            `💡 Đề nghị sẽ tự động hủy sau thời hạn.`,
          threadID,
          messageID
        );
      }

      case "accept": {
        if (!target[1]) {
          return api.sendMessage(
            "❌ Bạn phải cung cấp mã giao dịch!\n" +
              "Cách dùng: .gacha accept MÃ_GIAO_DỊCH",
            threadID,
            messageID
          );
        }

        const shortId = target[1];
        const tradeId = [...activeTrades.keys()].find(
          (id) => activeTrades.get(id).shortId === shortId
        );

        if (!tradeId) {
          return api.sendMessage(
            "❌ Không tìm thấy giao dịch với mã này hoặc giao dịch đã hết hạn!",
            threadID,
            messageID
          );
        }

        const trade = activeTrades.get(tradeId);

        if (trade.to !== senderID) {
          return api.sendMessage(
            "❌ Bạn không phải là người được đề nghị trao đổi!",
            threadID,
            messageID
          );
        }

        if (trade.expiry < Date.now()) {
          activeTrades.delete(tradeId);
          return api.sendMessage(
            "❌ Giao dịch đã hết hạn!",
            threadID,
            messageID
          );
        }

        const fromUserData = gachaData[trade.from];
        const toUserData = gachaData[trade.to];

        if (!fromUserData.inventory.includes(trade.offer)) {
          activeTrades.delete(tradeId);
          return api.sendMessage(
            "❌ Vật phẩm đã không còn trong kho đồ của người đề nghị!",
            threadID,
            messageID
          );
        }

        if (trade.request && !toUserData.inventory.includes(trade.request)) {
          activeTrades.delete(tradeId);
          return api.sendMessage(
            "❌ Vật phẩm yêu cầu không còn trong kho đồ của bạn!",
            threadID,
            messageID
          );
        }

        const [fromUserName, toUserName] = await Promise.all([
          getUserName(trade.from),
          getUserName(trade.to),
        ]);

        fromUserData.inventory = fromUserData.inventory.filter(
          (id) => id !== trade.offer
        );
        toUserData.inventory.push(trade.offer);

        if (trade.request) {
          toUserData.inventory = toUserData.inventory.filter(
            (id) => id !== trade.request
          );
          fromUserData.inventory.push(trade.request);
        }

        trade.status = "accepted";
        trade.completedAt = Date.now();
        saveGachaData(gachaData);

        let offerDescription = "";
        const offerItem = CHARACTER_IDS[trade.offer];
        if (trade.offer.startsWith("CHAR_")) {
          const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(offerItem.name)
            ? "5★"
            : CHARACTER_RATINGS.FOUR_STAR.includes(offerItem.name)
            ? "4★"
            : "3★";
          offerDescription = `• Nhân vật: ${offerItem.name} (${rarity})\n`;
        } else if (trade.offer.startsWith("STONE_")) {
          offerDescription = `• Đá tiến hóa: ${offerItem.name}\n`;
        } else if (trade.offer.startsWith("FRAGMENT_")) {
          offerDescription = `• Mảnh đá: ${offerItem.name}\n`;
        } else {
          offerDescription = `• Vật phẩm: ${offerItem.name}\n`;
        }
        offerDescription += `• ID: #${trade.offer.slice(-4)}\n`;
        offerDescription += `• Giá trị: $${offerItem.value.toLocaleString()}\n\n`;

        let requestDescription = "";
        if (trade.request) {
          const requestItem = CHARACTER_IDS[trade.request];
          if (trade.request.startsWith("CHAR_")) {
            const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(
              requestItem.name
            )
              ? "5★"
              : CHARACTER_RATINGS.FOUR_STAR.includes(requestItem.name)
              ? "4★"
              : "3★";
            requestDescription = `• Nhân vật: ${requestItem.name} (${rarity})\n`;
          } else if (trade.request.startsWith("STONE_")) {
            requestDescription = `• Đá tiến hóa: ${requestItem.name}\n`;
          } else if (trade.request.startsWith("FRAGMENT_")) {
            requestDescription = `• Mảnh đá: ${requestItem.name}\n`;
          } else {
            requestDescription = `• Vật phẩm: ${requestItem.name}\n`;
          }
          requestDescription += `• ID: #${trade.request.slice(-4)}\n`;
          requestDescription += `• Giá trị: $${requestItem.value.toLocaleString()}\n\n`;
        }

        api.sendMessage(
          `✅ TRAO ĐỔI THÀNH CÔNG! ✅\n` +
            `━━━━━━━━━━━━━━━━━\n\n` +
            `👤 ${fromUserName} đã nhận được:\n` +
            (requestDescription || "• Không có\n\n") +
            `👤 ${toUserName} đã nhận được:\n` +
            offerDescription +
            `🤝 Giao dịch hoàn tất!`,
          threadID,
          messageID
        );

        api.sendMessage(
          `✅ GIAO DỊCH CỦA BẠN ĐÃ ĐƯỢC CHẤP NHẬN!\n\n` +
            `👤 ${toUserName} đã chấp nhận đề nghị trao đổi của bạn\n\n` +
            `📦 Bạn đã nhận: ${
              trade.request ? CHARACTER_IDS[trade.request].name : "Không có"
            }\n` +
            `📦 Bạn đã tặng: ${offerItem.name}\n\n` +
            `⏱️ Thời gian: ${new Date().toLocaleString()}`,
          trade.from
        );

        activeTrades.delete(tradeId);
        return;
      }

      case "decline": {
        if (!target[1]) {
          return api.sendMessage(
            "❌ Bạn phải cung cấp mã giao dịch!\n" +
              "Cách dùng: .gacha decline MÃ_GIAO_DỊCH",
            threadID,
            messageID
          );
        }

        const shortId = target[1];
        const tradeId = [...activeTrades.keys()].find(
          (id) => activeTrades.get(id).shortId === shortId
        );

        if (!tradeId) {
          return api.sendMessage(
            "❌ Không tìm thấy giao dịch với mã này hoặc giao dịch đã hết hạn!",
            threadID,
            messageID
          );
        }

        const trade = activeTrades.get(tradeId);

        if (trade.to !== senderID && trade.from !== senderID) {
          return api.sendMessage(
            "❌ Bạn không liên quan đến giao dịch này!",
            threadID,
            messageID
          );
        }

        api.sendMessage("❌ Giao dịch đã bị từ chối.", threadID, messageID);

        if (senderID !== trade.from) {
          api.sendMessage(
            `❌ ${userName} đã từ chối đề nghị trao đổi của bạn.`,
            trade.from
          );
        }

        activeTrades.delete(tradeId);
        return;
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
                if (
                  charId.startsWith("CHAR_") &&
                  (charId.endsWith(inputId) || charId.includes(inputId))
                ) {
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
                teamInfo +
                "\n" +
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
              const cooldownLeft =
                PVP_COOLDOWN - (Date.now() - userData.pvpStats.lastBattle);
              if (cooldownLeft > 0) {
                return api.sendMessage(
                  `⏳ Vui lòng đợi ${Math.ceil(
                    cooldownLeft / 1000
                  )} giây nữa để thách đấu tiếp!`,
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
            const challengeId = createPvpChallenge(
              senderID,
              mention,
              userData.pvpTeam
            );

            const mentionName = event.mentions[mention].replace("@", "");

            return api.sendMessage(
              `⚔️ THÁCH ĐẤU PVP ⚔️\n\n` +
                `👤 ${userName} đã thách đấu ${mentionName}!\n` +
                `💪 Sức mạnh đội hình: ${calculateTeamPower(
                  userData.pvpTeam
                )}\n\n` +
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
            const challengeId = [...activePvpChallenges.keys()].find((id) =>
              id.endsWith(target[2])
            );
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
            setTimeout(() => {
              api.sendMessage(
                "⚔️ TRẬN ĐẤU PVP BẮT ĐẦU! ⚔️\n" + "Đang tính toán kết quả...",
                threadID,
                messageID
              );
            }, 5000);

            // Xóa thách đấu
            activePvpChallenges.delete(challengeId);

            // Tiến hành trận đấu và hiển thị kết quả
            return executePvpBattle(
              api,
              threadID,
              messageID,
              challengeData,
              userData.pvpTeam
            );
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
            const challengeId = [...activePvpChallenges.keys()].find((id) =>
              id.endsWith(target[2])
            );
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
            const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

            // Tính hạng PVP
            let pvpRank = "Tân binh";
            if (wins >= 100) pvpRank = "Huyền thoại";
            else if (wins >= 50) pvpRank = "Bậc thầy";
            else if (wins >= 20) pvpRank = "Chuyên gia";
            else if (wins >= 10) pvpRank = "Chiến binh";
            else if (wins >= 5) pvpRank = "Kinh nghiệm";

            // Tính sức mạnh đội hình
            const teamPower = userData.pvpTeam
              ? calculateTeamPower(userData.pvpTeam)
              : 0;

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
      case "const":
      case "constellation": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "🌟 MỞ KHÓA CHÒM SAO - CONSTELLATION 🌟\n" +
              "───────────────\n\n" +
              "Cách dùng: .gacha const #ID_NHÂN_VẬT #ID_STELLA\n" +
              "Ví dụ: .gacha const #1234 #5678\n\n" +
              "💡 Xem kho đồ: .gacha inv",
            threadID,
            messageID
          );
        }

        const charInputId = target[1].replace(/[^\d]/g, "");
        let foundCharId = null;
        for (const id of userData.inventory) {
          if (
            id.startsWith("CHAR_") &&
            (id.endsWith(charInputId) || id.includes(charInputId))
          ) {
            foundCharId = id;
            break;
          }
        }

        const stellaInputId = target[2].replace(/[^\d]/g, "");
        let foundStellaId = null;
        for (const id of userData.inventory) {
          if (
            id.startsWith("STELLA_") &&
            (id.endsWith(stellaInputId) || id.includes(stellaInputId))
          ) {
            foundStellaId = id;
            break;
          }
        }

        if (!foundCharId) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${charInputId}!\n\n💡 Dùng .gacha inv để xem ID nhân vật`,
            threadID,
            messageID
          );
        }

        if (!foundStellaId) {
          return api.sendMessage(
            `❌ Không tìm thấy Stella Fortuna với ID #${stellaInputId}!\n\n💡 Dùng .gacha inv để xem ID Stella`,
            threadID,
            messageID
          );
        }

        // Tiến hành unlock constellation
        const result = unlockConstellation(foundCharId, foundStellaId);

        if (!result.success) {
          let errorMessage = "❌ Không thể mở khóa chòm sao!";

          if (result.reason === "invalid_items") {
            errorMessage = "❌ Vật phẩm không hợp lệ!";
          } else if (result.reason === "not_constellation_item") {
            errorMessage = "❌ Vật phẩm không phải Stella Fortuna!";
          } else if (result.reason === "incompatible_stella") {
            errorMessage =
              "❌ Stella Fortuna không tương thích với nhân vật này!";
          } else if (result.reason === "max_constellation") {
            errorMessage = "❌ Nhân vật đã đạt cấp độ chòm sao tối đa (C6)!";
          }

          return api.sendMessage(errorMessage, threadID, messageID);
        }

        // Xóa Stella Fortuna khỏi inventory sau khi unlock thành công
        userData.inventory = userData.inventory.filter((id) => id !== foundStellaId);
        saveGachaData(gachaData);

        const char = CHARACTER_IDS[foundCharId];
        const constellationData = CHARACTER_CONSTELLATIONS[char.name];
        const currentCLevel = result.newConstellation;
        const constellationName = constellationData && constellationData[currentCLevel-1] ? 
                                constellationData[currentCLevel-1].name : "Constellation " + currentCLevel;
        
        // Thông báo cá nhân
        api.sendMessage(
          "🌟 MỞ KHÓA CHÒM SAO THÀNH CÔNG! 🌟\n" +
          "━━━━━━━━━━━━━━━━━━━━━\n\n" +
          `👤 Nhân vật: ${result.character}\n` +
          `🌠 Cấp độ chòm sao: C${result.newConstellation}\n` +
          `✨ Hiệu ứng mới: ${result.effect}\n\n` +
          `📊 CHỈ SỐ MỚI:\n` +
          `⚔️ ATK: ${char.stats.atk}\n` +
          `🛡️ DEF: ${char.stats.def}\n` +
          `❤️ HP: ${char.stats.hp}\n\n` +
          `💰 Giá trị mới: $${char.value.toLocaleString()}\n\n` +
          `💡 Stella Fortuna đã được sử dụng.`,
          threadID,
          messageID
        );
        announceConstellationUnlock(
          api, 
          threadID, 
          userName, 
          char.name, 
          result.newConstellation, 
          constellationName,
          result.effect
        );
        
        return;
        }
      case "stellastats":
      case "spity": {
        if (
          !userData.stellaPity ||
          Object.keys(userData.stellaPity).length === 0
        ) {
          return api.sendMessage(
            "🔮 THỐNG KÊ STELLA PITY 🔮\n" +
              "───────────────\n\n" +
              "❌ Bạn chưa có dữ liệu pity cho Stella Fortuna!\n\n" +
              "💡 Pull thêm nhân vật 5★ để tích lũy pity",
            threadID,
            messageID
          );
        }

        // Hiển thị thống kê pity cho từng nhân vật
        let message = "🔮 THỐNG KÊ STELLA PITY 🔮\n";
        message += "───────────────\n\n";
        message += "👤 Nhân vật đang tích lũy:\n\n";

        Object.entries(userData.stellaPity).forEach(([charName, pityCount]) => {
          const isPremium = PREMIUM_FIVE_STARS.includes(charName);
          const pityThreshold = isPremium
            ? STELLA_PITY_THRESHOLD + 1
            : STELLA_PITY_THRESHOLD;
          const stellaChance = Math.min(
            95,
            pityCount * STELLA_PITY_BOOST_PER_FAIL
          );

          message += `• ${charName}: ${pityCount}/${pityThreshold} pulls\n`;
          message += `  💫 Tỉ lệ Stella: ${stellaChance.toFixed(1)}%\n`;
          if (pityCount >= pityThreshold) {
            message += `  ✨ ĐẢM BẢO STELLA KHI PULL 5★ TIẾP THEO!\n`;
          }
          message += "\n";
        });

        message +=
          "💡 Mỗi pull 5★ không được Stella sẽ tăng " +
          `${STELLA_PITY_BOOST_PER_FAIL}% tỉ lệ ra Stella ở pull tiếp theo\n\n` +
          `💎 Tích lũy đủ ${STELLA_PITY_THRESHOLD} pulls sẽ đảm bảo ra Stella`;

        return api.sendMessage(message, threadID, messageID);
      }
      case "bag":
      case "inventory": {
        verifyInventory(senderID);

        const autoConverted = autoConvertFragments(userData);
        if (autoConverted) {
          saveGachaData(gachaData);
        }

        const characters = [];
        const stones = [];
        const fragments = [];
        let totalValue = 0;
        let page = 1;
        const expItems = [];
        
        if (target[1] && !isNaN(target[1])) {
          page = parseInt(target[1]);
        }

        if (
          target[1]?.toLowerCase() === "del" ||
          target[1]?.toLowerCase() === "delete"
        ) {
          if (!target[2]) {
            return api.sendMessage(
              "❌ Thiếu thông tin xóa vật phẩm!\n\n" +
                "📝 Cách dùng:\n" +
                "• Xóa 1 vật phẩm: .gacha inv del #ID\n" +
                "• Xóa nhiều vật phẩm: .gacha inv del #ID1 #ID2...\n" +
                "• Xóa theo sao: .gacha inv del 3s/4s/5s all\n" +
                "• Xóa tất cả: .gacha inv del all\n\n" +
                "⚠️ Lưu ý: Bạn sẽ nhận lại 30% giá trị vật phẩm",
              threadID,
              messageID
            );
          }

          if (
            target[2].toLowerCase().endsWith("s") &&
            target[3]?.toLowerCase() === "all"
          ) {
            const rarity = parseInt(target[2].charAt(0));
            if (![3, 4, 5].includes(rarity)) {
              return api.sendMessage(
                "❌ Độ hiếm không hợp lệ! Chỉ hỗ trợ 3★, 4★ và 5★",
                threadID,
                messageID
              );
            }

            // Tìm các vật phẩm theo độ hiếm
            const itemsToDelete = [];
            let totalRefund = 0;

            userData.inventory.forEach((id) => {
              const item = CHARACTER_IDS[id];
              if (!item || !item.name) return;

              let itemRarity;
              if (id.startsWith("CHAR_")) {
                if (CHARACTER_RATINGS.FIVE_STAR.includes(item.name))
                  itemRarity = 5;
                else if (CHARACTER_RATINGS.FOUR_STAR.includes(item.name))
                  itemRarity = 4;
                else itemRarity = 3;
              }

              if (itemRarity === rarity) {
                itemsToDelete.push({
                  id: id,
                  name: item.name,
                  value: item.value || 0,
                });
                totalRefund += Math.floor((item.value || 0) * 0.3);
              }
            });

            if (itemsToDelete.length === 0) {
              return api.sendMessage(
                `❌ Không tìm thấy vật phẩm ${rarity}★ nào trong kho đồ!`,
                threadID,
                messageID
              );
            }

            // Xác nhận xóa
            return api.sendMessage(
              `⚠️ XÁC NHẬN XÓA TẤT CẢ VẬT PHẨM ${rarity}★?\n\n` +
                `📦 Số lượng: ${itemsToDelete.length} vật phẩm\n` +
                `💰 Tổng giá trị: $${itemsToDelete
                  .reduce((sum, item) => sum + item.value, 0)
                  .toLocaleString()}\n` +
                `💵 Nhận lại: $${totalRefund.toLocaleString()}\n\n` +
                `👉 Để xác nhận, gõ: .gacha inv del ${rarity}s confirm`,
              threadID,
              messageID
            );
          }

          // Xử lý xác nhận xóa theo độ hiếm
          if (
            target[2].toLowerCase().endsWith("s") &&
            target[3]?.toLowerCase() === "confirm"
          ) {
            const rarity = parseInt(target[2].charAt(0));
            if (![3, 4, 5].includes(rarity)) return;

            const itemsToDelete = [];
            let totalRefund = 0;

            userData.inventory = userData.inventory.filter((id) => {
              const item = CHARACTER_IDS[id];
              if (!item || !item.name) return true;

              let itemRarity;
              if (id.startsWith("CHAR_")) {
                if (CHARACTER_RATINGS.FIVE_STAR.includes(item.name))
                  itemRarity = 5;
                else if (CHARACTER_RATINGS.FOUR_STAR.includes(item.name))
                  itemRarity = 4;
                else itemRarity = 3;
              }

              if (itemRarity === rarity) {
                itemsToDelete.push({
                  id: id,
                  name: item.name,
                  value: item.value || 0,
                });
                totalRefund += Math.floor((item.value || 0) * 0.3);
                return false;
              }
              return true;
            });

            await updateBalance(senderID, totalRefund);
            saveGachaData(gachaData);

            return api.sendMessage(
              `✅ ĐÃ XÓA THÀNH CÔNG!\n\n` +
                `📦 Đã xóa: ${itemsToDelete.length} vật phẩm ${rarity}★\n` +
                `💰 Tổng giá trị: $${itemsToDelete
                  .reduce((sum, item) => sum + item.value, 0)
                  .toLocaleString()}\n` +
                `💵 Đã hoàn lại: $${totalRefund.toLocaleString()}\n\n` +
                `📊 Còn lại: ${userData.inventory.length} vật phẩm`,
              threadID,
              messageID
            );
          }
          // Xử lý xóa nhiều vật phẩm
          const itemsToDelete = [];
          let totalRefund = 0;
          const failedIds = [];

          // Thu thập các ID cần xóa
          for (let i = 2; i < target.length; i++) {
            const inputId = target[i].replace(/[^\d]/g, "");
            let found = false;

            for (const itemId of userData.inventory) {
              if (itemId.endsWith(inputId) || itemId.includes(inputId)) {
                const item = CHARACTER_IDS[itemId];
                if (item) {
                  itemsToDelete.push({
                    id: itemId,
                    name: item.name,
                    type: itemId.startsWith("CHAR_")
                      ? "Nhân vật"
                      : itemId.startsWith("STONE_")
                      ? "Đá tiến hóa"
                      : "Mảnh đá",
                    value: item.value || 0,
                  });
                  totalRefund += Math.floor((item.value || 0) * 0.3);
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              failedIds.push(inputId);
            }
          }

          if (itemsToDelete.length === 0) {
            return api.sendMessage(
              "❌ Không tìm thấy vật phẩm nào để xóa!\n" +
                (failedIds.length > 0
                  ? `⚠️ ID không hợp lệ: ${failedIds
                      .map((id) => "#" + id)
                      .join(", ")}\n`
                  : "") +
                "\n💡 Dùng .gacha inv để xem ID vật phẩm",
              threadID,
              messageID
            );
          }

          // Xóa các vật phẩm và cập nhật dữ liệu
          userData.inventory = userData.inventory.filter(
            (id) => !itemsToDelete.some((item) => item.id === id)
          );
          await updateBalance(senderID, totalRefund);
          saveGachaData(gachaData);

          // Tạo thông báo kết quả
          let message = "🗑️ ĐÃ XÓA VẬT PHẨM THÀNH CÔNG!\n";
          message += "━━━━━━━━━━━━━━━━━━━━━\n\n";
          message += "📦 Các vật phẩm đã xóa:\n";

          itemsToDelete.forEach((item, index) => {
            message += `${index + 1}. ${item.type}: ${item.name}\n`;
            message += `💰 Giá trị: $${item.value.toLocaleString()}\n`;
            message += `🔖 ID: #${item.id.slice(-4)}\n\n`;
          });

          message += `💵 Tổng hoàn lại: $${totalRefund.toLocaleString()} (30%)\n`;
          message += `📊 Còn lại: ${userData.inventory.length} vật phẩm`;

          if (failedIds.length > 0) {
            message += `\n\n⚠️ Không tìm thấy: ${failedIds
              .map((id) => "#" + id)
              .join(", ")}`;
          }

          return api.sendMessage(message, threadID, messageID);
        }
        if (userData.inventory && Array.isArray(userData.inventory)) {
          for (const itemId of userData.inventory) {
            const item = CHARACTER_IDS[itemId];
            if (!item) continue;
        
            if (itemId.startsWith("CHAR_")) {
              characters.push({
                id: itemId,
                ...item,
                type: "character",
                rarity: CHARACTER_RATINGS.FIVE_STAR.includes(item.name)
                  ? 5
                  : CHARACTER_RATINGS.FOUR_STAR.includes(item.name)
                  ? 4
                  : 3,
              });
            } else if (itemId.startsWith("STONE_")) {
              // Stone handling
            } 
            // Thêm điều kiện xử lý EXP items
            else if (itemId.startsWith("EXP_")) {
              expItems.push({
                id: itemId,
                ...item,
                type: "exp"
              });
            }
            totalValue += item.value || 0;
          }
        }
        

        const characterCounts = {
          5: characters.filter((char) => char.rarity === 5).length,
          4: characters.filter((char) => char.rarity === 4).length,
          3: characters.filter((char) => char.rarity === 3).length,
        };

        const totalItems = characters.length + stones.length + fragments.length;

        let inventoryMessage = "";
        if (autoConverted) {
          inventoryMessage = "✨ Đã tự động ghép mảnh thành đá tiến hóa!\n\n";
        }
        const inventoryImage = await createInventoryImage({
          userId: senderID,
          userName,
          characters,
          stones,
          expItems,
          fragments,
          totalValue,
          characterCounts,
          totalItems,
          currentPage: page,
          itemsPerPage: 20,
        });

        return api.sendMessage(
          {
            body: inventoryMessage,
            attachment: fs.createReadStream(inventoryImage),
          },
          threadID,
          () => fs.unlinkSync(inventoryImage),
          messageID
        );
      }

      case "ainfo":
      case "auctioninfo": {
        if (!target[1]) {
          return api.sendMessage(
            "❌ Vui lòng cung cấp ID phiên đấu giá!\n" +
              "Cách dùng: .gacha ainfo ID_PHIÊN",
            threadID,
            messageID
          );
        }

        return showAuctionInfo(api, threadID, messageID, target[1]);
      }

      case "alist":
      case "auctionlist": {
        let filterType = null;
        if (target[1]) {
          const type = target[1].toLowerCase();
          if (type === "char" || type === "character") filterType = "character";
          else if (type === "stone") filterType = "stone";
          else if (type === "fragment") filterType = "fragment";
        }

        return showAuctionList(api, threadID, messageID, filterType);
      }

      case "myauctions": {
        const userAuctions = [...activeAuctions.values()].filter(
          (a) =>
            (a.seller === senderID || a.highestBidder === senderID) &&
            a.status === "active" &&
            a.endTime > Date.now()
        );

        if (userAuctions.length === 0) {
          return api.sendMessage(
            "📋 PHIÊN ĐẤU GIÁ CỦA BẠN 📋\n\n" +
              "❌ Bạn không có phiên đấu giá nào đang diễn ra!\n\n" +
              "💡 Bạn có thể:\n" +
              "• Tạo phiên đấu giá mới: .gacha auction #ID <giá>\n" +
              "• Tham gia các phiên khác: .gacha alist",
            threadID,
            messageID
          );
        }

        const selling = userAuctions.filter((a) => a.seller === senderID);
        const bidding = userAuctions.filter(
          (a) => a.highestBidder === senderID
        );

        let message = "📋 PHIÊN ĐẤU GIÁ CỦA BẠN 📋\n";
        message += "───────────────\n\n";

        if (selling.length > 0) {
          message += "📤 ĐANG BÁN:\n\n";

          selling.forEach((auction, index) => {
            const timeLeft = Math.max(0, auction.endTime - Date.now());
            const minutesLeft = Math.floor(timeLeft / 60000);

            const itemIcon =
              auction.itemType === "character"
                ? "👤"
                : auction.itemType === "stone"
                ? "💎"
                : "🧩";

            message += `${index + 1}. ${itemIcon} ${auction.itemName}\n`;
            message += `💰 Giá hiện tại: $${auction.currentBid.toLocaleString()}\n`;
            message += `👤 Người trả giá cao nhất: ${
              auction.highestBidder
                ? getUserName(auction.highestBidder)
                : "Chưa có"
            }\n`;
            message += `⏰ Còn lại: ${minutesLeft} phút\n`;
            message += `🔖 ID: ${auction.id}\n\n`;
          });
        }

        if (bidding.length > 0) {
          message += "📥 ĐANG ĐẶT GIÁ CAO NHẤT:\n\n";

          bidding.forEach((auction, index) => {
            const timeLeft = Math.max(0, auction.endTime - Date.now());
            const minutesLeft = Math.floor(timeLeft / 60000);

            const itemIcon =
              auction.itemType === "character"
                ? "👤"
                : auction.itemType === "stone"
                ? "💎"
                : "🧩";

            message += `${index + 1}. ${itemIcon} ${auction.itemName}\n`;
            message += `💰 Giá hiện tại: $${auction.currentBid.toLocaleString()}\n`;
            message += `👤 Người bán: ${getUserName(auction.seller)}\n`;
            message += `⏰ Còn lại: ${minutesLeft} phút\n`;
            message += `🔖 ID: ${auction.id}\n\n`;
          });
        }

        message += "💡 Để xem chi tiết, hãy dùng:\n";
        message += ".gacha ainfo <ID>";

        return api.sendMessage(message, threadID, messageID);
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

        let foundItemId = null;
        for (const itemId of userData.inventory) {
          const lastFourDigits = itemId.slice(-4);
          if (lastFourDigits === inputId) {
            foundItemId = itemId;
            break;
          }
        }

        if (!foundItemId) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${inputId}!`,
            threadID,
            messageID
          );
        }

        const char = CHARACTER_IDS[foundItemId];
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
            id: foundItemId,
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

      case "levelup":
      case "level":
      case "exp": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "🔄 NÂNG CẤP NHÂN VẬT 🔄\n" +
              "───────────────\n\n" +
              "Cách dùng: .gacha levelup #ID_NHÂN_VẬT #ID_VẬT_PHẨM_EXP\n" +
              "Ví dụ: .gacha levelup #1234 #5678\n\n" +
              "💡 Dùng .gacha inv để xem ID nhân vật và vật phẩm kinh nghiệm",
            threadID,
            messageID
          );
        }

        const charInputId = target[1].replace(/[^\d]/g, "");
        const expInputId = target[2].replace(/[^\d]/g, "");

        let foundCharId = null;
        for (const id of userData.inventory) {
          if (
            id.startsWith("CHAR_") &&
            (id.endsWith(charInputId) || id.includes(charInputId))
          ) {
            foundCharId = id;
            break;
          }
        }

        let foundExpId = null;
        for (const id of userData.inventory) {
          if (
            id.startsWith("EXP_") &&
            (id.endsWith(expInputId) || id.includes(expInputId))
          ) {
            foundExpId = id;
            break;
          }
        }

        if (!foundCharId) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${charInputId}!\n\n💡 Dùng .gacha inv để xem ID nhân vật`,
            threadID,
            messageID
          );
        }

        if (!foundExpId) {
          return api.sendMessage(
            `❌ Không tìm thấy vật phẩm kinh nghiệm với ID #${expInputId}!\n\n💡 Dùng .gacha inv để xem ID vật phẩm`,
            threadID,
            messageID
          );
        }

        // Remove EXP item from inventory
        userData.inventory = userData.inventory.filter(
          (id) => id !== foundExpId
        );

        // Apply EXP item to character
        const result = applyExpItem(foundCharId, foundExpId);

        if (!result.success) {
          // Return item if failed
          userData.inventory.push(foundExpId);
          saveGachaData(gachaData);

          let errorMessage = "❌ Không thể nâng cấp nhân vật!";
          if (result.reason === "max_level_reached") {
            errorMessage = "❌ Nhân vật đã đạt cấp độ tối đa!";
          } else if (result.reason === "invalid_items") {
            errorMessage = "❌ Vật phẩm không hợp lệ!";
          }

          return api.sendMessage(errorMessage, threadID, messageID);
        }

        // Save updated inventory
        saveGachaData(gachaData);

        const char = CHARACTER_IDS[foundCharId];
        const expItem = CHARACTER_IDS[foundExpId];

        return api.sendMessage(
          "✅ NÂNG CẤP THÀNH CÔNG! ✅\n" +
            "━━━━━━━━━━━━━━━━━━━━━\n\n" +
            `👤 Nhân vật: ${char.name}\n` +
            `📊 Cấp độ: ${result.oldLevel} ➡️ ${result.newLevel}\n` +
            `📈 EXP đã dùng: ${
              expItem.name
            } (+${expItem.expValue.toLocaleString()} EXP)\n\n` +
            (result.oldLevel !== result.newLevel
              ? `🎉 Chúc mừng! Nhân vật đã lên cấp!\n\n` +
                `📊 CHỈ SỐ MỚI:\n` +
                `⚔️ ATK: ${char.stats.atk}\n` +
                `🛡️ DEF: ${char.stats.def}\n` +
                `❤️ HP: ${char.stats.hp}\n\n`
              : `📝 EXP cần để lên cấp tiếp: ${result.remainingExpForNextLevel.toLocaleString()}\n\n`) +
            `💰 Giá trị mới: $${Math.floor(char.value).toLocaleString()}\n` +
            `💡 Vật phẩm kinh nghiệm đã được sử dụng.`,
          threadID,
          messageID
        );
      }
      case "upgrade":
      case "up":
      case "evolve": {
        if (!target[1] || !target[2] || !target[3]) {
          return api.sendMessage(
            "🌟 TIẾN HÓA NHÂN VẬT - HƯỚNG DẪN NHANH 🌟\n\n" +
              "📋 Cú pháp: .gacha upgrade #ID1 #ID2 #ID_ĐÁ\n\n" +
              "1️⃣ #ID1, #ID2: Hai nhân vật cùng loại\n" +
              "2️⃣ #ID_ĐÁ: Đá tiến hóa cùng nguyên tố với nhân vật\n\n" +
              "💡 Xem hướng dẫn chi tiết: .gacha help upgrade\n" +
              "📦 Xem kho đồ: .gacha inv",
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
            `❌ Không tìm thấy nhân vật với ID #${inputId1}!\n\n💡 Dùng .gacha inv để xem ID nhân vật`,
            threadID,
            messageID
          );
        }
        if (!foundCharId2) {
          return api.sendMessage(
            `❌ Không tìm thấy nhân vật với ID #${inputId2}!\n\n💡 Dùng .gacha inv để xem ID nhân vật`,
            threadID,
            messageID
          );
        }
        if (!foundStoneId) {
          return api.sendMessage(
            `❌ Không tìm thấy đá tiến hóa với ID #${stoneInputId}!\n\n💡 Dùng .gacha inv để xem ID đá tiến hóa`,
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
            `❌ Hai nhân vật phải CÙNG LOẠI!\n\n` +
              `• Nhân vật 1: ${char1.name}\n` +
              `• Nhân vật 2: ${char2.name}\n\n` +
              `💡 Chọn hai nhân vật cùng tên để tiến hóa`,
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
            `❌ Hai nhân vật phải có CÙNG SỐ SAO!\n\n` +
              `• ${char1.name}: ${star1}★\n` +
              `• ${char2.name}: ${star2}★\n\n` +
              `💡 Chọn hai nhân vật có cùng số sao để tiến hóa`,
            threadID,
            messageID
          );
        }

        const charInfo = CUSTOM_CHARACTER_DATA[char1.name];
        const charElement = charInfo?.element?.toUpperCase() || "UNKNOWN";
        const stoneElement = stone.stoneType;

        if (stoneElement !== "UNIVERSAL" && stoneElement !== charElement) {
          return api.sendMessage(
            `❌ ĐÁ TIẾN HÓA KHÔNG PHÙ HỢP!\n\n` +
              `• Nhân vật: ${char1.name} (${
                charInfo?.element || "Unknown"
              })\n` +
              `• Đá: ${stone.name} (${stone.element})\n\n` +
              `💡 Cần đá ${
                ELEMENTAL_STONES[charElement]?.name || "phù hợp"
              } hoặc Brilliant Diamond 💎`,
            threadID,
            messageID
          );
        }

        const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(char1.name) ? 5 : 4;
        const maxStar = rarity === 5 ? 12 : 8;

        if (star1 >= maxStar) {
          return api.sendMessage(
            `❌ NHÂN VẬT ĐÃ ĐẠT CAO NHẤT!\n\n` +
              `• ${char1.name} đã đạt ${star1}★/${maxStar}★\n` +
              `• Không thể tiến hóa thêm\n\n` +
              `💡 Nhân vật ${rarity}★ chỉ có thể tiến hóa tối đa ${maxStar}★`,
            threadID,
            messageID
          );
        }

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

        userData.inventory = userData.inventory.filter(
          (id) =>
            id !== foundCharId1 && id !== foundCharId2 && id !== foundStoneId
        );

        userData.inventory.push(newCharId);

        saveCharacterDatabase();
        saveGachaData(gachaData);

        const atkIncrease = Math.floor(
          ((CHARACTER_IDS[newCharId].stats.atk - baseStats.atk) /
            baseStats.atk) *
            100
        );
        const defIncrease = Math.floor(
          ((CHARACTER_IDS[newCharId].stats.def - baseStats.def) /
            baseStats.def) *
            100
        );
        const hpIncrease = Math.floor(
          ((CHARACTER_IDS[newCharId].stats.hp - baseStats.hp) / baseStats.hp) *
            100
        );

        return api.sendMessage(
          "🌟 TIẾN HÓA THÀNH CÔNG! 🌟\n" +
            "━━━━━━━━━━━━━━━━━━━━━\n\n" +
            `👤 Nhân vật: ${char1.name}\n` +
            `⭐ Sao: ${star1}★ ➡️ ${newStar}★\n\n` +
            `📊 CHỈ SỐ MỚI:\n` +
            `⚔️ ATK: ${CHARACTER_IDS[newCharId].stats.atk} (+${atkIncrease}%)\n` +
            `🛡️ DEF: ${CHARACTER_IDS[newCharId].stats.def} (+${defIncrease}%)\n` +
            `❤️ HP: ${CHARACTER_IDS[newCharId].stats.hp} (+${hpIncrease}%)\n\n` +
            `💰 Giá trị: $${CHARACTER_IDS[
              newCharId
            ].value.toLocaleString()}\n` +
            `🆔 ID mới: #${newCharId.slice(-4)}\n\n` +
            `${stone.emoji} Đã sử dụng: ${stone.name}\n` +
            `📝 Lưu ý: Cả 2 nhân vật gốc và đá tiến hóa đã biến mất`,
          threadID,
          messageID
        );
      }

case "admin": {
  if (!isAdmin(senderID)) {
    return api.sendMessage("❌ Bạn không có quyền truy cập chức năng này!", threadID, messageID);
  }

  if (!target[1]) {
    return api.sendMessage(
      "👑 BẢNG ĐIỀU KHIỂN ADMIN 👑\n" +
      "────────────────\n\n" +
      "📋 DANH SÁCH LỆNH:\n" +
      "• .gacha admin give <@user> <type> <id/name> [số lượng]\n" +
      "• .gacha admin create <character/item>\n" +
      "• .gacha admin stats\n" + 
      "• .gacha admin reset <@user>\n" +
      "• .gacha admin modify <@user> <parameter> <value>\n" +
      "• .gacha admin backup\n" +
      "• .gacha admin restore <backupId>\n" +
      "• .gacha admin money <@user> <+/-> <amount>\n" +
      "• .gacha admin event <start/end> <eventType>\n\n" +
      "💡 Gõ .gacha admin help <lệnh> để xem chi tiết cách sử dụng",
      threadID, 
      messageID
    );
  }

  const adminAction = target[1].toLowerCase();

  switch (adminAction) {
    case "give": {
      // Kiểm tra đầy đủ thông tin
      if (!target[2] || !target[3] || !target[4]) {
        return api.sendMessage(
          "❌ Thiếu thông tin! Cách dùng:\n" +
          ".gacha admin give @user <type> <id/name> [số lượng]\n\n" +
          "Trong đó:\n" +
          "• type: character, stone, fragment, exp, stella\n" +
          "• id/name: ID hoặc tên vật phẩm\n" +
          "• số lượng: số lượng muốn tặng (mặc định: 1)",
          threadID, messageID
        );
      }

      // Lấy ID người dùng được tag
      const mention = Object.keys(event.mentions)[0];
      if (!mention) {
        return api.sendMessage("❌ Bạn phải tag người nhận!", threadID, messageID);
      }

      // Kiểm tra người dùng đã tồn tại trong hệ thống
      if (!gachaData[mention]) {
        gachaData[mention] = {
          inventory: [],
          pullsSinceLastFiveStar: 0,
          pullsSinceLastFourStar: 0,
          totalPulls: 0,
          lastPull: 0,
        };
      }

      const targetUserData = gachaData[mention];
      const itemType = target[3].toLowerCase();
      const itemIdentifier = target[4];
      const quantity = parseInt(target[5]) || 1;

      // Xử lý từng loại item
      if (itemType === "character") {
        // Tìm nhân vật theo tên
        const characterName = itemIdentifier.charAt(0).toUpperCase() + itemIdentifier.slice(1);
        
        let foundCharacter = null;
        for (const category in CHARACTER_RATINGS) {
          const chars = CHARACTER_RATINGS[category];
          for (const char of chars) {
            if (char.toLowerCase() === characterName.toLowerCase()) {
              foundCharacter = char;
              break;
            }
          }
          if (foundCharacter) break;
        }

        if (!foundCharacter) {
          return api.sendMessage(`❌ Không tìm thấy nhân vật: ${characterName}`, threadID, messageID);
        }

        // Tạo nhân vật và thêm vào inventory
        const charIds = [];
        for (let i = 0; i < quantity; i++) {
          const charId = generateCharacterId(foundCharacter);
          
          // Xác định độ hiếm
          const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(foundCharacter) ? 
            "FIVE_STAR" : CHARACTER_RATINGS.FOUR_STAR.includes(foundCharacter) ? 
            "FOUR_STAR" : "THREE_STAR";
          
          CHARACTER_IDS[charId] = {
            type: "character",
            name: foundCharacter,
            obtainedAt: Date.now(),
            value: generateCardValue(rarity, foundCharacter),
            level: 1,
            exp: 0,
            stats: generateCharacterStats(
              rarity === "FIVE_STAR" ? 5 : rarity === "FOUR_STAR" ? 4 : 3,
              foundCharacter
            ),
          };
          
          targetUserData.inventory.push(charId);
          charIds.push(charId);
        }
        
        saveCharacterDatabase();
        saveGachaData(gachaData);
        
        return api.sendMessage(
          `✅ Đã tặng ${quantity} ${foundCharacter} cho ${event.mentions[mention].replace("@", "")}!\n` +
          `🔖 ID: ${charIds.map(id => '#' + id.slice(-4)).join(', ')}`,
          threadID, messageID
        );
      } 
      else if (itemType === "stone") {
        // Tạo đá tiến hóa
        const stoneElement = itemIdentifier.toUpperCase();
        if (!ELEMENTAL_STONES[stoneElement]) {
          return api.sendMessage(
            `❌ Loại đá không hợp lệ! Các loại đá: ${Object.keys(ELEMENTAL_STONES).join(", ")}`,
            threadID, messageID
          );
        }
        
        const stoneIds = [];
        for (let i = 0; i < quantity; i++) {
          const stoneId = createStone(stoneElement);
          targetUserData.inventory.push(stoneId);
          stoneIds.push(stoneId);
        }
        
        saveGachaData(gachaData);
        
        return api.sendMessage(
          `✅ Đã tặng ${quantity} ${ELEMENTAL_STONES[stoneElement].name} cho ${event.mentions[mention].replace("@", "")}!`,
          threadID, messageID
        );
      }
      else if (itemType === "stella") {
        // Tạo Stella Fortuna
        const charName = itemIdentifier.charAt(0).toUpperCase() + itemIdentifier.slice(1);
        const isUniversal = charName.toLowerCase() === "universal";
        
        const stellaIds = [];
        for (let i = 0; i < quantity; i++) {
          const stellaId = createStellaFortuna(isUniversal ? null : charName, isUniversal);
          targetUserData.inventory.push(stellaId);
          stellaIds.push(stellaId);
        }
        
        saveGachaData(gachaData);
        
        return api.sendMessage(
          `✅ Đã tặng ${quantity} ${isUniversal ? "Universal Stella" : `Stella Fortuna (${charName})`} cho ${event.mentions[mention].replace("@", "")}!`,
          threadID, messageID
        );
      }
      else if (itemType === "exp") {
        // Tạo item EXP
        if (!EXP_ITEMS[itemIdentifier]) {
          return api.sendMessage(
            `❌ Item EXP không hợp lệ! Các item: ${Object.keys(EXP_ITEMS).join(", ")}`,
            threadID, messageID
          );
        }
        
        const expIds = [];
        for (let i = 0; i < quantity; i++) {
          const expId = createExpItem(itemIdentifier);
          targetUserData.inventory.push(expId);
          expIds.push(expId);
        }
        
        saveGachaData(gachaData);
        
        return api.sendMessage(
          `✅ Đã tặng ${quantity} ${itemIdentifier} cho ${event.mentions[mention].replace("@", "")}!`,
          threadID, messageID
        );
      }
      
      return api.sendMessage(
        "❌ Loại vật phẩm không hợp lệ! Các loại: character, stone, stella, exp",
        threadID, messageID
      );
    }

    case "money":
    case "balance": {
      if (!target[2] || !target[3] || !target[4]) {
        return api.sendMessage(
          "❌ Thiếu thông tin! Cách dùng:\n" +
          ".gacha admin money @user <+/-> <số tiền>",
          threadID, messageID
        );
      }

      // Lấy ID người dùng được tag
      const mention = Object.keys(event.mentions)[0];
      if (!mention) {
        return api.sendMessage("❌ Bạn phải tag người dùng!", threadID, messageID);
      }

      const operation = target[3];
      const amount = parseInt(target[4]);
      
      if (isNaN(amount) || amount <= 0) {
        return api.sendMessage("❌ Số tiền không hợp lệ!", threadID, messageID);
      }

      const currentBalance = await getBalance(mention);
      let newBalance;

      if (operation === "+" || operation === "add") {
        await updateBalance(mention, amount);
        newBalance = currentBalance + amount;
      } else if (operation === "-" || operation === "sub") {
        await updateBalance(mention, -amount);
        newBalance = currentBalance - amount;
      } else {
        return api.sendMessage("❌ Phép toán không hợp lệ! Chỉ dùng + hoặc -", threadID, messageID);
      }

      return api.sendMessage(
        `✅ Đã ${operation === "+" ? "thêm" : "trừ"} $${amount.toLocaleString()} ${operation === "+" ? "cho" : "từ"} ${event.mentions[mention].replace("@", "")}!\n` +
        `💰 Số dư mới: $${newBalance.toLocaleString()}`,
        threadID, messageID
      );
    }

    case "stats": {
      // Thống kê toàn bộ hệ thống
      const totalUsers = Object.keys(gachaData).length;
      const totalCharacters = Object.values(CHARACTER_IDS).filter(item => item.type === "character").length;
      const totalItems = Object.keys(CHARACTER_IDS).length;
      
      const totalPulls = Object.values(gachaData).reduce((sum, userData) => sum + (userData.totalPulls || 0), 0);
      
      const characterStats = {
        "5★": 0,
        "4★": 0,
        "3★": 0,
        "Limited": 0
      };
      
      Object.values(CHARACTER_IDS).forEach(item => {
        if (item.type === "character") {
          if (CHARACTER_RATINGS.FIVE_STAR.includes(item.name)) {
            characterStats["5★"]++;
            if (PREMIUM_FIVE_STARS.includes(item.name)) {
              characterStats["Limited"]++;
            }
          } else if (CHARACTER_RATINGS.FOUR_STAR.includes(item.name)) {
            characterStats["4★"]++;
          } else {
            characterStats["3★"]++;
          }
        }
      });
      
      return api.sendMessage(
        "📊 THỐNG KÊ HỆ THỐNG 📊\n" +
        "────────────────\n\n" +
        `👥 Tổng người chơi: ${totalUsers}\n` +
        `🎮 Tổng lượt pull: ${totalPulls.toLocaleString()}\n\n` +
        `📦 THỐNG KÊ VẬT PHẨM:\n` +
        `• Tổng vật phẩm: ${totalItems.toLocaleString()}\n` +
        `• Tổng nhân vật: ${totalCharacters.toLocaleString()}\n` +
        `• 5★: ${characterStats["5★"].toLocaleString()}\n` +
        `• 4★: ${characterStats["4★"].toLocaleString()}\n` +
        `• 3★: ${characterStats["3★"].toLocaleString()}\n` +
        `• Limited: ${characterStats["Limited"].toLocaleString()}\n\n` +
        `💾 Kích thước database: ${Math.round(JSON.stringify(gachaData).length / 1024).toLocaleString()} KB`,
        threadID, messageID
      );
    }

    case "backup": {
      // Tạo backup thủ công
      const result = createBackup("manual");
      
      if (!result.success) {
        return api.sendMessage(
          "❌ Tạo backup thất bại: " + (result.error?.message || "Lỗi không xác định"),
          threadID, messageID
        );
      }
      
      return api.sendMessage(
        "✅ TẠO BACKUP THÀNH CÔNG!\n\n" +
        `📂 Tên file: ${result.filename}\n` +
        `⏰ Thời gian: ${new Date().toLocaleString()}\n\n` +
        `💾 Sử dụng '.gacha admin restore' để khôi phục từ backup này nếu cần.`,
        threadID, messageID
      );
    }

    case "restore": {
      // Phục hồi từ backup
      if (!target[2]) {
        // Liệt kê các backup
        const backups = listBackups();
        
        if (!backups.success || backups.backups.length === 0) {
          return api.sendMessage(
            "❌ Không tìm thấy backup nào trong hệ thống!",
            threadID, messageID
          );
        }
        
        let message = "📋 DANH SÁCH BACKUP 📋\n";
        message += "────────────────\n\n";
        
        backups.backups.slice(0, 10).forEach(backup => {
          message += `🆔 ${backup.id}\n`;
          message += `📅 ${backup.date} (${backup.time})\n`;
          message += `📝 Loại: ${backup.type}\n\n`;
        });
        
        message += `Tổng cộng: ${backups.backups.length} backups\n\n`;
        message += `💡 Để khôi phục, hãy dùng:\n.gacha admin restore <backup_id>`;
        
        return api.sendMessage(message, threadID, messageID);
      }
      
      const backupId = target[2];
      const result = restoreFromBackup(backupId);
      
      if (!result.success) {
        return api.sendMessage(
          "❌ Khôi phục thất bại: " + (result.reason || "Lỗi không xác định"),
          threadID, messageID
        );
      }
      
      return api.sendMessage(
        "✅ KHÔI PHỤC BACKUP THÀNH CÔNG!\n\n" +
        `📂 Đã khôi phục từ:\n• ${result.gachaFile}\n• ${result.charactersFile}\n\n` +
        `⚠️ Hệ thống đã được đưa về trạng thái của backup.\n` +
        `⏰ Thời gian khôi phục: ${new Date().toLocaleString()}`,
        threadID, messageID
      );
    }

    case "create": {
      if (!target[2] || !target[3]) {
        return api.sendMessage(
          "❌ Thiếu thông tin! Để tạo nhân vật tùy chỉnh:\n" +
          ".gacha admin create character [tên] [element] [weapon] [rarity]",
          threadID, messageID
        );
      }
      
      if (target[2].toLowerCase() === "character") {
        const charName = target[3];
        const element = target[4] || "Anemo";
        const weapon = target[5] || "Sword";
        const rarity = parseInt(target[6]) || 5;
        
        // Thêm nhân vật vào danh sách
        if (rarity === 5) {
          if (!CHARACTER_RATINGS.FIVE_STAR.includes(charName)) {
            CHARACTER_RATINGS.FIVE_STAR.push(charName);
          }
        } else if (rarity === 4) {
          if (!CHARACTER_RATINGS.FOUR_STAR.includes(charName)) {
            CHARACTER_RATINGS.FOUR_STAR.push(charName);
          }
        } else {
          if (!CHARACTER_RATINGS.THREE_STAR.includes(charName)) {
            CHARACTER_RATINGS.THREE_STAR.push(charName);
          }
        }
        
        // Thêm thông tin nhân vật
        CUSTOM_CHARACTER_DATA[charName] = {
          weapon: weapon,
          element: element,
          skills: ["Skill 1", "Ultimate"],
          quote: "Custom character"
        };
        
        return api.sendMessage(
          "✅ ĐÃ TẠO NHÂN VẬT TÙY CHỈNH!\n\n" +
          `👤 Tên: ${charName}\n` +
          `🔮 Nguyên tố: ${element}\n` +
          `⚔️ Vũ khí: ${weapon}\n` +
          `⭐ Độ hiếm: ${rarity}★\n\n` +
          `💡 Nhân vật đã được thêm vào hệ thống và có thể pull được.`,
          threadID, messageID
        );
      }
      
      return api.sendMessage(
        "❌ Loại không hợp lệ! Hiện chỉ hỗ trợ: character",
        threadID, messageID
      );
    }

    case "reset": {
      // Reset dữ liệu người chơi
      if (!target[2]) {
        return api.sendMessage(
          "❌ Thiếu thông tin! Cách dùng:\n" +
          ".gacha admin reset @user [keep_balance]",
          threadID, messageID
        );
      }
      
      const mention = Object.keys(event.mentions)[0];
      if (!mention) {
        return api.sendMessage("❌ Bạn phải tag người dùng!", threadID, messageID);
      }
      
      if (!gachaData[mention]) {
        return api.sendMessage("❌ Người dùng chưa tham gia hệ thống gacha!", threadID, messageID);
      }
      
      const keepBalance = target[3]?.toLowerCase() === "true" || target[3]?.toLowerCase() === "keep";
      
      // Lưu trữ danh sách ID item cũ để xóa
      const oldItems = [...(gachaData[mention].inventory || [])];
      
      // Reset dữ liệu
      gachaData[mention] = {
        inventory: [],
        pullsSinceLastFiveStar: 0,
        pullsSinceLastFourStar: 0,
        totalPulls: 0,
        lastPull: 0
      };
      
      saveGachaData(gachaData);
      
      // Xóa các item cũ không sử dụng
      for (const itemId of oldItems) {
        if (CHARACTER_IDS[itemId]) {
          delete CHARACTER_IDS[itemId];
        }
      }
      saveCharacterDatabase();
      
      if (!keepBalance) {
        await updateBalance(mention, -await getBalance(mention));
      }
      
      return api.sendMessage(
        `✅ ĐÃ RESET DỮ LIỆU NGƯỜI CHƠI ${event.mentions[mention].replace("@", "")}!\n\n` +
        `• Đã xóa: ${oldItems.length} vật phẩm\n` +
        `• Dữ liệu gacha đã reset\n` +
        `• Giữ tiền: ${keepBalance ? "Có" : "Không"}`,
        threadID, messageID
      );
    }
    
    case "event": {
      if (!target[2] || !target[3]) {
        return api.sendMessage(
          "❌ Thiếu thông tin! Cách dùng:\n" +
          ".gacha admin event <start/end> <eventType>\n\n" +
          "Các loại sự kiện:\n" +
          "• doubleodds - Tăng gấp đôi tỉ lệ 5★\n" +
          "• costreduce - Giảm 50% chi phí pull\n" +
          "• premiumpull - Tăng tỉ lệ ra Premium 5★\n" +
          "• bonusreward - Tăng phần thưởng PVP",
          threadID, messageID
        );
      }
      
      const action = target[2].toLowerCase();
      const eventType = target[3].toLowerCase();
      
      // Đảm bảo có thuộc tính events
      if (!gachaData.systemEvents) {
        gachaData.systemEvents = {};
      }
      
      if (action === "start") {
        // Bắt đầu sự kiện
        gachaData.systemEvents[eventType] = {
          active: true,
          startTime: Date.now(),
          endTime: Date.now() + 86400000, // 24 giờ mặc định
          createdBy: senderID
        };
        saveGachaData(gachaData);
        
        // Thông báo toàn server
        return api.sendMessage(
          "🎉 SỰ KIỆN ĐẶC BIỆT! 🎉\n" +
          "────────────────\n\n" +
          getEventDescription(eventType) + "\n\n" +
          "⏱️ Thời gian: 24 giờ\n\n" +
          "🎮 Hãy tham gia ngay với lệnh .gacha pull!",
          threadID, messageID
        );
      } 
      else if (action === "end") {
        // Kết thúc sự kiện
        if (!gachaData.systemEvents[eventType] || !gachaData.systemEvents[eventType].active) {
          return api.sendMessage(
            "❌ Không có sự kiện nào đang diễn ra với loại này!",
            threadID, messageID
          );
        }
        
        gachaData.systemEvents[eventType].active = false;
        gachaData.systemEvents[eventType].endTime = Date.now();
        saveGachaData(gachaData);
        
        return api.sendMessage(
          "📢 THÔNG BÁO KẾT THÚC SỰ KIỆN!\n" +
          "────────────────\n\n" +
          `Sự kiện ${getEventDescription(eventType)} đã kết thúc.\n\n` +
          "Cảm ơn mọi người đã tham gia!",
          threadID, messageID
        );
      }
      
      return api.sendMessage(
        "❌ Hành động không hợp lệ! Chỉ hỗ trợ: start, end",
        threadID, messageID
      );
    }
    
    default:
      return api.sendMessage(
        "❌ Lệnh admin không hợp lệ! Gõ .gacha admin để xem danh sách lệnh.",
        threadID, messageID
      );
  }
}

// Thêm hàm lấy mô tả sự kiện
function getEventDescription(eventType) {
  switch (eventType) {
    case "doubleodds":
      return "🌟 TỶ LỆ KÉP: Tăng gấp đôi tỉ lệ ra nhân vật 5★!";
    case "costreduce":
      return "💰 GIẢM GIÁ: Chi phí pull giảm 50%!";
    case "premiumpull":
      return "✨ PREMIUM BOOST: Tăng tỉ lệ ra nhân vật Premium 5★!";
    case "bonusreward":
      return "🏆 PHẦN THƯỞNG X2: Nhận gấp đôi phần thưởng từ PVP!";
    default:
      return "Sự kiện đặc biệt";
  }
}
      case "backup":
      case "sao":
      case "saoluu": {
        if (!config.ADMIN.includes(senderID)) {
          return api.sendMessage(
            "❌ Bạn không có quyền sử dụng lệnh này!",
            threadID,
            messageID
          );
        }

        const action = target[1]?.toLowerCase();

        if (!action || action === "help") {
          return api.sendMessage(
            "🔄 HỆ THỐNG SAO LƯU DỮ LIỆU 🔄\n" +
              "───────────────────\n\n" +
              "📋 Các lệnh hỗ trợ:\n" +
              "• .gacha backup list - Xem danh sách backup\n" +
              "• .gacha backup create - Tạo backup thủ công\n" +
              "• .gacha backup restore [ID] - Phục hồi backup\n\n" +
              "⏱️ Thông tin:\n" +
              "• Hệ thống tự động sao lưu mỗi 4 giờ\n" +
              "• Giữ lại tối đa 14 ngày backup hàng ngày\n" +
              "• Backup thủ công được giữ vĩnh viễn\n\n" +
              "⚠️ Lưu ý: Chỉ Admin mới có quyền phục hồi dữ liệu",
            threadID,
            messageID
          );
        }

        if (action === "list") {
          const result = listBackups();

          if (!result.success) {
            return api.sendMessage(
              "❌ Không thể lấy danh sách backup!\n" +
                `Lỗi: ${result.reason || "Unknown"}`,
              threadID,
              messageID
            );
          }

          if (result.backups.length === 0) {
            return api.sendMessage(
              "❌ Không tìm thấy bản sao lưu nào!",
              threadID,
              messageID
            );
          }

          let message = "📋 DANH SÁCH BẢN SAO LƯU 📋\n";
          message += "───────────────────\n\n";

          // Hiển thị tối đa 10 bản sao lưu gần nhất
          result.backups.slice(0, 10).forEach((backup, index) => {
            message += `${index + 1}. [${backup.type}] ${backup.date} ${
              backup.time
            }\n`;
            message += `🔖 ID: ${backup.id}\n\n`;
          });

          if (result.backups.length > 10) {
            message += `... và ${
              result.backups.length - 10
            } bản sao lưu khác\n\n`;
          }

          message += "💡 Để phục hồi, sử dụng:\n";
          message += ".gacha backup restore [ID]\n";
          message += "Ví dụ: .gacha backup restore " + result.backups[0].id;

          return api.sendMessage(message, threadID, messageID);
        }

        if (action === "create") {
          const result = createBackup("manual");

          if (result.success) {
            return api.sendMessage(
              "✅ ĐÃ TẠO BẢN SAO LƯU THÀNH CÔNG!\n\n" +
                `📁 Tên file: ${result.filename}\n` +
                `⏱️ Thời gian: ${new Date().toLocaleString()}`,
              threadID,
              messageID
            );
          } else {
            return api.sendMessage(
              "❌ Không thể tạo bản sao lưu!\n" +
                "Vui lòng kiểm tra logs để biết thêm chi tiết.",
              threadID,
              messageID
            );
          }
        }

        if (action === "restore") {
          // Chỉ cho phép admin được phục hồi dữ liệu
          if (senderID !== "61573427362389") {
            return api.sendMessage(
              "❌ Chỉ ADMIN chính mới có thể phục hồi dữ liệu!",
              threadID,
              messageID
            );
          }

          const backupId = target[2];
          if (!backupId) {
            return api.sendMessage(
              "❌ Vui lòng cung cấp ID bản sao lưu!\n" +
                "Ví dụ: .gacha backup restore 1679823456\n\n" +
                "💡 Dùng '.gacha backup list' để xem danh sách ID",
              threadID,
              messageID
            );
          }

          return api.sendMessage(
            "⚠️ XÁC NHẬN PHỤC HỒI DỮ LIỆU ⚠️\n\n" +
              "Hành động này sẽ xóa toàn bộ dữ liệu hiện tại và thay thế bằng bản sao lưu.\n\n" +
              "⚠️ TẤT CẢ DỮ LIỆU SAU BẢN SAO LƯU SẼ BỊ MẤT!\n\n" +
              `Để xác nhận, hãy gõ: .gacha backup confirm ${backupId}`,
            threadID,
            messageID
          );
        }

        if (action === "confirm") {
          // Chỉ cho phép admin được phục hồi dữ liệu
          if (senderID !== "61573427362389") {
            return api.sendMessage(
              "❌ Chỉ ADMIN chính mới có thể phục hồi dữ liệu!",
              threadID,
              messageID
            );
          }

          const backupId = target[2];
          if (!backupId) {
            return api.sendMessage(
              "❌ Thiếu ID bản sao lưu!",
              threadID,
              messageID
            );
          }

          api.sendMessage(
            "⏳ Đang tiến hành phục hồi dữ liệu...\n" +
              "Vui lòng chờ trong giây lát.",
            threadID,
            messageID
          );

          const result = restoreFromBackup(backupId);

          if (result.success) {
            return api.sendMessage(
              "✅ PHỤC HỒI DỮ LIỆU THÀNH CÔNG!\n\n" +
                `📁 Đã phục hồi từ: ${result.gachaFile}\n` +
                `📁 Database nhân vật: ${result.charactersFile}\n` +
                `⏱️ Thời gian: ${new Date().toLocaleString()}\n\n` +
                "🔄 Hệ thống đã tải lại toàn bộ dữ liệu.",
              threadID
            );
          } else {
            return api.sendMessage(
              "❌ PHỤC HỒI DỮ LIỆU THẤT BẠI!\n\n" +
                `Lỗi: ${result.reason || "Unknown"}\n` +
                "Vui lòng kiểm tra logs để biết thêm chi tiết.",
              threadID
            );
          }
        }

        return api.sendMessage(
          "❌ Hành động không hợp lệ!\n" +
            "Gõ '.gacha backup help' để xem hướng dẫn.",
          threadID,
          messageID
        );
      }
      case "auction": {
        if (!target[1]) {
          return api.sendMessage(
            "❌ Thiếu thông tin đấu giá!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha auction #ID <giá_khởi_điểm> [thời_gian]\n" +
              "Ví dụ: .gacha auction #1234 50000 60\n\n" +
              "💡 Gõ '.gacha help auction' để xem hướng dẫn chi tiết",
            threadID,
            messageID
          );
        }

        // Xử lý ID vật phẩm
        const inputId = target[1].replace(/[^\d]/g, "");

        let foundItemId = null;
        for (const itemId of userData.inventory) {
          const lastFourDigits = itemId.slice(-4);
          if (lastFourDigits === inputId) {
            foundItemId = itemId;
            break;
          }
        }

        if (!foundItemId) {
          return api.sendMessage(
            `❌ Không tìm thấy vật phẩm với ID #${inputId} trong kho đồ của bạn!`,
            threadID,
            messageID
          );
        }

        // Xử lý giá khởi điểm
        if (!target[2] || isNaN(parseInt(target[2]))) {
          return api.sendMessage(
            "❌ Vui lòng nhập giá khởi điểm hợp lệ!\n" +
              "Ví dụ: .gacha auction #1234 50000",
            threadID,
            messageID
          );
        }

        const startingBid = parseInt(target[2]);
        if (startingBid < 1000) {
          return api.sendMessage(
            "❌ Giá khởi điểm tối thiểu là 1,000$!",
            threadID,
            messageID
          );
        }

        // Xử lý thời gian (tùy chọn)
        let duration = 60; // Mặc định 60 phút
        if (target[3] && !isNaN(parseInt(target[3]))) {
          const requestedDuration = parseInt(target[3]);
          // Giới hạn thời gian từ 10 phút đến 24 giờ
          duration = Math.min(24 * 60, Math.max(10, requestedDuration));
        }

        // Xóa vật phẩm khỏi inventory người bán
        userData.inventory = userData.inventory.filter(
          (id) => id !== foundItemId
        );
        saveGachaData(gachaData);

        if (!auctionId) {
          // Trả lại vật phẩm nếu có lỗi
          userData.inventory.push(foundItemId);
          saveGachaData(gachaData);

          return api.sendMessage(
            "❌ Có lỗi xảy ra khi tạo phiên đấu giá. Vui lòng thử lại sau.",
            threadID,
            messageID
          );
        }

        // Lấy thông tin vật phẩm
        const item = CHARACTER_IDS[foundItemId];

        // Xác định loại vật phẩm và độ hiếm
        let itemType, rarityText;
        if (foundItemId.startsWith("CHAR_")) {
          itemType = "Nhân vật";
          const rarity = CHARACTER_RATINGS.FIVE_STAR.includes(item.name)
            ? 5
            : CHARACTER_RATINGS.FOUR_STAR.includes(item.name)
            ? 4
            : 3;
          rarityText = `${rarity}★`;
        } else if (foundItemId.startsWith("STONE_")) {
          itemType = "Đá tiến hóa";
          rarityText = item.stoneType === "UNIVERSAL" ? "5★" : "4★";
        } else {
          itemType = "Mảnh đá";
          rarityText = "3★";
        }

        // Thời gian kết thúc
        const endTimeText = new Date(
          Date.now() + duration * 60000
        ).toLocaleString();

        return api.sendMessage(
          `🔨 PHIÊN ĐẤU GIÁ MỚI! 🔨\n` +
            `────────────────────\n\n` +
            `👤 Người bán: ${userName}\n` +
            `📦 Vật phẩm: ${item.name} (${rarityText})\n` +
            `📝 Loại: ${itemType}\n` +
            `💰 Giá khởi điểm: $${startingBid.toLocaleString()}\n` +
            `💎 Giá trị thị trường: $${item.value?.toLocaleString()}\n\n` +
            `⏰ Thời gian: ${duration} phút\n` +
            `🗓️ Kết thúc lúc: ${endTimeText}\n` +
            `🔖 ID phiên đấu giá: ${auctionId}\n\n` +
            `💡 Để đặt giá, hãy gõ:\n` +
            `.gacha bid ${auctionId} <số_tiền>\n\n` +
            `💼 Để xem chi tiết phiên đấu giá:\n` +
            `.gacha ainfo ${auctionId}`,
          threadID,
          messageID
        );
      }

      case "bid": {
        if (!target[1] || !target[2]) {
          return api.sendMessage(
            "❌ Thiếu thông tin đặt giá!\n\n" +
              "Cách dùng đúng:\n" +
              ".gacha bid <ID_phiên> <số_tiền>\n" +
              "Ví dụ: .gacha bid AUC_1234 50000",
            threadID,
            messageID
          );
        }

        const auctionInputId = target[1];

        // Tìm phiên đấu giá tương ứng
        let auction;
        let fullAuctionId = auctionInputId;

        if (!activeAuctions.has(auctionInputId)) {
          // Tìm kiếm với ID ngắn gọn
          fullAuctionId = [...activeAuctions.keys()].find(
            (id) => id.includes(auctionInputId) || id.endsWith(auctionInputId)
          );

          if (!fullAuctionId) {
            return api.sendMessage(
              "❌ Không tìm thấy phiên đấu giá với ID này!\n" +
                "Dùng '.gacha alist' để xem danh sách phiên đấu giá đang diễn ra.",
              threadID,
              messageID
            );
          }
        }

        // Lấy thông tin phiên đấu giá
        auction = activeAuctions.get(fullAuctionId);

        // Kiểm tra người bán không thể đặt giá cho chính mình
        if (auction.seller === senderID) {
          return api.sendMessage(
            "❌ Bạn không thể đặt giá cho vật phẩm do chính mình bán ra!",
            threadID,
            messageID
          );
        }

        const bidAmount = parseInt(target[2]);
        if (isNaN(bidAmount)) {
          return api.sendMessage(
            "❌ Số tiền đặt giá không hợp lệ!",
            threadID,
            messageID
          );
        }

        const balance = await getBalance(senderID);
        if (balance < bidAmount) {
          return api.sendMessage(
            `❌ Bạn không đủ tiền để đặt giá!\n` +
              `💰 Số dư: $${balance.toLocaleString()}\n` +
              `💸 Cần: $${bidAmount.toLocaleString()}`,
            threadID,
            messageID
          );
        }

        // Kiểm tra giá đặt có hợp lệ không
        const minValidBid = auction.currentBid + auction.minIncrement;
        if (bidAmount < minValidBid) {
          return api.sendMessage(
            `❌ Giá đặt quá thấp!\n` +
              `💰 Giá hiện tại: $${auction.currentBid.toLocaleString()}\n` +
              `🔼 Mức tăng tối thiểu: $${auction.minIncrement.toLocaleString()}\n` +
              `💸 Giá tối thiểu: $${minValidBid.toLocaleString()}`,
            threadID,
            messageID
          );
        }

        // Kiểm tra thời gian còn lại
        if (Date.now() >= auction.endTime) {
          return api.sendMessage(
            `❌ Phiên đấu giá đã kết thúc!\n` +
              `Vui lòng tham gia các phiên đấu giá khác.`,
            threadID,
            messageID
          );
        }

        // Lưu thông tin người đặt giá trước đó để hoàn tiền
        const previousBidder = auction.highestBidder;
        const previousBid = auction.currentBid;

        // Cập nhật thông tin đấu giá
        auction.highestBidder = senderID;
        auction.currentBid = bidAmount;
        auction.bids.push({
          bidderId: senderID,
          amount: bidAmount,
          time: Date.now(),
        });

        // Gia hạn thời gian nếu gần hết
        const timeLeft = auction.endTime - Date.now();
        if (timeLeft < 60000) {
          // Dưới 1 phút
          auction.endTime = Date.now() + 60000; // Thêm 1 phút

          // Thông báo về việc gia hạn
          api.sendMessage(
            `⏰ THỜI GIAN ĐẤU GIÁ ĐÃ ĐƯỢC GIA HẠN!\n` +
              `📦 Vật phẩm: ${auction.itemName}\n` +
              `🔖 ID: ${auction.id}\n` +
              `⌛ Thời gian mới: ${new Date(
                auction.endTime
              ).toLocaleTimeString()}`,
            threadID
          );
        }

        // Hoàn trả tiền cho người đặt giá trước đó
        if (previousBidder) {
          await updateBalance(previousBidder, previousBid);

          const previousBidderName = getUserName(previousBidder);
          api.sendMessage(
            `📢 BẠN ĐÃ BỊ TRẢ GIÁ CAO HƠN!\n\n` +
              `📦 Phiên đấu giá: ${auction.itemName}\n` +
              `💰 Giá của bạn: $${previousBid.toLocaleString()}\n` +
              `💰 Giá mới: $${bidAmount.toLocaleString()}\n` +
              `⏰ Kết thúc: ${new Date(
                auction.endTime
              ).toLocaleTimeString()}\n\n` +
              `✅ $${previousBid.toLocaleString()} đã được hoàn trả vào tài khoản của bạn\n` +
              `💡 Bạn có thể đặt giá cao hơn để tiếp tục tham gia!`,
            previousBidder
          );
        }

        // Trừ tiền người đặt giá mới
        await updateBalance(senderID, -bidAmount);

        // Thêm người đặt giá vào danh sách thông báo
        if (!auction.notifications.includes(senderID)) {
          auction.notifications.push(senderID);
        }

        // Tính % tăng giá so với giá khởi điểm
        const increasePercent = Math.floor(
          ((bidAmount - auction.startingBid) / auction.startingBid) * 100
        );

        return api.sendMessage(
          `✅ ĐẶT GIÁ THÀNH CÔNG! ✅\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📦 Vật phẩm: ${auction.itemName}\n` +
            `💰 Giá của bạn: $${bidAmount.toLocaleString()} (+${increasePercent}%)\n` +
            `💸 Số tiền đã bị khóa cho đến khi phiên đấu giá kết thúc\n\n` +
            `⏰ Kết thúc: ${new Date(auction.endTime).toLocaleTimeString()}\n` +
            `🔖 ID phiên: ${auction.id}\n\n` +
            `💡 Bạn sẽ được thông báo khi phiên đấu giá kết thúc!`,
          threadID,
          messageID
        );
      }
    }
  },
};
