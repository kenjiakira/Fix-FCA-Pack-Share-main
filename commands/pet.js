const { getBalance, updateBalance } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');

const PETS_FILE = path.join(__dirname, './json/pets.json');
const USERS_PETS_FILE = path.join(__dirname, './json/users_pets.json');

const RARITIES = {
    COMMON: { name: "Common", rate: 50, color: "⚪" },
    UNCOMMON: { name: "Uncommon", rate: 30, color: "🟢" },
    RARE: { name: "Rare", rate: 15, color: "🔵" },
    EPIC: { name: "Epic", rate: 4, color: "🟣" },
    LEGENDARY: { name: "Legendary", rate: 1, color: "🟡" }
};

const PETS = {
    WHISKERS: { id: "WHISKERS", name: "Whiskers", rarity: "COMMON", description: "Mèo con với bộ ria mép tinh nghịch", power: 10, collection: "Domestic" },
    FIDO: { id: "FIDO", name: "Fido", rarity: "COMMON", description: "Chó con trung thành luôn vẫy đuôi", power: 12, collection: "Domestic" },
    SQUEAKY: { id: "SQUEAKY", name: "Squeaky", rarity: "COMMON", description: "Chuột hamster nhỏ nhắn thích quay bánh xe", power: 8, collection: "Domestic" },
    QUACKERS: { id: "QUACKERS", name: "Quackers", rarity: "COMMON", description: "Vịt con ồn ào với chiếc mỏ vàng", power: 9, collection: "Farm" },
    FLUFFBALL: { id: "FLUFFBALL", name: "Fluffball", rarity: "COMMON", description: "Thỏ nhỏ với bộ lông mềm mại", power: 9, collection: "Farm" },
    BUZZ: { id: "BUZZ", name: "Buzz", rarity: "COMMON", description: "Ong mật chăm chỉ thu thập phấn hoa", power: 11, collection: "Garden" },

    FOXY: { id: "FOXY", name: "Foxy", rarity: "UNCOMMON", description: "Cáo ranh mãnh với đôi mắt tinh anh", power: 18, collection: "Forest" },
    TUSK: { id: "TUSK", name: "Tusk", rarity: "UNCOMMON", description: "Lợn rừng dũng mãnh với cặp ngà sắc nhọn", power: 20, collection: "Forest" },
    SHELLSHOCK: { id: "SHELLSHOCK", name: "Shellshock", rarity: "UNCOMMON", description: "Rùa già từng trải với chiếc mai cứng cáp", power: 15, collection: "Sea" },
    FEATHERS: { id: "FEATHERS", name: "Feathers", rarity: "UNCOMMON", description: "Vẹt đầy màu sắc có thể bắt chước giọng nói", power: 16, collection: "Sky" },
    SHADOW: { id: "SHADOW", name: "Shadow", rarity: "UNCOMMON", description: "Sói xám với đôi mắt vàng phát sáng trong đêm", power: 19, collection: "Forest" },

    THUNDERBEAK: { id: "THUNDERBEAK", name: "Thunderbeak", rarity: "RARE", description: "Đại bàng với đôi cánh tạo ra sấm sét", power: 28, collection: "Sky" },
    FANGMASTER: { id: "FANGMASTER", name: "Fangmaster", rarity: "RARE", description: "Sư tử oai vệ, chúa tể của đồng cỏ", power: 30, collection: "Wild" },
    NIGHTSTALKER: { id: "NIGHTSTALKER", name: "Nightstalker", rarity: "RARE", description: "Báo đen với khả năng ẩn mình trong bóng tối", power: 32, collection: "Wild" },
    FROSTY: { id: "FROSTY", name: "Frosty", rarity: "RARE", description: "Sói Bắc Cực với hơi thở băng giá", power: 33, collection: "Wild" },
    CORALKING: { id: "CORALKING", name: "Coralking", rarity: "RARE", description: "Cá ngựa khổng lồ bảo vệ rạn san hô", power: 27, collection: "Sea" },

    INFERNO: { id: "INFERNO", name: "Inferno", rarity: "EPIC", description: "Rồng lửa phun ra ngọn lửa nóng như mặt trời", power: 45, collection: "Mythical" },
    EMBERBLAZE: { id: "EMBERBLAZE", name: "Emberblaze", rarity: "EPIC", description: "Phượng hoàng tái sinh từ đống tro tàn", power: 42, collection: "Mythical" },
    TIDECALLER: { id: "TIDECALLER", name: "Tidecaller", rarity: "EPIC", description: "Rắn biển có khả năng điều khiển thủy triều", power: 48, collection: "Sea" },
    TERRAFORMER: { id: "TERRAFORMER", name: "Terraformer", rarity: "EPIC", description: "Rùa cổ đại mang cả một hệ sinh thái trên lưng", power: 46, collection: "Mythical" },

    STARDUST: { id: "STARDUST", name: "Stardust", rarity: "LEGENDARY", description: "Kỳ lân vũ trụ với sừng làm từ tinh vân", power: 65, collection: "Mythical" },
    ETERNUS: { id: "ETERNUS", name: "Eternus", rarity: "LEGENDARY", description: "Sinh vật cổ đại tồn tại từ thuở khai thiên lập địa", power: 75, collection: "Ancient" },
    VOID: { id: "VOID", name: "Void", rarity: "LEGENDARY", description: "Thực thể bí ẩn từ chiều không gian song song", power: 80, collection: "Ancient" }
};

