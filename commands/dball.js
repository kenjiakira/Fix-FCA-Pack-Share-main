const fs = require("fs");
const path = require("path");
const createTrainImage = require("../game/canvas/dballTrainCanvas.js");
const createMenuImage = require("../game/canvas/dballMenuCanvas.js");
const createAmuletShopImage = require("../game/canvas/dballShopbuaCanvas.js");
const createLearnImage = require("../game/canvas/dballLearnCanvas.js");

function getFontPath(fontName) {
    return path.join(__dirname, "../fonts", fontName);
}


const DB_FOLDER = path.join(__dirname, "json", "dragonball");
const DB_FILE = path.join(DB_FOLDER, "players.json");
const DB_BALL_FILE = path.join(DB_FOLDER, "ball.json");
const TOURNAMENT_DB = path.join(DB_FOLDER, "tournaments.json");

const TOURNAMENT_TYPES = {
    TENKAICHI: {
        id: "tenkaichi",
        name: "Đại Hội Võ Thuật Thiên Hạ",
        description: "Giải đấu võ thuật danh giá nhất thế giới!",
        minPlayers: 4,
        maxPlayers: 16,
        entryFee: 10000,
        rewards: {
            first: { zeni: 100000, exp: 50000, item: "tournament_belt" },
            second: { zeni: 50000, exp: 25000 },
            semifinal: { zeni: 20000, exp: 10000 }
        },
        minPower: 50000,
        maxPower: 10000000000
    },
    CELL_GAMES: {
        id: "cell",
        name: "Cell Games",
        description: "Sống sót qua thử thách của Perfect Cell!",
        minPlayers: 4,
        maxPlayers: 8,
        entryFee: 20000,
        rewards: {
            first: { zeni: 200000, exp: 100000, item: "cell_medal" },
            second: { zeni: 80000, exp: 40000 },
            semifinal: { zeni: 30000, exp: 15000 }
        },
        minPower: 500000,
        maxPower: 10000000000
    },
    UNIVERSE: {
        id: "universe",
        name: "Giải Đấu Sức Mạnh",
        description: "Đấu trường giữa các vũ trụ với quy tắc khắc nghiệt!",
        minPlayers: 8,
        maxPlayers: 32,
        entryFee: 50000,
        rewards: {
            first: { zeni: 500000, exp: 200000, item: "universe_medal" },
            second: { zeni: 200000, exp: 100000 },
            semifinal: { zeni: 80000, exp: 40000 },
            quarterfinal: { zeni: 30000, exp: 20000 }
        },
        minPower: 5000000,
        maxPower: Infinity
    }
};

const CAMP_LEVELS = [
    {
        id: "wall_1",
        name: "Tường Thành 1",
        enemy: "Lính Độc Nhãn",
        hp: 5000,
        power: 2500,
        exp: 1500,
        zeni: 800,
        requiredPower: 10000,
        dropChance: 0.15,
        dropItem: "senzu"
    },
    {
        id: "wall_2",
        name: "Tường Thành 2",
        enemy: "Lính Độc Nhãn Cấp Cao",
        hp: 8000,
        power: 4000,
        exp: 2000,
        zeni: 1200,
        requiredPower: 20000,
        dropChance: 0.15,
        dropItem: "crystal"
    },
    {
        id: "wall_3",
        name: "Tường Thành 3",
        enemy: "Lính Độc Nhãn Tinh Nhuệ",
        hp: 12000,
        power: 6000,
        exp: 3000,
        zeni: 1800,
        requiredPower: 30000,
        dropChance: 0.2,
        dropItem: "senzu"
    },
    {
        id: "camp_1",
        name: "Trại Độc Nhãn 1",
        enemy: "Lính Canh Trại",
        hp: 18000,
        power: 9000,
        exp: 4000,
        zeni: 2500,
        requiredPower: 50000,
        dropChance: 0.2,
        dropItem: "crystal"
    },
    {
        id: "camp_2",
        name: "Trại Độc Nhãn 2",
        enemy: "Biệt Đội Tuần Tra",
        hp: 25000,
        power: 12500,
        exp: 5000,
        zeni: 3000,
        requiredPower: 80000,
        dropChance: 0.25,
        dropItem: "senzu"
    },
    {
        id: "camp_3",
        name: "Trại Độc Nhãn 3",
        enemy: "Đội Đặc Nhiệm",
        hp: 35000,
        power: 17000,
        exp: 6000,
        zeni: 4000,
        requiredPower: 100000,
        dropChance: 0.25,
        dropItem: "armor"
    },
    {
        id: "floor_1",
        name: "Tầng 1",
        enemy: "Trung Úy Trắng",
        hp: 50000,
        power: 25000,
        exp: 8000,
        zeni: 6000,
        requiredPower: 150000,
        dropChance: 0.3,
        dropItem: "scouter"
    },
    {
        id: "floor_2",
        name: "Tầng 2",
        enemy: "Trung Úy Xanh Lơ",
        hp: 70000,
        power: 35000,
        exp: 10000,
        zeni: 8000,
        requiredPower: 200000,
        dropChance: 0.3,
        dropItem: "crystal"
    },
    {
        id: "floor_3",
        name: "Tầng 3",
        enemy: "Robot Vệ Sĩ",
        hp: 100000,
        power: 50000,
        exp: 15000,
        zeni: 12000,
        requiredPower: 300000,
        dropChance: 0.35,
        dropItem: "senzu"
    },
    {
        id: "floor_4",
        name: "Tầng 4",
        enemy: "Tướng Quân Độc Nhãn",
        hp: 150000,
        power: 75000,
        exp: 20000,
        zeni: 18000,
        requiredPower: 500000,
        dropChance: 0.35,
        dropItem: "armor"
    },
    {
        id: "lab",
        name: "Tầng 5 - Phòng Thí Nghiệm",
        enemy: "Tiến Sĩ Độc Nhãn",
        hp: 200000,
        power: 100000,
        exp: 25000,
        zeni: 25000,
        requiredPower: 800000,
        dropChance: 0.4,
        dropItem: "crystal"
    },
    {
        id: "prison",
        name: "Tầng 6 - Nhà Giam Tối Tăm",
        enemy: "Đao Phủ Máy",
        hp: 300000,
        power: 150000,
        exp: 30000,
        zeni: 35000,
        requiredPower: 1200000,
        dropChance: 0.4,
        dropItem: "senzu"
    },
    {
        id: "armory",
        name: "Tầng 7 - Kho Vũ Khí",
        enemy: "Siêu Chiến Binh Độc Nhãn",
        hp: 500000,
        power: 250000,
        exp: 40000,
        zeni: 50000,
        requiredPower: 2000000,
        dropChance: 0.45,
        dropItem: "crystal"
    },
    {
        id: "command",
        name: "Tầng 8 - Phòng Chỉ Huy",
        enemy: "Đại Tướng Độc Nhãn",
        hp: 1000000,
        power: 500000,
        exp: 50000,
        zeni: 100000,
        requiredPower: 5000000,
        dropChance: 0.5,
        dropItem: "radar"
    }
];

const AMULETS = {
    IMMORTAL: {
        id: "immortal_amulet",
        name: "Bùa Bất Tử",
        price: 50000,
        description: "Không chết khi đánh quái trong 1 ngày",
        effect: "immortal",
        duration: 86400000,
        emoji: "🧿"
    },
    POWER: {
        id: "power_amulet",
        name: "Bùa Sức Mạnh",
        price: 35000,
        description: "Tăng 50% sức đánh trong 1 ngày",
        effect: "damage_boost",
        boost: 1.5,
        duration: 86400000,
        emoji: "💪"
    },
    DEFENSE: {
        id: "defense_amulet",
        name: "Bùa Da Trâu",
        price: 40000,
        description: "Tăng 50% HP trong 1 ngày",
        effect: "health_boost",
        boost: 1.5,
        duration: 86400000,
        emoji: "🛡️"
    },
    ENERGY: {
        id: "energy_amulet",
        name: "Bùa Năng Lượng",
        price: 35000,
        description: "Tăng 50% Ki trong 1 ngày",
        effect: "ki_boost",
        boost: 1.5,
        duration: 86400000,
        emoji: "⚡"
    },
    WISDOM: {
        id: "wisdom_amulet",
        name: "Bùa Trí Tuệ",
        price: 45000,
        description: "Tăng 100% Exp nhận được trong 1 ngày",
        effect: "exp_boost",
        boost: 2.0,
        duration: 86400000,
        emoji: "🧠"
    }
};

const DRAGON_WISHES = {
    ZENI: {
        name: "Túi 𝗭𝗲𝗻𝗶 khổng lồ",
        reward: "5,000,000 Zeni",
        effect: (player) => {
            player.stats.zeni += 5000000;
        }
    },
    POWER: {
        name: "𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 vô hạn",
        reward: "200,000,000 sức mạnh",
        effect: (player) => {
            player.stats.power += 200000000;
        }
    },
    EXP: {
        name: "Kinh nghiệm chiến đấu",
        reward: "1,000,000 EXP",
        effect: (player) => {
            if (player.stats.exp + 1000000 > MAX_EXP_STORAGE) {
                player.stats.exp = MAX_EXP_STORAGE;
            } else {
                player.stats.exp += 1000000;
            }
        }
    }
};
function hasAllDragonBalls(player, planet) {
    if (!player.inventory || !player.inventory.dragonBalls) return false;

    const planetBalls = player.inventory.dragonBalls.filter(ball => ball.planet === planet);

    if (planetBalls.length === 7) {
        const stars = planetBalls.map(ball => ball.star).sort((a, b) => a - b);
        if (stars.join(",") === "1,2,3,4,5,6,7") return true;
    }

    return false;
}

function removeDragonBalls(player, planet) {
    if (!player.inventory || !player.inventory.dragonBalls) return;

    player.inventory.dragonBalls = player.inventory.dragonBalls.filter(ball => ball.planet !== planet);
}

const SHOP_ITEMS = {
    SENZU: {
        id: "senzu",
        name: "Đậu Thần",
        price: 5000,
        description: "Hồi phục toàn bộ HP KI và tăng 5% sức mạnh",
        type: "consumable",
        emoji: "🌱"
    },
    SCOUTER: {
        id: "scouter",
        name: "Thiết Bị Đo Sức Mạnh",
        price: 10000,
        description: "Tăng 10% Ki khi đeo trong 1 giờ",
        type: "equipment",
        emoji: "🔋",
        duration: 3600000
    },
    DRAGON_RADAR: {
        id: "radar",
        name: "Rada Dò Ngọc Rồng",
        price: 75000,
        description: "Tăng tỷ lệ tìm thấy Ngọc Rồng lên 3 lần trong 1 giờ",
        type: "equipment",
        emoji: "📡",
        duration: 3600000
    },
    ARMOR: {
        id: "armor",
        name: "Áo Giáp Saiyan",
        price: 15000,
        description: "Tăng 15% HP trong 1 giờ",
        type: "equipment",
        emoji: "🛡️",
        duration: 3600000
    },
    POWER_CRYSTAL: {
        id: "crystal",
        name: "Tinh Thể Sức Mạnh",
        price: 50000,
        description: "Tăng vĩnh viễn 1000 sức mạnh",
        type: "special",
        emoji: "💎"
    }
};
const QUEST_TYPES = {
    COMBAT: "combat",
    POWER: "power",
    TRAINING: "training",
    COLLECT: "collect",
    MASTER: "master"
};

