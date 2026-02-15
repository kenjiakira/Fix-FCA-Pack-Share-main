const fs = require('fs');
const path = require('path');
const { updateBalance, updateQuestProgress } = require('../utils/currencies');
const { createUserData } = require('../utils/userData');
const { getVIPBenefits } = require('../game/vip/vipCheck');
const { getUserName } = require('../utils/userUtils');
const { applyWorkTax, getWorkTaxRate, addToTaxFund, isTaxExempt } = require('../utils/tax');

const HAIBONG_DATA_PATH = path.join(__dirname, '../database/json/haibong_data.json');

const CONFIG = {
    BASE_COOLDOWN_MS: 30 * 60 * 1000,
    DAILY_LIMIT: 12,
    VIP_DAILY_LIMIT: 18,
    VIP_COOLDOWN_REDUCTION: 0.25,
    VIP_PAY_BONUS: 0.3,
};

const JOB = { id: 'cotton_picker', name: 'Hái bông', minPay: 7000, maxPay: 20000, emoji: '🌸' };

const EVENTS = [
    { id: 'normal', multiplier: 1, chance: 0.7, message: 'Hái bông xong, thu hoạch ổn!' },
    { id: 'overtime', multiplier: 1.25, chance: 0.15, message: 'Hái thêm giờ, bông nhiều hơn!' },
    { id: 'sick', multiplier: 0, chance: 0.1, message: 'Trời nắng quá... không hái được gì.' },
    { id: 'bonus_task', multiplier: 1.5, chance: 0.05, message: 'Ruộng bông trúng mùa!' },
];

