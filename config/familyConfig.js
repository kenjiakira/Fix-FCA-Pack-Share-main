module.exports = {
    MARRIAGE_COST: 1000000,
    CHILD_COST: 500000,
    DIVORCE_COST: 2000000,
    
    DAILY_HAPPINESS_DECAY: 5,
    DAILY_CHILD_HAPPINESS_DECAY: 3,
    
    HOME_PRICES: {
        h1: { name: "Nhà trọ", xu: 500000, isRental: true, rentPeriod: 7 },          // ~500k/week
        h2: { name: "Căn hộ cho thuê", xu: 1500000, isRental: true, rentPeriod: 7 }, // ~1.5M/week
        h3: { name: "Nhà cấp 4", xu: 50000000, isRental: false },                     // 15M to buy
        h4: { name: "Nhà phố", xu: 100000000, isRental: false },                       // 50M to buy
        h5: { name: "Biệt thự", xu: 300000000, isRental: false },                     // 150M to buy
        h6: { name: "Khu compound", xu: 500000000, isRental: false }                  // 500M to buy
    },

    HOME_UPGRADES: {
        security: {
            name: "Hệ thống an ninh",
            description: "Lắp đặt camera và hệ thống báo động",
            cost: 200000,
            effects: {
                security: 20,
                happiness: 10
            }
        },
        furniture: {
            name: "Nội thất cao cấp", 
            description: "Trang bị nội thất sang trọng",
            cost: 500000,
            effects: {
                comfort: 30,
                luxury: 20,
                happiness: 15
            }
        },
        garden: {
            name: "Sân vườn",
            description: "Thiết kế cảnh quan sân vườn",
            cost: 300000,
            effects: {
                environment: 25,
                happiness: 10
            }
        }
    },

    ACTIVITIES: {
        date: {
            name: "Hẹn hò",
            cost: 50000,
            happinessGain: 15
        },
        vacation: {
            name: "Du lịch",
            cost: 200000, 
            happinessGain: 30
        },
        party: {
            name: "Tiệc gia đình",
            cost: 100000,
            happinessGain: 20
        }
    }
};
