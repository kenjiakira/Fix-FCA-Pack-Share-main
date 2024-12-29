const { exec } = require('child_process');
const fast = require('fast-speedtest-api');

module.exports = {
    name: "speedtest",
    dev: "HNT",
    usedby: 2,
    info: "Kiểm tra tốc độ mạng của hệ thống Bot",
    onPrefix: false,
    usages: ".speedtest",
    cooldowns: 30,

    onLaunch: async function ({ event, actions }) {
        const { threadID } = event;

        const progressStages = [
            "⏳ Đang khởi tạo kiểm tra...",
            "📡 Đang kiểm tra máy chủ...",
            "⬇️ Đang kiểm tra tốc độ tải xuống...",
            "⬆️ Đang kiểm tra tốc độ tải lên...",
            "📊 Đang phân tích kết quả..."
        ];

        let currentMessageID;
        let stage = 0;

        try {
            const initialMessage = await actions.reply(progressStages[0]);
            if (!initialMessage?.messageID) {
                throw new Error("Could not get messageID from initial message");
            }
            currentMessageID = initialMessage.messageID;

            const updateProgress = async () => {
                stage++;
                if (stage < progressStages.length && currentMessageID) {
                    try {
                        await actions.edit(progressStages[stage], currentMessageID);
                    } catch (error) {
                        console.error("Error updating progress:", error);
                    }
                }
            };

            const downloadSpeedTest = new fast({
                token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
                verbose: false,
                timeout: 10000,
                https: true,
            });

            const uploadSpeedTest = new fast({
                token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
                verbose: false,
                timeout: 10000,
                https: true,
            });

            await updateProgress();
            const downloadSpeed = await downloadSpeedTest.getSpeed().catch(err => {
                console.error("Download speed test error:", err);
                return 0;
            });

            await updateProgress();
            const uploadSpeed = await uploadSpeedTest.getSpeed().catch(err => {
                console.error("Upload speed test error:", err);
                return 0;
            });
            
            await updateProgress();
            const result = `🌐 Chi tiết tốc độ mạng:\n\n` +
                `📥 Tốc độ tải xuống: ${(downloadSpeed / 1024 / 1024).toFixed(2)} Mbps\n` +
                `📤 Tốc độ tải lên: ${(uploadSpeed / 1024 / 1024).toFixed(2)} Mbps\n` +
                `🏷️ Nhà mạng: ${await getISP()}\n` +
                `🔄 Ping: ${await getPing()} ms`;

            if (currentMessageID) {
                await actions.edit(result, currentMessageID);
            } else {
                await actions.reply(result);
            }
        } catch (error) {
            console.error("Speedtest error:", error);
            const errorMessage = "❌ Đã xảy ra lỗi trong quá trình kiểm tra.";
            if (currentMessageID) {
                await actions.edit(errorMessage, currentMessageID);
            } else {
                await actions.reply(errorMessage);
            }
        }
    }
};

async function getISP() {
    try {
        const response = await require('axios').get('https://ipinfo.io/json?token=77999b466a085d');
        return response.data.org || "Không xác định";
    } catch (error) {
        console.error("Lỗi khi lấy thông tin ISP:", error);
        return "Không xác định";
    }
}

async function getPing() {
    return new Promise((resolve) => {
        const start = Date.now();
        require('https').get('https://www.google.com', (res) => {
            resolve(Date.now() - start);
            res.resume();
        }).on('error', () => resolve(0));
    });
}
