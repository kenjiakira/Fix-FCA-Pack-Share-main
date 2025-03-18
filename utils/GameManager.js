const GAME_CONFIG = require('../config/gameConfig');
const { getBalance, updateBalance } = require('./currencies');

class PetManager {
    constructor() {
        this.pets = new Map();
    }

    buyPet(userId, petType) {
        const pet = GAME_CONFIG.PETS.types[petType];
        if (!pet) return { success: false, message: "❌ Thú cưng không tồn tại!" };

        const balance = getBalance(userId);
        if (balance < pet.price) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${pet.price}$` };
        }

        this.pets.set(userId, {
            type: petType,
            level: 1,
            exp: 0,
            stats: {...pet.stats}
        });

        updateBalance(userId, -pet.price);
        return { success: true, message: `✅ Đã mua ${pet.name}!` };
    }

    trainPet(userId) {
        const pet = this.pets.get(userId);
        if (!pet) return { success: false, message: "❌ Bạn chưa có thú cưng!" };

        const balance = getBalance(userId);
        if (balance < GAME_CONFIG.PETS.training.cost) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${GAME_CONFIG.PETS.training.cost}$` };
        }

        pet.exp += GAME_CONFIG.PETS.training.expGain;
        if (pet.exp >= 100 && pet.level < GAME_CONFIG.PETS.training.maxLevel) {
            pet.level++;
            pet.exp = 0;
            // Tăng chỉ số
            Object.keys(pet.stats).forEach(stat => {
                pet.stats[stat] *= 1.1;
            });
            updateBalance(userId, -GAME_CONFIG.PETS.training.cost);
            return { success: true, message: `🎉 Thú cưng đã lên cấp ${pet.level}!` };
        }

        updateBalance(userId, -GAME_CONFIG.PETS.training.cost);
        return { success: true, message: `✅ Huấn luyện thành công! EXP: ${pet.exp}/100` };
    }
}

class VehicleManager {
    constructor() {
        this.vehicles = new Map();
    }

    buyVehicle(userId, vehicleType) {
        const vehicle = GAME_CONFIG.VEHICLES.types[vehicleType];
        if (!vehicle) return { success: false, message: "❌ Phương tiện không tồn tại!" };

        const balance = getBalance(userId);
        if (balance < vehicle.price) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${vehicle.price}$` };
        }

        this.vehicles.set(userId, {
            type: vehicleType,
            stats: {...vehicle.stats},
            upgrades: {}
        });

        updateBalance(userId, -vehicle.price);
        return { success: true, message: `✅ Đã mua ${vehicle.name}!` };
    }

    upgradeVehicle(userId, upgradeType, level) {
        const vehicle = this.vehicles.get(userId);
        if (!vehicle) return { success: false, message: "❌ Bạn chưa có phương tiện!" };

        const upgrade = GAME_CONFIG.VEHICLES.upgrades[upgradeType];
        if (!upgrade || !upgrade.levels[level-1]) {
            return { success: false, message: "❌ Nâng cấp không hợp lệ!" };
        }

        const cost = upgrade.levels[level-1].cost;
        const balance = getBalance(userId);
        if (balance < cost) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${cost}$` };
        }

        vehicle.upgrades[upgradeType] = level;
        vehicle.stats[upgradeType] += upgrade.levels[level-1].boost;

        updateBalance(userId, -cost);
        return { success: true, message: `✅ Nâng cấp ${upgrade.name} lên cấp ${level}!` };
    }
}

class GangManager {
    constructor() {
        this.gangs = new Map();
    }

    createGang(userId, name) {
        if (this.gangs.has(name)) {
            return { success: false, message: "❌ Tên bang hội đã tồn tại!" };
        }

        const balance = getBalance(userId);
        if (balance < GAME_CONFIG.GANG.createCost) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${GAME_CONFIG.GANG.createCost}$` };
        }

        this.gangs.set(name, {
            leader: userId,
            members: [userId],
            level: 1,
            features: {},
            storage: []
        });

        updateBalance(userId, -GAME_CONFIG.GANG.createCost);
        return { success: true, message: `✅ Đã tạo bang hội ${name}!` };
    }

    upgradeGangFeature(gangName, feature, level) {
        const gang = this.gangs.get(gangName);
        if (!gang) return { success: false, message: "❌ Bang hội không tồn tại!" };

        const featureConfig = GAME_CONFIG.GANG.features[feature];
        if (!featureConfig || !featureConfig.levels[level-1]) {
            return { success: false, message: "❌ Nâng cấp không hợp lệ!" };
        }

        const cost = featureConfig.levels[level-1].cost;
        const balance = getBalance(gang.leader);
        if (balance < cost) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${cost}$` };
        }

        gang.features[feature] = level;
        updateBalance(gang.leader, -cost);
        return { success: true, message: `✅ Nâng cấp ${featureConfig.name} lên cấp ${level}!` };
    }
}

class TournamentManager {
    constructor() {
        this.activeTournaments = new Map();
    }

    startTournament(type) {
        const tournament = GAME_CONFIG.TOURNAMENT.types[type];
        if (!tournament) return { success: false, message: "❌ Giải đấu không tồn tại!" };

        const tournamentId = Date.now();
        this.activeTournaments.set(tournamentId, {
            type,
            startTime: Date.now(),
            endTime: Date.now() + tournament.duration,
            participants: [],
            scores: new Map()
        });

        return { 
            success: true, 
            message: `🏆 Giải đấu ${tournament.name} đã bắt đầu!\n⏳ Thời gian: ${tournament.duration/3600000} giờ` 
        };
    }

