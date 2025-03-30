const axios = require('axios');
const dns = require('dns');
const { promisify } = require('util');
const translate = require('translate-google');

// DNS promise methods
const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);

module.exports = {
    name: "info",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tra cứu thông tin web, IP, DNS và dịch ngôn ngữ",
    usedby: 0,
    onPrefix: true,
    nickName: ["ip", "check", "dns", "translate", "tr", "dich"],
    usages: "[ip/check/dns/dich] [thông tin]",
    cooldowns: 5,

    langCodes: {
        'việt': 'vi', 'v': 'vi',
        'anh': 'en', 'a': 'en',
        'nhật': 'ja', 'n': 'ja',
        'hàn': 'ko', 'h': 'ko',
        'trung': 'zh', 't': 'zh',
        'pháp': 'fr', 'p': 'fr',
        'đức': 'de', 'nga': 'ru',
        'ý': 'it', 'tbn': 'es',
        'tl': 'th', 'indo': 'id'
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, messageReply } = event;
        const cmd = target[0]?.toLowerCase();
        const args = target.slice(1);

        if (!cmd) {
            return api.sendMessage(
                "📝 Hướng dẫn sử dụng:\n" +
                "1. Tra IP:\n!info ip [địa chỉ IP]\n" +
                "2. Kiểm tra web:\n!info check [URL]\n" +
                "3. Tra DNS:\n!info dns [tên miền]\n" +
                "4. Dịch ngôn ngữ:\n!info dich [ngôn ngữ] [nội dung]\n" +
                "hoặc Reply + !info dich [ngôn ngữ]",
                threadID
            );
        }

        switch(cmd) {
            case "ip":
                await this.checkIP(api, event, args);
                break;
            case "check":
                await this.checkWebsite(api, event, args, messageReply);
                break;
            case "dns":
                await this.checkDNS(api, event, args);
                break;
            case "dich":
            case "tr":
            case "translate":
                await this.translateText(api, event, args, messageReply);
                break;
        }
    },

    async checkIP(api, event, target) {
        const { threadID, messageID } = event;
        let ipAddress;

        if (target.length === 0) {
            try {
                const publicIp = await axios.get('https://api.ipify.org?format=json');
                ipAddress = publicIp.data.ip;
            } catch (error) {
                return api.sendMessage("❎ Không thể lấy địa chỉ IP.", threadID);
            }
        } else {
            ipAddress = target.join(' ');
        }

        try {
            const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=66846719`);
            const info = response.data;

            if (info.status === 'fail') {
                return api.sendMessage(`⚠️ Lỗi: ${info.message}`, threadID);
            }

            const message = {
                body: `🔍 Thông tin IP: ${ipAddress}\n` +
                      `🌐 Châu lục: ${info.continent}\n` +
                      `🏳️ Quốc gia: ${info.country}\n` +
                      `🏙️ Thành phố: ${info.city}\n` +
                      `📮 Mã bưu chính: ${info.zip}\n` +
                      `⏱️ Timezone: ${info.timezone}\n` +
                      `🌐 ISP: ${info.isp}\n` +
                      `⚠️ Proxy/VPN: ${info.proxy ? "Có" : "Không"}`,
                location: {
                    latitude: info.lat,
                    longitude: info.lon,
                    current: true
                }
            };

            return api.sendMessage(message, threadID);

        } catch (error) {
            return api.sendMessage("⚠️ Lỗi khi kiểm tra IP.", threadID);
        }
    },

    async checkWebsite(api, event, target, messageReply) {
        const { threadID, messageID } = event;
        
        let url;
        if (messageReply?.body) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const matches = messageReply.body.match(urlRegex);
            if (matches) url = matches[0];
        } else {
            url = target[0];
        }

        if (!url) {
            return api.sendMessage("Vui lòng cung cấp URL để kiểm tra.", threadID);
        }

        try {
            const response = await axios.get(`https://joncll.serv00.net/checker.php?url=${url}`);
            const data = response.data;
            const emoji = data.status_code === "200" ? "🟢" : 
                         data.status_code.startsWith("4") || data.status_code.startsWith("5") ? "🔴" : "🟠";

            return api.sendMessage(
                `${emoji} Trạng thái: ${data.status_code}\n` +
                `🌐 IP: ${data.ip_address}\n` +
                `📋 Headers:\n${Object.entries(data.headers)
                    .map(([k, v]) => `- ${k}: ${v}`).join('\n')}`,
                threadID
            );
        } catch (error) {
            return api.sendMessage("❌ Lỗi khi kiểm tra website.", threadID);
        }
    },

    async checkDNS(api, event, target) {
        const { threadID, messageID } = event;
        const domain = target[0];

        if (!domain) {
            return api.sendMessage("Vui lòng nhập tên miền để tra cứu DNS.", threadID);
        }

        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain)) {
            return api.sendMessage("⚠️ Tên miền không hợp lệ!", threadID);
        }

        try {
            let result = `🌐 DNS của ${domain}:\n\n`;

            try {
                const ipv4 = await resolve4(domain);
                result += `📍 IP:\n${ipv4.join('\n')}\n\n`;
            } catch (e) {
                result += "📍 Không có IP\n\n";
            }

            try {
                const mx = await resolveMx(domain);
                result += "📧 Mail Servers:\n";
                mx.sort((a, b) => a.priority - b.priority)
                  .forEach(r => result += `Priority ${r.priority}: ${r.exchange}\n`);
                result += "\n";
            } catch (e) {
                result += "📧 Không có mail server\n\n";
            }

            try {
                const ns = await resolveNs(domain);
                result += `🔧 Name Servers:\n${ns.join('\n')}\n\n`;
            } catch (e) {
                result += "🔧 Không có name server\n\n";
            }

            return api.sendMessage(result.trim(), threadID);

        } catch (error) {
            return api.sendMessage("❌ Lỗi khi tra cứu DNS!", threadID);
        }
    },

    async translateText(api, event, target, messageReply) {
        const { threadID, messageID } = event;
        
        try {
            let langCode = 'vi';
            let content = '';

            if (messageReply) {
                langCode = this.langCodes[target[0]?.toLowerCase()] || 'vi';
                content = messageReply.body;
            } else {
                langCode = this.langCodes[target[0]?.toLowerCase()] || 'vi';
                content = target.slice(1).join(" ") || target.join(" ");
            }

            if (!content) {
                return api.sendMessage("❌ Vui lòng nhập nội dung cần dịch!", threadID);
            }

            const translated = await translate(content, { to: langCode });
            return api.sendMessage(
                `📝 Gốc: ${content}\n\n` +
                `🌐 Dịch (${langCode}): ${translated}`,
                threadID
            );

        } catch (err) {
            return api.sendMessage(
                `❌ Lỗi: ${err.message || "Không thể dịch văn bản"}`,
                threadID
            );
        }
    }
};
