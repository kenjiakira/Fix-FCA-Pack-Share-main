module.exports = {
    treasures: [
        { name: "Hòm gỗ", value: 5000 },
        { name: "Rương bạc", value: 20000 },
        { name: "Rương vàng", value: 50000 },
        { name: "Kho báu cổ đại", value: 100000 }
    ],

    specialEvents: {
        doubleRewards: { name: "Mưa vàng", description: "Nhận đôi xu trong 5 phút!" },
        rareFish: { name: "Cá quý hiếm xuất hiện", description: "Tỉ lệ bắt cá hiếm tăng gấp đôi trong 5 phút!" },
        treasureHunt: { name: "Săn kho báu", description: "Cơ hội tìm thấy kho báu khi câu cá!" }
    },

    expMultipliers: {
        trash: 2,     
        common: 4,     
        uncommon: 8,   
        rare: 15,      
        legendary: 25,  
        mythical: 40,   
        cosmic: 60     
    },

    expRequirements: {
        baseExp: 1000,         
        multiplierPerLevel: 1.2, 
        maxLevel: 500         
    },

    levelRewards: {
        5: { reward: 20000, message: "🎉 Đạt cấp 5! Nhận 20,000 xu" },
        10: { reward: 50000, message: "🎉 Đạt cấp 10! Nhận 50,000 xu" },
        20: { reward: 200000, message: "🎉 Đạt cấp 20! Nhận 200,000 xu" },
        30: { reward: 500000, message: "🎉 Đạt cấp 30! Nhận 500,000 xu" },
        50: { reward: 1000000, message: "🎉 Đạt cấp 50! Nhận 1,000,000 xu" },
        75: { reward: 2000000, message: "🎉 Đạt cấp 75! Nhận 2,000,000 xu" },
        100: { reward: 5000000, message: "🎉 Đạt cấp 100! Nhận 5,000,000 xu" },
        150: { reward: 10000000, message: "🎉 Đạt cấp 150! Nhận 10,000,000 xu" },
        200: { reward: 20000000, message: "🎉 Đạt cấp 200! Nhận 20,000,000 xu" },
        300: { reward: 50000000, message: "🎉 Đạt cấp 300! Nhận 50,000,000 xu" },
        400: { reward: 100000000, message: "🎉 Đạt cấp 400! Nhận 100,000,000 xu" },
        500: { reward: 500000000, message: "🎉 Đạt cấp 500! Nhận 500,000,000 xu" }
    },

    streakBonuses: {
        5: 0.1, 
        10: 0.15, 
        20: 0.2,   
        50: 0.3,
        100: 0.5   
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