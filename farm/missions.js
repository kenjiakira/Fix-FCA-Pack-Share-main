const DAILY_MISSIONS = {
    plant: {
      name: "Trồng cây",
      emoji: "🌱",
      descriptions: [
        { target: 3, reward: 5000, exp: 10, description: "Trồng 3 cây bất kỳ" },
        { target: 5, reward: 10000, exp: 20, description: "Trồng 5 cây bất kỳ" },
        {
          target: 10,
          reward: 25000,
          exp: 40,
          description: "Trồng 10 cây bất kỳ",
        },
      ],
      check: "plant_count",
    },
  
    harvest: {
      name: "Thu hoạch",
      emoji: "🌾",
      descriptions: [
        {
          target: 3,
          reward: 8000,
          exp: 15,
          description: "Thu hoạch 3 cây trồng",
        },
        {
          target: 5,
          reward: 15000,
          exp: 25,
          description: "Thu hoạch 5 cây trồng",
        },
        {
          target: 10,
          reward: 30000,
          exp: 50,
          description: "Thu hoạch 10 cây trồng",
        },
      ],
      check: "harvest_count",
    },
  
    feed: {
      name: "Cho ăn",
      emoji: "🥫",
      descriptions: [
        { target: 2, reward: 8000, exp: 15, description: "Cho 2 vật nuôi ăn" },
        { target: 4, reward: 16000, exp: 30, description: "Cho 4 vật nuôi ăn" },
      ],
      check: "feed_count",
    },
  
    collect: {
      name: "Thu thập sản phẩm",
      emoji: "🥚",
      descriptions: [
        {
          target: 3,
          reward: 10000,
          exp: 15,
          description: "Thu thập 3 sản phẩm từ vật nuôi",
        },
        {
          target: 5,
          reward: 20000,
          exp: 30,
          description: "Thu thập 5 sản phẩm từ vật nuôi",
        },
      ],
      check: "collect_count",
    },
  
    sell: {
      name: "Bán sản phẩm",
      emoji: "💰",
      descriptions: [
        {
          target: 5,
          reward: 7000,
          exp: 12,
          description: "Bán 5 sản phẩm bất kỳ",
        },
        {
          target: 10,
          reward: 15000,
          exp: 25,
          description: "Bán 10 sản phẩm bất kỳ",
        },
      ],
      check: "sell_count",
    },
  
    water: {
      name: "Tưới nước",
      emoji: "💧",
      descriptions: [
        {
          target: 5,
          reward: 5000,
          exp: 8,
          description: "Tưới nước cho 5 cây trồng",
        },
        {
          target: 10,
          reward: 12000,
          exp: 18,
          description: "Tưới nước cho 10 cây trồng",
        },
      ],
      check: "water_count",
    },
  
    process: {
      name: "Chế biến",
      emoji: "👨‍🍳",
      descriptions: [
        { target: 2, reward: 12000, exp: 20, description: "Chế biến 2 món ăn" },
        { target: 4, reward: 25000, exp: 40, description: "Chế biến 4 món ăn" },
      ],
      check: "process_count",
    },
  
    visit: {
      name: "Thăm trang trại",
      emoji: "👋",
      descriptions: [
        {
          target: 1,
          reward: 5000,
          exp: 10,
          description: "Thăm 1 trang trại khác",
        },
        {
          target: 2,
          reward: 15000,
          exp: 25,
          description: "Thăm 2 trang trại khác",
        },
      ],
      check: "visit_count",
    },
  };