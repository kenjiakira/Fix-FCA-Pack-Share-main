const fs = require("fs");
const path = require("path");
const { getBalance, updateBalance } = require("../utils/currencies");
const axios = require("axios");
const { createCanvas } = require("canvas");
const { Chart } = require("chart.js/auto");
const { registerables } = require("chart.js");

Chart.register(...registerables);

const HALVING_INTERVAL = 2100000; 
const HALVING_EVENTS = [];
const MINING_DATA_FILE = path.join(__dirname, "./json/mining_data.json");
const MARKET_DATA_FILE = path.join(__dirname, "./json/market_data.json");

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
  npcMiners: {
    enabled: true,
    count: 5,
    basePower: 500,
    growthRate: 0.01,
    lastUpdated: Date.now(),
  },

  coinLimit: {
    maxSupply: 10000000, 
    currentSupply: 0,
    difficultyIncrease: 0.05, 
    rewardReduction: 0.1,
    monopolyThreshold: 0.3, 
    dailyTradeLimit: {
      buy: 1000000, 
      sell: 1000000, 
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
    maxEnergy: 100,
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
    current: 50,
    lastBlockTime: Date.now(),
    targetBlockTime: 10 * 60 * 1000,
    difficulty: 1,
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
    basePrice: 80,
    volatility: 0.15,
    updateInterval: 10 * 1000,
    maxPrice: 100000,
    minPrice: 1,
    crashChance: 0.1,
    minedCoinValue: {
      multiplier: 2.5,
      duration: 24 * 60 * 60 * 1000,
    },
    currentPrice: 80,
    scarcityEffect: {
      threshold: 0.8,
      baseMultiplier: 1.5,
      maxMultiplier: 10,
      exponentialGrowth: 2,
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

function initializeData() {
    let miningData = {};
    let marketData = {
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
  };
}
function updatePlayerEnergy(player) {
    if (player.energy >= CONFIG.energySystem.maxEnergy) {
      player.energy = CONFIG.energySystem.maxEnergy;
      return player;
    }
  
    const now = Date.now();
    const timePassed = now - (player.lastEnergyUpdate || now);
    
    let recoveryRate = CONFIG.energySystem.recoveryRate;
    
    const generatorLevel = player.powerSystem?.generatorLevel || 0;
    const generatorBonus = CONFIG.powerGrid.generator.levels[generatorLevel].production;
    recoveryRate *= generatorBonus;
    
    const currentHour = new Date().getHours();
    const isPeakHour = CONFIG.powerGrid.generator.peakHours.includes(currentHour);
    if (!isPeakHour) {
  
      recoveryRate *= CONFIG.powerGrid.generator.offPeakBonus;
    }
    
    const efficiencyBonus = 1 + (player.upgrades.efficiency * 0.05);
    recoveryRate *= efficiencyBonus;
    
    if (player.settings?.inPool) {
      recoveryRate *= 1.1; 
    }
    
    const energyRecovered = Math.floor(
      (timePassed / CONFIG.energySystem.recoveryInterval) * recoveryRate
    );
  
    if (energyRecovered > 0) {
      player.energy = Math.min(CONFIG.energySystem.maxEnergy, player.energy + energyRecovered);
      player.lastEnergyUpdate = now;
    }
  
    return player;
  }

function calculatePlayerHashrate(player) {
  return (
    (1 + player.upgrades.power * 0.2) *
    (1 + player.upgrades.efficiency * 0.1) *
    CONFIG.baseMiner.power *
    100
  );
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
      `[BLOCK] Player ${player.name || "Unknown"} đào được block #${
        CONFIG.blockReward.blockHeight
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

  let npcPower = CONFIG.npcMiners.basePower;

  if (CONFIG.npcMiners.enabled) {
    const daysSinceStart =
      (Date.now() - CONFIG.npcMiners.lastUpdated) / (24 * 60 * 60 * 1000);
    npcPower *= Math.pow(1 + CONFIG.npcMiners.growthRate, daysSinceStart);
    npcPower *= CONFIG.npcMiners.count;
  }

  const playersPower = Object.values(miningData).reduce((total, player) => {
    const playerHashrate = calculatePlayerHashrate(player);
    return total + playerHashrate;
  }, 0);

  const totalPower = npcPower + playersPower;
  return totalPower;
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

function checkMonopolyAndCrisis(miningData) {
  const totalVolume =
    CONFIG.market.tradingVolume.buy + CONFIG.market.tradingVolume.sell;
  const totalCirculatingSupply = Object.values(miningData).reduce(
    (total, data) => total + data.coins,
    0
  );

  if (
    totalVolume > CONFIG.market.volumeImpact.threshold &&
    totalCirculatingSupply > 1000000
  ) {
    if (!CONFIG.coinLimit.crisis.isActive) {
      CONFIG.coinLimit.crisis.isActive = true;
      return {
        isNewCrisis: true,
        message: `⚠️ CẢNH BÁO THỊ TRƯỜNG!\n\nPhát hiện khối lượng giao dịch lớn: ${totalVolume.toLocaleString()} LCoin\nVượt ngưỡng an toàn (${CONFIG.market.volumeImpact.threshold.toLocaleString()} LCoin)\nThị trường có thể biến động mạnh!\n\n💰 Tổng coin lưu thông: ${totalCirculatingSupply.toLocaleString()} LCoin`,
        whaleId: null,
      };
    }
  } else if (CONFIG.coinLimit.crisis.isActive) {
    CONFIG.coinLimit.crisis.isActive = false;
    return {
      isNewCrisis: false,
      message:
        "🎉 THỊ TRƯỜNG ĐÃ ỔN ĐỊNH!\n\nKhối lượng giao dịch đã giảm xuống mức an toàn.\nGiá sẽ dần hồi phục!",
      whaleId: null,
    };
  }

  return { isNewCrisis: false, message: null, whaleId: null };
}

function calculateScarcityMultiplier() {
  const supplyRatio =
    CONFIG.coinLimit.currentSupply / CONFIG.coinLimit.maxSupply;
  if (supplyRatio < CONFIG.market.scarcityEffect.threshold) {
    return 1;
  }

  const scarcityRatio =
    (supplyRatio - CONFIG.market.scarcityEffect.threshold) /
    (1 - CONFIG.market.scarcityEffect.threshold);

  const multiplier =
    CONFIG.market.scarcityEffect.baseMultiplier +
    Math.pow(scarcityRatio, CONFIG.market.scarcityEffect.exponentialGrowth) *
      (CONFIG.market.scarcityEffect.maxMultiplier -
        CONFIG.market.scarcityEffect.baseMultiplier);

  return Math.min(CONFIG.market.scarcityEffect.maxMultiplier, multiplier);
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
function updateMarketPrice(marketData) {
  const timePassed = Date.now() - marketData.lastUpdate;
  if (timePassed >= CONFIG.market.updateInterval) {
    const daysPassed = Math.floor(
      (Date.now() - CONFIG.market.tradingVolume.lastReset) /
        (24 * 60 * 60 * 1000)
    );
    if (daysPassed >= 1) {
      CONFIG.market.tradingVolume.buy = 0;
      CONFIG.market.tradingVolume.sell = 0;
      CONFIG.market.tradingVolume.lastReset = Date.now();
    }

    let change = (Math.random() - 0.5) * 2 * CONFIG.market.volatility;

    if (Math.random() < CONFIG.market.crashChance) {
      change = -Math.random() * 0.3;
    }
    const scarcityMultiplier = calculateScarcityMultiplier();
    let scarcityEffect = 0;
    if (scarcityMultiplier > 1) {
      scarcityEffect = (scarcityMultiplier - 1) * 0.01;
    }

    const { threshold, buyPressure, sellPressure, maxImpact } =
      CONFIG.market.volumeImpact;
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

function calculateMiningReward(player, isCritical = false) {
  const basePower = CONFIG.baseMiner.power;
  const powerMultiplier = 1 + player.upgrades.power * 0.2;
  const efficiencyMultiplier = 1 + player.upgrades.efficiency * 0.15;
  const rewardMultiplier = calculateRewardMultiplier();

  const halvingCount = Math.floor(
    CONFIG.coinLimit.currentSupply / HALVING_INTERVAL
  );
  const halvingMultiplier = Math.pow(0.5, halvingCount);
  let baseReward = Math.round(
    basePower *
      powerMultiplier *
      efficiencyMultiplier *
      150 *
      rewardMultiplier *
      halvingMultiplier
  );
  const luckFactor = 0.5 + Math.random() * 1.5;

  if (isCritical) {
    baseReward *= CONFIG.miningSuccess.criticalMultiplier * 1.5;
  }

  const randomBonus = 1 + Math.random() * 0.05;

  const finalReward = Math.round(baseReward * luckFactor * randomBonus);

  const availableSupply =
    CONFIG.coinLimit.maxSupply - CONFIG.coinLimit.currentSupply;
  if (availableSupply <= 0) return 0;

  return Math.min(Math.max(100, Math.min(5000, finalReward)), availableSupply);
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
              `${formatPrice(prices[prices.length - 1])} ${
                priceChange >= 0 ? "▲" : "▼"
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
                  `MACD: ${macdInfo?.macd?.toFixed(4) || "N/A"} (${
                    macdInfo?.signal?.toFixed(4) || "N/A"
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

    if (!miningData[senderID]) {
      miningData[senderID] = initializePlayer(senderID);
    }

    const player = miningData[senderID];
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

    marketData = updateMarketPrice(marketData);
    miningData[senderID] = checkAndUpdateQuests(player);

    if (!target[0]) {
      return api.sendMessage(
        "🎮 COIN MINING GAME 🎮\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "📌 Lệnh có sẵn:\n" +
          "1. mine - Đào coin\n" +
          "2. info - Thông tin máy đào\n" +
          "3. upgrade - Nâng cấp máy đào\n" +
          "4. market - Xem thị trường\n" +
          "5. sell [amount] - Bán coin\n" +
          "6. buy [amount] - Mua coin\n" +
          "7. quest - Nhiệm vụ hàng ngày\n" +
          "8. autosell [on/off] - Tự động bán coin\n\n" +
          "9. pool - Tham gia hoặc rời khỏi mining pool\n" +
          "10. halving - Xem thông tin halving\n" +
          "11. energy - Xem thông tin năng lượng\n" +
          `💰 Số coin đã đào: ${player.stats.totalMined}\n` +
          `💎 Giá coin hiện tại: ${marketData.price} $`,
        threadID,
        messageID
      );
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

      case "info":
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
            `🎯 Tăng tỷ lệ critical: ${
              player.minerLevel.bonuses.criticalChance * 100
            }%\n` +
            `💰 Tăng phần thưởng: ${
              player.minerLevel.bonuses.rewardBonus * 100
            }%\n\n`
          : "";

        const resourcesInfo = player.resources
          ? "💎 TÀI NGUYÊN QUÝ HIẾM:\n" +
            Object.entries(player.resources)
              .map(([id, count]) => {
                const resource = CONFIG.rareResources.types.find(
                  (r) => r.id === id
                );
                return `${resource.name}: ${count} (Giá trị: ${
                  resource.value * count
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

        const estimatedValue = Math.round(player.coins * marketData.price);
        const playerHashrate = calculatePlayerHashrate(player);
        api.sendMessage(
          "🌟 THÔNG TIN MÁY ĐÀO LCOIN 🌟\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "⚙️ THÔNG SỐ MÁY ĐÀO:\n" +
            `⚡ Công suất: ${power}% (Cấp ${player.upgrades.power}/10)\n` +
            `📊 Hiệu suất: ${efficiency}% (Cấp ${player.upgrades.efficiency}/10)\n` +
            `❄️ Làm mát: ${cooling}% (Cấp ${player.upgrades.cooling}/10)\n` +
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
            `🔄 Tự động bán: ${
              player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"
            }\n` +
            `💎 Giá LCoin hiện tại: ${marketData.price}$\n\n` +
            "💡 Mẹo: Nâng cấp đồng bộ các chỉ số sẽ mang lại hiệu quả tốt nhất!",
          threadID,
          messageID
        );
        break;

      case "upgrade":
        if (!target[1]) {
          return api.sendMessage(
            "⚙️ NÂNG CẤP MÁY ĐÀO ⚙️\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "📌 Các loại nâng cấp:\n" +
              `1. power - Tăng sức mạnh (${
                CONFIG.upgradeCosts.power[player.upgrades.power] || "Đã tối đa"
              } $)\n` +
              `2. efficiency - Tăng hiệu suất (${
                CONFIG.upgradeCosts.efficiency[player.upgrades.efficiency] ||
                "Đã tối đa"
              } $)\n` +
              `3. cooling - Tăng làm mát (${
                CONFIG.upgradeCosts.cooling[player.upgrades.cooling] ||
                "Đã tối đa"
              } $)\n\n` +
              "Cấp độ hiện tại:\n" +
              `⚡ Power: ${player.upgrades.power}/10\n` +
              `📊 Efficiency: ${player.upgrades.efficiency}/10\n` +
              `❄️ Cooling: ${player.upgrades.cooling}/10\n\n` +
              "💎 Thông tin nâng cấp:\n" +
              "• Power: +20% sức mạnh đào/cấp\n" +
              "• Efficiency: +15% hiệu suất/cấp\n" +
              "• Cooling: +10% làm mát/cấp\n\n" +
              "Sử dụng: .coin upgrade [loại]",
            threadID,
            messageID
          );
        }

        const upgradeType = target[1].toLowerCase();
        const validTypes = ["power", "efficiency", "cooling"];

        if (!validTypes.includes(upgradeType)) {
          return api.sendMessage(
            "❌ Loại nâng cấp không hợp lệ!",
            threadID,
            messageID
          );
        }

        const currentLevel = player.upgrades[upgradeType];
        const upgradeCost = CONFIG.upgradeCosts[upgradeType][currentLevel];

        if (!upgradeCost) {
          return api.sendMessage(
            "❌ Đã đạt cấp độ tối đa!\n" +
              `📊 ${
                upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)
              }: ${currentLevel}/10`,
            threadID,
            messageID
          );
        }

        const playerBalance = await getBalance(senderID);
        if (playerBalance < upgradeCost) {
          return api.sendMessage(
            `❌ Không đủ tiền để nâng cấp!\n` +
              `💰 Số dư: ${playerBalance} $\n` +
              `💵 Cần thêm: ${upgradeCost - playerBalance} $`,
            threadID,
            messageID
          );
        }

        await updateBalance(senderID, -upgradeCost);
        player.upgrades[upgradeType]++;

        if (player.quests.daily.type === "upgrade") {
          player.quests.daily.progress++;
        }

        const upgradeEffects = {
          power: "⚡ Tăng sức mạnh đào +20%",
          efficiency: "📊 Tăng hiệu suất +15%",
          cooling: "❄️ Tăng khả năng làm mát +10%",
        };

        api.sendMessage(
          "🔨 Nâng cấp thành công!\n" +
            `📈 ${
              upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)
            }: ${currentLevel} → ${currentLevel + 1}\n` +
            `${upgradeEffects[upgradeType]}\n` +
            `💰 Số dư còn lại: ${(
              await getBalance(senderID)
            ).toLocaleString()} $`,
          threadID,
          messageID
        );
        break;
      case "halving":
      case "halvings":
        if (HALVING_EVENTS.length === 0) {
          return api.sendMessage(
            "📊 LỊCH SỬ HALVING 📊\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "Chưa có sự kiện halving nào xảy ra.\n" +
              `⛓️ Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
              `💰 Phần thưởng hiện tại: ${CONFIG.blockReward.current} LCoin\n` +
              `⏳ Block đến halving tiếp theo: ${
                210000 - (CONFIG.blockReward.blockHeight % 210000)
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
          `⏳ Block đến halving tiếp theo: ${
            210000 - (CONFIG.blockReward.blockHeight % 210000)
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
              `👥 Thành viên: ${
                Object.values(miningData).filter((p) => p.settings?.inPool)
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
            : "1h";

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
          "📊 THỊ TRƯỜNG COIN 📊\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          `💎 Giá hiện tại: ${marketData.price} $ ${trend}\n` +
          `📈 Thay đổi: ${priceChange}% (${sentiment})\n` +
          `🔺 Cao nhất: ${highPrice} $\n` +
          `🔻 Thấp nhất: ${lowPrice} $\n\n` +
          "📊 THÔNG TIN BLOCKCHAIN:\n" +
          `🧊 Block hiện tại: #${CONFIG.blockReward.blockHeight}\n` +
          (CONFIG.blockReward.blockHeight > 0
            ? `⏱️ Block gần nhất: ${
                timeSinceLastBlock < 60
                  ? `${Math.round(timeSinceLastBlock)}s trước`
                  : timeSinceLastBlock < 3600
                  ? `${Math.round(timeSinceLastBlock / 60)}m trước`
                  : `${Math.round(timeSinceLastBlock / 3600)}h trước`
              }\n`
            : `⏱️ Trạng thái: Chưa có block nào được đào\n`) +
          `💰 Phần thưởng hiện tại: ${CONFIG.blockReward.current} LCoin\n` +
          `🔥 Độ khó: ${CONFIG.blockReward.difficulty.toFixed(2)}\n` +
          `⛓️ Block đến halving: ${blocksUntilHalving.toLocaleString()} (~${estimatedDaysToHalving} ngày)\n` +
          `⛏️ Tổng hashrate mạng: ${formatNumber(
            calculateTotalNetworkPower(miningData)
          )}\n` +
          `👥 Số người tham gia pool: ${
            Object.values(miningData).filter((p) => p.settings?.inPool).length
          }\n\n` +
          `💰 Tổng cung tối đa: ${CONFIG.coinLimit.maxSupply.toLocaleString()} LCoin\n` +
          `📈 Đã đào được: ${CONFIG.coinLimit.currentSupply.toLocaleString()} LCoin (${supplyRatio}%)\n` +
          `📉 Còn lại: ${availableSupply.toLocaleString()} LCoin\n` +
          `⚡ Độ khó đào: x${difficulty.toFixed(2)}\n` +
          `💎 Hệ số phần thưởng: x${rewardMultiplier.toFixed(2)}\n\n` +
          `💡 Nhận định: ${tradingTip}\n` +
          `⏰ Cập nhật sau: ${Math.ceil(
            (CONFIG.market.updateInterval -
              (Date.now() - marketData.lastUpdate)) /
              1000
          )}s\n\n` +
          "💼 Giao dịch:\n" +
          "• .coin sell [số lượng] - Bán coin\n" +
          "• .coin buy [số lượng] - Mua coin\n" +
          "• .coin chart [1h/6h/12h] - Xem biểu đồ khác";

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
          `↕️ Biến động: ${chartResult.priceChange >= 0 ? "+" : ""}${
            chartResult.priceChange
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

      case "sell":
        if (!target[1]) {
          return api.sendMessage(
            "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
              "💡 Cách sử dụng:\n" +
              "• .coin sell [số lượng] - Bán số lượng cụ thể\n" +
              "• .coin sell all - Bán tất cả\n" +
              "• .coin sell half - Bán một nửa\n\n" +
              `📊 Đã giao dịch hôm nay: ${player.trading.dailySell.toLocaleString()}/${CONFIG.coinLimit.dailyTradeLimit.sell.toLocaleString()} LCoin`,
            threadID,
            messageID
          );
        }

        let sellAmount;
        if (target[1].toLowerCase() === "all") {
          sellAmount = Math.min(
            player.coins,
            getRemainingTradeLimit(player, "sell")
          );
        } else if (target[1].toLowerCase() === "half") {
          sellAmount = Math.min(
            Math.floor(player.coins / 2),
            getRemainingTradeLimit(player, "sell")
          );
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

        const remainingSellLimit = getRemainingTradeLimit(player, "sell");
        if (sellAmount > remainingSellLimit) {
          return api.sendMessage(
            "❌ VƯỢT QUÁ GIỚI HẠN GIAO DỊCH NGÀY!\n\n" +
              `💰 Số coin muốn bán: ${sellAmount.toLocaleString()}\n` +
              `📊 Còn có thể bán: ${remainingSellLimit.toLocaleString()}\n` +
              "⏰ Giới hạn sẽ reset vào ngày mai!",
            threadID,
            messageID
          );
        }

        if (sellAmount > player.coins || player.coins < 0) {
          return api.sendMessage(
            "❌ Bạn không có đủ LCoin!\n\n" +
              `💎 Số LCoin hiện có: ${player.coins.toLocaleString()}\n` +
              `💰 Giá trị: ${Math.floor(
                player.coins * marketData.price
              ).toLocaleString()}$`,
            threadID,
            messageID
          );
        }

        const sellValue = calculateSellValue(
          player,
          sellAmount,
          marketData.price
        );
        const profitLoss =
          sellValue -
          (sellAmount * marketData.history[0]?.price || marketData.price);
        player.coins = Math.max(0, player.coins - sellAmount);
        player.trading.dailySell += sellAmount;
        CONFIG.market.tradingVolume.sell += sellAmount;
        CONFIG.market.tradingVolume.totalVolume += sellAmount;
        await updateBalance(senderID, sellValue);

        if (player.quests.daily.type === "market") {
          player.quests.daily.progress++;
        }

        // Kiểm tra tình trạng khủng hoảng sau khi bán
        const crisisCheck = checkMonopolyAndCrisis(miningData);
        if (crisisCheck.message) {
          api.sendMessage(crisisCheck.message, threadID);
        }

        // Thêm thông tin về giá trị đặc biệt trong tin nhắn
        const hasMinedCoins = player.minedCoins && player.minedCoins.length > 0;
        const minedCoinsMsg = hasMinedCoins
          ? `\n💎 Coin đào: +${(
              (CONFIG.market.minedCoinValue.multiplier - 1) *
              100
            ).toFixed(0)}% giá trị`
          : "";

        api.sendMessage(
          "💰 BÁN LCOIN THÀNH CÔNG 💰\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📤 Số lượng: ${sellAmount.toLocaleString()} LCoin\n` +
            `💵 Nhận được: ${sellValue.toLocaleString()}$${minedCoinsMsg}\n` +
            `${
              profitLoss >= 0 ? "📈" : "📉"
            } Lợi nhuận: ${profitLoss.toLocaleString()}$\n` +
            `💎 LCoin còn lại: ${player.coins.toLocaleString()}\n` +
            `📊 Đã bán hôm nay: ${player.trading.dailySell.toLocaleString()}/${CONFIG.coinLimit.dailyTradeLimit.sell.toLocaleString()}\n\n` +
            ` Giá thị trường: ${marketData.price}$`,
          threadID,
          messageID
        );
        break;
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
      case "buy":
        if (!target[1]) {
          return api.sendMessage(
            "❌ Vui lòng nhập số lượng hợp lệ!\n\n" +
              "💡 Cách sử dụng:\n" +
              "• .coin buy [số lượng] - Mua số lượng cụ thể\n" +
              "• .coin buy max - Mua tối đa có thể\n" +
              "• .coin buy half - Dùng một nửa số tiền để mua\n\n" +
              `📊 Đã giao dịch hôm nay: ${player.trading.dailyBuy.toLocaleString()}/${CONFIG.coinLimit.dailyTradeLimit.buy.toLocaleString()} LCoin`,
            threadID,
            messageID
          );
        }

        const userBalance = await getBalance(senderID);
        const availableSupplyForBuy =
          CONFIG.coinLimit.maxSupply - CONFIG.coinLimit.currentSupply;
        const remainingBuyLimit = getRemainingTradeLimit(player, "buy");

        if (availableSupplyForBuy <= 0) {
          return api.sendMessage(
            "❌ KHÔNG THỂ MUA COIN!\n\n" +
              "Lý do: Đã đạt giới hạn tổng cung\n" +
              `💎 Tổng cung tối đa: ${CONFIG.coinLimit.maxSupply.toLocaleString()} LCoin\n` +
              "💡 Hãy chờ người khác bán ra để có thể mua vào!",
            threadID,
            messageID
          );
        }

        if (remainingBuyLimit <= 0) {
          return api.sendMessage(
            "❌ ĐÃ ĐẠT GIỚI HẠN GIAO DỊCH NGÀY!\n\n" +
              `📊 Giới hạn mua: ${CONFIG.coinLimit.dailyTradeLimit.buy.toLocaleString()} LCoin/ngày\n` +
              "⏰ Vui lòng quay lại vào ngày mai!",
            threadID,
            messageID
          );
        }

        let buyAmount;
        let cost;

        if (target[1].toLowerCase() === "max") {
          buyAmount = Math.min(
            Math.floor(userBalance / marketData.price),
            availableSupplyForBuy,
            remainingBuyLimit
          );
          cost = Math.ceil(buyAmount * marketData.price);
        } else if (target[1].toLowerCase() === "half") {
          buyAmount = Math.min(
            Math.floor(userBalance / 2 / marketData.price),
            availableSupplyForBuy,
            remainingBuyLimit
          );
          cost = Math.ceil(buyAmount * marketData.price);
        } else {
          buyAmount = parseInt(target[1]);
          if (!buyAmount || buyAmount <= 0) {
            return api.sendMessage(
              "❌ Vui lòng nhập số lượng hợp lệ!",
              threadID,
              messageID
            );
          }
          if (buyAmount > remainingBuyLimit) {
            return api.sendMessage(
              "❌ VƯỢT QUÁ GIỚI HẠN GIAO DỊCH NGÀY!\n\n" +
                `💰 Số coin muốn mua: ${buyAmount.toLocaleString()}\n` +
                `📊 Còn có thể mua: ${remainingBuyLimit.toLocaleString()}\n` +
                "⏰ Giới hạn sẽ reset vào ngày mai!",
              threadID,
              messageID
            );
          }
          if (buyAmount > availableSupplyForBuy) {
            return api.sendMessage(
              "❌ KHÔNG ĐỦ COIN TRONG THỊ TRƯỜNG!\n\n" +
                `💎 Số coin còn lại: ${availableSupplyForBuy.toLocaleString()} LCoin\n` +
                `💰 Số coin bạn muốn mua: ${buyAmount.toLocaleString()} LCoin\n` +
                "💡 Hãy thử mua một số lượng nhỏ hơn!",
              threadID,
              messageID
            );
          }
          cost = Math.ceil(buyAmount * marketData.price);
        }

        if (cost > userBalance) {
          return api.sendMessage(
            "❌ Không đủ tiền để mua!\n\n" +
              `💵 Số dư: ${userBalance.toLocaleString()}$\n` +
              `💰 Cần thêm: ${(cost - userBalance).toLocaleString()}$\n` +
              `💎 Giá hiện tại: ${marketData.price}$/LCoin\n\n` +
              "💡 Gợi ý: Dùng '.coin buy max' để mua tối đa có thể!",
            threadID,
            messageID
          );
        }

        if (buyAmount <= 0) {
          return api.sendMessage(
            "❌ Không thể mua số lượng này!\n" +
              "Vui lòng thử lại với số lượng lớn hơn.",
            threadID,
            messageID
          );
        }

        await updateBalance(senderID, -cost);
        player.coins += buyAmount;
        player.trading.dailyBuy += buyAmount;
        CONFIG.market.tradingVolume.buy += buyAmount;
        CONFIG.market.tradingVolume.totalVolume += buyAmount;

        if (player.quests.daily.type === "market") {
          player.quests.daily.progress++;
        }

        const crisisCheckAfterBuy = checkMonopolyAndCrisis(miningData);
        if (crisisCheckAfterBuy.message) {
          api.sendMessage(crisisCheckAfterBuy.message, threadID);
        }

        const potentialValue = Math.round(buyAmount * (marketData.price * 1.1));
        api.sendMessage(
          "💰 MUA LCOIN THÀNH CÔNG 💰\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            `📥 Số lượng: ${buyAmount.toLocaleString()} LCoin\n` +
            `💵 Chi phí: ${cost.toLocaleString()}$\n` +
            `💎 LCoin hiện có: ${player.coins.toLocaleString()}\n` +
            `📊 Đã mua hôm nay: ${player.trading.dailyBuy.toLocaleString()}/${CONFIG.coinLimit.dailyTradeLimit.buy.toLocaleString()}\n` +
            `💰 Giá trung bình: ${(cost / buyAmount).toFixed(2)}$/LCoin\n\n` +
            `💡 Nếu giá tăng 10%, bạn sẽ lãi: ${(
              potentialValue - cost
            ).toLocaleString()}$`,
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

      case "autosell":
        if (!target[1]) {
          return api.sendMessage(
            "⚙️ CÀI ĐẶT TỰ ĐỘNG BÁN COIN ⚙️\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              `Trạng thái hiện tại: ${
                player.settings?.autoSell ? "Bật ✅" : "Tắt ❌"
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
          `✅ Đã ${
            player.settings.autoSell ? "BẬT" : "TẮT"
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
  },
};
