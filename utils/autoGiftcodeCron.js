const cron = require('node-cron');
const { createAutoGiftcode, sendGiftcodeAnnouncement } = require('./autoGiftcode');

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
    
    console.log('[AUTO GIFTCODE] Scheduled daily giftcode at 12:00 PM');
};
