module.exports = {
    name: "anti",
    dev: "HNT",
    onPrefix: true,
    usages: "tx",
    cooldowns: 0,
    hide: true,
    
    onLaunch: async function({ api, event = [] }) {
        try {
            const { threadID, messageID } = event;
            
            const message = "⚠️ THÔNG BÁO ⚠️\n\n" +
                "Lệnh Anti đã được chuyển đến lệnh security\n" +
                "Vui lòng sử dụng: .security anti\n\n" + 
                "Ví dụ:\n" +
                "• .security anti out\n" +
                "• .security anti join";
                
            return api.sendMessage(message, threadID, messageID);
        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage("Có lỗi xảy ra.", event.threadID, event.messageID);
        }
    }
};
