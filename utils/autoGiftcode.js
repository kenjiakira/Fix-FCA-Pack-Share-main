const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const GIFTCODES_PATH = path.join(__dirname, '..', 'database', 'json', 'giftcodes.json');

const GIFTCODE_TYPES = {
    NORMAL: {
        prefix: 'N',
        minReward: 100000,
        maxReward: 1000000,
        rarity: 'Thường'
    },
    RARE: {
        prefix: 'R',
        minReward: 1000000,
        maxReward: 3000000,
        rarity: 'Hiếm',
        maxUses: 50
    },
    EPIC: {
        prefix: 'E',
        minReward: 3000000,
        maxReward: 8000000,
        rarity: 'Epic',
        maxUses: 20
    },
    LEGENDARY: {
        prefix: 'L',
        minReward: 8000000,
        maxReward: 20000000,
        rarity: 'Huyền Thoại',
        maxUses: 5
    }
};

function ensureDirectoryExists(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

function generateCode(length = 12, type = 'NORMAL') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = GIFTCODE_TYPES[type].prefix;
    for (let i = 0; i < length - 1; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createGiftcode(reward, description, expiryHours = 24, type = 'NORMAL') {
    const code = generateCode(12, type);
    const giftcodeData = loadGiftcodes();
    
    giftcodeData.codes[code] = {
        reward: reward,
        description: description,
        createdAt: new Date().toISOString(),
        expiry: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
        usedBy: [],
        type: type,
        rarity: GIFTCODE_TYPES[type].rarity,
        maxUses: GIFTCODE_TYPES[type].maxUses || Infinity
    };

    saveGiftcodes(giftcodeData);
    return code;
}

function loadGiftcodes() {
    ensureDirectoryExists(GIFTCODES_PATH);
    
    if (!fs.existsSync(GIFTCODES_PATH)) {
        const defaultData = { codes: {}, settings: { autoGiftcode: true } };
        fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    try {
        const data = fs.readFileSync(GIFTCODES_PATH, 'utf8');
        const parsed = JSON.parse(data);
        
        if (!parsed.codes) {
            parsed.codes = {};
            fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(parsed, null, 2));
        }
        
        return parsed;
    } catch (error) {
        console.error('Error loading giftcodes:', error);
        const initialData = { codes: {} };
        fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
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

async function sendGiftcodeAnnouncement(api, code, reward, type) {
    try {
        let threads = await api.getThreadList(100, null, ['INBOX']);
        let threadIDs = threads
            .filter(thread => thread.isGroup)
            .map(thread => thread.threadID);

        let successCount = 0;
        
        const message = "🎉 GIFTCODE MỚI 🎉\n" +
                       "━━━━━━━━━━━━━━━━━━\n\n" +
                       `📝 Code: ${code}\n` +
                       `💝 Phần thưởng: ${reward.toLocaleString('vi-VN')} $\n` +
                       `🔰 Loại: ${GIFTCODE_TYPES[type].rarity}\n` +
                       "⏰ Thời hạn: 24 giờ\n\n" +
                       "💡 Sử dụng lệnh: .giftcode redeem <code> để nhận quà";

        const chunkSize = 10;
        const threadChunks = [];
        for (let i = 0; i < threadIDs.length; i += chunkSize) {
            threadChunks.push(threadIDs.slice(i, i + chunkSize));
        }

        for (const chunk of threadChunks) {
            for (const threadID of chunk) {
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

                } catch (err) {
                    // Skip failed messages silently
                    continue;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
        }

        console.log(
            `📊 Báo cáo gửi giftcode:\n` +
            `✅ Thành công: ${successCount}/${threadIDs.length} nhóm\n` +
            `🎁 Giftcode: ${code}\n` +
            `💝 $: ${reward.toLocaleString('vi-VN')}`
        );

    } catch (error) {
        console.error('[ERROR] Failed to send giftcode announcement:', error);
    }
}

function scheduleAutoGiftcode(api) {
    // Giftcode thường (12h trưa)
    schedule.scheduleJob('0 12 * * *', async () => {
        const type = 'NORMAL';
        const config = GIFTCODE_TYPES[type];
        const reward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
        const code = createGiftcode(reward, "Giftcode thường hàng ngày", 24, type);
        await sendGiftcodeAnnouncement(api, code, reward, type);
    });

    // Giftcode hiếm (20h tối)
    schedule.scheduleJob('0 20 * * *', async () => {
        const type = 'RARE';
        const config = GIFTCODE_TYPES[type];
        const reward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
        const code = createGiftcode(reward, "Giftcode hiếm buổi tối", 12, type);
        await sendGiftcodeAnnouncement(api, code, reward, type);
    });

    // Giftcode Epic (Chủ nhật)
    schedule.scheduleJob('0 18 * * 0', async () => {
        const type = 'EPIC';
        const config = GIFTCODE_TYPES[type];
        const reward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
        const code = createGiftcode(reward, "Giftcode Epic cuối tuần", 6, type);
        await sendGiftcodeAnnouncement(api, code, reward, type);
    });

    // Giftcode Huyền Thoại (Ngày lễ)
    schedule.scheduleJob('0 12 1 1,2,3,4,5 *', async () => {
        const type = 'LEGENDARY';
        const config = GIFTCODE_TYPES[type];
        const reward = Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward;
        const code = createGiftcode(reward, "Giftcode Huyền Thoại ngày lễ", 4, type);
        await sendGiftcodeAnnouncement(api, code, reward, type);
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
