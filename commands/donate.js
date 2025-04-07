module.exports = {
    name: "donate",
    dev: "HNT",
    usedby: 0,
    category: "Khác",
    info: "góp gạch xây nhà",
    usages: "donate",
    onPrefix: true,
    cooldowns: 5,
  
    onLaunch: async function({ api, event }) {
        const { threadID, messageID } = event;
  
        const donateMessage = `
╔═《 GÓP GẠCH 》═╗

💝 Góp Gạch Xây nhà 💝

➤ Chủ tài khoản: HOANG NGOC TU
━━━━━━━━━━━━━━━━━━

💳 Thông Tin Thanh Toán:

🏦 Ngân Hàng:
• VietinBank
• STK: 109876048569
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
