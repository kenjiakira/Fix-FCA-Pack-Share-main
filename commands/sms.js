const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: "sms",
    info: "Spam SMS",
    dev: "HNT",
    category: "Tools",
    onPrefix: true,
    usedby: 2,
    usages: "sms [phone] [count]",
    cooldowns: 0,

    onLaunch: async ({ api, event, target }) => {
        if (target.length < 2) {
            return api.sendMessage(
                "📱 SMS Spam\n" +
                "Cách dùng: sms [số điện thoại] [số lần]",
                event.threadID
            );
        }

        const phone = target[0];
        const count = parseInt(target[1]);

        if (isNaN(count) || count < 1) {
            return api.sendMessage("❌ Số lần phải là số dương!", event.threadID);
        }

        if (!/^0\d{9}$/.test(phone)) {
            return api.sendMessage("❌ Số điện thoại không hợp lệ!", event.threadID);
        }

        try {
            api.sendMessage(`🚀 Bắt đầu spam ${count} lần đến ${phone}...`, event.threadID);

            const scriptPath = path.join(__dirname, 'dec.py');
            
            let command;
            if (process.platform === 'win32') {
       
                command = `start cmd /k python "${scriptPath}" ${phone} ${count}`;
            } else {
     
                command = `gnome-terminal -- python3 "${scriptPath}" ${phone} ${count}`;
            }

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`SMS Script Error: ${error}`);
                    return api.sendMessage("❌ Lỗi khi chạy script spam!", event.threadID);
                }
            });

            api.sendMessage(
                "✅ Đã mở terminal mới để chạy spam\n" +
                "⚠️ Vui lòng kiểm tra terminal để theo dõi tiến trình",
                event.threadID
            );

        } catch (error) {
            console.error("SMS Command Error:", error);
            api.sendMessage("❌ Lỗi: " + error.message, event.threadID);
        }
    }
};
