const cron = require('node-cron');
const { 
    createAutoGiftcode, 
    sendGiftcodeAnnouncement, 
    createVIPGiftcode,
    sendVIPGiftAnnouncement
} = require('./autoGiftcode');

module.exports = (api) => {
    cron.schedule('0 12 * * *', async () => {
        try {
            console.log('[AUTO GIFTCODE] Creating daily giftcode...');
            const code = createAutoGiftcode();
            const giftcodeData = require('../database/json/giftcodes.json');
            const reward = giftcodeData.codes[code].reward;
            
            console.log(`[AUTO GIFTCODE] Created code: ${code} with ${reward} $`);
            
            await sendGiftcodeAnnouncement(api, code, reward);
            console.log('[AUTO GIFTCODE] Announcement sent to all threads');
        } catch (error) {
            console.error('[AUTO GIFTCODE] Error creating auto giftcode:', error);
        }
    }, {
        timezone: 'Asia/Ho_Chi_Minh'
    });
    
    // VIP Gold gift hàng tuần (Thứ 2)
    cron.schedule('0 8 * * 1', async () => {
        try {
            console.log('[AUTO VIP GIFT] Creating weekly VIP Gold gift...');
            const giftInfo = createVIPGiftcode('GOLD', 'Quà tặng VIP Gold hàng tuần');
            console.log(`[AUTO VIP GIFT] Created VIP Gold gift: ${giftInfo.code}`);
            
            // Send VIP gift announcements
            await sendVIPGiftAnnouncement(api, giftInfo.code, giftInfo.rewards, 'GOLD');
            
            // Send notification to admin threads
            const adminThreads = global.cc?.adminChannels || [];
            if (adminThreads && adminThreads.length > 0) {
                const message = 
                    `👑 TẠO VIP GIFT THÀNH CÔNG 👑\n\n` +
                    `📝 Code: ${giftInfo.code}\n` +
                    `💰 Xu: ${giftInfo.rewards.coins.toLocaleString('vi-VN')}\n` +
                    `👑 Điểm VIP: ${giftInfo.rewards.vip_points}\n` +
                    `⭐ EXP: ${giftInfo.rewards.exp}\n` +
                    `⏰ Hiệu lực: 72 giờ\n\n` +
                    `💡 Đã gửi thông báo cho tất cả người dùng VIP Gold\n` +
                    `📱 Người dùng VIP Gold có thể nhận quà bằng lệnh:\n` +
                    `.rewards vip gift`;
                
                for (const threadID of adminThreads) {
                    api.sendMessage(message, threadID);
                }
            }
        } catch (error) {
            console.error('[AUTO VIP GIFT] Error creating VIP gift:', error);
        }
    }, {
        timezone: 'Asia/Ho_Chi_Minh'
    });
    
    console.log('[AUTO GIFTCODE] Scheduled daily giftcode at 12:00 PM');
    console.log('[AUTO VIP GIFT] Scheduled weekly VIP Gold gift on Mondays at 8:00 AM');
};
