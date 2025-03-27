const { updateBalance, loadQuests, getUserQuests, canClaimRewards, setRewardClaimed } = require('../utils/currencies');
const { getVIPBenefits } = require('../game/vip/vipCheck');
const { getStreak, updateStreak } = require('../utils/streakSystem');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "nhiemvu",
    dev: "HNT",
    usedby: 0,
    category: "Tài Chính",
    info: "Xem và nhận thưởng nhiệm vụ hàng ngày",
    onPrefix: true,
    usages: "nhiemvu",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const quests = await loadQuests();
        const userQuests = getUserQuests(senderID);
        const vipBenefits = getVIPBenefits(senderID);
        const streak = getStreak(senderID);

        const completedQuests = Object.entries(quests.dailyQuests)
            .filter(([questId, quest]) => {
                const progress = userQuests.progress[questId] || 0;
                return progress >= quest.target && !userQuests.completed[questId];
            });

        if (completedQuests.length > 0) {
            let totalReward = completedQuests.reduce((sum, [_, quest]) => sum + quest.reward, 0);
            let bonusAmount = 0;
            
            if (vipBenefits && vipBenefits.packageId > 0) {
                const vipBonus = {
                    1: 0.2, 
                    2: 0.5,
                    3: 1.0
                }[vipBenefits.packageId] || 0;

                bonusAmount = Math.floor(totalReward * vipBonus);
                totalReward += bonusAmount;
            }

            completedQuests.forEach(([questId]) => userQuests.completed[questId] = true);
            updateBalance(senderID, totalReward);
            setRewardClaimed(senderID);

            return api.sendMessage(
                `🎉 Chúc mừng! Bạn đã nhận được ${formatNumber(totalReward)} $!\n` +
                `${bonusAmount > 0 ? `👑 Thưởng VIP +${(bonusAmount/totalReward*100).toFixed(0)}%: ${formatNumber(bonusAmount)} $\n` : ''}` +
                `📝 Đã hoàn thành ${completedQuests.length} nhiệm vụ.\n` +
                `⭐ Tiếp tục cố gắng nhé!`,
                threadID, messageID
            );
        }

        let message = "📋 NHIỆM VỤ HÀNG NGÀY\n━━━━━━━━━━━━━━━━━━\n\n";
        
        if (vipBenefits) {
            message += `👑 Đặc quyền VIP ${vipBenefits.packageId}:\n`;
            message += `• Thưởng nhiệm vụ +${vipBenefits.packageId === 3 ? '100' : 
                        vipBenefits.packageId === 2 ? '50' : '20'}%\n`;
            message += `• Tích lũy nhanh hơn ${vipBenefits.packageId * 20}%\n\n`;
        }

        // Thêm thông tin streak
        message += `🔥 Chuỗi hoàn thành: ${streak.current} ngày\n`;
        if (streak.current > 0) {
            const nextMilestone = [3,7,14,30].find(x => x > streak.current) || 30;
            message += `📅 Phần thưởng chuỗi tiếp theo: ${nextMilestone} ngày (${formatNumber(quests.streakRewards[nextMilestone])} $)\n\n`;
        }

        let totalCompleted = 0;
        let totalQuests = Object.keys(quests.dailyQuests).length;

        for (const [questId, quest] of Object.entries(quests.dailyQuests)) {
            const progress = userQuests.progress[questId] || 0;
            const vipProgress = vipBenefits ? Math.floor(progress * (1 + vipBenefits.packageId * 0.2)) : progress;
            
            if (userQuests.completed[questId]) totalCompleted++;
            
            const status = userQuests.completed[questId] ? "✅" : vipProgress >= quest.target ? "⭐" : "▪️";
            message += `${status} ${quest.name}\n`;
            message += `👉 ${quest.description}\n`;
            message += `🎯 Tiến độ: ${vipProgress}/${quest.target}\n`;
            message += `💰 Phần thưởng: ${formatNumber(quest.reward)} $ ${vipBenefits ? 
                `(+${formatNumber(Math.floor(quest.reward * (vipBenefits.packageId === 3 ? 1 : 
                                                            vipBenefits.packageId === 2 ? 0.5 : 0.2)))} $ VIP)` : ''}\n\n`;
        }

        // Kiểm tra và cập nhật streak rewards
        if (totalCompleted === totalQuests) {
            const streakReward = await updateStreak(senderID);
            if (streakReward > 0) {
                message += `\n🎊 PHẦN THƯỞNG CHUỖI ĐẶC BIỆT 🎊\n`;
                message += `💰 +${formatNumber(streakReward)} $ cho ${streak.current} ngày liên tiếp!\n`;
                updateBalance(senderID, streakReward);
            }
        }

        if (totalCompleted === totalQuests && canClaimRewards(senderID) === false) {
            return api.sendMessage(
                "⏰ Hôm nay bạn đã nhận thưởng tất cả nhiệm vụ rồi!\n" +
                (vipBenefits ? "👑 Ngày mai nhận thêm thưởng VIP nhé!\n" : "") +
                "Vui lòng quay lại vào ngày mai!",
                threadID, messageID
            );
        }

        api.sendMessage(message, threadID, messageID);
    }
};
