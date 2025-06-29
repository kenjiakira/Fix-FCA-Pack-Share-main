
const path = require('path');
const fs = require('fs-extra');

class AdvancedNLP {
    constructor() {
        this.dictionaries = {
            slang: {},
            emotions: {},
            stopwords: new Set(),
            entities: {},
            intents: {},
            synonyms: {},
        };

        this.models = {
            sentiment: null,
            intent: null,
            entity: null,
        };

        this.cachedAnalysis = new Map();
        this.maxCacheSize = 1000;

        this.conversationContext = new Map();
        this.userLanguagePatterns = new Map();
    }

    /**
     * Initializes the NLP system with dictionaries and models
     */
    async initialize() {
        try {
            const dictionaryPath = path.join(__dirname, "..", "database", "nlp");

            if (!fs.existsSync(dictionaryPath)) {
                fs.mkdirSync(dictionaryPath, { recursive: true });
                await this._createDefaultDictionaries(dictionaryPath);
            }

            this.dictionaries.slang = await fs
                .readJson(path.join(dictionaryPath, "slang.json"))
                .catch(() => ({}));

            this.dictionaries.emotions = await fs
                .readJson(path.join(dictionaryPath, "emotions.json"))
                .catch(() => ({}));

            const stopwords = await fs
                .readJson(path.join(dictionaryPath, "stopwords_vi.json"))
                .catch(() => ({ words: [] }));
            this.dictionaries.stopwords = new Set(stopwords.words);

            this.dictionaries.entities = await fs
                .readJson(path.join(dictionaryPath, "entities.json"))
                .catch(() => ({}));

            this.dictionaries.intents = await fs
                .readJson(path.join(dictionaryPath, "intents.json"))
                .catch(() => ({}));

            this.dictionaries.synonyms = await fs
                .readJson(path.join(dictionaryPath, "synonyms.json"))
                .catch(() => ({}));

            await this._initializeModels();

            console.log("AdvancedNLP system initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing NLP system:", error);
            return false;
        }
    }

