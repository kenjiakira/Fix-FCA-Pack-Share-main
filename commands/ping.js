const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const fast = require('fast-speedtest-api');
const execPromise = util.promisify(exec);

module.exports = {
    name: "ping",
    usedby: 0,
    info: "Kiểm tra độ trễ và tốc độ mạng của bot",
    dev: "HNT",
    onPrefix: false,
    dmUser: false,
    nickName: ["ping", "p"],
    usages: "ping",
    cooldowns: 30,

    onLaunch: async function ({ event, actions }) {
        const startTime = Date.now();
        
        const progressStages = [
            "⏳ Đang khởi tạo kiểm tra...",
            "📡 Đang kiểm tra độ trễ...", 
            "💻 Đang kiểm tra CPU & RAM...",
            "⬇️ Đang kiểm tra tốc độ tải xuống...",
            "⬆️ Đang kiểm tra tốc độ tải lên...",
            "📊 Đang phân tích kết quả..."
        ];

        let currentMessageID;
        let stage = 0;

        try {
            const initialMessage = await actions.reply(progressStages[0]);
            currentMessageID = initialMessage.messageID;

            const updateProgress = async () => {
                stage++;
                if (stage < progressStages.length && currentMessageID) {
                    await actions.edit(progressStages[stage], currentMessageID);
                }
            };

            await updateProgress();
            const pingResult = await measurePing();
            const responseTime = Date.now() - startTime;

            await updateProgress();
            const cpuLoad = os.loadavg()[0].toFixed(2);
            const memoryUsage = ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2);

            await updateProgress();
            const downloadSpeedTest = new fast({
                token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
                verbose: false,
                timeout: 10000,
                https: true,
            });
            
            const downloadSpeed = await downloadSpeedTest.getSpeed();
            
            await updateProgress();
            const uploadSpeedTest = new fast({
                token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm",
                verbose: false,
                timeout: 10000,
                https: true,
            });
            
            const uploadSpeed = await uploadSpeedTest.getSpeed();

            await updateProgress();
            const performanceRating = getPerformanceRating(responseTime, pingResult, cpuLoad);
            const isp = await getISP();

            const result = `🏓 Chi tiết hiệu năng hệ thống:\n\n` +
                         `📡 Độ trễ: ${pingResult}ms\n` +
                         `⚡ Thời gian phản hồi: ${responseTime}ms\n` +
                         `🔄 CPU Load: ${cpuLoad}%\n` +
                         `💾 RAM Usage: ${memoryUsage}%\n\n` +
                         `🌐 Tốc độ mạng:\n` +
                         `📥 Download: ${(downloadSpeed / 1024 / 1024).toFixed(2)} Mbps\n` +
                         `📤 Upload: ${(uploadSpeed / 1024 / 1024).toFixed(2)} Mbps\n` +
                         `🏷️ Nhà mạng: ${isp}\n\n` +
                         `📊 Đánh giá: ${performanceRating}`;

            await actions.edit(result, currentMessageID);

        } catch (error) {
            const errorMessage = "❌ Đã xảy ra lỗi trong quá trình kiểm tra: " + error.message;
            if (currentMessageID) {
                await actions.edit(errorMessage, currentMessageID);
            } else {
                await actions.reply(errorMessage);
            }
        }
    }
};

async function measurePing() {
    try {
        const isWindows = os.platform() === 'win32';
        const pingCommand = isWindows ? 'ping -n 1 google.com' : 'ping -c 1 google.com';
        const { stdout } = await execPromise(pingCommand);
        const match = stdout.match(isWindows ? /time=(\d+)ms/ : /time=(\d+\.\d+) ms/);
        return match ? parseInt(match[1]) : 999;
    } catch {
        return 999;
    }
}

async function getISP() {
    try {
        const response = await axios.get('https://ipinfo.io/json?token=77999b466a085d');
        return response.data.org || "Không xác định";
    } catch (error) {
        return "Không xác định";
    }
}

function getPerformanceRating(responseTime, ping, cpuLoad) {
    let rating = "⭐";
    
    if (responseTime < 200 && ping < 100 && cpuLoad < 50) {
        rating = "⭐⭐⭐⭐⭐ Tuyệt vời";
    } else if (responseTime < 500 && ping < 150 && cpuLoad < 70) {
        rating = "⭐⭐⭐⭐ Rất tốt";
    } else if (responseTime < 1000 && ping < 200 && cpuLoad < 85) {
        rating = "⭐⭐⭐ Tốt";
    } else if (responseTime < 2000 && ping < 300 && cpuLoad < 95) {
        rating = "⭐⭐ Trung bình";
    } else {
        rating = "⭐ Cần cải thiện";
    }
    
    return rating;
}
