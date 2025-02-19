const fs = require('fs');
const path = require('path');
const { HOME_PRICES, HOME_UPGRADES } = require('../config/family/familyConfig');
const { getBalance, updateBalance } = require('../utils/currencies');

class HomeSystem {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/homes.json');
        this.data = this.loadData();
        this.statNames = {
            security: "An ninh",
            comfort: "Tiện nghi",
            environment: "Môi trường",
            luxury: "Sang trọng"
        };
    }

    calculateSellPrice(homeType, condition) {
        return Math.floor(HOME_PRICES[homeType].xu * (condition / 100) * 0.7);
    }

    calculateMaintenanceCost(homeType) {
        return Math.floor(HOME_PRICES[homeType].xu * 0.05);
    }

    calculateUpgradeCost(homeType, upgrade) {
        return upgrade.cost || Math.floor(HOME_PRICES[homeType].xu * 0.2);
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

    updateHomeCondition() {
        Object.keys(this.data).forEach(userID => {
            const home = this.data[userID];
            if (!home || !home.lastMaintenance) return;
            
            const timePassed = (Date.now() - home.lastMaintenance) / (1000 * 60 * 60 * 24); // Days
            if (timePassed >= 1) {
                home.condition = Math.max(0, home.condition - (timePassed * 5));
                home.lastMaintenance = Date.now();
            }
        });
        this.saveData();
    }

    getHome(userID) {
        this.updateHomeCondition(); 
        return this.data[userID] || null;
    }

    async buyHome(userID, type) {
        if (!HOME_PRICES[type]) {
            throw new Error("Loại nhà không hợp lệ!");
        }

        if (this.data[userID]) {
            throw new Error("Bạn đã có nhà rồi! Hãy bán nhà cũ trước.");
        }

        const homeConfig = HOME_PRICES[type];
        const balance = await getBalance(userID);
        if (balance < homeConfig.xu) {
            throw new Error(`Bạn cần thêm ${(homeConfig.xu - balance).toLocaleString()} Xu để mua nhà này!`);
        }

        try {
            // Deduct money first
            await updateBalance(userID, -homeConfig.xu);

            // Create new home data
            const newHome = {
                type: type,
                name: homeConfig.name,
                purchaseDate: Date.now(),
                condition: 100,
                lastMaintenance: Date.now(),
                upgrades: [],
                stats: {...(homeConfig.baseStats || {
                    security: 0,
                    comfort: 0,
                    environment: 0,
                    luxury: 0
                })}
            };

            // Add rental end date if applicable
            if (homeConfig.isRental) {
                newHome.rentEndDate = Date.now() + (homeConfig.rentPeriod * 24 * 60 * 60 * 1000);
            }

            // Save to homes.json
            this.data[userID] = newHome;
            const savedHome = this.saveData();
            
            if (!savedHome) {
                // If save fails, refund the money
                await updateBalance(userID, homeConfig.xu);
                throw new Error("Không thể lưu dữ liệu nhà. Vui lòng thử lại!");
            }

            // Update family record to match homes.json
            const familyPath = path.join(__dirname, '../database/json/family/family.json');
            try {
                let familyData = {};
                if (fs.existsSync(familyPath)) {
                    familyData = JSON.parse(fs.readFileSync(familyPath));
                }

                if (!familyData[userID]) {
                    familyData[userID] = {};
                }

                familyData[userID].home = {
                    type: type,
                    name: homeConfig.name,
                    condition: 100,
                    purchaseDate: newHome.purchaseDate,
                    lastMaintenance: newHome.lastMaintenance
                };

                fs.writeFileSync(familyPath, JSON.stringify(familyData, null, 2));
            } catch (error) {
                console.error('Error updating family data:', error);
            }

            return newHome;
        } catch (error) {
            // If any error occurs, attempt to refund
            try {
                await updateBalance(userID, homeConfig.xu);
                // Also clean up any partial data
                if (this.data[userID]) {
                    delete this.data[userID];
                    this.saveData();
                }
            } catch (refundError) {
                console.error('Error refunding after failed home purchase:', refundError);
            }
            throw error;
        }
    }

    async sellHome(userID) {
        const home = this.getHome(userID);
        if (!home) {
            throw new Error("Bạn chưa có nhà!");
        }

        if (home.condition < 20) {
            const repairCost = this.calculateMaintenanceCost(home.type);
            const currentSellPrice = this.calculateSellPrice(home.type, home.condition);
            const newSellPrice = this.calculateSellPrice(home.type, 100);
            const profit = newSellPrice - currentSellPrice - repairCost;
            const roi = Math.floor((profit / repairCost) * 100);
            throw new Error(`Nhà của bạn hư hỏng quá nặng (${Math.floor(home.condition)}%), hãy sửa chữa trước khi bán!\nChi phí sửa chữa: ${repairCost.toLocaleString()} Xu\nGiá bán: ${currentSellPrice.toLocaleString()} → ${newSellPrice.toLocaleString()} Xu\nLợi nhuận sau sửa chữa: ${profit.toLocaleString()} Xu (ROI: ${roi}%)`);
        }

        const homeConfig = HOME_PRICES[home.type];
        const sellPrice = this.calculateSellPrice(home.type, home.condition);

        await updateBalance(userID, sellPrice); 

        delete this.data[userID];
        this.saveData();

        // Update family record when selling home
        const familyPath = path.join(__dirname, '../database/json/family/family.json');
        try {
            const familyData = JSON.parse(fs.readFileSync(familyPath));
            if (familyData[userID]) {
                familyData[userID].home = null;
                fs.writeFileSync(familyPath, JSON.stringify(familyData, null, 2));
            }
        } catch (error) {
            console.error('Error updating family data:', error);
        }

        return sellPrice;
    }

    async maintainHome(userID) {
        const home = this.getHome(userID);
        if (!home) {
            throw new Error("Bạn chưa có nhà!");
        }

        if (home.condition >= 100) {
            throw new Error(`Nhà của bạn vẫn còn tốt (${Math.floor(home.condition)}%), không cần sửa chữa!`);
        }

        const maintenanceCost = this.calculateMaintenanceCost(home.type);
        const balance = await getBalance(userID);
        
        if (balance < maintenanceCost) {
            const currentSellPrice = this.calculateSellPrice(home.type, home.condition);
            const newSellPrice = this.calculateSellPrice(home.type, 100);
            const profit = newSellPrice - currentSellPrice - maintenanceCost;
            const roi = Math.floor((profit / maintenanceCost) * 100);
            throw new Error(`Bạn cần ${maintenanceCost.toLocaleString()} Xu để sửa chữa nhà!\nTình trạng hiện tại: ${Math.floor(home.condition)}% → 100%\nGiá bán: ${currentSellPrice.toLocaleString()} → ${newSellPrice.toLocaleString()} Xu\nLợi nhuận sau sửa chữa: ${profit.toLocaleString()} Xu (ROI: ${roi}%)\nSố dư: ${balance.toLocaleString()} Xu`);
        }

        await updateBalance(userID, -maintenanceCost);
        home.condition = 100;
        home.lastMaintenance = Date.now();
        this.saveData();

        return maintenanceCost;
    }

    async upgradeHome(userID, upgradeType) {
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
        const upgradeCost = this.calculateUpgradeCost(home.type, upgrade);
        const balance = await getBalance(userID);
        
        if (balance < upgradeCost) {
            const effectsList = Object.entries(upgrade.effects)
                .map(([stat, value]) => {
                    const currentValue = home.stats[stat] || 0;
                    const newValue = Math.min(100, currentValue + value);
                    return `${this.statNames[stat] || stat}: ${currentValue}% → ${newValue}%`;
                })
                .join('\n   ');
            throw new Error(`Bạn cần ${upgradeCost.toLocaleString()} Xu để nâng cấp nhà!\nChỉ số nâng cấp:\n   ${effectsList}\nSố dư: ${balance.toLocaleString()} Xu`);
        }

        await updateBalance(userID, -upgradeCost);
        home.upgrades.push(upgradeType);

        Object.entries(upgrade.effects).forEach(([stat, value]) => {
            if (home.stats[stat] !== undefined) {
                home.stats[stat] = Math.min(100, (home.stats[stat] || 0) + value);
            }
        });

        this.saveData();
        return {
            ...upgrade,
            cost: upgradeCost
        };
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
