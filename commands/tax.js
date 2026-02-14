const path = require('path');
const fs = require('fs');
const { getWorkTaxRate, getTaxFund } = require('../utils/tax');

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

module.exports = {
    name: "tax",
    dev: "HNT",
    category: "Admin",
    info: "Báo cáo thuế",
    onPrefix: true,
    usages: "tax",
    cooldowns: 10,
    usedby: 2,

    onLaunch: async function ({ api, event }) {
        const { threadID, messageID, senderID } = event;

        const adminData = loadAdminData();
        const adminUIDs = adminData.adminUIDs || [];
        if (!adminUIDs.includes(senderID)) {
            return api.sendMessage("❌ Chỉ Admin mới được truy cập báo cáo thuế.", threadID, messageID);
        }

        const workRate = getWorkTaxRate();
        const taxFund = getTaxFund();

        let msg = `『 CỔNG THÔNG TIN THUẾ VỤ 』\n`;
        msg += `━━━━━━━━━━━\n`;
        msg += `📊 BÁO CÁO NGÂN SÁCH THUẾ\n`;
        msg += `   (Nguồn: thu từ công việc hợp pháp)\n\n`;
        msg += `🏛️ Quỹ thuế hiện tại: ${formatNumber(taxFund)} $\n\n`;
        msg += `📋 Chính sách thuế suất:\n`;
        msg += `   • Thu nhập từ lao động (.work): ${workRate}%\n\n`;
        msg += `📌 Nguồn thu:\n`;
        msg += `   • Thuế thu nhập từ làm việc — khấu trừ tại nguồn, chuyển vào quỹ thuế.\n`;
        msg += `   • Quỹ thuế tách biệt với Hũ.`;

        return api.sendMessage(msg, threadID, messageID);
    },
};
