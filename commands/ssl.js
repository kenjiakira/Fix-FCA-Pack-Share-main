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
        const device = target[1]?.toLowerCase() || 'iphone14';

        const deviceConfigs = {
          
            'iphone14': { width: 390, height: 844, device: 'iPhone 14' },
            'iphone14pro': { width: 393, height: 852, device: 'iPhone 14 Pro' },
            'iphone14max': { width: 428, height: 926, device: 'iPhone 14 Pro Max' },
            'ipad': { width: 820, height: 1180, device: 'iPad' },
            'ipadpro': { width: 1024, height: 1366, device: 'iPad Pro' },
            
            'pixel7': { width: 412, height: 915, device: 'Pixel 7' },
            'pixel7pro': { width: 412, height: 936, device: 'Pixel 7 Pro' },
            'galaxys23': { width: 360, height: 780, device: 'Galaxy S23' },
            'galaxys23ultra': { width: 384, height: 854, device: 'Galaxy S23 Ultra' },
            
            'hd': { width: 1280, height: 720, device: 'HD Desktop' },
            'fhd': { width: 1920, height: 1080, device: 'Full HD Desktop' },
            '2k': { width: 2560, height: 1440, device: 'QHD Desktop' },
            '4k': { width: 3840, height: 2160, device: '4K Desktop' }
        };

        if (!url) {
            const deviceList = Object.keys(deviceConfigs)
                .map(d => `• ${d}`)
                .join('\n');
                
            return api.sendMessage(
                `⚠️ Vui lòng cung cấp URL.\n` +
                `📝 Cách dùng: ssl [url] [thiết bị]\n` +
                `📱 Các thiết bị hỗ trợ:\n${deviceList}`,
                event.threadID,
                event.messageID
            );
        }

        const selectedDevice = deviceConfigs[device] || deviceConfigs.iphone14;
        const check = await api.sendMessage(
            `🔄 Đang xử lý yêu cầu của bạn...\n` +
            `📱 Thiết bị: ${selectedDevice.device}\n` +
            `📐 Độ phân giải: ${selectedDevice.width}x${selectedDevice.height}`,
            event.threadID,
            event.messageID
        );

        const filePath = path.join(__dirname, 'cache', `screenshot-${Date.now()}.png`);

        try {
            const screenshotResponse = await axios({
                method: 'get',
                url: `https://render-puppeteer-test-sspb.onrender.com/ss?url=${url}&width=${selectedDevice.width}&height=${selectedDevice.height}`,
                responseType: 'arraybuffer',
            });

            const statusCode = screenshotResponse.status;

            const certCheck = new Promise((resolve, reject) => {
                const req = https.get(url, (res) => {
                    const certificate = res.socket.getPeerCertificate();
                    if (Object.keys(certificate).length === 0) {
                        resolve({
                            status: '❌ Không tìm thấy chứng chỉ SSL',
                            details: null
                        });
                    } else {
                        const validFrom = new Date(certificate.valid_from);
                        const validTo = new Date(certificate.valid_to);
                        const currentDate = new Date();
                        const isValid = currentDate >= validFrom && currentDate <= validTo;
                        
                        resolve({
                            status: isValid ? '✅ Chứng chỉ SSL hợp lệ' : '❌ Chứng chỉ SSL không hợp lệ',
                            details: {
                                issuer: certificate.issuer.CN,
                                validFrom: validFrom.toLocaleDateString('vi-VN'),
                                validTo: validTo.toLocaleDateString('vi-VN'),
                                protocol: res.socket.getProtocol()
                            }
                        });
                    }
                });

                req.on('error', (error) => reject('❌ Lỗi khi kiểm tra chứng chỉ'));
                req.end();
            });

            fs.writeFileSync(filePath, Buffer.from(screenshotResponse.data, 'binary'));

            api.unsendMessage(check.messageID);

            const certResult = await certCheck;
            const certDetails = certResult.details ? `
📜 Nhà cung cấp: ${certResult.details.issuer}
📅 Ngày bắt đầu: ${certResult.details.validFrom}
📅 Ngày hết hạn: ${certResult.details.validTo}
🔐 Giao thức: ${certResult.details.protocol}` : '';

            api.sendMessage({
                body: `🌐 URL: ${url}\n` +
                      `📱 Thiết bị: ${selectedDevice.device}\n` +
                      `📐 Độ phân giải: ${selectedDevice.width}x${selectedDevice.height}\n` +
                      `📊 Mã trạng thái: ${statusCode}\n` +
                      `🔒 ${certResult.status}${certDetails}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                fs.unlinkSync(filePath);
            }, event.messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, event.threadID, event.messageID);
        }
    }
}
