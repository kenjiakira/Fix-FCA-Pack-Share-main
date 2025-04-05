const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const GIFTCODES_PATH = path.join(__dirname, '..', 'database', 'json', 'giftcodes.json');
const EVENTS_PATH = path.join(__dirname, '..', 'database', 'json', 'events.json');
const VIP_LOGS_PATH = path.join(__dirname, '..', 'database', 'json', 'vip_logs.json');

// Danh sách các sự kiện đặc biệt
const SPECIAL_EVENTS = [
    { date: '01-01', name: 'Năm Mới', type: 'LEGENDARY' },
    { date: '14-02', name: 'Valentine', type: 'EPIC' },
    { date: '08-03', name: 'Quốc Tế Phụ Nữ', type: 'EPIC' },
    { date: '30-04', name: 'Giải Phóng', type: 'LEGENDARY' },
    { date: '01-05', name: 'Quốc Tế Lao Động', type: 'RARE' },
    { date: '01-06', name: 'Quốc Tế Thiếu Nhi', type: 'RARE' },
    { date: '02-09', name: 'Quốc Khánh', type: 'LEGENDARY' },
    { date: '20-10', name: 'Phụ Nữ Việt Nam', type: 'EPIC' },
    { date: '20-11', name: 'Nhà Giáo', type: 'EPIC' },
    { date: '24-12', name: 'Giáng Sinh', type: 'LEGENDARY' },
    { date: '31-12', name: 'Giao Thừa', type: 'LEGENDARY' }
];

// Danh sách các loại phần thưởng có thể có
const REWARD_TYPES = {
    COINS: 'coins',
    VIP_POINTS: 'vip_points',
    EXP: 'exp',
    MIXED: 'mixed',
    RANDOM: 'random'
};

