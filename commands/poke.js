const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pokeSystem = require('../poke/pokemonSystem');
const currencies = require('../utils/currencies');
const { system: catchSystem } = require('../poke/catchSystem');
const { createBattleImage } = require('../poke/canvasHelper'); 

module.exports = {
    name: "poke",
    dev: "HNT",
    usedby: 2,
    info: "săn Pokemon",
    onPrefix: true,
    usages: ".poke [catch/bag/select/battle/info]",
    cooldowns: 2,

    async handleEvolution(api, threadID, evolution) {
        if (!evolution || evolution === true) return;

        const { oldPokemon, newPokemon } = evolution;
        
        const oldResponse = await axios.get(oldPokemon.image, { responseType: 'arraybuffer' });
        const oldImagePath = path.join(__dirname, 'cache', 'pokemon_old.png');
        await fs.promises.writeFile(oldImagePath, oldResponse.data);

        const newResponse = await axios.get(newPokemon.image, { responseType: 'arraybuffer' });
        const newImagePath = path.join(__dirname, 'cache', 'pokemon_new.png');
        await fs.promises.writeFile(newImagePath, newResponse.data);

        await api.sendMessage(
            {
                body: "✨ POKEMON TIẾN HÓA ✨\n" +
                      "━━━━━━━━━━━━━━━━━\n\n" +
                      `${oldPokemon.name.toUpperCase()} đã tiến hóa thành ${newPokemon.name.toUpperCase()}!\n\n` +
                      "📊 CHỈ SỐ MỚI:\n" +
                      `❤️ HP: ${oldPokemon.hp} → ${newPokemon.hp}\n` +
                      `⚔️ ATK: ${oldPokemon.attack} → ${newPokemon.attack}\n` +
                      `🛡️ DEF: ${oldPokemon.defense} → ${newPokemon.defense}\n` +
                      `🎭 Hệ: ${newPokemon.types.map(t => 
                          `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                      ).join(' | ')}`,
                attachment: [
                    fs.createReadStream(oldImagePath),
                    fs.createReadStream(newImagePath)
                ]
            },
            threadID
        );
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        await pokeSystem.init();

        if (await pokeSystem.requirePlayerName(senderID)) {
            if (!target[0]) {
                return api.sendMessage(
                    "🎮 CHÀO MỪNG ĐẾN VỚI POKEMON GAME! 🎮\n" +
                    "━━━━━━━━━━━━━━━━━\n\n" +
                    "👋 Để bắt đầu, hãy đặt tên cho nhân vật của bạn!\n" +
                    "Cách dùng: .poke register [tên của bạn]\n" +
                    "VD: .poke register Ash\n\n" +
                    "📝 Lưu ý: Tên nhân vật không quá 15 ký tự\n" +
                    "và không chứa ký tự đặc biệt!",
                    threadID,
                    messageID
                );
            }

            if (target[0].toLowerCase() === "register") {
                const name = target.slice(1).join(" ");
                if (!name) {
                    return api.sendMessage("❌ Vui lòng nhập tên nhân vật!", threadID, messageID);
                }

                if (name.length > 15) {
                    return api.sendMessage("❌ Tên nhân vật không được quá 15 ký tự!", threadID, messageID);
                }

                if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
                    return api.sendMessage("❌ Tên chỉ được chứa chữ cái và số!", threadID, messageID);
                }

                await pokeSystem.setPlayerName(senderID, name);
                return api.sendMessage(
                    `🎉 Chào mừng ${name} đến với thế giới Pokemon!\n` +
                    "Dùng lệnh .poke để xem hướng dẫn chơi game nhé!",
                    threadID,
                    messageID
                );
            }

            return api.sendMessage(
                "❌ Bạn cần đăng ký tên nhân vật trước!\n" +
                "Dùng lệnh: .poke register [tên của bạn]",
                threadID,
                messageID
            );
        }

        const command = target[0]?.toLowerCase();
        const param = target[1];
        try {
            switch (command) {
                case "catch": {
                    if (!param) {
                        const locations = catchSystem.getAllLocations();
                        const locationList = locations.map(loc => 
                            `${loc.id}. ${loc.name}\n` +
                            `   💰 Phí: ${loc.cost.toLocaleString()}xu\n` +
                            `   ⏳ Hồi: ${loc.cooldown/60000} phút\n` +
                            `   📊 Cấp: ${loc.level.min}-${loc.level.max}`
                        ).join('\n\n');

                        return api.sendMessage(
                            "🗺️ KHU VỰC SĂN POKEMON 🗺️\n" +
                            "━━━━━━━━━━━━━━━━━\n\n" +
                            locationList + "\n\n" +
                            "Cách dùng: .poke catch [khu vực]\n" +
                            "VD: .poke catch forest",
                            threadID
                        );
                    }

                    const location = catchSystem.getLocation(param);
                    if (!location) {
                        return api.sendMessage("❌ Khu vực không hợp lệ!", threadID);
                    }

                    if (catchSystem.isHunting(senderID, param)) {
                        return api.sendMessage(
                            "❌ Bạn đang trong quá trình bắt Pokemon!\n" +
                            "→ Hãy trả lời tin nhắn bắt Pokemon trước đó.",
                            threadID
                        );
                    }

                    const cooldownCheck = await catchSystem.checkHuntCooldown(senderID, param);
                    if (!cooldownCheck.canHunt) {
                        if (cooldownCheck.reason === "cooldown") {
                            const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000);
                            return api.sendMessage(
                                `⏳ Vui lòng đợi ${timeLeft} giây nữa để săn ở ${location.name}!`,
                                threadID
                            );
                        }
                        return api.sendMessage(
                            "❌ Bạn đang trong quá trình bắt Pokemon khác!",
                            threadID
                        );
                    }

                    const balance = await currencies.getBalance(senderID);
                    if (balance < location.cost) {
                        return api.sendMessage(
                            `❌ Bạn cần ${location.cost.toLocaleString()}xu để săn ở ${location.name}!\n` +
                            `💰 Số dư: ${balance.toLocaleString()}xu`,
                            threadID
                        );
                    }

                    catchSystem.setActiveHunt(senderID, param, true);

                    try {
                        const weather = catchSystem.getCurrentWeather();
                        
                        const pokemon = await pokeSystem.generatePokemon({
                            minLevel: location.level.min,
                            maxLevel: location.level.max,
                            preferredTypes: catchSystem.getPreferredTypes(location, weather),
                            rarityMultiplier: catchSystem.calculateRarity(location, weather),
                            weather: weather
                        });

                        const bestBall = await pokeSystem.getBestAvailableBall(senderID);
                        if (!bestBall) {
                            catchSystem.setActiveHunt(senderID, param, false);
                            return api.sendMessage(
                                "❌ Bạn đã hết bóng trong kho!\n" +
                                "Dùng .poke buy để mua thêm bóng.",
                                threadID
                            );
                        }

                        const response = await axios.get(pokemon.image, { responseType: 'arraybuffer' });
                        const imagePath = path.join(__dirname, 'cache', 'pokemon_catch.png');
                        await fs.promises.writeFile(imagePath, response.data);

                        await currencies.setBalance(senderID, balance - location.cost);

                        const catchMsg = await api.sendMessage({
                            body: `🎯 Bạn đã gặp ${pokemon.name} (Cấp ${pokemon.level})!\n` +
                                  `🌤️ Thời tiết: ${weather}\n` +
                                  `💪 Chỉ số:\n` +
                                  `❤️ HP: ${pokemon.hp}\n` +
                                  `⚔️ Tấn công: ${pokemon.attack}\n` +
                                  `🛡️ Phòng thủ: ${pokemon.defense}\n` +
                                  `🎭 Hệ: ${pokemon.types.map(t => 
                                      `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                                  ).join(' | ')}\n\n` +
                                  `${bestBall.ball.emoji} Sẽ dùng ${bestBall.ball.name} để bắt (còn ${bestBall.count} bóng)\n\n` +
                                  "Reply 'yes' để bắt, 'no' để bỏ qua.",
                            attachment: fs.createReadStream(imagePath)
                        }, threadID);

                        global.client.onReply.push({
                            name: this.name,
                            messageID: catchMsg.messageID,
                            author: senderID,
                            type: "catch",
                            pokemon: pokemon,
                            bestBall: bestBall.type,
                            locationId: param,
                            weather: weather,
                            msgID: catchMsg.messageID
                        });

                    } catch (error) {
                        console.error(error);
                        catchSystem.setActiveHunt(senderID, param, false);
                        return api.sendMessage("❌ Đã xảy ra lỗi khi tạo Pokemon!", threadID);
                    }
                    return;
                }

                case "list":
                case "bag":
                    const page = parseInt(param) || 1;
                    const bagData = await pokeSystem.getBag(senderID, page);
                    
                    if (!bagData) {
                        return api.sendMessage("Bạn chưa có Pokemon nào! Dùng .poke catch để bắt Pokemon.", threadID, messageID);
                    }

                    let msg = "🎒 BAG POKEMON CỦA BẠN 🎒\n" + 
                             `Trang ${bagData.pagination.current}/${bagData.pagination.total}\n` +
                             "━━━━━━━━━━━━━━━━\n\n";
                    
                    bagData.pokemons.forEach((p, idx) => {
                        const actualIndex = bagData.pagination.start + idx;
                        const isActive = actualIndex === bagData.player.activePokemon;
                        const types = p.types.map(type => 
                            `${pokeSystem.getTypeEmoji(type)} ${pokeSystem.getTypeName(type)}`
                        ).join(' | ');
                        const power = pokeSystem.calculatePower(p);
                        
                        msg += `${isActive ? "👉 " : ""}${actualIndex + 1}. ${p.name.toUpperCase()}\n`;
                        msg += `   Lv.${p.level} | 🎭 Hệ: ${types}\n`;
                        msg += `   ❤️ HP:${p.hp} | ⚔️ ATK:${p.attack} | 🛡️ DEF:${p.defense}\n`;
                        msg += `   💪 Sức mạnh: ${pokeSystem.getPowerBar(power)} ${power}\n`;
                        if (isActive) msg += `   🎯 Pokemon đang được chọn\n`;
                        msg += "━━━━━━━━━━━━\n";
                    });

                    msg += `\n📑 Trang ${bagData.pagination.current}/${bagData.pagination.total}\n`;
                    msg += `Tổng số Pokemon: ${bagData.pagination.totalItems}\n\n`;
                    msg += "Hướng dẫn:\n";
                    msg += "• Xem trang: .poke bag [số trang]\n";
                    msg += "• Chọn Pokemon: .poke select [số thứ tự]\n";
                    msg += "• Tìm theo tên: .poke find [tên]\n";

                    return api.sendMessage(msg, threadID, messageID);

                case "find":
                case "search":
                    if (!param) {
                        return api.sendMessage("❌ Vui lòng nhập tên Pokemon cần tìm!", threadID, messageID);
                    }

                    const foundPokemons = await pokeSystem.search(senderID, param);
                    if (!foundPokemons || foundPokemons.length === 0) {
                        return api.sendMessage(`❌ Không tìm thấy Pokemon nào có tên "${param}"!`, threadID, messageID);
                    }

                    let searchMsg = `🔍 TÌM THẤY ${foundPokemons.length} POKEMON:\n━━━━━━━━━━━━━━━━━\n\n`;
                    foundPokemons.forEach((p, idx) => {
                        const types = p.types.map(type => pokeSystem.getTypeEmoji(type)).join(' ');
                        const power = pokeSystem.calculatePower(p);
                        searchMsg += `${idx + 1}. ${p.name.toUpperCase()} ${types}\n`;
                        searchMsg += `   Lv.${p.level} | HP:${p.hp} | ATK:${p.attack} | DEF:${p.defense}\n`;
                        searchMsg += `   💪 Power: ${pokeSystem.getPowerBar(power)} ${power}\n`;
                        searchMsg += "━━━━━━━━━━━━\n";
                    });

                    return api.sendMessage(searchMsg, threadID, messageID);

                case "select":
                    const index = parseInt(param) - 1;
                    if (isNaN(index)) {
                        return api.sendMessage("❌ Vui lòng nhập số thứ tự Pokemon!", threadID, messageID);
                    }

                    const success = await pokeSystem.selectPokemon(senderID, index);
                    if (!success) {
                        return api.sendMessage("❌ Pokemon không hợp lệ!", threadID, messageID);
                    }

                    const selectedPokemon = await pokeSystem.getSelectedPokemon(senderID);
                    return api.sendMessage(
                        `✅ Đã chọn ${selectedPokemon.name.toUpperCase()} làm Pokemon thi đấu!`,
                        threadID,
                        messageID
                    );

                    case "battle":
                        const mentionedId = Object.keys(event.mentions)[0];
                        if (!mentionedId) {
                            return api.sendMessage(
                                "❌ Vui lòng tag người bạn muốn thách đấu!\n" +
                                "💡 Cách dùng: .poke battle @tên_người_chơi",
                                threadID, 
                                messageID
                            );
                        }
            
                        const player1Pokemon = await pokeSystem.getSelectedPokemon(senderID);
                        const player2Pokemon = await pokeSystem.getSelectedPokemon(mentionedId);
            
                        if (!player1Pokemon) {
                            return api.sendMessage(
                                "❌ Bạn chưa có Pokemon nào được chọn!\n" +
                                "1️⃣ Dùng .poke catch để bắt Pokemon\n" +
                                "2️⃣ Dùng .poke select [số] để chọn Pokemon",
                                threadID,
                                messageID
                            );
                        }
            
                        if (!player2Pokemon) {
                            return api.sendMessage(
                                "❌ Đối thủ chưa có Pokemon nào được chọn!\n" +
                                "→ Hãy nhắc đối thủ bắt và chọn Pokemon trước khi thách đấu",
                                threadID,
                                messageID
                            );
                        }
            
                        const player1Name = await pokeSystem.getPlayerName(senderID);
                        const player2Name = await pokeSystem.getPlayerName(mentionedId);
                        
                        try {
                            const battleImage = await createBattleImage(
                                player1Pokemon.image,
                                player2Pokemon.image,
                                player1Name,
                                player2Name,
                                player1Pokemon.name,
                                player2Pokemon.name
                            );
                
                            await api.sendMessage({
                                body: "⚔️ BATTLE POKEMON ⚔️\n" +
                                      "━━━━━━━━━━━━━━━━━\n\n" +
                                      `🔵 ${player1Name} với ${player1Pokemon.name.toUpperCase()} (Lv.${player1Pokemon.level})\n` +
                                      `🎭 Hệ: ${player1Pokemon.types.map(t => 
                                          `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                                      ).join(' | ')}\n` +
                                      `   ❤️ HP: ${player1Pokemon.hp}\n` +
                                      `   ⚔️ ATK: ${player1Pokemon.attack}\n` +
                                      `   🛡️ DEF: ${player1Pokemon.defense}\n\n` +
                                      `⚔️ VS ⚔️\n\n` +
                                      `🔴 ${player2Name} với ${player2Pokemon.name.toUpperCase()} (Lv.${player2Pokemon.level})\n` +
                                      `🎭 Hệ: ${player2Pokemon.types.map(t => 
                                          `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                                      ).join(' | ')}\n` +
                                      `   ❤️ HP: ${player2Pokemon.hp}\n` +
                                      `   ⚔️ ATK: ${player2Pokemon.attack}\n` +
                                      `   🛡️ DEF: ${player2Pokemon.defense}\n\n` +
                                      "🎯 Trận đấu bắt đầu trong 20 giây...",
                                attachment: battleImage
                            }, threadID);
                
                        } catch (error) {
                            console.error('Battle error:', error);
                            return api.sendMessage("❌ Đã xảy ra lỗi khi tạo trận đấu!", threadID, messageID);
                        }
            
                        await new Promise(resolve => setTimeout(resolve, 20000));
            
                        const battleResult = await pokeSystem.battle(senderID, mentionedId, threadID);
                        const player = await pokeSystem.getPlayer(senderID);
                        
                        const battleFinalMsg = "🏆 KẾT QUẢ CUỐI CÙNG 🏆\n" +
                                               "━━━━━━━━━━━━━━━━━\n\n" +
                                               `👑 Người thắng: ${battleResult.winner.name.toUpperCase()}\n` +
                                               `❤️ HP còn lại: ${battleResult.winner.remainingHp}\n` +
                                               `✨ EXP nhận được: ${battleResult.expGained || 0}\n\n` +
                                               `💀 Người thua: ${battleResult.loser.name.toUpperCase()}\n` +
                                               `❤️ HP còn lại: ${battleResult.loser.remainingHp}\n\n` +
                                               `💡 Dùng .poke info để xem thống kê trận đấu`;
                        
                        await api.sendMessage(battleFinalMsg, threadID, messageID);
            
                        if (battleResult.winner.id === senderID && player) { 
                            const levelUp = await pokeSystem.checkLevelUp(senderID, player.activePokemon);
                            if (levelUp && levelUp !== true) {
                                await this.handleEvolution(api, threadID, levelUp);
                            }
                        }
            
                        return;            

                case "wild":
                case "pve":
                    const playerPokemon = await pokeSystem.getSelectedPokemon(senderID);
                    if (!playerPokemon) {
                        return api.sendMessage(
                            "❌ Bạn chưa có Pokemon nào được chọn!\n" +
                            "1️⃣ Dùng .poke catch để bắt Pokemon\n" +
                            "2️⃣ Dùng .poke select [số] để chọn Pokemon",
                            threadID,
                            messageID
                        );
                    }

                    const pveResult = await pokeSystem.pve(senderID);
                    const pvePlayer = await pokeSystem.getPlayer(senderID); 
                    
                    if (pveResult?.error === "cooldown") {
                        const timeLeft = Math.ceil(pveResult.timeLeft / 1000);
                        return api.sendMessage(
                            `❌ Bạn cần đợi ${timeLeft} giây nữa để tiếp tục đánh wild Pokemon!`,
                            threadID,
                            messageID
                        );
                    }

                    const wildPokemon = pveResult.winner === playerPokemon ? pveResult.loser : pveResult.winner;
                    
                    await api.sendMessage(
                        "⚔️ WILD POKEMON BATTLE ⚔️\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        `👊 ${playerPokemon.name.toUpperCase()} (Lv.${playerPokemon.level})\n` +
                        `🎭 Hệ: ${playerPokemon.types.map(t => 
                            `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                        ).join(' | ')}\n` +
                        `   ❤️ HP: ${playerPokemon.hp}\n` +
                        `   ⚔️ ATK: ${playerPokemon.attack}\n` +
                        `   🛡️ DEF: ${playerPokemon.defense}\n\n` +
                        `🆚 VS 🆚\n\n` +
                        `👊 ${wildPokemon.name.toUpperCase()} (Lv.${wildPokemon.level})\n` +
                        `🎭 Hệ: ${wildPokemon.types.map(t => 
                            `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                        ).join(' | ')}\n` +
                        `   ❤️ HP: ${wildPokemon.hp}\n` +
                        `   ⚔️ ATK: ${wildPokemon.attack}\n` +
                        `   🛡️ DEF: ${wildPokemon.defense}\n\n` +
                        "🎯 Trận đấu bắt đầu trong 15 giây...",
                        threadID
                    );

                    await new Promise(resolve => setTimeout(resolve, 15000));

                    const finalMsg = "🏆 KẾT QUẢ TRẬN ĐẤU 🏆\n" +
                                   "━━━━━━━━━━━━━━━━━\n\n" +
                                   `${pveResult.winner === playerPokemon ? "🎉 Bạn đã chiến thắng!" : "💀 Bạn đã thua!"}\n\n` +
                                   `👊 ${playerPokemon.name.toUpperCase()}\n` +
                                   `❤️ HP còn lại: ${pveResult.finalHP.player}\n` +
                                   (pveResult.winner === playerPokemon ? 
                                    `✨ EXP nhận được: ${pveResult.expGained}\n` +
                                    `💰 Coins nhận được: ${pveResult.rewardCoins.toLocaleString()} xu\n` : "") +
                                   `\n🆚 ${wildPokemon.name.toUpperCase()}\n` +
                                   `❤️ HP còn lại: ${pveResult.finalHP.wild}`;

                    await api.sendMessage(finalMsg, threadID, messageID);

                    if (pveResult.winner === playerPokemon && pvePlayer) { 
                        const levelUp = await pokeSystem.checkLevelUp(senderID, pvePlayer.activePokemon);
                        if (levelUp && levelUp !== true) {
                            await this.handleEvolution(api, threadID, levelUp);
                        }
                    }

                    return;
                    
                case "balls":
                case "inventory": {
                    const player = await pokeSystem.getPlayer(senderID);
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }
                
                    try {
                        const userBalance = parseInt(await currencies.getBalance(senderID)) || 0;
                        
                        const inv = player.inventory || {};
                        
                        const ballList = Object.entries(pokeSystem.POKEBALLS)
                            .map(([key, ball]) => {
                                const count = inv[key] || 0;
                                const price = ball.price ? ball.price.toLocaleString() : '0';
                                return `${ball.emoji} ${ball.name}: ${count} (${price} xu)`;
                            })
                            .join('\n');
                
                        return api.sendMessage(
                            "🎒 KHO POKÉBALL 🎒\n" +
                            "━━━━━━━━━━━━━━━━\n" +
                            ballList + "\n\n" +
                            `💰 Số dư: ${userBalance.toLocaleString()} xu\n` +
                            "Mua bóng: .poke buy <loại> <số lượng>\n" +
                            "Ví dụ: .poke buy ultraball 5",
                            threadID,
                            messageID
                        );
                    } catch (error) {
                        console.error("Balance retrieval error:", error);
                        return api.sendMessage("❌ Không thể lấy thông tin số dư!", threadID, messageID);
                    }
                }
                case "buy": {
                    if (!param) {
                        const priceList = Object.entries(pokeSystem.POKEBALLS)
                            .map(([key, ball]) => 
                                `${ball.emoji} ${ball.name}: ${ball.price.toLocaleString()} xu`
                            ).join('\n');
                            
                        return api.sendMessage(
                            "📍 BẢNG GIÁ POKÉBALL 📍\n" +
                            "━━━━━━━━━━━━━━━━\n" +
                            priceList + "\n\n" +
                            "Cách dùng: .poke buy <loại> <số lượng>\n" +
                            "Ví dụ: .poke buy ultraball 5",
                            threadID,
                            messageID
                        );
                    }
                
                    const buyParams = target.slice(1);
                    const ballType = buyParams[0]?.toLowerCase();
                    const quantity = parseInt(buyParams[1]) || 1;
                
                    if (quantity <= 0) {
                        return api.sendMessage("❌ Số lượng không hợp lệ!", threadID, messageID);
                    }
                
                    const ball = pokeSystem.POKEBALLS[ballType];
                    if (!ball) {
                        return api.sendMessage("❌ Loại bóng không hợp lệ!", threadID, messageID);
                    }
                
                    const balance = await currencies.getBalance(senderID);
                    const cost = quantity * ball.price;
                    
                    if (balance < cost) {
                        return api.sendMessage(
                            `❌ Không đủ tiền!\n` +
                            `💰 Giá: ${cost.toLocaleString()} xu\n` +
                            `💵 Số dư: ${balance.toLocaleString()} xu`,
                            threadID,
                            messageID
                        );
                    }
                
                    try {
                        await pokeSystem.init(); 
                        const purchase = await pokeSystem.buyBall(senderID, ballType, quantity);
                        
                        if (!purchase.success) {
                            return api.sendMessage("❌ Đã xảy ra lỗi khi mua bóng!", threadID, messageID);
                        }
                
                        await currencies.setBalance(senderID, balance - cost);
                
                        const ballImage = await axios.get(ball.image, { responseType: 'arraybuffer' });
                        const tempPath = path.join(__dirname, 'cache', `pokeball_${ballType}.png`);
                        await fs.promises.writeFile(tempPath, ballImage.data);
                
                        return api.sendMessage(
                            {
                                body: `✅ Đã mua ${quantity} ${ball.name}\n` +
                                      `💰 Tổng giá: ${cost.toLocaleString()} xu\n` +
                                      `💵 Số dư còn lại: ${(balance - cost).toLocaleString()} xu\n` +
                                      `🎒 Trong kho: ${purchase.currentQuantity} ${ball.name}`,
                                attachment: fs.createReadStream(tempPath)
                            },
                            threadID,
                            messageID
                        );
                    } catch (error) {
                        console.error(error);
                        return api.sendMessage("❌ Đã xảy ra lỗi khi mua bóng!", threadID, messageID);
                    }
                }

                case "info": {
                    const playerStats = await pokeSystem.getPlayerStats(senderID);
                    if (!playerStats) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const activePokemon = await pokeSystem.getSelectedPokemon(senderID);
                    const userBalance = await currencies.getBalance(senderID) || 0;

                    let msg = "📊 THỐNG KÊ POKEMON 📊\n" +
                             "━━━━━━━━━━━━━━━━━\n\n" +
                             `💰 Số dư: ${userBalance.toLocaleString()}xu\n` +
                             `📦 Tổng số Pokemon: ${playerStats.totalPokemon}\n` +
                             `⚔️ Số trận đấu: ${playerStats.battles}\n` +
                             `🏆 Số trận thắng: ${playerStats.wins}\n` +
                             `📈 Tỷ lệ thắng: ${playerStats.winRate}%\n\n`;

                    if (activePokemon) {
                        msg += "🎯 POKEMON ĐANG CHỌN:\n" +
                              `👊 ${activePokemon.name.toUpperCase()} (Lv.${activePokemon.level})\n` +
                              `🎭 Hệ: ${activePokemon.types.map(t => 
                                  `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                              ).join(' | ')}\n` +
                              `❤️ HP: ${activePokemon.hp}/${activePokemon.maxHp}\n` +
                              `⚔️ Tấn công: ${activePokemon.attack}\n` +
                              `🛡️ Phòng thủ: ${activePokemon.defense}\n` +
                              `✨ EXP: ${activePokemon.exp}/${activePokemon.expNeeded}\n` +
                              `🎯 Số trận: ${activePokemon.battles || 0}\n` +
                              `🏆 Số thắng: ${activePokemon.wins || 0}\n`;
                    }

                    if (playerStats.strongestPokemon) {
                        msg += "\n💪 POKEMON MẠNH NHẤT:\n" +
                              `👊 ${playerStats.strongestPokemon.name.toUpperCase()}\n` +
                              `🎖️ Level: ${playerStats.strongestPokemon.level}\n` +
                              `💪 Sức mạnh: ${pokeSystem.getPowerBar(playerStats.strongestPokemon.power)} ${playerStats.strongestPokemon.power}`;
                    }

                    return api.sendMessage(msg, threadID, messageID);
                }

                default:
                    return api.sendMessage(
                        "📌 HƯỚNG DẪN SỬ DỤNG:\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        "1. .poke catch - Bắt Pokemon mới\n" +
                        "2. .poke bag [trang] - Xem túi Pokemon\n" +
                        "3. .poke select [số] - Chọn Pokemon\n" +
                        "4. .poke battle [@tag] - Đấu Pokemon\n" +
                        "5. .poke wild - Đánh Pokemon hoang dã\n" +
                        "6. .poke info - Xem thống kê\n" +
                        "7. .poke find [tên] - Tìm Pokemon\n" +
                        "8. .poke balls - Xem kho bóng\n" +
                        "9. .poke buy [loại] [số lượng] - Mua bóng\n" +
                        "📌 LƯU Ý:\n" +
                        "━━━━━━━━━━━━━━━━━\n" +
                        "• Mỗi người chơi chỉ có thể chọn 1 Pokemon để tham gia trận đấu\n",    
                        threadID,
                        messageID
                    );
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body, messageReply } = event;
        
        const reply = global.client.onReply.find(r => 
            r.messageID === messageReply.messageID && 
            r.author === senderID
        );

        if (!reply) return;

        if (reply.type !== "catch") {
            global.client.onReply = global.client.onReply.filter(r => 
                r.messageID !== reply.messageID
            );
        }

        switch (reply.type) {
            case "catch": {
                const answer = body.toLowerCase();
                
                global.client.onReply = global.client.onReply.filter(r => 
                    r.messageID !== reply.messageID
                );

                if (answer === "no") {
                    catchSystem.setActiveHunt(senderID, reply.locationId, false);
                    return api.sendMessage("❌ Đã bỏ qua Pokemon này.", threadID);
                }

                if (answer !== "yes") {
                    // Keep hunt active on invalid reply
                    catchSystem.setActiveHunt(senderID, reply.locationId, true);
                    return api.sendMessage(
                        "❌ Lựa chọn không hợp lệ!\n" +
                        "Reply 'yes' để bắt hoặc 'no' để bỏ qua.",
                        threadID
                    );
                }

                try {
                    const result = await pokeSystem.catch(senderID, reply.pokemon, reply.bestBall);
                    
                    if (result.error === "noBall") {
                        catchSystem.setActiveHunt(senderID, reply.locationId, false);
                        const ballList = Object.entries(result.inventory)
                            .map(([key, count]) => 
                                `${pokeSystem.POKEBALLS[key].emoji} ${pokeSystem.POKEBALLS[key].name}: ${count}`
                            ).join('\n');

                        return api.sendMessage(
                            "❌ Đã hết bóng trong kho!\n\n" +
                            "🎒 Kho bóng hiện tại:\n" +
                            ballList + "\n\n" +
                            "→ Dùng .poke buy để mua thêm",
                            threadID
                        );
                    }

                    if (result.error === "failed") {
                        catchSystem.setActiveHunt(senderID, reply.locationId, false);
                        const ballList = Object.entries(result.inventory)
                            .map(([key, count]) => 
                                `${pokeSystem.POKEBALLS[key].emoji} ${pokeSystem.POKEBALLS[key].name}: ${count}`
                            ).join('\n');

                        return api.sendMessage(
                            `💢 Tiếc quá! ${reply.pokemon.name} đã thoát khỏi ${result.ballUsed}!\n` +
                            `Còn lại ${result.ballsLeft} ${result.ballUsed}\n\n` +
                            "🎒 Kho bóng hiện tại:\n" +
                            ballList,
                            threadID
                        );
                    }

                    if (result.success) {
                        catchSystem.setHuntCooldown(senderID, reply.locationId);

                        const weatherBonus = reply.weather ? 
                            `\n🌤️ Bonus thời tiết: ${reply.weather}` : '';
                        
                        return api.sendMessage(
                            `🎉 Thu phục thành công ${result.pokemon.name} bằng ${result.ballUsed}!\n` +
                            `📊 Chỉ số:\n` +
                            `❤️ HP: ${result.pokemon.hp}\n` +
                            `⚔️ Tấn công: ${result.pokemon.attack}\n` +
                            `🛡️ Phòng thủ: ${result.pokemon.defense}\n` +
                            `🎭 Hệ: ${result.pokemon.types.map(t => 
                                `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                            ).join(' | ')}` +
                            weatherBonus,
                            threadID
                        );
                    }

                    catchSystem.setActiveHunt(senderID, reply.locationId, false);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi bắt Pokemon!", threadID);

                } catch (error) {
                    console.error(error);
                    catchSystem.setActiveHunt(senderID, reply.locationId, false);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi bắt Pokemon!", threadID);
                }
            }
        }
    }
};

const handleMessage = async (message) => {
    if (message.toLowerCase() === 'no' || message.toLowerCase() === 'ko') {
        global.pokemon.setCatchStatus(threadID, false); 
        return api.sendMessage("🎮 Bạn đã bỏ qua con Pokemon này!", threadID);
    }
}