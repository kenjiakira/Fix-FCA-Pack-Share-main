const { updateBalance, updateQuestProgress, } = require('../utils/currencies');
const { getVIPBenefits } = require('../game/vip/vipCheck');
const { createUserData } = require('../utils/userData');
const JobSystem = require('../game/family/JobSystem');
const createWorkResultImage = require('../game/canvas/workImageGenerator');
const fs = require('fs');

module.exports = {
    name: "work",
    dev: "HNT",
    category: "Games",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,
    
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
            
            // Handle the auto-job assignment case
            if (result.autoAssigned) {
                await api.sendMessage(
                    "🎉 BẠN ĐÃ ĐƯỢC NHẬN LÀM SHIPPER!\n" +
                    "Vì bạn chưa xin việc nên hệ thống đã tự giao việc.\n\n" +
                    `Công việc: ${result.job.name}\n` +
                    `Lương: ${result.job.salary.toLocaleString('vi-VN')} $/lần\n\n` +
                    "💡 Dùng .job info để xem thông tin\n" +
                    "💡 Dùng .job list để tìm việc tốt hơn\n" +
                    "💡 Dùng .study list để học bằng cấp mở khóa việc lương cao\n",
                    threadID
                );
                
                // Now work again with the assigned job
                const workResult = await jobSystem.work(senderID, vipBenefits);
                result = workResult;
            }
            
            const nextCooldown = jobSystem.getJobBasedCooldown(senderID);
            const tax = Math.floor(result.salary * ((result.tax || 0) / 100));
            const netEarnings = result.salary - tax;
            
            result.tax = (tax/result.salary)*100; 
            result.cooldown = nextCooldown;

            await updateBalance(senderID, netEarnings);
            await updateQuestProgress(senderID, "work");
            
            if (vipBenefits?.workBonus) {
                const vipBonus = Math.floor(result.salary * vipBenefits.workBonus / 100);
                await updateBalance(senderID, vipBonus);
                result.vipBonus = vipBonus;
            }

            const imagePath = await createWorkResultImage(result, vipBenefits, senderID);

            let textMessage = "┏━━『 LÀM VIỆC 』━━┓\n\n";
            textMessage += `[🏢] Công việc: ${result.name}\n`;
            textMessage += `[👔] Cấp bậc: ${result.levelName}\n`;
            textMessage += `[💰] Thực lãnh: ${netEarnings.toLocaleString('vi-VN')} $\n`;
            
            if (vipBenefits?.workBonus) {
                textMessage += `[👑] Thưởng VIP: +${vipBenefits.workBonus}% (${result.vipBonus.toLocaleString('vi-VN')} $)\n`;
            }
            
            textMessage += `[⏳] Thời gian nghỉ: ${Math.floor(nextCooldown / 3600000) > 0 ? `${Math.floor(nextCooldown / 3600000)} giờ ` : ''}${Math.floor((nextCooldown % 3600000) / 60000)} phút\n`;
            
            if (result.leveledUp) {
                textMessage += `\n🎉 Chúc mừng! Bạn đã thăng cấp lên ${result.leveledUp.name}!\n`;
                textMessage += `🌟 Giờ đây bạn nhận được +${((result.leveledUp.bonus - 1) * 100).toFixed(0)}% lương!\n`;
            }
            
            // Add helpful hints for progression
            const jobData = jobSystem.getJob(senderID);
            if (jobData.workCount >= 10 && result.salary < 2000) {
                textMessage += "\n💡 MẸO: Bạn có thể tìm việc lương cao hơn với:\n";
                textMessage += "   .job search - Tìm việc phù hợp với bằng cấp\n";
                textMessage += "   .study list - Xem các bằng cấp để mở khóa việc tốt hơn\n";
            }
            
            return api.sendMessage(
                {
                    body: textMessage,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                (err) => {
                    if (err) {
                        console.error("Error sending image:", err);
                        api.sendMessage(textMessage, threadID, messageID);
                    }
                    
    
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            );

        } catch (error) {
            console.error("Work command error:", error);
            
            // More helpful error message with guidance
            let errorMsg = `❌ ${error.message || "Có lỗi xảy ra khi thực hiện công việc!"}`;
            
            // If user doesn't have a job, suggest applying for one with specific guidance
            if (error.message && error.message.includes("chưa có việc làm")) {
                errorMsg += "\n\n💡 Bạn có thể:\n";
                errorMsg += "1️⃣ Gõ .job apply j1 để làm Shipper\n";
                errorMsg += "2️⃣ Gõ .job search để tìm việc phù hợp\n";
                errorMsg += "3️⃣ Gõ .job list để xem tất cả việc làm";
            }
            
            return api.sendMessage(errorMsg, threadID, messageID);
        }
    }
};