const { updateBalance, updateQuestProgress } = require('../utils/currencies');
const { getVIPBenefits } = require('../utils/vipCheck');

const jobs = [
    {
        name: "Shipper",
        description: "Bạn đã giao {count} đơn hàng",
        minPay: 20000,
        maxPay: 45000,
        countRange: [3, 8]
    },
    {
        name: "Rửa xe",
        description: "Bạn đã rửa {count} chiếc xe",
        minPay: 25000,
        maxPay: 50000,
        countRange: [2, 5]
    },
    {
        name: "Đầu bếp",
        description: "Bạn đã nấu {count} món ăn",
        minPay: 35000,
        maxPay: 70000,
        countRange: [4, 8]
    },
    {
        name: "Bảo vệ",
        description: "Bạn đã làm việc {count} giờ",
        minPay: 20000,
        maxPay: 40000,
        countRange: [4, 8]
    },
    {
        name: "Lập trình viên",
        description: "Bạn đã fix {count} bug",
        minPay: 50000,
        maxPay: 100000,
        countRange: [2, 5]
    },
    {
        name: "Streamer",
        description: "Bạn đã stream {count} giờ",
        minPay: 40000,
        maxPay: 80000,
        countRange: [3, 6]
    }
];

module.exports = {
    name: "work",
    dev: "HNT",
    info: "Làm việc kiếm tiền",
    onPrefix: true,
    usages: "work",
    cooldowns: 0,
    lastWorked: {},

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;

        const currentTime = Date.now();
        let COOLDOWN = 600000; 

        const vipBenefits = getVIPBenefits(senderID);
        let vipBonus = 0;
        if (vipBenefits) {
            if (vipBenefits.cooldownReduction) {
                COOLDOWN = COOLDOWN * (100 - vipBenefits.cooldownReduction) / 100;
            }
            vipBonus = vipBenefits.workBonus || 0;
        }

        if (this.lastWorked[senderID] && currentTime - this.lastWorked[senderID] < COOLDOWN) {
            const timeLeft = Math.ceil((COOLDOWN - (currentTime - this.lastWorked[senderID])) / 1000);
            return api.sendMessage(`⏳ Bạn cần nghỉ ngơi ${Math.floor(timeLeft/60)} phút ${timeLeft%60} giây nữa mới có thể làm việc tiếp!`, threadID, messageID);
        }

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const count = Math.floor(Math.random() * (job.countRange[1] - job.countRange[0] + 1)) + job.countRange[0];
        let earned = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;

        if (vipBonus > 0) {
            const bonusAmount = Math.floor(earned * (vipBonus / 100));
            earned += bonusAmount;
        }

        this.lastWorked[senderID] = currentTime;

        await updateBalance(senderID, earned);
        await updateQuestProgress(senderID, "work");

        let message = `[🏢] Công việc: ${job.name}\n` + 
                     job.description.replace("{count}", count) + "\n" +
                     `[💰] Được trả: ${earned.toLocaleString('vi-VN')} Xu`;
        
        if (vipBonus > 0) {
            message += `\n[👑] Thưởng VIP +${vipBonus}%\n(${Math.floor(earned * vipBonus / 100).toLocaleString('vi-VN')} Xu)`;
        }

        return api.sendMessage(message, threadID, messageID);
    }
};