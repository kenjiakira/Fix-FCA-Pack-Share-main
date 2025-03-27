const HUNT_LOCATIONS = {
    garden: {
        name: "Vườn nhà",
        level: { min: 1, max: 10 },
        types: ["normal", "bug", "grass"],
        cost: 0,
        cooldown: 60000, // 1 phút
        rarityBoost: 1
    },
    forest: {
        name: "Rừng",
        level: { min: 10, max: 25 },
        types: ["grass", "bug", "flying", "poison"],
        cost: 50,
        cooldown: 180000, // 3 phút
        rarityBoost: 1.2
    },
    mountain: {
        name: "Núi",
        level: { min: 20, max: 35 }, 
        types: ["rock", "ground", "fighting"],
        cost: 100,
        cooldown: 300000, // 5 phút
        rarityBoost: 1.5
    },
    cave: {
        name: "Hang động",
        level: { min: 30, max: 45 },
        types: ["dark", "ghost", "rock"],
        cost: 200,
        cooldown: 600000, // 10 phút
        rarityBoost: 1.8
    },
    ocean: {
        name: "Đại dương", 
        level: { min: 40, max: 60 },
        types: ["water", "ice"],
        cost: 500,
        cooldown: 1200000, // 20 phút
        rarityBoost: 2
    }
};

// Move WEATHER_EFFECTS outside the class
const WEATHER_EFFECTS = {
    sunny: { types: ["fire", "grass"], boost: 1.3 },
    rainy: { types: ["water", "electric"], boost: 1.3 },
    stormy: { types: ["electric", "flying"], boost: 1.5 },  
    foggy: { types: ["ghost", "psychic"], boost: 1.4 },
    snowy: { types: ["ice", "steel"], boost: 1.3 }
};

class CatchSystem {
    constructor() {
        this.huntCooldowns = new Map();
        this.activeHunts = new Map(); // Track active hunts
    }

    setActiveHunt(userId, locationId, active = true) {
        const key = `${userId}_${locationId}`;
        if (active) {
            this.activeHunts.set(key, Date.now());
        } else {
            this.activeHunts.delete(key);
        }
    }

    isHunting(userId, locationId) {
        const key = `${userId}_${locationId}`;
        const huntStartTime = this.activeHunts.get(key);
        
        // If no active hunt or hunt started more than 5 minutes ago, consider it expired
        if (!huntStartTime || (Date.now() - huntStartTime > 300000)) {
            this.activeHunts.delete(key);
            return false;
        }
        
        return true;
    }

    getLocation(locationId) {
        return HUNT_LOCATIONS[locationId];
    }

    getCurrentWeather() {
        const weathers = Object.keys(WEATHER_EFFECTS);
        return weathers[Math.floor(Math.random() * weathers.length)];
    }

    async checkHuntCooldown(userId, locationId) {
        const key = `${userId}_${locationId}`;
        const lastHunt = this.huntCooldowns.get(key);
        
        // If user is currently hunting, return false
        if (this.isHunting(userId, locationId)) {
            return {
                canHunt: false,
                timeLeft: 0,
                reason: "hunting"
            };
        }

        if (!lastHunt) {
            return {
                canHunt: true,
                timeLeft: 0
            };
        }

        const location = HUNT_LOCATIONS[locationId];
        const now = Date.now();
        const timeLeft = location.cooldown - (now - lastHunt);

        if (timeLeft > 0) {
            return {
                canHunt: false,
                timeLeft: timeLeft,
                reason: "cooldown"
            };
        }

        return {
            canHunt: true,
            timeLeft: 0
        };
    }

    setHuntCooldown(userId, locationId) {
        const key = `${userId}_${locationId}`;
        this.huntCooldowns.set(key, Date.now());
        this.setActiveHunt(userId, locationId, false);
    }

    calculateRarity(location, weather) {
        const baseRarity = location.rarityBoost;
        const weatherEffect = WEATHER_EFFECTS[weather];
        const weatherBoost = weatherEffect ? weatherEffect.boost : 1;
        return baseRarity * weatherBoost;
    }

    getPreferredTypes(location, weather) {
        const locationTypes = location.types;
        const weatherTypes = WEATHER_EFFECTS[weather]?.types || [];
        return [...new Set([...locationTypes, ...weatherTypes])];
    }

    getLocationInfo(locationId) {
        const location = HUNT_LOCATIONS[locationId];
        if (!location) return null;

        return {
            name: location.name,
            level: location.level,
            cost: location.cost,
            cooldown: location.cooldown,
            types: location.types
        };
    }

    getAllLocations() {
        return Object.entries(HUNT_LOCATIONS).map(([id, location]) => ({
            id,
            ...location
        }));
    }
}

module.exports = {
    system: new CatchSystem(),
    WEATHER_EFFECTS,
    HUNT_LOCATIONS
};