const OpenAI = require("openai");
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const GPT_API_KEY = process.env.OPENAI_API_KEY;

if (!GPT_API_KEY) {
    console.error("❌ OPENAI_API_KEY không tìm thấy trong file .env!");
    console.error("🔧 Vui lòng thêm OPENAI_API_KEY vào file .env");
}

// Cấu hình mặc định cho từng loại request
const DEFAULT_CONFIGS = {
    creative: {
        temperature: 1.2,
        max_tokens: 1000,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
    },
    analytical: {
        temperature: 0.7,
        max_tokens: 1500,
        presence_penalty: 0.3,
        frequency_penalty: 0.1
    },
    conversational: {
        temperature: 0.9,
        max_tokens: 800,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
    },
    educational: {
        temperature: 0.6,
        max_tokens: 1200,
        presence_penalty: 0.2,
        frequency_penalty: 0.1
    },
    fun: {
        temperature: 1.1,
        max_tokens: 600,
        presence_penalty: 0.8,
        frequency_penalty: 0.5
    }
};

/**
 * Hook API GPT tổng hợp
 * @param {Object} options - Cấu hình request
 * @param {string} options.prompt - Prompt chính
 * @param {string} options.systemPrompt - System prompt (optional)
 * @param {string} options.type - Loại request: creative, analytical, conversational, educational, fun
 * @param {Object} options.config - Cấu hình tùy chỉnh (optional)
 * @param {Array} options.usedContent - Nội dung đã sử dụng để tránh lặp (optional)
 * @param {string} options.context - Context bổ sung (optional)
 * @returns {Promise<string>} Response từ GPT
 */
const useGPT = async (options) => {
    const {
        prompt,
        systemPrompt = "",
        type = "conversational",
        config = {},
        usedContent = [],
        context = ""
    } = options;

    if (!prompt) {
        throw new Error("Prompt is required");
    }

    if (!GPT_API_KEY) {
        throw new Error("OpenAI API key not configured in .env file");
    }

    // Merge cấu hình
    const finalConfig = {
        ...DEFAULT_CONFIGS[type] || DEFAULT_CONFIGS.conversational,
        ...config
    };

    // Tạo system prompt đầy đủ
    const fullSystemPrompt = buildSystemPrompt(systemPrompt, type, usedContent, context);

    try {
        return await callGPT(prompt, fullSystemPrompt, finalConfig);
    } catch (error) {
        console.error(`Error with GPT:`, error);
        throw error;
    }
};

/**
 * Tạo system prompt dựa trên type và context
 */
const buildSystemPrompt = (customPrompt, type, usedContent, context) => {
    let basePrompt = "";

    switch (type) {
        case "creative":
            basePrompt = "Bạn là một AI sáng tạo, có khả năng tạo ra nội dung độc đáo và thú vị.";
            break;
        case "analytical":
            basePrompt = "Bạn là một AI phân tích, chuyên về logic và suy luận.";
            break;
        case "conversational":
            basePrompt = "Bạn là một AI thân thiện, nói chuyện tự nhiên như con người.";
            break;
        case "educational":
            basePrompt = "Bạn là một giáo viên AI, giỏi giải thích khái niệm phức tạp một cách đơn giản.";
            break;
        case "fun":
            basePrompt = "Bạn là một AI vui vẻ, hài hước và giải trí.";
            break;
    }

    let fullPrompt = basePrompt;

    if (customPrompt) {
        fullPrompt += "\n\n" + customPrompt;
    }

    if (context) {
        fullPrompt += "\n\nContext: " + context;
    }

    if (usedContent.length > 0) {
        fullPrompt += "\n\nĐã sử dụng trước đó (TRÁNH LẶP LẠI):\n" + usedContent.join("\n");
    }

    fullPrompt += "\n\nHãy trả lời bằng tiếng Việt, tự nhiên và phù hợp với ngữ cảnh.";

    return fullPrompt;
};

/**
 * Gọi GPT API
 */
const callGPT = async (prompt, systemPrompt, config) => {
    const openai = new OpenAI({
        apiKey: GPT_API_KEY
    });

    const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        presence_penalty: config.presence_penalty,
        frequency_penalty: config.frequency_penalty
    });

    return result.choices[0].message.content.trim();
};

/**
 * Hook đặc biệt cho tránh lặp lại nội dung
 */
const useGPTWithHistory = async (options) => {
    const { historyFile, maxHistory = 100 } = options;

    let history = [];
    if (historyFile && fs.existsSync(historyFile)) {
        try {
            history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (error) {
            console.warn("Could not load history:", error);
        }
    }

    // Thêm history vào usedContent
    const usedContent = history.map(item => item.content || item.response || item).slice(-10);
    
    const response = await useGPT({
        ...options,
        usedContent: [...(options.usedContent || []), ...usedContent]
    });

    // Lưu response vào history
    if (historyFile) {
        history.push({
            content: response,
            timestamp: Date.now()
        });

        // Giới hạn số lượng history
        if (history.length > maxHistory) {
            history = history.slice(-maxHistory);
        }

        try {
            const dir = path.dirname(historyFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
        } catch (error) {
            console.warn("Could not save history:", error);
        }
    }

    return response;
};

/**
 * Hook cho streaming response (tương lai)
 */
const useGPTStream = async (options, onChunk) => {
    // TODO: Implement streaming
    const response = await useGPT(options);
    if (onChunk) {
        onChunk(response);
    }
    return response;
};

/**
 * Utility function để format response
 */
const formatResponse = (response, format = "plain") => {
    switch (format) {
        case "markdown":
            return response; // Already in markdown
        case "plain":
            return response.replace(/[*_`#]/g, "");
        case "html":
            return response
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/`(.*?)`/g, "<code>$1</code>");
        default:
            return response;
    }
};

/**
 * Batch processing multiple prompts
 */
const useGPTBatch = async (prompts, options = {}) => {
    const results = [];
    
    for (const prompt of prompts) {
        try {
            const response = await useGPT({
                ...options,
                prompt
            });
            results.push({ success: true, response });
            
            // Delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    
    return results;
};

module.exports = {
    useGPT,
    useGPTWithHistory,
    useGPTStream,
    useGPTBatch,
    formatResponse,
    DEFAULT_CONFIGS
};