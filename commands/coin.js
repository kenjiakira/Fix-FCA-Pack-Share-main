
const fs = require("fs");
const path = require("path");
const { getBalance, updateBalance } = require("../utils/currencies");
const axios = require("axios");
const { createCanvas } = require("canvas");
const { Chart } = require("chart.js/auto");
const { registerables } = require("chart.js");
const crypto = require('crypto');

Chart.register(...registerables);

const HALVING_INTERVAL = 2100000;
const HALVING_EVENTS = [];
const MINING_DATA_FILE = path.join(__dirname, "./json/mining_data.json");
const MARKET_DATA_FILE = path.join(__dirname, "./json/market_data.json");

let marketData = null;
let miningData = null;

const CONFIG = {

  baseMiner: {
    power: 1,
    consumption: 0.8,
    durability: 1000,
    maxDurability: 100,
    repairCost: 150000,
    miningEvents: {
      normal: [
        "⛏️ Đào được mạch quặng thường!",
        "💎 Tìm thấy mỏ nhỏ!",
        "🔨 Khai thác thành công!",
      ],
      critical: [
        "🌟 WOW! Đào trúng mỏ lớn!",
        "⚡ SIÊU HIẾM! Mạch quặng nguyên chất!",
        "🎯 JACKPOT! Kho báu cổ đại!",
      ],
      fail: [
        "💢 Máy đào quá nóng!",
        "💨 Bụi đá che khuất tầm nhìn!",
        "⚠️ Địa hình không ổn định!",
      ],
    },
  },

  coinLimit: {
    maxSupply: 21000000,
    currentSupply: 0,
    difficultyIncrease: 0.5,
    rewardReduction: 0.7,
    monopolyThreshold: 0.3,
    dailyTradeLimit: {
      buy: 99999999999,
      sell: 99999999999,
      resetTime: 24 * 60 * 60 * 1000,
    },
    crisis: {
      priceDropRate: 0.3,
      recoveryRate: 0.1,
      isActive: false,
    },
  },

  miningPools: {
    active: true,
    poolFee: 0.02,
    bonusReward: 0.15,
    minMembers: 3,
    maxPoolSize: 50,
  },
  miningEvents: {
    activeEvent: null,
    possibleEvents: [
      {
        id: "goldenHour",
        name: "Giờ Vàng",
        bonus: 2.5,
        duration: 3600000,
        chance: 0.05,
      },
      {
        id: "luckyStreak",
        name: "Chuỗi May Mắn",
        bonus: 1.8,
        successBonus: 0.2,
        duration: 7200000,
        chance: 0.1,
      },
    ],
  },
  energySystem: {
    maxEnergy: 300,
    miningCost: 20,
    recoveryRate: 1,
    recoveryInterval: 60 * 1000,
  },
  minerLevel: {
    level: 1,
    experience: 0,
    requiredExp: 1000,
    bonuses: {
      cooldownReduction: 0,
      criticalChance: 0,
      rewardBonus: 0,
    },
  },
  rareResources: {
    enabled: true,
    types: [
      { id: "diamond", name: "Kim Cương", value: 10, chance: 0.05 },
      { id: "platinum", name: "Bạch Kim", value: 5, chance: 0.1 },
      { id: "crystal", name: "Pha Lê", value: 3, chance: 0.15 },
    ],
    benefits: {
      diamond: { upgradeDiscount: 0.2 },
      platinum: { sellBonus: 0.15 },
      crystal: { miningBonus: 0.1 },
    },
  },
  powerGrid: {
    generator: {
      levels: [
        { level: 0, production: 1.0, cost: 0 },
        { level: 1, production: 1.5, cost: 500000 },
        { level: 2, production: 2.0, cost: 2000000 },
        { level: 3, production: 3.0, cost: 5000000 },
        { level: 4, production: 4.0, cost: 15000000 },
        { level: 5, production: 5.0, cost: 50000000 }
      ],
      peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      offPeakBonus: 1.5
    },
    fuelTypes: [
      { name: "Điện lưới", costPerUnit: 500000, energyPerUnit: 20, cooldown: 0 },
      { name: "Pin dự phòng", costPerUnit: 1500000, energyPerUnit: 70, cooldown: 60 * 60 * 1000 },
      { name: "Nhiên liệu diesel", costPerUnit: 5000000, energyPerUnit: 300, cooldown: 3 * 60 * 60 * 1000 }
    ]
  },
  epochs: {
    currentEpoch: 0,
    list: [
      {
        id: 0,
        name: "Genesis Era",
        supply: 0.2,
        difficultyMultiplier: 1,
        rewardMultiplier: 2.0,
        description: "Kỷ nguyên khai sinh"
      },
      {
        id: 1,
        name: "Growth Era",
        supply: 0.4,
        difficultyMultiplier: 2,
        rewardMultiplier: 1.5,
        description: "Kỷ nguyên phát triển"
      },
      {
        id: 2,
        name: "Maturity Era",
        supply: 0.6,
        difficultyMultiplier: 4,
        rewardMultiplier: 1.0,
        description: "Kỷ nguyên trưởng thành"
      },
      {
        id: 3,
        name: "Scarcity Era",
        supply: 0.8,
        difficultyMultiplier: 8,
        rewardMultiplier: 0.5,
        description: "Kỷ nguyên khan hiếm"
      },
      {
        id: 4,
        name: "Final Era",
        supply: 1.0,
        difficultyMultiplier: 16,
        rewardMultiplier: 0.25,
        description: "Kỷ nguyên cuối cùng"
      }
    ],
    milestones: []
  },
  upgradeCosts: {
    power: [
      150000, 300000, 600000, 1200000, 2400000, 4800000, 9600000, 19200000,
      38400000, 76800000,
    ],
    efficiency: [
      200000, 400000, 800000, 1600000, 3200000, 6400000, 12800000, 25600000,
      51200000, 102400000,
    ],
    cooling: [
      250000, 500000, 1000000, 2000000, 4000000, 8000000, 16000000, 32000000,
      64000000, 128000000,
    ],
  },
  blockReward: {
    current: 25,
    lastBlockTime: Date.now(),
    targetBlockTime: 20 * 60 * 1000,
    difficulty: 2,
    blockHeight: 0,
  },

  miningSuccess: {
    base: 0.6,
    perPowerLevel: 0.02,
    perCoolingLevel: 0.015,
    criticalChance: 0.05,
    criticalMultiplier: 1.8,
  },

  miningCooldown: 4 * 60 * 1000,

  market: {
    basePrice: 1500,
    volatility: 0.15,
    updateInterval: 30 * 1000,
    maxPrice: 10000000,
    minPrice: 1,
    crashChance: 0.1,
    minedCoinValue: {
      multiplier: 2.5,
      duration: 24 * 60 * 60 * 1000,
    },
    antiManipulation: {
      maxHoldingPercent: 0.4,
      cooldownBetweenTrades: 5 * 60 * 1000,
      largeTradeThreshold: 0.1,
      priceImpactLimit: 0.15,
      emergencyBreaker: {
        priceChangeThreshold: 0.3,
        cooldownDuration: 30 * 60 * 1000,
      }
    },
    npcTraders: {
      enabled: true,
      count: 3,
      behaviors: [
        {
          name: "Whale",
          minBalance: 1000000000,
          tradeSize: 0.2,
          priceThreshold: 0.15
        },
        {
          name: "Swing",
          minBalance: 100000000,
          tradeSize: 0.1,
          priceThreshold: 0.08
        },
        {
          name: "Scalper",
          minBalance: 10000000,
          tradeSize: 0.05,
          priceThreshold: 0.03
        }
      ],
      lastAction: Date.now()
    },
    currentPrice: 1500,
    scarcityEffect: {
      baseMultiplier: 1.2, 
      maxMultiplier: 1000,   
      growthRate: 0.15,      
      timeWeight: 0.2,      
      holdingWeight: 0.3,   
    },
    volumeImpact: {
      threshold: 15000000000,
      buyPressure: 0.02,
      sellPressure: 0.015,
      recoveryRate: 0.15,
      maxImpact: 0.2,
    },
    tradingVolume: {
      buy: 0,
      sell: 0,
      lastReset: Date.now(),
      totalVolume: 0,
    },
  },
  blockHistory: {
    blocks: [],
    maxBlocks: 100,
  },
  dailyQuests: {
    types: ["mine", "upgrade", "market"],
    rewards: {
      mine: 300,
      upgrade: 600,
      market: 450,
    },
    maxDaily: 3,
  },
};
CONFIG.advancedMining = {
  enabled: true,
  hashAlgorithm: 'sha256',
  difficulty: {
    initial: 12,
    current: 12,
    maxTarget: '00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    adjustmentInterval: 50,
    targetBlockTime: 300 * 1000,
    lastAdjustment: Date.now()
  },
  hardware: [
    { name: "CPU Mining (Intel i5)", hashrate: 50, power: 100, price: 0, efficiency: 0.5 },
    { name: "AMD Ryzen Mining", hashrate: 150, power: 200, price: 25000000, efficiency: 0.75 },

    { name: "RTX 4090 Mining Rig", hashrate: 500, power: 500, price: 50000000, efficiency: 1.0 },
    { name: "RX 6900 Farm", hashrate: 1200, power: 800, price: 100000000, efficiency: 1.5 },

    { name: "Antminer S19 XP", hashrate: 5000, power: 1500, price: 200000000, efficiency: 3.3 },
    { name: "Whatsminer M50S Pro", hashrate: 15000, power: 2500, price: 400000000, efficiency: 6.0 },
    { name: "Avalon A1366", hashrate: 50000, power: 3500, price: 800000000, efficiency: 14.3 },

    { name: "Antminer S21 XP", hashrate: 250000, power: 5000, price: 3000000000, efficiency: 50 },
    { name: "Bitmain X25", hashrate: 500000, power: 7500, price: 5000000000, efficiency: 66.7 },
    { name: "DragonMaster X1", hashrate: 1000000, power: 10000, price: 10000000000, efficiency: 100 }
  ],
  energyCost: CONFIG.energySystem.miningCost * 5,
  electricityCost: 2000000,
  rewardMultiplier: 10,
  cooldown: CONFIG.miningCooldown * 2,
  minPowerLevel: 3,

  pools: [
    { name: "Solo Mining", fee: 0, luck: 1.0, paymentMethod: "PPS", minPayout: 0 },
    { name: "F2Pool", fee: 0.02, luck: 1.1, paymentMethod: "PPLNS", minPayout: 0.1 },
    { name: "AntPool", fee: 0.025, luck: 1.15, paymentMethod: "PPS+", minPayout: 0.05 },
    { name: "Binance Pool", fee: 0.03, luck: 1.2, paymentMethod: "FPPS", minPayout: 0.01 }
  ],

  network: {
    hashrate: 5000000,
    lastBlocks: [],
    difficulty: 1,
    blockHeight: 0
  }
};
CONFIG.autoMining = {
  enabled: true,
  tickRate: 5 * 60 * 1000, // 5 phút/lần
  settings: {
    efficiency: 0.6, // 60% hiệu quả so với mine thủ công
    energyCost: 15, // Tốn ít năng lượng hơn
    maxDuration: 12 * 60 * 60 * 1000, // Tối đa 12h
    minPowerLevel: 2, // Yêu cầu power level tối thiểu
    prices: [
      { duration: 1 * 60 * 60 * 1000, cost: 500000000 }, // 1h = 500k
      { duration: 3 * 60 * 60 * 1000, cost: 1000000000 }, // 3h = 1m 
      { duration: 6 * 60 * 60 * 1000, cost: 1500000000 }, // 6h = 1.5m
      { duration: 12 * 60 * 60 * 1000, cost: 2500000000 } // 12h = 2.5m
    ]
  }
};
CONFIG.upgradeSystem = {
  componentTypes: [
    // Giữ 3 nâng cấp cơ bản
    { id: 1, name: "power", label: "Sức mạnh", emoji: "⚡", },
    { id: 2, name: "efficiency", label: "Hiệu suất", emoji: "📊" },
    { id: 3, name: "cooling", label: "Làm mát", emoji: "❄️" },

    // Thiết bị nâng cao - có thể mua trực tiếp
    {
      id: 4, name: "gpu", label: "Card đồ họa", emoji: "🎮",
      models: [
        { name: "GTX 1060 6GB", bonus: 1.5, price: 5000000 },
        { name: "RTX 2060 SUPER", bonus: 2.0, price: 15000000 },
        { name: "RTX 3070 Ti", bonus: 3.0, price: 35000000 },
        { name: "RTX 4070 Ti", bonus: 4.0, price: 75000000 },
        { name: "RTX 4080", bonus: 5.0, price: 120000000 },
        { name: "RTX 4090", bonus: 7.0, price: 250000000 },
        { name: "RTX 5090 Ti", bonus: 10.0, price: 500000000 }
      ]
    },
    {
      id: 5, name: "cooler", label: "Tản nhiệt", emoji: "🌡️",
      models: [
        { name: "Tản khí RGB", bonus: 1.2, price: 3000000 },
        { name: "Tản nước 240mm", bonus: 1.8, price: 12000000 },
        { name: "Custom Loop", bonus: 2.5, price: 35000000 },
        { name: "Phase Change", bonus: 3.5, price: 80000000 },
        { name: "LN2 Cooling", bonus: 5.0, price: 200000000 }
      ]
    },
    {
      id: 6, name: "ram", label: "RAM", emoji: "💾",
      models: [
        { name: "8GB DDR4", bonus: 1.2, price: 2000000 },
        { name: "16GB DDR4", bonus: 1.5, price: 5000000 },
        { name: "32GB DDR4", bonus: 2.0, price: 15000000 },
        { name: "32GB DDR5", bonus: 2.5, price: 35000000 },
        { name: "64GB DDR5", bonus: 3.5, price: 80000000 },
        { name: "128GB DDR5", bonus: 5.0, price: 200000000 }
      ]
    }
  ]
};
CONFIG.npcPlayers = {
  enabled: true,
  activeNPCs: [],
  groups: [
    {
      type: "Trader",
      count: 15,
      behavior: {
        tradeFrequency: 0.3,
        riskTolerance: 0.6,
        profitTarget: 0.15,
        stopLoss: 0.1,
        maxHoldingTime: 48 * 60 * 60 * 1000
      },
      initialBalance: {
        min: 10000000,
        max: 100000000
      }
    },
    {
      type: "Miner", 
      count: 20,
      behavior: {
        mineFrequency: 0.7,
        sellThreshold: 0.2,
        upgradeChance: 0.1,
        holdRatio: 0.4
      },
      initialBalance: {
        min: 5000000,
        max: 50000000  
      }
    },
    {
      type: "Investor",
      count: 15,
      behavior: {
        buyThreshold: -0.15,
        sellThreshold: 0.25,
        investmentRatio: 0.7,
        tradingInterval: 12 * 60 * 60 * 1000
      },
      initialBalance: {
        min: 50000000,
        max: 500000000
      }
    }
  ],

  names: [
    "Ánh Tuyết", "Bảo Ngọc", "Cẩm Tú", "Diệu Linh", "Hạnh Phúc", "Kiều Oanh", "Linh Chi", "Mai Anh", "Ngọc Hà", "Phương Anh",
    "Baka", "Linh Linh", "Thảo Nguyên", "Thiên Thanh", "Trang Anh", "Trúc Linh", "Tuyết Nhi", "Xuân Mai", "Yến Nhi", "Yến Trang",
    "Anh Dũng", "Bảo Long", "Chí Thành", "Duy Phong", "Hải Đăng", "Hoàng Anh", "Hùng Vĩ", "Minh Hiếu", "Quang Huy", "Thành Đạt",
    "Thế Anh", "Thiên Long", "Tuấn Kiệt", "Tuấn Tú", "Việt Anh", "Việt Dũng", "Việt Hùng", "Việt Tú", "Việt Tùng", "Xuân Phong"
  ]
};

CONFIG.npcMiners = {
  enabled: true,
  groups: [
    {
      name: "Hobby Miners", count: 12, basePower: 200, growthRate: 0.008, algorithm: "SHA-256",
      behavior: { sellThreshold: 2000, upgradeChance: 0.05, holdingRate: 0.3 }
    },
    {
      name: "Medium Farms", count: 6, basePower: 2000, growthRate: 0.015, algorithm: "SHA-256",
      behavior: { sellThreshold: 5000, upgradeChance: 0.1, holdingRate: 0.5 }
    },
    {
      name: "Corporate Miners", count: 3, basePower: 10000, growthRate: 0.02, algorithm: "SHA-256",
      behavior: { sellThreshold: 10000, upgradeChance: 0.2, holdingRate: 0.7 }
    },
    {
      name: "Institutional Mining", count: 1, basePower: 50000, growthRate: 0.03, algorithm: "SHA-256",
      behavior: { sellThreshold: 50000, upgradeChance: 0.3, holdingRate: 0.8 }
    }
  ],
  lastUpdated: Date.now(),
  holdings: 0,
  totalHashrate: 0,
  lastLogUpdate: Date.now()
};
function updateNPCMiners() {
  if (!CONFIG.npcMiners.enabled) return;

  const now = Date.now();
  const daysSinceStart = (now - CONFIG.npcMiners.lastUpdated) / (24 * 60 * 60 * 1000);

  let totalNpcHashrate = 0;
  CONFIG.npcMiners.groups.forEach(group => {
    const dayEffect = Math.pow(1 + group.growthRate, daysSinceStart);
    const difficultyEffect = Math.pow(CONFIG.blockReward.difficulty, 0.5);
    const scarcityEffect = Math.pow(CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply, 1.5);

    group.currentHashrate = group.basePower * group.count * dayEffect * difficultyEffect * (1 + scarcityEffect);
    totalNpcHashrate += group.currentHashrate;

    if (Math.random() < group.behavior.upgradeChance) {
      group.basePower *= 1.1;
    }
  });

  CONFIG.npcMiners.totalHashrate = totalNpcHashrate;

  const hoursSinceLastUpdate = (now - CONFIG.npcMiners.lastUpdated) / (60 * 60 * 1000);
  const networkShare = totalNpcHashrate / (totalNpcHashrate + calculateTotalPlayerHashrate(miningData));
  const blocksPerHour = 3600 / (CONFIG.blockReward.targetBlockTime / 1000);

  const estimatedCoins = hoursSinceLastUpdate * blocksPerHour * CONFIG.blockReward.current * networkShare;

  if (estimatedCoins > 0 && CONFIG.coinLimit.currentSupply + estimatedCoins <= CONFIG.coinLimit.maxSupply) {
    CONFIG.npcMiners.holdings += estimatedCoins;
    CONFIG.coinLimit.currentSupply += estimatedCoins;
  }

  CONFIG.npcMiners.groups.forEach(group => {
    if (CONFIG.npcMiners.holdings > group.behavior.sellThreshold) {
      const amountToSell = CONFIG.npcMiners.holdings * (1 - group.behavior.holdingRate);

      if (amountToSell > 100) {
        CONFIG.npcMiners.holdings -= amountToSell;

        handleNPCMarketActivity('sell', amountToSell, group.name);
      }
    }
  });

  if (now - CONFIG.npcMiners.lastLogUpdate > 6 * 60 * 60 * 1000) {
    console.log(`[NPC MINERS] Total Hashrate: ${formatNumber(totalNpcHashrate)} | Holdings: ${CONFIG.npcMiners.holdings.toFixed(2)} LCoin`);
    CONFIG.npcMiners.lastLogUpdate = now;
  }

  CONFIG.npcMiners.lastUpdated = now;
}
function handleNPCMarketActivity(type, amount, actorName) {
  if (!marketData.npcActivities) marketData.npcActivities = [];

  const priceImpact = type === 'buy' ? 0.05 : -0.03;
  const adjustedImpact = priceImpact * Math.min(1, amount / (CONFIG.coinLimit.currentSupply * 0.01));

  if (amount > CONFIG.coinLimit.currentSupply * 0.005) {
    const message = `${actorName} ${type === 'buy' ? 'đang mua vào' : 'đang bán ra'} ${amount.toFixed(0)} LCoin`;

    marketData.npcActivities.push({
      type: type,
      trader: actorName,
      amount: amount,
      price: marketData.price * (1 + (type === 'buy' ? 0.02 : -0.02)),
      timestamp: Date.now(),
      message: message,
      impact: adjustedImpact,
      duration: 4 * 60 * 60 * 1000
    });

    if (amount > CONFIG.coinLimit.currentSupply * 0.02) {
      global.sendAnnouncement(`📊 MARKET ALERT: ${message}! Giá có thể ${type === 'buy' ? 'tăng' : 'giảm'}.`);
    }
  }
}

function calculateTotalPlayerHashrate(miningData) {
  return Object.values(miningData).reduce((total, player) => {
    return total + calculatePlayerHashrate(player);
  }, 0);
}
function initializeData() {
  // Khởi tạo dữ liệu mặc định
  miningData = {};
  marketData = {
    price: CONFIG.market.basePrice,
    lastUpdate: Date.now(),
    history: [],
    tradingVolume: {
      buy: 0,
      sell: 0,
      lastReset: Date.now(),
      totalVolume: 0,
    },
    blockchain: {
      blockHeight: CONFIG.blockReward.blockHeight,
      currentReward: CONFIG.blockReward.current,
      lastBlockTime: CONFIG.blockReward.lastBlockTime,
      difficulty: CONFIG.blockReward.difficulty,
      halvingEvents: HALVING_EVENTS
    }
  };

  // Đọc dữ liệu từ file
  if (fs.existsSync(MINING_DATA_FILE)) {
    try {
      miningData = JSON.parse(fs.readFileSync(MINING_DATA_FILE));

      CONFIG.coinLimit.currentSupply = Object.values(miningData).reduce(
        (total, player) => total + player.stats.totalMined,
        0
      );
    } catch (error) {
      console.error("Lỗi khi đọc file mining data:", error);
    }
  }

  if (fs.existsSync(MARKET_DATA_FILE)) {
    try {
      const savedMarketData = JSON.parse(fs.readFileSync(MARKET_DATA_FILE));
      marketData = {
        ...marketData,
        ...savedMarketData,
        tradingVolume: {
          ...marketData.tradingVolume,
          ...savedMarketData.tradingVolume,
        },
      };

      if (savedMarketData.blockchain) {
        CONFIG.blockReward.blockHeight = savedMarketData.blockchain.blockHeight || 0;
        CONFIG.blockReward.current = savedMarketData.blockchain.currentReward || 50;
        CONFIG.blockReward.lastBlockTime = savedMarketData.blockchain.lastBlockTime || Date.now();
        CONFIG.blockReward.difficulty = savedMarketData.blockchain.difficulty || 1;

        if (savedMarketData.blockchain.halvingEvents &&
          savedMarketData.blockchain.halvingEvents.length > 0) {
          HALVING_EVENTS.length = 0;
          savedMarketData.blockchain.halvingEvents.forEach(event => HALVING_EVENTS.push(event));
        }
      }

      if (savedMarketData.blockHistory && savedMarketData.blockHistory.blocks) {
        CONFIG.blockHistory.blocks = savedMarketData.blockHistory.blocks;
      }
    } catch (error) {
      console.error("Lỗi khi đọc file market data:", error);
    }
  }

  return { miningData, marketData };
}
function initializeNPC(type) {
  const group = CONFIG.npcPlayers.groups.find(g => g.type === type);
  const name = CONFIG.npcPlayers.names[Math.floor(Math.random() * CONFIG.npcPlayers.names.length)];
  
  return {
    id: `npc_${Date.now()}_${Math.random().toString(36)}`,
    name: `${name} [NPC]`,
    type: type,
    balance: Math.floor(Math.random() * (group.initialBalance.max - group.initialBalance.min) + group.initialBalance.min),
    coins: 0,
    behavior: {...group.behavior},
    stats: {
      trades: 0,
      mined: 0,
      profit: 0
    },
    lastAction: Date.now(),
    upgrades: {
      power: Math.floor(Math.random() * 8),
      efficiency: Math.floor(Math.random() * 8),
      cooling: Math.floor(Math.random() * 8)
    }
  };
}

// Hàm cập nhật hoạt động NPC
function updateNPCActivities() {
  if (!CONFIG.npcPlayers.enabled) return;

  // Khởi tạo NPC nếu chưa có
  if (CONFIG.npcPlayers.activeNPCs.length === 0) {
    CONFIG.npcPlayers.groups.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        CONFIG.npcPlayers.activeNPCs.push(initializeNPC(group.type));
      }
    });
  }

  CONFIG.npcPlayers.activeNPCs.forEach(npc => {
    const now = Date.now();
    if (now - npc.lastAction < 5 * 60 * 1000) return; // Mỗi NPC 5 phút 1 lần

    switch(npc.type) {
      case "Trader":
        if (Math.random() < npc.behavior.tradeFrequency) {
          handleNPCTrading(npc);
        }
        break;

      case "Miner":
        if (Math.random() < npc.behavior.mineFrequency) {
          handleNPCMining(npc);
        }
        break;

      case "Investor":
        if (now - npc.lastAction > npc.behavior.tradingInterval) {
          handleNPCInvestment(npc);
        }
        break;
    }

    npc.lastAction = now;
  });
}

// Xử lý giao dịch của NPC
function handleNPCTrading(npc) {
  const priceChange = marketData.history.length > 0 
    ? (marketData.price - marketData.history[0].price) / marketData.history[0].price
    : 0;

  if (Math.abs(priceChange) > npc.behavior.riskTolerance) {
    const tradeAmount = Math.floor(npc.balance * 0.3 / marketData.price);
    
    if (priceChange > 0 && npc.coins > 0) {
      // Bán ra khi giá tăng
      const sellAmount = Math.floor(npc.coins * 0.5);
      const value = sellAmount * marketData.price;
      
      npc.coins -= sellAmount;
      npc.balance += value;
      npc.stats.trades++;
      
      marketData.npcActivities.push({
        type: "sell",
        trader: npc.name,
        amount: sellAmount,
        price: marketData.price,
        timestamp: Date.now()
      });
    } 
    else if (priceChange < 0 && npc.balance > marketData.price * 100) {
      // Mua vào khi giá giảm
      const buyAmount = Math.min(
        tradeAmount,
        Math.floor(npc.balance / marketData.price)
      );
      
      const cost = buyAmount * marketData.price;
      npc.coins += buyAmount;
      npc.balance -= cost;
      npc.stats.trades++;

      marketData.npcActivities.push({
        type: "buy",
        trader: npc.name,
        amount: buyAmount,
        price: marketData.price,
        timestamp: Date.now()
      });
    }
  }
}

// Xử lý đào coin của NPC
function handleNPCMining(npc) {
  if (Math.random() < npc.behavior.upgradeChance) {
    // Nâng cấp thiết bị
    const upgradeTypes = ["power", "efficiency", "cooling"];
    const type = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
    
    if (npc.upgrades[type] < 10) {
      const cost = CONFIG.upgradeCosts[type][npc.upgrades[type]];
      if (npc.balance > cost * 2) {
        npc.balance -= cost;
        npc.upgrades[type]++;
      }
    }
  }

  // Đào coin
  const miningSuccess = Math.random() < calculateMiningSuccess({upgrades: npc.upgrades});
  if (miningSuccess) {
    const reward = calculateMiningReward({upgrades: npc.upgrades}, false);
    npc.coins += reward;
    npc.stats.mined += reward;
    CONFIG.coinLimit.currentSupply += reward;
  }

  // Bán coin nếu đạt ngưỡng
  if (npc.coins > 0 && Math.random() < (1 - npc.behavior.holdRatio)) {
    const sellAmount = Math.floor(npc.coins * Math.random());
    const value = sellAmount * marketData.price;
    
    npc.coins -= sellAmount;
    npc.balance += value;
    
    marketData.npcActivities.push({
      type: "sell",
      trader: npc.name,
      amount: sellAmount,
      price: marketData.price,
      timestamp: Date.now()
    });
  }
}

