const { updateBalance, getBalance } = require('../utils/currencies');
const FamilySystem = require('../family/FamilySystem');
const { SINGLE_TAX_RATE, WEALTH_TAX_RATE, WEALTH_THRESHOLD, TAX_INTERVAL } = require('../config/family/taxConfig');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const taxDataPath = path.join(__dirname, 'json/tax.json');

async function collectTax(userId) {
    try {
        const balance = await getBalance(userId);
        if (balance > 0) {
            let taxAmount = 0;
            let taxBreakdown = {
                single: 0,
                wealth: 0,
                children: 0
            };
            
            if (!familySystem.hasSpouse(userId)) {
                const singleTax = Math.floor(balance * SINGLE_TAX_RATE);
                taxAmount += singleTax;
                taxBreakdown.single = singleTax;
            }
            
            if (balance > WEALTH_THRESHOLD) {
                const wealthTax = Math.floor(balance * WEALTH_TAX_RATE);
                taxAmount += wealthTax;
                taxBreakdown.wealth = wealthTax;
            }

            const family = familySystem.getFamily(userId);
            if (family && family.children && family.children.length > 3) {
                const extraChildren = family.children.length - 3;
                const childTaxRate = extraChildren * 0.01;
                const childTax = Math.floor(balance * childTaxRate);
                taxAmount += childTax;
                taxBreakdown.children = childTax;
            }
            
            if (taxAmount > 0) {
                await updateBalance(userId, -taxAmount);
            }
            return {
                total: taxAmount,
                breakdown: taxBreakdown,
                childCount: family?.children?.length || 0
            };
        }
        return {
            total: 0,
            breakdown: {single: 0, wealth: 0, children: 0},
            childCount: 0
        };
    } catch (error) {
        console.error(`Error collecting tax from user ${userId}:`, error);
        return {
            total: 0,
            breakdown: {single: 0, wealth: 0, children: 0},
            childCount: 0
        };
    }
}

module.exports = {
    name: "tax",
    dev: "HNT",
    category: "System",
    usedby: 2,
    onPrefix: true,
    info: "Thu thuế",
    usages: "",
    cooldowns: 5,

    onLaunch: async function({ api, event }) {
        const { threadID } = event;
        const familySystem = new FamilySystem();

        try {
            let taxData = { lastCollection: {} };
            if (fs.existsSync(taxDataPath)) {
                taxData = JSON.parse(fs.readFileSync(taxDataPath, 'utf8'));
            }

            const now = Date.now();
            let totalTaxCollected = 0;
            let totalChildTax = 0;
            let taxedUsers = 0;
            let usersWithManyChildren = 0;

            const families = familySystem.getAllFamilies();
            for (const [userId, family] of Object.entries(families)) {
                if (family.spouse) continue;

                const lastCollection = taxData.lastCollection[userId] || 0;
                if (now - lastCollection < TAX_INTERVAL) continue;

                const taxResult = await collectTax(userId);
                if (taxResult.total > 0) {
                    totalTaxCollected += taxResult.total;
                    taxedUsers++;
                    if (taxResult.breakdown.children > 0) {
                        totalChildTax += taxResult.breakdown.children;
                        usersWithManyChildren++;
                    }
                    taxData.lastCollection[userId] = now;
                }
            }
            
            fs.writeFileSync(taxDataPath, JSON.stringify(taxData, null, 2));

            return api.sendMessage(
                `📊 Báo cáo thu thuế:\n\n` +
                `👥 Số người nộp thuế: ${taxedUsers}\n` +
                `💰 Tổng thu: ${formatNumber(totalTaxCollected)} Xu\n` +
                `💸 Thuế độc thân: ${SINGLE_TAX_RATE * 100}%/ngày\n` +
                `💎 Thuế người giàu (>500M): ${WEALTH_TAX_RATE * 100}%/ngày\n` +
                `👶 Thuế con cái (>3 con): +1%/con/ngày\n` +
                `   • Số người nộp: ${usersWithManyChildren}\n` +
                `   • Tổng thu: ${formatNumber(totalChildTax)} Xu`,
                threadID
            );

        } catch (error) {
            console.error('Tax collection error:', error);
            return api.sendMessage('❌ Đã xảy ra lỗi khi thu thuế!', threadID);
        }
    }
};
