const GeminiReasoner = require("./models/GeminiReasoner");
const fs = require("fs-extra");
const path = require("path");

const apiKeysPath = path.join(__dirname, "json", "chatbot", "key.json");
let reasoner = null;

const loadReasoner = async () => {
  try {
    const data = await fs.readJson(apiKeysPath);
    const apiKey = data.api_keys[0];
    reasoner = new GeminiReasoner(apiKey);
    console.log("Reasoning engine initialized");
  } catch (error) {
    console.error("Failed to initialize reasoner:", error);
  }
};

loadReasoner();

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

    if (!reasoner) {
      return api.sendMessage(
        "⚠️ Hệ thống suy luận chưa sẵn sàng. Vui lòng thử lại sau.",
        threadID, messageID
      );
    }

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

      const analysis = await reasoner.analyze(query);
      const confidence = Math.round(analysis.confidence * 100);

      let response = "🧠 Kết quả phân tích:\n\n";
      response += analysis.reasoning;
      response += `\n\nĐộ tin cậy: ${confidence}%`;

      if (analysis.metadata.queryComplexity > 0.7) {
        const deeperAnalysis = await reasoner.chainThought(query);
        response += "\n\n📊 Phân tích sâu hơn:\n";
        response += deeperAnalysis.finalConclusion;
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
