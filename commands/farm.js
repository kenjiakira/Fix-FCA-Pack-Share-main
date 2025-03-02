const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {
  getBalance,
  updateBalance,
  updateQuestProgress,
} = require("../utils/currencies");
const { createCanvas, loadImage } = require("canvas");

const farmDataPath = path.join(__dirname, "./json/farm_data.json");
const farmImagesDir = path.join(__dirname, "../cache/farm");

if (!fs.existsSync(path.dirname(farmDataPath))) {
  fs.mkdirSync(path.dirname(farmDataPath), { recursive: true });
}

if (!fs.existsSync(farmImagesDir)) {
  fs.mkdirSync(farmImagesDir, { recursive: true });
}

const CROPS = {
  lua: {
    name: "Lúa",
    emoji: "🌾",
    price: 50000,
    time: 40 * 60,
    yield: 80000,
    exp: 10,
    water: 3,
    level: 1,
    description: "Cây lúa nước truyền thống",
  },
  rau: {
    name: "Rau xanh",
    emoji: "🥬",
    price: 10000,
    time: 15 * 60,
    yield: 18000,
    exp: 5,
    water: 2,
    level: 1,
    description: "Các loại rau xanh: rau muống, rau cải...",
  },
  ca_rot: {
    name: "Cà rốt",
    emoji: "🥕",
    price: 15000,
    time: 20 * 60,
    yield: 25000,
    exp: 6,
    water: 2,
    level: 1,
    description: "Cà rốt nhiều vitamin A",
  },
  dau: {
    name: "Đậu",
    emoji: "🌱",
    price: 20000,
    time: 25 * 60,
    yield: 35000,
    exp: 7,
    water: 2,
    level: 2,
    description: "Các loại đậu: đậu xanh, đậu đen...",
  },
  ngo: {
    name: "Ngô (Bắp)",
    emoji: "🌽",
    price: 25000,
    time: 35 * 60,
    yield: 45000,
    exp: 8,
    water: 3,
    level: 3,
    description: "Ngô ngọt (bắp) đặc sản miền Trung",
  },
  ca_chua: {
    name: "Cà chua",
    emoji: "🍅",
    price: 30000,
    time: 40 * 60,
    yield: 55000,
    exp: 9,
    water: 3,
    level: 4,
    description: "Cà chua tươi ngọt",
  },
  khoai_tay: {
    name: "Khoai tây",
    emoji: "🥔",
    price: 35000,
    time: 45 * 60,
    yield: 65000,
    exp: 10,
    water: 3,
    level: 5,
    description: "Khoai tây Đà Lạt",
  },
  dua_hau: {
    name: "Dưa hấu",
    emoji: "🍉",
    price: 45000,
    time: 60 * 60,
    yield: 85000,
    exp: 13,
    water: 4,
    level: 6,
    description: "Dưa hấu miền Trung ngọt lịm",
  },
  thanh_long: {
    name: "Thanh Long",
    emoji: "🐉",
    price: 140000,
    time: 80 * 60,
    yield: 130000,
    exp: 15,
    water: 2,
    level: 8,
    description: "Thanh long ruột đỏ đặc sản Việt Nam",
  },
  khoai_lang: {
    name: "Khoai lang",
    emoji: "🍠",
    price: 40000,
    time: 50 * 60,
    yield: 70000,
    exp: 12,
    water: 2,
    level: 7,
    description: "Khoai lang vỏ tím ruột vàng",
  },
};

const ANIMALS = {
  ga: {
    name: "Gà",
    emoji: "🐓",
    price: 100000,
    productTime: 3 * 60 * 60,
    product: "trứng",
    productEmoji: "🥚",
    productPrice: 15000,
    feed: 5000,
    level: 3,
    description: "Gà ta chạy bộ, cho trứng chất lượng cao",
  },
  vit: {
    name: "Vịt",
    emoji: "🦆",
    price: 150000,
    productTime: 4 * 60 * 60,
    product: "trứng vịt",
    productEmoji: "🥚",
    productPrice: 20000,
    feed: 7000,
    level: 5,
    description: "Vịt thả đồng, đẻ trứng vịt dinh dưỡng",
  },
  heo: {
    name: "Heo",
    emoji: "🐷",
    price: 300000,
    productTime: 6 * 60 * 60,
    product: "thịt",
    productEmoji: "🥩",
    productPrice: 55000,
    feed: 15000,
    level: 8,
    description: "Heo đặc sản nuôi thả vườn",
  },
  bo: {
    name: "Bò",
    emoji: "🐄",
    price: 500000,
    productTime: 8 * 60 * 60,
    product: "sữa",
    productEmoji: "🥛",
    productPrice: 80000,
    feed: 22000,
    level: 10,
    description: "Bò sữa cho sữa tươi nguyên chất",
  },
  ca: {
    name: "Cá",
    emoji: "🐟",
    price: 80000,
    productTime: 2 * 60 * 60,
    product: "cá tươi",
    productEmoji: "🐠",
    productPrice: 22000,
    feed: 8000,
    level: 4,
    description: "Cá đồng nuôi trong ao",
  },
};

const SHOP_ITEMS = {
  phan_bon: {
    name: "Phân bón",
    emoji: "💩",
    price: 20000,
    description: "Giảm 20% thời gian trồng trọt",
    effect: "grow_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 1,
  },
  thuoc_sau: {
    name: "Thuốc sâu",
    emoji: "🧪",
    price: 30000,
    description: "Tăng 20% sản lượng thu hoạch",
    effect: "yield_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 3,
  },
  may_cay: {
    name: "Máy cày",
    emoji: "🚜",
    price: 200000,
    description: "Tự động gieo trồng vụ mới sau thu hoạch",
    effect: "auto_plant",
    duration: null,
    level: 6,
  },
  he_thong_tuoi: {
    name: "Hệ thống tưới",
    emoji: "💧",
    price: 150000,
    description: "Tự động tưới cây mỗi 4 giờ",
    effect: "auto_water",
    duration: null,
    level: 5,
  },
  chuong_trai: {
    name: "Chuồng trại nâng cấp",
    emoji: "🏡",
    price: 250000,
    description: "Tăng số lượng vật nuôi tối đa lên 10",
    effect: "animal_capacity",
    duration: null,
    level: 7,
  },
  thuc_an_gia_suc: {
    name: "Thức ăn gia súc",
    emoji: "🌾",
    price: 50000,
    description: "Tăng 30% sản lượng từ vật nuôi",
    effect: "animal_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 4,
  },
  giong_cao_cap: {
    name: "Giống cây cao cấp",
    emoji: "🌱",
    price: 100000,
    description: "Tăng 50% kinh nghiệm từ trồng trọt",
    effect: "exp_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 2,
  },
};

const LEVELS = [
  { level: 1, exp: 0, title: "Nông dân tập sự", reward: 50000, plotSize: 4 },
  { level: 2, exp: 100, title: "Nông dân cần mẫn", reward: 60000, plotSize: 6 },
  { level: 3, exp: 300, title: "Trồng trọt viên", reward: 80000, plotSize: 8 },
  {
    level: 4,
    exp: 600,
    title: "Nông dân kinh nghiệm",
    reward: 100000,
    plotSize: 9,
  },
  {
    level: 5,
    exp: 1000,
    title: "Người làm vườn",
    reward: 120000,
    plotSize: 12,
  },
  {
    level: 6,
    exp: 1500,
    title: "Chủ trang trại nhỏ",
    reward: 150000,
    plotSize: 16,
  },
  {
    level: 7,
    exp: 2500,
    title: "Nông dân chuyên nghiệp",
    reward: 200000,
    plotSize: 20,
  },
  {
    level: 8,
    exp: 4000,
    title: "Chủ trang trại",
    reward: 300000,
    plotSize: 25,
  },
  {
    level: 9,
    exp: 6000,
    title: "Nông gia thịnh vượng",
    reward: 400000,
    plotSize: 30,
  },
  {
    level: 10,
    exp: 10000,
    title: "Đại điền chủ",
    reward: 500000,
    plotSize: 36,
  },
];

const WEATHER_EFFECTS = {
  sunny: {
    name: "Nắng ráo",
    emoji: "☀️",
    cropBonus: 0.1,
    waterDrain: 0.2,
    description:
      "Ngày nắng đẹp, cây trồng phát triển tốt nhưng cần nhiều nước hơn",
  },
  rainy: {
    name: "Mưa",
    emoji: "🌧️",
    cropBonus: 0.05,
    waterFill: 0.5,
    description: "Trời mưa, tự động tưới cây nhưng năng suất thấp hơn",
  },
  cloudy: {
    name: "Âm u",
    emoji: "☁️",
    description: "Trời âm u, không có điều gì đặc biệt",
  },
  storm: {
    name: "Bão",
    emoji: "🌪️",
    cropDamage: 0.2,
    description: "Bão! Cây trồng có thể bị hỏng, hãy thu hoạch sớm!",
  },
  drought: {
    name: "Hạn hán",
    emoji: "🔥",
    waterDrain: 0.4,
    description: "Hạn hán, cây mất nước nhanh chóng",
  },
};

const EVENTS = {
  tet: {
    name: "Tết Nguyên Đán",
    startMonth: 1,
    duration: 15,
    crops: {
      hoa_dao: {
        name: "Hoa Đào",
        emoji: "🌸",
        price: 100000,
        time: 48 * 60 * 60,
        yield: 300000,
        exp: 30,
        water: 5,
        description: "Hoa đào đỏ thắm, biểu tượng của Tết miền Bắc",
      },
      hoa_mai: {
        name: "Hoa Mai",
        emoji: "🌼",
        price: 100000,
        time: 48 * 60 * 60,
        yield: 250000,
        exp: 30,
        water: 5,
        description: "Hoa mai vàng rực rỡ, biểu tượng của Tết miền Nam",
      },
    },
  },
  trungThu: {
    name: "Tết Trung Thu",
    startMonth: 8,
    duration: 10,
    crops: {
      banhDeo: {
        name: "Bánh Dẻo",
        emoji: "🥮",
        price: 50000,
        time: 24 * 60 * 60,
        yield: 150000,
        exp: 20,
        water: 0,
        description: "Bánh dẻo nhân thơm ngon truyền thống",
      },
      banhNuong: {
        name: "Bánh Nướng",
        emoji: "🥧",
        price: 60000,
        time: 24 * 60 * 60,
        yield: 180000,
        exp: 25,
        water: 0,
        description: "Bánh nướng nhân thập cẩm",
      },
    },
  },
};
const PROCESSING_RECIPES = {
  banh_mi: {
    name: "Bánh mì",
    emoji: "🥖",
    ingredients: { lúa: 3 },
    yield: 1,
    value: 100000,
    exp: 15,
    time: 15 * 60, // 15 phút
    level: 3,
    description: "Bánh mì mềm thơm từ lúa xay thành bột",
  },
  pho_mai: {
    name: "Phô mai",
    emoji: "🧀",
    ingredients: { sữa: 3 },
    yield: 1,
    value: 300000,
    exp: 20,
    time: 30 * 60, // 30 phút
    level: 5,
    description: "Phô mai được làm từ sữa bò tươi ngon",
  },
  trung_bac: {
    name: "Trứng bác",
    emoji: "🍳",
    ingredients: { trứng: 2, "trứng vịt": 1 },
    yield: 1,
    value: 60000,
    exp: 10,
    time: 10 * 60, // 10 phút
    level: 2,
    description: "Món trứng chiên thơm ngon bổ dưỡng",
  },
  xuc_xich: {
    name: "Xúc xích",
    emoji: "🌭",
    ingredients: { thịt: 2 },
    yield: 3,
    value: 150000,
    exp: 18,
    time: 20 * 60, // 20 phút
    level: 4,
    description: "Xúc xích thịt heo ngon tuyệt",
  },
  ca_kho: {
    name: "Cá kho",
    emoji: "🐟",
    ingredients: { "cá tươi": 3 },
    yield: 2,
    value: 70000,
    exp: 12,
    time: 15 * 60, // 15 phút
    level: 2,
    description: "Cá kho tộ đậm đà hương vị Việt Nam",
  },
  salad: {
    name: "Salad",
    emoji: "🥗",
    ingredients: { "rau xanh": 3, "cà rốt": 2 },
    yield: 3,
    value: 80000,
    exp: 15,
    time: 10 * 60, // 10 phút
    level: 3,
    description: "Salad rau củ tươi ngon bổ dưỡng",
  },
  thit_kho: {
    name: "Thịt kho",
    emoji: "🍲",
    ingredients: { thịt: 3, trứng: 2 },
    yield: 3,
    value: 200000,
    exp: 25,
    time: 30 * 60, // 30 phút
    level: 6,
    description: "Thịt kho tàu đậm đà, béo ngậy",
  },
  banh_ngot: {
    name: "Bánh ngọt",
    emoji: "🍰",
    ingredients: { trứng: 3, sữa: 2, lúa: 2 },
    yield: 2,
    value: 180000,
    exp: 20,
    time: 20 * 60, // 20 phút
    level: 7,
    description: "Bánh ngọt mềm mịn thơm ngon",
  },
};

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateLevel(exp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].exp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

function getCurrentWeather(userID) {
  if (!userID) {
    console.error("userID is undefined in getCurrentWeather");
    return WEATHER_EFFECTS.sunny;
  }

  try {
    const farmData = loadFarmData();
    if (!farmData || !farmData.farms) {
      console.error("Invalid farm data in getCurrentWeather");
      return WEATHER_EFFECTS.sunny;
    }

    const userFarm = farmData.farms[userID] || createUserFarm(userID);

    if (!userFarm.weather || Date.now() > userFarm.weather.nextChange) {
      const weatherTypes = Object.keys(WEATHER_EFFECTS);

      let weatherChances = [0.4, 0.4, 0.1, 0.05, 0.05];

      const date = new Date();
      const month = date.getMonth() + 1;

      if (month >= 5 && month <= 8) {
        // Mùa hè
        weatherChances = [0.5, 0.2, 0.1, 0.1, 0.1];
      } else if (month >= 9 && month <= 11) {
        weatherChances = [0.3, 0.4, 0.2, 0.05, 0.05];
      } else if (month == 12 || month <= 2) {
        weatherChances = [0.2, 0.3, 0.4, 0.05, 0.05];
      } else {
        weatherChances = [0.3, 0.4, 0.2, 0.1, 0];
      }

      let random = Math.random();
      let weatherIndex = 0;
      let sum = 0;

      for (let i = 0; i < weatherChances.length; i++) {
        sum += weatherChances[i];
        if (random < sum) {
          weatherIndex = i;
          break;
        }
      }

      userFarm.weather = {
        type: weatherTypes[weatherIndex],
        nextChange: Date.now() + 6 * 60 * 60 * 1000,
      };

      saveFarmData(farmData);
    }

    return WEATHER_EFFECTS[userFarm.weather.type] || WEATHER_EFFECTS.sunny;
  } catch (error) {
    console.error("Error in getCurrentWeather:", error);
    return WEATHER_EFFECTS.sunny;
  }
}

function checkEvent() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const [eventId, event] of Object.entries(EVENTS)) {
    if (month === event.startMonth && day <= event.duration) {
      return {
        id: eventId,
        ...event,
      };
    }

    if (eventId === "tet" && month === event.startMonth + 1 && day <= 15) {
      return {
        id: eventId,
        ...event,
      };
    }
  }

  return null;
}

