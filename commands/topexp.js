    const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

module.exports = {
    name: "topexp",
    dev: "HNT",
    usedby: 0,
    category: "Khác",
    info: "Xem top 10 người tương tác nhiều nhất.",
    onPrefix: true,
    usages: ".topexp: Xem top 10 người tương tác nhiều nhất\n.topexp on: Ẩn danh tên của bạn\n.topexp unon: Hiện lại tên của bạn",
    cooldowns: 0,

    anonymousUsers: new Set(),

    async createTopImage(sortedUsers, senderID, userAvatars = {}) {
        try {
            const width = 800;
            const height = 1250;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            // Create a stunning gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#1a237e");  // Deep blue
            gradient.addColorStop(0.5, "#4a148c"); // Deep purple
            gradient.addColorStop(1, "#004d40");  // Deep teal
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Add decorative stars/particles
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add decorative geometric pattern
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const offset = i * 150;
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

            // Add golden decorative corners
            const cornerSize = 40;
            const drawCorner = (x, y, flipX, flipY) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                ctx.strokeStyle = "#ffce54";
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
            ctx.fillText("TOP 10 TƯƠNG TÁC", width / 2, 90);
            ctx.shadowBlur = 0;

            // Draw decorative line
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

            // Define medals and rank colors
            const medals = ["🥇", "🥈", "🥉"];
            const rankColors = [
                "#FFD700", // Gold
                "#C0C0C0", // Silver
                "#CD7F32", // Bronze
                "rgba(255, 255, 255, 0.2)" // Others
            ];
            
            // Define rewards
            const rewards = {
                0: "300,000 $/ngày",
                1: "100,000 $/ngày",
                2: "50,000 $/ngày"
            };

            // List entries
            let startY = 180;
            const rowHeight = 90;

            for (let i = 0; i < sortedUsers.length && i < 10; i++) {
                const user = sortedUsers[i];
                
                // Card background with gradient
                const cardGradient = ctx.createLinearGradient(50, startY - 20, width - 50, startY + 50);
                
                if (i < 3) {
                    cardGradient.addColorStop(0, `rgba(${i === 0 ? '255, 215, 0' : i === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.2)`);
                    cardGradient.addColorStop(1, `rgba(${i === 0 ? '255, 215, 0' : i === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.05)`);
                } else {
                    cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
                    cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");
                }
                
                ctx.fillStyle = cardGradient;
                ctx.fillRect(50, startY - 20, width - 100, rowHeight);

                // Highlight current user
                if (user.id === senderID) {
                    ctx.save();
                    ctx.shadowColor = "#FFD700";
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = "#FFD700";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(50, startY - 20, width - 100, rowHeight);
                    ctx.restore();
                } else {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(50, startY - 20, width - 100, rowHeight);
                }

                // Rank circle with 3D effect
                const rankOffsetY = 20;
                ctx.beginPath();
                ctx.arc(100, startY + rankOffsetY, 30, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                ctx.fill();

                ctx.beginPath();
                ctx.arc(100, startY + rankOffsetY, 30, 0, Math.PI * 2);
                
                const circleGradient = ctx.createRadialGradient(
                    90, startY + rankOffsetY - 10, 5,
                    100, startY + rankOffsetY, 30
                );
                
                if (i < 3) {
                    const baseColor = i === 0 ? [255, 215, 0] : i === 1 ? [192, 192, 192] : [205, 127, 50];
                    circleGradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`);
                    circleGradient.addColorStop(0.7, `rgba(${baseColor[0]*0.8}, ${baseColor[1]*0.8}, ${baseColor[2]*0.8}, 1)`);
                    circleGradient.addColorStop(1, `rgba(${baseColor[0]*0.6}, ${baseColor[1]*0.6}, ${baseColor[2]*0.6}, 1)`);
                } else {
                    circleGradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
                    circleGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
                }
                
                ctx.fillStyle = circleGradient;
                ctx.fill();
                
                // Add rank number or medal
                ctx.fillStyle = i < 3 ? "#000000" : "#FFFFFF";
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                
                if (i < 3) {
                    ctx.fillText(medals[i], 100, startY + rankOffsetY + 10);
                } else {
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText((i + 1).toString(), 100, startY + rankOffsetY + 8);
                }
                try {
                    let avatar;
                    const avatarOffsetY = 25;
                    
                    // Thử tải avatar người dùng
                    if (userAvatars[user.id]) {
                        try {
                            avatar = await loadImage(userAvatars[user.id]);
                        } catch (avatarError) {
                            console.error(`Error loading avatar for ${user.id}:`, avatarError);
                            // Nếu không tải được, sử dụng avatar mặc định
                            const defaultAvatarPath = path.join(__dirname, './cache/avatar.jpg');
                            if (fs.existsSync(defaultAvatarPath)) {
                                avatar = await loadImage(defaultAvatarPath);
                            }
                        }
                    } else {
                        // Nếu không có avatar trong userAvatars, sử dụng avatar mặc định
                        const defaultAvatarPath = path.join(__dirname, './cache/avatar.jpg');
                        if (fs.existsSync(defaultAvatarPath)) {
                            avatar = await loadImage(defaultAvatarPath);
                        }
                    }
                    
                    // Nếu đã có avatar (từ người dùng hoặc mặc định)
                    if (avatar) {
                        ctx.save();
                        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                        ctx.shadowBlur = 10;
                        ctx.shadowOffsetX = 2;
                        ctx.shadowOffsetY = 2;
                        
                        ctx.beginPath();
                        ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        
                        ctx.drawImage(avatar, 140, startY - 30 + avatarOffsetY, 60, 60);
                        ctx.restore();
                        
                        ctx.strokeStyle = i < 3 ? rankColors[i] : '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(170, startY + avatarOffsetY, 30, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } catch (error) {
                    console.error(`Error processing avatar for ${user.id}:`, error);
                }

                // Username with shadow
                ctx.save();
                ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
                ctx.shadowBlur = 5;
                ctx.font = "bold 30px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                
                let displayName = user.name;
                if (ctx.measureText(displayName).width > width - 300) {
                    while (ctx.measureText(displayName + '...').width > width - 300 && displayName.length > 0) {
                        displayName = displayName.slice(0, -1);
                    }
                    displayName += '...';
                }
                
                ctx.fillText(displayName, 220, startY + 15);
                ctx.restore();

const expGradient = ctx.createLinearGradient(220, startY + 35, 380, startY + 35);
expGradient.addColorStop(0, "#64ffda"); // Teal
expGradient.addColorStop(1, "#00bfa5"); // Light teal

ctx.save();
ctx.shadowColor = "rgba(0, 191, 165, 0.5)";
ctx.shadowBlur = 10;
ctx.font = "22px Arial";
ctx.textAlign = "left";
ctx.fillStyle = expGradient;
const formattedExp = user.exp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
ctx.fillText(`⭐ Lv.${user.level} | ${formattedExp} EXP`, 220, startY + 50);
ctx.restore();

// Add reward info for top 3 - chuyển sang bên phải
if (i < 3 && rewards[i]) {
    const rewardGradient = ctx.createLinearGradient(400, startY + 50, 650, startY + 50);
    rewardGradient.addColorStop(0, "#ffcc80"); // Light orange
    rewardGradient.addColorStop(1, "#ffb74d"); // Orange
    
    ctx.save();
    ctx.shadowColor = "rgba(255, 193, 7, 0.5)";
    ctx.shadowBlur = 5;
    ctx.font = "22px Arial";
    ctx.textAlign = "right"; // Căn lề phải
    ctx.fillStyle = rewardGradient;
    ctx.fillText(`💰 ${rewards[i]}`, width - 80, startY + 50); // Chuyển sang bên phải của canvas
    ctx.restore();
}
                startY += rowHeight + 10;
            }

            // Footer with gradient
            const footerHeight = 80;
            const footerGradient = ctx.createLinearGradient(0, height - footerHeight, width, height);
            footerGradient.addColorStop(0, "rgba(45, 45, 85, 0.9)");
            footerGradient.addColorStop(1, "rgba(70, 40, 120, 0.9)");
            ctx.fillStyle = footerGradient;
            ctx.fillRect(0, height - footerHeight, width, footerHeight);

            // AKI Global branding
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText("AKI GLOBAL", width / 2, height - 45);
            
            // Timestamp with gradient
            const subtitleGradient = ctx.createLinearGradient(width/2 - 150, height - 20, width/2 + 150, height - 20);
            subtitleGradient.addColorStop(0, "#64ffda");
            subtitleGradient.addColorStop(1, "#00bfa5");
            ctx.font = "italic 20px Arial";
            ctx.fillStyle = subtitleGradient;
            ctx.fillText(`Cập nhật: ${new Date().toLocaleString("vi-VN")}`, width / 2, height - 15);
            
            // Footer decoration line
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.moveTo(100, height - footerHeight + 20);
            ctx.lineTo(width - 100, height - footerHeight + 20);
            ctx.stroke();

            // Save and return image
            const buffer = canvas.toBuffer("image/png");
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const outputPath = path.join(tempDir, `topexp_${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            
            return outputPath;
        } catch (error) {
            console.error("Error creating topexp image:", error);
            throw error;
        }
    },

    async getAvatarPath(userId) {
        try {
            const cacheDir = path.join(__dirname, "./cache/avatars");
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
    
            // Kiểm tra avatar trong cache trước
            const avatarPath = path.join(cacheDir, `${userId}.jpg`);
            const metadataPath = path.join(cacheDir, `${userId}.meta`);
            
            if (fs.existsSync(avatarPath) && fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                const cacheAge = Date.now() - metadata.timestamp;
                
                if (cacheAge < 24 * 60 * 60 * 1000) {
                    return avatarPath; // Sử dụng avatar từ cache nếu chưa hết hạn
                }
            }
    
            // Kiểm tra xem avatar mặc định có tồn tại không
            const defaultAvatarPath = path.join(__dirname, './cache/avatar.jpg');
            const defaultAvatarExists = fs.existsSync(defaultAvatarPath);
    
            // Thử lấy avatar từ Facebook Graph API
            try {
                const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const response = await axios.get(avatarUrl, { 
                    responseType: 'arraybuffer',
                    validateStatus: function (status) {
                        return status >= 200 && status < 300; // Chỉ chấp nhận status code 2xx
                    }
                });
                
                fs.writeFileSync(avatarPath, response.data);
                fs.writeFileSync(metadataPath, JSON.stringify({ timestamp: Date.now() }));
                
                return avatarPath;
            } catch (apiError) {
                console.error(`Error getting avatar for ${userId} from API:`, apiError.message);
                
                if (defaultAvatarExists) {
                    console.log(`Using default avatar for ${userId}`);
                    return defaultAvatarPath;
                } else {
                    throw new Error("Default avatar not found");
                }
            }
        } catch (error) {
            console.error(`Error in getAvatarPath for ${userId}:`, error.message);
            
            // Luôn kiểm tra và trả về avatar mặc định nếu có
            const defaultAvatarPath = path.join(__dirname, './cache/avatar.jpg');
            if (fs.existsSync(defaultAvatarPath)) {
                console.log(`Fallback to default avatar for ${userId}`);
                return defaultAvatarPath;
            }
            return null;
        }
    },

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const target = event.body.split(" ").slice(1);
        const avatarsDir = path.join(__dirname, './cache/avatar.jpg');
        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true });
        }

        const defaultAvatarPath = path.join(avatarsDir, 'avatar.jpg');
        if (!fs.existsSync(defaultAvatarPath)) {
            try {
                console.log("⚠️ Default avatar not found, creating one...");
                // Tạo một ảnh đơn giản làm avatar mặc định
                const defaultCanvas = createCanvas(200, 200);
                const ctx = defaultCanvas.getContext('2d');
                
                // Vẽ nền gradient
                const gradient = ctx.createLinearGradient(0, 0, 200, 200);
                gradient.addColorStop(0, '#4a148c');
                gradient.addColorStop(1, '#311b92');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 200, 200);
                
                // Vẽ chữ cái đại diện
                ctx.font = 'bold 120px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('?', 100, 100);
                
                // Lưu thành file
                const buffer = defaultCanvas.toBuffer('image/jpeg');
                fs.writeFileSync(defaultAvatarPath, buffer);
                console.log("✅ Default avatar created successfully");
            } catch (err) {
                console.error("Error creating default avatar:", err);
            }
        }
        
        // Handle visibility toggle commands
        if (target[0] === "on") {
            this.anonymousUsers.add(senderID);
            return api.sendMessage("✅ Đã ẩn danh tên của bạn trong bảng xếp hạng!", threadID, messageID);
        }
        if (target[0] === "unon") {
            this.anonymousUsers.delete(senderID);
            return api.sendMessage("✅ Đã hiện lại tên của bạn trong bảng xếp hạng!", threadID, messageID);
        }

        try {
            const userDataPath = path.join(__dirname, '../events/cache/rankData.json');
            const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

            const sortedUsers = Object.entries(userData)
                .map(([id, data]) => ({
                    id,
                    name: this.anonymousUsers.has(id) ? 
                        "Người dùng ẩn danh #" + id.substring(0, 4) : 
                        data.name || "Người dùng",
                    exp: data.exp || 0,
                    level: data.level || 1
                }))
                .sort((a, b) => b.exp - a.exp)
                .slice(0, 10);

            // Prepare fallback text message
            let textFallback = "⭐ 𝐓𝐨𝐩 𝟏𝟎 𝐓ươ𝐧𝐠 𝐓á𝐜 𝐍𝐡𝐢ề𝐮 𝐍𝐡ấ𝐭\n━━━━━━━━━━━━━━━━━━\n\n";
            const rankEmoji = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            let userPosition = null;

            const rewards = {
                1: 300000, 
                2: 100000, 
                3: 50000 
            };

            // Build text fallback and handle rewards
            sortedUsers.forEach((user, index) => {
                const formattedExp = user.exp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                textFallback += `${rankEmoji[index]} ${index + 1}. ${user.name}\n`;
                textFallback += `⭐ Level: ${user.level}\n`;
                textFallback += `💫 EXP: ${formattedExp}\n`;

                if (rewards[index + 1]) {
                    textFallback += `💰 Thưởng: ${rewards[index + 1].toLocaleString('vi-VN')} $/ngày\n`;
                }
                textFallback += '\n';

                if (user.id === senderID) {
                    userPosition = index + 1;
                    if (rewards[index + 1]) {
                        const currentBalance = global.balance[user.id] || 0;
                        global.balance[user.id] = currentBalance + rewards[index + 1];
                        require('../utils/currencies').saveData();
                    }
                }
            });

            // Add user info if not in top 10
            if (userPosition === null && userData[senderID]) {
                const userExp = userData[senderID].exp || 0;
                const userLevel = userData[senderID].level || 1;
                const formattedUserExp = userExp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                
                textFallback += `\n💫 Thông tin của bạn:\n`;
                textFallback += `⭐ Level: ${userLevel}\n`;
                textFallback += `💫 EXP: ${formattedUserExp}`;
            } else if (userPosition !== null) {
                textFallback += `\n🎯 Vị trí của bạn: #${userPosition} trong top 10!`;
            }

            // Add reward info
            textFallback += '\n\n📢 Phần thưởng đặc biệt:';
            textFallback += '\n👑 Top 1: 3000 $/ngày';
            textFallback += '\n🥈 Top 2: +1000 $/ngày';
            textFallback += '\n🥉 Top 3: +500 $/ngày';

            // Fetch user avatars
            const userAvatars = {};
            try {
                await Promise.all(sortedUsers.map(async (user) => {
                    try {
                        const avatarPath = await this.getAvatarPath(user.id);
                        if (avatarPath) {
                            userAvatars[user.id] = avatarPath;
                        }
                    } catch (e) {
                        console.error(`Failed to get avatar for ${user.id}:`, e.message);
                    }
                }));
            } catch (error) {
                console.error("Error fetching avatars:", error);
            }

            try {
                const imagePath = await this.createTopImage(sortedUsers, senderID, userAvatars);
                
                return api.sendMessage({
                    attachment: fs.createReadStream(imagePath)
                }, threadID, (err) => {
                    if (err) api.sendMessage(textFallback, threadID, messageID);
                    
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                });
            } catch (error) {
                console.error("Error with canvas generation:", error);
                return api.sendMessage(textFallback, threadID, messageID);
            }

        } catch (error) {
            console.error("Error in topexp command:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi lấy dữ liệu xếp hạng.", threadID, messageID);
        }
    }
};
