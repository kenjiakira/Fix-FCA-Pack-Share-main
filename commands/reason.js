const { useGPT } = require("../utils/gptHook");

module.exports = {
  name: "reason",
  usedby: 0,
  onPrefix: true,
  category: "AI",
  info: "Sử dụng trí tuệ nhân tạo để phân tích và suy luận",
  usages: "[câu hỏi hoặc vấn đề cần phân tích]",
  cooldowns: 15,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID } = event;

    if (!target[0]) {
      return api.sendMessage(
        "⚠️ Vui lòng đưa ra vấn đề cần phân tích.", 
        threadID, messageID
      );
    }

    const query = target.join(" ");
    try {
      const msg = await api.sendMessage(
        "🤔 Đang phân tích...", 
        threadID, messageID
      );

      const analysis = await useGPT({
        prompt: `Hãy phân tích vấn đề sau một cách logic và chi tiết: "${query}"
        
Yêu cầu:
1. Phân tích các khía cạnh chính của vấn đề
2. Đưa ra lý lẽ rõ ràng và có logic
3. Đánh giá độ tin cậy của kết luận
4. Nếu vấn đề phức tạp, hãy phân tích từng bước`,
        
        systemPrompt: `Bạn là một chuyên gia phân tích và suy luận logic. Hãy:
- Phân tích vấn đề một cách có hệ thống
- Đưa ra lý lẽ rõ ràng và logic
- Đánh giá độ tin cậy của kết luận (từ 1-100%)
- Sử dụng ngôn ngữ chuyên nghiệp nhưng dễ hiểu`,
        
        type: "analytical"
      });

      const isComplex = query.length > 100 || query.split(' ').length > 15;
      let response = "🧠 Kết quả phân tích:\n\n" + analysis;

      if (isComplex) {
        const deeperAnalysis = await useGPT({
          prompt: `Dựa trên phân tích ban đầu, hãy đưa ra kết luận sâu sắc hơn về: "${query}"
          
Phân tích ban đầu: ${analysis}

Yêu cầu thêm:
- Đưa ra góc nhìn mới hoặc khía cạnh chưa được đề cập
- Kết luận tổng hợp cuối cùng
- Đề xuất hành động (nếu có)`,
          
          systemPrompt: "Bạn là chuyên gia tư vấn, hãy đưa ra kết luận sâu sắc và đề xuất thực tế.",
          type: "analytical"
        });
        
        response += "\n\n📊 Phân tích sâu hơn:\n" + deeperAnalysis;
      }

      return api.editMessage(response, msg.messageID);

    } catch (error) {
      console.error("Reasoning error:", error);
      return api.sendMessage(
        "❌ Có lỗi xảy ra trong quá trình phân tích. Vui lòng thử lại sau.",
        threadID, messageID
      );
    }
  }
};
