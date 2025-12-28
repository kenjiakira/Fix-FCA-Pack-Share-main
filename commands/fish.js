const fs = require("fs");
const path = require("path");
const {
  getBalance,
  updateBalance,
} = require("../utils/currencies");
const fishingItems = require("../game/config/fishing/items");
const fishTypes = require("../game/config/fishing/fish");
const locations = require("../game/config/fishing/locations");
const {
  treasures,
  expMultipliers,
  levelRewards,
  defaultCollection,
  expRequirements,
  streakBonuses,
} = require("../game/config/fishing/constants");
const { getVIPBenefits } = require("../game/vip/vipCheck");
const fishCanvas = require("../game/canvas/fishCanvas");
const { recipes, craftingMaterials } = require("../game/config/fishing/crafting");
const baits = require("../game/config/fishing/baits");

const levelRequirements = {
  pond: 1,
  river: 3,
  ocean: 5,
  deepSea: 10,
  abyss: 20,
  atlantis: 50,
  spaceOcean: 100,
  dragonRealm: 200,
  vipReserve: 5,
};

const ENERGY_SYSTEM = {
  baseCost: 50,
  fishingCost: 10,
  baseMaxEnergy: 50,
  energyPerLevel: 5,
  regenTime: 180000,
  minEnergyToFish: 10,
  maxRestoreAmount: 100,
};

