const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const vipService = require('../game/vip/vipService');
const { randomInt } = require('crypto');

module.exports = {
    name: "spin",
    dev: "HNT",
    category: "Games",
    info: "Quay vòng quay may mắn để nhận quà",
    usedby: 0,
    onPrefix: true,
    usages: [
        ".spin - Quay vòng quay may mắn (1 lần/ngày, VIP 3 lần/ngày)",
        ".spin check - Kiểm tra số lượt quay còn lại"
    ],
    cooldowns: 5,

    // Định nghĩa các phần thưởng có thể nhận được
    prizes: [
        { id: 1, name: "500 xu", type: "money", value: 500, color: "#FFD700", chance: 30 },
        { id: 2, name: "1,000 xu", type: "money", value: 1000, color: "#FFA500", chance: 25 },
        { id: 3, name: "5,000 xu", type: "money", value: 5000, color: "#FF4500", chance: 15 },
        { id: 4, name: "10,000 xu", type: "money", value: 10000, color: "#FF0000", chance: 10 },
        { id: 5, name: "50,000 xu", type: "money", value: 50000, color: "#8B0000", chance: 4 },
        { id: 6, name: "100,000 xu", type: "money", value: 100000, color: "#800080", chance: 2 },
        { id: 7, name: "10 EXP", type: "exp", value: 10, color: "#00FF00", chance: 30 },
        { id: 8, name: "50 EXP", type: "exp", value: 50, color: "#32CD32", chance: 20 },
        { id: 9, name: "100 EXP", type: "exp", value: 100, color: "#008000", chance: 15 },
        { id: 10, name: "200 EXP", type: "exp", value: 200, color: "#006400", chance: 5 },
        { id: 11, name: "VIP GOLD", type: "vip", value: { packageId: 3, days: 30 }, color: "#FFD700", chance: 0.5, special: true }
    ],

    spinLimits: {
        free: 1,    
        vip3: 3       
    },

    async initSpinData() {
        const spinDataPath = path.join(__dirname, 'json/spin_data.json');
        
        if (!fs.existsSync(path.dirname(spinDataPath))) {
            fs.mkdirSync(path.dirname(spinDataPath), { recursive: true });
        }
        
        if (!fs.existsSync(spinDataPath)) {
            const defaultData = {
                users: {},
                lastReset: Date.now()
            };
            fs.writeFileSync(spinDataPath, JSON.stringify(defaultData, null, 2));
            console.log('Đã khởi tạo tệp dữ liệu spin_data.json');
        }
        
        await this.checkAndResetDailySpins();
    },

    async checkAndResetDailySpins() {
        const spinDataPath = path.join(__dirname, 'json/spin_data.json');
        const spinData = JSON.parse(fs.readFileSync(spinDataPath, 'utf8'));
        
        const now = Date.now();
        const lastResetDate = new Date(spinData.lastReset);
        const currentDate = new Date(now);
        
        if (lastResetDate.getDate() !== currentDate.getDate() || 
            lastResetDate.getMonth() !== currentDate.getMonth() || 
            lastResetDate.getFullYear() !== currentDate.getFullYear()) {
            
            spinData.users = {};
            spinData.lastReset = now;
            
            fs.writeFileSync(spinDataPath, JSON.stringify(spinData, null, 2));
            console.log('Đã reset lượt quay hàng ngày cho tất cả người dùng');
        }
    },

    getUserData(userId) {
        const spinDataPath = path.join(__dirname, 'json/spin_data.json');
        const spinData = JSON.parse(fs.readFileSync(spinDataPath, 'utf8'));
        
        if (!spinData.users[userId]) {
            spinData.users[userId] = {
                spinsUsed: 0,
                lastSpin: 0,
                history: []
            };
            fs.writeFileSync(spinDataPath, JSON.stringify(spinData, null, 2));
        }
        
        return spinData.users[userId];
    },

    updateUserData(userId, userData) {
        const spinDataPath = path.join(__dirname, 'json/spin_data.json');
        const spinData = JSON.parse(fs.readFileSync(spinDataPath, 'utf8'));
        
        spinData.users[userId] = userData;
        fs.writeFileSync(spinDataPath, JSON.stringify(spinData, null, 2));
    },

    getRemainingSpins(userId) {
 
        const vipBenefits = vipService.getVIPBenefits(userId);
        const maxSpins = this.getMaxSpins(vipBenefits.packageId);
        
        const userData = this.getUserData(userId);
        const spinsUsed = userData.spinsUsed || 0;
        
        return Math.max(0, maxSpins - spinsUsed);
    },

    getMaxSpins(vipPackageId) {
        if (vipPackageId === 3) return this.spinLimits.vip3;  
        return this.spinLimits.free;
    },

    selectPrize() {
        const totalChance = this.prizes.reduce((sum, prize) => sum + prize.chance, 0);
        
        const random = Math.random() * totalChance;
        
        let accumulatedChance = 0;
        for (const prize of this.prizes) {
            accumulatedChance += prize.chance;
            if (random <= accumulatedChance) {
                return prize;
            }
        }
        
        return this.prizes[0];
    },

    async applyReward(userId, prize) {
        try {
            switch (prize.type) {
                case "money":
                    global.balance[userId] = (global.balance[userId] || 0) + prize.value;
                    await require("../utils/currencies").saveData();
                    return `💰 Bạn đã nhận được ${prize.value.toLocaleString('vi-VN')} xu!`;
                
                case "exp":
                    await this.updateUserExp(userId, prize.value);
                    return `✨ Bạn đã nhận được ${prize.value} EXP!`;
                
                case "vip":
                    const vipResult = await this.applyVipReward(userId, prize.value);
                    return vipResult;
                
                default:
                    return "❓ Phần thưởng không xác định!";
            }
        } catch (error) {
            console.error("Lỗi khi áp dụng phần thưởng:", error);
            return "❌ Đã xảy ra lỗi khi áp dụng phần thưởng!";
        }
    },

    async updateUserExp(userId, expAmount) {
        try {
            const userDataPath = path.join(__dirname, "../events/cache/userData.json");
            let userData = {};

            try {
                userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
            } catch (error) {
                console.error("Error reading user data:", error);
            }

            if (!userData[userId]) {
                userData[userId] = {
                    exp: 0,
                    level: 1,
                };
            }

            userData[userId].exp = (userData[userId].exp || 0) + expAmount;
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
            return true;
        } catch (error) {
            console.error("Error updating user EXP:", error);
            return false;
        }
    },

    async applyVipReward(userId, vipInfo) {
        try {
            const { packageId, days } = vipInfo;
            
            const currentVip = vipService.checkVIP(userId);
            
            if (currentVip.success && currentVip.packageId >= packageId) {
             
                return `👑 Bạn đã có VIP GOLD nên không thể nhận thêm!`;
            }
            
            const vipResult = vipService.setVIP(userId, packageId, days / 30);
            
            if (vipResult.success) {
                return `👑 Chúc mừng! Bạn đã nhận được VIP GOLD!`;
            } else {
                return "❌ Đã xảy ra lỗi khi áp dụng VIP!";
            }
        } catch (error) {
            console.error("Lỗi khi áp dụng VIP:", error);
            return "❌ Đã xảy ra lỗi khi áp dụng VIP!";
        }
    },

    async drawSpinWheel(selectedPrize) {
        try {
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            const width = 900;
            const height = 900;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            
            const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
            bgGradient.addColorStop(0, '#1a1a2e');
            bgGradient.addColorStop(0.5, '#16213e');
            bgGradient.addColorStop(1, '#0f172a');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);
            
            ctx.beginPath();
            ctx.arc(width/2, height/2, width/3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            ctx.fillRect(width/2 - 300, 30, 600, 80);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(width/2 - 300, 30, 600, 80);
            
            const titleGradient = ctx.createLinearGradient(width/2 - 300, 30, width/2 + 300, 110);
            titleGradient.addColorStop(0, '#ffd700');
            titleGradient.addColorStop(0.5, '#fff8e8');
            titleGradient.addColorStop(1, '#ffd700');
            
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = titleGradient;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText('VÒNG QUAY MAY MẮN', width/2, 70);
            ctx.shadowBlur = 0;
            
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 330;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fill();
            
            const numPrizes = this.prizes.length;
            const anglePerPrize = (2 * Math.PI) / numPrizes;
            
            for (let i = 0; i < numPrizes; i++) {
                const prize = this.prizes[i];
                const startAngle = i * anglePerPrize;
                const endAngle = (i + 1) * anglePerPrize;
                
                const segmentGradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                
                if (prize.special) {
                    segmentGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    segmentGradient.addColorStop(0.5, '#FFD700');
                    segmentGradient.addColorStop(0.7, '#FFA500');
                    segmentGradient.addColorStop(0.9, '#FFD700');
                    segmentGradient.addColorStop(1, '#FFC800');
                } else {
                    segmentGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                    segmentGradient.addColorStop(0.7, prize.color);
                    segmentGradient.addColorStop(1, prize.color);
                }
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                
                ctx.fillStyle = segmentGradient;
                ctx.fill();
                
                if (prize.special) {
                    ctx.strokeStyle = '#FFF200';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([5, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Tên phần thưởng
                const textAngle = startAngle + (anglePerPrize / 2);
                const textX = centerX + (radius * 0.75 * Math.cos(textAngle));
                const textY = centerY + (radius * 0.75 * Math.sin(textAngle));
                
                // Lưu trạng thái canvas
                ctx.save();
                ctx.translate(textX, textY);
                ctx.rotate(textAngle + Math.PI/2);
                
                // Vẽ text với hiệu ứng đặc biệt cho VIP GOLD
                if (prize.special) {
                    ctx.font = 'bold 24px Arial';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.shadowColor = 'rgba(255, 165, 0, 0.9)';
                    ctx.shadowBlur = 15;
                    ctx.fillText(prize.name, 0, 0);
                    ctx.shadowBlur = 0;
                    
                    // Thêm hiệu ứng ngôi sao cho VIP GOLD
                    const starSize = 12;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.moveTo(0, -starSize - 20);
                    for (let j = 0; j < 5; j++) {
                        ctx.lineTo(
                            Math.cos((j * 2 * Math.PI / 5) + Math.PI/2) * starSize,
                            Math.sin((j * 2 * Math.PI / 5) + Math.PI/2) * starSize - 20
                        );
                        ctx.lineTo(
                            Math.cos(((j * 2 + 1) * Math.PI / 5) + Math.PI/2) * (starSize/2),
                            Math.sin(((j * 2 + 1) * Math.PI / 5) + Math.PI/2) * (starSize/2) - 20
                        );
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.font = 'bold 18px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 3;
                    ctx.fillText(prize.name, 0, 0);
                    ctx.shadowBlur = 0;
                }
                
                // Khôi phục trạng thái canvas
                ctx.restore();
            }
            
            // Vẽ vòng tròn trung tâm
            ctx.beginPath();
            ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
            const centerGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 70
            );
            centerGradient.addColorStop(0, '#ffffff');
            centerGradient.addColorStop(1, '#dddddd');
            ctx.fillStyle = centerGradient;
            ctx.fill();
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Thêm hiệu ứng 3D cho trung tâm
            ctx.beginPath();
            ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
            ctx.fillStyle = '#f0f0f0';
            ctx.fill();
            
            // Logo trung tâm
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPIN', centerX, centerY - 10);
            ctx.fillText('& WIN', centerX, centerY + 15);
            
            // Vẽ mũi tên chỉ vào phần thưởng được chọn, hướng vào trong
            const arrowSize = 50;
            const arrowAngle = this.prizes.findIndex(p => p.id === selectedPrize.id) * anglePerPrize + (anglePerPrize / 2);
            
            // Điều chỉnh vị trí mũi tên để nằm ở rìa ngoài của vòng quay
            const arrowX = centerX + ((radius + 20) * Math.cos(arrowAngle));
            const arrowY = centerY + ((radius + 20) * Math.sin(arrowAngle));
            
            ctx.save();
            ctx.translate(arrowX, arrowY);
            // Đổi hướng mũi tên, hướng vào trong
            ctx.rotate(arrowAngle - Math.PI/2);
            
            // Mũi tên nổi bật hơn
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            // Vẽ mũi tên hướng vào trong
            ctx.moveTo(0, -arrowSize);  // Điểm mũi tên
            ctx.lineTo(-arrowSize/2, arrowSize/2);  // Điểm bên trái
            ctx.lineTo(arrowSize/2, arrowSize/2);   // Điểm bên phải
            ctx.closePath();
            
            // Gradient cho mũi tên
            const arrowGradient = ctx.createLinearGradient(0, -arrowSize, 0, arrowSize/2);
            arrowGradient.addColorStop(0, '#ff0000');
            arrowGradient.addColorStop(1, '#880000');
            ctx.fillStyle = arrowGradient;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
            ctx.shadowBlur = 0;
            
            // Vẽ khung phần thưởng
            const rewardBoxY = height - 120;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(width/2 - 350, rewardBoxY - 20, 700, 100);
            ctx.strokeStyle = selectedPrize.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(width/2 - 350, rewardBoxY - 20, 700, 100);
            
            // Vẽ phần thưởng đã chọn
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CHÚC MỪNG! PHẦN THƯỞNG CỦA BẠN:', width/2, rewardBoxY);
            
            ctx.font = 'bold 36px Arial';
            
            // Hiệu ứng đặc biệt cho VIP GOLD khi được chọn
            if (selectedPrize.special) {
                // Hiệu ứng gradient màu vàng sáng
                const vipGradient = ctx.createLinearGradient(width/2 - 150, rewardBoxY + 40, width/2 + 150, rewardBoxY + 40);
                vipGradient.addColorStop(0, '#FFD700');
                vipGradient.addColorStop(0.5, '#FFFFFF');
                vipGradient.addColorStop(1, '#FFD700');
                ctx.fillStyle = vipGradient;
                
                // Thêm hiệu ứng glow
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 15;
                ctx.fillText(selectedPrize.name, width/2, rewardBoxY + 40);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = selectedPrize.color;
                ctx.fillText(selectedPrize.name, width/2, rewardBoxY + 40);
            }
            
            // Lưu và trả về đường dẫn ảnh
            const imagePath = path.join(cacheDir, `spin_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);
            
            return imagePath;
        } catch (error) {
            console.error("Lỗi khi vẽ vòng quay:", error);
            return null;
        }
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const command = target[0]?.toLowerCase();
        
        try {
            // Khởi tạo dữ liệu nếu cần
            await this.initSpinData();
            
            // Kiểm tra lệnh
            if (command === "check") {
                const remainingSpins = this.getRemainingSpins(senderID);
                const vipBenefits = vipService.getVIPBenefits(senderID);
                const maxSpins = this.getMaxSpins(vipBenefits.packageId);
                
                let vipStatus = "Người dùng thường";
                if (vipBenefits.packageId === 3) vipStatus = "VIP GOLD";
                
                return api.sendMessage(
                    `🔄 THÔNG TIN VÒNG QUAY MAY MẮN\n` +
                    `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n` +
                    `👤 Trạng thái: ${vipStatus}\n` +
                    `🎡 Lượt quay tối đa: ${maxSpins}/ngày\n` +
                    `⏳ Lượt quay còn lại: ${remainingSpins}`,
                    threadID, messageID
                );
            }
            
            // Kiểm tra lượt quay còn lại
            const remainingSpins = this.getRemainingSpins(senderID);
            
            if (remainingSpins <= 0) {
                return api.sendMessage(
                    `❌ Bạn đã hết lượt quay hôm nay!\n` +
                    `⏰ Vui lòng quay lại vào ngày mai hoặc nâng cấp VIP GOLD để có thêm lượt quay.`,
                    threadID, messageID
                );
            }
            
            // Chọn phần thưởng
            const prize = this.selectPrize();
            
            // Vẽ vòng quay
            api.sendMessage("🎡 Đang quay vòng quay may mắn...", threadID, messageID);
            const wheelImage = await this.drawSpinWheel(prize);
            
            if (!wheelImage) {
                return api.sendMessage("❌ Đã xảy ra lỗi khi tạo vòng quay!", threadID);
            }
            
            // Áp dụng phần thưởng
            const rewardMessage = await this.applyReward(senderID, prize);
            
            // Cập nhật dữ liệu người dùng
            const userData = this.getUserData(senderID);
            userData.spinsUsed += 1;
            userData.lastSpin = Date.now();
            userData.history.push({
                timestamp: Date.now(),
                prizeId: prize.id,
                prizeName: prize.name
            });
            
            this.updateUserData(senderID, userData);
            
            // Gửi kết quả
            const remainingAfterSpin = this.getRemainingSpins(senderID);
            
            api.sendMessage(
                {
                    body: `🎡 KẾT QUẢ VÒNG QUAY MAY MẮN\n` +
                          `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
                          `${rewardMessage}\n\n` +
                          `⏳ Lượt quay còn lại: ${remainingAfterSpin}`,
                    attachment: fs.createReadStream(wheelImage)
                },
                threadID,
                (err) => {
                    if (err) console.error("Lỗi khi gửi kết quả vòng quay:", err);
                    
                    // Xóa file ảnh sau khi gửi
                    try {
                        fs.unlinkSync(wheelImage);
                    } catch (e) {
                        console.error("Lỗi khi xóa file ảnh:", e);
                    }
                }
            );
        } catch (error) {
            console.error("Lỗi trong lệnh spin:", error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh!", threadID);
        }
    }
};