const { updateBalance, updateQuestProgress, getBalance, saveData } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');
const { createUserData } = require('../utils/userData');
const JobSystem = require('../family/JobSystem');
const { JOB_CATEGORIES, JOB_RANKS } = require('../config/family/jobConfig');

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
            const timeLeft = Math.ceil(cooldown / 1000);
            return api.sendMessage(
                `⏳ Bạn cần nghỉ ngơi ${Math.floor(timeLeft/60)} phút ${timeLeft%60} giây nữa mới có thể làm việc tiếp!`,
                threadID,
                messageID
            );
        }

        try {
            const result = await jobSystem.work(senderID, vipBenefits);
            
            const tax = jobSystem.calculateTax(result.salary);
            const netEarnings = result.salary - tax;

            await updateBalance(senderID, netEarnings);
            await updateQuestProgress(senderID, "work");

            const category = Object.entries(JOB_CATEGORIES).find(([_, cat]) => 
                cat.jobs.includes(result.id)
            )?.[1] || { name: "Công việc khác" };

            const jobType = result.type || 'shipper';
            const ranks = JOB_RANKS[jobType] || [];
            const currentRankIndex = ranks.findIndex(rank => rank.name === result.levelName);
            const nextRank = ranks[currentRankIndex + 1];
            
            let message = "┏━━『 LÀM VIỆC 』━━┓\n\n";
            message += `[🏢] Công việc: ${result.name}\n`;
            message += `[📑] Loại: ${category.name}\n`;
            message += `[👔] Cấp bậc: ${result.levelName}\n`;
            
            if (nextRank) {
                const worksNeeded = nextRank.minWork - result.workCount;
                message += `[📈] Thăng cấp: Còn ${worksNeeded} lần làm việc\n`;
                message += `[🎯] Cấp tiếp theo: ${nextRank.name}\n`;
                message += `[💎] Thưởng: +${((nextRank.bonus - 1) * 100).toFixed(0)}% lương\n`;
                message += `[⭐] Tổng cộng: ${ranks.length} cấp bậc\n`;
                message += `[🏆] Cấp cao nhất: ${ranks[ranks.length - 1].name}\n`;
            } else {
                message += `[👑] Đã đạt cấp tối đa!\n`;
                message += `[💎] Thưởng hiện tại: +${((ranks[ranks.length - 1].bonus - 1) * 100).toFixed(0)}% lương\n`;
            }
            
            message += `[📊] Số lần làm việc: ${result.workCount}\n`;
            message += `[💰] Được trả: ${result.salary.toLocaleString('vi-VN')} Xu\n`;
            message += `[💸] Thuế thu nhập: ${tax.toLocaleString('vi-VN')} Xu (${((tax/result.salary)*100).toFixed(1)}%)\n`;
            message += `[💵] Thực lãnh: ${netEarnings.toLocaleString('vi-VN')} Xu\n`;
            if (vipBenefits?.workBonus) {
                message += `[👑] Thưởng VIP +${vipBenefits.workBonus}%\n`;
                message += `[✨] Tiền thưởng: +${Math.floor(result.salary * vipBenefits.workBonus / 100).toLocaleString('vi-VN')} Xu\n`;
            }

            message += "\n┗━━━━━━━━━━━━━━━━━┛";

            if (result.leveledUp) {
                message += "\n\n┏━━『 THĂNG CẤP 』━━┓\n\n";
                message += `[🎉] Chúc mừng thăng cấp!\n`;
                message += `[👔] Cấp mới: ${result.leveledUp.name}\n`;
                message += `[💎] Thưởng mới: +${((result.leveledUp.bonus - 1) * 100).toFixed(0)}% lương cơ bản\n`;
                message += `[📊] Tiến độ: ${currentRankIndex + 1}/${ranks.length} cấp\n`;
                message += "\n┗━━━━━━━━━━━━━━━━━┛";
            }

            return api.sendMessage(message, threadID, messageID);

        } catch (error) {
            return api.sendMessage(`❌ ${error.message}`, threadID, messageID);
        }
    }
};