const { createBaicaoCanvas, createPlayerCardCanvas, createGameStateCanvas } = require('../game/canvas/baicaoCanvas');
const { getBalance, updateBalance } = require('../utils/currencies');
const path = require('path');
const fs = require('fs');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function getUserNameFromData(userId) {
    try {
        if (!global.userData) {
            const userDataPath = path.join(__dirname, '../events/cache/userData.json');
            if (fs.existsSync(userDataPath)) {
                global.userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            } else {
                global.userData = {};
            }
        }
        
        if (global.userData[userId] && global.userData[userId].name) {
            return global.userData[userId].name;
        }
        
        return getname(userId) || "Facebook User";
    } catch (error) {
        console.error('Error getting user name from userData:', error);
        return getname(userId) || "Facebook User";
    }
}
const games = {};

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
        this.aiPlayers = 0;
        this.aiDecisionTime = 0;
        this.aiDifficulty = "normal";
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
    addAIPlayer(difficulty = "normal") {
        const aiNumber = ++this.aiPlayers;
        const aiID = `ai_${Date.now()}_${aiNumber}`;

        let personality;
        switch (difficulty) {
            case "easy":
                personality = {
                    changeThreshold: 5,
                    decisionDelay: 3000,
                    name: `🤖 AI Dễ #${aiNumber}`
                };
                break;
            case "hard":
                personality = {
                    changeThreshold: 7,
                    decisionDelay: 1000,
                    name: `🤖 AI Khó #${aiNumber}`
                };
                break;
            default:
                personality = {
                    changeThreshold: 6,
                    decisionDelay: 2000,
                    name: `🤖 AI #${aiNumber}`
                };
        }
        this.players.set(aiID, {
            name: personality.name,
            ready: false,
            cards: [],
            isAI: true,
            personality: personality,
            hasChanged: false
        });

        this.currentPlayers++;
        return aiID;
    }

    makeAIPlayersReady(api) {
        const pendingAIs = Array.from(this.players.entries())
            .filter(([_, player]) => player.isAI && !player.ready)
            .map(([id, player]) => player);
        
        if (pendingAIs.length === 0) return;
        
        setTimeout(() => {
            if (this.state !== "playing") return;
            
            let readyAINames = [];
            let allReady = true;
            
            for (const player of pendingAIs) {
                player.ready = true;
                readyAINames.push(player.name);
            }
            
            for (let [_, player] of this.players) {
                if (!player.ready) {
                    allReady = false;
                    break;
                }
            }
            
            if (readyAINames.length > 0) {
                api.sendMessage(
                    `🤖 ${readyAINames.length > 1 ? "TẤT CẢ AI" : readyAINames[0]} đã sẵn sàng theo!`,
                    this.threadID
                );
            }
            
            if (allReady) {
                this.endGame(api);
            }
        }, 1000); 
    }

    handleAIDecisions(api) {
        if (this.state !== "playing") return;
    
        const aiPlayers = Array.from(this.players.entries())
            .filter(([_, player]) => player.isAI)
            .map(([id, player]) => ({ id, player }));
        
        if (aiPlayers.length === 0) return;
        
        setTimeout(async () => {
            let aiActionsMsg = [];
            let changeDelay = 0;
            
            for (const { id, player } of aiPlayers) {
                const shouldChange = player.point <= player.personality.changeThreshold && !player.hasChanged;
                
                if (shouldChange) {
                    setTimeout(() => {
                        if (this.state !== "playing") return;
                        
                        player.cards = this.deck.splice(0, 3);
                        player.point = this.calculatePoints(player.cards);
                        player.hasChanged = true;
                        
                        api.sendMessage(`${player.name} đã đổi bài!`, this.threadID);
                    }, changeDelay);
                    
                    changeDelay += 500;
                }
            }
            
            setTimeout(() => {
                if (this.state !== "playing") return;
                
                const maxDecisionDelay = Math.max(...aiPlayers.map(({ player }) => 
                    player.personality.decisionDelay / 2 || 1000));
                    
                setTimeout(() => {
                    if (this.state !== "playing") return;
                    
                    let readyAINames = [];
                    let allReady = true;
                    
                    for (const { player } of aiPlayers) {
                        player.ready = true;
                        readyAINames.push(player.name);
                    }
                    
                    for (let [_, player] of this.players) {
                        if (!player.ready) {
                            allReady = false;
                            break;
                        }
                    }
                    
                    if (readyAINames.length > 0) {
                        api.sendMessage(
                            `🤖 ${readyAINames.length > 1 ? "TẤT CẢ AI" : readyAINames[0]} đã sẵn sàng!`,
                            this.threadID
                        );
                    }
                    
                    if (allReady) {
                        this.endGame(api);
                    }
                }, maxDecisionDelay);
                
            }, changeDelay + 500);
    
        }, 1500); 
    }
    async start(api) {
        this.state = "playing";
        this.initializeDeck();
        this.shuffleDeck();
        this.dealCards();
        
        try {
            const gameStateCanvas = await createGameStateCanvas(this);
            
            const tempFilePath = path.join(__dirname, `../temp/gamestate_${this.threadID}_${Date.now()}.png`);
            
            if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
            }
            
            fs.writeFileSync(tempFilePath, gameStateCanvas);
            
            await api.sendMessage(
                {
                    body: "🎲 CHIA BÀI THÀNH CÔNG 🎲\n\n" +
                          "👉 Sử dụng:\n" +
                          "• .baicao xem => Xem bài của bạn\n" +
                          "• .baicao đổi => Đổi bài (1 lần)\n" +
                          "• .baicao ready => Sẵn sàng\n\n" +
                          "⏳ Thời gian: 60 giây",
                    attachment: fs.createReadStream(tempFilePath)
                },
                this.threadID,
                () => {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (e) {
                        console.error("Error removing temp file:", e);
                    }
                }
            );
        } catch (err) {
            console.error("Error generating game state canvas:", err);
            
            let message = "🎲 CHIA BÀI THÀNH CÔNG 🎲\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";
            message += "👉 Sử dụng:\n";
            message += "• .baicao xem => Xem bài của bạn\n";
            message += "• .baicao đổi => Đổi bài (1 lần)\n";
            message += "• .baicao ready => Sẵn sàng\n\n";
            message += "⏳ Thời gian: 60 giây";
            
            await api.sendMessage(message, this.threadID);
        }
    
        this.handleAIDecisions(api);
    
        this.timeoutID = setTimeout(() => {
            if (this.state === "playing") {
                this.endGame(api);
            }
        }, 90000);
    }

    async endGame(api) {
        clearTimeout(this.timeoutID);
        this.state = "ended";
    
        let results = [];
        for (let [playerID, player] of this.players) {
            results.push({
                playerID,
                name: player.name,
                cards: this.getPlayerCards(playerID),
                point: player.point,
                isAI: player.isAI || false
            });
        }
    
        results.sort((a, b) => b.point - a.point);
    
        const winner = results[0];
        const totalPool = this.betAmount * this.players.size;
        const winAmount = Math.floor(totalPool * 0.95); 
        if (!winner.isAI) {
            await updateBalance(winner.playerID, winAmount);
        }
        
        try {
            const resultsCanvas = await createBaicaoCanvas(this, results);
            
            const tempFilePath = path.join(__dirname, `../temp/results_${this.threadID}_${Date.now()}.png`);
            
            if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
            }
            
            fs.writeFileSync(tempFilePath, resultsCanvas);
            
            await api.sendMessage(
                {
                    body: "🎮 KẾT QUẢ BÀI CÀO 🎮\n\n" +
                          "• .baicao next - Chơi tiếp\n" +
                          "• .baicao leave - Rời bàn",
                    attachment: fs.createReadStream(tempFilePath)
                },
                this.threadID, 
                () => {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (e) {
                        console.error("Error removing temp file:", e);
                    }
                }
            );
        } catch (err) {
            console.error("Error generating results canvas:", err);
            
            let message = "🎮 KẾT QUẢ BÀI CÀO 🎮\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";
    
            results.forEach((result, index) => {
                message += `${index + 1}. ${result.name}${result.isAI ? ' 🤖' : ''}\n`;
                message += `├─ Bài: ${result.cards}\n`;
                message += `└─ Điểm: ${result.point}\n`;
            });
    
            message += "\n💰 THƯỞNG:\n";
            message += `✨ Người thắng: ${winner.name}${winner.isAI ? ' 🤖' : ''}\n`;
            message += `💵 Tiền thắng: ${formatNumber(winAmount)}$\n`;
            message += `💰 Tổng cược: ${formatNumber(totalPool)}$\n`;
            message += `📌 Phí: ${formatNumber(totalPool - winAmount)}$`;
    
            message += "\n\n📋 LƯỢT CHƠI MỚI:\n";
            message += "• .baicao next - Chơi tiếp\n";
            message += "• .baicao leave - Rời bàn";
    
            await api.sendMessage(message, this.threadID);
        }
    
        this.state = "waiting_next";
        this.roundCount++;
    
        for (let [playerID, player] of this.players) {
            player.cards = [];
            player.point = 0;
            player.ready = false;
            player.hasChanged = false;
        }
    }

    async startNewRound(api) {
        this.state = "playing";
        this.initializeDeck();
        this.shuffleDeck();
        this.dealCards();
        
        try {
            const gameStateCanvas = await createGameStateCanvas(this);
            
            const tempFilePath = path.join(__dirname, `../temp/gamestate_${this.threadID}_${Date.now()}.png`);
            
            if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
            }
            
            fs.writeFileSync(tempFilePath, gameStateCanvas);
            
            await api.sendMessage(
                {
                    body: `🎲 VÒNG MỚI BẮT ĐẦU 🎲\n\n` +
                          `📌 Vòng: ${this.roundCount}\n` +
                          `👥 Người chơi: ${this.players.size}\n` +
                          `🤖 AI: ${this.aiPlayers}\n` +
                          `💰 Cược: ${formatNumber(this.betAmount)}$\n\n` +
                          "👉 Sử dụng:\n" +
                          "• .baicao xem => Xem bài của bạn\n" +
                          "• .baicao đổi => Đổi bài (1 lần)\n" +
                          "• .baicao ready => Sẵn sàng\n\n" +
                          "⏳ Thời gian: 60 giây",
                    attachment: fs.createReadStream(tempFilePath)
                },
                this.threadID,
                () => {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (e) {
                        console.error("Error removing temp file:", e);
                    }
                }
            );
        } catch (err) {
            console.error("Error generating game state canvas:", err);
            
            let message = "🎲 VÒNG MỚI BẮT ĐẦU 🎲\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";
            message += `📌 Vòng: ${this.roundCount}\n`;
            message += `👥 Người chơi: ${this.players.size}\n`;
            message += `🤖 AI: ${this.aiPlayers}\n`;
            message += `💰 Cược: ${formatNumber(this.betAmount)}$\n\n`;
            message += "👉 Sử dụng:\n";
            message += "• .baicao xem => Xem bài của bạn\n";
            message += "• .baicao đổi => Đổi bài (1 lần)\n";
            message += "• .baicao ready => Sẵn sàng\n\n";
            message += "⏳ Thời gian: 60 giây";
            
            await api.sendMessage(message, this.threadID);
        }
    
        this.handleAIDecisions(api);
    
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

    onLaunch: async function ({ api, event, target }) {
        const { threadID, senderID, messageID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🎮 BÀI CÀO 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "👉 Hướng dẫn:\n" +
                "• .baicao create [số tiền] - Tạo bàn\n" +
                "• .baicao join - Tham gia\n" +
                "• .baicao ai [easy/normal/hard] [số lượng] - Thêm người chơi AI\n" +
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

                games[threadID] = new BaiCaoGame(threadID);
                const newGame = games[threadID];
                newGame.betAmount = betAmount;
            
                const name = getUserNameFromData(senderID);
                newGame.players.set(senderID, {
                    name: name,
                    ready: false,
                    cards: []
                });
                newGame.currentPlayers = 1;

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
            case "bot":
            case "ai": {
                if (!game) {
                    return api.sendMessage("❌ Chưa có bàn nào được tạo!", threadID, messageID);
                }

                if (game.state !== "waiting") {
                    return api.sendMessage("❌ Không thể thêm AI khi trò chơi đã bắt đầu!", threadID, messageID);
                }

                if (!game.players.has(senderID)) {
                    return api.sendMessage("❌ Chỉ chủ phòng mới có thể thêm AI!", threadID, messageID);
                }

                if (game.currentPlayers >= game.maxPlayers) {
                    return api.sendMessage("❌ Bàn đã đủ người chơi!", threadID, messageID);
                }

                let difficulty = target[1] ? target[1].toLowerCase() : "normal";
                if (!["easy", "normal", "hard"].includes(difficulty)) {
                    difficulty = "normal";
                }

                let count = parseInt(target[2]) || 1;
                count = Math.min(count, game.maxPlayers - game.currentPlayers);

                for (let i = 0; i < count; i++) {
                    if (game.currentPlayers >= game.maxPlayers) break;
                    game.addAIPlayer(difficulty);
                }

                return api.sendMessage(
                    `✅ Đã thêm ${count} AI ${difficulty}!\n` +
                    `👥 Số người chơi: ${game.currentPlayers}/${game.maxPlayers}`,
                    threadID, messageID
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

                const name = getUserNameFromData(senderID);
                game.players.set(senderID, {
                    name: name,
                    ready: false,
                    cards: []
                });
                game.currentPlayers++;

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
                
                const canvasCardData = {
                    name: player.name,
                    point: player.point,
                    cards: player.cards
                };
                
                try {
                    const cardCanvas = await createPlayerCardCanvas(canvasCardData);
                    
                    const tempFilePath = path.join(__dirname, `../temp/cards_${senderID}_${Date.now()}.png`);
                    
                    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                        fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
                    }
                    
                    fs.writeFileSync(tempFilePath, cardCanvas);
                    
                    return api.sendMessage(
                        {
                            body: `🃏 BÀI CỦA BẠN 🃏\n${player.hasChanged ? '(Đã đổi bài)' : ''}`,
                            attachment: fs.createReadStream(tempFilePath)
                        },
                        threadID, 
                        () => {
                            try {
                                fs.unlinkSync(tempFilePath);
                            } catch (e) {
                                console.error("Error removing temp file:", e);
                            }
                        },
                        messageID
                    );
                } catch (err) {
                    console.error("Error generating card canvas:", err);
                    
                    return api.sendMessage(
                        "🃏 BÀI CỦA BẠN 🃏\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `Bài: ${game.getPlayerCards(senderID)}\n` +
                        `Điểm: ${player.point}`,
                        threadID, messageID
                    );
                }
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
                
                    player.cards = game.deck.splice(0, 3);
                    player.point = game.calculatePoints(player.cards);
                    player.hasChanged = true;
                
                    const canvasCardData = {
                        name: player.name,
                        point: player.point,
                        cards: player.cards
                    };
                    
                    try {
                        const cardCanvas = await createPlayerCardCanvas(canvasCardData);
                        
                        const tempFilePath = path.join(__dirname, `../temp/newcards_${senderID}_${Date.now()}.png`);
                        
                        if (!fs.existsSync(path.join(__dirname, '../temp'))) {
                            fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
                        }
                        
                        fs.writeFileSync(tempFilePath, cardCanvas);
                        
                        return api.sendMessage(
                            {
                                body: "🔄 ĐỔI BÀI THÀNH CÔNG 🔄",
                                attachment: fs.createReadStream(tempFilePath)
                            },
                            threadID, 
                            () => {
                                try {
                                    fs.unlinkSync(tempFilePath);
                                } catch (e) {
                                    console.error("Error removing temp file:", e);
                                }
                            },
                            messageID
                        );
                    } catch (err) {
                        console.error("Error generating card canvas:", err);
                        
                        return api.sendMessage(
                            "🔄 ĐỔI BÀI THÀNH CÔNG 🔄\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            `Bài mới: ${game.getPlayerCards(senderID)}\n` +
                            `Điểm: ${player.point}`,
                            threadID, messageID
                        );
                    }
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
                
                    game.makeAIPlayersReady(api);
                
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
                
                    await updateBalance(senderID, -game.betAmount);
                    game.players.get(senderID).ready = true;
                    
                    setTimeout(() => {
                        let aiCount = 0;
                        for (let [playerID, player] of game.players) {
                            if (player.isAI && !player.ready) {
                                player.ready = true;
                                aiCount++;
                            }
                        }
                        
                        if (aiCount > 0) {
                            api.sendMessage(
                                `🤖 ${aiCount > 1 ? "Tất cả AI" : "AI"} đã sẵn sàng cho vòng mới!`,
                                threadID
                            );
                        }
                        
                        let allPlayersReady = true;
                        for (let [_, player] of game.players) {
                            if (!player.ready) {
                                allPlayersReady = false;
                                break;
                            }
                        }
                        
                        if (allPlayersReady) {
                            game.startNewRound(api);
                        }
                    }, 1000);
                
                    return api.sendMessage(
                        `✅ ${game.players.get(senderID).name} đã sẵn sàng cho vòng mới!\n` +
                        "⏳ Đợi các người chơi khác...",
                        threadID
                    );
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
