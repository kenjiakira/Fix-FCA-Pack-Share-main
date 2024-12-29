module.exports = {
    name: "donate",
    dev: "HNT",
    usedby: 0,
    info: "Thông tin về cách ủng hộ bot.",
    usages: "donate",
    onPrefix: true,
    cooldowns: 5,
  
    onLaunch: async function({ api, event }) {
      const { threadID, messageID } = event;
  
      const donateMessage = `
      💸 Ủng hộ Admin Bot! 💸
  
      Cảm ơn bạn đã sử dụng bot của chúng tôi! Nếu bạn muốn ủng hộ bot để duy trì và phát triển, bạn có thể chọn một trong những phương thức sau:

      1. Ví điện tử MoMo: Số điện thoại: 0354683398
      2. Ngân hàng: Số tài khoản: 0354683398 - Vietinbank
  
      Mỗi đóng góp của bạn sẽ giúp chúng tôi tiếp tục phát triển và duy trì bot. Cảm ơn rất nhiều! ❤️
      `;
  
      api.sendMessage(donateMessage, threadID, messageID);
    }
  };
  