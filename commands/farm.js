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
    time: 30 * 60,
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
    price: 70000,
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
    productPrice: 50000,
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
    feed: 25000,
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
    productPrice: 30000,
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
        yield: 300000,
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
        water: 0, // Không cần tưới
        description: "Bánh nướng nhân thập cẩm",
      },
    },
  },
};

// Hàm hỗ trợ
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
    return WEATHER_EFFECTS.sunny; // Default to sunny weather
  }

  try {
    const farmData = loadFarmData();
    if (!farmData || !farmData.farms) {
      console.error("Invalid farm data in getCurrentWeather");
      return WEATHER_EFFECTS.sunny;
    }

    const userFarm = farmData.farms[userID] || createUserFarm(userID);

    if (!userFarm.weather || Date.now() > userFarm.weather.nextChange) {
      // Đổi thời tiết mỗi 6 giờ
      const weatherTypes = Object.keys(WEATHER_EFFECTS);
      // Xác suất thời tiết (mưa và nắng phổ biến hơn)
      let weatherChances = [0.4, 0.4, 0.1, 0.05, 0.05]; // sunny, rainy, cloudy, storm, drought

      // Điều chỉnh xác suất theo mùa
      const date = new Date();
      const month = date.getMonth() + 1;

      if (month >= 5 && month <= 8) {
        // Mùa hè
        weatherChances = [0.5, 0.2, 0.1, 0.1, 0.1]; // Nhiều nắng và hạn hán hơn
      } else if (month >= 9 && month <= 11) {
        // Mùa thu
        weatherChances = [0.3, 0.4, 0.2, 0.05, 0.05];
      } else if (month == 12 || month <= 2) {
        // Mùa đông
        weatherChances = [0.2, 0.3, 0.4, 0.05, 0.05]; // Nhiều âm u hơn
      } else {
        // Mùa xuân
        weatherChances = [0.3, 0.4, 0.2, 0.1, 0]; // Nhiều mưa, không hạn hán
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
        nextChange: Date.now() + 6 * 60 * 60 * 1000, // 6 giờ
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
      // Khởi tạo dữ liệu mặc định
      const defaultData = {
        farms: {},
        lastUpdate: Date.now(),
      };
      fs.writeFileSync(farmDataPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = JSON.parse(fs.readFileSync(farmDataPath, "utf8"));

    // Ensure data structure is valid
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

    // Khởi tạo 4 ô đất đầu tiên
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

  // Safely handle items that might be undefined
  if (!userFarm.items) return effects;

  // Áp dụng hiệu ứng từ các vật phẩm
  for (const [itemId, item] of Object.entries(userFarm.items || {})) {
    if (!item || !item.active || (item.expiry && Date.now() > item.expiry)) {
      continue;
    }

    switch (item.effect) {
      case "grow_boost":
        effects.growBoost = 0.8; // Giảm 20% thời gian
        break;
      case "yield_boost":
        effects.yieldBoost = 1.2; // Tăng 20% sản lượng
        break;
      case "exp_boost":
        effects.expBoost = 1.5; // Tăng 50% kinh nghiệm
        break;
      case "animal_boost":
        effects.animalBoost = 1.3; // Tăng 30% sản lượng vật nuôi
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

  // Áp dụng hiệu ứng từ thời tiết - use a safer approach
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
              Math.round(Math.max(0, plot.water - waterDrainRate) * 10) / 10; // Round to 1 decimal place
          }

          if (weather && weather.waterFill) {
            const timeSinceLastUpdate =
              currentTime - (farmData.lastUpdate || currentTime);
            const waterFillRate =
              (weather.waterFill * timeSinceLastUpdate) / (1000 * 60 * 60);
            plot.water =
              Math.round(
                Math.min(cropConfig.water, plot.water + waterFillRate) * 10
              ) / 10; // Round to 1 decimal place
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

      // Cập nhật thời tiết
      if (farm.weather && currentTime > farm.weather.nextChange) {
        const weather = getCurrentWeather(userID);
        if (weather) {
          farm.weather = {
            type: weather.type,
            nextChange: currentTime + 6 * 60 * 60 * 1000, // 6 giờ
          };
        }
      }
    });

    // Cập nhật thời gian cập nhật cuối cùng
    farmData.lastUpdate = currentTime;
    saveFarmData(farmData);
  } catch (error) {
    console.error("Error in updateFarms:", error);
  }
}

async function generateFarmImage(userFarm) {
  try {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext("2d");
    const currentTime = Date.now();

    const bgImage = await loadImage(
      path.join(__dirname, "../cache/farm/farm_bg.jpg")
    );
    ctx.drawImage(bgImage, 0, 0, 800, 600);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, 800, 50);

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    const level = calculateLevel(userFarm.exp);
    ctx.fillText(`Trang trại Cấp ${level.level} - ${level.title}`, 20, 30);

    ctx.font = "16px Arial";
    ctx.fillText(
      `EXP: ${userFarm.exp}/${
        level.level < 10 ? LEVELS[level.level].exp : "MAX"
      }`,
      650,
      30
    );

    const plotSize = 100;
    const plotsPerRow = 6;
    let plotX = 50;
    let plotY = 100;
    let rowCount = 0;

    const cropImages = {};
    for (const cropId in CROPS) {
      try {
        cropImages[cropId] = await loadImage(
          path.join(__dirname, `../cache/farm/crops/${cropId}.png`)
        );
      } catch (err) {
        console.log(`Warning: Could not load image for crop ${cropId}`);

        cropImages[cropId] = await loadImage(
          path.join(__dirname, `../cache/farm/placeholder.png`)
        );
      }
    }

    for (let i = 0; i < userFarm.plots.length; i++) {
      if (i > 0 && i % plotsPerRow === 0) {
        plotX = 50;
        plotY += plotSize + 20;
        rowCount++;
      }

      const plot = userFarm.plots[i];

      ctx.fillStyle = "rgba(139, 69, 19, 0.7)";
      ctx.fillRect(plotX, plotY, plotSize, plotSize);
      ctx.strokeStyle = "black";
      ctx.strokeRect(plotX, plotY, plotSize, plotSize);

      if (plot.status !== "empty") {
        const cropImg = cropImages[plot.crop];
        if (cropImg) {
          ctx.drawImage(
            cropImg,
            plotX + 10,
            plotY + 10,
            plotSize - 20,
            plotSize - 20
          );
        }

        let statusText = "";
        let statusColor = "white";

        if (plot.status === "growing") {
          const cropConfig = CROPS[plot.crop];
          if (cropConfig) {
            const effects = applyItemEffects(userFarm);
            const growTime = cropConfig.time * 1000 * effects.growBoost;
            const progress = Math.min(
              100,
              Math.floor(((currentTime - plot.plantedAt) / growTime) * 100)
            );

            statusText = `${progress}%`;
            statusColor = progress < 50 ? "#ffcc00" : "#00cc00";

            const waterPercent = (plot.water / cropConfig.water) * 100;
            ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
            ctx.fillRect(
              plotX,
              plotY + plotSize - 10,
              plotSize * (waterPercent / 100),
              10
            );
          } else {
            statusText = "ERROR";
            statusColor = "#ff0000";
          }
        } else if (plot.status === "ready") {
          statusText = "SẴN SÀNG";
          statusColor = "#00ff00";
        } else if (plot.status === "damaged") {
          statusText = "HƯ HỎNG";
          statusColor = "#ff0000";
        }

        if (statusText) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(plotX, plotY + plotSize - 25, plotSize, 25);
          ctx.fillStyle = statusColor;
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(statusText, plotX + plotSize / 2, plotY + plotSize - 10);
          ctx.textAlign = "left";
        }

        // Draw crop name
        if (plot.crop) {
          const cropConfig = CROPS[plot.crop];
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(plotX, plotY, plotSize, 20);
          ctx.fillStyle = "white";
          ctx.font = "12px Arial";
          ctx.fillText(
            `${cropConfig.emoji} ${cropConfig.name}`,
            plotX + 5,
            plotY + 15
          );
        }
      } else {
        // Empty plot
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("+", plotX + plotSize / 2, plotY + plotSize / 2 + 8);
        ctx.textAlign = "left";

        ctx.font = "12px Arial";
        ctx.fillText(`Ô đất ${i + 1}`, plotX + 5, plotY + 15);
      }

      plotX += plotSize + 10;
    }

    // Draw weather info
    const weather = getCurrentWeather(userFarm.id);
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(600, 60, 180, 80);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`${weather.emoji} ${weather.name}`, 610, 80);
    ctx.font = "12px Arial";
    ctx.fillText(weather.description, 610, 100);

    // Draw current event if any
    const currentEvent = checkEvent();
    if (currentEvent) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.fillRect(50, 60, 180, 30);
      ctx.fillStyle = "white";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`🎉 ${currentEvent.name}`, 60, 80);
    }

    // Save the canvas to a file
    const outputPath = path.join(farmImagesDir, `farm_${userFarm.id}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  } catch (error) {
    console.error("Error generating farm image:", error);
    return null;
  }
}

module.exports = {
  name: "farm",
  dev: "HNT",
  usedby: 2,
  category: "Games",
  info: "Trồng trọt và chăn nuôi như ở nông thôn Việt Nam",
  onPrefix: true,
  usages: [
    "farm - xem trang trại",
    "farm trồng <cây trồng> <số ô> - trồng cây",
    "farm tưới - tưới nước cho cây",
    "farm thu <số ô> - thu hoạch cây ở ô cụ thể",
    "farm mua <vật nuôi/vật phẩm> - mua vật nuôi hoặc vật phẩm",
    "farm cho_ăn <loại> - cho vật nuôi ăn",
    "farm thu_sản_phẩm - thu thập sản phẩm từ vật nuôi",
    "farm bán <sản phẩm> <số lượng> - bán sản phẩm thu hoạch",
    "farm cửa_hàng - xem cửa hàng",
    "farm info <cây trồng/vật nuôi> - xem thông tin",
  ],
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

          const imagePath = await generateFarmImage(userFarm);

          const message = 
          `〔 🌾 NÔNG TRẠI AKI 🌾 〕\n` +
          `┣━━━━━━━━━━━━━━━━┫\n` +
          `┣➤ 👨‍🌾 Cấp độ: ${level.level} - ${level.title}\n` +
          `┣➤ 📊 EXP: ${userFarm.exp}/${nextLevel ? nextLevel.exp : "MAX"}\n` +
          `┃   ${"▰".repeat(Math.floor((userFarm.exp - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) / ((nextLevel ? nextLevel.exp : userFarm.exp) - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) * 10))}${"▱".repeat(10 - Math.floor((userFarm.exp - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) / ((nextLevel ? nextLevel.exp : userFarm.exp) - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) * 10))}\n` +
          `┣━━━━━━━━━━━━━━━━┫\n` +
          `┣➤ 🌱 ĐẤT TRỒNG: ${userFarm.plots.length} ô\n` +
          `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
          `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
          `┃   🔲 Còn trống: ${plotsEmpty} ô\n` +
          `┣➤ 🐄 VẬT NUÔI: ${Object.keys(userFarm.animals || {}).length} con\n` + 
          `┃   🧺 Sản phẩm sẵn sàng: ${animalProducts}\n` +
          `┣➤ 🌤️ THỜI TIẾT: ${WEATHER_EFFECTS[userFarm.weather.type].emoji} ${WEATHER_EFFECTS[userFarm.weather.type].name}\n` + 
          `┃   ${WEATHER_EFFECTS[userFarm.weather.type].description}\n` + 
          (currentEvent ? `┣➤ 🎉 SỰ KIỆN: ${currentEvent.name}\n┃   → Các loại cây đặc biệt có sẵn để trồng!\n` : "") +
          `┗━━━━━━━━━━━━━━━━┛\n\n` +
          `⚡ LỆNH NHANH:\n` +
          `→ .farm trồng - Xem danh sách cây trồng\n` +
          `→ .farm tưới - Tưới tất cả cây\n` +
          `→ .farm thu - Thu hoạch tất cả cây sẵn sàng\n` +
          `→ .farm info - Xem chi tiết trang trại\n` + 
          `→ .farm shop - Xem cửa hàng\n` +
          `→ .farm help - Xem hướng dẫn cách chơi`;

          if (imagePath) {
            await api.sendMessage(
              {
                body: message,
                attachment: fs.createReadStream(imagePath),
              },
              threadID,
              messageID
            );
          } else {
            await api.sendMessage(message, threadID, messageID);
          }

          try {
            if (imagePath) fs.unlinkSync(imagePath);
          } catch (err) {
            console.error("Error cleaning up farm image:", err);
          }
        } catch (error) {
          console.error("Farm display error:", error);
          return api.sendMessage(
            "❌ Có lỗi xảy ra khi hiển thị trang trại!",
            threadID,
            messageID
          );
        }
        return;
      }

      const command = target[0].toLowerCase();

      switch (command) {
        case "trồng":
        case "trong":
        case "plant": {
          const cropId = target[1]?.toLowerCase();
          const plotNumber = parseInt(target[2]) - 1;

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

          if (isNaN(plotNumber)) {
            return api.sendMessage(
              `❌ Vui lòng nhập số ô đất để trồng!\n` +
                `🌱 Cú pháp: .farm trồng ${cropId} <số ô>`,
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
          const productName = target[1]?.toLowerCase();
          let quantity = parseInt(target[2]);

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

              let emoji = "📦";
              let productPrice = 0;

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === product) {
                  emoji = ANIMALS[animalId].productEmoji;
                  productPrice = ANIMALS[animalId].productPrice;
                  break;
                }
              }

              message += `${emoji} ${product}: ${count} (${formatNumber(
                count * productPrice
              )} Xu)\n`;
              message += `💡 Bán: .farm bán ${product} <số_lượng>\n\n`;
            });

            return api.sendMessage(message, threadID, messageID);
          }

          if (!userFarm.inventory || !userFarm.inventory[productName]) {
            return api.sendMessage(
              `❌ Bạn không có sản phẩm "${productName}" trong kho!`,
              threadID,
              messageID
            );
          }

          const availableQuantity = userFarm.inventory[productName];

          if (isNaN(quantity) || quantity <= 0) {
            quantity = availableQuantity;
          }

          if (quantity > availableQuantity) {
            return api.sendMessage(
              `❌ Bạn chỉ có ${availableQuantity} ${productName} trong kho!`,
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
          `┣➤ 📊 EXP: ${userFarm.exp}/${nextLevel ? nextLevel.exp : "MAX"}\n` +
          `┃   ${"▰".repeat(Math.floor((userFarm.exp - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) / ((nextLevel ? nextLevel.exp : userFarm.exp) - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) * 10))}${"▱".repeat(10 - Math.floor((userFarm.exp - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) / ((nextLevel ? nextLevel.exp : userFarm.exp) - (level.level > 1 ? LEVELS[level.level-2].exp : 0)) * 10))}\n` +
          `┣➤ 🏡 Ngày thành lập: ${new Date(userFarm.createdAt).toLocaleDateString("vi-VN")}\n` +
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
        
          const growingPlots = userFarm.plots.filter(plot => plot.status === 'growing');
          if (growingPlots.length > 0) {
            message += `┣➤ 🌿 CÂY ĐANG TRỒNG:\n`;
            
            const cropCounts = {};
            growingPlots.forEach(plot => {
              if (!plot.crop) return;
              const cropId = plot.crop;
              const cropConfig = CROPS[cropId] || 
                  (checkEvent() && checkEvent().crops ? checkEvent().crops[cropId] : null);
                  
              if (cropConfig) {
                if (!cropCounts[cropId]) {
                  cropCounts[cropId] = {
                    count: 0,
                    name: cropConfig.name,
                    emoji: cropConfig.emoji
                  };
                }
                cropCounts[cropId].count++;
              }
            });          

            Object.values(cropCounts).forEach(crop => {
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
                      emoji: ANIMALS[animalType]?.emoji || "🐾"
                    };
                  }
                  animalCounts[animalType].count++;
                  if (animal.productReady) animalCounts[animalType].ready++;
                });
                

                Object.values(animalCounts).forEach(animal => {
                    message += `┃   ${animal.emoji} ${animal.name}: ${animal.count} con (${animal.ready} sẵn sàng)\n`;
                  });
                
                  let estimatedDailyIncome = 0;
                  Object.entries(animalCounts).forEach(([type, info]) => {
                    if (ANIMALS[type]) {
                      const animal = ANIMALS[type];
                      const dailyYield = (24 / (animal.productTime/3600));
                      estimatedDailyIncome += dailyYield * animal.productPrice * info.count;
                    }
                  });
                  message += `┣➤ 💰 Ước tính thu nhập/ngày: ${formatNumber(estimatedDailyIncome)} Xu\n`;
                }

                message += `┗━━━━━━━━━━━━━┛\n\n`;

                const inventoryEntries = Object.entries(userFarm.inventory || {});
                if (inventoryEntries.length > 0) {
                  message += 
                    `🧺 KHO HÀNG\n` +
                    `┏━━━━━━━━━━━━━┓\n`;
                  

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
              message += `┣➤ ${emoji} ${item}: ${quantity} (${formatNumber(itemValue)} Xu)\n`;
            });
            
            message += 
            `┣➤ 💰 Tổng giá trị: ${formatNumber(totalInventoryValue)} Xu\n` +
            `┗━━━━━━━━━━━━━━┛\n\n`;
        }        

        const activeItems = Object.entries(userFarm.items || {})
        .filter(([_, item]) => item.active && (!item.expiry || item.expiry > Date.now()));
        
  
        if (activeItems.length > 0) {
            message += 
              `🔮 VẬT PHẨM ĐANG SỬ DỤNG\n` +
              `┏━━━━━━━━━━━━━┓\n`;
            

              activeItems.forEach(([itemId, item]) => {
                const shopItem = SHOP_ITEMS[itemId];
                if (!shopItem) return;

                const timeLeft = item.expiry ? 
                Math.max(0, Math.floor((item.expiry - Date.now()) / (60 * 60 * 1000))) : 
                "∞";
                
                message += `┣➤ ${shopItem.emoji} ${shopItem.name}: ${timeLeft === "∞" ? "Vĩnh viễn" : `${timeLeft} giờ còn lại`}\n`;
            });

            message += `┗━━━━━━━━━━━━━┛\n\n`;
        }

        const effects = applyItemEffects(userFarm);
        message += 
          `🔄 HIỆU ỨNG ĐANG ÁP DỤNG\n` +
          `┏━━━━━━━━━━━━━━┓\n`;
        
          if (effects.growBoost !== 1) {
            message += `┣➤ ⏱️ Tăng tốc phát triển: ${Math.round((1 - effects.growBoost) * 100)}%\n`;
          }
          
          if (effects.yieldBoost !== 1) {
            message += `┣➤ 🌿 Tăng sản lượng: ${Math.round((effects.yieldBoost - 1) * 100)}%\n`;
          }
          
          if (effects.expBoost !== 1) {
            message += `┣➤ 📊 Tăng kinh nghiệm: ${Math.round((effects.expBoost - 1) * 100)}%\n`;
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

            let totalYield = 0;
            let totalExp = 0;
            let harvestedCount = 0;
            let autoReplantCount = 0;
            let harvestDetails = [];

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

                totalYield += yieldAmount;
                totalExp += expAmount;
                harvestedCount++;

                harvestDetails.push({
                  cropName: cropConfig.name,
                  emoji: cropConfig.emoji,
                  yield: yieldAmount,
                  exp: expAmount,
                });

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

              await updateBalance(senderID, totalYield);
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

              const groupedCrops = {};
              harvestDetails.forEach((details) => {
                if (!groupedCrops[details.cropName]) {
                  groupedCrops[details.cropName] = {
                    count: 0,
                    totalYield: 0,
                    totalExp: 0,
                    emoji: details.emoji,
                  };
                }
                groupedCrops[details.cropName].count++;
                groupedCrops[details.cropName].totalYield += details.yield;
                groupedCrops[details.cropName].totalExp += details.exp;
              });

              Object.entries(groupedCrops).forEach(([cropName, details]) => {
                message += `${details.emoji} ${cropName} x${
                  details.count
                }: +${formatNumber(details.totalYield)} Xu, +${
                  details.totalExp
                } EXP\n`;
              });

              message += `\n💰 Tổng thu nhập: +${formatNumber(
                totalYield
              )} Xu\n`;
              message += `📊 Tổng kinh nghiệm: +${totalExp} EXP`;

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
                }

                await updateBalance(senderID, newLevelData.reward);
                saveFarmData(farmData);
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

          return api.sendMessage(
            `❌ Không thể thu hoạch ô đất ${plotNumber + 1} (Trạng thái: ${
              plot.status
            })!`,
            threadID,
            messageID
          );
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
