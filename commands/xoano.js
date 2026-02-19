const fs = require('fs');
const path = require('path');
const { getBalance, setBalance, updateBalance } = require('../utils/currencies');
const { getWorkTaxRate } = require('../utils/tax');
const { getUserName } = require('../utils/userUtils');

const XOANO_DEBTS_PATH = path.join(__dirname, '../database/json/xoano_debts.json');

const XOANO_PENALTY_GRACE_DAYS = 3;
const XOANO_PENALTY_RATE = 0.02;

function getPenaltyAmount(debt) {
    const interest = debt.interest || 0;
    if (interest <= 0) return 0;
    const createdAt = debt.createdAt || Date.now();
    const daysSinceCreation = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
    const daysOverdue = Math.max(0, daysSinceCreation - XOANO_PENALTY_GRACE_DAYS);
    return Math.ceil(interest * XOANO_PENALTY_RATE * daysOverdue);
}

function loadXoanoDebts() {
    try {
        const dir = path.dirname(XOANO_DEBTS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(XOANO_DEBTS_PATH)) {
            return JSON.parse(fs.readFileSync(XOANO_DEBTS_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading xoano debts:', e);
    }
    return { users: {} };
}

function saveXoanoDebts(data) {
    try {
        const dir = path.dirname(XOANO_DEBTS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(XOANO_DEBTS_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving xoano debts:', e);
    }
}

function formatNumber(n) {
    return Math.floor(n).toLocaleString('vi-VN');
}

module.exports = {
    name: 'xoano',
    dev: 'HNT',
    category: 'Tài Chính',
    info: 'Xóa nợ âm tiền (đưa về 0), sau đó người dùng phải trả với lãi theo thuế',
    onPrefix: true,
    usages: '.xoano - Tự xóa nợ âm | .xoano check - Xem nợ | .xoano trano [số $] - Trả nợ | .xoano list - Danh sách nợ | .xoano clearall (admin) - Xóa nợ tất cả',
    cooldowns: 5,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const cmd = (target[0] || '').toLowerCase();

        if (!cmd) {
            const balance = getBalance(senderID);
            if (balance >= 0) {
                const isAdmin = global.cc?.adminBot?.includes(senderID);
                let msg = '🏚️ XÓA NỢ\n━━━━━━━━\n\n';
                msg += `✅ Bạn không âm tiền. Số dư hiện tại: ${formatNumber(balance)} $\n\n`;
                msg += '• Gõ .xoano khi số dư âm để tự đưa về 0 (sau đó trả với lãi theo thuế)\n';
                msg += '• .xoano check - Xem khoản nợ xoano\n';
                msg += '• .xoano trano [số $] - Trả nợ\n';
                msg += '• .xoano list - Danh sách người đang nợ';
                if (isAdmin) msg += '\n• .xoano clearall - Xóa nợ tất cả (admin)';
                return api.sendMessage(msg, threadID, messageID);
            }
            const debts = loadXoanoDebts();
            const existingDebt = debts.users?.[senderID];
            if (existingDebt && existingDebt.remaining > 0) {
                const penalty = getPenaltyAmount(existingDebt);
                const penaltyPaid = existingDebt.penaltyPaid || 0;
                const penaltyOwed = Math.max(0, penalty - penaltyPaid);
                const effectiveRemaining = existingDebt.remaining + penaltyOwed;
                return api.sendMessage(
                    `❌ Bạn đang có khoản nợ xoano chưa trả hết.\n💰 Còn nợ gốc+lãi: ${formatNumber(existingDebt.remaining)} $\n⚠️ Phạt trễ hạn (${XOANO_PENALTY_RATE * 100}% lãi/ngày): ${formatNumber(penaltyOwed)} $\n💳 Tổng còn: ${formatNumber(effectiveRemaining)} $\n\n💡 Chỉ được xóa nợ mới khi đã trả hết. Dùng .xoano trano [số $] để trả nợ.`,
                    threadID,
                    messageID
                );
            }
            const principal = Math.abs(balance);
            const rate = getWorkTaxRate() / 100;
            const interest = Math.ceil(principal * rate);
            const total = principal + interest;
            setBalance(senderID, 0);
            if (!debts.users) debts.users = {};
            debts.users[senderID] = {
                principal,
                interest,
                total,
                paid: 0,
                remaining: total,
                createdAt: Date.now(),
            };
            saveXoanoDebts(debts);
            const msg = `✅ ĐÃ TỰ XÓA NỢ\n━━━━━━━━\n👤 ${getUserName(senderID)}\n💰 Số dư âm đã đưa về: 0 $\n📊 Gốc: ${formatNumber(principal)} $\n📈 Lãi (${getWorkTaxRate()}%): ${formatNumber(interest)} $\n💳 Tổng phải trả: ${formatNumber(total)} $\n\n⚠️ Phạt trễ hạn: ${XOANO_PENALTY_RATE * 100}% lãi/ngày (sau ${XOANO_PENALTY_GRACE_DAYS} ngày grace).\n💡 Dùng .xoano trano [số $] để trả dần.`;
            return api.sendMessage(msg, threadID, messageID);
        }

        if (cmd === 'check') {
            const debts = loadXoanoDebts();
            const debt = debts.users[senderID];
            if (!debt || debt.remaining <= 0) {
                return api.sendMessage('✅ Bạn không có khoản nợ nào.', threadID, messageID);
            }
            const penalty = getPenaltyAmount(debt);
            const penaltyPaid = debt.penaltyPaid || 0;
            const penaltyOwed = Math.max(0, penalty - penaltyPaid);
            const effectiveRemaining = debt.remaining + penaltyOwed;
            let msg = `📋 KHOẢN NỢ\n━━━━━━━━━\n👤 ${getUserName(senderID)}\n💰 Gốc+lãi còn: ${formatNumber(debt.remaining)} $\n`;
            if (penaltyOwed > 0) {
                msg += `⚠️ Phạt trễ hạn (${XOANO_PENALTY_RATE * 100}% lãi/ngày, grace ${XOANO_PENALTY_GRACE_DAYS} ngày): ${formatNumber(penaltyOwed)} $\n`;
            }
            msg += `💳 Tổng còn: ${formatNumber(effectiveRemaining)} $\n\n💡 Gõ .xoano trano [số $] để trả nợ.`;
            return api.sendMessage(msg, threadID, messageID);
        }

        if (cmd === 'trano') {
            const debts = loadXoanoDebts();
            const debt = debts.users[senderID];
            if (!debt || debt.remaining <= 0) {
                return api.sendMessage('✅ Bạn không có khoản nợ nào.', threadID, messageID);
            }
            const penalty = getPenaltyAmount(debt);
            const penaltyPaid = debt.penaltyPaid || 0;
            const penaltyOwed = Math.max(0, penalty - penaltyPaid);
            const effectiveRemaining = debt.remaining + penaltyOwed;
            const amount = Math.floor(Number(target[1])) || Math.ceil(effectiveRemaining);
            if (amount <= 0) {
                return api.sendMessage('❌ Số tiền trả phải lớn hơn 0.', threadID, messageID);
            }
            const wallet = getBalance(senderID);
            const pay = Math.min(amount, effectiveRemaining, Math.max(0, wallet));
            if (pay <= 0) {
                return api.sendMessage(`❌ Số dư ví không đủ (hiện có ${formatNumber(wallet)} $). Cần ít nhất 1 $ để trả nợ.`, threadID, messageID);
            }
            updateBalance(senderID, -pay);
            const payToPenalty = Math.min(pay, penaltyOwed);
            const payToBase = pay - payToPenalty;
            debt.paid = (debt.paid || 0) + payToBase;
            debt.remaining = Math.max(0, debt.total - debt.paid);
            debt.penaltyPaid = (debt.penaltyPaid || 0) + payToPenalty;
            const stillPenaltyOwed = Math.max(0, penaltyOwed - payToPenalty);
            if (debt.remaining <= 0 && stillPenaltyOwed <= 0) {
                delete debts.users[senderID];
            }
            saveXoanoDebts(debts);
            const newPenalty = getPenaltyAmount(debt);
            const newPenaltyOwed = Math.max(0, newPenalty - (debt.penaltyPaid || 0));
            const remain = debt.remaining + newPenaltyOwed;
            return api.sendMessage(
                `✅ Đã trả ${formatNumber(pay)} $ vào nợ xoano.\n${remain > 0 ? `⏳ Còn lại: ${formatNumber(remain)} $` : '🎉 Đã trả hết nợ xoano!'}`,
                threadID,
                messageID
            );
        }

        if (cmd === 'list') {
            const debts = loadXoanoDebts();
            const entries = Object.entries(debts.users || {}).filter(([, d]) => d && d.remaining > 0);
            if (entries.length === 0) {
                return api.sendMessage('📋 Không có ai đang nợ.', threadID, messageID);
            }
            let msg = '📋 DANH SÁCH NỢ\n━━━━━━━━\n\n';
            entries.forEach(([uid, d], i) => {
                const penalty = getPenaltyAmount(d);
                const penaltyOwed = Math.max(0, penalty - (d.penaltyPaid || 0));
                const effective = d.remaining + penaltyOwed;
                msg += `${i + 1}. ${getUserName(uid)}\n   Còn: ${formatNumber(effective)} $\n\n`;
            });
            return api.sendMessage(msg, threadID, messageID);
        }

        if (cmd === 'clearall') {
            const isAdmin = global.cc?.adminBot?.includes(senderID);
            if (!isAdmin) {
                return api.sendMessage('❌ Chỉ admin mới có thể sử dụng lệnh này!', threadID, messageID);
            }
            const debts = loadXoanoDebts();
            const count = Object.keys(debts.users || {}).length;
            if (count === 0) {
                return api.sendMessage('📋 Không có ai đang nợ.', threadID, messageID);
            }
            saveXoanoDebts({ users: {} });
            return api.sendMessage(`✅ Admin đã xóa tất cả nợ (${count} người).`, threadID, messageID);
        }

        const isAdmin = global.cc?.adminBot?.includes(senderID);
        let msg = '🏚️ XÓA NỢ\n━━━━━━━━\n\n';
        msg += '• .xoano - Tự xóa nợ âm (đưa về 0, trả sau với lãi theo thuế)\n';
        msg += '• .xoano check - Xem khoản nợ\n';
        msg += '• .xoano trano [số $] - Trả nợ\n';
        msg += '• .xoano list - Danh sách người đang nợ';
        if (isAdmin) msg += '\n• .xoano clearall - Xóa nợ tất cả (admin)';
        return api.sendMessage(msg, threadID, messageID);
    },
};