// Xử lý đầu tư của NPC
function handleNPCInvestment(npc) {
  const priceChange = marketData.history.length > 0
    ? (marketData.price - marketData.history[0].price) / marketData.history[0].price
    : 0;

  if (priceChange <= npc.behavior.buyThreshold) {
    // Mua khi giá giảm sâu
    const investAmount = npc.balance * npc.behavior.investmentRatio;
    const buyAmount = Math.floor(investAmount / marketData.price);
    
    npc.coins += buyAmount;
    npc.balance -= buyAmount * marketData.price;
    
    marketData.npcActivities.push({
      type: "buy",
      trader: npc.name,
      amount: buyAmount,
      price: marketData.price,
      timestamp: Date.now(),
      message: "Đầu tư dài hạn"
    });
  }
  else if (priceChange >= npc.behavior.sellThreshold) {
    // Bán khi đạt mục tiêu
    const sellAmount = Math.floor(npc.coins * 0.7);
    const value = sellAmount * marketData.price;
    
    npc.coins -= sellAmount;
    npc.balance += value;
    
    marketData.npcActivities.push({
      type: "sell", 
      trader: npc.name,
      amount: sellAmount,
      price: marketData.price,
      timestamp: Date.now(),
      message: "Chốt lời"
    });
  }
}
function saveData(miningData, marketData) {
  marketData.blockchain = {
    blockHeight: CONFIG.blockReward.blockHeight,
    currentReward: CONFIG.blockReward.current,
    lastBlockTime: CONFIG.blockReward.lastBlockTime,
    difficulty: CONFIG.blockReward.difficulty,
    halvingEvents: HALVING_EVENTS
  };

  marketData.blockHistory = CONFIG.blockHistory;

  fs.writeFileSync(MINING_DATA_FILE, JSON.stringify(miningData, null, 2));
  fs.writeFileSync(MARKET_DATA_FILE, JSON.stringify(marketData, null, 2));
}

function initializePlayer(userId) {
  return {
    miner: { ...CONFIG.baseMiner },
    coins: 0,
    energy: 100,
    lastEnergyUpdate: Date.now(),
    powerSystem: {
      generatorLevel: 0,
      lastFuelUse: 0,
      fuelHistory: []
    },
    upgrades: {
      power: 0,
      efficiency: 0,
      cooling: 0,
    },
    lastMining: 0,
    stats: {
      totalMined: 0,
      successfulMines: 0,
      failedMines: 0,
    },
    quests: {
      daily: {
        type: null,
        progress: 0,
        target: 0,
        lastReset: 0,
      },
    },
    settings: {
      autoSell: false,
    },
    trading: {
      lastReset: Date.now(),
      dailyBuy: 0,
      dailySell: 0,
    },
    autoMining: {
      active: false,
      endTime: 0,
      totalMined: 0,
      lastTick: 0
    }
  };
}
CONFIG.walletSystem = {
  networkFee: 0.005, // 0.5% phí giao dịch
  minFee: 10,        // Phí tối thiểu 10 coin
  maxFee: 5000,      // Phí tối đa 5000 coin
  confirmations: 3,  // Số xác nhận cần thiết
  memoLimit: 100,    // Giới hạn ký tự ghi chú
  pendingExpiry: 24 * 60 * 60 * 1000, // 24 giờ
  txHistoryLimit: 20 // Lưu 20 giao dịch gần nhất
};
function generateWalletAddress(userID) {
  // Tạo địa chỉ dạng: LC + 32 ký tự hex
  const hash = crypto.createHash('sha256').update(userID + Date.now()).digest('hex');
  return 'LC' + hash.substring(0, 32).toUpperCase();
}

// Hàm khởi tạo ví cho người chơi mới
function initializeWallet(playerData, userID) {
  if (!playerData.wallet) {
    playerData.wallet = {
      address: generateWalletAddress(userID),
      privateKey: crypto.randomBytes(32).toString('hex'),
      transactions: [],
      pendingTx: [],
      created: Date.now()
    };
    console.log(`Created new wallet for ${userID}: ${playerData.wallet.address}`);
  }
  return playerData;
}

// Hàm xử lý giao dịch P2P
function processTransaction(sender, receiverAddress, amount, memo = "", miningData) {
  // Tìm địa chỉ ví người nhận
  let receiverID = null;
  for (const [uid, player] of Object.entries(miningData)) {
    if (player.wallet && player.wallet.address === receiverAddress) {
      receiverID = uid;
      break;
    }
  }

  if (!receiverID) {
    return { success: false, message: "❌ Địa chỉ ví không tồn tại trong hệ thống!" };
  }

  // Kiểm tra số dư và tính phí
  const networkFee = Math.min(
    CONFIG.walletSystem.maxFee,
    Math.max(CONFIG.walletSystem.minFee, amount * CONFIG.walletSystem.networkFee)
  );

  if (sender.coins < amount + networkFee) {
    return {
      success: false,
      message: `❌ Không đủ coin để thực hiện giao dịch!\n\n` +
        `💰 Số dư: ${sender.coins.toLocaleString()} LC\n` +
        `💸 Cần: ${amount.toLocaleString()} LC (+ ${networkFee.toLocaleString()} phí)`
    };
  }

  // Tạo ID giao dịch
  const txID = 'TX' + crypto.randomBytes(16).toString('hex').toUpperCase();
  const timestamp = Date.now();

  // Trừ coin người gửi
  sender.coins -= (amount + networkFee);

  // Thêm vào danh sách giao dịch đang chờ xác nhận
  const transaction = {
    txID: txID,
    from: sender.wallet.address,
    to: receiverAddress,
    amount: amount,
    fee: networkFee,
    memo: memo.substring(0, CONFIG.walletSystem.memoLimit),
    timestamp: timestamp,
    confirmations: 0,
    status: 'pending',
    blockHeight: CONFIG.blockReward.blockHeight
  };

  // Thêm vào lịch sử giao dịch của người gửi
  sender.wallet.transactions.push(transaction);
  if (sender.wallet.transactions.length > CONFIG.walletSystem.txHistoryLimit) {
    sender.wallet.transactions.shift();
  }

  // Thêm vào giao dịch đang chờ của người nhận
  miningData[receiverID].wallet.pendingTx.push({
    ...transaction,
    direction: 'in'
  });

  sender.wallet.pendingTx.push({
    ...transaction,
    direction: 'out'
  });

  return {
    success: true,
    transaction: transaction,
    message: `✅ GIAO DỊCH THÀNH CÔNG!\n\n` +
      `🆔 Mã giao dịch: ${txID}\n` +
      `💸 Số lượng: ${amount.toLocaleString()} LC\n` +
      `🔍 Phí mạng: ${networkFee.toLocaleString()} LC\n` +
      `📝 Ghi chú: ${memo || "(không có)"}\n\n` +
      `🔄 Trạng thái: Đang chờ xác nhận (0/${CONFIG.walletSystem.confirmations})\n` +
      `⏳ Thời gian xác nhận ước tính: ~${Math.ceil(CONFIG.blockReward.targetBlockTime * CONFIG.walletSystem.confirmations / 1000 / 60)} phút`
  };
}

// Hàm cập nhật trạng thái giao dịch sau mỗi block mới
function updateTransactions(miningData) {
  const currentHeight = CONFIG.blockReward.blockHeight;

  for (const [uid, player] of Object.entries(miningData)) {
    if (!player.wallet) continue;

    // Cập nhật số xác nhận cho giao dịch đang chờ
    player.wallet.pendingTx.forEach((tx, index) => {
      // Tăng số xác nhận
      if (tx.status === 'pending') {
        tx.confirmations = currentHeight - tx.blockHeight;

        // Xác nhận hoàn tất
        if (tx.confirmations >= CONFIG.walletSystem.confirmations) {
          tx.status = 'confirmed';

          // Nếu là giao dịch đến, cộng tiền cho người nhận
          if (tx.direction === 'in') {
            player.coins += tx.amount;

            // Thêm vào lịch sử giao dịch
            player.wallet.transactions.push({
              ...tx,
              status: 'confirmed'
            });

            if (player.wallet.transactions.length > CONFIG.walletSystem.txHistoryLimit) {
              player.wallet.transactions.shift();
            }
          }

          // Xóa khỏi danh sách chờ
          player.wallet.pendingTx.splice(index, 1);
        }
      }

      // Xóa giao dịch quá hạn
      const expiryTime = tx.timestamp + CONFIG.walletSystem.pendingExpiry;
      if (Date.now() > expiryTime && tx.status === 'pending') {
        // Nếu là giao dịch ra, hoàn tiền
        if (tx.direction === 'out') {
          player.coins += tx.amount + tx.fee;
        }

        // Đánh dấu là thất bại
        tx.status = 'failed';
        player.wallet.transactions.push({
          ...tx,
          status: 'failed',
          message: 'Giao dịch hết hạn'
        });

        player.wallet.pendingTx.splice(index, 1);
      }
    });
  }
}

function updatePlayerEnergy(player) {
  // Kiểm tra và khởi tạo năng lượng
  if (player.energy === undefined || player.energy === null) {
    player.energy = CONFIG.energySystem.maxEnergy; // Khởi tạo với giá trị mới
    player.lastEnergyUpdate = Date.now();
    return player;
  }

  // Giới hạn tối đa mới
  if (player.energy >= CONFIG.energySystem.maxEnergy) {
    player.energy = CONFIG.energySystem.maxEnergy;
    return player;
  }

  // Rest of code remains the same...
  const timePassed = Date.now() - player.lastEnergyUpdate;
  if (timePassed < CONFIG.energySystem.recoveryInterval) return player;

  // Tính toán các hệ số hồi phục...
  const generatorLevel = player.powerSystem?.generatorLevel || 0;
  const generator = CONFIG.powerGrid.generator.levels[generatorLevel];
  const generatorBonus = generator ? generator.production : 1;

  const currentHour = new Date().getHours();
  const isPeakHour = CONFIG.powerGrid.generator.peakHours.includes(currentHour);
  const timeBonus = !isPeakHour ? CONFIG.powerGrid.generator.offPeakBonus : 1;

  const efficiencyBonus = 1 + (player.upgrades.efficiency * 0.05);
  const poolBonus = player.settings?.inPool ? 1.1 : 1;

  const recoveryRate = CONFIG.energySystem.recoveryRate * 
                      generatorBonus * 
                      timeBonus * 
                      efficiencyBonus * 
                      poolBonus;

  let recoveredEnergy = Math.floor(timePassed / CONFIG.energySystem.recoveryInterval) * recoveryRate;

  // Áp dụng giới hạn mới
  player.energy = Math.min(
    CONFIG.energySystem.maxEnergy,
    player.energy + recoveredEnergy
  );

  player.lastEnergyUpdate = Date.now();

  return player;
}
function calculatePlayerHashrate(player) {
  let baseHashrate = (1 + player.upgrades.power * 0.2) *
    (1 + player.upgrades.efficiency * 0.1) *
    CONFIG.baseMiner.power * 100;

  if (player.specialUpgrades?.gpu) {
    baseHashrate *= player.specialUpgrades.gpu.bonus;
  }

  if (player.specialUpgrades?.coolingsystem) {
    baseHashrate *= (1 + (player.specialUpgrades.coolingsystem.bonus - 1) * 0.5);
  }

  return baseHashrate;
}

function attemptBlockMining(player, successRate, miningData) {
  const playerHashrate = calculatePlayerHashrate(player);
  const totalNetworkHashrate = calculateTotalNetworkPower(miningData);
  const playerShareOfNetwork = playerHashrate / totalNetworkHashrate;
  if (!CONFIG.blockHistory)
    CONFIG.blockHistory = { blocks: [], maxBlocks: 100 };
  CONFIG.blockHistory.blocks.push({
    height: CONFIG.blockReward.blockHeight,
    miner: player.name || senderID,
    reward: CONFIG.blockReward.current,
    timestamp: Date.now(),
    difficulty: CONFIG.blockReward.difficulty,
  });
  if (CONFIG.blockHistory.blocks.length > CONFIG.blockHistory.maxBlocks) {
    CONFIG.blockHistory.blocks.shift();
  }
  const timeSinceLastBlock =
    (Date.now() - CONFIG.blockReward.lastBlockTime) / 1000;
  const timeFactorMultiplier = Math.min(
    10,
    timeSinceLastBlock / (CONFIG.blockReward.targetBlockTime / 1000)
  );

  const blockMiningChance =
    Math.max(0.005, playerShareOfNetwork) * timeFactorMultiplier * 2.0;

  console.log(
    `[BLOCK] Cơ hội: ${(blockMiningChance * 100).toFixed(4)}%, Share: ${(
      playerShareOfNetwork * 100
    ).toFixed(2)}%, Time: ${timeFactorMultiplier.toFixed(2)}x`
  );

  if (Math.random() < blockMiningChance) {

    CONFIG.blockReward.blockHeight++;
    CONFIG.blockReward.lastBlockTime = Date.now();

    console.log(
      `[BLOCK] Player ${player.name || "Unknown"} đào được block #${CONFIG.blockReward.blockHeight
      } với phần thưởng ${CONFIG.blockReward.current} LCoin`
    );

    adjustBlockDifficulty();

    if (
      CONFIG.blockReward.blockHeight % 210000 === 0 &&
      CONFIG.blockReward.blockHeight > 0
    ) {
      handleHalvingEvent();
    }

    return CONFIG.blockReward.current;
  }

  return 0;
  updateTransactions(miningData);
}
function handleHalvingEvent() {
  const previousReward = CONFIG.blockReward.current;
  CONFIG.blockReward.current = Math.max(CONFIG.blockReward.current / 2, 0.1);

  const halvingEvent = {
    blockHeight: CONFIG.blockReward.blockHeight,
    newReward: CONFIG.blockReward.current,
    previousReward: previousReward,
    timestamp: Date.now(),
  };

  HALVING_EVENTS.push(halvingEvent);
  console.log(
    `[HALVING] Block #${CONFIG.blockReward.blockHeight}: Phần thưởng giảm từ ${previousReward} xuống ${CONFIG.blockReward.current}`
  );
}
function calculateTotalNetworkPower(miningData) {
  let totalPower = CONFIG.npcMiners.totalHashrate || 100;

  if (!miningData || typeof miningData !== 'object') {
    console.error("Invalid miningData provided to calculateTotalNetworkPower");
    return totalPower;
  }

  try {
    Object.values(miningData).forEach(player => {
      if (player && typeof player === 'object') {
        const playerHashrate = calculatePlayerHashrate(player);
        if (!isNaN(playerHashrate) && playerHashrate > 0) {
          totalPower += playerHashrate;
        }
      }
    });

    if (CONFIG.npcMiners && CONFIG.npcMiners.enabled && CONFIG.npcMiners.totalHashrate) {
      totalPower += CONFIG.npcMiners.totalHashrate;
    }

    return Math.max(100, totalPower);
  } catch (error) {
    console.error("Error calculating total network power:", error);
    return CONFIG.npcMiners.totalHashrate || 1000;
  }
}

function formatNumber(number) {
  if (number === null || number === undefined || isNaN(number)) return "N/A";
  if (number >= 1000000) return (number / 1000000).toFixed(2) + "M";
  if (number >= 1000) return (number / 1000).toFixed(2) + "K";
  return number.toFixed(2);
}
function applyStorageFee(player, miningData) {
  // Nếu người chơi chưa bao giờ trả phí hoặc thời gian đã quá 1 giờ
  const ONE_HOUR = 60 * 60 * 1000; // 1 giờ tính bằng millisecond

  if (!player.lastStorageFeeTime) {
    // Nếu chưa có thời gian nắm giữ, khởi tạo thời gian mà không trừ phí lần đầu
    player.lastStorageFeeTime = Date.now();
    return { applied: false };
  }

  // Chỉ áp dụng phí khi đã qua 1 giờ
  if (Date.now() - player.lastStorageFeeTime > ONE_HOUR) {
    const totalSupply = CONFIG.coinLimit.currentSupply;
    const holdingRatio = player.coins / totalSupply;

    let feeRate = 0;
    if (holdingRatio > 0.30) feeRate = 0.015;
    else if (holdingRatio > 0.20) feeRate = 0.01;
    else if (holdingRatio > 0.10) feeRate = 0.005;
    else if (holdingRatio > 0.05) feeRate = 0.002;
    else if (player.coins > 5000) feeRate = 0.001;

    if (feeRate > 0) {
      const fee = Math.floor(player.coins * feeRate);
      if (fee > 0) {
        player.coins -= fee;
        player.lastStorageFeeTime = Date.now();

        if (!player.feeHistory) player.feeHistory = [];
        player.feeHistory.push({
          amount: fee,
          rate: feeRate,
          timestamp: Date.now()
        });

        return {
          applied: true,
          fee: fee,
          rate: feeRate,
          message: `🏦 PHÍ LƯU TRỮ: -${fee} LCoin (${(feeRate * 100).toFixed(2)}%/giờ)`
        };
      }
    }

    player.lastStorageFeeTime = Date.now();
  }

  return { applied: false };
}
function updateCirculationNPC(miningData, marketData, api, threadID) {

  const totalSupply = CONFIG.coinLimit.currentSupply;
  const totalHeld = Object.values(miningData).reduce((sum, p) => sum + p.coins, 0);
  const circulatingSupply = Math.max(0, totalSupply - totalHeld);
  const circulationRatio = circulatingSupply / totalSupply;

  if (circulationRatio < 0.05) {
    const buyPressure = Math.min(0.5, Math.pow(0.05 / circulationRatio, 1.5) * 0.1);
    const buyAmount = Math.floor(totalSupply * 0.03);

    const npcNames = ["Central Fund", "Institutional Investor", "Market Maker", "Strategic Buyer"];

    for (let i = 0; i < Math.min(4, Math.ceil(0.05 / circulationRatio)); i++) {
      marketData.npcActivities = marketData.npcActivities || [];

      const individualBuyAmount = Math.floor(buyAmount / (i + 1));
      const npcName = npcNames[i % npcNames.length];

      marketData.npcActivities.push({
        type: "buy",
        trader: npcName,
        amount: individualBuyAmount,
        price: marketData.price * (1 + (0.03 * (i + 1))),
        timestamp: Date.now() + (i * 60000),
        message: `${npcName} đang mua ${individualBuyAmount.toLocaleString()} LCoin để ổn định thị trường`,
        impact: buyPressure / (i + 1),
        duration: 12 * 60 * 60 * 1000
      });
    }

    if (api && threadID && Math.random() < 0.2) {
      api.sendMessage(
        "📢 CẢNH BÁO: Lưu thông LCoin đang ở mức nguy hiểm thấp!" +
        `\n💹 Chỉ còn ${(circulationRatio * 100).toFixed(1)}% tổng cung đang lưu thông` +
        "\n🏦 Các định chế tài chính đang can thiệp thị trường" +
        "\n⚠️ Phí lưu trữ sẽ được áp dụng cho người nắm giữ lớn!",
        threadID
      );
    }

    marketData.price = Math.floor(marketData.price * (1 + buyPressure));

    console.log(`[MARKET INTERVENTION] Circulation critical: ${(circulationRatio * 100).toFixed(2)}%. Buy pressure: ${(buyPressure * 100).toFixed(2)}%`);

    return true;
  }

  return false;
}
function adjustBlockDifficulty() {
  const timeSinceLastBlock = Date.now() - CONFIG.blockReward.lastBlockTime;
  const ratio = CONFIG.blockReward.targetBlockTime / timeSinceLastBlock;

  if (ratio > 1.2) {
    CONFIG.blockReward.difficulty *= 1.1;
  } else if (ratio < 0.8) {
    CONFIG.blockReward.difficulty *= 0.9;
  }

  if (
    CONFIG.blockReward.blockHeight % 210000 === 0 &&
    CONFIG.blockReward.blockHeight > 0
  ) {
    CONFIG.blockReward.current = Math.max(CONFIG.blockReward.current / 2, 0.1);
    HALVING_EVENTS.push({
      blockHeight: CONFIG.blockReward.blockHeight,
      newReward: CONFIG.blockReward.current,
      timestamp: Date.now(),
    });
  }
}
function joinMiningPool(player) {
  player.settings.inPool = true;
  player.settings.poolFee = 0.02;
}

function leavePool(player) {
  player.settings.inPool = false;
}

function distributeMiningRewards(miningData, blockReward) {
  const poolMembers = Object.values(miningData).filter(
    (p) => p.settings?.inPool
  );
  const totalPoolPower = poolMembers.reduce((sum, p) => {
    return sum + (1 + p.upgrades.power * 0.2) * CONFIG.baseMiner.power;
  }, 0);

  poolMembers.forEach((member) => {
    const memberPower =
      (1 + member.upgrades.power * 0.2) * CONFIG.baseMiner.power;
    const share = memberPower / totalPoolPower;
    const reward = blockReward * share * (1 - member.settings.poolFee);
    member.coins += reward;
    member.stats.totalMined += reward;
  });
}
function ensurePlayerTradingInitialized(player) {
  if (!player.trading) {
    player.trading = {
      lastReset: Date.now(),
      dailyBuy: 0,
      dailySell: 0,
    };
  }
  return player;
}
function calculateAverageBuyPrice(player) {
  if (!player.transactions) return null;

  const buys = player.transactions.filter(tx => tx.type === 'buy');
  if (buys.length === 0) return null;

  const totalCost = buys.reduce((sum, tx) => sum + tx.totalCost, 0);
  const totalAmount = buys.reduce((sum, tx) => sum + tx.amount, 0);

  return totalCost / totalAmount;
}

function calculateHashMiningCost(player, duration) {
  const playerHardware = player.hashMiningHardware || 0;
  const hardware = CONFIG.advancedMining.hardware[playerHardware];

  if (!hardware) return 0;

  const powerUsage = hardware.power / 1000;
  const hourlyRate = powerUsage * CONFIG.advancedMining.electricityCost;
  const cost = (hourlyRate / 3600) * duration;

  return Math.ceil(cost);
}

function visualizeHashMining(process) {
  let visualization = "⛏️ HASH MINING VISUALIZATION ⛏️\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  visualization += `🔧 Hardware: ${process.hardware}\n`;
  visualization += `⚡ Hashrate: ${process.hashrate.toLocaleString()} H/s\n`;
  visualization += `⏱️ Thời gian: ${process.duration.toFixed(2)}s\n`;
  visualization += `🔢 Số lần thử: ${process.attempts.toLocaleString()}\n`;

  visualization += "\n🎯 TARGET: " + "0".repeat(process.targetDiff) + "...\n";

  if (process.successHash) {
    visualization += `\n✅ HASH FOUND!\n`;
    visualization += `🔍 Nonce: ${process.nonceFound}\n`;
    visualization += `🧮 Hash: ${process.successHash.substring(0, 25)}...\n`;

    const progress = "■".repeat(10);
    visualization += `\n📊 Mining progress: [${progress}] 100%\n`;
  }
  else {
    visualization += `\n❌ NO VALID HASH FOUND\n`;
    visualization += `🔍 Best difficulty: ${process.bestDiff} (cần ${process.targetDiff})\n`;

    const progressPercent = Math.min(100, (process.bestDiff / process.targetDiff) * 100);
    const progressCount = Math.floor(progressPercent / 10);
    const progress = "■".repeat(progressCount) + "□".repeat(10 - progressCount);
    visualization += `\n📊 Mining progress: [${progress}] ${progressPercent.toFixed(1)}%\n`;
  }

  return visualization;
}
function mineWithSHA256(player, difficultyTarget) {

  const prevBlock = CONFIG.blockHistory.blocks.length > 0
    ? CONFIG.blockHistory.blocks[CONFIG.blockHistory.blocks.length - 1]
    : { hash: '0'.repeat(64), height: 0 };

  function createMerkleRoot(transactions) {
    if (transactions.length === 0) return '0'.repeat(64);

    let hashes = transactions.map(tx => crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex'));

    if (hashes.length % 2 !== 0) {
      hashes.push(hashes[hashes.length - 1]);
    }

    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const combinedHash = crypto.createHash('sha256')
          .update(hashes[i] + hashes[i + 1])
          .digest('hex');
        newHashes.push(combinedHash);
      }
      hashes = newHashes;

      if (hashes.length % 2 !== 0 && hashes.length > 1) {
        hashes.push(hashes[hashes.length - 1]);
      }
    }

    return hashes[0];
  }

  const transactions = [
    { from: "Coinbase", to: player.name || 'Unknown', amount: CONFIG.blockReward.current, fee: 0 },
    ...Array.from({ length: 5 }, (_, i) => ({
      from: `Address${Math.floor(Math.random() * 1000)}`,
      to: `Address${Math.floor(Math.random() * 1000)}`,
      amount: Math.random() * 10,
      fee: Math.random() * 0.1
    }))
  ];

  const merkleRoot = createMerkleRoot(transactions);

  const blockHeader = {
    version: 1,
    previousBlockHash: prevBlock.hash,
    merkleRoot: merkleRoot,
    timestamp: Math.floor(Date.now() / 1000),
    bits: difficultyTarget,
    height: prevBlock.height + 1,
  };

  const maxNonce = 1000000;
  let nonce = 0;

  const playerHardware = player.hashMiningHardware || 0;
  const hardware = CONFIG.advancedMining.hardware[playerHardware];

  const hashrateFactor = hardware ? hardware.hashrate / 50 : 0.5;
  const maxAttempts = Math.min(maxNonce, Math.ceil(300 * hashrateFactor));
  const coolingBonus = 1 + (player.upgrades.cooling * 0.15);
  const effectiveAttempts = Math.ceil(maxAttempts * coolingBonus);

  const miningProcess = {
    startTime: Date.now(),
    attempts: 0,
    bestDiff: 0,
    targetDiff: parseInt(difficultyTarget, 16),
    hardware: hardware ? hardware.name : "CPU Mining",
    hashrate: hardware ? hardware.hashrate : 50,
    blocks: [],
    maxAttempts: effectiveAttempts
  };

  while (nonce < maxAttempts) {
    blockHeader.nonce = nonce;
    const headerString = JSON.stringify(blockHeader);
    const hash = crypto.createHash('sha256').update(headerString).digest('hex');

    miningProcess.attempts++;
    const leadingZeros = hash.match(/^0*/)[0].length;
    if (leadingZeros > miningProcess.bestDiff) {
      miningProcess.bestDiff = leadingZeros;
    }

    if (hash.startsWith('0'.repeat(difficultyTarget))) {

      const newBlock = {
        height: blockHeader.height,
        hash: hash,
        previousHash: blockHeader.previousBlockHash,
        merkleRoot: blockHeader.merkleRoot,
        nonce: nonce,
        timestamp: Date.now(),
        miner: player.name || 'Unknown',
        transactions: transactions,
        reward: CONFIG.blockReward.current,
        difficulty: difficultyTarget
      };

      miningProcess.endTime = Date.now();
      miningProcess.duration = (miningProcess.endTime - miningProcess.startTime) / 1000;
      miningProcess.nonceFound = nonce;
      miningProcess.successHash = hash;

      return {
        success: true,
        hash: hash,
        nonce: nonce,
        blockData: newBlock,
        process: miningProcess
      };
    }

    nonce++;
  }

  miningProcess.endTime = Date.now();
  miningProcess.duration = (miningProcess.endTime - miningProcess.startTime) / 1000;

  return {
    success: false,
    process: miningProcess,
    bestHash: crypto.createHash('sha256')
      .update(JSON.stringify({ ...blockHeader, nonce: Math.floor(Math.random() * maxAttempts) }))
      .digest('hex')
  };
}

