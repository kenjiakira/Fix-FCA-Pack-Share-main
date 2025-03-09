const COOLDOWNS = {
    normal: 10, 
    protected: 10 
};

const MARRIAGE_COST = 1000;
const DIVORCE_COST = 2000;

const CONTRACEPTIVES = {
    "bcs": {
        name: "🎈 Bao cao su",
        price: 500,
        description: "Tránh thai an toàn",
        duration: 30 
    },
    "vt": {
        name: "💊 Viên tránh thai",
        price: 1000,
        description: "Tránh thai hiệu quả",
        duration: 60
    }
};

const MEDICINES = {
    "thuoc_bo": {
        name: "💊 Thuốc bổ",
        price: 1000,
        description: "Tăng sức khỏe +20%",
        healthBoost: 20
    },
    "thuoc_ho": {
        name: "💊 Thuốc ho",
        price: 5000,
        description: "Tăng sức khỏe +10%",
        healthBoost: 10
    },
    "vitamin": {
        name: "💊 Vitamin tổng hợp",
        price: 2000,
        description: "Tăng sức khỏe +30%",
        healthBoost: 30
    }
};

const INSURANCE = {
    "bhyt_basic": {
        name: "🏥 BHYT Cơ bản",
        price: 5000,
        description: "Giảm 30% chi phí khám chữa bệnh",
        duration: 30, 
        discount: 30,
        type: "health"
    },
    "bhyt_premium": {
        name: "🏥 BHYT Cao cấp",
        price: 100000,
        description: "Giảm 50% chi phí khám chữa bệnh",
        duration: 30, 
        discount: 50,
        type: "health"
    },
    "car_basic": {
        name: "🚗 Bảo hiểm ô tô cơ bản",
        price: 10000,
        description: "Giảm 30% chi phí sửa chữa ô tô",
        duration: 30,
        discount: 30,
        type: "car"
    },
    "car_premium": {
        name: "🚗 Bảo hiểm ô tô cao cấp",
        price: 20000,
        description: "Giảm 50% chi phí sửa chữa ô tô",
        duration: 30,
        discount: 50,
        type: "car"
    },
    "bike_basic": {
        name: "🛵 Bảo hiểm xe máy cơ bản",
        price: 5000,
        description: "Giảm 30% chi phí sửa chữa xe máy",
        duration: 30,
        discount: 30,
        type: "bike"
    },
    "bike_premium": {
        name: "🛵 Bảo hiểm xe máy cao cấp",
        price: 10000,
        description: "Giảm 50% chi phí sửa chữa xe máy",
        duration: 30,
        discount: 50,
        type: "bike"
    }
};

module.exports = {
    MARRIAGE_COST,
    DIVORCE_COST,
    CONTRACEPTIVES,
    MEDICINES,
    INSURANCE,
    COOLDOWNS
};
