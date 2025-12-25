const fs = require("fs");
const path = require("path");
const createTrainImage = require("../game/canvas/dballTrainCanvas.js");
const createMenuImage = require("../game/canvas/dballMenuCanvas.js");
const createAmuletShopImage = require("../game/canvas/dballShopbuaCanvas.js");
const createLearnImage = require("../game/canvas/dballLearnCanvas.js");
const createRadarShopImage = require("../game/canvas/dballShopRadaCanvas.js");
const createRankImage = require("../game/canvas/dballRankCanvas.js");
const createPVPResultImage = require("../game/canvas/dballPvPCanvas.js");

function getFontPath(fontName) {
    return path.join(__dirname, "../fonts", fontName);
}
function getSafeCooldown(cooldowns, skillName) {
    if (!cooldowns || !cooldowns[skillName]) return 0;
    return cooldowns[skillName]?.cooldown || 0;
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
        boost: 0.2,
        emoji: "📡",
        requiredPower: 0
    },
    RADAR_2: {
        id: "radar_2",
        name: "Rada Cấp 2",
        price: 100000000,
        description: "Tăng EXP và sức mạnh nhận được (+40%)",
        type: "radar",
        boost: 0.4,
        emoji: "📡",
        requiredPower: 50000
    },
    RADAR_3: {
        id: "radar_3",
        name: "Rada Cấp 3",
        price: 200000000,
        description: "Tăng đáng kể EXP và sức mạnh nhận được (+60%)",
        type: "radar",
        boost: 0.6,
        emoji: "📡",
        requiredPower: 200000
    },
    RADAR_4: {
        id: "radar_4",
        name: "Rada Cấp 4",
        price: 400000000,
        description: "Tăng nhiều EXP và sức mạnh nhận được (+80%)",
        type: "radar",
        boost: 0.8,
        emoji: "📡",
        requiredPower: 500000
    },
    RADAR_5: {
        id: "radar_5",
        name: "Rada Cấp 5",
        price: 800000000,
        description: "Tăng rất nhiều EXP và sức mạnh nhận được (+100%)",
        type: "radar",
        boost: 1.0,
        emoji: "📡",
        requiredPower: 1000000
    },
    RADAR_6: {
        id: "radar_6",
        name: "Rada Cấp 6",
        price: 1500000000,
        description: "Tăng cực nhiều EXP và sức mạnh nhận được (+130%)",
        type: "radar",
        boost: 1.3,
        emoji: "📡",
        requiredPower: 5000000
    },
    RADAR_7: {
        id: "radar_7",
        name: "Rada Cấp 7",
        price: 3000000000,
        description: "Tăng khổng lồ EXP và sức mạnh nhận được (+160%)",
        type: "radar",
        boost: 1.6,
        emoji: "📡",
        requiredPower: 10000000
    },
    RADAR_8: {
        id: "radar_8",
        name: "Rada Cấp 8",
        price: 6000000000,
        description: "Tăng kinh khủng EXP và sức mạnh nhận được (+200%)",
        type: "radar",
        boost: 2.0,
        emoji: "📡",
        requiredPower: 50000000
    },
    RADAR_9: {
        id: "radar_9",
        name: "Rada Cấp 9",
        price: 10000000000,
        description: "Tăng thần thánh EXP và sức mạnh nhận được (+250%)",
        type: "radar",
        boost: 2.5,
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
        damage: 600,       // Thêm thuộc tính damage
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
        damage: 1000,      // Thêm thuộc tính damage
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
        damage: 1500,      // Thêm thuộc tính damage
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
        damage: 2200,      // Thêm thuộc tính damage
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
        damage: 3500,      // Thêm thuộc tính damage
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
        damage: 5000,      // Thêm thuộc tính damage
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
        damage: 7500,      // Thêm thuộc tính damage
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
        damage: 10000,     // Thêm thuộc tính damage
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
        damage: 15000,     // Thêm thuộc tính damage
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
        damage: 20000,     // Thêm thuộc tính damage
        exp: 20000,
        zeni: 18000,
        requiredPower: 500000,
        dropChance: 0.35,
        dropItem: "armor"
    },
    {
        id: "lab",
        name: "Tầng 5 - Phòng Thí Nghiệm",
        hp: 200000,
        power: 100000,
        damage: 25000,     // Thêm thuộc tính damage
        enemy: "Tiến Sĩ Độc Nhãn",
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
        damage: 40000,     // Thêm thuộc tính damage
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
        damage: 60000,     // Thêm thuộc tính damage
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
        damage: 120000,    // Thêm thuộc tính damage
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
const WORLD_MAP = {
    EARTH: {
        name: "Trái Đất",
        locations: [
            { id: "kame_house", name: "Kame House", description: "Nhà của Master Roshi", isStartPoint: true },
            { id: "capsule_corp", name: "Capsule Corporation", description: "Trụ sở công ty Capsule của gia đình Bulma" },
            { id: "tournament_arena", name: "Đấu Trường Thiên Hạ", description: "Nơi diễn ra Đại Hội Võ Thuật" },
            { id: "korin_tower", name: "Tháp Korin", description: "Tháp cao chứa đậu thần", requiredPower: 50000 },
            { id: "kami_lookout", name: "Khu Vực Canh Gác Của Thần", description: "Nơi ở của Thần Địa Cầu", requiredPower: 200000 },
            { id: "cell_arena", name: "Đấu Trường Cell", description: "Nơi Cell tổ chức Cell Games", requiredPower: 500000 },
            { id: "time_chamber", name: "Phòng Thời Gian", description: "1 ngày ngoài = 1 năm trong phòng", requiredPower: 1000000 }
        ]
    },
    NAMEK: {
        name: "Namek",
        locations: [
            { id: "namek_village", name: "Làng Namek", description: "Ngôi làng của người Namek", isStartPoint: true },
            { id: "guru_house", name: "Nhà Của Đại Trưởng Lão", description: "Nơi ở của vị trưởng lão Namek" },
            { id: "porunga_summoning", name: "Bãi Triệu Hồi Porunga", description: "Vùng đất thiêng để triệu hồi Rồng Thần" },
            { id: "frieza_spaceship", name: "Tàu Vũ Trụ Frieza", description: "Căn cứ của Frieza trên Namek", requiredPower: 100000 },
            { id: "namek_battlefield", name: "Chiến Trường Namek", description: "Nơi diễn ra trận chiến Goku vs Frieza", requiredPower: 300000 },
            { id: "grand_elder", name: "Đại Trưởng Lão", description: "Nơi mở tiềm năng ẩn", requiredPower: 500000 }
        ]
    },
    SAIYAN: {
        name: "Saiyan",
        locations: [
            { id: "saiyan_training", name: "Khu Vực Huấn Luyện", description: "Nơi các chiến binh Saiyan tập luyện", isStartPoint: true },
            { id: "vegeta_palace", name: "Cung Điện Vegeta", description: "Cung điện hoàng gia của tộc Saiyan" },
            { id: "space_pod_station", name: "Trạm Vũ Trụ", description: "Nơi xuất phát các phi thuyền Saiyan" },
            { id: "planet_core", name: "Lõi Hành Tinh", description: "Trung tâm hành tinh với năng lượng dồi dào", requiredPower: 200000 },
            { id: "royal_garden", name: "Vườn Hoàng Gia", description: "Khu vườn của Hoàng tộc Saiyan", requiredPower: 400000 },
            { id: "gravity_chamber", name: "Phòng Trọng Lực", description: "Phòng tập với trọng lực gấp 500 lần", requiredPower: 800000 }
        ]
    },
    UNIVERSE: {
        name: "Vũ Trụ",
        locations: [
            { id: "beerus_planet", name: "Hành Tinh Thần Hủy Diệt", description: "Nơi ở của Thần Hủy Diệt Beerus", requiredPower: 10000000 },
            { id: "kaio_planet", name: "Hành Tinh Kaio", description: "Hành tinh nhỏ của Kaio-sama", requiredPower: 1000000 },
            { id: "universe_arena", name: "Đấu Trường Vũ Trụ", description: "Nơi tổ chức giải đấu sức mạnh", requiredPower: 5000000 },
            { id: "zen_palace", name: "Cung Điện Zenō", description: "Nơi ở của Đấng Tối Cao Zenō", requiredPower: 50000000 }
        ],
        requiredItems: ["universe_key"],
        requiredPower: 5000000
    }
};

const CAPSULE_ITEMS = {
    BASIC_CAPSULE: {
        id: "basic_capsule",
        name: "Capsule",
        price: 100000,
        description: "Dịch chuyển đến các địa điểm cơ bản trong hành tinh",
        type: "teleport",
        range: "planet",
        cooldown: 300000,
        emoji: "💊"
    },
    ADVANCED_CAPSULE: {
        id: "advanced_capsule",
        name: "Capsule VIP",
        price: 500000,
        description: "Dịch chuyển đến các địa điểm nâng cao trong hành tinh",
        type: "teleport",
        range: "planet_advanced",
        cooldown: 600000,
        requiredPower: 200000,
        emoji: "💊"
    },
    PLANET_CAPSULE: {
        id: "planet_capsule",
        name: "Capsule VIP2",
        price: 2000000,
        description: "Dịch chuyển giữa các hành tinh",
        type: "teleport",
        range: "interplanetary",
        cooldown: 1800000,
        requiredPower: 1000000,
        emoji: "🚀"
    },
    UNIVERSE_CAPSULE: {
        id: "universe_capsule",
        name: "Capsule VIP3",
        price: 10000000,
        description: "Dịch chuyển đến bất kỳ đâu trong vũ trụ",
        type: "teleport",
        range: "universe",
        cooldown: 3600000,
        requiredPower: 5000000,
        emoji: "✨"
    },
    UNIVERSE_KEY: {
        id: "universe_key",
        name: "Chìa Khóa Vũ Trụ",
        price: 5000000,
        description: "Chìa khóa để mở khóa các địa điểm vũ trụ",
        type: "key",
        emoji: "🔑"
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
function startTournament(api, threadID) {
    const tournamentData = loadTournamentData();

    if (!tournamentData.active || tournamentData.active.status !== "registration") {
        return;
    }

    const tournamentType = TOURNAMENT_TYPES[tournamentData.active.type];
    const participantCount = Object.keys(tournamentData.registrations).length;

    if (participantCount < tournamentType.minPlayers) {
        api.sendMessage(
            `❌ Không đủ người tham gia để bắt đầu ${tournamentType.name}!\n` +
            `👥 Hiện tại chỉ có: ${participantCount} người\n` +
            `👥 Yêu cầu tối thiểu: ${tournamentType.minPlayers} người\n\n` +
            "🏆 Giải đấu đã bị hủy, lệ phí sẽ được hoàn trả.",
            threadID
        );

        const playerData = loadPlayerData();
        Object.keys(tournamentData.registrations).forEach(playerId => {
            if (playerData[playerId]) {
                playerData[playerId].stats.zeni += tournamentType.entryFee;
            }
        });
        savePlayerData(playerData);

        tournamentData.active = null;
        tournamentData.registrations = {};
        saveTournamentData(tournamentData);
        return;
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
    tournamentData.active.matches = [];

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

    api.sendMessage(
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
        threadID
    );
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
    COMBAT: "COMBAT",
    POWER: "POWER",
    TRAINING: "TRAINING",
    COLLECT: "COLLECT",
    MASTER: "MASTER",
    TOURNAMENT: "TOURNAMENT"
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
        "SAIYAN_DODORIA_ZARBON",
        "DRAGON_BALL_1",

        // Luyện tập cấp độ
        "POWER_LV1",
        "SAIYAN_WARRIOR",

        "SAIYAN_CUI",
        // Thách thức tinh nhuệ
        "SAIYAN_ELITE",
        "POWER_LV2",
        "TOURNAMENT_BEGINNER",

        "SAIYAN_GINYU_FORCE",
        // Siêu Saiyan huyền thoại
        "SAIYAN_FRIEZA_1",
        "SAIYAN_FRIEZA_FINAL",
        "TOURNAMENT_TENKAICHI",

        "SAIYAN_COOLER",
        // Đỉnh cao sức mạnh
        "TOURNAMENT_UNIVERSE",
        "SAIYAN_BROLY",
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
    SAIYAN_DODORIA_ZARBON: {
        id: "SAIYAN_DODORIA_ZARBON",
        name: "Thuộc hạ của Frieza",
        description: "Đánh bại Dodoria và Zarbon, thuộc hạ của Frieza",
        type: QUEST_TYPES.COMBAT,
        target: 2,
        monster: "frieza_henchman",
        reward: {
            exp: 15000,
            zeni: 12000,
            item: "senzu",
            quantity: 3,
            description: "15000 EXP, 12000 Zeni, 3 Đậu Thần"
        }
    },
    SAIYAN_CUI: {
        id: "SAIYAN_CUI",
        name: "Đối thủ của Vegeta",
        description: "Đánh bại Cui, chiến binh tinh nhuệ của đội quân Frieza",
        type: QUEST_TYPES.COMBAT,
        target: 3,
        monster: "cui",
        reward: {
            exp: 25000,
            zeni: 20000,
            item: "scouter",
            quantity: 1,
            description: "25000 EXP, 20000 Zeni, 1 Thiết bị đo sức mạnh"
        }
    },
    SAIYAN_GINYU_FORCE: {
        id: "SAIYAN_GINYU_FORCE",
        name: "Đội Đặc Nhiệm Ginyu",
        description: "Đánh bại 5 thành viên của Đội Đặc Nhiệm Ginyu",
        type: QUEST_TYPES.COMBAT,
        target: 5,
        monster: "ginyu_force",
        reward: {
            exp: 35000,
            zeni: 30000,
            item: "armor",
            quantity: 2,
            description: "35000 EXP, 30000 Zeni, 2 Áo Giáp Saiyan"
        }
    },
    SAIYAN_FRIEZA_1: {
        id: "SAIYAN_FRIEZA_1",
        name: "Kẻ Hủy Diệt Tộc Saiyan",
        description: "Đánh bại Frieza Dạng 1, kẻ đã hủy diệt hành tinh Vegeta",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_1",
        reward: {
            exp: 50000,
            zeni: 45000,
            item: "crystal",
            quantity: 3,
            description: "50000 EXP, 45000 Zeni, 3 Tinh Thể Sức Mạnh"
        }
    },
    SAIYAN_FRIEZA_FINAL: {
        id: "SAIYAN_FRIEZA_FINAL",
        name: "Trả Thù Cho Tộc Saiyan",
        description: "Đánh bại Frieza Dạng Cuối và trả thù cho sự diệt vong của tộc Saiyan",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "frieza_final",
        reward: {
            exp: 70000,
            zeni: 60000,
            item: "super_battle_gloves",
            quantity: 1,
            description: "70000 EXP, 60000 Zeni, 1 Găng Tay Siêu Chiến"
        }
    },
    SAIYAN_COOLER: {
        id: "SAIYAN_COOLER",
        name: "Anh Trai Của Frieza",
        description: "Đánh bại Cooler, anh trai mạnh hơn của Frieza",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "cooler",
        reward: {
            exp: 100000,
            zeni: 80000,
            item: "crystal",
            quantity: 5,
            description: "100000 EXP, 80000 Zeni, 5 Tinh Thể Sức Mạnh"
        }
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
                name: "Võ Sĩ Trần Trụi",
                powerRequired: 0,
                description: "Con người bình thường chưa khai phá tiềm năng",
                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },
            {
                name: "Môn Đồ Kame",
                powerRequired: 100000,
                description: "Đệ tử được đào tạo từ phái Kame",
                kiBonus: 1.5,
                healthBonus: 1.2,
                damageBonus: 1.3
            },
            {
                name: "Kiếm Khách Thần Tốc",
                powerRequired: 1000000,
                description: "Luyện tập đến mức đạt tốc độ ánh sáng",
                kiBonus: 2.2,
                healthBonus: 1.5,
                damageBonus: 1.8
            },
            {
                name: "Siêu Nhân Trái Đất",
                powerRequired: 10000000,
                description: "Phá vỡ giới hạn sức mạnh nhân loại",
                kiBonus: 2.5,
                healthBonus: 2.0,
                damageBonus: 2.5
            },
            {
                name: "Bá Vương Khí Công",
                powerRequired: 50000000,
                description: "Làm chủ hoàn toàn nguồn khí vô tận",
                kiBonus: 3.5,
                healthBonus: 2.8,
                damageBonus: 3.5
            },
            {
                name: "Võ Thần Nhân Loại",
                powerRequired: 100000000,
                description: "Đỉnh cao võ thuật của giống loài con người",
                kiBonus: 4.5,
                healthBonus: 3.5,
                damageBonus: 5.0
            },
            {
                name: "Thánh Nhân Khí",
                powerRequired: 500000000,
                description: "Khí chất hóa thần thánh, uy lực vô song",
                kiBonus: 6.0,
                healthBonus: 5.0,
                damageBonus: 7.0
            },
            {
                name: "Thiên Địa Vô Cực",
                powerRequired: 10000000000,
                description: "Võ đạo hòa làm một với trời đất",
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
                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },

            {
                name: "Namek Warrior",
                powerRequired: 100000,
                description: "Chiến binh Namek ưu tú",
                kiBonus: 1.3,
                healthBonus: 1.2,
                damageBonus: 1.2
            },

            {
                name: "Super Namek",
                powerRequired: 1000000,
                description: "Namek siêu cấp với sức mạnh phi thường",
                kiBonus: 2.2,
                healthBonus: 1.8,
                damageBonus: 2.0
            },

            {
                name: "Namek Fusion",
                powerRequired: 10000000,
                description: "Namek hợp thể với sức mạnh của nhiều Namek",
                kiBonus: 2.8,
                healthBonus: 2.5,
                damageBonus: 2.8
            },

            {
                name: "Namek Dragon",
                powerRequired: 50000000,
                description: "Thức tỉnh huyết thống Rồng Thần trong cơ thể",
                kiBonus: 4.0,
                healthBonus: 3.5,
                damageBonus: 4.0
            },
            {
                name: "Red-Eyed Namek",
                powerRequired: 500000000,
                description: "Năng lượng cơ thể chuyển đổi hoàn toàn, mắt đỏ ngầu",

                kiBonus: 5.5,
                healthBonus: 4.5,
                damageBonus: 6.0
            },
            {
                name: "Dragon Clan Master",
                powerRequired: 5000000000,
                description: "Chưởng môn tộc Rồng, điều khiển phép thuật cổ đại",

                kiBonus: 7.0,
                healthBonus: 6.0,
                damageBonus: 8.0
            },
            {
                name: "Porunga Vessel",
                powerRequired: 50000000000,
                description: "Hợp thể với Porunga, đạt sức mạnh tối thượng",

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

                kiBonus: 1.0,
                healthBonus: 1.0,
                damageBonus: 1.0
            },
            {
                name: "Super Saiyan",
                powerRequired: 1000000,
                description: "Truyền thuyết của tộc Saiyan",

                kiBonus: 1.4,
                healthBonus: 1.3,
                damageBonus: 1.7
            },
            {
                name: "Super Saiyan 2",
                powerRequired: 10000000,
                description: "Siêu Saiyan cấp 2 với sức mạnh kinh hoàng",

                kiBonus: 1.8,
                healthBonus: 1.6,
                damageBonus: 2.2
            },
            {
                name: "Super Saiyan 3",
                powerRequired: 50000000,
                description: "Siêu Saiyan cấp 3 với sức mạnh hủy diệt",

                kiBonus: 2.5,
                healthBonus: 2.0,
                damageBonus: 3.0
            },
            {
                name: "Super Saiyan God",
                powerRequired: 100000000,
                description: "𝗦𝘂̛́𝗰 𝗺𝗮̣𝗻𝗵 thần thánh của các vị thần",

                kiBonus: 4.0,
                healthBonus: 3.0,
                damageBonus: 5.0
            },
            {
                name: "Super Saiyan Blue",
                powerRequired: 1500000000,
                description: "Kết hợp sức mạnh thần thánh với siêu saiyan",

                kiBonus: 5.0,
                healthBonus: 4.0,
                damageBonus: 7.0
            },
            {
                name: "Ultra Instinct",
                powerRequired: 100000000000,
                description: "Bản năng vô cực - sức mạnh của các thiên sứ",

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
        damage: 80,         // Thêm sát thương
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
        damage: 150,        // Thêm sát thương
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
        damage: 50,         // Thêm sát thương
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
        damage: 5000,       // Tăng sát thương
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
        damage: 15000,      // Tăng sát thương
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
        damage: 30000,      // Tăng sát thương
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
        damage: 40000,      // Tăng sát thương
        exp: 8000,
        zeni: 5000,
        dropChance: 0.22,
        dropItem: "armor",
        planet: "EARTH"
    },
    frieza_henchman: {
        name: "Thuộc hạ của Frieza",
        hp: 5000,
        power: 4000,
        damage: 1000,       // Thêm sát thương
        exp: 1200,
        zeni: 800,
        dropChance: 0.12,
        dropItem: "scouter",
        planet: "SAIYAN"
    },
    cui: {
        name: "Cui",
        hp: 7000,
        power: 6000,
        damage: 1500,       // Thêm sát thương
        exp: 1800,
        zeni: 1000,
        dropChance: 0.15,
        dropItem: "crystal",
        planet: "SAIYAN"
    },
    Cooler: {
        name: "Cooler",
        hp: 40000,
        power: 35000,
        damage: 12000,      // Tăng sát thương
        exp: 8000,
        zeni: 5000,
        dropChance: 0.25,
        dropItem: "royal_boots",
        planet: "SAIYAN"
    },
    babidi: {
        name: "Babidi",
        hp: 50000,
        power: 200000,
        damage: 30000,      // Tăng sát thương
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
        damage: 70000,      // Tăng sát thương
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
        damage: 120000,     // Tăng sát thương
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
        damage: 100,        // Thêm sát thương
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
        damage: 3000,       // Thêm sát thương
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
        damage: 25000,      // Tăng sát thương
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
        damage: 5000,       // Thêm sát thương
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
        damage: 120,        // Thêm sát thương
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
        damage: 900,        // Thêm sát thương
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
        damage: 1200,       // Thêm sát thương
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
        damage: 2500,       // Thêm sát thương
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
        damage: 300,        // Thêm sát thương
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
        damage: 80,         // Thêm sát thương
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
        damage: 2000,       // Thêm sát thương
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
        damage: 3000,       // Thêm sát thương
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
        damage: 3200,       // Thêm sát thương
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
        damage: 3200,       // Thêm sát thương
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
        damage: 5500,       // Thêm sát thương
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
        damage: 8000,       // Thêm sát thương
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
        damage: 10000,      // Thêm sát thương
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
        damage: 15000,      // Thêm sát thương
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
        damage: 25000,      // Thêm sát thương
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
        damage: 220,        // Thêm sát thương
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
        damage: 1300,       // Thêm sát thương
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
        damage: 4000,       // Thêm sát thương
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
        damage: 7000,       // Thêm sát thương
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
        damage: 800,        // Thêm sát thương
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
        damage: 500,        // Thêm sát thương
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
        damage: 300,        // Thêm sát thương
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
            DEMON_PUNCH: {
                name: "Đấm Demon",
                powerScale: 1.2,
                kiCost: 0.2,
                powerRequired: 0,
                description: "Đấm Demon cơ bản của người Namek"
            },
            MASENKO: {
                name: "Masenko",
                powerScale: 1.5,
                kiCost: 0.3,
                powerRequired: 50000,
                description: "Chưởng năng lượng hủy diệt của người Namek",
            },
            HEALING: {
                name: "Trị Thương",
                powerScale: 0,
                kiCost: 0.4,
                powerRequired: 500000,
                description: "Khả năng tái tạo tế bào độc đáo của tộc Namek, hồi 50% HP"
            },
            RAPID_PUNCH: {
                name: "Đấm Liên Hoàn",
                powerScale: 1.6,
                kiCost: 0.25,
                powerRequired: 1000000,
                description: "Đòn tấn công liên tiếp tốc độ cao, tốn Ki nhưng không cần hồi chiêu"
            },
            MAKANKOSAPPO: {
                name: "Makankosappo",
                powerScale: 2.2,
                kiCost: 0.5,
                powerRequired: 5000000,
                description: "Xoáy ma khoan xuyên thủng của Piccolo, gây sát thương lớn"
            },
            ENERGY_SHIELD: {
                name: "Khiên Năng Lượng",
                powerScale: 0,
                kiCost: 0.7,
                powerRequired: 5000000000,
                description: "Giảm 50% sát thương nhận vào trong 3 lượt"
            },
            EVIL_CONTAINMENT: {
                name: "Ma Phong Ba",
                powerScale: 0,
                kiCost: 0.8,
                powerRequired: 10000000000,
                description: "Bí kỹ cổ xưa nhốt đối thủ vào bình chứa, đối thủ không thể hành động trong 3 lượt"
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
const BOSS_SYSTEM = {
    activeEvents: {},
    bossList: {
        EARTH: [
            {
                id: "mercenary_tao",
                name: "Đại Tá Tào Phai",
                description: "Sát thủ máu lạnh của Quân Đoàn Rồng Đỏ",
                power: 300000,
                health: 800000,
                damage: 150000,
                ki: 200000,
                skills: ["DODONPA", "CRANE_STYLE"],
                drops: [
                    { item: "crystal", chance: 0.8, quantity: 2 },
                    { item: "senzu", chance: 1.0, quantity: 3 }
                ],
                minPowerRequired: 100000,
                zeniReward: { min: 100000, max: 300000 },
                expReward: 50000,
                image: "https://imgur.com/oYYuIhY.jpg",
                spawnChance: 0.4, // Tỉ lệ xuất hiện cao
                duration: 2700000 // 45 phút
            },
            {
                id: "cyborg_tao",
                name: "Tào Phai Người Máy",
                description: "Phiên bản nâng cấp của Đại Tá Tào Phai",
                power: 600000,
                health: 1500000,
                damage: 300000,
                ki: 400000,
                skills: ["SUPER_DODONPA", "CRANE_KICK"],
                drops: [
                    { item: "crystal", chance: 0.8, quantity: 3 },
                    { item: "senzu", chance: 1.0, quantity: 4 }
                ],
                minPowerRequired: 200000,
                zeniReward: { min: 200000, max: 500000 },
                expReward: 80000,
                image: "https://imgur.com/o22ziEa.jpg",
                spawnChance: 0.35, // Tỉ lệ xuất hiện khá cao
                duration: 3600000 // 1 giờ
            },
            {
                id: "king_piccolo",
                name: "Đại Ma Vương Piccolo",
                description: "Ma vương của Địa Cầu, từng suýt hủy diệt thế giới",
                power: 1500000,
                health: 5000000,
                damage: 500000,
                ki: 500000,
                skills: ["DEMON_PUNCH", "NAMEK_FUSION"],
                drops: [
                    { item: "turtle_gi", chance: 0.5 },
                    { item: "crystal", chance: 0.7, quantity: 3 },
                    { item: "senzu", chance: 1.0, quantity: 5 }
                ],
                minPowerRequired: 500000,
                zeniReward: { min: 500000, max: 1000000 },
                expReward: 200000,
                image: "https://imgur.com/2AtrNjL.jpg",
                spawnChance: 0.3,
                duration: 3600000
            },
            {
                id: "cell",
                name: "Cell Hoàn Hảo",
                description: "Sinh vật nhân tạo hoàn hảo do tiến sĩ Gero tạo ra",
                power: 5000000,
                health: 15000000,
                damage: 1500000,     // Tăng sát thương
                ki: 1000000,
                skills: ["KAMEHAMEHA", "SOLAR_FLARE", "SPIRIT_BOMB"],
                drops: [
                    { item: "weighted_clothing", chance: 0.4 },
                    { item: "crystal", chance: 0.8, quantity: 5 },
                    { item: "senzu", chance: 1.0, quantity: 10 }
                ],
                minPowerRequired: 2000000,
                zeniReward: { min: 1000000, max: 3000000 },
                expReward: 500000,
                image: "https://imgur.com/0cbG1R1.jpg",
                spawnChance: 0.15,
                duration: 7200000
            }
        ],
        NAMEK: [
            {
                id: "dodoria_squad",
                name: "Đội Trưởng Dodoria",
                description: "Thủ hạ đắc lực của Frieza, chỉ huy đội quân xâm lược Namek",
                power: 400000,
                health: 1000000,
                damage: 200000,
                ki: 300000,
                skills: ["ENERGY_CANNON", "DEATH_BEAM"],
                drops: [
                    { item: "crystal", chance: 0.7, quantity: 2 },
                    { item: "senzu", chance: 1.0, quantity: 3 }
                ],
                minPowerRequired: 150000,
                zeniReward: { min: 150000, max: 400000 },
                expReward: 60000,
                image: "https://imgur.com/ZsJZMgF.jpg",
                spawnChance: 0.45, // Tỉ lệ xuất hiện rất cao
                duration: 2700000 // 45 phút
            },
            {
                id: "zarbon_monster",
                name: "Zarbon Dạng Quái Vật",
                description: "Hình dạng biến đổi của Zarbon, tăng sức mạnh gấp nhiều lần",
                power: 800000,
                health: 2000000,
                damage: 400000,
                ki: 600000,
                skills: ["ELEGANT_BLASTER", "MONSTER_CRUSH"],
                drops: [
                    { item: "crystal", chance: 0.8, quantity: 3 },
                    { item: "senzu", chance: 1.0, quantity: 5 }
                ],
                minPowerRequired: 300000,
                zeniReward: { min: 300000, max: 600000 },
                expReward: 100000,
                image: "https://imgur.com/jjvvAox.jpg",
                spawnChance: 0.35, // Tỉ lệ xuất hiện khá cao
                duration: 3600000 // 1 giờ
            },
            {
                id: "frieza",
                name: "Frieza Dạng Cuối",
                description: "Hoàng đế vũ trụ tàn bạo, người đã hủy diệt hành tinh Vegeta",
                power: 3000000,
                health: 10000000,
                damage: 1000000,     // Tăng sát thương
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
                image: "https://imgur.com/mC4n7UV.jpg",
                spawnChance: 0.2,
                duration: 5400000
            },
            {
                id: "cooler",
                name: "Cooler Dạng Thứ 5",
                description: "Anh trai của Frieza, mạnh hơn em trai mình",
                power: 6000000,
                health: 18000000,
                damage: 1800000,     // Tăng sát thương
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
                image: "https://imgur.com/Dogn2Gk.jpg",
                spawnChance: 0.1,
                duration: 7200000
            }
        ],
        SAIYAN: [
            {
                id: "nappa_elite",
                name: "Nappa Tinh Nhuệ",
                description: "Chiến binh Saiyan cấp cao, cựu chỉ huy đội quân hoàng gia",
                power: 500000,
                health: 1200000,
                damage: 250000,
                ki: 400000,
                skills: ["GIANT_STORM", "BREAK_CANNON"],
                drops: [
                    { item: "crystal", chance: 0.7, quantity: 2 },
                    { item: "senzu", chance: 1.0, quantity: 4 }
                ],
                minPowerRequired: 200000,
                zeniReward: { min: 200000, max: 450000 },
                expReward: 70000,
                image: "https://imgur.com/ayzW24V.jpg",
                spawnChance: 0.4, // Tỉ lệ xuất hiện cao
                duration: 3600000 // 1 giờ
            },
            {
                id: "saiyan_squad",
                name: "Đội Đặc Nhiệm Saiyan",
                description: "Nhóm chiến binh Saiyan tinh nhuệ còn sót lại",
                power: 700000,
                health: 1800000,
                damage: 350000,
                ki: 500000,
                skills: ["DOUBLE_SUNDAY", "SATURDAY_CRUSH"],
                drops: [
                    { item: "crystal", chance: 0.8, quantity: 3 },
                    { item: "senzu", chance: 1.0, quantity: 5 }
                ],
                minPowerRequired: 250000,
                zeniReward: { min: 250000, max: 500000 },
                expReward: 90000,
                image: "https://imgur.com/qtsWBsI.jpg",
                spawnChance: 0.35, // Tỉ lệ xuất hiện khá cao
                duration: 3600000 // 1 giờ
            },
            {
                id: "broly",
                name: "Broly Super Saiyan Huyền Thoại",
                description: "Super Saiyan huyền thoại, sinh ra với sức mạnh kinh khủng",
                power: 8000000,
                health: 25000000,
                damage: 2400000,     // Tăng sát thương
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
                image: "https://imgur.com/PYh6JPh.jpg",
                spawnChance: 0.1,
                duration: 10800000
            },
            {
                id: "beerus",
                name: "Thần Hủy Diệt Beerus",
                description: "Vị thần hủy diệt của vũ trụ 7, luôn tìm kiếm thức ăn ngon",
                power: 20000000,
                health: 50000000,
                damage: 6000000,     // Tăng sát thương
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
                image: "https://imgur.com/wahYEk1.jpg",
                spawnChance: 0.05,
                duration: 14400000
            }
        ]
    },

    checkForBossEvents() {
        const now = Date.now();

        Object.keys(this.activeEvents).forEach(eventId => {
            const event = this.activeEvents[eventId];
            if (now > event.expireTime) {
                console.log(`Boss event expired: ${event.boss.name} at ${event.location.name}`);
                delete this.activeEvents[eventId];
            }
        });

        if (Object.keys(this.activeEvents).length >= 3) {
            return;
        }

        if (Math.random() > 0.1) return;

        const planetKeys = Object.keys(PLANETS);
        const randomPlanet = planetKeys[Math.floor(Math.random() * planetKeys.length)];

        const bossList = this.bossList[randomPlanet];
        if (!bossList || bossList.length === 0) return;

        const randomBoss = bossList[Math.floor(Math.random() * bossList.length)];

        const locationList = WORLD_MAP[randomPlanet]?.locations;
        if (!locationList || locationList.length === 0) return;

        const eligibleLocations = locationList.filter(loc => !loc.isStartPoint);
        if (eligibleLocations.length === 0) return;

        const randomLocation = eligibleLocations[Math.floor(Math.random() * eligibleLocations.length)];

        if (Math.random() > randomBoss.spawnChance) return;

        const eventId = `${randomPlanet}_${randomBoss.id}_${now}`;
        this.activeEvents[eventId] = {
            id: eventId,
            planet: randomPlanet,
            location: randomLocation,
            boss: randomBoss,
            participants: {},
            damageDealt: {},
            spawnTime: now,
            expireTime: now + randomBoss.duration,
            defeated: false
        };

        console.log(`New boss spawned: ${randomBoss.name} at ${randomLocation.name} on ${randomPlanet}`);
    },

    getActiveEvents() {
        return this.activeEvents;
    },

    getPlanetEvents(planet) {
        const events = {};
        Object.keys(this.activeEvents).forEach(eventId => {
            if (this.activeEvents[eventId].planet === planet) {
                events[eventId] = this.activeEvents[eventId];
            }
        });
        return events;
    },

    registerDamage(eventId, playerId, playerName, damageAmount) {
        if (!this.activeEvents[eventId]) return false;

        const event = this.activeEvents[eventId];

        if (!event.participants[playerId]) {
            event.participants[playerId] = {
                id: playerId,
                name: playerName,
                joinTime: Date.now()
            };
        }

        if (!event.damageDealt[playerId]) {
            event.damageDealt[playerId] = 0;
        }
        event.damageDealt[playerId] += damageAmount;

        const totalDamage = Object.values(event.damageDealt).reduce((sum, damage) => sum + damage, 0);
        if (totalDamage >= event.boss.health && !event.defeated) {
            event.defeated = true;
            event.defeatTime = Date.now();
            console.log(`Boss defeated: ${event.boss.name} at ${event.location.name}`);
        }

        return event.defeated;
    },

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

        const zeniBase = event.boss.zeniReward.min + Math.random() * (event.boss.zeniReward.max - event.boss.zeniReward.min);
        const zeniReward = Math.floor(zeniBase * contributionRatio);
        const expReward = Math.floor(event.boss.expReward * contributionRatio);

        const drops = [];
        event.boss.drops.forEach(drop => {
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

    loadBossData() {
        try {
            const bossDataPath = path.join(__dirname, "json", "dragonball", "boss_events.json");
            if (fs.existsSync(bossDataPath)) {
                const data = JSON.parse(fs.readFileSync(bossDataPath, "utf8"));

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

    saveBossData() {
        try {
            const bossDataPath = path.join(__dirname, "json", "dragonball", "boss_events.json");
            fs.writeFileSync(bossDataPath, JSON.stringify(this.activeEvents, null, 2));
        } catch (error) {
            console.error("Error saving boss data:", error);
        }
    }
};

function updateCooldowns(skillCooldowns) {
    for (const skill in skillCooldowns) {
        if (skillCooldowns[skill].currentCooldown > 0) {
            skillCooldowns[skill].currentCooldown--;
        }
    }
}
function checkPlayer(api, event, player) {
    if (!player) {
        api.sendMessage("❌ Bạn chưa tạo nhân vật! Gõ .dball để tạo nhân vật mới.", event.threadID, event.messageID);
        return false;
    }
    return true;
}
function initializeSkillCooldowns() {
    return {
        WHISTLE: { cooldown: 6, currentCooldown: 0, usesLeft: 1 },
        REGENERATE_ENERGY: { cooldown: 5, currentCooldown: 0, usesLeft: 1 },
        MASENKO: { cooldown: 3, currentCooldown: 0 },
        HEALING: { cooldown: 5, currentCooldown: 0, usesLeft: 1 },
        MAKANKOSAPPO: { cooldown: 10, currentCooldown: 0 },
        RAPID_PUNCH: { cooldown: 0, currentCooldown: 0 },

        EVIL_CONTAINMENT: { cooldown: 0, currentCooldown: 0, usesLeft: 1, battleOnly: true },

        // Kỹ năng phòng thủ
        ENERGY_SHIELD: { cooldown: 4, currentCooldown: 0, usesLeft: 2 },
        KHIEN_NANG_LUONG: { cooldown: 4, currentCooldown: 0, usesLeft: 2 },
        // Kỹ năng kiểm soát
        BIND: { cooldown: 4, currentCooldown: 0, usesLeft: 2 },
        TROI: { cooldown: 4, currentCooldown: 0, usesLeft: 2 },
        SOLAR_FLARE: { cooldown: 3, currentCooldown: 0, usesLeft: 2 },
        HYPNOSIS: { cooldown: 5, currentCooldown: 0, usesLeft: 1 },

        // Kỹ năng biến hình
        KAIOKEN: { cooldown: 0, currentCooldown: 0, usesLeft: 1 },
        GREAT_APE: { cooldown: 0, currentCooldown: 0, usesLeft: 1 },
        // Kỹ năng tấn công đặc biệt
        SPIRIT_BOMB: { cooldown: 8, currentCooldown: 0, usesLeft: 1 },
        CADICH_LIEN_HOAN_TRUONG: { cooldown: 6, currentCooldown: 0, usesLeft: 1, lateTurn: true },

    };
}
function selectRandomMonster(planet) {
    const planetMonsters = Object.values(MONSTERS).filter(monster =>
        monster.planet === planet
    );

    if (planetMonsters.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * planetMonsters.length);
    return planetMonsters[randomIndex];
}
function applyEquipmentBoosts(player) {

    const boostMultipliers = {
        damage: 1.0,
        health: 1.0,
        ki: 1.0
    };

    if (!player.baseStats) {
        player.baseStats = {
            damage: player.stats.damage || 100,
            health: player.stats.health || 1000,
            ki: player.stats.ki || 100
        };
    } else {
        // Ensure base stats have valid values
        player.baseStats.damage = player.baseStats.damage || 100;
        player.baseStats.health = player.baseStats.health || 1000;
        player.baseStats.ki = player.baseStats.ki || 100;
        
        player.stats.damage = player.baseStats.damage;
        player.stats.health = player.baseStats.health;
        player.stats.ki = player.baseStats.ki;
    }
    
    if (player.inventory?.items) {
        player.inventory.items.forEach(item => {
            if (item.equipped) {
               
            }
        });
    }

    player.stats.damage = Math.floor((player.baseStats.damage || 100) * boostMultipliers.damage);
    player.stats.health = Math.floor((player.baseStats.health || 1000) * boostMultipliers.health);
    player.stats.ki = Math.floor((player.baseStats.ki || 100) * boostMultipliers.ki);

    player.stats.currentHealth = Math.min(
        player.stats.currentHealth || player.stats.health,
        player.stats.health
    );
    player.stats.currentKi = Math.min(
        player.stats.currentKi || player.stats.ki,
        player.stats.ki
    );

    if (isNaN(player.stats.currentHealth) || player.stats.currentHealth === undefined) {
        player.stats.currentHealth = player.stats.health;
    }
    
    if (isNaN(player.stats.currentKi) || player.stats.currentKi === undefined) {
        player.stats.currentKi = player.stats.ki;
    }

    return player;
}
function validatePlayerStats(player) {
    if (!player.stats) {
        player.stats = { ...DEFAULT_STATS };
        return player;
    }
    
    player.stats.power = player.stats.power || 1000;
    player.stats.damage = player.stats.damage || 100;
    player.stats.ki = player.stats.ki || 100;
    player.stats.health = player.stats.health || 1000;
    player.stats.exp = player.stats.exp || 0;
    player.stats.zeni = player.stats.zeni || 0;
    
    if (isNaN(player.stats.currentHealth) || player.stats.currentHealth === undefined) {
        player.stats.currentHealth = player.stats.health;
    }
    
    if (isNaN(player.stats.currentKi) || player.stats.currentKi === undefined) {
        player.stats.currentKi = player.stats.ki;
    }
    
    return player;
}

function updatePlayerLocation(player) {
    if (!player.location) {
        const startLocation = WORLD_MAP[player.planet]?.locations.find(loc => loc.isStartPoint) ||
            WORLD_MAP[player.planet]?.locations[0];

        if (startLocation) {
            player.location = {
                planet: player.planet,
                locationId: startLocation.id,
                name: startLocation.name,
                lastTeleport: 0
            };
        }
    }
    return player;
}
function simulateBattle(player1, player2, options = {}) {
    const isMonsterBattle = player2.hp !== undefined;

    const dramaticMoments = [];

    const battleState = {

        player1Ki: player1.stats.currentKi || player1.stats.ki,
        player1HP: player1.stats.currentHealth || player1.stats.health,

        player2Ki: isMonsterBattle ? (player2.ki || player2.power * 0.5) : (player2.stats.currentKi || player2.stats.ki),
        player2HP: isMonsterBattle ? player2.hp : (player2.stats.currentHealth || player2.stats.health),

        player1Defense: 1.0,
        player2Defense: 1.0,
        player1ShieldDuration: 0,
        player2ShieldDuration: 0,
        player1Stunned: 0,
        player2Stunned: 0,
        player1AttackReduced: 1.0,
        player2AttackReduced: 1.0,
        player1DebuffDuration: 0,
        player2DebuffDuration: 0,
        player1PowerBoost: 1.0,
        player2PowerBoost: 1.0,
        player1BoostDuration: 0,
        player2BoostDuration: 0,

        player1SkillCooldowns: initializeSkillCooldowns(),
        player2SkillCooldowns: initializeSkillCooldowns(),

        turn: 0
    };

    const battleLog = [];
    const maxTurns = options.maxTurns || 30;

    if (isMonsterBattle) {
        battleLog.push(`🔄 ${player1.name} đối đầu với ${player2.name}!`);
        battleLog.push(`💪 ${player1.name}: ${battleState.player1HP.toLocaleString()} HP, ${player1.stats.damage.toLocaleString()} Sức đánh`);
        battleLog.push(`👹 ${player2.name}: ${battleState.player2HP.toLocaleString()} HP, ${(player2.damage || Math.floor(player2.power * 0.2)).toLocaleString()} Sức đánh`);
    } else {
        battleLog.push(`🔄 ${player1.name} đối đầu với ${player2.name}!`);
        battleLog.push(`💪 ${player1.name}: ${battleState.player1HP.toLocaleString()} HP, ${player1.stats.damage.toLocaleString()} Sức đánh`);
        battleLog.push(`💪 ${player2.name}: ${battleState.player2HP.toLocaleString()} HP, ${player2.stats.damage.toLocaleString()} Sức đánh`);
    }

    const battleStats = {
        maxCombo: 0,
        currentCombo: 0,
        criticalHits: 0,
        momentum: 0,
        startTime: Date.now()
    };

    const totalDamage = {
        attacker: 0,
        defender: 0
    };

    const initialHP = {
        attacker: battleState.player1HP,
        defender: battleState.player2HP
    };

    // Vòng lặp trận đấu
    while (battleState.turn < maxTurns &&
        battleState.player1HP > 0 &&
        battleState.player2HP > 0) {

        // Tăng lượt đấu
        battleState.turn++;
        battleLog.push(`----- Lượt ${battleState.turn} -----`);

        // Cập nhật hiệu ứng và cooldown
        updateEffects(battleState, player1, player2, battleLog);
        updateCooldowns(battleState.player1SkillCooldowns);
        updateCooldowns(battleState.player2SkillCooldowns);

        // Player 1 hành động
        if (battleState.player1Stunned === 0) {
            // Chọn và sử dụng kỹ năng
            const skillToUse = selectBestSkill(
                player1,
                battleState.player1HP,
                battleState.player1Ki,
                battleState.player2HP,
                {
                    hp: battleState.player1HP,
                    maxHP: player1.stats.health,
                    power: player1.stats.power * battleState.player1PowerBoost
                },
                {
                    hp: battleState.player2HP,
                    maxHP: isMonsterBattle ? player2.hp : player2.stats.health,
                    power: isMonsterBattle ? player2.power : player2.stats.power * battleState.player2PowerBoost
                },
                battleLog,
                battleState.turn,
                battleState.player1SkillCooldowns
            );

            if (skillToUse) {
                const [master, skillName] = skillToUse.split(":");
                const skillData = MASTERS[master]?.skills[skillName];

                if (skillData) {
                    const kiCost = skillData.kiCost > 0 ?
                        Math.floor(player1.stats.ki * skillData.kiCost) :
                        Math.floor(player1.stats.ki * Math.abs(skillData.kiCost));

                    if (skillData.kiCost > 0) {

                        battleState.player1Ki -= kiCost;

                        if (skillData.powerScale > 0) {

                            const damage = Math.floor(player1.stats.damage * skillData.powerScale * battleState.player1PowerBoost);
                            battleState.player2HP -= damage;
                            totalDamage.attacker += damage;

                            battleLog.push(`${player1.name} sử dụng ${skillData.name} gây ${damage.toLocaleString()} sát thương! (Hồi chiêu: ${battleState.player1SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                        } else {
                            switch (skillName) {
                                case "ENERGY_SHIELD":
                                case "KHIEN_NANG_LUONG":
                                    battleState.player1Defense = 0.5;
                                    battleState.player1ShieldDuration = 3;
                                    battleLog.push(`${player1.name} kích hoạt ${skillData.name}, giảm sát thương nhận vào! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;

                                case "BIND":
                                case "TROI":
                                    battleState.player2Stunned = 2;
                                    battleLog.push(`${player1.name} sử dụng ${skillData.name}, ${isMonsterBattle ? player2.name : player2.name} bị trói! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;

                                case "SOLAR_FLARE":
                                    battleState.player2Stunned = 1;
                                    battleLog.push(`${player1.name} sử dụng ${skillData.name}, ${isMonsterBattle ? player2.name : player2.name} bị choáng! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;
                                case "EVIL_CONTAINMENT":
                                    battleState.player2Stunned = 3;
                                    battleState.player2Defense = 1.0;
                                    battleState.player2PowerBoost = 1.0;
                                    battleState.player2ShieldDuration = 0;

                                    battleState.player1Ki = Math.floor(battleState.player1Ki * 0.2);

                                    battleLog.push(`${player1.name} thi triển bí kỹ ${skillData.name}, nhốt ${isMonsterBattle ? player2.name : player2.name} vào bình phong ấn! ${player2.name} không thể hành động trong 3 lượt!`);
                                    battleLog.push(`⚠️ ${player1.name} đã tiêu hao 80% Ki sau khi sử dụng Ma Phong Ba!`);

                                    if (skillCooldowns[skillName]) {
                                        skillCooldowns[skillName].usesLeft = 0;
                                    }
                                    break;
                                case "WHISTLE":
                                case "HUYT_SAO":
                                    battleState.player2AttackReduced = 0.7;
                                    battleState.player2DebuffDuration = 3;
                                    battleLog.push(`${player1.name} sử dụng ${skillData.name}, làm giảm sức tấn công của đối thủ! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;

                                case "KAIOKEN":
                                    battleState.player1PowerBoost = 3.0;
                                    battleState.player1BoostDuration = 4;
                                    battleLog.push(`${player1.name} kích hoạt ${skillData.name}, sức mạnh tăng gấp 3 lần! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;

                                case "GREAT_APE":
                                    battleState.player1PowerBoost = 5.0;
                                    battleState.player1BoostDuration = 4;
                                    battleLog.push(`${player1.name} biến thành ${skillData.name}, sức mạnh tăng gấp 5 lần! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;
                                default:
                                    battleLog.push(`${player1.name} sử dụng ${skillData.name}! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                                    break;
                            }
                        }
                    } else {
                        if (skillName === "REGENERATION") {
                            const healAmount = Math.floor(player1.stats.health * 0.3);
                            battleState.player1HP = Math.min(player1.stats.health, battleState.player1HP + healAmount);
                            battleLog.push(`${player1.name} sử dụng ${skillData.name}, hồi phục ${healAmount.toLocaleString()} HP! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                        } else if (skillName === "HEALING") {

                            const healAmount = Math.floor(player1.stats.health * 0.5);
                            battleState.player1HP = Math.min(player1.stats.health, battleState.player1HP + healAmount);
                            battleLog.push(`${player1.name} sử dụng ${skillData.name}, tái tạo tế bào và hồi phục ${healAmount.toLocaleString()} HP! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                        } else {
                            const kiRegain = Math.abs(kiCost);
                            battleState.player1Ki = Math.min(player1.stats.ki, battleState.player1Ki + kiRegain);
                            battleLog.push(`${player1.name} sử dụng ${skillData.name}, hồi phục ${kiRegain.toLocaleString()} Ki! (Hồi chiêu: ${getSafeCooldown(battleState.player1SkillCooldowns, skillName)} lượt)`);
                        }
                    }
                }
            } else {
                let baseAttackSkill;
                let baseAttackName;
                let baseDamageMultiplier = 1.2;
                if (player1.planet === "EARTH") {
                    baseAttackSkill = "DRAGON_PUNCH";
                    baseAttackName = "Đấm Dragon";
                } else if (player1.planet === "NAMEK") {
                    baseAttackSkill = "DEMON_PUNCH";
                    baseAttackName = "Đấm Demon";
                } else if (player1.planet === "SAIYAN") {
                    baseAttackSkill = "ATOMIC";
                    baseAttackName = "Đấm Galick";
                } else {
                    baseAttackSkill = "DRAGON_PUNCH";
                    baseAttackName = "Đấm Cơ Bản";
                }

                let damage = Math.floor(player1.stats.damage * baseDamageMultiplier * battleState.player1AttackReduced * battleState.player1PowerBoost);

                const isCritical = Math.random() < 0.1;
                if (isCritical) {
                    damage = Math.floor(damage * 1.5);
                    battleStats.criticalHits++;
                    battleLog.push(`💥 CHÍ MẠNG! ${player1.name} gây thêm 50% sát thương!`);
                }

                const isCombo = Math.random() < 0.15;
                if (isCombo) {
                    const comboHits = Math.floor(Math.random() * 3) + 2;
                    const comboDamage = Math.floor(damage * 0.3) * comboHits;
                    damage += comboDamage;

                    battleStats.currentCombo++;
                    if (battleStats.currentCombo > battleStats.maxCombo) {
                        battleStats.maxCombo = battleStats.currentCombo;
                    }

                    battleLog.push(`⚡ COMBO! ${player1.name} thực hiện Combo x${comboHits} gây thêm ${comboDamage.toLocaleString()} sát thương!`);
                } else {
                    battleStats.currentCombo = 0;
                }

                const finalDamage = Math.floor(damage * battleState.player2Defense);
                battleState.player2HP -= finalDamage;
                totalDamage.attacker += finalDamage;

                battleStats.momentum += 1;

                battleLog.push(`${player1.name} sử dụng ${baseAttackName}, gây ${finalDamage.toLocaleString()} sát thương!`);
            }
        } else {
            battleLog.push(`${player1.name} bị trói, không thể hành động!`);
            battleState.player1Stunned--;
        }

        // Kiểm tra người chơi 2 còn sống không
        if (battleState.player2HP <= 0) {
            battleLog.push(`${isMonsterBattle ? player2.name : player2.name} đã bị đánh bại!`);
            break;
        }

        // Player 2 hoặc quái vật hành động
        if (battleState.player2Stunned === 0) {
            if (isMonsterBattle) {
                // Quái vật tấn công - sử dụng damage của quái
                const monsterDamage = Math.floor(
                    (player2.damage || Math.floor(player2.power * 0.2)) *
                    battleState.player2AttackReduced *
                    battleState.player2PowerBoost
                );

                // Tính sát thương thực tế sau khi áp dụng phòng thủ
                const actualDamage = Math.floor(monsterDamage * battleState.player1Defense);

                // Áp dụng sát thương
                battleState.player1HP -= actualDamage;
                totalDamage.defender += actualDamage;

                // Hiệu ứng chí mạng và combo cho quái vật
                const isCritical = Math.random() < 0.08; // Quái vật ít chí mạng hơn người chơi
                if (isCritical) {
                    const criticalBonus = Math.floor(actualDamage * 0.5);
                    battleState.player1HP -= criticalBonus;
                    totalDamage.defender += criticalBonus;
                    battleLog.push(`💥 CHÍ MẠNG! ${player2.name} gây thêm 50% sát thương!`);
                    battleLog.push(`${player2.name} tấn công, gây ${(actualDamage + criticalBonus).toLocaleString()} sát thương!`);
                } else {
                    battleLog.push(`${player2.name} tấn công, gây ${actualDamage.toLocaleString()} sát thương!`);
                }

                battleStats.momentum -= 1;
            } else {
                // Người chơi 2 sử dụng kỹ năng hoặc tấn công thường
                const skillToUse = selectBestSkill(
                    player2,
                    battleState.player2HP,
                    battleState.player2Ki,
                    battleState.player1HP,
                    {
                        hp: battleState.player2HP,
                        maxHP: player2.stats.health,
                        power: player2.stats.power * battleState.player2PowerBoost
                    },
                    {
                        hp: battleState.player1HP,
                        maxHP: player1.stats.health,
                        power: player1.stats.power * battleState.player1PowerBoost
                    },
                    battleLog,
                    battleState.turn,
                    battleState.player2SkillCooldowns
                );

                if (skillToUse) {
                    const [master, skillName] = skillToUse.split(":");
                    const skillData = MASTERS[master]?.skills[skillName];

                    if (skillData) {
                        // Tính chi phí Ki
                        const kiCost = skillData.kiCost > 0 ?
                            Math.floor(player2.stats.ki * skillData.kiCost) :
                            Math.floor(player2.stats.ki * Math.abs(skillData.kiCost));

                        // Sử dụng kỹ năng
                        if (skillData.kiCost > 0) {
                            // Kỹ năng tiêu hao Ki
                            battleState.player2Ki -= kiCost;

                            if (skillData.powerScale > 0) {
                                // Kỹ năng tấn công
                                const damage = Math.floor(player2.stats.damage * skillData.powerScale * battleState.player2PowerBoost);
                                const finalDamage = Math.floor(damage * battleState.player1Defense);
                                battleState.player1HP -= finalDamage;
                                totalDamage.defender += finalDamage;

                                battleLog.push(`${player2.name} sử dụng ${skillData.name} gây ${finalDamage.toLocaleString()} sát thương! (Hồi chiêu:${getSafeCooldown(battleState.player2SkillCooldowns, skillName)} lượt)`);
                            } else {
                                // Kỹ năng hỗ trợ - tương tự như player 1
                                switch (skillName) {
                                    case "ENERGY_SHIELD":
                                    case "KHIEN_NANG_LUONG":
                                        battleState.player2Defense = 0.5;
                                        battleState.player2ShieldDuration = 3;
                                        battleLog.push(`${player2.name} kích hoạt ${skillData.name}, giảm sát thương nhận vào! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;

                                    case "BIND":
                                    case "TROI":
                                        battleState.player1Stunned = 2;
                                        battleLog.push(`${player2.name} sử dụng ${skillData.name}, ${player1.name} bị trói! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;

                                    case "SOLAR_FLARE":
                                        battleState.player1Stunned = 1;
                                        battleLog.push(`${player2.name} sử dụng ${skillData.name}, ${player1.name} bị choáng! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;

                                    case "WHISTLE":
                                    case "HUYT_SAO":
                                        battleState.player1AttackReduced = 0.7;
                                        battleState.player1DebuffDuration = 3;
                                        battleLog.push(`${player2.name} sử dụng ${skillData.name}, làm giảm sức tấn công của đối thủ! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;

                                    case "KAIOKEN":
                                        battleState.player2PowerBoost = 3.0;
                                        battleState.player2BoostDuration = 4;
                                        battleLog.push(`${player2.name} kích hoạt ${skillData.name}, sức mạnh tăng gấp 3 lần! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;

                                    case "GREAT_APE":
                                        battleState.player2PowerBoost = 5.0;
                                        battleState.player2BoostDuration = 4;
                                        battleLog.push(`${player2.name} biến thành ${skillData.name}, sức mạnh tăng gấp 5 lần! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;



                                    default:
                                        battleLog.push(`${player2.name} sử dụng ${skillData.name}! (Hồi chiêu: ${battleState.player2SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                                        break;
                                }
                            }
                        } else {
                            if (skillName === "REGENERATION") {
                                const healAmount = Math.floor(player1.stats.health * 0.3);
                                battleState.player1HP = Math.min(player1.stats.health, battleState.player1HP + healAmount);
                                battleLog.push(`${player1.name} sử dụng ${skillData.name}, hồi phục ${healAmount.toLocaleString()} HP! (Hồi chiêu: ${battleState.player1SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                            } else if (skillName === "HEALING") {
                                const healAmount = Math.floor(player1.stats.health * 0.5);
                                battleState.player1HP = Math.min(player1.stats.health, battleState.player1HP + healAmount);
                                battleLog.push(`${player1.name} sử dụng ${skillData.name}, tái tạo tế bào và hồi phục ${healAmount.toLocaleString()} HP! (Hồi chiêu: ${battleState.player1SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                            } else {
                                const kiRegain = Math.abs(kiCost);
                                battleState.player1Ki = Math.min(player1.stats.ki, battleState.player1Ki + kiRegain);
                                battleLog.push(`${player1.name} sử dụng ${skillData.name}, hồi phục ${kiRegain.toLocaleString()} Ki! (Hồi chiêu: ${battleState.player1SkillCooldowns[skillName]?.cooldown || 0} lượt)`);
                            }
                        }
                    }
                } else {
                    // Sử dụng chiêu đấm cơ bản thay vì đấm thường
                    let baseAttackSkill;
                    let baseAttackName;
                    let baseDamageMultiplier = 1.2; // Hệ số mặc định cho chiêu đấm cơ bản

                    // Xác định chiêu đấm cơ bản theo tộc
                    if (player2.planet === "EARTH") {
                        baseAttackSkill = "DRAGON_PUNCH";
                        baseAttackName = "Đấm Dragon";
                    } else if (player2.planet === "NAMEK") {
                        baseAttackSkill = "DEMON_PUNCH";
                        baseAttackName = "Đấm Demon";
                    } else if (player2.planet === "SAIYAN") {
                        baseAttackSkill = "ATOMIC";
                        baseAttackName = "Đấm Galick";
                    } else {
                        baseAttackSkill = "DRAGON_PUNCH";
                        baseAttackName = "Đấm Cơ Bản";
                    }

                    // Tính toán sát thương từ chiêu đấm cơ bản
                    let damage = Math.floor(player2.stats.damage * baseDamageMultiplier * battleState.player2AttackReduced * battleState.player2PowerBoost);

                    const isCritical = Math.random() < 0.1;
                    if (isCritical) {
                        damage = Math.floor(damage * 1.5);
                        battleStats.criticalHits++;
                        battleLog.push(`💥 CHÍ MẠNG! ${player2.name} gây thêm 50% sát thương!`);
                    }

                    const isCombo = Math.random() < 0.15;
                    if (isCombo) {
                        const comboHits = Math.floor(Math.random() * 3) + 2;
                        const comboDamage = Math.floor(damage * 0.3) * comboHits;
                        damage += comboDamage;

                        battleStats.currentCombo++;
                        if (battleStats.currentCombo > battleStats.maxCombo) {
                            battleStats.maxCombo = battleStats.currentCombo;
                        }

                        battleLog.push(`⚡ COMBO! ${player2.name} thực hiện Combo x${comboHits} gây thêm ${comboDamage.toLocaleString()} sát thương!`);
                    } else {
                        battleStats.currentCombo = 0;
                    }

                    const finalDamage = Math.floor(damage * battleState.player1Defense);
                    battleState.player1HP -= finalDamage;
                    totalDamage.defender += finalDamage;

                    battleStats.momentum -= 1;

                    battleLog.push(`${player2.name} sử dụng ${baseAttackName}, gây ${finalDamage.toLocaleString()} sát thương!`);
                }
            }
        } else {
            battleLog.push(`${isMonsterBattle ? player2.name : player2.name} bị trói, không thể hành động!`);
            battleState.player2Stunned--;
        }

        // Kiểm tra người chơi 1 còn sống không
        if (battleState.player1HP <= 0) {
            battleLog.push(`${player1.name} đã bị đánh bại!`);
            break;
        }

        // Hồi Ki tự nhiên mỗi lượt (5%)
        battleState.player1Ki = Math.min(player1.stats.ki, battleState.player1Ki + Math.floor(player1.stats.ki * 0.05));
        if (!isMonsterBattle) {
            battleState.player2Ki = Math.min(player2.stats.ki, battleState.player2Ki + Math.floor(player2.stats.ki * 0.05));
        }

        // Hiển thị HP sau mỗi 5 lượt
        if (battleState.turn % 5 === 0) {
            battleLog.push(`❤️ ${player1.name} HP: ${Math.max(0, battleState.player1HP).toLocaleString()}/${player1.stats.health.toLocaleString()} (${Math.round((battleState.player1HP / player1.stats.health) * 100)}%)`);

            if (isMonsterBattle) {
                battleLog.push(`❤️ ${player2.name} HP: ${Math.max(0, battleState.player2HP).toLocaleString()}/${player2.hp.toLocaleString()} (${Math.round((battleState.player2HP / player2.hp) * 100)}%)`);
            } else {
                battleLog.push(`❤️ ${player2.name} HP: ${Math.max(0, battleState.player2HP).toLocaleString()}/${player2.stats.health.toLocaleString()} (${Math.round((battleState.player2HP / player2.stats.health) * 100)}%)`);
            }
        }
    }

    // Thêm thống kê trận đấu
    battleStats.duration = Date.now() - battleStats.startTime;

    // Xác định người thắng
    let winner, loser;
    if (battleState.player1HP <= 0) {
        if (isMonsterBattle) {
            winner = player2;
            winner.id = "monster";
        } else {
            winner = player2;
        }
        loser = player1;
    } else if (battleState.player2HP <= 0) {
        winner = player1;
        if (isMonsterBattle) {
            loser = player2;
            loser.id = "monster";
        } else {
            loser = player2;
        }
    } else {
        // Hòa - người có % HP cao hơn thắng
        const p1HealthPercent = battleState.player1HP / player1.stats.health;
        const p2HealthPercent = battleState.player2HP / (isMonsterBattle ? player2.hp : player2.stats.health);

        if (p1HealthPercent > p2HealthPercent) {
            winner = player1;
            if (isMonsterBattle) {
                loser = player2;
                loser.id = "monster";
            } else {
                loser = player2;
            }
        } else if (p2HealthPercent > p1HealthPercent) {
            if (isMonsterBattle) {
                winner = player2;
                winner.id = "monster";
            } else {
                winner = player2;
            }
            loser = player1;
        } else {
            // Thực sự hòa
            winner = {
                name: "Hòa",
                id: "draw"
            };
            loser = {
                name: "Hòa",
                id: "draw"
            };
        }
    }

    if (winner.id !== "draw") {
        battleLog.push(`🏆 ${winner.name} đã chiến thắng!`);
    } else {
        battleLog.push(`🤝 Trận đấu hòa!`);
    }
    if (totalDamage.attacker > player1.stats.damage * 1.5) {
        const dramaticDesc = generateDramaticDescription(
            "attack",
            player1,
            player2,
            totalDamage.attacker,
            battleState.player2HP,
            isMonsterBattle ? player2.hp : player2.stats.health,
            null
        );

        if (dramaticDesc) {
            dramaticMoments.push({
                turn: battleState.turn,
                description: dramaticDesc
            });

            battleLog.push(`📖 ${dramaticDesc}`);
        }
    }

    return {
        player1HP: Math.max(0, battleState.player1HP),
        player2HP: Math.max(0, battleState.player2HP),
        player1Ki: battleState.player1Ki,
        player2Ki: battleState.player2Ki,
        winner: winner,
        loser: loser,
        isDraw: winner.id === "draw",
        battleLog: battleLog,
        turns: battleState.turn,
        totalDamage: totalDamage,
        battleStats: battleStats,
        initialHP: initialHP,
        isMonsterBattle: isMonsterBattle,
        dramaticMoments: dramaticMoments
    };
}

/**
 * Cập nhật các hiệu ứng kỹ năng mỗi lượt
 */
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

function updateEffects(battleState, player1, player2, battleLog) {

    if (battleState.player1ShieldDuration > 0) {
        battleState.player1ShieldDuration--;
        if (battleState.player1ShieldDuration === 0) {
            battleState.player1Defense = 1.0;
            battleLog.push(`⚠️ Khiên năng lượng của ${player1.name} đã biến mất!`);
        }
    }

    if (battleState.player2ShieldDuration > 0) {
        battleState.player2ShieldDuration--;
        if (battleState.player2ShieldDuration === 0) {
            battleState.player2Defense = 1.0;
            battleLog.push(`⚠️ Khiên năng lượng của ${player2.name} đã biến mất!`);
        }
    }

    if (battleState.player1DebuffDuration > 0) {
        battleState.player1DebuffDuration--;
        if (battleState.player1DebuffDuration === 0) {
            battleState.player1AttackReduced = 1.0;
            battleLog.push(`⚠️ ${player1.name} đã phục hồi sức tấn công!`);
        }
    }

    if (battleState.player2DebuffDuration > 0) {
        battleState.player2DebuffDuration--;
        if (battleState.player2DebuffDuration === 0) {
            battleState.player2AttackReduced = 1.0;
            battleLog.push(`⚠️ ${player2.name} đã phục hồi sức tấn công!`);
        }
    }

    if (battleState.player1BoostDuration > 0) {
        battleState.player1BoostDuration--;
        if (battleState.player1BoostDuration === 0) {
            battleState.player1PowerBoost = 1.0;
            battleLog.push(`⚠️ ${player1.name} đã hết hiệu ứng tăng sức mạnh!`);
        }
    }

    if (battleState.player2BoostDuration > 0) {
        battleState.player2BoostDuration--;
        if (battleState.player2BoostDuration === 0) {
            battleState.player2PowerBoost = 1.0;
            battleLog.push(`⚠️ ${player2.name} đã hết hiệu ứng tăng sức mạnh!`);
        }
    }
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

    if (quest.type !== questType) {
        console.log(`Không khớp loại nhiệm vụ: quest.type=${quest.type}, questType=${questType}`);
        return;
    }

    let updated = false;

    switch (questType) {
        case QUEST_TYPES.TRAINING:
            if (!player.quests.progress[activeQuestId]) {
                player.quests.progress[activeQuestId] = 0;
            }
            player.quests.progress[activeQuestId]++;
            console.log(`Cập nhật tiến độ nhiệm vụ train: ${player.quests.progress[activeQuestId]}/${quest.target}`);
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

        if (player.evolution) {
            const oldForm = evolutionForms.find(f => f.name === player.evolution.name);
            if (oldForm) {
                player.stats.damage = Math.floor(player.stats.damage / oldForm.damageBonus);
                player.stats.ki = Math.floor(player.stats.ki / oldForm.kiBonus);
                player.stats.health = Math.floor(player.stats.health / oldForm.healthBonus);
            }
        }

        player.stats.damage = Math.floor(player.stats.damage * highestForm.damageBonus);
        player.stats.ki = Math.floor(player.stats.ki * highestForm.kiBonus);
        player.stats.health = Math.floor(player.stats.health * highestForm.healthBonus);

        player.stats.currentHealth = player.stats.health;
        player.stats.currentKi = player.stats.ki;

        player.evolution = {
            name: highestForm.name,
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
async function displayPVPBattle(api, threadID, messageID, battleResult, player1, player2) {
    const { battleLog, player1HP, player2HP, winner, loser, initialHP } = battleResult;

    const introMessage = `🔥🔥🔥 TRẬN ĐẤU DRAGON BALL Z 🔥🔥🔥\n\n` +
        `👊 ${player1.name} (${player1.evolution?.name || 'Chiến binh thường'})\n` +
        `🪐 Hành tinh: ${PLANETS[player1.planet]?.name || 'Không xác định'}\n` +
        `💪 Sức mạnh: ${player1.stats?.power?.toLocaleString() || 'Không xác định'}\n` +
        `❤️ HP: ${(initialHP?.attacker || player1.stats?.health || 0).toLocaleString()}\n\n` +
        `⚔️ VS ⚔️\n\n` +
        `👊 ${player2.name} (${player2.evolution?.name || 'Chiến binh thường'})\n` +
        `🪐 Hành tinh: ${PLANETS[player2.planet]?.name || 'Không xác định'}\n` +
        `💪 Sức mạnh: ${player2.stats?.power?.toLocaleString() || 'Không xác định'}\n` +
        `❤️ HP: ${(initialHP?.defender || player2.stats?.health || 0).toLocaleString()}\n\n` +
        `🏆 TRẬN ĐẤU BẮT ĐẦU! 🏆`;

    await api.sendMessage(introMessage, threadID);

    await new Promise(resolve => setTimeout(resolve, 5000));

    const enhancedBattleLog = [];
    const skillUsed = new Set();

    battleLog.forEach(log => {
        if (log.includes("sử dụng") && (
            log.includes("Kamejoko") || log.includes("Đấm Dragon") ||
            log.includes("Quả Cầu Kinh Khí") || log.includes("Đấm Demon") ||
            log.includes("Masenko") || log.includes("Makankosappo") ||
            log.includes("Hellzone Grenade") || log.includes("Khiên Năng Lượng") ||
            log.includes("Kaioken") || log.includes("Thái Dương Hạ San") ||
            log.includes("Thôi Miên") || log.includes("Phân Thân") ||
            log.includes("Biến Khỉ Khổng Lồ") || log.includes("Tái Tạo") ||
            log.includes("Huýt Sáo") || log.includes("Trói") ||
            log.includes("Ma Phong Ba") || log.includes("Cadich")
        )) {
            const skillKey = log.substring(0, 50);
            if (!skillUsed.has(skillKey)) {
                enhancedBattleLog.push(`🔥 KỸ NĂNG: ${log}`);
                skillUsed.add(skillKey);
            } else {
                enhancedBattleLog.push(log);
            }
        }
        else if (log.includes("CHÍ MẠNG")) {
            enhancedBattleLog.push(`💥 ${log}`);
        }
        else if (log.includes("COMBO")) {
            enhancedBattleLog.push(`⚡ ${log}`);
        }
        else if (log.includes("choáng") || log.includes("bị trói")) {
            enhancedBattleLog.push(`😵 ${log}`);
        }
        else if (log.includes("Khiên năng lượng")) {
            enhancedBattleLog.push(`🛡️ ${log}`);
        }
        else if (log.includes(" HP: ")) {
            enhancedBattleLog.push(`❤️ ${log}`);
        }
        else {
            enhancedBattleLog.push(log);
        }
    });

    const chunkSize = 15;
    const battleLogChunks = [];

    let currentChunk = [];
    let currentTurn = 0;

    enhancedBattleLog.forEach(log => {
        if (log.includes("----- Lượt")) {
            currentTurn++;
            if (currentChunk.length > 0 && currentChunk.length >= chunkSize) {
                battleLogChunks.push([...currentChunk]);
                currentChunk = [];
            }
        }
        currentChunk.push(log);
    });

    if (currentChunk.length > 0) {
        battleLogChunks.push(currentChunk);
    }

    for (let i = 0; i < battleLogChunks.length; i++) {
        const chunk = battleLogChunks[i];

        const importantEvents = chunk.filter(log =>
            log.startsWith("🔥 KỸ NĂNG:") ||
            log.startsWith("💥") ||
            log.startsWith("⚡") ||
            log.startsWith("🛡️") && !log.includes("biến mất") ||
            log.startsWith("😵")
        );

        const cleanedEvents = importantEvents.map(event => {
            if (event.startsWith("🔥 KỸ NĂNG: ")) {
                return event.replace("🔥 KỸ NĂNG: ", "");
            }
            return event;
        });

        let summary = "";
        if (cleanedEvents.length > 0) {
            summary = "\n\n📌 SỰ KIỆN QUAN TRỌNG:";

            const skillEvents = cleanedEvents.filter(e => e.includes("sử dụng") && !e.startsWith("💥") && !e.startsWith("⚡"));
            const critEvents = cleanedEvents.filter(e => e.startsWith("💥"));
            const comboEvents = cleanedEvents.filter(e => e.startsWith("⚡"));
            const shieldEvents = cleanedEvents.filter(e => e.startsWith("🛡️"));
            const stunEvents = cleanedEvents.filter(e => e.startsWith("😵"));

            if (skillEvents.length > 0) summary += "\n" + [...new Set(skillEvents)].join("\n");
            if (critEvents.length > 0) summary += "\n" + [...new Set(critEvents)].join("\n");
            if (comboEvents.length > 0) summary += "\n" + [...new Set(comboEvents)].join("\n");
            if (shieldEvents.length > 0) summary += "\n" + [...new Set(shieldEvents)].join("\n");
            if (stunEvents.length > 0) summary += "\n" + [...new Set(stunEvents)].join("\n");
        }

        const chunkMessage = `📝 DIỄN BIẾN TRẬN ĐẤU (${i + 1}/${battleLogChunks.length})\n\n${chunk.join('\n')}${summary}`;
        await api.sendMessage(chunkMessage, threadID);

        if (i < battleLogChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const pvpImagePath = await createPVPResultImage(battleResult, player1, player2);
        if (pvpImagePath) {
            await api.sendMessage({
                body: `📊 KẾT QUẢ TRẬN ĐẤU GIỮA ${player1.name} VÀ ${player2.name}`,
                attachment: fs.createReadStream(pvpImagePath)
            }, threadID, messageID);
        } else {
            const battleSummary = createBattleSummaryText(battleResult, player1, player2);
            await api.sendMessage(battleSummary, threadID, messageID);
        }
    } catch (error) {
        console.error("Error sending PVP result image:", error);
        const battleSummary = createBattleSummaryText(battleResult, player1, player2);
        await api.sendMessage(battleSummary, threadID, messageID);
    }
}

function createBattleSummaryText(battleResult, player1, player2) {
    const { winner, loser, player1HP, player2HP, isDraw, turns, totalDamage, battleStats } = battleResult;

    let summary = `📊 KẾT QUẢ TRẬN ĐẤU 📊\n\n`;

    if (isDraw) {
        summary += `🤝 HÒA! Cả hai chiến binh đều kiệt sức sau ${turns} lượt\n\n`;
    } else {
        summary += `🏆 ${winner.name} CHIẾN THẮNG! 🏆\n\n`;
    }
    u
    summary += `⏱️ Số lượt: ${turns}\n`;
    summary += `⏳ Thời gian: ${Math.round((battleStats?.duration || 0) / 1000)} giây\n`;
    summary += `🔄 Combo cao nhất: x${battleStats?.maxCombo || 0}\n\n`;

    const hp1Percent = Math.round((player1HP / player1.stats.health) * 100);
    const hp2Percent = Math.round((player2HP / player2.stats.health) * 100);
    summary += `${player1.name}: ${Math.max(0, player1HP).toLocaleString()} HP còn lại (${hp1Percent}%)\n`;
    summary += `${player2.name}: ${Math.max(0, player2HP).toLocaleString()} HP còn lại (${hp2Percent}%)\n\n`;

    summary += `💥 Sát thương gây ra:\n`;
    summary += `- ${player1.name}: ${totalDamage.attacker.toLocaleString()}\n`;
    summary += `- ${player2.name}: ${totalDamage.defender.toLocaleString()}\n\n`;

    if (!isDraw && winner && loser) {
        summary += `💡 Phân tích: ${winner.name} ${getWinReason(battleResult, winner, loser)}\n\n`;
    }

    summary += `💪 Hãy tiếp tục luyện tập để trở nên mạnh hơn!`;

    return summary;
}
function getWinReason(battleResult, winner, loser) {
    const { totalDamage, battleStats, turns } = battleResult;

    if (turns >= 30) {
        return "giành chiến thắng nhờ lượng HP còn lại nhiều hơn";
    }

    if (totalDamage && totalDamage.attacker > totalDamage.defender * 2) {
        return "áp đảo hoàn toàn với sức mạnh vượt trội";
    }

    if (battleStats?.maxCombo >= 5) {
        return "tung ra combo chí mạng hủy diệt đối thủ";
    }

    if (battleStats?.momentum > 3) {
        return "nắm thế chủ động và kiểm soát thế trận";
    }

    const reasons = [
        `đã chứng minh sức mạnh vượt trội hơn`,
        `đã thể hiện kỹ năng chiến đấu xuất sắc hơn`,
        `đã giành chiến thắng trong một trận đấu cân tài cân sức`,
        `đã tung ra đòn quyết định vào thời điểm then chốt`,
        `đã thể hiện bản lĩnh của một chiến binh Z thực thụ`
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
}
function selectBestSkill(player, playerHP, playerKi, opponentHP, playerStates, opponentStates, battleLog, currentTurn, skillCooldowns) {
    if (!player || !player.skills || player.skills.length === 0) return null;

    const maxHP = player.stats.health;
    const maxKi = player.stats.ki;
    const hpPercent = (playerHP / maxHP) * 100;
    const kiPercent = (playerKi / maxKi) * 100;

    const usableSkills = player.skills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        if (!MASTERS[master]?.skills[skillName]) return false;

        const skillData = MASTERS[master].skills[skillName];
        const kiCost = skillData.kiCost > 0 ?
            Math.floor(maxKi * skillData.kiCost) :
            Math.floor(maxKi * Math.abs(skillData.kiCost));

        if (skillCooldowns[skillName] && skillCooldowns[skillName].currentCooldown > 0) {
            return false;
        }

        if (skillCooldowns[skillName] && skillCooldowns[skillName].usesLeft === 0) {
            return false;
        }

        if (skillCooldowns[skillName] && skillCooldowns[skillName].lateTurn && currentTurn < 15) {
            return false;
        }

        if (skillData.kiCost > 0 && playerKi < kiCost) {
            return false;
        }

        return true;
    });

    if (usableSkills.length === 0) return null;

    const shouldUseSpecialSkill = Math.random() < 0.5;

    const attackSkills = usableSkills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const powerScale = MASTERS[master]?.skills[skillName]?.powerScale || 0;
        return powerScale > 0;
    });

    const supportSkills = usableSkills.filter(skillChoice => {
        const [master, skillName] = skillChoice.split(":");
        const powerScale = MASTERS[master]?.skills[skillName]?.powerScale || 0;
        return powerScale === 0;
    });

    if (hpPercent < 40 && supportSkills.length > 0 && Math.random() < 0.7) {
        const healingSkills = supportSkills.filter(skill => {
            const [master, skillName] = skill.split(":");
            return skillName === "HEALING" || skillName === "WHISTLE";
        });

        if (healingSkills.length > 0) {
            const selectedSkill = healingSkills[Math.floor(Math.random() * healingSkills.length)];
            const [master, skillName] = selectedSkill.split(":");

            if (skillCooldowns[skillName]) {
                skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
                if (skillCooldowns[skillName].usesLeft !== undefined) {
                    skillCooldowns[skillName].usesLeft--;
                }
            }

            return selectedSkill;
        }
    }

    if (playerStates.power < opponentStates.power * 0.8 && supportSkills.length > 0 && Math.random() < 0.6) {
        const defenseSkills = supportSkills.filter(skill => {
            const [master, skillName] = skill.split(":");
            return skillName === "ENERGY_SHIELD" || skillName === "KHIEN_NANG_LUONG";
        });

        if (defenseSkills.length > 0) {
            const selectedSkill = defenseSkills[Math.floor(Math.random() * defenseSkills.length)];
            const [master, skillName] = selectedSkill.split(":");

            if (skillCooldowns[skillName]) {
                skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
                if (skillCooldowns[skillName].usesLeft !== undefined) {
                    skillCooldowns[skillName].usesLeft--;
                }
            }

            return selectedSkill;
        }
    }

    if (currentTurn > 5 && supportSkills.length > 0 && Math.random() < 0.4) {
        const controlSkills = supportSkills.filter(skill => {
            const [master, skillName] = skill.split(":");
            return skillName === "BIND" || skillName === "TROI" ||
                skillName === "SOLAR_FLARE" || skillName === "EVIL_CONTAINMENT";
        });

        if (controlSkills.length > 0) {
            const selectedSkill = controlSkills[Math.floor(Math.random() * controlSkills.length)];
            const [master, skillName] = selectedSkill.split(":");

            if (skillCooldowns[skillName]) {
                skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
                if (skillCooldowns[skillName].usesLeft !== undefined) {
                    skillCooldowns[skillName].usesLeft--;
                }
            }

            return selectedSkill;
        }
    }

    if (currentTurn > 10 && attackSkills.length > 0) {
        const strongAttacks = attackSkills.filter(skill => {
            const [master, skillName] = skill.split(":");
            const powerScale = MASTERS[master]?.skills[skillName]?.powerScale || 0;
            return powerScale >= 2.0;
        });

        if (strongAttacks.length > 0 && Math.random() < 0.7) {
            const selectedSkill = strongAttacks[Math.floor(Math.random() * strongAttacks.length)];
            const [master, skillName] = selectedSkill.split(":");

            if (skillCooldowns[skillName]) {
                skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
                if (skillCooldowns[skillName].usesLeft !== undefined) {
                    skillCooldowns[skillName].usesLeft--;
                }
            }

            return selectedSkill;
        }
    }

    if (kiPercent > 70 && attackSkills.length > 0) {
        const normalAttacks = attackSkills.filter(skill => {
            const [master, skillName] = skill.split(":");
            const powerScale = MASTERS[master]?.skills[skillName]?.powerScale || 0;
            return powerScale > 0 && powerScale < 2.0;
        });

        if (normalAttacks.length > 0 && Math.random() < 0.6) {
            const selectedSkill = normalAttacks[Math.floor(Math.random() * normalAttacks.length)];
            const [master, skillName] = selectedSkill.split(":");

            if (skillCooldowns[skillName]) {
                skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
                if (skillCooldowns[skillName].usesLeft !== undefined) {
                    skillCooldowns[skillName].usesLeft--;
                }
            }

            return selectedSkill;
        }
    }

    if (usableSkills.length > 0) {
        const randomIndex = Math.floor(Math.random() * usableSkills.length);
        const selectedSkill = usableSkills[randomIndex];
        const [master, skillName] = selectedSkill.split(":");

        if (skillCooldowns[skillName]) {
            skillCooldowns[skillName].currentCooldown = skillCooldowns[skillName].cooldown || 0;
            if (skillCooldowns[skillName].usesLeft !== undefined) {
                skillCooldowns[skillName].usesLeft--;
            }
        }

        return selectedSkill;
    }

    return null;
}

function generateDramaticDescription(action, player, target, damage, hp, maxHp, skillName) {
    const hpPercent = (hp / maxHp) * 100;
    const isCritical = damage > player.stats.damage * 2;
    const isFinishing = hp <= 0;

    const attackDescriptions = [
        `${player.name} lao vào tấn công ${target.name} với tốc độ kinh hoàng!`,
        `${player.name} phóng đến ${target.name} nhanh như chớp!`,
        `Mặt đất rung chuyển khi ${player.name} tung đòn!`,
        `${player.name} tích tụ năng lượng và lao vào ${target.name}!`
    ];

    const criticalDescriptions = [
        `BOOOM! ${player.name} tung ra đòn đánh hủy diệt!`,
        `Không thể tin được! ${target.name} không kịp phản ứng trước đòn đánh của ${player.name}!`,
        `${player.name} tìm ra điểm yếu và tấn công chính xác!`,
        `Một đòn đánh sấm sét từ ${player.name}!`
    ];

    const skillDescriptions = {
        "KAMEJOKO": [
            `${player.name} đặt hai tay về một bên, tích tụ năng lượng xanh rực rỡ... "KA-ME-JO-KO-HAAA!"`,
            `Luồng năng lượng xanh khổng lồ phóng ra từ bàn tay ${player.name}!`
        ],
        "SPIRIT_BOMB": [
            `${player.name} giơ tay lên trời, thu thập năng lượng từ vạn vật: "Mọi người, cho tôi mượn sức mạnh!"`,
            `Quả cầu năng lượng khổng lồ hình thành trên bàn tay ${player.name}!`,
            `"Hãy nhận lấy!" ${player.name} ném Quả Cầu Kinh Khí về phía ${target.name}!`
        ],
        "KAIOKEN": [
            `"KAIOKEN!" ${player.name} hét lên, cơ thể bùng cháy trong hào quang đỏ rực!`,
            `Sức mạnh của ${player.name} tăng vọt, aura đỏ rực bao quanh cơ thể!`
        ],
        "GREAT_APE": [
            `Mắt ${player.name} đỏ ngầu, cơ thể bắt đầu biến đổi kinh hoàng!`,
            `${player.name} biến thành Đại Khỉ Đột, kích thước khổng lồ cao hàng chục mét!`,
            `Tiếng gầm của ${player.name} làm rung chuyển cả bầu trời!`
        ],
        "MAKANKOSAPPO": [
            `${player.name} đặt hai ngón tay lên trán, tích tụ năng lượng tím rực rỡ!`,
            `"MAKANKOSAPPO!" ${player.name} phóng ra tia xoáy năng lượng sắc bén!`,
            `Tia xoáy năng lượng khoan thẳng về phía ${target.name}!`
        ]
    };

    const lowHpDescriptions = [
        `${target.name} thở hổn hển, cố gắng đứng vững sau đòn đánh!`,
        `Máu chảy từ khóe miệng, ${target.name} lau đi và cười nhạt!`,
        `"Chưa xong đâu..." ${target.name} nói, dù cơ thể đầy thương tích!`,
        `${target.name} loạng choạng, cố gắng lấy lại thăng bằng!`
    ];

    const finishingDescriptions = [
        `${target.name} ngã xuống, không còn sức để đứng dậy!`,
        `Đòn đánh cuối cùng của ${player.name} quá mạnh, ${target.name} ngã xuống!`,
        `${target.name} đã đạt đến giới hạn, không thể tiếp tục chiến đấu!`,
        `Một đòn quyết định! ${target.name} đã bị đánh bại!`
    ];

    let description = "";

    if (action === "attack") {
        description = attackDescriptions[Math.floor(Math.random() * attackDescriptions.length)];

        if (isCritical) {
            description += " " + criticalDescriptions[Math.floor(Math.random() * criticalDescriptions.length)];
        }

        if (skillName && skillDescriptions[skillName]) {
            const skillDesc = skillDescriptions[skillName][Math.floor(Math.random() * skillDescriptions[skillName].length)];
            description += " " + skillDesc;
        }

        if (hpPercent < 30 && hpPercent > 0) {
            description += " " + lowHpDescriptions[Math.floor(Math.random() * lowHpDescriptions.length)];
        }

        if (isFinishing) {
            description += " " + finishingDescriptions[Math.floor(Math.random() * finishingDescriptions.length)];
        }
    }

    return description;
}

function calculatePowerGain(currentPower, locationMultiplier = 1) {

    let powerScale = 1.0;

    if (currentPower >= 90000000000) {
        powerScale = 0.0001;
    } else if (currentPower >= 70000000000) {
        powerScale = 0.0005;
    } else if (currentPower >= 50000000000) {
        powerScale = 0.001;
    } else if (currentPower >= 30000000000) {
        powerScale = 0.005;
    } else if (currentPower >= 10000000000) {
        powerScale = 0.01;
    } else if (currentPower >= 5000000000) {
        powerScale = 0.05;
    } else if (currentPower >= 1000000000) {
        powerScale = 0.1;
    } else if (currentPower >= 500000000) {
        powerScale = 0.2;
    } else if (currentPower >= 100000000) {
        powerScale = 0.3;
    } else if (currentPower >= 50000000) {
        powerScale = 0.4;
    } else if (currentPower >= 10000000) {
        powerScale = 0.5;
    } else if (currentPower >= 1000000) {
        powerScale = 0.7;
    }

    const basePowerGain = Math.floor(currentPower * 0.01 * powerScale * locationMultiplier);

    const randomFactor = 0.9 + Math.random() * 0.2;

    return Math.max(1000, Math.floor(basePowerGain * randomFactor));
}
function calculateExpGain(power, damage) {

    let expScale = 1.0;

    if (power >= 90000000000) { // >90B
        expScale = 0.0001;
    } else if (power >= 70000000000) { // >70B
        expScale = 0.0005;
    } else if (power >= 50000000000) { // >50B
        expScale = 0.001;
    } else if (power >= 30000000000) { // >30B
        expScale = 0.005;
    } else if (power >= 10000000000) { // >10B
        expScale = 0.01;
    } else if (power >= 5000000000) { // >5B
        expScale = 0.05;
    } else if (power >= 1000000000) { // >1B
        expScale = 0.1;
    } else if (power >= 100000000) { // >100M
        expScale = 0.3;
    } else if (power >= 10000000) { // >10M
        expScale = 0.5;
    }

    const baseExp = Math.floor((power * 0.02 + damage * 0.01) * expScale);

    const randomFactor = 0.8 + Math.random() * 0.4;

    return Math.max(100, Math.floor(baseExp * randomFactor));
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
        if (!this.bossCheckInterval) {
            this.bossCheckInterval = setInterval(() => {
                BOSS_SYSTEM.checkForBossEvents();
                BOSS_SYSTEM.saveBossData();
                console.log("Checked for new boss events");
            }, 5 * 60 * 1000);
        }

        if (!this.tournamentCheckInterval) {
            this.tournamentCheckInterval = setInterval(() => {
                const now = new Date();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const dayOfWeek = now.getDay();

                if (hour === 19 && minute === 0) {
                    const tournamentData = loadTournamentData();

                    if (!tournamentData.active || tournamentData.active.status === "completed") {

                        let tournamentType;
                        if (dayOfWeek === 0) {
                            tournamentType = "UNIVERSE";
                        } else if (dayOfWeek % 2 === 1) {
                            tournamentType = "TENKAICHI";
                        } else {
                            tournamentType = "CELL";
                        }
                        tournamentData.active = {
                            type: tournamentType,
                            status: "registration",
                            startTime: Date.now(),
                            endTime: null,
                            organizer: {
                                id: "system",
                                name: "Hệ Thống"
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
                        saveTournamentData(tournamentData);

                        setTimeout(() => {
                            const currentTournament = loadTournamentData();
                            if (currentTournament.active && currentTournament.active.status === "registration") {
                                startTournament(global.api, "");
                            }
                        }, 15 * 60 * 1000);

                        console.log(`Tournament ${tournamentType} created at ${now.toLocaleString()}`);
                    }
                }
            }, 60 * 1000);
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
                validatePlayerStats(player);
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

            const userData = JSON.parse(fs.readFileSync(path.join(__dirname, "../database/rankData.json")));


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

                if (planet === "EARTH") {
                    playerData[senderID].skills.push("KAME:DRAGON_PUNCH");
                } else if (planet === "SAIYAN") {
                    playerData[senderID].skills.push("GOKU:ATOMIC");
                } else if (planet === "NAMEK") {
                    playerData[senderID].skills.push("PICCOLO:DEMON_PUNCH");
                }
                playerData[senderID].location = {
                    planet: planet,
                    locationId: WORLD_MAP[planet].locations.find(loc => loc.isStartPoint)?.id || WORLD_MAP[planet].locations[0].id,
                    name: WORLD_MAP[planet].locations.find(loc => loc.isStartPoint)?.name || WORLD_MAP[planet].locations[0].name,
                    lastTeleport: 0
                };
                playerData[senderID].evolution = {
                    name: planet === "EARTH" ? "Con người thường" :
                        planet === "SAIYAN" ? "Saiyan thường" :
                            "Namek thường",
                    description: "Hình thái cơ bản",
                    achievedAt: new Date().toISOString(),
                    auraColor: getAuraColorForEvolution(
                        planet === "EARTH" ? "Con người thường" :
                            planet === "SAIYAN" ? "Saiyan thường" :
                                "Namek thường",
                        planet
                    )
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
                        id: "namek_boots",
                        quantity: 1,
                        type: "boots",
                        boost: 1.1
                    });
                    playerData[senderID].stats.ki += 50;
                }
                else if (planet === "SAIYAN") {
                    playerData[senderID].inventory.items.push({
                        id: "battle_gloves",
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
                    (planet === "EARTH" ?
                        "• Giáp cơ bản (+10% HP)\n• 1000 Zeni bổ sung\n• Kỹ năng Đấm Dragon\n" :
                        planet === "NAMEK" ?
                            "• Giày cơ bản (+10% Ki)\n• 50 Ki bổ sung\n• Kỹ năng Đấm Demon\n" :
                            "• Găng tay cơ bản (+10% Sức đánh)\n• 10 Sức đánh bổ sung\n• Kỹ năng Đấm Galick\n") +
                    "\n🔍 Dùng .dball inventory để xem vật phẩm!"

                return api.sendMessage(
                    "🎉 NHÂN VẬT ĐÃ ĐƯỢC TẠO!\n" +
                    "───────────────\n" +
                    `👤 Tên: ${userName}\n` +
                    `🌍 Tộc người: ${PLANETS[planet].name}\n` +
                    `🧬 Hình thái: ${playerData[senderID].evolution.name}\n` +
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
                    if (!checkPlayer(api, event, player)) return;
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
                    if (!checkPlayer(api, event, player)) return;

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
                case "map": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;

                    updatePlayerLocation(player);

                    const currentPlanet = player.location?.planet || player.planet;
                    const currentLocationId = player.location?.locationId;

                    const planetList = Object.keys(WORLD_MAP);

                    if (!target[1]) {
                        let mapMsg = "🗺️ BẢN ĐỒ VŨ TRỤ 🗺️\n───────────────\n";

                        mapMsg += `👤 ${player.name}\n`;
                        mapMsg += `🌍 Hành tinh hiện tại: ${WORLD_MAP[currentPlanet].name}\n`;
                        mapMsg += `📍 Vị trí: ${player.location?.name || "Không xác định"}\n\n`;

                        mapMsg += "📋 DANH SÁCH HÀNH TINH:\n";
                        planetList.forEach((planetKey, index) => {
                            const planetData = WORLD_MAP[planetKey];
                            const unlocked = planetKey === player.planet ||
                                (player.inventory?.items?.some(item =>
                                    item.id === "planet_capsule" || item.id === "universe_capsule"));

                            const canAccess = player.stats.power >= (planetData.requiredPower || 0);

                            mapMsg += `${index + 1}. ${planetKey === currentPlanet ? "🟢" : unlocked && canAccess ? "🔓" : "🔒"} ${planetData.name}`;

                            if (planetData.requiredPower && player.stats.power < planetData.requiredPower) {
                                mapMsg += ` (Cần: ${planetData.requiredPower.toLocaleString()} sức mạnh)`;
                            }

                            if (planetData.requiredItems) {
                                const hasItems = planetData.requiredItems.every(itemId =>
                                    player.inventory?.items?.some(item => item.id === itemId));

                                if (!hasItems) {
                                    mapMsg += ` (Cần: ${planetData.requiredItems.map(id =>
                                        CAPSULE_ITEMS[id.toUpperCase()]?.name || id).join(", ")})`;
                                }
                            }

                            mapMsg += "\n";
                        });

                        mapMsg += "\n💡 Dùng .dball map <số thứ tự> để xem chi tiết\n";
                        mapMsg += "💡 Dùng .dball capsule để di chuyển";

                        return api.sendMessage(mapMsg, threadID, messageID);
                    }

                    const planetIndex = parseInt(target[1]) - 1;
                    if (isNaN(planetIndex) || planetIndex < 0 || planetIndex >= planetList.length) {
                        return api.sendMessage(
                            "❌ Số thứ tự hành tinh không hợp lệ!\n" +
                            `💡 Vui lòng chọn từ 1 đến ${planetList.length}`,
                            threadID, messageID
                        );
                    }

                    const targetPlanet = planetList[planetIndex];
                    const planetData = WORLD_MAP[targetPlanet];
                    const locations = planetData.locations || [];

                    let mapMsg = `🗺️ BẢN ĐỒ ${planetData.name.toUpperCase()} 🗺️\n───────────────\n`;

                    mapMsg += "📍 ĐỊA ĐIỂM:\n";
                    locations.forEach((loc, index) => {
                        const isCurrentLocation = targetPlanet === currentPlanet && loc.id === currentLocationId;
                        const canAccess = player.stats.power >= (loc.requiredPower || 0);

                        mapMsg += `${isCurrentLocation ? "🟢" : canAccess ? "🔓" : "🔒"} ${index + 1}. ${loc.name}\n`;
                        mapMsg += `   ${loc.description}\n`;

                        if (loc.requiredPower && player.stats.power < loc.requiredPower) {
                            mapMsg += `   ⚡ Yêu cầu: ${loc.requiredPower.toLocaleString()} sức mạnh\n`;
                        }

                        mapMsg += "\n";
                    });

                    mapMsg += "💡 Dùng .dball capsule <số thứ tự> để di chuyển đến địa điểm";

                    return api.sendMessage(mapMsg, threadID, messageID);
                }

                case "capsule": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;

                    updatePlayerLocation(player);

                    const hasCapsules = player.inventory?.items?.some(item =>
                        ["basic_capsule", "advanced_capsule", "planet_capsule", "universe_capsule"].includes(item.id));

                    if (!hasCapsules) {
                        return api.sendMessage(
                            "❌ Bạn không có viên nang nào!\n" +
                            "💡 Mua viên nang tại cửa hàng: .dball shop capsule",
                            threadID, messageID
                        );
                    }

                    if (!target[1]) {
                        let capsuleMsg = "🚀 VIÊN NANG DỊCH CHUYỂN 🚀\n───────────────\n";

                        capsuleMsg += "📦 VIÊN NANG ĐANG CÓ:\n";
                        player.inventory.items.forEach(item => {
                            const capsuleData = Object.values(CAPSULE_ITEMS).find(c => c.id === item.id);
                            if (capsuleData && capsuleData.type === "teleport") {
                                const cooldownLeft = (item.lastUsed || 0) + capsuleData.cooldown - Date.now();
                                const cooldownStatus = cooldownLeft > 0 ?
                                    `⏳ Hồi chiêu: ${Math.ceil(cooldownLeft / 60000)} phút` :
                                    "✅ Sẵn sàng";

                                capsuleMsg += `${capsuleData.emoji} ${capsuleData.name} (x${item.quantity}) - ${cooldownStatus}\n`;
                                capsuleMsg += `   💫 ${capsuleData.description}\n\n`;
                            }
                        });

                        capsuleMsg += "💡 Dùng .dball capsule use <loại_viên_nang> <địa_điểm>\n";
                        capsuleMsg += "💡 Dùng .dball map để xem bản đồ và địa điểm";

                        return api.sendMessage(capsuleMsg, threadID, messageID);
                    }

                    if (target[1].toLowerCase() === "use") {
                        if (!target[2]) {
                            return api.sendMessage(
                                "❌ Vui lòng chọn loại viên nang!\n" +
                                "Ví dụ: .dball capsule use basic_capsule kame_house",
                                threadID, messageID
                            );
                        }

                        const capsuleId = target[2].toLowerCase();
                        const capsuleItem = player.inventory?.items?.find(item => item.id === capsuleId);

                        if (!capsuleItem) {
                            return api.sendMessage(
                                "❌ Bạn không có viên nang này!\n" +
                                "💡 Kiểm tra danh sách viên nang: .dball capsule",
                                threadID, messageID
                            );
                        }

                        const capsuleData = Object.values(CAPSULE_ITEMS).find(c => c.id === capsuleId);
                        if (!capsuleData || capsuleData.type !== "teleport") {
                            return api.sendMessage("❌ Vật phẩm này không phải là viên nang dịch chuyển!", threadID, messageID);
                        }

                        const now = Date.now();
                        if (capsuleItem.lastUsed && now - capsuleItem.lastUsed < capsuleData.cooldown) {
                            const cooldownLeft = Math.ceil((capsuleItem.lastUsed + capsuleData.cooldown - now) / 60000);
                            return api.sendMessage(
                                `⏳ Viên nang đang hồi chiêu!\n` +
                                `⌛ Còn lại: ${cooldownLeft} phút`,
                                threadID, messageID
                            );
                        }

                        if (capsuleData.requiredPower && player.stats.power < capsuleData.requiredPower) {
                            return api.sendMessage(
                                `❌ Sức mạnh không đủ để sử dụng ${capsuleData.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Yêu cầu: ${capsuleData.requiredPower.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        let targetPlanet = player.location.planet;
                        let targetLocationId = target[3]?.toLowerCase();

                        if (["planet_capsule", "universe_capsule"].includes(capsuleId) && target[3]?.toUpperCase() in WORLD_MAP) {
                            targetPlanet = target[3].toUpperCase();
                            targetLocationId = WORLD_MAP[targetPlanet].locations.find(loc => loc.isStartPoint)?.id ||
                                WORLD_MAP[targetPlanet].locations[0].id;
                        }

                        const planetData = WORLD_MAP[targetPlanet];
                        if (planetData.requiredPower && player.stats.power < planetData.requiredPower) {
                            return api.sendMessage(
                                `❌ Sức mạnh không đủ để đến hành tinh ${planetData.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Yêu cầu: ${planetData.requiredPower.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (planetData.requiredItems) {
                            const hasItems = planetData.requiredItems.every(itemId =>
                                player.inventory?.items?.some(item => item.id === itemId));

                            if (!hasItems) {
                                return api.sendMessage(
                                    `❌ Bạn cần có ${planetData.requiredItems.map(id =>
                                        CAPSULE_ITEMS[id.toUpperCase()]?.name || id).join(", ")} để đến ${planetData.name}!`,
                                    threadID, messageID
                                );
                            }
                        }

                        let targetLocation;

                        if (targetLocationId) {

                            targetLocation = planetData.locations.find(loc => loc.id === targetLocationId);

                            if (!targetLocation && !isNaN(targetLocationId)) {
                                const index = parseInt(targetLocationId) - 1;
                                if (index >= 0 && index < planetData.locations.length) {
                                    targetLocation = planetData.locations[index];
                                }
                            }
                        }

                        if (!targetLocation) {
                            return api.sendMessage(
                                `❌ Không tìm thấy địa điểm này trên hành tinh ${planetData.name}!\n` +
                                "💡 Dùng .dball map để xem danh sách địa điểm",
                                threadID, messageID
                            );
                        }

                        if (targetLocation.requiredPower && player.stats.power < targetLocation.requiredPower) {
                            return api.sendMessage(
                                `❌ Sức mạnh không đủ để đến ${targetLocation.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Yêu cầu: ${targetLocation.requiredPower.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        player.location.planet = targetPlanet;
                        player.location.locationId = targetLocation.id;
                        player.location.name = targetLocation.name;
                        player.location.lastTeleport = now;

                        capsuleItem.lastUsed = now;

                        savePlayerData(playerData);

                        return api.sendMessage(
                            "✨ DI CHUYỂN THÀNH CÔNG! ✨\n" +
                            "───────────────\n" +
                            `📍 Địa điểm mới: ${targetLocation.name}\n` +
                            `🌍 Hành tinh: ${planetData.name}\n` +
                            `📝 ${targetLocation.description}\n\n` +
                            "💡 Dùng .dball map để xem thông tin bản đồ",
                            threadID, messageID
                        );
                    }

                    if (target[1].toLowerCase() === "locations") {
                        const currentPlanet = player.location.planet;
                        const planetData = WORLD_MAP[currentPlanet];

                        let locMsg = `📍 ĐỊA ĐIỂM TRÊN ${planetData.name.toUpperCase()} 📍\n───────────────\n`;

                        planetData.locations.forEach((loc, index) => {
                            const isCurrentLocation = loc.id === player.location.locationId;
                            const canAccess = player.stats.power >= (loc.requiredPower || 0);

                            locMsg += `${isCurrentLocation ? "🟢" : canAccess ? "🔓" : "🔒"} ${index + 1}. ${loc.name}\n`;
                            locMsg += `   ${loc.description}\n`;

                            if (loc.requiredPower && player.stats.power < loc.requiredPower) {
                                locMsg += `   ⚡ Yêu cầu: ${loc.requiredPower.toLocaleString()} sức mạnh\n`;
                            }

                            locMsg += "\n";
                        });

                        locMsg += "💡 Dùng .dball capsule use <loại_viên_nang> <số_thứ_tự> để di chuyển";

                        return api.sendMessage(locMsg, threadID, messageID);
                    }

                    return api.sendMessage(
                        "❓ Bạn muốn làm gì với viên nang?\n" +
                        "• .dball capsule - Xem viên nang đang có\n" +
                        "• .dball capsule use <loại_viên_nang> <địa_điểm> - Sử dụng viên nang\n" +
                        "• .dball capsule locations - Xem địa điểm có thể dịch chuyển\n" +
                        "• .dball map - Xem bản đồ",
                        threadID, messageID
                    );
                }
                case "shop": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;
                    else if (target[1]?.toLowerCase() === "capsule") {
                        const capsuleItems = Object.values(CAPSULE_ITEMS);

                        if (!target[2]) {
                            let msg = "🚀 SHOP CAPSULE DI CHUYỂN 🚀\n───────────────\n";
                            msg += `👤 ${player.name}\n`;
                            msg += `💰 Zeni: ${player.stats.zeni.toLocaleString()}\n\n`;

                            capsuleItems.forEach((item, index) => {
                                const canBuy = player.stats.power >= (item.requiredPower || 0);

                                msg += `${index + 1}. ${item.emoji} ${item.name} - ${item.price.toLocaleString()} Zeni\n`;
                                msg += `   💫 ${item.description}\n`;

                                if (item.requiredPower) {
                                    msg += `   💪 Yêu cầu: ${item.requiredPower.toLocaleString()} sức mạnh`;
                                    msg += canBuy ? " ✅\n" : " ❌\n";
                                }

                                msg += "\n";
                            });

                            msg += "Cách mua:\n";
                            msg += "• .dball shop capsule <số thứ tự>\n";
                            msg += "• Ví dụ: .dball shop capsule 1";

                            return api.sendMessage(msg, threadID, messageID);
                        }

                        const itemIndex = parseInt(target[2]) - 1;
                        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= capsuleItems.length) {
                            return api.sendMessage("❌ Số thứ tự viên nang không hợp lệ!", threadID, messageID);
                        }

                        const selectedCapsule = capsuleItems[itemIndex];

                        if (selectedCapsule.requiredPower && player.stats.power < selectedCapsule.requiredPower) {
                            return api.sendMessage(
                                `❌ Sức mạnh không đủ để mua ${selectedCapsule.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Yêu cầu: ${selectedCapsule.requiredPower.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (player.stats.zeni < selectedCapsule.price) {
                            return api.sendMessage(
                                `❌ Không đủ Zeni để mua!\n` +
                                `💰 Zeni hiện có: ${player.stats.zeni.toLocaleString()}\n` +
                                `💰 Giá: ${selectedCapsule.price.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (!player.inventory) player.inventory = { items: [] };
                        if (!player.inventory.items) player.inventory.items = [];

                        const existingItem = player.inventory.items.find(item => item.id === selectedCapsule.id);
                        if (existingItem) {
                            existingItem.quantity += 1;
                        } else {
                            player.inventory.items.push({
                                id: selectedCapsule.id,
                                type: selectedCapsule.type,
                                quantity: 1
                            });
                        }

                        player.stats.zeni -= selectedCapsule.price;
                        savePlayerData(playerData);

                        return api.sendMessage(
                            "🛍️ MUA THÀNH CÔNG!\n" +
                            "───────────────\n" +
                            `${selectedCapsule.emoji} Đã mua: ${selectedCapsule.name}\n` +
                            `💰 Giá: ${selectedCapsule.price.toLocaleString()} Zeni\n` +
                            `💰 Số dư: ${player.stats.zeni.toLocaleString()} Zeni\n\n` +
                            `💡 Dùng .dball capsule để sử dụng capsule`,
                            threadID, messageID
                        );
                    }
                    else if (target[1]?.toLowerCase() === "rada" || target[1]?.toLowerCase() === "radar") {

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

                        const equipmentItems = Object.values(EQUIPMENT_ITEMS)
                            .filter(item => {

                                if (item.type === "radar") {
                                    return false;
                                }

                                if (player.stats.power < item.requiredPower) {
                                    return false;
                                }

                                if (!item.planet) {
                                    return true;
                                }

                                return item.planet === player.planet;
                            });

                        if (!target[2]) {
                            let msg = "🎽 TIỆM TRANG BỊ 🎽\n───────────────\n";
                            msg += `👤 ${player.name} (${PLANETS[player.planet].name})\n`;
                            msg += `💰 Số dư: ${player.stats.zeni.toLocaleString()} Zeni\n\n`;

                            const groupedEquipment = {
                                armor: equipmentItems.filter(item => item.type === "armor"),
                                gloves: equipmentItems.filter(item => item.type === "gloves"),
                                boots: equipmentItems.filter(item => item.type === "boots")
                            };

                            let itemIndex = 1;

                            if (groupedEquipment.armor.length > 0) {
                                msg += "🛡️ GIÁP:\n";
                                groupedEquipment.armor.forEach(item => {
                                    msg += `${itemIndex}. ${item.emoji} ${item.name}\n`;
                                    msg += `💰 Giá: ${item.price.toLocaleString()} Zeni\n`;
                                    msg += `💪 Yêu cầu: ${item.requiredPower.toLocaleString()} sức mạnh\n`;
                                    msg += `📝 Hiệu quả: Tăng HP x${item.boost}\n`;
                                    if (item.planet) {
                                        msg += `🌍 Chỉ áp dụng cho: ${PLANETS[item.planet].name}\n`;
                                    }
                                    msg += "\n";
                                    itemIndex++;
                                });
                            }

                            if (groupedEquipment.gloves.length > 0) {
                                msg += "🥊 GĂNG TAY:\n";
                                groupedEquipment.gloves.forEach(item => {
                                    msg += `${itemIndex}. ${item.emoji} ${item.name}\n`;
                                    msg += `💰 Giá: ${item.price.toLocaleString()} Zeni\n`;
                                    msg += `💪 Yêu cầu: ${item.requiredPower.toLocaleString()} sức mạnh\n`;
                                    msg += `📝 Hiệu quả: Tăng sát thương x${item.boost}\n`;
                                    if (item.planet) {
                                        msg += `🌍 Chỉ áp dụng cho: ${PLANETS[item.planet].name}\n`;
                                    }
                                    msg += "\n";
                                    itemIndex++;
                                });
                            }

                            if (groupedEquipment.boots.length > 0) {
                                msg += "👢 GIÀY:\n";
                                groupedEquipment.boots.forEach(item => {
                                    msg += `${itemIndex}. ${item.emoji} ${item.name}\n`;
                                    msg += `💰 Giá: ${item.price.toLocaleString()} Zeni\n`;
                                    msg += `💪 Yêu cầu: ${item.requiredPower.toLocaleString()} sức mạnh\n`;
                                    msg += `📝 Hiệu quả: Tăng né tránh x${item.boost}\n`;
                                    if (item.planet) {
                                        msg += `🌍 Chỉ áp dụng cho: ${PLANETS[item.planet].name}\n`;
                                    }
                                    msg += "\n";
                                    itemIndex++;
                                });
                            }

                            msg += "Cách mua:\n";
                            msg += "• .dball shop do <số thứ tự>\n";
                            msg += "• VD: .dball shop do 1 (Mua trang bị số 1)\n\n";
                            msg += `💰 Số dư: ${player.stats.zeni.toLocaleString()} Zeni`;

                            return api.sendMessage(msg, threadID, messageID);
                        }

                        const itemIndex = parseInt(target[2]) - 1;
                        if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= equipmentItems.length) {
                            return api.sendMessage("❌ Số thứ tự trang bị không hợp lệ!", threadID, messageID);
                        }

                        const selectedEquipment = equipmentItems[itemIndex];

                        if (player.stats.zeni < selectedEquipment.price) {
                            return api.sendMessage(
                                `❌ Không đủ Zeni để mua!\n` +
                                `💰 Giá: ${selectedEquipment.price.toLocaleString()}\n` +
                                `💰 Còn thiếu: ${(selectedEquipment.price - player.stats.zeni).toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        if (player.stats.power < selectedEquipment.requiredPower) {
                            return api.sendMessage(
                                `❌ Không đủ sức mạnh để dùng trang bị này!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Yêu cầu: ${selectedEquipment.requiredPower.toLocaleString()}`,
                                threadID, messageID
                            );
                        }

                        // Thêm trang bị vào inventory
                        if (!player.inventory) player.inventory = { items: [] };
                        if (!player.inventory.items) player.inventory.items = [];

                        const existingItem = player.inventory.items.find(i => i.id === selectedEquipment.id);

                        if (existingItem) {
                            existingItem.quantity += 1;
                        } else {
                            player.inventory.items.push({
                                id: selectedEquipment.id,
                                type: selectedEquipment.type,
                                quantity: 1,
                                equipped: true
                            });
                        }

                        player.stats.zeni -= selectedEquipment.price;

                        // Cập nhật chỉ số
                        applyEquipmentBoosts(player);
                        savePlayerData(playerData);

                        // Hiển thị thông báo với hiệu ứng phù hợp
                        let effectDescription;
                        switch (selectedEquipment.type) {
                            case "armor":
                                effectDescription = `Tăng HP x${selectedEquipment.boost}`;
                                break;
                            case "gloves":
                                effectDescription = `Tăng sát thương x${selectedEquipment.boost}`;
                                break;
                            case "boots":
                                effectDescription = `Tăng né tránh x${selectedEquipment.boost}`;
                                break;
                            default:
                                effectDescription = selectedEquipment.description;
                        }

                        return api.sendMessage(
                            "🛍️ MUA TRANG BỊ THÀNH CÔNG!\n" +
                            "───────────────\n" +
                            `${selectedEquipment.emoji} Đã mua: ${selectedEquipment.name}\n` +
                            `💰 Giá: ${selectedEquipment.price.toLocaleString()} Zeni\n` +
                            `📊 Hiệu quả: ${effectDescription}\n` +
                            `💰 Số dư: ${player.stats.zeni.toLocaleString()} Zeni\n\n` +
                            `💡 Trang bị đã được tự động sử dụng.`,
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
                        msg += "• .𝗱𝗯𝗮𝗹𝗹 𝘀𝗵𝗼𝗽 𝗖𝗮𝗽𝘀𝘂𝗹𝗲 - 𝗠𝗼̛̉ 𝘁𝗶𝗲̣̂𝗺 𝗖𝗮𝗽𝘀𝘂𝗹𝗲\n";
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
                    if (!checkPlayer(api, event, player)) return;

                    const oldStats = { ...player.stats };
                    const now = Date.now();
                    const cooldown = 60000;

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
                    if (!checkPlayer(api, event, player)) return;

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
                    if (!checkPlayer(api, event, player)) return;

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
                case "up":
                case "upgrade": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;

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
                    if (!checkPlayer(api, event, player)) return;

                    const tournamentData = loadTournamentData();
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const currentHour = now.getHours();

                    const isTournamentTime = currentHour >= 19 && currentHour < 22;

                    if (!isTournamentTime) {
                        return api.sendMessage(
                            "🏆 ĐẠI HỘI VÕ THUẬT 🏆\n" +
                            "───────────────\n" +
                            "⏰ Giải đấu chỉ diễn ra từ 19h đến 22h hàng ngày\n\n" +
                            "📅 Lịch tổ chức giải đấu:\n" +
                            "• Thứ 2, 4, 6: Đại Hội Võ Thuật Thiên Hạ\n" +
                            "• Thứ 3, 5, 7: Cell Games\n" +
                            "• Chủ Nhật: Giải Đấu Sức Mạnh Vũ Trụ\n\n" +
                            `🕒 Bây giờ là: ${currentHour}h${now.getMinutes() < 10 ? "0" : ""}${now.getMinutes()}\n` +
                            "💡 Vui lòng quay lại trong khung giờ tổ chức!",
                            threadID, messageID
                        );
                    }

                    let tournamentType;
                    if (dayOfWeek === 0) {
                        tournamentType = "UNIVERSE";
                    } else if (dayOfWeek % 2 === 1) {
                        tournamentType = "TENKAICHI";
                    } else { // Thứ 3, 5, 7
                        tournamentType = "CELL";
                    }

                    if (!tournamentData.active || tournamentData.active.status === "completed") {

                        tournamentData.active = {
                            type: tournamentType,
                            status: "registration",
                            startTime: Date.now(),
                            endTime: null,
                            organizer: {
                                id: "system",
                                name: "Hệ Thống"
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
                        saveTournamentData(tournamentData);

                        api.sendMessage(
                            `🏆 GIẢI ĐẤU MỚI ĐÃ ĐƯỢC TẠO! 🏆\n` +
                            `───────────────\n` +
                            `🏟️ Giải đấu: ${TOURNAMENT_TYPES[tournamentType].name}\n` +
                            `👑 Tổ chức bởi: Hệ Thống\n` +
                            `⏰ Trạng thái: Đang mở đăng ký\n\n` +
                            `🏅 Giải thưởng:\n` +
                            `🥇 Hạng nhất: ${TOURNAMENT_TYPES[tournamentType].rewards.first.zeni.toLocaleString()} Zeni, ${TOURNAMENT_TYPES[tournamentType].rewards.first.exp.toLocaleString()} EXP\n` +
                            `🥈 Hạng nhì: ${TOURNAMENT_TYPES[tournamentType].rewards.second.zeni.toLocaleString()} Zeni, ${TOURNAMENT_TYPES[tournamentType].rewards.second.exp.toLocaleString()} EXP\n` +
                            `🥉 Bán kết: ${TOURNAMENT_TYPES[tournamentType].rewards.semifinal.zeni.toLocaleString()} Zeni, ${TOURNAMENT_TYPES[tournamentType].rewards.semifinal.exp.toLocaleString()} EXP\n\n` +
                            `💡 Dùng .dball tour join để đăng ký tham gia\n` +
                            `📝 Đăng ký sẽ đóng sau 15 phút nữa!`,
                            threadID
                        );

                        setTimeout(() => {
                            const currentTournament = loadTournamentData();
                            if (currentTournament.active && currentTournament.active.status === "registration") {
                                startTournament(api, threadID);
                            }
                        }, 15 * 60 * 1000);
                    }

                    if (!target[1]) {
                        if (!tournamentData.active) {
                            return api.sendMessage(
                                "🏆 ĐẠI HỘI VÕ THUẬT 🏆\n" +
                                "───────────────\n" +
                                "❌ Không có giải đấu nào đang diễn ra!\n\n" +
                                "📅 Lịch tổ chức giải đấu:\n" +
                                "• Thứ 2, 4, 6: Đại Hội Võ Thuật Thiên Hạ\n" +
                                "• Thứ 3, 5, 7: Cell Games\n" +
                                "• Chủ Nhật: Giải Đấu Sức Mạnh Vũ Trụ\n\n" +
                                "⏰ Giải đấu diễn ra từ 19h đến 22h hàng ngày\n" +
                                "💡 Dùng .dball tour join để đăng ký tham gia khi giải đấu bắt đầu",
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
                            `👑 Tổ chức bởi: ${tournament.organizer?.name || "Hệ Thống"}\n` +
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
                                `⏰ Giải đấu sẽ bắt đầu sau 15 phút kể từ khi tạo\n` +
                                `💡 Dùng .dball tour list để xem danh sách người tham gia`,
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
                                `👑 Tổ chức bởi: ${tournament.organizer.name}\n` +
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
                                "• .dball tour join - Đăng ký tham gia giải đấu\n" +
                                "• .dball tour info - Xem thông tin giải đấu\n" +
                                "• .dball tour list - Xem danh sách người tham gia\n" +
                                "• .dball tour bracket - Xem bảng đấu\n\n" +
                                "📅 Lịch tổ chức giải đấu:\n" +
                                "• Thứ 2, 4, 6: Đại Hội Võ Thuật Thiên Hạ\n" +
                                "• Thứ 3, 5, 7: Cell Games\n" +
                                "• Chủ Nhật: Giải Đấu Sức Mạnh Vũ Trụ\n\n" +
                                "⏰ Giải đấu diễn ra từ 19h đến 22h hàng ngày",
                                threadID, messageID
                            );
                            break;
                        }
                    }
                }
                case "quest": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;
                    addMissingQuests();
                    fixPlayerQuestProgression(player);
                    if (!player.quests) {
                        player.quests = {
                            active: [],
                            completed: [],
                            progress: {}
                        };
                    }

                    const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
                    console.log(`Player ${player.name} - Planet: ${player.planet}`);
                    console.log(`Completed quests: ${player.quests.completed ? player.quests.completed.join(", ") : "none"}`);
                    console.log(`Planet quests: ${planetQuests ? planetQuests.join(", ") : "undefined"}`);

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

                    if (player.quests.active.length === 0) {

                        let nextQuestIndex = 0;

                        if (player.quests.completed && player.quests.completed.length > 0) {

                            for (let i = 0; i < planetQuests.length; i++) {
                                const questId = planetQuests[i];
                                if (!player.quests.completed.includes(questId)) {
                                    nextQuestIndex = i;
                                    break;
                                }
                                nextQuestIndex = i + 1;
                            }
                        }

                        if (nextQuestIndex < planetQuests.length) {
                            const nextQuestId = planetQuests[nextQuestIndex];

                            if (QUESTS[nextQuestId]) {
                                player.quests.active.push(nextQuestId);
                                player.quests.progress[nextQuestId] = 0;
                                console.log(`Added new quest: ${nextQuestId} at index ${nextQuestIndex}`);
                            } else {
                                console.error(`Quest ${nextQuestId} not found in QUESTS definition`);
                            }

                            savePlayerData(playerData);
                        }
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

                    msg += "💡.𝗱𝗯𝗮𝗹𝗹 𝗳𝗶𝗴𝗵𝘁 𝗺𝗼𝗻𝘀𝘁𝗲𝗿 để 𝗹à𝗺 𝗻𝗵𝗶ệ𝗺 𝘃ụ 𝗾𝘂á𝗶\nNhiệm vụ tự động hoàn thành khi đạt tiến độ\n";

                    return api.sendMessage(msg, threadID, messageID);
                }

                case "learn": {
                    const player = playerData[senderID];
                    if (!checkPlayer(api, event, player)) return;

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
                    if (!checkPlayer(api, event, player)) return;

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
                    if (!checkPlayer(api, event, player)) return;

                    if (player.stats.currentHealth <= 50 && player.stats.currentKi < player.stats.ki * 0.1) {
                        return api.sendMessage(
                            "❌ Bạn đang trong trạng thái kiệt sức!\n" +
                            "💡 Hãy dùng đậu thần (.dball use senzu) để hồi phục trước khi chiến đấu.",
                            threadID, messageID
                        );
                    }
                    if (target[1]?.toLowerCase() === "Boss" || target[1]?.toLowerCase() === "boss") {
                        BOSS_SYSTEM.checkForBossEvents();
                        const allBossEvents = BOSS_SYSTEM.getActiveEvents();

                        if (Object.keys(allBossEvents).length === 0) {
                            return api.sendMessage(
                                "🔍 KHÔNG TÌM THẤY BOSS NÀO ĐANG XUẤT HIỆN! 🔍\n" +
                                "───────────────\n" +
                                "👁️ Hiện tại không có boss nào đang xuất hiện.\n" +
                                "💡 Boss sẽ xuất hiện ngẫu nhiên, hãy kiểm tra thường xuyên!\n" +
                                "💪 Luyện tập để có đủ sức mạnh đối đầu với các boss.",
                                threadID, messageID
                            );
                        }

                        if (!target[2]) {
                            let msg = "👹 BOSS ĐANG XUẤT HIỆN 👹\n───────────────\n";

                            Object.values(allBossEvents).forEach((event, index) => {
                                const bossHealth = event.boss.health - Object.values(event.damageDealt).reduce((sum, damage) => sum + damage, 0);
                                const healthPercent = Math.max(0, Math.floor((bossHealth / event.boss.health) * 100));
                                const timeLeft = Math.floor((event.expireTime - Date.now()) / 60000); // minutes
                                const planetName = PLANETS[event.planet]?.name || "Không xác định";

                                msg += `${index + 1}. ${event.boss.name}\n`;
                                msg += `🌍 Hành tinh: ${planetName}\n`;
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

                        const bossIndex = parseInt(target[2]) - 1;
                        const events = Object.values(allBossEvents);

                        if (isNaN(bossIndex) || bossIndex < 0 || bossIndex >= events.length) {
                            return api.sendMessage("❌ Số thứ tự boss không hợp lệ!", threadID, messageID);
                        }

                        const selectedEvent = events[bossIndex];
                        const eventId = selectedEvent.id;

                        if (player.location?.planet !== selectedEvent.planet ||
                            player.location?.locationId !== selectedEvent.location.id) {

                            return api.sendMessage(
                                `❌ Bạn không ở cùng địa điểm với boss!\n` +
                                `👹 Boss ${selectedEvent.boss.name} đang ở: ${selectedEvent.location.name} (${PLANETS[selectedEvent.planet]?.name})\n` +
                                `👤 Bạn đang ở: ${player.location?.name || "Không xác định"} (${PLANETS[player.location?.planet]?.name})\n\n` +
                                `💡 Dùng viên nang dịch chuyển đến địa điểm của boss để đánh!\n` +
                                `💡 Gõ .dball capsule để xem cách dịch chuyển`,
                                threadID, messageID
                            );
                        }

                        if (player.stats.power < selectedEvent.boss.minPowerRequired) {
                            return api.sendMessage(
                                `❌ Sức mạnh của bạn không đủ để đối đầu với ${selectedEvent.boss.name}!\n` +
                                `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                                `💪 Sức mạnh cần thiết: ${selectedEvent.boss.minPowerRequired.toLocaleString()}\n\n` +
                                "💡 Hãy luyện tập thêm để đủ sức đánh boss!",
                                threadID, messageID
                            );
                        }

                        if (selectedEvent.defeated) {
                            return api.sendMessage(
                                `❌ ${selectedEvent.boss.name} đã bị đánh bại!\n` +
                                "Hãy chờ boss mới xuất hiện.",
                                threadID, messageID
                            );
                        }

                        const now = Date.now();
                        const bossCooldown = 120000;

                        if (player.lastBossFight && now - player.lastBossFight < bossCooldown) {
                            const timeLeft = Math.ceil((bossCooldown - (now - player.lastBossFight)) / 1000);
                            return api.sendMessage(
                                `⏳ Vui lòng đợi ${timeLeft}s để hồi sức sau khi đánh boss!`,
                                threadID, messageID
                            );
                        }

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

                        api.sendMessage(
                            `⚔️ CUỘC CHIẾN VỚI BOSS BẮT ĐẦU! ⚔️\n` +
                            `───────────────\n` +
                            `👤 ${player.name} đang tấn công ${boss.name}!\n` +
                            `🌍 Hành tinh: ${PLANETS[selectedEvent.planet]?.name || "Không xác định"}\n` +
                            `📍 Địa điểm: ${selectedEvent.location.name}\n` +
                            `💪 Sức mạnh boss: ${boss.stats.power.toLocaleString()}\n\n` +
                            "💡 Đang chiến đấu...",
                            threadID
                        );

                        const battleResult = simulateBattle(player, boss, {
                            battleType: "BOSS",
                            maxTurns: 15,
                            isPlayerAttacker: true,
                            isPlayerDefender: false,
                            bossMode: true
                        });

                        player.stats.currentKi = battleResult.player1Ki;
                        player.stats.currentHealth = battleResult.player1HP;
                        player.lastBossFight = now;

                        const damageDealt = battleResult.totalDamage.attacker;

                        const bossDefeated = BOSS_SYSTEM.registerDamage(eventId, senderID, player.name, damageDealt);

                        if (bossDefeated) {
                            const rewards = BOSS_SYSTEM.getPlayerRewards(eventId, senderID);

                            if (rewards) {
                                player.stats.exp += rewards.exp;
                                player.stats.zeni += rewards.zeni;

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

                        await displayPVPBattle(api, threadID, messageID, battleResult, player, opponent);
                        if (player.stats.currentHealth !== battleResult.player1HP) {
                            player.stats.currentHealth = battleResult.player1HP;
                        }

                        savePlayerData(playerData);
                    }
                    return;
                }

                case "rank": {
                    try {
                        const playerData = loadPlayerData();
                        if (!playerData || Object.keys(playerData).length === 0) {
                            return api.sendMessage("⚠️ Chưa có người chơi nào!", event.threadID, event.messageID);
                        }

                        const rankType = target[1]?.toUpperCase() || "POWER";
                        const validTypes = ["POWER", "ZENI", "EXP"];
                        const actualRankType = validTypes.includes(rankType) ? rankType : "POWER";

                        const planetFilter = target[2]?.toUpperCase();
                        let filteredPlayers = Object.entries(playerData).map(([id, player]) => ({
                            id,
                            name: player.name,
                            planet: player.planet || "EARTH",
                            evolution: player.evolution?.name,
                            value: actualRankType === "POWER" ? player.stats.power :
                                actualRankType === "ZENI" ? player.stats.zeni :
                                    player.stats.exp,
                            stats: player.stats
                        }));

                        if (planetFilter && ["EARTH", "NAMEK", "SAIYAN"].includes(planetFilter)) {
                            filteredPlayers = filteredPlayers.filter(p => p.planet === planetFilter);

                            if (filteredPlayers.length === 0) {
                                return api.sendMessage(`⚠️ Không tìm thấy người chơi nào từ hành tinh ${planetFilter}!`,
                                    event.threadID, event.messageID);
                            }
                        }

                        const sortedPlayers = filteredPlayers.sort((a, b) => b.value - a.value);

                        const rankData = {
                            rankType: actualRankType,
                            planet: "DEFAULT",
                            planetFilter: planetFilter,
                            currentUserId: event.senderID,
                            players: sortedPlayers
                        };

                        if (sortedPlayers.length > 0) {
                            rankData.planet = sortedPlayers[0].planet;
                        }

                        createRankImage(rankData).then(imagePath => {
                            api.sendMessage(
                                {
                                    body: `🏆 BẢNG XẾP HẠNG ${actualRankType === "POWER" ? "SỨC MẠNH" :
                                        actualRankType === "ZENI" ? "ZENI" :
                                            "KINH NGHIỆM"} 🏆\n` +
                                        (planetFilter ? `Lọc theo hành tinh: ${getPlanetName(planetFilter)}\n` : '') +
                                        `⏰ Cập nhật: ${new Date().toLocaleString("vi-VN")}`,
                                    attachment: fs.createReadStream(imagePath)
                                },
                                event.threadID,
                                (err) => {
                                    if (err) console.error(err);

                                    setTimeout(() => {
                                        try {
                                            fs.unlinkSync(imagePath);
                                        } catch (e) {
                                            console.error("Không thể xóa file:", e);
                                        }
                                    }, 5000);
                                },
                                event.messageID
                            );
                        }).catch(err => {
                            console.error("Lỗi tạo bảng xếp hạng:", err);
                            api.sendMessage("❌ Đã xảy ra lỗi khi tạo bảng xếp hạng!", event.threadID, event.messageID);
                        });
                    } catch (error) {
                        console.error("Lỗi lệnh rank:", error);
                        api.sendMessage("❌ Đã xảy ra lỗi khi tạo bảng xếp hạng!", event.threadID, event.messageID);
                    }
                    return;
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
