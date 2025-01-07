const { getBalance, updateBalance, updateQuestProgress } = require('../utils/currencies');
const path = require('path');
const fs = require('fs');

function formatNumber(number) {
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
                return api.sendMessage("BÀI CÀO\n━━━━━━━━━━━━━━━━━━\n\nHướng dẫn:\n.baicao create: Tạo bàn\n.baicao join: Tham gia\n.baicao start: Bắt đầu ván\n.baicao leave: Rời bàn\n.baicao bet [số tiền]: Đặt cược", threadID);
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

                        const hostName = getUserName(senderID);
                        this.gameRooms.set(threadID, {
                            host: senderID,
                            hostName: hostName,
                            players: [{id: senderID, name: hostName, cards: [], total: 0, ready: false}],
                            status: "waiting",
                            deck: null,
                            betAmount: 0
                        });

                        this.autoCloseTimers.set(threadID, setTimeout(() => {
                            if (this.gameRooms.has(threadID) && this.gameRooms.get(threadID).status === "waiting") {
                                api.sendMessage("⌛ Bàn đã tự động đóng do không có người chơi trong 60 giây!", threadID);
                                this.gameRooms.delete(threadID);
                                this.autoCloseTimers.delete(threadID);
                            }
                        }, 60000));

                        return api.sendMessage(`🎴 ${hostName} đã tạo bàn! Mọi người có thể tham gia.\n⏳ Bàn sẽ tự động đóng sau 60 giây nếu không bắt đầu!`, threadID);
                    } catch (err) {
                        console.error("Error creating room:", err);
                        return api.sendMessage("Có lỗi xảy ra khi tạo bàn!", threadID);
                    }

                case "join":
                    try {
                        if (!room) return api.sendMessage("Chưa có bàn nào được tạo!", threadID);
                        if (room.status !== "waiting") return api.sendMessage("Ván đang diễn ra!", threadID);
                        if (room.players.find(p => p.id === senderID)) return api.sendMessage("Bạn đã ở trong bàn!", threadID);
                        if (room.players.length >= 6) return api.sendMessage("Bàn đã đầy!", threadID);
                        
                        const playerName = getUserName(senderID);
                        room.players.push({id: senderID, name: playerName, cards: [], total: 0, ready: false});
                        const playerList = room.players.map(p => p.name).join(", ");
                        return api.sendMessage(`👤 ${playerName} đã tham gia!\nNgười chơi (${room.players.length}/6): ${playerList}`, threadID);
                    } catch (err) {
                        console.error("Error joining game:", err);
                        return api.sendMessage("Có lỗi xảy ra khi tham gia!", threadID);
                    }

                case "start":
                    try {
                        if (!room) return api.sendMessage("Chưa có bàn nào được tạo!", threadID);
                        if (room.host !== senderID) return api.sendMessage("Chỉ chủ bàn mới được bắt đầu!", threadID);
                        if (room.players.length < 2) return api.sendMessage("Cần ít nhất 2 người để chơi!", threadID);
                        if (room.status !== "waiting") return api.sendMessage("Ván đang diễn ra!", threadID);
                        
                        const betAmount = parseInt(target[1]);
                        if (!betAmount || betAmount < 10000) {
                            return api.sendMessage("Vui lòng nhập số tiền cược hợp lệ!\n.baicao start [số tiền]", threadID);
                        }

                        const insufficientPlayers = [];
                        for (let player of room.players) {
                            const balance = getBalance(player.id);
                            if (balance < betAmount) {
                                insufficientPlayers.push(player.id);
                            }
                        }

                        if (insufficientPlayers.length > 0) {
                            const insufficientNames = insufficientPlayers.map(id => getUserName(id));
                            return api.sendMessage(
                                `Những người chơi sau không đủ tiền cược ${formatNumber(betAmount)} Xu:\n${insufficientNames.join("\n")}`,
                                threadID
                            );
                        }

                        room.betAmount = betAmount;
                        room.status = "confirming";

                        for (let player of room.players) {
                            updateBalance(player.id, -betAmount);
                            player.ready = true;
                        }

                        await api.sendMessage(`🎴 Bắt đầu ván!\nTiền cược: ${formatNumber(betAmount)} Xu\nĐang chia bài...`, threadID);
                        this.startGame(api, threadID);
                    } catch (err) {
                        console.error("Error starting game:", err);
                        return api.sendMessage("Có lỗi xảy ra khi bắt đầu ván!", threadID);
                    }
                    break;

                case "leave":
                    if (!room) return api.sendMessage("Không có bàn nào!", threadID);
                    if (!room.players.find(p => p.id === senderID)) return api.sendMessage("Bạn không trong bàn!", threadID);
                    
                    if (room.status === "waiting") {
                        room.players = room.players.filter(p => p.id !== senderID);
                        if (room.players.length === 0) {
                            // Instead of deleting, reset the room
                            room.status = "waiting";
                            room.deck = null;
                            room.betAmount = 0;
                            return api.sendMessage("Bàn đã được làm mới!", threadID);
                        }
                        if (room.host === senderID) {
                            room.host = room.players[0].id;
                            room.hostName = getUserName(room.players[0].id);
                        }
                        return api.sendMessage(`👤 Còn ${room.players.length}/6 người`, threadID);
                    }
                    break;
            }
        } catch (err) {
            console.error("Main game error:", err);
            return api.sendMessage("Có lỗi xảy ra, vui lòng thử lại!", event.threadID);
        }
    },

    async startGame(api, threadID) {
        try {
            const room = this.gameRooms.get(threadID);
            if (!room) {
                console.error("Room not found when starting game");
                return;
            }

            room.status = "playing";
            room.deck = this.createDeck();

            for (let player of room.players) {
                try {
                    player.cards = room.deck.splice(0, 3);
                    player.total = this.calculateTotal(player.cards);
                    
                    const playerCards = player.cards.map(card => `${card.value}${card.suit}`).join(" ");
                    await api.sendMessage(
                        `🎴 Bài của bạn:\n${playerCards}\nTổng: ${player.total}`,
                        player.id
                    ).catch(err => {
                        console.error(`Failed to send cards to player ${player.name}:`, err);
                    });
                } catch (err) {
                    console.error(`Error processing player ${player.name}:`, err);
                }
            }

            await api.sendMessage("🎴 Chia bài xong! Đợi 5 giây để lật bài...", threadID)
                .catch(err => console.error("Error sending deal completion message:", err));

            setTimeout(async () => {
                try {
                    let resultMsg = `🎴 Kết quả (Cược: ${formatNumber(room.betAmount)} Xu):\n\n`;
                    
                    room.players.sort((a, b) => {
                        if (b.total !== a.total) return b.total - a.total;
                        return Math.max(...b.cards.map(c => this.getSuitValue(c.suit))) - 
                               Math.max(...a.cards.map(c => this.getSuitValue(c.suit)));
                    });

                    for (let i = 0; i < room.players.length; i++) {
                        const player = room.players[i];
                        const cards = player.cards.map(c => `${c.value}${c.suit}`).join(" ");
                        resultMsg += `${i+1}. ${player.name}\nBài: ${cards}\nTổng: ${player.total}\n\n`;
                    }

                    const winner = room.players[0];
                    const totalPot = room.betAmount * room.players.length;
                    const winnings = Math.floor(totalPot * 0.95); 

                    updateBalance(winner.id, winnings);
                    updateQuestProgress(winner.id, "win_games");

                    resultMsg += `\n🎉 Người thắng: ${winner.name}\n`;
                    resultMsg += `💰 Thắng: ${formatNumber(winnings)} Xu\n`;
                    resultMsg += `💸 Phí: 5%`;

                    await api.sendMessage(resultMsg, threadID);
                } catch (err) {
                    console.error("Error in game completion:", err);
                    await api.sendMessage("Có lỗi xảy ra khi kết thúc ván!", threadID)
                        .catch(console.error);
                } finally {
                    // Reset room instead of deleting
                    const room = this.gameRooms.get(threadID);
                    if (room) {
                        room.status = "waiting";
                        room.deck = null;
                        room.betAmount = 0;
                        room.players = [];
                        
                        // Set auto-close timer for reset room
                        this.autoCloseTimers.set(threadID, setTimeout(() => {
                            if (this.gameRooms.has(threadID) && this.gameRooms.get(threadID).status === "waiting") {
                                api.sendMessage("⌛ Bàn đã tự động đóng do không có người chơi trong 60 giây!", threadID);
                                this.gameRooms.delete(threadID);
                                this.autoCloseTimers.delete(threadID);
                            }
                        }, 60000));
                    }
                }
            }, 5000);

        } catch (err) {
            console.error("Fatal error in startGame:", err);
            await api.sendMessage("Có lỗi nghiêm trọng xảy ra!", threadID)
                .catch(console.error);
            this.gameRooms.delete(threadID);
        }
    },

    createDeck() {
        const suits = ["♠️", "♣️", "♦️", "♥️"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9"];
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

    calculateTotal(cards) {
        let total = cards.reduce((sum, card) => {
            if (card.value === "A") return sum + 1;
            return sum + parseInt(card.value);
        }, 0);
        return total % 10;
    },

    getSuitValue(suit) {
        return ["♠️", "♣️", "♦️", "♥️"].indexOf(suit);
    }
};
