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
        const device = target[1] || 'iphone 16 Pro Max';

        if (!url) {
            return api.sendMessage("⚠️ Vui lòng cung cấp URL.\n📝 Cách dùng: ssl [url] [thiết bị]\n💡 Các thiết bị: iphone, ipad, pixel, galaxy", event.threadID, event.messageID);
        }

        const check = await api.sendMessage("🔄 Đang xử lý yêu cầu của bạn...\n📸 Chụp màn hình\n🔒 Kiểm tra SSL", event.threadID, event.messageID);
        const filePath = path.join(__dirname, 'cache', `screenshot-${Date.now()}.png`);

        try {
            const screenshotResponse = await axios({
                method: 'get',
                url: `https://render-puppeteer-test-sspb.onrender.com/ss?url=${url}&device=${device}`,
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
                body: `🌐 URL: ${url}\n📱 Thiết bị: ${device}\n📊 Mã trạng thái: ${statusCode}\n🔒 ${certResult.status}${certDetails}`,
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
