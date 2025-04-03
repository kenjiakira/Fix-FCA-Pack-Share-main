const fs = require("fs");
const path = require("path");
const createTrainImage = require("../game/canvas/dballTrainCanvas.js");
const createMenuImage = require("../game/canvas/dballMenuCanvas.js");
const createAmuletShopImage = require("../game/canvas/dballShopbuaCanvas.js");
const createLearnImage = require("../game/canvas/dballLearnCanvas.js");
const createRadarShopImage = require("../game/canvas/dballShopRadaCanvas.js");

function getFontPath(fontName) {
    return path.join(__dirname, "../fonts", fontName);
}

const DB_FOLDER = path.join(__dirname, "json", "dragonball");
const DB_FILE = path.join(DB_FOLDER, "players.json");
const DB_BALL_FILE = path.join(DB_FOLDER, "ball.json");
const TOURNAMENT_DB = path.join(DB_FOLDER, "tournaments.json");


const EQUIPMENT_ITEMS = {

    EARTH_ARMOR_1: {
        id: "turtle_gi",
        name: "Đồ Võ Quy Lão",
        price: 2500000,
        description: "Đồng phục của võ đường Quy Lão",
        type: "armor",
        planet: "EARTH",
        boost: 1.2,
        emoji: "🧥",
        requiredPower: 10000
    },
    EARTH_ARMOR_2: {
        id: "z_fighter_armor",
        name: "Giáp Chiến Binh Z",
        price: 10000000,
        description: "Giáp đặc biệt của các chiến binh Z",
        type: "armor",
        planet: "EARTH",
        boost: 1.5,
        emoji: "🛡️",
        requiredPower: 100000
    },
    EARTH_ARMOR_3: {
        id: "weighted_clothing",
        name: "Áo Nặng Piccolo",
        price: 20000000,
        description: "Áo nặng dùng để luyện tập như Piccolo",
        type: "armor",
        planet: "EARTH",
        boost: 1.8,
        emoji: "🧥",
        requiredPower: 500000
    },
    EARTH_GLOVES_1: {
        id: "turtle_gloves",
        name: "Găng Quy Lão",
        price: 3000000,
        description: "Găng tay võ đường Quy Lão",
        type: "gloves",
        planet: "EARTH",
        boost: 1.25,
        emoji: "🥊",
        requiredPower: 15000
    },
    EARTH_GLOVES_2: {
        id: "champion_gloves",
        name: "Găng Tay Võ Sĩ",
        price: 15000000,
        description: "Găng tay của những nhà vô địch Đại Hội Võ Thuật",
        type: "gloves",
        planet: "EARTH",
        boost: 1.6,
        emoji: "🥊",
        requiredPower: 200000
    },
    EARTH_BOOTS_1: {
        id: "weighted_boots",
        name: "Giày Nặng",
        price: 15000000,
        description: "Giày tập luyện với trọng lượng cao",
        type: "boots",
        planet: "EARTH",
        boost: 1.3,
        emoji: "👟",
        requiredPower: 25000
    },
    EARTH_BOOTS_2: {
        id: "gravity_boots",
        name: "Giày Trọng Lực",
        price: 25000000,
        description: "Giày được thiết kế bởi Bulma, tăng trọng lực",
        type: "boots",
        planet: "EARTH",
        boost: 1.7,
        emoji: "👟",
        requiredPower: 300000
    },


    NAMEK_ARMOR_1: {
        id: "namek_robe",
        name: "Áo Choàng Namek",
        price: 400000,
        description: "Áo choàng của chiến binh tộc Namek",
        type: "armor",
        planet: "NAMEK",
        boost: 1.3,
        emoji: "👘",
        requiredPower: 20000
    },
    NAMEK_ARMOR_2: {
        id: "elder_robe",
        name: "Áo Choàng Trưởng Lão",
        price: 1800000,
        description: "Áo choàng của Trưởng lão Namek",
        type: "armor",
        planet: "NAMEK",
        boost: 1.6,
        emoji: "👘",
        requiredPower: 300000
    },
    NAMEK_ARMOR_3: {
        id: "fusion_armor",
        name: "Áo Giáp Hợp Thể",
        price: 35000000,
        description: "Giáp đặc biệt sau khi hợp thể với nhiều Namek",
        type: "armor",
        planet: "NAMEK",
        boost: 2.0,
        emoji: "🛡️",
        requiredPower: 1000000
    },
    NAMEK_GLOVES_1: {
        id: "namek_gauntlets",
        name: "Găng Tay Namek",
        price: 5000000,
        description: "Găng tay tăng sức mạnh của tộc Namek",
        type: "gloves",
        planet: "NAMEK",
        boost: 1.35,
        emoji: "🧤",
        requiredPower: 30000
    },
    NAMEK_GLOVES_2: {
        id: "dragon_clan_gloves",
        name: "Găng Tay Tộc Rồng",
        price: 22000000,
        description: "Găng tay của tộc Rồng Namek",
        type: "gloves",
        planet: "NAMEK",
        boost: 1.75,
        emoji: "🧤",
        requiredPower: 500000
    },
    NAMEK_BOOTS_1: {
        id: "namek_boots",
        name: "Giày Namek",
        price: 4500000,
        description: "Giày của chiến binh Namek",
        type: "boots",
        planet: "NAMEK",
        boost: 1.4,
        emoji: "👢",
        requiredPower: 25000
    },
    NAMEK_BOOTS_2: {
        id: "porunga_boots",
        name: "Giày Porunga",
        price: 30000000,
        description: "Giày được ban phép bởi Porunga",
        type: "boots",
        planet: "NAMEK",
        boost: 1.9,
        emoji: "👢",
        requiredPower: 800000
    },


    SAIYAN_ARMOR_1: {
        id: "saiyan_armor",
        name: "Áo Giáp Saiyan",
        price: 600000,
        description: "Giáp chiến đấu của tộc Saiyan",
        type: "armor",
        planet: "SAIYAN",
        boost: 1.4,
        emoji: "🦺",
        requiredPower: 30000
    },
    SAIYAN_ARMOR_2: {
        id: "royal_armor",
        name: "Giáp Hoàng Gia Saiyan",
        price: 1500000,
        description: "Giáp đặc biệt của hoàng tộc Saiyan",
        type: "armor",
        planet: "SAIYAN",
        boost: 1.7,
        emoji: "👑",
        requiredPower: 150000
    },
    SAIYAN_ARMOR_3: {
        id: "frieza_force_armor",
        name: "Giáp Quân Đội Frieza",
        price: 30000000,
        description: "Giáp tiên tiến của quân đội Frieza",
        type: "armor",
        planet: "SAIYAN",
        boost: 2.0,
        emoji: "🦺",
        requiredPower: 800000
    },
    SAIYAN_GLOVES_1: {
        id: "battle_gloves",
        name: "Găng Chiến Đấu Saiyan",
        price: 700000,
        description: "Găng tay chiến đấu tăng sức mạnh của Saiyan",
        type: "gloves",
        planet: "SAIYAN",
        boost: 1.45,
        emoji: "🧤",
        requiredPower: 40000
    },
    SAIYAN_GLOVES_2: {
        id: "super_battle_gloves",
        name: "Găng Tay Siêu Chiến",
        price: 25000000,
        description: "Găng tay cho những Siêu Saiyan",
        type: "gloves",
        planet: "SAIYAN",
        boost: 1.8,
        emoji: "🧤",
        requiredPower: 500000
    },
    SAIYAN_BOOTS_1: {
        id: "battle_boots",
        name: "Giày Chiến Đấu Saiyan",
        price: 6500000,
        description: "Giày chiến đấu tăng Ki của Saiyan",
        type: "boots",
        planet: "SAIYAN",
        boost: 1.5,
        emoji: "👢",
        requiredPower: 35000
    },
    SAIYAN_BOOTS_2: {
        id: "royal_boots",
        name: "Giày Hoàng Gia",
        price: 40000000,
        description: "Giày của Hoàng tộc Saiyan",
        type: "boots",
        planet: "SAIYAN",
        boost: 2.0,
        emoji: "👢",
        requiredPower: 1000000
    },


    RADAR_1: {
        id: "radar_1",
        name: "Rada Cấp 1",
        price: 50000000,
        description: "Tăng nhẹ EXP và sức mạnh nhận được (+20%)",
        type: "radar",
        boost: 1.2,
        emoji: "📡",
        requiredPower: 0
    },
    RADAR_2: {
        id: "radar_2",
        name: "Rada Cấp 2",
        price: 100000000,
        description: "Tăng EXP và sức mạnh nhận được (+40%)",
        type: "radar",
        boost: 1.4,
        emoji: "📡",
        requiredPower: 50000
    },
    RADAR_3: {
        id: "radar_3",
        name: "Rada Cấp 3",
        price: 200000000,
        description: "Tăng đáng kể EXP và sức mạnh nhận được (+60%)",
        type: "radar",
        boost: 1.6,
        emoji: "📡",
        requiredPower: 200000
    },
    RADAR_4: {
        id: "radar_4",
        name: "Rada Cấp 4",
        price: 400000000,
        description: "Tăng nhiều EXP và sức mạnh nhận được (+80%)",
        type: "radar",
        boost: 1.8,
        emoji: "📡",
        requiredPower: 500000
    },
    RADAR_5: {
        id: "radar_5",
        name: "Rada Cấp 5",
        price: 800000000,
        description: "Tăng rất nhiều EXP và sức mạnh nhận được (+100%)",
        type: "radar",
        boost: 2.0,
        emoji: "📡",
        requiredPower: 1000000
    },
    RADAR_6: {
        id: "radar_6",
        name: "Rada Cấp 6",
        price: 1500000000,
        description: "Tăng cực nhiều EXP và sức mạnh nhận được (+130%)",
        type: "radar",
        boost: 2.3,
        emoji: "📡",
        requiredPower: 5000000
    },
    RADAR_7: {
        id: "radar_7",
        name: "Rada Cấp 7",
        price: 3000000000,
        description: "Tăng khổng lồ EXP và sức mạnh nhận được (+160%)",
        type: "radar",
        boost: 2.6,
        emoji: "📡",
        requiredPower: 10000000
    },
    RADAR_8: {
        id: "radar_8",
        name: "Rada Cấp 8",
        price: 6000000000,
        description: "Tăng kinh khủng EXP và sức mạnh nhận được (+200%)",
        type: "radar",
        boost: 3.0,
        emoji: "📡",
        requiredPower: 50000000
    },
    RADAR_9: {
        id: "radar_9",
        name: "Rada Cấp 9",
        price: 10000000000,
        description: "Tăng thần thánh EXP và sức mạnh nhận được (+250%)",
        type: "radar",
        boost: 3.5,
        emoji: "📡",
        requiredPower: 100000000
    }
};

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
function validatePlayerQuests(player) {
    if (!player.quests) {
        player.quests = {
            active: [],
            completed: [],
            progress: {}
        };
    }

    for (const questId in player.quests.progress) {
        if (!QUESTS[questId]) {
            delete player.quests.progress[questId];
        }
    }

    player.quests.active = player.quests.active.filter(questId => QUESTS[questId]);

    player.quests.completed = player.quests.completed.filter(questId => QUESTS[questId]);

    if (player.quests.active.length === 0) {
        const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
        if (planetQuests && planetQuests.length > player.quests.completed.length) {
            const nextQuestId = planetQuests[player.quests.completed.length];
            if (QUESTS[nextQuestId]) {
                player.quests.active.push(nextQuestId);
                player.quests.progress[nextQuestId] = 0;
            }
        }
    }
}
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
    }
};
const QUEST_TYPES = {
    COMBAT: "combat",
    POWER: "power",
    TRAINING: "training",
    COLLECT: "collect",
    MASTER: "master",
    TOURNAMENT: "tournament"
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
        "BASIC_TRAINING",
        
        "EARTH_WOLF",
        "EARTH_SAIBAMEN",
        "DRAGON_BALL_1",
        
        "POWER_LV1",
        "EARTH_RED_RIBBON",
        
        "EARTH_TAMBOURINE",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",
        
        "EARTH_ANDROID19",
        "EARTH_ANDROID18",
        "TOURNAMENT_TENKAICHI",
        
        "EARTH_CELL_JR",
        "EARTH_PERFECT_CELL",
        
        "POWER_LV3",
        "EARTH_DABURA",
        "EARTH_BABIDI",
        "TOURNAMENT_CELL",
        
        "EARTH_SUPER_BUU",
        "EARTH_KID_BUU",
        "TOURNAMENT_UNIVERSE",
        
        "EARTH_COLLECT_ULTIMATE",
        "DRAGON_BALL_ALL"
    ],
    NAMEK: [
        // Khởi động
        "BEGINNER_1",
        "BEGINNER_2",
        "BASIC_TRAINING",
        
        // Khám phá Namek
        "NAMEK_VILLAGER",
        "NAMEK_APPULE",
        "NAMEK_SOLDIER",
        "DRAGON_BALL_1",
        
        // Tăng cường lực lượng
        "POWER_LV1",
        "NAMEK_WARRIOR",
        
        // Đội Đặc Nhiệm Ginyu
        "NAMEK_GULDO",
        "NAMEK_DODORIA",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",
        
        // Đối đầu tinh nhuệ Ginyu
        "NAMEK_RECOOME",
        "NAMEK_BURTER_JEICE",
        "NAMEK_ZARBON",
        "TOURNAMENT_TENKAICHI",
        
        // Trưởng đội Ginyu
        "NAMEK_GINYU",
        "NAMEK_GINYU_CAPTAIN",
        
        // Đại chiến Frieza
        "NAMEK_FRIEZA_1",
        "NAMEK_FRIEZA_2",
        "NAMEK_FRIEZA_3",
        "NAMEK_FRIEZA_FINAL",
        
        // Hậu chiến
        "TOURNAMENT_UNIVERSE",
        "NAMEK_BOSS",
        "DRAGON_BALL_ALL"
    ],
    SAIYAN: [
        // Khởi nghiệp
        "BEGINNER_1",
        "BEGINNER_2",
        "BASIC_TRAINING",
        
        // Xâm lược Saiyan
        "SAIYAN_RADITZ",
        "SAIYAN_NAPPA",
        "SAIYAN_BOSS",
        "DRAGON_BALL_1",
        
        // Luyện tập cấp độ
        "POWER_LV1",
        "SAIYAN_WARRIOR",
        
        // Thách thức tinh nhuệ
        "SAIYAN_ELITE",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",
        
        // Siêu Saiyan huyền thoại
        "SAIYAN_TURLES",
        "TOURNAMENT_TENKAICHI",
        
        // Đỉnh cao sức mạnh
        "TOURNAMENT_UNIVERSE",
        "SAIYAN_BROLY",
        "DRAGON_BALL_ALL"
    ]
};