function calculateScarcityMultiplier(miningData) {
  const supplyRatio = CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;

  const baseScarcity = Math.pow(supplyRatio, CONFIG.market.scarcityEffect.growthRate);

  const timeElapsed = (Date.now() - CONFIG.blockReward.lastBlockTime) / (24 * 60 * 60 * 1000);
  const timeEffect = Math.pow(1 + timeElapsed * CONFIG.market.scarcityEffect.timeWeight, 0.5);

  const totalHeld = Object.values(miningData).reduce((sum, player) => sum + player.coins, 0);
  const holdingRatio = totalHeld / CONFIG.coinLimit.currentSupply;
  const holdingEffect = Math.pow(1 + holdingRatio * CONFIG.market.scarcityEffect.holdingWeight, 2);

  const halvingCount = Math.floor(CONFIG.blockReward.blockHeight / 210000);
  const halvingEffect = Math.pow(1.5, halvingCount);

  let multiplier = CONFIG.market.scarcityEffect.baseMultiplier *
    baseScarcity *
    timeEffect *
    holdingEffect *
    halvingEffect;

  return Math.min(CONFIG.market.scarcityEffect.maxMultiplier, multiplier);
}
function checkAndUpdateEpoch() {
  const supplyRatio = CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;

  for (let i = CONFIG.epochs.list.length - 1; i >= 0; i--) {
    const epoch = CONFIG.epochs.list[i];
    if (supplyRatio >= (i > 0 ? CONFIG.epochs.list[i - 1].supply : 0) &&
      supplyRatio < epoch.supply) {

      if (CONFIG.epochs.currentEpoch !== epoch.id) {
        CONFIG.epochs.currentEpoch = epoch.id;
        CONFIG.epochs.milestones.push({
          epoch: epoch.id,
          timestamp: Date.now(),
          supply: CONFIG.coinLimit.currentSupply,
          price: marketData.price
        });

        return {
          newEpoch: true,
          epoch: epoch
        };
      }
      break;
    }
  }

  return {
    newEpoch: false,
    epoch: CONFIG.epochs.list[CONFIG.epochs.currentEpoch]
  };
}
function processAdvancedUpgrade(player, componentId, modelIndex, balance) {
  // Kiểm tra đầu vào cơ bản
  if (isNaN(componentId) || componentId < 4 ||
    componentId > CONFIG.upgradeSystem.componentTypes.length) {
    return {
      success: false,
      message: `❌ Loại nâng cấp không hợp lệ!`
    };
  }

  const component = CONFIG.upgradeSystem.componentTypes[componentId - 1];

  if (isNaN(modelIndex) || modelIndex < 1 || modelIndex > component.models.length) {
    return {
      success: false,
      message: `❌ Vui lòng chọn model hợp lệ cho ${component.label}!\n` +
        `Dùng '.coin upgrade list ${componentId}' để xem danh sách.`
    };
  }

  const model = component.models[modelIndex - 1];

  // Kiểm tra tiền
  if (balance < model.price) {
    return {
      success: false,
      message: `❌ Không đủ tiền để mua ${model.name}!\n` +
        `💰 Giá: ${model.price.toLocaleString()}$\n` +
        `💵 Số dư: ${balance.toLocaleString()}$`
    };
  }

  if (!player.specialUpgrades) player.specialUpgrades = {};
  const currentModel = player.specialUpgrades[component.name]?.modelName || "Chưa có";

  player.specialUpgrades[component.name] = {
    level: modelIndex,
    modelName: model.name,
    bonus: model.bonus
  };

  return {
    success: true,
    cost: model.price,
    message: `✅ ${component.emoji} ${component.label}: ${currentModel} → ${model.name}\n` +
      `⚡ Hiệu suất: x${model.bonus}\n` +
      `💵 Chi phí: ${model.price.toLocaleString()}$`
  };
}
function calculatePriceBasedRewardReduction(currentPrice) {
  
  const basePrice = 1500;

  const priceRatio = Math.max(1, currentPrice / basePrice);

  const rewardReductionFactor = 1 / Math.pow(priceRatio, 0.5);

  return Math.max(0.1, rewardReductionFactor);
}
function updatePlayerEnergy(player) {
  
  if (player.energy === undefined || player.energy === null) {
    player.energy = CONFIG.energySystem.maxEnergy;
    player.lastEnergyUpdate = Date.now();
    return player;
  }

  const timePassed = Date.now() - player.lastEnergyUpdate;
  if (timePassed < CONFIG.energySystem.recoveryInterval) return player;

  const generatorLevel = player.powerSystem?.generatorLevel || 0;
  const generator = CONFIG.powerGrid.generator.levels[generatorLevel];
  const generatorBonus = generator ? generator.production : 1;

  const currentHour = new Date().getHours();
  const isPeakHour = CONFIG.powerGrid.generator.peakHours.includes(currentHour);
  const timeBonus = !isPeakHour ? CONFIG.powerGrid.generator.offPeakBonus : 1;

  const efficiencyBonus = 1 + (player.upgrades.efficiency * 0.05);
  const poolBonus = player.settings?.inPool ? 1.1 : 1;

  const intervals = Math.floor(timePassed / CONFIG.energySystem.recoveryInterval);
  const recoveryRate = CONFIG.energySystem.recoveryRate * 
                      generatorBonus * 
                      timeBonus * 
                      efficiencyBonus * 
                      poolBonus;

  let recoveredEnergy = intervals * recoveryRate;

  if (player.autoMining?.active) {
  
    if (Date.now() > player.autoMining.endTime) {
      player.autoMining.active = false;
    } else if (Date.now() - player.autoMining.lastTick >= CONFIG.autoMining.tickRate) {
    
      if (player.energy >= CONFIG.autoMining.settings.energyCost) {
        const miningResult = attemptMining(player, CONFIG.autoMining.settings.efficiency);
        if (miningResult.success) {
          player.autoMining.totalMined += miningResult.reward;
          player.energy -= CONFIG.autoMining.settings.energyCost;
        }
      }
      player.autoMining.lastTick = Date.now();
    }
  }

  player.energy = Math.min(
    CONFIG.energySystem.maxEnergy,
    player.energy + recoveredEnergy
  );

  player.lastEnergyUpdate = Date.now() - (timePassed % CONFIG.energySystem.recoveryInterval);

  if (recoveredEnergy > 0) {
    console.log(`[ENERGY] Recovered ${recoveredEnergy.toFixed(2)} energy for player ${player.name || "Unknown"}`);
  }

  return player;
}
function calculateMiningDifficulty() {
  const supplyRatio = CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;
  const currentEpoch = CONFIG.epochs.list[CONFIG.epochs.currentEpoch];
  const baseMultiplier = currentEpoch.difficultyMultiplier;

  const basePricePoint = 1500;
  const priceRatio = Math.max(1, marketData.price / basePricePoint);

  const priceFactor = Math.pow(priceRatio, 0.33);

  let difficultyMultiplier = baseMultiplier *
    (1 + Math.pow(supplyRatio, 2) * 5) *
    priceFactor;

  return Math.min(50, difficultyMultiplier);
}
function updateMinerLevel(player, expGained) {
  if (!player.minerLevel) {
    player.minerLevel = {
      level: 1,
      experience: 0,
      requiredExp: 1000,
      bonuses: {
        cooldownReduction: 0,
        criticalChance: 0,
        rewardBonus: 0,
      },
    };
  }

  player.minerLevel.experience += expGained;

  if (player.minerLevel.experience >= player.minerLevel.requiredExp) {
    player.minerLevel.level++;
    player.minerLevel.experience -= player.minerLevel.requiredExp;
    player.minerLevel.requiredExp = Math.floor(
      player.minerLevel.requiredExp * 1.5
    );

    player.minerLevel.bonuses.cooldownReduction += 5;
    player.minerLevel.bonuses.criticalChance += 0.01;
    player.minerLevel.bonuses.rewardBonus += 0.05;

    return true;
  }

  return false;
}
function checkRareResources(player) {
  if (!CONFIG.rareResources.enabled) return null;

  for (const resource of CONFIG.rareResources.types) {
    if (Math.random() < resource.chance) {
      if (!player.resources) player.resources = {};

      player.resources[resource.id] = (player.resources[resource.id] || 0) + 1;

      return {
        id: resource.id,
        name: resource.name,
        value: resource.value,
      };
    }
  }

  return null;
}
function updateMarketPrice(marketData, miningData) {
  const timePassed = Date.now() - marketData.lastUpdate;
  if (timePassed >= CONFIG.market.updateInterval) {
    let change = (Math.random() - 0.5) * 2 * CONFIG.market.volatility;

    const daysPassed = Math.floor(
      (Date.now() - CONFIG.market.tradingVolume.lastReset) /
      (24 * 60 * 60 * 1000)
    );
    if (daysPassed >= 1) {
      CONFIG.market.tradingVolume.buy = 0;
      CONFIG.market.tradingVolume.sell = 0;
      CONFIG.market.tradingVolume.lastReset = Date.now();
    }

    if (Math.random() < CONFIG.market.crashChance) {
      change = -Math.random() * 0.3;
    }

    const scarcityMultiplier = calculateScarcityMultiplier(miningData);
    let scarcityEffect = 0;
    if (scarcityMultiplier > 1) {
      scarcityEffect = (scarcityMultiplier - 1) * 0.01;
    }

    if (marketData.npcActivities && marketData.npcActivities.length > 0) {
      const activeActivities = marketData.npcActivities.filter(
        activity => Date.now() < activity.timestamp + activity.duration
      );

      activeActivities.forEach(activity => {
        if (activity.type === "sell") {
          change -= 0.01;
        } else if (activity.type === "buy") {
          change += 0.005;
        }
      });

      marketData.npcActivities = activeActivities;
    }

    const { threshold, buyPressure, sellPressure, maxImpact } = CONFIG.market.volumeImpact;
    let volumeImpact = 0;
    const totalVolume = CONFIG.market.tradingVolume.totalVolume;

    if (totalVolume > threshold) {
      const volumeRatio = (totalVolume - threshold) / threshold;
      if (CONFIG.market.tradingVolume.buy > CONFIG.market.tradingVolume.sell) {
        volumeImpact -= Math.min(volumeRatio * buyPressure, maxImpact);
      } else {
        volumeImpact -= Math.min(volumeRatio * sellPressure, maxImpact);
      }
    }

    if (volumeImpact < 0) {
      volumeImpact += CONFIG.market.volumeImpact.recoveryRate;
    }

    if (CONFIG.coinLimit.crisis.isActive) {
      change = -CONFIG.coinLimit.crisis.priceDropRate * 0.5;
    } else if (marketData.price < CONFIG.market.basePrice) {
      change = CONFIG.coinLimit.crisis.recoveryRate * 0.5;
    }

    const totalChange = change + volumeImpact + scarcityEffect;
    const newPrice = Math.max(
      CONFIG.market.minPrice,
      Math.min(
        CONFIG.market.maxPrice,
        marketData.price * (1 + totalChange) * scarcityMultiplier
      )
    );

    marketData.history.push({
      price: marketData.price,
      timestamp: Date.now(),
      volumeImpact: volumeImpact,
      scarcityMultiplier: scarcityMultiplier,
    });

    if (marketData.history.length > 4320) {
      marketData.history.shift();
    }

    marketData.price = Math.round(newPrice);
    marketData.lastUpdate = Date.now();
  }
  return marketData;
}
function checkTradeManipulation(player, amount, type, marketData, miningData) {
  const config = CONFIG.market.antiManipulation;

  const now = Date.now();
  if (player.lastLargeTrade &&
    (now - player.lastLargeTrade) < config.cooldownBetweenTrades) {
    return {
      allowed: false,
      reason: "Vui lòng đợi thêm thời gian giữa các giao dịch lớn"
    };
  }

  const holdingRatio = player.coins / CONFIG.coinLimit.currentSupply;
  if (holdingRatio > config.maxHoldingPercent) {
    return {
      allowed: false,
      reason: "Vượt quá giới hạn nắm giữ cho phép"
    };
  }

  const priceImpact = calculatePriceImpact(amount, type, marketData, miningData);
  if (Math.abs(priceImpact) > config.priceImpactLimit) {
    return {
      allowed: false,
      reason: "Giao dịch sẽ tác động quá lớn đến giá"
    };
  }

  return { allowed: true };
}
function calculatePriceImpact(amount, type, marketData, miningData) {
  const currentSupply = CONFIG.coinLimit.currentSupply;
  const volumeRatio = amount / currentSupply;

  let impact = 0;

  if (type === "buy") {
    impact = Math.pow(volumeRatio, 1.5) * 0.5;

    if (marketData.history.length > 0) {
      const priceChange = (marketData.price - marketData.history[0].price) / marketData.history[0].price;
      if (priceChange > 0) {
        impact *= (1 + priceChange);
      }
    }
  } else {
    impact = -Math.pow(volumeRatio, 1.5) * 0.4;

    if (marketData.history.length > 0) {
      const priceChange = (marketData.price - marketData.history[0].price) / marketData.history[0].price;
      if (priceChange < 0) {
        impact *= (1 - priceChange);
      }
    }
  }

  const scarcityMultiplier = calculateScarcityMultiplier(miningData);
  impact *= scarcityMultiplier;

  const maxImpact = CONFIG.market.antiManipulation.priceImpactLimit;
  return Math.max(-maxImpact, Math.min(maxImpact, impact));
}

function calculateMiningDifficulty() {
  const supplyRatio =
    CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;

  let difficultyMultiplier;

  if (supplyRatio < 0.5) {
    difficultyMultiplier =
      1 +
      Math.pow(supplyRatio * 2, 1.5) * CONFIG.coinLimit.difficultyIncrease * 5;
  } else if (supplyRatio < 0.75) {
    difficultyMultiplier =
      1.5 +
      Math.pow((supplyRatio - 0.5) * 4, 2) *
      CONFIG.coinLimit.difficultyIncrease *
      10;
  } else if (supplyRatio < 0.9) {
    difficultyMultiplier =
      3 +
      Math.pow((supplyRatio - 0.75) * 10, 3) *
      CONFIG.coinLimit.difficultyIncrease *
      20;
  } else {
    difficultyMultiplier =
      5 +
      Math.pow((supplyRatio - 0.9) * 100, 4) *
      CONFIG.coinLimit.difficultyIncrease *
      50;
  }

  return Math.min(50, difficultyMultiplier);
}

function calculateRewardMultiplier() {
  const supplyRatio =
    CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;
  const rewardMultiplier =
    1 - Math.floor(supplyRatio * 10) * CONFIG.coinLimit.rewardReduction;
  return Math.max(0.1, rewardMultiplier);
}

function calculateMiningSuccess(player) {
  const base = CONFIG.miningSuccess.base;
  const powerBonus = player.upgrades.power * CONFIG.miningSuccess.perPowerLevel;
  const coolingBonus =
    player.upgrades.cooling * CONFIG.miningSuccess.perCoolingLevel;
  const difficulty = calculateMiningDifficulty();
  return Math.min(0.95, (base + powerBonus + coolingBonus) / difficulty);
}
function handleNPCTrading(marketData, miningData) {
  if (!CONFIG.market.npcTraders.enabled) return;
  if (!marketData.npcActivities) {
    marketData.npcActivities = [];
  }
  const now = Date.now();
  if (now - CONFIG.market.npcTraders.lastAction < 5 * 60 * 1000) return;

  const circulatingSupply = CONFIG.coinLimit.currentSupply -
    Object.values(miningData).reduce((total, p) => total + p.coins, 0);

  CONFIG.market.npcTraders.behaviors.forEach(npc => {
    const priceChange = marketData.history.length > 0
      ? (marketData.price - marketData.history[0].price) / marketData.history[0].price
      : 0;

    if (Math.abs(priceChange) > npc.priceThreshold) {
      const tradeAmount = Math.floor(circulatingSupply * npc.tradeSize);

      if (priceChange > 0) {
        marketData.npcActivities.push({
          type: "sell",
          trader: npc.name,
          amount: tradeAmount,
          price: marketData.price * 1.05,
          timestamp: now,
          duration: 24 * 60 * 60 * 1000
        });

        console.log(`[NPC] ${npc.name} plans to sell ${tradeAmount} coins at ${marketData.price * 1.05}$`);
      } else {
        marketData.npcActivities.push({
          type: "buy",
          trader: npc.name,
          amount: tradeAmount,
          price: marketData.price * 0.95,
          timestamp: now,
          duration: 24 * 60 * 60 * 1000
        });

        console.log(`[NPC] ${npc.name} plans to buy ${tradeAmount} coins at ${marketData.price * 0.95}$`);
      }
    }
  });

  CONFIG.market.npcTraders.lastAction = now;
}
function calculateMiningReward(player, isCritical = false) {
  // Khởi tạo halvingMultiplier
  const halvingCount = Math.floor(CONFIG.blockReward.blockHeight / HALVING_INTERVAL);
  const halvingMultiplier = Math.pow(0.5, halvingCount);

  // Tỷ lệ lưu thông/nắm giữ
  const totalSupply = CONFIG.coinLimit.currentSupply;
  const totalHeld = Object.values(miningData).reduce((sum, p) => sum + p.coins, 0);
  const circulatingSupply = Math.max(0, totalSupply - totalHeld);
  const circulationRatio = circulatingSupply / totalSupply;

  // TĂNG HỆ SỐ LƯU THÔNG - tăng cực mạnh khi ít người đào
  const circulationFactor = Math.min(20, Math.pow(4, circulationRatio * 2));

  // GIẢM TÁC ĐỘNG CỦA GIÁ CAO - giá cao ảnh hưởng ít hơn đến phần thưởng
  const priceRatio = Math.max(1, marketData.price / 1500);
  const priceFactor = 1 / Math.pow(priceRatio, 0.2); // Giảm mũ từ 0.3 xuống 0.2

  // Tính các hệ số từ thiết bị
  const powerMultiplier = Math.pow(1.3, player.upgrades.power || 0); // Tăng từ 1.2 lên 1.3
  const efficiencyMultiplier = Math.pow(1.2, player.upgrades.efficiency || 0); // Tăng từ 1.15 lên 1.2
  const gpuBonus = player.specialUpgrades?.gpu?.bonus || 1;
  const ramBonus = player.specialUpgrades?.ram?.bonus || 1;
  const coolerBonus = player.specialUpgrades?.cooler?.bonus || 1;
  const hardwareMultiplier = Math.sqrt(gpuBonus * ramBonus * coolerBonus) * 3; // Tăng từ 2 lên 3

  // TĂNG HỆ SỐ CƠ BẢN TỪ 50 LÊN 200
  let baseReward = Math.round(
    200 *                     // Tăng từ 50 lên 200
    powerMultiplier *
    efficiencyMultiplier *
    circulationFactor *
    priceFactor *
    hardwareMultiplier *
    halvingMultiplier
  );

  // TĂNG BIẾN ĐỘNG MAY MẮN
  const luckFactor = 0.8 + Math.random() * 1.7; // Tăng biến động từ 0.7-2.0 lên 0.8-2.5

  if (isCritical) {
    baseReward *= CONFIG.miningSuccess.criticalMultiplier * 2.0; // Tăng từ 1.5 lên 2.0
  }

  // TĂNG GIÁ TRỊ TỐI ĐA MỖI LẦN ĐÀO
  const maxRewardInUSD = 20000 * circulationFactor; // Tăng từ 10000 lên 20000
  const maxCoins = Math.ceil(maxRewardInUSD / marketData.price);

  // Tính reward cuối cùng
  let finalReward = Math.min(
    Math.round(baseReward * luckFactor),
    maxCoins
  );

  // TĂNG MỨC THƯỞNG TỐI THIỂU TỪ 2 LÊN 5
  finalReward = Math.max(5, finalReward);

  const availableSupply = CONFIG.coinLimit.maxSupply - CONFIG.coinLimit.currentSupply;
  return Math.min(finalReward, availableSupply);
}
function ensurePlayerStructure(player) {
  if (!player.specialUpgrades) {
    player.specialUpgrades = {};
    console.log("Đã khởi tạo specialUpgrades");
  }

  player.upgrades = player.upgrades || { power: 0, efficiency: 0, cooling: 0 };
  player.stats = player.stats || { totalMined: 0, successfulMines: 0, failedMines: 0 };
  player.settings = player.settings || {};

  return player;
}
function checkAndUpdateQuests(player) {
  const now = new Date();
  const currentDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const lastResetDate = new Date(CONFIG.market.tradingVolume.lastReset);
  const lastResetDay = new Date(
    lastResetDate.getFullYear(),
    lastResetDate.getMonth(),
    lastResetDate.getDate()
  );

  if (currentDate > lastResetDay) {
    console.log(
      `[MARKET] Resetting trading volume at ${now.toLocaleString("vi-VN")}`
    );
    CONFIG.market.tradingVolume.buy = 0;
    CONFIG.market.tradingVolume.sell = 0;
    CONFIG.market.tradingVolume.lastReset = Date.now();
  }

  const questLastReset = new Date(player.quests.daily.lastReset || 0);
  const questLastResetDay = new Date(
    questLastReset.getFullYear(),
    questLastReset.getMonth(),
    questLastReset.getDate()
  );
  const daysPassed = Math.floor(
    (currentDate - questLastResetDay) / (24 * 60 * 60 * 1000)
  );

  if (daysPassed >= 1 || !player.quests.daily.type) {
    const questTypes = CONFIG.dailyQuests.types;
    const randomType =
      questTypes[Math.floor(Math.random() * questTypes.length)];
    player.quests.daily = {
      type: randomType,
      progress: 0,
      target: randomType === "mine" ? 10 : 3,
      lastReset: now,
    };
  }

  return player;
}