const PLANET_THEME_COLORS = {
    EARTH: {
        primary: "#4080FF",
        secondary: "#80C0FF",
        accent: "#0040C0"
    },
    NAMEK: {
        primary: "#40C040",
        secondary: "#80FF80",
        accent: "#008000"
    },
    SAIYAN: {
        primary: "#FF8000",
        secondary: "#FFC080",
        accent: "#C04000"
    }
};
const PLANET_QUEST_PROGRESSION = {
    EARTH: [
        "BEGINNER_1",
        "BEGINNER_2",
        "EARTH_WOLF",
        "BASIC_TRAINING",
        "EARTH_SAIBAMEN",
        "EARTH_RED_RIBBON",
        "POWER_LV1",
        "POWER_LV2",
        "EARTH_TAMBOURINE",
        "DRAGON_BALL_1",
        "EARTH_ANDROID19",
        "TOURNAMENT_BEGINNER",
        "TOURNAMENT_TENKAICHI",
        "TOURNAMENT_UNIVERSE",
        "EARTH_CELL_JR",
        "DRAGON_BALL_ALL"
    ],
    NAMEK: [
        "BEGINNER_1",
        "BEGINNER_2",
        "NAMEK_APPULE",
        "BASIC_TRAINING",
        "NAMEK_SOLDIER",
        "NAMEK_WARRIOR",
        "POWER_LV1",
        "NAMEK_DODORIA",
        "DRAGON_BALL_1",
        "NAMEK_ZARBON",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",
        "TOURNAMENT_TENKAICHI",
        "TOURNAMENT_UNIVERSE",
        "NAMEK_GINYU",
        "NAMEK_BOSS",
        "DRAGON_BALL_ALL"
    ],
    SAIYAN: [
        "BEGINNER_1",
        "BEGINNER_2",
        "SAIYAN_RADITZ",
        "BASIC_TRAINING",
        "SAIYAN_NAPPA",
        "SAIYAN_WARRIOR",
        "POWER_LV1",
        "SAIYAN_ELITE",
        "DRAGON_BALL_1",
        "SAIYAN_TURLES",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",
        "TOURNAMENT_TENKAICHI",
        "TOURNAMENT_UNIVERSE",
        "SAIYAN_BROLY",
        "SAIYAN_BOSS",
        "DRAGON_BALL_ALL"
    ]
};
const QUESTS = {
    EARTH_RED_RIBBON: {
        id: "EARTH_RED_RIBBON",
        name: "Quân Đội Rồng Đỏ",
        description: "Đánh bại 10 Lính Rồng Đỏ",
        type: QUEST_TYPES.COMBAT,
        target: 10,
        monster: "red_ribbon_soldier",
        reward: {
            exp: 2500,
            zeni: 3000,
            description: "2500 EXP, 3000 Zeni"
        },
        requiredLevel: 5
    },
    EARTH_TAMBOURINE: {
        id: "EARTH_TAMBOURINE",
        name: "Thuộc hạ của Quỷ Vương",
        description: "Đánh bại 6 Tambourine",
        type: QUEST_TYPES.COMBAT,
        target: 6,
        monster: "tambourine",
        reward: {
            exp: 6000,
            zeni: 8000,
            item: "senzu",
            quantity: 3,
            description: "6000 EXP, 8000 Zeni, 3 Đậu Thần"
        },
        requiredLevel: 10
    },
    EARTH_ANDROID19: {
        id: "EARTH_ANDROID19",
        name: "Cỗ máy hấp thụ",
        description: "Đánh bại 3 Android 19",
        type: QUEST_TYPES.COMBAT,
        target: 3,
        monster: "android19",
        reward: {
            exp: 9000,
            zeni: 15000,
            item: "crystal",
            quantity: 2,
            description: "9000 EXP, 15000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
        requiredLevel: 18
    },
    EARTH_CELL_JR: {
        id: "EARTH_CELL_JR",
        name: "Con cái hoàn hảo",
        description: "Đánh bại 5 Cell Jr.",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "cell_jr",
        reward: {
            exp: 12000,
            zeni: 20000,
            item: "armor",
            quantity: 1,
            description: "12000 EXP, 20000 Zeni, 1 Áo Giáp Saiyan"
        },
        requiredLevel: 25
    },


    NAMEK_WARRIOR: {
        id: "NAMEK_WARRIOR",
        name: "Chiến binh xanh lá",
        description: "Đánh bại 8 Chiến Binh Namek",
        type: QUEST_TYPES.COMBAT,
        target: 8,
        monster: "namekian_warrior",
        reward: {
            exp: 2000,
            zeni: 3500,
            description: "2000 EXP, 3500 Zeni"
        },
        requiredLevel: 5
    },
    NAMEK_DODORIA: {
        id: "NAMEK_DODORIA",
        name: "Kẻ hầu cận hồng",
        description: "Đánh bại 5 Dodoria",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "dodoria",
        reward: {
            exp: 6500,
            zeni: 9000,
            item: "senzu",
            quantity: 3,
            description: "6500 EXP, 9000 Zeni, 3 Đậu Thần"
        },
        requiredLevel: 10
    },
    NAMEK_ZARBON: {
        id: "NAMEK_ZARBON",
        name: "Thân tín của Frieza",
        description: "Đánh bại 4 Zarbon",
        type: QUEST_TYPES.COMBAT,
        target: 4,
        monster: "zarbon",
        reward: {
            exp: 8000,
            zeni: 12000,
            item: "crystal",
            quantity: 2,
            description: "8000 EXP, 12000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
        requiredLevel: 15
    },
    NAMEK_GINYU: {
        id: "NAMEK_GINYU",
        name: "Đội đặc nhiệm tinh nhuệ",
        description: "Đánh bại 3 thành viên Đội Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 3,
        monster: "ginyu_force",
        reward: {
            exp: 10000,
            zeni: 18000,
            item: "scouter",
            quantity: 1,
            description: "10000 EXP, 18000 Zeni, 1 Thiết bị đo sức mạnh"
        },
        requiredLevel: 20
    },


    SAIYAN_WARRIOR: {
        id: "SAIYAN_WARRIOR",
        name: "Chiến binh tầng lớp thấp",
        description: "Đánh bại 10 Chiến Binh Saiyan",
        type: QUEST_TYPES.COMBAT,
        target: 10,
        monster: "saiyan_warrior",
        reward: {
            exp: 3000,
            zeni: 4000,
            description: "3000 EXP, 4000 Zeni"
        },
        requiredLevel: 5
    },
    SAIYAN_ELITE: {
        id: "SAIYAN_ELITE",
        name: "Tinh hoa của tộc Saiyan",
        description: "Đánh bại 7 Saiyan Tinh Nhuệ",
        type: QUEST_TYPES.COMBAT,
        target: 7,
        monster: "saiyan_elite",
        reward: {
            exp: 7000,
            zeni: 10000,
            item: "senzu",
            quantity: 4,
            description: "7000 EXP, 10000 Zeni, 4 Đậu Thần"
        },
        requiredLevel: 10
    },
    SAIYAN_TURLES: {
        id: "SAIYAN_TURLES",
        name: "Kẻ ăn trộm sinh mệnh",
        description: "Đánh bại 3 Turles",
        type: QUEST_TYPES.COMBAT,
        target: 3,
        monster: "turles",
        reward: {
            exp: 10000,
            zeni: 15000,
            item: "crystal",
            quantity: 3,
            description: "10000 EXP, 15000 Zeni, 3 Tinh Thể Sức Mạnh"
        },
        requiredLevel: 18
    },
    SAIYAN_BROLY: {
        id: "SAIYAN_BROLY",
        name: "Siêu Saiyan huyền thoại",
        description: "Đánh bại 2 Broly",
        type: QUEST_TYPES.COMBAT,
        target: 2,
        monster: "broly",
        reward: {
            exp: 15000,
            zeni: 25000,
            item: "armor",
            quantity: 2,
            description: "15000 EXP, 25000 Zeni, 2 Áo Giáp Saiyan"
        },
        requiredLevel: 25
    },
    BEGINNER_1: {
        id: "BEGINNER_1",
        name: "Bắt đầu hành trình",
        description: "Luyện tập 3 lần để làm quen với sức mạnh",
        type: QUEST_TYPES.TRAINING,
        target: 3,
        reward: {
            exp: 500,
            zeni: 1000,
            description: "500 EXP, 1000 Zeni"
        },
        requiredLevel: 0
    },
    BEGINNER_2: {
        id: "BEGINNER_2",
        name: "Tìm kiếm sức mạnh",
        description: "Đạt 2,000 sức mạnh",
        type: QUEST_TYPES.POWER,
        target: 2000,
        reward: {
            exp: 1000,
            zeni: 2000,
            description: "1000 EXP, 2000 Zeni"
        },
        requiredLevel: 0
    },


    EARTH_WOLF: {
        id: "EARTH_WOLF",
        name: "Những kẻ săn mồi",
        description: "Đánh bại 5 con sói hoang",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "wolf",
        reward: {
            exp: 1000,
            zeni: 2000,
            description: "1000 EXP, 2000 Zeni"
        },
        requiredLevel: 1
    },
    EARTH_SAIBAMEN: {
        id: "EARTH_SAIBAMEN",
        name: "Đánh bại Saibamen",
        description: "Đánh bại 8 Saibamen",
        type: QUEST_TYPES.COMBAT,
        target: 8,
        monster: "saibamen",
        reward: {
            exp: 3000,
            zeni: 4000,
            description: "3000 EXP, 4000 Zeni"
        },
        requiredLevel: 2
    },

    NAMEK_APPULE: {
        id: "NAMEK_APPULE",
        name: "Sát thủ của Freeza",
        description: "Đánh bại 5 Appule",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "appule",
        reward: {
            exp: 1500,
            zeni: 2500,
            description: "1500 EXP, 2500 Zeni"
        },
        requiredLevel: 1
    },
    NAMEK_SOLDIER: {
        id: "NAMEK_SOLDIER",
        name: "Quân đội của Freeza",
        description: "Đánh bại 8 binh lính Freeza",
        type: QUEST_TYPES.COMBAT,
        target: 8,
        monster: "freeza_soldier",
        reward: {
            exp: 3500,
            zeni: 5000,
            description: "3500 EXP, 5000 Zeni"
        },
        requiredLevel: 2
    },
    NAMEK_BOSS: {
        id: "NAMEK_BOSS",
        name: "Đối đầu với Cui",
        description: "Đánh bại Cui",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "cui",
        reward: {
            exp: 12000,
            zeni: 25000,
            item: "scouter",
            quantity: 1,
            description: "12000 EXP, 25000 Zeni, 1 Thiết bị đo sức mạnh"
        },
        requiredLevel: 15
    },

    SAIYAN_RADITZ: {
        id: "SAIYAN_RADITZ",
        name: "Anh trai Kakarot",
        description: "Đánh bại 5 Raditz",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "raditz",
        reward: {
            exp: 2000,
            zeni: 3000,
            description: "2000 EXP, 3000 Zeni"
        },
        requiredLevel: 1
    },
    SAIYAN_NAPPA: {
        id: "SAIYAN_NAPPA",
        name: "Tướng quân Saiyan",
        description: "Đánh bại 8 Nappa",
        type: QUEST_TYPES.COMBAT,
        target: 8,
        monster: "nappa",
        reward: {
            exp: 4000,
            zeni: 6000,
            description: "4000 EXP, 6000 Zeni"
        },
        requiredLevel: 2
    },
    SAIYAN_BOSS: {
        id: "SAIYAN_BOSS",
        name: "Thách đấu Vegeta",
        description: "Đánh bại Hoàng tử Vegeta",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "vegeta",
        reward: {
            exp: 15000,
            zeni: 30000,
            item: "crystal",
            quantity: 3,
            description: "15000 EXP, 30000 Zeni, 3 Tinh Thể Sức Mạnh"
        },
        requiredLevel: 15
    },

    BASIC_TRAINING: {
        id: "BASIC_TRAINING",
        name: "Khởi đầu hành trình",
        description: "Luyện tập 5 lần để làm quen với sức mạnh",
        type: QUEST_TYPES.TRAINING,
        target: 5,
        reward: {
            exp: 1000,
            zeni: 1000,
            description: "1,000 EXP, 1,000 Zeni"
        },
        requiredLevel: 0
    },

    DRAGON_BALL_1: {
        id: "DRAGON_BALL_1",
        name: "Ngọc Rồng huyền thoại",
        description: "Thu thập 3 viên Ngọc Rồng bất kỳ",
        type: QUEST_TYPES.COLLECT,
        itemType: "dragonBall",
        target: 3,
        reward: {
            exp: 5000,
            zeni: 10000,
            description: "5000 EXP, 10000 Zeni"
        },
        requiredLevel: 3
    },

    POWER_LV1: {
        id: "POWER_LV1",
        name: "𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 thật sự",
        description: "Đạt 10,000 sức mạnh",
        type: QUEST_TYPES.POWER,
        target: 10000,
        reward: {
            exp: 8000,
            zeni: 15000,
            description: "8000 EXP, 15000 Zeni"
        },
        requiredLevel: 5
    },
    POWER_LV2: {
        id: "POWER_LV2",
        name: "Siêu Chiến Binh",
        description: "Đạt 50,000 sức mạnh",
        type: QUEST_TYPES.POWER,
        target: 50000,
        reward: {
            exp: 20000,
            zeni: 30000,
            description: "20000 EXP, 30000 Zeni"
        },
        requiredLevel: 10
    },
    POWER_LV3: {
        id: "POWER_LV3",
        name: "Sức mạnh thần thánh",
        description: "Đạt 500,000 sức mạnh",
        type: QUEST_TYPES.POWER,
        target: 500000,
        reward: {
            exp: 200000,
            zeni: 200000,
            description: "200,000 EXP, 200,000 Zeni",
            item: "crystal",
            quantity: 3
        }
    },
    DRAGON_BALL_ALL: {
        id: "DRAGON_BALL_ALL",
        name: "Triệu hồi Rồng Thần",
        description: "Thu thập đủ 7 viên Ngọc Rồng từ một hành tinh",
        type: QUEST_TYPES.COLLECT,
        itemType: "dragonBall7",
        target: 7,
        reward: {
            exp: 50000,
            item: "crystal",
            quantity: 3,
            description: "50000 EXP, 3 Tinh Thể Sức Mạnh"
        },
        requiredLevel: 20
    }
};
const TRAINING_LOCATIONS = {
    DEFAULT: {
        name: "Hành tinh",
        description: "Địa điểm luyện tập cơ bản",
        minPower: 0,
        maxPower: 100000,
        multiplier: 1.0,
        color: "#4080FF"
    },
    KORIN: {
        name: "Tháp Karin",
        description: "Nơi luyện tập với trọng lực cao hơn",
        minPower: 100000,
        maxPower: 500000,
        multiplier: 3.0,
        color: "#40C040"
    },
    KAMI: {
        name: "Tháp Thượng Đế",
        description: "Phòng tập của thượng đế",
        minPower: 500000,
        maxPower: 5000000,
        multiplier: 7.0,
        color: "#FFC107"
    },
    UNIVERSE_GOD: {
        name: "Thần Vũ Trụ",
        description: "Luyện tập dưới sự chỉ dạy của các vị thần",
        minPower: 5000000,
        maxPower: 50000000,
        multiplier: 10.0,
        color: "#9C27B0"
    },
    KAIOSHIN: {
        name: "Giới Kaioshin",
        description: "Thế giới của Đại Kaioshin",
        minPower: 50000000,
        maxPower: 50000000000,
        multiplier: 12.0,
        color: "#FF5252"
    },
    DESTROYER: {
        name: "Thần Hủy Diệt",
        description: "Luyện tập cùng Thần Hủy Diệt",
        minPower: 50000000000,
        maxPower: Infinity,
        multiplier: 15.0,
        color: "#7C4DFF"
    }
};
const TOURNAMENT_QUEST_PROGRESSION = {
    BEGINNER: {
        name: "Tham Gia Võ Đài",
        description: "Tham gia và đạt top 8 trong giải đấu",
        type: QUEST_TYPES.TOURNAMENT,
        target: 1,
        reward: {
            exp: 50000,
            zeni: 50000,
            description: "50,000 EXP, 50,000 Zeni"
        },
        powerRequired: 50000
    },
    TENKAICHI: {
        name: "Đại Hội Võ Thuật Thiên Hạ",
        description: "Đạt top 4 trong Đại Hội Võ Thuật Thiên Hạ",
        type: QUEST_TYPES.TOURNAMENT,
        target: 1,
        reward: {
            exp: 100000,
            zeni: 100000,
            item: "tournament_belt",
            description: "100,000 EXP, 100,000 Zeni, Đai vô địch"
        },
        powerRequired: 500000
    },
    CELL_GAMES: {
        name: "Cell Games",
        description: "Đạt top 2 trong Cell Games",
        type: QUEST_TYPES.TOURNAMENT,
        target: 1,
        reward: {
            exp: 200000,
            zeni: 200000,
            item: "cell_medal",
            description: "200,000 EXP, 200,000 Zeni, Huy chương Cell Games"
        },
        powerRequired: 2000000
    },
    UNIVERSE: {
        name: "Giải Đấu Sức Mạnh",
        description: "Vô địch Giải Đấu Sức Mạnh",
        type: QUEST_TYPES.TOURNAMENT,
        target: 1,
        reward: {
            exp: 500000,
            zeni: 500000,
            item: "universe_medal",
            description: "500,000 EXP, 500,000 Zeni, Huy chương Vũ Trụ"
        },
        powerRequired: 10000000
    }
};

const EVOLUTION_SYSTEM = {
    EARTH: {
        forms: [

            {
                name: "Con người",
                powerRequired: 0,
                description: "Con người bình thường với tiềm năng chưa khai phá",
                powerBonus: 1.0,
                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },
            {
                name: "Chiến Binh Z",
                powerRequired: 100000,
                description: "Chiến binh được rèn luyện theo phong cách Trái Đất",
                powerBonus: 1.3,
                kiBonus: 1.5,
                healthBonus: 1.2,
                damageBonus: 1.3
            },
            {
                name: "Bậc Thầy Khí",
                powerRequired: 1000000,
                description: "Đạt đến trình độ kiểm soát khí hoàn hảo",
                powerBonus: 1.6,
                kiBonus: 2.2,
                healthBonus: 1.5,
                damageBonus: 1.8
            },

            {
                name: "Siêu Chiến Binh",
                powerRequired: 10000000,
                description: "𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 vượt giới hạn con người",
                powerBonus: 2.2,
                kiBonus: 2.5,
                healthBonus: 2.0,
                damageBonus: 2.5
            },
            {
                name: "Tiềm Năng Khai Phá",
                powerRequired: 50000000,
                description: "Khai phá hoàn toàn tiềm năng con người",
                powerBonus: 3.0,
                kiBonus: 3.5,
                healthBonus: 2.8,
                damageBonus: 3.5
            },
            {
                name: "Chí Tôn Trái Đất",
                powerRequired: 100000000,
                description: "Đạt đến giới hạn tối thượng của con người",
                powerBonus: 4.0,
                kiBonus: 4.5,
                healthBonus: 3.5,
                damageBonus: 5.0
            },

            {
                name: "Thần Khi Trái Đất",
                powerRequired: 500000000,
                description: "Biến đổi khí thành năng lượng thần thánh",
                powerBonus: 6.0,
                kiBonus: 6.0,
                healthBonus: 5.0,
                damageBonus: 7.0
            },
            {
                name: "Tứ Phân Thần Công",
                powerRequired: 1000000000,
                description: "Kỹ thuật tối thượng của các bậc thầy Trái Đất",
                powerBonus: 8.0,
                kiBonus: 7.5,
                healthBonus: 6.0,
                damageBonus: 9.0
            }
        ]
    },
    NAMEK: {
        forms: [

            {
                name: "Namek thường",
                powerRequired: 0,
                description: "Chiến binh Namek bình thường",
                powerBonus: 1.0,
                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },

            {
                name: "Namek Warrior",
                powerRequired: 100000,
                description: "Chiến binh Namek ưu tú",
                powerBonus: 1.2,
                kiBonus: 1.3,
                healthBonus: 1.2,
                damageBonus: 1.2
            },

            {
                name: "Super Namek",
                powerRequired: 1000000,
                description: "Namek siêu cấp với sức mạnh phi thường",
                powerBonus: 1.8,
                kiBonus: 2.2,
                healthBonus: 1.8,
                damageBonus: 2.0
            },

            {
                name: "Namek Fusion",
                powerRequired: 10000000,
                description: "Namek hợp thể với sức mạnh của nhiều Namek",
                powerBonus: 2.5,
                kiBonus: 2.8,
                healthBonus: 2.5,
                damageBonus: 2.8
            },

            {
                name: "Namek Dragon",
                powerRequired: 50000000,
                description: "Thức tỉnh huyết thống Rồng Thần trong cơ thể",
                powerBonus: 3.5,
                kiBonus: 4.0,
                healthBonus: 3.5,
                damageBonus: 4.0
            },
            {
                name: "Red-Eyed Namek",
                powerRequired: 100000000,
                description: "Năng lượng cơ thể chuyển đổi hoàn toàn, mắt đỏ ngầu",
                powerBonus: 5.0,
                kiBonus: 5.5,
                healthBonus: 4.5,
                damageBonus: 6.0
            },
            {
                name: "Dragon Clan Master",
                powerRequired: 500000000,
                description: "Chưởng môn tộc Rồng, điều khiển phép thuật cổ đại",
                powerBonus: 7.0,
                kiBonus: 7.0,
                healthBonus: 6.0,
                damageBonus: 8.0
            },
            {
                name: "Porunga Vessel",
                powerRequired: 1000000000,
                description: "Hợp thể với Porunga, đạt sức mạnh tối thượng",
                powerBonus: 8.5,
                kiBonus: 8.0,
                healthBonus: 7.0,
                damageBonus: 9.5
            }
        ]
    },
    SAIYAN: {
        forms: [

            {
                name: "Saiyan thường",
                powerRequired: 0,
                description: "Chiến binh Saiyan bình thường",
                powerBonus: 1.0,
                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },
            {
                name: "Super Saiyan",
                powerRequired: 1000000,
                description: "Truyền thuyết của tộc Saiyan",
                powerBonus: 1.5,
                kiBonus: 1.4,
                healthBonus: 1.3,
                damageBonus: 1.7
            },
            {
                name: "Super Saiyan 2",
                powerRequired: 10000000,
                description: "Siêu Saiyan cấp 2 với sức mạnh kinh hoàng",
                powerBonus: 2.0,
                kiBonus: 1.8,
                healthBonus: 1.6,
                damageBonus: 2.2
            },
            {
                name: "Super Saiyan 3",
                powerRequired: 50000000,
                description: "Siêu Saiyan cấp 3 với sức mạnh hủy diệt",
                powerBonus: 3.0,
                kiBonus: 2.5,
                healthBonus: 2.0,
                damageBonus: 3.0
            },
            {
                name: "Super Saiyan God",
                powerRequired: 100000000,
                description: "𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 thần thánh của các vị thần",
                powerBonus: 5.0,
                kiBonus: 4.0,
                healthBonus: 3.0,
                damageBonus: 5.0
            },
            {
                name: "Super Saiyan Blue",
                powerRequired: 1500000000,
                description: "Kết hợp sức mạnh thần thánh với siêu saiyan",
                powerBonus: 7.0,
                kiBonus: 5.0,
                healthBonus: 4.0,
                damageBonus: 7.0
            },
            {
                name: "Ultra Instinct",
                powerRequired: 100000000000,
                description: "Bản năng vô cực - sức mạnh của các thiên sứ",
                powerBonus: 10.0,
                kiBonus: 8.0,
                healthBonus: 6.0,
                damageBonus: 10.0
            }
        ]
    }
};

const MONSTERS = {
    saibamen: {
        name: "Saibamen",
        hp: 500,
        power: 300,
        exp: 100,
        zeni: 50,
        dropChance: 0.05,
        dropItem: "senzu",
        planet: "EARTH"
    },
    freeza_soldier: {
        name: "Binh lính Freeza",
        hp: 1000,
        power: 800,
        exp: 250,
        zeni: 120,
        dropChance: 0.08,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    wolf: {
        name: "Sói hoang",
        hp: 300,
        power: 200,
        exp: 80,
        zeni: 40,
        dropChance: 0.03,
        dropItem: null,
        planet: "EARTH"
    },



    red_ribbon_soldier: {
        name: "Lính Rồng Đỏ",
        hp: 600,
        power: 500,
        exp: 150,
        zeni: 70,
        dropChance: 0.06,
        dropItem: "senzu",
        planet: "EARTH"
    },
    tambourine: {
        name: "Tambourine",
        hp: 2500,
        power: 2000,
        exp: 800,
        zeni: 350,
        dropChance: 0.12,
        dropItem: "crystal",
        planet: "EARTH"
    },
    android19: {
        name: "Android 19",
        hp: 8000,
        power: 7000,
        exp: 1500,
        zeni: 800,
        dropChance: 0.18,
        dropItem: "armor",
        planet: "EARTH"
    },
    cell_jr: {
        name: "Cell Jr.",
        hp: 12000,
        power: 10000,
        exp: 2000,
        zeni: 1000,
        dropChance: 0.20,
        dropItem: "crystal",
        planet: "EARTH"
    },


    namekian_warrior: {
        name: "Chiến Binh Namek",
        hp: 800,
        power: 600,
        exp: 180,
        zeni: 90,
        dropChance: 0.05,
        dropItem: null,
        planet: "NAMEK"
    },
    dodoria: {
        name: "Dodoria",
        hp: 4000,
        power: 3500,
        exp: 1000,
        zeni: 500,
        dropChance: 0.15,
        dropItem: "armor",
        planet: "NAMEK"
    },
    zarbon: {
        name: "Zarbon",
        hp: 5000,
        power: 4500,
        exp: 1200,
        zeni: 600,
        dropChance: 0.15,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    ginyu_force: {
        name: "Thành viên Đội Ginyu",
        hp: 10000,
        power: 8000,
        exp: 1800,
        zeni: 900,
        dropChance: 0.20,
        dropItem: "radar",
        planet: "NAMEK"
    },


    saiyan_warrior: {
        name: "Chiến Binh Saiyan",
        hp: 1000,
        power: 900,
        exp: 250,
        zeni: 150,
        dropChance: 0.08,
        dropItem: "senzu",
        planet: "SAIYAN"
    },
    saiyan_elite: {
        name: "Saiyan Tinh Nhuệ",
        hp: 5000,
        power: 4800,
        exp: 1200,
        zeni: 650,
        dropChance: 0.18,
        dropItem: "armor",
        planet: "SAIYAN"
    },
    turles: {
        name: "Turles",
        hp: 15000,
        power: 13000,
        exp: 2500,
        zeni: 1200,
        dropChance: 0.22,
        dropItem: "crystal",
        planet: "SAIYAN"
    },
    broly: {
        name: "Broly",
        hp: 25000,
        power: 20000,
        exp: 3500,
        zeni: 2000,
        dropChance: 0.25,
        dropItem: "radar",
        planet: "SAIYAN"
    },
    nappa: {
        name: "Nappa",
        hp: 3000,
        power: 3000,
        exp: 1000,
        zeni: 500,
        dropChance: 0.15,
        dropItem: "crystal",
        planet: "SAIYAN"
    },
    raditz: {
        name: "Raditz",
        hp: 2000,
        power: 1800,
        exp: 800,
        zeni: 400,
        dropChance: 0.10,
        dropItem: "senzu",
        planet: "SAIYAN"
    },
    appule: {
        name: "Appule",
        hp: 1500,
        power: 1000,
        exp: 300,
        zeni: 200,
        dropChance: 0.07,
        dropItem: "senzu",
        planet: "NAMEK"
    }
};

const PLANETS = {
    EARTH: {
        name: "Trái Đất",
        powerBonus: 1.0,
        description: "Hành tinh của các chiến binh Z",
        masters: ["KAME"]
    },
    NAMEK: {
        name: "Namek",
        powerBonus: 1.2,
        description: "Hành tinh của tộc Namek",
        masters: ["PICCOLO"]
    },
    SAIYAN: {
        name: "Saiyan",
        powerBonus: 1.5,
        description: "Hành tinh của tộc Saiyan",
        masters: ["GOKU"]
    }
};
const DRAGON_BALL_INFO = {
    FIND_CHANCE: 0.05,
    RADAR_BOOST: 3.0,
    DESCRIPTIONS: {
        1: "Ngọc Rồng 1 sao",
        2: "Ngọc Rồng 2 sao",
        3: "Ngọc Rồng 3 sao",
        4: "Ngọc Rồng 4 sao",
        5: "Ngọc Rồng 5 sao",
        6: "Ngọc Rồng 6 sao",
        7: "Ngọc Rồng 7 sao"
    }
};
const DRAGON_BALLS = {
    EARTH: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
    NAMEK: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null }
};

const MASTERS = {
    KAME: {
        name: "Lão rùa Kame",
        race: "Human",
        description: "Bậc thầy võ thuật Trái Đất",
        skills: {
            DRAGON_PUNCH: {
                name: "Đấm Dragon",
                powerScale: 1.2,
                kiCost: 0.2,
                powerRequired: 0,
                description: "Đấm Dragon cơ bản của người Trái Đất"
            },
            KAMEJOKO: {
                name: "Kamejoko",
                powerScale: 1.5,
                kiCost: 0.3,
                powerRequired: 50000,
                description: "Kamehameha phiên bản lỗi của Goku"
            },
            SOLAR_FLARE: {
                name: "Thái Dương Hạ San",
                powerScale: 0,
                kiCost: 0.4,
                powerRequired: 5000000,
                description: "Choáng đối thủ 10s"
            },
            KAIOKEN: {
                name: "Kaioken",
                powerScale: 0,
                kiCost: 0.5,
                powerRequired: 50000000,
                description: "Tăng x30 HP, KI, Sức đánh"
            },
            SPIRIT_BOMB: {
                name: "Quả Cầu Kinh Khí",
                powerScale: 8.0,
                kiCost: 1.0,
                powerRequired: 500000000,
                description: "Tạo quả cầu cực mạnh tốn 100% ki"
            },
            ENERGY_SHIELD: {
                name: "Khiên Năng Lượng",
                powerScale: 0,
                kiCost: 0.7,
                powerRequired: 5000000000,
                description: "Chịu mọi sát thương trong 40s"
            },
            HYPNOSIS: {
                name: "Thôi Miên",
                powerScale: 0,
                kiCost: 0.6,
                powerRequired: 1000000000,
                description: "Choáng đối thủ 30s"
            },
        }
    },

    PICCOLO: {
        name: "Piccolo",
        race: "Namek",
        description: "Chiến binh tộc Namek",
        skills: {
            SPECIAL_BEAM_CANNON: {
                name: "Makankosappo",
                powerScale: 2.5,
                kiCost: 0.4,
                powerRequired: 1000000,
                description: "Xoáy ma khoan xuyên thủng"
            },
            REGENERATION: {
                name: "Tái Tạo",
                powerScale: 0,
                kiCost: -0.3,
                powerRequired: 5000000,
                description: "Hồi phục 30% HP"
            },
            LIGHT_GRENADE: {
                name: "Light Grenade",
                powerScale: 3.0,
                kiCost: 0.5,
                powerRequired: 10000000,
                description: "Quả cầu ánh sáng hủy diệt"
            },
            HELLZONE_GRENADE: {
                name: "Hellzone Grenade",
                powerScale: 4.0,
                kiCost: 0.6,
                powerRequired: 100000000,
                description: "Bẫy địa ngục không lối thoát"
            },
            DEMONICAL_FLAVOR: {
                name: "Hương Vị Quỷ Dữ",
                powerScale: 3.5,
                kiCost: 0.55,
                powerRequired: 750000000,
                description: "Tấn công bằng năng lượng quỷ dữ"
            },
            MULTIFORM: {
                name: "Phân Thân",
                powerScale: 5.0,
                kiCost: 0.7,
                powerRequired: 1000000000,
                description: "Tạo nhiều bản sao chiến đấu"
            },
            EXPLODING_STORM: {
                name: "Bão Năng Lượng",
                powerScale: 4.5,
                kiCost: 0.65,
                powerRequired: 2000000000,
                description: "Tạo ra cơn bão năng lượng"
            }
        }
    },

    GOKU: {
        name: "Kakarot",
        race: "Saiyan",
        description: "Chiến binh Saiyan huyền thoại",
        skills: {
            ATOMIC: {
                name: "Đấm Galick",
                powerScale: 1.2,
                kiCost: 0.2,
                powerRequired: 0,
                description: "Đấm Galick cơ bản của người Saiyan"
            },
            REGENERATE_ENERGY: {
                name: "Tái Tạo Năng Lượng",
                powerScale: 0,
                kiCost: -0.5,
                powerRequired: 1000000,
                description: "Hồi phục Ki nhanh chóng"
            },
            WHISTLE: {
                name: "Huýt Sáo",
                powerScale: 0,
                kiCost: -0.3,
                powerRequired: 50000000,
                description: "Hồi HP và Ki cho bản thân"
            },
            BIND: {
                name: "Trói",
                powerScale: 0,
                kiCost: 0.3,
                powerRequired: 100000000,
                description: "Trói đối thủ trong 15 giây"
            },
            ENERGY_SHIELD: {
                name: "Khiên Năng Lượng",
                powerScale: 0,
                kiCost: 0.5,
                powerRequired: 5000000000,
                description: "Tạo khiên bảo vệ trong 40 giây"
            },
            CADICH_LIEN_HOAN_TRUONG: {
                name: "Cadich Liên Hoàn Trưởng",
                powerScale: 6.0,
                kiCost: 0.8,
                powerRequired: 30000000000,
                description: "Tấn công liên hoàn bằng chưởng"
            },
            GREAT_APE: {
                name: "Biến Khỉ Khổng Lồ",
                powerScale: 5.0,
                kiCost: 0.8,
                powerRequired: 50000000000,
                description: "Biến thành khỉ đột khổng lồ, tăng sức mạnh gấp 10 lần"
            },
        }
    }
};

const STAT_LIMITS = {
    POWER: 100000000000,
    DAMAGE: 50000000,
    KI: 50000000,
    HP: 50000000
};
const EXP_SYSTEM = {
    BASE_EXP: { min: 500, max: 1500 },
    POWER_BONUS: {
        thresholds: [
            { percent: 1, bonus: 2.0 },
            { percent: 5, bonus: 3.0 },
            { percent: 10, bonus: 4.0 },
            { percent: 25, bonus: 5.0 },
            { percent: 50, bonus: 7.0 },
            { percent: 75, bonus: 10.0 },
            { percent: 90, bonus: 15.0 }
        ],
        MAX_POWER: 100000000000
    }
};
const MAX_EXP_STORAGE = 50000000;
const UPGRADE_COSTS = {
    damage: (currentValue) => Math.floor(currentValue * 5),
    ki: (currentValue) => Math.floor(currentValue * 4),
    health: (currentValue) => Math.floor(currentValue * 3)
};
const ZENI_INFO = {
    TRAIN_MIN: 50,
    TRAIN_MAX: 200,
    FIND_CHANCE: 0.25,
    SPECIAL_MIN: 500,
    SPECIAL_MAX: 2000
};
const DEFAULT_STATS = {
    power: 1000,
    damage: 100,
    ki: 100,
    currentKi: 100,
    health: 1000,
    currentHealth: 1000,
    exp: 0,
    zeni: 1000,
    inventory: {
        items: [],
        equipped: []
    },
    quests: {
        active: [],
        completed: [],
        progress: {}
    }
};
function validatePlayerSkills(player) {
    if (!player || !player.skills || player.skills.length === 0) return;

    const validSkills = player.skills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        if (!MASTERS[master] || !MASTERS[master].skills[skillName]) {
            console.log(`Kỹ năng không tồn tại: ${skillChoice}`);
            return false;
        }

        const skillData = MASTERS[master].skills[skillName];
        return player.stats.power >= skillData.powerRequired;
    });

    if (validSkills.length < player.skills.length) {
        const removedSkills = player.skills.filter(skill => !validSkills.includes(skill));
        const removedNames = removedSkills.map(skill => {
            const [master, skillName] = skill.split(":");
            if (MASTERS[master] && MASTERS[master].skills[skillName]) {
                return MASTERS[master].skills[skillName].name;
            } else {
                return skill;
            }
        });

        console.log(`Người chơi ${player.name} bị loại bỏ ${removedSkills.length} kỹ năng: ${removedNames.join(", ")}`);
        player.skills = validSkills;
        return removedNames;
    }

    return null;
}
function checkTournamentQuest(player, tournamentData) {
    if (!player.quests?.active[0]) return;

    const questId = player.quests.active[0];
    const quest = QUESTS[questId];

    if (!quest || quest.type !== QUEST_TYPES.TOURNAMENT) return;

    let completed = false;

    switch (questId) {
        case "TOURNAMENT_BEGINNER":
            completed = isTop8(player.id, tournamentData);
            break;

        case "TOURNAMENT_TENKAICHI":
            completed = isTop4(player.id, tournamentData);
            break;

        case "TOURNAMENT_CELL":
            completed = isTop2(player.id, tournamentData);
            break;

        case "TOURNAMENT_UNIVERSE":
            completed = isChampion(player.id, tournamentData);
            break;
    }

    if (completed) {
        player.quests.progress[questId] = quest.target;
        console.log(`Player ${player.name} completed tournament quest ${questId}`);
    }
}
function isTop8(playerId, tournamentData) {

    const eliminated = tournamentData.active.rounds[1]?.filter(m => m.loser?.id === playerId);
    return eliminated?.length === 0;
}

function isTop4(playerId, tournamentData) {

    return tournamentData.active.winners.semifinalists?.some(p => p.id === playerId);
}

function isTop2(playerId, tournamentData) {

    return tournamentData.active.winners.first?.id === playerId ||
        tournamentData.active.winners.second?.id === playerId;
}

function isChampion(playerId, tournamentData) {

    return tournamentData.active.winners.first?.id === playerId;
}
function selectRandomMonster(planet, playerLevel) {
    const planetMonsters = Object.entries(MONSTERS)
        .filter(([_, monster]) => monster.planet === planet)
        .map(([id, monster]) => ({ id, ...monster }));

    if (planetMonsters.length === 0) {
        return null;
    }

    const easyMonsters = planetMonsters.filter(m => m.power < 1000);
    const mediumMonsters = planetMonsters.filter(m => m.power >= 1000 && m.power < 5000);
    const hardMonsters = planetMonsters.filter(m => m.power >= 5000);

    let availableMonsters;
    if (playerLevel < 5) {
        availableMonsters = easyMonsters;
    } else if (playerLevel < 10) {
        availableMonsters = [...easyMonsters, ...mediumMonsters];
    } else {
        availableMonsters = [...mediumMonsters, ...hardMonsters];
    }

    if (availableMonsters.length === 0) {
        availableMonsters = planetMonsters;
    }

    const randomIndex = Math.floor(Math.random() * availableMonsters.length);
    return availableMonsters[randomIndex];
}

function getVisualEffectForItem(itemId) {
    const effectMap = {
        "scouter": {
            type: "overlay",
            position: "face",
            color: "#FF0000"
        },
        "armor": {
            type: "overlay",
            position: "body",
            color: "#FFFFFF"
        },
        "radar": {
            type: "accessory",
            position: "hand",
            color: "#00FF00"
        },
        "crystal": {
            type: "aura",
            position: "body",
            color: "#80C0FF"
        },
        "tournament_belt": {
            type: "accessory",
            position: "waist",
            color: "#FFD700"
        },
        "cell_medal": {
            type: "accessory",
            position: "chest",
            color: "#C0C0C0"
        },
        "universe_medal": {
            type: "aura",
            position: "body",
            color: "#FFFF00"
        }
    };

    return effectMap[itemId] || null;
}
function applyAmuletEffects(player, stats) {
    if (!player.amulets || player.amulets.length === 0) {
        return {
            applied: false,
            effects: []
        };
    }


    const activeAmulets = player.amulets.filter(amulet => amulet.expireAt > Date.now());

    if (activeAmulets.length === 0) {
        return {
            applied: false,
            effects: []
        };
    }

    const appliedEffects = [];


    for (const amulet of activeAmulets) {
        switch (amulet.effect) {
            case 'immortal':
                stats.immortal = true;
                appliedEffects.push({
                    name: amulet.name,
                    effect: 'Bất tử tạm thời',
                    emoji: amulet.emoji || '🔮'
                });
                break;

            case 'damage_boost':
                const damageBoost = amulet.boost || 1.5;
                stats.playerDamage = (stats.playerDamage || 0) * damageBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng sát thương x${damageBoost}`,
                    emoji: amulet.emoji || '⚔️'
                });
                break;

            case 'health_boost':
                const healthBoost = amulet.boost || 1.5;
                stats.playerHP = (stats.playerHP || 0) * healthBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng HP x${healthBoost}`,
                    emoji: amulet.emoji || '❤️'
                });
                break;

            case 'ki_boost':
                const kiBoost = amulet.boost || 1.5;
                stats.playerKi = (stats.playerKi || 0) * kiBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng Ki x${kiBoost}`,
                    emoji: amulet.emoji || '✨'
                });
                break;

            case 'exp_boost':
                const expBoost = amulet.boost || 2.0;
                stats.expMultiplier *= expBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng EXP x${expBoost}`,
                    emoji: amulet.emoji || '📊'
                });
                break;

            case 'power_boost':
                const powerBoost = amulet.boost || 1.5;
                stats.powerMultiplier *= powerBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng sức mạnh x${powerBoost}`,
                    emoji: amulet.emoji || '💪'
                });
                break;

            case 'zeni_boost':
                const zeniBoost = amulet.boost || 1.5;
                stats.zeniMultiplier *= zeniBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng Zeni x${zeniBoost}`,
                    emoji: amulet.emoji || '💰'
                });
                break;

            case 'all_stats':
                const allStatsBoost = amulet.boost || 1.3;
                stats.playerHP = (stats.playerHP || 0) * allStatsBoost;
                stats.playerKi = (stats.playerKi || 0) * allStatsBoost;
                stats.playerDamage = (stats.playerDamage || 0) * allStatsBoost;
                stats.expMultiplier *= allStatsBoost;
                stats.powerMultiplier *= allStatsBoost;
                stats.zeniMultiplier *= allStatsBoost;
                appliedEffects.push({
                    name: amulet.name,
                    effect: `Tăng tất cả chỉ số x${allStatsBoost}`,
                    emoji: amulet.emoji || '🌟'
                });
                break;

            default:

                console.log(`Không nhận dạng được hiệu ứng bùa: ${amulet.effect}`);
                break;
        }
    }

    console.log(`Áp dụng ${appliedEffects.length} hiệu ứng bùa cho người chơi ${player.name}`);
    console.log(`Sau khi áp dụng: expMultiplier = ${stats.expMultiplier}, powerMultiplier = ${stats.powerMultiplier}`);

    return {
        applied: appliedEffects.length > 0,
        effects: appliedEffects
    };
}
// Sửa hàm updateQuestProgress để kiểm tra và hoàn thành tự động

function updateQuestProgress(player, questType, playerData, data = {}) {
    if (!player.quests || player.quests.active.length === 0) return;

    const activeQuestId = player.quests.active[0];
    const quest = QUESTS[activeQuestId];

    if (!quest) {
        console.error(`Không tìm thấy nhiệm vụ với ID: ${activeQuestId}`);
        return;
    }

    if (quest.type !== questType) return;

    // Khởi tạo tiến độ nếu chưa có
    if (!player.quests.progress[activeQuestId]) {
        player.quests.progress[activeQuestId] = 0;
    }

    // Cập nhật tiến độ theo loại nhiệm vụ
    let updated = false;

    switch (questType) {
        case QUEST_TYPES.TRAINING:
            player.quests.progress[activeQuestId]++;
            updated = true;
            break;

        case QUEST_TYPES.COMBAT:
            if (data.monster && quest.monster === data.monster) {
                player.quests.progress[activeQuestId]++;
                updated = true;
            }
            break;

        case QUEST_TYPES.POWER:
            if (player.stats.power >= quest.target) {
                player.quests.progress[activeQuestId] = quest.target;
                updated = true;
            }
            break;

        case QUEST_TYPES.COLLECT:
            if (quest.itemType === "dragonBall") {
                const ballCount = player.inventory?.dragonBalls?.length || 0;
                if (ballCount >= quest.target) {
                    player.quests.progress[activeQuestId] = quest.target;
                    updated = true;
                }
            } else if (quest.itemType === "dragonBall7") {
                const hasAllBalls = hasAllDragonBalls(player, player.planet);
                if (hasAllBalls) {
                    player.quests.progress[activeQuestId] = quest.target;
                    updated = true;
                }
            }
            break;
    }

    // Kiểm tra xem nhiệm vụ đã hoàn thành chưa
    if (player.quests.progress[activeQuestId] >= quest.target) {
        // Tự động hoàn thành nhiệm vụ
        console.log(`Tự động hoàn thành nhiệm vụ: ${quest.name} cho player: ${player.name}`);

        // Cấp phần thưởng
        if (quest.reward.exp) {
            player.stats.exp += quest.reward.exp;
            if (player.stats.exp > MAX_EXP_STORAGE) {
                player.stats.exp = MAX_EXP_STORAGE;
            }
        }

        if (quest.reward.zeni) {
            player.stats.zeni += quest.reward.zeni;
        }

        if (quest.reward.item) {
            if (!player.inventory) player.inventory = { items: [] };
            if (!player.inventory.items) player.inventory.items = [];

            const existingItem = player.inventory.items.find(i => i.id === quest.reward.item);
            if (existingItem) {
                existingItem.quantity += (quest.reward.quantity || 1);
            } else {
                const itemType = SHOP_ITEMS[quest.reward.item.toUpperCase()]?.type || "quest_item";
                player.inventory.items.push({
                    id: quest.reward.item,
                    quantity: quest.reward.quantity || 1,
                    type: itemType
                });
            }
        }

        // Cập nhật trạng thái nhiệm vụ
        player.quests.completed.push(activeQuestId);
        player.quests.active = [];

        // Gán nhiệm vụ tiếp theo
        const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
        if (planetQuests && player.quests.completed.length < planetQuests.length) {
            const nextQuestId = planetQuests[player.quests.completed.length];
            if (QUESTS[nextQuestId]) {
                console.log(`Đã gán nhiệm vụ mới: ${QUESTS[nextQuestId].name} cho player: ${player.name}`);
                player.quests.active.push(nextQuestId);
                player.quests.progress[nextQuestId] = 0;
            }
        }

        // Tăng level nếu đủ điều kiện
        if (player.quests.completed.length % 3 === 0) {
            if (!player.stats.level) player.stats.level = 1;
            player.stats.level += 1;
        }

        // Lưu dữ liệu
        if (playerData) {
            savePlayerData(playerData);
        }
    } else if (updated && playerData) {
        // Chỉ lưu khi có thay đổi tiến độ
        savePlayerData(playerData);
    }
}
function completeQuest(player, playerData, questId) {
    const quest = QUESTS[questId];
    if (!quest) {
        console.error(`Không tìm thấy nhiệm vụ với ID: ${questId}`);
        return;
    }

    if (quest.reward.exp) {
        player.stats.exp += quest.reward.exp;
        if (player.stats.exp > MAX_EXP_STORAGE) {
            player.stats.exp = MAX_EXP_STORAGE;
        }
    }

    if (quest.reward.zeni) {
        player.stats.zeni += quest.reward.zeni;
    }

    if (quest.reward.item) {
        if (!player.inventory) player.inventory = { items: [] };
        if (!player.inventory.items) player.inventory.items = [];

        if (quest.reward.item) {
            const existingItem = player.inventory.items.find(i => i.id === quest.reward.item);
            if (existingItem) {
                existingItem.quantity += (quest.reward.quantity || 1);
            } else {
                const itemType = SHOP_ITEMS[quest.reward.item.toUpperCase()]?.type || "quest_item";
                player.inventory.items.push({
                    id: quest.reward.item,
                    quantity: quest.reward.quantity || 1,
                    type: itemType
                });
            }
        }
    }

    player.quests.completed.push(questId);
    player.quests.active.shift();
    const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
    if (planetQuests && player.quests.completed.length < planetQuests.length) {
        const nextQuestId = planetQuests[player.quests.completed.length];
        if (QUESTS[nextQuestId]) {
            player.quests.active.push(nextQuestId);
            player.quests.progress[nextQuestId] = 0;
        } else {
            console.error(`Không tìm thấy nhiệm vụ tiếp theo: ${nextQuestId}`);
        }
    }

    if (player.quests.completed.length % 3 === 0) {
        if (!player.stats.level) player.stats.level = 1;
        player.stats.level += 1;
    }

    savePlayerData(playerData);
}
function checkStatLimit(value, type) {
    const limit = STAT_LIMITS[type];
    return value > limit ? limit : value;
}
function calculateExpGain(power, damage) {
    const location = getTrainingLocation(power);
    const locationMultiplier = location.multiplier;

    const baseExp = power * 0.05 + damage * 2;
    const expBoost = Math.min(1 + (damage / EXP_SYSTEM.POWER_BONUS.MAX_POWER) * 0.5, 1.5);

    return Math.floor(baseExp * expBoost * locationMultiplier);
}
function getTrainingLocation(power) {
    if (power >= 50000000000) return TRAINING_LOCATIONS.DESTROYER;
    if (power >= 50000000) return TRAINING_LOCATIONS.KAIOSHIN;
    if (power >= 5000000) return TRAINING_LOCATIONS.UNIVERSE_GOD;
    if (power >= 500000) return TRAINING_LOCATIONS.KAMI;
    if (power >= 100000) return TRAINING_LOCATIONS.KORIN;
    return TRAINING_LOCATIONS.DEFAULT;
}

