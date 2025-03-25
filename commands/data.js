const { setBalance, getBalance, saveData, getStats } = require('../utils/currencies');

function formatNumber(number) {
    return number.toLocaleString('vi-VN');
}

function formatCurrency(str) {
    if (!str) return 0;
    str = str.toString();
    str = str.replace(/[^0-9.-]/g, ''); 
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num; 
}

module.exports = {
    name: "data",
    dev: "HNT",
    category: "Admin Commands",
    info: "Quản lý số tiền của người dùng", 
    onPrefix: true,
    usages: [
        ".data view [@tag/reply/ID]: Xem số dư của người dùng",
        ".data set [@tag/reply/ID] <số tiền> [lý do]: Đặt số dư mới",
        ".data add [@tag/reply/ID] <số tiền> [lý do]: Cộng thêm số tiền",
        ".data sub [@tag/reply/ID] <số tiền> [lý do]: Trừ đi số tiền",
        ".data stats [top]: Xem thống kê tổng thể hệ thống tiền tệ"
    ].join('\n'),
    cooldowns: 0,
    usedby: 2,
    hide: true,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, mentions, messageReply } = event;
    
        if (target.length < 1) {
            return api.sendMessage("Vui lòng sử dụng một trong các lệnh sau:\n" + this.usages, threadID, messageID);
        }
    
        const action = target[0].toLowerCase();
        
        if (action === 'stats') {
            const stats = getStats();
            const showTopOnly = target[1]?.toLowerCase() === 'top';
            
            let message = "📊 THỐNG KÊ HỆ THỐNG TIỀN TỆ 📊\n\n";
            
            if (!showTopOnly) {
                message += `💰 Tổng tiền trong hệ thống: ${formatNumber(stats.totalMoney)} $\n`;
                message += `👥 Số người dùng: ${stats.userCount}\n`;
                message += `📈 Số dư trung bình: ${formatNumber(stats.averageBalance)} $\n`;
                message += `🏦 Quỹ chung: ${formatNumber(stats.commonFund || 0)} $\n\n`;
                
                message += "💸 Phân bố tiền tệ:\n";
                message += `✅ Số dư dương: ${stats.moneyDistribution.positive} người\n`;
                message += `❌ Số dư âm: ${stats.moneyDistribution.negative} người\n`;
                message += `⚖️ Số dư bằng 0: ${stats.moneyDistribution.zero} người\n\n`;
            }
            
            return api.sendMessage(message, threadID, messageID);
        }
        
        let userID, amount, reason;
    
        if (Object.keys(mentions).length > 0) {
            userID = Object.keys(mentions)[0];
            amount = target[2];
        } else if (messageReply) {
            userID = messageReply.senderID;
            amount = target[1]; 
            reason = target.slice(2).join(' '); 
        } else if (target[1]) {
            if (isNaN(target[1])) {
                return api.sendMessage("❌ ID người dùng phải là một số!", threadID, messageID);
            }
            userID = target[1];
            amount = target[2];
        }
    
        if (!userID) {
            return api.sendMessage("❌ Vui lòng tag người dùng, reply tin nhắn hoặc nhập ID!", threadID, messageID);
        }
    
        const currentBalance = getBalance(userID);
    
        switch (action) {
            case 'view':
                return api.sendMessage(
                    `💰 Số dư của ID ${userID}: ${formatNumber(currentBalance)} $`,
                    threadID, messageID
                );
    
            case 'set':
            case 'add':
            case 'sub': {
                if (!amount) {
                    return api.sendMessage("❌ Vui lòng nhập số tiền!", threadID, messageID);
                }
    
                const processedAmount = formatCurrency(amount);
                if (processedAmount === 0) {
                    return api.sendMessage("❌ Số tiền không hợp lệ!", threadID, messageID);
                }
    
                let newBalance;
                switch(action) {
                    case 'set':
                        newBalance = processedAmount;
                        break;
                    case 'add':
                        newBalance = currentBalance + Math.abs(processedAmount); 
                        break;
                    case 'sub':
                        newBalance = currentBalance - Math.abs(processedAmount); 
                        break;
                }
                setBalance(userID, newBalance);
                saveData();
    
                let msg = `✅ Thao tác thành công cho ID: ${userID}\n` +
                         `Số dư cũ: ${formatNumber(currentBalance)} $\n` +
                         `Số dư mới: ${formatNumber(newBalance)} $`;
                
                if (reason) msg += `\nLý do: ${reason}`;
    
                return api.sendMessage(msg, threadID, messageID);
            }
    
            default:
                return api.sendMessage("❌ Hành động không hợp lệ!\n" + this.usages, threadID, messageID);
        }
    }
};