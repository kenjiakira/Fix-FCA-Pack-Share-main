const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { Chess } = require('chess.js');
const { getUserName } = require('../utils/userUtils');

module.exports = {
    name: "chess",
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    hide: true,
    info: "Chơi cờ vua",
    usedby: 0,
    usages: "@tag người chơi để bắt đầu ván cờ",
    cooldowns: 0,

    activeGames: new Map(),

    piece_url_images: {
        'p': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Chess_pdt60.png',
        'r': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png',
        'n': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png',
        'b': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Chess_bdt60.png',
        'q': 'https://upload.wikimedia.org/wikipedia/commons/a/af/Chess_qdt60.png',
        'k': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Chess_kdt60.png',
        'P': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Chess_plt60.png',
        'R': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Chess_rlt60.png',
        'N': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Chess_nlt60.png',
        'B': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png',
        'Q': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png',
        'K': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png',
    },
    piece_images: {},
    cached_images: false,

    async loadPieceImages() {
        if (this.cached_images) return;
        
        try {
            const piece_letters = Object.keys(this.piece_url_images);
            const imagePromises = piece_letters.map(async letter => {
                try {
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    );
                    const imagePromise = loadImage(this.piece_url_images[letter]);
                    return await Promise.race([imagePromise, timeoutPromise]);
                } catch (err) {
                    console.error(`Failed to load piece ${letter}, retrying...`);
                    return await loadImage(this.piece_url_images[letter]);
                }
            });

            const images = await Promise.all(imagePromises);
            this.piece_images = images.reduce((obj, img, i) => ({ ...obj, [piece_letters[i]]: img }), {});
            this.cached_images = true;
        } catch (error) {
            console.error('Failed to load chess pieces:', error);
            throw new Error('Không thể tải hình ảnh quân cờ. Vui lòng thử lại sau.');
        }
    },

    async ensureCacheDir() {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    },

    async drawChessBoard(chess) {
        try {
            await this.ensureCacheDir();
            const canvas = createCanvas(500, 500);
            const ctx = canvas.getContext('2d');
            const _8 = [...Array(8)].map((_, i) => i);

            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            _8.forEach(i => _8.forEach(j => {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#999';
                ctx.fillRect((i * 50) + 50, (j * 50) + 50, 50, 50);
            }));

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, 50, 50 * 8, 50 * 8);

            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            _8.forEach(i => {
                ctx.fillText(8 - i, 25, (i * 50 + 25) + 50);
                ctx.fillText(String.fromCharCode(65 + i), (i * 50 + 25) + 50, (50 * 8 + 25) + 50);
            });

            chess.board().forEach((row, i) => row.forEach((piece, j) => {
                if (piece !== null) {
                    const image = this.piece_images[piece.color === 'b' ? piece.type : piece.type.toUpperCase()];
                    if (image) {
                        ctx.drawImage(image, (j * 50) + 50, (i * 50) + 50, 50, 50);
                    }
                }
            }));

            const imagePath = path.join(__dirname, 'cache', `chess_${Date.now()}_${Math.floor(Math.random()*1000)}.png`);
            
            return new Promise((resolve, reject) => {
                const out = fs.createWriteStream(imagePath);
                const stream = canvas.createPNGStream();
                
                stream.pipe(out);
                out.on('finish', () => resolve(imagePath));
                out.on('error', reject);
                
                setTimeout(() => {
                    stream.unpipe(out);
                    out.end();
                    reject(new Error('Timeout'));
                }, 10000);
            });

        } catch (error) {
            console.error('Error drawing chess board:', error);
            throw new Error('Không thể tạo bàn cờ. Vui lòng thử lại.');
        }
    },


    onLaunch: async function({ api, event }) {
        const { threadID, senderID, messageID } = event;

        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Nhóm này đang có ván cờ đang diễn ra. Vui lòng đợi ván hiện tại kết thúc!", threadID, messageID);
        }

        if (Object.keys(event.mentions).length !== 1) {
            return api.sendMessage("⚠️ Vui lòng tag một người để bắt đầu ván cờ!", threadID, messageID);
        }

        const opponent = Object.keys(event.mentions)[0];

        if (opponent === senderID) {
            return api.sendMessage("❌ Bạn không thể chơi với chính mình!", threadID, messageID);
        }

        if (this.isPlayerInGame(senderID) || this.isPlayerInGame(opponent)) {
            return api.sendMessage("⚠️ Một trong hai người chơi đang trong ván cờ khác!", threadID, messageID);
        }

        const gameState = {
            players: [senderID, opponent],
            currentTurn: senderID,
            moves: [],
            startTime: Date.now(),
            lastMoveTime: Date.now(), 
            checkInactivityInterval: null 
        };

        gameState.checkInactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - gameState.lastMoveTime;
            
            if (idleTime >= 5 * 60 * 1000) { 
                clearInterval(gameState.checkInactivityInterval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Ván cờ đã bị hủy do không có nước đi nào trong 5 phút!", threadID);
            }
        }, 30000);

        this.activeGames.set(threadID, gameState);

        const player1Name = getUserName(senderID);
        const player2Name = getUserName(opponent);

        await this.loadPieceImages();
        
        const chess = new Chess();
        gameState.chess = chess;
        
        const boardImage = await this.drawChessBoard(chess);
        await api.sendMessage({
            body: "🎮 Ván cờ bắt đầu!\n" +
                  `Người chơi 1 (Trắng): ${player1Name}\n` +
                  `Người chơi 2 (Đen): ${player2Name}\n\n` +
                  "Reply tin nhắn này với nước đi của bạn (VD: e2e4)!",
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) return console.error(err);
            fs.unlinkSync(boardImage);
            
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                opponent: opponent,
                threadID: threadID
            });
        });
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const game = this.activeGames.get(threadID);

        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván cờ!", threadID, messageID);
        }

        if (!game.players.includes(senderID)) {
            return api.sendMessage("❌ Bạn không phải người chơi trong ván này!", threadID, messageID);
        }

        if (senderID !== game.currentTurn) {
            return api.sendMessage("❌ Chưa đến lượt của bạn!", threadID, messageID);
        }

        const move = event.body.trim().toLowerCase();
        try {
            if (!move.match(/^[a-h][1-8][a-h][1-8]$/)) {
                return api.sendMessage("❌ Nước đi không đúng định dạng! Ví dụ đúng: e2e4", threadID, messageID);
            }

            const moveResult = game.chess.move({
                from: move.substring(0, 2),
                to: move.substring(2, 4)
            });

            if (!moveResult) {
                return api.sendMessage("❌ Nước đi không hợp lệ! Vui lòng kiểm tra lại.", threadID, messageID);
            }

            game.moves.push(move);
            game.currentTurn = game.players.find(p => p !== senderID);
            const nextPlayerName = getUserName(game.currentTurn);

            game.lastMoveTime = Date.now();

            if (Date.now() - game.startTime > 30 * 60 * 1000) {
                this.activeGames.delete(threadID);
                return api.sendMessage("⌛ Ván cờ đã hết thời gian (30 phút). Trò chơi kết thúc!", threadID);
            }

            const boardImage = await this.drawChessBoard(game.chess);
            
            let status = "";
            if (game.chess.isCheckmate()) {
                status = `⚡ Chiếu hết! ${getUserName(senderID)} thắng!`;
                this.activeGames.delete(threadID);
            }
            else if (game.chess.isDraw()) {
                status = "🤝 Hòa!";
                this.activeGames.delete(threadID);
            }
            else if (game.chess.isCheck()) status = "⚠️ Chiếu!";

            await api.sendMessage({
                body: `Nước đi: ${move}\n${status}${!game.chess.isGameOver() ? `\nĐến lượt: ${nextPlayerName}` : ''}`,
                attachment: fs.createReadStream(boardImage)
            }, threadID, (err, msg) => {
                if (err) {
                    console.error(err);
                    return api.sendMessage("❌ Có lỗi khi gửi bàn cờ!", threadID);
                }
                
                try {
                    fs.unlinkSync(boardImage);
                } catch (e) {
                    console.error("Error deleting board image:", e);
                }

                if (!game.chess.isGameOver()) {
                    global.client.onReply.push({
                        name: this.name,
                        messageID: msg.messageID,
                        author: game.currentTurn,
                        opponent: senderID,
                        threadID: threadID
                    });
                } else {
                    clearInterval(game.checkInactivityInterval);
                    this.activeGames.delete(threadID);
                }
            });
        } catch (err) {
            console.error("Chess error:", err);
            if (err.message.includes("Invalid move")) {
                return api.sendMessage("❌ Nước đi không hợp lệ! Vui lòng kiểm tra lại.", threadID, messageID);
            }
            if (game.checkInactivityInterval) {
                clearInterval(game.checkInactivityInterval);
            }
            this.activeGames.delete(threadID);
            return api.sendMessage("❌ Có lỗi xảy ra! Ván cờ đã bị hủy.", threadID, messageID);
        }
    },

    isPlayerInGame: function(playerID) {
        for (const [threadID, game] of this.activeGames) {
            if (game.players.includes(playerID)) {
                return true;
            }
        }
        return false;
    },

    onLoad: function() {
        for (const [threadID, game] of this.activeGames) {
            if (game.checkInactivityInterval) {
                clearInterval(game.checkInactivityInterval);
            }
        }
        this.activeGames.clear();
    }
};
