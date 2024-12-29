const { getBalance, updateBalance, loadQuests, getUserQuests, canClaimRewards, setRewardClaimed } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

module.exports = {
    name: "task",
    dev: "HNT",
    usedby: 0,
    info: "Xem và nhận thưởng nhiệm vụ hàng ngày",
    onPrefix: true,
    usages: "task",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;
        const quests = await loadQuests();
        const userQuests = getUserQuests(senderID);

        const completedQuests = Object.entries(quests.dailyQuests)
            .filter(([questId, quest]) => {
                const progress = userQuests.progress[questId] || 0;
                return progress >= quest.target && !userQuests.completed[questId];
            });

        if (completedQuests.length > 0) {
            if (!canClaimRewards(senderID)) {
                return api.sendMessage(
                    "⏰ Hôm nay bạn đã nhận thưởng rồi!\nVui lòng quay lại vào ngày mai nhé!",
                    threadID, messageID
                );
            }

            const totalReward = completedQuests.reduce((sum, [_, quest]) => sum + quest.reward, 0);
            completedQuests.forEach(([questId]) => userQuests.completed[questId] = true);

            updateBalance(senderID, totalReward);
            setRewardClaimed(senderID);

            return api.sendMessage(
                `🎉 Chúc mừng! Bạn đã nhận được ${formatNumber(totalReward)} Xu!\n` +
                `📝 Đã hoàn thành ${completedQuests.length} nhiệm vụ.\n` +
                `⭐ Tiếp tục cố gắng nhé!`,
                threadID, messageID
            );
        }

        let message = "📋 NHIỆM VỤ HÀNG NGÀY\n━━━━━━━━━━━━━━━━━━\n\n";
        for (const [questId, quest] of Object.entries(quests.dailyQuests)) {
            const progress = userQuests.progress[questId] || 0;
            const status = userQuests.completed[questId] ? "✅" : progress >= quest.target ? "⭐" : "▪️";
            message += `${status} ${quest.name}\n`;
            message += `👉 ${quest.description}\n`;
            message += `🎯 Tiến độ: ${progress}/${quest.target}\n`;
            message += `💰 Phần thưởng: ${formatNumber(quest.reward)} Xu\n\n`;
        }

        api.sendMessage(message, threadID, messageID);
    }
};
