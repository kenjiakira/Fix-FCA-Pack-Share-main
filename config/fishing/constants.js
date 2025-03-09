module.exports = {
    treasures: [
        { name: "Hòm gỗ", value: 500 },
        { name: "Rương bạc", value: 2000 },
        { name: "Rương vàng", value: 5000 },
        { name: "Kho báu cổ đại", value: 10000 },
        { name: "Rương kim cương", value: 25000 },
        { name: "Kho báu thần thoại", value: 50000 }
    ],

    specialEvents: {
        doubleRewards: { name: "Mưa vàng", description: "Nhận đôi xu trong 5 phút!" },
        rareFish: { name: "Cá quý hiếm xuất hiện", description: "Tỉ lệ bắt cá hiếm tăng gấp đôi trong 5 phút!" },
        treasureHunt: { name: "Săn kho báu", description: "Cơ hội tìm thấy kho báu khi câu cá!" },
        luckyStreak: { name: "May mắn liên tiếp", description: "Tăng gấp đôi EXP trong 5 phút!" }
    },

    expMultipliers: {
        trash: 2,     
        common: 4,     
        uncommon: 8,   
        rare: 15,      
        legendary: 25,  
        mythical: 40,   
        cosmic: 100     
    },

    expRequirements: {
        baseExp: 1000,         
        multiplierPerLevel: 1.2, 
        maxLevel: 500         
    },

    levelRewards: {
        5: { reward: 2000, message: "🎉 Đạt cấp 5! Nhận 20,000 xu" },
        10: { reward: 5000, message: "🎉 Đạt cấp 10! Nhận 50,000 xu" },
        20: { reward: 20000, message: "🎉 Đạt cấp 20! Nhận 200,000 xu" },
        30: { reward: 50000, message: "🎉 Đạt cấp 30! Nhận 500,000 xu" },
        50: { reward: 100000, message: "🎉 Đạt cấp 50! Nhận 1,000,000 xu" },
        75: { reward: 200000, message: "🎉 Đạt cấp 75! Nhận 2,000,000 xu" },
        100: { reward: 500000, message: "🎉 Đạt cấp 100! Nhận 5,000,000 xu" },
        150: { reward: 1000000, message: "🎉 Đạt cấp 150! Nhận 10,000,000 xu" },
        200: { reward: 2000000, message: "🎉 Đạt cấp 200! Nhận 20,000,000 xu" },
        300: { reward: 5000000, message: "🎉 Đạt cấp 300! Nhận 50,000,000 xu" },
        400: { reward: 10000000, message: "🎉 Đạt cấp 400! Nhận 100,000,000 xu" },
        500: { reward: 50000000, message: "🎉 Đạt cấp 500! Nhận 500,000,000 xu" }
    },

    streakBonuses: {
        5: 0.1,    // +10% bonus at 5 streak
        10: 0.15,  // +15% bonus at 10 streak
        20: 0.2,   // +20% bonus at 20 streak
        50: 0.3,   // +30% bonus at 50 streak
        100: 0.5,  // +50% bonus at 100 streak
        200: 0.75, // +75% bonus at 200 streak
        500: 1.0   // +100% bonus at 500 streak
    },

    defaultCollection: {
        byRarity: {
            trash: {},
            common: {},
            uncommon: {},
            rare: {},
            legendary: {},
            mythical: {},
            cosmic: {}
        },
        stats: {
            totalCaught: 0,
            totalValue: 0,
            bestCatch: { name: "", value: 0 }
        }
    }
};