function loadTournamentData() {
    try {
        return JSON.parse(fs.readFileSync(TOURNAMENT_DB));
    } catch (err) {
        return {
            active: null,
            history: [],
            registrations: {}
        };
    }
}

function fixPlayerQuestProgression(player) {
    if (player.quests && player.quests.progress && player.quests.progress["BASIC_TRAINING"]) {

        delete player.quests.progress["BASIC_TRAINING"];

        if (player.quests.completed) {
            const basicTrainingIndex = player.quests.completed.indexOf("BASIC_TRAINING");
            if (basicTrainingIndex !== -1) {
                player.quests.completed.splice(basicTrainingIndex, 1);
            }
        }

        if (player.quests.active) {
            player.quests.active = player.quests.active.filter(questId => questId !== "BASIC_TRAINING");

            if (player.quests.active.length === 0) {
                const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
                if (planetQuests && player.quests.completed.length < planetQuests.length) {
                    const nextQuestId = planetQuests[player.quests.completed.length];
                    if (QUESTS[nextQuestId]) {
                        player.quests.active.push(nextQuestId);
                        player.quests.progress[nextQuestId] = 0;
                    }
                }
            }
        }

        console.log("Đã sửa tiến trình nhiệm vụ cho người chơi");
    }
}

function addMissingQuests() {
    if (typeof QUESTS !== 'undefined') {
        if (!QUESTS["BASIC_TRAINING"]) {
            QUESTS["BASIC_TRAINING"] = {
                id: "BASIC_TRAINING",
                name: "Luyện Tập Cơ Bản",
                description: "Luyện tập để tăng cường sức mạnh",
                type: "TRAINING",
                target: 10,
                reward: {
                    exp: 1000,
                    zeni: 500,
                    description: "1,000 EXP, 500 Zeni"
                }
            };

            console.log("Đã thêm nhiệm vụ BASIC_TRAINING vào danh sách QUESTS");
        }
    }
}
function saveTournamentData(data) {
    fs.writeFileSync(TOURNAMENT_DB, JSON.stringify(data, null, 2));
}

function updateTournamentBracket(tournamentData) {
    if (!tournamentData.active) return;

    const currentRound = tournamentData.active.currentRound;
    let allMatchesCompleted = true;

    if (tournamentData.active.rounds[currentRound]) {
        for (const match of tournamentData.active.rounds[currentRound]) {
            if (!match.completed) {
                allMatchesCompleted = false;
                break;
            }
        }
    }


    if (allMatchesCompleted && tournamentData.active.rounds[currentRound]?.length > 1) {
        const nextRound = currentRound + 1;
        const currentMatches = tournamentData.active.rounds[currentRound];
        tournamentData.active.rounds[nextRound] = [];


        for (let i = 0; i < currentMatches.length; i += 2) {
            if (i + 1 < currentMatches.length) {
                const match = {
                    id: Math.floor(i / 2) + 1,
                    round: nextRound,
                    player1: currentMatches[i].winner,
                    player2: currentMatches[i + 1].winner,
                    winner: null,
                    loser: null,
                    completed: false,
                    scheduledTime: Date.now() + (Math.floor(i / 2) + 1) * 300000
                };

                tournamentData.active.rounds[nextRound].push(match);
                tournamentData.active.matches.push(match);
            }
        }


        if (nextRound === Math.log2(Object.keys(tournamentData.registrations).length)) {
            tournamentData.active.winners.semifinalists = [
                currentMatches[0].loser,
                currentMatches[1].loser
            ];
        }


        if (tournamentData.active.rounds[nextRound].length === 1) {
            const finalMatch = tournamentData.active.rounds[nextRound][0];
            finalMatch.isFinal = true;
        }

        tournamentData.active.currentRound = nextRound;
    }


    if (allMatchesCompleted &&
        tournamentData.active.rounds[currentRound].length === 1 &&
        tournamentData.active.rounds[currentRound][0].completed) {

        const finalMatch = tournamentData.active.rounds[currentRound][0];

        tournamentData.active.winners.first = finalMatch.winner;
        tournamentData.active.winners.second = finalMatch.loser;
        tournamentData.active.status = "completed";
        tournamentData.active.endTime = Date.now();


        const playerData = loadPlayerData();
        const rewards = TOURNAMENT_TYPES[tournamentData.active.type].rewards;


        if (playerData[finalMatch.winner.id]) {
            const winner = playerData[finalMatch.winner.id];
            winner.stats.exp += rewards.first.exp;
            winner.stats.zeni += rewards.first.zeni;

            if (rewards.first.item) {
                if (!winner.inventory) winner.inventory = { items: [] };
                if (!winner.inventory.items) winner.inventory.items = [];

                const existingItem = winner.inventory.items.find(item => item.id === rewards.first.item);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    winner.inventory.items.push({
                        id: rewards.first.item,
                        quantity: 1,
                        type: "trophy"
                    });
                }
            }
        }


        if (playerData[finalMatch.loser.id]) {
            const second = playerData[finalMatch.loser.id];
            second.stats.exp += rewards.second.exp;
            second.stats.zeni += rewards.second.zeni;
        }


        tournamentData.active.winners.semifinalists.forEach(player => {
            if (player && playerData[player.id]) {
                const semifinalist = playerData[player.id];
                semifinalist.stats.exp += rewards.semifinal.exp;
                semifinalist.stats.zeni += rewards.semifinal.zeni;
            }
        });


        tournamentData.history.push({
            type: tournamentData.active.type,
            startTime: tournamentData.active.startTime,
            endTime: tournamentData.active.endTime,
            organizer: tournamentData.active.organizer,
            participants: Object.keys(tournamentData.registrations).length,
            winners: {
                first: tournamentData.active.winners.first,
                second: tournamentData.active.winners.second,
                semifinalists: tournamentData.active.winners.semifinalists
            }
        });

        savePlayerData(playerData);
    }
}
function getAuraColorForEvolution(evolutionName, planet) {

    const auraColors = {
        EARTH: {
            "Con người thường": "#FFFFFF",
            "Chiến Binh Z": "#4080FF",
            "Bậc Thầy Khí": "#0040FF",
            "Siêu Chiến Binh": "#00FFFF",
            "Tiềm Năng Khai Phá": "#FFFFFF",
            "Chí Tôn Trái Đất": "#80C0FF"
        },
        NAMEK: {
            "Namek thường": "#80FF80",
            "Namek Warrior": "#40C040",
            "Super Namek": "#00FF00",
            "Namek Fusion": "#00C000"
        },
        SAIYAN: {
            "Saiyan thường": "#FFFFFF",
            "Super Saiyan": "#FFD700",
            "Super Saiyan 2": "#FFA500",
            "Super Saiyan 3": "#FF8000",
            "Super Saiyan God": "#FF0000",
            "Ultra Instinct": "#C0C0FF"
        }
    };

    return auraColors[planet]?.[evolutionName] || "#FFFFFF";
}
function checkAndUpdateEvolution(player) {

    if (!EVOLUTION_SYSTEM[player.planet]) {
        return false;
    }

    const evolutionForms = EVOLUTION_SYSTEM[player.planet].forms;
    if (!evolutionForms || evolutionForms.length === 0) return false;

    let highestForm = evolutionForms[0];
    for (let i = 1; i < evolutionForms.length; i++) {
        const form = evolutionForms[i];
        if (player.stats.power >= form.powerRequired) {
            highestForm = form;
        } else {
            break;
        }
    }

    if (!player.evolution || player.evolution.name !== highestForm.name) {
        const oldPower = player.stats.power;
        const oldDamage = player.stats.damage;
        const oldKi = player.stats.ki;
        const oldHealth = player.stats.health;

        if (player.evolution) {
            const oldForm = evolutionForms.find(form => form.name === player.evolution.name);
            if (oldForm) {
                player.stats.power = Math.floor(player.stats.power / oldForm.powerBonus);
                player.stats.damage = Math.floor(player.stats.damage / oldForm.damageBonus);
                player.stats.ki = Math.floor(player.stats.ki / oldForm.kiBonus);
                player.stats.health = Math.floor(player.stats.health / oldForm.healthBonus);
            }
        }

        player.evolution = {
            name: highestForm.name,
            level: evolutionForms.findIndex(form => form.name === highestForm.name),
            description: highestForm.description,
            achievedAt: new Date().toISOString(),
            auraColor: getAuraColorForEvolution(highestForm.name, player.planet)
        };

        player.stats.power = Math.floor(player.stats.power * highestForm.powerBonus);
        player.stats.damage = Math.floor(player.stats.damage * highestForm.damageBonus);
        player.stats.ki = Math.floor(player.stats.ki * highestForm.kiBonus);
        player.stats.health = Math.floor(player.stats.health * highestForm.healthBonus);

        return {
            name: highestForm.name,
            oldPower: oldPower,
            newPower: player.stats.power,
            oldDamage: oldDamage,
            newDamage: player.stats.damage,
            oldKi: oldKi,
            newKi: player.stats.ki,
            oldHealth: oldHealth,
            newHealth: player.stats.health
        };
    }

    return false;
}
function loadDragonBallData() {
    try {
        if (fs.existsSync(DB_BALL_FILE)) {
            return JSON.parse(fs.readFileSync(DB_BALL_FILE));
        }
    } catch (err) {
        console.error("Error loading dragon ball data:", err);
    }
    return JSON.parse(JSON.stringify(DRAGON_BALLS));
}

function saveDragonBallData(data) {
    fs.writeFileSync(DB_BALL_FILE, JSON.stringify(data, null, 2));
}
function loadPlayerData() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error("Lỗi khi đọc dữ liệu người chơi:", error);
        return {};
    }
}

function savePlayerData(data) {
    try {
        if (!fs.existsSync(DB_FOLDER)) {
            fs.mkdirSync(DB_FOLDER, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Lỗi khi lưu dữ liệu người chơi:", error);
    }
}


function canUseSelfDestruct(playerHP, playerMaxHP, playerKi, playerMaxKi, currentTurn) {
    const hpPercent = (playerHP / playerMaxHP) * 100;
    const kiPercent = (playerKi / playerMaxKi) * 100;

    const turnCondition = currentTurn >= 25;
    const hpCondition = hpPercent <= 20;
    const kiCondition = kiPercent >= 80;

    return {
        canUse: turnCondition && hpCondition && kiCondition,
        reason: !turnCondition ? "EARLY_TURN" :
            !hpCondition ? "HP_TOO_HIGH" :
                !kiCondition ? "KI_TOO_LOW" : null,
        hpPercent,
        kiPercent,
        currentTurn
    };
}


function selectBestSkill(player, playerHP, playerKi, opponentHP, playerStates, opponentStates, battleLog) {
    if (!player.skills || player.skills.length === 0) return null;

    const maxHP = player.stats.health;
    const maxKi = player.stats.ki;
    const hpPercent = (playerHP / maxHP) * 100;
    const kiPercent = (playerKi / maxKi) * 100;

    const isLowHP = hpPercent <= 30;
    const isMediumHP = hpPercent > 30 && hpPercent < 70;
    const isHighHP = hpPercent >= 70;

    const isLowKi = kiPercent <= 30;
    const isMediumKi = kiPercent > 30 && kiPercent < 70;
    const isHighKi = kiPercent >= 70;

    const usableSkills = player.skills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const skillData = MASTERS[master].skills[skillName];
        const kiRequired = Math.floor(playerKi * Math.abs(skillData.kiCost));

        return (skillData.kiCost <= 0) || (playerKi >= kiRequired);
    });

    if (usableSkills.length === 0) {
        return null;
    }


    let skillScores = [];

    usableSkills.forEach(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const skillData = MASTERS[master].skills[skillName];
        let score = 0;


        switch (skillName) {

            case "REGENERATION":
            case "WHISTLE":

                if (isLowHP) score += 95;
                else if (isMediumHP && Math.random() < 0.3) score += 50;
                else score += 10;


                if (player.usedRegenInBattle && Object.keys(player.usedRegenInBattle).length > 0) {
                    score -= 80;
                }
                break;


            case "REGENERATE_ENERGY":

                if (isLowKi) score += 90;
                else if (isMediumKi) score += 40;
                else score += 5;
                break;


            case "ENERGY_SHIELD":

                if (!playerStates.shielded && (isLowHP || isMediumHP)) score += 80;
                else score += 10;
                break;


            case "KAIOKEN":

                if (!playerStates.powerBoosted && isHighHP) score += 85;

                else if (isLowHP) score += 5;
                else score += 40;
                break;


            case "SOLAR_FLARE":
            case "HYPNOSIS":

                if (!opponentStates.stunned) score += 75;
                else score += 15;
                break;


            case "BIND":

                if (!opponentStates.bound) score += 70;
                else score += 15;
                break;


            case "SPIRIT_BOMB":

                if (player.spiritBombCharge >= 20) score += 95;
                else if (player.spiritBombCharge >= 10) score += 70;
                else if (isHighHP && isHighKi) score += 50;
                else score += 10;
                break;


            default:

                if (skillData.powerScale > 0) {

                    score += skillData.powerScale * 10;


                    score += (1 - skillData.kiCost) * 20;


                    if (isHighHP) score += 20;
                }
                else {

                    score += 30;
                }
                break;
        }


        score += Math.random() * 10;

        skillScores.push({
            skillChoice,
            skillName,
            score
        });
    });


    skillScores.sort((a, b) => b.score - a.score);


    const topSkills = skillScores.slice(0, Math.min(3, skillScores.length));


    const rand = Math.random();
    let selectedSkill;

    if (rand < 0.7 || topSkills.length === 1) {
        selectedSkill = topSkills[0].skillChoice;
    } else if (rand < 0.9 && topSkills.length >= 2) {
        selectedSkill = topSkills[1].skillChoice;
    } else if (topSkills.length >= 3) {
        selectedSkill = topSkills[2].skillChoice;
    } else {
        selectedSkill = topSkills[0].skillChoice;
    }

    return selectedSkill;
}

