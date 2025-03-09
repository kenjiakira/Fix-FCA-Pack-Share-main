const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { createPetImage } = require('../canvas/petCanvas');

const PET_FILE = path.join(__dirname, './json/pet.json');
const QUEST_TYPES = {
    DAILY: {
        "Tập thể dục": {
            description: "Chơi với pet 3 lần",
            requirement: 3,
            type: "play",
            reward: {
                exp: 50,
                money: 200
            }
        },
        "Bữa ăn đầy đủ": {
            description: "Cho pet ăn 3 lần",
            requirement: 3,
            type: "feed",
            reward: {
                exp: 50,
                money: 200
            }
        },
        "Huấn luyện chăm chỉ": {
            description: "Huấn luyện pet 2 lần",
            requirement: 2,
            type: "train",
            reward: {
                exp: 100,
                money: 500
            }
        }
    },
    ACHIEVEMENT: {
        "Chuyên gia huấn luyện": {
            description: "Đạt level 10",
            condition: (pet) => pet.level >= 10,
            reward: {
                exp: 500,
                money: 2000,
                title: "🎓 Chuyên Gia"
            }
        },
        "Siêu sao": {
            description: "Đạt 1000 điểm sức mạnh",
            condition: (pet) => (pet.power || 0) >= 1000,
            reward: {
                exp: 1000,
                money: 5000,
                title: "💪 Siêu Sao"
            }
        }
    }
};
const PET_TYPES = {
    DOG: {
        name: "Chó",
        price: 5000,
        maxHunger: 100,
        maxHappy: 100,
        maxEnergy: 100,
        foods: ["xương", "thịt", "pate"],
        activities: ["đi dạo", "ném bóng", "huấn luyện"]
    },
    CAT: {
        name: "Mèo",
        price: 4500,
        maxHunger: 100,
        maxHappy: 100,
        maxEnergy: 100,
        foods: ["cá", "thịt", "pate"],
        activities: ["vuốt ve", "đồ chơi chuột", "leo trèo"]
    },
    HAMSTER: {
        name: "Chuột Hamster",
        price: 2500,
        maxHunger: 100,
        maxHappy: 100,
        maxEnergy: 100,
        foods: ["hạt", "rau", "trái cây"],
        activities: ["chạy wheel", "chui ống", "đồ chơi gặm"]
    }
};

const PET_SKILLS = {
    DOG: {
        FETCH: {
            name: "Fetch",
            description: "Tìm kiếm vật phẩm quý hiếm",
            cooldown: 300000, // 5 phút
            minLevel: 1,
            effect: (pet) => {
                const rewards = [
                    { item: "xương", chance: 50, value: 100 },
                    { item: "pate", chance: 30, value: 200 },
                    { item: "bóng tennis", chance: 20, value: 300 }
                ];
                const roll = Math.random() * 100;
                let sum = 0;
                for (const reward of rewards) {
                    sum += reward.chance;
                    if (roll <= sum) {
                        return `🦴 Tìm thấy ${reward.item}! (${reward.value}$)`;
                    }
                }
            }
        },
        GUARD: {
            name: "Guard",
            description: "Bảo vệ chủ nhân, tăng thu nhập",
            cooldown: 600000, // 10 phút
            minLevel: 3,
            effect: (pet) => {
                const bonus = Math.floor(pet.level * 1.5) * 100;
                return `🛡️ Canh gác thành công! Nhận thêm ${bonus}$ tiền thưởng`;
            }
        }
    },
    CAT: {
        HUNT: {
            name: "Hunt",
            description: "Săn bắt chuột, kiếm tiền",
            cooldown: 300000,
            minLevel: 1,
            effect: (pet) => {
                const caught = Math.random() < 0.7;
                const reward = Math.floor(pet.level * 100);
                return caught ? 
                    `🐭 Bắt được chuột! Nhận ${reward}$` : 
                    "😿 Không bắt được gì...";
            }
        },
        CHARM: {
            name: "Charm",
            description: "Quyến rũ người khác để nhận quà",
            cooldown: 600000,
            minLevel: 3,
            effect: (pet) => {
                const gifts = ["pate cao cấp", "đồ chơi mới", "khăn ấm"];
                const gift = gifts[Math.floor(Math.random() * gifts.length)];
                return `😺 Dùng vẻ đáng yêu để nhận được ${gift}!`;
            }
        }
    },
    HAMSTER: {
        GATHER: {
            name: "Gather",
            description: "Thu thập hạt và thức ăn",
            cooldown: 300000,
            minLevel: 1,
            effect: (pet) => {
                const items = ["hạt hướng dương", "hạt bí", "ngũ cốc"];
                const count = Math.floor(Math.random() * 3) + 1;
                const item = items[Math.floor(Math.random() * items.length)];
                return `🌰 Thu thập được ${count}x ${item}!`;
            }
        },
        PERFORM: {
            name: "Perform",
            description: "Biểu diễn đáng yêu để kiếm tiền",
            cooldown: 600000,
            minLevel: 3,
            effect: (pet) => {
                const tips = Math.floor((Math.random() * 5 + 5) * pet.level);
                return `🎪 Biểu diễn thành công! Nhận được ${tips}$ tiền thưởng`;
            }
        }
    }
};
const TRAINING_ACTIVITIES = {
    DOG: {
        "vượt chướng ngại": {
            exp: 20,
            powerGain: 15,
            cost: 300,
            description: "Huấn luyện khả năng vượt chướng ngại vật"
        },
        "tuần tra": {
            exp: 25,
            powerGain: 20,
            cost: 400,
            description: "Luyện tập kỹ năng tuần tra và canh gác"
        },
        "nghe lệnh": {
            exp: 30,
            powerGain: 25,
            cost: 500,
            description: "Rèn luyện khả năng tuân theo mệnh lệnh"
        }
    },
    CAT: {
        "leo trèo": {
            exp: 20,
            powerGain: 15,
            cost: 300,
            description: "Tập luyện kỹ năng leo trèo và thăng bằng"
        },
        "săn mồi": {
            exp: 25,
            powerGain: 20,
            cost: 400,
            description: "Rèn luyện bản năng và kỹ thuật săn mồi"
        },
        "ẩn nấp": {
            exp: 30,
            powerGain: 25,
            cost: 500,
            description: "Luyện tập kỹ năng ẩn nấp và ngụy trang"
        }
    },
    HAMSTER: {
        "chạy wheel": {
            exp: 20,
            powerGain: 15,
            cost: 300,
            description: "Tăng sức bền và tốc độ"
        },
        "đào hang": {
            exp: 25,
            powerGain: 20,
            cost: 400,
            description: "Rèn luyện kỹ năng đào hang và tìm đường"
        },
        "giấu thức ăn": {
            exp: 30,
            powerGain: 25,
            cost: 500,
            description: "Luyện tập khả năng tích trữ và ghi nhớ"
        }
    }
};

