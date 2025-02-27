const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const markdownpdf = require('markdown-pdf');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeysPath = path.join(__dirname, 'json', 'chatbot' , 'key.json');
let API_KEYS = [];

const loadAPIKeys = async () => {
  try {
    const data = await fs.readJson(apiKeysPath);
    API_KEYS = data.api_keys;
    API_KEYS = API_KEYS.filter(key => key && key.length > 0);
    if (API_KEYS.length === 0) throw new Error("No valid API keys found");
  } catch (error) {
    console.error("Error loading API keys:", error);
    API_KEYS = [];
  }
};

loadAPIKeys();

const processImage = async (attachment) => {
  try {
    const fileUrl = attachment.url;
    const cacheDir = path.join(__dirname, 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const tempFilePath = path.join(cacheDir, `temp_homework_${Date.now()}.jpg`);
    
    const response = await axios({
      url: fileUrl,
      responseType: 'arraybuffer'
    });
    
    await fs.writeFile(tempFilePath, Buffer.from(response.data));
    const fileData = await fs.readFile(tempFilePath);
    const base64Image = fileData.toString('base64');
    
    await fs.unlink(tempFilePath);
    
    return {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

const formatMathText = (text) => {
  return text

    .replace(/\$([^$]+)\$/g, (_, math) => {
      return math
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2')
        .replace(/\\sqrt{([^}]+)}/g, '√($1)')
        .replace(/\\mathbb{([^}]+)}/g, 'ℝ')
        .replace(/\\mathbb{N}/g, 'ℕ')
        .replace(/\\mathbb{Z}/g, 'ℤ')
        .replace(/\\mathbb{Q}/g, 'ℚ')
        .replace(/\\mathbb{R}/g, 'ℝ')
        .replace(/C_([^_]+)\^([^_]+)/g, 'C$1^$2') 
        .replace(/P_([^_]+)\^([^_]+)/g, 'P$1^$2') 
        .replace(/\\ge/g, '≥')
        .replace(/\\geq/g, '≥')
        .replace(/\\le/g, '≤')
        .replace(/\\leq/g, '≤')
        .replace(/\\in/g, '∈')
        .replace(/\\notin/g, '∉')
        .replace(/\\subset/g, '⊂')
        .replace(/\\supset/g, '⊃')
        .replace(/\\cup/g, '∪')
        .replace(/\\cap/g, '∩')
        .replace(/\\empty/g, '∅')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
    })
    .replace(/C_(\d+)\^(\d+)/g, 'C$1^$2')
    .replace(/P_(\d+)\^(\d+)/g, 'P$1^$2')

    .replace(/\\in\\mathbb{N}/g, '∈ℕ')
    .replace(/n\\in\\mathbb{N}/g, 'n∈ℕ')

    .replace(/,/g, '.')
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s*×\s*/g, ' × ')
    .replace(/\s*÷\s*/g, ' ÷ ')
    .replace(/≠/g, '≠')
    .replace(/≈/g, '≈')
    .replace(/≤/g, '≤')
    .replace(/≥/g, '≥')
    .replace(/∈/g, '∈')
    .replace(/∉/g, '∉')
    .replace(/∋/g, '∋')
    .replace(/∌/g, '∌')
    .replace(/⊂/g, '⊂')
    .replace(/⊃/g, '⊃')
    .replace(/⊆/g, '⊆')
    .replace(/⊇/g, '⊇')
    .replace(/∪/g, '∪')
    .replace(/∩/g, '∩')
    .replace(/∅/g, '∅')
    .replace(/∀/g, '∀')
    .replace(/∃/g, '∃')
    .replace(/∄/g, '∄')
    .replace(/∑/g, '∑')
    .replace(/∏/g, '∏')
    .replace(/∂/g, '∂')
    .replace(/∇/g, '∇')
    .replace(/∫/g, '∫')
    .replace(/∬/g, '∬')
    .replace(/∭/g, '∭')
    .replace(/∮/g, '∮')
    .replace(/∯/g, '∯')
    .replace(/∰/g, '∰')
    .replace(/∞/g, '∞')
    .replace(/∼/g, '∼')
    .replace(/∝/g, '∝')
    .replace(/∠/g, '∠')
    .replace(/∡/g, '∡')
    .replace(/∢/g, '∢')
    .replace(/√/g, '√')
    .replace(/∛/g, '∛')
    .replace(/∜/g, '∜')
    // Greek letters
    .replace(/α/g, 'α')
    .replace(/β/g, 'β')
    .replace(/γ/g, 'γ')
    .replace(/δ/g, 'δ')
    .replace(/ε/g, 'ε')
    .replace(/θ/g, 'θ')
    .replace(/λ/g, 'λ')
    .replace(/μ/g, 'μ')
    .replace(/π/g, 'π')
    .replace(/σ/g, 'σ')
    .replace(/φ/g, 'φ')
    .replace(/ω/g, 'ω')
   
    .replace(/<sup>([^<]+)<\/sup>/g, '^($1)')
    .replace(/\b(\d+)\^(\([^)]+\)|\d+)/g, '$1^$2')
    .replace(/([a-zA-Z])\^(\([^)]+\)|\d+)/g, '$1^$2')
    .replace(/(\d+)\s*:\s*(\d+)/g, '$1 ÷ $2')
    .replace(/(\d+)\s*\^\s*\((\d+)\)\s*:\s*(\d+)\s*\^\*\((\d+)\)/g, 
      (_, base1, exp1, base2, exp2) => `${base1}^(${exp1}) ÷ ${base2}^(${exp2})`)
    .replace(/\n\s*\n/g, '\n')
    .replace(/•/g, '▹')
    .replace(/━/g, '═')
    .replace(/\b(\d+)\s*\^\s*0\b/g, '1')
    .replace(/\b(\d+)\s*\^\s*1\b/g, '$1')
    .replace(/(\d+)[.,](\d+)/g, '$1.$2');
};

