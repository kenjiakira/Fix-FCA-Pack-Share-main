const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');

module.exports = {
    name: "momo",
    dev: "HNT",
    category: "VIP", 
    info: "Thanh toán qua MoMo",
    usedby: 2,
    onPrefix: true,
    cooldowns: 5,

    config: {
        momoNumber: "0354683398", 
        momoName: "HOANG_NGOC_TU",     
        minAmount: 1000,
        maxAmount: 50000000
    },
    
    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        try {
            const action = target[0]?.toLowerCase();
            const amount = parseInt(target[1]);

            switch (action) {
                case "deposit":
                case "nap": {
                    if (!amount || isNaN(amount)) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập số tiền hợp lệ!\n" +
                            "Sử dụng: .momo nap [số tiền]", 
                            threadID, messageID
                        );
                    }

                    if (amount < this.config.minAmount || amount > this.config.maxAmount) {
                        return api.sendMessage(
                            `❌ Số tiền phải từ ${this.config.minAmount}đ đến ${this.config.maxAmount}đ!`,
                            threadID, messageID
                        );
                    }

                    // Tạo mã giao dịch unique
                    const transactionId = `${senderID}_${Date.now()}`;
                    
                    // Tạo nội dung chuyển khoản
                    const transferContent = `NAP${transactionId}`;

                    // Tạo QR Code cho giao dịch
                    const qrCodeData = `2|99|${this.config.momoNumber}|${this.config.momoName}|0|0|${amount}|${transferContent}`;
                    const qrCodePath = path.join(__dirname, `../temp/${transactionId}.png`);
                    
                    await QRCode.toFile(qrCodePath, qrCodeData);

                    // Lưu thông tin giao dịch vào cache
                    const transaction = {
                        id: transactionId,
                        userId: senderID,
                        amount: amount,
                        status: 'pending',
                        createdAt: Date.now()
                    };

                    // Lưu vào file cache
                    const cacheFile = path.join(__dirname, './cache/momo_transactions.json');
                    let transactions = {};
                    
                    if (fs.existsSync(cacheFile)) {
                        transactions = JSON.parse(fs.readFileSync(cacheFile));
                    }
                    
                    transactions[transactionId] = transaction;
                    fs.writeFileSync(cacheFile, JSON.stringify(transactions, null, 2));

                    // Gửi QR Code và hướng dẫn
                    await api.sendMessage(
                        {
                            body: "🏧 HƯỚNG DẪN NẠP TIỀN QUA MOMO 🏧\n" +
                                  "━━━━━━━━━━━━━━━━━━\n\n" +
                                  "1. Mở app MoMo và quét mã QR\n" +
                                  "2. Nhập chính xác số tiền\n" +
                                  "3. KHÔNG THAY ĐỔI nội dung chuyển khoản\n" +
                                  `4. Nội dung: ${transferContent}\n\n` +
                                  `💰 Số tiền: ${amount.toLocaleString()}đ\n` +
                                  `📱 Số MoMo: ${this.config.momoNumber}\n` +
                                  `👤 Tên: ${this.config.momoName}\n\n` +
                                  "⏳ Giao dịch sẽ được xử lý tự động\n" +
                                  "💡 Dùng '.momo check' để kiểm tra trạng thái",
                            attachment: fs.createReadStream(qrCodePath)
                        },
                        threadID,
                        (err) => {
                            fs.unlinkSync(qrCodePath);
                        }
                    );
                    break;
                }

                case "check":
                case "status": {
                    const cacheFile = path.join(__dirname, './cache/momo_transactions.json');
                    if (!fs.existsSync(cacheFile)) {
                        return api.sendMessage(
                            "❌ Không tìm thấy giao dịch nào!",
                            threadID, messageID
                        );
                    }

                    const transactions = JSON.parse(fs.readFileSync(cacheFile));
                    const userTransactions = Object.values(transactions)
                        .filter(t => t.userId === senderID)
                        .sort((a, b) => b.createdAt - a.createdAt);

                    if (userTransactions.length === 0) {
                        return api.sendMessage(
                            "❌ Bạn chưa có giao dịch nào!",
                            threadID, messageID
                        );
                    }

                    let msg = "📊 LỊCH SỬ GIAO DỊCH MOMO\n";
                    msg += "━━━━━━━━━━━━━━━━━━\n\n";

                    userTransactions.slice(0, 5).forEach((transaction, index) => {
                        const status = transaction.status === 'completed' ? '✅' :
                                     transaction.status === 'pending' ? '⏳' : '❌';
                        const date = new Date(transaction.createdAt).toLocaleString();
                        
                        msg += `${index + 1}. Giao dịch: ${transaction.id}\n`;
                        msg += `   ${status} Trạng thái: ${transaction.status}\n`;
                        msg += `   💰 Số tiền: ${transaction.amount.toLocaleString()}đ\n`;
                        msg += `   🕒 Thời gian: ${date}\n\n`;
                    });

                    return api.sendMessage(msg, threadID, messageID);
                }

                case "help":
                default: {
                    return api.sendMessage(
                        "🏧 THANH TOÁN QUA MOMO 🏧\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "1. Nạp tiền:\n" +
                        "   .momo nap [số tiền]\n\n" +
                        "2. Kiểm tra giao dịch:\n" +
                        "   .momo check\n\n" +
                        `💡 Số tiền nạp từ ${this.config.minAmount}đ đến ${this.config.maxAmount}đ\n` +
                        "⚠️ Không tiết lộ mã giao dịch cho người khác\n" +
                        "❗ Mọi khiếu nại liên hệ Admin",
                        threadID, messageID
                    );
                }
            }

        } catch (error) {
            console.error('MoMo Payment Error:', error);
            return api.sendMessage(
                `❌ Đã xảy ra lỗi: ${error.message}`,
                threadID, messageID
            );
        }
    }
};
