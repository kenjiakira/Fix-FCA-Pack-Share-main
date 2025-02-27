const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
                if (!vipType || !VIP_PRICES[vipType]) {
                    return api.sendMessage(
                        "Cú pháp: qr vip [bronze/silver/gold]\n" +
                        "Ví dụ: qr vip bronze", 
                        event.threadID
                    );
                }

                const amount = VIP_PRICES[vipType];
                const content = `VIP_${vipType.toUpperCase()}_${event.senderID}`;
                
                // Generate QR for VIP purchase
                await generateAndSendQR(api, event, {
                    stk: "0354683398",
                    bank: "vietinbank",
                    amount: amount,
                    content: content,
                    isVip: true,
                    vipType: vipType
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

async function generateAndSendQR(api, event, { stk, bank, amount, content, isVip, vipType }) {
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
        ? `🎮 THANH TOÁN VIP ${vipType.toUpperCase()}\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💳 STK: ${stk}\n` +
          `🏦 Bank: ${bank.toUpperCase()}\n` +
          `💰 Số tiền: ${amount.toLocaleString()}đ\n` +
          `📝 Nội dung: ${content}\n` +
          `⚠️ Vui lòng chuyển khoản chính xác nội dung\n` +
          `━━━━━━━━━━━━━━━━━━━`
        : `🏦 THÔNG TIN CHUYỂN KHOẢN\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💳 STK: ${stk}\n` +
          `🏦 Bank: ${bank.toUpperCase()}\n` +
          `💰 Số tiền: ${amount.toLocaleString()}đ\n` +
          `📝 Nội dung: ${content}\n` +
          `━━━━━━━━━━━━━━━━━━━`;

    await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(tempPath)
    }, event.threadID, () => {
        fs.unlinkSync(tempPath);
    });
}