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

       
            const qrUrl = new URL('https://qr.sepay.vn/img');
            qrUrl.searchParams.append('acc', stk);
            qrUrl.searchParams.append('bank', bank);
            qrUrl.searchParams.append('amount', amountNum);
            qrUrl.searchParams.append('des', content);
            qrUrl.searchParams.append('template', 'compact');
            qrUrl.searchParams.append('download', 'true');

            console.log('Generated QR URL:', qrUrl.toString());

            const response = await axios({
                method: 'GET',
                url: qrUrl.toString(),
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'Accept': 'image/png',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!response.data || response.headers['content-type'] !== 'image/png') {
                throw new Error('Invalid QR image response');
            }

            const tempPath = path.join(__dirname, 'cache', `qr_${Date.now()}.png`);
            
     
            if (!fs.existsSync(path.dirname(tempPath))) {
                fs.mkdirSync(path.dirname(tempPath), { recursive: true });
            }

            fs.writeFileSync(tempPath, Buffer.from(response.data));

          
            await api.sendMessage({
                body: `🏦 THÔNG TIN CHUYỂN KHOẢN QR\n` +
                      `━━━━━━━━━━━━━━━━━━━\n` +
                      `💳 STK: ${stk}\n` +
                      `🏦 Bank: ${bank.toUpperCase()}\n` +
                      `💰 Số tiền: ${amountNum.toLocaleString()}đ\n` +
                      `📝 Nội dung: ${content}\n` +
                      `━━━━━━━━━━━━━━━━━━━`,
                attachment: fs.createReadStream(tempPath)
            }, event.threadID, () => {
            
                fs.unlinkSync(tempPath);
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