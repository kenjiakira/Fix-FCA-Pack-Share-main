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
        uptimeMessage += `▸ CPU: ${systemInfo.cpuUsage}% | ${systemInfo.cpuModel}\n`;
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
    try {
        const isWindows = os.platform() === 'win32';
        const pingCommand = isWindows ? 'ping -n 1 google.com' : 'ping -c 1 google.com';
        const { stdout } = await execPromise(pingCommand);
        const match = stdout.match(isWindows ? /time=(\d+)ms/ : /time=(\d+\.\d+) ms/);
        return match ? `${match[1]} ms` : 'N/A';
    } catch {
        return 'N/A';
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSystemInfo() {
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const cpuModel = os.cpus()[0].model;
    const coreCount = os.cpus().length;
    const cpuSpeed = os.cpus()[0].speed;
    const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedMemory = (totalMemory - freeMemory).toFixed(2);
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
        platform, arch, hostname, cpuModel, coreCount, cpuSpeed,
        totalMemory, freeMemory, usedMemory, memoryUsagePercent,
        networkInfo,
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
    const sysUptimeDays = Math.floor(os.uptime() / (60 * 60 * 24));
    const sysUptimeHours = Math.floor((os.uptime() % (60 * 60 * 24)) / (60 * 60));
    const sysUptimeMinutes = Math.floor((os.uptime() % (60 * 60)) / 60);
    const sysUptimeSeconds = Math.floor(os.uptime() % 60);
    return `${sysUptimeDays} ngày, ${sysUptimeHours} giờ, ${sysUptimeMinutes} phút, ${sysUptimeSeconds} giây`;
}
