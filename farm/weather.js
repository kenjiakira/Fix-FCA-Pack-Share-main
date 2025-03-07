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