module.exports = {
    name: "dball",
    version: "1.7.2",
    usedby: 0,
    onPrefix: true,
    dev: "HNT",
    info: "Game Dragon Ball Z",
    category: "Games",
    usages: ".dball",
    cooldowns: 5,

    onLoad: function () {
        if (!fs.existsSync(DB_FOLDER)) {
            fs.mkdirSync(DB_FOLDER, { recursive: true });
        }

        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
        }

        if (!fs.existsSync(DB_BALL_FILE)) {
            fs.writeFileSync(DB_BALL_FILE, JSON.stringify(DRAGON_BALLS, null, 2));
        }

        if (!fs.existsSync(TOURNAMENT_DB)) {
            fs.writeFileSync(TOURNAMENT_DB, JSON.stringify({
                active: null,
                history: [],
                registrations: {}
            }, null, 2));
        }
        try {
            const playerData = loadPlayerData();
            for (const [id, player] of Object.entries(playerData)) {
                validatePlayerSkills(player);
            }
            savePlayerData(playerData);
            console.log("Đã kiểm tra và cập nhật kỹ năng của tất cả người chơi");
        } catch (error) {
            console.error("Lỗi khi kiểm tra kỹ năng người chơi:", error);
        }
        const canvasCacheDir = path.join(__dirname, "../game/canvas/cache");
        if (!fs.existsSync(canvasCacheDir)) {
            fs.mkdirSync(canvasCacheDir, { recursive: true });
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            console.log("DB_FILE path:", DB_FILE);


            const userData = JSON.parse(fs.readFileSync(path.join(__dirname, "../events/cache/userData.json")));


            let command = (target[0] || "").toLowerCase();


            let playerData;
            try {
                playerData = loadPlayerData();
                console.log(`PlayerData loaded successfully: ${typeof playerData}, keys: ${Object.keys(playerData).length}`);

                if (!playerData) {
                    console.log("playerData is null or undefined, initializing empty object");
                    playerData = {};
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu người chơi:", error);
                playerData = {};
            }

            console.log("PlayerData loaded successfully, found", Object.keys(playerData).length, "players");
            console.log("Current user ID:", senderID, "exists:", !!playerData[senderID]);

            if (!target[0]) {
                if (playerData[senderID]) {
                    const menuImageData = {
                        playerName: playerData[senderID].name,
                        playerPlanet: playerData[senderID].planet,
                        playerStats: playerData[senderID].stats,
                        playerEvolution: playerData[senderID].evolution?.name || null,
                        playerRace: PLANETS[playerData[senderID].planet].name,
                        planetTheme: PLANET_THEME_COLORS[playerData[senderID].planet] || PLANET_THEME_COLORS.EARTH
                    };

                    const menuImagePath = await createMenuImage(menuImageData);

                    if (menuImagePath) {
                        return api.sendMessage(
                            {
                                body: "🐉 𝗗𝗥𝗔𝗚𝗢𝗡 𝗕𝗔𝗟𝗟 𝗭 🐉\nSử dụng các lệnh sau để chơi game:",
                                attachment: fs.createReadStream(menuImagePath)
                            },
                            threadID,
                            () => fs.unlinkSync(menuImagePath),
                            messageID
                        );
                    } else {
                        return api.sendMessage(
                            "🐉 𝗗𝗥𝗔𝗚𝗢𝗡 𝗕𝗔𝗟𝗟 𝗭 🐉\n" +
                            "───────────────\n" +
                            "Các lệnh có sẵn:\n\n" +
                            "• info - Xem thông tin nhân vật\n" +
                            "• train - Luyện tập tăng EXP\n" +
                            "• Shop - Shop Vật Phẩm\n" +
                            "• give - Tặng Ngọc Rồng cho người khác\n" +
                            "• fight - Thách đấu người chơi khác\n" +
                            "• quest - Xem nhiệm vụ\n" +
                            "• rank - Xem bảng xếp hạng\n\n" +
                            "Cách dùng: .dball <lệnh>",
                            threadID, messageID
                        );
                        return;
                    }
                } else {
                    const menuImagePath = await createMenuImage({
                        isNewPlayer: true
                    });

                    if (menuImagePath) {
                        return api.sendMessage(
                            {
                                body: "🐉 𝗗𝗥𝗔𝗚𝗢𝗡 𝗕𝗔𝗟𝗟 𝗭 🐉\nChọn hành tinh để bắt đầu:",
                                attachment: fs.createReadStream(menuImagePath)
                            },
                            threadID,
                            () => fs.unlinkSync(menuImagePath),
                            messageID
                        );
                    } else {
                        return api.sendMessage(
                            "🐉 𝗗𝗥𝗔𝗚𝗢𝗡 𝗕𝗔𝗟𝗟 𝗭 🐉\n" +
                            "Chọn hành tinh để bắt đầu:\n\n" +
                            Object.entries(PLANETS).map(([key, data]) =>
                                `${key}: ${data.name}\n` +
                                `• ${data.description}`
                            ).join("\n\n") + "\n\n" +
                            "Cách dùng: .dball <tên_hành_tinh>\n" +
                            "VD: .dball earth",
                            threadID, messageID
                        );
                    }
                }
            }

            if (!playerData[senderID] && Object.keys(PLANETS).some(p => p.toLowerCase() === command)) {
                const planet = Object.keys(PLANETS).find(p => p.toLowerCase() === command);
                const userName = userData[senderID]?.name || "Người chơi";

                const savePlayerDataLocal = () => {
                    savePlayerData(playerData);
                };

                playerData[senderID] = {
                    name: userName,
                    planet: planet,
                    stats: { ...DEFAULT_STATS },
                    skills: [],
                    masters: [],
                    lastTrain: 0,
                    created: Date.now(),
                    inventory: {
                        dragonBalls: []
                    }
                };

                updateQuestProgress(playerData[senderID], QUEST_TYPES.MASTER, playerData);
                savePlayerData(playerData);

                return api.sendMessage(
                    "🎉 NHÂN VẬT ĐÃ ĐƯỢC TẠO!\n" +
                    "───────────────\n" +
                    `👤 Tên: ${userName}\n` +
                    `🌍 Tộc người: ${PLANETS[planet].name}\n` +
                    `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 cơ bản: ${DEFAULT_STATS.power}\n` +
                    `✨ Ki: ${DEFAULT_STATS.ki}\n` +
                    `❤️ HP: ${DEFAULT_STATS.health}\n` +
                    `💰 Zeni: ${DEFAULT_STATS.zeni.toLocaleString()}\n\n` +
                    "💡 Dùng .dball train để bắt đầu luyện tập!",
                    threadID, messageID
                );
            }

            switch (command) {
                case "info": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }
                    const removedSkills = validatePlayerSkills(player);
                    if (removedSkills && removedSkills.length > 0) {
                        savePlayerData(playerData);
                        api.sendMessage(
                            `⚠️ Cảnh báo: Bạn đã bị loại bỏ ${removedSkills.length} kỹ năng vì không đủ sức mạnh:\n` +
                            `${removedSkills.join(", ")}\n\n` +
                            `💡 Hãy tiếp tục luyện tập để có thể sử dụng lại các kỹ năng này.`,
                            threadID
                        );
                    }
                    let skillList = "";
                    if (player.skills.length > 0) {
                        skillList = "\n\n⚔️ KỸ NĂNG ĐÃ HỌC:\n" + player.skills.map(skill => {
                            const [master, skillName] = skill.split(":");
                            const skillData = MASTERS[master].skills[skillName];

                            const damage = skillData.powerScale > 0 ?
                                Math.floor(player.stats.damage * skillData.powerScale) : 0;

                            const kiCost = skillData.kiCost != 0 ?
                                Math.abs(Math.floor(player.stats.ki * skillData.kiCost)) : 0;

                            if (skillData.powerScale > 0) {
                                return `- ${skillData.name} (⚔️ ${damage.toLocaleString()} DMG, ${skillData.kiCost > 0 ? "✨ -" + kiCost + " Ki" : ""})`;
                            } else if (skillData.kiCost < 0) {
                                return `- ${skillData.name} (${skillData.description}, ✨ +${kiCost} Ki)`;
                            } else {
                                return `- ${skillData.name} (${skillData.description}, ✨ -${kiCost} Ki)`;
                            }
                        }).join("\n");
                    }

                    let masterList = "";
                    if (player.masters.length > 0) {
                        masterList = "\n\n👨‍🏫 Sư phụ đã gặp:\n" + player.masters.map(master =>
                            `- ${MASTERS[master].name}`
                        ).join("\n");
                    }

                    let inventoryList = "";
                    if (player.inventory?.items?.length > 0) {
                        inventoryList = "\n\n📦 KHO ĐỒ:\n";

                        const equipped = player.inventory.items.filter(item => item.equipped);
                        if (equipped.length > 0) {
                            inventoryList += "🎽 Đang sử dụng:\n";
                            equipped.forEach(item => {
                                const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                                if (itemData) {
                                    inventoryList += `${itemData.emoji} ${itemData.name}\n`;
                                }
                            });
                        }

                        const nonEquipped = player.inventory.items.filter(item => !item.equipped);
                        if (nonEquipped.length > 0) {
                            inventoryList += "\n💼 Túi đồ:\n";
                            nonEquipped.forEach(item => {
                                const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                                if (itemData) {
                                    inventoryList += `${itemData.emoji} ${itemData.name} x${item.quantity}\n`;
                                }
                            });
                        }
                    }

                    if (player.inventory?.dragonBalls?.length > 0) {
                        inventoryList += "\n🔮 NGỌC RỒNG:\n";
                        const dragonBallsByPlanet = {};

                        player.inventory.dragonBalls.forEach(ball => {
                            if (!dragonBallsByPlanet[ball.planet]) {
                                dragonBallsByPlanet[ball.planet] = [];
                            }
                            dragonBallsByPlanet[ball.planet].push(ball.star);
                        });

                        Object.entries(dragonBallsByPlanet).forEach(([planet, stars]) => {
                            stars.sort((a, b) => a - b);
                            inventoryList += `${PLANETS[planet].name}: ${stars.map(s => `${s}⭐`).join(", ")}\n`;
                        });

                        Object.entries(dragonBallsByPlanet).forEach(([planet, stars]) => {
                            if (stars.length === 7) {
                                inventoryList += `\n🐉 Bạn đã thu thập đủ 7 viên Ngọc Rồng ${PLANETS[planet].name}!\n`;
                                inventoryList += "💡 Dùng .dball wish để thực hiện điều ước\n";
                            }
                        });
                    }
                    let evolutionInfo = "";
                    if (player.evolution) {
                        evolutionInfo = "\n\n🌟 TIẾN HÓA:\n" +
                            `${player.evolution.name}\n` +
                            `📝 ${player.evolution.description}\n`;

                        if (player.evolution.level > 0) {
                            const evolutionForm = EVOLUTION_SYSTEM[player.planet].forms[player.evolution.level];
                            evolutionInfo += `💪 x${evolutionForm.powerBonus} 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵\n`;
                            evolutionInfo += `⚔️ x${evolutionForm.damageBonus} Sức đánh\n`;
                            evolutionInfo += `✨ x${evolutionForm.kiBonus} Ki\n`;
                            evolutionInfo += `❤️ x${evolutionForm.healthBonus} HP\n`;
                        }
                    }
                    if (!player.stats.currentHealth) player.stats.currentHealth = player.stats.health;
                    if (!player.stats.currentKi) player.stats.currentKi = player.stats.ki;

                    let amuletList = "";
                    if (player.amulets && player.amulets.length > 0) {

                        player.amulets = player.amulets.filter(amulet => amulet.expireAt > Date.now());

                        if (player.amulets.length > 0) {
                            amuletList = "\n\n🔮 BÙA ĐANG CÓ HIỆU LỰC:\n";
                            player.amulets.forEach(amulet => {
                                const timeLeft = Math.floor((amulet.expireAt - Date.now()) / 3600000);
                                amuletList += `${amulet.emoji} ${amulet.name} - Còn ${timeLeft} giờ\n`;
                            });
                        }

                        savePlayerData(playerData);
                    }


                    return api.sendMessage(
                        "📊 𝗧𝗛𝗢̂𝗡𝗚 𝗧𝗜𝗡 𝗡𝗛𝗔̂𝗡 𝗩𝗔̣̂𝗧 📊\n" +
                        "───────────────\n" +
                        `👤 Tên: ${player.name}\n` +
                        `🌍 Tộc Người: ${PLANETS[player.planet].name}\n` +
                        `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${player.stats.power.toLocaleString()}\n` +
                        `⚔️ Sức đánh: ${player.stats.damage.toLocaleString()}\n` +
                        `✨ Ki: ${player.stats.currentKi.toLocaleString()}/${player.stats.ki.toLocaleString()}\n` +
                        `❤️ HP: ${player.stats.currentHealth.toLocaleString()}/${player.stats.health.toLocaleString()}\n` +
                        `💰 Zeni: ${(player.stats.zeni || 0).toLocaleString()}\n` +
                        `📊 EXP: ${player.stats.exp.toLocaleString()}` +
                        evolutionInfo +
                        skillList + masterList + inventoryList + amuletList,
                        threadID, messageID
                    );
                    break;
                }

                case "use": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (!target[1]) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập ID vật phẩm!\n" +
                            "Cách dùng: .dball use <id_vật_phẩm>\n" +
                            "💡 Xem ID vật phẩm trong shop hoặc inventory",
                            threadID, messageID
                        );
                    }

                    const itemId = target[1].toLowerCase();
                    const shopItem = Object.values(SHOP_ITEMS).find(item => item.id === itemId);

                    if (!shopItem) {
                        return api.sendMessage("❌ Vật phẩm không tồn tại!", threadID, messageID);
                    }

                    if (!player.inventory?.items?.some(item => item.id === itemId)) {
                        return api.sendMessage(
                            `❌ Bạn không có ${shopItem.name} trong kho đồ!`,
                            threadID, messageID
                        );
                    }

                    const inventoryItem = player.inventory.items.find(item => item.id === itemId);


                    if (inventoryItem.usedTime && shopItem.duration) {
                        const remainingTime = inventoryItem.usedTime + shopItem.duration - Date.now();
                        if (remainingTime > 0) {
                            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
                            const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
                            return api.sendMessage(
                                `❌ ${shopItem.name} vẫn còn hiệu lực hoặc đang trong thời gian hồi!\n` +
                                `⏳ Thời gian còn lại: ${hours} giờ ${minutes} phút`,
                                threadID, messageID
                            );
                        }
                    }

                    switch (shopItem.type) {
                        case "consumable": {

                            if (shopItem.duration && itemId !== "senzu") {
                                inventoryItem.usedTime = Date.now();
                            }

                            switch (itemId) {
                                case "senzu": {
                                    const oldKi = player.stats.currentKi || player.stats.ki;
                                    const oldHP = player.stats.currentHealth || player.stats.health;

                                    if (!player.originalKi && player.stats.ki !== player.baseStats?.ki) {
                                        player.originalKi = player.baseStats?.ki || player.stats.ki;
                                    }

                                    player.stats.currentHealth = player.stats.health;
                                    player.stats.currentKi = player.stats.ki;

                                    if (player.originalHealth && player.originalHealth > player.stats.health) {
                                        player.stats.health = player.originalHealth;
                                        player.stats.currentHealth = player.originalHealth;
                                        delete player.originalHealth;
                                    }

                                    if (player.originalKi && player.originalKi > player.stats.ki) {
                                        player.stats.ki = player.originalKi;
                                        player.stats.currentKi = player.originalKi;
                                        delete player.originalKi;
                                    }

                                    if (!player.baseStats) {
                                        player.baseStats = {
                                            damage: player.stats.damage,
                                            health: player.stats.health,
                                            ki: player.stats.ki
                                        };
                                    }

                                    inventoryItem.quantity--;
                                    if (inventoryItem.quantity <= 0) {
                                        player.inventory.items = player.inventory.items.filter(item => item.id !== itemId);
                                    }

                                    savePlayerData(playerData);

                                    return api.sendMessage(
                                        "✨ 𝗦𝗨̛̉ 𝗗𝗨̣𝗡𝗚 Đ𝗔̣̂𝗨 𝗧𝗛𝗔̂̀𝗡 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚!\n" +
                                        "───────────────\n" +
                                        `❤️ HP: ${oldHP.toLocaleString()} → ${player.stats.currentHealth.toLocaleString()} (phục hồi hoàn toàn!)\n` +
                                        `✨ Ki: ${oldKi.toLocaleString()} → ${player.stats.currentKi.toLocaleString()} (phục hồi hoàn toàn!)\n` +
                                        `📦 Còn lại: ${inventoryItem.quantity} Đậu Thần\n\n` +
                                        `💡 Bạn đã hồi phục hoàn toàn và có thể tiếp tục chiến đấu!`,
                                        threadID, messageID
                                    );
                                }

                                case "crystal": {

                                    inventoryItem.usedTime = Date.now();

                                    const oldPower = player.stats.power;
                                    player.stats.power += 10000;


                                    inventoryItem.quantity--;
                                    if (inventoryItem.quantity <= 0) {
                                        player.inventory.items = player.inventory.items.filter(item => item.id !== itemId);
                                    }

                                    savePlayerData(playerData);

                                    return api.sendMessage(
                                        "💎 SỬ DỤNG TINH THỂ THÀNH CÔNG!\n" +
                                        "───────────────\n" +
                                        `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${oldPower} → ${player.stats.power}\n` +
                                        `📦 Còn lại: ${inventoryItem.quantity} Tinh Thể\n` +
                                        `⏳ Thời gian hồi: 1 giờ`,
                                        threadID, messageID
                                    );
                                }


                            }
                            break;
                        }

                        case "radar": {

                            inventoryItem.usedTime = Date.now();

                            return api.sendMessage(
                                "📡 TRANG BỊ THÀNH CÔNG!\n" +
                                "───────────────\n" +
                                `Đã trang bị: ${shopItem.name}\n` +
                                `🔍 Tỷ lệ tìm thấy Ngọc Rồng tăng x3\n` +
                                `⏳ Thời gian hiệu lực: 1 giờ`,
                                threadID, messageID
                            );
                        }

                        case "equipment": {
                            if (inventoryItem.equipped) {
                                return api.sendMessage(
                                    `❌ Bạn đã trang bị ${shopItem.name} rồi!`,
                                    threadID, messageID
                                );
                            }


                            inventoryItem.usedTime = Date.now();
                            inventoryItem.visualEffect = getVisualEffectForItem(itemId);
                            inventoryItem.equipped = true;

                            switch (itemId) {
                                case "scouter": {
                                    const oldKi = player.stats.ki;
                                    player.stats.ki = Math.floor(player.stats.ki * 1.1);
                                    player.stats.currentKi = player.stats.ki;

                                    savePlayerData(playerData);

                                    return api.sendMessage(
                                        "🔋 TRANG BỊ THÀNH CÔNG!\n" +
                                        "───────────────\n" +
                                        `Đã trang bị: ${shopItem.name}\n` +
                                        `✨ Ki: ${oldKi} → ${player.stats.ki}\n` +
                                        `⏳ Thời gian hiệu lực: 1 giờ`,
                                        threadID, messageID
                                    );
                                }

                                case "armor": {
                                    const oldHealth = player.stats.health;
                                    player.stats.health = Math.floor(player.stats.health * 1.15);
                                    player.stats.currentHealth = player.stats.health;

                                    savePlayerData(playerData);

                                    return api.sendMessage(
                                        "🛡️ TRANG BỊ THÀNH CÔNG!\n" +
                                        "───────────────\n" +
                                        `Đã trang bị: ${shopItem.name}\n` +
                                        `❤️ HP: ${oldHealth} → ${player.stats.health}\n` +
                                        `⏳ Thời gian hiệu lực: 1 giờ`,
                                        threadID, messageID
                                    );
                                }


                            }
                            break;
                        }
                    }
                    updateQuestProgress(player, QUEST_TYPES.COLLECT, playerData);
                    savePlayerData(playerData);


                    return api.sendMessage(
                        `✅ Đã sử dụng ${shopItem.name} thành công!\n` +
                        `⏳ Thời gian hiệu lực: 1 giờ`,
                        threadID, messageID
                    );
                    break;
                }

                case "shop": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (target[1]?.toLowerCase() === "bua" || target[1]?.toLowerCase() === "amulet") {
                        const amuletsArray = Object.values(AMULETS);

                        if (!target[2]) {

                            const amuletShopData = {
                                amulets: amuletsArray,
                                player: {
                                    name: player.name,
                                    race: PLANETS[player.planet].name,
                                    zeni: player.stats.zeni
                                }
                            };

                            const amuletShopPath = await createAmuletShopImage(amuletShopData);

                            if (amuletShopPath) {
                                return api.sendMessage(
                                    {
                                        body: "👵 TIỆM BÙA BÀ HẠT MÍT 👵\nChọn số thứ tự để mua bùa\nmua : .dball shop bua Số bùa",
                                        attachment: fs.createReadStream(amuletShopPath)
                                    },
                                    threadID,
                                    () => fs.unlinkSync(amuletShopPath),
                                    messageID
                                );
                            } else {
                                let msg = "👵 BÀ HẠT MÍT - TIỆM BÙA 👵\n───────────────\n\n";

                                amuletsArray.forEach((amulet, index) => {
                                    msg += `${index + 1}. ${amulet.emoji} ${amulet.name}\n`;
                                    msg += `💰 Giá: ${amulet.price.toLocaleString()} Zeni\n`;
                                    msg += `📝 ${amulet.description}\n\n`;
                                });

                                msg += "Cách mua:\n";
                                msg += "• .dball shop bua <số thứ tự>\n";
                                msg += "• VD: .dball shop bua 1 (Mua bùa số 1)\n\n";
                                msg += `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}`;

                                return api.sendMessage(msg, threadID, messageID);
                            }
                        }

                        const amuletIndex = parseInt(target[2]) - 1;

                        if (isNaN(amuletIndex) || amuletIndex < 0 || amuletIndex >= amuletsArray.length) {
                            return api.sendMessage("❌ Số thứ tự bùa không hợp lệ!", threadID, messageID);
                        }

                        const amulet = amuletsArray[amuletIndex];

                        if (player.stats.zeni < amulet.price) {
                            return api.sendMessage(
                                `❌ Không đủ 𝗭𝗲𝗻𝗶 để mua!\n` +
                                `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                `💰 Cần: ${amulet.price.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (!player.amulets) player.amulets = [];

                        const existingAmuletIndex = player.amulets.findIndex(a => a.id === amulet.id);
                        if (existingAmuletIndex !== -1) {
                            player.amulets[existingAmuletIndex].expireAt = Date.now() + amulet.duration;

                            player.stats.zeni -= amulet.price;
                            savePlayerData(playerData);

                            const expireTime = new Date(Date.now() + amulet.duration).toLocaleString();
                            return api.sendMessage(
                                "✨ 𝗚𝗜𝗔 𝗛𝗔̣𝗡 𝗕𝗨̀𝗔 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚! ✨\n" +
                                "───────────────\n" +
                                `${amulet.emoji} Đã gia hạn: ${amulet.name}\n` +
                                `💰 Giá: ${amulet.price.toLocaleString()} Zeni\n` +
                                `⏳ Hiệu lực đến: ${expireTime}\n` +
                                `📝 Hiệu quả: ${amulet.description}`,
                                threadID, messageID
                            );
                        }

                        player.amulets.push({
                            id: amulet.id,
                            name: amulet.name,
                            effect: amulet.effect,
                            boost: amulet.boost || 1,
                            emoji: amulet.emoji,
                            expireAt: Date.now() + amulet.duration
                        });

                        player.stats.zeni -= amulet.price;
                        savePlayerData(playerData);

                        const expireTime = new Date(Date.now() + amulet.duration).toLocaleString();
                        return api.sendMessage(
                            "✨ MUA BÙA THÀNH CÔNG! ✨\n" +
                            "───────────────\n" +
                            `${amulet.emoji} Đã mua: ${amulet.name}\n` +
                            `💰 Giá: ${amulet.price.toLocaleString()} Zeni\n` +
                            `⏳ Hiệu lực đến: ${expireTime}\n` +
                            `📝 Hiệu quả: ${amulet.description}`,
                            threadID, messageID
                        );
                    }

                    const shopItemsArray = Object.values(SHOP_ITEMS);

                    if (!target[1]) {
                        let msg = "🏪 𝗦𝗛𝗢𝗣 𝗩𝗔̣̂𝗧 𝗣𝗛𝗔̂̉𝗠 🏪\n───────────────\n\n";

                        shopItemsArray.forEach((item, index) => {
                            msg += `${index + 1}. ${item.emoji} ${item.name}\n`;
                            msg += `💰 Giá: ${item.price.toLocaleString()} Zeni\n`;
                            msg += `📝 ${item.description}\n`;
                            msg += `📦 Loại: ${item.type === "consumable" ? "Tiêu hao" : item.type === "equipment" ? "Trang bị" : "Đặc biệt"}\n\n`;
                        });

                        msg += "Cách dùng:\n";
                        msg += "• .dball shop <số thứ tự> <số lượng>\n";
                        msg += "• VD: .dball shop 1 1 (Mua vật phẩm số 1, số lượng 1)\n\n";
                        msg += "• .𝗱𝗯𝗮𝗹𝗹 𝘀𝗵𝗼𝗽 𝗯𝘂𝗮 - 𝗠𝗼̛̉ 𝘁𝗶𝗲̣̂𝗺 𝗯𝘂̀𝗮 𝗰𝘂̉𝗮 𝗕𝗮̀ 𝗛𝗮̣𝘁 𝗠𝗶́𝘁\n\n";
                        msg += `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}`;

                        return api.sendMessage(msg, threadID, messageID);
                    }

                    const itemIndex = parseInt(target[1]) - 1;
                    const quantity = parseInt(target[2]) || 1;

                    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= shopItemsArray.length) {
                        return api.sendMessage("❌ Số thứ tự vật phẩm không hợp lệ!", threadID, messageID);
                    }

                    const item = shopItemsArray[itemIndex];
                    const totalCost = item.price * quantity;

                    if (player.stats.zeni < totalCost) {
                        return api.sendMessage(
                            `❌ Không đủ 𝗭𝗲𝗻𝗶 để mua!\n` +
                            `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                            `💰 Cần: ${totalCost.toLocaleString()}`,
                            threadID, messageID
                        );
                    }

                    if (!player.inventory) player.inventory = { items: [] };
                    if (!player.inventory.items) player.inventory.items = [];

                    const existingItem = player.inventory.items.find(i => i.id === item.id);

                    if (existingItem) {
                        existingItem.quantity += quantity;
                    } else {
                        player.inventory.items.push({
                            id: item.id,
                            quantity: quantity,
                            type: item.type
                        });
                    }

                    player.stats.zeni -= totalCost;
                    savePlayerData(playerData);

                    return api.sendMessage(
                        "🛍️ 𝗠𝗨𝗔 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚!\n" +
                        "───────────────\n" +
                        `${item.emoji} Đã mua: ${item.name} x${quantity}\n` +
                        `💰 Tổng giá: ${totalCost.toLocaleString()} Zeni\n` +
                        `💰 Số 𝗭𝗲𝗻𝗶 còn lại: ${player.stats.zeni.toLocaleString()}\n\n` +
                        `💡 Dùng .dball use ${item.id} để sử dụng/trang bị`,
                        threadID, messageID
                    );
                }
                case "train": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    const oldStats = { ...player.stats };

                    const powerGain = Math.floor(Math.random() * 200) + 300;
                    player.stats.power = checkStatLimit(
                        player.stats.power + powerGain,
                        'POWER'
                    );

                    const now = Date.now();
                    const cooldown = 30000;
                    if (now - player.lastTrain < cooldown) {
                        const timeLeft = Math.ceil((cooldown - (now - player.lastTrain)) / 1000);
                        return api.sendMessage(
                            `⏳ Vui lòng đợi ${timeLeft}s để hồi phục sức!`,
                            threadID, messageID
                        );
                    }

                    const currentLocation = getTrainingLocation(oldStats.power);

                    const newLocation = getTrainingLocation(player.stats.power);

                    let locationChangeMessage = '';
                    if (currentLocation !== newLocation) {
                        locationChangeMessage = `\n\n🌟 ĐỊA ĐIỂM LUYỆN TẬP MỚI! 🌟\nBạn đã đủ sức mạnh để luyện tập tại: ${newLocation.name}\nTỷ lệ kinh nghiệm và sức mạnh x${newLocation.multiplier}!`;
                    }

                    let expBonus = 1.0;
                    let hasRadar = false;

                    if (player.inventory?.items) {
                        const equippedItems = player.inventory.items.filter(item => item.equipped);
                        equippedItems.forEach(item => {
                            if (item.id === "gravity") {
                                expBonus *= 1.2;
                            }
                            if (item.id === "radar") {
                                hasRadar = true;
                            }
                        });
                    }

                    const trainStats = {
                        expMultiplier: 1.0,
                        powerMultiplier: 1.0,
                        zeniMultiplier: 1.0
                    };

                    const amuletEffects = applyAmuletEffects(player, trainStats);

                    const locationMultiplier = newLocation.multiplier;

                    const expGain = Math.floor(calculateExpGain(player.stats.power, player.stats.damage) * expBonus * trainStats.expMultiplier * locationMultiplier);

                    if (player.stats.exp + expGain > MAX_EXP_STORAGE) {
                        player.stats.exp = MAX_EXP_STORAGE;
                    } else {
                        player.stats.exp += expGain;
                    }

                    const powerMultiplier = Math.floor(powerGain * locationMultiplier * trainStats.powerMultiplier);
                    player.stats.power = checkStatLimit(
                        player.stats.power + powerMultiplier - powerGain,
                        'POWER'
                    );

                    const normalZeni = Math.floor(Math.random() * (ZENI_INFO.TRAIN_MAX - ZENI_INFO.TRAIN_MIN + 1) + ZENI_INFO.TRAIN_MIN);
                    if (!player.stats.zeni) player.stats.zeni = 0;

                    player.stats.zeni += Math.floor(normalZeni * trainStats.zeniMultiplier);

                    let zeniMessage = "";
                    let zeniGain = Math.floor(normalZeni * trainStats.zeniMultiplier);

                    if (Math.random() < ZENI_INFO.FIND_CHANCE) {
                        const specialZeni = Math.floor(Math.random() * (ZENI_INFO.SPECIAL_MAX - ZENI_INFO.SPECIAL_MIN + 1) + ZENI_INFO.SPECIAL_MIN);

                        const bonusZeni = Math.floor(specialZeni * trainStats.zeniMultiplier);
                        player.stats.zeni += bonusZeni;
                        zeniMessage += `\n🌟 BẠN TÌM THẤY TÚI ZENI ĐẶC BIỆT! +${bonusZeni} ZENI`;
                        zeniGain += bonusZeni;
                    }


                    player.lastTrain = now;

                    const meetMaster = Math.random() < 0.3;
                    let masterMessage = "";
                    let dragonBallMessage = "";

                    let dragonBallChance = DRAGON_BALL_INFO.FIND_CHANCE;
                    if (hasRadar) {
                        dragonBallChance *= DRAGON_BALL_INFO.RADAR_BOOST;
                        dragonBallMessage += "\n📡 Rada Dò Ngọc Rồng đang hoạt động!";
                    }

                    if (Math.random() < dragonBallChance) {
                        const dragonBallData = loadDragonBallData();

                        const availableBalls = Object.entries(dragonBallData[player.planet])
                            .filter(([star, owner]) => owner === null)
                            .map(([star]) => parseInt(star));

                        if (availableBalls.length > 0) {
                            const randomStar = availableBalls[Math.floor(Math.random() * availableBalls.length)];

                            dragonBallData[player.planet][randomStar] = senderID;
                            saveDragonBallData(dragonBallData);

                            if (!player.inventory) player.inventory = { dragonBalls: [] };
                            if (!player.inventory.dragonBalls) player.inventory.dragonBalls = [];

                            player.inventory.dragonBalls.push({
                                planet: player.planet,
                                star: randomStar
                            });
                            updateQuestProgress(player, QUEST_TYPES.COLLECT);
                            dragonBallMessage += `\n\n🌟 BẠN ĐÃ TÌM THẤY NGỌC RỒNG ${randomStar} SAO!`;

                            if (hasAllDragonBalls(player, player.planet)) {
                                dragonBallMessage += "\n\n🐉 BẠN ĐÃ THU THẬP ĐỦ 7 VIÊN NGỌC RỒNG!\n";
                                dragonBallMessage += "💡 Dùng .dball wish để thực hiện điều ước!";
                            }
                        }
                    }
                    const evolution = checkAndUpdateEvolution(player);
                    let evolutionMessage = "";
                    if (evolution) {
                        evolutionMessage = "\n\n🌟 𝗧𝗜𝗘̂́𝗡 𝗛𝗢́𝗔 𝗠𝗢̛́𝗜! 🌟\n" +
                            `Bạn đã tiến hóa thành: ${evolution.name}\n` +
                            `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${evolution.oldPower.toLocaleString()} → ${evolution.newPower.toLocaleString()}\n` +
                            `⚔️ Sức đánh: ${evolution.oldDamage.toLocaleString()} → ${evolution.newDamage.toLocaleString()}\n` +
                            `✨ Ki: ${evolution.oldKi.toLocaleString()} → ${evolution.newKi.toLocaleString()}\n` +
                            `❤️ HP: ${evolution.oldHealth.toLocaleString()} → ${evolution.newHealth.toLocaleString()}`;
                    }
                    updateQuestProgress(player, QUEST_TYPES.TRAINING, playerData);
                    updateQuestProgress(player, QUEST_TYPES.POWER, playerData);
                    savePlayerData(playerData);
                    const trainImageData = {
                        name: player.name,
                        planetTheme: PLANET_THEME_COLORS[player.planet] || PLANET_THEME_COLORS.EARTH,
                        expGain: expGain,
                        oldPower: player.stats.power - powerMultiplier,
                        newPower: player.stats.power,
                        zeniGain: zeniGain,
                        powerLevel: player.stats.power,
                        oldHP: oldStats.health,
                        newHP: player.stats.health,
                        oldKi: oldStats.ki,
                        newKi: player.stats.ki,
                        oldDamage: oldStats.damage,
                        newDamage: player.stats.damage,
                        planet: player.planet,
                        evolution: player.evolution?.name || null,
                        race: PLANETS[player.planet].name,
                        equipment: player.inventory?.items?.filter(item => item.equipped) || [],
                        amulets: player.amulets?.filter(amulet => amulet.expireAt > Date.now()) || [],
                        dragonBalls: player.inventory?.dragonBalls?.filter(ball => ball.planet === player.planet)?.length || 0,
                        fonts: {
                            saiyan: getFontPath("Saiyan-Sans.ttf"),
                            arial: getFontPath("Arial.ttf")
                        },
                        location: newLocation,
                        locationMultiplier: locationMultiplier
                    };

                    const imagePath = await createTrainImage(trainImageData);
                    let amuletMessage = "";
                    if (amuletEffects && amuletEffects.applied) {
                        amuletMessage = "\n\n🔮 HIỆU ỨNG BÙA ĐANG KÍCH HOẠT:";
                        amuletEffects.effects.forEach(effect => {
                            amuletMessage += `\n${effect.emoji} ${effect.name}: ${effect.effect}`;
                        });
                    }
                    validatePlayerSkills(player);

                    let messageContent = "⚔️ KẾT QUẢ LUYỆN TẬP ⚔️\n" +
                        "───────────────\n" +
                        `🏋️ Địa điểm: ${newLocation.name} (x${newLocation.multiplier})\n` +
                        `💡 Dùng .dball upgrade để nâng cấp chỉ số\n` +
                        `💡 Dùng .dball learn để học kĩ năng` +
                        locationChangeMessage +
                        masterMessage +
                        dragonBallMessage +
                        amuletMessage +
                        evolutionMessage;

                    if (imagePath) {
                        return api.sendMessage(
                            {
                                body: messageContent,
                                attachment: fs.createReadStream(imagePath)
                            },
                            threadID,
                            () => fs.unlinkSync(imagePath),
                            messageID
                        );
                    } else {
                        return api.sendMessage(messageContent, threadID, messageID);
                    }
                }
                case "wish": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    const planets = ["EARTH", "NAMEK", "SAIYAN"];
                    let wishPlanet = null;

                    for (const planet of planets) {
                        if (hasAllDragonBalls(player, planet)) {
                            wishPlanet = planet;
                            break;
                        }
                    }

                    if (!wishPlanet) {
                        return api.sendMessage(
                            "❌ Bạn chưa thu thập đủ 7 viên Ngọc Rồng từ bất kỳ hành tinh nào!\n" +
                            "Tiếp tục luyện tập để tìm thấy các Ngọc Rồng còn thiếu.",
                            threadID, messageID
                        );
                    }

                    if (!target[1]) {
                        return api.sendMessage(
                            "🐉 𝗧𝗛𝗨̛̣𝗖 𝗛𝗜𝗘̣̂𝗡 Đ𝗜𝗘̂̀𝗨 𝗨̛𝗢̛́𝗖 🐉\n" +
                            "───────────────\n" +
                            "Bạn đã thu thập đủ 7 viên Ngọc Rồng từ " + PLANETS[wishPlanet].name + "!\n\n" +
                            "Chọn điều ước của bạn:\n\n" +
                            "1. 💰 " + DRAGON_WISHES.ZENI.name + " - " + DRAGON_WISHES.ZENI.reward + "\n" +
                            "2. 💪 " + DRAGON_WISHES.POWER.name + " - " + DRAGON_WISHES.POWER.reward + "\n" +
                            "3. 📊 " + DRAGON_WISHES.EXP.name + " - " + DRAGON_WISHES.EXP.reward + "\n\n" +
                            "Cách dùng: .dball wish <1-3>",
                            threadID, messageID
                        );
                    }

                    const choice = parseInt(target[1]);
                    if (isNaN(choice) || choice < 1 || choice > 3) {
                        return api.sendMessage(
                            "❌ Lựa chọn không hợp lệ! Vui lòng chọn từ 1 đến 3.",
                            threadID, messageID
                        );
                    }

                    let wish, wishName, wishMessage;
                    switch (choice) {
                        case 1:
                            wish = DRAGON_WISHES.ZENI;
                            wishName = "ZENI";
                            break;
                        case 2:
                            wish = DRAGON_WISHES.POWER;
                            wishName = "POWER";
                            break;
                        case 3:
                            wish = DRAGON_WISHES.EXP;
                            wishName = "EXP";
                            break;
                    }

                    wish.effect(player);

                    const dragonBallData = loadDragonBallData();
                    for (let i = 1; i <= 7; i++) {
                        dragonBallData[wishPlanet][i] = null;
                    }
                    saveDragonBallData(dragonBallData);

                    removeDragonBalls(player, wishPlanet);

                    savePlayerData(playerData);

                    return api.sendMessage(
                        "🌟 Đ𝗜𝗘̂̀𝗨 𝗨̛𝗢̛́𝗖 Đ𝗔̃ Đ𝗨̛𝗢̛̣𝗖 𝗧𝗛𝗨̛̣𝗖 𝗛𝗜𝗘̣̂𝗡! 🌟\n" +
                        "───────────────\n" +
                        `Rồng thần ${wishPlanet === "EARTH" ? "Shenron" : wishPlanet === "NAMEK" ? "Porunga" : "Super Shenron"} đã ban cho bạn:\n` +
                        `${wish.name} - ${wish.reward}\n\n` +
                        "💡 Các Ngọc Rồng đã bay đi khắp hành tinh sau khi thực hiện điều ước!\n\n" +
                        "Chỉ số hiện tại:\n" +
                        `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${player.stats.power.toLocaleString()}\n` +
                        `✨ Ki: ${player.stats.ki}\n` +
                        `❤️ HP: ${player.stats.health}\n` +
                        `💰 Zeni: ${player.stats.zeni.toLocaleString()}\n` +
                        `📊 EXP: ${player.stats.exp.toLocaleString()}/${MAX_EXP_STORAGE.toLocaleString()}`,
                        threadID, messageID
                    );
                }
                case "give": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    const mention = Object.keys(event.mentions)[0];
                    if (!mention) {
                        return api.sendMessage(
                            "❌ Vui lòng tag người nhận!\n" +
                            "Cách dùng:\n" +
                            "• Tặng Ngọc Rồng: .dball give @tag <số_sao>\n" +
                            "• Chuyển Zeni: .dball give @tag zeni <số_lượng>",
                            threadID, messageID
                        );
                    }

                    const targetPlayer = playerData[mention];
                    if (!targetPlayer) {
                        return api.sendMessage("❌ Người này chưa tạo nhân vật!", threadID, messageID);
                    }


                    const messageContent = event.body.toLowerCase();
                    if (messageContent.includes("zeni")) {

                        const amount = parseInt(messageContent.split(" ").pop());

                        if (isNaN(amount) || amount <= 0) {
                            return api.sendMessage(
                                "❌ Số Zeni không hợp lệ!\n" +
                                "Cách dùng: .dball give @tag zeni <số_lượng>\n" +
                                "Ví dụ: .dball give @name zeni 10000",
                                threadID, messageID
                            );
                        }

                        if (amount > player.stats.zeni) {
                            return api.sendMessage(
                                "❌ Bạn không đủ Zeni để chuyển!\n" +
                                `💰 Số dư: ${player.stats.zeni.toLocaleString()} Zeni\n` +
                                `💰 Cần chuyển: ${amount.toLocaleString()} Zeni`,
                                threadID, messageID
                            );
                        }

                        player.stats.zeni -= amount;
                        targetPlayer.stats.zeni = (targetPlayer.stats.zeni || 0) + amount;

                        savePlayerData(playerData);

                        return api.sendMessage(
                            "💰 CHUYỂN ZENI THÀNH CÔNG! 💰\n" +
                            "───────────────\n" +
                            `👤 Người chuyển: ${player.name}\n` +
                            `👥 Người nhận: ${targetPlayer.name}\n` +
                            `💸 Số Zeni: ${amount.toLocaleString()}\n\n` +
                            `💰 Số dư người chuyển: ${player.stats.zeni.toLocaleString()}\n` +
                            `💰 Số dư người nhận: ${targetPlayer.stats.zeni.toLocaleString()}`,
                            threadID, messageID
                        );
                    }

                    if (!target[1] || isNaN(parseInt(target[1]))) {
                        return api.sendMessage(
                            "❌ Cú pháp không hợp lệ!\n" +
                            "Cách dùng:\n" +
                            "• Tặng Ngọc Rồng: .dball give @tag <số_sao>\n" +
                            "• Chuyển Zeni: .dball give @tag zeni <số_lượng>",
                            threadID, messageID
                        );
                    }
                    const starNumber = parseInt(target[1]);
                    if (starNumber < 1 || starNumber > 7) {
                        return api.sendMessage("❌ Số sao phải từ 1 đến 7!", threadID, messageID);
                    }

                    if (!player.inventory?.dragonBalls?.some(ball => ball.star === starNumber)) {
                        return api.sendMessage(
                            `❌ Bạn không sở hữu Ngọc Rồng ${starNumber} sao để tặng!`,
                            threadID, messageID
                        );
                    }

                    const ball = player.inventory.dragonBalls.find(ball => ball.star === starNumber);

                    const dragonBallData = loadDragonBallData();
                    dragonBallData[ball.planet][starNumber] = mention;
                    saveDragonBallData(dragonBallData);

                    player.inventory.dragonBalls = player.inventory.dragonBalls.filter(b =>
                        !(b.star === starNumber && b.planet === ball.planet)
                    );

                    if (!targetPlayer.inventory) targetPlayer.inventory = { dragonBalls: [] };
                    if (!targetPlayer.inventory.dragonBalls) targetPlayer.inventory.dragonBalls = [];

                    targetPlayer.inventory.dragonBalls.push({
                        planet: ball.planet,
                        star: starNumber
                    });
                    updateQuestProgress(targetPlayer, QUEST_TYPES.COLLECT);
                    savePlayerData(playerData);

                    return api.sendMessage(
                        "🎁 TẶNG NGỌC RỒNG THÀNH CÔNG! 🎁\n" +
                        "───────────────\n" +
                        `${player.name} đã tặng Ngọc Rồng ${starNumber} sao cho ${targetPlayer.name}.\n\n` +
                        "💡 Kiểm tra kho đồ bằng lệnh .dball info",
                        threadID, messageID
                    );
                }
                case "upgrade": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (!target[1]) {
                        const damageCost = UPGRADE_COSTS.damage(player.stats.damage);
                        const kiCost = UPGRADE_COSTS.ki(player.stats.ki);
                        const healthCost = UPGRADE_COSTS.health(player.stats.health);

                        return api.sendMessage(
                            "⚡ 𝗡𝗔̂𝗡𝗚 𝗖𝗔̂́𝗣 𝗖𝗛𝗜̉ 𝗦𝗢̂́ ⚡\n" +
                            "───────────────\n" +
                            `📊 𝗘𝗫𝗣 hiện tại: ${player.stats.exp.toLocaleString()}\n\n` +
                            "Chọn chỉ số để nâng cấp:\n\n" +
                            `1. ⚔️ Sức đánh: ${player.stats.damage} (+10) - Cần ${damageCost.toLocaleString()} EXP\n` +
                            `2. ✨ Ki: ${player.stats.ki} (+10) - Cần ${kiCost.toLocaleString()} EXP\n` +
                            `3. ❤️ HP: ${player.stats.health} (+100) - Cần ${healthCost.toLocaleString()} EXP\n\n` +
                            "Cách dùng: .dball upgrade <1/2/3> [số lượng]",
                            threadID, messageID
                        );
                    }

                    const choice = parseInt(target[1]);
                    const amount = parseInt(target[2]) || 1;

                    if (isNaN(choice) || choice < 1 || choice > 3) {
                        return api.sendMessage("❌ Lựa chọn không hợp lệ! Vui lòng chọn 1 (Sức đánh), 2 (Ki) hoặc 3 (HP).", threadID, messageID);
                    }

                    if (isNaN(amount) || amount < 1) {
                        return api.sendMessage("❌ Số lượng nâng cấp không hợp lệ!", threadID, messageID);
                    }

                    let statToUpgrade, costFunction, increaseAmount, statName;

                    switch (choice) {
                        case 1:
                            statToUpgrade = "damage";
                            costFunction = UPGRADE_COSTS.damage;
                            increaseAmount = 10;
                            statName = "Sức đánh";

                            if (player.stats.damage + (increaseAmount * amount) > STAT_LIMITS.DAMAGE) {
                                return api.sendMessage(
                                    "❌ Không thể nâng cấp!\n" +
                                    "Sức đánh đã đạt giới hạn tối đa (50,000,000)",
                                    threadID, messageID
                                );
                            }
                            break;

                        case 2:
                            statToUpgrade = "ki";
                            costFunction = UPGRADE_COSTS.ki;
                            increaseAmount = 10;
                            statName = "Ki";

                            if (player.stats.ki + (increaseAmount * amount) > STAT_LIMITS.KI) {
                                return api.sendMessage(
                                    "❌ Không thể nâng cấp!\n" +
                                    "Ki đã đạt giới hạn tối đa (50,000,000)",
                                    threadID, messageID
                                );
                            }
                            player.stats.ki += increaseAmount * amount;
                            player.stats.currentKi = player.stats.ki;
                            break;

                        case 3:
                            statToUpgrade = "health";
                            costFunction = UPGRADE_COSTS.health;
                            increaseAmount = 100;
                            statName = "HP";

                            if (player.stats.health + (increaseAmount * amount) > STAT_LIMITS.HP) {
                                return api.sendMessage(
                                    "❌ Không thể nâng cấp!\n" +
                                    "HP đã đạt giới hạn tối đa (50,000,000)",
                                    threadID, messageID
                                );
                            }

                            player.stats.health += increaseAmount * amount;
                            player.stats.maxHealth = player.stats.health;
                            break;

                        default:
                            return api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID, messageID);
                    }

                    let totalCost = 0;
                    const currentValue = player.stats[statToUpgrade];

                    for (let i = 0; i < amount; i++) {
                        totalCost += costFunction(currentValue + (i * increaseAmount));
                    }

                    if (player.stats.exp < totalCost) {
                        return api.sendMessage(
                            `❌ Không đủ 𝗘𝗫𝗣 để nâng cấp!\n` +
                            `📊 𝗘𝗫𝗣 hiện tại: ${player.stats.exp.toLocaleString()}\n` +
                            `📊 𝗘𝗫𝗣 cần: ${totalCost.toLocaleString()}\n` +
                            `📊 Còn thiếu: ${(totalCost - player.stats.exp).toLocaleString()} EXP`,
                            threadID, messageID
                        );
                    }

                    player.stats.exp -= totalCost;
                    player.stats[statToUpgrade] += increaseAmount * amount;

                    savePlayerData(playerData);

                    return api.sendMessage(
                        "🎉 𝗡𝗔̂𝗡𝗚 𝗖𝗔̂́𝗣 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚!\n" +
                        "───────────────\n" +
                        `${statName} +${increaseAmount * amount}\n` +
                        `📊 𝗘𝗫𝗣 -${totalCost.toLocaleString()}\n\n` +
                        "💡 Chỉ số hiện tại:\n" +
                        `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${player.stats.power.toLocaleString()}\n` +
                        `⚔️ Sức đánh: ${player.stats.damage.toLocaleString()}\n` +
                        `✨ Ki: ${(player.stats.currentKi || player.stats.ki).toLocaleString()}/${player.stats.ki.toLocaleString()}\n` +
                        `❤️ HP: ${player.stats.health.toLocaleString()}\n` +
                        `📊 EXP: ${player.stats.exp.toLocaleString()}/${MAX_EXP_STORAGE.toLocaleString()}`,
                        threadID, messageID
                    );
                }
                case "tournament":
                case "tour": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    const tournamentData = loadTournamentData();

                    if (!target[1]) {
                        if (!tournamentData.active) {
                            return api.sendMessage(
                                "🏆 ĐẠI HỘI VÕ THUẬT 🏆\n" +
                                "───────────────\n" +
                                "❌ Không có giải đấu nào đang diễn ra!\n\n" +
                                "💡 Các lệnh giải đấu:\n" +
                                "• .dball tour create <loại> - Tạo giải đấu mới\n" +
                                "• .dball tour join - Đăng ký tham gia giải đấu\n" +
                                "• .dball tour info - Xem thông tin giải đấu\n" +
                                "• .dball tour list - Xem danh sách người tham gia\n" +
                                "• .dball tour bracket - Xem bảng đấu\n" +
                                "• .dball tour start - Bắt đầu giải đấu\n\n" +
                                "💡 Các loại giải đấu:\n" +
                                "• tenkaichi - Đại Hội Võ Thuật Thiên Hạ\n" +
                                "• cell - Cell Games\n" +
                                "• universe - Giải Đấu Sức Mạnh",
                                threadID, messageID
                            );
                        }

                        const tournament = tournamentData.active;
                        const tournamentType = TOURNAMENT_TYPES[tournament.type];
                        const registeredPlayers = Object.keys(tournamentData.registrations || {}).length;

                        let status = "⏳ Đang chờ người đăng ký";
                        if (tournament.status === "ongoing") status = "🥊 Đang diễn ra";
                        else if (tournament.status === "completed") status = "✅ Đã kết thúc";

                        return api.sendMessage(
                            `🏆 ${tournamentType.name.toUpperCase()} 🏆\n` +
                            "───────────────\n" +
                            `📝 Mô tả: ${tournamentType.description}\n` +
                            `👑 Người tổ chức: ${tournament.organizer.name}\n` +
                            `⏰ Trạng thái: ${status}\n` +
                            `👥 Số người tham gia: ${registeredPlayers}/${tournamentType.maxPlayers}\n` +
                            `💰 Lệ phí tham gia: ${tournamentType.entryFee.toLocaleString()} Zeni\n\n` +
                            "🏅 Giải thưởng:\n" +
                            `🥇 Hạng nhất: ${tournamentType.rewards.first.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.first.exp.toLocaleString()} EXP` +
                            (tournamentType.rewards.first.item ? `, ${SHOP_ITEMS[tournamentType.rewards.first.item.toUpperCase()].name}` : "") + "\n" +
                            `🥈 Hạng nhì: ${tournamentType.rewards.second.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.second.exp.toLocaleString()} EXP\n` +
                            `🥉 Bán kết: ${tournamentType.rewards.semifinal.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.semifinal.exp.toLocaleString()} EXP\n\n` +
                            "💡 Dùng .dball tour join để đăng ký tham gia",
                            threadID, messageID
                        );
                    }

                    switch (target[1].toLowerCase()) {
                        case "create": {
                            if (tournamentData.active && tournamentData.active.status !== "completed") {
                                return api.sendMessage(
                                    "❌ Đã có giải đấu đang diễn ra!\n" +
                                    "Vui lòng đợi giải đấu hiện tại kết thúc.",
                                    threadID, messageID
                                );
                            }

                            const tournamentType = target[2]?.toLowerCase();
                            if (!tournamentType || !TOURNAMENT_TYPES[tournamentType.toUpperCase()]) {
                                return api.sendMessage(
                                    "❌ Vui lòng chọn loại giải đấu hợp lệ!\n\n" +
                                    "Các loại giải đấu:\n" +
                                    "• tenkaichi - Đại Hội Võ Thuật Thiên Hạ\n" +
                                    "• cell - Cell Games\n" +
                                    "• universe - Giải Đấu Sức Mạnh\n\n" +
                                    "Cách dùng: .dball tour create <loại>",
                                    threadID, messageID
                                );
                            }

                            const tournamentInfo = TOURNAMENT_TYPES[tournamentType.toUpperCase()];

                            if (player.stats.power < tournamentInfo.minPower) {
                                return api.sendMessage(
                                    `❌ Sức mạnh không đủ để tổ chức ${tournamentInfo.name}!\n` +
                                    `💪 Sức mạnh của bạn: ${player.stats.power.toLocaleString()}\n` +
                                    `💪 Yêu cầu: ${tournamentInfo.minPower.toLocaleString()}`,
                                    threadID, messageID
                                );
                            }

                            const organizationFee = tournamentInfo.entryFee * 2;
                            if (player.stats.zeni < organizationFee) {
                                return api.sendMessage(
                                    `❌ Không đủ Zeni để tổ chức giải đấu!\n` +
                                    `💰 Zeni hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                    `💰 Phí tổ chức: ${organizationFee.toLocaleString()}`,
                                    threadID, messageID
                                );
                            }

                            player.stats.zeni -= organizationFee;

                            tournamentData.active = {
                                type: tournamentType.toUpperCase(),
                                status: "registration",
                                startTime: Date.now(),
                                endTime: null,
                                organizer: {
                                    id: senderID,
                                    name: player.name
                                },
                                matches: [],
                                rounds: {},
                                currentRound: 0,
                                winners: {
                                    first: null,
                                    second: null,
                                    semifinalists: []
                                }
                            };

                            tournamentData.registrations = {};

                            tournamentData.registrations[senderID] = {
                                id: senderID,
                                name: player.name,
                                power: player.stats.power,
                                registrationTime: Date.now()
                            };

                            saveTournamentData(tournamentData);
                            savePlayerData(playerData);

                            return api.sendMessage(
                                `🏆 ĐÃ TẠO GIẢI ĐẤU THÀNH CÔNG! 🏆\n` +
                                `───────────────\n` +
                                `🏟️ Giải đấu: ${tournamentInfo.name}\n` +
                                `👑 Người tổ chức: ${player.name}\n` +
                                `💰 Phí tổ chức đã trừ: ${organizationFee.toLocaleString()} Zeni\n` +
                                `⏰ Trạng thái: Đang mở đăng ký\n\n` +
                                `🏅 Giải thưởng:\n` +
                                `🥇 Hạng nhất: ${tournamentInfo.rewards.first.zeni.toLocaleString()} Zeni, ${tournamentInfo.rewards.first.exp.toLocaleString()} EXP\n` +
                                `🥈 Hạng nhì: ${tournamentInfo.rewards.second.zeni.toLocaleString()} Zeni, ${tournamentInfo.rewards.second.exp.toLocaleString()} EXP\n` +
                                `🥉 Bán kết: ${tournamentInfo.rewards.semifinal.zeni.toLocaleString()} Zeni, ${tournamentInfo.rewards.semifinal.exp.toLocaleString()} EXP\n\n` +
                                `💡 Dùng .dball tour join để đăng ký tham gia`,
                                threadID, messageID
                            );
                        }

                        case "join": {
                            if (!tournamentData.active) {
                                return api.sendMessage(
                                    "❌ Không có giải đấu nào đang diễn ra!",
                                    threadID, messageID
                                );
                            }

                            if (tournamentData.active.status !== "registration") {
                                return api.sendMessage(
                                    "❌ Giải đấu đã đóng đăng ký hoặc đã bắt đầu!",
                                    threadID, messageID
                                );
                            }

                            if (tournamentData.registrations[senderID]) {
                                return api.sendMessage(
                                    "❌ Bạn đã đăng ký tham gia giải đấu này rồi!",
                                    threadID, messageID
                                );
                            }

                            const tournamentType = TOURNAMENT_TYPES[tournamentData.active.type];

                            const participantCount = Object.keys(tournamentData.registrations).length;
                            if (participantCount >= tournamentType.maxPlayers) {
                                return api.sendMessage(
                                    "❌ Giải đấu đã đủ số lượng người tham gia!\n" +
                                    `👥 Tối đa: ${tournamentType.maxPlayers} người`,
                                    threadID, messageID
                                );
                            }

                            if (player.stats.zeni < tournamentType.entryFee) {
                                return api.sendMessage(
                                    `❌ Không đủ Zeni để đăng ký!\n` +
                                    `💰 Zeni hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                    `💰 Lệ phí: ${tournamentType.entryFee.toLocaleString()}`,
                                    threadID, messageID
                                );
                            }

                            if (player.stats.power < tournamentType.minPower) {
                                return api.sendMessage(
                                    `❌ Sức mạnh không đủ để tham gia ${tournamentType.name}!\n` +
                                    `💪 Sức mạnh của bạn: ${player.stats.power.toLocaleString()}\n` +
                                    `💪 Yêu cầu tối thiểu: ${tournamentType.minPower.toLocaleString()}`,
                                    threadID, messageID
                                );
                            }

                            if (player.stats.power > tournamentType.maxPower) {
                                return api.sendMessage(
                                    `❌ Sức mạnh quá cao để tham gia ${tournamentType.name}!\n` +
                                    `💪 Sức mạnh của bạn: ${player.stats.power.toLocaleString()}\n` +
                                    `💪 Giới hạn: ${tournamentType.maxPower.toLocaleString()}`,
                                    threadID, messageID
                                );
                            }

                            player.stats.zeni -= tournamentType.entryFee;

                            tournamentData.registrations[senderID] = {
                                id: senderID,
                                name: player.name,
                                power: player.stats.power,
                                registrationTime: Date.now()
                            };

                            saveTournamentData(tournamentData);
                            savePlayerData(playerData);

                            return api.sendMessage(
                                `🏆 ĐĂNG KÝ THÀNH CÔNG! 🏆\n` +
                                `───────────────\n` +
                                `🏟️ Giải đấu: ${tournamentType.name}\n` +
                                `👤 Đã đăng ký: ${Object.keys(tournamentData.registrations).length}/${tournamentType.maxPlayers} người\n` +
                                `💰 Lệ phí đã trừ: ${tournamentType.entryFee.toLocaleString()} Zeni\n\n` +
                                `💡 Chờ ban tổ chức bắt đầu giải đấu`,
                                threadID, messageID
                            );
                        }

                        case "start": {
                            if (!tournamentData.active) {
                                return api.sendMessage(
                                    "❌ Không có giải đấu nào đang diễn ra!",
                                    threadID, messageID
                                );
                            }

                            if (tournamentData.active.organizer.id !== senderID) {
                                return api.sendMessage(
                                    "❌ Chỉ người tổ chức mới có thể bắt đầu giải đấu!",
                                    threadID, messageID
                                );
                            }

                            if (tournamentData.active.status !== "registration") {
                                return api.sendMessage(
                                    "❌ Giải đấu đã bắt đầu hoặc kết thúc rồi!",
                                    threadID, messageID
                                );
                            }

                            const tournamentType = TOURNAMENT_TYPES[tournamentData.active.type];
                            const participantCount = Object.keys(tournamentData.registrations).length;

                            if (participantCount < tournamentType.minPlayers) {
                                return api.sendMessage(
                                    `❌ Chưa đủ người tham gia để bắt đầu giải đấu!\n` +
                                    `👥 Hiện tại: ${participantCount} người\n` +
                                    `👥 Yêu cầu tối thiểu: ${tournamentType.minPlayers} người`,
                                    threadID, messageID
                                );
                            }

                            tournamentData.active.status = "ongoing";
                            tournamentData.active.startTime = Date.now();

                            const players = Object.values(tournamentData.registrations);
                            for (let i = players.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [players[i], players[j]] = [players[j], players[i]];
                            }

                            let validPlayerCount = 2;
                            while (validPlayerCount * 2 <= players.length) {
                                validPlayerCount *= 2;
                            }

                            const tournamentPlayers = players.slice(0, validPlayerCount);

                            tournamentData.active.currentRound = 1;
                            tournamentData.active.rounds = {};
                            tournamentData.active.rounds[1] = [];

                            for (let i = 0; i < tournamentPlayers.length; i += 2) {
                                const matchId = i / 2 + 1;
                                const match = {
                                    id: matchId,
                                    round: 1,
                                    player1: tournamentPlayers[i],
                                    player2: tournamentPlayers[i + 1],
                                    winner: null,
                                    loser: null,
                                    completed: false,
                                    scheduledTime: Date.now() + matchId * 300000
                                };

                                tournamentData.active.rounds[1].push(match);
                                tournamentData.active.matches.push(match);
                            }

                            saveTournamentData(tournamentData);

                            return api.sendMessage(
                                `🏆 GIẢI ĐẤU ĐÃ BẮT ĐẦU! 🏆\n` +
                                `───────────────\n` +
                                `🏟️ Giải đấu: ${tournamentType.name}\n` +
                                `👥 Số người tham gia: ${tournamentPlayers.length} người\n` +
                                `🥊 Số trận đấu vòng 1: ${tournamentData.active.rounds[1].length}\n\n` +
                                `📋 CÁC CẶP ĐẤU VÒNG 1:\n` +
                                tournamentData.active.rounds[1].map((match, index) =>
                                    `${index + 1}. ${match.player1.name} VS ${match.player2.name}`
                                ).join("\n") + "\n\n" +
                                `💡 Dùng .dball fight tournament để bắt đầu trận đấu của bạn`,
                                threadID, messageID
                            );
                        }

                        case "bracket":
                        case "brackets": {
                            if (!tournamentData.active) {
                                return api.sendMessage(
                                    "❌ Không có giải đấu nào đang diễn ra!",
                                    threadID, messageID
                                );
                            }

                            if (tournamentData.active.status === "registration") {
                                return api.sendMessage(
                                    "❌ Giải đấu chưa bắt đầu nên chưa có bảng đấu!",
                                    threadID, messageID
                                );
                            }

                            const tournamentType = TOURNAMENT_TYPES[tournamentData.active.type];
                            let bracketMsg = `🏆 BẢNG ĐẤU ${tournamentType.name.toUpperCase()} 🏆\n` +
                                `───────────────\n`;

                            const rounds = Object.keys(tournamentData.active.rounds).sort((a, b) => parseInt(a) - parseInt(b));
                            for (const round of rounds) {
                                const matches = tournamentData.active.rounds[round];
                                bracketMsg += `\n🔸 VÒNG ${round}:\n`;

                                matches.forEach((match, index) => {
                                    const player1 = match.player1.name;
                                    const player2 = match.player2.name;
                                    const status = match.completed
                                        ? `✅ ${match.winner.name} thắng`
                                        : "⏳ Chưa đấu";

                                    bracketMsg += `${index + 1}. ${player1} VS ${player2} - ${status}\n`;
                                });
                            }

                            if (tournamentData.active.winners.first) {
                                bracketMsg += "\n🏆 KẾT QUẢ CHUNG CUỘC:\n";
                                bracketMsg += `🥇 Vô địch: ${tournamentData.active.winners.first.name}\n`;
                                bracketMsg += `🥈 Á quân: ${tournamentData.active.winners.second.name}\n`;

                                if (tournamentData.active.winners.semifinalists.length > 0) {
                                    bracketMsg += `🥉 Bán kết: ${tournamentData.active.winners.semifinalists.map(p => p.name).join(", ")}\n`;
                                }
                            }

                            return api.sendMessage(bracketMsg, threadID, messageID);
                        }

                        case "list": {
                            if (!tournamentData.active) {
                                return api.sendMessage(
                                    "❌ Không có giải đấu nào đang diễn ra!",
                                    threadID, messageID
                                );
                            }

                            const tournamentType = TOURNAMENT_TYPES[tournamentData.active.type];
                            const participants = Object.values(tournamentData.registrations);

                            participants.sort((a, b) => b.power - a.power);

                            let listMsg = `👥 DANH SÁCH NGƯỜI THAM GIA 👥\n` +
                                `───────────────\n` +
                                `🏟️ Giải đấu: ${tournamentType.name}\n` +
                                `👥 Số người đăng ký: ${participants.length}/${tournamentType.maxPlayers}\n\n`;

                            participants.forEach((player, index) => {
                                listMsg += `${index + 1}. ${player.name}\n`;
                                listMsg += `💪 Sức mạnh: ${player.power.toLocaleString()}\n`;
                            });

                            return api.sendMessage(listMsg, threadID, messageID);
                        }

                        case "info": {
                            if (!tournamentData.active) {
                                return api.sendMessage(
                                    "❌ Không có giải đấu nào đang diễn ra!",
                                    threadID, messageID
                                );
                            }

                            const tournament = tournamentData.active;
                            const tournamentType = TOURNAMENT_TYPES[tournament.type];
                            const participants = Object.values(tournamentData.registrations);

                            let status = "⏳ Đang chờ người đăng ký";
                            if (tournament.status === "ongoing") status = "🥊 Đang diễn ra";
                            else if (tournament.status === "completed") status = "✅ Đã kết thúc";

                            let playerMatch = null;
                            if (tournament.status === "ongoing") {
                                playerMatch = tournament.matches.find(match =>
                                    !match.completed &&
                                    (match.player1.id === senderID || match.player2.id === senderID)
                                );
                            }

                            let playerMatchMsg = "";
                            if (playerMatch) {
                                const opponent = playerMatch.player1.id === senderID
                                    ? playerMatch.player2.name
                                    : playerMatch.player1.name;

                                playerMatchMsg = `\n🥊 TRẬN ĐẤU CỦA BẠN:\n` +
                                    `Đối thủ: ${opponent}\n` +
                                    `Vòng: ${playerMatch.round}\n` +
                                    `⏰ Thời gian: ${new Date(playerMatch.scheduledTime).toLocaleString()}\n` +
                                    `💡 Gõ .dball fight tournament để bắt đầu`;
                            }

                            return api.sendMessage(
                                `🏆 ${tournamentType.name.toUpperCase()} 🏆\n` +
                                `───────────────\n` +
                                `📝 Mô tả: ${tournamentType.description}\n` +
                                `👑 Người tổ chức: ${tournament.organizer.name}\n` +
                                `⏰ Trạng thái: ${status}\n` +
                                `👥 Số người tham gia: ${participants.length}/${tournamentType.maxPlayers}\n` +
                                `💰 Lệ phí tham gia: ${tournamentType.entryFee.toLocaleString()} Zeni\n\n` +
                                `🏅 Giải thưởng:\n` +
                                `🥇 Hạng nhất: ${tournamentType.rewards.first.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.first.exp.toLocaleString()} EXP\n` +
                                `🥈 Hạng nhì: ${tournamentType.rewards.second.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.second.exp.toLocaleString()} EXP\n` +
                                `🥉 Bán kết: ${tournamentType.rewards.semifinal.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.semifinal.exp.toLocaleString()} EXP` +
                                playerMatchMsg,
                                threadID, messageID
                            );
                        }

                        default: {
                            return api.sendMessage(
                                "❌ Lệnh giải đấu không hợp lệ!\n\n" +
                                "💡 Các lệnh giải đấu:\n" +
                                "• .dball tour create <loại> - Tạo giải đấu mới\n" +
                                "• .dball tour join - Đăng ký tham gia giải đấu\n" +
                                "• .dball tour info - Xem thông tin giải đấu\n" +
                                "• .dball tour list - Xem danh sách người tham gia\n" +
                                "• .dball tour bracket - Xem bảng đấu\n" +
                                "• .dball tour start - Bắt đầu giải đấu\n\n" +
                                "💡 Các loại giải đấu:\n" +
                                "• tenkaichi - Đại Hội Võ Thuật Thiên Hạ\n" +
                                "• cell - Cell Games\n" +
                                "• universe - Giải Đấu Sức Mạnh",
                                threadID, messageID
                            );
                            break;
                        }
                    }
                }

                case "quest": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }
                    addMissingQuests();
                    fixPlayerQuestProgression(player);
                    if (!player.quests) {
                        player.quests = {
                            active: [],
                            completed: [],
                            progress: {}
                        };
                    }


                    console.log(`Player ${player.name} - Planet: ${player.planet}`);
                    console.log(`Completed quests: ${player.quests.completed.join(", ")}`);


                    const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
                    console.log(`Planet quests for ${player.planet}: ${planetQuests ? planetQuests.join(", ") : "undefined"}`);

                    if (!planetQuests) {
                        return api.sendMessage(
                            "❌ Hành tinh của bạn chưa có nhiệm vụ!\n" +
                            "Vui lòng liên hệ admin để được hỗ trợ.",
                            threadID, messageID
                        );
                    }


                    for (const questId in player.quests.progress) {
                        if (!QUESTS[questId]) {
                            console.log(`Removing invalid quest progress: ${questId}`);
                            delete player.quests.progress[questId];
                        }
                    }

                    player.quests.active = player.quests.active.filter(questId => {
                        if (!QUESTS[questId]) {
                            console.log(`Removing invalid active quest: ${questId}`);
                            return false;
                        }
                        return true;
                    });

                    if (player.quests.active.length === 0 && planetQuests.length > player.quests.completed.length) {
                        const nextQuestId = planetQuests[player.quests.completed.length];

                        if (QUESTS[nextQuestId]) {
                            player.quests.active.push(nextQuestId);
                            player.quests.progress[nextQuestId] = 0;
                            console.log(`Added new quest: ${nextQuestId}`);
                        } else {
                            console.error(`Quest ${nextQuestId} not found in QUESTS definition`);
                        }

                        savePlayerData(playerData);
                    }

                    if (target[1] === "hoàn" || target[1] === "hoan" || target[1] === "complete") {
                        if (player.quests.active.length === 0) {
                            return api.sendMessage("❌ Bạn không có nhiệm vụ nào đang làm!", threadID, messageID);
                        }

                        const questId = player.quests.active[0];

                        if (!QUESTS[questId]) {
                            console.error(`Không tìm thấy nhiệm vụ với ID: ${questId}`);


                            player.quests.active = [];


                            if (planetQuests && player.quests.completed.length < planetQuests.length) {
                                const newQuestId = planetQuests[player.quests.completed.length];
                                if (QUESTS[newQuestId]) {
                                    player.quests.active.push(newQuestId);
                                    player.quests.progress[newQuestId] = 0;
                                    savePlayerData(playerData);

                                    return api.sendMessage(
                                        "⚠️ Nhiệm vụ trước đó không tồn tại!\n" +
                                        "Đã tự động gán nhiệm vụ mới. Hãy thử lại lệnh '.dball quest'",
                                        threadID, messageID
                                    );
                                }
                            }

                            return api.sendMessage(
                                "❌ Có lỗi với nhiệm vụ của bạn!\n" +
                                "Không tìm thấy thông tin nhiệm vụ. Vui lòng liên hệ admin.",
                                threadID, messageID
                            );
                        }

                        const quest = QUESTS[questId];


                        if (player.quests.progress[questId] < quest.target) {
                            return api.sendMessage(
                                "❌ Bạn chưa hoàn thành nhiệm vụ này!\n" +
                                `⏳ Tiến độ: ${player.quests.progress[questId]}/${quest.target}\n\n` +
                                "💡 Hãy tiếp tục thực hiện nhiệm vụ!",
                                threadID, messageID
                            );
                        }


                        if (quest.reward.exp) {
                            player.stats.exp += quest.reward.exp;
                            if (player.stats.exp > MAX_EXP_STORAGE) {
                                player.stats.exp = MAX_EXP_STORAGE;
                            }
                        }

                        if (quest.reward.zeni) {
                            player.stats.zeni += quest.reward.zeni;
                        }

                        if (quest.reward.item) {
                            if (!player.inventory) player.inventory = {};
                            if (!player.inventory.items) player.inventory.items = [];

                            if (quest.reward.item) {
                                const existingItem = player.inventory.items.find(i => i.id === quest.reward.item);
                                if (existingItem) {
                                    existingItem.quantity += (quest.reward.quantity || 1);
                                } else {
                                    const itemType = SHOP_ITEMS[quest.reward.item.toUpperCase()]?.type || "quest_item";
                                    player.inventory.items.push({
                                        id: quest.reward.item,
                                        quantity: quest.reward.quantity || 1,
                                        type: itemType
                                    });
                                }
                            }
                        }


                        player.quests.completed.push(questId);
                        player.quests.active = [];


                        if (planetQuests && player.quests.completed.length < planetQuests.length) {
                            const nextQuestId = planetQuests[player.quests.completed.length];
                            if (QUESTS[nextQuestId]) {
                                player.quests.active.push(nextQuestId);
                                player.quests.progress[nextQuestId] = 0;
                            } else {
                                console.error(`Không tìm thấy nhiệm vụ tiếp theo: ${nextQuestId}`);
                            }
                        }


                        if (player.quests.completed.length % 3 === 0) {
                            if (!player.stats.level) player.stats.level = 1;
                            player.stats.level += 1;
                        }

                        savePlayerData(playerData);


                        let rewardMsg = "";
                        if (quest.reward.exp) rewardMsg += `📊 𝗘𝗫𝗣 +${quest.reward.exp}\n`;
                        if (quest.reward.zeni) rewardMsg += `💰 𝗭𝗲𝗻𝗶 +${quest.reward.zeni}\n`;
                        if (quest.reward.item && SHOP_ITEMS[quest.reward.item.toUpperCase()]) {
                            const itemName = SHOP_ITEMS[quest.reward.item.toUpperCase()]?.name || quest.reward.item;
                            rewardMsg += `🎁 ${itemName} x${quest.reward.quantity || 1}\n`;
                        }


                        let nextQuestMsg = "";
                        if (player.quests.active.length > 0) {
                            const nextQuestId = player.quests.active[0];
                            const nextQuest = QUESTS[nextQuestId];
                            if (nextQuest) {
                                nextQuestMsg = "\n🆕 Nhiệm vụ mới đã được mở khóa!\n";
                                nextQuestMsg += `📝 ${nextQuest.name}: ${nextQuest.description}\n`;
                            }
                        } else if (player.quests.completed.length >= (planetQuests?.length || 0)) {
                            nextQuestMsg = "\n🏆 Chúc mừng! Bạn đã hoàn thành tất cả nhiệm vụ!";
                        } else {
                            nextQuestMsg = "\n❌ Không thể tìm thấy nhiệm vụ tiếp theo. Liên hệ admin!";
                        }

                        return api.sendMessage(
                            "🎉 𝗛𝗢𝗔̀𝗡 𝗧𝗛𝗔̀𝗡𝗛 𝗡𝗛𝗜𝗘̣̂𝗠 𝗩𝗨̣!\n" +
                            "───────────────\n" +
                            `✅ ${quest.name}\n\n` +
                            "🎁 Phần thưởng:\n" +
                            rewardMsg +
                            (player.quests.completed.length % 3 === 0 ? `🆙 Lên cấp! Level ${player.stats.level}\n` : "") +
                            nextQuestMsg + "\n" +
                            "💡 Dùng .dball quest để xem thông tin nhiệm vụ",
                            threadID, messageID
                        );
                    }


                    let activeQuests = [];
                    player.quests.active.forEach(questId => {
                        const quest = QUESTS[questId];
                        if (quest) {
                            let progress = player.quests.progress[questId] || 0;
                            activeQuests.push({
                                ...quest,
                                progress: progress
                            });
                        }
                    });

                    let msg = "📋 HỆ THỐNG NHIỆM VỤ 📋\n───────────────\n";
                    msg += `🌍 Hành tinh: ${PLANETS[player.planet].name}\n\n`;

                    if (activeQuests.length > 0) {
                        msg += "🔵 𝗡𝗛𝗜𝗘̣̂𝗠 𝗩𝗨̣ 𝗛𝗜𝗘̣̂𝗡 𝗧𝗔̣𝗜:\n";
                        activeQuests.forEach((quest, index) => {
                            msg += `${index + 1}. ${quest.name}\n`;
                            msg += `📝 ${quest.description}\n`;
                            msg += `⏳ Tiến độ: ${quest.progress}/${quest.target}\n`;
                            msg += `🎁 Phần thưởng: ${quest.reward.description}\n\n`;
                        });
                    } else {

                        if (player.quests.completed.length >= planetQuests.length) {
                            msg += "✅ CHÚC MỪNG! BẠN ĐÃ HOÀN THÀNH TẤT CẢ NHIỆM VỤ!\n\n";
                        } else {

                            const nextQuestIndex = player.quests.completed.length;

                            if (nextQuestIndex < planetQuests.length) {
                                const nextQuestId = planetQuests[nextQuestIndex];

                                if (QUESTS[nextQuestId]) {
                                    msg += "🟢 NHIỆM VỤ TIẾP THEO:\n";
                                    msg += `${QUESTS[nextQuestId].name}\n`;
                                    msg += `📝 ${QUESTS[nextQuestId].description}\n`;
                                    msg += `🎁 Phần thưởng: ${QUESTS[nextQuestId].reward.description}\n\n`;


                                    player.quests.active.push(nextQuestId);
                                    player.quests.progress[nextQuestId] = 0;
                                    savePlayerData(playerData);

                                    msg += "✨ Nhiệm vụ mới đã được thêm!\n\n";
                                } else {
                                    msg += `❓ KHÔNG TÌM THẤY NHIỆM VỤ TIẾP THEO (${nextQuestId})!\n`;
                                    msg += "Vui lòng liên hệ admin để được hỗ trợ.\n\n";
                                }
                            } else {
                                msg += "✅ BẠN ĐÃ HOÀN THÀNH TẤT CẢ NHIỆM VỤ!\n\n";
                            }
                        }
                    }

                    const totalQuests = planetQuests ? planetQuests.length : 0;
                    const completedCount = player.quests.completed.length;

                    msg += `📊 Tiến độ: ${completedCount}/${totalQuests} nhiệm vụ\n\n`;
                    msg += "💡 Cách dùng: Nhiệm vụ tự động hoàn thành khi đạt tiến độ";

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "learn": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (!player.planet || !PLANETS[player.planet]) {
                        return api.sendMessage("❌ Hành tinh của bạn không hợp lệ hoặc không tồn tại!", threadID, messageID);
                    }

                    const planetMasters = PLANETS[player.planet].masters;
                    if (!planetMasters || planetMasters.length === 0) {
                        return api.sendMessage(
                            "❌ Chỉ có thể học kỹ năng khi đã chọn sư phụ!\n" +
                            "💡 Mỗi hành tinh có sư phụ riêng:\n" +
                            "• Trái Đất - Master Roshi\n" +
                            "• Namek - Piccolo\n" +
                            "• Saiyan - Goku",
                            threadID, messageID
                        );
                    }

                    if (!target[1]) {

                        let allSkills = [];
                        let skillIndex = 0;

                        const masterId = planetMasters[0];
                        const master = MASTERS[masterId];

                        Object.entries(master.skills).forEach(([skillId, skill]) => {
                            skillIndex++;
                            const isLearned = player.skills.includes(`${masterId}:${skillId}`);
                            const canLearn = player.stats.power >= skill.powerRequired;

                            allSkills.push({
                                index: skillIndex,
                                name: skill.name,
                                description: skill.description,
                                powerRequired: skill.powerRequired,
                                powerScale: skill.powerScale,
                                kiCost: skill.kiCost,
                                isLearned: isLearned,
                                canLearn: canLearn
                            });
                        });


                        const learnImageData = {
                            playerID: senderID,
                            playerName: player.name,
                            playerPower: player.stats.power,
                            playerDamage: player.stats.damage,
                            playerKi: player.stats.ki,
                            master: master.name,
                            masterDescription: master.description,
                            raceName: PLANETS[player.planet].name,
                            planetTheme: PLANET_THEME_COLORS[player.planet] || PLANET_THEME_COLORS.EARTH,
                            skills: allSkills
                        };


                        const learnImagePath = await createLearnImage(learnImageData);

                        if (learnImagePath) {
                            return api.sendMessage(
                                {
                                    body: `👨‍🏫 ${master.name} - KỸ NĂNG CÓ THỂ HỌC 👨‍🏫\nChọn số kỹ năng để học: .dball learn <số>`,
                                    attachment: fs.createReadStream(learnImagePath)
                                },
                                threadID,
                                () => fs.unlinkSync(learnImagePath),
                                messageID
                            );
                        } else {

                            let msg = "👨‍🏫 CÁC SƯ PHỤ CÓ THỂ HỌC:\n───────────────\n\n";
                            let skillIndex = 1;

                            planetMasters.forEach(masterId => {
                                const master = MASTERS[masterId];
                                msg += `${master.name} (${master.race})\n`;
                                msg += `📝 ${master.description}\n\n`;
                                msg += "Các kỹ năng:\n";

                                Object.entries(master.skills).forEach(([skillId, skill]) => {
                                    const isLearned = player.skills.includes(`${masterId}:${skillId}`);
                                    const canLearn = player.stats.power >= skill.powerRequired;

                                    const status = isLearned ? "✅ Đã học" : canLearn ? "✳️ Có thể học" : "❌ Chưa đủ sức mạnh";

                                    const damage = skill.powerScale > 0 ?
                                        Math.floor(player.stats.damage * skill.powerScale) : 0;

                                    const kiCost = skill.kiCost != 0 ?
                                        Math.abs(Math.floor(player.stats.ki * skill.kiCost)) : 0;

                                    let skillInfo = "";
                                    if (skill.powerScale > 0) {
                                        skillInfo = `⚔️ ${damage.toLocaleString()} DMG, ${skill.kiCost > 0 ? "✨ -" + kiCost + " Ki" : ""}`;
                                    } else if (skill.kiCost < 0) {
                                        skillInfo = `${skill.description}, ✨ +${kiCost} Ki`;
                                    } else {
                                        skillInfo = `${skill.description}, ✨ -${kiCost} Ki`;
                                    }

                                    msg += `${skillIndex}. ${skill.name} - ${skillInfo}\n`;
                                    msg += `💪 Yêu cầu: ${skill.powerRequired.toLocaleString()} sức mạnh - ${status}\n\n`;

                                    skillIndex++;
                                });
                            });

                            msg += "💡 Cách học: .dball learn <số thứ tự kỹ năng>";
                            return api.sendMessage(msg, threadID, messageID);
                        }
                    }
                    const skillIndex = parseInt(target[1]) - 1;
                    const availableMasters = PLANETS[player.planet].masters;
                    let allSkills = [];

                    availableMasters.forEach(masterId => {
                        Object.entries(MASTERS[masterId].skills).forEach(([skillId, skill]) => {
                            allSkills.push({ masterId, skillId, ...skill });
                        });
                    });

                    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex >= allSkills.length) {
                        return api.sendMessage(
                            "❌ Số thứ tự kỹ năng không hợp lệ!\n" +
                            "Vui lòng chọn từ 1 đến " + allSkills.length,
                            threadID, messageID
                        );
                    }

                    const chosenSkill = allSkills[skillIndex];
                    const skillId = `${chosenSkill.masterId}:${chosenSkill.skillId}`;

                    if (player.skills.includes(skillId)) {
                        return api.sendMessage("❌ Bạn đã học kỹ năng này rồi!", threadID, messageID);
                    }

                    if (player.stats.power < chosenSkill.powerRequired) {
                        return api.sendMessage(
                            "❌ 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 không đủ để học kỹ năng này!\n" +
                            `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 hiện tại: ${player.stats.power.toLocaleString()}\n` +
                            `⚡ Yêu cầu: ${chosenSkill.powerRequired.toLocaleString()}\n\n` +
                            "💡 Hãy tiếp tục luyện tập để tăng sức mạnh!",
                            threadID, messageID
                        );
                    }

                    player.skills.push(skillId);
                    savePlayerData(playerData);

                    const estimatedDamage = chosenSkill.powerScale > 0 ?
                        Math.floor(player.stats.damage * chosenSkill.powerScale) : 0;
                    const kiText = chosenSkill.kiCost < 0 ?
                        `Hồi ${Math.abs(Math.floor(player.stats.ki * chosenSkill.kiCost))} Ki` :
                        `Tốn ${Math.floor(player.stats.ki * chosenSkill.kiCost)} Ki`;

                    return api.sendMessage(
                        "🎉 𝗛𝗢̣𝗖 𝗞𝗬̃ 𝗡𝗔̆𝗡𝗚 𝗧𝗛𝗔̀𝗡𝗛 𝗖𝗢̂𝗡𝗚!\n" +
                        "───────────────\n" +
                        `Đã học ${chosenSkill.name} từ ${MASTERS[chosenSkill.masterId].name}\n` +
                        (estimatedDamage > 0 ? `💥 Sát thương: ${estimatedDamage}\n` : "") +
                        `✨ Ki: ${kiText}\n` +
                        `📝 Mô tả: ${chosenSkill.description}`,
                        threadID, messageID
                    );
                }
                case "inventory":
                case "inv": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    let inventoryMsg = "📦 KHO ĐỒ 📦\n───────────────\n";

                    const equippedItems = player.inventory?.items?.filter(item => item.equipped) || [];
                    if (equippedItems.length > 0) {
                        inventoryMsg += "🎽 ĐANG TRANG BỊ:\n";
                        equippedItems.forEach(item => {
                            const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                            if (itemData) {
                                inventoryMsg += `${itemData.emoji} ${itemData.name} - ${itemData.description}\n`;
                            }
                        });
                        inventoryMsg += "\n";
                    }

                    const consumables = player.inventory?.items?.filter(item => !item.equipped &&
                        Object.values(SHOP_ITEMS).find(shop => shop.id === item.id)?.type === "consumable") || [];

                    if (consumables.length > 0) {
                        inventoryMsg += "🧪 VẬT PHẨM TIÊU HAO:\n";
                        consumables.forEach(item => {
                            const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                            if (itemData) {
                                inventoryMsg += `${itemData.emoji} ${itemData.name} (x${item.quantity}) - .dball use ${item.id}\n`;
                            }
                        });
                        inventoryMsg += "\n";
                    }

                    const unusedEquipment = player.inventory?.items?.filter(item => !item.equipped &&
                        Object.values(SHOP_ITEMS).find(shop => shop.id === item.id)?.type === "equipment") || [];

                    if (unusedEquipment.length > 0) {
                        inventoryMsg += "🎮 TRANG BỊ CHƯA DÙNG:\n";
                        unusedEquipment.forEach(item => {
                            const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                            if (itemData) {
                                inventoryMsg += `${itemData.emoji} ${itemData.name} (x${item.quantity}) - .dball use ${item.id}\n`;
                            }
                        });
                        inventoryMsg += "\n";
                    }

                    const specialItems = player.inventory?.items?.filter(item =>
                        Object.values(SHOP_ITEMS).find(shop => shop.id === item.id)?.type === "special") || [];

                    if (specialItems.length > 0) {
                        inventoryMsg += "✨ VẬT PHẨM ĐẶC BIỆT:\n";
                        specialItems.forEach(item => {
                            const itemData = Object.values(SHOP_ITEMS).find(shop => shop.id === item.id);
                            if (itemData) {
                                inventoryMsg += `${itemData.emoji} ${itemData.name} (x${item.quantity}) - .dball use ${item.id}\n`;
                            }
                        });
                        inventoryMsg += "\n";
                    }

                    if (player.inventory?.dragonBalls?.length > 0) {
                        inventoryMsg += "🔮 NGỌC RỒNG:\n";
                        const dragonBallsByPlanet = {};

                        player.inventory.dragonBalls.forEach(ball => {
                            if (!dragonBallsByPlanet[ball.planet]) {
                                dragonBallsByPlanet[ball.planet] = [];
                            }
                            dragonBallsByPlanet[ball.planet].push(ball.star);
                        });

                        Object.entries(dragonBallsByPlanet).forEach(([planet, stars]) => {
                            stars.sort((a, b) => a - b);
                            inventoryMsg += `${PLANETS[planet].name}: ${stars.map(s => `${s}⭐`).join(", ")}\n`;

                            if (stars.length === 7) {
                                inventoryMsg += `\n🐉 Bạn đã thu thập đủ 7 viên Ngọc Rồng ${PLANETS[planet].name}!\n`;
                                inventoryMsg += "💡 Dùng .𝗱𝗯𝗮𝗹𝗹 𝘄𝗶𝘀𝗵 để thực hiện điều ước\n\n";
                            }
                        });
                    }

                    if (!player.inventory ||
                        (!player.inventory.items?.length && !player.inventory.dragonBalls?.length)) {
                        inventoryMsg += "❌ Kho đồ trống!\n\n";
                        inventoryMsg += "💡 Hãy mua vật phẩm từ shop hoặc tìm Ngọc Rồng!";
                    }

                    inventoryMsg += "\n💡 Dùng .dball shop để mua thêm vật phẩm";

                    return api.sendMessage(inventoryMsg, threadID, messageID);
                }
                case "pk":
                case "fight": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }
                    const hpPercent = (player.stats.currentHealth / player.stats.health) * 100;
                    const kiPercent = (player.stats.currentKi / player.stats.ki) * 100;

                    if (player.stats.currentHealth <= 50 && player.stats.currentKi < player.stats.ki * 0.1) {
                        return api.sendMessage(
                            "❌ Bạn đang trong trạng thái kiệt sức sau khi sử dụng kỹ năng tự hủy!\n" +
                            "💡 Hãy dùng đậu thần (.dball use senzu) để hồi phục trước khi chiến đấu.",
                            threadID, messageID
                        );
                    }
                    if (target[1]?.toLowerCase() === "tournament" || target[1]?.toLowerCase() === "tour") {
                        const tournamentData = loadTournamentData();

                        if (!tournamentData.active || tournamentData.active.status !== "ongoing") {
                            return api.sendMessage(
                                "❌ Không có giải đấu nào đang diễn ra hoặc chưa bắt đầu!",
                                threadID, messageID
                            );
                            return;
                        }

                        if (!tournamentData.registrations[senderID]) {
                            return api.sendMessage(
                                "❌ Bạn không tham gia giải đấu này!",
                                threadID, messageID
                            );

                        }

                        const currentMatch = tournamentData.active.matches.find(match =>
                            !match.completed &&
                            (match.player1.id === senderID || match.player2.id === senderID)
                        );

                        if (!currentMatch) {
                            return api.sendMessage(
                                "❌ Bạn không có trận đấu nào đang diễn ra!",
                                threadID, messageID
                            );
                        }

                        const opponent = currentMatch.player1.id === senderID
                            ? currentMatch.player2
                            : currentMatch.player1;

                        const opponentData = playerData[opponent.id];
                        if (!opponentData) {
                            return api.sendMessage(
                                "❌ Không tìm thấy thông tin đối thủ!",
                                threadID, messageID
                            );
                        }

                        if (Date.now() < currentMatch.scheduledTime) {
                            const timeLeft = Math.ceil((currentMatch.scheduledTime - Date.now()) / 60000);
                            return api.sendMessage(
                                `⏳ Chưa đến lượt đấu của bạn!\n` +
                                `Vui lòng đợi thêm ${timeLeft} phút nữa.`,
                                threadID, messageID
                            );
                        }

                        api.sendMessage(
                            `🏆 TRẬN ĐẤU BẮT ĐẦU! 🏆\n` +
                            `───────────────\n` +
                            `👥 ${player.name} VS ${opponentData.name}\n` +
                            `🏟️ ${TOURNAMENT_TYPES[tournamentData.active.type].name} - Vòng ${currentMatch.round}\n\n` +
                            `💡 Trận đấu đang diễn ra...`,
                            threadID, messageID
                        );

                        let playerHP = player.stats.health;
                        let playerDamage = player.stats.damage;
                        let playerKi = player.stats.ki;
                        let oppHP = opponentData.stats.health;
                        let oppDamage = opponentData.stats.damage;
                        let oppKi = opponentData.stats.ki;
                        let battleLog = [];

                        const originalPlayerKi = player.stats.ki;
                        const originalOpponentKi = opponentData.stats.ki;

                        let playerPowerBoosted = 0;
                        let playerPowerBoostMultiplier = 1.0;
                        let playerStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        let oppPowerBoosted = 0;
                        let oppPowerBoostMultiplier = 1.0;
                        let oppStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        if (player.inventory?.items) {
                            player.inventory.items.filter(item => item.equipped).forEach(item => {
                                if (item.id === "tournament_belt") playerDamage *= 1.3;
                                if (item.id === "cell_medal") {
                                    playerHP *= 1.3;
                                    playerKi *= 1.3;
                                }
                                if (item.id === "universe_medal") {
                                    playerHP *= 1.5;
                                    playerKi *= 1.5;
                                    playerDamage *= 1.5;
                                }
                            });
                        }

                        if (opponentData.inventory?.items) {
                            opponentData.inventory.items.filter(item => item.equipped).forEach(item => {
                                if (item.id === "tournament_belt") oppDamage *= 1.3;
                                if (item.id === "cell_medal") {
                                    oppHP *= 1.3;
                                    oppKi *= 1.3;
                                }
                                if (item.id === "universe_medal") {
                                    oppHP *= 1.5;
                                    oppKi *= 1.5;
                                    oppDamage *= 1.5;
                                }
                            });
                        }

                        battleLog.push(`⚔️ ${player.name} đấu với ${opponentData.name}!`);

                        let turn = 0;
                        const MAX_TURNS = 30;

                        while (playerHP > 0 && oppHP > 0 && turn < MAX_TURNS) {
                            turn++;

                            if (!playerStates.stunned && !playerStates.bound) {
                                if (player.skills.length > 0 && Math.random() < 0.75) {

                                    const skillChoice = player.skills[Math.floor(Math.random() * player.skills.length)];
                                    const [master, skillName] = skillChoice.split(":");
                                    const skillData = MASTERS[master].skills[skillName];

                                    const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                                    const kiRequired = Math.floor(playerKi * Math.abs(skillData.kiCost));

                                    if (playerKi >= kiRequired || skillData.kiCost < 0) {

                                        if (skillData.powerScale > 0) {
                                            const actualDamage = playerStates.powerBoosted > 0
                                                ? Math.floor(skillDamage * playerStates.powerBoostMultiplier)
                                                : skillDamage;

                                            if (oppStates.shielded > 0) {
                                                battleLog.push(`🛡️ Khiên năng lượng của ${opponentData.name} đã chặn đòn tấn công!`);
                                                oppStates.shielded--;
                                            } else {
                                                oppHP -= actualDamage;
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;

                                                battleLog.push(
                                                    `🎯 ${player.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                                    (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                                );
                                            }
                                        } else {
                                            switch (skillName) {
                                                case "SOLAR_FLARE":
                                                case "HYPNOSIS":
                                                    if (typeof monsterStates !== 'undefined') {
                                                        monsterStates.stunned = 2;
                                                    } else if (typeof enemyStates !== 'undefined') {
                                                        enemyStates.stunned = 2;
                                                    } else if (typeof oppStates !== 'undefined') {
                                                        oppStates.stunned = 2;
                                                    }
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🌀 ${player.name} dùng Thôi Miên! ${monster.name} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "KAIOKEN":
                                                    playerStates.powerBoosted = 3;
                                                    playerStates.powerBoostMultiplier = 3.0;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🔥 ${player.name} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                                    break;

                                                case "BIND":
                                                    oppStates.bound = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🔗 ${player.name} dùng Trói! ${opponentData.name} bị trói 2 lượt!`);
                                                    break;

                                                case "ENERGY_SHIELD": {
                                                    const damage = Math.floor(playerDamage * 1.5);
                                                    const shieldDuration = 2;

                                                    playerStates.shielded = shieldDuration;
                                                    playerStates.shieldStrength = damage;

                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;

                                                    battleLog.push(`🛡️ ${player.name} tạo Khiên Năng Lượng!`);
                                                    battleLog.push(`🛡️ Khiên có thể chịu được ${damage.toLocaleString()} sát thương trong ${shieldDuration} lượt!`);
                                                    break;
                                                }


                                                    if (playerStates.shielded > 0) {
                                                        if (incomingDamage > playerStates.shieldStrength) {

                                                            battleLog.push(`💥 Khiên Năng Lượng của ${player.name} bị vỡ!`);
                                                            playerStates.shielded = 0;

                                                            playerHP -= (incomingDamage - playerStates.shieldStrength);
                                                        } else {
                                                            battleLog.push(`🛡️ Khiên Năng Lượng của ${player.name} chặn ${incomingDamage.toLocaleString()} sát thương!`);
                                                            playerStates.shieldStrength -= incomingDamage;
                                                        }
                                                        playerStates.shielded--;
                                                    }


                                                case "GREAT_APE": {
                                                    // Kiểm tra đủ điều kiện
                                                    if (playerKi < player.stats.ki * 0.8) {
                                                        battleLog.push(`❌ ${player.name} không đủ Ki để biến thành Khỉ Đột Khổng Lồ!`);

                                                        // Đánh thường thay thế
                                                        const normalDamage = Math.floor(playerDamage * 0.8);

                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }

                                                    // Kích hoạt biến khỉ khổng lồ
                                                    playerStates.greatApe = 3; // Hiệu lực 3 lượt
                                                    playerStates.powerBoostMultiplier = 10.0; // Tăng x10 sức mạnh
                                                    playerStates.powerBoosted = 3;
                                                    playerKi -= Math.floor(playerKi * 0.8); // Tiêu tốn 80% Ki

                                                    battleLog.push(`🦍 ${player.name} biến thành KHỈ ĐỘT KHỔNG LỒ!`);
                                                    battleLog.push(`💪 Sức mạnh tăng x10 trong 3 lượt!`);

                                                    // Gây sát thương ban đầu
                                                    const initialDamage = Math.floor(playerDamage * 5);

                                                    if (typeof monsterHP !== 'undefined') {
                                                        monsterHP -= initialDamage;
                                                    } else if (typeof enemyHP !== 'undefined') {
                                                        enemyHP -= initialDamage;
                                                    } else if (typeof oppHP !== 'undefined') {
                                                        oppHP -= initialDamage;
                                                    }

                                                    battleLog.push(`💥 Cú đấm khổng lồ gây ${initialDamage.toLocaleString()} sát thương!`);
                                                    break;
                                                }
                                                case "SPIRIT_BOMB": {
                                                    if (!player.spiritBombCharge) player.spiritBombCharge = 0;

                                                    player.spiritBombCharge += 1;

                                                    playerKi -= kiRequired;

                                                    if (player.spiritBombCharge < 25) {

                                                        battleLog.push(`✨ ${player.name} đang giơ tay thu thập năng lượng cho Quả Cầu Kinh Khí (${player.spiritBombCharge}/25)...`);
                                                        battleLog.push(`🔄 Cần tích tụ thêm năng lượng!`);

                                                        playerStates.vulnerable = 2;
                                                    } else {
                                                        const spiritBombDamage = Math.floor(playerDamage * 8);

                                                        if (typeof oppHP !== 'undefined') {
                                                            oppHP -= spiritBombDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= spiritBombDamage;
                                                        } else if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= spiritBombDamage;
                                                        }

                                                        battleLog.push(`💫 ${player.name} đã hoàn thành Quả Cầu Kinh Khí khổng lồ!`);
                                                        battleLog.push(`💥 Quả Cầu Kinh Khí tấn công đối thủ gây ${spiritBombDamage.toLocaleString()} sát thương!`);

                                                        player.spiritBombCharge = 0;


                                                        playerKi = 0;
                                                    }
                                                    break;
                                                }
                                                case "REGENERATION":
                                                case "WHISTLE":
                                                case "REGENERATE_ENERGY": {

                                                    if (!player.regenSkillsUsed) {
                                                        player.regenSkillsUsed = {};
                                                    }

                                                    const battleId = Date.now().toString().slice(0, 10);


                                                    if (player.regenSkillsUsed[battleId]) {
                                                        battleLog.push(`❌ ${player.name} đã sử dụng kỹ năng hồi phục trong trận này!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }


                                                    const maxHP = player.stats.health;
                                                    const maxKi = player.stats.ki;
                                                    const currentHPPercent = (playerHP / maxHP) * 100;
                                                    const currentKiPercent = (playerKi / maxKi) * 100;


                                                    if (currentHPPercent > 40 && currentKiPercent > 40) {
                                                        battleLog.push(`❌ ${player.name} không thể dùng kỹ năng hồi phục khi HP và Ki còn cao!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                    } else {

                                                        const hpRecover = Math.floor(maxHP * 0.3);
                                                        const kiRecover = Math.floor(maxKi * 0.3);

                                                        playerHP = Math.min(maxHP, playerHP + hpRecover);
                                                        playerKi = Math.min(maxKi, playerKi + kiRecover);

                                                        battleLog.push(`💚 ${player.name} dùng kỹ năng hồi phục!`);
                                                        battleLog.push(`❤️ Hồi phục ${hpRecover.toLocaleString()} HP`);
                                                        battleLog.push(`✨ Hồi phục ${kiRecover.toLocaleString()} Ki`);


                                                        player.regenSkillsUsed[battleId] = true;
                                                    }
                                                    break;
                                                }

                                                default:
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                                    break;
                                            }
                                        }
                                    } else {
                                        const normalDamage = Math.floor(playerDamage * 0.8);

                                        if (oppStates.shielded > 0) {
                                            battleLog.push(`🛡️ Khiên năng lượng của ${opponentData.name} đã chặn đòn tấn công thường!`);
                                            oppStates.shielded--;
                                        } else {
                                            oppHP -= normalDamage;
                                            battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                        }
                                    }
                                } else {
                                    const normalDamage = playerStates.powerBoosted > 0 ?
                                        Math.floor(playerDamage * playerStates.powerBoostMultiplier * 0.8) :
                                        Math.floor(playerDamage * 0.8);

                                    if (oppStates.shielded > 0) {
                                        battleLog.push(`🛡️ Khiên năng lượng của ${opponentData.name} đã chặn đòn tấn công thường!`);
                                        oppStates.shielded--;
                                    } else {
                                        oppHP -= normalDamage;
                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    }
                                }
                            } else if (playerStates.stunned > 0) {
                                battleLog.push(`😵 ${player.name} đang bị choáng! Không thể hành động!`);
                                playerStates.stunned--;
                            } else if (playerStates.bound > 0) {
                                battleLog.push(`🔗 ${player.name} đang bị trói! Không thể hành động!`);
                                playerStates.bound--;
                            }

                            if (oppHP <= 0) break;

                            if (!oppStates.stunned && !oppStates.bound) {
                                if (opponentData.skills.length > 0 && Math.random() < 0.75) {

                                    const skillChoice = opponentData.skills[Math.floor(Math.random() * opponentData.skills.length)];
                                    const [master, skillName] = skillChoice.split(":");
                                    const skillData = MASTERS[master].skills[skillName];

                                    const skillDamage = Math.floor(oppDamage * skillData.powerScale);
                                    const kiRequired = Math.floor(oppKi * Math.abs(skillData.kiCost));

                                    if (oppKi >= kiRequired || skillData.kiCost < 0) {

                                        if (skillData.powerScale > 0) {
                                            const actualDamage = oppStates.powerBoosted > 0
                                                ? Math.floor(skillDamage * oppStates.powerBoostMultiplier)
                                                : skillDamage;

                                            if (playerStates.shielded > 0) {
                                                battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn đòn tấn công!`);
                                                playerStates.shielded--;
                                            } else {
                                                playerHP -= actualDamage;
                                                if (skillData.kiCost > 0) oppKi -= kiRequired;

                                                battleLog.push(
                                                    `🎯 ${opponentData.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                                    (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                                );
                                            }

                                        } else {
                                            switch (skillName) {
                                                case "SOLAR_FLARE":
                                                case "HYPNOSIS":
                                                    monsterStates.stunned = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🌀 ${player.name} dùng Thôi Miên! ${monster.name} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "KAIOKEN":
                                                    oppStates.powerBoosted = 3;
                                                    oppStates.powerBoostMultiplier = 3.0;
                                                    if (skillData.kiCost > 0) oppKi -= kiRequired;
                                                    battleLog.push(`🔥 ${opponentData.name} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                                    break;

                                                case "BIND":
                                                    playerStates.bound = 2;
                                                    if (skillData.kiCost > 0) oppKi -= kiRequired;
                                                    battleLog.push(`🔗 ${opponentData.name} dùng Trói! ${player.name} bị trói 2 lượt!`);
                                                    break;

                                                case "ENERGY_SHIELD": {
                                                    const damage = Math.floor(playerDamage * 1.5);
                                                    const shieldDuration = 2;

                                                    playerStates.shielded = shieldDuration;
                                                    playerStates.shieldStrength = damage;

                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;

                                                    battleLog.push(`🛡️ ${player.name} tạo Khiên Năng Lượng!`);
                                                    battleLog.push(`🛡️ Khiên có thể chịu được ${damage.toLocaleString()} sát thương trong ${shieldDuration} lượt!`);
                                                    break;
                                                }


                                                    if (playerStates.shielded > 0) {
                                                        if (incomingDamage > playerStates.shieldStrength) {

                                                            battleLog.push(`💥 Khiên Năng Lượng của ${player.name} bị vỡ!`);
                                                            playerStates.shielded = 0;

                                                            playerHP -= (incomingDamage - playerStates.shieldStrength);
                                                        } else {
                                                            battleLog.push(`🛡️ Khiên Năng Lượng của ${player.name} chặn ${incomingDamage.toLocaleString()} sát thương!`);
                                                            playerStates.shieldStrength -= incomingDamage;
                                                        }
                                                        playerStates.shielded--;
                                                    }
                                                case "GREAT_APE": {
                                                    // Kiểm tra đủ điều kiện
                                                    if (playerKi < player.stats.ki * 0.8) {
                                                        battleLog.push(`❌ ${player.name} không đủ Ki để biến thành Khỉ Đột Khổng Lồ!`);

                                                        // Đánh thường thay thế
                                                        const normalDamage = Math.floor(playerDamage * 0.8);

                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }

                                                    // Kích hoạt biến khỉ khổng lồ
                                                    playerStates.greatApe = 3; // Hiệu lực 3 lượt
                                                    playerStates.powerBoostMultiplier = 10.0; // Tăng x10 sức mạnh
                                                    playerStates.powerBoosted = 3;
                                                    playerKi -= Math.floor(playerKi * 0.8); // Tiêu tốn 80% Ki

                                                    battleLog.push(`🦍 ${player.name} biến thành KHỈ ĐỘT KHỔNG LỒ!`);
                                                    battleLog.push(`💪 Sức mạnh tăng x10 trong 3 lượt!`);

                                                    // Gây sát thương ban đầu
                                                    const initialDamage = Math.floor(playerDamage * 5);

                                                    if (typeof monsterHP !== 'undefined') {
                                                        monsterHP -= initialDamage;
                                                    } else if (typeof enemyHP !== 'undefined') {
                                                        enemyHP -= initialDamage;
                                                    } else if (typeof oppHP !== 'undefined') {
                                                        oppHP -= initialDamage;
                                                    }

                                                    battleLog.push(`💥 Cú đấm khổng lồ gây ${initialDamage.toLocaleString()} sát thương!`);
                                                    break;
                                                }
                                                case "SPIRIT_BOMB": {
                                                    if (!player.spiritBombCharge) player.spiritBombCharge = 0;

                                                    player.spiritBombCharge += 1;

                                                    playerKi -= kiRequired;

                                                    if (player.spiritBombCharge < 25) {

                                                        battleLog.push(`✨ ${player.name} đang giơ tay thu thập năng lượng cho Quả Cầu Kinh Khí (${player.spiritBombCharge}/25)...`);
                                                        battleLog.push(`🔄 Cần tích tụ thêm năng lượng!`);

                                                        playerStates.vulnerable = 2;
                                                    } else {
                                                        const spiritBombDamage = Math.floor(playerDamage * 8);

                                                        if (typeof oppHP !== 'undefined') {
                                                            oppHP -= spiritBombDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= spiritBombDamage;
                                                        } else if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= spiritBombDamage;
                                                        }

                                                        battleLog.push(`💫 ${player.name} đã hoàn thành Quả Cầu Kinh Khí khổng lồ!`);
                                                        battleLog.push(`💥 Quả Cầu Kinh Khí tấn công đối thủ gây ${spiritBombDamage.toLocaleString()} sát thương!`);

                                                        player.spiritBombCharge = 0;


                                                        playerKi = 0;
                                                    }
                                                    break;
                                                }
                                                case "REGENERATION":
                                                case "WHISTLE":
                                                case "REGENERATE_ENERGY": {

                                                    if (!player.regenSkillsUsed) {
                                                        player.regenSkillsUsed = {};
                                                    }

                                                    const battleId = Date.now().toString().slice(0, 10);


                                                    if (player.regenSkillsUsed[battleId]) {
                                                        battleLog.push(`❌ ${player.name} đã sử dụng kỹ năng hồi phục trong trận này!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }


                                                    const maxHP = player.stats.health;
                                                    const maxKi = player.stats.ki;
                                                    const currentHPPercent = (playerHP / maxHP) * 100;
                                                    const currentKiPercent = (playerKi / maxKi) * 100;


                                                    if (currentHPPercent > 40 && currentKiPercent > 40) {
                                                        battleLog.push(`❌ ${player.name} không thể dùng kỹ năng hồi phục khi HP và Ki còn cao!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                    } else {

                                                        const hpRecover = Math.floor(maxHP * 0.3);
                                                        const kiRecover = Math.floor(maxKi * 0.3);

                                                        playerHP = Math.min(maxHP, playerHP + hpRecover);
                                                        playerKi = Math.min(maxKi, playerKi + kiRecover);

                                                        battleLog.push(`💚 ${player.name} dùng kỹ năng hồi phục!`);
                                                        battleLog.push(`❤️ Hồi phục ${hpRecover.toLocaleString()} HP`);
                                                        battleLog.push(`✨ Hồi phục ${kiRecover.toLocaleString()} Ki`);


                                                        player.regenSkillsUsed[battleId] = true;
                                                    }
                                                    break;
                                                }
                                                default:
                                                    if (skillData.kiCost > 0) oppKi -= kiRequired;
                                                    battleLog.push(`⚡ ${opponentData.name} dùng ${skillData.name}!`);
                                                    break;
                                            }
                                        }
                                    } else {
                                        const normalDamage = Math.floor(oppDamage * 0.8);

                                        if (playerStates.shielded > 0) {
                                            battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn đòn tấn công thường!`);
                                            playerStates.shielded--;
                                        } else {
                                            playerHP -= normalDamage;
                                            battleLog.push(`👊 ${opponentData.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                        }
                                    }
                                } else {
                                    const normalDamage = oppStates.powerBoosted > 0 ?
                                        Math.floor(oppDamage * oppStates.powerBoostMultiplier * 0.8) :
                                        Math.floor(oppDamage * 0.8);

                                    if (playerStates.shielded > 0) {
                                        battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn đòn tấn công thường!`);
                                        playerStates.shielded--;
                                    } else {
                                        playerHP -= normalDamage;
                                        battleLog.push(`👊 ${opponentData.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    }
                                }
                            } else if (oppStates.stunned > 0) {
                                battleLog.push(`😵 ${opponentData.name} đang bị choáng! Không thể hành động!`);
                                oppStates.stunned--;
                            } else if (oppStates.bound > 0) {
                                battleLog.push(`🔗 ${opponentData.name} đang bị trói! Không thể hành động!`);
                                oppStates.bound--;
                            }

                            if (playerStates.powerBoosted > 0) {
                                playerStates.powerBoosted--;
                                if (playerStates.powerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${player.name} đã hết!`);
                                }
                            }

                            if (oppStates.powerBoosted > 0) {
                                oppStates.powerBoosted--;
                                if (oppStates.powerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${opponentData.name} đã hết!`);
                                }
                            }
                        }

                        const playerWin = playerHP > 0 && (oppHP <= 0 || turn >= MAX_TURNS && playerHP > oppHP);

                        currentMatch.completed = true;
                        currentMatch.winner = playerWin ? { id: senderID, name: player.name } : { id: opponent.id, name: opponent.name };
                        currentMatch.loser = playerWin ? { id: opponent.id, name: opponent.name } : { id: senderID, name: player.name };

                        updateTournamentBracket(tournamentData);

                        player.stats.currentKi = Math.min(originalPlayerKi, playerKi + Math.floor((originalPlayerKi - playerKi) * 0.5));
                        opponentData.stats.currentKi = Math.min(originalOpponentKi, oppKi + Math.floor((originalOpponentKi - oppKi) * 0.5));

                        saveTournamentData(tournamentData);
                        savePlayerData(playerData);

                        return api.sendMessage(
                            `🏆 ${playerWin ? "𝐂𝐇𝐈𝐄̂́𝐍 𝐓𝐇𝐀̆́𝐍𝐆!" : "𝐓𝐇𝐀̂́𝐓 𝐁𝐀̣𝐈!"} 🏆\n` +
                            `───────────────\n` +
                            `👑 ${TOURNAMENT_TYPES[tournamentData.active.type].name} - Vòng ${currentMatch.round}\n` +
                            battleLog.slice(-7).join("\n") + "\n\n" +
                            `👤 ${playerWin ? player.name : opponentData.name} đã chiến thắng!\n` +
                            `💡 Hãy chờ trận đấu tiếp theo.\n\n` +
                            `💡 Dùng .dball tour bracket để xem bảng đấu`,
                            threadID, messageID
                        );
                        return;
                    }
                    if (target[1]?.toLowerCase() === "camp" || target[1]?.toLowerCase() === "doanh" || target[1]?.toLowerCase() === "trại") {
                        const now = Date.now();
                        const campCooldown = 300000;

                        if (player.lastCampFight && now - player.lastCampFight < campCooldown) {
                            const timeLeft = Math.ceil((campCooldown - (now - player.lastCampFight)) / 1000);
                            return api.sendMessage(
                                `⏳ Vui lòng đợi ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s để hồi phục sức!`,
                                threadID, messageID
                            );
                        }


                        if (!player.campProgress) player.campProgress = 0;
                        const nextLevelIndex = player.campProgress;


                        if (!CAMP_LEVELS[nextLevelIndex]) {
                            return api.sendMessage(
                                "🎉 Chúc mừng! Bạn đã hoàn thành tất cả các tầng trong Trại Độc Nhãn!",
                                threadID, messageID
                            );
                        }

                        const currentLevel = CAMP_LEVELS[nextLevelIndex];



                        const dragonBallStar = 7 - Math.min(6, Math.floor(nextLevelIndex / 2));


                        if (player.stats.power < currentLevel.requiredPower) {
                            return api.sendMessage(
                                `❌ 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 không đủ để thách đấu ${currentLevel.name}!\n` +
                                `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 yêu cầu: ${currentLevel.requiredPower.toLocaleString()}\n\n` +
                                "💡 Hãy luyện tập thêm để tăng sức mạnh!",
                                threadID, messageID
                            );
                        }



                        let enemyHP = currentLevel.hp;
                        const enemyDamage = currentLevel.power / 2;

                        if (!player.stats.currentHealth) player.stats.currentHealth = player.stats.health;
                        if (!player.stats.currentKi) player.stats.currentKi = player.stats.ki;

                        let playerHP = player.stats.currentHealth;
                        let playerKi = player.stats.currentKi;
                        let playerDamage = player.stats.damage;

                        let battleLog = [];
                        battleLog.push(`⚔️ ${player.name} đang thách đấu ${currentLevel.name}: ${currentLevel.enemy}!`);

                        let playerStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        let enemyStates = {
                            stunned: 0,
                            bound: 0
                        };

                        let turn = 0;
                        const MAX_TURNS = 30;

                        while (playerHP > 0 && enemyHP > 0 && turn < MAX_TURNS) {
                            turn++;

                            if (!playerStates.stunned && !playerStates.bound) {

                                if (player.skills.length > 0 && Math.random() < 0.7) {
                                    const skillChoice = player.skills[Math.floor(Math.random() * player.skills.length)];
                                    const [master, skillName] = skillChoice.split(":");
                                    const skillData = MASTERS[master].skills[skillName];

                                    const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                                    const kiRequired = Math.floor(playerKi * skillData.kiCost);

                                    if (playerKi >= kiRequired || skillData.kiCost < 0) {
                                        if (skillData.powerScale > 0) {
                                            const actualDamage = playerStates.powerBoosted > 0 ?
                                                Math.floor(skillDamage * playerStates.powerBoostMultiplier) : skillDamage;

                                            enemyHP -= actualDamage;

                                            if (skillData.kiCost > 0) playerKi -= kiRequired;

                                            battleLog.push(
                                                `🎯 ${player.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                                (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                            );

                                        } else {
                                            switch (skillName) {
                                                case "SOLAR_FLARE":
                                                    enemyStates.stunned = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`☀️ ${player.name} dùng Thái Dương Hạ San! ${currentLevel.enemy} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "HYPNOSIS":
                                                    monsterStates.stunned = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🌀 ${player.name} dùng Thôi Miên! ${monster.name} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "KAIOKEN":
                                                    playerStates.powerBoosted = 3;
                                                    playerStates.powerBoostMultiplier = 3.0;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🔥 ${player.name} dùng Kaioken! 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 tăng x3 trong 3 lượt!`);
                                                    break;

                                                case "BIND":
                                                    enemyStates.bound = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🔗 ${player.name} dùng Trói! ${currentLevel.enemy} bị trói trong 2 lượt!`);
                                                    break;

                                                case "ENERGY_SHIELD": {
                                                    const damage = Math.floor(playerDamage * 1.5);
                                                    const shieldDuration = 2;

                                                    playerStates.shielded = shieldDuration;
                                                    playerStates.shieldStrength = damage;

                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;

                                                    battleLog.push(`🛡️ ${player.name} tạo Khiên Năng Lượng!`);
                                                    battleLog.push(`🛡️ Khiên có thể chịu được ${damage.toLocaleString()} sát thương trong ${shieldDuration} lượt!`);
                                                    break;
                                                }


                                                    if (playerStates.shielded > 0) {
                                                        if (incomingDamage > playerStates.shieldStrength) {

                                                            battleLog.push(`💥 Khiên Năng Lượng của ${player.name} bị vỡ!`);
                                                            playerStates.shielded = 0;

                                                            playerHP -= (incomingDamage - playerStates.shieldStrength);
                                                        } else {
                                                            battleLog.push(`🛡️ Khiên Năng Lượng của ${player.name} chặn ${incomingDamage.toLocaleString()} sát thương!`);
                                                            playerStates.shieldStrength -= incomingDamage;
                                                        }
                                                        playerStates.shielded--;
                                                    }
                                                case "GREAT_APE": {
                                                    // Kiểm tra đủ điều kiện
                                                    if (playerKi < player.stats.ki * 0.8) {
                                                        battleLog.push(`❌ ${player.name} không đủ Ki để biến thành Khỉ Đột Khổng Lồ!`);

                                                        // Đánh thường thay thế
                                                        const normalDamage = Math.floor(playerDamage * 0.8);

                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }

                                                    // Kích hoạt biến khỉ khổng lồ
                                                    playerStates.greatApe = 3; // Hiệu lực 3 lượt
                                                    playerStates.powerBoostMultiplier = 10.0; // Tăng x10 sức mạnh
                                                    playerStates.powerBoosted = 3;
                                                    playerKi -= Math.floor(playerKi * 0.8); // Tiêu tốn 80% Ki

                                                    battleLog.push(`🦍 ${player.name} biến thành KHỈ ĐỘT KHỔNG LỒ!`);
                                                    battleLog.push(`💪 Sức mạnh tăng x10 trong 3 lượt!`);

                                                    // Gây sát thương ban đầu
                                                    const initialDamage = Math.floor(playerDamage * 5);

                                                    if (typeof monsterHP !== 'undefined') {
                                                        monsterHP -= initialDamage;
                                                    } else if (typeof enemyHP !== 'undefined') {
                                                        enemyHP -= initialDamage;
                                                    } else if (typeof oppHP !== 'undefined') {
                                                        oppHP -= initialDamage;
                                                    }

                                                    battleLog.push(`💥 Cú đấm khổng lồ gây ${initialDamage.toLocaleString()} sát thương!`);
                                                    break;
                                                }
                                                case "SPIRIT_BOMB": {
                                                    if (!player.spiritBombCharge) player.spiritBombCharge = 0;

                                                    player.spiritBombCharge += 1;

                                                    playerKi -= kiRequired;

                                                    if (player.spiritBombCharge < 25) {

                                                        battleLog.push(`✨ ${player.name} đang giơ tay thu thập năng lượng cho Quả Cầu Kinh Khí (${player.spiritBombCharge}/25)...`);
                                                        battleLog.push(`🔄 Cần tích tụ thêm năng lượng!`);

                                                        playerStates.vulnerable = 2;
                                                    } else {
                                                        const spiritBombDamage = Math.floor(playerDamage * 8);

                                                        if (typeof oppHP !== 'undefined') {
                                                            oppHP -= spiritBombDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= spiritBombDamage;
                                                        } else if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= spiritBombDamage;
                                                        }

                                                        battleLog.push(`💫 ${player.name} đã hoàn thành Quả Cầu Kinh Khí khổng lồ!`);
                                                        battleLog.push(`💥 Quả Cầu Kinh Khí tấn công đối thủ gây ${spiritBombDamage.toLocaleString()} sát thương!`);

                                                        player.spiritBombCharge = 0;


                                                        playerKi = 0;
                                                    }
                                                    break;
                                                }
                                                case "REGENERATION":
                                                case "WHISTLE":
                                                case "REGENERATE_ENERGY": {

                                                    if (!player.regenSkillsUsed) {
                                                        player.regenSkillsUsed = {};
                                                    }

                                                    const battleId = Date.now().toString().slice(0, 10);


                                                    if (player.regenSkillsUsed[battleId]) {
                                                        battleLog.push(`❌ ${player.name} đã sử dụng kỹ năng hồi phục trong trận này!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }


                                                    const maxHP = player.stats.health;
                                                    const maxKi = player.stats.ki;
                                                    const currentHPPercent = (playerHP / maxHP) * 100;
                                                    const currentKiPercent = (playerKi / maxKi) * 100;


                                                    if (currentHPPercent > 40 && currentKiPercent > 40) {
                                                        battleLog.push(`❌ ${player.name} không thể dùng kỹ năng hồi phục khi HP và Ki còn cao!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                    } else {

                                                        const hpRecover = Math.floor(maxHP * 0.3);
                                                        const kiRecover = Math.floor(maxKi * 0.3);

                                                        playerHP = Math.min(maxHP, playerHP + hpRecover);
                                                        playerKi = Math.min(maxKi, playerKi + kiRecover);

                                                        battleLog.push(`💚 ${player.name} dùng kỹ năng hồi phục!`);
                                                        battleLog.push(`❤️ Hồi phục ${hpRecover.toLocaleString()} HP`);
                                                        battleLog.push(`✨ Hồi phục ${kiRecover.toLocaleString()} Ki`);


                                                        player.regenSkillsUsed[battleId] = true;
                                                    }
                                                    break;
                                                }
                                                default:
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                                    break;
                                            }
                                        }
                                    } else {
                                        const normalDamage = Math.floor(playerDamage * 0.8);
                                        enemyHP -= normalDamage;
                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    }
                                } else {
                                    const normalDamage = playerStates.powerBoosted > 0 ?
                                        Math.floor(playerDamage * playerStates.powerBoostMultiplier * 0.8) :
                                        Math.floor(playerDamage * 0.8);

                                    enemyHP -= normalDamage;
                                    battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                }
                            } else if (playerStates.stunned > 0) {
                                battleLog.push(`😵 ${player.name} đang bị choáng! Không thể hành động!`);
                                playerStates.stunned--;
                            } else if (playerStates.bound > 0) {
                                battleLog.push(`⛓️ ${player.name} đang bị trói, không thể sử dụng kỹ năng!`);

                                continue;
                            }

                            if (enemyHP <= 0) break;

                            if (!enemyStates.stunned && !enemyStates.bound) {

                                if (player.campProgress > 9 && Math.random() < 0.3) {

                                    const bossSkills = ["Tấn Công Tăng Cường", "Bom Năng Lượng", "Khiên Bảo Vệ"];
                                    const selectedSkill = bossSkills[Math.floor(Math.random() * bossSkills.length)];

                                    switch (selectedSkill) {
                                        case "Tấn Công Tăng Cường":
                                            const boostedDamage = Math.floor(enemyDamage * 1.5);
                                            if (playerStates.shielded > 0) {
                                                battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn đòn tấn công tăng cường (${boostedDamage.toLocaleString()} DMG) của ${currentLevel.enemy}!`);
                                                playerStates.shielded--;
                                            } else {
                                                playerHP -= boostedDamage;
                                                battleLog.push(`⚡ ${currentLevel.enemy} dùng Tấn Công Tăng Cường gây ${boostedDamage.toLocaleString()} sát thương!`);
                                            }
                                            break;
                                        case "Bom Năng Lượng":
                                            const bombDamage = Math.floor(enemyDamage * 2);
                                            if (playerStates.shielded > 0) {
                                                battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn Bom Năng Lượng (${bombDamage.toLocaleString()} DMG) của ${currentLevel.enemy}!`);
                                                playerStates.shielded--;
                                            } else {
                                                playerHP -= bombDamage;
                                                battleLog.push(`💣 ${currentLevel.enemy} ném Bom Năng Lượng gây ${bombDamage.toLocaleString()} sát thương!`);
                                            }
                                            break;
                                        case "Khiên Bảo Vệ":
                                            enemyStates.shielded = 2;
                                            battleLog.push(`🛡️ ${currentLevel.enemy} kích hoạt Khiên Bảo Vệ! Giảm sát thương trong 2 lượt.`);
                                            break;
                                    }
                                } else {
                                    const enemyAttack = Math.floor(enemyDamage * (0.9 + Math.random() * 0.3));
                                    const finalDamage = enemyStates.shielded > 0 ? Math.floor(enemyAttack * 0.5) : enemyAttack;

                                    if (playerStates.shielded > 0) {
                                        battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn ${finalDamage.toLocaleString()} sát thương!`);
                                        playerStates.shielded--;
                                    } else {
                                        playerHP -= finalDamage;
                                        battleLog.push(`💥 ${currentLevel.enemy} tấn công gây ${finalDamage.toLocaleString()} sát thương!`);
                                    }

                                    if (enemyStates.shielded > 0) enemyStates.shielded--;
                                }
                            } else if (enemyStates.stunned > 0) {
                                battleLog.push(`😵 ${currentLevel.enemy} đang bị choáng! Không thể hành động!`);
                                enemyStates.stunned--;
                            } else if (enemyStates.bound > 0) {
                                battleLog.push(`🔗 ${currentLevel.enemy} đang bị trói! Không thể hành động!`);
                                enemyStates.bound--;
                            }

                            if (playerStates.powerBoosted > 0) {
                                playerStates.powerBoosted--;
                                if (playerStates.powerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${player.name} đã hết!`);
                                }
                            }
                        }

                        player.lastCampFight = now;
                        if (playerHP > 0) {


                            player.campProgress++;



                            if (!player.inventory) player.inventory = { dragonBalls: [] };
                            if (!player.inventory.dragonBalls) player.inventory.dragonBalls = [];


                            const existingBall = player.inventory.dragonBalls.find(
                                ball => ball.planet === player.planet && ball.star === dragonBallStar
                            );

                            if (!existingBall) {
                                player.inventory.dragonBalls.push({
                                    planet: player.planet,
                                    star: dragonBallStar
                                });


                                const dragonBallData = loadDragonBallData();
                                dragonBallData[player.planet][dragonBallStar] = senderID;
                                saveDragonBallData(dragonBallData);


                                battleLog.push(`🔮 Bạn đã tìm thấy Ngọc Rồng ${dragonBallStar} sao!`);
                            } else {

                                const zeniBonusDragonBall = 10000 * dragonBallStar;
                                player.stats.zeni += zeniBonusDragonBall;
                                battleLog.push(`💰 Bạn đã có Ngọc Rồng ${dragonBallStar} sao nên nhận ${zeniBonusDragonBall.toLocaleString()} Zeni!`);
                            }


                            updateQuestProgress(player, QUEST_TYPES.COLLECT);


                            const expGain = Math.floor(currentLevel.exp);
                            const zeniGain = currentLevel.zeni;

                            player.stats.exp += expGain;
                            player.stats.zeni += zeniGain;

                            if (player.stats.exp > MAX_EXP_STORAGE) {
                                player.stats.exp = MAX_EXP_STORAGE;
                            }
                            if (player.selfDestructUsed) {
                                player.stats.currentHealth = 1;
                                player.stats.currentKi = 0;

                                console.log("[DEBUG] Applied final Self-Destruct state after battle");

                                delete player.selfDestructUsed;
                            }

                            player.stats.currentHealth = playerHP;
                            player.stats.currentKi = playerKi;


                            updateQuestProgress(player, QUEST_TYPES.COMBAT, { monster: currentLevel.enemy.toLowerCase().replace(/\s+/g, '_') });

                            savePlayerData(playerData);


                            let nextLevelMsg = "";
                            if (CAMP_LEVELS[player.campProgress]) {
                                nextLevelMsg = `\n\n💡 Tầng tiếp theo: ${CAMP_LEVELS[player.campProgress].name}\n` +
                                    `👹 Kẻ địch: ${CAMP_LEVELS[player.campProgress].enemy}\n` +
                                    `💪 Yêu cầu: ${CAMP_LEVELS[player.campProgress].requiredPower.toLocaleString()} sức mạnh`;
                            } else {
                                nextLevelMsg = "\n\n🎉 Bạn đã hoàn thành tất cả các tầng của Trại Độc Nhãn!";
                            }

                            return api.sendMessage(
                                `🎉 CHIẾN THẮNG! 🎉\n` +
                                `───────────────\n` +
                                `👹 Đánh bại: ${currentLevel.enemy} tại ${currentLevel.name}\n\n` +
                                `📊 Thông tin trận đấu:\n` +
                                battleLog.slice(-8).join("\n") + "\n\n" +
                                `📊 𝗘𝗫𝗣 +${expGain.toLocaleString()}\n` +
                                `💰 𝗭𝗲𝗻𝗶 +${zeniGain.toLocaleString()}\n` +
                                `❤️ HP còn lại: ${Math.floor(playerHP).toLocaleString()}/${player.stats.health.toLocaleString()}\n` +
                                `✨ Ki còn lại: ${Math.floor(playerKi).toLocaleString()}/${player.stats.ki.toLocaleString()}` +
                                nextLevelMsg,
                                threadID, messageID
                            );

                        } else {
                            player.campProgress = 0;
                            player.stats.currentHealth = Math.floor(player.stats.health * 0.3);
                            player.stats.currentKi = Math.floor(player.stats.ki * 0.5);

                            savePlayerData(playerData);

                            return api.sendMessage(
                                `💀 𝐘𝐎𝐔 𝐃𝐈𝐄𝐃! 💀\n` +
                                `───────────────\n` +
                                `👹 Tử vong tại: ${currentLevel.name}\n` +
                                `⚔️ Kẻ địch: ${currentLevel.enemy}\n\n` +
                                `📊 Thông tin trận đấu:\n` +
                                battleLog.slice(-8).join("\n") + "\n\n" +
                                `⚠️ Bạn đã thất bại và phải bắt đầu lại từ đầu!\n` +
                                `❤️ HP hiện tại: ${player.stats.currentHealth.toLocaleString()}\n` +
                                `✨ Ki hiện tại: ${player.stats.currentKi.toLocaleString()}\n\n` +
                                `💡 Hãy hồi phục và thử lại sau!`,
                                threadID, messageID
                            );
                        }
                        return;
                    }

                    if (target[1]?.toLowerCase() === "monster" || target[1]?.toLowerCase() === "quai") {

                        if (!player) {
                            return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                        }
                        const monsterType = target[2]?.toLowerCase();
                        const monster = monsterType ?
                            Object.entries(MONSTERS).find(([id, data]) => id.toLowerCase() === monsterType || data.name.toLowerCase() === monsterType)?.[1]
                            : selectRandomMonster(player.planet);

                        if (!monster) {
                            return api.sendMessage(
                                "❌ Không tìm thấy quái vật này!\n" +
                                "Hãy chọn quái vật từ danh sách dưới đây:\n" +
                                Object.entries(MONSTERS)
                                    .filter(([id, data]) => data.planet === player.planet)
                                    .map(([id, data]) => `- ${data.name} (${id})`)
                                    .join("\n") +
                                "\n\nCách dùng: .dball fight monster <tên_quái>",
                                threadID, messageID
                            );
                        }
                        const now = Date.now();
                        const fightCooldown = 30000;
                        if (player.lastMonsterFight && now - player.lastMonsterFight < fightCooldown) {
                            const timeLeft = Math.ceil((fightCooldown - (now - player.lastMonsterFight)) / 1000);
                            return api.sendMessage(`⏳ Vui lòng đợi ${timeLeft}s để phục hồi sức!`, threadID, messageID);
                        }

                        if (!player.quests?.active || player.quests.active.length === 0) {
                            return api.sendMessage(
                                "❌ Bạn chưa có nhiệm vụ nào!\n" +
                                "💡 Dùng .dball quest để nhận nhiệm vụ mới",
                                threadID, messageID
                            );
                        }

                        const currentQuestId = player.quests.active[0];
                        const currentQuest = QUESTS[currentQuestId];

                        if (!currentQuest || currentQuest.type !== QUEST_TYPES.COMBAT) {
                            return api.sendMessage(
                                "❌ Nhiệm vụ hiện tại không phải là nhiệm vụ đánh quái!\n" +
                                "💡 Hoàn thành nhiệm vụ hiện tại trước",
                                threadID, messageID
                            );
                        }

                        const questMonster = MONSTERS[currentQuest.monster];
                        if (!questMonster) {
                            return api.sendMessage("❌ Có lỗi với nhiệm vụ, vui lòng thử lại sau!", threadID, messageID);
                        }

                        const questProgress = player.quests.progress[currentQuestId] || 0;
                        if (questProgress >= currentQuest.target) {
                            return api.sendMessage(
                                "✅ Bạn đã hoàn thành đủ số lần đánh quái cho nhiệm vụ này!\n",

                                threadID, messageID
                            );
                        }

                        let playerHP = player.stats.health;
                        let playerKi = player.stats.ki;
                        let playerDamage = player.stats.damage;
                        let monsterHP = monster.hp;
                        let monsterDamage = monster.power / 10;
                        let battleLog = [];

                        const originalPlayerKi = player.stats.ki;

                        if (player.inventory?.items) {
                            const equipped = player.inventory.items.filter(item => item.equipped);
                            equipped.forEach(item => {
                                if (item.id === "armor") {
                                    playerHP *= 1.15;
                                }
                                if (item.id === "scouter") {
                                    playerDamage *= 1.1;
                                }
                            });
                        }

                        let playerStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        let monsterStates = {
                            stunned: 0,
                            bound: 0
                        };

                        battleLog.push(`⚔️ ${player.name} đang đánh với ${monster.name}!`);

                        if (!player.skills) player.skills = [];

                        let turn = 0;
                        const MAX_TURNS = 20;

                        while (playerHP > 0 && monsterHP > 0 && turn < MAX_TURNS) {
                            turn++;

                            if (!playerStates.stunned && !playerStates.bound) {

                                if (player.skills.length > 0 && Math.random() < 0.7) {
                                    const skillChoice = player.skills[Math.floor(Math.random() * player.skills.length)];
                                    const [master, skillName] = skillChoice.split(":");
                                    const skillData = MASTERS[master].skills[skillName];

                                    const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                                    const kiRequired = Math.floor(playerKi * skillData.kiCost);
                                    if (playerKi >= kiRequired || skillData.kiCost < 0) {

                                        if (skillData.powerScale > 0) {

                                            monsterHP -= playerStates.powerBoosted > 0 ?
                                                skillDamage * playerStates.powerBoostMultiplier : skillDamage;

                                            if (skillData.kiCost > 0) playerKi -= kiRequired;

                                            const actualDamage = playerStates.powerBoosted > 0 ?
                                                Math.floor(skillDamage * playerStates.powerBoostMultiplier) : skillDamage;

                                            battleLog.push(
                                                `🎯 ${player.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                                (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                            );

                                        } else {
                                            switch (skillName) {
                                                case "SOLAR_FLARE":
                                                    monsterStates.stunned = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`☀️ ${player.name} dùng Thái Dương Hạ San! ${monster.name} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "HYPNOSIS":
                                                    monsterStates.stunned = 2;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🌀 ${player.name} dùng Thôi Miên! ${monster.name} bị choáng trong 2 lượt!`);
                                                    break;

                                                case "KAIOKEN":
                                                    playerStates.powerBoosted = 3;
                                                    playerStates.powerBoostMultiplier = 3.0;
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`🔥 ${player.name} dùng Kaioken! 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 tăng x3 trong 3 lượt!`);
                                                    break;

                                                case "BIND":
                                                    opponentStates.bound = 2;
                                                    battleLog.push(`⛓️ ${player.name} đã trói ${opponent.name}!`);
                                                    battleLog.push(`⛓️ ${opponent.name} không thể tấn công trong 2 lượt!`);
                                                    break;

                                                case "ENERGY_SHIELD": {
                                                    const damage = Math.floor(playerDamage * 1.5);
                                                    const shieldDuration = 2;

                                                    playerStates.shielded = shieldDuration;
                                                    playerStates.shieldStrength = damage;

                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;

                                                    battleLog.push(`🛡️ ${player.name} tạo Khiên Năng Lượng!`);
                                                    battleLog.push(`🛡️ Khiên có thể chịu được ${damage.toLocaleString()} sát thương trong ${shieldDuration} lượt!`);
                                                    break;
                                                }


                                                    if (playerStates.shielded > 0) {
                                                        if (incomingDamage > playerStates.shieldStrength) {

                                                            battleLog.push(`💥 Khiên Năng Lượng của ${player.name} bị vỡ!`);
                                                            playerStates.shielded = 0;

                                                            playerHP -= (incomingDamage - playerStates.shieldStrength);
                                                        } else {
                                                            battleLog.push(`🛡️ Khiên Năng Lượng của ${player.name} chặn ${incomingDamage.toLocaleString()} sát thương!`);
                                                            playerStates.shieldStrength -= incomingDamage;
                                                        }
                                                        playerStates.shielded--;
                                                    }


                                                case "GREAT_APE": {
                                                    if (playerKi < player.stats.ki * 0.8) {
                                                        battleLog.push(`❌ ${player.name} không đủ Ki để biến thành Khỉ Đột Khổng Lồ!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);

                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }

                                                    playerStates.greatApe = 3;
                                                    playerStates.powerBoostMultiplier = 10.0;
                                                    playerStates.powerBoosted = 3;
                                                    playerKi -= Math.floor(playerKi * 0.8);

                                                    battleLog.push(`🦍 ${player.name} biến thành KHỈ ĐỘT KHỔNG LỒ!`);
                                                    battleLog.push(`💪 Sức mạnh tăng x10 trong 3 lượt!`);

                                                    const initialDamage = Math.floor(playerDamage * 5);

                                                    if (typeof monsterHP !== 'undefined') {
                                                        monsterHP -= initialDamage;
                                                    } else if (typeof enemyHP !== 'undefined') {
                                                        enemyHP -= initialDamage;
                                                    } else if (typeof oppHP !== 'undefined') {
                                                        oppHP -= initialDamage;
                                                    }

                                                    battleLog.push(`💥 Cú đấm khổng lồ gây ${initialDamage.toLocaleString()} sát thương!`);
                                                    break;
                                                }
                                                case "REGENERATION":
                                                case "WHISTLE":
                                                case "REGENERATE_ENERGY": {

                                                    if (!player.regenSkillsUsed) {
                                                        player.regenSkillsUsed = {};
                                                    }

                                                    const battleId = Date.now().toString().slice(0, 10);


                                                    if (player.regenSkillsUsed[battleId]) {
                                                        battleLog.push(`❌ ${player.name} đã sử dụng kỹ năng hồi phục trong trận này!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                        break;
                                                    }


                                                    const maxHP = player.stats.health;
                                                    const maxKi = player.stats.ki;
                                                    const currentHPPercent = (playerHP / maxHP) * 100;
                                                    const currentKiPercent = (playerKi / maxKi) * 100;


                                                    if (currentHPPercent > 40 && currentKiPercent > 40) {
                                                        battleLog.push(`❌ ${player.name} không thể dùng kỹ năng hồi phục khi HP và Ki còn cao!`);

                                                        const normalDamage = Math.floor(playerDamage * 0.8);


                                                        if (typeof monsterHP !== 'undefined') {
                                                            monsterHP -= normalDamage;
                                                        } else if (typeof enemyHP !== 'undefined') {
                                                            enemyHP -= normalDamage;
                                                        } else if (typeof oppHP !== 'undefined') {
                                                            oppHP -= normalDamage;
                                                        }

                                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                                    } else {

                                                        const hpRecover = Math.floor(maxHP * 0.3);
                                                        const kiRecover = Math.floor(maxKi * 0.3);

                                                        playerHP = Math.min(maxHP, playerHP + hpRecover);
                                                        playerKi = Math.min(maxKi, playerKi + kiRecover);

                                                        battleLog.push(`💚 ${player.name} dùng kỹ năng hồi phục!`);
                                                        battleLog.push(`❤️ Hồi phục ${hpRecover.toLocaleString()} HP`);
                                                        battleLog.push(`✨ Hồi phục ${kiRecover.toLocaleString()} Ki`);


                                                        player.regenSkillsUsed[battleId] = true;
                                                    }
                                                    break;
                                                }

                                                default:
                                                    if (skillData.kiCost < 0) {

                                                        const kiRestore = Math.abs(kiRequired);
                                                        const oldKi = player.stats.ki;
                                                        player.stats.ki = Math.min(player.stats.ki + kiRestore, player.stats.health);
                                                        battleLog.push(`✨ ${player.name} dùng ${skillData.name}! Ki: ${oldKi} → ${player.stats.ki}`);
                                                    } else {
                                                        if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                        battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                                    }
                                            }
                                        }
                                    } else {
                                        const normalDamage = Math.floor(playerDamage * 0.8);
                                        monsterHP -= normalDamage;
                                        battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    }
                                } else {
                                    const normalDamage = playerStates.powerBoosted > 0 ?
                                        Math.floor(playerDamage * playerStates.powerBoostMultiplier * 0.8) :
                                        Math.floor(playerDamage * 0.8);

                                    monsterHP -= normalDamage;
                                    battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                }
                            } else if (playerStates.stunned > 0) {
                                battleLog.push(`😵 ${player.name} đang bị choáng! Không thể hành động!`);
                                playerStates.stunned--;
                            } else if (playerStates.bound > 0) {
                                battleLog.push(`🔗 ${player.name} đang bị trói! Không thể hành động!`);
                                playerStates.bound--;
                            }

                            if (monsterHP <= 0) break;

                            if (!monsterStates.stunned && !monsterStates.bound) {
                                const monsterAttack = Math.floor(monsterDamage * (0.8 + Math.random() * 0.4));

                                if (playerStates.shielded > 0) {
                                    battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn ${monsterAttack.toLocaleString()} sát thương!`);
                                    playerStates.shielded--;

                                    if (playerStates.shielded === 1) {
                                        battleLog.push(`⚠️ Khiên năng lượng sẽ biến mất sau lượt tiếp theo!`);
                                    }
                                } else {
                                    playerHP -= monsterAttack;
                                    battleLog.push(`💥 ${monster.name} tấn công gây ${monsterAttack.toLocaleString()} sát thương!`);
                                }
                            } else if (monsterStates.stunned > 0) {
                                battleLog.push(`😵 ${monster.name} đang bị choáng! Không thể hành động!`);
                                monsterStates.stunned--;
                            } else if (monsterStates.bound > 0) {
                                battleLog.push(`🔗 ${monster.name} đang bị trói! Không thể hành động!`);
                                monsterStates.bound--;
                            }

                            if (playerStates.powerBoosted > 0) {
                                playerStates.powerBoosted--;
                                if (playerStates.powerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${player.name} đã hết!`);
                                }
                            }
                        }

                        player.lastMonsterFight = now;

                        if (playerHP > 0) {
                            const currentHealth = playerHP;
                            player.stats.currentHealth = currentHealth;

                            const kiLost = originalPlayerKi - playerKi;
                            const kiRestore = Math.floor(kiLost * 0.7);
                            player.stats.currentKi = Math.min(player.stats.ki, playerKi + kiRestore);

                            player.stats.currentKi = playerKi;
                            let expGain = monster.exp;
                            let zeniGain = monster.zeni;

                            const playerLevel = player.stats.level || 1;
                            expGain = Math.floor(expGain * (1 + playerLevel * 0.05));
                            zeniGain = Math.floor(zeniGain * (1 + playerLevel * 0.03));

                            if (player.stats.exp + expGain > MAX_EXP_STORAGE) {
                                player.stats.exp = MAX_EXP_STORAGE;
                            } else {
                                player.stats.exp += expGain;
                            }

                            player.stats.zeni += zeniGain;

                            let dropMessage = "";
                            if (monster.dropChance > 0 && Math.random() < monster.dropChance) {
                                const dropItem = monster.dropItem;
                                if (dropItem && SHOP_ITEMS[dropItem.toUpperCase()]) {
                                    if (!player.inventory) player.inventory = { items: [] };
                                    if (!player.inventory.items) player.inventory.items = [];

                                    const item = SHOP_ITEMS[dropItem.toUpperCase()];
                                    const existingItem = player.inventory.items.find(i => i.id === dropItem);

                                    if (existingItem) {
                                        existingItem.quantity += 1;
                                    } else {
                                        player.inventory.items.push({
                                            id: dropItem,
                                            quantity: 1,
                                            type: item.type
                                        });
                                    }

                                    dropMessage = `\n🎁 ${monster.name} rơi ra: ${item.name}!`;
                                }
                            }

                            updateQuestProgress(player, QUEST_TYPES.COMBAT, playerData, { monster: currentQuest.monster });
                            savePlayerData(playerData);

                            if (playerHP > 0) {
                                player.quests.progress[currentQuestId] = (player.quests.progress[currentQuestId] || 0) + 1;
                                const remainingKills = currentQuest.target - player.quests.progress[currentQuestId];

                                savePlayerData(playerData);

                                return api.sendMessage(
                                    "🏆 𝗖𝗛𝗜𝗘̂́𝗡 𝗧𝗛𝗔̆́𝗡𝗚! 🏆\n" +
                                    "───────────────\n" +
                                    `🌍 Hành tinh: ${PLANETS[player.planet].name}\n` +
                                    battleLog.slice(-5).join("\n") + "\n\n" +
                                    "💡 Kết quả:\n" +
                                    `📊 𝗘𝗫𝗣 +${expGain.toLocaleString()}\n` +
                                    `💰 𝗭𝗲𝗻𝗶 +${zeniGain.toLocaleString()}` +
                                    `\n❤️ HP: ${player.stats.currentHealth.toLocaleString()}/${player.stats.health.toLocaleString()}` +
                                    dropMessage + "\n\n" +
                                    `📋 Nhiệm vụ: ${currentQuest.name}\n` +
                                    `⏳ Tiến độ: ${player.quests.progress[currentQuestId]}/${currentQuest.target}\n` +
                                    `💪 Còn ${remainingKills} lần đánh nữa!\n\n` +
                                    "💡 Dùng đậu thần (.dball use senzu) để hồi phục\n" +
                                    "💡 Gõ .dball fight monster để đánh tiếp",
                                    threadID, messageID
                                );
                            }
                        } else {
                            return api.sendMessage(
                                "💀 THẤT BẠI! 💀\n" +
                                "───────────────\n" +
                                `🌍 Hành tinh: ${PLANETS[player.planet].name}\n` +
                                battleLog.slice(-5).join("\n") + "\n\n" +
                                `❌ Bạn đã bị đánh bại bởi ${monster.name}!\n` +
                                "💡 Hãy luyện tập thêm để trở nên mạnh hơn!",
                                threadID, messageID
                            );
                        }
                    } else {
                        const mention = Object.keys(event.mentions)[0];
                        if (!mention) {
                            return api.sendMessage(
                                "❓ Bạn muốn đánh ai?\n" +
                                "───────────────\n" +
                                "• .dball fight @người_chơi - PvP với người chơi khác\n" +
                                "• .dball fight monster - Đánh quái vật\n" +
                                "• .dball fight camp - Đi Doanh Trại độc nhãn kím ngọc rồng\n" +
                                "• .dball fight tour - Đấu đại hội võ thuật\n\n" +
                                "• .𝗱𝗯𝗮𝗹𝗹 𝘁𝗼𝘂𝗿 - Đạ𝗶 𝗵ộ𝗶 𝘃õ 𝘁𝗵𝘂ậ𝘁",
                                threadID, messageID
                            );
                            return;
                        }


                        const now = Date.now();
                        const pvpCooldown = 60000;
                        if (player.lastPvpFight && now - player.lastPvpFight < pvpCooldown) {
                            const timeLeft = Math.ceil((pvpCooldown - (now - player.lastPvpFight)) / 1000);
                            return api.sendMessage(
                                `⏳ Vui lòng đợi ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s để hồi sức sau trận PvP!`,
                                threadID, messageID
                            );
                        }

                        const opponent = playerData[mention];
                        if (!opponent) {
                            return api.sendMessage("❌ Đối thủ chưa tạo nhân vật!", threadID, messageID);
                        }

                        if (opponent.lastPvpFight && now - opponent.lastPvpFight < pvpCooldown) {
                            const timeLeft = Math.ceil((pvpCooldown - (now - opponent.lastPvpFight)) / 1000);
                            return api.sendMessage(
                                `❌ Đối thủ đang trong thời gian hồi sức sau trận PvP!\n` +
                                `⏳ Còn ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s nữa mới có thể thách đấu.`,
                                threadID, messageID
                            );
                        }

                        const originalPlayerKi = player.stats.ki;
                        const originalOpponentKi = opponent.stats.ki;

                        let playerHP = player.stats.health;
                        let playerDamage = player.stats.damage;
                        let playerKi = player.stats.ki;
                        let oppHP = opponent.stats.health;
                        let oppDamage = opponent.stats.damage;
                        let oppKi = opponent.stats.ki;
                        let battleLog = [];

                        let playerStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        let oppStates = {
                            stunned: 0,
                            shielded: 0,
                            bound: 0,
                            powerBoosted: 0,
                            powerBoostMultiplier: 1.0
                        };

                        let playerPowerBoosted = 0;
                        let playerPowerBoostMultiplier = 1.0;
                        let oppPowerBoosted = 0;
                        let oppPowerBoostMultiplier = 1.0;

                        while (playerHP > 0 && oppHP > 0) {

                            if (player.skills.length > 0) {

                                const skill = selectBestSkill(
                                    player,
                                    playerHP,
                                    playerKi,
                                    oppHP,
                                    playerStates || {},
                                    oppStates || {},
                                    battleLog
                                ) || player.skills[Math.floor(Math.random() * player.skills.length)];

                                const [master, skillName] = skill.split(":");
                                const skillData = MASTERS[master].skills[skillName];

                                const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                                const kiRequired = Math.floor(playerKi * Math.abs(skillData.kiCost));

                                if (playerKi >= kiRequired || skillData.kiCost < 0) {
                                    if (skillData.powerScale > 0) {
                                        const actualDamage = playerPowerBoosted > 0
                                            ? Math.floor(skillDamage * playerPowerBoostMultiplier)
                                            : skillDamage;

                                        oppHP -= actualDamage;

                                        if (skillData.kiCost > 0) playerKi -= kiRequired;

                                        battleLog.push(
                                            `🎯 ${player.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                            (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                        );
                                    } else if (skillData.kiCost < 0) {

                                        const kiRestore = kiRequired;
                                        playerKi = Math.min(player.stats.ki, playerKi + kiRestore);
                                        battleLog.push(`✨ ${player.name} dùng ${skillData.name}, hồi phục ${kiRestore} Ki!`);
                                    } else {

                                        if (skillName === "KAIOKEN") {
                                            playerPowerBoosted = 3;
                                            playerPowerBoostMultiplier = 3.0;
                                            if (skillData.kiCost > 0) playerKi -= kiRequired;
                                            battleLog.push(`🔥 ${player.name} dùng Kaioken! 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 tăng x3 trong 3 lượt!`);
                                        } else {
                                            if (skillData.kiCost > 0) playerKi -= kiRequired;
                                            battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                        }
                                    }
                                } else {
                                    const normalDamage = Math.floor(playerDamage * 0.8);
                                    oppHP -= normalDamage;
                                    battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                }
                            } else {
                                const normalDamage = Math.floor(playerDamage * 0.8);
                                oppHP -= normalDamage;
                                battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                            }

                            if (oppHP <= 0) break;

                            if (opponent.skills.length > 0) {
                                const skill = opponent.skills[Math.floor(Math.random() * opponent.skills.length)];
                                const [master, skillName] = skill.split(":");
                                const skillData = MASTERS[master].skills[skillName];

                                const skillDamage = Math.floor(oppDamage * skillData.powerScale);
                                const kiRequired = Math.floor(oppKi * Math.abs(skillData.kiCost));

                                if (oppKi >= kiRequired || skillData.kiCost < 0) {
                                    if (skillData.powerScale > 0) {
                                        const actualDamage = oppPowerBoosted > 0
                                            ? Math.floor(skillDamage * oppPowerBoostMultiplier)
                                            : skillDamage;

                                        playerHP -= actualDamage;

                                        if (skillData.kiCost > 0) oppKi -= kiRequired;

                                        battleLog.push(
                                            `🎯 ${opponent.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                            (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                        );
                                    } else if (skillData.kiCost < 0) {

                                        const kiRestore = kiRequired;
                                        oppKi = Math.min(opponent.stats.ki, oppKi + kiRestore);
                                        battleLog.push(`✨ ${opponent.name} dùng ${skillData.name}, hồi phục ${kiRestore} Ki!`);
                                    }
                                } else {
                                    const normalDamage = Math.floor(oppDamage * 0.8);
                                    playerHP -= normalDamage;
                                    battleLog.push(`👊 ${opponent.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                }
                            } else {
                                const normalDamage = Math.floor(oppDamage * 0.8);
                                playerHP -= normalDamage;
                                battleLog.push(`👊 ${opponent.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                            }

                            if (playerPowerBoosted > 0) {
                                playerPowerBoosted--;
                                if (playerPowerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${player.name} đã hết!`);
                                }
                            }

                            if (oppPowerBoosted > 0) {
                                oppPowerBoosted--;
                                if (oppPowerBoosted === 0) {
                                    battleLog.push(`⚠️ Hiệu ứng Kaioken của ${opponent.name} đã hết!`);
                                }
                            }
                        }

                        const winner = playerHP > 0 ? player : opponent;
                        const loser = playerHP > 0 ? opponent : player;

                        const playerKiLost = originalPlayerKi - playerKi;
                        const opponentKiLost = originalOpponentKi - oppKi;

                        player.stats.ki = Math.min(originalPlayerKi, playerKi + Math.floor(playerKiLost * 0.6));
                        opponent.stats.ki = Math.min(originalOpponentKi, oppKi + Math.floor(opponentKiLost * 0.6));

                        player.lastPvpFight = now;
                        opponent.lastPvpFight = now;

                        if (player.lastSelfDestruct && Date.now() - player.lastSelfDestruct < 1000) {
                            player.stats.currentKi = 0;
                        }
                        if (opponent.lastSelfDestruct && Date.now() - opponent.lastSelfDestruct < 1000) {
                            opponent.stats.currentKi = 0;
                        }
                        if (player.usedRegenInBattle) {
                            const currentTime = Date.now().toString().slice(0, 10);
                            const keysToKeep = Object.keys(player.usedRegenInBattle).filter(key =>
                                parseInt(currentTime) - parseInt(key) < 3600);

                            if (keysToKeep.length > 0) {
                                player.usedRegenInBattle = keysToKeep.reduce((obj, key) => {
                                    obj[key] = player.usedRegenInBattle[key];
                                    return obj;
                                }, {});
                            } else {
                                delete player.usedRegenInBattle;
                            }
                        }
                        winner.stats.exp += 20;
                        savePlayerData(playerData);

                        return api.sendMessage(
                            "⚔️ KẾT QUẢ TRẬN ĐẤU ⚔️\n" +
                            "───────────────\n" +
                            battleLog.slice(-5).join("\n") + "\n\n" +
                            `🏆 Người thắng: ${winner.name}\n` +
                            `💔 Người thua: ${loser.name}\n` +
                            `❤️ HP còn lại: ${Math.floor(playerHP)}/${player.stats.health}\n` +
                            `✨ Ki còn lại: ${Math.floor(playerKi)}/${player.stats.ki}\n\n` +
                            `📊 𝗘𝗫𝗣 thưởng: +20\n` +
                            `✨ Ki đã được hồi phục một phần!\n` +
                            `⏳ 1 phút sau để PK lại`,
                            threadID, messageID
                        );
                    }
                    return;
                }

                case "rank": {
                    const players = Object.entries(playerData)
                        .map(([id, data]) => ({
                            id,
                            name: data.name,
                            power: data.stats.power,
                            race: PLANETS[data.planet].name,
                            planet: data.planet,
                            evolution: data.evolution?.name || null
                        }))
                        .sort((a, b) => b.power - a.power)
                        .slice(0, 10);

                    let ranking = "🏆 BẢNG XẾP HẠNG SỨC MẠNH 🏆\n───────────────\n";
                    players.forEach((player, index) => {

                        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

                        const raceEmoji = player.planet === "EARTH" ? "🌎" :
                            player.planet === "NAMEK" ? "👽" :
                                player.planet === "SAIYAN" ? "🐒" : "👽";

                        const evolutionInfo = player.evolution ? ` (${player.evolution})` : '';

                        ranking += `${medal} ${player.name}\n`;
                        ranking += `${raceEmoji} Tộc: ${player.race}${evolutionInfo}\n`;
                        ranking += `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${player.power.toLocaleString()}\n\n`;
                    });

                    if (playerData[senderID]) {
                        const player = playerData[senderID];
                        const userRank = Object.entries(playerData)
                            .map(([id, data]) => ({
                                id,
                                power: data.stats.power
                            }))
                            .sort((a, b) => b.power - a.power)
                            .findIndex(p => p.id === senderID) + 1;

                        ranking += `───────────────\n`;
                        ranking += `👤 Hạng của bạn: #${userRank}\n`;
                        ranking += `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵: ${player.stats.power.toLocaleString()}\n`;
                        ranking += `🌍 Tộc: ${PLANETS[player.planet].name}\n`;
                        if (player.evolution) {
                            ranking += `🌟 Tiến hóa: ${player.evolution.name}\n`;
                        }
                    }

                    return api.sendMessage(ranking, threadID, messageID);
                }

                default: {
                    if (!playerData[senderID]) {
                        return api.sendMessage(
                            "❌ Vui lòng chọn hành tinh hợp lệ!\n\n" +
                            "Các hành tinh:\n" +
                            Object.entries(PLANETS).map(([key, data]) =>
                                `- ${key}: ${data.name} (x${data.powerBonus})`
                            ).join("\n"),
                            threadID, messageID
                        );
                    }
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ!\n\n" +
                        "Các lệnh:\n" +
                        "• info - Xem thông tin\n" +
                        "• train - Luyện tập\n" +
                        "• fight - Đấu với người khác\n" +
                        "• rank - Xem bảng xếp hạng",
                        threadID, messageID
                    );
                }
            }
        } catch (error) {
            console.error("Lỗi nghiêm trọng trong onLaunch:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi trong hệ thống. Vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
