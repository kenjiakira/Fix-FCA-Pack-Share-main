const crypto = require('crypto');
const axios = require("axios");

module.exports = {
    name: "tools",
    info: "Công cụ đa năng: Giải mã, mã hóa, gửi tin nhắn ẩn danh",
    category: "Tools",
    usages: "tools [encode|decode|emoji|anon] [options]",
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (target.length < 2) {
            return api.sendMessage(
                "🔧 TOOLS\n" +
                "━━━━━━━━━━━━━━━━━━━\n" +
                "📌 Các lệnh hỗ trợ:\n" +
                "• encode [method] [text]: Mã hóa văn bản\n" +
                "• decode [method] [text]: Giải mã văn bản\n" +
                "• emoji [encode|decode] [text]: Mã hóa/Giải mã Emoji\n" +
                "• anon [username] [message]: Gửi tin nhắn ẩn danh\n\n" +
                "💡 Gõ 'tools' để xem hướng dẫn chi tiết.",
                threadID, messageID
            );
        }

        const command = target[0]?.toLowerCase();
        const args = target.slice(1);

        try {
            if (command === "encode") {
                const method = args[0]?.toLowerCase();
                const text = args.slice(1).join(" ");
                if (!method || !text) throw new Error("Thiếu phương thức hoặc nội dung cần mã hóa!");
                const result = await processEncode(method, text);
                return api.sendMessage(
                    `🔒 KẾT QUẢ MÃ HÓA:\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `📥 Input (${method}):\n${text}\n\n` +
                    `📤 Output:\n${result}`,
                    threadID, messageID
                );
            } else if (command === "decode") {
                const method = args[0]?.toLowerCase();
                const text = args.slice(1).join(" ");
                if (!method || !text) throw new Error("Thiếu phương thức hoặc nội dung cần giải mã!");
                const result = await processDecode(method, text);
                return api.sendMessage(
                    `🔓 KẾT QUẢ GIẢI MÃ:\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `📥 Input (${method}):\n${text}\n\n` +
                    `📤 Output:\n${result}`,
                    threadID, messageID
                );
            } else if (command === "emoji") {
                const subCommand = args[0]?.toLowerCase();
                const text = args.slice(1).join(" ");
                if (!subCommand || !text) throw new Error("Thiếu lệnh con hoặc nội dung cần xử lý!");
                const result = processEmoji(subCommand, text);
                return api.sendMessage(result, threadID, messageID);
            } else if (command === "anon") {
                await handleAnonCommand(api, event, args);
            } else {
                throw new Error("Lệnh không hợp lệ!");
            }
        } catch (error) {
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\n` +
                `💡 Gõ 'tools' để xem hướng dẫn chi tiết.`,
                threadID, messageID
            );
        }
    }
};

async function handleAnonCommand(api, event, target) {
    const { threadID, messageID } = event;

    if (!target[0]) {
        return api.sendMessage(
            "🕊️ Gửi tin nhắn ẩn danh:\n\n" +
            "Cách dùng: tools anon <username> <nội dung>\n" +
            "Hoặc: tools anon <username> -c <số lần> <nội dung>\n\n" +
            "Ví dụ:\n" +
            "1. tools anon johndoe Hello!\n" +
            "2. tools anon johndoe -c 5 Hello!\n\n" +
            "Lưu ý:\n" +
            "- Username là tên ngl.link của người nhận\n" +
            "- Số lần gửi tối đa là 10 tin/lần\n" +
            "- Tin nhắn sẽ được gửi ẩn danh",
            threadID,
            messageID
        );
    }

    const username = target[0];
    let count = 1;
    let message;

    if (target[1] === "-c") {
        count = parseInt(target[2]);
        if (isNaN(count) || count < 1 || count > 10) {
            return api.sendMessage(
                "⚠️ Số lần gửi phải từ 1 đến 10!",
                threadID,
                messageID
            );
        }
        message = target.slice(3).join(" ");
    } else {
        message = target.slice(1).join(" ");
    }

    if (!message) {
        return api.sendMessage(
            "⚠️ Vui lòng nhập nội dung tin nhắn!",
            threadID,
            messageID
        );
    }

    try {
        const headers = {
            referer: `https://ngl.link/${username}`,
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        };

        const data = {
            username: username,
            question: message,
            deviceId: "anon-" + Math.random().toString(36).substr(2, 9),
            gameSlug: "",
            referrer: "",
        };

        let successCount = 0;
        const progressMsg = await api.sendMessage(
            "🕊️ Đang gửi tin nhắn...",
            threadID
        );

        for (let i = 0; i < count; i++) {
            try {
                const response = await axios.post(
                    "https://ngl.link/api/submit",
                    data,
                    { headers }
                );
                if (response.status === 200) successCount++;
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch {
                continue;
            }
        }

        if (successCount > 0) {
            await api.editMessage({
                body:
                    `✅ Đã gửi thành công!\n\n` +
                    `📝 Nội dung: ${message}\n` +
                    `👤 Đến: @${username}\n` +
                    `📨 Số tin đã gửi: ${successCount}/${count}`,
                messageID: progressMsg.messageID,
                threadID: event.threadID,
            });
        } else {
            throw new Error("Không thể gửi tin nhắn");
        }

        setTimeout(() => api.unsendMessage(progressMsg.messageID), 10000);
    } catch (error) {
        return api.sendMessage(
            "❌ Lỗi: Không thể gửi tin nhắn. Vui lòng kiểm tra lại username hoặc thử lại sau!",
            threadID,
            messageID
        );
    }
}

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
            throw new Error("Phương thức mã hóa không hợp lệ!");
    }
}

async function processDecode(method, text) {
    switch (method) {
        case 'base64':
            return Buffer.from(text, 'base64').toString();
        case 'hex':
            return Buffer.from(text, 'hex').toString();
        case 'uri':
            return decodeURIComponent(text);
        default:
            throw new Error("Phương thức giải mã không hợp lệ hoặc không thể giải mã!");
    }
}

function processEmoji(subCommand, text) {
    const emojiMap = {
        "a": "🅰️", "b": "🅱️", "c": "🇨🇦", "d": "🇩🇪", "e": "🇪🇸", "f": "🇫🇷", "g": "🇬🇷", "h": "🇭🇺", "i": "🇮🇹", "j": "🇯🇱",
        "k": "🇰🇷", "l": "🇱🇸", "m": "🇲🇾", "n": "🇳🇬", "o": "🅾️", "p": "🅿️", "q": "🇶🇦", "r": "🇷🇴", "s": "🇸🇮", "t": "🇹🇿",
        "u": "🇺🇸", "v": "🇻🇮", "w": "🇼🇸", "x": "🇽🇮", "y": "🇾🇲", "z": "🇿🇦",
        "0": "0️⃣", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣", "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣", "9": "9️⃣",
        " ": "␣", ".": "🔘", ",": "❗", "!": "❕", "?": "❓", "@": "📧", "#": "♯", "$": "💲", "%": "💯"
    };
    const reverseEmojiMap = Object.fromEntries(Object.entries(emojiMap).map(([key, value]) => [value, key]));

    if (subCommand === "encode") {
        return text.split("").map(char => emojiMap[char] || char).join(" ");
    } else if (subCommand === "decode") {
        return text.split(" ").map(emoji => reverseEmojiMap[emoji] || emoji).join("");
    } else {
        throw new Error("Lệnh con không hợp lệ! Sử dụng 'encode' hoặc 'decode'.");
    }
}
