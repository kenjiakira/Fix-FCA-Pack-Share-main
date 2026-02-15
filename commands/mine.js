const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getBalance, updateBalance } = require('../utils/currencies');
const { createUserData } = require('../utils/userData');
const { getUserName } = require('../utils/userUtils');
const { applyWorkTax, getWorkTaxRate, addToTaxFund, isTaxExempt } = require('../utils/tax');
const { CRYPTO } = require('../utils/api');

const MINE_DATA_PATH = path.join(__dirname, '../database/json/mine_data.json');

const CONFIG = {
    COOLDOWN_MS: 5 * 60 * 1000,
    MAX_RIGS_PER_TYPE: 5,
};

const RIGS = [
    { id: '1', name: 'Máy cũ', price: 80000, incomeBtc: 0.002, emoji: '🖥️' },
    { id: '2', name: 'Máy thường', price: 400000, incomeBtc: 0.01, emoji: '💻' },
    { id: '3', name: 'Máy tốt', price: 1500000, incomeBtc: 0.04, emoji: '🖥️' },
    { id: '4', name: 'Máy xịn', price: 8000000, incomeBtc: 0.2, emoji: '⚙️' },
    { id: '5', name: 'Máy pro', price: 35000000, incomeBtc: 0.8, emoji: '🚀' },
];

const FALLBACK_BTC_USD = 97000; 

