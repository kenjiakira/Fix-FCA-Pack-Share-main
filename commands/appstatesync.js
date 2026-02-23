const fs = require('fs');
const path = require('path');

module.exports = {
    name: "appstatesync",
    dev: "HNT",
    category: "System",
    info: "Bật/tắt đồng bộ appstate từ URL (chỉ admin)",
    usedby: 1,
    cooldowns: 5,
    onPrefix: true,
    nickName: ["appstatesync", "syncappstate", "async"],
    usages: [
        "appstatesync on - Bật đồng bộ appstate",
        "appstatesync off - Tắt đồng bộ appstate",
        "appstatesync status - Xem trạng thái"
    ],

    onLaunch: async function ({ api, event, actions }) {
        const { threadID, senderID } = event;
        const adminConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'admin.json'), 'utf8'));
        const isAdmin = (adminConfig.adminUIDs || []).includes(senderID);

        if (!isAdmin) {
            return actions.reply("❌ Chỉ admin bot mới có thể sử dụng lệnh này.");
        }

        const sub = (event.body || '').trim().split(/\s+/).slice(1)[0]?.toLowerCase() || 'status';

        const {
            isSyncEnabled,
            setSyncEnabled,
            stopAppStateSync,
            startAppStateSync
        } = require('../utils/appstateSync');

        if (sub === 'off') {
            setSyncEnabled(false);
            return actions.reply(
                "⏸️ **Appstate Sync** đã được **tắt**.\n" +
                "• Đồng bộ định kỳ đã dừng.\n" +
                "• Trạng thái lưu trong database, có hiệu lực sau khi restart."
            );
        }

        if (sub === 'on') {
            setSyncEnabled(true);
            const syncURL = process.env.APPSTATE_SYNC_URL?.trim();
            if (!syncURL) {
                return actions.reply(
                    "✅ **Appstate Sync** đã được **bật** trong cấu hình.\n" +
                    "⚠️ Chưa có APPSTATE_SYNC_URL trong .env — cần cấu hình và restart bot để đồng bộ chạy."
                );
            }
            const interval = parseInt(process.env.APPSTATE_SYNC_INTERVAL, 10) || 15;
            const apiKey = process.env.APPSTATE_SYNC_API_KEY || null;
            const enablePeriodic = process.env.APPSTATE_SYNC_ENABLE_PERIODIC !== 'false';
            startAppStateSync(syncURL, interval, apiKey, enablePeriodic);
            return actions.reply(
                "✅ **Appstate Sync** đã được **bật**.\n" +
                `• Chu kỳ kiểm tra: ${interval} phút\n` +
                (enablePeriodic ? "• Tự động kiểm tra và restart khi có appstate mới." : "• Chỉ kiểm tra một lần (định kỳ tắt).")
            );
        }

        if (sub === 'status') {
            const enabled = isSyncEnabled();
            const syncURL = process.env.APPSTATE_SYNC_URL?.trim();
            const hasUrl = !!syncURL;
            const urlPreview = hasUrl ? (syncURL.slice(0, 40) + (syncURL.length > 40 ? '...' : '')) : '— chưa cấu hình';
            return actions.reply(
                "📋 **Trạng thái Appstate Sync**\n" +
                "━━━━━━━━━━━━━━━━\n" +
                `• Trạng thái: ${enabled ? '🟢 Bật' : '🔴 Tắt'}\n` +
                `• URL: \`${urlPreview}\`\n` +
                `• Cách đổi: \`appstatesync on\` / \`appstatesync off\``
            );
        }

        return actions.reply(
            "📝 Cách dùng: appstatesync **on** | **off** | **status**"
        );
    }
};
