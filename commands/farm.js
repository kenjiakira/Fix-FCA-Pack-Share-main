const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const vipCheck = require('../game/vip/vipCheck');

const FARM_DATA_FILE = path.join(__dirname, './json/farm_data.json');

const CROPS = {
    carrot: {
        name: "🥕 Cà rốt",
        price: 10000,
        growTime: 5 * 60 * 1000, 
        thuAmount: { min: 3, max: 8 },
        profit: 5000
    },
    potato: {
        name: "🥔 Khoai tây",
        price: 20000,
        growTime: 10 * 60 * 1000, 
        thuAmount: { min: 2, max: 6 },
        profit: 12000
    },
    corn: {
        name: "🌽 Bắp",
        price: 30000,
        growTime: 15 * 60 * 1000,
        thuAmount: { min: 2, max: 5 },
        profit: 20000
    }
};
const UPCOMING_CROPS = {
    coffee: {
        name: "☕ Cà phê",
        price: 50000,
        growTime: 30 * 60 * 1000, 
        thuAmount: { min: 2, max: 4 },
        profit: 40000,
        available: false // Chưa ra mắt
    },
    grape: {
        name: "🍇 Nho",
        price: 40000,
        growTime: 20 * 60 * 1000, 
        thuAmount: { min: 3, max: 7 },
        profit: 25000,
        available: false
    },
    strawberry: {
        name: "🍓 Dâu tây",
        price: 45000,
        growTime: 25 * 60 * 1000, 
        thuAmount: { min: 2, max: 5 },
        profit: 35000,
        available: false
    }
};
const UPCOMING_TOOLS = {
    sprinkler: {
        name: "💦 Hệ thống tưới tự động",
        price: 200000,
        bonus: 2.0,
        available: false
    },
    greenhouse: {
        name: "🏕️ Nhà kính",
        price: 300000,
        bonus: 1.8,
        available: false
    }
};

const TOOLS = {
    watercan: {
        name: "💧 Bình tưới",
        price: 50000,
        bonus: 1.2
    },
    fertilizer: {
        name: "🌱 Phân bón",
        price: 100000,
        bonus: 1.5
    }
};

function initFarmData() {
    if (!fs.existsSync(path.dirname(FARM_DATA_FILE))) {
        fs.mkdirSync(path.dirname(FARM_DATA_FILE), { recursive: true });
    }
    if (!fs.existsSync(FARM_DATA_FILE)) {
        fs.writeFileSync(FARM_DATA_FILE, JSON.stringify({}, null, 2));
    }
}

function loadFarmData() {
    try {
        initFarmData();
        return JSON.parse(fs.readFileSync(FARM_DATA_FILE, 'utf8'));
    } catch (err) {
        console.error('Lỗi đọc dữ liệu nông trại:', err);
        return {};
    }
}

