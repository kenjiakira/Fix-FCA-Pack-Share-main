module.exports = {
    name: "emoji",
    dev: "HNT",
    usedby: 0,
    info: "Mã hóa và giải mã văn bản thành Emoji.",
    onPrefix: true,
    usages: ".emoji encode [văn bản] | .emoji decode [emoji]: Mã hóa và giải mã văn bản thành Emoji.",
    cooldowns: 0,

    onLaunch: async function({ api, event, target = [] }) {
        const { threadID, messageID } = event;

        if (target.length === 0) {
            return api.sendMessage("❎ Vui lòng nhập lệnh đúng định dạng: .emojiencode encode [văn bản] | .emojiencode decode [emoji].", threadID, messageID);
        }

        const command = target[0].toLowerCase();
        const emojiMap = {
            "a": "🅰️", "b": "🅱️", "c": "🇨🇦", "d": "🇩🇪", "e": "🇪🇸", "f": "🇫🇷", "g": "🇬🇷", "h": "🇭🇺", "i": "🇮🇹", "j": "🇯🇱",
            "k": "🇰🇷", "l": "🇱🇸", "m": "🇲🇾", "n": "🇳🇬", "o": "🅾️", "p": "🅿️", "q": "🇶🇦", "r": "🇷🇴", "s": "🇸🇮", "t": "🇹🇿",
            "u": "🇺🇸", "v": "🇻🇮", "w": "🇼🇸", "x": "🇽🇮", "y": "🇾🇲", "z": "🇿🇦",
            "0": "0️⃣", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣", "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣", "9": "9️⃣",
            " ": "␣", ".": "🔘", ",": "❗", "!": "❕", "?": "❓", "@": "📧", "#": "♯", "$": "💲", "%": "💯"
        };

        const reverseEmojiMap = Object.fromEntries(Object.entries(emojiMap).map(([key, value]) => [value, key]));

        if (command === "encode") {
            const inputText = target.slice(1).join(" ").toLowerCase();
            let encodedText = "";

            for (let char of inputText) {
                if (emojiMap[char]) {
                    encodedText += emojiMap[char] + " ";
                } else {
                    encodedText += char + " ";
                }
            }

            return api.sendMessage(`${encodedText}`, threadID, messageID);
        } else if (command === "decode") {
            const emojiText = target.slice(1).join(" ");
            const emojiArray = emojiText.split(" ");
            let decodedText = "";

            for (let emoji of emojiArray) {
                if (reverseEmojiMap[emoji]) {
                    decodedText += reverseEmojiMap[emoji];
                } else {
                    decodedText += emoji; 
                }
            }

            return api.sendMessage(`${decodedText}`, threadID, messageID);
        } else {
            return api.sendMessage("❎ Lệnh không hợp lệ. Vui lòng sử dụng .emoji encode [văn bản] | .emoji decode [emoji].", threadID, messageID);
        }
    }
};
