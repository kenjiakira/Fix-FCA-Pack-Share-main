const fs = require('fs');
const path = require('path');
const { getBalance, updateBalance } = require('../utils/currencies');
const { getVIPBenefits } = require('../game/vip/vipCheck');

const PET_DATA_PATH = path.join(__dirname, '../database/json/pet');

if (!fs.existsSync(PET_DATA_PATH)) {
  fs.mkdirSync(PET_DATA_PATH, { recursive: true });
}

const PET_TYPES = {
  DOG: {
    id: 'dog',
    name: 'Chó',
    emoji: '🐕',
    baseStats: { hunger: 100, mood: 100, energy: 100, health: 100 },
    breedVariants: {
      COMMON: { id: 'husky', name: 'Husky', rarity: 'common', price: 5000, imageUrl: 'husky.png' },
      UNCOMMON: { id: 'golden', name: 'Golden Retriever', rarity: 'uncommon', price: 10000, imageUrl: 'golden.png' },
      RARE: { id: 'corgi', name: 'Corgi', rarity: 'rare', price: 20000, imageUrl: 'corgi.png' },
      EPIC: { id: 'shiba', name: 'Shiba Inu', rarity: 'epic', price: 50000, imageUrl: 'shiba.png' }
    },
    skills: {
      GUARD: { id: 'guard', name: 'Bảo vệ', effect: 'Tăng 20% tiền từ Daily Bonus' },
      FETCH: { id: 'fetch', name: 'Tìm kiếm', effect: 'Có cơ hội tìm thấy vật phẩm khi đi dạo' }
    }
  },
  CAT: {
    id: 'cat',
    name: 'Mèo',
    emoji: '🐈',
    baseStats: { hunger: 100, mood: 100, energy: 100, health: 100 },
    breedVariants: {
      COMMON: { id: 'tabby', name: 'Mèo Tabby', rarity: 'common', price: 5000, imageUrl: 'tabby.png' },
      UNCOMMON: { id: 'siamese', name: 'Mèo Siamese', rarity: 'uncommon', price: 12000, imageUrl: 'siamese.png' },
      RARE: { id: 'persian', name: 'Mèo Persian', rarity: 'rare', price: 25000, imageUrl: 'persian.png' },
      EPIC: { id: 'sphynx', name: 'Mèo Sphynx', rarity: 'epic', price: 60000, imageUrl: 'sphynx.png' }
    },
    skills: {
      HUNT: { id: 'hunt', name: 'Săn bắt', effect: 'Tăng 15% cơ hội cá hiếm khi câu cá' },
      CHARM: { id: 'charm', name: 'Quyến rũ', effect: 'Giảm 10% giá vật phẩm khi mua sắm' }
    }
  },
  BIRD: {
    id: 'bird',
    name: 'Chim',
    emoji: '🦜',
    baseStats: { hunger: 100, mood: 100, energy: 100, health: 100 },
    breedVariants: {
      COMMON: { id: 'sparrow', name: 'Chim Sẻ', rarity: 'common', price: 3000, imageUrl: 'sparrow.png' },
      UNCOMMON: { id: 'parrot', name: 'Vẹt', rarity: 'uncommon', price: 8000, imageUrl: 'parrot.png' },
      RARE: { id: 'falcon', name: 'Chim Ưng', rarity: 'rare', price: 18000, imageUrl: 'falcon.png' },
      EPIC: { id: 'phoenix', name: 'Phượng Hoàng', rarity: 'epic', price: 70000, imageUrl: 'phoenix.png' }
    },
    skills: {
      SCOUT: { id: 'scout', name: 'Trinh sát', effect: 'Tăng 25% XP khi làm nhiệm vụ' },
      MESSENGER: { id: 'messenger', name: 'Đưa thư', effect: 'Nhận tin nhắn hệ thống về sự kiện đặc biệt' }
    }
  }
};


const PET_ITEMS = {
  FOODS: {
    basic_food: { id: 'basic_food', name: 'Thức ăn cơ bản', price: 50, effect: { hunger: 10 }, emoji: '🍗' },
    premium_food: { id: 'premium_food', name: 'Thức ăn cao cấp', price: 200, effect: { hunger: 25, health: 5 }, emoji: '🍖' },
    gourmet_food: { id: 'gourmet_food', name: 'Thức ăn đặc biệt', price: 500, effect: { hunger: 50, health: 15, mood: 10 }, emoji: '🥩' }
  },
  TOYS: {
    ball: { id: 'ball', name: 'Bóng', price: 100, effect: { mood: 15, energy: -5 }, emoji: '⚽' },
    plush: { id: 'plush', name: 'Thú nhồi bông', price: 250, effect: { mood: 25 }, emoji: '🧸' },
    robot: { id: 'robot', name: 'Robot đồ chơi', price: 800, effect: { mood: 40, energy: -10 }, emoji: '🤖' }
  },
  MEDICINE: {
    basic_medicine: { id: 'basic_medicine', name: 'Thuốc cơ bản', price: 300, effect: { health: 20 }, emoji: '💊' },
    advanced_medicine: { id: 'advanced_medicine', name: 'Thuốc cao cấp', price: 1000, effect: { health: 50 }, emoji: '💉' }
  },
  ACCESSORIES: {
    collar: { id: 'collar', name: 'Vòng cổ', price: 500, effect: { mood: 5 }, special: 'Tăng 5% EXP', emoji: '📿' },
    sunglasses: { id: 'sunglasses', name: 'Kính mát', price: 1000, effect: { mood: 10 }, special: 'Tăng 5% tiền thưởng', emoji: '🕶️' },
    crown: { id: 'crown', name: 'Vương miện', price: 5000, effect: { mood: 20 }, special: 'Tăng 15% tổng stat', emoji: '👑' }
  }
};


