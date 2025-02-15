const { getBalance, updateBalance } = require('../utils/currencies');
const fs = require('fs');
const path = require('path');

const VOUCHERS = [
    { name: "BRONZE", discount: 10, chance: 0.35 },    
    { name: "SILVER", discount: 15, chance: 0.15 },    
    { name: "GOLD", discount: 20, chance: 0.08 },    
];

const FAIL_CHANE = 0.4;

function generateVoucherCode(type) {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${type}_${random}${timestamp}`;
}

const HUNT_COST = 50000;
const COOLDOWN = 1;   
const MAX_VOUCHERS = 5;   
function getVoucherRarity(name) {
    switch(name) {
        case "BRONZE": return "⚫ Common";
        case "SILVER": return "⚪ Uncommon";
        case "GOLD": return "🟡 Rare";
    }
}

function hasDuplicateVoucher(userVouchers, voucherType) {
    return userVouchers.some(v => 
        v.type === voucherType && 
        !v.used && 
        v.expires > Date.now()
    );
}

const lastHunted = new Map();

module.exports = {
    name: "voucher",
    dev: "HNT",
    info: "Săn voucher giảm giá VIP",
    onPrefix: true,
    usages: "voucher",
    cooldowns: 0,

    onLaunch: async function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const args = event.body.split(' ').slice(1); 

        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        let voucherData;

        const jsonDir = path.join(__dirname, 'json');
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }

        try {
            voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        } catch (err) {
            voucherData = { users: {} };
        }

        if (!voucherData.users) voucherData.users = {};
        if (!voucherData.users[senderID]) voucherData.users[senderID] = [];
        
        if (Math.random() < FAIL_CHANE) {
            return api.sendMessage (
                `❌ Bạn săn thất bại rồi , thử lại sau nha!`, threadID,messageID
            );
        }

        if (args[0] === "check") {
            const userVouchers = voucherData.users[senderID] || [];
            const validVouchers = userVouchers.filter(v => !v.used && v.expires > Date.now());

            if (validVouchers.length === 0) {
                return api.sendMessage("❌ Bạn không có voucher nào!", threadID, messageID);
            }

            let msg = "🎟️ VOUCHER CỦA BẠN 🎟️\n━━━━━━━━━━━━━━━━━━\n\n";
            validVouchers.forEach((v, i) => {
                msg += `${i+1}. ${v.type} VIP\n`;
                msg += `📟 Mã: ${v.code}\n`;
                msg += `📊 Giảm: ${v.discount}%\n`;
                msg += `🏷️ Độ hiếm: ${getVoucherRarity(v.type)}\n`;
                msg += `⏳ Hết hạn: ${new Date(v.expires).toLocaleDateString('vi-VN')}\n\n`;
            });

            return api.sendMessage(msg, threadID, messageID);
        }

        const currentTime = Date.now();

        if (lastHunted.has(senderID)) {
            const timeLeft = (COOLDOWN - (currentTime - lastHunted.get(senderID))) / 1000;
            if (timeLeft > 0) {
                return api.sendMessage(`⏳ Vui lòng đợi ${timeLeft.toFixed(1)} giây nữa.`, threadID, messageID);
            }
        }

        const balance = getBalance(senderID);
        if (balance < HUNT_COST) {
            return api.sendMessage(`❌ Bạn cần ${HUNT_COST.toLocaleString('vi-VN')} xu để săn voucher.`, threadID, messageID);
        }

        updateBalance(senderID, -HUNT_COST);
        lastHunted.set(senderID, currentTime);

        let userVoucherData = {};
        try {
            userVoucherData = require('./json/voucher.json');
        } catch {
            userVoucherData = { users: {} };
        }

        if (!userVoucherData.users[senderID]) {
            userVoucherData.users[senderID] = [];
        }

        const validVouchers = voucherData.users[senderID].filter(v => !v.used && v.expires > Date.now());
        
        if (validVouchers.length >= MAX_VOUCHERS) {
            return api.sendMessage(
                `❌ Bạn đã có tối đa ${MAX_VOUCHERS} voucher!\n` +
                `Dùng "voucher check" để xem và sử dụng voucher hiện có.`, 
                threadID, 
                messageID
            );
        }

        let selectedVoucher = null;
        let attempts = 0;
        const maxAttempts = 10; 

        while (attempts < maxAttempts) {
            const rand = Math.random();
            let cumulative = 0;

            for (const voucher of VOUCHERS) {
                cumulative += voucher.chance;
                if (rand <= cumulative) {
                    if (!hasDuplicateVoucher(validVouchers, voucher.name)) {
                        selectedVoucher = voucher;
                        break;
                    }
                    break;
                }
            }

            if (selectedVoucher) break;
            attempts++;
        }

        if (!selectedVoucher) {
            updateBalance(senderID, HUNT_COST); 
            return api.sendMessage(
                "❌ Bạn đã có tất cả loại voucher!\n" +
                "Hãy sử dụng voucher hiện có trước khi săn thêm.",
                threadID, 
                messageID
            );
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        voucherData.users[senderID].push({
            type: selectedVoucher.name,
            code: generateVoucherCode(selectedVoucher.name, senderID),
            discount: selectedVoucher.discount,
            expires: expiryDate.getTime(),
            used: false
        });

        fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));

        const message = `🎯 VIP VOUCHER 🎯\n\n` +
            `${getVoucherRarity(selectedVoucher.name)}\n` +
            `💎 Đã săn được: ${selectedVoucher.name} VIP\n` +
            `🏷️ Giảm giá: ${selectedVoucher.discount}%\n` +
            `📟 Mã: ${voucherData.users[senderID][voucherData.users[senderID].length - 1].code}\n` +
            `⏳ Hết hạn: ${expiryDate.toLocaleDateString('vi-VN')}\n` +
            `💰 Số dư: ${getBalance(senderID).toLocaleString('vi-VN')} xu\n\n` +
            `📌 Dùng .vip để xem bảng giá VIP\n` ;

        api.sendMessage(message, threadID, messageID);
    }
};