const PET_FOODS = {
    "xương": {
        price: 500,
        hunger: 25,
        happy: 5,
        energy: 20,
        description: "Xương thơm ngon dành cho chó",
        effect: "Tăng 5% sức mạnh trong 1 giờ",
        type: "DOG",
        rarity: "COMMON",
        emoji: "🦴"
    },
    "thịt": {
        price: 800,
        hunger: 35,
        happy: 8,
        energy: 30,
        description: "Thịt tươi ngon bổ dưỡng",
        effect: "Tăng 20 điểm sức mạnh",
        type: ["DOG", "CAT"],
        rarity: "UNCOMMON",
        emoji: "🥩"
    },
    "pate": {
        price: 1000,
        hunger: 40,
        happy: 15,
        energy: 40,
        description: "Pate cao cấp nhập khẩu",
        effect: "Tăng 50% tốc độ lên level trong 30 phút",
        type: ["DOG", "CAT"],
        rarity: "RARE",
        emoji: "🥫"
    },
    "cá": {
        price: 600,
        hunger: 30,
        happy: 10,
        energy: 25,
        description: "Cá tươi giàu dinh dưỡng",
        effect: "Tăng 10% may mắn khi săn mồi",
        type: "CAT",
        rarity: "UNCOMMON",
        emoji: "🐟"
    },
    "hạt": {
        price: 300,
        hunger: 20,
        happy: 5,
        energy: 15,
        description: "Hạt dinh dưỡng tổng hợp",
        effect: "Hồi 10 năng lượng mỗi 5 phút",
        type: "HAMSTER",
        rarity: "COMMON",
        emoji: "🌰"
    },
    "rau": {
        price: 200,
        hunger: 15,
        happy: 3,
        energy: 10,
        description: "Rau xanh tươi mát",
        effect: "Tăng 5% tốc độ hồi phục",
        type: "HAMSTER",
        rarity: "COMMON",
        emoji: "🥬"
    },
    "trái cây": {
        price: 400,
        hunger: 25,
        happy: 12,
        energy: 20,
        description: "Trái cây tươi ngọt",
        effect: "Tăng 10 điểm hạnh phúc",
        type: "HAMSTER",
        rarity: "UNCOMMON",
        emoji: "🍎"
    }
};

