const fs = require('fs');
const path = require('path');
const { HOME_PRICES, HOME_UPGRADES } = require('../config/familyConfig');

class HomeSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/homes.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (!fs.existsSync(this.path)) {
                fs.writeFileSync(this.path, '{}');
                return {};
            }
            return JSON.parse(fs.readFileSync(this.path));
        } catch (error) {
            console.error('Error loading home data:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving home data:', error);
            return false;
        }
    }

    getHome(userID) {
        return this.data[userID] || null;
    }

    buyHome(userID, type) {
        if (!HOME_PRICES[type]) {
            throw new Error("Loại nhà không hợp lệ!");
        }

        if (this.data[userID]) {
            throw new Error("Bạn đã có nhà rồi! Hãy bán nhà cũ trước.");
        }

        const homeConfig = HOME_PRICES[type];
        this.data[userID] = {
            type: type,
            name: homeConfig.name,
            purchaseDate: Date.now(),
            condition: 100,
            lastMaintenance: Date.now(),
            upgrades: [],
            stats: {
                security: 0,
                comfort: 0,
                environment: 0,
                luxury: 0
            }
        };

        if (homeConfig.isRental) {
            this.data[userID].rentEndDate = Date.now() + (homeConfig.rentPeriod * 24 * 60 * 60 * 1000);
        }

        this.saveData();
        return this.data[userID];
    }

    sellHome(userID) {
        const home = this.getHome(userID);
        if (!home) {
            throw new Error("Bạn chưa có nhà!");
        }

        const homeConfig = HOME_PRICES[home.type];
        const sellPrice = Math.floor(homeConfig.xu * (home.condition / 100) * 0.7);

        delete this.data[userID];
        this.saveData();

        return sellPrice;
    }

    maintainHome(userID) {
        const home = this.getHome(userID);
        if (!home) {
            throw new Error("Bạn chưa có nhà!");
        }

        const maintenanceCost = Math.floor(HOME_PRICES[home.type].xu * 0.05);
        home.condition = 100;
        home.lastMaintenance = Date.now();
        this.saveData();

        return maintenanceCost;
    }

    upgradeHome(userID, upgradeType) {
        const home = this.getHome(userID);
        if (!home) {
            throw new Error("Bạn chưa có nhà!");
        }

        if (!HOME_UPGRADES[upgradeType]) {
            throw new Error("Gói nâng cấp không hợp lệ!");
        }

        if (home.upgrades.includes(upgradeType)) {
            throw new Error("Bạn đã có gói nâng cấp này rồi!");
        }

        const upgrade = HOME_UPGRADES[upgradeType];
        home.upgrades.push(upgradeType);

        Object.entries(upgrade.effects).forEach(([stat, value]) => {
            if (home.stats[stat] !== undefined) {
                home.stats[stat] = Math.min(100, (home.stats[stat] || 0) + value);
            }
        });

        this.saveData();
        return upgrade;
    }

    getOwnerName(userID) {
        try {
            const userDataPath = path.join(__dirname, '../events/cache/userData.json');
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || userID;
        } catch (error) {
            console.error('Error reading userData:', error);
            return userID;
        }
    }

    getHomeStats(home) {
        if (!home) return null;
        return home.stats;
    }
}

module.exports = HomeSystem;
