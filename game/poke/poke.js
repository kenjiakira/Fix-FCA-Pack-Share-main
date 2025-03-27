const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pokeSystem = require('../game/poke/pokemonSystem');
const currencies = require('../utils/currencies');
const { system: catchSystem } = require('../game/poke/catchSystem');
const { createBattleImage } = require('../game/poke/canvasHelper'); 
const PET_COOLDOWN = 300000;
const TRAIN_COOLDOWN = 300000; 
const petCooldowns = new Map();
const trainCooldowns = new Map();

module.exports = {
    name: "poke",
    dev: "HNT",
    usedby: 0,
    info: "săn Pokemon",
    onPrefix: true,
    usages: ".poke [catch/bag/select/battle/info]",
    cooldowns: 2,

    async handleEvolution(api, threadID, evolution) {
        if (!evolution || evolution === true) return;

        const { oldPokemon, newPokemon, powerIncrease } = evolution;
        
        try {
            const [oldResponse, newResponse] = await Promise.all([
                axios.get(oldPokemon.image, { responseType: 'arraybuffer' }),
                axios.get(newPokemon.image, { responseType: 'arraybuffer' })
            ]);

            const oldImagePath = path.join(__dirname, 'cache', 'pokemon_old.png');
            const newImagePath = path.join(__dirname, 'cache', 'pokemon_new.png');

            await Promise.all([
                fs.promises.writeFile(oldImagePath, oldResponse.data),
                fs.promises.writeFile(newImagePath, newResponse.data)
            ]);

            const powerBar = pokeSystem.getPowerBar(pokeSystem.calculatePower(newPokemon));
            
            const evolutionMethod = this.getEvolutionMethod(oldPokemon, newPokemon);
            
            const newMoves = newPokemon.moves.filter(move => !oldPokemon.moves.includes(move));
            const movesDisplay = newMoves.length > 0 ? 
                `\n📖 Chiêu mới: ${newMoves.join(', ')}` : '';
            
            await api.sendMessage(
                {
                    body: "✨ POKEMON TIẾN HÓA ✨\n" +
                          "━━━━━━━━━━━━━━━━━\n\n" +
                          `${oldPokemon.name.toUpperCase()} đã tiến hóa thành ${newPokemon.name.toUpperCase()}!\n\n` +
                          "📊 CHỈ SỐ MỚI:\n" +
                          `❤️ HP: ${oldPokemon.hp} → ${newPokemon.hp}\n` +
                          `⚔️ ATK: ${oldPokemon.attack} → ${newPokemon.attack}\n` +
                          `🛡️ DEF: ${oldPokemon.defense} → ${newPokemon.defense}\n` +
                          `💪 Sức mạnh tăng: +${powerIncrease}\n` +
                          `${powerBar}\n\n` +
                          `🎭 Hệ: ${newPokemon.types.map(t => 
                              `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                          ).join(' | ')}\n` +
                          `💫 Phương thức: ${evolutionMethod}` +
                          movesDisplay,
                    attachment: [
                        fs.createReadStream(oldImagePath),
                        fs.createReadStream(newImagePath)
                    ]
                },
                threadID
            );
        } catch (error) {
            console.error("Evolution handler error:", error);
            api.sendMessage("❌ Đã xảy ra lỗi khi xử lý tiến hóa!", threadID);
        }
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

                if (!/^[a-zA-Z0-9\s.]+$/.test(name)) {
                    return api.sendMessage("❌ Tên chỉ được chứa chữ cái, số và dấu chấm!", threadID, messageID);
                }

                if (name.toLowerCase().includes('admin')) {
                    return api.sendMessage("❌ Tên không được chứa từ 'ADMIN'!", threadID, messageID);
                }

                const existingPlayer = Object.values(pokeSystem.players).find(
                    player => player.name && player.name.toLowerCase() === name.toLowerCase()
                );
                if (existingPlayer) {
                    return api.sendMessage("❌ Tên này đã được sử dụng! Vui lòng chọn tên khác.", threadID, messageID);
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
                                  "Reply 'yes' để bắt, 'no' để bỏ qua.\n" +
                                  "⏳ Thời gian chờ: 60 giây",
                            attachment: fs.createReadStream(imagePath)
                        }, threadID);

                        const catchMsgId = catchMsg.messageID;

                        setTimeout(async () => {
                            const replyStillExists = global.client.onReply.some(r => 
                                r.messageID === catchMsg.messageID
                            );

                            if (replyStillExists) {
                                global.client.onReply = global.client.onReply.filter(r => 
                                    r.messageID !== catchMsg.messageID
                                );
                                catchSystem.setHuntCooldown(senderID, param);
                                await api.sendMessage(
                                    "⌛ Đã hết thời gian bắt Pokemon!\n" +
                                    "→ Pokemon đã bỏ chạy.", 
                                    threadID
                                );
                            }
                        }, 60000);

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

case "pve": {
    const pveSystem = require('../game/poke/pveSystem');
    
    if (!param) {
        const difficulties = pveSystem.getDifficultyInfo();
        let msg = "🆚 CHẾ ĐỘ PVE 🆚\n" +
                  "━━━━━━━━━━━━━━━━━\n\n" +
                  "📊 CÁC ĐỘ KHÓ:\n";
        
        difficulties.forEach(diff => {
            msg += `${diff.id}. ${diff.name}\n`;
            msg += `   🎯 Cấp độ: ${diff.level}\n`;
            msg += `   ✨ EXP: ${diff.exp}\n\n`;
        });
        
        msg += "Cách dùng: .poke pve [độ khó]\n";
        msg += "VD: .poke pve normal";
        
        return api.sendMessage(msg, threadID, messageID);
    }

    const difficulty = param.toLowerCase();
    
    if (!pveSystem.difficulties[difficulty]) {
        return api.sendMessage("❌ Độ khó không hợp lệ!", threadID, messageID);
    }

    const cooldownCheck = pveSystem.checkCooldown(senderID, difficulty);
    if (!cooldownCheck.canBattle) {
        const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000);
        return api.sendMessage(
            `⏳ Vui lòng đợi ${timeLeft} giây nữa để tiếp tục PvE ở độ khó này!`,
            threadID,
            messageID
        );
    }

    const pokemon = await pokeSystem.getSelectedPokemon(senderID);
    if (!pokemon) {
        return api.sendMessage(
            "❌ Bạn chưa chọn Pokemon!\n" +
            "Dùng .poke select [số] để chọn Pokemon",
            threadID,
            messageID
        );
    }

    try {
        const wildPokemon = await pveSystem.generateWildPokemon(difficulty, pokeSystem);
        
        const battleImage = await createBattleImage(
            pokemon.image,
            wildPokemon.image,
            await pokeSystem.getPlayerName(senderID),
            "Wild Pokemon",
            pokemon.name,
            wildPokemon.name
        );

        const battleMsg = await api.sendMessage({
            body: "⚔️ BATTLE PVE ⚔️\n" +
                  "━━━━━━━━━━━━━━━━━\n\n" +
                  `🔵 ${pokemon.name.toUpperCase()} (Lv.${pokemon.level})\n` +
                  `🎭 Hệ: ${pokemon.types.map(t => 
                      `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                  ).join(' | ')}\n` +
                  `   ❤️ HP: ${pokemon.hp}\n` +
                  `   ⚔️ ATK: ${pokemon.attack}\n` +
                  `   🛡️ DEF: ${pokemon.defense}\n\n` +
                  `⚔️ VS ⚔️\n\n` +
                  `🔴 ${wildPokemon.name.toUpperCase()} (Lv.${wildPokemon.level})\n` +
                  `🎭 Hệ: ${wildPokemon.types.map(t => 
                      `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                  ).join(' | ')}\n` +
                  `   ❤️ HP: ${wildPokemon.hp}\n` +
                  `   ⚔️ ATK: ${wildPokemon.attack}\n` +
                  `   🛡️ DEF: ${wildPokemon.defense}\n\n` +
                  "🎯 Trận đấu bắt đầu trong 10 giây...",
            attachment: battleImage
        }, threadID);

        await new Promise(resolve => setTimeout(resolve, 10000));

        const battleResult = await pveSystem.battle(pokemon, wildPokemon);
        const rewards = pveSystem.calculateRewards(
            difficulty, 
            wildPokemon,
            battleResult.winner === pokemon
        );

        // Set cooldown after battle completes
        pveSystem.setCooldown(senderID, difficulty);

        if (battleResult.winner === pokemon) {
            pokemon.exp += rewards.exp;
            await pokeSystem.saveData();

            const levelUp = await pokeSystem.checkLevelUp(senderID, 
                (await pokeSystem.getPlayer(senderID)).activePokemon
            );
            
            if (levelUp && levelUp !== true) {
                await this.handleEvolution(api, threadID, levelUp);
            }
        }

        const battleLog = battleResult.battleLog.slice(-5).join('\n');
        
        return api.sendMessage(
            "🏆 KẾT QUẢ TRẬN ĐẤU 🏆\n" +
            "━━━━━━━━━━━━━━━━━\n\n" +
            `${battleLog}\n\n` +
            `👑 Người thắng: ${battleResult.winner.name}\n` +
            `❤️ HP còn lại: ${battleResult.winner === pokemon ? 
                battleResult.finalHP.player : battleResult.finalHP.wild}\n` +
            `✨ EXP nhận được: +${rewards.exp}`,
            threadID
        );

    } catch (error) {
        console.error('PvE battle error:', error);
        return api.sendMessage(
            "❌ Đã xảy ra lỗi trong trận đấu!",
            threadID
        );
    }
    return;
}

case "battle": {
                    const mentionedId = Object.keys(event.mentions)[0]; 
                    if (!mentionedId) {
                        return api.sendMessage(
                            "❌ Vui lòng tag người bạn muốn thách đấu!\n" +
                            "💡 Cách dùng: .poke battle @tên_người_chơi",
                            threadID, 
                            messageID
                        );
                    }

                    const existingInvite = global.client.onReply.find(r => 
                        r.type === "pvp_confirmation" && 
                        ((r.player1 === senderID && r.player2 === mentionedId) ||
                         (r.player1 === mentionedId && r.player2 === senderID))
                    );

                    if (existingInvite) {
                        if (existingInvite.player2 === senderID) {
                            return api.sendMessage(
                                "❌ Người chơi này đã mời bạn tham gia PVP!\n" +
                                "→ Hãy trả lời tin nhắn mời của họ.",
                                threadID,
                                messageID
                            );
                        } else {
                            return api.sendMessage(
                                "❌ Bạn đã gửi lời mời PVP cho người này!\n" +
                                "→ Vui lòng đợi họ phản hồi.",
                                threadID,
                                messageID
                            );
                        }
                    }
                
                    const player1Pokemon = await pokeSystem.getSelectedPokemon(senderID);
                    if (!player1Pokemon) {
                        return api.sendMessage(
                            "❌ Bạn chưa có Pokemon nào được chọn!\n" +
                            "1️⃣ Dùng .poke catch để bắt Pokemon\n" +
                            "2️⃣ Dùng .poke select [số] để chọn Pokemon",
                            threadID,
                            messageID
                        );
                    }
                
                    const player2Pokemon = await pokeSystem.getSelectedPokemon(mentionedId);
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
                
                    const confirmationMessage = await api.sendMessage(
                        `🔔 ${player2Name}, bạn có muốn tham gia trận PVP với ${player1Name}?\n` +
                        `→ Reply 'yes' để chấp nhận, 'no' để từ chối.\n` +
                        `⏳ Thời gian chờ: 60 giây`,
                        threadID
                    );
                
                    global.client.onReply.push({
                        name: this.name,
                        messageID: confirmationMessage.messageID,
                        author: mentionedId,
                        type: "pvp_confirmation",
                        player1: senderID,
                        player2: mentionedId,
                        player1Name: player1Name,
                        player2Name: player2Name,
                        player1Pokemon: player1Pokemon,
                        player2Pokemon: player2Pokemon,
                        expiry: Date.now() + 60000
                    });
                
                    return;
                }
                    
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
                              `✨ EXP: ${activePokemon.exp}/${activePokemon.expNeeded} (${Math.floor((activePokemon.exp/activePokemon.expNeeded)*100)}%)\n` +
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

                case "levelup": {   
                    const player = await pokeSystem.getPlayer(senderID);
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const pokemonIndex = parseInt(param) - 1;
                    if (isNaN(pokemonIndex)) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập số thứ tự Pokemon!\n" +
                            "Cách dùng: .poke levelup [số thứ tự]",
                            threadID, 
                            messageID
                        );
                    }

                    let pokemon = player.pokemons[pokemonIndex];
                    if (!pokemon) {
                        return api.sendMessage("❌ Không tìm thấy Pokemon!", threadID, messageID);
                    }

                    if (pokemon.exp < pokemon.expNeeded) {
                        return api.sendMessage(
                            `❌ ${pokemon.name} chưa đủ EXP để lên cấp!\n` +
                            `✨ EXP hiện tại: ${pokemon.exp}/${pokemon.expNeeded}`,
                            threadID,
                            messageID
                        );
                    }

                    let leveledUp = false;
                    while (pokemon.exp >= pokemon.expNeeded) {
                        leveledUp = true;
                        const levelUp = await pokeSystem.checkLevelUp(senderID, pokemonIndex);
                        if (levelUp && levelUp !== true) {
                            await this.handleEvolution(api, threadID, levelUp);
                            break;
                        }
                        await api.sendMessage(
                            `🎉 ${pokemon.name} đã đạt cấp ${pokemon.level}!\n` +
                            `❤️ HP: ${Math.floor(pokemon.hp * 1.1)}\n` +
                            `⚔️ Tấn công: ${Math.floor(pokemon.attack * 1.1)}\n` +
                            `🛡️ Phòng thủ: ${Math.floor(pokemon.defense * 1.1)}`,
                            threadID
                        );
                        const updatedPlayer = await pokeSystem.getPlayer(senderID);
                        if (!updatedPlayer) break;
                        pokemon = updatedPlayer.pokemons[pokemonIndex];
                        if (!pokemon) break;
                    }

                    if (leveledUp) {
                        await pokeSystem.saveData();
                        return api.sendMessage(
                            "✅ Đã nâng cấp Pokemon thành công!",
                            threadID,
                            messageID
                        );
                    }

                    return api.sendMessage(
                        "❌ Đã xảy ra lỗi khi nâng cấp Pokemon!",
                        threadID,
                        messageID
                    );
                }

                case "evolve": {
                    const player = await pokeSystem.getPlayer(senderID);
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const pokemonIndex = parseInt(param) - 1;
                    if (isNaN(pokemonIndex)) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập số thứ tự Pokemon!\n" +
                            "Cách dùng: .poke evolve [số thứ tự]",
                            threadID, 
                            messageID
                        );
                    }

                    const pokemon = player.pokemons[pokemonIndex];
                    if (!pokemon) {
                        return api.sendMessage("❌ Không tìm thấy Pokemon!", threadID, messageID);
                    }

                    const evolutionData = {
                        pichu: { friendshipRequired: 220, evolution: 'pikachu' },
                        bulbasaur: { level: 16, evolution: 'ivysaur' },
                        ivysaur: { level: 32, evolution: 'venusaur' },
                        charmander: { level: 16, evolution: 'charmeleon' },
                        charmeleon: { level: 36, evolution: 'charizard' },
                        squirtle: { level: 16, evolution: 'wartortle' },
                        wartortle: { level: 36, evolution: 'blastoise' },
                        pikachu: { item: 'thunder-stone', evolution: 'raichu' },
                        eevee: {
                            items: {
                                'water-stone': 'vaporeon',
                                'thunder-stone': 'jolteon',
                                'fire-stone': 'flareon',
                                'leaf-stone': 'leafeon',
                                'ice-stone': 'glaceon'
                            },
                            friendship: {
                                day: 'espeon',
                                night: 'umbreon'
                            }
                        },
                        magikarp: { level: 20, evolution: 'gyarados' },
                        dratini: { level: 30, evolution: 'dragonair' },
                        dragonair: { level: 55, evolution: 'dragonite' },
                        geodude: { level: 25, evolution: 'graveler' },
                        graveler: { method: 'trade', evolution: 'golem' },
                        gastly: { level: 25, evolution: 'haunter' },
                        haunter: { method: 'trade', evolution: 'gengar' }
                    };

                    const pokemonData = evolutionData[pokemon.name.toLowerCase()];
                    if (!pokemonData) {
                        return api.sendMessage(
                            "❌ Pokemon này không có hình thức tiến hóa!",
                            threadID,
                            messageID
                        );
                    }

                    let evolutionMsg = `📝 THÔNG TIN TIẾN HÓA: ${pokemon.name.toUpperCase()}\n`;
                    evolutionMsg += "━━━━━━━━━━━━━━━━━\n\n";
                    evolutionMsg += "📊 CHỈ SỐ HIỆN TẠI:\n";
                    evolutionMsg += `❤️ HP: ${pokemon.hp}\n`;
                    evolutionMsg += `⚔️ ATK: ${pokemon.attack}\n`;
                    evolutionMsg += `🛡️ DEF: ${pokemon.defense}\n`;
                    evolutionMsg += `📈 Level: ${pokemon.level}\n`;
                    evolutionMsg += `💕 Độ thân thiết: ${player.friendship?.[pokemonIndex] || 0}\n\n`;

                    let requirements = [];
                    let missing = [];

                    if (pokemonData.level) {
                        requirements.push(`📊 Cần đạt cấp độ ${pokemonData.level}`);
                        if (pokemon.level < pokemonData.level) {
                            missing.push(`Còn thiếu ${pokemonData.level - pokemon.level} cấp độ`);
                        }
                    }

                    if (pokemonData.friendshipRequired) {
                        requirements.push(`💕 Cần độ thân thiết ${pokemonData.friendshipRequired}`);
                        const currentFriendship = player.friendship?.[pokemonIndex] || 0;
                        if (currentFriendship < pokemonData.friendshipRequired) {
                            missing.push(`Còn thiếu ${pokemonData.friendshipRequired - currentFriendship} độ thân thiết`);
                        }
                    }

                    if (pokemonData.item) {
                        requirements.push(`🎁 Cần ${pokemonData.item}`);
                        if (!player.inventory?.[pokemonData.item] || player.inventory[pokemonData.item] <= 0) {
                            missing.push(`Thiếu ${pokemonData.item}`);
                        }
                    }

                    if (pokemonData.items) {
                        const itemList = Object.keys(pokemonData.items).join(', ');
                        requirements.push(`🎁 Cần một trong các đá: ${itemList}`);
                        const hasAnyItem = Object.keys(pokemonData.items).some(item => 
                            player.inventory?.[item] && player.inventory[item] > 0
                        );
                        if (!hasAnyItem) {
                            missing.push(`Thiếu đá tiến hóa`);
                        }
                    }

                    if (pokemonData.method === 'trade') {
                        requirements.push('🤝 Cần trao đổi với người chơi khác');
                        missing.push('Chưa thể trao đổi trong phiên bản hiện tại');
                    }

                    evolutionMsg += "📋 YÊU CẦU TIẾN HÓA:\n";
                    evolutionMsg += requirements.map(req => `• ${req}`).join('\n');
                    evolutionMsg += "\n\n";

                    if (missing.length > 0) {
                        evolutionMsg += "⚠️ THIẾU YÊU CẦU:\n";
                        evolutionMsg += missing.map(miss => `• ${miss}`).join('\n');
                    } else {
                        evolutionMsg += "✅ Đã đủ điều kiện tiến hóa!\n";
                        evolutionMsg += "→ Dùng .poke evolve [số] để tiến hóa";
                    }

                    const evolution = await pokeSystem.checkEvolution(senderID, pokemonIndex, true);
                    if (evolution && typeof evolution === 'object') {
                        if (evolution.pending) {
                            const confirmMsg = await api.sendMessage(
                                evolutionMsg + "\n\n" +
                                "✨ POKEMON CÓ THỂ TIẾN HÓA! ✨\n" +
                                `${pokemon.name.toUpperCase()} → ${evolution.newPokemon.name.toUpperCase()}\n\n` +
                                "📊 CHỈ SỐ MỚI:\n" +
                                `❤️ HP: ${pokemon.hp} → ${evolution.newPokemon.hp}\n` +
                                `⚔️ ATK: ${pokemon.attack} → ${evolution.newPokemon.attack}\n` +
                                `🛡️ DEF: ${pokemon.defense} → ${evolution.newPokemon.defense}\n` +
                                `💪 Sức mạnh tăng: +${evolution.powerIncrease}\n\n` +
                                "Reply 'yes' để tiến hóa, 'no' để hủy.",
                                threadID
                            );

                            global.client.onReply.push({
                                name: this.name,
                                messageID: confirmMsg.messageID,
                                author: senderID,
                                type: "evolution_confirm"
                            });
                        } else {
                            return api.sendMessage(evolutionMsg, threadID, messageID);
                        }
                    } else {
                        return api.sendMessage(evolutionMsg, threadID, messageID);
                    }
                    return;
                }

                case "stones":
                case "items": {
                    const player = await pokeSystem.getPlayer(senderID);
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const inv = player.inventory || {};
                    const stones = [
                        'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 
                        'ice-stone', 'moon-stone', 'sun-stone', 'shiny-stone',
                        'dusk-stone', 'dawn-stone', 'oval-stone'
                    ];

                    const stoneEmojis = {
                        'fire-stone': '🔥',
                        'water-stone': '💧',
                        'thunder-stone': '⚡',
                        'leaf-stone': '🍃',
                        'ice-stone': '❄️',
                        'moon-stone': '🌙',
                        'sun-stone': '☀️',
                        'shiny-stone': '✨',
                        'dusk-stone': '🌑',
                        'dawn-stone': '🌅',
                        'oval-stone': '🥚'
                    };

                    const stonePrices = {
                        'fire-stone': 5000000,
                        'water-stone': 5000000,
                        'thunder-stone': 5000000,
                        'leaf-stone': 5000000,
                        'ice-stone': 7500000,
                        'moon-stone': 7500000,
                        'sun-stone': 7500000,
                        'shiny-stone': 10000000,
                        'dusk-stone': 10000000,
                        'dawn-stone': 10000000,
                        'oval-stone': 15000000
                    };

                    let msg = "💎 KHO ĐÁ TIẾN HÓA 💎\n" +
                             "━━━━━━━━━━━━━━━━━\n\n";

                    stones.forEach(stone => {
                        const count = inv[stone] || 0;
                        const emoji = stoneEmojis[stone];
                        const price = stonePrices[stone].toLocaleString();
                        msg += `${emoji} ${stone}: ${count} (${price} xu)\n`;
                    });

                    msg += "\n💡 Dùng .poke buystone <tên đá> <số lượng> để mua đá tiến hóa\n";
                    msg += "VD: .poke buystone fire-stone 1";
                    return api.sendMessage(msg, threadID, messageID);
                }

                case "buystone": {
                    if (!param) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập tên đá và số lượng!\n" +
                            "Cách dùng: .poke buystone <tên đá> <số lượng>\n" +
                            "VD: .poke buystone fire-stone 1",
                            threadID,
                            messageID
                        );
                    }
                
                    const buyArgs = target.slice(1); 
                    const stoneName = buyArgs[0]?.toLowerCase();
                    const quantity = parseInt(buyArgs[1]) || 1;
                

                    const stones = {
                        'fire-stone': { price: 50000, emoji: '🔥' },
                        'water-stone': { price: 50000, emoji: '💧' },
                        'thunder-stone': { price: 50000, emoji: '⚡' },
                        'leaf-stone': { price: 50000, emoji: '🍃' },
                        'ice-stone': { price: 75000, emoji: '❄️' },
                        'moon-stone': { price: 75000, emoji: '🌙' },
                        'sun-stone': { price: 75000, emoji: '☀️' },
                        'shiny-stone': { price: 100000, emoji: '✨' },
                        'dusk-stone': { price: 100000, emoji: '🌑' },
                        'dawn-stone': { price: 100000, emoji: '🌅' },
                        'oval-stone': { price: 150000, emoji: '🥚' }
                    };
                    
                    if (!stones[stoneName]) {
                        return api.sendMessage("❌ Tên đá không hợp lệ!", threadID, messageID);
                    }

                    if (quantity <= 0 || quantity > 100) {
                        return api.sendMessage(
                            "❌ Số lượng không hợp lệ! (1-100)",
                            threadID, 
                            messageID
                        );
                    }
                    const stone = stones[stoneName];
                    const totalCost = stone.price * quantity;
                    const balance = await currencies.getBalance(senderID);

                    if (balance < totalCost) {
                        return api.sendMessage(
                            `❌ Không đủ tiền!\n` +
                            `💰 Giá: ${totalCost.toLocaleString()} xu\n` +
                            `💵 Số dư: ${balance.toLocaleString()} xu`,
                            threadID,
                            messageID
                        );
                    }

                    try {
                 
                        const player = await pokeSystem.getPlayer(senderID);
                        if (!player.inventory) player.inventory = {};
                        player.inventory[stoneName] = (player.inventory[stoneName] || 0) + quantity;
                
                        await currencies.setBalance(senderID, balance - totalCost);
                        await pokeSystem.saveData();
                
                        return api.sendMessage(
                            `✅ Đã mua thành công:\n` +
                            `${stone.emoji} ${quantity} ${stoneName}\n` +
                            `💰 Tổng giá: ${totalCost.toLocaleString()} xu\n` +
                            `💵 Số dư còn: ${(balance - totalCost).toLocaleString()} xu\n` +
                            `🎒 Trong kho: ${player.inventory[stoneName]} ${stoneName}`,
                            threadID,
                            messageID
                        );
                    } catch (error) {
                        console.error(error);
                        return api.sendMessage(
                            "❌ Đã xảy ra lỗi khi mua đá!",
                            threadID,
                            messageID
                        );
                    }
                }

                case "evolution":
                case "evo": {
                    const evolutionInfo = await fs.promises.readFile(
                        path.join(__dirname, 'evolution_info.txt'),
                        'utf8'
                    );
                    return api.sendMessage(evolutionInfo, threadID, messageID);
                }

                case "train": {
                    const minigameSystem = require('../game/poke/minigameSystem');
                    const lastTrain = trainCooldowns.get(senderID) || 0;
                    const cooldownLeft = TRAIN_COOLDOWN - (Date.now() - lastTrain);
                    
                    if (cooldownLeft > 0) {
                        return api.sendMessage(
                            `⏳ Vui lòng đợi ${Math.ceil(cooldownLeft/1000)} giây nữa để train tiếp!`,
                            threadID,
                            messageID
                        );
                    }

                    const pokemon = await pokeSystem.getSelectedPokemon(senderID);
                    if (!pokemon) {
                        return api.sendMessage(
                            "❌ Bạn chưa chọn Pokemon nào!\n" +
                            "Dùng .poke select [số] để chọn Pokemon",
                            threadID,
                            messageID
                        );
                    }

                    const result = await minigameSystem.startMinigame(senderID);
                    
                    if (result.error) {
                        return api.sendMessage(result.error, threadID);
                    }

                    const msg = await api.sendMessage(
                        "🎮 POKEMON TRAINING 🎮\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        `${pokemon.name} đang tập luyện...\n` +
                        "Reply 'train' để hoàn thành buổi tập!\n" +
                        "⏳ Thời gian: 30 giây",
                        threadID
                    );

                    global.client.onReply.push({
                        name: this.name,
                        messageID: msg.messageID,
                        author: senderID,
                        type: "minigame"
                    });

                    // Auto-complete training after 30 seconds
                    setTimeout(async () => {
                        const replyStillExists = global.client.onReply.some(r => 
                            r.messageID === msg.messageID
                        );

                        if (replyStillExists) {
                            global.client.onReply = global.client.onReply.filter(r => 
                                r.messageID !== msg.messageID
                            );
                            
                            const autoResult = await minigameSystem.checkAnswer(senderID, "train");
                            if (!autoResult.error) {
                                trainCooldowns.set(senderID, Date.now());
                                await api.sendMessage(
                                    "⌛ Hết giờ tập luyện!\n" +
                                    autoResult.message,
                                    threadID
                                );
                            }
                        }
                    }, 30000);

                    return;
                }

                case "interact":
                case "pet": {


                    const lastPet = petCooldowns.get(senderID) || 0;
                    const cooldownLeft = PET_COOLDOWN - (Date.now() - lastPet);
                    
                    if (cooldownLeft > 0) {
                        return api.sendMessage(
                            `⏳ Vui lòng đợi ${Math.ceil(cooldownLeft/1000)} giây nữa mới có thể tương tác tiếp!`,
                            threadID,
                            messageID
                        );
                    }

                    const player = await pokeSystem.getPlayer(senderID);
                    if (!player || !player.pokemons || player.pokemons.length === 0) {
                        return api.sendMessage(
                            "❌ Bạn chưa có Pokemon nào!\n" +
                            "Hãy bắt Pokemon đầu tiên bằng lệnh .poke catch",
                            threadID,
                            messageID
                        );
                    }

                    let pokemon = await pokeSystem.getSelectedPokemon(senderID);
                    if (!pokemon) {
                        return api.sendMessage(
                            "❌ Bạn chưa chọn Pokemon nào!\n" +
                            "Dùng .poke select [số] để chọn Pokemon",
                            threadID,
                            messageID
                        );
                    }

                    const actions = [
                        "vỗ về", "cho ăn", "ôm", "chơi đùa với", "vuốt ve", 
                        "tập luyện với", "nói chuyện với", "chăm sóc"
                    ];
                    const reactions = [
                        "có vẻ rất thích", "trông rất vui", "tỏ ra rất hạnh phúc",
                        "nhảy nhót vui vẻ", "nũng nịu", "phấn khích", "vui vẻ"
                    ];
                    const bonuses = [
                        "tăng thêm sức mạnh", "trở nên khỏe hơn", "thân thiết hơn với bạn",
                        "có vẻ muốn tiến hóa", "trông có vẻ mạnh hơn"
                    ];

                    const action = actions[Math.floor(Math.random() * actions.length)];
                    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
                    const bonus = bonuses[Math.floor(Math.random() * bonuses.length)];

                    const statIncrease = Math.floor(Math.random() * 2) + 1;
                    pokemon.hp += statIncrease;
                    pokemon.maxHp += statIncrease;
                    pokemon.attack += statIncrease;
                    pokemon.defense += statIncrease;

                    const expGain = Math.floor(Math.random() * 10) + 5;
                    pokemon.exp += expGain;

                    const friendshipGain = Math.floor(Math.random() * 3) + 1;
                    await pokeSystem.updateFriendship(senderID, player.activePokemon, friendshipGain);

                    await pokeSystem.saveData();

                    // Auto level up
                    while (pokemon.exp >= pokemon.expNeeded) {
                        const levelUp = await pokeSystem.checkLevelUp(senderID, player.activePokemon);
                        if (levelUp && levelUp !== true) {
                            await this.handleEvolution(api, threadID, levelUp);
                            break; // Stop if evolution occurs
                        }
                        // Level up without notification
                    }

                    petCooldowns.set(senderID, Date.now());

                    return api.sendMessage(
                        `💝 Bạn ${action} ${pokemon.name}\n` +
                        `→ ${pokemon.name} ${reaction}\n` +
                        `→ Chỉ số tăng: +${statIncrease}\n` +
                        `→ EXP tăng: +${expGain}\n` +
                        `→ Độ thân thiết tăng: +${friendshipGain}\n` +
                        `→ ${pokemon.name} ${bonus}!\n`+
                        `⏳ Chờ 5 phút để tương tác tiếp.`,
                        threadID,
                        messageID
                    );
                }

                default: {
                    const helpMessage = "📌 HƯỚNG DẪN SỬ DỤNG:\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        "1. .poke catch - Bắt Pokemon mới\n" +
                        "2. .poke bag [trang] - Xem túi Pokemon\n" +
                        "3. .poke select [số] - Chọn Pokemon\n" +
                        "4. .poke battle [@tag] - Đấu Pokemon (PvP)\n" +
                        "5. .poke pve [độ khó] - Đấu với Pokemon hoang dã\n" +
                        "6. .poke train - Huấn luyện Pokemon (+EXP)\n\n" +
                        "7. .poke info - Xem thống kê\n" +
                        "8. .poke find [tên] - Tìm Pokemon\n" +
                        "9. .poke balls - Xem kho bóng\n" +
                        "10. .poke buy [loại] [số lượng] - Mua bóng\n" +
                        "11. .poke stones - Xem kho đá tiến hóa\n" +
                        "12. .poke evolve [số] - Kiểm tra và tiến hóa Pokemon\n" +
                        "13. .poke evo - Xem thông tin về tiến hóa\n" +
                        "14. .poke buystone [tên] [số lượng] - Mua đá tiến hóa\n" +
                        "15. .poke pet - Tương tác với Pokemon\n" +
                        "16. .poke levelup - Nâng cấp Pokemon\n\n" +
                        "📌 LƯU Ý:\n" +
                        "━━━━━━━━━━━━━━━━━\n" +
                        "• Mỗi người chơi chỉ có thể chọn 1 Pokemon để tham gia trận đấu\n" +
                        "• Pokemon có thể tiến hóa khi đạt đủ điều kiện (cấp độ, đá tiến hóa, v.v.)\n" +
                        "• Tương tác với Pokemon để tăng độ thân thiết";

                    if (typeof api.sendMessage === 'function') {
                        const menuMsg = await api.sendMessage(helpMessage, threadID, messageID);
                        
                        setTimeout(async () => {
                            try {
                                await api.unsendMessage(menuMsg.messageID);
                            } catch (error) {
                                console.error("Error unsending menu message:", error);
                            }
                        }, 30000);
                        
                        return;
                    } else {
                        console.error("api.sendMessage is not a function");
                        return null;
                    }
                }
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
                    catchSystem.setHuntCooldown(senderID, reply.locationId);
                    
                    // Unsend the catch message
                    await api.unsendMessage(reply.msgID);
                    
                    const skipMsg = await api.sendMessage("❌ Đã bỏ qua Pokemon này.", threadID);
                    
                    setTimeout(async () => {
                        try {
                            await api.unsendMessage(skipMsg.messageID);
                        } catch (error) {
                            console.error("Error unsending skip message:", error);
                        }
                    }, 5000);
                    
                    return;
                }

                if (answer !== "yes") {
                    catchSystem.setActiveHunt(senderID, reply.locationId, true);
                    
                    const invalidMsg = await api.sendMessage(
                        "❌ Lựa chọn không hợp lệ!\n" +
                        "Reply 'yes' để bắt hoặc 'no' để bỏ qua.",
                        threadID
                    );
                
                    setTimeout(async () => {
                        try {
                            await api.unsendMessage(invalidMsg.messageID);
                        } catch (error) {
                            console.error("Error unsending invalid choice message:", error);
                        }
                    }, 5000);
                    
                    return;
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

                        await api.unsendMessage(reply.msgID);

                        const weatherBonus = reply.weather ? 
                            `\n🌤️ Bonus thời tiết: ${reply.weather}` : '';
                        
                        const successMsg = await api.sendMessage(
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

                        setTimeout(async () => {
                            try {
                                await api.unsendMessage(successMsg.messageID);
                            } catch (error) {
                                console.error("Error unsending success message:", error);
                            }
                        }, 10000);

                        return;
                    }

                    catchSystem.setActiveHunt(senderID, reply.locationId, false);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi bắt Pokemon!", threadID);

                } catch (error) {
                    console.error(error);
                    catchSystem.setActiveHunt(senderID, reply.locationId, false);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi bắt Pokemon!", threadID);
                }
            }

            case "evolution_confirm": {
                const answer = body.toLowerCase();
                
                if (answer === "no") {
                    const result = await pokeSystem.confirmEvolution(senderID, false);
                    return api.sendMessage("❌ Đã hủy tiến hóa Pokemon!", threadID);
                }

                if (answer !== "yes") {
                    return api.sendMessage(
                        "❌ Vui lòng trả lời 'yes' để tiến hóa hoặc 'no' để hủy!",
                        threadID
                    );
                }

                const result = await pokeSystem.confirmEvolution(senderID, true);
                if (result) {
                    await this.handleEvolution(api, threadID, result);
                }
                return;
            }

            case "minigame": {
                const minigameSystem = require('../game/poke/minigameSystem');
                const result = await minigameSystem.checkAnswer(senderID, body.trim());
                
                if (result.error) {
                    return api.sendMessage(result.error, threadID);
                }

                if (!result.success && result.attemptsLeft > 0) {
                    return api.sendMessage(
                        `${result.message}\n` +
                        `⚠️ Còn ${result.attemptsLeft} lần thử`,
                        threadID
                    );
                }

                let msg = result.success ? 
                    "🎮 HOÀN THÀNH MINIGAME! 🎮\n" :
                    "❌ THẤT BẠI!\n";
                msg += "━━━━━━━━━━━━━━━━━\n\n";

                if (result.success) {
                    msg += `✨ EXP đạt được: +${result.rewards.exp}\n`;
                    msg += "📈 Chỉ số tăng:\n";
                    Object.entries(result.rewards.stats).forEach(([stat, value]) => {
                        msg += `→ ${stat}: +${value}\n`;
                    });
                }

                trainCooldowns.set(senderID, Date.now());
                return api.sendMessage(msg, threadID);
            }

            case "pvp_confirmation": {
                const answer = body.toLowerCase();
                
                if (senderID !== reply.author) {
                    return api.sendMessage("❌ Chỉ người được thách đấu mới có thể trả lời!", threadID);
                }
            
                if (reply.expiry && Date.now() > reply.expiry) {
                    global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);
                    return api.sendMessage("⌛ Đã hết thời gian chấp nhận thách đấu!", threadID);
                }
            
                if (answer === "no") {
                    global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);
                    return api.sendMessage(
                        `🚫 ${reply.player2Name} đã từ chối lời thách đấu của ${reply.player1Name}!`,
                        threadID
                    );
                }
            
                if (answer !== "yes") {
                    return api.sendMessage(
                        "❌ Vui lòng trả lời 'yes' để chấp nhận hoặc 'no' để từ chối!",
                        threadID
                    );
                }
            
                global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);
            
                try {
                    
                    const battleImage = await createBattleImage(
                        reply.player1Pokemon.image,
                        reply.player2Pokemon.image,
                        reply.player1Name,
                        reply.player2Name,
                        reply.player1Pokemon.name,
                        reply.player2Pokemon.name
                    );
            
                    await api.sendMessage({
                        body: "⚔️ BATTLE POKEMON ⚔️\n" +
                              "━━━━━━━━━━━━━━━━━\n\n" +
                              `🔵 ${reply.player1Name} với ${reply.player1Pokemon.name.toUpperCase()} (Lv.${reply.player1Pokemon.level})\n` +
                              `🎭 Hệ: ${reply.player1Pokemon.types.map(t => 
                                  `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                              ).join(' | ')}\n` +
                              `   ❤️ HP: ${reply.player1Pokemon.hp}\n` +
                              `   ⚔️ ATK: ${reply.player1Pokemon.attack}\n` +
                              `   🛡️ DEF: ${reply.player1Pokemon.defense}\n\n` +
                              `⚔️ VS ⚔️\n\n` +
                              `🔴 ${reply.player2Name} với ${reply.player2Pokemon.name.toUpperCase()} (Lv.${reply.player2Pokemon.level})\n` +
                              `🎭 Hệ: ${reply.player2Pokemon.types.map(t => 
                                  `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                              ).join(' | ')}\n` +
                              `   ❤️ HP: ${reply.player2Pokemon.hp}\n` +
                              `   ⚔️ ATK: ${reply.player2Pokemon.attack}\n` +
                              `   🛡️ DEF: ${reply.player2Pokemon.defense}\n\n` +
                              "🎯 Trận đấu bắt đầu trong 20 giây...",
                        attachment: battleImage
                    }, threadID);
            
                    await new Promise(resolve => setTimeout(resolve, 20000));
            
                    const battleResult = await pokeSystem.battle(reply.player1, reply.player2, threadID);
                    
                    const battleFinalMsg = "🏆 KẾT QUẢ CUỐI CÙNG 🏆\n" +
                                       "━━━━━━━━━━━━━━━━━\n\n" +
                                       `👑 Người thắng: ${battleResult.winner.name}\n` +
                                       `❤️ HP còn lại: ${battleResult.winner.remainingHp}\n` +
                                       `✨ EXP nhận được: +${battleResult.expGained.winner}\n\n` +
                                       `💀 Người thua: ${battleResult.loser.name}\n` +
                                       `❤️ HP còn lại: ${battleResult.loser.remainingHp}\n` +
                                       `✨ EXP an ủi: +${battleResult.expGained.loser}`;
            
                    await api.sendMessage(battleFinalMsg, threadID);
            
                    const player = await pokeSystem.getPlayer(battleResult.winner.id);
                    if (player) {
                        const levelUp = await pokeSystem.checkLevelUp(battleResult.winner.id, player.activePokemon);
                        if (levelUp && levelUp !== true) {
                            await this.handleEvolution(api, threadID, levelUp);
                        }
                    }
            
                } catch (error) {
                    console.error('Battle error:', error);
                    return api.sendMessage("❌ Đã xảy ra lỗi khi tạo trận đấu!", threadID);
                }
                return;
            }
        }
    },

    getEvolutionMethod(oldPokemon, newPokemon) {
   
        const evolutionMethods = {
           
            'bulbasaur-ivysaur': '📈 Cấp độ 16',
            'ivysaur-venusaur': '📈 Cấp độ 32',
            'charmander-charmeleon': '📈 Cấp độ 16',
            'charmeleon-charizard': '📈 Cấp độ 36',
            'squirtle-wartortle': '📈 Cấp độ 16',
            'wartortle-blastoise': '📈 Cấp độ 36',
            
            'pikachu-raichu': '⚡ Đá Sấm',
            'eevee-vaporeon': '💧 Đá Nước',
            'eevee-jolteon': '⚡ Đá Sấm',
            'eevee-flareon': '🔥 Đá Lửa',
            'eevee-leafeon': '🍃 Đá Lá',
            'eevee-glaceon': '❄️ Đá Băng',
            
            'eevee-espeon': '💕 Thân thiết (Ban ngày)',
            'eevee-umbreon': '💕 Thân thiết (Ban đêm)',
            'eevee-sylveon': '💕 Thân thiết + Chiêu Fairy',
            
            'graveler-golem': '🤝 Trao đổi',
            'haunter-gengar': '🤝 Trao đổi',
            
            'magikarp-gyarados': '📈 Cấp độ 20',
            'metapod-butterfree': '📈 Cấp độ 10',
            'kakuna-beedrill': '📈 Cấp độ 10',
            
            'dratini-dragonair': '📈 Cấp độ 30',
            'dragonair-dragonite': '📈 Cấp độ 55',
            
            'geodude-graveler': '📈 Cấp độ 25',
            
            'gastly-haunter': '📈 Cấp độ 25',
            
            'pichu-pikachu': '💕 Thân thiết cao'
        };

        const key = `${oldPokemon.name}-${newPokemon.name}`.toLowerCase();
        return evolutionMethods[key] || '📈 Cấp độ tiến hóa';
    }
};