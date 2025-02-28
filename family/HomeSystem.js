const fs = require('fs');
const path = require('path');
const { HOMES } = require('../config/family/homeConfig');

class HomeSystem {
    constructor() {
        this.homePath = path.join(__dirname, '../database/json/family/homes.json');
        this.homes = this.loadHomes();
    }

    loadHomes() {
        try {
            if (!fs.existsSync(this.homePath)) {
                fs.writeFileSync(this.homePath, JSON.stringify({}, null, 2));
                return {};
            }
            return JSON.parse(fs.readFileSync(this.homePath, 'utf8'));
        } catch (error) {
            console.error('Error loading homes:', error);
            return {};
        }
    }

    saveHomes() {
        try {
            fs.writeFileSync(this.homePath, JSON.stringify(this.homes, null, 2));
        } catch (error) {
            console.error('Error saving homes:', error);
        }
    }

    getHome(userId) {
        return this.homes[userId] || null;
    }

    buyHome(userId, homeType) {
        if (!HOMES[homeType]) {
            throw new Error("Loại nhà không hợp lệ!");
        }

        if (this.homes[userId]) {
            throw new Error("Bạn đã có nhà rồi! Hãy bán nhà cũ trước khi mua nhà mới.");
        }

        this.homes[userId] = {
            type: homeType,
            purchaseDate: Date.now(),
            condition: 100,
            lastMaintenance: Date.now()
        };

        this.saveHomes();
        return HOMES[homeType];
    }

    sellHome(userId) {
        const home = this.getHome(userId);
        if (!home) {
            throw new Error("Bạn chưa có nhà để bán!");
        }

        const homeInfo = HOMES[home.type];
        // Calculate sell price based on condition and depreciation
        const ageInDays = (Date.now() - home.purchaseDate) / (1000 * 60 * 60 * 24);
        const depreciation = Math.min(0.3, ageInDays * 0.001); // Max 30% depreciation
        const sellPrice = Math.floor(homeInfo.price * (0.7 - depreciation) * (home.condition / 100));
        
        delete this.homes[userId];
        this.saveHomes();

        return sellPrice;
    }

    getHomeHappiness(userId) {
        const home = this.getHome(userId);
        if (!home) return 0;
        
        // Calculate happiness based on condition and maintenance
        const baseHappiness = HOMES[home.type].happiness;
        const conditionFactor = home.condition / 100;
        const daysSinceLastMaintenance = (Date.now() - home.lastMaintenance) / (1000 * 60 * 60 * 24);
        const maintenancePenalty = Math.min(0.5, daysSinceLastMaintenance * 0.01); // Max 50% penalty
        
        return baseHappiness * (conditionFactor - maintenancePenalty);
    }

    decreaseCondition(userId, amount = 0.1) {
        const home = this.getHome(userId);
        if (home) {
            home.condition = Math.max(0, home.condition - amount);
            this.saveHomes();
        }
    }

    repair(userId) {
        const home = this.getHome(userId);
        if (!home) {
            throw new Error("Bạn chưa có nhà để sửa chữa!");
        }

        // Calculate repair cost based on damage and home value
        const damagePercent = 100 - home.condition;
        const repairCost = Math.floor(HOMES[home.type].price * (damagePercent / 100) * 0.1);
        
        if (repairCost < 1000) {
            throw new Error("Nhà của bạn vẫn còn tốt, chưa cần sửa chữa!");
        }

        home.condition = 100;
        home.lastMaintenance = Date.now();
        this.saveHomes();

        return repairCost;
    }

    getHomeInfo(userId) {
        const home = this.getHome(userId);
        if (!home) return null;

        const homeType = HOMES[home.type];
        const daysSinceLastMaintenance = Math.floor((Date.now() - home.lastMaintenance) / (1000 * 60 * 60 * 24));
        
        return {
            name: homeType.name,
            condition: home.condition.toFixed(1),
            happiness: this.getHomeHappiness(userId).toFixed(1),
            capacity: homeType.capacity,
            maintenanceNeeded: daysSinceLastMaintenance > 30,
            daysSinceLastMaintenance
        };
    }

    dailyUpdate(userId) {
        const home = this.getHome(userId);
        if (home) {
            // Natural degradation
            const degradation = Math.random() * 0.5 + 0.5; // 0.5-1.0% per day
            this.decreaseCondition(userId, degradation);
            
            // Extra degradation if maintenance is overdue
            const daysSinceLastMaintenance = (Date.now() - home.lastMaintenance) / (1000 * 60 * 60 * 24);
            if (daysSinceLastMaintenance > 30) {
                this.decreaseCondition(userId, degradation);
            }
        }
    }
}

module.exports = HomeSystem;
