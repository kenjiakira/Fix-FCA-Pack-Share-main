module.exports = {
    name: "cl",
    dev: "HNT",
    category: "Games",
    info: "Chơi Chẵn Lẻ.",
    onPrefix: true,
    usages: "cl",
    cooldowns: 0,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        try {
            const { threadID, messageID } = event;
            
            const message = "⚠️ THÔNG BÁO ⚠️\n\n" +
                "Lệnh CHẴN LẺ đã được chuyển đến lệnh CASINO\n" +
                "Vui lòng sử dụng: .casino chẵn/lẻ [số tiền]\n\n" + 
                "Ví dụ:\n" +
                "• .casino chẵn 1000\n" +
                "• .casino lẻ allin\n\n" +
                "⚡ Tất cả các game (tài xỉu, chẵn lẻ, coinflip) đã được tích hợp vào lệnh casino";
                
            return api.sendMessage(message, threadID, messageID);
        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage("Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};
