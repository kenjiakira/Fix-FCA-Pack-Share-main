const { updateBalance, updateQuestProgress, getBalance, saveData } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');
const { createUserData } = require('../utils/userData');
const JobSystem = require('../family/JobSystem');
const { JOB_CATEGORIES, JOB_RANKS } = require('../config/family/jobConfig');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

module.exports = {
    name: "work",
    dev: "HNT",
    category: "Games",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,

    
    async createWorkResultImage(result, vipBenefits, senderID) {
        try {
            const width = 750;
            const height = 900;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#1f4037'); 
            gradient.addColorStop(1, '#162c23'); 
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < 80; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            
            const headerHeight = 150;
            const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
            headerGradient.addColorStop(0, 'rgba(24, 90, 69, 0.7)');
            headerGradient.addColorStop(1, 'rgba(16, 63, 47, 0.7)');
            ctx.fillStyle = headerGradient;
            ctx.fillRect(0, 0, width, headerHeight);

            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                const y = i * 15;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            
            const cornerSize = 35;
            const drawCorner = (x, y, flipX, flipY) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                ctx.strokeStyle = '#d4af37'; 
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(cornerSize, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, cornerSize);
                ctx.stroke();
                ctx.restore();
            };

            drawCorner(40, 40, false, false);
            drawCorner(width - 40, 40, true, false);
            drawCorner(40, height - 40, false, true);
            drawCorner(width - 40, height - 40, true, true);

            
            ctx.shadowColor = 'rgba(212, 175, 55, 0.7)'; 
            ctx.shadowBlur = 15;
            ctx.font = 'bold 55px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('CÔNG VIỆC', width / 2, 90);
            ctx.shadowBlur = 0;

            
            const category = Object.entries(JOB_CATEGORIES).find(([_, cat]) => 
                cat.jobs.includes(result.id)
            )?.[1] || { name: "Công việc khác" };
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            const badgeWidth = ctx.measureText(category.name).width + 40;
            const badgeHeight = 40;
            const badgeX = (width - badgeWidth) / 2;
            const badgeY = 110;
            
            
            ctx.beginPath();
            ctx.moveTo(badgeX + 10, badgeY);
            ctx.lineTo(badgeX + badgeWidth - 10, badgeY);
            ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + 10);
            ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - 10);
            ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - 10, badgeY + badgeHeight);
            ctx.lineTo(badgeX + 10, badgeY + badgeHeight);
            ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - 10);
            ctx.lineTo(badgeX, badgeY + 10);
            ctx.quadraticCurveTo(badgeX, badgeY, badgeX + 10, badgeY);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(category.name, width / 2, badgeY + 25);

            
            const startY = 180;

            
            ctx.textAlign = 'center';
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(result.name, width / 2, startY);
            
            
            const lineGradient = ctx.createLinearGradient(100, startY + 20, width - 100, startY + 20);
            lineGradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
            lineGradient.addColorStop(0.5, 'rgba(212, 175, 55, 1)');
            lineGradient.addColorStop(1, 'rgba(212, 175, 55, 0.2)');
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, startY + 20);
            ctx.lineTo(width - 100, startY + 20);
            ctx.stroke();

            
            const levelY = startY + 80;
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px Arial';
            
            
            const levelGradient = ctx.createLinearGradient(width/2 - 100, levelY, width/2 + 100, levelY);
            levelGradient.addColorStop(0, '#d4af37');
            levelGradient.addColorStop(1, '#f1c40f');
            ctx.fillStyle = levelGradient;
            ctx.fillText(`Cấp bậc: ${result.levelName}`, width / 2, levelY);
            
            
            const jobType = result.type || 'shipper';
            const ranks = JOB_RANKS[jobType] || [];
            const currentRankIndex = ranks.findIndex(rank => rank.name === result.levelName);
            const nextRank = ranks[currentRankIndex + 1];

            
            ctx.font = '20px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Số lần làm việc: ${result.workCount}`, width / 2, levelY + 40);

            
            if (nextRank) {
                const progressY = levelY + 70;
                const barWidth = 500;
                const barHeight = 25;
                const barX = (width - barWidth) / 2;
                
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.roundRect(barX, progressY, barWidth, barHeight, 12);
                ctx.fill();
                
                
                const worksNeeded = nextRank.minWork - ranks[currentRankIndex].minWork;
                const currentProgress = result.workCount - ranks[currentRankIndex].minWork;
                const progressPercent = Math.min(1, Math.max(0, currentProgress / worksNeeded));
                
                
                const progressGradient = ctx.createLinearGradient(barX, progressY, barX + barWidth, progressY);
                progressGradient.addColorStop(0, '#4CAF50');
                progressGradient.addColorStop(1, '#8BC34A');
                ctx.fillStyle = progressGradient;
                
                ctx.beginPath();
                ctx.roundRect(barX, progressY, barWidth * progressPercent, barHeight, 12);
                ctx.fill();
                
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${currentProgress}/${worksNeeded}`, width / 2, progressY + 18);
                
                
                ctx.font = '20px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Cấp tiếp theo: ${nextRank.name} (+${((nextRank.bonus - 1) * 100).toFixed(0)}% lương)`, width / 2, progressY + 50);
            } else {
                
                ctx.font = 'bold 24px Arial';
                const maxLevelGradient = ctx.createLinearGradient(width/2 - 120, levelY + 70, width/2 + 120, levelY + 70);
                maxLevelGradient.addColorStop(0, '#FFA500');
                maxLevelGradient.addColorStop(1, '#FF6347');
                ctx.fillStyle = maxLevelGradient;
                ctx.fillText('ĐÃ ĐẠT CẤP TỐI ĐA!', width / 2, levelY + 70);
                
                
                ctx.font = '20px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Thưởng hiện tại: +${((ranks[ranks.length - 1].bonus - 1) * 100).toFixed(0)}% lương`, width / 2, levelY + 110);
            }

            
            const earningsY = levelY + (nextRank ? 140 : 150);
            
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(50, earningsY);
            ctx.lineTo(width - 50, earningsY);
            ctx.stroke();
            
            
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('KẾT QUẢ LÀM VIỆC', width / 2, earningsY + 40);

            
            const tax = Math.floor(result.salary * ((result.tax || 0) / 100));
            const netEarnings = result.salary - tax;
            
            const infoItems = [
                { label: 'Được trả', value: `${result.salary.toLocaleString('vi-VN')} Xu`, color: '#ffffff' },
                { label: 'Thuế thu nhập', value: `${tax.toLocaleString('vi-VN')} Xu (${(result.tax || 0).toFixed(1)}%)`, color: '#ff7675' },{ label: 'Thuế thu nhập', value: `${tax.toLocaleString('vi-VN')} Xu (${result.tax || '0.0'}%)`, color: '#ff7675' },                
                { label: 'Thực lãnh', value: `${netEarnings.toLocaleString('vi-VN')} Xu`, color: '#2ecc71' }
            ];
            
            let infoY = earningsY + 80;
            infoItems.forEach(item => {
                ctx.textAlign = 'right';
                ctx.font = '22px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(item.label + ':', width / 2 - 20, infoY);
                
                ctx.textAlign = 'left';
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = item.color;
                ctx.fillText(item.value, width / 2 + 20, infoY);
                
                infoY += 40;
            });

            
            if (vipBenefits?.workBonus) {
                const vipBonus = Math.floor(result.salary * vipBenefits.workBonus / 100);
                
                
                const vipY = infoY + 20;
                
                
                const vipBadgeGradient = ctx.createLinearGradient(width/2 - 80, vipY, width/2 + 80, vipY);
                vipBadgeGradient.addColorStop(0, '#FFD700');
                vipBadgeGradient.addColorStop(0.5, '#FFA500');
                vipBadgeGradient.addColorStop(1, '#FFD700');
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                const vipBadgeWidth = 160;
                const vipBadgeHeight = 40;
                const vipBadgeX = (width - vipBadgeWidth) / 2;
                
                
                ctx.beginPath();
                ctx.roundRect(vipBadgeX, vipY - 30, vipBadgeWidth, vipBadgeHeight, 20);
                ctx.fill();
                
                ctx.fillStyle = vipBadgeGradient;
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('👑 VIP BONUS 👑', width / 2, vipY);
                
                
                ctx.textAlign = 'right';
                ctx.font = '22px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('Thưởng VIP:', width / 2 - 20, vipY + 40);
                
                ctx.textAlign = 'left';
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#f1c40f';
                ctx.fillText(`+${vipBenefits.workBonus}% (${vipBonus.toLocaleString('vi-VN')} Xu)`, width / 2 + 20, vipY + 40);
            }

            
            const cooldownY = vipBenefits?.workBonus ? infoY + 120 : infoY + 50;
            
            
            const nextCooldown = result.cooldown || 0;
            const cooldownHours = Math.floor(nextCooldown / 3600000);
            const cooldownMinutes = Math.floor((nextCooldown % 3600000) / 60000);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, cooldownY - 20, width, 80);
            
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('THỜI GIAN CHỜ', width / 2, cooldownY + 10);
            
            ctx.font = '22px Arial';
            ctx.fillStyle = '#3498db';
            ctx.fillText(`${cooldownHours > 0 ? `${cooldownHours} giờ ` : ''}${cooldownMinutes} phút`, width / 2, cooldownY + 40);

            
            const footerY = height - 50;
            ctx.font = 'italic 18px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.fillText('AKI Global Job System', width / 2, footerY);
            ctx.font = 'italic 16px Arial';
            ctx.fillText(`${new Date().toLocaleString('vi-VN')}`, width / 2, footerY + 25);

            
            if (result.leveledUp) {
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, width, height);
                
                
                const bannerHeight = 250;
                const bannerY = (height - bannerHeight) / 2;
                
                
                const bannerGradient = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
                bannerGradient.addColorStop(0, 'rgba(39, 174, 96, 0.9)');
                bannerGradient.addColorStop(1, 'rgba(41, 128, 185, 0.9)');
                
                ctx.fillStyle = bannerGradient;
                ctx.beginPath();
                ctx.roundRect(50, bannerY, width - 100, bannerHeight, 20);
                ctx.fill();
                
                
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.strokeRect(60, bannerY + 10, width - 120, bannerHeight - 20);
                
                
                ctx.font = 'bold 50px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText('THĂNG CẤP!', width / 2, bannerY + 80);
                ctx.shadowBlur = 0;
                
                
                ctx.font = 'bold 30px Arial';
                const levelUpGradient = ctx.createLinearGradient(width/2 - 100, bannerY + 130, width/2 + 100, bannerY + 130);
                levelUpGradient.addColorStop(0, '#FFD700');
                levelUpGradient.addColorStop(1, '#FFA500');
                ctx.fillStyle = levelUpGradient;
                ctx.fillText(`${result.leveledUp.name}`, width / 2, bannerY + 130);
                
                ctx.font = '24px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Thưởng: +${((result.leveledUp.bonus - 1) * 100).toFixed(0)}% lương`, width / 2, bannerY + 180);
            }

            const buffer = canvas.toBuffer('image/png');
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const outputPath = path.join(tempDir, `work_${senderID}_${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            
            return outputPath;
        } catch (error) {
            console.error('Error creating work image:', error);
            throw error;
        }
    },

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        try {
            await createUserData(senderID);
        } catch (error) {
            return api.sendMessage("❌ Có lỗi xảy ra khi tạo dữ liệu người dùng!", threadID, messageID);
        }

        const jobSystem = new JobSystem();
        const vipBenefits = getVIPBenefits(senderID);
        
        const cooldown = jobSystem.getWorkCooldown(senderID, vipBenefits);
        
        if (cooldown > 0) {
            const hours = Math.floor(cooldown / 3600000);
            const minutes = Math.floor((cooldown % 3600000) / 60000);
            const seconds = Math.ceil((cooldown % 60000) / 1000);
            
            let timeMessage = '';
            if (hours > 0) timeMessage += `${hours} giờ `;
            if (minutes > 0) timeMessage += `${minutes} phút `;
            if (seconds > 0) timeMessage += `${seconds} giây`;
            
            return api.sendMessage(
                `⏳ Bạn cần nghỉ ngơi ${timeMessage} nữa mới có thể làm việc tiếp!`,
                threadID,
                messageID
            );
        }

        try {
            const result = await jobSystem.work(senderID, vipBenefits);
            
            const nextCooldown = jobSystem.getJobBasedCooldown(senderID);
            const tax = jobSystem.calculateTax(result.salary);
            const netEarnings = result.salary - tax;
            
            
            result.tax = (tax/result.salary)*100; 
            result.cooldown = nextCooldown; 

            await updateBalance(senderID, netEarnings);
            await updateQuestProgress(senderID, "work");

            
            const imagePath = await this.createWorkResultImage(result, vipBenefits, senderID);

            
            let textMessage = "┏━━『 LÀM VIỆC 』━━┓\n\n";
            textMessage += `[🏢] Công việc: ${result.name}\n`;
            textMessage += `[👔] Cấp bậc: ${result.levelName}\n`;
            textMessage += `[💰] Thực lãnh: ${netEarnings.toLocaleString('vi-VN')} Xu\n`;
            textMessage += `[⏳] Thời gian nghỉ: ${Math.floor(nextCooldown / 3600000) > 0 ? `${Math.floor(nextCooldown / 3600000)} giờ ` : ''}${Math.floor((nextCooldown % 3600000) / 60000)} phút\n`;
            
            return api.sendMessage(
                {
                    body: textMessage,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                (err) => {
                    if (err) {
                        api.sendMessage(textMessage, threadID, messageID);
                    }
                    
                    
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            );

        } catch (error) {
            return api.sendMessage(`❌ ${error.message}`, threadID, messageID);
        }
    }
};