const dns = require('dns');
const { promisify } = require('util');

// Convert DNS methods to promise-based
const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const reverse = promisify(dns.reverse);

module.exports = {
    name: "dnslookup",
    dev: "HNT",
    category: "Tools",
    info: "Tra cứu thông tin DNS của tên miền",
    usedby: 0,
    onPrefix: true,
    usages: "[domain]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        const domain = target[0];

        if (!domain) {
            return api.sendMessage(
                "Cách dùng: dnslookup [tên miền]\n" +
                "Ví dụ: dnslookup google.com",
                threadID, messageID
            );
        }

        // Basic domain name validation
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain)) {
            return api.sendMessage(
                "⚠️ Tên miền không hợp lệ!",
                threadID, messageID
            );
        }

        try {
            let result = `🌐 Thông tin DNS của ${domain}:\n\n`;

            // Get A records (IPv4)
            try {
                const ipv4 = await resolve4(domain);
                result += `📍 Địa chỉ IP:\n${ipv4.join('\n')}\n\n`;
            } catch (e) {
                result += "📍 Không tìm thấy địa chỉ IP\n\n";
            }

            // Get MX records
            try {
                const mx = await resolveMx(domain);
                result += "📧 Mail Servers:\n";
                mx.sort((a, b) => a.priority - b.priority)
                  .forEach(record => {
                    result += `Priority ${record.priority}: ${record.exchange}\n`;
                  });
                result += "\n";
            } catch (e) {
                result += "📧 Không tìm thấy mail server\n\n";
            }

            // Get NS records
            try {
                const ns = await resolveNs(domain);
                result += `🔧 Name Servers:\n${ns.join('\n')}\n\n`;
            } catch (e) {
                result += "🔧 Không tìm thấy name server\n\n";
            }

            // Get TXT records
            try {
                const txt = await resolveTxt(domain);
                if (txt.length > 0) {
                    result += "📝 TXT Records:\n";
                    txt.forEach(record => {
                        result += `${record.join(' ')}\n`;
                    });
                }
            } catch (e) {
                result += "📝 Không tìm thấy TXT record";
            }

            return api.sendMessage(result, threadID, messageID);

        } catch (error) {
            console.error("DNS lookup error:", error);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi khi tra cứu DNS!",
                threadID, messageID
            );
        }
    }
};
