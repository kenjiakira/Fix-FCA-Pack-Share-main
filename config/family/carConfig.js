module.exports = {
    CARS: {
        "v1": { name: "Honda Wave Alpha", brand: "Honda", price: 18000, type: "motorbike", speed: 100, durability: 85 },
        "v2": { name: "Honda Vision", brand: "Honda", price: 32000, type: "motorbike", speed: 110, durability: 90 },
        "v3": { name: "Yamaha Exciter 155", brand: "Yamaha", price: 52000, type: "motorbike", speed: 150, durability: 80 },
        "v13": { name: "Honda Air Blade", brand: "Honda", price: 41000, type: "motorbike", speed: 115, durability: 88 },
        "v14": { name: "Honda SH Mode", brand: "Honda", price: 61000, type: "motorbike", speed: 120, durability: 92 },
        "v15": { name: "Yamaha NVX", brand: "Yamaha", price: 53000, type: "motorbike", speed: 135, durability: 85 },
        "v16": { name: "Piaggio Vespa", brand: "Piaggio", price: 70000, type: "motorbike", speed: 125, durability: 82 },
        "v17": { name: "Suzuki Raider", brand: "Suzuki", price: 49000, type: "motorbike", speed: 145, durability: 78 },
        "v4": { name: "Toyota Vios", brand: "Toyota", price: 478000, type: "car", speed: 180, durability: 95 },
        "v5": { name: "Mazda 3", brand: "Mazda", price: 669000, type: "car", speed: 190, durability: 88 },
        "v6": { name: "Honda Civic", brand: "Honda", price: 730000, type: "car", speed: 200, durability: 90 },
        "v18": { name: "Hyundai Accent", brand: "Hyundai", price: 426000, type: "car", speed: 175, durability: 94 },
        "v19": { name: "Kia Seltos", brand: "Kia", price: 589000, type: "car", speed: 185, durability: 92 },
        "v20": { name: "Mitsubishi Xpander", brand: "Mitsubishi", price: 555000, type: "car", speed: 170, durability: 96 },
        "v21": { name: "Ford Ranger", brand: "Ford", price: 650000, type: "car", speed: 195, durability: 97 },
        "v22": { name: "Toyota Fortuner", brand: "Toyota", price: 995000, type: "car", speed: 185, durability: 98 },
        "v23": { name: "Honda CR-V", brand: "Honda", price: 998000, type: "car", speed: 195, durability: 93 },
        "v24": { name: "VinFast VF e34", brand: "VinFast", price: 690000, type: "car", speed: 180, durability: 90 },
        "v7": { name: "Mercedes C300 AMG", brand: "Mercedes", price: 2100000, type: "luxury", speed: 250, durability: 95 },
        "v8": { name: "BMW 530i M Sport", brand: "BMW", price: 2499000, type: "luxury", speed: 260, durability: 93 },
        "v9": { name: "Porsche 911 Carrera", brand: "Porsche", price: 7500000, type: "supercar", speed: 300, durability: 85 },
        "v10": { name: "Ferrari 488 GTB", brand: "Ferrari", price: 16500000, type: "supercar", speed: 330, durability: 80 },
        "v11": { name: "Lamborghini Huracán", brand: "Lamborghini", price: 19500000, type: "supercar", speed: 340, durability: 75 },
        "v12": { name: "Bugatti Chiron", brand: "Bugatti", price: 69500000, type: "hypercar", speed: 420, durability: 70 }
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
        Bugatti: "🏎️",
        Hyundai: "🚗",
        Kia: "🚗",
        Mitsubishi: "🚗",
        Ford: "🚙",
        Suzuki: "🛵",
        Piaggio: "🛵",
        VinFast: "🚗"
    },

    MAINTENANCE_COST: {
        motorbike: 0.02,  
        car: 0.05,      
        luxury: 0.08,  
        supercar: 0.1,   
        hypercar: 0.15    
    },

    DURABILITY_DECAY: {
        motorbike: 0.5,   
        car: 0.3,       
        luxury: 0.4,     
        supercar: 0.6,   
        hypercar: 0.8     
    }
};