function loadHaibongData() {
    try {
        const dir = path.dirname(HAIBONG_DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(HAIBONG_DATA_PATH)) {
            return JSON.parse(fs.readFileSync(HAIBONG_DATA_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading haibong data:', e);
    }
    return { users: {}, lastReset: Date.now() };
}

function saveHaibongData(data) {
    try {
        fs.writeFileSync(HAIBONG_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving haibong data:', e);
    }
}

function getUserHaibongData(userId) {
    const data = loadHaibongData();
    const today = new Date().toDateString();

    if (data.lastReset && new Date(data.lastReset).toDateString() !== today) {
        data.users = {};
        data.lastReset = Date.now();
        saveHaibongData(data);
    }

    if (!data.users[userId]) {
        data.users[userId] = {
            lastWork: 0,
            dailyCount: 0,
            lastResetDate: today,
        };
    }

    const user = data.users[userId];
    if (user.lastResetDate !== today) {
        user.dailyCount = 0;
        user.lastResetDate = today;
    }

    return { data, user };
}

function getUserLevel(userId) {
    try {
        const rankPath = path.join(__dirname, '../database/rankData.json');
        if (!fs.existsSync(rankPath)) return 1;
        const rankData = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
        return Math.max(1, rankData[userId]?.level || 1);
    } catch {
        return 1;
    }
}

function selectEvent() {
    const rand = Math.random();
    let acc = 0;
    for (const evt of EVENTS) {
        acc += evt.chance;
        if (rand <= acc) return evt;
    }
    return EVENTS[0];
}

function formatDuration(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);
    return parts.join(' ');
}

module.exports = {
    name: "haibong",
    dev: "HNT",
    category: "Games",
    info: "Hái bông kiếm tiền",
    onPrefix: true,
    usages: "haibong - Hái bông | haibong check - Xem lượt còn lại",
    cooldowns: 0,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const cmd = (target[0] || '').toLowerCase();

        try {
            await createUserData(senderID);
        } catch (error) {
            return api.sendMessage("❌ Có lỗi xảy ra khi tạo dữ liệu người dùng!", threadID, messageID);
        }

        const vipBenefits = getVIPBenefits(senderID);
        const cooldownReduction = vipBenefits?.packageId === 3 ? CONFIG.VIP_COOLDOWN_REDUCTION : 0;
        const dailyLimit = vipBenefits?.packageId === 3 ? CONFIG.VIP_DAILY_LIMIT : CONFIG.DAILY_LIMIT;
        const baseCooldown = Math.floor(CONFIG.BASE_COOLDOWN_MS * (1 - cooldownReduction));

        const { data, user } = getUserHaibongData(senderID);

        if (cmd === 'check') {
            const remaining = dailyLimit - user.dailyCount;
            const nextWork = user.lastWork + baseCooldown;
            const now = Date.now();

            let msg = `『 HÁI BÔNG - CHECK 』\n\n`;
            msg += `👤 ${getUserName(senderID)}\n`;
            msg += `🌸 Công việc: Hái bông\n`;
            msg += `📋 Lượt hái bông còn lại hôm nay: ${remaining}/${dailyLimit}\n`;
            if (remaining <= 0) {
                msg += `⏰ Đã hết lượt hái bông, quay lại vào ngày mai!\n`;
            } else if (now < nextWork) {
                msg += `⏳ Cooldown: còn ${formatDuration(nextWork - now)}\n`;
            } else {
                msg += `✅ Sẵn sàng hái bông! Gõ .haibong để bắt đầu.\n`;
            }
            if (vipBenefits?.packageId === 3) {
                msg += `\n👑 VIP: Giảm cooldown, tăng lượt/ngày!`;
            }

            return api.sendMessage(msg, threadID, messageID);
        }

        const now = Date.now();
        const nextWork = user.lastWork + baseCooldown;

        if (user.dailyCount >= dailyLimit) {
            return api.sendMessage(
                `⏰ Bạn đã dùng hết ${dailyLimit} lượt hái bông hôm nay!\n` +
                `💡 Quay lại vào ngày mai. (VIP: tối đa ${CONFIG.VIP_DAILY_LIMIT} lượt/ngày)`,
                threadID,
                messageID
            );
        }

        if (now < nextWork) {
            return api.sendMessage(
                `⏳ Bạn cần nghỉ ${formatDuration(nextWork - now)} nữa mới hái bông tiếp!\n` +
                `💡 Gõ .haibong check để xem thông tin.`,
                threadID,
                messageID
            );
        }

        const evt = selectEvent();

        let basePay = 0;
        if (evt.multiplier > 0) {
            basePay = Math.floor(
                (Math.random() * (JOB.maxPay - JOB.minPay + 1) + JOB.minPay) * evt.multiplier
            );
        }

        const level = getUserLevel(senderID);
        const levelBonus = 1 + (level - 1) * 0.05;
        const payWithLevel = Math.floor(basePay * levelBonus);

        const vipPayBonus = vipBenefits?.packageId === 3 ? CONFIG.VIP_PAY_BONUS : 0;
        const grossPay = Math.floor(payWithLevel * (1 + vipPayBonus));
        const { netPay: finalPay, taxAmount } = applyWorkTax(grossPay, senderID);

        if (finalPay > 0) {
            updateBalance(senderID, finalPay);
        }
        if (taxAmount > 0) {
            addToTaxFund(taxAmount);
        }
        updateQuestProgress(senderID, "work");

        user.lastWork = now;
        user.dailyCount = (user.dailyCount || 0) + 1;
        saveHaibongData(data);

        let message = `『 HÁI BÔNG 』\n\n`;
        message += `${JOB.emoji} Công việc: ${JOB.name}\n`;
        message += `📌 Sự kiện: ${evt.message}\n\n`;

        if (finalPay > 0 || grossPay > 0) {
            if (taxAmount > 0) {
                message += `💰 Thu nhập gộp: ${grossPay.toLocaleString('vi-VN')} $\n`;
                message += `📉 Thuế (${getWorkTaxRate()}%): -${taxAmount.toLocaleString('vi-VN')} $\n`;
                message += `💵 Thực nhận: ${finalPay.toLocaleString('vi-VN')} $\n`;
            } else {
                message += `💰 Kiếm được: ${finalPay.toLocaleString('vi-VN')} $\n`;
                if (grossPay > 0 && isTaxExempt(senderID)) message += `🏛️ Miễn thuế\n`;
            }
            if (level > 1) message += `📈 Bonus cấp ${level}: +${Math.floor((levelBonus - 1) * 100)}%\n`;
            if (vipPayBonus > 0) message += `👑 Bonus VIP: +${Math.floor(vipPayBonus * 100)}%\n`;
        } else {
            message += `😷 Hôm nay không hái được gì.\n`;
        }

        message += `\n📋 Lượt còn lại: ${dailyLimit - user.dailyCount}/${dailyLimit}`;
        const nextIn = formatDuration(baseCooldown);
        message += `\n⏳ Hái tiếp sau: ${nextIn}`;

        return api.sendMessage(message, threadID, messageID);
    },
};