function loadFarmData() {
  try {
    if (!fs.existsSync(farmDataPath)) {
      const defaultData = {
        farms: {},
        lastUpdate: Date.now(),
      };
      fs.writeFileSync(farmDataPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = JSON.parse(fs.readFileSync(farmDataPath, "utf8"));

    if (!data.farms) {
      data.farms = {};
    }

    return data;
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu farm:", error);
    return { farms: {}, lastUpdate: Date.now() };
  }
}

function saveFarmData(data) {
  try {
    fs.writeFileSync(farmDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu farm:", error);
  }
}

function createUserFarm(userID) {
  const farmData = loadFarmData();
  if (!farmData.farms[userID]) {
    farmData.farms[userID] = {
      id: userID,
      exp: 0,
      plots: [],
      inventory: {},
      animals: {},
      items: {},
      lastActive: Date.now(),
      createdAt: Date.now(),
      autoHarvest: false,
      weather: {
        type: "sunny",
        nextChange: Date.now() + 6 * 60 * 60 * 1000,
      },
    };

    for (let i = 0; i < 4; i++) {
      farmData.farms[userID].plots.push({
        id: i,
        status: "empty",
        crop: null,
        plantedAt: null,
        water: 0,
        lastWatered: null,
      });
    }

    saveFarmData(farmData);
  }

  return farmData.farms[userID];
}

function applyItemEffects(userFarm) {
  if (!userFarm) {
    console.error("userFarm is undefined in applyItemEffects");
    return {
      growBoost: 1,
      yieldBoost: 1,
      expBoost: 1,
      animalBoost: 1,
      autoPlant: false,
      autoWater: false,
      animalCapacity: 5,
    };
  }

  const effects = {
    growBoost: 1,
    yieldBoost: 1,
    expBoost: 1,
    animalBoost: 1,
    autoPlant: false,
    autoWater: false,
    animalCapacity: 5,
  };

  if (!userFarm.items) return effects;

  for (const [itemId, item] of Object.entries(userFarm.items || {})) {
    if (!item || !item.active || (item.expiry && Date.now() > item.expiry)) {
      continue;
    }

    switch (item.effect) {
      case "grow_boost":
        effects.growBoost = 0.8;
        break;
      case "yield_boost":
        effects.yieldBoost = 1.2;
        break;
      case "exp_boost":
        effects.expBoost = 1.5;
        break;
      case "animal_boost":
        effects.animalBoost = 1.3;
        break;
      case "auto_plant":
        effects.autoPlant = true;
        break;
      case "auto_water":
        effects.autoWater = true;
        break;
      case "animal_capacity":
        effects.animalCapacity = 10;
        break;
    }
  }

  try {
    const weather = getCurrentWeather(userFarm.id);
    if (weather && weather.cropBonus) {
      effects.yieldBoost *= 1 + weather.cropBonus;
    }
  } catch (err) {
    console.error("Error applying weather effects:", err);
  }

  return effects;
}

function updateFarms() {
  try {
    const farmData = loadFarmData();
    if (!farmData || !farmData.farms) {
      console.error("Invalid farm data structure");
      return;
    }

    const currentTime = Date.now();

    Object.entries(farmData.farms || {}).forEach(([userID, farm]) => {
      if (!farm) return;

      if (farm.animals) {
        Object.entries(farm.animals).forEach(([animalId, animal]) => {
          if (!animal) return;

          if (animal.lastProduced && animal.fed) {
            const animalType = animal.type;
            if (!animalType || !ANIMALS[animalType]) return;

            const animalConfig = ANIMALS[animalType];
            const productionTime = animalConfig.productTime * 1000;
            farm.id = userID;

            if (currentTime - animal.lastProduced >= productionTime) {
              if (!farm.inventory) {
                farm.inventory = {};
              }

              if (!farm.inventory[animalConfig.product]) {
                farm.inventory[animalConfig.product] = 0;
              }

              const effects = applyItemEffects(farm);
              const productAmount = Math.ceil(
                animalConfig.productPrice * effects.animalBoost
              );

              farm.inventory[animalConfig.product] += 1;
              animal.lastProduced = currentTime;
              animal.fed = false;
            }
          }
        });
      }

      if (farm.plots) {
        farm.plots.forEach((plot) => {
          if (!plot || plot.status !== "growing" || !plot.crop) return;

          const cropConfig = CROPS[plot.crop];
          if (!cropConfig) return;

          const effects = applyItemEffects(farm);
          const growTime = cropConfig.time * 1000 * effects.growBoost;

          const weather = getCurrentWeather(userID);
          if (weather && weather.waterDrain && plot.water > 0) {
            const timeSinceLastUpdate =
              currentTime - (farmData.lastUpdate || currentTime);
            const waterDrainRate =
              (weather.waterDrain * timeSinceLastUpdate) / (1000 * 60 * 60);
            plot.water =
              Math.round(Math.max(0, plot.water - waterDrainRate) * 10) / 10;
          }

          if (weather && weather.waterFill) {
            const timeSinceLastUpdate =
              currentTime - (farmData.lastUpdate || currentTime);
            const waterFillRate =
              (weather.waterFill * timeSinceLastUpdate) / (1000 * 60 * 60);
            plot.water =
              Math.round(
                Math.min(cropConfig.water, plot.water + waterFillRate) * 10
              ) / 10;
          }

          if (effects.autoWater && plot.water < cropConfig.water / 2) {
            const lastAutoWater = plot.lastAutoWater || 0;
            if (currentTime - lastAutoWater >= 4 * 60 * 60 * 1000) {
              plot.water = Math.round(cropConfig.water);
              plot.lastAutoWater = currentTime;
            }
          }

          if (currentTime - (plot.plantedAt || 0) >= growTime) {
            if (plot.water > 0) {
              plot.status = "ready";
            } else {
              plot.plantedAt += 30 * 60 * 1000;
            }
          }

          if (
            weather &&
            weather.type === "storm" &&
            weather.cropDamage &&
            Math.random() < weather.cropDamage
          ) {
            plot.status = "damaged";
          }
        });
      }

      if (farm.weather && currentTime > farm.weather.nextChange) {
        const weather = getCurrentWeather(userID);
        if (weather) {
          farm.weather = {
            type: weather.type,
            nextChange: currentTime + 6 * 60 * 60 * 1000,
          };
        }
      }

      if (farm.processing) {
        for (const [recipeId, process] of Object.entries(farm.processing)) {
          if (!PROCESSING_RECIPES[recipeId]) {
            delete farm.processing[recipeId];
          }
        }
      }
    });

    farmData.lastUpdate = currentTime;
    saveFarmData(farmData);
  } catch (error) {
    console.error("Error in updateFarms:", error);
  }
}

module.exports = {
  name: "farm",
  dev: "HNT",
  usedby: 0,
  category: "Games",
  info: "Trồng trọt và chăn nuôi như ở nông thôn Việt Nam",
  onPrefix: true,
  usages: [],
  cooldowns: 3,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const currentTime = Date.now();

    try {
      updateFarms();

      const farmData = loadFarmData();
      if (!farmData || !farmData.farms) {
        console.error("Invalid farm data structure");
        return api.sendMessage(
          "❌ Lỗi dữ liệu trang trại! Vui lòng thử lại sau.",
          threadID,
          messageID
        );
      }

      const userFarm = farmData.farms[senderID] || createUserFarm(senderID);
      userFarm.id = senderID;
      farmData.farms[senderID] = userFarm;
      saveFarmData(farmData);

      if (!target[0]) {
        try {
          const level = calculateLevel(userFarm.exp);
          const nextLevel = level.level < 10 ? LEVELS[level.level] : null;

          let plotsReady = 0;
          let plotsGrowing = 0;
          let plotsEmpty = 0;

          userFarm.plots.forEach((plot) => {
            if (plot.status === "ready") plotsReady++;
            else if (plot.status === "growing") plotsGrowing++;
            else if (plot.status === "empty") plotsEmpty++;
          });

          let animalProducts = 0;
          Object.entries(userFarm.animals || {}).forEach(([_, animal]) => {
            if (animal.productReady) animalProducts++;
          });

          const currentEvent = checkEvent();
          const eventMessage = currentEvent
            ? `\n🎉 Sự kiện đặc biệt: ${currentEvent.name} đang diễn ra!\n` +
              `→ Các loại cây đặc biệt có sẵn để trồng!`
            : "";

          const message =
            `〔 🌾 NÔNG TRẠI AKI 🌾 〕\n` +
            `┣━━━━━━━━━━━━━━━━┫\n` +
            `┣➤ 👨‍🌾 Cấp độ: ${level.level} - ${level.title}\n` +
            `┣➤ 📊 EXP: ${userFarm.exp}/${
              nextLevel ? nextLevel.exp : "MAX"
            }\n` +
            `┃   ${"▰".repeat(
              Math.floor(
                ((userFarm.exp -
                  (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                  ((nextLevel ? nextLevel.exp : userFarm.exp) -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                  10
              )
            )}${"▱".repeat(
              10 -
                Math.floor(
                  ((userFarm.exp -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                    ((nextLevel ? nextLevel.exp : userFarm.exp) -
                      (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                    10
                )
            )}\n` +
            `┣━━━━━━━━━━━━━━━━┫\n` +
            `┣➤ 🌱 ĐẤT TRỒNG: ${userFarm.plots.length} ô\n` +
            `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
            `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
            `┃   🔲 Còn trống: ${plotsEmpty} ô\n` +
            `┣➤ 🐄 VẬT NUÔI: ${
              Object.keys(userFarm.animals || {}).length
            } con\n` +
            `┃   🧺 Sản phẩm sẵn sàng: ${animalProducts}\n` +
            `┣➤ 🌤️ THỜI TIẾT: ${WEATHER_EFFECTS[userFarm.weather.type].emoji} ${
              WEATHER_EFFECTS[userFarm.weather.type].name
            }\n` +
            `┃   ${WEATHER_EFFECTS[userFarm.weather.type].description}\n` +
            (currentEvent
              ? `┣➤ 🎉 SỰ KIỆN: ${currentEvent.name}\n┃   → Các loại cây đặc biệt có sẵn để trồng!\n`
              : "") +
            `┗━━━━━━━━━━━━━━━━┛\n\n` +
            `⚡ LỆNH NHANH:\n` +
            `→ .farm trồng - Xem danh sách cây trồng\n` +
            `→ .farm kho - Xem Kho\n` +
            `→ .farm thu - Thu hoạch tất cả cây sẵn sàng\n` +
            `→ .farm info - Xem chi tiết trang trại\n` +
            `→ .farm shop - Xem cửa hàng\n` +
            `→ .farm help - Xem hướng dẫn cách chơi\n` +
            `→ .farm bxh - Xem bảng xếp hạng\n`;

          return api.sendMessage(message, threadID, messageID);
        } catch (error) {
          console.error("Error in farm command:", error);
          return api.sendMessage(
            "❌ Lỗi xử lý trang trại!",
            threadID,
            messageID
          );
        }
      }

      const command = target[0].toLowerCase();

      switch (command) {
        case "trồng":
        case "trong":
        case "plant": {
          const cropId = target[1]?.toLowerCase();
          const plotParam = target[2]?.toLowerCase();

          if (!cropId) {
            let availableCrops = "📋 DANH SÁCH CÂY TRỒNG\n";

            const currentEvent = checkEvent();
            if (currentEvent && currentEvent.crops) {
              availableCrops += `\n🎉 CÂY TRỒNG SỰ KIỆN ${currentEvent.name}:\n`;
              Object.entries(currentEvent.crops).forEach(([id, crop]) => {
                availableCrops += `→ ${crop.emoji} ${crop.name} (.farm trồng ${id})\n`;
                availableCrops += `   💰 Giá: ${formatNumber(crop.price)} Xu\n`;
                availableCrops += `   ⏱️ Thời gian: ${Math.floor(
                  crop.time / 3600
                )} giờ ${(crop.time % 3600) / 60} phút\n`;
                availableCrops += `   💵 Thu hoạch: ${formatNumber(
                  crop.yield
                )} Xu\n`;
              });
              availableCrops += "\n";
            }

            availableCrops += "📊 CÂY TRỒNG THƯỜNG:\n";
            const currentLevel = calculateLevel(userFarm.exp).level;

            Object.entries(CROPS)
              .filter(([_, crop]) => crop.level <= currentLevel)
              .forEach(([id, crop]) => {
                availableCrops += `→ ${crop.emoji} ${crop.name} (.farm trồng ${id})\n`;
                availableCrops += `   💰 Giá: ${formatNumber(crop.price)} Xu\n`;
                availableCrops += `   ⏱️ Thời gian: ${Math.floor(
                  crop.time / 60
                )} phút\n`;
                availableCrops += `   💧 Nước: ${crop.water} lần tưới\n`;
                availableCrops += `   💵 Thu hoạch: ${formatNumber(
                  crop.yield
                )} Xu\n`;
              });

            const lockedCrops = Object.entries(CROPS).filter(
              ([_, crop]) => crop.level > currentLevel
            );

            if (lockedCrops.length > 0) {
              availableCrops += "\n🔒 CÂY TRỒNG KHÓA (CẦN NÂNG CẤP):\n";
              lockedCrops.forEach(([id, crop]) => {
                availableCrops += `→ ${crop.emoji} ${crop.name} (Cần đạt cấp ${crop.level})\n`;
              });
            }

            return api.sendMessage(availableCrops, threadID, messageID);
          }

          let cropConfig;
          const currentEvent = checkEvent();

          if (
            currentEvent &&
            currentEvent.crops &&
            currentEvent.crops[cropId]
          ) {
            cropConfig = currentEvent.crops[cropId];
          } else if (CROPS[cropId]) {
            cropConfig = CROPS[cropId];
          } else {
            return api.sendMessage(
              `❌ Cây trồng không tồn tại! Sử dụng .farm trồng để xem danh sách.`,
              threadID,
              messageID
            );
          }

          const currentLevel = calculateLevel(userFarm.exp).level;
          if (cropConfig.level > currentLevel) {
            return api.sendMessage(
              `❌ Bạn cần đạt cấp độ ${cropConfig.level} để trồng ${cropConfig.name}!\n` +
                `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
              threadID,
              messageID
            );
          }

          if (
            plotParam === "all" ||
            plotParam === "tất_cả" ||
            plotParam === "tat_ca"
          ) {
            const emptyPlots = userFarm.plots.filter(
              (plot) => plot.status === "empty" || plot.status === "damaged"
            );

            if (emptyPlots.length === 0) {
              return api.sendMessage(
                `❌ Không có ô đất trống để trồng!\n` +
                  `💡 Thu hoạch hoặc mở khóa thêm ô đất để trồng cây.`,
                threadID,
                messageID
              );
            }

            const totalCost = cropConfig.price * emptyPlots.length;
            const balance = await getBalance(senderID);

            if (balance < totalCost) {
              return api.sendMessage(
                `❌ Không đủ tiền để trồng ${emptyPlots.length} ô ${cropConfig.name}!\n` +
                  `💰 Chi phí: ${formatNumber(totalCost)} Xu (${formatNumber(
                    cropConfig.price
                  )} × ${emptyPlots.length})\n` +
                  `💵 Số dư: ${formatNumber(balance)} Xu\n` +
                  `💡 Hãy thử trồng ít hơn hoặc kiếm thêm xu.`,
                threadID,
                messageID
              );
            }

            await updateBalance(senderID, -totalCost);

            for (const plot of emptyPlots) {
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
            }

            saveFarmData(farmData);

            return api.sendMessage(
              `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${emptyPlots.length} ô đất trống!\n` +
                `💰 Chi phí: -${formatNumber(totalCost)} Xu\n` +
                `⏱️ Thời gian thu hoạch: ${
                  Math.floor(cropConfig.time / 3600) > 0
                    ? `${Math.floor(cropConfig.time / 3600)} giờ ${Math.floor(
                        (cropConfig.time % 3600) / 60
                      )} phút`
                    : `${Math.floor(cropConfig.time / 60)} phút`
                }\n` +
                `💦 Nhớ tưới nước thường xuyên: .farm tưới`,
              threadID,
              messageID
            );
          } else if (plotParam && plotParam.includes("-")) {
            const range = plotParam.split("-");
            const startPlot = parseInt(range[0]) - 1;
            const endPlot = parseInt(range[1]) - 1;

            if (
              isNaN(startPlot) ||
              isNaN(endPlot) ||
              startPlot < 0 ||
              endPlot >= userFarm.plots.length ||
              startPlot > endPlot
            ) {
              return api.sendMessage(
                `❌ Phạm vi ô đất không hợp lệ!\n` +
                  `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})\n` +
                  `💡 Cú pháp: .farm trồng ${cropId} 1-5 (trồng từ ô 1 đến ô 5)`,
                threadID,
                messageID
              );
            }

            const selectedPlots = [];

            for (let i = startPlot; i <= endPlot; i++) {
              if (
                userFarm.plots[i].status === "empty" ||
                userFarm.plots[i].status === "damaged"
              ) {
                selectedPlots.push(userFarm.plots[i]);
              }
            }

            if (selectedPlots.length === 0) {
              return api.sendMessage(
                `❌ Không có ô đất trống trong phạm vi từ ${
                  startPlot + 1
                } đến ${endPlot + 1}!\n` +
                  `💡 Thu hoạch cây trước khi trồng mới.`,
                threadID,
                messageID
              );
            }

            const totalCost = cropConfig.price * selectedPlots.length;
            const balance = await getBalance(senderID);

            if (balance < totalCost) {
              return api.sendMessage(
                `❌ Không đủ tiền để trồng ${selectedPlots.length} ô ${cropConfig.name}!\n` +
                  `💰 Chi phí: ${formatNumber(totalCost)} Xu (${formatNumber(
                    cropConfig.price
                  )} × ${selectedPlots.length})\n` +
                  `💵 Số dư: ${formatNumber(balance)} Xu`,
                threadID,
                messageID
              );
            }

            await updateBalance(senderID, -totalCost);

            for (const plot of selectedPlots) {
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
            }

            saveFarmData(farmData);

            return api.sendMessage(
              `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${
                selectedPlots.length
              } ô đất từ ${startPlot + 1} đến ${endPlot + 1}!\n` +
                `💰 Chi phí: -${formatNumber(totalCost)} Xu\n` +
                `⏱️ Thời gian thu hoạch: ${
                  Math.floor(cropConfig.time / 3600) > 0
                    ? `${Math.floor(cropConfig.time / 3600)} giờ ${Math.floor(
                        (cropConfig.time % 3600) / 60
                      )} phút`
                    : `${Math.floor(cropConfig.time / 60)} phút`
                }\n` +
                `💦 Nhớ tưới nước thường xuyên: .farm tưới`,
              threadID,
              messageID
            );
          } else if (plotParam && plotParam.includes(",")) {
            const plotNumbers = plotParam
              .split(",")
              .map((num) => parseInt(num) - 1);

            for (const plotNum of plotNumbers) {
              if (
                isNaN(plotNum) ||
                plotNum < 0 ||
                plotNum >= userFarm.plots.length
              ) {
                return api.sendMessage(
                  `❌ Ô đất số ${plotNum + 1} không hợp lệ!\n` +
                    `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
                  threadID,
                  messageID
                );
              }
            }

            const selectedPlots = [];
            const unavailablePlots = [];

            for (const plotNum of plotNumbers) {
              if (
                userFarm.plots[plotNum].status === "empty" ||
                userFarm.plots[plotNum].status === "damaged"
              ) {
                selectedPlots.push(userFarm.plots[plotNum]);
              } else {
                unavailablePlots.push(plotNum + 1);
              }
            }

            if (selectedPlots.length === 0) {
              return api.sendMessage(
                `❌ Tất cả ô đất bạn chọn đều đã có cây trồng!\n` +
                  `💡 Thu hoạch cây trước khi trồng mới.`,
                threadID,
                messageID
              );
            }

            const totalCost = cropConfig.price * selectedPlots.length;
            const balance = await getBalance(senderID);

            if (balance < totalCost) {
              return api.sendMessage(
                `❌ Không đủ tiền để trồng ${selectedPlots.length} ô ${cropConfig.name}!\n` +
                  `💰 Chi phí: ${formatNumber(totalCost)} Xu (${formatNumber(
                    cropConfig.price
                  )} × ${selectedPlots.length})\n` +
                  `💵 Số dư: ${formatNumber(balance)} Xu`,
                threadID,
                messageID
              );
            }

            await updateBalance(senderID, -totalCost);

            for (const plot of selectedPlots) {
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
            }

            saveFarmData(farmData);

            let message = `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${selectedPlots.length} ô đất!\n`;
            message += `💰 Chi phí: -${formatNumber(totalCost)} Xu\n`;

            if (unavailablePlots.length > 0) {
              message += `⚠️ Các ô đất ${unavailablePlots.join(
                ", "
              )} không thể trồng vì đã có cây.\n`;
            }

            message += `⏱️ Thời gian thu hoạch: ${
              Math.floor(cropConfig.time / 3600) > 0
                ? `${Math.floor(cropConfig.time / 3600)} giờ ${Math.floor(
                    (cropConfig.time % 3600) / 60
                  )} phút`
                : `${Math.floor(cropConfig.time / 60)} phút`
            }\n`;
            message += `💦 Nhớ tưới nước thường xuyên: .farm tưới`;

            return api.sendMessage(message, threadID, messageID);
          } else if (
            plotParam &&
            !isNaN(parseInt(plotParam)) &&
            parseInt(plotParam) > 1
          ) {
            const count = parseInt(plotParam);

            const emptyPlots = userFarm.plots.filter(
              (plot) => plot.status === "empty" || plot.status === "damaged"
            );

            if (emptyPlots.length === 0) {
              return api.sendMessage(
                `❌ Không có ô đất trống để trồng!\n` +
                  `💡 Thu hoạch hoặc mở khóa thêm ô đất để trồng cây.`,
                threadID,
                messageID
              );
            }

            const plotsToPlant = Math.min(count, emptyPlots.length);
            const totalCost = cropConfig.price * plotsToPlant;
            const balance = await getBalance(senderID);

            if (balance < totalCost) {
              return api.sendMessage(
                `❌ Không đủ tiền để trồng ${plotsToPlant} ô ${cropConfig.name}!\n` +
                  `💰 Chi phí: ${formatNumber(totalCost)} Xu (${formatNumber(
                    cropConfig.price
                  )} × ${plotsToPlant})\n` +
                  `💵 Số dư: ${formatNumber(balance)} Xu\n` +
                  `💡 Hãy thử trồng ít hơn hoặc kiếm thêm xu.`,
                threadID,
                messageID
              );
            }

            await updateBalance(senderID, -totalCost);

            for (let i = 0; i < plotsToPlant; i++) {
              const plot = emptyPlots[i];
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
            }

            saveFarmData(farmData);

            let message = `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${plotsToPlant} ô đất!\n`;
            message += `💰 Chi phí: -${formatNumber(totalCost)} Xu\n`;

            if (plotsToPlant < count) {
              message += `⚠️ Chỉ có ${plotsToPlant}/${count} ô đất trống để trồng.\n`;
            }

            message += `⏱️ Thời gian thu hoạch: ${
              Math.floor(cropConfig.time / 3600) > 0
                ? `${Math.floor(cropConfig.time / 3600)} giờ ${Math.floor(
                    (cropConfig.time % 3600) / 60
                  )} phút`
                : `${Math.floor(cropConfig.time / 60)} phút`
            }\n`;
            message += `💦 Nhớ tưới nước thường xuyên: .farm tưới`;

            return api.sendMessage(message, threadID, messageID);
          }

          const plotNumber = parseInt(target[2]) - 1;

          if (isNaN(plotNumber)) {
            return api.sendMessage(
              `💡 HƯỚNG DẪN TRỒNG CÂY:\n` +
                `→ .farm trồng ${cropId} <số ô>: Trồng vào ô cụ thể\n` +
                `→ .farm trồng ${cropId} 1-5: Trồng từ ô 1 đến ô 5\n` +
                `→ .farm trồng ${cropId} 1,3,5: Trồng vào ô 1, 3 và 5\n` +
                `→ .farm trồng ${cropId} 10: Trồng vào 10 ô đất trống đầu tiên\n` +
                `→ .farm trồng ${cropId} all: Trồng vào tất cả ô đất trống`,
              threadID,
              messageID
            );
          }

          if (plotNumber < 0 || plotNumber >= userFarm.plots.length) {
            return api.sendMessage(
              `❌ Ô đất không tồn tại!\n` +
                `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
              threadID,
              messageID
            );
          }

          const plot = userFarm.plots[plotNumber];
          if (plot.status !== "empty" && plot.status !== "damaged") {
            return api.sendMessage(
              `❌ Ô đất ${plotNumber + 1} đang có cây trồng!\n` +
                `→ Sử dụng .farm thu ${
                  plotNumber + 1
                } nếu cây đã sẵn sàng thu hoạch`,
              threadID,
              messageID
            );
          }

          const balance = await getBalance(senderID);
          if (balance < cropConfig.price) {
            return api.sendMessage(
              `❌ Bạn không đủ tiền để mua ${cropConfig.name}!\n` +
                `💰 Giá: ${formatNumber(cropConfig.price)} Xu\n` +
                `💵 Số dư: ${formatNumber(balance)} Xu`,
              threadID,
              messageID
            );
          }

          await updateBalance(senderID, -cropConfig.price);
          plot.status = "growing";
          plot.crop = cropId;
          plot.plantedAt = Date.now();
          plot.water = cropConfig.water > 0 ? 1 : 0;
          plot.lastWatered = Date.now();

          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} tại ô đất ${
              plotNumber + 1
            }!\n` +
              `⏱️ Thời gian thu hoạch: ${
                Math.floor(cropConfig.time / 3600) > 0
                  ? `${Math.floor(cropConfig.time / 3600)} giờ ${Math.floor(
                      (cropConfig.time % 3600) / 60
                    )} phút`
                  : `${Math.floor(cropConfig.time / 60)} phút`
              }\n` +
              `💦 Nhớ tưới nước thường xuyên: .farm tưới ${plotNumber + 1}`,
            threadID,
            messageID
          );
        }
        case "bxh":
        case "xếp_hạng":
        case "rank": {
          const rankType = target[1]?.toLowerCase() || "cấp_độ";
          const page = parseInt(target[2]) || 1;

          let userData = {};
          try {
            const userDataPath = path.join(
              __dirname,
              "../events/cache/userData.json"
            );
            if (fs.existsSync(userDataPath)) {
              userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
            }
          } catch (error) {
            console.error("Error loading userData.json:", error);
          }

          const allFarms = [];

          Object.entries(farmData.farms || {}).forEach(([userId, farm]) => {
            if (!farm) return;

            let farmWorth = 0;

            if (farm.plots) {
              farm.plots.forEach((plot) => {
                if (plot.status === "growing" && plot.crop) {
                  const cropConfig =
                    CROPS[plot.crop] ||
                    (checkEvent() && checkEvent().crops
                      ? checkEvent().crops[plot.crop]
                      : null);

                  if (cropConfig) {
                    farmWorth += cropConfig.price;
                  }
                }
              });
            }

            if (farm.animals) {
              Object.entries(farm.animals).forEach(([_, animal]) => {
                if (animal && animal.type && ANIMALS[animal.type]) {
                  farmWorth += ANIMALS[animal.type].price;
                }
              });
            }

            if (farm.inventory) {
              Object.entries(farm.inventory).forEach(([product, count]) => {
                let productPrice = 0;
                for (const animalType in ANIMALS) {
                  if (ANIMALS[animalType].product === product) {
                    productPrice = ANIMALS[animalType].productPrice;
                    break;
                  }
                }
                farmWorth += productPrice * count;
              });
            }

            let userName = "Người dùng";
            let userExp = 0;

            if (userData[userId]) {
              userName =
                userData[userId].name || `Người dùng ${userId.slice(-4)}`;
              userExp = userData[userId].exp || 0;
            }

            const farmLevel = calculateLevel(farm.exp);

            allFarms.push({
              userId,
              name: userName,
              exp: farm.exp,
              level: farmLevel.level,
              title: farmLevel.title,
              plotCount: farm.plots?.length || 0,
              animalCount: Object.keys(farm.animals || {}).length,
              farmWorth: farmWorth,
              createdAt: farm.createdAt || 0,
              userRank: userData[userId]?.rank || 999,
              userExp: userExp,
            });
          });

          let sortedFarms = [];
          let rankTypeDisplay = "";

          switch (rankType) {
            case "cấp_độ":
            case "level":
            case "exp":
              sortedFarms = allFarms.sort((a, b) => {
                if (b.level !== a.level) {
                  return b.level - a.level;
                }
                return b.exp - a.exp;
              });
              rankTypeDisplay = "Cấp độ cao nhất";
              break;

            case "tài_sản":
            case "giá_trị":
            case "worth":
              sortedFarms = allFarms.sort((a, b) => b.farmWorth - a.farmWorth);
              rankTypeDisplay = "Tài sản giá trị nhất";
              break;

            case "đất":
            case "plots":
              sortedFarms = allFarms.sort((a, b) => b.plotCount - a.plotCount);
              rankTypeDisplay = "Diện tích đất lớn nhất";
              break;

            case "vật_nuôi":
            case "animals":
              sortedFarms = allFarms.sort(
                (a, b) => b.animalCount - a.animalCount
              );
              rankTypeDisplay = "Nhiều vật nuôi nhất";
              break;

            case "lâu_đời":
            case "old":
              sortedFarms = allFarms.sort((a, b) => a.createdAt - b.createdAt);
              rankTypeDisplay = "Trang trại lâu đời nhất";
              break;

            default:
              sortedFarms = allFarms.sort((a, b) => {
                if (b.level !== a.level) {
                  return b.level - a.level;
                }
                return b.exp - a.exp;
              });
              rankTypeDisplay = "Cấp độ cao nhất";
              break;
          }

          const itemsPerPage = 10;
          const totalPages = Math.ceil(sortedFarms.length / itemsPerPage);

          if (page < 1 || page > totalPages) {
            return api.sendMessage(
              `❌ Trang không hợp lệ! Chỉ có ${totalPages} trang xếp hạng.`,
              threadID,
              messageID
            );
          }

          const startIdx = (page - 1) * itemsPerPage;
          const endIdx = Math.min(startIdx + itemsPerPage, sortedFarms.length);
          const displayFarms = sortedFarms.slice(startIdx, endIdx);

          const currentUserRank =
            sortedFarms.findIndex((farm) => farm.userId === senderID) + 1;
          let currentUserInfo = "";

          if (currentUserRank > 0) {
            const userFarmData = sortedFarms[currentUserRank - 1];
            currentUserInfo = `👨‍🌾 Thứ hạng của bạn: #${currentUserRank}\n`;

            switch (rankType) {
              case "cấp_độ":
              case "level":
              case "exp":
                currentUserInfo += `   Cấp độ ${userFarmData.level} (${userFarmData.exp} EXP)\n`;
                break;
              case "tài_sản":
              case "giá_trị":
              case "worth":
                currentUserInfo += `   Tài sản: ${formatNumber(
                  userFarmData.farmWorth
                )} Xu\n`;
                break;
              case "đất":
              case "plots":
                currentUserInfo += `   Số ô đất: ${userFarmData.plotCount} ô\n`;
                break;
              case "vật_nuôi":
              case "animals":
                currentUserInfo += `   Số vật nuôi: ${userFarmData.animalCount} con\n`;
                break;
              case "lâu_đời":
              case "old":
                currentUserInfo += `   Ngày thành lập: ${new Date(
                  userFarmData.createdAt
                ).toLocaleDateString("vi-VN")}\n`;
                break;
            }
          }

          let message =
            `🏆 BẢNG XẾP HẠNG NÔNG DÂN 🏆\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 Xếp hạng theo: ${rankTypeDisplay}\n` +
            `📊 Trang: ${page}/${totalPages}\n\n`;

          if (currentUserInfo) {
            message += `${currentUserInfo}\n`;
          }

          displayFarms.forEach((farm, index) => {
            const rank = startIdx + index + 1;
            let rankIcon = "👤";

            if (rank === 1) rankIcon = "🥇";
            else if (rank === 2) rankIcon = "🥈";
            else if (rank === 3) rankIcon = "🥉";

            message += `${rankIcon} #${rank}. ${farm.name}\n`;

            switch (rankType) {
              case "cấp_độ":
              case "level":
              case "exp":
                message += `   👨‍🌾 Farm: Cấp ${farm.level} - ${farm.title}\n`;
                message += `   📊 EXP: ${farm.exp}\n`;
                break;
              case "tài_sản":
              case "giá_trị":
              case "worth":
                message += `   💰 Tài sản: ${formatNumber(
                  farm.farmWorth
                )} Xu\n`;
                break;
              case "đất":
              case "plots":
                message += `   🌱 Số ô đất: ${farm.plotCount} ô\n`;
                break;
              case "vật_nuôi":
              case "animals":
                message += `   🐄 Số vật nuôi: ${farm.animalCount} con\n`;
                break;
              case "lâu_đời":
              case "old":
                message += `   🏡 Ngày thành lập: ${new Date(
                  farm.createdAt
                ).toLocaleDateString("vi-VN")}\n`;
                break;
            }

            message += `\n`;
          });

          message +=
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💡 Xem trang khác: .farm bxh ${rankType} <số trang>\n` +
            `📋 Các loại xếp hạng:\n` +
            `  • .farm bxh cấp_độ - Theo cấp độ\n` +
            `  • .farm bxh tài_sản - Theo giá trị trang trại\n` +
            `  • .farm bxh đất - Theo số lượng đất\n` +
            `  • .farm bxh vật_nuôi - Theo số vật nuôi\n` +
            `  • .farm bxh lâu_đời - Theo thời gian thành lập`;

          return api.sendMessage(message, threadID, messageID);
        }

        case "thăm":
        case "tham":
        case "visit": {
          let targetID = "";

          const mentions = event.mentions;

          if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
          } else {
            targetID = target[1];
          }

          if (!targetID) {
            return api.sendMessage(
              "❌ Vui lòng tag người chơi hoặc nhập ID để thăm trang trại!\n" +
                "💡 Sử dụng: .farm thăm @tên_người_chơi\n" +
                "💡 Hoặc: .farm thăm [ID người chơi]",
              threadID,
              messageID
            );
          }

          let targetInfo = {};
          try {
            const userDataPath = path.join(
              __dirname,
              "../events/cache/userData.json"
            );
            if (fs.existsSync(userDataPath)) {
              const userData = JSON.parse(
                fs.readFileSync(userDataPath, "utf8")
              );
              if (userData[targetID]) {
                targetInfo = userData[targetID];
              }
            }
          } catch (error) {
            console.error("Error getting target user data:", error);
          }

          const targetName =
            targetInfo.name || `Người chơi ${targetID.slice(-4)}`;

          if (!farmData.farms[targetID]) {
            return api.sendMessage(
              `❌ Không tìm thấy trang trại của ${targetName}!\n` +
                "💡 Người chơi này chưa có trang trại hoặc ID không chính xác.",
              threadID,
              messageID
            );
          }

          if (targetID === senderID) {
            return api.sendMessage(
              "❌ Bạn không thể thăm trang trại của chính mình!\n" +
                "💡 Hãy sử dụng lệnh .farm để xem trang trại của bạn.",
              threadID,
              messageID
            );
          }

          const targetFarm = farmData.farms[targetID];

          if (!userFarm.lastVisits) userFarm.lastVisits = {};

          const lastVisit = userFarm.lastVisits[targetID] || 0;
          const visitCooldown = 3 * 60 * 60 * 1000;

          if (Date.now() - lastVisit < visitCooldown) {
            const remainingTime = Math.ceil(
              (lastVisit + visitCooldown - Date.now()) / (60 * 60 * 1000)
            );
            return api.sendMessage(
              `❌ Bạn đã thăm trang trại của ${targetName} gần đây!\n` +
                `⏱️ Vui lòng đợi thêm ${remainingTime} giờ nữa.`,
              threadID,
              messageID
            );
          }

          const targetLevel = calculateLevel(targetFarm.exp);

          let plotsReady = 0;
          let plotsGrowing = 0;
          let plotsEmpty = 0;
          let plotsDamaged = 0;

          targetFarm.plots.forEach((plot) => {
            if (plot.status === "ready") plotsReady++;
            else if (plot.status === "growing") plotsGrowing++;
            else if (plot.status === "empty") plotsEmpty++;
            else if (plot.status === "damaged") plotsDamaged++;
          });

          let animalProducts = 0;
          Object.entries(targetFarm.animals || {}).forEach(([_, animal]) => {
            if (animal.productReady) animalProducts++;
          });

          const actions = [];

          if (plotsGrowing > 0) {
            const needWateringPlots = targetFarm.plots.filter((plot) => {
              if (plot.status !== "growing" || !plot.crop) return false;

              const cropConfig =
                CROPS[plot.crop] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[plot.crop]
                  : null);

              return (
                cropConfig &&
                cropConfig.water > 0 &&
                plot.water < cropConfig.water
              );
            });

            if (needWateringPlots.length > 0) {
              actions.push("water");
            }
          }

          let unfedAnimals = [];
          if (targetFarm.animals) {
            unfedAnimals = Object.entries(targetFarm.animals)
              .filter(([_, animal]) => !animal.fed)
              .map(([_, animal]) => animal.type);

            const uniqueUnfedTypes = [...new Set(unfedAnimals)];
            if (uniqueUnfedTypes.length > 0) {
              actions.push("feed");
            }
          }

          let actionMessage = "";
          let expGain = Math.floor(Math.random() * 3) + 3;
          let rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP\n`;

          if (actions.length > 0) {
            const randomAction =
              actions[Math.floor(Math.random() * actions.length)];

            if (randomAction === "water") {
              const needWateringPlots = targetFarm.plots.filter((plot) => {
                if (plot.status !== "growing" || !plot.crop) return false;

                const cropConfig =
                  CROPS[plot.crop] ||
                  (checkEvent() && checkEvent().crops
                    ? checkEvent().crops[plot.crop]
                    : null);

                return (
                  cropConfig &&
                  cropConfig.water > 0 &&
                  plot.water < cropConfig.water
                );
              });

              if (needWateringPlots.length > 0) {
                const randomPlot =
                  needWateringPlots[
                    Math.floor(Math.random() * needWateringPlots.length)
                  ];
                const plotIndex = targetFarm.plots.findIndex(
                  (p) => p === randomPlot
                );

                const cropConfig =
                  CROPS[randomPlot.crop] ||
                  (checkEvent() && checkEvent().crops
                    ? checkEvent().crops[randomPlot.crop]
                    : null);

                if (cropConfig) {
                  randomPlot.water = Math.min(
                    cropConfig.water,
                    randomPlot.water + 1
                  );
                  randomPlot.lastWatered = Date.now();

                  actionMessage = `💦 Bạn đã giúp tưới nước cho ${
                    cropConfig.emoji
                  } ${cropConfig.name} ở ô đất ${plotIndex + 1}!\n`;
                  expGain += 5;
                  rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP (tưới nước +5)\n`;
                }
              }
            } else if (randomAction === "feed") {
              const uniqueUnfedTypes = [...new Set(unfedAnimals)];
              const randomType =
                uniqueUnfedTypes[
                  Math.floor(Math.random() * uniqueUnfedTypes.length)
                ];

              const animalConfig = ANIMALS[randomType];
              if (animalConfig) {
                const animalEntry = Object.entries(targetFarm.animals).find(
                  ([_, animal]) => animal.type === randomType && !animal.fed
                );

                if (animalEntry) {
                  const [animalId, animal] = animalEntry;
                  animal.fed = true;
                  animal.lastFed = Date.now();

                  if (!animal.lastProduced) {
                    animal.lastProduced = Date.now();
                  }

                  actionMessage = `🥫 Bạn đã giúp cho ${animalConfig.emoji} ${animalConfig.name} ăn!\n`;
                  expGain += 5;
                  rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP (cho ăn +5)\n`;
                }
              }
            }
          } else {
            actionMessage =
              "💫 Bạn đã tham quan trang trại và học hỏi được một số điều!\n";
          }

          userFarm.lastVisits[targetID] = Date.now();
          userFarm.exp += expGain;

          if (!targetFarm.visitors) targetFarm.visitors = [];
          targetFarm.visitors.push({
            visitorId: senderID,
            visitTime: Date.now(),
            action: actionMessage.trim(),
          });

          if (targetFarm.visitors.length > 10) {
            targetFarm.visitors = targetFarm.visitors.slice(-10);
          }

          saveFarmData(farmData);

          const oldLevel = calculateLevel(userFarm.exp - expGain).level;
          const newLevel = calculateLevel(userFarm.exp).level;

          if (newLevel > oldLevel) {
            const newLevelData = LEVELS[newLevel - 1];
            rewardMessage += `\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
            rewardMessage += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
            rewardMessage += `💰 Phần thưởng: +${formatNumber(
              newLevelData.reward
            )} Xu\n`;

            await updateBalance(senderID, newLevelData.reward);

            if (newLevelData.plotSize > userFarm.plots.length) {
              const newPlotsCount =
                newLevelData.plotSize - userFarm.plots.length;
              rewardMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

              for (let i = 0; i < newPlotsCount; i++) {
                userFarm.plots.push({
                  id: userFarm.plots.length,
                  status: "empty",
                  crop: null,
                  plantedAt: null,
                  water: 0,
                  lastWatered: null,
                });
              }

              saveFarmData(farmData);
            }
          }

          const message =
            `👨‍🌾 TRANG TRẠI CỦA ${targetName.toUpperCase()} 👨‍🌾\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${actionMessage}\n` +
            `🏆 THÔNG TIN TRANG TRẠI:\n` +
            `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┣➤ 👨‍🌾 Cấp độ: ${targetLevel.level} - ${targetLevel.title}\n` +
            `┣➤ 🏡 Ngày thành lập: ${new Date(
              targetFarm.createdAt
            ).toLocaleDateString("vi-VN")}\n` +
            `┣➤ 🌱 Ô đất trồng: ${targetFarm.plots.length} ô\n` +
            `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
            `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
            `┃   🔲 Còn trống: ${plotsEmpty} ô\n` +
            `┣➤ 🐄 Vật nuôi: ${
              Object.keys(targetFarm.animals || {}).length
            } con\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `🎁 PHẦN THƯỞNG THAM QUAN:\n` +
            `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┣➤ ${rewardMessage}` +
            `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `💡 Bạn có thể thăm lại trang trại này sau 3 giờ nữa.\n` +
            `💫 Thăm trang trại khác: .farm thăm [ID]`;

          return api.sendMessage(message, threadID, messageID);
        }
        case "cho_ăn":
        case "cho_an":
        case "feed": {
          const animalType = target[1]?.toLowerCase();

          if (!animalType) {
            return api.sendMessage(
              "❌ Vui lòng nhập loại vật nuôi để cho ăn!\n" +
                "💡 Cú pháp: .farm cho_ăn <loại_vật_nuôi>\n" +
                "📝 Ví dụ: .farm cho_ăn ga",
              threadID,
              messageID
            );
          }

          if (!ANIMALS[animalType]) {
            return api.sendMessage(
              `❌ Không tìm thấy loại vật nuôi "${animalType}"!`,
              threadID,
              messageID
            );
          }

          const animalConfig = ANIMALS[animalType];
          let animalCount = 0;
          let unfedCount = 0;

          if (!userFarm.animals) {
            return api.sendMessage(
              `❌ Bạn không có vật nuôi nào!`,
              threadID,
              messageID
            );
          }

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (animal.type === animalType) {
              animalCount++;
              if (!animal.fed) unfedCount++;
            }
          });

          if (animalCount === 0) {
            return api.sendMessage(
              `❌ Bạn không có ${animalConfig.name} nào trong trang trại!`,
              threadID,
              messageID
            );
          }

          if (unfedCount === 0) {
            return api.sendMessage(
              `❌ Tất cả ${animalConfig.name} của bạn đã được cho ăn rồi!`,
              threadID,
              messageID
            );
          }

          const feedCost = animalConfig.feed * unfedCount;
          const balance = await getBalance(senderID);

          if (balance < feedCost) {
            return api.sendMessage(
              `❌ Bạn không đủ tiền để cho ${animalConfig.name} ăn!\n` +
                `💰 Chi phí: ${formatNumber(feedCost)} Xu (${formatNumber(
                  animalConfig.feed
                )} Xu × ${unfedCount})\n` +
                `💵 Số dư: ${formatNumber(balance)} Xu`,
              threadID,
              messageID
            );
          }

          await updateBalance(senderID, -feedCost);

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (animal.type === animalType && !animal.fed) {
              animal.fed = true;
              animal.lastFed = Date.now();

              if (!animal.lastProduced) {
                animal.lastProduced = Date.now();
              }
            }
          });

          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã cho ${unfedCount} ${animalConfig.name} ăn thành công!\n` +
              `💰 Chi phí: -${formatNumber(feedCost)} Xu\n` +
              `⏱️ Vật nuôi sẽ sản xuất sản phẩm sau ${Math.floor(
                animalConfig.productTime / 3600
              )} giờ\n` +
              `💡 Thu thập sản phẩm: .farm thu_sản_phẩm`,
            threadID,
            messageID
          );
        }
        case "thu_sản_phẩm":
        case "thu_san_pham":
        case "collect": {
          if (!userFarm.animals || Object.keys(userFarm.animals).length === 0) {
            return api.sendMessage(
              `❌ Bạn không có vật nuôi nào trong trang trại!`,
              threadID,
              messageID
            );
          }

          let productsCollected = {};
          let animalsFed = [];
          let totalValue = 0;
          let collectCount = 0;

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (!animal.type || !ANIMALS[animal.type]) return;

            const animalConfig = ANIMALS[animal.type];
            const effects = applyItemEffects(userFarm);

            if (!animal.lastProduced) return;

            const productionTime = animalConfig.productTime * 1000;
            const isReady = Date.now() - animal.lastProduced >= productionTime;

            if (animal.fed && isReady) {
              const productAmount = Math.ceil(
                animalConfig.productPrice * effects.animalBoost
              );
              const product = animalConfig.product;

              if (!userFarm.inventory) userFarm.inventory = {};
              if (!userFarm.inventory[product]) userFarm.inventory[product] = 0;

              userFarm.inventory[product]++;
              animal.lastProduced = Date.now();
              animal.fed = false;
              animal.productReady = false;
              collectCount++;

              if (!productsCollected[product]) {
                productsCollected[product] = {
                  count: 0,
                  price: productAmount,
                  emoji: animalConfig.productEmoji,
                };
              }

              productsCollected[product].count++;
              totalValue += productAmount;

              if (!animalsFed.includes(animal.type)) {
                animalsFed.push(animal.type);
              }
            }
          });

          saveFarmData(farmData);

          if (collectCount === 0) {
            return api.sendMessage(
              `❌ Chưa có sản phẩm nào sẵn sàng để thu thập!\n` +
                `💡 Lưu ý: Vật nuôi cần được cho ăn và đợi đủ thời gian sản xuất.`,
              threadID,
              messageID
            );
          }

          let message = `✅ Đã thu thập ${collectCount} sản phẩm từ vật nuôi!\n\n`;

          Object.entries(productsCollected).forEach(([product, details]) => {
            message += `${details.emoji} ${product}: +${
              details.count
            } (${formatNumber(details.price * details.count)} Xu)\n`;
          });

          message += `\n💰 Tổng giá trị: ${formatNumber(totalValue)} Xu`;
          message += `\n💡 Bán sản phẩm: .farm bán <sản phẩm> <số_lượng>`;

          if (animalsFed.length > 0) {
            message += `\n\n⚠️ Lưu ý: Hãy cho ${animalsFed
              .map((type) => ANIMALS[type].name)
              .join(", ")} ăn lại để tiếp tục sản xuất!`;
          }

          return api.sendMessage(message, threadID, messageID);
        }

        case "bán":
        case "ban":
        case "sell": {
          let productName = "";
          let quantity = 0;

          const lastParam = target[target.length - 1];
          const isLastParamNumber = !isNaN(parseInt(lastParam));
          if (isLastParamNumber) {
            quantity = parseInt(lastParam);
            productName = target
              .slice(1, target.length - 1)
              .join(" ")
              .toLowerCase();
          } else {
            productName = target.slice(1).join(" ").toLowerCase();
          }

          if (!productName) {
            if (
              !userFarm.inventory ||
              Object.keys(userFarm.inventory).length === 0
            ) {
              return api.sendMessage(
                `❌ Bạn không có sản phẩm nào để bán!`,
                threadID,
                messageID
              );
            }
            let message = `🧺 KHO HÀNG CỦA BẠN 🧺\n` + `━━━━━━━━━━━━━━━━━━\n\n`;

            Object.entries(userFarm.inventory).forEach(([product, count]) => {
              if (count <= 0) return;

              let productPrice = 0;
              let productEmoji = "📦";

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === productName) {
                  productPrice = ANIMALS[animalId].productPrice;
                  productEmoji = ANIMALS[animalId].productEmoji;
                  break;
                }
              }

              message += `${productEmoji} ${product}: ${count} (${formatNumber(
                count * productPrice
              )} Xu)\n`;
              message += `💡 Bán: .farm bán ${product} <số_lượng>\n\n`;
            });

            return api.sendMessage(message, threadID, messageID);
          }
          let matchedProduct = null;

          if (userFarm.inventory && userFarm.inventory[productName]) {
            matchedProduct = productName;
          } else {
            // Tìm kiếm tên gần đúng trong kho
            for (const product in userFarm.inventory || {}) {
              if (
                product.toLowerCase().includes(productName) ||
                productName.includes(product.toLowerCase())
              ) {
                matchedProduct = product;
                break;
              }
            }
          }

          if (!matchedProduct) {
            return api.sendMessage(
              `❌ Bạn không có sản phẩm "${productName}" trong kho!`,
              threadID,
              messageID
            );
          }

          const availableQuantity = userFarm.inventory[matchedProduct];

          if (isNaN(quantity) || quantity <= 0) {
            quantity = availableQuantity;
          }

          if (quantity > availableQuantity) {
            return api.sendMessage(
              `❌ Bạn chỉ có ${availableQuantity} ${matchedProduct} trong kho!`,
              threadID,
              messageID
            );
          }

          let productPrice = 0;
          let productEmoji = "📦";

          for (const animalId in ANIMALS) {
            if (ANIMALS[animalId].product === productName) {
              productPrice = ANIMALS[animalId].productPrice;
              productEmoji = ANIMALS[animalId].productEmoji;
              break;
            }
          }

          if (productPrice === 0) {
            for (const cropId in CROPS) {
              if (CROPS[cropId].name.toLowerCase() === productName) {
                productPrice = CROPS[cropId].yield;
                productEmoji = CROPS[cropId].emoji;
                break;
              }
            }

            if (productPrice === 0) {
              const currentEvent = checkEvent();
              if (currentEvent && currentEvent.crops) {
                for (const cropId in currentEvent.crops) {
                  if (
                    currentEvent.crops[cropId].name.toLowerCase() ===
                    productName
                  ) {
                    productPrice = currentEvent.crops[cropId].yield;
                    productEmoji = currentEvent.crops[cropId].emoji;
                    break;
                  }
                }
              }
            }

            if (productPrice === 0) {
              for (const recipeId in PROCESSING_RECIPES) {
                if (
                  PROCESSING_RECIPES[recipeId].name.toLowerCase() ===
                  productName
                ) {
                  productPrice = PROCESSING_RECIPES[recipeId].value;
                  productEmoji = PROCESSING_RECIPES[recipeId].emoji;
                  break;
                }
              }
            }
          }

          if (productPrice === 0) {
            return api.sendMessage(
              `❌ Không thể xác định giá của sản phẩm "${productName}"!`,
              threadID,
              messageID
            );
          }

          const totalValue = productPrice * quantity;
          userFarm.inventory[productName] -= quantity;
          await updateBalance(senderID, totalValue);
          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã bán ${quantity} ${productEmoji} ${productName} thành công!\n` +
              `💰 Nhận được: +${formatNumber(totalValue)} Xu\n` +
              `📊 Còn lại trong kho: ${userFarm.inventory[productName]} ${productName}`,
            threadID,
            messageID
          );
        }

        case "chế_biến":
        case "che_bien":
        case "process": {
          const recipeId = target[1]?.toLowerCase();
          const quantity = Math.max(1, parseInt(target[2]) || 1);

          if (!recipeId) {
            const currentLevel = calculateLevel(userFarm.exp).level;

            let message =
              `👨‍🍳 CHẾ BIẾN NÔNG SẢN 👨‍🍳\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `ℹ️ Chế biến nông sản giúp tạo ra sản phẩm có giá trị cao hơn!\n` +
              `💡 Sử dụng: .farm chế_biến <món_ăn> <số_lượng>\n\n` +
              `📋 CÔNG THỨC CHẾ BIẾN:\n`;

            const recipesByLevel = {};
            Object.entries(PROCESSING_RECIPES).forEach(([id, recipe]) => {
              const level = recipe.level;
              if (!recipesByLevel[level]) recipesByLevel[level] = [];
              recipesByLevel[level].push({ id, ...recipe });
            });

            for (let level = 1; level <= 10; level++) {
              if (recipesByLevel[level]) {
                const recipes = recipesByLevel[level];
                const available = level <= currentLevel;

                message += `\n${available ? "🔓" : "🔒"} CẤP ĐỘ ${level}:\n`;

                if (available) {
                  recipes.forEach((recipe) => {
                    message += `\n${recipe.emoji} ${recipe.name}\n`;
                    message += `💰 Giá bán: ${formatNumber(recipe.value)} Xu\n`;
                    message += `⏱️ Thời gian: ${Math.floor(
                      recipe.time / 60
                    )} phút\n`;
                    message += `📋 Nguyên liệu:\n`;

                    Object.entries(recipe.ingredients).forEach(
                      ([item, amount]) => {
                        let itemEmoji = "📦";

                        for (const animalId in ANIMALS) {
                          if (ANIMALS[animalId].product === item) {
                            itemEmoji = ANIMALS[animalId].productEmoji;
                            break;
                          }
                        }

                        for (const cropId in CROPS) {
                          if (
                            CROPS[cropId].name.toLowerCase() ===
                            item.toLowerCase()
                          ) {
                            itemEmoji = CROPS[cropId].emoji;
                            break;
                          }
                        }

                        message += `   ${itemEmoji} ${item}: ${amount}\n`;
                      }
                    );

                    message += `📦 Sản lượng: ${recipe.yield} ${recipe.name}\n`;
                    message += `💡 Chế biến: .farm chế_biến ${recipe.id}\n`;
                  });
                } else {
                  recipes.forEach((recipe) => {
                    message += `${recipe.emoji} ${recipe.name} (Cần đạt cấp ${level})\n`;
                  });
                }
              }
            }

            return api.sendMessage(message, threadID, messageID);
          }

          const recipe = PROCESSING_RECIPES[recipeId];
          if (!recipe) {
            return api.sendMessage(
              `❌ Không tìm thấy công thức "${recipeId}"!\n` +
                `💡 Sử dụng: .farm chế_biến để xem danh sách công thức.`,
              threadID,
              messageID
            );
          }

          const currentLevel = calculateLevel(userFarm.exp).level;
          if (recipe.level > currentLevel) {
            return api.sendMessage(
              `❌ Bạn cần đạt cấp độ ${recipe.level} để chế biến ${recipe.name}!\n` +
                `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
              threadID,
              messageID
            );
          }

          // Kiểm tra nguyên liệu
          const missingIngredients = [];
          const requiredIngredients = {};

          for (const [item, amount] of Object.entries(recipe.ingredients)) {
            const requiredAmount = amount * quantity;
            requiredIngredients[item] = requiredAmount;

            const availableAmount = userFarm.inventory?.[item] || 0;
            if (availableAmount < requiredAmount) {
              missingIngredients.push({
                name: item,
                required: requiredAmount,
                available: availableAmount,
                missing: requiredAmount - availableAmount,
              });
            }
          }

          if (missingIngredients.length > 0) {
            let message = `❌ Không đủ nguyên liệu để chế biến ${quantity} ${recipe.name}!\n\n`;
            message += `📋 NGUYÊN LIỆU CẦN THIẾT:\n`;

            for (const item of missingIngredients) {
              let itemEmoji = "📦";

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === item.name) {
                  itemEmoji = ANIMALS[animalId].productEmoji;
                  break;
                }
              }

              message += `${itemEmoji} ${item.name}: ${item.available}/${item.required} (Thiếu ${item.missing})\n`;
            }

            return api.sendMessage(message, threadID, messageID);
          }

          if (!userFarm.processing) userFarm.processing = {};

          if (
            userFarm.processing[recipeId] &&
            userFarm.processing[recipeId].status === "processing" &&
            userFarm.processing[recipeId].finishTime > Date.now()
          ) {
            const remaining = Math.ceil(
              (userFarm.processing[recipeId].finishTime - Date.now()) /
                (60 * 1000)
            );
            return api.sendMessage(
              `⏳ ${recipe.emoji} ${recipe.name} đang được chế biến!\n` +
                `⏱️ Hoàn thành sau: ${remaining} phút\n` +
                `💡 Quay lại sau để nhận sản phẩm.`,
              threadID,
              messageID
            );
          }

          for (const [item, amount] of Object.entries(requiredIngredients)) {
            userFarm.inventory[item] -= amount;
            if (userFarm.inventory[item] <= 0) {
              delete userFarm.inventory[item];
            }
          }

          userFarm.processing[recipeId] = {
            recipeId,
            quantity,
            startTime: Date.now(),
            finishTime: Date.now() + recipe.time * 1000,
            status: "processing",
          };

          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Bắt đầu chế biến ${quantity} ${recipe.emoji} ${recipe.name}!\n` +
              `⏱️ Thời gian: ${Math.floor(recipe.time / 60)} phút\n` +
              `💰 Giá trị: ${formatNumber(
                recipe.value * recipe.yield * quantity
              )} Xu\n` +
              `📊 Kinh nghiệm: +${recipe.exp * quantity} EXP\n\n` +
              `💡 Kiểm tra: .farm chế_biến_thu để nhận sản phẩm khi hoàn thành`,
            threadID,
            messageID
          );
        }

        case "chế_biến_thu":
        case "che_bien_thu":
        case "collect_processed": {
          if (
            !userFarm.processing ||
            Object.keys(userFarm.processing).length === 0
          ) {
            return api.sendMessage(
              `❌ Bạn không có sản phẩm nào đang được chế biến!`,
              threadID,
              messageID
            );
          }

          let completedRecipes = [];
          let pendingRecipes = [];
          let totalExp = 0;
          let message = "";

          for (const [recipeId, process] of Object.entries(
            userFarm.processing
          )) {
            const recipe = PROCESSING_RECIPES[recipeId];
            if (!recipe) continue;

            if (
              process.status === "processing" &&
              process.finishTime <= Date.now()
            ) {
              completedRecipes.push({
                recipe,
                process,
                totalValue: recipe.value * recipe.yield * process.quantity,
              });

              if (!userFarm.inventory) userFarm.inventory = {};
              if (!userFarm.inventory[recipe.name])
                userFarm.inventory[recipe.name] = 0;
              userFarm.inventory[recipe.name] +=
                recipe.yield * process.quantity;

              totalExp += recipe.exp * process.quantity;

              delete userFarm.processing[recipeId];
            } else if (process.status === "processing") {
              const remaining = Math.ceil(
                (process.finishTime - Date.now()) / (60 * 1000)
              );
              pendingRecipes.push({
                recipe,
                process,
                remaining,
              });
            }
          }

          userFarm.exp += totalExp;

          const oldLevel = calculateLevel(userFarm.exp - totalExp).level;
          const newLevel = calculateLevel(userFarm.exp).level;
          let levelUpMessage = "";

          if (newLevel > oldLevel) {
            const newLevelData = LEVELS[newLevel - 1];
            levelUpMessage =
              `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n` +
              `🏆 Danh hiệu mới: ${newLevelData.title}\n` +
              `💰 Phần thưởng: +${formatNumber(newLevelData.reward)} Xu\n`;

            await updateBalance(senderID, newLevelData.reward);

            if (newLevelData.plotSize > userFarm.plots.length) {
              const newPlotsCount =
                newLevelData.plotSize - userFarm.plots.length;
              levelUpMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

              for (let i = 0; i < newPlotsCount; i++) {
                userFarm.plots.push({
                  id: userFarm.plots.length,
                  status: "empty",
                  crop: null,
                  plantedAt: null,
                  water: 0,
                  lastWatered: null,
                });
              }
            }
          }

          saveFarmData(farmData);

          if (completedRecipes.length > 0) {
            message = `✅ CHẾ BIẾN HOÀN THÀNH!\n` + `━━━━━━━━━━━━━━━\n\n`;

            completedRecipes.forEach((item) => {
              message +=
                `${item.recipe.emoji} ${item.process.quantity} ${item.recipe.name} đã hoàn thành!\n` +
                `💰 Giá trị: ${formatNumber(item.totalValue)} Xu\n` +
                `📊 EXP: +${item.recipe.exp * item.process.quantity}\n\n`;
            });

            message +=
              `📦 Tất cả sản phẩm đã được thêm vào kho!\n` +
              `💡 Bán sản phẩm: .farm bán <tên_sản_phẩm> <số_lượng>`;
          } else if (pendingRecipes.length > 0) {
            message = `⏳ SẢN PHẨM ĐANG CHẾ BIẾN\n` + `━━━━━━━━━━━━━━━\n\n`;

            pendingRecipes.forEach((item) => {
              message +=
                `${item.recipe.emoji} ${item.process.quantity} ${item.recipe.name}\n` +
                `⏱️ Hoàn thành sau: ${item.remaining} phút\n\n`;
            });

            message += `💡 Quay lại sau để nhận sản phẩm.`;
          } else {
            return api.sendMessage(
              `❌ Không có sản phẩm nào đang chế biến!`,
              threadID,
              messageID
            );
          }

          message += levelUpMessage;
          return api.sendMessage(message, threadID, messageID);
        }
        case "kho":
        case "warehouse":
        case "inventory": {
          if (
            !userFarm.inventory ||
            Object.keys(userFarm.inventory).length === 0
          ) {
            return api.sendMessage(
              `❌ Kho hàng của bạn đang trống!\n` +
                `💡 Thu hoạch cây trồng và vật nuôi để có sản phẩm.`,
              threadID,
              messageID
            );
          }

          const categories = {
            crops: { name: "Nông sản", emoji: "🌾", items: {} },
            animal: { name: "Sản phẩm vật nuôi", emoji: "🥩", items: {} },
            processed: { name: "Sản phẩm chế biến", emoji: "🍲", items: {} },
            event: { name: "Vật phẩm sự kiện", emoji: "🎁", items: {} },
            other: { name: "Khác", emoji: "📦", items: {} },
          };

          let totalValue = 0;
          Object.entries(userFarm.inventory).forEach(([product, count]) => {
            if (count <= 0) return;

            let found = false;
            let productInfo = {
              name: product,
              emoji: "📦",
              price: 0,
              category: "other",
            };

            for (const cropId in CROPS) {
              if (CROPS[cropId].name.toLowerCase() === product.toLowerCase()) {
                productInfo = {
                  name: product,
                  emoji: CROPS[cropId].emoji,
                  price: CROPS[cropId].yield,
                  category: "crops",
                };
                found = true;
                break;
              }
            }

            if (!found) {
              for (const animalId in ANIMALS) {
                if (
                  ANIMALS[animalId].product.toLowerCase() ===
                  product.toLowerCase()
                ) {
                  productInfo = {
                    name: product,
                    emoji: ANIMALS[animalId].productEmoji,
                    price: ANIMALS[animalId].productPrice,
                    category: "animal",
                  };
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              const currentEvent = checkEvent();
              if (currentEvent && currentEvent.crops) {
                for (const cropId in currentEvent.crops) {
                  if (
                    currentEvent.crops[cropId].name.toLowerCase() ===
                    product.toLowerCase()
                  ) {
                    productInfo = {
                      name: product,
                      emoji: currentEvent.crops[cropId].emoji,
                      price: currentEvent.crops[cropId].yield,
                      category: "event",
                    };
                    found = true;
                    break;
                  }
                }
              }
            }

            categories[productInfo.category].items[product] = {
              count,
              emoji: productInfo.emoji,
              price: productInfo.price,
              value: count * productInfo.price,
            };

            totalValue += count * productInfo.price;
          });

          let message = `🏬 KHO HÀNG CỦA BẠN 🏬\n` + `━━━━━━━━━━━━━━\n\n`;

          let hasItems = false;
          for (const [catId, category] of Object.entries(categories)) {
            const items = Object.entries(category.items);
            if (items.length === 0) continue;

            hasItems = true;
            message += `${category.emoji} ${category.name.toUpperCase()}:\n`;

            items.forEach(([itemName, item]) => {
              message += `┣➤ ${item.emoji} ${itemName}: ${
                item.count
              } (${formatNumber(item.value)} Xu)\n`;
              if (item.count > 1) {
                message += `┃  💡 Bán tất cả: .farm bán ${itemName}\n`;
                message += `┃  💡 Bán một phần: .farm bán ${itemName} <số lượng>\n`;
              } else {
                message += `┃  💡 Bán: .farm bán ${itemName}\n`;
              }
            });
            message += `\n`;
          }

          message += `━━━━━━━━━━━━━━\n`;
          message += `💰 Tổng giá trị kho: ${formatNumber(totalValue)} Xu\n`;
          message += `📊 Số lượng vật phẩm: ${
            Object.keys(userFarm.inventory).length
          }\n`;
          message += `💡 Bán tất cả sản phẩm cùng loại: .farm bán <tên_sản_phẩm>\n`;
          message += `💡 Bán số lượng cụ thể: .farm bán <tên_sản_phẩm> <số_lượng>`;

          return api.sendMessage(message, threadID, messageID);
        }
        case "info":
        case "thông_tin": {
          const infoTarget = target[1]?.toLowerCase();

          if (infoTarget) {
            if (CROPS[infoTarget]) {
              const crop = CROPS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN CÂY TRỒNG\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${crop.emoji} Tên: ${crop.name}\n` +
                  `💰 Giá giống: ${formatNumber(crop.price)} Xu\n` +
                  `⏱️ Thời gian phát triển: ${
                    Math.floor(crop.time / 3600) > 0
                      ? `${Math.floor(crop.time / 3600)} giờ ${Math.floor(
                          (crop.time % 3600) / 60
                        )} phút`
                      : `${Math.floor(crop.time / 60)} phút`
                  }\n` +
                  `💧 Nước cần thiết: ${crop.water} lần tưới\n` +
                  `💵 Thu hoạch: ${formatNumber(crop.yield)} Xu\n` +
                  `📈 Lợi nhuận: ${formatNumber(
                    crop.yield - crop.price
                  )} Xu\n` +
                  `📊 Kinh nghiệm: ${crop.exp} EXP\n` +
                  `🏆 Cấp độ yêu cầu: ${crop.level}\n` +
                  `📝 Mô tả: ${crop.description}\n`,
                threadID,
                messageID
              );
            }

            if (ANIMALS[infoTarget]) {
              const animal = ANIMALS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN VẬT NUÔI\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${animal.emoji} Tên: ${animal.name}\n` +
                  `💰 Giá mua: ${formatNumber(animal.price)} Xu\n` +
                  `⏱️ Chu kỳ sản xuất: ${Math.floor(
                    animal.productTime / 3600
                  )} giờ\n` +
                  `🍲 Chi phí thức ăn: ${formatNumber(animal.feed)} Xu/lần\n` +
                  `${animal.productEmoji} Sản phẩm: ${animal.product}\n` +
                  `💵 Giá trị: ${formatNumber(animal.productPrice)} Xu\n` +
                  `📈 Lợi nhuận/ngày: ${formatNumber(
                    (24 / (animal.productTime / 3600)) * animal.productPrice -
                      (24 / (animal.productTime / 3600)) * animal.feed
                  )} Xu\n` +
                  `🏆 Cấp độ yêu cầu: ${animal.level}\n` +
                  `📝 Mô tả: ${animal.description}`,
                threadID,
                messageID
              );
            }

            if (SHOP_ITEMS[infoTarget]) {
              const item = SHOP_ITEMS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN VẬT PHẨM\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${item.emoji} Tên: ${item.name}\n` +
                  `💰 Giá mua: ${formatNumber(item.price)} Xu\n` +
                  `⏱️ Thời hạn: ${
                    item.duration
                      ? Math.floor(item.duration / (24 * 60 * 60 * 1000)) +
                        " ngày"
                      : "Vĩnh viễn"
                  }\n` +
                  `🔮 Hiệu ứng: ${item.description}\n` +
                  `🏆 Cấp độ yêu cầu: ${item.level}`,
                threadID,
                messageID
              );
            }

            return api.sendMessage(
              `❌ Không tìm thấy thông tin về "${target[1]}"!\n` +
                `💡 Hãy nhập đúng ID của cây trồng, vật nuôi hoặc vật phẩm.\n` +
                `→ Ví dụ: .farm info lua (Lúa)\n` +
                `→ Ví dụ: .farm info ga (Gà)`,
              threadID,
              messageID
            );
          }

          const level = calculateLevel(userFarm.exp);
          const nextLevel = level.level < 10 ? LEVELS[level.level] : null;

          let message =
            `〔 🌾 THÔNG TIN TRANG TRẠI 🌾 〕\n` +
            `┗━━━━━━━━━━━━━━┛\n\n` +
            `🏆 THÔNG TIN CHUNG\n` +
            `┏━━━━━━━━━━━━━━┓\n` +
            `┣➤ 👨‍🌾 Cấp độ: ${level.level} - ${level.title}\n` +
            `┣➤ 📊 EXP: ${userFarm.exp}/${
              nextLevel ? nextLevel.exp : "MAX"
            }\n` +
            `┃   ${"▰".repeat(
              Math.floor(
                ((userFarm.exp -
                  (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                  ((nextLevel ? nextLevel.exp : userFarm.exp) -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                  10
              )
            )}${"▱".repeat(
              10 -
                Math.floor(
                  ((userFarm.exp -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                    ((nextLevel ? nextLevel.exp : userFarm.exp) -
                      (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                    10
                )
            )}\n` +
            `┣➤ 🏡 Ngày thành lập: ${new Date(
              userFarm.createdAt
            ).toLocaleDateString("vi-VN")}\n` +
            `┗━━━━━━━━━━━━━━┛\n\n`;

          const weather = getCurrentWeather(senderID);
          message +=
            `🌤️ ĐIỀU KIỆN THỜI TIẾT\n` +
            `┏━━━━━━━━━━━━━━┓\n` +
            `┣➤ ${weather.emoji} ${weather.name}\n` +
            `┣➤ ${weather.description}\n` +
            `┗━━━━━━━━━━━━━━┛\n\n`;

          let plotsReady = 0;
          let plotsGrowing = 0;
          let plotsEmpty = 0;
          let plotsDamaged = 0;

          userFarm.plots.forEach((plot) => {
            if (plot.status === "ready") plotsReady++;
            else if (plot.status === "growing") plotsGrowing++;
            else if (plot.status === "empty") plotsEmpty++;
            else if (plot.status === "damaged") plotsDamaged++;
          });

          message +=
            `🌱 TÌNH HÌNH TRỒNG TRỌT\n` +
            `┏━━━━━━━━━━━━━┓\n` +
            `┣➤ Tổng số ô đất: ${userFarm.plots.length} ô\n` +
            `┣➤ 📊 Thống kê:\n` +
            `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
            `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
            `┃   ⚠️ Bị hư hỏng: ${plotsDamaged} ô\n` +
            `┃   🔲 Còn trống: ${plotsEmpty} ô\n`;

          const growingPlots = userFarm.plots.filter(
            (plot) => plot.status === "growing"
          );
          if (growingPlots.length > 0) {
            message += `┣➤ 🌿 CÂY ĐANG TRỒNG:\n`;

            const cropCounts = {};
            growingPlots.forEach((plot) => {
              if (!plot.crop) return;
              const cropId = plot.crop;
              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (cropConfig) {
                if (!cropCounts[cropId]) {
                  cropCounts[cropId] = {
                    count: 0,
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                  };
                }
                cropCounts[cropId].count++;
              }
            });

            Object.values(cropCounts).forEach((crop) => {
              message += `┃   ${crop.emoji} ${crop.name}: ${crop.count} ô\n`;
            });
          }
          message += `┗━━━━━━━━━━━━━┛\n\n`;

          const animalCount = Object.keys(userFarm.animals || {}).length;
          message +=
            `🐄 TÌNH HÌNH CHĂN NUÔI\n` +
            `┏━━━━━━━━━━━━━┓\n` +
            `┣➤ Tổng số vật nuôi: ${animalCount} con\n`;

          if (animalCount > 0) {
            message += `┣➤ 📊 THỐNG KÊ:\n`;

            const animalCounts = {};
            Object.entries(userFarm.animals || {}).forEach(([_, animal]) => {
              if (!animal.type) return;
              const animalType = animal.type;
              if (!animalCounts[animalType]) {
                animalCounts[animalType] = {
                  count: 0,
                  ready: 0,
                  name: ANIMALS[animalType]?.name || animalType,
                  emoji: ANIMALS[animalType]?.emoji || "🐾",
                };
              }
              animalCounts[animalType].count++;
              if (animal.productReady) animalCounts[animalType].ready++;
            });

            Object.values(animalCounts).forEach((animal) => {
              message += `┃   ${animal.emoji} ${animal.name}: ${animal.count} con (${animal.ready} sẵn sàng)\n`;
            });

            let estimatedDailyIncome = 0;
            Object.entries(animalCounts).forEach(([type, info]) => {
              if (ANIMALS[type]) {
                const animal = ANIMALS[type];
                const dailyYield = 24 / (animal.productTime / 3600);
                estimatedDailyIncome +=
                  dailyYield * animal.productPrice * info.count;
              }
            });
            message += `┣➤ 💰 Ước tính thu nhập/ngày: ${formatNumber(
              estimatedDailyIncome
            )} Xu\n`;
          }

          message += `┗━━━━━━━━━━━━━┛\n\n`;

          const inventoryEntries = Object.entries(userFarm.inventory || {});
          if (inventoryEntries.length > 0) {
            message += `🧺 KHO HÀNG\n` + `┏━━━━━━━━━━━━━┓\n`;

            let totalInventoryValue = 0;
            inventoryEntries.forEach(([item, quantity]) => {
              if (quantity <= 0) return;

              let emoji = "📦";
              let productPrice = 0;

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === item) {
                  emoji = ANIMALS[animalId].productEmoji;
                  productPrice = ANIMALS[animalId].productPrice;
                  break;
                }
              }

              const itemValue = quantity * productPrice;
              totalInventoryValue += itemValue;
              message += `┣➤ ${emoji} ${item}: ${quantity} (${formatNumber(
                itemValue
              )} Xu)\n`;
            });

            message +=
              `┣➤ 💰 Tổng giá trị: ${formatNumber(totalInventoryValue)} Xu\n` +
              `┗━━━━━━━━━━━━━━┛\n\n`;
          }

          const activeItems = Object.entries(userFarm.items || {}).filter(
            ([_, item]) =>
              item.active && (!item.expiry || item.expiry > Date.now())
          );

          if (activeItems.length > 0) {
            message += `🔮 VẬT PHẨM ĐANG SỬ DỤNG\n` + `┏━━━━━━━━━━━━━┓\n`;

            activeItems.forEach(([itemId, item]) => {
              const shopItem = SHOP_ITEMS[itemId];
              if (!shopItem) return;

              const timeLeft = item.expiry
                ? Math.max(
                    0,
                    Math.floor((item.expiry - Date.now()) / (60 * 60 * 1000))
                  )
                : "∞";

              message += `┣➤ ${shopItem.emoji} ${shopItem.name}: ${
                timeLeft === "∞" ? "Vĩnh viễn" : `${timeLeft} giờ còn lại`
              }\n`;
            });

            message += `┗━━━━━━━━━━━━━┛\n\n`;
          }

          const effects = applyItemEffects(userFarm);
          message += `🔄 HIỆU ỨNG ĐANG ÁP DỤNG\n` + `┏━━━━━━━━━━━━━━┓\n`;

          if (effects.growBoost !== 1) {
            message += `┣➤ ⏱️ Tăng tốc phát triển: ${Math.round(
              (1 - effects.growBoost) * 100
            )}%\n`;
          }

          if (effects.yieldBoost !== 1) {
            message += `┣➤ 🌿 Tăng sản lượng: ${Math.round(
              (effects.yieldBoost - 1) * 100
            )}%\n`;
          }

          if (effects.expBoost !== 1) {
            message += `┣➤ 📊 Tăng kinh nghiệm: ${Math.round(
              (effects.expBoost - 1) * 100
            )}%\n`;
          }

          if (effects.autoPlant) {
            message += `┣➤ 🌱 Tự động trồng lại cây sau thu hoạch\n`;
          }

          if (effects.autoPlant) {
            message += `┣➤ 🌱 Tự động trồng lại cây sau thu hoạch\n`;
          }

          if (effects.autoWater) {
            message += `┣➤ 💧 Tự động tưới cây mỗi 4 giờ\n`;
          }

          message +=
            `┗━━━━━━━━━━━━━━┛\n\n` +
            `💡 Xem chi tiết về cây/vật nuôi:\n→ .farm info <tên_cây/tên_vật_nuôi>`;
          return api.sendMessage(message, threadID, messageID);
        }

        case "tưới":
        case "tuoi":
        case "water": {
          const plotNumber = parseInt(target[1]) - 1;

          // Auto-water all plots when no specific plot is mentioned
          if (isNaN(plotNumber)) {
            // Find all plots that need watering
            let needWaterPlots = userFarm.plots.filter((plot) => {
              if (plot.status !== "growing") return false;

              const cropId = plot.crop;
              if (!cropId) return false;

              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (!cropConfig || cropConfig.water === 0) return false;
              return plot.water < cropConfig.water;
            });

            if (needWaterPlots.length === 0) {
              return api.sendMessage(
                `✅ Tất cả cây trồng đều đã được tưới đủ nước hoặc không cần tưới!`,
                threadID,
                messageID
              );
            }

            // Water all plots that need it
            let wateredCount = 0;
            let wateredCrops = {};

            needWaterPlots.forEach((plot) => {
              const cropId = plot.crop;
              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (cropConfig) {
                plot.water = Math.min(cropConfig.water, plot.water + 1);
                plot.lastWatered = Date.now();
                wateredCount++;

                // Track crops for message
                if (!wateredCrops[cropId]) {
                  wateredCrops[cropId] = {
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                    count: 0,
                  };
                }
                wateredCrops[cropId].count++;
              }
            });

            saveFarmData(farmData);

            // Generate message
            let message = `✅ Đã tưới nước cho ${wateredCount} ô đất thành công!\n\n`;
            message += `📋 CHI TIẾT:\n`;

            Object.values(wateredCrops).forEach((crop) => {
              message += `${crop.emoji} ${crop.name}: ${crop.count} ô\n`;
            });

            return api.sendMessage(message, threadID, messageID);
          }

          // Original code for watering a specific plot
          if (plotNumber < 0 || plotNumber >= userFarm.plots.length) {
            return api.sendMessage(
              `❌ Ô đất không tồn tại!\n` +
                `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
              threadID,
              messageID
            );
          }

          const plot = userFarm.plots[plotNumber];
          if (plot.status !== "growing") {
            return api.sendMessage(
              `❌ Ô đất ${plotNumber + 1} không có cây đang phát triển!`,
              threadID,
              messageID
            );
          }

          const cropConfig =
            CROPS[plot.crop] ||
            (checkEvent() && checkEvent().crops
              ? checkEvent().crops[plot.crop]
              : null);

          if (!cropConfig) {
            return api.sendMessage(
              `❌ Lỗi dữ liệu cây trồng!`,
              threadID,
              messageID
            );
          }

          if (cropConfig.water === 0) {
            return api.sendMessage(
              `❌ ${cropConfig.name} không cần tưới nước!`,
              threadID,
              messageID
            );
          }

          if (plot.water >= cropConfig.water) {
            return api.sendMessage(
              `❌ ${cropConfig.name} đã được tưới đủ nước!`,
              threadID,
              messageID
            );
          }

          plot.water = Math.min(cropConfig.water, plot.water + 1);
          plot.lastWatered = Date.now();

          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã tưới nước cho ${cropConfig.emoji} ${
              cropConfig.name
            } tại ô đất ${plotNumber + 1}!\n` +
              `💧 Nước hiện tại: ${Math.round(plot.water)}/${cropConfig.water}`,
            threadID,
            messageID
          );
        }

        case "thu":
        case "thu_hoach":
        case "harvest": {
          const plotNumber = parseInt(target[1]) - 1;

          if (isNaN(plotNumber)) {
            let readyPlots = userFarm.plots.filter(
              (plot) => plot.status === "ready"
            );

            if (readyPlots.length === 0) {
              return api.sendMessage(
                `❌ Không có cây nào sẵn sàng để thu hoạch!\n` +
                  `💡 Sử dụng .farm tưới để tưới nước cho cây trồng hoặc đợi cây phát triển.`,
                threadID,
                messageID
              );
            }

            let totalExp = 0;
            let harvestedCount = 0;
            let autoReplantCount = 0;
            let harvestDetails = {};

            try {
              for (const plot of readyPlots) {
                const cropId = plot.crop;
                if (!cropId) continue;

                let cropConfig = CROPS[cropId];
                if (!cropConfig) {
                  const currentEvent = checkEvent();
                  if (
                    currentEvent &&
                    currentEvent.crops &&
                    currentEvent.crops[cropId]
                  ) {
                    cropConfig = currentEvent.crops[cropId];
                  } else {
                    continue;
                  }
                }

                const effects = applyItemEffects(userFarm);

                const yieldAmount = Math.floor(
                  cropConfig.yield * effects.yieldBoost
                );
                const expAmount = Math.floor(cropConfig.exp * effects.expBoost);

                if (!userFarm.inventory) userFarm.inventory = {};

                const productName = cropConfig.name.toLowerCase();
                if (!userFarm.inventory[productName])
                  userFarm.inventory[productName] = 0;

                userFarm.inventory[productName]++;

                totalExp += expAmount;
                harvestedCount++;

                if (!harvestDetails[cropId]) {
                  harvestDetails[cropId] = {
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                    count: 0,
                    exp: 0,
                  };
                }
                harvestDetails[cropId].count++;
                harvestDetails[cropId].exp += expAmount;

                plot.status = "empty";
                plot.crop = null;
                plot.plantedAt = null;
                plot.water = 0;
                plot.lastWatered = null;

                if (effects.autoPlant) {
                  const userBalance = await getBalance(senderID);
                  if (userBalance >= cropConfig.price) {
                    await updateBalance(senderID, -cropConfig.price);
                    plot.status = "growing";
                    plot.crop = cropId;
                    plot.plantedAt = Date.now();
                    plot.water = cropConfig.water > 0 ? 1 : 0;
                    plot.lastWatered = Date.now();
                    autoReplantCount++;
                  }
                }
              }

              userFarm.exp += totalExp;

              const oldLevel = calculateLevel(userFarm.exp - totalExp).level;
              const newLevel = calculateLevel(userFarm.exp).level;

              saveFarmData(farmData);

              let message =
                `✅ THU HOẠCH THÀNH CÔNG!\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🌾 Đã thu hoạch: ${harvestedCount} cây trồng\n`;

              if (autoReplantCount > 0) {
                message += `🌱 Tự động trồng lại: ${autoReplantCount} cây\n`;
              }

              message += `\n📋 CHI TIẾT THU HOẠCH:\n`;

              Object.values(harvestDetails).forEach((details) => {
                message += `${details.emoji} ${details.name}: ${details.count} (vào kho), +${details.exp} EXP\n`;
              });

              message += `\n📊 Tổng kinh nghiệm: +${totalExp} EXP\n`;
              message += `📦 Sản phẩm đã được thêm vào kho!\n`;
              message += `💡 Xem kho: .farm kho\n`;

              if (newLevel > oldLevel) {
                const newLevelData = LEVELS[newLevel - 1];
                message += `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
                message += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
                message += `💰 Phần thưởng: +${formatNumber(
                  newLevelData.reward
                )} Xu\n`;

                if (newLevelData.plotSize > userFarm.plots.length) {
                  const newPlotsCount =
                    newLevelData.plotSize - userFarm.plots.length;
                  message += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

                  for (let i = 0; i < newPlotsCount; i++) {
                    userFarm.plots.push({
                      id: userFarm.plots.length,
                      status: "empty",
                      crop: null,
                      plantedAt: null,
                      water: 0,
                      lastWatered: null,
                    });
                  }

                  await updateBalance(senderID, newLevelData.reward);
                  saveFarmData(farmData);
                }
              }

              updateQuestProgress(senderID, "farm_harvest", harvestedCount);

              return api.sendMessage(message, threadID, messageID);
            } catch (error) {
              console.error("Error during mass harvest:", error);
              return api.sendMessage(
                `❌ Có lỗi xảy ra khi thu hoạch: ${error.message}\n` +
                  `💡 Hãy thử thu hoạch từng ô riêng: .farm thu [số ô]`,
                threadID,
                messageID
              );
            }
          }

          const plot = userFarm.plots[plotNumber];
          if (!plot) {
            return api.sendMessage(
              `❌ Ô đất số ${plotNumber + 1} không tồn tại!\n` +
                `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
              threadID,
              messageID
            );
          }

          if (plot.status !== "ready") {
            return api.sendMessage(
              `❌ Ô đất số ${plotNumber + 1} chưa sẵn sàng thu hoạch!\n` +
                `🌱 Trạng thái hiện tại: ${plot.status}`,
              threadID,
              messageID
            );
          }

          const cropId = plot.crop;
          if (!cropId) {
            return api.sendMessage(
              `❌ Lỗi dữ liệu: Không tìm thấy cây trồng trong ô ${
                plotNumber + 1
              }!`,
              threadID,
              messageID
            );
          }

          let cropConfig = CROPS[cropId];
          if (!cropConfig) {
            const currentEvent = checkEvent();
            if (
              currentEvent &&
              currentEvent.crops &&
              currentEvent.crops[cropId]
            ) {
              cropConfig = currentEvent.crops[cropId];
            } else {
              return api.sendMessage(
                `❌ Lỗi dữ liệu: Không tìm thấy thông tin về cây trồng!`,
                threadID,
                messageID
              );
            }
          }

          const effects = applyItemEffects(userFarm);
          const expAmount = Math.floor(cropConfig.exp * effects.expBoost);

          if (!userFarm.inventory) userFarm.inventory = {};

          const productName = cropConfig.name.toLowerCase();
          if (!userFarm.inventory[productName])
            userFarm.inventory[productName] = 0;

          userFarm.inventory[productName]++;
          userFarm.exp += expAmount;

          const oldLevel = calculateLevel(userFarm.exp - expAmount).level;
          const newLevel = calculateLevel(userFarm.exp).level;

          plot.status = "empty";
          plot.crop = null;
          plot.plantedAt = null;
          plot.water = 0;
          plot.lastWatered = null;

          let replantMessage = "";
          if (effects.autoPlant) {
            const userBalance = await getBalance(senderID);
            if (userBalance >= cropConfig.price) {
              await updateBalance(senderID, -cropConfig.price);
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
              replantMessage = `\n🌱 Đã tự động trồng lại ${cropConfig.name}!`;
            }
          }

          saveFarmData(farmData);

          let message =
            `✅ Thu hoạch thành công ${cropConfig.emoji} ${
              cropConfig.name
            } tại ô đất ${plotNumber + 1}!\n` +
            `📦 Đã thêm 1 ${cropConfig.name.toLowerCase()} vào kho!\n` +
            `📊 Kinh nghiệm: +${expAmount} EXP` +
            replantMessage;

          if (newLevel > oldLevel) {
            const newLevelData = LEVELS[newLevel - 1];
            message += `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
            message += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
            message += `💰 Phần thưởng: +${formatNumber(
              newLevelData.reward
            )} Xu\n`;

            if (newLevelData.plotSize > userFarm.plots.length) {
              const newPlotsCount =
                newLevelData.plotSize - userFarm.plots.length;
              message += `🌱 Mở khóa: ${newPlotsCount} ô đất mới`;

              for (let i = 0; i < newPlotsCount; i++) {
                userFarm.plots.push({
                  id: userFarm.plots.length,
                  status: "empty",
                  crop: null,
                  plantedAt: null,
                  water: 0,
                  lastWatered: null,
                });
              }
            }

            await updateBalance(senderID, newLevelData.reward);
            saveFarmData(farmData);
          }

          updateQuestProgress(senderID, "farm_harvest", 1);

          return api.sendMessage(message, threadID, messageID);
        }
        case "help":
        case "hướng_dẫn": {
          const helpPage = parseInt(target[1]) || 1;

          if (helpPage === 1) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🔰 TỔNG QUAN:\n` +
                `• Xây dựng và phát triển trang trại của riêng bạn\n` +
                `• Trồng cây, thu hoạch nông sản\n` +
                `• Chăn nuôi các loại vật nuôi\n` +
                `• Bán sản phẩm để kiếm xu\n` +
                `• Nâng cấp để mở khóa thêm đất và vật nuôi\n\n` +
                `📝 DANH SÁCH LỆNH:\n\n` +
                `🌱 TRỒNG TRỌT:\n` +
                `→ .farm - Xem trang trại của bạn\n` +
                `→ .farm trồng - Xem danh sách cây trồng\n` +
                `→ .farm trồng <cây> <số ô> - Trồng cây vào ô đất\n` +
                `→ .farm tưới - Tưới nước cho tất cả cây\n` +
                `→ .farm tưới <số ô> - Tưới nước cây cụ thể\n` +
                `→ .farm thu - Thu hoạch tất cả cây đã sẵn sàng\n` +
                `→ .farm thu <số ô> - Thu hoạch cây ở ô cụ thể\n\n` +
                `→ .farm help 2 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 2) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (2) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🐄 CHĂN NUÔI:\n` +
                `→ .farm cửa_hàng vật_nuôi - Xem và mua vật nuôi\n` +
                `→ .farm cho_ăn <loại> - Cho vật nuôi ăn\n` +
                `→ .farm thu_sản_phẩm - Thu thập sản phẩm từ vật nuôi\n\n` +
                `👨‍🍳 CHẾ BIẾN NÔNG SẢN:\n` +
                `→ .farm chế_biến - Xem các công thức chế biến\n` +
                `→ .farm chế_biến <món_ăn> <số_lượng> - Chế biến món ăn\n` +
                `→ .farm chế_biến_thu - Thu sản phẩm đã chế biến xong\n\n` +
                `💰 MUA SẮM & BÁN HÀNG:\n` +
                `→ .farm cửa_hàng - Xem các danh mục cửa hàng\n` +
                `→ .farm cửa_hàng cây - Mua giống cây trồng\n` +
                `→ .farm cửa_hàng vật_phẩm - Mua vật phẩm nâng cao\n` +
                `→ .farm bán - Xem kho hàng của bạn\n` +
                `→ .farm bán <sản phẩm> <số lượng> - Bán sản phẩm\n\n` +
                `→ .farm help 3 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 3) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (3) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `ℹ️ XEM THÔNG TIN:\n` +
                `→ .farm info - Xem chi tiết trang trại của bạn\n` +
                `→ .farm info <cây/vật nuôi> - Xem thông tin cụ thể\n\n` +
                `🌧️ THỜI TIẾT & SỰ KIỆN:\n` +
                `• Thời tiết thay đổi mỗi 6 giờ và ảnh hưởng đến cây trồng\n` +
                `• Sunny (Nắng): Cây sinh trưởng tốt, +10% sản lượng\n` +
                `• Rainy (Mưa): Tự động tưới cây, +5% sản lượng\n` +
                `• Cloudy (Âm u): Không có tác động đặc biệt\n` +
                `• Storm (Bão): Cây có thể bị hư hại, thu hoạch sớm\n` +
                `• Drought (Hạn hán): Nước bay hơi nhanh hơn\n\n` +
                `🎉 Sự kiện đặc biệt: Tết và Trung thu với cây trồng độc quyền!\n\n` +
                `→ .farm help 4 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 4) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (4) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🏆 HỆ THỐNG CẤP ĐỘ:\n` +
                `• Mỗi cấp độ mở khóa thêm cây trồng, vật nuôi mới\n` +
                `• Cấp độ càng cao, diện tích đất canh tác càng lớn\n` +
                `• Kinh nghiệm (EXP) nhận được khi thu hoạch cây\n` +
                `• Lên cấp nhận được phần thưởng xu\n\n` +
                `🔮 VẬT PHẨM ĐẶC BIỆT:\n` +
                `• Phân bón: Giảm 20% thời gian trồng trọt\n` +
                `• Thuốc sâu: Tăng 20% sản lượng thu hoạch\n` +
                `• Máy cày: Tự động trồng lại sau thu hoạch\n` +
                `• Hệ thống tưới: Tự động tưới nước mỗi 4 giờ\n` +
                `• Chuồng trại nâng cấp: Tăng số lượng vật nuôi tối đa\n` +
                `• Thức ăn gia súc: Tăng 30% sản lượng từ vật nuôi\n` +
                `• Giống cây cao cấp: Tăng 50% kinh nghiệm từ trồng trọt\n\n` +
                `💡 MẸO CHƠI:\n` +
                `• Tập trung vào cây ngắn ngày để tích lũy EXP nhanh\n` +
                `• Đầu tư vào vật nuôi để có thu nhập thụ động\n` +
                `• Mua các vật phẩm vĩnh viễn trước khi mua tạm thời\n` +
                `• Theo dõi thời tiết để tối ưu hóa thu hoạch`,
              threadID,
              messageID
            );
          } else {
            return api.sendMessage(
              `❌ Trang hướng dẫn không hợp lệ! Chỉ có trang 1-4.\n` +
                `→ Sử dụng: .farm help <số trang>`,
              threadID,
              messageID
            );
          }
        }
        case "cửa_hàng":
        case "shop": {
          const shopType = target[1]?.toLowerCase();
          const buyItem = target[2]?.toLowerCase();
          const currentLevel = calculateLevel(userFarm.exp).level;

          if (!shopType) {
            return api.sendMessage(
              "🏪 CỬA HÀNG NÔNG TRẠI 🏪\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1️⃣ Cây trồng:\n" +
                "→ .farm shop cây\n\n" +
                "2️⃣ Vật nuôi:\n" +
                "→ .farm shop vật_nuôi\n\n" +
                "3️⃣ Vật phẩm:\n" +
                "→ .farm shop vật_phẩm\n\n" +
                "4️⃣ Bán sản phẩm:\n" +
                "→ .farm bán <sản phẩm> <số lượng>",
              threadID,
              messageID
            );
          }

          if (
            shopType === "cây" ||
            shopType === "cay" ||
            shopType === "crops"
          ) {
            let message =
              "🌱 CỬA HÀNG HẠT GIỐNG 🌱\n" + "━━━━━━━━━━━━━━━━━━\n\n";

            const currentEvent = checkEvent();
            if (currentEvent && currentEvent.crops) {
              message += `🎉 GIỐNG CÂY SỰ KIỆN ${currentEvent.name}\n`;

              Object.entries(currentEvent.crops).forEach(([cropId, crop]) => {
                message += `\n${crop.emoji} ${crop.name}\n`;
                message += `💰 Giá: ${formatNumber(crop.price)} Xu\n`;
                message += `⏱️ Thời gian: ${
                  Math.floor(crop.time / 3600) > 0
                    ? `${Math.floor(crop.time / 3600)} giờ ${Math.floor(
                        (crop.time % 3600) / 60
                      )} phút`
                    : `${Math.floor(crop.time / 60)} phút`
                }\n`;
                message += `💵 Thu hoạch: ${formatNumber(crop.yield)} Xu\n`;
                message += `📈 Lợi nhuận: ${formatNumber(
                  crop.yield - crop.price
                )} Xu\n`;
                message += `💡 Mua: .farm trồng ${cropId} <số_ô>\n`;
              });

              message += "\n━━━━━━━━━━━━━━━━━━\n\n";
            }

            message += "📋 DANH SÁCH GIỐNG CÂY\n";

            const cropsByLevel = {};
            Object.entries(CROPS).forEach(([cropId, crop]) => {
              if (!cropsByLevel[crop.level]) {
                cropsByLevel[crop.level] = [];
              }
              cropsByLevel[crop.level].push({ id: cropId, ...crop });
            });

            for (let level = 1; level <= currentLevel; level++) {
              if (cropsByLevel[level]) {
                if (level > 1) message += "\n";
                message += `🌟 CẤP ĐỘ ${level}:\n`;

                cropsByLevel[level].forEach((crop) => {
                  message += `\n${crop.emoji} ${crop.name}\n`;
                  message += `💰 Giá: ${formatNumber(crop.price)} Xu\n`;
                  message += `⏱️ Thời gian: ${Math.floor(
                    crop.time / 60
                  )} phút\n`;
                  message += `💧 Nước: ${crop.water} lần\n`;
                  message += `💵 Thu hoạch: ${formatNumber(crop.yield)} Xu\n`;
                  message += `📈 Lợi nhuận: ${formatNumber(
                    crop.yield - crop.price
                  )} Xu\n`;
                  message += `💡 Mua: .farm trồng ${crop.id} <số_ô>\n`;
                });
              }
            }

            if (currentLevel < 10) {
              message += "\n🔒 CÂY TRỒNG KHÓA:\n";

              for (let level = currentLevel + 1; level <= 10; level++) {
                if (cropsByLevel[level]) {
                  cropsByLevel[level].forEach((crop) => {
                    message += `\n${crop.emoji} ${crop.name} (Cần cấp ${level})\n`;
                  });
                }
              }
            }

            return api.sendMessage(message, threadID, messageID);
          }

          // Handle animal shop
          if (
            shopType === "vật_nuôi" ||
            shopType === "vat_nuoi" ||
            shopType === "animals"
          ) {
            if (buyItem) {
              const animalConfig = ANIMALS[buyItem];
              if (!animalConfig) {
                return api.sendMessage(
                  `❌ Không tìm thấy vật nuôi "${target[2]}"!\n` +
                    `💡 Sử dụng .farm cửa_hàng vật_nuôi để xem danh sách.`,
                  threadID,
                  messageID
                );
              }

              if (animalConfig.level > currentLevel) {
                return api.sendMessage(
                  `❌ Bạn cần đạt cấp độ ${animalConfig.level} để mua ${animalConfig.name}!\n` +
                    `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
                  threadID,
                  messageID
                );
              }

              const balance = await getBalance(senderID);
              if (balance < animalConfig.price) {
                return api.sendMessage(
                  `❌ Bạn không đủ tiền để mua ${animalConfig.name}!\n` +
                    `💰 Giá: ${formatNumber(animalConfig.price)} Xu\n` +
                    `💵 Số dư: ${formatNumber(balance)} Xu`,
                  threadID,
                  messageID
                );
              }

              const effects = applyItemEffects(userFarm);
              const animalCount = Object.keys(userFarm.animals || {}).length;
              const maxAnimals = effects.animalCapacity;

              if (animalCount >= maxAnimals) {
                return api.sendMessage(
                  `❌ Trang trại của bạn đã đạt giới hạn vật nuôi!\n` +
                    `🐄 Số lượng hiện tại: ${animalCount}/${maxAnimals}\n` +
                    `💡 Nâng cấp chuồng trại để nuôi thêm vật nuôi.`,
                  threadID,
                  messageID
                );
              }

              await updateBalance(senderID, -animalConfig.price);

              if (!userFarm.animals) {
                userFarm.animals = {};
              }

              const animalId = Date.now().toString();
              userFarm.animals[animalId] = {
                id: animalId,
                type: buyItem,
                purchased: Date.now(),
                fed: false,
                lastFed: null,
                lastProduced: null,
                productReady: false,
              };

              saveFarmData(farmData);

              return api.sendMessage(
                `✅ Đã mua ${animalConfig.emoji} ${animalConfig.name} thành công!\n` +
                  `💰 Chi phí: -${formatNumber(animalConfig.price)} Xu\n` +
                  `🥫 Nhớ cho ăn thường xuyên: .farm cho_ăn ${buyItem}`,
                threadID,
                messageID
              );
            }

            let message =
              "🐄 CỬA HÀNG VẬT NUÔI 🐄\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "📋 DANH SÁCH VẬT NUÔI\n";

            const animalsByLevel = {};
            Object.entries(ANIMALS).forEach(([animalId, animal]) => {
              if (!animalsByLevel[animal.level]) {
                animalsByLevel[animal.level] = [];
              }
              animalsByLevel[animal.level].push({ id: animalId, ...animal });
            });

            for (let level = 1; level <= currentLevel; level++) {
              if (animalsByLevel[level]) {
                if (level > 1) message += "\n";
                message += `🌟 CẤP ĐỘ ${level}:\n`;

                animalsByLevel[level].forEach((animal) => {
                  const dailyProfit =
                    (24 / (animal.productTime / 3600)) * animal.productPrice -
                    (24 / (animal.productTime / 3600)) * animal.feed;

                  message += `\n${animal.emoji} ${animal.name}\n`;
                  message += `💰 Giá: ${formatNumber(animal.price)} Xu\n`;
                  message += `⏱️ Chu kỳ: ${Math.floor(
                    animal.productTime / 3600
                  )} giờ\n`;
                  message += `🍲 Thức ăn: ${formatNumber(animal.feed)}/lần\n`;
                  message += `${animal.productEmoji} Sản phẩm: ${
                    animal.product
                  } (${formatNumber(animal.productPrice)} Xu)\n`;
                  message += `📈 Lợi nhuận/ngày: ${formatNumber(
                    dailyProfit
                  )} Xu\n`;
                  message += `💡 Mua: .farm cửa_hàng vật_nuôi ${animal.id}\n`;
                });
              }
            }

            if (currentLevel < 10) {
              message += "\n🔒 VẬT NUÔI KHÓA:\n";

              for (let level = currentLevel + 1; level <= 10; level++) {
                if (animalsByLevel[level]) {
                  animalsByLevel[level].forEach((animal) => {
                    message += `\n${animal.emoji} ${animal.name} (Cần cấp ${level})\n`;
                  });
                }
              }
            }

            return api.sendMessage(message, threadID, messageID);
          }

          if (
            shopType === "vật_phẩm" ||
            shopType === "vat_pham" ||
            shopType === "items"
          ) {
            if (buyItem) {
              const itemConfig = SHOP_ITEMS[buyItem];
              if (!itemConfig) {
                return api.sendMessage(
                  `❌ Không tìm thấy vật phẩm "${target[2]}"!\n` +
                    `💡 Sử dụng .farm cửa_hàng vật_phẩm để xem danh sách.`,
                  threadID,
                  messageID
                );
              }

              if (itemConfig.level > currentLevel) {
                return api.sendMessage(
                  `❌ Bạn cần đạt cấp độ ${itemConfig.level} để mua ${itemConfig.name}!\n` +
                    `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
                  threadID,
                  messageID
                );
              }

              const balance = await getBalance(senderID);
              if (balance < itemConfig.price) {
                return api.sendMessage(
                  `❌ Bạn không đủ tiền để mua ${itemConfig.name}!\n` +
                    `💰 Giá: ${formatNumber(itemConfig.price)} Xu\n` +
                    `💵 Số dư: ${formatNumber(balance)} Xu`,
                  threadID,
                  messageID
                );
              }

              if (
                userFarm.items &&
                userFarm.items[buyItem] &&
                ((userFarm.items[buyItem].active &&
                  !userFarm.items[buyItem].expiry) ||
                  userFarm.items[buyItem].expiry > Date.now())
              ) {
                if (!itemConfig.duration && userFarm.items[buyItem].active) {
                  return api.sendMessage(
                    `❌ Bạn đã sở hữu ${itemConfig.name}!\n` +
                      `💡 Đây là vật phẩm vĩnh viễn, không thể mua thêm.`,
                    threadID,
                    messageID
                  );
                }
              }

              await updateBalance(senderID, -itemConfig.price);

              if (!userFarm.items) {
                userFarm.items = {};
              }

              userFarm.items[buyItem] = {
                purchased: Date.now(),
                active: true,
                effect: itemConfig.effect,
                expiry: itemConfig.duration
                  ? Date.now() + itemConfig.duration
                  : null,
              };

              saveFarmData(farmData);

              return api.sendMessage(
                `✅ Đã mua ${itemConfig.emoji} ${itemConfig.name} thành công!\n` +
                  `💰 Chi phí: -${formatNumber(itemConfig.price)} Xu\n` +
                  `⏱️ Thời hạn: ${
                    itemConfig.duration
                      ? Math.floor(
                          itemConfig.duration / (24 * 60 * 60 * 1000)
                        ) + " ngày"
                      : "Vĩnh viễn"
                  }\n` +
                  `🔮 Hiệu ứng: ${itemConfig.description}\n` +
                  `→ Hiệu ứng đã được áp dụng tự động!`,
                threadID,
                messageID
              );
            }

            let message =
              "🔮 CỬA HÀNG VẬT PHẨM 🔮\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "📋 DANH SÁCH VẬT PHẨM\n";

            const itemsByLevel = {};
            Object.entries(SHOP_ITEMS).forEach(([itemId, item]) => {
              if (!itemsByLevel[item.level]) {
                itemsByLevel[item.level] = [];
              }
              itemsByLevel[item.level].push({ id: itemId, ...item });
            });

            for (let level = 1; level <= currentLevel; level++) {
              if (itemsByLevel[level]) {
                if (level > 1) message += "\n";
                message += `🌟 CẤP ĐỘ ${level}:\n`;

                itemsByLevel[level].forEach((item) => {
                  const owned =
                    userFarm.items &&
                    userFarm.items[item.id] &&
                    userFarm.items[item.id].active &&
                    (!userFarm.items[item.id].expiry ||
                      userFarm.items[item.id].expiry > Date.now());

                  message += `\n${item.emoji} ${item.name} ${
                    owned ? "(Đã sở hữu)" : ""
                  }\n`;
                  message += `💰 Giá: ${formatNumber(item.price)} Xu\n`;
                  message += `⏱️ Thời hạn: ${
                    item.duration
                      ? Math.floor(item.duration / (24 * 60 * 60 * 1000)) +
                        " ngày"
                      : "Vĩnh viễn"
                  }\n`;
                  message += `🔮 Hiệu ứng: ${item.description}\n`;

                  if (!owned) {
                    message += `💡 Mua: .farm cửa_hàng vật_phẩm ${item.id}\n`;
                  }
                });
              }
            }

            if (currentLevel < 10) {
              message += "\n🔒 VẬT PHẨM KHÓA:\n";

              for (let level = currentLevel + 1; level <= 10; level++) {
                if (itemsByLevel[level]) {
                  itemsByLevel[level].forEach((item) => {
                    message += `\n${item.emoji} ${item.name} (Cần cấp ${level})\n`;
                  });
                }
              }
            }

            return api.sendMessage(message, threadID, messageID);
          }

          return api.sendMessage(
            "❌ Loại cửa hàng không hợp lệ!\n" +
              "💡 Sử dụng một trong các lệnh sau:\n" +
              "→ .farm cửa_hàng cây\n" +
              "→ .farm cửa_hàng vật_nuôi\n" +
              "→ .farm cửa_hàng vật_phẩm",
            threadID,
            messageID
          );
        }

        default:
          return api.sendMessage(
            "❌ Lệnh không hợp lệ!\n" +
              "💡 Sử dụng:\n" +
              "→ .farm - Xem trang trại\n" +
              "→ .farm trồng <cây trồng> <số ô> - Trồng cây\n" +
              "→ .farm tưới <số ô> - Tưới nước cho cây\n" +
              "→ .farm thu <số ô> - Thu hoạch\n" +
              "→ .farm cửa_hàng - Xem cửa hàng",
            threadID,
            messageID
          );
      }
    } catch (error) {
      console.error("Farm command error:", error);
      return api.sendMessage(
        "❌ Đã xảy ra lỗi khi xử lý lệnh farm! Vui lòng thử lại.",
        threadID,
        messageID
      );
    }
  },
};
