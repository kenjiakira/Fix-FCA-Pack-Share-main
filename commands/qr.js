const axios = require('axios');
const fs = require('fs');
const path = require('path');
const vipService = require('../vip/vipService');

const BANK_LIST = [
    "mbbank", "dongabank", "vietinbank", "vietcombank", "techcombank",
    "bidv", "acb", "sacombank", "vpbank", "agribank",
    "hdbank", "tpbank", "shb", "eximbank", "ocb",
    "seabank", "bacabank", "pvcombank", "scb", "vib",
    "namabank", "abbank", "lpbank", "vietabank", "msb",
    "nvbank", "pgbank", "publicbank", "cimbbank", "uob"
];

const VIP_PRICES = {
    'bronze': 20000,
    'silver': 30000,
    'gold': 50000
};

module.exports = {
    name: "qr",
    dev: "HNT",
    category: "Tiện Ích",
    info: "Tạo mã QR chuyển khoản ngân hàng",
    usages: "qr [STK] [Mã bank] [Số tiền] [Nội dung]",
    usedby: 0,
    cooldowns: 0,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        try {
            const args = event.body.split(/\s+/).slice(1);
            
            if (args[0]?.toLowerCase() === 'vip') {
                const vipType = args[1]?.toLowerCase();
                if (!vipType || !["bronze", "silver", "gold"].includes(vipType)) {
                    return api.sendMessage(
                        "Cú pháp: qr vip [bronze/silver/gold] [tháng]\n" +
                        "Ví dụ: qr vip bronze\nhoặc: qr vip bronze 3", 
                        event.threadID
                    );
                }
                
                // Get months parameter (default is 1)
                const months = args[2] ? parseInt(args[2]) : 1;
                if (![1, 3, 6, 12].includes(months)) {
                    return api.sendMessage(
                        "Số tháng không hợp lệ, vui lòng chọn 1, 3, 6 hoặc 12 tháng.",
                        event.threadID
                    );
                }

                const bestVoucher = checkVouchers(event.senderID);
                
                // Calculate correct price using vipService
                const priceInfo = vipService.calculateVipPrice(vipType, months, bestVoucher);
                
                if (!priceInfo.success) {
                    return api.sendMessage(`❌ Lỗi: ${priceInfo.message}`, event.threadID);
                }
                
                let amount = priceInfo.finalPrice;
                let content = `VIP_${vipType.toUpperCase()}_${months > 1 ? months : ""}${event.senderID}`;
                
                if (bestVoucher) {
                    content = `VIP_${vipType.toUpperCase()}_${months > 1 ? months : ""}_${event.senderID}_VOUCHER_${bestVoucher.code}`;
                    markVoucherAsUsed(event.senderID, bestVoucher.code);
                }
                
                await generateAndSendQR(api, event, {
                    stk: "0354683398",
                    bank: "vietinbank",
                    amount: amount,
                    content: content,
                    isVip: true,
                    vipType: vipType,
                    months: months,
                    voucher: bestVoucher,
                    priceInfo: priceInfo
                });
                return;
            }

            if (args.length < 3) {
                return api.sendMessage(
                    "Cách dùng: qr [STK] [Mã bank] [Số tiền] [Nội dung]\n" +
                    "Ví dụ: qr 0123456789 mbbank 50000 Chuyen tien", 
                    event.threadID
                );
            }

            const [stk, bankCode, amount, ...contentArr] = args;
            const content = contentArr.join(" ") || "Chuyen tien";
            const bank = bankCode.toLowerCase();

            if (!stk || !bank || !amount) {
                return api.sendMessage("❌ Thiếu thông tin bắt buộc!", event.threadID);
            }

            if (stk.length < 7 || stk.length > 14) {
                return api.sendMessage("❌ Số tài khoản không hợp lệ!", event.threadID);
            }

            if (!BANK_LIST.includes(bank)) {
                return api.sendMessage("❌ Mã ngân hàng không hợp lệ!", event.threadID);
            }

            const amountNum = parseInt(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                return api.sendMessage("❌ Số tiền phải là số dương!", event.threadID);
            }

            await generateAndSendQR(api, event, {
                stk: stk,
                bank: bank,
                amount: amountNum,
                content: content,
                isVip: false
            });

        } catch (err) {
            console.error("QR generation error:", err);
            return api.sendMessage(
                "❌ Đã xảy ra lỗi khi tạo mã QR! Chi tiết lỗi: " + err.message, 
                event.threadID
            );
        }
    }
};

