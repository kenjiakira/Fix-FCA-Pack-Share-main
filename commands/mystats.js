const { getGlobalCommandStats } = require('../utils/commandUsage');

module.exports = {
    name: "mystats",
    usedby: 2,
    info: "Xem thống kê lệnh toàn hệ thống",
    dev: "HNT",
    onPrefix: true,
    usages: "[số top]\nVí dụ: mystats hoặc mystats 20",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;

        const limit = Math.min(parseInt(target[0], 10) || 20, 30);
        const top = getGlobalCommandStats(limit);

        if (top.length === 0) {
            return api.sendMessage("📊 Chưa có dữ liệu thống kê lệnh.", threadID, messageID);
        }

        let msg = "📊 THỐNG KÊ LỆNH TOÀN HỆ THỐNG\n";
        msg += "━━━━━━━━━━\n\n";
        top.forEach((item, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `  ${i + 1}.`;
            msg += `${medal} ${item.command}: ${item.count} lần\n`;
        });
        const total = top.reduce((s, x) => s + x.count, 0);
        msg += "\n━━━━━━━━━━━━━━━━━━\n";
        msg += `📈 Tổng: ${total} lần`;

        return api.sendMessage(msg, threadID, messageID);
    }
};
