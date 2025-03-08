const { getBalance, updateBalance } = require('../utils/currencies');
const { DEGREES, STUDY_TIME, LEARNING_SPEED, DEGREE_CATEGORIES } = require('../config/family/educationConfig');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    name: "study",
    dev: "HNT",
    category: "Games",
    usedby: 0,
    info: "Hệ thống học tập",
    onPrefix: true,
    usages: ".study [list/category/enroll/info]",
    cooldowns: 5,

    generateTitle(education) {
  
        let title = "Người học";
        
        const highSchools = ["THPT Chuyên Lê Hồng Phong", "THPT Chuyên Trần Đại Nghĩa", "THPT Nguyễn Thị Minh Khai", 
            "THPT Lê Quý Đôn", "THPT Chu Văn An", "THPT Nguyễn Huệ", "THPT Phan Đình Phùng", "THPT Bùi Thị Xuân"];
        
        const universities = ["ĐHQG Hà Nội", "ĐHQG TP.HCM", "ĐH Bách Khoa", "ĐH Kinh tế", "ĐH Ngoại thương",
            "ĐH Sư phạm", "ĐH Y Dược", "ĐH FPT", "ĐH Công nghệ", "ĐH Khoa học Tự nhiên", "Học viện Ngân hàng"];
        
        const colleges = ["CĐ FPT", "CĐ Công nghệ", "CĐ Kinh tế", "CĐ Y tế", "CĐ Nghề", "CĐ Du lịch"];
        
        const specializedInstitutes = ["Học viện Âm nhạc", "Học viện Hàng không", "Học viện Kỹ thuật Quân sự", 
            "Học viện Công nghệ Bưu chính Viễn thông", "Học viện Ngoại giao", "Trung tâm John Hopkins"];
        
        const getRandomName = (array) => array[Math.floor(Math.random() * array.length)];
        
        if (!education.degrees || education.degrees.length === 0) {
            return education.currentDegree ? "Người mới nhập học" : "Người tự học";
        }
        
        if (education.currentDegree) {
            const degreeId = education.currentDegree.id;
            
            if (degreeId.startsWith('e')) {
                return `HS ${getRandomName(highSchools)}`;
            }
            else if (degreeId.startsWith('c')) {
                return `SV ${getRandomName(colleges)}`;
            }
            else if (degreeId.startsWith('u')) {
                return `SV ${getRandomName(universities)}`;
            }
            else if (degreeId.startsWith('cert')) {
                return "Học viên chuyên môn";
            }
            else if (degreeId.startsWith('s')) {
                return `HV ${getRandomName(specializedInstitutes)}`;
            }
        }
        
        const highestDegree = education.degrees[education.degrees.length - 1];
        
        if (highestDegree === "e1" || highestDegree === "highschool") {
            return "Tốt nghiệp THPT";
        }
        else if (highestDegree.startsWith('c')) {
            return `Cử nhân ${getRandomName(colleges)}`;
        }
        else if (highestDegree.startsWith('u')) {
            if (highestDegree.includes('med')) {
                return "Bác sĩ";
            } else if (highestDegree.includes('law')) {
                return "Luật sư";
            } else if (highestDegree.includes('eng')) {
                return "Kỹ sư";
            } else if (highestDegree.includes('tech')) {
                return "Chuyên gia Công nghệ";
            } else {
                return `Cử nhân ${getRandomName(universities)}`;
            }
        }
        else if (highestDegree.startsWith('m')) {
            return "Thạc sĩ";
        }
        else if (highestDegree.startsWith('s') && highestDegree.includes('phd')) {
            const fields = ["Khoa học", "Công nghệ", "Kinh tế", "Giáo dục", "Y học", "Toán học"];
            return `Tiến sĩ ${fields[Math.floor(Math.random() * fields.length)]}`;
        }
        else if (highestDegree.startsWith('cert')) {
            const certTypes = ["Chứng chỉ hành nghề", "Chuyên gia tư vấn", "Chuyên viên", "Kỹ thuật viên"];
            return certTypes[Math.floor(Math.random() * certTypes.length)];
        }
        
        return title;
    },

    async createStudyInfoImage(education, senderID, userName, balance) {
        try {
            const width = 800;
            const height = 1000;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#1a237e");  
            gradient.addColorStop(0.5, "#0d47a1"); 
            gradient.addColorStop(1, "#01579b");  
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
            headerGradient.addColorStop(0, "rgba(13, 71, 161, 0.8)");
            headerGradient.addColorStop(1, "rgba(25, 118, 210, 0.8)");
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
            ctx.fillText("THÔNG TIN HỌC VẤN", width / 2, 90);
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
                    placeholderGradient.addColorStop(0, "#4a148c");
                    placeholderGradient.addColorStop(1, "#311b92");
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
            const title = this.generateTitle(education);
            ctx.fillText(`${title} #${senderID.substring(0, 5)}`, 200, 215);
            ctx.restore();
            
            
            const balanceGradient = ctx.createLinearGradient(300, 245, 450, 245);
            balanceGradient.addColorStop(0, "#ffce54");
            balanceGradient.addColorStop(1, "#f9a825");
            ctx.font = "22px Arial";
            ctx.fillStyle = balanceGradient;
            ctx.fillText(`💰 ${formatNumber(balance)} Xu`, 300, 250);
            ctx.restore();

            let startY = 330;

            
            const summaryGradient = ctx.createLinearGradient(50, startY, width - 50, startY + 100);
            summaryGradient.addColorStop(0, "rgba(25, 118, 210, 0.4)");
            summaryGradient.addColorStop(1, "rgba(13, 71, 161, 0.2)");
            ctx.fillStyle = summaryGradient;
            ctx.fillRect(50, startY, width - 100, 100);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(50, startY, width - 100, 100);

            
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.fillText("Trình độ học vấn", 70, startY + 40);
            
            
            if (education.degrees.length === 0) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.font = "24px Arial";
                ctx.fillText("Chưa tốt nghiệp", 70, startY + 80);
            } else {
                const highestDegree = education.degrees[education.degrees.length - 1];
                const degreeTextGradient = ctx.createLinearGradient(70, startY + 80, 350, startY + 80);
                degreeTextGradient.addColorStop(0, "#64ffda");
                degreeTextGradient.addColorStop(1, "#00bfa5");
                ctx.font = "24px Arial";
                ctx.fillStyle = degreeTextGradient;
                ctx.fillText(`🎓 ${DEGREES[highestDegree].name}`, 70, startY + 80);
            }
            ctx.restore();

            startY += 120;

            
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 26px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.fillText("Bằng cấp theo loại", 70, startY + 20);
            ctx.restore();

            startY += 20;

            if (education.degrees.length > 0) {
                const categories = {};
                education.degrees.forEach(degreeId => {
                    for (const [catId, category] of Object.entries(DEGREE_CATEGORIES)) {
                        if (category.degrees.includes(degreeId)) {
                            if (!categories[catId]) categories[catId] = [];
                            categories[catId].push(degreeId);
                            break;
                        }
                    }
                });

                
                startY += 20;
                let index = 0;
                for (const [catId, degrees] of Object.entries(categories)) {
                    if (degrees.length > 0) {
                        const categoryY = startY + (index * 60);
                        
                        
                        const catGradient = ctx.createLinearGradient(70, categoryY, 400, categoryY + 50);
                        catGradient.addColorStop(0, "rgba(25, 118, 210, 0.3)");
                        catGradient.addColorStop(1, "rgba(13, 71, 161, 0.1)");
                        ctx.fillStyle = catGradient;
                        ctx.fillRect(70, categoryY, 660, 50);
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(70, categoryY, 660, 50);
                        
                        
                        ctx.font = "bold 22px Arial";
                        ctx.fillStyle = "#ffffff";
                        ctx.textAlign = "left";
                        ctx.fillText(
                            `${this.getCategoryIcon(catId)} ${DEGREE_CATEGORIES[catId].name}`, 
                            90, 
                            categoryY + 32
                        );
                        
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(650, categoryY + 25, 20, 0, Math.PI * 2);
                        const countGradient = ctx.createLinearGradient(630, categoryY + 5, 670, categoryY + 45);
                        countGradient.addColorStop(0, "#1e88e5");
                        countGradient.addColorStop(1, "#0d47a1");
                        ctx.fillStyle = countGradient;
                        ctx.fill();
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        
                        ctx.font = "bold 16px Arial";
                        ctx.fillStyle = "#ffffff";
                        ctx.textAlign = "center";
                        ctx.fillText(`${degrees.length}`, 650, categoryY + 30);
                        ctx.restore();
                        
                        index++;
                    }
                }
                startY += (index * 60) + 20;
            } else {
                
                ctx.font = "italic 22px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.textAlign = "center";
                ctx.fillText("Chưa có bằng cấp nào", width / 2, startY + 30);
                startY += 70;
            }

            
            if (education.currentDegree) {
                const degreeId = education.currentDegree.id;
                const degree = DEGREES[degreeId];
                
                if (degree) {
                    const daysPassed = (Date.now() - education.currentDegree.startTime) / STUDY_TIME;
                    const progress = Math.min(100, (daysPassed / degree.timeNeeded) * 100);
                    
                    ctx.save();
                    
                    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                    ctx.shadowBlur = 5;
                    ctx.font = "bold 26px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "left";
                    ctx.fillText("Đang theo học", 70, startY + 10);
                    ctx.restore();
                    
                    
                    startY += 40;
                    const courseBoxHeight = 120;
                    const courseGradient = ctx.createLinearGradient(50, startY, width - 50, startY + courseBoxHeight);
                    courseGradient.addColorStop(0, "rgba(21, 101, 192, 0.4)");
                    courseGradient.addColorStop(1, "rgba(0, 150, 136, 0.2)");
                    ctx.fillStyle = courseGradient;
                    ctx.fillRect(50, startY, width - 100, courseBoxHeight);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(50, startY, width - 100, courseBoxHeight);
                    
                    
                    ctx.save();
                    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                    ctx.shadowBlur = 5;
                    ctx.font = "bold 24px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "left";
                    ctx.fillText(`📚 ${degree.name}`, 70, startY + 40);
                    ctx.restore();
                    
                    
                    const barWidth = width - 140;
                    const barHeight = 30;
                    const barX = 70;
                    const barY = startY + 70;
                    
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
                    
                    
                    ctx.font = "bold 20px Arial";
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center";
                    ctx.fillText(`${Math.floor(progress)}%`, barX + barWidth / 2, barY + 22);
                    
                    
                    if (progress < 100) {
                        const daysRemaining = Math.ceil(degree.timeNeeded - daysPassed);
                        ctx.font = "18px Arial";
                        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                        ctx.textAlign = "right";
                        ctx.fillText(`Còn lại: ${daysRemaining} ngày`, width - 70, startY + 115);
                    } else {
                        ctx.font = "bold 20px Arial";
                        ctx.fillStyle = "#4caf50";
                        ctx.textAlign = "right";
                        ctx.fillText("✅ HOÀN THÀNH!", width - 70, startY + 225);
                    }
                    
                    startY += courseBoxHeight + 20;
                }
            }
            
            const buffer = canvas.toBuffer("image/png");
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const outputPath = path.join(tempDir, `study_${senderID}_${Date.now()}.png`);
            fs.writeFileSync(outputPath, buffer);
            
            return outputPath;
        } catch (error) {
            console.error("Error creating study info image:", error);
            throw error;
        }
    },

    async getAvatarPath(userId) {
        try {
            
            const avatarsDir = path.join(__dirname, './cache/avatar.jpg');
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

ctx.fillText(`${title} #${senderID.substring(0, 5)}`, 200, 215);

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
        const { threadID, senderID, messageID } = event;
        let command = target[0]?.toLowerCase();
        let argument = target[1]?.toLowerCase();
        try {
            const education = this.loadEducation(senderID);
            
            const title = this.generateTitle(education);
            const userName = `${title} #${senderID.substring(0, 5)}`;
            
            if (!command) {
                await api.sendMessage(
                    "┏━━『 HỌC TẬP 』━━┓\n\n" +
                    "🎓 HƯỚNG DẪN SỬ DỤNG:\n\n" +
                    "📋 .study list\n└ Xem danh mục học tập\n\n" +
                    "🏫 .study category <loại>\n└ Xem chi tiết bằng cấp theo loại\n\n" +
                    "📝 .study enroll <mã>\n└ Đăng ký học bằng cấp\n\n" +
                    "ℹ️ .study info\n└ Xem thông tin học vấn\n\n" +
                    "💡 Học vấn cao = cơ hội việc làm tốt\n" +
                    "┗━━━━━━━━━━━━━┛",
                    threadID
                );
                return;
            }

            switch (command) {
                case "list": {
                    let msg = "┏━━『 DANH MỤC HỌC TẬP 』━━┓\n\n";
                    const categories = {
                        school: { icon: "🏫", name: "Trung học", desc: "Chứng chỉ THPT và các chứng chỉ phổ thông" },
                        college: { icon: "🏢", name: "Cao đẳng", desc: "Các ngành học cao đẳng (2-3 năm)" },
                        university: { icon: "🎓", name: "Đại học", desc: "Các ngành học đại học (4-5 năm)" },
                        certificate: { icon: "📜", name: "Chứng chỉ", desc: "Các chứng chỉ ngắn hạn chuyên môn" },
                        specialized: { icon: "📚", name: "Chuyên môn", desc: "Các khóa học chuyên sâu" }
                    };
                    
                    Object.entries(categories).forEach(([id, cat], index) => {
                        msg += `${index + 1}. ${cat.icon} ${cat.name.toUpperCase()}\n`;
                        msg += `├ Mã: ${id}\n`;
                        msg += `├ ${cat.desc}\n`;
                        msg += `└ Số bằng cấp: ${DEGREE_CATEGORIES[id].degrees.length}\n\n`;
                    });

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += "➤ Xem chi tiết: .study category <mã>\n";
                    msg += "   VD: .study category school\n\n";
                    msg += "💵 Số dư: " + formatNumber(await getBalance(senderID)) + " Xu";
                    
                    await api.sendMessage(msg, threadID);
                    return;
                }

                case "category": {
                    if (!argument || !DEGREE_CATEGORIES[argument]) {
                        return api.sendMessage(
                            "❌ Loại bằng cấp không hợp lệ!\nCác loại: school, college, university, certificate, specialized",
                            threadID
                        );
                    }

                    const category = DEGREE_CATEGORIES[argument];
                    let msg = `┏━━『 ${category.name.toUpperCase()} 』━━┓\n\n`;
                    
                    for (const degreeId of category.degrees) {
                        const degree = DEGREES[degreeId];
                        if (!degree) continue;

                        msg += `📋 ${degree.name}\n`;
                        msg += `├ Mã: ${degreeId}\n`;
                        msg += `├ Chi phí: ${degree.instantGrant ? '🆓 Miễn phí' : '💰 ' + formatNumber(degree.cost) + ' Xu'}\n`;
                        msg += `└ Thời gian: ${degree.instantGrant ? '⚡ Cấp ngay' : '⏳ ' + degree.timeNeeded + ' ngày'}\n\n`;
                    }

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += "➤ Đăng ký: .study enroll <mã>\n";
                    msg += "➤ Kiểm tra tiến độ: .study info";
                    
                    await api.sendMessage(msg, threadID);
                    return;
                }

                case "enroll": {
                    const degreeId = target[1]?.toLowerCase();
                    if (!degreeId || !DEGREES[degreeId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã bằng cấp hợp lệ!", threadID);
                    }
                    const degree = DEGREES[degreeId];
    
                    if (education.currentDegree) {
                        const currentDegree = DEGREES[education.currentDegree.id];
                        if (currentDegree) {
                            const daysPassed = (Date.now() - education.currentDegree.startTime) / STUDY_TIME;
                            const progress = Math.min(100, (daysPassed / currentDegree.timeNeeded) * 100);
                            
                            if (progress >= 100) {
                                education.degrees.push(education.currentDegree.id);
                                education.currentDegree = null;
                                this.saveEducation(senderID, education);
                                await api.sendMessage("🎊 CHÚC MỪNG! Bạn đã hoàn thành khóa học trước đó!", threadID);
                            } else {
                                return api.sendMessage("❌ Bạn đang theo học một chương trình khác!", threadID);
                            }
                        }
                    }
                    
                    for (const req of degree.requirements) {
                        if (!education.degrees.includes(req)) {
                            return api.sendMessage(
                                `❌ Bạn cần có bằng ${DEGREES[req].name} trước!`,
                                threadID
                            );
                        }
                    }

                    if (degree.instantGrant) {
                        education.degrees = education.degrees || []; 
                        education.degrees.push(degreeId);
                        this.saveEducation(senderID, education);
                        return api.sendMessage(
                            "🎓 CHÚC MỪNG BẠN ĐÃ TỐT NGHIỆP THPT!\n\n" +
                            `Bằng cấp: ${degree.name}\n` +
                            "💡 Bây giờ bạn có thể học lên Cao đẳng hoặc Đại học",
                            threadID
                        );
                    }

                    const balance = await getBalance(senderID);
                    if (balance < degree.cost) {
                        return api.sendMessage(
                            `❌ Bạn cần ${formatNumber(degree.cost)} Xu để đăng ký học!`,
                            threadID
                        );
                    }

                    await updateBalance(senderID, -degree.cost);
                    education.currentDegree = {
                        id: degreeId,
                        startTime: Date.now(),
                        progress: 0
                    };
                    this.saveEducation(senderID, education);

                    return api.sendMessage(
                        "🎓 ĐĂNG KÝ THÀNH CÔNG!\n\n" +
                        `Bằng cấp: ${degree.name}\n` +
                        `Thời gian học: ${degree.timeNeeded} ngày\n` +
                        `Chi phí: ${formatNumber(degree.cost)} Xu\n\n` +
                        "💡 Dùng .study info để xem tiến độ",
                        threadID
                    );
                }

                case "info": {
                    const balance = await getBalance(senderID);
                    try {
                        const imagePath = await this.createStudyInfoImage(education, senderID, userName, balance);
                        await api.sendMessage({ body: "", attachment: fs.createReadStream(imagePath) }, threadID, () => {
                            fs.unlinkSync(imagePath);
                        });
                    } catch (imageError) {
                        console.error("Error creating study info image:", imageError);
                        let msg = "┏━━『 THÔNG TIN HỌC VẤN 』━━┓\n\n";
                        
                        if (education.degrees.length === 0) {
                            msg += "📚 Trình độ: Chưa tốt nghiệp\n";
                        } else {
                            const highestDegree = education.degrees[education.degrees.length - 1];
                            msg += `🎓 Trình độ cao nhất:\n└ ${DEGREES[highestDegree].name}\n\n`;
                            
                            const categories = {};
                            education.degrees.forEach(degreeId => {
                                for (const [catId, category] of Object.entries(DEGREE_CATEGORIES)) {
                                    if (category.degrees.includes(degreeId)) {
                                        if (!categories[catId]) categories[catId] = [];
                                        categories[catId].push(degreeId);
                                        break;
                                    }
                                }
                            });
                            
                            msg += "📚 Bằng cấp theo loại:\n";
                            for (const [catId, degrees] of Object.entries(categories)) {
                                if (degrees.length > 0) {
                                    msg += `├ ${this.getCategoryIcon(catId)} ${DEGREE_CATEGORIES[catId].name}: ${degrees.length}\n`;
                                }
                            }
                        }

                        if (education.currentDegree) {
                            const degreeId = education.currentDegree.id;
                            const degree = DEGREES[degreeId];

                            if (!degree) {
                              console.warn(`Degree with ID ${degreeId} not found.`);
                              education.currentDegree = null;
                              this.saveEducation(senderID, education);
                              return api.sendMessage("❌ Đã có lỗi xảy ra với tiến trình học tập của bạn. Vui lòng thử lại sau!", threadID);
                            }

                            const daysPassed = (Date.now() - education.currentDegree.startTime) / STUDY_TIME;
                            const progress = Math.min(100, (daysPassed / degree.timeNeeded) * 100);
                            
                            msg += "\n📝 Đang theo học:\n";
                            msg += `├ ${degree.name}\n`;
                            const progressBar = "▰".repeat(Math.floor(progress/10)) + "▱".repeat(10-Math.floor(progress/10));
                            msg += `└ Tiến độ: ${progressBar} ${Math.floor(progress)}%\n`;
                            
                            if (progress >= 100) {
                                education.degrees.push(education.currentDegree.id);
                                education.currentDegree = null;
                                this.saveEducation(senderID, education);
                                msg += "\n🎊 CHÚC MỪNG TỐT NGHIỆP!";
                            }
                        }

                        msg += "\n\n💡 Xem chi tiết bằng cấp:\n.study category <loại>";
                        msg += "\n┗━━━━━━━━━━━━━━━━━┛";
                        return api.sendMessage(msg, threadID);
                    }
                }

                case "detail": {
                    const degreeId = target[1]?.toLowerCase();
                    if (!degreeId || !DEGREES[degreeId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã bằng cấp hợp lệ!", threadID);
                    }

                    const degree = DEGREES[degreeId];
                    let msg = `┏━━『 CHI TIẾT BẰNG CẤP 』━━┓\n\n`;
                    msg += `🎓 ${degree.name}\n`;
                    msg += `├ Mã: ${degreeId}\n`;
                    msg += `├ Chi phí: ${degree.instantGrant ? '🆓 Miễn phí' : '💰 ' + formatNumber(degree.cost) + ' Xu'}\n`;
                    msg += `├ Thời gian: ${degree.instantGrant ? '⚡ Cấp ngay' : '⏳ ' + degree.timeNeeded + ' ngày'}\n`;
                    
                    if (degree.requirements.length > 0) {
                        msg += `├ Yêu cầu:\n`;
                        degree.requirements.forEach(req => {
                            msg += `│  ➤ ${DEGREES[req].name}\n`;
                        });
                    }
                    
                    msg += `└ Mô tả: ${degree.description || "Không có mô tả"}\n`;
                    msg += "\n┗━━━━━━━━━━━━━━━━━┛";

                    return api.sendMessage(msg, threadID);
                }
            }
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã có lỗi xảy ra!", threadID);
        }
    },

    loadEducation: function(userID) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            if (!fs.existsSync(educationPath)) {
                fs.writeFileSync(educationPath, '{}');
            }
            const data = JSON.parse(fs.readFileSync(educationPath));
            let education = data[userID] || { degrees: [], currentDegree: null };

            if (education.degrees) {
                education.degrees = education.degrees.map(degree => {
                 
                    if (degree === "highschool") return "e1";
                    return degree;
                });
            }

            return education;
        } catch (error) {
            console.error(error);
            return { degrees: [], currentDegree: null };
        }
    },

    saveEducation: function(userID, data) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            let eduData = {};
            if (fs.existsSync(educationPath)) {
                eduData = JSON.parse(fs.readFileSync(educationPath));
            }
            eduData[userID] = data;
            fs.writeFileSync(educationPath, JSON.stringify(eduData, null, 2));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    getCategoryIcon(categoryId) {
        const icons = {
            "school": "🏫",
            "college": "🏢",
            "university": "🎓",
            "certificate": "📜",
            "specialized": "📚"
        };
        return icons[categoryId] || "📝";
    }
};