// Check for vouchers and return the best one (highest discount)
function checkVouchers(senderID) {
    try {
        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        if (!fs.existsSync(voucherPath)) {
            return null;
        }
        
        const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        if (!voucherData.users || !voucherData.users[senderID]) {
            return null;
        }
        
        const userVouchers = voucherData.users[senderID];
        const validVouchers = userVouchers.filter(v => !v.used && v.expires > Date.now());
        
        if (validVouchers.length === 0) return null;
        
        // Return the voucher with the highest discount
        return validVouchers.sort((a, b) => b.discount - a.discount)[0];
    } catch (err) {
        console.error("Voucher check error:", err);
        return null;
    }
}

// Mark a voucher as used
function markVoucherAsUsed(senderID, voucherCode) {
    try {
        const voucherPath = path.join(__dirname, 'json', 'voucher.json');
        const voucherData = JSON.parse(fs.readFileSync(voucherPath, 'utf8'));
        
        if (!voucherData.users || !voucherData.users[senderID]) return;
        
        const userVouchers = voucherData.users[senderID];
        const voucherIndex = userVouchers.findIndex(v => v.code === voucherCode);
        
        if (voucherIndex !== -1) {
            userVouchers[voucherIndex].used = true;
            fs.writeFileSync(voucherPath, JSON.stringify(voucherData, null, 2));
        }
    } catch (err) {
        console.error("Error marking voucher as used:", err);
    }
}

async function generateAndSendQR(api, event, { stk, bank, amount, content, isVip, vipType, months = 1, voucher, priceInfo }) {
    const qrUrl = new URL('https://qr.sepay.vn/img');
    qrUrl.searchParams.append('acc', stk);
    qrUrl.searchParams.append('bank', bank);
    qrUrl.searchParams.append('amount', amount);
    qrUrl.searchParams.append('des', content);
    qrUrl.searchParams.append('template', 'compact');

    const response = await axios({
        method: 'GET',
        url: qrUrl.toString(),
        responseType: 'arraybuffer',
        headers: {
            'Accept': 'image/png',
            'User-Agent': 'Mozilla/5.0'
        }
    });

    const tempPath = path.join(__dirname, 'cache', `qr_${Date.now()}.png`);
    
    if (!fs.existsSync(path.dirname(tempPath))) {
        fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    }

    fs.writeFileSync(tempPath, Buffer.from(response.data));

    let messageBody = isVip 
        ? `🎮 THANH TOÁN VIP ${vipType.toUpperCase()}${months > 1 ? ' ' + months + ' THÁNG' : ''}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💳 STK: ${stk}\n` +
          `🏦 Bank: ${bank.toUpperCase()}\n` +
          `💰 Số tiền: ${Number(amount).toLocaleString('vi-VN')}đ\n`
        : `🏦 THÔNG TIN CHUYỂN KHOẢN\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💳 STK: ${stk}\n` +
          `🏦 Bank: ${bank.toUpperCase()}\n` +
          `💰 Số tiền: ${Number(amount).toLocaleString('vi-VN')}đ\n`;
          
    if (voucher && isVip && priceInfo) {
        const originalPrice = months > 1 ? 
            priceInfo.originalPrice * months : 
            priceInfo.originalPrice;
        
        messageBody += `💵 Giá gốc: ${Number(originalPrice).toLocaleString('vi-VN')}đ\n`;
        
        // Add term discount info if any
        if (months > 1 && priceInfo.totalDiscount > 0) {
            const termDiscountAmount = Math.floor(originalPrice * priceInfo.totalDiscount / 100);
            messageBody += `🔄 Giảm dài hạn: -${priceInfo.totalDiscount}% (-${Number(termDiscountAmount).toLocaleString('vi-VN')}đ)\n`;
        }
        
        messageBody += `🎟️ Voucher: ${voucher.code} (-${voucher.discount}%)\n`;
        messageBody += `💸 Tiết kiệm: ${Number(originalPrice - amount).toLocaleString('vi-VN')}đ\n`;
    } else if (isVip && priceInfo && months > 1 && priceInfo.totalDiscount > 0) {
        const originalPrice = priceInfo.originalPrice * months;
        messageBody += `💵 Giá gốc: ${Number(originalPrice).toLocaleString('vi-VN')}đ\n`;
        messageBody += `🔄 Giảm dài hạn: -${priceInfo.totalDiscount}% (-${Number(originalPrice - amount).toLocaleString('vi-VN')}đ)\n`;
    }

    messageBody += `📝 Nội dung: ${content}\n`;
    if (isVip) {
        messageBody += `⚠️ Vui lòng chuyển khoản chính xác nội dung\n`;
    }
    messageBody += `━━━━━━━━━━━━━━━━━━━`;

    await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(tempPath)
    }, event.threadID, () => {
        fs.unlinkSync(tempPath);
    });
}