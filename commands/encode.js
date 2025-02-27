const crypto = require('crypto');

module.exports = {
    name: "encode",
    info: "Mã hóa văn bản",
    category: "Tiện Ích",
    usages: "encode [method] [text]",
    usedby: 0,
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        if (!target[0]) {
            return api.sendMessage(
                "🔐 ENCODE TOOLS\n" +
                "━━━━━━━━━━━━━━━━━━━\n" +
                "📌 Danh sách methods:\n" +
                "• base64: Mã hóa Base64\n" +
                "• hex: Mã hóa Hex\n" +
                "• md5: Mã hóa MD5\n" +
                "• sha1: Mã hóa SHA1\n" +
                "• sha256: Mã hóa SHA256\n" +
                "• uri: Mã hóa URL\n\n" +
                "Cách dùng: encode [method] [text]\n" +
                "Ví dụ: encode base64 hello",
                event.threadID
            );
        }

        const method = target[0].toLowerCase();
        const text = target.slice(1).join(" ");

        if (!text) {
            return api.sendMessage("❌ Thiếu nội dung cần mã hóa!", event.threadID);
        }

        try {
            const result = await processEncode(method, text);
            return api.sendMessage(
                `🔒 KẾT QUẢ MÃ HÓA:\n` +
                `━━━━━━━━━━━━━━━━━━━\n` +
                `📥 Input (${method}):\n${text}\n\n` +
                `📤 Output:\n${result}`,
                event.threadID
            );
        } catch (error) {
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\n` +
                `💡 Gõ "encode" để xem hướng dẫn`,
                event.threadID
            );
        }
    }
};

async function processEncode(method, text) {
    switch (method) {
        case 'base64':
            return Buffer.from(text).toString('base64');
        case 'hex':
            return Buffer.from(text).toString('hex');
        case 'uri':
            return encodeURIComponent(text);
        case 'md5':
            return crypto.createHash('md5').update(text).digest('hex');
        case 'sha1':
            return crypto.createHash('sha1').update(text).digest('hex');
        case 'sha256':
            return crypto.createHash('sha256').update(text).digest('hex');
        default:
            throw new Error("Phương thức không hợp lệ!");
    }
}