    /**
     * Creates default dictionaries if they don't exist
     */
    async _createDefaultDictionaries(dictionaryPath) {
        const defaultSlang = {
            mk: "mình",
            ng: "người",
            trc: "trước",
            ck: "chồng",
            vk: "vợ",
            cty: "công ty",
            đc: "được",
            ko: "không",
            kh: "không",
            kg: "không",
            tl: "trả lời",
            nt: "nhắn tin",
            ny: "người yêu",
            mn: "mọi người",
            k: "không",
            cx: "cũng",
            vs: "với",
            vậy: "vâỵ",
            ntn: "như thế nào",
            sao: "sao",
            ns: "nói",
            nch: "nói chuyện",
            nc: "nói chuyện",
            bn: "bao nhiêu",
            nma: "nhưng mà",
            dc: "được",
            vn: "Việt Nam",
            tq: "Trung Quốc",
            mng: "mọi người",
            lm: "làm",
            clg: "cái lồn gì",
            đhs: "đéo hiểu sao",
            đm: "địt mẹ",
            cmn: "con mẹ nó",
            vcl: "vãi cả lồn",
            cc: "cặc",
            cl: "cái lồn",
            wtf: "what the fuck",
            đách: "không",
            edge: "éo",
            eo: "éo",
            loz: "lồn",
            đait: "đấy",
            đlm: "đéo mẹ",
            đcmm: "địt con mẹ mày",
            tht: "tht",
        };

        const defaultEmotions = {
            positive: [
                "vui",
                "thích",
                "yêu",
                "hạnh phúc",
                "sung sướng",
                "phấn khởi",
                "hài lòng",
                "thỏa mãn",
                "thoải mái",
                "hân hoan",
                "phấn chấn",
                "thú vị",
                "đam mê",
                "hài hước",
                "ngon",
                "tốt",
                "đẹp",
                "hay",
                "giỏi",
                "xuất sắc",
                "tuyệt vời",
                "thành công",
                "may mắn",
                "phúc",
                "phát đạt",
                "khỏe",
                "xinh",
                "đáng yêu",
                "cute",
            ],
            negative: [
                "buồn",
                "giận",
                "sợ",
                "lo",
                "khổ",
                "đau",
                "nhớ",
                "ghen",
                "tị",
                "chán",
                "tệ",
                "thất vọng",
                "tức giận",
                "căng thẳng",
                "lo lắng",
                "tuyệt vọng",
                "thù hận",
                "ghen tị",
                "xấu hổ",
                "tội lỗi",
                "bực",
                "khó chịu",
                "xui",
                "rủi",
                "bệnh",
                "yếu",
                "dở",
                "kém",
                "tầm thường",
                "thất bại",
                "sai",
                "hỏng",
                "xấu",
                "dở",
                "gớm",
                "ghét",
            ],
            neutral: [
                "bình thường",
                "bình tĩnh",
                "ổn",
                "trung lập",
                "thường",
                "vừa",
                "cân bằng",
                "trung bình",
                "tạm",
                "tạm được",
                "không sao",
                "được",
                "ổn định",
                "bình ổn",
                "không vui không buồn",
                "không ghét không thích",
                "không tốt không xấu",
            ],
            intensifiers: {
                rất: 1.5,
                "cực kỳ": 2.0,
                "vô cùng": 2.0,
                "hết sức": 1.8,
                quá: 1.5,
                siêu: 2.0,
                cực: 1.8,
                "đặc biệt": 1.5,
                "vô cùng": 2.0,
                "khủng khiếp": 2.0,
            },
            negations: [
                "không",
                "chẳng",
                "chả",
                "đâu",
                "đách",
                "chưa",
                "đéo",
                "méo",
                "éo",
                "đéo phải",
                "không hề",
                "không phải",
                "chẳng phải",
            ],
        };

        const defaultStopwords = {
            words: [
                "và",
                "hoặc",
                "thì",
                "mà",
                "là",
                "của",
                "đến",
                "từ",
                "với",
                "trong",
                "ngoài",
                "về",
                "cho",
                "bởi",
                "bằng",
                "cùng",
                "theo",
                "tại",
                "trên",
                "dưới",
                "như",
                "nhưng",
                "nên",
                "vì",
                "nếu",
                "khi",
                "để",
                "đã",
                "sẽ",
                "đang",
                "được",
                "bị",
                "cần",
                "có",
                "không",
                "này",
                "đó",
                "kia",
                "những",
                "các",
                "một",
                "hai",
                "ba",
                "bốn",
                "năm",
                "nhiều",
                "ít",
                "rất",
                "mình",
                "tôi",
                "tao",
                "tớ",
                "anh",
                "chị",
                "em",
                "bạn",
                "mày",
                "bác",
                "ai",
                "gì",
                "nào",
                "sao",
                "vậy",
                "nhé",
                "ạ",
                "à",
                "ư",
                "ừ",
                "rồi",
            ],
        };

        const defaultEntities = {
            time: {
                patterns: [
                    "\\d{1,2}:\\d{1,2}",
                    "\\d{1,2} giờ",
                    "\\d{1,2} giờ \\d{1,2}",
                    "\\d{1,2} phút",
                    "\\d{1,2}h\\d{0,2}",
                    "sáng|trưa|chiều|tối|đêm|khuya",
                    "hôm nay|ngày mai|hôm qua|tuần tới|tuần trước|tháng này|tháng sau",
                ],
            },
            date: {
                patterns: [
                    "\\d{1,2}/\\d{1,2}/\\d{2,4}",
                    "\\d{1,2}-\\d{1,2}-\\d{2,4}",
                    "\\d{1,2} tháng \\d{1,2}( năm \\d{2,4})?",
                    "ngày \\d{1,2} tháng \\d{1,2}( năm \\d{2,4})?",
                ],
            },
            money: {
                patterns: [
                    "\\d+k",
                    "\\d+đ",
                    "\\d+ nghìn",
                    "\\d+ triệu",
                    "\\d+ tỷ",
                    "\\d+ xu",
                    "\\d+VND",
                    "\\d+₫",
                    "\\d+USD",
                    "\\$\\d+",
                ],
            },
            phone: {
                patterns: ["\\d{10,11}", "\\+\\d{1,3}\\d{8,10}"],
            },
            email: {
                patterns: ["[\\w.-]+@[\\w.-]+\\.[\\w]+"],
            },
            url: {
                patterns: [
                    "https?://[\\w.-]+\\.[\\w]+(/[\\w./-]*)?",
                    "www\\.[\\w.-]+\\.[\\w]+(/[\\w./-]*)?",
                ],
            },
            location: {
                keywords: [
                    "tại",
                    "ở",
                    "trong",
                    "ngoài",
                    "trên",
                    "dưới",
                    "quận",
                    "huyện",
                    "phường",
                    "xã",
                    "thành phố",
                    "tỉnh",
                    "làng",
                    "đường",
                    "phố",
                    "quốc lộ",
                    "ngã tư",
                    "ngã ba",
                    "vòng xoay",
                ],
            },
            person: {
                prefixes: [
                    "anh",
                    "chị",
                    "em",
                    "cô",
                    "chú",
                    "bác",
                    "ông",
                    "bà",
                    "thầy",
                    "cô",
                ],
                patterns: [
                    "[A-ZÁÀẠÃẢẮẰẲẴẶÂẤẦẨẪẬĐÉÈẸẺẼÊẾỀỂỄỆÍÌỊỈĨÓÒỌỎÕÔỐỒỔỖỘƠỚỜỞỠỢÚÙỤỦŨƯỨỪỬỮỰÝỲỴỶỸ][a-záàạãảắằẳẵặâấầẩẫậđéèẹẻẽêếềểễệíìịỉĩóòọỏõôốồổỗộơớờởỡợúùụủũưứừửữựýỳỵỷỹ]+",
                ],
            },
        };

        const defaultIntents = {
            greeting: {
                patterns: [
                    "chào",
                    "xin chào",
                    "hi",
                    "hello",
                    "hế lô",
                    "hey",
                    "alo",
                    "kính chào",
                    "chào buổi sáng",
                    "chào buổi chiều",
                    "chào buổi tối",
                ],
                responses: [
                    "Xin chào!",
                    "Chào bạn!",
                    "Hi, bạn khỏe không?",
                    "Chào, rất vui được gặp bạn!",
                ],
            },
            farewell: {
                patterns: [
                    "tạm biệt",
                    "bye",
                    "goodbye",
                    "gặp lại sau",
                    "hẹn gặp lại",
                    "chào tạm biệt",
                    "bái bai",
                    "đi đây",
                    "đi nhé",
                    "đi nha",
                    "đi đây",
                ],
                responses: [
                    "Tạm biệt!",
                    "Bye bye!",
                    "Hẹn gặp lại bạn sau!",
                    "Chúc một ngày tốt lành!",
                ],
            },
            gratitude: {
                patterns: [
                    "cảm ơn",
                    "cám ơn",
                    "thank",
                    "thanks",
                    "thank you",
                    "thank u",
                    "thk",
                    "thx",
                    "biết ơn",
                    "đa tạ",
                    "dạ",
                    "vâng",
                    "ghi ơn",
                ],
                responses: [
                    "Không có gì!",
                    "Rất vui được giúp bạn!",
                    "Không cần cảm ơn đâu!",
                    "Đó là niềm vui của mình!",
                ],
            },
            question_what: {
                patterns: [
                    "cái gì",
                    "gì vậy",
                    "là gì",
                    "gì thế",
                    "là sao",
                    "thế nào",
                    "ra sao",
                    "như thế nào",
                    "làm sao",
                    "bằng cách nào",
                    "why",
                    "tại sao",
                    "vì sao",
                    "lý do",
                ],
            },
            question_who: {
                patterns: ["ai vậy", "ai thế", "là ai", "người nào", "ai đã", "ai sẽ"],
            },
            question_when: {
                patterns: [
                    "khi nào",
                    "lúc nào",
                    "bao giờ",
                    "mấy giờ",
                    "ngày nào",
                    "thời gian nào",
                ],
            },
            question_where: {
                patterns: [
                    "ở đâu",
                    "chỗ nào",
                    "nơi nào",
                    "đâu",
                    "địa điểm nào",
                    "vị trí nào",
                ],
            },
            question_how: {
                patterns: [
                    "bằng cách nào",
                    "làm thế nào",
                    "như thế nào",
                    "ra sao",
                    "thế nào",
                    "làm sao",
                    "làm cách nào",
                    "bằng cách gì",
                    "phương pháp nào",
                ],
            },
            agreement: {
                patterns: [
                    "đồng ý",
                    "nhất trí",
                    "ok",
                    "okay",
                    "ừ",
                    "ừm",
                    "ừa",
                    "đúng rồi",
                    "phải",
                    "chính xác",
                    "chính là",
                    "đúng vậy",
                    "đúng thế",
                    "vâng",
                    "dạ",
                    "chuẩn",
                    "chính là như vậy",
                ],
            },
            disagreement: {
                patterns: [
                    "không đồng ý",
                    "phản đối",
                    "không phải",
                    "không đúng",
                    "sai rồi",
                    "không chính xác",
                    "không phải vậy",
                    "không phải thế",
                    "không",
                    "chẳng",
                    "đếch",
                ],
            },
            help: {
                patterns: [
                    "giúp",
                    "cứu",
                    "hỗ trợ",
                    "trợ giúp",
                    "chỉ dẫn",
                    "help",
                    "cần giúp",
                    "hướng dẫn",
                    "làm ơn",
                    "xin",
                    "nhờ",
                    "phiền",
                    "vui lòng",
                ],
            },
            command: {
                patterns: [
                    "làm",
                    "thực hiện",
                    "tạo",
                    "tìm",
                    "search",
                    "kiếm",
                    "query",
                    "tính",
                    "chạy",
                    "gửi",
                    "đặt",
                    "gọi",
                    "bật",
                    "tắt",
                    "mở",
                    "dừng",
                ],
            },
            apology: {
                patterns: [
                    "xin lỗi",
                    "sorry",
                    "sr",
                    "sry",
                    "lỗi",
                    "nhầm",
                    "nhầm lẫn",
                    "nhầm lỗi",
                ],
                responses: [
                    "Không sao đâu!",
                    "Đừng lo, không có vấn đề gì!",
                    "Mọi chuyện đều ổn!",
                ],
            },
        };

        const defaultSynonyms = {
            vui_vẻ: [
                "vui",
                "vui vẻ",
                "vui tươi",
                "hạnh phúc",
                "sung sướng",
                "phấn khởi",
                "hân hoan",
            ],
            buồn_bã: [
                "buồn",
                "buồn bã",
                "u sầu",
                "đau buồn",
                "đau khổ",
                "sầu não",
                "thất vọng",
                "chán nản",
            ],
            tốt_đẹp: [
                "tốt",
                "đẹp",
                "hay",
                "tuyệt",
                "tuyệt vời",
                "xuất sắc",
                "tốt đẹp",
                "hoàn hảo",
                "tốt lành",
            ],
            tệ_hại: [
                "tệ",
                "dở",
                "xấu",
                "kém",
                "tồi",
                "tệ hại",
                "khủng khiếp",
                "thảm hại",
                "tồi tệ",
            ],
            yêu_thích: [
                "yêu",
                "thích",
                "mê",
                "khoái",
                "thương",
                "đam mê",
                "hứng thú",
                "mê mẩn",
            ],
            ghét_bỏ: [
                "ghét",
                "khinh",
                "chán ghét",
                "căm ghét",
                "ghét bỏ",
                "khinh bỉ",
                "không ưa",
            ],
            đồng_ý: [
                "đồng ý",
                "tán thành",
                "ưng thuận",
                "chấp nhận",
                "nhất trí",
                "tán đồng",
                "đồng tình",
            ],
            phản_đối: [
                "phản đối",
                "bác bỏ",
                "từ chối",
                "chống đối",
                "không đồng ý",
                "bất đồng",
                "phản bác",
            ],
            nói_chuyện: [
                "nói",
                "nói chuyện",
                "tán gẫu",
                "trò chuyện",
                "tâm sự",
                "chuyện trò",
                "đàm thoại",
                "đàm đạo",
                "thảo luận",
            ],
        };

        await fs.writeJson(path.join(dictionaryPath, "slang.json"), defaultSlang, {
            spaces: 2,
        });
        await fs.writeJson(
            path.join(dictionaryPath, "emotions.json"),
            defaultEmotions,
            { spaces: 2 }
        );
        await fs.writeJson(
            path.join(dictionaryPath, "stopwords_vi.json"),
            defaultStopwords,
            { spaces: 2 }
        );
        await fs.writeJson(
            path.join(dictionaryPath, "entities.json"),
            defaultEntities,
            { spaces: 2 }
        );
        await fs.writeJson(
            path.join(dictionaryPath, "intents.json"),
            defaultIntents,
            { spaces: 2 }
        );
        await fs.writeJson(
            path.join(dictionaryPath, "synonyms.json"),
            defaultSynonyms,
            { spaces: 2 }
        );

        console.log("Created default NLP dictionaries");
    }

