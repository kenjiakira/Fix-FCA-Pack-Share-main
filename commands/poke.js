const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pokeSystem = require('../poke/pokemonSystem');
const currencies = require('../utils/currencies');

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

        const command = target[0]?.toLowerCase();
        const param = target[1];
        try {
            switch (command) {
                case "catch":
                    const catchData = await pokeSystem.generatePokemon();
                    const response = await axios.get(catchData.image, { responseType: 'arraybuffer' });
                    const imagePath = path.join(__dirname, 'cache', 'pokemon_catch.png');
                    await fs.promises.writeFile(imagePath, response.data);

                    const bestBall = await pokeSystem.getBestAvailableBall(senderID);
                    if (!bestBall) {
                        return api.sendMessage(
                            "❌ Bạn đã hết bóng trong kho!\n" +
                            "Dùng .poke buy để mua thêm bóng.",
                            threadID,
                            messageID
                        );
                    }

                    const catchResult = await pokeSystem.catch(senderID, catchData, bestBall.type);
                    if (catchResult?.error === "catchCooldown") {
                        const timeLeft = Math.ceil(catchResult.timeLeft / 1000);
                        const minutes = Math.floor(timeLeft / 60);
                        const seconds = timeLeft % 60;
                        return api.sendMessage(
                            `⏳ Bạn cần đợi ${minutes}:${seconds < 10 ? '0' : ''}${seconds} phút nữa để bắt tiếp!\n` +
                            "→ Thử làm nhiệm vụ khác trong lúc chờ nhé!",
                            threadID,
                            messageID
                        );
                    }

                    const catchMsg = await api.sendMessage({
                        body: `🎯 Bạn đã gặp ${catchData.name} (Cấp ${catchData.level})!\n` +
                             `💪 Chỉ số:\n` +
                             `❤️ HP: ${catchData.hp}\n` +
                             `⚔️ Tấn công: ${catchData.attack}\n` +
                             `🛡️ Phòng thủ: ${catchData.defense}\n` +
                             `🎭 Hệ: ${catchData.types.map(t => 
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
                        pokemon: catchData,
                        bestBall: bestBall.type
                    });
                    return;

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

                    const battleResult = await pokeSystem.battle(senderID, mentionedId, threadID);
                    const player = await pokeSystem.getPlayer(senderID);

                    await api.sendMessage(
                        "⚔️ BATTLE POKEMON ⚔️\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        `👊 ${player1Pokemon.name.toUpperCase()} (Lv.${player1Pokemon.level})\n` +
                        `🎭 Hệ: ${player1Pokemon.types.map(t => 
                            `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                        ).join(' | ')}\n` +
                        `   ❤️ HP: ${player1Pokemon.hp}\n` +
                        `   ⚔️ ATK: ${player1Pokemon.attack}\n` +
                        `   🛡️ DEF: ${player1Pokemon.defense}\n\n` +
                        `⚔️ VS ⚔️\n\n` +
                        `👊 ${player2Pokemon.name.toUpperCase()} (Lv.${player2Pokemon.level})\n` +
                        `🎭 Hệ: ${player2Pokemon.types.map(t => 
                            `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                        ).join(' | ')}\n` +
                        `   ❤️ HP: ${player2Pokemon.hp}\n` +
                        `   ⚔️ ATK: ${player2Pokemon.attack}\n` +
                        `   🛡️ DEF: ${player2Pokemon.defense}\n\n` +
                        "🎯 Trận đấu bắt đầu trong 20 giây...",
                        threadID
                    );

                    await new Promise(resolve => setTimeout(resolve, 20000));

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
                case "inventory":
                    if (!player) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const userBalance = currencies.getBalance(senderID);
                    const inv = player.inventory;
                    const ballList = Object.entries(pokeSystem.POKEBALLS)
                        .map(([key, ball]) => 
                            `${ball.emoji} ${ball.name}: ${inv[key] || 0} (${ball.price.toLocaleString()}đ)`
                        ).join('\n');

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

                case "buy":
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

                    const [ballType, amount] = param.split(" ");
                    const quantity = parseInt(amount) || 1;

                    const purchase = await pokeSystem.buyBall(senderID, ballType, quantity);
                    
                    if (purchase.error) {
                        const errors = {
                            noPlayer: "❌ Bạn chưa có dữ liệu Pokemon!",
                            invalidBall: "❌ Loại bóng không hợp lệ!",
                            insufficientCoins: `❌ Không đủ tiền!\n💰 Giá: ${purchase.required.toLocaleString()} xu\n💵 Số dư: ${purchase.balance.toLocaleString()} xu`
                        };
                        return api.sendMessage(errors[purchase.error], threadID, messageID);
                    }

                    const ball = pokeSystem.POKEBALLS[ballType];
                    const ballImage = await axios.get(ball.image, { responseType: 'arraybuffer' });
                    const tempPath = path.join(__dirname, 'cache', `pokeball_${ballType}.png`);
                    await fs.promises.writeFile(tempPath, ballImage.data);

                    return api.sendMessage(
                        {
                            body: `✅ Đã mua ${quantity} ${purchase.ballType}\n` +
                                `💰 Tổng giá: ${purchase.cost.toLocaleString()} xu\n` +
                                `💵 Số dư còn lại: ${purchase.remaining.toLocaleString()} xu`,
                            attachment: fs.createReadStream(tempPath)
                        },
                        threadID,
                        messageID
                    );

                case "info": {
                    const playerStats = await pokeSystem.getPlayerStats(senderID);
                    if (!playerStats) {
                        return api.sendMessage("❌ Bạn chưa có dữ liệu Pokemon!", threadID, messageID);
                    }

                    const activePokemon = await pokeSystem.getSelectedPokemon(senderID);
                    const userBalance = currencies.getBalance(senderID);

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
        const { threadID, messageID, senderID, body } = event;
        const reply = global.client.onReply.find(r => r.messageID === event.messageReply.messageID && r.author === senderID);
        if (!reply) return;

        global.client.onReply = global.client.onReply.filter(r => r.messageID !== reply.messageID);

        switch (reply.type) {
            case "catch": {
                const answer = body.toLowerCase();
                if (answer === "no") {
                    return api.sendMessage("❌ Đã bỏ qua Pokemon này.", threadID);
                }

                if (answer !== "yes") {
                    return api.sendMessage(
                        "❌ Lựa chọn không hợp lệ!\n" +
                        "Reply 'yes' để bắt hoặc 'no' để bỏ qua.",
                        threadID
                    );
                }

                const result = await pokeSystem.catch(senderID, reply.pokemon, reply.bestBall);
                
                if (result.error === "noBall") {
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

                return api.sendMessage(
                    `🎉 Thu phục thành công ${result.pokemon.name} bằng ${result.ballUsed}!\n` +
                    `📊 Đã thêm vào bộ sưu tập của bạn.`,
                    threadID
                );
            }
        }
    }
};