const FUSION_RULES = {
    COMMON: {
        cost: 500,
        sameTypeBonus: 0.2,
        successRate: 0.6   
    },
    UNCOMMON: {
        cost: 1000,
        sameTypeBonus: 0.25,
        successRate: 0.5
    },
    RARE: {
        cost: 2000,
        sameTypeBonus: 0.3,
        successRate: 0.4
    },
    EPIC: {
        cost: 4000,
        sameTypeBonus: 0.35,
        successRate: 0.3
    },
    LEGENDARY: {
        cost: 8000,
        sameTypeBonus: 0.4,
        successRate: 0.2
    }
};

const GACHA_COST = 500;

function loadData() {
    try {
        if (!fs.existsSync(USERS_PETS_FILE)) {
            const dir = path.dirname(USERS_PETS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(USERS_PETS_FILE, JSON.stringify({}));
            return {};
        }
        const data = JSON.parse(fs.readFileSync(USERS_PETS_FILE));
        // Clean up invalid pet IDs
        for (const userId in data) {
            if (data[userId].pets) {
                const validPets = {};
                for (const petId in data[userId].pets) {
                    if (PETS[petId]) {
                        validPets[petId] = data[userId].pets[petId];
                    }
                }
                data[userId].pets = validPets;
            }
        }
        return data;
    } catch (error) {
        console.error('Error loading pets data:', error);
        return {};
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(USERS_PETS_FILE, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving pets data:', error);
    }
}

function getRandomPet() {
    const rand = Math.random() * 100;
    let sum = 0;
    let chosenRarity;

    for (const rarity of Object.values(RARITIES)) {
        sum += rarity.rate;
        if (rand <= sum) {
            chosenRarity = rarity.name;
            break;
        }
    }

    if (!chosenRarity) chosenRarity = "COMMON";

    const petsOfRarity = Object.values(PETS).filter(pet => pet.rarity === chosenRarity);
    
    if (petsOfRarity.length === 0) {
        return Object.values(PETS).filter(pet => pet.rarity === "COMMON")[0];
    }
    
    return petsOfRarity[Math.floor(Math.random() * petsOfRarity.length)];
}

function formatPetInfo(pet, count = 1) {
    if (!pet) return "❌ Không có thông tin thú cưng!";
    
    const rarity = RARITIES[pet.rarity] || RARITIES.COMMON;
    return `${rarity.color} ${pet.name} (#${pet.id})\n` + 
           `💪 Sức mạnh: ${pet.power}\n` +
           `📝 ${pet.description}\n` +
           `🔰 Số lượng: ${count}x`;
}

function getCollectionCompletionRate(userPets) {
    const collections = {};
    
    Object.values(PETS).forEach(pet => {
        if (!collections[pet.collection]) {
            collections[pet.collection] = [];
        }
        collections[pet.collection].push(pet.id);
    });
    
    const completionRates = {};
    
    for (const [setName, petIds] of Object.entries(collections)) {
        const ownedCount = petIds.filter(id => userPets[id]).length;
        completionRates[setName] = {
            owned: ownedCount,
            total: petIds.length,
            complete: ownedCount === petIds.length && petIds.length > 0
        };
    }
    
    return completionRates;
}

module.exports = {
    name: "pet",
    dev: "HNT",
    category: "Game",
    info: "Hệ thống nuôi thú cưng",
    onPrefix: true,
    usedby: 2,
    usages: "[gacha/list/info]",
    cooldowns: 3,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const userData = loadData();

        if (!userData[senderID]) {
            userData[senderID] = {
                pets: {},
                selectedPet: null
            };
            saveData(userData);
        }

        if (!target[0]) {
            return api.sendMessage(
                "🐾 PET SYSTEM 2.0 🐾\n" +
                "───────────────\n" +
                "👉 Các lệnh cơ bản:\n" +
                "1. pet gacha - Gacha thú cưng mới\n" +
                "2. pet list - Xem bộ sưu tập\n" +
                "3. pet info - Thông tin chi tiết\n\n" +
                "👉 Tương tác:\n" +
                "4. pet feed [id] - Cho thú cưng ăn\n" +
                "5. pet battle [@người chơi] - Đấu pet\n" +
                "6. pet fusion [id1] [id2] - Hợp thể 2 pet\n\n" +
                "8. pet select [id] - Chọn thú cưng chính\n\n" +
                "👉 Nhiệm vụ & Phần thưởng:\n" +
                "7. pet collection - Xem bộ sưu tập\n" +
                "9. pet rank - Xếp hạng Pet Master\n\n" +
                "💰 Giá gacha: " + GACHA_COST.toLocaleString() + " $\n" +
                "🎯 Tỉ lệ:\n" +
                Object.entries(RARITIES)
                    .map(([_, r]) => `${r.color} ${r.name}: ${r.rate}%`)
                    .join("\n"),
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();

        switch (command) {
            case "gacha":
                const balance = await getBalance(senderID);
                if (balance < GACHA_COST) {
                    return api.sendMessage(`❌ Bạn cần ${GACHA_COST.toLocaleString()} $ để gacha!`, threadID, messageID);
                }
            
                await updateBalance(senderID, -GACHA_COST);
                const newPet = getRandomPet();
                
                if (!newPet || !newPet.id) {
                    console.error("Error: getRandomPet() returned undefined pet");
                    return api.sendMessage("❌ Có lỗi xảy ra khi gacha pet. Vui lòng thử lại!", threadID, messageID);
                }
                
                userData[senderID].pets[newPet.id] = (userData[senderID].pets[newPet.id] || 0) + 1;
                saveData(userData);
            
                const rarity = RARITIES[newPet.rarity];
                return api.sendMessage(
                    "🎉 GACHA RESULT 🎉\n" +
                    "───────────────\n" +
                    formatPetInfo(newPet) + "\n\n" +
                    `💰 Số dư: ${(await getBalance(senderID)).toLocaleString()} $`,
                    threadID, messageID
                );
                
            case "list":
                const pets = userData[senderID]?.pets || {};
                if (Object.keys(pets).length === 0) {
                    return api.sendMessage("❌ Bạn chưa có thú cưng nào!", threadID, messageID);
                }
                
                let listMessage = "🐾 BỘ SƯU TẬP THÚ CƯNG 🐾\n───────────────\n";
                
                const petsByRarity = {};
                Object.entries(pets).forEach(([petId, count]) => {
                    const pet = PETS[petId];
                    if (!pet) return; 
                    const rarity = pet.rarity;
                    if (!petsByRarity[rarity]) petsByRarity[rarity] = [];
                    petsByRarity[rarity].push({ ...pet, count });
                });

                Object.keys(RARITIES).forEach(rarity => {
                    if (petsByRarity[rarity]) {
                        listMessage += `\n${RARITIES[rarity].color} ${RARITIES[rarity].name}:\n`;
                        petsByRarity[rarity].forEach(pet => {
                            listMessage += `• ${pet.name} (#${pet.id}) x${pet.count}\n`;
                        });
                    }
                });

                return api.sendMessage(listMessage, threadID, messageID);
                case "info":
                    if (target[1]) {
                        const infoPetId = target[1].toUpperCase();
                        
                        if (!PETS[infoPetId]) {
                            return api.sendMessage("❌ ID thú cưng không hợp lệ!", threadID, messageID);
                        }
                        
                        const userHas = userData[senderID]?.pets?.[infoPetId] || 0;
                        if (userHas === 0) {
                            return api.sendMessage(`❌ Bạn chưa sở hữu thú cưng ${PETS[infoPetId].name} (#${infoPetId})!`, threadID, messageID);
                        }
                        const pet = PETS[infoPetId];
                        const stats = userData[senderID].petStats?.[infoPetId];
                        
                        let infoMsg = `📋 CHI TIẾT THÚ CƯNG 📋\n`;
                        infoMsg += `───────────────\n\n`;
                        infoMsg += `${RARITIES[pet.rarity].color} ${pet.name} (#${pet.id})\n`;
                        infoMsg += `🔰 Độ hiếm: ${RARITIES[pet.rarity].name}\n`;
                        infoMsg += `📝 Mô tả: ${pet.description}\n`;
                        infoMsg += `🏛️ Bộ sưu tập: ${pet.collection}\n`;
                        infoMsg += `💪 Sức mạnh cơ bản: ${pet.power}\n`;
                        
                        infoMsg += `\n🔢 Bạn đang sở hữu: ${userHas}x\n`;
                        
                        if (userHas > 0 && stats) {
                            const expNeeded = stats.level * 10;
                            const actualPower = Math.round(pet.power * stats.level);
                            
                            infoMsg += `\n📊 CẤP ĐỘ VÀ TIẾN TRIỂN\n`;
                            infoMsg += `⬆️ Level: ${stats.level}\n`;
                            infoMsg += `✨ EXP: ${stats.exp}/${expNeeded}\n`;
                            infoMsg += `💪 Sức mạnh thực tế: ${actualPower}\n`;
                            infoMsg += `🔄 Tiến trình lên cấp: ${"■".repeat(Math.floor(stats.exp/expNeeded*10))}${"□".repeat(10-Math.floor(stats.exp/expNeeded*10))}\n`;
                        }
                        
                        // Thông tin sở hữu
                        infoMsg += `\n🔢 Bạn đang sở hữu: ${userHas}x\n`;
                        
                        // Hướng dẫn nâng cấp
                        infoMsg += `\n💡 MẸO\n`;
                        
                        if (pet.rarity !== "LEGENDARY") {
                            const nextRarity = {
                                "COMMON": "UNCOMMON",
                                "UNCOMMON": "RARE",
                                "RARE": "EPIC",
                                "EPIC": "LEGENDARY"
                            }[pet.rarity];
                            
                            infoMsg += `• Fusion 2 pet ${RARITIES[pet.rarity].name} có thể nhận pet ${RARITIES[nextRarity].name}\n`;
                        }
                        
                        infoMsg += `• Cho pet ăn hàng ngày để tăng cấp độ\n`;
                        infoMsg += `• Mỗi cấp độ tăng sức mạnh lên ${pet.power} điểm`;
                        
                        return api.sendMessage(infoMsg, threadID, messageID);
                    }
                    
                    return api.sendMessage(
                        "👉 THANG ĐỘ HIẾM\n" +
                        Object.entries(RARITIES)
                            .map(([name, info]) => `${info.color} ${info.name}: +${info.rate}% (${getRarityPowerRange(name)})`)
                            .join("\n"),
                        threadID, messageID
                    );
                
                function getRarityPowerRange(rarity) {
                    const pets = Object.values(PETS).filter(p => p.rarity === rarity);
                    if (!pets.length) return "N/A";
                    
                    const min = Math.min(...pets.map(p => p.power));
                    const max = Math.max(...pets.map(p => p.power));
                    return `${min}-${max} sức mạnh`;
                }
                case "select":
                    const selectPetId = target[1]?.toUpperCase();
                    if (!selectPetId || !userData[senderID].pets[selectPetId]) {
                        return api.sendMessage("❌ Vui lòng nhập ID thú cưng hợp lệ!", threadID);
                    }
                    
                    userData[senderID].selectedPet = selectPetId;
                    saveData(userData);
                    
                    return api.sendMessage(
                        `✅ Đã chọn ${PETS[selectPetId].name} làm thú cưng chính!`,
                        threadID
                    );
            case "feed":
                const petId = target[1]?.toUpperCase();
                if (!petId || !userData[senderID].pets[petId]) {
                    return api.sendMessage("❌ Vui lòng nhập ID thú cưng hợp lệ!", threadID);
                }
                
                const feedCost = 50;
                if ((await getBalance(senderID)) < feedCost) {
                    return api.sendMessage(`❌ Bạn cần ${feedCost} $ để cho thú cưng ăn!`, threadID);
                }
                
                await updateBalance(senderID, -feedCost);
                
                if (!userData[senderID].petStats) userData[senderID].petStats = {};
                if (!userData[senderID].petStats[petId]) {
                    userData[senderID].petStats[petId] = { exp: 0, level: 1 };
                }
                
                const gainedExp = Math.floor(Math.random() * 5) + 1;
                userData[senderID].petStats[petId].exp += gainedExp;
                
                const currentExp = userData[senderID].petStats[petId].exp;
                const currentLevel = userData[senderID].petStats[petId].level;
                const expNeeded = currentLevel * 10;
                
                let levelUpMessage = "";
                if (currentExp >= expNeeded) {
                    userData[senderID].petStats[petId].level++;
                    userData[senderID].petStats[petId].exp -= expNeeded;
                    levelUpMessage = `\n🎊 ${PETS[petId].name} đã lên cấp ${userData[senderID].petStats[petId].level}!`;
                }
                
                saveData(userData);
                return api.sendMessage(
                    `🍖 Bạn đã cho ${PETS[petId].name} ăn!` +
                    `\n⬆️ +${gainedExp} EXP (${userData[senderID].petStats[petId].exp}/${expNeeded})` +
                    levelUpMessage,
                    threadID
                );

            case "battle":
                if (!target[1]) {
                    return api.sendMessage("❌ Vui lòng tag người chơi để đấu!", threadID, messageID);
                }
                
                const mentionId = Object.keys(event.mentions)[0];
                if (!mentionId) {
                    return api.sendMessage("❌ Vui lòng tag người chơi để đấu!", threadID, messageID);
                }
                
                if (!userData[mentionId] || !Object.keys(userData[mentionId].pets || {}).length) {
                    return api.sendMessage("❌ Người này không có thú cưng nào!", threadID, messageID);
                }
                
                const player1Pets = Object.entries(userData[senderID].pets || {})
                    .map(([id, count]) => ({
                        ...PETS[id],
                        level: userData[senderID].petStats?.[id]?.level || 1
                    }))
                    .sort((a, b) => (b.power * b.level) - (a.power * a.level))[0];
                    
                const player2Pets = Object.entries(userData[mentionId].pets || {})
                    .map(([id, count]) => ({
                        ...PETS[id],
                        level: userData[mentionId].petStats?.[id]?.level || 1
                    }))
                    .sort((a, b) => (b.power * b.level) - (a.power * a.level))[0];
                    
                const player1Power = player1Pets.power * player1Pets.level;
                const player2Power = player2Pets.power * player2Pets.level;
                
                const battleResult = [player1Power, player2Power]
                    .map(p => p + (Math.random() * p * 0.2));
                
                const winner = battleResult[0] > battleResult[1] ? senderID : mentionId;
                const reward = 100;
                await updateBalance(winner, reward);
                
                return api.sendMessage(
                    "⚔️ BATTLE RESULT ⚔️\n" +
                    "───────────────\n" +
                    `👤 @${event.senderID}: ${player1Pets.name} (Lv.${player1Pets.level}) - Sức mạnh: ${player1Power}\n` +
                    `👤 @${mentionId}: ${player2Pets.name} (Lv.${player2Pets.level}) - Sức mạnh: ${player2Power}\n\n` +
                    `🏆 Người chiến thắng: ${winner === senderID ? "Bạn" : event.mentions[mentionId].replace("@", "")}\n` +
                    `💰 Phần thưởng: ${reward} $`,
                    threadID,
                    messageID
                );

            case "fusion":
                if (!target[1] || !target[2]) {
                    return api.sendMessage("❌ Sử dụng: .pet fusion [pet1_id] [pet2_id]", threadID);
                }
                
                const pet1Id = target[1].toUpperCase();
                const pet2Id = target[2].toUpperCase();
                
                if (!userData[senderID].pets[pet1Id] || !userData[senderID].pets[pet2Id]) {
                    return api.sendMessage("❌ Bạn không sở hữu một trong hai pet này!", threadID);
                }
                
                if (userData[senderID].pets[pet1Id] < 2 && pet1Id === pet2Id) {
                    return api.sendMessage("❌ Bạn cần ít nhất 2 pet giống nhau để fusion!", threadID);
                }
                
                const pet1 = PETS[pet1Id];
                const pet2 = PETS[pet2Id];
                const fusionCost = FUSION_RULES[pet1.rarity].cost;
                
                if ((await getBalance(senderID)) < fusionCost) {
                    return api.sendMessage(
                        `❌ Bạn cần ${fusionCost.toLocaleString()} $ để fusion pet ${RARITIES[pet1.rarity].name}!`, 
                        threadID
                    );
                }
                
                await updateBalance(senderID, -fusionCost);
                
                userData[senderID].pets[pet1Id]--;
                if (pet1Id !== pet2Id) {
                    userData[senderID].pets[pet2Id]--;
                }
                
                const rarityLevels = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];
                const pet1RarityIndex = rarityLevels.indexOf(pet1.rarity);
                const pet2RarityIndex = rarityLevels.indexOf(pet2.rarity);
                
                let successChance = FUSION_RULES[pet1.rarity].successRate;
                if (pet1Id === pet2Id) {
                    successChance += FUSION_RULES[pet1.rarity].sameTypeBonus;
                }
                
                const successRoll = Math.random();
                let resultingRarity;
                
                if (successRoll <= successChance) {
                    resultingRarity = rarityLevels[Math.min(
                        rarityLevels.length - 1,
                        Math.max(pet1RarityIndex, pet2RarityIndex) + 1
                    )];
                } else {
                    resultingRarity = rarityLevels[Math.max(pet1RarityIndex, pet2RarityIndex)];
                }
                
                const possibleResults = Object.values(PETS).filter(p => p.rarity === resultingRarity);
                const result = possibleResults[Math.floor(Math.random() * possibleResults.length)];
                
                userData[senderID].pets[result.id] = (userData[senderID].pets[result.id] || 0) + 1;
                saveData(userData);
                
                return api.sendMessage(
                    "✨ FUSION RESULT ✨\n" +
                    "───────────────\n" +
                    `📥 Pet sử dụng:\n` +
                    `• ${pet1.name} (#${pet1.id})\n` +
                    `• ${pet2.name} (#${pet2.id})\n\n` +
                    `📊 Tỉ lệ thành công: ${Math.round(successChance * 100)}%\n` +
                    `💰 Chi phí: ${fusionCost.toLocaleString()} $\n\n` +
                    `📤 Kết quả:\n${formatPetInfo(result)}` +
                    (result.rarity > pet1.rarity ? "\n🎉 RANK UP!" : ""),
                    threadID
                );

            case "collection":
                const userPets = userData[senderID].pets || {};
                const collections = getCollectionCompletionRate(userPets);
                
                let message = "🗃️ BỘ SƯU TẬP THÚ CƯNG 🗃️\n───────────────\n";
                
                for (const [setName, stats] of Object.entries(collections)) {
                    message += `\n${stats.complete ? "✅" : "⬜"} ${setName}: ${stats.owned}/${stats.total}`;
                    
                    if (stats.complete) {
                        message += " (Hoàn thành)";
                    }
                }
                
                let completedNew = false;
                
                for (const [setName, stats] of Object.entries(collections)) {
                    if (stats.complete && !userData[senderID].claimedCollections?.includes(setName)) {
                        if (!userData[senderID].claimedCollections) {
                            userData[senderID].claimedCollections = [];
                        }
                        
                        userData[senderID].claimedCollections.push(setName);
                        const collectionReward = 2000;
                        await updateBalance(senderID, collectionReward);
                        
                        message += `\n\n🎉 Chúc mừng! Bạn đã hoàn thành bộ ${setName}!`;
                        message += `\n💰 +${collectionReward} $`;
                        completedNew = true;
                    }
                }
                
                if (completedNew) {
                    saveData(userData);
                }
                
                return api.sendMessage(message, threadID);

            case "rank":
                const allUsers = loadData();
                const rankedUsers = [];
                
                for (const [userId, user] of Object.entries(allUsers)) {
                    if (!user.pets || Object.keys(user.pets).length === 0) continue;
                    
                    let score = 0;
                    let totalPets = 0;
                    
                    Object.entries(user.pets).forEach(([petId, count]) => {
                        const pet = PETS[petId];
                        if (!pet) return;
                        
                        const rarityScore = {
                            "COMMON": 1,
                            "UNCOMMON": 2,
                            "RARE": 5,
                            "EPIC": 10,
                            "LEGENDARY": 20
                        }[pet.rarity];
                        
                        const levelMultiplier = user.petStats?.[petId]?.level || 1;
                        score += rarityScore * count * levelMultiplier;
                        totalPets += count;
                    });
                    
                    const collections = getCollectionCompletionRate(user.pets);
                    score += Object.values(collections).filter(c => c.complete).length * 50;
                    
                    rankedUsers.push({
                        userId,
                        score,
                        totalPets
                    });
                }
                
                rankedUsers.sort((a, b) => b.score - a.score);
                
                let rankMessage = "🏆 PET MASTER RANKING 🏆\n───────────────\n\n";
                
                rankedUsers.slice(0, 10).forEach((user, index) => {
                    rankMessage += `${index + 1}. ${user.userId}: ${user.score} điểm (${user.totalPets} pets)\n`;
                });
                
                const userRank = rankedUsers.findIndex(u => u.userId === senderID);
                if (userRank !== -1) {
                    rankMessage += `\n👉 Hạng của bạn: ${userRank + 1}/${rankedUsers.length}`;
                }
                
                return api.sendMessage(rankMessage, threadID);

            default:
                return api.sendMessage("❌ Lệnh không hợp lệ! Gõ .pet để xem hướng dẫn.", threadID, messageID);
        }
    }
};
