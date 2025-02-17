module.exports = {
    MARRIAGE_COST: 1000000,
    CHILD_COST: 500000,
    DIVORCE_COST: 2000000,
    
    DAILY_HAPPINESS_DECAY: 5,
    DAILY_CHILD_HAPPINESS_DECAY: 3,
    
    HOME_PRICES: {
        // NHÀ CHO THUÊ (Rental)
        h1: { 
            name: "Nhà trọ",
            xu: 5000000,
            isRental: true,
            rentPeriod: 30,
            size: 20,
            category: 'rental',
            baseStats: { security: 10, comfort: 10, environment: 5, luxury: 5 }
        },
        h2: { 
            name: "Căn hộ cho thuê",
            xu: 3000000,
            isRental: true,
            rentPeriod: 30,
            size: 45,
            category: 'rental',
            baseStats: { security: 20, comfort: 20, environment: 15, luxury: 15 }
        },

        // NHÀ CƠ BẢN (Basic)
        h3: { 
            name: "Nhà cấp 4",
            xu: 400000000,
            size: 60,
            category: 'basic',
            baseStats: { security: 30, comfort: 30, environment: 20, luxury: 10 }
        },
        h4: { 
            name: "Nhà phố",
            xu: 1500000000,
            size: 80,
            category: 'basic',
            baseStats: { security: 40, comfort: 40, environment: 30, luxury: 30 }
        },

        // NHÀ CAO CẤP (Luxury)
        h5: { 
            name: "Biệt thự",
            xu: 30000000000,
            size: 200,
            category: 'luxury',
            baseStats: { security: 60, comfort: 70, environment: 80, luxury: 70 }
        },
        h6: { 
            name: "Khu compound",
            xu: 80000000000,
            size: 350,
            category: 'premium',
            baseStats: { security: 90, comfort: 90, environment: 90, luxury: 90 }
        },

        // Có thể thêm các loại nhà mới ở đây
        h7: {
            name: "Penthouse",
            xu: 300000000000,
            size: 400,
            category: 'premium',
            baseStats: { security: 95, comfort: 95, environment: 85, luxury: 100 }
        }
    },

    HOME_UPGRADES: {
        // Nâng cấp cơ bản
        security: {
            name: "Hệ thống an ninh",
            description: "Camera, báo động, khóa thông minh",
            cost: 20000000,
            category: 'basic',
            effects: {
                security: 20,
                happiness: 10
            }
        },
        furniture: {
            name: "Nội thất cao cấp", 
            description: "Trang bị nội thất sang trọng",
            cost: 50000000,
            effects: {
                comfort: 30,
                luxury: 20,
                happiness: 15
            }
        },
        garden: {
            name: "Sân vườn",
            description: "Thiết kế cảnh quan sân vườn",
            cost: 30000000,
            effects: {
                environment: 25,
                happiness: 10
            }
        },
        // Nâng cấp cao cấp
        smart: {
            name: "Nhà thông minh",
            description: "Hệ thống điều khiển thông minh",
            cost: 100000000,
            category: 'premium',
            effects: {
                comfort: 40,
                luxury: 30,
                happiness: 20
            }
        },
        pool: {
            name: "Hồ bơi",
            description: "Hồ bơi riêng",
            cost: 200000000,
            category: 'luxury',
            requirements: ['h5', 'h6', 'h7'],
            effects: {
                luxury: 50,
                happiness: 30,
                environment: 20
            }
        }
    },

    // Thêm config cho các hiệu ứng đặc biệt
    HOME_EFFECTS: {
        HAPPINESS_BOOST: 1.5,    // Tăng 50% hạnh phúc cho nhà cao cấp
        COMFORT_BOOST: 1.3,      // Tăng 30% tiện nghi cho nhà thông minh
        MAX_UPGRADES: {
            rental: 2,           // Nhà thuê tối đa 2 nâng cấp
            basic: 4,            // Nhà cơ bản tối đa 4 nâng cấp
            luxury: 6,           // Nhà cao cấp tối đa 6 nâng cấp
            premium: 8           // Nhà premium tối đa 8 nâng cấp
        }
    },

    ACTIVITIES: {
        date: {
            name: "Hẹn hò",
            cost: 5000000,
            happinessGain: 15
        },
        vacation: {
            name: "Du lịch",
            cost: 20000000, 
            happinessGain: 30
        },
        party: {
            name: "Tiệc gia đình",
            cost: 10000000,
            happinessGain: 20
        }
    }
};
