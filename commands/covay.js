const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = {
    name: "covay",
    aliases: ["cờvây", "go"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi cờ vây (Go)",
    usedby: 0,
    usages: "@tag người chơi để bắt đầu, hoặc dùng 'covay size 9/13/19' để chọn kích thước bàn cờ",
    cooldowns: 0,

    activeGames: new Map(),

    defaultBoardSize: 9,
    validBoardSizes: [9, 13, 19],
    cellSize: 30, 

    stone_url_images: {
        'black': 'https://imgur.com/YYBufFK.png',
        'white': 'https://imgur.com/DtxyOxD.png' 
    },

    stone_images: {},
    cached_images: false,

    downloadFont: async function () {
        const https = require('https');
        const fontsDir = path.join(__dirname, '../fonts');

        if (!fs.existsSync(fontsDir)) {
            fs.mkdirSync(fontsDir, { recursive: true });
        }

        const fontPath = path.join(fontsDir, 'NotoSansSC-Regular.ttf');
        const fontUrl = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf';

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(fontPath);
            https.get(fontUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log("✓ Đã tải và lưu font Noto Sans SC thành công");

                    try {
                        registerFont(fontPath, { family: 'Noto Sans SC' });
                        console.log("✓ Đã đăng ký font Noto Sans SC thành công");
                        resolve();
                    } catch (error) {
                        console.error("Lỗi khi đăng ký font:", error);
                        reject(error);
                    }
                });
            }).on('error', (err) => {
                fs.unlink(fontPath, () => { });
                console.error("Lỗi khi tải font:", err);
                reject(err);
            });
        });
    },

    onLoad: function () {
        try {
            const fontPath = path.join(__dirname, '../fonts/NotoSansSC-Regular.ttf');
            if (fs.existsSync(fontPath)) {
                registerFont(fontPath, { family: 'Noto Sans SC' });
                console.log("✓ Đã đăng ký font Noto Sans SC thành công");
            } else {
                console.log("✗ Không tìm thấy font Noto Sans SC. Đang tải về...");
                this.downloadFont();
            }
        } catch (error) {
            console.error("Lỗi khi đăng ký font:", error);
        }

        // Xóa tất cả các game đang chạy khi tải lại module
        for (const [threadID, game] of this.activeGames) {
            if (game.inactivityInterval) {
                clearInterval(game.inactivityInterval);
            }
        }
        this.activeGames.clear();
    },

    async loadStoneImages() {
        if (this.cached_images) return;

        try {
            const stoneTypes = Object.keys(this.stone_url_images);
            const imagePromises = stoneTypes.map(async stoneType => {
                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    );
                    const imagePromise = loadImage(this.stone_url_images[stoneType]);
                    return { stoneType, image: await Promise.race([imagePromise, timeoutPromise]) };
                } catch (err) {
                    console.error(`Failed to load stone ${stoneType}, retrying...`);
                    const image = await loadImage(this.stone_url_images[stoneType]);
                    return { stoneType, image };
                }
            });

            const loadedImages = await Promise.all(imagePromises);
            this.stone_images = loadedImages.reduce((obj, { stoneType, image }) => {
                obj[stoneType] = image;
                return obj;
            }, {});

            this.cached_images = true;
        } catch (error) {
            console.error('Failed to load go stones:', error);
            throw new Error('Không thể tải hình ảnh quân cờ. Vui lòng thử lại sau.');
        }
    },

    async ensureCacheDir() {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    },

    // Vẽ bàn cờ
    async drawBoard(game) {
        try {
            await this.ensureCacheDir();
            await this.loadStoneImages();
            
            const { board, boardSize, lastMove } = game;
            const padding = 40; // Padding quanh bàn cờ
            
            // Kích thước của canvas
            const canvasWidth = (boardSize - 1) * this.cellSize + padding * 2;
            const canvasHeight = (boardSize - 1) * this.cellSize + padding * 2;
            
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
            
            // Vẽ nền
            const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            bgGradient.addColorStop(0, '#E8C078');
            bgGradient.addColorStop(1, '#D4A05B');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Vẽ lưới
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            
            // Vẽ đường ngang
            for (let i = 0; i < boardSize; i++) {
                ctx.beginPath();
                ctx.moveTo(padding, padding + i * this.cellSize);
                ctx.lineTo(padding + (boardSize - 1) * this.cellSize, padding + i * this.cellSize);
                ctx.stroke();
            }
            
            // Vẽ đường dọc
            for (let i = 0; i < boardSize; i++) {
                ctx.beginPath();
                ctx.moveTo(padding + i * this.cellSize, padding);
                ctx.lineTo(padding + i * this.cellSize, padding + (boardSize - 1) * this.cellSize);
                ctx.stroke();
            }
            
            // Vẽ các điểm hoshi (điểm đánh dấu trên bàn cờ)
            this.drawHoshiPoints(ctx, padding, boardSize);
            
            // Vẽ tọa độ
            this.drawCoordinates(ctx, padding, boardSize);
            
            // Vẽ quân cờ
            for (let y = 0; y < boardSize; y++) {
                for (let x = 0; x < boardSize; x++) {
                    const stone = board[y][x];
                    if (stone !== 'empty') {
                        const centerX = padding + x * this.cellSize;
                        const centerY = padding + y * this.cellSize;
                        
                        const stoneImage = this.stone_images[stone];
                        if (stoneImage) {
                            ctx.drawImage(
                                stoneImage,
                                centerX - this.cellSize * 0.45,
                                centerY - this.cellSize * 0.45,
                                this.cellSize * 0.9,
                                this.cellSize * 0.9
                            );
                        }
                    }
                }
            }
            
            // Đánh dấu nước đi cuối cùng
            if (lastMove) {
                const { x, y } = lastMove;
                const centerX = padding + x * this.cellSize;
                const centerY = padding + y * this.cellSize;
                
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Ghi điểm số hiện tại
            this.drawScores(ctx, game, canvasWidth, canvasHeight);
            
            // Lưu và trả về đường dẫn ảnh
            const imagePath = path.join(__dirname, 'cache', `go_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
            
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
            console.error('Error drawing go board:', error);
            throw new Error('Không thể tạo bàn cờ. Vui lòng thử lại.');
        }
    },
    
    // Vẽ các điểm hoshi (điểm đánh dấu) trên bàn cờ
    drawHoshiPoints(ctx, padding, boardSize) {
        const points = [];
        
        // Cho bàn 9x9
        if (boardSize === 9) {
            points.push(
                { x: 2, y: 2 }, { x: 6, y: 2 },
                { x: 4, y: 4 },
                { x: 2, y: 6 }, { x: 6, y: 6 }
            );
        }
        // Cho bàn 13x13
        else if (boardSize === 13) {
            points.push(
                { x: 3, y: 3 }, { x: 9, y: 3 },
                { x: 6, y: 6 },
                { x: 3, y: 9 }, { x: 9, y: 9 }
            );
        }
        // Cho bàn 19x19
        else if (boardSize === 19) {
            points.push(
                { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
                { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
                { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
            );
        }
        
        ctx.fillStyle = '#000000';
        
        points.forEach(point => {
            const centerX = padding + point.x * this.cellSize;
            const centerY = padding + point.y * this.cellSize;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    },
    
    // Vẽ tọa độ trên bàn cờ
    drawCoordinates(ctx, padding, boardSize) {
        // Thiết lập font size lớn hơn và đậm hơn
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#8B4513'; // Màu nâu đậm để nổi bật hơn
        
        // Vẽ số hàng (1-19) - di chuyển gần hơn vào bàn cờ
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < boardSize; i++) {
            ctx.fillText(
                (boardSize - i).toString(),
                padding - 10, // Giảm khoảng cách với bàn cờ
                padding + i * this.cellSize
            );
        }
        
        // Vẽ chữ cột (A-T, bỏ I) - di chuyển gần hơn vào bàn cờ
        const letters = 'ABCDEFGHJKLMNOPQRST';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < boardSize; i++) {
            ctx.fillText(
                letters.charAt(i),
                padding + i * this.cellSize,
                padding + (boardSize - 1) * this.cellSize + 10 // Điều chỉnh vị trí gần hơn
            );
        }
    },
    
    drawScores(ctx, game, canvasWidth, canvasHeight) {
        const { capturedByBlack, capturedByWhite } = game;
        
        // Thiết lập font to và đậm
        ctx.font = 'bold 16px Arial';
        
        // Điểm của người chơi đen - bên trái
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(`⚫ Đen: ${capturedByBlack} quân`, 15, canvasHeight - 15);
        
        // Điểm của người chơi trắng - bên phải
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000000';
        ctx.fillText(`⚪ Trắng: ${capturedByWhite} quân`, canvasWidth - 15, canvasHeight - 15);
    },
    
    // Khởi tạo bàn cờ mới
    initializeBoard(size) {
        const board = [];
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                row.push('empty');
            }
            board.push(row);
        }
        return board;
    },
    
    // Kiểm tra nước đi có hợp lệ không
    isValidMove(game, x, y, color) {
        const { board, boardSize, koPoint, previousBoard } = game;
        
        // Kiểm tra có nằm trong bàn cờ không
        if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
            return false;
        }
        
        // Kiểm tra ô đã có quân chưa
        if (board[y][x] !== 'empty') {
            return false;
        }
        
        // Kiểm tra quy tắc Ko
        if (koPoint && koPoint.x === x && koPoint.y === y) {
            return false;
        }
        
        // Tạo bản sao của bàn cờ để kiểm tra
        const boardCopy = JSON.parse(JSON.stringify(board));
        boardCopy[y][x] = color;
        
        // Kiểm tra tự sát (đặt quân vào vị trí không có khí)
        const group = this.findGroup(boardCopy, x, y);
        const liberties = this.countLiberties(boardCopy, group);
        
        if (liberties === 0) {
            // Kiểm tra xem nếu đặt quân có bắt được quân địch không
            const opponent = color === 'black' ? 'white' : 'black';
            let capturesOpponent = false;
            
            const adjacentPoints = this.getAdjacentPoints(x, y, boardSize);
            
            for (const point of adjacentPoints) {
                if (boardCopy[point.y][point.x] === opponent) {
                    const adjacentGroup = this.findGroup(boardCopy, point.x, point.y);
                    const adjacentLiberties = this.countLiberties(boardCopy, adjacentGroup);
                    
                    if (adjacentLiberties === 0) {
                        capturesOpponent = true;
                        break;
                    }
                }
            }
            
            // Nếu không bắt được quân địch và không có khí thì là nước đi tự sát
            if (!capturesOpponent) {
                return false;
            }
        }
        
        // Kiểm tra Super Ko (không được tạo lại trạng thái bàn cờ trước đó)
        if (previousBoard) {
            const newBoardWithCaptures = this.makeMove(JSON.parse(JSON.stringify(board)), x, y, color);
            const boardsEqual = this.areBoardsEqual(newBoardWithCaptures, previousBoard);
            
            if (boardsEqual) {
                return false;
            }
        }
        
        return true;
    },
    
    // Tìm tất cả các quân cùng màu kết nối với nhau
    findGroup(board, x, y) {
        const color = board[y][x];
        const group = [];
        const visited = new Set();
        const boardSize = board.length;
        
        const findConnected = (x, y) => {
            const key = `${x},${y}`;
            if (visited.has(key)) return;
            
            visited.add(key);
            
            if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return;
            if (board[y][x] !== color) return;
            
            group.push({ x, y });
            
            // Kiểm tra 4 hướng lân cận
            findConnected(x - 1, y);
            findConnected(x + 1, y);
            findConnected(x, y - 1);
            findConnected(x, y + 1);
        };
        
        findConnected(x, y);
        return group;
    },
    
    // Đếm số khí của một nhóm quân
    countLiberties(board, group) {
        const liberties = new Set();
        const boardSize = board.length;
        
        for (const stone of group) {
            const adjacentPoints = this.getAdjacentPoints(stone.x, stone.y, boardSize);
            
            for (const point of adjacentPoints) {
                if (board[point.y][point.x] === 'empty') {
                    liberties.add(`${point.x},${point.y}`);
                }
            }
        }
        
        return liberties.size;
    },
    
    // Lấy các điểm lân cận
    getAdjacentPoints(x, y, boardSize) {
        const points = [];
        
        const directions = [
            { dx: -1, dy: 0 }, // Trái
            { dx: 1, dy: 0 },  // Phải
            { dx: 0, dy: -1 }, // Trên
            { dx: 0, dy: 1 }   // Dưới
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
                points.push({ x: newX, y: newY });
            }
        }
        
        return points;
    },
    
    // Kiểm tra hai bàn cờ có trạng thái giống nhau không
    areBoardsEqual(board1, board2) {
        if (!board1 || !board2) return false;
        
        for (let y = 0; y < board1.length; y++) {
            for (let x = 0; x < board1[y].length; x++) {
                if (board1[y][x] !== board2[y][x]) {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    // Tính điểm khi kết thúc ván cờ
    calculateScore(board) {
        const boardSize = board.length;
        const visited = Array(boardSize).fill().map(() => Array(boardSize).fill(false));
        
        let blackTerritory = 0;
        let whiteTerritory = 0;
        let blackStones = 0;
        let whiteStones = 0;
        
        // Đếm số quân trên bàn cờ
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (board[y][x] === 'black') {
                    blackStones++;
                } else if (board[y][x] === 'white') {
                    whiteStones++;
                }
            }
        }
        
        // Tìm các vùng lãnh thổ
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                if (visited[y][x] || board[y][x] !== 'empty') continue;
                
                const territory = [];
                const surroundingColors = new Set();
                
                // Hàm đệ quy tìm tất cả các ô trống kết nối
                const findTerritory = (x, y) => {
                    if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return;
                    if (visited[y][x]) return;
                    
                    visited[y][x] = true;
                    
                    if (board[y][x] === 'empty') {
                        territory.push({ x, y });
                        
                        // Kiểm tra 4 hướng
                        findTerritory(x - 1, y);
                        findTerritory(x + 1, y);
                        findTerritory(x, y - 1);
                        findTerritory(x, y + 1);
                    } else {
                        // Ghi nhận màu quân xung quanh
                        surroundingColors.add(board[y][x]);
                    }
                };
                
                findTerritory(x, y);
                
                // Nếu chỉ có một màu xung quanh vùng lãnh thổ, màu đó sở hữu nó
                if (surroundingColors.size === 1) {
                    const owner = surroundingColors.values().next().value;
                    
                    if (owner === 'black') {
                        blackTerritory += territory.length;
                    } else if (owner === 'white') {
                        whiteTerritory += territory.length;
                    }
                }
            }
        }
        
        return {
            blackTerritory,
            whiteTerritory,
            blackStones,
            whiteStones
        };
    },
    
    // Thực hiện nước đi và bắt quân
    makeMove(board, x, y, color) {
        // Đặt quân mới
        board[y][x] = color;
        const boardSize = board.length;
        const opponent = color === 'black' ? 'white' : 'black';
        let captured = [];
        
        // Kiểm tra bắt quân đối phương
        const adjacentPoints = this.getAdjacentPoints(x, y, boardSize);
        
        for (const point of adjacentPoints) {
            if (board[point.y][point.x] === opponent) {
                const group = this.findGroup(board, point.x, point.y);
                const liberties = this.countLiberties(board, group);
                
                // Nếu nhóm quân không còn khí thì bị bắt
                if (liberties === 0) {
                    captured = captured.concat(group);
                    
                    // Xóa các quân bị bắt
                    for (const stone of group) {
                        board[stone.y][stone.x] = 'empty';
                    }
                }
            }
        }
        
        return { board, captured };
    },
    
    // Kiểm tra Ko (tránh lặp lại trạng thái của bàn cờ)
    checkForKo(game, x, y, color, capturedStones) {
        // Chỉ có thể xảy ra ko khi bắt đúng 1 quân
        if (capturedStones.length !== 1) {
            return null;
        }
        
        const capturedStone = capturedStones[0];
        const { board, boardSize } = game;
        
        // Kiểm tra xem vị trí mới đặt có chỉ còn 1 khí không và có bị bao vây bởi quân đối phương không
        const adjacentOpponentCount = this.getAdjacentPoints(x, y, boardSize).filter(p => 
            board[p.y][p.x] === (color === 'black' ? 'white' : 'black')
        ).length;
        
        // Nếu quân mới đặt có đúng 3 quân đối phương xung quanh (vì 1 vị trí đã bị bắt)
        // và vị trí bị bắt là khí duy nhất của quân mới đặt, thì đó là điểm Ko
        if (adjacentOpponentCount === 3) {
            const group = this.findGroup(board, x, y);
            const liberties = this.countLiberties(board, group);
            
            if (liberties === 1) {
                // Vị trí của quân vừa bị bắt là điểm Ko
                return { x: capturedStone.x, y: capturedStone.y };
            }
        }
        
        return null;
    },
    
    // Phân tích tọa độ từ người dùng (A1, B3, C19, ...)
    parseCoordinate(input, boardSize) {
        if (!input || input.length < 2 || input.length > 3) return null;
        
        // Lấy chữ cái đầu tiên (A-T, ngoại trừ I)
        const colChar = input.charAt(0).toUpperCase();
        if (colChar < 'A' || colChar > 'T' || colChar === 'I') return null;
        
        // Lấy số (1-19)
        const rowNum = parseInt(input.substring(1));
        if (isNaN(rowNum) || rowNum < 1 || rowNum > boardSize) return null;
        
        // Chuyển đổi sang tọa độ mảng
        let col = colChar.charCodeAt(0) - 65; // A=0, B=1, ...
        if (colChar > 'I') col--; // Điều chỉnh vì bỏ qua chữ I
        const row = boardSize - rowNum; // Đảo ngược vì tọa độ 1 bắt đầu từ dưới lên
        
        return { x: col, y: row };
    },
    
    // Chuyển đổi từ tọa độ mảng sang tọa độ người chơi (A1, B3, ...)
    formatCoordinate(x, y, boardSize) {
        let colChar = String.fromCharCode(65 + x); // A, B, C, ...
        if (colChar >= 'I') colChar = String.fromCharCode(colChar.charCodeAt(0) + 1); // Bỏ qua chữ I
        const rowNum = boardSize - y;
        
        return `${colChar}${rowNum}`;
    },
    
    getUserName: function (userID) {
        const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
        try {
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
            return userData[userID]?.name || "Người dùng";
        } catch (error) {
            console.error("Error reading userData:", error);
            return "Người dùng";
        }
    },

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, senderID, messageID } = event;
        
        // Xử lý lệnh size nếu có
        if (target[0]?.toLowerCase() === 'size') {
            const requestedSize = parseInt(target[1]);
            if (this.validBoardSizes.includes(requestedSize)) {
                return api.sendMessage(`✅ Đã đặt kích thước bàn cờ tiếp theo là ${requestedSize}x${requestedSize}. Gõ lệnh /covay @tag để bắt đầu trò chơi.`, threadID, messageID);
            } else {
                return api.sendMessage(`❌ Kích thước không hợp lệ. Vui lòng chọn kích thước từ: ${this.validBoardSizes.join(', ')}`, threadID, messageID);
            }
        }
        
        // Kiểm tra đã có game trong nhóm chưa
        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Nhóm này đang có ván cờ vây đang diễn ra. Vui lòng đợi ván hiện tại kết thúc!", threadID, messageID);
        }
        
        // Kiểm tra tag người chơi
        if (Object.keys(event.mentions).length !== 1) {
            return api.sendMessage("⚠️ Vui lòng tag một người để bắt đầu ván cờ vây!", threadID, messageID);
        }
        
        const opponent = Object.keys(event.mentions)[0];
        
        if (opponent === senderID) {
            return api.sendMessage("❌ Bạn không thể chơi với chính mình!", threadID, messageID);
        }
        
        // Khởi tạo bàn cờ
        const boardSize = this.defaultBoardSize;
        const board = this.initializeBoard(boardSize);
        
        // Lưu thông tin game
        const gameState = {
            board: board,
            boardSize: boardSize,
            players: {
                black: senderID,     // Người chơi quân đen (đi trước)
                white: opponent     // Người chơi quân trắng
            },
            currentPlayer: 'black',  // Lượt đi đầu tiên thuộc về quân đen
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            lastMove: null,
            koPoint: null,
            previousBoard: null,
            capturedByBlack: 0,
            capturedByWhite: 0,
            moveHistory: [],
            inactivityInterval: null,
            passes: 0,                // Số lần pass liên tiếp (2 lần = kết thúc ván)
            status: 'active'          // active, finished
        };
        
        // Tự động kết thúc nếu không tương tác
        gameState.inactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - gameState.lastMoveTime;
            
            if (idleTime >= 5 * 60 * 1000) { // 5 phút
                clearInterval(gameState.inactivityInterval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Ván cờ vây đã bị hủy do không có nước đi nào trong 5 phút!", threadID);
            }
        }, 30000);
        
        this.activeGames.set(threadID, gameState);
        
        // Tên người chơi
        const blackPlayerName = this.getUserName(senderID);
        const whitePlayerName = this.getUserName(opponent);
        
        // Vẽ bàn cờ
        const boardImage = await this.drawBoard(gameState);
        
        await api.sendMessage({
            body: `🎮 Ván cờ vây ${boardSize}x${boardSize} bắt đầu!\n` +
                  `⚫ Quân Đen: ${blackPlayerName} (đi trước)\n` +
                  `⚪ Quân Trắng: ${whitePlayerName}\n\n` +
                  `📝 Cách chơi:\n` +
                  `▪️ Reply với nước đi: A1, B2, C3...\n` +
                  `▪️ Reply với "pass" để bỏ lượt\n` +
                  `▪️ Reply với "resign" để đầu hàng\n\n` +
                  `⏱️ Lượt của: ${blackPlayerName} (Đen)`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) return console.error(err);
            fs.unlinkSync(boardImage);
            
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID, // Người chơi quân đen đi trước
                threadID: threadID
            });
        });
    },

    onReply: async function ({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const game = this.activeGames.get(threadID);
        
        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván cờ vây!", threadID, messageID);
        }
        
        const currentPlayerId = game.players[game.currentPlayer];
        
        if (senderID !== currentPlayerId) {
            return api.sendMessage("❌ Chưa đến lượt của bạn!", threadID, messageID);
        }
        
        if (game.status === 'finished') {
            return api.sendMessage("❌ Ván cờ đã kết thúc!", threadID, messageID);
        }
        
        const move = body.trim().toLowerCase();
        
        // Xử lý khi người chơi pass (bỏ lượt)
        if (move === 'pass') {
            game.passes++;
            game.lastMoveTime = Date.now();
            game.moveHistory.push({
                player: game.currentPlayer,
                move: 'pass'
            });
            
            // Kiểm tra hai người chơi đều pass => kết thúc ván cờ
            if (game.passes >= 2) {
                clearInterval(game.inactivityInterval);
                game.status = 'finished';
                
                // Tính điểm
                const scores = this.calculateScore(game.board);
                const finalBlackScore = scores.blackTerritory + scores.blackStones + game.capturedByBlack;
                const finalWhiteScore = scores.whiteTerritory + scores.whiteStones + game.capturedByWhite;
                
                const blackPlayerName = this.getUserName(game.players.black);
                const whitePlayerName = this.getUserName(game.players.white);
                
                const boardImage = await this.drawBoard(game);
                
                const resultMessage = `🏁 VÁN CỜ VÂY KẾT THÚC!\n\n` +
                    `⚫ ${blackPlayerName}: ${finalBlackScore} điểm\n` +
                    `   (${scores.blackStones} quân + ${scores.blackTerritory} lãnh thổ + ${game.capturedByBlack} quân bắt)\n\n` +
                    `⚪ ${whitePlayerName}: ${finalWhiteScore} điểm\n` +
                    `   (${scores.whiteStones} quân + ${scores.whiteTerritory} lãnh thổ + ${game.capturedByWhite} quân bắt)\n\n` +
                    `🏆 Người chiến thắng: ${finalBlackScore > finalWhiteScore ? blackPlayerName : (finalBlackScore < finalWhiteScore ? whitePlayerName : "Hòa!")}`;
                
                await api.sendMessage({
                    body: resultMessage,
                    attachment: fs.createReadStream(boardImage)
                }, threadID, (err) => {
                    if (err) return console.error(err);
                    fs.unlinkSync(boardImage);
                    this.activeGames.delete(threadID);
                });
                
                return;
            }
            
            // Chuyển lượt nếu chỉ có một người pass
            const nextPlayer = game.currentPlayer === 'black' ? 'white' : 'black';
            game.currentPlayer = nextPlayer;
            
            const nextPlayerName = this.getUserName(game.players[nextPlayer]);
            
            // Vẽ lại bàn cờ
            const boardImage = await this.drawBoard(game);
            
            await api.sendMessage({
                body: `🎮 ${this.getUserName(senderID)} (${game.currentPlayer === 'white' ? 'Đen' : 'Trắng'}) đã bỏ lượt (pass)\n` +
                      `⏱️ Lượt tiếp theo: ${nextPlayerName} (${nextPlayer === 'black' ? 'Đen' : 'Trắng'})`,
                attachment: fs.createReadStream(boardImage)
            }, threadID, (err, msg) => {
                if (err) return console.error(err);
                fs.unlinkSync(boardImage);
                
                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: game.players[nextPlayer],
                    threadID: threadID
                });
            });
            
            return;
        }
        
        // Xử lý khi người chơi đầu hàng
        if (move === 'resign') {
            clearInterval(game.inactivityInterval);
            game.status = 'finished';
            
            const winner = game.currentPlayer === 'black' ? 'white' : 'black';
            const winnerName = this.getUserName(game.players[winner]);
            const loserName = this.getUserName(senderID);
            
            const boardImage = await this.drawBoard(game);
            
            await api.sendMessage({
                body: `🏳️ ${loserName} (${game.currentPlayer === 'black' ? 'Đen' : 'Trắng'}) đã đầu hàng!\n\n` +
                      `🏆 Người chiến thắng: ${winnerName} (${winner === 'black' ? 'Đen' : 'Trắng'})`,
                attachment: fs.createReadStream(boardImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(boardImage);
                this.activeGames.delete(threadID);
            });
            
            return;
        }
        
        // Đặt quân
        const coord = this.parseCoordinate(move, game.boardSize);
        
        if (!coord) {
            return api.sendMessage(`❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: A1, B2, C3... hoặc "pass" để bỏ lượt, "resign" để đầu hàng.`, threadID, messageID);
        }
        
        const { x, y } = coord;
        const currentColor = game.currentPlayer;
        
        // Kiểm tra nước đi có hợp lệ không
        if (!this.isValidMove(game, x, y, currentColor)) {
            return api.sendMessage(`❌ Nước đi không hợp lệ! Vui lòng kiểm tra lại.`, threadID, messageID);
        }
        
        // Lưu bàn cờ trước khi đi
        game.previousBoard = JSON.parse(JSON.stringify(game.board));
        
        // Thực hiện nước đi và bắt quân
        const moveResult = this.makeMove(JSON.parse(JSON.stringify(game.board)), x, y, currentColor);
        game.board = moveResult.board;
        
        // Cập nhật số quân bị bắt
        if (moveResult.captured.length > 0) {
            if (currentColor === 'black') {
                game.capturedByBlack += moveResult.captured.length;
            } else {
                game.capturedByWhite += moveResult.captured.length;
            }
            
            // Kiểm tra Ko
            const koPoint = this.checkForKo(game, x, y, currentColor, moveResult.captured);
            game.koPoint = koPoint;
        } else {
            game.koPoint = null;
        }
        
        // Reset số lần pass
        game.passes = 0;
        
        // Lưu nước đi cuối
        game.lastMove = { x, y };
        game.lastMoveTime = Date.now();
        game.moveHistory.push({
            player: game.currentPlayer,
            move: this.formatCoordinate(x, y, game.boardSize),
            captured: moveResult.captured.length
        });
        
        // Chuyển lượt
        const nextPlayer = currentColor === 'black' ? 'white' : 'black';
        game.currentPlayer = nextPlayer;
        
        // Tên người chơi
        const currentPlayerName = this.getUserName(senderID);
        const nextPlayerName = this.getUserName(game.players[nextPlayer]);
        
        // Tính thời gian chơi
        const gameTimeSeconds = Math.floor((Date.now() - game.startTime) / 1000);
        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = gameTimeSeconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Vẽ bàn cờ mới
        const boardImage = await this.drawBoard(game);
        
        const captureInfo = moveResult.captured.length > 0 
            ? `\n📌 Đã bắt được ${moveResult.captured.length} quân ${nextPlayer === 'black' ? 'trắng' : 'đen'}`
            : '';
        
        await api.sendMessage({
            body: `🎮 Cờ Vây - Nước đi: ${this.formatCoordinate(x, y, game.boardSize)}\n` +
                  `⏱️ Thời gian: ${timeString}\n` +
                  `🎯 ${currentPlayerName} (${currentColor === 'black' ? 'Đen' : 'Trắng'}): ${this.formatCoordinate(x, y, game.boardSize)}${captureInfo}\n\n` +
                  `⏳ Lượt tiếp theo: ${nextPlayerName} (${nextPlayer === 'black' ? 'Đen' : 'Trắng'})`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) return console.error(err);
            fs.unlinkSync(boardImage);
            
            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: game.players[nextPlayer],
                threadID: threadID
            });
        });
    }
};