const VIP_PET_BENEFITS = {
  1: { 
    statDecayReduction: 0.1, 
    itemDiscounts: 0.05,     
    expBonus: 0.1,           
    exclusivePets: false,
    maxPets: 2               
  },
  2: { 
    statDecayReduction: 0.2, 
    itemDiscounts: 0.1,      
    expBonus: 0.2,           
    exclusivePets: false,
    maxPets: 3               
  },
  3: { 
    statDecayReduction: 0.3, 
    itemDiscounts: 0.15,     
    expBonus: 0.3,           
    exclusivePets: true,     
    maxPets: 5               
  }
};


const DEFAULT_PET_SETTINGS = {
  statDecayReduction: 0,
  itemDiscounts: 0,
  expBonus: 0,
  exclusivePets: false,
  maxPets: 1  
};


const PET_LEVELS = {
  expToLevelUp: (level) => level * 100,
  maxLevel: 50,
  statBonusPerLevel: 2
};


const PET_ACTIVITIES = {
  WALK: {
    name: 'Đi dạo',
    cooldown: 30 * 60 * 1000, 
    rewards: {
      exp: { min: 10, max: 20 },
      mood: { min: 10, max: 20 },
      energy: { min: -15, max: -5 }
    },
    vipReduction: { 1: 0.1, 2: 0.2, 3: 0.3 } 
  },
  TRAIN: {
    name: 'Huấn luyện',
    cooldown: 60 * 60 * 1000, 
    rewards: {
      exp: { min: 20, max: 40 },
      mood: { min: -10, max: 0 },
      energy: { min: -25, max: -15 }
    },
    vipReduction: { 1: 0.1, 2: 0.2, 3: 0.3 }
  },
  COMPETE: {
    name: 'Thi đấu',
    cooldown: 3 * 60 * 60 * 1000, 
    minLevel: 5,
    rewards: {
      exp: { min: 50, max: 100 },
      mood: { min: -20, max: 20 },
      energy: { min: -50, max: -30 },
      money: { min: 500, max: 5000 }
    },
    vipReduction: { 1: 0.1, 2: 0.2, 3: 0.3 }
  }
};


