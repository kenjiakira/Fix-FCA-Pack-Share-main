const fs = require('fs');
const path = require('path');
const TradeSystem = require('../trade/TradeSystem');
const tradeSystem = new TradeSystem();
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const userDataFile = path.join(__dirname,'../events/cache/userData.json');
const bankingDataPath = path.join(__dirname, './json/banking.json');
let userData = {};

function formatNumber(number) {
    if (number === undefined || number === null) return "0";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function loadBankingData() {
    try {
        if (fs.existsSync(bankingDataPath)) {
            return JSON.parse(fs.readFileSync(bankingDataPath, 'utf8'));
        }
        return { users: {}, transactions: {}, loans: {}, blacklist: {}, dailyLoans: {} };
    } catch (error) {
        console.error("Error loading banking data:", error);
        return { users: {}, transactions: {}, loans: {}, blacklist: {}, dailyLoans: {} };
    }
}

try {
    if (fs.existsSync(userDataFile)) {
        userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    }
} catch (error) {
    console.error("Error loading user data:", error);
}

module.exports = {
    name: "balance",
    dev: "HNT",
    usedby: 0,
    category: "Tài Chính",
    info: "Kiểm tra số dư tài khoản của bạn",
    onPrefix: true,
    usages: ".balance: Kiểm tra số dư tài khoản của bạn.",
    cooldowns: 0,

    async createBalanceImage(userId, userName, walletBalance, bankBalance, transactions) {
        try {
            const width = 800;
            const height = 900;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#1a237e");  // Deep blue
            gradient.addColorStop(0.5, "#4a148c"); // Deep purple
            gradient.addColorStop(1, "#311b92");  // Deep indigo
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Add decorative particles
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const offset = i * 120;
                ctx.beginPath();
                ctx.moveTo(0, offset);
                ctx.lineTo(width, offset);
                ctx.stroke();

                if (offset < width) {
                    ctx.beginPath();
                    ctx.moveTo(offset, 0);
                    ctx.lineTo(offset, height);
                    ctx.stroke();
                }
            }

            // Header section
            const headerGradient = ctx.createLinearGradient(0, 0, width, 150);
            headerGradient.addColorStop(0, "rgba(75, 0, 130, 0.8)");  // Indigo
            headerGradient.addColorStop(1, "rgba(60, 20, 90, 0.8)");  // Purple
            ctx.fillStyle = headerGradient;
            ctx.fillRect(0, 0, width, 150);
            
            // Add decorative corners
            const cornerSize = 40;
            const drawCorner = (x, y, flipX, flipY) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                ctx.strokeStyle = "#FFD700";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(cornerSize, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, cornerSize);
                ctx.stroke();
                ctx.restore();
            };

            drawCorner(50, 50, false, false);
            drawCorner(width - 50, 50, true, false);
            drawCorner(50, height - 50, false, true);
            drawCorner(width - 50, height - 50, true, true);

            // Title with glow effect
            ctx.shadowColor = "rgba(255, 206, 84, 0.7)";
            ctx.shadowBlur = 15;
            ctx.font = "bold 45px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("THÔNG TIN TÀI CHÍNH", width / 2, 90);
            ctx.shadowBlur = 0;
            
            // Add decorative line
            const lineGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
            lineGradient.addColorStop(0, "rgba(255, 206, 84, 0.2)");
            lineGradient.addColorStop(0.5, "rgba(255, 206, 84, 1)");
            lineGradient.addColorStop(1, "rgba(255, 206, 84, 0.2)");
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(100, 120);
            ctx.lineTo(width - 100, 120);
            ctx.stroke();
            
            // User info section with avatar
            let avatarPath = null;
            try {
                avatarPath = await this.getAvatarPath(userId);
            } catch (avatarErr) {
                console.error("Error getting avatar:", avatarErr);
            }
            
            // User info background
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(50, 170, width - 100, 130);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, 170, width - 100, 130);
            
            // Draw avatar
            try {
                if (avatarPath) {
                    const avatar = await loadImage(avatarPath);
                    ctx.save();
                    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    
                    ctx.drawImage(avatar, 75, 185, 100, 100);
                    ctx.restore();
                    
                    // Draw avatar border
                    ctx.strokeStyle = "#FFD700";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Draw a placeholder avatar
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    const placeholderGradient = ctx.createLinearGradient(75, 185, 175, 285);
                    placeholderGradient.addColorStop(0, "#4a148c");
                    placeholderGradient.addColorStop(1, "#311b92");
                    ctx.fillStyle = placeholderGradient;
                    ctx.fill();
                    
                    // Add initial letter
                    const initial = (userName?.charAt(0) || "?").toUpperCase();
                    ctx.font = "bold 50px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.fillText(initial, 125, 250);
                    
                    // Add border
                    ctx.strokeStyle = "#FFD700";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } catch (avatarDrawErr) {
                console.error("Error drawing avatar:", avatarDrawErr);
            }
            
            // Username
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.fillText(`${userName || "Người dùng"} #${userId.substring(0, 5)}`, 200, 215);
            ctx.restore();
            
            // Account status
            ctx.font = "22px Arial";
            ctx.fillStyle = "#64ffda";
            ctx.textAlign = "left";
            
            const totalWealth = walletBalance + bankBalance;
            let status = "Người bình thường";
            if (totalWealth > 1000000) status = "Triệu phú";
            if (totalWealth > 1000000000) status = "Tỷ phú";
            if (totalWealth > 10000000000) status = "Đại gia";
            if (totalWealth > 100000000000) status = "Ông hoàng tài chính";
            
            ctx.fillText(`💼 ${status}`, 200, 250);
            
            ctx.save();
            const balanceStartY = 330;
            
            const cardGradient = ctx.createLinearGradient(50, balanceStartY, width - 50, balanceStartY + 220);
            cardGradient.addColorStop(0, "rgba(45, 52, 54, 0.7)");
            cardGradient.addColorStop(1, "rgba(25, 42, 86, 0.7)");
            
            ctx.fillStyle = cardGradient;
            this.roundRect(ctx, 50, balanceStartY, width - 100, 220, 15, true, false);
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            this.roundRect(ctx, 50, balanceStartY, width - 100, 220, 15, false, true);
            
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText("THÔNG TIN SỐ DƯ", width / 2, balanceStartY + 40);
            
       
            const walletGradient = ctx.createLinearGradient(100, balanceStartY + 90, 500, balanceStartY + 90);
            walletGradient.addColorStop(0, "#4facfe");
            walletGradient.addColorStop(1, "#00f2fe");
            
            ctx.font = "24px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("💵 Ví của bạn:", 100, balanceStartY + 90);
            
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = walletGradient;
            ctx.textAlign = "right";
            ctx.fillText(`${formatNumber(walletBalance)} $`, width - 100, balanceStartY + 90);
            
            const bankGradient = ctx.createLinearGradient(100, balanceStartY + 140, 500, balanceStartY + 140);
            bankGradient.addColorStop(0, "#43e97b");
            bankGradient.addColorStop(1, "#38f9d7");
            
            ctx.font = "24px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("🏦 Ngân hàng:", 100, balanceStartY + 140);
            
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = bankGradient;
            ctx.textAlign = "right";
            ctx.fillText(`${formatNumber(bankBalance)} $`, width - 100, balanceStartY + 140);
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(80, balanceStartY + 175);
            ctx.lineTo(width - 80, balanceStartY + 175);
            ctx.stroke();
            
            const totalGradient = ctx.createLinearGradient(100, balanceStartY + 210, 500, balanceStartY + 210);
            totalGradient.addColorStop(0, "#FFD700");
            totalGradient.addColorStop(1, "#FFA500");
            
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("💎 Tổng tài sản:", 100, balanceStartY + 210);
            
            ctx.font = "bold 30px Arial";
            ctx.fillStyle = totalGradient;
            ctx.textAlign = "right";
            ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
            ctx.shadowBlur = 10;
            ctx.fillText(`${formatNumber(totalWealth)} $`, width - 100, balanceStartY + 210);
            ctx.shadowBlur = 0;
            ctx.restore();
            
            const transStartY = 580;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(50, transStartY, width - 100, 220);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, transStartY, width - 100, 220);
            
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText("GIAO DỊCH GẦN ĐÂY", width / 2, transStartY + 40);
            
            if (transactions && transactions.length > 0) {
                const recentTrans = transactions.slice(-4); 
                const startYTrans = transStartY + 80;
                
                recentTrans.forEach((trans, index) => {
                    const y = startYTrans + (index * 40);
                    const date = new Date(trans.timestamp);
                    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                    const icon = trans.type === 'in' ? '📥' : '📤';
                    
                    // Transaction background
                    ctx.fillStyle = trans.type === 'in' ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)";
                    ctx.fillRect(70, y - 20, width - 140, 30);
                    
                    // Transaction text
                    ctx.font = "18px Arial";
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${icon} ${time}: ${trans.description}`, 90, y);
                    
                    // Transaction amount
                    ctx.font = "bold 18px Arial";
                    ctx.textAlign = "right";
                    ctx.fillStyle = trans.type === 'in' ? "#2ecc71" : "#e74c3c";
                    ctx.fillText(`${trans.type === 'in' ? '+' : '-'}${formatNumber(trans.amount || 0)} $`, width - 90, y);
                });
            } else {
                ctx.font = "italic 20px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.textAlign = "center";
                ctx.fillText("Không có giao dịch gần đây", width / 2, transStartY + 120);
            }
            const buffer = canvas.toBuffer("image/png");
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const outputPath = path.join(tempDir, `balance_${userId}_${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            
            return outputPath;
        } catch (error) {
            console.error("Error creating balance image:", error);
            throw error;
        }
    },
    
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    },
    
    async getAvatarPath(userId) {
        try {
            const avatarsDir = path.join(__dirname, '../commands/cache/avatars');
            if (!fs.existsSync(avatarsDir)) {
                fs.mkdirSync(avatarsDir, { recursive: true });
            }
            
            const defaultAvatarPath = path.join(avatarsDir, 'avatar.jpg');
            if (!fs.existsSync(defaultAvatarPath)) {
                try {
                    console.log("⚠️ Default avatar not found, creating one...");
                    const defaultCanvas = createCanvas(200, 200);
                    const ctx = defaultCanvas.getContext('2d');
                    
                    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
                    gradient.addColorStop(0, '#4a148c');
                    gradient.addColorStop(1, '#311b92');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, 200, 200);
                    
                    ctx.font = 'bold 120px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('?', 100, 100);
                    
                    const buffer = defaultCanvas.toBuffer('image/jpeg');
                    fs.writeFileSync(defaultAvatarPath, buffer);
                    console.log("✅ Default avatar created successfully");
                } catch (err) {
                    console.error("Error creating default avatar:", err);
                }
            }
            
            const cacheDir = path.join(__dirname, "./cache/avatars");
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            const avatarPath = path.join(cacheDir, `${userId}.jpg`);
            const metadataPath = path.join(cacheDir, `${userId}.meta`);
            
            if (fs.existsSync(avatarPath) && fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                const cacheAge = Date.now() - metadata.timestamp;
                
                if (cacheAge < 24 * 60 * 60 * 1000) {
                    return avatarPath; 
                }
            }
            
            try {
                const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const response = await axios.get(avatarUrl, { 
                    responseType: 'arraybuffer',
                    validateStatus: function (status) {
                        return status >= 200 && status < 300;
                    }
                });
                
                fs.writeFileSync(avatarPath, response.data);
                fs.writeFileSync(metadataPath, JSON.stringify({ timestamp: Date.now() }));
                
                return avatarPath;
            } catch (apiError) {
                console.error(`Error getting avatar for ${userId} from API:`, apiError.message);
                return defaultAvatarPath;
            }
        } catch (error) {
            console.error(`Error in getAvatarPath for ${userId}:`, error.message);
            const defaultAvatarPath = path.join(__dirname, '../commands/cache/avatars/avatar.jpg');
            if (fs.existsSync(defaultAvatarPath)) {
                return defaultAvatarPath;
            }
            return null;
        }
    },

    onLaunch: async function({ api, event }) {
        try {
            const { threadID, messageID, senderID } = event;
            const userID = String(senderID);

            const userInfo = userData[userID] || {};
            const userName = userInfo.name || "Người dùng";

            const balance = global.balance[userID] || 0;
            const bankingData = loadBankingData();
            const bankUserData = bankingData.users?.[userID] || {};
            const bankBalance = bankUserData.bankBalance || 0;

            // Get transaction history
            const transactions = bankingData.transactions?.[userID] || [];
            const recentTrans = transactions.slice(-5); // Get last 5 transactions

            try {
                // Generate beautiful balance canvas
                const imagePath = await this.createBalanceImage(
                    userID, 
                    userName, 
                    balance, 
                    bankBalance, 
                    recentTrans
                );
                
                // Send image
                return api.sendMessage(
                    { 
                        body: "💰 Thông tin tài chính của bạn:", 
                        attachment: fs.createReadStream(imagePath) 
                    }, 
                    threadID, 
                    (err) => {
                        // Clean up the temp image after sending
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                        
                        // If there was an error sending the image, send text fallback
                        if (err) {
                            this.sendTextFallback(api, event, userID, userName, balance, bankBalance, recentTrans);
                        }
                    }
                );
            } catch (imageError) {
                console.error("Error creating balance image:", imageError);
                // If we couldn't create the image, fall back to text
                return this.sendTextFallback(api, event, userID, userName, balance, bankBalance, recentTrans);
            }
        } catch (error) {
            console.error("Balance command error:", error);
            return api.sendMessage("❌ Lỗi hệ thống!", event.threadID, event.messageID);
        }
    },
    
    sendTextFallback(api, event, userID, userName, balance, bankBalance, transactions) {
        const totalWealth = balance + bankBalance;
        
        let transHistory = 'Chưa có';
        const recentTrans = transactions.slice(-2);
        if (recentTrans.length > 0) {
            transHistory = recentTrans.map(t => {
                const date = new Date(t.timestamp);
                const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                const icon = t.type === 'in' ? '📥' : '📤';
                return `${icon} ${time}: ${t.description}`;
            }).reverse().join('\n');
        }

        let marketAlert = '';
        try {
            const analysis = tradeSystem.getMarketAnalysis();
            if (analysis.topGainers.length > 0) {
                const gainer = analysis.topGainers[0];
                marketAlert = `\n📈 ${gainer.symbol}: +${gainer.change.toFixed(1)}%`;
            }
        } catch (error) {
            console.error("Market analysis error:", error);
            marketAlert = '';
        }

        const response = 
            `💰 SỐ DƯ TÀI KHOẢN 💰\n` +
            `━━━━━━━━━━━━━━\n` +
            `👤 ${userName}\n` +
            `💵 Ví: ${formatNumber(balance)} xu\n` +
            `🏦 Bank: ${formatNumber(bankBalance)} xu\n` +
            `💎 Tổng: ${formatNumber(totalWealth)} xu\n\n` +
            `📝 Giao dịch:\n${transHistory}` +
            marketAlert;

        return api.sendMessage(response, event.threadID, event.messageID);
    }
};
