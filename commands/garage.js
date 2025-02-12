const { getBalance, updateBalance } = require('../utils/currencies');
const { CARS, VEHICLE_TYPES, BRANDS, MAINTENANCE_COST } = require('../config/carConfig');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    name: "garage",
    dev: "HNT",
    usedby: 0,
    usages: ".garage [list/buy/sell/repair/info]",
    info: "Quản lý xe cộ của bạn",
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            if (!command) {
                return api.sendMessage(
                    "🚗 GARAGE SYSTEM 🚗\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "1. list - Xem danh sách xe\n" +
                    "2. buy [mã xe] - Mua xe\n" +
                    "3. sell [mã xe] - Bán xe\n" +
                    "4. repair [mã xe] - Sửa chữa xe\n" +
                    "5. info [mã xe] - Xem thông tin xe\n" +
                    "6. garage - Xem garage của bạn\n\n" +
                    "💡 Dùng .garage list để xem danh sách xe",
                    threadID
                );
            }

            const garage = this.loadGarage(senderID);

            switch (command) {
                case "list": {
                    let msg = "🚘 DANH SÁCH XE 🚘\n━━━━━━━━━━━━━━━━━━\n\n";
                    
                    for (const type in VEHICLE_TYPES) {
                        msg += `【${VEHICLE_TYPES[type].toUpperCase()}】\n`;
                        const vehicles = Object.entries(CARS).filter(([_, car]) => car.type === type);
                        
                        for (const [id, car] of vehicles) {
                            msg += `${BRANDS[car.brand]} ${car.name}\n`;
                            msg += `• Mã xe: [ ${id} ]\n`; 
                            msg += `• Giá: ${formatNumber(car.price)} Xu\n`;
                            msg += `• Tốc độ: ${car.speed} km/h\n`;
                            msg += `• Độ bền: ${car.durability}%\n\n`;
                        }
                    }
                    
                    msg += "💡 CÁCH MUA XE:\n";
                    msg += "• Mua 1 xe: .garage buy v1\n";
                    msg += "• Mua nhiều xe: .garage buy v1 v2 v3\n\n";
                    msg += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " Xu";
                    
                    return api.sendMessage(msg, threadID);
                }

                case "buy": {
                    const carCodes = target.slice(1); 
                    if (carCodes.length === 0) {
                        return api.sendMessage("❌ Vui lòng nhập ít nhất một mã xe hợp lệ!", threadID);
                    }
                    
                    let totalCost = 0;
                    let purchaseList = [];
                    for (let code of carCodes) {
                        code = code.toLowerCase();
                        if (!CARS[code]) {
                            return api.sendMessage(`❌ Mã xe '${code}' không hợp lệ!`, threadID);
                        }
                        const car = CARS[code];
                        totalCost += car.price;
                        purchaseList.push({ code, car });
                    }
                    
                    const balance = await getBalance(senderID);
                    if (balance < totalCost) {
                        return api.sendMessage(
                            `❌ Bạn cần thêm ${formatNumber(totalCost - balance)} Xu để mua tất cả các xe này!`,
                            threadID
                        );
                    }
                    
                    await updateBalance(senderID, -totalCost);
                    purchaseList.forEach(({ code, car }) => {
                        garage.vehicles[code] = {
                            purchaseDate: Date.now(),
                            durability: car.durability,
                            lastMaintenance: Date.now(),
                            ownerID: senderID
                        };
                    });
                    
                    this.saveGarage(senderID, garage);
                    let msg = `✅ Mua xe thành công!\n\nTổng chi phí: ${formatNumber(totalCost)} Xu\n\nDanh sách xe:\n`;
                    purchaseList.forEach(({ code, car }) => {
                        msg += `🚗 ${car.name} (Mã: ${code}) - Giá: ${formatNumber(car.price)} Xu, Độ bền: ${car.durability}%\n`;
                    });
                    msg += `\n💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`;
                    return api.sendMessage(msg, threadID);
                }

                case "repair": {
                    const carId = target[1]?.toLowerCase();
                    if (!carId || !garage.vehicles[carId]) {
                        return api.sendMessage("❌ Bạn không sở hữu xe này!", threadID);
                    }

                    const car = CARS[carId];
                    const maintenanceCost = Math.floor(car.price * MAINTENANCE_COST[car.type]);
                    const balance = await getBalance(senderID);

                    if (balance < maintenanceCost) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(maintenanceCost)} Xu để sửa xe!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, -maintenanceCost);
                    garage.vehicles[carId].durability = car.durability;
                    garage.vehicles[carId].lastMaintenance = Date.now();
                    this.saveGarage(senderID, garage);

                    return api.sendMessage(
                        `✅ Sửa xe thành công!\n\n` +
                        `🚗 Xe: ${car.name}\n` +
                        `💰 Chi phí: ${formatNumber(maintenanceCost)} Xu\n` +
                        `⚡ Độ bền mới: ${car.durability}%\n` +
                        `💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`,
                        threadID
                    );
                }

                case "sell": {
                    const carId = target[1]?.toLowerCase();
                    if (!carId || !garage.vehicles[carId]) {
                        return api.sendMessage("❌ Bạn không sở hữu xe này!", threadID);
                    }

                    const car = CARS[carId];
                    const currentDurability = garage.vehicles[carId].durability;
                    const sellPrice = Math.floor(car.price * (currentDurability / 100) * 0.7);

                    await updateBalance(senderID, sellPrice);
                    delete garage.vehicles[carId];
                    this.saveGarage(senderID, garage);

                    return api.sendMessage(
                        `✅ Bán xe thành công!\n\n` +
                        `🚗 Xe: ${car.name}\n` +
                        `💰 Giá bán: ${formatNumber(sellPrice)} Xu\n` +
                        `💵 Số dư: ${formatNumber(await getBalance(senderID))} Xu`,
                        threadID
                    );
                }

                case "info": {
                    const carId = target[1]?.toLowerCase();
                    if (!carId || !garage.vehicles[carId]) {
                        return api.sendMessage("❌ Bạn không sở hữu xe này!", threadID);
                    }

                    const car = CARS[carId];
                    const vehicle = garage.vehicles[carId];
                    const maintenanceCost = Math.floor(car.price * MAINTENANCE_COST[car.type]);
                    const daysSinceLastMaintenance = Math.floor((Date.now() - vehicle.lastMaintenance) / (1000 * 60 * 60 * 24));

                    return api.sendMessage(
                        `🚗 THÔNG TIN XE\n` +
                        `━━━━━━━━━━━━━━━━━━\n\n` +
                        `Tên: ${car.name}\n` +
                        `Hãng: ${car.brand} ${BRANDS[car.brand]}\n` +
                        `Chủ sở hữu: ${getUserName(vehicle.ownerID)}\n` +  // Add owner display
                        `Loại: ${VEHICLE_TYPES[car.type]}\n` +
                        `Tốc độ: ${car.speed} km/h\n` +
                        `Độ bền: ${vehicle.durability.toFixed(1)}%\n` +
                        `Ngày mua: ${new Date(vehicle.purchaseDate).toLocaleDateString()}\n` +
                        `Bảo dưỡng lần cuối: ${new Date(vehicle.lastMaintenance).toLocaleDateString()}\n` +
                        `(${daysSinceLastMaintenance} ngày trước)\n` +
                        `Chi phí bảo dưỡng: ${formatNumber(maintenanceCost)} Xu`,
                        threadID
                    );
                }

                default: {
                    let msg = "🏎️ GARAGE CỦA BẠN 🏎️\n━━━━━━━━━━━━━━━━━━\n\n";
                    const ownedVehicles = Object.entries(garage.vehicles);

                    if (ownedVehicles.length === 0) {
                        return api.sendMessage("❌ Bạn chưa có xe nào!", threadID);
                    }

                    for (const [carId, vehicle] of ownedVehicles) {
                        const car = CARS[carId];
                        msg += `${BRANDS[car.brand]} ${car.name}\n`;
                        msg += `• Độ bền: ${vehicle.durability.toFixed(1)}%\n`;
                        msg += `• Mua ngày: ${new Date(vehicle.purchaseDate).toLocaleDateString()}\n\n`;
                    }

                    return api.sendMessage(msg, threadID);
                }
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã có lỗi xảy ra!", threadID);
        }
    },

    loadGarage: function(userID) {
        const garagePath = path.join(__dirname, '../database/json/family/garage.json');
        try {
            if (!fs.existsSync(garagePath)) {
                fs.writeFileSync(garagePath, '{}');
            }
            const garageData = JSON.parse(fs.readFileSync(garagePath));
            return garageData[userID] || { vehicles: {} };
        } catch (error) {
            console.error(error);
            return { vehicles: {} };
        }
    },

    saveGarage: function(userID, data) {
        const garagePath = path.join(__dirname, '../database/json/family/garage.json');
        try {
            let garageData = {};
            if (fs.existsSync(garagePath)) {
                garageData = JSON.parse(fs.readFileSync(garagePath));
            }
            garageData[userID] = data;
            fs.writeFileSync(garagePath, JSON.stringify(garageData, null, 2));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getUserName: function(userID) {
        const userDataPath = path.join(__dirname, '../events/cache/userData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || userID;
        } catch (error) {
            console.error('Error reading userData:', error);
            return userID;
        }
    },

    updateDurability: function(garage) {
        const now = Date.now();
        for (const [carId, vehicle] of Object.entries(garage.vehicles)) {
            const car = CARS[carId];
            const daysPassed = (now - vehicle.lastMaintenance) / (1000 * 60 * 60 * 24);
            const decay = DURABILITY_DECAY[car.type] * daysPassed;
            vehicle.durability = Math.max(0, vehicle.durability - decay);
        }
        return garage;
    }
};