function loadUserPets(userId) {
  const filePath = path.join(PET_DATA_PATH, `${userId}.json`);
  if (!fs.existsSync(filePath)) {
    return { pets: [], lastUpdate: Date.now(), inventory: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveUserPets(userId, petData) {
  const filePath = path.join(PET_DATA_PATH, `${userId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(petData, null, 2));
}

async function getPetBenefits(userId) {
  try {
    const vipBenefits = await getVIPBenefits(userId);

    
    
    const vipLevel = vipBenefits?.packageId || 0;

    
    let benefits = DEFAULT_PET_SETTINGS;

    if (vipLevel > 0 && VIP_PET_BENEFITS[vipLevel]) {
      benefits = {
        ...VIP_PET_BENEFITS[vipLevel],
        packageId: vipLevel  
      };
    }

    return benefits;
  } catch (error) {
    console.error("Lỗi khi lấy quyền lợi VIP cho Pet:", error);
    return { ...DEFAULT_PET_SETTINGS, packageId: 0 };
  }
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function calculateStatDecay(lastUpdate, currentBenefits) {
  const now = Date.now();
  const hoursPassed = (now - lastUpdate) / (60 * 60 * 1000);

  
  const baseDecay = 5;

  
  const reducedDecay = baseDecay * (1 - currentBenefits.statDecayReduction);

  return Math.min(100, Math.floor(reducedDecay * hoursPassed));
}

function updatePetStats(pet, lastUpdate, currentBenefits) {
  const decay = calculateStatDecay(lastUpdate, currentBenefits);

  
  pet.stats.hunger = Math.max(0, pet.stats.hunger - decay);
  pet.stats.mood = Math.max(0, pet.stats.mood - decay);
  pet.stats.energy = Math.max(0, pet.stats.energy - decay * 0.7); 

  
  if (pet.stats.hunger < 30 || pet.stats.mood < 30) {
    pet.stats.health = Math.max(0, pet.stats.health - decay * 0.5);
  }

  return pet;
}

function calculateItemPrice(item, currentBenefits) {
  return Math.round(item.price * (1 - currentBenefits.itemDiscounts));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function createNewPet(type, breed, name) {
  const petType = PET_TYPES[type.toUpperCase()];
  const breedInfo = petType.breedVariants[breed.toUpperCase()];

  return {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    name: name,
    type: petType.id,
    breed: breedInfo.id,
    breedName: breedInfo.name,
    rarity: breedInfo.rarity,
    emoji: petType.emoji,
    level: 1,
    exp: 0,
    expToNext: PET_LEVELS.expToLevelUp(1),
    stats: { ...petType.baseStats },
    skills: [],
    equipped: {
      accessory: null
    },
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    createdAt: Date.now(),
    activities: {
      WALK: { lastUsed: 0 },
      TRAIN: { lastUsed: 0 },
      COMPETE: { lastUsed: 0 }
    }
  };
}


function formatPetInfo(pet, benefits) {
  const { hunger, mood, energy, health } = pet.stats;
  const statEmojis = {
    hunger: hunger > 70 ? '🟢' : hunger > 30 ? '🟡' : '🔴',
    mood: mood > 70 ? '🟢' : mood > 30 ? '🟡' : '🔴',
    energy: energy > 70 ? '🟢' : energy > 30 ? '🟡' : '🔴',
    health: health > 70 ? '🟢' : health > 30 ? '🟡' : '🔴'
  };

  const rarityStars = {
    'common': '⭐',
    'uncommon': '⭐⭐',
    'rare': '⭐⭐⭐',
    'epic': '⭐⭐⭐⭐',
    'legendary': '⭐⭐⭐⭐⭐'
  };

  let status = 'Khỏe mạnh';
  if (health < 30) status = 'Bệnh';
  else if (hunger < 30) status = 'Đói';
  else if (mood < 30) status = 'Buồn';
  else if (energy < 30) status = 'Mệt mỏi';

  return `🧩 Thông tin thú cưng 🧩
┏━━━━━━━━━━━━━━━┓
┣ Tên: ${pet.name} ${pet.emoji}
┣ Loại: ${PET_TYPES[pet.type.toUpperCase()]?.name} - ${pet.breedName}
┣ Hiếm: ${rarityStars[pet.rarity] || '⭐'}
┣ Level: ${pet.level} (${pet.exp}/${pet.expToNext} EXP)
┣ Trạng thái: ${status}
┣━━━━━━━━━━━━━━━┫
┣ Chỉ số:
┣ ${statEmojis.hunger} Đói: ${hunger}/100
┣ ${statEmojis.mood} Tâm trạng: ${mood}/100
┣ ${statEmojis.energy} Năng lượng: ${energy}/100
┣ ${statEmojis.health} Sức khỏe: ${health}/100
┣━━━━━━━━━━━━━━━┫
┣ Kỹ năng: ${pet.skills.length > 0 ?
      pet.skills.map(s => `${s.name} (${s.level})`).join(', ') :
      'Chưa có kỹ năng'}
┣ Phụ kiện: ${pet.equipped.accessory ?
      PET_ITEMS.ACCESSORIES[pet.equipped.accessory].name :
      'Không có'}
┗━━━━━━━━━━━━━━━┛`;
}


function addPetExperience(pet, expAmount, benefits) {
  
  const finalExp = Math.round(expAmount * (1 + benefits.expBonus));
  pet.exp += finalExp;

  
  let message = `+${finalExp} kinh nghiệm!`;
  let leveledUp = false;

  while (pet.exp >= pet.expToNext && pet.level < PET_LEVELS.maxLevel) {
    pet.level++;
    pet.exp -= pet.expToNext;
    pet.expToNext = PET_LEVELS.expToLevelUp(pet.level);
    leveledUp = true;

    
    Object.keys(pet.stats).forEach(stat => {
      pet.stats[stat] = Math.min(100, pet.stats[stat] + PET_LEVELS.statBonusPerLevel);
    });

    
    if (pet.level % 5 === 0 && pet.skills.length < 3) {
      const petType = PET_TYPES[pet.type.toUpperCase()];
      const availableSkills = Object.values(petType.skills);

      
      const newSkills = availableSkills.filter(skill =>
        !pet.skills.some(s => s.id === skill.id)
      );

      if (newSkills.length > 0) {
        const newSkill = newSkills[Math.floor(Math.random() * newSkills.length)];
        pet.skills.push({
          id: newSkill.id,
          name: newSkill.name,
          effect: newSkill.effect,
          level: 1
        });

        message += `\n🎯 Đã mở khóa kỹ năng mới: ${newSkill.name}!`;
      }
    }
  }

  if (leveledUp) {
    message += `\n🎉 LEVEL UP! Thú cưng của bạn đã đạt level ${pet.level}!`;
  }

  return { pet, message };
}

async function petActivity(userId, petId, activityType) {
  const userData = loadUserPets(userId);
  const petIndex = userData.pets.findIndex(p => p.id === petId);

  if (petIndex === -1) {
    return { success: false, message: '❌ Không tìm thấy thú cưng.' };
  }

  
  const benefits = await getPetBenefits(userId);
  const vipLevel = benefits.packageId || 0;

  userData.pets[petIndex] = updatePetStats(userData.pets[petIndex], userData.lastUpdate, benefits);

  const pet = userData.pets[petIndex];
  const activity = PET_ACTIVITIES[activityType];

  if (!activity) {
    return { success: false, message: '❌ Hoạt động không hợp lệ.' };
  }

  
  const lastUsed = pet.activities[activityType]?.lastUsed || 0;
  const cooldownReduction = activity.vipReduction[vipLevel] || 0;
  const reducedCooldown = activity.cooldown * (1 - cooldownReduction);

  const cooldownRemaining = (lastUsed + reducedCooldown) - Date.now();
  if (cooldownRemaining > 0) {
    return {
      success: false,
      message: `⏳ Thú cưng cần nghỉ ngơi. Có thể ${activity.name} lại sau ${formatTime(cooldownRemaining)}.`
    };
  }

  if (activity.minLevel && pet.level < activity.minLevel) {
    return {
      success: false,
      message: `❌ Thú cưng cần đạt level ${activity.minLevel} để có thể ${activity.name}.`
    };
  }

  if (pet.stats.energy < 20) {
    return {
      success: false,
      message: '❌ Thú cưng quá mệt mỏi để thực hiện hoạt động này. Hãy cho nghỉ ngơi.'
    };
  }

  const rewards = {
    exp: getRandomInt(activity.rewards.exp.min, activity.rewards.exp.max),
    mood: getRandomInt(activity.rewards.mood.min, activity.rewards.mood.max),
    energy: getRandomInt(activity.rewards.energy.min, activity.rewards.energy.max)
  };

  let moneyReward = 0;
  if (activity.rewards.money) {
    moneyReward = getRandomInt(activity.rewards.money.min, activity.rewards.money.max);

    if (vipLevel > 0) {
      moneyReward = Math.floor(moneyReward * (1 + vipLevel * 0.1));
    }
  }

  pet.stats.mood = Math.min(100, Math.max(0, pet.stats.mood + rewards.mood));
  pet.stats.energy = Math.min(100, Math.max(0, pet.stats.energy + rewards.energy));

  const expResult = addPetExperience(pet, rewards.exp, benefits);
  pet = expResult.pet;

  pet.activities[activityType] = { lastUsed: Date.now() };

  userData.pets[petIndex] = pet;
  userData.lastUpdate = Date.now();
  saveUserPets(userId, userData);

  if (moneyReward > 0) {
    updateBalance(userId, moneyReward);
  }

  let message = `🎮 ${activity.name} thành công!\n${expResult.message}\n`;

  if (rewards.mood > 0) {
    message += `\n😊 Tâm trạng +${rewards.mood}`;
  } else if (rewards.mood < 0) {
    message += `\n😔 Tâm trạng ${rewards.mood}`;
  }

  if (rewards.energy < 0) {
    message += `\n⚡ Năng lượng ${rewards.energy}`;
  }

  if (moneyReward > 0) {
    message += `\n💰 Nhận được ${moneyReward} xu!`;
  }

  
  if (Math.random() < 0.2) { 
    const petSkills = pet.skills.map(s => s.id);

    if (activityType === 'WALK' && petSkills.includes('fetch')) {
      const randomItem = Math.random() < 0.5 ? 'basic_food' : 'ball';

      
      userData.inventory[randomItem] = (userData.inventory[randomItem] || 0) + 1;
      saveUserPets(userId, userData);

      const itemName = PET_ITEMS.FOODS[randomItem]?.name || PET_ITEMS.TOYS[randomItem]?.name;
      message += `\n\n🎁 Thú cưng đã tìm thấy: ${itemName}!`;
    }
  }

  return { success: true, message };
}


module.exports = {
  name: "pet",
  dev: "HNT",
  category: "Games",
  onPrefix: true,
  usages: ".pet [mua/info/feed/play/train/shop/inventory]\n",
  info: "Hệ thống nuôi thú cưng",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const userId = senderID;

    const benefits = await getPetBenefits(userId);

    if (!target[0]) {
      return api.sendMessage(
        `🐾 HỆ THỐNG THÚ CƯNG 🐾\n\n` +
        `❯ .pet shop - Xem cửa hàng thú cưng\n` +
        `❯ .pet mua [giống] [tên] - Mua thú cưng\n` +
        `❯ .pet info - Xem thông tin thú cưng\n` +
        `❯ .pet feed - Cho thú cưng ăn\n` +
        `❯ .pet play - Chơi với thú cưng\n` +
        `❯ .pet walk - Đi dạo với thú cưng\n` +
        `❯ .pet train - Huấn luyện thú cưng\n` +
        `❯ .pet compete - Tham gia thi đấu\n` +
        `❯ .pet item - Quản lý vật phẩm\n` +
        `❯ .pet rename [tên mới] - Đổi tên thú cưng\n\n` +
        `👑 VIP: ${benefits.packageId > 0 ?
          `Level ${benefits.packageId} - Tối đa ${benefits.maxPets} thú cưng, +${Math.round(benefits.expBonus * 100)}% EXP` :
          'Chưa kích hoạt - Giới hạn 1 thú cưng'}\n` +
        `📌 Dùng .vip để nâng cấp và mở khóa đặc quyền!`,
        threadID, messageID
      );
    }

    const command = target[0].toLowerCase();

    const userData = loadUserPets(userId);

    if (userData.pets.length > 0) {
      userData.pets = userData.pets.map(pet =>
        updatePetStats(pet, userData.lastUpdate || Date.now(), benefits)
      );
      userData.lastUpdate = Date.now();
      saveUserPets(userId, userData);
    }

    switch (command) {
      case "shop":
        
        let shopMessage = `🏪 CỬA HÀNG THÚ CƯNG 🏪\n\n`;

        
        shopMessage += `🐾 CÁC LOẠI THÚ CƯNG:\n`;

        for (const [typeKey, typeInfo] of Object.entries(PET_TYPES)) {
          shopMessage += `\n${typeInfo.emoji} ${typeInfo.name}:\n`;

          for (const [breedKey, breedInfo] of Object.entries(typeInfo.breedVariants)) {
            if (breedInfo.rarity === 'legendary' && !benefits.exclusivePets) {
              shopMessage += `- 👑 ${breedInfo.name}: ${breedInfo.price.toLocaleString()}$ (Chỉ VIP GOLD)\n`;
            } else {
              shopMessage += `- ${breedInfo.name}: ${breedInfo.price.toLocaleString()}$\n`;
            }
          }
        }

        
        shopMessage += `\n🛒 VẬT PHẨM:\n`;

        
        shopMessage += `\n🍖 Thức ăn:\n`;
        for (const [itemKey, item] of Object.entries(PET_ITEMS.FOODS)) {
          const price = calculateItemPrice(item, benefits);
          shopMessage += `- ${item.emoji} ${item.name}: ${price.toLocaleString()}$ ${benefits.itemDiscounts > 0 ? '(Giảm giá VIP)' : ''}\n`;
        }

        
        shopMessage += `\n🧸 Đồ chơi:\n`;
        for (const [itemKey, item] of Object.entries(PET_ITEMS.TOYS)) {
          const price = calculateItemPrice(item, benefits);
          shopMessage += `- ${item.emoji} ${item.name}: ${price.toLocaleString()}$ ${benefits.itemDiscounts > 0 ? '(Giảm giá VIP)' : ''}\n`;
        }

        
        shopMessage += `\n💊 Thuốc & Phụ kiện:\n`;
        for (const [itemKey, item] of Object.entries(PET_ITEMS.MEDICINE)) {
          const price = calculateItemPrice(item, benefits);
          shopMessage += `- ${item.emoji} ${item.name}: ${price.toLocaleString()}$ ${benefits.itemDiscounts > 0 ? '(Giảm giá VIP)' : ''}\n`;
        }

        for (const [itemKey, item] of Object.entries(PET_ITEMS.ACCESSORIES)) {
          const price = calculateItemPrice(item, benefits);
          shopMessage += `- ${item.emoji} ${item.name}: ${price.toLocaleString()}$ ${benefits.itemDiscounts > 0 ? '(Giảm giá VIP)' : ''}\n`;
        }

        shopMessage += `\n💡 Để mua thú cưng: .pet mua [loại] [giống] [tên]\n`;
        shopMessage += `💡 Để mua vật phẩm: .pet item mua [tên vật phẩm] [số lượng]`;

        return api.sendMessage(shopMessage, threadID, messageID);

      case "mua":
        
        const breedInput = target[1]?.toLowerCase();
        const petName = target.slice(2).join(' ');

        if (!breedInput || !petName) {
          return api.sendMessage(
            `❌ Vui lòng nhập đầy đủ: .pet mua [loại/giống] [tên]\n` +
            `📌 Ví dụ:\n- .pet mua husky Lucky\n- .pet mua chó Lucky (sẽ chọn ngẫu nhiên 1 giống chó)\n` +
            `📌 Các loại thú: chó, mèo, chim\n` +
            `📌 Các giống: husky, golden, corgi, shiba, tabby, siamese, persian, sphynx, sparrow, parrot, falcon, phoenix`,
            threadID, messageID
          );
        }

        
        if (userData.pets.length >= benefits.maxPets) {
          return api.sendMessage(
            `❌ Bạn đã đạt giới hạn số lượng thú cưng (${benefits.maxPets}).\n` +
            `👑 Nâng cấp VIP để nuôi nhiều thú cưng hơn!`,
            threadID, messageID
          );
        }

        
        const petTypeMap = {
          "chó": "DOG",
          "mèo": "CAT",
          "chim": "BIRD",
          "dog": "DOG",
          "cat": "CAT",
          "bird": "BIRD"
        };

        if (petTypeMap[breedInput]) {
          
          const petType = petTypeMap[breedInput];
          const breedVariants = Object.keys(PET_TYPES[petType].breedVariants);

          
          const eligibleBreeds = breedVariants.filter(breed => {
            const breedInfo = PET_TYPES[petType].breedVariants[breed];
            return !(breedInfo.rarity === 'legendary' && !benefits.exclusivePets);
          });

          if (eligibleBreeds.length === 0) {
            return api.sendMessage(
              `❌ Không có giống ${PET_TYPES[petType].name} nào phù hợp với bạn.\n` +
              `👑 Nâng cấp VIP để mở khóa các giống hiếm!`,
              threadID, messageID
            );
          }

          
          const randomBreed = eligibleBreeds[Math.floor(Math.random() * eligibleBreeds.length)];
          const breedInfo = PET_TYPES[petType].breedVariants[randomBreed];

          
          const petPrice = breedInfo.price;
          const balance = getBalance(userId);

          if (balance < petPrice) {
            return api.sendMessage(
              `❌ Không đủ tiền! Bạn cần ${petPrice.toLocaleString()}$, hiện có ${balance.toLocaleString()}$.`,
              threadID, messageID
            );
          }

          
          const newPet = createNewPet(petType, randomBreed, petName);

          
          updateBalance(userId, -petPrice);

          
          userData.pets.push(newPet);
          userData.lastUpdate = Date.now();
          saveUserPets(userId, userData);

          
          const rarityStars = {
            'common': '⭐',
            'uncommon': '⭐⭐',
            'rare': '⭐⭐⭐',
            'epic': '⭐⭐⭐⭐',
            'legendary': '⭐⭐⭐⭐⭐'
          };

          return api.sendMessage(
            `🎉 Chúc mừng! Bạn đã mua ${newPet.emoji} ${newPet.breedName} với giá ${petPrice.toLocaleString()}$!\n\n` +
            `Tên: ${newPet.name}\n` +
            `Loại: ${PET_TYPES[petType].name}\n` +
            `Giống: ${newPet.breedName}\n` +
            `Hiếm: ${rarityStars[breedInfo.rarity] || '⭐'}\n\n` +
            `💡 Dùng .pet info để xem thông tin chi tiết.`,
            threadID, messageID
          );
        }

        
        let matchingBreed = null;
        let matchingType = null;
        let breedInfo = null;

        for (const [typeKey, typeInfo] of Object.entries(PET_TYPES)) {
          for (const [breedKey, breed] of Object.entries(typeInfo.breedVariants)) {
            if (breed.id === breedInput || breed.name.toLowerCase().includes(breedInput)) {
              matchingBreed = breedKey;
              matchingType = typeKey;
              breedInfo = breed;
              break;
            }
          }
          if (matchingBreed) break;
        }

        if (!matchingBreed) {
          let allBreeds = [];
          for (const [typeKey, typeInfo] of Object.entries(PET_TYPES)) {
            for (const [breedKey, breed] of Object.entries(typeInfo.breedVariants)) {
              allBreeds.push(`${breed.emoji} ${breed.name} (${breed.id})`);
            }
          }

          return api.sendMessage(
            `❌ Không tìm thấy giống thú cưng: "${breedInput}"\n` +
            `💡 Các giống thú cưng có sẵn:\n${allBreeds.join('\n')}\n\n` +
            `💡 Hoặc bạn có thể dùng: .pet mua [loại] [tên]\n` +
            `📌 Các loại: chó, mèo, chim`,
            threadID, messageID
          );
        }

        
        const selectedType = PET_TYPES[matchingType];

        
        if (breedInfo.rarity === 'legendary' && !benefits.exclusivePets) {
          return api.sendMessage(
            `👑 Thú cưng hiếm này chỉ dành cho VIP GOLD trở lên.\n` +
            `Dùng .vip để nâng cấp và mở khóa!`,
            threadID, messageID
          );
        }

        
        const petPrice = breedInfo.price;
        const balance = getBalance(userId);

        if (balance < petPrice) {
          return api.sendMessage(
            `❌ Không đủ tiền! Bạn cần ${petPrice.toLocaleString()}$, hiện có ${balance.toLocaleString()}$.`,
            threadID, messageID
          );
        }

        
        const newPet = createNewPet(matchingType, matchingBreed, petName);

        
        updateBalance(userId, -petPrice);

        
        userData.pets.push(newPet);
        userData.lastUpdate = Date.now();
        saveUserPets(userId, userData);

        
        const rarityStars = {
          'common': '⭐',
          'uncommon': '⭐⭐',
          'rare': '⭐⭐⭐',
          'epic': '⭐⭐⭐⭐',
          'legendary': '⭐⭐⭐⭐⭐'
        };

        return api.sendMessage(
          `🎉 Chúc mừng! Bạn đã mua ${newPet.emoji} ${newPet.breedName} với giá ${petPrice.toLocaleString()}$!\n\n` +
          `Tên: ${newPet.name}\n` +
          `Loại: ${selectedType.name}\n` +
          `Giống: ${newPet.breedName}\n` +
          `Hiếm: ${rarityStars[breedInfo.rarity] || '⭐'}\n\n` +
          `💡 Dùng .pet info để xem thông tin chi tiết.`,
          threadID, messageID
        );

      case "info":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(
            `❌ Bạn chưa có thú cưng nào.\n` +
            `💡 Dùng .pet shop để xem danh sách thú cưng có thể mua.`,
            threadID, messageID
          );
        }

        
        const petIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(petIndex) || petIndex < 0 || petIndex >= userData.pets.length) {
          if (userData.pets.length === 1) {
            return api.sendMessage(formatPetInfo(userData.pets[0], benefits), threadID, messageID);
          } else {
            let petList = `🐾 Danh sách thú cưng (${userData.pets.length}/${benefits.maxPets}):\n\n`;
            userData.pets.forEach((pet, idx) => {
              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Lv.${pet.level})\n`;
            });
            petList += `\n💡 Dùng .pet info [số thứ tự] để xem chi tiết.`;
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        return api.sendMessage(formatPetInfo(userData.pets[petIndex], benefits), threadID, messageID);

      case "feed":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        
        const feedPetIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(feedPetIndex) || feedPetIndex < 0 || feedPetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Bạn có nhiều thú cưng, chọn một để cho ăn:\n\n`;
            userData.pets.forEach((pet, idx) => {
              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Đói: ${pet.stats.hunger}/100)\n`;
            });
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const pet = userData.pets[feedPetIndex || 0];

        
        const hasFood = Object.entries(userData.inventory || {})
          .filter(([itemId, count]) =>
            itemId in PET_ITEMS.FOODS && count > 0
          );

        if (hasFood.length === 0) {
          return api.sendMessage(
            `❌ Bạn không có thức ăn nào trong túi đồ.\n` +
            `💡 Dùng .pet item mua basic_food để mua thức ăn.`,
            threadID, messageID
          );
        }

        
        const foodId = target[2] || hasFood[0][0];

        if (!foodId || !(foodId in PET_ITEMS.FOODS) || !userData.inventory[foodId]) {
          let foodList = `🍖 Chọn thức ăn từ túi đồ:\n\n`;
          hasFood.forEach(([itemId, count]) => {
            const food = PET_ITEMS.FOODS[itemId];
            foodList += `- ${food.emoji} ${food.name} (${count})\n`;
          });
          foodList += `\n💡 Dùng .pet feed [số thú] [id_thức_ăn]`;
          return api.sendMessage(foodList, threadID, messageID);
        }

        
        const food = PET_ITEMS.FOODS[foodId];

        
        if (food.effect.hunger) {
          pet.stats.hunger = Math.min(100, pet.stats.hunger + food.effect.hunger);
        }
        if (food.effect.health) {
          pet.stats.health = Math.min(100, pet.stats.health + food.effect.health);
        }
        if (food.effect.mood) {
          pet.stats.mood = Math.min(100, pet.stats.mood + food.effect.mood);
        }

        
        userData.inventory[foodId]--;
        if (userData.inventory[foodId] <= 0) {
          delete userData.inventory[foodId];
        }

        
        const expResult = addPetExperience(pet, 5, benefits);
        userData.pets[feedPetIndex || 0] = expResult.pet;

        
        userData.lastUpdate = Date.now();
        saveUserPets(userId, userData);

        return api.sendMessage(
          `🍖 Đã cho ${pet.name} ăn ${food.emoji} ${food.name}!\n\n` +
          `Đói: +${food.effect.hunger || 0} (${pet.stats.hunger}/100)\n` +
          (food.effect.health ? `Sức khỏe: +${food.effect.health} (${pet.stats.health}/100)\n` : '') +
          (food.effect.mood ? `Tâm trạng: +${food.effect.mood} (${pet.stats.mood}/100)\n` : '') +
          `${expResult.message}`,
          threadID, messageID
        );

      case "play":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        
        const playPetIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(playPetIndex) || playPetIndex < 0 || playPetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Chọn thú cưng để chơi cùng:\n\n`;
            userData.pets.forEach((pet, idx) => {
              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Tâm trạng: ${pet.stats.mood}/100)\n`;
            });
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const playPet = userData.pets[playPetIndex || 0];

        
        const hasToys = Object.entries(userData.inventory || {})
          .filter(([itemId, count]) =>
            itemId in PET_ITEMS.TOYS && count > 0
          );

        if (hasToys.length === 0) {
          
          playPet.stats.mood = Math.min(100, playPet.stats.mood + 10);
          playPet.stats.energy = Math.max(0, playPet.stats.energy - 5);

          
          const playExpResult = addPetExperience(playPet, 10, benefits);
          userData.pets[playPetIndex || 0] = playExpResult.pet;

          
          userData.lastUpdate = Date.now();
          saveUserPets(userId, userData);

          return api.sendMessage(
            `🎮 Bạn đã chơi với ${playPet.name}!\n\n` +
            `Tâm trạng: +10 (${playPet.stats.mood}/100)\n` +
            `Năng lượng: -5 (${playPet.stats.energy}/100)\n` +
            `${playExpResult.message}\n\n` +
            `💡 Mua đồ chơi để tăng hiệu quả khi chơi.`,
            threadID, messageID
          );
        }

        
        const toyId = target[2] || hasToys[0][0];

        if (!toyId || !(toyId in PET_ITEMS.TOYS) || !userData.inventory[toyId]) {
          let toyList = `🧸 Chọn đồ chơi từ túi đồ:\n\n`;
          hasToys.forEach(([itemId, count]) => {
            const toy = PET_ITEMS.TOYS[itemId];
            toyList += `- ${toy.emoji} ${toy.name} (${count})\n`;
          });
          toyList += `\n💡 Dùng .pet play [số thú] [id_đồ_chơi]`;
          return api.sendMessage(toyList, threadID, messageID);
        }

        
        const toy = PET_ITEMS.TOYS[toyId];

        
        if (toy.effect.mood) {
          playPet.stats.mood = Math.min(100, playPet.stats.mood + toy.effect.mood);
        }
        if (toy.effect.energy) {
          playPet.stats.energy = Math.max(0, playPet.stats.energy + toy.effect.energy);
        }

        
        const toyExpResult = addPetExperience(playPet, 15, benefits);
        userData.pets[playPetIndex || 0] = toyExpResult.pet;

        
        userData.lastUpdate = Date.now();
        saveUserPets(userId, userData);

        return api.sendMessage(
          `🎮 Bạn đã chơi với ${playPet.name} bằng ${toy.emoji} ${toy.name}!\n\n` +
          `Tâm trạng: +${toy.effect.mood || 0} (${playPet.stats.mood}/100)\n` +
          (toy.effect.energy ? `Năng lượng: ${toy.effect.energy} (${playPet.stats.energy}/100)\n` : '') +
          `${toyExpResult.message}`,
          threadID, messageID
        );

      case "walk":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        
        const walkPetIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(walkPetIndex) || walkPetIndex < 0 || walkPetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Chọn thú cưng để đi dạo cùng:\n\n`;
            userData.pets.forEach((pet, idx) => {
              const lastUsed = pet.activities?.WALK?.lastUsed || 0;
              const cooldownReduction = PET_ACTIVITIES.WALK.vipReduction[benefits.packageId] || 0;
              const reducedCooldown = PET_ACTIVITIES.WALK.cooldown * (1 - cooldownReduction);
              const cooldownRemaining = (lastUsed + reducedCooldown) - Date.now();

              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Lv.${pet.level}) - ${cooldownRemaining > 0 ? `⏳ Còn ${formatTime(cooldownRemaining)}` : '✅ Sẵn sàng'
                }\n`;
            });
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const walkPet = userData.pets[walkPetIndex || 0];
        const walkResult = await petActivity(userId, walkPet.id, 'WALK');

        return api.sendMessage(walkResult.message, threadID, messageID);

      case "train":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        
        const trainPetIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(trainPetIndex) || trainPetIndex < 0 || trainPetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Chọn thú cưng để huấn luyện:\n\n`;
            userData.pets.forEach((pet, idx) => {
              const lastUsed = pet.activities?.TRAIN?.lastUsed || 0;
              const cooldownReduction = PET_ACTIVITIES.TRAIN.vipReduction[benefits.packageId] || 0;
              const reducedCooldown = PET_ACTIVITIES.TRAIN.cooldown * (1 - cooldownReduction);
              const cooldownRemaining = (lastUsed + reducedCooldown) - Date.now();

              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Lv.${pet.level}) - ${cooldownRemaining > 0 ? `⏳ Còn ${formatTime(cooldownRemaining)}` : '✅ Sẵn sàng'
                }\n`;
            });
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const trainPet = userData.pets[trainPetIndex || 0];
        const trainResult = await petActivity(userId, trainPet.id, 'TRAIN');

        return api.sendMessage(trainResult.message, threadID, messageID);

      case "compete":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        
        const competePetIndex = target[1] ? parseInt(target[1]) - 1 : 0;

        if (isNaN(competePetIndex) || competePetIndex < 0 || competePetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Chọn thú cưng để thi đấu:\n\n`;
            userData.pets.forEach((pet, idx) => {
              const lastUsed = pet.activities?.COMPETE?.lastUsed || 0;
              const cooldownReduction = PET_ACTIVITIES.COMPETE.vipReduction[benefits.packageId] || 0;
              const reducedCooldown = PET_ACTIVITIES.COMPETE.cooldown * (1 - cooldownReduction);
              const cooldownRemaining = (lastUsed + reducedCooldown) - Date.now();

              petList += `${idx + 1}. ${pet.emoji} ${pet.name} (Lv.${pet.level}) - ${cooldownRemaining > 0 ? `⏳ Còn ${formatTime(cooldownRemaining)}` : '✅ Sẵn sàng'
                }\n`;
            });
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const competePet = userData.pets[competePetIndex || 0];
        const competeResult = await petActivity(userId, competePet.id, 'COMPETE');

        return api.sendMessage(competeResult.message, threadID, messageID);

      case "item":
        
        const itemSubcmd = target[1]?.toLowerCase();

        if (!itemSubcmd || itemSubcmd === "list") {
          
          if (!userData.inventory || Object.keys(userData.inventory).length === 0) {
            return api.sendMessage(
              `🎒 Túi đồ trống.\n` +
              `💡 Dùng .pet item mua [id_item] [số lượng] để mua vật phẩm.`,
              threadID, messageID
            );
          }

          let inventoryMsg = `🎒 TÚI ĐỒ CỦA BẠN:\n\n`;

          
          const groupedItems = {
            "Thức ăn": [],
            "Đồ chơi": [],
            "Thuốc": [],
            "Phụ kiện": []
          };

          for (const [itemId, count] of Object.entries(userData.inventory)) {
            if (count <= 0) continue;

            if (itemId in PET_ITEMS.FOODS) {
              groupedItems["Thức ăn"].push({ ...PET_ITEMS.FOODS[itemId], id: itemId, count });
            } else if (itemId in PET_ITEMS.TOYS) {
              groupedItems["Đồ chơi"].push({ ...PET_ITEMS.TOYS[itemId], id: itemId, count });
            } else if (itemId in PET_ITEMS.MEDICINE) {
              groupedItems["Thuốc"].push({ ...PET_ITEMS.MEDICINE[itemId], id: itemId, count });
            } else if (itemId in PET_ITEMS.ACCESSORIES) {
              groupedItems["Phụ kiện"].push({ ...PET_ITEMS.ACCESSORIES[itemId], id: itemId, count });
            }
          }

          
          for (const [category, items] of Object.entries(groupedItems)) {
            if (items.length > 0) {
              inventoryMsg += `📦 ${category}:\n`;
              items.forEach(item => {
                inventoryMsg += `- ${item.emoji} ${item.name} (${item.count}) [${item.id}]\n`;
              });
              inventoryMsg += '\n';
            }
          }

          inventoryMsg += `💡 Sử dụng: .pet feed để cho ăn hoặc .pet play để chơi`;

          return api.sendMessage(inventoryMsg, threadID, messageID);

        } else if (itemSubcmd === "mua" || itemSubcmd === "buy") {
          
          const itemId = target[2]?.toLowerCase();
          const quantity = parseInt(target[3]) || 1;

          if (!itemId) {
            return api.sendMessage(
              `❌ Vui lòng nhập ID vật phẩm.\n` +
              `💡 Xem danh sách vật phẩm tại .pet shop`,
              threadID, messageID
            );
          }

          
          let itemInfo = null;
          let category = null;

          for (const [cat, items] of Object.entries({
            FOODS: PET_ITEMS.FOODS,
            TOYS: PET_ITEMS.TOYS,
            MEDICINE: PET_ITEMS.MEDICINE,
            ACCESSORIES: PET_ITEMS.ACCESSORIES
          })) {
            if (itemId in items) {
              itemInfo = items[itemId];
              category = cat;
              break;
            }
          }

          if (!itemInfo) {
            return api.sendMessage(`❌ Không tìm thấy vật phẩm với ID: ${itemId}`, threadID, messageID);
          }

          
          const itemPrice = calculateItemPrice(itemInfo, benefits);
          const totalPrice = itemPrice * quantity;

          
          const userBalance = getBalance(userId);

          if (userBalance < totalPrice) {
            return api.sendMessage(
              `❌ Không đủ tiền! Cần ${totalPrice.toLocaleString()}$, hiện có ${userBalance.toLocaleString()}$.`,
              threadID, messageID
            );
          }

          
          userData.inventory = userData.inventory || {};
          userData.inventory[itemId] = (userData.inventory[itemId] || 0) + quantity;

          
          updateBalance(userId, -totalPrice);

          
          saveUserPets(userId, userData);

          return api.sendMessage(
            `✅ Đã mua thành công ${quantity}x ${itemInfo.emoji} ${itemInfo.name} với giá ${totalPrice.toLocaleString()}$.\n\n` +
            `Số lượng hiện tại: ${userData.inventory[itemId]}\n` +
            `Số dư còn lại: ${getBalance(userId).toLocaleString()}$`,
            threadID, messageID
          );
        }

        break;

      case "rename":
        
        if (userData.pets.length === 0) {
          return api.sendMessage(`❌ Bạn chưa có thú cưng nào.`, threadID, messageID);
        }

        const renamePetIndex = target[1] && !isNaN(parseInt(target[1]))
          ? parseInt(target[1]) - 1
          : 0;

        const newName = target[1] && !isNaN(parseInt(target[1]))
          ? target.slice(2).join(' ')
          : target.slice(1).join(' ');

        if (!newName || newName.length < 1) {
          return api.sendMessage(
            `❌ Vui lòng nhập tên mới cho thú cưng.\n` +
            `💡 Cú pháp: .pet rename [số thú] [tên mới]`,
            threadID, messageID
          );
        }

        if (isNaN(renamePetIndex) || renamePetIndex < 0 || renamePetIndex >= userData.pets.length) {
          if (userData.pets.length > 1) {
            let petList = `🐾 Chọn thú cưng để đổi tên:\n\n`;
            userData.pets.forEach((pet, idx) => {
              petList += `${idx + 1}. ${pet.emoji} ${pet.name}\n`;
            });
            petList += `\n💡 Cú pháp: .pet rename [số thú] [tên mới]`;
            return api.sendMessage(petList, threadID, messageID);
          }
        }

        const oldName = userData.pets[renamePetIndex].name;
        userData.pets[renamePetIndex].name = newName;
        saveUserPets(userId, userData);

        return api.sendMessage(
          `✅ Đã đổi tên thú cưng từ "${oldName}" thành "${newName}"!`,
          threadID, messageID
        );

      default:
        return api.sendMessage(
          `❌ Lệnh không hợp lệ. Gõ .pet để xem hướng dẫn.`,
          threadID, messageID
        );
    }
  }
};