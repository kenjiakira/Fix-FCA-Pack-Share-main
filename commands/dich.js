const axios = require('axios');
const translate = require('translate-google');

module.exports = {
    name: "dich",
    dev: "HNT",
    usedby: 0,
    info: "Dịch văn bản qua nhiều ngôn ngữ", 
    usages: "dich [ngôn ngữ] [nội dung] hoặc reply",
    cooldowns: 5,

    langCodes: {
        'việt': 'vi',
        'v': 'vi',
        'anh': 'en',
        'a': 'en',
        'nhật': 'ja', 
        'n': 'ja',
        'hàn': 'ko',
        'h': 'ko',
        'trung': 'zh',
        't': 'zh',
        'pháp': 'fr',
        'p': 'fr',
        'đức': 'de',
        'nga': 'ru',
        'ý': 'it',
        'tbn': 'es', // Tây Ban Nha
        'tl': 'th', // Thái Lan
        'indo': 'id'
    },

    async translate(text, targetLang = 'vi') {
        try {
            const result = await translate(text, {
                to: targetLang,
                autoCorrect: true
            });
            return result;
        } catch (err) {
            if (err.code === 'BAD_NETWORK') {
                throw new Error("Lỗi kết nối mạng!");
            }
            throw err;
        }
    },

    getLanguageCode(input) {
        input = input.toLowerCase().trim();
        return this.langCodes[input] || input;
    },

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        
        // Nếu không có tham số, hiển thị hướng dẫn
        if (!target[0] && !event.messageReply) {
            return api.sendMessage(
                "🌐 DỊCH THUẬT 🌐\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách dùng:\n" +
                "1. Dịch bình thường:\n" + 
                "   dich [ngôn ngữ] [nội dung]\n" +
                "   VD: dich anh xin chào\n\n" +
                "2. Dịch qua reply:\n" +
                "   Reply tin nhắn + dich [ngôn ngữ]\n" +
                "   VD: dich nhật\n\n" +
                "Ngôn ngữ hỗ trợ:\n" +
                "- Việt (v)\n- Anh (a)\n- Nhật (n)\n" +
                "- Hàn (h)\n- Trung (t)\n- Pháp (p)\n" +
                "- Đức (de)\n- Nga (ru)\n- Ý (it)\n" +
                "- Tây Ban Nha (tbn)\n- Thái (tl)\n" +
                "- Indonesia (indo)",
                threadID
            );
        }

        try {
            let langCode = 'vi';
            let content = '';

            // Xử lý reply
            if (event.messageReply) {
                langCode = this.getLanguageCode(target[0] || 'việt');
                content = event.messageReply.body;
            }
            // Xử lý lệnh trực tiếp
            else {
                langCode = this.getLanguageCode(target[0]);
                content = target.slice(1).join(" ");
                
                // Nếu không có ngôn ngữ, mặc định dịch sang tiếng Việt
                if (!content) {
                    content = target.join(" ");
                    langCode = 'vi';
                }
            }

            if (!content) {
                return api.sendMessage("❌ Vui lòng nhập nội dung cần dịch!", threadID);
            }

            const translated = await this.translate(content, langCode);
            return api.sendMessage(
                `📝 Văn bản gốc:\n${content}\n\n` +
                `🌐 Bản dịch (${langCode}):\n${translated}`,
                threadID
            );

        } catch (err) {
            return api.sendMessage(
                `❌ Lỗi: ${err.message || "Không thể dịch văn bản này"}`, 
                threadID
            );
        }
    }
};
