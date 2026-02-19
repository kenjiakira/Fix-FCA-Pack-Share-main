const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

module.exports = {
    name: "sudoku",
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi game Sudoku",
    usedby: 0,
    usages: "sudoku [easy/medium/hard/expert]",
    cooldowns: 0,

    activeGames: new Map(),
    difficulties: {
        easy: { clues: 38, name: "Dễ" },
        medium: { clues: 30, name: "Trung bình" },
        hard: { clues: 24, name: "Khó" },
        expert: { clues: 17, name: "Chuyên gia" }
    },

    createBoardCanvas: async function (gameData) {
        try {
            const { board, originalBoard, selectedCell, notes, errors, difficulty, playerName, timeElapsed } = gameData;
    
            // Cấu hình canvas với viền rộng hơn
            const cellSize = 50;
            const margin = 40; 
            const headerHeight = 60;
            const footerHeight = 60;
            const labelSize = 20; // Kích thước cho nhãn tọa độ
            const boardSize = 9 * cellSize;
            const canvasWidth = boardSize + 2 * margin + labelSize;
            const canvasHeight = boardSize + 2 * margin + headerHeight + footerHeight + labelSize;
    
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
    
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
            ctx.fillStyle = '#4361ee';
            ctx.fillRect(0, 0, canvasWidth, headerHeight);
    
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('SUDOKU', canvasWidth / 2, headerHeight / 2 + 8);
    
            ctx.fillStyle = '#4cc9f0';
            ctx.fillRect(0, canvasHeight - footerHeight, canvasWidth, footerHeight);
    
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
    
            const minutes = Math.floor(timeElapsed / 60);
            const seconds = timeElapsed % 60;
            const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
            ctx.fillText(`Độ khó: ${this.difficulties[difficulty].name}`, margin, canvasHeight - footerHeight / 2 + 7);
            ctx.textAlign = 'right';
            ctx.fillText(`Thời gian: ${timeFormat}`, canvasWidth - margin, canvasHeight - footerHeight / 2 + 7);
    
            const boardX = margin + labelSize;
            const boardY = headerHeight + labelSize;
    
            // Vẽ bảng Sudoku
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(boardX, boardY, boardSize, boardSize);
    
            // Vẽ viền ngoài đậm hơn
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(boardX, boardY, boardSize, boardSize);
    
            // Vẽ tọa độ cột (A-I)
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            for (let i = 0; i < 9; i++) {
                const label = String.fromCharCode(65 + i); // A=65, B=66, ...
                const x = boardX + i * cellSize + cellSize / 2;
                const y = boardY - 5;
                ctx.fillText(label, x, y);
            }
    
            // Vẽ tọa độ hàng (1-9)
            ctx.textAlign = 'right';
            for (let i = 0; i < 9; i++) {
                const label = (i + 1).toString();
                const x = boardX - 5;
                const y = boardY + i * cellSize + cellSize / 2 + 5;
                ctx.fillText(label, x, y);
            }
    
            // Vẽ lưới
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
    
            // Vẽ đường kẻ ngang
            for (let i = 0; i <= 9; i++) {
                const isThick = i % 3 === 0;
                ctx.lineWidth = isThick ? 2 : 1;
    
                ctx.beginPath();
                ctx.moveTo(boardX, boardY + i * cellSize);
                ctx.lineTo(boardX + boardSize, boardY + i * cellSize);
                ctx.stroke();
            }
    
            // Vẽ đường kẻ dọc
            for (let i = 0; i <= 9; i++) {
                const isThick = i % 3 === 0;
                ctx.lineWidth = isThick ? 2 : 1;
    
                ctx.beginPath();
                ctx.moveTo(boardX + i * cellSize, boardY);
                ctx.lineTo(boardX + i * cellSize, boardY + boardSize);
                ctx.stroke();
            }
    
            // Vẽ các ô được chọn
            if (selectedCell) {
                const { row, col } = selectedCell;
                ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
                ctx.fillRect(
                    boardX + col * cellSize,
                    boardY + row * cellSize,
                    cellSize,
                    cellSize
                );
            }
    
            // Vẽ các số trên bảng
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const value = board[row][col];
                    const isOriginal = originalBoard[row][col] !== 0;
                    const hasError = errors && errors.some(e => e.row === row && e.col === col);
    
                    if (value !== 0) {
                        ctx.font = 'bold 24px Arial';
    
                        // Đặt màu cho số
                        if (hasError) {
                            ctx.fillStyle = '#e63946'; // Đỏ cho số sai
                        } else if (isOriginal) {
                            ctx.fillStyle = '#000000'; // Đen cho số gốc
                        } else {
                            ctx.fillStyle = '#4361ee'; // Xanh cho số người chơi nhập
                        }
    
                        const x = boardX + col * cellSize + cellSize / 2;
                        const y = boardY + row * cellSize + cellSize / 2 + 8;
    
                        ctx.textAlign = 'center';
                        ctx.fillText(value.toString(), x, y);
                    } else if (notes && notes[row] && notes[row][col]) {
                        // Vẽ ghi chú
                        const cellNotes = notes[row][col];
                        ctx.font = '12px Arial';
                        ctx.fillStyle = '#666666';
    
                        const noteSize = cellSize / 3;
    
                        for (let num = 1; num <= 9; num++) {
                            if (cellNotes.includes(num)) {
                                const noteRow = Math.floor((num - 1) / 3);
                                const noteCol = (num - 1) % 3;
    
                                const x = boardX + col * cellSize + noteCol * noteSize + noteSize / 2;
                                const y = boardY + row * cellSize + noteRow * noteSize + noteSize / 2 + 4;
    
                                ctx.fillText(num.toString(), x, y);
                            }
                        }
                    }
                }
            }
    
            const tempDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
    
            const imagePath = path.join(tempDir, `sudoku_${Date.now()}.png`);
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
    
            return new Promise((resolve, reject) => {
                stream.pipe(out);
                out.on('finish', () => resolve(imagePath));
                out.on('error', reject);
            });
    
        } catch (error) {
            console.error('Error creating Sudoku board:', error);
            throw new Error('Không thể tạo bảng Sudoku.');
        }
    },
    // Tạo một bảng Sudoku mới
    generateSudokuBoard: function (difficulty = 'medium') {
        // Tạo bảng giải quyết hoàn chỉnh
        const solvedBoard = this.createEmptyBoard();
        this.solveSudoku(solvedBoard);

        // Tạo bảng câu đố bằng cách xóa các ô
        const puzzleBoard = JSON.parse(JSON.stringify(solvedBoard));
        const numClues = this.difficulties[difficulty].clues;

        // Xác định có bao nhiêu ô cần xóa
        const totalCells = 81;
        const cellsToRemove = totalCells - numClues;

        // Tạo danh sách các ô có thể xóa
        let cells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                cells.push({ row, col });
            }
        }

        // Xáo trộn các ô để xóa ngẫu nhiên
        this.shuffleArray(cells);

        // Xóa các ô
        for (let i = 0; i < cellsToRemove; i++) {
            const { row, col } = cells[i];
            puzzleBoard[row][col] = 0;
        }

        return {
            originalBoard: JSON.parse(JSON.stringify(puzzleBoard)),
            currentBoard: JSON.parse(JSON.stringify(puzzleBoard)),
            solvedBoard: solvedBoard
        };
    },

    // Tạo bảng trống
    createEmptyBoard: function () {
        return Array(9).fill().map(() => Array(9).fill(0));
    },

    // Giải thuật để giải Sudoku
    solveSudoku: function (board) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) return true; // Đã giải xong

        const { row, col } = emptyCell;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(nums); // Xáo trộn để tạo bảng ngẫu nhiên

        for (const num of nums) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[row][col] = num;

                if (this.solveSudoku(board)) {
                    return true;
                }

                board[row][col] = 0; // Backtrack
            }
        }

        return false;
    },

    // Tìm ô trống trong bảng
    findEmptyCell: function (board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return { row, col };
                }
            }
        }
        return null;
    },

    // Kiểm tra xem số có thể đặt vào ô không
    isValidPlacement: function (board, row, col, num) {
        // Kiểm tra hàng
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }

        // Kiểm tra cột
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }

        // Kiểm tra ô 3x3
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    },

    // Xáo trộn mảng (thuật toán Fisher-Yates)
    shuffleArray: function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // Kiểm tra xem bảng đã hoàn thành chưa
    isBoardComplete: function (board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) return false;
            }
        }
        return true;
    },

    // Kiểm tra xem bảng có đúng không
    validateBoard: function (board) {
        const errors = [];

        // Kiểm tra các hàng
        for (let row = 0; row < 9; row++) {
            const rowValues = new Set();
            for (let col = 0; col < 9; col++) {
                const value = board[row][col];
                if (value !== 0) {
                    if (rowValues.has(value)) {
                        errors.push({ row, col, value });
                    } else {
                        rowValues.add(value);
                    }
                }
            }
        }

        // Kiểm tra các cột
        for (let col = 0; col < 9; col++) {
            const colValues = new Set();
            for (let row = 0; row < 9; row++) {
                const value = board[row][col];
                if (value !== 0) {
                    if (colValues.has(value)) {
                        errors.push({ row, col, value });
                    } else {
                        colValues.add(value);
                    }
                }
            }
        }

        // Kiểm tra các ô 3x3
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const boxValues = new Set();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const row = boxRow * 3 + i;
                        const col = boxCol * 3 + j;
                        const value = board[row][col];

                        if (value !== 0) {
                            if (boxValues.has(value)) {
                                errors.push({ row, col, value });
                            } else {
                                boxValues.add(value);
                            }
                        }
                    }
                }
            }
        }

        return errors;
    },

    // Lấy thông tin người dùng
    getUserName: function (userID) {
        const userDataPath = path.join(__dirname, '../database/rankData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || "Người dùng";
        } catch (error) {
            console.error("Error reading userData:", error);
            return "Người dùng";
        }
    },

    // Các hướng dẫn
    getHelpMessage: function () {
        return `🎮 HƯỚNG DẪN CHƠI SUDOKU 🎮
━━━━━━━━━━━━━━━━━━

📝 Cách điền số:
• Reply với định dạng: A1=5
• A-I: chọn cột, 1-9: chọn hàng, số sau = là giá trị điền vào

📒 Ghi chú:
• Thêm ghi chú: A1?5,6,9
• Xóa ghi chú: A1?clear

⚙️ Các lệnh khác:
• help - Xem hướng dẫn
• hint - Gợi ý một ô
• check - Kiểm tra bảng hiện tại
• clear - Xóa trắng một ô (VD: A1=clear)
• solve - Xem đáp án
• quit - Kết thúc trò chơi`;
    },

    // Chuyển đổi tọa độ (A1 -> {row: 0, col: 0})
    parseCoordinate: function (coord) {
        if (!coord || coord.length < 2) return null;

        const colChar = coord.charAt(0).toUpperCase();
        if (colChar < 'A' || colChar > 'I') return null;

        const rowNum = parseInt(coord.substring(1));
        if (isNaN(rowNum) || rowNum < 1 || rowNum > 9) return null;

        const col = colChar.charCodeAt(0) - 65; // A=0, B=1, ...
        const row = rowNum - 1; // 1=0, 2=1, ...

        return { row, col };
    },

    // Hàm này được gọi khi module được tải
    onLoad: function () {
        // Dọn dẹp các game đang chạy khi bot khởi động lại
        for (const [threadID, game] of this.activeGames) {
            if (game.interval) {
                clearInterval(game.interval);
            }
        }
        this.activeGames.clear();
    },

    // Hàm được gọi khi lệnh được sử dụng
    onLaunch: async function ({ api, event, target }) {
        const { threadID, senderID, messageID } = event;

        // Kiểm tra nếu đã có game Sudoku đang chạy trong nhóm
        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Đã có một ván Sudoku đang diễn ra trong nhóm này. Vui lòng hoàn thành hoặc kết thúc ván hiện tại trước!", threadID, messageID);
        }

        // Xác định độ khó
        let difficulty = 'medium';
        if (target && target[0]) {
            const input = target[0].toLowerCase();
            if (Object.keys(this.difficulties).includes(input)) {
                difficulty = input;
            } else if (input === 'dễ' || input === 'de') {
                difficulty = 'easy';
            } else if (input === 'khó' || input === 'kho') {
                difficulty = 'hard';
            } else if (input === 'chuyên gia' || input === 'chuyen-gia' || input === 'expert') {
                difficulty = 'expert';
            }
        }

        // Tạo bảng Sudoku mới
        const sudokuData = this.generateSudokuBoard(difficulty);

        // Khởi tạo dữ liệu game
        const gameState = {
            board: sudokuData.currentBoard,
            originalBoard: sudokuData.originalBoard,
            solvedBoard: sudokuData.solvedBoard,
            difficulty: difficulty,
            playerID: senderID,
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            timeElapsed: 0,
            interval: null,
            selectedCell: null,
            notes: Array(9).fill().map(() => Array(9).fill().map(() => [])),
        };

        // Khởi tạo bộ đếm thời gian
        gameState.interval = setInterval(() => {
            const now = Date.now();
            gameState.timeElapsed = Math.floor((now - gameState.startTime) / 1000);

            // Tự động kết thúc game sau 30 phút
            if (gameState.timeElapsed > 30 * 60) {
                clearInterval(gameState.interval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Đã quá thời gian chơi (30 phút). Ván Sudoku đã kết thúc!", threadID);
            }

            // Kiểm tra không hoạt động
            const idleTime = now - gameState.lastMoveTime;
            if (idleTime > 5 * 60 * 1000) { // 5 phút không hoạt động
                clearInterval(gameState.interval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Không có hoạt động nào trong 5 phút. Ván Sudoku đã kết thúc!", threadID);
            }
        }, 1000);

        // Lưu thông tin game
        this.activeGames.set(threadID, gameState);

        // Tạo hình ảnh bảng Sudoku
        const playerName = this.getUserName(senderID);
        const canvasData = {
            board: gameState.board,
            originalBoard: gameState.originalBoard,
            selectedCell: null,
            notes: gameState.notes,
            errors: [],
            difficulty: difficulty,
            playerName: playerName,
            timeElapsed: 0
        };

        const boardImage = await this.createBoardCanvas(canvasData);

        // Gửi thông tin game
        await api.sendMessage({
            body: `🎮 SUDOKU - ${this.difficulties[difficulty].name.toUpperCase()} 🎮
━━━━━━━━━━
👤 Người chơi: ${playerName}
⏱️ Thời gian: 0:00

📝 Cách chơi:
• Reply tin nhắn này với định dạng A1=5 để điền số
• A-I là cột, 1-9 là hàng, 5 là số muốn điền

💡 Gõ "help" để xem hướng dẫn đầy đủ`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, info) => {
            if (err) return console.error(err);

            // Xóa file tạm
            fs.unlinkSync(boardImage);

            // Đăng ký reply listener
            global.client.onReply.push({
                name: this.name,
                messageID: info.messageID,
                author: senderID,
                threadID: threadID
            });
        });
    },

    // Xử lý phản hồi từ người dùng
    onReply: async function ({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const game = this.activeGames.get(threadID);

        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván Sudoku đang diễn ra!", threadID, messageID);
        }

        if (senderID !== game.playerID) {
            return api.sendMessage("❌ Bạn không phải là người đang chơi ván Sudoku này!", threadID, messageID);
        }

        game.lastMoveTime = Date.now();

        const input = body.trim().toLowerCase();

        // Xử lý các lệnh đặc biệt
        if (input === 'help') {
            return api.sendMessage(this.getHelpMessage(), threadID, messageID);
        }

        if (input === 'quit' || input === 'exit' || input === 'stop') {
            clearInterval(game.interval);
            this.activeGames.delete(threadID);
            return api.sendMessage("🛑 Ván Sudoku đã kết thúc!", threadID, messageID);
        }

        if (input === 'hint') {
            return this.provideHint(api, event, game);
        }

        if (input === 'check') {
            return this.checkBoard(api, event, game);
        }

        if (input === 'solve') {
            return this.solveBoard(api, event, game);
        }

        // Xử lý nhập số
        const isNote = input.includes('?');
        const isInput = input.includes('=');

        if (isNote) {
            // Xử lý ghi chú
            const parts = input.split('?');
            if (parts.length !== 2) {
                return api.sendMessage("❌ Định dạng ghi chú không đúng! Ví dụ: A1?5,6,9", threadID, messageID);
            }

            const coord = this.parseCoordinate(parts[0]);
            if (!coord) {
                return api.sendMessage("❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: A1?5,6,9", threadID, messageID);
            }

            const { row, col } = coord;

            // Kiểm tra ô đã được điền số chưa
            if (game.originalBoard[row][col] !== 0) {
                return api.sendMessage("❌ Không thể thêm ghi chú cho ô có số gốc!", threadID, messageID);
            }

            if (game.board[row][col] !== 0) {
                return api.sendMessage("❌ Không thể thêm ghi chú cho ô đã điền số!", threadID, messageID);
            }

            if (parts[1].toLowerCase() === 'clear') {
                // Xóa tất cả ghi chú
                game.notes[row][col] = [];
                return this.updateBoardDisplay(api, threadID, game);
            }

            // Phân tích các số ghi chú
            const noteValues = parts[1].split(/[ ,]+/).map(Number).filter(n => n >= 1 && n <= 9);

            if (noteValues.length === 0) {
                return api.sendMessage("❌ Không có số hợp lệ nào trong ghi chú! Các số phải từ 1-9.", threadID, messageID);
            }

            // Cập nhật ghi chú
            game.notes[row][col] = noteValues;
            return this.updateBoardDisplay(api, threadID, game);
        }

        if (isInput) {
            // Xử lý nhập số
            const parts = input.split('=');
            if (parts.length !== 2) {
                return api.sendMessage("❌ Định dạng không đúng! Ví dụ: A1=5", threadID, messageID);
            }

            const coord = this.parseCoordinate(parts[0]);
            if (!coord) {
                return api.sendMessage("❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: A1=5", threadID, messageID);
            }

            const { row, col } = coord;

            // Kiểm tra ô gốc
            if (game.originalBoard[row][col] !== 0) {
                return api.sendMessage("❌ Không thể thay đổi các ô gốc của trò chơi!", threadID, messageID);
            }

            // Xử lý lệnh xóa
            if (parts[1].trim().toLowerCase() === 'clear' || parts[1].trim() === '0') {
                game.board[row][col] = 0;
                return this.updateBoardDisplay(api, threadID, game);
            }

            // Xác nhận giá trị hợp lệ
            const value = parseInt(parts[1]);
            if (isNaN(value) || value < 1 || value > 9) {
                return api.sendMessage("❌ Giá trị không hợp lệ! Vui lòng nhập số từ 1-9.", threadID, messageID);
            }

            // Cập nhật bảng
            game.board[row][col] = value;

            // Xóa ghi chú khi đã điền số
            game.notes[row][col] = [];

            // Kiểm tra nếu hoàn thành
            if (this.isBoardComplete(game.board)) {
                const errors = this.validateBoard(game.board);

                if (errors.length === 0) {
                    // Game hoàn thành thành công
                    clearInterval(game.interval);
                    this.activeGames.delete(threadID);

                    // Format thời gian
                    const minutes = Math.floor(game.timeElapsed / 60);
                    const seconds = game.timeElapsed % 60;
                    const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                    // Tạo hình ảnh bảng hoàn thành
                    const finalCanvasData = {
                        board: game.board,
                        originalBoard: game.originalBoard,
                        selectedCell: null,
                        notes: game.notes,
                        errors: [],
                        difficulty: game.difficulty,
                        playerName: this.getUserName(senderID),
                        timeElapsed: game.timeElapsed
                    };

                    const finalBoardImage = await this.createBoardCanvas(finalCanvasData);

                    await api.sendMessage({
                        body: `🎮 SUDOKU - CHIẾN THẮNG! 🎮
━━━━━━━━━━
👤 Người chơi: ${this.getUserName(senderID)}
⏱️ Thời gian hoàn thành: ${timeFormat}
🏆 Độ khó: ${this.difficulties[game.difficulty].name}

🎉 Chúc mừng! Bạn đã hoàn thành bảng Sudoku!`,
                        attachment: fs.createReadStream(finalBoardImage)
                    }, threadID, () => {
                        fs.unlinkSync(finalBoardImage);
                    });

                    return;
                }
            }

            // Hiển thị bảng đã cập nhật
            return this.updateBoardDisplay(api, threadID, game);
        }

        // Nếu không khớp với định dạng nào
        return api.sendMessage("❌ Định dạng không đúng! Ví dụ nhập số: A1=5, thêm ghi chú: A1?5,6,9", threadID, messageID);
    },

    // Cập nhật hiển thị bảng
    updateBoardDisplay: async function (api, threadID, game) {
        const canvasData = {
            board: game.board,
            originalBoard: game.originalBoard,
            selectedCell: game.selectedCell,
            notes: game.notes,
            errors: this.validateBoard(game.board),
            difficulty: game.difficulty,
            playerName: this.getUserName(game.playerID),
            timeElapsed: game.timeElapsed
        };

        const boardImage = await this.createBoardCanvas(canvasData);

        // Format thời gian
        const minutes = Math.floor(game.timeElapsed / 60);
        const seconds = game.timeElapsed % 60;
        const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        await api.sendMessage({
            body: `🎮 SUDOKU - ${this.difficulties[game.difficulty].name.toUpperCase()} 🎮
━━━━━━━━━
👤 Người chơi: ${this.getUserName(game.playerID)}
⏱️ Thời gian: ${timeFormat}

💡 Reply tin nhắn này để tiếp tục chơi`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, info) => {
            if (err) return console.error(err);

            // Xóa file tạm
            fs.unlinkSync(boardImage);

            // Đăng ký reply listener
            global.client.onReply.push({
                name: this.name,
                messageID: info.messageID,
                author: game.playerID,
                threadID: threadID
            });
        });
    },

    // Cung cấp gợi ý
    provideHint: async function (api, event, game) {
        const { threadID, messageID } = event;

        // Tìm một ô trống ngẫu nhiên
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            return api.sendMessage("❌ Không còn ô trống nào để gợi ý!", threadID, messageID);
        }

        // Chọn ngẫu nhiên một ô trống
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;

        // Điền số đúng vào ô
        game.board[row][col] = game.solvedBoard[row][col];

        // Xóa ghi chú tại ô đó
        game.notes[row][col] = [];

        // Tạo tin nhắn gợi ý
        const coord = `${String.fromCharCode(65 + col)}${row + 1}`;

        api.sendMessage(`💡 Gợi ý: Tại ô ${coord} là số ${game.solvedBoard[row][col]}`, threadID, messageID);

        // Cập nhật bảng và kiểm tra hoàn thành
        if (this.isBoardComplete(game.board)) {
            const errors = this.validateBoard(game.board);

            if (errors.length === 0) {
                // Game hoàn thành thành công
                clearInterval(game.interval);
                this.activeGames.delete(threadID);

                // Format thời gian
                const minutes = Math.floor(game.timeElapsed / 60);
                const seconds = game.timeElapsed % 60;
                const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                // Tạo hình ảnh bảng hoàn thành
                const finalCanvasData = {
                    board: game.board,
                    originalBoard: game.originalBoard,
                    selectedCell: null,
                    notes: game.notes,
                    errors: [],
                    difficulty: game.difficulty,
                    playerName: this.getUserName(game.playerID),
                    timeElapsed: game.timeElapsed
                };

                const finalBoardImage = await this.createBoardCanvas(finalCanvasData);

                await api.sendMessage({
                    body: `🎮 SUDOKU - CHIẾN THẮNG! 🎮
━━━━━━━━━
👤 Người chơi: ${this.getUserName(game.playerID)}
⏱️ Thời gian hoàn thành: ${timeFormat}
🏆 Độ khó: ${this.difficulties[game.difficulty].name}

🎉 Chúc mừng! Bạn đã hoàn thành bảng Sudoku!`,
                    attachment: fs.createReadStream(finalBoardImage)
                }, threadID, () => {
                    fs.unlinkSync(finalBoardImage);
                });

                return;
            }
        }

        // Hiển thị bảng đã cập nhật
        return this.updateBoardDisplay(api, threadID, game);
    },

    // Kiểm tra bảng hiện tại
    checkBoard: async function (api, event, game) {
        const { threadID, messageID } = event;

        const errors = this.validateBoard(game.board);

        if (errors.length === 0) {
            if (this.isBoardComplete(game.board)) {
                // Game hoàn thành thành công
                clearInterval(game.interval);
                this.activeGames.delete(threadID);

                // Format thời gian
                const minutes = Math.floor(game.timeElapsed / 60);
                const seconds = game.timeElapsed % 60;
                const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                // Tạo hình ảnh bảng hoàn thành
                const finalCanvasData = {
                    board: game.board,
                    originalBoard: game.originalBoard,
                    selectedCell: null,
                    notes: game.notes,
                    errors: [],
                    difficulty: game.difficulty,
                    playerName: this.getUserName(game.playerID),
                    timeElapsed: game.timeElapsed
                };

                const finalBoardImage = await this.createBoardCanvas(finalCanvasData);

                await api.sendMessage({
                    body: `🎮 SUDOKU - CHIẾN THẮNG! 🎮
━━━━━━━━━━━━
👤 Người chơi: ${this.getUserName(game.playerID)}
⏱️ Thời gian hoàn thành: ${timeFormat}
🏆 Độ khó: ${this.difficulties[game.difficulty].name}

🎉 Chúc mừng! Bạn đã hoàn thành bảng Sudoku!`,
                    attachment: fs.createReadStream(finalBoardImage)
                }, threadID, () => {
                    fs.unlinkSync(finalBoardImage);
                });

                return;
            } else {
                // Bảng đúng nhưng chưa hoàn thành
                api.sendMessage("✅ Bảng Sudoku hiện tại không có lỗi nào, nhưng vẫn chưa hoàn thành!", threadID, messageID);
            }
        } else {
            // Có lỗi trong bảng
            api.sendMessage(`❌ Bảng Sudoku có ${errors.length} lỗi. Hãy kiểm tra lại!`, threadID, messageID);
        }

        // Hiển thị bảng với các lỗi được đánh dấu
        const canvasData = {
            board: game.board,
            originalBoard: game.originalBoard,
            selectedCell: null,
            notes: game.notes,
            errors: errors,
            difficulty: game.difficulty,
            playerName: this.getUserName(game.playerID),
            timeElapsed: game.timeElapsed
        };

        const boardImage = await this.createBoardCanvas(canvasData);

        await api.sendMessage({
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, info) => {
            if (err) return console.error(err);

            // Xóa file tạm
            fs.unlinkSync(boardImage);

            // Đăng ký reply listener
            global.client.onReply.push({
                name: this.name,
                messageID: info.messageID,
                author: game.playerID,
                threadID: threadID
            });
        });
    },

    // Hiển thị đáp án của bảng
    solveBoard: async function (api, event, game) {
        const { threadID } = event;

        // Kết thúc game
        clearInterval(game.interval);
        this.activeGames.delete(threadID);

        // Format thời gian
        const minutes = Math.floor(game.timeElapsed / 60);
        const seconds = game.timeElapsed % 60;
        const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Tạo hình ảnh bảng đáp án
        const canvasData = {
            board: game.solvedBoard,
            originalBoard: game.originalBoard,
            selectedCell: null,
            notes: [],
            errors: [],
            difficulty: game.difficulty,
            playerName: this.getUserName(game.playerID),
            timeElapsed: game.timeElapsed
        };

        const boardImage = await this.createBoardCanvas(canvasData);

        await api.sendMessage({
            body: `🎮 SUDOKU - ĐÁP ÁN 🎮
━━━━━━━━━━━
👤 Người chơi: ${this.getUserName(game.playerID)}
⏱️ Thời gian chơi: ${timeFormat}
🏆 Độ khó: ${this.difficulties[game.difficulty].name}

Dưới đây là đáp án của bảng Sudoku:`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, () => {
            fs.unlinkSync(boardImage);
        });
    }
};