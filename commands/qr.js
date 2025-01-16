const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BANK_LIST = [
    "mbbank", "dongabank", "viettinbank", "vietcombank", "techcombank",
    "bidv", "acb", "sacombank", "vpbank", "agribank",
    "hdbank", "tpbank", "shb", "eximbank", "ocb",
    "seabank", "bacabank", "pvcombank", "scb", "vib",
    "namabank", "abbank", "lpbank", "vietabank", "msb",
    "nvbank", "pgbank", "publicbank", "cimbbank", "uob"
];

module.exports = {
    name: "qr",
    dev: "HNT",
    info: "Tạo mã QR chuyển khoản ngân hàng",
    usages: "qr [STK] [Mã bank] [Số tiền] [Nội dung]",
    usedby: 0,
    cooldowns: 0,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        try {
            const args = event.body.split(/\s+/).slice(1);
            
            if (args.length < 3) {
                return api.sendMessage(
                    "Cách dùng: qr [STK] [Mã bank] [Số tiền] [Nội dung]\n" +
                    "Ví dụ: qr 0123456789 mbbank 50000 Chuyen tien", 
                    event.threadID
                );
            }

            const [stk, bankCode, amount, ...contentArr] = args;
            const content = contentArr.join(" ") || "";
            const bank = bankCode.toLowerCase();

            if (stk.length < 7 || stk.length > 14) {
                return api.sendMessage("❌ Số tài khoản không hợp lệ!", event.threadID);
            }

            if (!BANK_LIST.includes(bank)) {
                return api.sendMessage("❌ Mã ngân hàng không hợp lệ!", event.threadID);
            }

            if (isNaN(amount)) {
                return api.sendMessage("❌ Số tiền phải là số!", event.threadID);
            }

            const qrUrl = `https://qr.sepay.vn/img?acc=${stk}&bank=${bank}&amount=${amount}&des=${encodeURIComponent(content)}&template=compact&download=true`;

            const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
            const tempPath = path.join(__dirname, 'cache', 'qr.png');
            
            fs.writeFileSync(tempPath, response.data);

            const msg = {
                body: `🏦 THÔNG TIN CHUYỂN KHOẢN QR\n` +
                      `━━━━━━━━━━━━━━━━━━━\n` +
                      `💳 STK: ${stk}\n` +
                      `🏦 Bank: ${bank.toUpperCase()}\n` +
                      `💰 Số tiền: ${Number(amount).toLocaleString()}đ\n` +
                      `📝 Nội dung: ${content}\n` +
                      `━━━━━━━━━━━━━━━━━━━`,
                attachment: fs.createReadStream(tempPath)
            };

            await api.sendMessage(msg, event.threadID);

            fs.unlink(tempPath, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });

        } catch (err) {
            console.error("QR generation error:", err);
            return api.sendMessage("❌ Đã xảy ra lỗi khi tạo mã QR!", event.threadID);
        }
    }
};
