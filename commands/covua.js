const { createCanvas, loadImage } = require('canvas');
const { Chess } = require('chess.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "covua", 
    dev: "HNT",
    info: "Chơi cờ vua với người khác",
    usedby: 0,
    cooldowns: 5, 
    dmUser: false,
    onPrefix: true,
    nickName: ["chess"],
    usages: "@tag để thách đấu",

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

    getPlayerName(id, playerNumber) {
        try {
            return global.data?.userName?.get(id) || `Player ${playerNumber}`;
        } catch {
            return `Player ${playerNumber}`;
        }
    },

    games: new Map(),

    onLaunch: async function({ event, api }) {
        const { threadID, messageID, senderID } = event;

        try {
            await this.ensureCacheDir();
            
            let loadingMsg;
            if (!this.cached_images) {
                loadingMsg = await api.sendMessage(
                    "Đang tải hình ảnh quân cờ, vui lòng đợi...", 
                    threadID
                );
                await this.loadPieceImages();
            }
            
            if (Object.keys(event.mentions).length === 1) {
                const opponent = Object.keys(event.mentions)[0];
                const chess = new Chess();
                
                const imagePath = await this.drawChessBoard(chess);
                
                if (!fs.existsSync(imagePath)) {
                    throw new Error('Image file not created');
                }

                if (loadingMsg) {
                    await api.unsendMessage(loadingMsg.messageID);
                }

                const msg = await api.sendMessage({
                    body: `Ván cờ bắt đầu!\nTrắng (${this.getPlayerName(senderID, 1)})\nĐen (${this.getPlayerName(opponent, 2)})\nLượt đi của Trắng\n\nHướng dẫn: Reply tin nhắn này với nước đi (VD: e2e4 hoặc e4)`,
                    attachment: fs.createReadStream(imagePath)
                }, threadID);

                try {
                    fs.unlinkSync(imagePath);
                } catch {}

                this.games.set(threadID, {
                    chess: chess,
                    author: senderID,
                    competitor_id: opponent,
                    lastMessageID: msg.messageID
                });

                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
                    competitor_id: opponent
                });
            } else {
                if (loadingMsg) {
                    await api.unsendMessage(loadingMsg.messageID);
                }
                api.sendMessage("Vui lòng tag một người để bắt đầu ván cờ!", threadID, messageID);
            }
        } catch (error) {
            console.error('Chess game error:', error);
            api.sendMessage("Đã xảy ra lỗi khi khởi tạo ván cờ. Vui lòng thử lại sau.", threadID);
        }
    },

    formatChessMove(input, chess) {
        input = input.toLowerCase().trim();
        
        if (/^[a-h][1-8]$/.test(input)) {
            const possibleMoves = chess.moves({ verbose: true });
            for (const move of possibleMoves) {
                if (move.to === input) {
                    return move.from + move.to;
                }
            }
        }

        input = input.replace(/\s+/g, '');

        try {
            if (chess.move(input, { sloppy: true })) {
                chess.undo();
                return input;
            }
        } catch (e) {}

        return input; 
    },

    validateMove(input, chess) {
        input = input.toLowerCase().trim();

        const possibleMoves = chess.moves({ verbose: true });
        
        if (/^[a-h][1-8]$/.test(input)) {

            const pawnMove = possibleMoves.find(move => 
                move.to === input && 
                move.piece.toLowerCase() === 'p'
            );
            if (pawnMove) {
                return pawnMove.from + pawnMove.to;
            }
        }

        if (/^[a-h][1-8][a-h][1-8]$/.test(input)) {

            const fullMove = possibleMoves.find(move => 
                (move.from + move.to) === input
            );
            if (fullMove) {
                return input;
            }
        }

        return null; 
    },

    onReply: async function({ event, api }) {
        const { threadID, senderID, body, messageReply } = event;
        
        const gameState = this.games.get(threadID);
        if (!gameState) return;

        const { chess, author, competitor_id } = gameState;
        
        if (messageReply?.messageID !== gameState.lastMessageID) {
            return api.sendMessage("⚠️ Vui lòng reply tin nhắn cuối cùng của ván cờ!", threadID);
        }

        const currentPlayer = chess.turn() === 'w' ? author : competitor_id;
        if (senderID !== currentPlayer) return;

        try {
            const input = body.toLowerCase().trim();
            const validMove = this.validateMove(input, chess);
            
            if (!validMove) {
                return api.sendMessage(
                    "⚠️ Nước đi không hợp lệ! Ví dụ:\n" +
                    "• Tốt: e4 hoặc e2e4\n" +
                    "• Nước đi đầy đủ: a2a4, h7h5\n" +
                    "Lưu ý: Chỉ sử dụng các ô từ a-h và số 1-8",
                    threadID
                );
            }

            const move = chess.move(validMove);
            if (!move) {
                return api.sendMessage("⚠️ Nước đi này không thể thực hiện được!", threadID);
            }

            const imagePath = await this.drawChessBoard(chess);
            const nextPlayer = chess.turn() === 'w' ? author : competitor_id;
            
            const msg = await api.sendMessage({
                body: `🔄 Nước đi: ${input}\n👉 Lượt của ${chess.turn() === 'w' ? 'Trắng' : 'Đen'} (${this.getPlayerName(nextPlayer, chess.turn() === 'w' ? 1 : 2)})`,
                attachment: fs.createReadStream(imagePath)
            }, threadID);

            fs.unlinkSync(imagePath);

            gameState.lastMessageID = msg.messageID;
            this.games.set(threadID, gameState);

            global.client.onReply = global.client.onReply.filter(item => item.messageID !== messageReply.messageID);
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                competitor_id: competitor_id
            });

            if (chess.isCheckmate?.() || chess.isDraw?.() || chess.isStalemate?.()) {
                let endMessage = "🏁 Kết thúc!\n";
                if (chess.isCheckmate?.()) {
                    endMessage += `🎉 ${this.getPlayerName(senderID, chess.turn() === 'w' ? 2 : 1)} chiếu hết!`;
                } else {
                    endMessage += "🤝 Hòa cờ!";
                }
                api.sendMessage(endMessage, threadID);
                this.games.delete(threadID);

                global.client.onReply = global.client.onReply.filter(item => item.messageID !== msg.messageID);
                return;
            }

        } catch (error) {
            console.error('Chess move error:', error);
            api.sendMessage("❌ Đã xảy ra lỗi. Vui lòng thử lại.", threadID);
        }
    }
};