async function generatePriceChart(marketData, period = "45p") {
  try {
    let historyData = [...marketData.history];
    let timeLabel = "";
    let cutoffTime = Date.now();

    switch (period) {
      case "1h":
        cutoffTime -= 60 * 60 * 1000;
        timeLabel = "1 giờ";
        break;
      case "4h":
        cutoffTime -= 4 * 60 * 60 * 1000;
        timeLabel = "4 giờ";
        break;
      case "6h":
        cutoffTime -= 6 * 60 * 60 * 1000;
        timeLabel = "6 giờ";
        break;
      case "12h":
        cutoffTime -= 12 * 60 * 60 * 1000;
        timeLabel = "12 giờ";
        break;
      case "24h":
        cutoffTime -= 24 * 60 * 60 * 1000;
        timeLabel = "24 giờ";
        break;
      case "45p":
      default:
        cutoffTime -= 45 * 60 * 1000;
        timeLabel = "45 phút";
        break;
    }

    const relevantHistory = historyData.filter(
      (item) => item.timestamp >= cutoffTime
    );

    if (relevantHistory.length < 2) {
      return {
        success: false,
        message: "Chưa đủ dữ liệu lịch sử để tạo biểu đồ",
      };
    }

    relevantHistory.push({
      price: marketData.price,
      timestamp: Date.now(),
    });

    const timestamps = relevantHistory.map((item) => {
      const date = new Date(item.timestamp);
      if (period === "45p") {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else if (period === "1h") {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (period === "4h" || period === "6h") {
        return date.toLocaleString("vi-VN", {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        return date.toLocaleString("vi-VN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    });

    const prices = relevantHistory.map((item) => item.price);
    const priceChange =
      ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
    const volumeData = relevantHistory.map((item) => item.volumeImpact || 0);
    const scarcityData = relevantHistory.map(
      (item) => item.scarcityMultiplier || 1
    );

    const ma20 = calculateMA(prices, 20);
    const ma50 = calculateMA(prices, 50);
    const ma100 = calculateMA(prices, 100);
    const volatility = calculateVolatility(prices);
    const rsiPeriod = 14;
    const rsiValues = calculateRSI(prices, rsiPeriod);
    const { upperBand, lowerBand } = calculateBollingerBands(prices, 20, 2);
    const macdData = calculateMACD(prices);

    const width = 1200;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#0B1221");
    bgGradient.addColorStop(0.5, "#0D1425");
    bgGradient.addColorStop(1, "#0F1628");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const noise = Math.random() * 3;
      pixels[i] = Math.min(255, pixels[i] + noise);
      pixels[i + 1] = Math.min(255, pixels[i + 1] + noise);
      pixels[i + 2] = Math.min(255, pixels[i + 2] + noise);
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 60) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    if (global.priceChart) {
      global.priceChart.destroy();
    }

    const upColor = "rgba(0, 192, 80, 1)";
    const downColor = "rgba(255, 56, 56, 1)";

    const primaryColor = priceChange >= 0 ? upColor : downColor;
    const fillColor =
      priceChange >= 0 ? "rgba(0, 192, 80, 0.1)" : "rgba(255, 56, 56, 0.1)";

    const gradientFill = ctx.createLinearGradient(0, 0, 0, height * 0.8);
    if (priceChange >= 0) {
      gradientFill.addColorStop(0, "rgba(0, 192, 80, 0.4)");
      gradientFill.addColorStop(0.2, "rgba(0, 192, 80, 0.25)");
      gradientFill.addColorStop(0.6, "rgba(0, 192, 80, 0.15)");
      gradientFill.addColorStop(1, "rgba(0, 192, 80, 0.05)");
    } else {
      gradientFill.addColorStop(0, "rgba(255, 56, 56, 0.4)");
      gradientFill.addColorStop(0.2, "rgba(255, 56, 56, 0.25)");
      gradientFill.addColorStop(0.6, "rgba(255, 56, 56, 0.15)");
      gradientFill.addColorStop(1, "rgba(255, 56, 56, 0.05)");
    }

    const patternCanvas = createCanvas(10, 10);
    const patternCtx = patternCanvas.getContext("2d");
    patternCtx.strokeStyle =
      priceChange >= 0 ? "rgba(0, 192, 80, 0.1)" : "rgba(255, 56, 56, 0.1)";
    patternCtx.lineWidth = 0.5;
    patternCtx.beginPath();
    patternCtx.moveTo(0, 10);
    patternCtx.lineTo(10, 0);
    patternCtx.stroke();
    const pattern = ctx.createPattern(patternCanvas, "repeat");

    global.priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: timestamps,
        datasets: [
          {
            label: "LCoin/USDT",
            data: prices,
            borderColor: primaryColor,
            backgroundColor: gradientFill,
            borderWidth: 5,
            fill: true,
            tension: 0.3,
            order: 1,
            pointBackgroundColor: function (context) {
              const index = context.dataIndex;
              if (index === 0) return null;
              const currentPrice = prices[index];
              const previousPrice = prices[index - 1];

              return currentPrice > previousPrice
                ? "rgba(0, 220, 100, 1)"
                : "rgba(255, 70, 70, 1)";
            },
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
            pointRadius: function (context) {
              const index = context.dataIndex;
              if (index === 0 || index === prices.length - 1) return 7;
              const currentPrice = prices[index];
              const previousPrice = prices[index - 1];
              const changePercent = Math.abs(
                ((currentPrice - previousPrice) / previousPrice) * 100
              );
              return changePercent > 0.3 ? 5 : 0;
            },
            pointHoverRadius: 10,
            pointHoverBackgroundColor: primaryColor,
            pointHoverBorderColor: "#FFFFFF",
            pointHoverBorderWidth: 3,
          },
          {
            label: "MA20",
            data: ma20,
            borderColor: "rgba(255, 206, 86, 0.8)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [5, 5],
            order: 2,
          },
          {
            label: "MA50",
            data: ma50,
            borderColor: "rgba(75, 192, 192, 0.8)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [5, 5],
            order: 3,
          },
          {
            label: "MA100",
            data: ma100,
            borderColor: "rgba(153, 102, 255, 0.8)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [5, 5],
            order: 4,
          },
          {
            label: "BB Upper",
            data: upperBand,
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderWidth: 1,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [3, 3],
            order: 5,
          },
          {
            label: "BB Lower",
            data: lowerBand,
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderWidth: 1,
            fill: {
              target: "+1",
              above: "rgba(255, 255, 255, 0.05)",
            },
            tension: 0.4,
            pointRadius: 0,
            borderDash: [3, 3],
            order: 6,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 15,
            right: 40,
            top: 30,
            bottom: 15,
          },
        },
        plugins: {
          title: {
            display: true,
            text: [
              "LCOIN/USDT",
              `${timeLabel} | Vol: ${formatNumber(
                volumeData.reduce((a, b) => a + b, 0)
              )} | Biến động: ${volatility.toFixed(2)}%`,
              `${formatPrice(prices[prices.length - 1])} ${priceChange >= 0 ? "▲" : "▼"
              } ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
            ],
            color: "#ffffff",
            font: {
              size: 24,
              weight: "bold",
              family: "Arial, Consolas",
            },
            padding: {
              top: 20,
              bottom: 25,
            },
            align: "start",
          },
          legend: {
            display: true,
            labels: {
              color: "#8F959E",
              font: {
                family: "Consolas",
                size: 11,
              },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              filter: function (item) {
                return !item.text.includes("BB");
              },
            },
            position: "top",
            align: "end",
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(17, 23, 29, 0.95)",
            titleColor: "#8F959E",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            titleFont: {
              family: "Consolas",
              size: 13,
              weight: "normal",
            },
            bodyFont: {
              family: "Consolas",
              size: 12,
            },
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function (tooltipItems) {
                const date = new Date(
                  relevantHistory[tooltipItems[0].dataIndex]?.timestamp
                );
                return date.toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
              },
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  if (label.includes("BB")) return null;
                  label = `${label}: `;
                  label += formatPrice(context.parsed.y);
                }
                return label;
              },
              afterBody: function (tooltipItems) {
                const index = tooltipItems[0].dataIndex;
                const volume = volumeData[index];
                const scarcity = scarcityData[index];
                const rsi = rsiValues[index];
                const macdInfo = macdData[index];

                return [
                  "",
                  `RSI(14): ${rsi?.toFixed(2) || "N/A"}`,
                  `MACD: ${macdInfo?.macd?.toFixed(4) || "N/A"} (${macdInfo?.signal?.toFixed(4) || "N/A"
                  })`,
                  `Khối lượng: ${formatNumber(volume)}`,
                  `Hệ số khan hiếm: ${scarcity?.toFixed(3) || "N/A"}x`,
                ];
              },
            },
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.04)",
              drawBorder: false,
              tickLength: 10,
            },
            ticks: {
              color: "#8F959E",
              maxRotation: 0,
              font: {
                family: "Consolas",
                size: 11,
              },
              maxTicksLimit: 8,
              align: "inner",
            },
            offset: true,
          },
          y: {
            position: "right",
            grid: {
              color: "rgba(255, 255, 255, 0.04)",
              drawBorder: false,
            },
            ticks: {
              color: "#8F959E",
              callback: function (value) {
                return formatPrice(value);
              },
              font: {
                family: "Consolas",
                size: 11,
              },
              padding: 10,
            },
            min: 0,
            suggestedMin: Math.max(0, Math.min(...prices) * 0.9),
            suggestedMax: Math.max(...prices) * 1.1,
            beginAtZero: true,
            offset: true,
          },
        },
        animations: {
          y: {
            easing: "easeOutCubic",
            duration: 1500,
          },
        },
      },
    });

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#8F959E";
    ctx.textAlign = "right";
    ctx.translate(width - 20, height - 20);
    ctx.fillText("Created by HNT", 0, 0);
    ctx.restore();

    const buffer = canvas.toBuffer("image/png");
    const chartPath = "./commands/cache/market_chart.png";
    fs.writeFileSync(chartPath, buffer);

    global.priceChart.destroy();
    global.priceChart = null;

    return {
      success: true,
      chartPath,
      priceChange,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices),
      volatility,
      dataPoints: relevantHistory.length,
    };
  } catch (error) {
    console.error("Error generating chart:", error);
    if (global.priceChart) {
      global.priceChart.destroy();
      global.priceChart = null;
    }
    return { success: false, message: "Lỗi khi tạo biểu đồ" };
  }
}
function joinPool(player, poolId = "main") {
  if (!global.miningPools) {
    global.miningPools = {
      main: {
        members: [],
        totalHashrate: 0,
        blocksFound: 0,
        lastUpdated: Date.now()
      }
    };
  }

  if (!global.miningPools[poolId]) {
    global.miningPools[poolId] = {
      members: [],
      totalHashrate: 0,
      blocksFound: 0,
      lastUpdated: Date.now()
    };
  }

  const pool = global.miningPools[poolId];

  if (!pool.members.includes(player.id)) {
    pool.members.push(player.id);
  }

  player.settings = player.settings || {};
  player.settings.inPool = true;
  player.settings.poolId = poolId;
  player.settings.poolFee = CONFIG.miningPools.poolFee;
  player.settings.joinedPool = Date.now();

  return CONFIG.miningPools.bonusReward;
}
function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const xPos = x + size * Math.cos(angle);
    const yPos = y + size * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(xPos, yPos);
    } else {
      ctx.lineTo(xPos, yPos);
    }
  }
  ctx.closePath();
  ctx.stroke();
}

function calculateMACD(
  prices,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(null);
      continue;
    }
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }
  const signalLine = calculateEMA(
    macdLine.filter((x) => x !== null),
    signalPeriod
  );
  let signalIndex = 0;

  const result = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1 || !macdLine[i]) {
      result.push(null);
      continue;
    }

    const signal = signalLine[signalIndex++] || null;
    result.push({
      macd: macdLine[i],
      signal: signal,
      histogram: signal !== null ? macdLine[i] - signal : null,
    });
  }

  return result;
}

function calculateEMA(prices, period) {
  const results = [];
  const multiplier = 2 / (period + 1);

  let sma = 0;
  for (let i = 0; i < period; i++) {
    if (i < period - 1) {
      results.push(null);
    }
    sma += prices[i] || 0;
  }
  sma = sma / period;
  results.push(sma);

  for (let i = period; i < prices.length; i++) {
    const ema =
      (prices[i] - results[results.length - 1]) * multiplier +
      results[results.length - 1];
    results.push(ema);
  }

  return results;
}

function formatNumber(number) {
  if (number === null || number === undefined) return "N/A";
  if (number >= 1000000) return (number / 1000000).toFixed(2) + "M";
  if (number >= 1000) return (number / 1000).toFixed(2) + "K";
  return number.toFixed(2);
}

function formatPrice(price) {
  if (price === null || price === undefined) return "N/A";
  if (price >= 1000000) return (price / 1000000).toFixed(2) + "M $";
  if (price >= 1000) return (price / 1000).toFixed(2) + "K $";
  return price.toFixed(2) + " $";
}

function calculateMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

function calculateRSI(prices, period = 14) {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const rsi = [];
  let gains = [];
  let losses = [];

  for (let i = 0; i < period; i++) {
    const change = changes[i] || 0;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
    rsi.push(null);
  }

  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / (avgLoss || 1);
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const middleBand = calculateMA(prices, period);
  const upperBand = [];
  const lowerBand = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upperBand.push(null);
      lowerBand.push(null);
      continue;
    }

    const slice = prices.slice(i - period + 1, i + 1);
    const avg = middleBand[i];
    const variance =
      slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    upperBand.push(avg + standardDeviation * stdDev);
    lowerBand.push(avg - standardDeviation * stdDev);
  }

  return { upperBand, lowerBand, middleBand };
}

function checkAndResetDailyLimit(player) {
  ensurePlayerTradingInitialized(player);
  const now = new Date();
  const currentDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const lastResetDate = new Date(player.trading.lastReset);
  const lastResetDay = new Date(
    lastResetDate.getFullYear(),
    lastResetDate.getMonth(),
    lastResetDate.getDate()
  );

  if (currentDate > lastResetDay) {
    player.trading.lastReset = now.getTime();
    player.trading.dailyBuy = 0;
    player.trading.dailySell = 0;
    return true;
  }
  return false;
}

function getRemainingTradeLimit(player, type = "buy") {
  ensurePlayerTradingInitialized(player);
  checkAndResetDailyLimit(player);
  const limit = CONFIG.coinLimit.dailyTradeLimit[type];
  const used =
    type === "buy" ? player.trading.dailyBuy : player.trading.dailySell;
  return Math.max(0, limit - used);
}

function calculateSellValue(player, amount, price) {
  let totalValue = 0;
  let remainingAmount = amount;

  if (player.minedCoins && player.minedCoins.length > 0) {
    player.minedCoins = player.minedCoins.filter(
      (coin) =>
        Date.now() - coin.timestamp < CONFIG.market.minedCoinValue.duration
    );

    for (let i = 0; i < player.minedCoins.length && remainingAmount > 0; i++) {
      const minedCoin = player.minedCoins[i];
      const useAmount = Math.min(remainingAmount, minedCoin.amount);

      totalValue += useAmount * price * CONFIG.market.minedCoinValue.multiplier;
      remainingAmount -= useAmount;
      minedCoin.amount -= useAmount;
    }

    player.minedCoins = player.minedCoins.filter((coin) => coin.amount > 0);
  }

  if (remainingAmount > 0) {
    totalValue += remainingAmount * price;
  }

  return Math.floor(totalValue);
}

module.exports = {
  name: "coin",
  dev: "HNT",
  category: "Games",
  info: "Trò chơi đào coin",
  usage: ".coin [mine/info/upgrade/market/sell/buy/quest]",
  onPrefix: true,
  cooldowns: 0,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    let { miningData, marketData } = initializeData();

    const data = initializeData();
    miningData = data.miningData;
    marketData = data.marketData;

    updateNPCActivities(); 
    updateNPCMiners();
    updateCirculationNPC(miningData, marketData, api, threadID);
    marketData = updateMarketPrice(marketData, miningData);

    if (!miningData[senderID]) {
      miningData[senderID] = initializePlayer(senderID);
    }


    if (Math.random() < 0.2) {
      const bestTrade = global.tradingSystem?.offers
        .filter(o => o.status === "active" && o.price < marketData.price * 0.95)
        .sort((a, b) => a.price - b.price)[0];

      if (bestTrade) {
        api.sendMessage(
          "💡 HOT DEAL: Có người đang bán coin với giá tốt hơn 5% so với thị trường!\n" +
          `ID: ${bestTrade.id} | Giá: ${bestTrade.price}$ (thị trường: ${marketData.price}$)\n` +
          "Sử dụng .coin trade accept để mua!",
          threadID
        );
      }
    }
    const player = miningData[senderID];
    ensurePlayerStructure(player);
    updatePlayerEnergy(player);
    marketData = updateMarketPrice(marketData, miningData);
    const feeResult = applyStorageFee(player, miningData);

    player.miner = player.miner || { ...CONFIG.baseMiner };

    if (!player.name) {
      try {
        const userName = event.senderName || "Unknown";
        player.name = userName;
      } catch (error) {
        console.error("Error getting user name:", error);
      }
    }

    if (player.energy === undefined || player.energy === null) {
      player.energy = CONFIG.energySystem.maxEnergy;
      player.lastEnergyUpdate = Date.now();
    }

    updatePlayerEnergy(player);

    marketData = updateMarketPrice(marketData, miningData);
    miningData[senderID] = checkAndUpdateQuests(player);

    const helpMessage =
      `🎮 LCOIN MINING GAME 2.0 🎮
━━━━━━━━━━━━━━━━━━

⛏️ HOẠT ĐỘNG CƠ BẢN:
• mine - Đào coin
• info - Thông tin máy đào
• upgrade - Nâng cấp thiết bị
• hash - Đào coin nâng cao hơn
• auto - Tự động đào coin

💰 GIAO DỊCH & THỊ TRƯỜNG:
• market - Xem thị trường
• buy/sell [số lượng] - Mua/Bán coin
• autosell [on/off] - Tự động bán
• wallet - Xem ví của bạn
• trade - Giao dịch coin nâng cao

⚡ HỆ THỐNG NĂNG LƯỢNG:
• energy - Quản lý năng lượng
• pool - Tham gia mining pool

📊 THỐNG KÊ & THÔNG TIN:
• supply - Xem nguồn cung
• halving - Lịch sử halving
• epoch - Kỷ nguyên coin
• top - Xem bảng xếp hạng

💎 TÀI SẢN CỦA BẠN:
• Số coin: ${player.coins.toLocaleString()}
• Giá hiện tại: ${marketData.price.toLocaleString()}$
• Tổng giá trị: ${(player.coins * marketData.price).toLocaleString()}$

💡 MẸO:
• Đào vào giờ thấp điểm để tăng hiệu quả
• Nâng cấp đồng bộ các chỉ số
• Tham gia pool để tăng phần thưởng
• Theo dõi thị trường để giao dịch tốt

Gõ .coin + lệnh để sử dụng`;
    if (!target[0]) {
      return api.sendMessage(helpMessage, threadID, messageID);
    }

    const command = target[0].toLowerCase();

    switch (command) {
      case "mine":
        if (player.energy === undefined || player.energy === null) {
          player.energy = CONFIG.energySystem.maxEnergy;
          player.lastEnergyUpdate = Date.now();
        }
        updatePlayerEnergy(player);

        if (player.energy < CONFIG.energySystem.miningCost) {
          const timeToRecover =
            Math.ceil(
              (CONFIG.energySystem.miningCost - player.energy) /
              CONFIG.energySystem.recoveryRate
            ) *
            (CONFIG.energySystem.recoveryInterval / 1000 / 60);

          return api.sendMessage(
            `⚡ NĂNG LƯỢNG KHÔNG ĐỦ! ⚡\n\n` +
            `🔋 Năng lượng hiện tại: ${player.energy}/${CONFIG.energySystem.maxEnergy}\n` +
            `⏳ Thời gian hồi phục: ~${timeToRecover} phút\n\n` +
            "💡 Mẹo: Nâng cấp cooling để giảm tiêu hao năng lượng!",
            threadID,
            messageID
          );
        }

        player.energy -=
          CONFIG.energySystem.miningCost * (1 - player.upgrades.cooling * 0.05);
        player.lastEnergyUpdate = Date.now();

        if (player.miner.durability <= 0) {
          const repairCost = Math.ceil(
            CONFIG.baseMiner.repairCost * (1 + player.upgrades.power * 0.2)
          );
          return api.sendMessage(
            "🔧 Máy đào của bạn đã hỏng!\n" +
            `💰 Chi phí sửa chữa: ${repairCost}$\n` +
            "Sử dụng: .coin repair để sửa máy",
            threadID,
            messageID
          );
        }
        setInterval(() => {
          try {
              updateNPCActivities();
              updateNPCMiners();
              updateCirculationNPC(miningData, marketData);
              saveData(miningData, marketData);
          } catch (error) {
              console.error("[NPC UPDATE ERROR]", error);
          }
      }, 5 * 60 * 1000);
      setInterval(() => {
        try {
            const totalSupply = CONFIG.coinLimit.currentSupply;
            const totalHeld = Object.values(miningData).reduce((sum, p) => sum + p.coins, 0);
            const circulationRatio = (totalSupply - totalHeld) / totalSupply;
    
            if (circulationRatio < 0.1) { 
                CONFIG.npcPlayers.groups.forEach(group => {
                    if (group.type === "Investor") {
                        group.behavior.buyThreshold *= 0.8; 
                        group.behavior.sellThreshold *= 1.2; 
                    }
                });
            }
        } catch (error) {
            console.error("[MARKET CHECK ERROR]", error);
        }
    }, 15 * 60 * 1000); 
        const miningSuccess = Math.random() < calculateMiningSuccess(player);
        if (miningSuccess) {
          let eventBonus = 1;
          let eventName = null;

          const blockReward = attemptBlockMining(
            player,
            calculateMiningSuccess(player),
            miningData
          );

          if (blockReward > 0) {
          }

          if (
            CONFIG.miningEvents.activeEvent &&
            Date.now() < CONFIG.miningEvents.activeEvent.endTime
          ) {
            eventBonus = CONFIG.miningEvents.activeEvent.bonus || 1;
            eventName = CONFIG.miningEvents.activeEvent.name;
          }

          let poolBonus = 0;
          if (player.settings?.inPool) {
            poolBonus = joinPool(player, player.settings.poolId);
          }

          const isCritical =
            Math.random() < CONFIG.miningSuccess.criticalChance;
          let reward = calculateMiningReward(player, isCritical);

          const rareResource = checkRareResources(player);
          const expGained = Math.floor(reward * 0.1);
          const leveledUp = updateMinerLevel(player, expGained);

          const minerLevelBonus = player.minerLevel?.bonuses?.rewardBonus || 0;
          const totalBonus = eventBonus * (1 + poolBonus + minerLevelBonus);
          reward = Math.floor(reward * totalBonus);

          let eventmessage = [];
          if (eventName) {
            eventmessage.push(
              `🌟 Sự kiện ${eventName} đang diễn ra! x${eventBonus} phần thưởng!`
            );
          }
          if (poolBonus > 0) {
            eventmessage.push(
              `👥 Mining Pool Bonus: +${poolBonus * 100}% phần thưởng`
            );
          }
          if (rareResource) {
            eventmessage.push(`💎 Đào được ${rareResource.name} quý hiếm!`);
          }
          if (leveledUp) {
            eventmessage.push(`🏆 Thợ mỏ lên cấp ${player.minerLevel.level}!`);
          }

          player.coins += reward;
          player.stats.totalMined += reward;
          player.stats.successfulMines++;
          CONFIG.coinLimit.currentSupply += reward;

          if (!player.minedCoins) player.minedCoins = [];
          player.minedCoins.push({
            amount: reward,
            timestamp: Date.now(),
          });

          const eventMessages = isCritical
            ? CONFIG.baseMiner.miningEvents.critical
            : CONFIG.baseMiner.miningEvents.normal;
          const eventMessage =
            eventMessages[Math.floor(Math.random() * eventMessages.length)];

          let message = [
            `${eventMessage}\n`,
            isCritical ? "✨ CRITICAL HIT! x2 REWARDS ✨" : "",
            `💎 Đào được: ${reward} LCoin`,
            `💰 Giá trị: ${Math.floor(reward * marketData.price)}$`,
            `💎 Tổng coin: ${player.coins}`,
            `🔋 Độ bền máy: ${Math.round(player.miner.durability)}%`,
            `⚡ Năng lượng: ${Math.floor(player.energy)}/${CONFIG.energySystem.maxEnergy} (còn ${Math.floor(player.energy / CONFIG.energySystem.miningCost)} lần đào)`,
            `⚡ Hiệu suất: ${Math.round(
              calculateMiningSuccess(player) * 100
            )}%`,
          ]
            .filter(Boolean)
            .join("\n");

          player.miningStreak = (player.miningStreak || 0) + 1;
          if (player.miningStreak >= 5) {
            const streakBonus = Math.floor(reward * 0.1);
            player.coins += streakBonus;
            message +=
              `\n\n🔥 MINING STREAK x${player.miningStreak}!\n` +
              `✨ Bonus: +${streakBonus} LCoin`;
          }

          if (player.settings && player.settings.autoSell && reward > 0) {
            const sellValue = calculateSellValue(
              player,
              reward,
              marketData.price
            );
            player.coins -= reward;
            await updateBalance(senderID, sellValue);

            if (player.quests.daily.type === "market") {
              player.quests.daily.progress++;
            }

            message +=
              "\n\n" +
              [
                "🔄 TỰ ĐỘNG BÁN COIN 🔄",
                `📤 Đã bán: ${reward} LCoin`,
                `💵 Nhận được: ${sellValue}$`,
                `💎 LCoin còn lại: ${player.coins}`,
              ].join("\n");
          }

          api.sendMessage(message, threadID, messageID);
        } else {
          player.stats.failedMines++;
          player.miningStreak = 0;

          const failMessage =
            CONFIG.baseMiner.miningEvents.fail[
            Math.floor(
              Math.random() * CONFIG.baseMiner.miningEvents.fail.length
            )
            ];

          api.sendMessage(
            `❌ ${failMessage}\n\n` +
            "📝 Nguyên nhân có thể do:\n" +
            "- Máy đào quá nóng\n" +
            "- Hiệu suất thấp\n" +
            "- Thiếu may mắn\n\n" +
            `⚡ Năng lượng: ${Math.floor(player.energy)}/${CONFIG.energySystem.maxEnergy} (còn ${Math.floor(player.energy / CONFIG.energySystem.miningCost)} lần đào)\n` +
            "💡 Mẹo: Nâng cấp cooling để tăng tỷ lệ thành công!",
            threadID,
            messageID
          );
        }

        const durabilityLoss =
          CONFIG.baseMiner.consumption * (1 - player.upgrades.cooling * 0.05);
        player.miner.durability = Math.max(
          0,
          player.miner.durability - durabilityLoss
        );
        player.lastMining = Date.now();
        break;

      case "repair":
        if (player.miner.durability >= CONFIG.baseMiner.maxDurability) {
          return api.sendMessage(
            "✅ Máy đào của bạn vẫn còn tốt!",
            threadID,
            messageID
          );
        }

        const repairCost = Math.ceil(
          CONFIG.baseMiner.repairCost * (1 + player.upgrades.power * 0.2)
        );
        const balance = await getBalance(senderID);

        if (balance < repairCost) {
          return api.sendMessage(
            `❌ Bạn cần ${repairCost} $ để sửa máy!`,
            threadID,
            messageID
          );
        }

        await updateBalance(senderID, -repairCost);
        player.miner.durability = CONFIG.baseMiner.maxDurability;

        api.sendMessage(
          "🔧 Sửa chữa máy thành công!\n" +
          `💰 Chi phí: ${repairCost} $\n` +
          "✅ Đã phục hồi độ bền về 100%",
          threadID,
          messageID
        );
        break;
        function ensureSpecialUpgrades(player) {
          if (!player.specialUpgrades) {
            player.specialUpgrades = {};
          }
          return player;
        }
      case "info":
        ensureSpecialUpgrades(player);
        const efficiency = Math.round(
          (1 + player.upgrades.efficiency * 0.15) * 100
        );
        const power = Math.round((1 + player.upgrades.power * 0.2) * 100);
        const cooling = Math.round((1 + player.upgrades.cooling * 0.1) * 100);
        const successRate = Math.round(calculateMiningSuccess(player) * 100);
        const minerLevelInfo = player.minerLevel
          ? `🏆 Cấp độ thợ mỏ: ${player.minerLevel.level}\n` +
          `⭐ Kinh nghiệm: ${player.minerLevel.experience}/${player.minerLevel.requiredExp}\n` +
          `⏱️ Giảm thời gian chờ: ${player.minerLevel.bonuses.cooldownReduction}%\n` +
          `🎯 Tăng tỷ lệ critical: ${player.minerLevel.bonuses.criticalChance * 100
          }%\n` +
          `💰 Tăng phần thưởng: ${player.minerLevel.bonuses.rewardBonus * 100
          }%\n\n`
          : "";

        const resourcesInfo = player.resources
          ? "💎 TÀI NGUYÊN QUÝ HIẾM:\n" +
          Object.entries(player.resources)
            .map(([id, count]) => {
              const resource = CONFIG.rareResources.types.find(
                (r) => r.id === id
              );
              return `${resource.name}: ${count} (Giá trị: ${resource.value * count
                })`;
            })
            .join("\n") +
          "\n\n"
          : "";

        const nextPowerCost =
          CONFIG.upgradeCosts.power[player.upgrades.power] || "Đã tối đa";
        const nextEfficiencyCost =
          CONFIG.upgradeCosts.efficiency[player.upgrades.efficiency] ||
          "Đã tối đa";
        const nextCoolingCost =
          CONFIG.upgradeCosts.cooling[player.upgrades.cooling] || "Đã tối đa";

        const totalInvestment = Object.entries(player.upgrades).reduce(
          (total, [type, level]) => {
            return (
              total +
              Array(level)
                .fill()
                .reduce((sum, _, i) => sum + CONFIG.upgradeCosts[type][i], 0)
            );
          },
          0
        );
        const gpuInfo = player.specialUpgrades.gpu ?
          `🎮 GPU: ${player.specialUpgrades.gpu.modelName} (x${player.specialUpgrades.gpu.bonus} hiệu suất)\n` : "";

        const coolingInfo = player.specialUpgrades.coolingsystem ?
          `🧊 Hệ thống làm mát: ${player.specialUpgrades.coolingsystem.modelName}\n` : "";

        const estimatedValue = Math.round(player.coins * marketData.price);
        const playerHashrate = calculatePlayerHashrate(player);
        api.sendMessage(
          "🌟 THÔNG TIN MÁY ĐÀO LCOIN 🌟\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "⚙️ THÔNG SỐ MÁY ĐÀO:\n" +
          `⚡ Công suất: ${power}% (Cấp ${player.upgrades.power}/10)\n` +
          `📊 Hiệu suất: ${efficiency}% (Cấp ${player.upgrades.efficiency}/10)\n` +
          `❄️ Làm mát: ${cooling}% (Cấp ${player.upgrades.cooling}/10)\n` +
          (gpuInfo ? gpuInfo : "") +
          (coolingInfo ? coolingInfo : "") +
          `🎯 Tỷ lệ thành công: ${successRate}%\n` +
          `⛏️ Hashrate: ${formatNumber(playerHashrate)} H/s\n` +
          `🔋 Năng lượng: ${player.energy}/${CONFIG.energySystem.maxEnergy}\n` +
          `🔋 Độ bền: ${Math.round(player.miner.durability)}%\n\n` +
          (minerLevelInfo ? "🏆 THÔNG TIN CẤP ĐỘ:\n" + minerLevelInfo : "") +
          "💰 THÔNG TIN TÀI CHÍNH:\n" +
          `💎 Số LCoin: ${player.coins} (≈ ${estimatedValue}$)\n` +
          `💵 Tổng đầu tư: ${totalInvestment}$\n\n` +
          "📈 THỐNG KÊ ĐÀO COIN:\n" +
          `💎 Tổng đã đào: ${player.stats.totalMined}\n` +
          `✅ Thành công: ${player.stats.successfulMines}\n` +
          `❌ Thất bại: ${player.stats.failedMines}\n` +
          `⚜️ Tỷ lệ: ${Math.round(
            (player.stats.successfulMines /
              (player.stats.successfulMines + player.stats.failedMines ||
                1)) *
            100
          )}%\n\n` +
          (resourcesInfo || "") +
          "🔄 NÂNG CẤP TIẾP THEO:\n" +
          `⚡ Power: ${nextPowerCost}$\n` +
          `📊 Efficiency: ${nextEfficiencyCost}$\n` +
          `❄️ Cooling: ${nextCoolingCost}$\n\n` +
          "⚙️ CÀI ĐẶT:\n" +
          `🔄 Tự động bán: ${player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"
          }\n` +
          `💎 Giá LCoin hiện tại: ${marketData.price}$\n\n` +
          "💡 Mẹo: Nâng cấp đồng bộ các chỉ số sẽ mang lại hiệu quả tốt nhất!",
          threadID,
          messageID
        );
        break;

      case "upgrade": {
        let msg = "🔧 NÂNG CẤP THIẾT BỊ 🔧\n━━━━━━━━━━━━━━━━━━\n\n";

        if (!target[1]) {
          // Hiển thị thông tin nâng cấp cơ bản
          msg += "⚙️ NÂNG CẤP CƠ BẢN:\n";
          ["power", "efficiency", "cooling"].forEach((type, i) => {
            const level = player.upgrades[type] || 0;
            const nextCost = CONFIG.upgradeCosts[type][level];
            const emoji = ["⚡", "📊", "❄️"][i];
            msg += `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)}: Cấp ${level}/10\n`;
            msg += nextCost ? `💰 Nâng cấp: ${nextCost.toLocaleString()}$\n` : "✨ Đã tối đa\n";
            msg += "\n";
          });

          // Hiển thị thiết bị đặc biệt 
          msg += "\n📌 THIẾT BỊ ĐẶC BIỆT:\n";
          ["gpu", "cooler", "ram"].forEach((type, i) => {
            const current = player.specialUpgrades?.[type];
            const emoji = ["🎮", "🌡️", "💾"][i];
            msg += `${emoji} ${type.toUpperCase()}: ${current?.modelName || "Chưa có"}\n`;
            if (current?.bonus) msg += `⚡ Hiệu suất: x${current.bonus}\n`;
            msg += "\n";
          });

          msg += "\n💡 HƯỚNG DẪN:\n";
          msg += "• .coin upgrade [1-3] - Nâng cấp cơ bản\n";
          msg += "• .coin upgrade [4-6] [số model] - Mua thiết bị\n";
          msg += "• .coin upgrade list - Xem danh sách\n";

          return api.sendMessage(msg, threadID, messageID);
        }

        // Xem danh sách thiết bị
        if (target[1] === "list") {
          const type = parseInt(target[2]);

          if (!type) {
            msg = "📋 DANH SÁCH THIẾT BỊ 📋\n━━━━━━━━━━━━━━━━━━\n\n";
            msg += "1️⃣ Power (⚡ Tăng sức mạnh đào)\n";
            msg += "2️⃣ Efficiency (📊 Tăng hiệu suất)\n";
            msg += "3️⃣ Cooling (❄️ Giảm tiêu hao)\n";
            msg += "4️⃣ GPU (🎮 Tăng mạnh sức mạnh)\n";
            msg += "5️⃣ Cooling System (🌡️ Tăng hiệu quả làm mát)\n";
            msg += "6️⃣ RAM (💾 Tăng xử lý)\n\n";
            msg += "👉 .coin upgrade list [1-6] để xem chi tiết";
            return api.sendMessage(msg, threadID, messageID);
          }

          // Hiển thị chi tiết từng loại
          if (type >= 4) {
            const component = CONFIG.upgradeSystem.componentTypes[type - 1];
            if (!component) return api.sendMessage("❌ Loại thiết bị không hợp lệ!", threadID, messageID);

            msg = `📋 DANH SÁCH ${component.label.toUpperCase()} 📋\n━━━━━━━━━━━━━━━━━━\n\n`;

            component.models.forEach((model, i) => {
              const owned = player.specialUpgrades?.[component.name]?.modelName === model.name;
              msg += `${i + 1}. ${owned ? "✅ " : ""}${model.name}\n`;
              msg += `⚡ Hiệu suất: x${model.bonus}\n`;
              msg += `💰 Giá: ${model.price.toLocaleString()}$\n\n`;
            });

            msg += `💡 Mua: .coin upgrade ${type} [số thứ tự]`;
            return api.sendMessage(msg, threadID, messageID);
          }
        }

        // Xử lý mua/nâng cấp
        const componentId = parseInt(target[1]);
        const modelIndex = parseInt(target[2]);

        if (isNaN(componentId) || componentId < 1 || componentId > 6) {
          return api.sendMessage("❌ Loại nâng cấp không hợp lệ!", threadID, messageID);
        }

        const balance = await getBalance(senderID);

        // Nâng cấp cơ bản
        if (componentId <= 3) {
          const types = ["power", "efficiency", "cooling"];
          const type = types[componentId - 1];
          const level = player.upgrades[type] || 0;

          if (level >= 10) {
            return api.sendMessage(`❌ ${type} đã đạt cấp tối đa!`, threadID, messageID);
          }

          const cost = CONFIG.upgradeCosts[type][level];
          if (balance < cost) {
            return api.sendMessage(`❌ Không đủ tiền! Cần ${cost.toLocaleString()}$`, threadID, messageID);
          }

          await updateBalance(senderID, -cost);
          player.upgrades[type]++;

          return api.sendMessage(
            `✅ Nâng cấp thành công!\n\n` +
            `⚙️ ${type}: Cấp ${level} → ${level + 1}\n` +
            `💰 Chi phí: ${cost.toLocaleString()}$`,
            threadID, messageID
          );
        }

        // Mua thiết bị đặc biệt
        const component = CONFIG.upgradeSystem.componentTypes[componentId - 1];
        if (!component?.models || !component.models[modelIndex - 1]) {
          return api.sendMessage("❌ Thiết bị không hợp lệ!", threadID, messageID);
        }

        const model = component.models[modelIndex - 1];
        if (balance < model.price) {
          return api.sendMessage(
            `❌ Không đủ tiền để mua ${model.name}!\n` +
            `💰 Giá: ${model.price.toLocaleString()}$\n` +
            `💵 Còn thiếu: ${(model.price - balance).toLocaleString()}$`,
            threadID, messageID
          );
        }

        await updateBalance(senderID, -model.price);

        if (!player.specialUpgrades) player.specialUpgrades = {};
        const oldModel = player.specialUpgrades[component.name]?.modelName || "Chưa có";

        player.specialUpgrades[component.name] = {
          modelName: model.name,
          bonus: model.bonus
        };

        return api.sendMessage(
          `✅ MUA THIẾT BỊ THÀNH CÔNG!\n\n` +
          `${component.emoji} ${component.label}: ${oldModel} → ${model.name}\n` +
          `⚡ Hiệu suất: x${model.bonus}\n` +
          `💰 Chi phí: ${model.price.toLocaleString()}$`,
          threadID, messageID
        );

        break;
      }
      case "halving":
      case "halvings":
        if (HALVING_EVENTS.length === 0) {
          return api.sendMessage(
            "📊 LỊCH SỬ HALVING 📊\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "Chưa có sự kiện halving nào xảy ra.\n" +
            `⛓️ Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
            `💰 Phần thưởng hiện tại: ${CONFIG.blockReward.current} LCoin\n` +
            `⏳ Block đến halving tiếp theo: ${210000 - (CONFIG.blockReward.blockHeight % 210000)
            }`,
            threadID,
            messageID
          );
        }

        let halvingMessage =
          "📊 LỊCH SỬ HALVING 📊\n" + "━━━━━━━━━━━━━━━━━━\n\n";

        HALVING_EVENTS.forEach((event, index) => {
          const date = new Date(event.timestamp).toLocaleDateString("vi-VN");
          halvingMessage +=
            `🌟 HALVING #${index + 1} - ${date}\n` +
            `🧊 Block: #${event.blockHeight}\n` +
            `💰 Phần thưởng: ${event.previousReward} → ${event.newReward} LCoin\n` +
            `📉 Giảm: -${(
              (1 - event.newReward / event.previousReward) *
              100
            ).toFixed(0)}%\n\n`;
        });

        halvingMessage +=
          `⛓️ Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
          `💰 Phần thưởng hiện tại: ${CONFIG.blockReward.current} LCoin\n` +
          `⏳ Block đến halving tiếp theo: ${210000 - (CONFIG.blockReward.blockHeight % 210000)
          }`;

        api.sendMessage(halvingMessage, threadID, messageID);
        break;
      case "pool":
        const poolAction = target[1]?.toLowerCase();

        if (
          !poolAction ||
          !["join", "leave", "info", "create"].includes(poolAction)
        ) {
          return api.sendMessage(
            "👥 MINING POOL 👥\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "💡 Đào theo nhóm - Tăng cơ hội đào block!\n\n" +
            "📌 Các lệnh có sẵn:\n" +
            "• .coin pool join - Tham gia pool\n" +
            "• .coin pool leave - Rời khỏi pool\n" +
            "• .coin pool info - Xem thông tin pool\n\n" +
            "ℹ️ Khi tham gia pool:\n" +
            `• Phí tham gia: ${(CONFIG.miningPools.poolFee * 100).toFixed(
              0
            )}%\n` +
            `• Thưởng thêm: +${(CONFIG.miningPools.bonusReward * 100).toFixed(
              0
            )}%\n` +
            "• Phần thưởng chia theo hashrate đóng góp",
            threadID,
            messageID
          );
        }

        if (poolAction === "join") {
          if (player.settings?.inPool) {
            return api.sendMessage(
              "❌ Bạn đã ở trong pool rồi!",
              threadID,
              messageID
            );
          }

          player.settings = player.settings || {};
          player.settings.inPool = true;
          player.settings.poolFee = CONFIG.miningPools.poolFee;
          player.settings.joinedPool = Date.now();

          api.sendMessage(
            "✅ THAM GIA MINING POOL THÀNH CÔNG!\n\n" +
            `👥 Thành viên: ${Object.values(miningData).filter((p) => p.settings?.inPool)
              .length
            }/${CONFIG.miningPools.maxPoolSize}\n` +
            `💰 Phí pool: ${(CONFIG.miningPools.poolFee * 100).toFixed(
              0
            )}%\n` +
            `🎁 Bonus phần thưởng: +${(
              CONFIG.miningPools.bonusReward * 100
            ).toFixed(0)}%\n\n` +
            "💡 Phần thưởng block sẽ được chia theo % hashrate đóng góp",
            threadID,
            messageID
          );
        } else if (poolAction === "leave") {
          if (!player.settings?.inPool) {
            return api.sendMessage(
              "❌ Bạn không trong pool nào cả!",
              threadID,
              messageID
            );
          }

          player.settings.inPool = false;
          api.sendMessage(
            "✅ Bạn đã rời khỏi mining pool!",
            threadID,
            messageID
          );
        } else if (poolAction === "info") {
          const poolMembers = Object.values(miningData).filter(
            (p) => p.settings?.inPool
          );
          const totalPoolHashrate = poolMembers.reduce(
            (sum, p) => sum + calculatePlayerHashrate(p),
            0
          );
          const playerInPool = player.settings?.inPool;
          const playerSharePercent = playerInPool
            ? (
              (calculatePlayerHashrate(player) / totalPoolHashrate) *
              100
            ).toFixed(2)
            : 0;

          return api.sendMessage(
            "👥 THÔNG TIN MINING POOL 👥\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🧑‍🤝‍🧑 Thành viên: ${poolMembers.length}/${CONFIG.miningPools.maxPoolSize}\n` +
            `⛏️ Tổng hashrate: ${formatNumber(totalPoolHashrate)}\n` +
            `💰 Phí pool: ${(CONFIG.miningPools.poolFee * 100).toFixed(
              0
            )}%\n` +
            `🎁 Bonus: +${(CONFIG.miningPools.bonusReward * 100).toFixed(
              0
            )}%\n\n` +
            (playerInPool
              ? `✅ Bạn đang trong pool\n` +
              `🔢 Hashrate: ${formatNumber(
                calculatePlayerHashrate(player)
              )}\n` +
              `📊 Phần trăm đóng góp: ${playerSharePercent}%\n`
              : "❌ Bạn không trong pool\n" +
              "💡 Dùng .coin pool join để tham gia"),
            threadID,
            messageID
          );
        }
        break;

      case "check":
      case "market":
        const priceChange =
          marketData.history.length > 0
            ? (
              ((marketData.price - marketData.history[0].price) /
                marketData.history[0].price) *
              100
            ).toFixed(2)
            : "0.00";
        const marketPeriod =
          target[1] &&
            ["45p", "1h", "4h", "6h", "12h", "24h"].includes(target[1])
            ? target[1]
            : "45p";

        const trend = priceChange > 0 ? "↗️" : priceChange < 0 ? "↘️" : "➡️";
        const sentiment =
          priceChange > 5
            ? "Rất tích cực 🚀"
            : priceChange > 2
              ? "Tích cực 📈"
              : priceChange < -5
                ? "Rất tiêu cực 📉"
                : priceChange < -2
                  ? "Tiêu cực 🔻"
                  : "Ổn định 📊";

        let highPrice = marketData.price;
        let lowPrice = marketData.price;
        if (marketData.history.length > 0) {
          const last24h = marketData.history.slice(-24);
          highPrice = Math.max(
            ...last24h.map((h) => h.price),
            marketData.price
          );
          lowPrice = Math.min(...last24h.map((h) => h.price), marketData.price);
        }

        const supplyRatio = (
          (CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply) *
          100
        ).toFixed(2);
        const availableSupply =
          CONFIG.coinLimit.maxSupply - CONFIG.coinLimit.currentSupply;
        const difficulty = calculateMiningDifficulty();
        const rewardMultiplier = calculateRewardMultiplier();

        const blockMinedPerDay =
          86400 / (CONFIG.blockReward.targetBlockTime / 1000);
        const blocksLeft = CONFIG.blockReward.blockHeight % 210000;
        const blocksUntilHalving = 210000 - blocksLeft;
        const estimatedDaysToHalving = Math.ceil(
          blocksUntilHalving / blockMinedPerDay
        );

        const tradingTip =
          priceChange > 3
            ? "Nên xem xét bán để lấy lợi nhuận 💰"
            : priceChange < -3
              ? "Có thể là thời điểm tốt để mua vào 🔍"
              : "Thị trường ổn định, theo dõi thêm 👀";
        const timeSinceLastBlock =
          (Date.now() - CONFIG.blockReward.lastBlockTime) / 1000;
        const marketMessage =
          "📊 THỊ TRƯỜNG LCOIN 📊\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `💎 Giá: ${marketData.price}$ ${trend} (${priceChange}%)\n` +
          `📈 Xu hướng: ${sentiment}\n` +
          `⬆️ H: ${highPrice}$ | ⬇️ L: ${lowPrice}$\n\n` +

          "⛓️ BLOCKCHAIN:\n" +
          `• Block: #${CONFIG.blockReward.blockHeight}\n` +
          `• Phần thưởng: ${CONFIG.blockReward.current} LC\n` +
          `• Đến halving: ${blocksUntilHalving.toLocaleString()}\n` +
          `• Hashrate: ${formatNumber(calculateTotalNetworkPower(miningData))}\n\n` +

          "📈 TỔNG QUAN:\n" +
          `• Đã đào: ${(CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply * 100).toFixed(1)}%\n` +
          `• Giao dịch: ${formatNumber(CONFIG.market.tradingVolume.totalVolume)}\n` +
          `• Độ khó: x${difficulty.toFixed(1)}\n` +
          `• Phần thưởng: x${rewardMultiplier.toFixed(2)}\n\n` +

          `💡 Nhận định: ${tradingTip}\n` +
          `📌 Cập nhật sau: ${Math.ceil((CONFIG.market.updateInterval - (Date.now() - marketData.lastUpdate)) / 1000)}s`;

        if (marketData.history.length < 2) {
          return api.sendMessage(
            marketMessage + "\n\n⚠️ Chưa đủ dữ liệu lịch sử để tạo biểu đồ!",
            threadID,
            messageID
          );
        }

        const marketChartResult = await generatePriceChart(
          marketData,
          marketPeriod
        );

        if (!marketChartResult.success) {
          return api.sendMessage(marketMessage, threadID, messageID);
        }

        api.sendMessage(
          {
            body: marketMessage,
            attachment: fs.createReadStream(marketChartResult.chartPath),
          },
          threadID,
          messageID
        );

        setTimeout(() => {
          try {
            if (fs.existsSync(marketChartResult.chartPath)) {
              fs.unlinkSync(marketChartResult.chartPath);
            }
          } catch (err) {
            console.error("Error deleting chart file:", err);
          }
        }, 10000);
        break;

      case "chart":
        const period = target[1] || "45p";
        if (!["45p", "1h", "4h", "6h", "12h", "24h"].includes(period)) {
          return api.sendMessage(
            "❌ Khoảng thời gian không hợp lệ!\n" +
            "Sử dụng: .coin chart [45p/1h/4h/6h/12h/24h]",
            threadID,
            messageID
          );
        }

        if (marketData.history.length < 2) {
          return api.sendMessage(
            "⚠️ Chưa đủ dữ liệu lịch sử để tạo biểu đồ!\n" +
            "Vui lòng chờ một thời gian để hệ thống thu thập dữ liệu.",
            threadID,
            messageID
          );
        }

        const chartResult = await generatePriceChart(marketData, period);
        if (!chartResult.success) {
          return api.sendMessage(
            `❌ ${chartResult.message}`,
            threadID,
            messageID
          );
        }

        const changeEmoji = chartResult.priceChange >= 0 ? "📈" : "📉";
        const chartMessage =
          "📊 BIỂU ĐỒ GIÁ COIN 📊\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `${changeEmoji} Giá hiện tại: ${marketData.price} $\n` +
          `↕️ Biến động: ${chartResult.priceChange >= 0 ? "+" : ""}${chartResult.priceChange
          } $ (${chartResult.changePercent}%)\n` +
          `🔺 Cao nhất: ${chartResult.highPrice} $\n` +
          `🔻 Thấp nhất: ${chartResult.lowPrice} $\n\n` +
          `⏰ Cập nhật: ${new Date().toLocaleString("vi-VN")}`;

        api.sendMessage(
          {
            body: chartMessage,
            attachment: fs.createReadStream(chartResult.chartPath),
          },
          threadID,
          messageID
        );

        setTimeout(() => {
          try {
            if (fs.existsSync(chartResult.chartPath)) {
              fs.unlinkSync(chartResult.chartPath);
            }
          } catch (err) {
            console.error("Error deleting chart file:", err);
          }
        }, 10000);
        break;

      case "market history":
        if (marketData.history.length === 0) {
          return api.sendMessage(
            "❌ Chưa có dữ liệu lịch sử giá!",
            threadID,
            messageID
          );
        }

        let historyMsg = "📜 LỊCH SỬ GIÁ COIN 📜\n━━━━━━━━━━━━━━━━━━\n\n";
        const historyEntries = [
          ...marketData.history.slice(-10),
          { price: marketData.price, timestamp: Date.now() },
        ];

        historyEntries.forEach((entry, index) => {
          const time = new Date(entry.timestamp).toLocaleTimeString();
          const prevPrice =
            index > 0 ? historyEntries[index - 1].price : entry.price;
          const changeIcon =
            entry.price > prevPrice
              ? "📈"
              : entry.price < prevPrice
                ? "📉"
                : "📊";

          historyMsg += `${changeIcon} ${time}: ${entry.price} $\n`;
        });

        historyMsg +=
          "\n💡 Sử dụng thông tin trên để đưa ra quyết định giao dịch khôn ngoan!";
        api.sendMessage(historyMsg, threadID, messageID);
        break;
      case "hash":
      case "hashmine":
        if (!target[1] || target[1] === "menu") {
          const playerHardware = player.hashMiningHardware || 0;
          const hardware = CONFIG.advancedMining.hardware[playerHardware];
          const diffTarget = CONFIG.advancedMining.difficulty.current;
          const networkHashrate = CONFIG.advancedMining.network.hashrate;
          const playerHashrate = hardware ? hardware.hashrate : 50;
          const networkShare = (playerHashrate / networkHashrate) * 100;

          return api.sendMessage(
            "⛏️ BITCOIN HASH MINING ⛏️\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "📌 CÁC LỆNH HIỆN CÓ:\n" +
            "• .coin hash mine - Đào bằng SHA-256\n" +
            "• .coin hash info - Xem thông tin hash mining\n" +
            "• .coin hash upgrade [1-10] - Nâng cấp phần cứng\n" +
            "• .coin hash pool [1-4] - Tham gia mining pool\n" +
            "• .coin hash list - Xem danh sách phần cứng\n\n" +

            "📊 THIẾT BỊ HIỆN TẠI:\n" +
            `• ${hardware ? hardware.name : "CPU Mining"}\n` +
            `• Hashrate: ${(hardware ? hardware.hashrate : 50).toLocaleString()} H/s\n` +
            `• Hiệu suất: ${(hardware ? hardware.efficiency : 0.5).toFixed(1)} H/J\n\n` +

            "💰 THỐNG KÊ ĐÀO HASH:\n" +
            `• Network hashrate: ${formatNumber(networkHashrate)}\n` +
            `• Phần trăm của bạn: ${networkShare.toFixed(6)}%\n` +
            `• Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
            `• Phần thưởng: ${CONFIG.blockReward.current} LCoin\n\n` +

            "👉 Dùng .coin hash mine để bắt đầu đào!",
            threadID, messageID
          );
        }
        if (target[1] === "upgrade") {

          const hardwareIndex = parseInt(target[2]) - 1;

          if (isNaN(hardwareIndex) || hardwareIndex < 0 || hardwareIndex >= CONFIG.advancedMining.hardware.length) {
            return api.sendMessage(
              "❌ Lựa chọn không hợp lệ!\n\n" +
              "Sử dụng: .coin hash upgrade [1-5]",
              threadID, messageID
            );
          }

          if (player.hashMiningHardware === hardwareIndex) {
            return api.sendMessage(
              `❌ Bạn đã sở hữu ${CONFIG.advancedMining.hardware[hardwareIndex].name} rồi!`,
              threadID, messageID
            );
          }

          const hardware = CONFIG.advancedMining.hardware[hardwareIndex];
          const balance = await getBalance(senderID);

          if (hardwareIndex === 0) {
            player.hashMiningHardware = 0;

            return api.sendMessage(
              "✅ Đã chuyển về dùng CPU Mining cơ bản!\n\n" +
              "Đây là phương pháp kém hiệu quả nhất, nhưng miễn phí.\n" +
              "Bạn nên nâng cấp lên ASIC miner khi có đủ tiền.",
              threadID, messageID
            );
          }

          if (balance < hardware.price) {
            return api.sendMessage(
              `❌ Không đủ tiền để mua ${hardware.name}!\n\n` +
              `💰 Giá: ${hardware.price.toLocaleString()}$\n` +
              `💵 Số dư: ${balance.toLocaleString()}$\n` +
              `💸 Còn thiếu: ${(hardware.price - balance).toLocaleString()}$`,
              threadID, messageID
            );
          }

          await updateBalance(senderID, -hardware.price);
          player.hashMiningHardware = hardwareIndex;

          saveData(miningData, marketData);

          return api.sendMessage(
            `✅ MUA THÀNH CÔNG ${hardware.name}!\n\n` +
            `💰 Chi phí: ${hardware.price.toLocaleString()}$\n` +
            `⚡ Hashrate: ${hardware.hashrate.toLocaleString()} H/s\n` +
            `🔌 Tiêu thụ: ${hardware.power}W\n` +
            `⚙️ Hiệu suất: ${hardware.efficiency.toFixed(1)} H/J\n\n` +
            `Hashrate của bạn đã tăng ${hardware.hashrate / (CONFIG.advancedMining.hardware[player.hashMiningHardware || 0].hashrate || 50)}x lần!`,
            threadID, messageID
          );
        }
        if (target[1] === "hardware" || target[1] === "list") {
          const hardwareList = CONFIG.advancedMining.hardware;
          let message = "📋 DANH SÁCH THIẾT BỊ MINING 📋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n";

          message += "🖥️ CPU MINING:\n";
          hardwareList.slice(0, 1).forEach((hw, i) => {
            message += `${i + 1}. ${hw.name}\n` +
              `   ⚡ Hashrate: ${formatNumber(hw.hashrate)} H/s\n` +
              `   🔌 Điện: ${hw.power}W\n` +
              `   💰 Giá: Miễn phí\n` +
              `   📊 Hiệu suất: ${hw.efficiency} H/J\n\n`;
          });

          message += "🎮 GPU MINING:\n";
          hardwareList.slice(1, 4).forEach((hw, i) => {
            message += `${i + 2}. ${hw.name}\n` +
              `   ⚡ Hashrate: ${formatNumber(hw.hashrate)} H/s\n` +
              `   🔌 Điện: ${hw.power}W\n` +
              `   💰 Giá: ${formatNumber(hw.price)}$\n` +
              `   📊 Hiệu suất: ${hw.efficiency} H/J\n\n`;
          });

          message += "🏭 ASIC MINING:\n";
          hardwareList.slice(4, 7).forEach((hw, i) => {
            message += `${i + 5}. ${hw.name}\n` +
              `   ⚡ Hashrate: ${formatNumber(hw.hashrate)} H/s\n` +
              `   🔌 Điện: ${hw.power}W\n` +
              `   💰 Giá: ${formatNumber(hw.price)}$\n` +
              `   📊 Hiệu suất: ${hw.efficiency} H/J\n\n`;
          });

          message += "👑 LEGENDARY MINERS:\n";
          hardwareList.slice(7).forEach((hw, i) => {
            message += `${i + 8}. ${hw.name}\n` +
              `   ⚡ Hashrate: ${formatNumber(hw.hashrate)} H/s\n` +
              `   🔌 Điện: ${hw.power}W\n` +
              `   💰 Giá: ${formatNumber(hw.price)}$\n` +
              `   📊 Hiệu suất: ${hw.efficiency} H/J\n\n`;
          });

          message += "💡 Mua: .coin hash upgrade [số thứ tự]\n";
          message += "📝 Thông tin chi tiết: .coin hash info";

          return api.sendMessage(message, threadID, messageID);
        }
        if (target[1] === "info") {
          const playerHardware = player.hashMiningHardware || 0;
          const hardware = CONFIG.advancedMining.hardware[playerHardware];
          const poolIndex = player.hashMiningPool || 0;
          const pool = CONFIG.advancedMining.pools[poolIndex];
          const diffTarget = CONFIG.advancedMining.difficulty.current;
          const difficultyBonus = Math.floor(player.upgrades.cooling / 3);
          const effectiveDifficulty = Math.max(1, diffTarget - difficultyBonus);

          const networkHashrate = CONFIG.advancedMining.network.hashrate;
          const playerHashrate = hardware ? hardware.hashrate : 50;
          const networkShare = (playerHashrate / networkHashrate) * 100;
          const successRate = Math.pow(0.5, effectiveDifficulty) * 100;
          const hashesPerBlock = Math.ceil(1 / (successRate / 100));
          const electricityCostPerHour = hardware ? (hardware.power / 1000) * CONFIG.advancedMining.electricityCost : 0;

          const diffBar = "🟩".repeat(Math.min(8, diffTarget)) +
            "🟨".repeat(Math.max(0, Math.min(4, diffTarget - 8))) +
            "🟥".repeat(Math.max(0, diffTarget - 12));

          const expectedSeconds = hashesPerBlock / playerHashrate;
          const expectedTimeStr = expectedSeconds > 86400
            ? `${(expectedSeconds / 86400).toFixed(1)} ngày`
            : expectedSeconds > 3600
              ? `${(expectedSeconds / 3600).toFixed(1)} giờ`
              : expectedSeconds > 60
                ? `${(expectedSeconds / 60).toFixed(1)} phút`
                : `${expectedSeconds.toFixed(1)} giây`;

          const nextHardware = CONFIG.advancedMining.hardware[playerHardware + 1];
          const upgradeTip = nextHardware
            ? `💡 Nâng cấp lên ${nextHardware.name} sẽ tăng hashrate ${(nextHardware.hashrate / playerHashrate).toFixed(1)}x\n`
            : "💡 Bạn đã có thiết bị mining tốt nhất!";

          return api.sendMessage(
            "⛏️ THÔNG TIN CHI TIẾT HASH MINING ⛏️\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +

            "🔧 THIẾT BỊ MINING:\n" +
            `• Phần cứng: ${hardware ? hardware.name : "CPU Mining"}\n` +
            `• Hashrate: ${formatNumber(playerHashrate)} H/s\n` +
            `• Tiêu thụ điện: ${hardware ? hardware.power : 100}W (${electricityCostPerHour.toLocaleString()}$/giờ)\n` +
            `• Hiệu suất: ${(hardware ? hardware.efficiency : 0.5).toFixed(2)} H/J\n` +
            `• Pool: ${pool.name} (phí: ${(pool.fee * 100).toFixed(1)}%)\n\n` +

            "📊 THÔNG SỐ MẠNG LƯỚI:\n" +
            `• Network hashrate: ${formatNumber(networkHashrate)} H/s\n` +
            `• Phần trăm của bạn: ${networkShare.toFixed(6)}%\n` +
            `• Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
            `• Phần thưởng: ${CONFIG.blockReward.current} LCoin\n\n` +

            "🎯 ĐỘ KHÓ & THỐNG KÊ:\n" +
            `• Difficulty: ${diffTarget} ${diffBar}\n` +
            `• Difficulty thực tế: ${effectiveDifficulty} (${difficultyBonus > 0 ? `-${difficultyBonus} từ cooling` : "không giảm"})\n` +
            `• Xác suất tìm block: ${successRate.toExponential(4)}%\n` +
            `• Hashes cần thiết (trung bình): ${formatNumber(hashesPerBlock)}\n` +
            `• Thời gian dự kiến: ${expectedTimeStr}\n\n` +

            "💻 SHA-256 MINING INFO:\n" +
            "• Target: " + "0".repeat(effectiveDifficulty) + "...\n" +
            "• Độ khó tăng 1 = Khó gấp đôi\n" +
            "• Độ khó của Bitcoin thực tế: 18-20+\n\n" +

            upgradeTip +
            "💡 Nâng cấp Cooling để giảm difficulty hiệu quả!",
            threadID, messageID
          );
        }
        if (target[1] === "pool") {

          const poolIndex = parseInt(target[2]) - 1;

          if (isNaN(poolIndex)) {
            return api.sendMessage(
              "🏊‍♂️ MINING POOLS 🏊‍♂️\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              CONFIG.advancedMining.pools.map((pool, i) =>
                `${i + 1}. ${pool.name}\n` +
                `   📊 Phí: ${(pool.fee * 100).toFixed(1)}%\n` +
                `   🍀 Luck: ${pool.luck.toFixed(2)}x\n` +
                `   💰 Phương thức: ${pool.paymentMethod}\n` +
                `   💵 Min. Payout: ${pool.minPayout} LCoin\n`
              ).join("\n") +
              "\nTham gia pool: .coin hash pool [1-4]",
              threadID, messageID
            );
          }

          if (poolIndex < 0 || poolIndex >= CONFIG.advancedMining.pools.length) {
            return api.sendMessage("❌ Mining pool không hợp lệ!", threadID, messageID);
          }

          player.hashMiningPool = poolIndex;
          const pool = CONFIG.advancedMining.pools[poolIndex];

          return api.sendMessage(
            `✅ Đã tham gia pool: ${pool.name}\n\n` +
            `📊 Thông tin pool:\n` +
            `• Phí: ${(pool.fee * 100).toFixed(1)}%\n` +
            `• Luck Factor: ${pool.luck.toFixed(2)}x\n` +
            `• Phương thức thanh toán: ${pool.paymentMethod}\n` +
            `• Min. Payout: ${pool.minPayout} LCoin\n\n` +
            `💡 ${poolIndex === 0 ?
              "Solo mining có thể mang lại phần thưởng lớn nhưng rủi ro cao hơn." :
              "Mining pool giúp ổn định thu nhập nhưng sẽ mất phí."}`,
            threadID, messageID
          );
        }
        if (target[1] === "mine") {

          if (player.energy < CONFIG.advancedMining.energyCost) {
            return api.sendMessage(
              "⚠️ KHÔNG ĐỦ NĂNG LƯỢNG!\n" +
              `Hash mining cần ${CONFIG.advancedMining.energyCost} năng lượng.\n` +
              `Hiện tại: ${player.energy.toFixed(1)}/${CONFIG.energySystem.maxEnergy}`,
              threadID, messageID
            );
          }

          if (player.upgrades.power < CONFIG.advancedMining.minPowerLevel) {
            return api.sendMessage(
              "⚠️ THIẾT BỊ KHÔNG ĐỦ MẠNH!\n" +
              `Hash mining yêu cầu Power cấp ${CONFIG.advancedMining.minPowerLevel}+\n` +
              `Cấp hiện tại: ${player.upgrades.power}`,
              threadID, messageID
            );
          }

          player.energy -= CONFIG.advancedMining.energyCost;
          player.lastEnergyUpdate = Date.now();

          const playerHardware = player.hashMiningHardware || 0;
          const hardware = CONFIG.advancedMining.hardware[playerHardware];
          const poolIndex = player.hashMiningPool || 0;
          const pool = CONFIG.advancedMining.pools[poolIndex];
          const difficultyBonus = Math.floor(player.upgrades.cooling / 3);
          const playerDifficulty = Math.max(1, CONFIG.advancedMining.difficulty.current - difficultyBonus);

          api.sendMessage(
            "⛏️ HASH MINING ĐANG TIẾN HÀNH ⛏️\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "🔍 Đang tìm nonce hợp lệ...\n" +
            "🧮 Thuật toán: SHA-256\n" +
            `⚡ Hashrate: ${hardware ? hardware.hashrate.toLocaleString() : 50} H/s\n` +
            "🎯 Target: " + "0".repeat(playerDifficulty) + "...\n\n" +
            "⏳ Vui lòng đợi kết quả trong giây lát...",
            threadID, messageID
          );

          const startTime = Date.now();
          const hashMiningResult = mineWithSHA256(player, playerDifficulty);
          const duration = Math.floor((Date.now() - startTime) / 1000);

          const electricityCost = calculateHashMiningCost(player,
            hashMiningResult.process ? hashMiningResult.process.duration : 3000);

          const miningVisualization = visualizeHashMining(hashMiningResult.process);

          setTimeout(() => {
            if (hashMiningResult.success) {

              const baseReward = calculateMiningReward(player, false);
              const poolFee = pool.fee * baseReward * CONFIG.advancedMining.rewardMultiplier;
              const poolLuck = pool.luck;
              const hashReward = baseReward * CONFIG.advancedMining.rewardMultiplier * poolLuck * (1 - pool.fee);

              CONFIG.blockReward.blockHeight++;
              CONFIG.blockHistory.blocks.push(hashMiningResult.blockData);

              player.coins += hashReward;
              player.stats.totalMined += hashReward;
              CONFIG.coinLimit.currentSupply += hashReward;

              api.sendMessage(
                "🎉 HASH MINING THÀNH CÔNG! 🎉\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                `⛓️ Block #${CONFIG.blockReward.blockHeight} đã được đào!\n` +
                `💎 Phần thưởng: ${hashReward.toLocaleString()} LCoin\n` +
                `🏊‍♂️ Pool: ${pool.name} (${pool.paymentMethod})\n` +
                `💸 Phí pool: ${poolFee.toLocaleString()} LCoin\n` +
                `⚡ Chi phí điện: ${electricityCost.toLocaleString()}$\n` +
                `🔍 Tìm thấy sau: ${hashMiningResult.process.attempts.toLocaleString()} attempts\n` +
                `⏱️ Thời gian: ${duration}s\n\n` +
                miningVisualization + "\n\n" +
                `💰 Tổng coin hiện có: ${player.coins.toLocaleString()}\n` +
                `⚡ Năng lượng còn lại: ${player.energy.toFixed(1)}/${CONFIG.energySystem.maxEnergy}`,
                threadID
              );
            } else {
              api.sendMessage(
                "❌ HASH MINING THẤT BẠI!\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "💻 Không tìm thấy hash hợp lệ trong giới hạn thời gian\n" +
                `⚡ Chi phí điện đã tiêu tốn: ${electricityCost.toLocaleString()}$\n` +
                `⏱️ Thời gian: ${duration}s\n\n` +
                miningVisualization + "\n\n" +
                "🔍 NGUYÊN NHÂN CÓ THỂ DO:\n" +
                "• Difficulty quá cao cho hardware hiện tại\n" +
                "• Cần nâng cấp lên ASIC miner tốt hơn\n" +
                "• Thiết bị làm mát chưa đủ mạnh\n" +
                `• ≈${(100 / (2 ** playerDifficulty) * 100).toFixed(8)}% cơ hội mỗi lần thử\n\n` +
                `⚡ Năng lượng còn lại: ${player.energy.toFixed(1)}/${CONFIG.energySystem.maxEnergy}`,
                threadID
              );
            }

            saveData(miningData, marketData);
          }, 15000);

          break;
        }
      case "top": {
        const type = target[1]?.toLowerCase() || "richest";
        let userData = JSON.parse(fs.readFileSync("./events/cache/userData.json", "utf8"));
        let topData = [];

        if (type === "miner" || type === "mine") {

          for (let userID in miningData) {
            const player = miningData[userID];
            if (player.stats && player.stats.totalMined > 0) {
              let name = userData[userID]?.name || "Người dùng Facebook";
              topData.push({
                userID,
                name: name,
                totalMined: player.stats.totalMined,
                successRate: (player.stats.successfulMines / (player.stats.successfulMines + player.stats.failedMines) * 100) || 0
              });
            }
          }

          topData.sort((a, b) => b.totalMined - a.totalMined);
          topData = topData.slice(0, 10);

          let msg = "⛏️ TOP 10 THỢ ĐÀO NHIỀU NHẤT ⛏️\n";
          msg += "━━━━━━━━━━━━━━━━━━\n\n";

          topData.forEach((miner, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            msg += `${medal} ${miner.name}\n`;
            msg += `💎 Đã đào: ${miner.totalMined.toLocaleString()} LC\n`;
            msg += `⚡ Tỷ lệ: ${miner.successRate.toFixed(1)}%\n` +
              `💵 Giá trị: ${(miner.totalMined * marketData.price).toLocaleString()}$\n\n`;
          });

          msg += "💡 Tip: Nâng cấp thiết bị để tăng hiệu quả đào!";

          return api.sendMessage(msg, threadID, messageID);
        } else {
          for (let userID in miningData) {
            const player = miningData[userID];
            if (player.coins > 0) {
              let name = userData[userID]?.name || "Người dùng Facebook";
              topData.push({
                userID,
                name: name,
                coins: player.coins,
                value: player.coins * marketData.price
              });
            }
          }

          topData.sort((a, b) => b.coins - a.coins);
          topData = topData.slice(0, 10);

          let msg = "📊 TOP 10 NGƯỜI GIÀU NHẤT 📊\n";
          msg += "━━━━━━━━━━━━━━━━━━\n\n";

          topData.forEach((data, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            msg += `${medal} ${data.name}\n`;
            msg += `💰 Coins: ${data.coins.toLocaleString()} LC\n`;
            msg += `💵 Giá trị: ${data.value.toLocaleString()}$\n\n`;
          });

          msg += "💡 Tip: Dùng .coin top miner để xem top thợ đào!\n";
          msg += "hoặc .coin top để xem top người giàu!";

          return api.sendMessage(msg, threadID, messageID);
        }
      }
      case "sell":
        if (!target[1]) {
          return api.sendMessage(
            "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
            "💡 Cách sử dụng:\n" +
            "• .coin sell [số lượng] - Bán số lượng cụ thể\n" +
            "• .coin sell all - Bán tất cả\n" +
            "• .coin sell half - Bán một nửa\n\n" +
            "💡 Coin sẽ trở lại lưu thông trên thị trường sau khi bán",
            threadID,
            messageID
          );
        }

        const currentTotalMined = CONFIG.coinLimit.currentSupply;
        const currentTotalHeld = Object.values(miningData).reduce(
          (total, p) => total + p.coins,
          0
        );
        const currentCirculating = Math.max(0, currentTotalMined - currentTotalHeld);

        let sellAmount;
        if (target[1].toLowerCase() === "all") {
          sellAmount = player.coins;
        } else if (target[1].toLowerCase() === "half") {
          sellAmount = Math.floor(player.coins / 2);
        } else {
          sellAmount = parseInt(target[1]);
          if (!sellAmount || sellAmount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập số lượng hợp lệ!",
              threadID,
              messageID
            );
          }
        }

        if (sellAmount > player.coins || player.coins < 0) {
          return api.sendMessage(
            "❌ Bạn không có đủ LCoin!\n\n" +
            `💎 Số LCoin hiện có: ${player.coins.toLocaleString()}\n` +
            `💰 Giá trị: ${Math.floor(player.coins * marketData.price).toLocaleString()}$`,
            threadID,
            messageID
          );
        }

        const sellValue = calculateSellValue(player, sellAmount, marketData.price);

        const sellRatio = sellAmount / (currentCirculating + 1);
        const sellTaxRate = Math.min(0.2, sellRatio * 0.4);
        const sellTax = Math.ceil(sellValue * sellTaxRate);
        const finalSellValue = sellValue - sellTax;

        player.coins = Math.max(0, player.coins - sellAmount);
        CONFIG.market.tradingVolume.sell += sellAmount;
        CONFIG.market.tradingVolume.totalVolume += sellAmount;
        await updateBalance(senderID, finalSellValue);

        let profitLossInfo = "";
        const avgBuyPrice = calculateAverageBuyPrice(player);

        if (avgBuyPrice) {
          const profitLoss = marketData.price - avgBuyPrice;
          const profitLossPercent = (profitLoss / avgBuyPrice) * 100;
          const isProfitable = profitLoss >= 0;

          if (!player.transactions) player.transactions = [];
          player.transactions.push({
            type: 'sell',
            amount: sellAmount,
            price: marketData.price,
            totalValue: finalSellValue,
            timestamp: Date.now(),
            profitLoss: profitLoss * sellAmount
          });

          profitLossInfo = `\n📊 THỐNG KÊ LÃI/LỖ:\n` +
            `• Giá mua TB: ${Math.round(avgBuyPrice)}$\n` +
            `• Giá bán: ${marketData.price}$\n` +
            `• ${isProfitable ? "Lãi" : "Lỗ"}: ${Math.abs(profitLoss.toFixed(1))}$/LC (${Math.abs(profitLossPercent).toFixed(1)}%)\n` +
            `• Tổng ${isProfitable ? "lãi" : "lỗ"}: ${Math.abs(Math.round(profitLoss * sellAmount)).toLocaleString()}$`;
        }
        api.sendMessage(
          "💰 BÁN LCOIN THÀNH CÔNG 💰\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `📤 Số lượng: ${sellAmount.toLocaleString()} LCoin\n` +
          `💵 Giá trị: ${sellValue.toLocaleString()}$\n` +
          (sellTax > 0 ? `🧾 Phí: ${sellTax.toLocaleString()}$ (${(sellTaxRate * 100).toFixed(1)}%)\n` : "") +
          `💰 Nhận: ${finalSellValue.toLocaleString()}$\n` +
          `💎 Còn lại: ${player.coins.toLocaleString()} LC\n` +
          (profitLossInfo ? profitLossInfo : "") +
          `\n\n📊 Giá hiện tại: ${marketData.price}$/LC`,
          threadID,
          messageID
        );
        break;
      case "auto":
        if (!target[1]) {
          return api.sendMessage(
            "🤖 AUTO MINING SYSTEM 🤖\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "📑 HƯỚNG DẪN SỬ DỤNG:\n" +
            "• .coin auto on [1/3/6/12] - Bật auto mine theo giờ\n" +
            "• .coin auto off - Tắt auto mine\n" +
            "• .coin auto info - Xem thông tin auto mine\n\n" +

            "💎 HIỆU SUẤT AUTO:\n" +
            `• Hiệu quả bằng ${CONFIG.autoMining.settings.efficiency * 100}% mine thủ công\n` +
            `• Tiêu thụ ${CONFIG.autoMining.settings.energyCost} năng lượng/lần\n` +
            `• Thực hiện mỗi ${CONFIG.autoMining.tickRate / 60000} phút\n\n` +

            "💰 BẢNG GIÁ THUÊ:\n" +
            CONFIG.autoMining.settings.prices.map(p =>
              `• ${p.duration / 3600000}h: ${p.cost.toLocaleString()}$`
            ).join("\n") + "\n\n" +

            "⚠️ LƯU Ý:\n" +
            `• Yêu cầu Power cấp ${CONFIG.autoMining.settings.minPowerLevel}+\n` +
            "• Vẫn tiêu tốn năng lượng và độ bền\n" +
            "• Hiệu quả thấp hơn đào thủ công\n" +
            "• Thích hợp cho người bận rộn",
            threadID, messageID
          );
        }

        const autoAction = target[1].toLowerCase();

        if (autoAction === "on") {
          // Kiểm tra điều kiện
          if (player.upgrades.power < CONFIG.autoMining.settings.minPowerLevel) {
            return api.sendMessage(
              `❌ Cần nâng Power lên cấp ${CONFIG.autoMining.settings.minPowerLevel}+ để dùng auto mine!`,
              threadID, messageID
            );
          }

          const duration = parseInt(target[2]);
          if (!duration || ![1, 3, 6, 12].includes(duration)) {
            return api.sendMessage(
              "❌ Vui lòng chọn thời gian hợp lệ: 1/3/6/12 giờ",
              threadID, messageID
            );
          }

          const price = CONFIG.autoMining.settings.prices.find(p =>
            p.duration === duration * 60 * 60 * 1000
          );

          const balance = await getBalance(senderID);
          if (balance < price.cost) {
            return api.sendMessage(
              `❌ Không đủ tiền! Cần ${price.cost.toLocaleString()}$ để thuê ${duration}h`,
              threadID, messageID
            );
          }

          await updateBalance(senderID, -price.cost);

          player.autoMining = {
            active: true,
            endTime: Date.now() + (duration * 60 * 60 * 1000),
            totalMined: 0,
            lastTick: Date.now()
          };

          return api.sendMessage(
            "✅ ĐÃ BẬT AUTO MINING!\n\n" +
            `⏰ Thời gian: ${duration} giờ\n` +
            `💰 Chi phí: ${price.cost.toLocaleString()}$\n` +
            `⚡ Năng lượng/lần: ${CONFIG.autoMining.settings.energyCost}\n` +
            `🔄 Chu kỳ: ${CONFIG.autoMining.tickRate / 60000} phút\n\n` +
            "💡 Auto sẽ tự động tắt sau khi hết thời gian!",
            threadID, messageID
          );
        }

      case "energy":
        const energyAction = target[1]?.toLowerCase();
        if (!player.powerSystem) {
          player.powerSystem = {
            generatorLevel: 0,
            lastFuelUse: 0,
            fuelHistory: []
          };
        }
        if (!energyAction || !["info", "upgrade", "fuel"].includes(energyAction)) {
          return api.sendMessage(
            "⚡ HỆ THỐNG NĂNG LƯỢNG ⚡\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🔋 Năng lượng hiện tại: ${player.energy}/${CONFIG.energySystem.maxEnergy}\n` +
            "📊 Thông tin khôi phục:\n" +
            `- Tốc độ cơ bản: ${CONFIG.energySystem.recoveryRate}/phút\n` +

            (() => {
              const generatorLevel = player.powerSystem?.generatorLevel || 0;
              const generatorBonus = CONFIG.powerGrid.generator.levels[generatorLevel].production;
              const currentHour = new Date().getHours();
              const isPeakHour = CONFIG.powerGrid.generator.peakHours.includes(currentHour);
              const timeBonus = !isPeakHour ? CONFIG.powerGrid.generator.offPeakBonus : 1;
              const efficiencyBonus = 1 + (player.upgrades.efficiency * 0.05);
              const poolBonus = player.settings?.inPool ? 1.1 : 1;

              const actualRate = CONFIG.energySystem.recoveryRate * generatorBonus * timeBonus * efficiencyBonus * poolBonus;
              return `- Tốc độ thực tế: ${actualRate.toFixed(2)}/phút`;
            })() + "\n\n" +

            "📌 Các lệnh có sẵn:\n" +
            "• .coin energy info - Xem chi tiết hệ thống năng lượng\n" +
            "• .coin energy upgrade - Nâng cấp máy phát điện\n" +
            "• .coin energy fuel - Mua nhiên liệu nạp năng lượng\n\n" +

            "💡 Mẹo: Đào vào giờ thấp điểm (20:00-07:59) để tăng tốc độ khôi phục năng lượng!",
            threadID,
            messageID
          );
        }

        if (energyAction === "info") {
          const generatorLevel = player.powerSystem?.generatorLevel || 0;
          const generator = CONFIG.powerGrid.generator.levels[generatorLevel];
          const nextGenerator = CONFIG.powerGrid.generator.levels[generatorLevel + 1];

          const currentHour = new Date().getHours();
          const isPeakHour = CONFIG.powerGrid.generator.peakHours.includes(currentHour);

          let timeToFull = "∞";
          if (player.energy < CONFIG.energySystem.maxEnergy) {

            const generatorBonus = generator.production;
            const timeBonus = !isPeakHour ? CONFIG.powerGrid.generator.offPeakBonus : 1;
            const efficiencyBonus = 1 + (player.upgrades.efficiency * 0.05);
            const poolBonus = player.settings?.inPool ? 1.1 : 1;

            const actualRate = CONFIG.energySystem.recoveryRate * generatorBonus * timeBonus * efficiencyBonus * poolBonus;
            const energyNeeded = CONFIG.energySystem.maxEnergy - player.energy;
            const minutesToFull = Math.ceil(energyNeeded / actualRate);

            timeToFull = `${Math.floor(minutesToFull / 60)}h ${minutesToFull % 60}m`;
          }

          return api.sendMessage(
            "⚡ CHI TIẾT HỆ THỐNG NĂNG LƯỢNG ⚡\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🔋 Năng lượng: ${player.energy}/${CONFIG.energySystem.maxEnergy}\n` +
            `⏱️ Thời gian đến full: ${timeToFull}\n\n` +

            "🏭 MÁY PHÁT ĐIỆN:\n" +
            `- Cấp độ: ${generatorLevel} - ${generator.name || "Máy phát điện cấp " + generatorLevel}\n` +
            `- Hiệu suất: x${generator.production.toFixed(1)}\n` +
            (nextGenerator ? `- Nâng cấp tiếp theo: ${nextGenerator.cost.toLocaleString()}$\n` : "- Đã đạt cấp tối đa\n") +
            "\n" +

            "⏰ THÔNG TIN THỜI GIAN:\n" +
            `- Hiện tại: ${isPeakHour ? "Giờ cao điểm ⚠️" : "Giờ thấp điểm ✅"}\n` +
            `- Hệ số hiện tại: ${isPeakHour ? "x1.0" : `x${CONFIG.powerGrid.generator.offPeakBonus.toFixed(1)}`}\n` +
            "- Giờ cao điểm: 08:00 - 19:59\n" +
            "- Giờ thấp điểm: 20:00 - 07:59\n\n" +

            "🔌 HIỆU SUẤT NĂNG LƯỢNG:\n" +
            `- Bonus từ Efficiency: +${(player.upgrades.efficiency * 5).toFixed(0)}%\n` +
            `- Bonus từ Mining Pool: ${player.settings?.inPool ? "+10%" : "Không có (chưa tham gia pool)"}\n\n` +

            "💡 Mẹo: Nâng cấp máy phát điện và đào vào giờ thấp điểm để tối ưu hiệu quả!",
            threadID,
            messageID
          );
        }

        if (energyAction === "upgrade") {
          if (!player.powerSystem) {
            player.powerSystem = {
              generatorLevel: 0,
              lastFuelUse: 0,
              fuelHistory: []
            };
          }

          const generatorLevel = player.powerSystem.generatorLevel || 0;
          const nextLevel = generatorLevel + 1;

          if (nextLevel >= CONFIG.powerGrid.generator.levels.length) {
            api.sendMessage(
              "❌ Máy phát điện đã đạt cấp độ tối đa!",
              threadID,
              messageID
            );
            break;
          }

          const upgradeCost = CONFIG.powerGrid.generator.levels[nextLevel].cost;
          const balance = await getBalance(senderID);

          if (balance < upgradeCost) {
            api.sendMessage(
              "❌ Không đủ tiền để nâng cấp máy phát điện!\n\n" +
              `💰 Số dư: ${balance.toLocaleString()}$\n` +
              `💵 Chi phí nâng cấp: ${upgradeCost.toLocaleString()}$\n` +
              `💸 Thiếu: ${(upgradeCost - balance).toLocaleString()}$`,
              threadID,
              messageID
            );
            break;
          }

          await updateBalance(senderID, -upgradeCost);
          player.powerSystem.generatorLevel = nextLevel;

          saveData(miningData, marketData);

          const newGenerator = CONFIG.powerGrid.generator.levels[nextLevel];
          const productionIncrease = (newGenerator.production / CONFIG.powerGrid.generator.levels[generatorLevel].production - 1) * 100;

          api.sendMessage(
            "🔋 NÂNG CẤP MÁY PHÁT ĐIỆN THÀNH CÔNG! 🔋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `⚙️ Cấp độ máy phát: ${generatorLevel} → ${nextLevel}\n` +
            `📈 Tăng hiệu suất: +${productionIncrease.toFixed(0)}%\n` +
            `💰 Chi phí: ${upgradeCost.toLocaleString()}$\n\n` +
            `⚡ Tốc độ khôi phục năng lượng mới: x${newGenerator.production.toFixed(1)}\n` +
            "💡 Năng lượng sẽ hồi phục nhanh hơn đáng kể!",
            threadID,
            messageID
          );
          break;
        }

        if (energyAction === "fuel") {
          if (!CONFIG.powerGrid.fuelTypes || CONFIG.powerGrid.fuelTypes.length === 0) {
            return api.sendMessage(
              "❌ Không có nhiên liệu nào có sẵn trong hệ thống!",
              threadID,
              messageID
            );
          }

          if (!target[2]) {
            let fuelMessage = "🔋 NHIÊN LIỆU HỒI NĂNG LƯỢNG 🔋\n━━━━━━━━━━━━━━━━━━\n\n";

            CONFIG.powerGrid.fuelTypes.forEach((fuel, index) => {
              const cooldownLeft = player.powerSystem.lastFuelUse && player.powerSystem.lastFuelUse[fuel.name]
                ? Math.max(0, (player.powerSystem.lastFuelUse[fuel.name] + fuel.cooldown - Date.now()) / 1000 / 60)
                : 0;

              fuelMessage += `${index + 1}. ${fuel.name}\n`;
              fuelMessage += `   💰 Giá: ${fuel.costPerUnit.toLocaleString()}$\n`;
              fuelMessage += `   ⚡ Năng lượng: +${fuel.energyPerUnit}\n`;
              fuelMessage += cooldownLeft > 0
                ? `   ⏳ Thời gian chờ: ${Math.floor(cooldownLeft / 60)}h ${Math.floor(cooldownLeft % 60)}m\n`
                : `   ✅ Sẵn sàng sử dụng\n`;
              fuelMessage += "\n";
            });

            fuelMessage += "👉 Dùng .coin energy fuel [số thứ tự] để mua nhiên liệu";

            return api.sendMessage(fuelMessage, threadID, messageID);
          }

          const fuelIndex = parseInt(target[2]) - 1;
          if (isNaN(fuelIndex) || fuelIndex < 0 || fuelIndex >= CONFIG.powerGrid.fuelTypes.length) {
            return api.sendMessage(
              "❌ Số thứ tự nhiên liệu không hợp lệ!",
              threadID,
              messageID
            );
          }

          const selectedFuel = CONFIG.powerGrid.fuelTypes[fuelIndex];

          if (!player.powerSystem.lastFuelUse) {
            player.powerSystem.lastFuelUse = {};
          }

          const lastUsed = player.powerSystem.lastFuelUse[selectedFuel.name] || 0;
          const cooldownLeft = Math.max(0, lastUsed + selectedFuel.cooldown - Date.now());

          if (cooldownLeft > 0) {
            const minutes = Math.floor(cooldownLeft / 60000);
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;

            return api.sendMessage(
              `⏳ Nhiên liệu "${selectedFuel.name}" đang trong thời gian hồi!\n` +
              `⌛ Vui lòng đợi ${hours > 0 ? `${hours}h ` : ''}${remainingMinutes}m nữa.`,
              threadID,
              messageID
            );
          }

          const balance = await getBalance(senderID);
          if (balance < selectedFuel.costPerUnit) {
            return api.sendMessage(
              `❌ Không đủ tiền! Bạn cần ${selectedFuel.costPerUnit.toLocaleString()}$ để mua ${selectedFuel.name}.`,
              threadID,
              messageID
            );
          }

          if (player.energy >= CONFIG.energySystem.maxEnergy) {
            return api.sendMessage(
              "❌ Năng lượng của bạn đã đầy!",
              threadID,
              messageID
            );
          }

          await updateBalance(senderID, -selectedFuel.costPerUnit);

          const oldEnergy = player.energy;
          player.energy = Math.min(CONFIG.energySystem.maxEnergy, player.energy + selectedFuel.energyPerUnit);
          const actualEnergyAdded = player.energy - oldEnergy;

          player.powerSystem.lastFuelUse[selectedFuel.name] = Date.now();

          if (!player.powerSystem.fuelHistory) {
            player.powerSystem.fuelHistory = [];
          }

          player.powerSystem.fuelHistory.push({
            type: selectedFuel.name,
            timestamp: Date.now(),
            energyAdded: actualEnergyAdded,
            cost: selectedFuel.costPerUnit
          });

          if (player.powerSystem.fuelHistory.length > 10) {
            player.powerSystem.fuelHistory = player.powerSystem.fuelHistory.slice(-10);
          }

          player.lastEnergyUpdate = Date.now();

          saveData(miningData, marketData);

          return api.sendMessage(
            `✅ MUA NHIÊN LIỆU THÀNH CÔNG!\n\n` +
            `🔋 ${selectedFuel.name} đã được sử dụng\n` +
            `⚡ Năng lượng: ${oldEnergy} → ${player.energy} (+${actualEnergyAdded})\n` +
            `💰 Chi phí: ${selectedFuel.costPerUnit.toLocaleString()}$\n` +
            `💵 Số dư còn lại: ${(await getBalance(senderID)).toLocaleString()}$`,
            threadID,
            messageID
          );
        }


      case "epoch":
        const currentEpochData = CONFIG.epochs.list[CONFIG.epochs.currentEpoch];
        const currentsupplyRatio = CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;
        const progressInEpoch = Math.min(100, Math.max(0,
          ((currentsupplyRatio - (CONFIG.epochs.currentEpoch > 0 ?
            CONFIG.epochs.list[CONFIG.epochs.currentEpoch - 1].supply : 0)) /
            (currentEpochData.supply - (CONFIG.epochs.currentEpoch > 0 ?
              CONFIG.epochs.list[CONFIG.epochs.currentEpoch - 1].supply : 0))) * 100
        ));

        const nextEpoch = CONFIG.epochs.list[CONFIG.epochs.currentEpoch + 1];

        api.sendMessage(
          "⏳ THỜI ĐẠI LCOIN ⏳\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `🌟 Kỷ Nguyên Hiện Tại: ${currentEpochData.name}\n` +
          `📝 Mô tả: ${currentEpochData.description}\n\n` +

          "📊 THÔNG SỐ HIỆN TẠI:\n" +
          `• Tiến độ: ${progressInEpoch.toFixed(1)}%\n` +
          `• Độ khó: x${currentEpochData.difficultyMultiplier}\n` +
          `• Phần thưởng: x${currentEpochData.rewardMultiplier}\n\n` +

          (nextEpoch ?
            `⏳ Kỷ nguyên tiếp theo: ${nextEpoch.name}\n` +
            `• Bắt đầu ở: ${(nextEpoch.supply * 100).toFixed(0)}% tổng cung\n` +
            `• Còn thiếu: ${((nextEpoch.supply * CONFIG.coinLimit.maxSupply) -
              CONFIG.coinLimit.currentSupply).toLocaleString()} LCoin\n\n`
            : "🎯 Đã đạt kỷ nguyên cuối cùng!\n\n") +

          "📜 LỊCH SỬ CÁC MỐC:\n" +
          CONFIG.epochs.milestones.map(m =>
            `• ${CONFIG.epochs.list[m.epoch].name}\n` +
            `  📅 ${new Date(m.timestamp).toLocaleDateString()}\n` +
            `  💰 Giá: ${m.price.toLocaleString()}$\n`
          ).join("\n"),
          threadID, messageID
        );
        break;

      case "admin": {
        const adminConfig = require('../admin.json');
        if (!adminConfig.adminUIDs.includes(senderID)) {
          return api.sendMessage("❌ Bạn không có quyền admin để sử dụng lệnh này.", threadID, messageID);
        }

        if (!target[1]) {
          return api.sendMessage(
            "👑 COIN ADMIN PANEL 👑\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "📌 QUẢN LÝ NGƯỜI DÙNG:\n" +
            "• .coin admin give [UID] [amount] - Cấp coin\n" +
            "• .coin admin take [UID] [amount] - Thu hồi coin\n" +
            "• .coin admin reset [UID] - Reset người dùng\n\n" +

            "📊 QUẢN LÝ THỊ TRƯỜNG:\n" +
            "• .coin admin setprice [amount] - Đặt giá coin\n" +
            "• .coin admin event [eventType] - Kích hoạt sự kiện\n" +
            "• .coin admin halving - Kích hoạt halving\n\n" +

            "⚙️ CẤU HÌNH HỆ THỐNG:\n" +
            "• .coin admin difficulty [amount] - Đặt độ khó\n" +
            "• .coin admin reward [amount] - Đặt phần thưởng\n" +
            "• .coin admin energy [UID] [amount] - Đặt năng lượng\n\n" +

            "👁️ GIÁM SÁT & KIỂM TRA:\n" +
            "• .coin admin view [UID] - Xem thông tin người dùng\n" +
            "• .coin admin stats - Xem thống kê hệ thống\n" +
            "• .coin admin export - Xuất dữ liệu sang JSON\n\n" +

            "📈 KÍCH THÍCH THỊ TRƯỜNG:\n" +
            "• .coin admin boom - Kích hoạt thị trường tăng mạnh\n" +
            "• .coin admin crash - Kích hoạt thị trường sụp đổ\n" +
            "• .coin admin volatility [1-10] - Điều chỉnh biến động\n" +
            "• .coin admin whale [buy/sell] [amount] - Giao dịch cá voi",

            threadID, messageID
          );
        }

        const adminAction = target[1].toLowerCase();

        if (adminAction === "give") {
          const targetUID = target[2];
          const amount = parseInt(target[3]);

          if (!targetUID || !amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin give [UID] [amount]", threadID, messageID);
          }

          if (!miningData[targetUID]) {
            miningData[targetUID] = initializePlayer(targetUID);
          }

          miningData[targetUID].coins += amount;
          CONFIG.coinLimit.currentSupply += amount;

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ CẤP COIN THÀNH CÔNG!\n\n" +
            `👤 UID: ${targetUID}\n` +
            `💰 Số lượng: +${amount.toLocaleString()} LCoin\n` +
            `💎 Tổng coin hiện tại: ${miningData[targetUID].coins.toLocaleString()} LCoin`,
            threadID, messageID
          );
        }

        if (adminAction === "take") {
          const targetUID = target[2];
          const amount = parseInt(target[3]);

          if (!targetUID || !amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin take [UID] [amount]", threadID, messageID);
          }

          if (!miningData[targetUID]) {
            return api.sendMessage("❌ Người dùng không tồn tại trong hệ thống.", threadID, messageID);
          }

          const actualTaken = Math.min(miningData[targetUID].coins, amount);
          miningData[targetUID].coins -= actualTaken;
          CONFIG.coinLimit.currentSupply -= actualTaken;

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ THU HỒI COIN THÀNH CÔNG!\n\n" +
            `👤 UID: ${targetUID}\n` +
            `💰 Số lượng: -${actualTaken.toLocaleString()} LCoin\n` +
            `💎 Tổng coin hiện tại: ${miningData[targetUID].coins.toLocaleString()} LCoin`,
            threadID, messageID
          );
        }

        if (adminAction === "reset") {
          const targetUID = target[2];

          if (!targetUID) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin reset [UID]", threadID, messageID);
          }

          if (!miningData[targetUID]) {
            return api.sendMessage("❌ Người dùng không tồn tại trong hệ thống.", threadID, messageID);
          }

          const oldCoins = miningData[targetUID].coins;
          CONFIG.coinLimit.currentSupply -= oldCoins;

          miningData[targetUID] = initializePlayer(targetUID);

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ RESET TÀI KHOẢN THÀNH CÔNG!\n\n" +
            `👤 UID: ${targetUID}\n` +
            `💰 Coins đã thu hồi: ${oldCoins.toLocaleString()} LCoin\n` +
            "⚙️ Tất cả chỉ số và nâng cấp đã được đặt về mặc định.",
            threadID, messageID
          );
        }

        if (adminAction === "setprice") {
          const newPrice = parseInt(target[2]);

          if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin setprice [amount]", threadID, messageID);
          }

          const oldPrice = marketData.price;
          marketData.price = newPrice;

          marketData.history.push({
            price: oldPrice,
            timestamp: Date.now() - 1000,
            type: "admin"
          });

          if (marketData.history.length > 50) {
            marketData.history = marketData.history.slice(-50);
          }

          marketData.lastUpdate = Date.now();
          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ THAY ĐỔI GIÁ COIN THÀNH CÔNG!\n\n" +
            `📊 Giá cũ: ${oldPrice.toLocaleString()}$\n` +
            `📈 Giá mới: ${newPrice.toLocaleString()}$\n` +
            `📉 Thay đổi: ${((newPrice - oldPrice) / oldPrice * 100).toFixed(2)}%`,
            threadID, messageID
          );
        }

        if (adminAction === "boom") {
          const boomIntensity = parseFloat(target[2]) || 1.5;
          const limitedIntensity = Math.min(3.0, Math.max(1.1, boomIntensity));

          const oldPrice = marketData.price;
          const newPrice = Math.min(CONFIG.market.maxPrice, Math.floor(oldPrice * limitedIntensity));

          marketData.history.push({
            price: oldPrice,
            timestamp: Date.now() - 1000,
            type: "admin_boom"
          });

          marketData.price = newPrice;
          marketData.lastUpdate = Date.now();

          marketData.npcActivities = marketData.npcActivities || [];
          marketData.npcActivities.push({
            type: "buy",
            trader: "Institutional Investor",
            amount: Math.floor(CONFIG.coinLimit.currentSupply * 0.05),
            price: newPrice * 0.95,
            timestamp: Date.now(),
            duration: 12 * 60 * 60 * 1000
          });

          saveData(miningData, marketData);

          return api.sendMessage(
            "🚀 THỊ TRƯỜNG BÙng NỔ 🚀\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📈 Giá tăng: ${oldPrice.toLocaleString()}$ → ${newPrice.toLocaleString()}$ (+${((newPrice / oldPrice - 1) * 100).toFixed(1)}%)\n` +
            "🧠 Tâm lý thị trường: Cực kỳ tích cực\n" +
            "👥 Người chơi sẽ bị ảnh hưởng tâm lý FOMO\n" +
            "♻️ Hiệu ứng sẽ lan tỏa trong 12 giờ tới\n\n" +
            "💡 Những cá voi đã bắt đầu mua vào mạnh mẽ!",
            threadID, messageID
          );
        }

        if (adminAction === "crash") {
          const crashIntensity = parseFloat(target[2]) || 0.6;
          const limitedIntensity = Math.max(0.3, Math.min(0.9, crashIntensity));

          const oldPrice = marketData.price;
          const newPrice = Math.max(CONFIG.market.minPrice, Math.floor(oldPrice * limitedIntensity));

          marketData.history.push({
            price: oldPrice,
            timestamp: Date.now() - 1000,
            type: "admin_crash"
          });

          marketData.price = newPrice;
          marketData.lastUpdate = Date.now();

          marketData.npcActivities = marketData.npcActivities || [];
          marketData.npcActivities.push({
            type: "sell",
            trader: "Panic Sellers",
            amount: Math.floor(CONFIG.coinLimit.currentSupply * 0.1),
            price: newPrice * 1.05,
            timestamp: Date.now(),
            duration: 6 * 60 * 60 * 1000
          });

          saveData(miningData, marketData);

          return api.sendMessage(
            "📉 THỊ TRƯỜNG SỤP ĐỔ 📉\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📉 Giá giảm: ${oldPrice}$ → ${newPrice}$ (${((newPrice / oldPrice - 1) * 100).toFixed(1)}%)\n` +
            "😱 Tâm lý thị trường: Hoảng loạn\n" +
            "🏃‍♂️ Người chơi đang bán tháo để cắt lỗ\n" +
            "♻️ Hiệu ứng sẽ kéo dài trong 6 giờ tới\n\n" +
            "💡 Cơ hội tốt để mua vào với giá rẻ!",
            threadID, messageID
          );
        }

        if (adminAction === "volatility") {
          const newVolatility = parseFloat(target[2]);

          if (isNaN(newVolatility) || newVolatility < 1 || newVolatility > 10) {
            return api.sendMessage(
              "❌ Vui lòng nhập mức độ biến động từ 1-10\n" +
              "Sử dụng: .coin admin volatility [1-10]",
              threadID, messageID
            );
          }

          const oldVolatility = CONFIG.market.volatility;
          CONFIG.market.volatility = newVolatility * 0.05;

          saveData(miningData, marketData);

          return api.sendMessage(
            "⚙️ ĐÃ THAY ĐỔI ĐỘ BIẾN ĐỘNG THỊ TRƯỜNG\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📊 Biến động cũ: x${(oldVolatility / 0.05).toFixed(1)}\n` +
            `📊 Biến động mới: x${newVolatility.toFixed(1)}\n\n` +
            "💡 Độ biến động cao = Giá thay đổi nhiều hơn mỗi chu kỳ\n" +
            "💡 Độ biến động thấp = Giá ổn định hơn",
            threadID, messageID
          );
        }

        if (adminAction === "whale") {
          const whaleAction = target[2]?.toLowerCase();
          const whaleAmount = parseInt(target[3]);

          if (!whaleAction || !["buy", "sell"].includes(whaleAction) || !whaleAmount || whaleAmount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập đúng định dạng:\n" +
              ".coin admin whale [buy/sell] [amount]",
              threadID, messageID
            );
          }

          const maxAmount = Math.floor(CONFIG.coinLimit.currentSupply * 0.15);
          const actualAmount = Math.min(whaleAmount, maxAmount);

          const priceImpact = whaleAction === "buy" ? 0.1 : -0.08;
          const oldPrice = marketData.price;
          const newPrice = Math.max(
            CONFIG.market.minPrice,
            Math.min(
              CONFIG.market.maxPrice,
              Math.floor(oldPrice * (1 + priceImpact * (actualAmount / maxAmount)))
            )
          );

          marketData.history.push({
            price: oldPrice,
            timestamp: Date.now() - 1000,
            type: "admin_whale_" + whaleAction
          });

          marketData.price = newPrice;
          marketData.lastUpdate = Date.now();

          CONFIG.market.tradingVolume[whaleAction] += actualAmount;
          CONFIG.market.tradingVolume.totalVolume += actualAmount;

          marketData.npcActivities = marketData.npcActivities || [];
          marketData.npcActivities.push({
            type: whaleAction,
            trader: "Institutional Whale",
            amount: actualAmount,
            price: whaleAction === "buy" ? oldPrice * 1.02 : oldPrice * 0.98,
            timestamp: Date.now(),
            duration: 24 * 60 * 60 * 1000
          });

          saveData(miningData, marketData);

          return api.sendMessage(
            `🐋 GIAO DỊCH CÁ VOI: ${whaleAction.toUpperCase()} 🐋\n` +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `💰 Khối lượng: ${actualAmount.toLocaleString()} LCoin\n` +
            `📊 Tác động giá: ${oldPrice}$ → ${newPrice}$ (${((newPrice / oldPrice - 1) * 100).toFixed(2)}%)\n` +
            `📉 Giá phản ứng: ${whaleAction === "buy" ? "Tăng mạnh ⤴️" : "Giảm mạnh ⤵️"}\n\n` +
            "💬 Tin đồn thị trường: Có người đang âm thầm tích lũy/xả hàng!",
            threadID, messageID
          );
        }


        if (adminAction === "airdrops") {
          const amount = parseInt(target[2]);
          const message = target.slice(3).join(" ") || "Chương trình Airdrop từ Admin";

          if (!amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập số lượng coin hợp lệ!\n" +
              "Sử dụng: .coin admin airdrops [amount] [message]",
              threadID, messageID
            );
          }

          const activePlayers = Object.entries(miningData)
            .filter(([_, data]) => data.stats && data.stats.successfulMines > 5)
            .map(([uid, _]) => uid);

          if (activePlayers.length === 0) {
            return api.sendMessage("❌ Không có người chơi tích cực để phát coin!", threadID, messageID);
          }

          const coinsPerPlayer = Math.floor(amount / activePlayers.length);

          if (coinsPerPlayer <= 0) {
            return api.sendMessage(
              "❌ Số lượng coin quá ít để phát cho tất cả người chơi tích cực!",
              threadID, messageID
            );
          }

          let distributedCount = 0;

          activePlayers.forEach(uid => {
            if (!miningData[uid]) return;

            miningData[uid].coins += coinsPerPlayer;
            miningData[uid].airdrops = miningData[uid].airdrops || [];
            miningData[uid].airdrops.push({
              amount: coinsPerPlayer,
              timestamp: Date.now(),
              message: message
            });

            distributedCount++;
          });
        }
        const event = CONFIG.miningEvents.possibleEvents.find(e => e.id === eventType);
        CONFIG.miningEvents.activeEvent = {
          ...event,
          startTime: Date.now(),
          endTime: Date.now() + event.duration
        };

        if (adminAction === "special") {
          const eventType = target[2]?.toLowerCase();
          const duration = parseInt(target[3]) || 24;

          if (!eventType || !["mining", "market", "reward", "energy"].includes(eventType)) {
            return api.sendMessage(
              "❌ Vui lòng chọn loại sự kiện hợp lệ!\n\n" +
              "Các sự kiện đặc biệt:\n" +
              "• mining - Tăng tỷ lệ đào thành công\n" +
              "• market - Tạo chu kỳ thị trường sôi động\n" +
              "• reward - Nhân đôi phần thưởng\n" +
              "• energy - Hồi năng lượng nhanh hơn\n\n" +
              "Sử dụng: .coin admin special [loại] [số giờ]",
              threadID, messageID
            );
          }

          CONFIG.specialEvents = CONFIG.specialEvents || {};
          CONFIG.specialEvents[eventType] = {
            active: true,
            startTime: Date.now(),
            endTime: Date.now() + duration * 60 * 60 * 1000,
            multiplier: eventType === "mining" ? 1.5 :
              eventType === "market" ? 2.0 :
                eventType === "reward" ? 2.0 : 2.0
          };

          return api.sendMessage(
            "✅ ĐÃ KÍCH HOẠT SỰ KIỆN THÀNH CÔNG!\n\n" +
            `🌟 Sự kiện: ${event.name}\n` +
            `💰 Hệ số phần thưởng: x${event.bonus}\n` +
            `⏱️ Thời lượng: ${(event.duration / 60000).toFixed(0)} phút\n` +
            `📅 Kết thúc vào: ${new Date(Date.now() + event.duration).toLocaleTimeString()}`,
            threadID, messageID
          );
        }

        if (adminAction === "halving") {
          const oldReward = CONFIG.blockReward.current;
          const newReward = Math.floor(oldReward / 2);

          CONFIG.blockReward.current = Math.max(1, newReward);

          if (!global.HALVING_EVENTS) global.HALVING_EVENTS = [];
          global.HALVING_EVENTS.push({
            timestamp: Date.now(),
            blockHeight: CONFIG.blockReward.blockHeight,
            previousReward: oldReward,
            newReward: CONFIG.blockReward.current
          });

          saveData(miningData, marketData);

          if (adminAction === "event") {
            const eventType = target[2]?.toLowerCase();

            if (!eventType || !CONFIG.miningEvents.possibleEvents.find(e => e.id === eventType)) {
              const eventList = CONFIG.miningEvents.possibleEvents.map(e =>
                `• ${e.id}: ${e.name} (x${e.bonus} phần thưởng, ${(e.duration / 60000).toFixed(0)} phút)`
              ).join('\n');

              return api.sendMessage(
                "❌ Vui lòng chọn sự kiện hợp lệ!\n\n" +
                "📋 Danh sách sự kiện:\n" + eventList + "\n\n" +
                "Sử dụng: .coin admin event [eventType]",
                threadID, messageID
              );
            }

            const eventName = eventType === "mining" ? "Cơn Sốt Đào Coin" :
              eventType === "market" ? "Thị Trường Sôi Động" :
                eventType === "reward" ? "Mưa Phần Thưởng" : "Siêu Năng Lượng";

            return api.sendMessage(
              `🌟 ĐÃ KÍCH HOẠT SỰ KIỆN ĐẶC BIỆT 🌟\n` +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              `✨ Sự kiện: ${eventName}\n` +
              `⏱️ Thời gian: ${duration} giờ\n` +
              `📅 Kết thúc: ${new Date(CONFIG.specialEvents[eventType].endTime).toLocaleString()}\n\n` +
              (eventType === "mining" ? "💡 Tỷ lệ đào thành công tăng 50%\n" :
                eventType === "market" ? "💡 Biến động thị trường tăng gấp đôi\n" :
                  eventType === "reward" ? "💡 Phần thưởng tăng gấp đôi\n" :
                    "💡 Hồi năng lượng nhanh gấp đôi\n") +
              "💡 Sự kiện có hiệu lực ngay lập tức!",
              threadID, messageID
            );
          }
        }

        if (adminAction === "difficulty") {
          const newDifficulty = parseInt(target[2]);

          if (!newDifficulty || isNaN(newDifficulty) || newDifficulty < 1) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin difficulty [amount]", threadID, messageID);
          }

          const oldDiff = CONFIG.advancedMining.difficulty.current;
          CONFIG.advancedMining.difficulty.current = newDifficulty;
          CONFIG.advancedMining.difficulty.initial = newDifficulty;

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ THAY ĐỔI ĐỘ KHÓ THÀNH CÔNG!\n\n" +
            `🔄 Độ khó cũ: ${oldDiff}\n` +
            `🔄 Độ khó mới: ${newDifficulty}\n` +
            `🎯 Tỷ lệ thành công khoảng: ${(100 / (2 ** newDifficulty)).toFixed(6)}%`,
            threadID, messageID
          );
        }

        if (adminAction === "reward") {
          const newReward = parseInt(target[2]);

          if (!newReward || isNaN(newReward) || newReward < 1) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin reward [amount]", threadID, messageID);
          }

          const oldReward = CONFIG.blockReward.current;
          CONFIG.blockReward.current = newReward;

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ THAY ĐỔI PHẦN THƯỞNG THÀNH CÔNG!\n\n" +
            `💰 Phần thưởng cũ: ${oldReward} LCoin\n` +
            `💰 Phần thưởng mới: ${newReward} LCoin\n` +
            `📊 Thay đổi: ${newReward > oldReward ? "+" : ""}${((newReward - oldReward) / oldReward * 100).toFixed(0)}%`,
            threadID, messageID
          );
        }

        if (adminAction === "energy") {
          const targetUID = target[2];
          const amount = parseInt(target[3]);

          if (!targetUID || !amount || isNaN(amount)) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin energy [UID] [amount]", threadID, messageID);
          }

          if (!miningData[targetUID]) {
            return api.sendMessage("❌ Người dùng không tồn tại trong hệ thống.", threadID, messageID);
          }

          const oldEnergy = miningData[targetUID].energy || 0;
          miningData[targetUID].energy = Math.min(CONFIG.energySystem.maxEnergy, Math.max(0, amount));
          miningData[targetUID].lastEnergyUpdate = Date.now();

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ ĐÃ THAY ĐỔI NĂNG LƯỢNG THÀNH CÔNG!\n\n" +
            `👤 UID: ${targetUID}\n` +
            `⚡ Năng lượng cũ: ${oldEnergy}/${CONFIG.energySystem.maxEnergy}\n` +
            `⚡ Năng lượng mới: ${miningData[targetUID].energy}/${CONFIG.energySystem.maxEnergy}`,
            threadID, messageID
          );
        }

        if (adminAction === "view") {
          const targetUID = target[2];

          if (!targetUID) {
            return api.sendMessage("❌ Vui lòng nhập đúng định dạng: .coin admin view [UID]", threadID, messageID);
          }

          if (!miningData[targetUID]) {
            return api.sendMessage("❌ Người dùng không tồn tại trong hệ thống.", threadID, messageID);
          }

          const player = miningData[targetUID];
          const upgrades = player.upgrades;
          const specialUpgrades = player.specialUpgrades || {};

          return api.sendMessage(
            "👁️ XEM THÔNG TIN NGƯỜI DÙNG 👁️\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `👤 UID: ${targetUID}\n` +
            `👤 Tên: ${player.name || "Không xác định"}\n` +
            `💎 Coins: ${player.coins.toLocaleString()} LC (≈ ${(player.coins * marketData.price).toLocaleString()}$)\n` +
            `⚡ Năng lượng: ${player.energy?.toFixed(1) || 0}/${CONFIG.energySystem.maxEnergy}\n\n` +

            "⚙️ NÂNG CẤP:\n" +
            `• Power: ${upgrades?.power || 0}/10\n` +
            `• Efficiency: ${upgrades?.efficiency || 0}/10\n` +
            `• Cooling: ${upgrades?.cooling || 0}/10\n` +
            (specialUpgrades.gpu ? `• GPU: ${specialUpgrades.gpu.modelName}\n` : "") +
            (specialUpgrades.coolingsystem ? `• Cooling: ${specialUpgrades.coolingsystem.modelName}\n` : "") +
            "\n" +

            "📊 THỐNG KÊ:\n" +
            `• Tổng đã đào: ${player.stats?.totalMined.toLocaleString() || 0} LC\n` +
            `• Đào thành công: ${player.stats?.successfulMines || 0}\n` +
            `• Đào thất bại: ${player.stats?.failedMines || 0}\n\n` +

            "🔧 THAO TÁC:\n" +
            "• .coin admin give [UID] [amount] - Thêm coin\n" +
            "• .coin admin take [UID] [amount] - Trừ coin\n" +
            "• .coin admin reset [UID] - Đặt lại tài khoản",
            threadID, messageID
          );
        }

        if (adminAction === "stats") {
          const totalPlayers = Object.keys(miningData).length;
          const totalCoins = CONFIG.coinLimit.currentSupply;
          const percentMined = (totalCoins / CONFIG.coinLimit.maxSupply * 100).toFixed(2);
          const totalHeld = Object.values(miningData).reduce((sum, p) => sum + p.coins, 0);
          const circulatingSupply = Math.max(0, totalCoins - totalHeld);

          let richestPlayer = { uid: null, coins: 0 };
          for (const [uid, data] of Object.entries(miningData)) {
            if (data.coins > richestPlayer.coins) {
              richestPlayer = { uid, coins: data.coins };
            }
          }

          return api.sendMessage(
            "📊 THỐNG KÊ HỆ THỐNG 📊\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "💰 DỮ LIỆU COIN:\n" +
            `• Tổng đã đào: ${totalCoins.toLocaleString()}/${CONFIG.coinLimit.maxSupply.toLocaleString()} (${percentMined}%)\n` +
            `• Đang lưu thông: ${circulatingSupply.toLocaleString()} (${(circulatingSupply / totalCoins * 100).toFixed(2)}%)\n` +
            `• Đang được giữ: ${totalHeld.toLocaleString()} (${(totalHeld / totalCoins * 100).toFixed(2)}%)\n\n` +

            "👥 NGƯỜI DÙNG:\n" +
            `• Tổng người chơi: ${totalPlayers}\n` +
            `• Người giàu nhất: ${richestPlayer.uid} (${richestPlayer.coins.toLocaleString()} LC)\n\n` +

            "🌐 THỊ TRƯỜNG:\n" +
            `• Giá hiện tại: ${marketData.price.toLocaleString()}$\n` +
            `• Tổng giá trị: ${(totalCoins * marketData.price).toLocaleString()}$\n` +
            `• Khối lượng giao dịch: ${CONFIG.market.tradingVolume.totalVolume.toLocaleString()} LC\n\n` +

            "⛓️ BLOCKCHAIN:\n" +
            `• Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
            `• Phần thưởng: ${CONFIG.blockReward.current} LC\n` +
            `• Độ khó: ${CONFIG.advancedMining.difficulty.current}\n` +
            `• Kỷ nguyên: ${CONFIG.epochs.list[CONFIG.epochs.currentEpoch].name}`,
            threadID, messageID
          );
        }

        if (adminAction === "export") {
          const exportData = {
            config: CONFIG,
            marketData: marketData,
            players: Object.keys(miningData).length,
            timestamp: Date.now()
          };

          const exportFilePath = path.join(__dirname, '../exported_coin_data.json');
          fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2));

          return api.sendMessage(
            "✅ XUẤT DỮ LIỆU THÀNH CÔNG!\n\n" +
            `📂 File: exported_coin_data.json\n` +
            `📊 Kích thước: ${(JSON.stringify(exportData).length / 1024).toFixed(2)} KB\n` +
            `⏰ Thời gian: ${new Date().toLocaleString()}`,
            threadID, messageID
          );
        }

        return api.sendMessage("❌ Lệnh admin không hợp lệ! Dùng .coin admin để xem danh sách lệnh.", threadID, messageID);
        break;
      }
      case "wallet": {
        // Đảm bảo người chơi đã có ví
        initializeWallet(player, senderID);

        // Xử lý các sub-command
        const subCommand = target[1]?.toLowerCase();

        if (!subCommand || subCommand === "info") {
          // Hiển thị thông tin ví
          let pendingIn = 0;
          let pendingOut = 0;

          player.wallet.pendingTx.forEach(tx => {
            if (tx.direction === 'in') pendingIn += tx.amount;
            else pendingOut += tx.amount + tx.fee;
          });

          return api.sendMessage(
            "💼 VÍ LCOIN CỦA BẠN 💼\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +

            `📇 ĐỊA CHỈ VÍ:\n` +
            `${player.wallet.address}\n\n` +

            `💰 SỐ DƯ:\n` +
            `• Hiện có: ${player.coins.toLocaleString()} LC (≈ ${(player.coins * marketData.price).toLocaleString()}$)\n` +
            (pendingIn > 0 ? `• Đang nhận: +${pendingIn.toLocaleString()} LC\n` : "") +
            (pendingOut > 0 ? `• Đang gửi: -${pendingOut.toLocaleString()} LC\n` : "") +
            `• Giá hiện tại: ${marketData.price.toLocaleString()}$/LC\n\n` +

            `📊 GIAO DỊCH:\n` +
            `• Đang chờ xác nhận: ${player.wallet.pendingTx.length}\n` +
            `• Lịch sử giao dịch: ${player.wallet.transactions.length}\n\n` +

            `📌 HƯỚNG DẪN:\n` +
            `• .coin wallet send [địa chỉ] [số lượng] [ghi chú] - Gửi coin\n` +
            `• .coin wallet history - Xem lịch sử giao dịch\n` +
            `• .coin wallet pending - Xem giao dịch đang xử lý\n\n` +

            `💡 Mẹo: Sao chép địa chỉ ví này để nhận coin từ người khác!`,
            threadID, messageID
          );
        }

        if (subCommand === "send") {
          const receiverAddress = target[2];
          const amount = parseInt(target[3]);
          const memo = target.slice(4).join(' ');

          if (!receiverAddress || !amount || isNaN(amount) || amount <= 0) {
            return api.sendMessage(
              "❌ Thông tin giao dịch không hợp lệ!\n\n" +
              "Sử dụng: .coin wallet send [địa chỉ] [số lượng] [ghi chú]\n" +
              "Ví dụ: .coin wallet send LC1234ABCD... 1000 Chuyển tiền mua hàng",
              threadID, messageID
            );
          }

          if (receiverAddress === player.wallet.address) {
            return api.sendMessage("❌ Không thể gửi coin cho chính mình!", threadID, messageID);
          }

          const result = processTransaction(player, receiverAddress, amount, memo, miningData);

          if (result.success) {
            saveData(miningData, marketData);
          }

          return api.sendMessage(result.message, threadID, messageID);
        }

        if (subCommand === "history") {
          if (player.wallet.transactions.length === 0) {
            return api.sendMessage(
              "📜 LỊCH SỬ GIAO DỊCH\n\n" +
              "Bạn chưa có giao dịch nào!",
              threadID, messageID
            );
          }

          let historyMsg = "📜 LỊCH SỬ GIAO DỊCH GẦN ĐÂY 📜\n" +
            "━━━━━━━━━━━━━━━━━━\n\n";

          const sortedTx = [...player.wallet.transactions].sort((a, b) => b.timestamp - a.timestamp);

          sortedTx.slice(0, 5).forEach((tx, i) => {
            const dateStr = new Date(tx.timestamp).toLocaleString();
            const isReceived = tx.to === player.wallet.address;

            historyMsg += `${i + 1}. ${isReceived ? '📥 NHẬN' : '📤 GỬI'} | ${dateStr}\n`;
            historyMsg += `🆔 TX: ${tx.txID.substring(0, 8)}...${tx.txID.substring(tx.txID.length - 4)}\n`;
            historyMsg += `💰 Số lượng: ${tx.amount.toLocaleString()} LC\n`;

            if (isReceived) {
              historyMsg += `📤 Từ: ${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}\n`;
            } else {
              historyMsg += `📥 Đến: ${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}\n`;
              historyMsg += `🔍 Phí: ${tx.fee.toLocaleString()} LC\n`;
            }

            if (tx.memo) historyMsg += `📝 Ghi chú: ${tx.memo}\n`;
            historyMsg += `🔄 Trạng thái: ${tx.status === 'confirmed' ? '✅ Hoàn tất' : tx.status === 'failed' ? '❌ Thất bại' : '⏳ Đang xử lý'}\n\n`;
          });

          historyMsg += "Xem thêm: .coin wallet history [số trang]";

          return api.sendMessage(historyMsg, threadID, messageID);
        }

        if (subCommand === "pending") {
          if (player.wallet.pendingTx.length === 0) {
            return api.sendMessage(
              "📋 GIAO DỊCH ĐANG CHỜ XÁC NHẬN\n\n" +
              "Không có giao dịch nào đang chờ xác nhận!",
              threadID, messageID
            );
          }

          let pendingMsg = "📋 GIAO DỊCH ĐANG CHỜ XÁC NHẬN 📋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n";

          player.wallet.pendingTx.forEach((tx, i) => {
            const isReceived = tx.direction === 'in';

            pendingMsg += `${i + 1}. ${isReceived ? '📥 NHẬN' : '📤 GỬI'} ${tx.txID.substring(0, 8)}...\n`;
            pendingMsg += `💰 Số lượng: ${tx.amount.toLocaleString()} LC\n`;

            if (isReceived) {
              pendingMsg += `📤 Từ: ${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}\n`;
            } else {
              pendingMsg += `📥 Đến: ${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}\n`;
              pendingMsg += `🔍 Phí: ${tx.fee.toLocaleString()} LC\n`;
            }

            pendingMsg += `🔄 Xác nhận: ${tx.confirmations}/${CONFIG.walletSystem.confirmations}\n`;
            pendingMsg += `⏱️ Còn khoảng: ${Math.max(0, CONFIG.walletSystem.confirmations - tx.confirmations)} blocks\n\n`;
          });

          return api.sendMessage(pendingMsg, threadID, messageID);
        }

        return api.sendMessage(
          "❌ Lệnh không hợp lệ! Sử dụng:\n" +
          "• .coin wallet - Xem thông tin ví\n" +
          "• .coin wallet send [địa chỉ] [số lượng] [ghi chú] - Gửi coin\n" +
          "• .coin wallet history - Xem lịch sử giao dịch\n" +
          "• .coin wallet pending - Xem giao dịch đang xử lý",
          threadID, messageID
        );
        break;
      }
      case "buy":
        if (!target[1]) {
          return api.sendMessage(
            "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
            "💡 Cách sử dụng:\n" +
            "• .coin buy [số lượng] - Mua số lượng cụ thể\n" +
            "• .coin buy max - Mua tối đa có thể\n" +
            "• .coin buy half - Dùng một nửa số tiền để mua\n\n" +
            "💡 LCoin chỉ được phép giao dịch trong phạm vi đã đào",
            threadID,
            messageID
          );
        }

        const userBalance = await getBalance(senderID);
        const totalMined = CONFIG.coinLimit.currentSupply;
        const totalHeld = Object.values(miningData).reduce((total, p) => total + p.coins, 0);
        const circulatingSupply = Math.max(0, totalMined - totalHeld);

        let buyAmount;
        if (target[1].toLowerCase() === "max") {
          buyAmount = Math.min(
            Math.floor(userBalance / marketData.price),
            circulatingSupply,
            Math.floor(circulatingSupply * 0.25)
          );
        } else if (target[1].toLowerCase() === "half") {
          buyAmount = Math.min(
            Math.floor(userBalance / 2 / marketData.price),
            circulatingSupply,
            Math.floor(circulatingSupply * 0.25)
          );
        } else {
          buyAmount = parseInt(target[1]);
          if (!buyAmount || buyAmount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập số lượng hợp lệ!",
              threadID,
              messageID
            );
          }
        }

        const manipulationCheck = checkTradeManipulation(
          player,
          buyAmount,
          "buy",
          marketData,
          miningData
        );

        if (!manipulationCheck.allowed) {
          return api.sendMessage(
            `❌ GIAO DỊCH BỊ TỪ CHỐI!\n\n` +
            `Lý do: ${manipulationCheck.reason}\n` +
            `💡 Hệ thống chống thao túng đang hoạt động để bảo vệ thị trường`,
            threadID, messageID
          );
        }
        if (circulatingSupply <= 0) {
          return api.sendMessage(
            "❌ KHÔNG THỂ MUA COIN!\n\n" +
            "Lý do: Không có coin lưu thông trên thị trường\n" +
            `💎 Tổng coin đã đào: ${totalMined.toLocaleString()} LCoin\n` +
            `🔒 Số coin đang được giữ: ${totalHeld.toLocaleString()} LCoin\n\n` +
            "💡 Hãy chờ người khác bán ra để có thể mua vào!",
            threadID,
            messageID
          );
        }

        const maxBuyPerTransaction = Math.floor(circulatingSupply * 0.25);

        if (target[1].toLowerCase() === "max") {
          buyAmount = Math.min(
            Math.floor(userBalance / marketData.price),
            circulatingSupply,
            maxBuyPerTransaction
          );
        } else if (target[1].toLowerCase() === "half") {
          buyAmount = Math.min(
            Math.floor(userBalance / 2 / marketData.price),
            circulatingSupply,
            maxBuyPerTransaction
          );
        } else {
          buyAmount = parseInt(target[1]);
          if (!buyAmount || buyAmount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập số lượng hợp lệ!",
              threadID,
              messageID
            );
          }

          if (buyAmount > circulatingSupply) {
            return api.sendMessage(
              "❌ KHÔNG ĐỦ COIN TRONG THỊ TRƯỜNG!\n\n" +
              `🔄 Coin đang lưu thông: ${circulatingSupply.toLocaleString()} LCoin\n` +
              `💰 Số coin bạn muốn mua: ${buyAmount.toLocaleString()} LCoin\n` +
              "💡 Hãy thử mua một số lượng nhỏ hơn!",
              threadID,
              messageID
            );
          }

          if (buyAmount > maxBuyPerTransaction) {
            return api.sendMessage(
              "❌ VƯỢT QUÁ GIỚI HẠN MUA MỖI GIAO DỊCH!\n\n" +
              `💰 Số coin muốn mua: ${buyAmount.toLocaleString()}\n` +
              `🔄 Giới hạn mỗi giao dịch: ${maxBuyPerTransaction.toLocaleString()} (25% lượng coin lưu thông)\n` +
              "💡 Hãy chia nhỏ giao dịch để không ảnh hưởng thị trường",
              threadID,
              messageID
            );
          }
        }

        const baseCost = Math.ceil(buyAmount * marketData.price);
        const buyRatio = buyAmount / circulatingSupply;
        const taxRate = Math.min(0.3, buyRatio * 0.5);
        const tax = Math.ceil(baseCost * taxRate);
        const TaxtotalCost = baseCost + tax;

        if (TaxtotalCost > userBalance) {
          return api.sendMessage(
            "❌ Không đủ tiền để mua (bao gồm thuế giao dịch)!\n\n" +
            `💵 Số dư: ${userBalance.toLocaleString()}$\n` +
            `💰 Chi phí cơ bản: ${baseCost.toLocaleString()}$\n` +
            `🧾 Thuế giao dịch: ${tax.toLocaleString()}$ (${(taxRate * 100).toFixed(1)}%)\n` +
            `💸 Tổng cần: ${TaxtotalCost.toLocaleString()}$\n\n` +
            "💡 Giao dịch lớn chịu thuế cao hơn để ngăn thao túng thị trường",
            threadID,
            messageID
          );
        }

        if (buyAmount <= 0) {
          return api.sendMessage(
            "❌ Không thể mua số lượng này!",
            threadID,
            messageID
          );
        }

        await updateBalance(senderID, -TaxtotalCost);
        player.coins += buyAmount;
        CONFIG.market.tradingVolume.buy += buyAmount;
        CONFIG.market.tradingVolume.totalVolume += buyAmount;

        if (player.coins > CONFIG.coinLimit.currentSupply * 0.4) {

          marketData.npcActivities = marketData.npcActivities || [];
          marketData.npcActivities.push({
            type: "sell",
            amount: Math.floor(player.coins * 0.1),
            price: marketData.price * 1.2,
            timestamp: Date.now(),
            duration: 48 * 60 * 60 * 1000
          });

          api.sendMessage(
            "⚠️ CẢNH BÁO THỊ TRƯỜNG: Phát hiện đầu cơ lớn!\n" +
            "Các nhà đầu tư khác sẽ bắt đầu bán coin ra thị trường để cân bằng giá.",
            threadID
          );
        }

        api.sendMessage(
          "💰 MUA LCOIN THÀNH CÔNG 💰\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `📥 Số lượng: ${buyAmount.toLocaleString()} LCoin\n` +
          `💵 Chi phí: ${baseCost.toLocaleString()}$\n` +
          (tax > 0 ? `🧾 Thuế giao dịch: ${tax.toLocaleString()}$ (${(taxRate * 100).toFixed(1)}%)\n` : "") +
          `💸 Tổng chi: ${TaxtotalCost.toLocaleString()}$\n` +
          `💎 LCoin hiện có: ${player.coins.toLocaleString()}\n` +
          `🔄 Coin còn lưu thông: ${(circulatingSupply - buyAmount).toLocaleString()}\n\n` +
          `📊 Giá thị trường: ${marketData.price}$/LCoin`,
          threadID,
          messageID
        );
        break;

      case "blocks":
        if (!CONFIG.blockHistory || CONFIG.blockHistory.blocks.length === 0) {
          return api.sendMessage(
            "📋 LỊCH SỬ BLOCK 📋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "Chưa có block nào được đào.\n" +
            "💡 Khi có người đào được block, thông tin sẽ hiển thị ở đây!",
            threadID,
            messageID
          );
        }

        const blockCount = parseInt(target[1]) || 5;
        const recentBlocks = CONFIG.blockHistory.blocks.slice(
          -Math.min(blockCount, 10)
        );

        let blocksMessage =
          "📋 LỊCH SỬ BLOCK GẦN NHẤT 📋\n" + "━━━━━━━━━━━━━━━━━━\n\n";

        recentBlocks.forEach((block) => {
          const date = new Date(block.timestamp).toLocaleString("vi-VN");
          blocksMessage +=
            `🧊 Block #${block.height}\n` +
            `⛏️ Đào bởi: ${block.miner}\n` +
            `💰 Phần thưởng: ${block.reward} LCoin\n` +
            `🔥 Độ khó: ${block.difficulty.toFixed(2)}\n` +
            `⏰ Thời gian: ${date}\n\n`;
        });

        blocksMessage += `💡 Xem thêm: .coin blocks [số lượng]`;

        api.sendMessage(blocksMessage, threadID, messageID);
        break;

      case "trade": {
        initializeWallet(player, senderID);

        const tradeAction = target[1]?.toLowerCase();

        if (!tradeAction || !["create", "accept", "cancel", "list", "info"].includes(tradeAction)) {
          return api.sendMessage(
            "🔄 GIAO DỊCH P2P LCOIN 🔄\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "📌 CHỨC NĂNG:\n" +
            "• .coin trade create [số lượng] [giá/LC] - Tạo lệnh bán\n" +
            "• .coin trade accept [ID giao dịch] - Chấp nhận giao dịch\n" +
            "• .coin trade list - Xem các lệnh đang có\n" +
            "• .coin trade cancel [ID giao dịch] - Hủy lệnh của bạn\n" +
            "• .coin trade info [ID giao dịch] - Xem chi tiết giao dịch\n\n" +
            "💡 Giao dịch P2P cho phép mua bán trực tiếp với người chơi khác",
            threadID, messageID
          );
        }

        if (!global.tradingSystem) {
          global.tradingSystem = {
            offers: [],
            history: [],
            lastOfferId: 0
          };
        }

        if (tradeAction === "create") {
          const amount = parseInt(target[2]);
          const pricePerCoin = parseInt(target[3]);

          if (!amount || isNaN(amount) || amount <= 0 || !pricePerCoin || isNaN(pricePerCoin) || pricePerCoin <= 0) {
            return api.sendMessage(
              "❌ Thông tin giao dịch không hợp lệ!\n\n" +
              "Sử dụng: .coin trade create [số lượng] [giá/LC]\n" +
              "Ví dụ: .coin trade create 1000 2000 (bán 1000 LC, giá 2000$/LC)",
              threadID, messageID
            );
          }

          if (amount > player.coins) {
            return api.sendMessage(
              "❌ Bạn không có đủ coin để tạo lệnh này!\n\n" +
              `💰 Số LCoin hiện có: ${player.coins.toLocaleString()}\n` +
              `💸 Số cần bán: ${amount.toLocaleString()}`,
              threadID, messageID
            );
          }

          const tradeFee = Math.ceil(amount * 0.01);
          const totalAmount = amount + tradeFee;

          if (totalAmount > player.coins) {
            return api.sendMessage(
              "❌ Không đủ coin để thanh toán phí giao dịch!\n\n" +
              `💰 Bạn có: ${player.coins.toLocaleString()} LC\n` +
              `🔢 Số cần bán: ${amount.toLocaleString()} LC\n` +
              `🧾 Phí giao dịch: ${tradeFee.toLocaleString()} LC (1%)\n` +
              `💸 Tổng cần: ${totalAmount.toLocaleString()} LC`,
              threadID, messageID
            );
          }

          player.coins -= totalAmount;

          const tradeId = 'T' + (++global.tradingSystem.lastOfferId).toString().padStart(4, '0');

          const newTrade = {
            id: tradeId,
            sellerId: senderID,
            sellerAddress: player.wallet.address,
            sellerName: player.name || "Người bán",
            amount: amount,
            price: pricePerCoin,
            totalValue: amount * pricePerCoin,
            fee: tradeFee,
            status: "active",
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
          };

          global.tradingSystem.offers.push(newTrade);

          if (!player.wallet.pendingTrades) player.wallet.pendingTrades = [];
          player.wallet.pendingTrades.push(newTrade);

          saveData(miningData, marketData);

          return api.sendMessage(
            "✅ TẠO LỆNH BÁN THÀNH CÔNG ✅\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🆔 Mã giao dịch: ${tradeId}\n` +
            `💰 Số lượng: ${amount.toLocaleString()} LC\n` +
            `💵 Giá: ${pricePerCoin.toLocaleString()}$/LC\n` +
            `💸 Tổng giá trị: ${(amount * pricePerCoin).toLocaleString()}$\n` +
            `🧾 Phí giao dịch: ${tradeFee.toLocaleString()} LC\n\n` +
            `⏱️ Hết hạn sau: 24 giờ\n\n` +
            `📝 Lệnh đã được đăng lên sàn giao dịch!\n` +
            `💡 Người mua sẽ sử dụng .coin trade accept ${tradeId} để mua`,
            threadID, messageID
          );
        }

        if (tradeAction === "list") {
          const activeOffers = global.tradingSystem.offers.filter(offer =>
            offer.status === "active" && offer.expiresAt > Date.now()
          );

          if (activeOffers.length === 0) {
            return api.sendMessage(
              "📋 DANH SÁCH GIAO DỊCH 📋\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "Hiện không có lệnh giao dịch nào đang hoạt động!\n\n" +
              "💡 Tạo lệnh bán mới: .coin trade create [số lượng] [giá/LC]",
              threadID, messageID
            );
          }

          activeOffers.sort((a, b) => a.price - b.price);

          let listMessage = "📋 DANH SÁCH GIAO DỊCH 📋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n";

          activeOffers.forEach((offer, index) => {
            const timeLeft = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / (60 * 60 * 1000)));

            listMessage += `${index + 1}. ID: ${offer.id} | ${offer.sellerName}\n` +
              `💰 Số lượng: ${offer.amount.toLocaleString()} LC\n` +
              `💵 Giá: ${offer.price.toLocaleString()}$/LC\n` +
              `💸 Tổng: ${offer.totalValue.toLocaleString()}$\n` +
              `⏱️ Còn: ${timeLeft} giờ\n\n`;
          });

          listMessage += "👉 Mua: .coin trade accept [ID giao dịch]\n" +
            "👉 Chi tiết: .coin trade info [ID giao dịch]";

          return api.sendMessage(listMessage, threadID, messageID);
        }

        if (tradeAction === "info") {
          const tradeId = target[2];

          if (!tradeId) {
            return api.sendMessage("❌ Vui lòng cung cấp ID giao dịch!", threadID, messageID);
          }

          const trade = global.tradingSystem.offers.find(o => o.id === tradeId);

          if (!trade) {
            return api.sendMessage("❌ Không tìm thấy giao dịch với ID này!", threadID, messageID);
          }

          const timeLeft = Math.max(0, Math.floor((trade.expiresAt - Date.now()) / (60 * 60 * 1000)));
          const marketComparison = trade.price > marketData.price ?
            `⚠️ Cao hơn thị trường ${((trade.price / marketData.price - 1) * 100).toFixed(1)}%` :
            `✅ Thấp hơn thị trường ${((1 - trade.price / marketData.price) * 100).toFixed(1)}%`;

          return api.sendMessage(
            "📊 CHI TIẾT GIAO DỊCH 📊\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🆔 Mã giao dịch: ${trade.id}\n` +
            `👤 Người bán: ${trade.sellerName}\n` +
            `📇 Địa chỉ ví: ${trade.sellerAddress.substring(0, 10)}...${trade.sellerAddress.substring(trade.sellerAddress.length - 6)}\n\n` +

            `💰 THÔNG TIN GIAO DỊCH:\n` +
            `• Số lượng: ${trade.amount.toLocaleString()} LC\n` +
            `• Đơn giá: ${trade.price.toLocaleString()}$/LC\n` +
            `• Tổng giá trị: ${trade.totalValue.toLocaleString()}$\n` +
            `• So với thị trường: ${marketComparison}\n\n` +

            `⏱️ THỜI GIAN:\n` +
            `• Tạo lúc: ${new Date(trade.createdAt).toLocaleString()}\n` +
            `• Còn lại: ${timeLeft} giờ\n` +
            `• Trạng thái: ${trade.status === "active" ? "✅ Đang hoạt động" : "❌ Đã kết thúc"}\n\n` +

            `💡 THAO TÁC:\n` +
            `• Mua: .coin trade accept ${trade.id}\n` +
            `• Hủy: .coin trade cancel ${trade.id} (chỉ người tạo)`,
            threadID, messageID
          );
        }

        if (tradeAction === "accept") {
          const tradeId = target[2];

          if (!tradeId) {
            return api.sendMessage("❌ Vui lòng cung cấp ID giao dịch!", threadID, messageID);
          }

          const trade = global.tradingSystem.offers.find(o => o.id === tradeId && o.status === "active");

          if (!trade) {
            return api.sendMessage("❌ Không tìm thấy giao dịch hoạt động với ID này!", threadID, messageID);
          }

          if (trade.sellerId === senderID) {
            return api.sendMessage("❌ Bạn không thể mua lệnh do chính mình tạo ra!", threadID, messageID);
          }

          if (trade.expiresAt < Date.now()) {
            return api.sendMessage("❌ Giao dịch này đã hết hạn!", threadID, messageID);
          }

          const userBalance = await getBalance(senderID);

          if (userBalance < trade.totalValue) {
            return api.sendMessage(
              "❌ Bạn không có đủ tiền để chấp nhận giao dịch này!\n\n" +
              `💵 Số dư: ${userBalance.toLocaleString()}$\n` +
              `💸 Cần: ${trade.totalValue.toLocaleString()}$`,
              threadID, messageID
            );
          }

          await updateBalance(senderID, -trade.totalValue);

          await updateBalance(trade.sellerId, trade.totalValue);

          player.coins += trade.amount;

          trade.status = "completed";
          trade.buyerId = senderID;
          trade.buyerName = player.name || "Người mua";
          trade.completedAt = Date.now();

          global.tradingSystem.history.push(trade);

          const seller = miningData[trade.sellerId];
          if (seller && seller.wallet) {
            if (seller.wallet.pendingTrades) {
              const pendingIndex = seller.wallet.pendingTrades.findIndex(t => t.id === trade.id);
              if (pendingIndex !== -1) {
                seller.wallet.pendingTrades.splice(pendingIndex, 1);
              }
            }

            if (!seller.wallet.tradeHistory) seller.wallet.tradeHistory = [];
            seller.wallet.tradeHistory.push({
              ...trade,
              type: "sell"
            });
          }

          if (!player.wallet.tradeHistory) player.wallet.tradeHistory = [];
          player.wallet.tradeHistory.push({
            ...trade,
            type: "buy"
          });

          marketData.history.push({
            price: trade.price,
            timestamp: Date.now(),
            volume: trade.amount,
            type: "p2p_trade"
          });

          CONFIG.market.tradingVolume.totalVolume += trade.amount;

          saveData(miningData, marketData);

          api.sendMessage(
            "💰 LỆNH GIAO DỊCH ĐÃ ĐƯỢC MUA 💰\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🆔 Mã giao dịch: ${trade.id}\n` +
            `👤 Người mua: ${trade.buyerName}\n` +
            `💰 Số lượng: ${trade.amount.toLocaleString()} LC\n` +
            `💵 Đơn giá: ${trade.price.toLocaleString()}$/LC\n` +
            `💸 Tổng thu: ${trade.totalValue.toLocaleString()}$\n\n` +
            `✅ Tiền đã được chuyển vào tài khoản của bạn!`,
            trade.sellerId
          );

          return api.sendMessage(
            "✅ GIAO DỊCH THÀNH CÔNG ✅\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🆔 Mã giao dịch: ${trade.id}\n` +
            `👤 Người bán: ${trade.sellerName}\n` +
            `💰 Đã mua: ${trade.amount.toLocaleString()} LC\n` +
            `💵 Đơn giá: ${trade.price.toLocaleString()}$/LC\n` +
            `💸 Tổng chi: ${trade.totalValue.toLocaleString()}$\n\n` +
            `✅ Coin đã được chuyển vào ví của bạn!\n` +
            `📊 Giao dịch này có thể ảnh hưởng đến giá thị trường.`,
            threadID, messageID
          );
        }

        if (tradeAction === "cancel") {
          const tradeId = target[2];

          if (!tradeId) {
            return api.sendMessage("❌ Vui lòng cung cấp ID giao dịch!", threadID, messageID);
          }

          const tradeIndex = global.tradingSystem.offers.findIndex(o =>
            o.id === tradeId && o.status === "active" && o.sellerId === senderID
          );

          if (tradeIndex === -1) {
            return api.sendMessage(
              "❌ Không thể hủy giao dịch!\n\n" +
              "Lý do có thể là:\n" +
              "• Không tìm thấy giao dịch\n" +
              "• Giao dịch không còn hoạt động\n" +
              "• Bạn không phải người tạo giao dịch này",
              threadID, messageID
            );
          }

          const trade = global.tradingSystem.offers[tradeIndex];

          trade.status = "cancelled";
          trade.cancelledAt = Date.now();

          player.coins += trade.amount;

          if (!player.wallet.tradeHistory) player.wallet.tradeHistory = [];
          player.wallet.tradeHistory.push({
            ...trade,
            type: "cancelled"
          });

          if (player.wallet.pendingTrades) {
            const pendingIndex = player.wallet.pendingTrades.findIndex(t => t.id === trade.id);
            if (pendingIndex !== -1) {
              player.wallet.pendingTrades.splice(pendingIndex, 1);
            }
          }

          saveData(miningData, marketData);

          return api.sendMessage(
            "🚫 ĐÃ HỦY GIAO DỊCH 🚫\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `🆔 Mã giao dịch: ${trade.id}\n` +
            `💰 Hoàn trả: ${trade.amount.toLocaleString()} LC\n` +
            `🧾 Phí giao dịch: ${trade.fee.toLocaleString()} LC (không hoàn lại)\n\n` +
            `✅ Lệnh đã được hủy khỏi sàn giao dịch!`,
            threadID, messageID
          );
        }

        break;
      }
      case "quest":
        const quest = player.quests.daily;
        const questName = {
          mine: "Đào coin",
          upgrade: "Nâng cấp máy",
          market: "Giao dịch thị trường",
        }[quest.type];

        const questCompleted = quest.progress >= quest.target;
        if (questCompleted && !quest.claimed) {
          const reward = CONFIG.dailyQuests.rewards[quest.type];
          await updateBalance(senderID, reward);
          quest.claimed = true;

          api.sendMessage(
            "🎉 HOÀN THÀNH NHIỆM VỤ 🎉\n" +
            `💰 Phần thưởng: ${reward} $\n` +
            "📝 Nhiệm vụ mới sẽ reset vào ngày mai!",
            threadID,
            messageID
          );
        } else {
          api.sendMessage(
            "📋 NHIỆM VỤ HÀNG NGÀY 📋\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📌 Nhiệm vụ: ${questName}\n` +
            `📊 Tiến độ: ${quest.progress}/${quest.target}\n` +
            `💰 Phần thưởng: ${CONFIG.dailyQuests.rewards[quest.type]} $\n` +
            (questCompleted ? "✅ Đã hoàn thành!" : "⏳ Đang thực hiện..."),
            threadID,
            messageID
          );
        }
        break;

      case "supply": {
        const totalMined = CONFIG.coinLimit.currentSupply;
        const totalMaximum = CONFIG.coinLimit.maxSupply;
        const totalHeld = Object.values(miningData).reduce((total, p) => total + p.coins, 0);
        const circulatingSupply = Math.max(0, totalMined - totalHeld);

        const supplyPercentage = (totalMined / totalMaximum) * 100;

        const blockMinedPerDay = 86400 / (CONFIG.blockReward.targetBlockTime / 1000);
        const blocksLeft = CONFIG.blockReward.blockHeight % 210000;
        const blocksUntilHalving = 210000 - blocksLeft;
        const estimatedDaysToHalving = Math.ceil(blocksUntilHalving / blockMinedPerDay);

        const currentEpochData = CONFIG.epochs.list[CONFIG.epochs.currentEpoch];

        const barLength = 16;
        const filledBlocks = Math.floor((supplyPercentage / 100) * barLength);
        const supplyBar = "█".repeat(filledBlocks) + "░".repeat(barLength - filledBlocks);

        let supplyMessage = "💎 THÔNG TIN NGUỒN CUNG LCOIN 💎\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "📊 TÌNH TRẠNG NGUỒN CUNG:\n" +
          `[${supplyBar}] ${supplyPercentage.toFixed(2)}%\n\n` +

          "💰 THỐNG KÊ CHUNG:\n" +
          `• Tổng cung tối đa: ${totalMaximum.toLocaleString()} LCoin\n` +
          `• Đã đào được: ${totalMined.toLocaleString()} LCoin (${supplyPercentage.toFixed(2)}%)\n` +
          `• Còn lại: ${(totalMaximum - totalMined).toLocaleString()} LCoin\n\n` +

          "🔄 LƯU THÔNG:\n" +
          `• Đang lưu thông: ${circulatingSupply.toLocaleString()} LCoin (${(circulatingSupply / totalMined * 100).toFixed(2)}%)\n` +
          `• Đang được giữ: ${totalHeld.toLocaleString()} LCoin (${(totalHeld / totalMined * 100).toFixed(2)}%)\n` +
          `• Phân bố: ${Object.keys(miningData).length} người chơi\n\n` +

          "⛓️ BLOCKCHAIN:\n" +
          `• Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
          `• Phần thưởng: ${CONFIG.blockReward.current} LCoin/block\n` +
          `• Block đến halving: ${blocksUntilHalving.toLocaleString()} (≈${estimatedDaysToHalving} ngày)\n\n` +

          "⏳ KỶ NGUYÊN HIỆN TẠI:\n" +
          `• ${currentEpochData.name}: ${currentEpochData.description}\n` +
          `• Hệ số phần thưởng: x${currentEpochData.rewardMultiplier}\n` +
          `• Hệ số độ khó: x${currentEpochData.difficultyMultiplier}\n\n` +

          "💡 Giá trị coin sẽ tăng khi nguồn cung giảm và nhu cầu tăng!";

        api.sendMessage(supplyMessage, threadID, messageID);
        break;
      }
      case "autosell":
        if (!target[1]) {
          return api.sendMessage(
            "⚙️ CÀI ĐẶT TỰ ĐỘNG BÁN COIN ⚙️\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `Trạng thái hiện tại: ${player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"
            }\n\n` +
            "Sử dụng:\n" +
            "• .coin autosell on - Bật tự động bán\n" +
            "• .coin autosell off - Tắt tự động bán\n\n" +
            "💡 Khi bật chế độ này, coin sẽ tự động được bán ngay sau khi đào thành công với giá thị trường hiện tại.",
            threadID,
            messageID
          );
        }

        const settingValue = target[1].toLowerCase();
        if (settingValue !== "on" && settingValue !== "off") {
          return api.sendMessage(
            "❌ Vui lòng chọn 'on' hoặc 'off'!",
            threadID,
            messageID
          );
        }

        player.settings = player.settings || {};
        player.settings.autoSell = settingValue === "on";

        api.sendMessage(
          `✅ Đã ${player.settings.autoSell ? "BẬT" : "TẮT"
          } chế độ tự động bán coin!\n\n` +
          (player.settings.autoSell
            ? "Giờ đây coin sẽ tự động được bán sau mỗi lần đào thành công."
            : "Coin sẽ được lưu trữ sau mỗi lần đào.") +
          `\n\n💎 Giá coin hiện tại: ${marketData.price} $`,
          threadID,
          messageID
        );
        break;

      default:
        api.sendMessage("❌ Lệnh không hợp lệ!", threadID, messageID);
        break;
    }
    saveData(miningData, marketData);

    updateCirculationNPC(miningData, marketData, api, threadID);
  },
};
