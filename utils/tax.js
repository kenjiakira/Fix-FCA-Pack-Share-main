const fs = require('fs');
const path = require('path');

const TAX_CONFIG_PATH = path.join(__dirname, '../database/json/tax.json');

const DEFAULTS = {
    workRate: 10,
    taxFund: 0,
    taxExempt: [],
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

/** Rút từ quỹ thuế (trả về số tiền thực rút). */
function subtractFromTaxFund(amount) {
    if (amount <= 0) return 0;
    const config = loadTaxConfig();
    const current = Math.max(0, Number(config.taxFund) || 0);
    const deduct = Math.min(amount, Math.floor(current));
    if (deduct > 0) {
        config.taxFund = current - deduct;
        saveTaxConfig(config);
    }
    return deduct;
}

function setWorkTaxRate(rate) {
    const r = Math.max(0, Math.min(100, Math.floor(Number(rate)) || 0));
    const config = loadTaxConfig();
    config.workRate = r;
    saveTaxConfig(config);
    return r;
}

function getWorkTaxRate() {
    const config = loadTaxConfig();
    return Math.max(0, Math.min(100, Number(config.workRate) || 0));
}

/**
 * Áp thuế lên thu nhập từ work. Nếu userId được miễn thuế thì taxAmount = 0.
 * @param {number} grossPay - Thu nhập gộp (trước thuế)
 * @param {string} [userId] - ID người nhận (để kiểm tra miễn thuế)
 * @returns {{ netPay: number, taxAmount: number }}
 */
function applyWorkTax(grossPay, userId) {
    if (grossPay <= 0) return { netPay: 0, taxAmount: 0 };
    if (userId && isTaxExempt(userId)) return { netPay: grossPay, taxAmount: 0 };
    const rate = getWorkTaxRate() / 100;
    const taxAmount = Math.floor(grossPay * rate);
    const netPay = Math.max(0, grossPay - taxAmount);
    return { netPay, taxAmount };
}

function getTaxExemptList() {
    const config = loadTaxConfig();
    const list = config.taxExempt;
    return Array.isArray(list) ? list.map(String) : [];
}

function isTaxExempt(userId) {
    if (!userId) return false;
    const list = getTaxExemptList();
    return list.includes(String(userId));
}

function addTaxExempt(userId) {
    const config = loadTaxConfig();
    if (!Array.isArray(config.taxExempt)) config.taxExempt = [];
    const id = String(userId);
    if (!config.taxExempt.includes(id)) {
        config.taxExempt.push(id);
        saveTaxConfig(config);
        return true;
    }
    return false;
}

function removeTaxExempt(userId) {
    const config = loadTaxConfig();
    if (!Array.isArray(config.taxExempt)) config.taxExempt = [];
    const id = String(userId);
    const idx = config.taxExempt.indexOf(id);
    if (idx !== -1) {
        config.taxExempt.splice(idx, 1);
        saveTaxConfig(config);
        return true;
    }
    return false;
}

module.exports = {
    loadTaxConfig,
    saveTaxConfig,
    getWorkTaxRate,
    setWorkTaxRate,
    applyWorkTax,
    getTaxFund,
    addToTaxFund,
    subtractFromTaxFund,
    getTaxExemptList,
    isTaxExempt,
    addTaxExempt,
    removeTaxExempt,
};