function saveFarmData(data) {
    try {
        fs.writeFileSync(FARM_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Lỗi lưu dữ liệu nông trại:', err);
    }
}

function initializeFarm(userId) {
    const farmData = loadFarmData();
    if (!farmData[userId]) {
        farmData[userId] = {
            level: 1,
            experience: 0,
            plots: 4,
            crops: {},
            inventory: {},
            tools: {},
            stats: {
                totalHarvested: 0,
                totalProfit: 0
            }
        };
        saveFarmData(farmData);
    }
    return farmData[userId];
}

function applyVipBonuses(userFarm, senderID, cropData) {
    const vipBenefits = vipCheck.getVIPBenefits(senderID);
    const modifiedCrop = { ...cropData };

    if (vipBenefits.packageId > 0) {
        const reductionFactors = {
            1: 0.9,
            2: 0.8,
            3: 0.7
        };
        modifiedCrop.growTime *= reductionFactors[vipBenefits.packageId] || 1;
    }

    if (vipBenefits.packageId > 0) {
        const bonusFactors = {
            1: 1.1,
            2: 1.2,
            3: 1.3
        };
        const factor = bonusFactors[vipBenefits.packageId] || 1;
        modifiedCrop.thuAmount = {
            min: Math.floor(cropData.thuAmount.min * factor),
            max: Math.floor(cropData.thuAmount.max * factor)
        };
    }

    if (vipBenefits.packageId > 0) {
        const profitBonuses = {
            1: 1.1,
            2: 1.2,
            3: 1.3
        };
        modifiedCrop.profit = Math.floor(cropData.profit * (profitBonuses[vipBenefits.packageId] || 1));
    }

    return modifiedCrop;
}
function formatBonusPercentage(bonus) {
    return Math.round((bonus - 1) * 100);
}

module.exports = {
    name: "farm",
    info: "Hệ thống nông trại",
    category: "Games",
    dev: "HNT",
    usages: ".farm [trồng/thu/shop/info]",
    onPrefix: true,
    cooldowns: 5,
    usedby: 0,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const action = target[0]?.toLowerCase();
        const farmData = loadFarmData();
        const userFarm = initializeFarm(senderID);
        const vipBenefits = vipCheck.getVIPBenefits(senderID);

        try {
            switch (action) {
                case "trồng": {
                    // Kiểm tra các cây muốn trồng
                    const cropArgs = target.slice(1).join(' ').split(/[.,]/); // Hỗ trợ phân tách bằng dấu chấm hoặc dấu phẩy
                    const cropTypes = cropArgs
                        .map(arg => arg.trim().toLowerCase())
                        .filter(arg => arg && CROPS[arg]); // Lọc các loại cây hợp lệ
                
                    if (cropTypes.length === 0) {
                        return api.sendMessage(
                            "❌ Vui lòng chọn loại cây trồng hợp lệ!\n" +
                            Object.entries(CROPS).map(([id, crop]) =>
                                `${crop.name} - ${crop.price}$ (.farm trồng ${id})`
                            ).join('\n'),
                            threadID, messageID
                        );
                    }
                
                    // Kiểm tra số ô đất trống
                    const availablePlots = userFarm.plots - Object.keys(userFarm.crops).length;
                    if (availablePlots <= 0) {
                        return api.sendMessage(
                            "❌ Không còn ô đất trống để trồng cây!",
                            threadID, messageID
                        );
                    }
                
                    // Giới hạn số lượng cây trồng theo số ô trống
                    const cropsToPlant = cropTypes.slice(0, availablePlots);
                    
                    if (cropsToPlant.length < cropTypes.length) {
                        api.sendMessage(
                            `⚠️ Chỉ có ${availablePlots} ô đất trống, sẽ trồng ${cropsToPlant.length}/${cropTypes.length} cây!`,
                            threadID
                        );
                    }
                
                    // Tính tổng chi phí
                    let totalCost = 0;
                    const cropDetails = [];
                
                    for (const cropType of cropsToPlant) {
                        const modifiedCrop = applyVipBonuses(userFarm, senderID, CROPS[cropType]);
                        totalCost += modifiedCrop.price;
                        cropDetails.push({
                            type: cropType,
                            cost: modifiedCrop.price,
                            growTime: modifiedCrop.growTime,
                            modifiedCrop
                        });
                    }
                
                    // Kiểm tra tiền
                    const balance = await getBalance(senderID);
                    if (balance < totalCost) {
                        return api.sendMessage(
                            `❌ Không đủ tiền! Cần ${totalCost}$ để trồng ${cropsToPlant.length} cây.`,
                            threadID, messageID
                        );
                    }
                
                    await updateBalance(senderID, -totalCost);
                    
                    let plantedMessage = "✅ ĐÃ TRỒNG CÂY THÀNH CÔNG\n";
                    plantedMessage += "━━━━━━━━━━━━━━━━━━\n\n";
                
                    for (const cropDetail of cropDetails) {
                        const plotId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                        
                        userFarm.crops[plotId] = {
                            type: cropDetail.type,
                            plantedAt: Date.now(),
                            thuAt: Date.now() + cropDetail.growTime,
                            vipBonus: vipBenefits.packageId > 0
                        };
                
                        const harvestTime = new Date(Date.now() + cropDetail.growTime);
                        const harvestTimeStr = `${harvestTime.getHours()}:${harvestTime.getMinutes().toString().padStart(2, '0')}`;
                        
                        plantedMessage += `${CROPS[cropDetail.type].name}\n`;
                        plantedMessage += `┣ ⏳ Thu hoạch sau: ${Math.floor(cropDetail.growTime / 60000)} phút\n`;
                        plantedMessage += `┣ 🕐 Hoàn thành lúc: ${harvestTimeStr}\n`;
                        plantedMessage += `┗ 📌 ID: ${plotId.slice(-5)}\n\n`;
                    }
                
                    if (vipBenefits.packageId > 0) {
                        plantedMessage += `🌟 Đang áp dụng ưu đãi ${vipBenefits.name}\n`;
                    }
                    
                    plantedMessage += `📝 Nhập .farm thu khi cây trưởng thành`;
                    
                    saveFarmData(farmData);
                    return api.sendMessage(plantedMessage, threadID, messageID);
                }
                

                case "thu": {
                    const now = Date.now();
                    const readyCrops = Object.entries(userFarm.crops).filter(
                        ([_, crop]) => now >= crop.thuAt
                    );
                
                    if (readyCrops.length === 0) {
                        return api.sendMessage(
                            "❌ Chưa có cây nào sẵn sàng để thu hoạch!",
                            threadID, messageID
                        );
                    }
                
                    let totalProfit = 0;
                    let thuReport = [];
                
                    for (const [plotId, crop] of readyCrops) {
             
                        if (!CROPS[crop.type]) {
                            console.error(`Invalid crop type: ${crop.type}`);
                            delete userFarm.crops[plotId];
                            continue;
                        }
                        
                        const modifiedCrop = applyVipBonuses(userFarm, senderID, CROPS[crop.type]);
                        let amount = Math.floor(
                            Math.random() * (modifiedCrop.thuAmount.max - modifiedCrop.thuAmount.min + 1) +
                            modifiedCrop.thuAmount.min
                        );
                        
                        if (crop.toolsUsed && crop.toolsUsed.includes('fertilizer')) {
                            amount = Math.floor(amount * 1.5);
                        }
                
                        const profit = amount * modifiedCrop.profit;
                        totalProfit += profit;
                
                        if (!userFarm.inventory[crop.type]) {
                            userFarm.inventory[crop.type] = 0;
                        }
                        userFarm.inventory[crop.type] += amount;
                
                        thuReport.push(`${modifiedCrop.name}: x${amount} (${profit.toLocaleString()}$)`);
                        delete userFarm.crops[plotId];
                
                        userFarm.stats.totalHarvested += amount;
                        userFarm.stats.totalProfit += profit;
                        userFarm.experience += amount;
                    }

                    const expNeeded = userFarm.level * 100;
                    if (userFarm.experience >= expNeeded) {
                        userFarm.level++;
                        userFarm.experience -= expNeeded;
                        userFarm.plots += 2;
                        api.sendMessage(
                            `🎉 Nông trại đạt cấp ${userFarm.level}!\n` +
                            `🌱 Mở khóa thêm 2 ô đất mới!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, totalProfit);
                    saveFarmData(farmData);

                    return api.sendMessage(
                        "🌾 THU HOẠCH THÀNH CÔNG 🌾\n" +
                        "━━━━━━━━━━━━━━━━━━\n" +
                        thuReport.join('\n') + '\n\n' +
                        `💰 Tổng thu: ${totalProfit}$\n` +
                        `📊 EXP: +${readyCrops.length}`,
                        threadID, messageID
                    );
                }


                case "info": {
                    const plots = Object.entries(userFarm.crops);
                    const now = Date.now();
                
                    let farmInfo = "🌾 NÔNG TRẠI CỦA BẠN 🌾\n";
                    farmInfo += "━━━━━━━━━━━━━\n\n";
                    
                    farmInfo += `📊 THÔNG TIN CƠ BẢN\n`;
                    farmInfo += `💫 Cấp độ: ${userFarm.level}\n`;
                    farmInfo += `⭐ EXP: ${userFarm.experience}/${userFarm.level * 100}\n`;
                    farmInfo += `🏡 Đất: ${userFarm.plots - plots.length} trống / ${userFarm.plots} tổng\n\n`;
                
                    if (plots.length > 0) {
                        farmInfo += "🌱 CÂY ĐANG TRỒNG:\n";
                        plots.forEach(([plotId, crop]) => {
                            // Fix: Kiểm tra cả hai thuộc tính để tương thích với cả dữ liệu cũ
                            const plantTime = crop.plantedAt || crop.trồngedAt || Date.now();
                            const timeLeft = crop.thuAt - now;
                            const cropInfo = CROPS[crop.type];
                            
                            if (!cropInfo) {
                                console.error(`Crop type not found: ${crop.type}`);
                                return;
                            }
                            
                            const cropEmoji = cropInfo.name.split(' ')[0];
                            farmInfo += `${cropEmoji} ${cropInfo.name.split(' ')[1]}\n`;
                            farmInfo += `┣━ ID: ${plotId.slice(-5)}\n`;
                            farmInfo += `┗━ ${timeLeft <= 0 ? '✅ Sẵn sàng thu!' : `⏳ Còn ${Math.ceil(timeLeft / 60000)} phút`}\n`;
                        });
                        farmInfo += "\n";
                    }
                
                    farmInfo += "📈 THÀNH TÍCH:\n";
                    farmInfo += `🌾 Đã thu: ${userFarm.stats.totalHarvested} cây\n`;
                    farmInfo += `💰 Thu nhập: ${userFarm.stats.totalProfit.toLocaleString()}$\n\n`;
                
                    farmInfo += "⌨️ LỆNH NHANH:\n";
                    farmInfo += "┏━━━━━━━━━━━━━┓\n";
                    farmInfo += "┣ .farm trồng → Trồng cây\n";
                    farmInfo += "┣ .farm thu → Thu hoạch\n";
                    farmInfo += "┣ .farm shop → Cửa hàng\n";
                    farmInfo += "┗━━━━━━━━━━━━━┛";
                
                    return api.sendMessage(farmInfo, threadID, messageID);
                }

                case "shop": {
                    const subAction = target[1]?.toLowerCase();
                
                    if (subAction === "tools") {
                        let toolsMessage = "🛠️ CỬA HÀNG DỤNG CỤ 🛠️\n";
                        toolsMessage += "━━━━━━━━━━━━━━━━━━\n\n";
                
                        toolsMessage += "📦 ĐANG BÁN:\n";
                        Object.entries(TOOLS).forEach(([id, tool]) => {
                            toolsMessage += `${tool.name}\n`;
                            toolsMessage += `┣ 💰 Giá: ${tool.price.toLocaleString()}$\n`;
                            toolsMessage += `┣ ✨ Hiệu quả +${formatBonusPercentage(tool.bonus)}%\n`;
                            toolsMessage += `┗ 📝 .farm mua ${id}\n\n`;
                        });
            
                        toolsMessage += "\n🔜 SẮP RA MẮT:\n";
                        Object.entries(UPCOMING_TOOLS).forEach(([_, tool]) => {
                            toolsMessage += `${tool.name}\n`;
                            toolsMessage += `┣ ✨ Hiệu quả +${formatBonusPercentage(tool.bonus)}%\n`;
                            toolsMessage += `┗ ⏳ Đang phát triển...\n\n`;
                        });
                
                        return api.sendMessage(toolsMessage, threadID, messageID);
                    }
                
                    let shopMessage = "🏪 CỬA HÀNG HẠT GIỐNG 🏪\n";
                    shopMessage += "━━━━━━━━━━━━━━━━━━\n\n";
                
                
                    shopMessage += "📦 ĐANG BÁN:\n";
                    Object.entries(CROPS).forEach(([id, crop]) => {
                        shopMessage += `${crop.name}\n`;
                        shopMessage += `┣ 💰 Giá: ${crop.price.toLocaleString()}$\n`;
                        shopMessage += `┣ ⏳ Thời gian: ${Math.floor(crop.growTime / 60000)} phút\n`;
                        shopMessage += `┣ 📦 Thu hoạch: ${crop.thuAmount.min}-${crop.thuAmount.max}\n`;
                        shopMessage += `┣ 💵 ${crop.profit.toLocaleString()}$/cái\n`;
                        shopMessage += `┗ 📝 .farm trồng ${id}\n\n`;
                    });
                
                    shopMessage += "\n🔜 SẮP RA MẮT:\n";
                    Object.entries(UPCOMING_CROPS).forEach(([id, crop]) => {
                        shopMessage += `┣${crop.name}\n`;
                        shopMessage += `┣⏳ Thời gian: ${Math.floor(crop.growTime / 60000)} phút\n`;
                        shopMessage += `┣💰 Thu hoạch: ${crop.thuAmount.min}-${crop.thuAmount.max} (${crop.profit}$/cái)\n`;
                        shopMessage += `┗📋 Đang phát triển...\n\n`;
                    });
                
                    shopMessage += "\n🛠️ CÔNG CỤ: .farm shop tools";
                
                    return api.sendMessage(shopMessage, threadID, messageID);
                }

                case "mua": {
                    const toolType = target[1]?.toLowerCase();

                    if (!toolType || !TOOLS[toolType]) {
                        return api.sendMessage(
                            "❌ Vui lòng chọn công cụ hợp lệ!\n" +
                            Object.entries(TOOLS).map(([id, tool]) =>
                                `${tool.name} - ${tool.price}$ (.farm mua ${id})`
                            ).join('\n'),
                            threadID, messageID
                        );
                    }

                    const balance = await getBalance(senderID);
                    if (balance < TOOLS[toolType].price) {
                        return api.sendMessage(
                            `❌ Không đủ tiền! Cần ${TOOLS[toolType].price}$`,
                            threadID, messageID
                        );
                    }

                    await updateBalance(senderID, -TOOLS[toolType].price);

                    if (!userFarm.tools[toolType]) {
                        userFarm.tools[toolType] = 0;
                    }
                    userFarm.tools[toolType]++;

                    saveFarmData(farmData);

                    return api.sendMessage(
                        `✅ Đã mua ${TOOLS[toolType].name}!\n` +
                        `🛠️ Bạn hiện có: ${userFarm.tools[toolType]} cái`,
                        threadID, messageID
                    );
                }

                case "dung": {
                    const toolType = target[1]?.toLowerCase();
                    const plotId = target[2];

                    if (!toolType || !TOOLS[toolType]) {
                        return api.sendMessage(
                            "❌ Vui lòng chọn công cụ hợp lệ!\n" +
                            Object.entries(TOOLS).map(([id, tool]) =>
                                `${tool.name} (.farm dung ${id} <id_ô>)`
                            ).join('\n'),
                            threadID, messageID
                        );
                    }

                    if (!userFarm.tools[toolType] || userFarm.tools[toolType] <= 0) {
                        return api.sendMessage(
                            `❌ Bạn không có ${TOOLS[toolType].name}!`,
                            threadID, messageID
                        );
                    }

                    if (!plotId || !userFarm.crops[plotId]) {
                   
                        const plots = Object.entries(userFarm.crops);
                        if (plots.length === 0) {
                            return api.sendMessage(
                                "❌ Bạn chưa trồng cây nào!",
                                threadID, messageID
                            );
                        }

                        let plotList = "📋 Các ô đang trồng:\n";
                        plots.forEach(([id, crop]) => {
                            plotList += `ID: ${id} - ${CROPS[crop.type].name}\n`;
                        });
                        plotList += "\nSử dụng: .farm dung " + toolType + " <ID_ô>";

                        return api.sendMessage(plotList, threadID, messageID);
                    }

                    const crop = userFarm.crops[plotId];

                    if (crop.toolsUsed && crop.toolsUsed.includes(toolType)) {
                        return api.sendMessage(
                            `❌ Bạn đã sử dụng ${TOOLS[toolType].name} cho ô này rồi!`,
                            threadID, messageID
                        );
                    }

                    if (!crop.toolsUsed) crop.toolsUsed = [];
                    crop.toolsUsed.push(toolType);
                    userFarm.tools[toolType]--;

                    if (toolType === "watercan") {
                    
                        const reduction = 0.15; 
                        const timeReduction = (crop.thuAt - crop.trồngedAt) * reduction;
                        crop.thuAt -= timeReduction;
                    }
                    else if (toolType === "fertilizer") {
                        crop.fertilized = true;
                    }

                    saveFarmData(farmData);

                    return api.sendMessage(
                        `✅ Đã sử dụng ${TOOLS[toolType].name} cho ${CROPS[crop.type].name}!\n` +
                        (toolType === "watercan"
                            ? "⏳ Thời gian thu hoạch đã được rút ngắn 15%!"
                            : "💰 Sản lượng sẽ tăng 50% khi thu hoạch!"),
                        threadID, messageID
                    );
                }

                default:
                    return api.sendMessage(
                        "🌾 NÔNG TRẠI 🌾\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1. .farm trồng [tên] - Trồng cây\n" +
                        "2. .farm thu - Thu hoạch\n" +
                        "3. .farm info - Xem nông trại\n" +
                        "4. .farm shop - Mua hạt giống\n\n" +
                        "💡 Bắt đầu với .farm shop để xem các loại cây!",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Farm error:', err);
            return api.sendMessage("❌ Có lỗi xảy ra!", threadID, messageID);
        }
    }
};