function loadPetData() {
    try {
        if (!fs.existsSync(PET_FILE)) {
            const dir = path.dirname(PET_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(PET_FILE, JSON.stringify({}));
            return {};
        }
        return JSON.parse(fs.readFileSync(PET_FILE));
    } catch (error) {
        console.error('Error loading pet data:', error);
        return {};
    }
}

function savePetData(data) {
    try {
        fs.writeFileSync(PET_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving pet data:', error);
    }
}

function getTimeLeft(lastTime, cooldown) {
    const timeLeft = cooldown - (Date.now() - lastTime);
    return timeLeft > 0 ? Math.ceil(timeLeft / 1000) : 0;
}

function createProgressBar(value, maxValue, size = 10) {
    const percentage = Math.round((value / maxValue) * size);
    const filled = '■'.repeat(percentage);
    const empty = '□'.repeat(size - percentage);
    return filled + empty;
}
function calculateCurrentStats(pet) {
    const now = Date.now();
    const hoursPassed = (now - pet.lastFed) / (1000 * 60 * 60);

    const hungerLoss = 5 * hoursPassed; 
    const energyLoss = 3 * hoursPassed; 
    const happyLoss = 4 * hoursPassed; 

    pet.hunger = Math.max(0, Math.min(pet.hunger - hungerLoss, PET_TYPES[pet.type].maxHunger));
    pet.energy = Math.max(0, Math.min(pet.energy - energyLoss, PET_TYPES[pet.type].maxEnergy));
    pet.happy = Math.max(0, Math.min(pet.happy - happyLoss, PET_TYPES[pet.type].maxHappy));

    return pet;
}
module.exports = {
    name: "pet",
    dev: "HNT",
    category: "Games",
    usedby: 0,
    info: "Nuôi thú cưng ảo",
    usages: ".pet [buy/feed/play/info/shop]",
    onPrefix: true,
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const petData = loadPetData();

        if (!target[0]) {
            return api.sendMessage(
                "🐾 HƯỚNG DẪN NUÔI THÚ CƯNG 🐾\n\n" +
                "1. .pet buy [dog/cat/hamster] - Mua thú cưng\n" +
                "2. .pet feed [thức ăn] - Cho thú cưng ăn\n" +
                "3. .pet play [hoạt động] - Chơi với thú cưng\n" +
                "4. .pet info - Xem thông tin thú cưng\n" +
                "5. .pet shop - Xem cửa hàng thú cưng\n" +
                "6. .pet food - Xem cửa hàng thức ăn\n" +
                "7. .pet skill [skill] - Sử dụng kỹ năng của thú cưng\n" +
                "8. .pet train - Huấn luyện thú cưng\n" +
                "9. .pet quest - Nhận nhiệm vụ cho thú cưng" +
                "10 .pet rename [tên mới] - Đặt tên mới cho thú cư",
                threadID, messageID
            );
        }

        const action = target[0].toLowerCase();

        switch (action) {
            case "buy": {
                if (!target[1]) {
                    return api.sendMessage(
                        "🏪 HƯỚNG DẪN MUA THÚ CƯNG 🏪\n" +
                        "───────────────\n\n" +
                        "👉 Cách dùng: .pet buy [loại thú]\n" +
                        "🐕 Chó (dog): 5,000$\n" +
                        "🐈 Mèo (cat): 4,500$\n" +
                        "🐹 Hamster (hamster): 2,500$\n\n" +
                        "💡 Lưu ý:\n" +
                        "• Mỗi người chỉ nuôi được 1 pet\n" +
                        "• Có thể đặt tên cho pet khi mua\n" +
                        "• Cú pháp: .pet buy [loại] [tên]",
                        threadID, messageID
                    );
                }
            
                if (petData[senderID]) {
                    const currentPet = petData[senderID];
                    return api.sendMessage(
                        `❌ Bạn đã có ${currentPet.name} rồi!\n` +
                        "💭 Hãy chăm sóc thật tốt pet hiện tại nhé!",
                        threadID, messageID
                    );
                }
            
                const petType = target[1].toUpperCase();
                if (!PET_TYPES[petType]) {
                    return api.sendMessage(
                        "❌ Loại thú cưng không hợp lệ!\n" +
                        "👉 Chọn một trong các loại: dog, cat, hamster",
                        threadID, messageID
                    );
                }
            
                const pet = PET_TYPES[petType];
                const balance = await getBalance(senderID);
            
                if (balance < pet.price) {
                    return api.sendMessage(
                        `❌ Bạn không đủ tiền!\n` +
                        `💰 Giá: ${pet.price.toLocaleString()}$\n` +
                        `💵 Số dư: ${balance.toLocaleString()}$\n` +
                        `🎯 Còn thiếu: ${(pet.price - balance).toLocaleString()}$`,
                        threadID, messageID
                    );
                }
            
                const petName = target[2] ? target[2].charAt(0).toUpperCase() + target[2].slice(1) : pet.name;
                
                const newPet = {
                    type: petType,
                    name: petName,
                    hunger: pet.maxHunger,
                    happy: pet.maxHappy,
                    energy: pet.maxEnergy,
                    level: 1,
                    exp: 0,
                    power: 10,
                    lastFed: Date.now(),
                    lastPlay: Date.now(),
                    skills: {},
                    inventory: [],
                    stats: {
                        gamesPlayed: 0,
                        foodEaten: 0,
                        trainingSessions: 0,
                        questsCompleted: 0
                    },
                    achievements: {},
                    birthday: Date.now()
                };
            
                // Thêm kỹ năng cơ bản dựa trên loại pet
                Object.keys(PET_SKILLS[petType]).forEach(skillId => {
                    newPet.skills[skillId] = {
                        level: 1,
                        exp: 0,
                        lastUsed: 0
                    };
                });
            
                await updateBalance(senderID, -pet.price);
                petData[senderID] = newPet;
                savePetData(petData);
            
                return api.sendMessage(
                    "🎉 CHÚC MỪNG BẠN ĐÃ MUA PET THÀNH CÔNG! 🎉\n" +
                    "───────────────\n\n" +
                    `🐾 Tên: ${petName}\n` +
                    `📋 Loại: ${pet.name}\n` +
                    `💪 Sức mạnh cơ bản: 10\n` +
                    `🎮 Kỹ năng có sẵn: ${Object.keys(PET_SKILLS[petType]).length}\n\n` +
                    "💡 Lời khuyên:\n" +
                    "• Cho pet ăn thường xuyên\n" +
                    "• Chơi với pet mỗi ngày\n" +
                    "• Huấn luyện để tăng sức mạnh\n" +
                    "• Làm nhiệm vụ để nhận thưởng\n\n" +
                    "👉 Gõ .pet info để xem thông tin chi tiết",
                    threadID, messageID
                );
            }
            case "feed": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
            
                if (!target[1]) {
                    const suitableFoods = Object.entries(PET_FOODS)
                        .filter(([_, info]) => 
                            Array.isArray(info.type) ? 
                            info.type.includes(pet.type) : 
                            info.type === pet.type
                        )
                        .map(([name, info]) => `${info.emoji} ${name}`)
                        .join(", ");
            
                    return api.sendMessage(
                        `🍖 CHỌN THỨC ĂN CHO ${pet.name}\n` +
                        "───────────────\n\n" +
                        `Thức ăn phù hợp:\n${suitableFoods}\n\n` +
                        "Cách dùng: .pet feed [tên thức ăn]",
                        threadID, messageID
                    );
                }
            
                const foodName = target[1].toLowerCase();
                const foodInfo = PET_FOODS[foodName];
            
                if (!foodInfo) {
                    return api.sendMessage(
                        "❌ Không tìm thấy thức ăn này!\n" +
                        "👉 Gõ .pet feed để xem danh sách thức ăn",
                        threadID, messageID
                    );
                }
            
                const canEat = Array.isArray(foodInfo.type) ? 
                    foodInfo.type.includes(pet.type) : 
                    foodInfo.type === pet.type;
            
                if (!canEat) {
                    return api.sendMessage(
                        `❌ ${pet.name} không thể ăn ${foodName}!\n` +
                        "👉 Gõ .pet feed để xem thức ăn phù hợp",
                        threadID, messageID
                    );
                }
        
                const balance = await getBalance(senderID);
                if (balance < foodInfo.price) {
                    return api.sendMessage(
                        `❌ Bạn không đủ tiền!\n` +
                        `💰 Giá: ${foodInfo.price.toLocaleString()}$\n` +
                        `💵 Số dư: ${balance.toLocaleString()}$`,
                        threadID, messageID
                    );
                }
            
                const fedTime = getTimeLeft(pet.lastFed, 30000);
                if (fedTime > 0) {
                    return api.sendMessage(
                        `⏳ Vui lòng đợi ${fedTime} giây nữa!`,
                        threadID, messageID
                    );
                }
            
                await updateBalance(senderID, -foodInfo.price);
                pet.hunger = Math.min(pet.hunger + foodInfo.hunger, PET_TYPES[pet.type].maxHunger);
                pet.happy = Math.min(pet.happy + foodInfo.happy, PET_TYPES[pet.type].maxHappy);
                pet.energy = Math.min(pet.energy + foodInfo.energy, PET_TYPES[pet.type].maxEnergy);
                pet.lastFed = Date.now();
                pet.exp += 10;
            
                if (!pet.quests) pet.quests = { daily: {} };
                pet.quests.daily.feedCount = (pet.quests.daily.feedCount || 0) + 1;
            
                if (pet.exp >= 100 * pet.level) {
                    pet.level++;
                    pet.exp = 0;
                }
            
                savePetData(petData);
                return api.sendMessage(
                    `${foodInfo.emoji} Đã cho ${pet.name} ăn ${foodName}!\n\n` +
                    `🔄 Năng lượng: ${createProgressBar(pet.energy, PET_TYPES[pet.type].maxEnergy)} (${pet.energy}%)\n` +
                    `🍖 Độ đói: ${createProgressBar(pet.hunger, PET_TYPES[pet.type].maxHunger)} (${pet.hunger}%)\n` +
                    `😊 Hạnh phúc: ${createProgressBar(pet.happy, PET_TYPES[pet.type].maxHappy)} (${pet.happy}%)\n` +
                    `📊 Level: ${pet.level} (${pet.exp}/100)\n\n` +
                    `💫 Hiệu ứng: ${foodInfo.effect}`,
                    threadID, messageID
                );
            }

            case "play": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
                if (pet.hunger <= 10) {
                    return api.sendMessage(
                        "❌ Thú cưng đang đói! Hãy cho ăn trước.",
                        threadID, messageID
                    );
                }
            
                if (pet.energy <= 10) {
                    return api.sendMessage(
                        "❌ Thú cưng đang mệt! Cần nghỉ ngơi.",
                        threadID, messageID
                    );
                }

                if (!target[1]) {
                    const activities = PET_TYPES[pet.type].activities;
                    return api.sendMessage(
                        `Vui lòng chọn hoạt động:\n${activities.join(", ")}\n` +
                        `Ví dụ: .pet play ${activities[0]}`,
                        threadID, messageID
                    );
                }

                const activity = target[1].toLowerCase();
                if (!PET_TYPES[pet.type].activities.includes(activity)) {
                    return api.sendMessage(
                        `Hoạt động không hợp lệ!\nHoạt động cho ${pet.name}:\n` +
                        PET_TYPES[pet.type].activities.join(", "),
                        threadID, messageID
                    );
                }

                const playTime = getTimeLeft(pet.lastPlay, 60000);
                if (playTime > 0) {
                    return api.sendMessage(
                        `Vui lòng đợi ${playTime} giây nữa mới có thể chơi!`,
                        threadID, messageID
                    );
                }

                if (pet.energy < 20) {
                    return api.sendMessage(
                        "Thú cưng quá mệt để chơi! Hãy cho ăn để hồi phục năng lượng.",
                        threadID, messageID
                    );
                }

                pet.happy = Math.min(pet.happy + 20, PET_TYPES[pet.type].maxHappy);
                pet.energy = Math.max(0, pet.energy - 20);
                pet.lastPlay = Date.now();
                pet.exp += 15;

                if (pet.exp >= 100 * pet.level) {
                    pet.level++;
                    pet.exp = 0;
                }

                savePetData(petData);
                return api.sendMessage(
                    `🎮 Đã chơi ${activity} với ${pet.name}!\n` +
                    `⚡ Năng lượng: ${createProgressBar(pet.energy, PET_TYPES[pet.type].maxEnergy)} (${pet.energy}%)\n` +
                    `😊 Hạnh phúc: ${createProgressBar(pet.happy, PET_TYPES[pet.type].maxHappy)} (${pet.happy}%)\n` +
                    `📊 Level: ${pet.level} (${pet.exp}/100)`,
                    threadID, messageID
                );
            }

            case "info": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
            
                const updatedPet = calculateCurrentStats(pet);
                petData[senderID] = updatedPet;
                savePetData(petData);
            
                try {
                    const imagePath = await createPetImage({
                        userId: senderID,
                        userName: event.senderID,
                        pet: {
                            ...updatedPet,
                            maxEnergy: PET_TYPES[pet.type].maxEnergy,
                            maxHunger: PET_TYPES[pet.type].maxHunger,
                            maxHappy: PET_TYPES[pet.type].maxHappy
                        },
                        type: pet.type
                    });

                    return api.sendMessage(
                        {
                            body: "🐾 THÔNG TIN THÚ CƯNG 🐾\n" +
                                `Tên: ${pet.name}\n` +
                                `Level: ${pet.level} (${pet.exp}/100)\n` +
                                `Thức ăn yêu thích: ${PET_TYPES[pet.type].foods.join(", ")}\n` +
                                `Hoạt động yêu thích: ${PET_TYPES[pet.type].activities.join(", ")}`,
                            attachment: fs.createReadStream(imagePath)
                        },
                        threadID,
                        () => fs.unlinkSync(imagePath),
                        messageID
                    );
                } catch (error) {
                    console.error('Error creating pet image:', error);
                  
                    return api.sendMessage(
                        "🐾 THÔNG TIN THÚ CƯNG 🐾\n" +
                        `Tên: ${pet.name}\n` +
                        `Loại: ${PET_TYPES[pet.type].name}\n` +
                        `Level: ${pet.level}\n` +
                        `EXP: ${pet.exp}/100\n\n` +
                        `🔄 Năng lượng: ${createProgressBar(pet.energy, PET_TYPES[pet.type].maxEnergy)} (${pet.energy}%)\n` +
                        `🍖 Độ đói: ${createProgressBar(pet.hunger, PET_TYPES[pet.type].maxHunger)} (${pet.hunger}%)\n` +
                        `😊 Hạnh phúc: ${createProgressBar(pet.happy, PET_TYPES[pet.type].maxHappy)} (${pet.happy}%)\n\n` +
                        `💝 Thức ăn yêu thích: ${PET_TYPES[pet.type].foods.join(", ")}\n` +
                        `🎮 Hoạt động yêu thích: ${PET_TYPES[pet.type].activities.join(", ")}`,
                        threadID, messageID
                    );
                }
            }
            case "shop": {
                const balance = await getBalance(senderID);
                const currentPet = petData[senderID];
            
                let shopMessage = "🏪 CỬA HÀNG THÚ CƯNG 🏪\n";
                shopMessage += "───────────────\n\n";
            
                for (const [type, pet] of Object.entries(PET_TYPES)) {
                    const canBuy = balance >= pet.price;
                    const isPetOwned = currentPet?.type === type;
                    
                    shopMessage += `${isPetOwned ? "✨" : canBuy ? "✅" : "❌"} ${pet.name.toUpperCase()}\n`;
                    shopMessage += `› Giá: ${pet.price.toLocaleString()}$\n`;
                    shopMessage += `› Thông số cơ bản:\n`;
                    shopMessage += `  ⚡ Năng lượng tối đa: ${pet.maxEnergy}\n`;
                    shopMessage += `  🍖 Độ đói tối đa: ${pet.maxHunger}\n`;
                    shopMessage += `  😊 Độ vui tối đa: ${pet.maxHappy}\n`;
                    
                    shopMessage += `› Kỹ năng đặc trưng:\n`;
                    Object.entries(PET_SKILLS[type]).forEach(([skillId, skill]) => {
                        shopMessage += `  🎯 ${skill.name}: ${skill.description}\n`;
                    });
            
                    shopMessage += `› Thức ăn ưa thích: ${pet.foods.map(food => {
                        const foodInfo = PET_FOODS[food];
                        return foodInfo ? `${foodInfo.emoji} ${food}` : food;
                    }).join(", ")}\n`;
            
                    shopMessage += `› Hoạt động: ${pet.activities.join(", ")}\n\n`;
                }
            
                shopMessage += "💡 THÔNG TIN THÊM:\n";
                shopMessage += "• Mỗi người chỉ nuôi được 1 pet\n";
                shopMessage += "• Pet cần được cho ăn và chơi đùa thường xuyên\n";
                shopMessage += "• Càng chăm sóc tốt, pet càng phát triển mạnh\n\n";
            
                shopMessage += `💰 Số dư của bạn: ${balance.toLocaleString()}$\n`;
                if (currentPet) {
                    shopMessage += "❌ Bạn đã có pet, không thể mua thêm!\n";
                }
                shopMessage += "\nMua thú cưng: .pet buy [dog/cat/hamster]";
            
                return api.sendMessage(shopMessage, threadID, messageID);
            }
            case "rename": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("❌ Bạn chưa có thú cưng!", threadID, messageID);
                }
            
                if (!target[1]) {
                    return api.sendMessage(
                        "👉 Cách đặt tên cho pet:\n" +
                        "• .pet rename [tên mới]\n\n" +
                        "💡 Lưu ý:\n" +
                        "• Tên phải từ 1-15 ký tự\n" +
                        "• Không chứa ký tự đặc biệt\n" +
                        "• Chi phí đổi tên: 1000$",
                        threadID, messageID
                    );
                }
            
                const newName = target.slice(1).join(" ");
            
                if (newName.length > 15 || newName.length < 1) {
                    return api.sendMessage(
                        "❌ Tên phải có độ dài từ 1-15 ký tự!",
                        threadID, messageID
                    );
                }
            
                if (!/^[a-zA-Z0-9\sÀ-ỹ]+$/g.test(newName)) {
                    return api.sendMessage(
                        "❌ Tên không được chứa ký tự đặc biệt!",
                        threadID, messageID
                    );
                }
            
                const balance = await getBalance(senderID);
                if (balance < 1000) {
                    return api.sendMessage(
                        "❌ Bạn không đủ tiền!\n" +
                        "💰 Chi phí đổi tên: 1000$\n" +
                        `💵 Số dư: ${balance}$`,
                        threadID, messageID
                    );
                }
            
                const oldName = pet.name;
                
                await updateBalance(senderID, -1000);
                pet.name = newName.charAt(0).toUpperCase() + newName.slice(1);
                savePetData(petData);
            
                return api.sendMessage(
                    "✅ Đổi tên thành công!\n\n" +
                    `Tên cũ: ${oldName}\n` +
                    `Tên mới: ${pet.name}\n\n` +
                    "💸 -1000$ phí đổi tên",
                    threadID, messageID
                );
            }
            case "food": {
                const pet = petData[senderID];
                
                let foodMessage = "🏪 CỬA HÀNG THỨC ĂN 🏪\n───────────────\n\n";
                
                const foodByRarity = {};
                Object.entries(PET_FOODS).forEach(([name, info]) => {
                    if (!foodByRarity[info.rarity]) foodByRarity[info.rarity] = [];
                    foodByRarity[info.rarity].push({name, ...info});
                });
            
                const rarityOrder = ["RARE", "UNCOMMON", "COMMON"];
                const rarityEmoji = {
                    "RARE": "🌟",
                    "UNCOMMON": "⭐",
                    "COMMON": "⚪"
                };
            
                rarityOrder.forEach(rarity => {
                    if (foodByRarity[rarity]) {
                        foodMessage += `${rarityEmoji[rarity]} ${rarity}:\n`;
                        foodByRarity[rarity].forEach(food => {
                            const canEat = !pet || (Array.isArray(food.type) ? 
                                food.type.includes(pet.type) : 
                                food.type === pet.type);
            
                            foodMessage += `${food.emoji} ${food.name}\n`;
                            foodMessage += `› Giá: ${food.price}$\n`;
                            foodMessage += `› Năng lượng +${food.hunger}%, Hạnh phúc +${food.happy}%\n`;
                            foodMessage += `› ${food.description}\n`;
                            foodMessage += `› Hiệu ứng: ${food.effect}\n`;
                            if (!canEat && pet) {
                                foodMessage += `❌ Không phù hợp với ${pet.name}\n`;
                            }
                            foodMessage += "\n";
                        });
                    }
                });
            
                if (pet) {
                    foodMessage += "\n💡 Thức ăn phù hợp với pet của bạn:\n";
                    const suitableFoods = Object.entries(PET_FOODS)
                        .filter(([_, info]) => 
                            Array.isArray(info.type) ? 
                            info.type.includes(pet.type) : 
                            info.type === pet.type
                        )
                        .map(([name, info]) => `${info.emoji} ${name}`)
                        .join(", ");
                    foodMessage += suitableFoods;
                }
            
                foodMessage += "\n\nMua thức ăn: .pet feed [tên thức ăn]";
                return api.sendMessage(foodMessage, threadID, messageID);
            }
            case "skill": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
            
                if (!target[1]) {
                    let skillMessage = `📖 DANH SÁCH KỸ NĂNG CỦA ${pet.name}\n`;
                    skillMessage += "───────────────\n\n";
                    
                    const petSkills = PET_SKILLS[pet.type];
                    for (const [skillId, skill] of Object.entries(petSkills)) {
                        const available = pet.level >= skill.minLevel;
                        const cooldownLeft = getTimeLeft(pet.lastSkill?.[skillId] || 0, skill.cooldown);
                        
                        skillMessage += `${available ? "✅" : "❌"} ${skill.name}\n`;
                        skillMessage += `› Mô tả: ${skill.description}\n`;
                        skillMessage += `› Yêu cầu: Level ${skill.minLevel}\n`;
                        skillMessage += `› Hồi chiêu: ${skill.cooldown/60000} phút\n`;
                        if (cooldownLeft > 0) {
                            skillMessage += `› Còn: ${Math.ceil(cooldownLeft/1000)} giây\n`;
                        }
                        skillMessage += "\n";
                    }
                    
                    skillMessage += "Sử dụng: .pet skill [tên kỹ năng]";
                    return api.sendMessage(skillMessage, threadID, messageID);
                }
            
                const skillName = target[1].toUpperCase();
                const skill = PET_SKILLS[pet.type][skillName];
                
                if (!skill) {
                    return api.sendMessage(
                        "❌ Kỹ năng không hợp lệ!\n" +
                        "Gõ .pet skill để xem danh sách kỹ năng", 
                        threadID, messageID
                    );
                }
            
                if (pet.level < skill.minLevel) {
                    return api.sendMessage(
                        `❌ Cần đạt level ${skill.minLevel} để sử dụng kỹ năng này!`,
                        threadID, messageID
                    );
                }
            
                const cooldownLeft = getTimeLeft(pet.lastSkill?.[skillName] || 0, skill.cooldown);
                if (cooldownLeft > 0) {
                    return api.sendMessage(
                        `⏳ Vui lòng đợi ${Math.ceil(cooldownLeft/1000)} giây nữa!`,
                        threadID, messageID
                    );
                }
            
                if (!pet.lastSkill) pet.lastSkill = {};
                
                const result = skill.effect(pet);
                pet.lastSkill[skillName] = Date.now();
                pet.exp += 5; 
                
                if (pet.exp >= 100 * pet.level) {
                    pet.level++;
                    pet.exp = 0;
                }
            
                savePetData(petData);
                return api.sendMessage(
                    `🎯 ${pet.name} sử dụng ${skill.name}!\n` +
                    `${result}\n` +
                    `⭐ +5 EXP (${pet.exp}/100)`,
                    threadID, messageID
                );
            }
            case "train": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
                if (pet.hunger <= 10) {
                    return api.sendMessage(
                        "❌ Thú cưng đang đói! Hãy cho ăn trước.",
                        threadID, messageID
                    );
                }
            
                if (pet.energy <= 10) {
                    return api.sendMessage(
                        "❌ Thú cưng đang mệt! Cần nghỉ ngơi.",
                        threadID, messageID
                    );
                }
            
                if (pet.happy <= 10) {
                    return api.sendMessage(
                        "❌ Thú cưng đang buồn! Hãy chơi với nó.",
                        threadID, messageID
                    );
                }
                if (!target[1]) {
                    let trainMessage = `🎯 HUẤN LUYỆN CHO ${pet.name}\n`;
                    trainMessage += "───────────────\n\n";
                    
                    const activities = TRAINING_ACTIVITIES[pet.type];
                    for (const [name, info] of Object.entries(activities)) {
                        trainMessage += `🔸 ${name}\n`;
                        trainMessage += `› Chi phí: ${info.cost}$\n`;
                        trainMessage += `› EXP: +${info.exp}\n`;
                        trainMessage += `› Sức mạnh: +${info.powerGain}\n`;
                        trainMessage += `› ${info.description}\n\n`;
                    }
                    
                    trainMessage += "Sử dụng: .pet train [tên hoạt động]";
                    return api.sendMessage(trainMessage, threadID, messageID);
                }
            
                const activity = target.slice(1).join(" ").toLowerCase();
                const trainingInfo = TRAINING_ACTIVITIES[pet.type][activity];
            
                if (!trainingInfo) {
                    return api.sendMessage(
                        "❌ Hoạt động huấn luyện không hợp lệ!\n" +
                        "Gõ .pet train để xem danh sách hoạt động", 
                        threadID, messageID
                    );
                }
            
                const trainCooldown = getTimeLeft(pet.lastTrain || 0, 300000); 
                if (trainCooldown > 0) {
                    return api.sendMessage(
                        `⏳ Thú cưng đang mệt, vui lòng đợi ${Math.ceil(trainCooldown/1000)} giây nữa!`,
                        threadID, messageID
                    );
                }
            
                if (pet.energy < 30) {
                    return api.sendMessage(
                        "❌ Thú cưng quá mệt để tập luyện! Hãy cho ăn để hồi phục năng lượng.",
                        threadID, messageID
                    );
                }
            
                const balance = await getBalance(senderID);
                if (balance < trainingInfo.cost) {
                    return api.sendMessage(
                        `❌ Bạn không đủ tiền! Cần ${trainingInfo.cost}$ để huấn luyện.`,
                        threadID, messageID
                    );
                }
            
                await updateBalance(senderID, -trainingInfo.cost);
                pet.power = (pet.power || 0) + trainingInfo.powerGain;
                pet.exp += trainingInfo.exp;
                pet.energy = Math.max(0, pet.energy - 30);
                pet.lastTrain = Date.now();
            
                if (pet.exp >= 100 * pet.level) {
                    pet.level++;
                    pet.exp = 0;
                }
            
                savePetData(petData);
                return api.sendMessage(
                    `🎯 ${pet.name} đã hoàn thành buổi huấn luyện ${activity}!\n\n` +
                    `💪 Sức mạnh +${trainingInfo.powerGain} (Tổng: ${pet.power})\n` +
                    `⭐ EXP +${trainingInfo.exp} (${pet.exp}/100)\n` +
                    `⚡ Năng lượng: ${createProgressBar(pet.energy, PET_TYPES[pet.type].maxEnergy)} (${pet.energy}%)\n` +
                    `📊 Level: ${pet.level}`,
                    threadID, messageID
                );
            }

            case "quest": {
                const pet = petData[senderID];
                if (!pet) {
                    return api.sendMessage("Bạn chưa có thú cưng!", threadID, messageID);
                }
            
                if (!pet.quests) {
                    pet.quests = {
                        daily: {},
                        achievements: {},
                        lastDaily: 0
                    };
                }
            
                const now = Date.now();
                const lastDaily = pet.quests.lastDaily || 0;
                if (now - lastDaily > 86400000) { 
                    pet.quests.daily = {};
                    pet.quests.lastDaily = now;
                }
            
                if (!target[1]) {
                    let questMessage = "📋 DANH SÁCH NHIỆM VỤ\n";
                    questMessage += "───────────────\n\n";
                    
                    questMessage += "🌅 NHIỆM VỤ HÀNG NGÀY:\n";
                    for (const [questId, quest] of Object.entries(QUEST_TYPES.DAILY)) {
                        const progress = pet.quests.daily[questId] || 0;
                        const completed = progress >= quest.requirement;
                        questMessage += `${completed ? "✅" : "❌"} ${quest.description}\n`;
                        questMessage += `› Tiến độ: z${progress}/${quest.requirement}\n`;
                        questMessage += `› Phần thưởng: ${quest.reward.exp} EXP, ${quest.reward.money}$\n\n`;
                    }
                    
                    questMessage += "🏆 THÀNH TỰU:\n";
                    for (const [achieveId, achieve] of Object.entries(QUEST_TYPES.ACHIEVEMENT)) {
                        const completed = achieve.condition(pet);
                        const claimed = pet.quests.achievements[achieveId];
                        questMessage += `${completed ? (claimed ? "✅" : "⭐") : "❌"} ${achieve.description}\n`;
                        if (!claimed) {
                            questMessage += `› Phần thưởng: ${achieve.reward.exp} EXP, ${achieve.reward.money}$\n`;
                            if (achieve.reward.title) questMessage += `› Danh hiệu: ${achieve.reward.title}\n`;
                        }
                        questMessage += "\n";
                    }
                    
                    questMessage += "💡 Sử dụng:\n";
                    questMessage += "• .pet quest claim [daily/achieve] - Nhận phần thưởng\n";
                    questMessage += "• .pet quest info - Xem chi tiết nhiệm vụ";
                    
                    return api.sendMessage(questMessage, threadID, messageID);
                }
            
                const subCommand = target[1].toLowerCase();
                
                if (subCommand === "claim") {
                    const questType = target[2]?.toLowerCase();
                    if (!questType || !["daily", "achieve"].includes(questType)) {
                        return api.sendMessage("❌ Vui lòng chọn loại phần thưởng (daily/achieve)!", threadID, messageID);
                    }
            
                    if (questType === "daily") {
                        let claimed = false;
                        let totalExp = 0;
                        let totalMoney = 0;
            
                        for (const [questId, quest] of Object.entries(QUEST_TYPES.DAILY)) {
                            const progress = pet.quests.daily[questId] || 0;
                            if (progress >= quest.requirement && !pet.quests.daily[`${questId}_claimed`]) {
                                claimed = true;
                                totalExp += quest.reward.exp;
                                totalMoney += quest.reward.money;
                                pet.quests.daily[`${questId}_claimed`] = true;
                            }
                        }
            
                        if (!claimed) {
                            return api.sendMessage("❌ Không có phần thưởng nào để nhận!", threadID, messageID);
                        }
            
                        pet.exp += totalExp;
                        await updateBalance(senderID, totalMoney);
            
                        if (pet.exp >= 100 * pet.level) {
                            pet.level++;
                            pet.exp = 0;
                        }
            
                        savePetData(petData);
                        return api.sendMessage(
                            `🎁 Nhận thưởng thành công!\n` +
                            `⭐ +${totalExp} EXP\n` +
                            `💰 +${totalMoney}$\n` +
                            `📊 Level: ${pet.level} (${pet.exp}/100)`,
                            threadID, messageID
                        );
                    }
            
                    if (questType === "achieve") {
                        let claimed = false;
                        let totalExp = 0;
                        let totalMoney = 0;
                        let titles = [];
            
                        for (const [achieveId, achieve] of Object.entries(QUEST_TYPES.ACHIEVEMENT)) {
                            if (achieve.condition(pet) && !pet.quests.achievements[achieveId]) {
                                claimed = true;
                                totalExp += achieve.reward.exp;
                                totalMoney += achieve.reward.money;
                                if (achieve.reward.title) titles.push(achieve.reward.title);
                                pet.quests.achievements[achieveId] = true;
                            }
                        }
            
                        if (!claimed) {
                            return api.sendMessage("❌ Không có thành tựu nào để nhận!", threadID, messageID);
                        }
            
                        pet.exp += totalExp;
                        await updateBalance(senderID, totalMoney);
            
                        if (pet.exp >= 100 * pet.level) {
                            pet.level++;
                            pet.exp = 0;
                        }
            
                        savePetData(petData);
                        let rewardMsg = `🏆 Nhận thưởng thành tựu!\n` +
                                       `⭐ +${totalExp} EXP\n` +
                                       `💰 +${totalMoney}$\n` +
                                       `📊 Level: ${pet.level} (${pet.exp}/100)`;
                        
                        if (titles.length > 0) {
                            rewardMsg += `\n🎗️ Danh hiệu mới: ${titles.join(", ")}`;
                        }
            
                        return api.sendMessage(rewardMsg, threadID, messageID);
                    }
                }
            
                return api.sendMessage("❌ Lệnh không hợp lệ! Gõ .pet quest để xem hướng dẫn.", threadID, messageID);
            }
        }
    }
};
