const fs = require('fs');
const path = require('path');
const getName = require('../utils/getName');
const vipService = require('../game/vip/vipService');
const { getMiningBalance, updateMiningBalance } = require('../game/mining/miningCurrency');

// Mining configuration - ĐIỀU CHỈNH ĐỂ TĂNG HẤP DẪN
const MINING_CONFIG = {
    BASE_RATE: 2.0, // Tăng từ 0.8 lên 2.0 - tăng 2.5x
    COOLDOWN: 25 * 1000, // Giảm từ 30s xuống 25s - nhanh hơn 5s
    MAX_OFFLINE_HOURS: 8, // Tăng từ 6h lên 8h - thu offline lâu hơn
    LEVEL_MULTIPLIER: 0.05, // Giữ nguyên
    TEAM_BONUS: 0.015, // Giữ nguyên
    VIP_MULTIPLIERS: {
        GOLD: 1.8  // Giữ nguyên 1.8
    },
    // Hệ thống phí thương mại - GIẢM NHẸ
    FEES: {
        WITHDRAWAL_FEE: 0.10, // Giảm từ 12% xuống 10%
        AUTO_MINING_FEE: 0.12, // Giảm từ 15% xuống 12%
        TEAM_CREATE_FEE: 3000, // Giữ nguyên
        EQUIPMENT_TAX: 0.08,
        DAILY_MINING_LIMIT_FEE: 100, // Giảm từ 120 xuống 100 coins
    },
    // Giới hạn rút tiền - GIẢM THRESHOLD
    WITHDRAWAL: {
        MIN_AMOUNT: 8000, // Giảm từ 15k xuống 8k - dễ rút hơn
        DAILY_LIMIT: 50000, // Tăng từ 40k lên 50k
        VIP_BONUS_LIMIT: {
            GOLD: 2.0
        }
    },
    // Giới hạn đào hàng ngày - TĂNG
    DAILY_MINING: {
        FREE_LIMIT: 15, // Tăng từ 10 lên 15 lượt
        VIP_LIMIT: 60, // Tăng từ 50 lên 60 lượt
        EXTRA_COST: 100 // Giảm từ 120 xuống 100 coins
    },
    // Hệ thống thưởng cho người mới - TĂNG
    NEWBIE_BONUS: {
        FIRST_WEEK_MULTIPLIER: 2.2, // Tăng từ 1.8 lên 2.2
        FIRST_MONTH_MULTIPLIER: 1.3, // Giữ nguyên
        WELCOME_BONUS: 3000, // Tăng từ 2k lên 3k
        DAILY_LOGIN_BONUS: 150, // Tăng từ 100 lên 150
        LEVEL_UP_BONUS: 200, // Giữ nguyên
        MAX_NEWBIE_DAYS: 10 // Tăng từ 7 lên 10 ngày
    },
    // Hệ thống nhiệm vụ hàng ngày - TĂNG
    DAILY_QUESTS: {
        MINE_10_TIMES: { reward: 800, description: "Đào 10 lần" }, // Tăng từ 500 lên 800
        MINE_20_TIMES: { reward: 1800, description: "Đào 20 lần" }, // Tăng từ 1200 lên 1800
        JOIN_TEAM: { reward: 1200, description: "Tham gia team" }, // Tăng từ 800 lên 1200
        USE_AUTO_MINING: { reward: 900, description: "Sử dụng auto mining" } // Tăng từ 600 lên 900
    },
    // THÊM: Hệ thống coin sinks
    COIN_SINKS: {
        EQUIPMENT_DURABILITY: true, // Thiết bị bị hỏng theo thời gian
        MONTHLY_MAINTENANCE: 1000, // Phí duy trì hàng tháng
        INSURANCE_FEE: 0.05, // 5% phí bảo hiểm cho số dư lớn
        STORAGE_FEE: 100 // Phí lưu trữ coins/ngày nếu > 50k coins
    },
    // Hệ thống kiểm soát kinh tế - TĂNG CƯỜNG
    ECONOMY_CONTROL: {
        DAILY_COIN_DESTRUCTION: 0.03, // Tăng từ 2% lên 3%
        INFLATION_CONTROL_RATE: 0.99, // Giảm 1% mining rate mỗi tuần
        MAX_COINS_IN_SYSTEM: 5000000, // Giảm từ 10M xuống 5M
        EMERGENCY_BRAKE: true,
        WEALTH_TAX_THRESHOLD: 100000, // Đánh thuế user có > 100k coins
        WEALTH_TAX_RATE: 0.01 // 1% thuế giàu/ngày
    }
};

// Data storage paths
const MINING_DATA_FILE = path.join(__dirname, './json/mining_data.json');
const MINING_TEAMS_FILE = path.join(__dirname, './json/mining_teams.json');

// Initialize data files
function initializeDataFiles() {
    [MINING_DATA_FILE, MINING_TEAMS_FILE].forEach(file => {
        if (!fs.existsSync(file)) {
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(file, JSON.stringify({}));
        }
    });
}