    joinTournament(tournamentId, userId) {
        const tournament = this.activeTournaments.get(tournamentId);
        if (!tournament) return { success: false, message: "❌ Giải đấu không tồn tại!" };

        if (tournament.participants.includes(userId)) {
            return { success: false, message: "❌ Bạn đã tham gia giải đấu này!" };
        }

        tournament.participants.push(userId);
        tournament.scores.set(userId, 0);
        return { success: true, message: "✅ Đã tham gia giải đấu!" };
    }

    updateScore(tournamentId, userId, score) {
        const tournament = this.activeTournaments.get(tournamentId);
        if (!tournament) return { success: false, message: "❌ Giải đấu không tồn tại!" };

        const currentScore = tournament.scores.get(userId) || 0;
        tournament.scores.set(userId, currentScore + score);
        return { success: true, message: `✅ Đã cập nhật điểm số: ${currentScore + score}` };
    }
}

class BlackMarketManager {
    constructor() {
        this.items = new Map();
        this.lastRefresh = 0;
    }

    refreshMarket() {
        if (Date.now() - this.lastRefresh < GAME_CONFIG.BLACK_MARKET.refresh) {
            return { success: false, message: "❌ Chợ đen chưa làm mới!" };
        }

        this.items.clear();
        Object.entries(GAME_CONFIG.BLACK_MARKET.items).forEach(([category, items]) => {
            Object.entries(items).forEach(([id, item]) => {
                if (Math.random() < 0.3) { // 30% chance to appear
                    this.items.set(id, {
                        ...item,
                        price: Math.floor(item.price * (0.8 + Math.random() * 0.4)) // ±20% price variation
                    });
                }
            });
        });

        this.lastRefresh = Date.now();
        return { success: true, message: "✅ Đã làm mới chợ đen!" };
    }

    buyItem(userId, itemId) {
        const item = this.items.get(itemId);
        if (!item) return { success: false, message: "❌ Vật phẩm không tồn tại!" };

        const balance = getBalance(userId);
        if (balance < item.price) {
            return { success: false, message: `❌ Không đủ tiền! Cần ${item.price}$` };
        }

        updateBalance(userId, -item.price);
        this.items.delete(itemId); // Remove after purchase
        return { success: true, message: `✅ Đã mua ${item.name}!` };
    }
}

class GameManager {
    constructor() {
        this.petManager = new PetManager();
        this.vehicleManager = new VehicleManager();
        this.gangManager = new GangManager();
        this.tournamentManager = new TournamentManager();
        this.blackMarketManager = new BlackMarketManager();
    }

    // Các phương thức quản lý game tổng thể
    initialize() {
        // Khởi tạo các manager
        console.log("🎮 Khởi tạo hệ thống game...");
    }

    handleCommand(command, userId, args) {
        switch(command) {
            case "pet":
                return this.handlePetCommand(userId, args);
            case "vehicle":
                return this.handleVehicleCommand(userId, args);
            case "gang":
                return this.handleGangCommand(userId, args);
            case "tournament":
                return this.handleTournamentCommand(userId, args);
            case "market":
                return this.handleMarketCommand(userId, args);
            default:
                return { success: false, message: "❌ Lệnh không hợp lệ!" };
        }
    }

    handlePetCommand(userId, args) {
        const [action, ...params] = args;
        switch(action) {
            case "buy":
                return this.petManager.buyPet(userId, params[0]);
            case "train":
                return this.petManager.trainPet(userId);
            default:
                return { success: false, message: "❌ Hành động không hợp lệ!" };
        }
    }

    handleVehicleCommand(userId, args) {
        const [action, ...params] = args;
        switch(action) {
            case "buy":
                return this.vehicleManager.buyVehicle(userId, params[0]);
            case "upgrade":
                return this.vehicleManager.upgradeVehicle(userId, params[0], parseInt(params[1]));
            default:
                return { success: false, message: "❌ Hành động không hợp lệ!" };
        }
    }

    handleGangCommand(userId, args) {
        const [action, ...params] = args;
        switch(action) {
            case "create":
                return this.gangManager.createGang(userId, params[0]);
            case "upgrade":
                return this.gangManager.upgradeGangFeature(params[0], params[1], parseInt(params[2]));
            default:
                return { success: false, message: "❌ Hành động không hợp lệ!" };
        }
    }

    handleTournamentCommand(userId, args) {
        const [action, ...params] = args;
        switch(action) {
            case "start":
                return this.tournamentManager.startTournament(params[0]);
            case "join":
                return this.tournamentManager.joinTournament(parseInt(params[0]), userId);
            default:
                return { success: false, message: "❌ Hành động không hợp lệ!" };
        }
    }

    handleMarketCommand(userId, args) {
        const [action, ...params] = args;
        switch(action) {
            case "refresh":
                return this.blackMarketManager.refreshMarket();
            case "buy":
                return this.blackMarketManager.buyItem(userId, params[0]);
            default:
                return { success: false, message: "❌ Hành động không hợp lệ!" };
        }
    }
}

module.exports = GameManager; 