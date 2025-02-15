const { updateBalance, updateQuestProgress } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');
const JobSystem = require('../family/JobSystem');

module.exports = {
    name: "work",
    dev: "HNT",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const jobSystem = new JobSystem();

        try {
            const vipBenefits = getVIPBenefits(senderID);
            const result = await jobSystem.work(senderID, vipBenefits);
            
            const tax = jobSystem.calculateTax(result.salary);
            const netEarnings = result.salary - tax;

            await updateBalance(senderID, netEarnings);
            await updateQuestProgress(senderID, "work");

            let message = `[🏢] Công việc: ${result.name}\n` + 
                         `[👔] Cấp bậc: ${result.levelName}\n` +
                         `[📊] Số lần làm việc: ${result.workCount}\n` +
                         `[💰] Được trả: ${result.salary.toLocaleString('vi-VN')} Xu\n` +
                         `[💸] Thuế thu nhập: ${tax.toLocaleString('vi-VN')} Xu (${((tax/result.salary)*100).toFixed(1)}%)\n` +
                         `[💵] Thực lãnh: ${netEarnings.toLocaleString('vi-VN')} Xu`;
            
            if (vipBenefits?.workBonus) {
                message += `\n[👑] Thưởng VIP +${vipBenefits.workBonus}%\n(${Math.floor(result.salary * vipBenefits.workBonus / 100).toLocaleString('vi-VN')} Xu)`;
            }

            if (result.leveledUp) {
                message += `\n\n🎉 CHÚC MỪNG THĂNG CẤP!\n` +
                          `➤ Cấp mới: ${result.leveledUp.name}\n` +
                          `➤ Thưởng: +${((result.leveledUp.bonus - 1) * 100).toFixed(0)}% lương cơ bản`;
            }

            return api.sendMessage(message, threadID, messageID);

        } catch (error) {
            return api.sendMessage(`❌ ${error.message}`, threadID, messageID);
        }
    }
};