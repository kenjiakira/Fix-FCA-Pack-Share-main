module.exports = {
    name: "coinflip",
    dev: "HNT",
    category: "Games",
    info: "Tung đồng xu.",
    onPrefix: true,
    hide: true,
    usages: "coinflip",
    cooldowns: 0,

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID } = event;
            
            // Thông báo chuyển đổi lệnh
            const message = "⚠️ THÔNG BÁO ⚠️\n\n" +
                "Lệnh COINFLIP đã được chuyển đến lệnh CASINO\n" +
                "Vui lòng sử dụng: .casino up/ngửa [số tiền]\n\n" + 
                "Ví dụ:\n" +
                "• .casino up 1000\n" +
                "• .casino ngửa allin\n\n" +
                "⚡ Tất cả các game (tài xỉu, chẵn lẻ, coinflip) đã được tích hợp vào lệnh casino";
                
            return api.sendMessage(message, threadID, messageID);
        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage("Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};
