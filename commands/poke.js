const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pokeSystem = require('../poke/pokemonSystem');

module.exports = {
    name: "poke",
    dev: "HNT",
    usedby: 2,
    info: "săn Pokemon",
    onPrefix: true,
    usages: ".poke [catch/bag/select/battle/info]",
    cooldowns: 2,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        await pokeSystem.init();

        const command = target[0]?.toLowerCase();
        const param = target[1];

        try {
            switch (command) {
                case "catch":
                    const newPokemon = await pokeSystem.catch(senderID);
                    const response = await axios.get(newPokemon.image, { responseType: 'arraybuffer' });
                    const imagePath = path.join(__dirname, 'cache', 'pokemon_catch.png');
                    await fs.promises.writeFile(imagePath, response.data);
                
                    return api.sendMessage({
                        body: `🎉 Bạn đã bắt được ${newPokemon.name} (Cấp ${newPokemon.level})!\n` +
                             `💪 Chỉ số:\n` +
                             `❤️ HP: ${newPokemon.hp}\n` +
                             `⚔️ Tấn công: ${newPokemon.attack}\n` +
                             `🛡️ Phòng thủ: ${newPokemon.defense}\n` +
                             `🎭 Hệ: ${newPokemon.types.map(t => 
                                 `${pokeSystem.getTypeEmoji(t)} ${pokeSystem.getTypeName(t)}`
                             ).join(' | ')}`,
                        attachment: fs.createReadStream(imagePath)
                    }, threadID, messageID);

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
                    msg += "• Sắp xếp: .poke sort [power/level/name]";

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

                case "sort":
                    if (!param) {
                        return api.sendMessage("❌ Vui lòng chọn cách sắp xếp (power/level/name)!", threadID, messageID);
                    }

                    const sorted = await pokeSystem.sort(senderID, param);
                    if (!sorted) {
                        return api.sendMessage("❌ Cách sắp xếp không hợp lệ!", threadID, messageID);
                    }

                    return api.sendMessage(
                        `✅ Đã sắp xếp Pokemon theo ${param}!\nDùng .poke bag để xem kết quả.`,
                        threadID,
                        messageID
                    );

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
                    
                    if (battleResult?.error) {
                        if (battleResult.error === "activeBattle") {
                            return api.sendMessage(
                                "❌ Nhóm đang có trận đấu Pokemon diễn ra!\n" +
                                "→ Vui lòng đợi trận đấu kết thúc để thách đấu",
                                threadID,
                                messageID
                            );
                        }

                        let timeStr = "0:00";
                        if (battleResult.timeLeft > 0) {
                            const timeLeft = Math.ceil(battleResult.timeLeft / 1000);
                            if (timeLeft && !isNaN(timeLeft)) {
                                const minutes = Math.floor(timeLeft / 60);
                                const seconds = timeLeft % 60;
                                timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                        }

                        const healingMsg = battleResult.error === "recovery1" 
                            ? `❌ Pokemon của bạn đang hồi phục...\n` +
                              `⏳ Thời gian còn lại: ${timeStr}\n` +
                              `💕 HP sẽ đầy sau khi hồi phục!`
                            : `❌ Pokemon của đối thủ đang hồi phục...\n` +
                              `⏳ Thời gian còn lại: ${timeStr}\n` +
                              `💕 HP sẽ đầy sau khi hồi phục!`;

                        return api.sendMessage(healingMsg, threadID, messageID);
                    }

                    await api.sendMessage(
                        "⚔️ BATTLE POKEMON ⚔️\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        `👊 ${player1Pokemon.name.toUpperCase()} (Lv.${player1Pokemon.level})\n` +
                        `   ❤️ HP: ${player1Pokemon.hp}\n` +
                        `   ⚔️ ATK: ${player1Pokemon.attack}\n` +
                        `   🛡️ DEF: ${player1Pokemon.defense}\n\n` +
                        `⚔️ VS ⚔️\n\n` +
                        `👊 ${player2Pokemon.name.toUpperCase()} (Lv.${player2Pokemon.level})\n` +
                        `   ❤️ HP: ${player2Pokemon.hp}\n` +
                        `   ⚔️ ATK: ${player2Pokemon.attack}\n` +
                        `   🛡️ DEF: ${player2Pokemon.defense}\n\n` +
                        "🎯 Trận đấu bắt đầu trong 3 giây...",
                        threadID
                    );

                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let battleLog = "⚔️ DIỄN BIẾN TRẬN ĐẤU ⚔️\n" +
                                  "━━━━━━━━━━━━━━━━━\n\n";
                    
                    battleResult.log.forEach((log, index) => {
                        battleLog += `[Lượt ${index + 1}] ${log}\n`;
                    });

                    await api.sendMessage(battleLog, threadID);

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const finalMsg = "🏆 KẾT QUẢ CUỐI CÙNG 🏆\n" +
                                   "━━━━━━━━━━━━━━━━━\n\n" +
                                   `👑 Người thắng: ${battleResult.winner.name.toUpperCase()}\n` +
                                   `❤️ HP còn lại: ${battleResult.winner.remainingHp}\n` +
                                   `✨ EXP nhận được: ${battleResult.expGained || 0}\n\n` +
                                   `💀 Người thua: ${battleResult.loser.name.toUpperCase()}\n` +
                                   `❤️ HP còn lại: ${battleResult.loser.remainingHp}\n\n` +
                                   `💡 Dùng .poke info để xem thống kê trận đấu`;

                    return api.sendMessage(finalMsg, threadID, messageID);

                case "info":
                    const stats = await pokeSystem.getPlayerStats(senderID);
                    if (!stats) {
                        return api.sendMessage("❌ Bạn chưa có thông tin Pokemon!", threadID, messageID);
                    }

                    return api.sendMessage(
                        "📊 THỐNG KÊ POKEMON 📊\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        `Số Pokemon: ${stats.totalPokemon}\n` +
                        `Số trận đã đấu: ${stats.battles}\n` +
                        `Số trận thắng: ${stats.wins}\n` +
                        `Tỷ lệ thắng: ${stats.winRate}%\n\n` +
                        `💫 Pokemon mạnh nhất: ${stats.strongestPokemon.name}\n` +
                        `   Power: ${stats.strongestPokemon.power}`,
                        threadID,
                        messageID
                    );

                default:
                    return api.sendMessage(
                        "📌 HƯỚNG DẪN SỬ DỤNG:\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        "1. .poke catch - Bắt Pokemon mới\n" +
                        "2. .poke bag [trang] - Xem túi Pokemon\n" +
                        "3. .poke select [số] - Chọn Pokemon\n" +
                        "4. .poke battle [@tag] - Đấu Pokemon\n" +
                        "5. .poke find [tên] - Tìm Pokemon\n" +
                        "6. .poke sort [power/level/name] - Sắp xếp\n" +
                        "7. .poke info - Xem thống kê",
                        threadID,
                        messageID
                    );
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};