function formatNumber(number) {
  if (number === undefined || number === null) return "0";
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const messages = {
  cooldown: (waitTime, lastTime) =>
    `⏳ Bạn cần đợi ${waitTime} giây nữa mới có thể câu tiếp!\n` +
    `⌚ Thời gian câu lần cuối: ${lastTime}`,
  levelUp: (level) => `🎉 Chúc mừng đạt cấp ${level}!`,
  rodBroken: (rod) => `⚠️ Cần câu cũ đã hỏng! Tự động chuyển sang ${rod}!`,
  insufficientFunds: (cost, location) =>
    `❌ Bạn cần ${formatNumber(cost)} $ để câu ở ${location}!`,
  insufficientEnergy: (current, required) =>
    `❌ Không đủ năng lượng! Bạn có ${current}/${required} năng lượng cần thiết để câu cá.`,
  energyRestored: (amount, cost) =>
    `✅ Đã phục hồi ${amount} năng lượng với giá ${formatNumber(cost)} $!`,
};

function calculateRequiredExp(level) {
  const { baseExp, multiplierPerLevel } =
    require("../game/config/fishing/constants").expRequirements;
  return Math.floor(baseExp * Math.pow(multiplierPerLevel, level - 1));
}

function calculateMaxEnergy(level) {
  return (
    ENERGY_SYSTEM.baseMaxEnergy + ENERGY_SYSTEM.energyPerLevel * (level - 1)
  );
}

function updateEnergy(playerData) {
  const now = Date.now();
  const timePassed = now - (playerData.lastEnergyUpdate || now);
  const energyGained = Math.floor(timePassed / ENERGY_SYSTEM.regenTime);

  if (energyGained > 0) {
    const maxEnergy = calculateMaxEnergy(playerData.level);
    playerData.energy = Math.min(
      maxEnergy,
      (playerData.energy || 0) + energyGained
    );
    playerData.lastEnergyUpdate = now - (timePassed % ENERGY_SYSTEM.regenTime);
  }

  return playerData;
}

function getNextEnergyTime(playerData) {
  const now = Date.now();
  const lastUpdate = playerData.lastEnergyUpdate || now;
  const timeUntilNext =
    ENERGY_SYSTEM.regenTime - ((now - lastUpdate) % ENERGY_SYSTEM.regenTime);
  return Math.ceil(timeUntilNext / 1000);
}

module.exports = {
  name: "fish",
  dev: "HNT",
  category: "Games",
  info: "Câu cá kiếm xu",
  usages: "fish",
  usedby: 0,
  cooldowns: 0,
  onPrefix: true,

  lastFished: {},

  onLaunch: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    let playerData = this.loadPlayerData(senderID);

    playerData = updateEnergy(playerData);
    this.savePlayerData(playerData);

    const allData = this.loadAllPlayers();

    const now = Date.now();
    const vipBenefits = getVIPBenefits(senderID);
    const COOLDOWN = vipBenefits?.fishingCooldown || 180000;

    let cooldownMsg = "";
    if (
      allData[senderID]?.lastFished &&
      now - allData[senderID].lastFished < COOLDOWN
    ) {
      const waitTime = Math.ceil(
        (COOLDOWN - (now - allData[senderID].lastFished)) / 1000
      );
      cooldownMsg = `⏳ Chờ ${waitTime} giây nữa mới có thể câu tiếp!\n`;
    }

    const maxEnergy = calculateMaxEnergy(playerData.level);
    const timeToNext =
      playerData.energy < maxEnergy ? getNextEnergyTime(playerData) : 0;

    const menu =
      "🎣 MENU CÂU CÁ 🎣\n━━━━━━━━━━━━━━━━━━\n" +
      `${cooldownMsg}` +
      `⚡ Năng lượng: ${playerData.energy}/${maxEnergy}` +
      (timeToNext > 0
        ? ` (+1 sau ${Math.floor(timeToNext / 60)}m${timeToNext % 60}s)`
        : "") +
      `\n` +
      "1. Câu cá (10 năng lượng)\n" +
      "2. Cửa hàng cần câu\n" +
      "3. Cửa hàng mồi câu\n" +
      "4. Chế tạo cần câu\n" +
      "5. Túi đồ\n" +
      "6. Bộ sưu tập\n" +
      "7. Xếp hạng\n" +
      "8. Hướng dẫn\n" +
      "9. Phục hồi năng lượng\n\n" +
      "Reply tin nhắn với số để chọn!";

    const msg = await api.sendMessage(menu, threadID, messageID);

    global.client.onReply.push({
      name: this.name,
      messageID: msg.messageID,
      author: senderID,
      type: "menu",
      playerData,
    });
  },

  loadPlayerData: function (userID) {
    const dataPath = path.join(__dirname, "../database/json/fishing.json");
    let data = {};

    try {
      if (fs.existsSync(dataPath)) {
        data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      }
    } catch (err) {
      console.error("Error loading fishing data:", err);
    }

    if (!fishingItems || typeof fishingItems !== "object") {
      console.error("Invalid fishingItems configuration");
      return null;
    }

    if (!fishingItems["Cần trúc"]) {
      fishingItems["Cần trúc"] = {
        durability: 10,
        price: 0,
        multiplier: 1,
      };
    }

    const defaultRod = {
      name: "Cần trúc",
      durability: fishingItems["Cần trúc"].durability,
      inventory: ["Cần trúc"],
    };

    if (!data[userID] || !data[userID].rod) {
      data[userID] = {
        rod: defaultRod.name,
        rodDurability: defaultRod.durability,
        inventory: defaultRod.inventory,
        collection: defaultCollection,
        exp: 0,
        level: 1,
        fishingStreak: 0,
        energy: ENERGY_SYSTEM.baseMaxEnergy,
        lastEnergyUpdate: Date.now(),
        stats: {
          totalExp: 0,
          highestStreak: 0,
          totalFishes: 0,
        },
        activeBuffs: {},
        lastFished: 0,
        userID: userID,
      };
    }

    if (data[userID] && !data[userID].hasOwnProperty("energy")) {
      data[userID].energy = ENERGY_SYSTEM.baseMaxEnergy;
      data[userID].lastEnergyUpdate = Date.now();
    }

    if (!fishingItems[data[userID].rod]) {
      data[userID].rod = defaultRod.name;
      data[userID].rodDurability = defaultRod.durability;
    }

    const currentRod = fishingItems[data[userID].rod];
    if (
      !currentRod ||
      typeof data[userID].rodDurability !== "number" ||
      data[userID].rodDurability < 0 ||
      data[userID].rodDurability > currentRod.durability
    ) {
      data[userID].rod = defaultRod.name;
      data[userID].rodDurability = defaultRod.durability;
    }

    if (!Array.isArray(data[userID].inventory)) {
      data[userID].inventory = ["Cần trúc"];
    }

    data[userID].inventory = data[userID].inventory.filter(
      (item) => fishingItems[item] !== undefined
    );

    if (!data[userID].inventory.includes("Cần trúc")) {
      data[userID].inventory.push("Cần trúc");
    }
    if (!data[userID].baits) {
      data[userID].baits = {};
    }

    if (!data[userID].craftingMaterials) {
      data[userID].craftingMaterials = {};
    }

    return updateEnergy(data[userID]);
  },

  savePlayerData: function (data) {
    const dataPath = path.join(__dirname, "../database/json/fishing.json");
    try {
      let existingData = {};
      if (fs.existsSync(dataPath)) {
        existingData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      }

      if (data.rod && data.inventory) {
        existingData[data.userID] = data;
      } else {
        Object.entries(data).forEach(([userID, userData]) => {
          existingData[userID] = userData;
        });
      }

      fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
    } catch (err) {
      console.error("Error saving fishing data:", err);
    }
  },

  onReply: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    const reply = global.client.onReply.find(
      (r) =>
        r.messageID === event.messageReply.messageID && r.author === senderID
    );
    if (!reply) return;

    if (reply.type !== "menu") {
      global.client.onReply = global.client.onReply.filter(
        (r) => r.messageID !== reply.messageID
      );
    }

    const allData = this.loadAllPlayers();
    let playerData = updateEnergy(this.loadPlayerData(senderID));

    if (reply.type === "location") {
      const vipBenefits = getVIPBenefits(senderID);
      const COOLDOWN = vipBenefits?.fishingCooldown || 180000;

      if (
        allData[senderID]?.lastFished &&
        Date.now() - allData[senderID].lastFished < COOLDOWN
      ) {
        const waitTime = Math.ceil(
          (COOLDOWN - (Date.now() - allData[senderID].lastFished)) / 1000
        );
        return api.sendMessage(
          messages.cooldown(
            waitTime,
            new Date(allData[senderID].lastFished).toLocaleTimeString()
          ),
          threadID
        );
      }
    }

    switch (reply.type) {
      case "menu":
        const choice = parseInt(body);
        if (isNaN(choice) || choice < 1 || choice > 9) {
          return api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID);
        }

        switch (choice) {
          case 1:
            const now = Date.now();
            const vipBenefits = getVIPBenefits(event.senderID);
            const COOLDOWN = vipBenefits?.fishingCooldown || 180000;

            if (
              allData[event.senderID]?.lastFished &&
              now - allData[event.senderID].lastFished < COOLDOWN
            ) {
              const waitTime = Math.ceil(
                (COOLDOWN - (now - allData[event.senderID].lastFished)) / 1000
              );
              return api.sendMessage(
                messages.cooldown(
                  waitTime,
                  new Date(
                    allData[event.senderID].lastFished
                  ).toLocaleTimeString()
                ),
                threadID
              );
            }

            if (playerData.energy < ENERGY_SYSTEM.minEnergyToFish) {
              const maxEnergy = calculateMaxEnergy(playerData.level);
              const timeToNext = getNextEnergyTime(playerData);
              const minutesToFull = Math.ceil(
                (ENERGY_SYSTEM.regenTime *
                  (ENERGY_SYSTEM.minEnergyToFish - playerData.energy)) /
                  60000
              );

              return api.sendMessage(
                `${messages.insufficientEnergy(
                  playerData.energy,
                  ENERGY_SYSTEM.minEnergyToFish
                )}\n` +
                  `⏳ Năng lượng phục hồi +1 sau: ${Math.floor(
                    timeToNext / 60
                  )}m${timeToNext % 60}s\n` +
                  `⌛ Thời gian chờ đủ năng lượng: ${minutesToFull} phút\n` +
                  `💡 Dùng '7. Phục hồi năng lượng' trong menu để phục hồi ngay!`,
                threadID
              );
            }

            const locationMenu =
              "🗺️ CHỌN ĐỊA ĐIỂM CÂU CÁ:\n━━━━━━━━━━━━━━━━━━\n" +
              `⚡ Năng lượng: ${playerData.energy}/${calculateMaxEnergy(
                playerData.level
              )} (-${ENERGY_SYSTEM.fishingCost}/lần câu)\n` +
              Object.entries(locations)
                .map(([key, loc], index) => {
                  const isVipGold = key === "vipReserve";
                  const isVipLocation = isVipGold;

                  const vipIcon = isVipGold ? " 👑" : "";

                  const vipStatus = getVIPBenefits(event.senderID);
                  const hasVipGoldAccess =
                    vipStatus && vipStatus.packageId === 3;

                  let vipAccessStatus = "";
                  if (isVipGold) {
                    vipAccessStatus = hasVipGoldAccess
                      ? " ✅ VIP Gold"
                      : " ❌ Cần VIP Gold";
                  }

                  return (
                    `${index + 1}. ${loc.name}${vipIcon}\n` +
                    `💰 Phí: ${formatNumber(loc.cost)} $\n` +
                    `${
                      playerData.level >= levelRequirements[key] ? "✅" : "❌"
                    } Yêu cầu: Cấp ${levelRequirements[key]}` +
                    `${isVipLocation ? vipAccessStatus : ""}\n`
                  );
                })
                .join("\n");

            const locMsg = await api.sendMessage(
              `📊 Cấp độ của bạn: ${playerData.level}\n` +
                `💵 Số dư: ${formatNumber(getBalance(event.senderID))} $\n\n` +
                locationMenu,
              threadID
            );

            setTimeout(() => {
              api.unsendMessage(locMsg.messageID);
            }, 20000);

            global.client.onReply.push({
              name: this.name,
              messageID: locMsg.messageID,
              author: event.senderID,
              type: "location",
              playerData,
            });
            break;

          case 2:
            const shopMenu =
              "🏪 CỬA HÀNG CẦN CÂU 🎣\n━━━━━━━━━━━━━━━━━━\n" +
              Object.entries(fishingItems)
                .map(
                  ([name, item], index) =>
                    `${index + 1}. ${name}\n💰 Giá: ${formatNumber(
                      item.price
                    )} $\n⚡ Độ bền: ${item.durability}\n↑ Tỉ lệ: x${
                      item.multiplier
                    }\n`
                )
                .join("\n") +
              "\n💵 Số dư: " +
              formatNumber(getBalance(senderID)) +
              " $" +
              "\n\nReply số để mua cần câu!";

            const shopMsg = await api.sendMessage(shopMenu, threadID);
            global.client.onReply.push({
              name: this.name,
              messageID: shopMsg.messageID,
              author: senderID,
              type: "shop",
              playerData,
            });
            break;

          case 3:
            const baitShopMenu =
              "🎣 CỬA HÀNG MỒI CÂU 🎣\n" +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              Object.entries(baits)
                .map(
                  ([name, bait], index) =>
                    `${index + 1}. ${name}\n` +
                    `💰 Giá: ${formatNumber(bait.price)}$/cái\n` +
                    `🔄 Sử dụng: ${bait.uses} lần/cái\n` +
                    `📝 Mô tả: ${bait.description}\n` +
                    `📦 Đang có: ${
                      (playerData.baits && playerData.baits[name]) || 0
                    } lần sử dụng\n`
                )
                .join("\n") +
              "\n💵 Số dư: " +
              formatNumber(getBalance(senderID)) +
              "$\n\n" +
              "💡 Cách sử dụng:\n" +
              "• Mồi câu sẽ tự động được dùng khi câu cá\n" +
              "• Hệ thống sẽ ưu tiên dùng mồi câu tốt nhất\n" +
              "• Reply số thứ tự để mua mồi câu";

            const baitMsg = await api.sendMessage(baitShopMenu, threadID);
            global.client.onReply.push({
              name: this.name,
              messageID: baitMsg.messageID,
              author: senderID,
              type: "baitShop",
              playerData,
            });
            break;

          case 4: // Chế tạo cần câu mới
            const craftingMenu =
              "🛠️ CHẾ TẠO CẦN CÂU 🛠️\n━━━━━━━━━━━━━━━━━━\n" +
              Object.entries(recipes)
                .map(
                  ([name, recipe], index) =>
                    `${index + 1}. ${name}\n` +
                    `📋 Yêu cầu: ${Object.entries(recipe.materials)
                      .map(([item, count]) => `${item} x${count}`)
                      .join(", ")}\n` +
                    `💰 Phí: ${formatNumber(recipe.price)} $\n` +
                    `📊 Cấp độ: ${recipe.level}\n` +
                    `🎣 Kết quả: Cần câu (Độ bền ${recipe.result.durability}, Tỉ lệ x${recipe.result.multiplier})\n`
                )
                .join("\n") +
              "\n📦 VẬT LIỆU CỦA BẠN:\n" +
              Object.entries(craftingMaterials)
                .map(
                  ([name, _]) =>
                    `- ${name}: ${playerData.craftingMaterials[name] || 0} cái`
                )
                .join("\n") +
              "\n\n💰 Số dư: " +
              formatNumber(getBalance(senderID)) +
              " $" +
              "\n\nReply số để chọn công thức chế tạo!";

            const craftMsg = await api.sendMessage(craftingMenu, threadID);
            global.client.onReply.push({
              name: this.name,
              messageID: craftMsg.messageID,
              author: senderID,
              type: "crafting",
              playerData,
            });
            break;
          case 5:
            const inventory =
              `🎒 TÚI ĐỒ CỦA BẠN:\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `🎣 Cần câu: ${playerData.rod}\n` +
              `⚡ Độ bền: ${playerData.rodDurability}/${
                fishingItems[playerData.rod].durability
              }\n` +
              `📊 Cấp độ: ${playerData.level}\n` +
              `✨ EXP: ${playerData.exp}/${playerData.level * 1000}\n` +
              `🏆 Thành tích:\n` +
              Object.entries(fishTypes)
                .map(([rarity, fishes]) => {
                  const rarityFishes =
                    playerData.collection?.byRarity[rarity] || {};
                  const caughtFishes = Object.entries(rarityFishes)
                    .filter(([_, count]) => count > 0)
                    .map(([fish, count]) => `• ${fish}: ${count} lần`);
                  return caughtFishes.length
                    ? `【${rarity.toUpperCase()}】\n${caughtFishes.join("\n")}`
                    : "";
                })
                .filter(Boolean)
                .join("\n");

            api.sendMessage(inventory, threadID);
            break;

          case 6:
            try {
              const imagePath = await fishCanvas.createCollectionImage({
                userId: senderID,
                userName: `Ngư dân #${senderID.substring(0, 5)}`,
                collection: playerData.collection,
                level: playerData.level,
              });

              api.sendMessage(
                {
                  body: "📚 Bộ sưu tập cá của bạn:",
                  attachment: fs.createReadStream(imagePath),
                },
                threadID,
                () => {
                  if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                  }
                }
              );
            } catch (imageError) {
              console.error("Error creating collection image:", imageError);

              const collection =
                "📚 BỘ SƯU TẬP CÁ:\n━━━━━━━━━━━━━━━━━━\n\n" +
                Object.entries(fishTypes)
                  .map(([rarity, fishes]) => {
                    const fishList = fishes
                      .map((f) => {
                        const caught =
                          playerData.collection?.byRarity[rarity]?.[f.name] ||
                          0;
                        return `${caught > 0 ? "✅" : "❌"} ${
                          f.name
                        } (${formatNumber(f.value)} $) - Đã bắt: ${caught}`;
                      })
                      .join("\n");
                    return `【${rarity.toUpperCase()}】\n${fishList}\n`;
                  })
                  .join("\n") +
                `\n📊 Thống kê:\n` +
                `Tổng số cá đã bắt: ${
                  playerData.collection?.stats.totalCaught || 0
                }\n` +
                `Tổng giá trị: ${formatNumber(
                  playerData.collection?.stats.totalValue || 0
                )} $\n` +
                `Bắt quý giá nhất: ${
                  playerData.collection?.stats.bestCatch?.name || "Chưa có"
                } (${formatNumber(
                  playerData.collection?.stats.bestCatch?.value || 0
                )} $)`;

              api.sendMessage(collection, threadID);
            }
            break;
          case 7:
            const allPlayers = this.loadAllPlayers();
            const rankings = this.getRankingStats(allPlayers);
            const top10 = rankings.slice(0, 10);

            const userRank =
              rankings.findIndex((player) => player.id === senderID) + 1;
            const userStats = rankings.find((player) => player.id === senderID);

            const rankMsg =
              "🏆 BẢNG XẾP HẠNG CÂU CÁ 🏆\n━━━━━━━━━━━━━━━━━━\n\n" +
              top10
                .map(
                  (player, index) =>
                    `${index + 1}. ${getPlayerRank(player.score)}\n` +
                    `👤 ID: ${player.id}\n` +
                    `📊 Level: ${player.level}\n` +
                    `🎣 Tổng cá: ${formatNumber(player.totalCaught)}\n` +
                    `💰 Tổng giá trị: ${formatNumber(
                      player.adjustedValue
                    )} $\n` +
                    `🏆 Cá quý nhất: ${player.bestCatch.name} (${formatNumber(
                      player.adjustedBestCatchValue
                    )} $)\n` +
                    `📈 Điểm: ${player.score.toFixed(2)}\n` +
                    `🔥 Chuỗi hiện tại: ${player.streak}\n`
                )
                .join("━━━━━━━━━━━━━━━━━━\n") +
              "\n👉 Thứ hạng của bạn:\n" +
              (userStats
                ? `Hạng ${userRank} - ${getPlayerRank(userStats.score)}\n` +
                  `📊 Level: ${userStats.level}\n` +
                  `🎣 Tổng cá: ${formatNumber(userStats.totalCaught)}\n` +
                  `💰 Tổng giá trị: ${formatNumber(
                    userStats.adjustedValue
                  )} $\n` +
                  `📈 Điểm: ${userStats.score.toFixed(2)}\n` +
                  `🔥 Chuỗi hiện tại: ${userStats.streak}`
                : "Chưa có dữ liệu");

            api.sendMessage(rankMsg, threadID);
            break;

            // Thêm hàm mới để xác định danh hiệu xếp hạng
            function getPlayerRank(score) {
              if (score >= 90) return "🔱 Ngư Vương";
              if (score >= 75) return "🌊 Chuyên Gia Biển Cả";
              if (score >= 60) return "🦈 Thợ Săn Đại Dương";
              if (score >= 45) return "🐬 Thủy Thủ Lão Luyện";
              if (score >= 30) return "🐠 Ngư Dân Chuyên Nghiệp";
              if (score >= 15) return "🎣 Ngư Dân Kinh Nghiệm";
              return "🐟 Ngư Dân Tập Sự";
            }

          case 8:
            api.sendMessage(
              "📖 HƯỚNG DẪN CÂU CÁ 🎣\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "1. Chọn địa điểm câu cá phù hợp với túi tiền\n" +
                "2. Mua cần câu tốt để tăng tỉ lệ bắt cá hiếm\n" +
                "3. Cần câu sẽ mất độ bền sau mỗi lần sử dụng\n" +
                "4. Các loại cá theo thứ tự độ hiếm:\n" +
                "   Rác < Phổ thông < Hiếm < Quý hiếm < Huyền thoại < Thần thoại\n" +
                "5. Có cơ hội nhận được kho báu khi câu cá\n" +
                "6. Tích lũy EXP để lên cấp và mở khóa thêm tính năng",
              threadID
            );
            break;

          case 9:
            const maxEnergy = calculateMaxEnergy(playerData.level);
            if (playerData.energy >= maxEnergy) {
              return api.sendMessage(
                `✅ Năng lượng của bạn đã đầy (${playerData.energy}/${maxEnergy})!`,
                threadID
              );
            }

            const restoreMsg = await api.sendMessage(
              `⚡ PHỤC HỒI NĂNG LƯỢNG ⚡\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `Năng lượng hiện tại: ${playerData.energy}/${maxEnergy}\n` +
                `Giá phục hồi: ${formatNumber(
                  ENERGY_SYSTEM.baseCost
                )} $ mỗi điểm năng lượng\n\n` +
                `1. Phục hồi 10 điểm (${formatNumber(
                  ENERGY_SYSTEM.baseCost * 10
                )} $)\n` +
                `2. Phục hồi 20 điểm (${formatNumber(
                  ENERGY_SYSTEM.baseCost * 20
                )} $)\n` +
                `3. Phục hồi 50 điểm (${formatNumber(
                  ENERGY_SYSTEM.baseCost * 50
                )} $)\n` +
                `4. Phục hồi tối đa (${formatNumber(
                  ENERGY_SYSTEM.baseCost *
                    Math.min(
                      maxEnergy - playerData.energy,
                      ENERGY_SYSTEM.maxRestoreAmount
                    )
                )} $)\n` +
                `5. Quay lại\n\n` +
                `💵 Số dư của bạn: ${formatNumber(getBalance(senderID))} $`,
              threadID
            );

            global.client.onReply.push({
              name: this.name,
              messageID: restoreMsg.messageID,
              author: senderID,
              type: "restoreEnergy",
              playerData,
            });
            break;
        }
        break;

      case "restoreEnergy":
        const restoreChoice = parseInt(body);
        if (isNaN(restoreChoice) || restoreChoice < 1 || restoreChoice > 5) {
          return api.sendMessage("❌ Lựa chọn không hợp lệ!", threadID);
        }

        if (restoreChoice === 5) {
          await this.onLaunch({ api, event });
          return;
        }

        const restoreAmounts = [
          10,
          20,
          50,
          Math.min(
            calculateMaxEnergy(playerData.level) - playerData.energy,
            ENERGY_SYSTEM.maxRestoreAmount
          ),
        ];
        const selectedAmount = restoreAmounts[restoreChoice - 1];
        const cost = selectedAmount * ENERGY_SYSTEM.baseCost;

        const balance = getBalance(senderID);
        if (balance < cost) {
          return api.sendMessage(
            `❌ Không đủ tiền! Cần ${formatNumber(
              cost
            )} $ để phục hồi ${selectedAmount} năng lượng.\n` +
              `💵 Số dư hiện tại: ${formatNumber(balance)} $`,
            threadID
          );
        }

        updateBalance(senderID, -cost);
        const maxEnergy = calculateMaxEnergy(playerData.level);
        playerData.energy = Math.min(
          maxEnergy,
          playerData.energy + selectedAmount
        );
        this.savePlayerData(playerData);

        api.sendMessage(
          messages.energyRestored(selectedAmount, cost) +
            `\n` +
            `⚡ Năng lượng mới: ${playerData.energy}/${maxEnergy}\n` +
            `💵 Số dư còn lại: ${formatNumber(getBalance(senderID))} $`,
          threadID
        );

        setTimeout(() => this.onLaunch({ api, event }), 1000);
        break;

      case "shop":
        const shopChoice = parseInt(body) - 1;
        const items = Object.entries(fishingItems);
        if (shopChoice >= 0 && shopChoice < items.length) {
          const [rodName, rodInfo] = items[shopChoice];
          await this.handleShopPurchase(
            api,
            event,
            rodName,
            rodInfo,
            playerData
          );
        }
        break;

      case "baitShop":
        const baitChoice = parseInt(body) - 1;
        const baitItems = Object.entries(baits);

        if (baitChoice >= 0 && baitChoice < baitItems.length) {
          const [baitName, baitInfo] = baitItems[baitChoice];

          const baitQuantityMenu = await api.sendMessage(
            "🎣 CHỌN SỐ LƯỢNG MỒI CÂU 🎣\n" +
              "───────────────\n\n" +
              `Mồi câu: ${baitName}\n` +
              `💰 Giá: ${formatNumber(baitInfo.price)}$ / cái\n` +
              `🔄 Sử dụng: ${baitInfo.uses} lần/cái\n` +
              `📝 Mô tả: ${baitInfo.description}\n\n` +
              "Số lượng có sẵn:\n" +
              "1. Mua 1 cái\n" +
              "2. Mua 5 cái\n" +
              "3. Mua 10 cái\n" +
              "4. Mua 20 cái\n" +
              "5. Tùy chọn số lượng\n\n" +
              `💵 Số dư: ${formatNumber(getBalance(event.senderID))}$`,
            threadID
          );

          global.client.onReply.push({
            name: this.name,
            messageID: baitQuantityMenu.messageID,
            author: event.senderID,
            type: "baitQuantity",
            baitName: baitName,
            baitInfo: baitInfo,
            playerData: playerData,
          });
        }
        break;

      case "baitQuantity":
        const quantityChoice = parseInt(body);
        if (!reply.baitName || !reply.baitInfo) {
          return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }

        let quantity = 0;
        if (quantityChoice === 5) {
          const customMsg = await api.sendMessage(
            "📝 Vui lòng nhập số lượng muốn mua:",
            threadID
          );

          global.client.onReply.push({
            name: this.name,
            messageID: customMsg.messageID,
            author: event.senderID,
            type: "customBaitQuantity",
            baitName: reply.baitName,
            baitInfo: reply.baitInfo,
            playerData: reply.playerData,
          });
          return;
        } else {
          quantity = [1, 5, 10, 20][quantityChoice - 1];
        }

        await this.handleBaitPurchase(
          api,
          event,
          reply.baitName,
          reply.baitInfo,
          reply.playerData,
          quantity
        );
        break;

      case "customBaitQuantity":
        const customQuantity = parseInt(body);
        if (isNaN(customQuantity) || customQuantity <= 0) {
          return api.sendMessage("❌ Số lượng không hợp lệ!", threadID);
        }

        if (customQuantity > 100) {
          return api.sendMessage("❌ Số lượng tối đa là 100 cái!", threadID);
        }

        await this.handleBaitPurchase(
          api,
          event,
          reply.baitName,
          reply.baitInfo,
          reply.playerData,
          customQuantity
        );
        break;
      case "crafting":
        const craftChoice = parseInt(body) - 1;
        const recipeItems = Object.entries(recipes);
        if (craftChoice >= 0 && craftChoice < recipeItems.length) {
          const [recipeName, recipeInfo] = recipeItems[craftChoice];
          await this.handleCrafting(
            api,
            event,
            recipeName,
            recipeInfo,
            playerData
          );
        }
        break;
      case "location":
        const locationIndex = parseInt(body) - 1;
        const locationKeys = Object.keys(locations);
        if (locationIndex >= 0 && locationIndex < locationKeys.length) {
          await this.handleFishing(
            api,
            event,
            locations[locationKeys[locationIndex]],
            playerData
          );
        }
        break;
    }

    if (reply.type === "menu") {
      global.client.onReply.push({
        name: this.name,
        messageID: messageID,
        author: senderID,
        type: "menu",
        playerData,
      });
    }
  },

  handleFishing: async function (api, event, location, playerData) {
    if (!fishingItems || !playerData) {
      await api.sendMessage(
        "❌ Lỗi cấu hình hoặc dữ liệu người chơi!",
        event.threadID
      );
      return;
    }

    if (!fishingItems[playerData.rod]) {
      playerData.rod = "Cần trúc";
      playerData.rodDurability = fishingItems["Cần trúc"].durability;
      this.savePlayerData(playerData);
      await api.sendMessage(
        "⚠️ Đã phát hiện lỗi cần câu, đã reset về cần mặc định!",
        event.threadID
      );
    }

    const allData = this.loadAllPlayers();
    const now = Date.now();

    if (!allData[event.senderID]) {
      allData[event.senderID] = playerData;
    }

    const vipBenefits = getVIPBenefits(event.senderID);
    const COOLDOWN = vipBenefits?.fishingCooldown || 180000;
    const vipIcon = vipBenefits
      ? vipBenefits.packageId === 3
        ? "⭐⭐⭐"
        : vipBenefits.packageId === 2
        ? "⭐⭐"
        : "⭐"
      : "";

    const cooldownMinutes = Math.ceil(COOLDOWN / 60000);

    if (
      allData[event.senderID].lastFished &&
      now - allData[event.senderID].lastFished < COOLDOWN
    ) {
      const waitTime = Math.ceil(
        (COOLDOWN - (now - allData[event.senderID].lastFished)) / 1000
      );
      return api.sendMessage(
        messages.cooldown(
          waitTime,
          new Date(allData[event.senderID].lastFished).toLocaleTimeString()
        ),
        event.threadID
      );
    }

    const levelRequirements = {
      pond: 1,
      river: 3,
      ocean: 5,
      deepSea: 10,
      abyss: 20,
      atlantis: 50,
      spaceOcean: 100,
      dragonRealm: 200,
      vipReserve: 5,
    };

    const locationKey = Object.keys(locations).find(
      (key) => locations[key] === location
    );
    if (levelRequirements[locationKey] > playerData.level) {
      const locationMenu =
        "🗺️ CHỌN ĐỊA ĐIỂM CÂU CÁ:\n━━━━━━━━━━━━━━━━━━\n" +
        Object.entries(locations)
          .map(([key, loc], index) => {
            const isVipLocation = key === "vipReserve";
            const vipStatus = getVIPBenefits(event.senderID);
            const hasVipAccess = vipStatus && vipStatus.packageId > 0;

            return `${index + 1}. ${loc.name}\n💰 Phí: ${formatNumber(
              loc.cost
            )} $\n`;
          })
          .join("\n");

      const errorMsg = await api.sendMessage(
        `❌ Bạn cần đạt cấp ${levelRequirements[locationKey]} để câu ở ${location.name}!\n` +
          `📊 Cấp độ hiện tại: ${playerData.level}\n\n` +
          locationMenu,
        event.threadID
      );

      setTimeout(() => {
        api.unsendMessage(errorMsg.messageID);
      }, 20000);

      global.client.onReply.push({
        name: this.name,
        messageID: errorMsg.messageID,
        author: event.senderID,
        type: "location",
        playerData,
      });

      return;
    }
    if (locationKey === "vipReserve") {
      const vipBenefits = getVIPBenefits(event.senderID);
      if (!vipBenefits || vipBenefits.packageId < 3) {
        return api.sendMessage(
          "👑 Khu VIP VÀNG chỉ dành cho người dùng VIP Gold!\n" +
            "❌ Bạn cần nâng cấp lên gói VIP Gold để truy cập khu vực này.\n\n" +
            "Gõ `.vip` để xem thông tin về các gói VIP.",
          event.threadID
        );
      }
    }

    const availableRods = Object.keys(fishingItems).filter((rod) => {
      return (
        playerData.inventory.includes(rod) &&
        fishingItems[rod] &&
        fishingItems[rod].durability > 0
      );
    });

    if (availableRods.length === 0) {
      playerData.rod = "Cần trúc";
      playerData.rodDurability = fishingItems["Cần trúc"].durability;
      playerData.inventory = ["Cần trúc"];
      this.savePlayerData(playerData);
      return api.sendMessage(
        "⚠️ Đã reset về cần câu mặc định do không có cần câu khả dụng!",
        event.threadID
      );
    }

    if (!fishingItems[playerData.rod] || playerData.rodDurability <= 0) {
      const bestRod = availableRods[0];
      playerData.rod = bestRod;
      playerData.rodDurability = fishingItems[bestRod].durability;
      await api.sendMessage(
        `🎣 Tự động chuyển sang ${bestRod} do cần hiện tại không khả dụng!`,
        event.threadID
      );
    }

    if (playerData.energy < ENERGY_SYSTEM.fishingCost) {
      const timeToNext = getNextEnergyTime(playerData);
      return api.sendMessage(
        `${messages.insufficientEnergy(
          playerData.energy,
          ENERGY_SYSTEM.fishingCost
        )}\n` +
          `⏳ Năng lượng phục hồi +1 sau: ${Math.floor(timeToNext / 60)}m${
            timeToNext % 60
          }s\n` +
          `💡 Dùng lệnh '7. Phục hồi năng lượng' trong menu để phục hồi ngay!`,
        event.threadID
      );
    }

    const balance = getBalance(event.senderID);
    if (balance < location.cost) {
      return api.sendMessage(
        messages.insufficientFunds(location.cost, location.name),
        event.threadID
      );
    }

    playerData.energy -= ENERGY_SYSTEM.fishingCost;
    playerData.lastEnergyUpdate = Date.now();
    this.savePlayerData(playerData);

    updateBalance(event.senderID, -location.cost);
    const fishingMsg = await api.sendMessage("🎣 Đang câu...", event.threadID);

    setTimeout(async () => {
      try {
        const result = this.calculateCatch(
          location,
          fishingItems[playerData.rod].multiplier,
          playerData
        );

        playerData.lastFished = now;
        playerData.rodDurability--;

        if (result.lost) {
          playerData.fishingStreak = 1;

          this.savePlayerData({
            ...playerData,
            userID: event.senderID,
          });

          api.unsendMessage(fishingMsg.messageID);

          return api.sendMessage(
            `🎣 Tiếc quá! ${result.message}\n` +
              `⚡ Năng lượng: ${playerData.energy}/${calculateMaxEnergy(
                playerData.level
              )}\n` +
              `🎒 Độ bền cần: ${playerData.rodDurability}/${
                fishingItems[playerData.rod].durability
              }\n` +
              `⏳ Chờ ${cooldownMinutes} phút để câu tiếp!`,
            event.threadID
          );
        }

        const rarity = this.getFishRarity(result.name);

        if (!playerData.collection) {
          playerData.collection = JSON.parse(JSON.stringify(defaultCollection));
        }

        if (!playerData.collection.byRarity[rarity][result.name]) {
          playerData.collection.byRarity[rarity][result.name] = 0;
        }

        playerData.collection.byRarity[rarity][result.name]++;
        playerData.collection.stats.totalCaught++;
        playerData.collection.stats.totalValue += result.value;

        if (
          result.value > (playerData.collection.stats.bestCatch?.value || 0)
        ) {
          playerData.collection.stats.bestCatch = {
            name: result.name,
            value: result.value,
          };
        }

        let baseExp = result.exp * (expMultipliers[rarity] || 1);
        let streakBonus = 0;

        const streak = playerData.fishingStreak || 0;
        for (const [streakThreshold, bonus] of Object.entries(streakBonuses)) {
          if (streak >= parseInt(streakThreshold)) {
            streakBonus = bonus;
          }
        }

        baseExp = Math.floor(baseExp * (1 + streakBonus));

        if (treasures.some((t) => t.name === result.name)) {
          baseExp *= 2;
        }

        playerData.exp = (playerData.exp || 0) + baseExp;
        const oldLevel = playerData.level;

        while (playerData.exp >= calculateRequiredExp(playerData.level)) {
          playerData.exp -= calculateRequiredExp(playerData.level);
          if (playerData.level < expRequirements.maxLevel) {
            playerData.level++;
            await api.sendMessage(
              messages.levelUp(playerData.level),
              event.threadID
            );

            if (levelRewards[playerData.level]) {
              const reward = levelRewards[playerData.level];
              updateBalance(event.senderID, reward.reward);
              await api.sendMessage(reward.message, event.threadID);
            }
          }
        }

        if (now - (playerData.lastFished || 0) < 520000) {
          playerData.fishingStreak = (playerData.fishingStreak || 0) + 1;
        } else {
          playerData.fishingStreak = 1;
        }

        playerData.stats.totalExp = (playerData.stats.totalExp || 0) + baseExp;
        playerData.stats.highestStreak = Math.max(
          playerData.stats.highestStreak || 0,
          playerData.fishingStreak
        );
        playerData.stats.totalFishes = (playerData.stats.totalFishes || 0) + 1;

        this.savePlayerData({
          ...playerData,
          userID: event.senderID,
        });

        updateBalance(event.senderID, result.value);
        api.unsendMessage(fishingMsg.messageID);

        const textMessage =
          `🎣 Bạn đã câu được ${result.name}!\n` +
          `💰 Giá gốc: ${formatNumber(Math.floor(result.originalValue))} $\n` +
          `📋 Thuế: ${formatNumber(result.taxAmount)} $ (${(
            result.taxRate * 100
          ).toFixed(1)}%)\n` +
          `💵 Thực nhận: ${formatNumber(result.value)} $\n` +
          `${
            vipBenefits
              ? `✨ Thưởng EXP VIP x${vipBenefits.fishExpMultiplier || 1}\n` +
                `👑 Thưởng $ VIP +${vipBenefits.packageId * 5 || 0}%\n`
              : ""
          }` +
          `📊 EXP: +${formatNumber(baseExp)} (${this.getExpBreakdown(
            baseExp,
            streakBonus,
            rarity
          )})\n` +
          `📈 Chuỗi câu: ${playerData.fishingStreak} lần (${Math.floor(
            streakBonus * 100
          )}% bonus)\n` +
          `⚡ Năng lượng: ${playerData.energy}/${calculateMaxEnergy(
            playerData.level
          )}\n` +
          `🎚️ Level: ${oldLevel}${
            playerData.level > oldLevel ? ` ➜ ${playerData.level}` : ""
          }\n` +
          `✨ EXP: ${formatNumber(playerData.exp)}/${formatNumber(
            calculateRequiredExp(playerData.level)
          )}\n` +
          `🎒 Độ bền cần: ${playerData.rodDurability}/${
            fishingItems[playerData.rod].durability
          }\n` +
          `💵 Số dư: ${formatNumber(getBalance(event.senderID))} $\n` +
          `⏳ Chờ ${cooldownMinutes} phút để câu tiếp!`;

        try {
          const userName = `Ngư dân #${event.senderID.substring(0, 5)}`;

          const imagePath = await fishCanvas.createFishResultImage({
            userId: event.senderID,
            userName: userName,
            fish: {
              name: result.name,
              rarity: rarity,
              value: result.value,
              originalValue: result.originalValue,
              taxRate: result.taxRate,
              taxAmount: result.taxAmount,
              exp: result.exp,
            },
            fishingData: {
              rod: playerData.rod,
              rodDurability: playerData.rodDurability,
              maxRodDurability: fishingItems[playerData.rod].durability,
              level: playerData.level,
              exp: playerData.exp,
              requiredExp: calculateRequiredExp(playerData.level),
              streak: playerData.fishingStreak,
              energy: playerData.energy,
              maxEnergy: calculateMaxEnergy(playerData.level),
            },
            streakBonus: streakBonus,
            vipBenefits: vipBenefits,
          });

          let resultMessage = `🎣 Bạn đã câu được ${result.name}!`;
          if (result.savedByVip) {
            resultMessage += `\n👑 VIP đã giúp bạn tóm được ${result.vipProtection}% con cá`;
          }

          await api.sendMessage(
            {
              body: resultMessage,
              attachment: fs.createReadStream(imagePath),
            },
            event.threadID,
            (err) => {
              if (err) {
                console.error("Error sending fish result image:", err);

                let textMsg = textMessage;
                if (result.savedByVip) {
                  textMsg =
                    `👑 VIP đã giúp bạn tóm được ${result.vipProtection}% con cá\n` +
                    textMsg;
                }

                api.sendMessage(textMsg, event.threadID);
              }

              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
            }
          );
        } catch (imageError) {
          console.error("Error creating fish result image:", imageError);

          let textMsg = textMessage;
          if (result.savedByVip) {
            textMsg =
              `👑 VIP đã giúp bạn tóm được ${result.vipProtection}% con cá\n` +
              textMsg;
          }

          await api.sendMessage(textMsg, event.threadID);
        }
      } catch (err) {
        console.error("Error in fishing:", err);
        api.sendMessage("❌ Đã xảy ra lỗi khi câu cá!", event.threadID);
      }
    }, 5000);
  },

  calculateCatch: function (location, multiplier, playerData) {
    try {
      const vipBenefits = getVIPBenefits(playerData.userID);

      // Kiểm tra và chọn mồi câu có sẵn
      let activeBait = null;
      let activeBaitName = null;

      if (playerData.baits && Object.keys(playerData.baits).length > 0) {
        // Chọn mồi câu tốt nhất có sẵn
        const availableBaits = Object.entries(playerData.baits)
          .filter(([name, uses]) => uses > 0 && baits[name])
          .sort((a, b) => {
            const qualityA = baits[a[0]].effects.rarityBonus || 0;
            const qualityB = baits[b[0]].effects.rarityBonus || 0;
            return qualityB - qualityA;
          });

        if (availableBaits.length > 0) {
          activeBaitName = availableBaits[0][0];
          activeBait = baits[activeBaitName];
          // Giảm số lượng mồi câu
          playerData.baits[activeBaitName]--;
          if (playerData.baits[activeBaitName] <= 0) {
            delete playerData.baits[activeBaitName];
          }
        }
      }

      const expMultiplier =
        vipBenefits?.fishExpMultiplier > 1 ? vipBenefits.fishExpMultiplier : 1;

      const random = Math.random() * 100;
      const vipMultiplier = vipBenefits?.fishExpMultiplier || 1;

      const vipBonus = vipBenefits ? vipBenefits.packageId * 0.02 : 0;

      // Áp dụng hiệu ứng mồi câu giảm tỉ lệ mất cá
      const baseLossChance = 0.2;
      const baitLossReduction = activeBait
        ? activeBait.effects.lossReduction || 0
        : 0;
      const fishLossChance = Math.max(0.05, baseLossChance - baitLossReduction);
      const willLoseFish = Math.random() < fishLossChance;

      let fishProtected = false;
      if (willLoseFish && vipBenefits) {
        const protectionRate =
          vipBenefits.packageId === 1
            ? 0.5
            : vipBenefits.packageId === 2
            ? 0.75
            : vipBenefits.packageId === 3
            ? 1.0
            : 0;

        fishProtected = Math.random() < protectionRate;
      }

      if (willLoseFish && !fishProtected) {
        return {
          lost: true,
          exp: 1,
          message: activeBait
            ? `Dù đã dùng ${activeBaitName}, cá vẫn vùng vẫy và thoát khỏi lưỡi câu!`
            : "Cá vùng vẫy và thoát khỏi lưỡi câu!",
        };
      }

      const savedByVip = willLoseFish && fishProtected;

      let chances = {
        trash: location.fish.trash || 0,
        common: location.fish.common || 0,
        uncommon: location.fish.uncommon || 0,
        rare: location.fish.rare || 0,
        legendary: location.fish.legendary || 0,
        mythical: location.fish.mythical || 0,
        cosmic: location.fish.cosmic || 0,
      };

      // Áp dụng hiệu ứng mồi câu tăng tỉ lệ bắt cá hiếm
      if (activeBait) {
        const rarityBonus = activeBait.effects.rarityBonus || 0;

        chances.trash = Math.max(0, chances.trash * (1 - rarityBonus * 2));
        chances.rare *= 1 + rarityBonus;
        chances.legendary *= 1 + rarityBonus * 1.5;
        chances.mythical *= 1 + rarityBonus * 2;
        chances.cosmic *= 1 + rarityBonus * 3;

        chances.common *= 1 - rarityBonus * 0.5;
        chances.uncommon *= 1 - rarityBonus * 0.3;
      }

      if (vipBenefits) {
        chances.trash = Math.max(
          0,
          chances.trash * (1 - vipBenefits.trashReduction)
        );

        const rareBonus = 0.1 + vipBenefits.packageId * 0.15;
        chances.rare *= 1 + rareBonus;
        chances.legendary *= 1 + rareBonus;
        chances.mythical *= 1 + rareBonus;
        chances.cosmic *= 1 + rareBonus * 1.5;

        chances.common *= 1 - rareBonus * 0.3;
        chances.uncommon *= 1 - rareBonus * 0.2;
      }

      const isVipLocation =
        Object.keys(locations).find((key) => locations[key] === location) ===
        "vipReserve";
      const vipLocationBonus = isVipLocation ? 0.25 : 0;

      if (isVipLocation) {
        chances.trash *= 0.5;
        chances.rare *= 1.5;
        chances.legendary *= 1.75;
        chances.mythical *= 2.0;
        chances.cosmic *= 2.5;
      }

      const total = Object.values(chances).reduce((a, b) => a + b, 0);
      for (let type in chances) {
        chances[type] = (chances[type] / total) * 100;
      }

      let currentProb = 0;
      let type = "common";
      for (const [fishType, chance] of Object.entries(chances)) {
        currentProb += chance;
        if (random <= currentProb) {
          type = fishType;
          break;
        }
      }

      const treasureChance =
        0.05 + (vipBenefits ? 0.02 * vipBenefits.packageId : 0);
      if (Math.random() < treasureChance) {
        const treasure =
          treasures[Math.floor(Math.random() * treasures.length)];
        const originalValue = Math.floor(treasure.value * multiplier);
        const taxRate = this.calculateTaxRate("legendary", originalValue);
        const taxAmount = Math.floor(originalValue * taxRate);
        // Áp dụng bonus từ mồi nếu có
        const valueBonus = activeBait ? activeBait.effects.valueBonus || 0 : 0;
        const finalValue = Math.floor(
          originalValue * (1 + (vipBonus || 0) + valueBonus) - taxAmount
        );
        const exp = Math.floor(50 * (vipBenefits?.fishExpMultiplier || 1));

        return {
          name: treasure.name,
          value: finalValue,
          exp: exp,
          taxRate: taxRate,
          taxAmount: taxAmount,
          originalValue: originalValue,
          usedBait: activeBaitName,
        };
      }

      const fishArray = Array.isArray(fishTypes[type]) ? fishTypes[type] : [];
      if (!fishArray.length) {
        return {
          name: "Cá Thường",
          value: 1000,
          exp: 5,
          usedBait: activeBaitName,
        };
      }

      const fish = fishArray[Math.floor(Math.random() * fishArray.length)];
      const baseExp =
        fish.exp ||
        (type === "trash"
          ? 1
          : type === "common"
          ? 5
          : type === "uncommon"
          ? 10
          : type === "rare"
          ? 20
          : type === "legendary"
          ? 50
          : type === "mythical"
          ? 100
          : type === "cosmic"
          ? 200
          : 5);

      // Áp dụng bonus từ mồi nếu có
      const valueBonus = activeBait ? activeBait.effects.valueBonus || 0 : 0;
      const expBonus = activeBait ? activeBait.effects.expBonus || 0 : 0;

      const baseValue = fish.value * multiplier * (1 + vipBonus + valueBonus);
      const taxRate = this.calculateTaxRate(type, baseValue);
      const taxAmount = Math.floor(baseValue * taxRate);
      const finalValue = Math.floor(baseValue - taxAmount);
      const finalExp = Math.floor(
        baseExp * (vipBenefits?.fishExpMultiplier || 1) * (1 + expBonus)
      );

      return {
        name: fish.name,
        value: finalValue || 1000,
        exp: finalExp || 5,
        taxRate: taxRate,
        taxAmount: taxAmount,
        originalValue: baseValue,
        savedByVip: savedByVip,
        vipProtection: vipBenefits
          ? vipBenefits.packageId === 1
            ? 50
            : vipBenefits.packageId === 2
            ? 75
            : vipBenefits.packageId === 3
            ? 100
            : 0
          : 0,
        usedBait: activeBaitName,
      };
    } catch (error) {
      console.error("Error in calculateCatch:", error);
      return {
        name: "Cá Thường",
        value: 1000,
        exp: 5,
        taxRate: 0,
        taxAmount: 0,
        originalValue: 1000,
      };
    }
  },
  handleBaitPurchase: async function (
    api,
    event,
    baitName,
    baitInfo,
    playerData,
    quantity = 1
  ) {
    const { senderID, threadID } = event;
    const totalCost = baitInfo.price * quantity;
    const balance = getBalance(senderID);

    if (balance < totalCost) {
      return api.sendMessage(
        `❌ Không đủ tiền để mua ${quantity} ${baitName}!\n` +
          `💰 Tổng giá: ${formatNumber(totalCost)}$\n` +
          `💵 Số dư: ${formatNumber(balance)}$\n` +
          `🔴 Còn thiếu: ${formatNumber(totalCost - balance)}$`,
        threadID
      );
    }

    try {
      updateBalance(senderID, -totalCost);

      if (!playerData.baits) playerData.baits = {};
      playerData.baits[baitName] =
        (playerData.baits[baitName] || 0) + baitInfo.uses * quantity;

      this.savePlayerData({
        ...playerData,
        userID: senderID,
      });

      return api.sendMessage(
        `✅ Đã mua thành công ${quantity} ${baitName}!\n` +
          `🎣 Tổng lượt sử dụng: ${playerData.baits[baitName]} lần\n` +
          `💰 Đã chi: ${formatNumber(totalCost)}$\n` +
          `💵 Số dư còn lại: ${formatNumber(getBalance(senderID))}$`,
        threadID
      );
    } catch (err) {
      console.error("Error in bait purchase:", err);
      return api.sendMessage("❌ Đã xảy ra lỗi khi mua mồi câu!", threadID);
    }
  },
  handleCrafting: async function (
    api,
    event,
    recipeName,
    recipeInfo,
    playerData
  ) {
    const { senderID, threadID } = event;
    const balance = getBalance(senderID);

    if (playerData.level < recipeInfo.level) {
      return api.sendMessage(
        `❌ Bạn cần đạt cấp độ ${recipeInfo.level} để chế tạo ${recipeName}!\n` +
          `📊 Cấp độ hiện tại: ${playerData.level}`,
        threadID
      );
    }

    if (balance < recipeInfo.price) {
      return api.sendMessage(
        `❌ Không đủ tiền để chế tạo ${recipeName}!\n` +
          `💰 Cần: ${formatNumber(recipeInfo.price)} $\n` +
          `💵 Bạn có: ${formatNumber(balance)} $`,
        threadID
      );
    }

    if (!playerData.craftingMaterials) playerData.craftingMaterials = {};

    let missingMaterials = [];
    for (const [material, count] of Object.entries(recipeInfo.materials)) {
      const userHas =
        (playerData.craftingMaterials[material] || 0) +
        (playerData.inventory.filter((i) => i === material).length || 0);

      if (userHas < count) {
        missingMaterials.push(`${material} (có ${userHas}/${count})`);
      }
    }

    if (missingMaterials.length > 0) {
      return api.sendMessage(
        `❌ Thiếu nguyên liệu để chế tạo ${recipeName}!\n` +
          `📦 Còn thiếu: ${missingMaterials.join(", ")}\n\n` +
          `💡 Gõ ".fish shop" để mua thêm nguyên liệu`,
        threadID
      );
    }

    try {
      updateBalance(senderID, -recipeInfo.price);

      for (const [material, count] of Object.entries(recipeInfo.materials)) {
        const materialCount = playerData.craftingMaterials[material] || 0;
        if (materialCount >= count) {
          playerData.craftingMaterials[material] -= count;
          continue;
        }

        const remainingCount = count - materialCount;
        playerData.craftingMaterials[material] = 0;

        let removed = 0;
        playerData.inventory = playerData.inventory.filter((item) => {
          if (item === material && removed < remainingCount) {
            removed++;
            return false;
          }
          return true;
        });
      }

      this.addToInventory(playerData, recipeInfo.result.name);

      if (!fishingItems[recipeInfo.result.name]) {
        fishingItems[recipeInfo.result.name] = {
          durability: recipeInfo.result.durability,
          price: recipeInfo.price * 1.5,
          multiplier: recipeInfo.result.multiplier,
          special: recipeInfo.result.special || null,
        };
      }

      this.savePlayerData({
        ...playerData,
        userID: senderID,
      });

      return api.sendMessage(
        `✅ Chế tạo thành công ${recipeName}!\n` +
          `🎣 Cần câu mới: ${recipeInfo.result.name}\n` +
          `⚡ Độ bền: ${recipeInfo.result.durability}\n` +
          `📈 Tỉ lệ: x${recipeInfo.result.multiplier}\n` +
          `${
            recipeInfo.result.special
              ? `🔮 Đặc biệt: ${recipeInfo.result.special}\n`
              : ""
          }` +
          `💰 Số dư còn lại: ${formatNumber(getBalance(senderID))} $`,
        threadID
      );
    } catch (err) {
      console.error("Error in crafting:", err);
      return api.sendMessage("❌ Đã xảy ra lỗi khi chế tạo cần câu!", threadID);
    }
  },
  calculateTaxRate: function (type, value) {
    const baseTaxRates = {
      trash: 0,
      common: 0.02,
      uncommon: 0.04,
      rare: 0.6,
      legendary: 0.8,
      mythical: 0.12,
      cosmic: 0.15,
    };

    let progressiveTax = 0;
    if (value > 1000) progressiveTax = 0.02;
    if (value > 5000) progressiveTax = 0.5;
    if (value > 10000) progressiveTax = 0.8;
    if (value > 25000) progressiveTax = 1.0;

    return Math.min(0.05, (baseTaxRates[type] || 0.01) + progressiveTax);
  },

  getFishRarity: function (fishName) {
    for (const [rarity, fishes] of Object.entries(fishTypes)) {
      if (fishes.some((fish) => fish.name === fishName)) return rarity;
    }
    return "common";
  },

  getExpBreakdown: function (totalExp, streakBonus, rarity) {
    try {
      if (!totalExp || !expMultipliers[rarity]) {
        return `Cơ bản: ${formatNumber(totalExp || 0)}`;
      }

      const multiplier = expMultipliers[rarity] || 1;
      const streak = streakBonus || 0;
      const base = Math.floor(totalExp / ((1 + streak) * multiplier));

      return `Cơ bản: ${formatNumber(base)} × ${multiplier} (${rarity}) × ${(
        1 + streak
      ).toFixed(1)} (chuỗi)`;
    } catch (error) {
      console.error("Error in getExpBreakdown:", error);
      return `Cơ bản: ${formatNumber(totalExp || 0)}`;
    }
  },

  loadAllPlayers: function () {
    const dataPath = path.join(__dirname, "../database/json/fishing.json");
    try {
      if (fs.existsSync(dataPath)) {
        return JSON.parse(fs.readFileSync(dataPath, "utf8"));
      }
    } catch (err) {
      console.error("Error loading all players:", err);
    }
    return {};
  },

  addToInventory: function (playerData, itemName) {
    if (!playerData.inventory) playerData.inventory = [];
    if (!playerData.inventory.includes(itemName)) {
      playerData.inventory.push(itemName);
    }
  },

  handleShopPurchase: async function (
    api,
    event,
    rodName,
    rodInfo,
    playerData
  ) {
    const { senderID, threadID } = event;
    const balance = getBalance(senderID);

    if (balance < rodInfo.price) {
      return api.sendMessage(`❌ Bạn không đủ tiền mua ${rodName}!`, threadID);
    }

    try {
      updateBalance(senderID, -rodInfo.price);

      const userData = {
        ...playerData,
        userID: senderID,
        rod: rodName,
        rodDurability: rodInfo.durability,
      };

      if (!userData.inventory.includes(rodName)) {
        userData.inventory.push(rodName);
      }

      this.savePlayerData(userData);

      return api.sendMessage(
        `✅ Đã mua thành công ${rodName}!\n` +
          `💰 Số dư còn lại: ${formatNumber(getBalance(senderID))} $`,
        threadID
      );
    } catch (err) {
      console.error("Error in shop purchase:", err);
      return api.sendMessage("❌ Đã xảy ra lỗi khi mua cần câu!", threadID);
    }
  },

  validatePlayerStats: function (playerData) {
    if (!fishingItems || !fishingItems["Cần trúc"]) {
      throw new Error("fishingItems configuration is missing or invalid");
    }

    playerData.exp = playerData.exp || 0;
    playerData.level = playerData.level || 1;
    playerData.rod = fishingItems[playerData.rod] ? playerData.rod : "Cần trúc";
    playerData.inventory = Array.isArray(playerData.inventory)
      ? playerData.inventory
      : ["Cần trúc"];

    playerData.inventory = playerData.inventory.filter(
      (item) => fishingItems[item]
    );
    if (!playerData.inventory.includes("Cần trúc")) {
      playerData.inventory.push("Cần trúc");
    }

    const maxDurability =
      fishingItems[playerData.rod]?.durability ||
      fishingItems["Cần trúc"].durability;
    if (
      typeof playerData.rodDurability !== "number" ||
      playerData.rodDurability < 0 ||
      playerData.rodDurability > maxDurability
    ) {
      playerData.rodDurability = maxDurability;
    }

    playerData.exp = Math.max(0, playerData.exp);
    playerData.level = Math.max(1, playerData.level);
    playerData.rodDurability = Math.max(0, playerData.rodDurability);

    return playerData;
  },

  getRankingStats: function (allPlayers) {
    const maxValues = Object.values(allPlayers).reduce(
      (max, data) => {
        const totalValue = data.collection?.stats?.totalValue || 0;
        const totalCaught = Object.values(
          data.collection?.byRarity || {}
        ).reduce(
          (acc, curr) => acc + Object.values(curr).reduce((a, b) => a + b, 0),
          0
        );

        return {
          level: Math.max(max.level, data.level || 1),
          totalCaught: Math.max(max.totalCaught, totalCaught),
          totalValue: Math.max(max.totalValue, totalValue),
        };
      },
      { level: 1, totalCaught: 0, totalValue: 0 }
    );

    return Object.entries(allPlayers)
      .map(([id, data]) => {
        const totalCaught = Object.values(
          data.collection?.byRarity || {}
        ).reduce(
          (acc, curr) => acc + Object.values(curr).reduce((a, b) => a + b, 0),
          0
        );
        const totalValue = data.collection?.stats?.totalValue || 0;

        const levelScore =
          ((data.level || 1) / Math.max(1, maxValues.level)) * 40;
        const caughtScore =
          (totalCaught / Math.max(1, maxValues.totalCaught)) * 30;
        const valueScore =
          (totalValue / Math.max(1, maxValues.totalValue)) * 30;

        const totalScore =
          Math.round((levelScore + caughtScore + valueScore) * 100) / 100;

        return {
          id,
          level: data.level || 1,
          exp: data.exp || 0,
          totalCaught,
          totalValue,
          adjustedValue: Math.ceil(totalValue / 1000),
          bestCatch: data.collection?.stats?.bestCatch || {
            name: "Chưa có",
            value: 0,
          },
          adjustedBestCatchValue: Math.ceil(
            (data.collection?.stats?.bestCatch?.value || 0) / 1000
          ),
          streak: data.fishingStreak || 0,
          highestStreak: data.stats?.highestStreak || 0,
          score: totalScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  },
};
