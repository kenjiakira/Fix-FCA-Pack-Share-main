const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../database/json/autoping_settings.json');
const SCHEDULE_INTERVAL = '0 * * * *'; // Mỗi giờ vào phút 0

let pingJob = null;
let apiInstance = null;

function loadSettings() {
    try {
        const jsonDir = path.join(__dirname, '../database/json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }
        
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE));
        }
        const defaultSettings = { enabledThreads: [] };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    } catch (err) {
        console.error('Error loading autoping settings:', err);
        return { enabledThreads: [] };
    }
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (err) {
        console.error('Error saving autoping settings:', err);
    }
}

async function sendPingNotification(api) {
    try {
        const settings = loadSettings();
        if (settings.enabledThreads.length === 0) {
            return;
        }

        const threads = await api.getThreadList(100, null, ['INBOX']);
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const pingTime = Date.now();
        const message = `🏓 Auto Ping\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n` +
            `⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
            `✅ Bot đang hoạt động bình thường!`;

        for (const thread of threads) {
            if (thread.isGroup && settings.enabledThreads.includes(thread.threadID)) {
                try {
                    const startTime = Date.now();
                    await api.sendMessage(message, thread.threadID);
                    const latency = Date.now() - startTime;
                    
                    // Gửi thêm thông tin latency nếu có
                    if (latency > 0) {
                        await api.sendMessage(
                            `📊 Độ trễ: ${latency}ms`,
                            thread.threadID
                        );
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Error sending ping to thread ${thread.threadID}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('AutoPing Schedule Error:', error);
    }
}

function startPingSchedule(api) {
    if (pingJob) {
        pingJob.cancel();
    }
    
    apiInstance = api;
    
    pingJob = schedule.scheduleJob(SCHEDULE_INTERVAL, async function () {
        await sendPingNotification(api);
    });
    
    console.log('✅ AutoPing schedule started (mỗi 1 tiếng)');
}

module.exports = {
    name: "autoping",
    usedby: 0,
    category: "Khác",
    info: "Tự động ping mỗi 1 tiếng",
    dev: "HNT",
    onPrefix: true,
    dmUser: false,
    nickName: ["autoping", "ap"],
    usages: `=== HƯỚNG DẪN AUTO PING ===
1. Bật/tắt thông báo:
   .autoping notify → Bật/tắt ping tự động

2. Xem trạng thái:
   .autoping status → Xem trạng thái ping

💡 Ping sẽ tự động gửi mỗi 1 tiếng vào phút 0`,

    cooldowns: 5,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        try {
            const settings = loadSettings();
            const isEnabled = settings.enabledThreads.includes(threadID);

            const command = target[0]?.toLowerCase() || "default";

            switch (command) {
                case "notify":
                    if (isEnabled) {
                        settings.enabledThreads = settings.enabledThreads.filter(id => id !== threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔕 Đã TẮT ping tự động cho nhóm này!",
                            threadID,
                            messageID
                        );
                    } else {
                        settings.enabledThreads.push(threadID);
                        saveSettings(settings);
                        return api.sendMessage(
                            "🔔 Đã BẬT ping tự động cho nhóm này!\n" +
                            "💡 Bot sẽ tự động ping mỗi 1 tiếng vào phút 0",
                            threadID,
                            messageID
                        );
                    }
                    break;

                case "status":
                    const status = isEnabled ? "🔔 ĐANG BẬT" : "🔕 ĐANG TẮT";
                    const totalEnabled = settings.enabledThreads.length;
                    return api.sendMessage(
                        `📊 TRẠNG THÁI AUTO PING\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `Trạng thái nhóm này: ${status}\n` +
                        `Tổng số nhóm đã bật: ${totalEnabled}\n` +
                        `Chu kỳ ping: Mỗi 1 tiếng (vào phút 0)`,
                        threadID,
                        messageID
                    );
                    break;

                case "test":
                    // Test ping ngay lập tức
                    await api.sendMessage("🧪 Đang test ping...", threadID);
                    await sendPingNotification(api);
                    return api.sendMessage("✅ Test ping hoàn tất!", threadID, messageID);
                    break;

                default:
                    return api.sendMessage(this.usages, threadID, messageID);
            }
        } catch (error) {
            console.error('AutoPing command error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi thực hiện lệnh.", threadID, messageID);
        }
    },

    onLoad: async function ({ api }) {
        // Khởi động schedule khi bot load
        startPingSchedule(api);
    }
};