function loadMineData() {
    try {
        const dir = path.dirname(MINE_DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(MINE_DATA_PATH)) {
            return JSON.parse(fs.readFileSync(MINE_DATA_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading mine data:', e);
    }
    return { users: {}, basePrice: null };
}

function saveMineData(data) {
    try {
        const dir = path.dirname(MINE_DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(MINE_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving mine data:', e);
    }
}

async function getBtcPrice() {
    try {
        const res = await axios.get(`${CRYPTO.COINGECKO_BASE_URL}/simple/price`, {
            params: {
                ids: 'bitcoin',
                vs_currencies: 'usd',
                include_24h_change: true
            },
            timeout: 5000
        });
        const btc = res.data?.bitcoin;
        if (!btc?.usd) return { price: FALLBACK_BTC_USD, changePercent: 0 };
        return {
            price: btc.usd,
            changePercent: btc.usd_24h_change ?? 0
        };
    } catch (e) {
        console.error('Mine: Error fetching BTC price:', e?.message);
        return { price: FALLBACK_BTC_USD, changePercent: 0 };
    }
}

function getUserRigs(data, userId) {
    if (!data.users[userId]) {
        data.users[userId] = { rigs: {}, lastMine: 0 };
    }
    return data.users[userId];
}

function getTotalBtcMined(rigs) {
    let total = 0;
    for (const [rigId, count] of Object.entries(rigs)) {
        const rig = RIGS.find(r => r.id === rigId);
        if (rig && count > 0 && rig.incomeBtc) total += rig.incomeBtc * count;
    }
    return total;
}

function formatDuration(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const parts = [];
    if (m > 0) parts.push(`${m} phút`);
    if (s > 0 || parts.length === 0) parts.push(`${s} giây`);
    return parts.join(' ');
}

function formatNum(n) {
    return (n || 0).toLocaleString('vi-VN');
}

function formatBtc(btc) {
    if (btc >= 1) return btc % 1 === 0 ? btc.toFixed(0) : btc.toFixed(2);
    if (btc >= 0.01) return btc.toFixed(2);
    if (btc >= 0.0001) return btc.toFixed(4);
    return btc.toFixed(6);
}

module.exports = {
    name: 'mine',
    dev: 'HNT',
    category: 'Games',
    info: 'Đào Bitcoin',
    onPrefix: true,
    usages: 'mine | mine shop | mine buy [id] | mine info',
    cooldowns: 0,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const cmd = (target[0] || '').toLowerCase();
        const arg = (target[1] || '').toLowerCase();

        try {
            await createUserData(senderID);
        } catch (e) {
            return api.sendMessage('❌ Có lỗi khi tạo dữ liệu người dùng!', threadID, messageID);
        }

        const data = loadMineData();
        const user = getUserRigs(data, senderID);

        if (cmd === 'shop') {
            let msg = `『 SHOP MÁY ĐÀO 』\n\n`;
            const myRigs = user.rigs || {};
            for (const rig of RIGS) {
                const owned = myRigs[rig.id] || 0;
                msg += `${rig.emoji} ${rig.id}. ${rig.name}\n`;
                msg += `   💵 Giá: ${formatNum(rig.price)}$ | Thu: ${formatBtc(rig.incomeBtc)} BC/lần (quy đổi theo giá thị trường)\n`;
                msg += `   📦 Đã có: ${owned}/${CONFIG.MAX_RIGS_PER_TYPE}\n\n`;
            }
            msg += `➤ Mua: .mine buy [số]`;
            return api.sendMessage(msg, threadID, messageID);
        }

        if (cmd === 'buy') {
            const rigId = arg || target[1];
            const rig = RIGS.find(r => r.id === String(rigId));
            if (!rig) {
                return api.sendMessage(
                    '❌ ID không hợp lệ! Gõ .mine shop để xem danh sách.',
                    threadID,
                    messageID
                );
            }
            const balance = getBalance(senderID);
            if (balance < rig.price) {
                return api.sendMessage(
                    `❌ Cần ${formatNum(rig.price)}$ để mua ${rig.name}. Số dư: ${formatNum(balance)}$.`,
                    threadID,
                    messageID
                );
            }
            const count = (user.rigs[rig.id] || 0) + 1;
            if (count > CONFIG.MAX_RIGS_PER_TYPE) {
                return api.sendMessage(
                    `❌ Tối đa ${CONFIG.MAX_RIGS_PER_TYPE} máy loại ${rig.name}.`,
                    threadID,
                    messageID
                );
            }
            user.rigs[rig.id] = count;
            updateBalance(senderID, -rig.price);
            saveMineData(data);
            const totalBtc = getTotalBtcMined(user.rigs);
            return api.sendMessage(
                `✅ Đã mua 1 ${rig.name} (${formatNum(rig.price)}$)\n` +
                `📦 Tổng: ${count} ${rig.name} | Thu: ${formatBtc(totalBtc)} BC/lần (quy đổi theo giá BTC)`,
                threadID,
                messageID
            );
        }

        if (cmd === 'info') {
            const rigs = user.rigs || {};
            const totalBtc = getTotalBtcMined(rigs);
            let msg = `『 ĐÀO BITCOIN - INFO 』\n\n`;
            msg += `👤 ${getUserName(senderID)}\n\n`;
            if (Object.keys(rigs).length === 0) {
                msg += `📭 Chưa có máy đào. Gõ .mine shop để mua!\n`;
            } else {
                for (const [rigId, count] of Object.entries(rigs)) {
                    const rig = RIGS.find(r => r.id === rigId);
                    if (rig && count > 0 && rig.incomeBtc) {
                        msg += `${rig.emoji} ${rig.name} x${count} → ${formatBtc(rig.incomeBtc * count)} BC/lần\n`;
                    }
                }
                msg += `\n💰 Tổng đào/lần: ${formatBtc(totalBtc)} BC (quy đổi sang $ theo giá thị trường)\n`;
            }
            const nextMine = user.lastMine + CONFIG.COOLDOWN_MS;
            const now = Date.now();
            if (now < nextMine && totalBtc > 0) {
                msg += `\n⏳ Đào tiếp sau: ${formatDuration(nextMine - now)}`;
            } else if (totalBtc > 0) {
                msg += `\n✅ Sẵn sàng đào! Gõ .mine`;
            }
            return api.sendMessage(msg, threadID, messageID);
        }

        const totalBtc = getTotalBtcMined(user.rigs || {});
        if (totalBtc <= 0) {
            return api.sendMessage(
                '❌ Bạn chưa có máy đào! Gõ .mine shop để mua máy.',
                threadID,
                messageID
            );
        }

        const now = Date.now();
        const nextMine = user.lastMine + CONFIG.COOLDOWN_MS;
        if (now < nextMine) {
            return api.sendMessage(
                `⏳ Đợi thêm ${formatDuration(nextMine - now)} nữa mới đào tiếp!\n💡 .mine info - xem thông tin`,
                threadID,
                messageID
            );
        }

        const { price: btcPriceUsd, changePercent } = await getBtcPrice();
        const usdValue = totalBtc * btcPriceUsd;
        const grossPay = Math.floor(usdValue);

        const { netPay: finalPay, taxAmount } = applyWorkTax(grossPay, senderID);

        if (finalPay > 0) {
            updateBalance(senderID, finalPay);
        }
        if (taxAmount > 0) {
            addToTaxFund(taxAmount);
        }

        user.lastMine = now;
        saveMineData(data);

        const sign = changePercent >= 0 ? '+' : '';
        let msg = `『 ĐÀO BITCOIN 』\n\n`;
        msg += `⛏️ Đào được: ${formatBtc(totalBtc)} BC\n`;
        msg += `📈 Giá BTC: ${formatNum(Math.round(btcPriceUsd))}$ (24h ${sign}${(changePercent ?? 0).toFixed(1)}%)\n`;
        msg += `💰 Quy đổi: ${formatNum(grossPay)}$\n`;
        if (taxAmount > 0) {
            msg += `📉 Thuế (${getWorkTaxRate()}%): -${formatNum(taxAmount)}$\n`;
            msg += `💵 Thực nhận: ${formatNum(finalPay)}$\n`;
        } else {
            msg += `💵 Thực nhận: ${formatNum(finalPay)}$\n`;
            if (isTaxExempt(senderID)) msg += `🏛️ Miễn thuế\n`;
        }
        msg += `\n⏳ Đào tiếp sau: ${formatDuration(CONFIG.COOLDOWN_MS)}`;

        return api.sendMessage(msg, threadID, messageID);
    },
};