    /**
     * Initialize statistical models for advanced analysis
     */
    async _initializeModels() {
        this.models.sentiment = {
            predict: (text, tokens) => this._predictSentiment(text, tokens),
        };

        this.models.intent = {
            predict: (text, tokens) => this._predictIntent(text, tokens),
        };

        this.models.entity = {
            predict: (text, tokens) => this._extractEntities(text, tokens),
        };
    }

    /**
     * Complete text analysis pipeline
     * @param {string} text - Raw user input text
     * @param {string} userId - User identifier for contextual analysis
     * @returns {Object} - Comprehensive analysis results
     */
    analyze(text, userId = null) {
        const cacheKey = `${userId || "anonymous"}_${text}`;
        if (this.cachedAnalysis.has(cacheKey)) {
            return this.cachedAnalysis.get(cacheKey);
        }

        const normalizedText = this.normalizeText(text);
        const tokens = this.tokenize(normalizedText);
        const cleanTokens = this._removeStopwords(tokens);

        const sentiment = this.analyzeSentiment(normalizedText, tokens);
        const intents = this.detectIntent(normalizedText, tokens);
        const entities = this.extractEntities(normalizedText, tokens);
        const keywords = this.extractKeywords(normalizedText, tokens, cleanTokens);
        const language = this.detectLanguage(normalizedText);
        const topics = this.detectTopics(normalizedText, cleanTokens);

        let context = null;
        if (userId) {
            context = this._getContextForUser(userId, normalizedText, {
                sentiment,
                intents,
                entities,
                topics,
            });
        }

        const result = {
            original: text,
            normalized: normalizedText,
            tokens: tokens,
            cleanTokens: cleanTokens,
            sentiment,
            intents,
            entities,
            keywords,
            language,
            topics,
            context,
        };

        this.cachedAnalysis.set(cacheKey, result);
        if (this.cachedAnalysis.size > this.maxCacheSize) {
            const firstKey = this.cachedAnalysis.keys().next().value;
            this.cachedAnalysis.delete(firstKey);
        }

        return result;
    }

