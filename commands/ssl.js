const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = {
    name: "ssl",
    usedby: 0,
    category: "Tiện Ích",
    info: "kiểm tra bảo mật SSL",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 6,
    dmUser: false,

    onLaunch: async function ({ api, event, target }) {
        const url = target[0];

        if (!url) {
            return api.sendMessage(
                "🔒 SSL là gì?\n" +
                "SSL (Secure Sockets Layer) là chứng chỉ bảo mật giúp mã hóa thông tin và xác thực website của bạn.\n\n" +
                "💡 Tác dụng của lệnh này:\n" +
                "- Kiểm tra tính hợp lệ của chứng chỉ SSL\n" +
                "- Chụp ảnh màn hình website\n" +
                "- Xem thông tin nhà cung cấp SSL\n" +
                "- Kiểm tra ngày hết hạn chứng chỉ\n\n" +
                "📌 Cách dùng: ssl [url]\n" +
                "Ví dụ: ssl example.com",
                event.threadID,
                event.messageID
            );
        }

        const check = await api.sendMessage(
            "🔄 Đang xử lý...\n" +
            "📱 Thiết bị: iPhone 16",
            event.threadID,
            event.messageID
        );

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
                      `📱 Thiết bị: iPhone 16\n` +
                      `🔒 ${certResult.status}` +
                      (certResult.provider ? `\n📜 SSL Provider: ${certResult.provider}` : '') +
                      (certResult.expiry ? `\n📅 Hết hạn: ${certResult.expiry}` : ''),
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => fs.unlinkSync(tempPath));

            api.unsendMessage(check.messageID);

        } catch (error) {
            api.unsendMessage(check.messageID);
            return api.sendMessage(
                `❌ Lỗi: ${error.message}`, 
                event.threadID, 
                event.messageID
            );
        }
    }
};
