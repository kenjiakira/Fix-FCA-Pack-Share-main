const { execSync } = require('child_process');

const SMS_PRICE = 20000;
const BANK_ACCOUNT = "0354683398";
const BANK_NAME = "Vietinbank";

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
        "📱 Dịch vụ SMS Spam\n\n" +
        "Cách dùng: sms [số điện thoại] [số lần]\n" +
        "Giá: 20,000đ/SMS\n\n" +
        "📌 Hướng dẫn thanh toán:\n" +
        `1. Chuyển khoản vào STK: ${BANK_ACCOUNT}\n` +
        `2. Ngân hàng: ${BANK_NAME}\n` +
        "3. Nội dung chuyển khoản: [Số điện thoại] SPAM\n" +
        "Ví dụ: 0912345678 SPAM\n\n" +
        "⚠️ Lưu ý: Vui lòng chuyển khoản trước khi sử dụng dịch vụ",
        event.threadID
      );
    }
    
    const phone = target[0];
    const count = parseInt(target[1]);

    if (isNaN(count) || count < 1) return api.sendMessage("❌ Số lần phải là số dương!", event.threadID);
    if (!/^0\d{9}$/.test(phone)) return api.sendMessage("❌ Số điện thoại không hợp lệ!", event.threadID);

    const totalCost = SMS_PRICE * count;

    try {
      api.sendMessage(
        `🚀 Để spam ${count} lần đến ${phone}\n\n` +
        `💰 Vui lòng chuyển: ${totalCost.toLocaleString()}đ\n` +
        `👉 STK: ${BANK_ACCOUNT}\n` +
        `🏦 Bank: ${BANK_NAME}\n` +
        `📝 Nội dung: ${phone} SPAM\n\n` +
        "✅ Sau khi chuyển khoản thành công, hệ thống sẽ tự động xử lý trong vòng 5 phút",
        event.threadID
      );
      
    } catch (e) {
      api.sendMessage("❌ Lỗi: " + e.message, event.threadID);
    }
  }
};