    /**
     * Normalize text by correcting slang, typos, and standardizing
     * @param {string} text - Raw input text
     * @returns {string} - Normalized text
     */
    normalizeText(text) {
        if (!text) return "";

        let normalized = text
            .replace(/\.+/g, ".")
            .replace(/\?+/g, "?")
            .replace(/\!+/g, "!")
            .replace(/\s+/g, " ")
            .trim();

        const words = normalized.split(" ");
        const normalizedWords = words.map((word) => {
            const lowerWord = word.toLowerCase();
            return this.dictionaries.slang[lowerWord] || word;
        });

        normalized = normalizedWords.join(" ");

        normalized = normalized
            .replace(/([a-zA-Z])([àáảãạăắằẳẵặâấầẩẫậ])/g, "$1a")
            .replace(/([a-zA-Z])([èéẻẽẹêếềểễệ])/g, "$1e")
            .replace(/([a-zA-Z])([ìíỉĩị])/g, "$1i")
            .replace(/([a-zA-Z])([òóỏõọôốồổỗộơớờởỡợ])/g, "$1o")
            .replace(/([a-zA-Z])([ùúủũụưứừửữự])/g, "$1u")
            .replace(/([a-zA-Z])([ỳýỷỹỵ])/g, "$1y");

        return normalized;
    }

    _isCompoundWord(word) {
        // Check for Vietnamese compound words (words with spaces in them)
        const compoundPatterns = [
            /[A-Za-zÀ-ỹ]+\s+[A-Za-zÀ-ỹ]+/, // Two words together
            /^(đại|tiểu|trung|cao|siêu|cực|tổng|phó|phụ|thứ|siêu)\s+[A-Za-zÀ-ỹ]+/i, // Prefix compounds
            /[A-Za-zÀ-ỹ]+\s+(viên|gia|sĩ|sư|tướng|tá|úy|sinh|học|khoa|trình|phẩm)$/i, // Suffix compounds
        ];

        return compoundPatterns.some((pattern) => pattern.test(word));
    }
    /**
     * Tokenize text into words and punctuation
     * @param {string} text - Input text
     * @returns {Array} - Array of tokens
     */
    tokenize(text) {
        if (!text) return [];
        try {
            const segments = text.split(/\s+/);
            const tokens = text.match(/[A-Za-zÀ-ỹ]+|\d+|[^\w\s]/g) || [];
            segments.forEach((segment) => {
                // Error happens here! This function doesn't exist
                if (this._isCompoundWord(segment)) {
                    tokens.push(segment);
                } else {
                    const parts = segment.match(/[A-Za-zÀ-ỹ]+|\d+|[^\w\s]/g) || [];
                    tokens.push(...parts);
                }
            });
            return tokens.filter((token) => token.trim().length > 0);
        } catch (error) {
            console.error("Tokenization error:", error);
            return text.split(/\s+/);
        }
    }

    /**
     * Remove stopwords from token list
     * @param {Array} tokens - List of tokens
     * @returns {Array} - Filtered tokens
     */
    _removeStopwords(tokens) {
        if (!tokens || !tokens.length) return [];

        return tokens.filter((token) => {
            const lowerToken = token.toLowerCase();
            return (
                !this.dictionaries.stopwords.has(lowerToken) && lowerToken.length > 1
            );
        });
    }

    /**
     * Analyze text sentiment with intensity scores and emotion detection
     * @param {string} text - Input text
     * @param {Array} tokens - Tokenized text
     * @returns {Object} - Sentiment analysis results
     */
    analyzeSentiment(text, tokens = null) {
        if (!text)
            return { score: 0, sentiment: "neutral", confidence: 0, emotions: [] };

        if (!tokens) {
            tokens = this.tokenize(text);
        }

        const result = this._predictSentiment(text, tokens);

        if (result.emotions.length > 0) {
            result.primaryEmotion = result.emotions[0].emotion;
        } else {
            result.primaryEmotion = result.sentiment;
        }

        return result;
    }

    /**
     * Implementation of sentiment prediction
     * @private
     */
    _predictSentiment(text, tokens) {
        const emotions = this.dictionaries.emotions || {};
        const negations = new Set(emotions.negations || []);
        const intensifiers = emotions.intensifiers || {};
        if (!emotions.positive) emotions.positive = [];
        if (!emotions.negative) emotions.negative = [];
        if (!emotions.neutral) emotions.neutral = [];

        let score = 0;
        let negationActive = false;
        let intensifierFactor = 1;
        const detectedEmotions = new Map();

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].toLowerCase();

            if (negations.has(token)) {
                negationActive = true;
                continue;
            }

            if (intensifiers[token]) {
                intensifierFactor = intensifiers[token];
                continue;
            }

            if (emotions.positive.includes(token)) {
                const emotionValue = negationActive ? -1 : 1;
                score += emotionValue * intensifierFactor;

                const emotionType = negationActive ? "negative" : "positive";
                const emotionCount = detectedEmotions.get(token) || 0;
                detectedEmotions.set(token, emotionCount + 1);

                negationActive = false;
                intensifierFactor = 1;
                continue;
            }

            if (emotions.negative.includes(token)) {
                const emotionValue = negationActive ? 1 : -1;
                score += emotionValue * intensifierFactor;

                const emotionType = negationActive ? "positive" : "negative";
                const emotionCount = detectedEmotions.get(token) || 0;
                detectedEmotions.set(token, emotionCount + 1);

                negationActive = false;
                intensifierFactor = 1;
                continue;
            }

            if (emotions.neutral.includes(token)) {
                score += 0.1 * intensifierFactor;

                const emotionCount = detectedEmotions.get(token) || 0;
                detectedEmotions.set(token, emotionCount + 1);

                negationActive = false;
                intensifierFactor = 1;
            }

