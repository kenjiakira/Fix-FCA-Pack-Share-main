const os = require('os');
const fs = require('fs');

const botStartTime = Date.now();

function formatUptime(ms) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / 60000) % 60);
    const h = Math.floor((ms / 3600000) % 24);
    const d = Math.floor(ms / 86400000);
    return `${d} ngày ${h} giờ ${m} phút ${s} giây`;
}

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
        const start = Date.now();
        const { messageID } = event;

        const usersDB = JSON.parse(fs.readFileSync("./database/users.json", "utf8") || "{}");
        const threadsDB = JSON.parse(fs.readFileSync("./database/threads.json", "utf8") || "{}");
        const userCount = Object.keys(usersDB).length;
        const threadCount = Object.keys(threadsDB).length;

        const reply = await actions.reply("Đang tải...");
        await new Promise(r => setTimeout(r, 800));

        const botUptime = formatUptime(Date.now() - botStartTime);
        const sysUptime = formatUptime(os.uptime() * 1000);
        const responseMs = Date.now() - start;

        const cpus = os.cpus();
        const cpuModel = cpus[0]?.model?.trim() || "N/A";
        const cpuSpeed = cpus[0]?.speed || 0;
        const totalMem = (os.totalmem() / 1024 ** 3).toFixed(1);
        const usedMem = ((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(1);
        const memPercent = ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1);

        const mem = process.memoryUsage();
        const heapUsed = (mem.heapUsed / 1024 ** 2).toFixed(1);
        const heapTotal = (mem.heapTotal / 1024 ** 2).toFixed(1);
        const rss = (mem.rss / 1024 ** 2).toFixed(1);

        const nets = Object.entries(os.networkInterfaces())
            .filter(([, ifs]) => ifs.some(i => !i.internal))
            .map(([name, ifs]) => {
                const i = ifs.find(x => !x.internal);
                return i ? `${name}: ${i.address}` : null;
            })
            .filter(Boolean)
            .join(", ") || "—";

        const msg = [
            "🔰 THÔNG TIN HỆ THỐNG BOT 🔰",
            "═════════════",
            "🤖 Bot: " + botUptime,
            `▸ User: ${userCount} | Nhóm: ${threadCount}`,
            `▸ Phản hồi: ${responseMs} ms`,
            "═════════════",
            `💻 Máy: ${os.platform()} ${os.arch()} | ${os.hostname()}`,
            `▸ Uptime hệ thống: ${sysUptime}`,
            `▸ CPU: ${cpuModel} | ${cpus.length} nhân @ ${cpuSpeed}MHz`,
            `▸ RAM: ${usedMem}/${totalMem} GB (${memPercent}%)`,
            "═════════════",
            `🔧 Node: ${process.version} | Heap: ${heapUsed}/${heapTotal} MB | RSS: ${rss} MB`,
            `▸ Mạng: ${nets}`
        ].join("\n");

        await actions.edit(msg, reply.messageID);
    }
};
