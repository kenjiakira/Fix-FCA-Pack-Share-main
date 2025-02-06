const crypto = require('crypto');

module.exports = {
    name: "decode",
    info: "Giải mã văn bản",
    usages: "decode [method] [text]",
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        if (!target[0]) {
            return api.sendMessage(
                "🔓 DECODE TOOLS\n" +
                "━━━━━━━━━━━━━━━━━━━\n" +
                "📌 Danh sách methods:\n" +
                "• base64: Giải mã Base64\n" +
                "• hex: Giải mã Hex\n" +
                "• uri: Giải mã URL\n\n" +
                "Cách dùng: decode [method] [text]\n" +
                "Ví dụ: decode base64 aGVsbG8=\n\n" +
                "💡 Lưu ý: MD5, SHA1, SHA256 không thể giải mã",
                event.threadID
            );
        }

        const method = target[0].toLowerCase();
        const text = target.slice(1).join(" ");

        if (!text) {
            return api.sendMessage("❌ Thiếu nội dung cần giải mã!", event.threadID);
        }

        try {
            const result = await processDecode(method, text);
            return api.sendMessage(
                `🔓 KẾT QUẢ GIẢI MÃ:\n` +
                `━━━━━━━━━━━━━━━━━━━\n` +
                `📥 Input (${method}):\n${text}\n\n` +
                `📤 Output:\n${result}`,
                event.threadID
            );
        } catch (error) {
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\n` +
                `💡 Gõ "decode" để xem hướng dẫn`,
                event.threadID
            );
        }
    }
};

async function processDecode(method, text) {
    switch (method) {
        case 'base64':
            return Buffer.from(text, 'base64').toString();
        case 'hex':
            return Buffer.from(text, 'hex').toString();
        case 'uri':
            return decodeURIComponent(text);
        default:
            throw new Error("Phương thức không hợp lệ hoặc không thể giải mã!");
    }
}
