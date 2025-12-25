const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: "masoi",
    aliases: ["werewolf", "ma_soi"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi game Ma Sói (Werewolf)",
    usedby: 0,
    usages: ".masoi create/join/start/leave/list/end",
    cooldowns: 0,

    activeGames: new Map(),

    roles: {
        villager: {
            name: "Dân làng",
            description: "Không có khả năng đặc biệt, nhưng có thể bỏ phiếu treo cổ ma sói.",
            team: "village",
            nightAction: false
        },
        werewolf: {
            name: "Ma sói",
            description: "Mỗi đêm có thể chọn một người để giết.",
            team: "werewolf",
            nightAction: true
        },
        seer: {
            name: "Tiên tri",
            description: "Mỗi đêm có thể kiểm tra danh tính của một người chơi.",
            team: "village",
            nightAction: true
        },
        doctor: {
            name: "Bác sĩ",
            description: "Mỗi đêm có thể bảo vệ một người chơi khỏi bị tấn công.",
            team: "village",
            nightAction: true
        },
        hunter: {
            name: "Thợ săn",
            description: "Khi bị giết, có thể bắn chết một người khác.",
            team: "village",
            nightAction: false
        },
        bodyguard: {
            name: "Vệ sĩ",
            description: "Có thể bảo vệ một người chơi mỗi đêm, nhưng không thể bảo vệ cùng một người hai đêm liên tiếp.",
            team: "village",
            nightAction: true
        },
        witch: {
            name: "Phù thủy",
            description: "Có một liều thuốc cứu người và một liều thuốc độc, mỗi loại chỉ dùng được một lần trong trò chơi.",
            team: "village",
            nightAction: true
        }
    },

    getRoleDistribution: function(playerCount) {
        if (playerCount < 5) return null;

        if (playerCount <= 6) {
            return {
                werewolf: 1,
                seer: 1,
                villager: playerCount - 2
            };
        } else if (playerCount <= 8) {
            return {
                werewolf: 2,
                seer: 1,
                doctor: 1,
                villager: playerCount - 4
            };
        } else if (playerCount <= 10) {
            return {
                werewolf: 2,
                seer: 1,
                doctor: 1,
                hunter: 1,
                witch: 1,
                villager: playerCount - 6
            };
        } else {
            return {
                werewolf: 3,
                seer: 1,
                doctor: 1,
                hunter: 1,
                bodyguard: 1,
                witch: 1,
                villager: playerCount - 8
            };
        }
    },

    getUserName: function(userID) {
        const userDataPath = path.join(__dirname, '../database/rankData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || "Người dùng";
        } catch (error) {
            console.error("Error reading userData:", error);
            return "Người dùng";
        }
    },

    createGame: function(threadID, creatorID) {
        const game = {
            threadID: threadID,
            creatorID: creatorID,
            players: new Map(),
            status: "waiting", 
            day: 0,
            votes: new Map(),
            nightActions: new Map(),
            history: [],
            startTime: null,
            lastActivityTime: Date.now(),
            checkInactivityInterval: null,
            protectedPlayer: null,
            witchPotions: { save: 1, kill: 1 },
            bodyguardLastProtected: null,
            lastKilled: null
        };

        game.players.set(creatorID, {
            id: creatorID,
            name: this.getUserName(creatorID),
            role: null,
            isAlive: true,
            voteTarget: null
        });

        game.checkInactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - game.lastActivityTime;
            
            if (idleTime >= 15 * 60 * 1000) { 
                clearInterval(game.checkInactivityInterval);
                this.activeGames.delete(threadID);
                global.api.sendMessage("⌛ Ván Ma Sói đã bị hủy do không có hoạt động trong 15 phút!", threadID);
            }
        }, 60000);

        this.activeGames.set(threadID, game);
        return game;
    },

    startGame: async function(api, threadID) {
        const game = this.activeGames.get(threadID);
        if (!game) return "❌ Không tìm thấy ván game!";

        if (game.players.size < 5) {
            return "❌ Cần ít nhất 5 người chơi để bắt đầu ván Ma Sói!";
        }
        
        const roleDistribution = this.getRoleDistribution(game.players.size);
        const playerIds = Array.from(game.players.keys());
        const roleArray = [];

        // Tạo mảng vai trò dựa trên phân phối
        for (const [role, count] of Object.entries(roleDistribution)) {
            for (let i = 0; i < count; i++) {
                roleArray.push(role);
            }
        }

        // Trộn ngẫu nhiên vai trò
        for (let i = roleArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roleArray[i], roleArray[j]] = [roleArray[j], roleArray[i]];
        }

        // Gán vai trò cho người chơi
        playerIds.forEach((playerId, index) => {
            const player = game.players.get(playerId);
            player.role = roleArray[index];
        });

        // Bắt đầu game
        game.status = "night";
        game.day = 1;
        game.startTime = Date.now();
        game.lastActivityTime = Date.now();

        // Lưu danh sách ma sói để dễ dàng gửi tin nhắn
        game.werewolves = [];
        for (const [playerId, player] of game.players.entries()) {
            if (player.role === "werewolf") {
                game.werewolves.push(playerId);
            }

            // Gửi tin nhắn riêng cho từng người chơi về vai trò của họ
            const role = this.roles[player.role];
            await api.sendMessage(
                `🎮 GAME MA SÓI 🎮\n\n` +
                `Vai trò của bạn: ${role.name}\n` +
                `Mô tả: ${role.description}\n` +
                `Phe: ${role.team === "village" ? "Dân làng" : "Ma sói"}\n\n` +
                `⏳ Hãy chờ hướng dẫn trong nhóm!`,
                playerId
            );
        }

        // Thông báo cho ma sói về đồng đội
        if (game.werewolves.length > 1) {
            const werewolfNames = game.werewolves.map(id => this.getUserName(id)).join(", ");
            for (const wolfId of game.werewolves) {
                await api.sendMessage(
                    `🐺 Danh sách Ma Sói:\n${werewolfNames}\n\n` +
                    `Hãy liên lạc với nhau để thống nhất nạn nhân!`,
                    wolfId
                );
            }
        }

        // Bắt đầu đêm đầu tiên
        this.startNight(api, game);

        return `🎮 GAME MA SÓI BẮT ĐẦU 🎮\n\n` +
               `👥 Số người chơi: ${game.players.size}\n` +
               `🌙 Đêm thứ ${game.day} bắt đầu!\n\n` +
               `Mọi người hãy kiểm tra tin nhắn riêng để biết vai trò của mình.`;
    },

    // Bắt đầu đêm
    startNight: async function(api, game) {
        game.status = "night";
        game.votes.clear();
        game.nightActions.clear();
        game.lastActivityTime = Date.now();

        // Gửi thông báo chung trong nhóm
        await api.sendMessage(
            `🌙 ĐÊM THỨ ${game.day} 🌙\n\n` +
            `Trời đã tối, mọi người đi ngủ và Ma Sói thức dậy...\n` +
            `Người chơi có hành động ban đêm, hãy check tin nhắn riêng!`,
            game.threadID
        );

        // Gửi tin nhắn cho từng người chơi có hành động ban đêm
        for (const [playerId, player] of game.players.entries()) {
            if (!player.isAlive) continue;

            const role = this.roles[player.role];
            if (role.nightAction) {
                const alivePlayersList = this.getAlivePlayersList(game);
                
                switch (player.role) {
                    case "werewolf":
                        await api.sendMessage(
                            `🐺 Ma Sói, hãy chọn nạn nhân của bạn!\n\n` +
                            `${alivePlayersList}\n\n` +
                            `Reply tin nhắn này với ID của người bạn muốn giết.`,
                            playerId,
                            (err, info) => {
                                if (!err) {
                                    global.client.onReply.push({
                                        name: this.name,
                                        messageID: info.messageID,
                                        author: playerId,
                                        threadID: game.threadID,
                                        type: "werewolf_kill"
                                    });
                                }
                            }
                        );
                        break;
                    case "seer":
                        await api.sendMessage(
                            `🔮 Tiên tri, hãy chọn người bạn muốn soi!\n\n` +
                            `${alivePlayersList}\n\n` +
                            `Reply tin nhắn này với ID của người bạn muốn kiểm tra.`,
                            playerId,
                            (err, info) => {
                                if (!err) {
                                    global.client.onReply.push({
                                        name: this.name,
                                        messageID: info.messageID,
                                        author: playerId,
                                        threadID: game.threadID,
                                        type: "seer_check"
                                    });
                                }
                            }
                        );
                        break;
                    case "doctor":
                        await api.sendMessage(
                            `💉 Bác sĩ, hãy chọn người bạn muốn cứu!\n\n` +
                            `${alivePlayersList}\n\n` +
                            `Reply tin nhắn này với ID của người bạn muốn bảo vệ.`,
                            playerId,
                            (err, info) => {
                                if (!err) {
                                    global.client.onReply.push({
                                        name: this.name,
                                        messageID: info.messageID,
                                        author: playerId,
                                        threadID: game.threadID,
                                        type: "doctor_save"
                                    });
                                }
                            }
                        );
                        break;
                    case "bodyguard":
                        const availablePlayers = Array.from(game.players.entries())
                            .filter(([id, p]) => p.isAlive && id !== game.bodyguardLastProtected)
                            .map(([id, p], i) => `${i+1}. ${p.name} (${id})`)
                            .join('\n');
                            
                        await api.sendMessage(
                            `🛡️ Vệ sĩ, hãy chọn người bạn muốn bảo vệ!\n\n` +
                            `${availablePlayers}\n\n` +
                            `Reply tin nhắn này với ID của người bạn muốn bảo vệ.`,
                            playerId,
                            (err, info) => {
                                if (!err) {
                                    global.client.onReply.push({
                                        name: this.name,
                                        messageID: info.messageID,
                                        author: playerId,
                                        threadID: game.threadID,
                                        type: "bodyguard_protect"
                                    });
                                }
                            }
                        );
                        break;
                    case "witch":
                        if (game.witchPotions.save > 0 || game.witchPotions.kill > 0) {
                            let message = `🧙‍♀️ Phù thủy, bạn có các thuốc sau:\n`;
                            
                            if (game.witchPotions.save > 0) {
                                message += `- 💊 Thuốc cứu: Còn ${game.witchPotions.save} liều\n`;
                            }
                            
                            if (game.witchPotions.kill > 0) {
                                message += `- ☠️ Thuốc độc: Còn ${game.witchPotions.kill} liều\n`;
                            }
                            
                            message += `\n${alivePlayersList}\n\n`;
                            message += `Để sử dụng thuốc, reply theo cú pháp: [save/kill] [ID]`;
                            message += `\nVí dụ: save 123456789 hoặc kill 123456789`;
                            message += `\nNếu không muốn sử dụng, hãy reply: skip`;
                            
                            await api.sendMessage(
                                message,
                                playerId,
                                (err, info) => {
                                    if (!err) {
                                        global.client.onReply.push({
                                            name: this.name,
                                            messageID: info.messageID,
                                            author: playerId,
                                            threadID: game.threadID,
                                            type: "witch_action"
                                        });
                                    }
                                }
                            );
                        }
                        break;
                }
            }
        }

        // Kiểm tra sau 2 phút nếu tất cả hành động đã hoàn tất hoặc hết thời gian
        setTimeout(() => {
            this.checkNightActionsComplete(api, game);
        }, 2 * 60 * 1000);
    },

    // Kiểm tra xem tất cả hành động ban đêm đã hoàn tất chưa
    checkNightActionsComplete: async function(api, game) {
        // Nếu game đã kết thúc hoặc đã chuyển sang ngày
        if (game.status !== "night") return;

        const requiredActions = new Set();
        
        // Xác định những hành động cần thiết
        for (const [playerId, player] of game.players.entries()) {
            if (!player.isAlive) continue;
            
            if (player.role === "werewolf" && game.werewolves.includes(playerId)) {
                requiredActions.add("werewolf_kill");
            }
            
            if (player.role === "seer") {
                requiredActions.add("seer_check");
            }

            if (player.role === "doctor") {
                requiredActions.add("doctor_save");
            }
        }

        // Kiểm tra xem tất cả hành động cần thiết đã được thực hiện chưa
        let allActionsComplete = true;
        for (const action of requiredActions) {
            if (!game.nightActions.has(action)) {
                allActionsComplete = false;
                break;
            }
        }

        // Nếu tất cả hành động đã hoàn tất hoặc đã hết thời gian, tiến hành xử lý kết quả đêm
        if (allActionsComplete || (Date.now() - game.lastActivityTime > 2 * 60 * 1000)) {
            await this.processNightResults(api, game);
        }
    },

    // Xử lý kết quả của đêm
    processNightResults: async function(api, game) {
        // Xác định người bị ma sói giết
        let killedPlayer = null;
        const werewolfTarget = game.nightActions.get("werewolf_kill");

        if (werewolfTarget) {
            killedPlayer = werewolfTarget;
            game.lastKilled = werewolfTarget;
        }

        // Kiểm tra bảo vệ của bác sĩ và vệ sĩ
        const doctorTarget = game.nightActions.get("doctor_save");
        const bodyguardTarget = game.nightActions.get("bodyguard_protect");

        // Nếu nạn nhân được bảo vệ, họ sẽ không chết
        if (killedPlayer && (killedPlayer === doctorTarget || killedPlayer === bodyguardTarget)) {
            killedPlayer = null;
        }

        // Xử lý hành động của phù thủy
        const witchAction = game.nightActions.get("witch_action");
        if (witchAction) {
            if (witchAction.type === "save" && killedPlayer) {
                killedPlayer = null;
                game.witchPotions.save = 0;
            } else if (witchAction.type === "kill") {
                // Nếu người này đã bị sói giết, không cần giết nữa
                if (witchAction.target !== killedPlayer) {
                    // Kiểm tra xem nạn nhân của phù thủy có được bảo vệ không
                    if (witchAction.target !== doctorTarget && witchAction.target !== bodyguardTarget) {
                        if (killedPlayer) {
                            // Có 2 người chết
                            const witchKilled = game.players.get(witchAction.target);
                            if (witchKilled) {
                                witchKilled.isAlive = false;
                                game.history.push(`Đêm ${game.day}: ${witchKilled.name} đã bị phù thủy đầu độc.`);
                            }
                        } else {
                            killedPlayer = witchAction.target;
                        }
                        game.witchPotions.kill = 0;
                    }
                }
            }
        }

        // Cập nhật trạng thái người chơi nếu có ai đó bị giết
        let killMessage = "";
        if (killedPlayer) {
            const player = game.players.get(killedPlayer);
            if (player) {
                player.isAlive = false;
                killMessage = `☠️ ${player.name} đã bị giết trong đêm. Họ là ${this.roles[player.role].name}.`;
                game.history.push(`Đêm ${game.day}: ${player.name} (${this.roles[player.role].name}) đã bị giết.`);
                
                // Nếu thợ săn bị giết, họ có thể bắn một người
                if (player.role === "hunter") {
                    // Thông báo cho thợ săn
                    await api.sendMessage(
                        `🏹 Thợ săn, bạn đã bị giết! Hãy chọn một người để bắn trước khi chết.\n\n` +
                        this.getAlivePlayersList(game) + `\n\n` +
                        `Reply tin nhắn này với ID của người bạn muốn bắn.`,
                        killedPlayer,
                        (err, info) => {
                            if (!err) {
                                global.client.onReply.push({
                                    name: this.name,
                                    messageID: info.messageID,
                                    author: killedPlayer,
                                    threadID: game.threadID,
                                    type: "hunter_shoot"
                                });
                            }
                        }
                    );
                }
            }
        } else {
            killMessage = "🌟 Không ai bị giết trong đêm qua!";
            game.history.push(`Đêm ${game.day}: Không ai bị giết.`);
        }

        // Kiểm tra xem game đã kết thúc chưa
        const gameStatus = this.checkGameEnd(game);
        if (gameStatus) {
            await this.endGame(api, game, gameStatus);
            return;
        }

        // Lưu người được vệ sĩ bảo vệ để đêm sau không thể bảo vệ
        if (bodyguardTarget) {
            game.bodyguardLastProtected = bodyguardTarget;
        }

        // Bắt đầu ngày mới
        await this.startDay(api, game, killMessage);
    },

    // Bắt đầu ngày mới
    startDay: async function(api, game, killMessage) {
        game.status = "day";
        game.votes.clear();
        game.lastActivityTime = Date.now();

        // Thông báo ban ngày
        await api.sendMessage(
            `☀️ NGÀY THỨ ${game.day} ☀️\n\n` +
            `${killMessage}\n\n` +
            `👥 Người chơi còn sống:\n` +
            this.getAlivePlayersList(game) + `\n\n` +
            `Hãy thảo luận để tìm ra ma sói. Bạn có 3 phút để thảo luận.\n` +
            `Sau đó sẽ bắt đầu bỏ phiếu treo cổ.`,
            game.threadID
        );

        // Sau 3 phút, bắt đầu bỏ phiếu
        setTimeout(() => {
            this.startVoting(api, game);
        }, 3 * 60 * 1000);
    },

    // Bắt đầu bỏ phiếu
    startVoting: async function(api, game) {
        if (game.status !== "day") return; // Phòng trường hợp game đã kết thúc

        game.status = "voting";
        game.votes.clear();
        game.lastActivityTime = Date.now();

        await api.sendMessage(
            `🗳️ BẮT ĐẦU BỎ PHIẾU 🗳️\n\n` +
            `Hãy vote treo cổ người mà bạn nghi ngờ là ma sói.\n` +
            `👥 Người chơi còn sống:\n` +
            this.getAlivePlayersList(game) + `\n\n` +
            `Cách vote: .masoi vote [ID người chơi]`,
            game.threadID
        );

        // Sau 2 phút, kết thúc bỏ phiếu
        setTimeout(() => {
            this.processVotes(api, game);
        }, 2 * 60 * 1000);
    },

    // Xử lý kết quả bỏ phiếu
    processVotes: async function(api, game) {
        if (game.status !== "voting") return; // Phòng trường hợp game đã kết thúc

        // Đếm phiếu bầu
        const voteCounts = new Map();
        
        // Khởi tạo số phiếu cho mỗi người chơi còn sống
        for (const [playerId, player] of game.players.entries()) {
            if (player.isAlive) {
                voteCounts.set(playerId, 0);
            }
        }

        // Đếm số phiếu
        for (const [voterId, targetId] of game.votes.entries()) {
            if (voteCounts.has(targetId)) {
                voteCounts.set(targetId, voteCounts.get(targetId) + 1);
            }
        }

        // Tìm người có số phiếu cao nhất
        let maxVotes = 0;
        let hangedPlayers = [];

        for (const [playerId, voteCount] of voteCounts.entries()) {
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                hangedPlayers = [playerId];
            } else if (voteCount === maxVotes && voteCount > 0) {
                hangedPlayers.push(playerId);
            }
        }

        // Xử lý kết quả
        let resultMessage = "";
        
        if (hangedPlayers.length === 0 || maxVotes === 0) {
            resultMessage = "❗ Không ai bị treo cổ vì không đủ phiếu bầu.";
            game.history.push(`Ngày ${game.day}: Không ai bị treo cổ.`);
        } else if (hangedPlayers.length > 1) {
            resultMessage = `❗ Không ai bị treo cổ vì có ${hangedPlayers.length} người có số phiếu bằng nhau.`;
            game.history.push(`Ngày ${game.day}: Không ai bị treo cổ do có ${hangedPlayers.length} người cùng số phiếu.`);
        } else {
            // Một người bị treo cổ
            const hangedId = hangedPlayers[0];
            const hangedPlayer = game.players.get(hangedId);
            
            hangedPlayer.isAlive = false;
            
            resultMessage = `☠️ ${hangedPlayer.name} đã bị treo cổ với ${maxVotes} phiếu. Họ là ${this.roles[hangedPlayer.role].name}.`;
            game.history.push(`Ngày ${game.day}: ${hangedPlayer.name} (${this.roles[hangedPlayer.role].name}) đã bị treo cổ với ${maxVotes} phiếu.`);
        }

        await api.sendMessage(resultMessage, game.threadID);

        // Kiểm tra kết thúc game
        const gameStatus = this.checkGameEnd(game);
        if (gameStatus) {
            await this.endGame(api, game, gameStatus);
            return;
        }

        // Chuyển sang đêm tiếp theo
        game.day++;
        setTimeout(() => {
            this.startNight(api, game);
        }, 20000); // Đợi 20 giây trước khi bắt đầu đêm mới
    },

    // Kiểm tra điều kiện kết thúc game
    checkGameEnd: function(game) {
        let villageCount = 0;
        let werewolfCount = 0;

        // Đếm số lượng người còn sống của mỗi phe
        for (const [_, player] of game.players.entries()) {
            if (player.isAlive) {
                if (player.role === "werewolf") {
                    werewolfCount++;
                } else {
                    villageCount++;
                }
            }
        }

        // Kiểm tra điều kiện chiến thắng
        if (werewolfCount === 0) {
            return "village"; // Dân làng thắng
        } else if (werewolfCount >= villageCount) {
            return "werewolf"; // Ma sói thắng
        }

        return null; // Game chưa kết thúc
    },

    // Kết thúc game
    endGame: async function(api, game, winner) {
        game.status = "ended";
        clearInterval(game.checkInactivityInterval);
        this.activeGames.delete(game.threadID);

        // Tạo danh sách vai trò của tất cả người chơi
        let playerRoles = "";
        for (const [_, player] of game.players.entries()) {
            const role = this.roles[player.role];
            playerRoles += `👤 ${player.name}: ${role.name} (${player.isAlive ? "còn sống" : "đã chết"})\n`;
        }

        // Tạo tóm tắt lịch sử game
        let gameHistory = "📜 Lịch sử game:\n";
        game.history.forEach(event => {
            gameHistory += `- ${event}\n`;
        });

        // Tính thời gian chơi
        const gameTime = this.formatTime(Date.now() - game.startTime);

        // Gửi thông báo kết thúc game
        await api.sendMessage(
            `🎮 GAME MA SÓI KẾT THÚC 🎮\n\n` +
            `${winner === "village" ? "🏆 DÂN LÀNG CHIẾN THẮNG! Tất cả Ma Sói đã bị tiêu diệt." : "🐺 MA SÓI CHIẾN THẮNG! Ma sói đã áp đảo dân làng."}\n\n` +
            `⏱️ Thời gian chơi: ${gameTime}\n\n` +
            `👥 Vai trò người chơi:\n${playerRoles}\n\n` +
            gameHistory,
            game.threadID
        );
    },

    // Lấy danh sách người chơi còn sống
    getAlivePlayersList: function(game) {
        return Array.from(game.players.entries())
            .filter(([_, player]) => player.isAlive)
            .map(([id, player], index) => `${index+1}. ${player.name} (${id})`)
            .join('\n');
    },

    // Format thời gian
    formatTime: function(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // Xử lý dọn dẹp khi module được tải lại
    onLoad: function() {
        for (const [threadID, game] of this.activeGames) {
            if (game.checkInactivityInterval) {
                clearInterval(game.checkInactivityInterval);
            }
        }
        this.activeGames.clear();
    },

    // Xử lý lệnh
    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            
            if (!target[0]) {
                return api.sendMessage(
                    "🎮 GAME MA SÓI (WEREWOLF) 🎮\n\n" +
                    "📌 Cách chơi:\n" +
                    "- .masoi create: Tạo ván mới\n" +
                    "- .masoi join: Tham gia ván đang chờ\n" +
                    "- .masoi start: Bắt đầu ván (chỉ host)\n" +
                    "- .masoi leave: Rời khỏi ván\n" +
                    "- .masoi list: Xem danh sách người chơi\n" +
                    "- .masoi vote [ID]: Bỏ phiếu treo cổ\n" +
                    "- .masoi end: Kết thúc ván (chỉ host)\n" +
                    "- .masoi help: Xem hướng dẫn\n\n" +
                    "📋 Luật chơi: Dân làng tìm và tiêu diệt Ma sói, Ma sói cố gắng giết hết dân làng.",
                    threadID, messageID
                );
            }

            const action = target[0].toLowerCase();
            const game = this.activeGames.get(threadID);

            switch (action) {
                case "create":
                    if (game) {
                        return api.sendMessage("❌ Đã có ván Ma Sói đang diễn ra trong nhóm này!", threadID, messageID);
                    }
                    
                    this.createGame(threadID, senderID);
                    return api.sendMessage(
                        "🎮 Đã tạo ván Ma Sói mới!\n\n" +
                        `👑 Host: ${this.getUserName(senderID)}\n` +
                        "👥 Số người chơi: 1/12\n\n" +
                        "📌 Dùng .masoi join để tham gia\n" +
                        "📌 Cần ít nhất 5 người để bắt đầu\n" +
                        "📌 Host dùng .masoi start để bắt đầu game",
                        threadID, messageID
                    );

                case "join":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    if (game.status !== "waiting") {
                        return api.sendMessage("❌ Ván Ma Sói đã bắt đầu, không thể tham gia!", threadID, messageID);
                    }
                    
                    if (game.players.has(senderID)) {
                        return api.sendMessage("❌ Bạn đã tham gia ván này rồi!", threadID, messageID);
                    }
                    
                    if (game.players.size >= 12) {
                        return api.sendMessage("❌ Ván đã đầy người chơi (tối đa 12 người)!", threadID, messageID);
                    }
                    
                    game.players.set(senderID, {
                        id: senderID,
                        name: this.getUserName(senderID),
                        role: null,
                        isAlive: true,
                        voteTarget: null
                    });
                    
                    return api.sendMessage(
                        `✅ ${this.getUserName(senderID)} đã tham gia ván Ma Sói!\n` +
                        `👥 Số người chơi: ${game.players.size}/12`,
                        threadID, messageID
                    );

                case "start":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    if (senderID !== game.creatorID) {
                        return api.sendMessage("❌ Chỉ host mới có thể bắt đầu game!", threadID, messageID);
                    }
                    
                    if (game.status !== "waiting") {
                        return api.sendMessage("❌ Game đã bắt đầu rồi!", threadID, messageID);
                    }
                    
                    const startMessage = await this.startGame(api, threadID);
                    return api.sendMessage(startMessage, threadID, messageID);

                case "list":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    let playerList = "";
                    let count = 1;
                    
                    for (const [playerId, player] of game.players.entries()) {
                        const statusEmoji = game.status === "waiting" ? "⌛" : (player.isAlive ? "✅" : "☠️");
                        playerList += `${count}. ${statusEmoji} ${player.name}${playerId === game.creatorID ? " 👑" : ""}\n`;
                        count++;
                    }
                    
                    const gameState = game.status === "waiting" ? "Đang chờ" : 
                                     game.status === "night" ? "Đêm " + game.day :
                                     game.status === "day" ? "Ngày " + game.day :
                                     game.status === "voting" ? "Đang bỏ phiếu" : "Đã kết thúc";
                    
                    return api.sendMessage(
                        `👥 DANH SÁCH NGƯỜI CHƠI (${game.players.size})\n` +
                        `🎮 Trạng thái: ${gameState}\n\n` +
                        playerList,
                        threadID, messageID
                    );

                case "leave":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    if (!game.players.has(senderID)) {
                        return api.sendMessage("❌ Bạn không tham gia ván này!", threadID, messageID);
                    }
                    
                    if (game.status !== "waiting") {
                        return api.sendMessage("❌ Game đã bắt đầu, không thể rời đi!", threadID, messageID);
                    }
                    
                    game.players.delete(senderID);
                    
                    // Nếu host rời đi, game sẽ bị hủy hoặc chuyển host
                    if (senderID === game.creatorID) {
                        if (game.players.size === 0) {
                            // Hủy game nếu không còn ai
                            clearInterval(game.checkInactivityInterval);
                            this.activeGames.delete(threadID);
                            return api.sendMessage(
                                "🎮 Ván Ma Sói đã bị hủy vì host đã rời đi và không còn người chơi nào!",
                                threadID, messageID
                            );
                        } else {
                            // Chuyển host cho người đầu tiên còn lại
                            const newHostId = game.players.keys().next().value;
                            game.creatorID = newHostId;
                            
                            return api.sendMessage(
                                `🎮 ${this.getUserName(senderID)} đã rời khỏi ván Ma Sói!\n` +
                                `👑 Host mới: ${this.getUserName(newHostId)}\n` +
                                `👥 Số người chơi: ${game.players.size}/12`,
                                threadID, messageID
                            );
                        }
                    }
                    
                    return api.sendMessage(
                        `🎮 ${this.getUserName(senderID)} đã rời khỏi ván Ma Sói!\n` +
                        `👥 Số người chơi: ${game.players.size}/12`,
                        threadID, messageID
                    );

                case "vote":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    if (game.status !== "voting") {
                        return api.sendMessage("❌ Hiện không phải thời gian bỏ phiếu!", threadID, messageID);
                    }
                    
                    if (!game.players.has(senderID) || !game.players.get(senderID).isAlive) {
                        return api.sendMessage("❌ Bạn không thể bỏ phiếu!", threadID, messageID);
                    }
                    
                    const targetId = target[1];
                    if (!targetId) {
                        return api.sendMessage("❌ Bạn cần chỉ định ID người chơi để vote!", threadID, messageID);
                    }
                    
                    if (!game.players.has(targetId) || !game.players.get(targetId).isAlive) {
                        return api.sendMessage("❌ Người chơi không hợp lệ hoặc đã chết!", threadID, messageID);
                    }
                    
                    // Lưu phiếu bầu
                    game.votes.set(senderID, targetId);
                    game.lastActivityTime = Date.now();
                    
                    return api.sendMessage(
                        `✅ ${this.getUserName(senderID)} đã bỏ phiếu treo cổ ${this.getUserName(targetId)}!`,
                        threadID, messageID
                    );

                case "end":
                    if (!game) {
                        return api.sendMessage("❌ Chưa có ván Ma Sói nào được tạo!", threadID, messageID);
                    }
                    
                    if (senderID !== game.creatorID) {
                        return api.sendMessage("❌ Chỉ host mới có thể kết thúc game!", threadID, messageID);
                    }
                    
                    clearInterval(game.checkInactivityInterval);
                    this.activeGames.delete(threadID);
                    
                    return api.sendMessage(
                        "🎮 Ván Ma Sói đã bị hủy bởi host!",
                        threadID, messageID
                    );

                case "help":
                    return api.sendMessage(
                        "🎮 HƯỚNG DẪN CHƠI MA SÓI 🎮\n\n" +
                        "📌 Vai trò:\n" +
                        "- Dân làng: Không có khả năng đặc biệt, chỉ được bỏ phiếu\n" +
                        "- Ma sói: Mỗi đêm giết một người\n" +
                        "- Tiên tri: Mỗi đêm soi danh tính một người\n" +
                        "- Bác sĩ: Mỗi đêm bảo vệ một người\n" +
                        "- Thợ săn: Khi chết có thể bắn chết một người\n" +
                        "- Phù thủy: Có thuốc cứu và thuốc độc\n" +
                        "- Vệ sĩ: Bảo vệ người chơi, không thể bảo vệ cùng một người 2 đêm liên tiếp\n\n" +
                        
                        "📋 Luật chơi:\n" +
                        "- Ban đêm: Ma sói chọn người để giết, các vai trò đặc biệt thực hiện hành động\n" +
                        "- Ban ngày: Mọi người thảo luận và bỏ phiếu treo cổ một người\n" +
                        "- Kết thúc: Dân làng thắng khi tiêu diệt hết Ma sói; Ma sói thắng khi số Ma sói >= số dân làng\n\n" +
                        
                        "❓ Mẹo chơi:\n" +
                        "- Quan sát kỹ phản ứng của người chơi khi thảo luận\n" +
                        "- Vai trò đặc biệt nên cẩn thận khi tiết lộ thông tin\n" +
                        "- Ma sói nên phối hợp và tạo alibi tốt\n\n" +
                        
                        "📱 Lệnh trong game:\n" +
                        ".masoi vote [ID]: Bỏ phiếu treo cổ\n" +
                        ".masoi list: Xem danh sách người chơi\n" +
                        ".masoi end: Kết thúc game (chỉ host)",
                        threadID, messageID
                    );

                default:
                    return api.sendMessage(
                        "❌ Lệnh không hợp lệ! Dùng .masoi help để xem hướng dẫn.",
                        threadID, messageID
                    );
            }
        } catch (error) {
            console.error("Error in masoi command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi! Vui lòng thử lại sau.", event.threadID, event.messageID);
        }
    },

    // Xử lý phản hồi
    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const reply = global.client.onReply.find(r => 
            r.messageID === event.messageReply.messageID && 
            r.author === senderID &&
            r.name === this.name
        );

        if (!reply) return;

        const game = this.activeGames.get(threadID);
        if (!game) {
            return api.sendMessage("❌ Ván Ma Sói đã kết thúc hoặc không tồn tại!", threadID, messageID);
        }

        game.lastActivityTime = Date.now();
        const input = body.trim();

        switch (reply.type) {
            case "werewolf_kill":
                // Xử lý khi ma sói chọn nạn nhân
                if (!game.players.has(input)) {
                    return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                }

                const targetPlayer = game.players.get(input);
                if (!targetPlayer.isAlive) {
                    return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                }

                // Lưu lựa chọn của ma sói
                game.nightActions.set("werewolf_kill", input);
                
                await api.sendMessage(`✅ Bạn đã chọn giết ${targetPlayer.name}!`, senderID);
                
                // Kiểm tra nếu tất cả hành động ban đêm đã hoàn tất
                this.checkNightActionsComplete(api, game);
                break;

            case "seer_check":
                // Xử lý khi tiên tri soi người chơi
                if (!game.players.has(input)) {
                    return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                }

                const checkPlayer = game.players.get(input);
                if (!checkPlayer.isAlive) {
                    return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                }

                // Lưu lựa chọn của tiên tri
                game.nightActions.set("seer_check", input);
                
                // Thông báo kết quả cho tiên tri
                const isSeerWerewolf = checkPlayer.role === "werewolf";
                await api.sendMessage(
                    `🔮 Kết quả soi:\n` +
                    `${checkPlayer.name} ${isSeerWerewolf ? "LÀ MA SÓI! 🐺" : "KHÔNG PHẢI là ma sói. ✅"}`,
                    senderID
                );
                
                // Kiểm tra nếu tất cả hành động ban đêm đã hoàn tất
                this.checkNightActionsComplete(api, game);
                break;

            case "doctor_save":
                // Xử lý khi bác sĩ cứu người
                if (!game.players.has(input)) {
                    return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                }

                const savePlayer = game.players.get(input);
                if (!savePlayer.isAlive) {
                    return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                }

                // Lưu lựa chọn của bác sĩ
                game.nightActions.set("doctor_save", input);
                
                await api.sendMessage(`✅ Bạn đã chọn bảo vệ ${savePlayer.name}!`, senderID);
                
                // Kiểm tra nếu tất cả hành động ban đêm đã hoàn tất
                this.checkNightActionsComplete(api, game);
                break;

            case "bodyguard_protect":
                // Xử lý khi vệ sĩ bảo vệ người chơi
                if (!game.players.has(input)) {
                    return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                }

                const protectPlayer = game.players.get(input);
                if (!protectPlayer.isAlive) {
                    return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                }

                // Kiểm tra xem người này có phải là người được bảo vệ đêm trước không
                if (input === game.bodyguardLastProtected) {
                    return api.sendMessage("❌ Bạn không thể bảo vệ cùng một người hai đêm liên tiếp!", senderID);
                }

                // Lưu lựa chọn của vệ sĩ
                game.nightActions.set("bodyguard_protect", input);
                
                await api.sendMessage(`✅ Bạn đã chọn bảo vệ ${protectPlayer.name}!`, senderID);
                
                // Kiểm tra nếu tất cả hành động ban đêm đã hoàn tất
                this.checkNightActionsComplete(api, game);
                break;

            case "witch_action":
                // Xử lý khi phù thủy sử dụng thuốc
                if (input.toLowerCase() === "skip") {
                    game.nightActions.set("witch_action", { type: "skip" });
                    await api.sendMessage("✅ Bạn đã chọn không sử dụng thuốc!", senderID);
                } else {
                    const parts = input.split(" ");
                    if (parts.length !== 2) {
                        return api.sendMessage("❌ Cú pháp không hợp lệ! Sử dụng: save/kill [ID] hoặc skip", senderID);
                    }

                    const action = parts[0].toLowerCase();
                    const targetId = parts[1];

                    if (action !== "save" && action !== "kill") {
                        return api.sendMessage("❌ Hành động không hợp lệ! Chỉ có thể 'save' hoặc 'kill'", senderID);
                    }

                    if (!game.players.has(targetId)) {
                        return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                    }

                    const targetWitchPlayer = game.players.get(targetId);
                    if (!targetWitchPlayer.isAlive) {
                        return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                    }

                    // Kiểm tra xem có thuốc không
                    if (action === "save" && game.witchPotions.save === 0) {
                        return api.sendMessage("❌ Bạn đã hết thuốc cứu!", senderID);
                    }

                    if (action === "kill" && game.witchPotions.kill === 0) {
                        return api.sendMessage("❌ Bạn đã hết thuốc độc!", senderID);
                    }

                    // Lưu lựa chọn của phù thủy
                    game.nightActions.set("witch_action", { type: action, target: targetId });
                    
                    await api.sendMessage(
                        `✅ Bạn đã chọn ${action === "save" ? "cứu" : "đầu độc"} ${targetWitchPlayer.name}!`,
                        senderID
                    );
                }
                
                // Kiểm tra nếu tất cả hành động ban đêm đã hoàn tất
                this.checkNightActionsComplete(api, game);
                break;

            case "hunter_shoot":
                // Xử lý khi thợ săn bắn người chơi
                if (!game.players.has(input)) {
                    return api.sendMessage("❌ ID người chơi không hợp lệ!", senderID);
                }

                const shootPlayer = game.players.get(input);
                if (!shootPlayer.isAlive) {
                    return api.sendMessage("❌ Người chơi này đã chết!", senderID);
                }

                // Giết người chơi bị bắn
                shootPlayer.isAlive = false;
                
                await api.sendMessage(`✅ Bạn đã bắn chết ${shootPlayer.name}!`, senderID);
                
                // Thông báo cho tất cả người chơi
                await api.sendMessage(
                    `🏹 Thợ săn ${game.players.get(senderID).name} đã bắn chết ${shootPlayer.name} trước khi chết! Họ là ${this.roles[shootPlayer.role].name}.`,
                    threadID
                );
                
                game.history.push(`Ngày ${game.day}: Thợ săn ${game.players.get(senderID).name} đã bắn chết ${shootPlayer.name} (${this.roles[shootPlayer.role].name}).`);
                
                // Kiểm tra kết thúc game
                const gameStatus = this.checkGameEnd(game);
                if (gameStatus) {
                    await this.endGame(api, game, gameStatus);
                }
                break;
        }
    }
};