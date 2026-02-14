const fs = require('fs');
const path = require('path');

const TAX_CONFIG_PATH = path.join(__dirname, '../database/json/tax.json');

const DEFAULTS = {
    workRate: 10,
    taxFund: 0,
};

function loadTaxConfig() {
    try {
        const dir = path.dirname(TAX_CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(TAX_CONFIG_PATH)) {
            const data = JSON.parse(fs.readFileSync(TAX_CONFIG_PATH, 'utf8'));
            return { ...DEFAULTS, ...data };
        }
    } catch (e) {
        console.error('Error loading tax config:', e);
    }
    return { ...DEFAULTS };
}

function saveTaxConfig(config) {
    try {
        const dir = path.dirname(TAX_CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TAX_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving tax config:', e);
    }
}

function getTaxFund() {
    const config = loadTaxConfig();
    return Math.max(0, Number(config.taxFund) || 0);
}

function addToTaxFund(amount) {
    if (amount <= 0) return;
    const config = loadTaxConfig();
    config.taxFund = (config.taxFund || 0) + amount;
    saveTaxConfig(config);
}

function getWorkTaxRate() {
    const config = loadTaxConfig();
    const rate = Math.max(0, Math.min(100, Number(config.workRate) || 0));
    return rate;
}

/**
 * Áp thuế lên thu nhập từ work.
 * @param {number} grossPay - Thu nhập gộp (trước thuế)
 * @returns {{ netPay: number, taxAmount: number }}
 */
function applyWorkTax(grossPay) {
    if (grossPay <= 0) return { netPay: 0, taxAmount: 0 };
    const rate = getWorkTaxRate() / 100;
    const taxAmount = Math.floor(grossPay * rate);
    const netPay = Math.max(0, grossPay - taxAmount);
    return { netPay, taxAmount };
}

module.exports = {
    loadTaxConfig,
    saveTaxConfig,
    getWorkTaxRate,
    applyWorkTax,
    getTaxFund,
    addToTaxFund,
};