// Load and save mining data
function loadMiningData() {
    try {
        return JSON.parse(fs.readFileSync(MINING_DATA_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveMiningData(data) {
    fs.writeFileSync(MINING_DATA_FILE, JSON.stringify(data, null, 2));
}

function loadTeamData() {
    try {
        return JSON.parse(fs.readFileSync(MINING_TEAMS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveTeamData(data) {
    fs.writeFileSync(MINING_TEAMS_FILE, JSON.stringify(data, null, 2));
}

// Initialize user mining data
function initUser(userId) {
    const data = loadMiningData();
    if (!data[userId]) {
        data[userId] = {
            level: 1,
            experience: 0,
            totalMined: 0,
            miningCount: 0,
            lastMined: 0,
            miningPower: 1,
            team: null,
            autoMining: {
                active: false,
                startTime: 0,
                rate: 0
            },
            achievements: [],
            equipment: [],
            boosts: [],
            // THÊM: Dữ liệu người mới
            createdAt: Date.now(),
            lastLogin: Date.now(),
            dailyQuests: {},
            streakDays: 0,
            hasReceivedWelcomeBonus: false
        };
        
        // Tặng welcome bonus cho người mới
        if (!data[userId].hasReceivedWelcomeBonus) {
            updateMiningBalance(userId, MINING_CONFIG.NEWBIE_BONUS.WELCOME_BONUS);
            data[userId].hasReceivedWelcomeBonus = true;
        }
        
        saveMiningData(data);
    }
    return data[userId];
}

// Get user VIP status (integrate with existing VIP system)
function getUserVIP(userId) {
    try {
        const vipStatus = vipService.checkVIP(userId);
        // console.log('[DEBUG] VIP Status:', vipStatus);
        
        if (vipStatus && vipStatus.success && vipStatus.packageId === 3) {
            const benefits = vipService.getVIPBenefits(userId);
            // console.log('[DEBUG] VIP Benefits:', benefits);
            
            return {
                active: true,
                tier: 'GOLD',
                packageId: vipStatus.packageId,
                benefits: benefits,
                expireTime: vipStatus.expireTime,
                daysLeft: vipStatus.daysLeft,
                miningBonus: MINING_CONFIG.VIP_MULTIPLIERS.GOLD
            };
        }
        return null;
    } catch (error) {
        console.error('[ERROR] Error getting VIP status:', error);
        return null;
    }
}

// THÊM: Kiểm tra bonus người mới với giới hạn thời gian
function getNewbieMultiplier(userId) {
    const user = initUser(userId);
    const accountAge = Date.now() - user.createdAt;
    const daysOld = accountAge / (24 * 60 * 60 * 1000);
    
    // Chỉ áp dụng trong 10 ngày đầu
    if (daysOld <= MINING_CONFIG.NEWBIE_BONUS.MAX_NEWBIE_DAYS) {
        return MINING_CONFIG.NEWBIE_BONUS.FIRST_WEEK_MULTIPLIER;
    }
    return 1.0;
}

// THÊM: Kiểm tra daily login bonus với giới hạn
function checkDailyLoginBonus(userId) {
    const user = initUser(userId);
    const today = new Date().toDateString();
    const lastLoginDay = new Date(user.lastLogin).toDateString();
    
    if (today !== lastLoginDay) {
        const accountAge = Date.now() - user.createdAt;
        const daysOld = accountAge / (24 * 60 * 60 * 1000);
        
        // Chỉ tặng daily login trong 30 ngày đầu
        if (daysOld <= 30) {
            updateMiningBalance(userId, MINING_CONFIG.NEWBIE_BONUS.DAILY_LOGIN_BONUS);
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastLoginDay === yesterdayString) {
                user.streakDays++;
            } else {
                user.streakDays = 1;
            }
            
            user.lastLogin = Date.now();
            
            const data = loadMiningData();
            data[userId] = user;
            saveMiningData(data);
            
            return {
                bonus: MINING_CONFIG.NEWBIE_BONUS.DAILY_LOGIN_BONUS,
                streak: user.streakDays,
                isNewDay: true
            };
        }
    }
    
    return { isNewDay: false };
}

// THÊM: Áp dụng wealth tax và storage fees
function applyDailyCosts(userId) {
    const userBalance = getMiningBalance(userId);
    let totalCosts = 0;
    let messages = [];
    
    // Wealth tax cho user giàu
    if (userBalance > MINING_CONFIG.ECONOMY_CONTROL.WEALTH_TAX_THRESHOLD) {
        const wealthTax = Math.floor(userBalance * MINING_CONFIG.ECONOMY_CONTROL.WEALTH_TAX_RATE);
        updateMiningBalance(userId, -wealthTax);
        totalCosts += wealthTax;
        messages.push(`💸 Thuế giàu: -${wealthTax} coins`);
    }
    
    // Storage fee cho số dư lớn
    if (userBalance > 50000) {
        const storageFee = MINING_CONFIG.COIN_SINKS.STORAGE_FEE;
        updateMiningBalance(userId, -storageFee);
        totalCosts += storageFee;
        messages.push(`📦 Phí lưu trữ: -${storageFee} coins`);
    }
    
    return { totalCosts, messages };
}

// THÊM: Cập nhật daily quests với rewards thấp hơn
function updateDailyQuests(userId, action, amount = 1) {
    const user = initUser(userId);
    const today = new Date().toDateString();
    
    if (!user.dailyQuests[today]) {
        user.dailyQuests[today] = {
            mineCount: 0,
            joinedTeam: false,
            usedAutoMining: false,
            completed: []
        };
    }
    
    const todayQuests = user.dailyQuests[today];
    let rewards = [];
    
    switch (action) {
        case 'mine':
            todayQuests.mineCount += amount;
            
            if (todayQuests.mineCount >= 10 && !todayQuests.completed.includes('MINE_10_TIMES')) {
                todayQuests.completed.push('MINE_10_TIMES');
                updateMiningBalance(userId, MINING_CONFIG.DAILY_QUESTS.MINE_10_TIMES.reward);
                rewards.push({
                    name: MINING_CONFIG.DAILY_QUESTS.MINE_10_TIMES.description,
                    reward: MINING_CONFIG.DAILY_QUESTS.MINE_10_TIMES.reward
                });
            }
            
            if (todayQuests.mineCount >= 20 && !todayQuests.completed.includes('MINE_20_TIMES')) {
                todayQuests.completed.push('MINE_20_TIMES');
                updateMiningBalance(userId, MINING_CONFIG.DAILY_QUESTS.MINE_20_TIMES.reward);
                rewards.push({
                    name: MINING_CONFIG.DAILY_QUESTS.MINE_20_TIMES.description,
                    reward: MINING_CONFIG.DAILY_QUESTS.MINE_20_TIMES.reward
                });
            }
            break;
            
        case 'join_team':
            if (!todayQuests.joinedTeam && !todayQuests.completed.includes('JOIN_TEAM')) {
                todayQuests.joinedTeam = true;
                todayQuests.completed.push('JOIN_TEAM');
                updateMiningBalance(userId, MINING_CONFIG.DAILY_QUESTS.JOIN_TEAM.reward);
                rewards.push({
                    name: MINING_CONFIG.DAILY_QUESTS.JOIN_TEAM.description,
                    reward: MINING_CONFIG.DAILY_QUESTS.JOIN_TEAM.reward
                });
            }
            break;
            
        case 'auto_mining':
            if (!todayQuests.usedAutoMining && !todayQuests.completed.includes('USE_AUTO_MINING')) {
                todayQuests.usedAutoMining = true;
                todayQuests.completed.push('USE_AUTO_MINING');
                updateMiningBalance(userId, MINING_CONFIG.DAILY_QUESTS.USE_AUTO_MINING.reward);
                rewards.push({
                    name: MINING_CONFIG.DAILY_QUESTS.USE_AUTO_MINING.description,
                    reward: MINING_CONFIG.DAILY_QUESTS.USE_AUTO_MINING.reward
                });
            }
            break;
    }
    
    const data = loadMiningData();
    data[userId] = user;
    saveMiningData(data);
    
    return rewards;
}

// THÊM: Hệ thống tính toán mining với inflation control
function calculateMining(userId, timeDiff = null) {
    const user = initUser(userId);
    const now = Date.now();
    
    if (!timeDiff) {
        timeDiff = Math.min((now - user.lastMined) / 1000, MINING_CONFIG.MAX_OFFLINE_HOURS * 3600);
    }
    
    let baseEarnings = MINING_CONFIG.BASE_RATE * (timeDiff / 60);
    
    // Áp dụng inflation control
    const inflationMultiplier = getInflationMultiplier();
    baseEarnings *= inflationMultiplier;
    
    // Level bonus (giảm)
    const levelBonus = 1 + (user.level - 1) * MINING_CONFIG.LEVEL_MULTIPLIER;
    
    // Mining power bonus
    const powerBonus = user.miningPower;
    
    // Team bonus (giảm)
    let teamBonus = 1;
    if (user.team) {
        const teamData = loadTeamData();
        const team = teamData[user.team];
        if (team) {
            teamBonus = 1 + (team.members.length * MINING_CONFIG.TEAM_BONUS);
        }
    }
    
    // VIP bonus
    let vipBonus = 1;
    const vipData = getUserVIP(userId);
    if (vipData && vipData.active && vipData.benefits) {
        if (vipData.benefits.miningBonus) {
            vipBonus = 1 + vipData.benefits.miningBonus;
        } else {
            vipBonus = MINING_CONFIG.VIP_MULTIPLIERS[vipData.tier] || 1;
        }
    }
    
    // Newbie bonus (giới hạn thời gian)
    const newbieMultiplier = getNewbieMultiplier(userId);
    
    // Equipment bonus
    let equipmentBonus = 1;
    user.equipment.forEach(eq => {
        equipmentBonus += eq.bonus || 0;
    });
    
    // Active boosts
    let boostMultiplier = 1;
    const activeBoosts = user.boosts.filter(boost => boost.expires > now);
    activeBoosts.forEach(boost => {
        boostMultiplier += boost.multiplier || 0;
    });
    
    const finalEarnings = baseEarnings * levelBonus * powerBonus * teamBonus * vipBonus * newbieMultiplier * equipmentBonus * boostMultiplier;
    
    return {
        amount: Math.floor(finalEarnings),
        levelBonus,
        powerBonus,
        teamBonus,
        vipBonus,
        newbieMultiplier,
        equipmentBonus,
        boostMultiplier,
        inflationMultiplier,
        vipData
    };
}

// THÊM: Hệ thống rút tiền với phí cao hơn và giới hạn chặt
function processWithdrawal(userId, amount) {
    const user = initUser(userId);
    const userBalance = getMiningBalance(userId); // Thay đổi ở đây
    
    // Kiểm tra số dư tối thiểu
    if (userBalance < MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT) {
        return {
            success: false,
            message: `❌ Cần ít nhất ${MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT.toLocaleString()} coins để rút tiền!`
        };
    }
    
    // Kiểm tra số tiền rút
    if (amount < MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT) {
        return {
            success: false,
            message: `❌ Số tiền rút tối thiểu là ${MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT.toLocaleString()} coins!`
        };
    }
    
    if (amount > userBalance) {
        return {
            success: false,
            message: "❌ Số dư không đủ!"
        };
    }
    
    // Kiểm tra giới hạn hàng ngày
    const today = new Date().toDateString();
    if (!user.withdrawalHistory) user.withdrawalHistory = {};
    if (!user.withdrawalHistory[today]) user.withdrawalHistory[today] = 0;
    
    let dailyLimit = MINING_CONFIG.WITHDRAWAL.DAILY_LIMIT;
    const vipData = getUserVIP(userId);
    if (vipData && vipData.active && vipData.tier === 'GOLD') {
        dailyLimit *= MINING_CONFIG.WITHDRAWAL.VIP_BONUS_LIMIT.GOLD;
    }
    
    if (user.withdrawalHistory[today] + amount > dailyLimit) {
        return {
            success: false,
            message: `❌ Vượt quá giới hạn rút tiền hàng ngày! Còn lại: ${(dailyLimit - user.withdrawalHistory[today]).toLocaleString()} coins`
        };
    }
    
    // Tính phí rút tiền (tăng lên 12%)
    const fee = Math.floor(amount * MINING_CONFIG.FEES.WITHDRAWAL_FEE);
    const actualAmount = amount - fee;
    
    // Xử lý rút tiền
    updateMiningBalance(userId, -amount); // Thay đổi ở đây
    user.withdrawalHistory[today] += amount;
    
    // Lưu dữ liệu
    const data = loadMiningData();
    data[userId] = user;
    saveMiningData(data);
    
    return {
        success: true,
        amount: actualAmount,
        fee: fee,
        remaining: userBalance - amount
    };
}

// THÊM: Kiểm soát lạm phát
function getInflationMultiplier() {
    const data = loadMiningData();
    const totalCoinsInSystem = Object.values(data).reduce((sum, user) => {
        return sum + (user.totalMined || 0);
    }, 0);
    
    // Nếu quá nhiều coins trong hệ thống, giảm mining rate
    if (totalCoinsInSystem > MINING_CONFIG.ECONOMY_CONTROL.MAX_COINS_IN_SYSTEM) {
        const excess = totalCoinsInSystem - MINING_CONFIG.ECONOMY_CONTROL.MAX_COINS_IN_SYSTEM;
        const reductionFactor = Math.max(0.3, 1 - (excess / MINING_CONFIG.ECONOMY_CONTROL.MAX_COINS_IN_SYSTEM));
        return reductionFactor;
    }
    
    return 1.0;
}

// Calculate required XP for next level
function getRequiredXP(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Handle level up
function checkLevelUp(userId) {
    const data = loadMiningData();
    const user = data[userId];
    
    if (!user) return false;
    
    const requiredXP = getRequiredXP(user.level);
    
    if (user.experience >= requiredXP) {
        user.level++;
        user.experience -= requiredXP;
        user.miningPower += 0.1;
        
        // THÊM: Level up bonus
        updateMiningBalance(userId, MINING_CONFIG.NEWBIE_BONUS.LEVEL_UP_BONUS);
        
        saveMiningData(data);
        return true;
    }
    
    return false;
}

// Auto-mining system
function startAutoMining(userId, hours) {
    const data = loadMiningData();
    const user = data[userId];
    
    if (!user) return false;
    
    const now = Date.now();
    user.autoMining = {
        active: true,
        startTime: now,
        endTime: now + (hours * 60 * 60 * 1000),
        rate: calculateMining(userId, 3600).amount // hourly rate
    };
    
    saveMiningData(data);
    return true;
}

function claimAutoMining(userId) {
    const data = loadMiningData();
    const user = data[userId];
    
    if (!user || !user.autoMining.active) return null;
    
    const now = Date.now();
    const miningTime = Math.min(now - user.autoMining.startTime, user.autoMining.endTime - user.autoMining.startTime);
    const hoursActive = miningTime / (60 * 60 * 1000);
    
    const earnings = Math.floor(user.autoMining.rate * hoursActive);
    
    // Reset auto mining if expired
    if (now >= user.autoMining.endTime) {
        user.autoMining.active = false;
    } else {
        user.autoMining.startTime = now;
    }
    
    user.totalMined += earnings;
    updateMiningBalance(userId, earnings);
    
    saveMiningData(data);
    
    return {
        amount: earnings,
        hoursActive: hoursActive.toFixed(1),
        stillActive: user.autoMining.active
    };
}

// THÊM: Kiểm tra giới hạn đào hàng ngày
function checkDailyMiningLimit(userId) {
    const user = initUser(userId);
    const today = new Date().toDateString();
    
    if (!user.dailyMining) user.dailyMining = {};
    if (!user.dailyMining[today]) user.dailyMining[today] = 0;
    
    const vipData = getUserVIP(userId);
    // console.log('[DEBUG] VIP Data for mining limit:', vipData);
    
    // Kiểm tra VIP chặt chẽ hơn
    const isVip = vipData && vipData.active && vipData.packageId === 3;
    const dailyLimit = isVip ? MINING_CONFIG.DAILY_MINING.VIP_LIMIT : MINING_CONFIG.DAILY_MINING.FREE_LIMIT;

    // console.log('[DEBUG] Mining limit check:', {
    //     userId,
    //     isVip,
    //     dailyLimit,
    //     currentCount: user.dailyMining[today]
    // });
    
    return {
        count: user.dailyMining[today],
        limit: dailyLimit,
        canMine: user.dailyMining[today] < dailyLimit,
        needsPay: user.dailyMining[today] >= dailyLimit,
        isVip
    };
}

function incrementDailyMining(userId) {
    const user = initUser(userId);
    const today = new Date().toDateString();
    
    if (!user.dailyMining) user.dailyMining = {};
    if (!user.dailyMining[today]) user.dailyMining[today] = 0;
    
    user.dailyMining[today]++;
    
    const data = loadMiningData();
    data[userId] = user;
    saveMiningData(data);
}

// Initialize data files
initializeDataFiles();

module.exports = {
    name: "coin",
    dev: "HNT", 
    category: "Games",
    info: "MMO Mining Game",
    onPrefix: true,
    usages: "coin [mine/auto/team/shop/stats]",
    cooldowns: 2,

    onLoad: function() {
        console.log('[MINING] MMO Mining system loaded');
    },

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const action = target[0]?.toLowerCase();

        try {
            const user = initUser(senderID);
            const userName = await getName(senderID);

            switch (action) {
                case "help":
                case "hướng_dẫn": {
                    return api.sendMessage(
                        "📚 HƯỚNG DẪN CHI TIẾT MINING 📚\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1️⃣ BẮT ĐẦU:\n" +
                        "• .coin mine - Đào coin cơ bản\n" +
                        "• Free user: 15 lượt/ngày\n" +
                        "• VIP Gold: 60 lượt/ngày\n" +
                        "• Cooldown: 25 giây/lần đào\n\n" +
                        
                        "2️⃣ NÂNG CAO HIỆU QUẢ:\n" +
                        "• Tham gia team (+1.5%/thành viên)\n" +
                        "• Mua VIP Gold (+80% coins)\n" +
                        "• Sử dụng auto mining (AFK)\n" +
                        "• Thu hoạch offline (tối đa 8h)\n\n" +
                        
                        "3️⃣ HỆ THỐNG TEAM:\n" +
                        "• .coin team create [tên] - Tạo team\n" +
                        "• .coin team join [ID] - Vào team\n" +
                        "• .coin team info - Xem thông tin\n" +
                        "• .coin team leave - Rời team\n" +
                        "• Phí tạo team: 3,000 coins\n" +
                        "• Tối đa 10 thành viên/team\n\n" +
                        
                        "4️⃣ AUTO MINING:\n" +
                        "• .coin auto start [giờ] - Bật auto\n" +
                        "• .coin auto claim - Thu hoạch\n" +
                        "• Chi phí: 80 coins/giờ\n" +
                        "• Phí dịch vụ: 12%\n" +
                        "• Thời gian: 1-24 giờ\n\n" +
                        
                        "5️⃣ NHIỆM VỤ HÀNG NGÀY:\n" +
                        "• Đào 10 lần: +800 coins\n" +
                        "• Đào 20 lần: +1,800 coins\n" +
                        "• Tham gia team: +1,200 coins\n" +
                        "• Auto mining: +900 coins\n" +
                        "• Reset vào 00:00 mỗi ngày\n\n" +
                        
                        "6️⃣ RÚT TIỀN & PHÍ:\n" +
                        "• .coin withdraw [số tiền]\n" +
                        "• Rút tối thiểu: 8,000 coins\n" +
                        "• Phí rút: 10% số tiền rút\n" +
                        "• Giới hạn/ngày: 50,000 coins\n" +
                        "• VIP: +100% giới hạn rút\n\n" +
                        
                        "7️⃣ TIỆN ÍCH KHÁC:\n" +
                        "• .coin stats - Xem thông số\n" +
                        "• .coin shop - Mua vật phẩm\n" +
                        "• .coin leaderboard - BXH\n" +
                        "• .coin quests - Nhiệm vụ\n\n" +
                        
                        "💎 LƯU Ý QUAN TRỌNG:\n" +
                        "• Newbie được x2.2 coins trong 10 ngày đầu\n" +
                        "• Daily login bonus trong 30 ngày đầu\n" +
                        "• Thuế giàu khi có >100k coins\n" +
                        "• Phí lưu trữ khi có >50k coins\n" +
                        "• Có thể AFK để auto mining và thu offline\n\n" +
                        
                        "👑 ƯU ĐÃI VIP GOLD (49K/THÁNG):\n" +
                        "• 60 lượt đào/ngày (thay vì 15)\n" + 
                        "• +80% coins khi đào\n" +
                        "• x2 giới hạn rút tiền/ngày\n" +
                        "• Giảm phí auto mining\n" +
                        "• Ưu tiên hỗ trợ 24/7\n\n" +
                        
                        "💰 THU NHẬP DỰ KIẾN:\n" +
                        "🆓 Free User: 80-100 coins/ngày → Rút được sau 80-100 ngày\n" +
                        "👑 VIP Gold: 750-800 coins/ngày → Rút được sau 10-12 ngày\n\n" +
                        
                        "💡 MẸO CHƠI HIỆU QUẢ:\n" +
                        "1. Tham gia team càng sớm càng tốt\n" +
                        "2. Dùng auto mining khi offline\n" +
                        "3. Làm nhiệm vụ hàng ngày\n" +
                        "4. Đầu tư VIP để tăng thu nhập x8\n" +
                        "5. Thu hoạch đều đặn tránh mất coins\n\n" +
                        
                        "⚠️ CẢNH BÁO GIAN LẬN:\n" +
                        "• Nghiêm cấm sử dụng tool auto/hack\n" +
                        "• Nghiêm cấm lạm dụng lỗi hệ thống\n" +
                        "• Vi phạm sẽ bị khóa tài khoản vĩnh viễn\n\n" +
                        
                        "📞 HỖ TRỢ & BÁO LỖI:\n" +
                        "• Báo cáo lỗi: Admin HNT\n" +
                        "• Group hỗ trợ: fb.com/groups/...\n" +
                        "• Fanpage: fb.com/...",
                        threadID, messageID
                    );
                    break;
                }
                
                case "mine":
                case "đào": {
                    // Áp dụng daily costs trước khi mining
                    const dailyCosts = applyDailyCosts(senderID);
                    let costMessage = "";
                    if (dailyCosts.totalCosts > 0) {
                        costMessage = `\n${dailyCosts.messages.join('\n')}`;
                    }

                    // Kiểm tra daily login bonus
                    const loginBonus = checkDailyLoginBonus(senderID);
                    let loginMessage = "";
                    if (loginBonus.isNewDay) {
                        loginMessage = `\n🎁 Daily Login: +${loginBonus.bonus} coins (Streak: ${loginBonus.streak} ngày)`;
                    }

                    const now = Date.now();
                    const timeSinceLastMine = now - user.lastMined;

                    if (timeSinceLastMine < MINING_CONFIG.COOLDOWN) {
                        const remainingTime = Math.ceil((MINING_CONFIG.COOLDOWN - timeSinceLastMine) / 1000);
                        return api.sendMessage(
                            `⏳ Bạn cần đợi ${remainingTime} giây nữa để đào tiếp!${loginMessage}${costMessage}`,
                            threadID, messageID
                        );
                    }

                    // Kiểm tra giới hạn đào hàng ngày
                    const dailyLimit = checkDailyMiningLimit(senderID);
                    
                    if (dailyLimit.needsPay) {
                        const extraCost = MINING_CONFIG.DAILY_MINING.EXTRA_COST;
                        
                        if (getMiningBalance(senderID) < extraCost) {
                            return api.sendMessage(
                                `❌ Đã hết lượt đào miễn phí!\n\n` +
                                `📊 Hôm nay: ${dailyLimit.count}/${dailyLimit.limit} lượt\n` +
                                `💰 Đào thêm: ${extraCost} coins/lần\n` +
                                `💎 Số dư: ${getMiningBalance(senderID)} coins\n\n` +
                                `👑 VIP Gold: ${dailyLimit.isVip ? "✅" : "❌"}\n` +
                                `💡 Mua VIP Gold 49k/tháng để có ${MINING_CONFIG.DAILY_MINING.VIP_LIMIT} lượt/ngày!${loginMessage}${costMessage}`,
                                threadID, messageID
                            );
                        }
                        
                        updateMiningBalance(senderID, -extraCost);
                    }

                    incrementDailyMining(senderID);

                    // Calculate offline earnings if applicable
                    let offlineMessage = "";
                    if (user.lastMined > 0 && timeSinceLastMine > MINING_CONFIG.COOLDOWN) {
                        const offlineHours = Math.min(timeSinceLastMine / (60 * 60 * 1000), MINING_CONFIG.MAX_OFFLINE_HOURS);
                        if (offlineHours >= 0.1) {
                            const offlineEarnings = calculateMining(senderID, offlineHours * 3600);
                            updateMiningBalance(senderID, offlineEarnings.amount);
                            user.totalMined += offlineEarnings.amount;
                            offlineMessage = `\n💤 Thu nhập offline: ${offlineEarnings.amount} coins (${offlineHours.toFixed(1)}h)`;
                        }
                    }

                    // Regular mining
                    const mining = calculateMining(senderID, 60);
                    const minedAmount = mining.amount;

                    // Update user data
                    const data = loadMiningData();
                    data[senderID].lastMined = now;
                    data[senderID].miningCount++;
                    data[senderID].totalMined += minedAmount;
                    data[senderID].experience += minedAmount;
                    updateMiningBalance(senderID, minedAmount);
                    saveMiningData(data);

                    // Cập nhật daily quests
                    const questRewards = updateDailyQuests(senderID, 'mine', 1);
                    let questMessage = "";
                    if (questRewards.length > 0) {
                        questMessage = `\n🎯 Hoàn thành nhiệm vụ:`;
                        questRewards.forEach(quest => {
                            questMessage += `\n✅ ${quest.name}: +${quest.reward} coins`;
                        });
                    }

                    // Check for level up
                    const leveledUp = checkLevelUp(senderID);
                    let levelUpMessage = "";
                    if (leveledUp) {
                        levelUpMessage = `\n🎉 LEVEL UP! Bạn đã đạt level ${user.level + 1}!\n💰 Thưởng level up: +${MINING_CONFIG.NEWBIE_BONUS.LEVEL_UP_BONUS} coins`;
                    }

                    // Prepare bonus info
                    let bonusMessage = "";
                    if (mining.vipData && mining.vipData.active) {
                        bonusMessage += `\n👑 VIP ${mining.vipData.tier}: +${((mining.vipBonus - 1) * 100).toFixed(0)}%`;
                    }
                    if (mining.newbieMultiplier > 1) {
                        bonusMessage += `\n🆕 Newbie Bonus: x${mining.newbieMultiplier}`;
                    }
                    if (mining.inflationMultiplier < 1) {
                        bonusMessage += `\n⚠️ Economic adjustment: x${mining.inflationMultiplier.toFixed(2)}`;
                    }

                    // Thông tin giới hạn đào
                    const newDailyLimit = checkDailyMiningLimit(senderID);
                    let limitMessage = `\n📊 Lượt đào: ${newDailyLimit.count}/${newDailyLimit.limit}`;
                    if (dailyLimit.needsPay) {
                        limitMessage += ` (đã trả ${MINING_CONFIG.DAILY_MINING.EXTRA_COST} coins)`;
                    }

                    return api.sendMessage(
                        `⛏️ MINING THÀNH CÔNG! ⛏️\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `💰 Đã đào: ${minedAmount} coins\n` +
                        `⚡ Mining Power: ${user.miningPower.toFixed(1)}x\n` +
                        `📊 Level: ${user.level} (${user.experience}/${getRequiredXP(user.level)} XP)\n` +
                        `💎 Tổng đào: ${user.totalMined} coins\n` +
                        `🔢 Lần đào: ${user.miningCount}\n` +
                        `💵 Số dư: ${getMiningBalance(senderID)} coins${limitMessage}${loginMessage}${costMessage}${offlineMessage}${bonusMessage}${questMessage}${levelUpMessage}`,
                        threadID, messageID
                    );
                    break;
                }

                case "auto": {
                    const subAction = target[1]?.toLowerCase();
                    
                    if (subAction === "start") {
                        const hours = parseInt(target[2]) || 1;
                        if (hours < 1 || hours > 24) {
                            return api.sendMessage("❌ Thời gian auto mining phải từ 1-24 giờ!", threadID, messageID);
                        }
                        
                        const baseCost = hours * 80; // Giảm từ 100 xuống 80 coins/giờ
                        const serviceFee = Math.floor(baseCost * MINING_CONFIG.FEES.AUTO_MINING_FEE);
                        const totalCost = baseCost + serviceFee;
                        
                        if (getMiningBalance(senderID) < totalCost) {
                            return api.sendMessage(
                                `❌ Không đủ coins!\n` +
                                `💰 Chi phí: ${baseCost.toLocaleString()} coins\n` +
                                `💸 Phí dịch vụ: ${serviceFee.toLocaleString()} coins (${(MINING_CONFIG.FEES.AUTO_MINING_FEE * 100)}%)\n` +
                                `💎 Tổng cộng: ${totalCost.toLocaleString()} coins`,
                                threadID, messageID
                            );
                        }
                        
                        updateMiningBalance(senderID, -totalCost);
                        startAutoMining(senderID, hours);
                        
                        // THÊM: Cập nhật quest auto mining
                        const questRewards = updateDailyQuests(senderID, 'auto_mining');
                        let questMessage = "";
                        if (questRewards.length > 0) {
                            questMessage = `\n🎯 Hoàn thành nhiệm vụ: ${questRewards[0].name} (+${questRewards[0].reward} coins)`;
                        }
                        
                        return api.sendMessage(
                            `✅ Đã kích hoạt auto mining ${hours} giờ!\n` +
                            `💰 Chi phí cơ bản: ${baseCost.toLocaleString()} coins\n` +
                            `💸 Phí dịch vụ: ${serviceFee.toLocaleString()} coins (${(MINING_CONFIG.FEES.AUTO_MINING_FEE * 100)}%)\n` +
                            `💎 Tổng thanh toán: ${totalCost.toLocaleString()} coins\n` +
                            `⏰ Kết thúc: ${new Date(Date.now() + hours * 60 * 60 * 1000).toLocaleString()}${questMessage}`,
                            threadID, messageID
                        );
                    } else if (subAction === "claim") {
                        const claimed = claimAutoMining(senderID);
                        if (!claimed) {
                            return api.sendMessage("❌ Bạn không có auto mining nào đang hoạt động!", threadID, messageID);
                        }
                        
                        return api.sendMessage(
                            `💰 Thu hoạch auto mining!\n` +
                            `💎 Nhận được: ${claimed.amount} coins\n` +
                            `⏰ Thời gian: ${claimed.hoursActive} giờ\n` +
                            `${claimed.stillActive ? "🟢 Auto mining vẫn đang hoạt động" : "🔴 Auto mining đã kết thúc"}`,
                            threadID, messageID
                        );
                    } else {
                        return api.sendMessage(
                            "🤖 AUTO MINING 🤖\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "📝 LỆNH:\n" +
                            "• .mining auto start [giờ] - Bật auto mining\n" +
                            "• .mining auto claim - Thu hoạch\n\n" +
                            "💰 CHI PHÍ:\n" +
                            "• Phí cơ bản: 80 coins/giờ\n" +
                            `• Phí dịch vụ: ${(MINING_CONFIG.FEES.AUTO_MINING_FEE * 100)}% (duy trì hệ thống)\n` +
                            "• Ví dụ: 10 giờ = 800 + 96 = 896 coins\n\n" +
                            "⏰ Tối đa: 24 giờ\n" +
                            "💡 Auto mining sẽ đào coin cho bạn khi offline!",
                            threadID, messageID
                        );
                    }
                    break;
                }

                case "team": {
                    const subAction = target[1]?.toLowerCase();
                    const teamData = loadTeamData();
                    
                    if (subAction === "create") {
                        const teamName = target.slice(2).join(" ");
                        if (!teamName || teamName.length < 3) {
                            return api.sendMessage("❌ Tên team phải có ít nhất 3 ký tự!", threadID, messageID);
                        }
                        
                        if (user.team) {
                            return api.sendMessage("❌ Bạn đã có team rồi!", threadID, messageID);
                        }
                        
                        // Kiểm tra phí tạo team
                        if (getMiningBalance(senderID) < MINING_CONFIG.FEES.TEAM_CREATE_FEE) {
                            return api.sendMessage(
                                `❌ Không đủ coins để tạo team!\n` +
                                `💰 Phí tạo team: ${MINING_CONFIG.FEES.TEAM_CREATE_FEE.toLocaleString()} coins\n` +
                                `💎 Số dư của bạn: ${getMiningBalance(senderID).toLocaleString()} coins`,
                                threadID, messageID
                            );
                        }
                        
                        // Check if team name exists
                        const teamExists = Object.values(teamData).some(team => team.name.toLowerCase() === teamName.toLowerCase());
                        if (teamExists) {
                            return api.sendMessage("❌ Tên team đã tồn tại!", threadID, messageID);
                        }
                        
                        // Trừ phí tạo team
                        updateMiningBalance(senderID, -MINING_CONFIG.FEES.TEAM_CREATE_FEE);
                        
                        const teamId = `team_${Date.now()}`;
                        teamData[teamId] = {
                            name: teamName,
                            leader: senderID,
                            members: [senderID],
                            totalMined: 0,
                            level: 1,
                            created: Date.now()
                        };
                        
                        const data = loadMiningData();
                        data[senderID].team = teamId;
                        
                        saveTeamData(teamData);
                        saveMiningData(data);
                        
                        return api.sendMessage(
                            `✅ Đã tạo team "${teamName}" thành công!\n` +
                            `👑 Bạn là leader\n` +
                            `💰 Đã trừ phí: ${MINING_CONFIG.FEES.TEAM_CREATE_FEE.toLocaleString()} coins\n` +
                            `🆔 Team ID: ${teamId}`,
                            threadID, messageID
                        );
                    } else if (subAction === "join") {
                        const teamId = target[2];
                        if (!teamId || !teamData[teamId]) {
                            return api.sendMessage("❌ Team không tồn tại!", threadID, messageID);
                        }
                        
                        if (user.team) {
                            return api.sendMessage("❌ Bạn đã có team rồi! Hãy rời team hiện tại trước.", threadID, messageID);
                        }
                        
                        const team = teamData[teamId];
                        if (team.members.length >= 10) {
                            return api.sendMessage("❌ Team đã đầy (tối đa 10 thành viên)!", threadID, messageID);
                        }
                        
                        team.members.push(senderID);
                        const data = loadMiningData();
                        data[senderID].team = teamId;
                        
                        saveTeamData(teamData);
                        saveMiningData(data);
                        
                        return api.sendMessage(
                            `✅ Đã tham gia team "${team.name}"!\n` +
                            `👥 Thành viên: ${team.members.length}/10\n` +
                            `🎁 Bonus team: +${team.members.length * 5}%`,
                            threadID, messageID
                        );
                    } else if (subAction === "leave") {
                        if (!user.team) {
                            return api.sendMessage("❌ Bạn chưa có team!", threadID, messageID);
                        }
                        
                        const team = teamData[user.team];
                        if (team.leader === senderID) {
                            return api.sendMessage("❌ Leader không thể rời team! Hãy chuyển quyền leader trước.", threadID, messageID);
                        }
                        
                        team.members = team.members.filter(id => id !== senderID);
                        const data = loadMiningData();
                        data[senderID].team = null;
                        
                        saveTeamData(teamData);
                        saveMiningData(data);
                        
                        return api.sendMessage(`✅ Đã rời team "${team.name}"!`, threadID, messageID);
                    } else if (subAction === "info") {
                        if (!user.team) {
                            return api.sendMessage("❌ Bạn chưa có team!", threadID, messageID);
                        }
                        
                        const team = teamData[user.team];
                        const isLeader = team.leader === senderID;
                        
                        return api.sendMessage(
                            `🏰 THÔNG TIN TEAM 🏰\n` +
                            `━━━━━━━━━━━━━━━━━━\n` +
                            `📛 Tên: ${team.name}\n` +
                            `👑 Leader: ${await getName(team.leader)}\n` +
                            `👥 Thành viên: ${team.members.length}/10\n` +
                            `⭐ Level: ${team.level}\n` +
                            `💎 Tổng đào: ${team.totalMined} coins\n` +
                            `🎁 Bonus: +${team.members.length * 5}%\n` +
                            `🆔 ID: ${user.team}\n\n` +
                            `${isLeader ? "👑 Bạn là leader của team này" : "👤 Bạn là thành viên"}`,
                            threadID, messageID
                        );
                    } else {
                        return api.sendMessage(
                            "🏰 TEAM SYSTEM 🏰\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "📝 LỆNH:\n" +
                            "• .coin team create [tên] - Tạo team\n" +
                            "• .coin team join [ID] - Tham gia team\n" +
                            "• .coin team leave - Rời team\n" +
                            "• .coin team info - Xem thông tin team\n\n" +
                            "💰 PHÍ DỊCH VỤ:\n" +
                            `• Phí tạo team: ${MINING_CONFIG.FEES.TEAM_CREATE_FEE.toLocaleString()} coins\n` +
                            "• Tham gia team: Miễn phí\n\n" +
                            "🎁 BONUS:\n" +
                            "• Mỗi thành viên: +5% mining power\n" +
                            "• Tối đa 10 thành viên: +50%\n" +
                            "• Cùng nhau đào coin hiệu quả hơn!",
                            threadID, messageID
                        );
                    }
                    break;
                }

                case "stats":
                case "thống_kê": {
                    const requiredXP = getRequiredXP(user.level);
                    const team = user.team ? loadTeamData()[user.team] : null;
                    const vipData = getUserVIP(senderID);
                    
                    let vipInfo = "❌ Không có VIP Gold";
                    if (vipData && vipData.active && vipData.tier === 'GOLD') {
                        vipInfo = `✅ VIP GOLD (còn ${vipData.daysLeft} ngày)`;
                        if (vipData.benefits && vipData.benefits.miningBonus) {
                            vipInfo += `\n🎁 Mining bonus: +${(vipData.benefits.miningBonus * 100).toFixed(0)}%`;
                        }
                    }
                    
                    return api.sendMessage(
                        `📊 THỐNG KÊ MINING 📊\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `👤 Người chơi: ${userName}\n` +
                        `⭐ Level: ${user.level}\n` +
                        `🔸 XP: ${user.experience}/${requiredXP}\n` +
                        `⚡ Mining Power: ${user.miningPower.toFixed(1)}x\n` +
                        `💎 Tổng đào: ${user.totalMined} coins\n` +
                        `🔢 Số lần đào: ${user.miningCount}\n` +
                        `💰 Số dư hiện tại: ${getMiningBalance(senderID)} coins\n\n` +
                        `🏰 Team: ${team ? team.name : "Chưa có"}\n` +
                        `${team ? `🎁 Team bonus: +${team.members.length * 5}%` : "💡 Tham gia team để có bonus!"}\n\n` +
                        `👑 VIP: ${vipInfo}\n\n` +
                        `🤖 Auto mining: ${user.autoMining.active ? "🟢 Đang hoạt động" : "🔴 Không hoạt động"}`,
                        threadID, messageID
                    );
                    break;
                }

                case "shop":
                case "cửa_hàng": {
                    return api.sendMessage(
                        "🛒 MINING SHOP 🛒\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "⚒️ THIẾT BỊ MINING:\n" +
                        "• Pickaxe Đồng: 2,000 coins (+0.2x power)\n" +
                        "• Pickaxe Bạc: 8,000 coins (+0.5x power)\n" +
                        "• Pickaxe Vàng: 25,000 coins (+1.0x power)\n\n" +
                        "⚡ BOOST ITEMS:\n" +
                        "• Speed Boost 1h: 1,000 coins (+50% speed)\n" +
                        "• Speed Boost 24h: 15,000 coins (+50% speed)\n" +
                        "• Double Earnings 1h: 2,000 coins (+100% coins)\n\n" +
                        "👑 VIP GOLD PACKAGE:\n" +
                        "• VIP Gold: 49,000 VND/tháng\n" +
                        "• +80% mining bonus\n" +
                        "• +100% giới hạn rút tiền\n" +
                        "• 50 lượt đào/ngày (thay vì 10)\n" +
                        "• Giảm phí auto mining 5%\n" +
                        "• Xem chi tiết: .vip\n\n" +
                        "💡 VIP Gold 49k - Đầu tư hiệu quả nhất!",
                        threadID, messageID
                    );
                    break;
                }

                case "leaderboard":
                case "bảng_xếp_hạng": {
                    const allUsers = loadMiningData();
                    const sortedUsers = Object.entries(allUsers)
                        .sort(([,a], [,b]) => b.totalMined - a.totalMined)
                        .slice(0, 10);
                    
                    let leaderboard = "🏆 BẢNG XẾP HẠNG MINING 🏆\n";
                    leaderboard += "━━━━━━━━━━━━━━━━━━\n\n";
                    
                    for (let i = 0; i < sortedUsers.length; i++) {
                        const [userId, userData] = sortedUsers[i];
                        const userName = await getName(userId);
                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                        
                        leaderboard += `${medal} ${userName}\n`;
                        leaderboard += `   💎 ${userData.totalMined} coins | ⭐ Lv.${userData.level}\n\n`;
                    }
                    
                    // Find user's rank
                    const userRank = Object.entries(allUsers)
                        .sort(([,a], [,b]) => b.totalMined - a.totalMined)
                        .findIndex(([id]) => id === senderID) + 1;
                    
                    leaderboard += `📍 Hạng của bạn: #${userRank}`;
                    
                    return api.sendMessage(leaderboard, threadID, messageID);
                    break;
                }

                case "quests":
                case "nhiệm_vụ": {
                    const today = new Date().toDateString();
                    const todayQuests = user.dailyQuests?.[today] || {
                        mineCount: 0,
                        joinedTeam: false,
                        usedAutoMining: false,
                        completed: []
                    };
                    
                    return api.sendMessage(
                        "🎯 NHIỆM VỤ HÀNG NGÀY 🎯\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `📅 Ngày: ${new Date().toLocaleDateString()}\n\n` +
                        `${todayQuests.completed.includes('MINE_10_TIMES') ? '✅' : '⏳'} Đào 10 lần (${Math.min(todayQuests.mineCount, 10)}/10) - ${MINING_CONFIG.DAILY_QUESTS.MINE_10_TIMES.reward} coins\n` +
                        `${todayQuests.completed.includes('MINE_20_TIMES') ? '✅' : '⏳'} Đào 20 lần (${Math.min(todayQuests.mineCount, 20)}/20) - ${MINING_CONFIG.DAILY_QUESTS.MINE_20_TIMES.reward} coins\n` +
                        `${todayQuests.completed.includes('JOIN_TEAM') ? '✅' : '⏳'} Tham gia team - ${MINING_CONFIG.DAILY_QUESTS.JOIN_TEAM.reward} coins\n` +
                        `${todayQuests.completed.includes('USE_AUTO_MINING') ? '✅' : '⏳'} Sử dụng auto mining - ${MINING_CONFIG.DAILY_QUESTS.USE_AUTO_MINING.reward} coins\n\n` +
                        `💰 Đã hoàn thành: ${todayQuests.completed.length}/4 nhiệm vụ\n` +
                        `🔄 Reset vào 00:00 hàng ngày\n\n` +
                        "💡 Hoàn thành nhiệm vụ để nhận thưởng coins!",
                        threadID, messageID
                    );
                    break;
                }

                case "bank":
                case "linkbank":
                case "liên_kết_ngân_hàng": {
                    const subAction = target[1]?.toLowerCase();
                    
                    if (subAction === "link") {
                        // Kiểm tra xem đã liên kết chưa
                        if (user.bankAccount && user.bankAccount.linked) {
                            return api.sendMessage(
                                "🏦 THÔNG TIN NGÂN HÀNG HIỆN TẠI 🏦\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                `🏧 Ngân hàng: ${user.bankAccount.bankName}\n` +
                                `💳 Số tài khoản: ${user.bankAccount.accountNumber.replace(/(.{4})/g, '$1 ')}\n` +
                                `👤 Chủ tài khoản: ${user.bankAccount.accountName}\n` +
                                `📅 Liên kết lúc: ${new Date(user.bankAccount.linkedAt).toLocaleString()}\n\n` +
                                "⚠️ CẢNH BÁO NGHIÊM TRỌNG\n" +
                                "• Tài khoản ngân hàng đã được liên kết vĩnh viễn\n" +
                                "• KHÔNG THỂ thay đổi hoặc hủy liên kết\n" +
                                "• Đây là biện pháp bảo mật tuyệt đối\n\n" +
                                "✅ Trạng thái: Đã xác thực và bảo mật",
                                threadID, messageID
                            );
                        }
                        
                        const bankName = target[2];
                        const accountNumber = target[3];
                        const accountName = target.slice(4).join(" ");
                        
                        if (!bankName || !accountNumber || !accountName) {
                            return api.sendMessage(
                                "🏦 LIÊN KẾT NGÂN HÀNG 🏦\n" +
                                "━━━━━━━━━━━━━━━━━━\n\n" +
                                "📝 CÁCH SỬ DỤNG:\n" +
                                ".coin bank link [Tên ngân hàng] [Số tài khoản] [Tên chủ TK]\n\n" +
                                "📋 VÍ DỤ:\n" +
                                ".coin bank link Vietcombank 1234567890 NGUYEN VAN A\n" +
                                ".coin bank link Techcombank 9876543210 TRAN THI B\n" +
                                ".coin bank link BIDV 5555666677 LE VAN C\n\n" +
                                "🏧 NGÂN HÀNG HỖ TRỢ:\n" +
                                "• Vietcombank, Techcombank, BIDV\n" +
                                "• VietinBank, Agribank, Sacombank\n" +
                                "• MBBank, VPBank, TPBank, ACB\n\n" +
                                "⚠️ LƯU Ý QUAN TRỌNG:\n" +
                                "• Chỉ được liên kết 1 lần duy nhất\n" +
                                "• Không thể sửa đổi sau khi liên kết\n" +
                                "• Nhập chính xác thông tin ngân hàng\n" +
                                "• Tên chủ TK phải viết HOA, không dấu\n\n" +
                                "🔒 Bảo mật tuyệt đối - Thao tác không thể hoàn tác!",
                                threadID, messageID
                            );
                        }
                        
                        // Validate account number (chỉ số, 6-20 ký tự)
                        if (!/^\d{6,20}$/.test(accountNumber)) {
                            return api.sendMessage(
                                "❌ Số tài khoản không hợp lệ!\n\n" +
                                "📋 YÊU CẦU:\n" +
                                "• Chỉ chứa số (0-9)\n" +
                                "• Độ dài từ 6-20 ký tự\n" +
                                "• Không có khoảng trắng hoặc ký tự đặc biệt\n\n" +
                                "💡 Kiểm tra lại số tài khoản và thử lại!",
                                threadID, messageID
                            );
                        }
                        
                        // Validate account name (chỉ chữ cái và khoảng trắng, viết hoa)
                        if (!/^[A-Z\s]+$/.test(accountName)) {
                            return api.sendMessage(
                                "❌ Tên chủ tài khoản không hợp lệ!\n\n" +
                                "📋 YÊU CẦU:\n" +
                                "• Chỉ chứa chữ cái tiếng Anh\n" +
                                "• Viết HOA tất cả\n" +
                                "• Không dấu, không số, không ký tự đặc biệt\n\n" +
                                "✅ VÍ DỤ ĐÚNG:\n" +
                                "• NGUYEN VAN A\n" +
                                "• TRAN THI B\n" +
                                "• LE MINH C\n\n" +
                                "💡 Sửa lại tên theo định dạng trên!",
                                threadID, messageID
                            );
                        }
                        
                        // Danh sách ngân hàng được hỗ trợ
                        const supportedBanks = [
                            'vietcombank', 'techcombank', 'bidv', 'vietinbank', 
                            'agribank', 'sacombank', 'mbbank', 'vpbank', 
                            'tpbank', 'acb', 'hdbank', 'shb', 'eximbank',
                            'oceanbank', 'namabank', 'pgbank', 'kienlongbank'
                        ];
                        
                        if (!supportedBanks.includes(bankName.toLowerCase())) {
                            return api.sendMessage(
                                "❌ Ngân hàng không được hỗ trợ!\n\n" +
                                "🏧 NGÂN HÀNG HỖ TRỢ:\n" +
                                "• Vietcombank, Techcombank, BIDV\n" +
                                "• VietinBank, Agribank, Sacombank\n" +
                                "• MBBank, VPBank, TPBank, ACB\n" +
                                "• HDBank, SHB, Eximbank\n" +
                                "• OceanBank, NamABank, PGBank\n\n" +
                                "💡 Chọn một trong các ngân hàng trên!",
                                threadID, messageID
                            );
                        }
                        
                        // Lưu thông tin tạm thời và đặt thời gian hết hạn
                        const data = loadMiningData();
                        data[senderID].bankAccount = {
                            bankName: bankName.toUpperCase(),
                            accountNumber: accountNumber,
                            accountName: accountName,
                            linked: false,
                            tempCreatedAt: Date.now(),
                            expiresAt: Date.now() + (60 * 1000) // Hết hạn sau 60 giây
                        };
                        saveMiningData(data);
                        
                        // Xác nhận liên kết với cảnh báo nghiêm trọng
                        return api.sendMessage(
                            "⚠️ XÁC NHẬN LIÊN KẾT NGÂN HÀNG ⚠️\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "📋 THÔNG TIN LIÊN KẾT:\n" +
                            `🏧 Ngân hàng: ${bankName.toUpperCase()}\n` +
                            `💳 Số tài khoản: ${accountNumber}\n` +
                            `👤 Chủ tài khoản: ${accountName}\n\n` +
                            "🚨 CẢNH BÁO NGHIÊM TRỌNG:\n" +
                            "• Đây là thao tác KHÔNG THỂ HOÀN TÁC\n" +
                            "• Sau khi xác nhận, KHÔNG THỂ sửa đổi\n" +
                            "• Thông tin sai sẽ gây mất tiền khi rút\n" +
                            "• Kiểm tra KỸ LƯỠNG trước khi xác nhận\n\n" +
                            "✅ Gõ: .coin bank confirm - để xác nhận\n" +
                            "❌ Gõ: .coin bank cancel - để hủy bỏ\n\n" +
                            "⏰ Lệnh xác nhận có hiệu lực trong 60 giây!\n" +
                            `⏳ Hết hạn lúc: ${new Date(Date.now() + 60000).toLocaleTimeString()}`,
                            threadID, messageID
                        );
                        
                    } else if (subAction === "confirm") {
                        // Kiểm tra xem có thông tin tạm thời không và còn hiệu lực không
                        if (!user.bankAccount || user.bankAccount.linked) {
                            return api.sendMessage(
                                "❌ Không có thông tin liên kết nào đang chờ xác nhận!\n\n" +
                                "💡 Sử dụng: .mining bank link [thông tin] để bắt đầu liên kết",
                                threadID, messageID
                            );
                        }
                        
                        // Kiểm tra thời gian hết hạn
                        if (Date.now() > user.bankAccount.expiresAt) {
                            // Xóa thông tin đã hết hạn
                            const data = loadMiningData();
                            delete data[senderID].bankAccount;
                            saveMiningData(data);
                            
                            return api.sendMessage(
                                "⏰ Thông tin liên kết đã hết hạn!\n\n" +
                                "❌ Phiên xác nhận đã quá 60 giây\n" +
                                "💡 Vui lòng tạo lại liên kết bằng:\n" +
                                ".coin bank link [thông tin ngân hàng]",
                                threadID, messageID
                            );
                        }
                        
                        // Lưu thông tin ngân hàng vĩnh viễn
                        const data = loadMiningData();
                        data[senderID].bankAccount = {
                            bankName: user.bankAccount.bankName,
                            accountNumber: user.bankAccount.accountNumber,
                            accountName: user.bankAccount.accountName,
                            linked: true,
                            linkedAt: Date.now(),
                            securityHash: `${senderID}_${Date.now()}_${Math.random()}`.toString().hashCode ? `${senderID}_${Date.now()}_${Math.random()}`.toString().hashCode() : `${senderID}_${Date.now()}`
                        };
                        
                        saveMiningData(data);
                        
                        return api.sendMessage(
                            "✅ LIÊN KẾT NGÂN HÀNG THÀNH CÔNG! ✅\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "🎉 Chúc mừng! Tài khoản của bạn đã được liên kết thành công\n\n" +
                            "📋 THÔNG TIN ĐÃ LƯU:\n" +
                            `🏧 Ngân hàng: ${data[senderID].bankAccount.bankName}\n` +
                            `💳 Số tài khoản: ${data[senderID].bankAccount.accountNumber}\n` +
                            `👤 Chủ tài khoản: ${data[senderID].bankAccount.accountName}\n` +
                            `🔒 Mã bảo mật: ${data[senderID].bankAccount.securityHash}\n\n` +
                            "✨ TÍNH NĂNG MỚI:\n" +
                            "• Rút tiền trực tiếp về ngân hàng\n" +
                            "• Giao dịch tự động và an toàn\n" +
                            "• Không cần nhập lại thông tin\n\n" +
                            "🔐 BẢO MẬT TUYỆT ĐỐI:\n" +
                            "• Thông tin được mã hóa\n" +
                            "• Không thể thay đổi\n" +
                            "• Chỉ bạn mới có thể rút tiền\n\n" +
                            "🎯 Sử dụng: .coin rút [số tiền] để rút tiền!",
                            threadID, messageID
                        );
                        
                    } else if (subAction === "cancel") {
                        const data = loadMiningData();
                        if (data[senderID].bankAccount && !data[senderID].bankAccount.linked) {
                            delete data[senderID].bankAccount;
                            saveMiningData(data);
                            
                            return api.sendMessage(
                                "❌ Đã hủy bỏ liên kết ngân hàng!\n\n" +
                                "💡 Bạn có thể thử lại bất cứ lúc nào bằng:\n" +
                                ".coin bank link [thông tin ngân hàng]",
                                threadID, messageID
                            );
                        } else {
                            return api.sendMessage(
                                "❌ Không có thông tin liên kết nào để hủy!",
                                threadID, messageID
                            );
                        }
                        
                    } else if (subAction === "info") {
                        if (!user.bankAccount || !user.bankAccount.linked) {
                            return api.sendMessage(
                                "❌ Bạn chưa liên kết ngân hàng!\n\n" +
                                "💡 Sử dụng: .coin bank link [thông tin] để liên kết",
                                threadID, messageID
                            );
                        }
                        
                        return api.sendMessage(
                            "🏦 THÔNG TIN NGÂN HÀNG 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            `🏧 Ngân hàng: ${user.bankAccount.bankName}\n` +
                            `💳 Số tài khoản: ${user.bankAccount.accountNumber.replace(/(.{4})/g, '$1 ')}\n` +
                            `👤 Chủ tài khoản: ${user.bankAccount.accountName}\n` +
                            `📅 Liên kết lúc: ${new Date(user.bankAccount.linkedAt).toLocaleString()}\n` +
                            `🔒 Trạng thái: Đã xác thực\n\n` +
                            "✅ TÍNH NĂNG:\n" +
                            "• Rút tiền tự động về tài khoản\n" +
                            "• Bảo mật tuyệt đối\n" +
                            "• Giao dịch nhanh chóng\n\n" +
                            "💡 Sử dụng: .coin rút [số tiền]",
                            threadID, messageID
                        );
                        
                    } else {
                        return api.sendMessage(
                            "🏦 HỆ THỐNG NGÂN HÀNG 🏦\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "📝 LỆNH:\n" +
                            "• .coin bank link - Liên kết ngân hàng\n" +
                            "• .coin bank info - Xem thông tin\n" +
                            "• .coin bank confirm - Xác nhận liên kết\n" +
                            "• .coin bank cancel - Hủy liên kết\n\n" +
                            "🎯 MỤC ĐÍCH:\n" +
                            "• Rút tiền trực tiếp về ngân hàng\n" +
                            "• Tự động hóa giao dịch\n" +
                            "• Tăng tính bảo mật\n\n" +
                            "⚠️ LƯU Ý:\n" +
                            "• Chỉ liên kết được 1 lần duy nhất\n" +
                            "• Không thể sửa đổi sau khi xác nhận\n" +
                            "• Nhập thông tin chính xác\n" +
                            "• Xác nhận trong vòng 60 giây\n\n" +
                            "🔒 Bảo mật cao - Thuận tiện tối đa!",
                            threadID, messageID
                        );
                    }
                    break;
                }
                
                case "withdraw":
                case "rút":
                case "rut": {
                    const amount = parseInt(target[1]);
                    
                    if (!amount || amount <= 0) {
                        return api.sendMessage(
                            "💰 RÚT TIỀN MINING 💰\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "📝 CÁCH SỬ DỤNG:\n" +
                            ".coin withdraw [số tiền]\n" +
                            ".coin rút [số tiền]\n\n" +
                            "📋 VÍ DỤ:\n" +
                            ".coin withdraw 50000\n" +
                            ".coin rút 100000\n\n" +
                            "⚠️ YÊU CẦU:\n" +
                            `• Số tiền tối thiểu: ${MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT.toLocaleString()} coins\n` +
                            `• Phí rút tiền: ${(MINING_CONFIG.FEES.WITHDRAWAL_FEE * 100)}%\n` +
                            `• Giới hạn/ngày: ${MINING_CONFIG.WITHDRAWAL.DAILY_LIMIT.toLocaleString()} coins\n` +
                            `• VIP Gold: x2 giới hạn\n\n` +
                            "🏦 LƯU Ý:\n" +
                            "• Cần liên kết ngân hàng trước: .mining bank\n" +
                            "• Tiền sẽ được chuyển trong 24h\n" +
                            "• Kiểm tra thông tin ngân hàng cẩn thận\n\n" +
                            `💎 Số dư hiện tại: ${getMiningBalance(senderID).toLocaleString()} coins`,
                            threadID, messageID
                        );
                    }
                    
                    // Kiểm tra đã liên kết ngân hàng chưa
                    if (!user.bankAccount || !user.bankAccount.linked) {
                        return api.sendMessage(
                            "❌ CHƯA LIÊN KẾT NGÂN HÀNG!\n\n" +
                            "🏦 Bạn cần liên kết ngân hàng trước khi rút tiền\n\n" +
                            "📝 HƯỚNG DẪN:\n" +
                            "1. .coin bank link [ngân hàng] [số TK] [tên chủ TK]\n" +
                            "2. .coin bank confirm\n" +
                            "3. .coin withdraw [số tiền]\n\n" +
                            "💡 Ví dụ liên kết:\n" +
                            ".coin bank link Vietcombank 1234567890 NGUYEN VAN A",
                            threadID, messageID
                        );
                    }
                    
                    // Xử lý rút tiền
                    const withdrawResult = processWithdrawal(senderID, amount);
                    
                    if (!withdrawResult.success) {
                        return api.sendMessage(withdrawResult.message, threadID, messageID);
                    }
                    
                    // Tạo đơn rút tiền
                    const withdrawalOrder = {
                        orderId: `WD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        userId: senderID,
                        userName: userName,
                        amount: amount,
                        actualAmount: withdrawResult.amount,
                        fee: withdrawResult.fee,
                        bankInfo: {
                            bankName: user.bankAccount.bankName,
                            accountNumber: user.bankAccount.accountNumber,
                            accountName: user.bankAccount.accountName
                        },
                        status: 'pending',
                        createdAt: Date.now(),
                        note: `Rút ${amount.toLocaleString()} coins (phí ${withdrawResult.fee.toLocaleString()})`
                    };
                    
                    // Lưu đơn rút tiền
                    const withdrawalFile = path.join(__dirname, './json/withdrawal_orders.json');
                    let withdrawalData = {};
                    
                    try {
                        if (fs.existsSync(withdrawalFile)) {
                            withdrawalData = JSON.parse(fs.readFileSync(withdrawalFile, 'utf8'));
                        }
                    } catch (error) {
                        withdrawalData = {};
                    }
                    
                    withdrawalData[withdrawalOrder.orderId] = withdrawalOrder;
                    fs.writeFileSync(withdrawalFile, JSON.stringify(withdrawalData, null, 2));
                    
                    return api.sendMessage(
                        "✅ TẠO ĐơN RÚT TIỀN THÀNH CÔNG!\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `🆔 Mã đơn: ${withdrawalOrder.orderId}\n` +
                        `💰 Số tiền rút: ${amount.toLocaleString()} coins\n` +
                        `💸 Phí rút: ${withdrawResult.fee.toLocaleString()} coins (${(MINING_CONFIG.FEES.WITHDRAWAL_FEE * 100)}%)\n` +
                        `💎 Thực nhận: ${withdrawResult.amount.toLocaleString()} coins\n\n` +
                        "🏦 THÔNG TIN NGÂN HÀNG:\n" +
                        `🏧 Ngân hàng: ${user.bankAccount.bankName}\n` +
                        `💳 Số TK: ${user.bankAccount.accountNumber}\n` +
                        `👤 Chủ TK: ${user.bankAccount.accountName}\n\n` +
                        "⏰ THỜI GIAN XỬ LÝ:\n" +
                        "• Đơn đã được gửi đến admin\n" +
                        "• Thời gian xử lý: 12-24 giờ\n" +
                        "• Bạn sẽ được thông báo khi hoàn thành\n\n" +
                        `💵 Số dư còn lại: ${withdrawResult.remaining.toLocaleString()} coins\n\n` +
                        "📞 HỖ TRỢ:\n" +
                        "• Liên hệ admin nếu quá 24h chưa nhận được tiền\n" +
                        "• Gửi kèm mã đơn để tra cứu nhanh",
                        threadID, messageID
                    );
                    break;
                }

                // LỆNH ẨN CHO ADMIN - Chỉ admin có thể sử dụng
                case "admin_withdrawal_list": 
                case "awl": {
                    // Kiểm tra quyền admin - chỉ cho phép một số userID cụ thể
                    const adminIds = ['61573427362389', '61573427362389']; // Thay bằng ID admin thực tế
                    
                    if (!adminIds.includes(senderID)) {
                        return api.sendMessage("❌ Lệnh không tồn tại!", threadID, messageID);
                    }
                    
                    const withdrawalFile = path.join(__dirname, './json/withdrawal_orders.json');
                    let withdrawalData = {};
                    
                    try {
                        if (fs.existsSync(withdrawalFile)) {
                            withdrawalData = JSON.parse(fs.readFileSync(withdrawalFile, 'utf8'));
                        }
                    } catch (error) {
                        return api.sendMessage("❌ Không thể đọc dữ liệu đơn rút tiền!", threadID, messageID);
                    }
                    
                    const pendingOrders = Object.values(withdrawalData).filter(order => order.status === 'pending');
                    
                    if (pendingOrders.length === 0) {
                        return api.sendMessage(
                            "📋 DANH SÁCH ĐƠN RÚT TIỀN\n" +
                            "━━━━━━━━━━━━━━━━━━\n\n" +
                            "✅ Không có đơn rút tiền nào đang chờ xử lý\n\n" +
                            "📊 LỆNH ADMIN:\n" +
                            "• .mining awl - Xem danh sách đơn\n" +
                            "• .mining approve [mã đơn] - Duyệt đơn\n" +
                            "• .mining reject [mã đơn] [lý do] - Từ chối đơn",
                            threadID, messageID
                        );
                    }
                    
                    let message = "📋 DANH SÁCH ĐƠN RÚT TIỀN\n";
                    message += "━━━━━━━━━━━━━━━━━━\n\n";
                    message += `🔄 Đang chờ xử lý: ${pendingOrders.length} đơn\n\n`;
                    
                    for (let i = 0; i < Math.min(pendingOrders.length, 10); i++) {
                        const order = pendingOrders[i];
                        const timeAgo = Math.floor((Date.now() - order.createdAt) / (60 * 1000));
                        
                        message += `${i + 1}. 🆔 ${order.orderId}\n`;
                        message += `   👤 ${order.userName} (${order.userId})\n`;
                        message += `   💰 ${order.amount.toLocaleString()} → ${order.actualAmount.toLocaleString()} coins\n`;
                        message += `   🏦 ${order.bankInfo.bankName} - ${order.bankInfo.accountNumber}\n`;
                        message += `   👤 ${order.bankInfo.accountName}\n`;
                        message += `   ⏰ ${timeAgo} phút trước\n\n`;
                    }
                    
                    if (pendingOrders.length > 10) {
                        message += `... và ${pendingOrders.length - 10} đơn khác\n\n`;
                    }
                    
                    message += "📊 LỆNH ADMIN:\n";
                    message += "• .mining approve [mã đơn] - Duyệt đơn\n";
                    message += "• .mining reject [mã đơn] [lý do] - Từ chối đơn\n";
                    message += "• .mining awl - Refresh danh sách";
                    
                    return api.sendMessage(message, threadID, messageID);
                    break;
                }

                case "approve": {
                    const adminIds = ['100004870529456', '100066749404031']; // Thay bằng ID admin thực tế
                    
                    if (!adminIds.includes(senderID)) {
                        return api.sendMessage("❌ Lệnh không tồn tại!", threadID, messageID);
                    }
                    
                    const orderId = target[1];
                    if (!orderId) {
                        return api.sendMessage("❌ Vui lòng nhập mã đơn!\nVí dụ: .mining approve WD1234567890ABC", threadID, messageID);
                    }
                    
                    const withdrawalFile = path.join(__dirname, './json/withdrawal_orders.json');
                    let withdrawalData = {};
                    
                    try {
                        withdrawalData = JSON.parse(fs.readFileSync(withdrawalFile, 'utf8'));
                    } catch (error) {
                        return api.sendMessage("❌ Không thể đọc dữ liệu đơn rút tiền!", threadID, messageID);
                    }
                    
                    if (!withdrawalData[orderId]) {
                        return api.sendMessage("❌ Không tìm thấy đơn rút tiền với mã này!", threadID, messageID);
                    }
                    
                    const order = withdrawalData[orderId];
                    
                    if (order.status !== 'pending') {
                        return api.sendMessage(`❌ Đơn này đã được xử lý trước đó (${order.status})!`, threadID, messageID);
                    }
                    
                    // Cập nhật trạng thái đơn
                    order.status = 'approved';
                    order.approvedAt = Date.now();
                    order.approvedBy = senderID;
                    
                    fs.writeFileSync(withdrawalFile, JSON.stringify(withdrawalData, null, 2));
                    
                    // Thông báo cho user
                    api.sendMessage(
                        "✅ ĐƠN RÚT TIỀN ĐÃ ĐƯỢC DUYỆT!\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `🆔 Mã đơn: ${orderId}\n` +
                        `💰 Số tiền: ${order.actualAmount.toLocaleString()} VND\n` +
                        `🏦 Ngân hàng: ${order.bankInfo.bankName}\n` +
                        `💳 Số TK: ${order.bankInfo.accountNumber}\n` +
                        `👤 Chủ TK: ${order.bankInfo.accountName}\n\n` +
                        "💡 Tiền sẽ được chuyển trong vòng 1-2 giờ tới\n" +
                        "📞 Liên hệ admin nếu không nhận được tiền",
                        order.userId
                    );
                    
                    return api.sendMessage(
                        `✅ ĐÃ DUYỆT ĐƠN RÚT TIỀN!\n\n` +
                        `🆔 Mã đơn: ${orderId}\n` +
                        `👤 User: ${order.userName}\n` +
                        `💰 Số tiền: ${order.actualAmount.toLocaleString()} VND\n` +
                        `🏦 ${order.bankInfo.bankName} - ${order.bankInfo.accountNumber}\n` +
                        `👤 ${order.bankInfo.accountName}\n\n` +
                        `⏰ Đã thông báo cho user`,
                        threadID, messageID
                    );
                    break;
                }

                case "reject": {
                    const adminIds = ['100004870529456', '100066749404031']; // Thay bằng ID admin thực tế
                    
                    if (!adminIds.includes(senderID)) {
                        return api.sendMessage("❌ Lệnh không tồn tại!", threadID, messageID);
                    }
                    
                    const orderId = target[1];
                    const reason = target.slice(2).join(" ");
                    
                    if (!orderId || !reason) {
                        return api.sendMessage(
                            "❌ Thiếu thông tin!\n\n" +
                            "📝 Cách sử dụng:\n" +
                            ".mining reject [mã đơn] [lý do từ chối]\n\n" +
                            "💡 Ví dụ:\n" +
                            ".mining reject WD1234567890ABC Thông tin ngân hàng không chính xác",
                            threadID, messageID
                        );
                    }
                    
                    const withdrawalFile = path.join(__dirname, './json/withdrawal_orders.json');
                    let withdrawalData = {};
                    
                    try {
                        withdrawalData = JSON.parse(fs.readFileSync(withdrawalFile, 'utf8'));
                    } catch (error) {
                        return api.sendMessage("❌ Không thể đọc dữ liệu đơn rút tiền!", threadID, messageID);
                    }
                    
                    if (!withdrawalData[orderId]) {
                        return api.sendMessage("❌ Không tìm thấy đơn rút tiền với mã này!", threadID, messageID);
                    }
                    
                    const order = withdrawalData[orderId];
                    
                    if (order.status !== 'pending') {
                        return api.sendMessage(`❌ Đơn này đã được xử lý trước đó (${order.status})!`, threadID, messageID);
                    }
                    
                    // Hoàn lại tiền cho user
                    updateMiningBalance(order.userId, order.amount);
                    
                    // Cập nhật trạng thái đơn
                    order.status = 'rejected';
                    order.rejectedAt = Date.now();
                    order.rejectedBy = senderID;
                    order.rejectReason = reason;
                    
                    fs.writeFileSync(withdrawalFile, JSON.stringify(withdrawalData, null, 2));
                    
                    // Thông báo cho user
                    api.sendMessage(
                        "❌ ĐƠN RÚT TIỀN BỊ TỪ CHỐI!\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `🆔 Mã đơn: ${orderId}\n` +
                        `💰 Số tiền: ${order.amount.toLocaleString()} coins\n\n` +
                        `📝 Lý do từ chối: ${reason}\n\n` +
                        "💡 HƯỚNG DẪN:\n" +
                        "• Số tiền đã được hoàn lại vào tài khoản\n" +
                        "• Kiểm tra lại thông tin ngân hàng\n" +
                        "• Liên hệ admin để được hỗ trợ\n" +
                        "• Có thể tạo đơn rút tiền mới sau khi khắc phục",
                        order.userId
                    );
                    
                    return api.sendMessage(
                        `❌ ĐÃ TỪ CHỐI ĐƠN RÚT TIỀN!\n\n` +
                        `🆔 Mã đơn: ${orderId}\n` +
                        `👤 User: ${order.userName}\n` +
                        `💰 Đã hoàn: ${order.amount.toLocaleString()} coins\n` +
                        `📝 Lý do: ${reason}\n\n` +
                        `⏰ Đã thông báo cho user`,
                        threadID, messageID
                    );
                    break;
                }

                default: {
                    const accountAge = Date.now() - user.createdAt;
                    const daysOld = Math.floor(accountAge / (24 * 60 * 60 * 1000));
                    let newbieInfo = "";
                    
                    if (daysOld <= 10) {
                        newbieInfo = `\n🆕 NEWBIE BONUS (${10 - daysOld} ngày còn lại):\n🔸 x${MINING_CONFIG.NEWBIE_BONUS.FIRST_WEEK_MULTIPLIER} coins khi đào!\n🔸 Daily login: +${MINING_CONFIG.NEWBIE_BONUS.DAILY_LOGIN_BONUS} coins\n`;
                    }
                    
                    return api.sendMessage(
                        "⛏️ MMO MINING GAME ⛏️\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "🎮 LỆNH CƠ BẢN:\n" +
                        "• .coin mine - Đào coin\n" +
                        "• .coin rút - Rút tiền\n" +
                        "• .coin stats - Xem thống kê\n" +
                        "• .coin help - Hướng dẫn chi tiết\n" +
                        "• .coin quests - Nhiệm vụ hàng ngày\n" +
                        "• .coin bank - Liên kết ngân hàng\n" +
                        "• .coin auto - Auto mining\n" +
                        "• .coin team - Hệ thống team\n" +
                        "• .coin shop - Cửa hàng\n" +
                        "• .coin leaderboard - Bảng xếp hạng\n\n" +
                        "🎁 HỆ THỐNG HẤP DẪN:\n" +
                        `🔸 Tặng ngay: ${MINING_CONFIG.NEWBIE_BONUS.WELCOME_BONUS.toLocaleString()} coins\n` +
                        `🔸 Miễn phí: ${MINING_CONFIG.DAILY_MINING.FREE_LIMIT} lượt đào/ngày\n` +
                        `🔸 Đào thêm: ${MINING_CONFIG.DAILY_MINING.EXTRA_COST} coins/lần\n` +
                        `🔸 Phí rút tiền: ${(MINING_CONFIG.FEES.WITHDRAWAL_FEE * 100)}%\n` +
                        `🔸 Rút tối thiểu: ${MINING_CONFIG.WITHDRAWAL.MIN_AMOUNT.toLocaleString()} coins\n` +
                        `🔸 Cooldown: chỉ ${MINING_CONFIG.COOLDOWN/1000}s\n` +
                        newbieInfo +
                        "\n👑 VIP GOLD (49k/tháng):\n" +
                        `🎯 ${MINING_CONFIG.DAILY_MINING.VIP_LIMIT} lượt đào/ngày\n` +
                        "🎯 +80% mining bonus\n" +
                        "🎯 +100% giới hạn rút tiền\n" +
                        "🎯 Giảm phí auto mining\n\n" +
                        "💰 THU NHẬP THỰC TẾ:\n" +
                        "🆓 Free: ~90 coins/ngày → Rút sau 89 ngày\n" +
                        "👑 VIP: ~775 coins/ngày → Rút sau 10 ngày\n\n" +
                        "⭐ Hệ thống hấp dẫn - ROI rõ ràng!",
                        threadID, messageID
                    );
                }
            }
        } catch (error) {
            console.error('Mining error:', error);
            return api.sendMessage("❌ Có lỗi xảy ra trong hệ thống mining!", threadID, messageID);
        }
    }
};
