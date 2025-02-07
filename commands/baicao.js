const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const path = require('path');
const fs = require('fs');

function formatNumber(number) {
    if (number === undefined || number === null) return '0';
    return number.toLocaleString('vi-VN');  
}

module.exports = {
    name: "baicao",
    dev: "HNT",
    usedby: 0,
    info: "Chơi bài cào nhiều người",
    onPrefix: true,
    usages: "baicao create/join/start/leave/bet",
    cooldowns: 0,

    gameRooms: new Map(),
    autoCloseTimers: new Map(),
    playerStats: new Map(), // Lưu thống kê người chơi

    RANKINGS: {
        SAP: 7,    
        LIENG: 6, 
        ANH: 5,  
        DONGCHAT: 4, 
        THUONG: 0 
    },

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID, senderID } = event;
            
            const getUserName = (uid) => {
                try {
                    const userDataFile = path.join(__dirname, '../events/cache/userData.json');
                    const userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
                    return userData[uid]?.name || uid.toString();
                } catch (err) {
                    console.error(`Error getting username for ${uid}:`, err);
                    return uid.toString();
                }
            };

            if (!target[0]) {
                return api.sendMessage(
                    "🎴 BÀI CÀO (Liêng)\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "🎯 Hướng dẫn:\n" +
                    ".baicao create: Tạo bàn (mặc định 10,000 Xu)\n" +
                    ".baicao join: Tham gia\n" +
                    ".baicao start: Bắt đầu ván\n" +
                    ".baicao out: Rời bàn trong khi chơi (mất tiền cược)\n" +
                    ".baicao up [số tiền]: Tăng tiền cược của bản thân\n" +
                    ".baicao kick [@tag]: Kick người chơi (chủ bàn)\n" +
                    ".baicao stop: Dừng ván đấu (chủ bàn)\n" +
                    "📝 Thứ tự các loại bài:\n" +
                    "1. Sáp: Ba lá bài giống nhau (VD: 666)\n" +
                    "2. Liêng: Dây liên tiếp 123\n" +
                    "3. Ảnh: Ba lá bài đầu người J,Q,K (VD: JJQ, KKK, JQK)\n" + 
                    "4. Đồng chất: 3 lá cùng chất (VD: ♠️♠️♠️)\n" +
                    "5. Tính điểm: Tổng 3 lá chia lấy dư cho 10\n\n" +
                    "💎 Giá trị:\n" +
                    "- A = 1 điểm\n" +
                    "- 2-9 = 2-9 điểm\n" +
                    "- 10, J, Q, K = 10 điểm\n" +
                    "- Chất bài: ♠️ > ♣️ > ♦️ > ♥️\n\n" +
                    "⚡️ Lưu ý:\n" +
                    "- Mỗi bàn tối đa 8 người\n" +
                    "- Cược khởi điểm 10,000 xu/người\n" +
                    "- Ván mới tự động bắt đầu sau 2 phút\n" +
                    "- Phí thắng game 5%", 
                    threadID
                );
            }

            const command = target[0].toLowerCase();
            const room = this.gameRooms.get(threadID);

            if (this.autoCloseTimers.has(threadID)) {
                clearTimeout(this.autoCloseTimers.get(threadID));
                this.autoCloseTimers.delete(threadID);
            }

            switch (command) {
                case "create":
                    try {
                        if (room) {
                            if (room.status === "playing") {
                                return api.sendMessage("❌ Đang có ván đang diễn ra!", threadID);
                            }
                            return api.sendMessage("❌ Đã có bàn được tạo! Hãy tham gia hoặc đợi ván kết thúc.", threadID);
                        }

                        const hostBalance = getBalance(senderID);
                        if (hostBalance < 10000) {
                            return api.sendMessage(`Bạn không đủ 10,000 Xu để tạo bàn!`, threadID);
                        }

                        const hostName = getUserName(senderID);
                        this.gameRooms.set(threadID, {
                            host: senderID,
                            hostName: hostName,
                            players: [{id: senderID, name: hostName, cards: [], total: 0, ready: false, betAmount: 10000}],
                            status: "waiting",
                            deck: null,
                            betAmount: 10000,  // Add default bet amount here
                            allowPlayerUp: false // Thêm thuộc tính mới - mặc định chỉ host up được
                        });

                        // Khởi tạo thống kê cho host
                        if (!this.playerStats.has(senderID)) {
                            this.playerStats.set(senderID, {
                                gamesPlayed: 0,
                                gamesWon: 0,
                                totalEarnings: 0,
                                lastGameTime: Date.now()
                            });
                        }

                        this.autoCloseTimers.set(threadID, setTimeout(() => {
                            if (this.gameRooms.has(threadID) && this.gameRooms.get(threadID).status === "waiting") {
                                api.sendMessage("⌛ Bàn đã tự động đóng do không có người chơi trong 2 phút!", threadID);
                                this.gameRooms.delete(threadID);
                                this.autoCloseTimers.delete(threadID);
                            }
                        }, 120000));

                        return api.sendMessage(
                            `🎴 ${hostName} đã tạo bàn!\n` +
                            `💰 Tiền cược tối thiểu: 10,000 Xu\n` +
                            `⏳ Bàn sẽ tự động đóng sau 2 phút nếu không bắt đầu!`, 
                            threadID
                        );
                    } catch (err) {
                        console.error("Error creating room:", err);
                        return api.sendMessage("Có lỗi xảy ra khi tạo bàn!", threadID);
                    }

                case "join":
                    try {
                        if (!room) return api.sendMessage("Chưa có bàn nào được tạo!", threadID);
                        if (room.status !== "waiting") return api.sendMessage("Ván đang diễn ra!", threadID);
                        if (room.players.find(p => p.id === senderID)) return api.sendMessage("Bạn đã ở trong bàn!", threadID);
                        if (room.players.length >= 8) return api.sendMessage("Bàn đã đầy!", threadID);

                        const defaultBet = room.betAmount || 10000; // Fallback to 10000 if undefined
                        const balance = getBalance(senderID);
                        if (balance < defaultBet) {
                            return api.sendMessage(
                                `❌ Bạn không đủ ${formatNumber(defaultBet)} Xu để tham gia bàn này!`, 
                                threadID
                            );
                        }

                        // Kiểm tra lịch sử thắng thua
                        const playerStat = this.playerStats.get(senderID) || {
                            gamesPlayed: 0,
                            gamesWon: 0,
                            totalEarnings: 0,
                            lastGameTime: 0
                        };
                        
                        // Nếu người chơi thắng nhiều và rời bàn quá nhanh
                        const timeSinceLastGame = Date.now() - playerStat.lastGameTime;
                        if (playerStat.totalEarnings > 1000000 && timeSinceLastGame < 300000) { // 5 phút
                            return api.sendMessage(
                                "❌ Bạn cần đợi thêm một lúc để vào chơi tiếp!\n" +
                                "⏳ Thời gian còn lại: " + Math.ceil((300000 - timeSinceLastGame)/60000) + " phút",
                                threadID
                            );
                        }
                        
                        const playerName = getUserName(senderID);
                        room.players.push({
                            id: senderID, 
                            name: playerName, 
                            cards: [], 
                            total: 0, 
                            ready: false,
                            betAmount: defaultBet
                        });
                        const playerList = room.players.map(p => p.name).join(", ");
                        return api.sendMessage(
                            `👤 ${playerName} đã tham gia!\n` +
                            `Người chơi (${room.players.length}/8): ${playerList}\n` +
                            `💰 Tiền cược: ${formatNumber(defaultBet)} Xu`,
                            threadID
                        );
                    } catch (err) {
                        console.error("Error joining game:", err);
                        return api.sendMessage("Có lỗi xảy ra khi tham gia!", threadID);
                    }

                case "ready":
                    if (!room) return api.sendMessage("Chưa có bàn nào được tạo!", threadID);
                    if (!room.players.find(p => p.id === senderID)) return api.sendMessage("Bạn không trong bàn!", threadID);
                    if (room.status !== "waiting_ready") return api.sendMessage("Chưa tới lúc ready!", threadID);
                    
                    const player = room.players.find(p => p.id === senderID);
                    if (player.ready) return api.sendMessage("Bạn đã sẵn sàng rồi!", threadID);
                    
                    player.ready = true;
                    const readyPlayers = room.players.filter(p => p.ready).length;
                    api.sendMessage(`👤 ${player.name} đã sẵn sàng! (${readyPlayers}/${room.players.length})`, threadID);

                    if (readyPlayers === room.players.length) {
                        room.status = "waiting";
                        api.sendMessage("🎮 Tất cả đã sẵn sàng! Chủ phòng có thể bắt đầu ván mới.", threadID);
                    }
                    break;

                case "start":
                    try {
                        if (!room) return api.sendMessage("Chưa có bàn nào được tạo!", threadID);
                        if (room.host !== senderID) return api.sendMessage("Chỉ chủ bàn mới được bắt đầu!", threadID);
                        if (room.players.length < 2) return api.sendMessage("Cần ít nhất 2 người để chơi!", threadID);
                        if (room.status !== "waiting") return api.sendMessage("Không thể bắt đầu lúc này!", threadID);

                        // Kiểm tra lại số dư của tất cả người chơi
                        const insufficientPlayers = [];
                        for (let player of room.players) {
                            const pBalance = getBalance(player.id);
                            if (pBalance < room.betAmount) {
                                insufficientPlayers.push(player.name);
                            }
                        }

                        if (insufficientPlayers.length > 0) {
                            return api.sendMessage(
                                `❌ Không thể bắt đầu vì các người chơi sau không đủ ${formatNumber(room.betAmount)} Xu:\n` +
                                insufficientPlayers.join(", "),
                                threadID
                            );
                        }

                        // Trừ tiền tất cả người chơi
                        for (let player of room.players) {
                            updateBalance(player.id, -room.betAmount);
                        }

                        room.status = "confirming";
                        await api.sendMessage(
                            `🎴 Bắt đầu ván!\n` +
                            `💰 Tiền cược: ${formatNumber(room.betAmount)} Xu/người\n` +
                            `👥 Số người chơi: ${room.players.length}\n` +
                            `💵 Tổng tiền: ${formatNumber(room.betAmount * room.players.length)} Xu\n` +
                            `Đang chia bài...`,
                            threadID
                        );
                        this.startGame(api, threadID);
                    } catch (err) {
                        console.error("Error starting game:", err);
                        return api.sendMessage("Có lỗi xảy ra khi bắt đầu ván!", threadID);
                    }
                    break;

                case "kick":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (room.host !== senderID) return api.sendMessage("Chỉ chủ bàn mới được kick!", threadID);
                    const mentionId = Object.keys(event.mentions)[0];
                    if (!mentionId) return api.sendMessage("Vui lòng tag người cần kick!", threadID);
                    
                    const kickedPlayer = room.players.find(p => p.id === mentionId);
                    if (!kickedPlayer) return api.sendMessage("Người này không có trong bàn!", threadID);
                    
                    room.players = room.players.filter(p => p.id !== mentionId);
                    if (room.players.length < 2 && room.status === "playing") {
                        api.sendMessage("❌ Số người chơi không đủ, ván đấu kết thúc!", threadID);
                        this.gameRooms.delete(threadID);
                        return;
                    }
                    
                    return api.sendMessage(`👢 Đã kick ${kickedPlayer.name} khỏi bàn!`, threadID);

                case "stop":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (room.host !== senderID) return api.sendMessage("Chỉ chủ bàn mới được dừng!", threadID);
                    
                    api.sendMessage("🛑 Chủ bàn đã dừng ván đấu!", threadID);
                    this.gameRooms.delete(threadID);
                    return;

                case "out":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (!room.players.find(p => p.id === senderID)) return api.sendMessage("Bạn không trong bàn!", threadID);
                    if (room.status !== "playing") return api.sendMessage("Chỉ có thể out khi đang chơi!", threadID);
                    
                    const outPlayer = room.players.find(p => p.id === senderID);
                    room.players = room.players.filter(p => p.id !== senderID);

                    if (room.players.length < 2) {
                        api.sendMessage(
                            `👤 ${outPlayer.name} đã rời bàn (mất ${formatNumber(room.betAmount)} Xu)\n` +
                            "❌ Không đủ người chơi, ván đấu kết thúc!", 
                            threadID
                        );
                        this.gameRooms.delete(threadID);
                        return;
                    }

                    if (room.host === senderID) {
                        room.host = room.players[0].id;
                        room.hostName = room.players[0].name;
                        api.sendMessage(
                            `👤 ${outPlayer.name} đã rời bàn (mất ${formatNumber(room.betAmount)} Xu)\n` +
                            `👑 ${room.hostName} là chủ bàn mới!`,
                            threadID
                        );
                    } else {
                        api.sendMessage(
                            `👤 ${outPlayer.name} đã rời bàn (mất ${formatNumber(room.betAmount)} Xu)`,
                            threadID
                        );
                    }
                    break;

                case "mode":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (room.host !== senderID) return api.sendMessage("Chỉ chủ bàn mới được đổi chế độ!", threadID);
                    if (room.status !== "waiting") return api.sendMessage("Chỉ có thể đổi chế độ khi chưa bắt đầu!", threadID);
                    
                    room.allowPlayerUp = !room.allowPlayerUp;
                    return api.sendMessage(
                        `🔄 Đã ${room.allowPlayerUp ? "bật" : "tắt"} chế độ cho phép người chơi tự đặt cược\n` +
                        `⚡️ Hiện tại: ${room.allowPlayerUp ? "Ai cũng có thể tăng tiền cược" : "Chỉ chủ bàn mới được tăng tiền cược"}`,
                        threadID
                    );

                case "up":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (room.status !== "waiting") return api.sendMessage("Chỉ có thể tăng tiền khi chưa bắt đầu!", threadID);
                    
                    if (!room.allowPlayerUp && senderID !== room.host) {
                        return api.sendMessage("❌ Hiện tại chỉ chủ bàn mới được tăng tiền cược!", threadID);
                    }
                    
                    const playerUp = room.players.find(p => p.id === senderID);
                    if (!playerUp) return api.sendMessage("Bạn không trong bàn!", threadID);
                    
                    const upAmount = parseInt(target[1]);
                    if (!upAmount || upAmount <= playerUp.betAmount) {
                        return api.sendMessage(
                            `Vui lòng nhập số tiền cao hơn mức hiện tại của bạn (${formatNumber(playerUp.betAmount)} Xu)`,
                            threadID
                        );
                    }

                    // Nếu không phải host thì chỉ được up tiền của mình
                    if (senderID !== room.host) {
                        const balance = getBalance(senderID);
                        if (balance < upAmount) {
                            return api.sendMessage(
                                `❌ Bạn không đủ ${formatNumber(upAmount)} Xu để tăng tiền cược!`,
                                threadID
                            );
                        }
                        playerUp.betAmount = upAmount;
                        return api.sendMessage(
                            `💰 ${playerUp.name} đã tự đặt mức cược ${formatNumber(upAmount)} Xu`,
                            threadID
                        );
                    }

                    // Phần code cho host up tiền (giữ nguyên logic cũ)
                    // Kiểm tra số dư của tất cả người chơi
                    for (let p of room.players) {
                        const pBalance = getBalance(p.id);
                        if (pBalance < upAmount) {
                            return api.sendMessage(
                                `❌ Không thể tăng lên ${formatNumber(upAmount)} Xu vì người chơi ${p.name} không đủ tiền!`,
                                threadID
                            );
                        }
                    }

                    // Cập nhật tiền cược cho cả bàn
                    room.betAmount = upAmount;
                    for (let p of room.players) {
                        p.betAmount = upAmount;
                    }

                    return api.sendMessage(
                        `💰 Chủ bàn đã tăng tiền cược lên ${formatNumber(upAmount)} Xu\n` +
                        `⚠️ Tất cả người chơi sẽ phải cược ${formatNumber(upAmount)} Xu`,
                        threadID
                    );
            }
        } catch (err) {
            console.error("Main game error:", err);
            return api.sendMessage("Có lỗi xảy ra, vui lòng thử lại!", event.threadID);
        }
    },

    async startGame(api, threadID) {
        try {
            const room = this.gameRooms.get(threadID);
            if (!room) return;

            room.status = "playing";
            room.deck = this.createDeck();
            
            // Kiểm tra lại số dư trước khi trừ tiền
            let canPlay = true;
            for (let player of room.players) {
                const balance = getBalance(player.id);
                if (balance < player.betAmount) {
                    canPlay = false;
                    api.sendMessage(
                        `❌ Không thể bắt đầu vì ${player.name} không đủ ${formatNumber(player.betAmount)} Xu!`,
                        threadID
                    );
                    break;
                }
            }

            if (!canPlay) {
                room.status = "waiting";
                return;
            }

            // Trừ tiền người chơi
            for (let player of room.players) {
                updateBalance(player.id, -player.betAmount);
                player.hasPaid = true;
            }

            await api.sendMessage("🎴 Đang chia bài...\n⏳ Đợi 10 giây để xem kết quả!", threadID);

            setTimeout(async () => {
                try {
                    for (let player of room.players) {
                        player.cards = room.deck.splice(0, 3);
                        player.total = this.calculateHand(player.cards).value; 
                    }

                    let resultMsg = `🎴 Kết quả (Cược: ${formatNumber(room.betAmount)} Xu):\n\n`;
                    
                    room.players.sort((a, b) => {
                        const handA = this.calculateHand(a.cards);
                        const handB = this.calculateHand(b.cards);
                        
                        if (handA.rank !== handB.rank) {
                            return handB.rank - handA.rank;
                        }
                        if (handA.value !== handB.value) {
                            return handB.value - handA.value;
                        }
                        return Math.max(...b.cards.map(c => this.getSuitValue(c.suit))) - 
                               Math.max(...a.cards.map(c => this.getSuitValue(c.suit)));
                    });

                    // Sửa phần hiển thị kết quả để thêm thông tin tiền cược
                    for (let i = 0; i < room.players.length; i++) {
                        const player = room.players[i];
                        const hand = this.calculateHand(player.cards);
                        const cards = player.cards.map(c => `${c.value}${c.suit}`).join(" ");
                        resultMsg += `${i+1}. ${player.name} (Cược: ${formatNumber(player.betAmount)} Xu)\n`; // Thêm thông tin cược
                        resultMsg += `Bài: ${cards}\n`;
                        resultMsg += `Kết quả: ${hand.type} (${hand.value} điểm)\n\n`;
                    }

                    const winner = room.players[0];
                    const totalPot = room.players.reduce((sum, player) => sum + player.betAmount, 0);
                    // Bỏ phí 5%, winner nhận toàn bộ pot
                    const winnings = totalPot;

                    // Cập nhật thống kê người thắng
                    const winnerStats = this.playerStats.get(winner.id) || {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalEarnings: 0,
                        lastGameTime: Date.now()
                    };
                    
                    winnerStats.gamesPlayed++;
                    winnerStats.gamesWon++;
                    winnerStats.totalEarnings += winnings;
                    winnerStats.lastGameTime = Date.now();
                    this.playerStats.set(winner.id, winnerStats);

                    // Cập nhật thống kê người thua
                    room.players.forEach(player => {
                        if (player.id !== winner.id) {
                            const stats = this.playerStats.get(player.id) || {
                                gamesPlayed: 0,
                                gamesWon: 0,
                                totalEarnings: 0,
                                lastGameTime: Date.now()
                            };
                            stats.gamesPlayed++;
                            stats.totalEarnings -= player.betAmount;
                            stats.lastGameTime = Date.now();
                            this.playerStats.set(player.id, stats);
                        }
                    });

                    // Thêm thông tin thống kê vào tin nhắn kết quả
                    resultMsg += `\n📊 Thông kê người thắng:\n`;
                    resultMsg += `Số ván thắng: ${winnerStats.gamesWon}\n`;
                    resultMsg += `Tổng thu: ${formatNumber(winnerStats.totalEarnings)} Xu\n`;

                    // Trả tiền cho winner
                    await updateBalance(winner.id, winnings);
                    await updateQuestProgress(winner.id, "win_games");

                    resultMsg += `\n🎉 Người thắng: ${winner.name}\n`;
                    resultMsg += `💰 Thắng: ${formatNumber(winnings)} Xu\n\n`;
                    resultMsg += "⏳ Ván mới sẽ bắt đầu sau 45 giây...";

                    await api.sendMessage(resultMsg, threadID);

                    // Reset game state
                    room.status = "waiting";
                    room.deck = null;
                    for (let player of room.players) {
                        player.cards = [];
                        player.total = 0;
                        player.hasPaid = false; // Reset trạng thái trừ tiền
                    }

                    setTimeout(async () => {
                        if (this.gameRooms.has(threadID)) {
                            const room = this.gameRooms.get(threadID);
                            if (room.players.length >= 2) {
                                const kickedPlayers = [];
                                room.players = room.players.filter(player => {
                                    const balance = getBalance(player.id);
                                    if (balance < room.betAmount) { // Sửa từ 10000 thành room.betAmount
                                        kickedPlayers.push(player.name);
                                        return false;
                                    }
                                    return true;
                                });

                                if (kickedPlayers.length > 0) {
                                    await api.sendMessage(
                                        `⚠️ Những người chơi sau đã bị kick do không đủ ${formatNumber(room.betAmount)} Xu cho ván mới:\n${kickedPlayers.join(", ")}`,
                                        threadID
                                    );
                                }

                                if (room.players.length < 2) {
                                    api.sendMessage("❌ Không đủ người chơi để bắt đầu ván mới!", threadID);
                                    this.gameRooms.delete(threadID);
                                    return;
                                }

                                if (!room.players.find(p => p.id === room.host)) {
                                    room.host = room.players[0].id;
                                    room.hostName = room.players[0].name;
                                    await api.sendMessage(
                                        `👑 ${room.hostName} là chủ bàn mới!`,
                                        threadID
                                    );
                                }

                                for (let player of room.players) {
                                    updateBalance(player.id, -room.betAmount); // Sửa từ 10000 thành room.betAmount
                                }
                                
                                await api.sendMessage(
                                    `🎴 Bắt đầu ván mới!\n` +
                                    `👥 Số người chơi: ${room.players.length}\n` +
                                    `💰 Tiền cược: ${formatNumber(room.betAmount)} Xu\n` + // Hiển thị đúng số tiền cược hiện tại
                                    `💵 Tổng tiền: ${formatNumber(room.betAmount * room.players.length)} Xu\n` +
                                    `Đang chia bài...`, 
                                    threadID
                                );
                                this.startGame(api, threadID);
                            } else {
                                api.sendMessage("❌ Không đủ người chơi để bắt đầu ván mới!", threadID);
                                this.gameRooms.delete(threadID);
                            }
                        }
                    }, 45000); 

                } catch (err) {
                    // Hoàn tiền nếu có lỗi
                    if (room && room.players) {
                        for (let player of room.players) {
                            if (player.hasPaid) {
                                await updateBalance(player.id, player.betAmount);
                            }
                        }
                    }
                    console.error("Error in game completion:", err);
                    await api.sendMessage("Có lỗi xảy ra khi kết thúc ván! Đã hoàn tiền cho người chơi.", threadID);
                }
            }, 10000);

        } catch (err) {
            console.error("Fatal error in startGame:", err);
            await api.sendMessage("Có lỗi nghiêm trọng xảy ra!", threadID);
            this.gameRooms.delete(threadID);
        }
    },

    createDeck() {
        const suits = ["♠️", "♣️", "♦️", "♥️"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        let deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    },

    calculateHand(cards) {
        const values = cards.map(c => {
            if (c.value === "A") return 1;
            if (["J", "Q", "K"].includes(c.value)) return 10;
            return parseInt(c.value);
        });

        // Check Sáp (3 of a kind)
        if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) {
            return {
                type: "SAP",
                rank: this.RANKINGS.SAP,
                value: parseInt(cards[0].value) || 10
            };
        }

        // Check Liêng (straight)
        const cardValues = cards.map(c => {
            if (c.value === "A") return 1;
            if (c.value === "J") return 11;
            if (c.value === "Q") return 12;
            if (c.value === "K") return 13;
            return parseInt(c.value);
        }).sort((a, b) => a - b);

        // Check regular straight (1,2,3 or consecutive numbers)
        const isRegularStraight = cardValues[0] + 1 === cardValues[1] && cardValues[1] + 1 === cardValues[2];
        // Check A,Q,K sequence (1,12,13)
        const isAQKStraight = cardValues[0] === 1 && cardValues[1] === 12 && cardValues[2] === 13;

        if (isRegularStraight || isAQKStraight) {
            return {
                type: "LIENG",
                rank: this.RANKINGS.LIENG,
                value: Math.max(...cardValues)
            };
        }

        if (cards.every(c => ["J", "Q", "K"].includes(c.value))) {
            return {
                type: "ANH",
                rank: this.RANKINGS.ANH,
                value: 10
            };
        }

        if (cards.every(c => c.suit === cards[0].suit)) {
            return {
                type: "DONGCHAT",
                rank: this.RANKINGS.DONGCHAT,
                value: Math.max(...values)
            };
        }

        return {
            type: "THUONG",
            rank: this.RANKINGS.THUONG,
            value: values.reduce((sum, val) => sum + val, 0) % 10
        };
    },

    getSuitValue(suit) {
        return ["♠️", "♣️", "♦️", "♥️"].indexOf(suit);
    },

    calculateTotal(cards) {
        return cards.reduce((sum, card) => {
            if (card.value === "A") return sum + 1;
            if (["J", "Q", "K"].includes(card.value)) return sum + 10;
            return sum + parseInt(card.value);
        }, 0) % 10;
    }
};
