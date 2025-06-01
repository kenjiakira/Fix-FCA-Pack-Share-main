const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const vipService = require('../game/vip/vipService');

// Queue system for SMS requests
const smsQueue = [];
let isProcessing = false;

// Process queue function
async function processQueue(api) {
    if (isProcessing || smsQueue.length === 0) return;
    
    isProcessing = true;
    
    while (smsQueue.length > 0) {
        const request = smsQueue.shift();
        const { phone, count, threadID, senderID } = request;
        
        try {
            await api.sendMessage(`🚀 Đang xử lý spam ${count} lần đến ${phone}... (Còn ${smsQueue.length} yêu cầu trong hàng đợi)`, threadID);
            
            const scriptPath = path.join(__dirname, 'dec.py');
            
            let command;
            if (process.platform === 'win32') {
                command = `start cmd /c python "${scriptPath}" ${phone} ${count}`;
            } else {
                command = `gnome-terminal -- python3 "${scriptPath}" ${phone} ${count}`;
            }

            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`SMS Script Error: ${error}`);
                        api.sendMessage("❌ Lỗi khi chạy script spam!", threadID);
                        reject(error);
                    } else {
                        api.sendMessage("✅ Đã hoàn thành spam SMS!", threadID);
                        resolve();
                    }
                });
            });
            
            // Delay between requests to prevent overload
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error("SMS Queue Error:", error);
            await api.sendMessage("❌ Lỗi trong hàng đợi: " + error.message, threadID);
        }
    }
    
    isProcessing = false;
}

module.exports = {
    name: "sms",
    info: "Spam SMS",
    dev: "HNT",
    category: "Tools",
    onPrefix: true,
    usedby: 0,
    usages: "sms [phone] [count] | sms queue | sms clear",
    cooldowns: 0,

    onLaunch: async ({ api, event, target }) => {
        const { senderID, threadID, messageID } = event;
        
        const vipStatus = vipService.checkVIP(senderID);
        if (!vipStatus.success) {
            return api.sendMessage(
                "⭐ Công cụ này chỉ dành cho người dùng VIP\n" +
                "👑 Gõ .vip để xem thông tin cách đăng ký VIP",
                threadID, messageID
            );
        }

        // Check for queue commands
        if (target[0] === "queue") {
            return api.sendMessage(
                `📋 Trạng thái hàng đợi SMS:\n` +
                `• Số yêu cầu đang chờ: ${smsQueue.length}\n` +
                `• Đang xử lý: ${isProcessing ? "Có" : "Không"}\n` +
                `• Lệnh: sms clear - Xóa hàng đợi`,
                threadID
            );
        }

        if (target[0] === "clear") {
            smsQueue.length = 0;
            return api.sendMessage("🗑️ Đã xóa tất cả yêu cầu trong hàng đợi!", threadID);
        }

        if (target.length < 2) {
            return api.sendMessage(
                "📱 SMS Spam\n" +
                "Cách dùng: sms [số điện thoại] [số lần]\n" +
                "Khác: sms queue (xem hàng đợi) | sms clear (xóa hàng đợi)",
                event.threadID
            );
        }

        const phone = target[0];
        const count = parseInt(target[1]);

        if (isNaN(count) || count < 1) {
            return api.sendMessage("❌ Số lần phải là số dương!", event.threadID);
        }

        if (count > 10) {
            return api.sendMessage("❌ Giới hạn tối đa 10 lần mỗi lần spam!", event.threadID);
        }

        if (!/^0\d{9}$/.test(phone)) {
            return api.sendMessage("❌ Số điện thoại không hợp lệ!", event.threadID);
        }

        // Add to queue
        smsQueue.push({
            phone,
            count,
            threadID,
            senderID,
            timestamp: Date.now()
        });

        api.sendMessage(
            `📋 Đã thêm vào hàng đợi!\n` +
            `📱 Số: ${phone}\n` +
            `🔢 Lần: ${count}\n` +
            `⏳ Vị trí: ${smsQueue.length}\n` +
            `${isProcessing ? "⚡ Đang xử lý yêu cầu khác..." : "🚀 Sẽ bắt đầu ngay..."}`,
            threadID
        );

        // Start processing queue
        processQueue(api);
    }
};
