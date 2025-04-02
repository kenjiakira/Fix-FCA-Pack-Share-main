const fs = require("fs");
const path = require("path");

const DB_FOLDER = path.join(__dirname, "json", "dragonball");
const DB_FILE = path.join(DB_FOLDER, "players.json");
const DB_BALL_FILE = path.join(DB_FOLDER, "ball.json");
const PVP_INVITES = {};
const PVP_INVITE_TIMEOUT = 300000; 

const DRAGON_WISHES = {
    ZENI: {
        name: "Túi Zeni khổng lồ",
        reward: "100,000 Zeni",
        effect: (player) => {
            player.stats.zeni += 100000;
        }
    },
    POWER: {
        name: "Sức mạnh vô hạn",
        reward: "200,000,000 sức mạnh",
        effect: (player) => {
            player.stats.power += 200000000;
        }
    },
    EXP: {
        name: "Kinh nghiệm chiến đấu",
        reward: "200,000 EXP",
        effect: (player) => {
            if (player.stats.exp + 200000 > MAX_EXP_STORAGE) {
                player.stats.exp = MAX_EXP_STORAGE;
            } else {
                player.stats.exp += 200000;
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
        description: "Tăng 10% Ki khi đeo",
        type: "equipment",
        emoji: "🔋"
    },
    DRAGON_RADAR: {
        id: "radar",
        name: "Rada Dò Ngọc Rồng",
        price: 75000,
        description: "Tăng tỷ lệ tìm thấy Ngọc Rồng lên 3 lần",
        type: "equipment",
        emoji: "📡"
    },
    ARMOR: {
        id: "armor",
        name: "Áo Giáp Saiyan",
        price: 15000,
        description: "Tăng 15% HP",
        type: "equipment",
        emoji: "🛡️"
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
    COMBAT: "combat",       // Đánh quái vật
    POWER: "power",         // Đạt mức sức mạnh
    TRAINING: "training",   // Luyện tập x lần
    COLLECT: "collect",     // Thu thập vật phẩm
    MASTER: "master"        // Gặp sư phụ
};
const PLANET_QUEST_PROGRESSION = {
    EARTH: [
        "BEGINNER_1",      // Luyện tập
        "BEGINNER_2",      // Sức mạnh cơ bản
        "EARTH_WOLF",      // Đánh sói (quái yếu nhất Trái Đất)
        "MEET_MASTER_1",   // Gặp sư phụ
        "EARTH_SAIBAMEN",  // Đánh Saibamen (quái mạnh hơn)
        "POWER_LV1",       // Đạt sức mạnh 10k
        "DRAGON_BALL_1",   // Thu thập 3 viên ngọc rồng
        "POWER_LV2",       // Đạt sức mạnh 50k
        "EARTH_BOSS",      // Đánh boss Trái Đất
        "DRAGON_BALL_ALL"  // Thu thập đủ 7 viên ngọc
    ],
    NAMEK: [
        "BEGINNER_1",      // Luyện tập
        "BEGINNER_2",      // Sức mạnh cơ bản  
        "NAMEK_APPULE",    // Đánh Appule (quái yếu nhất Namek)
        "MEET_MASTER_1",   // Gặp sư phụ
        "NAMEK_SOLDIER",   // Đánh lính Freeza (quái mạnh hơn)
        "POWER_LV1",       // Đạt sức mạnh 10k
        "DRAGON_BALL_1",   // Thu thập 3 viên ngọc rồng
        "POWER_LV2",       // Đạt sức mạnh 50k
        "NAMEK_BOSS",      // Đánh boss Namek
        "DRAGON_BALL_ALL"  // Thu thập đủ 7 viên ngọc
    ],
    SAIYAN: [
        "BEGINNER_1",      // Luyện tập
        "BEGINNER_2",      // Sức mạnh cơ bản
        "SAIYAN_RADITZ",   // Đánh Raditz (quái yếu nhất Saiyan)
        "MEET_MASTER_1",   // Gặp sư phụ
        "SAIYAN_NAPPA",    // Đánh Nappa (quái mạnh hơn)
        "POWER_LV1",       // Đạt sức mạnh 10k
        "DRAGON_BALL_1",   // Thu thập 3 viên ngọc rồng
        "POWER_LV2",       // Đạt sức mạnh 50k
        "SAIYAN_BOSS",     // Đánh boss Saiyan
        "DRAGON_BALL_ALL"  // Thu thập đủ 7 viên ngọc
    ]
};
const QUESTS = {

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

    // Nhiệm vụ đánh quái
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
    EARTH_BOSS: {
        id: "EARTH_BOSS",
        name: "Thử thách cuối cùng",
        description: "Đánh bại Mercenary Tao",
        type: QUEST_TYPES.COMBAT,
        target: 1,
        monster: "mercenary_tao",
        reward: {
            exp: 10000,
            zeni: 20000,
            item: "armor",
            quantity: 1,
            description: "10000 EXP, 20000 Zeni, 1 Áo Giáp Saiyan"
        },
        requiredLevel: 15
    },

    // Nhiệm vụ đánh quái - Namek
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

    // Nhiệm vụ đánh quái - Saiyan
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

    // Nhiệm vụ gặp sư phụ
    MEET_MASTER_1: {
        id: "MEET_MASTER_1",
        name: "Tìm kiếm người hướng dẫn",
        description: "Gặp sư phụ đầu tiên của bạn",
        type: QUEST_TYPES.MASTER,
        target: 1,
        reward: {
            exp: 2000,
            item: "senzu",
            quantity: 2,
            description: "2000 EXP, 2 Đậu Thần"
        },
        requiredLevel: 1
    },

    // Nhiệm vụ thu thập
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

    // Nhiệm vụ sức mạnh cao cấp
    POWER_LV1: {
        id: "POWER_LV1",
        name: "Sức mạnh thật sự",
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

    // Nhiệm vụ hướng đến Rồng Thần
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

const EVOLUTION_SYSTEM = {
    EARTH: {
        // Trái Đất không có tiến hóa
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
                powerBonus: 1.5,
                kiBonus: 1.8,
                healthBonus: 1.5,
                damageBonus: 1.5
            },
            {
                name: "Namek Fusion",
                powerRequired: 10000000,
                description: "Namek hợp thể với sức mạnh của nhiều Namek",
                powerBonus: 2.0,
                kiBonus: 2.5,
                healthBonus: 2.0,
                damageBonus: 2.2
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
            // Đã loại bỏ dạng Oozaru (khỉ khổng lồ)
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
                description: "Sức mạnh thần thánh của các vị thần",
                powerBonus: 5.0,
                kiBonus: 4.0,
                healthBonus: 3.0,
                damageBonus: 5.0
            },
            {
                name: "Ultra Instinct",
                powerRequired: 1000000000,
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
        name: "Hành tinh Vegeta",
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
    NAMEK: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
    SAIYAN: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null }
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
                powerRequired: 10000,
                description: "Kamehameha phiên bản lỗi của Goku"
            },
            SOLAR_FLARE: {
                name: "Thái Dương Hạ San",
                powerScale: 0,
                kiCost: 0.4,
                powerRequired: 50000,
                description: "Choáng đối thủ 10s"
            },
            KAIOKEN: {
                name: "Kaioken",
                powerScale: 0,
                kiCost: 0.5,
                powerRequired: 100000,
                description: "Tăng x30 HP, KI, Sức đánh"
            },
            SPIRIT_BOMB: {
                name: "Quả Cầu Kinh Khí",
                powerScale: 8.0,
                kiCost: 1.0,
                powerRequired: 2000000,
                description: "Tạo quả cầu cực mạnh tốn 100% ki"
            },
            HYPNOSIS: {
                name: "Thôi Miên",
                powerScale: 0,
                kiCost: 0.6,
                powerRequired: 5000000,
                description: "Choáng đối thủ 30s"
            },
            ENERGY_SHIELD: {
                name: "Khiên Năng Lượng",
                powerScale: 0,
                kiCost: 0.7,
                powerRequired: 50000000,
                description: "Chịu mọi sát thương trong 40s"
            }
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
                powerRequired: 100000,
                description: "Xoáy ma khoan xuyên thủng"
            },
            LIGHT_GRENADE: {
                name: "Light Grenade",
                powerScale: 3.0,
                kiCost: 0.5,
                powerRequired: 500000,
                description: "Quả cầu ánh sáng hủy diệt"
            },
            HELLZONE_GRENADE: {
                name: "Hellzone Grenade",
                powerScale: 4.0,
                kiCost: 0.6,
                powerRequired: 5000000,
                description: "Bẫy địa ngục không lối thoát"
            },
            MULTIFORM: {
                name: "Phân Thân",
                powerScale: 5.0,
                kiCost: 0.7,
                powerRequired: 10000000,
                description: "Tạo nhiều bản sao chiến đấu"
            },
            REGENERATION: {
                name: "Tái Tạo",
                powerScale: 0,
                kiCost: -0.3,
                powerRequired: 50000,
                description: "Hồi phục 30% HP"
            },
            DEMONICAL_FLAVOR: {
                name: "Hương Vị Quỷ Dữ",
                powerScale: 3.5,
                kiCost: 0.55,
                powerRequired: 7500000,
                description: "Tấn công bằng năng lượng quỷ dữ"
            },
            EXPLODING_STORM: {
                name: "Bão Năng Lượng",
                powerScale: 4.5,
                kiCost: 0.65,
                powerRequired: 15000000,
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
                powerRequired: 100000,
                description: "Hồi phục Ki nhanh chóng"
            },
            SELF_DESTRUCT: {
                name: "Tự Phát Nổ",
                powerScale: 10.0,
                kiCost: 1.0,
                powerRequired: 2000000,
                description: "Hy sinh bản thân để gây sát thương lớn"
            },
            WHISTLE: {
                name: "Huýt Sáo",
                powerScale: 0,
                kiCost: -0.3,
                powerRequired: 500000,
                description: "Hồi HP và Ki cho bản thân"
            },
            BIND: {
                name: "Trói",
                powerScale: 0,
                kiCost: 0.3,
                powerRequired: 1000000,
                description: "Trói đối thủ trong 15 giây"
            },
            CADICH_LIEN_HOAN_TRUONG: {
                name: "Cadich Liên Hoàn Trưởng",
                powerScale: 6.0,
                kiCost: 0.8,
                powerRequired: 10000000,
                description: "Tấn công liên hoàn bằng chưởng"
            },
            ENERGY_SHIELD: {
                name: "Khiên Năng Lượng",
                powerScale: 0,
                kiCost: 0.5,
                powerRequired: 50000000,
                description: "Tạo khiên bảo vệ trong 40 giây"
            }
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
    BASE_EXP: { min: 100, max: 300 },
    POWER_BONUS: {
        thresholds: [
            { percent: 1, bonus: 1.2 },
            { percent: 5, bonus: 1.5 },
            { percent: 10, bonus: 2.0 },
            { percent: 25, bonus: 2.5 },
            { percent: 50, bonus: 3.0 },
            { percent: 75, bonus: 4.0 },
            { percent: 90, bonus: 5.0 }
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
    health: 1000,
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
function updateQuestProgress(player, type, data = {}) {
    if (!player.quests || !player.quests.active) return;

    player.quests.active.forEach(questId => {
        const quest = QUESTS[questId];
        if (!quest || quest.type !== type) return;

        switch (type) {
            case QUEST_TYPES.TRAINING:

                if (!player.quests.progress[questId]) player.quests.progress[questId] = 0;
                player.quests.progress[questId]++;
                break;

            case QUEST_TYPES.POWER:

                if (player.stats.power >= quest.target) {
                    player.quests.progress[questId] = quest.target;
                }
                break;

            case QUEST_TYPES.COMBAT:

                if (data.monster === quest.monster) {
                    if (!player.quests.progress[questId]) player.quests.progress[questId] = 0;
                    player.quests.progress[questId]++;
                }
                break;

            case QUEST_TYPES.COLLECT:

                if (quest.itemType === "dragonBall") {

                    const dragonBalls = player.inventory?.dragonBalls || [];
                    player.quests.progress[questId] = dragonBalls.length;
                } else if (quest.itemType === "dragonBall7") {

                    const planets = ["EARTH", "NAMEK", "SAIYAN"];
                    let hasComplete = false;

                    for (const planet of planets) {
                        if (hasAllDragonBalls(player, planet)) {
                            hasComplete = true;
                            break;
                        }
                    }

                    player.quests.progress[questId] = hasComplete ? 7 : 0;
                }
                break;

            case QUEST_TYPES.MASTER:
                player.quests.progress[questId] = player.masters?.length || 0;
                break;
        }
    });
}
function checkStatLimit(value, type) {
    const limit = STAT_LIMITS[type];
    return value > limit ? limit : value;
}
// Sửa hàm calculateExpGain để tính thêm bonus từ sức đánh
function calculateExpGain(power, damage) {
    // Base EXP từ sức mạnh
    const baseExp = Math.floor(Math.random() *
        (EXP_SYSTEM.BASE_EXP.max - EXP_SYSTEM.BASE_EXP.min + 1)) +
        EXP_SYSTEM.BASE_EXP.min;

    // Bonus từ sức mạnh
    const powerPercent = (power / EXP_SYSTEM.POWER_BONUS.MAX_POWER) * 100;
    let powerBonus = 1.0;
    
    for (const threshold of EXP_SYSTEM.POWER_BONUS.thresholds) {
        if (powerPercent >= threshold.percent) {
            powerBonus = threshold.bonus;
        } else {
            break;
        }
    }
    
    // Bonus mới từ sức đánh: mỗi 1000 sức đánh tăng 5% EXP
    const damageBonus = 1.0 + Math.floor(damage / 1000) * 0.05;
    
    // Kết hợp cả hai bonus
    return Math.floor(baseExp * powerBonus * damageBonus);
}
function checkAndUpdateEvolution(player) {
    if (player.planet === "EARTH" || !EVOLUTION_SYSTEM[player.planet]) {
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
            achievedAt: new Date().toISOString()
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
module.exports = {
    name: "dball",
    version: "1.1.2",
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
    },


    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, "../events/cache/userData.json")));

        const playerData = loadPlayerData();
        const command = target[0]?.toLowerCase();

        if (!target[0]) {
            if (playerData[senderID]) {
                return api.sendMessage(
                    "🐉 DRAGON BALL Z 🐉\n" +
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
            }

            return api.sendMessage(
                "🐉 DRAGON BALL Z 🐉\n" +
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
        if (!playerData[senderID] && Object.keys(PLANETS).some(p => p.toLowerCase() === command)) {
            const planet = Object.keys(PLANETS).find(p => p.toLowerCase() === command);
            const userName = userData[senderID]?.name || "Người chơi";

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

            const player = playerData[senderID];
            updateQuestProgress(player, QUEST_TYPES.MASTER);

            savePlayerData(playerData);

            return api.sendMessage(
                "🎉 NHÂN VẬT ĐÃ ĐƯỢC TẠO!\n" +
                "───────────────\n" +
                `👤 Tên: ${userName}\n` +
                `🌍 Tộc người: ${PLANETS[planet].name}\n` +
                `💪 Sức mạnh cơ bản: ${DEFAULT_STATS.power}\n` +
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

                // Hiển thị Ngọc Rồng
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

                    // Thêm thông báo về việc có đủ 7 viên Ngọc Rồng
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
                        evolutionInfo += `💪 x${evolutionForm.powerBonus} Sức mạnh\n`;
                        evolutionInfo += `⚔️ x${evolutionForm.damageBonus} Sức đánh\n`;
                        evolutionInfo += `✨ x${evolutionForm.kiBonus} Ki\n`;
                        evolutionInfo += `❤️ x${evolutionForm.healthBonus} HP\n`;
                    }
                }
                return api.sendMessage(
                    "📊 THÔNG TIN NHÂN VẬT 📊\n" +
                    "───────────────\n" +
                    `👤 Tên: ${player.name}\n` +
                    `🌍 Tộc Người: ${PLANETS[player.planet].name}\n` +
                    `💪 Sức mạnh: ${player.stats.power.toLocaleString()}\n` +
                    `⚔️ Sức đánh: ${player.stats.damage.toLocaleString()}\n` +
                    `✨ Ki: ${player.stats.ki.toLocaleString()}\n` +
                    `❤️ HP: ${player.stats.health.toLocaleString()}\n` +
                    `💰 Zeni: ${(player.stats.zeni || 0).toLocaleString()}\n` +
                    `📊 EXP: ${player.stats.exp.toLocaleString()}` +
                    evolutionInfo +
                    skillList + masterList + inventoryList,
                    threadID, messageID
                );
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

                switch (shopItem.type) {
                    case "consumable": {
                        inventoryItem.quantity--;

                        switch (itemId) {
                            case "senzu": {
                                const oldPower = player.stats.power;
                                const oldKi = player.stats.ki;
                                
                                player.stats.health = Math.max(player.stats.health, 1000);
                                
                                player.stats.ki = player.stats.ki; 
                                player.stats.ki = Math.max(player.stats.ki, 1000); 
                                
                                player.stats.power = Math.floor(player.stats.power * 1.05);
                            
                                if (inventoryItem.quantity <= 0) {
                                    player.inventory.items = player.inventory.items.filter(item => item.id !== itemId);
                                }
                            
                                return api.sendMessage(
                                    "✨ SỬ DỤNG ĐẬU THẦN THÀNH CÔNG!\n" +
                                    "───────────────\n" +
                                    "❤️ HP đã được hồi phục hoàn toàn!\n" +
                                    "✨ Ki đã được hồi phục hoàn toàn!\n" +
                                    `💪 Sức mạnh: ${oldPower} → ${player.stats.power}\n` +
                                    `📦 Còn lại: ${inventoryItem.quantity} Đậu Thần`,
                                    threadID, messageID
                                );
                            }
                            case "crystal": {
                                const oldPower = player.stats.power;
                                player.stats.power += 1000;

                                if (inventoryItem.quantity <= 0) {
                                    player.inventory.items = player.inventory.items.filter(item => item.id !== itemId);
                                }

                                return api.sendMessage(
                                    "💎 SỬ DỤNG TINH THỂ THÀNH CÔNG!\n" +
                                    "───────────────\n" +
                                    `💪 Sức mạnh: ${oldPower} → ${player.stats.power}\n` +
                                    `📦 Còn lại: ${inventoryItem.quantity} Tinh Thể`,
                                    threadID, messageID
                                );
                            }
                        }
                        break;
                    }
                    case "radar": {
                        return api.sendMessage(
                            "📡 TRANG BỊ THÀNH CÔNG!\n" +
                            "───────────────\n" +
                            `Đã trang bị: ${shopItem.name}\n` +
                            "🔍 Tỷ lệ tìm thấy Ngọc Rồng tăng x3",
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

                        inventoryItem.equipped = true;

                        switch (itemId) {
                            case "scouter": {
                                const oldKi = player.stats.ki;
                                player.stats.ki = Math.floor(player.stats.ki * 1.1);

                                return api.sendMessage(
                                    "🔋 TRANG BỊ THÀNH CÔNG!\n" +
                                    "───────────────\n" +
                                    `Đã trang bị: ${shopItem.name}\n` +
                                    `✨ Ki: ${oldKi} → ${player.stats.ki}`,
                                    threadID, messageID
                                );
                            }
                            case "armor": {
                                const oldHealth = player.stats.health;
                                player.stats.health = Math.floor(player.stats.health * 1.15);

                                return api.sendMessage(
                                    "🛡️ TRANG BỊ THÀNH CÔNG!\n" +
                                    "───────────────\n" +
                                    `Đã trang bị: ${shopItem.name}\n` +
                                    `❤️ HP: ${oldHealth} → ${player.stats.health}`,
                                    threadID, messageID
                                );
                            }
                        }
                        break;
                    }
                }

                savePlayerData(playerData);
            }
            case "shop": {
                const player = playerData[senderID];
                if (!player) {
                    return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                }

                const shopItemsArray = Object.values(SHOP_ITEMS);

                if (!target[1]) {
                    let msg = "🏪 SHOP VẬT PHẨM 🏪\n───────────────\n\n";

                    shopItemsArray.forEach((item, index) => {
                        msg += `${index + 1}. ${item.emoji} ${item.name}\n`;
                        msg += `💰 Giá: ${item.price.toLocaleString()} Zeni\n`;
                        msg += `📝 ${item.description}\n`;
                        msg += `📦 Loại: ${item.type === "consumable" ? "Tiêu hao" : item.type === "equipment" ? "Trang bị" : "Đặc biệt"}\n\n`;
                    });

                    msg += "Cách dùng:\n";
                    msg += "• .dball shop <số thứ tự> <số lượng>\n";
                    msg += "• VD: .dball shop 1 1 (Mua vật phẩm số 1, số lượng 1)\n\n";
                    msg += `💰 Zeni hiện có: ${player.stats.zeni.toLocaleString()}`;

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
                        `❌ Không đủ Zeni để mua!\n` +
                        `💰 Zeni hiện có: ${player.stats.zeni.toLocaleString()}\n` +
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
                    "🛍️ MUA THÀNH CÔNG!\n" +
                    "───────────────\n" +
                    `${item.emoji} Đã mua: ${item.name} x${quantity}\n` +
                    `💰 Tổng giá: ${totalCost.toLocaleString()} Zeni\n` +
                    `💰 Số Zeni còn lại: ${player.stats.zeni.toLocaleString()}\n\n` +
                    `💡 Dùng .dball use ${item.id} để sử dụng/trang bị`,
                    threadID, messageID
                );
            }
            case "train": {
                
                const player = playerData[senderID];
                if (!player) {
                    return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                }
                const powerGain = Math.floor(Math.random() * 50) + 50;

                player.stats.power = checkStatLimit(
                    player.stats.power + powerGain,
                    'POWER'
                );

                const now = Date.now();
                const cooldown = 60000;
                if (now - player.lastTrain < cooldown) {
                    const timeLeft = Math.ceil((cooldown - (now - player.lastTrain)) / 1000);
                    return api.sendMessage(
                        `⏳ Vui lòng đợi ${timeLeft}s để hồi phục sức!`,
                        threadID, messageID
                    );
                }

                // Áp dụng các hiệu ứng từ trang bị
                let expBonus = 1.0;
                let hasRadar = false;

                if (player.inventory?.items) {
                    const equippedItems = player.inventory.items.filter(item => item.equipped);
                    equippedItems.forEach(item => {
                        if (item.id === "gravity") {
                            expBonus *= 1.2; // Tăng 20% EXP
                        }
                        if (item.id === "radar") {
                            hasRadar = true;
                        }
                    });
                }

                const expGain = Math.floor(calculateExpGain(player.stats.power, player.stats.damage) * expBonus);
                const powerPercent = (player.stats.damage / EXP_SYSTEM.POWER_BONUS.MAX_POWER) * 100;

                if (player.stats.exp + expGain > MAX_EXP_STORAGE) {
                    player.stats.exp = MAX_EXP_STORAGE;
                } else {
                    player.stats.exp += expGain;
                }

                const normalZeni = Math.floor(Math.random() * (ZENI_INFO.TRAIN_MAX - ZENI_INFO.TRAIN_MIN + 1)) + ZENI_INFO.TRAIN_MIN;
                if (!player.stats.zeni) player.stats.zeni = 0;
                player.stats.zeni += normalZeni;

                let zeniMessage = `\n💰 Zeni +${normalZeni}`;
                if (Math.random() < ZENI_INFO.FIND_CHANCE) {
                    const specialZeni = Math.floor(Math.random() * (ZENI_INFO.SPECIAL_MAX - ZENI_INFO.SPECIAL_MIN + 1)) + ZENI_INFO.SPECIAL_MIN;
                    player.stats.zeni += specialZeni;
                    zeniMessage += `\n🌟 BẠN TÌM THẤY TÚI ZENI ĐẶC BIỆT! +${specialZeni} ZENI`;
                }

                player.lastTrain = now;

                const meetMaster = Math.random() < 0.3;
                let masterMessage = "";
                let dragonBallMessage = "";

                // Tính tỷ lệ tìm thấy Ngọc Rồng (có/không có radar)
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

                        dragonBallMessage += `\n\n🌟 BẠN ĐÃ TÌM THẤY NGỌC RỒNG ${randomStar} SAO!`;

                        if (hasAllDragonBalls(player, player.planet)) {
                            dragonBallMessage += "\n\n🐉 BẠN ĐÃ THU THẬP ĐỦ 7 VIÊN NGỌC RỒNG!\n";
                            dragonBallMessage += "💡 Dùng .dball wish để thực hiện điều ước!";
                        }
                    }
                }
                const damageBonus = 1.0 + Math.floor(player.stats.damage / 1000) * 0.05;
                const evolution = checkAndUpdateEvolution(player);
                let evolutionMessage = "";
                if (evolution) {
                    evolutionMessage = "\n\n🌟 TIẾN HÓA MỚI! 🌟\n" +
                        `Bạn đã tiến hóa thành: ${evolution.name}\n` +
                        `💪 Sức mạnh: ${evolution.oldPower.toLocaleString()} → ${evolution.newPower.toLocaleString()}\n` +
                        `⚔️ Sức đánh: ${evolution.oldDamage.toLocaleString()} → ${evolution.newDamage.toLocaleString()}\n` +
                        `✨ Ki: ${evolution.oldKi.toLocaleString()} → ${evolution.newKi.toLocaleString()}\n` +
                        `❤️ HP: ${evolution.oldHealth.toLocaleString()} → ${evolution.newHealth.toLocaleString()}`;
                }

                updateQuestProgress(player, QUEST_TYPES.TRAINING);
                updateQuestProgress(player, QUEST_TYPES.POWER);
                savePlayerData(playerData);

                return api.sendMessage(
                    "⚔️ KẾT QUẢ LUYỆN TẬP ⚔️\n" +
                    "───────────────\n" +
                    `📊 EXP +${expGain}` + 
                    (expBonus > 1 ? ` (x${expBonus.toFixed(1)} từ trang bị)` : "") +
                    (damageBonus > 1 ? ` (x${damageBonus.toFixed(2)} từ sức đánh)` : "") +
                    zeniMessage + "\n" +
                    `\n💡 Chỉ số hiện tại:\n` +
                    `💪 Sức mạnh: ${player.stats.power}\n` +
                    `⚔️ Sức đánh: ${player.stats.damage}\n` +
                    `✨ Ki: ${player.stats.ki}\n` +
                    `❤️ HP: ${player.stats.health}\n` +
                    `💰 Zeni: ${player.stats.zeni.toLocaleString()}\n` +
                    `📊 EXP: ${player.stats.exp.toLocaleString()}\n\n` +
                    `💡 Dùng .dball upgrade để nâng cấp chỉ số\n` +
                    `💡 Dùng .dball learn để học kĩ năng` +
                    masterMessage +
                    dragonBallMessage +
                    evolutionMessage,
                    threadID, messageID
                );
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
                        "🐉 THỰC HIỆN ĐIỀU ƯỚC 🐉\n" +
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
                    "🌟 ĐIỀU ƯỚC ĐÃ ĐƯỢC THỰC HIỆN! 🌟\n" +
                    "───────────────\n" +
                    `Rồng thần ${wishPlanet === "EARTH" ? "Shenron" : wishPlanet === "NAMEK" ? "Porunga" : "Super Shenron"} đã ban cho bạn:\n` +
                    `${wish.name} - ${wish.reward}\n\n` +
                    "💡 Các Ngọc Rồng đã bay đi khắp hành tinh sau khi thực hiện điều ước!\n\n" +
                    "Chỉ số hiện tại:\n" +
                    `💪 Sức mạnh: ${player.stats.power.toLocaleString()}\n` +
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
                    return api.sendMessage("❌ Vui lòng tag người muốn tặng Ngọc Rồng!", threadID, messageID);
                }

                const targetPlayer = playerData[mention];
                if (!targetPlayer) {
                    return api.sendMessage("❌ Người này chưa tạo nhân vật!", threadID, messageID);
                }

                if (!target[1] || isNaN(parseInt(target[1]))) {
                    return api.sendMessage(
                        "❌ Cú pháp không hợp lệ!\n" +
                        "Cách dùng: .dball give @mention <số_sao>\n" +
                        "Ví dụ: .dball give @TenNguoiChoi 3",
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
                        "⚡ NÂNG CẤP CHỈ SỐ ⚡\n" +
                        "───────────────\n" +
                        `📊 EXP hiện tại: ${player.stats.exp.toLocaleString()}\n\n` +
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
                        `❌ Không đủ EXP để nâng cấp!\n` +
                        `📊 EXP hiện tại: ${player.stats.exp.toLocaleString()}\n` +
                        `📊 EXP cần: ${totalCost.toLocaleString()}\n` +
                        `📊 Còn thiếu: ${(totalCost - player.stats.exp).toLocaleString()} EXP`,
                        threadID, messageID
                    );
                }

                player.stats.exp -= totalCost;
                player.stats[statToUpgrade] += increaseAmount * amount;

                savePlayerData(playerData);

                return api.sendMessage(
                    "🎉 NÂNG CẤP THÀNH CÔNG!\n" +
                    "───────────────\n" +
                    `${statName} +${increaseAmount * amount}\n` +
                    `📊 EXP -${totalCost.toLocaleString()}\n\n` +
                    "💡 Chỉ số hiện tại:\n" +
                    `💪 Sức mạnh: ${player.stats.power.toLocaleString()}\n` +
                    `⚔️ Sức đánh: ${player.stats.damage.toLocaleString()}\n` +
                    `✨ Ki: ${player.stats.ki.toLocaleString()}\n` +
                    `❤️ HP: ${player.stats.health.toLocaleString()}\n` +
                    `📊 EXP: ${player.stats.exp.toLocaleString()}/${MAX_EXP_STORAGE.toLocaleString()}`,
                    threadID, messageID
                );
            }
            case "quest": {
                const player = playerData[senderID];
                if (!player) {
                    return api.sendMessage("❌ Bạn chưa tạo nhân vật!", threadID, messageID);
                }

                if (!player.quests) {
                    player.quests = {
                        active: [],
                        completed: [],
                        progress: {}
                    };

                    const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
                    if (planetQuests && planetQuests.length > 0) {
                        player.quests.active.push(planetQuests[0]);
                        player.quests.progress[planetQuests[0]] = 0;
                        savePlayerData(playerData);
                    }
                }

                if (target[1] === "hoàn" || target[1] === "hoan" || target[1] === "complete") {
                    if (player.quests.active.length === 0) {
                        return api.sendMessage("❌ Bạn không có nhiệm vụ nào đang làm!", threadID, messageID);
                    }

                    const questId = player.quests.active[0];
                    const quest = QUESTS[questId];

                    if (!quest) {
                        return api.sendMessage("❌ Nhiệm vụ không tồn tại!", threadID, messageID);
                    }

                    const progress = player.quests.progress[questId] || 0;

                    if (progress < quest.target) {
                        return api.sendMessage(
                            "❌ Bạn chưa hoàn thành nhiệm vụ này!\n" +
                            `⏳ Tiến độ: ${progress}/${quest.target}\n\n` +
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

                        const existingItem = player.inventory.items.find(i => i.id === quest.reward.item);
                        if (existingItem) {
                            existingItem.quantity += (quest.reward.quantity || 1);
                        } else {
                            player.inventory.items.push({
                                id: quest.reward.item,
                                quantity: quest.reward.quantity || 1,
                                type: SHOP_ITEMS[quest.reward.item.toUpperCase()]?.type || "quest_item"
                            });
                        }
                    }

                    player.quests.active = player.quests.active.filter(id => id !== questId);
                    player.quests.completed.push(questId);

                    const planetQuests = PLANET_QUEST_PROGRESSION[player.planet];
                    const nextQuestIndex = player.quests.completed.length;

                    if (planetQuests && nextQuestIndex < planetQuests.length) {
                        const nextQuestId = planetQuests[nextQuestIndex];
                        player.quests.active.push(nextQuestId);
                        player.quests.progress[nextQuestId] = 0;
                    }

                    if (player.quests.completed.length % 3 === 0) {
                        if (!player.stats.level) player.stats.level = 1;
                        player.stats.level += 1;
                    }

                    savePlayerData(playerData);

                    let rewardMsg = "";
                    if (quest.reward.exp) rewardMsg += `📊 EXP +${quest.reward.exp}\n`;
                    if (quest.reward.zeni) rewardMsg += `💰 Zeni +${quest.reward.zeni}\n`;
                    if (quest.reward.item) {
                        const itemName = SHOP_ITEMS[quest.reward.item.toUpperCase()]?.name || quest.reward.item;
                        rewardMsg += `🎁 ${itemName} x${quest.reward.quantity || 1}\n`;
                    }

                    let nextQuestMsg = "";
                    if (planetQuests && nextQuestIndex < planetQuests.length) {
                        const nextQuestId = planetQuests[nextQuestIndex];
                        const nextQuest = QUESTS[nextQuestId];
                        nextQuestMsg = "\n🆕 Nhiệm vụ mới đã được mở khóa!\n";
                        nextQuestMsg += `📝 ${nextQuest.name}: ${nextQuest.description}\n`;
                    } else {
                        nextQuestMsg = "\n🏆 Chúc mừng! Bạn đã hoàn thành tất cả nhiệm vụ!";
                    }

                    return api.sendMessage(
                        "🎉 HOÀN THÀNH NHIỆM VỤ!\n" +
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
                let completedCount = player.quests.completed.length;
                let planetQuests = PLANET_QUEST_PROGRESSION[player.planet] || [];

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
                    msg += "🔵 NHIỆM VỤ HIỆN TẠI:\n";
                    activeQuests.forEach((quest, index) => {
                        msg += `${index + 1}. ${quest.name}\n`;
                        msg += `📝 ${quest.description}\n`;
                        msg += `⏳ Tiến độ: ${quest.progress}/${quest.target}\n`;
                        msg += `🎁 Phần thưởng: ${quest.reward.description}\n\n`;
                    });
                } else if (completedCount >= planetQuests.length) {
                    msg += "✅ CHÚC MỪNG! BẠN ĐÃ HOÀN THÀNH TẤT CẢ NHIỆM VỤ!\n\n";
                } else {
                    msg += "❓ KHÔNG CÓ NHIỆM VỤ NÀO ĐANG HOẠT ĐỘNG!\n\n";
                }

                if (planetQuests && completedCount < planetQuests.length && activeQuests.length === 0) {
                    const nextQuestId = planetQuests[completedCount];
                    const nextQuest = QUESTS[nextQuestId];

                    if (nextQuest) {
                        msg += "🟢 NHIỆM VỤ TIẾP THEO:\n";
                        msg += `${nextQuest.name}\n`;
                        msg += `📝 ${nextQuest.description}\n`;
                        msg += `🎁 Phần thưởng: ${nextQuest.reward.description}\n\n`;

                        player.quests.active.push(nextQuestId);
                        player.quests.progress[nextQuestId] = 0;
                        savePlayerData(playerData);
                    }
                }

                const totalQuests = planetQuests ? planetQuests.length : 0;
                msg += `📊 Tiến độ: ${completedCount}/${totalQuests} nhiệm vụ\n\n`;
                msg += "💡 Cách dùng: .dball quest hoàn - Hoàn thành nhiệm vụ hiện tại";

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
                    let msg = "👨‍🏫 CÁC SƯ PHỤ CÓ THỂ HỌC:\n───────────────\n\n";
                    let skillIndex = 1;
                    let allSkills = [];

                    planetMasters.forEach(masterId => {
                        const master = MASTERS[masterId];
                        msg += `${master.name} (${master.race})\n`;
                        msg += `📝 ${master.description}\n\n`;
                        msg += "Các kỹ năng:\n";

                        Object.entries(master.skills).forEach(([skillId, skill]) => {
                            const canLearn = player.stats.power >= skill.powerRequired;
                            // Tính toán sát thương dự kiến dựa theo powerScale
                            const estimatedDamage = skill.powerScale > 0 ? Math.floor(player.stats.damage * skill.powerScale) : 0;
                            // Tính toán chi phí ki dự kiến
                            const estimatedKi = Math.abs(Math.floor(player.stats.ki * skill.kiCost));

                            msg += `${skillIndex}. ${skill.name} (${estimatedDamage > 0 ? `${estimatedDamage} DMG` : 'Hỗ trợ'}${skill.kiCost < 0 ? ', Hồi Ki' : `, ${estimatedKi} Ki`})\n`;
                            msg += `   ${canLearn ? "✅" : "❌"} Yêu cầu sức mạnh: ${skill.powerRequired.toLocaleString()}\n`;

                            allSkills.push({
                                masterId,
                                skillId,
                                ...skill
                            });

                            skillIndex++;
                        });
                        msg += "\n";
                    });

                    msg += "💡 Cách học: .dball learn <số thứ tự kỹ năng>";
                    return api.sendMessage(msg, threadID, messageID);
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
                        "❌ Sức mạnh không đủ để học kỹ năng này!\n" +
                        `💪 Sức mạnh hiện tại: ${player.stats.power.toLocaleString()}\n` +
                        `⚡ Yêu cầu: ${chosenSkill.powerRequired.toLocaleString()}\n\n` +
                        "💡 Hãy tiếp tục luyện tập để tăng sức mạnh!",
                        threadID, messageID
                    );
                }

                player.skills.push(skillId);
                savePlayerData(playerData);

                // Tính toán chỉ số thực tế để hiển thị
                const estimatedDamage = chosenSkill.powerScale > 0 ?
                    Math.floor(player.stats.damage * chosenSkill.powerScale) : 0;
                const kiText = chosenSkill.kiCost < 0 ?
                    `Hồi ${Math.abs(Math.floor(player.stats.ki * chosenSkill.kiCost))} Ki` :
                    `Tốn ${Math.floor(player.stats.ki * chosenSkill.kiCost)} Ki`;

                return api.sendMessage(
                    "🎉 HỌC KỸ NĂNG THÀNH CÔNG!\n" +
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

                // Display equipped items
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

                // Display consumable items
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

                // Display equipment not equipped
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

                // Display special items
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

                // Display Dragon Balls
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

                        // Check if player has all 7 Dragon Balls for this planet
                        if (stars.length === 7) {
                            inventoryMsg += `\n🐉 Bạn đã thu thập đủ 7 viên Ngọc Rồng ${PLANETS[planet].name}!\n`;
                            inventoryMsg += "💡 Dùng .dball wish để thực hiện điều ước\n\n";
                        }
                    });
                }

                // If inventory is empty
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

                if (target[1]?.toLowerCase() === "monster" || target[1]?.toLowerCase() === "quai") {
                    const now = Date.now();
                    const fightCooldown = 30000;
                    if (player.lastMonsterFight && now - player.lastMonsterFight < fightCooldown) {
                        const timeLeft = Math.ceil((fightCooldown - (now - player.lastMonsterFight)) / 1000);
                        return api.sendMessage(
                            `⏳ Vui lòng đợi ${timeLeft}s để phục hồi sức!`,
                            threadID, messageID
                        );
                    }

                    const planetMonsters = Object.entries(MONSTERS)
                        .filter(([id, monster]) => monster.planet === player.planet)
                        .map(([id, monster]) => ({ id, ...monster }));

                    if (planetMonsters.length === 0) {
                        return api.sendMessage(
                            `❌ Không có quái vật nào ở ${PLANETS[player.planet].name}!`,
                            threadID, messageID
                        );
                    }

                    const randomMonster = planetMonsters[Math.floor(Math.random() * planetMonsters.length)];
                    const monsterType = randomMonster.id;
                    const monster = randomMonster;

                    // Khởi tạo thông số chiến đấu ban đầu
                    let playerHP = player.stats.health;
                    let playerKi = player.stats.ki;
                    let playerDamage = player.stats.damage; // Định nghĩa playerDamage dựa trên stats.damage
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

                    // Khởi tạo trạng thái hiệu ứng
                    let playerStates = {
                        stunned: 0,           // Số lượt bị choáng
                        shielded: 0,          // Số lượt được bảo vệ bởi khiên
                        bound: 0,             // Số lượt bị trói
                        powerBoosted: 0,      // Số lượt được tăng sức mạnh (Kaioken)
                        powerBoostMultiplier: 1.0  // Hệ số tăng sức mạnh
                    };

                    let monsterStates = {
                        stunned: 0,           // Số lượt bị choáng
                        bound: 0              // Số lượt bị trói
                    };

                    battleLog.push(`⚔️ ${player.name} đang đánh với ${monster.name}!`);

                    // Đảm bảo player có skill, nếu không có thì sẽ chỉ đánh thường
                    if (!player.skills) player.skills = [];

                    let turn = 0;
                    const MAX_TURNS = 20; // Tối đa 20 lượt để tránh trận đấu quá dài

                    while (playerHP > 0 && monsterHP > 0 && turn < MAX_TURNS) {
                        turn++;

                        // Lượt của người chơi
                        if (!playerStates.stunned && !playerStates.bound) {
                            // 70% cơ hội dùng skill nếu có
                            if (player.skills.length > 0 && Math.random() < 0.7) {
                                const skillChoice = player.skills[Math.floor(Math.random() * player.skills.length)];
                                const [master, skillName] = skillChoice.split(":");
                                const skillData = MASTERS[master].skills[skillName];

                                // Tính toán sát thương và chi phí ki
                                const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                                const kiRequired = Math.floor(playerKi * skillData.kiCost);
                                if (playerKi >= kiRequired || skillData.kiCost < 0) {
                                    // Xử lý các loại skill khác nhau
                                    if (skillData.powerScale > 0) {
                                        // Skill gây sát thương
                                        monsterHP -= playerStates.powerBoosted > 0 ?
                                            skillDamage * playerStates.powerBoostMultiplier : skillDamage;

                                        if (skillData.kiCost > 0) playerKi -= kiRequired;

                                        const actualDamage = playerStates.powerBoosted > 0 ?
                                            Math.floor(skillDamage * playerStates.powerBoostMultiplier) : skillDamage;

                                        battleLog.push(
                                            `🎯 ${player.name} dùng ${skillData.name} gây ${actualDamage.toLocaleString()} sát thương!` +
                                            (skillData.kiCost > 0 ? `\n✨ -${kiRequired} Ki` : "")
                                        );

                                        // Xử lý các skill đặc biệt theo tên
                                        if (skillName === "SELF_DESTRUCT") {
                                            playerHP = 1; // Gần chết nhưng không chết hẳn
                                            battleLog.push(`💥 ${player.name} đã tự phát nổ! Mất gần hết HP!`);
                                        }
                                    } else {
                                        // Xử lý các skill phi sát thương
                                        switch (skillName) {
                                            case "SOLAR_FLARE":
                                                monsterStates.stunned = 2; // Choáng 2 lượt
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                battleLog.push(`☀️ ${player.name} dùng Thái Dương Hạ San! ${monster.name} bị choáng trong 2 lượt!`);
                                                break;

                                            case "HYPNOSIS":
                                                monsterStates.stunned = 3; // Choáng 3 lượt
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                battleLog.push(`🌀 ${player.name} dùng Thôi Miên! ${monster.name} bị choáng trong 3 lượt!`);
                                                break;

                                            case "KAIOKEN":
                                                playerStates.powerBoosted = 3; // Tăng sức mạnh trong 3 lượt
                                                playerStates.powerBoostMultiplier = 3.0;
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                battleLog.push(`🔥 ${player.name} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                                break;

                                            case "BIND":
                                                monsterStates.bound = 2; // Trói 2 lượt
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                battleLog.push(`🔗 ${player.name} dùng Trói! ${monster.name} bị trói trong 2 lượt!`);
                                                break;

                                            case "ENERGY_SHIELD":
                                                playerStates.shielded = 4; // Khiên bảo vệ trong 4 lượt
                                                if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                battleLog.push(`🛡️ ${player.name} dùng Khiên Năng Lượng! Được bảo vệ trong 4 lượt!`);
                                                break;

                                            case "REGENERATION":
                                            case "WHISTLE":
                                                // Hồi HP và/hoặc Ki
                                                const oldHP = playerHP;
                                                playerHP = Math.min(player.stats.health, playerHP + Math.floor(player.stats.health * 0.3));

                                                // Xử lý hồi ki nếu là skill có kiCost âm
                                                if (skillData.kiCost < 0) {
                                                    const kiRestore = Math.abs(kiRequired);
                                                    playerKi = Math.min(player.stats.ki, playerKi + kiRestore);
                                                    battleLog.push(`✨ ${player.name} hồi ${kiRestore} Ki!`);

                                                    battleLog.push(
                                                        `💚 ${player.name} dùng ${skillData.name}!` +
                                                        `\n❤️ HP: ${oldHP} → ${playerHP}` +
                                                        `\n✨ Ki: ${oldKi} → ${player.stats.ki}`
                                                    );
                                                } else {
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`💚 ${player.name} dùng ${skillData.name}! HP: ${oldHP} → ${playerHP}`);
                                                }
                                                break;

                                            default:
                                                if (skillData.kiCost < 0) {
                                                    // Hồi ki
                                                    const kiRestore = Math.abs(kiRequired);
                                                    const oldKi = player.stats.ki;
                                                    player.stats.ki = Math.min(player.stats.ki + kiRestore, player.stats.health); // Giả sử ki tối đa = health
                                                    battleLog.push(`✨ ${player.name} dùng ${skillData.name}! Ki: ${oldKi} → ${player.stats.ki}`);
                                                } else {
                                                    // Skill khác chưa xác định
                                                    if (skillData.kiCost > 0) playerKi -= kiRequired;
                                                    battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                                }
                                        }
                                    }
                                } else {
                                    // Không đủ ki, đánh thường
                                    const normalDamage = Math.floor(playerDamage * 0.8); // Giảm 20% sát thương khi đánh thường
                                    monsterHP -= normalDamage;
                                    battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                                }
                            } else {
                                // Đánh thường nếu không dùng skill
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

                        // Lượt của quái vật
                        if (!monsterStates.stunned && !monsterStates.bound) {
                            const monsterAttack = Math.floor(monsterDamage * (0.8 + Math.random() * 0.4));

                            // Nếu có khiên, không nhận sát thương
                            if (playerStates.shielded > 0) {
                                battleLog.push(`🛡️ Khiên năng lượng của ${player.name} đã chặn ${monsterAttack.toLocaleString()} sát thương!`);
                                playerStates.shielded--;

                                // Thông báo khi khiên sắp hết
                                if (playerStates.shielded === 1) {
                                    battleLog.push(`⚠️ Khiên năng lượng sẽ biến mất sau lượt tiếp theo!`);
                                }
                            } else {
                                // Nhận sát thương bình thường
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

                        // Cập nhật các trạng thái
                        if (playerStates.powerBoosted > 0) {
                            playerStates.powerBoosted--;
                            if (playerStates.powerBoosted === 0) {
                                battleLog.push(`⚠️ Hiệu ứng Kaioken của ${player.name} đã hết!`);
                            }
                        }
                    }

                    player.lastMonsterFight = now;

                    if (playerHP > 0) {

                        const kiLost = originalPlayerKi - playerKi;
                        const kiRestore = Math.floor(kiLost * 0.7);
                        player.stats.ki = Math.min(originalPlayerKi, playerKi + kiRestore);

                        player.stats.ki = playerKi;
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

                        updateQuestProgress(player, QUEST_TYPES.COMBAT, { monster: monsterType });
                        savePlayerData(playerData);

                        return api.sendMessage(
                            "🏆 CHIẾN THẮNG! 🏆\n" +
                            "───────────────\n" +
                            `🌍 Hành tinh: ${PLANETS[player.planet].name}\n` +
                            battleLog.slice(-5).join("\n") + "\n\n" +
                            "💡 Kết quả:\n" +
                            `📊 EXP +${expGain.toLocaleString()}\n` +
                            `💰 Zeni +${zeniGain.toLocaleString()}` +
                            dropMessage + "\n\n" +
                            "💡 Gõ .dball fight monster để đánh tiếp",
                            threadID, messageID
                        );
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
                            "• .dball fight monster list - Danh sách quái vật\n" +
                            "• .dball fight monster <tên_quái> - Đánh quái cụ thể",
                            threadID, messageID
                        );
                    }

                    const opponent = playerData[mention];
                    if (!opponent) {
                        return api.sendMessage("❌ Đối thủ chưa tạo nhân vật!", threadID, messageID);
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

                    // Player states for PvP
                    let playerPowerBoosted = 0;
                    let playerPowerBoostMultiplier = 1.0;
                    let oppPowerBoosted = 0;
                    let oppPowerBoostMultiplier = 1.0;

                    while (playerHP > 0 && oppHP > 0) {
                        // Player's turn
                        if (player.skills.length > 0) {
                            const skill = player.skills[Math.floor(Math.random() * player.skills.length)];
                            const [master, skillName] = skill.split(":");
                            const skillData = MASTERS[master].skills[skillName];

                            const skillDamage = Math.floor(playerDamage * skillData.powerScale);
                            const kiRequired = Math.floor(playerKi * Math.abs(skillData.kiCost));

                            if (playerKi >= kiRequired || skillData.kiCost < 0) {
                                if (skillData.powerScale > 0) {
                                    // Fix: use oppHP instead of monsterHP
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
                                    // Skill hồi phục
                                    const kiRestore = kiRequired;
                                    playerKi = Math.min(player.stats.ki, playerKi + kiRestore);
                                    battleLog.push(`✨ ${player.name} dùng ${skillData.name}, hồi phục ${kiRestore} Ki!`);
                                } else {
                                    // Các kỹ năng đặc biệt khác (dựa theo tên)
                                    if (skillName === "KAIOKEN") {
                                        playerPowerBoosted = 3;
                                        playerPowerBoostMultiplier = 3.0;
                                        if (skillData.kiCost > 0) playerKi -= kiRequired;
                                        battleLog.push(`🔥 ${player.name} dùng Kaioken! Sức mạnh tăng x3 trong 3 lượt!`);
                                    } else {
                                        if (skillData.kiCost > 0) playerKi -= kiRequired;
                                        battleLog.push(`⚡ ${player.name} dùng ${skillData.name}!`);
                                    }
                                }
                            } else {
                                // Không đủ ki, đánh thường
                                const normalDamage = Math.floor(playerDamage * 0.8);
                                oppHP -= normalDamage;
                                battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                            }
                        } else {
                            // Đánh thường nếu không có kỹ năng
                            const normalDamage = Math.floor(playerDamage * 0.8);
                            oppHP -= normalDamage;
                            battleLog.push(`👊 ${player.name} đấm thường gây ${normalDamage.toLocaleString()} sát thương!`);
                        }

                        if (oppHP <= 0) break;

                        // Opponent's turn
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

                    winner.stats.exp += 20;
                    savePlayerData(playerData);

                    return api.sendMessage(
                        "⚔️ KẾT QUẢ TRẬN ĐẤU ⚔️\n" +
                        "───────────────\n" +
                        battleLog.slice(-5).join("\n") + "\n\n" +
                        `🏆 Người thắng: ${winner.name}\n` +
                        `💔 Người thua: ${loser.name}\n\n` +
                        `📊 EXP thưởng: +20\n` +
                        `✨ Ki đã được hồi phục một phần!`,
                        threadID, messageID
                    );
                }
            }

            case "rank": {
                const players = Object.entries(playerData)
                    .map(([id, data]) => ({
                        id,
                        name: data.name,
                        power: data.stats.power
                    }))
                    .sort((a, b) => b.power - a.power)
                    .slice(0, 10);

                let ranking = "🏆 BẢNG XẾP HẠNG 🏆\n───────────────\n";
                players.forEach((player, index) => {
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖️";
                    ranking += `${medal} ${index + 1}. ${player.name}\n`;
                    ranking += `💪 Sức mạnh: ${player.power}\n\n`;
                });

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
    }
};

function loadPlayerData() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE));
    } catch (err) {
        return {};
    }
}

function savePlayerData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
