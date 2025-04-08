const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = {
    name: "guess",
    aliases: ["doanso", "sodo"],
    dev: "HNT",
    category: "Games",
    onPrefix: true,
    info: "Chơi trò chơi đoán số (1-100)",
    usedby: 0,
    usages: "Sử dụng: start để bắt đầu, hoặc nhập số để đoán",
    cooldowns: 5,

    activeGames: new Map(),
    
    fontPath: path.join(__dirname, '../fonts/BeVietnamPro-Bold.ttf'),
    bgImage: null,
    cachedBg: false,

    async loadBackground() {
        if (this.cachedBg) return;
        try {
            
            const tempCanvas = createCanvas(800, 500);
            const tempCtx = tempCanvas.getContext('2d');
            
            
            const gradient = tempCtx.createLinearGradient(0, 0, 800, 500);
            gradient.addColorStop(0, '#4158D0');
            gradient.addColorStop(0.5, '#C850C0');
            gradient.addColorStop(1, '#FFCC70');
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, 800, 500);
            
            tempCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * 800;
                const y = Math.random() * 500;
                const radius = 5 + Math.random() * 30;
                
                tempCtx.beginPath();
                tempCtx.arc(x, y, radius, 0, Math.PI * 2);
                tempCtx.fill();
            }
            
            this.bgImage = tempCanvas;
            this.cachedBg = true;
        } catch (error) {
            console.error('Failed to create background:', error);
   
            const tempCanvas = createCanvas(800, 500);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = '#333333';
            tempCtx.fillRect(0, 0, 800, 500);
            this.bgImage = tempCanvas;
            this.cachedBg = true;
        }
    },

    async ensureCacheDir() {
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    },

    onLoad: function() {
        try {
            if (fs.existsSync(this.fontPath)) {
                registerFont(this.fontPath, { family: 'BeVietnamPro' });
                console.log("✓ Đã đăng ký font BeVietnamPro thành công cho Guess Number game");
            } else {
                console.log("✗ Không tìm thấy font BeVietnamPro. Sử dụng font mặc định.");
            }
        } catch (error) {
            console.error("Lỗi khi đăng ký font:", error);
        }

        
        for (const [threadID, game] of this.activeGames) {
            if (game.inactivityInterval) {
                clearInterval(game.inactivityInterval);
            }
        }
        this.activeGames.clear();
    },

    
    generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    
    async createGameImage(game) {
        await this.ensureCacheDir();
        await this.loadBackground();

        const width = 800;
        const height = 500;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        
        ctx.drawImage(this.bgImage, 0, 0, width, height);

        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        
        ctx.font = '40px "BeVietnamPro", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        
        ctx.fillStyle = '#FFD700'; 
        ctx.font = 'bold 60px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText('ĐOÁN SỐ', width / 2, 80);
        
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText(`Số lượt đoán: ${game.attempts}/${game.maxAttempts}`, width / 2, 150);

        
        ctx.fillText(`Phạm vi: ${game.min} - ${game.max}`, width / 2, 190);

        
        let hintText = '';
        if (game.lastGuess !== null) {
            const difference = Math.abs(game.lastGuess - game.targetNumber);
            
            if (difference > 40) {
                hintText = `Số ${game.lastGuess} - Quá xa!`;
                ctx.fillStyle = '#FF6347'; 
            } else if (difference > 20) {
                hintText = `Số ${game.lastGuess} - Khá xa!`;
                ctx.fillStyle = '#FFA500'; 
            } else if (difference > 10) {
                hintText = `Số ${game.lastGuess} - Gần rồi!`;
                ctx.fillStyle = '#FFFF00'; 
            } else if (difference > 5) {
                hintText = `Số ${game.lastGuess} - Rất gần!`;
                ctx.fillStyle = '#98FB98'; 
            } else {
                hintText = `Số ${game.lastGuess} - Cực kỳ gần!`;
                ctx.fillStyle = '#00FF00'; 
            }
            
            
            if (game.lastGuess < game.targetNumber) {
                hintText += " (Lớn hơn ⬆️)";
            } else if (game.lastGuess > game.targetNumber) {
                hintText += " (Nhỏ hơn ⬇️)";
            }
            
            ctx.fillText(hintText, width / 2, 250);
        }

        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText("Các số đã đoán:", width / 2, 310);
        
        const previousGuesses = game.guesses.join(' - ');
        ctx.fillText(previousGuesses || "Chưa có", width / 2, 350);

        
        const progressBarWidth = 600;
        const progressBarHeight = 30;
        const progressBarX = (width - progressBarWidth) / 2;
        const progressBarY = 410;

        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
        
        
        const progress = game.attempts / game.maxAttempts;
        ctx.fillStyle = progress > 0.7 ? '#FF6347' : progress > 0.4 ? '#FFA500' : '#4CAF50';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);
        
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText("Hãy reply với con số bạn đoán", width / 2, 470);

        
        const imagePath = path.join(__dirname, 'cache', `guess_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
        
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
            
            stream.pipe(out);
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    },

    
    async createResultImage(game, isVictory) {
        await this.ensureCacheDir();
        await this.loadBackground();

        const width = 800;
        const height = 500;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        
        ctx.drawImage(this.bgImage, 0, 0, width, height);

        
        ctx.fillStyle = isVictory ? 'rgba(0, 100, 0, 0.7)' : 'rgba(139, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        
        ctx.font = '40px "BeVietnamPro", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText(isVictory ? 'CHIẾN THẮNG! 🎉' : 'THUA CUỘC! 😢', width / 2, 100);

        
        ctx.font = 'bold 50px "BeVietnamPro", Arial, sans-serif';
        ctx.fillStyle = '#FFD700'; 
        ctx.fillText(`Số cần đoán: ${game.targetNumber}`, width / 2, 180);

        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText(`Số lượt đã dùng: ${game.attempts}/${game.maxAttempts}`, width / 2, 250);
        
        const elapsedTime = Math.floor((Date.now() - game.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        ctx.fillText(`Thời gian: ${minutes}:${seconds.toString().padStart(2, '0')}`, width / 2, 300);

        
        ctx.font = '24px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText("Các số đã đoán:", width / 2, 350);
        
        const previousGuesses = game.guesses.join(' - ');
        ctx.fillText(previousGuesses, width / 2, 390);

        
        ctx.fillStyle = '#FFD700';
        ctx.font = '30px "BeVietnamPro", Arial, sans-serif';
        ctx.fillText(isVictory ? 'Chúc mừng bạn đã đoán đúng! 🏆' : 'Hãy thử lại lần sau! 🔄', width / 2, 450);

        
        const imagePath = path.join(__dirname, 'cache', `guess_result_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
        
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(imagePath);
            const stream = canvas.createPNGStream();
            
            stream.pipe(out);
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID, messageID } = event;
        
        
        if (target[0]?.toLowerCase() === 'start') {
            
            if (this.activeGames.has(threadID)) {
                return api.sendMessage("⚠️ Đã có một trò chơi đoán số đang diễn ra trong nhóm này. Vui lòng kết thúc trò chơi hiện tại trước!", threadID, messageID);
            }
            
            
            let maxAttempts = 10; 
            let range = 100;      
            
            if (target[1]?.toLowerCase() === 'easy') {
                maxAttempts = 15;
                range = 50;
            } else if (target[1]?.toLowerCase() === 'hard') {
                maxAttempts = 7;
                range = 150;
            } else if (target[1]?.toLowerCase() === 'extreme') {
                maxAttempts = 5;
                range = 200;
            }
            
            
            const gameState = {
                targetNumber: this.generateRandomNumber(1, range),
                min: 1,
                max: range,
                attempts: 0,
                maxAttempts: maxAttempts,
                guesses: [],
                lastGuess: null,
                startTime: Date.now(),
                lastActivityTime: Date.now(),
                inactivityInterval: null,
                creatorID: senderID 
            };
            
            
            gameState.inactivityInterval = setInterval(() => {
                const now = Date.now();
                const idleTime = now - gameState.lastActivityTime;
                
                if (idleTime >= 3 * 60 * 1000) { 
                    clearInterval(gameState.inactivityInterval);
                    this.activeGames.delete(threadID);
                    api.sendMessage("⌛ Trò chơi đoán số đã bị hủy do không có hoạt động trong 3 phút!", threadID);
                }
            }, 30000);
            
            this.activeGames.set(threadID, gameState);
            
            
            const gameImage = await this.createGameImage(gameState);
            
            await api.sendMessage({
                body: `🎮 Trò chơi ĐOÁN SỐ đã bắt đầu!\n` +
                      `📊 Phạm vi: 1-${range}\n` +
                      `🎯 Số lượt đoán tối đa: ${maxAttempts}\n\n` +
                      `Hãy reply tin nhắn này với con số bạn đoán!`,
                attachment: fs.createReadStream(gameImage)
            }, threadID, (err, msg) => {
                if (err) return console.error(err);
                fs.unlinkSync(gameImage);
                
                global.client.onReply.push({
                    name: this.name,
                    messageID: msg.messageID,
                    author: senderID,
                    threadID: threadID
                });
            });
        } else if (target[0]?.toLowerCase() === 'end') {
            
            if (!this.activeGames.has(threadID)) {
                return api.sendMessage("❌ Không có trò chơi đoán số nào đang diễn ra!", threadID, messageID);
            }
            
            const game = this.activeGames.get(threadID);
            clearInterval(game.inactivityInterval);
            
            const resultImage = await this.createResultImage(game, false);
            
            await api.sendMessage({
                body: `🎮 Trò chơi ĐOÁN SỐ đã kết thúc!\n` +
                      `🔢 Số cần đoán là: ${game.targetNumber}\n` +
                      `🔄 Dùng lệnh "/guess start" để chơi lại!`,
                attachment: fs.createReadStream(resultImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(resultImage);
                this.activeGames.delete(threadID);
            });
        } else {
            
            return api.sendMessage(
                "🎮 ĐOÁN SỐ - HƯỚNG DẪN:\n\n" +
                "- Bắt đầu trò chơi: /guess start\n" +
                "- Chọn độ khó:\n" +
                "  • /guess start easy (1-50, 15 lượt)\n" +
                "  • /guess start (1-100, 10 lượt)\n" +
                "  • /guess start hard (1-150, 7 lượt)\n" +
                "  • /guess start extreme (1-200, 5 lượt)\n" +
                "- Kết thúc trò chơi: /guess end",
                threadID, messageID
            );
        }
    },

    onReply: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        
        
        if (!this.activeGames.has(threadID)) {
            return api.sendMessage("❌ Không có trò chơi đoán số nào đang diễn ra!", threadID, messageID);
        }
        
        const game = this.activeGames.get(threadID);
        
        
        if (senderID !== game.creatorID) {
            return api.sendMessage("❌ Chỉ người chơi đã bắt đầu trò chơi mới được phép đoán số!", threadID, messageID);
        }
        
        const guess = parseInt(body.trim());
        
        
        if (isNaN(guess)) {
            return api.sendMessage("❌ Vui lòng nhập một số hợp lệ!", threadID, messageID);
        }
        
        
        if (guess < game.min || guess > game.max) {
            return api.sendMessage(`❌ Vui lòng nhập số trong phạm vi từ ${game.min} đến ${game.max}!`, threadID, messageID);
        }
        
        
        game.attempts++;
        game.lastGuess = guess;
        game.guesses.push(guess);
        game.lastActivityTime = Date.now();
        
        
        if (guess === game.targetNumber) {
            
            clearInterval(game.inactivityInterval);
            
            const resultImage = await this.createResultImage(game, true);
            
            await api.sendMessage({
                body: `🎉 CHÚC MỪNG! Bạn đã đoán đúng số ${game.targetNumber}!\n` +
                      `🔢 Số lượt đoán: ${game.attempts}/${game.maxAttempts}\n` +
                      `🔄 Dùng lệnh "/guess start" để chơi lại!`,
                attachment: fs.createReadStream(resultImage)
            }, threadID, (err) => {
                if (err) return console.error(err);
                fs.unlinkSync(resultImage);
                this.activeGames.delete(threadID);
            });
        } else {
            
            
            
            if (game.attempts >= game.maxAttempts) {
                
                clearInterval(game.inactivityInterval);
                
                const resultImage = await this.createResultImage(game, false);
                
                await api.sendMessage({
                    body: `😢 GAME OVER! Bạn đã hết lượt đoán.\n` +
                          `🔢 Số cần đoán là: ${game.targetNumber}\n` +
                          `🔄 Dùng lệnh "/guess start" để chơi lại!`,
                    attachment: fs.createReadStream(resultImage)
                }, threadID, (err) => {
                    if (err) return console.error(err);
                    fs.unlinkSync(resultImage);
                    this.activeGames.delete(threadID);
                });
            } else {
                
                
                
                if (guess < game.targetNumber && guess > game.min) {
                    game.min = guess;
                } else if (guess > game.targetNumber && guess < game.max) {
                    game.max = guess;
                }
                
                const gameImage = await this.createGameImage(game);
                
                
                const hintMessage = guess < game.targetNumber
                    ? `Số ${guess} nhỏ hơn số cần đoán ⬆️`
                    : `Số ${guess} lớn hơn số cần đoán ⬇️`;
                
                await api.sendMessage({
                    body: `🎮 Lượt đoán thứ ${game.attempts}/${game.maxAttempts}\n` +
                          `${hintMessage}\n` +
                          `🔍 Phạm vi còn lại: ${game.min} - ${game.max}\n\n` +
                          `Hãy reply tin nhắn này để đoán tiếp!`,
                    attachment: fs.createReadStream(gameImage)
                }, threadID, (err, msg) => {
                    if (err) return console.error(err);
                    fs.unlinkSync(gameImage);
                    
                    global.client.onReply.push({
                        name: this.name,
                        messageID: msg.messageID,
                        author: senderID,
                        threadID: threadID
                    });
                });
            }
        }
    }
};