const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: "minesweeper",
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi game dò mìn",
    usedby: 0,
    usages: "minesweeper [easy/medium/hard]",
    cooldowns: 0,

    activeGames: new Map(),

    createBoardCanvas: async function(boardData, playerData, showMines = false) {
        try {
            const cellSize = 40;
            const { board, width, height, mineCount, remainingCells } = boardData;
            
            const canvas = createCanvas(width * cellSize + 100, height * cellSize + 150);
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#0f0c29');
            gradient.addColorStop(0.5, '#302b63');
            gradient.addColorStop(1, '#24243e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            this.drawParticles(ctx, canvas.width, canvas.height);
            
            const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 60);
            headerGradient.addColorStop(0, '#e94560');
            headerGradient.addColorStop(0.5, '#fc5c7d');
            headerGradient.addColorStop(1, '#e94560');
            ctx.fillStyle = headerGradient;
            ctx.fillRect(0, 0, canvas.width, 60);
            
            // Vẽ tiêu đề với bóng đổ
            ctx.font = 'bold 28px "BeVietnam Bold", Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText('MINESWEEPER', canvas.width / 2, 40);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Vẽ khung thông tin game
            ctx.fillStyle = 'rgba(20, 20, 40, 0.7)';
            ctx.beginPath();
            this.roundRect(ctx, 20, 70, 250, 60, 10);
            ctx.fill();
            
            // Vẽ thông tin game với hiệu ứng text gradient
            ctx.font = 'bold 20px "BeVietnam Medium", Arial';
            const infoGradient = ctx.createLinearGradient(20, 90, 270, 90);
            infoGradient.addColorStop(0, '#4ecca3');
            infoGradient.addColorStop(1, '#2ecc71');
            ctx.fillStyle = infoGradient;
            ctx.textAlign = 'left';
            ctx.fillText(`Mìn: ${mineCount}`, 30, 90);
            ctx.fillText(`Ô còn lại: ${remainingCells}`, 30, 120);
            
            if (playerData && playerData.playerName) {
                const playerGradient = ctx.createLinearGradient(canvas.width - 250, 90, canvas.width - 20, 90);
                playerGradient.addColorStop(0, '#6a82fb');
                playerGradient.addColorStop(1, '#fc5c7d');
                ctx.fillStyle = playerGradient;
                ctx.textAlign = 'right';
                ctx.fillText(`${playerData.playerName}`, canvas.width - 30, 90);
            }

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const cell = board[y][x];
                    const cellX = 50 + x * cellSize;
                    const cellY = 150 + y * cellSize;
                    
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    let cellGradient;
                    if (cell.isRevealed) {
                        cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellSize, cellY + cellSize);
                        cellGradient.addColorStop(0, '#2c3e50');
                        cellGradient.addColorStop(1, '#1c2e40');
                    } else {
                        cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellSize, cellY + cellSize);
                        cellGradient.addColorStop(0, '#34495e');
                        cellGradient.addColorStop(1, '#2c3e50');
                    }
                    
                    if (cell.isFlagged && !showMines) {
                        cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellSize, cellY + cellSize);
                        cellGradient.addColorStop(0, '#e67e22');
                        cellGradient.addColorStop(1, '#d35400');
                    }
                    
                    ctx.fillStyle = cellGradient;
                    
                    // Vẽ ô với góc bo tròn
                    ctx.beginPath();
                    this.roundRect(ctx, cellX, cellY, cellSize - 2, cellSize - 2, 5);
                    ctx.fill();
                    
                    // Tắt bóng đổ sau khi vẽ ô
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // Hiển thị nội dung ô
                    if (cell.isRevealed || showMines) {
                        if (cell.isMine) {
                            // Vẽ mìn với hiệu ứng ánh sáng
                            const mineGradient = ctx.createRadialGradient(
                                cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, 0,
                                cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, cellSize/3
                            );
                            
                            if (showMines) {
                                mineGradient.addColorStop(0, '#ff5555');
                                mineGradient.addColorStop(0.7, '#e74c3c');
                                mineGradient.addColorStop(1, '#c0392b');
                            } else {
                                mineGradient.addColorStop(0, '#ff5555');
                                mineGradient.addColorStop(0.7, '#e74c3c');
                                mineGradient.addColorStop(1, '#c0392b');
                                
                                // Thêm hiệu ứng nổ
                                this.drawExplosion(ctx, cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, cellSize/2);
                            }
                            
                            ctx.fillStyle = mineGradient;
                            ctx.beginPath();
                            ctx.arc(cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, cellSize/3, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Thêm chi tiết cho mìn
                            ctx.fillStyle = '#000000';
                            ctx.beginPath();
                            ctx.arc(cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, cellSize/8, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Thêm các gai cho mìn
                            this.drawMineSpikes(ctx, cellX + cellSize/2 - 1, cellY + cellSize/2 - 1, cellSize/3);
                        } else if (cell.adjacentMines > 0) {
                            // Vẽ số với bóng đổ
                            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c', '#34495e', '#7f8c8d'];
                            
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                            ctx.shadowBlur = 2;
                            ctx.fillStyle = colors[(cell.adjacentMines - 1) % colors.length];
                            ctx.font = 'bold 22px "BeVietnam Bold", Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(cell.adjacentMines.toString(), cellX + cellSize/2 - 1, cellY + cellSize/2);
                            ctx.shadowBlur = 0;
                        }
                    } else if (cell.isFlagged) {
                        // Vẽ cờ với hiệu ứng
                        ctx.fillStyle = '#ff5555';
                        ctx.beginPath();
                        ctx.moveTo(cellX + cellSize/2 - 1, cellY + cellSize/4);
                        ctx.lineTo(cellX + cellSize*3/4, cellY + cellSize/2 - 1);
                        ctx.lineTo(cellX + cellSize/2 - 1, cellY + cellSize*3/4);
                        ctx.fill();
                        
                        // Vẽ cán cờ
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(cellX + cellSize/2 - 1, cellY + cellSize/4);
                        ctx.lineTo(cellX + cellSize/2 - 1, cellY + cellSize*3/4 + 5);
                        ctx.stroke();
                    }
                    
                    // Vẽ viền ô
                    ctx.strokeStyle = 'rgba(26, 26, 46, 0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    this.roundRect(ctx, cellX, cellY, cellSize - 2, cellSize - 2, 5);
                    ctx.stroke();
                }
            }
            
            // Vẽ tọa độ với hiệu ứng gradient
            const coordGradient = ctx.createLinearGradient(50, 140, 50 + width * cellSize, 140);
            coordGradient.addColorStop(0, '#bdc3c7');
            coordGradient.addColorStop(0.5, '#ecf0f1');
            coordGradient.addColorStop(1, '#bdc3c7');
            ctx.fillStyle = coordGradient;
            
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 2;
            
            for (let x = 0; x < width; x++) {
                ctx.fillText(String.fromCharCode(65 + x), 50 + x * cellSize + cellSize/2 - 1, 140);
            }
            
            ctx.textAlign = 'right';
            for (let y = 0; y < height; y++) {
                ctx.fillText((y + 1).toString(), 40, 150 + y * cellSize + cellSize/2);
            }
            ctx.shadowBlur = 0;
            
            // Vẽ footer với gradient
            const footerY = 150 + height * cellSize + 20;
            const footerGradient = ctx.createLinearGradient(0, footerY, canvas.width, footerY + 30);
            footerGradient.addColorStop(0, 'rgba(46, 204, 113, 0.3)');
            footerGradient.addColorStop(1, 'rgba(52, 152, 219, 0.3)');
            
            ctx.fillStyle = footerGradient;
            ctx.beginPath();
            this.roundRect(ctx, 20, footerY, canvas.width - 40, 30, 10);
            ctx.fill();
            
            ctx.font = '14px "BeVietnam Medium", Arial';
            ctx.fillStyle = '#ecf0f1';
            ctx.textAlign = 'center';
            ctx.fillText('AKI Minesweeper • Mở ô an toàn để chiến thắng!', canvas.width / 2, footerY + 20);
            
            // Lưu canvas vào file
            const tempDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const filePath = path.join(tempDir, `minesweeper_${Date.now()}.png`);
            const out = fs.createWriteStream(filePath);
            const stream = canvas.createPNGStream();
            
            return new Promise((resolve, reject) => {
                stream.pipe(out);
                out.on('finish', () => resolve(filePath));
                out.on('error', reject);
            });
            
        } catch (error) {
            console.error('Error creating minesweeper board:', error);
            throw new Error('Không thể tạo bảng dò mìn.');
        }
    },
    
    // Hàm helper vẽ hình chữ nhật có góc bo tròn
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
    
    // Hàm vẽ các particle ngẫu nhiên cho nền
    drawParticles: function(ctx, width, height) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;
            
            const colorHue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsla(${colorHue}, 70%, 70%, ${Math.random() * 0.5})`;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },
    
    // Hàm vẽ hiệu ứng nổ khi đạp phải mìn
    drawExplosion: function(ctx, x, y, radius) {
        const outerRadius = radius * 1.7;
        const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, outerRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(0.2, 'rgba(255, 165, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Thêm tia nổ
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeLength = radius * (1 + Math.random() * 0.5);
            
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * spikeLength,
                y + Math.sin(angle) * spikeLength
            );
            ctx.stroke();
        }
    },
    
    // Hàm vẽ các gai cho mìn
    drawMineSpikes: function(ctx, x, y, radius) {
        const spikeCount = 8;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * radius * 1.3,
                y + Math.sin(angle) * radius * 1.3
            );
            ctx.stroke();
        }
    },

    createBoard: function(width, height, mineCount) {
        // Tạo bảng trống
        const board = Array(height).fill().map(() => 
            Array(width).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            }))
        );
        
        // Đặt mìn ngẫu nhiên
        let minesPlaced = 0;
        while (minesPlaced < mineCount) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            if (!board[y][x].isMine) {
                board[y][x].isMine = true;
                minesPlaced++;
                
                // Cập nhật số mìn lân cận cho các ô xung quanh
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            board[ny][nx].adjacentMines++;
                        }
                    }
                }
            }
        }
        
        return {
            board,
            width,
            height,
            mineCount,
            remainingCells: width * height - mineCount,
            gameOver: false,
            win: false
        };
    },

    revealCell: function(boardData, x, y) {
        const { board, width, height } = boardData;
        
        // Kiểm tra tọa độ hợp lệ
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return false;
        }
        
        const cell = board[y][x];
        
        // Đã mở hoặc đã cắm cờ
        if (cell.isRevealed || cell.isFlagged) {
            return false;
        }
        
        // Mở ô
        cell.isRevealed = true;
        boardData.remainingCells--;
        
        // Nếu là mìn -> thua
        if (cell.isMine) {
            boardData.gameOver = true;
            return true;
        }
        
        // Nếu tất cả các ô không phải mìn đều đã mở -> thắng
        if (boardData.remainingCells === 0) {
            boardData.gameOver = true;
            boardData.win = true;
            return true;
        }
        
        // Nếu ô không có mìn lân cận, mở các ô xung quanh
        if (cell.adjacentMines === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    this.revealCell(boardData, x + dx, y + dy);
                }
            }
        }
        
        return true;
    },

    toggleFlag: function(boardData, x, y) {
        const { board, width, height } = boardData;
        
        // Kiểm tra tọa độ hợp lệ
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return false;
        }
        
        const cell = board[y][x];
        
        // Không thể cắm cờ ô đã mở
        if (cell.isRevealed) {
            return false;
        }
        
        cell.isFlagged = !cell.isFlagged;
        return true;
    },

    parseCoordinate: function(input) {
        if (!input || input.length < 2) return null;
        
        // Chuyển đổi tọa độ dạng A1, B2, C3, ...
        const col = input.charAt(0).toUpperCase().charCodeAt(0) - 65; // A=0, B=1, ...
        const row = parseInt(input.substring(1)) - 1; // 1->0, 2->1, ...
        
        return { x: col, y: row };
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

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        
        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Nhóm này đang có ván dò mìn đang diễn ra. Vui lòng đợi ván hiện tại kết thúc!", threadID, messageID);
        }
        
        // Xác định độ khó
        let difficulty = "medium";
        if (target[0]) {
            const validDifficulties = ["easy", "medium", "hard", "dễ", "trung bình", "khó"];
            const input = target[0].toLowerCase();
            
            if (validDifficulties.includes(input)) {
                if (input === "dễ" || input === "easy") difficulty = "easy";
                else if (input === "khó" || input === "hard") difficulty = "hard";
                else difficulty = "medium";
            }
        }
        
        // Cấu hình độ khó
        let width, height, mineCount;
        switch (difficulty) {
            case "easy":
                width = 6;
                height = 6;
                mineCount = 5;
                break;
            case "hard":
                width = 10;
                height = 10;
                mineCount = 20;
                break;
            case "medium":
            default:
                width = 8;
                height = 8;
                mineCount = 10;
                break;
        }
        
        // Tạo bảng chơi
        const boardData = this.createBoard(width, height, mineCount);
        
        // Lưu thông tin game
        const gameState = {
            boardData,
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            playerID: senderID,
            flagMode: false,
            checkInactivityInterval: null
        };
        
        // Tự động kết thúc nếu không tương tác
        gameState.checkInactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - gameState.lastMoveTime;
            
            if (idleTime >= 2 * 60 * 1000) { // 2 phút
                clearInterval(gameState.checkInactivityInterval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Ván dò mìn đã bị hủy do không có nước đi nào trong 2 phút!", threadID);
            }
        }, 30000);
        
        this.activeGames.set(threadID, gameState);
        
        const playerName = this.getUserName(senderID);
        const boardImage = await this.createBoardCanvas(boardData, { playerName });
        
        const difficultyText = {
            "easy": "Dễ",
            "medium": "Trung bình", 
            "hard": "Khó"
        }[difficulty];
        
        await api.sendMessage({
            body: `🎮 Ván dò mìn bắt đầu!\n` +
                  `👤 Người chơi: ${playerName}\n` +
                  `🔍 Độ khó: ${difficultyText} (${width}x${height}, ${mineCount} mìn)\n\n` +
                  `👉 Cách chơi:\n` +
                  `- Mở ô: reply với tọa độ (VD: A1, B2)\n` +
                  `- Cắm/Gỡ cờ: thêm F trước tọa độ (VD: FA1, FB2)\n` +
                  `- Đổi chế độ cắm cờ: gõ "flag" hoặc "cờ"\n\n` +
                  `Chế độ hiện tại: ${gameState.flagMode ? "🚩 Cắm cờ" : "⛏️ Mở ô"}`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) return console.error(err);
            fs.unlinkSync(boardImage);
            
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID,
                threadID: threadID
            });
        });
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const game = this.activeGames.get(threadID);
        
        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván dò mìn!", threadID, messageID);
        }
        
        if (senderID !== game.playerID) {
            return api.sendMessage("❌ Bạn không phải là người đang chơi ván này!", threadID, messageID);
        }
        
        const input = body.trim().toUpperCase();
        
        // Đổi chế độ cắm cờ
        if (input === "FLAG" || input === "CỜ") {
            game.flagMode = !game.flagMode;
            return api.sendMessage(`Đã chuyển sang chế độ: ${game.flagMode ? "🚩 Cắm cờ" : "⛏️ Mở ô"}`, threadID, messageID);
        }
        
        let coords;
        let flagMode = game.flagMode;
        
        // Kiểm tra xem có phải yêu cầu cắm cờ không
        if (input.startsWith("F")) {
            flagMode = true;
            coords = this.parseCoordinate(input.substring(1));
        } else {
            coords = this.parseCoordinate(input);
        }
        
        if (!coords) {
            return api.sendMessage("❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: A1, B2, C3, ...", threadID, messageID);
        }
        
        const { x, y } = coords;
        const { boardData } = game;
        
        // Kiểm tra tọa độ có nằm trong bảng không
        if (x < 0 || x >= boardData.width || y < 0 || y >= boardData.height) {
            return api.sendMessage("❌ Tọa độ nằm ngoài bảng!", threadID, messageID);
        }
        
        let actionSuccess = false;
        
        if (flagMode) {
            // Cắm/gỡ cờ
            actionSuccess = this.toggleFlag(boardData, x, y);
            if (!actionSuccess) {
                return api.sendMessage("❌ Không thể cắm cờ tại ô đã mở!", threadID, messageID);
            }
        } else {
            // Mở ô
            actionSuccess = this.revealCell(boardData, x, y);
            if (!actionSuccess) {
                return api.sendMessage("❌ Không thể mở ô đã mở hoặc đã cắm cờ!", threadID, messageID);
            }
        }
        
        game.lastMoveTime = Date.now();
        
        // Tính thời gian chơi
        const gameTimeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = gameTimeSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const playerName = this.getUserName(senderID);
        
        // Cập nhật và gửi trạng thái bảng
        const showMines = boardData.gameOver;
        const boardImage = await this.createBoardCanvas(boardData, { playerName }, showMines);
        
        let messageBody = "";
        
        if (boardData.gameOver) {
            // Kết thúc game
            clearInterval(game.checkInactivityInterval);
            this.activeGames.delete(threadID);
            
            if (boardData.win) {
                messageBody = `🎮 CHIẾN THẮNG! 🎉\n` +
                            `👤 Người chơi: ${playerName}\n` +
                            `⏱️ Thời gian: ${timeString}\n\n` +
                            `Bạn đã tìm thấy tất cả các ô an toàn!`;
            } else {
                messageBody = `🎮 THUA CUỘC! 💥\n` +
                            `👤 Người chơi: ${playerName}\n` +
                            `⏱️ Thời gian: ${timeString}\n\n` +
                            `Bạn đã đạp phải mìn! Trò chơi kết thúc.`;
            }
        } else {
            // Game đang tiếp tục
            messageBody = `🎮 Dò mìn - Nước đi: ${input}\n` +
                        `👤 Người chơi: ${playerName}\n` +
                        `⏱️ Thời gian: ${timeString}\n` +
                        `🚩 Mìn: ${boardData.mineCount}\n` +
                        `🔍 Ô còn lại: ${boardData.remainingCells}\n\n` +
                        `Chế độ hiện tại: ${game.flagMode ? "🚩 Cắm cờ" : "⛏️ Mở ô"}`;
        }
        
        await api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) {
                console.error(err);
                return api.sendMessage("❌ Có lỗi khi gửi bảng mìn!", threadID);
            }
            
            fs.unlinkSync(boardImage);
            
            if (!boardData.gameOver) {
                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
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