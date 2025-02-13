const axios = require('axios');

module.exports = {
    name: "phatnguoi",
    dev: "HNT",
    info: "Tra cứu thông tin phạt nguội xe",
    onPrefix: true,
    usages: "phatnguoi [biển số xe]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        if (!target[0]) {
            return api.sendMessage(
                "🚗 PHẠT NGUỘI - TRA CỨU VI PHẠM\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách sử dụng: .phatnguoi [biển số xe]\n" +
                "Ví dụ: .phatnguoi 51F12345\n\n" +
                "Lưu ý: Biển số xe phải theo định dạng:\n" +
                "- 51F12345 hoặc\n" +
                "- 51F-123.45",
                threadID, messageID
            );
        }

        let bienso = target[0].trim();
        // Chuẩn hóa biển số
        bienso = bienso.replace(/[-. ]/g, '');

        if (!/^\d{2}[A-Z]\d{5,6}$/.test(bienso)) {
            return api.sendMessage(
                "⚠️ Biển số không hợp lệ!\n\n" +
                "Định dạng đúng:\n" +
                "- 51F12345 hoặc\n" +
                "- 51F-123.45",
                threadID, messageID
            );
        }

        api.sendMessage("🔍 Đang tra cứu thông tin... Vui lòng đợi", threadID, messageID);

        try {
            const response = await axios.post('https://api.checkphatnguoi.vn/phatnguoi', {
                bienso: bienso
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });

            const violations = response.data.data;

            if (!Array.isArray(violations) || violations.length === 0) {
                return api.sendMessage(
                    "✅ KHÔNG CÓ VI PHẠM\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `Biển số ${bienso} không có thông tin vi phạm.`,
                    threadID, messageID
                );
            }

            let messages = violations.map((violation, index) => {
                return `🚨 VI PHẠM ${index + 1}/${violations.length}\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `🚗 Biển số: ${violation['Biển kiểm soát']}\n` +
                    `🎨 Màu biển: ${violation['Màu biển']}\n` +
                    `🚙 Loại xe: ${violation['Loại phương tiện']}\n` +
                    `⏰ Thời gian: ${violation['Thời gian vi phạm']}\n` +
                    `📍 Địa điểm: ${violation['Địa điểm vi phạm']}\n` +
                    `❌ Lỗi vi phạm: ${violation['Hành vi vi phạm']}\n` +
                    `👮 Đơn vị phát hiện: ${violation['Đơn vị phát hiện vi phạm']}\n` +
                    `📌 Nơi giải quyết:\n${Array.isArray(violation['Nơi giải quyết vụ việc']) ? 
                        violation['Nơi giải quyết vụ việc'].map(loc => `- ${loc}`).join('\n') : 
                        violation['Nơi giải quyết vụ việc']}\n` +
                    `⚡ Trạng thái: ${violation['Trạng thái']}`;
            });

            // Gửi từng vi phạm một để tránh tin nhắn quá dài
            for (let msg of messages) {
                await api.sendMessage(msg, threadID);
                // Đợi 1 giây giữa các tin nhắn để tránh spam
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage(
                "❌ Đã có lỗi xảy ra!\n" +
                "Vui lòng thử lại sau hoặc kiểm tra lại biển số.",
                threadID, messageID
            );
        }
    }
};
