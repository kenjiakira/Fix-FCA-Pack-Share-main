module.exports = {
    locations: {
        "hcm": {
            name: "TP.HCM",
            priceMultiplier: 1.5,
            rentMultiplier: 1.3
        },
        "hn": {
            name: "Hà Nội",
            priceMultiplier: 1.3,
            rentMultiplier: 1.2
        },
        "dn": {
            name: "Đà Nẵng", 
            priceMultiplier: 1,
            rentMultiplier: 1
        }
    },

    propertyTypes: {
        "apartment": {
            name: "Chung cư",
            basePrice: 2000000,
            baseRent: 20000,
            appreciation: 0.05
        },
        "villa": {
            name: "Biệt thự",
            basePrice: 5000000,
            baseRent: 50000,
            appreciation: 0.1
        },
        "land": {
            name: "Đất nền",
            basePrice: 1000000,
            baseRent: 0,
            appreciation: 0.15
        }
    }
};
