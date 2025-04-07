const fs = require('fs');
const path = require('path');
const { storeFacebookCookie } = require('../utils/facebook');

module.exports = {
    name: 'setcookie',
    category: "Quản trị",
    info: 'Cài đặt cookie Facebook cho bot',
    dev: 'HNT',
    usedby: 2, // Admin only
    onPrefix: true,
    dmUser: true,
    usages: 'setcookie [cookie]',
    cooldowns: 5,
    
    onLaunch: async function ({ api, event, target }) {
        try {
            const { threadID, senderID, messageID } = event;
            
            if (!target || target.length === 0) {
                return api.sendMessage("⚠️ Vui lòng cung cấp cookie Facebook. Sử dụng: setcookie [cookie]", threadID, messageID);
            }
            
            const cookieStr = target.join(' ');
            
            api.sendMessage("⏳ Đang xác thực và lưu cookie, vui lòng đợi...", threadID, messageID);
            
            const result = await storeFacebookCookie(cookieStr);
            
            if (result.success) {
                return api.sendMessage(`✅ ${result.message}\n\nCookie đã được lưu thành công và sẽ được sử dụng để lấy tên người dùng.`, threadID, messageID);
            } else {
                return api.sendMessage(`❌ ${result.message}`, threadID, messageID);
            }
        } catch (error) {
            console.error('Error in setcookie command:', error);
            return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, event.threadID, event.messageID);
        }
    }
};