const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STYLES = {
    anime: "(phong cách anime), (chi tiết), màu sắc sống động",
    fantasy: "(nghệ thuật kỳ ảo), ma thuật, huyền bí, hiệu ứng phát sáng",
    realistic: "(phong cách thực tế), ánh sáng chi tiết, nhiếp ảnh chuyên nghiệp",
    watercolor: "(phong cách màu nước), màu sắc nhẹ nhàng, nghệ thuật, vẽ",
    scifi: "(phong cách khoa học viễn tưởng), tương lai, công nghệ, bóng bẩy"
};

const BANNED_WORDS = [
    "nsfw", "nude", "naked", "sex", "porn", "hentai", "xxx", "18+", "adult",
    "khỏa thân", "ngực", "váy ngắn", "bikini", "áo lót", "nội y",
    "sexy", "erotic", "lewd", "blood", "gore", "violence",
    "pussy", "loli", "shota", "yaoi", "yuri", "harem",
    "dick", "cock" ,
    "kill", "murder", "death", "suicide", "drugs", "bạo lực",
    "ma túy", "tự tử", "giết người", "máu me", "đồ lót",
    "khiêu dâm", "tiêu cực", "phản cảm", "nhạy cảm"
];

module.exports = {
    name: "artgen",
    dev: "HNT",
    category: "Media",
    info: "Tạo ảnh AIu",
    usedby: 0,
    dmUser: false,
    onPrefix: true,
    usages: ".artgen <prompt> | .artgen style <phong cách> <prompt>",
    cooldowns: 30,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target || target.length === 0) {
            return api.sendMessage(
                "🎨 Hướng dẫn sử dụng ARTGEN:\n\n" +
                "1. Tạo ảnh bình thường:\n.artgen <mô tả ảnh>\n" +
                "2. Tạo ảnh theo phong cách:\n.artgen style <phong cách> <mô tả ảnh>\n\n" +
                "Các phong cách có sẵn:\n" +
                "- anime: Phong cách anime Nhật Bản\n" +
                "- fantasy: Nghệ thuật kỳ ảo\n" +
                "- realistic: Phong cách thực tế\n" +
                "- watercolor: Màu nước nghệ thuật\n" +
                "- scifi: Khoa học viễn tưởng\n\n" +
                "Ví dụ:\n.artgen một cô gái dưới trăng\n.artgen style anime một cô gái dưới trăng",
                threadID, messageID
            );
            return;
        }

        let prompt;
        let stylePrefix = "";

        if (target[0].toLowerCase() === "style") {
            const style = target[1]?.toLowerCase();
            if (!style || !STYLES[style]) {
                return api.sendMessage("❌ Phong cách không hợp lệ! Sử dụng .artgen để xem danh sách phong cách.", threadID, messageID);
            }
            stylePrefix = STYLES[style];
            prompt = target.slice(2).join(" ");
        } else {
            prompt = target.join(" ");
        }

        if (!prompt) {
            return api.sendMessage("❌ Vui lòng nhập mô tả cho bức ảnh!", threadID, messageID);
        }

        const promptLower = prompt.toLowerCase();
        const foundBannedWords = BANNED_WORDS.filter(word => promptLower.includes(word));
        
        if (foundBannedWords.length > 0) {
            return api.sendMessage(
                `⚠️ Prompt của bạn chứa từ ngữ không phù hợp!\n` +
                `🚫 Từ không được phép: ${foundBannedWords.join(", ")}\n` +
                `📝 Vui lòng sử dụng ngôn từ phù hợp và thử lại.`,
                threadID, messageID
            );
        }

        const loadingMessage = await api.sendMessage(
            "🎨 Đang vẽ tác phẩm nghệ thuật của bạn...\n" +
            "⏳ Vui lòng đợi khoảng 30-60 giây\n" +
            "💫 Hãy kiên nhẫn một chút nhé!", 
            threadID, messageID
        );

        try {
            const finalPrompt = stylePrefix ? `${stylePrefix}, ${prompt}` : prompt;
            const encodedPrompt = encodeURIComponent(finalPrompt);
            const url = `https://zaikyoo.onrender.com/api/aurora?prompt=${encodedPrompt}`;
            
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            
            const imagePath = path.join(__dirname, 'cache', `artgen_${Date.now()}.png`);
            fs.writeFileSync(imagePath, response.data);

            await api.sendMessage({
                body: `🎨 Đây là tác phẩm của bạn:\n━━━━━━━━━━━━\n🔍 Prompt: ${prompt}\n${stylePrefix ? `🎭 Style: ${target[1]}\n` : ""}`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                api.unsendMessage(loadingMessage.messageID);
                fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error(error);
            api.unsendMessage(loadingMessage.messageID);
            api.sendMessage("❌ Đã có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau!", threadID, messageID);
        }
    }
};
