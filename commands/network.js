const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const net = require('net');
const cheerio = require('cheerio');

module.exports = {
    name: "network",
    dev: "HNT",
    category: "Tools",
    usedby: 0,
    info: "Công cụ kiểm tra mạng & SEO",
    onPrefix: true,
    usages: `network [lệnh] [tham số]
- speed: Kiểm tra tốc độ mạng
- ssl [url]: Kiểm tra chứng chỉ SSL của website
- port [host]: Quét cổng của máy chủ
- seo [url]: Phân tích SEO chi tiết của trang web`,
    cooldowns: 15,

    async onLaunch({ api, event, target }) {
        const [subcommand, ...params] = target;

        if (!subcommand) {
            return api.sendMessage(this.usages, event.threadID);
        }

        switch (subcommand.toLowerCase()) {
            case 'speed':
                await this.speedTest(api, event);
                break;
            case 'ssl':
                await this.sslCheck(api, event, params[0]);
                break;
            case 'port':
                await this.portScan(api, event, params[0]);
                break;
            case 'seo':
                await this.seoAnalysis(api, event, params[0]);
                break;
            default:
                return api.sendMessage("❌ Lệnh không hợp lệ!\n\n" + this.usages, event.threadID);
        }
    },

    async speedTest(api, event) {
        const progressStages = [
            "⏳ Đang khởi tạo kiểm tra...",
            "📡 Đang kiểm tra máy chủ...",
            "⬇️ Đang kiểm tra tốc độ tải xuống...",
            "⬆️ Đang kiểm tra tốc độ tải lên...",
            "📊 Đang phân tích kết quả..."
        ];

        let currentMsg = await api.sendMessage(progressStages[0], event.threadID);

        try {
            await api.editMessage(progressStages[1], currentMsg.messageID);
            
            // Test download speed
            await api.editMessage(progressStages[2], currentMsg.messageID);
            const downloadSpeed = await this.measureDownloadSpeed();
            
            // Test upload speed (simulated)
            await api.editMessage(progressStages[3], currentMsg.messageID);
            const uploadSpeed = await this.measureUploadSpeed();
            
            await api.editMessage(progressStages[4], currentMsg.messageID);
            const ping = await this.getPing();
            const isp = await this.getISP();

            const result = `🌐 Chi tiết tốc độ mạng:\n\n` +
                `📥 Tốc độ tải xuống: ${downloadSpeed.toFixed(2)} Mbps\n` +
                `📤 Tốc độ tải lên: ${uploadSpeed.toFixed(2)} Mbps\n` +
                `🏷️ Nhà mạng: ${isp}\n` +
                `🔄 Ping: ${ping} ms`;

            await api.editMessage(result, currentMsg.messageID);
        } catch (error) {
            api.editMessage("❌ Lỗi kiểm tra tốc độ mạng!", currentMsg.messageID);
        }
    },

    async measureDownloadSpeed() {
        try {
            const testUrl = 'https://speed.cloudflare.com/__down?bytes=10000000'; // 10MB test file
            const startTime = Date.now();
            const response = await axios.get(testUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // seconds
            const sizeInBytes = response.data.length;
            const speedInMbps = (sizeInBytes * 8) / (duration * 1000000); // Convert to Mbps
            return speedInMbps;
        } catch (error) {
            return 0;
        }
    },

    async measureUploadSpeed() {
        try {
            // Simulate upload by sending data
            const testData = Buffer.alloc(1000000); // 1MB test data
            const testUrl = 'https://httpbin.org/post';
            const startTime = Date.now();
            await axios.post(testUrl, testData, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/octet-stream' }
            });
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // seconds
            const sizeInBytes = testData.length;
            const speedInMbps = (sizeInBytes * 8) / (duration * 1000000); // Convert to Mbps
            return speedInMbps;
        } catch (error) {
            return 0;
        }
    },

    async sslCheck(api, event, url) {
        if (!url) {
            return api.sendMessage(
                "📌 Cách dùng: network ssl [url]\n" +
                "Ví dụ: network ssl example.com",
                event.threadID
            );
        }

        const check = await api.sendMessage("🔄 Đang kiểm tra SSL...", event.threadID);

        try {
            const screenshotResponse = await axios({
                method: 'get',
                url: `https://render-puppeteer-test-sspb.onrender.com/ss?url=${url}&width=390&height=844`,
                responseType: 'arraybuffer',
            });

            const certResult = await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    const cert = res.socket.getPeerCertificate();
                    if (Object.keys(cert).length === 0) {
                        resolve({ status: '❌ Không có SSL' });
                    } else {
                        const validTo = new Date(cert.valid_to);
                        const isValid = validTo > new Date();
                        resolve({
                            status: isValid ? '✅ SSL hợp lệ' : '❌ SSL hết hạn',
                            provider: cert.issuer.CN,
                            expiry: validTo.toLocaleDateString('vi-VN')
                        });
                    }
                }).on('error', () => resolve({ status: '❌ Không thể kiểm tra SSL' }));
            });

            const tempPath = path.join(__dirname, 'cache', `ssl-${Date.now()}.png`);
            fs.writeFileSync(tempPath, Buffer.from(screenshotResponse.data));

            await api.sendMessage({
                body: `🌐 URL: ${url}\n` +
                      `🔒 ${certResult.status}` +
                      (certResult.provider ? `\n📜 SSL Provider: ${certResult.provider}` : '') +
                      (certResult.expiry ? `\n📅 Hết hạn: ${certResult.expiry}` : ''),
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => fs.unlinkSync(tempPath));

            api.unsendMessage(check.messageID);
        } catch (error) {
            api.unsendMessage(check.messageID);
            api.sendMessage(`❌ Lỗi: ${error.message}`, event.threadID);
        }
    },

    async portScan(api, event, host) {
        if (!host) {
            return api.sendMessage("❌ Vui lòng nhập địa chỉ host!", event.threadID);
        }

        const commonPorts = [21, 22, 80, 443, 3306, 8080];
        const msg = await api.sendMessage("⏳ Đang quét cổng...", event.threadID);

        try {
            let results = `🔍 KẾT QUẢ QUÉT CỔNG ${host}:\n\n`;

            for (const port of commonPorts) {
                const socket = new net.Socket();
                const status = await new Promise((resolve) => {
                    socket.connect(port, host)
                        .on('connect', () => {
                            socket.destroy();
                            resolve('🟢 Mở');
                        })
                        .on('error', () => resolve('🔴 Đóng'));
                });
                results += `Cổng ${port}: ${status}\n`;
            }

            api.sendMessage(results, event.threadID, () => api.unsendMessage(msg.messageID));
        } catch (error) {
            api.sendMessage("❌ Lỗi quét cổng!", event.threadID);
            api.unsendMessage(msg.messageID);
        }
    },

    async seoAnalysis(api, event, url) {
        if (!url) {
            return api.sendMessage(
                "🔎 SEO là gì?\n" +
                "SEO (Search Engine Optimization) là tối ưu hóa công cụ tìm kiếm giúp website của bạn dễ xuất hiện trên Google.\n\n" +
                "📌 Cách dùng: network seo [url]\n" +
                "Ví dụ: network seo https://example.com",
                event.threadID,
                event.messageID
            );
        }

        const loadingMessage = await api.sendMessage(
            "⏳ Đang tiến hành phân tích website...\n" +
            "📊 Quá trình này có thể mất 30-60 giây",
            event.threadID
        );

        try {
            const validUrl = url.startsWith('http') ? url : `https://${url}`;
            const pageResponse = await axios.get(validUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });

            const $ = cheerio.load(pageResponse.data);
            const seoData = {
                basic: {
                    title: $('title').text().trim(),
                    description: $('meta[name="description"]').attr('content'),
                    keywords: $('meta[name="keywords"]').attr('content'),
                    viewport: $('meta[name="viewport"]').attr('content'),
                },
                content: {
                    h1Tags: $('h1').length,
                    h2Tags: $('h2').length,
                    wordCount: $('body').text().trim().split(/\s+/).length,
                },
                technical: {
                    ssl: validUrl.startsWith('https'),
                    robotsTxt: await this.checkRobotsTxt(validUrl),
                    sitemap: await this.checkSitemap(validUrl),
                }
            };

            let report = "🔍 BÁO CÁO PHÂN TÍCH SEO\n\n";
            report += `📌 Tiêu đề: ${seoData.basic.title || 'Không có'}\n`;
            report += `📖 Mô tả: ${seoData.basic.description || 'Không có'}\n`;
            report += `🔑 Từ khóa: ${seoData.basic.keywords || 'Không có'}\n`;
            report += `📱 Viewport: ${seoData.basic.viewport ? 'Có' : 'Không'}\n\n`;
            report += `📊 Nội dung:\n`;
            report += `- Số thẻ H1: ${seoData.content.h1Tags}\n`;
            report += `- Số thẻ H2: ${seoData.content.h2Tags}\n`;
            report += `- Số từ: ${seoData.content.wordCount}\n\n`;
            report += `⚙️ Kỹ thuật:\n`;
            report += `- HTTPS: ${seoData.technical.ssl ? 'Có' : 'Không'}\n`;
            report += `- Robots.txt: ${seoData.technical.robotsTxt ? 'Có' : 'Không'}\n`;
            report += `- Sitemap: ${seoData.technical.sitemap ? 'Có' : 'Không'}\n`;

            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(report, event.threadID, event.messageID);

        } catch (error) {
            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(`❌ Lỗi khi phân tích: ${error.message}`, event.threadID, event.messageID);
        }
    },

    async checkRobotsTxt(url) {
        try {
            await axios.head(`${url}/robots.txt`);
            return true;
        } catch {
            return false;
        }
    },

    async checkSitemap(url) {
        try {
            await axios.head(`${url}/sitemap.xml`);
            return true;
        } catch {
            return false;
        }
    },

    async getISP() {
        try {
            const response = await axios.get('https://ipinfo.io/json?token=77999b466a085d');
            return response.data.org || "Không xác định";
        } catch (error) {
            return "Không xác định";
        }
    },

    async getPing() {
        return new Promise((resolve) => {
            const start = Date.now();
            https.get('https://www.google.com', (res) => {
                resolve(Date.now() - start);
                res.resume();
            }).on('error', () => resolve(0));
        });
    }
};
