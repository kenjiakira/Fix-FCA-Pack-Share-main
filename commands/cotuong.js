const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { getUserName } = require('../utils/userUtils');

module.exports = {
    name: "cotuong",
    aliases: ["cờtướng", "xiangqi"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi cờ tướng (xiangqi)",
    usedby: 0,
    usages: "@tag người chơi để bắt đầu ván cờ",
    cooldowns: 0,

    activeGames: new Map(),

    // Ảnh quân cờ từ Imgur
    piece_url_images: {
        // Quân đỏ
        'r_general': 'https://imgur.com/Rppcebf.png',      // Tướng (đỏ)
        'r_advisor': 'https://imgur.com/Apbvg8t.png',      // Sĩ (đỏ)
        'r_elephant': 'https://imgur.com/q6ebqu6.png',     // Tượng (đỏ)
        'r_horse': 'https://imgur.com/ev87LKU.png',        // Mã (đỏ)
        'r_chariot': 'https://imgur.com/NW2Ko18.png',      // Xe (đỏ)
        'r_cannon': 'https://imgur.com/4L1bmjw.png',       // Pháo (đỏ)
        'r_soldier': 'https://imgur.com/uFX4QGH.png',      // Tốt (đỏ)

        // Quân đen
        'b_general': 'https://imgur.com/kz2z18c.png',      // Tướng (đen)
        'b_advisor': 'https://imgur.com/smqMXUg.png',      // Sĩ (đen)
        'b_elephant': 'https://imgur.com/mrL0foR.png',     // Tượng (đen)
        'b_horse': 'https://imgur.com/EsSF6LV.png',        // Mã (đen)
        'b_chariot': 'https://imgur.com/Mg0e2Gw.png',      // Xe (đen)
        'b_cannon': 'https://imgur.com/yn8Sqq1.png',       // Pháo (đen)
        'b_soldier': 'https://imgur.com/hWStlvo.png'       // Tốt (đen)
    },

    piece_images: {},
    cached_images: false,

    // Bàn cờ khởi tạo
    initialBoard: [
        ['b_chariot', 'b_horse', 'b_elephant', 'b_advisor', 'b_general', 'b_advisor', 'b_elephant', 'b_horse', 'b_chariot'],
        [null, null, null, null, null, null, null, null, null],
        [null, 'b_cannon', null, null, null, null, null, 'b_cannon', null],
        ['b_soldier', null, 'b_soldier', null, 'b_soldier', null, 'b_soldier', null, 'b_soldier'],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        ['r_soldier', null, 'r_soldier', null, 'r_soldier', null, 'r_soldier', null, 'r_soldier'],
        [null, 'r_cannon', null, null, null, null, null, 'r_cannon', null],
        [null, null, null, null, null, null, null, null, null],
        ['r_chariot', 'r_horse', 'r_elephant', 'r_advisor', 'r_general', 'r_advisor', 'r_elephant', 'r_horse', 'r_chariot']
    ],

    // Kích thước bàn cờ
    boardWidth: 9,  // 9 cột
    boardHeight: 10, // 10 hàng
    cellSize: 50,   // Kích thước mỗi ô
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

        for (const [threadID, game] of this.activeGames) {
            if (game.checkInactivityInterval) {
                clearInterval(game.checkInactivityInterval);
            }
        }
        this.activeGames.clear();
    },
    async loadPieceImages() {
        if (this.cached_images) return;

        try {
            const pieceTypes = Object.keys(this.piece_url_images);
            const imagePromises = pieceTypes.map(async pieceType => {
                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    );
                    const imagePromise = loadImage(this.piece_url_images[pieceType]);
                    return { pieceType, image: await Promise.race([imagePromise, timeoutPromise]) };
                } catch (err) {
                    console.error(`Failed to load piece ${pieceType}, retrying...`);
                    const image = await loadImage(this.piece_url_images[pieceType]);
                    return { pieceType, image };
                }
            });

            const loadedImages = await Promise.all(imagePromises);
            this.piece_images = loadedImages.reduce((obj, { pieceType, image }) => {
                obj[pieceType] = image;
                return obj;
            }, {});

            this.cached_images = true;
        } catch (error) {
            console.error('Failed to load xiangqi pieces:', error);
            throw new Error('Không thể tải hình ảnh quân cờ. Vui lòng thử lại sau.');
        }
    },

    async ensureCacheDir() {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    },

    async drawBoard(boardState, lastMove = null) {
        try {
            await this.ensureCacheDir();
            await this.loadPieceImages();
    
            const padding = 40; // Tăng padding để tạo thêm không gian
            // Fix for extra grid lines - subtract 1 from width and height
            const canvasWidth = (this.boardWidth - 1) * this.cellSize + padding * 2;
            const canvasHeight = (this.boardHeight - 1) * this.cellSize + padding * 2;
    
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
    
            // Vẽ nền
            const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            bgGradient.addColorStop(0, '#f0d9b5');
            bgGradient.addColorStop(1, '#e6ccab');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
            // Vẽ viền bàn cờ
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 5; // Tăng độ dày lên 5
            ctx.strokeRect(
                padding - 5,
                padding - 5,
                (this.boardWidth - 1) * this.cellSize + 10,
                (this.boardHeight - 1) * this.cellSize + 10
            );
    
            // Vẽ lưới ngang - FIX: chỉ vẽ đến boardHeight - 1
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.boardHeight; i++) {
                ctx.beginPath();
                ctx.moveTo(padding, padding + i * this.cellSize);
                ctx.lineTo(padding + (this.boardWidth - 1) * this.cellSize, padding + i * this.cellSize);
                ctx.stroke();
            }
    
            // Vẽ lưới dọc - FIX: chỉ vẽ đến boardWidth - 1
            for (let i = 0; i < this.boardWidth; i++) {
                ctx.beginPath();
                ctx.moveTo(padding + i * this.cellSize, padding);
                ctx.lineTo(padding + i * this.cellSize, padding + (this.boardHeight - 1) * this.cellSize);
                ctx.stroke();
            }
    
            // Vẽ sông (Sông Thiên Hà)
            ctx.fillStyle = 'rgba(135, 206, 250, 0.2)';  // Light blue with transparency
            ctx.fillRect(
                padding,
                padding + 4 * this.cellSize,
                (this.boardWidth - 1) * this.cellSize,
                this.cellSize
            );
    
            // Add a border to the river
            ctx.strokeStyle = 'rgba(70, 130, 180, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                padding,
                padding + 4 * this.cellSize,
                (this.boardWidth - 1) * this.cellSize,
                this.cellSize
            );
    
            // Enhance river text
            ctx.font = 'bold 18px "Noto Sans SC", "Microsoft YaHei", "SimHei", Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Darker text for better contrast
            ctx.textAlign = 'center';
            ctx.fillText('楚 河', padding + 2 * this.cellSize, padding + 4.5 * this.cellSize + 6);
            ctx.fillText('漢 界', padding + 7 * this.cellSize, padding + 4.5 * this.cellSize + 6);
            // Vẽ cung - không thay đổi vì vị trí cung vẫn đúng
            // Cung phía trên (đen)
            this.drawPalace(ctx, padding, padding, 3, 2);
            // Cung phía dưới (đỏ)
            this.drawPalace(ctx, padding, padding + 7 * this.cellSize, 3, 2);
    
            // Vẽ chữ X cho điểm máy chốt
            this.drawPointMarks(ctx, padding);
    
            // Vẽ tọa độ
            ctx.font = '14px Arial';
            ctx.fillStyle = '#8b4513';
            ctx.textAlign = 'center';
    
            // Vẽ số hàng (1-10) - điều chỉnh vị trí hiển thị
            for (let i = 0; i < this.boardHeight; i++) {
                ctx.fillText(
                    (10 - i).toString(),
                    padding / 2 - 10, // Dịch qua trái 5px
                    padding + i * this.cellSize + 5
                );
            }
    
            // Vẽ chữ cột (A-I) - điều chỉnh vị trí hiển thị
            for (let i = 0; i < this.boardWidth; i++) {
                ctx.fillText(
                    String.fromCharCode(65 + i),
                    padding + i * this.cellSize,
                    padding + (this.boardHeight - 1) * this.cellSize + 30 // Dịch xuống 10px
                );
            }
    
            // Vẽ các quân cờ - đặt đúng vị trí tại giao điểm lưới
            for (let y = 0; y < this.boardHeight; y++) {
                for (let x = 0; x < this.boardWidth; x++) {
                    const piece = boardState[y][x];
                    if (piece) {
                        const pieceImage = this.piece_images[piece];
                        if (pieceImage) {
                            const centerX = padding + x * this.cellSize;
                            const centerY = padding + y * this.cellSize;
    
                            // Vẽ nền tròn cho quân cờ
                            ctx.fillStyle = '#f0d9b5';
                            ctx.beginPath();
                            ctx.arc(centerX, centerY, this.cellSize * 0.4, 0, Math.PI * 2);
                            ctx.fill();
    
                            // Vẽ viền cho quân cờ
                            ctx.strokeStyle = piece.startsWith('r_') ? '#a52a2a' : '#000';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.arc(centerX, centerY, this.cellSize * 0.4, 0, Math.PI * 2);
                            ctx.stroke();
    
                            // Vẽ quân cờ
                            ctx.drawImage(
                                pieceImage,
                                centerX - this.cellSize * 0.35,
                                centerY - this.cellSize * 0.35,
                                this.cellSize * 0.7,
                                this.cellSize * 0.7
                            );
                        }
                    }
                }
            }
    
            // Đánh dấu nước đi cuối cùng
            if (lastMove) {
                const { fromX, fromY, toX, toY } = lastMove;
    
                // Vẽ ô nguồn
                ctx.strokeStyle = 'rgba(50, 205, 50, 0.7)';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    padding + fromX * this.cellSize - this.cellSize * 0.4,
                    padding + fromY * this.cellSize - this.cellSize * 0.4,
                    this.cellSize * 0.8,
                    this.cellSize * 0.8
                );
    
                // Vẽ ô đích
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    padding + toX * this.cellSize - this.cellSize * 0.4,
                    padding + toY * this.cellSize - this.cellSize * 0.4,
                    this.cellSize * 0.8,
                    this.cellSize * 0.8
                );
            }
    
            // Lưu và trả về đường dẫn ảnh
            const imagePath = path.join(__dirname, 'cache', `xiangqi_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
    
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
            console.error('Error drawing xiangqi board:', error);
            throw new Error('Không thể tạo bàn cờ. Vui lòng thử lại.');
        }
    },

    // Vẽ cung (3x3) cho tướng
    drawPalace(ctx, baseX, baseY, width, height) {
        // Vẽ đường chéo từ góc trái trên đến góc phải dưới
        ctx.beginPath();
        ctx.moveTo(baseX + 3 * this.cellSize, baseY);
        ctx.lineTo(baseX + 5 * this.cellSize, baseY + 2 * this.cellSize);
        ctx.stroke();

        // Vẽ đường chéo từ góc phải trên đến góc trái dưới
        ctx.beginPath();
        ctx.moveTo(baseX + 5 * this.cellSize, baseY);
        ctx.lineTo(baseX + 3 * this.cellSize, baseY + 2 * this.cellSize);
        ctx.stroke();
    },

    // Vẽ điểm mày chốt (điểm X)
    drawPointMarks(ctx, padding) {
        const points = [
            // Điểm máy chốt quân đen
            { x: 1, y: 2 }, { x: 7, y: 2 },
            { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 },

            // Điểm máy chốt quân đỏ
            { x: 1, y: 7 }, { x: 7, y: 7 },
            { x: 0, y: 6 }, { x: 2, y: 6 }, { x: 4, y: 6 }, { x: 6, y: 6 }, { x: 8, y: 6 }
        ];

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        points.forEach(point => {
            const centerX = padding + point.x * this.cellSize;
            const centerY = padding + point.y * this.cellSize;
            const size = 5;

            // Vẽ chéo góc trái trên - phải dưới
            ctx.beginPath();
            ctx.moveTo(centerX - size, centerY - size);
            ctx.lineTo(centerX + size, centerY + size);
            ctx.stroke();

            // Vẽ chéo góc phải trên - trái dưới
            ctx.beginPath();
            ctx.moveTo(centerX + size, centerY - size);
            ctx.lineTo(centerX - size, centerY + size);
            ctx.stroke();
        });
    },

    // Kiểm tra nước đi hợp lệ
    isValidMove(boardState, fromX, fromY, toX, toY, currentPlayer) {
        const piece = boardState[fromY][fromX];

        // Kiểm tra quân cờ có tồn tại không
        if (!piece) return false;

        // Kiểm tra lượt chơi
        const pieceColor = piece.charAt(0);
        if ((currentPlayer === 'red' && pieceColor !== 'r') ||
            (currentPlayer === 'black' && pieceColor !== 'b')) {
            return false;
        }

        // Kiểm tra đích đến không được có quân cùng màu
        const targetPiece = boardState[toY][toX];
        if (targetPiece && targetPiece.charAt(0) === pieceColor) {
            return false;
        }

        // Phân tích loại quân
        const pieceType = piece.substring(2);

        switch (pieceType) {
            case 'general':
                return this.isValidGeneralMove(boardState, fromX, fromY, toX, toY);
            case 'advisor':
                return this.isValidAdvisorMove(boardState, fromX, fromY, toX, toY, pieceColor);
            case 'elephant':
                return this.isValidElephantMove(boardState, fromX, fromY, toX, toY, pieceColor);
            case 'horse':
                return this.isValidHorseMove(boardState, fromX, fromY, toX, toY);
            case 'chariot':
                return this.isValidChariotMove(boardState, fromX, fromY, toX, toY);
            case 'cannon':
                return this.isValidCannonMove(boardState, fromX, fromY, toX, toY);
            case 'soldier':
                return this.isValidSoldierMove(boardState, fromX, fromY, toX, toY, pieceColor);
            default:
                return false;
        }
    },

    // Luật di chuyển cho Tướng
    isValidGeneralMove(boardState, fromX, fromY, toX, toY) {
        // Tướng chỉ di chuyển 1 ô theo chiều ngang hoặc dọc
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
            return false;
        }

        // Kiểm tra tướng có nằm trong cung không
        // Tướng đỏ (y = 7-9, x = 3-5)
        if (boardState[fromY][fromX].startsWith('r_')) {
            return (toX >= 3 && toX <= 5 && toY >= 7 && toY <= 9);
        }
        // Tướng đen (y = 0-2, x = 3-5)
        else {
            return (toX >= 3 && toX <= 5 && toY >= 0 && toY <= 2);
        }
    },

    // Luật di chuyển cho Sĩ (Advisor)
    isValidAdvisorMove(boardState, fromX, fromY, toX, toY, pieceColor) {
        // Sĩ chỉ di chuyển 1 ô theo đường chéo
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        if (dx !== 1 || dy !== 1) {
            return false;
        }

        // Kiểm tra sĩ có nằm trong cung không
        // Sĩ đỏ (y = 7-9, x = 3-5)
        if (pieceColor === 'r') {
            return (toX >= 3 && toX <= 5 && toY >= 7 && toY <= 9);
        }
        // Sĩ đen (y = 0-2, x = 3-5)
        else {
            return (toX >= 3 && toX <= 5 && toY >= 0 && toY <= 2);
        }
    },

    // Luật di chuyển cho Tượng (Elephant)
    isValidElephantMove(boardState, fromX, fromY, toX, toY, pieceColor) {
        // Tượng di chuyển 2 ô theo đường chéo
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        if (dx !== 2 || dy !== 2) {
            return false;
        }

        // Kiểm tra có bị chặn ở giữa đường đi không
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;

        if (boardState[midY][midX]) {
            return false;
        }

        // Tượng không được qua sông
        // Tượng đỏ (y = 5-9)
        if (pieceColor === 'r') {
            return (toY >= 5);
        }
        // Tượng đen (y = 0-4)
        else {
            return (toY <= 4);
        }
    },

    // Luật di chuyển cho Mã (Horse)
    isValidHorseMove(boardState, fromX, fromY, toX, toY) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        // Mã di chuyển theo kiểu "một ngang hai dọc" hoặc "một dọc hai ngang"
        if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) {
            return false;
        }

        // Kiểm tra mã có bị kẹt chân không
        let midX, midY;

        if (dx === 1) {
            // Di chuyển một ngang hai dọc
            midX = fromX;
            midY = fromY + (toY > fromY ? 1 : -1);
        } else {
            // Di chuyển một dọc hai ngang
            midX = fromX + (toX > fromX ? 1 : -1);
            midY = fromY;
        }

        return !boardState[midY][midX]; // Không có quân cản đường
    },

    // Luật di chuyển cho Xe (Chariot)
    isValidChariotMove(boardState, fromX, fromY, toX, toY) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        // Xe di chuyển theo hàng ngang hoặc dọc
        if (dx !== 0 && dy !== 0) {
            return false;
        }

        // Kiểm tra xem có quân nào chặn đường không
        let startX = Math.min(fromX, toX);
        let endX = Math.max(fromX, toX);
        let startY = Math.min(fromY, toY);
        let endY = Math.max(fromY, toY);

        if (dx === 0) {
            // Di chuyển theo chiều dọc
            for (let y = startY + 1; y < endY; y++) {
                if (boardState[y][fromX]) {
                    return false;
                }
            }
        } else {
            // Di chuyển theo chiều ngang
            for (let x = startX + 1; x < endX; x++) {
                if (boardState[fromY][x]) {
                    return false;
                }
            }
        }

        return true;
    },

    // Luật di chuyển cho Pháo (Cannon)
    isValidCannonMove(boardState, fromX, fromY, toX, toY) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        // Pháo di chuyển theo hàng ngang hoặc dọc
        if (dx !== 0 && dy !== 0) {
            return false;
        }

        // Đếm số quân cờ trên đường đi
        let pieceCount = 0;
        let startX = Math.min(fromX, toX);
        let endX = Math.max(fromX, toX);
        let startY = Math.min(fromY, toY);
        let endY = Math.max(fromY, toY);

        if (dx === 0) {
            // Di chuyển theo chiều dọc
            for (let y = startY + 1; y < endY; y++) {
                if (boardState[y][fromX]) {
                    pieceCount++;
                }
            }
        } else {
            // Di chuyển theo chiều ngang
            for (let x = startX + 1; x < endX; x++) {
                if (boardState[fromY][x]) {
                    pieceCount++;
                }
            }
        }

        // Pháo khi di chuyển không có quân cản, khi ăn quân phải có đúng 1 quân làm bàn đạp
        const targetPiece = boardState[toY][toX];

        if (targetPiece) {
            // Đang ăn quân, cần có đúng 1 quân làm bàn đạp
            return pieceCount === 1;
        } else {
            // Đang di chuyển, không được có quân cản
            return pieceCount === 0;
        }
    },

    // Luật di chuyển cho Tốt (Soldier)
    isValidSoldierMove(boardState, fromX, fromY, toX, toY, pieceColor) {
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);

        // Tốt chỉ di chuyển 1 ô mỗi lần
        if (dx + dy !== 1) {
            return false;
        }

        if (pieceColor === 'r') {
            // Tốt đỏ: luôn đi lên (giảm y) hoặc ngang (khi đã qua sông)
            if (toY > fromY) {
                return false; // Không được đi lùi
            }

            if (dx === 1) {
                // Đi ngang, phải đã qua sông (y < 5)
                return fromY < 5;
            }
        } else {
            // Tốt đen: luôn đi xuống (tăng y) hoặc ngang (khi đã qua sông)
            if (toY < fromY) {
                return false; // Không được đi lùi
            }

            if (dx === 1) {
                // Đi ngang, phải đã qua sông (y > 4)
                return fromY > 4;
            }
        }

        return true;
    },

    // Kiểm tra tình trạng tướng mặt nhau
    checkGeneralsFacing(boardState) {
        // Tìm vị trí hai Tướng
        let redGeneralX = -1, redGeneralY = -1;
        let blackGeneralX = -1, blackGeneralY = -1;

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const piece = boardState[y][x];
                if (piece === 'r_general') {
                    redGeneralX = x;
                    redGeneralY = y;
                } else if (piece === 'b_general') {
                    blackGeneralX = x;
                    blackGeneralY = y;
                }
            }
        }

        // Nếu cả hai tướng cùng cột
        if (redGeneralX === blackGeneralX) {
            // Kiểm tra xem có quân nào ở giữa không
            let hasPieceBetween = false;
            const startY = Math.min(redGeneralY, blackGeneralY) + 1;
            const endY = Math.max(redGeneralY, blackGeneralY);

            for (let y = startY; y < endY; y++) {
                if (boardState[y][redGeneralX]) {
                    hasPieceBetween = true;
                    break;
                }
            }

            // Nếu không có quân nào ở giữa, hai tướng đang đối mặt nhau
            return !hasPieceBetween;
        }

        return false;
    },

    // Kiểm tra tướng có đang bị chiếu không
    isInCheck(boardState, kingColor) {
        // Tìm vị trí tướng
        let kingX = -1, kingY = -1;
        const kingPiece = kingColor === 'red' ? 'r_general' : 'b_general';

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                if (boardState[y][x] === kingPiece) {
                    kingX = x;
                    kingY = y;
                    break;
                }
            }
            if (kingX !== -1) break;
        }

        // Kiểm tra từng quân đối phương, xem có thể tấn công tướng không
        const enemyPrefix = kingColor === 'red' ? 'b_' : 'r_';

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const piece = boardState[y][x];
                if (piece && piece.startsWith(enemyPrefix)) {
                    // Nếu quân này có thể đi đến vị trí của tướng, tướng đang bị chiếu
                    if (this.isValidMove(
                        boardState,
                        x, y,
                        kingX, kingY,
                        kingColor === 'red' ? 'black' : 'red'
                    )) {
                        return true;
                    }
                }
            }
        }

        // Kiểm tra tướng mặt nhau
        if (this.checkGeneralsFacing(boardState)) {
            return true;
        }

        return false;
    },

    // Thực hiện nước đi
    makeMove(boardState, fromX, fromY, toX, toY) {
        // Tạo bản sao của bàn cờ
        const newBoard = JSON.parse(JSON.stringify(boardState));

        // Di chuyển quân cờ
        newBoard[toY][toX] = newBoard[fromY][fromX];
        newBoard[fromY][fromX] = null;

        return newBoard;
    },

    // Kiểm tra nước đi có hợp lệ không và không gây chiếu vua
    isLegalMove(boardState, fromX, fromY, toX, toY, currentPlayer) {
        // Kiểm tra nước đi có tuân theo luật di chuyển của quân cờ không
        if (!this.isValidMove(boardState, fromX, fromY, toX, toY, currentPlayer)) {
            return false;
        }

        // Giả lập nước đi và kiểm tra có gây chiếu không
        const newBoard = this.makeMove(boardState, fromX, fromY, toX, toY);
        return !this.isInCheck(newBoard, currentPlayer);
    },

    // Kiểm tra hết cờ (Chiếu bí)
    isCheckmate(boardState, currentPlayer) {
        // Kiểm tra tướng có đang bị chiếu không
        if (!this.isInCheck(boardState, currentPlayer)) {
            return false;
        }

        // Thử tất cả các nước đi có thể có của quân ta
        const piecePrefix = currentPlayer === 'red' ? 'r_' : 'b_';

        for (let fromY = 0; fromY < this.boardHeight; fromY++) {
            for (let fromX = 0; fromX < this.boardWidth; fromX++) {
                const piece = boardState[fromY][fromX];
                if (piece && piece.startsWith(piecePrefix)) {
                    for (let toY = 0; toY < this.boardHeight; toY++) {
                        for (let toX = 0; toX < this.boardWidth; toX++) {
                            // Kiểm tra nước đi có hợp lệ và thoát khỏi chiếu không
                            if (this.isLegalMove(boardState, fromX, fromY, toX, toY, currentPlayer)) {
                                return false; // Có nước đi thoát chiếu
                            }
                        }
                    }
                }
            }
        }

        // Không có nước đi nào thoát chiếu -> chiếu bí
        return true;
    },

    // Phân tích tọa độ từ người dùng (vd: e4, a1)
    parseCoordinate(input) {
        if (!input || input.length < 2 || input.length > 3) return null;

        // Lấy chữ cái đầu tiên (A-I)
        const colChar = input.charAt(0).toUpperCase();
        if (colChar < 'A' || colChar > 'I') return null;

        // Lấy số (1-10)
        const rowNum = parseInt(input.substring(1));
        if (isNaN(rowNum) || rowNum < 1 || rowNum > 10) return null;

        // Chuyển đổi sang tọa độ mảng (0-8, 0-9)
        const col = colChar.charCodeAt(0) - 65;  // A=0, B=1, ...
        const row = 10 - rowNum;                 // 1=9, 2=8, ...

        return { x: col, y: row };
    },

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

    onLaunch: async function ({ api, event }) {
        const { threadID, senderID, messageID } = event;

        if (this.activeGames.has(threadID)) {
            return api.sendMessage("⚠️ Nhóm này đang có ván cờ tướng đang diễn ra. Vui lòng đợi ván hiện tại kết thúc!", threadID, messageID);
        }

        if (Object.keys(event.mentions).length !== 1) {
            return api.sendMessage("⚠️ Vui lòng tag một người để bắt đầu ván cờ tướng!", threadID, messageID);
        }

        const opponent = Object.keys(event.mentions)[0];

        if (opponent === senderID) {
            return api.sendMessage("❌ Bạn không thể chơi với chính mình!", threadID, messageID);
        }

        // Tạo bàn cờ mới
        const boardState = JSON.parse(JSON.stringify(this.initialBoard));

        // Lưu thông tin game
        const gameState = {
            board: boardState,
            players: {
                red: senderID,    // Người chơi quân đỏ (đi trước)
                black: opponent   // Người chơi quân đen
            },
            currentPlayer: 'red', // Lượt đi đầu tiên thuộc về quân đỏ
            startTime: Date.now(),
            lastMoveTime: Date.now(),
            lastMove: null,
            checkInactivityInterval: null,
            moveHistory: []
        };

        // Tự động kết thúc nếu không tương tác
        gameState.checkInactivityInterval = setInterval(() => {
            const now = Date.now();
            const idleTime = now - gameState.lastMoveTime;

            if (idleTime >= 3 * 60 * 1000) { // 3 phút
                clearInterval(gameState.checkInactivityInterval);
                this.activeGames.delete(threadID);
                api.sendMessage("⌛ Ván cờ tướng đã bị hủy do không có nước đi nào trong 3 phút!", threadID);
            }
        }, 30000);

        this.activeGames.set(threadID, gameState);

        const redPlayerName = this.getUserName(senderID);
        const blackPlayerName = this.getUserName(opponent);

        // Vẽ bàn cờ
        const boardImage = await this.drawBoard(boardState);

        await api.sendMessage({
            body: `🎮 Ván cờ tướng bắt đầu!\n` +
                `🔴 Quân Đỏ: ${redPlayerName} (đi trước)\n` +
                `⚫ Quân Đen: ${blackPlayerName}\n\n` +
                `📝 Cách chơi: Reply với nước đi của bạn\n` +
                `▪️ Định dạng: [cột đi][hàng đi][cột đến][hàng đến]\n` +
                `▪️ Ví dụ: e7e4, a10a9, h3h8\n\n` +
                `⏱️ Lượt của: ${redPlayerName} (Đỏ)`,
            attachment: fs.createReadStream(boardImage)
        }, threadID, (err, msg) => {
            if (err) return console.error(err);
            fs.unlinkSync(boardImage);

            global.client.onReply.push({
                name: this.name,
                messageID: msg.messageID,
                author: senderID, // Người chơi quân đỏ đi trước
                threadID: threadID
            });
        });
    },

    onReply: async function ({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        const game = this.activeGames.get(threadID);

        if (!game) {
            return api.sendMessage("❌ Không tìm thấy ván cờ tướng!", threadID, messageID);
        }

        const currentPlayerId = game.players[game.currentPlayer];

        if (senderID !== currentPlayerId) {
            return api.sendMessage("❌ Chưa đến lượt của bạn!", threadID, messageID);
        }

        const move = body.trim().toLowerCase();

        // Kiểm tra định dạng nước đi: a1b2, e7e6, ...
        if (!move.match(/^[a-i][1-9][0]?[a-i][1-9][0]?$/)) {
            return api.sendMessage("❌ Nước đi không đúng định dạng! Ví dụ đúng: e7e4, a10a9", threadID, messageID);
        }

        // Phân tích nước đi
        let fromCoord, toCoord;

        if (move.length === 4) {
            // Định dạng a1b2
            fromCoord = this.parseCoordinate(move.substring(0, 2));
            toCoord = this.parseCoordinate(move.substring(2, 4));
        } else if (move.length === 5) {
            // Có thể là a1b3 hoặc a10b1
            if (move.charAt(2) >= 'a' && move.charAt(2) <= 'i') {
                // a1b3
                fromCoord = this.parseCoordinate(move.substring(0, 2));
                toCoord = this.parseCoordinate(move.substring(2, 5));
            } else {
                // a10b1
                fromCoord = this.parseCoordinate(move.substring(0, 3));
                toCoord = this.parseCoordinate(move.substring(3, 5));
            }
        } else if (move.length === 6) {
            // Định dạng a10b10
            fromCoord = this.parseCoordinate(move.substring(0, 3));
            toCoord = this.parseCoordinate(move.substring(3, 6));
        }

        if (!fromCoord || !toCoord) {
            return api.sendMessage("❌ Tọa độ không hợp lệ! Vui lòng nhập theo định dạng: [cột đi][hàng đi][cột đến][hàng đến]", threadID, messageID);
        }

        const { x: fromX, y: fromY } = fromCoord;
        const { x: toX, y: toY } = toCoord;
        const { board, currentPlayer } = game;

        // Kiểm tra nước đi có hợp lệ không
        if (!this.isLegalMove(board, fromX, fromY, toX, toY, currentPlayer)) {
            return api.sendMessage("❌ Nước đi không hợp lệ! Vui lòng kiểm tra lại.", threadID, messageID);
        }

        // Thực hiện nước đi
        const newBoard = this.makeMove(board, fromX, fromY, toX, toY);
        game.board = newBoard;

        // Lưu nước đi cuối cùng
        game.lastMove = { fromX, fromY, toX, toY };
        game.lastMoveTime = Date.now();
        game.moveHistory.push({
            player: currentPlayer,
            from: `${String.fromCharCode(65 + fromX)}${10 - fromY}`,
            to: `${String.fromCharCode(65 + toX)}${10 - toY}`,
            piece: board[fromY][fromX]
        });

        // Đổi lượt
        const nextPlayer = currentPlayer === 'red' ? 'black' : 'red';

        // Kiểm tra tướng có đang bị chiếu không
        const isCheck = this.isInCheck(newBoard, nextPlayer);

        // Kiểm tra chiếu bí
        const isCheckMate = isCheck && this.isCheckmate(newBoard, nextPlayer);

        const gameOver = isCheckMate;

        if (!gameOver) {
            game.currentPlayer = nextPlayer;
        }

        // Lấy tên người chơi
        const redPlayerName = this.getUserName(game.players.red);
        const blackPlayerName = this.getUserName(game.players.black);

        // Vẽ bàn cờ mới
        const boardImage = await this.drawBoard(newBoard, game.lastMove);

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

            if (isCheckMate) {
                const winner = currentPlayer;
                const winnerName = winner === 'red' ? redPlayerName : blackPlayerName;

                messageBody = `🎮 CHIẾN THẮNG! 🎉\n` +
                    `👑 Người chiến thắng: ${winnerName} (${winner === 'red' ? 'Đỏ' : 'Đen'})\n` +
                    `⏱️ Thời gian: ${timeString}\n` +
                    `🎯 Nước đi cuối: ${move.toUpperCase()}\n\n` +
                    `☑️ Chiếu bí! Trò chơi kết thúc.`;
            }
        } else {
            // Game đang tiếp tục
            const nextPlayerName = game.currentPlayer === 'red' ? redPlayerName : blackPlayerName;
            const checkMessage = isCheck ? "⚠️ CHIẾU! Hãy bảo vệ Tướng!" : "";

            messageBody = `🎮 Cờ Tướng - Nước đi: ${move.toUpperCase()}\n` +
                `⏱️ Thời gian: ${timeString}\n` +
                `🎯 ${currentPlayer === 'red' ? 'Đỏ' : 'Đen'}: ${move.toUpperCase()}\n` +
                `${checkMessage}\n\n` +
                `⏳ Lượt tiếp theo: ${nextPlayerName} (${game.currentPlayer === 'red' ? 'Đỏ' : 'Đen'})`;
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
                    author: game.players[game.currentPlayer],
                    threadID: threadID
                });
            }
        });
    },
};