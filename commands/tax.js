const path = require('path');
const fs = require('fs');
const {
    getWorkTaxRate,
    setWorkTaxRate,
    getTaxFund,
    subtractFromTaxFund,
    getTaxExemptList,
    addTaxExempt,
    removeTaxExempt,
} = require('../utils/tax');
const { updateBalance } = require('../utils/currencies');

function formatNumber(num) {
    return Math.floor(num).toLocaleString('vi-VN');
}

function loadAdminData() {
    try {
        const adminPath = path.join(__dirname, '..', 'admin.json');
        if (fs.existsSync(adminPath)) {
            return JSON.parse(fs.readFileSync(adminPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading admin:', e);
    }
    return { adminUIDs: [] };
}

function getFirstMentionOrReply(event) {
    if (event.messageReply?.senderID) return String(event.messageReply.senderID);
    const mentions = event.mentions;
    if (mentions && typeof mentions === 'object' && !Array.isArray(mentions)) {
        const keys = Object.keys(mentions);
        if (keys.length > 0) return String(keys[0]);
    }
    if (Array.isArray(mentions) && mentions[0]) {
        const m = mentions[0];
        return String(m.userId || m.id || m);
    }
    return null;
}

module.exports = {
    name: "tax",
    dev: "HNT",
    category: "Admin",
    info: "Báo cáo & điều hành thuế (Chính phủ)",
    onPrefix: true,
    usages: "tax | tax set rate <1-100> | tax withdraw <số tiền> [@user] | tax exempt list | tax exempt add/remove [@/uid]",
    cooldowns: 10,
    usedby: 2,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;

        const adminData = loadAdminData();
        const adminUIDs = adminData.adminUIDs || [];
        if (!adminUIDs.includes(senderID)) {
            return api.sendMessage("❌ Chỉ Admin mới được truy cập lệnh thuế.", threadID, messageID);
        }

        const cmd = (target[0] || '').toLowerCase();
        const sub = (target[1] || '').toLowerCase();

        if (cmd === 'set' && sub === 'rate') {
            const rateNum = parseInt(target[2], 10);
            if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
                return api.sendMessage("❌ Thuế suất phải từ 0 đến 100. Cú pháp: tax set rate <0-100>", threadID, messageID);
            }
            const prev = getWorkTaxRate();
            setWorkTaxRate(rateNum);
            return api.sendMessage(
                `✅ Đã đặt thuế suất: ${prev}% → ${rateNum}%.\n📌.`,
                threadID,
                messageID
            );
        }

        if (cmd === 'withdraw') {
            const amount = parseInt(target[1], 10);
            if (!amount || amount < 1) {
                return api.sendMessage("❌ Cú pháp: tax withdraw <số tiền> [@user/reply]. Nếu không tag/reply, tiền chuyển vào ví Admin.", threadID, messageID);
            }
            const taxFund = getTaxFund();
            if (amount > taxFund) {
                return api.sendMessage(`❌ Quỹ thuế không đủ. Hiện có: ${formatNumber(taxFund)} $.`, threadID, messageID);
            }
            const recipientID = getFirstMentionOrReply(event) || String(senderID);
            const deducted = subtractFromTaxFund(amount);
            if (deducted > 0) {
                updateBalance(recipientID, deducted);
                return api.sendMessage(
                    `✅ Đã rút ${formatNumber(deducted)} $ từ quỹ thuế → ${recipientID === String(senderID) ? 'ví Admin' : 'người được tag/reply'}. Quỹ thuế còn: ${formatNumber(getTaxFund())} $.`,
                    threadID,
                    messageID
                );
            }
            return api.sendMessage("❌ Không thể rút quỹ thuế.", threadID, messageID);
        }

        if (cmd === 'exempt') {
            if (sub === 'list') {
                const list = getTaxExemptList();
                if (list.length === 0) {
                    return api.sendMessage("📋 Danh sách miễn thuế: trống.", threadID, messageID);
                }
                return api.sendMessage(
                    `📋 Danh sách miễn thuế (.work): ${list.length} người.\n` + list.slice(0, 20).map((id, i) => `${i + 1}. ${id}`).join('\n') + (list.length > 20 ? `\n... và ${list.length - 20} người khác` : ''),
                    threadID,
                    messageID
                );
            }
            if (sub === 'add') {
                const uid = target[2] || getFirstMentionOrReply(event);
                if (!uid) return api.sendMessage("❌ Cú pháp: tax exempt add <uid> hoặc tag/reply.", threadID, messageID);
                const id = String(uid).trim();
                const added = addTaxExempt(id);
                return api.sendMessage(added ? `✅ Đã thêm ${id} vào danh sách miễn thuế.` : `⚠️ ${id} đã có trong danh sách miễn thuế.`, threadID, messageID);
            }
            if (sub === 'remove') {
                const uid = target[2] || getFirstMentionOrReply(event);
                if (!uid) return api.sendMessage("❌ Cú pháp: tax exempt remove <uid> hoặc tag/reply.", threadID, messageID);
                const id = String(uid).trim();
                const removed = removeTaxExempt(id);
                return api.sendMessage(removed ? `✅ Đã xóa ${id} khỏi danh sách miễn thuế.` : `⚠️ ${id} không có trong danh sách miễn thuế.`, threadID, messageID);
            }
            return api.sendMessage("❌ Cú pháp: tax exempt list | tax exempt add <uid/@> | tax exempt remove <uid/@>", threadID, messageID);
        }

        const workRate = getWorkTaxRate();
        const taxFund = getTaxFund();
        const exemptCount = getTaxExemptList().length;

        let msg = `『 CỔNG THÔNG TIN THUẾ VỤ 』\n`;
        msg += `━━━━━━━━━━━━━\n`;
        msg += `📊 BÁO CÁO NGÂN SÁCH THUẾ\n\n`;
        msg += `🏛️ Quỹ thuế: ${formatNumber(taxFund)} $\n`;
        msg += `📋 Thuế suất: ${workRate}%\n`;
        msg += `📌 Số người miễn thuế: ${exemptCount}\n\n`;
        msg += `⚙️ Lệnh điều hành:\n`;
        msg += `• tax set rate <0-100> — Đặt thuế suất\n`;
        msg += `• tax withdraw <số tiền> [@user] — Rút quỹ thuế\n`;
        msg += `• tax exempt list / add / remove — Miễn thuế`;

        return api.sendMessage(msg, threadID, messageID);
    },
};