// Cấu hình các loại Gift code
const GIFTCODE_TYPES = {
    NORMAL: {
        prefix: 'N',
        minReward: 50000,
        maxReward: 500000,
        rarity: 'Thường',
        expHours: 24,
        color: '#CCCCCC',
        maxUsesPerUser: 5,
        dailyLimit: 3,
        vipPoints: 1
    },
    RARE: {
        prefix: 'R',
        minReward: 500000,
        maxReward: 1500000,
        rarity: 'Hiếm',
        maxUses: 50,
        expHours: 12,
        color: '#3366FF',
        maxUsesPerUser: 3,
        dailyLimit: 2,
        vipPoints: 2,
        bonusRewards: {
            vip_points: { min: 1, max: 3 }
        }
    },
    EPIC: {
        prefix: 'E',
        minReward: 1500000,
        maxReward: 4000000,
        rarity: 'Epic',
        maxUses: 20,
        expHours: 6,
        color: '#9933FF',
        maxUsesPerUser: 2,
        dailyLimit: 1,
        vipPoints: 3,
        bonusRewards: {
            vip_points: { min: 3, max: 7 },
            exp: { min: 50, max: 150 }
        }
    },
    LEGENDARY: {
        prefix: 'L',
        minReward: 4000000,
        maxReward: 10000000,
        rarity: 'Huyền Thoại',
        maxUses: 5,
        expHours: 4,
        color: '#FF9900',
        maxUsesPerUser: 1,
        dailyLimit: 1,
        vipPoints: 5,
        bonusRewards: {
            vip_points: { min: 5, max: 15 },
            exp: { min: 100, max: 300 }
        }
    },
    EVENT: {
        prefix: 'EV',
        minReward: 2500000,
        maxReward: 7500000,
        rarity: 'Sự Kiện',
        maxUses: 100,
        expHours: 48,
        color: '#FF3366',
        maxUsesPerUser: 1,
        dailyLimit: 1,
        vipPoints: 4,
        bonusRewards: {
            vip_points: { min: 4, max: 10 },
            exp: { min: 80, max: 200 }
        }
    },
    SPECIAL: {
        prefix: 'SP',
        minReward: 5000000,
        maxReward: 15000000,
        rarity: 'Đặc Biệt',
        maxUses: 10,
        expHours: 24,
        color: '#00CC99',
        maxUsesPerUser: 1,
        dailyLimit: 1,
        vipPoints: 7,
        bonusRewards: {
            vip_points: { min: 7, max: 20 },
            exp: { min: 150, max: 300 }
        }
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

function generateRandomRewards(type = 'NORMAL') {
    const config = GIFTCODE_TYPES[type];
    const rewards = {
        coins: Math.floor(Math.random() * (config.maxReward - config.minReward + 1)) + config.minReward,
        vip_points: config.vipPoints || 1
    };

    // Thêm phần thưởng bonus nếu có
    if (config.bonusRewards) {
        for (const [rewardType, rewardConfig] of Object.entries(config.bonusRewards)) {
            if (rewardType === 'vip_points' || rewardType === 'exp') {
                rewards[rewardType] = Math.floor(Math.random() * (rewardConfig.max - rewardConfig.min + 1)) + rewardConfig.min;
            }
        }
    }

    return rewards;
}

function createGiftcode(reward, description, expiryHours = 24, type = 'NORMAL', rewardType = REWARD_TYPES.COINS, bonusRewards = null) {
    const code = generateCode(12, type);
    const giftcodeData = loadGiftcodes();
    const typeConfig = GIFTCODE_TYPES[type];
    
    let rewardsObject = {};
    
    if (typeof reward === 'number') {
        if (rewardType === REWARD_TYPES.MIXED || rewardType === REWARD_TYPES.RANDOM) {
            rewardsObject = generateRandomRewards(type);
        } else {
            rewardsObject[rewardType] = reward;
            // Đảm bảo mỗi giftcode đều có điểm VIP
            rewardsObject.vip_points = typeConfig.vipPoints || 1;
        }
    } else if (typeof reward === 'object') {
        rewardsObject = reward;
        // Đảm bảo có điểm VIP nếu chưa có
        if (!rewardsObject.vip_points) {
            rewardsObject.vip_points = typeConfig.vipPoints || 1;
        }
    }
    
    // Thêm phần thưởng bonus nếu có
    if (bonusRewards) {
        for (const [key, value] of Object.entries(bonusRewards)) {
            if (!rewardsObject[key]) {
                rewardsObject[key] = value;
            } else {
                rewardsObject[key] += value;
            }
        }
    }
    
    giftcodeData.codes[code] = {
        rewards: rewardsObject,
        description: description,
        createdAt: new Date().toISOString(),
        expiry: new Date(Date.now() + (expiryHours || typeConfig.expHours) * 60 * 60 * 1000).toISOString(),
        usedBy: [],
        type: type,
        rarity: typeConfig.rarity,
        color: typeConfig.color,
        maxUses: typeConfig.maxUses || Infinity,
        maxUsesPerUser: typeConfig.maxUsesPerUser || 1
    };

    saveGiftcodes(giftcodeData);
    return code;
}

function createAutoGiftcode(type = 'NORMAL', eventName = null) {
    const config = GIFTCODE_TYPES[type];
    const rewards = generateRandomRewards(type);
    
    let description = eventName 
        ? `Giftcode ${config.rarity} cho sự kiện ${eventName}` 
        : `Giftcode ${config.rarity} hàng ngày`;
    
    const code = createGiftcode(
        rewards, 
        description, 
        config.expHours, 
        type, 
        REWARD_TYPES.MIXED
    );
    
    return {
        code,
        rewards,
        type
    };
}

function loadGiftcodes() {
    ensureDirectoryExists(GIFTCODES_PATH);
    
    if (!fs.existsSync(GIFTCODES_PATH)) {
        const defaultData = { 
            codes: {}, 
            settings: { 
                autoGiftcode: true,
                dailyLimits: {},
                lastResetDate: new Date().toISOString().split('T')[0]
            } 
        };
        fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    try {
        const data = fs.readFileSync(GIFTCODES_PATH, 'utf8');
        const parsed = JSON.parse(data);
        
        if (!parsed.codes) {
            parsed.codes = {};
        }
        
        if (!parsed.settings) {
            parsed.settings = { autoGiftcode: true };
        }
        
        if (!parsed.settings.dailyLimits) {
            parsed.settings.dailyLimits = {};
        }
        
        // Reset giới hạn hàng ngày nếu là ngày mới
        const currentDate = new Date().toISOString().split('T')[0];
        if (!parsed.settings.lastResetDate || parsed.settings.lastResetDate !== currentDate) {
            parsed.settings.lastResetDate = currentDate;
            parsed.settings.dailyLimits = {};
            saveGiftcodes(parsed);
        }
        
        return parsed;
    } catch (error) {
        console.error('Error loading giftcodes:', error);
        const initialData = { 
            codes: {},
            settings: {
                autoGiftcode: true,
                dailyLimits: {},
                lastResetDate: new Date().toISOString().split('T')[0]
            } 
        };
        fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

function saveGiftcodes(data) {
    fs.writeFileSync(GIFTCODES_PATH, JSON.stringify(data, null, 2));
}

function checkDailyLimit(userId, type) {
    const giftcodeData = loadGiftcodes();
    const typeConfig = GIFTCODE_TYPES[type];
    const dailyLimit = typeConfig.dailyLimit || 5;
    
    const userLimits = giftcodeData.settings.dailyLimits[userId] || {};
    const typeUsed = userLimits[type] || 0;
    
    return {
        limit: dailyLimit,
        used: typeUsed,
        remaining: dailyLimit - typeUsed,
        canUse: typeUsed < dailyLimit
    };
}

function updateDailyLimit(userId, type) {
    const giftcodeData = loadGiftcodes();
    
    if (!giftcodeData.settings.dailyLimits[userId]) {
        giftcodeData.settings.dailyLimits[userId] = {};
    }
    
    if (!giftcodeData.settings.dailyLimits[userId][type]) {
        giftcodeData.settings.dailyLimits[userId][type] = 0;
    }
    
    giftcodeData.settings.dailyLimits[userId][type]++;
    saveGiftcodes(giftcodeData);
}

// Hệ thống tích điểm VIP Gold
function loadVIPLogs() {
    ensureDirectoryExists(VIP_LOGS_PATH);
    
    if (!fs.existsSync(VIP_LOGS_PATH)) {
        const defaultData = {
            users: {},
            lastUpdate: new Date().toISOString()
        };
        fs.writeFileSync(VIP_LOGS_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    
    try {
        const data = fs.readFileSync(VIP_LOGS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading VIP logs:', error);
        const defaultData = {
            users: {},
            lastUpdate: new Date().toISOString()
        };
        fs.writeFileSync(VIP_LOGS_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
}

function saveVIPLogs(data) {
    fs.writeFileSync(VIP_LOGS_PATH, JSON.stringify(data, null, 2));
}

// Thêm điểm tích lũy VIP Gold cho người dùng
function addVIPPoints(userId, points) {
    const vipLogs = loadVIPLogs();
    
    if (!vipLogs.users[userId]) {
        vipLogs.users[userId] = {
            points: 0,
            streak: 0,
            lastUpdated: null,
            vipGoldAwarded: false,
            history: []
        };
    }
    
    const user = vipLogs.users[userId];
    
    // Kiểm tra xem đã nhận điểm hôm nay chưa
    const today = new Date().toISOString().split('T')[0];
    const lastUpdated = user.lastUpdated ? new Date(user.lastUpdated).toISOString().split('T')[0] : null;
    
    if (lastUpdated !== today) {
        // Ngày mới, cập nhật streak
        if (lastUpdated) {
            const lastDate = new Date(lastUpdated);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                // Liên tiếp từ hôm qua
                user.streak++;
            } else {
                // Không liên tiếp, reset streak
                user.streak = 1;
            }
        } else {
            user.streak = 1;
        }
    }
    
    // Thêm điểm
    user.points += points;
    user.lastUpdated = new Date().toISOString();
    
    // Kiểm tra xem đã đủ điểm để nhận VIP Gold chưa
    if (user.points >= 90 && user.streak >= 30 && !user.vipGoldAwarded) {
        user.vipGoldAwarded = true;
        // Ghi lại lịch sử nhận VIP Gold
        user.history.push({
            action: 'Awarded VIP Gold',
            date: new Date().toISOString(),
            points: user.points,
            streak: user.streak
        });
    }
    
    // Ghi lại lịch sử tích điểm
    user.history.push({
        action: 'Added points',
        date: new Date().toISOString(),
        points: points,
        total: user.points,
        streak: user.streak
    });
    
    saveVIPLogs(vipLogs);
    return user;
}

// Lấy thông tin tích điểm VIP của người dùng
function getVIPProgress(userId) {
    const vipLogs = loadVIPLogs();
    
    if (!vipLogs.users[userId]) {
        return {
            points: 0,
            streak: 0,
            progress: 0,
            streakProgress: 0,
            vipGoldAwarded: false
        };
    }
    
    const user = vipLogs.users[userId];
    
    return {
        points: user.points,
        streak: user.streak,
        progress: Math.min(100, Math.round((user.points / 90) * 100)),
        streakProgress: Math.min(100, Math.round((user.streak / 30) * 100)),
        vipGoldAwarded: user.vipGoldAwarded,
        lastUpdated: user.lastUpdated
    };
}

function cleanExpiredCodes() {
    const giftcodeData = loadGiftcodes();
    const now = new Date();
    let expiredCount = 0;
    
    for (const [code, data] of Object.entries(giftcodeData.codes)) {
        if (new Date(data.expiry) < now) {
            delete giftcodeData.codes[code];
            expiredCount++;
        }
    }
    
    if (expiredCount > 0) {
        saveGiftcodes(giftcodeData);
        console.log(`[Gift Code] Đã xóa ${expiredCount} mã đã hết hạn.`);
    }
}

function loadEvents() {
    ensureDirectoryExists(EVENTS_PATH);
    
    if (!fs.existsSync(EVENTS_PATH)) {
        const defaultData = { events: SPECIAL_EVENTS, activeEvents: [] };
        fs.writeFileSync(EVENTS_PATH, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    
    try {
        const data = fs.readFileSync(EVENTS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading events:', error);
        const initialData = { events: SPECIAL_EVENTS, activeEvents: [] };
        fs.writeFileSync(EVENTS_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

function saveEvents(data) {
    fs.writeFileSync(EVENTS_PATH, JSON.stringify(data, null, 2));
}

function checkForSpecialEvents() {
    const events = loadEvents();
    const today = new Date();
    const dateStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    const specialEvents = events.events.filter(event => event.date === dateStr);
    const activeEvents = specialEvents.map(event => ({
        ...event,
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }));
    
    if (activeEvents.length > 0) {
        events.activeEvents = activeEvents;
        saveEvents(events);
        return activeEvents;
    }
    
    return [];
}

async function sendGiftcodeAnnouncement(api, code, rewards, type, eventName = null) {
    try {
        let threads = await api.getThreadList(100, null, ['INBOX']);
        let threadIDs = threads
            .filter(thread => thread.isGroup)
            .map(thread => thread.threadID);

        let successCount = 0;
        const typeConfig = GIFTCODE_TYPES[type];
        
        let rewardText = '';
        if (typeof rewards === 'number') {
            rewardText = `💝 Phần thưởng: ${rewards.toLocaleString('vi-VN')} $`;
        } else {
            rewardText = "💝 Phần thưởng:";
            if (rewards.coins) rewardText += `\n  • ${rewards.coins.toLocaleString('vi-VN')} $`;
            if (rewards.vip_points) rewardText += `\n  • ${rewards.vip_points} Điểm tích VIP Gold`;
            if (rewards.exp) rewardText += `\n  • ${rewards.exp} EXP`;
        }
        
        const message = 
            `${eventName ? '🎊 GIFTCODE SỰ KIỆN 🎊' : '🎉 GIFTCODE MỚI 🎉'}\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `${eventName ? `📅 Sự kiện: ${eventName}\n` : ''}` +
            `📝 Code: ${code}\n` +
            `${rewardText}\n` +
            `🔰 Loại: ${typeConfig.rarity}\n` +
            `⏰ Thời hạn: ${typeConfig.expHours} giờ\n` +
            `👥 Số lượng: ${typeConfig.maxUses || 'Không giới hạn'}\n\n` +
            `👑 Tích đủ 90 điểm trong 30 ngày liên tiếp sẽ nhận VIP Gold!\n\n` +
            `💡 Sử dụng lệnh: .rewards redeem ${code} để nhận quà`;

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
            `💝 Loại: ${typeConfig.rarity}${eventName ? ` (${eventName})` : ''}`
        );

    } catch (error) {
        console.error('[ERROR] Failed to send giftcode announcement:', error);
    }
}

function scheduleAutoGiftcode(api) {
    // Kiểm tra sự kiện đặc biệt hàng ngày vào lúc 0h
    schedule.scheduleJob('0 0 * * *', async () => {
        const specialEvents = checkForSpecialEvents();
        
        for (const event of specialEvents) {
            const giftInfo = createAutoGiftcode(event.type || 'EVENT', event.name);
            await sendGiftcodeAnnouncement(api, giftInfo.code, giftInfo.rewards, giftInfo.type, event.name);
        }
    });

    // Giftcode hàng ngày (12h trưa)
    schedule.scheduleJob('0 12 * * *', async () => {
        const type = 'NORMAL';
        const giftInfo = createAutoGiftcode(type);
        await sendGiftcodeAnnouncement(api, giftInfo.code, giftInfo.rewards, type);
    });

    // Giftcode RARE (Chủ nhật)
    schedule.scheduleJob('0 12 * * 0', async () => {
        const type = 'RARE';
        const giftInfo = createAutoGiftcode(type);
        await sendGiftcodeAnnouncement(api, giftInfo.code, giftInfo.rewards, type);
    });
    
    // Giftcode Epic (Ngày 15 hàng tháng)
    schedule.scheduleJob('0 12 15 * *', async () => {
        const type = 'EPIC';
        const giftInfo = createAutoGiftcode(type);
        await sendGiftcodeAnnouncement(api, giftInfo.code, giftInfo.rewards, type);
    });

    // Giftcode Huyền Thoại (Ngày 1 hàng tháng)
    schedule.scheduleJob('0 12 1 * *', async () => {
        const type = 'LEGENDARY';
        const giftInfo = createAutoGiftcode(type);
        await sendGiftcodeAnnouncement(api, giftInfo.code, giftInfo.rewards, type);
    });

    // Dọn dẹp giftcode hết hạn mỗi giờ
    schedule.scheduleJob('0 * * * *', cleanExpiredCodes);
}

module.exports = {
    createGiftcode,
    createAutoGiftcode,
    loadGiftcodes,
    saveGiftcodes,
    cleanExpiredCodes,
    scheduleAutoGiftcode,
    sendGiftcodeAnnouncement,
    checkDailyLimit,
    updateDailyLimit,
    GIFTCODE_TYPES,
    REWARD_TYPES,
    addVIPPoints,
    getVIPProgress
};
