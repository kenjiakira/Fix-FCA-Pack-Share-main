const { JOB_CATEGORIES, JOBS, JOB_RANKS } = require('../config/family/jobConfig');
const fs = require('fs');
const {getBalance} = require('../utils/currencies');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const JobSystem = require('../family/JobSystem');
const jobSystem = new JobSystem();

module.exports = {
    name: "job",
    dev: "HNT",
    category: "Games",
    usedby: 0,
    info: "Hệ thống tìm việc làm",
    onPrefix: true,
    usages: ".job [list/apply/info]",
    cooldowns: 5,

    async createJobInfoImage(senderID, job, currentJob, userName, balance, workCount, currentLevel, levels) {
        try {
            const width = 800;
            const height = 1000;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#00796b"); 
            gradient.addColorStop(0.5, "#00695c"); 
            gradient.addColorStop(1, "#004d40");  
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            for (let i = 0; i < 80; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = Math.random() * 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const offset = i * 180;
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

            const headerGradient = ctx.createLinearGradient(0, 0, width, 150);
            headerGradient.addColorStop(0, "rgba(0, 77, 64, 0.8)");
            headerGradient.addColorStop(1, "rgba(0, 121, 107, 0.8)");
            ctx.fillStyle = headerGradient;
            ctx.fillRect(0, 0, width, 150);

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

            ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
            ctx.shadowBlur = 15;
            ctx.font = "bold 45px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("THÔNG TIN CÔNG VIỆC", width / 2, 90);
            ctx.shadowBlur = 0;

            const lineGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
            lineGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
            lineGradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
            lineGradient.addColorStop(1, "rgba(255, 255, 255, 0.2)");
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(100, 120);
            ctx.lineTo(width - 100, 120);
            ctx.stroke();

            let avatarPath = null;
            try {
                avatarPath = await this.getAvatarPath(senderID);
            } catch (avatarErr) {
                console.error("Error getting avatar:", avatarErr);
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(50, 170, width - 100, 130);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, 170, width - 100, 130);

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
                    
                    ctx.strokeStyle = "#FFD700";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    const placeholderGradient = ctx.createLinearGradient(75, 185, 175, 285);
                    placeholderGradient.addColorStop(0, "#00695c");
                    placeholderGradient.addColorStop(1, "#004d40");
                    ctx.fillStyle = placeholderGradient;
                    ctx.fill();
                    
                    const initial = (userName?.charAt(0) || "?").toUpperCase();
                    ctx.font = "bold 50px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.fillText(initial, 125, 250);
                    
                    ctx.strokeStyle = "#FFD700";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(125, 235, 50, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } catch (avatarDrawErr) {
                console.error("Error drawing avatar:", avatarDrawErr);
            }

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.fillText(`${userName || "Người dùng"} #${senderID.substring(0, 5)}`, 200, 215);
            ctx.restore();
            
            const balanceGradient = ctx.createLinearGradient(300, 245, 350, 245);
            balanceGradient.addColorStop(0, "#ffce54");
            balanceGradient.addColorStop(1, "#f9a825");
            ctx.font = "22px Arial";
            ctx.fillStyle = balanceGradient;
            ctx.fillText(`💰 ${formatNumber(balance)} $`, 300, 250);

            let startY = 330;

            const jobInfoGradient = ctx.createLinearGradient(50, startY, width - 50, startY + 170);
            jobInfoGradient.addColorStop(0, "rgba(0, 137, 123, 0.4)");
            jobInfoGradient.addColorStop(1, "rgba(0, 77, 64, 0.2)");
            ctx.fillStyle = jobInfoGradient;
            ctx.fillRect(50, startY, width - 100, 170);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, startY, width - 100, 170);

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 30px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(currentJob.name, width / 2, startY + 40);
            ctx.restore();

            const salaryGradient = ctx.createLinearGradient(width/2 - 150, startY + 80, width/2 + 150, startY + 80);
            salaryGradient.addColorStop(0, "#64ffda");
            salaryGradient.addColorStop(1, "#00bfa5");
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = salaryGradient;
            ctx.textAlign = "center";
            ctx.fillText(`💰 ${formatNumber(currentJob.salary)} $/lần`, width/2, startY + 80);

            ctx.font = "24px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillText(`📅 Bắt đầu làm việc: ${new Date(job.currentJob.startDate).toLocaleDateString('vi-VN')}`, width/2, startY + 120);

            ctx.fillText(`📈 Số lần làm việc: ${workCount}`, width/2, startY + 160);

            startY += 200;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 30px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center"; // Thay đổi từ "left" sang "center"
            ctx.fillText("Cấp bậc hiện tại", width / 2, startY); // Đặt x-coord vào giữa canvas
            ctx.restore();
            
            // Tạo gradient ở giữa
            const levelGradient = ctx.createLinearGradient(width/2 - 150, startY + 40, width/2 + 150, startY + 40);
            levelGradient.addColorStop(0, "#64ffda");
            levelGradient.addColorStop(1, "#00bfa5");
            ctx.font = "bold 28px Arial";
            ctx.fillStyle = levelGradient;
            ctx.textAlign = "center"; // Đặt căn giữa cho level name
            ctx.fillText(`👔 ${currentLevel?.name || 'Tập sự'}`, width / 2, startY + 40); // Đặt x-coord vào giữa
            startY += 70;

            if (levels && levels.length > 0) {
                const nextLevel = levels.find(level => level.minWork > workCount);
                const currentLevelObj = currentLevel || { minWork: 0, name: "Tập sự", bonus: 1 };
                const nextLevelObj = nextLevel || { minWork: currentLevelObj.minWork + 50, name: "Cao cấp", bonus: currentLevelObj.bonus + 0.1 };
                
                const progress = nextLevelObj.minWork > currentLevelObj.minWork ? 
                    Math.min(100, ((workCount - currentLevelObj.minWork) / (nextLevelObj.minWork - currentLevelObj.minWork)) * 100) : 100;

                ctx.font = "22px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                ctx.fillText(`Tiến độ lên cấp tiếp theo: ${Math.floor(progress)}%`, 70, startY);

                const barWidth = width - 140;
                const barHeight = 30;
                const barX = 70;
                const barY = startY + 20;
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                const progressWidth = (progress / 100) * barWidth;
                const progressGradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY + barHeight);
                progressGradient.addColorStop(0, "#4fc3f7");
                progressGradient.addColorStop(1, "#2196f3");
                ctx.fillStyle = progressGradient;
                ctx.fillRect(barX, barY, progressWidth, barHeight);
                
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
                
                ctx.font = "18px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.textAlign = "right";
                ctx.fillText(`Đạt ${nextLevelObj.minWork} lần làm việc để lên: ${nextLevelObj.name}`, width - 70, startY + 70);
                
                if (currentLevel && currentLevel.bonus > 1) {
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#ffcc80";
                    ctx.fillText(`✨ Thưởng hiện tại: +${((currentLevel.bonus - 1) * 100).toFixed(0)}% lương`, 70, startY + 70);
                }
            }

            startY += 100;
            if (levels && levels.length > 0) {
                ctx.font = "bold 26px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                ctx.fillText("Cấp bậc nghề nghiệp", 70, startY);
                
                startY += 20;
                
                const totalItems = levels.length;
                let itemsPerRow;
                
                if (totalItems === 5) {
                    itemsPerRow = 3;
                } else {
                    itemsPerRow = 2; 
                }
                
                const itemWidth = (width - 140) / Math.max(3, itemsPerRow);
                const itemHeight = 70;
                
                for (let i = 0; i < levels.length; i++) {
                    const level = levels[i];
                    
                    let row, col, x;
                    if (totalItems === 5) {
           
                        if (i < 3) { 
                            row = 0;
                            col = i;
                        } else { 
                            row = 1;
                            col = i - 3 + 0.5; 
                        }
                        x = 70 + (col * itemWidth);
                    } else {
                        row = Math.floor(i / itemsPerRow);
                        col = i % itemsPerRow;
                        x = 70 + (col * itemWidth);
                    }
                    
                    const y = startY + (row * itemHeight) + 20;
                    
                    const isCurrentLevel = currentLevel && level.name === currentLevel.name;
                    
                    ctx.fillStyle = isCurrentLevel 
                        ? 'rgba(0, 137, 123, 0.6)' 
                        : 'rgba(255, 255, 255, 0.1)';   
                    
                    const radius = 10;
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + itemWidth - radius, y);
                    ctx.quadraticCurveTo(x + itemWidth, y, x + itemWidth, y + radius);
                    ctx.lineTo(x + itemWidth, y + itemHeight - radius);
                    ctx.quadraticCurveTo(x + itemWidth, y + itemHeight, x + itemWidth - radius, y + itemHeight);
                    ctx.lineTo(x + radius, y + itemHeight);
                    ctx.quadraticCurveTo(x, y + itemHeight, x, y + itemHeight - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.fill();
                    
                    if (isCurrentLevel) {
                        ctx.save();
                        ctx.strokeStyle = "#64ffda";
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    }
                    
                    ctx.font = isCurrentLevel ? "bold 22px Arial" : "22px Arial";
                    ctx.fillStyle = isCurrentLevel ? "#ffffff" : "rgba(255, 255, 255, 0.8)";
                    ctx.textAlign = "left";
                    ctx.fillText(level.name, x + 15, y + 25);
                    
                    ctx.font = "18px Arial";
                    ctx.fillText(`${isCurrentLevel ? '✅' : '🔒'} ${level.minWork} lần làm việc`, x + 15, y + 55);
                    
                    if (level.bonus) {
                        const bonusText = `+${((level.bonus - 1) * 100).toFixed(0)}%`;
                        ctx.textAlign = "right";
                        ctx.fillStyle = "#ffcc80";
                        ctx.fillText(bonusText, x + itemWidth - 5, y + 22);
                    }
                }
            }

            // Timestamp with teal gradient
            const timestampGradient = ctx.createLinearGradient(width/2 - 150, height - 20, width/2 + 150, height - 20);
            timestampGradient.addColorStop(0, "#64ffda");
            timestampGradient.addColorStop(1, "#00bfa5");
            ctx.font = "italic 20px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = timestampGradient;
            ctx.fillText(`Cập nhật: ${new Date().toLocaleString("vi-VN")}`, width / 2, height - 15);
           
            // Save and return image
            const buffer = canvas.toBuffer("image/png");
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const outputPath = path.join(tempDir, `job_${senderID}_${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            
            return outputPath;
        } catch (error) {
            console.error("Error creating job info image:", error);
            throw error;
        }
    },

    async getAvatarPath(userId) {
        try {
            // Ensure avatars directory exists
            const avatarsDir = path.join(__dirname, './cache/avatars');
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
                    gradient.addColorStop(0, '#00695c');
                    gradient.addColorStop(1, '#004d40');
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
            const defaultAvatarPath = path.join(__dirname, './cache/avatar.jpg');
            if (fs.existsSync(defaultAvatarPath)) {
                return defaultAvatarPath;
            }
            return null;
        }
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            const job = jobSystem.getJob(senderID);
            const education = jobSystem.loadEducation(senderID);

            if (!command) {
                await api.sendMessage(
                    "┏━━『 HỆ THỐNG VIỆC LÀM 』━━┓\n\n" +
                    "🎯 HƯỚNG DẪN SỬ DỤNG:\n\n" +
                    "📋 .job list\n└ Xem danh sách việc làm\n\n" +
                    "📋 .job category <loại>\n└ Xem việc làm theo ngành\n\n" +
                    "📝 .job apply <mã>\n└ Ứng tuyển việc làm\n\n" +
                    "ℹ️ .job info\n└ Xem công việc hiện tại\n\n" +
                    "❌ .job quit\n└ Nghỉ việc hiện tại\n\n" +
                    "💼 .job search\n└ Tìm việc phù hợp với bằng cấp\n\n" +
                    "💡 Ghi chú: Trình độ học vấn càng\ncao thì cơ hội việc làm càng tốt\n" +
                    "\n┗━━━━━━━━━━━━━━━━━┛",
                    threadID
                );
                return;
            }

            switch (command) {
                case "list": {
                    let msg = "┏━━『 NGÀNH NGHỀ 』━━┓\n\n";
                    
                    Object.entries(JOB_CATEGORIES).forEach(([id, category], index) => {
                        const jobsInCategory = category.jobs.length;
                        msg += `${index + 1}. ${this.getCategoryIcon(id)} ${category.name.toUpperCase()}\n`;
                        msg += `├ Mã: ${id}\n`;
                        msg += `├ Mô tả: ${category.desc}\n`;
                        msg += `└ Số việc: ${jobsInCategory}\n\n`;
                    });

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += "➤ Xem chi tiết: .job category <mã>\n";
                    msg += "   VD: .job category tech\n\n";
                    msg += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " $";
                    
                    await api.sendMessage(msg, threadID);
                    return;
                }

                case "apply": {
                    const jobId = target[1]?.toLowerCase();
                    if (!jobId || !JOBS[jobId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã công việc hợp lệ!", threadID);
                    }

                    const jobData = jobSystem.getJob(senderID);
                    if (jobData.lastQuit) {
                        const timeSinceQuit = Date.now() - jobData.lastQuit;
                        if (timeSinceQuit < jobSystem.QUIT_COOLDOWN) {
                            const timeLeft = jobSystem.QUIT_COOLDOWN - timeSinceQuit;
                            const hours = Math.floor(timeLeft / 3600000);
                            const minutes = Math.floor((timeLeft % 3600000) / 60000);
                            return api.sendMessage(`❌ Bạn vừa nghỉ việc! Vui lòng đợi ${minutes} phút nữa để xin việc mới!`, threadID);
                        }
                    }

                    try {
                        const selectedJob = await jobSystem.applyForJob(senderID, jobId);
                        return api.sendMessage(
                            "🎉 CHÚC MỪNG BẠN ĐƯỢC NHẬN VÀO LÀM VIỆC!\n\n" +
                            `Công việc: ${selectedJob.name}\n` +
                            `Lương: ${formatNumber(selectedJob.salary)} $/lần\n\n` +
                            "💡 Dùng .work để bắt đầu làm việc",
                            threadID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ ${error.message}`, threadID);
                    }
                }

                case "info": {
                    if (!job.currentJob) {
                        return api.sendMessage("❌ Bạn chưa có việc làm!\n vui lòng apply job trước bằng cách gõ\njob apply [mã job]", threadID);
                    }

                    const currentJob = JOBS[job.currentJob.id];
                    const jobType = currentJob.type || 'shipper';

                    const workCount = jobSystem.workCountTracker.getCount(senderID);
                    
                    const levels = JOB_RANKS[jobType] || []; 
                    const currentLevel = jobSystem.getJobLevel(jobType, workCount);
                    const balance = await getBalance(senderID);
                    
                    let userName = job.displayName || "Người làm việc";
                    
                    try {
                        const imagePath = await this.createJobInfoImage(
                            senderID, 
                            job, 
                            currentJob, 
                            userName, 
                            balance, 
                            workCount, 
                            currentLevel, 
                            levels
                        );
                        
                        return api.sendMessage(
                            { 
                                body: "💼 Thông tin công việc của bạn:", 
                                attachment: fs.createReadStream(imagePath) 
                            }, 
                            threadID, 
                            () => {
                                if (fs.existsSync(imagePath)) {
                                    fs.unlinkSync(imagePath);
                                }
                            }
                        );
                    } catch (imageError) {
                        console.error("Error creating job info image:", imageError);
                        
                        // Fallback to text message
                        let levelInfo = "\n📊 THÔNG TIN CẤP BẬC:\n";
                        levels.forEach(level => {
                            const isCurrentLevel = currentLevel && level.name === currentLevel.name;
                            levelInfo += `${isCurrentLevel ? '➤' : '•'} ${level.name}\n`;
                            levelInfo += `  ├ Yêu cầu: ${level.minWork} lần làm việc\n`;
                            if (level.bonus) {
                                levelInfo += `  └ Thưởng: +${((level.bonus - 1) * 100).toFixed(0)}% lương\n`;
                            }
                        });

                        const infoMsg = await api.sendMessage(
                            "┏━━『 THÔNG TIN CÔNG VIỆC 』━━┓\n\n" +
                            `💼 Công việc: ${currentJob.name}\n` +
                            `💰 Lương: ${formatNumber(currentJob.salary)} $/lần\n` +
                            `📅 Ngày bắt đầu: ${new Date(job.currentJob.startDate).toLocaleDateString()}\n` +
                            `📈 Số lần làm việc: ${workCount}\n` +
                            `👔 Cấp bậc hiện tại: ${currentLevel?.name || 'Tập sự'}\n` +
                            `📝 Mô tả: ${currentJob.description}\n` +
                            levelInfo +
                            "\n💡 Dùng .work để làm việc kiếm tiền\n" +
                            "\n┗━━━━━━━━━━━━━━━━━┛",
                            threadID
                        );
                        setTimeout(() => {
                            api.unsendMessage(infoMsg.messageID);
                        }, 30000);
                        return;
                    }
                }

                case "quit": {
                    if (!job.currentJob) {
                        return api.sendMessage("❌ Bạn chưa có việc làm!\n vui lòng apply job trước bằng cách gõ\njob apply [mã job]", threadID);
                    }

                    try {
                        const oldJob = jobSystem.quitJob(senderID);
                        return api.sendMessage(
                            `💼 Bạn đã nghỉ việc ${oldJob.name} thành công!\n` +
                                "⏳ Bạn cần đợi 1 giờ để có thể xin việc lại.\n" +
                            "💡 Dùng .job list để xem danh sách việc làm",
                            threadID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ ${error.message}`, threadID);
                    }
                }

                case "category": {
                    const categoryId = target[1]?.toLowerCase();
                    if (!categoryId || !JOB_CATEGORIES[categoryId]) {
                        let msg = "❌ Ngành nghề không hợp lệ!\n\nCác ngành nghề hiện có:\n";
                        Object.entries(JOB_CATEGORIES).forEach(([id, cat]) => {
                            msg += `- ${id}: ${cat.name}\n`;
                        });
                        return api.sendMessage(msg, threadID);
                    }

                    const category = JOB_CATEGORIES[categoryId];
                    let msg = `┏━━『 ${category.name.toUpperCase()} 』━━┓\n\n`;
                    msg += `📝 ${category.desc}\n\n`;

                    for (const jobId of category.jobs) {
                        const job = JOBS[jobId];
                        if (!job) continue;

                        const canApply = jobSystem.checkRequirements(job.requirements, education.degrees);
                        msg += `${canApply ? '✅' : '❌'} ${job.name}\n`;
                        msg += `├ Mã: ${jobId}\n`;
                        msg += `├ Lương: 💰 ${formatNumber(job.salary)} $/lần\n`;
                        msg += `└ Yêu cầu: ${job.requirements.length} bằng cấp\n\n`;
                    }

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += "➤ Xem chi tiết: .job detail <mã>\n";
                    msg += "➤ Ứng tuyển: .job apply <mã>";
                    
                    await api.sendMessage(msg, threadID);
                    return;
                }

                case "search": {
                    let availableJobs = [];

                    for (const [jobId, jobData] of Object.entries(JOBS)) {
                        if (jobSystem.checkRequirements(jobData.requirements, education.degrees)) {
                            availableJobs.push({
                                id: jobId,
                                name: jobData.name,
                                salary: jobData.salary,
                                requirements: jobData.requirements.length
                            });
                        }
                    }

                    // Sort by salary (descending)
                    availableJobs.sort((a, b) => b.salary - a.salary);

                    let msg = "┏━━『 VIỆC LÀM PHÙ HỢP 』━━┓\n\n";
                    
                    if (availableJobs.length === 0) {
                        msg += "❌ Không tìm thấy việc làm phù hợp!\n";
                        msg += "💡 Hãy học thêm bằng cấp để mở khóa\n";
                        msg += "   công việc tốt hơn (.study list)";
                    } else {
                        msg += `🎉 Tìm thấy ${availableJobs.length} việc làm phù hợp:\n\n`;
                        
                        availableJobs.slice(0, 10).forEach((job, index) => {
                            msg += `${index + 1}. ${job.name}\n`;
                            msg += `   ├ Mã: ${job.id}\n`;
                            msg += `   ├ Lương: 💰 ${formatNumber(job.salary)} $\n`;
                            msg += `   └ Yêu cầu: ${job.requirements} bằng cấp\n\n`;
                        });
                        
                        msg += "💡 HƯỚNG DẪN:\n";
                        msg += "➤ Ứng tuyển: .job apply <mã>\n";
                    }
                    
                    msg += "\n┗━━━━━━━━━━━━━━━━━┛";
                    await api.sendMessage(msg, threadID);
                    return;
                }

                case "detail": {
                    const jobId = target[1]?.toLowerCase();
                    if (!jobId || !JOBS[jobId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã công việc hợp lệ!", threadID);
                    }

                    const jobData = JOBS[jobId];
                    const DEGREES = require('../config/family/educationConfig').DEGREES;
                    
                    let msg = "┏━━『 CHI TIẾT CÔNG VIỆC 』━━┓\n\n";
                    msg += `💼 ${jobData.name}\n`;
                    msg += `├ Mã: ${jobId}\n`;
                    msg += `├ Lương: 💰 ${formatNumber(jobData.salary)} $/lần\n`;
                    msg += `├ Loại: ${jobData.type || 'Không xác định'}\n`;
                    msg += `├ Mô tả: ${jobData.description}\n`;
                    
                    if (jobData.requirements.length > 0) {
                        msg += "├ Yêu cầu bằng cấp:\n";
                        jobData.requirements.forEach(reqId => {
                            const reqDegree = DEGREES[reqId];
                            if (reqDegree) {
                                msg += `   • ${reqDegree.name}\n`;
                            }
                        });
                    } else {
                        msg += "├ Yêu cầu: Không có\n";
                    }
                    
                    msg += "\n┗━━━━━━━━━━━━━━━━━┛";
                    await api.sendMessage(msg, threadID);
                    return;
                }
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    loadJob(userID) {
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        try {
            if (!fs.existsSync(jobPath)) {
                fs.writeFileSync(jobPath, '{}');
            }
            const data = JSON.parse(fs.readFileSync(jobPath));
            return data[userID] || { currentJob: null };
        } catch (error) {
            console.error(error);
            return { currentJob: null };
        }
    },

    saveJob(userID, data) {
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        try {
            let jobData = {};
            if (fs.existsSync(jobPath)) {
                jobData = JSON.parse(fs.readFileSync(jobPath));
            }
            jobData[userID] = data;
            fs.writeFileSync(jobPath, JSON.stringify(jobData, null, 2));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getCategoryIcon(categoryId) {
        const icons = {
            "tech": "💻",
            "finance": "💰",
            "service": "🛍️",
            "education": "📚",
            "medical": "⚕️",
            "food": "🍽️",
            "transport": "🚗",
            "retail": "🏪"
        };
        return icons[categoryId] || "💼";
    }
};
