const axios = require('axios');

module.exports = {
    name: "ddg",
    dev: "HNT",
    info: "Tìm kiếm thông tin trên mạng",
    usedby: 0,
    dmUser: false,
    onPrefix: true,
    usages: ".ddg <từ khóa tìm kiếm>",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;

        if (!target || target.length === 0) {
            return api.sendMessage(
                "📚 HƯỚNG DẪN TÌM KIẾM:\n\n" +
                "💡 Cách dùng: .ddg <từ khóa>\n" +
                "📝 Ví dụ: .ddg lịch sử Việt Nam\n\n" +
                "🌐 Hỗ trợ tìm kiếm:\n" +
                "- Tiếng Việt\n" +
                "- Tiếng Anh\n" +
                "- Thông tin toàn cầu",
                threadID, messageID
            );
        }

        const query = target.join(" ");
        const loadingMsg = await api.sendMessage("🔎 Đang tìm kiếm thông tin...\n⏳ Vui lòng đợi trong giây lát", threadID, messageID);

        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await axios.get(`https://zaikyoo.onrender.com/api/search?query=${encodedQuery}`);
            
            if (response.data && response.data.answer) {
                const result = response.data;
                let message = "🔍 KẾT QUẢ TÌM ĐƯỢC:\n\n";
                
                if (result.answer) {
                    message += `📝 Nội dung:\n${result.answer}\n\n`;
                }
                if (result.source) {
                    message += `🔗 Nguồn tham khảo: ${result.source}\n`;
                }

                if (result.related && result.related.length > 0) {
                    message += "\n📌 Chủ đề liên quan:\n";
                    result.related.slice(0, 3).forEach((topic, index) => {
                        message += `${index + 1}. ${topic}\n`;
                    });
                }

                await api.sendMessage(message, threadID, messageID);
            } else {
                await api.sendMessage(
                    "❌ Không tìm thấy thông tin cho từ khóa này.\n" +
                    "💡 Hãy thử:\n" +
                    "- Dùng từ khóa khác\n" +
                    "- Thêm chi tiết vào câu hỏi\n" +
                    "- Kiểm tra lỗi chính tả",
                    threadID, messageID
                );
            }

        } catch (error) {
            console.error("DDG Search error:", error);
            await api.sendMessage(
                "❌ Đã xảy ra lỗi trong quá trình tìm kiếm.\n" +
                "Vui lòng thử lại sau!",
                threadID, messageID
            );
        }

        api.unsendMessage(loadingMsg.messageID);
    }
};
