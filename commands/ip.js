const axios = require('axios');

module.exports = {
    name: "ip",
    info: "Kiểm tra thông tin IP",
    usedby: 0,
    category: "Tools",
    dev: "NTKhang, Nguyên Blue [convert]",
    onPrefix: true,
    dmUser: false,
    nickName: ["ip", "checkip", "ipinfo"],
    usages: "ip [địa chỉ IP]\n\n" +
            "Hướng dẫn sử dụng:\n" +
            "- `ip`: Hiển thị IP của bạn\n" +
            "- `ip [địa chỉ IP]`: Kiểm tra thông tin địa chỉ IP.",
    cooldowns: 5,

    onLaunch: async function ({ api, event, target }) { 
        const { threadID, messageID } = event;
        let ipAddress;

        if (!Array.isArray(target) || target.length === 0) {
            try {
                const publicIp = await axios.get('https://api.ipify.org?format=json');
                ipAddress = publicIp.data.ip;
            } catch (error) {
                return await api.sendMessage("❎ Không thể lấy địa chỉ IP của bạn.", threadID, messageID);
            }
        } else {
            ipAddress = target.join(' ');
        }

        try {
            const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=66846719`);
            const infoip = response.data;

            if (infoip.status === 'fail') {
                return await api.sendMessage(`⚠️ Đã xảy ra lỗi: ${infoip.message}`, threadID, messageID);
            }

            const messageBody = `🔍 IP Address: ${ipAddress}\n` +
                                `🗺️ Châu lục: ${infoip.continent}\n` +
                                `🏳️ Quốc gia: ${infoip.country}\n` +
                                `🎊 Mã QG: ${infoip.countryCode}\n` +
                                `🕋 Khu vực: ${infoip.region}\n` +
                                `⛱️ Vùng/Tiểu bang: ${infoip.regionName}\n` +
                                `🏙️ Thành phố: ${infoip.city}\n` +
                                `🛣️ Quận/Huyện: ${infoip.district}\n` +
                                `📮 Mã bưu chính: ${infoip.zip}\n` +
                                `🧭 Latitude: ${infoip.lat}\n` +
                                `🧭 Longitude: ${infoip.lon}\n` +
                                `⏱️ Timezone: ${infoip.timezone}\n` +
                                `👨‍✈️ Tên tổ chức: ${infoip.org}\n` +
                                `💵 Đơn vị tiền tệ: ${infoip.currency}\n` +
                                `🌐 ISP: ${infoip.isp}\n` +
                                `🏢 AS: ${infoip.as}\n` +
                                `⚠️ Proxy/VPN: ${infoip.proxy ? "Có" : "Không"}\n` +
                                `🌐 Mobile: ${infoip.mobile ? "Có" : "Không"}`;

            return await api.sendMessage({
                body: messageBody,
                location: {
                    latitude: infoip.lat,
                    longitude: infoip.lon,
                    current: true
                }
            }, threadID, messageID);
        } catch (error) {
            console.error(error);
            return await api.sendMessage("⚠️ Đã xảy ra lỗi khi kiểm tra IP. Vui lòng thử lại sau.", threadID, messageID);
        }
    }
};