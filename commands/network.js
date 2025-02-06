const { exec } = require('child_process');
const dns = require('dns');
const os = require('os');

module.exports = {
    name: "network",
    info: "Công cụ chẩn đoán mạng",
    dev: "HNT",
    usages: "network [check/trace/lookup] [host]",
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        if (!target[0]) {
            return api.sendMessage(
                "📡 Network Tools:\n" +
                "1. network check - Kiểm tra kết nối\n" +
                "2. network trace [host] - Trace route\n" +
                "3. network lookup [domain] - DNS lookup",
                event.threadID
            );
        }

        const command = target[0].toLowerCase();
        const host = target[1];

        const msg = await api.sendMessage("⏳ Đang xử lý...", event.threadID);

        try {
            let result;
            switch (command) {
                case "check":
                    result = await checkNetwork();
                    break;
                case "trace":
                    if (!host) throw new Error("Thiếu host!");
                    result = await traceRoute(host);
                    break;
                case "lookup":
                    if (!host) throw new Error("Thiếu domain!");
                    result = await dnsLookup(host);
                    break;
                default:
                    throw new Error("Lệnh không hợp lệ!");
            }

            api.unsendMessage(msg.messageID);
            return api.sendMessage(result, event.threadID);
        } catch (error) {
            api.unsendMessage(msg.messageID);
            return api.sendMessage(`❌ Lỗi: ${error.message}`, event.threadID);
        }
    }
};

async function checkNetwork() {
    const interfaces = os.networkInterfaces();
    let report = "📡 THÔNG TIN MẠNG\n\n";
    
    for (let iface in interfaces) {
        interfaces[iface].forEach(details => {
            if (details.family === 'IPv4') {
                report += `🔹 Interface: ${iface}\n`;
                report += `IP: ${details.address}\n`;
                report += `Subnet: ${details.netmask}\n\n`;
            }
        });
    }
    return report;
}

async function traceRoute(host) {
    return new Promise((resolve, reject) => {
        const cmd = process.platform === 'win32' ? `tracert ${host}` : `traceroute ${host}`;
        exec(cmd, (error, stdout) => {
            if (error) reject(error);
            resolve(`🔄 TRACE ROUTE TO ${host}\n\n${stdout}`);
        });
    });
}

async function dnsLookup(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveAny(domain, (err, records) => {
            if (err) {
                return reject(err);
            }
            
            if (!records || records.length === 0) {
                return resolve(`🔍 DNS LOOKUP: ${domain}\n\n❌ Không tìm thấy bản ghi DNS nào`);
            }

            let result = `🔍 DNS LOOKUP: ${domain}\n\n`;
            try {
                records.forEach(record => {
                    switch(record.type) {
                        case 'A':
                            result += `📍 A Record (IPv4):\n${record.address}\n\n`;
                            break;
                        case 'AAAA':
                            result += `📍 AAAA Record (IPv6):\n${record.address}\n\n`;
                            break;
                        case 'MX':
                            result += `📧 MX Record:\n${record.exchange} (priority: ${record.priority})\n\n`;
                            break;
                        case 'NS':
                            result += `🌐 NS Record:\n${record.value}\n\n`;
                            break;
                        case 'TXT':
                            result += `📝 TXT Record:\n${record.entries.join('\n')}\n\n`;
                            break;
                        default:
                            result += `ℹ️ ${record.type} Record:\n${JSON.stringify(record)}\n\n`;
                    }
                });
            } catch (error) {
                return resolve(`🔍 DNS LOOKUP: ${domain}\n\n❌ Lỗi khi phân tích bản ghi: ${error.message}`);
            }
            
            resolve(result.trim());
        });
    });
}
