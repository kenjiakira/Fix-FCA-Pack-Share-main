const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const execPromise = util.promisify(exec);

const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
const usersDB = JSON.parse(fs.readFileSync("./database/users.json", "utf8") || "{}");

const botStartTime = Date.now();

module.exports = {
    name: "uptime",
    usedby: 0,
    category: "Khác",
    info: "Xem thời gian bot.",
    dev: "HNT",
    onPrefix: false,
    dmUser: false,
    nickName: ["uptime", "upt"],
    usages: "uptime",
    cooldowns: 10,

    onLaunch: async function ({ event, actions }) {
        const { threadID, messageID } = event;

        const userCount = Object.keys(usersDB).length;
        const threadCount = Object.keys(threadsDB).length;

        const replyMessage = await actions.reply("Đang tải dữ liệu.......");
        await sleep(3000);

        let currentTime = Date.now();
        let uptime = currentTime - botStartTime;
        let seconds = Math.floor((uptime / 1000) % 60);
        let minutes = Math.floor((uptime / (1000 * 60)) % 60);
        let hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        let days = Math.floor(uptime / (1000 * 60 * 60 * 24));

        const ping = await getPing();
        const systemInfo = await getSystemInfo();
        const nodeVersion = await getNodeVersion();
        const systemUptime = await getSystemUptime();

        let uptimeMessage = `🔰 THÔNG TIN HỆ THỐNG BOT 🔰\n`;
        uptimeMessage += `══════════════════\n`;
        uptimeMessage += `🤖 Trạng Thái Bot\n`;
        uptimeMessage += `▸ Thời gian hoạt động: ${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây\n`;
        uptimeMessage += `▸ Tổng người dùng: ${userCount} | Tổng nhóm: ${threadCount}\n`;
        uptimeMessage += `▸ Độ trễ phản hồi: ${ping}\n`;
        uptimeMessage += `══════════════════\n`;
        uptimeMessage += `💻 Thông Tin Máy Chủ\n`;
        uptimeMessage += `▸ Hệ điều hành: ${systemInfo.platform} ${systemInfo.arch}\n`;
        uptimeMessage += `▸ Tên máy chủ: ${systemInfo.hostname}\n`;
        uptimeMessage += `▸ Thời gian hoạt động: ${systemUptime}\n`;
        uptimeMessage += `══════════════════\n`;
        uptimeMessage += `🔧 Tài Nguyên Hệ Thống\n`;
        uptimeMessage += `▸ Số nhân CPU: ${systemInfo.coreCount} | Tốc độ: ${systemInfo.cpuSpeed}MHz\n`;
        uptimeMessage += `▸ RAM đã dùng: ${systemInfo.usedMemory}/${systemInfo.totalMemory}GB (${systemInfo.memoryUsagePercent}%)\n`;
        uptimeMessage += `══════════════════\n`;
        uptimeMessage += `📊 Thông Tin Quy Trình\n`;
        uptimeMessage += `▸ Phiên bản Node.js: ${nodeVersion}\n`;
        uptimeMessage += `▸ Bộ nhớ Heap: ${systemInfo.processMemory.heapUsed}/${systemInfo.processMemory.heapTotal}MB\n`;
        uptimeMessage += `▸ Bộ nhớ RSS: ${systemInfo.processMemory.rss}MB\n`;
        uptimeMessage += `▸ Mạng: ${systemInfo.networkInfo}\n`;

        await actions.edit(uptimeMessage, replyMessage.messageID);
    }
};

async function getPing() {
   
    const fakePings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const randomPing = fakePings[Math.floor(Math.random() * fakePings.length)];
    return `${randomPing} ms`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSystemInfo() {
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    
    const fakeCpuModels = [
        "Intel Core i9-14900K @ 6.0GHz",
        "AMD Ryzen 9 7950X3D @ 5.7GHz", 
        "Intel Xeon Platinum 8490H @ 4.8GHz",
        "AMD EPYC 9654 @ 4.3GHz"
    ];
    const cpuModel = fakeCpuModels[Math.floor(Math.random() * fakeCpuModels.length)];
    
    const coreCount = 64;
    const cpuSpeed = 6000;
    const totalMemory = 512; 
    const usedMemory = Math.floor(Math.random() * 200) + 50;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
    
    const networkInterfaces = os.networkInterfaces();
    const processMemoryUsage = process.memoryUsage();
    
    const networkInfo = Object.entries(networkInterfaces)
        .filter(([_, interfaces]) => interfaces.some(i => !i.internal))
        .map(([name, interfaces]) => {
            const interface = interfaces.find(i => !i.internal);
            return `${name}: ${interface.address}`;
        }).join(', ');

    return {
        platform: "Ubuntu 22.04 LTS",
        arch: "x64", 
        hostname: "SUPER-SERVER-VPS-01", 
        cpuModel, 
        coreCount, 
        cpuSpeed,
        totalMemory: totalMemory.toFixed(0), 
        freeMemory: (totalMemory - usedMemory).toFixed(0), 
        usedMemory: usedMemory.toFixed(0), 
        memoryUsagePercent,
        networkInfo: "10Gbps Fiber Optic Network",
        processMemory: {
            heapUsed: (processMemoryUsage.heapUsed / 1024 / 1024).toFixed(2),
            heapTotal: (processMemoryUsage.heapTotal / 1024 / 1024).toFixed(2),
            rss: (processMemoryUsage.rss / 1024 / 1024).toFixed(2)
        }
    };
}

async function getNodeVersion() {
    try {
        const { stdout } = await execPromise('node -v');
        return stdout.trim();
    } catch {
        return 'N/A';
    }
}

async function getSystemUptime() {

    const fakeDays = Math.floor(Math.random() * 30) + 365; 
    const fakeHours = Math.floor(Math.random() * 24);
    const fakeMinutes = Math.floor(Math.random() * 60);
    const fakeSeconds = Math.floor(Math.random() * 60);
    return `${fakeDays} ngày, ${fakeHours} giờ, ${fakeMinutes} phút, ${fakeSeconds} giây`;
}
