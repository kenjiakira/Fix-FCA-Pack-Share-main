const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const GIFTCODES_PATH = path.join(__dirname, '..', 'database', 'json', 'giftcodes.json');

function generateCode(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createGiftcode(reward, description, expiryHours = 24) {
    const code = generateCode();
    const giftcodeData = loadGiftcodes();
    
    giftcodeData.codes[code] = {
        reward: reward,
        description: description,
        createdAt: new Date().toISOString(),
        expiry: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
        usedBy: []
    };

    saveGiftcodes(giftcodeData);
    return code;
}

function loadGiftcodes() {
    if (!fs.existsSync(GIFTCODES_PATH)) {
        const defaultData = { codes: {}, settings: { autoGiftcode: true } };
        fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(GIFTCODES_PATH));
}

function saveGiftcodes(data) {
    fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(data, null, 2));
}

function cleanExpiredCodes() {
    const giftcodeData = loadGiftcodes();
    const now = new Date();
    
    for (const [code, data] of Object.entries(giftcodeData.codes)) {
        if (new Date(data.expiry) < now) {
            delete giftcodeData.codes[code];
        }
    }
    
    saveGiftcodes(giftcodeData);
}

async function sendGiftcodeAnnouncement(api, code, reward) {
    try {
        let threads = await api.getThreadList(100, null, ['INBOX']);
        let threadIDs = threads
            .filter(thread => thread.isGroup)
            .map(thread => thread.threadID);

        let successCount = 0;
        let failedThreads = [];
        
        const message = "🎉 GIFTCODE MỚI 🎉\n" +
                       "━━━━━━━━━━━━━━━━━━\n\n" +
                       `📝 Code: ${code}\n` +
                       `💝 Phần thưởng: ${reward.toLocaleString('vi-VN')} Xu\n` +
                       "⏰ Thời hạn: 24 giờ\n\n" +
                       "💡 Sử dụng lệnh: .giftcode redeem <code> để nhận quà";

        const chunkSize = 10;
        const threadChunks = [];
        for (let i = 0; i < threadIDs.length; i += chunkSize) {
            threadChunks.push(threadIDs.slice(i, i + chunkSize));
        }

        for (const chunk of threadChunks) {
            for (const threadID of chunk) {
                let retries = 0;
                const maxRetries = 3;

                while (retries < maxRetries) {
                    try {
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('Send message timeout'));
                            }, 30000);

                            api.sendMessage(message, threadID, (err) => {
                                clearTimeout(timeout);
                                if (err) reject(err);
                                else resolve();
                            });
                        });

                        successCount++;
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        break;

                    } catch (err) {
                        console.error(`Lỗi khi gửi đến nhóm ${threadID}, lần thử ${retries + 1}:`, err.message);
                        retries++;
                        
                        if (retries === maxRetries) {
                            failedThreads.push(threadID);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 10000));
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
        }

        console.log(
            `📊 Báo cáo gửi giftcode:\n` +
            `✅ Thành công: ${successCount}/${threadIDs.length} nhóm\n` +
            `❌ Thất bại: ${failedThreads.length} nhóm\n` +
            `🎁 Giftcode: ${code}\n` +
            `💝 Xu: ${reward.toLocaleString('vi-VN')}`
        );

    } catch (error) {
        console.error('[ERROR] Failed to send giftcode announcement:', error);
    }
}

function scheduleAutoGiftcode(api) {
    schedule.scheduleJob('0 12 * * *', async () => {
   
        const minReward = 100000;
        const maxReward = 500000;
        const reward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
        
        const today = new Date();
        if (today.getDay() === 0) { 
            reward *= 2; 
        }
        
        const code = createGiftcode(reward, "Giftcode tự động hàng ngày");
        await sendGiftcodeAnnouncement(api, code, reward);
    });

    schedule.scheduleJob('0 20 * * *', async () => {
        const specialReward = Math.floor(Math.random() * 400000) + 600000; 
        const code = createGiftcode(specialReward, "Giftcode đặc biệt buổi tối");
        await sendGiftcodeAnnouncement(api, code, specialReward);
    });

    schedule.scheduleJob('0 * * * *', cleanExpiredCodes);
}

module.exports = {
    createGiftcode,
    loadGiftcodes,
    saveGiftcodes,
    cleanExpiredCodes,
    scheduleAutoGiftcode,
    sendGiftcodeAnnouncement
};