const analyzeHomework = async (apiKey, prompt, imagePart) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    const result = await model.generateContent([
      { text: `Hãy phân tích và giải bài tập này. Với các phép toán:
1. Trình bày rõ ràng từng bước một
2. Sử dụng dấu phẩy cho phần thập phân
3. Với phân số, sử dụng dấu / để ngăn cách tử số và mẫu số
4. Đánh số bài và câu rõ ràng

Bài tập: ${prompt}` },
      imagePart
    ]);

    const response = await result.response;
    return formatMathText(response.text());
  } catch (error) {
    console.error(`API Error with key ${apiKey.substring(0, 5)}...`, error.message);
    if (error.message.includes('quota') || 
        error.message.includes('rate') || 
        error.message.includes('limit') ||
        error.message.includes('Quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
};

const createPDFFile = async (solution) => {
  try {
    const timestamp = Date.now();
    const markdownDir = path.join(__dirname, 'solutions');
    const tempMdPath = path.join(markdownDir, `temp_${timestamp}.md`);
    const pdfPath = path.join(markdownDir, `solution_${timestamp}.pdf`);

    if (!fs.existsSync(markdownDir)) {
      fs.mkdirSync(markdownDir, { recursive: true });
    }
    
    const markdown = `# Lời Giải Bài Tập\n\n${solution}`;
    await fs.writeFile(tempMdPath, markdown, 'utf8');

    return new Promise((resolve, reject) => {
      markdownpdf()
        .from(tempMdPath)
        .to(pdfPath, () => {
          fs.remove(tempMdPath)
            .then(() => resolve(pdfPath))
            .catch(reject);
        });
    });
  } catch (error) {
    console.error("Error creating PDF file:", error);
    throw error;
  }
};

module.exports = {
  name: "homework",
  info: "Giải bài tập qua hình ảnh",
  dev: "HNT",
  category: "Tiện Ích",
  usedby: 0,
  onPrefix: true,
  dmUser: false,
  cooldowns: 30,

  onLaunch: async function({ api, event, target }) {
    const { threadID, messageID, type, messageReply } = event;
    const prompt = target.join(" ").trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("⚠️ Vui lòng reply một hình ảnh bài tập cần giải!", threadID, messageID);
    }

    const attachment = messageReply.attachments.find(att => 
      att.type === "photo" || att.type === "image"
    );

    if (!attachment) {
      return api.sendMessage("⚠️ Vui lòng chỉ gửi hình ảnh!", threadID, messageID);
    }

    const loadingMsg = await api.sendMessage("⏳ Đang phân tích bài tập...", threadID, messageID);

    try {
      const imagePart = await processImage(attachment);
      let solution = null;
      let lastError = null;
      let quotaExceededCount = 0;

      for (const apiKey of API_KEYS) {
        try {
          solution = await analyzeHomework(apiKey, prompt, imagePart);
          if (solution) break;
        } catch (error) {
          lastError = error;
          if (error.message === 'QUOTA_EXCEEDED') {
            quotaExceededCount++;
            if (quotaExceededCount === API_KEYS.length) {
              throw new Error("Tất cả API keys đều đã hết quota. Vui lòng thử lại sau.");
            }
            continue;
          }
          console.error(`API Key ${apiKey.substring(0, 5)}... error:`, error.message);
        }
      }

      if (!solution) {
        throw lastError || new Error("Không thể phân tích bài tập");
      }

      const pdfPath = await createPDFFile(solution);
      
      await api.sendMessage({
        body: "📝 Lời giải chi tiết đã được đính kèm trong file PDF:",
        attachment: fs.createReadStream(pdfPath)
      }, threadID, messageID);

      setTimeout(() => {
        fs.unlink(pdfPath).catch(console.error);
      }, 5000);
      
    } catch (error) {
      console.error("Homework analysis error:", error);
      const errorMessage = error.message.includes('quota') || error.message.includes('Tất cả API keys') 
        ? "⚠️ Hệ thống đang quá tải. Vui lòng thử lại sau ít phút!"
        : "❌ Đã xảy ra lỗi khi phân tích bài tập. Vui lòng thử lại sau!";
      
      await api.sendMessage(errorMessage, threadID, messageID);
    } finally {
      api.unsendMessage(loadingMsg.messageID);
    }
  }
};
