const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

module.exports = {
    name: " ",
    aliases: ["caro", "gomoku"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi cờ caro",
    usedby: 0,
    usages: "@tag người chơi để bắt đầu ván cờ",
    cooldowns: 0,
    
    activeGames: new Map(),
    
    boardSize: 15, 
    cellSize: 30, 
    winCondition: 5, 
    
    createBoardCanvas: async function(boardState, playerData) {
        try {
            const padding = 20;
            const headerHeight = 60;
            const footerHeight = 40;
            const totalWidth = this.boardSize * this.cellSize + padding * 2;
            const totalHeight = this.boardSize * this.cellSize + padding * 2 + headerHeight + footerHeight;
            
            // Tạo canvas
            const canvas = createCanvas(totalWidth, totalHeight);
            const ctx = canvas.getContext('2d');
            
            // Vẽ background với gradient
            const bgGradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
            bgGradient.addColorStop(0, '#0f0c29');
            bgGradient.addColorStop(0.5, '#302b63');
            bgGradient.addColorStop(1, '#24243e');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            
            // Thêm hiệu ứng particle cho nền
            this.drawParticles(ctx, totalWidth, totalHeight);
            
            // Vẽ header với gradient
            const headerGradient = ctx.createLinearGradient(0, 0, totalWidth, headerHeight);
            headerGradient.addColorStop(0, '#e94560');
            headerGradient.addColorStop(0.5, '#fc5c7d');
            headerGradient.addColorStop(1, '#e94560');
            ctx.fillStyle = headerGradient;
            ctx.fillRect(0, 0, totalWidth, headerHeight);
            
            // Vẽ tiêu đề game
            ctx.font = 'bold 24px "BeVietnam Bold", Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText('GOMOKU - CỜ CARO', totalWidth / 2, 30);
            
            // Vẽ thông tin người chơi
            ctx.font = 'bold 16px "BeVietnam Medium", Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`X: ${playerData.playerX}`, padding, 45);
            ctx.textAlign = 'right';
            ctx.fillText(`O: ${playerData.playerO}`, totalWidth - padding, 45);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Vẽ bảng cờ
            ctx.fillStyle = '#f0d9b5'; // Màu nền bàn cờ
            ctx.fillRect(padding, headerHeight, this.boardSize * this.cellSize, this.boardSize * this.cellSize);
            
            // Vẽ lưới
            ctx.strokeStyle = '#7b5f40';
            ctx.lineWidth = 1;
            
            // Vẽ các đường dọc
            for (let i = 0; i <= this.boardSize; i++) {
                ctx.beginPath();
                const x = padding + i * this.cellSize;
                ctx.moveTo(x, headerHeight);
                ctx.lineTo(x, headerHeight + this.boardSize * this.cellSize);
                ctx.stroke();
            }
            
            // Vẽ các đường ngang
            for (let i = 0; i <= this.boardSize; i++) {
                ctx.beginPath();
                const y = headerHeight + i * this.cellSize;
                ctx.moveTo(padding, y);
                ctx.lineTo(padding + this.boardSize * this.cellSize, y);
                ctx.stroke();
            }
            
            // Vẽ các điểm đánh dấu trên bàn cờ
            const markPoints = [3, 7, 11];
            ctx.fillStyle = '#7b5f40';
            for (const i of markPoints) {
                for (const j of markPoints) {
                    ctx.beginPath();
                    const x = padding + i * this.cellSize;
                    const y = headerHeight + j * this.cellSize;
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Vẽ tọa độ
            ctx.font = '14px "BeVietnam Medium", Arial';
            ctx.fillStyle = '#cccccc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Vẽ tọa độ theo cột (A, B, C, ...)
            for (let i = 0; i < this.boardSize; i++) {
                const x = padding + i * this.cellSize + this.cellSize / 2;
                const y = headerHeight - 15;
                ctx.fillText(String.fromCharCode(65 + i), x, y);
            }
            
            // Vẽ tọa độ theo hàng (1, 2, 3, ...)
            ctx.textAlign = 'right';
            for (let i = 0; i < this.boardSize; i++) {
                const x = padding - 10;
                const y = headerHeight + i * this.cellSize + this.cellSize / 2;
                ctx.fillText(i + 1, x, y);
            }
            
            // Vẽ các nước đi
            for (let y = 0; y < this.boardSize; y++) {
                for (let x = 0; x < this.boardSize; x++) {
                    if (boardState[y][x] !== null) {
                        const playerPiece = boardState[y][x] === 'X' ? 'X' : 'O';
                        const centerX = padding + x * this.cellSize + this.cellSize / 2;
                        const centerY = headerHeight + y * this.cellSize + this.cellSize / 2;
                        
                        if (playerPiece === 'X') {
                            // Vẽ quân X với hiệu ứng
                            this.drawX(ctx, centerX, centerY, this.cellSize * 0.4);
                        } else {
                            // Vẽ quân O với hiệu ứng
                            this.drawO(ctx, centerX, centerY, this.cellSize * 0.4);
                        }
                    }
                }
            }
            
            // Vẽ nước đi cuối cùng với đánh dấu màu khác (nếu có)
            if (playerData.lastMove) {
                const { x, y } = playerData.lastMove;
                const centerX = padding + x * this.cellSize + this.cellSize / 2;
                const centerY = headerHeight + y * this.cellSize + this.cellSize / 2;
                
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(centerX, centerY, this.cellSize * 0.45, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Vẽ footer với thông tin lượt đi
            const footerGradient = ctx.createLinearGradient(0, totalHeight - footerHeight, totalWidth, totalHeight);
            footerGradient.addColorStop(0, 'rgba(46, 204, 113, 0.7)');
            footerGradient.addColorStop(1, 'rgba(52, 152, 219, 0.7)');
            
            ctx.fillStyle = footerGradient;
            this.roundRect(ctx, padding, totalHeight - footerHeight, totalWidth - padding * 2, footerHeight - 10, 10);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px "BeVietnam Medium", Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `Lượt tiếp theo: ${playerData.currentTurn === 'X' ? playerData.playerX : playerData.playerO} (${playerData.currentTurn})`, 
                totalWidth / 2, 
                totalHeight - 25
            );
            
            // Lưu canvas vào file
            const tempDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const filePath = path.join(tempDir, `tictactoe_${Date.now()}.png`);
            const out = fs.createWriteStream(filePath);
            const stream = canvas.createPNGStream();
            
            return new Promise((resolve, reject) => {
                stream.pipe(out);
                out.on('finish', () => resolve(filePath));
                out.on('error', reject);
            });
            
        } catch (error) {
            console.error('Error creating tictactoe board:', error);
            throw new Error('Không thể tạo bảng cờ caro.');
        }
    },
    
    drawX: function(ctx, x, y, size) {
        // Vẽ X với hiệu ứng gradient và bóng đổ
        const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(1, '#c0392b');
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    },
    
    drawO: function(ctx, x, y, size) {
        // Vẽ O với hiệu ứng gradient và bóng đổ
        const gradient = ctx.createRadialGradient(x, y, size * 0.7, x, y, size);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = gradient;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    },
    
    drawParticles: function(ctx, width, height) {
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            
            const colorHue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsla(${colorHue}, 70%, 70%, ${Math.random() * 0.3})`;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },
    
    roundRect: function(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        return ctx;
    },
    
    createBoard: function() {
        // Tạo bảng trống 15x15
        return Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
    },
    
    checkWin: function(board, row, col, player) {
        const directions = [
            [0, 1],   // Ngang
            [1, 0],   // Dọc
            [1, 1],   // Chéo xuống
            [1, -1]   // Chéo lên
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;  // Bắt đầu với quân vừa đặt
            
            // Kiểm tra theo một hướng
            for (let i = 1; i < this.winCondition; i++) {
                const r = row + i * dy;
                const c = col + i * dx;
                
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || board[r][c] !== player) {
                    break;
                }
                
                count++;
            }
            
            // Kiểm tra theo hướng ngược lại
            for (let i = 1; i < this.winCondition; i++) {
                const r = row - i * dy;
                const c = col - i * dx;
                
                if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize || board[r][c] !== player) {
                    break;
                }
                
                count++;
            }
            
            // Nếu có 5 quân liên tiếp
            if (count >= this.winCondition) {
                return true;
            }
        }
        
        return false;
    },
    
    isBoardFull: function(board) {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === null) {
                    return false;
                }
            }
        }
        return true;
    },
    
    parseCoordinate: function(input) {
        if (!input || input.length < 2 || input.length > 3) return null;
        
        // Lấy chữ cái đầu tiên (A-O)
        const colChar = input.charAt(0).toUpperCase();
        if (colChar < 'A' || colChar > 'O') return null;
        
        // Lấy số (1-15)
        const rowNum = parseInt(input.substring(1));
        if (isNaN(rowNum) || rowNum < 1 || rowNum > 15) return null;
        
        // Chuyển đổi sang tọa độ mảng (0-14)
        const col = colChar.charCodeAt(0) - 65;
        const row = rowNum - 1;
        
        return { x: col, y: row };
    },
    
    getUserName: function(userID) {
        const userDataPath = path.join(__dirname, '../events/cache/userData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || "Người dùng";
        } catch (error) {
            console.error("Error reading userData:", error);
            return "Người dùng";
        }
    },
    
    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        
        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Nhóm này đang có ván cờ caro đang diễn ra. Vui lòng đợi ván hiện tại kết thúc!", threadID, messageID);
        }
        
        if (Object.keys(event.mentions).length !== 1) {
            return api.sendMessage("⚠️ Vui lòng tag một người để bắt đầu ván cờ caro!", threadID, messageID);
        }
        
        const opponent = Object.keys(event.mentions)[0];
        
        if (opponent === senderID) {
            return api.sendMessage("❌ Bạn không thể chơi với chính mình!", threadID, messageID);
        }
        
        // Tạo bàn cờ mới
        const boardState = this.createBoard();
        
        // Lưu thông tin game
        const gameState = {
            board: boardState,
            players: {
                X: senderID,
                O: opponent
            },
            currentTurn: 'X',
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            lastMove: null,
            checkInactivityInterval: null
        };
        
        // Tự động kết thúc nếu không tương tác
        gameState.checkInactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - gameState.lastMoveTime;
            
            if (idleTime >= 3 * 60 * 1000) { // 3 phút
                clearInterval(gameState.checkInactivityInterval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Ván cờ caro đã bị hủy do không có nước đi nào trong 3 phút!", threadID);
            }
        }, 30000);
        
        this.activeGames.set(threadID, gameState);
        
        const playerXName = this.getUserName(senderID);
        const playerOName = this.getUserName(opponent);
        
        // Tạo canvas của bàn cờ
        const playerData = {
            playerX: playerXName,
            playerO: playerOName,
            currentTurn: gameState.currentTurn,
            lastMove: null
        };
        
        const boardImage = await this.createBoardCanvas(boardState, playerData);
        
        await api.sendMessage({
            body: `🎮 Ván cờ caro bắt đầu!\n` +
                  `👤 X: ${playerXName}\n` +
                  `👤 O: ${playerOName}\n\n` +
                  `📝 Luật chơi: Đạt 5 quân liên tiếp để thắng\n` +
                  `🎯 Cách chơi: Reply với tọa độ (VD: A1, B2, ...)\n\n` +
                  `⏱️ Lượt của: ${playerXName} (X)`,
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
        const { threadID, messageID, senderID, body } = event;
        const game = this.activeGames.get(threadID);
        
        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván cờ caro!", threadID, messageID);
        }
        
        const currentPlayer = game.players[game.currentTurn];
        
        if (senderID !== currentPlayer) {
            return api.sendMessage("❌ Chưa đến lượt của bạn!", threadID, messageID);
        }
        
        const input = body.trim();
        const coords = this.parseCoordinate(input);
        
        if (!coords) {
            return api.sendMessage("❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: A1, B2, ...", threadID, messageID);
        }
        
        const { x, y } = coords;
        const { board } = game;
        
        // Kiểm tra ô đã có quân chưa
        if (board[y][x] !== null) {
            return api.sendMessage("❌ Ô này đã được đánh! Vui lòng chọn ô khác.", threadID, messageID);
        }
        
        // Đặt quân
        board[y][x] = game.currentTurn;
        game.lastMove = { x, y };
        game.lastMoveTime = Date.now();
        
        // Kiểm tra thắng/thua
        const isWin = this.checkWin(board, y, x, game.currentTurn);
        const isDraw = !isWin && this.isBoardFull(board);
        const gameOver = isWin || isDraw;
        
        // Đổi lượt
        const nextTurn = game.currentTurn === 'X' ? 'O' : 'X';
        if (!gameOver) {
            game.currentTurn = nextTurn;
        }
        
        // Tạo canvas mới
        const playerXName = this.getUserName(game.players.X);
        const playerOName = this.getUserName(game.players.O);
        
        const playerData = {
            playerX: playerXName,
            playerO: playerOName,
            currentTurn: game.currentTurn,
            lastMove: game.lastMove
        };
        
        const boardImage = await this.createBoardCanvas(board, playerData);
        
        // Tính thời gian chơi
        const gameTimeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = gameTimeSeconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        let messageBody = "";
        
        if (gameOver) {
            // Kết thúc game
            clearInterval(game.checkInactivityInterval);
            this.activeGames.delete(threadID);
            
            if (isWin) {
                const winner = game.currentTurn;
                const winnerName = winner === 'X' ? playerXName : playerOName;
                
                messageBody = `🎮 CHIẾN THẮNG! 🎉\n` +
                            `👑 Người chiến thắng: ${winnerName} (${winner})\n` +
                            `⏱️ Thời gian: ${timeString}\n` +
                            `🎯 Nước đi cuối: ${input.toUpperCase()}\n\n` +
                            `Chúc mừng! Đã hoàn thành 5 quân liên tiếp!`;
            } else {
                messageBody = `🎮 HÒA! 🤝\n` +
                            `⏱️ Thời gian: ${timeString}\n\n` +
                            `Bàn cờ đã đầy. Không có người chiến thắng!`;
            }
        } else {
            // Game đang tiếp tục
            const nextPlayerName = game.currentTurn === 'X' ? playerXName : playerOName;
            
            messageBody = `🎮 Cờ Caro - Nước đi: ${input.toUpperCase()}\n` +
                        `⏱️ Thời gian: ${timeString}\n` +
                        `🎯 ${game.currentTurn === 'X' ? 'O' : 'X'}: (${input.toUpperCase()})\n\n` +
                        `⏳ Lượt tiếp theo: ${nextPlayerName} (${game.currentTurn})`;
        }
        
        await api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) {
                console.error(err);
                return api.sendMessage("❌ Có lỗi khi gửi bàn cờ!", threadID);
            }
            
            fs.unlinkSync(boardImage);
            
            if (!gameOver) {
                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: game.players[game.currentTurn],
                    opponent: game.players[game.currentTurn === 'X' ? 'O' : 'X'],
                    threadID: threadID
                });
            }
        });
    },
    
    onLoad: function() {
        // Xóa tất cả các game đang diễn ra khi bot được khởi động lại
        for (const [threadID, game] of this.activeGames) {
            if (game.checkInactivityInterval) {
                clearInterval(game.checkInactivityInterval);
            }
        }
        this.activeGames.clear();
    }
};