const SPECIAL_ITEMS = {
    CELL_CORE: {
        id: "cell_core",
        name: "Nhân Cell",
        description: "Nhân tế bào của Cell, tăng sức mạnh khi sử dụng",
        effect: "power_boost",
        boost: 1000000
    },
    BUU_CANDY: {
        id: "buu_candy",
        name: "Kẹo Buu",
        description: "Kẹo ma thuật của Buu, hồi phục toàn bộ HP và Ki",
        effect: "full_restore"
    },
    BROLY_DISCIPLE: {
        id: "broly_disciple",
        name: "Đệ Tử Broly",
        description: "Đệ tử của Broly, có thể dùng để hợp thể thành Super Legendary Warrior",
        effect: "fusion",
        power_multiplier: 5.0,
        ki_multiplier: 4.0,
        hp_multiplier: 5.0,
        damage_multiplier: 6.0
    }
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
            },
    "TOURNAMENT_BEGINNER": {
        id: "TOURNAMENT_BEGINNER",
        name: "Tham Gia Giải Đấu Sơ Cấp",
        description: "Đạt top 8 trong Giải Đấu Thiên Hạ",
        type: "TOURNAMENT",
        target: 1,
        reward: {
            exp: 100000,
            zeni: 50000,
            description: "100,000 EXP, 50,000 Zeni"
        }
    },
    EARTH_ANDROID18: {
        id: "EARTH_ANDROID18",
        name: "Cỗ máy sát thủ",
        description: "Đánh bại Android 18",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "android18",
        reward: {
            exp: 10000,
            zeni: 12000,
            item: "crystal",
            quantity: 2,
            description: "10000 EXP, 12000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
        
    },
    EARTH_PERFECT_CELL: {
        id: "EARTH_PERFECT_CELL",
        name: "Khủng hoảng Cell",
        description: "Đánh bại Perfect Cell",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "perfect_cell",
        reward: {
            exp: 20000,
            zeni: 25000,
            item: "armor",
            quantity: 1,
            description: "20000 EXP, 25000 Zeni, 1 Áo Giáp Saiyan"
        },
        
    },
    EARTH_DABURA: {
        id: "EARTH_DABURA",
        name: "Vua Ma Quỷ",
        description: "Đánh bại Dabura, Vua Ma Quỷ",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "dabura",
        reward: {
            exp: 30000,
            zeni: 35000,
            item: "crystal",
            quantity: 3,
            description: "30000 EXP, 35000 Zeni, 3 Tinh Thể Sức Mạnh"
        },
        
    },
    EARTH_BABIDI: {
        id: "EARTH_BABIDI",
        name: "Phù Thủy Ác Độc",
        description: "Đánh bại Babidi, phù thủy triệu hồi Majin Buu",
        type: QUEST_TYPES.COMBAT, 
        target: 1,
        monster: "babidi",
        reward: {
            exp: 40000,
            zeni: 45000,
            item: "senzu",
            quantity: 5,
            description: "40000 EXP, 45000 Zeni, 5 Đậu Thần"
        },
        
    },
    EARTH_SUPER_BUU: {
        id: "EARTH_SUPER_BUU",
        name: "Ma Buu Hắc Ám",
        description: "Đánh bại Super Buu, kẻ hủy diệt vũ trụ",
        type: QUEST_TYPES.COMBAT,
        target: 1, 
        monster: "super_buu",
        reward: {
            exp: 60000,
            zeni: 60000,
            item: "crystal",
            quantity: 5,
            description: "60000 EXP, 60000 Zeni, 5 Tinh Thể Sức Mạnh"
        },
        
    },
    EARTH_KID_BUU: {
        id: "EARTH_KID_BUU",
        name: "Thách Thức Cuối Cùng",
        description: "Đánh bại Kid Buu, hình thái nguyên thủy của Ma Buu",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "kid_buu",
        reward: {
            exp: 100000,
            zeni: 100000,
            item: "radar_3",
            quantity: 1,
            description: "100000 EXP, 100000 Zeni, 1 Rada Cấp 3"
        },
        
    },
    EARTH_COLLECT_ULTIMATE: {
        id: "EARTH_COLLECT_ULTIMATE",
        name: "Vũ Khí Tối Thượng",
        description: "Thu thập đủ 7 viên Ngọc Rồng",
        type: QUEST_TYPES.COLLECT,
        itemType: "dragonBall7",
        target: 7,
        reward: {
            exp: 120000,
            zeni: 150000,
            item: "crystal",
            quantity: 7,
            description: "120000 EXP, 150000 Zeni, 7 Tinh Thể Sức Mạnh"
        },
        
    },
    "TOURNAMENT_TENKAICHI": {
        id: "TOURNAMENT_TENKAICHI",
        name: "Vô Địch Giải Đấu Thiên Hạ",
        description: "Đạt top 4 trong Giải Đấu Thiên Hạ",
        type: "TOURNAMENT",
        target: 1,
        reward: {
            exp: 200000,
            zeni: 100000,
            description: "200,000 EXP, 100,000 Zeni"
        }
    },
    "TOURNAMENT_CELL": {
        id: "TOURNAMENT_CELL",
        name: "Vô Địch Cell Games",
        description: "Đạt top 2 trong Cell Games",
        type: "TOURNAMENT",
        target: 1,
        reward: {
            exp: 300000,
            zeni: 150000,
            description: "300,000 EXP, 150,000 Zeni"
        }
    },
    "TOURNAMENT_UNIVERSE": {
        id: "TOURNAMENT_UNIVERSE",
        name: "Vô Địch Giải Đấu Vũ Trụ",
        description: "Vô địch Giải Đấu Vũ Trụ",
        type: "TOURNAMENT",
        target: 1,
        reward: {
            exp: 500000,
            zeni: 250000,
            description: "500,000 EXP, 250,000 Zeni"
        }
    },
    EARTH_TAMBOURINE: {
        id: "EARTH_TAMBOURINE",
        name: "Thuộc hạ của Quỷ Vương",
        description: "Đánh bại Tambourine",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "Tàu bảy bảy",
        reward: {
            exp: 6000,
            zeni: 8000,
            item: "senzu",
            quantity: 3,
            description: "6000 EXP, 8000 Zeni, 3 Đậu Thần"
        },
        
    },
    EARTH_ANDROID19: {
        id: "EARTH_ANDROID19",
        name: "Cỗ máy hấp thụ",
        description: "Đánh bại Android 19",
        type: QUEST_TYPES.COMBAT,
        target: 1, 
        monster: "android19",
        reward: {
            exp: 9000,
            zeni: 15000,
            item: "crystal",
            quantity: 2,
            description: "9000 EXP, 15000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
        
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
        
    },
    NAMEK_VILLAGER: {
        id: "NAMEK_VILLAGER",
        name: "Giải cứu làng Namek",
        description: "Cứu 5 dân làng Namek khỏi quân đội Frieza",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "namek_villager",
        reward: {
            exp: 1000,
            zeni: 2000,
            description: "1000 EXP, 2000 Zeni"
        },
    },
    NAMEK_GULDO: {
        id: "NAMEK_GULDO",
        name: "Đối đầu với Guldo",
        description: "Đánh bại Guldo, thành viên Đội Đặc Nhiệm Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "guldo",
        reward: {
            exp: 3000,
            zeni: 4000,
            item: "crystal",
            quantity: 1,
            description: "3000 EXP, 4000 Zeni, 1 Tinh Thể Sức Mạnh"
        },
    },
    NAMEK_RECOOME: {
        id: "NAMEK_RECOOME",
        name: "Sức mạnh của Recoome",
        description: "Đánh bại Recoome, thành viên Đội Đặc Nhiệm Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "recoome",
        reward: {
            exp: 4000,
            zeni: 5000,
            item: "senzu",
            quantity: 2,
            description: "4000 EXP, 5000 Zeni, 2 Đậu Thần"
        },
    },
    NAMEK_BURTER_JEICE: {
        id: "NAMEK_BURTER_JEICE",
        name: "Bộ đôi tốc độ",
        description: "Đánh bại Burter và Jeice, thành viên Đội Đặc Nhiệm Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 2,
        monster: "burter",
        reward: {
            exp: 5000,
            zeni: 6000,
            item: "scouter",
            quantity: 1,
            description: "5000 EXP, 6000 Zeni, 1 Thiết bị đo sức mạnh"
        },
    },
    NAMEK_GINYU_CAPTAIN: {
        id: "NAMEK_GINYU_CAPTAIN",
        name: "Thủ lĩnh Ginyu",
        description: "Đánh bại Captain Ginyu, trưởng đội Đặc Nhiệm Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "captain_ginyu",
        reward: {
            exp: 7000,
            zeni: 8000,
            item: "crystal",
            quantity: 2,
            description: "7000 EXP, 8000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
    },
    NAMEK_FRIEZA_1: {
        id: "NAMEK_FRIEZA_1",
        name: "Đối đầu Frieza Dạng 1",
        description: "Chiến đấu với Frieza trong dạng đầu tiên của hắn",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_1",
        reward: {
            exp: 8000,
            zeni: 10000,
            item: "armor",
            quantity: 1,
            description: "8000 EXP, 10000 Zeni, 1 Áo Giáp Saiyan"
        },
    },
    NAMEK_FRIEZA_2: {
        id: "NAMEK_FRIEZA_2",
        name: "Frieza biến hình",
        description: "Đối mặt với Frieza trong dạng thứ hai",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_2",
        reward: {
            exp: 10000,
            zeni: 15000,
            item: "crystal",
            quantity: 2,
            description: "10000 EXP, 15000 Zeni, 2 Tinh Thể Sức Mạnh"
        },
    },
    NAMEK_FRIEZA_3: {
        id: "NAMEK_FRIEZA_3",
        name: "Nỗi ác mộng dạng ba",
        description: "Chiến đấu với Frieza trong dạng thứ ba",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_3",
        reward: {
            exp: 15000,
            zeni: 20000,
            item: "senzu",
            quantity: 3,
            description: "15000 EXP, 20000 Zeni, 3 Đậu Thần"
        },
    },
    NAMEK_FRIEZA_FINAL: {
        id: "NAMEK_FRIEZA_FINAL",
        name: "Trận chiến cuối cùng",
        description: "Đối đầu với Frieza trong dạng cuối cùng của hắn",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_final",
        reward: {
            exp: 25000,
            zeni: 30000,
            item: "radar",
            quantity: 1,
            description: "25000 EXP, 30000 Zeni, 1 Rada Dò Ngọc Rồng"
        },
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
                powerRequired: 10000000000,
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
                powerRequired: 500000000,
                description: "Năng lượng cơ thể chuyển đổi hoàn toàn, mắt đỏ ngầu",
                powerBonus: 5.0,
                kiBonus: 5.5,
                healthBonus: 4.5,
                damageBonus: 6.0
            },
            {
                name: "Dragon Clan Master",
                powerRequired: 5000000000,
                description: "Chưởng môn tộc Rồng, điều khiển phép thuật cổ đại",
                powerBonus: 7.0,
                kiBonus: 7.0,
                healthBonus: 6.0,
                damageBonus: 8.0
            },
            {
                name: "Porunga Vessel",
                powerRequired: 50000000000,
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

    vegeta: {
        name: "Vegeta",
        hp: 20000,
        power: 15000,
        exp: 3000,
        zeni: 2000,
        dropChance: 0.25,
        dropItem: "crystal",
        planet: "SAIYAN"
    },
    android18: {
        name: "Android 18",
        hp: 80000,
        power: 75000,
        exp: 1800,
        zeni: 1500,
        dropChance: 0.20,
        dropItem: "crystal",
        planet: "EARTH"
    },
    perfect_cell: {
        name: "Perfect Cell",
        hp: 150000,
        power: 120000,
        exp: 5000,
        zeni: 3000,
        dropChance: 0.25,
        dropItem: "crystal",
        planet: "EARTH"
    },
    dabura: {
        name: "Dabura",
        hp: 180000,
        power: 160000,
        exp: 8000,
        zeni: 5000,
        dropChance: 0.22,
        dropItem: "armor",
        planet: "EARTH"
    },
    babidi: {
        name: "Babidi",
        hp: 50000,
        power: 200000,
        exp: 10000,
        zeni: 8000,
        dropChance: 0.30,
        dropItem: "crystal",
        planet: "EARTH"
    },
    super_buu: {
        name: "Super Buu",
        hp: 300000,
        power: 250000,
        exp: 15000,
        zeni: 12000,
        dropChance: 0.35,
        dropItem: "senzu",
        planet: "EARTH"
    },
    kid_buu: {
        name: "Kid Buu",
        hp: 500000,
        power: 400000,
        exp: 30000,
        zeni: 20000,
        dropChance: 0.40,
        dropItem: "crystal",
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
        name: "Tàu bảy bảy",
        hp: 10000,
        power: 10000,
        exp: 800,
        zeni: 350,
        dropChance: 0.12,
        dropItem: "crystal",
        planet: "EARTH"
    },
    android19: {
        name: "Android 19",
        hp: 100000,
        power: 100000,
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
    appule: {
        name: "Appule",
        hp: 1500,
        power: 1000,
        exp: 300,
        zeni: 200,
        dropChance: 0.07,
        dropItem: "senzu",
        planet: "NAMEK"
    },
    namek_villager: {
        name: "Dân làng Namek",
        hp: 500,
        power: 400,
        exp: 100,
        zeni: 50,
        dropChance: 0.05,
        dropItem: "senzu",
        planet: "NAMEK" 
    },
    guldo: {
        name: "Guldo",
        hp: 8000,
        power: 7000, 
        exp: 1500,
        zeni: 800,
        dropChance: 0.15,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    recoome: {
        name: "Recoome",
        hp: 12000,
        power: 10000,
        exp: 2000,
        zeni: 1000,
        dropChance: 0.18,
        dropItem: "armor",
        planet: "NAMEK"
    },
    burter: {
        name: "Burter",
        hp: 13000,
        power: 11000,
        exp: 2200,
        zeni: 1100,
        dropChance: 0.18,
        dropItem: "scouter",
        planet: "NAMEK"
    },
    jeice: {
        name: "Jeice",
        hp: 13000,
        power: 11000,
        exp: 2200,
        zeni: 1100,
        dropChance: 0.18,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    captain_ginyu: {
        name: "Captain Ginyu",
        hp: 18000,
        power: 15000,
        exp: 3000,
        zeni: 1500,
        dropChance: 0.25,
        dropItem: "radar",
        planet: "NAMEK"
    },
    frieza_1: {
        name: "Frieza Dạng 1",
        hp: 25000,
        power: 20000,
        exp: 4000,
        zeni: 2500,
        dropChance: 0.30,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    frieza_2: {
        name: "Frieza Dạng 2",
        hp: 40000,
        power: 35000,
        exp: 6000,
        zeni: 4000,
        dropChance: 0.32,
        dropItem: "armor",
        planet: "NAMEK"
    },
    frieza_3: {
        name: "Frieza Dạng 3",
        hp: 60000,
        power: 50000,
        exp: 8000,
        zeni: 6000,
        dropChance: 0.35,
        dropItem: "crystal",
        planet: "NAMEK"
    },
    frieza_final: {
        name: "Frieza Dạng Cuối",
        hp: 100000,
        power: 85000,
        exp: 15000,
        zeni: 10000,
        dropChance: 0.40,
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
const MAX_EXP_STORAGE = 5000000000;
const UPGRADE_COSTS = {
    damage: (currentDamage) => {
        if (currentDamage < 100) return 100;
        if (currentDamage < 1000) return currentDamage * 5;
        if (currentDamage < 10000) return currentDamage * 8;
        if (currentDamage < 100000) return currentDamage * 12;
        if (currentDamage < 1000000) return currentDamage * 18;
        return currentDamage * 25;
    },
    ki: (currentKi) => {
        if (currentKi < 100) return 120;
        if (currentKi < 1000) return currentKi * 5;
        if (currentKi < 10000) return currentKi * 8;
        if (currentKi < 100000) return currentKi * 12;
        if (currentKi < 1000000) return currentKi * 18;
        return currentKi * 25;
    },
    health: (currentHealth) => {
        if (currentHealth < 500) return 80;
        if (currentHealth < 5000) return currentHealth * 0.8;
        if (currentHealth < 50000) return currentHealth * 1.2;
        if (currentHealth < 500000) return currentHealth * 1.8;
        if (currentHealth < 5000000) return currentHealth * 2.5;
        return currentHealth * 3.5;
    }
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
const WORLD_LOCATIONS = {
    EARTH: [
        { id: "kame_house", name: "Kame House", description: "Nhà của Quy Lão, nơi tập luyện của Goku và Krillin" },
        { id: "capsule_corp", name: "Capsule Corporation", description: "Trụ sở công ty Capsule do gia đình Bulma sở hữu" },
        { id: "tournament_arena", name: "Đấu Trường Thiên Hạ", description: "Nơi tổ chức Đại Hội Võ Thuật Thiên Hạ" },
        { id: "korin_tower", name: "Tháp Korin", description: "Ngôi tháp cao nơi mèo thần Korin ở" },
        { id: "kami_lookout", name: "Khu Vực Canh Gác Của Thần", description: "Nơi ở của Thần Địa Cầu" }
    ],
    NAMEK: [
        { id: "guru_house", name: "Nhà Của Đại Trưởng Lão", description: "Nơi ở của Đại Trưởng Lão Namek" },
        { id: "porunga_summoning", name: "Bãi Triệu Hồi Porunga", description: "Vùng đất thiêng để triệu hồi Rồng Thần Porunga" },
        { id: "frieza_spaceship", name: "Tàu Vũ Trụ Frieza", description: "Căn cứ của Frieza trên Namek" },
        { id: "namek_village", name: "Làng Namek", description: "Ngôi làng của người Namek" },
        { id: "namek_battlefield", name: "Chiến Trường Namek", description: "Nơi diễn ra trận chiến giữa Goku và Frieza" }
    ],
    SAIYAN: [
        { id: "vegeta_palace", name: "Cung Điện Vegeta", description: "Cung điện hoàng gia của tộc Saiyan" },
        { id: "saiyan_training", name: "Khu Vực Huấn Luyện", description: "Nơi các chiến binh Saiyan tập luyện" },
        { id: "planet_core", name: "Lõi Hành Tinh", description: "Trung tâm hành tinh với năng lượng dồi dào" },
        { id: "royal_garden", name: "Vườn Hoàng Gia", description: "Khu vườn của Hoàng tộc Saiyan" },
        { id: "space_pod_station", name: "Trạm Vũ Trụ", description: "Nơi xuất phát các phi thuyền Saiyan" }
    ]
};

// Boss system
const BOSS_SYSTEM = {
    activeEvents: {},
    bossList: {
        EARTH: [
            {
                id: "king_piccolo",
                name: "Đại Ma Vương Piccolo",
                description: "Ma vương của Địa Cầu, từng suýt hủy diệt thế giới",
                power: 1500000,
                health: 5000000,
                damage: 250000,
                ki: 500000,
                skills: ["SPECIAL_BEAM_CANNON", "HELLZONE_GRENADE", "NAMEK_FUSION"],
                drops: [
                    { item: "turtle_gi", chance: 0.5 },
                    { item: "crystal", chance: 0.7, quantity: 3 },
                    { item: "senzu", chance: 1.0, quantity: 5 }
                ],
                minPowerRequired: 500000,
                zeniReward: { min: 500000, max: 1000000 },
                expReward: 200000,
                image: "https://imgur.com/2AtrNjL.jpg", // Replace with actual image
                spawnChance: 0.3,
                duration: 3600000 // 1 hour in milliseconds
            },
            {
                id: "cell",
                name: "Cell Hoàn Hảo",
                description: "Sinh vật nhân tạo hoàn hảo do tiến sĩ Gero tạo ra",
                power: 5000000,
                health: 15000000,
                damage: 750000,
                ki: 1000000,
                skills: ["KAMEHAMEHA", "SOLAR_FLARE", "SPIRIT_BOMB", "REGENERATION"],
                drops: [
                    { item: "weighted_clothing", chance: 0.4 },
                    { item: "crystal", chance: 0.8, quantity: 5 },
                    { item: "senzu", chance: 1.0, quantity: 10 }
                ],
                minPowerRequired: 2000000,
                zeniReward: { min: 1000000, max: 3000000 },
                expReward: 500000,
                image: "https://imgur.com/0cbG1R1.jpg", // Replace with actual image
                spawnChance: 0.15,
                duration: 7200000 // 2 hours in milliseconds
            }
        ],
        NAMEK: [
            {
                id: "frieza",
                name: "Frieza Dạng Cuối",
                description: "Hoàng đế vũ trụ tàn bạo, người đã hủy diệt hành tinh Vegeta",
                power: 3000000,
                health: 10000000,
                damage: 500000,
                ki: 800000,
                skills: ["DEATH_BEAM", "SUPERNOVA", "BIND"],
                drops: [
                    { item: "frieza_force_armor", chance: 0.3 },
                    { item: "crystal", chance: 0.8, quantity: 4 },
                    { item: "senzu", chance: 1.0, quantity: 8 }
                ],
                minPowerRequired: 1000000,
                zeniReward: { min: 800000, max: 2000000 },
                expReward: 300000,
                image: "https://imgur.com/mC4n7UV.jpg", // Replace with actual image
                spawnChance: 0.2,
                duration: 5400000 // 1.5 hours in milliseconds
            },
            {
                id: "cooler",
                name: "Cooler Dạng Thứ 5",
                description: "Anh trai của Frieza, mạnh hơn em trai mình",
                power: 6000000,
                health: 18000000,
                damage: 900000,
                ki: 1200000,
                skills: ["SUPERNOVA", "DEATH_FLASH", "ENERGY_SHIELD"],
                drops: [
                    { item: "elder_robe", chance: 0.4 },
                    { item: "crystal", chance: 0.8, quantity: 6 },
                    { item: "senzu", chance: 1.0, quantity: 12 }
                ],
                minPowerRequired: 3000000,
                zeniReward: { min: 1500000, max: 4000000 },
                expReward: 600000,
                image: "https://imgur.com/Dogn2Gk.jpg", // Replace with actual image
                spawnChance: 0.1,
                duration: 7200000 // 2 hours in milliseconds
            }
        ],
        SAIYAN: [
            {
                id: "broly",
                name: "Broly Super Saiyan Huyền Thoại",
                description: "Super Saiyan huyền thoại, sinh ra với sức mạnh kinh khủng",
                power: 8000000,
                health: 25000000,
                damage: 1200000,
                ki: 1500000,
                skills: ["GIGANTIC_METEOR", "ERASER_CANNON", "ENERGY_SHIELD"],
                drops: [
                    { item: "royal_armor", chance: 0.3 },
                    { item: "royal_boots", chance: 0.3 },
                    { item: "crystal", chance: 0.9, quantity: 8 },
                    { item: "senzu", chance: 1.0, quantity: 15 }
                ],
                minPowerRequired: 4000000,
                zeniReward: { min: 3000000, max: 6000000 },
                expReward: 800000,
                image: "https://imgur.com/PYh6JPh.jpg", // Replace with actual image
                spawnChance: 0.1,
                duration: 10800000 // 3 hours in milliseconds
            },
            {
                id: "beerus",
                name: "Thần Hủy Diệt Beerus",
                description: "Vị thần hủy diệt của vũ trụ 7, luôn tìm kiếm thức ăn ngon",
                power: 20000000,
                health: 50000000,
                damage: 3000000,
                ki: 5000000,
                skills: ["HAKAI", "GOD_BLAST", "ENERGY_SHIELD"],
                drops: [
                    { item: "radar_8", chance: 0.2 },
                    { item: "crystal", chance: 1.0, quantity: 15 },
                    { item: "senzu", chance: 1.0, quantity: 25 }
                ],
                minPowerRequired: 10000000,
                zeniReward: { min: 5000000, max: 15000000 },
                expReward: 2000000,
                image: "https://imgur.com/wahYEk1.jpg", // Replace with actual image
                spawnChance: 0.05,
                duration: 14400000 // 4 hours in milliseconds
            }
        ]
    },

    // Check for boss events
    checkForBossEvents() {
        const now = Date.now();

        // First cleanup expired events
        Object.keys(this.activeEvents).forEach(eventId => {
            const event = this.activeEvents[eventId];
            if (now > event.expireTime) {
                console.log(`Boss event expired: ${event.boss.name} at ${event.location.name}`);
                delete this.activeEvents[eventId];
            }
        });

        // Only spawn new bosses if we don't have too many active
        if (Object.keys(this.activeEvents).length >= 3) {
            return;
        }

        // Check chance to spawn a new boss for each planet
        Object.keys(PLANETS).forEach(planet => {
            const locationList = WORLD_LOCATIONS[planet];
            const bossList = this.bossList[planet];

            if (!locationList || !bossList) return;

            // Only spawn if random chance met (10% chance per check)
            if (Math.random() > 0.1) return;

            // Pick a random boss and location
            const randomBoss = bossList[Math.floor(Math.random() * bossList.length)];
            const randomLocation = locationList[Math.floor(Math.random() * locationList.length)];

            // Check if this boss should spawn based on its own spawn chance
            if (Math.random() > randomBoss.spawnChance) return;

            // Create unique event ID
            const eventId = `${planet}_${randomBoss.id}_${now}`;

            // Create the event
            this.activeEvents[eventId] = {
                id: eventId,
                planet: planet,
                location: randomLocation,
                boss: randomBoss,
                participants: {},
                damageDealt: {},
                spawnTime: now,
                expireTime: now + randomBoss.duration,
                defeated: false
            };

            console.log(`New boss spawned: ${randomBoss.name} at ${randomLocation.name} on ${planet}`);
        });
    },

    // Get all active boss events
    getActiveEvents() {
        return this.activeEvents;
    },

    // Get boss events for a specific planet
    getPlanetEvents(planet) {
        const events = {};
        Object.keys(this.activeEvents).forEach(eventId => {
            if (this.activeEvents[eventId].planet === planet) {
                events[eventId] = this.activeEvents[eventId];
            }
        });
        return events;
    },

    // Register damage dealt to a boss
    registerDamage(eventId, playerId, playerName, damageAmount) {
        if (!this.activeEvents[eventId]) return false;

        const event = this.activeEvents[eventId];

        // Register participant if not already
        if (!event.participants[playerId]) {
            event.participants[playerId] = {
                id: playerId,
                name: playerName,
                joinTime: Date.now()
            };
        }

        // Add damage
        if (!event.damageDealt[playerId]) {
            event.damageDealt[playerId] = 0;
        }
        event.damageDealt[playerId] += damageAmount;

        // Check if boss is defeated
        const totalDamage = Object.values(event.damageDealt).reduce((sum, damage) => sum + damage, 0);
        if (totalDamage >= event.boss.health && !event.defeated) {
            event.defeated = true;
            event.defeatTime = Date.now();
            console.log(`Boss defeated: ${event.boss.name} at ${event.location.name}`);
        }

        return event.defeated;
    },

    // Get rewards for a player based on their contribution
    getPlayerRewards(eventId, playerId) {
        if (!this.activeEvents[eventId] || !this.activeEvents[eventId].defeated) {
            return null;
        }

        const event = this.activeEvents[eventId];
        if (!event.damageDealt[playerId]) {
            return null;
        }

        const totalDamage = Object.values(event.damageDealt).reduce((sum, damage) => sum + damage, 0);
        const contributionRatio = event.damageDealt[playerId] / totalDamage;

        // Calculate rewards based on contribution
        const zeniBase = event.boss.zeniReward.min + Math.random() * (event.boss.zeniReward.max - event.boss.zeniReward.min);
        const zeniReward = Math.floor(zeniBase * contributionRatio);
        const expReward = Math.floor(event.boss.expReward * contributionRatio);

        // Calculate drops
        const drops = [];
        event.boss.drops.forEach(drop => {
            // Adjust drop chance based on contribution (higher contribution = better chance)
            const adjustedChance = drop.chance * (0.5 + 0.5 * contributionRatio);
            if (Math.random() < adjustedChance) {
                drops.push({
                    item: drop.item,
                    quantity: drop.quantity || 1
                });
            }
        });

        return {
            zeni: zeniReward,
            exp: expReward,
            drops: drops,
            contribution: contributionRatio
        };
    },

    // Load boss data from saved file
    loadBossData() {
        try {
            const bossDataPath = path.join(__dirname, "json", "dragonball", "boss_events.json");
            if (fs.existsSync(bossDataPath)) {
                const data = JSON.parse(fs.readFileSync(bossDataPath, "utf8"));
                // Only restore active events that haven't expired
                const now = Date.now();
                Object.keys(data).forEach(eventId => {
                    if (now < data[eventId].expireTime && !data[eventId].defeated) {
                        this.activeEvents[eventId] = data[eventId];
                    }
                });
            }
        } catch (error) {
            console.error("Error loading boss data:", error);
        }
    },

    // Save boss data
    saveBossData() {
        try {
            const bossDataPath = path.join(__dirname, "json", "dragonball", "boss_events.json");
            fs.writeFileSync(bossDataPath, JSON.stringify(this.activeEvents, null, 2));
        } catch (error) {
            console.error("Error saving boss data:", error);
        }
    }
};
function checkBossSchedule() {
    const now = Date.now();
    const activeBosses = BOSS_SYSTEM.getActiveEvents();

    // Check and remove expired bosses
    Object.entries(activeBosses).forEach(([eventId, event]) => {
        if (now > event.expireTime || event.defeated) {
            delete BOSS_SYSTEM.activeEvents[eventId];
        }
    });

    // Spawn new bosses if needed
    if (Object.keys(BOSS_SYSTEM.activeEvents).length < 3) {
        BOSS_SYSTEM.checkForBossEvents();
    }

    // Save updated boss data
    BOSS_SYSTEM.saveBossData();
}
function startTournament(type, organizer, playerData) {
    const tournamentData = loadTournamentData();

    if (tournamentData.active) {
        return {
            success: false,
            message: "Đã có giải đấu đang diễn ra!"
        };
    }

    const registeredPlayers = Object.keys(tournamentData.registrations).length;
    const tournamentConfig = TOURNAMENT_TYPES[type];

    if (registeredPlayers < tournamentConfig.minPlayers) {
        return {
            success: false,
            message: `Cần ít nhất ${tournamentConfig.minPlayers} người chơi để bắt đầu!`
        };
    }

    tournamentData.active = {
        type: type,
        startTime: Date.now(),
        organizer: organizer,
        currentRound: 1,
        matches: [],
        rounds: [],
        winners: {
            first: null,
            second: null,
            semifinalists: []
        }
    };

    // Create tournament bracket
    const players = Object.keys(tournamentData.registrations)
        .map(id => ({
            id: id,
            name: playerData[id].name,
            power: playerData[id].stats.power
        }));

    // Shuffle players
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }

    // Create first round matches
    tournamentData.active.rounds[1] = [];
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            const match = {
                id: Math.floor(i / 2) + 1,
                round: 1,
                player1: players[i],
                player2: players[i + 1],
                winner: null,
                loser: null,
                completed: false,
                scheduledTime: Date.now() + (Math.floor(i / 2) + 1) * 300000
            };
            tournamentData.active.rounds[1].push(match);
            tournamentData.active.matches.push(match);
        }
    }

    saveTournamentData(tournamentData);

    return {
        success: true,
        message: "Giải đấu đã bắt đầu!",
        matches: tournamentData.active.rounds[1]
    };
}
function applyEquipmentBoosts(player) {
    // Thêm định nghĩa boostMultipliers
    const boostMultipliers = {
        damage: 1.0,
        health: 1.0,
        ki: 1.0
    };

    // Reset stats to base values first
    if (!player.baseStats) {
        player.baseStats = {
            damage: player.stats.damage,
            health: player.stats.health,
            ki: player.stats.ki
        };
    } else {
        player.stats.damage = player.baseStats.damage;
        player.stats.health = player.baseStats.health;
        player.stats.ki = player.baseStats.ki;
    }

    // Apply equipment boosts
    if (player.inventory?.items) {
        player.inventory.items.forEach(item => {
            if (item.equipped) {
                switch (item.type) {
                    case "armor":
                        boostMultipliers.health *= item.boost;
                        break;

                    case "gloves":
                        boostMultipliers.damage *= item.boost;
                        break;

                    case "boots":
                        boostMultipliers.ki *= item.boost;
                        break;

                    case "radar":
                        // Rada effects are handled separately during training
                        break;
                }
            }
        });
    }

    if (!player.baseStats) {
        player.baseStats = {
            damage: player.stats.damage,
            health: player.stats.health,
            ki: player.stats.ki
        };
    }

    player.stats.damage = Math.floor(player.baseStats.damage * boostMultipliers.damage);
    player.stats.health = Math.floor(player.baseStats.health * boostMultipliers.health);
    player.stats.ki = Math.floor(player.baseStats.ki * boostMultipliers.ki);

    player.stats.currentHealth = Math.min(
        player.stats.currentHealth || player.stats.health,
        player.stats.health
    );
    player.stats.currentKi = Math.min(
        player.stats.currentKi || player.stats.ki,
        player.stats.ki
    );

    return player;
}
function simulateBattle(attacker, defender, options = {}) {
    const {
        battleType = "PVP",
        maxTurns = 30,
        isPlayerAttacker = true,
        isPlayerDefender = true,
    } = options;

    let enemyDamage;
    if (options.bossMode) {

        enemyDamage = defender.stats.damage;
    } else {

        enemyDamage = Math.floor(defender.stats.power / 20);
    }

    const battleContext = {
        turn: 0,
        momentum: 0,
        criticalMoment: false,
        environmentEffects: [],
        battleStartTime: Date.now()
    };


    let attackerHP = isPlayerAttacker ?
        (attacker.stats.currentHealth || attacker.stats.health || 1000) :
        (defender.hp || defender.stats?.health || 1000);

    let attackerMaxHP = isPlayerAttacker ?
        (attacker.stats.health || 1000) :
        (defender.hp || defender.stats?.health || 1000);

    let attackerKi = isPlayerAttacker ?
        (attacker.stats.currentKi || attacker.stats.ki || 100) :
        (defender.ki || defender.stats?.ki || 100);

    let attackerDamage = isPlayerAttacker ?
        (attacker.stats.damage || 100) :
        (defender.power ? Math.floor(defender.power / 10) : 100);

    let defenderHP = isPlayerDefender ?
        (defender.stats.currentHealth || defender.stats.health || 1000) :
        (defender.hp || defender.stats?.health || 1000);

    let defenderMaxHP = isPlayerDefender ?
        (defender.stats.health || 1000) :
        (defender.hp || defender.stats?.health || 1000);

    let defenderKi = isPlayerDefender ?
        (defender.stats.currentKi || defender.stats.ki || 100) :
        (defender.ki || defender.stats?.ki || 100);

    let defenderDamage = isPlayerDefender ?
        (defender.stats.damage || 100) :
        (defender.power ? Math.floor(defender.power / 10) : 100);


    attackerHP = Number(attackerHP) || 1000;
    attackerMaxHP = Number(attackerMaxHP) || 1000;
    attackerKi = Number(attackerKi) || 100;
    attackerDamage = Number(attackerDamage) || 100;
    defenderHP = Number(defenderHP) || 1000;
    defenderMaxHP = Number(defenderMaxHP) || 1000;
    defenderKi = Number(defenderKi) || 100;
    defenderDamage = Number(defenderDamage) || 100;


    const originalAttackerKi = attackerKi;
    const originalDefenderKi = defenderKi;
    const initialAttackerHP = attackerHP;
    const initialDefenderHP = defenderHP;


    if (isPlayerAttacker && attacker.inventory?.items) {
        attacker.inventory.items.filter(item => item.equipped).forEach(item => {
            if (item.id === "tournament_belt") attackerDamage *= 1.3;
            if (item.id === "cell_medal") {
                attackerHP *= 1.3;
                attackerKi *= 1.3;
            }
            if (item.id === "universe_medal") {
                attackerHP *= 1.5;
                attackerKi *= 1.5;
                attackerDamage *= 1.5;
            }
            if (item.id === "armor") {
                attackerHP *= 1.15;
            }
            if (item.id === "scouter") {
                attackerDamage *= 1.1;
            }
        });
    }

    if (isPlayerDefender && defender.inventory?.items) {
        defender.inventory.items.filter(item => item.equipped).forEach(item => {
            if (item.id === "tournament_belt") defenderDamage *= 1.3;
            if (item.id === "cell_medal") {
                defenderHP *= 1.3;
                defenderKi *= 1.3;
            }
            if (item.id === "universe_medal") {
                defenderHP *= 1.5;
                defenderKi *= 1.5;
                defenderDamage *= 1.5;
            }
            if (item.id === "armor") {
                defenderHP *= 1.15;
            }
            if (item.id === "scouter") {
                defenderDamage *= 1.1;
            }
        });
    }


    let attackerStates = {
        stunned: 0,
        shielded: 0,
        bound: 0,
        powerBoosted: 0,
        powerBoostMultiplier: 1.0,
        greatApe: 0,
        vulnerable: 0,
        spiritBombCharge: 0,
        combo: 0,
        lastSkill: null
    };

    let defenderStates = {
        stunned: 0,
        shielded: 0,
        bound: 0,
        powerBoosted: 0,
        powerBoostMultiplier: 1.0,
        greatApe: 0,
        vulnerable: 0,
        spiritBombCharge: 0,
        combo: 0,
        lastSkill: null
    };


    let battleLog = [];
    const attackerName = isPlayerAttacker ? attacker.name : (attacker.name || "Quái vật");
    const defenderName = isPlayerDefender ? defender.name : (defender.name || "Quái vật");

    battleLog.push(`⚔️ ${attackerName} đấu với ${defenderName}!`);


    const battleId = Date.now().toString().slice(0, 10);
    const regenSkillsUsed = {};
    let turn = 0;
    let totalDamageDealt = { attacker: 0, defender: 0 };


    const getBattlePhase = (currentTurn, maxTurns) => {
        if (currentTurn <= Math.floor(maxTurns * 0.3)) return "EARLY";
        if (currentTurn <= Math.floor(maxTurns * 0.7)) return "MID";
        return "LATE";
    };

    const getCriticalHitChance = (combo, powerBoostMultiplier) => {
        return Math.min(0.05 + (combo * 0.03) + ((powerBoostMultiplier - 1) * 0.1), 0.5);
    };

    const getComboBonus = (combo) => {
        return 1 + Math.min(combo * 0.1, 0.5);
    };

    let attackerSkillCooldowns = {};
    let defenderSkillCooldowns = {};

    const CONTROL_SKILL_COOLDOWN = 5;
    const BIND_SKILL_COOLDOWN = 3;
    const SHIELD_SKILL_COOLDOWN = 4;
    const POWER_UP_COOLDOWN = 10;
    while (attackerHP > 0 && defenderHP > 0 && turn < maxTurns) {
        turn++;

        Object.keys(attackerSkillCooldowns).forEach(skill => {
            if (attackerSkillCooldowns[skill] > 0) attackerSkillCooldowns[skill]--;
        });

        Object.keys(defenderSkillCooldowns).forEach(skill => {
            if (defenderSkillCooldowns[skill] > 0) defenderSkillCooldowns[skill]--;
        });
        battleContext.turn = turn;


        const battlePhase = getBattlePhase(turn, maxTurns);
        const isAttackerCritical = attackerHP < attackerMaxHP * 0.3;
        const isDefenderCritical = defenderHP < defenderMaxHP * 0.3;


        battleContext.criticalMoment = turn % 5 === 0 || (Math.random() < 0.15);

        if (battleContext.criticalMoment) {
            battleLog.push(`⚡ Thời khắc quyết định! Sức mạnh tấn công tăng lên!`);
        }


        if (!attackerStates.stunned && !attackerStates.bound) {

            if (isPlayerAttacker && attacker.skills?.length > 0 && Math.random() < 0.78) {

                const skillChoice = selectBestSkill(
                    attacker,
                    attackerHP,
                    attackerKi,
                    defenderHP,
                    attackerStates,
                    defenderStates,
                    battleLog,
                    turn
                ) || attacker.skills[Math.floor(Math.random() * attacker.skills.length)];

                const [master, skillName] = skillChoice.split(":");
                const skillData = MASTERS[master]?.skills[skillName];

                if (skillData) {

                    if (skillName === "SPIRIT_BOMB" && turn < 25) {
                        const normalDamage = Math.floor(attackerDamage * 0.8);
                        defenderHP -= normalDamage;
                        totalDamageDealt.attacker += normalDamage;
                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                        battleLog.push(`💬 Quả Cầu Kinh Khí cần ít nhất 25 lượt để tích tụ đủ năng lượng!`);
                        continue;
                    }

                    const kiRequired = Math.floor(attackerKi * Math.abs(skillData.kiCost || 0));
                    const skillDamage = Math.floor(attackerDamage * (skillData.powerScale || 0));


                    const skillCheck = canUseSkill(
                        skillName,
                        skillData,
                        turn,
                        attackerHP,
                        attackerMaxHP,
                        attackerKi,
                        originalAttackerKi
                    );

                    if (!skillCheck.canUse) {
                        if (skillName === "SPIRIT_BOMB" && skillCheck.reason === "EARLY_TURN") {
                            const normalDamage = Math.floor(attackerDamage * 0.8);
                            defenderHP -= normalDamage;
                            totalDamageDealt.attacker += normalDamage;
                            battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                            battleLog.push(`💬 ${skillCheck.message}`);
                            continue;
                        }
                    }


                    if (attackerKi >= kiRequired || (skillData.kiCost || 0) < 0) {

                        if (skillData.powerScale > 0) {
                            attackerStates.combo += 1;


                            const comboBonus = getComboBonus(attackerStates.combo);


                            const critChance = getCriticalHitChance(attackerStates.combo, attackerStates.powerBoostMultiplier);
                            const isCritical = Math.random() < critChance || (battleContext.criticalMoment && Math.random() < 0.5);


                            let actualDamage = attackerStates.powerBoosted > 0
                                ? Math.floor(skillDamage * attackerStates.powerBoostMultiplier * comboBonus)
                                : Math.floor(skillDamage * comboBonus);

                            const maxDamagePercent = skillName === "SPIRIT_BOMB" || skillName === "CADICH_LIEN_HOAN_TRUONG" ||
                                skillName === "GREAT_APE" ? 0.5 : 0.3;
                            const maxDamage = Math.floor(defenderMaxHP * maxDamagePercent);

                            if (actualDamage > maxDamage) {
                                actualDamage = maxDamage;
                            }

                            if (isCritical) {
                                actualDamage = Math.floor(actualDamage * 1.5);
                            }


                            if (defenderStates.shielded > 0) {
                                battleLog.push(`🛡️ Khiên năng lượng của ${defenderName} đã chặn đòn tấn công!`);
                                defenderStates.shielded--;
                                attackerStates.combo = 0;
                            } else {
                                defenderHP -= actualDamage;
                                totalDamageDealt.attacker += actualDamage;


                                if (skillData.kiCost > 0) {
                                    attackerKi -= kiRequired;
                                }


                                let attackMessage = `🎯 ${attackerName} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!`;

                                if (attackerStates.combo > 1) {
                                    attackMessage += ` (Combo x${attackerStates.combo})`;
                                }

                                if (isCritical) {
                                    attackMessage += ` 💥 CHÍ MẠNG!`;
                                }

                                if (skillData.kiCost > 0) {
                                    attackMessage += `\n✨ -${kiRequired} Ki`;
                                }

                                battleLog.push(attackMessage);


                                if (actualDamage > defenderMaxHP * 0.2) {
                                    defenderStates.vulnerable = 1;
                                    battleLog.push(`⚠️ ${defenderName} đang trong trạng thái dễ bị tổn thương!`);
                                }
                            }
                        }
                        else if (skillData.kiCost < 0) {
                            const kiRestore = kiRequired;
                            attackerKi = Math.min(
                                isPlayerAttacker ? attacker.stats.ki : attackerKi * 2,
                                attackerKi + kiRestore
                            );
                            battleLog.push(`✨ ${attackerName} dùng ${skillData.name}, hồi phục ${kiRestore.toLocaleString()} Ki!`);


                            attackerStates.combo = 0;
                        }
                        else {

                            switch (skillName) {
                                case "SOLAR_FLARE":
                                case "HYPNOSIS":
                                    if (attackerSkillCooldowns[skillName] > 0) {
                                        battleLog.push(`❌ ${attackerName} không thể dùng ${skillName === "SOLAR_FLARE" ? "Thái Dương Hạ San" : "Thôi Miên"} (còn ${attackerSkillCooldowns[skillName]} lượt hồi)!`);
                                        const normalDamage = Math.floor(attackerDamage * 0.8);
                                        defenderHP -= normalDamage;
                                        totalDamageDealt.attacker += normalDamage;
                                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    } else {
                                        defenderStates.stunned = 2;
                                        attackerKi -= kiRequired;
                                        attackerSkillCooldowns[skillName] = CONTROL_SKILL_COOLDOWN;
                                        battleLog.push(`🌀 ${attackerName} dùng ${skillName === "SOLAR_FLARE" ? "Thái Dương Hạ San" : "Thôi Miên"}! ${defenderName} bị choáng trong 2 lượt!`);
                                        defenderStates.combo = 0;
                                    }
                                    break;
                                case "KAIOKEN":
                                    attackerSkillCooldowns[skillName] = POWER_UP_COOLDOWN;
                                    attackerStates.powerBoosted = 3;
                                    attackerStates.powerBoostMultiplier = 3.0;
                                    attackerKi -= kiRequired;
                                    battleLog.push(`🔥 ${attackerName} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                    break;

                                case "BIND":

                                    if (attackerSkillCooldowns["BIND"] > 0) {
                                        battleLog.push(`❌ ${attackerName} không thể dùng Trói (còn ${attackerSkillCooldowns["BIND"]} lượt hồi)!`);

                                        const normalDamage = Math.floor(attackerDamage * 0.8);
                                        defenderHP -= normalDamage;
                                        totalDamageDealt.attacker += normalDamage;
                                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    } else {

                                        defenderStates.bound = 2;
                                        attackerKi -= kiRequired;
                                        attackerSkillCooldowns["BIND"] = BIND_SKILL_COOLDOWN;
                                        battleLog.push(`🔗 ${attackerName} dùng Trói! ${defenderName} bị trói 2 lượt!`);
                                        defenderStates.combo = 0;
                                    }
                                    break;


                                case "ENERGY_SHIELD":
                                    const shieldDuration = 2;
                                    attackerStates.shielded = shieldDuration;
                                    attackerKi -= kiRequired;
                                    battleLog.push(`🛡️ ${attackerName} tạo Khiên Năng Lượng!`);
                                    break;

                                case "REGENERATION":
                                case "WHISTLE":
                                case "REGENERATE_ENERGY":
                                    if (regenSkillsUsed[battleId]) {
                                        battleLog.push(`❌ ${attackerName} đã sử dụng kỹ năng hồi phục trong trận này!`);


                                        const normalDamage = Math.floor(attackerDamage * 0.8);
                                        defenderHP -= normalDamage;
                                        totalDamageDealt.attacker += normalDamage;
                                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    } else {
                                        const hpRecover = Math.floor(attackerMaxHP * 0.3);
                                        const kiRecover = Math.floor(originalAttackerKi * 0.3);

                                        attackerHP = Math.min(attackerMaxHP, attackerHP + hpRecover);
                                        attackerKi = Math.min(originalAttackerKi, attackerKi + kiRecover);

                                        battleLog.push(`💚 ${attackerName} dùng kỹ năng hồi phục!`);
                                        battleLog.push(`❤️ Hồi phục ${hpRecover.toLocaleString()} HP`);
                                        battleLog.push(`✨ Hồi phục ${kiRecover.toLocaleString()} Ki`);

                                        regenSkillsUsed[battleId] = true;
                                        attackerStates.combo = 0;
                                    }
                                    break;

                                default:
                                    attackerKi -= kiRequired;
                                    battleLog.push(`⚡ ${attackerName} dùng ${skillData.name}!`);
                                    break;
                            }


                            attackerStates.lastSkill = skillName;
                        }
                    }
                    else {

                        const normalDamage = Math.floor(attackerDamage * 0.8);

                        if (defenderStates.shielded > 0) {
                            battleLog.push(`🛡️ Khiên năng lượng của ${defenderName} đã chặn đòn tấn công!`);
                            defenderStates.shielded--;
                        } else {
                            defenderHP -= normalDamage;
                            totalDamageDealt.attacker += normalDamage;
                            battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);


                            if (attackerStates.combo > 0) {
                                attackerStates.combo -= 1;
                            }
                        }
                    }
                }
                else {

                    const normalDamage = Math.floor(attackerDamage * 0.8);
                    defenderHP -= normalDamage;
                    totalDamageDealt.attacker += normalDamage;
                    battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);


                    if (attackerStates.combo > 0) {
                        attackerStates.combo -= 1;
                    }
                }
            }
            else {

                const normalDamage = attackerStates.powerBoosted > 0
                    ? Math.floor(attackerDamage * attackerStates.powerBoostMultiplier * 0.8)
                    : Math.floor(attackerDamage * 0.8);
                const maxNormalDamage = Math.floor(defenderMaxHP * 0.2);
                const limitedDamage = Math.min(normalDamage, maxNormalDamage);

                if (defenderStates.shielded > 0) {
                    battleLog.push(`🛡️ Khiên năng lượng của ${defenderName} đã chặn đòn tấn công thường!`);
                    defenderStates.shielded--;
                } else {
                    defenderHP -= limitedDamage;
                    totalDamageDealt.attacker += limitedDamage;
                    battleLog.push(`👊 ${attackerName} đấm thường gây ${limitedDamage.toLocaleString()} sát thương!`);

                    if (attackerStates.combo > 0) {
                        attackerStates.combo -= 1;
                    }
                }
            }
        }
        else if (attackerStates.stunned > 0) {
            battleLog.push(`😵 ${attackerName} đang bị choáng! Không thể hành động!`);
            attackerStates.stunned--;

            attackerStates.combo = 0;
        } else if (attackerStates.bound > 0) {
            battleLog.push(`🔗 ${attackerName} đang bị trói! Không thể hành động!`);
            attackerStates.bound--;

            attackerStates.combo = 0;
        }


        if (defenderHP <= 0) {
            battleLog.push(`💥 ${defenderName} đã bị đánh bại!`);
            break;
        }


        if (!defenderStates.stunned && !defenderStates.bound) {

            if (isPlayerDefender && defender.skills?.length > 0 && Math.random() < 0.78) {

                const skillChoice = selectBestSkill(
                    defender,
                    defenderHP,
                    defenderKi,
                    attackerHP,
                    defenderStates,
                    attackerStates,
                    battleLog,
                    turn
                ) || defender.skills[Math.floor(Math.random() * defender.skills.length)];

                const [master, skillName] = skillChoice.split(":");
                const skillData = MASTERS[master]?.skills[skillName];

                if (skillData) {
                    const skillDamage = Math.floor(defenderDamage * (skillData.powerScale || 0));
                    const kiRequired = Math.floor(defenderKi * Math.abs(skillData.kiCost || 0));

                    if (defenderKi >= kiRequired || (skillData.kiCost || 0) < 0) {

                        if (skillData.powerScale > 0) {
                            const actualDamage = defenderStates.powerBoosted > 0
                                ? Math.floor(skillDamage * defenderStates.powerBoostMultiplier)
                                : skillDamage;

                            if (attackerStates.shielded > 0) {
                                battleLog.push(`🛡️ Khiên năng lượng của ${attackerName} đã chặn đòn tấn công!`);
                                attackerStates.shielded--;
                            } else {
                                attackerHP -= actualDamage;
                                totalDamageDealt.defender += actualDamage;

                                if (skillData.kiCost > 0) defenderKi -= kiRequired;

                                battleLog.push(
                                    `🎯 ${defenderName} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                    (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                );
                            }
                        }
                        else if (skillData.kiCost < 0) {
                            const kiRestore = kiRequired;
                            defenderKi = Math.min(
                                isPlayerDefender ? defender.stats.ki : defenderKi * 2,
                                defenderKi + kiRestore
                            );
                            battleLog.push(`✨ ${defenderName} dùng ${skillData.name}, hồi phục ${kiRestore.toLocaleString()} Ki!`);
                        }
                        else {

                            switch (skillName) {
                                case "SOLAR_FLARE":
                                case "HYPNOSIS":
                                    if (attackerSkillCooldowns[skillName] > 0) {
                                        battleLog.push(`❌ ${attackerName} không thể dùng ${skillName === "SOLAR_FLARE" ? "Thái Dương Hạ San" : "Thôi Miên"} (còn ${attackerSkillCooldowns[skillName]} lượt hồi)!`);
                                        const normalDamage = Math.floor(attackerDamage * 0.8);
                                        defenderHP -= normalDamage;
                                        totalDamageDealt.attacker += normalDamage;
                                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    } else {
                                        defenderStates.stunned = 2;
                                        attackerKi -= kiRequired;
                                        attackerSkillCooldowns[skillName] = CONTROL_SKILL_COOLDOWN;
                                        battleLog.push(`🌀 ${attackerName} dùng ${skillName === "SOLAR_FLARE" ? "Thái Dương Hạ San" : "Thôi Miên"}! ${defenderName} bị choáng trong 2 lượt!`);
                                        defenderStates.combo = 0;
                                    }
                                    break;

                                case "KAIOKEN":
                                    defenderStates.powerBoosted = 3;
                                    defenderStates.powerBoostMultiplier = 3.0;
                                    defenderKi -= kiRequired;
                                    battleLog.push(`🔥 ${defenderName} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                    break;

                                case "BIND":

                                    if (attackerSkillCooldowns["BIND"] > 0) {
                                        battleLog.push(`❌ ${attackerName} không thể dùng Trói (còn ${attackerSkillCooldowns["BIND"]} lượt hồi)!`);

                                        const normalDamage = Math.floor(attackerDamage * 0.8);
                                        defenderHP -= normalDamage;
                                        totalDamageDealt.attacker += normalDamage;
                                        battleLog.push(`👊 ${attackerName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                    } else {

                                        defenderStates.bound = 2;
                                        attackerKi -= kiRequired;
                                        attackerSkillCooldowns["BIND"] = CONTROL_SKILL_COOLDOWN;
                                        battleLog.push(`🔗 ${attackerName} dùng Trói! ${defenderName} bị trói 2 lượt!`);
                                        defenderStates.combo = 0;
                                    }
                                    break;

                                case "ENERGY_SHIELD":
                                    attackerSkillCooldowns[skillName] = SHIELD_SKILL_COOLDOWN;
                                    const shieldDuration = 2;
                                    defenderStates.shielded = shieldDuration;
                                    defenderKi -= kiRequired;
                                    battleLog.push(`🛡️ ${defenderName} tạo Khiên Năng Lượng!`);
                                    break;

                                default:
                                    defenderKi -= kiRequired;
                                    battleLog.push(`⚡ ${defenderName} dùng ${skillData.name}!`);
                                    break;
                            }
                        }
                    } else {

                        const normalDamage = Math.floor(defenderDamage * 0.8);

                        if (attackerStates.shielded > 0) {
                            battleLog.push(`🛡️ Khiên năng lượng của ${attackerName} đã chặn đòn tấn công!`);
                            attackerStates.shielded--;
                        } else {
                            attackerHP -= normalDamage;
                            totalDamageDealt.defender += normalDamage;
                            battleLog.push(`👊 ${defenderName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                        }
                    }
                } else {

                    const normalDamage = Math.floor(defenderDamage * 0.8);
                    attackerHP -= normalDamage;
                    totalDamageDealt.defender += normalDamage;
                    battleLog.push(`👊 ${defenderName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                }
            }
            else if (options.battleType === "MONSTER" || options.battleType === "CAMP") {

                const monsterAttack = Math.floor(defenderDamage * (0.8 + Math.random() * 0.4));


                if (turn % 3 === 0 && Math.random() < 0.4) {
                    const specialAttack = Math.floor(defenderDamage * 1.5);

                    if (attackerStates.shielded > 0) {
                        battleLog.push(`🛡️ Khiên năng lượng của ${attackerName} đã chặn đòn tấn công đặc biệt!`);
                        attackerStates.shielded--;
                    } else {
                        attackerHP -= specialAttack;
                        totalDamageDealt.defender += specialAttack;
                        battleLog.push(`💥 ${defenderName} tung ra đòn tấn công đặc biệt! Gây ${specialAttack.toLocaleString()} sát thương!`);
                    }
                } else {
                    if (attackerStates.shielded > 0) {
                        battleLog.push(`🛡️ Khiên năng lượng của ${attackerName} đã chặn ${monsterAttack.toLocaleString()} sát thương!`);
                        attackerStates.shielded--;
                    } else {
                        attackerHP -= monsterAttack;
                        totalDamageDealt.defender += monsterAttack;
                        battleLog.push(`💥 ${defenderName} tấn công gây ${monsterAttack.toLocaleString()} sát thương!`);
                    }
                }
            } else {

                const normalDamage = defenderStates.powerBoosted > 0
                    ? Math.floor(defenderDamage * defenderStates.powerBoostMultiplier * 0.8)
                    : Math.floor(defenderDamage * 0.8);

                if (attackerStates.shielded > 0) {
                    battleLog.push(`🛡️ Khiên năng lượng của ${attackerName} đã chặn đòn tấn công thường!`);
                    attackerStates.shielded--;
                } else {
                    attackerHP -= normalDamage;
                    totalDamageDealt.defender += normalDamage;
                    battleLog.push(`👊 ${defenderName} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                }
            }
        }
        else if (defenderStates.stunned > 0) {
            battleLog.push(`😵 ${defenderName} đang bị choáng! Không thể hành động!`);
            defenderStates.stunned--;
            defenderStates.combo = 0;
        } else if (defenderStates.bound > 0) {
            battleLog.push(`🔗 ${defenderName} đang bị trói! Không thể hành động!`);
            defenderStates.bound--;
            defenderStates.combo = 0;
        }


        updateStates(attackerName, attackerStates, battleLog);
        updateStates(defenderName, defenderStates, battleLog);


        if (turn % 3 === 0) {
            const attackerHPPercent = (attackerHP / attackerMaxHP) * 100;
            const defenderHPPercent = (defenderHP / defenderMaxHP) * 100;

            if (attackerHPPercent > defenderHPPercent + 20) {
                battleContext.momentum = Math.min(battleContext.momentum + 1, 5);
                if (battleContext.momentum >= 3) {
                    battleLog.push(`⚡ ${attackerName} đang chiếm ưu thế trong trận đấu!`);
                }
            } else if (defenderHPPercent > attackerHPPercent + 20) {
                battleContext.momentum = Math.max(battleContext.momentum - 1, -5);
                if (battleContext.momentum <= -3) {
                    battleLog.push(`⚡ ${defenderName} đang chiếm ưu thế trong trận đấu!`);
                }
            }
        }


        if (turn === Math.floor(maxTurns / 2)) {
            battleLog.push(`🔥 Trận đấu đã đi qua nửa thời gian! Sức mạnh của cả hai đang trở nên kinh khủng!`);
        }

        if (turn === maxTurns - 5) {
            battleLog.push(`⏱️ Chỉ còn 5 lượt nữa trận đấu sẽ kết thúc! Hãy tập trung sức lực!`);
        }
    }


    let winner, loser;

    if (attackerHP <= 0 && defenderHP <= 0) {
        if (options.battleType === "MONSTER" || options.battleType === "CAMP") {
            winner = isPlayerAttacker ? attacker : defender;
            loser = isPlayerAttacker ? defender : attacker;
            battleLog.push(`⚔️ Trận đấu kết thúc với cả hai đều ngã xuống, ${winner.name} thắng do ra đòn cuối cùng!`);
        } else {
            winner = isPlayerAttacker ? attacker : defender;
            loser = isPlayerAttacker ? defender : attacker;
        }
    }
    else if (attackerHP <= 0) {
        winner = defender;
        loser = attacker;
    }
    else if (defenderHP <= 0) {
        winner = attacker;
        loser = defender;
    }
    else if (turn >= maxTurns) {
        const attackerHPPercent = attackerHP / attackerMaxHP;
        const defenderHPPercent = defenderHP / defenderMaxHP;

        if (attackerHPPercent > defenderHPPercent) {
            winner = attacker;
            loser = defender;
        } else {
            winner = defender;
            loser = attacker;
        }

        battleLog.push(`⏱️ Hết ${maxTurns} lượt! ${winner.name} giành chiến thắng với lượng HP còn lại nhiều hơn!`);
    }


    if (turn >= maxTurns) {
        battleLog.push(`🏁 Hết ${maxTurns} lượt! ${winner.name} giành chiến thắng!`);
    }


    let attackerKiRestored = attackerKi;
    let defenderKiRestored = defenderKi;

    if (isPlayerAttacker) {
        const kiLost = originalAttackerKi - attackerKi;
        attackerKiRestored = Math.min(originalAttackerKi, attackerKi + Math.floor(kiLost * 0.6));
    }

    if (isPlayerDefender) {
        const kiLost = originalDefenderKi - defenderKi;
        defenderKiRestored = Math.min(originalDefenderKi, defenderKi + Math.floor(kiLost * 0.6));
    }


    return {
        winner,
        loser,
        player1HP: Math.max(0, attackerHP),
        player2HP: Math.max(0, defenderHP),
        player1Ki: attackerKiRestored,
        player2Ki: defenderKiRestored,
        battleLog,
        isDraw: turn >= maxTurns && attackerHP > 0 && defenderHP > 0,
        turns: turn,
        totalDamage: totalDamageDealt,
        initialHP: {
            attacker: initialAttackerHP,
            defender: initialDefenderHP
        },
        battleStats: {
            duration: Date.now() - battleContext.battleStartTime,
            momentum: battleContext.momentum,
            maxCombo: Math.max(
                Math.max(...battleLog.filter(log => log.includes("Combo")).map(log => {
                    const match = log.match(/Combo x(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }), 0),
                0
            )
        }
    };
}

function findPlayerMatch(tournamentData, playerId) {
    if (!tournamentData?.active?.matches) return null;

    return tournamentData.active.matches.find(match => {
        const isPlayer =
            (match.player1?.id === playerId || match.player2?.id === playerId) &&
            !match.completed;

        const isScheduledTime = match.scheduledTime <= Date.now();

        return isPlayer && isScheduledTime;
    });
}

function isPlayerInTournament(tournamentData, playerId) {
    return !!tournamentData.registrations[playerId];
}

function getPlayerNextMatch(tournamentData, playerId) {
    if (!tournamentData?.active?.matches) return null;

    return tournamentData.active.matches.find(match => {
        const isPlayer = match.player1?.id === playerId || match.player2?.id === playerId;
        const isPending = !match.completed;
        return isPlayer && isPending;
    });
}

function getTournamentRoundInfo(match) {
    if (!match) return null;

    const roundNames = {
        1: "Vòng loại",
        2: "Vòng 1/16",
        3: "Vòng 1/8",
        4: "Tứ kết",
        5: "Bán kết",
        6: "Chung kết"
    };

    return {
        number: match.round,
        name: roundNames[match.round] || `Vòng ${match.round}`
    };
}
function updateStates(entityName, states, battleLog) {
    if (states.powerBoosted > 0) {
        states.powerBoosted--;
        if (states.powerBoosted === 0) {
            battleLog.push(`⚠️ Hiệu ứng Kaioken của ${entityName} đã hết!`);
            states.powerBoostMultiplier = 1.0;
        }
    }

    if (states.greatApe > 0) {
        states.greatApe--;
        if (states.greatApe === 0) {
            battleLog.push(`⚠️ ${entityName} đã trở lại hình dạng bình thường!`);
            states.powerBoostMultiplier = 1.0;
            states.powerBoosted = 0;
        }
    }

    if (states.shielded > 0) {
        states.shielded--;
        if (states.shielded === 0) {
            battleLog.push(`⚠️ Khiên năng lượng của ${entityName} đã biến mất!`);
        }
    }
}
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
function canUseSkill(skillName, skillData, currentTurn, playerHP, playerMaxHP, playerKi, playerMaxKi) {

    if (skillName === "SPIRIT_BOMB") {
        if (currentTurn < 25) {
            return {
                canUse: false,
                reason: "EARLY_TURN",
                message: "Quả Cầu Kinh Khí cần ít nhất 25 lượt để tích tụ đủ năng lượng!"
            };
        }

        if (playerKi < Math.floor(playerMaxKi * skillData.kiCost)) {
            return {
                canUse: false,
                reason: "KI_TOO_LOW",
                message: "Không đủ Ki để sử dụng Quả Cầu Kinh Khí!"
            };
        }

        return {
            canUse: true,
            reason: null
        };
    }

    return {
        canUse: playerKi >= Math.floor(playerMaxKi * (skillData.kiCost || 0)),
        reason: playerKi < Math.floor(playerMaxKi * (skillData.kiCost || 0)) ? "KI_TOO_LOW" : null
    };
}
function checkTournamentQuest(player, tournamentData, matchResult) {
    if (!player.quests?.active) {
        validatePlayerQuests(player);
    }

    const activeQuestId = player.quests.active[0];
    if (!activeQuestId || !QUESTS[activeQuestId]) {
        console.log("No active quest found for player:", player.name);
        return;
    }

    const quest = QUESTS[activeQuestId];
    if (quest.type !== "TOURNAMENT") {
        console.log("Active quest is not a tournament quest");
        return;
    }

    const playerRank = getTournamentRank(tournamentData, player.id);
    console.log(`Player ${player.name} achieved rank ${playerRank} in tournament`);

    let shouldComplete = false;

    switch (activeQuestId) {
        case "TOURNAMENT_BEGINNER":
            if (playerRank <= 8) {
                shouldComplete = true;
                console.log("Player completed TOURNAMENT_BEGINNER quest");
            }
            break;

        case "TOURNAMENT_TENKAICHI":
            if (playerRank <= 4) {
                shouldComplete = true;
                console.log("Player completed TOURNAMENT_TENKAICHI quest");
            }
            break;

        case "TOURNAMENT_CELL":
            if (playerRank <= 2) {
                shouldComplete = true;
                console.log("Player completed TOURNAMENT_CELL quest");
            }
            break;

        case "TOURNAMENT_UNIVERSE":
            if (playerRank === 1) {
                shouldComplete = true;
                console.log("Player completed TOURNAMENT_UNIVERSE quest");
            }
            break;

        default:
            console.log("Unknown tournament quest type:", activeQuestId);
            return;
    }

    if (shouldComplete) {
        player.quests.progress[activeQuestId] = quest.target;

        if (quest.reward) {
            if (quest.reward.exp) {
                player.stats.exp = Math.min(
                    player.stats.exp + quest.reward.exp,
                    MAX_EXP_STORAGE
                );
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
                    player.inventory.items.push({
                        id: quest.reward.item,
                        name: SHOP_ITEMS[quest.reward.item.toUpperCase()]?.name || quest.reward.item,
                        quantity: quest.reward.quantity || 1,
                        type: SHOP_ITEMS[quest.reward.item.toUpperCase()]?.type || "quest_item"
                    });
                }
            }
        }

        const tournamentProgression = ["TOURNAMENT_BEGINNER", "TOURNAMENT_TENKAICHI", "TOURNAMENT_CELL", "TOURNAMENT_UNIVERSE"];
        const currentIndex = tournamentProgression.indexOf(activeQuestId);

        player.quests.completed.push(activeQuestId);
        player.quests.active = [];

        if (currentIndex >= 0 && currentIndex < tournamentProgression.length - 1) {
            const nextQuestId = tournamentProgression[currentIndex + 1];
            if (QUESTS[nextQuestId]) {
                player.quests.active.push(nextQuestId);
                player.quests.progress[nextQuestId] = 0;
                console.log(`Assigned next tournament quest: ${nextQuestId} to player: ${player.name}`);
            }
        }

        return true;
    }

    return false;
}
function getTournamentRank(tournamentData, playerId) {
    const matches = tournamentData.matches || [];
    let rank = 1;

    const lastMatch = matches
        .filter(m => m.completed && m.loser?.id === playerId)
        .sort((a, b) => b.round - a.round)[0];

    if (!lastMatch) return 1;

    switch (lastMatch.round) {
        case 1: rank = 16; break;
        case 2: rank = 8; break;
        case 3: rank = 4; break;
        case 4: rank = 2; break;
        default: rank = 16;
    }

    return rank;
}
function getPlayerTournamentRank(playerId, tournamentData) {
    if (!tournamentData.active?.rounds) return null;

    if (tournamentData.active.winners?.first?.id === playerId) return 1;

    if (tournamentData.active.winners?.second?.id === playerId) return 2;

    if (tournamentData.active.winners?.semifinalists?.some(p => p.id === playerId)) return 4;

    const totalRounds = tournamentData.active.rounds.length;
    const quarterFinalRound = totalRounds - 2;
    if (tournamentData.active.rounds[quarterFinalRound]?.some(
        match => match.player1?.id === playerId || match.player2?.id === playerId
    )) return 8;

    return null;
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

function updateQuestProgress(player, questType, playerData = null, additionalData = {}) {
    if (!player.quests?.active || player.quests.active.length === 0) {
        validatePlayerQuests(player);
    }

    const activeQuestId = player.quests.active[0];
    if (!activeQuestId || !QUESTS[activeQuestId]) return;

    const quest = QUESTS[activeQuestId];
    if (quest.type !== questType) return;

    let updated = false;

    switch (questType) {
        case QUEST_TYPES.TRAINING:
            if (!player.quests.progress[activeQuestId]) {
                player.quests.progress[activeQuestId] = 0;
            }
            player.quests.progress[activeQuestId]++;
            updated = true;
            break;

        case QUEST_TYPES.TOURNAMENT:
            if (additionalData?.tournamentRank && additionalData?.tournamentType) {
                if (activeQuestId === "TOURNAMENT_BEGINNER" && additionalData.tournamentRank <= 8) {
                    player.quests.progress[activeQuestId] = 1;
                    updated = true;
                } else if (activeQuestId === "TOURNAMENT_TENKAICHI" && additionalData.tournamentRank <= 4) {
                    player.quests.progress[activeQuestId] = 1;
                    updated = true;
                } else if (activeQuestId === "TOURNAMENT_CELL" && additionalData.tournamentRank <= 2) {
                    player.quests.progress[activeQuestId] = 1;
                    updated = true;
                }
            }
            break;

        case QUEST_TYPES.COMBAT:
            if (additionalData?.monster && quest.monster === additionalData.monster) {
                if (!player.quests.progress[activeQuestId]) {
                    player.quests.progress[activeQuestId] = 0;
                }
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
            }
            break;
    }

    if (updated && playerData) {
        savePlayerData(playerData);
    }

    if (player.quests.progress[activeQuestId] >= quest.target) {
        console.log(`Tự động hoàn thành nhiệm vụ: ${quest.name} cho player: ${player.name}`);

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

        player.quests.completed.push(activeQuestId);
        player.quests.active = [];


        if (activeQuestId.startsWith("TOURNAMENT_")) {

            const tournamentProgression = ["TOURNAMENT_BEGINNER", "TOURNAMENT_TENKAICHI", "TOURNAMENT_CELL", "TOURNAMENT_UNIVERSE"];
            const currentIndex = tournamentProgression.indexOf(activeQuestId);

            if (currentIndex >= 0 && currentIndex < tournamentProgression.length - 1) {
                const nextTournamentQuest = tournamentProgression[currentIndex + 1];
                if (QUESTS[nextTournamentQuest]) {
                    player.quests.active.push(nextTournamentQuest);
                    player.quests.progress[nextTournamentQuest] = 0;
                    console.log(`Đã gán nhiệm vụ giải đấu mới: ${QUESTS[nextTournamentQuest].name} cho player: ${player.name}`);
                }
            }
        } else {

            const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
            if (planetQuests && player.quests.completed.length < planetQuests.length) {
                const nextQuestId = planetQuests[player.quests.completed.length];
                if (QUESTS[nextQuestId]) {
                    console.log(`Đã gán nhiệm vụ mới: ${QUESTS[nextQuestId].name} cho player: ${player.name}`);
                    player.quests.active.push(nextQuestId);
                    player.quests.progress[nextQuestId] = 0;
                }
            }
        }

        if (player.quests.completed.length % 3 === 0) {
            if (!player.stats.level) player.stats.level = 1;
            player.stats.level += 1;
        }

        if (playerData) {
            savePlayerData(playerData);
        }
    } else if (updated && playerData) {
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

    if (questId.startsWith("TOURNAMENT_")) {

        const tournamentProgression = ["TOURNAMENT_BEGINNER", "TOURNAMENT_TENKAICHI", "TOURNAMENT_CELL", "TOURNAMENT_UNIVERSE"];
        const currentIndex = tournamentProgression.indexOf(questId);

        if (currentIndex >= 0 && currentIndex < tournamentProgression.length - 1) {
            const nextTournamentQuest = tournamentProgression[currentIndex + 1];
            if (QUESTS[nextTournamentQuest]) {

                player.quests.active.push(nextTournamentQuest);
                player.quests.progress[nextTournamentQuest] = 0;
            }
        }
    } else {

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
    if (!evolutionForms || evolutionForms.length === 0) {
        return false;
    }

    let highestForm = evolutionForms[0];
    for (let i = 1; i < evolutionForms.length; i++) {
        if (player.stats.power >= evolutionForms[i].powerRequired) {
            highestForm = evolutionForms[i];
        } else {
            break;
        }
    }


    const oldPower = player.stats.power;
    const oldDamage = player.stats.damage;
    const oldKi = player.stats.ki;
    const oldHealth = player.stats.health;


    if (!player.evolution || player.evolution.name !== highestForm.name) {

        const oldLevel = player.evolution ? player.evolution.level : -1;
        const newLevel = highestForm.level;


        if (player.evolution && oldLevel >= 0 && evolutionForms[oldLevel]) {
            const oldForm = evolutionForms[oldLevel];

            player.stats.power = Math.floor(player.stats.power / oldForm.powerBonus);
            player.stats.damage = Math.floor(player.stats.damage / oldForm.damageBonus);
            player.stats.ki = Math.floor(player.stats.ki / oldForm.kiBonus);
            player.stats.health = Math.floor(player.stats.health / oldForm.healthBonus);
        }


        player.stats.power = Math.floor(player.stats.power * highestForm.powerBonus);
        player.stats.damage = Math.floor(player.stats.damage * highestForm.damageBonus);
        player.stats.ki = Math.floor(player.stats.ki * highestForm.kiBonus);
        player.stats.health = Math.floor(player.stats.health * highestForm.healthBonus);


        player.stats.currentHealth = player.stats.health;
        player.stats.currentKi = player.stats.ki;


        player.evolution = {
            name: highestForm.name,
            level: highestForm.level,
            description: highestForm.description,
            achievedAt: new Date().toISOString(),
            auraColor: getAuraColorForEvolution(highestForm.name, player.planet)
        };


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
function selectBestSkill(player, playerHP, playerKi, opponentHP, playerStates, opponentStates, battleLog, currentTurn) {
    if (!player || !player.skills || player.skills.length === 0) return null;

    const maxHP = player.stats.health;
    const maxKi = player.stats.ki;
    const hpPercent = (playerHP / maxHP) * 100;
    const kiPercent = (playerKi / maxKi) * 100;
    const opponentHPPercent = opponentHP ? (opponentHP / (opponentHP * 2)) * 100 : 50;


    const isHealingSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return skillName === "WHISTLE" || skillName === "REGENERATION" || skillName === "REGENERATE_ENERGY";
    };

    const isControlSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return ["SOLAR_FLARE", "HYPNOSIS", "BIND"].includes(skillName);
    };

    const isDefensiveSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return skillName === "ENERGY_SHIELD";
    };

    const isPowerUpSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return skillName === "KAIOKEN" || skillName === "GREAT_APE";
    };

    const isAttackSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        const skillData = MASTERS[master]?.skills?.[skillName];
        return skillData && skillData.powerScale > 0;
    };

    const isUltimateSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return ["SPIRIT_BOMB", "FINAL_FLASH", "SPECIAL_BEAM_CANNON", "HELLZONE_GRENADE",
            "CADICH_LIEN_HOAN_TRUONG", "MULTIFORM", "EXPLODING_STORM"].includes(skillName);
    };

    const isBasicAttackSkill = (skillChoice) => {
        const [master, skillName] = skillChoice.split(":");
        return skillName === "DRAGON_PUNCH" || skillName === "ATOMIC" || skillName === "GALICK_GUN";
    };


    const battlePhase = currentTurn <= 10 ? 1 : (currentTurn <= 20 ? 2 : 3);


    const allowedSkills = player.skills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");

        if (player.planet === "EARTH" && master !== "KAME") return false;
        if (player.planet === "NAMEK" && master !== "PICCOLO") return false;


        return MASTERS[master]?.skills?.[skillName] != null;
    });


    const attackSkillsAvailable = allowedSkills.filter(skill => isAttackSkill(skill)).length;


    const usableSkills = allowedSkills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const skillData = MASTERS[master]?.skills?.[skillName];

        if (!skillData) return false;

        const kiRequired = Math.floor(playerKi * Math.abs(skillData.kiCost || 0));


        if (skillName === "SPIRIT_BOMB") {

            if (currentTurn < 25 || battlePhase < 3) return false;


            const spiritBombCount = battleLog.filter(log =>
                log.includes("Quả Cầu Kinh Khí") &&
                log.includes(player.name)
            ).length;

            if (spiritBombCount > 0) return false;
        }


        if (skillName === "GREAT_APE" && battlePhase < 3) return false;


        if (skillName === "CADICH_LIEN_HOAN_TRUONG" && battlePhase === 1) return false;


        if (isHealingSkill(skillChoice)) {

            if (hpPercent > 50) return false;


            if (playerStates.lastSkill && isHealingSkill(`${master}:${playerStates.lastSkill}`)) {
                return false;
            }


            if (skillName === "REGENERATE_ENERGY" || skillName === "WHISTLE") {
                if (kiPercent > 25) return false;
            }


            const healingUsedCount = battleLog
                .filter(log => log.includes("Tái Tạo") || log.includes("Huýt Sáo") || log.includes("hồi phục"))
                .length;

            if (healingUsedCount >= 2) return false;
        }


        if (skillName === "KAIOKEN") {

            const kaiokenUsedCount = battleLog
                .filter(log => log.includes("Kaioken"))
                .length;

            if (kaiokenUsedCount >= 1) return false;


            if (battlePhase === 1) return false;
        }


        if (isControlSkill(skillChoice)) {

            const recentControlUsed = battleLog
                .slice(-10)
                .some(log => (
                    log.includes(player.name) &&
                    (log.includes("Thái Dương Hạ San") ||
                        log.includes("Thôi Miên") ||
                        log.includes("Trói"))
                ));

            if (recentControlUsed) return false;


            if (opponentStates.stunned > 0 || opponentStates.bound > 0) {
                return false;
            }
        }

        return (skillData.kiCost <= 0) || (playerKi >= kiRequired);
    });

    if (usableSkills.length === 0) return null;


    const skillScores = usableSkills.map(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const skillData = MASTERS[master]?.skills?.[skillName];
        let score = 0;


        if (battlePhase === 1 && isBasicAttackSkill(skillChoice)) {
            score += 200;
        }


        if (skillData.powerScale > 0) {

            score += skillData.powerScale * 40;


            if (playerStates.combo > 0) {
                score += playerStates.combo * 15;
            }


            if (opponentStates.vulnerable > 0) {
                score += 40;
            }


            if (opponentStates.stunned > 0 || opponentStates.bound > 0) {
                score += 300;
            }
        }


        switch (battlePhase) {
            case 1:
                if (skillName === "DRAGON_PUNCH" || skillName === "ATOMIC") {
                    score += 250;
                }

                if (skillName === "GALICK_GUN") {
                    score += 200;
                }

                if (isControlSkill(skillChoice) && !opponentStates.stunned && !opponentStates.bound) {
                    score += 120;
                }


                if (isDefensiveSkill(skillChoice)) {
                    score -= 50;
                }


                if (isUltimateSkill(skillChoice)) {
                    score -= 500;
                }


                if (skillName === "CADICH_LIEN_HOAN_TRUONG") {
                    score -= 400;
                }


                if (isPowerUpSkill(skillChoice)) {
                    score -= 200;
                }
                break;

            case 2:

                if (skillName === "KAIOKEN" && !playerStates.powerBoosted) {
                    score += 200;
                }


                if (skillName === "CADICH_LIEN_HOAN_TRUONG") {
                    score += 120;
                }


                if (skillName === "GALICK_GUN") {
                    score += 150;
                }


                if (skillName === "DRAGON_PUNCH" || skillName === "ATOMIC") {
                    score -= 50;
                }


                if (isControlSkill(skillChoice) && !opponentStates.stunned && !opponentStates.bound) {
                    score += 180;
                }


                if (opponentHPPercent < 50 && skillData.powerScale > 0) {
                    score += 80;
                }
                break;

            case 3:

                if (skillName === "GREAT_APE" && !playerStates.powerBoosted) {
                    score += 350;
                }


                if (skillName === "SPIRIT_BOMB") {

                    if (currentTurn >= 25) {
                        score += 1000;
                    } else {
                        score += 350;
                    }
                }


                if (skillName === "CADICH_LIEN_HOAN_TRUONG") {
                    score += 300;
                }


                if (skillName === "GALICK_GUN") {
                    score += 150;
                }


                if (skillName === "KAIOKEN" && !playerStates.powerBoosted) {
                    score += 250;
                }


                if (skillName === "DRAGON_PUNCH" || skillName === "ATOMIC") {
                    score -= 200;
                }


                if (skillName === "SOLAR_FLARE" || skillName === "HYPNOSIS") {

                    score += 220;
                }
                break;
        }


        if (hpPercent <= 30) {

            if (isHealingSkill(skillChoice)) {
                score += 200;
            } else if (isDefensiveSkill(skillChoice)) {
                score += 180;
            } else if (isControlSkill(skillChoice) && !opponentStates.stunned && !opponentStates.bound) {
                score += 160;
            } else if (isPowerUpSkill(skillChoice) && !playerStates.powerBoosted) {
                score += 140;
            }
        } else if (hpPercent <= 70) {

            if (opponentHPPercent < 30 && skillData.powerScale > 2.5) {
                score += 160;
            } else if (!playerStates.powerBoosted && isPowerUpSkill(skillChoice)) {
                score += 130;
            } else if (!opponentStates.stunned && !opponentStates.bound && isControlSkill(skillChoice)) {
                score += 110;
            }
        } else {

            if (!playerStates.powerBoosted && isPowerUpSkill(skillChoice)) {
                score += 100;
            } else if (isUltimateSkill(skillChoice) && kiPercent > 90 && battlePhase === 3) {
                score += 150;
            } else if (!opponentStates.stunned && !opponentStates.bound && isControlSkill(skillChoice)) {
                score += 120;
            }


            if (isHealingSkill(skillChoice)) {
                score -= 300;
            }
        }


        switch (skillName) {
            case "KAIOKEN":
                if (playerStates.powerBoosted) {
                    score -= 500;
                } else if (battlePhase <= 1) {
                    score -= 200;
                }
                break;

            case "GREAT_APE":
                if (playerStates.powerBoosted) {
                    score -= 500;
                } else if (battlePhase < 3) {
                    score -= 400;
                } else {
                    score += 350;
                }
                break;

            case "DRAGON_PUNCH":

                if (battlePhase === 1) {
                    score += 200;
                } else if (battlePhase === 2) {
                    score -= 50;
                } else {
                    score -= 200;
                }
                break;

            case "ATOMIC":

                if (battlePhase === 1) {
                    score += 220;
                } else if (battlePhase === 2) {
                    score -= 50;
                } else {
                    score -= 200;
                }
                break;

            case "GALICK_GUN":
                if (battlePhase === 1) {
                    score += 180;
                }

                if (opponentStates.stunned > 0 || opponentStates.bound > 0) {
                    score += 120;
                }
                break;

            case "CADICH_LIEN_HOAN_TRUONG":
                if (battlePhase === 1) {
                    score -= 300;
                } else if (battlePhase === 2) {
                    score += 50;
                } else {
                    score += 200;
                }


                if (opponentStates.stunned > 0 || opponentStates.bound > 0) {
                    score += 180;
                }
                break;

            case "SOLAR_FLARE":
            case "HYPNOSIS":

                const controlCooldown = 5;

                if (opponentStates.stunned || opponentStates.bound) {
                    score -= 500;
                }


                const recentControlUse = battleLog
                    .slice(-10)
                    .some(log => (
                        log.includes(player.name) &&
                        (log.includes("Thái Dương Hạ San") || log.includes("Thôi Miên"))
                    ));

                if (recentControlUse) {
                    score -= 300;
                }


                if (battlePhase >= 2) {
                    score += 80;
                }
                break;

            case "BIND":
                if (opponentStates.stunned || opponentStates.bound) {
                    score -= 500;
                }


                const bindCooldown = 3;
                break;

            case "ENERGY_SHIELD":
                if (playerStates.shielded) {
                    score -= 400;
                } else if (hpPercent < 50) {
                    score += 150;
                }
                break;

            case "WHISTLE":
            case "REGENERATE_ENERGY":

                if (kiPercent > 25) {
                    score -= 300;
                }

                if (playerStates.lastSkill === skillName) {
                    score -= 500;
                }
                break;

            case "REGENERATION":

                if (playerStates.lastSkill === skillName) {
                    score -= 500;
                }
                break;

            case "SPIRIT_BOMB":

                if (battlePhase < 3) {
                    score -= 800;
                } else if (currentTurn < 25) {
                    score -= 300;
                } else {

                    const spiritBombUsed = battleLog.some(log =>
                        log.includes("Quả Cầu Kinh Khí") &&
                        log.includes(player.name)
                    );

                    if (!spiritBombUsed) {

                        if (currentTurn >= 25) {
                            score += 1000;
                        }
                    } else {

                        score -= 1000;
                    }
                }
                break;
        }


        if (skillData.powerScale > 0) {
            if (playerStates.combo >= 3) {
                score += 100;
            }
        }


        if (playerStates.lastSkill === skillName) {
            score -= 150;
        }


        const skillUsageCount = battleLog
            .filter(log => log.includes(skillData.name))
            .length;

        if (skillUsageCount > 2) {
            score -= skillUsageCount * 30;
        }


        if ((opponentStates.stunned > 0 || opponentStates.bound > 0) && skillData.powerScale > 0) {
            score += 300;
        }


        score += Math.random() * 10;

        return { skillChoice, score };
    });


    skillScores.sort((a, b) => b.score - a.score);


    const top3 = skillScores.slice(0, Math.min(3, skillScores.length));
    console.log(`Turn ${currentTurn} | Phase ${battlePhase} | HP: ${hpPercent.toFixed(1)}% | Ki: ${kiPercent.toFixed(1)}%`);
    top3.forEach((choice, i) => {
        const [master, skillName] = choice.skillChoice.split(":");
        const skillData = MASTERS[master]?.skills[skillName];
        if (skillData) {
            console.log(`${i + 1}. ${skillData.name} (Score: ${choice.score.toFixed(1)})`);
        }
    });

    return skillScores[0]?.skillChoice || null;
}
function calculatePowerGain(currentPower, locationMultiplier) {
    // Base power gain is initially high and decreases as power increases
    let basePowerGain;

    if (currentPower < 1000) {
        // Very low power - give a significant boost
        basePowerGain = currentPower * 0.25 + 100;
    } else if (currentPower < 10000) {
        // Low power - good growth
        basePowerGain = currentPower * 0.15 + 200;
    } else if (currentPower < 100000) {
        // Medium power - moderate growth
        basePowerGain = currentPower * 0.08 + 500;
    } else if (currentPower < 1000000) {
        // High power - slower growth
        basePowerGain = currentPower * 0.04 + 2000;
    } else if (currentPower < 10000000) {
        // Very high power - even slower growth
        basePowerGain = currentPower * 0.015 + 5000;
    } else {
        // Extreme power - minimal growth
        basePowerGain = currentPower * 0.005 + 10000;
    }

    // Apply location multiplier
    const powerGain = Math.floor(basePowerGain * locationMultiplier);

    return powerGain;
}
function calculateExpGain(currentPower, playerDamage) {
    let baseExpGain;

    if (currentPower < 1000) {
        // Very low power - give a significant exp boost
        baseExpGain = currentPower * 0.6 + 200;
    } else if (currentPower < 10000) {
        // Low power - good exp growth
        baseExpGain = currentPower * 0.3 + 400;
    } else if (currentPower < 100000) {
        // Medium power - moderate exp growth
        baseExpGain = currentPower * 0.15 + 1000;
    } else if (currentPower < 1000000) {
        // High power - slower exp growth
        baseExpGain = currentPower * 0.08 + 5000;
    } else if (currentPower < 10000000) {
        // Very high power - even slower exp growth
        baseExpGain = currentPower * 0.04 + 10000;
    } else {
        // Extreme power - minimal exp growth
        baseExpGain = currentPower * 0.02 + 20000;
    }

    // Factor in damage for additional exp (small bonus based on damage)
    const damageBonus = Math.sqrt(playerDamage) * 0.5;

    // Final exp gain
    const expGain = Math.floor(baseExpGain + damageBonus);

    return expGain;
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

    setInterval: function () {
        // Check for boss events periodically (every 5 minutes)
        if (!this.bossCheckInterval) {
            this.bossCheckInterval = setInterval(() => {
                BOSS_SYSTEM.checkForBossEvents();
                BOSS_SYSTEM.saveBossData();
                console.log("Checked for new boss events");
            }, 5 * 60 * 1000); // Every 5 minutes
        }

        return {
            name: this.name,
            version: this.version
        };
    },
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
        BOSS_SYSTEM.loadBossData();
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
                
                if (!playerData) {
                    console.log("playerData is null or undefined, initializing empty object");
                    playerData = {};
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu người chơi:", error);
                playerData = {};
            }

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
                    },
                    hasFused: false
                };
            
                if (!playerData[senderID].inventory.items) {
                    playerData[senderID].inventory.items = [];
                }
                
                playerData[senderID].inventory.items.push({
                    id: "senzu",
                    quantity: 3,
                    type: "consumable"
                });
                
                if (planet === "EARTH") {
                    playerData[senderID].inventory.items.push({
                        id: "armor",
                        quantity: 1,
                        type: "armor",
                        boost: 1.1
                    });
                    playerData[senderID].stats.zeni += 1000;
                } 
                else if (planet === "NAMEK") {
                    playerData[senderID].inventory.items.push({
                        id: "boots",
                        quantity: 1,
                        type: "boots",
                        boost: 1.1
                    });
                    playerData[senderID].stats.ki += 50; 
                } 
                else if (planet === "SAIYAN") {
                    playerData[senderID].inventory.items.push({
                        id: "gloves",
                        quantity: 1,
                        type: "gloves",
                        boost: 1.1
                    });
                    playerData[senderID].stats.damage += 10;
                }
            
                updateQuestProgress(playerData[senderID], QUEST_TYPES.MASTER, playerData);
                savePlayerData(playerData);
            
                const starterGuide = 
                    "🎮 HƯỚNG DẪN CƠ BẢN 🎮\n" +
                    "───────────────\n" +
                    "1️⃣ Luyện tập: .dball train\n" +
                    "2️⃣ Xem thông tin: .dball info\n" +
                    "3️⃣ Mua vật phẩm: .dball shop\n" +
                    "4️⃣ Kiểm tra nhiệm vụ: .dball quest\n" +
                    "5️⃣ Đánh quái vật: .dball fight monster\n" +
                    "6️⃣ Dùng vật phẩm: .dball use <id>\n" +
                    "7️⃣ Tìm kiếm Ngọc Rồng khi luyện tập\n\n" +
                    `💎 ĐẶC TRƯNG CỦA TỘC ${planet}: ${PLANETS[planet].description}\n\n` +
                    "🎁 PHẦN QUÀ CHO NGƯỜI MỚI:\n" +
                    "• 3 Đậu Thần (Hồi phục HP và Ki)\n" +
                    (planet === "EARTH" ? "• Giáp cơ bản (+10% HP)\n• 1000 Zeni bổ sung\n" : 
                     planet === "NAMEK" ? "• Giày cơ bản (+10% Ki)\n• 50 Ki bổ sung\n" :
                     "• Găng tay cơ bản (+10% Sức đánh)\n• 10 Sức đánh bổ sung\n") +
                    "\n🔍 Dùng .dball inventory để xem vật phẩm!";
            
                return api.sendMessage(
                    "🎉 NHÂN VẬT ĐÃ ĐƯỢC TẠO!\n" +
                    "───────────────\n" +
                    `👤 Tên: ${userName}\n` +
                    `🌍 Tộc người: ${PLANETS[planet].name}\n` +
                    `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 cơ bản: ${DEFAULT_STATS.power}\n` +
                    `✨ Ki: ${DEFAULT_STATS.ki}\n` +
                    `❤️ HP: ${DEFAULT_STATS.health}\n` +
                    `💰 Zeni: ${DEFAULT_STATS.zeni.toLocaleString()}\n\n` +
                    "💡 Dùng .dball train để bắt đầu luyện tập!\n\n" +
                    starterGuide,
                    threadID, messageID
                );
            }

            switch (command) {
                case "info": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }
                    applyEquipmentBoosts(player);
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
                        case "equipment":
                        case "armor":
                        case "gloves":
                        case "boots":
                        case "radar": {
                            if (inventoryItem.equipped) {
                                inventoryItem.equipped = false;
                                savePlayerData(playerData);

                                return api.sendMessage(
                                    "❎ ĐÃ THÁO TRANG BỊ!\n" +
                                    "───────────────\n" +
                                    `Đã tháo: ${shopItem.name}`,
                                    threadID, messageID
                                );
                            }


                            if (inventoryItem.type === "armor" || inventoryItem.type === "gloves" ||
                                inventoryItem.type === "boots" || inventoryItem.type === "radar") {
                                const sameTypeItems = player.inventory.items.filter(
                                    item => item.type === inventoryItem.type && item.equipped
                                );

                                sameTypeItems.forEach(item => {
                                    item.equipped = false;
                                });
                            }

                            inventoryItem.usedTime = Date.now();
                            inventoryItem.visualEffect = getVisualEffectForItem(itemId);
                            inventoryItem.equipped = true;

                            let effectMessage = "";
                            switch (inventoryItem.type) {
                                case "armor":
                                    effectMessage = `Tăng HP +${Math.round((inventoryItem.boost - 1) * 100)}%`;
                                    break;
                                case "gloves":
                                    effectMessage = `Tăng sức đánh +${Math.round((inventoryItem.boost - 1) * 100)}%`;
                                    break;
                                case "boots":
                                    effectMessage = `Tăng Ki +${Math.round((inventoryItem.boost - 1) * 100)}%`;
                                    break;
                                case "radar":
                                    effectMessage = `Tăng EXP và sức mạnh +${Math.round((inventoryItem.boost - 1) * 100)}%`;
                                    break;
                                default:
                                    effectMessage = shopItem.description;
                            }
                            applyEquipmentBoosts(player);
                            savePlayerData(playerData);

                            return api.sendMessage(
                                "🎽 TRANG BỊ THÀNH CÔNG!\n" +
                                "───────────────\n" +
                                `${inventoryItem.emoji || "🎽"} Đã trang bị: ${shopItem.name}\n` +
                                `📊 Hiệu quả: ${effectMessage}\n` +
                                `⏳ Thời gian hiệu lực: Vĩnh viễn`,
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
                                        threadID, messageIDF
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
                    else if (target[1]?.toLowerCase() === "rada" || target[1]?.toLowerCase() === "radar") {

                        const purchasedRadar = player.inventory.items.find(i => i.id === selectedRadar.id);
                        if (purchasedRadar) {
                            player.inventory.items.forEach(item => {
                                if (item.type === "radar" && item.equipped) {
                                    item.equipped = false;
                                }
                            });

                            purchasedRadar.equipped = true;
                            purchasedRadar.usedTime = Date.now();

                            const radarBoost = selectedRadar.boost || 1.2;
                            player.stats.expMultiplier = (player.stats.expMultiplier || 1) * radarBoost;
                            player.stats.powerMultiplier = (player.stats.powerMultiplier || 1) * radarBoost;
                        }
                        const radarItems = Object.values(EQUIPMENT_ITEMS)
                            .filter(item => item.type === "radar")
                            .filter(item => player.stats.power >= item.requiredPower);

                        if (!target[2]) {
                            const radarShopData = {
                                radarItems: radarItems,
                                player: player
                            };

                            const imagePath = await createRadarShopImage(radarShopData);

                            if (imagePath) {
                                return api.sendMessage(
                                    {
                                        body: `📡 CỬA HÀNG RADAR NGỌC RỒNG 📡\n─────────────\n👤 ${player.name}\n💰 Zeni: ${player.stats.zeni.toLocaleString()}\n\n💡 Để mua radar: .dball shop rada <số thứ tự>`,
                                        attachment: fs.createReadStream(imagePath)
                                    },
                                    threadID,
                                    () => fs.unlinkSync(imagePath),
                                    messageID
                                );
                            } else {
                                let msg = `📡 SHOP RADA - TĂNG SỨC MẠNH & EXP 📡\n`;
                                msg += "───────────────\n\n";

                                radarItems.forEach((item, index) => {
                                    msg += `${index + 1}. ${item.emoji} ${item.name} - ${item.price.toLocaleString()} Zeni\n`;
                                    msg += `   • ${item.description}\n`;
                                    msg += `   • Tăng EXP và Sức Mạnh: +${Math.round((item.boost - 1) * 100)}%\n`;
                                    msg += `   • Yêu cầu: ${item.requiredPower.toLocaleString()} sức mạnh\n\n`;
                                });

                                msg += "Cách dùng:\n";
                                msg += "• .dball shop rada <số thứ tự>\n";
                                msg += "• VD: .dball shop rada 1 (Mua Rada cấp 1)\n\n";
                                msg += `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}`;

                                return api.sendMessage(msg, threadID, messageID);
                            }
                        }

                        const itemIndex = parseInt(target[2]) - 1;

                        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= radarItems.length) {
                            return api.sendMessage("❌ Số thứ tự rada không hợp lệ!", threadID, messageID);
                        }

                        const selectedRadar = radarItems[itemIndex];

                        if (player.stats.zeni < selectedRadar.price) {
                            return api.sendMessage(
                                `❌ Không đủ 𝗭𝗲𝗻𝗶 để mua!\n` +
                                `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                `💰 Cần: ${selectedRadar.price.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (!player.inventory) player.inventory = { items: [] };
                        if (!player.inventory.items) player.inventory.items = [];

                        const existingItem = player.inventory.items.find(i => i.id === selectedRadar.id);

                        if (existingItem) {
                            existingItem.quantity = (existingItem.quantity || 1) + 1;
                        } else {
                            player.inventory.items.push({
                                id: selectedRadar.id,
                                name: selectedRadar.name,
                                quantity: 1,
                                type: selectedRadar.type,
                                boost: selectedRadar.boost,
                                emoji: selectedRadar.emoji,
                                description: selectedRadar.description
                            });
                        }

                        if (player.inventory.items) {
                            player.inventory.items.forEach(item => {
                                if (item.type === "radar" && item.equipped) {
                                    item.equipped = false;
                                }
                            });
                        }

                        const purchasedItem = player.inventory.items.find(i => i.id === selectedRadar.id);
                        purchasedItem.equipped = true;
                        purchasedItem.usedTime = Date.now();

                        player.stats.zeni -= selectedRadar.price;
                        applyEquipmentBoosts(player);
                        savePlayerData(playerData);

                        return api.sendMessage(
                            "📡 MUA RADA THÀNH CÔNG! 📡\n" +
                            "───────────────\n" +
                            `${selectedRadar.emoji} Đã mua: ${selectedRadar.name}\n` +
                            `💰 Giá: ${selectedRadar.price.toLocaleString()} Zeni\n` +
                            `📊 Hiệu quả: Tăng EXP và Sức Mạnh +${Math.round((selectedRadar.boost - 1) * 100)}%\n` +
                            `⏳ Thời gian hiệu lực: Vĩnh viễn\n\n` +
                            `💰 Số 𝗭𝗲𝗻𝗶 còn lại: ${player.stats.zeni.toLocaleString()}\n\n` +
                            `💡 Rada đã được tự động trang bị!`,
                            threadID, messageID
                        );
                    }
                    else if (target[1]?.toLowerCase() === "do" || target[1]?.toLowerCase() === "equipment") {
                        function applyEquipmentEffect(player, item) {
                            switch (item.type) {
                                case "armor":
                                    player.stats.health = Math.floor(player.stats.health * item.boost);
                                    player.stats.currentHealth = player.stats.health;
                                    break;

                                case "gloves":
                                    player.stats.damage = Math.floor(player.stats.damage * item.boost);
                                    break;

                                case "boots":
                                    player.stats.ki = Math.floor(player.stats.ki * item.boost);
                                    player.stats.currentKi = player.stats.ki;
                                    break;
                            }
                        }

                        const equipmentList = Object.values(EQUIPMENT_ITEMS).filter(item =>
                            item.planet === player.planet || item.type === "radar"
                        ).filter(item =>
                            player.stats.power >= item.requiredPower
                        );

                        if (!target[2]) {

                            const equipmentByType = {
                                armor: equipmentList.filter(item => item.type === "armor"),
                                gloves: equipmentList.filter(item => item.type === "gloves"),
                                boots: equipmentList.filter(item => item.type === "boots"),
                                radar: equipmentList.filter(item => item.type === "radar")
                            };

                            let msg = `🛡️ SHOP TRANG BỊ - ${PLANETS[player.planet].name} 🛡️\n`;
                            msg += "───────────────\n\n";


                            msg += "🧥 GIÁP (Tăng HP):\n";
                            equipmentByType.armor.forEach((item, index) => {
                                msg += `${index + 1}. ${item.emoji} ${item.name} - ${item.price.toLocaleString()} Zeni\n`;
                                msg += `   • ${item.description}\n`;
                                msg += `   • Tăng HP: +${Math.round((item.boost - 1) * 100)}%\n`;
                            });


                            msg += "\n🥊 GĂNG TAY (Tăng Sức Đánh):\n";
                            equipmentByType.gloves.forEach((item, index) => {
                                msg += `${equipmentByType.armor.length + index + 1}. ${item.emoji} ${item.name} - ${item.price.toLocaleString()} Zeni\n`;
                                msg += `   • ${item.description}\n`;
                                msg += `   • Tăng Sức Đánh: +${Math.round((item.boost - 1) * 100)}%\n`;
                            });


                            msg += "\n👟 GIÀY (Tăng Ki):\n";
                            equipmentByType.boots.forEach((item, index) => {
                                msg += `${equipmentByType.armor.length + equipmentByType.gloves.length + index + 1}. ${item.emoji} ${item.name} - ${item.price.toLocaleString()} Zeni\n`;
                                msg += `   • ${item.description}\n`;
                                msg += `   • Tăng Ki: +${Math.round((item.boost - 1) * 100)}%\n`;
                            });

                            msg += "\nCách dùng:\n";
                            msg += "• .dball shop do <số thứ tự>\n";
                            msg += "• VD: .dball shop do 1 (Mua trang bị số 1)\n\n";
                            msg += `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}`;

                            return api.sendMessage(msg, threadID, messageID);
                        }

                        const itemIndex = parseInt(target[2]) - 1;

                        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= equipmentList.length) {
                            return api.sendMessage("❌ Số thứ tự trang bị không hợp lệ!", threadID, messageID);
                        }

                        const selectedEquipment = equipmentList[itemIndex];


                        if (player.stats.zeni < selectedEquipment.price) {
                            return api.sendMessage(
                                `❌ Không đủ 𝗭𝗲𝗻𝗶 để mua!\n` +
                                `💰 𝗭𝗲𝗻𝗶 hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                `💰 Cần: ${selectedEquipment.price.toLocaleString()}`,
                                threadID, messageID
                            );
                        }


                        if (!player.inventory) player.inventory = { items: [] };
                        if (!player.inventory.items) player.inventory.items = [];

                        const existingItem = player.inventory.items.find(i => i.id === selectedEquipment.id);

                        if (existingItem) {
                            existingItem.quantity = (existingItem.quantity || 1) + 1;
                        } else {
                            player.inventory.items.push({
                                id: selectedEquipment.id,
                                name: selectedEquipment.name,
                                quantity: 1,
                                type: selectedEquipment.type,
                                boost: selectedEquipment.boost,
                                emoji: selectedEquipment.emoji,
                                description: selectedEquipment.description,

                            });
                        }
                        if (player.inventory.items) {
                            player.inventory.items.forEach(item => {
                                if (item.type === selectedEquipment.type && item.equipped) {
                                    item.equipped = false;
                                }
                            });
                        }

                        const purchasedItem = player.inventory.items.find(i => i.id === selectedEquipment.id);
                        if (purchasedItem) {
                            player.inventory.items.forEach(item => {
                                if (item.type === purchasedItem.type && item.equipped) {
                                    item.equipped = false;
                                }
                            });

                            purchasedItem.equipped = true;
                            purchasedItem.usedTime = Date.now();

                            applyEquipmentEffect(player, purchasedItem);
                        }
                        savePlayerData(playerData);

                        let effectDescription;
                        switch (selectedEquipment.type) {
                            case "armor":
                                effectDescription = `Tăng HP +${Math.round((selectedEquipment.boost - 1) * 100)}%`;
                                break;
                            case "gloves":
                                effectDescription = `Tăng Sức Đánh +${Math.round((selectedEquipment.boost - 1) * 100)}%`;
                                break;
                            case "boots":
                                effectDescription = `Tăng Ki +${Math.round((selectedEquipment.boost - 1) * 100)}%`;
                                break;
                            case "radar":
                                effectDescription = `Tăng EXP và Sức Mạnh +${Math.round((selectedEquipment.boost - 1) * 100)}%`;
                                break;
                        }

                        return api.sendMessage(
                            "🛍️ MUA TRANG BỊ THÀNH CÔNG!\n" +
                            "───────────────\n" +
                            `${selectedEquipment.emoji} Đã mua: ${selectedEquipment.name}\n` +
                            `💰 Giá: ${selectedEquipment.price.toLocaleString()} Zeni\n` +
                            `📊 Hiệu quả: ${effectDescription}\n` +
                            `💰 Số 𝗭𝗲𝗻𝗶 còn lại: ${player.stats.zeni.toLocaleString()}\n\n` +
                            `💡Trang bị tự động sử dụng.`,
                            threadID, messageID
                        );
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
                        msg += "• .𝗱𝗯𝗮𝗹𝗹 𝘀𝗵𝗼𝗽 𝗯𝘂𝗮 - 𝗠𝗼̛̉ 𝘁𝗶𝗲̣̂𝗺 𝗯𝘂̀𝗮 𝗰𝘂̉𝗮 𝗕𝗮̀ 𝗛𝗮̣𝘁 𝗠𝗶́𝘁\n";
                        msg += "• .𝗱𝗯𝗮𝗹𝗹 𝘀𝗵𝗼𝗽 𝗿𝗮𝗱𝗮 - 𝗠𝗼̛̉ 𝘁𝗶𝗲̣̂𝗺 𝗿𝗮𝗱𝗮\n";
                        msg += "• .𝗱𝗯𝗮𝗹𝗹 𝘀𝗵𝗼𝗽 𝗱𝗼 - 𝗠𝗼̛̉ 𝘁𝗶𝗲̣̂𝗺 𝘁𝗿𝗮𝗻𝗴 𝗯𝗶̣\n\n";
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
                    const now = Date.now();
                    const cooldown = 30000;

                    if (now - player.lastTrain < cooldown) {
                        const remainingTime = Math.ceil((cooldown - (now - player.lastTrain)) / 1000);
                        return api.sendMessage(`⏳ Vui lòng đợi ${remainingTime}s để hồi sức!`, threadID, messageID);
                    }
                    if (player.quests?.active && player.quests.active.length > 0) {
                        const activeQuestId = player.quests.active[0];
                        if (activeQuestId && QUESTS[activeQuestId]) {
                            const quest = QUESTS[activeQuestId];
                            if (quest.type === 'TRAINING') {
                                if (!player.quests.progress[activeQuestId]) {
                                    player.quests.progress[activeQuestId] = 0;
                                }
                                player.quests.progress[activeQuestId]++;

                                if (player.quests.progress[activeQuestId] >= quest.target) {
                                    api.sendMessage(
                                        "✨ NHIỆM VỤ HOÀN THÀNH! ✨\n" +
                                        "───────────────\n" +
                                        `📝 ${quest.name}\n` +
                                        `⭐ Tiến độ: ${player.quests.progress[activeQuestId]}/${quest.target}\n\n` +
                                        "💡 Dùng lệnh .dball quest hoàn để nhận thưởng!",
                                        threadID
                                    );
                                }
                            }
                        }
                    }
                    const currentLocation = getTrainingLocation(player.stats.power);
                    const locationMultiplier = currentLocation.multiplier;

                    const powerGain = calculatePowerGain(player.stats.power, locationMultiplier);

                    let locationChangeMessage = '';
                    const newLocation = getTrainingLocation(player.stats.power + powerGain);
                    if (newLocation.name !== currentLocation.name) {
                        locationChangeMessage = `\n🌟 Bạn đã mở khóa địa điểm luyện tập mới: ${newLocation.name}!`;
                    }

                    let expBonus = 1.0;
                    let hasRadar = false;
                    if (player.inventory?.items) {
                        for (const item of player.inventory.items) {
                            if (item.equipped && item.type === "radar") {
                                expBonus *= item.boost || 1.2;
                                hasRadar = true;
                            }
                        }
                    }
                    const trainStats = {
                        expMultiplier: 1.0,
                        powerMultiplier: 1.0,
                        zeniMultiplier: 1.0
                    };
                    const amuletEffects = applyAmuletEffects(player, trainStats);

                    const finalPowerGain = Math.floor(powerGain * trainStats.powerMultiplier);

                    player.stats.power = checkStatLimit(
                        player.stats.power + finalPowerGain,
                        'POWER'
                    );

                    const expGain = Math.floor(calculateExpGain(player.stats.power, player.stats.damage) * expBonus * trainStats.expMultiplier);

                    if (player.stats.exp + expGain > MAX_EXP_STORAGE) {
                        player.stats.exp = MAX_EXP_STORAGE;
                    } else {
                        player.stats.exp += expGain;
                    }

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
                        oldPower: player.stats.power - finalPowerGain,
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
                        `💡 Dùng .dball quest để xem nhiệm vụ\n` +
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

                        if (!tournamentData.active?.type || !TOURNAMENT_TYPES[tournamentData.active.type]) {
                            return api.sendMessage("❌ Dữ liệu giải đấu không hợp lệ!", threadID, messageID);
                        }

                        const tournament = tournamentData.active;
                        const tournamentType = TOURNAMENT_TYPES[tournament.type];
                        const registeredPlayers = Object.keys(tournamentData.registrations || {}).length;

                        let status;
                        switch (tournament.status) {
                            case "registration":
                                status = "⏳ Đang mở đăng ký";
                                break;
                            case "ongoing":
                                status = "🥊 Đang diễn ra";
                                break;
                            case "completed":
                                status = "✅ Đã kết thúc";
                                break;
                            default:
                                status = "⏳ Đang chờ người đăng ký";
                        }

                        return api.sendMessage(
                            `🏆 ${tournamentType.name.toUpperCase()} 🏆\n` +
                            "───────────────\n" +
                            `📝 Mô tả: ${tournamentType.description}\n` +
                            `👑 Người tổ chức: ${tournament.organizer?.name || "Không xác định"}\n` +
                            `⏰ Trạng thái: ${status}\n` +
                            `👥 Số người tham gia: ${registeredPlayers}/${tournamentType.maxPlayers}\n` +
                            `💰 Lệ phí tham gia: ${tournamentType.entryFee.toLocaleString()} Zeni\n\n` +
                            "🏅 Giải thưởng:\n" +
                            `🥇 Hạng nhất: ${tournamentType.rewards.first.zeni.toLocaleString()} Zeni, ${tournamentType.rewards.first.exp.toLocaleString()} EXP\n` +
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

                case "hopthe": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (player.hasFused) {
                        return api.sendMessage("❌ Bạn đã hợp thể rồi! Không thể hợp thể thêm lần nữa.", threadID, messageID);
                    }

                    const hasDisciple = player.inventory?.items?.some(item => item.id === "broly_disciple" && item.quantity > 0);

                    if (!hasDisciple) {
                        return api.sendMessage(
                            "❌ Bạn cần có Đệ Tử Broly để thực hiện hợp thể!\n" +
                            "💡 Đánh bại Legendary Super Saiyan Broly để có cơ hội nhận đệ tử.",
                            threadID, messageID
                        );
                    }

                    const oldPower = player.stats.power;
                    const oldDamage = player.stats.damage;
                    const oldKi = player.stats.ki;
                    const oldHealth = player.stats.health;

                    const bDItem = SPECIAL_ITEMS.BROLY_DISCIPLE;
                    player.stats.power = Math.floor(player.stats.power * bDItem.power_multiplier);
                    player.stats.damage = Math.floor(player.stats.damage * bDItem.damage_multiplier);
                    player.stats.ki = Math.floor(player.stats.ki * bDItem.ki_multiplier);
                    player.stats.health = Math.floor(player.stats.health * bDItem.hp_multiplier);

                    player.stats.currentHealth = player.stats.health;
                    player.stats.currentKi = player.stats.ki;

                    player.evolution = {
                        name: "Super Legendary Warrior",
                        level: 999,
                        description: "Hợp thể với Đệ Tử Broly, sức mạnh kinh hoàng",
                        achievedAt: new Date().toISOString(),
                        auraColor: "#FF2D00"
                    };

                    const discipleItem = player.inventory.items.find(item => item.id === "broly_disciple");
                    discipleItem.quantity -= 1;
                    if (discipleItem.quantity <= 0) {
                        player.inventory.items = player.inventory.items.filter(item => item.id !== "broly_disciple");
                    }

                    if (!player.skills) player.skills = [];
                    if (!player.skills.includes("GOKU:GREAT_APE")) {
                        player.skills.push("GOKU:GREAT_APE");
                    }
                    if (!player.skills.includes("KAME:SPIRIT_BOMB")) {
                        player.skills.push("KAME:SPIRIT_BOMB");
                    }

                    player.hasFused = true;
                    savePlayerData(playerData);

                    return api.sendMessage(
                        "🌟 HỢP THỂ HUYỀN THOẠI THÀNH CÔNG! 🌟\n" +
                        "───────────────\n" +
                        "Bạn đã hợp thể thành công với Đệ Tử Broly!\n\n" +
                        "👤 Hình thái mới: Super Legendary Warrior\n" +
                        "💪 Sức mạnh: " + oldPower.toLocaleString() + " → " + player.stats.power.toLocaleString() + "\n" +
                        "⚔️ Sức đánh: " + oldDamage.toLocaleString() + " → " + player.stats.damage.toLocaleString() + "\n" +
                        "✨ Ki: " + oldKi.toLocaleString() + " → " + player.stats.ki.toLocaleString() + "\n" +
                        "❤️ HP: " + oldHealth.toLocaleString() + " → " + player.stats.health.toLocaleString() + "\n\n" +
                        "🔥 Kỹ năng mới mở khóa: Biến Khỉ Khổng Lồ, Quả Cầu Kinh Khí\n\n" +
                        "⚠️ Lưu ý: Hợp thể này là vĩnh viễn!",
                        threadID, messageID
                    );
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
                case "fight": {
                    const player = playerData[senderID];
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                    }

                    if (player.stats.currentHealth <= 50 && player.stats.currentKi < player.stats.ki * 0.1) {
                        return api.sendMessage(
                            "❌ Bạn đang trong trạng thái kiệt sức!\n" +
                            "💡 Hãy dùng đậu thần (.dball use senzu) để hồi phục trước khi chiến đấu.",
                            threadID, messageID
                        );
                    }
                    if (target[1]?.toLowerCase() === "Boss" || target[1]?.toLowerCase() === "boss") {
                        BOSS_SYSTEM.checkForBossEvents();
                        const planetEvents = BOSS_SYSTEM.getPlanetEvents(player.planet);

                        // If no events or no specific event specified
                        if (Object.keys(planetEvents).length === 0) {
                            return api.sendMessage(
                                "🔍 KHÔNG TÌM THẤY BOSS NÀO ĐANG XUẤT HIỆN! 🔍\n" +
                                "───────────────\n" +
                                `👁️ Không có boss nào đang xuất hiện tại ${PLANETS[player.planet].name}.\n` +
                                "💡 Boss sẽ xuất hiện ngẫu nhiên, hãy kiểm tra thường xuyên!\n" +
                                "💪 Luyện tập để có đủ sức mạnh đối đầu với các boss.",
                                threadID, messageID
                            );
                        }

                        // If no specific boss is specified, just show list of active bosses
                        if (!target[2]) {
                            let msg = "👹 BOSS ĐANG XUẤT HIỆN 👹\n───────────────\n";

                            Object.values(planetEvents).forEach((event, index) => {
                                const bossHealth = event.boss.health - Object.values(event.damageDealt).reduce((sum, damage) => sum + damage, 0);
                                const healthPercent = Math.max(0, Math.floor((bossHealth / event.boss.health) * 100));
                                const timeLeft = Math.floor((event.expireTime - Date.now()) / 60000); // minutes

                                msg += `${index + 1}. ${event.boss.name}\n`;
                                msg += `📍 Địa điểm: ${event.location.name}\n`;
                                msg += `❤️ HP: ${bossHealth.toLocaleString()}/${event.boss.health.toLocaleString()} (${healthPercent}%)\n`;
                                msg += `💪 Sức mạnh: ${event.boss.power.toLocaleString()}\n`;
                                msg += `⏳ Còn lại: ${timeLeft} phút\n`;
                                msg += `👥 Người tham gia: ${Object.keys(event.participants).length}\n`;
                                msg += `💰 Phần thưởng: ${event.boss.zeniReward.min.toLocaleString()} - ${event.boss.zeniReward.max.toLocaleString()} Zeni\n`;
                                msg += `💡 Để đánh boss: .dball fight boss ${index + 1}\n\n`;
                            });

                            msg += "⚠️ Lưu ý: Cần sức mạnh tối thiểu để đánh boss.\n";
                            msg += "💡 Đánh boss càng nhiều, phần thưởng càng lớn!";

                            return api.sendMessage(msg, threadID, messageID);
                        }

                        // Player wants to fight a specific boss
                        const bossIndex = parseInt(target[2]) - 1;
                        const events = Object.values(planetEvents);

                        if (isNaN(bossIndex) || bossIndex < 0 || bossIndex >= events.length) {
                            return api.sendMessage("❌ Số thứ tự boss không hợp lệ!", threadID, messageID);
                        }

                        const selectedEvent = events[bossIndex];
                        const eventId = selectedEvent.id;

                        // Check if player meets minimum power requirement
                        if (player.stats.power < selectedEvent.boss.minPowerRequired) {
                            return api.sendMessage(
                                `❌ Sức mạnh của bạn không đủ để đối đầu với ${selectedEvent.boss.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Sức mạnh cần thiết: ${selectedEvent.boss.minPowerRequired.toLocaleString()}\n\n` +
                                "💡 Hãy luyện tập thêm để đủ sức đánh boss!",
                                threadID, messageID
                            );
                        }

                        // Check if boss is already defeated
                        if (selectedEvent.defeated) {
                            return api.sendMessage(
                                `❌ ${selectedEvent.boss.name} đã bị đánh bại!\n` +
                                "Hãy chờ boss mới xuất hiện.",
                                threadID, messageID
                            );
                        }

                        // Check player cooldown
                        const now = Date.now();
                        const bossCooldown = 120000; // 2 minutes

                        if (player.lastBossFight && now - player.lastBossFight < bossCooldown) {
                            const timeLeft = Math.ceil((bossCooldown - (now - player.lastBossFight)) / 1000);
                            return api.sendMessage(
                                `⏳ Vui lòng đợi ${timeLeft}s để hồi sức sau khi đánh boss!`,
                                threadID, messageID
                            );
                        }

                        // Create boss object
                        const boss = {
                            id: selectedEvent.boss.id,
                            name: selectedEvent.boss.name,
                            stats: {
                                power: selectedEvent.boss.power,
                                health: selectedEvent.boss.health,
                                damage: selectedEvent.boss.damage,
                                ki: selectedEvent.boss.ki
                            },
                            skills: selectedEvent.boss.skills || []
                        };

                        // Initial message
                        api.sendMessage(
                            `⚔️ CUỘC CHIẾN VỚI BOSS BẮT ĐẦU! ⚔️\n` +
                            `───────────────\n` +
                            `👤 ${player.name} đang tấn công ${boss.name}!\n` +
                            `📍 Địa điểm: ${selectedEvent.location.name}\n` +
                            `💪 Sức mạnh boss: ${boss.stats.power.toLocaleString()}\n\n` +
                            "💡 Đang chiến đấu...",
                            threadID
                        );

                        // Use existing battle simulation
                        const battleResult = simulateBattle(player, boss, {
                            battleType: "BOSS",
                            maxTurns: 15,
                            isPlayerAttacker: true,
                            isPlayerDefender: false,
                            bossMode: true
                        });

                        // Update player stats
                        player.stats.currentKi = battleResult.player1Ki;
                        player.stats.currentHealth = battleResult.player1HP;
                        player.lastBossFight = now;

                        // Calculate damage dealt to boss
                        const damageDealt = battleResult.totalDamageDealt.attacker;

                        // Register damage to the boss event
                        const bossDefeated = BOSS_SYSTEM.registerDamage(eventId, senderID, player.name, damageDealt);

                        // Update player's stats/inventory
                        if (bossDefeated) {
                            // Get rewards based on contribution
                            const rewards = BOSS_SYSTEM.getPlayerRewards(eventId, senderID);

                            if (rewards) {
                                player.stats.exp += rewards.exp;
                                player.stats.zeni += rewards.zeni;

                                // Add items to inventory
                                rewards.drops.forEach(drop => {
                                    if (!player.inventory) player.inventory = { items: [] };
                                    if (!player.inventory.items) player.inventory.items = [];

                                    const existingItem = player.inventory.items.find(i => i.id === drop.item);
                                    if (existingItem) {
                                        existingItem.quantity += drop.quantity;
                                    } else {
                                        player.inventory.items.push({
                                            id: drop.item,
                                            quantity: drop.quantity,
                                            type: "boss_drop"
                                        });
                                    }
                                });

                                // Boss defeat message with rewards
                                api.sendMessage(
                                    `🎉 BOSS ĐÃ BỊ ĐÁNH BẠI! 🎉\n` +
                                    `───────────────\n` +
                                    `👤 ${player.name} đã góp phần đánh bại ${boss.name}!\n` +
                                    `📊 Đóng góp của bạn: ${Math.floor(rewards.contribution * 100)}%\n\n` +
                                    `🎁 Phần thưởng:\n` +
                                    `📊 EXP: +${rewards.exp.toLocaleString()}\n` +
                                    `💰 Zeni: +${rewards.zeni.toLocaleString()}\n` +
                                    (rewards.drops.length > 0
                                        ? `🎁 Vật phẩm: ${rewards.drops.map(d => `${SHOP_ITEMS[d.item.toUpperCase()]?.name || d.item} x${d.quantity}`).join(", ")}\n`
                                        : "") +
                                    `\n💡 Kiểm tra kho đồ với .dball inventory`,
                                    threadID
                                );
                            } else {
                                api.sendMessage(
                                    `🎉 BOSS ĐÃ BỊ ĐÁNH BẠI! 🎉\n` +
                                    `───────────────\n` +
                                    `👤 ${player.name} đã tham gia trận chiến với ${boss.name}!\n` +
                                    `❌ Bạn không gây được đủ sát thương để nhận phần thưởng.\n` +
                                    `💡 Hãy tăng sức mạnh để đóng góp nhiều hơn trong những trận sau!`,
                                    threadID
                                );
                            }
                        } else {
                            // Boss not defeated, show battle result
                            api.sendMessage(
                                `⚔️ KẾT QUẢ ĐÁNH BOSS ⚔️\n` +
                                `───────────────\n` +
                                `👤 ${player.name} VS ${boss.name}\n` +
                                `📍 Địa điểm: ${selectedEvent.location.name}\n\n` +
                                battleResult.battleLog.slice(-8).join("\n") + "\n\n" +
                                `💢 Sát thương đã gây ra: ${damageDealt.toLocaleString()}\n` +
                                `❤️ HP còn lại: ${Math.floor(battleResult.player1HP).toLocaleString()}/${player.stats.health.toLocaleString()}\n` +
                                `✨ Ki còn lại: ${Math.floor(battleResult.player1Ki).toLocaleString()}/${player.stats.ki.toLocaleString()}\n\n` +
                                `💡 Boss vẫn chưa bị đánh bại! Hãy tiếp tục tấn công hoặc rủ thêm người tham gia!`,
                                threadID, messageID
                            );
                        }

                        BOSS_SYSTEM.saveBossData();
                        savePlayerData(playerData);
                        return;
                    }

                    BOSS_SYSTEM.loadBossData();


                    if (target[1]?.toLowerCase() === "tournament" || target[1]?.toLowerCase() === "tour") {

                        const tournamentData = loadTournamentData();
                        if (!tournamentData.active || tournamentData.active.status !== "ongoing") {
                            return api.sendMessage("❌ Không có giải đấu nào đang diễn ra!", threadID, messageID);
                        }

                        if (!tournamentData.registrations[senderID]) {
                            return api.sendMessage("❌ Bạn không tham gia giải đấu này!", threadID, messageID);
                        }

                        const currentMatch = findPlayerMatch(tournamentData, senderID);
                        if (!currentMatch) {
                            return api.sendMessage("❌ Bạn không có trận đấu nào đang diễn ra!", threadID, messageID);
                        }

                        const opponent = currentMatch.player1.id === senderID ? currentMatch.player2 : currentMatch.player1;
                        const opponentData = playerData[opponent.id];
                        if (!opponentData) {
                            return api.sendMessage("❌ Không tìm thấy thông tin đối thủ!", threadID, messageID);
                        }

                        if (Date.now() < currentMatch.scheduledTime) {
                            const timeLeft = Math.ceil((currentMatch.scheduledTime - Date.now()) / 60000);
                            return api.sendMessage(`⏳ Chưa đến lượt đấu của bạn! Vui lòng đợi ${timeLeft} phút nữa.`, threadID, messageID);
                        }

                        api.sendMessage(
                            `🏆 TRẬN ĐẤU BẮT ĐẦU! 🏆\n` +
                            `───────────────\n` +
                            `👥 ${player.name} VS ${opponentData.name}\n` +
                            `🏟️ ${TOURNAMENT_TYPES[tournamentData.active.type].name} - Vòng ${currentMatch.round}\n\n` +
                            `💡 Trận đấu đang diễn ra...`,
                            threadID, messageID
                        );


                        const battleResult = simulateBattle(player, opponentData, {
                            battleType: "TOURNAMENT",
                            maxTurns: 30,
                            isPlayerAttacker: true,
                            isPlayerDefender: true,
                            tournamentMatch: currentMatch
                        });

                        const playerWon =
                            battleResult.winner.id === senderID ||
                            battleResult.winner.name === player.name ||
                            (battleResult.player2HP <= 0 && battleResult.player1HP > 0) ||
                            battleResult.battleLog.some(msg => msg.includes(`${opponentData.name} đã bị đánh bại`));

                        currentMatch.completed = true;

                        if (playerWon) {
                            currentMatch.winner = { id: senderID, name: player.name };
                            currentMatch.loser = { id: opponent.id, name: opponentData.name };


                            checkTournamentQuest(player, tournamentData, {
                                winner: { id: senderID, name: player.name },
                                loser: { id: opponent.id, name: opponentData.name }
                            });
                        } else {
                            currentMatch.winner = { id: opponent.id, name: opponentData.name };
                            currentMatch.loser = { id: senderID, name: player.name };


                            if (opponentData) {
                                checkTournamentQuest(opponentData, tournamentData, {
                                    winner: { id: opponent.id, name: opponentData.name },
                                    loser: { id: senderID, name: player.name }
                                });
                            }
                        }


                        updateTournamentBracket(tournamentData);
                        saveTournamentData(tournamentData);
                        savePlayerData(playerData);

                        player.stats.currentKi = battleResult.player1Ki;
                        opponentData.stats.currentKi = battleResult.player2Ki;

                        if (playerWon) {
                            player.stats.exp += 20;
                        } else {
                            opponentData.stats.exp += 20;
                        }

                        saveTournamentData(tournamentData);
                        savePlayerData(playerData);

                        return api.sendMessage(
                            `🏆 ${playerWon ? "𝐂𝐇𝐈𝐄̂́𝐍 𝐓𝐇𝐀̆́𝐍𝐆!" : "𝐓𝐇𝐀̂́𝐓 𝐁𝐀̣𝐈!"} 🏆\n` +
                            `───────────────\n` +
                            `👑 ${TOURNAMENT_TYPES[tournamentData.active.type].name} - Vòng ${currentMatch.round}\n` +
                            battleResult.battleLog.slice(-7).join("\n") + "\n\n" +
                            `👤 ${playerWon ? player.name : opponentData.name} đã chiến thắng!\n` +
                            `💡 Hãy chờ trận đấu tiếp theo.\n\n` +
                            `💡 Dùng .dball tour bracket để xem bảng đấu`,
                            threadID, messageID
                        );
                    }
                    else if (target[1]?.toLowerCase() === "camp" || target[1]?.toLowerCase() === "doanh" || target[1]?.toLowerCase() === "trại") {

                        const vietnamTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                        const currentHour = vietnamTime.getUTCHours();

                        const isLunchHours = currentHour >= 11 && currentHour < 13;
                        const isEveningHours = currentHour >= 19 && currentHour < 24;

                        if (!isLunchHours && !isEveningHours) {
                            return api.sendMessage(
                                "⏰ DOANH TRẠI ĐỘC NHÃN CHỈ MỞ CỬA TRONG CÁC KHUNG GIỜ! ⏰\n" +
                                "───────────────\n" +
                                "🕚 Buổi trưa: 11:00 - 13:00\n" +
                                "🌙 Buổi tối: 19:00 - 24:00\n\n" +
                                "Vui lòng quay lại trong khung giờ hoạt động.\n" +
                                "Hiện tại: " + vietnamTime.getUTCHours() + ":" +
                                (vietnamTime.getUTCMinutes() < 10 ? "0" : "") + vietnamTime.getUTCMinutes() + "\n\n" +
                                "💡 Bạn có thể đi luyện tập (.dball train) hoặc đánh quái (.dball fight monster) trong lúc chờ đợi!",
                                threadID, messageID
                            );
                        }


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


                        if (player.stats.power < currentLevel.requiredPower) {
                            return api.sendMessage(
                                `❌ 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 không đủ để thách đấu ${currentLevel.name}!\n` +
                                `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 yêu cầu: ${currentLevel.requiredPower.toLocaleString()}\n\n` +
                                "💡 Hãy luyện tập thêm để tăng sức mạnh!",
                                threadID, messageID
                            );
                        }


                        const enemy = {
                            id: 'camp_boss_' + nextLevelIndex,
                            name: currentLevel.enemy,
                            stats: {
                                power: currentLevel.power,
                                health: currentLevel.hp,
                                damage: currentLevel.power / 10,
                                ki: currentLevel.power / 2
                            },
                            skills: [],
                            campLevel: currentLevel
                        };


                        const battleResult = simulateBattle(player, enemy, {
                            battleType: "CAMP",
                            maxTurns: 25,
                            isPlayerAttacker: true,
                            isPlayerDefender: false
                        });

                        player.lastCampFight = now;

                        const playerWon =
                            battleResult.winner?.id === senderID ||
                            (battleResult.player2HP <= 0 && battleResult.player1HP > 0) ||
                            battleResult.winner?.name === player.name;

                        if (playerWon) {
                            player.campProgress++;

                            const dragonBallStar = 7 - Math.min(6, Math.floor(nextLevelIndex / 2));

                            if (!player.inventory) player.inventory = { dragonBalls: [] };
                            if (!player.inventory.dragonBalls) player.inventory.dragonBalls = [];

                            const existingBall = player.inventory.dragonBalls.find(
                                ball => ball.planet === player.planet && ball.star === dragonBallStar
                            );

                            let dragonBallMessage = "";
                            if (!existingBall) {
                                player.inventory.dragonBalls.push({
                                    planet: player.planet,
                                    star: dragonBallStar
                                });

                                const dragonBallData = loadDragonBallData();
                                dragonBallData[player.planet][dragonBallStar] = senderID;
                                saveDragonBallData(dragonBallData);

                                dragonBallMessage = `\n🔮 Bạn đã tìm thấy Ngọc Rồng ${dragonBallStar} sao!`;
                            } else {
                                const zeniBonusDragonBall = 10000 * dragonBallStar;
                                player.stats.zeni += zeniBonusDragonBall;
                                dragonBallMessage = `\n💰 Bạn đã có Ngọc Rồng ${dragonBallStar} sao nên nhận ${zeniBonusDragonBall.toLocaleString()} Zeni!`;
                            }

                            const expGain = Math.floor(currentLevel.exp);
                            const zeniGain = currentLevel.zeni;

                            player.stats.exp += expGain;
                            player.stats.zeni += zeniGain;

                            if (player.stats.exp > MAX_EXP_STORAGE) {
                                player.stats.exp = MAX_EXP_STORAGE;
                            }

                            player.stats.currentHealth = battleResult.player1HP;
                            player.stats.currentKi = battleResult.player1Ki;

                            updateQuestProgress(player, QUEST_TYPES.COMBAT, playerData, { monster: currentLevel.enemy.toLowerCase().replace(/\s+/g, '_') });
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
                                battleResult.battleLog.slice(-8).join("\n") + "\n\n" +
                                `📊 𝗘𝗫𝗣 +${expGain.toLocaleString()}\n` +
                                `💰 𝗭𝗲𝗻𝗶 +${zeniGain.toLocaleString()}\n` +
                                `❤️ HP còn lại: ${Math.floor(battleResult.player1HP).toLocaleString()}/${player.stats.health.toLocaleString()}\n` +
                                `✨ Ki còn lại: ${Math.floor(battleResult.player1Ki).toLocaleString()}/${player.stats.ki.toLocaleString()}` +
                                dragonBallMessage +
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
                                battleResult.battleLog.slice(-8).join("\n") + "\n\n" +
                                `⚠️ Bạn đã thất bại và phải bắt đầu lại từ đầu!\n` +
                                `❤️ HP hiện tại: ${player.stats.currentHealth.toLocaleString()}\n` +
                                `✨ Ki hiện tại: ${player.stats.currentKi.toLocaleString()}\n\n` +
                                `💡 Hãy hồi phục và thử lại sau!`,
                                threadID, messageID
                            );
                        }
                    }

                    else if (target[1]?.toLowerCase() === "monster" || target[1]?.toLowerCase() === "quai") {

                        const monsterType = target[2]?.toLowerCase();
                        const monsterData = monsterType ?
                            Object.entries(MONSTERS).find(([id, data]) => id.toLowerCase() === monsterType || data.name.toLowerCase() === monsterType)?.[1]
                            : selectRandomMonster(player.planet);

                        if (!monsterData) {
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

                        const monster = {
                            id: monsterType || 'random_monster',
                            name: monsterData.name,
                            stats: {
                                power: monsterData.power,
                                health: monsterData.hp || monsterData.health || Math.floor(monsterData.power * 2),
                                currentHealth: monsterData.hp || monsterData.health || Math.floor(monsterData.power * 2),
                                damage: monsterData.damage || Math.floor(monsterData.power / 10),
                                ki: monsterData.ki || Math.floor(monsterData.power / 3),
                                currentKi: monsterData.ki || Math.floor(monsterData.power / 3)
                            },
                            skills: monsterData.skills || [],
                            planet: monsterData.planet,
                            dropChance: monsterData.dropChance || 0
                        };

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


                        const battleResult = simulateBattle(player, monster, {
                            battleType: "MONSTER",
                            maxTurns: 20,
                            isPlayerAttacker: true,
                            isPlayerDefender: false
                        });

                        player.lastMonsterFight = now;


                        const playerWon = battleResult.winner.id === senderID ||
                            (battleResult.winner.name === player.name);

                        if (playerWon) {

                            player.stats.currentHealth = battleResult.player1HP;
                            player.stats.currentKi = battleResult.player1Ki;


                            let expGain = Math.floor(monster.stats.power * 0.1);
                            let zeniGain = Math.floor(monster.stats.power * 0.05) + 100;

                            const playerLevel = player.stats.level || 1;
                            const levelFactor = Math.max(0.5, 2 - Math.log10(playerLevel + 1));
                            expGain = Math.floor(expGain * levelFactor);
                            zeniGain = Math.floor(zeniGain * levelFactor);
                            if (player.stats.exp + expGain > MAX_EXP_STORAGE) {
                                player.stats.exp = MAX_EXP_STORAGE;
                            } else {
                                player.stats.exp += expGain;
                            }

                            player.stats.zeni += zeniGain;

                            player.stats.currentHealth = battleResult.player1HP;
                            player.stats.currentKi = battleResult.player1Ki;


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


                            player.quests.progress[currentQuestId] = (player.quests.progress[currentQuestId] || 0) + 1;
                            const remainingKills = currentQuest.target - player.quests.progress[currentQuestId];

                            updateQuestProgress(player, QUEST_TYPES.COMBAT, playerData, { monster: currentQuest.monster });
                            savePlayerData(playerData);

                            return api.sendMessage(
                                "🏆 𝗖𝗛𝗜𝗘̂́𝗡 𝗧𝗛𝗔̆́𝗡𝗚! 🏆\n" +
                                "───────────────\n" +
                                `🌍 Hành tinh: ${PLANETS[player.planet].name}\n` +
                                battleResult.battleLog.slice(-5).join("\n") + "\n\n" +
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
                        } else {

                            return api.sendMessage(
                                "💀 THẤT BẠI! 💀\n" +
                                "───────────────\n" +
                                `🌍 Hành tinh: ${PLANETS[player.planet].name}\n` +
                                battleResult.battleLog.slice(-5).join("\n") + "\n\n" +
                                `❌ Bạn đã bị đánh bại bởi ${monster.name}!\n` +
                                `❤️ HP của bạn còn: ${Math.floor(battleResult.player1HP).toLocaleString()}/${player.stats.health.toLocaleString()}\n` +
                                `❤️ HP của ${monster.name}: ${Math.floor(battleResult.player2HP).toLocaleString()}/${monster.stats.health.toLocaleString()}\n` +
                                "💡 Hãy luyện tập thêm để trở nên mạnh hơn!",
                                threadID, messageID
                            );
                        }

                        return;
                    }
                    else {

                        const mention = Object.keys(event.mentions)[0];
                        if (!mention) {
                            return api.sendMessage(
                                "❓ Bạn muốn đánh ai?\n" +
                                "───────────────\n" +
                                "• .dball fight @người_chơi - PvP với người chơi khác\n" +
                                "• .dball fight monster - Đánh quái vật\n" +
                                "• .dball fight camp - Đi Doanh Trại Độc Nhãn tìm ngọc rồng\n" +
                                "• .dball fight tour - Đấu đại hội võ thuật\n" +
                                "• .dball fight boss - Đánh boss\n",
                                threadID, messageID
                            );
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


                        const battleResult = simulateBattle(player, opponent, {
                            battleType: "PVP",
                            maxTurns: 30,
                            isPlayerAttacker: true,
                            isPlayerDefender: true
                        });


                        player.stats.currentKi = battleResult.player1Ki;
                        opponent.stats.currentKi = battleResult.player2Ki;


                        player.lastPvpFight = now;
                        opponent.lastPvpFight = now;


                        battleResult.winner.stats.exp += 20;


                        savePlayerData(playerData);
                        const maxLogEntries = 30;
                        const battleLogEntries = battleResult.battleLog.slice(-maxLogEntries);
                        const battleSummary = battleLogEntries.join("\n");

                        const sendBattleInChunks = (battleResult, player1, player2) => {

                            const battleLogs = battleResult.battleLog;
                            const totalTurns = battleLogs.length;
                            const isPlayerWinner = battleResult.winner.id === senderID ||
                                battleResult.winner === player1;


                            const chunk1End = Math.floor(totalTurns * 0.3);
                            const chunk2End = Math.floor(totalTurns * 0.7);


                            const formatLogs = (logs) => {
                                const formattedLogs = [];
                                let turnCounter = 1;

                                logs.forEach(log => {

                                    if (log.includes("Lượt") || log.includes("Turn")) {
                                        formattedLogs.push(`\n🔄 LƯỢT ${turnCounter++} 🔄`);
                                    }


                                    if (log.includes("sử dụng")) {
                                        formattedLogs.push(`🔥 ${log}`);
                                    }

                                    else if (log.includes("sát thương") || log.includes("damage")) {
                                        formattedLogs.push(`💥 ${log}`);
                                    }

                                    else if (log.includes("hồi phục") || log.includes("heal")) {
                                        formattedLogs.push(`✨ ${log}`);
                                    }

                                    else {
                                        formattedLogs.push(`${log}`);
                                    }
                                });

                                return formattedLogs.join("\n");
                            };


                            const chunk1Logs = formatLogs(battleLogs.slice(0, chunk1End));
                            const chunk2Logs = formatLogs(battleLogs.slice(chunk1End, chunk2End));
                            const chunk3Logs = formatLogs(battleLogs.slice(chunk2End));


                            const battleHeader = `⚔️ TRẬN ĐẤU PVP GIỮA ⚔️\n` +
                                `🔵 ${player1.name} (${PLANETS[player1.planet].name}${player1.evolution ? ` - ${player1.evolution.name}` : ''})\n` +
                                `🔴 ${player2.name} (${PLANETS[player2.planet].name}${player2.evolution ? ` - ${player2.evolution.name}` : ''})\n` +
                                `───────────────`;


                            api.sendMessage(
                                `${battleHeader}\n` +
                                `🏁 GIAI ĐOẠN ĐẦU TRẬN 🏁\n` +
                                `───────────────\n` +
                                chunk1Logs,
                                threadID
                            );


                            setTimeout(() => {
                                api.sendMessage(
                                    `${battleHeader}\n` +
                                    `⚡ GIAI ĐOẠN GIỮA TRẬN ⚡\n` +
                                    `───────────────\n` +
                                    chunk2Logs,
                                    threadID
                                );

                                setTimeout(() => {
                                    const expGain = isPlayerWinner ? 20 : 5;
                                    ả
                                    const playerHPPercent = Math.floor((isPlayerWinner ? battleResult.player1HP : battleResult.player2HP) /
                                        battleResult.winner.stats.health * 100);
                                    const playerKiPercent = Math.floor((isPlayerWinner ? battleResult.player1Ki : battleResult.player2Ki) /
                                        battleResult.winner.stats.ki * 100);

                                    const createBar = (percent, fullChar = '🟩', emptyChar = '⬜') => {
                                        const barLength = 10;
                                        const filledCount = Math.ceil(percent * barLength / 100);
                                        return fullChar.repeat(filledCount) + emptyChar.repeat(Math.max(0, barLength - filledCount));
                                    };

                                    const hpBar = createBar(playerHPPercent);
                                    const kiBar = createBar(playerKiPercent, '🟦');

                                    api.sendMessage(
                                        `${battleHeader}\n` +
                                        `🔥 HỒI KẾT TRẬN ĐẤU 🔥\n` +
                                        `───────────────\n` +
                                        chunk3Logs + `\n\n` +
                                        `🏆 KẾT QUẢ TRẬN ĐẤU 🏆\n` +
                                        `───────────────\n` +
                                        `👑 Người thắng: ${battleResult.winner.name}\n` +
                                        `💔 Người thua: ${battleResult.loser.name}\n\n` +
                                        `❤️ HP còn lại: ${Math.floor(isPlayerWinner ? battleResult.player1HP : battleResult.player2HP).toLocaleString()}/${Math.floor(battleResult.winner.stats.health).toLocaleString()} (${playerHPPercent}%)\n${hpBar}\n` +
                                        `✨ Ki còn lại: ${Math.floor(isPlayerWinner ? battleResult.player1Ki : battleResult.player2Ki).toLocaleString()}/${Math.floor(battleResult.winner.stats.ki).toLocaleString()} (${playerKiPercent}%)\n${kiBar}\n\n` +
                                        `💢 Tổng sát thương gây ra: ${battleResult.totalDamage.attacker.toLocaleString()}\n` +
                                        `💢 Tổng sát thương nhận vào: ${battleResult.totalDamage.defender.toLocaleString()}\n\n` +
                                        `📊 𝗘𝗫𝗣 thưởng: +${expGain}\n` +
                                        `⏳ Thời gian hồi PvP: 1 phút`,
                                        threadID,
                                        messageID
                                    );
                                }, 50000);
                            }, 50000);
                        };

                        sendBattleInChunks(battleResult, player, opponent);
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
