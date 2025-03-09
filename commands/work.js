const { updateBalance, updateQuestProgress, } = require('../utils/currencies');
const { getVIPBenefits } = require('../vip/vipCheck');
const { createUserData } = require('../utils/userData');
const JobSystem = require('../family/JobSystem');
const createWorkResultImage = require('../canvas/workImageGenerator');
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
            return api.sendMessage(`❌ ${error.message || "Có lỗi xảy ra khi thực hiện công việc!"}`, threadID, messageID);
        }
    }
};