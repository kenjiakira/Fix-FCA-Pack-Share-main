const { updateBalance, getBalance } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');
const JobSystem = require('../family/JobSystem');
const { JOBS } = require('../config/jobConfig'); 

const TAX_BRACKETS = [
    { threshold: 1000000, rate: 0.05 },  
    { threshold: 5000000, rate: 0.10 }, 
    { threshold: 10000000, rate: 0.15 },
    { threshold: Infinity, rate: 0.20 }  
];

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateTax(amount) {
    for (const bracket of TAX_BRACKETS) {
        if (amount <= bracket.threshold) {
            return Math.floor(amount * bracket.rate);
        }
    }
    return Math.floor(amount * TAX_BRACKETS[TAX_BRACKETS.length - 1].rate);
}

const jobSystem = new JobSystem();

module.exports = {
    name: "work",
    dev: "HNT",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, senderID } = event;

        try {
            jobSystem.data = jobSystem.loadData();
            const jobData = jobSystem.getJob(senderID);
            
            if (!jobData?.currentJob?.id || !JOBS[jobData.currentJob.id]) {
                jobData.currentJob = null;
                jobSystem.saveData();
                return api.sendMessage(
                    "❌ Bạn chưa có việc làm hoặc công việc không hợp lệ!\n" +
                    "💡 Sử dụng .job list để xem việc và .job apply để ứng tuyển", 
                    threadID
                );
            }

            if (!jobSystem.canWork(senderID)) {
                const cooldown = jobSystem.getWorkCooldown(senderID);
                const timeLeft = Math.ceil(cooldown / 1000);
                return api.sendMessage(
                    `⏳ Bạn cần nghỉ ngơi ${Math.floor(timeLeft/60)} phút ${timeLeft%60} giây nữa!`, 
                    threadID
                );
            }

            try {
                const workResult = await jobSystem.work(senderID);
                if (!workResult) {
                    throw new Error("Không thể thực hiện công việc!");
                }
                const vipBenefits = getVIPBenefits(senderID);
                let earned = workResult.salary;

                if (vipBenefits && vipBenefits.workBonus) {
                    const bonusAmount = Math.floor(earned * (vipBenefits.workBonus / 100));
                    earned += bonusAmount;
                }

                const tax = calculateTax(earned);
                const netEarnings = earned - tax;

                await updateBalance(senderID, netEarnings);

                let message = `💼 ${workResult.name}\n\n` +
                             `[💰] Lương: ${formatNumber(earned)} Xu\n` +
                             `[💸] Thuế: ${formatNumber(tax)} Xu (${((tax/earned)*100).toFixed(1)}%)\n` +
                             `[💵] Thực lãnh: ${formatNumber(netEarnings)} Xu`;

                if (vipBenefits && vipBenefits.workBonus) {
                    message += `\n[👑] Thưởng VIP +${vipBenefits.workBonus}%`;
                }

                return api.sendMessage(message, threadID);

            } catch (workError) {
                return api.sendMessage(`❌ ${workError.message}`, threadID);
            }

        } catch (error) {
            console.error('Work command error:', error);
            return api.sendMessage(
                `❌ Lỗi: ${error.message || "Đã xảy ra lỗi không xác định!"}`,
                threadID
            );
        }
    }
};