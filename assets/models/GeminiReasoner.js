const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiReasoner {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.reasoningModel = this.genAI.getGenerativeModel({
            model: "gemini-2.5-pro-exp-03-25",
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
                topK: 1,
                topP: 0.8,
            }
        });
    }
    async analyze(query, context = {}) {
        const systemPrompt = `Bạn là một công cụ suy luận logic. Hãy phân tích truy vấn sau bằng cách:

1. Xác định các giả định ban đầu  
2. Áp dụng khung logic  
3. Đánh giá phê phán các bằng chứng  
4. Xem xét các giải thích thay thế  
5. Tổng hợp kết luận  

Yêu cầu:  
- Các bước lập luận rõ ràng  
- Phân tích khách quan  
- Lập luận dựa trên bằng chứng  
- Cân nhắc yếu tố bất định  
- Đầu ra có cấu trúc`;

        const fullPrompt = `${systemPrompt}\n\nQuery: ${query}\nContext: ${JSON.stringify(context)}\n\nAnalysis:`;

        try {
            const result = await this.reasoningModel.generateContent({
                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    stopSequences: ["Analysis complete."],
                }
            });

            return {
                reasoning: result.response.text(),
                confidence: this._calculateConfidence(result),
                metadata: {
                    model: "gemini-1.5-pro",
                    timestamp: Date.now(),
                    queryComplexity: this._assessComplexity(query)
                }
            };
        } catch (error) {
            console.error("Reasoning error:", error);
            throw new Error("Failed to perform reasoning analysis");
        }
    }

    async chainThought(initialQuery, steps = 3) {
        let thoughts = [];
        let currentQuery = initialQuery;

        for (let i = 0; i < steps; i++) {
            const result = await this.analyze(currentQuery, {
                previousThoughts: thoughts,
                stepNumber: i + 1,
                totalSteps: steps
            });

            thoughts.push(result.reasoning);
            currentQuery = this._generateNextQuery(result.reasoning);
        }

        return {
            thoughtChain: thoughts,
            finalConclusion: this._synthesizeConclusions(thoughts)
        };
    }

    _calculateConfidence(result) {
        const response = result.response.text();
        const indicators = {
            hasLogicalStructure: /if|then|therefore|because/i.test(response),
            includesEvidence: /evidence|data|research|study/i.test(response),
            acknowledgesUncertainty: /may|might|could|possibly/i.test(response),
            providesAlternatives: /alternatively|however|on the other hand/i.test(response)
        };

        return Object.values(indicators).filter(Boolean).length / 4;
    }

    _assessComplexity(query) {
        const factors = {
            length: query.length / 100,
            logicalOperators: (query.match(/if|and|or|but|therefore/gi) || []).length,
            questionWords: (query.match(/what|why|how|when|where|who/gi) || []).length,
            specializedTerms: (query.match(/[A-Z][a-z]{8,}|[a-z]{10,}/g) || []).length
        };

        return Math.min(1, Object.values(factors).reduce((a, b) => a + b, 0) / 10);
    }

    _generateNextQuery(previousReasoning) {
        const patterns = [
            "What are the implications of",
            "How does this relate to",
            "What evidence supports",
            "What alternatives exist for",
            "What are the potential consequences of"
        ];

        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        return `${pattern} the following insight: ${previousReasoning.slice(0, 100)}...`;
    }

    _synthesizeConclusions(thoughts) {
        return thoughts
            .map((thought, index) => `Step ${index + 1}: ${thought.split('.')[0]}.`)
            .join('\n');
    }
}

module.exports = GeminiReasoner;
