const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = {
    name: "ssl",
    usedby: 0,
    info: "Chụp màn hình và kiểm tra bảo mật SSL của trang web",
    onPrefix: true,
    dev: "HNT",
    cooldowns: 6,
    dmUser: false,

    onLaunch: async function ({ api, event, target }) {
        const url = target[0];
        const device = target[1]?.toLowerCase() || 'mobile';

        const deviceConfigs = {
            'mobile': { width: 390, height: 844, device: 'Điện thoại' },
            'tablet': { width: 820, height: 1180, device: 'Máy tính bảng' },
            'desktop': { width: 1920, height: 1080, device: 'Máy tính' }
        };

        if (!url) {
            return api.sendMessage(
                `⚠️ Vui lòng cung cấp URL\n` +
                `📝 Cách dùng: ssl [url] [thiết bị]\n` +
                `📱 Thiết bị: mobile, tablet, desktop`,
                event.threadID,
                event.messageID
            );
        }

        const selectedDevice = deviceConfigs[device] || deviceConfigs.mobile;
        const check = await api.sendMessage(
            `🔄 Đang xử lý...\n` +
            `📱 Thiết bị: ${selectedDevice.device}`,
            event.threadID,
            event.messageID
        );

        try {
            
            const screenshotResponse = await axios({
                method: 'get',
                url: `https://render-puppeteer-test-sspb.onrender.com/ss?url=${url}&width=${selectedDevice.width}&height=${selectedDevice.height}`,
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
                      `📱 Thiết bị: ${selectedDevice.device}\n` +
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
