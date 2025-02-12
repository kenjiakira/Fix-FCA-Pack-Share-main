module.exports = {
    CARS: {
        // Xe máy (v1-v3)
        "v1": { name: "Honda Wave Alpha", brand: "Honda", price: 18000000, type: "motorbike", speed: 100, durability: 85 },
        "v2": { name: "Honda Vision", brand: "Honda", price: 32000000, type: "motorbike", speed: 110, durability: 90 },
        "v3": { name: "Yamaha Exciter 155", brand: "Yamaha", price: 52000000, type: "motorbike", speed: 150, durability: 80 },

        // Xe hơi phổ thông (v4-v6)
        "v4": { name: "Toyota Vios", brand: "Toyota", price: 478000000, type: "car", speed: 180, durability: 95 },
        "v5": { name: "Mazda 3", brand: "Mazda", price: 669000000, type: "car", speed: 190, durability: 88 },
        "v6": { name: "Honda Civic", brand: "Honda", price: 730000000, type: "car", speed: 200, durability: 90 },

        // Xe sang (v7-v9)
        "v7": { name: "Mercedes C300 AMG", brand: "Mercedes", price: 2100000000, type: "luxury", speed: 250, durability: 95 },
        "v8": { name: "BMW 530i M Sport", brand: "BMW", price: 2499000000, type: "luxury", speed: 260, durability: 93 },
        "v9": { name: "Porsche 911 Carrera", brand: "Porsche", price: 7500000000, type: "supercar", speed: 300, durability: 85 },

        // Siêu xe (v10-v12)
        "v10": { name: "Ferrari 488 GTB", brand: "Ferrari", price: 16500000000, type: "supercar", speed: 330, durability: 80 },
        "v11": { name: "Lamborghini Huracán", brand: "Lamborghini", price: 19500000000, type: "supercar", speed: 340, durability: 75 },
        "v12": { name: "Bugatti Chiron", brand: "Bugatti", price: 69500000000, type: "hypercar", speed: 420, durability: 70 }
    },

    VEHICLE_TYPES: {
        motorbike: "Xe máy",
        car: "Xe hơi",
        luxury: "Xe sang",
        supercar: "Siêu xe",
        hypercar: "Hypercar"
    },

    BRANDS: {
        Honda: "🏍️",
        Yamaha: "🛵",
        Toyota: "🚗",
        Mazda: "🚙",
        Mercedes: "🏎️",
        BMW: "🏎️",
        Porsche: "🏎️",
        Ferrari: "🏎️",
        Lamborghini: "🏎️",
        Bugatti: "🏎️"
    },

    MAINTENANCE_COST: {
        motorbike: 0.02,  // 2% giá xe
        car: 0.05,        // 5% giá xe
        luxury: 0.08,     // 8% giá xe
        supercar: 0.1,    // 10% giá xe
        hypercar: 0.15    // 15% giá xe
    },

    DURABILITY_DECAY: {
        motorbike: 0.5,   // Giảm 0.5% mỗi ngày
        car: 0.3,         // Giảm 0.3% mỗi ngày
        luxury: 0.4,      // Giảm 0.4% mỗi ngày
        supercar: 0.6,    // Giảm 0.6% mỗi ngày
        hypercar: 0.8     // Giảm 0.8% mỗi ngày
    }
};