            if (token === "!" && i > 0) {
                score = score * 1.2;
            }
        }

        const emotionDistribution = [];
        detectedEmotions.forEach((count, emotion) => {
            emotionDistribution.push({
                emotion,
                count,
                intensity:
                    count *
                    (emotions.positive.includes(emotion) ||
                        emotions.negative.includes(emotion)
                        ? 1
                        : 0.5),
            });
        });

        emotionDistribution.sort((a, b) => b.intensity - a.intensity);

        let adjustedScore = this._adjustSentimentWithContext(score, text);

        adjustedScore = Math.max(-1, Math.min(1, adjustedScore));

        let sentiment = "neutral";
        let confidence = 0.5;

        if (adjustedScore > 0.2) {
            sentiment = "positive";
            confidence = 0.5 + adjustedScore * 0.5;
        } else if (adjustedScore < -0.2) {
            sentiment = "negative";
            confidence = 0.5 + Math.abs(adjustedScore) * 0.5;
        }

        return {
            score: adjustedScore,
            rawScore: score,
            sentiment,
            confidence,
            emotions: emotionDistribution,
            negationCount: text
                .split(" ")
                .filter((word) => negations.has(word.toLowerCase())).length,
            intensityFactors: Object.entries(intensifiers).filter(([word]) =>
                text.toLowerCase().includes(word)
            ),
        };
    }

    /**
     * Adjust sentiment score using contextual analysis
     * @private
     */
    _adjustSentimentWithContext(score, text) {
        const sarcasmIndicators = [
            { pattern: /\b(ừ|uh|thế|vậy|okay).+(nhỉ|sao|à)\b/i, weight: 0.7 },
            { pattern: /".*?"/g, weight: 0.5 },
            { pattern: /\b(hay|tuyệt|giỏi).+(thật|thế|quá)\b/i, weight: 0.6 },
            { pattern: /\b(chắc|có lẽ|hẳn là).+(lắm|rồi)\b/i, weight: 0.5 },
        ];

        let sarcasmScore = 0;
        sarcasmIndicators.forEach(({ pattern, weight }) => {
            if (pattern.test(text)) {
                sarcasmScore += weight;
            }
        });

        if (sarcasmScore > 0.8) {
            score = -score;
        } else if (sarcasmScore > 0.4) {
            score = score * (1 - sarcasmScore / 2);
        }
        const emphasisPatterns = [
            { pattern: /!!+/g, factor: 1.5 },
            { pattern: /quá|lắm|cực kỳ|vô cùng/gi, factor: 1.3 },
            { pattern: /rất|thật|thực sự/gi, factor: 1.2 },
        ];
        let emphasisFactor = 1.0;
        emphasisPatterns.forEach(({ pattern, factor }) => {
            if (pattern.test(text)) {
                emphasisFactor *= factor;
            }
        });

        const documentLevelModifiers = {
            overallPositivity:
                text
                    .split(/[.!?]/)
                    .filter((sentence) =>
                        /\b(tuyệt vời|tốt|hay|thích|yêu|hạnh phúc)\b/i.test(sentence)
                    ).length / Math.max(1, text.split(/[.!?]/).length),

            overallNegativity:
                text
                    .split(/[.!?]/)
                    .filter((sentence) =>
                        /\b(buồn|tệ|xấu|ghét|khó chịu|chán|thất vọng)\b/i.test(sentence)
                    ).length / Math.max(1, text.split(/[.!?]/).length),

            contrastIndicators: (
                text.match(/\b(nhưng|tuy nhiên|mặc dù|tuy|dù|thế nhưng)\b/gi) || []
            ).length,
        };

        if (documentLevelModifiers.overallPositivity > 0.5) {
            score = Math.min(1, score + 0.2);
        }

        if (documentLevelModifiers.overallNegativity > 0.5) {
            score = Math.max(-1, score - 0.2);
        }

        if (documentLevelModifiers.contrastIndicators > 0) {
            const parts = text.split(/\b(nhưng|tuy nhiên|thế nhưng)\b/i);
            if (parts.length > 1) {
                const afterContrast = parts[parts.length - 1];
                const afterContrastSentiment =
                    this._getTextSentimentValue(afterContrast);

                score = score * 0.3 + afterContrastSentiment * 0.7;
            }
        }
        score *= emphasisFactor;
        return score;
    }

    /**
     * Calculate basic sentiment value for a piece of text
     * @private
     */
    _getTextSentimentValue(text) {
        const tokens = this.tokenize(text);
        const emotions = this.dictionaries.emotions;

        let score = 0;
        for (const token of tokens) {
            const lowerToken = token.toLowerCase();
            if (emotions.positive.includes(lowerToken)) {
                score += 1;
            } else if (emotions.negative.includes(lowerToken)) {
                score -= 1;
            }
        }

        return Math.max(-1, Math.min(1, score / Math.max(1, tokens.length)));
    }

    /**
     * Detect intent from text with advanced contextual understanding
     * @param {string} text - Input text
     * @param {Array} tokens - Tokenized text (optional)
     * @returns {Object} - Intent analysis
     */
    detectIntent(text, tokens = null) {
        if (!text) return { intents: [], confidence: 0, queryType: null };

        if (!tokens) {
            tokens = this.tokenize(text);
        }

        return this._predictIntent(text, tokens);
    }

    /**
     * Implementation of intent prediction with hierarchical classification
     * @private
     */
    _predictIntent(text, tokens) {
        const lowerText = text.toLowerCase();
        const intents = this.dictionaries.intents;
        const detectedIntents = [];
        const confidences = {};
        let primaryIntent = null;
        let highestConfidence = 0;

        const isQuestion =
            /\?$/.test(text) ||
            /\b(ai|cái gì|ở đâu|khi nào|bao giờ|như thế nào|tại sao|vì sao|bằng cách nào)\b/i.test(
                lowerText
            );

        const isCommand =
            /\b(hãy|làm ơn|vui lòng|giúp|xin|nhờ|please)\b/i.test(lowerText) ||
            /^(tìm|cho|gửi|đặt|bật|tắt|mở)/i.test(lowerText);

        let queryType = null;
        if (isQuestion) {
            if (/\b(ai|người nào|ai đã|ai sẽ)\b/i.test(lowerText)) {
                queryType = "who";
            } else if (/\b(ở đâu|chỗ nào|nơi nào|đâu)\b/i.test(lowerText)) {
                queryType = "where";
            } else if (
                /\b(khi nào|lúc nào|bao giờ|mấy giờ|ngày nào)\b/i.test(lowerText)
            ) {
                queryType = "when";
            } else if (
                /\b(bằng cách nào|làm thế nào|như thế nào|làm sao)\b/i.test(lowerText)
            ) {
                queryType = "how";
            } else if (/\b(tại sao|vì sao|lý do|why)\b/i.test(lowerText)) {
                queryType = "why";
            } else if (/\b(cái gì|gì|là gì|là sao)\b/i.test(lowerText)) {
                queryType = "what";
            } else {
                queryType = "general";
            }
        }

        for (const [intentName, intentData] of Object.entries(intents)) {
            if (!intentData.patterns) continue;

            const matches = intentData.patterns.filter((pattern) =>
                lowerText.includes(pattern.toLowerCase())
            );

            if (matches.length > 0) {
                const confidence = Math.min(
                    1,
                    (matches.length / Math.sqrt(tokens.length)) *
                    (matches.reduce((sum, match) => sum + match.length, 0) /
                        text.length)
                );

                detectedIntents.push(intentName);
                confidences[intentName] = confidence;

                if (confidence > highestConfidence) {
                    highestConfidence = confidence;
                    primaryIntent = intentName;
                }
            }
        }

        this._refineIntentWithContext(
            detectedIntents,
            confidences,
            text,
            isQuestion,
            isCommand
        );

        if (detectedIntents.includes("greeting") && isQuestion) {
            if (
                detectedIntents.includes("question_what") ||
                detectedIntents.includes("question_how")
            ) {
                confidences["greeting"] *= 0.5;
            }
        }

        const rankedIntents = detectedIntents
            .map((intent) => ({ intent, confidence: confidences[intent] || 0 }))
            .sort((a, b) => b.confidence - a.confidence);

        primaryIntent = rankedIntents.length > 0 ? rankedIntents[0].intent : null;
        highestConfidence =
            rankedIntents.length > 0 ? rankedIntents[0].confidence : 0;

        return {
            intents: rankedIntents,
            primaryIntent,
            confidence: highestConfidence,
            isQuestion,
            isCommand,
            queryType,
        };
    }

    /**
     * Refine intent detection with contextual understanding
     * @private
     */
    _refineIntentWithContext(
        detectedIntents,
        confidences,
        text,
        isQuestion,
        isCommand
    ) {
        if (/\b(xin lỗi|sorry|my bad|lỗi|nhầm)\b/i.test(text)) {
            if (!detectedIntents.includes("apology")) {
                detectedIntents.push("apology");
                confidences["apology"] = 0.8;
            }
        }

        if (
            /\b(nghĩa là gì|ý là gì|ý là sao|ý|điều đó có nghĩa|làm rõ)\b/i.test(text)
        ) {
            if (!detectedIntents.includes("clarification")) {
                detectedIntents.push("clarification");
                confidences["clarification"] = 0.7;
            }
        }

        if (
            /\b(ừm|ừ|uhm|vâng|rồi|được|okay|tiếp|và|sau đó)\b/i.test(text) &&
            text.length < 15
        ) {
            if (!detectedIntents.includes("continuation")) {
                detectedIntents.push("continuation");
                confidences["continuation"] = 0.6;
            }
        }

        if (
            /\b(đùa|vui|cười|joke|hài hước|haha|hihi|kể chuyện cười|vui vẻ)\b/i.test(
                text
            )
        ) {
            if (!detectedIntents.includes("humor")) {
                detectedIntents.push("humor");
                confidences["humor"] = 0.7;
            }
        }

        if (/\b(ví dụ|minh họa|mẫu|cho xem|example)\b/i.test(text)) {
            if (!detectedIntents.includes("example_request")) {
                detectedIntents.push("example_request");
                confidences["example_request"] = 0.8;
            }
        }

        if (
            /\b(nghĩ|suy nghĩ|ý kiến|cảm nghĩ|đánh giá|nhận xét)\b.*\?/i.test(text)
        ) {
            if (!detectedIntents.includes("opinion_request")) {
                detectedIntents.push("opinion_request");
                confidences["opinion_request"] = 0.9;
            }
        }

        if (
            /\b(bạn|mày|cậu|em|anh)\b.*\b(là ai|bao nhiêu tuổi|sống ở đâu|thích gì|có)\b/i.test(
                text
            )
        ) {
            if (!detectedIntents.includes("personal_question")) {
                detectedIntents.push("personal_question");
                confidences["personal_question"] = 0.85;
            }
        }

        if (detectedIntents.includes("greeting") && isCommand) {
            if (/^(xin chào|chào|hello|hi)\b/i.test(text)) {
                confidences["greeting"] *= 0.7;
            }
        }

        if (
            text.length > 100 &&
            /\b(hôm|ngày|lúc|khi)\b.*\b(thì|xong|sau đó|cuối cùng)\b/i.test(text)
        ) {
            detectedIntents.push("storytelling");
            confidences["storytelling"] = 0.75;
        }
    }

    /**
     * Extract named entities from text with improved accuracy and context awareness
     * @param {string} text - Input text
     * @param {Array} tokens - Tokenized text (optional)
     * @returns {Object} - Extracted entities by category
     */
    extractEntities(text, tokens = null) {
        if (!text) return {};

        if (!tokens) {
            tokens = this.tokenize(text);
        }

        return this._extractEntities(text, tokens);
    }

    /**
     * Implementation of entity extraction with contextual understanding
     * @private
     */
    _extractEntities(text, tokens) {
        const entities = this.dictionaries.entities;
        const extracted = {};

        for (const [entityType, entityData] of Object.entries(entities)) {
            extracted[entityType] = [];

            if (entityData.patterns) {
                entityData.patterns.forEach((pattern) => {
                    const regex = new RegExp(pattern, "gi");
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        if (
                            this._validateEntityMatch(match[0], entityType, text, match.index)
                        ) {
                            extracted[entityType].push({
                                value: match[0],
                                index: match.index,
                                confidence: 0.9,
                                normalized: this._normalizeEntity(match[0], entityType),
                            });
                        }
                    }
                });
            }

            if (entityData.keywords) {
                const words = text.split(" ");
                for (let i = 0; i < words.length; i++) {
                    if (entityData.keywords.includes(words[i].toLowerCase())) {
                        const entity = this._extractEntityFromKeywordContext(
                            words,
                            i,
                            entityType
                        );
                        if (entity) {
                            extracted[entityType].push({
                                value: entity.value,
                                index: text.indexOf(entity.value),
                                confidence: entity.confidence,
                                normalized: this._normalizeEntity(entity.value, entityType),
                            });
                        }
                    }
                }
            }

            if (entityType === "person" && entityData.prefixes) {
                const prefixPattern = new RegExp(
                    `\\b(${entityData.prefixes.join(
                        "|"
                    )})\\s+([A-ZÁÀẠÃẢẮẰẲẴẶÂẤẦẨẪẬĐÉÈẸẺẼÊẾỀỂỄỆÍÌỊỈĨÓÒỌỎÕÔỐỒỔỖỘƠỚỜỞỠỢÚÙỤỦŨƯỨỪỬỮỰÝỲỴỶỸ][a-záàạãảắằẳẵặâấầẩẫậđéèẹẻẽêếềểễệíìịỉĩóòọỏõôốồổỗộơớờởỡợúùụủũưứừửữựýỳỵỷỹ]+(?:\\s+[A-ZÁÀẠÃẢẮẰẲẴẶÂẤẦẨẪẬĐÉÈẸẺẼÊẾỀỂỄỆÍÌỊỈĨÓÒỌỎÕÔỐỒỔỖỘƠỚỜỞỠỢÚÙỤỦŨƯỨỪỬỮỰÝỲỴỶỸ][a-záàạãảắằẳẵặâấầẩẫậđéèẹẻẽêếềểễệíìịỉĩóòọỏõôốồổỗộơớờởỡợúùụủũưứừửữựýỳỵỷỹ]*)*)`,
                    "gi"
                );

                let match;
                while ((match = prefixPattern.exec(text)) !== null) {
                    const prefix = match[1];
                    const name = match[2];

                    extracted.person.push({
                        value: name,
                        prefix: prefix,
                        index: match.index + prefix.length + 1,
                        confidence: 0.85,
                        normalized: name,
                    });
                }
            }
        }

        this._resolveEntityConflicts(extracted);

        Object.keys(extracted).forEach((key) => {
            if (extracted[key].length === 0) {
                delete extracted[key];
            }
        });

        return extracted;
    }

    /**
     * Validate entity match based on context
     * @private
     */
    _validateEntityMatch(match, entityType, text, index) {
        switch (entityType) {
            case "phone":
                return (
                    !/\d/.test(text.charAt(index - 1) || " ") &&
                    !/\d/.test(text.charAt(index + match.length) || " ")
                );

            case "date":
                if (match.includes("/")) {
                    const parts = match.split("/");
                    if (parts.length !== 3) return false;

                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const year = parseInt(parts[2]);

                    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 0;
                }
                return true;

            case "email":
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(match);

            default:
                return true;
        }
    }

    /**
     * Extract entity based on keyword context
     * @private
     */
    _extractEntityFromKeywordContext(words, keywordIndex, entityType) {
        switch (entityType) {
            case "location":
                if (keywordIndex < words.length - 1) {
                    let locationPhrase = "";
                    for (
                        let i = keywordIndex + 1;
                        i < Math.min(words.length, keywordIndex + 5);
                        i++
                    ) {
                        if (/[.,!?;]$/.test(words[i])) {
                            locationPhrase += words[i].replace(/[.,!?;]$/, "");
                            break;
                        }
                        locationPhrase += words[i] + " ";
                    }
                    locationPhrase = locationPhrase.trim();

                    if (locationPhrase) {
                        return {
                            value: locationPhrase,
                            confidence: 0.75,
                        };
                    }
                }
                break;
        }

        return null;
    }

    /**
     * Normalize extracted entity values
     * @private
     */
    _normalizeEntity(value, entityType) {
        switch (entityType) {
            case "date":
                try {
                    if (value.includes("/")) {
                        const parts = value.split("/");
                        if (parts.length === 3) {
                            const day = parseInt(parts[0].trim());
                            const month = parseInt(parts[1].trim());
                            const year = parseInt(parts[2].trim());
                            const date = new Date(year, month - 1, day);
                            return date.toISOString().split("T")[0];
                        }
                    }
                } catch (e) { }
                return value;

            case "money":
                const numericValue = value.replace(/[^\d]/g, "");
                if (value.includes("k")) return `${numericValue}000 VND`;
                if (value.includes("triệu")) return `${numericValue}000000 VND`;
                if (value.includes("tỷ")) return `${numericValue}000000000 VND`;
                if (value.includes("xu")) return `${numericValue} Xu`;
                return value;

            default:
                return value;
        }
    }

    /**
     * Resolve conflicts between extracted entities
     * @private
     */
    _resolveEntityConflicts(entities) {
        const allEntities = [];
        Object.entries(entities).forEach(([type, values]) => {
            values.forEach((entity) => {
                allEntities.push({
                    type,
                    entity,
                    start: entity.index,
                    end: entity.index + entity.value.length,
                });
            });
        });

        allEntities.sort((a, b) => {
            if (a.entity.confidence !== b.entity.confidence) {
                return b.entity.confidence - a.entity.confidence;
            }
            return b.end - b.start - (a.end - a.start);
        });

        const claimed = new Set();
        const validEntities = [];

        for (const item of allEntities) {
            let overlaps = false;
            for (let pos = item.start; pos < item.end; pos++) {
                if (claimed.has(pos)) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                validEntities.push(item);

                for (let pos = item.start; pos < item.end; pos++) {
                    claimed.add(pos);
                }
            }
        }

        Object.keys(entities).forEach((type) => {
            entities[type] = [];
        });

        validEntities.forEach((item) => {
            entities[item.type].push(item.entity);
        });
    }

    /**
     * Extract keywords from text
     * @param {string} text - Input text
     * @param {Array} tokens - Tokenized text (optional)
     * @param {Array} cleanTokens - Tokens with stopwords removed (optional)
     * @returns {Array} - Keywords with relevance scores
     */
    extractKeywords(text, tokens = null, cleanTokens = null) {
        if (!text) return [];

        if (!tokens) {
            tokens = this.tokenize(text);
        }

        if (!cleanTokens) {
            cleanTokens = this._removeStopwords(tokens);
        }

        const wordFreq = new Map();
        cleanTokens.forEach((token) => {
            const normalizedToken = token.toLowerCase();
            wordFreq.set(normalizedToken, (wordFreq.get(normalizedToken) || 0) + 1);
        });

        const weightedTerms = Array.from(wordFreq.entries()).map(([term, freq]) => {
            let score = freq;

            const lengthFactor =
                Math.min(1, term.length / 10) * (term.length > 3 ? 1.2 : 0.8);
            score *= lengthFactor;

            const firstPosition = text.toLowerCase().indexOf(term);
            const positionFactor =
                firstPosition < text.length * 0.2 || firstPosition > text.length * 0.8
                    ? 1.2
                    : 1;
            score *= positionFactor;

            const properNounIndicator = tokens.some(
                (t) =>
                    t.toLowerCase() === term &&
                    /^[A-ZÁÀẠÃẢẮẰẲẴẶÂẤẦẨẪẬĐÉÈẸẺẼÊẾỀỂỄỆÍÌỊỈĨÓÒỌỎÕÔỐỒỔỖỘƠỚỜỞỠỢÚÙỤỦŨƯỨỪỬỮỰÝỲỴỶỸ]/.test(
                        t
                    ) &&
                    tokens.indexOf(t) > 0 &&
                    !/[.!?]$/.test(tokens[tokens.indexOf(t) - 1])
            );

            if (properNounIndicator) {
                score *= 1.5;
            }

            const appearsInHeading = text
                .split(/[.!?]\s+/)
                .some(
                    (sentence) =>
                        sentence.length < 40 && sentence.toLowerCase().includes(term)
                );

            if (appearsInHeading) {
                score *= 1.3;
            }

            return { term, score, frequency: freq };
        });

        const bigramFreq = new Map();
        for (let i = 0; i < cleanTokens.length - 1; i++) {
            const bigram = `${cleanTokens[i].toLowerCase()} ${cleanTokens[
                i + 1
            ].toLowerCase()}`;
            bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
        }

        const significantBigrams = Array.from(bigramFreq.entries())
            .filter(([_, freq]) => freq > 1)
            .map(([bigram, freq]) => {
                const [w1, w2] = bigram.split(" ");
                const pBigram = freq / (cleanTokens.length - 1);
                const pW1 = (wordFreq.get(w1) || 0) / cleanTokens.length;
                const pW2 = (wordFreq.get(w2) || 0) / cleanTokens.length;

                const mutualInfo = pW1 && pW2 ? Math.log2(pBigram / (pW1 * pW2)) : 0;

                return {
                    term: bigram,
                    score: freq * (mutualInfo > 0 ? mutualInfo : 1),
                    frequency: freq,
                    isBigram: true,
                };
            });

        const allTerms = [...weightedTerms, ...significantBigrams]
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        return allTerms;
    }

    /**
     * Detect language of text
     * @param {string} text - Input text
     * @returns {string} - Detected language code
     */
    detectLanguage(text) {
        if (!text) return "unknown";

        const viIndicators =
            /[àáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìịỉĩóòọỏõôốồổỗộơớờởỡợúùụủũưứừửữựýỳỵỷỹ]|(\b(là|không|của|và|các|một|những|trong|có|cho|đến|với|mình|tôi)\b)/gi;

        const enIndicators =
            /\b(the|is|are|and|to|of|for|in|on|at|with|by|from|but|not|that|this|you|have|what|when|how)\b/gi;

        const viMatches = (text.match(viIndicators) || []).length;
        const enMatches = (text.match(enIndicators) || []).length;

        const textLength = text.split(/\s+/).length;
        const viScore = viMatches / textLength;
        const enScore = enMatches / textLength;

        if (viScore > 0.15) return "vi";
        if (enScore > 0.15) return "en";

        return "vi";
    }

    /**
     * Detect main topics in text
     * @param {string} text - Input text
     * @param {Array} cleanTokens - Tokens with stopwords removed (optional)
     * @returns {Array} - Detected topics
     */
    detectTopics(text, cleanTokens = null) {
        if (!text) return [];

        if (!cleanTokens) {
            const tokens = this.tokenize(text);
            cleanTokens = this._removeStopwords(tokens);
        }

        const keywords = this.extractKeywords(text, null, cleanTokens)
            .filter((k) => k.score > 1.5)
            .map((k) => k.term);

        const topicMapping = {
            personal: [
                "tôi",
                "mình",
                "tao",
                "tớ",
                "tui",
                "bản thân",
                "sở thích",
                "thích",
                "ghét",
            ],
            technology: [
                "điện thoại",
                "máy tính",
                "internet",
                "công nghệ",
                "phần mềm",
                "ứng dụng",
                "web",
                "thiết bị",
            ],
            education: [
                "học",
                "trường",
                "lớp",
                "đại học",
                "giáo dục",
                "kiến thức",
                "bài tập",
                "giảng viên",
            ],
            entertainment: [
                "phim",
                "nhạc",
                "game",
                "giải trí",
                "chơi",
                "xem",
                "nghệ thuật",
                "ca sĩ",
            ],
            food: [
                "ăn",
                "uống",
                "món",
                "đồ ăn",
                "nhà hàng",
                "quán",
                "nấu",
                "thức ăn",
                "đồ uống",
            ],
            health: [
                "sức khỏe",
                "bệnh",
                "tập",
                "gym",
                "khám",
                "bác sĩ",
                "thuốc",
                "thể thao",
            ],
            work: [
                "công việc",
                "làm",
                "nghề",
                "công ty",
                "lương",
                "sự nghiệp",
                "kinh doanh",
                "khởi nghiệp",
            ],
            relationship: [
                "yêu",
                "tình cảm",
                "bạn bè",
                "gia đình",
                "người yêu",
                "kết hôn",
                "chia tay",
                "hẹn hò",
            ],
        };

        const topicScores = {};

        for (const [topic, relatedTerms] of Object.entries(topicMapping)) {
            let score = 0;

            for (const keyword of keywords) {
                if (relatedTerms.includes(keyword)) {
                    score += 2;
                    continue;
                }

                for (const term of relatedTerms) {
                    if (keyword.includes(term) || term.includes(keyword)) {
                        score += 1;
                        break;
                    }
                }
            }

            if (score > 0) {
                topicScores[topic] = score;
            }
        }

        return Object.entries(topicScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);
    }

    /**
     * Get contextual information for a user
     * @private
     */
    _getContextForUser(userId, text, analysisResults) {
        if (!this.userLanguagePatterns.has(userId)) {
            this.userLanguagePatterns.set(userId, {
                slang: new Set(),
                formality: 0.5,
                sentimentBias: 0,
                topics: new Map(),
                entities: new Map(),
            });
        }

        const userPattern = this.userLanguagePatterns.get(userId);

        if (!this.conversationContext.has(userId)) {
            this.conversationContext.set(userId, {
                history: [],
                lastTopics: [],
                recentEntities: new Set(),
                sentiment: "neutral",
            });
        }

        const context = this.conversationContext.get(userId);

        if (analysisResults.sentiment) {
            userPattern.sentimentBias =
                userPattern.sentimentBias * 0.9 + analysisResults.sentiment.score * 0.1;
        }

        const formalIndicators = /\b(vâng|dạ|thưa|kính|xin|làm ơn|vui lòng)\b/gi;
        const informalIndicators = /\b(ừ|uh|ok|chắc|đm|vcl|đéo|địt|đcm)\b/gi;

        const formalCount = (text.match(formalIndicators) || []).length;
        const informalCount = (text.match(informalIndicators) || []).length;

        if (formalCount > informalCount) {
            userPattern.formality = Math.min(1, userPattern.formality + 0.05);
        } else if (informalCount > formalCount) {
            userPattern.formality = Math.max(0, userPattern.formality - 0.05);
        }

        if (analysisResults.topics) {
            analysisResults.topics.forEach((topic) => {
                userPattern.topics.set(topic, (userPattern.topics.get(topic) || 0) + 1);
            });
        }

        if (analysisResults.entities) {
            Object.keys(analysisResults.entities).forEach((entityType) => {
                if (!userPattern.entities.has(entityType)) {
                    userPattern.entities.set(entityType, new Set());
                }

                analysisResults.entities[entityType].forEach((entity) => {
                    userPattern.entities.get(entityType).add(entity.value);
                    context.recentEntities.add(entity.value);
                });
            });
        }

        context.history.unshift({
            text,
            timestamp: Date.now(),
            sentiment: analysisResults.sentiment?.sentiment || "neutral",
            topics: analysisResults.topics || [],
        });

        if (context.history.length > 10) {
            context.history = context.history.slice(0, 10);
        }

        context.lastTopics = [
            ...new Set([...(analysisResults.topics || []), ...context.lastTopics]),
        ].slice(0, 5);

        context.sentiment =
            analysisResults.sentiment?.sentiment || context.sentiment;

        return {
            userPattern,
            conversationContext: context,
        };
    }
}
module.exports = new AdvancedNLP();
