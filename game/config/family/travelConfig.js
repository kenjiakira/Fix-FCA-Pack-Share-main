module.exports = {
    DESTINATIONS: {
        beach: {
            name: "🏖️ Bãi biển",
            basePrice: 1000000,
            description: "Nghỉ dưỡng tại bãi biển xinh đẹp",
            happiness: 10,
            duration: "3 ngày",
            priceMultipliers: {
                single: 1,
                couple: 1.8,
                perChild: 0.5
            }
        },
        mountain: {
            name: "⛰️ Núi rừng",
            basePrice: 2000000,
            description: "Khám phá thiên nhiên hoang dã",
            happiness: 15,
            duration: "4 ngày",
            priceMultipliers: {
                single: 1,
                couple: 1.8,
                perChild: 0.6
            }
        },
        resort: {
            name: "🏨 Khu nghỉ dưỡng",
            basePrice: 5000000,
            description: "Thư giãn tại resort cao cấp",
            happiness: 20,
            duration: "5 ngày",
            priceMultipliers: {
                single: 1,
                couple: 1.8,
                perChild: 0.7
            }
        },
        abroad: {
            name: "✈️ Du lịch nước ngoài",
            basePrice: 20000000,
            description: "Khám phá văn hóa nước ngoài",
            happiness: 30,
            duration: "7 ngày",
            priceMultipliers: {
                single: 1,
                couple: 1.8,
                perChild: 0.8
            }
        },
        cruise: {
            name: "🚢 Du thuyền",
            basePrice: 50000000,
            description: "Trải nghiệm du lịch trên biển",
            happiness: 40,
            duration: "10 ngày",
            priceMultipliers: {
                single: 1,
                couple: 1.8,
                perChild: 0.9
            }
        }
    },

    COOLDOWN: 7 * 24 * 60 * 60 * 1000, 
    
    MESSAGES: {
        onTrip: "Gia đình đang trong chuyến du lịch",
        cooldown: "Gia đình cần nghỉ ngơi sau chuyến đi",
        noMoney: "Không đủ tiền cho chuyến đi",
        success: "Chuyến đi thành công"
    }
};
