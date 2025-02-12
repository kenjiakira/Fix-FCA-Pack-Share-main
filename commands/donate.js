module.exports = {
    name: "donate",
    dev: "HNT",
    usedby: 0,
    info: "Thông tin về cách ủng hộ bot",
    usages: "donate",
    onPrefix: true,
    cooldowns: 5,
  
    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
  
        const donateMessage = `
╔═《 DONATE 》═╗

💝 Ủng Hộ Admin Bot 💝

➤ Chủ tài khoản: HOANG NGOC TU
━━━━━━━━━━━━━━━━━━

💳 Thông Tin Thanh Toán:

🏦 Ngân Hàng:
• VietinBank
• STK: 0354683398

📱 Ví Điện Tử:
• MoMo: 0354683398
• Người nhận: HOANG NGOC TU

━━━━━━━━━━━━━━━━━━
💌 Lời Nhắn:
➤ Mỗi đóng góp của bạn giúp 
   bot phát triển tốt hơn!
➤ Cảm ơn bạn đã ủng hộ!

╚═《 HNT 》═╝`;
  
        api.sendMessage(donateMessage, threadID, messageID);
    }
};
