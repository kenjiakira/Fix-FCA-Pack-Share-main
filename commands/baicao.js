const { getBalance, updateBalance } = require('../utils/currencies');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const gamePath = __dirname + '/cache/baicao.json';

// Game states
const games = {};

// Card values
const suits = ['♠️', '♣️', '♥️', '♦️'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

class BaiCaoGame {
    constructor(threadID) {
        this.threadID = threadID;
        this.players = new Map();
        this.deck = [];
        this.state = "waiting";
        this.betAmount = 0;
        this.currentPlayers = 0;
        this.maxPlayers = 8;
        this.timeoutID = null;
        this.roundCount = 0;
    }

    initializeDeck() {
        this.deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.deck.push({ suit, rank });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        for (let [playerID, player] of this.players) {
            player.cards = this.deck.splice(0, 3);
            player.point = this.calculatePoints(player.cards);
        }
    }

    calculatePoints(cards) {
        let values = cards.map(card => {
            if (['J', 'Q', 'K'].includes(card.rank)) return 10;
            if (card.rank === 'A') return 1;
            return parseInt(card.rank);
        });
        return values.reduce((a, b) => a + b, 0) % 10;
    }

    getPlayerCards(playerID) {
        const player = this.players.get(playerID);
        if (!player || !player.cards) return "Chưa có bài";
        return player.cards.map(card => `${card.rank}${card.suit}`).join(" ");
    }

    async start(api) {
        this.state = "playing";
        this.initializeDeck();
        this.shuffleDeck();
        this.dealCards();

        let message = "🎲 CHIA BÀI THÀNH CÔNG 🎲\n━━━━━━━━━━━━━━━━━━\n\n";
        message += "👉 Sử dụng:\n";
        message += "• .baicao xem => Xem bài của bạn\n";
        message += "• .baicao đổi => Đổi bài (1 lần)\n";
        message += "• .baicao ready => Sẵn sàng\n\n";
        message += "⏳ Thời gian: 60 giây";

        api.sendMessage(message, this.threadID);

        // Auto end game after 90 seconds
        this.timeoutID = setTimeout(() => {
            if (this.state === "playing") {
                this.endGame(api);
            }
        }, 90000);
    }

    async endGame(api) {
        clearTimeout(this.timeoutID);
        this.state = "ended";

        // Calculate results
        let results = [];
        for (let [playerID, player] of this.players) {
            results.push({
                playerID,
                name: player.name,
                cards: this.getPlayerCards(playerID),
                point: player.point
            });
        }

        // Sort by points
        results.sort((a, b) => b.point - a.point);

        // Calculate winnings and losses
        const winner = results[0];
        const totalPool = this.betAmount * this.players.size;
        const winAmount = Math.floor(totalPool * 0.95); // 5% house fee
        
        // Update balances
        for (let [playerID, player] of this.players) {
            if (playerID === winner.playerID) {
                await updateBalance(playerID, winAmount);
            }
        }

        // Create result message
        let message = "🎮 KẾT QUẢ BÀI CÀO 🎮\n";
        message += "━━━━━━━━━━━━━━━━━━\n\n";
        
        results.forEach((result, index) => {
            message += `${index + 1}. ${result.name}\n`;
            message += `├─ Bài: ${result.cards}\n`;
            message += `└─ Điểm: ${result.point}\n`;
        });

        message += "\n💰 THƯỞNG:\n";
        message += `✨ Người thắng: ${winner.name}\n`;
        message += `💵 Tiền thắng: ${formatNumber(winAmount)}$\n`;
        message += `💰 Tổng cược: ${formatNumber(totalPool)}$\n`;
        message += `📌 Phí: ${formatNumber(totalPool - winAmount)}$`;

        message += "\n\n📋 LƯỢT CHƠI MỚI:\n";
        message += "• .baicao next - Chơi tiếp\n";
        message += "• .baicao leave - Rời bàn";

        api.sendMessage(message, this.threadID);

        // Instead of deleting game, set state to "waiting_next"
        this.state = "waiting_next";
        this.roundCount++;

        // Clear temporary round data but keep player list
        for (let [playerID, player] of this.players) {
            player.cards = [];
            player.point = 0;
            player.ready = false;
            player.hasChanged = false;
        }
    }

    async startNewRound(api) {
        // Reset game state for new round
        this.state = "playing";
        this.initializeDeck();
        this.shuffleDeck();
        this.dealCards();

        let message = "🎲 VÒNG MỚI BẮT ĐẦU 🎲\n";
        message += "━━━━━━━━━━━━━━━━━━\n\n";
        message += `📌 Vòng: ${this.roundCount}\n`;
        message += `👥 Người chơi: ${this.players.size}\n`;
        message += `💰 Cược: ${formatNumber(this.betAmount)}$\n\n`;
        message += "👉 Sử dụng:\n";
        message += "• .baicao xem => Xem bài của bạn\n";
        message += "• .baicao đổi => Đổi bài (1 lần)\n";
        message += "• .baicao ready => Sẵn sàng\n\n";
        message += "⏳ Thời gian: 60 giây";

        api.sendMessage(message, this.threadID);

        this.timeoutID = setTimeout(() => {
            if (this.state === "playing") {
                this.endGame(api);
            }
        }, 90000);
    }

    async removePlayer(playerID) {
        if (this.players.has(playerID)) {
            this.players.delete(playerID);
            this.currentPlayers--;
            return true;
        }
        return false;
    }
}

module.exports = {
    name: "baicao",
    dev: "HNT",
    onPrefix: true,
    category: "Games",
    info: "Chơi Bài Cào",
    usages: "baicao [create/join/start/xem/đổi/ready]",
    cooldowns: 0,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎮 BÀI CÀO 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "👉 Hướng dẫn:\n" +
                "• .baicao create [số tiền] - Tạo bàn\n" +
                "• .baicao join - Tham gia\n" +
                "• .baicao start - Bắt đầu\n" +
                "• .baicao xem - Xem bài\n" +
                "• .baicao đổi - Đổi bài\n" +
                "• .baicao ready - Sẵn sàng\n\n" +
                "💰 Cược: 1,000$ đến 50,000,000$\n" +
                "👥 Số người: 2-8 người/bàn",
                threadID, messageID
            );
        }

        const command = target[0].toLowerCase();
        const game = games[threadID];

        switch (command) {
            case "create": {
                if (game) {
                    return api.sendMessage("❌ Đã có bàn được tạo trong nhóm này!", threadID, messageID);
                }

                const betAmount = parseInt(target[1]);
                if (isNaN(betAmount) || betAmount < 1000 || betAmount > 50000000) {
                    return api.sendMessage(
                        "❌ Số tiền cược không hợp lệ!\n💰 Cược từ 1,000$ đến 50,000,000$",
                        threadID, messageID
                    );
                }

                const userBalance = getBalance(senderID);
                if (userBalance < betAmount) {
                    return api.sendMessage(
                        "❌ Bạn không đủ tiền để đặt cược!\n" +
                        `💰 Số dư: ${formatNumber(userBalance)}$`,
                        threadID, messageID
                    );
                }

                // Create new game
                games[threadID] = new BaiCaoGame(threadID);
                const newGame = games[threadID];
                newGame.betAmount = betAmount;

                // Add creator as first player
                const name = await getUserName(api, senderID);
                newGame.players.set(senderID, {
                    name: name,
                    ready: false,
                    cards: []
                });
                newGame.currentPlayers = 1;

                // Deduct bet amount
                await updateBalance(senderID, -betAmount);

                return api.sendMessage(
                    "🎮 TẠO BÀN THÀNH CÔNG 🎮\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `💰 Cược: ${formatNumber(betAmount)}$\n` +
                    `👥 Người tạo: ${name}\n` +
                    "👉 Số người tham gia: 1/8\n\n" +
                    "• .baicao join - Tham gia\n" +
                    "• .baicao start - Bắt đầu game",
                    threadID
                );
            }

            case "join": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "waiting") {
                    return api.sendMessage("❌ Bàn chơi đã bắt đầu!", threadID, messageID);
                }

                if (game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn đã tham gia bàn này!", threadID, messageID);
                }

                if (game.currentPlayers >= game.maxPlayers) {
                    return api.sendMessage("❌ Bàn đã đủ người chơi!", threadID, messageID);
                }

                const userBalance = getBalance(senderID);
                if (userBalance < game.betAmount) {
                    return api.sendMessage(
                        "❌ Bạn không đủ tiền để tham gia!\n" +
                        `💰 Cần: ${formatNumber(game.betAmount)}$\n` +
                        `💵 Số dư: ${formatNumber(userBalance)}$`,
                        threadID, messageID
                    );
                }

                // Add player
                const name = await getUserName(api, senderID);
                game.players.set(senderID, {
                    name: name,
                    ready: false,
                    cards: []
                });
                game.currentPlayers++;

                // Deduct bet amount
                await updateBalance(senderID, -game.betAmount);

                return api.sendMessage(
                    `✅ ${name} đã tham gia!\n` +
                    `👥 Số người chơi: ${game.currentPlayers}/8\n` +
                    `💰 Cược: ${formatNumber(game.betAmount)}$`,
                    threadID
                );
            }

            case "start": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "waiting") {
                    return api.sendMessage("❌ Bàn chơi đã bắt đầu!", threadID, messageID);
                }

                if (game.currentPlayers < 2) {
                    return api.sendMessage("❌ Cần ít nhất 2 người để bắt đầu!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                await game.start(api);
                break;
            }

            case "xem": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "playing") {
                    return api.sendMessage("❌ Bàn chơi chưa bắt đầu!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                const player = game.players.get(senderID);
                return api.sendMessage(
                    "🃏 BÀI CỦA BẠN 🃏\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `Bài: ${game.getPlayerCards(senderID)}\n` +
                    `Điểm: ${player.point}`,
                    threadID, messageID
                );
            }

            case "đổi":
            case "doi": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "playing") {
                    return api.sendMessage("❌ Bàn chơi chưa bắt đầu!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                const player = game.players.get(senderID);
                if (player.hasChanged) {
                    return api.sendMessage("❌ Bạn đã đổi bài rồi!", threadID, messageID);
                }

                // Draw new cards
                player.cards = game.deck.splice(0, 3);
                player.point = game.calculatePoints(player.cards);
                player.hasChanged = true;

                return api.sendMessage(
                    "🔄 ĐỔI BÀI THÀNH CÔNG 🔄\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `Bài mới: ${game.getPlayerCards(senderID)}\n` +
                    `Điểm: ${player.point}`,
                    threadID, messageID
                );
            }

            case "ready": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "playing") {
                    return api.sendMessage("❌ Bàn chơi chưa bắt đầu!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                const player = game.players.get(senderID);
                if (player.ready) {
                    return api.sendMessage("❌ Bạn đã sẵn sàng rồi!", threadID, messageID);
                }

                player.ready = true;
                
                // Check if all players are ready
                let allReady = true;
                for (let [_, player] of game.players) {
                    if (!player.ready) {
                        allReady = false;
                        break;
                    }
                }

                if (allReady) {
                    return game.endGame(api);
                }

                return api.sendMessage(
                    `✅ ${player.name} đã sẵn sàng!\n` +
                    "⏳ Đợi các người chơi khác...",
                    threadID
                );
            }

            case "next": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "waiting_next") {
                    return api.sendMessage("❌ Không thể bắt đầu vòng mới lúc này!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                // Deduct bet amount for next round
                const userBalance = getBalance(senderID);
                if (userBalance < game.betAmount) {
                    game.removePlayer(senderID);
                    return api.sendMessage(
                        "❌ Bạn không đủ tiền để tiếp tục!\n" +
                        `💰 Cần: ${formatNumber(game.betAmount)}$\n` +
                        `💵 Số dư: ${formatNumber(userBalance)}$`,
                        threadID, messageID
                    );
                }

                // Deduct bet amount
                await updateBalance(senderID, -game.betAmount);

                // Check if this is the last player to be ready
                let allPlayersReady = true;
                for (let [playerID, player] of game.players) {
                    if (!player.ready && playerID !== senderID) {
                        allPlayersReady = false;
                        break;
                    }
                }

                game.players.get(senderID).ready = true;

                if (allPlayersReady) {
                    // Start new round if all players are ready
                    await game.startNewRound(api);
                } else {
                    api.sendMessage(
                        `✅ ${game.players.get(senderID).name} đã sẵn sàng cho vòng mới!\n` +
                        "⏳ Đợi các người chơi khác...",
                        threadID
                    );
                }
                break;
            }

            case "leave": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Bạn không tham gia bàn này!", threadID, messageID);
                }

                if (game.state !== "waiting_next") {
                    return api.sendMessage("❌ Chỉ có thể rời bàn sau khi kết thúc vòng!", threadID, messageID);
                }

                const playerName = game.players.get(senderID).name;
                game.removePlayer(senderID);

                if (game.players.size < 2) {
                    // End game if not enough players
                    api.sendMessage(
                        "🔚 BÀN CHƠI KẾT THÚC\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "❌ Không đủ người chơi tối thiểu!",
                        threadID
                    );
                    delete games[threadID];
                } else {
                    api.sendMessage(
                        `👋 ${playerName} đã rời bàn!\n` +
                        `👥 Còn lại: ${game.players.size} người chơi`,
                        threadID
                    );
                }
                break;
            }

            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!", threadID, messageID);
        }
    }
};

async function getUserName(api, userID) {
    try {
        const userInfo = await api.getUserInfo(userID);
        return userInfo[userID].name || "Người chơi";
    } catch {
        return "Người chơi";
    }
}
